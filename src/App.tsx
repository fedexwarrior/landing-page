import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroScreen } from './components/hero';
import ChatInterface from './components/chat-interface/ChatInterface';
import ImageGeneration from './components/image-generation/ImageGeneration';
import CreditsSection from './components/credits/CreditsSection';
import { SignUpModal } from './components/SignUpModal';
import { VelvCharacter } from './config/characters';
import { useCredits } from './hooks/useCredits';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import { Crown, Loader2, X, Shield, CreditCard, Sparkles, Menu, Home, MessageSquare, Image, Wallet } from 'lucide-react';
import { clsx } from 'clsx';

interface AuthedUser {
  email: string;
  name: string;
  credits: number;
}

type View = 'hero' | 'chat' | 'create' | 'credits';

/* Main app component with Hero → Chat flow */
function MainApp() {
  const [selectedChar, setSelectedChar] = useState<VelvCharacter | null>(null);
  const [currentView, setCurrentView] = useState<View>('hero');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [isLoadingChar, setIsLoadingChar] = useState(false);

  const { 
    initiateCheckout, 
    creditPackages, 
    isLoadingCheckout 
  } = useCredits();

  const [user, setUser] = useState<AuthedUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpReason, setSignUpReason] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Check for an existing session on load
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser({ email: data.email, name: data.name, credits: data.credits });
      })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  const requireAuth = useCallback((reason: string, action: () => void) => {
    setSignUpReason(reason);
    setPendingAction(() => action);
    setShowSignUpModal(true);
  }, []);

  const handleSignedIn = useCallback((data: { email: string; name: string; credits: number; isNewUser: boolean }) => {
    setUser({ email: data.email, name: data.name, credits: data.credits });
    setShowSignUpModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  // Characters are always previewable — no gate on selection itself.
  const handleCharacterSelect = (character: VelvCharacter) => {
    setIsLoadingChar(true);
    setTimeout(() => {
      setSelectedChar(character);
      setCurrentView('chat');
      setIsLoadingChar(false);
    }, 800);
  };

  const handleBackToHero = () => {
    setSelectedChar(null);
    setCurrentView('hero');
  };

  const handleCreditsUpdate = (newCredits: number) => {
    setUser((prev) => (prev ? { ...prev, credits: newCredits } : prev));
  };

  const handleBuyPackage = (packageId: string) => {
    if (!user) {
      requireAuth("Sign in to purchase credits.", () => initiateCheckout(packageId));
      setShowTopUpModal(false);
      return;
    }
    initiateCheckout(packageId);
    setShowTopUpModal(false);
  };

  const handleOpenCreate = () => {
    setCurrentView('create');
  };

  const handleOpenCredits = () => {
    setCurrentView('credits');
  };

  const handleBackToMain = () => {
    setCurrentView('hero');
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-midnight" />;
  }

  return (
    <div className="min-h-screen bg-midnight relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-radial-velvet rounded-full blur-3xl animate-float opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-radial-velvet rounded-full blur-3xl animate-float opacity-50" style={{ animationDelay: '2s' }} />
      </div>

      {/* Global loading overlay for AI Creation */}
      <AnimatePresence>
        {isLoadingChar && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/95 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                className="w-24 h-24 mx-auto mb-6 relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <svg className="w-full h-full text-velvet" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="251" strokeDashoffset="63" strokeLinecap="round" />
                </svg>
              </motion.div>
              <h3 className="font-display font-light text-2xl md:text-3xl text-white mb-2">
                Awakening <span className="text-gradient-velvet">presence...</span>
              </h3>
              <p className="text-muted">Establishing secure connection</p>
              <motion.div
                className="mt-6 flex justify-center gap-2"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-velvet/50 rounded-full" />
                <div className="w-2 h-2 bg-velvet/50 rounded-full" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-velvet/50 rounded-full" style={{ animationDelay: '0.4s' }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentView === 'hero' && (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <HeroScreen onCharacterSelect={handleCharacterSelect} />
            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-midnight/90 backdrop-blur-md border-t border-panel-border px-4 py-2">
              <div className="max-w-xl mx-auto flex items-center justify-around">
                <button onClick={() => setCurrentView('hero')} className={clsx('flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors', currentView === 'hero' ? 'text-velvet' : 'text-muted hover:text-white')}>
                  <Home className="w-6 h-6" />
                  <span className="text-xs font-medium">Home</span>
                </button>
                <button onClick={handleOpenCreate} className={clsx('flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors', currentView === 'create' ? 'text-velvet' : 'text-muted hover:text-white')}>
                  <Image className="w-6 h-6" />
                  <span className="text-xs font-medium">Create</span>
                </button>
                <button onClick={handleOpenCredits} className={clsx('flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors', currentView === 'credits' ? 'text-velvet' : 'text-muted hover:text-white')}>
                  <Wallet className="w-6 h-6" />
                  <span className="text-xs font-medium">Credits</span>
                </button>
              </div>
            </nav>
          </motion.div>
        )}
        {currentView === 'chat' && selectedChar && (
          <motion.div key="chat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
            <ChatInterface
              character={selectedChar}
              isSignedIn={!!user}
              credits={user?.credits ?? 0}
              onBack={handleBackToHero}
              onRequireAuth={requireAuth}
              onCreditsUpdate={handleCreditsUpdate}
              onUpgradeClick={() => {
                if (!user) {
                  requireAuth("Sign in to purchase credits.", () => setShowTopUpModal(true));
                } else {
                  setShowTopUpModal(true);
                }
              }}
            />
          </motion.div>
        )}
        {currentView === 'create' && (
          <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <ImageGeneration
              onBack={handleBackToMain}
              isSignedIn={!!user}
              credits={user?.credits ?? 0}
              onRequireAuth={requireAuth}
              onCreditsUpdate={handleCreditsUpdate}
            />
          </motion.div>
        )}
        {currentView === 'credits' && (
          <motion.div key="credits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <CreditsSection
              onBack={handleBackToMain}
              isSignedIn={!!user}
              credits={user?.credits ?? 0}
              onRequireAuth={requireAuth}
              onCreditsUpdate={handleCreditsUpdate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Up Modal */}
      {showSignUpModal && (
        <SignUpModal
          reason={signUpReason}
          onClose={() => { setShowSignUpModal(false); setPendingAction(null); }}
          onSignedIn={handleSignedIn}
        />
      )}

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="w-full max-w-md glass-strong rounded-2xl border-velvet/30 p-6 relative">
            <button onClick={() => setShowTopUpModal(false)} className="absolute top-4 right-4 p-1 glass-medium rounded-xl text-muted hover:text-white hover:bg-panel-border/50 transition">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <motion.div className="w-16 h-16 mx-auto mb-4 glass-medium rounded-2xl flex items-center justify-center border-velvet/30" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
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
                  onClick={() => handleBuyPackage(pkg.id)}
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