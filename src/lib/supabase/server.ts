// src/lib/supabase/server.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Declare a global variable to hold the Supabase client
// This ensures it's a singleton across hot module reloads in development
// and across invocations in production (for serverless functions).
declare global {
  var supabaseServerInstance: SupabaseClient | undefined
}

export function getSupabaseServerClient(): SupabaseClient {
  if (global.supabaseServerInstance) {
    return global.supabaseServerInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // --- Temporary logging for debugging ---
  console.log('--- Supabase Server Client Init ---');
  console.log('SUPABASE_URL (from .env):', supabaseUrl ? 'Loaded' : 'NOT LOADED', supabaseUrl);
  console.log('SUPABASE_ANON_KEY (from .env):', supabaseAnonKey ? 'Loaded' : 'NOT LOADED', supabaseAnonKey);
  console.log('-----------------------------------');
  // --- End temporary logging ---

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing! Check .env.local");
    // Throw an error early if keys are missing to prevent "Invalid API key" from Supabase
    throw new Error("Supabase environment variables (URL/Anon Key) are missing.");
  }

  global.supabaseServerInstance = createClient(supabaseUrl, supabaseAnonKey)
  return global.supabaseServerInstance
}
