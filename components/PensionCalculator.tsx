
import React, { useState, useEffect } from 'react';
import { FinancialState, PensionItem } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { X, Calculator, ArrowRight, TrendingUp } from 'lucide-react';
import NumberInput from './NumberInput';

interface PensionCalculatorProps {
  data: FinancialState;
  onClose: () => void;
}

const PensionCalculator: React.FC<PensionCalculatorProps> = ({ data, onClose }) => {
  // --- Pension Data ---
  const [pensionBalance, setPensionBalance] = useState(0);
  const [pensionDeposit, setPensionDeposit] = useState(0);
  const [pensionFeeAcc, setPensionFeeAcc] = useState(0.2); // Default Accumulation Fee
  const [pensionFeeDep, setPensionFeeDep] = useState(1.5); // Default Deposit Fee

  // --- Gemel Data ---
  const [gemelBalance, setGemelBalance] = useState(0);
  const [gemelDeposit, setGemelDeposit] = useState(0);
  const [gemelFeeAcc, setGemelFeeAcc] = useState(0.6); // Default Gemel Fee (Only Acc)

  // --- General Settings ---
  const [yearsToWork, setYearsToWork] = useState(30);
  const [yearsToRetire, setYearsToRetire] = useState(30);
  
  const [returnRate, setReturnRate] = useState(10); // Default 10%
  const [inflation, setInflation] = useState(3); // Default 3%
  const [annuityFactor, setAnnuityFactor] = useState(200);

  // Initialize from data
  useEffect(() => {
      // Load Pension Data
      const pensions = data.pensions.filter(p => p.type === 'pension');
      const pBal = pensions.reduce((sum, item) => sum + item.value, 0);
      const pDep = pensions.reduce((sum, item) => sum + item.monthlyDeposit, 0);
      // Average fees calculation is complex, using sensible defaults or first item found
      const pFeeAcc = pensions.length > 0 && pensions[0].managementFeeAccumulation ? pensions[0].managementFeeAccumulation : 0.2;
      const pFeeDep = pensions.length > 0 && pensions[0].managementFeeDeposit ? pensions[0].managementFeeDeposit : 1.5;

      setPensionBalance(pBal);
      setPensionDeposit(pDep);
      setPensionFeeAcc(pFeeAcc);
      setPensionFeeDep(pFeeDep);

      // Load Gemel (Provident Fund) Data
      const gemels = data.pensions.filter(p => p.type === 'provident_fund');
      const gBal = gemels.reduce((sum, item) => sum + item.value, 0);
      const gDep = gemels.reduce((sum, item) => sum + item.monthlyDeposit, 0);
      const gFeeAcc = gemels.length > 0 && gemels[0].managementFeeAccumulation ? gemels[0].managementFeeAccumulation : 0.6;

      setGemelBalance(gBal);
      setGemelDeposit(gDep);
      setGemelFeeAcc(gFeeAcc);

  }, [data]);

  // Results
  const [nominalTotal, setNominalTotal] = useState(0);
  const [realTotal, setRealTotal] = useState(0);
  const [nominalAnnuity, setNominalAnnuity] = useState(0);
  const [realAnnuity, setRealAnnuity] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
      const yearlyData = [];
      
      let currP_Nominal = pensionBalance;
      let currG_Nominal = gemelBalance;
      
      let currP_Real = pensionBalance;
      let currG_Real = gemelBalance;
      
      // Rates
      const r_nominal = returnRate / 100;
      const r_inflation = inflation / 100;
      const r_real = (1 + r_nominal) / (1 + r_inflation) - 1;

      const maxYears = Math.max(yearsToRetire, yearsToWork);

      for (let i = 0; i <= maxYears; i++) {
          const totalNominal = Math.round(currP_Nominal + currG_Nominal);
          const totalReal = Math.round(currP_Real + currG_Real);

          yearlyData.push({
              year: i,
              nominal: totalNominal,
              real: totalReal
          });

          if (i < yearsToRetire) {
              const isDepositing = i < yearsToWork;
              
              // --- PENSION CALCULATION ---
              // Nominal Calc
              const pAnnualDep = isDepositing ? pensionDeposit * 12 : 0;
              const pNetDep = pAnnualDep * (1 - pensionFeeDep / 100);
              const pGrowthNom = currP_Nominal * r_nominal;
              const pAccFeeAmount_Nom = (currP_Nominal + pNetDep) * (pensionFeeAcc / 100);
              currP_Nominal = currP_Nominal + pGrowthNom + pNetDep - pAccFeeAmount_Nom;

              // Real Calc - Assuming Nominal Contribution grows with Inflation
              // Therefore Real Contribution is constant.
              const pGrowthReal = currP_Real * r_real;
              const pNetDepReal = pAnnualDep * (1 - pensionFeeDep / 100); // Constant Real Deposit
              const pAccFeeAmount_Real = (currP_Real + pNetDepReal) * (pensionFeeAcc / 100); 
              currP_Real = currP_Real + pGrowthReal + pNetDepReal - pAccFeeAmount_Real;


              // --- GEMEL CALCULATION ---
              const gAnnualDep = isDepositing ? gemelDeposit * 12 : 0;
              
              const gGrowthNom = currG_Nominal * r_nominal;
              const gAccFeeAmount_Nom = (currG_Nominal + gAnnualDep) * (gemelFeeAcc / 100);
              currG_Nominal = currG_Nominal + gGrowthNom + gAnnualDep - gAccFeeAmount_Nom;

              const gGrowthReal = currG_Real * r_real;
              const gAccFeeAmount_Real = (currG_Real + gAnnualDep) * (gemelFeeAcc / 100);
              currG_Real = currG_Real + gGrowthReal + gAnnualDep - gAccFeeAmount_Real;
          }
      }

      setChartData(yearlyData);
      setNominalTotal(currP_Nominal + currG_Nominal);
      setRealTotal(currP_Real + currG_Real);
      setNominalAnnuity((currP_Nominal + currG_Nominal) / annuityFactor);
      setRealAnnuity((currP_Real + currG_Real) / annuityFactor);

  }, [
      pensionBalance, pensionDeposit, pensionFeeAcc, pensionFeeDep,
      gemelBalance, gemelDeposit, gemelFeeAcc,
      yearsToWork, yearsToRetire, returnRate, inflation, annuityFactor
  ]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-hidden">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Calculator className="text-cyan-500" />
                        מחשבון פרישה וקצבה
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm">כולל פנסיה וגמל, התחשבות בדמי ניהול ואינפלציה</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                    <X size={24} className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
                {/* Controls */}
                <div className="w-full lg:w-1/3 bg-slate-50 p-4 md:p-6 border-l border-slate-100 lg:overflow-y-auto custom-scrollbar flex-shrink-0">
                    <div className="space-y-6">
                        
                        {/* Pension Section */}
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-cyan-100 shadow-sm">
                            <h3 className="font-bold text-cyan-800 border-b border-cyan-50 pb-2 text-sm">קרן פנסיה</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">צבירה נוכחית</label>
                                    <NumberInput value={pensionBalance} onChange={setPensionBalance} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">הפקדה חודשית</label>
                                    <NumberInput value={pensionDeposit} onChange={setPensionDeposit} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ד.נ. מצבירה %</label>
                                    <input type="number" step="0.01" value={pensionFeeAcc} onChange={e => setPensionFeeAcc(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ד.נ. מהפקדה %</label>
                                    <input type="number" step="0.01" value={pensionFeeDep} onChange={e => setPensionFeeDep(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm"/>
                                </div>
                            </div>
                        </div>

                        {/* Gemel Section */}
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                            <h3 className="font-bold text-purple-800 border-b border-purple-50 pb-2 text-sm">קופת גמל</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">צבירה נוכחית</label>
                                    <NumberInput value={gemelBalance} onChange={setGemelBalance} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">הפקדה חודשית</label>
                                    <NumberInput value={gemelDeposit} onChange={setGemelDeposit} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">דמי ניהול מצבירה % (לרוב אין מהפקדה)</label>
                                    <input type="number" step="0.01" value={gemelFeeAcc} onChange={e => setGemelFeeAcc(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm"/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">שנות הפקדה</label>
                                    <input type="number" value={yearsToWork} onChange={e => setYearsToWork(Number(e.target.value))} className="w-full p-2 rounded-xl border border-slate-200"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">שנים עד פרישה</label>
                                    <input type="number" value={yearsToRetire} onChange={e => setYearsToRetire(Number(e.target.value))} className="w-full p-2 rounded-xl border border-slate-200"/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-2">הנחות יסוד</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">תשואה %</label>
                                    <input type="number" step="0.1" value={returnRate} onChange={e => setReturnRate(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">אינפלציה %</label>
                                    <input type="number" step="0.1" value={inflation} onChange={e => setInflation(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">מקדם</label>
                                    <input type="number" value={annuityFactor} onChange={e => setAnnuityFactor(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm"/>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 p-4 md:p-6 flex flex-col bg-white lg:overflow-hidden min-h-[400px]">
                     
                     <div className="grid grid-cols-2 gap-4 mb-2">
                         <div className="bg-cyan-50 p-3 rounded-2xl border border-cyan-100 text-center">
                             <h4 className="text-cyan-800 font-bold mb-1 text-xs">שווי הוני כולל (נומינלי)</h4>
                             <div className="text-xl md:text-2xl font-black text-cyan-700">{formatCurrency(nominalTotal)}</div>
                         </div>
                         <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
                             <h4 className="text-emerald-700 font-bold mb-1 text-xs">שווי הוני כולל (ריאלי)</h4>
                             <div className="text-xl md:text-2xl font-black text-emerald-600">{formatCurrency(realTotal)}</div>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100 text-center">
                             <h4 className="text-cyan-900 font-bold mb-1">קצבה (נומינלי)</h4>
                             <div className="text-3xl font-black text-cyan-600">{formatCurrency(nominalAnnuity)}</div>
                         </div>
                         <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center relative overflow-hidden">
                             <div className="absolute top-2 right-2 bg-emerald-200 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">כוח קניה</div>
                             <h4 className="text-emerald-900 font-bold mb-1">קצבה (ריאלי)</h4>
                             <div className="text-3xl font-black text-emerald-600">{formatCurrency(realAnnuity)}</div>
                         </div>
                     </div>

                     <div className="flex-1 w-full relative">
                        <h4 className="text-sm font-bold text-slate-500 mb-2">התפתחות החיסכון לאורך השנים</h4>
                        <ResponsiveContainer width="100%" height="90%" minHeight={250}>
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" stroke="#94a3b8" tick={{fontSize: 12}} />
                                <YAxis 
                                    stroke="#94a3b8" 
                                    tickFormatter={(val) => `₪${(val/1000000).toFixed(1)}M`} 
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
                                <Area type="monotone" dataKey="nominal" name="נומינלי (ללא אינפלציה)" stroke="#06b6d4" fill="url(#colorNominal)" strokeWidth={2} />
                                <Area type="monotone" dataKey="real" name="ריאלי (כוח קניה)" stroke="#10b981" fill="url(#colorReal)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PensionCalculator;
