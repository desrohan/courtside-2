import React from 'react';
import { Plus } from 'lucide-react';
import type { PlannerCycle } from '@/data/planner';
import type { ViewMode } from '@/pages/PlannerModule';
import { getTimelineWeeks, getWeekWidth, SIDEBAR_WIDTH } from './TimelineHeader';

interface CycleRowProps {
  cycles: PlannerCycle[];
  seasonStart: Date;
  seasonEnd: Date;
  viewMode: ViewMode;
  periodOffset: number;
  onAddCycle: () => void;
  onEditCycle: (c: PlannerCycle) => void;
}

export default function CycleRow({ cycles, seasonStart, seasonEnd, viewMode, periodOffset, onAddCycle, onEditCycle }: CycleRowProps) {
  const weeks = getTimelineWeeks(seasonStart, seasonEnd, viewMode, periodOffset);
  const totalWeeks = weeks.length;
  if (totalWeeks === 0) return null;

  const timelineStart = weeks[0].weekStart.getTime();
  const timelineEnd = new Date(weeks[totalWeeks - 1].weekStart);
  timelineEnd.setDate(timelineEnd.getDate() + 7);
  const totalMs = timelineEnd.getTime() - timelineStart;

  const getPos = (dateStr: string) => Math.max(0, Math.min(100, ((new Date(dateStr).getTime() - timelineStart) / totalMs) * 100));
  const getW = (s: string, e: string) => {
    const sp = Math.max(0, ((new Date(s).getTime() - timelineStart) / totalMs) * 100);
    const ep = Math.min(100, ((new Date(e).getTime() - timelineStart) / totalMs) * 100);
    return Math.max(0, ep - sp);
  };

  const ww = getWeekWidth(viewMode);

  return (
    <div className="flex border-b border-dark-100 hover:bg-dark-50/20 transition-colors">
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 sticky left-0 z-20 bg-white border-r border-dark-100" style={{ width: SIDEBAR_WIDTH }}>
        <span className="text-xs font-semibold text-dark-500">Cycles</span>
        <button onClick={onAddCycle} className="p-0.5 rounded hover:bg-dark-100 text-dark-400 hover:text-court-500 transition-colors">
          <Plus size={14} />
        </button>
      </div>
      <div className="relative py-2 min-h-[40px]" style={ww ? { width: totalWeeks * ww } : { flex: 1 }}>
        {cycles.map(cycle => {
          const left = getPos(cycle.startDate);
          const width = getW(cycle.startDate, cycle.endDate);
          if (width <= 0) return null;
          return (
            <button key={cycle.id} onClick={() => onEditCycle(cycle)}
              className="absolute top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-[11px] font-semibold truncate transition-all hover:shadow-sm hover:brightness-95"
              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: cycle.color, color: getContrastColor(cycle.color), minWidth: 40 }}
              title={cycle.name}>
              {cycle.name}
            </button>
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
    <div className="absolute top-0 bottom-0 w-px border-l border-dashed border-court-500/50 z-10 pointer-events-none" style={{ left: `${pct}%` }} />
  );
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#374151' : '#ffffff';
}
