import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, MessageSquare, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import TulaCharacter from './TulaCharacter';
import { useSurvey } from '../surveyData';

interface TulaChatProps {
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  onNavigate: (view: 'welcome' | 'explore' | 'aula', targetModule?: string, targetQuestion?: string) => void;
}

const DEFAULT_SUGGESTIONS = [
  '¿Cuántas personas respondieron y cuántas se descartaron?',
  '¿Qué localidad califica mejor al Alcalde?',
  '¿Qué dicen los bogotanos de la seguridad?',
  '¿Qué tan satisfechos están con el aseo y las tarifas?'
];

export default function TulaChat({
  chatOpen,
  setChatOpen,
  unreadCount,
  setUnreadCount,
  onNavigate
}: TulaChatProps) {
  const surveyAnio = useSurvey().meta.anio;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with Tula's warm greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'tula',
          text: '¡Hola, vecino! 🌾 Soy **Tula**, tu tingua guía. Respondo solo con lo que hay en la base de datos de la encuesta EPCI 2025: si un dato no está, te lo digo.\n\n¿De qué quieres hablar? Puedo contarte resultados por tema (seguridad, trámites, servicios públicos, confianza…) y la calificación del Alcalde por localidad.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build history payload for the backend API
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await fetch('/api/aprende/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          anio: surveyAnio,
          history: historyPayload
        })
      });

      const data = await res.json();

      if (res.ok && data.text) {
        // Parse custom actions if returned in text
        let action: { label: string; go: string } | undefined;
        let responseText = data.text;

        // Simple tag parser, e.g., [ACTION: Ver módulo Confianza|explore_confianza]
        const actionMatch = responseText.match(/\[ACTION:(.*?)\|(.*?)\]/);
        if (actionMatch) {
          responseText = responseText.replace(/\[ACTION:.*?\]/g, '');
          action = {
            label: actionMatch[1],
            go: actionMatch[2]
          };
        }

        const tulaMsg: ChatMessage = {
          id: `tula-${Date.now()}`,
          role: 'tula',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action
        };
        setMessages(prev => [...prev, tulaMsg]);
        if (!chatOpen) {
          setUnreadCount(unreadCount + 1);
        }
      } else {
        throw new Error(data.error || 'Respuesta inválida del servidor');
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `tula-error-${Date.now()}`,
        role: 'tula',
        text: 'No pude consultar la base de datos en este momento. Intenta de nuevo en unos minutos.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (go: string) => {
    if (go === 'aula') {
      onNavigate('aula');
      setChatOpen(false);
    } else if (go === 'explore') {
      onNavigate('explore');
      setChatOpen(false);
    } else if (go.startsWith('explore_')) {
      const moduleKey = go.substring(8);
      onNavigate('explore', moduleKey);
      setChatOpen(false);
    } else if (go.startsWith('question_')) {
      const qKey = go.substring(9);
      // Find the question module
      onNavigate('explore', undefined, qKey);
      setChatOpen(false);
    }
  };

  // Helper to format text with bold and italics
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Bold formatter: **text**
      let formatted = line;
      
      // Simple bold replacement
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(formatted)) !== null) {
        if (match.index > lastIndex) {
          parts.push(formatted.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-teal-800 dark:text-teal-400 text-[1.08em]">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < formatted.length) {
        parts.push(formatted.substring(lastIndex));
      }

      const finalLine = parts.length > 0 ? parts : formatted;

      return (
        <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
          {finalLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Chat Trigger Button (FAB) */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            id="tula-fab"
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-neutral-900 shadow-lg hover:bg-teal-700 transition-colors"
            onClick={() => {
              setChatOpen(true);
              setUnreadCount(0);
            }}
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Preguntar a Tula"
          >
            {/* Custom Tingua SVG Icon */}
            <TulaCharacter mood="inline" className="h-10 w-10" />
            
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white border-2 border-white">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            id="tula-panel"
            className="fixed bottom-6 right-6 z-50 flex h-[600px] w-96 max-w-[calc(100vw-32px)] flex-col rounded-lg border border-neutral-200 bg-white shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-neutral-900 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white overflow-hidden">
                  <TulaCharacter mood="chat" className="h-9 w-9" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold tracking-tight">Tula</h3>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    En línea
                  </div>
                </div>
              </div>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
                onClick={() => setChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto bg-neutral-50 p-4">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === 'user' ? 'self-end' : 'self-start'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        msg.role === 'user'
                          ? 'rounded-br-none bg-neutral-900 text-white'
                          : 'rounded-bl-none border border-neutral-200 bg-white text-neutral-800'
                      }`}
                    >
                      {formatMessageText(msg.text)}

                      {/* Optional Interactive Action Button */}
                      {msg.action && (
                        <button
                          className="mt-3 inline-flex items-center justify-center rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
                          onClick={() => handleActionClick(msg.action!.go)}
                        >
                          {msg.action.label} <span>→</span>
                        </button>
                      )}
                    </div>
                    <span className={`mt-1 text-[10px] text-neutral-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex max-w-[85%] self-start flex-col">
                    <div className="rounded-2xl rounded-bl-none border border-neutral-200 bg-white px-4 py-3.5 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Smart Suggestions */}
            <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2">
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    className="cursor-pointer rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all font-medium"
                    onClick={() => handleSendMessage(sug)}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="flex gap-2 border-t border-neutral-200 bg-white p-3">
              <input
                type="text"
                className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none transition-all"
                placeholder="Pregúntale a Tula sobre la encuesta..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(inputText);
                }}
                disabled={isTyping}
              />
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
                onClick={() => handleSendMessage(inputText)}
                disabled={isTyping || !inputText.trim()}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
