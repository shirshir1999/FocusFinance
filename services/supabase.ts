
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
        alert("במצב הדגמה מקומי, התחברות עם גוגל אינה פעילה. אנא השתמש באימייל וסיסמה רגילים.");
        return { error: { message: "Not supported in mock mode" } };
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
          select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: "Mock Mode" } }) }) }),
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
