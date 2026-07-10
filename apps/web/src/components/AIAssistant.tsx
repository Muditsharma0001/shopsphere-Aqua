'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! I am your HydraFlow Assistant. Ask me anything about our premium computational hydration containers, insulation features, or warranty registrations.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');
    
    const updatedMessages = [...messages, { role: 'user', content: messageText } as Message];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      if (data.success && data.data?.text) {
        setMessages([...updatedMessages, { role: 'model', content: data.data.text }]);
      } else {
        setMessages([...updatedMessages, { role: 'model', content: 'Sorry, I encountered a temporary connection issue. How else can I help you with our bottles?' }]);
      }
    } catch (err) {
      console.error('AI Assistant chat error:', err);
      setMessages([...updatedMessages, { role: 'model', content: 'Apologies, I am having trouble reaching our AI servers right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 cursor-pointer focus:outline-none relative"
      >
        <span>{isOpen ? '✕' : '💬'}</span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-pink-500 border-2 border-[#030304] animate-ping" />
        )}
      </motion.button>

      {/* Expanded Chat Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[380px] h-[500px] rounded-3xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          >
            
            {/* Header info */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-900 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                ⚡
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">AQUA COGNITIVE ENGINE</h3>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mt-0.5">HydraFlow AI Assistant</span>
              </div>
            </div>

            {/* Messages box list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2 scrollbar-none">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-[10.5px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-zinc-900/60 border border-zinc-850 text-zinc-300 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator placeholder */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900/60 border border-zinc-850 text-zinc-400 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce delay-150" />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce delay-300" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick action chips */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {[
                  'Best bottle for hiking?',
                  'Warranty coverage details',
                  'Vacuum insulation specifications',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    className="px-2.5 py-1.5 rounded-full border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-[8px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Send form footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-zinc-950 border-t border-zinc-900 flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask about HydraFlow products..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Send
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
