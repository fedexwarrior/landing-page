import { StripeCheckout } from '/components/transaction-gateway/StripeCheckout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatInterface from './components/chat-interface/ChatInterface';
import { useState } from 'react';
import { VELV_CHARACTERS } from './config/characters';
import { useCredits } from './hooks/useCredits';
import { CharacterSelection } from './components/character-selection/CharacterSelection';
import { VelvCharacter } from './config/characters';
import { CreditCard, Loader2, X } from 'lucide-react';
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';

function MainApp() {
  const [selectedChar, setSelectedChar] = useState<VelvCharacter | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const { 
    userCredits, 
    consumeCredit, 
    initiateCheckout, 
    creditPackages, 
    isLoadingCheckout 
  } = useCredits();

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      {/* Header / Credits Display */}
      <header className="flex justify-between items-center mb-8 border-b border-purple-500/30 pb-4">
        <h1 className="text-3xl font-bold text-purple-500">VelvetCrush</h1>
        <div className="bg-zinc-900 px-4 py-2 rounded-full border border-yellow-600 flex items-center gap-3">
          <StripeCheckout />
          <span className="text-yellow-500 font-bold">Credits: {userCredits}</span>
          <button 
            onClick={() => setShowTopUpModal(true)}
            className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1.5 rounded-full hover:from-yellow-400 hover:to-orange-400 transition font-medium flex items-center gap-1"
          >
            <CreditCard className="w-4 h-4" />
            Top Up
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* If no character is selected, show the Grid */}
        {!selectedChar ? (
          <section>
            <h2 className="text-xl mb-6 text-zinc-400">Select a personified presence...</h2>
            <CharacterSelection 
              characters={VELV_CHARACTERS} 
              onCharacterSelect={(char: VelvCharacter) => setSelectedChar(char)} 
            />
          </section>
        ) : (
          /* If a character IS selected, show the Chat Interface */
          <section>
            <button 
              onClick={() => setSelectedChar(null)}
              className="mb-4 text-sm text-purple-400 hover:text-purple-300"
            >
              ← Back to Characters
            </button>
            <ChatInterface 
              character={selectedChar} 
              consumeCredit={consumeCredit}
              credits={userCredits}
              onBack={() => setSelectedChar(null)}
            />
          </section>
        )}
      </main>

      {/* Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full relative animate-scale-in">
            <button
              onClick={() => setShowTopUpModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Top Up Credits</h2>
            <p className="text-zinc-400 mb-6">Choose a package to continue chatting</p>
            <StripeCheckout />

            
            </div>

            {isLoadingCheckout && (
              <div className="flex items-center justify-center gap-2 text-purple-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to Stripe...</span>
              </div>
            )}

            <p className="text-xs text-zinc-500 text-center mt-4">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
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