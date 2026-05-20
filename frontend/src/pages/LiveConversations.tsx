import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Bot, User, Send, CheckCircle2, ShieldAlert, Search, RefreshCw } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  siteId: string;
  visitorId: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'resolved' | 'escalated_whatsapp' | 'intercepted';
  messages: Message[];
}

interface Site {
  id: string;
  name: string;
}

function LiveConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sites, setSites] = useState<Record<string, string>>({});
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'escalated' | 'intercepted'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const backendUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:5000'
    : window.location.origin;

  useEffect(() => {
    fetchSitesAndConversations();

    // Poll conversations every 3 seconds for simulated real-time experience
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConvId, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function fetchSitesAndConversations() {
    try {
      const sitesRes = await fetch(`${backendUrl}/api/admin/sites`);
      const sitesData = await sitesRes.json();
      const siteMap: Record<string, string> = {};
      sitesData.forEach((s: any) => {
        siteMap[s.id] = s.name;
      });
      setSites(siteMap);
      await fetchConversations(true);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  async function fetchConversations(showSpinner = true) {
    if (showSpinner) setLoading(true);
    else setPolling(true);

    try {
      const res = await fetch(`${backendUrl}/api/admin/conversations`);
      const data: Conversation[] = await res.json();
      setConversations(data);
      
      // Select first conversation if none selected
      if (data.length > 0 && !selectedConvId) {
        setSelectedConvId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;

    const currentText = replyText;
    setReplyText('');

    try {
      // Send manual agent message. Endpoint automatically sets conversation status to 'intercepted'
      const res = await fetch(`${backendUrl}/api/admin/conversations/${selectedConvId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'agent', text: currentText }),
      });
      const updatedConv = await res.json();

      setConversations(conversations.map(c => c.id === updatedConv.id ? updatedConv : c));
    } catch (error) {
      console.error('Error sending agent reply:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'active' | 'resolved' | 'intercepted') => {
    try {
      const res = await fetch(`${backendUrl}/api/admin/conversations/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updatedConv = await res.json();
      setConversations(conversations.map(c => c.id === updatedConv.id ? updatedConv : c));
    } catch (error) {
      console.error('Error updating conversation status:', error);
    }
  };

  const activeConv = conversations.find(c => c.id === selectedConvId) || null;

  // Filter & Search logic
  const filteredConversations = conversations.filter(c => {
    const siteName = sites[c.siteId] || 'Sitio Desconocido';
    const matchesSearch = c.visitorId.toLowerCase().includes(search.toLowerCase()) || 
                          siteName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'active') return c.status === 'active';
    if (filter === 'escalated') return c.status === 'escalated_whatsapp';
    if (filter === 'intercepted') return c.status === 'intercepted';
    return true; // 'all'
  });

  const getStatusBadge = (status: string) => {
    if (status === 'resolved') {
      return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[9px]">Resuelto</span>;
    }
    if (status === 'escalated_whatsapp') {
      return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-[9px] flex items-center gap-1">Escalado WA</span>;
    }
    if (status === 'intercepted') {
      return <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold text-[9px]">Agente Humano</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold text-[9px]">IA Activa</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
      {/* Sidebar - Chat list (4 cols) */}
      <div className="lg:col-span-4 flex flex-col h-full bg-gray-900/10 rounded-3xl border border-gray-800/40 overflow-hidden">
        {/* Search & Header */}
        <div className="p-4 border-b border-gray-800/30 space-y-3 bg-[#07080a]/30">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Chats Activos
            </h3>
            <div className="flex items-center gap-1.5">
              {polling && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>}
              <button 
                onClick={() => fetchConversations(true)}
                className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-500 hover:text-white"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar visitante o sitio..."
              className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex border-b border-gray-800/20 text-xs px-2 py-1 gap-1">
          {['all', 'active', 'escalated', 'intercepted'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[9px] tracking-wider transition ${
                filter === f
                  ? 'bg-purple-600/15 text-purple-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f === 'all' && 'Todos'}
              {f === 'active' && 'Con IA'}
              {f === 'escalated' && 'Escalados'}
              {f === 'intercepted' && 'Interceptados'}
            </button>
          ))}
        </div>

        {/* Chat List Scrollable */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800/25">
          {filteredConversations.map((conv) => {
            const lastMsg = conv.messages && conv.messages.length > 0 
              ? conv.messages[conv.messages.length - 1] 
              : null;
            const siteName = sites[conv.siteId] || 'Sitio Desconocido';
            const isActive = conv.id === selectedConvId;
            
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-4 text-left cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-purple-600/5 border-l-4 border-l-purple-500'
                    : 'hover:bg-gray-900/20'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-white truncate max-w-[130px]">
                    {conv.visitorId.slice(0, 10)}...
                  </span>
                  <span className="text-[9px] text-gray-500">
                    {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-400 block truncate max-w-[150px] font-medium">
                    {siteName}
                  </span>
                  {getStatusBadge(conv.status)}
                </div>
                <p className="text-[11px] text-gray-500 truncate">
                  {lastMsg ? lastMsg.text : 'Sin mensajes'}
                </p>
              </div>
            );
          })}
          {filteredConversations.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-12">No se encontraron conversaciones.</p>
          )}
        </div>
      </div>

      {/* Main Inbox panel (8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-full bg-gray-900/10 rounded-3xl border border-gray-800/40 overflow-hidden">
        {activeConv ? (
          <div className="flex flex-col h-full">
            {/* Box Header */}
            <div className="p-4 border-b border-gray-800/30 bg-[#07080a]/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Visitante ID: {activeConv.visitorId.slice(0, 15)}...
                </h4>
                <span className="text-xs text-gray-500">Sitio: {sites[activeConv.siteId] || 'Cargando...'}</span>
              </div>
              <div className="flex items-center gap-2">
                {activeConv.status === 'intercepted' ? (
                  <button
                    onClick={() => handleUpdateStatus(activeConv.id, 'active')}
                    className="px-3.5 py-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 font-bold text-[10px] uppercase tracking-wider transition"
                  >
                    Habilitar IA
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(activeConv.id, 'intercepted')}
                    className="px-3.5 py-1.5 rounded-xl border border-gray-800 hover:border-gray-700 bg-gray-900 text-gray-300 font-bold text-[10px] uppercase tracking-wider transition"
                  >
                    Tomar Control
                  </button>
                )}

                <button
                  onClick={() => handleUpdateStatus(activeConv.id, 'resolved')}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider transition"
                >
                  Marcar Resuelto
                </button>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-950/20">
              {activeConv.messages?.map((msg, index) => {
                const isAgent = msg.sender === 'agent';
                const isBot = msg.sender === 'bot';
                
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1 px-1">
                      {isBot && <Bot className="w-3.5 h-3.5 text-purple-400" />}
                      {!isBot && !isAgent && <User className="w-3.5 h-3.5 text-gray-400" />}
                      <span className="font-semibold">
                        {isBot ? 'Bot IA' : isAgent ? 'Tú (Agente)' : 'Visitante'}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isAgent
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : isBot
                          ? 'bg-gray-850/80 border border-gray-800 text-purple-300 rounded-tl-none'
                          : 'bg-gray-900 border border-gray-850 text-white rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <div className="p-4 border-t border-gray-800/30 bg-[#07080a]/30">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    activeConv.status === 'intercepted'
                      ? "Escribe tu respuesta como agente humano..."
                      : "Escribe para responder (tomarás control manual, desactivando la IA)..."
                  }
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs focus:outline-none"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <span className="text-[9px] text-gray-500 mt-2 block">
                {activeConv.status === 'intercepted' 
                  ? "Control Manual Activo: El bot IA no responderá a los nuevos mensajes del cliente." 
                  : "Modo IA: Si envías un mensaje, tomarás automáticamente el control humano."}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full p-12">
            <MessageSquare className="w-12 h-12 text-gray-700 mb-4" />
            <h3 className="text-base font-bold text-white mb-1">No hay chats abiertos</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Las conversaciones que los clientes inicien en tus sitios web aparecerán aquí en tiempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveConversations;
