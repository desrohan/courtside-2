import { useState } from 'react';
import { EventHistoryEntry } from '@/data/events';
import { format, parseISO } from 'date-fns';
import { Plus, Pencil, Globe, Eye, EyeOff, BellRing, BellOff, ArrowRight, Star, UserCog, Users, ChevronDown } from 'lucide-react';

interface Props {
  entries: EventHistoryEntry[];
}

const actionConfig: Record<EventHistoryEntry['action'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  created:              { label: 'Created',              color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   icon: <Plus size={12} /> },
  updated:              { label: 'Updated',              color: 'text-court-600',  bg: 'bg-court-50 border-court-200',   icon: <Pencil size={12} /> },
  published:            { label: 'Published',            color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', icon: <Globe size={12} /> },
  unpublished:          { label: 'Unpublished',          color: 'text-dark-500',   bg: 'bg-dark-50 border-dark-200',     icon: <EyeOff size={12} /> },
  submitted_for_review: { label: 'Submitted for Review', color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',   icon: <Eye size={12} /> },
  rated:                { label: 'Coach Ratings',        color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: <Users size={12} /> },
  self_rated:           { label: 'Self Ratings',         color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', icon: <UserCog size={12} /> },
};

const dotColor: Record<EventHistoryEntry['action'], string> = {
  created:              'bg-green-500',
  updated:              'bg-court-500',
  published:            'bg-violet-500',
  unpublished:          'bg-dark-400',
  submitted_for_review: 'bg-amber-500',
  rated:                'bg-yellow-400',
  self_rated:           'bg-indigo-500',
};

function StarRow({ value, size = 11 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size} className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-dark-200'} />
      ))}
      <span className="text-[10px] font-bold text-dark-600 ml-0.5">{value}</span>
    </div>
  );
}

export default function HistoryTab({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-dark-400">No history recorded for this event.</p>
      </div>
    );
  }

  // Group all `rated` entries into a single merged item; keep others as-is
  const coachRatingEntries = sorted.filter(e => e.action === 'rated');
  const otherEntries = sorted.filter(e => e.action !== 'rated');

  // Build the display list: insert one merged coach-ratings item where the first `rated` entry would appear
  type DisplayItem =
    | { type: 'entry'; entry: EventHistoryEntry }
    | { type: 'merged_rated'; entries: EventHistoryEntry[] };

  const displayItems: DisplayItem[] = [];
  let ratingInserted = false;

  for (const entry of sorted) {
    if (entry.action === 'rated') {
      if (!ratingInserted) {
        displayItems.push({ type: 'merged_rated', entries: coachRatingEntries });
        ratingInserted = true;
      }
      // Skip all subsequent `rated` entries — they're inside the merged item
    } else {
      displayItems.push({ type: 'entry', entry });
    }
  }

  const MERGED_ID = '__coach_ratings__';
  const isMergedExpanded = expandedIds.has(MERGED_ID);

  return (
    <div className="space-y-0 relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-dark-200" />

      {displayItems.map((item, idx) => {
        if (item.type === 'merged_rated') {
          const rEntries = item.entries;
          const totalPlayers = rEntries.reduce((s, e) => s + (e.ratings?.length ?? 0), 0);
          const cfg = actionConfig['rated'];

          return (
            <div key={MERGED_ID} className="relative flex gap-4 py-3">
              {/* Timeline dot */}
              <div className="relative z-10 shrink-0 w-[31px] flex justify-center pt-0.5">
                <div className={`w-3 h-3 rounded-full ${dotColor['rated']} ring-[3px] ring-white`} />
              </div>

              <div className="flex-1 min-w-0 -mt-0.5">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span className="text-[10px] text-dark-400 font-medium">{rEntries.length} sessions · {totalPlayers} ratings</span>
                </div>

                {/* Collapsed: one chip per session */}
                <div className="mt-2 space-y-1.5">
                  {rEntries.map(e => {
                    const ts = parseISO(e.timestamp);
                    const playerCount = e.ratings?.length ?? 0;
                    return (
                      <div key={e.id} className="flex items-start gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                          <span className="text-[10px] font-semibold text-dark-700 shrink-0">{e.userName}</span>
                          <span className="text-[10px] text-dark-400 shrink-0">&middot; {format(ts, 'MMM d')} at {format(ts, 'h:mm a')}</span>
                          <span className="text-[10px] text-dark-400 shrink-0">· {playerCount} player{playerCount !== 1 ? 's' : ''}</span>
                          {/* Compact player chips */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {(e.ratings ?? []).map(r => (
                              <span key={r.playerId} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border bg-dark-50 border-dark-100">
                                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                                  <span className="text-[7px] font-bold text-white">{r.playerAvatar}</span>
                                </span>
                                <span className="font-semibold text-dark-700">{r.playerName.split(' ').slice(-1)[0]}</span>
                                {r.overall != null && <span className="font-bold text-yellow-600">★{r.overall}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggle(MERGED_ID)}
                  className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-dark-400 hover:text-dark-700 transition-colors"
                >
                  <ChevronDown size={11} className={`transition-transform duration-200 ${isMergedExpanded ? 'rotate-180' : ''}`} />
                  {isMergedExpanded ? 'Hide details' : 'Show details'}
                </button>

                {/* Expanded: per-session detail cards */}
                {isMergedExpanded && (
                  <div className="mt-2 space-y-3">
                    {rEntries.map(e => {
                      const ts = parseISO(e.timestamp);
                      return (
                        <div key={e.id} className="rounded-xl border border-dark-100 overflow-hidden">
                          {/* Session header */}
                          <div className="px-3 py-2 bg-dark-50/60 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-dark-700">{e.userName}</span>
                            <span className="text-[10px] text-dark-400">&middot; {format(ts, 'MMM d, yyyy')} at {format(ts, 'h:mm a')}</span>
                            <span className="text-[10px] text-dark-400 ml-auto">{e.ratings?.length ?? 0} players</span>
                          </div>
                          {/* Player cards */}
                          <div className="p-2 space-y-1.5">
                            {(e.ratings ?? []).map(r => (
                              <div key={r.playerId} className="rounded-lg border border-dark-100 bg-white px-3 py-2 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                                      <span className="text-[8px] font-bold text-white">{r.playerAvatar}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-semibold text-dark-800">{r.playerName}</span>
                                      {r.position && <span className="text-[10px] text-dark-400 ml-1.5">#{r.jerseyNumber} {r.position}</span>}
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${r.mode === 'advanced' ? 'bg-violet-100 text-violet-600' : r.mode === 'dimensional' ? 'bg-court-50 text-court-600' : 'bg-dark-100 text-dark-500'}`}>
                                      {r.mode}
                                    </span>
                                  </div>
                                  {r.overall != null && <StarRow value={r.overall} />}
                                </div>
                                {r.dimensions && r.dimensions.some(d => d.value !== null) && (
                                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    {r.dimensions.map(d => d.value !== null && (
                                      <span key={d.key} className="flex items-center gap-0.5 text-[10px]">
                                        <span className="font-bold" style={{ color: d.color }}>{d.label.substring(0, 4)}</span>
                                        <span className="text-dark-600 font-semibold ml-0.5">{d.value}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {r.comment && <p className="text-[10px] text-dark-400 italic mt-1">"{r.comment}"</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Regular entry
        const { entry } = item;
        const cfg = actionConfig[entry.action];
        const ts = parseISO(entry.timestamp);
        const isRating = entry.action === 'self_rated';
        const isSelf = entry.action === 'self_rated';
        const isExpanded = expandedIds.has(entry.id);
        const hasRatings = isRating && entry.ratings && entry.ratings.length > 0;

        return (
          <div key={entry.id} className="relative flex gap-4 py-3">
            <div className="relative z-10 shrink-0 w-[31px] flex justify-center pt-0.5">
              <div className={`w-3 h-3 rounded-full ${dotColor[entry.action]} ring-[3px] ring-white`} />
            </div>

            <div className="flex-1 min-w-0 -mt-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
                {!isRating && (
                  entry.notified
                    ? <span className="flex items-center gap-1 text-[10px] font-medium text-court-500"><BellRing size={10} /> Notified</span>
                    : <span className="flex items-center gap-1 text-[10px] font-medium text-dark-400"><BellOff size={10} /> Silent</span>
                )}
                {hasRatings && (
                  <span className="text-[10px] text-dark-400 font-medium">
                    {entry.ratings!.length} player{entry.ratings!.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <p className="text-xs text-dark-500 mt-1">
                <span className="font-semibold text-dark-700">{isSelf ? 'Players' : entry.userName}</span>
                {' '}&middot;{' '}
                {format(ts, 'MMM d, yyyy')} at {format(ts, 'h:mm a')}
              </p>

              {entry.changes && entry.changes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {entry.changes.map((change, ci) => (
                    <div key={ci} className="flex items-center gap-2 text-xs bg-dark-50 rounded-lg px-3 py-1.5">
                      <span className="font-semibold text-dark-600 shrink-0">{change.field}</span>
                      <span className="text-dark-400 truncate">{change.from}</span>
                      <ArrowRight size={10} className="text-dark-300 shrink-0" />
                      <span className="text-dark-700 font-medium truncate">{change.to}</span>
                    </div>
                  ))}
                </div>
              )}

              {hasRatings && (
                <>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.ratings!.map(r => (
                      <div key={r.playerId} className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] border ${isSelf ? 'bg-indigo-50 border-indigo-100' : 'bg-dark-50 border-dark-100'}`}>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isSelf ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-gradient-to-br from-court-400 to-court-600'}`}>
                          <span className="text-[7px] font-bold text-white">{r.playerAvatar}</span>
                        </div>
                        <span className="font-semibold text-dark-700">{r.playerName.split(' ').slice(-1)[0]}</span>
                        {r.overall != null && <span className={`font-bold ${isSelf ? 'text-indigo-500' : 'text-yellow-600'}`}>★{r.overall}</span>}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => toggle(entry.id)} className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-dark-400 hover:text-dark-700 transition-colors">
                    <ChevronDown size={11} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    {isExpanded ? 'Hide details' : 'Show details'}
                  </button>
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5">
                      {entry.ratings!.map(r => (
                        <div key={r.playerId} className={`rounded-lg border px-3 py-2 text-xs ${isSelf ? 'bg-indigo-50/40 border-indigo-100' : 'bg-dark-50 border-dark-100'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSelf ? 'bg-gradient-to-br from-indigo-400 to-indigo-600' : 'bg-gradient-to-br from-court-400 to-court-600'}`}>
                                <span className="text-[8px] font-bold text-white">{r.playerAvatar}</span>
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-dark-800">{r.playerName}</span>
                                {r.position && <span className="text-[10px] text-dark-400 ml-1.5">#{r.jerseyNumber} {r.position}</span>}
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${r.mode === 'advanced' ? 'bg-violet-100 text-violet-600' : r.mode === 'dimensional' ? 'bg-court-50 text-court-600' : 'bg-dark-100 text-dark-500'}`}>{r.mode}</span>
                            </div>
                            {r.overall != null && <StarRow value={r.overall} />}
                          </div>
                          {r.dimensions && r.dimensions.some(d => d.value !== null) && (
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {r.dimensions.map(d => d.value !== null && (
                                <span key={d.key} className="flex items-center gap-0.5 text-[10px]">
                                  <span className="font-bold" style={{ color: d.color }}>{d.label.substring(0, 4)}</span>
                                  <span className="text-dark-600 font-semibold ml-0.5">{d.value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {r.comment && <p className="text-[10px] text-dark-400 italic mt-1">"{r.comment}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
