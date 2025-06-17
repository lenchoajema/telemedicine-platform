import { createContext, useContext } from 'react';

// Create the notification context
export const NotificationContext = createContext(null);

// Re-export the hook from the core file
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
<<<<<<< HEAD
    throw new Error('useNotifications must be used within a NotificationProvider');
=======
    console.warn('useNotifications must be used within a NotificationProvider');
    return {};
>>>>>>> a67abca257d39517a26d636c680d417d5adda03f
  }
  return context;
};