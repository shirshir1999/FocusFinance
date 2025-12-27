
import React, { useState, useEffect, useRef } from 'react';
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
import TermsModal from './components/TermsModal';
import TourOverlay from './components/TourOverlay';
import { FinancialState, TabId, BaseItem, AssetCategory, HistoryEntry, CashFlowState, UserProfile, PensionItem } from './types';
import { ExternalLink, AlertTriangle, LogOut, Loader2, ChevronDown, Plus, Users, Info, Trash2, ArrowRight } from 'lucide-react';
import { TreeLogo } from './components/TreeLogo';
import { supabase, saveUserData, fetchUserData, hasMissingKeys, clearCustomKeys } from './services/supabase';

const initialData: FinancialState = {
  hasAcceptedTerms: false,
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
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Profile Management State
  const [activeProfileId, setActiveProfileId] = useState<string>('all');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  
  // Profile Delete State
  const [deleteProfileState, setDeleteProfileState] = useState<{
      isOpen: boolean;
      profileId: string | null;
      step: 'confirm' | 'action'; 
      targetProfileId?: string; 
  }>({ isOpen: false, profileId: null, step: 'confirm' });

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Terms Modal State
  const [showTerms, setShowTerms] = useState(false);

  // Tour State
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState<string>('');

  // Scroll to top when view changes
  useEffect(() => {
      if (mainScrollRef.current) {
          mainScrollRef.current.scrollTo(0, 0);
      }
  }, [activeView]);

  // Auth & Data Loading logic...
  useEffect(() => {
    const initAuth = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            setCurrentUser(session?.user ?? null);
        } catch (err) {
            console.error("Auth check failed:", err);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if(session?.user) setLoading(false); 
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const load = async () => {
        if(data === initialData) setLoading(true);
        try {
            const cloudData = await fetchUserData(currentUser.id);
            if (cloudData) {
                if (!cloudData.profiles || cloudData.profiles.length === 0) {
                     const name = currentUser.user_metadata?.full_name || 'פרופיל ראשי';
                     cloudData.profiles = [{ id: 'main', name: name, color: DEFAULT_PROFILE_COLOR, isMainUser: true }];
                     const assignOwner = (items: any[]) => items.map(i => ({...i, ownerId: i.ownerId || 'main'}));
                     cloudData.accounts = assignOwner(cloudData.accounts || []);
                     cloudData.pensions = assignOwner(cloudData.pensions || []);
                     cloudData.investments = assignOwner(cloudData.investments || []);
                     cloudData.realEstate = assignOwner(cloudData.realEstate || []);
                     cloudData.loans = assignOwner(cloudData.loans || []);
                }
                setData(cloudData);
                if (!cloudData.hasAcceptedTerms) {
                    setShowTerms(true);
                }
                if (cloudData.profiles.length === 1) {
                    setActiveProfileId(cloudData.profiles[0].id);
                }
            } else {
                const name = currentUser.user_metadata?.full_name || 'פרופיל ראשי';
                const newProfiles = [{ id: 'main', name: name, color: DEFAULT_PROFILE_COLOR, isMainUser: true }];
                setData({
                    ...initialData,
                    profiles: newProfiles
                });
                setActiveProfileId('main');
                setShowTerms(true); 
            }
        } catch (e) {
            console.error("Error loading data", e);
        } finally {
            setLoading(false);
        }
      };
      load();
    }
  }, [currentUser]);

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
    setShowTerms(false);
  };

  const handleAcceptTerms = () => {
      setData(prev => ({ ...prev, hasAcceptedTerms: true, termsAcceptedAt: new Date().toISOString() }));
      setShowTerms(false);
      setIsHelpOpen(true);
  };

  const updateData = (key: keyof FinancialState, items: any) => {
    setData(prev => ({ ...prev, [key]: items }));
  };

  const getFilteredItems = (items: any[]) => {
      if (activeProfileId === 'all') return items;
      return items.filter(i => i.ownerId === activeProfileId || i.isShared || (i.sharedWithIds && i.sharedWithIds.includes(activeProfileId)));
  };
  
  const assignOwner = (item: any) => {
      if (activeProfileId !== 'all') {
          return { ...item, ownerId: activeProfileId };
      }
      const mainId = data.profiles?.[0]?.id || 'main';
      return { ...item, ownerId: mainId };
  };

  const handleUpdateValue = (category: AssetCategory, id: string, newValue: number, historyEntry: HistoryEntry) => {
      const items = data[category] as any[];
      const updatedItems = items.map(item => {
          if (item.id === id) {
              const updatedHistory = item.history ? [...item.history, historyEntry] : [historyEntry];
              const updatedItem = { ...item, value: newValue, history: updatedHistory, lastUpdated: new Date().toISOString() };
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

  // --- Tour & Demo Data Logic ---
  const handleTourStepChange = (stepId: string) => {
      setTourStep(stepId);
      
      // Inject Demo Pension when step reaches 'pension-item-show' (Simulate "Save" click)
      if (stepId === 'pension-item-show') {
          // Check if demo item already exists to prevent dupes
          if (!data.pensions.find(p => p.id === 'demo-pension')) {
              const demoPension: PensionItem = {
                  id: 'demo-pension',
                  name: 'מנורה מבטחים',
                  value: 185000,
                  type: 'pension',
                  monthlyDeposit: 1500,
                  managementFeeAccumulation: 0.2,
                  managementFeeDeposit: 1.5,
                  track: 'מניות חו״ל',
                  history: [],
                  ownerId: activeProfileId === 'all' ? (data.profiles?.[0]?.id || 'main') : activeProfileId
              };
              updateData('pensions', [...data.pensions, demoPension]);
          }
      }

      // Cleanup on finish
      if (stepId === 'finish' || stepId === 'intro') {
          // Remove demo item
          if (data.pensions.find(p => p.id === 'demo-pension')) {
              updateData('pensions', data.pensions.filter(p => p.id !== 'demo-pension'));
          }
      }
  };

  const handleTourClose = () => {
      setIsTourOpen(false);
      // Cleanup demo item on close
      updateData('pensions', data.pensions.filter(p => p.id !== 'demo-pension'));
      setTourStep('');
  };

  // Profile functions...
  const handleAddProfile = () => {
      if (!newNameInput.trim()) return;
      const newId = Date.now().toString();
      const color = COLORS[(data.profiles?.length || 0) % COLORS.length];
      const newProfile: UserProfile = { id: newId, name: newNameInput, color };
      setData(prev => ({ ...prev, profiles: [...(prev.profiles || []), newProfile] }));
      setActiveProfileId(newId);
      setIsAddProfileOpen(false);
      setNewNameInput('');
      navigateTo('dashboard');
  };

  const handleEditName = () => {
      if (!newNameInput.trim()) return;
      const targetId = activeProfileId === 'all' ? data.profiles?.find(p=>p.isMainUser)?.id : activeProfileId;
      const updatedProfiles = data.profiles?.map(p => p.id === targetId ? { ...p, name: newNameInput } : p) || [];
      setData(prev => ({ ...prev, profiles: updatedProfiles }));
      setIsEditNameOpen(false);
      setNewNameInput('');
  };

  const handleProfileDeleteInit = (e: React.MouseEvent, profileId: string) => {
      e.stopPropagation();
      setDeleteProfileState({ isOpen: true, profileId, step: 'confirm' });
      setIsProfileMenuOpen(false);
  };

  const executeDeleteProfile = (action: 'delete_assets' | 'transfer_assets') => {
      const { profileId, targetProfileId } = deleteProfileState;
      if (!profileId) return;
      let newData = { ...data };
      newData.profiles = newData.profiles?.filter(p => p.id !== profileId) || [];
      const updateAssets = (items: any[]) => {
          if (action === 'delete_assets') return items.filter(i => i.ownerId !== profileId);
          else if (action === 'transfer_assets' && targetProfileId) return items.map(i => i.ownerId === profileId ? { ...i, ownerId: targetProfileId } : i);
          return items;
      };
      newData.accounts = updateAssets(newData.accounts);
      newData.pensions = updateAssets(newData.pensions);
      newData.investments = updateAssets(newData.investments);
      newData.realEstate = updateAssets(newData.realEstate);
      newData.loans = updateAssets(newData.loans);
      setData(newData);
      if (activeProfileId === profileId) setActiveProfileId(newData.profiles[0]?.id || 'all');
      setDeleteProfileState({ isOpen: false, profileId: null, step: 'confirm' });
  };

  const getMainUserName = () => {
      if (activeProfileId !== 'all') return data.profiles?.find(p => p.id === activeProfileId)?.name;
      return data.profiles?.find(p => p.isMainUser)?.name || 'משתמש';
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-emerald-500 w-12 h-12" /></div>;
  if (!currentUser) return <div className="flex flex-col min-h-screen"><AuthScreen onLogin={(user) => setCurrentUser(user)} />{hasMissingKeys && <button onClick={clearCustomKeys} className="fixed bottom-4 left-4 p-2 text-slate-300 hover:text-slate-500 transition"><div className="w-4 h-4 rounded-full border border-current"></div></button>}</div>;

  const renderContent = () => {
    const commonModalProps = { profiles: data.profiles || [], activeProfileId: activeProfileId };
    const renderWithModal = (ModalComponent: React.FC<any>, props: any = {}) => (
        <>
            <Dashboard data={{...data, accounts: getFilteredItems(data.accounts), pensions: getFilteredItems(data.pensions), investments: getFilteredItems(data.investments), realEstate: getFilteredItems(data.realEstate), loans: getFilteredItems(data.loans)}} onNavigate={navigateTo} userName={getMainUserName()} onEditName={() => { setNewNameInput(getMainUserName() || ''); setIsEditNameOpen(true); }} activeProfileId={activeProfileId} profiles={data.profiles || []} />
            <ModalComponent {...props} {...commonModalProps} onClose={() => navigateTo('dashboard')} />
        </>
    );

    if (activeView === 'pension_calc') return renderWithModal(PensionCalculator, { data });
    if (activeView === 'future_projection') return renderWithModal(FutureProjection, { data });
    if (activeView === 'switching_calc') return renderWithModal(SwitchingCalculator);
    if (activeView === 'history_view') return renderWithModal(HistoryTableModal, { data: data });
    if (activeView === 'feecalc') {
         const pension = data.pensions.find(p => p.type === 'pension');
         const initialFees = pension ? { acc: pension.managementFeeAccumulation || 0.22, dep: pension.managementFeeDeposit || 1.0 } : undefined;
         return renderWithModal(FeeCalculator, { initialFees });
    }

    const tabProps = { profiles: data.profiles || [], activeProfileId: activeProfileId, onBack: () => navigateTo('dashboard') };

    switch (activeView) {
      case 'dashboard':
        return <Dashboard data={{...data, accounts: getFilteredItems(data.accounts), pensions: getFilteredItems(data.pensions), investments: getFilteredItems(data.investments), realEstate: getFilteredItems(data.realEstate), loans: getFilteredItems(data.loans)}} onNavigate={navigateTo} userName={getMainUserName()} onEditName={() => { setNewNameInput(getMainUserName() || ''); setIsEditNameOpen(true); }} activeProfileId={activeProfileId} profiles={data.profiles || []} />;
      case 'accounts': return <AccountsTab items={getFilteredItems(data.accounts)} onAdd={(item) => updateData('accounts', [...data.accounts, assignOwner(item)])} onRemove={(id) => updateData('accounts', data.accounts.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('accounts', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('accounts', id, item)} {...tabProps} />;
      case 'pension': return <PensionTab items={getFilteredItems(data.pensions)} initialType={viewParams?.type} onAdd={(item) => updateData('pensions', [...data.pensions, assignOwner(item)])} onRemove={(id) => updateData('pensions', data.pensions.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('pensions', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('pensions', id, item)} tourStep={tourStep} {...tabProps} />;
      case 'investments': return <InvestmentsTab items={getFilteredItems(data.investments)} onAdd={(item) => updateData('investments', [...data.investments, assignOwner(item)])} onRemove={(id) => updateData('investments', data.investments.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('investments', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('investments', id, item)} {...tabProps} />;
      case 'realestate': return <RealEstateTab items={getFilteredItems(data.realEstate)} onAdd={(item) => updateData('realEstate', [...data.realEstate, assignOwner(item)])} onRemove={(id) => updateData('realEstate', data.realEstate.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('realEstate', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('realEstate', id, item)} {...tabProps} />;
      case 'loans': return <LoansTab items={getFilteredItems(data.loans)} onAdd={(item) => updateData('loans', [...data.loans, assignOwner(item)])} onRemove={(id) => updateData('loans', data.loans.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('loans', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('loans', id, item)} {...tabProps} />;
      case 'cashflow': return <CashFlowTab data={data.cashFlow || initialData.cashFlow!} loans={getFilteredItems(data.loans)} realEstate={getFilteredItems(data.realEstate)} onUpdate={handleUpdateCashFlow} onBack={() => navigateTo('dashboard')} />;
      default: return <Dashboard data={data} onNavigate={navigateTo} userName={getMainUserName()} onEditName={() => { setNewNameInput(getMainUserName() || ''); setIsEditNameOpen(true); }} activeProfileId={activeProfileId} profiles={data.profiles || []} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-200 z-30 shadow-sm flex-shrink-0">
          <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3 cursor-pointer min-w-0" onClick={() => navigateTo('dashboard')}>
                  <TreeLogo className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
                  <div className="min-w-0 flex flex-col justify-center">
                      <h1 className="text-lg md:text-xl font-black text-slate-900 leading-none tracking-tight truncate">פוקוס פיננסי</h1>
                      <span className="text-[10px] md:text-xs text-slate-500 font-medium truncate hidden sm:block">שיר כהן - תכנון פיננסי</span>
                  </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <a href="https://www.shirfinance.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition"><span className="hidden sm:inline">לאתר שלי</span><ExternalLink size={16} /></a>
                  <div className="w-px h-6 bg-slate-200 hidden md:block"></div>
                  <button onClick={() => setIsHelpOpen(true)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition" title="עזרה ומידע"><Info size={20} /></button>
                  <div className="relative">
                      <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-slate-700 text-sm font-bold hover:bg-slate-200 transition">
                         {((data.profiles?.length || 0) > 1) && activeProfileId === 'all' && (<div className="flex items-center gap-2"><div className="bg-slate-800 text-white p-1 rounded-full"><Users size={12}/></div><span className="hidden sm:inline">מבט כולל</span></div>)}
                         {(activeProfileId !== 'all' || (data.profiles?.length || 0) <= 1) && (<div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: data.profiles?.find(p => p.id === activeProfileId)?.color || DEFAULT_PROFILE_COLOR }}>{data.profiles?.find(p => p.id === activeProfileId)?.name[0] || 'U'}</div><span className="hidden sm:inline">{data.profiles?.find(p => p.id === activeProfileId)?.name || 'משתמש'}</span></div>)}
                         <ChevronDown size={14} className="text-slate-400"/>
                      </button>
                      {isProfileMenuOpen && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                              {(data.profiles?.length || 0) > 1 && (<><button onClick={() => { setActiveProfileId('all'); setIsProfileMenuOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-2"><div className="bg-slate-800 text-white p-1 rounded-full"><Users size={12}/></div>מבט משפחתי כולל</button><div className="my-1 border-t border-slate-100"></div>{data.profiles?.map(p => (<div key={p.id} className="flex items-center justify-between px-2 hover:bg-slate-50 group"><button onClick={() => { setActiveProfileId(p.id); setIsProfileMenuOpen(false); }} className="flex-1 text-right px-2 py-2 text-sm font-medium flex items-center gap-2"><div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: p.color }}>{p.name[0]}</div>{p.name}</button>{!p.isMainUser && (<button onClick={(e) => handleProfileDeleteInit(e, p.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100" title="מחיקת פרופיל"><Trash2 size={14}/></button>)}</div>))}<div className="my-1 border-t border-slate-100"></div></>)}
                              <button onClick={() => { setIsAddProfileOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-emerald-50 text-emerald-600 text-sm font-bold flex items-center gap-2"><Plus size={14}/>הוסף פרופיל</button>
                              <div className="my-1 border-t border-slate-100"></div>
                              <button onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2"><LogOut size={14}/>התנתקות</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col" ref={mainScrollRef}>
          <main className="flex-1">{renderContent()}</main>
          <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-4 px-4 text-slate-500 flex-shrink-0">
              <div className="max-w-4xl mx-auto text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-slate-900 mb-1"><AlertTriangle size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">הבהרה משפטית</span></div>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-2xl mx-auto">המידע המוצג במערכת זו נועד למטרות מעקב וניהול אישי בלבד. המידע אינו מהווה ייעוץ השקעות, ייעוץ פנסיוני, ייעוץ מס או תחליף לייעוץ מקצועי.</p>
                  <div className="pt-2 mt-2 border-t border-slate-200/60"><p className="text-[10px] font-medium text-slate-400">© {new Date().getFullYear()} שיר כהן תכנון פיננסי - כל הזכויות שמורות</p></div>
              </div>
          </footer>
      </div>

      {currentUser && showTerms && <TermsModal onAccept={handleAcceptTerms} />}
      {isEditNameOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditNameOpen(false)}><div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold text-slate-800 mb-4">עריכת שם משתמש</h3><input type="text" value={newNameInput} onChange={(e) => setNewNameInput(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="הכנס שם מלא" autoFocus /><div className="flex justify-end gap-2"><button onClick={() => setIsEditNameOpen(false)} className="px-4 py-2 text-slate-500 font-medium">ביטול</button><button onClick={handleEditName} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold">שמור</button></div></div></div>)}
      {isAddProfileOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddProfileOpen(false)}><div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}><div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600"><Users size={24} /></div><h3 className="text-lg font-bold text-slate-800 mb-2">הוספת פרופיל חדש</h3><p className="text-sm text-slate-500 mb-4">הוסיפו פרופיל עבור בן/בת זוג או ילד לניהול נפרד או משותף.</p><input type="text" value={newNameInput} onChange={(e) => setNewNameInput(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="שם הפרופיל (לדוגמה: בן)" autoFocus /><div className="flex justify-end gap-2"><button onClick={() => setIsAddProfileOpen(false)} className="px-4 py-2 text-slate-500 font-medium">ביטול</button><button onClick={handleAddProfile} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition">הוסף פרופיל</button></div></div></div>)}
      {deleteProfileState.isOpen && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteProfileState({ isOpen: false, profileId: null, step: 'confirm' })}><div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}><div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><Trash2 size={32} /></div><h3 className="font-black text-2xl text-slate-800 mb-2 text-center">מחיקת פרופיל</h3>{deleteProfileState.step === 'confirm' ? (<><p className="text-slate-500 mb-8 leading-relaxed text-center">אתם עומדים למחוק את הפרופיל. מה תרצו לעשות עם הנכסים המשויכים אליו?</p><div className="space-y-3">{(data.profiles && data.profiles.length > 1) && (<button onClick={() => setDeleteProfileState(prev => ({ ...prev, step: 'action' }))} className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between group transition"><span className="font-bold text-slate-700">העברת נכסים למשתמש אחר</span><ArrowRight size={20} className="text-slate-400 group-hover:text-slate-600"/></button>)}<button onClick={() => executeDeleteProfile('delete_assets')} className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 rounded-xl font-bold transition flex items-center justify-center gap-2"><Trash2 size={18}/>מחיקת הפרופיל והנכסים שלו</button><button onClick={() => setDeleteProfileState({ isOpen: false, profileId: null, step: 'confirm' })} className="w-full p-3 text-slate-400 hover:text-slate-600 text-sm font-medium mt-2">ביטול</button></div></>) : (<><p className="text-slate-500 mb-6 leading-relaxed text-center">לאיזה משתמש תרצו להעביר את הנכסים?</p><div className="space-y-2 mb-6 max-h-48 overflow-y-auto custom-scrollbar">{data.profiles?.filter(p => p.id !== deleteProfileState.profileId).map(p => (<button key={p.id} onClick={() => setDeleteProfileState(prev => ({ ...prev, targetProfileId: p.id }))} className={`w-full p-3 rounded-xl flex items-center gap-3 border transition ${deleteProfileState.targetProfileId === p.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50'}`}><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0" style={{ backgroundColor: p.color }}>{p.name[0]}</div><span className="font-bold text-slate-700">{p.name}</span></button>))}</div><div className="flex gap-3"><button onClick={() => setDeleteProfileState(prev => ({ ...prev, step: 'confirm', targetProfileId: undefined }))} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">חזרה</button><button onClick={() => executeDeleteProfile('transfer_assets')} disabled={!deleteProfileState.targetProfileId} className="flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">אשר העברה ומחיקה</button></div></>)}</div></div>)}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} onStartTour={() => { setIsHelpOpen(false); setIsTourOpen(true); }} />}
      
      <TourOverlay 
        isOpen={isTourOpen} 
        onClose={handleTourClose}
        onStepChange={handleTourStepChange}
        onNavigate={(view) => {
            if (activeView !== view) {
                navigateTo(view);
            }
        }}
      />
    </div>
  );
};

export default App;
