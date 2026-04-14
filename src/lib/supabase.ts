import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sport: string | null;
          invite_code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sport?: string | null;
          invite_code: string;
          created_by?: string | null;
          created_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
      };
    };
  };
};
