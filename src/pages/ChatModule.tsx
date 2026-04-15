import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Send, Paperclip, Smile, Pin, Reply, Trash2,
  Users, Phone, Video, Info, X,
  MessageCircle, FileText, Check,
  ArrowLeft, Loader2,
} from 'lucide-react';
import type { ChannelWithUnread, Message } from '@courtside/chat-sdk';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';

type NavTab = 'chats' | 'users';

interface OrgUser {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

function formatMsgTime(ts: number | string | Date) {
  const d = ts instanceof Date ? ts : new Date(ts);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function userInitials(name: string) {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2) || '??';
}

function channelDisplayName(
  ch: ChannelWithUnread,
  dmNamesMap: Record<string, string> = {},
  myUserId?: string | null,
): string {
  if (ch.name) return ch.name;
  // Use override from state (e.g. freshly created DM)
  if (dmNamesMap[ch.channel_url]) return dmNamesMap[ch.channel_url];
  // Read partner name stored in channel data at creation time
  if (ch.type === 'direct' && ch.data?.memberNames && myUserId) {
    const names = ch.data.memberNames as Record<string, string>;
    const other = Object.entries(names).find(([id]) => id !== myUserId);
    if (other) return other[1];
  }
  return 'Direct Message';
}

// ─── Create Group Dialog ──────────────────────────────
function CreateGroupDialog({
  onClose,
  users,
  onSubmit,
}: {
  onClose: () => void;
  users: OrgUser[];
  onSubmit: (name: string, userIds: string[]) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setCreating(true);
    await onSubmit(name.trim(), selected);
    setCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
          <h3 className="text-base font-bold text-dark-900">New Group</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1 block">Group Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Coaching Staff"
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5 block">Members ({selected.length})</label>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-dark-100 rounded-lg p-2">
              {users.map(u => (
                <button key={u.id} onClick={() => toggle(u.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                    selected.includes(u.id) ? 'bg-court-50 border border-court-200' : 'hover:bg-dark-50'
                  }`}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{u.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-dark-800 truncate">{u.name}</p>
                    <p className="text-[10px] text-dark-400">{u.email}</p>
                  </div>
                  {selected.includes(u.id) && <Check size={14} className="text-court-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-dark-100">
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || creating}
            className="h-8 px-4 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 disabled:opacity-40 transition-colors">
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Chat Module ─────────────────────────────────
export default function ChatModule() {
  const {
    client, chatUserId,
    channels, channelsLoading,
    messages, messagesLoading,
    typingUsers,
    loadMessages, sendMessage: sendChatMessage,
    createGroup, startDM,
    addReaction, removeReaction,
    pinMessage,
    startTyping, stopTyping,
    markRead,
    refreshChannels,
  } = useChat();
  const { user, currentOrg, session } = useAuth();

  const [navTab, setNavTab] = useState<NavTab>('chats');
  const [search, setSearch] = useState('');
  const [activeChannelUrl, setActiveChannelUrl] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [dmNamesMap, setDmNamesMap] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeChannel = channels.find(c => c.channel_url === activeChannelUrl) ?? null;
  const activeMessages = activeChannelUrl ? (messages[activeChannelUrl] ?? []) : [];
  const totalUnread = channels.reduce((sum, ch) => sum + ch.unread_count, 0);

  // Refresh channel list whenever the chat page mounts or the client connects
  useEffect(() => {
    if (client) {
      refreshChannels();
    }
  }, [client, refreshChannels]);

  // Load messages when channel is selected
  useEffect(() => {
    if (activeChannelUrl) {
      loadMessages(activeChannelUrl);
    }
  }, [activeChannelUrl, loadMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelUrl, activeMessages.length]);

  // Mark as read when viewing messages
  useEffect(() => {
    if (activeChannelUrl && activeMessages.length > 0) {
      const lastMsg = activeMessages[activeMessages.length - 1];
      markRead(activeChannelUrl, lastMsg.id);
    }
  }, [activeChannelUrl, activeMessages.length, markRead]);

  // Fetch org members for the Users tab and group creation
  useEffect(() => {
    if (!currentOrg || !session) return;
    async function fetchOrgUsers() {
      const res = await fetch(`/api/org/members?orgId=${currentOrg!.orgId}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
      });
      if (!res.ok) return;
      const data: Array<{ id: string; name: string; email: string; avatar_url: string | null; role: string }> = await res.json();
      setOrgUsers(
        data
          .filter(u => u.id !== user?.id)
          .map(u => ({
            id: u.id,
            name: u.name,
            avatar: u.name.split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??',
            email: u.email,
          }))
      );
    }
    fetchOrgUsers();
  }, [currentOrg, session, user?.id]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !activeChannelUrl) return;
    sendChatMessage(activeChannelUrl, inputText.trim(), replyTo?.id);
    setInputText('');
    setReplyTo(null);
    if (activeChannelUrl) stopTyping(activeChannelUrl);
  }, [inputText, activeChannelUrl, replyTo, sendChatMessage, stopTyping]);

  const handleInputChange = useCallback((value: string) => {
    setInputText(value);
    if (!activeChannelUrl) return;
    if (value.trim()) {
      startTyping(activeChannelUrl);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (activeChannelUrl) stopTyping(activeChannelUrl);
      }, 3000);
    } else {
      stopTyping(activeChannelUrl);
    }
  }, [activeChannelUrl, startTyping, stopTyping]);

  const handleStartDM = useCallback(async (userId: string) => {
    const channel = await startDM(userId);
    if (channel) {
      // Immediately resolve the display name for this new DM
      const targetUser = orgUsers.find(u => u.id === userId);
      if (targetUser) {
        setDmNamesMap(prev => ({ ...prev, [channel.channel_url]: targetUser.name }));
      }
      setActiveChannelUrl(channel.channel_url);
      setNavTab('chats');
    }
  }, [startDM, orgUsers]);

  const handleCreateGroup = useCallback(async (name: string, userIds: string[]) => {
    const channel = await createGroup(name, userIds);
    if (channel) {
      setActiveChannelUrl(channel.channel_url);
    }
  }, [createGroup]);

  // Resolve DM channel names for channels where ch.data.memberNames is missing
  // (created before this patch) by falling back to the dmNamesMap state.
  // For channels created after this patch the server stores names in ch.data.
  useEffect(() => {
    // nothing extra needed — dmNamesMap is populated by handleStartDM for new DMs
    // and by ch.data.memberNames for existing ones
  }, []);

  const filteredChannels = channels.filter(ch => {
    const name = channelDisplayName(ch, dmNamesMap, user?.id);
    return !search || name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredUsers = orgUsers.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase())
  );

  const isMe = (msg: Message) => msg.sender?.user_id === chatUserId;

  // ─── Loading state ──────────────────────────
  if (!client) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="h-[calc(100vh-120px)] flex items-center justify-center rounded-2xl border border-dark-100 bg-white shadow-card">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-court-500 animate-spin" />
          <p className="text-sm text-dark-400">Connecting to chat…</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-120px)] flex rounded-2xl border border-dark-100 bg-white overflow-hidden shadow-card">

      {/* ─── LEFT NAV ─────────────────────────────── */}
      <div className={`w-80 border-r border-dark-100 flex flex-col shrink-0 ${activeChannelUrl ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-dark-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-dark-900">Chat</h2>
            <div className="flex items-center gap-1">
              {totalUnread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{totalUnread}</span>
              )}
              <button onClick={() => setShowCreateGroup(true)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5 mb-3">
            <button onClick={() => setNavTab('chats')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${navTab === 'chats' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
              Chats
            </button>
            <button onClick={() => setNavTab('users')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${navTab === 'users' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
              Users
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={navTab === 'chats' ? 'Search conversations...' : 'Search users...'}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {navTab === 'chats' ? (
            channelsLoading && channels.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={18} className="text-dark-300 animate-spin" />
              </div>
            ) : filteredChannels.length === 0 ? (
              <p className="text-xs text-dark-400 text-center py-8">No conversations yet</p>
            ) : (
              filteredChannels.map(ch => {
                const displayName = channelDisplayName(ch, dmNamesMap, user?.id);
                const isActive = ch.channel_url === activeChannelUrl;
                return (
                  <button key={ch.channel_url} onClick={() => setActiveChannelUrl(ch.channel_url)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-court-50' : 'hover:bg-dark-50/50'}`}>
                    <div className="shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                        ch.type === 'group' || ch.type === 'super_group' ? 'bg-gradient-to-br from-court-400 to-court-700' : 'bg-gradient-to-br from-court-400 to-court-600'
                      }`}>
                        {ch.type === 'group' || ch.type === 'super_group' ? <Users size={16} /> : userInitials(displayName)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${ch.unread_count > 0 ? 'font-bold text-dark-900' : 'font-medium text-dark-700'}`}>{displayName}</p>
                        {ch.last_message_at && <span className="text-[10px] text-dark-400 shrink-0 ml-2">{formatMsgTime(ch.last_message_at)}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-xs truncate ${ch.unread_count > 0 ? 'text-dark-600' : 'text-dark-400'}`}>
                          {ch.member_count} members
                        </p>
                        {ch.unread_count > 0 && (
                          <span className="ml-2 w-5 h-5 rounded-full bg-court-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{ch.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            orgUsers.length === 0 ? (
              <p className="text-xs text-dark-400 text-center py-8">No other members in this organization</p>
            ) : (
              filteredUsers.map(u => (
                <button key={u.id} onClick={() => handleStartDM(u.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-dark-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{u.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-800 truncate">{u.name}</p>
                    <p className="text-[11px] text-dark-400">{u.email}</p>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>

      {/* ─── MAIN CHAT AREA ───────────────────────── */}
      {activeChannel ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 px-5 flex items-center justify-between border-b border-dark-100 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveChannelUrl(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 mr-1">
                <ArrowLeft size={16} />
              </button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                activeChannel.type === 'group' ? 'bg-gradient-to-br from-court-400 to-court-700' : 'bg-gradient-to-br from-court-400 to-court-600'
              }`}>
                {activeChannel.type === 'group' || activeChannel.type === 'super_group'
                  ? <Users size={15} />
                  : userInitials(channelDisplayName(activeChannel, dmNamesMap, user?.id))}
              </div>
              <div>
                <p className="text-sm font-bold text-dark-900">{channelDisplayName(activeChannel, dmNamesMap, user?.id)}</p>
                <p className="text-[11px] text-dark-400">
                  {activeChannel.member_count} members
                  {typingUsers[activeChannel.channel_url]?.length > 0 && (
                    <span className="text-court-500 ml-1">
                      · {typingUsers[activeChannel.channel_url].join(', ')} typing…
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Phone size={16} /></button>
              <button className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Video size={16} /></button>
              <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-lg transition-colors ${showInfo ? 'bg-court-50 text-court-600' : 'hover:bg-dark-50 text-dark-400 hover:text-dark-700'}`}>
                <Info size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messagesLoading && activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={18} className="text-dark-300 animate-spin" />
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-xs text-dark-400">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  activeMessages.map((msg, i) => {
                    const mine = isMe(msg);
                    const senderName = msg.sender?.nickname ?? 'Unknown';
                    const senderInit = userInitials(senderName);
                    const showAvatar = i === 0 || activeMessages[i - 1].sender?.user_id !== msg.sender?.user_id;
                    return (
                      <div key={msg.id} className={`flex gap-2.5 group ${mine ? 'flex-row-reverse' : ''}`}>
                        {showAvatar ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0 mt-0.5">
                            {msg.sender?.profile_url ? (
                              <img src={msg.sender.profile_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-[9px] font-bold text-white">{senderInit}</span>
                            )}
                          </div>
                        ) : <div className="w-8 shrink-0" />}
                        <div className={`max-w-[65%] ${mine ? 'items-end' : 'items-start'}`}>
                          {showAvatar && (
                            <div className={`flex items-center gap-2 mb-0.5 ${mine ? 'justify-end' : ''}`}>
                              <span className="text-xs font-semibold text-dark-700">{mine ? 'You' : senderName}</span>
                              <span className="text-[10px] text-dark-400">{formatMsgTime(msg.created_at)}</span>
                            </div>
                          )}
                          {msg.files && msg.files.length > 0 ? (
                            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${mine ? 'bg-court-50 border-court-100' : 'bg-dark-50 border-dark-100'}`}>
                              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                                <FileText size={18} className="text-dark-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-dark-800 truncate">{msg.files[0].file_name}</p>
                                <p className="text-[10px] text-dark-400">{Math.round(msg.files[0].file_size / 1024)} KB</p>
                              </div>
                            </div>
                          ) : (
                            <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                              mine ? 'bg-court-500 text-white rounded-tr-md' : 'bg-dark-50 text-dark-800 rounded-tl-md'
                            }`}>
                              {msg.body}
                            </div>
                          )}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {msg.reactions.map((r, ri) => (
                                <button key={ri}
                                  onClick={() => {
                                    const myReaction = r.users.some(u => u.user_id === chatUserId);
                                    if (myReaction) removeReaction(activeChannel.channel_url, msg.id, r.key);
                                    else addReaction(activeChannel.channel_url, msg.id, r.key);
                                  }}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-dark-100 rounded-full text-[11px] cursor-pointer hover:border-court-300">
                                  {r.key} <span className="text-dark-500 font-medium">{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {msg.thread_reply_count > 0 && (
                            <button className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-court-500 hover:underline">
                              <Reply size={11} /> {msg.thread_reply_count} replies
                            </button>
                          )}
                          <div className={`flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${mine ? 'justify-end' : ''}`}>
                            <button onClick={() => addReaction(activeChannel.channel_url, msg.id, '👍')} className="p-1 rounded hover:bg-dark-100 text-dark-400"><Smile size={12} /></button>
                            <button onClick={() => setReplyTo(msg)} className="p-1 rounded hover:bg-dark-100 text-dark-400"><Reply size={12} /></button>
                            <button onClick={() => pinMessage(activeChannel.channel_url, msg.id)} className="p-1 rounded hover:bg-dark-100 text-dark-400"><Pin size={12} /></button>
                            {mine && <button className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={12} /></button>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {replyTo && (
                <div className="px-5 py-2 bg-dark-50 border-t border-dark-100 flex items-center gap-2">
                  <Reply size={14} className="text-court-500 shrink-0" />
                  <p className="text-xs text-dark-500 truncate flex-1">Replying to <strong>{replyTo.sender?.nickname ?? 'Unknown'}</strong>: {replyTo.body}</p>
                  <button onClick={() => setReplyTo(null)} className="p-0.5 rounded hover:bg-dark-100 text-dark-400"><X size={14} /></button>
                </div>
              )}

              <div className="px-5 py-3 border-t border-dark-100 shrink-0">
                <div className="flex items-end gap-2">
                  <button className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700 shrink-0"><Paperclip size={18} /></button>
                  <div className="flex-1 relative">
                    <textarea
                      value={inputText}
                      onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Type a message..."
                      rows={1}
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-50 border border-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-500/30 focus:bg-white resize-none max-h-24"
                    />
                  </div>
                  <button className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700 shrink-0"><Smile size={18} /></button>
                  <button onClick={handleSend} disabled={!inputText.trim()}
                    className="p-2.5 rounded-xl bg-court-500 text-white hover:bg-court-600 disabled:opacity-40 transition-colors shrink-0">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showInfo && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                  className="border-l border-dark-100 overflow-hidden shrink-0">
                  <div className="w-[280px] h-full overflow-y-auto">
                    <div className="p-4 border-b border-dark-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-dark-900">Details</h3>
                        <button onClick={() => setShowInfo(false)} className="p-1 rounded-lg hover:bg-dark-50 text-dark-400"><X size={14} /></button>
                      </div>
                    </div>
                    <div className="p-4 border-b border-dark-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-3">Channel Info</h4>
                      <p className="text-sm text-dark-700">{channelDisplayName(activeChannel, dmNamesMap, user?.id)}</p>
                      <p className="text-xs text-dark-400 mt-1">{activeChannel.member_count} members · {activeChannel.type}</p>
                    </div>
                    <div className="p-4 border-b border-dark-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-3">Shared Files</h4>
                      {activeMessages.filter(m => m.files && m.files.length > 0).length === 0 ? (
                        <p className="text-xs text-dark-400">No files shared</p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeMessages.filter(m => m.files && m.files.length > 0).map(m => (
                            <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-50 cursor-pointer">
                              <div className="w-7 h-7 rounded bg-red-50 flex items-center justify-center shrink-0">
                                <FileText size={13} className="text-red-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-dark-700 truncate">{m.files![0].file_name}</p>
                                <p className="text-[10px] text-dark-400">{Math.round(m.files![0].file_size / 1024)} KB</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-court-50 flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={28} className="text-court-400" />
            </div>
            <h3 className="text-lg font-bold text-dark-800 mb-1">Your messages</h3>
            <p className="text-sm text-dark-400 max-w-xs">Select a conversation or start a new chat with a team member.</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreateGroup && (
          <CreateGroupDialog
            onClose={() => setShowCreateGroup(false)}
            users={orgUsers}
            onSubmit={handleCreateGroup}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
