import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroScreen } from './components/hero';
import ChatInterface from './components/chat-interface/ChatInterface';
import { VELV_CHARACTERS, VelvCharacter } from './config/characters';
import { useCredits } from './hooks/useCredits';
import { useAuthHarvest, AuthHarvest } from './hooks/useAuthHarvest';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import { Crown, Loader2, X, Sparkles, Shield } from 'lucide-react';
import { clsx } from 'clsx';

/* Main app component with Hero → Chat flow */
function MainApp() {
  const [selectedChar, setSelectedChar] = useState<VelvCharacter | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [isLoadingChar, setIsLoadingChar] = useState(false);

  const { 
    userCredits, 
    consumeCredit, 
    initiateCheckout, 
    creditPackages, 
    isLoadingCheckout 
  } = useCredits();

  // Simulate user auth - in production this comes from your auth provider
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  // Initialize mock auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('velvetcrush_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Create anonymous user for demo
      const anonUser = {
        id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: `user_${Date.now()}@velvetcrush.app`
      };
      localStorage.setItem('velvetcrush_user', JSON.stringify(anonUser));
      setUser(anonUser);
    }
  }, []);

  // Auth harvest runs automatically when user is set
  <AuthHarvest userId={user?.id} email={user?.email} />;

  const handleCharacterSelect = (character: VelvCharacter) => {
    // Check if premium character requires credits
    if (character.isPremium && userCredits <= 0) {
      setShowTopUpModal(true);
      return;
    }
    
    setIsLoadingChar(true);
    // Brief loading for "AI Creation" effect
    setTimeout(() => {
      setSelectedChar(character);
      setIsLoadingChar(false);
    }, 800);
  };

  const handleBackToHero = () => {
    setSelectedChar(null);
  };

  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Subtle ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-radial-gold rounded-full blur-3xl animate-float opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-radial-blush rounded-full blur-3xl animate-float opacity-50" style={{ animationDelay: '2s' }} />
      </div>

      {/* Global loading overlay for AI Creation */}
      <AnimatePresence>
        {isLoadingChar && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                className="w-24 h-24 mx-auto mb-6 relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <svg className="w-full h-full text-gold" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray="251" strokeDashoffset="63"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
              <h3 className="font-display font-light text-2xl md:text-3xl text-white mb-2">
                Awakening <span className="text-gradient-gold">presence...</span>
              </h3>
              <p className="text-zinc-500">Establishing secure connection</p>
              <motion.div
                className="mt-6 flex justify-center gap-2"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-gold/50 rounded-full" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-gold/50 rounded-full" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gold/50 rounded-full" style={{ animationDelay: '0.4s' }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Screen or Chat Interface */}
      <AnimatePresence mode="wait">
        {!selectedChar ? (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <HeroScreen onCharacterSelect={handleCharacterSelect} />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <ChatInterface 
              character={selectedChar} 
              consumeCredit={consumeCredit}
              credits={userCredits}
              onBack={handleBackToHero}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
            className="w-full max-w-md glass-strong rounded-2xl border-gold/30 p-6 relative animate-scale-in"
          >
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 p-1 glass-medium rounded-xl text-zinc-400 hover:text-white hover:bg-glass-strong transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 glass-medium rounded-2xl flex items-center justify-center border-gold/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-8 h-8 text-gold" />
              </motion.div>
              <h2 className="font-display font-medium text-2xl text-white mb-2">Unlock Premium</h2>
              <p className="text-zinc-400">This companion requires credits to access</p>
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
                    initiateCheckout(pkg.id);
                    setShowTopUpModal(false);
                  }}
                  disabled={isLoadingCheckout}
                  className={clsx(
                    'w-full text-left p-4 glass-medium rounded-xl border border-glass-border transition-all duration-200 flex items-center justify-between',
                    'hover:border-gold/40 hover:bg-glass-strong hover:shadow-[0_0_30px_rgba(212,168,67,0.1)]',
                    isLoadingCheckout && 'opacity-50 cursor-wait'
                  )}
                >
                  <div>
                    <p className="font-medium text-white">{pkg.name}</p>
                    <p className="text-sm text-zinc-400">{pkg.credits} credits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gold">${(pkg.price / 100).toFixed(2)}</p>
                    <p className="text-xs text-zinc-500">USD</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {isLoadingCheckout && (
              <div className="flex items-center justify-center gap-2 text-gold">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to Stripe...</span>
              </div>
            )}

            <p className="text-xs text-zinc-500 text-center mt-4 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-green-500/60" />
              Secure payment powered by Stripe
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
      </Routes>
    </BrowserRouter>
  );
}