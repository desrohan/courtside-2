import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Save, X, BarChart3, ChevronDown, Users, User, Shield, Swords, Target, Footprints, Eye } from 'lucide-react';
import { CalendarEvent } from '@/data/events';

interface Props {
  event: CalendarEvent;
}

type StatsView = 'team' | 'individual';

// ══════════════════════════════════════════════════════
// STAT GROUP & FIELD DEFINITIONS
// ══════════════════════════════════════════════════════

interface StatField {
  key: string;
  label: string;
  short: string;
}

interface StatGroup {
  key: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  fields: StatField[];
}

const teamStatGroups: StatGroup[] = [
  {
    key: 'attack', label: 'Attack', color: '#FF5630', icon: <Swords size={14} />,
    fields: [
      { key: 'goals', label: 'Goals', short: 'G' },
      { key: 'shots', label: 'Shots', short: 'SH' },
      { key: 'shots_on_target', label: 'Shots on Target', short: 'SOT' },
      { key: 'corners', label: 'Corners', short: 'CRN' },
      { key: 'offsides', label: 'Offsides', short: 'OFF' },
    ],
  },
  {
    key: 'passing', label: 'Passing', color: '#00A76F', icon: <Footprints size={14} />,
    fields: [
      { key: 'passes', label: 'Passes', short: 'PAS' },
      { key: 'pass_accuracy', label: 'Pass Accuracy %', short: 'PA%' },
      { key: 'crosses', label: 'Crosses', short: 'CRS' },
      { key: 'long_balls', label: 'Long Balls', short: 'LB' },
    ],
  },
  {
    key: 'defence', label: 'Defence', color: '#8E33FF', icon: <Shield size={14} />,
    fields: [
      { key: 'tackles', label: 'Tackles', short: 'TKL' },
      { key: 'blocks', label: 'Blocks', short: 'BLK' },
      { key: 'interceptions', label: 'Interceptions', short: 'INT' },
      { key: 'clearances', label: 'Clearances', short: 'CLR' },
    ],
  },
  {
    key: 'discipline', label: 'Discipline', color: '#FFAB00', icon: <Eye size={14} />,
    fields: [
      { key: 'fouls', label: 'Fouls', short: 'FLS' },
      { key: 'yellow_cards', label: 'Yellow Cards', short: 'YC' },
      { key: 'red_cards', label: 'Red Cards', short: 'RC' },
    ],
  },
  {
    key: 'general', label: 'General', color: '#00B8D9', icon: <BarChart3 size={14} />,
    fields: [
      { key: 'possession', label: 'Possession %', short: 'POS' },
      { key: 'duels_won', label: 'Duels Won', short: 'DW' },
      { key: 'aerial_won', label: 'Aerials Won', short: 'AW' },
    ],
  },
];

const playerStatGroups: StatGroup[] = [
  {
    key: 'attack', label: 'Attack', color: '#FF5630', icon: <Swords size={14} />,
    fields: [
      { key: 'goals', label: 'Goals', short: 'G' },
      { key: 'assists', label: 'Assists', short: 'A' },
      { key: 'shots', label: 'Shots', short: 'SH' },
      { key: 'shots_on_target', label: 'Shots on Target', short: 'SOT' },
      { key: 'chances_created', label: 'Chances Created', short: 'CC' },
      { key: 'dribbles', label: 'Successful Dribbles', short: 'DRB' },
    ],
  },
  {
    key: 'passing', label: 'Passing', color: '#00A76F', icon: <Footprints size={14} />,
    fields: [
      { key: 'passes', label: 'Passes', short: 'PAS' },
      { key: 'pass_accuracy', label: 'Pass Accuracy %', short: 'PA%' },
      { key: 'key_passes', label: 'Key Passes', short: 'KP' },
      { key: 'crosses', label: 'Crosses', short: 'CRS' },
      { key: 'long_balls', label: 'Long Balls', short: 'LB' },
    ],
  },
  {
    key: 'defence', label: 'Defence', color: '#8E33FF', icon: <Shield size={14} />,
    fields: [
      { key: 'tackles', label: 'Tackles', short: 'TKL' },
      { key: 'tackles_won', label: 'Tackles Won', short: 'TW' },
      { key: 'blocks', label: 'Blocks', short: 'BLK' },
      { key: 'interceptions', label: 'Interceptions', short: 'INT' },
      { key: 'clearances', label: 'Clearances', short: 'CLR' },
      { key: 'headed_clearances', label: 'Headed Clearances', short: 'HC' },
    ],
  },
  {
    key: 'discipline', label: 'Discipline & General', color: '#FFAB00', icon: <Eye size={14} />,
    fields: [
      { key: 'minutes_played', label: 'Minutes Played', short: 'MIN' },
      { key: 'fouls', label: 'Fouls Committed', short: 'FLS' },
      { key: 'fouls_won', label: 'Fouls Won', short: 'FW' },
      { key: 'yellow_cards', label: 'Yellow Cards', short: 'YC' },
      { key: 'red_cards', label: 'Red Cards', short: 'RC' },
      { key: 'duels_won', label: 'Duels Won', short: 'DW' },
      { key: 'aerial_won', label: 'Aerials Won', short: 'AW' },
    ],
  },
];

// ── Dummy team stats ──────────────────────────────────
const defaultTeamStats: Record<string, number> = {
  goals: 2, shots: 14, shots_on_target: 6, corners: 7, offsides: 2,
  passes: 487, pass_accuracy: 86, crosses: 18, long_balls: 32,
  tackles: 22, blocks: 4, interceptions: 11, clearances: 18,
  fouls: 12, yellow_cards: 2, red_cards: 0,
  possession: 58, duels_won: 54, aerial_won: 12,
};

// ── Dummy player stats ────────────────────────────────
interface PlayerStats {
  userId: string; name: string; avatar: string; jerseyNumber: number; position: string;
  stats: Record<string, number>;
}

const defaultPlayerStats: PlayerStats[] = [
  { userId: 'p-011', name: 'Gabriel Torres', avatar: 'GT', jerseyNumber: 9, position: 'ST', stats: { goals: 2, assists: 0, shots: 6, shots_on_target: 4, chances_created: 1, dribbles: 3, passes: 22, pass_accuracy: 73, key_passes: 1, crosses: 0, long_balls: 1, tackles: 0, tackles_won: 0, blocks: 0, interceptions: 0, clearances: 0, headed_clearances: 0, minutes_played: 90, fouls: 3, fouls_won: 4, yellow_cards: 1, red_cards: 0, duels_won: 8, aerial_won: 3 } },
  { userId: 'p-008', name: 'Noah Clarke', avatar: 'NC', jerseyNumber: 10, position: 'AM', stats: { goals: 1, assists: 1, shots: 4, shots_on_target: 3, chances_created: 4, dribbles: 5, passes: 53, pass_accuracy: 86, key_passes: 4, crosses: 2, long_balls: 3, tackles: 1, tackles_won: 1, blocks: 0, interceptions: 0, clearances: 0, headed_clearances: 0, minutes_played: 85, fouls: 0, fouls_won: 2, yellow_cards: 0, red_cards: 0, duels_won: 6, aerial_won: 1 } },
  { userId: 'p-006', name: 'Jack Brennan', avatar: 'JB', jerseyNumber: 8, position: 'CM', stats: { goals: 0, assists: 1, shots: 3, shots_on_target: 1, chances_created: 2, dribbles: 2, passes: 72, pass_accuracy: 89, key_passes: 3, crosses: 1, long_balls: 5, tackles: 3, tackles_won: 2, blocks: 1, interceptions: 1, clearances: 2, headed_clearances: 0, minutes_played: 90, fouls: 2, fouls_won: 1, yellow_cards: 0, red_cards: 0, duels_won: 9, aerial_won: 2 } },
  { userId: 'p-007', name: 'Leo Fernandez', avatar: 'LF', jerseyNumber: 6, position: 'DM', stats: { goals: 0, assists: 0, shots: 1, shots_on_target: 0, chances_created: 1, dribbles: 1, passes: 81, pass_accuracy: 93, key_passes: 2, crosses: 0, long_balls: 8, tackles: 6, tackles_won: 5, blocks: 1, interceptions: 4, clearances: 3, headed_clearances: 1, minutes_played: 90, fouls: 1, fouls_won: 0, yellow_cards: 0, red_cards: 0, duels_won: 11, aerial_won: 2 } },
  { userId: 'p-002', name: 'Marcus Williams', avatar: 'MW', jerseyNumber: 4, position: 'CB', stats: { goals: 0, assists: 0, shots: 1, shots_on_target: 0, chances_created: 0, dribbles: 0, passes: 64, pass_accuracy: 91, key_passes: 0, crosses: 0, long_balls: 6, tackles: 5, tackles_won: 4, blocks: 2, interceptions: 3, clearances: 8, headed_clearances: 5, minutes_played: 90, fouls: 1, fouls_won: 0, yellow_cards: 0, red_cards: 0, duels_won: 10, aerial_won: 7 } },
  { userId: 'p-003', name: 'Kai Tanaka', avatar: 'KT', jerseyNumber: 5, position: 'CB', stats: { goals: 0, assists: 0, shots: 0, shots_on_target: 0, chances_created: 0, dribbles: 0, passes: 58, pass_accuracy: 88, key_passes: 0, crosses: 0, long_balls: 4, tackles: 4, tackles_won: 3, blocks: 1, interceptions: 2, clearances: 6, headed_clearances: 4, minutes_played: 90, fouls: 2, fouls_won: 1, yellow_cards: 1, red_cards: 0, duels_won: 7, aerial_won: 5 } },
  { userId: 'p-004', name: 'Omar Hassan', avatar: 'OH', jerseyNumber: 3, position: 'LB', stats: { goals: 0, assists: 1, shots: 0, shots_on_target: 0, chances_created: 2, dribbles: 2, passes: 45, pass_accuracy: 82, key_passes: 2, crosses: 5, long_balls: 2, tackles: 3, tackles_won: 2, blocks: 0, interceptions: 1, clearances: 2, headed_clearances: 0, minutes_played: 90, fouls: 0, fouls_won: 1, yellow_cards: 0, red_cards: 0, duels_won: 5, aerial_won: 1 } },
  { userId: 'p-005', name: 'Andre Silva', avatar: 'AS', jerseyNumber: 2, position: 'RB', stats: { goals: 0, assists: 0, shots: 1, shots_on_target: 1, chances_created: 1, dribbles: 1, passes: 41, pass_accuracy: 85, key_passes: 1, crosses: 4, long_balls: 3, tackles: 2, tackles_won: 2, blocks: 0, interceptions: 2, clearances: 3, headed_clearances: 1, minutes_played: 78, fouls: 1, fouls_won: 0, yellow_cards: 0, red_cards: 0, duels_won: 4, aerial_won: 2 } },
  { userId: 'p-010', name: 'Lucas Dubois', avatar: 'LD', jerseyNumber: 11, position: 'LW', stats: { goals: 0, assists: 0, shots: 2, shots_on_target: 1, chances_created: 2, dribbles: 4, passes: 34, pass_accuracy: 79, key_passes: 2, crosses: 3, long_balls: 0, tackles: 1, tackles_won: 1, blocks: 0, interceptions: 0, clearances: 0, headed_clearances: 0, minutes_played: 72, fouls: 1, fouls_won: 3, yellow_cards: 0, red_cards: 0, duels_won: 6, aerial_won: 0 } },
  { userId: 'p-001', name: 'Liam Henderson', avatar: 'LH', jerseyNumber: 1, position: 'GK', stats: { goals: 0, assists: 0, shots: 0, shots_on_target: 0, chances_created: 0, dribbles: 0, passes: 32, pass_accuracy: 78, key_passes: 0, crosses: 0, long_balls: 12, tackles: 0, tackles_won: 0, blocks: 0, interceptions: 0, clearances: 4, headed_clearances: 0, minutes_played: 90, fouls: 0, fouls_won: 0, yellow_cards: 0, red_cards: 0, duels_won: 2, aerial_won: 3 } },
];

// ══════════════════════════════════════════════════════
// EDIT MODALS
// ══════════════════════════════════════════════════════

function EditTeamStatsModal({ stats, onClose, onSave }: {
  stats: Record<string, number>; onClose: () => void; onSave: (s: Record<string, number>) => void;
}) {
  const [form, setForm] = useState({ ...stats });
  const set = (k: string, v: number) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-sm font-bold text-dark-900">Edit Team Statistics</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {teamStatGroups.map(group => (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="text-xs font-bold" style={{ color: group.color }}>{group.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.fields.map(f => (
                  <div key={f.key} className="flex items-center gap-2">
                    <label className="text-[11px] text-dark-600 w-28 truncate">{f.label}</label>
                    <input type="number" min={0} value={form[f.key] ?? 0} onChange={e => set(f.key, parseInt(e.target.value) || 0)}
                      className="flex-1 h-7 px-2 rounded-lg border border-dark-200 text-xs font-medium text-dark-800 focus:outline-none focus:ring-1 focus:ring-court-500/30" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={() => onSave(form)} className="h-8 px-4 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Save size={13} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}

function EditPlayerStatsModal({ player, onClose, onSave }: {
  player: PlayerStats; onClose: () => void; onSave: (p: PlayerStats) => void;
}) {
  const [form, setForm] = useState({ ...player, stats: { ...player.stats } });
  const set = (k: string, v: number) => setForm(p => ({ ...p, stats: { ...p.stats, [k]: v } }));
  const [expandedGroup, setExpandedGroup] = useState<string>(playerStatGroups[0].key);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{player.avatar}</span>
            </div>
            <div><p className="text-sm font-bold text-dark-900">{player.name}</p><p className="text-[10px] text-dark-400">#{player.jerseyNumber} {player.position}</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {playerStatGroups.map(group => {
            const isOpen = expandedGroup === group.key;
            return (
              <div key={group.key} className="border border-dark-100 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedGroup(isOpen ? '' : group.key)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-dark-50/50 transition-colors">
                  <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: group.color }} />
                  <span className="text-xs font-bold flex-1 text-left" style={{ color: group.color }}>{group.label}</span>
                  <ChevronDown size={13} className={`text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-1.5">
                        {group.fields.map(f => (
                          <div key={f.key} className="flex items-center gap-2">
                            <label className="text-[11px] text-dark-600 flex-1">{f.label}</label>
                            <input type="number" min={0} value={form.stats[f.key] ?? 0} onChange={e => set(f.key, parseInt(e.target.value) || 0)}
                              className="w-16 h-7 px-2 rounded-lg border border-dark-200 text-xs font-medium text-dark-800 text-center focus:outline-none focus:ring-1 focus:ring-court-500/30" />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={() => onSave(form)} className="h-8 px-4 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Save size={13} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN STATISTICS TAB
// ══════════════════════════════════════════════════════
export default function StatisticsTab({ event }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [view, setView] = useState<StatsView>('team');
  const [teamStats, setTeamStats] = useState<Record<string, number>>(defaultTeamStats);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>(defaultPlayerStats);
  const [editTeam, setEditTeam] = useState(false);
  const [editPlayer, setEditPlayer] = useState<PlayerStats | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string>('attack');

  const hasStats = event.eventType.name === 'Match Day' || event.eventType.name === 'Friendly';

  if (!hasStats) {
    return (
      <div className="text-center py-12">
        <BarChart3 size={28} className="text-dark-200 mx-auto mb-3" />
        <p className="text-sm font-medium text-dark-500">Statistics are available for Match Day and Friendly events</p>
        <p className="text-xs text-dark-400 mt-1">This is a {event.eventType.name} event</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-50/60 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: enabled ? '#8E33FF18' : '#91919118' }}>
            <BarChart3 size={16} className={enabled ? 'text-purple-500' : 'text-dark-300'} />
          </div>
          <div>
            <p className="text-sm font-bold text-dark-800">Match Statistics</p>
            <p className="text-[11px] text-dark-400">Record team and individual match statistics</p>
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className="relative shrink-0 transition-all"
        >
          <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-court-500' : 'bg-dark-200'}`}>
            <motion.div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
              animate={{ left: enabled ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </button>
      </div>

      {/* Disabled state */}
      {!enabled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-2xl bg-dark-50 flex items-center justify-center mx-auto mb-4">
            <BarChart3 size={28} className="text-dark-200" />
          </div>
          <p className="text-sm font-semibold text-dark-500 mb-1">Match Statistics are Disabled</p>
          <p className="text-xs text-dark-400 max-w-xs mx-auto">
            Enable match statistics to track team and individual performance data for this event.
          </p>
        </motion.div>
      )}

      {enabled && <>
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-dark-100/60 rounded-lg p-0.5">
          <button onClick={() => setView('team')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'team' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <Users size={13} /> Team Stats
          </button>
          <button onClick={() => setView('individual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'individual' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            <User size={13} /> Individual Stats
          </button>
        </div>
        {view === 'team' && (
          <button onClick={() => setEditTeam(true)} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-1.5"><Pencil size={13} /> Edit</button>
        )}
      </div>

      {/* ─── TEAM STATS ────────────────────────────── */}
      {view === 'team' && (
        <div className="space-y-4">
          {/* Headline numbers */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Goals', value: teamStats.goals, color: '#FF5630' },
              { label: 'Possession', value: `${teamStats.possession}%`, color: '#00B8D9' },
              { label: 'Shots on Target', value: teamStats.shots_on_target, color: '#00A76F' },
              { label: 'Yellow Cards', value: teamStats.yellow_cards, color: '#FFAB00' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center border border-dark-100" style={{ backgroundColor: s.color + '08' }}>
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: s.color }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Grouped stats */}
          {teamStatGroups.map(group => (
            <div key={group.key} className="bg-white border border-dark-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-100" style={{ backgroundColor: group.color + '06' }}>
                <span style={{ color: group.color }}>{group.icon}</span>
                <span className="text-xs font-bold" style={{ color: group.color }}>{group.label}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-dark-100">
                {group.fields.map(f => {
                  const val = teamStats[f.key] ?? 0;
                  return (
                    <div key={f.key} className="bg-white px-4 py-3">
                      <p className="text-lg font-extrabold text-dark-900">{f.key.includes('accuracy') || f.key === 'possession' ? `${val}%` : val}</p>
                      <p className="text-[10px] text-dark-400 uppercase tracking-wider mt-0.5">{f.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── INDIVIDUAL STATS ──────────────────────── */}
      {view === 'individual' && (
        <div className="space-y-4">
          {/* Group selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {playerStatGroups.map(g => (
              <button key={g.key} onClick={() => setExpandedGroup(g.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  expandedGroup === g.key ? 'text-white shadow-sm' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'
                }`}
                style={expandedGroup === g.key ? { backgroundColor: g.color } : {}}>
                {g.icon} {g.label}
              </button>
            ))}
          </div>

          {/* Table for selected group */}
          {(() => {
            const group = playerStatGroups.find(g => g.key === expandedGroup);
            if (!group) return null;
            return (
              <div className="bg-white rounded-xl border border-dark-100 overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-dark-50/60">
                      <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400 sticky left-0 bg-dark-50/60 z-10 w-44">Player</th>
                      {group.fields.map(f => (
                        <th key={f.key} title={f.label} className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider cursor-help" style={{ color: group.color }}>{f.short}</th>
                      ))}
                      <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {playerStats.map(player => (
                      <tr key={player.userId} className="hover:bg-dark-50/30 transition-colors">
                        <td className="px-3 py-2.5 sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-white">{player.avatar}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-dark-800 truncate">{player.name}</p>
                              <p className="text-[10px] text-dark-400">#{player.jerseyNumber} {player.position}</p>
                            </div>
                          </div>
                        </td>
                        {group.fields.map(f => {
                          const val = player.stats[f.key] ?? 0;
                          const isHighlight = (f.key === 'goals' || f.key === 'assists') && val > 0;
                          const isCard = (f.key === 'yellow_cards' && val > 0) || (f.key === 'red_cards' && val > 0);
                          return (
                            <td key={f.key} className="text-center px-2 py-2.5">
                              <span className={`text-xs font-semibold ${
                                isHighlight ? 'bg-court-50 text-court-600 px-1.5 py-0.5 rounded-md' :
                                f.key === 'yellow_cards' && val > 0 ? 'bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded-md' :
                                f.key === 'red_cards' && val > 0 ? 'bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md' :
                                'text-dark-600'
                              }`}>
                                {f.key.includes('accuracy') ? `${val}%` : val}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-center px-2 py-2.5">
                          <button onClick={() => setEditPlayer(player)} className="p-1 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Edit modals */}
      <AnimatePresence>
        {editTeam && <EditTeamStatsModal stats={teamStats} onClose={() => setEditTeam(false)} onSave={s => { setTeamStats(s); setEditTeam(false); }} />}
        {editPlayer && <EditPlayerStatsModal player={editPlayer} onClose={() => setEditPlayer(null)} onSave={p => { setPlayerStats(prev => prev.map(x => x.userId === p.userId ? p : x)); setEditPlayer(null); }} />}
      </AnimatePresence>
      </>}
    </div>
  );
}
