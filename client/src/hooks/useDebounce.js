// quickfix-website/client/src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value.
 * The debounced value will only reflect the latest value after a specified delay.
 * Useful for optimizing expensive operations like search input handling.
 *
 * @param {any} value - The value to debounce.
 * @param {number} delay - The delay in milliseconds after which the value will be updated.
 * @returns {any} The debounced value.
 */
function useDebounce(value, delay) {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: This is called if the value or delay changes before the timeout,
    // or if the component unmounts. It clears the previous timer to prevent
    // the debounced value from updating with an outdated value.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run the effect if value or delay changes

  return debouncedValue;
}

export default useDebounce;