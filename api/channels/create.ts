import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { PlatformClient } from '@courtside/chat-sdk';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const platform = new PlatformClient({
  baseUrl: process.env.CHAT_API_URL!,
  apiToken: process.env.CHAT_API_TOKEN!,
  appId: process.env.CHAT_APP_ID!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const supabaseJwt = authHeader.slice(7);

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(supabaseJwt);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { orgId, type, name, userIds } = req.body as {
    orgId?: string;
    type?: 'group' | 'direct';
    name?: string;
    userIds?: string[];
  };

  if (!orgId || !type || !userIds?.length) {
    return res.status(400).json({ error: 'orgId, type, and userIds are required' });
  }

  // Verify the requester is a member of this org
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (memberError || !membership) {
    return res.status(403).json({ error: 'Not a member of this organization' });
  }

  // Namespace all user ids for this org
  const namespacedUserIds = userIds.map(uid => `${orgId}::${uid}`);

  // For direct channels, store both users' names in `data` so the client
  // can display them without a round-trip listMembers call.
  let channelData: Record<string, unknown> | undefined;
  if (type === 'direct') {
    try {
      const memberIds = [user.id, ...userIds.filter(uid => uid !== user.id)];
      const nameResults = await Promise.all(
        memberIds.map(uid => supabaseAdmin.auth.admin.getUserById(uid))
      );
      const memberNames: Record<string, string> = {};
      nameResults.forEach(({ data: d }, i) => {
        if (d?.user) {
          const u = d.user;
          const n = u.user_metadata?.full_name ?? u.email ?? u.id;
          memberNames[memberIds[i]] = n;
        }
      });
      channelData = { memberNames };
    } catch {
      // non-fatal — channel still created without names
    }
  }

  try {
    const channel = await platform.createChannel({
      type,
      name: name ?? undefined,
      user_ids: namespacedUserIds,
      is_distinct: type === 'direct',
      data: channelData,
    });

    return res.status(200).json(channel);
  } catch (err: any) {
    console.error('[channels/create]', err);
    return res.status(500).json({ error: 'Failed to create channel' });
  }
}
