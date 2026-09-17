import { useState, useCallback, useEffect } from 'react';

interface CreditPackage {
  id: string;
  credits: number;
  price: number; // in cents
  name: string;
}

interface UseCreditsReturn {
  userCredits: number;
  isOutOfCredits: boolean;
  handleTopUp: (amount: number) => void;
  consumeCredit: () => boolean;
  setCredits: (amount: number) => void;
  refreshCredits: (userId: string) => Promise<void>;
  initiateCheckout: (packageId: string, userId: string) => Promise<void>;
  creditPackages: CreditPackage[];
  isLoadingCheckout: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },
  { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack' },
  { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack' },
  { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack' },
];

export function useCredits(initialCredits = 0): UseCreditsReturn {
  // This is just a local DISPLAY cache now. The server (Redis) is the real
  // source of truth for whether a chat message is actually allowed.
  const getInitialCredits = () => {
    const savedCredits = localStorage.getItem('velvetcrush_credits');
    return savedCredits ? parseInt(savedCredits, 10) : initialCredits;
  };
  const [userCredits, setUserCredits] = useState(getInitialCredits);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  useEffect(() => {
    localStorage.setItem('velvetcrush_credits', userCredits.toString());
  }, [userCredits]);

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

  // Pulls the REAL balance from the server and syncs the local display cache to match.
  const refreshCredits = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/credits?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      if (response.ok && typeof data.credits === "number") {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  }, [setCredits]);

  const initiateCheckout = useCallback(async (packageId: string, userId: string) => {
    setIsLoadingCheckout(true);

    try {
      const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!pkg) {
        throw new Error('Invalid package');
      }
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Failed to start checkout: ${error.message}`);
    } finally {
      setIsLoadingCheckout(false);
    }
  }, []);

  return {
    userCredits,
    isOutOfCredits,
    handleTopUp,
    consumeCredit,
    setCredits,
    refreshCredits,
    initiateCheckout,
    creditPackages: CREDIT_PACKAGES,
    isLoadingCheckout,
  };
}