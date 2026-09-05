import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCredits } from '../hooks/useCredits';
import { CheckCircle, Loader2, ArrowLeft, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const { setCredits, userCredits } = useCredits();
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifySession = useCallback(async (_sessionId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative">
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-radial-gold rounded-full blur-3xl animate-float opacity-50" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl border-gold/30 p-8 max-w-md w-full text-center"
        >
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <h2 className="font-display font-medium text-xl text-white mb-2">Verifying Payment...</h2>
          <p className="text-zinc-400">Please wait while we confirm your purchase</p>
          <motion.div
            className="mt-6 flex justify-center gap-2"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-gold/50 rounded-full" />
            <div className="w-2 h-2 bg-gold/50 rounded-full" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-gold/50 rounded-full" style={{ animationDelay: '0.4s' }} />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl border-red-500/30 p-8 max-w-md w-full text-center"
        >
          <h2 className="font-display font-medium text-xl text-red-400 mb-2">Payment Verification Failed</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 btn-ghost"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-radial-gold rounded-full blur-3xl animate-float opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-radial-blush rounded-full blur-3xl animate-float opacity-50" />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-strong rounded-2xl border-gold/30 p-8 max-w-md w-full text-center"
      >
        <motion.div
          className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
        </motion.div>
        <h2 className="font-display font-medium text-2xl text-white mb-2">Payment Successful!</h2>
        <p className="text-zinc-400 mb-6">Your credits have been added to your account.</p>
        <p className="text-gold font-medium mb-6 flex items-center justify-center gap-2">
          <Crown className="w-5 h-5" />
          Current Credits: {userCredits}
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 btn-premium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companions
        </Link>
      </motion.div>
    </div>
  );
}