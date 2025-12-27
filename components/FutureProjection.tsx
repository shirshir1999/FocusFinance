
import React, { useState, useEffect, useMemo } from 'react';
import { FinancialState } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { X, TrendingUp, CheckCircle, Circle, RefreshCw, Calculator, Percent, ArrowUp, CalendarClock } from 'lucide-react';
import NumberInput from './NumberInput';

interface FutureProjectionProps {
  data: FinancialState;
  onClose: () => void;
}

// Helper to guess default rates based on type
const getDefaultRate = (type: string) => {
    switch (type) {
        case 'pension': return 8.0;
        case 'study_fund': return 7.0;
        case 'investment': return 7.0;
        case 'realestate': return 3.5;
        case 'savings': return 2.0;
        default: return 5.0;
    }
};

interface SimulationAsset {
    id: string;
    name: string;
    value: number;
    category: string;
    type: string;
    isIncluded: boolean;
    simRate: number; // Simulation Return Rate
    simDeposit: number; // Simulation Monthly Deposit
    depositYears: number; // How many years to deposit
}

const FutureProjection: React.FC<FutureProjectionProps> = ({ data, onClose }) => {
  const [inflation, setInflation] = useState<string>(''); // Default 2.5 if empty
  const [years, setYears] = useState<string>(''); // Default 20 if empty
  
  // Initialize Assets with separate simulation parameters
  const [assets, setAssets] = useState<SimulationAsset[]>([]);

  useEffect(() => {
      const defaultYears = years === '' ? 20 : Number(years);
      
      const mappedAssets: SimulationAsset[] = [
          ...data.pensions.map(p => ({ 
              id: p.id, 
              name: p.name, 
              value: p.value, 
              category: 'פנסיה וגמל', 
              type: 'pension', 
              isIncluded: true,
              simRate: getDefaultRate(p.type),
              simDeposit: p.monthlyDeposit || 0,
              depositYears: defaultYears
          })),
          ...data.investments.map(i => ({ 
              id: i.id, 
              name: i.name, 
              value: i.value, 
              category: 'השקעות', 
              type: 'investment', 
              isIncluded: true,
              simRate: getDefaultRate('investment'),
              simDeposit: 0,
              depositYears: defaultYears
          })),
          ...data.accounts.filter(a => a.type === 'savings').map(a => ({ 
              id: a.id, 
              name: a.name, 
              value: a.value, 
              category: 'חיסכון', 
              type: 'savings', 
              isIncluded: true,
              simRate: getDefaultRate('savings'),
              simDeposit: 0, // Savings usually don't have fixed monthly like pension, but user can add
              depositYears: defaultYears
          })),
          ...data.realEstate.map(r => ({ 
              id: r.id, 
              name: r.name, 
              value: r.value, 
              category: 'נדל״ן', 
              type: 'realestate', 
              isIncluded: true, // Included by default now
              simRate: getDefaultRate('realestate'),
              simDeposit: 0,
              depositYears: defaultYears
          }))
      ];
      setAssets(mappedAssets);
  }, [data]); // Intentionally not depending on 'years' here to prevent overwriting user edits when global years change

  const toggleAsset = (id: string) => {
      setAssets(prev => prev.map(a => a.id === id ? { ...a, isIncluded: !a.isIncluded } : a));
  };

  const updateAssetParam = (id: string, field: 'simRate' | 'simDeposit' | 'depositYears', val: string) => {
      setAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: Number(val) } : a));
  };

  const calculateData = useMemo(() => {
      if (assets.length === 0) return [];

      const currentYear = new Date().getFullYear();
      const yearlyData = [];
      
      const numYears = years === '' ? 20 : Number(years);
      const numInf = inflation === '' ? 2.5 : Number(inflation);
      const r_inflation = numInf / 100;

      // Initialize running values for each asset
      let runningAssets = assets.filter(a => a.isIncluded).map(a => ({
          ...a,
          currentNominal: a.value,
          currentReal: a.value
      }));

      // Initial Year (0)
      const startNominal = runningAssets.reduce((sum, a) => sum + a.currentNominal, 0);
      yearlyData.push({
          year: currentYear,
          nominal: Math.round(startNominal),
          real: Math.round(startNominal)
      });

      for (let i = 1; i <= numYears; i++) {
          let yearTotalNominal = 0;
          let yearTotalReal = 0;

          runningAssets.forEach(asset => {
              const r_nominal = asset.simRate / 100;
              // Real Rate calculation: Fisher equation approx or (1+n)/(1+i)-1
              const r_real = (1 + r_nominal) / (1 + r_inflation) - 1;
              
              // Check if we should still deposit for this asset
              const isDepositing = i <= asset.depositYears;
              const annualContribution = isDepositing ? asset.simDeposit * 12 : 0;

              // Nominal Calculation: Value grows by Rate + Deposits
              asset.currentNominal = (asset.currentNominal * (1 + r_nominal)) + annualContribution;
              
              // Real Calculation: 
              // We assume the *contribution* power stays constant (salary indexation). 
              // So we add the nominal contribution to the real bucket but grow the bucket by the real rate.
              asset.currentReal = (asset.currentReal * (1 + r_real)) + annualContribution;

              yearTotalNominal += asset.currentNominal;
              yearTotalReal += asset.currentReal;
          });

          yearlyData.push({
              year: currentYear + i,
              nominal: Math.round(yearTotalNominal),
              real: Math.round(yearTotalReal)
          });
      }

      return yearlyData;
  }, [assets, years, inflation]);

  const finalNominal = calculateData.length > 0 ? calculateData[calculateData.length - 1].nominal : 0;
  const finalReal = calculateData.length > 0 ? calculateData[calculateData.length - 1].real : 0;
  const numYearsDisplay = years === '' ? 20 : Number(years);
  
  const totalMonthlyDeposit = assets.filter(a => a.isIncluded).reduce((sum, a) => sum + a.simDeposit, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-hidden">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-full md:h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" />
                        סימולטור תחזיות מתקדם
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm">חישוב לפי פרמטרים אישיים לכל נכס</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                    <X size={24} className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
                
                {/* Controls Sidebar - WIDER for inputs */}
                <div className="w-full lg:w-[450px] bg-slate-50 p-4 border-l border-slate-100 lg:overflow-y-auto custom-scrollbar flex-shrink-0">
                    
                    <div className="space-y-6">
                        
                        {/* Global Params */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="font-bold text-slate-800 text-sm">הגדרות כלליות</h3>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">טווח שנים</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={years}
                                            onChange={(e) => setYears(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-center text-slate-700"
                                            placeholder="20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">אינפלציה %</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={inflation}
                                            onChange={(e) => setInflation(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-center text-slate-700"
                                            step="0.1"
                                            placeholder="2.5"
                                        />
                                    </div>
                                </div>
                             </div>
                             <div className="mt-4 flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100">
                                 <span className="font-bold">סה"כ הפקדה חודשית:</span>
                                 <span className="font-black text-sm">{formatCurrency(totalMonthlyDeposit)}</span>
                             </div>
                        </div>

                        {/* Assets List */}
                        <div>
                            <h3 className="font-bold text-slate-800 mb-4 px-1">נכסים והגדרות תשואה</h3>
                            <div className="space-y-3">
                                {assets.map(asset => (
                                    <div 
                                        key={asset.id} 
                                        className={`p-4 rounded-2xl border transition-all duration-200 ${asset.isIncluded ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'}`}
                                    >
                                        {/* Header Row: Checkbox + Name + Value */}
                                        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleAsset(asset.id)}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {asset.isIncluded ? <CheckCircle size={20} className="text-emerald-500 shrink-0" /> : <Circle size={20} className="text-slate-300 shrink-0" />}
                                                <div className="truncate">
                                                    <div className="font-bold text-sm text-slate-800 truncate" title={asset.name}>{asset.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">{asset.category}</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-mono font-bold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                {formatCurrency(asset.value).split('.')[0]}
                                            </div>
                                        </div>

                                        {/* Inputs Row - Improved Layout with 3 Columns */}
                                        {asset.isIncluded && (
                                            <div className="grid grid-cols-3 gap-3 animate-fade-in pt-1 border-t border-slate-50 mt-1">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block pr-1">תשואה %</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number"
                                                            step="0.1"
                                                            value={asset.simRate}
                                                            onChange={(e) => updateAssetParam(asset.id, 'simRate', e.target.value)}
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-slate-700 text-center"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block pr-1">הפקדה</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number"
                                                            value={asset.simDeposit}
                                                            onChange={(e) => updateAssetParam(asset.id, 'simDeposit', e.target.value)}
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-slate-700 text-center"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block pr-1">שנות הפקדה</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="number"
                                                            value={asset.depositYears}
                                                            onChange={(e) => updateAssetParam(asset.id, 'depositYears', e.target.value)}
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-slate-700 text-center"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 p-4 md:p-6 flex flex-col bg-white lg:overflow-hidden min-h-[400px]">
                     <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 md:mb-8 gap-4 flex-shrink-0 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                         <div>
                             <p className="text-slate-500 font-bold text-xs md:text-sm mb-2">סכום חזוי בעוד {numYearsDisplay} שנים</p>
                             <div className="flex flex-wrap items-baseline gap-6">
                                <div className="text-center sm:text-right">
                                    <span className="text-xs text-slate-400 block mb-0.5">נומינלי</span>
                                    <h3 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">{formatCurrency(finalNominal)}</h3>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                                <div className="text-center sm:text-right">
                                    <span className="text-xs text-emerald-600 font-bold block mb-0.5">ריאלי (כוח קניה)</span>
                                    <h3 className="text-xl md:text-2xl font-bold text-emerald-600">{formatCurrency(finalReal)}</h3>
                                </div>
                             </div>
                         </div>
                         <div className="text-right sm:text-left">
                             <p className="text-slate-500 font-medium text-xs mb-1">נכסים התחלתיים</p>
                             <p className="text-lg md:text-xl font-bold text-slate-600">{formatCurrency(calculateData[0]?.nominal || 0)}</p>
                         </div>
                     </div>

                     <div className="flex-1 w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <AreaChart data={calculateData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
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
                                    tick={{fontSize: 12}}
                                    tickMargin={10}
                                />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    tickFormatter={(val) => `₪${(val/1000000).toFixed(1)}M`}
                                    tick={{fontSize: 12}}
                                    width={60}
                                    tickMargin={10}
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
                                    name="ריאלי (בניכוי אינפלציה)"
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
