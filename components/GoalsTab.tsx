
import React, { useState, useEffect } from 'react';
import { FinancialGoal, BaseItem } from '../types';
import { Plus, Target, ArrowRight, X, Save, Edit2, Trash2, Link2, Calculator, Check, TrendingUp, Calendar, Coins, ArrowUpRight, Info, AlertCircle, Clock, Pin, PinOff } from 'lucide-react';
import NumberInput from './NumberInput';

interface GoalsTabProps {
  items: FinancialGoal[];
  availableAssets: BaseItem[]; // For linking
  onAdd: (item: FinancialGoal) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, item: FinancialGoal) => void;
  onBack: () => void;
  profiles: any[];
  activeProfileId: string;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ items, availableAssets, onAdd, onRemove, onUpdate, onBack }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(''); // New State
  const [linkedAssetId, setLinkedAssetId] = useState('');
  const [isLinked, setIsLinked] = useState(false);
  
  // Simulator State
  const [simMode, setSimMode] = useState<'calc_payment' | 'calc_time'>('calc_payment');
  const [simRate, setSimRate] = useState('4.0');
  const [simMonths, setSimMonths] = useState('12');
  const [simPayment, setSimPayment] = useState('');
  const [simResult, setSimResult] = useState<string | null>(null);

  // Load item for edit
  useEffect(() => {
      if (editingId) {
          const item = items.find(i => i.id === editingId);
          if (item) {
              setName(item.name);
              setTargetAmount(item.targetAmount.toString());
              setTargetDate(item.targetDate || '');
              
              // Calculate dynamic value if linked, else stored value
              let val = item.value;
              if (item.isLinked && item.linkedAssetId) {
                  const linked = availableAssets.find(a => a.id === item.linkedAssetId);
                  if (linked) val = linked.value;
              }
              setCurrentAmount(val.toString());
              setIsLinked(item.isLinked);
              setLinkedAssetId(item.linkedAssetId || '');
              
              setIsAddOpen(true);
          }
      } else {
          // Reset form on close/add mode
          if (!isAddOpen) {
            setName('');
            setTargetAmount('');
            setCurrentAmount('');
            setTargetDate('');
            setIsLinked(false);
            setLinkedAssetId('');
            setSimResult(null);
          }
      }
  }, [editingId, isAddOpen, items, availableAssets]);

  // Update simulator when linked asset changes (to get updated current amount)
  useEffect(() => {
      if (isLinked && linkedAssetId) {
          const asset = availableAssets.find(a => a.id === linkedAssetId);
          if (asset) {
              setCurrentAmount(asset.value.toString());
          }
      }
  }, [linkedAssetId, isLinked, availableAssets]);

  // Auto-calc simulation when inputs change
  useEffect(() => {
      calculateSimulation();
  }, [simMode, simRate, simMonths, simPayment, targetAmount, currentAmount]);

  // Auto-Update Simulator Months when Target Date Changes
  useEffect(() => {
      if (targetDate) {
          const start = new Date();
          const end = new Date(targetDate);
          // Calculate difference in months
          const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          const safeMonths = Math.max(1, diffMonths);
          
          setSimMonths(safeMonths.toString());
          
          // Switch to Payment Calc mode automatically if date is picked (logic: I have a date, tell me how much to pay)
          setSimMode('calc_payment');
      }
  }, [targetDate]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !targetAmount) return;

      const existingItem = editingId ? items.find(i => i.id === editingId) : null;

      const newItem: FinancialGoal = {
          id: editingId || Date.now().toString(),
          name,
          targetAmount: Number(targetAmount),
          value: Number(currentAmount),
          targetDate: targetDate || undefined,
          isLinked,
          linkedAssetId: isLinked ? linkedAssetId : undefined,
          isPinned: existingItem ? existingItem.isPinned : false, // Preserve pin state on edit, default false on new
          history: [], 
      };

      if (editingId) {
          onUpdate(editingId, newItem);
      } else {
          onAdd(newItem);
      }
      
      setIsAddOpen(false);
      setEditingId(null);
  };

  const togglePin = (goal: FinancialGoal) => {
      onUpdate(goal.id, { ...goal, isPinned: !goal.isPinned });
  };

  const calculateSimulation = () => {
      const target = Number(targetAmount);
      const current = Number(currentAmount) || 0;
      const rate = Number(simRate) / 100 / 12; // Monthly rate
      
      if (!target || target <= current) {
          setSimResult(target > 0 ? "היעד כבר הושג!" : null);
          return;
      }

      if (simMode === 'calc_payment') {
          // Solve for PMT
          const months = Number(simMonths);
          if (months <= 0) return;
          
          let pmt = 0;
          if (rate === 0) {
              pmt = (target - current) / months;
          } else {
              const futurePV = current * Math.pow(1 + rate, months);
              const factor = (Math.pow(1 + rate, months) - 1) / rate;
              pmt = (target - futurePV) / factor;
          }
          
          if (pmt <= 0) setSimResult("אין צורך בהפקדה נוספת");
          else setSimResult(`הפקדה חודשית נדרשת: ₪${Math.ceil(pmt).toLocaleString()}`);
          
      } else {
          // Solve for n (Months)
          const pmt = Number(simPayment);
          // If no payment and rate is 0 or negative, we never reach target
          if (pmt <= 0 && rate <= 0) {
               setSimResult("לא ניתן להגיע ליעד ללא הפקדה או תשואה");
               return;
          }

          let simCurrent = current;
          let months = 0;
          let safeGuard = 0;
          // Simple iterative calc to avoid log domain issues
          while (simCurrent < target && safeGuard < 1200) { 
              simCurrent = simCurrent * (1 + rate) + pmt;
              months++;
              safeGuard++;
          }
          
          if (safeGuard >= 1200) setSimResult("יותר מ-100 שנים...");
          else {
              const years = Math.floor(months / 12);
              const remMonths = months % 12;
              let timeStr = '';
              if (years > 0) timeStr += `${years} שנים`;
              if (years > 0 && remMonths > 0) timeStr += ' ו-';
              if (remMonths > 0) timeStr += `${remMonths} חודשים`;
              if (timeStr === '') timeStr = 'פחות מחודש';
              setSimResult(`זמן מוערך: ${timeStr}`);
          }
      }
  };

  const getProgressColor = (percent: number) => {
      if (percent >= 100) return 'bg-emerald-500';
      if (percent >= 70) return 'bg-teal-500';
      if (percent >= 30) return 'bg-yellow-500';
      return 'bg-red-500';
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
       {/* Header */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500">
                <ArrowRight size={20} />
            </button>
            <div>
                 <h2 className="text-3xl font-black text-slate-800">מטרות ויעדים</h2>
                 <p className="text-slate-500">תכנון ומעקב אחר חלומות פיננסיים</p>
            </div>
          </div>
          <button 
            onClick={() => { setEditingId(null); setIsAddOpen(!isAddOpen); }}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition transform hover:-translate-y-1 ${isAddOpen ? 'bg-slate-200 text-slate-600' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200'}`}
          >
              {isAddOpen ? <X size={20} /> : <Plus size={20} />}
              <span className="hidden md:inline">{isAddOpen ? 'ביטול' : 'הגדר מטרה חדשה'}</span>
          </button>
       </div>

       <div className="flex flex-col gap-8">
            
            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {!isAddOpen && items.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                        <Target size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">לא הוגדרו מטרות עדיין.</p>
                        <button onClick={() => setIsAddOpen(true)} className="mt-4 text-teal-600 font-bold hover:underline">לחץ להוספת מטרה ראשונה</button>
                    </div>
                )}
                
                {!isAddOpen && items.map(goal => {
                    let displayValue = goal.value;
                    if (goal.isLinked && goal.linkedAssetId) {
                        const linked = availableAssets.find(a => a.id === goal.linkedAssetId);
                        if (linked) displayValue = linked.value;
                    }
                    
                    const percent = goal.targetAmount > 0 ? (displayValue / goal.targetAmount) * 100 : 0;
                    const displayPercent = Math.min(100, percent);
                    const isCompleted = percent >= 100;

                    let timeLeftString = '';
                    if (goal.targetDate && !isCompleted) {
                        const today = new Date();
                        const target = new Date(goal.targetDate);
                        const diffTime = target.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 0) timeLeftString = 'עבר תאריך היעד';
                        else if (diffDays < 30) timeLeftString = `נותרו ${diffDays} ימים`;
                        else {
                            const months = Math.floor(diffDays / 30);
                            timeLeftString = `נותרו כ-${months} חודשים`;
                        }
                    }

                    return (
                        <div key={goal.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all relative group flex flex-col justify-between">
                            <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 p-1 rounded-xl backdrop-blur-sm shadow-sm">
                                <button 
                                    onClick={() => togglePin(goal)} 
                                    className={`p-2 rounded-full transition ${goal.isPinned ? 'bg-orange-50 text-orange-500' : 'bg-slate-100 text-slate-400 hover:text-orange-400'}`}
                                    title={goal.isPinned ? "הסר מהדאשבורד" : "הצג בדאשבורד"}
                                >
                                    {goal.isPinned ? <Pin size={16} fill="currentColor" /> : <Pin size={16}/>}
                                </button>
                                <button onClick={() => setEditingId(goal.id)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"><Edit2 size={16}/></button>
                                <button onClick={() => onRemove(goal.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-full text-red-500"><Trash2 size={16}/></button>
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {isCompleted ? <Check size={24} /> : <Target size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                                            {goal.name}
                                            {goal.isPinned && <Pin size={12} className="text-orange-400" fill="currentColor"/>}
                                        </h3>
                                        {goal.isLinked && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Link2 size={10}/> מקושר לנכס</span>}
                                    </div>
                                </div>

                                <div className="mb-2 flex justify-between items-end">
                                    <span className="text-2xl font-black text-slate-800">₪{displayValue.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-slate-400 mb-1">יעד: ₪{goal.targetAmount.toLocaleString()}</span>
                                </div>

                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(percent)}`} 
                                        style={{ width: `${displayPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>{percent.toFixed(1)}% הושלמו</span>
                                    {timeLeftString && (
                                        <span className="text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
                                            <Clock size={10}/> {timeLeftString}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit/Add Form */}
            {isAddOpen && (
                <div className="bg-white border border-teal-100 rounded-3xl p-6 md:p-8 animate-fade-in shadow-sm relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-emerald-400"></div>
                    
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        {editingId ? <Edit2 size={24} className="text-teal-600"/> : <Target size={24} className="text-teal-600"/>}
                        {editingId ? 'עריכת מטרה' : 'הגדרת מטרה חדשה'}
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: Basic Form (7 Columns) */}
                        <div className="lg:col-span-7 space-y-6">
                            <form id="goal-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">שם המטרה</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition text-lg shadow-sm"
                                        placeholder="לדוגמה: הון עצמי לדירה / חופשה"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">סכום היעד</label>
                                        <NumberInput
                                            value={targetAmount}
                                            onChange={(val) => setTargetAmount(val)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none font-black text-xl shadow-sm"
                                            placeholder="50,000"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">תאריך יעד (אופציונלי)</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={targetDate}
                                                onChange={(e) => setTargetDate(e.target.value)}
                                                className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none text-lg shadow-sm"
                                            />
                                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">סכום נוכחי (התחלתי)</label>
                                    <NumberInput
                                        value={currentAmount}
                                        onChange={(val) => setCurrentAmount(val)}
                                        disabled={isLinked} // Read only if linked
                                        className={`w-full p-4 border rounded-2xl outline-none font-black text-xl shadow-sm ${isLinked ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500'}`}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <input 
                                            type="checkbox" 
                                            id="linkAsset" 
                                            checked={isLinked} 
                                            onChange={(e) => setIsLinked(e.target.checked)}
                                            className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                                        />
                                        <label htmlFor="linkAsset" className="text-sm font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                                            <Link2 size={18} />
                                            קישור לנכס קיים (עדכון אוטומטי)
                                        </label>
                                    </div>
                                    
                                    {isLinked && (
                                        <div className="animate-fade-in mt-3">
                                            {availableAssets.length > 0 ? (
                                                <div className="relative">
                                                    <select 
                                                        value={linkedAssetId} 
                                                        onChange={(e) => setLinkedAssetId(e.target.value)}
                                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer shadow-sm"
                                                    >
                                                        <option value="">בחר נכס מהרשימה...</option>
                                                        {availableAssets.map(asset => (
                                                            <option key={asset.id} value={asset.id}>
                                                                {asset.name} ({asset.value.toLocaleString()} ₪)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                                                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                                        <Info size={12}/>
                                                        הסכום הנוכחי יתעדכן אוטומטית לפי שווי הנכס הנבחר.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm flex items-center gap-2 border border-yellow-100">
                                                    <AlertCircle size={16}/>
                                                    <span>לא נמצאו נכסים זמינים לקישור. יש להוסיף נכסים (עו"ש, פנסיה, השקעות) תחילה.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* RIGHT: Simulator / Calculator (5 Columns) */}
                        <div className="lg:col-span-5 bg-teal-50 rounded-3xl p-6 border border-teal-100 flex flex-col">
                            <h4 className="font-bold text-teal-900 mb-4 flex items-center gap-2">
                                <Calculator size={20} className="text-teal-600"/>
                                מחשבון תכנון יעד
                            </h4>
                            
                            <div className="flex bg-white rounded-xl p-1 mb-4 border border-teal-100 shadow-sm">
                                <button 
                                    type="button"
                                    onClick={() => setSimMode('calc_payment')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${simMode === 'calc_payment' ? 'bg-teal-100 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    כמה להפקיד?
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setSimMode('calc_time')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${simMode === 'calc_time' ? 'bg-teal-100 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    מתי אגיע ליעד?
                                </button>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">תשואה שנתית צפויה (%)</label>
                                    <input 
                                        type="number" 
                                        value={simRate} 
                                        onChange={(e) => setSimRate(e.target.value)} 
                                        className="w-full p-2 rounded-xl border border-teal-200 text-sm outline-none focus:border-teal-500 bg-white"
                                        step="0.1"
                                    />
                                </div>

                                {simMode === 'calc_payment' ? (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">בעוד כמה חודשים תרצה להגיע ליעד?</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={simMonths} 
                                                onChange={(e) => setSimMonths(e.target.value)} 
                                                className="w-full p-2 pl-8 rounded-xl border border-teal-200 text-sm outline-none focus:border-teal-500 bg-white"
                                            />
                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1 block">הפקדה חודשית מתוכננת (₪)</label>
                                        <div className="relative">
                                            <NumberInput 
                                                value={simPayment} 
                                                onChange={(val) => setSimPayment(val)} 
                                                className="w-full p-2 pl-8 rounded-xl border border-teal-200 text-sm outline-none focus:border-teal-500 bg-white"
                                            />
                                            <Coins size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 bg-white p-4 rounded-xl border border-teal-200 shadow-sm text-center">
                                    <span className="text-xs font-bold text-slate-400 block mb-1">תוצאת חישוב</span>
                                    <span className="text-lg font-black text-teal-700 block">
                                        {simResult || '---'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            form="goal-form"
                            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-teal-200 transition transform hover:-translate-y-1"
                        >
                            <Save size={20} />
                            {editingId ? 'עדכן מטרה' : 'שמור מטרה חדשה'}
                        </button>
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default GoalsTab;
