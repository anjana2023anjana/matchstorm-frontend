import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserProfile } from '../../types/auth.types';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleQuickDemoLogin = async () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const demoEmail = `player${randomSuffix}@matchstorm.com`;
    const demoUsername = `Player_${randomSuffix}`;
    const demoPassword = `DemoPass${randomSuffix}!`;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, username: demoUsername, password: demoPassword }),
      });
      const data = await res.json();
      if (res.ok && data?.data?.token && data?.data?.user) {
        setAuth(data.data.token, data.data.user);
        return;
      }
    } catch {
      // Backend unavailable or error
    }

    // Direct fallback demo user
    const fallbackUser: UserProfile = {
      id: `guest_${randomSuffix}`,
      email: demoEmail,
      username: demoUsername,
      eloRating: 1200,
      matchesWon: 5,
      matchesLost: 2,
    };
    setAuth(`guest_token_${randomSuffix}`, fallbackUser);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const endpoint = isLogin ? `${API_URL}/api/v1/auth/login` : `${API_URL}/api/v1/auth/register`;
    const normalizedEmail = email.trim().toLowerCase();
    const payload = isLogin
      ? { email: normalizedEmail, password }
      : { email: normalizedEmail, username: username.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');
      setAuth(data.data.token, data.data.user);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 text-center mb-2">
          MATCHSTORM
        </h1>
        <p className="text-slate-400 text-center text-sm mb-6">Real-Time Deterministic 1v1 PvP Engine</p>

        {errorMsg && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white shadow-lg hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            {isLogin ? 'Login to Battle' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Or</span>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoLogin}
          className="w-full py-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-cyan-500/30 text-cyan-400 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:border-cyan-400"
        >
          <span>⚡</span> Quick Demo / Guest Login
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          {isLogin ? "Don't have an account? " : 'Already registered? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            className="text-cyan-400 hover:underline cursor-pointer"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};