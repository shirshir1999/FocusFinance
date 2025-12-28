
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.0';

// Safe access to environment variables
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env?.[key] || '';
  } catch (e) {
    return '';
  }
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Check Local Storage for manual override
const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_supabase_url') : '';
const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_supabase_key') : '';

const supabaseUrl = envUrl || localUrl || '';
const supabaseAnonKey = envKey || localKey || '';

export const hasMissingKeys = !supabaseUrl || !supabaseAnonKey;

export const clearCustomKeys = () => {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('custom_supabase_url');
        localStorage.removeItem('custom_supabase_key');
        localStorage.removeItem('mock_session'); // Clear mock session on reset
        window.location.reload();
    }
};

let supabaseClient: any = null;

// --- MOCK IMPLEMENTATION FOR LOCAL TESTING ---
const mockAuth = {
    getSession: async () => {
        const stored = localStorage.getItem('mock_session');
        return { data: { session: stored ? JSON.parse(stored) : null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
        // Simple mock subscription
        return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async ({ email }: any) => {
        const user = { id: 'mock-user-id', email, user_metadata: { full_name: 'משתמש בדיקה' } };
        const session = { user, access_token: 'mock-token' };
        localStorage.setItem('mock_session', JSON.stringify(session));
        return { data: { user, session }, error: null };
    },
    signUp: async ({ email, options }: any) => {
        const user = { 
            id: 'mock-user-id', 
            email, 
            user_metadata: { full_name: options?.data?.full_name || 'משתמש חדש' } 
        };
        const session = { user, access_token: 'mock-token' };
        localStorage.setItem('mock_session', JSON.stringify(session));
        return { data: { user, session }, error: null };
    },
    signInWithOAuth: async () => {
        // Mock success for local mode
        const user = {
            id: 'mock-user-id',
            email: 'demo@local.com',
            user_metadata: { full_name: 'משתמש הדגמה' }
        };
        const session = { user, access_token: 'mock-token' };
        localStorage.setItem('mock_session', JSON.stringify(session));
        return { data: { session }, error: null };
    },
    signOut: async () => {
        localStorage.removeItem('mock_session');
        return { error: null };
    },
};

if (!hasMissingKeys) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("❌ Failed to initialize Supabase client:", e);
  }
} else {
  console.warn("⚠️ Supabase credentials missing. App running in LOCAL DEMO MODE.");
  // Use Mock Client
  supabaseClient = {
      auth: mockAuth,
      from: () => ({
          select: () => ({ 
              eq: () => ({ single: async () => ({ data: null, error: { message: "Mock Mode" } }) }),
              contains: () => ({ data: [], error: null }) // Mock contains response
          }),
          upsert: async () => ({ error: null })
      })
  };
}

export const supabase = supabaseClient;

// Data persistence: Use Real Supabase OR Local Storage if keys missing
export const saveUserData = async (userId: string, data: any) => {
  if (hasMissingKeys) {
      localStorage.setItem(`mock_data_${userId}`, JSON.stringify(data));
      return;
  }
  
  const { error } = await supabase
    .from('user_data')
    .upsert({ 
      id: userId, 
      financial_json: data, 
      updated_at: new Date().toISOString() 
    });
  if (error) console.error('Error saving to cloud:', error);
};

export const fetchUserData = async (userId: string) => {
  if (hasMissingKeys) {
      const local = localStorage.getItem(`mock_data_${userId}`);
      return local ? JSON.parse(local) : null;
  }

  const { data, error } = await supabase
    .from('user_data')
    .select('financial_json')
    .eq('id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') { 
    console.error('Error fetching from cloud:', error);
    return null;
  }
  return data?.financial_json || null;
};

// Fetch portfolios shared WITH this email
export const fetchSharedPortfolios = async (email: string) => {
    if (hasMissingKeys) {
        // Mock: Scan all local storage keys starting with mock_data_
        const shared = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('mock_data_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    if (data.authorizedEmails && Array.isArray(data.authorizedEmails) && data.authorizedEmails.includes(email)) {
                        // Avoid adding own portfolio if fetched by mistake
                        shared.push({
                            id: key.replace('mock_data_', ''),
                            name: data.profiles?.[0]?.name || 'תיק משותף',
                            ownerName: 'יועץ/שותף' // Simplified for mock
                        });
                    }
                } catch(e) {}
            }
        }
        return shared;
    }

    // Real Supabase Query
    // Note: This requires RLS policy to allow SELECT if email is in authorizedEmails column or json
    const { data, error } = await supabase
        .from('user_data')
        .select('id, financial_json')
        .contains('financial_json', { authorizedEmails: [email] });

    if (error) {
        console.error('Error fetching shared portfolios:', error);
        return [];
    }

    return data.map((row: any) => ({
        id: row.id,
        name: row.financial_json?.profiles?.[0]?.name || 'תיק משותף',
        ownerName: 'יועץ/שותף'
    }));
};
