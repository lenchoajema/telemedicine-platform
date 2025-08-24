import Doctor from '../doctors/doctor.model.js';
import User from '../auth/user.model.js';
import Pharmacy from '../erx/pharmacy.model.js';
import Laboratory from '../labs/laboratory.model.js';

// Helper to generate a unique-ish placeholder license number
function generateLicense(baseId) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const tail = (baseId || '').toString().slice(-4).toUpperCase();
  return `LIC-${tail}-${rand}`;
}

// Get all doctors with pending verification
export const getPendingVerifications = async (req, res) => {
  try {
    // Doctors (model + truly orphan users with NO doctor document)
    const pendingDoctors = await Doctor.find({ verificationStatus: 'pending' })
      .populate('user', 'email profile.firstName profile.lastName profile.phone profile.specialization profile.licenseNumber verificationStatus')
      .sort({ createdAt: 1 });

    // Collect ALL doctor user ids (any status) so we don't treat approved doctors as orphans
    const allDoctorUserIds = new Set((await Doctor.distinct('user')).map(id => id.toString()));

    const orphanDoctorUsers = await User.find({
      role: 'doctor',
      _id: { $nin: Array.from(allDoctorUserIds) }, // only users with *no* doctor doc at all
      $or: [
        { verificationStatus: { $regex: /^pending$/i } },
        { verificationStatus: { $exists: false } },
        { verificationStatus: null },
        { verificationStatus: '' }
      ]
    }).select('email profile.firstName profile.lastName profile.phone profile.specialization profile.licenseNumber verificationStatus createdAt');

    const doctorEntries = [
      ...pendingDoctors.map(d => ({
        entityType: 'doctor',
        ...d.toObject(),
        verificationStatus: (d.verificationStatus || 'pending').toLowerCase(),
        placeholderOnly: false
      })).filter(d => d.verificationStatus === 'pending'),
      ...orphanDoctorUsers.map(u => ({
        _id: u._id,
        entityType: 'doctor',
        user: {
          _id: u._id,
          email: u.email,
          profile: u.profile || {}
        },
        specialization: u.profile?.specialization || null,
        licenseNumber: u.profile?.licenseNumber || null,
        verificationStatus: 'pending',
        createdAt: u.createdAt,
        placeholderOnly: true
      }))
    ];

    // Pharmacies
    const pharmacies = await Pharmacy.find({ verificationStatus: 'Pending' })
      .sort({ createdAt: 1 });
    const pharmacyOwnerIds = new Set(pharmacies.map(p => p.ownerUserId?.toString()).filter(Boolean));
    const orphanPharmacistUsers = await User.find({
      role: 'pharmacist',
      verificationStatus: { $regex: /^pending$/i },
      _id: { $nin: Array.from(pharmacyOwnerIds) }
    }).select('email profile.firstName profile.lastName profile.phone verificationStatus createdAt');
    const pharmacyEntries = [
      ...pharmacies.map(p => ({
        entityType: 'pharmacy',
        _id: p._id,
        name: p.name,
        address: p.address,
        city: p.city,
        phone: p.phone,
        ownerUserId: p.ownerUserId,
        verificationStatus: 'pending',
        createdAt: p.createdAt,
        placeholderOnly: false
      })),
      ...orphanPharmacistUsers.map(u => ({
        _id: u._id,
        entityType: 'pharmacy',
        user: { _id: u._id, email: u.email, profile: u.profile || {} },
        name: u.profile?.company || `Pharmacy of ${u.profile?.firstName || 'User'}`,
        phone: u.profile?.phone || null,
        verificationStatus: 'pending',
        createdAt: u.createdAt,
        placeholderOnly: true
      }))
    ];

    // Laboratories
    const labs = await Laboratory.find({ verificationStatus: 'Pending' })
      .sort({ createdAt: 1 });
    const labOwnerIds = new Set(labs.map(l => l.ownerUserId?.toString()).filter(Boolean));
    const orphanLabUsers = await User.find({
      role: 'laboratory',
      verificationStatus: { $regex: /^pending$/i },
      _id: { $nin: Array.from(labOwnerIds) }
    }).select('email profile.firstName profile.lastName profile.phone verificationStatus createdAt');
    const labEntries = [
      ...labs.map(l => ({
        entityType: 'laboratory',
        _id: l._id,
        name: l.name,
        address: l.address,
        city: l.city,
        phone: l.phone,
        ownerUserId: l.ownerUserId,
        verificationStatus: 'pending',
        createdAt: l.createdAt,
        placeholderOnly: false
      })),
      ...orphanLabUsers.map(u => ({
        _id: u._id,
        entityType: 'laboratory',
        user: { _id: u._id, email: u.email, profile: u.profile || {} },
        name: u.profile?.company || `Laboratory of ${u.profile?.firstName || 'User'}`,
        phone: u.profile?.phone || null,
        verificationStatus: 'pending',
        createdAt: u.createdAt,
        placeholderOnly: true
      }))
    ];

  let combined = [...doctorEntries, ...pharmacyEntries, ...labEntries];
  // Final safety filter: only keep pending entries
  combined = combined.filter(e => (e.verificationStatus || '').toLowerCase() === 'pending');
    combined.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.status(200).json(combined);
  } catch (error) {
    console.log('Error fetching pending verifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get verification details for a specific doctor
export const getVerificationDetails = async (req, res) => {
  try {
    const { doctorId } = req.params; // retain route param name for backward compatibility

    // Try doctor
    let doctor = await Doctor.findById(doctorId)
      .populate('user', 'email profile.firstName profile.lastName profile.phone profile.specialization profile.licenseNumber createdAt');
    if (doctor) {
      const docObj = doctor.toObject();
      docObj.verificationDocuments = docObj.verificationDocuments || [];
      return res.status(200).json({ entityType: 'doctor', ...docObj, placeholderOnly: false });
    }

    // Pharmacy
    const pharmacy = await Pharmacy.findById(doctorId);
    if (pharmacy) {
      return res.status(200).json({
        entityType: 'pharmacy',
        _id: pharmacy._id,
        name: pharmacy.name,
        address: pharmacy.address,
        city: pharmacy.city,
        phone: pharmacy.phone,
        ownerUserId: pharmacy.ownerUserId,
        verificationStatus: pharmacy.verificationStatus.toLowerCase() === 'pending' ? 'pending' : (pharmacy.verificationStatus.toLowerCase() === 'verified' ? 'approved' : 'rejected'),
        createdAt: pharmacy.createdAt,
        placeholderOnly: false
      });
    }

    // Laboratory
    const lab = await Laboratory.findById(doctorId);
    if (lab) {
      return res.status(200).json({
        entityType: 'laboratory',
        _id: lab._id,
        name: lab.name,
        address: lab.address,
        city: lab.city,
        phone: lab.phone,
        ownerUserId: lab.ownerUserId,
        verificationStatus: lab.verificationStatus.toLowerCase() === 'pending' ? 'pending' : (lab.verificationStatus.toLowerCase() === 'verified' ? 'approved' : 'rejected'),
        createdAt: lab.createdAt,
        placeholderOnly: false
      });
    }

    // Fallback: treat provided id as user id for orphan entities
    const user = await User.findById(doctorId).select('role email profile.firstName profile.lastName profile.phone profile.specialization profile.licenseNumber profile.company verificationStatus createdAt');
    if (!user) return res.status(404).json({ error: 'Entity not found' });

    const role = user.role;
    if (!['doctor','pharmacist','laboratory'].includes(role)) return res.status(404).json({ error: 'Entity not found' });
    const base = {
      _id: user._id,
      user: user,
      verificationStatus: (user.verificationStatus || 'pending').toLowerCase(),
      createdAt: user.createdAt,
      placeholderOnly: true
    };
    if (role === 'doctor') {
      // Attempt to see if a doctor document exists but was looked up by user id
      const existingDoc = await Doctor.findOne({ user: user._id });
      if (existingDoc) {
        const docObj = existingDoc.toObject();
        docObj.verificationDocuments = docObj.verificationDocuments || [];
        return res.status(200).json({ entityType: 'doctor', ...docObj, placeholderOnly: false });
      }
      return res.status(200).json({ entityType: 'doctor', ...base, specialization: user.profile?.specialization || null, licenseNumber: user.profile?.licenseNumber || null, verificationDocuments: [] });
    }
    if (role === 'pharmacist') {
      return res.status(200).json({ entityType: 'pharmacy', ...base, name: user.profile?.company || `Pharmacy of ${user.profile?.firstName || 'User'}` });
    }
    return res.status(200).json({ entityType: 'laboratory', ...base, name: user.profile?.company || `Laboratory of ${user.profile?.firstName || 'User'}` });
  } catch (error) {
  console.log('Error fetching verification details:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Approve doctor verification
export const approveVerification = async (req, res) => {
  try {
    const { doctorId } = req.params; // generic id
    const adminId = req.user._id;

    // Doctor path
    let doctor = await Doctor.findById(doctorId);
    if (doctor) {
      doctor.verificationStatus = 'approved';
      doctor.verifiedAt = new Date();
      doctor.verifiedBy = adminId;
      doctor.verificationNotes = req.body.notes || '';
      await doctor.save();
      await User.findByIdAndUpdate(doctor.user, { $set: { isVerified: true, 'profile.isVerified': true, verificationStatus: 'approved' } });
      return res.status(200).json({ message: 'Doctor verification approved successfully', entityType: 'doctor', doctor });
    }

    // Pharmacy
    let pharmacy = await Pharmacy.findById(doctorId);
    if (pharmacy) {
      pharmacy.verificationStatus = 'Verified';
      await pharmacy.save();
      if (pharmacy.ownerUserId) {
        await User.findByIdAndUpdate(pharmacy.ownerUserId, { $set: { isVerified: true, 'profile.isVerified': true, verificationStatus: 'approved' } });
      }
      return res.status(200).json({ message: 'Pharmacy verification approved successfully', entityType: 'pharmacy', pharmacy });
    }

    // Laboratory
    let lab = await Laboratory.findById(doctorId);
    if (lab) {
      lab.verificationStatus = 'Verified';
      await lab.save();
      if (lab.ownerUserId) {
        await User.findByIdAndUpdate(lab.ownerUserId, { $set: { isVerified: true, 'profile.isVerified': true, verificationStatus: 'approved' } });
      }
      return res.status(200).json({ message: 'Laboratory verification approved successfully', entityType: 'laboratory', laboratory: lab });
    }

    // Orphan user creation path
    const user = await User.findById(doctorId);
    if (!user) return res.status(404).json({ error: 'Entity not found' });
    if (user.role === 'doctor') {
      // Consolidate any duplicate doctor docs (should not happen once unique index applied)
      const doctorDocs = await Doctor.find({ user: user._id });
      if (doctorDocs.length > 1) {
        // Keep the earliest created doc; remove the rest
        doctorDocs.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
        const keep = doctorDocs[0];
        const remove = doctorDocs.slice(1);
        await Doctor.deleteMany({ _id: { $in: remove.map(d => d._id) } });
        doctor = keep;
      } else if (doctorDocs.length === 1) {
        doctor = doctorDocs[0];
      }

      // If already approved -> idempotent success
      if (doctor && doctor.verificationStatus === 'approved') {
        await User.findByIdAndUpdate(user._id, { $set: { isVerified: true, 'profile.isVerified': true, verificationStatus: 'approved' } });
        return res.status(200).json({ message: 'Doctor already approved', entityType: 'doctor', doctor, idempotent: true });
      }

      if (doctor) {
        doctor.verificationStatus = 'approved';
        doctor.verifiedAt = new Date();
        doctor.verifiedBy = adminId;
        doctor.verificationNotes = req.body.notes || '';
        await doctor.save();
      } else {
        const spec = user.profile?.specialization || 'General Medicine';
        let license = user.profile?.licenseNumber;
        if (!license || !license.trim()) license = generateLicense(user._id);
        // Try to create doctor with retries on duplicate license
        let attempts = 0;
        while (true) {
          try {
            doctor = await Doctor.create({ user: user._id, specialization: spec, licenseNumber: license, verificationStatus: 'approved', verifiedAt: new Date(), verifiedBy: adminId });
            break;
          } catch (e) {
            const dup = e && (e.code === 11000 || /duplicate key/i.test(e.message));
            attempts++;
            if (dup && attempts < 5) {
              license = generateLicense(user._id);
              continue;
            }
            throw e;
          }
        }
      }
      await User.findByIdAndUpdate(user._id, { $set: { isVerified: true, 'profile.isVerified': true, verificationStatus: 'approved' } });
      return res.status(200).json({ message: 'Doctor verification approved', entityType: 'doctor', doctor, idempotent: false });
    }
    if (user.role === 'pharmacist') {
      pharmacy = await Pharmacy.create({ name: user.profile?.company || `Pharmacy of ${user.profile?.firstName || 'User'}`, ownerUserId: user._id, verificationStatus: 'Verified' });
      await User.findByIdAndUpdate(user._id, { $set: { isVerified: true, 'profile.isVerified': true, verificationStatus: 'approved' } });
      return res.status(200).json({ message: 'Pharmacy verification approved (profile created)', entityType: 'pharmacy', pharmacy });
    }
    if (user.role === 'laboratory') {
      lab = await Laboratory.create({ name: user.profile?.company || `Laboratory of ${user.profile?.firstName || 'User'}`, ownerUserId: user._id, verificationStatus: 'Verified' });
      await User.findByIdAndUpdate(user._id, { $set: { isVerified: true, 'profile.isVerified': true, verificationStatus: 'approved' } });
      return res.status(200).json({ message: 'Laboratory verification approved (profile created)', entityType: 'laboratory', laboratory: lab });
    }
    return res.status(404).json({ error: 'Unsupported entity for approval' });
  } catch (error) {
    console.log('Error approving verification:', error);
    res.status(500).json({ error: 'Server error', details: error.message, stack: process.env.NODE_ENV === 'production' ? undefined : error.stack });
  }
};

// Reject doctor verification
export const rejectVerification = async (req, res) => {
  try {
    const { doctorId } = req.params; // generic id
    const adminId = req.user._id;
    let doctor = await Doctor.findById(doctorId);
    if (doctor) {
      doctor.verificationStatus = 'rejected';
      doctor.verifiedAt = new Date();
      doctor.verifiedBy = adminId;
      doctor.verificationNotes = req.body.notes || 'Verification rejected';
      await doctor.save();
      await User.findByIdAndUpdate(doctor.user, { $set: { verificationStatus: 'rejected', 'profile.isVerified': false } });
      return res.status(200).json({ message: 'Doctor verification rejected', entityType: 'doctor', doctor });
    }

    let pharmacy = await Pharmacy.findById(doctorId);
    if (pharmacy) {
      pharmacy.verificationStatus = 'Rejected';
      await pharmacy.save();
      if (pharmacy.ownerUserId) await User.findByIdAndUpdate(pharmacy.ownerUserId, { $set: { verificationStatus: 'rejected', 'profile.isVerified': false } });
      return res.status(200).json({ message: 'Pharmacy verification rejected', entityType: 'pharmacy', pharmacy });
    }

    let lab = await Laboratory.findById(doctorId);
    if (lab) {
      lab.verificationStatus = 'Rejected';
      await lab.save();
      if (lab.ownerUserId) await User.findByIdAndUpdate(lab.ownerUserId, { $set: { verificationStatus: 'rejected', 'profile.isVerified': false } });
      return res.status(200).json({ message: 'Laboratory verification rejected', entityType: 'laboratory', laboratory: lab });
    }

    const user = await User.findById(doctorId);
    if (!user) return res.status(404).json({ error: 'Entity not found' });
    if (!['doctor','pharmacist','laboratory'].includes(user.role)) return res.status(404).json({ error: 'Entity not found' });
    await User.findByIdAndUpdate(user._id, { $set: { verificationStatus: 'rejected', 'profile.isVerified': false } });
    return res.status(200).json({ message: `${user.role} user verification rejected (no profile yet)`, entityType: user.role });
  } catch (error) {
    console.log('Error rejecting verification:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
