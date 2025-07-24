import { createClient } from '@supabase/supabase-js'

/**
 * One shared Supabase client.
 *
 * It automatically reads the URL and anon key
 * from your `.env.local` environment file.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,      //  ← the "!" tells TS it's defined
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
console.log('Supabase URL ->', process.env.NEXT_PUBLIC_SUPABASE_URL)
// console.log('Supabase Anon Key ->', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)