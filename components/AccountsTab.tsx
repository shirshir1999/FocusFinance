
import React, { useState } from 'react';
import { AccountItem, BaseItem, HistoryEntry } from '../types';
import { Plus, Trash2, Wallet, ArrowRight, ArrowUpRight, Edit2, AlertCircle, X, Save } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface AccountsTabProps {
  items: AccountItem[];
  onAdd: (item: AccountItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
  profiles: any[];
  activeProfileId: string;
}

const AccountsTab: React.FC<AccountsTabProps> = ({ items, onAdd, onRemove, onUpdate, onUpdateDetails, onBack, profiles, activeProfileId }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
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
    setIsAddOpen(false);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const openItem = (item: AccountItem) => {
      setSelectedItem(item);
  };

  // Inline Detail View
  if (selectedItem) {
      return (
          <AssetModal 
            item={selectedItem} 
            category="accounts"
            isOpen={true} 
            onClose={() => setSelectedItem(null)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel={selectedItem.type === 'checking' ? 'עו״ש' : selectedItem.type === 'emergency' ? 'קרן ביטחון' : 'חיסכון'}
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
                 <h2 className="text-3xl font-black text-slate-800">עו"ש וקרן ביטחון</h2>
                 <p className="text-slate-500">ניהול נזילות שוטפת</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddOpen(!isAddOpen)}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition transform hover:-translate-y-1 ${isAddOpen ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}
          >
              {isAddOpen ? <X size={20} /> : <Plus size={20} />}
              <span className="hidden md:inline">{isAddOpen ? 'ביטול הוספה' : 'הוסף חשבון חדש'}</span>
          </button>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List Section */}
        <div className="space-y-4">
          {items.length === 0 && !isAddOpen ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
               <Wallet size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">לא הוזנו חשבונות עדיין.</p>
               <button onClick={() => setIsAddOpen(true)} className="mt-4 text-emerald-600 font-bold hover:underline">לחץ להוספת חשבון ראשון</button>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => openItem(item)}
                        className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative"
                    >
                         <div className="flex justify-between items-start mb-6">
                             <div className={`p-4 rounded-2xl ${item.type === 'checking' ? 'bg-slate-100 text-slate-600' : item.type === 'emergency' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                 <Wallet size={24} />
                             </div>
                             <div className="flex gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button" 
                                    className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation(); 
                                        setConfirmDeleteId(item.id); 
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                             </div>
                         </div>
                         <div>
                             <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-slate-700">{item.name}</h3>
                                {item.type === 'checking' && <ArrowUpRight size={16} className="text-slate-400"/>}
                             </div>
                             <div className={`text-3xl font-black ${item.value < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                ₪{item.value.toLocaleString()}
                             </div>
                             {item.lastUpdated && (
                                 <p className="text-xs text-slate-400 mt-3 font-medium bg-slate-50 inline-block px-2 py-1 rounded-lg">
                                     עודכן: {new Date(item.lastUpdated).toLocaleDateString('he-IL')}
                                 </p>
                             )}
                         </div>
                    </div>
                ))}
             </div>
          )}
        </div>

        {/* Inline Add Form */}
        {isAddOpen && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 md:p-8 animate-fade-in shadow-sm">
                <h3 className="text-xl font-black text-emerald-800 mb-6 flex items-center gap-2">
                    <Plus className="bg-emerald-200 text-emerald-700 p-1 rounded-lg" size={28} />
                    הוספת חשבון חדש
                </h3>
                
                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">שם החשבון / בנק</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition text-lg shadow-sm"
                                placeholder="לדוגמה: עו״ש פועלים"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">סוג חשבון</label>
                            <div className="relative">
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as any)}
                                    className="w-full p-4 bg-white border border-emerald-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none transition text-lg appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="checking">עובר ושב (עו״ש)</option>
                                    <option value="emergency">קרן ביטחון / חירום</option>
                                    <option value="savings">פיקדון / חיסכון קצר מועד</option>
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">יתרה נוכחית (₪)</label>
                            <div className="relative">
                                <NumberInput
                                    value={newValue}
                                    onChange={(val) => setNewValue(val.toString())}
                                    className="w-full p-4 pl-12 bg-white border border-emerald-100 rounded-2xl text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none transition font-black text-xl shadow-sm placeholder-emerald-200"
                                    placeholder="0"
                                    required
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-300">₪</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-200 transition transform hover:-translate-y-1"
                        >
                            <Save size={20} />
                            שמור חשבון
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
                <h3 className="font-black text-2xl text-slate-800 mb-2">מחיקת חשבון</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">האם אתם בטוחים שברצונכם למחוק את החשבון? הפעולה הזו תמחק גם את היסטוריית המעקב שלו.</p>
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

export default AccountsTab;
