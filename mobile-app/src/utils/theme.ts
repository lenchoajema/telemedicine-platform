import { DefaultTheme } from 'react-native-paper';

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
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
