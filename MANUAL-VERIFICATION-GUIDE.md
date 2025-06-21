# Manual Verification Guide for Telemedicine Platform

## Overview
This guide provides step-by-step instructions to manually verify all functionality of the telemedicine platform MVP.

## Prerequisites
- Platform should be running (containers started)
- Access to browser for testing
- Backend API running on port 5000
- Frontend running on port 5173

## Verification Steps

### 1. Platform Health Check
- **Backend Health**: Open http://localhost:5000/api/health
  - Expected: `{"status": "ok", "timestamp": "..."}`
- **Frontend Access**: Open http://localhost:5173
  - Expected: Login page loads successfully

### 2. Authentication Flow
#### Registration
1. Navigate to registration page
2. Fill in the form with:
   - Email: newuser@example.com
   - Password: password123
   - Role: patient (or doctor)
   - First Name: Test
   - Last Name: User
3. Click "Register"
4. Expected: Success message and redirect to login

#### Login
1. Navigate to login page
2. Use one of the test credentials:
   - Admin: `admin@telemedicine.com` / `admin123`
   - Doctor: `doctor@telemedicine.com` / `doctor123`
   - Patient: `patient@telemedicine.com` / `patient123`
3. Click "Login"
4. Expected: Redirect to appropriate dashboard

### 3. Patient Dashboard Verification
After logging in as a patient:

#### A. Dashboard Overview
- **URL**: `/patient/dashboard`
- **Expected Elements**:
  - Welcome message with patient name
  - Recent appointments section
  - Available doctors section
  - Quick actions (book appointment, view records)
  - Statistics cards (upcoming appointments, etc.)

#### B. Doctor Discovery
- **Location**: Available Doctors section on dashboard
- **Expected Features**:
  - List of doctors with names, specializations
  - Doctor ratings and experience
  - "View Profile" and "Book Appointment" buttons
  - Fallback to show all doctors if no recent ones

#### C. Appointment Booking
1. Click "Book Appointment" on a doctor card
2. **URL**: `/patient/appointments/new`
3. **Expected Form**:
   - Doctor selection (pre-filled if coming from doctor card)
   - Date picker
   - Time slots
   - Symptoms text area
   - Appointment type dropdown
4. Fill form and submit
5. Expected: Success message and appointment created

#### D. Appointments Management
1. Navigate to `/patient/appointments`
2. **Expected Features**:
   - List of patient's appointments
   - Filter by status (upcoming, completed, cancelled)
   - Appointment details (doctor, date, time, symptoms)
   - Actions (cancel, reschedule if applicable)

#### E. Medical Records
1. Navigate to `/patient/medical-records`
2. **Expected Features**:
   - List of medical records
   - Record details (date, doctor, diagnosis, treatment)
   - Search and filter functionality
   - Download/print options

### 4. Doctor Dashboard Verification
After logging in as a doctor:

#### A. Dashboard Overview
- **URL**: `/doctor/dashboard`
- **Expected Elements**:
  - Welcome message with doctor name
  - Today's appointments section
  - Patient management section
  - Quick statistics
  - Availability management

#### B. Appointments Management
1. Navigate to `/doctor/appointments`
2. **Expected Features**:
   - List of doctor's appointments
   - Filter by date, status
   - Appointment details with patient information
   - Actions (confirm, complete, cancel)

#### C. Patient Management
1. Navigate to `/doctor/patients`
2. **Expected Features**:
   - List of patients assigned to doctor
   - Patient details and contact information
   - Recent appointments history
   - Medical records access

#### D. Availability Management
1. Navigate to `/doctor/availability`
2. **Expected Features**:
   - Calendar view of availability
   - Add/edit available time slots
   - Block unavailable times
   - Recurring availability settings

#### E. Profile Management
1. Navigate to `/doctor/profile`
2. **Expected Features**:
   - Doctor profile information
   - Specialization, experience, bio
   - Contact information
   - Profile photo upload

### 5. Navigation Testing
#### Header Navigation
- Logo click returns to dashboard
- Navigation menu appropriate for user role
- Logout functionality works
- User profile display

#### Dashboard Navigation
- All dashboard cards/buttons link to correct pages
- Breadcrumbs work correctly
- Back navigation functions properly

### 6. API Endpoint Testing
You can test these endpoints directly:

#### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/doctors` - List all doctors

#### Protected Endpoints (require authentication)
- `GET /api/appointments` - User's appointments
- `POST /api/appointments` - Create appointment
- `GET /api/medical-records` - User's medical records
- `POST /api/medical-records` - Create medical record
- `GET /api/doctors/availability/:doctorId` - Doctor availability
- `PUT /api/doctors/availability` - Update doctor availability

### 7. Error Handling Verification
Test error scenarios:
- Invalid login credentials
- Booking appointment with invalid date
- Accessing protected routes without authentication
- Network errors (temporarily stop backend)

### 8. Responsive Design Testing
Test on different screen sizes:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

## Expected Results Summary

### ✅ Successful Verification Checklist
- [ ] Backend health endpoint responds correctly
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works and redirects appropriately
- [ ] Patient dashboard displays correctly with all sections
- [ ] Doctor discovery shows available doctors
- [ ] Appointment booking flow works end-to-end
- [ ] Appointments page displays user's appointments
- [ ] Medical records page shows patient records
- [ ] Doctor dashboard displays correctly (if testing doctor role)
- [ ] Doctor appointment management works
- [ ] Doctor availability management works
- [ ] Navigation between pages works correctly
- [ ] Logout functionality works
- [ ] Error handling works appropriately
- [ ] Responsive design works on different screen sizes

### 🔧 Troubleshooting
If any verification fails:
1. Check browser console for JavaScript errors
2. Check network tab for failed API calls
3. Verify backend logs: `docker-compose logs backend`
4. Verify frontend logs: `docker-compose logs frontend`
5. Restart services: `docker-compose restart`
6. Check database data: Connect to MongoDB and verify collections

### 📊 Test Data
The platform has test data including:
- Sample doctors with different specializations
- Sample patients
- Sample appointments
- Sample medical records

**Available Test Login Credentials:**
- **Admin**: `admin@telemedicine.com` / `admin123`
- **Doctor**: `doctor@telemedicine.com` / `doctor123`
- **Patient**: `patient@telemedicine.com` / `patient123`
- **Test Doctor**: `test.doctor@example.com` / `password123`
- **Test Patients**: 
  - `patient1@example.com` / `password123`
  - `patient2@example.com` / `password123`

### 🚀 Next Steps
After successful verification:
1. Document any issues found
2. Create production deployment plan
3. Set up monitoring and logging
4. Plan user acceptance testing
5. Prepare for production launch

---

*This verification guide ensures all major functionality of the telemedicine platform MVP is working correctly before production deployment.*
