// src/pages/AuthScreen.jsx
import React, { useState } from 'react';
import { Loader, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuthScreen = () => {
  const { login, signup } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.fullName);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20 rotate-3">
        <Wallet className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-4xl font-black mb-2 tracking-tight">
        ExpenseCentral
      </h1>
      <p className="text-slate-400 mb-10 text-center max-w-xs">
        Track daily spending and split bills with friends in one place.
      </p>

      <div className="w-full max-w-sm bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold mb-6 text-indigo-400">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
              value={formData.fullName}
              onChange={e =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
            value={formData.email}
            onChange={e =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            required
            minLength={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
            value={formData.password}
            onChange={e =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <button
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg mt-2 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader className="animate-spin mx-auto w-5 h-5" />
            ) : isLogin ? (
              'Login'
            ) : (
              'Sign Up'
            )}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-center text-xs text-slate-400 mt-6 hover:text-white transition-colors"
        >
          {isLogin
            ? 'New here? Create an account'
            : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;
