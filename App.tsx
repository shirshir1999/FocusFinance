
import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import BusinessDashboard from './components/BusinessDashboard'; 
import AccountsTab from './components/AccountsTab';
import PensionTab from './components/PensionTab';
import InvestmentsTab from './components/InvestmentsTab';
import RealEstateTab from './components/RealEstateTab';
import LoansTab from './components/LoansTab';
import CashFlowTab from './components/CashFlowTab';
import GoalsTab from './components/GoalsTab';
import PensionCalculator from './components/PensionCalculator';
import FutureProjection from './components/FutureProjection';
import FeeCalculator from './components/FeeCalculator';
import SwitchingCalculator from './components/SwitchingCalculator';
import HistoryTableModal from './components/HistoryTableModal';
import AuthScreen from './components/AuthScreen';
import HelpModal from './components/HelpModal';
import TermsModal from './components/TermsModal';
import PermissionsModal from './components/PermissionsModal';
import { FinancialState, TabId, BaseItem, AssetCategory, HistoryEntry, CashFlowState, UserProfile, ManagedClient } from './types';
import { ExternalLink, AlertTriangle, LogOut, Loader2, ChevronDown, Plus, Users, Info, Trash2, ArrowRight, Briefcase, Shield } from 'lucide-react';
import { TreeLogo } from './components/TreeLogo';
import { supabase, saveUserData, fetchUserData, deleteUserData, hasMissingKeys, clearCustomKeys, fetchSharedPortfolios } from './services/supabase';

// Define default layout order
const DEFAULT_DASHBOARD_LAYOUT = [
    'goals', 'cashflow', 'accounts',
    'emergency', 'pension', 'study_fund',
    'investments', 'realestate', 'loans'
];

const initialData: FinancialState = {
  hasAcceptedTerms: false,
  accounts: [],
  pensions: [],
  investments: [],
  realEstate: [],
  loans: [],
  goals: [], 
  cashFlow: {
      monthlyIncome: 0,
      additionalIncomes: [],
      includeRealEstateRent: false,
      realEstateRentInclusionPercentage: 100,
      expensesMode: 'simple',
      generalExpense: 0,
      detailedExpenses: {}
  },
  dashboardLayout: DEFAULT_DASHBOARD_LAYOUT,
  hiddenWidgets: [],
  managedClients: [], 
  authorizedEmails: [], 
};

const DEFAULT_PROFILE_COLOR = '#3b82f6';
const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];

const App: React.FC = () => {
  // Navigation & View State
  const [activeView, setActiveView] = useState<TabId>('dashboard');
  const [viewMode, setViewMode] = useState<'business_hub' | 'dashboard'>('dashboard'); // 'business_hub' shows client list
  const [viewParams, setViewParams] = useState<any>(null);
  
  // Data State
  const [data, setData] = useState<FinancialState>(initialData); // Holds the CURRENTLY VIEWED portfolio data
  const [businessData, setBusinessData] = useState<FinancialState | null>(null); // Holds the ADVISOR's own data (client list)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPortfolioId, setCurrentPortfolioId] = useState<string>(''); // ID of the data row being viewed (User ID or Client UUID)
  const [isDataLoaded, setIsDataLoaded] = useState(false); // CRITICAL: Prevents saving empty state over real data
  
  const [sharedPortfolios, setSharedPortfolios] = useState<{id: string, name: string}[]>([]); // List of portfolios shared with me

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

  // Permissions Modal State
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Scroll to top when view changes
  useEffect(() => {
      if (mainScrollRef.current) {
          mainScrollRef.current.scrollTo(0, 0);
      }
  }, [activeView, viewMode]);

  // Auth & Initial Load
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
            if (!currentUser) setLoading(false);
        }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if(session?.user) setLoading(false); 
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load Data Logic
  const loadPortfolioData = async (portfolioId: string, isAdvisorMode: boolean = false) => {
      setLoading(true);
      setIsDataLoaded(false); // Lock saving until load is complete
      
      // Reset view tabs when loading new data
      setActiveView('dashboard');
      
      try {
          const cloudData = await fetchUserData(portfolioId);
          
          if (cloudData) {
              // Ensure basic structure
              if (!cloudData.profiles || cloudData.profiles.length === 0) {
                   const name = 'פרופיל ראשי';
                   cloudData.profiles = [{ id: 'main', name: name, color: DEFAULT_PROFILE_COLOR, isMainUser: true }];
                   const assignOwner = (items: any[]) => items.map(i => ({...i, ownerId: i.ownerId || 'main'}));
                   cloudData.accounts = assignOwner(cloudData.accounts || []);
                   cloudData.pensions = assignOwner(cloudData.pensions || []);
                   cloudData.investments = assignOwner(cloudData.investments || []);
                   cloudData.realEstate = assignOwner(cloudData.realEstate || []);
                   cloudData.loans = assignOwner(cloudData.loans || []);
                   cloudData.goals = assignOwner(cloudData.goals || []);
              }
              if (!cloudData.dashboardLayout) cloudData.dashboardLayout = DEFAULT_DASHBOARD_LAYOUT;
              if (!cloudData.hiddenWidgets) cloudData.hiddenWidgets = [];
              if (!cloudData.managedClients) cloudData.managedClients = [];
              if (!cloudData.authorizedEmails) cloudData.authorizedEmails = [];

              setData(cloudData);
              setCurrentPortfolioId(portfolioId);
              
              // Persist selection for refresh
              localStorage.setItem('lastViewedPortfolio', portfolioId);

              // Logic to handle Business Accounts vs Personal
              if (cloudData.isBusinessAccount && portfolioId === currentUser?.id) {
                  setBusinessData(cloudData); // Store advisor's data
                  // Only go to hub if we are intentionally navigating to root, otherwise stay on dashboard
                  if (!isAdvisorMode && localStorage.getItem('lastViewMode') === 'business_hub') {
                      setViewMode('business_hub');
                  } else {
                      setViewMode('dashboard');
                  }
              } else {
                  // Normal user or Client View - FORCE Dashboard view
                  setViewMode('dashboard');
                  localStorage.removeItem('lastViewMode');
              }

              if (!cloudData.hasAcceptedTerms && portfolioId === currentUser?.id) {
                  setShowTerms(true);
              }
              
              if (cloudData.profiles.length === 1) {
                  setActiveProfileId(cloudData.profiles[0].id);
              } else {
                  setActiveProfileId('all');
              }
          } else {
              // Create NEW data structure (Personal)
              // Only reached if fetching failed AND user wants to create new.
              // Logic moved to initUser to prefer shared portfolios.
              const name = currentUser?.user_metadata?.full_name || 'פרופיל ראשי';
              const newProfiles = [{ id: 'main', name: name, color: DEFAULT_PROFILE_COLOR, isMainUser: true }];
              const newData = {
                  ...initialData,
                  profiles: newProfiles,
                  authorizedEmails: [currentUser.email]
              };
              setData(newData);
              setCurrentPortfolioId(portfolioId);
              
              if (portfolioId === currentUser?.id) setShowTerms(true);
              setActiveProfileId('main');
              setViewMode('dashboard');
          }
      } catch (e) {
          console.error("Error loading data", e);
      } finally {
          setIsDataLoaded(true); // Unlock saving
          setLoading(false);
      }
  };

  useEffect(() => {
    if (currentUser) {
        const initUser = async () => {
            setLoading(true);
            try {
                // Ensure email is lowercase for comparison
                const email = currentUser.email?.toLowerCase().trim();
                
                // 1. Check if I am authorized on any shared portfolios
                const shared = await fetchSharedPortfolios(email);
                const others = shared.filter((s: any) => s.id !== currentUser.id);
                setSharedPortfolios(others);

                // PRIORITY: If I have a shared portfolio (likely created by advisor), LOAD IT FIRST.
                // Do not create a new empty user row if a shared row exists.
                if (others.length > 0) {
                    const primaryShared = others[0].id; // The Advisor-created portfolio ID
                    // Check persistence if user was navigating elsewhere, but default to shared on first load
                    const lastViewed = localStorage.getItem('lastViewedPortfolio');
                    
                    if (lastViewed && (lastViewed === primaryShared || lastViewed === currentUser.id)) {
                         // Respect last view if valid, but map my-id to shared-id if empty?
                         // Simplest: If lastViewed is my ID, check if it exists. If not, switch to shared.
                         const myDataExists = await fetchUserData(currentUser.id);
                         if (lastViewed === currentUser.id && !myDataExists) {
                             await loadPortfolioData(primaryShared);
                         } else {
                             await loadPortfolioData(lastViewed);
                         }
                    } else {
                        // First time or no persistence -> Load shared
                        await loadPortfolioData(primaryShared);
                    }
                } else {
                    // I am a REGULAR USER or ADVISOR with no shared files aimed at me.
                    // Load my own portfolio.
                    await loadPortfolioData(currentUser.id);
                    
                    const lastMode = localStorage.getItem('lastViewMode');
                    if (lastMode === 'business_hub') setViewMode('business_hub');
                }
            } catch (e) {
                console.error("Error initializing user", e);
                // Fallback
                loadPortfolioData(currentUser.id);
            }
        };
        initUser();
    }
  }, [currentUser]);

  // Save Data - WITH PROTECTION
  useEffect(() => {
    // Only save if data has been successfully loaded to avoid overwriting cloud with initial empty state
    if (currentUser && currentPortfolioId && isDataLoaded && data !== initialData) {
      
      // Ensure current user is authorized before saving (safety)
      // Also ensure existing authorized emails are preserved
      const email = currentUser.email?.toLowerCase().trim();
      let emailList = data.authorizedEmails || [];
      if (!emailList.includes(email)) {
          emailList = [...emailList, email];
      }
      
      const dataToSave = { ...data, authorizedEmails: emailList };
        
      saveUserData(currentPortfolioId, dataToSave);
      
      // If we are editing the Business User's own data (e.g. added a client), update businessData state too
      if (currentPortfolioId === currentUser?.id && data.isBusinessAccount) {
          setBusinessData(dataToSave);
      }
    }
  }, [data, currentPortfolioId, currentUser, isDataLoaded]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lastViewedPortfolio');
    localStorage.removeItem('lastViewMode');
    setCurrentUser(null);
    setData(initialData);
    setBusinessData(null);
    setSharedPortfolios([]);
    setActiveView('dashboard');
    setActiveProfileId('all');
    setShowTerms(false);
    setViewMode('dashboard');
  };

  const handleAcceptTerms = () => {
      setData(prev => ({ ...prev, hasAcceptedTerms: true, termsAcceptedAt: new Date().toISOString() }));
      setShowTerms(false);
      setIsHelpOpen(true);
  };

  // --- Business / Consultant Logic ---

  const handleSwitchToBusinessHub = () => {
      // Upgrade to business account if not already
      if (!data.isBusinessAccount) {
          setData(prev => ({ ...prev, isBusinessAccount: true }));
      }
      // Always navigate to hub
      setViewMode('business_hub');
      localStorage.setItem('lastViewMode', 'business_hub');
      localStorage.setItem('lastViewedPortfolio', currentUser.id);
      setIsProfileMenuOpen(false);
  };

  const handleAddClient = async (name: string, email: string) => {
      if (!businessData) return;
      
      const newClientId = `client_${Date.now()}`;
      const emailClean = email ? email.toLowerCase().trim() : '';
      const advisorEmail = currentUser.email?.toLowerCase().trim();
      
      const newClient: ManagedClient = {
          id: newClientId,
          name: name,
          email: emailClean,
          lastAccess: new Date().toISOString()
      };

      // 1. Update Advisor's list locally and save
      const updatedBusinessData = {
          ...businessData,
          managedClients: [...(businessData.managedClients || []), newClient]
      };
      setBusinessData(updatedBusinessData); 
      setData(updatedBusinessData); 

      // 2. Initialize Client's Data in DB
      // IMPORTANT: Add BOTH client email and advisor email to authorized list
      const authorized = [advisorEmail];
      if (emailClean && emailClean !== advisorEmail) authorized.push(emailClean);

      const newClientData: FinancialState = {
          ...initialData,
          goals: [], 
          authorizedEmails: authorized,
          profiles: [{ id: 'main', name: name, color: DEFAULT_PROFILE_COLOR, isMainUser: true }]
      };
      
      // Save the NEW client row IMMEDIATELY
      await saveUserData(newClientId, newClientData);
  };

  const handleDeleteClient = async (clientId: string) => {
      if (!businessData) return;
      
      // 1. Remove from Advisor's list
      const updatedClients = businessData.managedClients?.filter(c => c.id !== clientId) || [];
      const updatedBusinessData = { ...businessData, managedClients: updatedClients };
      setBusinessData(updatedBusinessData);
      setData(updatedBusinessData);
      
      // 2. Delete the actual client row from DB
      await deleteUserData(clientId);
  };

  const handleSelectClient = (clientId: string) => {
      // Switch view context to this client
      loadPortfolioData(clientId);
  };

  const handleBackToBusiness = () => {
      if (currentUser && businessData) {
          // Reload advisor data
          setData(businessData);
          setCurrentPortfolioId(currentUser.id);
          localStorage.setItem('lastViewedPortfolio', currentUser.id);
          localStorage.setItem('lastViewMode', 'business_hub');
          setViewMode('business_hub');
      } else {
          // Fallback
          loadPortfolioData(currentUser?.id);
      }
  };

  const handleSwitchToShared = (portfolioId: string) => {
      loadPortfolioData(portfolioId);
      setIsProfileMenuOpen(false);
  };

  const handleBackToPersonal = () => {
      loadPortfolioData(currentUser.id);
      setIsProfileMenuOpen(false);
  };

  const handleShareClientAccess = (clientId: string, email: string) => {
      const emailClean = email.toLowerCase().trim();
      
      // 1. Update Advisor's record of the email
      if (businessData) {
          const updatedClients = businessData.managedClients?.map(c => 
              c.id === clientId ? { ...c, email: emailClean } : c
          );
          const updatedAdvisorData = { ...businessData, managedClients: updatedClients };
          setBusinessData(updatedAdvisorData);
          setData(updatedAdvisorData); 
      }

      // 2. Update Client's Data permissions
      fetchUserData(clientId).then(clientData => {
          if (clientData) {
              const currentEmails = clientData.authorizedEmails || [];
              if (!currentEmails.includes(emailClean)) {
                  const updatedClientData = { 
                      ...clientData, 
                      authorizedEmails: [...currentEmails, emailClean] 
                  };
                  saveUserData(clientId, updatedClientData);
              }
          }
      });
  };

  const handleRevokeAccess = (emailToRevoke: string) => {
      const updatedEmails = data.authorizedEmails?.filter(e => e !== emailToRevoke) || [];
      const updatedData = { ...data, authorizedEmails: updatedEmails };
      setData(updatedData);
      // Trigger save handled by useEffect
  };

  // --- End Business Logic ---

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

  const handleUpdateDashboardLayout = (newLayout: string[], hidden: string[]) => {
      setData(prev => ({ ...prev, dashboardLayout: newLayout, hiddenWidgets: hidden }));
  };

  // Profile Management
  const handleAddProfile = () => {
      if (!newNameInput.trim()) return;
      const newId = Date.now().toString();
      const color = COLORS[(data.profiles?.length || 0) % COLORS.length];
      const newProfile: UserProfile = { id: newId, name: newNameInput, color };
      setData(prev => ({ ...prev, profiles: [...(prev.profiles || []), newProfile] }));
      setActiveProfileId(newId);
      setIsAddProfileOpen(false);
      setNewNameInput('');
      setActiveView('dashboard');
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
      newData.goals = updateAssets(newData.goals);
      setData(newData);
      if (activeProfileId === profileId) setActiveProfileId(newData.profiles[0]?.id || 'all');
      setDeleteProfileState({ isOpen: false, profileId: null, step: 'confirm' });
  };

  const getMainUserName = () => {
      // 1. Try to get name of active profile
      if (activeProfileId !== 'all') {
          const p = data.profiles?.find(p => p.id === activeProfileId);
          if (p) return p.name;
      }
      // 2. Try to get Main User name from the loaded data (Client name)
      const main = data.profiles?.find(p => p.isMainUser);
      if (main) return main.name;
      
      // 3. Fallback to first profile if exists
      if (data.profiles && data.profiles.length > 0) return data.profiles[0].name;
      
      return 'משתמש';
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-emerald-500 w-12 h-12" /></div>;
  if (!currentUser) return <div className="flex flex-col min-h-screen"><AuthScreen onLogin={(user) => setCurrentUser(user)} />{hasMissingKeys && <button onClick={clearCustomKeys} className="fixed bottom-4 left-4 p-2 text-slate-300 hover:text-slate-500 transition"><div className="w-4 h-4 rounded-full border border-current"></div></button>}</div>;

  const activeProfile = data.profiles?.find(p => p.id === activeProfileId);
  const isBusinessView = currentPortfolioId !== currentUser.id;
  const viewingShared = isBusinessView && !businessData; // I'm a client viewing a shared portfolio

  // Calculate Header Badge
  const dashboardBadgeText = isBusinessView 
    ? (viewingShared ? `${data.profiles?.[0]?.name || 'לקוח'} - ליווי פיננסי` : 'צפייה בתיק לקוח') 
    : null;

  // --- RENDER CONTENT ---
  const renderContent = () => {
    // If Business Mode and at the Hub
    if (viewMode === 'business_hub') {
        return (
            <BusinessDashboard 
                clients={data.managedClients || []}
                onSelectClient={handleSelectClient}
                onAddClient={handleAddClient}
                onShareClient={handleShareClientAccess}
                onDeleteClient={handleDeleteClient} // Pass the delete handler
            />
        );
    }

    // Standard Dashboard View (User or Client Impersonation)
    const commonModalProps = { profiles: data.profiles || [], activeProfileId: activeProfileId };
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
                    goals: getFilteredItems(data.goals) // Added filtering for goals
                }} 
                onNavigate={(view, params) => { setActiveView(view); setViewParams(params || null); }}
                userName={getMainUserName()} 
                onEditName={() => { setNewNameInput(getMainUserName() || ''); setIsEditNameOpen(true); }} 
                activeProfileId={activeProfileId} 
                profiles={data.profiles || []}
                onUpdateLayout={handleUpdateDashboardLayout}
                headerBadge={dashboardBadgeText} // Passed to Dashboard
            />
            <ModalComponent {...props} {...commonModalProps} onClose={() => { setActiveView('dashboard'); setViewParams(null); }} />
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

    const tabProps = { 
        profiles: data.profiles || [], 
        activeProfileId: activeProfileId, 
        onBack: () => { setActiveView('dashboard'); setViewParams(null); } 
    };

    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
            data={{
                ...data,
                accounts: getFilteredItems(data.accounts),
                pensions: getFilteredItems(data.pensions),
                investments: getFilteredItems(data.investments),
                realEstate: getFilteredItems(data.realEstate),
                loans: getFilteredItems(data.loans),
                goals: getFilteredItems(data.goals) // Added filtering for goals
            }} 
            onNavigate={(view, params) => { setActiveView(view); setViewParams(params || null); }}
            userName={getMainUserName()} 
            onEditName={() => { setNewNameInput(getMainUserName() || ''); setIsEditNameOpen(true); }} 
            activeProfileId={activeProfileId} 
            profiles={data.profiles || []}
            onUpdateLayout={handleUpdateDashboardLayout}
            headerBadge={dashboardBadgeText} // Passed to Dashboard
        />;
      case 'accounts': return <AccountsTab items={getFilteredItems(data.accounts)} onAdd={(item) => updateData('accounts', [...data.accounts, assignOwner(item)])} onRemove={(id) => updateData('accounts', data.accounts.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('accounts', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('accounts', id, item)} {...tabProps} />;
      case 'pension': return <PensionTab items={getFilteredItems(data.pensions)} initialType={viewParams?.type} onAdd={(item) => updateData('pensions', [...data.pensions, assignOwner(item)])} onRemove={(id) => updateData('pensions', data.pensions.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('pensions', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('pensions', id, item)} {...tabProps} />;
      case 'investments': return <InvestmentsTab items={getFilteredItems(data.investments)} onAdd={(item) => updateData('investments', [...data.investments, assignOwner(item)])} onRemove={(id) => updateData('investments', data.investments.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('investments', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('investments', id, item)} {...tabProps} />;
      case 'realestate': return <RealEstateTab items={getFilteredItems(data.realEstate)} onAdd={(item) => updateData('realEstate', [...data.realEstate, assignOwner(item)])} onRemove={(id) => updateData('realEstate', data.realEstate.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('realEstate', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('realEstate', id, item)} {...tabProps} />;
      case 'loans': return <LoansTab items={getFilteredItems(data.loans)} onAdd={(item) => updateData('loans', [...data.loans, assignOwner(item)])} onRemove={(id) => updateData('loans', data.loans.filter(i => i.id !== id))} onUpdate={(id, val, hist) => handleUpdateValue('loans', id, val, hist)} onUpdateDetails={(id, item) => handleUpdateDetails('loans', id, item)} {...tabProps} />;
      case 'goals': 
        const allAssets = [...(data.accounts||[]), ...(data.pensions||[]), ...(data.investments||[]), ...(data.realEstate||[])];
        return <GoalsTab 
            items={getFilteredItems(data.goals)} 
            availableAssets={allAssets}
            onAdd={(item) => updateData('goals', [...data.goals, assignOwner(item)])} 
            onRemove={(id) => updateData('goals', data.goals.filter(i => i.id !== id))} 
            onUpdate={(id, item) => { const updated = data.goals.map(g => g.id === id ? item : g); updateData('goals', updated); }} 
            {...tabProps} 
        />;
      case 'cashflow': return <CashFlowTab data={data.cashFlow || initialData.cashFlow!} loans={getFilteredItems(data.loans)} realEstate={getFilteredItems(data.realEstate)} onUpdate={handleUpdateCashFlow} onBack={() => { setActiveView('dashboard'); setViewParams(null); }} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
          <header className="bg-white border-b border-slate-200 z-30 shadow-sm flex-shrink-0">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                  
                  {/* Logo Area */}
                  <div className="flex items-center gap-2 md:gap-3 cursor-pointer min-w-0 ml-auto lg:ml-0" onClick={() => { if(viewMode !== 'business_hub') setActiveView('dashboard'); }}>
                      <TreeLogo className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
                      <div className="min-w-0 flex flex-col justify-center">
                          <h1 className="text-lg md:text-xl font-black text-slate-900 leading-none tracking-tight truncate">פוקוס פיננסי</h1>
                          {/* Restored Subtitle */}
                          <span className="text-[10px] md:text-xs text-slate-500 font-medium truncate hidden sm:block">שיר כהן - תכנון פיננסי</span>
                          {/* Removed Badges from here as requested */}
                      </div>
                  </div>

                  {/* Left Controls */}
                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                      
                      {/* Restored Website Link */}
                      <a 
                        href="https://www.shirfinance.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600 transition"
                      >
                          <span className="hidden sm:inline">לאתר שלי</span>
                          <ExternalLink size={16} />
                      </a>

                      <div className="w-px h-6 bg-slate-200 hidden md:block"></div>

                      {/* Business Mode Back Button (Advisor Only) */}
                      {isBusinessView && viewMode !== 'business_hub' && !viewingShared && (
                          <button 
                            onClick={handleBackToBusiness}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
                          >
                              <ArrowRight size={14} />
                              <span className="hidden sm:inline">חזרה ללקוחות</span>
                          </button>
                      )}

                      <button onClick={() => setIsHelpOpen(true)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition" title="עזרה ומידע"><Info size={20} /></button>
                      
                      <div className="relative">
                          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition ${isBusinessView ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                             {isBusinessView ? (
                                <div className="flex items-center gap-2"><Briefcase size={14}/><span>{data.profiles?.[0]?.name || 'לקוח'}</span></div>
                             ) : (
                                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: activeProfile?.color || DEFAULT_PROFILE_COLOR }}>{activeProfile?.name[0] || 'U'}</div><span className="hidden sm:inline">{activeProfile?.name || 'משתמש'}</span></div>
                             )}
                             <ChevronDown size={14} className={isBusinessView ? "text-white" : "text-slate-400"}/>
                          </button>
                          
                          {isProfileMenuOpen && (
                              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                                  
                                  {/* --- PERSONAL DASHBOARD CONTEXT --- */}
                                  {!isBusinessView && viewMode === 'dashboard' && (
                                      <>
                                        {/* My Private Profiles */}
                                        {data.profiles?.length > 1 && (
                                            <>
                                                <button onClick={() => { setActiveProfileId('all'); setIsProfileMenuOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-sm font-medium flex items-center gap-2"><div className="bg-slate-800 text-white p-1 rounded-full"><Users size={12}/></div>מבט משפחתי כולל</button>
                                                <div className="my-1 border-t border-slate-100"></div>
                                                {data.profiles?.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between px-2 hover:bg-slate-50 group">
                                                        <button onClick={() => { setActiveProfileId(p.id); setIsProfileMenuOpen(false); }} className="flex-1 text-right px-2 py-2 text-sm font-medium flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: p.color }}>{p.name[0]}</div>
                                                            {p.name}
                                                        </button>
                                                        {!p.isMainUser && (<button onClick={(e) => handleProfileDeleteInit(e, p.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100" title="מחיקת פרופיל"><Trash2 size={14}/></button>)}
                                                    </div>
                                                ))}
                                                <div className="my-1 border-t border-slate-100"></div>
                                            </>
                                        )}
                                        
                                        <button onClick={() => { setIsAddProfileOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-emerald-50 text-emerald-600 text-sm font-bold flex items-center gap-2"><Plus size={14}/>הוסף פרופיל</button>
                                        
                                        {/* Switch/Activate Business Portal - ALWAYS VISIBLE */}
                                        <div className="my-1 border-t border-slate-100"></div>
                                        <button onClick={handleSwitchToBusinessHub} className="w-full text-right px-4 py-2 hover:bg-indigo-50 text-indigo-700 text-sm font-bold flex items-center gap-2">
                                            <Briefcase size={14}/>
                                            עבור לפורטל יועצים
                                        </button>
                                      </>
                                  )}

                                  {/* --- BUSINESS PORTAL CONTEXT --- */}
                                  {viewMode === 'business_hub' && (
                                      <button onClick={() => { setViewMode('dashboard'); setIsProfileMenuOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center gap-2">
                                          <ArrowRight size={14}/>
                                          חזרה לדאשבורד האישי
                                      </button>
                                  )}

                                  {/* --- CLIENT VIEW CONTEXT --- */}
                                  {isBusinessView && !viewingShared && (
                                      <button onClick={handleBackToBusiness} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center gap-2">
                                          <ArrowRight size={14}/>
                                          חזרה לפורטל העסקי
                                      </button>
                                  )}

                                  {/* SHARED VIEW CONTEXT (Regular User) */}
                                  {viewingShared && (
                                      <button onClick={handleBackToPersonal} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-bold flex items-center gap-2">
                                          <ArrowRight size={14}/>
                                          חזרה לתיק אישי
                                      </button>
                                  )}
                                  
                                  <div className="my-1 border-t border-slate-100"></div>
                                  
                                  {/* Access Management */}
                                  <button onClick={() => { setIsPermissionsOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-600 text-sm font-medium flex items-center gap-2">
                                      <Shield size={14}/>
                                      ניהול הרשאות גישה
                                  </button>

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
      </div>

      <PermissionsModal 
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        authorizedEmails={data.authorizedEmails || []}
        ownerId={currentPortfolioId}
        currentUserId={currentUser.id}
        onRevoke={handleRevokeAccess}
      />

      {currentUser && showTerms && <TermsModal onAccept={handleAcceptTerms} />}
      {isEditNameOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditNameOpen(false)}><div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}><h3 className="text-lg font-bold text-slate-800 mb-4">עריכת שם משתמש</h3><input type="text" value={newNameInput} onChange={(e) => setNewNameInput(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="הכנס שם מלא" autoFocus /><div className="flex justify-end gap-2"><button onClick={() => setIsEditNameOpen(false)} className="px-4 py-2 text-slate-500 font-medium">ביטול</button><button onClick={handleEditName} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold">שמור</button></div></div></div>)}
      {isAddProfileOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddProfileOpen(false)}><div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}><div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600"><Users size={24} /></div><h3 className="text-lg font-bold text-slate-800 mb-2">הוספת פרופיל חדש</h3><p className="text-sm text-slate-500 mb-4">הוסיפו פרופיל עבור בן/בת זוג או ילד לניהול נפרד או משותף.</p><input type="text" value={newNameInput} onChange={(e) => setNewNameInput(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="שם הפרופיל (לדוגמה: בן)" autoFocus /><div className="flex justify-end gap-2"><button onClick={() => setIsAddProfileOpen(false)} className="px-4 py-2 text-slate-500 font-medium">ביטול</button><button onClick={handleAddProfile} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition">הוסף פרופיל</button></div></div></div>)}
      {deleteProfileState.isOpen && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteProfileState({ isOpen: false, profileId: null, step: 'confirm' })}><div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}><div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><Trash2 size={32} /></div><h3 className="font-black text-2xl text-slate-800 mb-2 text-center">מחיקת פרופיל</h3>{deleteProfileState.step === 'confirm' ? (<><p className="text-slate-500 mb-8 leading-relaxed text-center">אתם עומדים למחוק את הפרופיל. מה תרצו לעשות עם הנכסים המשויכים אליו?</p><div className="space-y-3">{(data.profiles && data.profiles.length > 1) && (<button onClick={() => setDeleteProfileState(prev => ({ ...prev, step: 'action' }))} className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between group transition"><span className="font-bold text-slate-700">העברת נכסים למשתמש אחר</span><ArrowRight size={20} className="text-slate-400 group-hover:text-slate-600"/></button>)}<button onClick={() => executeDeleteProfile('delete_assets')} className="w-full p-4 bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 rounded-xl font-bold transition flex items-center justify-center gap-2"><Trash2 size={18}/>מחיקת הפרופיל והנכסים שלו</button><button onClick={() => setDeleteProfileState({ isOpen: false, profileId: null, step: 'confirm' })} className="w-full p-3 text-slate-400 hover:text-slate-600 text-sm font-medium mt-2">ביטול</button></div></>) : (<><p className="text-slate-500 mb-6 leading-relaxed text-center">לאיזה משתמש תרצו להעביר את הנכסים?</p><div className="space-y-2 mb-6 max-h-48 overflow-y-auto custom-scrollbar">{data.profiles?.filter(p => p.id !== deleteProfileState.profileId).map(p => (<button key={p.id} onClick={() => setDeleteProfileState(prev => ({ ...prev, targetProfileId: p.id }))} className={`w-full p-3 rounded-xl flex items-center gap-3 border transition ${deleteProfileState.targetProfileId === p.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50'}`}><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0" style={{ backgroundColor: p.color }}>{p.name[0]}</div><span className="font-bold text-slate-700">{p.name}</span></button>))}</div><div className="flex gap-3"><button onClick={() => setDeleteProfileState(prev => ({ ...prev, step: 'confirm', targetProfileId: undefined }))} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">חזרה</button><button onClick={() => executeDeleteProfile('transfer_assets')} disabled={!deleteProfileState.targetProfileId} className="flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">אשר העברה ומחיקה</button></div></>)}</div></div>)}
      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} onStartTour={() => { setIsHelpOpen(false); }} />}
      
    </div>
  );
};

export default App;
