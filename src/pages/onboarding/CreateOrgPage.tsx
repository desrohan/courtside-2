import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Hexagon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const SPORTS = [
  'Football', 'Basketball', 'Rugby', 'Cricket', 'Tennis',
  'Hockey', 'Volleyball', 'Swimming', 'Athletics', 'Other',
];

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CreateOrgPage() {
  const navigate = useNavigate();
  const { user, refreshMemberships, setCurrentOrg } = useAuth();

  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!user) return;
    setLoading(true);
    setError('');

    const inviteCode = generateInviteCode();
    const baseSlug = toSlug(name) || `org-${Date.now()}`;
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    // Insert org
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug,
        sport: sport || null,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (orgError || !org) {
      setError(orgError?.message ?? 'Failed to create organization. Try again.');
      setLoading(false);
      return;
    }

    // Insert admin membership
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({ org_id: org.id, user_id: user.id, role: 'admin' });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    await refreshMemberships();
    setCurrentOrg({ orgId: org.id, orgName: org.name, orgSlug: org.slug, sport: org.sport, role: 'admin' });
    navigate(`/o/${org.id}`, { replace: true });
  }

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
          <span className="text-sm font-bold text-dark-900">Create Organization</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-dark-100 p-8"
        >
          <h2 className="text-xl font-bold text-dark-900 mb-1">New Organization</h2>
          <p className="text-sm text-dark-400 mb-6">Fill in your organization details to get started.</p>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5 block">
                Organization Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. FC Courtside"
                className="w-full h-10 px-3.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-500/40"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5 block">
                Sport / Type
              </label>
              <select
                value={sport}
                onChange={e => setSport(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-500/40 bg-white"
              >
                <option value="">Select a sport…</option>
                {SPORTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="w-full h-11 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 transition-colors"
            >
              {loading ? 'Creating…' : 'Create Organization'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
