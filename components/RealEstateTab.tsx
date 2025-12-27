import React, { useState } from 'react';
import { RealEstateItem, BaseItem, HistoryEntry, MortgageTrack } from '../types';
import { Plus, Trash2, Building2, Home, MapPin, ArrowRight, CreditCard, AlertCircle } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface RealEstateTabProps {
  items: RealEstateItem[];
  onAdd: (item: RealEstateItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
}

const RealEstateTab: React.FC<RealEstateTabProps> = ({ items, onAdd, onRemove, onUpdate, onUpdateDetails, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setIsModalOpen(true);
  };

  // Insights
  const totalMortgage = mortgageTracks.reduce((sum, t) => sum + t.balance, 0);
  const totalPayment = mortgageTracks.reduce((sum, t) => sum + t.monthlyPayment, 0);
  const totalInterest = mortgageTracks.reduce((sum, t) => sum + (t.monthlyPayment * 12 * t.yearsRemaining) - t.balance, 0);
  const returnPerShekel = totalMortgage > 0 ? ((totalMortgage + totalInterest) / totalMortgage).toFixed(2) : '0';

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500">
                <ArrowRight size={20} />
            </button>
            <div>
                 <h2 className="text-3xl font-black text-slate-800">נדל"ן</h2>
                 <p className="text-slate-500">ניהול נכסים והתחייבויות</p>
            </div>
          </div>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List (Top) */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
               <Home size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">לא הוזנו נכסי נדל"ן.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
               {items.map((item) => {
                   const totalMortgage = item.mortgageTracks && item.mortgageTracks.length > 0 
                        ? item.mortgageTracks.reduce((s,t) => s + t.balance, 0)
                        : item.mortgageBalance;
                   
                   return (
                   <div 
                        key={item.id} 
                        onClick={() => openItem(item)}
                        className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group relative"
                   >
                       <div className="flex justify-between items-start">
                           <div className="flex gap-4 w-full">
                               <div className="p-3 bg-indigo-50 rounded-xl h-fit text-indigo-600">
                                   <Home size={24} />
                               </div>
                               <div className="flex-1">
                                   <div className="flex justify-between w-full">
                                        <h3 className="text-xl font-bold text-slate-800 mb-1">{item.name}</h3>
                                        <button 
                                            type="button"
                                            onClick={(e) => { 
                                                e.preventDefault();
                                                e.stopPropagation(); 
                                                setConfirmDeleteId(item.id); 
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition relative z-10"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                   </div>
                                   <div className="flex items-center gap-1 text-slate-400 text-sm mb-6">
                                       <MapPin size={14} />
                                       {item.address || 'ללא כתובת'}
                                   </div>
                                   
                                   <div className="flex flex-wrap gap-8 border-t border-slate-50 pt-4">
                                       <div>
                                           <span className="text-xs text-slate-400 block mb-1">שווי מוערך</span>
                                           <span className="font-black text-lg text-slate-800">₪{item.value.toLocaleString()}</span>
                                       </div>
                                       <div>
                                           <span className="text-xs text-slate-400 block mb-1">יתרת משכנתא</span>
                                           <span className="font-bold text-red-500">{totalMortgage > 0 ? `₪${totalMortgage.toLocaleString()}` : '-'}</span>
                                       </div>
                                       <div>
                                           <span className="text-xs text-slate-400 block mb-1">שכירות חודשית</span>
                                           <span className="font-bold text-emerald-600">{item.monthlyRent ? `₪${item.monthlyRent.toLocaleString()}` : '-'}</span>
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

        {/* Form (Bottom) */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl h-fit shadow-sm max-w-4xl">
          <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
            <Plus size={20} className="text-indigo-500"/>
            הוסף נכס
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">כינוי לנכס</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="לדוגמה: דירה להשקעה בחיפה"
                required
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">כתובת (אופציונלי)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="רחוב הרצל 15"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">שווי שוק מוערך (₪)</label>
              <NumberInput
                value={value}
                onChange={(val) => setValue(val.toString())}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="2000000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">שכירות חודשית (₪)</label>
              <NumberInput
                value={monthlyRent}
                onChange={(val) => setMonthlyRent(val.toString())}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
                <button type="button" onClick={() => setShowMortgage(!showMortgage)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    {showMortgage ? '- הסתר פרטי משכנתא' : '+ הוסף פרטי משכנתא'}
                </button>
            </div>

            {showMortgage && (
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2"><CreditCard size={18}/> מסלולי משכנתא</h4>
                        <button type="button" onClick={addTrack} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 font-bold">
                            + הוסף מסלול
                        </button>
                    </div>

                    {mortgageTracks.map((track, index) => (
                        <div key={track.id} className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end bg-white p-3 rounded-lg border border-slate-200">
                            <div className="md:col-span-1">
                                <label className="text-[10px] text-slate-400">מסלול</label>
                                <select value={track.type} onChange={e => updateTrack(track.id, 'type', e.target.value)} className="w-full text-xs p-1 border rounded">
                                    <option value="prime">פריים</option>
                                    <option value="kalatz">קל"צ</option>
                                    <option value="kacz">ק"צ</option>
                                    <option value="matz">מ"צ</option>
                                    <option value="balat">בל"צ</option>
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] text-slate-400">יתרה</label>
                                <NumberInput value={track.balance} onChange={val => updateTrack(track.id, 'balance', val)} className="w-full text-xs p-1 border rounded font-bold" placeholder="0"/>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] text-slate-400">שנים נותרו</label>
                                <input type="number" value={track.yearsRemaining} onChange={e => updateTrack(track.id, 'yearsRemaining', Number(e.target.value))} className="w-full text-xs p-1 border rounded" placeholder="20"/>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] text-slate-400">ריבית %</label>
                                <input type="number" step="0.1" value={track.interestRate} onChange={e => updateTrack(track.id, 'interestRate', Number(e.target.value))} className="w-full text-xs p-1 border rounded" placeholder="4.5"/>
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] text-slate-400">החזר (אוטומטי)</label>
                                <div className="text-xs font-bold text-rose-600">₪{track.monthlyPayment.toLocaleString()}</div>
                            </div>
                            <div className="md:col-span-1 flex justify-end">
                                <button type="button" onClick={() => removeTrack(track.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}

                    {mortgageTracks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200 text-sm grid grid-cols-2 gap-4">
                            <div className="text-slate-600">
                                <div>סה"כ משכנתא: <span className="font-bold">₪{totalMortgage.toLocaleString()}</span></div>
                                <div>החזר חודשי: <span className="font-bold text-rose-600">₪{totalPayment.toLocaleString()}</span></div>
                            </div>
                            <div className="text-xs text-slate-500 bg-blue-50 p-2 rounded">
                                <div>תחזית ריבית כוללת: ₪{totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                                <div>על כל שקל שלווית תחזיר: ₪{returnPerShekel}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <button
              type="submit"
              className="md:col-span-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-200 mt-4"
            >
              <Plus size={20} />
              הוסף נכס
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
                    <h3 className="font-bold text-lg text-slate-800">מחיקת נכס נדל"ן</h3>
                </div>
                <p className="text-slate-600 mb-6">האם אתה בטוח שברצונך למחוק נכס זה? הפעולה אינה ניתנת לביטול.</p>
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
            category="realEstate"
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel="נכס נדל״ן"
          />
      )}
    </div>
  );
};

export default RealEstateTab;