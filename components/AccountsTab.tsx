import React, { useState } from 'react';
import { AccountItem, BaseItem, HistoryEntry } from '../types';
import { Plus, Trash2, Wallet, ArrowRight, ArrowUpRight, Edit2, AlertCircle } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface AccountsTabProps {
  items: AccountItem[];
  onAdd: (item: AccountItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
}

const AccountsTab: React.FC<AccountsTabProps> = ({ items, onAdd, onRemove, onUpdate, onUpdateDetails, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AccountItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'checking' | 'emergency' | 'savings'>('checking');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newValue) return;

    onAdd({
      id: Date.now().toString(),
      name: newName,
      value: Number(newValue),
      type: newType,
      history: [{ date: new Date().toISOString().split('T')[0], value: Number(newValue) }]
    });

    setNewName('');
    setNewValue('');
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const openItem = (item: AccountItem) => {
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
                 <h2 className="text-3xl font-black text-slate-800">עו"ש וקרן ביטחון</h2>
                 <p className="text-slate-500">ניהול נזילות שוטפת</p>
            </div>
          </div>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List Section (Now Top) */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
               <Wallet size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">לא הוזנו חשבונות עדיין.</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => openItem(item)}
                        className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group relative"
                    >
                         <div className="flex justify-between items-start mb-4">
                             <div className={`p-3 rounded-xl ${item.type === 'checking' ? 'bg-slate-100 text-slate-600' : item.type === 'emergency' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                 <Wallet size={20} />
                             </div>
                             <div className="flex gap-2 relative z-10">
                                <button
                                    type="button" 
                                    className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation(); 
                                        setConfirmDeleteId(item.id); 
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                         </div>
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-slate-700">{item.name}</h3>
                                {item.type === 'checking' && <ArrowUpRight size={14} className="text-slate-400"/>}
                             </div>
                             <div className={`text-2xl font-black ${item.value < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                ₪{item.value.toLocaleString()}
                             </div>
                             {item.lastUpdated && (
                                 <p className="text-xs text-slate-400 mt-2">עדכון אחרון: {new Date(item.lastUpdated).toLocaleDateString('he-IL')}</p>
                             )}
                         </div>
                    </div>
                ))}
             </div>
          )}
        </div>

        {/* Form Section (Now Bottom) */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl h-fit shadow-sm max-w-3xl">
          <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
            <Plus size={20} className="text-emerald-500"/>
            הוסף חשבון חדש
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">שם החשבון / בנק</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="לדוגמה: עו״ש פועלים"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">יתרה נוכחית (₪)</label>
              <NumberInput
                value={newValue}
                onChange={(val) => setNewValue(val.toString())}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">סוג חשבון</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              >
                <option value="checking">עובר ושב (עו״ש)</option>
                <option value="emergency">קרן ביטחון</option>
                <option value="savings">פיקדון / חיסכון</option>
              </select>
            </div>

            <button
              type="submit"
              className="md:col-span-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-200 mt-2"
            >
              <Plus size={20} />
              הוסף לרשימה
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
                    <h3 className="font-bold text-lg text-slate-800">מחיקת חשבון</h3>
                </div>
                <p className="text-slate-600 mb-6">האם אתה בטוח שברצונך למחוק חשבון זה? הפעולה אינה ניתנת לביטול.</p>
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
            category="accounts"
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel={selectedItem.type === 'checking' ? 'עו״ש' : selectedItem.type === 'emergency' ? 'קרן ביטחון' : 'חיסכון'}
          />
      )}
    </div>
  );
};

export default AccountsTab;