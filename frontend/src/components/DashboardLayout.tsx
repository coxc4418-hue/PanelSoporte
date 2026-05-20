import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, MessageSquare, LogOut, Bot, Server } from 'lucide-react';

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;

  // Protect route
  useEffect(() => {
    const token = localStorage.getItem('orodig_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('orodig_token');
    localStorage.removeItem('orodig_user');
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Estadísticas',
      path: '/dashboard/stats',
      icon: LayoutDashboard,
    },
    {
      name: 'Gestión de Sitios',
      path: '/dashboard/sites',
      icon: Globe,
    },
    {
      name: 'Bandeja de Chats',
      path: '/dashboard/conversations',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#07080a] text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-gray-800/50 flex flex-col justify-between p-6 z-20">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                OroDig AI
              </span>
              <span className="text-[10px] block font-semibold text-purple-400 tracking-widest uppercase">
                Support Hub
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600/10 border border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.05)]'
                      : 'border border-transparent text-gray-400 hover:text-white hover:bg-gray-900/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : ''}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="space-y-4 pt-6 border-t border-gray-800/40">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm text-white">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Administrador</p>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-500" /> Local Host Mode
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm border border-transparent text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-gray-800/30 px-8 flex items-center justify-between bg-[#07080a]/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400">
            {navItems.find((n) => activePath.startsWith(n.path))?.name || 'Administración'}
          </h2>
          <div className="flex items-center gap-4 text-xs font-medium text-purple-400 px-3 py-1.5 rounded-full bg-purple-500/5 border border-purple-500/10">
            <span>Server: Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
