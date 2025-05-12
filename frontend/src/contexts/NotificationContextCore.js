import { createContext, useContext } from 'react';

// Create the notification context
export const NotificationContext = createContext(null);

// Re-export the hook from the core file
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};