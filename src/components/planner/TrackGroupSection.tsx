import React, { useState } from 'react';
import { ChevronDown, Plus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TrackGroup, Track, PlannerBlock, DayPlan } from '@/data/planner';
import type { ViewMode } from '@/pages/PlannerModule';
import TrackRow from './TrackRow';
import { SIDEBAR_WIDTH } from './TimelineHeader';

interface TrackGroupSectionProps {
  group: TrackGroup;
  tracks: Track[];
  blocks: PlannerBlock[];
  dayPlans: DayPlan[];
  seasonStart: Date;
  seasonEnd: Date;
  viewMode: ViewMode;
  periodOffset: number;
  onAddTrack: () => void;
  onAddBlock: (trackId: string) => void;
  onClickBlock: (block: PlannerBlock) => void;
  onClickTrack: (trackId: string) => void;
}

export default function TrackGroupSection({
  group, tracks, blocks, dayPlans, seasonStart, seasonEnd, viewMode, periodOffset, onAddTrack, onAddBlock, onClickBlock, onClickTrack,
}: TrackGroupSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      {/* Group header */}
      <div className="flex border-b border-dark-100 bg-dark-50/40 hover:bg-dark-50/60 transition-colors">
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 cursor-pointer sticky left-0 z-20 bg-dark-50/40 border-r border-dark-100" style={{ width: SIDEBAR_WIDTH }}
          onClick={() => setExpanded(!expanded)}>
          <Users size={14} style={{ color: group.color }} />
          <span className="text-xs font-bold text-dark-700 flex-1">{group.name}</span>
          <button onClick={e => { e.stopPropagation(); onAddTrack(); }}
            className="p-0.5 rounded hover:bg-dark-200 text-dark-400 hover:text-court-500 transition-colors">
            <Plus size={13} />
          </button>
          <ChevronDown size={14} className={`text-dark-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
        <div className="flex-1" />
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {tracks.map(track => (
              <TrackRow
                key={track.id}
                trackName={track.name}
                trackId={track.id}
                blocks={blocks}
                dayPlans={dayPlans}
                seasonStart={seasonStart}
                seasonEnd={seasonEnd}
                viewMode={viewMode}
                periodOffset={periodOffset}
                onAddBlock={onAddBlock}
                onClickBlock={onClickBlock}
                onClickTrack={onClickTrack}
                indent
              />
            ))}
            {tracks.length === 0 && (
              <div className="flex border-b border-dark-50">
                <div className="shrink-0 sticky left-0 z-20 bg-white border-r border-dark-100" style={{ width: SIDEBAR_WIDTH }} />
                <div className="flex-1 py-4 text-center text-[11px] text-dark-300">
                  No tracks yet. Click + to add one.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
