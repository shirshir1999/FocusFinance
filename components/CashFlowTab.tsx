
import React, { useState, useEffect } from 'react';
import { CashFlowState, IncomeItem, LoanItem, RealEstateItem } from '../types';
import { ArrowRight, Save, Plus, Trash2, ArrowRightLeft, Building2, CreditCard, BookOpen, ExternalLink, TrendingUp } from 'lucide-react';
import NumberInput from './NumberInput';

interface CashFlowTabProps {
  data: CashFlowState;
  loans: LoanItem[];
  realEstate: RealEstateItem[];
  onUpdate: (state: CashFlowState) => void;
  onBack: () => void;
}

const EXPENSE_CATEGORIES = [
    "מזון ומכולת", "סופרפארם", "ביגוד והנעלה", "חשמל", "גז", "ארנונה ומים",
    "ביטוח בריאות קופ\"ח", "ביטוח בריאות פרטי", "ביטוח חיחיים", "ביטוח דירה",
    "מטפלת/שמרטף/מעון/גן", "ביה\"ס וחומרי לימוד", "חוגים", "דמי כיס",
    "טלפון סלולרי", "טלפון קווי", "אינטרנט", "שכ\"ד", "ועד בית",
    "עוזרת", "אחזקת בית ותיקונים", "תחבורה ציבורית", "דלק",
    "אחזקת רכב ותיקונים", "ביטוח (חובה ומקיף)", "טסט", "קופת גמל השקעה",
    "בנכס", "תוכניות חיסכון", "עמלות וריבית", "מספרה", "קוסמטיקה",
    "נטפליקס/ דיסני +/ yes", "עיתונים", "נסיעות לחו\"ל וחופשות", "קאונטרי/ חוגים הורים",
    "מסעדות,סרטים והצגות", "אוכל עבודה", "חדר כושר", "שמרטף", "מתנות (משפחה,אירועים)",
    "בעלי חיים", "תמיכה בבני משפחה", "הוצאות ריפוי", "מזומן ללא מעקב"
];

const CashFlowTab: React.FC<CashFlowTabProps> = ({ data, loans, realEstate, onUpdate, onBack }) => {
  const [monthlyIncome, setMonthlyIncome] = useState(data.monthlyIncome || 0);
  const [additionalIncomes, setAdditionalIncomes] = useState<IncomeItem[]>(data.additionalIncomes || []);
  const [includeRealEstateRent, setIncludeRealEstateRent] = useState(data.includeRealEstateRent || false);
  const [rentInclusionPercentage, setRentInclusionPercentage] = useState(data.realEstateRentInclusionPercentage || 100);
  
  const [mode, setMode] = useState<'simple' | 'detailed'>(data.expensesMode || 'simple');
  const [generalExpense, setGeneralExpense] = useState(data.generalExpense || 0);
  const [detailedExpenses, setDetailedExpenses] = useState<Record<string, number>>(data.detailedExpenses || {});

  useEffect(() => {
      onUpdate({
          monthlyIncome,
          additionalIncomes,
          includeRealEstateRent,
          realEstateRentInclusionPercentage: rentInclusionPercentage,
          expensesMode: mode,
          generalExpense: generalExpense,
          detailedExpenses: detailedExpenses
      });
  }, [monthlyIncome, additionalIncomes, includeRealEstateRent, rentInclusionPercentage, mode, generalExpense, detailedExpenses]);

  const handleDetailedChange = (category: string, value: string) => {
      setDetailedExpenses(prev => ({ ...prev, [category]: Number(value) }));
  };

  const addIncomeSource = () => {
      setAdditionalIncomes(prev => [...prev, { id: Date.now().toString(), source: '', amount: 0 }]);
  };

  const updateIncomeSource = (id: string, field: 'source' | 'amount', value: any) => {
      setAdditionalIncomes(prev => prev.map(item => item.id === id ? { ...item, [field]: field === 'amount' ? Number(value) : value } : item));
  };

  const removeIncomeSource = (id: string) => {
      setAdditionalIncomes(prev => prev.filter(item => item.id !== id));
  };

  // Calculations
  const totalAdditionalIncome = additionalIncomes.reduce((sum: number, item: IncomeItem) => sum + Number(item.amount), 0);
  const totalBaseIncome = Number(monthlyIncome) + totalAdditionalIncome;
  
  const totalRentPotential = realEstate.reduce((sum, r) => sum + (r.monthlyRent || 0), 0);
  const includedRent = includeRealEstateRent ? totalRentPotential * (rentInclusionPercentage / 100) : 0;
  
  const finalTotalIncome = totalBaseIncome + includedRent;

  // Debt Service
  const totalLoanPayments = loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const totalMortgagePayments = realEstate.reduce((sum, r) => {
      if (r.mortgageTracks && r.mortgageTracks.length > 0) {
          return sum + r.mortgageTracks.reduce((t, track) => t + track.monthlyPayment, 0);
      }
      return sum; 
  }, 0);
  const totalDebtService = totalLoanPayments + totalMortgagePayments;

  const userExpenses = mode === 'simple' 
      ? Number(generalExpense) 
      : (Object.values(detailedExpenses) as number[]).reduce((sum, val) => sum + Number(val), 0);
  
  const totalExpenses = userExpenses + totalDebtService;
  const netFlow = finalTotalIncome - totalExpenses;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500">
                <ArrowRight size={20} />
            </button>
            <div>
                 <h2 className="text-3xl font-black text-slate-800">תזרים מזומנים</h2>
                 <p className="text-slate-500">ניהול הכנסות והוצאות שוטפות</p>
            </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Income Section */}
            <div className="lg:col-span-3 bg-white border border-slate-100 p-4 md:p-6 rounded-3xl shadow-sm space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ArrowRightLeft size={20} className="text-emerald-500"/> הכנסות מעבודה ועוד</h3>
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-sm font-bold text-slate-500 mb-2">הכנסה חודשית מעבודה (נטו)</label>
                                 <NumberInput 
                                     value={monthlyIncome}
                                     onChange={(val) => setMonthlyIncome(Number(val))}
                                     className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-2xl text-emerald-700"
                                     placeholder="0"
                                 />
                             </div>
                             
                             <div className="space-y-3">
                                 {additionalIncomes.map((item) => (
                                     <div key={item.id} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                         <input 
                                            type="text" 
                                            value={item.source}
                                            onChange={(e) => updateIncomeSource(item.id, 'source', e.target.value)}
                                            placeholder="מקור ההכנסה"
                                            className="w-full sm:flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                                         />
                                         <div className="flex gap-2 w-full sm:w-auto">
                                            <NumberInput 
                                                value={item.amount}
                                                onChange={(val) => updateIncomeSource(item.id, 'amount', val)}
                                                placeholder="סכום"
                                                className="flex-1 sm:w-28 p-2 bg-white border border-slate-200 rounded-lg font-bold text-sm outline-none focus:border-emerald-500"
                                            />
                                            <button onClick={() => removeIncomeSource(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                <Trash2 size={18} />
                                            </button>
                                         </div>
                                     </div>
                                 ))}
                                 <button onClick={addIncomeSource} className="text-emerald-600 text-sm font-bold hover:underline flex items-center gap-1 mt-2">
                                     <Plus size={14} /> הוסף מקור הכנסה נוסף
                                 </button>
                             </div>
                         </div>
                     </div>

                     <div>
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Building2 size={20} className="text-indigo-500"/> הכנסות משכירות נדל"ן</h3>
                         <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-4">
                             <div className="flex justify-between items-center">
                                 <div className="text-sm text-indigo-800">חישוב הכנסה משכירות</div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={includeRealEstateRent} onChange={(e) => setIncludeRealEstateRent(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                 </label>
                             </div>
                             
                             {includeRealEstateRent && (
                                 <div className="animate-fade-in">
                                     <div className="flex justify-between text-xs text-indigo-600 mb-1">
                                         <span>אחוז ההכנסה לתזרים: {rentInclusionPercentage}%</span>
                                         <span>{totalRentPotential.toLocaleString()} ₪ סה"כ</span>
                                     </div>
                                     <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={rentInclusionPercentage} 
                                        onChange={(e) => setIncludeRealEstateRent(true)} 
                                        onInput={(e) => setRentInclusionPercentage(Number((e.target as HTMLInputElement).value))}
                                        className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                     />
                                     <div className="text-right mt-2 font-bold text-indigo-900">
                                         נכנס לתזרים: ₪{includedRent.toLocaleString()}
                                     </div>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>

                 <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                     <div className="bg-slate-50 p-3 rounded-lg text-center">
                         <span className="text-slate-500 text-xs block mb-1">סה"כ הכנסות (ללא נדל"ן)</span>
                         <span className="text-xl font-bold text-slate-700">₪{totalBaseIncome.toLocaleString()}</span>
                     </div>
                     <div className="bg-emerald-50 p-3 rounded-lg text-center border border-emerald-100">
                         <span className="text-emerald-600 text-xs block mb-1 font-bold">סה"כ הכנסות (כולל נדל"ן)</span>
                         <span className="text-xl font-black text-emerald-700">₪{finalTotalIncome.toLocaleString()}</span>
                     </div>
                 </div>
            </div>

            {/* Expenses Configuration */}
            <div className="lg:col-span-3">
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => setMode('simple')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'simple' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    >
                        הערכה כללית
                    </button>
                    <button 
                        onClick={() => setMode('detailed')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'detailed' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
                    >
                        פירוט מלא
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {mode === 'simple' ? (
                        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-center min-h-[140px]">
                            <label className="block text-sm font-bold text-slate-700 mb-2">הוצאות שוטפות (ללא חובות)</label>
                            <NumberInput 
                                value={generalExpense}
                                onChange={(val) => setGeneralExpense(Number(val))}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none font-bold text-xl"
                                placeholder="לדוגמה: 15000"
                            />
                        </div>
                    ) : (
                        <div className="md:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm animate-fade-in">
                            <h3 className="font-bold text-slate-800 mb-6">פירוט הוצאות (ללא הלוואות ומשכנתא)</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {EXPENSE_CATEGORIES.map(category => (
                                    <div key={category} className="bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-slate-300 focus-within:bg-white transition-colors">
                                        <label className="block text-xs font-bold text-slate-500 mb-1 truncate" title={category}>{category}</label>
                                        <NumberInput 
                                            value={detailedExpenses[category] || ''}
                                            onChange={(val) => handleDetailedChange(category, val)}
                                            className="w-full bg-transparent outline-none font-mono font-medium text-slate-800"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex flex-col justify-center min-h-[140px]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-full text-rose-500 shadow-sm"><CreditCard size={20}/></div>
                            <div>
                                <h4 className="font-bold text-rose-900">החזרי הלוואות ומשכנתא</h4>
                                <p className="text-xs text-rose-700">מחושב אוטומטית מהתחייבויות</p>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-rose-700 mt-2">
                            ₪{totalDebtService.toLocaleString()}
                        </div>
                    </div>

                </div>

                {/* Total Summary */}
                <div className="mt-8 bg-slate-900 text-white p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                    <div className="text-center md:text-right">
                        <p className="text-emerald-400 font-black mb-1 text-2xl">תזרים חודשי נטו</p>
                        <p className="text-sm opacity-60">הכנסות - (הוצאות + חובות)</p>
                    </div>
                    <div className={`text-4xl font-black ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₪{netFlow.toLocaleString()}
                    </div>
                </div>
            </div>
       </div>

        {/* --- KNOWLEDGE SECTION --- */}
        <div className="pt-8 border-t border-slate-200/60 mt-8">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <BookOpen className="text-emerald-500" size={24} />
                ידע זה כוח - מדריכים מקצועיים
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <a 
                    href="https://www.shirfinance.com/%D7%9E%D7%90%D7%9E%D7%A8%D7%99%D7%9D/%D7%A4%D7%A8%D7%99%D7%A9%D7%94-%D7%9E%D7%95%D7%A7%D7%93%D7%9E%D7%AA-%D7%95%D7%99%D7%A6%D7%99%D7%A8%D7%AA-%D7%AA%D7%96%D7%A8%D7%99%D7%9D-%D7%9E%D7%AA%D7%99%D7%A7-%D7%94%D7%94%D7%A9%D7%A7%D7%A2%D7%95%D7%AA-%D7%A9%D7%9C%D7%9B%D7%9D" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition group flex flex-col justify-between h-full"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp size={10}/> חופש כלכלי</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-emerald-700 transition-colors">יצירת תזרים מתיק ההשקעות</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            חולמים לפרוש מוקדם או להוריד אחוזי משרה? כך ניתן להתקיים מההשקעות והנכסים שלכם וליצור תזרים מזומנים חיובי.
                        </p>
                    </div>
                    <div className="mt-4 flex items-center text-emerald-600 text-sm font-bold gap-1">
                        קראו עוד באתר <ExternalLink size={14} />
                    </div>
                </a>
            </div>
        </div>

    </div>
  );
};

export default CashFlowTab;
