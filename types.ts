
export type TabId = 'dashboard' | 'accounts' | 'pension' | 'investments' | 'realestate' | 'loans' | 'cashflow' | 'feecalc' | 'pension_calc' | 'switching_calc' | 'future_projection' | 'history_view';
export type AssetCategory = 'accounts' | 'pensions' | 'investments' | 'realEstate' | 'loans';

export interface UserProfile {
    id: string;
    name: string;
    color: string; // Hex color for UI badges
    isMainUser?: boolean;
}

export interface HistoryEntry {
  date: string; // ISO Date string
  value: number;
  track?: string;
  managementCompany?: string; 
}

export interface BaseItem {
  id: string;
  name: string;
  value: number; // For Loans: Remaining Balance. For RealEstate: Asset Value.
  history?: HistoryEntry[];
  lastUpdated?: string;
  
  // Multi-User Support
  ownerId?: string; // ID of the profile who owns this
  isShared?: boolean; // If true, appears for everyone (Global)
  sharedWithIds?: string[]; // Specific profiles who can see this (Granular)
}

export interface AccountItem extends BaseItem {
  type: 'checking' | 'emergency' | 'savings';
  monthlyFlow?: number;
}

export interface PensionItem extends BaseItem {
  type: 'pension' | 'study_fund' | 'provident_fund';
  monthlyDeposit: number;
  managementFeeAccumulation?: number;
  managementFeeDeposit?: number;
  track?: string; 
  managementCompany?: string;
}

export type CurrencyType = 'ILS' | 'USD' | 'EUR' | 'AGOROT';

export interface InvestmentHolding {
    id: string;
    symbol: string; // Paper number/Ticker
    name: string;
    units: number;
    currency: CurrencyType;
    buyPrice: number; // Price per unit at purchase
    currentPrice: number; // Price per unit now
    // Calculated fields (not strictly needed in state but good for UI helper)
    value?: number; 
    profit?: number;
}

export interface InvestmentItem extends BaseItem {
  type: 'trading_account' | 'managed_portfolio' | 'provident_fund_investment' | 'crypto' | 'other';
  managementFeeAccumulation?: number;
  returnRate?: number;
  platform?: string; // e.g. Interactive Brokers, Psagot
  holdings?: InvestmentHolding[];
  track?: string; // Added track
}

export interface MortgageTrack {
    id: string;
    name: string; // e.g., "Prime", "Kalatz"
    type: 'prime' | 'kalatz' | 'kacz' | 'matz' | 'balat' | 'other';
    originalAmount: number; // Original principal
    balance: number; // Remaining
    yearsTotal: number;
    yearsRemaining: number;
    interestRate: number;
    monthlyPayment: number;
    endDate?: string;
}

export interface RealEstateItem extends BaseItem {
  address: string;
  monthlyRent?: number;
  mortgageBank?: string; // New: Bank Name
  // Legacy field, kept for backward compatibility but calculated from tracks if exist
  mortgageBalance: number; 
  mortgageTracks?: MortgageTrack[];
}

export interface LoanItem extends BaseItem {
    source: string; // Bank name / Entity
    purpose: string; // Car, Renovation, etc.
    loanType: 'spitzer' | 'balloon_partial' | 'balloon_full'; // Updated Types
    durationMonths: number; // New
    originalAmount: number;
    monthlyPayment: number;
    interestRate: number;
    startDate?: string;
}

export interface IncomeItem {
    id: string;
    source: string;
    amount: number;
}

export interface CashFlowState {
    monthlyIncome: number;
    additionalIncomes: IncomeItem[];
    includeRealEstateRent: boolean;
    realEstateRentInclusionPercentage: number; // 0 to 100
    expensesMode: 'simple' | 'detailed';
    generalExpense: number;
    detailedExpenses: Record<string, number>;
}

export interface FinancialState {
  profiles?: UserProfile[]; // List of people
  accounts: AccountItem[];
  pensions: PensionItem[];
  investments: InvestmentItem[];
  realEstate: RealEstateItem[];
  loans: LoanItem[];
  cashFlow?: CashFlowState;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}
