Entity-Relationship Diagram (ERD)

### Real-Time Schedule Integrity & Slot Reservation Plan (with Doctor Availability Management Flow)

This section extends the slot reservation pattern to how a doctor (or delegate) defines, updates, and safely publishes availability so that only authoritative, non-overlapping, race-safe slots can ever be booked.

---

## A. Data Model (Additions for Availability Authoring)

Tables / Columns (new or extend):
- AvailabilityTemplates  
  - TemplateID PK  
  - DoctorID FK  
  - Version INT (optimistic concurrency)  
  - RulesJSON JSON (e.g., RFC 5545–like: weekdays, start/end, duration, breaks)  
  - TimeZone VARCHAR(64)  
  - IsActive BOOLEAN  
  - UpdatedAt DATETIME
- AvailabilityExceptions  
  - ExceptionID PK  
  - DoctorID FK  
  - Date DATE  
  - Type ENUM('Blackout','AddSlot','Modify')  
  - PayloadJSON JSON (e.g., added blocks, removed blocks)  
  - CreatedAt DATETIME
- Schedules (extend if missing):  
  - SourceTemplateVersion INT NULL  
  - SlotType ENUM('Consult','FollowUp','Group') DEFAULT 'Consult'  
  - Version INT DEFAULT 0  
  - HoldExpiresAt DATETIME NULL

Indexes:
- IX_AvailabilityTemplates_Doctor (DoctorID, IsActive)
- IX_AvailabilityExceptions_DoctorDate (DoctorID, Date)
- Existing: (DoctorID, StartTime) for Schedules

---

## B. Authoring Flow (Pattern: draft → preview → publish → incremental diff)

1. Fetch Current Template  
   GET /api/doctors/{doctorId}/availability/template  
   Returns RulesJSON, Version, TimeZone.

2. Edit Template (client-side form; not yet persisted).  
   Fields: weekday rules, start/end, slot length, buffer minutes, break windows.

3. Validate & Preview (no persistence)  
   POST /api/doctors/{doctorId}/availability/preview  
   Body: { rulesJson, from, to, exceptions? }  
   Server:
   - Expand recurrence to candidate slots.
   - Apply exceptions (blackouts remove, additions insert, modifies adjust).
   - Remove collisions with existing booked Schedules (preserve those).
   - Return: { generated: [...slots], conflicts: [...existingBooked], summary }.

4. Publish (Transactional)  
   POST /api/doctors/{doctorId}/availability/publish  
   Body: { rulesJson, baseVersion, from, to, regenerateMode }  
   regenerateMode ENUM:
   - 'AppendMissing' (only insert absent free slots)
   - 'ReplaceUnbooked' (delete/replace any unbooked generated slot in window)
   Steps (transaction):
   - Check template Version == baseVersion (optimistic concurrency).
   - Lock doctor template row FOR UPDATE.
   - Recompute target slot set.
   - For each existing Schedule in window:
     - If booked → keep (never delete).
     - If unbooked and in new set → mark keep.
     - If unbooked and not in new set and mode='ReplaceUnbooked' → delete.
   - Insert new slots (IsBooked=false, SourceTemplateVersion updated).
   - Increment template Version; persist rules.
   - Emit event AvailabilityPublished (with counts: added, kept, removed).
   Returns diff summary.

5. Exceptions Management  
   - POST /api/doctors/{doctorId}/availability/exceptions  
     Body: { date, type, payloadJson }  
     On publish/preview engine merges exceptions.
   - DELETE /api/doctors/{doctorId}/availability/exceptions/{id}

6. Incremental Regeneration (Nightly or On-Demand)  
   Job expands template + exceptions to a rolling horizon (e.g., next 30 days) using same logic (AppendMissing). Ensures future slots exist early for patient booking.

---

## C. Slot Reservation (Reuse Existing Hold → Confirm Pattern)

Unchanged from slot integrity plan:
- GET /api/doctors/{id}/slots?from=&to= returns only authoritative free (non-held, non-booked) Schedules including slotHash (HMAC).
- POST /api/appointments/holds { scheduleId, slotHash } sets HoldExpiresAt.
- POST /api/appointments { holdId ... } converts to Appointment & flips IsBooked=true.

Applies seamlessly because Schedules are only created by publish step (no ad‑hoc orphan slots).

---

## D. Concurrency & Integrity Safeguards

- Optimistic concurrency: AvailabilityTemplates.Version; reject publish with 409 if stale.
- Pessimistic row lock on publish to avoid concurrent publishes racing.
- Never delete booked Schedules; regeneration is conservative.
- Hash-based slot integrity (HMAC) prevents forged client manipulation of Start/End.
- Exceptions are immutable once applied to a published window unless re‑published (audit trail).

---

## E. API Summary (New / Extended)

GET  /api/doctors/{doctorId}/availability/template  
PUT  /api/doctors/{doctorId}/availability/template (optional simple update w/out publish for metadata like TimeZone)  
POST /api/doctors/{doctorId}/availability/preview  
POST /api/doctors/{doctorId}/availability/publish  
GET  /api/doctors/{doctorId}/availability/exceptions?from=&to=  
POST /api/doctors/{doctorId}/availability/exceptions  
DELETE /api/doctors/{doctorId}/availability/exceptions/{exceptionId}  
(Existing booking endpoints unchanged)

---

## F. Validation Rules

Template rules:
- Slot length within allowed set (e.g., 10–120 minutes).
- Start < End; total daily duration ≤ policy limit.
- Buffers not negative and align with slot length.
Preview/Publish:
- from <= to; horizon limited (e.g., max 90 days).
- TimeZone is valid IANA.
- No overlapping generated slots.
- ReplaceUnbooked mode forbidden if it would leave a day empty (optional policy).

---

## G. Audit & Metrics

AuditLog ActionTypes:
- AvailabilityTemplatePreview (doctorId, horizon, addedCount)
- AvailabilityTemplatePublish (doctorId, added, removed, kept, mode, versionFrom→To)
- AvailabilityExceptionCreate/Delete
- SlotHoldCreated / SlotHoldExpired / AppointmentBooked (already defined)

Metrics:
- availability_slots_generated_total
- availability_slots_removed_total
- availability_publish_duration_ms
- availability_publish_conflicts_total (stale version)
- slot_fill_rate_percent (booked / total generated per day)

---

## H. Failure & Edge Cases

- Stale Version → 409 with latest template payload (client prompts user to reload).
- Partial generation fail (e.g., invalid rule) → 422 with validationErrors array.
- Attempt to remove booked slot via ReplaceUnbooked → system silently keeps; counts surfaced in diff.remainedBooked.
- Timezone shift: On detection, require forced ReplaceUnbooked to realign offsets (warn user).

---

## I. Reusable Generic Pattern (Availability Authoring)

Generic steps (resource = doctor availability):
1. Define recurrence rules (RulesJSON).
2. Preview expansion (no commit).
3. Publish with diff & optimistic version.
4. Incremental regeneration job.
5. Query authoritative schedules → hold → confirm.

This can be cloned for other reservable resources (e.g., group sessions, equipment rooms) by substituting DoctorID with ResourceID and Schedules with ResourceSlots.

---

## J. Minimal Example (RulesJSON sketch)

```json
{
  "weekdays": {
    "MON": [{ "start": "09:00", "end": "12:00" }, { "start": "13:00", "end": "17:00" }],
    "TUE": [{ "start": "09:00", "end": "16:00" }],
    "WED": [],
    "THU": [{ "start": "10:00", "end": "14:00" }],
    "FRI": [{ "start": "09:00", "end": "12:00" }]
  },
  "slotLengthMinutes": 30,
  "bufferMinutes": 5,
  "breaks": [{ "weekday": "MON", "start": "11:00", "end": "11:15" }]
}
```

---

## K. Frontend Flow (Doctor Settings › Availability Tab)

1. Load template (GET template) → populate form.  
2. User edits rules → click “Preview” → show generated calendar heatmap + diff.  
3. User chooses mode (Append vs Replace) → Publish.  
4. On success: toast summary (Added X, Removed Y, Kept Z).  
5. Calendar refresh queries /api/doctors/{id}/slots to reflect updated free slots (patients view).  

---

Result: A consistent, auditable, race-safe pipeline from availability authoring to booking confirmation using a single authoritative Schedules table and a generic hold-confirm reservation pattern.



## User Settings & Profile Management Plan

Goal: Persist and expose unified, secure, auditable user settings (profile, medical, notifications, privacy, security, household, billing, insurance) with simple frontend access and clear separation of concerns.

### 1. Data Model (New / Extended)

Core (existing Users table assumed):
- Users: UserID PK, Email (unique), Status, CreatedAt, UpdatedAt

Profile (low‑risk mutable):
- UserProfile  
  - UserID PK/FK  
  - FirstName, LastName  
  - Phone (E.164)  
  - DateOfBirth DATE (nullable)  
  - Gender ENUM('Male','Female','Other','PreferNot')  
  - AddressLine1, AddressLine2, City, State, PostalCode, Country  
  - EmergencyContactName, EmergencyContactPhone  
  - PrimaryDoctorID FK (Doctor table) NULL  
  - Version INT (optimistic concurrency)  
  - UpdatedAt

Medical (PHI – stricter audit):
- MedicalProfile  
  - UserID PK/FK  
  - BloodType ENUM(...) NULL  
  - Allergies TEXT (comma or JSON array)  
  - CurrentMedications TEXT (structured JSON preferred)  
  - MedicalConditions TEXT (JSON)  
  - Version INT  
  - UpdatedAt

Insurance (multiple):
- InsurancePolicies  
  - PolicyID PK  
  - UserID FK  
  - ProviderName, PlanName  
  - MemberID, PolicyNumber, GroupNumber  
  - IsPrimary BOOLEAN  
  - Status ENUM('Active','Inactive')  
  - EffectiveFrom, EffectiveTo NULL  
  - CreatedAt, UpdatedAt

Notifications:
- NotificationPreferences  
  - UserID PK/FK  
  - AppointmentReminders BOOLEAN  
  - EmailGeneral BOOLEAN  
  - SmsGeneral BOOLEAN  
  - MedicationReminders BOOLEAN  
  - HealthContent BOOLEAN  
  - Marketing BOOLEAN  
  - Version INT  
  - UpdatedAt

Privacy:
- PrivacySettings  
  - UserID PK/FK  
  - ShareWithProviders BOOLEAN  
  - ShareAnonymizedResearch BOOLEAN  
  - ShareWithInsurance BOOLEAN  
  - PublicProfileVisible BOOLEAN  
  - Version INT  
  - UpdatedAt

Security:
- SecuritySettings  
  - UserID PK/FK  
  - PasswordHash (existing)  
  - TwoFactorEnabled BOOLEAN  
  - TwoFactorType ENUM('App','SMS','Email') NULL  
  - LastPasswordChangeAt  
  - Version INT  
  - UpdatedAt

Household (delegation):
- HouseholdMemberships  
  - MembershipID PK  
  - OwnerUserID FK  
  - MemberUserID FK  
  - Role ENUM('Owner','Adult','Child','Caregiver')  
  - Status ENUM('Active','Invited','Revoked')  
  - CreatedAt  
  - ActingSessionExpiresAt NULL

Billing & Payments:
- PaymentMethods  
  - PaymentMethodID PK  
  - UserID FK  
  - Provider ENUM('Stripe','Adyen','Mock')  
  - ExternalRef (token)  
  - Brand, Last4, ExpMonth, ExpYear, CardholderName  
  - BillingAddressJSON  
  - IsDefault BOOLEAN  
  - CreatedAt, UpdatedAt
- Invoices (existing or new)  
  - InvoiceID PK, UserID FK, Amount, Currency, Status, CreatedAt
- Payments  
  - PaymentID PK, InvoiceID FK, UserID FK, Amount, Status, Provider, CreatedAt

Quotes (demo):
- ServiceQuotes  
  - QuoteID PK  
  - UserID FK  
  - Region, PayerType ENUM('SelfPay','Insurance')  
  - PayloadJSON (itemized)  
  - Status ENUM('Draft','Accepted','Expired')  
  - CreatedAt, ExpiresAt

Audit:
- AuditLog (already pattern) extend ActionTypes for each category update.

Indexes: FK indexes; unique (UserID, IsPrimary) FILTER(IsPrimary) on InsurancePolicies; unique(UserID) on singleton tables.

### 2. API Endpoints (Grouped / Modular)

Aggregated (for simple page load):
- GET /api/users/{userId}/settings  
  Returns: { profile, medical, insurance[], notifications, privacy, securityMeta, householdMembers[], paymentMethods[], quotes[], invoices[], payments[] (paged) }

Category CRUD (all with optimistic version except read):
- GET /api/users/{userId}/profile
- PUT /api/users/{userId}/profile { payload, version }
- GET /api/users/{userId}/medical
- PUT /api/users/{userId}/medical { ... , version }
- GET /api/users/{userId}/notifications
- PUT /api/users/{userId}/notifications { ... , version }
- GET /api/users/{userId}/privacy
- PUT /api/users/{userId}/privacy { ... , version }
- PUT /api/users/{userId}/security/password { currentPassword, newPassword }
- PUT /api/users/{userId}/security/2fa { enable, type }
- Household:
  - POST /api/users/{userId}/household/invitations { email, role }
  - POST /api/users/{userId}/household/{memberId}/act
  - POST /api/users/{userId}/household/stopActing
  - GET  /api/users/{userId}/household
- Insurance:
  - GET /api/users/{userId}/insurance
  - POST /api/users/{userId}/insurance
  - PUT /api/users/{userId}/insurance/{policyId}
  - POST /api/users/{userId}/insurance/{policyId}/primary
  - DELETE /api/users/{userId}/insurance/{policyId}
- Payment Methods:
  - GET /api/users/{userId}/payment-methods
  - POST /api/users/{userId}/payment-methods (tokenization flow)
  - POST /api/users/{userId}/payment-methods/{id}/default
  - DELETE /api/users/{userId}/payment-methods/{id}
- Quotes / Billing (minimal):
  - POST /api/users/{userId}/quotes { region, payerType, services[] }
  - GET /api/users/{userId}/quotes
  - POST /api/users/{userId}/quotes/{quoteId}/checkout
  - GET /api/users/{userId}/invoices
  - GET /api/users/{userId}/payments

### 3. Aggregation Strategy

- Single composite endpoint hydrates UI with parallel reads (fan-out) server-side → reduced round trips.
- ETag or compositeVersion hash (SHA256 of concatenated category versions) for conditional GET / caching.
- Client updates categories independently; after PUT success refresh just changed slice (not entire page).

### 4. Versioning & Concurrency

- Each singleton table row carries Version INT incremented on update.
- PUT rejects if version mismatch → 409 returns latest payload & version.
- Aggregated endpoint includes per-section version enabling optimistic UI forms.

### 5. Security & Privacy

- RBAC middleware ensures user or acting caregiver with granted scope.
- Household acting elevation issues short-lived acting token (JWT claim acting_as).
- Encryption at rest for PHI fields (Allergies, Medications, Conditions) via envelope (KMS).
- Sensitive write actions audited: ProfileUpdate, MedicalUpdate, PrivacySettingsUpdate, SecurityPasswordChange, TwoFactorEnabled, InsurancePolicyAdd, PaymentMethodAdd, HouseholdInvite, HouseholdActStart/Stop.
- Rate limit password & 2FA endpoints.
- Mask sensitive fields (Last4 only) in logs.
- Data minimization: aggregated response excludes password hash, 2FA secrets.

### 6. Validation Highlights

Profile: phone E.164, age >= 13 (policy), postal formats.  
Medical: JSON arrays length limits; medication entries (name, dose, frequency).  
Insurance: only one primary; dates consistent.  
Notifications: at least one channel required for appointment reminders if reminders enabled.  
Security: password complexity + breach check.  
Household: cannot remove self as owner; acting only if member status Active.

### 7. Frontend UX Simplification

- Tabbed sections mirror categories; each tab loads slice if not already cached.
- Save buttons per section; disable if no local diff (dirty tracking).
- Global toast: “Profile saved”, etc.
- Inline version conflict dialog: show merged fields; user re-applies edits.
- Insurances & Payment Methods use modal forms.
- Household acting banner with clear exit action.

### 8. Sample Aggregated Response (Truncated)

```json
{
  "profile": { "firstName": "Jane", "lastName": "Doe", "phone": "+11234567890", "dateOfBirth": "1990-05-15", "gender": "Other", "address": { "line1": "...", "city": "...", "state": "...", "postalCode": "...", "country": "US" }, "emergencyContact": { "name": "", "phone": "" }, "primaryDoctorId": null, "version": 3 },
  "medical": { "bloodType": "O+", "allergies": ["Penicillin","Shellfish"], "currentMedications": [{"name":"Lisinopril","dose":"10mg","schedule":"Daily"}], "conditions": ["Hypertension"], "version": 2 },
  "insurance": [],
  "notifications": { "appointmentReminders": true, "emailGeneral": true, "smsGeneral": true, "medicationReminders": true, "healthContent": true, "marketing": false, "version": 5 },
  "privacy": { "shareWithProviders": true, "shareAnonymizedResearch": true, "shareWithInsurance": false, "publicProfileVisible": false, "version": 1 },
  "securityMeta": { "twoFactorEnabled": false, "lastPasswordChangeAt": "2025-08-01T10:15:00Z", "version": 4 },
  "householdMembers": [{ "userId": 100, "name": "Jane Doe", "role": "Owner" }],
  "paymentMethods": [],
  "quotes": [],
  "invoices": [],
  "payments": [],
  "compositeVersion": "b4f7c3c8..."
}
```

### 9. Migration Plan

1. Create new tables (idempotent migration scripts).
2. Backfill UserProfile from legacy user table fields.
3. Initialize singleton rows for existing users (notifications defaults, privacy defaults).
4. Deploy read endpoints (phase 1) returning defaults if rows missing.
5. Deploy write endpoints (phase 2).
6. Cutover frontend to new aggregated endpoint.
7. Deprecate legacy profile APIs after monitoring (30 days).
8. Add analytics dashboards (update rates, conflict rate, household usage).

### 10. Monitoring & Metrics

- user_profile_update_total
- medical_profile_update_total
- notification_pref_update_total
- privacy_settings_update_total
- security_password_change_total
- household_act_sessions_active
- payment_method_add_total
- insurance_policy_primary_switch_total
- settings_version_conflict_total

### 11. Reuse & Extensibility

Pattern (singleton row + version) can be cloned for future modules (e.g., Care Plans, Consents). Aggregated endpoint scalable: add new slice + compositeVersion recalculation.

### 12. Alignment With Existing System

- PrimaryDoctorID aligns with scheduling domain (link to DoctorID used in Schedules).
- Acting-as model reuses existing auth token issuance; slot booking on behalf of dependent uses acting claim for audit.
- Audit and metrics naming consistent with existing Availability audit scheme.

Result: A modular, versioned, secure user settings architecture enabling permanent, simple access while maintaining integrity, privacy, and low-latency UI hydration.
