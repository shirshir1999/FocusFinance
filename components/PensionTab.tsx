import React, { useState, useEffect } from 'react';
import { PensionItem, BaseItem, HistoryEntry } from '../types';
import { Plus, Trash2, Umbrella, BarChart2, User, ArrowRight, Percent, Layers, AlertCircle } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface PensionTabProps {
  items: PensionItem[];
  initialType?: PensionItem['type'];
  onAdd: (item: PensionItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
}

const PensionTab: React.FC<PensionTabProps> = ({ items, initialType, onAdd, onRemove, onUpdate, onUpdateDetails, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PensionItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [monthlyDeposit, setMonthlyDeposit] = useState('');
  const [type, setType] = useState<PensionItem['type']>('pension');
  const [track, setTrack] = useState('');
  const [feeAcc, setFeeAcc] = useState('');
  const [feeDep, setFeeDep] = useState('');

  useEffect(() => {
      if (initialType) {
          setType(initialType);
      }
  }, [initialType]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) return;

    onAdd({
      id: Date.now().toString(),
      name,
      value: Number(value),
      monthlyDeposit: Number(monthlyDeposit),
      type,
      track: track || 'כללי',
      managementFeeAccumulation: Number(feeAcc),
      managementFeeDeposit: Number(feeDep),
      history: [{ 
          date: new Date().toISOString().split('T')[0], 
          value: Number(value),
          track: track || 'כללי',
      }]
    });

    setName('');
    setValue('');
    setMonthlyDeposit('');
    setTrack('');
    setFeeAcc('');
    setFeeDep('');
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const openItem = (item: PensionItem) => {
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
                 <h2 className="text-3xl font-black text-slate-800">פנסיה וגמל</h2>
                 <p className="text-slate-500">ניהול עתיד פיננסי</p>
            </div>
          </div>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List (Now Top) */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
              <Umbrella size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">רשימת המוצרים הפנסיוניים ריקה.</p>
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
                         <div className={`p-3 rounded-xl ${item.type === 'pension' ? 'bg-cyan-50 text-cyan-600' : item.type === 'study_fund' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                            {item.type === 'pension' ? <User size={20}/> : <BarChart2 size={20}/>}
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
                        <div className="flex flex-wrap gap-2 mb-4">
                           <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md">{item.type === 'pension' ? 'פנסיה' : item.type === 'study_fund' ? 'השתלמות' : 'קופת גמל'}</span>
                        </div>
                        
                        <div className="space-y-3 border-t border-slate-50 pt-3">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Layers size={12} />
                                    <span>מסלול</span>
                                </div>
                                <span className="font-medium bg-slate-50 px-2 py-0.5 rounded">{item.track || 'כללי'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Percent size={12} />
                                    <span>דמי ניהול</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-medium bg-slate-50 px-2 py-0.5 rounded">
                                        {item.managementFeeAccumulation || 0}%
                                        {item.type === 'pension' && ` / ${item.managementFeeDeposit || 0}%`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end pt-2">
                                <div>
                                    <p className="text-xs text-slate-400">הפקדה</p>
                                    <p className="text-sm font-medium text-slate-600">₪{item.monthlyDeposit.toLocaleString()}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-slate-400">צבירה</p>
                                    <p className="text-xl font-black text-slate-800">₪{item.value.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form (Now Bottom) */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl h-fit shadow-sm max-w-4xl">
          <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
            <Plus size={20} className="text-cyan-500"/>
            הוסף קופה חדשה
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-500 mb-2">שם הגוף המנהל</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="לדוגמה: מנורה מבטחים"
                required
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-500 mb-2">סוג מוצר</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
              >
                <option value="pension">קרן פנסיה</option>
                <option value="study_fund">קרן השתלמות</option>
                <option value="provident_fund">קופת גמל (רגילה/פיצויים)</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-500 mb-2">מסלול השקעה</label>
              <input
                list="tracks"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="בחר או הקלד..."
              />
               <datalist id="tracks">
                  <option value="כללי" />
                  <option value="מניות" />
                  <option value="S&P 500" />
                  <option value="עוקב מדדים" />
                </datalist>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">יתרה (₪)</label>
              <NumberInput
                value={value}
                onChange={(val) => setValue(val.toString())}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">הפקדה חודשית</label>
              <NumberInput
                value={monthlyDeposit}
                onChange={(val) => setMonthlyDeposit(val.toString())}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">דמי ניהול מצבירה (%)</label>
              <input
                type="number"
                step="0.01"
                value={feeAcc}
                onChange={(e) => setFeeAcc(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="0.5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">דמי ניהול מהפקדה (%)</label>
              <input
                type="number"
                step="0.01"
                value={feeDep}
                onChange={(e) => setFeeDep(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                placeholder="1.5"
              />
            </div>

            <button
              type="submit"
              className="lg:col-span-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-200 mt-2"
            >
              <Plus size={20} />
              הוסף לתיק
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
                    <h3 className="font-bold text-lg text-slate-800">מחיקת מוצר פנסיוני</h3>
                </div>
                <p className="text-slate-600 mb-6">האם אתה בטוח שברצונך למחוק קופה זו? הפעולה אינה ניתנת לביטול.</p>
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
            category="pensions"
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel={selectedItem.type === 'pension' ? 'קרן פנסיה' : selectedItem.type === 'study_fund' ? 'קרן השתלמות' : 'קופת גמל'}
          />
      )}
    </div>
  );
};

export default PensionTab;