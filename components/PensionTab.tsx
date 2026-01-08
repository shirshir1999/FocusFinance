
import React, { useState, useEffect } from 'react';
import { PensionItem, BaseItem, HistoryEntry } from '../types';
import { Plus, Trash2, Umbrella, BarChart2, User, ArrowRight, Percent, Layers, AlertCircle, X, Save, BookOpen, ExternalLink, GraduationCap, FileText } from 'lucide-react';
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
  profiles: any[];
  activeProfileId: string;
}

const PensionTab: React.FC<PensionTabProps> = ({ items, initialType, onAdd, onRemove, onUpdate, onUpdateDetails, onBack, profiles, activeProfileId }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
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
    setIsAddOpen(false);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const openItem = (item: PensionItem) => {
      setSelectedItem(item);
  };

  // Inline Detail View
  if (selectedItem) {
      return (
          <AssetModal 
            item={selectedItem} 
            category="pensions"
            isOpen={true} 
            onClose={() => setSelectedItem(null)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel={selectedItem.type === 'pension' ? 'קרן פנסיה' : selectedItem.type === 'study_fund' ? 'קרן השתלמות' : 'קופת גמל'}
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
                 <h2 className="text-3xl font-black text-slate-800">פנסיה וגמל</h2>
                 <p className="text-slate-500">ניהול עתיד פיננסי</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddOpen(!isAddOpen)}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition transform hover:-translate-y-1 ${isAddOpen ? 'bg-slate-200 text-slate-600' : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-200'}`}
          >
              {isAddOpen ? <X size={20} /> : <Plus size={20} />}
              <span className="hidden md:inline">{isAddOpen ? 'ביטול הוספה' : 'הוסף קופה חדשה'}</span>
          </button>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List */}
        <div className="space-y-4">
          {items.length === 0 && !isAddOpen ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
              <Umbrella size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">רשימת המוצרים הפנסיוניים ריקה.</p>
              <button onClick={() => setIsAddOpen(true)} className="mt-4 text-cyan-600 font-bold hover:underline">לחץ להוספת קופה ראשונה</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <div 
                    key={item.id} 
                    onClick={() => openItem(item)}
                    className={`bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between relative`}
                >
                    <div className="flex justify-between items-start mb-4">
                         <div className={`p-4 rounded-2xl ${item.type === 'pension' ? 'bg-cyan-50 text-cyan-600' : item.type === 'study_fund' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                            {item.type === 'pension' ? <User size={24}/> : <BarChart2 size={24}/>}
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
                        <div className="flex flex-wrap gap-2 mb-6">
                           <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-medium">{item.type === 'pension' ? 'פנסיה' : item.type === 'study_fund' ? 'השתלמות' : 'קופת גמל'}</span>
                        </div>
                        
                        <div className="space-y-4 border-t border-slate-50 pt-4">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Layers size={14} />
                                    <span>מסלול</span>
                                </div>
                                <span className="font-bold bg-slate-50 px-2 py-1 rounded text-slate-700">{item.track || 'כללי'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Percent size={14} />
                                    <span>דמי ניהול</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="font-medium bg-slate-50 px-2 py-1 rounded">
                                        {item.managementFeeAccumulation || 0}%
                                        {item.type === 'pension' && ` / ${item.managementFeeDeposit || 0}%`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end pt-2">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">הפקדה חודשית</p>
                                    <p className="text-sm font-bold text-slate-600">₪{item.monthlyDeposit.toLocaleString()}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-slate-400 mb-1">צבירה כוללת</p>
                                    <p className="text-2xl font-black text-slate-800">₪{item.value.toLocaleString()}</p>
                                </div>
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
            <div className="bg-cyan-50/50 border border-cyan-100 rounded-3xl p-6 md:p-8 animate-fade-in shadow-sm">
                <h3 className="text-xl font-black text-cyan-800 mb-6 flex items-center gap-2">
                    <Plus className="bg-cyan-200 text-cyan-700 p-1 rounded-lg" size={28} />
                    הוספת מוצר פנסיוני
                </h3>
                
                <form onSubmit={handleAdd} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">סוג המוצר</label>
                            <div className="relative">
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full p-4 bg-white border border-cyan-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition text-lg appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="pension">קרן פנסיה</option>
                                    <option value="study_fund">קרן השתלמות</option>
                                    <option value="provident_fund">קופת גמל (רגילה/פיצויים)</option>
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">שם הגוף המנהל</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-4 bg-white border border-cyan-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition text-lg shadow-sm"
                                placeholder="לדוגמה: מנורה מבטחים / אלטשולר שחם"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">יתרה נוכחית (צבירה)</label>
                            <div className="relative">
                                <NumberInput
                                    value={value}
                                    onChange={(val) => setValue(val.toString())}
                                    className="w-full p-4 pl-12 bg-white border border-cyan-100 rounded-2xl text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none transition font-black text-xl shadow-sm"
                                    placeholder="0"
                                    required
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-cyan-300">₪</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">הפקדה חודשית (עובד+מעסיק)</label>
                            <div className="relative">
                                <NumberInput
                                    value={monthlyDeposit}
                                    onChange={(val) => setMonthlyDeposit(val.toString())}
                                    className="w-full p-4 pl-12 bg-white border border-cyan-100 rounded-2xl text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none transition font-black text-xl shadow-sm"
                                    placeholder="0"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-cyan-300">₪</span>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2 md:col-span-3">
                            <label className="text-sm font-bold text-slate-700">מסלול השקעה</label>
                            <input
                                list="tracks"
                                value={track}
                                onChange={(e) => setTrack(e.target.value)}
                                className="w-full p-3 bg-white border border-cyan-100 rounded-2xl text-slate-700 focus:ring-2 focus:ring-cyan-500 outline-none transition shadow-sm"
                                placeholder="הקלידו או בחרו (לדוגמה: מניות / S&P 500)"
                            />
                            <datalist id="tracks">
                                <option value="כללי" />
                                <option value="מניות" />
                                <option value="מחקה מדד S&P 500" />
                                <option value="אג״ח" />
                                <option value="הלכה" />
                            </datalist>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">דמי ניהול מצבירה (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={feeAcc}
                                onChange={(e) => setFeeAcc(e.target.value)}
                                className="w-full p-3 bg-white border border-cyan-100 rounded-xl text-slate-700 focus:ring-2 focus:ring-cyan-500 outline-none transition font-medium shadow-sm"
                                placeholder="0.5"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">דמי ניהול מהפקדה (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={feeDep}
                                onChange={(e) => setFeeDep(e.target.value)}
                                className="w-full p-3 bg-white border border-cyan-100 rounded-xl text-slate-700 focus:ring-2 focus:ring-cyan-500 outline-none transition font-medium shadow-sm"
                                placeholder="1.5"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-200 transition transform hover:-translate-y-1"
                        >
                            <Save size={20} />
                            הוסף לתיק
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* --- KNOWLEDGE SECTION --- */}
        <div className="pt-8 border-t border-slate-200/60">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <BookOpen className="text-cyan-500" size={24} />
                ידע זה כוח - מדריכים מקצועיים
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <a 
                    href="https://www.shirfinance.com/%D7%9E%D7%90%D7%9E%D7%A8%D7%99%D7%9D/%D7%A4%D7%A0%D7%A1%D7%99%D7%94-%D7%93%D7%91%D7%A8%D7%99%D7%9D-%D7%A9%D7%9B%D7%93%D7%90%D7%99-%D7%9C%D7%93%D7%A2%D7%AA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition group flex flex-col justify-between h-full"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-cyan-100 text-cyan-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Umbrella size={10}/> פנסיה</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-cyan-700 transition-colors">פנסיה: דברים שכדאי לדעת</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            כנראה ההשקעה החשובה והארוכה ביותר לכל אחד מאיתנו. איך בוחרים מסלול נכון? ואיך מוודאים שהכיסוי הביטוחי מתאים לצרכים?
                        </p>
                    </div>
                    <div className="mt-4 flex items-center text-cyan-600 text-sm font-bold gap-1">
                        קראו עוד באתר <ExternalLink size={14} />
                    </div>
                </a>

                <a 
                    href="https://www.shirfinance.com/%D7%9E%D7%90%D7%9E%D7%A8%D7%99%D7%9D/%D7%A7%D7%A8%D7%9F-%D7%94%D7%A9%D7%AA%D7%9C%D7%9E%D7%95%D7%AA" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition group flex flex-col justify-between h-full"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><GraduationCap size={10}/> קרן השתלמות</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-amber-700 transition-colors">המוצר הטוב ביותר למשקיע?</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            קרן השתלמות היא מתנה מהמדינה ואפיק החיסכון היחיד שפטור ממס רווח הון. למה כדאי להפוך עולמות כדי להפקיד אליה?
                        </p>
                    </div>
                    <div className="mt-4 flex items-center text-amber-600 text-sm font-bold gap-1">
                        קראו עוד באתר <ExternalLink size={14} />
                    </div>
                </a>

                 <a 
                    href="https://www.shirfinance.com/%D7%9E%D7%90%D7%9E%D7%A8%D7%99%D7%9D/allaboutfees" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-rose-200 transition group flex flex-col justify-between h-full"
                >
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><FileText size={10}/> עמלות</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-rose-700 transition-colors">דמי ניהול, עמלות ומיסים</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            אף אחד לא עובד בחינם. בפוסט זה אפרט מה לוקחים, איך לוקחים, מה טוב, מה רע ומה מוגזם בתחום הפנסיוני.
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
                <h3 className="font-black text-2xl text-slate-800 mb-2">מחיקת מוצר</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">האם אתם בטוחים שברצונכם למחוק את המוצר הפנסיוני הזה מהתיק?</p>
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

export default PensionTab;
