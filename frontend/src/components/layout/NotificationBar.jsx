import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationBar() {
  const { notifications, removeNotification } = useNotifications();
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div key={notification.id} className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => removeNotification(notification.id)}>×</button>
        </div>
      ))}
    </div>
  );
}