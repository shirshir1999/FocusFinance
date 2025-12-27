import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.0';

// Safely access environment variables
const getEnv = (key: string) => {
  // Check import.meta.env (Vite)
  if (typeof (import.meta as any) !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key] || '';
  }
  // Check process.env (Webpack/Node)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

let supabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
}

// Fallback mock client if Supabase is not configured or initialization failed
if (!supabaseClient) {
  console.warn("⚠️ Supabase keys are missing or invalid! App running in offline/demo mode. Auth will fail.");
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: { message: "Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." } }),
      signUp: async () => ({ data: null, error: { message: "Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." } }),
      signInWithOAuth: async () => ({ data: null, error: { message: "Supabase not configured." } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null })
        })
      }),
      upsert: async () => ({ error: { message: "Supabase not configured" } })
    })
  };
}

export const supabase = supabaseClient as any;

export const saveUserData = async (userId: string, data: any) => {
  if (!supabaseUrl) return;
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
  if (!supabaseUrl) return null;
  const { data, error } = await supabase
    .from('user_data')
    .select('financial_json')
    .eq('id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine for new users
    console.error('Error fetching from cloud:', error);
    return null;
  }
  return data?.financial_json || null;
};