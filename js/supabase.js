import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://etjeyblrvfvnftwgrtgl.supabase.co';
export const supabaseKey = 'sb_publishable_iozyPFSZqfkITZ5M9Aa70A_rIqVJJvr';

export const supabase = createClient(supabaseUrl, supabaseKey);
