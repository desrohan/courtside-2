import React from 'react';
import type { PlannerBlock, DayPlan } from '@/data/planner';
import type { ViewMode } from '@/pages/PlannerModule';
import { getTimelineWeeks, getWeekWidth, SIDEBAR_WIDTH } from './TimelineHeader';

interface TrackRowProps {
  trackName: string;
  trackId: string;
  blocks: PlannerBlock[];
  dayPlans: DayPlan[];
  seasonStart: Date;
  seasonEnd: Date;
  viewMode: ViewMode;
  periodOffset: number;
  onAddBlock: (trackId: string) => void;
  onClickBlock: (block: PlannerBlock) => void;
  onClickTrack: (trackId: string) => void;
  indent?: boolean;
}

// Calculate non-overlapping lanes for blocks
function assignLanes(blocks: PlannerBlock[]): { block: PlannerBlock; lane: number }[] {
  const sorted = [...blocks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const lanes: { endMs: number }[] = [];
  return sorted.map(block => {
    const startMs = new Date(block.startDate).getTime();
    let lane = lanes.findIndex(l => l.endMs <= startMs);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push({ endMs: 0 });
    }
    lanes[lane].endMs = new Date(block.endDate).getTime();
    return { block, lane };
  });
}

export default function TrackRow({ trackName, trackId, blocks, dayPlans, seasonStart, seasonEnd, viewMode, periodOffset, onAddBlock, onClickBlock, onClickTrack, indent }: TrackRowProps) {
  const weeks = getTimelineWeeks(seasonStart, seasonEnd, viewMode, periodOffset);
  const totalWeeks = weeks.length;
  if (totalWeeks === 0) return null;

  const timelineStart = weeks[0].weekStart.getTime();
  const timelineEnd = new Date(weeks[totalWeeks - 1].weekStart);
  timelineEnd.setDate(timelineEnd.getDate() + 7);
  const totalMs = timelineEnd.getTime() - timelineStart;

  const trackBlocks = blocks.filter(b => b.trackId === trackId);
  const trackDayPlans = dayPlans.filter(dp => dp.trackId === trackId);
  const laned = assignLanes(trackBlocks);
  const laneCount = laned.length > 0 ? Math.max(...laned.map(l => l.lane)) + 1 : 1;
  const blockHeight = 24;
  const blockGap = 2;
  const rowPadding = 6;
  const dynamicHeight = laneCount * (blockHeight + blockGap) - blockGap + rowPadding * 2;

  const weekPlanCounts = viewMode !== 'year' ? weeks.map(w => {
    const wEnd = new Date(w.weekStart);
    wEnd.setDate(wEnd.getDate() + 7);
    return trackDayPlans.filter(dp => { const d = new Date(dp.date); return d >= w.weekStart && d < wEnd; }).length;
  }) : [];

  const ww = getWeekWidth(viewMode);

  return (
    <div className="flex border-b border-dark-50 hover:bg-dark-50/20 transition-colors group">
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 sticky left-0 z-20 bg-white border-r border-dark-100" style={{ width: SIDEBAR_WIDTH }}>
        {indent && <div className="w-3" />}
        <button onClick={() => onClickTrack(trackId)} className="text-xs font-medium text-dark-600 truncate flex-1 text-left hover:text-court-600 transition-colors">{trackName}</button>
        <button onClick={() => onAddBlock(trackId)}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-dark-100 text-dark-300 hover:text-court-500 transition-all text-[10px] font-bold"
          title="Add block">+</button>
      </div>
      <div className="relative" style={{ ...(ww ? { width: totalWeeks * ww } : { flex: 1 }), height: Math.max(36, dynamicHeight) }}>
        {laned.map(({ block, lane }) => {
          const left = getPosition(block.startDate, timelineStart, totalMs);
          const width = getWidth(block.startDate, block.endDate, timelineStart, totalMs);
          if (width <= 0) return null;
          return (
            <button key={block.id} onClick={() => onClickBlock(block)}
              className="absolute rounded-md px-2 text-[10px] font-semibold truncate transition-all hover:shadow-sm hover:brightness-95 cursor-pointer flex items-center"
              style={{
                left: `${left}%`, width: `${width}%`,
                top: rowPadding + lane * (blockHeight + blockGap),
                height: blockHeight,
                backgroundColor: block.color, color: getContrastColor(block.color), minWidth: 30,
              }}
              title={block.name}>
              {block.name}
            </button>
          );
        })}
        {viewMode !== 'year' && weekPlanCounts.map((count, i) => {
          if (count === 0) return null;
          const weekPct = (1 / totalWeeks) * 100;
          return (
            <div key={i} className="absolute bottom-1 flex items-center justify-center"
              style={{ left: `${i * weekPct}%`, width: `${weekPct}%` }}>
              <span className="bg-court-50 text-court-700 text-[9px] font-bold rounded-full px-1.5 py-0.5">{count} plan{count !== 1 ? 's' : ''}</span>
            </div>
          );
        })}
        <TodayLine timelineStart={timelineStart} totalMs={totalMs} />
      </div>
    </div>
  );
}

function TodayLine({ timelineStart, totalMs }: { timelineStart: number; totalMs: number }) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const pct = ((now.getTime() - timelineStart) / totalMs) * 100;
  if (pct < 0 || pct > 100) return null;
  return (
    <div className="absolute top-0 bottom-0 w-px border-l border-dashed border-court-500/30 pointer-events-none" style={{ left: `${pct}%` }} />
  );
}

function getPosition(dateStr: string, timelineStart: number, totalMs: number) {
  const d = new Date(dateStr).getTime();
  return Math.max(0, Math.min(100, ((d - timelineStart) / totalMs) * 100));
}

function getWidth(startStr: string, endStr: string, timelineStart: number, totalMs: number) {
  const s = Math.max(new Date(startStr).getTime(), timelineStart);
  const e = new Date(endStr).getTime();
  const startPct = ((s - timelineStart) / totalMs) * 100;
  const endPct = Math.min(100, ((e - timelineStart) / totalMs) * 100);
  return Math.max(0, endPct - startPct);
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#374151' : '#ffffff';
}
