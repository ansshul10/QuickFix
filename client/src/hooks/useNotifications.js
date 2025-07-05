// quickfix-website/client/src/hooks/useNotifications.js
import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

/**
 * Custom hook to access notification context.
 * Provides notifications data, loading state, unread count, and notification actions.
 * @returns {object} NotificationContext values.
 */
const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default useNotifications;