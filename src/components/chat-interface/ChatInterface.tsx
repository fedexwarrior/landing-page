import React, { useState } from 'react';

interface ChatInterfaceProps {
  character: any;
  onBack: () => void;
  consumeCredit: () => boolean;
  credits: number;
}

export default function ChatInterface({ character, onBack, consumeCredit, credits }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([
    { sender: 'char', text: `Yo... what's good? I'm ${character?.name || 'Velvet'}.` }
  ]);
  const [input, setInput] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!consumeCredit()) {
      alert("Out of credits! Top up to keep chatting.");
      return;
    }

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: character?.name || 'Velvet',
          messages: [...messages, userMsg].map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      const data = await response.json();

      if (data.reply) {
        setMessages(prev => [...prev, { sender: 'char', text: data.reply }]);
      }
    } catch (err) {
      console.error("Failed to fetch chat response:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <button 
          onClick={onBack}
          className="px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700 text-sm"
        >
          Back
        </button>
        <span className="font-bold">{character?.name || 'Velvet'}</span>
        <span className="text-sm text-zinc-400">Credits: {credits}</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs px-4 py-2 rounded-lg ${
                m.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-800 text-zinc-200'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-zinc-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-blue-500 text-white"
        />
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
}