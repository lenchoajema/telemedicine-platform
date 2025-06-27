import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/telemedicine', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isVerified: { type: Boolean, default: true },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    dateOfBirth: Date,
    gender: String,
    address: String,
    specialization: String // For doctors
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUsers() {
  try {
    const users = [
      {
        email: 'lenchoajema@gmail.com',
        password: await bcrypt.hash('password123', 10),
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+1234567890'
        }
      },
      {
        email: 'admin@telemedicine.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        firstName: 'Platform',
        lastName: 'Admin',
        profile: {
          firstName: 'Platform',
          lastName: 'Admin',
          phone: '+1234567891'
        }
      },
      {
        email: 'doctor1@test.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'doctor',
        firstName: 'John',
        lastName: 'Smith',
        profile: {
          firstName: 'John',
          lastName: 'Smith',
          phone: '+1234567892',
          specialization: 'Cardiology'
        }
      },
      {
        email: 'doctor2@test.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'doctor',
        firstName: 'Sarah',
        lastName: 'Johnson',
        profile: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          phone: '+1234567893',
          specialization: 'General Medicine'
        }
      },
      {
        email: 'patient1@test.com',
        password: await bcrypt.hash('patient123', 10),
        role: 'patient',
        firstName: 'Mary',
        lastName: 'Wilson',
        profile: {
          firstName: 'Mary',
          lastName: 'Wilson',
          phone: '+1234567894',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'female'
        }
      }
    ];

    console.log('Creating test users...');
    
    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`✅ User ${userData.email} already exists`);
          continue;
        }

        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`✅ User ${userData.email} already exists`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }

    console.log('\n📊 All users in database:');
    const allUsers = await User.find({}, 'email role firstName lastName').lean();
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.firstName} ${user.lastName}`);
    });

    console.log('\n🔑 Test credentials:');
    console.log('Admin: lenchoajema@gmail.com / password123');
    console.log('Admin: admin@telemedicine.com / admin123');
    console.log('Doctor: doctor1@test.com / doctor123');
    console.log('Doctor: doctor2@test.com / doctor123');
    console.log('Patient: patient1@test.com / patient123');
    console.log('Patient: px4@test.com / password123 (existing)');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUsers();
