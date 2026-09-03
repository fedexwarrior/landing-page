import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCredits } from '../hooks/useCredits';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const { setCredits, userCredits } = useCredits();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifySession = useCallback(async (_sessionId: string) => {
    try {
      // In production, call your backend to verify the session
      // For demo, we'll add credits locally
      // The real credits should come from webhook
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add some credits as demo - in reality this comes from webhook
      setCredits(userCredits + 50);
      setVerified(true);
    } catch {
      setError('Failed to verify payment');
    }
  }, [setCredits, userCredits]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      verifySession(sessionId);
    } else {
      setError('No session ID found');
    }
  }, [searchParams, verifySession]);

  if (!verified && !error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-8 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
          <p className="text-zinc-400">Please wait while we confirm your purchase</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-red-500 mb-2">Payment Verification Failed</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link to="/" className="text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
        <p className="text-zinc-400 mb-6">Your credits have been added to your account.</p>
        <p className="text-purple-400 font-medium mb-6">Current Credits: {userCredits}</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Characters
        </Link>
      </div>
    </div>
  );
}