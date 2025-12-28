
import React, { useState, useEffect, useMemo } from 'react';
import { CashFlowState, IncomeItem, LoanItem, RealEstateItem } from '../types';
import { ArrowRight, Save, Plus, Trash2, ArrowRightLeft, Building2, CreditCard, BookOpen, ExternalLink, TrendingUp, Calendar, ChevronLeft, ChevronRight, AlertTriangle, Activity, BarChart2, Target, X, Settings, ArrowUp, ArrowDown, EyeOff, Check } from 'lucide-react';
import NumberInput from './NumberInput';

interface CashFlowTabProps {
  data: CashFlowState;
  loans: LoanItem[];
  realEstate: RealEstateItem[];
  onUpdate: (state: CashFlowState) => void;
  onBack: () => void;
}

const DEFAULT_EXPENSE_CATEGORIES = [
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
  
  const [mode, setMode] = useState<'simple' | 'detailed' | 'tracking'>(data.expensesMode || 'simple');
  const [generalExpense, setGeneralExpense] = useState(data.generalExpense || 0);
  const [detailedExpenses, setDetailedExpenses] = useState<Record<string, number>>(data.detailedExpenses || {});
  
  // Custom Categories
  const [customCategories, setCustomCategories] = useState<string[]>(data.customCategories || []);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>(data.hiddenCategories || []);
  const [categoriesOrder, setCategoriesOrder] = useState<string[]>(data.categoriesOrder || []);
  
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false); // New Manage Mode
  const [newCategoryName, setNewCategoryName] = useState('');

  // Quick Add State
  const [quickAddCategory, setQuickAddCategory] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  // Tracking Mode State
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, Record<string, number>>>(data.monthlyExpenses || {});
  const [currentMonth, setCurrentMonth] = useState(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Calculate the final list of active categories based on order, custom, and hidden
  const activeCategories = useMemo(() => {
      // 1. Start with all known categories (default + custom)
      const allKnown = [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories];
      
      // 2. If we have a saved order, use it. Append any new ones that aren't in the order yet.
      let ordered = [];
      if (categoriesOrder && categoriesOrder.length > 0) {
          ordered = [...categoriesOrder];
          // Check for any missing ones (e.g. newly added custom or defaults)
          const missing = allKnown.filter(c => !ordered.includes(c));
          ordered = [...ordered, ...missing];
      } else {
          ordered = allKnown;
      }

      // 3. Filter out hidden ones
      return ordered.filter(c => !hiddenCategories.includes(c));
  }, [customCategories, hiddenCategories, categoriesOrder]);

  useEffect(() => {
      onUpdate({
          monthlyIncome,
          additionalIncomes,
          includeRealEstateRent,
          realEstateRentInclusionPercentage: rentInclusionPercentage,
          expensesMode: mode,
          generalExpense: generalExpense,
          detailedExpenses: detailedExpenses,
          monthlyExpenses: monthlyExpenses,
          customCategories: customCategories,
          hiddenCategories: hiddenCategories,
          categoriesOrder: categoriesOrder
      });
  }, [monthlyIncome, additionalIncomes, includeRealEstateRent, rentInclusionPercentage, mode, generalExpense, detailedExpenses, monthlyExpenses, customCategories, hiddenCategories, categoriesOrder]);

  // Handlers
  const handleDetailedChange = (category: string, value: string) => {
      setDetailedExpenses(prev => ({ ...prev, [category]: Number(value) }));
  };

  const handleTrackingChange = (category: string, value: string) => {
      setMonthlyExpenses(prev => ({
          ...prev,
          [currentMonth]: {
              ...(prev[currentMonth] || {}),
              [category]: Number(value)
          }
      }));
  };

  const handleQuickAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (quickAddCategory && quickAddValue) {
          const currentVal = (monthlyExpenses[currentMonth] || {})[quickAddCategory] || 0;
          const newVal = currentVal + Number(quickAddValue);
          handleTrackingChange(quickAddCategory, newVal.toString());
          setQuickAddCategory(null);
          setQuickAddValue('');
      }
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

  const handleAddCategory = () => {
      if (newCategoryName.trim()) {
          const name = newCategoryName.trim();
          if (!activeCategories.includes(name) && !hiddenCategories.includes(name)) {
              setCustomCategories(prev => [...prev, name]);
              // Also add to order at the end
              setCategoriesOrder(prev => [...prev, name]);
          } else if (hiddenCategories.includes(name)) {
              // Unhide if it was hidden
              setHiddenCategories(prev => prev.filter(c => c !== name));
          }
          setNewCategoryName('');
          setIsAddCategoryOpen(false);
      }
  };

  // --- Category Management Handlers ---
  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...activeCategories];
      if (direction === 'up' && index > 0) {
          [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
          [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
      }
      setCategoriesOrder(newOrder);
  };

  const handleHideCategory = (category: string) => {
      setHiddenCategories(prev => [...prev, category]);
  };

  // --- Date Navigation ---
  const changeMonth = (direction: -1 | 1) => {
      const [year, month] = currentMonth.split('-').map(Number);
      const newDate = new Date(year, month - 1 + direction, 1);
      setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
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

  // Expenses Calculation logic based on Mode
  let userExpenses = 0;
  if (mode === 'simple') {
      userExpenses = Number(generalExpense);
  } else if (mode === 'detailed') {
      userExpenses = (Object.values(detailedExpenses) as number[]).reduce((sum, val) => sum + Number(val), 0);
  } else {
      // Tracking mode - sum of current month
      const currentMonthExpenses = monthlyExpenses[currentMonth] || {};
      userExpenses = (Object.values(currentMonthExpenses) as number[]).reduce((sum, val) => sum + Number(val), 0);
  }
  
  const totalExpenses = userExpenses + totalDebtService;
  const netFlow = finalTotalIncome - totalExpenses;

  // Insights Logic - Updated to track per-category count
  const insights = useMemo(() => {
      if (mode !== 'tracking') return null;

      const categoryStats: Record<string, { sum: number, count: number }> = {};
      const monthKeys = Object.keys(monthlyExpenses);
      
      monthKeys.forEach(mKey => {
          const mData = monthlyExpenses[mKey] || {};
          Object.entries(mData).forEach(([cat, val]) => {
              const numVal = Number(val);
              if (numVal > 0) {
                  if (!categoryStats[cat]) categoryStats[cat] = { sum: 0, count: 0 };
                  categoryStats[cat].sum += numVal;
                  categoryStats[cat].count += 1;
              }
          });
      });

      // Calculate total historical average for top card (overall average)
      let totalSum = 0;
      let totalMonths = monthKeys.length > 0 ? monthKeys.length : 1; 
      
      // Calculate total historical expense across all categories
      monthKeys.forEach(mKey => {
          const mData = monthlyExpenses[mKey] || {};
          const mTotal = (Object.values(mData) as number[]).reduce((a, b) => Number(a) + Number(b), 0);
          totalSum += mTotal;
      });
      const overallAverage = totalMonths > 0 ? totalSum / totalMonths : 0;

      const [year, month] = currentMonth.split('-').map(Number);
      const prevDate = new Date(year, month - 2, 1);
      const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      
      const prevMonthExpenses = monthlyExpenses[prevMonthKey] || {};
      const prevTotal = (Object.values(prevMonthExpenses) as number[]).reduce((a, b) => a + b, 0);
      const currentTotal = (Object.values(monthlyExpenses[currentMonth] || {}) as number[]).reduce((a, b) => a + b, 0);
      const diffFromPrev = currentTotal - prevTotal;

      return { categoryStats, prevTotal, diffFromPrev, prevMonthKey, historyLength: monthKeys.length, overallAverage };
  }, [monthlyExpenses, currentMonth, mode]);

  const monthLabel = useMemo(() => {
      const [y, m] = currentMonth.split('-');
      const date = new Date(Number(y), Number(m) - 1);
      return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  // Common Components
  const renderAddCategoryCard = () => {
      if (isAddCategoryOpen) {
          return (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex flex-col justify-between shadow-sm animate-fade-in min-h-[100px]">
                  <div className="mb-2">
                      <label className="block text-xs font-bold text-emerald-700 mb-1">שם הקטגוריה</label>
                      <input 
                          type="text" 
                          autoFocus
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full p-1.5 border border-emerald-300 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                          placeholder="לדוגמה: סיגריות"
                      />
                  </div>
                  <div className="flex gap-2 mt-auto">
                      <button onClick={handleAddCategory} className="flex-1 bg-emerald-600 text-white py-1 rounded-lg text-xs font-bold hover:bg-emerald-700 transition">הוסף</button>
                      <button onClick={() => setIsAddCategoryOpen(false)} className="px-2 py-1 text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"><X size={14}/></button>
                  </div>
              </div>
          );
      }
      return (
          <button 
              onClick={() => setIsAddCategoryOpen(true)}
              className="bg-white border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 p-4 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 transition-all group min-h-[100px]"
          >
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-200 flex items-center justify-center mb-2 transition-colors">
                  <Plus size={20} />
              </div>
              <span className="text-xs font-bold">הוסף קטגוריה</span>
          </button>
      );
  };

  const SummaryCard = () => (
    <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl transition-all mb-6">
        <div className="text-center md:text-right">
            <p className="text-emerald-400 font-black mb-1 text-2xl">
                {mode === 'tracking' ? `תזרים נטו (${monthLabel})` : 'תזרים חודשי נטו'}
            </p>
            <p className="text-sm opacity-60">הכנסות - (הוצאות + חובות)</p>
        </div>
        <div className={`text-4xl font-black ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₪{netFlow.toLocaleString()}
        </div>
    </div>
  );

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

       {/* Income Section */}
       <div className="bg-white border border-slate-100 p-4 md:p-6 rounded-3xl shadow-sm space-y-6">
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

       {/* CONDITIONAL SUMMARY: Show HERE if NOT simple mode (i.e. Detailed/Tracking) - Top Placement */}
       {mode !== 'simple' && <SummaryCard />}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Expenses Configuration */}
            <div className="lg:col-span-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
                        <button 
                            onClick={() => setMode('simple')}
                            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'simple' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            הערכה כללית
                        </button>
                        <button 
                            onClick={() => setMode('detailed')}
                            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'detailed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            תכנון מפורט
                        </button>
                        <button 
                            onClick={() => setMode('tracking')}
                            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'tracking' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Calendar size={14}/>
                            מעקב חודשי
                        </button>
                    </div>

                    {mode === 'tracking' && (
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 animate-fade-in">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"><ChevronRight size={20}/></button>
                            <span className="font-bold text-slate-800 min-w-[120px] text-center">{monthLabel}</span>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600"><ChevronLeft size={20}/></button>
                        </div>
                    )}
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
                        <div className="md:col-span-2 space-y-6 animate-fade-in">
                            {/* Tracking Mode Insights */}
                            {mode === 'tracking' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center text-center gap-1 h-[140px]">
                                        <h4 className="text-emerald-800 font-bold text-xs mb-1">סך הוצאות {monthLabel}</h4>
                                        <div className="text-3xl font-black text-emerald-700">₪{userExpenses.toLocaleString()}</div>
                                    </div>
                                    
                                    {/* Diff Logic */}
                                    {(() => {
                                        const diff = insights?.diffFromPrev || 0;
                                        const absDiff = Math.abs(diff);
                                        const prevTotal = insights?.prevTotal || 0;
                                        
                                        let cardStyle = "bg-white border-slate-100";
                                        let textStyle = "text-slate-800";
                                        let labelStyle = "text-slate-500";
                                        
                                        if (prevTotal === 0) {
                                            return (
                                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center gap-1 h-[140px]">
                                                    <h4 className="text-slate-500 font-bold text-xs mb-1 flex items-center gap-1">
                                                        <Activity size={12}/> מול חודש קודם
                                                    </h4>
                                                    <div className="text-sm font-medium text-slate-400">
                                                        לא מולאו הוצאות בחודש שעבר
                                                    </div>
                                                </div>
                                            );
                                        }

                                        let description = "ללא שינוי מחודש שעבר";
                                        let sign = "";
                                        
                                        if (diff > 0) {
                                            cardStyle = "bg-red-50 border-red-100";
                                            textStyle = "text-red-700";
                                            labelStyle = "text-red-600";
                                            description = "יותר מחודש שעבר";
                                            sign = "+";
                                        } else if (diff < 0) {
                                            cardStyle = "bg-emerald-50 border-emerald-100";
                                            textStyle = "text-emerald-700";
                                            labelStyle = "text-emerald-600";
                                            description = "פחות מחודש שעבר";
                                            sign = "-";
                                        }

                                        return (
                                            <div className={`${cardStyle} p-4 rounded-2xl border shadow-sm flex flex-col justify-center items-center text-center gap-1 h-[140px] transition-colors`}>
                                                <h4 className={`${labelStyle} font-bold text-xs mb-1 flex items-center gap-1`}>
                                                    <Activity size={12}/> מול חודש קודם
                                                </h4>
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-3xl font-black ${textStyle}`} style={{ direction: 'ltr' }}>
                                                        {sign}{absDiff.toLocaleString()} ₪
                                                    </span>
                                                    {diff !== 0 && (
                                                        <span className={`text-xs ${labelStyle} font-bold mt-1`}>
                                                            {absDiff.toLocaleString()} {description}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] ${labelStyle} opacity-80 mt-0.5`}>
                                                        {prevTotal ? `(${Math.round(((userExpenses - prevTotal) / prevTotal) * 100)}%)` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center gap-1 h-[140px]">
                                        <h4 className="text-slate-500 font-bold text-xs mb-1 flex items-center gap-1"><BarChart2 size={12}/> ממוצע היסטורי</h4>
                                        {(insights?.historyLength || 0) >= 3 ? (
                                            <div className="text-3xl font-black text-slate-800">
                                                ₪{Math.round(insights?.overallAverage || 0).toLocaleString()}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 mt-1">
                                                יוצג לאחר 3 חודשי נתונים
                                                <span className="block text-[10px] opacity-70">(כרגע: {insights?.historyLength || 0})</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Detailed/Tracking Grid with Management Mode */}
                            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        {mode === 'tracking' ? <Calendar size={20} className="text-emerald-500"/> : null}
                                        {mode === 'tracking' ? `הזנת הוצאות בפועל - ${monthLabel}` : 'פירוט הוצאות (תקציב מתוכנן)'}
                                    </h3>
                                    <button 
                                        onClick={() => setIsManageMode(!isManageMode)} 
                                        className={`p-2 rounded-xl transition flex items-center gap-2 text-xs font-bold ${isManageMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        <Settings size={14}/>
                                        {isManageMode ? 'סיום עריכה' : 'ניהול קטגוריות'}
                                    </button>
                                </div>

                                {isManageMode ? (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar animate-fade-in">
                                        <p className="text-xs text-slate-500 mb-2">גררו או השתמשו בחצים לשינוי סדר הקטגוריות. לחצו על העין להסתרה.</p>
                                        {activeCategories.map((category, index) => (
                                            <div key={category} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm group hover:border-emerald-200 transition">
                                                <span className="font-bold text-slate-700 text-sm">{category}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleMoveCategory(index, 'up')} disabled={index === 0} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"><ArrowUp size={16}/></button>
                                                    <button onClick={() => handleMoveCategory(index, 'down')} disabled={index === activeCategories.length - 1} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"><ArrowDown size={16}/></button>
                                                    <div className="w-px h-6 bg-slate-100 mx-1"></div>
                                                    <button onClick={() => handleHideCategory(category)} className="p-1.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500"><EyeOff size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                                        {activeCategories.map(category => {
                                            // Render logic differs by mode
                                            if (mode === 'detailed') {
                                                return (
                                                    <div key={category} className="bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-slate-300 focus-within:bg-white transition-colors">
                                                        <label className="block text-xs font-bold text-slate-500 mb-1 truncate" title={category}>{category}</label>
                                                        <NumberInput 
                                                            value={detailedExpenses[category] || ''}
                                                            onChange={(val) => handleDetailedChange(category, val)}
                                                            className="w-full bg-transparent outline-none font-mono font-medium text-slate-800"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                );
                                            } else {
                                                // Tracking Mode Logic
                                                const currentVal = (monthlyExpenses[currentMonth] || {})[category] || 0;
                                                const budgetVal = detailedExpenses[category] || 0;
                                                
                                                // Get stats for this specific category
                                                const catStats = insights?.categoryStats[category];
                                                const avgVal = catStats ? catStats.sum / catStats.count : 0;
                                                const countVal = catStats ? catStats.count : 0;
                                                
                                                // Only show average if THIS category has >= 3 entries
                                                const showAverage = countVal >= 3;
                                                
                                                const hasBudget = budgetVal > 0;
                                                const remaining = budgetVal - currentVal;
                                                const isOverBudget = hasBudget && remaining < 0;
                                                const isNearBudget = hasBudget && !isOverBudget && remaining < (budgetVal * 0.15); 
                                                const isHighVsAvg = showAverage && !hasBudget && avgVal > 0 && currentVal > avgVal * 1.2;
                                                
                                                let cardClass = 'bg-slate-50 border-slate-100 focus-within:border-emerald-300 focus-within:bg-white';
                                                if (isOverBudget) cardClass = 'bg-red-50 border-red-200 focus-within:border-red-300';
                                                else if (isNearBudget) cardClass = 'bg-orange-50 border-orange-200 focus-within:border-orange-300';
                                                else if (isHighVsAvg) cardClass = 'bg-yellow-50 border-yellow-200';

                                                return (
                                                    <div key={category} className={`p-3 rounded-xl border transition-all relative group ${cardClass} min-h-[90px]`}>
                                                        {/* Quick Add Popover */}
                                                        {quickAddCategory === category && (
                                                            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center p-2 animate-fade-in">
                                                                <form onSubmit={handleQuickAdd} className="flex gap-2 w-full">
                                                                    <NumberInput
                                                                        autoFocus
                                                                        value={quickAddValue}
                                                                        onChange={setQuickAddValue}
                                                                        className="w-full p-2 border border-emerald-300 rounded-lg text-lg font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500"
                                                                        placeholder="+"
                                                                    />
                                                                    <button type="submit" className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition"><Check size={20}/></button>
                                                                    <button type="button" onClick={() => setQuickAddCategory(null)} className="bg-slate-200 text-slate-500 p-2 rounded-lg hover:bg-slate-300 transition"><X size={20}/></button>
                                                                </form>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-3">
                                                            {/* Content Side (Right in RTL) */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <label className="block text-xs font-bold text-slate-600 truncate" title={category}>{category}</label>
                                                                    {(isOverBudget || isHighVsAvg) && <AlertTriangle size={12} className={isOverBudget ? "text-red-500" : "text-yellow-500"} title="חריגה"/>}
                                                                </div>
                                                                <NumberInput 
                                                                    value={currentVal || ''}
                                                                    onChange={(val) => handleTrackingChange(category, val)}
                                                                    className="w-full bg-transparent outline-none font-mono font-bold text-slate-800 text-xl"
                                                                    placeholder="0"
                                                                />
                                                                
                                                                {/* Bars */}
                                                                <div className="mt-2 space-y-1">
                                                                    {hasBudget && (
                                                                        <div className="w-full">
                                                                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                                                                                <div className={`h-full transition-all ${isOverBudget ? 'bg-red-500' : isNearBudget ? 'bg-orange-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min((currentVal / budgetVal) * 100, 100)}%` }} />
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-[10px] font-medium">
                                                                                <span className={isOverBudget ? 'text-red-600 font-bold' : isNearBudget ? 'text-orange-600' : 'text-emerald-600'}>{isOverBudget ? `חריגה: ${Math.abs(remaining).toLocaleString()}` : `נותרו: ${remaining.toLocaleString()}`}</span>
                                                                                <span className="text-slate-400">יעד: {budgetVal.toLocaleString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {showAverage && avgVal > 0 && (
                                                                        <div className={`${hasBudget ? 'pt-1 border-t border-slate-100/50' : ''}`}>
                                                                            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mb-1">
                                                                                <div className={`h-full ${isHighVsAvg ? 'bg-yellow-400' : 'bg-blue-300'}`} style={{ width: `${Math.min((currentVal / (avgVal * 1.5)) * 100, 100)}%` }} />
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-400 text-right">ממוצע: {avgVal.toFixed(0)}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Spacer if no bars */}
                                                                {!hasBudget && (!showAverage || avgVal === 0) && <div className="h-4"></div>}
                                                            </div>

                                                            {/* Action Side (Left in RTL) - Large Button */}
                                                            <button 
                                                                onClick={() => { setQuickAddCategory(category); setQuickAddValue(''); }}
                                                                className="shrink-0 w-12 h-12 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl flex items-center justify-center text-slate-300 transition-all shadow-sm active:scale-95"
                                                                title="הוסף סכום"
                                                            >
                                                                <Plus size={24} strokeWidth={3}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })}
                                        {renderAddCategoryCard()}
                                    </div>
                                )}
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

                {/* CONDITIONAL SUMMARY: Show HERE only if Simple Mode (Bottom Placement) */}
                {mode === 'simple' && <div className="mt-6"><SummaryCard /></div>}

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
                    href="https://www.shirfinance.com/%D7%9E%D7%90%D7%9E%D7%A8%D7%99%D7%9D/%D7%A4%D7%A0%D7%A1%D7%99%D7%94-%D7%93%D7%91%D7%A8%D7%99%D7%9D-%D7%A9%D7%9B%D7%93%D7%90%D7%99-%D7%9C%D7%93%D7%A2%D7%AA" 
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
