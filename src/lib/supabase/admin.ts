import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the private service role key.
 * This client bypasses Row Level Security (RLS) and is intended solely for server-side
 * administrative tasks like running cron resolution scripts.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder-project.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key'
  )
}
