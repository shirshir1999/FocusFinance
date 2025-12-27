
import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import NumberInput from './NumberInput';

interface SwitchingCalculatorProps {
  onClose: () => void;
}

const SwitchingCalculator: React.FC<SwitchingCalculatorProps> = ({ onClose }) => {
  const [balance, setBalance] = useState(100000);
  const [profit, setProfit] = useState(20000);
  // Fixed years to 30 as requested
  const years = 30;
  const [currentFee, setCurrentFee] = useState(0.8);
  const [newFee, setNewFee] = useState(0.1); // Default 0.1
  
  const [splitReturns, setSplitReturns] = useState(false);
  const [returnRate, setReturnRate] = useState(8.0);
  const [newReturnRate, setNewReturnRate] = useState(8.0);

  const [chartData, setChartData] = useState<any[]>([]);
  const [breakEvenYear, setBreakEvenYear] = useState<number | null>(null);
  const [finalDiff, setFinalDiff] = useState(0);
  const [taxPaid, setTaxPaid] = useState(0);
  const [newStartBalance, setNewStartBalance] = useState(0);

  useEffect(() => {
    const data = [];
    const tax = profit * 0.25;
    const startB = balance - tax;
    
    setTaxPaid(tax);
    setNewStartBalance(startB);

    let currentA = balance;
    let currentB = startB;
    let beYear = null;

    const rA = returnRate / 100;
    const rB = (splitReturns ? newReturnRate : returnRate) / 100;

    for (let i = 0; i <= years; i++) {
        data.push({
            year: i,
            keep: Math.round(currentA),
            switch: Math.round(currentB),
        });

        // Check for break-even (when Switch becomes greater than Keep)
        if (currentB > currentA && beYear === null && i > 0) {
            beYear = i;
        }

        if (i < years) {
            // Option A: Keep (No Tax Event)
            currentA = currentA * (1 + rA - (currentFee / 100));
            
            // Option B: Switch (Tax paid at start)
            currentB = currentB * (1 + rB - (newFee / 100));
        }
    }
    
    setChartData(data);
    setBreakEvenYear(beYear);
    setFinalDiff(currentB - currentA);

  }, [balance, profit, years, currentFee, newFee, returnRate, newReturnRate, splitReturns]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-hidden">
        {/* Updated Width to max-w-6xl and height to fixed md:h-[90vh] */}
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                        <ArrowLeftRight className="text-blue-500" />
                        בדיקת כדאיות מעבר
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm">האם כדאי למכור, לשלם מס ולהוזיל דמי ניהול?</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                    <X size={24} className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
                {/* Inputs (Right Side in RTL) */}
                <div className="w-full lg:w-1/3 bg-slate-50 p-4 md:p-6 border-l border-slate-100 lg:overflow-y-auto custom-scrollbar space-y-6 flex-shrink-0">
                    
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">מצב נוכחי</h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">יתרה כוללת במוצר</label>
                            <NumberInput value={balance} onChange={setBalance} className="w-full p-2 rounded-xl border border-slate-200 font-bold"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">מתוך זה רווח (לחישוב מס)</label>
                            <NumberInput value={profit} onChange={setProfit} className="w-full p-2 rounded-xl border border-slate-200"/>
                            <p className="text-[10px] text-slate-400 mt-1">מס רווח הון של 25% יחושב על סכום זה</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">דמי ניהול נוכחיים (%)</label>
                            <input type="number" step="0.01" value={currentFee} onChange={e => setCurrentFee(Number(e.target.value))} className="w-full p-2 rounded-xl border border-slate-200"/>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">מוצר חדש</h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">דמי ניהול במוצר החדש (%)</label>
                            <input type="number" step="0.01" value={newFee} onChange={e => setNewFee(Number(e.target.value))} className="w-full p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold"/>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">הנחות יסוד</h3>
                        
                        <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={splitReturns} onChange={e => setSplitReturns(e.target.checked)} id="split" className="rounded text-blue-600"/>
                            <label htmlFor="split" className="text-xs font-bold text-slate-600">תשואות שונות לכל מסלול?</label>
                        </div>

                        {splitReturns ? (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">תשואה בקיים %</label>
                                    <input type="number" step="0.1" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} className="w-full p-2 rounded-xl border border-slate-200"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">תשואה בחדש %</label>
                                    <input type="number" step="0.1" value={newReturnRate} onChange={e => setNewReturnRate(Number(e.target.value))} className="w-full p-2 rounded-xl border border-slate-200"/>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">תשואה שנתית צפויה (%)</label>
                                <input type="number" step="0.1" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} className="w-full p-2 rounded-xl border border-slate-200"/>
                            </div>
                        )}
                    </div>

                </div>

                {/* Results (Left Side in RTL) - Made Scrollable */}
                <div className="flex-1 p-4 md:p-6 flex flex-col bg-white overflow-y-auto custom-scrollbar">
                     
                     <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm leading-relaxed text-slate-600 flex-shrink-0">
                        {finalDiff > 0 ? (
                            <p>
                                <span className="font-bold text-emerald-600 block mb-1 text-lg">
                                    {breakEvenYear ? `המעבר משתלם לאחר ${breakEvenYear} שנים!` : 'המעבר משתלם!'}
                                </span>
                                אם תבצעו את המעבר, תשלמו מיד <span className="font-bold text-slate-800">{formatCurrency(taxPaid)}</span> כמס, 
                                והתיק החדש יתחיל מסכום של <span className="font-bold text-slate-800">{formatCurrency(newStartBalance)}</span>. 
                                {breakEvenYear ? (
                                    <> בגלל דמי הניהול הנמוכים ({newFee}%), התיק החדש יצמח מהר יותר ויכסה את ההפסד הראשוני לאחר {breakEvenYear} שנים.</>
                                ) : (
                                    <> עם זאת, בטווח הזמן שנבחר התיק עדיין לא כיסה את ההפסד הראשוני.</>
                                )}
                            </p>
                        ) : (
                            <p>
                                <span className="font-bold text-red-500 block mb-1 text-lg">המעבר לא משתלם בטווח זה</span>
                                תשלום המס המיידי בסך <span className="font-bold text-slate-800">{formatCurrency(taxPaid)}</span> 
                                מקטין את התיק משמעותית, והחיסכון בדמי הניהול לא מספיק כדי לפצות על כך.
                            </p>
                        )}
                     </div>

                     <div className="w-full h-[350px] relative flex-shrink-0">
                        <h4 className="text-xs font-bold text-slate-400 absolute top-0 right-0">תחזית ל-30 שנה</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 25, right: 30, left: 30, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorKeep" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorSwitch" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={finalDiff > 0 ? "#10b981" : "#ef4444"} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={finalDiff > 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" stroke="#94a3b8" tick={{fontSize: 12}} />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    tickFormatter={(val) => `₪${(val/1000).toFixed(0)}k`} 
                                    tick={{fontSize: 12}} 
                                    width={90}
                                    tickMargin={20}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(val: number) => formatCurrency(val)}
                                    labelFormatter={(label) => `שנה ${label}`}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="keep" name="להישאר בקיים" stroke="#64748b" fill="url(#colorKeep)" strokeWidth={2} />
                                <Area type="monotone" dataKey="switch" name="לעבור לחדש" stroke={finalDiff > 0 ? "#10b981" : "#ef4444"} fill="url(#colorSwitch)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>

                     {/* Excellence Banner - Now fully visible due to parent scroll */}
                     <div className="mt-6 p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg flex-shrink-0">
                        <div>
                            <p className="text-white font-bold text-lg">חבל לשלם סתם דמי ניהול גבוהים!</p>
                            <p className="text-emerald-400 font-bold text-sm mt-1">פטור מדמי ניהול לשנתיים (אח"כ 15 ₪ שמתקזזים) | עמלות 0.07% (מינימום 3 ₪) | 100 ₪ מתנה | מינימום 15,000 ₪</p>
                            <p className="text-white/80 text-xs mt-2">* גילוי נאות: כלקוח קיים אני מתוגמל על הפניה זו.</p>
                        </div>
                        <a 
                            href="https://xnestrade.xnes.co.il/page/101?customerCode=6abde1d2" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition whitespace-nowrap shadow-lg shadow-emerald-900/50"
                        >
                            לפתיחת חשבון באקסלנס טרייד
                        </a>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SwitchingCalculator;
