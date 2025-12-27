import React, { useState, useEffect } from 'react';
import { FinancialState } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { X, TrendingUp, CheckCircle, Circle, RefreshCw } from 'lucide-react';
import NumberInput from './NumberInput';

interface FutureProjectionProps {
  data: FinancialState;
  onClose: () => void;
}

const FutureProjection: React.FC<FutureProjectionProps> = ({ data, onClose }) => {
  const [rate, setRate] = useState(8);
  const [inflation, setInflation] = useState(2);
  const [years, setYears] = useState(20);
  const [totalMonthlyDeposit, setTotalMonthlyDeposit] = useState(0);
  
  const allAssets = [
      ...data.pensions.map(p => ({ ...p, category: 'פנסיה', isIncluded: true, type: 'pension' })),
      ...data.investments.map(i => ({ ...i, category: 'השקעות', isIncluded: true, monthlyDeposit: 0, type: 'investment' })),
      ...data.accounts.filter(a => a.type === 'savings').map(a => ({ ...a, category: 'חיסכון', isIncluded: true, monthlyDeposit: 0, type: 'savings' })),
      ...data.realEstate.map(r => ({ ...r, category: 'נדל״ן', isIncluded: false, monthlyDeposit: 0, type: 'realestate' }))
  ];

  const [selectedAssets, setSelectedAssets] = useState(allAssets);

  useEffect(() => {
      const sumDeposits = selectedAssets
        .filter(a => a.isIncluded)
        .reduce((sum, a) => sum + (a.monthlyDeposit || 0), 0);
      setTotalMonthlyDeposit(sumDeposits);
  }, [selectedAssets]);

  const toggleAsset = (id: string) => {
      setSelectedAssets(prev => prev.map(a => a.id === id ? { ...a, isIncluded: !a.isIncluded } : a));
  };

  const calculateData = () => {
      const currentYear = new Date().getFullYear();
      const yearlyData = [];
      
      const startingCapital = selectedAssets.filter(a => a.isIncluded).reduce((sum, a) => sum + a.value, 0);
      let currentNominal = startingCapital;
      let currentReal = startingCapital;
      
      // Rates
      const r_nominal = rate / 100;
      const r_inflation = inflation / 100;
      const r_real = (1 + r_nominal) / (1 + r_inflation) - 1;

      for (let i = 0; i <= years; i++) {
          yearlyData.push({
              year: currentYear + i,
              nominal: Math.round(currentNominal),
              real: Math.round(currentReal)
          });

          // Nominal Calc
          const annualContribution = totalMonthlyDeposit * 12;
          currentNominal = (currentNominal * (1 + r_nominal)) + annualContribution;

          // Real Calc - Assuming Nominal Contribution grows with inflation (Salary Indexation)
          // Therefore, Real Contribution stays constant.
          currentReal = (currentReal * (1 + r_real)) + annualContribution;
      }

      return yearlyData;
  };

  const chartData = calculateData();
  const finalNominal = chartData[chartData.length - 1].nominal;
  const finalReal = chartData[chartData.length - 1].real;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-hidden">
        {/* Updated Width to max-w-6xl and height to fixed md:h-[90vh] */}
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" />
                        סימולטור תחזיות
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm">חישוב ריבית דריבית נומינלי וריאלי</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                    <X size={24} className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Controls Sidebar */}
                <div className="w-full lg:w-1/3 bg-slate-50 p-4 md:p-6 border-l border-slate-100 overflow-y-auto custom-scrollbar flex-shrink-0 lg:flex-shrink">
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-1">תשואה %</label>
                                <input 
                                    type="number" 
                                    value={rate}
                                    onChange={(e) => setRate(Number(e.target.value))}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                    step="0.1"
                                />
                            </div>
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                                <label className="block text-xs font-bold text-slate-700 mb-1">אינפלציה %</label>
                                <input 
                                    type="number" 
                                    value={inflation}
                                    onChange={(e) => setInflation(Number(e.target.value))}
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                                    step="0.1"
                                />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                             <label className="block text-sm font-bold text-slate-700 mb-2">הפקדה חודשית (₪)</label>
                             <div className="relative">
                                <NumberInput 
                                    value={totalMonthlyDeposit}
                                    onChange={(val) => setTotalMonthlyDeposit(val)}
                                    className="w-full p-2 md:p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                                />
                                <div className="absolute left-3 top-3 text-emerald-600" title="חושב אוטומטית">
                                    <RefreshCw size={16} />
                                </div>
                             </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                             <label className="block text-sm font-bold text-slate-700 mb-2">טווח שנים: {years}</label>
                             <div className="flex items-center gap-3">
                                 <input 
                                    type="range" 
                                    min="5" 
                                    max="100"
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                    className="flex-1 accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                 />
                                 <input 
                                    type="number" 
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                    className="w-16 p-1 border rounded text-center"
                                 />
                             </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-700 mb-3">נכסים לחישוב</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {selectedAssets.map(asset => (
                                    <div 
                                        key={asset.id} 
                                        onClick={() => toggleAsset(asset.id)}
                                        className={`flex items-center justify-between p-2 md:p-3 rounded-xl border cursor-pointer transition-all ${asset.isIncluded ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 opacity-60'}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {asset.isIncluded ? <CheckCircle size={18} className="text-emerald-500 shrink-0" /> : <Circle size={18} className="text-slate-300 shrink-0" />}
                                            <div className="truncate">
                                                <div className="font-bold text-xs md:text-sm text-slate-800 truncate">{asset.name}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono font-medium">
                                            {formatCurrency(asset.value).split('.')[0]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 p-4 md:p-6 flex flex-col bg-white overflow-hidden min-h-[300px]">
                     <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 md:mb-8 gap-2 flex-shrink-0">
                         <div>
                             <p className="text-slate-500 font-medium text-xs md:text-sm">סכום חזוי בעוד {years} שנים</p>
                             <div className="flex items-baseline gap-3">
                                <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(finalNominal)}</h3>
                                <span className="text-sm font-bold text-emerald-600">({formatCurrency(finalReal)} ריאלי)</span>
                             </div>
                         </div>
                         <div className="text-right sm:text-left">
                             <p className="text-slate-500 font-medium text-xs">נכסים כיום</p>
                             <p className="text-lg md:text-xl font-bold text-slate-600">{formatCurrency(chartData[0].nominal)}</p>
                         </div>
                     </div>

                     <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="year" 
                                    stroke="#94a3b8" 
                                    tick={{fontSize: 10}}
                                    tickMargin={5}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    tickFormatter={(val) => `₪${(val/1000000).toFixed(1)}M`}
                                    tick={{fontSize: 10}}
                                    width={80}
                                    tickMargin={15}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(val: number) => formatCurrency(val)}
                                    labelFormatter={(label) => `שנת ${label}`}
                                />
                                <Legend />
                                <Area 
                                    type="monotone" 
                                    dataKey="nominal" 
                                    name="נומינלי"
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorNominal)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="real" 
                                    name="ריאלי"
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorReal)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FutureProjection;