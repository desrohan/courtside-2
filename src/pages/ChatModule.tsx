import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Send, Paperclip, Smile, Pin, Reply, Trash2,
  Users, Phone, Video, Info, X, Image as ImageIcon,
  MessageCircle, FileText, Check, Download,
  ArrowLeft, Loader2,
} from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
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
  if (dmNamesMap[ch.channel_url]) return dmNamesMap[ch.channel_url];
  if (ch.type === 'direct' && ch.data?.memberNames && myUserId) {
    const names = ch.data.memberNames as Record<string, string>;
    const other = Object.entries(names).find(([id]) => id !== myUserId);
    if (other) return other[1];
  }
  return 'Direct Message';
}

function isImageFile(name: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name);
}

function isVideoFile(name: string) {
  return /\.(mp4|webm|mov|avi|mkv)$/i.test(name);
}

// ─── Emoji Picker Popover ─────────────────────────────
function EmojiPopover({
  onSelect,
  onClose,
  anchorRef,
  position = 'top',
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  position?: 'top' | 'bottom';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number } | null>(null);

  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const pickerWidth = 352;
      const pickerHeight = 435;
      let left = rect.left;
      // Keep within viewport horizontally
      if (left + pickerWidth > window.innerWidth - 8) left = window.innerWidth - pickerWidth - 8;
      if (left < 8) left = 8;
      if (position === 'top') {
        const bottom = window.innerHeight - rect.top + 4;
        // If it would go above viewport, flip to below
        if (bottom + pickerHeight > window.innerHeight - 8) {
          setCoords({ top: Math.max(8, rect.bottom + 4), left });
        } else {
          setCoords({ bottom, left });
        }
      } else {
        const top = rect.bottom + 4;
        if (top + pickerHeight > window.innerHeight - 8) {
          setCoords({ bottom: Math.max(8, window.innerHeight - rect.top + 4), left });
        } else {
          setCoords({ top, left });
        }
      }
    }
  }, [anchorRef, position]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // If no anchor provided, fall back to absolute positioning
  const style: React.CSSProperties = coords
    ? { position: 'fixed', ...coords, zIndex: 9999 }
    : {};
  const className = coords
    ? ''
    : `absolute z-50 ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`;

  return (
    <div ref={ref} className={className} style={style}>
      <Picker
        data={data}
        onEmojiSelect={(e: any) => { onSelect(e.native); onClose(); }}
        theme="light"
        previewPosition="none"
        skinTonePosition="none"
        set="native"
        maxFrequentRows={1}
        perLine={8}
      />
    </div>
  );
}

// ─── Quick Reaction Bar ───────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

function ReactionPicker({
  onSelect,
  onClose,
  onOpenFull,
  mine = false,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  onOpenFull: () => void;
  mine?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={ref} className={`absolute bottom-full mb-1 z-50 ${mine ? 'right-0' : 'left-0'}`}>
      <div className="flex items-center gap-0.5 bg-white rounded-xl shadow-lg border border-dark-100 px-1.5 py-1">
        {QUICK_REACTIONS.map(emoji => (
          <button key={emoji} onClick={() => { onSelect(emoji); onClose(); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-50 text-base transition-colors">
            {emoji}
          </button>
        ))}
        <button onClick={onOpenFull}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-50 text-dark-400 transition-colors">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Thread Panel ─────────────────────────────────────
function ThreadPanel({
  channelUrl,
  parentMessage,
  chatUserId,
  onClose,
}: {
  channelUrl: string;
  parentMessage: Message;
  chatUserId: string | null;
  onClose: () => void;
}) {
  const { getThreadReplies, replyToThread } = useChat();
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    getThreadReplies(channelUrl, parentMessage.id)
      .then(d => {
        const sorted = [...d].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setReplies(sorted);
      })
      .finally(() => setLoading(false));
  }, [channelUrl, parentMessage.id, getThreadReplies]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [replies.length]);

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    await replyToThread(channelUrl, parentMessage.id, replyText.trim());
    setReplyText('');
    const d = await getThreadReplies(channelUrl, parentMessage.id);
    const sorted = [...d].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setReplies(sorted);
    setSending(false);
  };

  const senderName = parentMessage.sender?.nickname ?? 'Unknown';

  return (
    <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
      className="border-l border-dark-100 overflow-hidden shrink-0">
      <div className="w-[360px] h-full flex flex-col">
        <div className="px-4 py-3 border-b border-dark-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-dark-900">Thread</h3>
            <p className="text-[11px] text-dark-400">{replies.length} replies</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={14} /></button>
        </div>

        <div className="px-4 py-3 bg-dark-50/50 border-b border-dark-100 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">{userInitials(senderName)}</span>
            </div>
            <span className="text-xs font-semibold text-dark-700">{senderName}</span>
            <span className="text-[10px] text-dark-400">{formatMsgTime(parentMessage.created_at)}</span>
          </div>
          <p className="text-sm text-dark-700 whitespace-pre-wrap">{parentMessage.body}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={16} className="text-dark-300 animate-spin" /></div>
          ) : replies.length === 0 ? (
            <p className="text-xs text-dark-400 text-center py-6">No replies yet</p>
          ) : (
            replies.map(reply => {
              const rName = reply.sender?.nickname ?? 'Unknown';
              const rMine = reply.sender?.user_id === chatUserId;
              return (
                <div key={reply.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0 mt-0.5">
                    {reply.sender?.profile_url ? (
                      <img src={reply.sender.profile_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold text-white">{userInitials(rName)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-dark-700">{rMine ? 'You' : rName}</span>
                      <span className="text-[10px] text-dark-400">{formatMsgTime(reply.created_at)}</span>
                    </div>
                    <p className="text-sm text-dark-700 mt-0.5 whitespace-pre-wrap">{reply.body}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="px-4 py-3 border-t border-dark-100 shrink-0">
          <div className="flex items-end gap-2">
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
              placeholder="Reply…" rows={1}
              className="flex-1 px-3 py-2 rounded-xl bg-dark-50 border border-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 resize-none max-h-20" />
            <button onClick={handleSendReply} disabled={!replyText.trim() || sending}
              className="p-2 rounded-xl bg-court-500 text-white hover:bg-court-600 disabled:opacity-40 transition-colors shrink-0">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── File Preview (before sending) ────────────────────
function FilePreviewBar({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null;
  return (
    <div className="px-5 py-2 border-t border-dark-100 flex gap-2 overflow-x-auto">
      {files.map((file, i) => {
        const isImg = isImageFile(file.name);
        return (
          <div key={i} className="relative group shrink-0">
            {isImg ? (
              <img src={URL.createObjectURL(file)} alt={file.name}
                className="w-16 h-16 rounded-lg object-cover border border-dark-100" />
            ) : (
              <div className="w-16 h-16 rounded-lg border border-dark-100 bg-dark-50 flex flex-col items-center justify-center">
                <FileText size={18} className="text-dark-400" />
                <p className="text-[8px] text-dark-400 mt-0.5 truncate max-w-[56px]">{file.name}</p>
              </div>
            )}
            <button onClick={() => onRemove(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── URL detection helpers ────────────────────────────
const IMAGE_URL_RE = /https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|svg|bmp)(?:\?\S*)?/gi;
const VIDEO_URL_RE = /https?:\/\/\S+\.(?:mp4|webm|mov|avi|mkv)(?:\?\S*)?/gi;

function extractMediaUrls(body: string | null): { imageUrls: string[]; videoUrls: string[]; textParts: string[] } {
  if (!body) return { imageUrls: [], videoUrls: [], textParts: [] };
  const imageUrls = body.match(IMAGE_URL_RE) ?? [];
  const videoUrls = body.match(VIDEO_URL_RE) ?? [];
  const allMediaUrls = new Set([...imageUrls, ...videoUrls]);
  const textParts = body.split('\n').filter(line => !allMediaUrls.has(line.trim())).filter(Boolean);
  return { imageUrls, videoUrls, textParts };
}

// ─── Message Bubble with inline file/image preview ────
function MessageBubble({ msg, mine }: { msg: Message; mine: boolean }) {
  const hasFiles = msg.files && msg.files.length > 0;

  // Detect image/video URLs in the message body
  const { imageUrls, videoUrls, textParts } = extractMediaUrls(msg.body);
  const hasMediaUrls = imageUrls.length > 0 || videoUrls.length > 0;

  if (hasFiles) {
    return (
      <div className="space-y-1.5">
        {msg.files!.map((file: any, fi: number) => {
          if (isImageFile(file.file_name)) {
            return (
              <div key={fi} className={`rounded-2xl overflow-hidden border ${mine ? 'border-court-200' : 'border-dark-100'} max-w-xs`}>
                <img src={file.file_url || file.url} alt={file.file_name} className="max-w-full max-h-60 object-contain bg-dark-50" loading="lazy" />
                <div className={`flex items-center justify-between px-3 py-1.5 ${mine ? 'bg-court-50' : 'bg-dark-50'}`}>
                  <p className="text-[10px] text-dark-500 truncate">{file.file_name}</p>
                  <a href={file.file_url || file.url} target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-dark-600"><Download size={12} /></a>
                </div>
              </div>
            );
          }
          if (isVideoFile(file.file_name)) {
            return (
              <div key={fi} className={`rounded-2xl overflow-hidden border ${mine ? 'border-court-200' : 'border-dark-100'} max-w-xs`}>
                <video src={file.file_url || file.url} controls className="max-w-full max-h-60" />
                <div className={`flex items-center justify-between px-3 py-1.5 ${mine ? 'bg-court-50' : 'bg-dark-50'}`}>
                  <p className="text-[10px] text-dark-500 truncate">{file.file_name}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={fi} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${mine ? 'bg-court-50 border-court-100' : 'bg-dark-50 border-dark-100'}`}>
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                <FileText size={18} className="text-dark-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-dark-800 truncate">{file.file_name}</p>
                <p className="text-[10px] text-dark-400">{Math.round(file.file_size / 1024)} KB</p>
              </div>
              <a href={file.file_url || file.url} target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-dark-600 shrink-0"><Download size={14} /></a>
            </div>
          );
        })}
        {msg.body && (
          <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            mine ? 'bg-court-500 text-white rounded-tr-md' : 'bg-dark-50 text-dark-800 rounded-tl-md'
          }`}>{msg.body}</div>
        )}
      </div>
    );
  }

  // Render image/video URLs detected in the body as inline previews
  if (hasMediaUrls) {
    return (
      <div className="space-y-1.5">
        {imageUrls.map((url, i) => (
          <div key={`img-${i}`} className={`rounded-2xl overflow-hidden border ${mine ? 'border-court-200' : 'border-dark-100'} max-w-xs`}>
            <img src={url} alt="" className="max-w-full max-h-60 object-contain bg-dark-50" loading="lazy" />
            <div className={`flex items-center justify-between px-3 py-1.5 ${mine ? 'bg-court-50' : 'bg-dark-50'}`}>
              <p className="text-[10px] text-dark-500 truncate">Image</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-dark-400 hover:text-dark-600"><Download size={12} /></a>
            </div>
          </div>
        ))}
        {videoUrls.map((url, i) => (
          <div key={`vid-${i}`} className={`rounded-2xl overflow-hidden border ${mine ? 'border-court-200' : 'border-dark-100'} max-w-xs`}>
            <video src={url} controls className="max-w-full max-h-60" />
          </div>
        ))}
        {textParts.length > 0 && (
          <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            mine ? 'bg-court-500 text-white rounded-tr-md' : 'bg-dark-50 text-dark-800 rounded-tl-md'
          }`}>{textParts.join('\n')}</div>
        )}
      </div>
    );
  }

  return (
    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
      mine ? 'bg-court-500 text-white rounded-tr-md' : 'bg-dark-50 text-dark-800 rounded-tl-md'
    }`}>{msg.body}</div>
  );
}

// ─── Create Group Dialog ──────────────────────────────
function CreateGroupDialog({
  onClose, users, onSubmit,
}: { onClose: () => void; users: OrgUser[]; onSubmit: (name: string, userIds: string[]) => Promise<void> }) {
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
  const [threadParent, setThreadParent] = useState<Message | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [dmNamesMap, setDmNamesMap] = useState<Record<string, string>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const [fullEmojiForMsgId, setFullEmojiForMsgId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiAnchorRef = useRef<HTMLButtonElement | null>(null);
  const inputEmojiRef = useRef<HTMLButtonElement>(null);

  const activeChannel = channels.find(c => c.channel_url === activeChannelUrl) ?? null;
  const activeMessages = activeChannelUrl ? (messages[activeChannelUrl] ?? []) : [];
  const totalUnread = channels.reduce((sum, ch) => sum + ch.unread_count, 0);

  useEffect(() => { if (client) refreshChannels(); }, [client, refreshChannels]);
  useEffect(() => { if (activeChannelUrl) loadMessages(activeChannelUrl); }, [activeChannelUrl, loadMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChannelUrl, activeMessages.length]);
  useEffect(() => {
    if (activeChannelUrl && activeMessages.length > 0) {
      const lastMsg = activeMessages[activeMessages.length - 1];
      markRead(activeChannelUrl, lastMsg.id);
    }
  }, [activeChannelUrl, activeMessages.length, markRead]);

  useEffect(() => {
    if (!currentOrg || !session) return;
    async function fetchOrgUsers() {
      const res = await fetch(`/api/org/members?orgId=${currentOrg!.orgId}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` },
      });
      if (!res.ok) return;
      const data: Array<{ id: string; name: string; email: string; avatar_url: string | null; role: string }> = await res.json();
      setOrgUsers(data.filter(u => u.id !== user?.id).map(u => ({
        id: u.id, name: u.name,
        avatar: u.name.split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??',
        email: u.email,
      })));
    }
    fetchOrgUsers();
  }, [currentOrg, session, user?.id]);

  useEffect(() => { setThreadParent(null); setReplyTo(null); }, [activeChannelUrl]);

  const handleSend = useCallback(() => {
    if ((!inputText.trim() && pendingFiles.length === 0) || !activeChannelUrl) return;
    sendChatMessage(activeChannelUrl, inputText.trim(), replyTo?.id, pendingFiles.length > 0 ? pendingFiles : undefined);
    setInputText('');
    setReplyTo(null);
    setPendingFiles([]);
    if (activeChannelUrl) stopTyping(activeChannelUrl);
  }, [inputText, pendingFiles, activeChannelUrl, replyTo, sendChatMessage, stopTyping]);

  const handleInputChange = useCallback((value: string) => {
    setInputText(value);
    if (!activeChannelUrl) return;
    if (value.trim()) {
      startTyping(activeChannelUrl);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => { if (activeChannelUrl) stopTyping(activeChannelUrl); }, 3000);
    } else {
      stopTyping(activeChannelUrl);
    }
  }, [activeChannelUrl, startTyping, stopTyping]);

  const handleStartDM = useCallback(async (userId: string) => {
    const channel = await startDM(userId);
    if (channel) {
      const targetUser = orgUsers.find(u => u.id === userId);
      if (targetUser) setDmNamesMap(prev => ({ ...prev, [channel.channel_url]: targetUser.name }));
      setActiveChannelUrl(channel.channel_url);
      setNavTab('chats');
    }
  }, [startDM, orgUsers]);

  const handleCreateGroup = useCallback(async (name: string, userIds: string[]) => {
    const channel = await createGroup(name, userIds);
    if (channel) setActiveChannelUrl(channel.channel_url);
  }, [createGroup]);

  const handleFileSelect = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFilesChosen = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  }, []);

  const filteredChannels = channels.filter(ch => {
    const name = channelDisplayName(ch, dmNamesMap, user?.id);
    return !search || name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredUsers = orgUsers.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()));
  const isMe = (msg: Message) => msg.sender?.user_id === chatUserId;

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

      {/* LEFT NAV */}
      <div className={`w-80 border-r border-dark-100 flex flex-col shrink-0 ${activeChannelUrl ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-dark-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-dark-900">Chat</h2>
            <div className="flex items-center gap-1">
              {totalUnread > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{totalUnread}</span>}
              <button onClick={() => setShowCreateGroup(true)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Plus size={16} /></button>
            </div>
          </div>
          <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5 mb-3">
            <button onClick={() => setNavTab('chats')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${navTab === 'chats' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>Chats</button>
            <button onClick={() => setNavTab('users')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${navTab === 'users' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>Users</button>
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
              <div className="flex items-center justify-center py-12"><Loader2 size={18} className="text-dark-300 animate-spin" /></div>
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
                        <p className={`text-xs truncate ${ch.unread_count > 0 ? 'text-dark-600' : 'text-dark-400'}`}>{ch.member_count} members</p>
                        {ch.unread_count > 0 && <span className="ml-2 w-5 h-5 rounded-full bg-court-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{ch.unread_count}</span>}
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

      {/* MAIN CHAT AREA */}
      {activeChannel ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 px-5 flex items-center justify-between border-b border-dark-100 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveChannelUrl(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 mr-1"><ArrowLeft size={16} /></button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                activeChannel.type === 'group' ? 'bg-gradient-to-br from-court-400 to-court-700' : 'bg-gradient-to-br from-court-400 to-court-600'
              }`}>
                {activeChannel.type === 'group' || activeChannel.type === 'super_group'
                  ? <Users size={15} /> : userInitials(channelDisplayName(activeChannel, dmNamesMap, user?.id))}
              </div>
              <div>
                <p className="text-sm font-bold text-dark-900">{channelDisplayName(activeChannel, dmNamesMap, user?.id)}</p>
                <p className="text-[11px] text-dark-400">
                  {activeChannel.member_count} members
                  {typingUsers[activeChannel.channel_url]?.length > 0 && (
                    <span className="text-court-500 ml-1">· {typingUsers[activeChannel.channel_url].join(', ')} typing…</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Phone size={16} /></button>
              <button className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Video size={16} /></button>
              <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-lg transition-colors ${showInfo ? 'bg-court-50 text-court-600' : 'hover:bg-dark-50 text-dark-400 hover:text-dark-700'}`}><Info size={16} /></button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messagesLoading && activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-12"><Loader2 size={18} className="text-dark-300 animate-spin" /></div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex items-center justify-center py-12"><p className="text-xs text-dark-400">No messages yet. Say hello!</p></div>
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

                        {/* Name + message bubble with side actions + reactions */}
                        <div className={`flex flex-col max-w-[65%] ${mine ? 'items-end' : 'items-start'}`}>
                          {showAvatar && (
                            <div className={`flex items-center gap-2 mb-0.5 ${mine ? 'justify-end' : ''}`}>
                              <span className="text-xs font-semibold text-dark-700">{mine ? 'You' : senderName}</span>
                              <span className="text-[10px] text-dark-400">{formatMsgTime(msg.created_at)}</span>
                            </div>
                          )}

                          {/* Bubble + hover actions row, vertically centered */}
                          <div className={`flex items-center gap-1 ${mine ? '' : 'flex-row-reverse'}`}>
                            {/* Hover actions */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 relative">
                              <div className="relative">
                                <button ref={el => { if (fullEmojiForMsgId === msg.id || reactionPickerMsgId === msg.id) emojiAnchorRef.current = el; }}
                                  onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                                  className="p-1 rounded hover:bg-dark-100 text-dark-400" title="React"><Smile size={13} /></button>
                                {reactionPickerMsgId === msg.id && !fullEmojiForMsgId && (
                                  <ReactionPicker
                                    mine={mine}
                                    onSelect={emoji => addReaction(activeChannel.channel_url, msg.id, emoji)}
                                    onClose={() => setReactionPickerMsgId(null)}
                                    onOpenFull={() => setFullEmojiForMsgId(msg.id)}
                                  />
                                )}
                                {fullEmojiForMsgId === msg.id && (
                                  <EmojiPopover
                                    anchorRef={emojiAnchorRef}
                                    onSelect={emoji => { addReaction(activeChannel.channel_url, msg.id, emoji); setFullEmojiForMsgId(null); setReactionPickerMsgId(null); }}
                                    onClose={() => { setFullEmojiForMsgId(null); setReactionPickerMsgId(null); }}
                                  />
                                )}
                              </div>
                              <button onClick={() => setReplyTo(msg)} className="p-1 rounded hover:bg-dark-100 text-dark-400" title="Reply"><Reply size={13} /></button>
                              <button onClick={() => pinMessage(activeChannel.channel_url, msg.id)} className="p-1 rounded hover:bg-dark-100 text-dark-400" title="Pin"><Pin size={13} /></button>
                              {mine && <button className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500" title="Delete"><Trash2 size={13} /></button>}
                            </div>

                            {/* Bubble */}
                            <MessageBubble msg={msg} mine={mine} />
                          </div>

                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {msg.reactions.map((r: any, ri: number) => {
                                const myReaction = r.users ? r.users.some((u: any) => u.user_id === chatUserId) : false;
                                return (
                                  <button key={ri} onClick={() => {
                                    if (myReaction) removeReaction(activeChannel.channel_url, msg.id, r.key);
                                    else addReaction(activeChannel.channel_url, msg.id, r.key);
                                  }} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] cursor-pointer border transition-colors ${
                                    myReaction ? 'bg-court-50 border-court-300 text-court-700' : 'bg-white border-dark-100 hover:border-court-300'
                                  }`}>
                                    {r.key} <span className="font-medium">{r.count}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {msg.thread_reply_count > 0 && (
                            <button onClick={() => setThreadParent(msg)}
                              className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-court-500 hover:underline">
                              <MessageCircle size={11} /> {msg.thread_reply_count} replies
                            </button>
                          )}
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

              <FilePreviewBar files={pendingFiles} onRemove={i => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} />
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" className="hidden" onChange={handleFilesChosen} />

              <div className="px-5 py-3 border-t border-dark-100 shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={handleFileSelect} className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700 shrink-0"><Paperclip size={18} /></button>
                  <div className="flex-1 relative">
                    <textarea value={inputText} onChange={e => handleInputChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Type a message..." rows={1}
                      className="w-full px-4 py-2.5 rounded-xl bg-dark-50 border border-dark-100 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-500/30 focus:bg-white resize-none max-h-24" />
                  </div>
                  <div className="relative shrink-0">
                    <button ref={inputEmojiRef} onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Smile size={18} /></button>
                    {showEmojiPicker && (
                      <EmojiPopover position="top" anchorRef={inputEmojiRef} onSelect={emoji => setInputText(prev => prev + emoji)} onClose={() => setShowEmojiPicker(false)} />
                    )}
                  </div>
                  <button onClick={handleSend} disabled={!inputText.trim() && pendingFiles.length === 0}
                    className="p-2.5 rounded-xl bg-court-500 text-white hover:bg-court-600 disabled:opacity-40 transition-colors shrink-0"><Send size={16} /></button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {threadParent && activeChannelUrl && (
                <ThreadPanel channelUrl={activeChannelUrl} parentMessage={threadParent} chatUserId={chatUserId} onClose={() => setThreadParent(null)} />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showInfo && !threadParent && (
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
                              <div className="w-7 h-7 rounded bg-red-50 flex items-center justify-center shrink-0"><FileText size={13} className="text-red-500" /></div>
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
            <div className="w-16 h-16 rounded-2xl bg-court-50 flex items-center justify-center mx-auto mb-4"><MessageCircle size={28} className="text-court-400" /></div>
            <h3 className="text-lg font-bold text-dark-800 mb-1">Your messages</h3>
            <p className="text-sm text-dark-400 max-w-xs">Select a conversation or start a new chat with a team member.</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreateGroup && <CreateGroupDialog onClose={() => setShowCreateGroup(false)} users={orgUsers} onSubmit={handleCreateGroup} />}
      </AnimatePresence>
    </motion.div>
  );
}
