import mongoose from 'mongoose';
import Role from './role.model.js';

// Minimal privilege set required for core doctor workflows
const MIN_DOCTOR_PRIVILEGES = [
  'Create/Edit Consultation Notes',
];

export const seedDefaultRoles = async () => {
  const roles = [
    { name: 'admin', description: 'System administrator', privileges: [], isActive: true },
    // Ensure doctors can create/edit consultation notes to complete visits and save records
    { name: 'doctor', description: 'Doctor user', privileges: MIN_DOCTOR_PRIVILEGES, isActive: true },
    { name: 'patient', description: 'Patient user', privileges: [], isActive: true },
    { name: 'pharmacist', description: 'Pharmacist user', privileges: ['View Prescriptions', 'Manage Medication Inventory'], isActive: true },
    { name: 'laboratory', description: 'Laboratory user', privileges: ['Access Lab Results', 'Upload Lab Reports'], isActive: true },
  ];

  for (const roleData of roles) {
    const existing = await Role.findOne({ name: roleData.name });
    if (!existing) {
      await Role.create(roleData);
      console.log(`Seeded role: ${roleData.name}`);
    } else {
      // Merge/ensure minimum privileges exist on existing roles without overwriting other grants
      const current = Array.isArray(existing.privileges) ? existing.privileges : [];
      const desired = Array.isArray(roleData.privileges) ? roleData.privileges : [];
      const merged = Array.from(new Set([...current, ...desired]));
      if (merged.length !== current.length) {
        existing.privileges = merged;
        await existing.save();
        console.log(`Updated role privileges: ${roleData.name} (+${merged.filter(p => !current.includes(p)).length})`);
      }
    }
  }
};
