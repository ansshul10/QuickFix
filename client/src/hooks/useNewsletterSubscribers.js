// quickfix-website/client/src/hooks/useNewsletterSubscribers.js
import { useState, useEffect, useCallback } from 'react';
import * as newsletterService from '../services/newsletterService';
import { PAGINATION_DEFAULTS } from '../utils/constants';
import useDebounce from './useDebounce';

function useNewsletterSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULTS.PAGE_NUMBER);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchKeyword = useDebounce(searchInput, 500);

  const fetchSubscribers = useCallback(async () => {
    console.log('--- Hook Fetch Start ---', { currentPage, debouncedSearchKeyword });
    setLoading(true);
    setError(null);
    try {
      const res = await newsletterService.getNewsletterSubscribers({
        pageNumber: currentPage,
        pageSize: PAGINATION_DEFAULTS.PAGE_SIZE,
        keyword: debouncedSearchKeyword,
      });
      console.log('--- Hook Fetch Response ---', {
        data: res.data.data,
        count: res.data.count,
        page: res.data.page,
        pages: res.data.pages,
      });
      setSubscribers(Array.isArray(res.data.data) ? res.data.data : []);
      setTotalSubscribers(res.data.count || 0);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load subscribers.';
      console.error('--- Hook Fetch Error ---', errorMessage, err);
      setError(errorMessage);
      setSubscribers([]);
      setTotalSubscribers(0);
    } finally {
      setLoading(false);
      console.log('--- Hook Fetch End ---', { subscribers, totalSubscribers, loading: false });
    }
  }, [currentPage, debouncedSearchKeyword]);

  useEffect(() => {
    console.log('--- Hook useEffect Triggered ---', { currentPage, debouncedSearchKeyword });
    fetchSubscribers();
  }, [fetchSubscribers]);

  useEffect(() => {
    console.log('--- Hook Reset Page ---', { debouncedSearchKeyword });
    setCurrentPage(1);
  }, [debouncedSearchKeyword]);

  return {
    subscribers,
    loading,
    error,
    currentPage,
    totalSubscribers,
    searchInput,
    debouncedSearchKeyword,
    setSearchInput,
    setCurrentPage,
    fetchSubscribers,
  };
}

export default useNewsletterSubscribers;