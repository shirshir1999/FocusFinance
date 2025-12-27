
import React, { useState } from 'react';
import { TreeLogo } from './TreeLogo';
import { Mail, Lock, Loader2, Chrome, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Supabase often requires email confirmation, but for now we'll try to log them in
        if (data.user) onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir="rtl">
      
      {/* Auth Form Card - Centered and clean */}
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-fade-in">
          <div className="text-center mb-8">
             <TreeLogo className="w-16 h-16 mx-auto mb-4" />
             <h1 className="text-2xl font-black text-slate-900">פוקוס פיננסי</h1>
          </div>

          <div className="space-y-2 mb-8 text-center">
            <h2 className="text-3xl font-black text-slate-900">
              {isLogin ? 'ברוכים השבים' : 'יצירת חשבון חדש'}
            </h2>
            <p className="text-slate-500">
              {isLogin ? 'הכניסו פרטים כדי להמשיך למעקב' : 'הירשמו והתחילו לנהל את הכסף שלכם בחכמה'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-fade-in mb-6">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute right-4 top-4 text-slate-400" size={20} />
                <input 
                  type="email" 
                  placeholder="כתובת אימייל" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-4 text-slate-400" size={20} />
                <input 
                  type="password" 
                  placeholder="סיסמה" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (isLogin ? 'התחברות' : 'הרשמה')}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-500">או באמצעות</span></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 py-3 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-sm font-bold text-slate-700 shadow-sm"
            >
              <Chrome size={18} className="text-red-500" />
              התחברות עם Google
            </button>
          </div>

          <div className="text-center pt-6">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-600 font-medium hover:text-slate-900 transition text-sm underline underline-offset-4"
            >
              {isLogin ? 'אין לכם חשבון? הרשמו עכשיו' : 'כבר רשומים? התחברו כאן'}
            </button>
          </div>
      </div>
    </div>
  );
};

export default AuthScreen;
