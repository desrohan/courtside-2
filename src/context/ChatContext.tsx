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
        // Fetch chat session token from our API route.
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
        // Only bail after we've successfully read the response
        if (cancelled) return;

        const { token, chat_user_id } = await res.json();
        console.log('[Chat] Got session token for chat user:', chat_user_id);

        const client = new SessionClient({
          baseUrl: import.meta.env.CHAT_API_URL as string,
          sessionToken: token,
          appId: import.meta.env.CHAT_APP_ID as string,
        });

        clientRef.current = client;
        setChatUserId(chat_user_id);

        // Connect WebSocket
        console.log('[Chat] Connecting WebSocket…');
        await client.connect();
        console.log('[Chat] WebSocket connected ✓');

      // Subscribe to real-time events
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

      console.log('[Chat] Fetching channels…');
      await fetchChannels(client);
      console.log('[Chat] Init complete ✓');
      } catch (err) {
        if (!cancelled) console.error('[Chat] Init failed:', err);
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
      const ack = await clientRef.current.sendMessageRealtime(channelUrl, body, {
        parentMessageId,
      });
      console.log('[Chat] sendMessageRealtime ack:', ack);
      if (!ack.ok) {
        console.error('[Chat] sendMessage ack error:', ack.error);
        // Fallback: try REST send
        console.log('[Chat] Trying REST fallback…');
        const msg = await clientRef.current.sendMessage(channelUrl, {
          body,
          type: 'user',
        });
        console.log('[Chat] REST send succeeded:', msg.id);
        // Add message to local state
        setMessages(prev => {
          const existing = prev[channelUrl] ?? [];
          if (existing.some(m => m.id === msg.id)) return prev;
          return { ...prev, [channelUrl]: [...existing, msg] };
        });
      }
    } catch (err) {
      console.error('[Chat] sendMessage failed:', err);
      // Fallback: try REST send
      try {
        console.log('[Chat] Trying REST fallback after error…');
        const msg = await clientRef.current!.sendMessage(channelUrl, {
          body,
          type: 'user',
        });
        console.log('[Chat] REST fallback succeeded:', msg.id);
        setMessages(prev => {
          const existing = prev[channelUrl] ?? [];
          if (existing.some(m => m.id === msg.id)) return prev;
          return { ...prev, [channelUrl]: [...existing, msg] };
        });
      } catch (restErr) {
        console.error('[Chat] REST fallback also failed:', restErr);
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
    clientRef.current?.addReactionRealtime(channelUrl, messageId, key);
  }, []);

  const removeReaction = useCallback((channelUrl: string, messageId: string, key: string) => {
    clientRef.current?.removeReactionRealtime(channelUrl, messageId, key);
  }, []);

  const pinMessage = useCallback(async (channelUrl: string, messageId: string) => {
    if (!chatUserId) return;
    await clientRef.current?.pinMessage(channelUrl, messageId);
  }, [chatUserId]);

  const unpinMessage = useCallback(async (channelUrl: string, messageId: string) => {
    await clientRef.current?.unpinMessage(channelUrl, messageId);
  }, []);

  const startTyping = useCallback((channelUrl: string) => {
    clientRef.current?.startTyping(channelUrl);
  }, []);

  const stopTyping = useCallback((channelUrl: string) => {
    clientRef.current?.stopTyping(channelUrl);
  }, []);

  const markRead = useCallback((channelUrl: string, messageId: string) => {
    clientRef.current?.markReadRealtime(channelUrl, messageId);
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
