
import React, { useState, useEffect } from 'react';
import { FinancialState, PensionItem } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { X, Calculator } from 'lucide-react';
import NumberInput from './NumberInput';

interface PensionCalculatorProps {
  data: FinancialState;
  onClose: () => void;
}

const PensionCalculator: React.FC<PensionCalculatorProps> = ({ data, onClose }) => {
  const [pensionBalance, setPensionBalance] = useState('');
  const [pensionDeposit, setPensionDeposit] = useState('');
  const [pensionFeeAcc, setPensionFeeAcc] = useState(''); 
  const [pensionFeeDep, setPensionFeeDep] = useState(''); 

  const [gemelBalance, setGemelBalance] = useState('');
  const [gemelDeposit, setGemelDeposit] = useState('');
  const [gemelFeeAcc, setGemelFeeAcc] = useState(''); 

  const [yearsToWork, setYearsToWork] = useState('');
  const [yearsToRetire, setYearsToRetire] = useState('');
  
  const [returnRate, setReturnRate] = useState(''); 
  const [inflation, setInflation] = useState(''); 
  const [annuityFactor, setAnnuityFactor] = useState('');

  useEffect(() => {
      const pensions = data.pensions.filter(p => p.type === 'pension');
      const pBal = pensions.reduce((sum, item) => sum + item.value, 0);
      const pDep = pensions.reduce((sum, item) => sum + item.monthlyDeposit, 0);
      
      if (pBal > 0) setPensionBalance(pBal.toString());
      if (pDep > 0) setPensionDeposit(pDep.toString());
      
      if (pensions.length > 0 && pensions[0].managementFeeAccumulation) setPensionFeeAcc(pensions[0].managementFeeAccumulation.toString());
      if (pensions.length > 0 && pensions[0].managementFeeDeposit) setPensionFeeDep(pensions[0].managementFeeDeposit.toString());

      const gemels = data.pensions.filter(p => p.type === 'provident_fund');
      const gBal = gemels.reduce((sum, item) => sum + item.value, 0);
      const gDep = gemels.reduce((sum, item) => sum + item.monthlyDeposit, 0);
      
      if (gBal > 0) setGemelBalance(gBal.toString());
      if (gDep > 0) setGemelDeposit(gDep.toString());
      if (gemels.length > 0 && gemels[0].managementFeeAccumulation) setGemelFeeAcc(gemels[0].managementFeeAccumulation.toString());

  }, [data]);

  const [nominalTotal, setNominalTotal] = useState(0);
  const [realTotal, setRealTotal] = useState(0);
  const [nominalAnnuity, setNominalAnnuity] = useState(0);
  const [realAnnuity, setRealAnnuity] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
      const yearlyData = [];
      
      // Sync Defaults with Placeholders for visual consistency on load
      const pBal = pensionBalance === '' ? 250000 : Number(pensionBalance);
      const pDep = pensionDeposit === '' ? 1500 : Number(pensionDeposit);
      const pFeeAcc = pensionFeeAcc === '' ? 0.2 : Number(pensionFeeAcc);
      const pFeeDep = pensionFeeDep === '' ? 1.5 : Number(pensionFeeDep);

      const gBal = Number(gemelBalance) || 0; // Gemel defaults to 0 if empty
      const gDep = Number(gemelDeposit) || 0;
      const gFeeAcc = gemelFeeAcc === '' ? 0.6 : Number(gemelFeeAcc);

      const yWork = yearsToWork === '' ? 30 : Number(yearsToWork);
      const yRetire = yearsToRetire === '' ? 30 : Number(yearsToRetire);
      
      const rRate = returnRate === '' ? 8.0 : Number(returnRate);
      const inf = inflation === '' ? 3.0 : Number(inflation);
      const factor = annuityFactor === '' ? 200 : Number(annuityFactor);

      let currP_Nominal = pBal;
      let currG_Nominal = gBal;
      
      let currP_Real = pBal;
      let currG_Real = gBal;
      
      const r_nominal = rRate / 100;
      const r_inflation = inf / 100;
      const r_real = (1 + r_nominal) / (1 + r_inflation) - 1;

      const maxYears = Math.max(yRetire, yWork);

      for (let i = 0; i <= maxYears; i++) {
          const totalNominal = Math.round(currP_Nominal + currG_Nominal);
          const totalReal = Math.round(currP_Real + currG_Real);

          yearlyData.push({
              year: i,
              nominal: totalNominal,
              real: totalReal
          });

          if (i < yRetire) {
              const isDepositing = i < yWork;
              
              const pAnnualDep = isDepositing ? pDep * 12 : 0;
              const pNetDep = pAnnualDep * (1 - pFeeDep / 100);
              const pGrowthNom = currP_Nominal * r_nominal;
              const pAccFeeAmount_Nom = (currP_Nominal + pNetDep) * (pFeeAcc / 100);
              currP_Nominal = currP_Nominal + pGrowthNom + pNetDep - pAccFeeAmount_Nom;

              const pGrowthReal = currP_Real * r_real;
              const pNetDepReal = pAnnualDep * (1 - pFeeDep / 100); 
              const pAccFeeAmount_Real = (currP_Real + pNetDepReal) * (pFeeAcc / 100); 
              currP_Real = currP_Real + pGrowthReal + pNetDepReal - pAccFeeAmount_Real;

              const gAnnualDep = isDepositing ? gDep * 12 : 0;
              
              const gGrowthNom = currG_Nominal * r_nominal;
              const gAccFeeAmount_Nom = (currG_Nominal + gAnnualDep) * (gFeeAcc / 100);
              currG_Nominal = currG_Nominal + gGrowthNom + gAnnualDep - gAccFeeAmount_Nom;

              const gGrowthReal = currG_Real * r_real;
              const gAccFeeAmount_Real = (currG_Real + gAnnualDep) * (gFeeAcc / 100);
              currG_Real = currG_Real + gGrowthReal + gAnnualDep - gAccFeeAmount_Real;
          }
      }

      setChartData(yearlyData);
      setNominalTotal(currP_Nominal + currG_Nominal);
      setRealTotal(currP_Real + currG_Real);
      setNominalAnnuity((currP_Nominal + currG_Nominal) / factor);
      setRealAnnuity((currP_Real + currG_Real) / factor);

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

            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-slate-50">
                {/* Controls */}
                <div className="w-full lg:w-1/3 p-4 md:p-6 lg:overflow-y-auto custom-scrollbar flex-shrink-0 border-l border-slate-100">
                    <div className="space-y-6">
                        
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-cyan-100 shadow-sm">
                            <h3 className="font-bold text-cyan-800 border-b border-cyan-50 pb-2 text-sm">קרן פנסיה</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">צבירה נוכחית</label>
                                    <NumberInput value={pensionBalance} onChange={setPensionBalance} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-cyan-500" placeholder="250,000" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">הפקדה חודשית</label>
                                    <NumberInput value={pensionDeposit} onChange={setPensionDeposit} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-cyan-500" placeholder="1,500" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ד.נ. מצבירה %</label>
                                    <input type="number" step="0.01" value={pensionFeeAcc} onChange={e => setPensionFeeAcc(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-cyan-500" placeholder="0.2" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ד.נ. מהפקדה %</label>
                                    <input type="number" step="0.01" value={pensionFeeDep} onChange={e => setPensionFeeDep(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-cyan-500" placeholder="1.5" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                            <h3 className="font-bold text-purple-800 border-b border-purple-50 pb-2 text-sm">קופת גמל</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">צבירה נוכחית</label>
                                    <NumberInput value={gemelBalance} onChange={setGemelBalance} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-purple-500" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">הפקדה חודשית</label>
                                    <NumberInput value={gemelDeposit} onChange={setGemelDeposit} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold outline-none focus:border-purple-500" placeholder="0" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">דמי ניהול מצבירה % (לרוב אין מהפקדה)</label>
                                    <input type="number" step="0.01" value={gemelFeeAcc} onChange={e => setGemelFeeAcc(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-purple-500" placeholder="0.6" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">שנות הפקדה</label>
                                    <input type="number" value={yearsToWork} onChange={e => setYearsToWork(e.target.value)} className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="30" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">שנים עד פרישה</label>
                                    <input type="number" value={yearsToRetire} onChange={e => setYearsToRetire(e.target.value)} className="w-full p-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500" placeholder="30" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-2">הנחות יסוד</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">תשואה %</label>
                                    <input type="number" step="0.1" value={returnRate} onChange={e => setReturnRate(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" placeholder="8.0" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">אינפלציה %</label>
                                    <input type="number" step="0.1" value={inflation} onChange={e => setInflation(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" placeholder="3.0" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">מקדם</label>
                                    <input type="number" value={annuityFactor} onChange={e => setAnnuityFactor(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" placeholder="200" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="flex-1 p-4 md:p-6 flex flex-col bg-white lg:overflow-y-auto custom-scrollbar">
                     
                     <div className="grid grid-cols-2 gap-4 mb-2 flex-shrink-0">
                         <div className="bg-cyan-50 p-3 rounded-2xl border border-cyan-100 text-center">
                             <h4 className="text-cyan-800 font-bold mb-1 text-xs">שווי הוני כולל (נומינלי)</h4>
                             <div className="text-xl md:text-2xl font-black text-cyan-700">{formatCurrency(nominalTotal)}</div>
                         </div>
                         <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
                             <h4 className="text-emerald-700 font-bold mb-1 text-xs">שווי הוני כולל (ריאלי)</h4>
                             <div className="text-xl md:text-2xl font-black text-emerald-600">{formatCurrency(realTotal)}</div>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
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

                     <div className="flex-1 w-full relative min-h-[300px]">
                        <h4 className="text-sm font-bold text-slate-500 mb-2">התפתחות החיסכון לאורך השנים</h4>
                        <ResponsiveContainer width="100%" height="100%">
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
