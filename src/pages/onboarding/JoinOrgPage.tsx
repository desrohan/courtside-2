import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Hexagon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function JoinOrgPage() {
  const navigate = useNavigate();
  const { user, refreshMemberships, setCurrentOrg } = useAuth();

  const [code, setCode] = useState<string[]>(Array(8).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleInput(index: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = char;
    setCode(next);
    if (char && index < 7) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    inputs.current[Math.min(pasted.length, 7)]?.focus();
  }

  async function handleJoin() {
    if (!user) return;
    const inviteCode = code.join('');
    if (inviteCode.length !== 8) return;

    setLoading(true);
    setError('');

    // Look up the org by invite code
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, sport')
      .eq('invite_code', inviteCode)
      .single();

    if (orgError || !org) {
      setError('Invalid invite code. Please check and try again.');
      setLoading(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('organization_members')
      .select('id')
      .eq('org_id', org.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Already a member — just navigate in
      setCurrentOrg({ orgId: org.id, orgName: org.name, orgSlug: org.slug, sport: org.sport, role: 'member' });
      navigate(`/o/${org.id}`, { replace: true });
      return;
    }

    // Insert membership
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({ org_id: org.id, user_id: user.id, role: 'member' });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    await refreshMemberships();
    setCurrentOrg({ orgId: org.id, orgName: org.name, orgSlug: org.slug, sport: org.sport, role: 'member' });
    navigate(`/o/${org.id}`, { replace: true });
  }

  const codeComplete = code.every(c => c !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-court-50 flex flex-col">
      <header className="h-16 px-6 flex items-center gap-3 border-b border-dark-100 bg-white/70 backdrop-blur-xl">
        <button onClick={() => navigate('/onboarding')} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-court-500 to-court-700 flex items-center justify-center">
            <Hexagon size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-dark-900">Join Organization</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-dark-100 p-8"
        >
          <h2 className="text-xl font-bold text-dark-900 mb-1">Enter invite code</h2>
          <p className="text-sm text-dark-400 mb-8">Ask your team admin for the 8-character code.</p>

          {/* Code input boxes */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((char, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={char}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-10 h-12 text-center text-lg font-bold rounded-xl border-2 border-dark-200 focus:border-court-500 focus:outline-none focus:ring-2 focus:ring-court-500/20 transition-all uppercase tracking-widest"
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={!codeComplete || loading}
            className="w-full h-11 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Joining…' : 'Join Organization'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
