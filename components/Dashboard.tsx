
import React, { useState, useMemo } from 'react';
import { FinancialState, TabId, PensionItem, InvestmentItem, AccountItem, RealEstateItem, LoanItem, IncomeItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, ShieldCheck, Landmark, User, BookOpen, ChevronRight, ArrowRightLeft, Building2, Calculator, CreditCard, ArrowLeftRight, Table, X } from 'lucide-react';

interface DashboardProps {
  data: FinancialState;
  onNavigate: (view: TabId, params?: any) => void;
}

const COLORS = ['#10B981', '#3B82F6', '#06B6D4', '#F59E0B', '#8B5CF6', '#6366F1'];

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  const [showHistoryTable, setShowHistoryTable] = useState(false);

  // --- Calculations ---
  const checkingTotal = data.accounts.filter(a => a.type !== 'emergency').reduce((sum, item) => sum + item.value, 0);
  const emergencyTotal = data.accounts.filter(a => a.type === 'emergency').reduce((sum, item) => sum + item.value, 0);
  
  const pensionTotal = data.pensions.filter(p => p.type === 'pension' || p.type === 'provident_fund').reduce((sum, item) => sum + item.value, 0);
  const studyFundTotal = data.pensions.filter(p => p.type === 'study_fund').reduce((sum, item) => sum + item.value, 0);
  const investmentsTotal = data.investments.reduce((sum, item) => sum + item.value, 0); 
  const realEstateTotal = data.realEstate.reduce((sum, item) => sum + item.value, 0);
  
  const totalMortgage = data.realEstate.reduce((acc, item) => {
      if (item.mortgageTracks && item.mortgageTracks.length > 0) {
          return acc + item.mortgageTracks.reduce((t, track) => t + track.balance, 0);
      }
      return acc + (item.mortgageBalance || 0);
  }, 0);

  const totalLoans = data.loans.reduce((sum, item) => sum + item.value, 0);

  const totalAssets = checkingTotal + emergencyTotal + pensionTotal + studyFundTotal + investmentsTotal + realEstateTotal;
  const netWorth = totalAssets - totalMortgage - totalLoans;

  // Cash Flow
  // Added explicit types to reduce function parameters to fix 'unknown' inference error
  const monthlyIncome = (data.cashFlow?.monthlyIncome || 0) + (data.cashFlow?.additionalIncomes?.reduce((s: number, i: IncomeItem) => s + i.amount, 0) || 0);
  
  const rawRealEstateIncome = data.realEstate.reduce((sum, r) => sum + (r.monthlyRent || 0), 0);
  const includedRealEstateIncome = data.cashFlow?.includeRealEstateRent 
      ? rawRealEstateIncome * ((data.cashFlow.realEstateRentInclusionPercentage || 100) / 100)
      : 0;

  const totalIncome = monthlyIncome + includedRealEstateIncome;
  
  const totalLoanPayments = data.loans.reduce((sum, l) => sum + l.monthlyPayment, 0);
  const totalMortgagePayments = data.realEstate.reduce((sum, r) => {
      if (r.mortgageTracks && r.mortgageTracks.length > 0) {
          return sum + r.mortgageTracks.reduce((t, track) => t + track.monthlyPayment, 0);
      }
      return sum; 
  }, 0);
  const totalDebtService = totalLoanPayments + totalMortgagePayments;

  let totalExpenses = 0;
  if (data.cashFlow?.expensesMode === 'simple') {
      totalExpenses = data.cashFlow.generalExpense;
  } else {
      // Explicitly typed reduction to avoid 'unknown' type errors from Object.values
      // Fixed: Cast the result of Object.values to number[] as detailedExpenses is Record<string, number>
      totalExpenses = (Object.values(data.cashFlow?.detailedExpenses || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
  }
  
  const totalExpensesWithDebt = totalExpenses + totalDebtService;
  const monthlyNet = totalIncome - totalExpensesWithDebt;

  // History Data logic
  const historyData = useMemo(() => {
    const allItems = [...data.accounts, ...data.pensions, ...data.investments, ...data.realEstate, ...data.loans];
    const dateSet = new Set<string>();
    allItems.forEach(item => {
        if(item.history) item.history.forEach(h => dateSet.add(h.date));
        if(item.lastUpdated) dateSet.add(item.lastUpdated.split('T')[0]);
    });
    const sortedDates = Array.from(dateSet).sort();

    if (sortedDates.length === 0) {
        return [{ date: new Date().toISOString().split('T')[0], value: netWorth }];
    }

    return sortedDates.map(date => {
        let totalAtDate = 0;
        let liabilityAtDate = 0;
        
        [...data.accounts, ...data.pensions, ...data.investments, ...data.realEstate].forEach(item => {
            const relevantEntry = item.history 
                ? [...item.history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).find(h => h.date <= date)
                : null;
            if (relevantEntry) totalAtDate += relevantEntry.value;
            else if (!item.history || item.history.length === 0) totalAtDate += item.value;
        });

        data.loans.forEach(item => {
             const relevantEntry = item.history 
                ? [...item.history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).find(h => h.date <= date)
                : null;
             if (relevantEntry) liabilityAtDate += relevantEntry.value;
             else liabilityAtDate += item.value;
        });

        liabilityAtDate += totalMortgage; 

        return { date, value: totalAtDate - liabilityAtDate };
    });
  }, [data, netWorth, totalMortgage]);

  const chartData = [
    { name: 'עו"ש', value: checkingTotal, color: '#10B981' }, 
    { name: 'ביטחון', value: emergencyTotal, color: '#3B82F6' },
    { name: 'פנסיה וגמל', value: pensionTotal, color: '#06B6D4' },
    { name: 'השתלמות', value: studyFundTotal, color: '#F59E0B' },
    { name: 'השקעות', value: investmentsTotal, color: '#8B5CF6' },
    { name: 'נדל"ן', value: realEstateTotal, color: '#6366f1' },
  ].filter(d => d.value > 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in">
      
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">שלום, שיר</h2>
            <p className="text-slate-500">הנה תמונת המצב הפיננסית שלך להיום</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
             <button onClick={() => onNavigate('future_projection')} className="flex items-center gap-2 bg-emerald-600 text-white border border-emerald-600 px-5 py-2.5 rounded-full hover:bg-emerald-700 transition text-sm font-bold shadow-md shadow-emerald-200">
                 <TrendingUp size={18} />
                 <span>תחזית לעתיד</span>
             </button>
             
             <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
             
             <button onClick={() => onNavigate('switching_calc')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition text-sm font-bold shadow-sm">
                 <ArrowLeftRight size={16} />
                 <span>בדיקת כדאיות מעבר</span>
             </button>
             <button onClick={() => onNavigate('pension_calc')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition text-sm font-bold shadow-sm">
                 <Calculator size={16} />
                 <span>מחשבון פרישה</span>
             </button>
             <button onClick={() => onNavigate('feecalc')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition text-sm font-bold shadow-sm">
                 <Calculator size={16} />
                 <span>מחשבון דמי ניהול</span>
             </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
           <div className="mb-4">
               <h2 className="text-lg font-bold text-slate-700 mb-1">שווי נקי</h2>
               <div className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(netWorth)}</div>
               <div className="text-sm text-slate-400 font-medium">נכסים פחות התחייבויות</div>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center">
               <div className="w-full h-[220px]">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        cornerRadius={5}
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                </ResponsiveContainer>
               </div>

               {/* Custom Legend */}
               <div className="w-full space-y-3 mt-4">
                   {chartData.map((item, idx) => (
                       <div key={idx} className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                               <span className="text-slate-600 font-medium">{item.name}</span>
                           </div>
                           <div className="flex items-center gap-3">
                               <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                               <span className="text-xs text-slate-400 w-8 text-left">{((item.value / totalAssets) * 100).toFixed(0)}%</span>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
        </div>

        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-lg font-bold text-slate-700">התקדמות כלכלית</h2>
                <button 
                    onClick={() => setShowHistoryTable(true)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition"
                >
                    <Table size={16} />
                    <span>בדיקת מעקב</span>
                </button>
            </div>
            
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ left: 20, right: 20 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(d) => { const date = new Date(d); return `${date.getDate()}/${date.getMonth()+1}`; }} tick={{fontSize: 12}} />
                        <YAxis 
                            stroke="#94a3b8" 
                            tickFormatter={(val) => `₪${(val/1000).toFixed(0)}k`} 
                            tick={{fontSize: 12}} 
                            width={90}
                            tickMargin={20}
                        />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(val: number) => formatCurrency(val)} />
                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* GRID LAYOUT */}
      <h2 className="text-xl font-bold text-slate-800 mt-4">התיק שלי</h2>
      
      {/* Row 1: CashFlow, Checking, Emergency */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
         <DashboardCard 
            title='תזרים' 
            subtitle={monthlyNet >= 0 ? 'חיובי' : 'שלילי'}
            value={monthlyNet}
            icon={<ArrowRightLeft size={24} className="text-rose-500" />}
            colorClass="border-rose-100"
            onClick={() => onNavigate('cashflow')}
            footer={<span className="text-xs text-slate-400">הכנסות: {formatCurrency(totalIncome)} | הוצאות: {formatCurrency(totalExpensesWithDebt)}</span>}
        />
        <DashboardCard 
            title='עו"ש' 
            subtitle="נזילות מיידית"
            value={checkingTotal}
            icon={<Landmark size={24} className="text-emerald-500" />}
            colorClass="border-emerald-100"
            onClick={() => onNavigate('accounts')}
        />
        <DashboardCard 
            title='קרן ביטחון' 
            subtitle="למקרי חירום"
            value={emergencyTotal}
            icon={<ShieldCheck size={24} className="text-blue-500" />}
            colorClass="border-blue-100"
            onClick={() => onNavigate('accounts')}
        />
      </div>

      {/* Row 2: Pension, Study, Investments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
         <DetailedCard 
            title='פנסיה וגמל'
            icon={<User size={24} className="text-cyan-500" />}
            colorClass="border-cyan-100"
            total={pensionTotal}
            items={data.pensions.filter(p => p.type === 'pension' || p.type === 'provident_fund')}
            onClick={() => onNavigate('pension', { type: 'pension' })}
         />
         <DetailedCard 
            title='קרן השתלמות'
            icon={<BookOpen size={24} className="text-amber-500" />}
            colorClass="border-amber-100"
            total={studyFundTotal}
            items={data.pensions.filter(p => p.type === 'study_fund')}
            onClick={() => onNavigate('pension', { type: 'study_fund' })}
         />
         <DetailedCard 
            title='תיק השקעות'
            icon={<TrendingUp size={24} className="text-purple-500" />}
            colorClass="border-purple-100"
            total={investmentsTotal}
            items={data.investments}
            onClick={() => onNavigate('investments')}
         />
      </div>

      {/* Row 3: Real Estate & Loans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DashboardCard 
            title='נדל"ן' 
            subtitle="שווי שוק"
            value={realEstateTotal}
            icon={<Building2 size={24} className="text-indigo-500" />}
            colorClass="border-indigo-100"
            onClick={() => onNavigate('realestate')}
            footer={<span className="text-xs text-slate-400">משכנתא: {formatCurrency(totalMortgage)} | הון עצמי: {formatCurrency(realEstateTotal - totalMortgage)}</span>}
        />
        <DashboardCard 
            title='הלוואות' 
            subtitle="התחייבויות שוטפות"
            value={totalLoans}
            icon={<CreditCard size={24} className="text-rose-500" />}
            colorClass="border-rose-100"
            onClick={() => onNavigate('loans')}
            footer={<span className="text-xs text-slate-400">החזר חודשי כולל: {formatCurrency(totalLoanPayments)}</span>}
        />
      </div>

      {showHistoryTable && (
          <HistoryTableModal 
            data={data} 
            onClose={() => setShowHistoryTable(false)} 
            formatCurrency={formatCurrency}
          />
      )}
    </div>
  );
};

// History Table Component
const HistoryTableModal: React.FC<{ 
    data: FinancialState; 
    onClose: () => void;
    formatCurrency: (val: number) => string;
}> = ({ data, onClose, formatCurrency }) => {
    
    // 1. Collect all assets with Type Label
    const getAssetLabel = (item: any, category: string) => {
        if (category === 'pensions') {
            if (item.type === 'pension') return 'פנסיה';
            if (item.type === 'study_fund') return 'השתלמות';
            return 'גמל';
        }
        if (category === 'accounts') {
            if (item.type === 'checking') return 'עו"ש';
            if (item.type === 'emergency') return 'ביטחון';
            return 'חיסכון';
        }
        if (category === 'investments') return 'השקעות';
        if (category === 'realEstate') return 'נדל"ן';
        return 'נכס';
    };

    const allAssets = [
        ...data.accounts.map(i => ({...i, label: getAssetLabel(i, 'accounts')})),
        ...data.pensions.map(i => ({...i, label: getAssetLabel(i, 'pensions')})),
        ...data.investments.map(i => ({...i, label: getAssetLabel(i, 'investments')})),
        ...data.realEstate.map(i => ({...i, label: getAssetLabel(i, 'realEstate')}))
    ];

    // 2. Collect all unique dates from all history
    const allDates = new Set<string>();
    allAssets.forEach(asset => {
        if (asset.history) {
            asset.history.forEach(h => allDates.add(h.date));
        }
        // Also add current update date if exists
        if (asset.lastUpdated) {
            allDates.add(asset.lastUpdated.split('T')[0]);
        }
    });
    // Ensure today is there if we have assets but no history yet
    if (allDates.size === 0 && allAssets.length > 0) {
        allDates.add(new Date().toISOString().split('T')[0]);
    }

    const sortedDates = Array.from(allDates).sort().reverse(); // Newest first

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-hidden">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Table className="text-slate-500" />
                            טבלת מעקב שווי
                        </h2>
                        <p className="text-slate-500 text-xs">פירוט היסטורי של כלל הנכסים</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto custom-scrollbar p-4">
                    <table className="w-full text-sm text-right border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm text-slate-500">
                            <tr>
                                <th className="p-3 border-b border-slate-200 font-bold whitespace-nowrap min-w-[100px]">תאריך</th>
                                <th className="p-3 border-b border-slate-200 font-black text-slate-800 whitespace-nowrap min-w-[120px]">סה"כ שווי</th>
                                <th className="p-3 border-b border-slate-200 font-bold text-slate-500 whitespace-nowrap min-w-[100px]">שינוי מעדכון קודם</th>
                                {allAssets.map(asset => (
                                    <th key={asset.id} className="p-3 border-b border-slate-200 font-medium whitespace-nowrap min-w-[140px]" title={asset.name}>
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[140px] font-bold text-slate-700">{asset.name}</span>
                                            <span className="text-[10px] text-slate-400 font-normal">{asset.label}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedDates.map((date, index) => {
                                let totalForDate = 0;
                                let totalForPrevDate = 0;
                                const prevDate = sortedDates[index + 1];

                                // Calculate total logic: Sum of specific history OR carry forward last known value
                                allAssets.forEach(asset => {
                                    // Try to find exact match
                                    const exactEntry = asset.history?.find(h => h.date === date);
                                    if (exactEntry) {
                                        totalForDate += exactEntry.value;
                                    } else {
                                        // Find most recent entry BEFORE this date
                                        const pastEntries = asset.history?.filter(h => h.date < date).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                        if (pastEntries && pastEntries.length > 0) {
                                            totalForDate += pastEntries[0].value;
                                        }
                                    }

                                    if(prevDate) {
                                        const prevEntry = asset.history?.find(h => h.date === prevDate);
                                        if (prevEntry) {
                                            totalForPrevDate += prevEntry.value;
                                        } else {
                                            const prevPastEntries = asset.history?.filter(h => h.date < prevDate).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                            if (prevPastEntries && prevPastEntries.length > 0) {
                                                totalForPrevDate += prevPastEntries[0].value;
                                            }
                                        }
                                    }
                                });

                                const totalChange = prevDate ? totalForDate - totalForPrevDate : 0;

                                return (
                                    <tr key={date} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-mono text-slate-500">{new Date(date).toLocaleDateString('he-IL')}</td>
                                        <td className="p-3 font-mono font-black text-slate-800 bg-slate-50/50">{formatCurrency(totalForDate)}</td>
                                        <td className={`p-3 font-mono font-bold ${totalChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {prevDate ? (totalChange > 0 ? `+${formatCurrency(totalChange)}` : formatCurrency(totalChange)) : '-'}
                                        </td>
                                        {allAssets.map(asset => {
                                            const entry = asset.history?.find(h => h.date === date);
                                            return (
                                                <td key={asset.id} className="p-3 font-mono text-slate-600 border-r border-slate-50">
                                                    {entry ? formatCurrency(entry.value) : ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Simple Card
const DashboardCard: React.FC<{
    title: string;
    subtitle: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
    onClick: () => void;
    footer?: React.ReactNode;
}> = ({ title, subtitle, value, icon, onClick, colorClass, footer }) => {
    return (
        <button onClick={onClick} className={`bg-white rounded-2xl p-6 border ${colorClass} shadow-sm transition-all duration-300 flex flex-col items-start group relative hover:shadow-md hover:-translate-y-1 h-full w-full`}>
            <div className="w-full flex justify-between items-start mb-4">
                <div className="flex gap-4 items-center">
                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">{icon}</div>
                    <div className="text-right">
                        <h3 className="font-bold text-slate-700 text-lg group-hover:text-slate-900">{title}</h3>
                        <p className="text-xs text-slate-400">{subtitle}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-slate-400" size={20} />
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight group-hover:scale-105 origin-right transition-transform mb-2">
                {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(value)}
            </div>
            {footer && <div className="mt-auto pt-2 border-t border-slate-50 w-full text-right">{footer}</div>}
        </button>
    );
}

// Detailed Card
const DetailedCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    colorClass: string;
    total: number;
    items: (PensionItem | InvestmentItem)[];
    onClick: () => void;
}> = ({ title, icon, colorClass, total, items, onClick }) => {
    const topItems = [...items].sort((a,b) => b.value - a.value).slice(0, 2);

    return (
        <button onClick={onClick} className={`bg-white rounded-2xl p-6 border ${colorClass} shadow-sm transition-all duration-300 flex flex-col items-start group relative hover:shadow-md hover:-translate-y-1 h-full w-full`}>
             <div className="w-full flex justify-between items-start mb-2">
                <div className="flex gap-4 items-center">
                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">{icon}</div>
                    <div className="text-right">
                        <h3 className="font-bold text-slate-700 text-lg group-hover:text-slate-900">{title}</h3>
                    </div>
                </div>
                <div className="text-xl font-black text-slate-800">{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(total)}</div>
            </div>

            <div className="w-full mt-4 space-y-3">
                {topItems.length > 0 ? topItems.map(item => (
                    <div key={item.id} className="bg-slate-50/50 p-2 rounded-lg text-right w-full text-sm">
                        <div className="flex justify-between font-bold text-slate-700">
                            <span>{item.name}</span>
                            <span>₪{Number(item.value / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                             {'track' in item && item.track && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-100">{item.track}</span>}
                             {'managementFeeAccumulation' in item && item.managementFeeAccumulation !== undefined && (
                                 <div className="flex items-center gap-2">
                                     <span className="flex items-center gap-0.5">
                                        דמי ניהול: {item.managementFeeAccumulation}%
                                        {item.type === 'pension' && ` / ${'managementFeeDeposit' in item ? item.managementFeeDeposit : 0}%`}
                                     </span>
                                 </div>
                             )}
                        </div>
                    </div>
                )) : <div className="text-xs text-slate-400 p-2">אין נכסים להצגה</div>}
                
                {items.length > 2 && <div className="text-xs text-slate-400 w-full text-center">+ עוד {items.length - 2} מוצרים</div>}
            </div>
        </button>
    );
}

export default Dashboard;
