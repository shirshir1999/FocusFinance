
import React, { useState } from 'react';
import { TreeLogo } from './TreeLogo';
import { Mail, Lock, Loader2, Chrome, AlertCircle, User, Database } from 'lucide-react';
import { supabase, hasMissingKeys } from '../services/supabase';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      
      {/* Background Decor (Subtle) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-100/40 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-fade-in relative z-10">
              
          {/* Logo Section */}
          <div className="text-center mb-8">
              <div className="inline-block transform hover:scale-105 transition duration-500">
                <TreeLogo className="w-20 h-20 mx-auto mb-4 drop-shadow-sm" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">פוקוס פיננסי</h1>
          </div>

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-bold text-slate-800">
              {isLogin ? 'ברוכים השבים 👋' : 'יצירת חשבון חדש 🚀'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isLogin ? 'הכניסו פרטים כדי להמשיך למעקב' : 'הצטרפו והתחילו לנהל את הכסף בחכמה'}
            </p>
          </div>

          {/* Demo Mode Notice */}
          {hasMissingKeys && !error && (
             <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl flex items-start gap-3 text-xs mb-6">
                <Database size={16} className="shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold block">מצב פיתוח מקומי (Local Mode)</span>
                    לא מוגדר חיבור לשרת. הנתונים יישמרו מקומית בדפדפן זה בלבד. ניתן להתחבר עם כל אימייל וסיסמה.
                </div>
             </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-fade-in mb-6">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name Input - Only for Sign Up */}
            {!isLogin && (
                <div className="relative animate-fade-in">
                    <User className="absolute right-4 top-4 text-slate-400" size={20} />
                    <input 
                    type="text" 
                    placeholder="שם מלא" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm font-medium"
                    />
                </div>
            )}

            <div className="relative">
              <Mail className="absolute right-4 top-4 text-slate-400" size={20} />
              <input 
                type="email" 
                placeholder="כתובת אימייל" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm font-medium"
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
                className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm font-medium"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 mt-2 hover:-translate-y-1 transform duration-200"
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
              className="flex items-center justify-center gap-2 py-3 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition text-sm font-bold text-slate-700 shadow-sm hover:shadow-md"
            >
              <Chrome size={18} className="text-red-500" />
              התחברות עם Google
            </button>
          </div>

          <div className="text-center pt-6">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-600 font-medium hover:text-emerald-600 transition text-sm"
            >
              {isLogin ? (
                  <>אין לכם חשבון? <span className="font-bold underline underline-offset-4">הרשמו עכשיו בחינם</span></>
              ) : (
                  <>כבר רשומים? <span className="font-bold underline underline-offset-4">התחברו כאן</span></>
              )}
            </button>
          </div>
      </div>
    </div>
  );
};

export default AuthScreen;
