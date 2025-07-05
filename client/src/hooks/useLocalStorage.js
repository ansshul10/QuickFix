// quickfix-website/client/src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Custom hook for persisting state in local storage.
 * @param {string} key - The key under which to store the value in local storage.
 * @param {any} initialValue - The initial value to use if nothing is found in local storage.
 * @returns {[any, Function]} A stateful value, and a function to update it.
 */
function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass  a function to useState so localStorage is only called once
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error, return initialValue
      logger.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      logger.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;