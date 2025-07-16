import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import AppointmentsScreen from '../screens/Appointments/AppointmentsScreen';
import BookAppointmentScreen from '../screens/Appointments/BookAppointmentScreen';
import VideoCallScreen from '../screens/VideoCall/VideoCallScreenWeb';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import DoctorsScreen from '../screens/Doctors/DoctorsScreen';
import DoctorProfileScreen from '../screens/Doctors/DoctorProfileScreen';
import MedicalRecordsScreen from '../screens/MedicalRecords/MedicalRecordsScreen';
import AddMedicalRecordScreen from '../screens/MedicalRecords/AddMedicalRecordScreen';
import AppointmentDetailsScreen from '../screens/Appointments/AppointmentDetailsScreen';
import HelpScreen from '../screens/Support/HelpScreen';
import AboutScreen from '../screens/Support/AboutScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Patient Tab Navigator
const PatientTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;
        
        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Doctors':
            iconName = focused ? 'medical' : 'medical-outline';
            break;
          case 'Appointments':
            iconName = focused ? 'calendar' : 'calendar-outline';
            break;
          case 'Records':
            iconName = focused ? 'document-text' : 'document-text-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'home-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2a70e0',
      tabBarInactiveTintColor: 'gray',
      headerStyle: {
        backgroundColor: '#2a70e0',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Doctors" 
      component={DoctorsScreen}
      options={{ title: 'Find Doctors' }}
    />
    <Tab.Screen 
      name="Appointments" 
      component={AppointmentsScreen}
      options={{ title: 'My Appointments' }}
    />
    <Tab.Screen 
      name="Records" 
      component={MedicalRecordsScreen}
      options={{ title: 'Medical Records' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

// Doctor Tab Navigator
const DoctorTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;
        
        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Patients':
            iconName = focused ? 'people' : 'people-outline';
            break;
          case 'Schedule':
            iconName = focused ? 'calendar' : 'calendar-outline';
            break;
          case 'Analytics':
            iconName = focused ? 'analytics' : 'analytics-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'home-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2a70e0',
      tabBarInactiveTintColor: 'gray',
      headerStyle: {
        backgroundColor: '#2a70e0',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={HomeScreen} />
    <Tab.Screen name="Patients" component={AppointmentsScreen} />
    <Tab.Screen name="Schedule" component={AppointmentsScreen} />
    <Tab.Screen name="Analytics" component={HomeScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main App Stack
const AppStack = () => {
  const { user } = useAuth();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={user?.role === 'doctor' ? DoctorTabs : PatientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BookAppointment" 
        component={BookAppointmentScreen}
        options={{ 
          title: 'Book Appointment',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="VideoCall" 
        component={VideoCallScreen}
        options={{ 
          title: 'Video Consultation',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="DoctorProfile" 
        component={DoctorProfileScreen}
        options={{ 
          title: 'Doctor Profile',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="AddMedicalRecord" 
        component={AddMedicalRecordScreen}
        options={{ 
          title: 'Add Medical Record',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Edit Profile',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ 
          title: 'Settings',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="AppointmentDetails" 
        component={AppointmentDetailsScreen}
        options={{ 
          title: 'Appointment Details',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ 
          title: 'Help & Support',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ 
          title: 'About',
          headerStyle: { backgroundColor: '#2a70e0' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};

// Main App Navigator
export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or loading screen
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
