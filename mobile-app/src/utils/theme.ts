import { DefaultTheme } from 'react-native-paper';
import { Platform } from 'react-native';

// Web-safe shadow helper
const createShadow = (elevation: number, opacity = 0.25) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,${opacity})`,
    };
  }
  return {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: elevation / 2,
    },
    shadowOpacity: opacity,
    shadowRadius: elevation,
    elevation,
  };
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2a70e0',
    accent: '#3498db',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#2c3e50',
    placeholder: '#7f8c8d',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    error: '#e74c3c',
    success: '#27ae60',
    warning: '#f39c12',
    info: '#3498db',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal' as 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: 'bold' as 'bold',
    },
  },
};

export const spacing = {
  xs: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
  xxlarge: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: createShadow(3, 0.22),
  md: createShadow(5, 0.25),
  lg: createShadow(8, 0.3),
};
