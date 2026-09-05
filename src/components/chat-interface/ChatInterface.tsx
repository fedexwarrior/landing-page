import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Mic, Image, MoreVertical, Crown, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
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
  consumeCredit: () => boolean;
  credits: number;
}

export default function ChatInterface({ character, onBack, consumeCredit, credits }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize with character's first message
  useEffect(() => {
    if (messages.length === 0) {
      const initialMsg: Message = {
        id: 'init',
        sender: 'ai',
        text: `Hey there... I'm ${character.name}. *leans closer* What's on your mind?`,
        timestamp: new Date(),
      };
      setMessages([initialMsg]);
    }
  }, [character.name, messages.length]);

  // Keep textarea height auto
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Check credits
    if (!consumeCredit()) {
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: character.name,
          messages: [...messages, userMsg].map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      const data = await response.json();

      if (data.message) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error("Failed to fetch chat response:", err);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        text: "Sorry, I lost my train of thought... Try again?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-bg-primary relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-gold/5 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-4 border-b border-glass-border glass">
        {/* Back button */}
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 glass-medium rounded-xl text-zinc-400 hover:text-white hover:bg-glass-strong transition-all"
          aria-label="Back to characters"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        {/* Character info */}
        <div className="flex items-center gap-3 min-w-0">
          <motion.div
            className="avatar-ring"
            whileHover={{ scale: 1.05 }}
          >
            <img
              src={character.avatar}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="min-w-0">
            <h2 className="font-display font-medium text-white truncate">
              {character.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {character.isPremium && (
                <span className="flex items-center gap-1 px-2 py-0.5 glass border-gold/30 rounded-full">
                  <Crown className="w-3 h-3 text-gold" />
                  Premium
                </span>
              )}
              <span className="flex items-center gap-1 text-green-500/80">
                <Shield className="w-3 h-3" />
                Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Credits & Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 glass-medium rounded-full border-gold/30">
            <Crown className="w-4 h-4 text-gold" />
            <span className="font-medium text-gold">{credits}</span>
            <span className="text-zinc-500">credits</span>
          </div>
          
          <motion.button
            onClick={() => setShowMenu(!showMenu)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 glass-medium rounded-xl text-zinc-400 hover:text-white hover:bg-glass-strong transition-all"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-16 right-4 z-50 glass-strong rounded-2xl border-gold/30 shadow-[0_0_40px_rgba(0,0,0,0.5)] py-2 w-56"
          >
  <button onClick={async () => { setShowMenu(false); const res = await fetch ('/api/create-checkout-session', { method: 'POST' }); const data = await res.json(); if (data.url) window.location.href=data.url; }} className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-gold" />
              Premium Features
            </button>
            <button className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-glass-medium transition flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-500" />
              Privacy Settings
            </button>
            <hr className="my-2 border-glass-border" />
            <button className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-glass-medium transition flex items-center gap-3">
              Clear Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Feed */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 mask-gradient-bottom mask-gradient-top"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ai' && (
                <motion.div
                  className="avatar-ring w-8 h-8 mr-3 flex-shrink-0 mt-1"
                  whileHover={{ scale: 1.1 }}
                >
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              )}

              <div className={`flex flex-col max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <motion.div
                  className={clsx(
                    'relative px-4 py-3 rounded-2xl shadow-lg',
                    message.sender === 'user'
                      ? 'message-bubble-user'
                      : 'message-bubble-ai'
                  )}
                  whileHover={{ scale: 1.01 }}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                    {message.text}
                  </p>
                  
                  {/* Streaming indicator */}
                  {message.isStreaming && (
                    <motion.span
                      className="absolute bottom-1 right-2 text-xs text-gold/60 flex items-center gap-1"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </motion.span>
                  )}
                </motion.div>

                <p className="text-[10px] text-zinc-600 mt-1 px-1">
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {message.sender === 'user' && (
                <motion.div
                  className="avatar-ring w-8 h-8 ml-3 flex-shrink-0 mt-1 bg-gradient-to-br from-gold to-blush"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="w-full h-full flex items-center justify-center text-bg-primary font-bold text-sm">
                    You
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start"
          >
            <div className="avatar-ring w-8 h-8 mr-3 flex-shrink-0">
              <img
                src={character.avatar}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="message-bubble-ai px-4 py-3">
              <div className="flex items-center gap-1.5">
                <motion.span
                  className="w-2 h-2 bg-gold/60 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="w-2 h-2 bg-gold/60 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                />
                <motion.span
                  className="w-2 h-2 bg-gold/60 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className="relative z-10 p-4 md:p-6 border-t border-glass-border glass bg-bg-primary/80 backdrop-blur-2xl">
        <form onSubmit={handleSend} className="flex items-end gap-3">
          {/* Attachment buttons */}
          <div className="flex gap-1 p-1">
            <button
              type="button"
              className="p-2 glass-medium rounded-xl text-zinc-400 hover:text-white hover:bg-glass-strong transition"
              aria-label="Attach image"
            >
              <Image className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 glass-medium rounded-xl text-zinc-400 hover:text-white hover:bg-glass-strong transition"
              aria-label="Voice message"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className={clsx(
                'input-premium w-full resize-none pr-16',
                'font-sans text-base leading-relaxed',
                'placeholder:text-zinc-500',
                'focus:ring-1 focus:ring-gold/30'
              )}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            
            {/* Character counter / credit warning */}
            {credits <= 5 && credits > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bottom-full left-0 mb-1 px-2 py-1 glass-medium rounded text-xs text-yellow-400"
              >
                ⚠ {credits} credits remaining
              </motion.div>
            )}
          </div>

          {/* Send button */}
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading || credits <= 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={clsx(
              'flex-shrink-0 p-3 rounded-xl transition-all duration-200 flex items-center justify-center',
              input.trim() && !isLoading && credits > 0
                ? 'bg-gradient-to-r from-gold to-gold-light text-bg-primary hover:from-gold-light hover:to-gold shadow-[0_0_20px_rgba(212,168,67,0.4)]'
                : 'bg-glass-medium text-zinc-500 cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </form>

        {/* Out of credits banner */}
        {credits <= 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 glass-medium border-yellow-500/30 rounded-xl flex items-center gap-3"
          >
            <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-zinc-300 flex-1">
              Out of credits. <span className="text-yellow-400 font-medium">Top up</span> to continue.
            </p>
            <button className="btn-premium text-xs py-2 px-4 whitespace-nowrap">
              Get Credits
            </button>
          </motion.div>
        )}
      </footer>
    </div>
  );
}