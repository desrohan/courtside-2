import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { orgId } = req.query as { orgId?: string };
  if (!orgId) {
    return res.status(400).json({ error: 'orgId is required' });
  }

  // Verify requester is a member
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (memberError || !membership) {
    return res.status(403).json({ error: 'Not a member of this organization' });
  }

  // Get all member user_ids for this org
  const { data: members, error: membersError } = await supabaseAdmin
    .from('organization_members')
    .select('user_id, role')
    .eq('org_id', orgId);

  if (membersError || !members) {
    return res.status(500).json({ error: 'Failed to fetch members' });
  }

  // Fetch auth user details for each member using the admin API
  const userDetails = await Promise.all(
    members.map(async (m) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
      const u = data?.user;
      return {
        id: m.user_id,
        role: m.role,
        name: u?.user_metadata?.full_name ?? u?.email ?? m.user_id.slice(0, 8),
        email: u?.email ?? '',
        avatar_url: u?.user_metadata?.avatar_url ?? null,
      };
    })
  );

  return res.status(200).json(userDetails);
}
