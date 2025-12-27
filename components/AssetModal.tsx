
import React, { useState, useEffect } from 'react';
import { BaseItem, HistoryEntry, PensionItem, InvestmentItem, RealEstateItem, AssetCategory, MortgageTrack, InvestmentHolding, UserProfile } from '../types';
import { X, Save, TrendingUp, History, Settings, Plus, Trash2, Table, Edit2, Check, DollarSign, ShoppingCart, GripHorizontal, Users, ArrowRight, CreditCard, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import NumberInput from './NumberInput';

interface AssetModalProps {
  item: BaseItem;
  category: AssetCategory;
  isOpen: boolean; // Kept for API compatibility, but logic handles render in parent
  onClose: () => void;
  onUpdateValue: (id: string, newValue: number, newHistoryEntry: HistoryEntry) => void;
  onUpdateDetails: (id: string, updatedItem: BaseItem) => void;
  typeLabel: string;
  profiles: UserProfile[];
  activeProfileId: string;
}

const AssetModal: React.FC<AssetModalProps> = ({ item, category, onClose, onUpdateValue, onUpdateDetails, typeLabel, profiles, activeProfileId }) => {
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
  
  // Ownership & Sharing
  const [editOwner, setEditOwner] = useState(item.ownerId || (activeProfileId !== 'all' ? activeProfileId : profiles[0]?.id));
  const [editIsShared, setEditIsShared] = useState(item.isShared || false);
  const [editSharedWith, setEditSharedWith] = useState<string[]>([]);
  
  // UI State for Accordion
  const [isSpecificSharingOpen, setIsSpecificSharingOpen] = useState(false);

  // Local History (Immediate UI update)
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>([]);
  const [editingHistoryIndex, setEditingHistoryIndex] = useState<number | null>(null);
  const [editHistoryValue, setEditHistoryValue] = useState<string>('');
  const [editHistoryDate, setEditHistoryDate] = useState<string>('');
  const [confirmDeleteHistoryIndex, setConfirmDeleteHistoryIndex] = useState<number | null>(null);

  useEffect(() => {
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
        
        // Ownership State
        setEditOwner(item.ownerId || (activeProfileId !== 'all' ? activeProfileId : profiles[0]?.id));
        setEditIsShared(item.isShared || false);
        setEditSharedWith(item.sharedWithIds || []);
        
        // Auto-open specific sharing if there are shared IDs
        setIsSpecificSharingOpen(!!(item.sharedWithIds && item.sharedWithIds.length > 0));

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
  }, [item, category, profiles, activeProfileId]);

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

  // --- Toggle specific profile sharing ---
  const toggleSharedProfile = (profileId: string) => {
      setEditSharedWith(prev => {
          if (prev.includes(profileId)) {
              return prev.filter(id => id !== profileId);
          }
          return [...prev, profileId];
      });
  };

  // --- Mortgage Logic (Settings) ---
  const addTrack = () => setMortgageTracks([...mortgageTracks, { id: Date.now().toString(), name: '', type: 'kalatz', originalAmount: 0, balance: 0, yearsTotal: 25, yearsRemaining: 25, interestRate: 0, monthlyPayment: 0 }]);
  const removeTrack = (id: string) => setMortgageTracks(mortgageTracks.filter(t => t.id !== id));
  const updateTrack = (id: string, field: keyof MortgageTrack, value: any) => {
      const updated = mortgageTracks.map(t => {
          if(t.id !== id) return t;
          const newTrack = { ...t, [field]: value };
          if (['balance', 'yearsRemaining', 'interestRate'].includes(field as string)) {
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
      const updated = { 
          ...item, 
          name: editName,
          ownerId: editOwner,
          isShared: editIsShared,
          sharedWithIds: editSharedWith
      } as any;

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
  const multipleProfiles = profiles.length > 1;

  return (
    <div className="w-full h-full flex flex-col bg-white animate-fade-in">
        
        {/* Header - Back Button & Title */}
        <div className="bg-slate-50 border-b border-slate-200 flex-shrink-0 sticky top-0 z-20">
            <div className="p-4 md:p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition text-slate-500">
                        <ArrowRight size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800">{item.name}</h2>
                        <p className="text-emerald-600 font-medium text-sm">{typeLabel}</p>
                    </div>
                </div>
                
                {/* Desktop Tabs */}
                <div className="hidden md:flex px-4 gap-6 text-sm font-medium">
                    <button onClick={() => setActiveTab('manage')} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'manage' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <GripHorizontal size={18}/> ניהול ומעקב
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        <Settings size={18}/> הגדרות ופרטים
                    </button>
                </div>
            </div>
            
            {/* Mobile Tabs */}
            <div className="flex md:hidden w-full border-t border-slate-200">
                <button onClick={() => setActiveTab('manage')} className={`flex-1 py-3 text-center text-sm font-bold ${activeTab === 'manage' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500'}`}>ניהול ומעקב</button>
                <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-center text-sm font-bold ${activeTab === 'settings' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500'}`}>הגדרות</button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50/50">
            <div className="max-w-6xl mx-auto">
            
            {activeTab === 'manage' ? (
                <div className="space-y-8 pb-12">
                    
                    {/* --- AREA 1: HOLDINGS MANAGEMENT (If Applicable) --- */}
                    {category === 'investments' && (
                         <div className={`p-6 rounded-3xl border ${isInvestWithHoldings ? 'bg-white border-slate-200 shadow-sm' : 'bg-white border-dashed border-slate-300'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                                    <Table size={20} />
                                    {isInvestWithHoldings ? 'תיק החזקות (ניירות ערך)' : 'פירוט החזקות'}
                                </h3>
                                <button type="button" onClick={addHolding} className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition">
                                    <Plus size={16} /> {isInvestWithHoldings ? 'הוסף נייר' : 'צור רשימת החזקות'}
                                </button>
                            </div>

                            {/* Holdings Table */}
                            {isInvestWithHoldings && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right min-w-[900px]">
                                       <thead className="text-slate-400 font-medium text-xs uppercase bg-slate-50">
                                            <tr>
                                                <th className="p-3 w-[100px] rounded-r-xl">סימול</th>
                                                <th className="p-3 w-[140px]">שם</th>
                                                <th className="p-3 w-[80px]">מטבע</th>
                                                <th className="p-3 w-[180px]">כמות / פעולות</th>
                                                <th className="p-3 w-[110px]">שער קנייה</th>
                                                <th className="p-3 w-[110px]">שער נוכחי</th>
                                                <th className="p-3 w-[140px]">רווח/הפסד</th>
                                                <th className="p-3 w-[120px]">שווי</th>
                                                <th className="p-3 w-[50px] rounded-l-xl"></th>
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
                                                    <tr className={`hover:bg-slate-50 transition-colors ${isTransacting ? 'bg-blue-50/50' : ''}`}>
                                                        <td className="p-3"><input type="text" value={h.symbol} onChange={e => updateHolding(h.id, 'symbol', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 outline-none transition" placeholder="---" /></td>
                                                        <td className="p-3"><input type="text" value={h.name} onChange={e => updateHolding(h.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 outline-none transition" placeholder="---" /></td>
                                                        <td className="p-3">
                                                            <select value={h.currency} onChange={e => updateHolding(h.id, 'currency', e.target.value)} className="w-full bg-transparent border-b border-transparent text-xs outline-none">
                                                                <option value="ILS">₪</option>
                                                                <option value="USD">$</option>
                                                                <option value="EUR">€</option>
                                                                <option value="AGOROT">אג'</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex flex-col gap-2">
                                                                 <span className="font-mono font-bold text-center">{h.units.toLocaleString()} יח'</span>
                                                                 <div className="flex gap-2 justify-center">
                                                                     <button type="button" onClick={() => openTransaction(h.id, 'buy')} className="flex-1 px-2 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold transition">קניה</button>
                                                                     <button type="button" onClick={() => openTransaction(h.id, 'sell')} className="flex-1 px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition">מכירה</button>
                                                                 </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 font-mono text-slate-500">{h.buyPrice.toLocaleString()}</td>
                                                        <td className="p-3"><NumberInput value={h.currentPrice} onChange={val => updateHolding(h.id, 'currentPrice', val)} className="w-full bg-transparent border-b border-slate-200 focus:border-emerald-500 outline-none font-bold" placeholder="0" /></td>
                                                        <td className={`p-3 font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            <div className="text-base font-black">{profit > 0 ? '+' : ''}{profit.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                                                            <div className="opacity-80 text-xs font-bold dir-ltr text-right">{profitPercent.toFixed(2)}%</div>
                                                        </td>
                                                        <td className="p-3 font-mono font-bold text-slate-700 text-lg">{formatCurrency(val)}</td>
                                                        <td className="p-3 text-center"><button type="button" onClick={() => removeHolding(h.id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={18}/></button></td>
                                                    </tr>
                                                    {isTransacting && (
                                                        <tr className="bg-blue-50/50">
                                                            <td colSpan={9} className="p-3">
                                                                <div className="flex items-center gap-4 text-sm bg-white p-3 rounded-xl border border-blue-100 shadow-sm animate-fade-in">
                                                                    <div className={`font-bold ${transType === 'buy' ? 'text-emerald-600' : 'text-red-500'} flex items-center gap-1`}>
                                                                        {transType === 'buy' ? <ShoppingCart size={16}/> : <DollarSign size={16}/>}
                                                                        {transType === 'buy' ? 'קניה / הוספה' : 'מכירה / מימוש'}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <label className="text-slate-500 text-xs">כמות:</label>
                                                                        <NumberInput value={transUnits} onChange={val => setTransUnits(val.toString())} className="w-24 p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="0" autoFocus />
                                                                    </div>
                                                                    {transType === 'buy' && (
                                                                        <div className="flex items-center gap-2">
                                                                            <label className="text-slate-500 text-xs">מחיר ליחידה:</label>
                                                                            <NumberInput value={transPrice} onChange={val => setTransPrice(val.toString())} className="w-24 p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="מחיר" />
                                                                        </div>
                                                                    )}
                                                                    <div className="mr-auto flex gap-2">
                                                                        <button type="button" onClick={submitTransaction} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-xs shadow-md">ביצוע</button>
                                                                        <button type="button" onClick={() => setTransactingHolding(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-medium">ביטול</button>
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
                    <div className="bg-emerald-50/50 p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-sm">
                        <h3 className="font-bold text-emerald-900 mb-6 flex items-center gap-2 text-lg">
                            <TrendingUp size={24} className="bg-emerald-200 p-1 rounded-lg text-emerald-700" />
                            {isInvestWithHoldings ? 'סיכום ושמירה' : 'עדכון שווי'}
                        </h3>
                        <form onSubmit={handleUpdateSave} className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-bold text-slate-500 mb-2">
                                        {isInvestWithHoldings ? 'שווי נוכחי (מחושב מהחזקות)' : 'שווי מעודכן (₪)'}
                                    </label>
                                    <NumberInput 
                                        value={newValue}
                                        onChange={(val) => setNewValue(val.toString())}
                                        disabled={isInvestWithHoldings} // Disabled if calculated from holdings
                                        className={`w-full p-4 border rounded-2xl outline-none font-mono font-black text-2xl ${isInvestWithHoldings ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-emerald-200 focus:ring-2 focus:ring-emerald-500 text-emerald-900'}`}
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-bold text-slate-500 mb-2">תאריך עדכון</label>
                                    <input 
                                        type="date" 
                                        value={updateDate}
                                        onChange={(e) => setUpdateDate(e.target.value)}
                                        className="w-full p-4 bg-white border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg"
                                    />
                                </div>
                                <button type="submit" className="w-full md:w-auto py-4 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 transform hover:-translate-y-1">
                                    <Save size={20} />
                                    {isInvestWithHoldings ? 'שמור שינויים בתיק' : 'שמור עדכון'}
                                </button>
                            </div>
                            
                            {(category === 'pensions' || (category === 'investments' && !isInvestWithHoldings)) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-emerald-100/50 mt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2">עדכון מסלול (אם השתנה)</label>
                                        <input type="text" value={newTrack} onChange={(e) => setNewTrack(e.target.value)} className="w-full p-3 bg-white/50 border border-emerald-100 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-300 transition" placeholder="לדוגמה: S&P 500" />
                                    </div>
                                    {category === 'pensions' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2">עדכון גוף מנהל</label>
                                            <input type="text" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full p-3 bg-white/50 border border-emerald-100 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-300 transition" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* --- AREA 3: CHART & HISTORY --- */}
                    {chartData.length > 1 && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
                            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><History size={20} />היסטוריית שווי</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ left: 20, right: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" tick={{fontSize: 12}} dy={10} />
                                    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(val) => `₪${(val/1000).toFixed(0)}k`} width={60} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(val: number) => formatCurrency(val)} labelFormatter={formatDate} />
                                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {tableData.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Table size={20}/> פירוט היסטורי</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr><th className="p-4 font-bold">תאריך</th><th className="p-4 font-bold">שווי</th><th className="p-4 font-bold">שינוי</th><th className="p-4"></th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tableData.map((entry, idx) => {
                                            const prev = tableData[idx + 1];
                                            const change = prev ? entry.value - prev.value : 0;
                                            const isEditing = editingHistoryIndex === idx;
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-mono text-slate-600">{isEditing ? <input type="date" value={editHistoryDate} onChange={e => setEditHistoryDate(e.target.value)} className="w-full border p-2 rounded-lg" /> : formatDate(entry.date)}</td>
                                                    <td className="p-4 font-mono font-bold text-slate-800 text-lg">{isEditing ? <NumberInput value={editHistoryValue} onChange={val => setEditHistoryValue(val.toString())} className="w-full border p-2 rounded-lg" /> : formatCurrency(entry.value)}</td>
                                                    <td className={`p-4 font-mono font-bold ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-500' : 'text-slate-400'}`}>{prev ? (change > 0 ? '+' : '') + formatCurrency(change) : '-'}</td>
                                                    <td className="p-4 flex gap-2 justify-end">
                                                        {isEditing ? <button onClick={() => saveHistoryEdit(idx)} className="text-emerald-600 bg-emerald-50 p-2 rounded-lg"><Check size={18}/></button> : <><button onClick={() => { setEditingHistoryIndex(idx); setEditHistoryValue(entry.value.toString()); setEditHistoryDate(entry.date); }} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"><Edit2 size={18}/></button><button onClick={() => setConfirmDeleteHistoryIndex(idx)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={18}/></button></>}
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
                <div className="space-y-6 pb-4 max-w-3xl mx-auto">
                    {/* --- SETTINGS TAB --- */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-3 text-xl pb-4 border-b border-slate-100">
                            <Settings size={24} className="text-slate-400"/> הגדרות נכס
                        </h3>
                        <form onSubmit={handleSettingsSave} className="space-y-8">
                            
                            {/* Ownership & Sharing - Only show sharing options if multiple profiles exist */}
                            {multipleProfiles && (
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">בעל הנכס</label>
                                            <select 
                                                value={editOwner} 
                                                onChange={(e) => {
                                                    setEditOwner(e.target.value);
                                                    // Ensure owner is not in shared list
                                                    if(editSharedWith.includes(e.target.value)) {
                                                        setEditSharedWith(prev => prev.filter(id => id !== e.target.value));
                                                    }
                                                }}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer"
                                            >
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">הגדרות שיתוף גלובליות</label>
                                            <div className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition h-[58px] ${editIsShared ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`} onClick={() => setEditIsShared(!editIsShared)}>
                                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition ${editIsShared ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                                                    {editIsShared && <Check size={16}/>}
                                                </div>
                                                <span className="font-bold text-sm flex items-center gap-2"><Users size={18}/> נכס משותף לכולם (ציבורי)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Granular Sharing - Only show if NOT globally shared */}
                                    {!editIsShared && (
                                        <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                                            <button 
                                                type="button"
                                                onClick={() => setIsSpecificSharingOpen(!isSpecificSharingOpen)}
                                                className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <UserPlus size={18} className="text-slate-400"/>
                                                    נכס בבעלות משותפת (ספציפי)
                                                </span>
                                                {isSpecificSharingOpen ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                                            </button>
                                            
                                            {isSpecificSharingOpen && (
                                                <div className="p-4 pt-0 animate-fade-in border-t border-slate-100">
                                                    <p className="text-xs text-slate-400 mb-3 mt-3">סמנו את השותפים הנוספים לנכס זה:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {profiles.filter(p => p.id !== editOwner).map(p => {
                                                            const isSelected = editSharedWith.includes(p.id);
                                                            return (
                                                                <div 
                                                                    key={p.id}
                                                                    onClick={() => toggleSharedProfile(p.id)}
                                                                    className={`px-3 py-2 rounded-xl text-sm font-bold cursor-pointer transition flex items-center gap-2 border ${isSelected ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-slate-200'}`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                                                                        {isSelected && <Check size={10} strokeWidth={4} />}
                                                                    </div>
                                                                    {p.name}
                                                                </div>
                                                            );
                                                        })}
                                                        {profiles.filter(p => p.id !== editOwner).length === 0 && (
                                                            <span className="text-xs text-slate-400 italic">אין משתמשים נוספים לשיתוף</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">שם הנכס</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition text-lg font-medium" />
                            </div>

                            {/* Category Specifics */}
                            {category === 'pensions' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="md:col-span-2"><label className="block text-sm font-bold text-slate-700 mb-2">הפקדה חודשית (₪)</label><NumberInput value={editDeposit} onChange={val => setEditDeposit(val.toString())} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">דמי ניהול מצבירה (%)</label><input type="number" step="0.01" value={editFeeAcc} onChange={e => setEditFeeAcc(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">דמי ניהול מהפקדה (%)</label><input type="number" step="0.01" value={editFeeDep} onChange={e => setEditFeeDep(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500" /></div>
                                </div>
                            )}
                            
                            {category === 'investments' && (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">דמי ניהול / עמלות (%)</label>
                                    <input type="number" step="0.01" value={editFeeAcc} onChange={e => setEditFeeAcc(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
                                </div>
                            )}

                            {category === 'realEstate' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <div><label className="block text-sm font-bold text-slate-700 mb-2">כתובת</label><input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500" /></div>
                                        <div><label className="block text-sm font-bold text-slate-700 mb-2">שכירות חודשית (₪)</label><NumberInput value={editRent} onChange={val => setEditRent(val.toString())} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500" /></div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-6"><h4 className="font-bold text-slate-700 flex items-center gap-2"><CreditCard size={20}/> מבנה משכנתא</h4><button type="button" onClick={addTrack} className="text-xs bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition">+ הוסף מסלול</button></div>
                                        {mortgageTracks.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">לא הוזנו מסלולי משכנתא</p>}
                                        <div className="space-y-3">
                                            {mortgageTracks.map(track => (
                                                <div key={track.id} className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                                    <select value={track.type} onChange={e => updateTrack(track.id, 'type', e.target.value)} className="p-2 rounded-lg border-slate-200"><option value="prime">פריים</option><option value="kalatz">קל"צ</option><option value="kacz">ק"צ</option><option value="matz">מ"צ</option></select>
                                                    <NumberInput value={track.balance} onChange={val => updateTrack(track.id, 'balance', val)} className="p-2 rounded-lg border border-slate-200 font-bold" placeholder="יתרה" />
                                                    <div className="flex gap-2"><input type="number" value={track.yearsRemaining} onChange={e => updateTrack(track.id, 'yearsRemaining', Number(e.target.value))} className="w-16 p-2 rounded-lg border border-slate-200" placeholder="שנים" /><button type="button" onClick={() => removeTrack(track.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button type="submit" className="w-full md:w-auto py-4 px-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition shadow-xl transform hover:-translate-y-1">
                                    <Save size={20} />
                                    שמור הגדרות
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>

        {/* Delete History Confirm */}
        {confirmDeleteHistoryIndex !== null && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setConfirmDeleteHistoryIndex(null)}
          >
             <div 
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4"
                onClick={e => e.stopPropagation()}
             >
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Trash2 size={32}/></div>
                <h3 className="font-black text-xl text-slate-800 mb-2 text-center">מחיקת רשומת היסטוריה</h3>
                <p className="text-center text-slate-500 mb-8">פעולה זו לא ניתנת לביטול.</p>
                <div className="flex gap-3 justify-center">
                   <button onClick={() => setConfirmDeleteHistoryIndex(null)} className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition">ביטול</button>
                   <button onClick={deleteHistory} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition">מחק רשומה</button>
                </div>
             </div>
          </div>
        )}
    </div>
  );
};

export default AssetModal;
