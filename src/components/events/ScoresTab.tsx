import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Clock, Shield, Pencil, Save, X, Plus, Trash2, AlertTriangle,
  Target, CircleDot, ArrowRightLeft, Square, ChevronDown,
} from 'lucide-react';
import {
  CalendarEvent, ScoreResult, MatchStatus, Sport, Outcome,
  FootballScoreInput, FootballDecider,
  TennisScoreInput, TennisDecider,
  CricketScoreInput, CricketResultType,
  AmericanFootballScoreInput, AmericanFootballDecider,
} from '@/data/events';
import { users } from '@/data/users';

interface Props {
  event: CalendarEvent;
}

// ── Timeline event types ─────────────────────────────────
type TimelineEventType = 'goal' | 'penalty' | 'own_goal' | 'free_kick' | 'yellow_card' | 'red_card' | 'substitution' | 'var_review' | 'injury' | 'penalty_miss';

interface TimelineEvent {
  id: string;
  minute: number;
  type: TimelineEventType;
  team: 'home' | 'away';
  playerName: string;
  playerNameSecondary?: string; // for subs: player coming off; for assists
  notes?: string;
}

const timelineTypeConfig: Record<TimelineEventType, { label: string; icon: string; color: string; bg: string }> = {
  goal:          { label: 'Goal',           icon: '⚽', color: 'text-green-700',  bg: 'bg-green-50' },
  penalty:       { label: 'Penalty Goal',   icon: '⚽', color: 'text-green-700',  bg: 'bg-green-50' },
  free_kick:     { label: 'Free Kick Goal', icon: '⚽', color: 'text-green-700',  bg: 'bg-green-50' },
  own_goal:      { label: 'Own Goal',       icon: '⚽', color: 'text-red-600',    bg: 'bg-red-50' },
  penalty_miss:  { label: 'Penalty Missed', icon: '❌', color: 'text-orange-600', bg: 'bg-orange-50' },
  yellow_card:   { label: 'Yellow Card',    icon: '🟨', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  red_card:      { label: 'Red Card',       icon: '🟥', color: 'text-red-600',    bg: 'bg-red-50' },
  substitution:  { label: 'Substitution',   icon: '🔄', color: 'text-blue-600',   bg: 'bg-blue-50' },
  var_review:    { label: 'VAR Review',     icon: '📺', color: 'text-purple-600', bg: 'bg-purple-50' },
  injury:        { label: 'Injury',         icon: '🏥', color: 'text-red-600',    bg: 'bg-red-50' },
};

const matchStatusConfig: Record<MatchStatus, { label: string; bg: string; text: string; dot: string }> = {
  not_entered: { label: 'Not Entered', bg: 'bg-dark-100', text: 'text-dark-500', dot: 'bg-dark-400' },
  scheduled:   { label: 'Scheduled',   bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-500' },
  live:        { label: 'Live',        bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-500' },
  final:       { label: 'Full Time',   bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-500' },
  postponed:   { label: 'Postponed',   bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-500' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-dark-100',  text: 'text-dark-500',   dot: 'bg-dark-400' },
  abandoned:   { label: 'Abandoned',   bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
};

const outcomeConfig: Record<string, { label: string; bg: string; text: string }> = {
  win:       { label: 'Win',       bg: 'bg-green-50',  text: 'text-green-600' },
  loss:      { label: 'Loss',      bg: 'bg-red-50',    text: 'text-red-600' },
  draw:      { label: 'Draw',      bg: 'bg-yellow-50', text: 'text-yellow-600' },
  tie:       { label: 'Tie',       bg: 'bg-yellow-50', text: 'text-yellow-600' },
  no_result: { label: 'No Result', bg: 'bg-dark-100',  text: 'text-dark-500' },
  abandoned: { label: 'Abandoned', bg: 'bg-orange-50', text: 'text-orange-600' },
};

const sportLabels: Record<Sport, string> = {
  football: 'Football', tennis: 'Tennis', cricket: 'Cricket', american_football: 'American Football',
};

// ── Build initial timeline from existing scorers data ─────
function buildInitialTimeline(scores: ScoreResult): TimelineEvent[] {
  if (!scores.scorers) return [];
  return scores.scorers.map((s, i) => ({
    id: `tl-${i}`,
    minute: s.minute,
    type: s.type as TimelineEventType,
    team: s.team,
    playerName: s.name,
  }));
}

export default function ScoresTab({ event }: Props) {
  const scores = event.scores;
  const [editing, setEditing] = useState(false);

  // ── Match format state ─────────────────────────────
  type MatchFormat = 'set' | 'halves' | 'quarters';
  const FORMAT_DEFAULTS: Record<MatchFormat, number> = { set: 60, halves: 45, quarters: 15 };
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('halves');
  const [periodDuration, setPeriodDuration] = useState(45);

  // ── Set Match state ────────────────────────────────
  const [showMatchSetup, setShowMatchSetup] = useState(false);
  const [matchOurTeam, setMatchOurTeam] = useState<string>(() => {
    if (!scores) return event.teamNames[0] || '';
    return event.locationtype === 'home' ? scores.home_participant : scores.away_participant;
  });
  const [matchOpponent, setMatchOpponent] = useState<string>(() => {
    if (!scores) return '';
    return event.locationtype === 'home' ? scores.away_participant : scores.home_participant;
  });

  function handleSaveMatch() {
    const base = liveScores ?? scores;
    if (!base) return;
    const home = event.locationtype === 'home' ? matchOurTeam : matchOpponent;
    const away = event.locationtype === 'home' ? matchOpponent : matchOurTeam;
    setLiveScores({ ...base, home_participant: home, away_participant: away });
    setShowMatchSetup(false);
  }

  // Score editing state
  const [editStatus, setEditStatus] = useState<MatchStatus>(scores?.match_status || 'not_entered');
  const [editHomeGoals, setEditHomeGoals] = useState(
    scores?.score_input && 'home_goals' in scores.score_input ? scores.score_input.home_goals : 0
  );
  const [editAwayGoals, setEditAwayGoals] = useState(
    scores?.score_input && 'away_goals' in scores.score_input ? scores.score_input.away_goals : 0
  );
  const [editDecider, setEditDecider] = useState<FootballDecider>(
    scores?.score_input && 'decider' in scores.score_input ? (scores.score_input as FootballScoreInput).decider : 'normal_time'
  );
  const [editPenHome, setEditPenHome] = useState(
    scores?.score_input && 'penalties' in scores.score_input && (scores.score_input as FootballScoreInput).penalties?.home || 0
  );
  const [editPenAway, setEditPenAway] = useState(
    scores?.score_input && 'penalties' in scores.score_input && (scores.score_input as FootballScoreInput).penalties?.away || 0
  );
  // Tennis
  const [editTennisScore, setEditTennisScore] = useState(
    scores?.score_input && 'score_summary' in scores.score_input ? (scores.score_input as TennisScoreInput).score_summary : ''
  );
  const [editTennisDecider, setEditTennisDecider] = useState<TennisDecider>(
    scores?.score_input && 'score_summary' in scores.score_input ? (scores.score_input as TennisScoreInput).decider : 'completed'
  );
  // Cricket
  const [editCricketHome, setEditCricketHome] = useState(
    scores?.score_input && 'home_innings' in scores.score_input ? (scores.score_input as CricketScoreInput).home_innings : { runs: 0, wickets: 0, overs: '0' }
  );
  const [editCricketAway, setEditCricketAway] = useState(
    scores?.score_input && 'away_innings' in scores.score_input ? (scores.score_input as CricketScoreInput).away_innings : { runs: 0, wickets: 0, overs: '0' }
  );
  const [editCricketResult, setEditCricketResult] = useState<CricketResultType>(
    scores?.score_input && 'result_type' in scores.score_input ? (scores.score_input as CricketScoreInput).result_type : 'won_by_runs'
  );
  // American Football
  const [editAFHome, setEditAFHome] = useState(
    scores?.score_input && 'home_points' in scores.score_input ? (scores.score_input as AmericanFootballScoreInput).home_points : 0
  );
  const [editAFAway, setEditAFAway] = useState(
    scores?.score_input && 'away_points' in scores.score_input ? (scores.score_input as AmericanFootballScoreInput).away_points : 0
  );
  const [editAFDecider, setEditAFDecider] = useState<AmericanFootballDecider>(
    scores?.score_input && 'home_points' in scores.score_input ? (scores.score_input as AmericanFootballScoreInput).decider : 'regulation'
  );

  // ── Live (saved) score state — drives scorecard display ───
  const [liveScores, setLiveScores] = useState<ScoreResult | null>(null);

  function handleSaveScore() {
    if (!scores) return;
    const base = liveScores ?? scores;
    const hasLiveResult = editStatus === 'live' || editStatus === 'final';
    let score_display: string | undefined;
    let score_input: ScoreResult['score_input'] = scores.score_input;
    let outcome: Outcome | undefined;
    let winner: ScoreResult['winner'];

    if (hasLiveResult) {
      if (sport === 'football') {
        // Auto-advance live → Full Time when one team is winning
        const effectiveStatus: MatchStatus =
          editStatus === 'live' && editHomeGoals !== editAwayGoals ? 'final' : editStatus;
        score_display = `${editHomeGoals} - ${editAwayGoals}`;
        // Always include penalty data when decider is penalty_shootout (live or final)
        score_input = {
          home_goals: editHomeGoals, away_goals: editAwayGoals, decider: editDecider,
          ...(editDecider === 'penalty_shootout' ? { penalties: { home: editPenHome, away: editPenAway } } : {}),
        } as FootballScoreInput;
        // Only compute outcome for full time
        if (effectiveStatus === 'final') {
          if (editDecider === 'penalty_shootout') {
            if (editPenHome > editPenAway)      { outcome = 'win';  winner = 'home'; }
            else if (editPenHome < editPenAway) { outcome = 'loss'; winner = 'away'; }
          } else {
            if (editHomeGoals > editAwayGoals)      { outcome = 'win';  winner = 'home'; }
            else if (editHomeGoals < editAwayGoals) { outcome = 'loss'; winner = 'away'; }
            else                                    { outcome = 'draw'; winner = 'draw'; }
          }
        }
        setLiveScores({ ...base, match_status: effectiveStatus, score_display, score_input, outcome, winner });
        setEditing(false);
        return;
      } else if (sport === 'tennis') {
        score_display = editTennisScore;
        score_input = { score_summary: editTennisScore, decider: editTennisDecider } as TennisScoreInput;
      } else if (sport === 'cricket') {
        score_display = `${editCricketHome.runs}/${editCricketHome.wickets} - ${editCricketAway.runs}/${editCricketAway.wickets}`;
        score_input = { home_innings: editCricketHome, away_innings: editCricketAway, result_type: editCricketResult } as CricketScoreInput;
      } else if (sport === 'american_football') {
        score_display = `${editAFHome} - ${editAFAway}`;
        score_input = { home_points: editAFHome, away_points: editAFAway, decider: editAFDecider } as AmericanFootballScoreInput;
        if (editStatus === 'final') {
          if (editAFHome > editAFAway)      { outcome = 'win';  winner = 'home'; }
          else if (editAFHome < editAFAway) { outcome = 'loss'; winner = 'away'; }
          else                              { outcome = 'draw'; winner = 'draw'; }
        }
      }
    }

    setLiveScores({ ...base, match_status: editStatus, score_display, score_input, outcome, winner });
    setEditing(false);
  }

  // ── Timeline CRUD state ────────────────────────────
  const [timelineView, setTimelineView] = useState<'list' | 'mirror' | 'visual'>('mirror');
  const [timeline, setTimeline] = useState<TimelineEvent[]>(scores ? buildInitialTimeline(scores) : []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);
  // Add form fields
  const [addMinute, setAddMinute] = useState('');
  const [addType, setAddType] = useState<TimelineEventType>('goal');
  const [addTeam, setAddTeam] = useState<'home' | 'away'>('home');
  const [addPlayer, setAddPlayer] = useState('');
  const [addPlayerSecondary, setAddPlayerSecondary] = useState('');
  const [addNotes, setAddNotes] = useState('');

  const resetAddForm = () => {
    setAddMinute(''); setAddType('goal'); setAddTeam('home');
    setAddPlayer(''); setAddPlayerSecondary(''); setAddNotes('');
    setShowAddForm(false); setEditingTimelineId(null);
  };

  const handleAddTimeline = () => {
    if (!addPlayer.trim() || !addMinute) return;
    if (editingTimelineId) {
      setTimeline(prev => prev.map(t => t.id === editingTimelineId ? {
        ...t, minute: parseInt(addMinute) || 0, type: addType, team: addTeam,
        playerName: addPlayer, playerNameSecondary: addPlayerSecondary || undefined, notes: addNotes || undefined,
      } : t));
    } else {
      const newEvent: TimelineEvent = {
        id: `tl-${Date.now()}`, minute: parseInt(addMinute) || 0, type: addType, team: addTeam,
        playerName: addPlayer, playerNameSecondary: addPlayerSecondary || undefined, notes: addNotes || undefined,
      };
      setTimeline(prev => [...prev, newEvent]);
    }
    resetAddForm();
  };

  const handleEditTimeline = (item: TimelineEvent) => {
    setEditingTimelineId(item.id);
    setAddMinute(item.minute.toString());
    setAddType(item.type);
    setAddTeam(item.team);
    setAddPlayer(item.playerName);
    setAddPlayerSecondary(item.playerNameSecondary || '');
    setAddNotes(item.notes || '');
    setShowAddForm(true);
  };

  const handleDeleteTimeline = (id: string) => {
    setTimeline(prev => prev.filter(t => t.id !== id));
  };

  if (!scores) {
    return (
      <div className="text-center py-16">
        <Trophy size={32} className="text-dark-200 mx-auto mb-3" />
        <p className="text-sm text-dark-400 mb-1">No scoring data</p>
        <p className="text-xs text-dark-300">Scores are available for competitive events (Match Day, Friendly)</p>
      </div>
    );
  }

  const displayScores = liveScores ?? scores;
  const sc = matchStatusConfig[displayScores.match_status];
  const sport = scores.sport;
  const hasResult = displayScores.match_status === 'final' || displayScores.match_status === 'live';
  const footballInput = displayScores.score_input && 'home_goals' in displayScores.score_input ? displayScores.score_input as FootballScoreInput : null;
  const sortedTimeline = [...timeline].sort((a, b) => a.minute - b.minute);

  // Determine period labels based on match format
  const getHalfLabel = (minute: number): string => {
    const d = periodDuration;
    if (matchFormat === 'set') return 'Set';
    if (matchFormat === 'halves') {
      if (minute <= d)     return '1st Half';
      if (minute <= d * 2) return '2nd Half';
      return 'Extra Time';
    }
    // quarters
    if (minute <= d)     return '1st Quarter';
    if (minute <= d * 2) return '2nd Quarter';
    if (minute <= d * 3) return '3rd Quarter';
    if (minute <= d * 4) return '4th Quarter';
    return 'Overtime';
  };

  // Group timeline by half
  const groupedTimeline: { label: string; events: TimelineEvent[] }[] = [];
  let currentHalf = '';
  sortedTimeline.forEach(ev => {
    const half = getHalfLabel(ev.minute);
    if (half !== currentHalf) {
      currentHalf = half;
      groupedTimeline.push({ label: half, events: [] });
    }
    groupedTimeline[groupedTimeline.length - 1].events.push(ev);
  });

  const needsSecondary = (type: TimelineEventType) => type === 'substitution';
  const supportsAssist = (type: TimelineEventType) => ['goal', 'penalty', 'free_kick'].includes(type);

  // Players from our org who belong to any team in this event
  const eventPlayers = users
    .filter(u => u.role === 'player' && u.teamIds.some(tid => event.teamIds.includes(tid)))
    .sort((a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99));

  // True when the selected timeline team is our org's team
  const isOurTeam = (team: 'home' | 'away') =>
    event.locationtype === 'home' ? team === 'home' : team === 'away';

  return (
    <div className="space-y-5">
      {/* ── Match Scoreboard ────────────────────── */}
      <div className="bg-white border border-dark-100 rounded-2xl overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-dark-100 bg-dark-50/30">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sc.dot} ${displayScores.match_status === 'live' ? 'animate-pulse' : ''}`} />
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
            <span className="text-[10px] text-dark-400 font-medium">{sportLabels[sport]}</span>
          </div>
          <div className="flex items-center gap-2">
            {!showMatchSetup && (
              <button
                onClick={() => { setShowMatchSetup(true); setEditing(false); }}
                className="h-7 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-dark-200 text-dark-600 hover:bg-dark-50 transition-colors"
              >
                <Shield size={12} /> Set Match
              </button>
            )}
            {!editing && (
              <button
                onClick={() => { setEditing(true); setShowMatchSetup(false); }}
                className="h-7 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border border-dark-200 text-dark-600 hover:bg-dark-50 transition-colors"
              >
                <Pencil size={12} /> Edit Score
              </button>
            )}
          </div>
        </div>

        {/* Scoreboard */}
        <div className="px-5 py-6">
          <div className="flex items-center justify-center gap-6">
            {/* Home */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center mx-auto mb-2">
                <Shield size={24} className="text-white" />
              </div>
              <p className="text-sm font-bold text-dark-900">{scores.home_participant}</p>
              <p className="text-[10px] text-dark-400 uppercase tracking-wider mt-0.5">
                {event.locationtype === 'home' ? 'Home' : 'Away'}
              </p>
            </div>

            {/* Score */}
            <div className="text-center shrink-0">
              {hasResult && displayScores.score_display ? (
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-extrabold text-dark-900 tracking-tight tabular-nums">
                    {displayScores.score_display.split('-')[0]?.trim()}
                  </span>
                  <span className="text-2xl text-dark-300 font-light">-</span>
                  <span className="text-5xl font-extrabold text-dark-900 tracking-tight tabular-nums">
                    {displayScores.score_display.split('-')[1]?.trim()}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold text-dark-200 tabular-nums">-</span>
                  <span className="text-xl text-dark-200">vs</span>
                  <span className="text-4xl font-extrabold text-dark-200 tabular-nums">-</span>
                </div>
              )}
              {hasResult && footballInput && footballInput.decider !== 'normal_time' && (
                footballInput.decider === 'penalty_shootout' && footballInput.penalties?.home !== undefined ? (
                  <div className="mt-2">
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px] font-bold">
                      Penalties: {footballInput.penalties.home} – {footballInput.penalties.away}
                    </span>
                  </div>
                ) : footballInput.decider !== 'penalty_shootout' ? (
                  <div className="mt-2">
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px] font-bold">
                      {footballInput.decider === 'extra_time' ? 'After Extra Time' :
                       footballInput.decider === 'forfeit' ? 'Forfeit' : 'Abandoned'}
                    </span>
                  </div>
                ) : null
              )}
              {hasResult && (
                <div className="mt-2">
                  {displayScores.match_status === 'live' && footballInput ? (
                    (() => {
                      // Penalty shootout in progress
                      if (footballInput.decider === 'penalty_shootout' && footballInput.penalties?.home !== undefined) {
                        const { home: ph, away: pa } = footballInput.penalties;
                        if (ph > pa) return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600">Leading {ph}-{pa} on pens</span>;
                        if (ph < pa) return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600">Trailing {ph}-{pa} on pens</span>;
                      }
                      const diff = footballInput.home_goals - footballInput.away_goals;
                      if (diff > 0) return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600">Up by {diff}</span>;
                      if (diff < 0) return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600">Down by {Math.abs(diff)}</span>;
                      return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-yellow-50 text-yellow-600">Level</span>;
                    })()
                  ) : displayScores.outcome ? (
                    (() => {
                      if (footballInput?.decider === 'penalty_shootout') {
                        if (displayScores.outcome === 'win')  return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600">Won on Penalties</span>;
                        if (displayScores.outcome === 'loss') return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600">Lost on Penalties</span>;
                      }
                      const oc = outcomeConfig[displayScores.outcome!] || outcomeConfig.draw;
                      return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${oc.bg} ${oc.text}`}>{oc.label}</span>;
                    })()
                  ) : null}
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-court-500 to-court-600 flex items-center justify-center mx-auto mb-2">
                <Shield size={24} className="text-white" />
              </div>
              <p className="text-sm font-bold text-dark-900">{scores.away_participant}</p>
              <p className="text-[10px] text-dark-400 uppercase tracking-wider mt-0.5">
                {event.locationtype === 'home' ? 'Away' : 'Home'}
              </p>
            </div>
          </div>

          {displayScores.summary && (
            <p className="text-center text-sm font-semibold text-dark-600 mt-4 bg-dark-50/60 rounded-xl py-2.5 px-4">{displayScores.summary}</p>
          )}
        </div>
      </div>

      {/* ── Set Match ─────────────────────────── */}
      <AnimatePresence>
        {showMatchSetup && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white border border-dark-200 rounded-2xl p-5 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-dark-800 flex items-center gap-2">
                <Shield size={14} className="text-court-500" /> Set Match
              </h3>
              <button onClick={() => setShowMatchSetup(false)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400">
                <X size={14} />
              </button>
            </div>

            {/* Team columns */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
              {/* Left side */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">
                  {event.locationtype === 'home' ? 'Home (Our Team)' : 'Home (Opponent)'}
                </p>
                {event.locationtype === 'home' ? (
                  event.teamNames.length > 1 ? (
                    <select
                      value={matchOurTeam}
                      onChange={e => setMatchOurTeam(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm font-semibold text-dark-800 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
                    >
                      {event.teamNames.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <div className="h-10 px-3 flex items-center rounded-xl border border-dark-100 bg-dark-50 text-sm font-semibold text-dark-700">
                      {event.teamNames[0] || matchOurTeam}
                    </div>
                  )
                ) : (
                  <input
                    value={matchOpponent}
                    onChange={e => setMatchOpponent(e.target.value)}
                    placeholder="Opponent name..."
                    className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
                  />
                )}
              </div>

              {/* VS divider */}
              <div className="flex items-end pb-2">
                <span className="text-sm font-bold text-dark-300">VS</span>
              </div>

              {/* Right side */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">
                  {event.locationtype === 'home' ? 'Away (Opponent)' : 'Away (Our Team)'}
                </p>
                {event.locationtype === 'away' ? (
                  event.teamNames.length > 1 ? (
                    <select
                      value={matchOurTeam}
                      onChange={e => setMatchOurTeam(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm font-semibold text-dark-800 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
                    >
                      {event.teamNames.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <div className="h-10 px-3 flex items-center rounded-xl border border-dark-100 bg-dark-50 text-sm font-semibold text-dark-700">
                      {event.teamNames[0] || matchOurTeam}
                    </div>
                  )
                ) : (
                  <input
                    value={matchOpponent}
                    onChange={e => setMatchOpponent(e.target.value)}
                    placeholder="Opponent name..."
                    className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-800 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
                  />
                )}
              </div>
            </div>

            {/* Location badge */}
            <p className="text-[11px] text-dark-400">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold mr-1 ${event.locationtype === 'home' ? 'bg-court-50 text-court-700' : 'bg-dark-100 text-dark-600'}`}>
                {event.locationtype === 'home' ? 'Home' : 'Away'}
              </span>
              Our team is on the {event.locationtype === 'home' ? 'left (home)' : 'right (away)'} side.
            </p>

            {/* Match Format */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400">Match Format</label>
              <div className="flex gap-2">
                {([
                  { key: 'set'     as MatchFormat, label: 'Full Match', default: 60 },
                  { key: 'halves'  as MatchFormat, label: '2 Halves',   default: 45 },
                  { key: 'quarters'as MatchFormat, label: '4 Quarters', default: 15 },
                ]).map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => { setMatchFormat(f.key); setPeriodDuration(f.default); }}
                    className={`flex-1 h-8 rounded-xl text-xs font-semibold border transition-colors
                      ${matchFormat === f.key
                        ? 'bg-court-50 text-court-700 border-court-200'
                        : 'bg-white text-dark-500 border-dark-200 hover:border-dark-300'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-dark-500 shrink-0">
                  {matchFormat === 'set' ? 'Match duration' : matchFormat === 'halves' ? 'Duration per half' : 'Duration per quarter'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={periodDuration}
                  onChange={e => setPeriodDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-8 px-2 rounded-lg border border-dark-200 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-court-500/20"
                />
                <span className="text-xs text-dark-400">min</span>
                {periodDuration !== FORMAT_DEFAULTS[matchFormat] && (
                  <button
                    type="button"
                    onClick={() => setPeriodDuration(FORMAT_DEFAULTS[matchFormat])}
                    className="text-[11px] text-court-500 hover:text-court-700 font-medium transition-colors"
                  >
                    Reset to default
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dark-100">
              <button
                onClick={() => setShowMatchSetup(false)}
                className="h-8 px-4 rounded-xl border border-dark-200 text-xs font-semibold text-dark-600 hover:bg-dark-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMatch}
                disabled={!matchOurTeam.trim() || !matchOpponent.trim()}
                className="h-8 px-4 rounded-xl bg-court-500 text-white text-xs font-semibold hover:bg-court-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Save size={13} /> Save Match
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Score Form ────────────────────── */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white border border-court-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-dark-800 flex items-center gap-2"><Pencil size={14} className="text-court-500" /> Edit Score</h3>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400" title="Cancel"><X size={14} /></button>
            </div>

            {/* Match Status */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Match Status</label>
              <div className="flex flex-wrap gap-1.5">
                {(['not_entered', 'scheduled', 'live', 'final', 'postponed', 'cancelled', 'abandoned'] as MatchStatus[]).map(s => {
                  const cfg = matchStatusConfig[s];
                  return (
                    <button key={s} onClick={() => setEditStatus(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${editStatus === s ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-current` : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(editStatus === 'live' || editStatus === 'final') && (
              <>
                {/* FOOTBALL */}
                {sport === 'football' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">{displayScores.home_participant} Goals</label>
                        <input type="number" min={0} value={editHomeGoals} onChange={e => {
                          const v = parseInt(e.target.value) || 0;
                          setEditHomeGoals(v);
                          if (v !== editAwayGoals && (editDecider === 'extra_time' || editDecider === 'penalty_shootout')) setEditDecider('normal_time');
                        }} className="w-full h-10 px-3 rounded-lg border border-dark-200 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">{displayScores.away_participant} Goals</label>
                        <input type="number" min={0} value={editAwayGoals} onChange={e => {
                          const v = parseInt(e.target.value) || 0;
                          setEditAwayGoals(v);
                          if (editHomeGoals !== v && (editDecider === 'extra_time' || editDecider === 'penalty_shootout')) setEditDecider('normal_time');
                        }} className="w-full h-10 px-3 rounded-lg border border-dark-200 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Decider</label>
                      {editHomeGoals !== editAwayGoals && (
                        <p className="text-[10px] text-dark-400 mb-1.5">Extra Time and Penalty Shootout are only available when scores are level.</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          { key: 'normal_time' as FootballDecider, label: 'Normal Time', requiresTie: false },
                          { key: 'extra_time' as FootballDecider, label: 'Extra Time', requiresTie: true },
                          { key: 'penalty_shootout' as FootballDecider, label: 'Penalty Shootout', requiresTie: true },
                          { key: 'forfeit' as FootballDecider, label: 'Forfeit', requiresTie: false },
                          { key: 'abandoned' as FootballDecider, label: 'Abandoned', requiresTie: false },
                        ]).map(d => {
                          const isDisabled = d.requiresTie && editHomeGoals !== editAwayGoals;
                          const isActive = editDecider === d.key;
                          return (
                            <button key={d.key}
                              disabled={isDisabled}
                              onClick={() => !isDisabled && setEditDecider(d.key)}
                              title={isDisabled ? 'Only available when scores are level' : undefined}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                                ${isDisabled ? 'bg-dark-50 text-dark-300 cursor-not-allowed opacity-50' :
                                  isActive ? 'bg-court-50 text-court-700 ring-2 ring-offset-1 ring-court-400' :
                                  'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {editDecider === 'penalty_shootout' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 p-3 bg-yellow-50/50 rounded-xl border border-yellow-200">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-yellow-700 mb-1">{displayScores.home_participant} Penalties</label>
                            <input type="number" min={0} value={editPenHome} onChange={e => setEditPenHome(parseInt(e.target.value) || 0)}
                              className="w-full h-9 px-3 rounded-lg border border-yellow-200 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-400/30" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-yellow-700 mb-1">{displayScores.away_participant} Penalties</label>
                            <input type="number" min={0} value={editPenAway} onChange={e => setEditPenAway(parseInt(e.target.value) || 0)}
                              className="w-full h-9 px-3 rounded-lg border border-yellow-200 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-yellow-400/30" />
                          </div>
                        </div>
                        {editStatus === 'final' && editPenHome === editPenAway && (
                          <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
                            <AlertTriangle size={13} className="text-red-500 shrink-0" />
                            <p className="text-[11px] text-red-600 font-medium">Penalty shootout must have a winner — scores cannot be level.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* TENNIS */}
                {sport === 'tennis' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Score Summary</label>
                      <input value={editTennisScore} onChange={e => setEditTennisScore(e.target.value)} placeholder='e.g. 6-3, 6-4'
                        className="w-full h-10 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                      <p className="text-[10px] text-dark-400 mt-1">Enter set scores separated by commas</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Result</label>
                      <div className="flex flex-wrap gap-1.5">
                        {(['completed', 'retirement', 'walkover', 'default', 'abandoned'] as TennisDecider[]).map(d => (
                          <button key={d} onClick={() => setEditTennisDecider(d)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${editTennisDecider === d ? 'bg-court-50 text-court-700 ring-2 ring-offset-1 ring-court-400' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* CRICKET */}
                {sport === 'cricket' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-dark-400">{scores.home_participant} Innings</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div><label className="block text-[9px] text-dark-400 mb-0.5">Runs</label>
                            <input type="number" min={0} value={editCricketHome.runs} onChange={e => setEditCricketHome({ ...editCricketHome, runs: parseInt(e.target.value) || 0 })}
                              className="w-full h-8 px-2 rounded-lg border border-dark-200 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-court-500/20" /></div>
                          <div><label className="block text-[9px] text-dark-400 mb-0.5">Wickets</label>
                            <input type="number" min={0} max={10} value={editCricketHome.wickets} onChange={e => setEditCricketHome({ ...editCricketHome, wickets: parseInt(e.target.value) || 0 })}
                              className="w-full h-8 px-2 rounded-lg border border-dark-200 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-court-500/20" /></div>
                          <div><label className="block text-[9px] text-dark-400 mb-0.5">Overs</label>
                            <input value={editCricketHome.overs} onChange={e => setEditCricketHome({ ...editCricketHome, overs: e.target.value })}
                              className="w-full h-8 px-2 rounded-lg border border-dark-200 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-court-500/20" /></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-dark-400">{scores.away_participant} Innings</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div><label className="block text-[9px] text-dark-400 mb-0.5">Runs</label>
                            <input type="number" min={0} value={editCricketAway.runs} onChange={e => setEditCricketAway({ ...editCricketAway, runs: parseInt(e.target.value) || 0 })}
                              className="w-full h-8 px-2 rounded-lg border border-dark-200 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-court-500/20" /></div>
                          <div><label className="block text-[9px] text-dark-400 mb-0.5">Wickets</label>
                            <input type="number" min={0} max={10} value={editCricketAway.wickets} onChange={e => setEditCricketAway({ ...editCricketAway, wickets: parseInt(e.target.value) || 0 })}
                              className="w-full h-8 px-2 rounded-lg border border-dark-200 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-court-500/20" /></div>
                          <div><label className="block text-[9px] text-dark-400 mb-0.5">Overs</label>
                            <input value={editCricketAway.overs} onChange={e => setEditCricketAway({ ...editCricketAway, overs: e.target.value })}
                              className="w-full h-8 px-2 rounded-lg border border-dark-200 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-court-500/20" /></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Result Type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {(['won_by_runs', 'won_by_wickets', 'tie', 'draw', 'no_result', 'abandoned', 'won_by_dls'] as CricketResultType[]).map(rt => (
                          <button key={rt} onClick={() => setEditCricketResult(rt)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${editCricketResult === rt ? 'bg-court-50 text-court-700 ring-2 ring-offset-1 ring-court-400' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>
                            {rt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* AMERICAN FOOTBALL */}
                {sport === 'american_football' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">{scores.home_participant} Points</label>
                        <input type="number" min={0} value={editAFHome} onChange={e => setEditAFHome(parseInt(e.target.value) || 0)}
                          className="w-full h-10 px-3 rounded-lg border border-dark-200 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">{scores.away_participant} Points</label>
                        <input type="number" min={0} value={editAFAway} onChange={e => setEditAFAway(parseInt(e.target.value) || 0)}
                          className="w-full h-10 px-3 rounded-lg border border-dark-200 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Decider</label>
                      <div className="flex flex-wrap gap-1.5">
                        {(['regulation', 'overtime', 'forfeit', 'abandoned'] as AmericanFootballDecider[]).map(d => (
                          <button key={d} onClick={() => setEditAFDecider(d)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${editAFDecider === d ? 'bg-court-50 text-court-700 ring-2 ring-offset-1 ring-court-400' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {editStatus !== 'live' && editStatus !== 'final' && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50/60 rounded-xl border border-yellow-200">
                <AlertTriangle size={14} className="text-yellow-600 shrink-0" />
                <p className="text-[11px] text-yellow-700">Score input is only available when the match status is <strong>Live</strong> or <strong>Full Time</strong>.</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dark-100">
              <button
                onClick={() => setEditing(false)}
                className="h-8 px-4 rounded-xl border border-dark-200 text-xs font-semibold text-dark-600 hover:bg-dark-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScore}
                disabled={editDecider === 'penalty_shootout' && editStatus === 'final' && editPenHome === editPenAway}
                className="h-8 px-4 rounded-xl bg-court-500 text-white text-xs font-semibold hover:bg-court-600 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={13} /> Save Score
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Match Timeline (CRUD) ──────────────── */}
      <div className="bg-white border border-dark-100 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-100">
          <h3 className="text-sm font-bold text-dark-800 flex items-center gap-2">
            <Clock size={15} className="text-court-500" /> Match Timeline
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-dark-200 overflow-hidden">
              {([
                { key: 'list'   as const, label: 'List' },
                { key: 'mirror' as const, label: 'Mirror' },
                { key: 'visual' as const, label: 'Visual' },
              ]).map(v => (
                <button key={v.key} onClick={() => setTimelineView(v.key)}
                  className={`px-2.5 py-1 text-[10px] font-bold transition-colors ${timelineView === v.key ? 'bg-dark-800 text-white' : 'bg-white text-dark-400 hover:bg-dark-50'}`}>
                  {v.label}
                </button>
              ))}
            </div>
            <button onClick={() => { resetAddForm(); setShowAddForm(true); }}
              className="h-7 px-3 rounded-lg bg-court-500 text-white text-[11px] font-semibold hover:bg-court-600 flex items-center gap-1.5 shadow-sm">
              <Plus size={12} /> Add Event
            </button>
          </div>
        </div>

        {/* Add / Edit form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-dark-100">
              <div className="p-5 bg-court-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-dark-700">{editingTimelineId ? 'Edit Timeline Event' : 'Add Timeline Event'}</p>
                  <button onClick={resetAddForm} className="p-1 rounded-lg hover:bg-dark-100 text-dark-400"><X size={14} /></button>
                </div>

                {/* Row 1: Minute + Type + Team */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1">Min *</label>
                    <input type="number" min={0} max={120} value={addMinute} onChange={e => setAddMinute(e.target.value)} placeholder="23"
                      className="w-full h-9 px-2 rounded-lg border border-dark-200 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  </div>
                  <div className="col-span-5">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1">Event Type *</label>
                    <select value={addType} onChange={e => setAddType(e.target.value as TimelineEventType)}
                      className="w-full h-9 px-2 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
                      {Object.entries(timelineTypeConfig).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-5">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1">Team *</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button onClick={() => { setAddTeam('home'); setAddPlayer(''); setAddPlayerSecondary(''); }}
                        className={`h-9 rounded-lg text-[10px] font-bold transition-all truncate px-1.5 ${addTeam === 'home' ? 'bg-dark-700 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>
                        {displayScores.home_participant}
                      </button>
                      <button onClick={() => { setAddTeam('away'); setAddPlayer(''); setAddPlayerSecondary(''); }}
                        className={`h-9 rounded-lg text-[10px] font-bold transition-all truncate px-1.5 ${addTeam === 'away' ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>
                        {displayScores.away_participant}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Player names */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1">
                      {needsSecondary(addType) ? 'Player On *' : 'Player Name *'}
                    </label>
                    {isOurTeam(addTeam) ? (
                      <select value={addPlayer} onChange={e => setAddPlayer(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
                        <option value="">Select player...</option>
                        {eventPlayers.map(p => (
                          <option key={p.id} value={`${p.firstName} ${p.lastName}`}>
                            {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input value={addPlayer} onChange={e => setAddPlayer(e.target.value)} placeholder="Player name"
                        className="w-full h-9 px-3 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1">
                      {needsSecondary(addType) ? 'Player Off' : supportsAssist(addType) ? 'Assist' : 'Secondary'}
                    </label>
                    {isOurTeam(addTeam) ? (
                      <select value={addPlayerSecondary} onChange={e => setAddPlayerSecondary(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
                        <option value="">
                          {needsSecondary(addType) ? 'Player coming off...' : supportsAssist(addType) ? 'Assist by...' : 'Optional'}
                        </option>
                        {eventPlayers.map(p => (
                          <option key={p.id} value={`${p.firstName} ${p.lastName}`}>
                            {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input value={addPlayerSecondary} onChange={e => setAddPlayerSecondary(e.target.value)}
                        placeholder={needsSecondary(addType) ? 'Player coming off' : supportsAssist(addType) ? 'Assist by...' : 'Optional'}
                        className="w-full h-9 px-3 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                    )}
                  </div>
                </div>

                {/* Row 3: Notes + Actions */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1">Notes</label>
                    <input value={addNotes} onChange={e => setAddNotes(e.target.value)} placeholder="Optional notes..."
                      className="w-full h-9 px-3 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  </div>
                  <button onClick={handleAddTimeline} disabled={!addPlayer.trim() || !addMinute}
                    className="h-9 px-4 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-1.5 shrink-0">
                    {editingTimelineId ? <><Save size={12} /> Update</> : <><Plus size={12} /> Add</>}
                  </button>
                  {editingTimelineId && (
                    <button onClick={resetAddForm} className="h-9 px-3 rounded-lg border border-dark-200 text-xs font-semibold text-dark-600 hover:bg-dark-50 shrink-0">Cancel</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline display */}
        {sortedTimeline.length === 0 ? (
          <div className="text-center py-10">
            <Clock size={24} className="text-dark-200 mx-auto mb-2" />
            <p className="text-sm text-dark-400">No timeline events yet</p>
            <p className="text-xs text-dark-300 mt-0.5">Add goals, cards, substitutions, and other match events</p>
          </div>
        ) : timelineView === 'list' ? (
          /* ── List view ── */
          <div className="p-5 space-y-4">
            {groupedTimeline.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-px flex-1 bg-dark-100" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400 px-2">{group.label}</span>
                  <div className="h-px flex-1 bg-dark-100" />
                </div>
                <div className="space-y-1.5">
                  {group.events.map((item) => {
                    const cfg = timelineTypeConfig[item.type];
                    const isHome = item.team === 'home';
                    return (
                      <motion.div key={item.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all group hover:shadow-sm ${isHome ? 'border-dark-100 bg-dark-50/30' : 'border-court-100 bg-court-50/20'}`}>
                        <div className="w-10 h-10 rounded-xl bg-white border border-dark-100 flex items-center justify-center shrink-0 shadow-sm">
                          <span className="text-xs font-extrabold text-dark-700 tabular-nums">{item.minute}'</span>
                        </div>
                        <span className="text-lg shrink-0">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-dark-800">{item.playerName}</span>
                            {item.playerNameSecondary && (
                              needsSecondary(item.type)
                                ? <span className="text-xs text-dark-400"><ArrowRightLeft size={10} className="inline mx-0.5" />{item.playerNameSecondary}</span>
                                : supportsAssist(item.type)
                                  ? <span className="text-[10px] text-dark-400">(assist: {item.playerNameSecondary})</span>
                                  : <span className="text-[10px] text-dark-400">({item.playerNameSecondary})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isHome ? 'bg-dark-100 text-dark-600' : 'bg-court-100 text-court-700'}`}>
                              {isHome ? displayScores.home_participant : displayScores.away_participant}
                            </span>
                            {item.notes && <span className="text-[10px] text-dark-400 truncate">{item.notes}</span>}
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => handleEditTimeline(item)} className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-court-600"><Pencil size={12} /></button>
                          <button onClick={() => handleDeleteTimeline(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : timelineView === 'mirror' ? (
          /* ── Mirror view ── */
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-[1fr_44px_1fr] gap-2 pb-2 border-b border-dark-100">
              <p className="text-[10px] font-bold text-dark-700 uppercase tracking-wider truncate">{displayScores.home_participant}</p>
              <div />
              <p className="text-[10px] font-bold text-dark-700 uppercase tracking-wider text-right truncate">{displayScores.away_participant}</p>
            </div>
            {groupedTimeline.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-px flex-1 bg-dark-100" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400 px-2">{group.label}</span>
                  <div className="h-px flex-1 bg-dark-100" />
                </div>
                <div className="space-y-2">
                  {group.events.map((item) => {
                    const cfg = timelineTypeConfig[item.type];
                    const isHome = item.team === 'home';
                    return (
                      <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="grid grid-cols-[1fr_44px_1fr] items-center gap-2 group">
                        {/* Home side */}
                        <div className={`flex items-center gap-2 justify-end rounded-xl px-2.5 py-2 transition-colors ${isHome ? 'bg-dark-50/60 border border-dark-100' : ''}`}>
                          {isHome && (
                            <>
                              <div className="text-right min-w-0 flex-1">
                                <p className="text-xs font-semibold text-dark-800 truncate">{item.playerName}</p>
                                {item.playerNameSecondary && <p className="text-[9px] text-dark-400 truncate">{supportsAssist(item.type) ? `assist: ${item.playerNameSecondary}` : item.playerNameSecondary}</p>}
                                <p className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</p>
                              </div>
                              <span className="text-base shrink-0">{cfg.icon}</span>
                            </>
                          )}
                        </div>
                        {/* Minute */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-11 h-11 rounded-xl bg-white border border-dark-150 flex items-center justify-center shadow-sm">
                            <span className="text-[10px] font-extrabold text-dark-700 tabular-nums">{item.minute}'</span>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditTimeline(item)} className="p-0.5 rounded text-dark-300 hover:text-court-600"><Pencil size={9} /></button>
                            <button onClick={() => handleDeleteTimeline(item.id)} className="p-0.5 rounded text-dark-300 hover:text-red-500"><Trash2 size={9} /></button>
                          </div>
                        </div>
                        {/* Away side */}
                        <div className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${!isHome ? 'bg-court-50/40 border border-court-100' : ''}`}>
                          {!isHome && (
                            <>
                              <span className="text-base shrink-0">{cfg.icon}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-dark-800 truncate">{item.playerName}</p>
                                {item.playerNameSecondary && <p className="text-[9px] text-dark-400 truncate">{supportsAssist(item.type) ? `assist: ${item.playerNameSecondary}` : item.playerNameSecondary}</p>}
                                <p className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Visual timeline view ── */
          (() => {
            const periodsCount = matchFormat === 'set' ? 1 : matchFormat === 'halves' ? 2 : 4;
            const totalMin = periodDuration * periodsCount;
            const displayTotal = totalMin + 8;
            const getPos = (m: number) => `${Math.min((m / displayTotal) * 100, 97)}%`;
            const boundaries = matchFormat === 'set' ? [] : matchFormat === 'halves' ? [periodDuration] : [periodDuration, periodDuration * 2, periodDuration * 3];
            const homeGoals = sortedTimeline.filter(e => ['goal', 'penalty', 'free_kick'].includes(e.type) && e.team === 'home');
            const awayGoals = sortedTimeline.filter(e => ['goal', 'penalty', 'free_kick'].includes(e.type) && e.team === 'away');
            const otherEvents = sortedTimeline.filter(e => !['goal', 'penalty', 'free_kick'].includes(e.type));
            return (
              <div className="p-5 space-y-5">
                {/* Visual bar with team labels on the Y axis */}
                <div className="relative mx-2" style={{ height: '130px' }}>
                  {/* Home label — above the line */}
                  <div className="absolute left-0 top-0 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-dark-700 shrink-0" />
                    <p className="text-[10px] font-bold text-dark-700 truncate max-w-[140px]">{displayScores.home_participant}</p>
                    <span className="text-[9px] text-dark-400">(above)</span>
                  </div>
                  {/* Away label — below the line */}
                  <div className="absolute left-0 bottom-0 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm bg-court-500 shrink-0" />
                    <p className="text-[10px] font-bold text-court-700 truncate max-w-[140px]">{displayScores.away_participant}</p>
                    <span className="text-[9px] text-dark-400">(below)</span>
                  </div>
                  {/* Centre line — vertically centred in the 130px box */}
                  <div className="absolute left-0 right-0 h-px bg-dark-200" style={{ top: '65px' }} />

                  {/* Start cap */}
                  <div className="absolute -translate-x-0 flex flex-col items-center" style={{ left: 0, top: '57px' }}>
                    <div className="w-px h-9 bg-dark-400" />
                    <span className="text-[8px] font-bold text-dark-400 mt-0.5">0'</span>
                  </div>

                  {/* Period boundaries */}
                  {boundaries.map(m => (
                    <div key={m} className="absolute flex flex-col items-center -translate-x-1/2" style={{ left: getPos(m), top: '54px' }}>
                      <div className="w-px h-12 bg-dark-300" />
                      <span className="text-[7px] text-dark-400 mt-0.5 whitespace-nowrap">{m}'</span>
                    </div>
                  ))}

                  {/* End cap */}
                  <div className="absolute flex flex-col items-center" style={{ right: 0, top: '57px' }}>
                    <div className="w-px h-9 bg-dark-400" />
                    <span className="text-[8px] font-bold text-dark-400 mt-0.5 whitespace-nowrap">{totalMin}'</span>
                  </div>

                  {/* Events */}
                  {sortedTimeline.map((item) => {
                    const cfg = timelineTypeConfig[item.type];
                    const isHome = item.team === 'home';
                    return (
                      <div key={item.id}
                        className="absolute -translate-x-1/2 flex flex-col items-center"
                        style={{ left: getPos(item.minute), top: isHome ? '18px' : '68px' }}
                        title={`${item.minute}' · ${cfg.label} · ${item.playerName}`}
                      >
                        {isHome ? (
                          <>
                            <span className="text-[7px] font-bold text-dark-500 whitespace-nowrap leading-none mb-0.5">{item.minute}'</span>
                            <span className="text-base leading-none">{cfg.icon}</span>
                            <div className="w-px h-3 bg-dark-300 mt-0.5" />
                          </>
                        ) : (
                          <>
                            <div className="w-px h-3 bg-dark-300 mb-0.5" />
                            <span className="text-base leading-none">{cfg.icon}</span>
                            <span className="text-[7px] font-bold text-dark-500 whitespace-nowrap leading-none mt-0.5">{item.minute}'</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Scorer lists */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dark-100">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1">Goals</p>
                    {homeGoals.length === 0
                      ? <p className="text-xs text-dark-300 italic">—</p>
                      : homeGoals.map((e, i) => (
                          <div key={e.id} className="flex items-baseline gap-1">
                            <span className="text-[10px] text-dark-400">{i + 1}.</span>
                            <span className="text-xs font-semibold text-dark-800">{e.playerName}</span>
                            <span className="text-[10px] text-dark-400">{e.minute}'</span>
                            {e.playerNameSecondary && <span className="text-[9px] text-dark-300">(assist: {e.playerNameSecondary})</span>}
                          </div>
                        ))
                    }
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1">Goals</p>
                    {awayGoals.length === 0
                      ? <p className="text-xs text-dark-300 italic">—</p>
                      : awayGoals.map((e, i) => (
                          <div key={e.id} className="flex items-baseline gap-1 justify-end">
                            {e.playerNameSecondary && <span className="text-[9px] text-dark-300">(assist: {e.playerNameSecondary})</span>}
                            <span className="text-[10px] text-dark-400">{e.minute}'</span>
                            <span className="text-xs font-semibold text-dark-800">{e.playerName}</span>
                            <span className="text-[10px] text-dark-400">{i + 1}.</span>
                          </div>
                        ))
                    }
                  </div>
                </div>

                {/* Other events (cards, subs, etc.) */}
                {otherEvents.length > 0 && (
                  <div className="pt-3 border-t border-dark-100">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-2">Other Events</p>
                    <div className="flex flex-wrap gap-1.5">
                      {otherEvents.map(e => {
                        const cfg = timelineTypeConfig[e.type];
                        return (
                          <span key={e.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon} {e.playerName} {e.minute}'
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* ── Waiting state ──────────────────────── */}
      {!hasResult && !editing && (
        <div className="bg-white border border-dark-100 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-dark-50 flex items-center justify-center mx-auto mb-3">
            <Clock size={20} className="text-dark-300" />
          </div>
          <p className="text-sm font-semibold text-dark-600 mb-1">
            {scores.match_status === 'scheduled' ? 'Match not yet played' :
             scores.match_status === 'postponed' ? 'Match postponed' :
             scores.match_status === 'cancelled' ? 'Match cancelled' :
             'Score not entered'}
          </p>
          <p className="text-xs text-dark-400">
            {scores.match_status === 'scheduled' && 'Scores will be available once the match is live or completed.'}
            {scores.match_status === 'postponed' && 'This match has been postponed. A new date will be announced.'}
            {scores.match_status === 'cancelled' && 'This match has been cancelled.'}
            {scores.match_status === 'not_entered' && 'Click "Edit Score" to enter the match result.'}
          </p>
        </div>
      )}
    </div>
  );
}