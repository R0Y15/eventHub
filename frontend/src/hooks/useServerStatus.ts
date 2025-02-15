import { useState, useEffect } from 'react';
import axios from 'axios';

export const useServerStatus = () => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkServer = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}`);
      if (response.data.includes('Event Management API is running')) {
        setIsServerReady(true);
        setIsLoading(false);
      }
    } catch (err) {
      setError('Firing up the server...');
      // Retry after 3 seconds
      setTimeout(checkServer, 3000);
    }
  };

  useEffect(() => {
    checkServer();
  }, []);

  return { isServerReady, isLoading, error };
}; 