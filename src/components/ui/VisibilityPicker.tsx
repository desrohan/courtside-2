import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Plus, Users, User, Shield, ChevronDown, ChevronUp, Check, Trash2,
  Tag, MapPin, MinusCircle,
} from 'lucide-react';
import { users as allUsers, User as UserType } from '@/data/users';
import { teams } from '@/data/teams';
import { roles, designations, settingsTags } from '@/data/settings';

// Groups: teams + roles
interface GroupItem {
  id: string;
  name: string;
  type: 'team' | 'role';
  memberCount: number;
  color: string;
}

const groups: GroupItem[] = [
  ...teams.map(t => ({ id: `team-${t.id}`, name: t.name, type: 'team' as const, memberCount: t.memberCount, color: t.color })),
  ...roles.filter(r => !r.isSystem).map(r => ({ id: `role-${r.id}`, name: r.name, type: 'role' as const, memberCount: 0, color: '#637381' })),
];

interface VisibilityPickerProps {
  label: string;
  selectedUserIds: string[];
  selectedGroupIds: string[];
  onChangeUsers: (ids: string[]) => void;
  onChangeGroups: (ids: string[]) => void;
}

export default function VisibilityPicker({
  label, selectedUserIds, selectedGroupIds, onChangeUsers, onChangeGroups,
}: VisibilityPickerProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('groups');
  const [showDropdown, setShowDropdown] = useState(false);

  const orgUsers = allUsers.filter(u => u.role !== 'admin');

  const filteredUsers = orgUsers.filter(u =>
    !search || `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGroups = groups.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  );

  const addUser = (id: string) => {
    if (!selectedUserIds.includes(id)) onChangeUsers([...selectedUserIds, id]);
  };
  const removeUser = (id: string) => onChangeUsers(selectedUserIds.filter(x => x !== id));

  const addGroup = (id: string) => {
    if (!selectedGroupIds.includes(id)) onChangeGroups([...selectedGroupIds, id]);
  };
  const removeGroup = (id: string) => onChangeGroups(selectedGroupIds.filter(x => x !== id));

  const selectedUsersData = orgUsers.filter(u => selectedUserIds.includes(u.id));
  const selectedGroupsData = groups.filter(g => selectedGroupIds.includes(g.id));
  const totalSelected = selectedUserIds.length + selectedGroupIds.length;

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">{label}</label>

      {/* Selected items list */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedGroupsData.map(g => (
            <span key={g.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-court-50 text-court-700 border border-court-200">
              {g.type === 'team' ? <Users size={10} /> : <Shield size={10} />}
              {g.name}
              <button onClick={() => removeGroup(g.id)} className="ml-0.5 p-0.5 rounded hover:bg-court-100"><X size={10} /></button>
            </span>
          ))}
          {selectedUsersData.map(u => (
            <span key={u.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-dark-50 text-dark-700 border border-dark-200">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                <span className="text-[6px] font-bold text-white">{u.avatar}</span>
              </div>
              {u.firstName} {u.lastName.charAt(0)}.
              <button onClick={() => removeUser(u.id)} className="ml-0.5 p-0.5 rounded hover:bg-dark-100"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Add button / Dropdown trigger */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed border-dark-200 text-xs font-semibold text-dark-400 hover:border-court-300 hover:text-court-600 transition-colors"
        >
          <Plus size={13} /> Add {activeTab === 'groups' ? 'Groups' : 'Users'}
          <ChevronDown size={12} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-dark-200 shadow-elevated z-20 overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex border-b border-dark-100">
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                    activeTab === 'groups' ? 'text-court-600 border-b-2 border-court-500' : 'text-dark-400 hover:text-dark-600'
                  }`}
                >
                  <Users size={13} /> Groups
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                    activeTab === 'users' ? 'text-court-600 border-b-2 border-court-500' : 'text-dark-400 hover:text-dark-600'
                  }`}
                >
                  <User size={13} /> Users
                </button>
              </div>

              {/* Search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={activeTab === 'groups' ? 'Search teams & roles...' : 'Search users...'}
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20"
                    autoFocus
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-48 overflow-y-auto">
                {activeTab === 'groups' ? (
                  filteredGroups.length === 0 ? (
                    <p className="text-xs text-dark-400 text-center py-4">No groups found</p>
                  ) : (
                    <>
                      {/* Teams */}
                      {filteredGroups.filter(g => g.type === 'team').length > 0 && (
                        <div className="px-2 pt-1">
                          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-dark-400">Teams</p>
                          {filteredGroups.filter(g => g.type === 'team').map(g => {
                            const isAdded = selectedGroupIds.includes(g.id);
                            return (
                              <button
                                key={g.id}
                                onClick={() => isAdded ? removeGroup(g.id) : addGroup(g.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                                  isAdded ? 'bg-court-50' : 'hover:bg-dark-50'
                                }`}
                              >
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold"
                                  style={{ background: g.color }}>
                                  <Users size={12} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-dark-800">{g.name}</p>
                                  <p className="text-[10px] text-dark-400">Team</p>
                                </div>
                                {isAdded ? (
                                  <Check size={14} className="text-court-500 shrink-0" />
                                ) : (
                                  <Plus size={14} className="text-dark-300 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {/* Roles */}
                      {filteredGroups.filter(g => g.type === 'role').length > 0 && (
                        <div className="px-2 pt-1 pb-1">
                          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-dark-400">Roles</p>
                          {filteredGroups.filter(g => g.type === 'role').map(g => {
                            const isAdded = selectedGroupIds.includes(g.id);
                            return (
                              <button
                                key={g.id}
                                onClick={() => isAdded ? removeGroup(g.id) : addGroup(g.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                                  isAdded ? 'bg-court-50' : 'hover:bg-dark-50'
                                }`}
                              >
                                <div className="w-7 h-7 rounded-lg bg-dark-100 flex items-center justify-center text-dark-500">
                                  <Shield size={12} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-dark-800">{g.name}</p>
                                  <p className="text-[10px] text-dark-400">Role</p>
                                </div>
                                {isAdded ? (
                                  <Check size={14} className="text-court-500 shrink-0" />
                                ) : (
                                  <Plus size={14} className="text-dark-300 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )
                ) : (
                  filteredUsers.length === 0 ? (
                    <p className="text-xs text-dark-400 text-center py-4">No users found</p>
                  ) : (
                    <div className="px-2 py-1">
                      {filteredUsers.map(u => {
                        const isAdded = selectedUserIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() => isAdded ? removeUser(u.id) : addUser(u.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                              isAdded ? 'bg-court-50' : 'hover:bg-dark-50'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">{u.avatar}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-dark-800">{u.firstName} {u.lastName}</p>
                              <p className="text-[10px] text-dark-400">{u.designation}</p>
                            </div>
                            {isAdded ? (
                              <Check size={14} className="text-court-500 shrink-0" />
                            ) : (
                              <Plus size={14} className="text-dark-300 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t border-dark-100 flex justify-end">
                <button onClick={() => setShowDropdown(false)} className="text-xs font-semibold text-court-500 hover:underline">Done</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Simpler version for "Assign To" (users only, no groups) ──
export function AssignPicker({
  label, selectedUserIds, onChange,
}: {
  label: string;
  selectedUserIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const orgUsers = allUsers.filter(u => u.role !== 'admin');
  const filtered = orgUsers.filter(u =>
    !search || `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  );
  const selectedData = orgUsers.filter(u => selectedUserIds.includes(u.id));

  const toggle = (id: string) => {
    onChange(selectedUserIds.includes(id) ? selectedUserIds.filter(x => x !== id) : [...selectedUserIds, id]);
  };

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">{label}</label>
      {selectedData.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedData.map(u => (
            <span key={u.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-dark-50 text-dark-700 border border-dark-200">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                <span className="text-[6px] font-bold text-white">{u.avatar}</span>
              </div>
              {u.firstName} {u.lastName.charAt(0)}.
              <button onClick={() => toggle(u.id)} className="ml-0.5 p-0.5 rounded hover:bg-dark-100"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <button onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed border-dark-200 text-xs font-semibold text-dark-400 hover:border-court-300 hover:text-court-600 transition-colors">
          <Plus size={13} /> Add Users
        </button>
        <AnimatePresence>
          {showDropdown && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-dark-200 shadow-elevated z-20 overflow-hidden">
              <div className="px-3 py-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" autoFocus />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto px-2 pb-2">
                {filtered.map(u => {
                  const isAdded = selectedUserIds.includes(u.id);
                  return (
                    <button key={u.id} onClick={() => toggle(u.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${isAdded ? 'bg-court-50' : 'hover:bg-dark-50'}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white">{u.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-dark-800">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-dark-400">{u.designation}</p>
                      </div>
                      {isAdded ? <Check size={14} className="text-court-500 shrink-0" /> : <Plus size={14} className="text-dark-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="px-3 py-2 border-t border-dark-100 flex justify-end">
                <button onClick={() => setShowDropdown(false)} className="text-xs font-semibold text-court-500 hover:underline">Done</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ASSIGN USERS MODAL — Full two-panel picker
// ══════════════════════════════════════════════════════════

type AssignTab = 'designation' | 'tag' | 'position';

interface AssignUsersModalProps {
  open: boolean;
  onClose: () => void;
  onDone: (groupIds: string[], userIds: string[]) => void;
  initialGroupIds?: string[];
  initialUserIds?: string[];
}

// Build derived data once
const orgUsers = allUsers.filter(u => u.role !== 'admin');

// Group users by designation
function getUsersByDesignation() {
  const map: Record<string, { designation: string; users: UserType[] }> = {};
  for (const u of orgUsers) {
    const d = u.designation || 'Other';
    if (!map[d]) map[d] = { designation: d, users: [] };
    map[d].users.push(u);
  }
  return Object.values(map).sort((a, b) => a.designation.localeCompare(b.designation));
}

// Group users by position (only those with position)
function getUsersByPosition() {
  const map: Record<string, { position: string; users: UserType[] }> = {};
  for (const u of orgUsers) {
    if (!u.position) continue;
    if (!map[u.position]) map[u.position] = { position: u.position, users: [] };
    map[u.position].users.push(u);
  }
  return Object.values(map).sort((a, b) => a.position.localeCompare(b.position));
}

export function AssignUsersModal({ open, onClose, onDone, initialGroupIds = [], initialUserIds = [] }: AssignUsersModalProps) {
  const [tab, setTab] = useState<AssignTab>('designation');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Pending = checked on the left but not yet added to the list
  const [pendingGroups, setPendingGroups] = useState<string[]>([]);
  const [pendingUsers, setPendingUsers] = useState<string[]>([]);

  // Committed = added to the right-side list (via "Add To List")
  const [committedGroups, setCommittedGroups] = useState<string[]>(initialGroupIds);
  const [committedUsers, setCommittedUsers] = useState<string[]>(initialUserIds);

  const desByDesignation = getUsersByDesignation();
  const byPosition = getUsersByPosition();

  // Left-side pending toggles
  const togglePendingGroup = (id: string) => {
    setPendingGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const togglePendingUser = (id: string) => {
    setPendingUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // "Add To List" — move pending to committed, then clear pending
  const addToList = () => {
    setCommittedGroups(prev => [...new Set([...prev, ...pendingGroups])]);
    setCommittedUsers(prev => [...new Set([...prev, ...pendingUsers])]);
    setPendingGroups([]);
    setPendingUsers([]);
  };

  // Right-side remove from committed
  const removeCommittedGroup = (id: string) => setCommittedGroups(prev => prev.filter(x => x !== id));
  const removeCommittedUser = (id: string) => setCommittedUsers(prev => prev.filter(x => x !== id));

  // Clear all pending
  const clearPending = () => { setPendingGroups([]); setPendingUsers([]); };

  // Resolve selected group names
  const resolveGroupName = (id: string) => {
    if (id.startsWith('des-')) return id.replace('des-', '');
    if (id.startsWith('tag-')) {
      const t = settingsTags.find(t => `tag-${t.id}` === id);
      return t?.name || id;
    }
    if (id.startsWith('pos-')) return id.replace('pos-', '');
    return id;
  };
  const resolveGroupType = (id: string) => {
    if (id.startsWith('des-')) return 'Designation';
    if (id.startsWith('tag-')) return 'Tag';
    if (id.startsWith('pos-')) return 'Position';
    return 'Group';
  };

  const committedUsersData = orgUsers.filter(u => committedUsers.includes(u.id));
  const totalPendingGroups = pendingGroups.length;
  const totalPendingUsers = pendingUsers.length;
  const hasPending = totalPendingGroups > 0 || totalPendingUsers > 0;

  // Filter helpers
  const matchesSearch = (name: string) => !search || name.toLowerCase().includes(search.toLowerCase());

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-lg font-bold text-dark-900">Assign Users</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
        </div>

        {/* Body — two panels */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* ── LEFT PANEL ─────────────────────────── */}
          <div className="w-[55%] border-r border-dark-100 flex flex-col overflow-hidden">
            {/* Activity + Teams dropdowns */}
            <div className="px-5 pt-4 pb-2 flex gap-3 shrink-0">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1 block">Activity</label>
                <div className="h-9 px-3 rounded-lg border border-dark-200 bg-dark-50/50 flex items-center text-sm text-dark-700 font-medium">
                  Football <ChevronDown size={14} className="ml-auto text-dark-400" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1 block">&nbsp;</label>
                <div className="h-9 px-3 rounded-lg border border-dark-200 bg-dark-50/50 flex items-center text-sm text-dark-500 font-medium">
                  Teams <ChevronDown size={14} className="ml-auto text-dark-400" />
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-5 pb-2 shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20"
                />
              </div>
            </div>

            {/* Tabs: Designation | Tag | Position */}
            <div className="flex items-center border-b border-dark-100 px-5 shrink-0">
              {([
                { key: 'designation' as AssignTab, label: 'Designation' },
                { key: 'tag' as AssignTab, label: 'Tag' },
                { key: 'position' as AssignTab, label: 'Position' },
              ]).map(t => (
                <button key={t.key} onClick={() => { setTab(t.key); setExpanded(null); }}
                  className={`px-3 py-2.5 text-sm font-semibold transition-colors relative ${
                    tab === t.key ? 'text-dark-900' : 'text-dark-400 hover:text-dark-600'
                  }`}>
                  {t.label}
                  {tab === t.key && <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-dark-800 rounded-full" />}
                </button>
              ))}
            </div>

            {/* Scrollable groups list */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {tab === 'designation' && desByDesignation.filter(g => matchesSearch(g.designation)).map(group => {
                const groupId = `des-${group.designation}`;
                const isGroupPending = pendingGroups.includes(groupId);
                const isGroupCommitted = committedGroups.includes(groupId);
                const isExpanded = expanded === groupId;
                return (
                  <div key={groupId} className="mb-1">
                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-dark-50 transition-colors">
                      <button onClick={() => !isGroupCommitted && togglePendingGroup(groupId)}
                        disabled={isGroupCommitted}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isGroupCommitted ? 'bg-dark-300 border-dark-300 cursor-not-allowed' :
                          isGroupPending ? 'bg-court-500 border-court-500' : 'border-dark-300 hover:border-dark-400'}`}>
                        {(isGroupPending || isGroupCommitted) && <Check size={12} className="text-white" />}
                      </button>
                      <Users size={16} className="text-dark-400 shrink-0" />
                      <span className="text-sm font-semibold text-dark-800 flex-1">{group.designation}</span>
                      <span className="text-xs text-dark-400 font-medium">({group.users.length})</span>
                      <button onClick={() => setExpanded(isExpanded ? null : groupId)} className="p-1 rounded hover:bg-dark-100 text-dark-400">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="pl-7 pr-2 pb-1">
                            {group.users.filter(u => matchesSearch(`${u.firstName} ${u.lastName}`)).map(u => {
                              const isUserPending = pendingUsers.includes(u.id);
                              const isUserCommitted = committedUsers.includes(u.id);
                              return (
                                <div key={u.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-dark-50 transition-colors">
                                  <button onClick={() => !isUserCommitted && togglePendingUser(u.id)}
                                    disabled={isUserCommitted}
                                    className={`rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      isUserCommitted ? 'bg-dark-300 border-dark-300 cursor-not-allowed' :
                                      isUserPending ? 'bg-court-500 border-court-500' : 'border-dark-300 hover:border-dark-400'}`}
                                    style={{ width: 18, height: 18 }}>
                                    {(isUserPending || isUserCommitted) && <Check size={11} className="text-white" />}
                                  </button>
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-dark-200 to-dark-300 flex items-center justify-center shrink-0">
                                    <span className="text-[9px] font-bold text-dark-600">{u.avatar}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-dark-800">{u.firstName} {u.lastName}</p>
                                    <p className="text-[11px] text-dark-400">{u.email}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {tab === 'tag' && settingsTags.filter(t => matchesSearch(t.name)).map(tag => {
                const groupId = `tag-${tag.id}`;
                const isGroupPending = pendingGroups.includes(groupId);
                const isGroupCommitted = committedGroups.includes(groupId);
                return (
                  <div key={groupId} className="flex items-center gap-2 px-2 py-2.5 rounded-lg hover:bg-dark-50 transition-colors mb-0.5">
                    <button onClick={() => !isGroupCommitted && togglePendingGroup(groupId)}
                      disabled={isGroupCommitted}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isGroupCommitted ? 'bg-dark-300 border-dark-300 cursor-not-allowed' :
                        isGroupPending ? 'bg-court-500 border-court-500' : 'border-dark-300 hover:border-dark-400'}`}>
                      {(isGroupPending || isGroupCommitted) && <Check size={12} className="text-white" />}
                    </button>
                    <Tag size={15} className="text-dark-400 shrink-0" />
                    <span className="text-sm font-semibold text-dark-800 flex-1">{tag.name}</span>
                    <span className="text-[11px] text-dark-400">{tag.activityName}</span>
                  </div>
                );
              })}

              {tab === 'position' && byPosition.filter(g => matchesSearch(g.position)).map(group => {
                const groupId = `pos-${group.position}`;
                const isGroupPending = pendingGroups.includes(groupId);
                const isGroupCommitted = committedGroups.includes(groupId);
                const isExpanded = expanded === groupId;
                return (
                  <div key={groupId} className="mb-1">
                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-dark-50 transition-colors">
                      <button onClick={() => !isGroupCommitted && togglePendingGroup(groupId)}
                        disabled={isGroupCommitted}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isGroupCommitted ? 'bg-dark-300 border-dark-300 cursor-not-allowed' :
                          isGroupPending ? 'bg-court-500 border-court-500' : 'border-dark-300 hover:border-dark-400'}`}>
                        {(isGroupPending || isGroupCommitted) && <Check size={12} className="text-white" />}
                      </button>
                      <MapPin size={15} className="text-dark-400 shrink-0" />
                      <span className="text-sm font-semibold text-dark-800 flex-1">{group.position}</span>
                      <span className="text-xs text-dark-400 font-medium">({group.users.length})</span>
                      <button onClick={() => setExpanded(isExpanded ? null : groupId)} className="p-1 rounded hover:bg-dark-100 text-dark-400">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="pl-7 pr-2 pb-1">
                            {group.users.filter(u => matchesSearch(`${u.firstName} ${u.lastName}`)).map(u => {
                              const isUserPending = pendingUsers.includes(u.id);
                              const isUserCommitted = committedUsers.includes(u.id);
                              return (
                                <div key={u.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-dark-50 transition-colors">
                                  <button onClick={() => !isUserCommitted && togglePendingUser(u.id)}
                                    disabled={isUserCommitted}
                                    className={`rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      isUserCommitted ? 'bg-dark-300 border-dark-300 cursor-not-allowed' :
                                      isUserPending ? 'bg-court-500 border-court-500' : 'border-dark-300 hover:border-dark-400'}`}
                                    style={{ width: 18, height: 18 }}>
                                    {(isUserPending || isUserCommitted) && <Check size={11} className="text-white" />}
                                  </button>
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-dark-200 to-dark-300 flex items-center justify-center shrink-0">
                                    <span className="text-[9px] font-bold text-dark-600">{u.avatar}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-dark-800">{u.firstName} {u.lastName}</p>
                                    <p className="text-[11px] text-dark-400">{u.email}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Bottom bar: pending selection count + clear + add to list */}
            <div className="px-5 py-3 border-t border-dark-100 flex items-center gap-3 bg-dark-50/40 shrink-0">
              <span className="text-xs font-semibold text-dark-600">Selected:</span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex items-center">
                  <Users size={18} className="text-dark-500" />
                  {totalPendingGroups > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-court-500 text-white text-[9px] font-bold flex items-center justify-center">{totalPendingGroups}</span>
                  )}
                </span>
                <span className="relative flex items-center ml-1">
                  <User size={18} className="text-dark-500" />
                  {totalPendingUsers > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-court-500 text-white text-[9px] font-bold flex items-center justify-center">{totalPendingUsers}</span>
                  )}
                </span>
              </div>
              {hasPending && (
                <button onClick={clearPending} className="text-xs font-semibold text-dark-500 hover:text-dark-700">Clear</button>
              )}
              <button onClick={addToList} disabled={!hasPending}
                className={`ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                  hasPending ? 'bg-white border-court-300 text-court-600 hover:bg-court-50' : 'bg-dark-50 border-dark-200 text-dark-400 cursor-not-allowed'
                }`}>
                <Plus size={13} /> Add To List
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL ────────────────────────── */}
          <div className="w-[45%] flex flex-col overflow-hidden bg-dark-50/30">
            <div className="px-5 py-4 shrink-0">
              <h4 className="text-sm font-bold text-dark-800">Selected Groups & Users</h4>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
              {/* Groups (Designation / Tag / Position) */}
              {committedGroups.length > 0 && (
                <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-100">
                    <span className="text-xs font-bold text-dark-800">Designation</span>
                    <span className="text-[10px] text-dark-400 font-medium">({committedGroups.length})</span>
                  </div>
                  <div className="divide-y divide-dark-50">
                    {committedGroups.map(id => (
                      <div key={id} className="flex items-center gap-3 px-4 py-2.5">
                        <Users size={16} className="text-dark-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-800">{resolveGroupName(id)}</p>
                          <p className="text-[11px] text-dark-400">Football</p>
                        </div>
                        <button onClick={() => removeCommittedGroup(id)} className="p-1 rounded-full hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors shrink-0">
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual members */}
              {committedUsersData.length > 0 && (
                <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-100">
                    <span className="text-xs font-bold text-dark-800">Members</span>
                    <span className="text-[10px] text-dark-400 font-medium">({committedUsersData.length})</span>
                  </div>
                  <div className="divide-y divide-dark-50">
                    {committedUsersData.map(u => (
                      <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-dark-200 to-dark-300 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-dark-600">{u.avatar}</span>
                        </div>
                        <p className="text-sm font-medium text-dark-800 flex-1 min-w-0 truncate">{u.firstName} {u.lastName}</p>
                        <button onClick={() => removeCommittedUser(u.id)} className="p-1 rounded-full hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors shrink-0">
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {committedGroups.length === 0 && committedUsers.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-xl bg-dark-100 flex items-center justify-center mx-auto mb-2">
                    <Users size={20} className="text-dark-300" />
                  </div>
                  <p className="text-xs text-dark-400">Select groups or users and press "Add To List"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-dark-100 shrink-0">
          <p className="text-[11px] text-dark-400 mb-3">Note: Selected Groups from selected teams will have access.</p>
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
            <button onClick={() => onDone(committedGroups, committedUsers)}
              className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 transition-colors">Done</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
