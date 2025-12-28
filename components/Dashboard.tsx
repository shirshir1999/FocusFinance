
import React, { useState, useEffect, useMemo } from 'react';
import { FinancialState, TabId, UserProfile, IncomeItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, ShieldCheck, Landmark, User, BookOpen, ChevronRight, ArrowRightLeft, Building2, Calculator, CreditCard, Table, Users, Edit2, Target, Move, X, Save, Plus, Clock, Pin } from 'lucide-react';

interface DashboardProps {
  data: FinancialState;
  onNavigate: (view: TabId, params?: any) => void;
  userName?: string;
  onEditName: () => void;
  activeProfileId: string;
  profiles: UserProfile[];
  onUpdateLayout?: (layout: string[], hidden: string[]) => void;
}

const COLORS = ['#10B981', '#3B82F6', '#06B6D4', '#F59E0B', '#8B5CF6', '#6366F1'];

// Widget Definitions for mapping
const WIDGETS: Record<string, { title: string, icon: any }> = {
    'goals': { title: 'מטרות', icon: Target },
    'cashflow': { title: 'תזרים', icon: ArrowRightLeft },
    'accounts': { title: 'עו"ש', icon: Landmark },
    'emergency': { title: 'ביטחון', icon: ShieldCheck },
    'pension': { title: 'פנסיה וגמל', icon: User },
    'study_fund': { title: 'קרן השתלמות', icon: BookOpen },
    'investments': { title: 'תיק השקעות', icon: TrendingUp },
    'realestate': { title: 'נדל"ן', icon: Building2 },
    'loans': { title: 'הלוואות', icon: CreditCard },
};

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate, userName, onEditName, activeProfileId, profiles, onUpdateLayout }) => {
  
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<string[]>([]);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Sync with prop data on load
  useEffect(() => {
      if (data.dashboardLayout && data.dashboardLayout.length > 0) {
          setLayout(data.dashboardLayout);
      } else {
          // Fallback default
          setLayout(['goals', 'cashflow', 'accounts', 'emergency', 'pension', 'study_fund', 'investments', 'realestate', 'loans']);
      }
      setHiddenWidgets(data.hiddenWidgets || []);
  }, [data.dashboardLayout, data.hiddenWidgets]);

  const saveLayout = () => {
      setIsEditing(false);
      if (onUpdateLayout) {
          onUpdateLayout(layout, hiddenWidgets);
      }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedItem(id);
      // Create a ghost image if needed, or rely on browser default
      if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', id); // For Firefox
      }
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
      e.preventDefault(); // Necessary to allow dropping
      if (!draggedItem || draggedItem === targetId) return;

      const newLayout = [...layout];
      const draggedIdx = newLayout.indexOf(draggedItem);
      const targetIdx = newLayout.indexOf(targetId);

      if (draggedIdx > -1 && targetIdx > -1) {
          // Swap logic for real-time preview
          newLayout.splice(draggedIdx, 1);
          newLayout.splice(targetIdx, 0, draggedItem);
          setLayout(newLayout);
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDraggedItem(null);
  };

  const toggleWidgetVisibility = (id: string) => {
      if (hiddenWidgets.includes(id)) {
          // Restore
          setHiddenWidgets(prev => prev.filter(w => w !== id));
          setLayout(prev => [...prev, id]);
      } else {
          // Hide
          setLayout(prev => prev.filter(w => w !== id));
          setHiddenWidgets(prev => [...prev, id]);
      }
  };

  const getProfile = (id?: string) => profiles.find(p => p.id === id);

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
      totalExpenses = (Object.values(data.cashFlow?.detailedExpenses || {}) as number[]).reduce((a: number, b: number) => a + b, 0);
  }
  
  const totalExpensesWithDebt = totalExpenses + totalDebtService;
  const monthlyNet = totalIncome - totalExpensesWithDebt;

  // Goals Calculation Logic
  const activeGoals = data.goals || [];
  
  // Sort Logic: Pinned First, then rest.
  const topGoals = [...activeGoals]
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
        .slice(0, 2); // Limit to 2 goals

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

  // Widget Renderer
  const renderWidget = (id: string) => {
      const editOverlay = isEditing ? (
          <div className="absolute inset-0 z-20 bg-slate-50/50 backdrop-blur-[1px] border-2 border-dashed border-blue-300 rounded-2xl flex items-center justify-center cursor-move group">
              <div className="bg-white p-2 rounded-full shadow-sm text-blue-500"><Move size={24}/></div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleWidgetVisibility(id); }}
                className="absolute top-2 left-2 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition"
              >
                  <X size={16}/>
              </button>
          </div>
      ) : null;

      const wrapperClass = "h-full relative overflow-hidden rounded-2xl transition-all duration-200";

      switch (id) {
          case 'goals': return (
            <div className={wrapperClass}>
                {editOverlay}
                <button 
                    onClick={() => !isEditing && onNavigate('goals')}
                    className="bg-white rounded-2xl p-6 border border-teal-100 shadow-sm transition-all duration-300 flex flex-col group relative hover:shadow-md hover:-translate-y-1 h-full w-full text-right"
                >
                    <div className="w-full flex justify-between items-start mb-4">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all"><Target size={24} className="text-teal-500"/></div>
                            <h3 className="font-bold text-slate-700 text-lg group-hover:text-slate-900">מטרות</h3>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-slate-400" size={20} />
                    </div>

                    <div className="w-full flex-1 space-y-4">
                        {topGoals.length === 0 ? (
                            <div className="text-xs text-slate-400 p-2 text-center h-full flex items-center justify-center">לא הוגדרו מטרות</div>
                        ) : (
                            topGoals.map(goal => {
                                let currentVal = goal.value;
                                if (goal.isLinked && goal.linkedAssetId) {
                                    const allAssets = [...data.accounts, ...data.pensions, ...data.investments];
                                    const asset = allAssets.find(a => a.id === goal.linkedAssetId);
                                    if (asset) currentVal = asset.value;
                                }
                                const percent = goal.targetAmount > 0 ? (currentVal / goal.targetAmount) * 100 : 0;
                                const displayPercent = Math.min(100, percent);
                                
                                let timeLeftString = '';
                                if (goal.targetDate && percent < 100) {
                                    const today = new Date();
                                    const target = new Date(goal.targetDate);
                                    const diffTime = target.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    if (diffDays < 0) timeLeftString = 'עבר הזמן';
                                    else if (diffDays < 30) timeLeftString = `${diffDays} ימים`;
                                    else {
                                        const months = Math.floor(diffDays / 30);
                                        timeLeftString = `עוד ${months} חודשים`;
                                    }
                                }

                                return (
                                    <div key={goal.id} className="w-full">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-bold text-slate-700 truncate max-w-[120px] flex items-center gap-1" title={goal.name}>
                                                {goal.name}
                                                {goal.isPinned && <Pin size={10} className="text-orange-400 fill-orange-400" />}
                                            </span>
                                            <div className="text-xs">
                                                <span className="font-black text-slate-800">{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', notation: 'compact', maximumFractionDigits: 1 }).format(currentVal)}</span>
                                                <span className="text-slate-400 mx-1">/</span>
                                                <span className="text-slate-500">{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', notation: 'compact', maximumFractionDigits: 1 }).format(goal.targetAmount)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${displayPercent}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-teal-600 font-bold">{percent.toFixed(0)}%</span>
                                            {timeLeftString && <span className="text-slate-400 flex items-center gap-1"><Clock size={10}/> {timeLeftString}</span>}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {activeGoals.length > 2 && <div className="text-xs text-slate-400 text-center mt-2">+ עוד {activeGoals.length - 2} מטרות</div>}
                    </div>
                </button>
            </div>
          );
          case 'cashflow': return (
            <div className={wrapperClass}>
                {editOverlay}
                <DashboardCard 
                    title='תזרים' 
                    subtitle={monthlyNet >= 0 ? 'חיובי' : 'שלילי'}
                    value={monthlyNet}
                    icon={<ArrowRightLeft size={24} className="text-rose-500" />}
                    colorClass="border-rose-100"
                    onClick={() => !isEditing && onNavigate('cashflow')}
                    footer={<span className="text-xs text-slate-400">הכנסות: {formatCurrency(totalIncome)} | הוצאות: {formatCurrency(totalExpensesWithDebt)}</span>}
                />
            </div>
          );
          case 'accounts': return (
            <div className={wrapperClass}>
                {editOverlay}
                <DashboardCard 
                    title='עו"ש' 
                    subtitle="נזילות מיידית"
                    value={checkingTotal}
                    icon={<Landmark size={24} className="text-emerald-500" />}
                    colorClass="border-emerald-100"
                    onClick={() => !isEditing && onNavigate('accounts')}
                />
            </div>
          );
          case 'emergency': return (
            <div className={wrapperClass}>
                {editOverlay}
                <DashboardCard 
                    title='קרן ביטחון' 
                    subtitle="למקרי חירום"
                    value={emergencyTotal}
                    icon={<ShieldCheck size={24} className="text-blue-500" />}
                    colorClass="border-blue-100"
                    onClick={() => !isEditing && onNavigate('accounts')}
                />
            </div>
          );
          case 'pension': return (
            <div className={wrapperClass}>
                {editOverlay}
                <DetailedCard 
                    title='פנסיה וגמל'
                    icon={<User size={24} className="text-cyan-500" />}
                    colorClass="border-cyan-100"
                    total={pensionTotal}
                    items={data.pensions.filter(p => p.type === 'pension' || p.type === 'provident_fund')}
                    onClick={() => !isEditing && onNavigate('pension', { type: 'pension' })}
                    activeProfileId={activeProfileId}
                    getProfile={getProfile}
                />
            </div>
          );
          case 'study_fund': return (
            <div className={wrapperClass}>
                {editOverlay}
                <DetailedCard 
                    title='קרן השתלמות'
                    icon={<BookOpen size={24} className="text-amber-500" />}
                    colorClass="border-amber-100"
                    total={studyFundTotal}
                    items={data.pensions.filter(p => p.type === 'study_fund')}
                    onClick={() => !isEditing && onNavigate('pension', { type: 'study_fund' })}
                    activeProfileId={activeProfileId}
                    getProfile={getProfile}
                />
            </div>
          );
          case 'investments': return (
            <div className={wrapperClass}>
                {editOverlay}
                <DetailedCard 
                    title='תיק השקעות'
                    icon={<TrendingUp size={24} className="text-purple-500" />}
                    colorClass="border-purple-100"
                    total={investmentsTotal}
                    items={data.investments}
                    onClick={() => !isEditing && onNavigate('investments')}
                    activeProfileId={activeProfileId}
                    getProfile={getProfile}
                />
            </div>
          );
          case 'realestate': return (
            <div className={wrapperClass}>
                {editOverlay}
                <DashboardCard 
                    title='נדל"ן' 
                    subtitle="שווי שוק"
                    value={realEstateTotal}
                    icon={<Building2 size={24} className="text-indigo-500" />}
                    colorClass="border-indigo-100"
                    onClick={() => !isEditing && onNavigate('realestate')}
                    footer={<span className="text-xs text-slate-400">משכנתא: {formatCurrency(totalMortgage)} | הון עצמי: {formatCurrency(realEstateTotal - totalMortgage)}</span>}
                />
            </div>
          );
          case 'loans': return (
            <div className={wrapperClass}>
                {editOverlay}
                <DashboardCard 
                    title='הלוואות' 
                    subtitle="התחייבויות שוטפות"
                    value={totalLoans}
                    icon={<CreditCard size={24} className="text-rose-500" />}
                    colorClass="border-rose-100"
                    onClick={() => !isEditing && onNavigate('loans')}
                    footer={<span className="text-xs text-slate-400">החזר חודשי כולל: {formatCurrency(totalLoanPayments)}</span>}
                />
            </div>
          );
          default: return null;
      }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-fade-in pb-20">
      
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 group cursor-pointer w-fit" onClick={onEditName} title="לחץ לעריכת שם">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    שלום, {userName || 'אורח'}
                </h2>
                <div className="bg-slate-100 p-1.5 rounded-full text-slate-400 opacity-50 group-hover:opacity-100 transition-all hover:bg-emerald-50 hover:text-emerald-600">
                    <Edit2 size={16}/>
                </div>
            </div>
            <p className="text-slate-500 mt-1">הנה תמונת המצב הפיננסית שלך להיום</p>
          </div>
          <div id="tour-quick-actions" className="flex flex-wrap gap-3 items-center">
             <button onClick={() => onNavigate('future_projection')} className="flex items-center gap-2 bg-emerald-600 text-white border border-emerald-600 px-5 py-2.5 rounded-full hover:bg-emerald-700 transition text-sm font-bold shadow-md shadow-emerald-200">
                 <TrendingUp size={18} />
                 <span>תחזית לעתיד</span>
             </button>
             
             <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
             
             <button onClick={() => onNavigate('switching_calc')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition text-sm font-bold shadow-sm">
                 <ArrowRightLeft size={16} />
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

      <div id="tour-stats-area" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col relative">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-lg font-bold text-slate-700">התקדמות כלכלית</h2>
                <button 
                    id="tour-history-btn"
                    onClick={() => onNavigate('history_view')}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition"
                >
                    <Table size={16} />
                    <span>בדיקת מעקב</span>
                </button>
            </div>
            
            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(d) => { const date = new Date(d); return `${date.getDate()}/${date.getMonth()+1}`; }} tick={{fontSize: 12}} tickMargin={10} />
                        <YAxis 
                            stroke="#94a3b8" 
                            tickFormatter={(val) => `₪${(val/1000).toFixed(0)}k`} 
                            tick={{fontSize: 11}} 
                            width={55}
                            tickMargin={4}
                            orientation="left"
                        />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(val: number) => formatCurrency(val)} />
                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div id="tour-asset-grid">
        <div className="flex items-center justify-between mt-8 mb-5">
            <h2 className="text-xl font-bold text-slate-800">התיק שלי</h2>
            
            {/* Edit Mode Toggle */}
            <button 
                onClick={() => isEditing ? saveLayout() : setIsEditing(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition ${isEditing ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
                {isEditing ? (
                    <>
                        <Save size={16} />
                        שמור סידור
                    </>
                ) : (
                    <>
                        <Move size={16} />
                        סידור דאשבורד
                    </>
                )}
            </button>
        </div>
        
        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {layout.map(id => (
                <div 
                    key={id}
                    draggable={isEditing}
                    onDragStart={(e) => handleDragStart(e, id)}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDrop={handleDrop}
                    className="h-full"
                >
                    {renderWidget(id)}
                </div>
            ))}
        </div>

        {/* Hidden Widgets Area (Only in Edit Mode) */}
        {isEditing && hiddenWidgets.length > 0 && (
            <div className="mt-8 p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl animate-fade-in">
                <h3 className="font-bold text-slate-500 mb-4 flex items-center gap-2 text-sm">
                    <Plus size={16}/> הוסף רכיבים מוסתרים לדאשבורד
                </h3>
                <div className="flex flex-wrap gap-4">
                    {hiddenWidgets.map(id => {
                        const widget = WIDGETS[id];
                        const Icon = widget?.icon || Plus;
                        return (
                            <button 
                                key={id}
                                onClick={() => toggleWidgetVisibility(id)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-300 hover:text-emerald-600 transition"
                            >
                                <Icon size={16} />
                                <span className="font-bold text-sm">{widget?.title || id}</span>
                                <Plus size={14} className="bg-emerald-100 text-emerald-600 rounded-full p-0.5 ml-2"/>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

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
        <button onClick={onClick} className={`bg-white rounded-2xl p-6 border ${colorClass} shadow-sm transition-all duration-300 flex flex-col items-start group relative hover:shadow-md hover:-translate-y-1 h-full w-full text-right`}>
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

const DetailedCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    colorClass: string;
    total: number;
    items: any[];
    onClick: () => void;
    activeProfileId: string;
    getProfile: (id?: string) => UserProfile | undefined;
}> = ({ title, icon, colorClass, total, items, onClick, activeProfileId, getProfile }) => {
    const topItems = [...items].sort((a,b) => b.value - a.value).slice(0, 2);

    return (
        <button onClick={onClick} className={`bg-white rounded-2xl p-6 border ${colorClass} shadow-sm transition-all duration-300 flex flex-col items-start group relative hover:shadow-md hover:-translate-y-1 h-full w-full text-right`}>
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
                {topItems.length > 0 ? topItems.map(item => {
                    const owner = getProfile(item.ownerId);
                    
                    return (
                    <div key={item.id} className="bg-slate-50/50 p-2 rounded-lg text-right w-full text-sm">
                        <div className="flex justify-between items-start font-bold text-slate-700">
                            <span className="truncate max-w-[60%]">{item.name}</span>
                            <span>₪{Number(item.value / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                             {activeProfileId === 'all' && (
                                <span 
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1`}
                                    style={{ backgroundColor: item.isShared ? '#64748b' : (owner?.color || '#94a3b8') }}
                                >
                                    {item.isShared ? <Users size={8}/> : <User size={8}/>}
                                    {item.isShared ? 'משותף' : (owner?.name || '')}
                                </span>
                             )}

                             {'track' in item && item.track && <span className="bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate max-w-[100px]">{item.track}</span>}
                             
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
                )}) : <div className="text-xs text-slate-400 p-2">אין נכסים להצגה</div>}
                
                {items.length > 2 && <div className="text-xs text-slate-400 w-full text-center">+ עוד {items.length - 2} מוצרים</div>}
            </div>
        </button>
    );
}

export default Dashboard;
