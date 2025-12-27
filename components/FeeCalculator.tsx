import React, { useState, useEffect } from 'react';
import { X, Calculator, ArrowRight, Percent, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import NumberInput from './NumberInput';

interface FeeCalculatorProps {
  onClose: () => void;
  initialFees?: { acc: number; dep: number };
}

const FeeCalculator: React.FC<FeeCalculatorProps> = ({ onClose, initialFees }) => {
  const [balance, setBalance] = useState(100000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(2000);
  const [years, setYears] = useState(20);
  const [returnRate, setReturnRate] = useState(5);

  // Option A (Existing)
  const [feeAccA, setFeeAccA] = useState(initialFees ? initialFees.acc : 0.22);
  const [feeDepA, setFeeDepA] = useState(initialFees ? initialFees.dep : 1.0);

  // Option B (Low Fee Alternative)
  const [feeAccB, setFeeAccB] = useState(0.1);
  const [feeDepB, setFeeDepB] = useState(1.0);

  const [chartData, setChartData] = useState<any[]>([]);
  const [diff, setDiff] = useState(0);
  
  // Total fees paid
  const [totalFeesA, setTotalFeesA] = useState(0);
  const [totalFeesB, setTotalFeesB] = useState(0);
  const [finalA, setFinalA] = useState(0);
  const [finalB, setFinalB] = useState(0);

  useEffect(() => {
    const data = [];
    let currentA = balance;
    let currentB = balance;
    let feesPaidA = 0;
    let feesPaidB = 0;

    for (let i = 0; i <= years; i++) {
        data.push({
            year: i,
            optionA: Math.round(currentA),
            optionB: Math.round(currentB),
        });

        if (i < years) {
            // Calculate next year
            const r = returnRate / 100;
            const annualDep = monthlyDeposit * 12;

            // Option A
            const depFeeA = annualDep * (feeDepA / 100);
            const netDepA = annualDep - depFeeA;
            // Simple interest approximation
            const growthA = (currentA + netDepA / 2) * r; 
            const accFeeA = (currentA + netDepA + growthA) * (feeAccA / 100);
            
            feesPaidA += depFeeA + accFeeA;
            currentA = currentA + netDepA + growthA - accFeeA;

            // Option B
            const depFeeB = annualDep * (feeDepB / 100);
            const netDepB = annualDep - depFeeB;
            const growthB = (currentB + netDepB / 2) * r;
            const accFeeB = (currentB + netDepB + growthB) * (feeAccB / 100);
            
            feesPaidB += depFeeB + accFeeB;
            currentB = currentB + netDepB + growthB - accFeeB;
        }
    }
    setChartData(data);
    setFinalA(currentA);
    setFinalB(currentB);
    setTotalFeesA(feesPaidA);
    setTotalFeesB(feesPaidB);
    setDiff(currentB - currentA);
  }, [balance, monthlyDeposit, years, returnRate, feeAccA, feeDepA, feeAccB, feeDepB]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-hidden">
        {/* Updated Width to max-w-6xl and height to fixed md:h-[90vh] */}
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Calculator className="text-emerald-500" />
                        השוואת דמי ניהול
                    </h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                    <X size={24} className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Inputs */}
                <div className="w-full lg:w-1/3 bg-slate-50 p-4 md:p-6 border-l border-slate-100 overflow-y-auto custom-scrollbar space-y-4 md:space-y-6 flex-shrink-0">
                    
                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-800 text-sm md:text-base">נתוני בסיס</h3>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                            <div>
                                <label className="text-[10px] md:text-xs font-bold text-slate-500">צבירה</label>
                                <NumberInput value={balance} onChange={setBalance} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] md:text-xs font-bold text-slate-500">הפקדה</label>
                                <NumberInput value={monthlyDeposit} onChange={setMonthlyDeposit} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] md:text-xs font-bold text-slate-500">תשואה %</label>
                                <input type="number" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                            </div>
                             <div>
                                <label className="text-[10px] md:text-xs font-bold text-slate-500">שנים</label>
                                <input type="number" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-red-100 shadow-sm relative">
                        <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2 text-sm">אפשרות א' (מצב קיים)</h3>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500">מצבירה %</label>
                                <input type="number" step="0.01" value={feeAccA} onChange={e => setFeeAccA(Number(e.target.value))} className="w-full p-1.5 rounded-lg border border-slate-200 bg-red-50 text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500">מהפקדה %</label>
                                <input type="number" step="0.01" value={feeDepA} onChange={e => setFeeDepA(Number(e.target.value))} className="w-full p-1.5 rounded-lg border border-slate-200 bg-red-50 text-sm" />
                            </div>
                        </div>
                        <div className="text-[10px] text-red-400 bg-red-50 p-1.5 rounded flex justify-between">
                            <span>סה"כ דמי ניהול:</span>
                            <span className="font-bold">{formatCurrency(totalFeesA)}</span>
                        </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm relative">
                        <h3 className="font-bold text-emerald-600 mb-2 flex items-center gap-2 text-sm">אפשרות ב' (אלטרנטיבה)</h3>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500">מצבירה %</label>
                                <input type="number" step="0.01" value={feeAccB} onChange={e => setFeeAccB(Number(e.target.value))} className="w-full p-1.5 rounded-lg border border-slate-200 bg-emerald-50 text-sm" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500">מהפקדה %</label>
                                <input type="number" step="0.01" value={feeDepB} onChange={e => setFeeDepB(Number(e.target.value))} className="w-full p-1.5 rounded-lg border border-slate-200 bg-emerald-50 text-sm" />
                            </div>
                        </div>
                        <div className="text-[10px] text-emerald-600 bg-emerald-50 p-1.5 rounded flex justify-between">
                            <span>סה"כ דמי ניהול:</span>
                            <span className="font-bold">{formatCurrency(totalFeesB)}</span>
                        </div>
                    </div>

                </div>

                {/* Results */}
                <div className="flex-1 p-4 md:p-6 flex flex-col bg-white overflow-hidden min-h-[300px]">
                     
                     <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className="bg-slate-50 p-4 rounded-2xl border border-red-100/50 text-center">
                             <div className="text-xs text-red-500 font-bold mb-1">אפשרות א'</div>
                             <div className="text-xl font-black text-slate-700">{formatCurrency(finalA)}</div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-2xl border border-emerald-100/50 text-center">
                             <div className="text-xs text-emerald-600 font-bold mb-1">אפשרות ב'</div>
                             <div className="text-xl font-black text-slate-700">{formatCurrency(finalB)}</div>
                         </div>
                     </div>

                     <div className="mb-4 text-center flex-shrink-0 bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200">
                        <p className="text-slate-500 font-medium mb-1 text-xs md:text-sm">פער בחיסכון (לטובת {diff > 0 ? "ב'" : "א'"})</p>
                        <div className={`text-3xl md:text-4xl font-black ${diff > 0 ? 'text-emerald-600' : 'text-red-500'} tracking-tight`}>
                            {formatCurrency(Math.abs(diff))}
                        </div>
                     </div>

                     <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" stroke="#94a3b8" tick={{fontSize: 10}} />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    tickFormatter={(val) => `₪${(val/1000).toFixed(0)}k`} 
                                    tick={{fontSize: 10}} 
                                    width={90}
                                    tickMargin={20}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(val: number) => formatCurrency(val)}
                                    labelFormatter={(label) => `שנה ${label}`}
                                />
                                <Legend wrapperStyle={{fontSize: '12px'}} />
                                <Area type="monotone" dataKey="optionA" name="אפשרות א'" stroke="#ef4444" fill="url(#colorA)" strokeWidth={2} />
                                <Area type="monotone" dataKey="optionB" name="אפשרות ב'" stroke="#10b981" fill="url(#colorB)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FeeCalculator;