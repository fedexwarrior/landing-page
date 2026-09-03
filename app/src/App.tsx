import ChatInterface from './components/chat-interface/ChatInterface';
import { useState } from 'react';
import { VELV_CHARACTERS } from './config/characters'; // or wherever your file is
import { useCredits } from './hooks/useCredits';
import { CharacterSelection } from './components/character-selection/CharacterSelection';
import { VelvCharacter } from './config/characters';

export default function App() {
  // We need a state to track which character is currently selected
  const [selectedChar, setSelectedChar] = useState<any>(null);

  // We pull the credit logic from our hook
  const { userCredits, handleTopUp, consumeCredit } = useCredits();

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      {/* Header / Credits Display */}
      <header className="flex justify-between items-center mb-8 border-b border-gold/30 pb-4">
        <h1 className="text-3xl font-bold text-purple-500">VelvetCrush</h1>
        <div className="bg-zinc-900 px-4 py-2 rounded-full border border-yellow-600">
          <span className="text-yellow-500 font-bold">Credits: {userCredits}</span>
          <button 
            onClick={() => handleTopUp(5)}
            className="ml-4 text-xs bg-yellow-600 text-black px-2 py-1 rounded hover:bg-yellow-400 transition"
          >
            +5 (Top-up)
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
    </div>
  );
}