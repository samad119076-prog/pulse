import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, Sparkles, Volume2, User, Loader2 } from 'lucide-react';
import { ChatMessage, AiRole } from '../types.ts';

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  creatorHandle: string;
  onPlayTts: (text: string) => void;
  isTtsLoading?: boolean;
}

export default function GeminiChatDrawer({
  isOpen,
  onClose,
  videoTitle,
  creatorHandle,
  onPlayTts,
  isTtsLoading = false,
}: GeminiChatDrawerProps) {
  const [role, setRole] = useState<AiRole>('copilot');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content: `Hey! I'm your Shorts Co-Pilot. We're watching "${videoTitle}" by ${creatorHandle}. Ask me anything about the hook, cinematography, sound design, or creative ideas!`,
      timestamp: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const newMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setLoading(true);

    // Determine model according to required instructions:
    // "Use gemini-3.1-pro-preview for particularly complex tasks, gemini-3.5-flash for general tasks, and gemini-3.1-flash-lite for tasks that should happen fast."
    let modelChoice = 'gemini-3.5-flash';
    if (role === 'analyst') {
      modelChoice = 'gemini-3.1-pro-preview';
    } else if (role === 'creator') {
      modelChoice = 'gemini-3.1-flash-lite';
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          role,
          model: modelChoice,
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            role: 'model',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          content: 'Sorry, I hit a temporary snag connecting to Gemini. Please try again in a moment.',
          timestamp: 'Now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Break down the video hook & retention',
    'How was this cinematic shot captured?',
    'Give me 3 viral remix concepts',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="gemini-chat-backdrop" className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            id="gemini-chat-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 flex h-[78vh] max-h-[680px] w-full max-w-md flex-col rounded-t-3xl bg-neutral-900 text-white shadow-2xl border-t border-purple-500/20"
          >
            {/* Grabber */}
            <div className="flex w-full items-center justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold">Shorts Gemini Co-Pilot</h3>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 font-semibold px-1.5 py-0.5 rounded border border-purple-500/30">
                      AI
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">
                    Discussing: {videoTitle}
                  </p>
                </div>
              </div>
              <button
                id="close-chat-btn"
                onClick={onClose}
                className="rounded-full p-1 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Role selector pill tabs */}
            <div className="flex items-center gap-1 px-4 py-2.5 bg-neutral-950/60 border-b border-white/5 overflow-x-auto text-xs scrollbar-none">
              <span className="text-[11px] text-neutral-500 mr-1 shrink-0">Role:</span>
              <button
                onClick={() => setRole('copilot')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  role === 'copilot'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                ⚡ Co-Pilot (gemini-3.5-flash)
              </button>
              <button
                onClick={() => setRole('analyst')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  role === 'analyst'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                🔬 Critic (gemini-3.1-pro-preview)
              </button>
              <button
                onClick={() => setRole('creator')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  role === 'creator'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                🚀 Creator Fast (gemini-3.1-flash-lite)
              </button>
            </div>

            {/* Scrollable messages thread */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                        isUser
                          ? 'bg-neutral-700 text-white'
                          : 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white'
                      }`}
                    >
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-red-600 text-white rounded-tr-none'
                          : 'bg-neutral-800 text-neutral-100 rounded-tl-none border border-white/5'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-neutral-400">
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => onPlayTts(msg.content)}
                            disabled={isTtsLoading}
                            className="flex items-center gap-1 hover:text-purple-300 transition-colors"
                            title="Speak response with Gemini TTS"
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>TTS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-purple-400 pt-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Gemini is generating response...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts bar */}
            <div className="px-4 py-2 border-t border-white/5 bg-neutral-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  className="rounded-full bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white whitespace-nowrap transition-colors border border-white/5 shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-white/10 bg-neutral-950/90">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  id="gemini-chat-input"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask ${role === 'analyst' ? 'Critic' : role === 'creator' ? 'Strategist' : 'Co-Pilot'}...`}
                  className="flex-1 rounded-full bg-neutral-800 px-4 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-purple-500 border border-white/5"
                />
                <button
                  type="submit"
                  id="submit-chat-btn"
                  disabled={!inputMessage.trim() || loading}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-white disabled:bg-neutral-800 disabled:text-neutral-600 hover:bg-purple-500 transition-colors shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
