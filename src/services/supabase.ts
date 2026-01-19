import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer SERVICE_ROLE for backend admin tasks, fallback to ANON (might fail RLS)
const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
