┌─────────────────────────────────────────────────┐
│ API Gateway │
└───────┬───────────────────┬───────────────────┬┘
│ │ │
┌───────▼──────┐ ┌───────▼───────┐ ┌─────▼───────┐
│ Core Monolith │ │ Video Service │ │ Payments │
│ (Node.js) │ │ (WebRTC Specialist) │ (Isolated) │
│ │ │ │ │ │
│ - Auth │ │ - Real-time │ │ - PCI │
│ - Appointments│ │ consultations │ │ Compliant│
│ - EHR │ │ - Screen sharing│ │ │
└───────┬──────┘ └─────────────────┘ └───────────┘
│
┌───────▼───────┐
│ Shared MongoDB │
│ (Separate │
│ collections) │
└───────────────┘
Decision Framework
Choose Microservices If:

Team size > 10 developers

Expecting > 50k daily active users

Need mixed tech stacks (e.g., Python for ML)

Regulatory requirements demand isolation

Stick with Monolith If:

Small team (<5 devs)

MVP phase

Limited DevOps expertise

Tight budget for cloud infrastructure

Implementation Recommendation
Phase 1 (0-6 months): Modular Monolith

Single codebase with clear internal boundaries

Example structure:

src/
modules/
auth/
appointments/
video/
payments/
Use MongoDB with separate collections per domain

Phase 2 (When Scaling): Extract Services

First extract video service (WebRTC has special scaling needs)

Then payments (for compliance isolation)

Finally split auth/appointments if needed

Alternatives Considered
Serverless Approach

AWS Lambda + API Gateway

Good for unpredictable loads

Cold starts problematic for video calls

Service-Oriented Architecture

3-5 coarse-grained services

Less overhead than microservices

Example: Combine auth + appointments

Tech Stack Suggestion
For your current stage (assuming early/mid-stage startup):

Copy

- Frontend: Vite + React (as planned)
- Backend: NestJS (modular by design)
- Database: MongoDB Atlas (with transaction support)
- Deployment: Docker Compose → Kubernetes later
- Monitoring: New Relic free tier
  Bottom Line: Start with a well-structured monolith, design with service boundaries in mind, but delay microservices until you have concrete scaling or organizational needs that justify the complexity. The hybrid approach gives you flexibility without premature optimization.

Revised Project Structure (Modular Monolith)
Copy
backend/
├── src/
│ ├── modules/
│ │ ├── auth/
│ │ │ ├── user.model.js
│ │ │ ├── auth.controller.js
│ │ │ └── auth.routes.js
│ │ ├── appointments/
│ │ │ ├── appointment.model.js
│ │ │ ├── appointment.controller.js
│ │ │ └── appointment.routes.js
│ │ └── shared/
│ │ ├── db.js # MongoDB connection
│ │ └── middleware/ # Auth middleware etc.
│ ├── config/
│ └── server.js

1. User Model (modules/auth/user.model.js)
   javascript
   Copy
   import mongoose from 'mongoose';
   import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
email: {
type: String,
required: true,
unique: true,
match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
index: true
},
password: {
type: String,
required: true,
select: false
},
role: {
type: String,
enum: ['patient', 'doctor', 'admin'],
default: 'patient'
},
profile: {
firstName: { type: String, required: true },
lastName: { type: String, required: true },
dateOfBirth: Date,
phone: String,
avatar: String,
// Doctor-specific fields
licenseNumber: {
type: String,
required: function() { return this.role === 'doctor'; }
},
specialization: {
type: String,
required: function() { return this.role === 'doctor'; }
}
},
status: {
type: String,
enum: ['active', 'suspended', 'pending'],
default: 'pending'
},
lastLogin: Date
}, {
timestamps: true,
toJSON: { virtuals: true },
toObject: { virtuals: true }
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
if (!this.isModified('password')) return next();

try {
const salt = await bcrypt.genSalt(12);
this.password = await bcrypt.hash(this.password, salt);
next();
} catch (err) {
next(err);
}
});

// Virtual for full name
UserSchema.virtual('profile.fullName').get(function() {
return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Instance method for password verification
UserSchema.methods.comparePassword = async function(candidatePassword) {
return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema); 2. Appointment Model (modules/appointments/appointment.model.js)
javascript
Copy
import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
patient: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true
},
doctor: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true,
validate: {
validator: async function(doctorId) {
const user = await mongoose.model('User').findById(doctorId);
return user?.role === 'doctor';
},
message: 'The specified user is not a doctor'
}
},
date: {
type: Date,
required: true,
validate: {
validator: function(date) {
return date > new Date();
},
message: 'Appointment date must be in the future'
}
},
duration: { // in minutes
type: Number,
min: 15,
max: 120,
default: 30
},
status: {
type: String,
enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
default: 'scheduled'
},
reason: {
type: String,
maxlength: 500
},
symptoms: [{
type: String,
maxlength: 100
}],
meetingUrl: String,
// Medical data (doctor-editable)
diagnosis: {
type: String,
maxlength: 1000
},
prescription: [{
medication: String,
dosage: String,
instructions: String
}]
}, {
timestamps: true,
toJSON: { virtuals: true }
});

// Compound index for doctor availability
AppointmentSchema.index({
doctor: 1,
date: 1,
status: 1
}, { unique: true });

// Virtual for end time
AppointmentSchema.virtual('endTime').get(function() {
const end = new Date(this.date);
end.setMinutes(end.getMinutes() + this.duration);
return end;
});

// Query helper for active appointments
AppointmentSchema.query.active = function() {
return this.where({ status: { $in: ['scheduled'] } });
};

export default mongoose.model('Appointment', AppointmentSchema); 3. Centralized DB Connection (shared/db.js)
javascript
Copy
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
try {
await mongoose.connect(process.env.MONGO_URI, {
dbName: 'telemedicine_db',
autoIndex: process.env.NODE_ENV !== 'production' // Better performance in prod
});

    console.log('MongoDB connected');

    // Connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

} catch (err) {
console.error('MongoDB connection failed:', err);
process.exit(1);
}
};

export default connectDB; 4. Usage Example in Controllers
Auth Controller (modules/auth/auth.controller.js)

javascript
Copy
import User from './user.model.js';

export const register = async (req, res) => {
try {
const { email, password, role, ...profile } = req.body;

    const user = await User.create({
      email,
      password,
      role,
      profile
    });

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json(userObj);

} catch (err) {
res.status(400).json({
error: 'Registration failed',
details: err.message
});
}
};
Appointment Controller (modules/appointments/appointment.controller.js)

javascript
Copy
import Appointment from './appointment.model.js';

export const createAppointment = async (req, res) => {
try {
const { doctorId, date, duration } = req.body;

    const appointment = await Appointment.create({
      patient: req.user._id,  // From auth middleware
      doctor: doctorId,
      date,
      duration
    });

    res.status(201).json(appointment);

} catch (err) {
res.status(400).json({
error: 'Appointment creation failed',
details: err.message
});
}
};
Key Improvements:
Domain Separation

Clear module boundaries with isolated responsibilities

Models only expose necessary methods

Validation

Schema-level validation for data integrity

Custom validators (e.g., doctor role check)

Performance

Strategic indexing (compound indexes for common queries)

Virtual fields for derived properties

Security

Password field automatically excluded from queries

Pre-save hooks for data sanitization

Extensibility

Virtual fields and query helpers for business logic

Easy to extract modules into services later

Next Steps:
Set up the shared MongoDB connection in server.js:

javascript
Copy
import connectDB from './shared/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import appointmentRoutes from './modules/appointments/appointment.routes.js';

await connectDB();

const app = express();
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
Implement transaction support for critical operations (e.g., booking appointments while checking availability).

## Workflow Mapping

- User opens chat → verify consent → create/fetch ChatSession
- Client encrypts message → POST API → server stores in secure repo → WebSocket broadcast
- Recipient decrypts → UI renders → optional read-receipt PATCH
- Session closure → archive data → enforce retention/deletion per policy

## Equity, Monitoring & Compliance

- Track de-identified usage by demographics, region.
- Monitor response times, access barriers, escalate inequities.
- Generate audit reports for regulators and public health authorities.
- Ensure accountability through immutable logs and role-based audits.
- Align data lifecycle with WHO and regional privacy regulations.
- Provide transparency and control to patients via consent dashboards.
- Regularly review equity metrics and update triage algorithms to reduce disparities.
- Document all processes for compliance with HIPAA, GDPR, WHO, and local regulations.
