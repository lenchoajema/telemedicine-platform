const { attachUserPrivileges, authorizePrivilege } = require('../rbac.middleware.cjs');
const RoleModule = require('../../modules/admin/role.model.js');
const Role = RoleModule.default || RoleModule;

// Static privilege list for testing (matches config)
const PRIVILEGES = [
  'View Own Patient Record',
  'View All Patient Records',
  'Edit Patient Demographics',
  'View Patient Medical History',
  'Edit Patient Medical History',
  'View Own Appointments',
  'View All Appointments',
  'Create/Book Appointments',
  'Manage Doctor Schedules',
  'Create Prescriptions',
  'View Prescriptions',
  'Manage Medication Inventory',
  'Order Lab Tests',
  'Access Lab Results',
  'Upload Lab Reports',
  'Create/Edit Consultation Notes',
  'Manage Care Plans',
  'View Own Billing History',
  'Make a Payment',
  'View All Patient Payments',
  'Generate Invoices',
  'Manage Insurance Claims',
  'Send/Receive Secure Messages',
  'Access Community Forums',
  'Start/Join Telehealth Session',
  'Record Session',
  'Monitor Active Session',
  'View System Usage Reports',
  'Export Data Analytics',
  'Manage Data Integrations',
  'Perform Data Backup/Restore',
  'Configure MFA & SSO',
  'View Audit Trails & Logs',
];

jest.mock('../../modules/admin/role.model.js', () => ({
  findOne: jest.fn(),
}));

beforeEach(() => {
  Role.findOne.mockReset();
});

describe('RBAC Middleware and Controller (CJS)', () => {
  test('assigns all privileges to admin', async () => {
    const req = { user: { role: 'admin' } };
    const next = jest.fn();
    await attachUserPrivileges(req, null, next);
    expect(req.user.privileges).toEqual(PRIVILEGES);
    expect(next).toHaveBeenCalled();
  });

  test('assigns role-specific privileges', async () => {
    Role.findOne.mockResolvedValue({ privileges: ['View Prescriptions', 'Manage Medication Inventory'] });
    const req = { user: { role: 'pharmacist' } };
    const next = jest.fn();
    await attachUserPrivileges(req, null, next);
    expect(req.user.privileges).toEqual(['View Prescriptions', 'Manage Medication Inventory']);
    expect(next).toHaveBeenCalled();
  });

  test('yields empty privileges for nonexistent role', async () => {
    Role.findOne.mockResolvedValue(null);
    const req = { user: { role: 'nonexistent' } };
    const next = jest.fn();
    await attachUserPrivileges(req, null, next);
    expect(req.user.privileges).toEqual([]);
    expect(next).toHaveBeenCalled();
  });

  test('allows access when user has privilege', () => {
    const req = { user: { role: 'doctor', privileges: ['Create/Edit Consultation Notes'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authorizePrivilege('Create/Edit Consultation Notes')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('denies access when user lacks privilege', () => {
    const req = { user: { role: 'patient', privileges: ['View Own Patient Record'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authorizePrivilege('Manage Medication Inventory')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Insufficient privileges' });
  });

  test('allows admin regardless of privileges list', () => {
    const req = { user: { role: 'admin', privileges: [] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authorizePrivilege('Manage Medication Inventory')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
