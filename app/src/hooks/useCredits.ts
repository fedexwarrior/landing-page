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
  // Stripe integration
  initiateCheckout: (packageId: string) => Promise<void>;
  creditPackages: CreditPackage[];
  isLoadingCheckout: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },      // $5.00
  { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack' },    // $10.00
  { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack' },   // $20.00
  { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack' },    // $50.00
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useCredits(initialCredits = 10): UseCreditsReturn {
  // Initialize from localStorage if available
  const getInitialCredits = () => {
    const savedCredits = localStorage.getItem('velvetcrush_credits');
    return savedCredits ? parseInt(savedCredits, 10) : initialCredits;
  };

  const [userCredits, setUserCredits] = useState(getInitialCredits);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  // Save credits to localStorage on change
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

  // Stripe checkout integration
  const initiateCheckout = useCallback(async (packageId: string) => {
    setIsLoadingCheckout(true);
    
    try {
      const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!pkg) {
        throw new Error('Invalid package');
      }

      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId: localStorage.getItem('velvetcrush_user_id') || 'anonymous',
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
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
    initiateCheckout,
    creditPackages: CREDIT_PACKAGES,
    isLoadingCheckout,
  };
}