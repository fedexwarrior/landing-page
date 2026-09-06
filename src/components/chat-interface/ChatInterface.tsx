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
  const [messages, setMessages] = useState([
    { sender: 'character', text: "Hey there! Let's get closer. What's on your mind?" }
  ]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');

    try {
      const response = await fetch('https://velvetcrush.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, characterId: character?.id }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { sender: 'character', text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { sender: 'character', text: "..." }]);
      }
    } catch (err) {
      console.error('Failed to get response', err);
    }
  };

  const handleCheckout = async () => {
    try {
      const res = await fetch("https://velvetcrush.app/create-checkout-session", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ packageId: "pro" }) 
      }); 
      const data = await res.json(); 
      if (data.url) { 
        window.location.href = data.url; 
      } else { 
        alert("Error: " + JSON.stringify(data)); 
      } 
    } catch (err: any) { 
      alert("Fetch failed: " + err.message); 
    }
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
              onClick={handleCheckout} 
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors rounded-xl text-amber-400 cursor-pointer"
            >
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Premium Features</span>
            </button>

            <button 
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors rounded-xl text-zinc-300 cursor-pointer"
            >
              <Shield className="w-5 h-5 text-green-500" />
              <span>Privacy Settings</span>
            </button>

            <hr className="my-2 border-zinc-800" />

            <button 
              onClick={() => setMessages([])}
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-zinc-800 transition-colors rounded-xl text-red-400 cursor-pointer"
            >
              <span>Clear Chat</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <button onClick={onBack} className="text-sm text-zinc-400 hover:text-white cursor-pointer">
          ← Back
        </button>
        <span className="font-medium">{character?.name || 'Chat'}</span>
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-400 hover:text-white cursor-pointer">
          ⋮
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-2xl max-w-[80%] text-sm ${
              msg.sender === 'user' ? 'ml-auto bg-amber-600/20 text-amber-100 border border-amber-500/30' : 'bg-zinc-900 text-white'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input Bar Footer Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-full focus:outline-none text-sm"
        />
        <button 
          type="submit"
          className="p-2 bg-amber-500 text-zinc-950 rounded-full hover:bg-amber-400 transition-colors cursor-pointer flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}