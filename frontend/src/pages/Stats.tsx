import React, { useState, useEffect } from 'react';
import { MessageSquare, Globe, Cpu, Users, ChevronRight, Activity, TrendingUp } from 'lucide-react';

function Stats() {
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    totalConversations: 0,
    activeChats: 0,
    totalMessages: 0,
    tokensUsed: 0
  });
  const [recentSites, setRecentSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const backendUrl = window.location.origin.includes('localhost')
          ? 'http://localhost:5000'
          : window.location.origin;

        // Fetch sites
        const sitesRes = await fetch(`${backendUrl}/api/admin/sites`);
        const sites = await sitesRes.json();

        // Fetch conversations
        const convRes = await fetch(`${backendUrl}/api/admin/conversations`);
        const conversations = await convRes.json();

        const activeSites = sites.filter((s: any) => s.isActive).length;
        const activeChats = conversations.filter((c: any) => c.status === 'active' || c.status === 'intercepted').length;
        
        let totalMessages = 0;
        conversations.forEach((c: any) => {
          if (c.messages) totalMessages += c.messages.length;
        });

        // Estimate tokens
        const tokensUsed = totalMessages * 165; // Mock token calculation

        setStats({
          totalSites: sites.length,
          activeSites,
          totalConversations: conversations.length,
          activeChats,
          totalMessages,
          tokensUsed
        });

        setRecentSites(sites.slice(0, 3));
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const cardItems = [
    {
      title: 'Dominios Conectados',
      value: stats.totalSites,
      subtext: `${stats.activeSites} Activos`,
      icon: Globe,
      color: 'text-cyan-400',
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      bgGlow: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Conversaciones Totales',
      value: stats.totalConversations,
      subtext: `${stats.activeChats} En tiempo real`,
      icon: MessageSquare,
      color: 'text-purple-400',
      glow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
      bgGlow: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Mensajes Procesados',
      value: stats.totalMessages,
      subtext: 'Usuario ↔ IA / Agente',
      icon: Users,
      color: 'text-pink-400',
      glow: 'shadow-[0_0_15px_rgba(236,72,153,0.15)]',
      bgGlow: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      title: 'Tokens Estimados Groq',
      value: stats.tokensUsed.toLocaleString(),
      subtext: 'Bajo costo operativo',
      icon: Cpu,
      color: 'text-amber-400',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      bgGlow: 'bg-amber-500/10 border-amber-500/20'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardItems.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`glass-card rounded-2xl p-6 relative overflow-hidden ${card.glow}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-bl-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                    {card.title}
                  </span>
                  <h3 className="text-3xl font-extrabold tracking-tight text-white">
                    {card.value}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">{card.subtext}</p>
                </div>
                <div className={`p-3 rounded-xl border ${card.bgGlow}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SVG Graphic */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Interacciones Mensajes
              </h3>
              <p className="text-xs text-gray-500">
                Historial de flujo de mensajes por hora (simulación)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> IA
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Humanos
              </span>
            </div>
          </div>

          {/* SVG Line Graph */}
          <div className="h-64 relative w-full">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="5 5" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="5 5" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="5 5" />
              
              {/* Purple Line (IA) */}
              <path
                d="M 0 160 Q 50 140 100 120 T 200 80 T 300 90 T 400 50 T 500 30"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
              />
              
              {/* Cyan Line (Humanos) */}
              <path
                d="M 0 180 Q 80 170 160 160 T 320 140 T 400 150 T 500 120"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              />
              
              {/* Interactive Dots */}
              <circle cx="400" cy="50" r="5" fill="#8b5cf6" className="animate-ping" />
              <circle cx="400" cy="50" r="4.5" fill="#fff" stroke="#8b5cf6" strokeWidth="2" />
            </svg>
            <div className="absolute bottom-[-15px] left-0 w-full flex justify-between text-[10px] text-gray-500 font-medium px-2">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>Ahora</span>
            </div>
          </div>
        </div>

        {/* Quick View Connected Sites */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Sitios Activos
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Monitoreo rápido de integraciones
            </p>

            <div className="space-y-4">
              {recentSites.map((site) => (
                <div key={site.id} className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: site.themeColor || '#8b5cf6' }}
                    ></div>
                    <div>
                      <p className="text-xs font-bold text-white">{site.name}</p>
                      <span className="text-[10px] text-gray-500 block truncate max-w-[120px]">
                        {site.domain}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                    site.isActive 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {site.isActive ? 'Activo' : 'Pausado'}
                  </span>
                </div>
              ))}
              {recentSites.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-6">No hay sitios registrados.</p>
              )}
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 mt-6 py-2.5 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white transition duration-200">
            <span>Ver todos los sitios</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Stats;
