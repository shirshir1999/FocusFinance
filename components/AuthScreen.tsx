
import React, { useState } from 'react';
import { TreeLogo } from './TreeLogo';
import { Chrome, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase, hasMissingKeys } from '../services/supabase';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
        if (error) throw error;

        // If running in local mode (mock auth), verify session and trigger login immediately
        if (hasMissingKeys) {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user) {
                onLogin(data.session.user);
            } else {
                // Fallback if something went wrong
                window.location.reload();
            }
        }
    } catch (err: any) {
        setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      
      {/* Background Decor (Subtle) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-100/40 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-slate-100 animate-fade-in relative z-10 text-center">
              
          {/* Logo Section */}
          <div className="mb-10">
              <div className="inline-block transform hover:scale-105 transition duration-500 bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
                <TreeLogo className="w-24 h-24 mx-auto drop-shadow-sm" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-6 mb-2">פוקוס פיננסי</h1>
              <p className="text-slate-500 font-medium text-lg">המקום הבטוח לכסף שלכם</p>
          </div>

          {/* Features / Benefits */}
          <div className="space-y-3 mb-10 text-right px-4">
              <div className="flex items-center gap-3 text-slate-600">
                  <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                  <span>סדר וריכוז כל הנכסים במקום אחד</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                  <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                  <span>מעקב ידני ללא התחברות לממשקים חיצוניים</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                  <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                  <span>מעקב התקדמות כלכלית וביצוע תחזיות לעתיד</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                  <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                  <span>מחשבונים חכמים לתכנון פרישה וחיסכון בעלויות</span>
              </div>
          </div>

          {/* Demo Mode Notice */}
          {hasMissingKeys && !error && (
             <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex flex-col items-center gap-2 text-xs mb-8">
                <div className="flex items-center gap-2 font-bold text-sm">
                    <Database size={16} />
                    מצב פיתוח מקומי
                </div>
                <p className="opacity-90">החיבור לשרת לא הוגדר. ההתחברות למטה תהיה דמה (Mock).</p>
             </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold animate-fade-in mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Chrome size={24} className="text-white relative z-10" />
              <span className="font-bold text-lg relative z-10">התחברות עם Google</span>
            </button>
            
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-6">
                <ShieldCheck size={14} />
                <span>המידע מאובטח ומוצפן. ההתחברות מאובטחת.</span>
            </div>
          </div>
      </div>
    </div>
  );
};

export default AuthScreen;
