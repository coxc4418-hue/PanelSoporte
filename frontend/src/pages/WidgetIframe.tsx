import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, MessageSquare, PhoneCall, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
}

interface SiteConfig {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  themeColor: string;
  logoUrl: string;
  position: 'right' | 'left';
  welcomeMessage: string;
  avatarUrl: string;
  whatsappNumber: string;
  supportSchedule: { active: boolean };
  faqs: Array<{ q: string; a: string }>;
}

function WidgetIframe() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visitorId, setVisitorId] = useState('');
  const [error, setError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryParams = new URLSearchParams(window.location.search);
  const apiKey = queryParams.get('apiKey');

  const backendUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:5000'
    : window.location.origin;

  // Sound notification
  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav');
      audio.volume = 0.4;
      audio.play().catch(e => console.log("Autoplay audio blocked or failed."));
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    document.body.style.setProperty('background', 'transparent', 'important');
    document.body.style.setProperty('background-color', 'transparent', 'important');
    document.body.classList.remove('bg-[#0b0c10]');

    const htmlEl = document.documentElement;
    if (htmlEl) {
      htmlEl.style.setProperty('background', 'transparent', 'important');
      htmlEl.style.setProperty('background-color', 'transparent', 'important');
    }

    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.setProperty('background', 'transparent', 'important');
      rootEl.style.setProperty('background-color', 'transparent', 'important');
    }

    if (!apiKey) {
      setError(true);
      return;
    }

    // Set or load visitor ID
    let vId = localStorage.getItem(`orodig_visitor_${apiKey}`);
    if (!vId) {
      vId = 'vis_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(`orodig_visitor_${apiKey}`, vId);
    }
    setVisitorId(vId);

    // Fetch site config
    fetch(`${backendUrl}/api/widget/config?apiKey=${apiKey}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: SiteConfig) => {
        setConfig(data);
        
        // Notify parent about loader config
        window.parent.postMessage({
          source: 'orodig-ai-widget',
          type: 'ORODIG_CONFIG_LOADED',
          config: {
            position: data.position,
            isActive: data.isActive
          }
        }, '*');

        // Check if there are saved messages for this session
        // In this implementation, we query existing conversation from the server
        fetchSavedConversation(data.id, vId, data.welcomeMessage);
      })
      .catch(() => {
        setError(true);
      });
  }, [apiKey]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  const fetchSavedConversation = async (siteId: string, vId: string, welcomeMsg: string) => {
    try {
      // In this setup, we fetch stats/conversations or fallback
      // Since public API doesn't expose conversations easily to avoid leaks,
      // we can fetch the history from a custom endpoint or fallback to welcome message.
      // We will read local history from localStorage for safety, or pull from backend.
      // Let's read local messages from localStorage to guarantee absolute instant load and privacy!
      const savedMessages = localStorage.getItem(`orodig_chat_history_${apiKey}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        const welcome: Message = {
          sender: 'bot',
          text: welcomeMsg || '¡Hola! ¿En qué puedo ayudarte hoy?',
          timestamp: new Date().toISOString()
        };
        setMessages([welcome]);
        localStorage.setItem(`orodig_chat_history_${apiKey}`, JSON.stringify([welcome]));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    // Send message to parent to resize iframe container
    window.parent.postMessage({
      source: 'orodig-ai-widget',
      type: 'ORODIG_TOGGLE',
      open: newState
    }, '*');
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !config || !visitorId) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`orodig_chat_history_${apiKey}`, JSON.stringify(updatedMessages));
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch(`${backendUrl}/api/widget/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          visitorId,
          message: textToSend
        })
      });

      const data = await res.json();
      
      setIsTyping(false);
      const botMsg: Message = {
        sender: data.status === 'intercepted' ? 'agent' : 'bot',
        text: data.reply,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      localStorage.setItem(`orodig_chat_history_${apiKey}`, JSON.stringify(finalMessages));
      playNotificationSound();
    } catch (error) {
      setIsTyping(false);
      const errorMsg: Message = {
        sender: 'bot',
        text: 'Disculpa, he tenido un problema para conectar con el servidor. Por favor, intenta de nuevo.',
        timestamp: new Date().toISOString()
      };
      setMessages([...updatedMessages, errorMsg]);
    }
  };

  const handleFaqClick = (faq: { q: string, a: string }) => {
    // Send user question, then answer with bot faq instantly to avoid AI overhead
    // or send question to AI. Since the user wants automatic FAQ answers, we can send it directly
    // to the chat to show rapid replies:
    handleSendMessage(faq.q);
  };

  if (error || !config || !config.isActive) return null;

  const accentColor = config.themeColor || '#8b5cf6';
  
  // Custom styles injecting configuration theme colors
  const themeVars = {
    '--theme-color': accentColor,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="w-full h-full font-sans antialiased text-gray-200 p-2 overflow-hidden flex flex-col justify-end select-none">
      <AnimatePresence>
        {!isOpen ? (
          /* Launcher Button (Closed state) */
          <motion.button
            key="launcher"
            onClick={handleToggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            style={{ backgroundColor: accentColor }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl relative cursor-pointer float-right focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            {/* Glowing ring */}
            <span className="absolute -inset-1 rounded-full bg-inherit opacity-25 animate-ping pointer-events-none"></span>
            
            <MessageSquare className="w-8 h-8" />
          </motion.button>
        ) : (
          /* Chat Window (Open state) */
          <motion.div
            key="chatbox"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full max-h-[560px] rounded-3xl glass-widget flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]"
          >
            {/* Widget Header */}
            <div 
              style={{ backgroundColor: accentColor }}
              className="p-5 flex items-center justify-between text-white relative shadow-md"
            >
              {/* Radial gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

              <div className="flex items-center gap-3 relative z-10">
                {config.avatarUrl ? (
                  <img
                    src={config.avatarUrl}
                    alt="Assistant Avatar"
                    className="w-10 h-10 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight">{config.name}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Asistente Online</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggle}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition relative z-10 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg, index) => {
                const isBot = msg.sender === 'bot';
                const isAgent = msg.sender === 'agent';
                
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isBot || isAgent ? 'items-start' : 'items-end'}`}
                  >
                    <span className="text-[9px] text-gray-500 mb-1 px-1">
                      {isBot ? 'IA Support' : isAgent ? 'Agente Humano' : 'Tú'}
                    </span>
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isBot
                          ? 'bg-gray-900/60 border border-white/[0.04] text-purple-200 rounded-tl-none'
                          : isAgent
                          ? 'bg-cyan-900/40 border border-cyan-500/25 text-cyan-200 rounded-tl-none'
                          : 'bg-white/90 text-gray-950 rounded-tr-none font-medium'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {/* Typing bubble indicator */}
              {isTyping && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] text-gray-500 mb-1 px-1">IA Support</span>
                  <div className="bg-gray-900/60 border border-white/[0.04] p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* FAQs Quick Actions */}
            {config.faqs && config.faqs.length > 0 && messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-white/[0.03] space-y-1.5">
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider">Preguntas Rápidas</span>
                <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                  {config.faqs.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFaqClick(faq)}
                      className="px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] text-white/90 whitespace-nowrap transition cursor-pointer"
                    >
                      {faq.q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Escalation Bar */}
            {config.whatsappNumber && (
              <div className="px-4 py-2 bg-emerald-500/5 border-t border-white/[0.03] flex items-center justify-between text-emerald-400">
                <span className="text-[10px] font-semibold">¿Prefieres chatear por WhatsApp?</span>
                <a
                  href={`https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[10px] transition shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}

            {/* Message Input Box */}
            <div className="p-4 border-t border-white/[0.05] bg-gray-950/40">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
                className="flex gap-2 relative items-center"
              >
                <input
                  type="text"
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 pl-4 pr-12 py-3 rounded-2xl glass-input text-xs"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  style={{ backgroundColor: accentColor }}
                  className="absolute right-1.5 top-1.5 p-2 rounded-xl text-white hover:opacity-90 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
              <div className="flex justify-between items-center text-[9px] text-gray-600 mt-2 px-1">
                <span>OroDig AI Support</span>
                <span className="flex items-center gap-0.5">
                  Powered by <span className="font-semibold text-gray-500">OroDig</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WidgetIframe;
