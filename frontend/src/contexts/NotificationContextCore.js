import { createContext, useContext } from 'react';

// Create the notification context
export const NotificationContext = createContext(null);

// Re-export the hook from the core file
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.warn('useNotifications must be used within a NotificationProvider');
    return {};
  }
  return context;
};