import { useState, useCallback } from 'react';

export const useRefresh = (callback: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await callback();
    } catch (error) {
      console.error('Error durante la actualización:', error);
    } finally {
      setRefreshing(false);
    }
  }, [callback]);

  return {
    refreshing,
    onRefresh,
  };
};
