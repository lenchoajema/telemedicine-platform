# 📋 User List Guide - Telemedicine Platform

## Current Status
Your telemedicine platform is set up with MongoDB as the database and Express.js backend with user authentication.

## 🎯 Available Methods to Get User List

### Method 1: Direct MongoDB Query (Recommended)
If the Docker containers are running:

```bash
# Connect to MongoDB container
docker-compose exec mongodb mongosh

# In the MongoDB shell:
use telemedicine
db.users.find({}, {password: 0}).pretty()

# Count users
db.users.countDocuments()

# Get users by role
db.users.find({role: "doctor"}, {password: 0}).pretty()
db.users.find({role: "patient"}, {password: 0}).pretty()
```

### Method 2: Backend Script (If containers are running)
```bash
cd /workspaces/telemedicine-platform/backend
node src/scripts/listUsers.js
```

### Method 3: API Endpoints (Requires Authentication)

#### For Admin Users:
```bash
# Login as admin first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your_password"}'

# Use the token from login response
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/admin/users
```

#### Public Endpoints (Limited Info):
```bash
# Get doctors (public)
curl http://localhost:5000/api/doctors

# Health check
curl http://localhost:5000/api/health
```

### Method 4: Create and Test Users

#### Create Test Patient:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "password123", 
    "role": "patient",
    "profile": {
      "firstName": "Test",
      "lastName": "Patient"
    }
  }'
```

#### Create Test Doctor:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.com",
    "password": "password123",
    "role": "doctor", 
    "profile": {
      "firstName": "Dr. Test",
      "lastName": "Doctor",
      "specialization": "General Medicine",
      "licenseNumber": "DOC123456"
    }
  }'
```

## 🔧 Troubleshooting

### If No Users Exist:
1. **Create Initial Users**: Use the registration endpoints above
2. **Import Sample Data**: Run the sample data scripts
3. **Check Database**: Verify MongoDB connection and collections

### If Containers Aren't Running:
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs mongodb
```

### If Database Is Empty:
The system might be using a different database name or the collections might not be created yet. Check:

1. **Database Name**: Look at `MONGO_URI` in `backend/.env`
2. **Collections**: Use `db.getCollectionNames()` in MongoDB shell
3. **Connection**: Verify backend can connect to MongoDB

## 📊 Expected User Structure

Each user document should have:
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "role": "patient|doctor|admin",
  "profile": {
    "firstName": "First",
    "lastName": "Last",
    "specialization": "For doctors only",
    "licenseNumber": "For doctors only"
  },
  "status": "active|pending|suspended",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## 🚀 Quick Start

If you need users right now:
1. Start the platform: `docker-compose up -d`
2. Create test users using the curl commands above
3. Check users with: `docker-compose exec mongodb mongosh telemedicine --eval "db.users.find({}, {password: 0}).pretty()"`

---

**Need help?** Check the backend logs: `docker-compose logs backend`
