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
    if (!session || !currentOrg) return;

    let cancelled = false;

    async function init() {
      try {
        // Fetch chat session token from our API route
        const accessToken = session!.access_token;
        const res = await fetch('/api/chat/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orgId: currentOrg!.orgId }),
        });

        if (!res.ok || cancelled) {
          console.warn('[Chat] Token fetch failed:', res.status, await res.text().catch(() => ''));
          return;
        }

        const { token, chat_user_id } = await res.json();

        const client = new SessionClient({
          baseUrl: import.meta.env.VITE_CHAT_API_URL as string,
          sessionToken: token,
          appId: import.meta.env.VITE_CHAT_APP_ID as string,
        });

        clientRef.current = client;
        setChatUserId(chat_user_id);

        // Connect WebSocket
        await client.connect();

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

      await fetchChannels(client);
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
  }, [session?.access_token, currentOrg?.orgId]);

  async function fetchChannels(client: SessionClient) {
    setChannelsLoading(true);
    try {
      const { data } = await client.getMyChannels();
      setChannels(data);
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
    if (!clientRef.current) return;
    const ack = await clientRef.current.sendMessageRealtime(channelUrl, body, {
      parentMessageId,
    });
    if (!ack.ok) console.error('[sendMessage] ack error:', ack.error);
  }, []);

  const createGroup = useCallback(async (name: string, supabaseUserIds: string[]): Promise<ChannelWithUnread | null> => {
    if (!session || !currentOrg) return null;

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
        userIds: supabaseUserIds,
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
