import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, X, Pencil, Trash2, Calendar, Tag } from 'lucide-react';
import { seasons } from '@/data/seasons';
import { settingsActivities, activityAttributes } from '@/data/settings';
import {
  plannerCycles as initialCycles,
  plannerBlocks as initialBlocks,
  trackGroups as initialTrackGroups,
  tracks as initialTracks,
  dayPlans as initialDayPlans,
  PlannerCycle, PlannerBlock, TrackGroup, Track, DayPlan,
} from '@/data/planner';
import TimelineHeader from '@/components/planner/TimelineHeader';
import CycleRow from '@/components/planner/CycleRow';
import TrackGroupSection from '@/components/planner/TrackGroupSection';
import WeekView from '@/components/planner/WeekView';
import CycleModal from '@/components/planner/CycleModal';
import TrackGroupModal from '@/components/planner/TrackGroupModal';
import TrackModal from '@/components/planner/TrackModal';
import BlockModal from '@/components/planner/BlockModal';
import DayPlanDrawer from '@/components/planner/DayPlanDrawer';

export type ViewMode = 'month' | 'quarter' | 'year' | 'week';

type DetailPanel =
  | { type: 'block'; block: PlannerBlock }
  | { type: 'track'; trackId: string }
  | null;

export default function PlannerModule() {
  // State
  const [selectedActivityId, setSelectedActivityId] = useState('act-football');
  const activitySeasons = seasons.filter(s => s.activityId === selectedActivityId);
  const [selectedSeasonId, setSelectedSeasonId] = useState(activitySeasons[0]?.id || '');
  const selectedSeason = seasons.find(s => s.id === selectedSeasonId);

  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>('');
  const [periodOffset, setPeriodOffset] = useState(0);

  // Data state
  const [cycles, setCycles] = useState<PlannerCycle[]>(initialCycles);
  const [blocks, setBlocks] = useState<PlannerBlock[]>(initialBlocks);
  const [tGroups, setTGroups] = useState<TrackGroup[]>(initialTrackGroups);
  const [tTracks, setTTracks] = useState<Track[]>(initialTracks);
  const [dPlans, setDPlans] = useState<DayPlan[]>(initialDayPlans);

  // Modals
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editCycle, setEditCycle] = useState<PlannerCycle | null>(null);
  const [showTrackGroupModal, setShowTrackGroupModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [activeTrackGroupId, setActiveTrackGroupId] = useState<string>('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const [editBlock, setEditBlock] = useState<PlannerBlock | null>(null);
  const [showDayPlanDrawer, setShowDayPlanDrawer] = useState(false);
  const [editDayPlan, setEditDayPlan] = useState<DayPlan | null>(null);
  const [dayPlanDefaults, setDayPlanDefaults] = useState<{ trackId: string; date: string } | null>(null);

  // Detail panel
  const [detailPanel, setDetailPanel] = useState<DetailPanel>(null);

  // Filtered data by season
  const seasonCycles = useMemo(() => cycles.filter(c => c.seasonId === selectedSeasonId), [cycles, selectedSeasonId]);
  const seasonGroups = useMemo(() => tGroups.filter(g => g.seasonId === selectedSeasonId), [tGroups, selectedSeasonId]);
  const seasonTracks = useMemo(() => {
    const groupIds = new Set(seasonGroups.map(g => g.id));
    return tTracks.filter(t => groupIds.has(t.trackGroupId));
  }, [tTracks, seasonGroups]);
  const seasonBlocks = useMemo(() => {
    const trackIds = new Set(seasonTracks.map(t => t.id));
    return blocks.filter(b => trackIds.has(b.trackId));
  }, [blocks, seasonTracks]);
  const seasonDayPlans = useMemo(() => {
    const trackIds = new Set(seasonTracks.map(t => t.id));
    return dPlans.filter(dp => trackIds.has(dp.trackId));
  }, [dPlans, seasonTracks]);

  // Timeline calculations
  const seasonStart = selectedSeason ? new Date(selectedSeason.startDate) : new Date();
  const seasonEnd = selectedSeason ? new Date(selectedSeason.endDate) : new Date();

  // View mode change resets period offset
  const changeViewMode = (v: ViewMode) => {
    setViewMode(v);
    setPeriodOffset(0);
  };

  // Period label for M/Q
  const getPeriodLabel = () => {
    const now = new Date();
    if (viewMode === 'month') {
      const target = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
      return target.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'quarter') {
      const baseQ = Math.floor(now.getMonth() / 3) + periodOffset;
      const targetYear = now.getFullYear() + Math.floor(baseQ / 4);
      const targetQ = ((baseQ % 4) + 4) % 4;
      return `Q${targetQ + 1} ${targetYear}`;
    }
    return '';
  };

  // Navigate to today
  const handleToday = () => {
    if (viewMode === 'week') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      setSelectedWeekStart(monday.toISOString().split('T')[0]);
    } else {
      setPeriodOffset(0);
    }
  };

  // Week navigation
  const navigateWeek = (dir: number) => {
    if (!selectedWeekStart) return;
    const d = new Date(selectedWeekStart);
    d.setDate(d.getDate() + dir * 7);
    setSelectedWeekStart(d.toISOString().split('T')[0]);
  };

  const handleWeekClick = (weekStart: string) => {
    setSelectedWeekStart(weekStart);
    setViewMode('week');
  };

  const handleOpenDayPlan = (trackId: string, date: string) => {
    const existing = seasonDayPlans.find(dp => dp.trackId === trackId && dp.date === date);
    if (existing) {
      setEditDayPlan(existing);
      setDayPlanDefaults(null);
    } else {
      setEditDayPlan(null);
      setDayPlanDefaults({ trackId, date });
    }
    setShowDayPlanDrawer(true);
  };

  // Detail panel handlers
  const handleClickBlock = useCallback((block: PlannerBlock) => {
    setDetailPanel({ type: 'block', block });
  }, []);

  const handleClickTrack = useCallback((trackId: string) => {
    setDetailPanel({ type: 'track', trackId });
  }, []);

  // CRUD handlers
  const handleSaveCycle = (c: PlannerCycle) => {
    if (editCycle) {
      setCycles(prev => prev.map(x => x.id === c.id ? c : x));
    } else {
      setCycles(prev => [...prev, c]);
    }
    setShowCycleModal(false);
    setEditCycle(null);
  };

  const handleSaveTrackGroup = (g: TrackGroup) => {
    setTGroups(prev => [...prev, g]);
    setShowTrackGroupModal(false);
  };

  const handleSaveTrack = (t: Track) => {
    setTTracks(prev => [...prev, t]);
    setShowTrackModal(false);
  };

  const handleSaveBlock = (b: PlannerBlock) => {
    if (editBlock) {
      setBlocks(prev => prev.map(x => x.id === b.id ? b : x));
    } else {
      setBlocks(prev => [...prev, b]);
    }
    setShowBlockModal(false);
    setEditBlock(null);
  };

  const handleSaveDayPlan = (dp: DayPlan) => {
    if (editDayPlan) {
      setDPlans(prev => prev.map(x => x.id === dp.id ? dp : x));
    } else {
      setDPlans(prev => [...prev, dp]);
    }
    setShowDayPlanDrawer(false);
    setEditDayPlan(null);
    setDayPlanDefaults(null);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    setDetailPanel(null);
  };

  const handleDeleteTrack = (trackId: string) => {
    setTTracks(prev => prev.filter(t => t.id !== trackId));
    setBlocks(prev => prev.filter(b => b.trackId !== trackId));
    setDPlans(prev => prev.filter(dp => dp.trackId !== trackId));
    setDetailPanel(null);
  };

  const handleAddBlock = useCallback((trackId: string) => {
    setActiveTrackId(trackId);
    setEditBlock(null);
    setShowBlockModal(true);
  }, []);

  const handleAddTrack = useCallback((groupId: string) => {
    setActiveTrackGroupId(groupId);
    setShowTrackModal(true);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-dark-900">Planner</h1>
        <div className="flex items-center gap-3">
          <select value={selectedSeasonId} onChange={e => setSelectedSeasonId(e.target.value)}
            className="h-9 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-700 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
            {activitySeasons.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.status === 'active' ? ' (Current season)' : ''}</option>
            ))}
          </select>
          <select value={selectedActivityId} onChange={e => { setSelectedActivityId(e.target.value); const s = seasons.filter(s => s.activityId === e.target.value); if (s.length) setSelectedSeasonId(s[0].id); }}
            className="h-9 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-700 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
            {settingsActivities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={() => setShowTrackGroupModal(true)}
            className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
            <Plus size={15} /> Add Track Group
          </button>
        </div>
      </div>

      {/* View toggles + navigation */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-dark-100/60 rounded-xl p-0.5">
          {(['month', 'quarter', 'year'] as const).map(v => (
            <button key={v} onClick={() => changeViewMode(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === v ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
              {v === 'month' ? 'M' : v === 'quarter' ? 'Q' : 'Year'}
            </button>
          ))}
        </div>
        <button onClick={handleToday}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-dark-600 hover:bg-dark-50 border border-dark-200">
          Today
        </button>
        {/* M/Q period navigation */}
        {(viewMode === 'month' || viewMode === 'quarter') && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPeriodOffset(p => p - 1)} className="p-1 rounded-lg hover:bg-dark-50 text-dark-400"><ChevronLeft size={16} /></button>
            <span className="text-xs font-semibold text-dark-600 min-w-[120px] text-center">{getPeriodLabel()}</span>
            <button onClick={() => setPeriodOffset(p => p + 1)} className="p-1 rounded-lg hover:bg-dark-50 text-dark-400"><ChevronRight size={16} /></button>
          </div>
        )}
        {/* Week navigation */}
        {viewMode === 'week' && (
          <div className="flex items-center gap-1">
            <button onClick={() => navigateWeek(-1)} className="p-1 rounded-lg hover:bg-dark-50 text-dark-400"><ChevronLeft size={16} /></button>
            <span className="text-xs font-semibold text-dark-600 min-w-[140px] text-center">
              {selectedWeekStart && (() => {
                const start = new Date(selectedWeekStart);
                const end = new Date(start);
                end.setDate(end.getDate() + 6);
                return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
              })()}
            </span>
            <button onClick={() => navigateWeek(1)} className="p-1 rounded-lg hover:bg-dark-50 text-dark-400"><ChevronRight size={16} /></button>
            <button onClick={() => changeViewMode('year')} className="ml-2 px-2 py-1 rounded-lg text-[10px] font-bold text-dark-400 hover:bg-dark-50 border border-dark-200">
              Back to Timeline
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex gap-4">
        {/* Timeline / Week view */}
        <div className="flex-1 min-w-0">
          {viewMode !== 'week' ? (
            <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
              <div className={viewMode !== 'year' ? 'overflow-x-auto' : ''}>
                <div style={viewMode !== 'year' ? { minWidth: 'max-content' } : {}}>
                  <TimelineHeader
                    seasonStart={seasonStart}
                    seasonEnd={seasonEnd}
                    viewMode={viewMode}
                    periodOffset={periodOffset}
                    onWeekClick={handleWeekClick}
                  />
                  <CycleRow
                    cycles={seasonCycles}
                    seasonStart={seasonStart}
                    seasonEnd={seasonEnd}
                    viewMode={viewMode}
                    periodOffset={periodOffset}
                    onAddCycle={() => { setEditCycle(null); setShowCycleModal(true); }}
                    onEditCycle={(c) => { setEditCycle(c); setShowCycleModal(true); }}
                  />
                  {seasonGroups.map(group => (
                    <TrackGroupSection
                      key={group.id}
                      group={group}
                      tracks={seasonTracks.filter(t => t.trackGroupId === group.id)}
                      blocks={seasonBlocks}
                      dayPlans={seasonDayPlans}
                      seasonStart={seasonStart}
                      seasonEnd={seasonEnd}
                      viewMode={viewMode}
                      periodOffset={periodOffset}
                      onAddTrack={() => handleAddTrack(group.id)}
                      onAddBlock={handleAddBlock}
                      onClickBlock={handleClickBlock}
                      onClickTrack={handleClickTrack}
                    />
                  ))}
                  {seasonGroups.length === 0 && (
                    <div className="flex items-center justify-center py-20 text-dark-400 text-sm">
                      No track groups yet. Click "+ Add Track Group" to get started.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <WeekView
              weekStart={selectedWeekStart}
              tracks={seasonTracks}
              trackGroups={seasonGroups}
              dayPlans={seasonDayPlans}
              cycles={seasonCycles}
              blocks={seasonBlocks}
              onCellClick={handleOpenDayPlan}
            />
          )}
        </div>

        {/* Detail side panel */}
        <AnimatePresence>
          {detailPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-[320px] shrink-0 bg-white rounded-2xl border border-dark-100 overflow-hidden self-start"
            >
              {detailPanel.type === 'block' && (
                <BlockDetailPanel
                  block={detailPanel.block}
                  cycles={seasonCycles}
                  tracks={seasonTracks}
                  onClose={() => setDetailPanel(null)}
                  onEdit={() => {
                    setEditBlock(detailPanel.block);
                    setActiveTrackId(detailPanel.block.trackId);
                    setShowBlockModal(true);
                  }}
                  onDelete={() => handleDeleteBlock(detailPanel.block.id)}
                />
              )}
              {detailPanel.type === 'track' && (
                <TrackDetailPanel
                  track={seasonTracks.find(t => t.id === detailPanel.trackId)!}
                  trackGroup={seasonGroups.find(g => seasonTracks.find(t => t.id === detailPanel.trackId)?.trackGroupId === g.id)}
                  blocks={seasonBlocks.filter(b => b.trackId === detailPanel.trackId)}
                  onClose={() => setDetailPanel(null)}
                  onDelete={() => handleDeleteTrack(detailPanel.trackId)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {showCycleModal && (
        <CycleModal cycle={editCycle} seasonId={selectedSeasonId}
          onClose={() => { setShowCycleModal(false); setEditCycle(null); }} onSave={handleSaveCycle} />
      )}
      {showTrackGroupModal && (
        <TrackGroupModal seasonId={selectedSeasonId}
          onClose={() => setShowTrackGroupModal(false)} onSave={handleSaveTrackGroup} />
      )}
      {showTrackModal && (
        <TrackModal trackGroupId={activeTrackGroupId} activityId={selectedActivityId}
          onClose={() => setShowTrackModal(false)} onSave={handleSaveTrack} />
      )}
      {showBlockModal && (
        <BlockModal block={editBlock} trackId={activeTrackId} cycles={seasonCycles} activityId={selectedActivityId}
          onClose={() => { setShowBlockModal(false); setEditBlock(null); }} onSave={handleSaveBlock} />
      )}
      {showDayPlanDrawer && (
        <DayPlanDrawer dayPlan={editDayPlan} defaults={dayPlanDefaults} tracks={seasonTracks} cycles={seasonCycles} blocks={seasonBlocks} activityId={selectedActivityId}
          onClose={() => { setShowDayPlanDrawer(false); setEditDayPlan(null); setDayPlanDefaults(null); }} onSave={handleSaveDayPlan} />
      )}
    </motion.div>
  );
}

// ── Detail Panels ──────────────────────────────────────

function BlockDetailPanel({ block, cycles, tracks, onClose, onEdit, onDelete }: {
  block: PlannerBlock; cycles: PlannerCycle[]; tracks: Track[];
  onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const cycle = cycles.find(c => c.id === block.cycleId);
  const track = tracks.find(t => t.id === block.trackId);
  const attrs = block.attributeIds.map(id => activityAttributes.find(a => a.id === id)).filter(Boolean);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
        <h3 className="text-sm font-bold text-dark-900">Block Details</h3>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={14} /></button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={14} /></button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: block.color }} />
            <span className="text-base font-bold text-dark-800">{block.name}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-50/60 rounded-lg p-2.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-0.5">Cycle</div>
            <div className="flex items-center gap-1.5">
              {cycle && <div className="w-2 h-2 rounded" style={{ backgroundColor: cycle.color }} />}
              <span className="text-[11px] font-semibold text-dark-700">{cycle?.name || '–'}</span>
            </div>
          </div>
          <div className="bg-dark-50/60 rounded-lg p-2.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-0.5">Track</div>
            <span className="text-[11px] font-semibold text-dark-700">{track?.name || '–'}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-50/60 rounded-lg p-2.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-0.5">Start</div>
            <div className="flex items-center gap-1"><Calendar size={10} className="text-dark-400" /><span className="text-[11px] text-dark-600">{new Date(block.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          </div>
          <div className="bg-dark-50/60 rounded-lg p-2.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-0.5">End</div>
            <div className="flex items-center gap-1"><Calendar size={10} className="text-dark-400" /><span className="text-[11px] text-dark-600">{new Date(block.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
          </div>
        </div>
        {attrs.length > 0 && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Attributes</div>
            <div className="flex flex-wrap gap-1">
              {attrs.map(a => a && (
                <span key={a.id} className="flex items-center gap-1 px-2 py-0.5 bg-court-50 text-court-700 rounded text-[10px] font-semibold">
                  <Tag size={8} />{a.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TrackDetailPanel({ track, trackGroup, blocks, onClose, onDelete }: {
  track: Track; trackGroup?: TrackGroup; blocks: PlannerBlock[];
  onClose: () => void; onDelete: () => void;
}) {
  const attrs = track.attributeIds.map(id => activityAttributes.find(a => a.id === id)).filter(Boolean);

  if (!track) return null;

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
        <h3 className="text-sm font-bold text-dark-900">Track Details</h3>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={14} /></button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={14} /></button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <span className="text-base font-bold text-dark-800">{track.name}</span>
          {trackGroup && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: trackGroup.color }} />
              <span className="text-[11px] text-dark-500">{trackGroup.name}</span>
            </div>
          )}
        </div>
        {attrs.length > 0 && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Attributes</div>
            <div className="flex flex-wrap gap-1">
              {attrs.map(a => a && (
                <span key={a.id} className="flex items-center gap-1 px-2 py-0.5 bg-court-50 text-court-700 rounded text-[10px] font-semibold">
                  <Tag size={8} />{a.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Blocks ({blocks.length})</div>
          {blocks.length > 0 ? (
            <div className="space-y-1">
              {blocks.map(b => (
                <div key={b.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-dark-50/60 rounded-lg">
                  <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: b.color }} />
                  <span className="text-[11px] font-medium text-dark-700 flex-1">{b.name}</span>
                  <span className="text-[9px] text-dark-400">{new Date(b.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {new Date(b.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-dark-300">No blocks yet.</p>
          )}
        </div>
        {(track.userIds.length > 0 || track.teamIds.length > 0) && (
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Assigned</div>
            <p className="text-[11px] text-dark-600">{track.userIds.length} user{track.userIds.length !== 1 ? 's' : ''}, {track.teamIds.length} team{track.teamIds.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </>
  );
}

