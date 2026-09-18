import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowLeft, Shield, CreditCard } from 'lucide-react';
import { clsx } from 'clsx';
import { useCredits } from '@/hooks/useCredits';

interface CreditsSectionProps {
  onBack: () => void;
  isSignedIn: boolean;
  credits: number;
  onRequireAuth: (reason: string, action: () => void) => void;
  onCreditsUpdate: (newCredits: number) => void;
}

export default function CreditsSection({ onBack, isSignedIn, credits, onRequireAuth, onCreditsUpdate }: CreditsSectionProps) {
  const { creditPackages, initiateCheckout, isLoadingCheckout } = useCredits();
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const handleBuyPackage = (packageId: string) => {
    if (!isSignedIn) {
      onRequireAuth("Sign in to purchase credits.", () => {
        setShowTopUpModal(true);
        initiateCheckout(packageId);
      });
      return;
    }
    setShowTopUpModal(false);
    initiateCheckout(packageId);
  };

  return (
    <div className="flex flex-col h-full w-full bg-midnight text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-panel-border bg-midnight/50 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={onBack} className="text-sm text-muted hover:text-white cursor-pointer flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="font-display font-medium text-base text-white">Credits</span>
        <div className="w-24" />
      </header>

      {/* Balance Display */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong rounded-2xl p-8 text-center border-velvet/30">
            <div className="w-24 h-24 mx-auto mb-6 glass-medium rounded-2xl flex items-center justify-center border-velvet/30">
              <Crown className="w-12 h-12 text-velvet" />
            </div>
            <h2 className="font-display font-medium text-2xl text-white mb-2">Your Balance</h2>
            <motion.div
              className="text-5xl md:text-6xl font-bold font-button text-gradient-velvet mb-2"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {credits.toLocaleString()}
            </motion.div>
            <p className="text-muted text-sm mb-6">credits available</p>

            <button
              onClick={() => setShowTopUpModal(true)}
              className="btn-velvet w-full py-3 text-base"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Top Up Credits
            </button>

            <p className="text-xs text-muted text-center mt-4 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-green-500/60" />
              Secure payment powered by Stripe
            </p>
          </div>

          {/* Credit Packages Preview */}
          <div className="mt-8 space-y-4">
            <h3 className="font-display font-medium text-lg text-white mb-3">Popular Packages</h3>
            <div className="grid grid-cols-2 gap-3">
              {creditPackages.slice(0, 4).map((pkg) => (
                <motion.button
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBuyPackage(pkg.id)}
                  disabled={isLoadingCheckout}
                  className={clsx(
                    'p-4 glass rounded-xl border border-panel-border transition-all duration-200 text-left',
                    'hover:border-velvet/40 hover:bg-panel hover:shadow-[0_0_30px_rgba(196,19,60,0.1)]',
                    isLoadingCheckout && 'opacity-50 cursor-wait'
                  )}
                >
                  <p className="font-medium text-white">{pkg.name}</p>
                  <p className="text-sm text-muted mt-1">{pkg.credits.toLocaleString()} credits</p>
                  <p className="text-xl font-bold text-velvet font-button mt-2">${(pkg.price / 100).toFixed(2)}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-md glass-strong rounded-2xl border-velvet/30 p-6 relative"
          >
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 p-1 glass-medium rounded-xl text-muted hover:text-white hover:bg-panel-border/50 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 glass-medium rounded-2xl flex items-center justify-center border-velvet/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-8 h-8 text-velvet" />
              </motion.div>
              <h2 className="font-display font-medium text-2xl text-white mb-2">Top Up Credits</h2>
              <p className="text-muted">Each message costs 5 credits • Images cost 30 credits</p>
            </div>

            <div className="space-y-3 mb-6">
              {creditPackages.map((pkg) => (
                <motion.button
                  key={pkg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleBuyPackage(pkg.id);
                    setShowTopUpModal(false);
                  }}
                  disabled={isLoadingCheckout}
                  className={clsx(
                    'w-full text-left p-4 glass rounded-xl border border-panel-border transition-all duration-200 flex items-center justify-between',
                    'hover:border-velvet/40 hover:bg-panel hover:shadow-[0_0_30px_rgba(196,19,60,0.1)]',
                    isLoadingCheckout && 'opacity-50 cursor-wait'
                  )}
                >
                  <div>
                    <p className="font-medium text-white">{pkg.name}</p>
                    <p className="text-sm text-muted">{pkg.credits.toLocaleString()} credits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-velvet font-button">${(pkg.price / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted">USD</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {isLoadingCheckout && (
              <div className="flex items-center justify-center gap-2 text-velvet">
                <motion.div className="w-5 h-5 border-2 border-velvet/30 border-t-velvet rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                <span>Redirecting to Stripe...</span>
              </div>
            )}

            <p className="text-xs text-muted text-center mt-4 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-green-500/60" />
              Secure payment powered by Stripe
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}