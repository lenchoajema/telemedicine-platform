import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { theme } from './src/utils/theme';
import { Platform, LogBox } from 'react-native';
import { suppressWebSocketErrors } from './src/utils/webCompatibility';

// Polyfill for web compatibility
if (Platform.OS === 'web') {
  // @ts-ignore
  global.Buffer = require('buffer').Buffer;
  
  // Suppress WebSocket connection errors for development
  suppressWebSocketErrors();
}

// Suppress known warnings for React Native Web
LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
  'useNativeDriver.*is not supported',
  'Animated: `useNativeDriver`',
  'WebSocket connection.*failed',
  'WebSocketClient.js',
  '_expo/ws.*failed',
]);

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
