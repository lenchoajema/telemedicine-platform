// backend/src/modules/admin/privileges.config.js
// List of all available privileges matching WHO standards
export const PRIVILEGES = [
  // Patient Record Management
  "View Own Patient Record",
  "View All Patient Records",
  "Edit Patient Demographics",
  "View Patient Medical History",
  "Edit Patient Medical History",
  // Appointments & Scheduling
  "View Own Appointments",
  "View All Appointments",
  "Create/Book Appointments",
  "Manage Doctor Schedules",
  // Clinical Tasks
  "Create Prescriptions",
  "View Prescriptions",
  "Manage Medication Inventory",
  "Order Lab Tests",
  "Access Lab Results",
  "Upload Lab Reports",
  "Create/Edit Consultation Notes",
  "Manage Care Plans",
  // Billing & Payments
  "View Own Billing History",
  "Make a Payment",
  "View All Patient Payments",
  "Generate Invoices",
  "Manage Insurance Claims",
  // Communication
  "Send/Receive Secure Messages",
  "Access Community Forums",
  // Telehealth Sessions
  "Start/Join Telehealth Session",
  "Record Session",
  "Monitor Active Session",
  // Reporting & Analytics
  "View System Usage Reports",
  "Export Data Analytics",
  // Data Management
  "Manage Data Integrations",
  "Perform Data Backup/Restore",
  // Security & Compliance
  "Configure MFA & SSO",
  "View Audit Trails & Logs",
];
