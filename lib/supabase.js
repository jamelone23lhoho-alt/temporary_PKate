import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const options = {
  auth: { persistSession: false },
  global: { fetch: fetch.bind(globalThis) }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  options
);
