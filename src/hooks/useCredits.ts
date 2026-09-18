import { useState, useCallback } from 'react';

interface CreditPackage {
  id: string;
  credits: number;
  price: number; // in cents
  name: string;
}

interface UseCreditsReturn {
  creditPackages: CreditPackage[];
  isLoadingCheckout: boolean;
  initiateCheckout: (packageId: string) => Promise<void>;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'starter', credits: 50, price: 500, name: 'Starter Pack' },
  { id: 'popular', credits: 120, price: 1000, name: 'Popular Pack' },
  { id: 'value', credits: 300, price: 2000, name: 'Best Value Pack' },
  { id: 'premium', credits: 800, price: 5000, name: 'Premium Pack' },
];

// Credits now live server-side, tied to the authenticated session — not localStorage.
// This hook just handles kicking off checkout; the real balance comes from
// /api/auth/me and the chat/verify-session responses.
export function useCredits(): UseCreditsReturn {
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  const initiateCheckout = useCallback(async (packageId: string) => {
    setIsLoadingCheckout(true);
    try {
      const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!pkg) throw new Error('Invalid package');

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
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
    creditPackages: CREDIT_PACKAGES,
    isLoadingCheckout,
    initiateCheckout,
  };
}