import React, { useState, createContext, useContext, useEffect } from 'react';
import { 
  Loader2, 
  Wallet, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Github, 
  Chrome 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuthScreen = () => {
  const { login, signup, loginWithGoogle, resendVerificationEmail } = useApp();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        // Navigate to dashboard normally handled by auth state listener
      } else {
        await signup(formData.email, formData.password, formData.fullName);
        // TRIGGER THE MODAL on successful signup
        setShowVerifyModal(true);
      }
    } catch (error) {
      console.error("Auth error", error);
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

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail(formData.email);
      // Optional: Show a toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/20 mb-4 rotate-3 ring-1 ring-white/10">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            ExpenseCentral
          </h1>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Welcome back, explorer.' : 'Start your financial journey.'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />

          {/* Toggle (Login / Signup) */}
          <div className="flex p-1 bg-slate-800/50 rounded-xl mb-6 border border-white/5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                isLogin 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                !isLogin 
                  ? 'bg-slate-700 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Signup Only) */}
            <div className={`transition-all duration-300 overflow-hidden ${!isLogin ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="relative group">
                <input
                  type="text"
                  required={!isLogin}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-600"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative group">
              <input
                type="email"
                required
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-600"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Mail className="absolute right-3 top-3.5 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
            </div>

            {/* Password */}
            <div className="relative group">
              <input
                type="password"
                required
                minLength={6}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-600"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {/* Action Button */}
            <button
              disabled={loading}
              className="w-full gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#121623] px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Social Auth */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-slate-900 hover:bg-slate-50 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
           {/* Custom Google Icon */}
           <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-sm">Google</span>
          </button>

        </div>
        
        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          By continuing, you agree to our Terms of Service <br/> and Privacy Policy.
        </p>
      </div>

      {/* --- EMAIL VERIFICATION MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowVerifyModal(false)}
          />
          
          {/* Modal Content */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm relative z-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-indigo-500/20">
              <Mail className="w-8 h-8 text-indigo-400" />
            </div>
            
            <h3 className="text-xl font-bold text-center text-white mb-2">Check your email</h3>
            <p className="text-sm text-slate-400 text-center mb-8">
              We've sent a verification link to <span className="text-white font-medium">{formData.email}</span>. Please verify your email to unlock all features.
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowVerifyModal(false);
                  setIsLogin(true); // Switch to login view so they can sign in after verifying
                }}
                className="w-full bg-white text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Okay, I'll check
              </button>
              
              <button 
                onClick={handleResend}
                disabled={loading}
                className="w-full text-indigo-400 text-sm font-medium py-2 hover:text-indigo-300 transition-colors disabled:opacity-50"
              >
                {loading ? 'Resending...' : "Didn't get it? Resend"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthScreen;