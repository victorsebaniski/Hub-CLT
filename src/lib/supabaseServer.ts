import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient | null {
  if (supabaseServerClient) return supabaseServerClient;

  const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  const supabaseUrl = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '') : '';

  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-project')) {
    return null;
  }

  supabaseServerClient = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
    },
  });

  return supabaseServerClient;
}
