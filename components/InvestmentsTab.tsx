
import React, { useState } from 'react';
import { InvestmentItem, BaseItem, HistoryEntry, InvestmentHolding, CurrencyType } from '../types';
import { Plus, Trash2, TrendingUp, BarChart, Bitcoin, FileText, Activity, ArrowRight, Percent, X, Edit2, AlertCircle, Layers, Save, ShoppingCart, DollarSign } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface InvestmentsTabProps {
  items: InvestmentItem[];
  onAdd: (item: InvestmentItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
  // Passed from App
  profiles: any[];
  activeProfileId: string;
}

const InvestmentsTab: React.FC<InvestmentsTabProps> = ({ items, onAdd, onRemove, onUpdate, onUpdateDetails, onBack, profiles, activeProfileId }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvestmentItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<InvestmentItem['type']>('trading_account');
  const [customType, setCustomType] = useState('');
  const [fee, setFee] = useState('');
  const [track, setTrack] = useState('');
  
  // New holdings state for adding
  const [holdings, setHoldings] = useState<InvestmentHolding[]>([]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = type === 'other' && customType ? customType : name;
    if (!finalName) return;

    onAdd({
      id: Date.now().toString(),
      name: finalName,
      value: Number(value),
      type,
      managementFeeAccumulation: Number(fee),
      track: type === 'provident_fund_investment' ? track : undefined,
      holdings: type === 'trading_account' ? holdings : [],
      history: [{ 
          date: new Date().toISOString().split('T')[0], 
          value: Number(value),
          track: type === 'provident_fund_investment' ? track : undefined
      }]
    });

    setName('');
    setValue('');
    setFee('');
    setCustomType('');
    setTrack('');
    setHoldings([]);
    setIsAddOpen(false);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const openItem = (item: InvestmentItem) => {
      setSelectedItem(item);
  };

  const addHolding = () => {
      setHoldings([...holdings, { 
          id: Date.now().toString(), 
          symbol: '', 
          name: '', 
          units: 0, 
          currency: 'AGOROT', // Default to AGOROT
          buyPrice: 0, 
          currentPrice: 0 
      }]);
  };

  const updateHolding = (id: string, field: keyof InvestmentHolding, val: any) => {
      const updated = holdings.map(h => h.id === id ? { ...h, [field]: val } : h);
      setHoldings(updated);
      
      // Auto update total value based on sum of current holdings (converted to ILS)
      const total = updated.reduce((sum, h) => {
          let multiplier = 1;
          if (h.currency === 'USD') multiplier = 3.65;
          if (h.currency === 'EUR') multiplier = 4.0;
          if (h.currency === 'AGOROT') multiplier = 0.01;
          
          return sum + (h.units * h.currentPrice * multiplier);
      }, 0);
      
      if (total > 0) setValue(total.toFixed(0));
  };

  const removeHolding = (id: string) => {
      setHoldings(holdings.filter(h => h.id !== id));
  };

  const getTypeIcon = (type: InvestmentItem['type']) => {
      switch(type) {
          case 'crypto': return <Bitcoin size={24} />;
          case 'trading_account': return <Activity size={24} />;
          case 'managed_portfolio': return <FileText size={24} />;
          case 'provident_fund_investment': return <BarChart size={24} />;
          default: return <TrendingUp size={24} />;
      }
  };

  const getTypeLabel = (type: InvestmentItem['type']) => {
      switch(type) {
          case 'trading_account': return 'חשבון מסחר עצמאי';
          case 'managed_portfolio': return 'תיק מנוהל';
          case 'provident_fund_investment': return 'קופת גמל להשקעה';
          case 'crypto': return 'קריפטו / דיגיטלי';
          case 'other': return 'אחר';
          default: return 'נכס';
      }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

  // If viewing details, show Detail View
  if (selectedItem) {
      return (
          <AssetModal 
            item={selectedItem} 
            category="investments"
            isOpen={true}
            onClose={() => setSelectedItem(null)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel="נכס השקעה"
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
                 <h2 className="text-3xl font-black text-slate-800">תיק השקעות</h2>
                 <p className="text-slate-500">מניות, ניירות ערך, קריפטו וגמל להשקעה</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddOpen(!isAddOpen)}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition transform hover:-translate-y-1 ${isAddOpen ? 'bg-slate-200 text-slate-600' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'}`}
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
               <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">תיק ההשקעות ריק.</p>
               <button onClick={() => setIsAddOpen(true)} className="mt-4 text-purple-600 font-bold hover:underline">לחץ להוספת נכס ראשון</button>
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
                             <div className={`p-4 rounded-2xl ${item.type === 'crypto' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                                 {getTypeIcon(item.type)}
                             </div>
                             <div className="flex gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition"><Edit2 size={18} /></button>
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
                             <h3 className="text-xl font-bold text-slate-700 mb-1">{item.name}</h3>
                             <p className="text-xs text-slate-400 mb-4 bg-slate-50 px-2 py-1 rounded-lg inline-block font-medium">{getTypeLabel(item.type)}</p>
                             
                             {item.track && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded mb-2 w-fit">
                                    <Layers size={10} />
                                    <span>{item.track}</span>
                                </div>
                             )}

                             <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                                <div>
                                    {item.managementFeeAccumulation !== undefined && item.managementFeeAccumulation > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                            <Percent size={10} />
                                            <span>{item.managementFeeAccumulation}% עמלה</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-3xl font-black text-slate-800">
                                    ₪{item.value.toLocaleString()}
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
            <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-6 md:p-8 animate-fade-in shadow-sm">
                <h3 className="text-xl font-black text-purple-800 mb-6 flex items-center gap-2">
                    <Plus className="bg-purple-200 text-purple-700 p-1 rounded-lg" size={28} />
                    הוספת נכס השקעה
                </h3>
                
                <form onSubmit={handleAdd} className="space-y-6">
                    {/* ... Form Content Identical to previous turn ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">סוג הנכס</label>
                            <div className="relative">
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full p-4 bg-white border border-purple-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition text-lg appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="trading_account">חשבון מסחר עצמאי</option>
                                    <option value="managed_portfolio">תיק מנוהל / פוליסת חיסכון</option>
                                    <option value="provident_fund_investment">קופת גמל להשקעה</option>
                                    <option value="crypto">קריפטו / מטבעות דיגיטליים</option>
                                    <option value="other">אחר (טקסט חופשי)</option>
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">שם הנכס / הפלטפורמה</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-4 bg-white border border-purple-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition text-lg shadow-sm"
                                placeholder={type === 'other' ? 'הכנס שם...' : 'לדוגמה: אקסלנס טרייד / ביטקוין'}
                                required={type !== 'other'}
                            />
                        </div>
                    </div>

                    {type === 'provident_fund_investment' && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">מסלול השקעה</label>
                            <input
                                type="text"
                                value={track}
                                onChange={(e) => setTrack(e.target.value)}
                                className="w-full p-3 bg-white border border-purple-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                placeholder="לדוגמה: מחקה מדד S&P 500"
                            />
                        </div>
                    )}

                    {type === 'other' && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">פירוט סוג הנכס</label>
                            <input
                                type="text"
                                value={customType}
                                onChange={(e) => setCustomType(e.target.value)}
                                className="w-full p-3 bg-white border border-purple-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition shadow-sm"
                                placeholder="לדוגמה: הלוואת חברתיות / נכס אלטרנטיבי"
                            />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">שווי נוכחי (בשקלים)</label>
                            <div className="relative">
                                <NumberInput
                                    value={value}
                                    onChange={(val) => setValue(val.toString())}
                                    className="w-full p-4 pl-12 bg-white border border-purple-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition font-black text-xl shadow-sm"
                                    placeholder="0"
                                    required
                                    readOnly={type === 'trading_account' && holdings.length > 0}
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-purple-400">₪</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">דמי ניהול שנתיים (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={fee}
                                    onChange={(e) => setFee(e.target.value)}
                                    className="w-full p-4 pl-12 bg-white border border-purple-100 rounded-2xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition font-medium text-lg shadow-sm"
                                    placeholder="0.0"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-purple-400">%</span>
                            </div>
                        </div>
                    </div>

                    {type === 'trading_account' && (
                        <div className="bg-white p-6 rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <label className="block text-lg font-bold text-slate-800">פירוט החזקות (אופציונלי)</label>
                                    <p className="text-xs text-slate-500">ניתן להוסיף ניירות ספציפיים למעקב</p>
                                </div>
                                <button type="button" onClick={addHolding} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 flex items-center gap-2 font-bold transition">
                                    <Plus size={18}/> הוסף נייר
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                {/* Header Row */}
                                {holdings.length > 0 && (
                                    <div className="grid grid-cols-12 gap-3 mb-3 text-xs font-bold text-slate-500 px-2 min-w-[900px]">
                                        <div className="col-span-2">סימול</div>
                                        <div className="col-span-2">שם</div>
                                        <div className="col-span-1">מטבע</div>
                                        <div className="col-span-1">כמות</div>
                                        <div className="col-span-1">מחיר קניה</div>
                                        <div className="col-span-1">מחיר נוכחי</div>
                                        <div className="col-span-2 text-center">רווח/הפסד</div>
                                        <div className="col-span-2">שווי</div>
                                    </div>
                                )}

                                <div className="min-w-[900px] space-y-2">
                                    {holdings.map((h, idx) => {
                                        let multiplier = 1;
                                        if (h.currency === 'USD') multiplier = 3.65;
                                        if (h.currency === 'EUR') multiplier = 4.0;
                                        if (h.currency === 'AGOROT') multiplier = 0.01;

                                        const val = h.units * h.currentPrice * multiplier;
                                        const buyVal = h.units * h.buyPrice * multiplier;
                                        const profit = val - buyVal;
                                        const weight = Number(value) > 0 ? (val / Number(value)) * 100 : 0;

                                        return (
                                        <div key={h.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm relative group">
                                            <div className="col-span-2">
                                                <input type="text" placeholder="סימול" className="w-full p-2 text-sm border border-slate-200 rounded-lg" value={h.symbol} onChange={e => updateHolding(h.id, 'symbol', e.target.value)} />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="text" placeholder="שם" className="w-full p-2 text-sm border border-slate-200 rounded-lg" value={h.name} onChange={e => updateHolding(h.id, 'name', e.target.value)} />
                                            </div>
                                            <div className="col-span-1">
                                                <select value={h.currency} onChange={e => updateHolding(h.id, 'currency', e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-white">
                                                    <option value="AGOROT">אג'</option>
                                                    <option value="USD">$</option>
                                                    <option value="EUR">€</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <NumberInput placeholder="0" className="w-full p-2 text-sm border border-slate-200 rounded-lg font-mono" value={h.units} onChange={val => updateHolding(h.id, 'units', val)} />
                                            </div>
                                            <div className="col-span-1">
                                                <NumberInput placeholder="0" className="w-full p-2 text-sm border border-slate-200 rounded-lg font-mono" value={h.buyPrice} onChange={val => updateHolding(h.id, 'buyPrice', val)} />
                                            </div>
                                            <div className="col-span-1">
                                                <NumberInput placeholder="0" className="w-full p-2 text-sm border border-purple-200 bg-purple-50/50 rounded-lg font-mono font-bold" value={h.currentPrice} onChange={val => updateHolding(h.id, 'currentPrice', val)} />
                                            </div>
                                            <div className={`col-span-2 text-sm font-mono font-bold text-center ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {profit > 0 ? '+' : ''}{profit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                            </div>
                                            <div className="col-span-2 flex justify-between items-center pl-2">
                                                <div className="flex flex-col leading-none">
                                                    <span className="text-sm font-bold text-slate-800">{formatCurrency(val)}</span>
                                                    <span className="text-[10px] text-slate-400">{weight.toFixed(1)}%</span>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeHolding(h.id)}
                                                    className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-200 transition transform hover:-translate-y-1"
                        >
                            <Save size={20} />
                            הוסף לתיק
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* Excellence Trade Banner - Moved to Bottom */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h3 className="text-xl font-bold mb-2 text-emerald-400">פתחת כבר חשבון מסחר עצמאי?</h3>
                <ul className="text-sm space-y-1 text-slate-300">
                    <li>✓ פטור מדמי חשבון לשנתיים (ולאחר מכן 15 ₪ בחודש שמתקזזים עם עמלות)</li>
                    <li>✓ עמלות מסחר: 0.07% בלבד (מינימום 3 ₪ לפעולה)</li>
                    <li>✓ 100 ₪ מתנת הצטרפות</li>
                    <li>✓ מינימום 15,000 ₪ לפתיחת חשבון</li>
                </ul>
                <div className="text-white/80 text-[10px] mt-2">* גילוי נאות: כלקוח קיים אני מתוגמל על הפניה זו.</div>
            </div>
            <a 
                href="https://xnestrade.xnes.co.il/page/101?customerCode=6abde1d2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-900/50 transition whitespace-nowrap"
            >
                לפתיחת חשבון באקסלנס טרייד
            </a>
        </div>

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

export default InvestmentsTab;
