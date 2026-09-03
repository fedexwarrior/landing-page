import React, { useState } from 'react';

export const StripeCheckout: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: 'pro'})
      });

      const session = await response.json();

      // Redirect directly to the Stripe-hosted Checkout page
      if (session?.url) {
        window.location.href = session.url;
      } else {
        console.error('No checkout URL returned from server');
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800 text-center shadow-xl">
      <h3 className="text-white font-bold text-lg mb-2">Top Up Tokens</h3>
      <p className="text-zinc-400 text-sm mb-6">Add funds to your balance instantly via Stripe</p>
      <button 
        onClick={handleCheckout}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition shadow-lg disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay with Stripe'}
      </button>
    </div>
  );
};