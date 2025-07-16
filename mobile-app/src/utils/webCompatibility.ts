// Web compatibility fixes for React Native
import { Platform } from 'react-native';

// Fix for shadow props deprecation warnings
export const createWebSafeStyle = (style: any) => {
  if (Platform.OS !== 'web') return style;
  
  const webSafeStyle = { ...style };
  
  // Replace deprecated shadow props with boxShadow
  if (webSafeStyle.shadowColor || webSafeStyle.shadowOffset || webSafeStyle.shadowOpacity || webSafeStyle.shadowRadius) {
    const shadowColor = webSafeStyle.shadowColor || '#000';
    const shadowOffsetWidth = webSafeStyle.shadowOffset?.width || 0;
    const shadowOffsetHeight = webSafeStyle.shadowOffset?.height || 2;
    const shadowOpacity = webSafeStyle.shadowOpacity || 0.25;
    const shadowRadius = webSafeStyle.shadowRadius || 4;
    
    webSafeStyle.boxShadow = `${shadowOffsetWidth}px ${shadowOffsetHeight}px ${shadowRadius}px rgba(0,0,0,${shadowOpacity})`;
    
    // Remove deprecated shadow props
    delete webSafeStyle.shadowColor;
    delete webSafeStyle.shadowOffset;
    delete webSafeStyle.shadowOpacity;
    delete webSafeStyle.shadowRadius;
  }
  
  // Fix elevation for web
  if (webSafeStyle.elevation && Platform.OS === 'web') {
    const elevation = webSafeStyle.elevation;
    webSafeStyle.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.15)`;
    delete webSafeStyle.elevation;
  }
  
  return webSafeStyle;
};

// Fix for useNativeDriver warnings
export const getAnimationConfig = (useNativeDriver = true) => {
  return Platform.OS === 'web' ? { useNativeDriver: false } : { useNativeDriver };
};

// Fix for pointerEvents
export const getPointerEvents = (pointerEvents: 'auto' | 'none' | 'box-none' | 'box-only') => {
  if (Platform.OS === 'web') {
    return { style: { pointerEvents } };
  }
  return { pointerEvents };
};

// Fix for WebSocket connection issues in development
export const suppressWebSocketErrors = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Override console.error to filter out WebSocket connection errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Suppress known WebSocket errors in development
      if (
        message.includes('WebSocket connection') ||
        message.includes('_expo/ws') ||
        message.includes('WebSocketClient.js') ||
        message.includes('Connection failed')
      ) {
        return; // Suppress these specific errors
      }
      
      // Allow other errors to be displayed
      originalConsoleError.apply(console, args);
    };
    
    // Also suppress WebSocket warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('WebSocket') || message.includes('_expo/ws')) {
        return; // Suppress WebSocket warnings
      }
      
      originalConsoleWarn.apply(console, args);
    };
  }
};
