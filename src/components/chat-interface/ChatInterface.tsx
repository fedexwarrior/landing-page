import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Send } from 'lucide-react';

interface ChatInterfaceProps {
  character: any;
  onBack: () => void;
  consumeCredit: () => boolean;
  credits: number;
}

export default function ChatInterface({ character, onBack, consumeCredit, credits }: ChatInterfaceProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    // Add your send message logic here
    setInputMessage('');
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-zinc-950 text-white">
      {/* Menu Dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-16 right-4 z-50 glass-strong rounded-2xl border border-glass-border shadow-2xl p-2 w-56 bg-zinc-900/90 backdrop-blur-md"
          >
            <button 
              onClick={async () => { 
                try { 
                  const r = await fetch('https://velvetcrush.app/create-checkout-session', { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({ packageId: 'pro' }) 
                  }); 
                  const d = await r.json(); 
                  if (d.url) { 
                    window.location.href = d.url; 
                  } else { 
                    alert('Error: ' + JSON.stringify(d)); 
                  } 
                } catch (e: any) { 
                  alert('Fetch failed: ' + e.message); 
                } 
              }} 
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors rounded-xl text-amber-400"
            >
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Premium Features</span>
            </button>

            <button 
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors rounded-xl text-zinc-300"
            >
              <Shield className="w-5 h-5 text-green-500" />
              <span>Privacy Settings</span>
            </button>

            <hr className="my-2 border-zinc-800" />

            <button 
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors rounded-xl text-red-400"
            >
              <span>Clear Chat</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <button onClick={onBack} className="text-sm text-zinc-400 hover:text-white">
          ← Back
        </button>
        <span className="font-medium">{character?.name || 'Chat'}</span>
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-400 hover:text-white">
          ⋮
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-zinc-900 p-3 rounded-2xl max-w-[80%] text-sm">
          Hey there! Let's get closer. What's on your mind?
        </div>
      </div>

      {/* Input Bar Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-full focus:outline-none text-sm"
        />
        <button 
          onClick={handleSendMessage}
          className="p-2 bg-amber-500 text-zinc-950 rounded-full hover:bg-amber-400 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}