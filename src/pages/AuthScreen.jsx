// src/pages/AuthScreen.jsx
import React, { useState } from 'react';
import { Loader, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuthScreen = () => {
  const { login, signup, loginWithGoogle, resendVerificationEmail } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      // User should type their email first
      return;
    }
    setResendLoading(true);
    try {
      await resendVerificationEmail(formData.email);
    } finally {
      setResendLoading(false);
    }
  };

  const isBusy = loading || resendLoading;

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
        <h2 className="text-xl font-bold mb-2 text-indigo-400">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>

        {/* Small helper text about verification */}
        <p className="text-xs text-slate-400 mb-5">
          {isLogin
            ? 'Tip: If you just signed up, make sure you have verified your email before logging in.'
            : 'After creating your account, we will send a verification link to your email. Please verify it before logging in.'}
        </p>

        {/* 🔹 Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isBusy}
          className="w-full flex items-center justify-center gap-2 bg-white/90 text-slate-900 py-3 rounded-xl font-semibold shadow-md hover:bg-white transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? (
            <Loader className="animate-spin w-5 h-5" />
          ) : (
            <>
              {/* Simple Google "G" logo */}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-white">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.02 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.14-3.08-.39-4.55H24v9.02h12.94c-.56 2.9-2.25 5.36-4.79 7.02l7.73 6c4.51-4.17 7.1-10.32 7.1-17.49z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.54 28.59A14.47 14.47 0 0 1 9.5 24c0-1.59.27-3.12.76-4.56l-7.98-6.19A23.89 23.89 0 0 0 0 24c0 3.9.93 7.58 2.56 10.75l7.98-6.16z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.9-5.78l-7.73-6c-2.16 1.44-4.95 2.28-8.17 2.28-6.26 0-11.57-3.52-13.92-8.59l-7.98 6.16C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </span>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-xs text-slate-400 uppercase tracking-[0.2em]">
            OR
          </span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        {/* Email / Password Form */}
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
            disabled={isBusy}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg mt-2 transition-all active:scale-[0.98] disabled:opacity-70"
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

        {/* Resend verification helper (on login screen) */}
        {isLogin && (
          <div className="mt-4 text-center text-xs text-slate-400">
            Didn&apos;t get the verification email?{' '}
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={!formData.email || resendLoading}
              className="text-indigo-400 hover:text-indigo-300 underline disabled:opacity-60"
            >
              {resendLoading ? 'Resending…' : 'Resend verification link'}
            </button>
            <div className="mt-1 text-[10px] text-slate-500">
              Enter your email above and then tap &quot;Resend&quot;.
            </div>
          </div>
        )}

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
