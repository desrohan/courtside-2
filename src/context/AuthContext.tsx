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
const MEMBERSHIPS_KEY = 'courtside_memberships';

function loadPersistedOrg(): OrgMembership | null {
  try {
    const raw = localStorage.getItem(CURRENT_ORG_KEY);
    return raw ? (JSON.parse(raw) as OrgMembership) : null;
  } catch {
    return null;
  }
}

function loadPersistedMemberships(): OrgMembership[] {
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_KEY);
    return raw ? (JSON.parse(raw) as OrgMembership[]) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize everything synchronously from localStorage — no white screen on refresh.
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMembershipsState] = useState<OrgMembership[]>(loadPersistedMemberships);
  const [currentOrg, setCurrentOrgState] = useState<OrgMembership | null>(loadPersistedOrg);
  // Start loading=true; we flip it off as soon as getSession() resolves (no network needed).
  const [loading, setLoading] = useState(true);

  function setCurrentOrg(org: OrgMembership | null) {
    setCurrentOrgState(org);
    if (org) localStorage.setItem(CURRENT_ORG_KEY, JSON.stringify(org));
    else localStorage.removeItem(CURRENT_ORG_KEY);
  }

  function setMemberships(orgs: OrgMembership[]) {
    setMembershipsState(orgs);
    localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(orgs));
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
    // ── Step 1: Read session from Supabase's localStorage cache.
    // NOTE: getSession() CAN hit the network if the access token is expired
    // and needs a refresh. If the refresh token is also stale/invalid the
    // promise can reject — we must always call setLoading(false) in both
    // the success AND error path, otherwise the app is stuck on the spinner.
    console.log('[Auth] calling getSession()…');

    // Safety timeout — if getSession() hangs for >5s (stale token refresh),
    // we unblock the UI anyway. onAuthStateChange usually fires first.
    const safetyTimer = setTimeout(() => {
      console.warn('[Auth] getSession() did not resolve within 5 s — forcing loading=false');
      setLoading(false);
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(safetyTimer);
        console.log('[Auth] getSession resolved — session:', session ? 'yes' : 'none', 'error:', error);

        if (error) {
          // Refresh token is likely expired or revoked. Clear stale data so
          // the user is sent to login instead of being stuck loading.
          console.warn('[Auth] getSession returned an error, clearing stale session:', error.message);
          setMemberships([]);
          setCurrentOrg(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (!session) {
          // Definitely not logged in — clear stale cache.
          setMemberships([]);
          setCurrentOrg(null);
        }

        // Unblock the UI immediately. Memberships are already in state from
        // localStorage. A background refresh follows below.
        console.log('[Auth] setLoading(false) — unblocking UI');
        setLoading(false);

        // ── Step 2: Refresh memberships from the server in the background.
        // If the cached data is correct the UI won't re-render noticeably.
        if (session?.user) {
          fetchMemberships(session.user.id)
            .then(orgs => {
              setMemberships(orgs);
              // Invalidate the cached org if it's no longer in the member list.
              const persisted = loadPersistedOrg();
              if (persisted && !orgs.some(o => o.orgId === persisted.orgId)) {
                setCurrentOrg(null);
              } else if (!persisted && orgs.length === 1) {
                setCurrentOrg(orgs[0]);
              }
            })
            .catch(err => console.error('[Auth] Background membership refresh failed:', err));
        }
      })
      .catch(err => {
        clearTimeout(safetyTimer);
        // getSession() itself rejected — treat as "not logged in" and unblock.
        console.error('[Auth] getSession() threw unexpectedly, clearing session:', err);
        setSession(null);
        setUser(null);
        setMemberships([]);
        setCurrentOrg(null);
        setLoading(false);
      });

    // ── Step 3: Listen for real auth changes (sign-in, sign-out, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange event:', event, 'session:', session ? 'yes' : 'none');
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setMemberships([]);
        setCurrentOrg(null);
        setLoading(false);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // ★ Unblock the UI IMMEDIATELY — memberships are already cached in
        // localStorage from the previous session. We refresh them in the
        // background below, but the user should never wait for that.
        console.log('[Auth] onAuthStateChange: setLoading(false) — unblocking UI before membership fetch');
        setLoading(false);

        // Background membership refresh (non-blocking)
        fetchMemberships(session.user.id)
          .then(orgs => {
            setMemberships(orgs);
            const persisted = loadPersistedOrg();
            const stillValid = persisted && orgs.some(o => o.orgId === persisted.orgId);
            if (!stillValid) {
              if (orgs.length === 1) setCurrentOrg(orgs[0]);
              else setCurrentOrg(null);
            }
          })
          .catch(e => console.error('[Auth] Failed to fetch memberships:', e));
        return;
      }

      // For TOKEN_REFRESH and any other event, also ensure we're not stuck
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
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
    setMemberships([]);
    setCurrentOrg(null);
    await supabase.auth.signOut();
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
