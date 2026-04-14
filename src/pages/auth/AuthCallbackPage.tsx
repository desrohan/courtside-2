import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Hexagon } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let didRedirect = false;

    async function redirect(session: Session) {
      if (didRedirect) return;
      didRedirect = true;

      const { data } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (!data || data.length === 0) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/o', { replace: true });
      }
    }

    // Supabase v2 fires INITIAL_SESSION immediately with the current
    // session, then SIGNED_IN once code exchange completes. We handle
    // both so the redirect works regardless of timing.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          subscription.unsubscribe();
          redirect(session);
        } else if (event === 'SIGNED_OUT') {
          subscription.unsubscribe();
          navigate('/auth/login', { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-court-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-court-500 to-court-700 flex items-center justify-center animate-pulse">
          <Hexagon size={22} className="text-white" strokeWidth={2.5} />
        </div>
        <p className="text-sm text-dark-400">Signing you in…</p>
      </div>
    </div>
  );
}
