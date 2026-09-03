import { useState, useCallback } from 'react';

interface UseCreditsReturn {
  userCredits: number;
  isOutOfCredits: boolean;
  handleTopUp: (amount: number) => void;
  consumeCredit: () => boolean;
  setCredits: (amount: number) => void;
}

export function useCredits(initialCredits = 10): UseCreditsReturn {
  const [userCredits, setUserCredits] = useState(initialCredits);

  const isOutOfCredits = userCredits <= 0;

  const handleTopUp = useCallback((amount: number) => {
    setUserCredits((prev) => prev + Math.max(0, Math.floor(amount)));
  }, []);

  const consumeCredit = useCallback((): boolean => {
    let success = false;
    setUserCredits((prev) => {
      if (prev > 0) {
        success = true;
        return prev - 1;
      }
      return prev;
    });
    return success;
  }, []);

  const setCredits = useCallback((amount: number) => {
    setUserCredits(Math.max(0, Math.floor(amount)));
  }, []);

  return {
    userCredits,
    isOutOfCredits,
    handleTopUp,
    consumeCredit,
    setCredits,
  };
}