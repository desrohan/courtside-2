import {
  createContext, useContext, useEffect, useRef, useState,
  useCallback, ReactNode,
} from 'react';
import { SessionClient } from '@courtside/chat-sdk';
import type {
  ChannelWithUnread, Message, WsTypingUpdate,
} from '@courtside/chat-sdk';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface ChatContextValue {
  client: SessionClient | null;
  chatUserId: string | null;
  channels: ChannelWithUnread[];
  channelsLoading: boolean;
  messages: Record<string, Message[]>;
  messagesLoading: boolean;
  typingUsers: Record<string, string[]>; // channelUrl → list of nicknames typing
  loadMessages: (channelUrl: string) => Promise<void>;
  sendMessage: (channelUrl: string, body: string, parentMessageId?: string) => Promise<void>;
  createGroup: (name: string, supabaseUserIds: string[]) => Promise<ChannelWithUnread | null>;
  startDM: (supabaseUserId: string) => Promise<ChannelWithUnread | null>;
  addReaction: (channelUrl: string, messageId: string, key: string) => void;
  removeReaction: (channelUrl: string, messageId: string, key: string) => void;
  pinMessage: (channelUrl: string, messageId: string) => Promise<void>;
  unpinMessage: (channelUrl: string, messageId: string) => Promise<void>;
  startTyping: (channelUrl: string) => void;
  stopTyping: (channelUrl: string) => void;
  markRead: (channelUrl: string, messageId: string) => void;
  refreshChannels: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { session, currentOrg } = useAuth();

  const clientRef = useRef<SessionClient | null>(null);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelWithUnread[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  // ── Chat token + connect ─────────────────────────────
  useEffect(() => {
    if (!session || !currentOrg) {
      console.log('[Chat] Skipping init — session:', !!session, 'currentOrg:', !!currentOrg);
      return;
    }

    // Skip re-connecting if already connected to this org
    if (clientRef.current?.isConnected && currentOrg.orgId === chatUserId?.split('::')[0]) {
      console.log('[Chat] Already connected to org', currentOrg.orgId);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        console.log('[Chat] Starting init for org', currentOrg!.orgId);
        const accessToken = session!.access_token;
        console.log('[Chat] Fetching token from /api/chat/token…');
        const res = await fetch('/api/chat/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orgId: currentOrg!.orgId }),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.error('[Chat] Token fetch failed:', res.status, errText);
          return;
        }
        if (cancelled) return;

        const { token, chat_user_id } = await res.json();
        console.log('[Chat] Got session token for chat user:', chat_user_id);

        const client = new SessionClient({
          baseUrl: import.meta.env.CHAT_API_URL as string,
          sessionToken: token,
          appId: import.meta.env.CHAT_APP_ID as string,
        });

        // Check cancelled before committing — React Strict Mode in dev will
        // unmount→remount, and the first init's cleanup fires while we're
        // still awaiting. If cancelled, bail so the second mount can succeed.
        if (cancelled) return;

        clientRef.current = client;
        setChatUserId(chat_user_id);

        // Fetch channels via REST first (doesn't need WS)
        console.log('[Chat] Fetching channels…');
        await fetchChannels(client);
        console.log('[Chat] Channels loaded ✓');

        // Check cancelled again before starting WS — Strict Mode cleanup
        // may have fired during the fetchChannels await
        if (cancelled) {
          console.log('[Chat] Cancelled before WS connect (Strict Mode cleanup)');
          return;
        }

        // Connect WebSocket for real-time push (non-blocking — REST still works if WS fails)
        console.log('[Chat] Connecting WebSocket…');
        try {
          await client.connect();
          console.log('[Chat] WebSocket connected ✓');

          // Register real-time event handlers AFTER connect (SDK requires it)
          if (cancelled) return;
          client
            .onMessage(event => {
              setMessages(prev => {
                const existing = prev[event.channelUrl] ?? [];
                if (existing.some(m => m.id === event.message.id)) return prev;
                return { ...prev, [event.channelUrl]: [...existing, event.message] };
              });
              setChannels(prev => prev.map(ch =>
                ch.channel_url === event.channelUrl
                  ? { ...ch, unread_count: ch.unread_count + 1 }
                  : ch
              ));
            })
            .onMessageUpdated(event => {
              setMessages(prev => {
                const list = prev[event.channelUrl];
                if (!list) return prev;
                return {
                  ...prev,
                  [event.channelUrl]: list.map(m => m.id === event.message.id ? event.message : m),
                };
              });
            })
            .onMessageDeleted(event => {
              setMessages(prev => {
                const list = prev[event.channelUrl];
                if (!list) return prev;
                return {
                  ...prev,
                  [event.channelUrl]: list.filter(m => m.id !== event.messageId),
                };
              });
            })
            .onTyping((event: WsTypingUpdate) => {
              setTypingUsers(prev => {
                const current = prev[event.channelUrl] ?? [];
                if (event.isTyping) {
                  if (current.includes(event.userId)) return prev;
                  return { ...prev, [event.channelUrl]: [...current, event.userId] };
                } else {
                  return { ...prev, [event.channelUrl]: current.filter(n => n !== event.userId) };
                }
              });
            })
            .onReactionUpdated(event => {
              setMessages(prev => {
                const list = prev[event.channelUrl];
                if (!list) return prev;
                return {
                  ...prev,
                  [event.channelUrl]: list.map(m =>
                    m.id === event.messageId ? { ...m, reactions: event.reactions } : m
                  ),
                };
              });
            })
            .onSyncRequired(async () => {
              await fetchChannels(client);
            });
          console.log('[Chat] Event handlers registered ✓');
        } catch (wsErr) {
          if (!cancelled) {
            console.warn('[Chat] WebSocket connection failed (REST still works):', (wsErr as Error).message);
          }
        }
      } catch (err) {
        if (!cancelled) console.error('[Chat] Init error:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      clientRef.current?.disconnect();
      clientRef.current = null;
      setChatUserId(null);
      setChannels([]);
      setMessages({});
      setTypingUsers({});
    };
  // Use user id (stable) + orgId as deps — access_token changes on every
  // token refresh which would tear down the WS connection unnecessarily.
  }, [session?.user?.id, currentOrg?.orgId]);

  async function fetchChannels(client: SessionClient) {
    setChannelsLoading(true);
    try {
      console.log('[Chat] fetchChannels: calling getMyChannels()…');
      const { data } = await client.getMyChannels();
      console.log('[Chat] fetchChannels: got', data.length, 'channels');
      setChannels(data);
    } catch (err) {
      console.error('[Chat] fetchChannels failed:', err);
    } finally {
      setChannelsLoading(false);
    }
  }

  const refreshChannels = useCallback(async () => {
    if (!clientRef.current) return;
    await fetchChannels(clientRef.current);
  }, []);

  const loadMessages = useCallback(async (channelUrl: string) => {
    if (!clientRef.current) return;
    setMessagesLoading(true);
    try {
      const { data } = await clientRef.current.listMessages(channelUrl, { limit: 50 });
      setMessages(prev => ({ ...prev, [channelUrl]: data }));
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (channelUrl: string, body: string, parentMessageId?: string) => {
    if (!clientRef.current) {
      console.error('[Chat] sendMessage: no client connected');
      return;
    }
    console.log('[Chat] Sending message to', channelUrl, '— body length:', body.length);
    try {
      // Use REST API as primary — it returns the full Message object so we
      // can add it to local state immediately. The WS onMessage handler
      // deduplicates by ID, so no double-rendering if the echo also arrives.
      const msg = await clientRef.current.sendMessage(channelUrl, {
        body,
        type: 'user',
      });
      console.log('[Chat] REST send succeeded:', msg.id);
      // Add message to local state immediately
      setMessages(prev => {
        const existing = prev[channelUrl] ?? [];
        if (existing.some(m => m.id === msg.id)) return prev;
        return { ...prev, [channelUrl]: [...existing, msg] };
      });
    } catch (err) {
      console.error('[Chat] sendMessage REST failed:', err);
      // Fallback: try WebSocket send
      try {
        console.log('[Chat] Trying WS fallback…');
        const ack = await clientRef.current.sendMessageRealtime(channelUrl, body, {
          parentMessageId,
        });
        console.log('[Chat] WS fallback ack:', ack);
        if (ack.ok) {
          // WS doesn't return the message, reload to fetch it
          const { data } = await clientRef.current!.listMessages(channelUrl, { limit: 50 });
          setMessages(prev => ({ ...prev, [channelUrl]: data }));
        }
      } catch (wsErr) {
        console.error('[Chat] WS fallback also failed:', wsErr);
      }
    }
  }, []);

  const createGroup = useCallback(async (name: string, supabaseUserIds: string[]): Promise<ChannelWithUnread | null> => {
    if (!session || !currentOrg) return null;

    // Always include the creator in the group
    const allUserIds = Array.from(new Set([session.user.id, ...supabaseUserIds]));

    const res = await fetch('/api/channels/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        orgId: currentOrg.orgId,
        type: 'group',
        name,
        userIds: allUserIds,
      }),
    });

    if (!res.ok) return null;
    const channel = await res.json();
    await refreshChannels();
    return channel;
  }, [session, currentOrg, refreshChannels]);

  const startDM = useCallback(async (supabaseUserId: string): Promise<ChannelWithUnread | null> => {
    if (!session || !currentOrg) return null;

    const res = await fetch('/api/channels/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        orgId: currentOrg.orgId,
        type: 'direct',
        userIds: [session.user.id, supabaseUserId],
      }),
    });

    if (!res.ok) return null;
    const channel = await res.json();
    await refreshChannels();
    return channel;
  }, [session, currentOrg, refreshChannels]);

  const addReaction = useCallback((channelUrl: string, messageId: string, key: string) => {
    try { clientRef.current?.addReactionRealtime(channelUrl, messageId, key); }
    catch { /* WS not connected yet — silent */ }
  }, []);

  const removeReaction = useCallback((channelUrl: string, messageId: string, key: string) => {
    try { clientRef.current?.removeReactionRealtime(channelUrl, messageId, key); }
    catch { /* WS not connected yet — silent */ }
  }, []);

  const pinMessage = useCallback(async (channelUrl: string, messageId: string) => {
    if (!clientRef.current) return;
    try { await clientRef.current.pinMessage(channelUrl, messageId); }
    catch (e) { console.warn('[Chat] pinMessage failed:', e); }
  }, []);

  const unpinMessage = useCallback(async (channelUrl: string, messageId: string) => {
    if (!clientRef.current) return;
    try { await clientRef.current.unpinMessage(channelUrl, messageId); }
    catch (e) { console.warn('[Chat] unpinMessage failed:', e); }
  }, []);

  const startTyping = useCallback((channelUrl: string) => {
    try { clientRef.current?.startTyping(channelUrl); }
    catch { /* WS not connected yet — silent */ }
  }, []);

  const stopTyping = useCallback((channelUrl: string) => {
    try { clientRef.current?.stopTyping(channelUrl); }
    catch { /* WS not connected yet — silent */ }
  }, []);

  const markRead = useCallback((channelUrl: string, messageId: string) => {
    try { clientRef.current?.markReadRealtime(channelUrl, messageId); }
    catch { /* WS not connected yet — silent */ }
    setChannels(prev => prev.map(ch =>
      ch.channel_url === channelUrl ? { ...ch, unread_count: 0 } : ch
    ));
  }, []);

  return (
    <ChatContext.Provider value={{
      client: clientRef.current,
      chatUserId,
      channels,
      channelsLoading,
      messages,
      messagesLoading,
      typingUsers,
      loadMessages,
      sendMessage,
      createGroup,
      startDM,
      addReaction,
      removeReaction,
      pinMessage,
      unpinMessage,
      startTyping,
      stopTyping,
      markRead,
      refreshChannels,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
