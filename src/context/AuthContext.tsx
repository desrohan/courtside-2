import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface OrgMembership {
  orgId: string;
  orgName: string;
  orgSlug: string;
  sport: string | null;
  role: 'admin' | 'member';
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  memberships: OrgMembership[];
  currentOrg: OrgMembership | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentOrg: (org: OrgMembership) => void;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrgMembership | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMemberships(userId: string): Promise<OrgMembership[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, organizations(id, name, slug, sport)')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data
      .filter((row: any) => row.organizations)
      .map((row: any) => ({
        orgId: row.organizations.id,
        orgName: row.organizations.name,
        orgSlug: row.organizations.slug,
        sport: row.organizations.sport,
        role: row.role,
      }));
  }

  async function refreshMemberships() {
    if (!user) return;
    const orgs = await fetchMemberships(user.id);
    setMemberships(orgs);
    // Keep currentOrg in sync if it still exists
    if (currentOrg) {
      const updated = orgs.find(o => o.orgId === currentOrg.orgId);
      if (updated) setCurrentOrg(updated);
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const orgs = await fetchMemberships(session.user.id);
          setMemberships(orgs);
          if (orgs.length === 1) setCurrentOrg(orgs[0]);
        } catch (e) {
          console.error('Failed to fetch memberships:', e);
        }
      }

      setLoading(false);
    }).catch((err) => {
      console.error('getSession failed:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const orgs = await fetchMemberships(session.user.id);
        setMemberships(orgs);
        if (orgs.length === 1) setCurrentOrg(orgs[0]);
        else if (orgs.length === 0) {
          setCurrentOrg(null);
          setMemberships([]);
        }
      } else {
        setMemberships([]);
        setCurrentOrg(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMemberships([]);
    setCurrentOrg(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      memberships,
      currentOrg,
      loading,
      signInWithGoogle,
      signOut,
      setCurrentOrg,
      refreshMemberships,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
