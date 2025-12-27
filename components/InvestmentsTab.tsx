import React, { useState } from 'react';
import { InvestmentItem, BaseItem, HistoryEntry, InvestmentHolding, CurrencyType } from '../types';
import { Plus, Trash2, TrendingUp, BarChart, Bitcoin, FileText, Activity, ArrowRight, Percent, X, Edit2, AlertCircle, Layers } from 'lucide-react';
import AssetModal from './AssetModal';
import NumberInput from './NumberInput';

interface InvestmentsTabProps {
  items: InvestmentItem[];
  onAdd: (item: InvestmentItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, item: BaseItem) => void;
  onBack: () => void;
}

const InvestmentsTab: React.FC<InvestmentsTabProps> = ({ items, onAdd, onRemove, onUpdate, onUpdateDetails, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
        onRemove(confirmDeleteId);
        setConfirmDeleteId(null);
    }
  };

  const openItem = (item: InvestmentItem) => {
      setSelectedItem(item);
      setIsModalOpen(true);
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
          case 'crypto': return <Bitcoin size={20} />;
          case 'trading_account': return <Activity size={20} />;
          case 'managed_portfolio': return <FileText size={20} />;
          case 'provident_fund_investment': return <BarChart size={20} />;
          default: return <TrendingUp size={20} />;
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

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition text-slate-500">
                <ArrowRight size={20} />
            </button>
            <div>
                 <h2 className="text-3xl font-black text-slate-800">תיק השקעות</h2>
                 <p className="text-slate-500">מניות, ניירות ערך, קריפטו וגמל להשקעה</p>
            </div>
          </div>
       </div>

      <div className="flex flex-col gap-8">
        
        {/* List (Top) */}
        <div className="space-y-4">
          {items.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
               <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
               <p className="text-lg">תיק ההשקעות ריק.</p>
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
                             <div className={`p-3 rounded-xl ${item.type === 'crypto' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                                 {getTypeIcon(item.type)}
                             </div>
                             <div className="flex gap-2 relative z-10">
                                <button type="button" className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition"><Edit2 size={16} /></button>
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
                             <h3 className="font-bold text-slate-700 mb-1">{item.name}</h3>
                             <p className="text-xs text-slate-400 mb-2">{getTypeLabel(item.type)}</p>
                             
                             {item.track && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded mb-2 w-fit">
                                    <Layers size={10} />
                                    <span>{item.track}</span>
                                </div>
                             )}

                             <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                                <div>
                                    {item.managementFeeAccumulation !== undefined && item.managementFeeAccumulation > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                            <Percent size={10} />
                                            <span>{item.managementFeeAccumulation}% עמלה</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-2xl font-black text-slate-800">
                                    ₪{item.value.toLocaleString()}
                                </div>
                             </div>
                         </div>
                    </div>
               ))}
            </div>
          )}
        </div>

        {/* Form (Bottom) */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl h-fit shadow-sm max-w-5xl">
          <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
            <Plus size={20} className="text-purple-500"/>
            הוסף נכס
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-500 mb-2">סוג הנכס</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition"
              >
                <option value="trading_account">חשבון מסחר עצמאי</option>
                <option value="managed_portfolio">תיק מנוהל</option>
                <option value="provident_fund_investment">קופת גמל להשקעה</option>
                <option value="crypto">קריפטו / מטבעות דיגיטליים</option>
                <option value="other">אחר (טקסט חופשי)</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-500 mb-2">שם הנכס / בית השקעות</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition"
                placeholder={type === 'other' ? 'הכנס שם...' : 'לדוגמה: אקסלנס טרייד / ביטקוין'}
                required={type !== 'other'}
              />
            </div>

            {type === 'provident_fund_investment' && (
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-500 mb-2">מסלול השקעה</label>
                    <input
                        type="text"
                        value={track}
                        onChange={(e) => setTrack(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition"
                        placeholder="לדוגמה: מחקה מדד S&P 500"
                    />
                </div>
            )}

            {type === 'other' && (
                 <div className="lg:col-span-4">
                    <label className="block text-sm font-medium text-slate-500 mb-2">פירוט סוג הנכס</label>
                    <input
                        type="text"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition"
                        placeholder="לדוגמה: הלוואת חברתיות / נכס אלטרנטיבי"
                    />
                </div>
            )}
            
            <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-500 mb-2">שווי נוכחי (₪)</label>
                <NumberInput
                    value={value}
                    onChange={(val) => setValue(val.toString())}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition"
                    placeholder="0"
                    required
                    readOnly={type === 'trading_account' && holdings.length > 0}
                />
            </div>

            <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-500 mb-2">דמי ניהול (%)</label>
                <input
                    type="number"
                    step="0.01"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none transition"
                    placeholder="0.0"
                />
            </div>

            {type === 'trading_account' && (
                <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                    <div className="flex justify-between items-center mb-4 min-w-[800px]">
                        <label className="block text-sm font-bold text-slate-700">פירוט החזקות (אופציונלי)</label>
                        <button type="button" onClick={addHolding} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 flex items-center gap-1 font-bold">
                            <Plus size={14}/> הוסף נייר
                        </button>
                    </div>
                    
                    {/* Header Row */}
                    {holdings.length > 0 && (
                        <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-slate-500 px-2 min-w-[800px]">
                            <div className="col-span-2">סימול</div>
                            <div className="col-span-2">שם</div>
                            <div className="col-span-1">מטבע</div>
                            <div className="col-span-1">כמות יחידות</div>
                            <div className="col-span-1">שער קנייה</div>
                            <div className="col-span-1">שער נוכחי</div>
                            <div className="col-span-2">רווח/הפסד (₪)</div>
                            <div className="col-span-2">שווי (% תיק)</div>
                        </div>
                    )}

                    <div className="min-w-[800px]">
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
                        <div key={h.id} className="grid grid-cols-12 gap-2 mb-2 items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm relative group">
                            <div className="col-span-2">
                                <input type="text" placeholder="סימול" className="w-full p-1 text-xs border rounded" value={h.symbol} onChange={e => updateHolding(h.id, 'symbol', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <input type="text" placeholder="שם" className="w-full p-1 text-xs border rounded" value={h.name} onChange={e => updateHolding(h.id, 'name', e.target.value)} />
                            </div>
                            <div className="col-span-1">
                                <select value={h.currency} onChange={e => updateHolding(h.id, 'currency', e.target.value)} className="w-full p-1 text-xs border rounded bg-slate-50">
                                    <option value="AGOROT">אג' - אגורות</option>
                                    <option value="USD">$ - דולר</option>
                                    <option value="EUR">€ - אירו</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <NumberInput placeholder="כמות" className="w-full p-1 text-xs border rounded" value={h.units} onChange={val => updateHolding(h.id, 'units', val)} />
                            </div>
                            <div className="col-span-1">
                                <NumberInput placeholder="קניה" className="w-full p-1 text-xs border rounded" value={h.buyPrice} onChange={val => updateHolding(h.id, 'buyPrice', val)} />
                            </div>
                            <div className="col-span-1">
                                <NumberInput placeholder="נוכחי" className="w-full p-1 text-xs border rounded font-bold bg-slate-50" value={h.currentPrice} onChange={val => updateHolding(h.id, 'currentPrice', val)} />
                            </div>
                            <div className={`col-span-2 text-xs font-mono font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {profit > 0 ? '+' : ''}{profit.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                            <div className="col-span-2 flex justify-between items-center">
                                <div className="flex flex-col leading-none">
                                    <span className="text-xs font-bold text-slate-800">{formatCurrency(val)}</span>
                                    <span className="text-[10px] text-slate-400">{weight.toFixed(1)}%</span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => removeHolding(h.id)}
                                    className="text-slate-300 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )})}
                    </div>
                </div>
            )}

            <button
              type="submit"
              className="lg:col-span-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-200 mt-2"
            >
              <Plus size={20} />
              הוסף לתיק
            </button>
          </form>
        </div>

        {/* Excellence Trade Banner */}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all scale-100">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                    <div className="p-3 bg-red-50 rounded-full">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">מחיקת נכס</h3>
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
            category="investments"
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onUpdateValue={onUpdate}
            onUpdateDetails={onUpdateDetails}
            typeLabel="נכס השקעה"
          />
      )}
    </div>
  );
};

export default InvestmentsTab;