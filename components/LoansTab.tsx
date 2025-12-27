
import React, { useState, useEffect } from 'react';
import { LoanItem, BaseItem, HistoryEntry } from '../types';
import { Plus, Trash2, CreditCard, ArrowRight, Calendar, Percent, RefreshCw, AlertCircle, X, Save, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface LoansTabProps {
  items: LoanItem[];
  onAdd: (item: LoanItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
  profiles: any[];
  activeProfileId: string;
}

const LoansTab: React.FC<LoansTabProps> = ({ items, onAdd, onRemove, onUpdate, onUpdateDetails, onBack, profiles, activeProfileId }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LoanItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [source, setSource] = useState('');
  const [purpose, setPurpose] = useState('');
  const [balance, setBalance] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [interest, setInterest] = useState('');
  
  // New Calculator Fields
  const [loanType, setLoanType] = useState<'spitzer' | 'balloon_partial' | 'balloon_full'>('spitzer');
  const [durationMonths, setDurationMonths] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [totalInterest, setTotalInterest] = useState(0);

  // Auto Calculate Monthly Payment when inputs change
  useEffect(() => {
      const P = Number(balance); // Using Balance as Principal for calc if it's a new loan
      const principal = Number(originalAmount) || Number(balance);
      const r = Number(interest) / 100;
      const n = Number(durationMonths);

      if (principal > 0 && n > 0) {
          let pmt = 0;
          let totInt = 0;
          const i = r / 12;

          if (loanType === 'spitzer') {
              // Spitzer: PMT = P * (i * (1 + i)^n) / ((1 + i)^n - 1)
              if (i === 0) {
                  pmt = principal / n;
              } else {
                  pmt = principal * ( (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) );
              }
              totInt = (pmt * n) - principal;
          } else if (loanType === 'balloon_partial') {
              // Partial Balloon (Grace/Interest Only): Monthly = Interest on Principal. Principal at end.
              pmt = principal * i;
              totInt = pmt * n; // Total interest paid over the period
          } else {
              // Full Balloon: 0 Monthly. Everything at end.
              // Compound Interest Calculation: Future Value = P * (1 + i)^n
              pmt = 0;
              const futureValue = principal * Math.pow(1 + i, n);
              totInt = futureValue - principal;
          }
          
          setMonthlyPayment(pmt.toFixed(0));
          setTotalInterest(totInt);
      }
  }, [balance, originalAmount, interest, durationMonths, loanType]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !balance) return;

    onAdd({
      id: Date.now().toString(),
      name: source + (purpose ? ` - ${purpose}` : ''),
      source,
      purpose,
      loanType,
      durationMonths: Number(durationMonths),
      value: Number(balance), // Remaining balance
      originalAmount: Number(originalAmount) || Number(balance),
      monthlyPayment: Number(monthlyPayment),
      interestRate: Number(interest),
      history: [{ date: new Date().toISOString().split('T')[0], value: Number(balance) }]
    });

    setSource('');
    setPurpose('');
    setBalance('');
    setOriginalAmount('');
    setMonthlyPayment('');
    setInterest('');
    setDurationMonths('');
    setIsAddOpen(false);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const openItem = (item: LoanItem) => {
      setSelectedItem(item);
  };

  const getLoanTypeLabel = (type: string) => {
      switch(type) {
          case 'spitzer': return 'שפיצר';
          case 'balloon_partial': return 'בלון חלקי (ריבית)';
          case 'balloon_full': return 'בלון מלא';
          case 'balloon': return 'בלון'; // Backwards compatibility
          default: return 'הלוואה';
      }
  };

  // Inline Detail View
  if (selectedItem) {
      return (
          <AssetModal 
            item={selectedItem} 
            category="loans"
            isOpen={true} 
            onClose={() => setSelectedItem(null)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel="הלוואה"
            profiles={profiles}
            activeProfileId={activeProfileId}
          />
      );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
       {/* Header */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500">
                <ArrowRight size={20} />
            </button>
            <div>
                 <h2 className="text-3xl font-black text-slate-800">הלוואות והתחייבויות</h2>
                 <p className="text-slate-500">ניהול אשראי והחזרים</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddOpen(!isAddOpen)}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition transform hover:-translate-y-1 ${isAddOpen ? 'bg-slate-200 text-slate-600' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'}`}
          >
              {isAddOpen ? <X size={20} /> : <Plus size={20} />}
              <span className="hidden md:inline">{isAddOpen ? 'ביטול הוספה' : 'הוסף הלוואה חדשה'}</span>
          </button>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List */}
        <div className="space-y-4">
          {items.length === 0 && !isAddOpen ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
               <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">אין הלוואות פעילות.</p>
               <button onClick={() => setIsAddOpen(true)} className="mt-4 text-rose-600 font-bold hover:underline">לחץ להוספת הלוואה ראשונה</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
               {items.map((item) => (
                   <div 
                        key={item.id} 
                        onClick={() => openItem(item)}
                        className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between relative"
                   >
                       <div className="flex justify-between items-start mb-4">
                           <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
                               <CreditCard size={24} />
                           </div>
                           <button 
                                type="button"
                                onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    setConfirmDeleteId(item.id); 
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition relative z-10 opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                       </div>
                       
                       <div>
                           <h3 className="font-bold text-slate-800 text-xl mb-1">{item.name}</h3>
                           <p className="text-xs text-slate-400 mb-6 bg-slate-50 px-2 py-1 rounded-lg inline-block font-medium">{item.source}</p>
                           
                           <div className="space-y-4 border-t border-slate-50 pt-4">
                               <div className="flex justify-between items-end">
                                   <span className="text-sm font-bold text-slate-500">יתרה לסילוק</span>
                                   <span className="font-black text-xl text-slate-800">₪{item.value.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between items-end">
                                   <span className="text-sm font-bold text-slate-500">החזר חודשי</span>
                                   <span className="font-bold text-xl text-rose-600">₪{item.monthlyPayment.toLocaleString()}</span>
                               </div>
                               <div className="flex items-center justify-center gap-4 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl mt-2">
                                   <span className="font-medium">ריבית: {item.interestRate}%</span>
                                   <span className="w-px h-3 bg-slate-300"></span>
                                   <span className="font-medium">{getLoanTypeLabel(item.loanType)}</span>
                               </div>
                           </div>
                       </div>
                   </div>
               ))}
            </div>
          )}
        </div>

        {/* Inline Add Form */}
        {isAddOpen && (
            <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 md:p-8 animate-fade-in shadow-sm">
                <h3 className="text-xl font-black text-rose-800 mb-6 flex items-center gap-2">
                    <Plus className="bg-rose-200 text-rose-700 p-1 rounded-lg" size={28} />
                    הוספת הלוואה / התחייבות
                </h3>
                
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">מקור ההלוואה</label>
                            <input
                                type="text"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full p-4 bg-white border border-rose-200 rounded-2xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition text-lg shadow-sm"
                                placeholder="בנק / חברת אשראי"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">מטרת ההלוואה</label>
                            <input
                                type="text"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                className="w-full p-4 bg-white border border-rose-200 rounded-2xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition text-lg shadow-sm"
                                placeholder="רכב / שיפוץ / לימודים"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">סכום ההלוואה המקורי</label>
                            <div className="relative">
                                <NumberInput
                                    value={originalAmount}
                                    onChange={(val) => {
                                        setOriginalAmount(val.toString());
                                        if(!balance) setBalance(val.toString());
                                    }}
                                    className="w-full p-4 pl-12 bg-white border border-rose-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition font-black text-xl shadow-sm"
                                    placeholder="0"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-rose-400">₪</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">יתרה נוכחית לסילוק</label>
                            <div className="relative">
                                <NumberInput
                                    value={balance}
                                    onChange={(val) => setBalance(val.toString())}
                                    className="w-full p-4 pl-12 bg-white border border-rose-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none transition font-black text-xl shadow-sm"
                                    placeholder="0"
                                    required
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-rose-400">₪</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">סוג לוח סילוקין</label>
                            <select 
                                value={loanType} 
                                onChange={(e) => setLoanType(e.target.value as any)}
                                className="w-full p-3 bg-white border border-rose-200 rounded-2xl text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none transition appearance-none shadow-sm cursor-pointer"
                            >
                                <option value="spitzer">שפיצר (החזר קבוע)</option>
                                <option value="balloon_partial">בלון חלקי (תשלומי ריבית בלבד)</option>
                                <option value="balloon_full">בלון מלא (תשלום קרן+ריבית בסוף)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">תקופה (חודשים)</label>
                            <input
                                type="number"
                                value={durationMonths}
                                onChange={(e) => setDurationMonths(e.target.value)}
                                className="w-full p-3 bg-white border border-rose-200 rounded-2xl text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none transition font-medium shadow-sm"
                                placeholder="60"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">ריבית שנתית (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={interest}
                                onChange={(e) => setInterest(e.target.value)}
                                className="w-full p-3 bg-white border border-rose-200 rounded-2xl text-slate-700 focus:ring-2 focus:ring-rose-500 outline-none transition font-medium shadow-sm"
                                placeholder="6.5"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-rose-100 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                        <div className="text-center sm:text-right">
                            <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">החזר חודשי מוערך</label>
                            <div className="text-3xl font-black text-rose-600">₪{Number(monthlyPayment).toLocaleString()}</div>
                        </div>
                        <div className="h-px sm:h-12 w-full sm:w-px bg-rose-200"></div>
                        <div className="text-center sm:text-left">
                            <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">סה"כ ריבית לתשלום</label>
                            <div className="text-xl font-bold text-rose-800">₪{totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-200 transition transform hover:-translate-y-1"
                        >
                            <Save size={20} />
                            שמור הלוואה
                        </button>
                    </div>
                </form>
            </div>
        )}

         {/* --- KNOWLEDGE SECTION --- */}
        <div className="pt-8 border-t border-slate-200/60">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <BookOpen className="text-rose-500" size={24} />
                ידע זה כוח - מדריכים מקצועיים
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                    href="https://www.shirfinance.com/%D7%9E%D7%90%D7%9E%D7%A8%D7%99%D7%9D/%D7%9E%D7%97%D7%96%D7%95%D7%A8-%D7%9E%D7%A9%D7%9B%D7%A0%D7%AA%D7%90" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition group flex flex-col justify-between h-full"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><RefreshCw size={10}/> משכנתא</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-emerald-700 transition-colors">מתי שווה למחזר משכנתא?</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            הסכום מכביד? הריביות השתנו? מחזור משכנתא יכול לחסוך עשרות אלפי שקלים. מתי כדאי לבדוק את הנושא?
                        </p>
                    </div>
                    <div className="mt-4 flex items-center text-emerald-600 text-sm font-bold gap-1">
                        קראו עוד באתר <ExternalLink size={14} />
                    </div>
                </a>
                
                <a 
                    href="https://www.shirfinance.com/%D7%9E%D7%90%D7%9E%D7%A8%D7%99%D7%9D/emerejencyfund" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-rose-200 transition group flex flex-col justify-between h-full"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><ShieldCheck size={10}/> מניעת חובות</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-rose-700 transition-colors">איך להימנע מהלוואות בעתיד?</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            הדרך הטובה ביותר להתמודד עם חובות היא לא להיכנס אליהם מלכתחילה. למה אתם חייבים קרן ביטחון לשעת חירום.
                        </p>
                    </div>
                    <div className="mt-4 flex items-center text-rose-600 text-sm font-bold gap-1">
                        קראו עוד באתר <ExternalLink size={14} />
                    </div>
                </a>
            </div>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDeleteId(null)}>
             <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 transform transition-all scale-100 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <AlertCircle size={32} />
                </div>
                <h3 className="font-black text-2xl text-slate-800 mb-2">מחיקת הלוואה</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">האם אתם בטוחים שברצונכם למחוק הלוואה זו? הפעולה לא ניתנת לביטול.</p>
                <div className="flex gap-3 justify-center">
                   <button 
                        onClick={() => setConfirmDeleteId(null)} 
                        className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition"
                    >
                       ביטול
                   </button>
                   <button 
                        onClick={confirmDelete} 
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition"
                    >
                       כן, מחק
                   </button>
                </div>
             </div>
        </div>
      )}
      
      {selectedItem && (
          <AssetModal 
            item={selectedItem} 
            category="loans"
            isOpen={true} 
            onClose={() => setSelectedItem(null)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel="הלוואה"
            profiles={profiles}
            activeProfileId={activeProfileId}
          />
      )}
    </div>
  );
};

export default LoansTab;
