import { createContext, useContext } from 'react';

// Create the notification context
export const NotificationContext = createContext(null);

// Create a hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};