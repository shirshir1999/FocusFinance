
import React, { useState } from 'react';
import { RealEstateItem, BaseItem, HistoryEntry, MortgageTrack } from '../types';
import { Plus, Trash2, Building2, Home, MapPin, ArrowRight, CreditCard, AlertCircle, X, Save } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface RealEstateTabProps {
  items: RealEstateItem[];
  onAdd: (item: RealEstateItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
  profiles: any[];
  activeProfileId: string;
}

const RealEstateTab: React.FC<RealEstateTabProps> = ({ items, onAdd, onRemove, onUpdate, onUpdateDetails, onBack, profiles, activeProfileId }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RealEstateItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [value, setValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  
  // Mortgage State for Add Form
  const [showMortgage, setShowMortgage] = useState(false);
  const [mortgageTracks, setMortgageTracks] = useState<MortgageTrack[]>([]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) return;

    onAdd({
      id: Date.now().toString(),
      name,
      address,
      value: Number(value),
      monthlyRent: Number(monthlyRent),
      mortgageBalance: mortgageTracks.reduce((sum, t) => sum + t.balance, 0),
      mortgageTracks: mortgageTracks,
      history: [{ date: new Date().toISOString().split('T')[0], value: Number(value) }]
    });

    setName('');
    setAddress('');
    setValue('');
    setMonthlyRent('');
    setMortgageTracks([]);
    setShowMortgage(false);
    setIsAddOpen(false);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const addTrack = () => {
      setMortgageTracks([...mortgageTracks, { 
          id: Date.now().toString(), 
          name: '', 
          type: 'kalatz',
          originalAmount: 0,
          balance: 0, 
          yearsTotal: 25,
          yearsRemaining: 25,
          interestRate: 0, 
          monthlyPayment: 0 
      }]);
  };

  const updateTrack = (id: string, field: keyof MortgageTrack, val: any) => {
      const updated = mortgageTracks.map(t => {
          if (t.id !== id) return t;
          const newTrack = { ...t, [field]: val };
          
          // Auto Calc Monthly Payment (PMT)
          if (['balance', 'yearsRemaining', 'interestRate'].includes(field)) {
              const P = field === 'balance' ? Number(val) : t.balance;
              const years = field === 'yearsRemaining' ? Number(val) : t.yearsRemaining;
              const rate = field === 'interestRate' ? Number(val) : t.interestRate;
              
              if (P > 0 && years > 0) {
                  const r = rate / 100 / 12;
                  const n = years * 12;
                  let pmt = 0;
                  if (r === 0) pmt = P / n;
                  else pmt = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                  
                  newTrack.monthlyPayment = Math.round(pmt);
              }
          }
          return newTrack;
      });
      setMortgageTracks(updated);
  };

  const removeTrack = (id: string) => {
      setMortgageTracks(mortgageTracks.filter(t => t.id !== id));
  };

  const openItem = (item: RealEstateItem) => {
      setSelectedItem(item);
  };

  // Inline Detail View
  if (selectedItem) {
      return (
          <AssetModal 
            item={selectedItem} 
            category="realEstate"
            isOpen={true} 
            onClose={() => setSelectedItem(null)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel="נכס נדל״ן"
            profiles={profiles}
            activeProfileId={activeProfileId}
          />
      );
  }

  // Insights
  const totalMortgage = mortgageTracks.reduce((sum, t) => sum + t.balance, 0);
  const totalPayment = mortgageTracks.reduce((sum, t) => sum + t.monthlyPayment, 0);
  const totalInterest = mortgageTracks.reduce((sum, t) => sum + (t.monthlyPayment * 12 * t.yearsRemaining) - t.balance, 0);
  const returnPerShekel = totalMortgage > 0 ? ((totalMortgage + totalInterest) / totalMortgage).toFixed(2) : '0';

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
       {/* Header */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500">
                <ArrowRight size={20} />
            </button>
            <div>
                 <h2 className="text-3xl font-black text-slate-800">נדל"ן</h2>
                 <p className="text-slate-500">ניהול נכסים והתחייבויות</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddOpen(!isAddOpen)}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition transform hover:-translate-y-1 ${isAddOpen ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
          >
              {isAddOpen ? <X size={20} /> : <Plus size={20} />}
              <span className="hidden md:inline">{isAddOpen ? 'ביטול הוספה' : 'הוסף נכס חדש'}</span>
          </button>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List */}
        <div className="space-y-4">
          {items.length === 0 && !isAddOpen ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
               <Home size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">לא הוזנו נכסי נדל"ן.</p>
               <button onClick={() => setIsAddOpen(true)} className="mt-4 text-indigo-600 font-bold hover:underline">לחץ להוספת נכס ראשון</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
               {items.map((item) => {
                   const totalMortgage = item.mortgageTracks && item.mortgageTracks.length > 0 
                        ? item.mortgageTracks.reduce((s,t) => s + t.balance, 0)
                        : item.mortgageBalance;
                   
                   return (
                   <div 
                        key={item.id} 
                        onClick={() => openItem(item)}
                        className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative"
                   >
                       <div className="flex justify-between items-start">
                           <div className="flex gap-6 w-full">
                               <div className="p-4 bg-indigo-50 rounded-2xl h-fit text-indigo-600">
                                   <Home size={28} />
                               </div>
                               <div className="flex-1">
                                   <div className="flex justify-between w-full mb-2">
                                        <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                                        <button 
                                            type="button"
                                            onClick={(e) => { 
                                                e.preventDefault();
                                                e.stopPropagation(); 
                                                setConfirmDeleteId(item.id); 
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition relative z-10 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                   </div>
                                   <div className="flex items-center gap-1 text-slate-400 text-sm mb-6">
                                       <MapPin size={16} />
                                       {item.address || 'ללא כתובת'}
                                   </div>
                                   
                                   <div className="flex flex-wrap gap-12 border-t border-slate-50 pt-4">
                                       <div>
                                           <span className="text-xs text-slate-400 block mb-1 font-bold uppercase tracking-wider">שווי מוערך</span>
                                           <span className="font-black text-2xl text-slate-800">₪{item.value.toLocaleString()}</span>
                                       </div>
                                       <div>
                                           <span className="text-xs text-slate-400 block mb-1 font-bold uppercase tracking-wider">יתרת משכנתא</span>
                                           <span className="font-bold text-xl text-red-500">{totalMortgage > 0 ? `₪${totalMortgage.toLocaleString()}` : '-'}</span>
                                       </div>
                                       <div>
                                           <span className="text-xs text-slate-400 block mb-1 font-bold uppercase tracking-wider">שכירות חודשית</span>
                                           <span className="font-bold text-xl text-emerald-600">{item.monthlyRent ? `₪${item.monthlyRent.toLocaleString()}` : '-'}</span>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               )})}
            </div>
          )}
        </div>

        {/* Inline Add Form */}
        {isAddOpen && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 md:p-8 animate-fade-in shadow-sm">
                <h3 className="text-xl font-black text-indigo-800 mb-6 flex items-center gap-2">
                    <Plus className="bg-indigo-200 text-indigo-700 p-1 rounded-lg" size={28} />
                    הוספת נכס נדל"ן
                </h3>
                
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">כינוי לנכס</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-4 bg-white border border-indigo-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition text-lg shadow-sm"
                                placeholder="לדוגמה: הדירה בחיפה"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">כתובת (אופציונלי)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full p-4 pl-12 bg-white border border-indigo-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition text-lg shadow-sm"
                                    placeholder="רחוב הרצל 15, תל אביב"
                                />
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">שווי שוק מוערך</label>
                            <div className="relative">
                                <NumberInput
                                    value={value}
                                    onChange={(val) => setValue(val.toString())}
                                    className="w-full p-4 pl-12 bg-white border border-indigo-100 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition font-black text-xl shadow-sm"
                                    placeholder="0"
                                    required
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-indigo-400">₪</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">שכירות חודשית (אם יש)</label>
                            <div className="relative">
                                <NumberInput
                                    value={monthlyRent}
                                    onChange={(val) => setMonthlyRent(val.toString())}
                                    className="w-full p-4 pl-12 bg-white border border-indigo-100 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition font-black text-xl shadow-sm"
                                    placeholder="0"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-indigo-400">₪</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-indigo-100 pt-6">
                        <button 
                            type="button" 
                            onClick={() => setShowMortgage(!showMortgage)} 
                            className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-between transition ${showMortgage ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-indigo-100 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span className="flex items-center gap-2"><CreditCard size={20}/> פרטי משכנתא (אופציונלי)</span>
                            <span>{showMortgage ? '−' : '+'}</span>
                        </button>
                    </div>

                    {showMortgage && (
                        <div className="bg-white p-6 rounded-3xl border border-indigo-100 space-y-6 animate-fade-in shadow-sm">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-700 text-lg">מסלולי משכנתא</h4>
                                <button type="button" onClick={addTrack} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-bold text-sm transition">
                                    + הוסף מסלול
                                </button>
                            </div>

                            {mortgageTracks.map((track, index) => (
                                <div key={track.id} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">מסלול</label>
                                        <select value={track.type} onChange={e => updateTrack(track.id, 'type', e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-white">
                                            <option value="prime">פריים</option>
                                            <option value="kalatz">קל"צ</option>
                                            <option value="kacz">ק"צ</option>
                                            <option value="matz">מ"צ</option>
                                            <option value="balat">בל"צ</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">יתרה</label>
                                        <NumberInput value={track.balance} onChange={val => updateTrack(track.id, 'balance', val)} className="w-full p-2 text-sm border border-slate-200 rounded-lg font-bold" placeholder="0"/>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">שנים נותרו</label>
                                        <input type="number" value={track.yearsRemaining} onChange={e => updateTrack(track.id, 'yearsRemaining', Number(e.target.value))} className="w-full p-2 text-sm border border-slate-200 rounded-lg" placeholder="20"/>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">ריבית %</label>
                                        <input type="number" step="0.1" value={track.interestRate} onChange={e => updateTrack(track.id, 'interestRate', Number(e.target.value))} className="w-full p-2 text-sm border border-slate-200 rounded-lg" placeholder="4.5"/>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">החזר</label>
                                        <div className="p-2 text-sm font-bold text-rose-600 bg-rose-50 rounded-lg border border-rose-100 text-center">₪{track.monthlyPayment.toLocaleString()}</div>
                                    </div>
                                    <div className="md:col-span-1 flex justify-end pb-1">
                                        <button type="button" onClick={() => removeTrack(track.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}

                            {mortgageTracks.length > 0 && (
                                <div className="pt-4 border-t border-slate-200 text-sm grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <div className="text-slate-500 text-xs font-bold mb-1">סה"כ משכנתא</div>
                                        <div className="font-black text-lg text-slate-800">₪{totalMortgage.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <div className="text-slate-500 text-xs font-bold mb-1">סה"כ החזר חודשי</div>
                                        <div className="font-black text-lg text-rose-600">₪{totalPayment.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-200 transition transform hover:-translate-y-1"
                        >
                            <Save size={20} />
                            הוסף נכס
                        </button>
                    </div>
                </form>
            </div>
        )}

      </div>

      {/* Custom Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDeleteId(null)}>
             <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 transform transition-all scale-100 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <AlertCircle size={32} />
                </div>
                <h3 className="font-black text-2xl text-slate-800 mb-2">מחיקת נכס</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">האם אתם בטוחים שברצונכם למחוק נכס זה? הפעולה לא ניתנת לביטול.</p>
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
    </div>
  );
};

export default RealEstateTab;
