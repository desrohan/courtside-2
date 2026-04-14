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

const CURRENT_ORG_KEY = 'courtside_current_org';

function loadPersistedOrg(): OrgMembership | null {
  try {
    const raw = localStorage.getItem(CURRENT_ORG_KEY);
    return raw ? (JSON.parse(raw) as OrgMembership) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<OrgMembership | null>(loadPersistedOrg);
  const [loading, setLoading] = useState(true);

  function setCurrentOrg(org: OrgMembership | null) {
    setCurrentOrgState(org);
    if (org) localStorage.setItem(CURRENT_ORG_KEY, JSON.stringify(org));
    else localStorage.removeItem(CURRENT_ORG_KEY);
  }

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
    if (currentOrg) {
      const updated = orgs.find(o => o.orgId === currentOrg.orgId);
      setCurrentOrg(updated ?? null);
    }
  }

  useEffect(() => {
    // Use onAuthStateChange as the single source of truth.
    // It fires INITIAL_SESSION immediately with the current session,
    // so we don't need a separate getSession() call.
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const orgs = await fetchMemberships(session.user.id);
          setMemberships(orgs);

          // Restore persisted org if it's still valid, otherwise auto-select
          const persisted = loadPersistedOrg();
          const stillValid = persisted && orgs.some(o => o.orgId === persisted.orgId);
          if (stillValid) {
            // Keep the persisted selection (state already initialized from localStorage)
          } else if (orgs.length === 1) {
            setCurrentOrg(orgs[0]);
          } else {
            setCurrentOrg(null);
          }
        } catch (e) {
          console.error('Failed to fetch memberships:', e);
        }
      } else {
        setMemberships([]);
        setCurrentOrg(null);
      }

      if (!initialized) {
        initialized = true;
        setLoading(false);
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
