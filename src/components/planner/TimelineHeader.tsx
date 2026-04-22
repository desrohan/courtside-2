import React from 'react';
import type { ViewMode } from '@/pages/PlannerModule';

interface TimelineHeaderProps {
  seasonStart: Date;
  seasonEnd: Date;
  viewMode: ViewMode;
  periodOffset: number;
  onWeekClick: (weekStart: string) => void;
}

export type WeekInfo = { weekStart: Date; weekNum: number; month: string; monthIdx: number };

function getWeeks(start: Date, end: Date): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const d = new Date(start);
  const day = d.getDay();
  if (day !== 1) d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  let weekNum = 1;
  while (d <= end) {
    weeks.push({
      weekStart: new Date(d),
      weekNum,
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      monthIdx: d.getMonth(),
    });
    d.setDate(d.getDate() + 7);
    weekNum++;
  }
  return weeks;
}

function getMonthGroups(weeks: WeekInfo[]) {
  const groups: { month: string; year: number; count: number }[] = [];
  let current: { month: string; year: number; count: number } | null = null;
  for (const w of weeks) {
    const yr = w.weekStart.getFullYear();
    if (current && current.month === w.month && current.year === yr) {
      current.count++;
    } else {
      if (current) groups.push(current);
      current = { month: w.month, year: yr, count: 1 };
    }
  }
  if (current) groups.push(current);
  return groups;
}

function filterWeeks(allWeeks: WeekInfo[], viewMode: ViewMode, periodOffset: number): WeekInfo[] {
  if (viewMode === 'year') return allWeeks;
  const now = new Date();
  if (viewMode === 'month') {
    const target = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
    return allWeeks.filter(w => w.weekStart.getMonth() === target.getMonth() && w.weekStart.getFullYear() === target.getFullYear());
  }
  if (viewMode === 'quarter') {
    const baseQ = Math.floor(now.getMonth() / 3) + periodOffset;
    const targetYear = now.getFullYear() + Math.floor(baseQ / 4);
    const targetQ = ((baseQ % 4) + 4) % 4;
    const qMonths = [targetQ * 3, targetQ * 3 + 1, targetQ * 3 + 2];
    return allWeeks.filter(w => qMonths.includes(w.weekStart.getMonth()) && w.weekStart.getFullYear() === targetYear);
  }
  return allWeeks;
}

export default function TimelineHeader({ seasonStart, seasonEnd, viewMode, periodOffset, onWeekClick }: TimelineHeaderProps) {
  const allWeeks = getWeeks(seasonStart, seasonEnd);
  const weeks = filterWeeks(allWeeks, viewMode, periodOffset);

  if (weeks.length === 0) return (
    <div className="sticky top-0 z-10 bg-white border-b border-dark-100 flex">
      <div className="shrink-0 sticky left-0 z-20 bg-white" style={{ width: SIDEBAR_WIDTH }} />
      <div className="flex-1 py-6 text-center text-xs text-dark-400">No weeks in this period within the season range.</div>
    </div>
  );

  const monthGroups = getMonthGroups(weeks);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = (weekStart: Date) => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return today >= weekStart && today <= end;
  };

  const ww = getWeekWidth(viewMode);

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-dark-100">
      {/* Month row */}
      <div className="flex">
        <div className="shrink-0 sticky left-0 z-20 bg-white border-r border-dark-100" style={{ width: SIDEBAR_WIDTH }} />
        <div className="flex" style={ww ? { width: weeks.length * ww } : { flex: 1 }}>
          {monthGroups.map((mg, i) => (
            <div key={`${mg.month}-${mg.year}-${i}`} className="text-center border-l border-dark-100"
              style={ww ? { width: mg.count * ww } : { flex: mg.count }}>
              <div className="py-1.5 text-[11px] font-bold text-dark-500 uppercase tracking-wider">{mg.month}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Week row */}
      <div className="flex">
        <div className="shrink-0 sticky left-0 z-20 bg-white border-r border-dark-100" style={{ width: SIDEBAR_WIDTH }} />
        <div className="flex" style={ww ? { width: weeks.length * ww } : { flex: 1 }}>
          {weeks.map(w => {
            const todayWeek = isToday(w.weekStart);
            return (
              <button key={w.weekNum}
                onClick={() => onWeekClick(w.weekStart.toISOString().split('T')[0])}
                className={`py-1.5 text-center text-[10px] font-semibold border-l border-dark-100 transition-colors hover:bg-dark-50/50 ${todayWeek ? 'text-white' : 'text-dark-400'}`}
                style={ww ? { width: ww } : { flex: 1 }}>
                <span className={`inline-flex items-center justify-center ${todayWeek ? 'bg-court-500 text-white rounded-full w-5 h-5 text-[9px]' : ''}`}>
                  {todayWeek ? today.getDate().toString().padStart(2, '0') : `W${w.weekNum}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function getTimelineWeeks(seasonStart: Date, seasonEnd: Date, viewMode: ViewMode, periodOffset: number = 0): WeekInfo[] {
  const allWeeks = getWeeks(seasonStart, seasonEnd);
  return filterWeeks(allWeeks, viewMode, periodOffset);
}

export function getWeekWidth(viewMode: ViewMode): number | undefined {
  if (viewMode === 'quarter') return 80;
  if (viewMode === 'month') return 120;
  return undefined;
}

export const SIDEBAR_WIDTH = 200;
