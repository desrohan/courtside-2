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

  // Verify the Supabase JWT and get the user
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(supabaseJwt);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { orgId } = req.body as { orgId?: string };
  if (!orgId) {
    return res.status(400).json({ error: 'orgId is required' });
  }

  // Verify the user is actually a member of this org
  const { data: membership, error: memberError } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (memberError || !membership) {
    return res.status(403).json({ error: 'Not a member of this organization' });
  }

  // Namespaced chat user id — unique per org
  const chatUserId = `${orgId}::${user.id}`;
  const nickname = user.user_metadata?.full_name ?? user.email ?? chatUserId;
  const profileUrl = user.user_metadata?.avatar_url ?? undefined;

  try {
    try {
      await platform.createUser({
        user_id: chatUserId,
        nickname,
        profile_url: profileUrl,
      });
    } catch (createErr: any) {
      // USER_ALREADY_EXISTS is expected on subsequent logins — continue to issue token
      if (createErr?.code !== 'USER_ALREADY_EXISTS') throw createErr;
    }

    const tokenResponse = await platform.issueSessionToken(chatUserId);

    return res.status(200).json({
      token: tokenResponse.token,
      expires_at: tokenResponse.expires_at,
      chat_user_id: chatUserId,
    });
  } catch (err: any) {
    console.error('[chat/token]', err);
    return res.status(500).json({ error: 'Failed to issue chat session token' });
  }
}
