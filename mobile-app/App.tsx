import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { theme } from './src/utils/theme';
import { Platform } from 'react-native';

// Polyfill for web compatibility
if (Platform.OS === 'web') {
  // @ts-ignore
  global.Buffer = require('buffer').Buffer;
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
        <Toast />
      </AuthProvider>
    </PaperProvider>
  );
}
