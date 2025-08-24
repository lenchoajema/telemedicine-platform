import User from '../../models/User.js';

// Idempotently ensure the core sample users exist for local development.
export async function ensureCoreUsers() {
  const coreUsers = [
    {
      username: 'rootadmin',
      email: 'admin@telemedicine.com',
      password: 'adminpassword123',
      role: 'admin',
      profile: { firstName: 'Root', lastName: 'Admin' },
      isVerified: true,
    },
    {
      username: 'drsamuel',
      email: 'samuel.jones@telemedicine.com',
      password: 'doctorpassword123',
      role: 'doctor',
      profile: { firstName: 'Samuel', lastName: 'Jones', title: 'Dr.' },
      isVerified: true,
      verificationDetails: {
        licenseNumber: 'MD123456',
        specialty: 'Cardiology',
        yearsOfExperience: 15,
      },
    },
    {
      username: 'jane.doe',
      email: 'jane.doe@email.com',
      password: 'patientpassword123',
      role: 'patient',
      profile: { firstName: 'Jane', lastName: 'Doe', dateOfBirth: new Date('1990-05-15') },
      isVerified: true,
    },
    {
      username: 'pharma.one',
      email: 'pharmacy@telemedicine.com',
      password: 'pharmacypassword123',
      role: 'pharmacist',
      profile: { firstName: 'Pharma', lastName: 'One', company: 'Main Pharmacy' },
      isVerified: true,
    },
    {
      username: 'lab.one',
      email: 'laboratory@telemedicine.com',
      password: 'laboratorypassword123',
      role: 'laboratory',
      profile: { firstName: 'Lab', lastName: 'One', company: 'Central Lab' },
      isVerified: true,
    },
  ];

  const created = [];
  const skipped = [];
  for (const data of coreUsers) {
    const exists = await User.findOne({ email: data.email }).select('_id').lean();
    if (exists) { skipped.push(data.email); continue; }
    await User.create(data);
    created.push(data.email);
  }
  console.log('[ensureCoreUsers] created:', created.length ? created : 'none', '| skipped:', skipped.length ? skipped : 'none');
}
