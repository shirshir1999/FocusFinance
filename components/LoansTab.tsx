import React, { useState, useEffect } from 'react';
import { LoanItem, BaseItem, HistoryEntry } from '../types';
import { Plus, Trash2, CreditCard, ArrowRight, Calendar, Percent, RefreshCw, AlertCircle } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface LoansTabProps {
  items: LoanItem[];
  onAdd: (item: LoanItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
}

const LoansTab: React.FC<LoansTabProps> = ({ items, onAdd, onRemove, onUpdate, onUpdateDetails, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LoanItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [source, setSource] = useState('');
  const [purpose, setPurpose] = useState('');
  const [balance, setBalance] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [interest, setInterest] = useState('');
  
  // New Calculator Fields
  const [loanType, setLoanType] = useState<'spitzer' | 'balloon'>('spitzer');
  const [durationMonths, setDurationMonths] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [totalInterest, setTotalInterest] = useState(0);

  // Auto Calculate Monthly Payment when inputs change
  useEffect(() => {
      const P = Number(balance); // Using Balance as Principal for calc if it's a new loan, otherwise Original Amount should be used but simplistic here
      const principal = Number(originalAmount) || Number(balance);
      const r = Number(interest) / 100;
      const n = Number(durationMonths);

      if (principal > 0 && n > 0) {
          let pmt = 0;
          let totInt = 0;

          if (loanType === 'spitzer') {
              // PMT = P * (r/12 * (1 + r/12)^n) / ((1 + r/12)^n - 1)
              const i = r / 12;
              if (i === 0) {
                  pmt = principal / n;
              } else {
                  pmt = principal * ( (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) );
              }
              totInt = (pmt * n) - principal;
          } else {
              // Balloon (Interest Only usually, or Full Balloon at end)
              // Assuming Interest Only for monthly payment context
              // PMT = P * r / 12
              pmt = (principal * r) / 12;
              totInt = (pmt * n); // Simple interest accumulation
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
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const openItem = (item: LoanItem) => {
      setSelectedItem(item);
      setIsModalOpen(true);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500">
                <ArrowRight size={20} />
            </button>
            <div>
                 <h2 className="text-3xl font-black text-slate-800">הלוואות והתחייבויות</h2>
                 <p className="text-slate-500">ניהול אשראי והחזרים</p>
            </div>
          </div>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
               <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">אין הלוואות פעילות.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {items.map((item) => (
                   <div 
                        key={item.id} 
                        onClick={() => openItem(item)}
                        className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between relative"
                   >
                       <div className="flex justify-between items-start mb-4">
                           <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                               <CreditCard size={20} />
                           </div>
                           <button 
                                type="button"
                                onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    setConfirmDeleteId(item.id); 
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition relative z-10"
                            >
                                <Trash2 size={16} />
                            </button>
                       </div>
                       
                       <div>
                           <h3 className="font-bold text-slate-800 text-lg mb-1">{item.name}</h3>
                           <p className="text-xs text-slate-400 mb-4">{item.source}</p>
                           
                           <div className="space-y-3 border-t border-slate-50 pt-3">
                               <div className="flex justify-between text-sm">
                                   <span className="text-slate-500">יתרה לסילוק</span>
                                   <span className="font-black text-slate-800">₪{item.value.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                   <span className="text-slate-500">החזר חודשי</span>
                                   <span className="font-bold text-rose-600">₪{item.monthlyPayment.toLocaleString()}</span>
                               </div>
                               <div className="flex items-center justify-center gap-3 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
                                   <span>ריבית: {item.interestRate}%</span>
                                   <span className="w-px h-3 bg-slate-300"></span>
                                   <span>{item.loanType === 'spitzer' ? 'שפיצר' : 'בלון'}</span>
                               </div>
                           </div>
                       </div>
                   </div>
               ))}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl h-fit shadow-sm max-w-4xl">
          <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
            <Plus size={20} className="text-rose-500"/>
            הוסף הלוואה חדשה
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">מקור ההלוואה</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition"
                placeholder="בנק / חברת אשראי"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">מטרה</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition"
                placeholder="רכב / שיפוץ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">סכום ההלוואה (₪)</label>
              <NumberInput
                value={originalAmount}
                onChange={(val) => {
                    setOriginalAmount(val.toString());
                    if(!balance) setBalance(val.toString());
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition"
                placeholder="50000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">סוג לוח סילוקין</label>
              <select 
                value={loanType} 
                onChange={(e) => setLoanType(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition"
              >
                  <option value="spitzer">שפיצר (החזר קבוע)</option>
                  <option value="balloon">בלון / בוליט (ריבית בלבד)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">תקופה (חודשים)</label>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition"
                placeholder="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">ריבית שנתית (%)</label>
              <input
                type="number"
                step="0.1"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition"
                placeholder="6.5"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 bg-rose-50 p-4 rounded-xl border border-rose-100 flex justify-between items-center">
                <div>
                    <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">החזר חודשי מוערך</label>
                    <div className="text-2xl font-black text-rose-600">₪{Number(monthlyPayment).toLocaleString()}</div>
                </div>
                <div className="text-left">
                    <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">סה"כ ריבית לתשלום</label>
                    <div className="text-lg font-bold text-rose-800">₪{totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
               <label className="block text-sm font-medium text-slate-500 mb-2">יתרה נוכחית לסילוק (אם שונה מהמקור)</label>
                <NumberInput
                    value={balance}
                    onChange={(val) => setBalance(val.toString())}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition font-bold"
                />
            </div>

            <button
              type="submit"
              className="md:col-span-2 lg:col-span-3 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-rose-200 mt-2"
            >
              <Plus size={20} />
              הוסף הלוואה
            </button>
          </form>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all scale-100">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                    <div className="p-3 bg-red-50 rounded-full">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">מחיקת הלוואה</h3>
                </div>
                <p className="text-slate-600 mb-6">האם אתה בטוח שברצונך למחוק הלוואה זו? הפעולה אינה ניתנת לביטול.</p>
                <div className="flex gap-3 justify-end">
                   <button 
                        onClick={() => setConfirmDeleteId(null)} 
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                    >
                       ביטול
                   </button>
                   <button 
                        onClick={confirmDelete} 
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-200 transition"
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
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel="הלוואה"
          />
      )}
    </div>
  );
};

export default LoansTab;