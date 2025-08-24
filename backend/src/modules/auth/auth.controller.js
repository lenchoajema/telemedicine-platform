import User from './user.model.js';
import UserProfile from '../../models/UserProfile.js';
import jwt from 'jsonwebtoken';
import NotificationService from '../../services/NotificationService.js';
import AuditService from '../../services/AuditService.js';
import { inc } from '../../services/metrics.service.js';

// Helper to generate a username when missing and ensure uniqueness
async function generateUniqueUsername(base) {
  const safeBase = (base || 'user').toLowerCase().replace(/[^a-z0-9._-]/g, '');
  let candidate = safeBase || `user${Date.now()}`;
  let suffix = 0;
  // Try base, then base1, base2, ... until unique
  // Limit attempts to avoid infinite loop
  for (let i = 0; i < 1000; i++) {
    const exists = await User.findOne({ username: candidate }).select('_id');
    if (!exists) return candidate;
    suffix += 1;
    candidate = `${safeBase}${suffix}`;
  }
  // Fallback
  return `user${Date.now()}`;
}

export const register = async (req, res) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').toLowerCase();
    if (!email || !body.password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Normalize and validate role to include pharmacist and labratorist (alias to laboratory)
    const normalizeRole = (r) => {
      const x = String(r || '').toLowerCase();
      if (['lab', 'labratorist', 'laboratorist'].includes(x)) return 'laboratory';
      if (['pharmacist', 'pharmacy'].includes(x)) return 'pharmacist';
      if (['physician'].includes(x)) return 'doctor';
      if (['administrator'].includes(x)) return 'admin';
      if (['patient','doctor','admin','laboratory'].includes(x)) return x;
      return 'patient';
    };
    const allowedRoles = ['patient','doctor','admin','pharmacist','laboratory'];
    const role = normalizeRole(body.role || 'patient');
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Derive a base username if not provided
    let username = body.username;
    if (!username || typeof username !== 'string' || username.trim() === '') {
      const first = body.profile?.firstName || '';
      const last = body.profile?.lastName || '';
      const fromName = [first, last].filter(Boolean).join('.') || '';
      const fromEmail = email.split('@')[0];
      const base = (fromName || fromEmail || '').toLowerCase();
      username = await generateUniqueUsername(base);
    }

    // Basic profile sanitization
    const rawProfile = body.profile || {};
    const profilePayload = {
      firstName: (rawProfile.firstName || '').trim() || undefined,
      lastName: (rawProfile.lastName || '').trim() || undefined,
      phone: (rawProfile.phone || '').trim() || undefined,
      dateOfBirth: rawProfile.dateOfBirth || undefined,
      gender: rawProfile.gender || undefined,
      address: rawProfile.address || undefined,
      city: rawProfile.city || undefined,
      state: rawProfile.state || undefined,
      zipCode: rawProfile.zipCode || undefined,
  region: rawProfile.region || undefined,
  weightKg: rawProfile.weightKg || undefined,
  heightCm: rawProfile.heightCm || undefined,
  bloodType: rawProfile.bloodType || undefined,
      emergencyContact: rawProfile.emergencyContact || undefined,
      emergencyPhone: rawProfile.emergencyPhone || undefined,
    };

    const payload = { username, email, password: body.password, role, profile: profilePayload, isVerified: !!body.isVerified };

  const user = await User.create(payload);
  // Create external UserProfile (v2) document (ignore errors silently to not block registration)
  try {
    const up = {
      userId: user._id,
      firstName: profilePayload.firstName,
      lastName: profilePayload.lastName,
      phone: profilePayload.phone,
      dateOfBirth: profilePayload.dateOfBirth,
      gender: profilePayload.gender,
      addressLine1: rawProfile.addressLine1 || rawProfile.address || undefined,
      addressLine2: rawProfile.addressLine2 || undefined,
      city: profilePayload.city,
      state: profilePayload.state,
      postalCode: rawProfile.postalCode || profilePayload.zipCode,
  country: rawProfile.country,
  region: profilePayload.region,
      emergencyContactName: profilePayload.emergencyContact,
      emergencyContactPhone: profilePayload.emergencyPhone,
      primaryDoctorId: rawProfile.primaryDoctorId || null,
  weightKg: profilePayload.weightKg,
  heightCm: profilePayload.heightCm,
  bloodType: profilePayload.bloodType,
    };
    await UserProfile.create(up);
  } catch (e) { console.log('Non-fatal: failed to create UserProfile v2', e?.message); }
  try { inc('user_register_total'); inc(`user_register_role_${role}_total`); } catch { /* noop */ }
  const token = generateToken(user);
  // Fetch created profile document (may fail then omitted)
  let userProfileDoc = null; try { userProfileDoc = await UserProfile.findOne({ userId: user._id }).lean(); } catch { /* ignore profile fetch error */ }
  res.status(201).json({ success: true, data: { user: safeUser(user), userProfile: userProfileDoc, token } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  // Debug incoming request
  console.log('Login request:', req.body);
  let { email, password } = req.body;
  // Validate input
    if (!email || !password) {
      console.log('Login validation failed - missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  // Normalize email for lookup
  email = email.toLowerCase();
  console.log('Normalized email:', email);
  try {
    // Find user and include password for comparison
    console.log('Finding user for login...');
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('Login failed - user not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    console.log('User found:', { id: user._id.toString(), role: user.role });
    // Compare password
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      console.log('Login failed - incorrect password');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = generateToken(user);
    console.log('Login successful, token generated');
  // Metrics, notification and audit log
  try { inc('user_login_total'); inc(`user_login_role_${user.role}_total`); } catch { /* noop */ }
    await NotificationService.dispatchEvent('user_login', `User ${user.email} logged in at ${new Date().toISOString()}`);
    await AuditService.log(user._id, user.role, 'user_login', 'user', user._id, { ipAddress: req.ip }, null, req);
  let userProfileDoc = null; try { userProfileDoc = await UserProfile.findOne({ userId: user._id }).lean(); } catch { /* ignore profile fetch error */ }
  return res.json({ success: true, data: { user: safeUser(user), userProfile: userProfileDoc, token } });
  } catch (err) {
    console.log('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', details: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // Return user in expected format for AuthContext
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
// @desc    Logout user, dispatch notification and audit log
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const user = req.user;
    await NotificationService.dispatchEvent('user_logout', `User ${user.email} logged out at ${new Date().toISOString()}`);
    await AuditService.log(user._id, user.role, 'user_logout', 'user', user._id, { ipAddress: req.ip }, null, req);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.log('Logout error:', err);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// Helpers
const generateToken = (user) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  } catch (error) {
    console.log('Token generation error:', error);
    throw error;
  }
};

const safeUser = (user) => {
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

// Registration dropdown / enumeration options (cached static for now)
export const registrationOptions = async (_req, res) => {
  res.json({
    success: true,
    data: {
      genders: ['Male','Female','Other','PreferNot'],
      countries: [
        // Focus Africa first
        'ET','NG','KE','UG','TZ','GH','ZA','CM','CI','SN','DZ','MA','TN','EG','RW','ZM','ZW','BW','NA','MW','MZ','LS','SL','LR','GM','BI','SO','SD','SS','CF','GA','GQ','CG','CD','BJ','TG','NE','ML','BF','GN','GW','MR','MG','CM','ER',
        // Common external
        'US','GB','CA','IN'
      ],
      // Example regions (provinces/states) for selected African countries
      regions: {
        ET: ['Addis Ababa','Amhara','Oromia','Tigray','SNNPR','Afar','Somali','Benishangul-Gumuz','Gambela','Harari','Sidama'],
        NG: ['Lagos','Abuja FCT','Rivers','Kano','Kaduna','Oyo','Anambra','Enugu','Edo','Delta'],
        KE: ['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Kiambu','Machakos'],
        GH: ['Greater Accra','Ashanti','Northern','Western','Eastern','Central','Volta'],
        ZA: ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','Free State','North West','Northern Cape']
      },
      usStates: ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'],
      phoneCountryCodes: ['+1','+44','+49','+33','+91','+251'],
      twoFactorTypes: ['App','SMS','Email'],
      bloodTypes: ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
    }
  });
};
