import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Eye, User, Users, ArrowLeft,
  Mail, Phone, Shield, Calendar, Heart, FileText, AlertCircle,
  MapPin, Tag, ToggleLeft, ToggleRight, ChevronDown, Activity,
} from 'lucide-react';
import { users, User as UserType, currentUser } from '@/data/users';
import { teams } from '@/data/teams';
import { getAthleteRegistration } from '@/data/athleteRegistration';
import RegistrationStatusCard from '@/components/registration/RegistrationStatusCard';
import RegistrationWizard from '@/components/registration/RegistrationWizard';

type ViewMode = 'list' | 'profile';
type ProfileTab = 'profile' | 'health' | 'events' | 'other' | 'registration';

const userTypeColors: Record<string, string> = {
  admin: '#8E33FF', coach: '#00A76F', player: '#00B8D9', medical: '#FF6C40', staff: '#637381',
};

export default function UsersModule() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>('profile');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = users
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  const roleCounts = { all: users.length, player: users.filter(u => u.role === 'player').length, coach: users.filter(u => u.role === 'coach').length, staff: users.filter(u => u.role === 'staff').length, medical: users.filter(u => u.role === 'medical').length, admin: users.filter(u => u.role === 'admin').length };

  const openProfile = (user: UserType) => { setSelectedUser(user); setViewMode('profile'); setProfileTab('profile'); };

  const getUserTeams = (userId: string) => teams.filter(t => {
    const member = users.find(u => u.id === userId);
    return member?.teamIds.includes(t.id);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {viewMode === 'list' ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-dark-900">Users</h1>
              <p className="text-xs text-dark-400 mt-0.5">{users.length} members in the organisation</p>
            </div>
            <button className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Add User
            </button>
          </div>

          {/* Search + Role Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div className="flex items-center gap-1 bg-dark-50 rounded-xl p-0.5 overflow-x-auto">
              {Object.entries(roleCounts).map(([role, count]) => (
                <button key={role} onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    roleFilter === role ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
                  }`}>
                  {role} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-dark-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Role</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Designation</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Teams</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Position</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-100">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-dark-50/30 transition-colors cursor-pointer" onClick={() => openProfile(user)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ background: `linear-gradient(135deg, ${userTypeColors[user.role] || '#637381'}, ${userTypeColors[user.role] || '#637381'}bb)` }}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dark-800">{user.firstName} {user.lastName}</p>
                          <p className="text-[11px] text-dark-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold capitalize"
                        style={{ backgroundColor: (userTypeColors[user.role] || '#637381') + '15', color: userTypeColors[user.role] || '#637381' }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-600">{user.designation}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {getUserTeams(user.id).map(t => (
                          <span key={t.id} className="px-1.5 py-0.5 bg-court-50 text-court-700 rounded text-[10px] font-semibold">{t.shortName}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-500">{user.position || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        user.status === 'active' ? 'bg-green-50 text-green-600' : user.status === 'injured' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                      }`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openProfile(user)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Eye size={14} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : selectedUser && (
        /* ─── User Profile View ───────────────────── */
        <>
          <button onClick={() => setViewMode('list')} className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-700">
            <ArrowLeft size={16} /> Back to Users
          </button>
          <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
            {/* Profile Header */}
            <div className="relative bg-gradient-to-r from-court-600 via-court-500 to-court-400 p-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="relative flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl border-4 border-white/20"
                  style={{ background: `linear-gradient(135deg, ${userTypeColors[selectedUser.role]}, ${userTypeColors[selectedUser.role]}bb)` }}>
                  {selectedUser.avatar}
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-extrabold">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <p className="text-court-100 text-sm">{selectedUser.designation} &middot; {selectedUser.role}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {selectedUser.jerseyNumber && (
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-xs font-bold">#{selectedUser.jerseyNumber}</span>
                    )}
                    {selectedUser.position && (
                      <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-xs font-bold">{selectedUser.position}</span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      selectedUser.status === 'active' ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'
                    }`}>{selectedUser.status}</span>
                  </div>
                </div>
                <button className="ml-auto bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
                  <Pencil size={14} /> Edit Profile
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 px-6 border-b border-dark-100 overflow-x-auto">
              {([
                { key: 'profile' as ProfileTab, label: 'Profile', icon: <User size={14} /> },
                ...(selectedUser.role === 'player' ? [{ key: 'registration' as ProfileTab, label: 'Registration', icon: <Shield size={14} /> }] : []),
                { key: 'health' as ProfileTab, label: 'Health', icon: <Heart size={14} /> },
                { key: 'events' as ProfileTab, label: 'Events', icon: <Calendar size={14} /> },
                { key: 'other' as ProfileTab, label: 'Other Details', icon: <FileText size={14} /> },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setProfileTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                    profileTab === tab.key ? 'text-court-600' : 'text-dark-400 hover:text-dark-700'
                  }`}>
                  {tab.icon} {tab.label}
                  {profileTab === tab.key && (
                    <motion.div layoutId="profile-tab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-court-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {profileTab === 'profile' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-dark-800">Personal Information</h3>
                    <InfoRow icon={<Mail size={14} />} label="Email" value={selectedUser.email} />
                    <InfoRow icon={<User size={14} />} label="Role" value={selectedUser.role} />
                    <InfoRow icon={<Shield size={14} />} label="Designation" value={selectedUser.designation} />
                    {selectedUser.jerseyNumber && <InfoRow icon={<Tag size={14} />} label="Jersey Number" value={`#${selectedUser.jerseyNumber}`} />}
                    {selectedUser.position && <InfoRow icon={<MapPin size={14} />} label="Position" value={selectedUser.position} />}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-dark-800">Teams</h3>
                    <div className="space-y-2">
                      {getUserTeams(selectedUser.id).map(t => (
                        <div key={t.id} className="flex items-center gap-3 p-3 bg-dark-50/60 rounded-xl">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: t.color }}>{t.shortName}</div>
                          <div>
                            <p className="text-sm font-semibold text-dark-800">{t.name}</p>
                            <p className="text-[11px] text-dark-400">Coach: {t.coachName}</p>
                          </div>
                        </div>
                      ))}
                      {getUserTeams(selectedUser.id).length === 0 && <p className="text-sm text-dark-400">Not assigned to any teams</p>}
                    </div>
                  </div>
                </div>
              )}
              {profileTab === 'health' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                      selectedUser.status === 'active' ? 'bg-green-50 text-green-600' : selectedUser.status === 'injured' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                    }`}>{selectedUser.status === 'active' ? 'Healthy' : selectedUser.status === 'injured' ? 'Injured' : 'Suspended'}</span>
                  </div>
                  {selectedUser.status === 'injured' && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex items-center gap-2 mb-2"><AlertCircle size={16} className="text-red-500" /><span className="text-sm font-bold text-red-700">Active Injury</span></div>
                      <p className="text-sm text-red-600">Hamstring strain - currently in rehabilitation programme. Estimated return: 2 weeks.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-dark-50/60 rounded-xl text-center">
                      <p className="text-2xl font-extrabold text-dark-900">6.4</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wider mt-1">Avg RPE</p>
                    </div>
                    <div className="p-4 bg-dark-50/60 rounded-xl text-center">
                      <p className="text-2xl font-extrabold text-court-600">92%</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wider mt-1">Attendance</p>
                    </div>
                    <div className="p-4 bg-dark-50/60 rounded-xl text-center">
                      <p className="text-2xl font-extrabold text-dark-900">7.8</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wider mt-1">Wellness Score</p>
                    </div>
                  </div>
                </div>
              )}
              {profileTab === 'events' && (
                <div className="text-center py-10">
                  <Calendar size={32} className="text-dark-200 mx-auto mb-3" />
                  <p className="text-sm text-dark-400">Recent events for this user</p>
                  <p className="text-xs text-dark-300 mt-1">Event history will appear here</p>
                </div>
              )}
              {profileTab === 'other' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-dark-800">Contact Details</h3>
                    <InfoRow icon={<Phone size={14} />} label="Phone" value="+44 7700 900123" />
                    <InfoRow icon={<MapPin size={14} />} label="Address" value="42 Stadium Way, London, W1 2AB" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-dark-800">Emergency Contact</h3>
                    <InfoRow icon={<User size={14} />} label="Name" value="Jane {selectedUser.lastName}" />
                    <InfoRow icon={<Phone size={14} />} label="Phone" value="+44 7700 900456" />
                    <InfoRow icon={<Users size={14} />} label="Relationship" value="Spouse" />
                  </div>
                </div>
              )}
              {profileTab === 'registration' && selectedUser.role === 'player' && (
                <RegistrationTab user={selectedUser} />
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function RegistrationTab({ user }: { user: UserType }) {
  const [showWizard, setShowWizard] = useState(false);
  const reg = getAthleteRegistration(user.id);

  if (showWizard) {
    return (
      <RegistrationWizard
        organizationId="fc-courtside"
        athleteName={`${user.firstName} ${user.lastName}`}
        onClose={() => setShowWizard(false)}
      />
    );
  }

  if (reg) {
    return <RegistrationStatusCard registration={reg} onStartWizard={() => setShowWizard(true)} />;
  }

  return (
    <div className="text-center py-10 space-y-3">
      <Shield size={32} className="text-dark-200 mx-auto" />
      <p className="text-sm text-dark-500">No registration data yet</p>
      <p className="text-xs text-dark-400">Start the registration process to collect governing body IDs, documents, and eligibility information.</p>
      <button onClick={() => setShowWizard(true)}
        className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 inline-flex items-center gap-2">
        <Shield size={14} /> Start Registration
      </button>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-dark-50 flex items-center justify-center text-dark-400 shrink-0">{icon}</div>
      <div>
        <p className="text-[11px] text-dark-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-dark-800 capitalize">{value}</p>
      </div>
    </div>
  );
}
