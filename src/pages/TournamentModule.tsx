import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Pencil, Trash2, Users, ArrowLeft, ChevronRight, Trophy,
  Calendar, MapPin, Clock, Shield, Layers, Tag, X, ExternalLink,
  CheckCircle2, AlertTriangle, Hotel, DollarSign, TrendingUp, BarChart3,
  Bell, Flag, UserPlus, Globe, Lock, Eye, Send,
} from 'lucide-react';
import {
  tournaments, Tournament, TournamentTeam, TournamentMatch, TournamentHotel,
  getTournamentTeamName, getTeamColor, getMatchTeamName, getDivisionTeams, getDivisionMatches,
  tournamentStatusConfig, housingStatusConfig, teamRegStatusConfig, matchStatusConfig,
} from '@/data/tournaments';
import { format, parseISO, isPast } from 'date-fns';

type ViewMode = 'list' | 'detail';
type DetailTab = 'overview' | 'teams' | 'housing' | 'brackets' | 'compliance' | 'reporting';

export default function TournamentModule() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [showAddHotel, setShowAddHotel] = useState(false);

  const openTournament = (t: Tournament) => {
    setSelected(t);
    setViewMode('detail');
    setDetailTab('overview');
    setDivisionFilter('all');
  };

  const backToList = () => {
    setViewMode('list');
    setSelected(null);
  };

  const filtered = tournaments.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  // ─── LIST VIEW ──────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-dark-900">Tournaments</h1>
            <p className="text-xs text-dark-400 mt-0.5">Manage tournaments, brackets, housing, and compliance</p>
          </div>
          <button className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Create Tournament
          </button>
        </div>

        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tournaments..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, i) => {
            const sc = tournamentStatusConfig[t.status];
            const matchesPlayed = t.matches.filter(m => m.matchStatus === 'final').length;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => openTournament(t)}
                className="bg-white rounded-2xl border border-dark-100 p-5 cursor-pointer hover:shadow-card-hover hover:border-court-200 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-court-500 to-court-600 flex items-center justify-center">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-dark-900 group-hover:text-court-600 truncate">{t.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      <span className="text-[10px] text-dark-400">{t.sport}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-dark-500 mb-3">
                  <span className="flex items-center gap-1"><Calendar size={11} className="text-dark-400" /> {format(parseISO(t.startDate), 'MMM d')} — {format(parseISO(t.endDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-dark-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin size={11} className="text-dark-400" /> {t.location.city}</span>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-dark-100">
                  <div className="text-center"><p className="text-lg font-extrabold text-dark-900">{t.divisions.length}</p><p className="text-[10px] text-dark-400 uppercase tracking-wider">Divisions</p></div>
                  <div className="w-px h-8 bg-dark-100" />
                  <div className="text-center"><p className="text-lg font-extrabold text-court-600">{t.teams.length}</p><p className="text-[10px] text-dark-400 uppercase tracking-wider">Teams</p></div>
                  <div className="w-px h-8 bg-dark-100" />
                  <div className="text-center"><p className="text-lg font-extrabold text-dark-600">{matchesPlayed}/{t.matches.length}</p><p className="text-[10px] text-dark-400 uppercase tracking-wider">Matches</p></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (!selected) return null;

  // ─── DETAIL VIEW ────────────────────────────────────────
  const t = selected;
  const sc = tournamentStatusConfig[t.status];
  const matchesPlayed = t.matches.filter(m => m.matchStatus === 'final').length;
  const complianceRate = t.compliance.totalTeams > 0 ? Math.round(((t.compliance.compliant + t.compliance.exempt) / t.compliance.totalTeams) * 100) : 0;

  const detailTabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Eye size={14} /> },
    { key: 'teams', label: 'Teams', icon: <Users size={14} /> },
    { key: 'housing', label: 'Housing', icon: <Hotel size={14} /> },
    { key: 'brackets', label: 'Brackets', icon: <Trophy size={14} /> },
    { key: 'compliance', label: 'Compliance', icon: <Shield size={14} /> },
    { key: 'reporting', label: 'Reporting', icon: <BarChart3 size={14} /> },
  ];

  const filteredTeams = divisionFilter === 'all' ? t.teams : t.teams.filter(tm => tm.divisionId === divisionFilter);
  const filteredMatches = divisionFilter === 'all' ? t.matches : t.matches.filter(m => m.divisionId === divisionFilter);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-700">
          <ArrowLeft size={16} /> Tournaments
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
        <div className="p-6 border-b border-dark-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-court-500 to-court-600 flex items-center justify-center shrink-0">
                <Trophy size={28} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-extrabold text-dark-900">{t.name}</h2>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-dark-500">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {format(parseISO(t.startDate), 'MMM d')} — {format(parseISO(t.endDate), 'MMM d, yyyy')}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {t.location.venue}, {t.location.city}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-1.5"><Pencil size={13} /> Edit</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-0.5 overflow-x-auto scrollbar-hide border-b border-dark-100">
          {detailTabs.map(tab => (
            <button key={tab.key} onClick={() => setDetailTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors rounded-t-lg ${
                detailTab === tab.key ? 'text-court-600' : 'text-dark-400 hover:text-dark-700'}`}>
              {tab.icon} {tab.label}
              {detailTab === tab.key && (
                <motion.div layoutId="tournament-tab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-court-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={detailTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

            {/* ─── OVERVIEW TAB ─────────────────── */}
            {detailTab === 'overview' && (
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-dark-100">
                  <StatCard icon={<Users size={16} />} label="Teams Registered" value={`${t.teams.filter(tm => tm.registrationStatus === 'confirmed').length}`} accent="court" />
                  <StatCard icon={<Trophy size={16} />} label="Matches Played" value={`${matchesPlayed} / ${t.matches.length}`} accent="court" />
                  <StatCard icon={<Layers size={16} />} label="Divisions" value={`${t.divisions.length}`} accent="court" />
                  <StatCard icon={<Shield size={16} />} label="Compliance Rate" value={`${complianceRate}%`} accent={complianceRate >= 80 ? 'green' : complianceRate >= 50 ? 'yellow' : 'red'} />
                </div>

                {/* Divisions */}
                <div className="p-6 border-b border-dark-100">
                  <h3 className="text-sm font-bold text-dark-800 mb-3">Divisions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {t.divisions.map(div => {
                      const pct = Math.round((div.registeredCount / div.teamLimit) * 100);
                      return (
                        <div key={div.id} className="bg-dark-50/40 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-bold text-dark-800">{div.name}</h4>
                            <span className="px-1.5 py-0.5 bg-court-50 text-court-600 rounded text-[9px] font-bold">{div.ageGroup}</span>
                            <span className="px-1.5 py-0.5 bg-dark-100 text-dark-500 rounded text-[9px] font-bold capitalize">{div.gender}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-dark-400 mb-1">
                            <span>Teams</span>
                            <span className="font-bold text-dark-600">{div.registeredCount} / {div.teamLimit}</span>
                          </div>
                          <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                            <div className="h-full bg-court-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upcoming matches */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-dark-800 mb-3">Upcoming Matches</h3>
                  <div className="space-y-2">
                    {t.matches.filter(m => m.matchStatus === 'scheduled').slice(0, 5).map(m => (
                      <MatchCard key={m.id} match={m} tournament={t} />
                    ))}
                    {t.matches.filter(m => m.matchStatus === 'scheduled').length === 0 && (
                      <p className="text-sm text-dark-400 text-center py-6">All matches have been played</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TEAMS TAB ───────────────────── */}
            {detailTab === 'teams' && (
              <div>
                <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setDivisionFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${divisionFilter === 'all' ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>All ({t.teams.length})</button>
                    {t.divisions.map(div => (
                      <button key={div.id} onClick={() => setDivisionFilter(div.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${divisionFilter === div.id ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>{div.name}</button>
                    ))}
                  </div>
                  <button onClick={() => setShowInvite(true)} className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><UserPlus size={13} /> Invite Team</button>
                </div>
                <div className="p-6">
                  <div className="border border-dark-100 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead><tr className="bg-dark-50/60">
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Team</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Division</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Players</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Registration</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Housing</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Local</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
                      </tr></thead>
                      <tbody className="divide-y divide-dark-100">
                        {filteredTeams.map(tm => {
                          const name = getTournamentTeamName(tm);
                          const color = getTeamColor(tm);
                          const div = t.divisions.find(d => d.id === tm.divisionId);
                          const rs = teamRegStatusConfig[tm.registrationStatus];
                          const hs = housingStatusConfig[tm.housingStatus];
                          return (
                            <tr key={tm.id} className="hover:bg-dark-50/30">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
                                    {name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-dark-800">{name}</p>
                                    <p className="text-[10px] text-dark-400">{tm.contactEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-dark-600">{div?.name || '—'}</td>
                              <td className="px-4 py-3 text-xs font-semibold text-dark-700">{tm.playerCount}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rs.bg} ${rs.text}`}>{rs.label}</span></td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${hs.bg} ${hs.text}`}>{hs.label}</span></td>
                              <td className="px-4 py-3">
                                {tm.isLocal
                                  ? <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-600">Local</span>
                                  : <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-600">Non-Local</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {tm.registrationStatus === 'pending' && <>
                                    <button className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-bold hover:bg-green-100">Approve</button>
                                    <button className="px-2 py-0.5 rounded bg-red-50 text-red-500 text-[10px] font-bold hover:bg-red-100">Reject</button>
                                  </>}
                                  <button className="p-1 rounded hover:bg-dark-50 text-dark-400"><Eye size={12} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── HOUSING TAB ─────────────────── */}
            {detailTab === 'housing' && (
              <div>
                {/* Hotels */}
                <div className="p-6 border-b border-dark-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-dark-800">Partner Hotels</h3>
                    <button onClick={() => setShowAddHotel(true)} className="h-7 px-3 rounded-lg bg-court-500 text-white text-[11px] font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={12} /> Add Hotel</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {t.hotels.map(hotel => {
                      const pct = Math.round((hotel.roomsBooked / hotel.roomsTotal) * 100);
                      const distColor = hotel.distanceKm < 2 ? 'bg-green-50 text-green-600' : hotel.distanceKm < 5 ? 'bg-yellow-50 text-yellow-600' : 'bg-orange-50 text-orange-600';
                      return (
                        <div key={hotel.id} className="bg-white border border-dark-100 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-dark-800">{hotel.name}</h4>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${distColor}`}>{hotel.distance}</span>
                          </div>
                          <p className="text-lg font-extrabold text-court-600 mb-2">{hotel.rate}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {hotel.amenities.map(a => (
                              <span key={a} className="px-1.5 py-0.5 bg-dark-50 text-dark-500 rounded text-[9px] font-medium">{a}</span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-dark-400 mb-1">
                            <span>Rooms</span>
                            <span className="font-bold text-dark-600">{hotel.roomsBooked} / {hotel.roomsTotal}</span>
                          </div>
                          <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-court-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-dark-400">Deadline: {format(parseISO(hotel.bookingDeadline), 'MMM d, yyyy')}</p>
                            <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] font-semibold text-court-600 hover:underline"><ExternalLink size={10} /> Book Now</a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Local radius */}
                <div className="px-6 py-4 border-b border-dark-100 bg-dark-50/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-dark-700">Local Radius Threshold</p>
                      <p className="text-[10px] text-dark-400">Teams within this radius are exempt from housing requirements</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" defaultValue={t.localRadius} className="w-16 h-8 px-2 rounded-lg border border-dark-200 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                      <span className="text-xs text-dark-500 font-semibold">km</span>
                    </div>
                  </div>
                </div>

                {/* Compliance summary */}
                <div className="grid grid-cols-4 gap-3 p-6 border-b border-dark-100">
                  <div className="p-3 bg-dark-50/40 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-dark-900">{t.compliance.totalTeams}</p>
                    <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Total</p>
                  </div>
                  <div className="p-3 bg-green-50/60 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-green-600">{t.compliance.compliant}</p>
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Compliant</p>
                  </div>
                  <div className="p-3 bg-yellow-50/60 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-yellow-600">{t.compliance.pending}</p>
                    <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-wider">Pending</p>
                  </div>
                  <div className="p-3 bg-red-50/60 rounded-xl text-center">
                    <p className="text-2xl font-extrabold text-red-600">{t.compliance.nonCompliant}</p>
                    <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Non-Compliant</p>
                  </div>
                </div>

                {/* Housing status table */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-dark-800 mb-3">Team Housing Status</h3>
                  <div className="border border-dark-100 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead><tr className="bg-dark-50/60">
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Team</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Type</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Hotel</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
                      </tr></thead>
                      <tbody className="divide-y divide-dark-100">
                        {t.teams.filter(tm => !tm.isLocal).map(tm => {
                          const name = getTournamentTeamName(tm);
                          const hs = housingStatusConfig[tm.housingStatus];
                          const hotel = t.hotels.find(h => h.id === tm.hotelId);
                          return (
                            <tr key={tm.id} className="hover:bg-dark-50/30">
                              <td className="px-4 py-3 text-sm font-medium text-dark-800">{name}</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-600">Non-Local</span></td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${hs.bg} ${hs.text}`}>{hs.label}</span></td>
                              <td className="px-4 py-3 text-xs text-dark-600">{hotel?.name || '—'}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {tm.housingStatus === 'pending' && <button className="px-2 py-0.5 rounded bg-court-50 text-court-600 text-[10px] font-bold hover:bg-court-100 flex items-center gap-1"><Bell size={9} /> Remind</button>}
                                  {tm.housingStatus === 'non_compliant' && <button className="px-2 py-0.5 rounded bg-red-50 text-red-500 text-[10px] font-bold hover:bg-red-100 flex items-center gap-1"><Flag size={9} /> Flag</button>}
                                  {(tm.housingStatus === 'pending' || tm.housingStatus === 'non_compliant') && <button className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-bold hover:bg-green-100">Mark Compliant</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── BRACKETS TAB ────────────────── */}
            {detailTab === 'brackets' && (
              <div>
                {/* Division selector */}
                <div className="px-6 py-4 border-b border-dark-100">
                  <div className="flex items-center gap-1.5">
                    {t.divisions.map((div, i) => (
                      <button key={div.id} onClick={() => setDivisionFilter(div.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          (divisionFilter === div.id || (divisionFilter === 'all' && i === 0))
                            ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>{div.name}</button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const activeDivId = divisionFilter === 'all' ? t.divisions[0]?.id : divisionFilter;
                  const bracket = t.brackets.find(b => b.divisionId === activeDivId);
                  const divMatches = t.matches.filter(m => m.divisionId === activeDivId);
                  if (!bracket) return <div className="p-6 text-center text-sm text-dark-400">No bracket data for this division</div>;

                  return (
                    <div>
                      {/* Format badge */}
                      <div className="px-6 pt-4 pb-2">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-[11px] font-bold">
                          {bracket.format === 'round_robin' ? 'Round Robin' : bracket.format === 'knockout' ? 'Knockout' : 'Group + Playoffs'}
                        </span>
                      </div>

                      {/* Group standings */}
                      {bracket.groups && bracket.groups.map(group => (
                        <div key={group.name} className="px-6 py-4 border-b border-dark-100">
                          <h4 className="text-xs font-bold text-dark-700 mb-2">{group.name} Standings</h4>
                          <div className="border border-dark-100 rounded-xl overflow-hidden">
                            <table className="w-full">
                              <thead><tr className="bg-dark-50/60">
                                <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400 w-8">#</th>
                                <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">Team</th>
                                <th className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">P</th>
                                <th className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">W</th>
                                <th className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">D</th>
                                <th className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">L</th>
                                <th className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">GF</th>
                                <th className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">GA</th>
                                <th className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">GD</th>
                                <th className="text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-dark-400">Pts</th>
                              </tr></thead>
                              <tbody className="divide-y divide-dark-100">
                                {group.standings.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference).map((s, i) => (
                                  <tr key={s.teamId} className={`hover:bg-dark-50/30 ${i < 2 && bracket.format === 'group_playoffs' ? 'border-l-2 border-l-court-400' : ''}`}>
                                    <td className="px-3 py-2.5 text-xs text-dark-400 font-bold">{i + 1}</td>
                                    <td className="px-3 py-2.5 text-xs font-semibold text-dark-800">{s.teamName}</td>
                                    <td className="text-center px-2 py-2.5 text-xs text-dark-600">{s.played}</td>
                                    <td className="text-center px-2 py-2.5 text-xs font-bold text-green-600">{s.won}</td>
                                    <td className="text-center px-2 py-2.5 text-xs text-dark-500">{s.drawn}</td>
                                    <td className="text-center px-2 py-2.5 text-xs text-red-500">{s.lost}</td>
                                    <td className="text-center px-2 py-2.5 text-xs text-dark-600">{s.goalsFor}</td>
                                    <td className="text-center px-2 py-2.5 text-xs text-dark-600">{s.goalsAgainst}</td>
                                    <td className="text-center px-2 py-2.5 text-xs font-bold text-dark-700">{s.goalDifference > 0 ? '+' : ''}{s.goalDifference}</td>
                                    <td className="text-center px-2 py-2.5 text-sm font-extrabold text-dark-900">{s.points}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}

                      {/* Match list */}
                      <div className="p-6">
                        <h4 className="text-xs font-bold text-dark-700 mb-3">Matches ({divMatches.length})</h4>
                        <div className="space-y-2">
                          {divMatches.sort((a, b) => a.dateTime.localeCompare(b.dateTime)).map(m => (
                            <MatchCard key={m.id} match={m} tournament={t} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ─── COMPLIANCE TAB ──────────────── */}
            {detailTab === 'compliance' && (
              <div>
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-dark-100">
                  <div className="p-4 bg-white border border-dark-100 rounded-xl text-center">
                    <p className="text-3xl font-extrabold text-court-600">{complianceRate}%</p>
                    <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider mt-1">Compliance Rate</p>
                    <div className="h-2 bg-dark-100 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-court-400 rounded-full" style={{ width: `${complianceRate}%` }} />
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-dark-100 rounded-xl text-center">
                    <p className="text-3xl font-extrabold text-dark-900">{t.revenue.totalRoomNights}</p>
                    <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider mt-1">Room Nights Booked</p>
                  </div>
                  <div className="p-4 bg-white border border-red-100 rounded-xl text-center">
                    <p className="text-3xl font-extrabold text-red-600">{t.compliance.nonCompliant}</p>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">Non-Compliant</p>
                  </div>
                </div>

                {/* Visual bar */}
                <div className="px-6 py-4 border-b border-dark-100">
                  <div className="h-4 rounded-full overflow-hidden flex">
                    <div className="bg-green-400 h-full" style={{ width: `${(t.compliance.compliant / t.compliance.totalTeams) * 100}%` }} />
                    <div className="bg-blue-400 h-full" style={{ width: `${(t.compliance.exempt / t.compliance.totalTeams) * 100}%` }} />
                    <div className="bg-yellow-400 h-full" style={{ width: `${(t.compliance.pending / t.compliance.totalTeams) * 100}%` }} />
                    <div className="bg-red-400 h-full" style={{ width: `${(t.compliance.nonCompliant / t.compliance.totalTeams) * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 justify-center">
                    {[
                      { label: `Compliant (${t.compliance.compliant})`, color: 'bg-green-400' },
                      { label: `Exempt (${t.compliance.exempt})`, color: 'bg-blue-400' },
                      { label: `Pending (${t.compliance.pending})`, color: 'bg-yellow-400' },
                      { label: `Non-Compliant (${t.compliance.nonCompliant})`, color: 'bg-red-400' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                        <span className="text-[10px] text-dark-500 font-medium">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance table */}
                <div className="p-6">
                  <h3 className="text-sm font-bold text-dark-800 mb-3">Team Compliance Details</h3>
                  <div className="border border-dark-100 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead><tr className="bg-dark-50/60">
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Team</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Division</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Housing</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Hotel</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Reminders</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
                      </tr></thead>
                      <tbody className="divide-y divide-dark-100">
                        {t.teams.map(tm => {
                          const hs = housingStatusConfig[tm.housingStatus];
                          const hotel = t.hotels.find(h => h.id === tm.hotelId);
                          const div = t.divisions.find(d => d.id === tm.divisionId);
                          return (
                            <tr key={tm.id} className="hover:bg-dark-50/30">
                              <td className="px-4 py-3 text-sm font-medium text-dark-800">{getTournamentTeamName(tm)}</td>
                              <td className="px-4 py-3 text-xs text-dark-600">{div?.name || '—'}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${hs.bg} ${hs.text}`}>{hs.label}</span></td>
                              <td className="px-4 py-3 text-xs text-dark-600">{hotel?.name || (tm.isLocal ? '—' : 'Not booked')}</td>
                              <td className="px-4 py-3 text-xs text-dark-500">{tm.remindersSent > 0 ? `${tm.remindersSent} sent` : '—'}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1">
                                  {!tm.isLocal && tm.housingStatus !== 'compliant' && (
                                    <button className="px-2 py-0.5 rounded bg-court-50 text-court-600 text-[10px] font-bold hover:bg-court-100 flex items-center gap-1"><Send size={9} /> Remind</button>
                                  )}
                                  {tm.housingStatus === 'non_compliant' && (
                                    <button className="px-2 py-0.5 rounded bg-red-50 text-red-500 text-[10px] font-bold hover:bg-red-100 flex items-center gap-1"><Flag size={9} /> Flag</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── REPORTING TAB ───────────────── */}
            {detailTab === 'reporting' && (
              <div>
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-dark-100">
                  <StatCard icon={<Calendar size={16} />} label="Total Room Nights" value={`${t.revenue.totalRoomNights}`} accent="court" />
                  <StatCard icon={<DollarSign size={16} />} label="Total Value" value={`$${t.revenue.totalValue.toLocaleString()}`} accent="court" />
                  <StatCard icon={<TrendingUp size={16} />} label={`Commission (${t.revenue.commissionRate}%)`} value={`$${t.revenue.commissionEarned.toLocaleString()}`} accent="green" />
                </div>

                {/* Revenue split */}
                <div className="p-6 border-b border-dark-100">
                  <h3 className="text-sm font-bold text-dark-800 mb-4">Revenue Split</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-court-50/40 border border-court-100 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-court-700">Courtside</p>
                        <span className="text-[10px] font-bold text-court-600">{t.revenue.courtsideSplit}%</span>
                      </div>
                      <p className="text-2xl font-extrabold text-court-600">${t.revenue.courtsideAmount.toLocaleString()}</p>
                      <div className="h-2 bg-court-100 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-court-500 rounded-full" style={{ width: `${t.revenue.courtsideSplit}%` }} />
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-purple-700">Tournament</p>
                        <span className="text-[10px] font-bold text-purple-600">{t.revenue.tournamentSplit}%</span>
                      </div>
                      <p className="text-2xl font-extrabold text-purple-600">${t.revenue.tournamentAmount.toLocaleString()}</p>
                      <div className="h-2 bg-purple-100 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${t.revenue.tournamentSplit}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Division breakdown */}
                <div className="p-6 border-b border-dark-100">
                  <h3 className="text-sm font-bold text-dark-800 mb-3">Division Breakdown</h3>
                  <div className="border border-dark-100 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead><tr className="bg-dark-50/60">
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Division</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Non-Local Teams</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Avg Room Nights</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Est. Revenue</th>
                      </tr></thead>
                      <tbody className="divide-y divide-dark-100">
                        {t.divisions.map(div => {
                          const divTeams = t.teams.filter(tm => tm.divisionId === div.id && !tm.isLocal);
                          return (
                            <tr key={div.id} className="hover:bg-dark-50/30">
                              <td className="px-4 py-3 text-sm font-semibold text-dark-800">{div.name}</td>
                              <td className="px-4 py-3 text-xs text-dark-600">{divTeams.length}</td>
                              <td className="px-4 py-3 text-xs text-dark-600">{divTeams.length > 0 ? Math.round(t.revenue.totalRoomNights / t.teams.filter(tm => !tm.isLocal).length) : 0}</td>
                              <td className="px-4 py-3 text-xs font-bold text-court-600">${divTeams.length > 0 ? Math.round(t.revenue.totalValue * divTeams.length / t.teams.filter(tm => !tm.isLocal).length).toLocaleString() : 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Compliance impact note */}
                <div className="p-6">
                  <div className="bg-yellow-50/60 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">Compliance Impact</p>
                      <p className="text-xs text-yellow-700 mt-0.5">
                        {t.compliance.nonCompliant} team{t.compliance.nonCompliant !== 1 ? 's are' : ' is'} currently non-compliant. If all teams booked through official hotels, estimated additional revenue would be approximately <strong>${Math.round(t.revenue.totalValue * 0.08).toLocaleString()}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Modals ─────────────────────────────────── */}
      <AnimatePresence>
        {showInvite && <InviteTeamModal tournament={t} onClose={() => setShowInvite(false)} />}
        {showAddHotel && <AddHotelModal onClose={() => setShowAddHotel(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Match Card ────────────────────────────────────────────
function MatchCard({ match: m, tournament: t }: { match: TournamentMatch; tournament: Tournament }) {
  const home = getMatchTeamName(m.homeTeamId, t);
  const away = getMatchTeamName(m.awayTeamId, t);
  const ms = matchStatusConfig[m.matchStatus];
  const isFinal = m.matchStatus === 'final';
  return (
    <div className="flex items-center gap-4 p-3.5 bg-white border border-dark-100 rounded-xl hover:shadow-sm transition-shadow">
      <div className="flex-1 text-right min-w-0">
        <p className={`text-sm truncate ${isFinal && m.winnerId === m.homeTeamId ? 'font-bold text-dark-900' : 'font-medium text-dark-600'}`}>{home}</p>
      </div>
      <div className="text-center shrink-0 w-20">
        {isFinal && m.scoreDisplay ? (
          <p className="text-lg font-extrabold text-dark-900 tabular-nums">{m.scoreDisplay}</p>
        ) : (
          <p className="text-xs font-bold text-dark-400">vs</p>
        )}
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ms.bg} ${ms.text}`}>{ms.label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isFinal && m.winnerId === m.awayTeamId ? 'font-bold text-dark-900' : 'font-medium text-dark-600'}`}>{away}</p>
      </div>
      <div className="text-right shrink-0 ml-2">
        <p className="text-[10px] text-dark-400">{m.venueName}</p>
        <p className="text-[10px] text-dark-500 font-medium">{format(parseISO(m.dateTime), 'MMM d, HH:mm')}</p>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  const colorMap: Record<string, { iconBg: string; iconText: string }> = {
    court:  { iconBg: 'bg-court-500/10', iconText: 'text-court-600' },
    green:  { iconBg: 'bg-green-50',     iconText: 'text-green-600' },
    yellow: { iconBg: 'bg-yellow-50',    iconText: 'text-yellow-600' },
    red:    { iconBg: 'bg-red-50',       iconText: 'text-red-600' },
  };
  const c = colorMap[accent] || colorMap.court;
  return (
    <div className="flex items-center gap-3 p-3 bg-dark-50/40 rounded-xl">
      <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconText}`}>{icon}</div>
      <div>
        <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">{label}</p>
        <p className="text-lg font-extrabold text-dark-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Invite Team Modal ─────────────────────────────────────
function InviteTeamModal({ tournament, onClose }: { tournament: Tournament; onClose: () => void }) {
  const [teamName, setTeamName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [division, setDivision] = useState(tournament.divisions[0]?.id || '');
  const [players, setPlayers] = useState('');
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h3 className="text-lg font-bold text-dark-900">Invite Team</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Team Name *</label>
            <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Manchester Storm Youth"
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Contact Name *</label>
              <input value={contact} onChange={e => setContact(e.target.value)} placeholder="Coach name"
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@team.com"
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Division *</label>
              <select value={division} onChange={e => setDivision(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
                {tournament.divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Players</label>
              <input type="number" value={players} onChange={e => setPlayers(e.target.value)} placeholder="e.g. 18"
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-dark-100 flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50">Cancel</button>
          <button className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm"><Send size={14} /> Send Invite</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add Hotel Modal ───────────────────────────────────────
function AddHotelModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [distance, setDistance] = useState('');
  const [rate, setRate] = useState('');
  const [amenities, setAmenities] = useState('');
  const [rooms, setRooms] = useState('');
  const [deadline, setDeadline] = useState('');
  const [link, setLink] = useState('');
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h3 className="text-lg font-bold text-dark-900">Add Partner Hotel</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Hotel Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Courtside Grand Hotel"
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Distance (km) *</label>
              <input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} placeholder="e.g. 1.5"
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Nightly Rate *</label>
              <input value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. $130/night"
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Amenities</label>
            <input value={amenities} onChange={e => setAmenities(e.target.value)} placeholder="Pool, Gym, Wi-Fi (comma separated)"
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Total Rooms</label>
              <input type="number" value={rooms} onChange={e => setRooms(e.target.value)} placeholder="e.g. 50"
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Booking Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Booking Link (with group code)</label>
            <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://hotel.com/book?group=CODE"
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-dark-100 flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50">Cancel</button>
          <button className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm"><Plus size={14} /> Add Hotel</button>
        </div>
      </motion.div>
    </div>
  );
}
