# Telemedicine Platform: Production Implementation Plan

## 1. Introduction

This document outlines the strategy and workflow for implementing the comprehensive features and database structure detailed in `todo.md`. The core of this plan is to translate the proposed relational (SQL) schema into a robust and efficient NoSQL architecture using MongoDB and Mongoose.

Our approach is to leverage MongoDB's strengths—flexibility and performance—by using a combination of **document referencing** (linking between collections) and **embedding** (nesting data within a single document).

## 2. Phased Implementation Workflow

We will implement this in a series of phases to ensure stability and manage complexity. Each step will follow a consistent workflow:

1.  **Model:** Define or update the Mongoose schema (`/backend/src/models`).
2.  **Controller:** Create the business logic for the feature (`/backend/src/controllers`).
3.  **Route:** Expose the logic via new API endpoints (`/backend/src/routes`).
4.  **Test:** Create API tests to validate the new functionality.
5.  **Frontend:** Build the necessary UI components to consume the new features.

---

### Phase 1: Enhance Core Models & Functionality

**Objective:** Bring the existing `User` and `Appointment` models up to the specifications in `todo.md` and establish the new `Specialty` collection.

**Steps:**

1.  **Create `Specialty` Model:**

    - **File:** `backend/src/models/Specialty.js`
    - **Schema:** `{ name: String, description: String }`
    - **Action:** Create a new model, controller, and admin routes for managing specialties (Create, Read, Update, Delete).

2.  **Enhance `User` Model:**

    - **File:** `backend/src/models/User.js`
    - **Schema Additions:**
      - `timeZone: { type: String, default: 'UTC' }`
      - `status: { type: String, enum: ['Active', 'Suspended', 'Deactivated'], default: 'Active' }`
      - `lastLoginAt: { type: Date }`
    - **Enhance Doctor's `verificationDetails`:**
      - Add `specialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' }`
      - Add `licenseNumber: String`
      - Add `biography: String`
      - Add `consultationFee: Number`
    - **Action:** Update the user registration and profile update controllers/routes to handle these new fields.

3.  **Enhance `Appointment` Model:**
    - **File:** `backend/src/models/Appointment.js`
    - **Schema Additions:**
      - `consultationType: { type: String, enum: ['Video', 'Audio', 'Chat'] }`
      - Update `status` enum to `['Scheduled', 'Completed', 'Cancelled', 'InProgress']`.
      - **Embed `ConsultationNotes`:** Add an embedded object for efficiency.
      ```javascript
      consultationNotes: {
        doctorNotes: String,
        diagnosis: String
      }
      ```
    - **Action:** Update the appointment creation and management routes to include these fields.

---

### Phase 2: Implement Core Clinical Features

**Objective:** Build the foundational clinical features: Prescriptions and Payments.

**Steps:**

1.  **Create `Prescription` Model:**

    - **File:** `backend/src/models/Prescription.js`
    - **Schema:**
      - `appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true }`
      - `patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`
      - `doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`
      - `medicationName: { type: String, required: true }`
      - `dosage: String`
      - `instructions: String`
    - **Action:** Create new controllers and routes for doctors to issue prescriptions and for patients to view them.

2.  **Create `Payment` Model:**
    - **File:** `backend/src/models/Payment.js`
    - **Schema:**
      - `appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true }`
      - `amount: { type: Number, required: true }`
      - `paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }`
      - `transactionId: String`
    - **Action:** Create new controllers and routes. This will later integrate with a payment gateway (like Stripe or PayPal).

---

### Phase 3: Advanced Patient Data & Care Plans

**Objective:** Implement features for managing patient-provided documents and structured care plans.

**Steps:**

1.  **Create `MedicalDocument` Model:**

    - **File:** `backend/src/models/MedicalDocument.js`
    - **Schema:**
      - `patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`
      - `documentName: String`
      - `documentType: { type: String, enum: ['Lab Result', 'Imaging', 'Referral', 'Other'] }`
      - `storageURL: { type: String, required: true }`
    - **Action:** Create routes and controllers for file uploads. This will require integrating a library like `multer` for handling `multipart/form-data` and a service for uploading to cloud storage (e.g., AWS S3).

2.  **Create `CarePlan` and `CarePlanTask` Models:**
    - **File:** `backend/src/models/CarePlan.js`
    - **Schema:**
      - `patient` and `doctor` references.
      - `planName`, `description`, `startDate`, `endDate`.
      - **Embed Tasks:** For simplicity, tasks can be an array of embedded documents.
      ```javascript
      tasks: [
        {
          taskDescription: String,
          isCompleted: { type: Boolean, default: false },
        },
      ];
      ```
    - **Action:** Create controllers and routes for doctors to create plans and for patients to view and update task status.

---

### Phase 4: System Operations & Auditing

**Objective:** Enhance the system's logging and notification capabilities to match the production-level requirements.

**Steps:**

1.  **Enhance `Notification` Model:**

    - **File:** `backend/src/models/Notification.js` (or create if not present)
    - **Schema:**
      - `user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }`
      - `notificationType: { type: String, enum: ['AppointmentReminder', 'NewMessage', 'PrescriptionReady', 'SystemAlert'] }`
      - `content: String`
      - `isRead: { type: Boolean, default: false }`
    - **Action:** Create a centralized `notificationService` to handle the creation and sending of notifications for various events in the system.

2.  **Enhance `AuditLog` Model:**
    - **File:** `backend/src/models/AuditLog.js`
    - **Schema:**
      - `user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }`
      - `actionType: String`
      - `details: { type: mongoose.Schema.Types.Mixed }` // For flexible JSON data
      - `timestamp: { type: Date, default: Date.now }`
    - **Action:** Implement a middleware that can be added to critical routes to automatically log actions, capturing the user, request body, and IP address.

---

### Phase 5: Advanced Clinical Collaboration & Reporting

**Objective:** Enhance trust and clinical outcomes through structured reporting, peer collaboration, and intelligent case analysis. This phase focuses on creating a transparent and collaborative environment for both patients and doctors.

**Steps:**

1.  **Create a Unified `ClinicalReport` Model:**

    - **Rationale:** Instead of separate models for each report type, a single, flexible model provides a consistent structure for all clinical documentation.
    - **File:** `backend/src/models/ClinicalReport.js`
    - **Schema:**
      - `appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true }`
      - `patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`
      - `doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`
      - `reportType: { type: String, enum: ['Prescription', 'LabResult', 'PharmacyOrder', 'ReferralNote'], required: true }`
      - `summary: { type: String, required: true }`
      - `details: { type: mongoose.Schema.Types.Mixed }` // Flexible JSON for structured data like lab values or referral details.
      - `status: { type: String, enum: ['Draft', 'Finalized', 'SentToPatient'], default: 'Draft' }`
    - **Action:** Create controllers and routes for doctors to generate these reports from an appointment. Patients will have a dedicated section in their dashboard to view all finalized reports, ensuring clear, written records.

2.  **Implement `CaseDiscussion` Model for Doctor Collaboration:**

    - **Rationale:** To ensure the best patient outcomes, this feature allows doctors to securely discuss complex cases with a board of peers.
    - **File:** `backend/src/models/CaseDiscussion.js`
    - **Schema:**
      - `patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`
      - `presentingDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }`
      - `title: String`
      - `caseSummary: String`
      - `isResolved: { type: Boolean, default: false }`
      - `contributions: [{
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comment: String,
  createdAt: { type: Date, default: Date.now }
}]`
    - **Action:** Develop a secure portal within the doctor's dashboard. Doctors can initiate a case discussion, which notifies a pre-defined "doctors board." Contributing doctors can add comments, fostering a collaborative environment for decision-making.

3.  **Develop a Case Analysis & Anomaly Detection Service:**
    - **Rationale:** To proactively improve care, the system will categorize cases and identify new or unusual patterns that may require special attention.
    - **File:** `backend/src/services/caseAnalysisService.js`
    - **Model:** `backend/src/models/MedicalCase.js` (for storing anonymized, aggregated data)
    - **Action:**
      - Create a `MedicalCase` model to store anonymized profiles of cases (e.g., diagnoses, symptoms, treatments).
      - Implement a background service that periodically processes finalized `Appointment` and `ClinicalReport` data.
      - This service will categorize cases by matching them to existing profiles or creating new ones.
      - **New Case Alerts:** If a case does not fit any existing profile, the service will flag it as an anomaly and generate a `SystemAlert` `Notification` for a designated medical review board, ensuring that novel cases receive prompt, high-level attention.
