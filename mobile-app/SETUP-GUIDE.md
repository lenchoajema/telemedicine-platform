# 📱 Mobile App Setup Guide

## 🚀 Quick Start

Your React Native mobile app is ready! Follow these steps to get it running:

### 1. Install Dependencies

```bash
cd /workspaces/telemedicine-platform/mobile-app
npm install
```

### 2. Start Development Server

```bash
npm start
# or
npx expo start
```

### 3. Test on Device

- **Option A**: Use Expo Go app
  - Install Expo Go from App Store/Play Store
  - Scan QR code from terminal
- **Option B**: Use simulator
  - Press `i` for iOS simulator
  - Press `a` for Android emulator

## 📱 What's Included

### ✅ Complete App Structure

- **Authentication**: Login/Register screens
- **Dashboard**: Role-based home screens
- **Appointments**: Booking and management
- **Doctors**: Discovery and profiles
- **Video Calls**: WebRTC consultations
- **Medical Records**: Health data management
- **Profile**: User settings

### ✅ Technical Features

- **React Native + Expo**: Modern mobile development
- **TypeScript**: Type safety
- **React Navigation**: Smooth navigation
- **Material Design**: Beautiful UI components
- **WebRTC**: Video calling
- **Socket.IO**: Real-time features
- **API Integration**: Connected to backend

### ✅ User Roles Supported

- **Patients**: Book appointments, video consultations
- **Doctors**: Manage schedule, consult patients
- **Admins**: System management (basic)

## 🔧 Development Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web

# Type checking
npm run type-check

# Lint code
npm run lint
```

## 🎯 Testing the App

### 1. Authentication Flow

- Test login/register screens
- Verify role-based navigation
- Check token persistence

### 2. Main Features

- Navigate between screens
- Test appointment booking flow
- Try video call interface
- Access medical records

### 3. API Integration

- Ensure backend is running at `https://telemedicine-platform-mt8a.onrender.com`
- Test API calls and responses
- Verify real-time updates

## 🔄 Backend Integration

The mobile app connects to your existing backend:

- **API Base URL**: `https://telemedicine-platform-mt8a.onrender.com/api`
- **WebSocket**: `https://telemedicine-platform-mt8a.onrender.com`
- **All endpoints**: Same as web platform

Make sure your backend server is running before testing the mobile app.

## 🎨 Customization

### Theme Configuration

Edit `src/utils/theme.ts` to customize:

- Colors
- Typography
- Spacing
- Component styles

### API Configuration

Edit `src/config/index.ts` to modify:

- API endpoints
- Environment settings
- Feature flags

## 🐛 Troubleshooting

### Common Issues:

1. **Dependencies not installed**: Run `npm install`
2. **Backend not running**: Start backend server
3. **Port conflicts**: Check if port 5000 is available
4. **Network issues**: Ensure devices are on same network

### Debug Tips:

- Use React Native Debugger
- Check console logs
- Verify API responses
- Test on different devices

## 🚀 Next Steps

1. **Test all features** on mobile device
2. **Customize branding** and colors
3. **Add more screens** if needed
4. **Implement push notifications**
5. **Prepare for app store** submission

## 📞 Support

The mobile app is fully integrated with your telemedicine platform. All the features from the web version are now available on mobile!

---

**Happy Mobile Development! 🎉**
