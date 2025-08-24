# Telemedicine Platform

Minimal quickstart and developer notes for the Telemedicine Platform repository.

## Quick start (local with Docker)

1. Copy example env and edit values:

   cp .env.example .env

2. Build and start services with Docker Compose:

   docker-compose up --build

3. Check backend health endpoint:

   curl -s http://localhost:5000/api/health

## Project contents

- `backend/` - backend services and API
- `docker-compose.yml` - compose setup for local development
- `create-test-data.js`, `comprehensive-test.js`, etc. - test and utility scripts

## Contributing

Please open issues or PRs. See `IMPLEMENTATION_PLAN.md` for high-level tasks.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

# 🏥 Telemedicine Platform

A comprehensive telemedicine platform with web and mobile applications for patients, doctors, and administrators.

## 🚀 Platform Overview

This platform provides:

- **Web Application**: Full-featured React web app
- **Mobile Application**: React Native + Expo mobile app
- **Backend API**: Node.js + Express server
- **Database**: MongoDB
- **Video Calling**: WebRTC integration
- **Real-time Features**: Socket.IO

## 📱 Applications

### 🌐 Web Application

- **Location**: `/frontend/`
- **Tech Stack**: React + Vite + TypeScript
- **Access**: http://localhost:5173
- **Features**: Complete web-based telemedicine platform

### 📱 Mobile Application

- **Location**: `/mobile-app/`
- **Tech Stack**: React Native + Expo + TypeScript
- **Features**: Native mobile app for iOS and Android
- **Setup**: See [Mobile App Setup Guide](mobile-app/SETUP-GUIDE.md)

### 🔧 Backend API

- **Location**: `/backend/`
- **Tech Stack**: Node.js + Express + MongoDB
- **Access**: http://localhost:5000
- **Features**: REST API + WebSocket server

## 🚀 Quick Start

### 1. Start the Platform

```bash
# Start all services (web + backend + database)
docker-compose up --build
```

### 2. Access Applications

- **Web App**: http://localhost:5173
- **API**: http://localhost:5000
- **Database**: mongodb://localhost:27017

### 3. Start Mobile App

```bash
cd mobile-app
npm install
npm start
```

## 🔧 Development Commands

### Backend Services

```bash
# Start all services
docker-compose up --build

# Clean restart
docker system prune -af && docker-compose down && docker-compose up --build

# Check backend logs
docker logs $(docker ps -qf "name=backend") --tail 50

# Check database users
docker exec telemedicine-platform-mongodb-1 mongosh telemedicine --eval "db.users.find({}, {email: 1, role: 1, 'profile.firstName': 1, 'profile.lastName': 1}).forEach(function(u) { print(u.email + ' (' + u.role + ')'); });" --quiet
```

### Mobile App

```bash
cd mobile-app
npm install      # Install dependencies
npm start        # Start Expo dev server
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
```

## 🎯 Features

### For Patients

- Register and login
- Browse and book doctors
- Video consultations
- Medical records access
- Prescription management

### For Doctors

- Professional dashboard
- Manage appointments
- Video consultations
- Patient records
- Availability scheduling

### For Administrators

- User management
- System oversight
- Analytics dashboard
- Doctor verification

## 📊 Status

- **Web Platform**: ✅ Production Ready
- **Mobile App**: ✅ Development Ready
- **Backend API**: ✅ Production Ready
- **Database**: ✅ Production Ready
- **Video Calling**: ✅ Fully Functional
- **Authentication**: ✅ Secure & Verified

## 📱 Mobile App Features

The mobile app includes all web platform features:

- Native iOS and Android apps
- WebRTC video calling
- Real-time notifications
- Offline capabilities
- Push notifications ready
- App store deployment ready

## 🔗 Integration

Both web and mobile applications share:

- Same backend API
- Same database
- Same user accounts
- Same appointment system
- Same video calling infrastructure

## 📚 Documentation

- [Platform Status Report](PLATFORM-STATUS-REPORT.md)
- [Verified Workflow Summary](VERIFIED-WORKFLOW-SUMMARY.md)
- [Mobile App Setup Guide](mobile-app/SETUP-GUIDE.md)
- [Mobile App Status Report](MOBILE-APP-STATUS-REPORT.md)

---

**🎉 Your telemedicine platform is now available on web and mobile! 🎉**
