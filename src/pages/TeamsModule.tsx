import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Eye, Users, ArrowLeft, Tag, X, Save,
  Calendar, MapPin, Clock, Link2, ExternalLink, Copy, User,
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Layers,
} from 'lucide-react';
import { teams, Team } from '@/data/teams';
import { users, User as UserType } from '@/data/users';
import {
  segments, getSegmentsForTeam, Segment, SegmentStatus, SegmentType, Batch,
  statusConfig, registrantStatusConfig,
} from '@/data/segments';
import { format, parseISO, isPast, isFuture, differenceInDays } from 'date-fns';

type ViewMode = 'list' | 'detail';
type DetailTab = 'members' | 'segments';

export default function TeamsModule() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('members');
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [showSegmentForm, setShowSegmentForm] = useState(false);
  const [editSegment, setEditSegment] = useState<Segment | null>(null);

  const filtered = teams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  const getTeamMembers = (teamId: string): UserType[] =>
    users.filter(u => u.teamIds.includes(teamId));

  const openTeam = (team: Team) => {
    setSelectedTeam(team);
    setViewMode('detail');
    setDetailTab('members');
    setSelectedSegment(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-dark-900">Teams</h1>
              <p className="text-xs text-dark-400 mt-0.5">{teams.length} teams across the organisation</p>
            </div>
            <button className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm">
              <Plus size={16} /> Create Team
            </button>
          </div>
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((team, i) => {
              const members = getTeamMembers(team.id);
              const playerCount = members.filter(m => m.role === 'player').length;
              const staffCount = members.filter(m => m.role !== 'player').length;
              const teamSegments = getSegmentsForTeam(team.id);
              const activeSegments = teamSegments.filter(s => s.status === 'active').length;
              return (
                <motion.div key={team.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => openTeam(team)}
                  className="bg-white rounded-2xl border border-dark-100 p-5 cursor-pointer hover:shadow-card-hover hover:border-court-200 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}bb)` }}>{team.shortName}</div>
                    <div>
                      <h3 className="text-base font-bold text-dark-900 group-hover:text-court-600 transition-colors">{team.name}</h3>
                      <p className="text-xs text-dark-400">Coach: {team.coachName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center"><p className="text-lg font-extrabold text-dark-900">{team.memberCount}</p><p className="text-[10px] text-dark-400 uppercase tracking-wider">Total</p></div>
                    <div className="w-px h-8 bg-dark-100" />
                    <div className="text-center"><p className="text-lg font-extrabold text-court-600">{playerCount}</p><p className="text-[10px] text-dark-400 uppercase tracking-wider">Players</p></div>
                    <div className="w-px h-8 bg-dark-100" />
                    <div className="text-center"><p className="text-lg font-extrabold text-dark-600">{staffCount}</p><p className="text-[10px] text-dark-400 uppercase tracking-wider">Staff</p></div>
                    {activeSegments > 0 && <>
                      <div className="w-px h-8 bg-dark-100" />
                      <div className="text-center"><p className="text-lg font-extrabold text-purple-600">{activeSegments}</p><p className="text-[10px] text-dark-400 uppercase tracking-wider">Segments</p></div>
                    </>}
                  </div>
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {members.slice(0, 6).map(m => (
                        <div key={m.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center border-2 border-white">
                          <span className="text-[9px] font-bold text-white">{m.avatar}</span>
                        </div>
                      ))}
                    </div>
                    {members.length > 6 && <span className="ml-2 text-xs text-dark-400 font-medium">+{members.length - 6} more</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : selectedTeam && !selectedSegment ? (
        /* ─── Team Detail View ────────────────────── */
        <>
          <button onClick={() => setViewMode('list')} className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-700"><ArrowLeft size={16} /> Back to Teams</button>
          <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
            {/* Team header */}
            <div className="p-6 border-b border-dark-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: `linear-gradient(135deg, ${selectedTeam.color}, ${selectedTeam.color}bb)` }}>{selectedTeam.shortName}</div>
                <div>
                  <h2 className="text-xl font-extrabold text-dark-900">{selectedTeam.name}</h2>
                  <p className="text-sm text-dark-400">Coach: {selectedTeam.coachName} &middot; {selectedTeam.memberCount} members</p>
                </div>
                <button className="ml-auto h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-2">
                  <Pencil size={14} /> Edit Team
                </button>
              </div>
            </div>

            {/* Tabs: Members | Segments */}
            <div className="flex items-center gap-0.5 px-6 border-b border-dark-100">
              {([
                { key: 'members' as DetailTab, label: 'Members', icon: <Users size={14} />, count: getTeamMembers(selectedTeam.id).length },
                { key: 'segments' as DetailTab, label: 'Segments', icon: <Layers size={14} />, count: getSegmentsForTeam(selectedTeam.id).length },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setDetailTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                    detailTab === tab.key ? 'text-court-600' : 'text-dark-400 hover:text-dark-700'}`}>
                  {tab.icon} {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${detailTab === tab.key ? 'bg-court-100 text-court-700' : 'bg-dark-100 text-dark-400'}`}>{tab.count}</span>
                  {detailTab === tab.key && <motion.div layoutId="team-detail-tab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-court-500 rounded-full" />}
                </button>
              ))}
            </div>

            {/* Members Tab */}
            {detailTab === 'members' && (
              <table className="w-full">
                <thead><tr className="bg-dark-50/60">
                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">#</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Player</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Position</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Role</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                  <th className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Tags</th>
                </tr></thead>
                <tbody className="divide-y divide-dark-100">
                  {getTeamMembers(selectedTeam.id).map(member => (
                    <tr key={member.id} className="hover:bg-dark-50/30 transition-colors">
                      <td className="px-6 py-3 text-xs font-bold text-dark-400">{member.jerseyNumber || '—'}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">{member.avatar}</span>
                          </div>
                          <div><p className="text-sm font-semibold text-dark-800">{member.firstName} {member.lastName}</p><p className="text-[11px] text-dark-400">{member.email}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs text-dark-600">{member.position || member.designation}</td>
                      <td className="px-6 py-3"><span className="px-2 py-0.5 bg-court-50 text-court-700 rounded text-[10px] font-semibold capitalize">{member.role}</span></td>
                      <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${member.status === 'active' ? 'bg-green-50 text-green-600' : member.status === 'injured' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{member.status}</span></td>
                      <td className="px-6 py-3">{member.position && <span className="px-1.5 py-0.5 bg-dark-50 text-dark-500 rounded text-[10px] font-medium">{member.position}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Segments Tab */}
            {detailTab === 'segments' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-end">
                  <button onClick={() => { setEditSegment(null); setShowSegmentForm(true); }}
                    className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Create Segment</button>
                </div>
                {getSegmentsForTeam(selectedTeam.id).length === 0 ? (
                  <div className="text-center py-12">
                    <Layers size={28} className="text-dark-200 mx-auto mb-3" />
                    <p className="text-sm text-dark-400">No segments created for this team yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getSegmentsForTeam(selectedTeam.id).map(seg => {
                      const sc = statusConfig[seg.status];
                      const daysLeft = seg.status === 'active' ? differenceInDays(parseISO(seg.endDate), new Date()) : null;
                      const progress = seg.status === 'active'
                        ? Math.round(((differenceInDays(new Date(), parseISO(seg.startDate))) / differenceInDays(parseISO(seg.endDate), parseISO(seg.startDate))) * 100)
                        : null;
                      return (
                        <div key={seg.id} onClick={() => setSelectedSegment(seg)}
                          className="bg-white border border-dark-100 rounded-xl p-5 hover:shadow-card hover:border-court-200 transition-all cursor-pointer group">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-bold text-dark-900 group-hover:text-court-600 transition-colors truncate">{seg.name}</h3>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${seg.type === 'batch' ? 'bg-purple-50 text-purple-600' : 'bg-court-50 text-court-600'}`}>{seg.type === 'batch' ? 'Batch' : 'Segment'}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${sc.bg} ${sc.text}`}>{sc.label}</span>
                              </div>
                              <p className="text-xs text-dark-500 line-clamp-2">{seg.description}</p>
                            </div>
                            <ChevronRight size={16} className="text-dark-300 group-hover:text-court-500 shrink-0 ml-3 mt-1 group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-dark-500">
                            <span className="flex items-center gap-1"><Calendar size={12} className="text-dark-400" /> {format(parseISO(seg.startDate), 'MMM d')} — {format(parseISO(seg.endDate), 'MMM d, yyyy')}</span>
                            {seg.location && <span className="flex items-center gap-1"><MapPin size={12} className="text-dark-400" /> {seg.location}</span>}
                            <span className="flex items-center gap-1"><Users size={12} className="text-dark-400" /> {seg.registeredCount}{seg.capacity ? `/${seg.capacity}` : ''} registered</span>
                            {seg.fee && <span className="flex items-center gap-1 font-semibold text-court-600">{seg.fee}</span>}
                            {seg.signupEnabled && <span className="flex items-center gap-1 text-court-500 font-semibold"><Link2 size={12} /> Signup Open</span>}
                          </div>
                          {progress !== null && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-[10px] text-dark-400 mb-1">
                                <span>Progress</span>
                                <span>{daysLeft} days remaining</span>
                              </div>
                              <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-court-500 to-court-400 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Segment create/edit modal */}
          <AnimatePresence>{showSegmentForm && (
            <SegmentFormModal teamId={selectedTeam.id} segment={editSegment} onClose={() => { setShowSegmentForm(false); setEditSegment(null); }} />
          )}</AnimatePresence>
        </>
      ) : selectedSegment && selectedTeam && (
        /* ─── Segment Detail View ─────────────────── */
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedSegment(null)} className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-700"><ArrowLeft size={16} /> {selectedTeam.name}</button>
            <ChevronRight size={14} className="text-dark-300" />
            <span className="text-sm font-semibold text-dark-700">Segments</span>
          </div>

          <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-dark-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-extrabold text-dark-900">{selectedSegment.name}</h2>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusConfig[selectedSegment.status].bg} ${statusConfig[selectedSegment.status].text}`}>{statusConfig[selectedSegment.status].label}</span>
                  </div>
                  <p className="text-sm text-dark-500 max-w-2xl">{selectedSegment.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button onClick={() => { setEditSegment(selectedSegment); setShowSegmentForm(true); }}
                    className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-1.5"><Pencil size={13} /> Edit</button>
                  <button className="h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-1.5"><Trash2 size={13} /> Delete</button>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-dark-100">
              <InfoCard icon={<Calendar size={16} />} label="Start Date" value={format(parseISO(selectedSegment.startDate), 'MMM d, yyyy')} />
              <InfoCard icon={<Calendar size={16} />} label="End Date" value={format(parseISO(selectedSegment.endDate), 'MMM d, yyyy')} />
              <InfoCard icon={<Users size={16} />} label="Registered" value={`${selectedSegment.registeredCount}${selectedSegment.capacity ? ` / ${selectedSegment.capacity}` : ''}`} />
              <InfoCard icon={<MapPin size={16} />} label="Location" value={selectedSegment.location || '—'} />
              {selectedSegment.schedule && <InfoCard icon={<Clock size={16} />} label="Schedule" value={selectedSegment.schedule} />}
              {selectedSegment.ageGroup && <InfoCard icon={<User size={16} />} label="Age Group" value={selectedSegment.ageGroup} />}
              {selectedSegment.fee && <InfoCard icon={<Tag size={16} />} label="Fee" value={selectedSegment.fee} />}
            </div>

            {/* Signup link */}
            {selectedSegment.signupLink && (
              <div className="px-6 py-4 border-b border-dark-100 bg-dark-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 size={14} className="text-court-500" />
                    <span className="text-xs font-semibold text-dark-700">Public Signup Link</span>
                    {selectedSegment.signupEnabled
                      ? <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-bold">OPEN</span>
                      : <span className="px-1.5 py-0.5 bg-dark-100 text-dark-400 rounded text-[9px] font-bold">CLOSED</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] text-dark-500 bg-white px-2 py-1 rounded border border-dark-200 max-w-xs truncate">{selectedSegment.signupLink}</code>
                    <button className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-dark-700"><Copy size={13} /></button>
                    <button className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-dark-700"><ExternalLink size={13} /></button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SEGMENT TYPE: Weekly Schedule ─────── */}
            {selectedSegment.type === 'segment' && selectedSegment.events && selectedSegment.events.length > 0 && (
              <div className="px-6 py-5 border-b border-dark-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-dark-800">Event Schedule</h3>
                  <span className="px-2 py-0.5 bg-court-50 text-court-600 rounded text-[10px] font-bold">Segment — Multiple Event Types</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {selectedSegment.events.map(ev => (
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

            {/* ── BATCH TYPE: Batch Cards ────────────── */}
            {selectedSegment.type === 'batch' && selectedSegment.batches && selectedSegment.batches.length > 0 && (
              <div className="px-6 py-5 border-b border-dark-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-dark-800">Available Batches</h3>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold">Batch — Users Choose &amp; Pick Sessions</span>
                </div>
                <div className="space-y-3">
                  {selectedSegment.batches.map(batch => {
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
                          {/* Registrants in this batch */}
                          <div className="flex -space-x-1.5">
                            {selectedSegment.registrants.filter(r => r.batchId === batch.id).slice(0, 4).map(r => (
                              <div key={r.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center border-2 border-white">
                                <span className="text-[7px] font-bold text-white">{r.avatar}</span>
                              </div>
                            ))}
                            {selectedSegment.registrants.filter(r => r.batchId === batch.id).length > 4 && (
                              <span className="text-[9px] text-dark-400 ml-1.5">+{selectedSegment.registrants.filter(r => r.batchId === batch.id).length - 4}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Registrants table */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-dark-800">Registrants ({selectedSegment.registrants.length})</h3>
              </div>
              {selectedSegment.registrants.length === 0 ? (
                <div className="text-center py-10"><Users size={24} className="text-dark-200 mx-auto mb-2" /><p className="text-sm text-dark-400">No registrants yet</p></div>
              ) : (
                <div className="border border-dark-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="bg-dark-50/60">
                      <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">#</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Name</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Email</th>
                      {selectedSegment.type === 'batch' && <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Batch</th>}
                      {selectedSegment.type === 'batch' && <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Sessions</th>}
                      <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Registered</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-dark-100">
                      {selectedSegment.registrants.map((reg, i) => {
                        const rs = registrantStatusConfig[reg.status];
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
                            {selectedSegment.type === 'batch' && (
                              <td className="px-4 py-3">{(() => {
                                const batch = selectedSegment.batches?.find(b => b.id === reg.batchId);
                                return batch ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: batch.eventColor + '15', color: batch.eventColor }}>{batch.name}</span> : <span className="text-xs text-dark-400">—</span>;
                              })()}</td>
                            )}
                            {selectedSegment.type === 'batch' && (
                              <td className="px-4 py-3">{reg.sessionsChosen ? (
                                <span className="text-xs font-bold text-dark-700">{reg.sessionsChosen} <span className="text-dark-400 font-normal">sessions</span></span>
                              ) : <span className="text-xs text-dark-400">—</span>}</td>
                            )}
                            <td className="px-4 py-3 text-xs text-dark-500">{reg.registeredAt}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rs.bg} ${rs.text}`}>{rs.label}</span></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
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
          </div>

          <AnimatePresence>{showSegmentForm && (
            <SegmentFormModal teamId={selectedTeam.id} segment={editSegment} onClose={() => { setShowSegmentForm(false); setEditSegment(null); }} />
          )}</AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// ── Segment Create/Edit Modal ─────────────────────────
function SegmentFormModal({ teamId, segment, onClose }: {
  teamId: string;
  segment: Segment | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(segment?.name || '');
  const [description, setDescription] = useState(segment?.description || '');
  const [segType, setSegType] = useState<SegmentType>(segment?.type || 'segment');
  const [startDate, setStartDate] = useState(segment?.startDate || '');
  const [endDate, setEndDate] = useState(segment?.endDate || '');
  const [capacity, setCapacity] = useState(segment?.capacity?.toString() || '');
  const [location, setLocation] = useState(segment?.location || '');
  const [ageGroup, setAgeGroup] = useState(segment?.ageGroup || '');
  const [fee, setFee] = useState(segment?.fee || '');
  const [status, setStatus] = useState<SegmentStatus>(segment?.status || 'draft');
  const [signupEnabled, setSignupEnabled] = useState(segment?.signupEnabled || false);
  // Batch builder
  const [batches, setBatches] = useState<Batch[]>(segment?.batches || []);
  const [batchName, setBatchName] = useState('');
  const [batchType, setBatchType] = useState('Training');
  const [batchDays, setBatchDays] = useState<string[]>([]);
  const [batchTime, setBatchTime] = useState('');
  const [batchDuration, setBatchDuration] = useState('');
  const [batchSessions, setBatchSessions] = useState('');
  const [batchCap, setBatchCap] = useState('');
  const [batchFee, setBatchFee] = useState('');

  const eventTypeColors: Record<string, string> = { Training: '#00A76F', Fitness: '#FF6C40', Meeting: '#8E33FF', Recovery: '#00B8D9', Match: '#FF5630' };
  const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (d: string) => setBatchDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);

  const addBatch = () => {
    if (!batchName.trim() || batchDays.length === 0) return;
    setBatches(p => [...p, {
      id: `bat-new-${Date.now()}`, name: batchName, eventType: batchType, eventColor: eventTypeColors[batchType] || '#637381',
      days: batchDays, time: batchTime, duration: batchDuration,
      totalSessions: parseInt(batchSessions) || 0, capacity: parseInt(batchCap) || null, enrolledCount: 0, fee: batchFee || undefined,
    }]);
    setBatchName(''); setBatchDays([]); setBatchTime(''); setBatchDuration(''); setBatchSessions(''); setBatchCap(''); setBatchFee('');
  };

  const removeBatch = (id: string) => setBatches(p => p.filter(b => b.id !== id));

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-lg font-bold text-dark-900">{segment ? 'Edit' : 'Create'} {segType === 'batch' ? 'Batch Programme' : 'Segment'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSegType('segment')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${segType === 'segment' ? 'border-court-500 bg-court-50/50' : 'border-dark-200 hover:border-dark-300'}`}>
                <p className="text-sm font-bold text-dark-900">Segment</p>
                <p className="text-[11px] text-dark-400 mt-0.5">Multiple event types (training, fitness, meetings) in one programme</p>
              </button>
              <button onClick={() => setSegType('batch')}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${segType === 'batch' ? 'border-purple-500 bg-purple-50/50' : 'border-dark-200 hover:border-dark-300'}`}>
                <p className="text-sm font-bold text-dark-900">Batch</p>
                <p className="text-[11px] text-dark-400 mt-0.5">Users choose which batch to join and for how many sessions</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Easter Skills Camp 2026"
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Describe the programme..."
              className="w-full px-3 py-2 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Start Date *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">End Date *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Capacity</label>
              <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Unlimited" className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Age Group</label>
              <input value={ageGroup} onChange={e => setAgeGroup(e.target.value)} placeholder="e.g. Under 17" className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Academy" className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" /></div>
          </div>

          {/* ── BATCH BUILDER ──────────────────────── */}
          {segType === 'batch' && (
            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-700">Batches ({batches.length})</h4>
              </div>
              {/* Existing batches */}
              {batches.map(b => (
                <div key={b.id} className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border border-dark-100">
                  <div className="w-2 self-stretch rounded-full" style={{ backgroundColor: b.eventColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-dark-800">{b.name}</p>
                    <p className="text-[10px] text-dark-400">{b.days.join(', ')} &middot; {b.time} &middot; {b.totalSessions} sessions{b.fee ? ` &middot; ${b.fee}` : ''}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: b.eventColor + '15', color: b.eventColor }}>{b.eventType}</span>
                  <button onClick={() => removeBatch(b.id)} className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              ))}
              {/* Add batch form */}
              <div className="p-3 bg-white rounded-lg border border-dashed border-purple-200 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Add Batch</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="Batch name *"
                    className="h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                  <select value={batchType} onChange={e => setBatchType(e.target.value)}
                    className="h-8 px-2.5 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500/30">
                    {Object.keys(eventTypeColors).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-dark-400 mb-1">Days *</p>
                  <div className="flex gap-1">
                    {dayOptions.map(d => (
                      <button key={d} onClick={() => toggleDay(d)}
                        className={`w-9 h-7 rounded-md text-[10px] font-bold transition-all ${batchDays.includes(d) ? 'bg-purple-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>{d}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input value={batchTime} onChange={e => setBatchTime(e.target.value)} placeholder="Time" className="h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                  <input value={batchDuration} onChange={e => setBatchDuration(e.target.value)} placeholder="Duration" className="h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                  <input type="number" value={batchSessions} onChange={e => setBatchSessions(e.target.value)} placeholder="Sessions" className="h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                  <input value={batchFee} onChange={e => setBatchFee(e.target.value)} placeholder="Fee" className="h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                </div>
                <button onClick={addBatch} disabled={!batchName.trim() || batchDays.length === 0}
                  className="w-full h-8 rounded-lg bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors"><Plus size={13} /> Add Batch</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Status</label>
              <div className="flex gap-1.5">
                {(['draft', 'upcoming', 'active', 'completed', 'cancelled'] as SegmentStatus[]).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`flex-1 h-8 rounded-lg text-[10px] font-bold capitalize transition-all ${
                      status === s ? `${statusConfig[s].bg} ${statusConfig[s].text} ring-2 ring-offset-1 ring-current` : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Public Signup</label>
              <button onClick={() => setSignupEnabled(!signupEnabled)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all w-full text-left ${signupEnabled ? 'border-court-200 bg-court-50' : 'border-dark-200'}`}>
                <div className={`w-8 h-4.5 rounded-full transition-colors flex items-center ${signupEnabled ? 'bg-court-500 justify-end' : 'bg-dark-200 justify-start'}`}>
                  <div className="w-3.5 h-3.5 bg-white rounded-full shadow mx-0.5" />
                </div>
                <span className="text-xs font-semibold text-dark-700">{signupEnabled ? 'Open' : 'Closed'}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button disabled={!name.trim() || !startDate || !endDate}
            className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-2 transition-colors"><Save size={15} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-dark-50/60 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-dark-500 shrink-0 shadow-sm">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">{label}</p>
        <p className="text-sm font-semibold text-dark-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
