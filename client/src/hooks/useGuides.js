// quickfix-website/client/src/hooks/useGuides.js
import { useContext } from 'react';
import { GuideContext } from '../context/GuideContext';

/**
 * Custom hook to access guide context.
 * Provides guide data, loading state, and guide-related actions.
 * @returns {object} GuideContext values.
 */
const useGuides = () => {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error('useGuides must be used within a GuideProvider');
  }
  return context;
};

export default useGuides;