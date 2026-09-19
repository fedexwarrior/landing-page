import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Send, ArrowLeft, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

interface Message {
  id: string;
  sender: 'user' | 'character';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  character: {
    id: string;
    name: string;
    avatar: string;
    personality: string;
    isPremium: boolean;
  };
  onBack: () => void;
  isSignedIn: boolean;
  credits: number;
  onRequireAuth: (reason: string, action: () => void) => void;
  onCreditsUpdate: (newCredits: number) => void;
  onUpgradeClick: () => void;
}

export default function ChatInterface({ character, onBack, isSignedIn, credits, onRequireAuth, onCreditsUpdate, onUpgradeClick }: ChatInterfaceProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'character', text: "Hey there! Let's get closer. What's on your mind?", timestamp: new Date() }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendToServer = async (userText: string) => {
    const userMsg: Message = { id: `user-${Date.now()}`, sender: 'user', text: userText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, characterId: character?.id }),
      });

      if (response.status === 401) {
        onRequireAuth("Please sign in again to keep chatting.", () => sendToServer(userText));
        return;
      }

      if (response.status === 402) {
        setMessages((prev) => [...prev, { id: `char-${Date.now()}`, sender: 'character', text: "You're out of credits — top up to keep chatting with me.", timestamp: new Date() }]);
        onUpgradeClick();
        return;
      }

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, { id: `char-${Date.now()}`, sender: 'character', text: data.message, timestamp: new Date() }]);
        if (typeof data.credits === 'number') onCreditsUpdate(data.credits);
      } else {
        setMessages((prev) => [...prev, { id: `char-${Date.now()}`, sender: 'character', text: "...", timestamp: new Date() }]);
      }
    } catch (err) {
      console.error('Failed to get response', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userText = inputMessage.trim();
    if (!userText) return;

    if (!isSignedIn) {
      onRequireAuth("Sign in to start chatting — you'll get 20 free credits.", () => sendToServer(userText));
      return;
    }

    setInputMessage('');
    sendToServer(userText);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-midnight text-white">
      {/* Menu Dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-16 right-4 z-50 glass-strong rounded-2xl border-panel-border shadow-2xl p-2 w-56 bg-panel/90 backdrop-blur-md"
          >
            <button
              onClick={() => { setShowMenu(false); onUpgradeClick(); }}
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-panel-border/50 transition-colors rounded-xl text-velvet cursor-pointer"
            >
              <Crown className="w-5 h-5 text-velvet" />
              <span>Premium Features</span>
            </button>

            <button className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-panel-border/50 transition-colors rounded-xl text-zinc-300 cursor-pointer">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Privacy Settings</span>
            </button>

            <hr className="my-2 border-panel-border" />

            <button
              onClick={() => setMessages([])}
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-panel-border/50 transition-colors rounded-xl text-red-400 cursor-pointer"
            >
              <span>Clear Chat</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-panel-border bg-midnight/50 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={onBack} className="text-sm text-muted hover:text-white cursor-pointer flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="avatar-velvet avatar-velvet-sm flex-shrink-0">
            <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-medium text-base text-white truncate">{character.name}</h2>
            {character.isPremium && <span className="text-xs text-velvet font-medium">Premium</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSignedIn && (
            <span className="px-3 py-1 rounded-full bg-panel border border-panel-border text-xs text-velvet font-medium font-button flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              {credits} credits
            </span>
          )}
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-muted hover:text-white cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mask-gradient-bottom mask-gradient-top">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'character' && (
                <div className="avatar-velvet avatar-velvet-sm mr-3 flex-shrink-0 mt-1">
                  <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                </div>
              )}

              <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <motion.div
                  className={clsx(
                    'relative px-4 py-3 rounded-2xl shadow-lg',
                    msg.sender === 'user' ? 'message-bubble-user' : 'message-bubble-ai'
                  )}
                  whileHover={{ scale: 1.01 }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                </motion.div>
                <p className="text-[10px] text-muted mt-1 px-1">{formatTime(msg.timestamp)}</p>
              </div>

              {msg.sender === 'user' && (
                <div className="avatar-velvet avatar-velvet-sm ml-3 flex-shrink-0 mt-1 bg-gradient-to-br from-velvet to-velvet-dark">
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">You</div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Footer Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-panel-border bg-midnight/50 backdrop-blur-sm flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="input-velvet flex-1 rounded-full px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || !isSignedIn}
          className="btn-velvet-circle flex-shrink-0 transition-all duration-200"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Not signed in banner */}
      {!isSignedIn && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-3 glass border-velvet/30 rounded-xl flex items-center gap-3"
        >
          <Crown className="w-5 h-5 text-velvet flex-shrink-0" />
          <p className="text-sm text-zinc-300 flex-1">
            Sign in to start chatting — you'll get 20 free credits.
          </p>
          <button
            onClick={() => onRequireAuth("Sign in to start chatting — you'll get 20 free credits.", () => {})}
            className="btn-velvet-pill text-xs py-1.5 px-3 whitespace-nowrap flex-shrink-0"
          >
            Sign In
          </button>
        </motion.div>
      )}

      {/* Out of credits banner */}
      {isSignedIn && credits <= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-3 glass border-yellow-500/30 rounded-xl flex items-center gap-3"
        >
          <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-zinc-300 flex-1">
            Out of credits. <span className="text-yellow-400 font-medium">Top up</span> to continue.
          </p>
          <button onClick={onUpgradeClick} className="btn-velvet-pill text-xs py-1.5 px-3 whitespace-nowrap flex-shrink-0">
            Get Credits
          </button>
        </motion.div>
      )}
    </div>
  );
}