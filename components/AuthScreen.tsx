
import React, { useState } from 'react';
import { TreeLogo } from './TreeLogo';
import { Chrome, ShieldCheck, CheckCircle2, TrendingUp, Wallet, Umbrella, Building2, CreditCard, ArrowRightLeft, User, BookOpen, Calculator, Edit2 } from 'lucide-react';
import { supabase, hasMissingKeys } from '../services/supabase';
import { PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer, XAxis, CartesianGrid } from 'recharts';

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

        if (hasMissingKeys) {
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user) {
                onLogin(data.session.user);
            } else {
                window.location.reload();
            }
        }
    } catch (err: any) {
        setError(err.message);
    }
  };

  // --- Mock Data for 1:1 Replica ---
  const chartData = [
    { name: 'עו"ש', value: 150000, color: '#10B981' }, 
    { name: 'ביטחון', value: 100000, color: '#3B82F6' },
    { name: 'פנסיה', value: 850000, color: '#06B6D4' },
    { name: 'השתלמות', value: 120000, color: '#F59E0B' }, 
    { name: 'השקעות', value: 420000, color: '#8B5CF6' },
    { name: 'נדל"ן', value: 2100000, color: '#6366f1' },
  ];

  const historyData = [
      { date: '1', value: 2800000 },
      { date: '2', value: 2850000 },
      { date: '3', value: 2920000 },
      { date: '4', value: 2980000 },
      { date: '5', value: 3100000 },
      { date: '6', value: 3250000 },
      { date: '7', value: 3380000 },
      { date: '8', value: 3520000 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-100/40 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
          
          {/* RIGHT SIDE: Login Form (Compact) */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-fade-in text-center mx-auto w-full max-w-lg lg:max-w-full flex flex-col justify-center h-auto lg:h-[680px]">
              
              <div className="mb-6">
                  <div className="inline-block transform hover:scale-105 transition duration-500 bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
                    <TreeLogo className="w-16 h-16 mx-auto drop-shadow-sm" />
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-4 mb-1">פוקוס פיננסי</h1>
                  <p className="text-slate-500 font-medium text-lg">סדר ושליטה בחיים הפיננסיים</p>
                  <p className="text-slate-400 text-sm font-medium mt-1">שיר כהן - תכנון פיננסי</p>
              </div>

              {/* Login Button */}
              <div className="space-y-3 mb-8 w-full max-w-sm mx-auto">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <Chrome size={22} className="text-white relative z-10" />
                  <span className="font-bold text-lg relative z-10">התחברות עם Google</span>
                </button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <ShieldCheck size={12} />
                    <span>המידע מאובטח ומוצפן. ההתחברות מאובטחת.</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-bold animate-fade-in mb-4">
                  {error}
                </div>
              )}

              {/* Benefits List - Updated Style for Maximum Size */}
              <div className="space-y-5 text-right px-2 flex-1 flex flex-col justify-center">
                  <div className="flex items-start gap-5 text-slate-900 bg-white p-5 rounded-2xl border border-slate-900 shadow-sm transition hover:scale-[1.02]">
                      <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0 mt-1" />
                      <span className="text-lg leading-snug font-medium">
                          <strong className="font-black block mb-1 text-xl">תמונת מצב מלאה</strong>
                          ריכוז כל הנכסים, הפנסיות וההתחייבויות במקום אחד
                      </span>
                  </div>
                  <div className="flex items-start gap-5 text-slate-900 bg-white p-5 rounded-2xl border border-slate-900 shadow-sm transition hover:scale-[1.02]">
                      <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0 mt-1" />
                      <span className="text-lg leading-snug font-medium">
                          <strong className="font-black block mb-1 text-xl">פרטיות מעל הכל</strong>
                          הזנה ידנית ושליטה מלאה ללא חיבור לחשבונות הבנק, חברות הביטוח ובתי ההשקעות
                      </span>
                  </div>
                  <div className="flex items-start gap-5 text-slate-900 bg-white p-5 rounded-2xl border border-slate-900 shadow-sm transition hover:scale-[1.02]">
                      <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0 mt-1" />
                      <span className="text-lg leading-snug font-medium">
                          <strong className="font-black block mb-1 text-xl">מבט לעתיד</strong>
                          מעקב אחר צמיחת ההון וסימולציות פיננסיות מתקדמות
                      </span>
                  </div>
              </div>
          </div>

          {/* LEFT SIDE: Exact Replica of Dashboard */}
          <div className="hidden lg:flex flex-col relative h-[680px]">
             {/* Main App Container Mockup */}
             <div className="bg-slate-50 border border-slate-200 rounded-3xl shadow-2xl flex flex-col h-full w-full overflow-hidden relative">
                 
                 {/* Fake Header Bar */}
                 <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm z-10">
                     <div className="flex items-center gap-2">
                         <TreeLogo className="w-6 h-6" />
                         <span className="font-black text-slate-800 text-sm">פוקוס פיננסי</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold text-slate-600">י</div>
                     </div>
                 </div>

                 {/* Content Area */}
                 <div className="flex-1 overflow-hidden p-4 bg-slate-50 relative">
                     {/* Dashboard Content Mockup */}
                     <div className="space-y-4 transform scale-[0.95] origin-top">
                        
                        {/* Greeting & Buttons */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                    שלום, ישראל ישראלי <Edit2 size={14} className="text-slate-300"/>
                                </h2>
                                <p className="text-xs text-slate-500">הנה תמונת המצב הפיננסית שלך להיום</p>
                            </div>
                            <div className="flex gap-2 scale-90 origin-left">
                                <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm"><TrendingUp size={12}/> תחזית</button>
                                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                <button className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><ArrowRightLeft size={12}/> בדיקה</button>
                                <button className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Calculator size={12}/> פרישה</button>
                                <button className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Calculator size={12}/> דמי ניהול</button>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-3 gap-4 h-[220px]">
                            {/* Pie Chart Card - FIXED CENTERING */}
                            <div className="col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center relative">
                                {/* Title - Top Right */}
                                <div className="absolute top-4 right-4 text-right">
                                    <h3 className="text-xs font-bold text-slate-700">שווי נקי</h3>
                                </div>
                                
                                {/* Content - Centered */}
                                <div className="flex flex-col items-center justify-center mt-6 w-full">
                                    {/* Value - Centered */}
                                    <div className="text-xl font-black text-slate-800 mb-2">₪3,740,000</div>
                                    
                                    {/* Chart - Centered */}
                                    <div className="w-full h-[100px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" cornerRadius={4} stroke="none">
                                                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Area Chart Card */}
                            <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col">
                                <div className="flex justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-700">התקדמות כלכלית</h3>
                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">+8.4%</span>
                                </div>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={historyData}>
                                            <defs>
                                                <linearGradient id="colorValueMock" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" hide />
                                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#colorValueMock)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-sm font-bold text-slate-800 mt-2">התיק שלי</h2>

                        {/* Asset Cards Grid */}
                        
                        {/* Row 1 */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-2xl p-3 border border-rose-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg"><ArrowRightLeft size={14} className="text-rose-500"/></div>
                                        <div><div className="font-bold text-xs text-slate-700">תזרים</div><div className="text-[10px] text-slate-400">חיובי</div></div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-800">₪4,200</div>
                            </div>

                            <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg"><Wallet size={14} className="text-emerald-500"/></div>
                                        <div><div className="font-bold text-xs text-slate-700">עו"ש</div><div className="text-[10px] text-slate-400">נזילות</div></div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-800">₪150,000</div>
                            </div>

                            <div className="bg-white rounded-2xl p-3 border border-blue-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg"><ShieldCheck size={14} className="text-blue-500"/></div>
                                        <div><div className="font-bold text-xs text-slate-700">ביטחון</div><div className="text-[10px] text-slate-400">חירום</div></div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-800">₪100,000</div>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-3 gap-3">
                             <div className="bg-white rounded-2xl p-3 border border-cyan-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg"><User size={14} className="text-cyan-500"/></div>
                                        <div><div className="font-bold text-xs text-slate-700">פנסיה</div></div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-800">₪850,000</div>
                                <div className="mt-2 space-y-1">
                                    <div className="bg-slate-50 p-1 rounded text-[10px] flex justify-between"><span>מנורה</span><span className="font-bold">500k</span></div>
                                    <div className="bg-slate-50 p-1 rounded text-[10px] flex justify-between"><span>אלטשולר</span><span className="font-bold">350k</span></div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-3 border border-amber-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg"><BookOpen size={14} className="text-amber-500"/></div>
                                        <div><div className="font-bold text-xs text-slate-700">השתלמות</div></div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-800">₪120,000</div>
                                <div className="mt-2 space-y-1">
                                    <div className="bg-slate-50 p-1 rounded text-[10px] flex justify-between"><span>מור</span><span className="font-bold">120k</span></div>
                                </div>
                            </div>

                             <div className="bg-white rounded-2xl p-3 border border-purple-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg"><TrendingUp size={14} className="text-purple-500"/></div>
                                        <div><div className="font-bold text-xs text-slate-700">השקעות</div></div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-800">₪420,000</div>
                                <div className="mt-2 space-y-1">
                                    <div className="bg-slate-50 p-1 rounded text-[10px] flex justify-between"><span>חשבון מסחר עצמאי</span><span className="font-bold">420k</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-2 gap-3">
                             <div className="bg-white rounded-2xl p-3 border border-indigo-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg"><Building2 size={14} className="text-indigo-500"/></div>
                                        <div><div className="font-bold text-xs text-slate-700">נדל"ן</div><div className="text-[10px] text-slate-400">שווי שוק</div></div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-800">₪2.1M</div>
                                <div className="mt-2 text-[10px] text-slate-400">משכנתא: 920k</div>
                            </div>

                            <div className="bg-white rounded-2xl p-3 border border-rose-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-slate-50 rounded-lg"><CreditCard size={14} className="text-rose-500"/></div>
                                        <div><div className="font-bold text-xs text-slate-700">הלוואות</div><div className="text-[10px] text-slate-400">התחייבויות</div></div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-800">₪45,000</div>
                                <div className="mt-2 text-[10px] text-slate-400">החזר חודשי: ₪1,200</div>
                            </div>
                        </div>

                     </div>
                 </div>
             </div>
          </div>

      </div>
    </div>
  );
};

export default AuthScreen;
