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
  hasMoreMessages: Record<string, boolean>;
  loadingOlder: boolean;
  typingUsers: Record<string, string[]>; // channelUrl → list of nicknames typing
  loadMessages: (channelUrl: string) => Promise<void>;
  loadOlderMessages: (channelUrl: string) => Promise<void>;
  sendMessage: (channelUrl: string, body: string, parentMessageId?: string, files?: File[]) => Promise<void>;
  createGroup: (name: string, supabaseUserIds: string[]) => Promise<ChannelWithUnread | null>;
  startDM: (supabaseUserId: string) => Promise<ChannelWithUnread | null>;
  addReaction: (channelUrl: string, messageId: string, key: string) => void;
  removeReaction: (channelUrl: string, messageId: string, key: string) => void;
  pinMessage: (channelUrl: string, messageId: string) => Promise<void>;
  unpinMessage: (channelUrl: string, messageId: string) => Promise<void>;
  startTyping: (channelUrl: string) => void;
  stopTyping: (channelUrl: string) => void;
  markRead: (channelUrl: string, messageId: string) => void;
  markAsRead: (channelUrl: string) => Promise<void>;
  refreshChannels: () => Promise<void>;
  replyToThread: (channelUrl: string, messageId: string, body: string) => Promise<void>;
  getThreadReplies: (channelUrl: string, messageId: string) => Promise<Message[]>;
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
  const [paginationCursors, setPaginationCursors] = useState<Record<string, string | null>>({});
  const [hasMoreMessages, setHasMoreMessages] = useState<Record<string, boolean>>({});
  const [loadingOlder, setLoadingOlder] = useState(false);

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
      const { data, pagination } = await clientRef.current.listMessages(channelUrl, { limit: 50 });
      // Sort ascending by created_at so newest messages are at the bottom
      const sorted = [...data].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(prev => ({ ...prev, [channelUrl]: sorted }));
      paginationCursorsRef.current = { ...paginationCursorsRef.current, [channelUrl]: pagination?.prev_cursor ?? null };
      setPaginationCursors(prev => ({ ...prev, [channelUrl]: pagination?.prev_cursor ?? null }));
      setHasMoreMessages(prev => ({ ...prev, [channelUrl]: pagination?.has_more ?? false }));
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const paginationCursorsRef = useRef<Record<string, string | null>>({});

  const loadOlderMessages = useCallback(async (channelUrl: string) => {
    if (!clientRef.current) return;
    const cursor = paginationCursorsRef.current[channelUrl];
    if (!cursor) return; // no more pages
    setLoadingOlder(true);
    try {
      const { data, pagination } = await clientRef.current.listMessages(channelUrl, {
        limit: 50,
        before: cursor,
      });
      const sorted = [...data].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      // Prepend older messages
      setMessages(prev => {
        const existing = prev[channelUrl] ?? [];
        // Deduplicate by message id
        const existingIds = new Set(existing.map(m => m.id));
        const newMsgs = sorted.filter(m => !existingIds.has(m.id));
        return { ...prev, [channelUrl]: [...newMsgs, ...existing] };
      });
      const newCursor = pagination?.prev_cursor ?? null;
      const newHasMore = pagination?.has_more ?? false;
      paginationCursorsRef.current = { ...paginationCursorsRef.current, [channelUrl]: newCursor };
      setPaginationCursors(prev => ({ ...prev, [channelUrl]: newCursor }));
      setHasMoreMessages(prev => ({ ...prev, [channelUrl]: newHasMore }));
    } finally {
      setLoadingOlder(false);
    }
  }, []);

  const sendMessage = useCallback(async (channelUrl: string, body: string, parentMessageId?: string, files?: File[]) => {
    if (!clientRef.current) {
      console.error('[Chat] sendMessage: no client connected');
      return;
    }
    console.log('[Chat] Sending message to', channelUrl, '— body length:', body.length, 'parentMessageId:', parentMessageId, 'files:', files?.length ?? 0);

    // Upload files to Supabase Storage and build MessageFile objects
    let uploadedFiles: Array<{ file_url: string; file_name: string; file_type: string; file_size: number }> = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const ext = file.name.split('.').pop() || 'bin';
          const path = `chat/${channelUrl}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { data: uploadData, error } = await supabase.storage
            .from('chat-files')
            .upload(path, file, { contentType: file.type, upsert: false });
          if (error) {
            console.error('[Chat] File upload failed:', error.message);
            continue;
          }
          const { data: urlData } = supabase.storage.from('chat-files').getPublicUrl(uploadData.path);
          if (urlData.publicUrl) {
            uploadedFiles.push({
              file_url: urlData.publicUrl,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
            });
          }
        } catch (err) {
          console.error('[Chat] File upload error:', err);
        }
      }
    }

    const hasFiles = uploadedFiles.length > 0;

    if (!body && !hasFiles) {
      console.warn('[Chat] Nothing to send — body empty and no files uploaded');
      return;
    }

    // If replying to a message, use replyToThread to create/add to a thread
    if (parentMessageId) {
      try {
        await clientRef.current.replyToThread(channelUrl, parentMessageId, body || '(file)');
        console.log('[Chat] Thread reply sent ✓');
        const { data } = await clientRef.current.listMessages(channelUrl, { limit: 50 });
        const sorted = [...data].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(prev => ({ ...prev, [channelUrl]: sorted }));
      } catch (err) {
        console.error('[Chat] replyToThread failed:', err);
      }
      return;
    }

    try {
      // Build params — SDK passes them straight to REST API
      const params: Record<string, unknown> = {
        body: body || '',
        type: hasFiles ? 'file' : 'user',
      };
      if (hasFiles) {
        params.files = uploadedFiles;
      }

      const msg = await clientRef.current.sendMessage(channelUrl, params as any);
      console.log('[Chat] REST send succeeded:', msg.id, 'type:', msg.type);
      setMessages(prev => {
        const existing = prev[channelUrl] ?? [];
        if (existing.some(m => m.id === msg.id)) return prev;
        return { ...prev, [channelUrl]: [...existing, msg] };
      });
    } catch (err) {
      console.error('[Chat] sendMessage REST failed:', err);
      try {
        console.log('[Chat] Trying WS fallback…');
        const ack = await clientRef.current.sendMessageRealtime(channelUrl, body || '(file)', {});
        console.log('[Chat] WS fallback ack:', ack);
        if (ack.ok) {
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

  const addReaction = useCallback(async (channelUrl: string, messageId: string, key: string) => {
    if (!clientRef.current) return;
    try {
      const response = await clientRef.current.addReaction(channelUrl, messageId, key) as any;
      console.log('[Chat] addReaction response:', JSON.stringify(response));
      // API returns {ok, message_id, reactions: [{key, count}]} — extract the reactions array
      const reactionsArray = response?.reactions ?? response;
      setMessages(prev => {
        const list = prev[channelUrl];
        if (!list) return prev;
        return {
          ...prev,
          [channelUrl]: list.map(m =>
            m.id === messageId ? { ...m, reactions: reactionsArray as Message['reactions'] } : m
          ),
        };
      });
    } catch (e) {
      console.warn('[Chat] addReaction failed:', e);
    }
  }, []);

  const removeReaction = useCallback(async (channelUrl: string, messageId: string, key: string) => {
    if (!clientRef.current) return;
    try {
      const response = await clientRef.current.removeReaction(channelUrl, messageId, key) as any;
      console.log('[Chat] removeReaction response:', JSON.stringify(response));
      const reactionsArray = response?.reactions ?? response;
      setMessages(prev => {
        const list = prev[channelUrl];
        if (!list) return prev;
        return {
          ...prev,
          [channelUrl]: list.map(m =>
            m.id === messageId ? { ...m, reactions: reactionsArray as Message['reactions'] } : m
          ),
        };
      });
    } catch (e) {
      console.warn('[Chat] removeReaction failed:', e);
    }
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
  }, []);

  const markAsRead = useCallback(async (channelUrl: string) => {
    try {
      await clientRef.current?.markAsRead(channelUrl);
    } catch { /* silent */ }
    setChannels(prev => prev.map(ch =>
      ch.channel_url === channelUrl ? { ...ch, unread_count: 0 } : ch
    ));
  }, []);

  const replyToThread = useCallback(async (channelUrl: string, messageId: string, body: string) => {
    if (!clientRef.current) return;
    try {
      await clientRef.current.replyToThread(channelUrl, messageId, body);
      // Refresh the parent message to update thread_reply_count
      const { data } = await clientRef.current.listMessages(channelUrl, { limit: 50 });
      const sorted = [...data].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(prev => ({ ...prev, [channelUrl]: sorted }));
    } catch (e) {
      console.error('[Chat] replyToThread failed:', e);
    }
  }, []);

  const getThreadReplies = useCallback(async (channelUrl: string, messageId: string): Promise<Message[]> => {
    if (!clientRef.current) return [];
    try {
      const { data } = await clientRef.current.getThreadReplies(channelUrl, messageId);
      return data;
    } catch (e) {
      console.error('[Chat] getThreadReplies failed:', e);
      return [];
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      client: clientRef.current,
      chatUserId,
      channels,
      channelsLoading,
      messages,
      messagesLoading,
      hasMoreMessages,
      loadingOlder,
      typingUsers,
      loadMessages,
      loadOlderMessages,
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
      markAsRead,
      refreshChannels,
      replyToThread,
      getThreadReplies,
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
