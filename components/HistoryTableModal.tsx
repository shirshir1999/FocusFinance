
import React from 'react';
import { FinancialState } from '../types';
import { Table, X } from 'lucide-react';

interface HistoryTableModalProps { 
    data: FinancialState; 
    onClose: () => void;
    activeProfileId: string;
}

const HistoryTableModal: React.FC<HistoryTableModalProps> = ({ data, onClose, activeProfileId }) => {
    
    // Helper format
    const formatCurrency = (val: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

    // 1. Collect all assets with Type Label based on current profile filter
    // Note: data passed here is already filtered by the App component logic if needed, 
    // OR we filter here. To be safe, let's assume 'data' contains EVERYTHING and we filter here based on profile.
    
    const filterItem = (item: any) => {
        if (activeProfileId === 'all') return true;
        return item.ownerId === activeProfileId || item.isShared;
    };

    const getAssetLabel = (item: any, category: string) => {
        if (category === 'pensions') {
            if (item.type === 'pension') return 'פנסיה';
            if (item.type === 'study_fund') return 'השתלמות';
            return 'גמל';
        }
        if (category === 'accounts') {
            if (item.type === 'checking') return 'עו"ש';
            if (item.type === 'emergency') return 'ביטחון';
            return 'חיסכון';
        }
        if (category === 'investments') return 'השקעות';
        if (category === 'realEstate') return 'נדל"ן';
        return 'נכס';
    };

    const allAssets = [
        ...data.accounts.filter(filterItem).map(i => ({...i, label: getAssetLabel(i, 'accounts')})),
        ...data.pensions.filter(filterItem).map(i => ({...i, label: getAssetLabel(i, 'pensions')})),
        ...data.investments.filter(filterItem).map(i => ({...i, label: getAssetLabel(i, 'investments')})),
        ...data.realEstate.filter(filterItem).map(i => ({...i, label: getAssetLabel(i, 'realEstate')}))
    ];

    // 2. Collect all unique dates from all history
    const allDates = new Set<string>();
    allAssets.forEach(asset => {
        if (asset.history) {
            asset.history.forEach(h => allDates.add(h.date));
        }
        // Also add current update date if exists
        if (asset.lastUpdated) {
            allDates.add(asset.lastUpdated.split('T')[0]);
        }
    });
    // Ensure today is there if we have assets but no history yet
    if (allDates.size === 0 && allAssets.length > 0) {
        allDates.add(new Date().toISOString().split('T')[0]);
    }

    const sortedDates = Array.from(allDates).sort().reverse(); // Newest first

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-hidden">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-full md:h-[90vh] flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Table className="text-slate-500" />
                            טבלת מעקב שווי
                        </h2>
                        <p className="text-slate-500 text-xs">פירוט היסטורי של כלל הנכסים {activeProfileId === 'all' ? '(מבט כולל)' : ''}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto custom-scrollbar p-4">
                    <table className="w-full text-sm text-right border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm text-slate-500">
                            <tr>
                                <th className="p-3 border-b border-slate-200 font-bold whitespace-nowrap min-w-[100px]">תאריך</th>
                                <th className="p-3 border-b border-slate-200 font-black text-slate-800 whitespace-nowrap min-w-[120px]">סה"כ שווי</th>
                                <th className="p-3 border-b border-slate-200 font-bold text-slate-500 whitespace-nowrap min-w-[100px]">שינוי</th>
                                {allAssets.map(asset => (
                                    <th key={asset.id} className="p-3 border-b border-slate-200 font-medium whitespace-nowrap min-w-[140px]" title={asset.name}>
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[140px] font-bold text-slate-700">{asset.name}</span>
                                            <span className="text-[10px] text-slate-400 font-normal">{asset.label}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedDates.map((date, index) => {
                                let totalForDate = 0;
                                let totalForPrevDate = 0;
                                const prevDate = sortedDates[index + 1];

                                // Calculate total logic: Sum of specific history OR carry forward last known value
                                allAssets.forEach(asset => {
                                    // Try to find exact match
                                    const exactEntry = asset.history?.find(h => h.date === date);
                                    if (exactEntry) {
                                        totalForDate += exactEntry.value;
                                    } else {
                                        // Find most recent entry BEFORE this date
                                        const pastEntries = asset.history?.filter(h => h.date < date).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                        if (pastEntries && pastEntries.length > 0) {
                                            totalForDate += pastEntries[0].value;
                                        }
                                    }

                                    if(prevDate) {
                                        const prevEntry = asset.history?.find(h => h.date === prevDate);
                                        if (prevEntry) {
                                            totalForPrevDate += prevEntry.value;
                                        } else {
                                            const prevPastEntries = asset.history?.filter(h => h.date < prevDate).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                            if (prevPastEntries && prevPastEntries.length > 0) {
                                                totalForPrevDate += prevPastEntries[0].value;
                                            }
                                        }
                                    }
                                });

                                const totalChange = prevDate ? totalForDate - totalForPrevDate : 0;

                                return (
                                    <tr key={date} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-mono text-slate-500">{new Date(date).toLocaleDateString('he-IL')}</td>
                                        <td className="p-3 font-mono font-black text-slate-800 bg-slate-50/50">{formatCurrency(totalForDate)}</td>
                                        <td className={`p-3 font-mono font-bold ${totalChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {prevDate ? (totalChange > 0 ? `+${formatCurrency(totalChange)}` : formatCurrency(totalChange)) : '-'}
                                        </td>
                                        {allAssets.map(asset => {
                                            const entry = asset.history?.find(h => h.date === date);
                                            return (
                                                <td key={asset.id} className="p-3 font-mono text-slate-600 border-r border-slate-50">
                                                    {entry ? formatCurrency(entry.value) : ''}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistoryTableModal;
