import React, { useState, useEffect } from 'react';
import { BaseItem, HistoryEntry, PensionItem, InvestmentItem, RealEstateItem, AccountItem, AssetCategory, MortgageTrack, InvestmentHolding } from '../types';
import { X, Save, TrendingUp, Calendar, History, Settings, Edit3, Plus, Trash2, Home, CreditCard, Percent, Table, Edit2, Check, AlertCircle, PlusCircle, MinusCircle, DollarSign, ShoppingCart, GripHorizontal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import NumberInput from './NumberInput';

interface AssetModalProps {
  item: BaseItem;
  category: AssetCategory;
  isOpen: boolean;
  onClose: () => void;
  onUpdateValue: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, updatedItem: BaseItem) => void;
  typeLabel: string;
}

const AssetModal: React.FC<AssetModalProps> = ({ item, category, isOpen, onClose, onUpdateValue, onUpdateDetails, typeLabel }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'settings'>('manage');
  
  // --- STATE: Management (Update & Holdings) ---
  const [newValue, setNewValue] = useState(item.value.toString());
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Context Updates (Track/Company change during update)
  const [newTrack, setNewTrack] = useState((item as PensionItem).track || (item as InvestmentItem).track || '');
  const [newCompany, setNewCompany] = useState((item as PensionItem).managementCompany || '');

  // Investment Holdings State
  const [holdings, setHoldings] = useState<InvestmentHolding[]>([]);
  
  // Transaction State
  const [transactingHolding, setTransactingHolding] = useState<string | null>(null);
  const [transType, setTransType] = useState<'buy' | 'sell'>('buy');
  const [transUnits, setTransUnits] = useState('');
  const [transPrice, setTransPrice] = useState(''); 

  // --- STATE: Settings (Static Details) ---
  const [editName, setEditName] = useState(item.name);
  
  // Specific Fields
  const [editDeposit, setEditDeposit] = useState((item as PensionItem).monthlyDeposit?.toString() || '');
  const [editFeeAcc, setEditFeeAcc] = useState((item as PensionItem).managementFeeAccumulation?.toString() || (item as InvestmentItem).managementFeeAccumulation?.toString() || '');
  const [editFeeDep, setEditFeeDep] = useState((item as PensionItem).managementFeeDeposit?.toString() || '');
  const [editAddress, setEditAddress] = useState((item as RealEstateItem).address || '');
  const [editRent, setEditRent] = useState((item as RealEstateItem).monthlyRent?.toString() || '');
  const [editBank, setEditBank] = useState((item as RealEstateItem).mortgageBank || '');
  const [mortgageTracks, setMortgageTracks] = useState<MortgageTrack[]>([]);

  // Local History (Immediate UI update)
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>([]);
  const [editingHistoryIndex, setEditingHistoryIndex] = useState<number | null>(null);
  const [editHistoryValue, setEditHistoryValue] = useState<string>('');
  const [editHistoryDate, setEditHistoryDate] = useState<string>('');
  const [confirmDeleteHistoryIndex, setConfirmDeleteHistoryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
        // Reset Management State
        setNewValue(item.value.toString());
        setUpdateDate(new Date().toISOString().split('T')[0]);
        setNewTrack((item as PensionItem).track || (item as InvestmentItem).track || '');
        setNewCompany((item as PensionItem).managementCompany || '');

        // Reset Settings State
        setEditName(item.name);
        setEditDeposit((item as PensionItem).monthlyDeposit?.toString() || '');
        setEditFeeAcc((item as PensionItem).managementFeeAccumulation?.toString() || (item as InvestmentItem).managementFeeAccumulation?.toString() || '');
        setEditFeeDep((item as PensionItem).managementFeeDeposit?.toString() || '');
        setEditAddress((item as RealEstateItem).address || '');
        setEditRent((item as RealEstateItem).monthlyRent?.toString() || '');
        setEditBank((item as RealEstateItem).mortgageBank || '');

        // Complex Data
        if (category === 'realEstate') {
            setMortgageTracks((item as RealEstateItem).mortgageTracks || []);
        }
        if (category === 'investments') {
            setHoldings((item as InvestmentItem).holdings || []);
        } else {
            setHoldings([]);
        }
        
        setLocalHistory(item.history || []);
        setActiveTab('manage');
        setTransactingHolding(null);
    }
  }, [isOpen, item, category]);

  // --- Auto-Calculate Value from Holdings ---
  useEffect(() => {
      if (category === 'investments' && holdings.length > 0) {
          const totalVal = holdings.reduce((sum, h) => {
              let multiplier = 1;
              if (h.currency === 'USD') multiplier = 3.65;
              if (h.currency === 'EUR') multiplier = 4.0;
              if (h.currency === 'AGOROT') multiplier = 0.01;
              return sum + (h.units * h.currentPrice * multiplier);
          }, 0);

          // Update the "New Value" field automatically
          setNewValue(totalVal.toFixed(0));
      }
  }, [holdings, category]);

  if (!isOpen) return null;

  // --- Mortgage Logic (Settings) ---
  const addTrack = () => setMortgageTracks([...mortgageTracks, { id: Date.now().toString(), name: '', type: 'kalatz', originalAmount: 0, balance: 0, yearsTotal: 25, yearsRemaining: 25, interestRate: 0, monthlyPayment: 0 }]);
  const removeTrack = (id: string) => setMortgageTracks(mortgageTracks.filter(t => t.id !== id));
  const updateTrack = (id: string, field: keyof MortgageTrack, value: any) => {
      const updated = mortgageTracks.map(t => {
          if(t.id !== id) return t;
          const newTrack = { ...t, [field]: value };
          if (['balance', 'yearsRemaining', 'interestRate'].includes(field)) {
              const P = field === 'balance' ? Number(value) : t.balance;
              const years = field === 'yearsRemaining' ? Number(value) : t.yearsRemaining;
              const rate = field === 'interestRate' ? Number(value) : t.interestRate;
              if (P > 0 && years > 0) {
                  const r = rate / 100 / 12;
                  const n = years * 12;
                  let pmt = r === 0 ? P / n : P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                  newTrack.monthlyPayment = Math.round(pmt);
              }
          }
          return newTrack;
      });
      setMortgageTracks(updated);
  };

  // --- Holdings Logic (Management) ---
  const addHolding = () => setHoldings([...holdings, { id: Date.now().toString(), symbol: '', name: '', units: 0, currency: 'ILS', buyPrice: 0, currentPrice: 0 }]);
  const removeHolding = (id: string) => setHoldings(holdings.filter(h => h.id !== id));
  const updateHolding = (id: string, field: keyof InvestmentHolding, value: any) => setHoldings(holdings.map(h => h.id === id ? { ...h, [field]: value } : h));

  // --- Transaction Logic ---
  const openTransaction = (id: string, type: 'buy' | 'sell') => {
      setTransactingHolding(id);
      setTransType(type);
      setTransUnits('');
      setTransPrice('');
  };
  const submitTransaction = () => {
    if (!transactingHolding) return;
    const holding = holdings.find(h => h.id === transactingHolding);
    if (!holding) return;
    const tUnits = Number(transUnits);
    const tPrice = Number(transPrice); 
    if (isNaN(tUnits) || tUnits <= 0) return;
    let newUnits = holding.units;
    let newBuyPrice = holding.buyPrice;
    
    if (transType === 'buy') {
        const totalOldCost = holding.units * holding.buyPrice;
        const totalNewCost = tUnits * tPrice;
        newUnits = holding.units + tUnits;
        if (newUnits > 0) newBuyPrice = (totalOldCost + totalNewCost) / newUnits;
    } else {
        // Sell logic (FIFO is implicit in simple tracking by reducing count but keeping avg cost)
        newUnits = Math.max(0, holding.units - tUnits);
    }
    setHoldings(holdings.map(h => h.id === transactingHolding ? { ...h, units: newUnits, buyPrice: newBuyPrice } : h));
    setTransactingHolding(null);
  };

  // --- SAVE HANDLERS ---
  
  // 1. Save Update (Management Tab)
  const handleUpdateSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newValue);
    if (isNaN(val)) return;

    // Create History Entry
    const newEntry: HistoryEntry = {
        date: updateDate,
        value: val,
        track: newTrack !== (item as PensionItem).track && newTrack !== (item as InvestmentItem).track ? newTrack : undefined,
        managementCompany: newCompany !== (item as PensionItem).managementCompany ? newCompany : undefined
    };

    setLocalHistory(prev => [...prev, newEntry]);
    onUpdateValue(item.id, val, newEntry);

    // If holdings exist, we must also update the details (holdings array)
    if(category === 'investments' && holdings.length > 0) {
        const updated = { ...item, value: val, holdings: holdings, track: newTrack } as any;
        onUpdateDetails(item.id, updated);
    }
  };

  // 2. Save Settings (Settings Tab)
  const handleSettingsSave = (e: React.FormEvent) => {
      e.preventDefault();
      // We only update Metadata here. Value is NOT updated here unless we want to force override history.
      const updated = { ...item, name: editName } as any;

      if (category === 'pensions') {
          updated.monthlyDeposit = Number(editDeposit);
          updated.managementFeeAccumulation = Number(editFeeAcc);
          updated.managementFeeDeposit = Number(editFeeDep);
      }
      if (category === 'investments') {
           updated.managementFeeAccumulation = Number(editFeeAcc);
           // Holdings are saved in Management tab, but we ensure they aren't lost here
           updated.holdings = holdings; 
      }
      if (category === 'realEstate') {
          updated.address = editAddress;
          updated.monthlyRent = Number(editRent);
          updated.mortgageBank = editBank;
          updated.mortgageTracks = mortgageTracks;
          updated.mortgageBalance = mortgageTracks.reduce((sum, t) => sum + t.balance, 0);
      }
      
      onUpdateDetails(item.id, updated);
      onClose(); // Close on settings save
  };

  // History Edit Logic
  const saveHistoryEdit = (index: number) => {
      const sorted = [...localHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const realIndex = sorted.length - 1 - index;
      const newHistory = [...sorted];
      newHistory[realIndex] = { ...newHistory[realIndex], value: Number(editHistoryValue), date: editHistoryDate };
      const val = realIndex === newHistory.length - 1 ? Number(editHistoryValue) : item.value;
      setLocalHistory(newHistory);
      onUpdateDetails(item.id, { ...item, history: newHistory, value: val });
      setEditingHistoryIndex(null);
  };
  const deleteHistory = () => {
    if (confirmDeleteHistoryIndex !== null) {
        const sorted = [...localHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const realIndex = sorted.length - 1 - confirmDeleteHistoryIndex;
        const newHistory = sorted.filter((_, i) => i !== realIndex);
        const val = newHistory.length > 0 ? newHistory[newHistory.length - 1].value : 0;
        setLocalHistory(newHistory);
        onUpdateDetails(item.id, { ...item, history: newHistory, value: val });
        setConfirmDeleteHistoryIndex(null);
    }
  };

  // Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('he-IL'); } catch { return d; } };
  const chartData = [...localHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const tableData = [...chartData].reverse();

  const isInvestWithHoldings = category === 'investments' && holdings.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-full md:h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 flex-shrink-0">
            <div className="p-4 md:p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-800">{item.name}</h2>
                    <p className="text-emerald-600 font-medium text-sm">{typeLabel}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                    <X size={24} className="text-slate-500" />
                </button>
            </div>
            
            <div className="flex px-4 md:px-6 gap-6 text-sm font-medium">
                <button onClick={() => setActiveTab('manage')} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'manage' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <GripHorizontal size={18}/> ניהול ומעקב
                </button>
                <button onClick={() => setActiveTab('settings')} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    <Settings size={18}/> הגדרות ופרטים
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar min-h-0 bg-white">
            
            {activeTab === 'manage' ? (
                <div className="space-y-8">
                    
                    {/* --- AREA 1: HOLDINGS MANAGEMENT (If Applicable) --- */}
                    {category === 'investments' && (
                         <div className={`p-4 rounded-2xl border ${isInvestWithHoldings ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <Table size={18} />
                                    {isInvestWithHoldings ? 'תיק החזקות (ניירות ערך)' : 'פירוט החזקות'}
                                </h3>
                                <button type="button" onClick={addHolding} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 hover:bg-emerald-100">
                                    <Plus size={14} /> {isInvestWithHoldings ? 'הוסף נייר' : 'צור רשימת החזקות'}
                                </button>
                            </div>

                            {isInvestWithHoldings && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right min-w-[900px]">
                                        <thead className="text-slate-400 font-medium text-xs uppercase bg-slate-100/50">
                                            <tr>
                                                <th className="p-2 w-[80px]">סימול</th>
                                                <th className="p-2 w-[120px]">שם</th>
                                                <th className="p-2 w-[60px]">מטבע</th>
                                                <th className="p-2 w-[160px]">כמות / פעולות</th>
                                                <th className="p-2 w-[100px]">שער קנייה</th>
                                                <th className="p-2 w-[100px]">שער נוכחי</th>
                                                <th className="p-2 w-[120px]">רווח/הפסד</th>
                                                <th className="p-2 w-[100px]">שווי</th>
                                                <th className="p-2 w-[50px]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {holdings.map(h => {
                                                let multiplier = 1;
                                                if (h.currency === 'USD') multiplier = 3.65;
                                                if (h.currency === 'EUR') multiplier = 4.0;
                                                if (h.currency === 'AGOROT') multiplier = 0.01;

                                                const val = h.units * h.currentPrice * multiplier;
                                                const buyVal = h.units * h.buyPrice * multiplier;
                                                const profit = val - buyVal;
                                                const profitPercent = buyVal > 0 ? (profit / buyVal) * 100 : 0;
                                                const isTransacting = transactingHolding === h.id;
                                                
                                                return (
                                                  <React.Fragment key={h.id}>
                                                    <tr className={isTransacting ? 'bg-blue-50/50' : ''}>
                                                        <td className="p-2"><input type="text" value={h.symbol} onChange={e => updateHolding(h.id, 'symbol', e.target.value)} className="w-full bg-transparent border-b focus:border-emerald-500 outline-none" placeholder="" /></td>
                                                        <td className="p-2"><input type="text" value={h.name} onChange={e => updateHolding(h.id, 'name', e.target.value)} className="w-full bg-transparent border-b focus:border-emerald-500 outline-none" placeholder="" /></td>
                                                        <td className="p-2">
                                                            <select value={h.currency} onChange={e => updateHolding(h.id, 'currency', e.target.value)} className="w-full bg-transparent border-b text-xs outline-none">
                                                                <option value="ILS">₪</option>
                                                                <option value="USD">$</option>
                                                                <option value="EUR">€</option>
                                                                <option value="AGOROT">אג'</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex flex-col gap-2">
                                                                 <span className="font-mono font-bold text-center">{h.units.toLocaleString()} יח'</span>
                                                                 <div className="flex gap-2 justify-center">
                                                                     <button type="button" onClick={() => openTransaction(h.id, 'buy')} className="flex-1 px-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded text-xs font-bold transition">קניה</button>
                                                                     <button type="button" onClick={() => openTransaction(h.id, 'sell')} className="flex-1 px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-bold transition">מכירה</button>
                                                                 </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-2 font-mono text-slate-500">{h.buyPrice.toLocaleString()}</td>
                                                        <td className="p-2"><NumberInput value={h.currentPrice} onChange={val => updateHolding(h.id, 'currentPrice', val)} className="w-full bg-transparent border-b focus:border-emerald-500 outline-none font-bold" placeholder="0" /></td>
                                                        <td className={`p-2 font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            <div className="text-base font-black">{profit > 0 ? '+' : ''}{profit.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                                                            <div className="opacity-80 text-xs font-bold dir-ltr text-right">{profitPercent.toFixed(2)}%</div>
                                                        </td>
                                                        <td className="p-2 font-mono font-bold text-slate-700 text-lg">{formatCurrency(val)}</td>
                                                        <td className="p-2 text-center"><button type="button" onClick={() => removeHolding(h.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                                                    </tr>
                                                    {isTransacting && (
                                                        <tr className="bg-blue-50/50">
                                                            <td colSpan={9} className="p-3">
                                                                <div className="flex items-center gap-4 text-sm bg-white p-3 rounded-lg border border-blue-100 shadow-sm animate-fade-in">
                                                                    <div className={`font-bold ${transType === 'buy' ? 'text-emerald-600' : 'text-red-500'} flex items-center gap-1`}>
                                                                        {transType === 'buy' ? <ShoppingCart size={16}/> : <DollarSign size={16}/>}
                                                                        {transType === 'buy' ? 'קניה / הוספה' : 'מכירה / מימוש'}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-slate-500 text-xs">כמות:</label>
                                                                        <NumberInput value={transUnits} onChange={val => setTransUnits(val.toString())} className="w-20 p-1 border rounded" placeholder="0" autoFocus />
                                                                    </div>
                                                                    {transType === 'buy' && (
                                                                        <div className="flex items-center gap-2">
                                                                            <label className="text-slate-500 text-xs">מחיר ליחידה:</label>
                                                                            <NumberInput value={transPrice} onChange={val => setTransPrice(val.toString())} className="w-24 p-1 border rounded" placeholder="מחיר" />
                                                                        </div>
                                                                    )}
                                                                    <div className="mr-auto flex gap-2">
                                                                        <button type="button" onClick={submitTransaction} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold text-xs">ביצוע</button>
                                                                        <button type="button" onClick={() => setTransactingHolding(null)} className="px-3 py-1 text-slate-500 hover:bg-slate-100 rounded text-xs">ביטול</button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                  </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                         </div>
                    )}

                    {/* --- AREA 2: VALUE UPDATE FORM --- */}
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                        <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                            <TrendingUp size={18} />
                            {isInvestWithHoldings ? 'סיכום ושמירה' : 'עדכון שווי'}
                        </h3>
                        <form onSubmit={handleUpdateSave} className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">
                                        {isInvestWithHoldings ? 'שווי נוכחי (מחושב מהחזקות)' : 'שווי מעודכן (₪)'}
                                    </label>
                                    <NumberInput 
                                        value={newValue}
                                        onChange={(val) => setNewValue(val.toString())}
                                        disabled={isInvestWithHoldings} // Disabled if calculated from holdings
                                        className={`w-full p-3 border rounded-xl outline-none font-mono font-bold text-lg ${isInvestWithHoldings ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-emerald-200 focus:ring-2 focus:ring-emerald-500'}`}
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">תאריך עדכון</label>
                                    <input 
                                        type="date" 
                                        value={updateDate}
                                        onChange={(e) => setUpdateDate(e.target.value)}
                                        className="w-full p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                                <button type="submit" className="w-full sm:w-auto py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20">
                                    <Save size={18} />
                                    {isInvestWithHoldings ? 'שמור שינויים בתיק' : 'שמור עדכון'}
                                </button>
                            </div>
                            
                            {(category === 'pensions' || (category === 'investments' && !isInvestWithHoldings)) && (
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-100/50 mt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-1">עדכון מסלול (אם השתנה)</label>
                                        <input type="text" value={newTrack} onChange={(e) => setNewTrack(e.target.value)} className="w-full p-2 bg-white/50 border border-emerald-100 rounded-lg text-xs" placeholder="לדוגמה: S&P 500" />
                                    </div>
                                    {category === 'pensions' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-1">עדכון גוף מנהל</label>
                                            <input type="text" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full p-2 bg-white/50 border border-emerald-100 rounded-lg text-xs" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* --- AREA 3: CHART & HISTORY --- */}
                    {chartData.length > 1 && (
                        <div className="h-64 w-full">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><History size={18} />היסטוריית שווי</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" tick={{fontSize: 12}} />
                                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(val) => `₪${(val/1000).toFixed(0)}k`} width={90} tickMargin={20} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(val: number) => formatCurrency(val)} labelFormatter={formatDate} />
                                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {tableData.length > 0 && (
                        <div className="w-full">
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr><th className="p-3">תאריך</th><th className="p-3">שווי</th><th className="p-3">שינוי</th><th className="p-3"></th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tableData.map((entry, idx) => {
                                            const prev = tableData[idx + 1];
                                            const change = prev ? entry.value - prev.value : 0;
                                            const isEditing = editingHistoryIndex === idx;
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="p-3 font-mono text-slate-600">{isEditing ? <input type="date" value={editHistoryDate} onChange={e => setEditHistoryDate(e.target.value)} className="w-full border p-1 rounded" /> : formatDate(entry.date)}</td>
                                                    <td className="p-3 font-mono font-bold text-slate-800">{isEditing ? <NumberInput value={editHistoryValue} onChange={val => setEditHistoryValue(val.toString())} className="w-full border p-1 rounded" /> : formatCurrency(entry.value)}</td>
                                                    <td className={`p-3 font-mono ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-500' : 'text-slate-400'}`}>{prev ? (change > 0 ? '+' : '') + formatCurrency(change) : '-'}</td>
                                                    <td className="p-3 flex gap-2 justify-end">
                                                        {isEditing ? <button onClick={() => saveHistoryEdit(idx)} className="text-emerald-600"><Check size={16}/></button> : <><button onClick={() => { setEditingHistoryIndex(idx); setEditHistoryValue(entry.value.toString()); setEditHistoryDate(entry.date); }} className="text-slate-400 hover:text-blue-500"><Edit2 size={16}/></button><button onClick={() => setConfirmDeleteHistoryIndex(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button></>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 pb-4 max-w-2xl mx-auto">
                    {/* --- SETTINGS TAB --- */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><Settings size={18}/> הגדרות כלליות</h3>
                        <form onSubmit={handleSettingsSave} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">שם הנכס</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>

                            {/* Category Specifics */}
                            {category === 'pensions' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">הפקדה חודשית (₪)</label><NumberInput value={editDeposit} onChange={val => setEditDeposit(val.toString())} className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">דמי ניהול מצבירה (%)</label><input type="number" step="0.01" value={editFeeAcc} onChange={e => setEditFeeAcc(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">דמי ניהול מהפקדה (%)</label><input type="number" step="0.01" value={editFeeDep} onChange={e => setEditFeeDep(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                                </div>
                            )}
                            
                            {category === 'investments' && (
                                <div><label className="block text-sm font-bold text-slate-700 mb-2">דמי ניהול / עמלות (%)</label><input type="number" step="0.01" value={editFeeAcc} onChange={e => setEditFeeAcc(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                            )}

                            {category === 'realEstate' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-bold text-slate-700 mb-2">כתובת</label><input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                                        <div><label className="block text-sm font-bold text-slate-700 mb-2">שכירות חודשית (₪)</label><NumberInput value={editRent} onChange={val => setEditRent(val.toString())} className="w-full p-3 bg-white border border-slate-200 rounded-xl" /></div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                                        <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-slate-700">מבנה משכנתא</h4><button type="button" onClick={addTrack} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold">+ הוסף מסלול</button></div>
                                        {mortgageTracks.map(track => (
                                            <div key={track.id} className="grid grid-cols-3 gap-2 mb-2 p-2 bg-slate-50 rounded-lg text-xs">
                                                <select value={track.type} onChange={e => updateTrack(track.id, 'type', e.target.value)} className="p-1 rounded"><option value="prime">פריים</option><option value="kalatz">קל"צ</option><option value="kacz">ק"צ</option><option value="matz">מ"צ</option></select>
                                                <NumberInput value={track.balance} onChange={val => updateTrack(track.id, 'balance', val)} className="p-1 rounded font-bold" placeholder="יתרה" />
                                                <div className="flex gap-1"><input type="number" value={track.yearsRemaining} onChange={e => updateTrack(track.id, 'yearsRemaining', Number(e.target.value))} className="w-10 p-1 rounded" placeholder="שנים" /><button type="button" onClick={() => removeTrack(track.id)} className="text-red-500"><Trash2 size={14}/></button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg">
                                <Save size={18} />
                                שמור הגדרות
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>

        {/* Delete History Confirm */}
        {confirmDeleteHistoryIndex !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
             <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
                <h3 className="font-bold text-lg text-red-600 mb-4">מחיקת היסטוריה</h3>
                <div className="flex gap-3 justify-end">
                   <button onClick={() => setConfirmDeleteHistoryIndex(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg">ביטול</button>
                   <button onClick={deleteHistory} className="px-4 py-2 bg-red-500 text-white rounded-lg">מחק</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetModal;