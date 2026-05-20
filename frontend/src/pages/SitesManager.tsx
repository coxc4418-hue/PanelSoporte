import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Code, Save, ChevronDown, Check, Copy, CheckCircle, Globe, Settings, HelpCircle, FileText } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
}

interface Site {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  isActive: boolean;
  themeColor: string;
  logoUrl: string;
  position: 'right' | 'left';
  welcomeMessage: string;
  avatarUrl: string;
  aiModel: string;
  systemPrompt: string;
  faqs: FAQ[];
  companyInfo: string;
  whatsappNumber: string;
  supportSchedule: {
    active: boolean;
    start: string;
    end: string;
  };
}

function SitesManager() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'faqs' | 'embed'>('general');

  // New site form inputs
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');

  // FAQ temp inputs
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  const backendUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:5000'
    : window.location.origin;

  useEffect(() => {
    fetchSites();
  }, []);

  async function fetchSites() {
    try {
      const res = await fetch(`${backendUrl}/api/admin/sites`);
      const data = await res.json();
      setSites(data);
      if (data.length > 0 && !selectedSite) {
        setSelectedSite(data[0]);
      }
    } catch (e) {
      console.error('Error fetching sites:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteDomain) return;

    try {
      const res = await fetch(`${backendUrl}/api/admin/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSiteName,
          domain: newSiteDomain,
          systemPrompt: `Eres un asistente de soporte virtual para ${newSiteName}. Hablas español, eres educado y respondes basándote en la información dada.`,
          faqs: [],
          companyInfo: `${newSiteName} es un sitio web que ofrece servicios profesionales.`
        }),
      });

      const newSite = await res.json();
      setSites([...sites, newSite]);
      setSelectedSite(newSite);
      setShowNewModal(false);
      setNewSiteName('');
      setNewSiteDomain('');
    } catch (error) {
      console.error('Error creating site:', error);
    }
  };

  const handleSaveSite = async () => {
    if (!selectedSite) return;
    setSaving(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/sites/${selectedSite.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedSite),
      });
      const updated = await res.json();
      
      // Update sites array
      setSites(sites.map(s => s.id === updated.id ? updated : s));
      setSelectedSite(updated);
      
      // Flash save confirmation
      const originalTitle = document.title;
      document.title = "💾 ¡Guardado!";
      setTimeout(() => { document.title = originalTitle; }, 1500);
    } catch (error) {
      console.error('Error updating site:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este sitio y toda su configuración?')) return;
    try {
      await fetch(`${backendUrl}/api/admin/sites/${id}`, { method: 'DELETE' });
      const filtered = sites.filter(s => s.id !== id);
      setSites(filtered);
      if (filtered.length > 0) {
        setSelectedSite(filtered[0]);
      } else {
        setSelectedSite(null);
      }
    } catch (error) {
      console.error('Error deleting site:', error);
    }
  };

  const handleCopyCode = (apiKey: string) => {
    const code = `<!-- OroDig AI Floating Widget Loader -->
<script src="${backendUrl}/widget.js"></script>
<script>
  window.OroDigAI.init({
    apiKey: "${apiKey}"
  });
</script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFaq = () => {
    if (!selectedSite || !newQ || !newA) return;
    const updatedFaqs = [...(selectedSite.faqs || []), { q: newQ, a: newA }];
    setSelectedSite({ ...selectedSite, faqs: updatedFaqs });
    setNewQ('');
    setNewA('');
  };

  const handleRemoveFaq = (idx: number) => {
    if (!selectedSite) return;
    const updatedFaqs = selectedSite.faqs.filter((_, i) => i !== idx);
    setSelectedSite({ ...selectedSite, faqs: updatedFaqs });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[calc(100vh-120px)]">
      {/* Sidebar Sites Selector */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Tus Sitios
          </h3>
          <button
            onClick={() => setShowNewModal(true)}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {sites.map((site) => (
            <div
              key={site.id}
              onClick={() => { setSelectedSite(site); setActiveTab('general'); }}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 ${
                selectedSite?.id === site.id
                  ? 'bg-purple-600/10 border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.05)]'
                  : 'bg-gray-900/40 border-gray-800/40 hover:border-gray-700/60 hover:bg-gray-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm block truncate max-w-[120px] text-white">
                  {site.name}
                </span>
                <span className={`w-2 h-2 rounded-full ${site.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </div>
              <span className="text-[10px] text-gray-500 block truncate mt-1">
                {site.domain}
              </span>
            </div>
          ))}
          {sites.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-8">Registra tu primer sitio para comenzar.</p>
          )}
        </div>
      </div>

      {/* Settings Form Wrapper */}
      <div className="lg:col-span-3">
        {selectedSite ? (
          <div className="glass-card rounded-3xl p-8 h-full flex flex-col justify-between relative overflow-hidden">
            {/* Save indicator float */}
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: selectedSite.themeColor || '#8b5cf6' }}></div>

            <div>
              {/* Tab Header & Action header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/30 pb-6 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-6 h-6 text-purple-400" />
                    {selectedSite.name}
                  </h2>
                  <span className="text-xs text-gray-500">{selectedSite.domain}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDeleteSite(selectedSite.id)}
                    className="p-2.5 rounded-xl border border-transparent text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition duration-200"
                    title="Eliminar Sitio"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSaveSite}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-lg transition duration-200 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-800/20 mb-8 overflow-x-auto gap-2">
                {[
                  { id: 'general', name: 'Apariencia & Widget', icon: Settings },
                  { id: 'ai', name: 'Comportamiento & Prompt', icon: FileText },
                  { id: 'faqs', name: 'Preguntas Frecuentes (FAQs)', icon: HelpCircle },
                  { id: 'embed', name: 'Script de Integración', icon: Code }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 border-b-2 font-semibold text-xs tracking-wider uppercase whitespace-nowrap pb-3 transition duration-200 ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-400'
                          : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="space-y-6">
                {activeTab === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Site Status */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        Estado de la IA
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSite({ ...selectedSite, isActive: !selectedSite.isActive })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            selectedSite.isActive ? 'bg-purple-600' : 'bg-gray-800'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            selectedSite.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}></span>
                        </button>
                        <span className="text-sm font-semibold text-white">
                          {selectedSite.isActive ? 'Activo (Widget visible)' : 'Desactivado (Widget oculto)'}
                        </span>
                      </div>
                    </div>

                    {/* Widget Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        Color del Widget
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          className="w-10 h-10 border border-gray-800 bg-transparent rounded-lg cursor-pointer"
                          value={selectedSite.themeColor}
                          onChange={(e) => setSelectedSite({ ...selectedSite, themeColor: e.target.value })}
                        />
                        <input
                          type="text"
                          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs font-mono"
                          value={selectedSite.themeColor}
                          onChange={(e) => setSelectedSite({ ...selectedSite, themeColor: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Welcome Message */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        Mensaje de Bienvenida
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                        value={selectedSite.welcomeMessage}
                        onChange={(e) => setSelectedSite({ ...selectedSite, welcomeMessage: e.target.value })}
                      />
                    </div>

                    {/* Avatar URL */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        URL Avatar Asistente
                      </label>
                      <input
                        type="text"
                        placeholder="https://ejemplo.com/avatar.png"
                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                        value={selectedSite.avatarUrl}
                        onChange={(e) => setSelectedSite({ ...selectedSite, avatarUrl: e.target.value })}
                      />
                    </div>

                    {/* Widget Position */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        Posición en Pantalla
                      </label>
                      <select
                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs focus:outline-none"
                        value={selectedSite.position}
                        onChange={(e) => setSelectedSite({ ...selectedSite, position: e.target.value as any })}
                      >
                        <option value="right">Inferior Derecha (Por Defecto)</option>
                        <option value="left">Inferior Izquierda</option>
                      </select>
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        Número de WhatsApp de Escalación
                      </label>
                      <input
                        type="text"
                        placeholder="+573000000000"
                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                        value={selectedSite.whatsappNumber}
                        onChange={(e) => setSelectedSite({ ...selectedSite, whatsappNumber: e.target.value })}
                      />
                      <span className="text-[10px] text-gray-500 block">
                        Si la IA se confunde o el usuario lo solicita, se le ofrecerá este enlace de contacto.
                      </span>
                    </div>

                    {/* API Key (Read-Only) */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        API Key del Sitio
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          className="w-full pl-4 pr-12 py-2.5 bg-gray-950 border border-gray-900 text-purple-400 font-mono text-xs rounded-xl"
                          value={selectedSite.apiKey}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedSite.apiKey);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="absolute right-2 top-2 p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    {/* Model Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        Modelo de Inteligencia Artificial
                      </label>
                      <select
                        className="w-full md:w-1/2 px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs focus:outline-none"
                        value={selectedSite.aiModel}
                        onChange={(e) => setSelectedSite({ ...selectedSite, aiModel: e.target.value })}
                      >
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Ultra-rápido - Recomendado)</option>
                        <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Mayor Capacidad)</option>
                        <option value="gemma2-9b-it">Gemma 2 9B IT (Google - Español Excelente)</option>
                      </select>
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        Instrucciones del Sistema (System Prompt)
                      </label>
                      <textarea
                        rows={5}
                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                        value={selectedSite.systemPrompt}
                        onChange={(e) => setSelectedSite({ ...selectedSite, systemPrompt: e.target.value })}
                        placeholder="Define la personalidad de tu bot, el tono de voz y las reglas..."
                      />
                    </div>

                    {/* Company Info Context */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                        Información Contextual de la Empresa (Entrenamiento)
                      </label>
                      <textarea
                        rows={5}
                        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                        value={selectedSite.companyInfo}
                        onChange={(e) => setSelectedSite({ ...selectedSite, companyInfo: e.target.value })}
                        placeholder="Detalla qué hace la empresa, planes, costos, servicios y políticas de entrega..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'faqs' && (
                  <div className="space-y-6">
                    {/* Add FAQ form */}
                    <div className="p-4 rounded-2xl bg-gray-900/40 border border-gray-800/40 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          Pregunta Frecuente
                        </label>
                        <input
                          type="text"
                          placeholder="¿Cuál es el tiempo de entrega?"
                          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                          value={newQ}
                          onChange={(e) => setNewQ(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          Respuesta
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nuestros servicios se entregan en 3 a 5 días hábiles."
                            className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                            value={newA}
                            onChange={(e) => setNewA(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={handleAddFaq}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition duration-200"
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* FAQ List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Preguntas entrenadas ({selectedSite.faqs?.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {selectedSite.faqs?.map((faq, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-gray-900/20 border border-gray-800/50 flex justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-extrabold text-purple-300">Q: {faq.q}</p>
                              <p className="text-xs text-gray-400">A: {faq.a}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(idx)}
                              className="text-gray-500 hover:text-red-400 self-center flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(!selectedSite.faqs || selectedSite.faqs.length === 0) && (
                          <p className="text-xs text-gray-500 text-center py-6">No has agregado ninguna FAQ para entrenar.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'embed' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                      <p className="text-xs text-purple-300 leading-relaxed">
                        Integra la burbuja de soporte en cualquier página web copiando e insertando el siguiente código HTML justo antes del cierre de la etiqueta <code>&lt;/body&gt;</code>.
                      </p>
                    </div>

                    {/* Code copy box */}
                    <div className="relative">
                      <pre className="p-6 rounded-2xl bg-gray-950 border border-gray-900 text-cyan-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`<!-- OroDig AI Floating Widget Loader -->
<script src="${backendUrl}/widget.js"></script>
<script>
  window.OroDigAI.init({
    apiKey: "${selectedSite.apiKey}"
  });
</script>`}
                      </pre>
                      <button
                        onClick={() => handleCopyCode(selectedSite.apiKey)}
                        className="absolute right-4 top-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-400 hover:text-white"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4.5 h-4.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4.5 h-4.5" />
                            <span>Copiar Código</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Embed instruction */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Sitios Autorizados</h4>
                      <p className="text-xs text-gray-500">
                        La API validará solicitudes de origen que coincidan con tu dominio configurado: <code>{selectedSite.domain}</code>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-12 flex flex-col items-center justify-center text-center h-full">
            <Globe className="w-12 h-12 text-gray-600 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-2">No hay sitios registrados</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-6">
              Registra tus sitios web para poder conectar el widget flotante de IA y entrenar sus respuestas.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Sitio</span>
            </button>
          </div>
        )}
      </div>

      {/* New Site Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl max-w-md w-full p-8 relative overflow-hidden animate-scale-up">
            <h3 className="text-lg font-bold text-white mb-4">Registrar Nuevo Sitio Web</h3>
            <form onSubmit={handleCreateSite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Nombre del Sitio
                </label>
                <input
                  type="text"
                  required
                  placeholder="OroDig Colombia"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Dominio (Domain URL)
                </label>
                <input
                  type="text"
                  required
                  placeholder="orodig-col.web.app"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs"
                  value={newSiteDomain}
                  onChange={(e) => setNewSiteDomain(e.target.value)}
                />
                <span className="text-[9px] text-gray-500">No incluyas http:// ni barras inclinadas.</span>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-transparent border border-gray-850 hover:bg-gray-900 text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Crear e Iniciar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SitesManager;
