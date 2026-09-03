import React, { useState } from 'react';

interface ChatInterfaceProps {
  character: any;
  onBack: () => void;
  consumeCredit: () => boolean;
  credits: number;
}

export default function ChatInterface({ character, onBack, consumeCredit, credits }: ChatInterfaceProps) {
  const [messages, setMessages] = useState([
    { sender: 'char', text: `Yo... what's good? I'm ${character?.name || 'Velvet'}.` }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!consumeCredit()) {
      alert("Out of credits! Top up to keep chatting.");
      return;
    }

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulated character response
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'char', text: "That's heavy. Tell me more." }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
        <button 
          onClick={onBack}
          className="bg-zinc-800 px-3 py-1 rounded-lg text-sm hover:bg-zinc-700"
        >
          ← Back
        </button>
        <h2 className="text-lg font-bold text-yellow-500">{character?.name || 'Chat'}</h2>
        <span className="text-yellow-500 font-bold">Credits: {credits}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-xl max-w-[80%] ${msg.sender === 'user' ? 'bg-purple-600 ml-auto' : 'bg-zinc-900 border border-zinc-800 mr-auto'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
        />
        <button 
          type="submit"
          className="bg-yellow-500 text-black font-bold px-5 py-2 rounded-xl hover:bg-yellow-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}

