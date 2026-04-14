import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Users, ArrowLeft, ChevronRight,
  Calendar, MapPin, Clock, Link2, Layers, Tag, X, ArrowRightLeft,
  Copy, ExternalLink, User, CheckCircle2, Shield,
} from 'lucide-react';
import { teams, Team } from '@/data/teams';
import { users, User as UserType } from '@/data/users';
import {
  segments, getSegmentsForTeam, getFlatBatches,
  Segment, FlatBatch, SegmentRegistrant,
  statusConfig, registrantStatusConfig,
} from '@/data/segments';
import { format, parseISO, differenceInDays } from 'date-fns';

type GroupsTab = 'teams' | 'segments' | 'batches';
type GroupView = 'list' | 'team-detail' | 'segment-detail' | 'batch-detail';

export default function GroupsModule() {
  const location = useLocation();
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const basePath = `/o/${organizationId}/groups`;

  const pathEnd = location.pathname.split('/groups/')[1]?.split('/')[0] || 'teams';
  const activeTab: GroupsTab = (['teams', 'segments', 'batches'].includes(pathEnd) ? pathEnd : 'teams') as GroupsTab;

  const setTab = (t: GroupsTab) => {
    setView('list');
    setSelectedTeam(null);
    setSelectedSegment(null);
    setSelectedBatch(null);
    navigate(`${basePath}/${t}`);
  };

  const [search, setSearch] = useState('');
  const [view, setView] = useState<GroupView>('list');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<FlatBatch | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferPerson, setTransferPerson] = useState<{ name: string; avatar: string; currentLabel: string } | null>(null);

  const allSegments = segments.filter(s => s.type === 'segment');
  const flatBatches = getFlatBatches();

  const getTeamMembers = (teamId: string): UserType[] => users.filter(u => u.teamIds.includes(teamId));

  const openTeamDetail = (team: Team) => {
    setSelectedTeam(team);
    setSelectedSegment(null);
    setSelectedBatch(null);
    setView('team-detail');
  };

  const openSegmentDetail = (seg: Segment) => {
    setSelectedSegment(seg);
    setSelectedBatch(null);
    setView('segment-detail');
  };

  const openBatchDetail = (batch: FlatBatch) => {
    setSelectedBatch(batch);
    setSelectedSegment(null);
    setView('batch-detail');
  };

  const backToList = () => {
    setView('list');
    setSelectedTeam(null);
    setSelectedSegment(null);
    setSelectedBatch(null);
  };

  const openTransfer = (name: string, avatar: string, currentLabel: string) => {
    setTransferPerson({ name, avatar, currentLabel });
    setShowTransfer(true);
  };

  // Role badge colors
  const roleBadge: Record<string, { bg: string; text: string }> = {
    player: { bg: 'bg-court-50', text: 'text-court-600' },
    coach: { bg: 'bg-purple-50', text: 'text-purple-600' },
    staff: { bg: 'bg-blue-50', text: 'text-blue-600' },
    admin: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
    medical: { bg: 'bg-red-50', text: 'text-red-600' },
  };

  // ─── LIST VIEW ──────────────────────────────────────────
  if (view === 'list') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-dark-900">Groups</h1>
            <p className="text-xs text-dark-400 mt-0.5">Teams, segments, and batch programmes</p>
          </div>
          <button className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Create {activeTab === 'teams' ? 'Team' : activeTab === 'segments' ? 'Segment' : 'Batch'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-dark-100/60 rounded-xl p-0.5 w-fit">
          {([
            { key: 'teams' as GroupsTab, label: 'Teams', count: teams.length },
            { key: 'segments' as GroupsTab, label: 'Segments', count: allSegments.length },
            { key: 'batches' as GroupsTab, label: 'Batches', count: flatBatches.length },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.key ? 'bg-court-100 text-court-700' : 'bg-dark-200 text-dark-400'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTab}...`}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
        </div>

        {/* ─── TEAMS TAB ─────────────────────────────── */}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase())).map((team, i) => {
              const members = getTeamMembers(team.id);
              const teamSegs = getSegmentsForTeam(team.id);
              return (
                <motion.div key={team.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => openTeamDetail(team)}
                  className="bg-white rounded-2xl border border-dark-100 p-5 cursor-pointer hover:shadow-card-hover hover:border-court-200 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}bb)` }}>{team.shortName}</div>
                    <div>
                      <h3 className="text-sm font-bold text-dark-900 group-hover:text-court-600 transition-colors">{team.name}</h3>
                      <p className="text-[11px] text-dark-400">Coach: {team.coachName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-dark-500">
                    <span><strong className="text-dark-700">{team.memberCount}</strong> members</span>
                    <span className="w-px h-3 bg-dark-200" />
                    <span><strong className="text-dark-700">{teamSegs.length}</strong> segments</span>
                  </div>
                  <div className="flex -space-x-1.5 mt-3">
                    {members.slice(0, 5).map(m => (
                      <div key={m.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center border-2 border-white">
                        <span className="text-[8px] font-bold text-white">{m.avatar}</span>
                      </div>
                    ))}
                    {members.length > 5 && <span className="ml-1.5 text-[10px] text-dark-400">+{members.length - 5}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ─── SEGMENTS TAB ──────────────────────────── */}
        {activeTab === 'segments' && (
          <div className="space-y-3">
            {allSegments.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dark-100">
                <Layers size={28} className="text-dark-200 mx-auto mb-3" />
                <p className="text-sm text-dark-400">No segments found</p>
              </div>
            ) : allSegments.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase())).map((seg, i) => {
              const sc = statusConfig[seg.status];
              const teamName = teams.find(t => t.id === seg.teamId)?.name || '';
              const progress = seg.status === 'active'
                ? Math.round((differenceInDays(new Date(), parseISO(seg.startDate)) / differenceInDays(parseISO(seg.endDate), parseISO(seg.startDate))) * 100)
                : null;
              return (
                <motion.div key={seg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => openSegmentDetail(seg)}
                  className="bg-white border border-dark-100 rounded-xl p-5 hover:shadow-card hover:border-court-200 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-dark-900 group-hover:text-court-600 truncate">{seg.name}</h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-court-50 text-court-600 shrink-0">Segment</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                      <p className="text-xs text-dark-500 line-clamp-1">{seg.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-dark-300 group-hover:text-court-500 shrink-0 ml-3 mt-1" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-dark-500 mt-2">
                    <span className="flex items-center gap-1 font-semibold text-dark-700"><Users size={11} /> {teamName}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} className="text-dark-400" /> {format(parseISO(seg.startDate), 'MMM d')} — {format(parseISO(seg.endDate), 'MMM d, yyyy')}</span>
                    <span>{seg.registeredCount}{seg.capacity ? `/${seg.capacity}` : ''} registered</span>
                    {seg.events && <span>{seg.events.length} event types</span>}
                  </div>
                  {progress !== null && (
                    <div className="h-1 bg-dark-100 rounded-full overflow-hidden mt-3">
                      <div className="h-full bg-court-400 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ─── BATCHES TAB (FLAT) ─────────────────────── */}
        {activeTab === 'batches' && (
          <div className="space-y-3">
            {flatBatches.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.parentSegmentName.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dark-100">
                <Layers size={28} className="text-dark-200 mx-auto mb-3" />
                <p className="text-sm text-dark-400">No batches found</p>
              </div>
            ) : flatBatches.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.parentSegmentName.toLowerCase().includes(search.toLowerCase())).map((batch, i) => {
              const sc = statusConfig[batch.parentSegmentStatus];
              const teamName = teams.find(t => t.id === batch.teamId)?.name || '';
              const pctFull = batch.capacity ? Math.round((batch.enrolledCount / batch.capacity) * 100) : 0;
              return (
                <motion.div key={`${batch.parentSegmentId}-${batch.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => openBatchDetail(batch)}
                  className="bg-white border border-dark-100 rounded-xl p-5 hover:shadow-card hover:border-purple-200 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: batch.eventColor }}>
                        {batch.name.charAt(0)}{batch.name.split(' ')[1]?.charAt(0) || ''}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="text-sm font-bold text-dark-900 group-hover:text-purple-600 truncate">{batch.name}</h3>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-600 shrink-0">Batch</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0" style={{ backgroundColor: batch.eventColor + '15', color: batch.eventColor }}>{batch.eventType}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        </div>
                        <p className="text-[11px] text-dark-400 truncate">Part of <span className="font-semibold text-dark-600">{batch.parentSegmentName}</span></p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-dark-300 group-hover:text-purple-500 shrink-0 ml-3 mt-1" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-dark-500 mt-2">
                    <span className="flex items-center gap-1 font-semibold text-dark-700"><Users size={11} /> {teamName}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} className="text-dark-400" /> {batch.days.join(', ')}</span>
                    <span className="flex items-center gap-1"><Clock size={11} className="text-dark-400" /> {batch.time}</span>
                    <span>{batch.totalSessions} sessions</span>
                    <span className="font-semibold text-dark-700">{batch.enrolledCount}{batch.capacity ? `/${batch.capacity}` : ''} enrolled</span>
                    {batch.fee && <span className="font-semibold text-court-600">{batch.fee}</span>}
                  </div>
                  {batch.capacity && (
                    <div className="h-1 bg-dark-100 rounded-full overflow-hidden mt-3">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pctFull, 100)}%`, backgroundColor: batch.eventColor }} />
                    </div>
                  )}
                  {batch.registrants.length > 0 && (
                    <div className="flex items-center mt-3 gap-2">
                      <div className="flex -space-x-1.5">
                        {batch.registrants.slice(0, 5).map(r => (
                          <div key={r.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white">
                            <span className="text-[8px] font-bold text-white">{r.avatar}</span>
                          </div>
                        ))}
                      </div>
                      {batch.registrants.length > 5 && <span className="text-[10px] text-dark-400">+{batch.registrants.length - 5}</span>}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {showTransfer && transferPerson && (
            <TransferModal person={transferPerson} onClose={() => { setShowTransfer(false); setTransferPerson(null); }} />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ─── TEAM DETAIL VIEW ───────────────────────────────────
  if (view === 'team-detail' && selectedTeam) {
    const team = selectedTeam;
    const members = getTeamMembers(team.id);
    const teamSegs = getSegmentsForTeam(team.id);
    const playerCount = members.filter(m => m.role === 'player').length;
    const staffCount = members.filter(m => m.role !== 'player').length;

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-700">
            <ArrowLeft size={16} /> Groups
          </button>
          <ChevronRight size={14} className="text-dark-300" />
          <span className="text-sm font-semibold text-dark-700">Teams</span>
        </div>

        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-dark-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base"
                  style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}bb)` }}>{team.shortName}</div>
                <div>
                  <h2 className="text-xl font-extrabold text-dark-900">{team.name}</h2>
                  <p className="text-xs text-dark-500 mt-0.5">Coach: {team.coachName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-1.5"><Pencil size={13} /> Edit</button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 p-6 border-b border-dark-100">
            <InfoCard icon={<Users size={16} />} label="Total Members" value={`${members.length}`} />
            <InfoCard icon={<User size={16} />} label="Players" value={`${playerCount}`} />
            <InfoCard icon={<Shield size={16} />} label="Staff" value={`${staffCount}`} />
            <InfoCard icon={<Layers size={16} />} label="Segments" value={`${teamSegs.length}`} />
          </div>

          {/* Members table */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-dark-800">Members ({members.length})</h3>
            </div>
            {members.length === 0 ? (
              <div className="text-center py-10"><Users size={24} className="text-dark-200 mx-auto mb-2" /><p className="text-sm text-dark-400">No members</p></div>
            ) : (
              <div className="border border-dark-100 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-dark-50/60">
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">#</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Name</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Email</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Position</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Role</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                    <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-dark-100">
                    {members.map((m, i) => {
                      const rb = roleBadge[m.role] || { bg: 'bg-dark-50', text: 'text-dark-500' };
                      const statusBadge = m.status === 'active'
                        ? { bg: 'bg-green-50', text: 'text-green-600', label: 'Active' }
                        : m.status === 'injured'
                        ? { bg: 'bg-red-50', text: 'text-red-600', label: 'Injured' }
                        : { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'Suspended' };
                      return (
                        <tr key={m.id} className="hover:bg-dark-50/30">
                          <td className="px-4 py-3 text-xs text-dark-400">{m.jerseyNumber || i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white">{m.avatar}</span>
                              </div>
                              <span className="text-sm font-medium text-dark-800">{m.firstName} {m.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-dark-500">{m.email}</td>
                          <td className="px-4 py-3 text-xs text-dark-600 font-medium">{m.position || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${rb.bg} ${rb.text}`}>{m.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text}`}>{statusBadge.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={(e) => { e.stopPropagation(); openTransfer(`${m.firstName} ${m.lastName}`, m.avatar, team.name); }}
                              className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 flex items-center gap-1">
                              <ArrowRightLeft size={10} /> Transfer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Team segments */}
          {teamSegs.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="text-sm font-bold text-dark-800 mb-3">Segments ({teamSegs.length})</h3>
              <div className="space-y-2">
                {teamSegs.map(seg => {
                  const sc = statusConfig[seg.status];
                  return (
                    <div key={seg.id} onClick={() => openSegmentDetail(seg)}
                      className="flex items-center gap-3 p-3 bg-dark-50/40 rounded-xl cursor-pointer hover:bg-dark-50 transition-colors group">
                      <div className={`w-2 self-stretch rounded-full shrink-0 ${seg.type === 'batch' ? 'bg-purple-400' : 'bg-court-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-dark-800 truncate group-hover:text-court-600">{seg.name}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${seg.type === 'batch' ? 'bg-purple-50 text-purple-600' : 'bg-court-50 text-court-600'}`}>{seg.type === 'batch' ? 'Batch' : 'Segment'}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        </div>
                        <p className="text-[10px] text-dark-400 mt-0.5">{seg.registeredCount} registered · {format(parseISO(seg.startDate), 'MMM d')} — {format(parseISO(seg.endDate), 'MMM d, yyyy')}</p>
                      </div>
                      <ChevronRight size={14} className="text-dark-300 group-hover:text-court-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showTransfer && transferPerson && (
            <TransferModal person={transferPerson} onClose={() => { setShowTransfer(false); setTransferPerson(null); }} />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ─── SEGMENT DETAIL VIEW ────────────────────────────────
  if (view === 'segment-detail' && selectedSegment) {
    const seg = selectedSegment;
    const sc = statusConfig[seg.status];
    const teamName = teams.find(t => t.id === seg.teamId)?.name || '';
    const progress = seg.status === 'active'
      ? Math.round((differenceInDays(new Date(), parseISO(seg.startDate)) / differenceInDays(parseISO(seg.endDate), parseISO(seg.startDate))) * 100)
      : null;

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-700">
            <ArrowLeft size={16} /> Groups
          </button>
          <ChevronRight size={14} className="text-dark-300" />
          <span className="text-sm font-semibold text-dark-700">{seg.type === 'segment' ? 'Segments' : 'Batches'}</span>
        </div>

        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
          <div className="p-6 border-b border-dark-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-extrabold text-dark-900">{seg.name}</h2>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${seg.type === 'batch' ? 'bg-purple-50 text-purple-600' : 'bg-court-50 text-court-600'}`}>{seg.type === 'batch' ? 'Batch' : 'Segment'}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                </div>
                <p className="text-sm text-dark-500 max-w-2xl">{seg.description}</p>
                <p className="text-xs text-dark-400 mt-1">Team: <span className="font-semibold text-dark-600">{teamName}</span></p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-1.5"><Pencil size={13} /> Edit</button>
                <button className="h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-1.5"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-dark-100">
            <InfoCard icon={<Calendar size={16} />} label="Start Date" value={format(parseISO(seg.startDate), 'MMM d, yyyy')} />
            <InfoCard icon={<Calendar size={16} />} label="End Date" value={format(parseISO(seg.endDate), 'MMM d, yyyy')} />
            <InfoCard icon={<Users size={16} />} label="Registered" value={`${seg.registeredCount}${seg.capacity ? ` / ${seg.capacity}` : ''}`} />
            <InfoCard icon={<MapPin size={16} />} label="Location" value={seg.location || '—'} />
            {seg.schedule && <InfoCard icon={<Clock size={16} />} label="Schedule" value={seg.schedule} />}
            {seg.ageGroup && <InfoCard icon={<User size={16} />} label="Age Group" value={seg.ageGroup} />}
            {seg.fee && <InfoCard icon={<Tag size={16} />} label="Fee" value={seg.fee} />}
          </div>

          {progress !== null && (
            <div className="px-6 py-3 border-b border-dark-100 bg-dark-50/30">
              <div className="flex items-center justify-between text-[10px] text-dark-400 mb-1">
                <span>Progress</span>
                <span>{Math.max(0, differenceInDays(parseISO(seg.endDate), new Date()))} days remaining</span>
              </div>
              <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-court-500 to-court-400 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
          )}

          {seg.signupLink && (
            <div className="px-6 py-4 border-b border-dark-100 bg-dark-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-court-500" />
                  <span className="text-xs font-semibold text-dark-700">Public Signup Link</span>
                  {seg.signupEnabled
                    ? <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-bold">OPEN</span>
                    : <span className="px-1.5 py-0.5 bg-dark-100 text-dark-400 rounded text-[9px] font-bold">CLOSED</span>}
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[11px] text-dark-500 bg-white px-2 py-1 rounded border border-dark-200 max-w-xs truncate">{seg.signupLink}</code>
                  <button className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-dark-700"><Copy size={13} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-dark-700"><ExternalLink size={13} /></button>
                </div>
              </div>
            </div>
          )}

          {seg.type === 'segment' && seg.events && seg.events.length > 0 && (
            <div className="px-6 py-5 border-b border-dark-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-dark-800">Event Schedule</h3>
                <span className="px-2 py-0.5 bg-court-50 text-court-600 rounded text-[10px] font-bold">Segment — Multiple Event Types</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {seg.events.map(ev => (
                  <div key={ev.id} className="flex items-center gap-2.5 p-3 bg-white border border-dark-100 rounded-xl">
                    <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: ev.eventColor }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-dark-800 truncate">{ev.title}</p>
                      <p className="text-[10px] text-dark-400">{ev.day} &middot; {ev.time}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: ev.eventColor + '15', color: ev.eventColor }}>{ev.eventType}</span>
                        <span className="text-[9px] text-dark-400">{ev.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {seg.type === 'batch' && seg.batches && seg.batches.length > 0 && (
            <div className="px-6 py-5 border-b border-dark-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-dark-800">Available Batches</h3>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold">Batch — Users Choose &amp; Pick Sessions</span>
              </div>
              <div className="space-y-3">
                {seg.batches.map(batch => {
                  const pctFull = batch.capacity ? Math.round((batch.enrolledCount / batch.capacity) * 100) : 0;
                  return (
                    <div key={batch.id} className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: batch.eventColor + '06' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: batch.eventColor }}>
                          {batch.name.charAt(0)}{batch.name.split(' ')[1]?.charAt(0) || ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-dark-900">{batch.name}</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: batch.eventColor + '15', color: batch.eventColor }}>{batch.eventType}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-dark-500">
                            <span className="flex items-center gap-1"><Calendar size={10} className="text-dark-400" /> {batch.days.join(', ')}</span>
                            <span className="flex items-center gap-1"><Clock size={10} className="text-dark-400" /> {batch.time}</span>
                            <span>{batch.duration}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-dark-800">{batch.totalSessions} sessions</p>
                          {batch.fee && <p className="text-xs font-bold text-court-600 mt-0.5">{batch.fee}</p>}
                        </div>
                      </div>
                      <div className="px-4 py-2.5 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[10px] text-dark-400 mb-1">
                            <span>Enrolled</span>
                            <span className="font-bold text-dark-600">{batch.enrolledCount}{batch.capacity ? ` / ${batch.capacity}` : ''}</span>
                          </div>
                          <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pctFull}%`, backgroundColor: batch.eventColor }} />
                          </div>
                        </div>
                        <div className="flex -space-x-1.5">
                          {seg.registrants.filter(r => r.batchId === batch.id).slice(0, 4).map(r => (
                            <div key={r.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center border-2 border-white">
                              <span className="text-[7px] font-bold text-white">{r.avatar}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Registrants table */}
          <RegistrantsTable
            registrants={seg.registrants}
            isBatchType={seg.type === 'batch'}
            batches={seg.batches}
            onTransfer={(reg, batchObj) => openTransfer(reg.name, reg.avatar, batchObj ? `${batchObj.name} (${seg.name})` : seg.name)}
          />
        </div>

        <AnimatePresence>
          {showTransfer && transferPerson && (
            <TransferModal person={transferPerson} onClose={() => { setShowTransfer(false); setTransferPerson(null); }} />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ─── BATCH DETAIL VIEW ──────────────────────────────────
  if (view === 'batch-detail' && selectedBatch) {
    const batch = selectedBatch;
    const sc = statusConfig[batch.parentSegmentStatus];
    const teamName = teams.find(t => t.id === batch.teamId)?.name || '';
    const pctFull = batch.capacity ? Math.round((batch.enrolledCount / batch.capacity) * 100) : 0;
    const parentSeg = segments.find(s => s.id === batch.parentSegmentId);

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-700">
            <ArrowLeft size={16} /> Groups
          </button>
          <ChevronRight size={14} className="text-dark-300" />
          <span className="text-sm font-semibold text-dark-700">Batches</span>
        </div>

        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
          <div className="p-6 border-b border-dark-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm mr-1"
                    style={{ backgroundColor: batch.eventColor }}>
                    {batch.name.charAt(0)}{batch.name.split(' ')[1]?.charAt(0) || ''}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-dark-900">{batch.name}</h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-600">Batch</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: batch.eventColor + '15', color: batch.eventColor }}>{batch.eventType}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-dark-500">
                      <span>Part of</span>
                      <button onClick={() => parentSeg && openSegmentDetail(parentSeg)} className="text-court-600 font-semibold hover:underline">{batch.parentSegmentName}</button>
                      <span className="text-dark-300">·</span>
                      <span className="font-semibold text-dark-600">{teamName}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-1.5"><Pencil size={13} /> Edit</button>
                <button className="h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-1.5"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-dark-100">
            <InfoCard icon={<Calendar size={16} />} label="Days" value={batch.days.join(', ')} />
            <InfoCard icon={<Clock size={16} />} label="Time" value={batch.time} />
            <InfoCard icon={<Clock size={16} />} label="Duration" value={batch.duration} />
            <InfoCard icon={<Layers size={16} />} label="Sessions" value={`${batch.totalSessions} total`} />
            <InfoCard icon={<Users size={16} />} label="Enrolled" value={`${batch.enrolledCount}${batch.capacity ? ` / ${batch.capacity}` : ''}`} />
            <InfoCard icon={<Calendar size={16} />} label="Start Date" value={format(parseISO(batch.startDate), 'MMM d, yyyy')} />
            <InfoCard icon={<Calendar size={16} />} label="End Date" value={format(parseISO(batch.endDate), 'MMM d, yyyy')} />
            {batch.fee && <InfoCard icon={<Tag size={16} />} label="Fee" value={batch.fee} />}
          </div>

          {batch.capacity && (
            <div className="px-6 py-4 border-b border-dark-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-dark-700">Enrollment Progress</span>
                <span className="font-bold" style={{ color: batch.eventColor }}>{pctFull}% full</span>
              </div>
              <div className="h-2.5 bg-dark-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pctFull, 100)}%`, backgroundColor: batch.eventColor }} />
              </div>
            </div>
          )}

          <RegistrantsTable
            registrants={batch.registrants}
            isBatchType={false}
            showSessions
            onTransfer={(reg) => openTransfer(reg.name, reg.avatar, `${batch.name} (${batch.parentSegmentName})`)}
          />
        </div>

        <AnimatePresence>
          {showTransfer && transferPerson && (
            <TransferModal person={transferPerson} onClose={() => { setShowTransfer(false); setTransferPerson(null); }} />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
}

// ── Registrants Table (shared) ────────────────────────────
function RegistrantsTable({ registrants, isBatchType, batches, showSessions, onTransfer }: {
  registrants: SegmentRegistrant[];
  isBatchType: boolean;
  batches?: { id: string; name: string; eventColor: string }[];
  showSessions?: boolean;
  onTransfer: (reg: SegmentRegistrant, batchObj?: { name: string; eventColor: string }) => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-dark-800">Registrants ({registrants.length})</h3>
      </div>
      {registrants.length === 0 ? (
        <div className="text-center py-10"><Users size={24} className="text-dark-200 mx-auto mb-2" /><p className="text-sm text-dark-400">No registrants yet</p></div>
      ) : (
        <div className="border border-dark-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-dark-50/60">
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">#</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Name</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Email</th>
              {isBatchType && <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Batch</th>}
              {(isBatchType || showSessions) && <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Sessions</th>}
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Registered</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-dark-100">
              {registrants.map((reg, i) => {
                const rs = registrantStatusConfig[reg.status];
                const batchObj = batches?.find(b => b.id === reg.batchId);
                return (
                  <tr key={reg.id} className="hover:bg-dark-50/30">
                    <td className="px-4 py-3 text-xs text-dark-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">{reg.avatar}</span>
                        </div>
                        <span className="text-sm font-medium text-dark-800">{reg.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-500">{reg.email}</td>
                    {isBatchType && (
                      <td className="px-4 py-3">
                        {batchObj ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: batchObj.eventColor + '15', color: batchObj.eventColor }}>{batchObj.name}</span> : <span className="text-xs text-dark-400">—</span>}
                      </td>
                    )}
                    {(isBatchType || showSessions) && (
                      <td className="px-4 py-3">{reg.sessionsChosen ? (
                        <span className="text-xs font-bold text-dark-700">{reg.sessionsChosen} <span className="text-dark-400 font-normal">sessions</span></span>
                      ) : <span className="text-xs text-dark-400">—</span>}</td>
                    )}
                    <td className="px-4 py-3 text-xs text-dark-500">{reg.registeredAt}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rs.bg} ${rs.text}`}>{rs.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onTransfer(reg, batchObj); }}
                          className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100 flex items-center gap-1"><ArrowRightLeft size={10} /> Transfer</button>
                        {reg.status === 'pending' && <button className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-bold hover:bg-green-100">Confirm</button>}
                        {reg.status === 'waitlisted' && <button className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100">Move Up</button>}
                        <button className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Info Card ──────────────────────────────────────────────
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-dark-50/40 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-white border border-dark-100 flex items-center justify-center text-dark-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">{label}</p>
        <p className="text-sm font-semibold text-dark-800 truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Transfer / Reassign Modal (Cascading) ─────────────────
type TransferDestType = 'team' | 'segment' | 'batch';

function TransferModal({ person, onClose }: {
  person: { name: string; avatar: string; currentLabel: string };
  onClose: () => void;
}) {
  // Cascading steps: Type → Team → (Segment if segment/batch) → (Batch if batch) → Confirm
  const [destType, setDestType] = useState<TransferDestType | null>(null);
  const [pickedTeam, setPickedTeam] = useState<Team | null>(null);
  const [pickedSegment, setPickedSegment] = useState<Segment | null>(null);
  const [pickedBatchLabel, setPickedBatchLabel] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Current step logic
  type ModalStep = 'type' | 'pick-team' | 'pick-segment' | 'pick-batch' | 'confirm';
  const getStep = (): ModalStep => {
    if (!destType) return 'type';
    if (destType === 'team') {
      if (!pickedTeam) return 'pick-team';
      return 'confirm';
    }
    if (destType === 'segment') {
      if (!pickedTeam) return 'pick-team';
      if (!pickedSegment) return 'pick-segment';
      return 'confirm';
    }
    // batch
    if (!pickedTeam) return 'pick-team';
    if (!pickedSegment) return 'pick-segment';
    if (!pickedBatchLabel) return 'pick-batch';
    return 'confirm';
  };

  const currentStep = getStep();

  const stepNumber = currentStep === 'type' ? 1
    : currentStep === 'pick-team' ? 2
    : currentStep === 'pick-segment' ? 3
    : currentStep === 'pick-batch' ? 4
    : destType === 'team' ? 3 : destType === 'segment' ? 4 : 5;

  const totalSteps = destType === 'team' ? 3 : destType === 'segment' ? 4 : destType === 'batch' ? 5 : 3;

  const getDestinationLabel = () => {
    if (destType === 'team') return pickedTeam?.name || '';
    if (destType === 'segment') return `${pickedSegment?.name || ''} (${pickedTeam?.name || ''})`;
    return `${pickedBatchLabel} → ${pickedSegment?.name || ''} (${pickedTeam?.name || ''})`;
  };

  const goBack = () => {
    setSearchVal('');
    if (currentStep === 'confirm') {
      if (destType === 'team') setPickedTeam(null);
      else if (destType === 'segment') setPickedSegment(null);
      else setPickedBatchLabel('');
    } else if (currentStep === 'pick-batch') {
      setPickedSegment(null);
    } else if (currentStep === 'pick-segment') {
      setPickedTeam(null);
    } else if (currentStep === 'pick-team') {
      setDestType(null);
      setPickedTeam(null);
      setPickedSegment(null);
      setPickedBatchLabel('');
    }
  };

  // Team segments filtered by type
  const teamSegments = pickedTeam
    ? segments.filter(s => s.teamId === pickedTeam.id && (destType === 'segment' ? true : s.type === 'batch'))
    : [];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-court-500" />
            <h3 className="text-lg font-bold text-dark-900">Transfer / Reassign</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Person info */}
          <div className="flex items-center gap-3 p-3 bg-dark-50/60 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{person.avatar}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-dark-900">{person.name}</p>
              <p className="text-xs text-dark-500">Currently in: <span className="font-semibold text-dark-700">{person.currentLabel}</span></p>
            </div>
          </div>

          {/* Confirmed state */}
          {confirmed ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h4 className="text-base font-bold text-dark-900 mb-1">Transfer Complete</h4>
              <p className="text-sm text-dark-500 max-w-sm mx-auto">
                <span className="font-semibold text-dark-700">{person.name}</span> has been transferred to{' '}
                <span className="font-semibold text-court-600">{getDestinationLabel()}</span>
              </p>
              <button onClick={onClose} className="mt-5 h-9 px-6 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600">Done</button>
            </motion.div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < stepNumber ? 'bg-court-500' : 'bg-dark-100'}`} />
                ))}
              </div>

              {/* ── Step: Type ──────────────────── */}
              {currentStep === 'type' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Transfer to</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { key: 'team' as TransferDestType, label: 'Team', desc: 'Move to a team', icon: <Users size={20} /> },
                      { key: 'segment' as TransferDestType, label: 'Segment', desc: 'Team → Segment', icon: <Layers size={20} /> },
                      { key: 'batch' as TransferDestType, label: 'Batch', desc: 'Team → Segment → Batch', icon: <Tag size={20} /> },
                    ]).map(opt => (
                      <button key={opt.key} onClick={() => { setDestType(opt.key); setSearchVal(''); }}
                        className="p-4 rounded-xl border-2 border-dark-200 hover:border-court-400 hover:bg-court-50/30 text-center transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-dark-50 group-hover:bg-court-100 flex items-center justify-center mx-auto mb-2 text-dark-400 group-hover:text-court-600 transition-colors">{opt.icon}</div>
                        <p className="text-sm font-bold text-dark-800">{opt.label}</p>
                        <p className="text-[10px] text-dark-400 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step: Pick Team ─────────────── */}
              {currentStep === 'pick-team' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-dark-400">
                      Select Team{destType !== 'team' && <span className="text-dark-300 font-normal"> (step 1)</span>}
                    </p>
                    <button onClick={goBack} className="text-xs text-court-600 hover:underline font-semibold">← Back</button>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Search teams..."
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {teams.filter(t => !searchVal || t.name.toLowerCase().includes(searchVal.toLowerCase())).map(t => {
                      const members = users.filter(u => u.teamIds.includes(t.id));
                      return (
                        <button key={t.id} onClick={() => { setPickedTeam(t); setSearchVal(''); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-dark-100 hover:border-court-200 hover:bg-dark-50/30 text-left transition-all">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}bb)` }}>{t.shortName}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-dark-800">{t.name}</p>
                            <p className="text-[10px] text-dark-400">{members.length} members · Coach: {t.coachName}</p>
                          </div>
                          <ChevronRight size={14} className="text-dark-300 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step: Pick Segment ──────────── */}
              {currentStep === 'pick-segment' && pickedTeam && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Select Segment</p>
                      <p className="text-[10px] text-dark-400 mt-0.5">Within <span className="font-semibold text-dark-600">{pickedTeam.name}</span></p>
                    </div>
                    <button onClick={goBack} className="text-xs text-court-600 hover:underline font-semibold">← Back</button>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Search segments..."
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {teamSegments.filter(s => !searchVal || s.name.toLowerCase().includes(searchVal.toLowerCase())).length === 0 ? (
                      <p className="text-center text-sm text-dark-400 py-6">No {destType === 'batch' ? 'batch-type' : ''} segments in this team</p>
                    ) : teamSegments.filter(s => !searchVal || s.name.toLowerCase().includes(searchVal.toLowerCase())).map(s => {
                      const ssc = statusConfig[s.status];
                      return (
                        <button key={s.id} onClick={() => { setPickedSegment(s); setSearchVal(''); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-dark-100 hover:border-court-200 hover:bg-dark-50/30 text-left transition-all">
                          <div className={`w-2 self-stretch rounded-full shrink-0 ${s.type === 'batch' ? 'bg-purple-400' : 'bg-court-400'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-dark-800 truncate">{s.name}</p>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.type === 'batch' ? 'bg-purple-50 text-purple-600' : 'bg-court-50 text-court-600'}`}>{s.type === 'batch' ? 'Batch' : 'Segment'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ssc.bg} ${ssc.text}`}>{ssc.label}</span>
                            </div>
                            <p className="text-[10px] text-dark-400 mt-0.5">{s.registeredCount}{s.capacity ? `/${s.capacity}` : ''} registered</p>
                          </div>
                          <ChevronRight size={14} className="text-dark-300 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step: Pick Batch ────────────── */}
              {currentStep === 'pick-batch' && pickedSegment && pickedSegment.batches && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Select Batch</p>
                      <p className="text-[10px] text-dark-400 mt-0.5">Within <span className="font-semibold text-dark-600">{pickedSegment.name}</span></p>
                    </div>
                    <button onClick={goBack} className="text-xs text-court-600 hover:underline font-semibold">← Back</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {pickedSegment.batches.map(b => {
                      const pct = b.capacity ? Math.round((b.enrolledCount / b.capacity) * 100) : 0;
                      return (
                        <button key={b.id} onClick={() => setPickedBatchLabel(b.name)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-dark-100 hover:border-purple-200 hover:bg-dark-50/30 text-left transition-all">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: b.eventColor }}>{b.name.charAt(0)}{b.name.split(' ')[1]?.charAt(0) || ''}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-dark-800">{b.name}</p>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: b.eventColor + '15', color: b.eventColor }}>{b.eventType}</span>
                            </div>
                            <p className="text-[10px] text-dark-400 mt-0.5">{b.days.join(', ')} · {b.time} · {b.enrolledCount}{b.capacity ? `/${b.capacity}` : ''} enrolled</p>
                          </div>
                          {b.capacity && (
                            <div className="w-16 shrink-0">
                              <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: b.eventColor }} />
                              </div>
                              <p className="text-[9px] text-dark-400 text-right mt-0.5">{pct}%</p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step: Confirm ───────────────── */}
              {currentStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-dark-400">Confirm Transfer</p>
                    <button onClick={goBack} className="text-xs text-court-600 hover:underline font-semibold">← Change</button>
                  </div>
                  <div className="bg-dark-50/60 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-dark-400 font-bold mb-1">From</p>
                        <div className="bg-white rounded-lg border border-dark-200 p-3">
                          <p className="text-sm font-bold text-dark-800">{person.currentLabel}</p>
                        </div>
                      </div>
                      <ArrowRightLeft size={20} className="text-court-500 shrink-0 mt-4" />
                      <div className="flex-1 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-dark-400 font-bold mb-1">To</p>
                        <div className="bg-court-50 rounded-lg border border-court-200 p-3">
                          <p className="text-sm font-bold text-court-700">{getDestinationLabel()}</p>
                        </div>
                      </div>
                    </div>
                    {/* Breadcrumb of selections */}
                    <div className="flex items-center gap-1.5 mt-3 justify-center flex-wrap">
                      {pickedTeam && (
                        <span className="px-2 py-0.5 bg-white rounded-md text-[10px] font-bold text-dark-600 border border-dark-100">{pickedTeam.name}</span>
                      )}
                      {pickedSegment && (
                        <>
                          <ChevronRight size={10} className="text-dark-300" />
                          <span className="px-2 py-0.5 bg-white rounded-md text-[10px] font-bold text-dark-600 border border-dark-100">{pickedSegment.name}</span>
                        </>
                      )}
                      {pickedBatchLabel && (
                        <>
                          <ChevronRight size={10} className="text-dark-300" />
                          <span className="px-2 py-0.5 bg-purple-50 rounded-md text-[10px] font-bold text-purple-600 border border-purple-100">{pickedBatchLabel}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!confirmed && currentStep === 'confirm' && (
          <div className="px-6 py-4 border-t border-dark-100 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50">Cancel</button>
            <button onClick={() => setConfirmed(true)}
              className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm">
              <ArrowRightLeft size={14} /> Confirm Transfer
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
