import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AccountsTab from './components/AccountsTab';
import PensionTab from './components/PensionTab';
import InvestmentsTab from './components/InvestmentsTab';
import RealEstateTab from './components/RealEstateTab';
import LoansTab from './components/LoansTab';
import CashFlowTab from './components/CashFlowTab';
import PensionCalculator from './components/PensionCalculator';
import FutureProjection from './components/FutureProjection';
import FeeCalculator from './components/FeeCalculator';
import SwitchingCalculator from './components/SwitchingCalculator';
import AuthScreen from './components/AuthScreen';
import { FinancialState, TabId, BaseItem, AssetCategory, HistoryEntry, CashFlowState } from './types';
import { ExternalLink, AlertTriangle, LogOut, User, Loader2 } from 'lucide-react';
import { TreeLogo } from './components/TreeLogo';
import { supabase, saveUserData, fetchUserData } from './services/supabase';

const initialData: FinancialState = {
  accounts: [],
  pensions: [],
  investments: [],
  realEstate: [],
  loans: [],
  cashFlow: {
      monthlyIncome: 0,
      additionalIncomes: [],
      includeRealEstateRent: false,
      realEstateRentInclusionPercentage: 100,
      expensesMode: 'simple',
      generalExpense: 0,
      detailedExpenses: {}
  }
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<TabId>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [data, setData] = useState<FinancialState>(initialData);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Listen for Auth Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load Cloud Data when user logs in
  useEffect(() => {
    if (currentUser) {
      const load = async () => {
        setLoading(true);
        const cloudData = await fetchUserData(currentUser.id);
        if (cloudData) {
            setData(cloudData);
        } else {
            setData(initialData);
        }
        setLoading(false);
      };
      load();
    }
  }, [currentUser]);

  // 3. Save to Cloud on data changes (with a small debounce could be better, but let's keep it direct for now)
  useEffect(() => {
    if (currentUser && data !== initialData) {
      saveUserData(currentUser.id, data);
    }
  }, [data, currentUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setData(initialData);
    setActiveView('dashboard');
  };

  const updateData = (key: keyof FinancialState, items: any) => {
    setData(prev => ({ ...prev, [key]: items }));
  };

  const handleUpdateValue = (category: AssetCategory, id: string, newValue: number, historyEntry: HistoryEntry) => {
      const items = data[category] as any[];
      const updatedItems = items.map(item => {
          if (item.id === id) {
              const updatedHistory = item.history ? [...item.history, historyEntry] : [historyEntry];
              const updatedItem = { 
                  ...item, 
                  value: newValue, 
                  history: updatedHistory, 
                  lastUpdated: new Date().toISOString() 
              };
              if (historyEntry.track) updatedItem.track = historyEntry.track;
              return updatedItem;
          }
          return item;
      });
      updateData(category, updatedItems);
  };

  const handleUpdateDetails = (category: AssetCategory, id: string, updatedItem: BaseItem) => {
      const items = data[category] as any[];
      const updatedItems = items.map(item => item.id === id ? updatedItem : item);
      updateData(category, updatedItems);
  };

  const handleUpdateCashFlow = (cashFlowState: CashFlowState) => {
      setData(prev => ({ ...prev, cashFlow: cashFlowState }));
  };

  const navigateTo = (view: TabId, params?: any) => {
      setActiveView(view);
      setViewParams(params || null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  const renderContent = () => {
    const renderWithModal = (ModalComponent: React.FC<any>, props: any = {}) => (
        <>
            <Dashboard data={data} onNavigate={navigateTo} />
            <ModalComponent {...props} onClose={() => navigateTo('dashboard')} />
        </>
    );

    if (activeView === 'pension_calc') return renderWithModal(PensionCalculator, { data });
    if (activeView === 'future_projection') return renderWithModal(FutureProjection, { data });
    if (activeView === 'switching_calc') return renderWithModal(SwitchingCalculator);
    
    if (activeView === 'feecalc') {
         const pension = data.pensions.find(p => p.type === 'pension');
         const initialFees = pension ? {
             acc: pension.managementFeeAccumulation || 0.22,
             dep: pension.managementFeeDeposit || 1.0
         } : undefined;
         return renderWithModal(FeeCalculator, { initialFees });
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard data={data} onNavigate={navigateTo} />;
      case 'accounts':
        return (
          <AccountsTab 
            items={data.accounts}
            onAdd={(item) => updateData('accounts', [...data.accounts, item])}
            onRemove={(id) => updateData('accounts', data.accounts.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('accounts', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('accounts', id, item)}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'pension':
        return (
          <PensionTab 
            items={data.pensions}
            initialType={viewParams?.type}
            onAdd={(item) => updateData('pensions', [...data.pensions, item])}
            onRemove={(id) => updateData('pensions', data.pensions.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('pensions', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('pensions', id, item)}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'investments':
        return (
          <InvestmentsTab 
            items={data.investments}
            onAdd={(item) => updateData('investments', [...data.investments, item])}
            onRemove={(id) => updateData('investments', data.investments.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('investments', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('investments', id, item)}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'realestate':
        return (
          <RealEstateTab 
            items={data.realEstate}
            onAdd={(item) => updateData('realEstate', [...data.realEstate, item])}
            onRemove={(id) => updateData('realEstate', data.realEstate.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('realEstate', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('realEstate', id, item)}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'loans':
        return (
          <LoansTab 
            items={data.loans}
            onAdd={(item) => updateData('loans', [...data.loans, item])}
            onRemove={(id) => updateData('loans', data.loans.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('loans', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('loans', id, item)}
            onBack={() => navigateTo('dashboard')}
          />
        );
      case 'cashflow':
        return (
            <CashFlowTab 
                data={data.cashFlow || initialData.cashFlow!}
                loans={data.loans}
                realEstate={data.realEstate}
                onUpdate={handleUpdateCashFlow}
                onBack={() => navigateTo('dashboard')}
            />
        );
      default:
        return <Dashboard data={data} onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-200 z-30 shadow-sm flex-shrink-0">
          <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('dashboard')}>
                  <TreeLogo className="w-10 h-10" />
                  <div>
                      <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">פוקוס פיננסי</h1>
                      <span className="text-xs text-slate-500 font-medium">שיר כהן - תכנון פיננסי</span>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-600 text-sm font-bold">
                    <User size={16} className="text-slate-400" />
                    <span>{currentUser.email?.split('@')[0]}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    title="התנתקות"
                  >
                    <LogOut size={20} />
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1"></div>
                  <a 
                    href="https://www.shirfinance.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition"
                  >
                      <span className="hidden sm:inline">לאתר שלי</span>
                      <ExternalLink size={16} />
                  </a>
              </div>
          </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <main className="flex-1">
            {renderContent()}
          </main>

          <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-4 px-4 text-slate-500 flex-shrink-0">
              <div className="max-w-4xl mx-auto text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-slate-900 mb-1">
                       <AlertTriangle size={14} />
                       <span className="text-[10px] font-bold uppercase tracking-wider">הבהרה משפטית</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-2xl mx-auto">
                      המידע המוצג במערכת זו נועד למטרות מעקב וניהול אישי בלבד. 
                      המידע אינו מהווה ייעוץ השקעות, ייעוץ פנסיוני, ייעוץ מס או תחליף לייעוץ מקצועי המתחשב בנתונים ובצרכים המיוחדים של כל אדם. 
                      כל העושה שימוש במידע זה עושה זאת על אחריותו הבלעדית. 
                      אין במידע משום המלצה לביצוע פעולות בניירות ערך או במוצרים פיננסיים. ט.ל.ח.
                  </p>
                  <div className="pt-2 mt-2 border-t border-slate-200/60">
                      <p className="text-[10px] font-medium text-slate-400">
                          © {new Date().getFullYear()} שיר כהן תכנון פיננסי - כל הזכויות שמורות
                      </p>
                  </div>
              </div>
          </footer>
      </div>
    </div>
  );
};

export default App;