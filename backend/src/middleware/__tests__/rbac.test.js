// ESM unit tests for RBAC middleware: use dynamic import
import { jest, describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
// Mock Role model via jest.mock
jest.mock('../../modules/admin/role.model.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

// Variables to hold imported modules
let attachUserPrivileges;
let authorizePrivilege;
let Role;

// Load modules dynamically to respect ESM
beforeAll(async () => {
  const mod = await import('../rbac.middleware.js');
  attachUserPrivileges = mod.attachUserPrivileges;
  authorizePrivilege = mod.authorizePrivilege;
  Role = (await import('../../modules/admin/role.model.js')).default;
});
// Static privilege list for testing (matches config)
const PRIVILEGES = [
  "View Own Patient Record",
  "View All Patient Records",
  "Edit Patient Demographics",
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
// Mock Role model via jest.mock before importing middleware
jest.mock('../../modules/admin/role.model.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

import Role from '../../modules/admin/role.model.js';
import { attachUserPrivileges, authorizePrivilege } from '../rbac.middleware.js';

// Static privilege list for testing (matches config)
const PRIVILEGES = [
  "View Own Patient Record",
  "View All Patient Records",
  "Edit Patient Demographics",
  "View Patient Medical History",
  "Edit Patient Medical History",
  "View Own Appointments",
  "View All Appointments",
  "Create/Book Appointments",
  "Manage Doctor Schedules",
  "Create Prescriptions",
  "View Prescriptions",
  "Manage Medication Inventory",
  "Order Lab Tests",
  "Access Lab Results",
  "Upload Lab Reports",
  "Create/Edit Consultation Notes",
  "Manage Care Plans",
  "View Own Billing History",
  "Make a Payment",
  "View All Patient Payments",
  "Generate Invoices",
  "Manage Insurance Claims",
  "Send/Receive Secure Messages",
  "Access Community Forums",
  "Start/Join Telehealth Session",
  "Record Session",
  "Monitor Active Session",
  "View System Usage Reports",
  "Export Data Analytics",
  "Manage Data Integrations",
  "Perform Data Backup/Restore",
  "Configure MFA & SSO",
  "View Audit Trails & Logs",
];

describe('RBAC Middleware and Controller', () => {
  beforeEach(() => {
    // Reset stub between tests
    Role.findOne = jest.fn();
  });
    const next = jest.fn();
    const middleware = authorizePrivilege('Create/Edit Consultation Notes');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('authorizePrivilege denies access when user lacks privilege', () => {
    const req = { user: { role: 'patient', privileges: ['View Own Patient Record'] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    const middleware = authorizePrivilege('Manage Medication Inventory');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Insufficient privileges' });
    expect(next).not.toHaveBeenCalled();
  });

  test('authorizePrivilege allows admin without checking privileges list', () => {
    const req = { user: { role: 'admin', privileges: [] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    const middleware = authorizePrivilege('Manage Medication Inventory');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
