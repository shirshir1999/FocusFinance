
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
import HistoryTableModal from './components/HistoryTableModal';
import AuthScreen from './components/AuthScreen';
import HelpModal from './components/HelpModal';
import { FinancialState, TabId, BaseItem, AssetCategory, HistoryEntry, CashFlowState, UserProfile } from './types';
import { ExternalLink, AlertTriangle, LogOut, User, Loader2, ChevronDown, Plus, Edit2, Users, Info } from 'lucide-react';
import { TreeLogo } from './components/TreeLogo';
import { supabase, saveUserData, fetchUserData, hasMissingKeys, clearCustomKeys } from './services/supabase';

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

const DEFAULT_PROFILE_COLOR = '#3b82f6';
const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<TabId>('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [data, setData] = useState<FinancialState>(initialData);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Management State
  const [activeProfileId, setActiveProfileId] = useState<string>('all');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false); // NEW: Modal state for add profile
  const [newNameInput, setNewNameInput] = useState('');
  
  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
            // Ensure profiles exist (migration)
            if (!cloudData.profiles || cloudData.profiles.length === 0) {
                 const name = currentUser.user_metadata?.full_name || 'פרופיל ראשי';
                 cloudData.profiles = [{ id: 'main', name: name, color: DEFAULT_PROFILE_COLOR, isMainUser: true }];
                 
                 // Assign existing items to main profile if they have no owner
                 const assignOwner = (items: any[]) => items.map(i => ({...i, ownerId: i.ownerId || 'main'}));
                 cloudData.accounts = assignOwner(cloudData.accounts || []);
                 cloudData.pensions = assignOwner(cloudData.pensions || []);
                 cloudData.investments = assignOwner(cloudData.investments || []);
                 cloudData.realEstate = assignOwner(cloudData.realEstate || []);
                 cloudData.loans = assignOwner(cloudData.loans || []);
            }
            setData(cloudData);
            // Default to main user if only one profile exists
            if (cloudData.profiles.length === 1) {
                setActiveProfileId(cloudData.profiles[0].id);
            } else {
                setActiveProfileId('all'); // Or specific logic
            }
        } else {
            // Init new user with default profile
            const name = currentUser.user_metadata?.full_name || 'פרופיל ראשי';
            const newProfile = { id: 'main', name: name, color: DEFAULT_PROFILE_COLOR, isMainUser: true };
            setData({
                ...initialData,
                profiles: [newProfile]
            });
            setActiveProfileId(newProfile.id);
        }
        setLoading(false);
      };
      load();
    }
  }, [currentUser]);

  // 3. Save to Cloud on data changes
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
    setActiveProfileId('all');
  };

  const updateData = (key: keyof FinancialState, items: any) => {
    setData(prev => ({ ...prev, [key]: items }));
  };

  // Helper: Get filtered data based on activeProfileId
  const getFilteredItems = (items: any[]) => {
      if (activeProfileId === 'all') return items;
      return items.filter(i => i.ownerId === activeProfileId || i.isShared);
  };
  
  // When adding, assign owner
  const assignOwner = (item: any) => {
      if (activeProfileId !== 'all') {
          return { ...item, ownerId: activeProfileId };
      }
      // If in "All" view, default to main user or first profile
      const mainId = data.profiles?.[0]?.id || 'main';
      return { ...item, ownerId: mainId };
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

  // --- Profile Logic ---
  const handleAddProfile = () => {
      if (!newNameInput.trim()) return;
      
      const newId = Date.now().toString();
      const color = COLORS[(data.profiles?.length || 0) % COLORS.length];
      const newProfile: UserProfile = { id: newId, name: newNameInput, color };
      
      setData(prev => ({ ...prev, profiles: [...(prev.profiles || []), newProfile] }));
      setActiveProfileId(newId); // Switch to new profile dashboard
      setIsAddProfileOpen(false);
      setNewNameInput('');
      navigateTo('dashboard'); // Ensure we are on dashboard to see empty state
  };

  const handleEditName = () => {
      if (!newNameInput.trim()) return;
      
      // Determine target profile ID
      let targetId = activeProfileId;
      if (targetId === 'all') {
          // Edit main user if in 'all' view
          targetId = data.profiles?.find(p => p.isMainUser)?.id || '';
      }
      
      if (!targetId) return;

      const updatedProfiles = data.profiles?.map(p => p.id === targetId ? { ...p, name: newNameInput } : p) || [];
      setData(prev => ({ ...prev, profiles: updatedProfiles }));
      setIsEditNameOpen(false);
      setNewNameInput('');
  };

  const getMainUserName = () => {
      return data.profiles?.find(p => p.isMainUser)?.name || 'משתמש';
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen">
          <AuthScreen onLogin={(user) => setCurrentUser(user)} />
          {hasMissingKeys && (
            <button 
                onClick={clearCustomKeys}
                className="fixed bottom-4 left-4 p-2 text-slate-300 hover:text-slate-500 transition"
                title="איפוס הגדרות חיבור"
            >
                <div className="w-4 h-4 rounded-full border border-current"></div>
            </button>
          )}
      </div>
    );
  }

  const renderContent = () => {
    // Calculate display name for current view
    const displayUserName = activeProfileId === 'all' 
        ? (data.profiles?.find(p => p.isMainUser)?.name || 'משתמש')
        : (data.profiles?.find(p => p.id === activeProfileId)?.name || 'משתמש');

    const commonDashboardProps = {
        userName: displayUserName,
        onEditName: () => { setNewNameInput(displayUserName); setIsEditNameOpen(true); },
        activeProfileId: activeProfileId,
        profiles: data.profiles || []
    };

    const commonModalProps = {
        profiles: data.profiles || [],
        activeProfileId: activeProfileId
    };

    const renderWithModal = (ModalComponent: React.FC<any>, props: any = {}) => (
        <>
            <Dashboard 
                data={{
                    ...data,
                    accounts: getFilteredItems(data.accounts),
                    pensions: getFilteredItems(data.pensions),
                    investments: getFilteredItems(data.investments),
                    realEstate: getFilteredItems(data.realEstate),
                    loans: getFilteredItems(data.loans),
                }}
                onNavigate={navigateTo} 
                {...commonDashboardProps}
            />
            <ModalComponent {...props} {...commonModalProps} onClose={() => navigateTo('dashboard')} />
        </>
    );

    if (activeView === 'pension_calc') return renderWithModal(PensionCalculator, { data });
    if (activeView === 'future_projection') return renderWithModal(FutureProjection, { data });
    if (activeView === 'switching_calc') return renderWithModal(SwitchingCalculator);
    if (activeView === 'history_view') return renderWithModal(HistoryTableModal, { data: data });
    
    if (activeView === 'feecalc') {
         const pension = data.pensions.find(p => p.type === 'pension');
         const initialFees = pension ? {
             acc: pension.managementFeeAccumulation || 0.22,
             dep: pension.managementFeeDeposit || 1.0
         } : undefined;
         return renderWithModal(FeeCalculator, { initialFees });
    }

    const tabProps = {
        profiles: data.profiles || [],
        activeProfileId: activeProfileId,
        onBack: () => navigateTo('dashboard')
    };

    switch (activeView) {
      case 'dashboard':
        return (
            <Dashboard 
                data={{
                    ...data,
                    accounts: getFilteredItems(data.accounts),
                    pensions: getFilteredItems(data.pensions),
                    investments: getFilteredItems(data.investments),
                    realEstate: getFilteredItems(data.realEstate),
                    loans: getFilteredItems(data.loans),
                }} 
                onNavigate={navigateTo} 
                {...commonDashboardProps}
            />
        );
      case 'accounts':
        return (
          <AccountsTab 
            items={getFilteredItems(data.accounts)}
            onAdd={(item) => updateData('accounts', [...data.accounts, assignOwner(item)])}
            onRemove={(id) => updateData('accounts', data.accounts.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('accounts', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('accounts', id, item)}
            {...tabProps}
          />
        );
      case 'pension':
        return (
          <PensionTab 
            items={getFilteredItems(data.pensions)}
            initialType={viewParams?.type}
            onAdd={(item) => updateData('pensions', [...data.pensions, assignOwner(item)])}
            onRemove={(id) => updateData('pensions', data.pensions.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('pensions', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('pensions', id, item)}
            {...tabProps}
          />
        );
      case 'investments':
        return (
          <InvestmentsTab 
            items={getFilteredItems(data.investments)}
            onAdd={(item) => updateData('investments', [...data.investments, assignOwner(item)])}
            onRemove={(id) => updateData('investments', data.investments.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('investments', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('investments', id, item)}
            {...tabProps}
          />
        );
      case 'realestate':
        return (
          <RealEstateTab 
            items={getFilteredItems(data.realEstate)}
            onAdd={(item) => updateData('realEstate', [...data.realEstate, assignOwner(item)])}
            onRemove={(id) => updateData('realEstate', data.realEstate.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('realEstate', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('realEstate', id, item)}
            {...tabProps}
          />
        );
      case 'loans':
        return (
          <LoansTab 
            items={getFilteredItems(data.loans)}
            onAdd={(item) => updateData('loans', [...data.loans, assignOwner(item)])}
            onRemove={(id) => updateData('loans', data.loans.filter(i => i.id !== id))}
            onUpdate={(id, val, hist) => handleUpdateValue('loans', id, val, hist)}
            onUpdateDetails={(id, item) => handleUpdateDetails('loans', id, item)}
            {...tabProps}
          />
        );
      case 'cashflow':
        return (
            <CashFlowTab 
                data={data.cashFlow || initialData.cashFlow!}
                loans={getFilteredItems(data.loans)}
                realEstate={getFilteredItems(data.realEstate)}
                onUpdate={handleUpdateCashFlow}
                onBack={() => navigateTo('dashboard')}
            />
        );
      default:
        return <Dashboard 
            data={data}
            onNavigate={navigateTo} 
            {...commonDashboardProps}
        />;
    }
  };

  const activeProfile = data.profiles?.find(p => p.id === activeProfileId);
  const multipleProfiles = (data.profiles?.length || 0) > 1;

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

              <div className="flex items-center gap-2 md:gap-4">
                  
                  {/* Help Button */}
                  <button 
                    onClick={() => setIsHelpOpen(true)}
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition"
                    title="עזרה ומידע"
                  >
                      <Info size={20} />
                  </button>

                  <div className="w-px h-6 bg-slate-200 hidden md:block"></div>

                  {/* Profile Switcher */}
                  <div className="relative">
                      <button 
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-700 text-sm font-bold hover:bg-slate-200 transition"
                      >
                         {activeProfileId === 'all' ? (
                             <div className="flex items-center gap-2">
                                 <div className="bg-slate-800 text-white p-1 rounded-full"><Users size={12}/></div>
                                 <span className="hidden sm:inline">מבט כולל</span>
                             </div>
                         ) : (
                             <div className="flex items-center gap-2">
                                 <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: activeProfile?.color }}>
                                     {activeProfile?.name[0]}
                                 </div>
                                 <span className="hidden sm:inline">{activeProfile?.name}</span>
                             </div>
                         )}
                         <ChevronDown size={14} className="text-slate-400"/>
                      </button>

                      {isProfileMenuOpen && (
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                              {multipleProfiles && (
                                  <>
                                    <button 
                                        onClick={() => { setActiveProfileId('all'); setIsProfileMenuOpen(false); }}
                                        className="w-full text-right px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-2"
                                    >
                                        <div className="bg-slate-800 text-white p-1 rounded-full"><Users size={12}/></div>
                                        מבט משפחתי כולל
                                    </button>
                                    <div className="my-1 border-t border-slate-100"></div>
                                  </>
                              )}
                              
                              {data.profiles?.map(p => (
                                  <button 
                                    key={p.id}
                                    onClick={() => { setActiveProfileId(p.id); setIsProfileMenuOpen(false); }}
                                    className="w-full text-right px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-2"
                                  >
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: p.color }}>
                                        {p.name[0]}
                                    </div>
                                    {p.name}
                                  </button>
                              ))}
                              <div className="my-1 border-t border-slate-100"></div>
                              <button 
                                onClick={() => { setIsAddProfileOpen(true); setIsProfileMenuOpen(false); }}
                                className="w-full text-right px-4 py-2 hover:bg-emerald-50 text-emerald-600 text-sm font-bold flex items-center gap-2"
                              >
                                  <Plus size={14}/>
                                  הוסף פרופיל
                              </button>
                          </div>
                      )}
                  </div>

                  {/* User Name (Read Only) */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-600 text-sm font-bold">
                    <User size={16} className="text-slate-400" />
                    <span>{getMainUserName()}</span>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    title="התנתקות"
                  >
                    <LogOut size={20} />
                  </button>
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
                      המידע אינו מהווה ייעוץ השקעות, ייעוץ פנסיוני, ייעוץ מס או תחליף לייעוץ מקצועי.
                  </p>
                  <div className="pt-2 mt-2 border-t border-slate-200/60">
                      <p className="text-[10px] font-medium text-slate-400">
                          © {new Date().getFullYear()} שיר כהן תכנון פיננסי - כל הזכויות שמורות
                      </p>
                  </div>
              </div>
          </footer>
      </div>

      {/* Edit Name Modal */}
      {isEditNameOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditNameOpen(false)}>
              <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">עריכת שם פרופיל</h3>
                  <input 
                    type="text" 
                    value={newNameInput} 
                    onChange={(e) => setNewNameInput(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="הכנס שם מלא"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEditNameOpen(false)} className="px-4 py-2 text-slate-500 font-medium">ביטול</button>
                      <button onClick={handleEditName} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold">שמור</button>
                  </div>
              </div>
          </div>
      )}

      {/* Add Profile Modal */}
      {isAddProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddProfileOpen(false)}>
              <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                      <Users size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">הוספת פרופיל חדש</h3>
                  <p className="text-sm text-slate-500 mb-4">הוסיפו פרופיל עבור בן/בת זוג או ילד לניהול נפרד או משותף.</p>
                  <input 
                    type="text" 
                    value={newNameInput} 
                    onChange={(e) => setNewNameInput(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="שם הפרופיל (לדוגמה: בן)"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsAddProfileOpen(false)} className="px-4 py-2 text-slate-500 font-medium">ביטול</button>
                      <button onClick={handleAddProfile} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition">הוסף פרופיל</button>
                  </div>
              </div>
          </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}

    </div>
  );
};

export default App;
