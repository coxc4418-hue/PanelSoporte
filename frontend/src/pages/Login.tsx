import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Key, User, ArrowRight, ShieldAlert } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if we are pointing to localhost or relative backend URL
      const backendUrl = window.location.origin.includes('localhost')
        ? 'http://localhost:5000'
        : window.location.origin;

      const response = await fetch(`${backendUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenciales incorrectas');
      }

      // Save token and user info
      localStorage.setItem('orodig_token', data.token);
      localStorage.setItem('orodig_user', JSON.stringify(data.user));

      // Redirect to dashboard
      navigate('/dashboard/stats');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0b0c10] overflow-hidden px-4">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl glow-purple-lg"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl glow-cyan-lg"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-3 shadow-[0_0_15px_rgba(139,92,246,0.2)] animate-pulse">
            <Bot className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            OroDig AI Support
          </h1>
          <p className="text-gray-400 text-sm">
            Consola de Administración Centralizada
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-300 text-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@orodig.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Key className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition duration-300 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Hint info */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>Acceso de prueba local:</p>
            <p className="font-mono mt-1 text-purple-400">admin@orodig.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
