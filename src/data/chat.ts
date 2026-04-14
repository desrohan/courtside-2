import { format, subMinutes, subHours, subDays } from 'date-fns';

export type ChannelType = 'group' | 'single';
export type MessageType = 'text' | 'file' | 'admin';
export type UserPresence = 'online' | 'offline';

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  presence: UserPresence;
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: MessageType;
  text: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  timestamp: Date;
  reactions?: { emoji: string; userIds: string[] }[];
  replyCount?: number;
  isPinned?: boolean;
  isDeleted?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  type: ChannelType;
  coverImage?: string;
  memberIds: string[];
  members: ChatUser[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  pinnedCount: number;
  createdBy: string;
  isTyping?: string[];
}

const now = new Date();

export const chatUsers: ChatUser[] = [
  { id: 'cu-001', name: 'Marcus Reid', avatar: 'MR', role: 'Technical Director', presence: 'online' },
  { id: 'cu-002', name: 'James Carter', avatar: 'JC', role: 'Head Coach', presence: 'online' },
  { id: 'cu-003', name: 'Elena Vasquez', avatar: 'EV', role: 'Assistant Coach', presence: 'offline', lastSeen: format(subHours(now, 2), 'HH:mm') },
  { id: 'cu-004', name: 'Ryan Mitchell', avatar: 'RM', role: 'GK Coach', presence: 'offline', lastSeen: format(subHours(now, 5), 'HH:mm') },
  { id: 'cu-005', name: 'Sarah O\'Brien', avatar: 'SO', role: 'Head Physio', presence: 'online' },
  { id: 'cu-006', name: 'Daniel Kim', avatar: 'DK', role: 'Performance Analyst', presence: 'online' },
  { id: 'cu-007', name: 'Gabriel Torres', avatar: 'GT', role: 'Striker', presence: 'offline', lastSeen: format(subMinutes(now, 45), 'HH:mm') },
  { id: 'cu-008', name: 'Noah Clarke', avatar: 'NC', role: 'Attacking Mid', presence: 'online' },
  { id: 'cu-009', name: 'Jack Brennan', avatar: 'JB', role: 'Central Mid', presence: 'online' },
  { id: 'cu-010', name: 'Liam Henderson', avatar: 'LH', role: 'Goalkeeper', presence: 'offline', lastSeen: format(subDays(now, 1), 'MMM d') },
  { id: 'cu-011', name: 'Kai Tanaka', avatar: 'KT', role: 'Centre-Back', presence: 'online' },
  { id: 'cu-012', name: 'Lisa Morgan', avatar: 'LM', role: 'Women\'s Coach', presence: 'offline', lastSeen: format(subHours(now, 8), 'HH:mm') },
];

export const CURRENT_USER_ID = 'cu-001';

export const chatChannels: ChatChannel[] = [
  {
    id: 'ch-001', name: 'Coaching Staff', type: 'group',
    memberIds: ['cu-001', 'cu-002', 'cu-003', 'cu-004', 'cu-005', 'cu-006'],
    members: chatUsers.filter(u => ['cu-001', 'cu-002', 'cu-003', 'cu-004', 'cu-005', 'cu-006'].includes(u.id)),
    unreadCount: 3, pinnedCount: 2, createdBy: 'cu-001',
    lastMessage: { id: 'm-100', channelId: 'ch-001', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'Updated the pressing drill for tomorrow. Check the attached PDF.', timestamp: subMinutes(now, 12) },
  },
  {
    id: 'ch-002', name: 'First Team Group', type: 'group',
    memberIds: ['cu-001', 'cu-002', 'cu-003', 'cu-005', 'cu-006', 'cu-007', 'cu-008', 'cu-009', 'cu-011'],
    members: chatUsers.filter(u => ['cu-001', 'cu-002', 'cu-003', 'cu-005', 'cu-006', 'cu-007', 'cu-008', 'cu-009', 'cu-011'].includes(u.id)),
    unreadCount: 0, pinnedCount: 1, createdBy: 'cu-002',
    lastMessage: { id: 'm-200', channelId: 'ch-002', senderId: 'cu-005', senderName: 'Sarah O\'Brien', senderAvatar: 'SO', type: 'text', text: 'Reminder: Pre-match medicals must be completed by Friday.', timestamp: subHours(now, 1) },
  },
  {
    id: 'ch-003', name: 'Medical Team', type: 'group',
    memberIds: ['cu-001', 'cu-005', 'cu-004'],
    members: chatUsers.filter(u => ['cu-001', 'cu-005', 'cu-004'].includes(u.id)),
    unreadCount: 1, pinnedCount: 0, createdBy: 'cu-005',
    lastMessage: { id: 'm-300', channelId: 'ch-003', senderId: 'cu-005', senderName: 'Sarah O\'Brien', senderAvatar: 'SO', type: 'text', text: 'Brooks MRI results are in. Let\'s discuss at 2pm.', timestamp: subHours(now, 3) },
  },
  {
    id: 'ch-004', name: 'James Carter', type: 'single',
    memberIds: ['cu-001', 'cu-002'],
    members: chatUsers.filter(u => ['cu-001', 'cu-002'].includes(u.id)),
    unreadCount: 2, pinnedCount: 0, createdBy: 'cu-001',
    lastMessage: { id: 'm-400', channelId: 'ch-004', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'Can we go over the set piece changes after training?', timestamp: subMinutes(now, 35) },
  },
  {
    id: 'ch-005', name: 'Daniel Kim', type: 'single',
    memberIds: ['cu-001', 'cu-006'],
    members: chatUsers.filter(u => ['cu-001', 'cu-006'].includes(u.id)),
    unreadCount: 0, pinnedCount: 0, createdBy: 'cu-006',
    lastMessage: { id: 'm-500', channelId: 'ch-005', senderId: 'cu-001', senderName: 'Marcus Reid', senderAvatar: 'MR', type: 'text', text: 'Send me the opposition report when it\'s ready.', timestamp: subHours(now, 6) },
  },
  {
    id: 'ch-006', name: 'Gabriel Torres', type: 'single',
    memberIds: ['cu-001', 'cu-007'],
    members: chatUsers.filter(u => ['cu-001', 'cu-007'].includes(u.id)),
    unreadCount: 0, pinnedCount: 0, createdBy: 'cu-001',
    lastMessage: { id: 'm-600', channelId: 'ch-006', senderId: 'cu-007', senderName: 'Gabriel Torres', senderAvatar: 'GT', type: 'text', text: 'Thanks gaffer. See you at training.', timestamp: subDays(now, 1) },
  },
];

// Messages for coaching staff channel
export const channelMessages: Record<string, ChatMessage[]> = {
  'ch-001': [
    { id: 'm-001', channelId: 'ch-001', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'Morning everyone. Quick update on the training plan for this week.', timestamp: subHours(now, 4), reactions: [{ emoji: '👍', userIds: ['cu-001', 'cu-003'] }] },
    { id: 'm-002', channelId: 'ch-001', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'Monday: Tactical pressing session (high intensity)\nTuesday: Recovery for matchday players, full training for non-starters\nWednesday: Attacking combinations + finishing\nThursday: Light walk-through + set pieces\nFriday: Matchday', timestamp: subHours(now, 4) },
    { id: 'm-003', channelId: 'ch-001', senderId: 'cu-003', senderName: 'Elena Vasquez', senderAvatar: 'EV', type: 'text', text: 'Looks good. I\'ll handle the U-21 session on Tuesday while you run first team recovery.', timestamp: subHours(now, 3), reactions: [{ emoji: '✅', userIds: ['cu-002'] }] },
    { id: 'm-004', channelId: 'ch-001', senderId: 'cu-005', senderName: 'Sarah O\'Brien', senderAvatar: 'SO', type: 'text', text: 'Quick note — Brooks is still in rehab. He won\'t be in any sessions this week. I\'ll have an update on his scan results by Wednesday.', timestamp: subHours(now, 3) },
    { id: 'm-005', channelId: 'ch-001', senderId: 'cu-006', senderName: 'Daniel Kim', senderAvatar: 'DK', type: 'text', text: 'I\'ve finished the opposition analysis for Riverside FC. Sending the report now.', timestamp: subHours(now, 2) },
    { id: 'm-006', channelId: 'ch-001', senderId: 'cu-006', senderName: 'Daniel Kim', senderAvatar: 'DK', type: 'file', text: '', fileName: 'Riverside_FC_Analysis.pdf', fileSize: '5.2 MB', fileType: 'pdf', timestamp: subHours(now, 2) },
    { id: 'm-007', channelId: 'ch-001', senderId: 'cu-001', senderName: 'Marcus Reid', senderAvatar: 'MR', type: 'text', text: 'Great work Daniel. @James Carter can you review the pressing triggers section? Particularly their build-up from the back.', timestamp: subHours(now, 1), reactions: [{ emoji: '👀', userIds: ['cu-002'] }] },
    { id: 'm-008', channelId: 'ch-001', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'On it. I\'ll incorporate it into tomorrow\'s tactical brief.', timestamp: subMinutes(now, 45), replyCount: 2 },
    { id: 'm-009', channelId: 'ch-001', senderId: 'cu-004', senderName: 'Ryan Mitchell', senderAvatar: 'RM', type: 'text', text: 'I\'ll need Henderson and the backup keeper for a separate GK session Wednesday morning. Can we block 08:00-09:00 on Pitch B?', timestamp: subMinutes(now, 30) },
    { id: 'm-010', channelId: 'ch-001', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'Updated the pressing drill for tomorrow. Check the attached PDF.', timestamp: subMinutes(now, 12), isPinned: true },
    { id: 'm-011', channelId: 'ch-001', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'file', text: '', fileName: 'Pressing_Drill_v2.pdf', fileSize: '1.8 MB', fileType: 'pdf', timestamp: subMinutes(now, 12) },
  ],
  'ch-004': [
    { id: 'm-401', channelId: 'ch-004', senderId: 'cu-001', senderName: 'Marcus Reid', senderAvatar: 'MR', type: 'text', text: 'James, how are you feeling about the Riverside match?', timestamp: subHours(now, 2) },
    { id: 'm-402', channelId: 'ch-004', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'Good. Their left side is vulnerable. If Silva and Clarke link up well we can exploit that.', timestamp: subHours(now, 1) },
    { id: 'm-403', channelId: 'ch-004', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'Main concern is their set pieces. They\'ve scored from 4 corners this season.', timestamp: subHours(now, 1) },
    { id: 'm-404', channelId: 'ch-004', senderId: 'cu-001', senderName: 'Marcus Reid', senderAvatar: 'MR', type: 'text', text: 'Agreed. Let\'s make sure we drill those defensive set pieces on Thursday.', timestamp: subMinutes(now, 50) },
    { id: 'm-405', channelId: 'ch-004', senderId: 'cu-002', senderName: 'James Carter', senderAvatar: 'JC', type: 'text', text: 'Can we go over the set piece changes after training?', timestamp: subMinutes(now, 35), reactions: [{ emoji: '👍', userIds: ['cu-001'] }] },
  ],
};

export function getChannelDisplayName(channel: ChatChannel, currentUserId: string): string {
  if (channel.type === 'group') return channel.name;
  const other = channel.members.find(m => m.id !== currentUserId);
  return other?.name || channel.name;
}

export function getOtherUser(channel: ChatChannel, currentUserId: string): ChatUser | undefined {
  return channel.members.find(m => m.id !== currentUserId);
}

export function getTotalUnread(): number {
  return chatChannels.reduce((sum, ch) => sum + ch.unreadCount, 0);
}
