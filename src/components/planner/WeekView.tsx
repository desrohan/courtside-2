import React from 'react';
import { Users } from 'lucide-react';
import type { Track, TrackGroup, DayPlan, PlannerCycle, PlannerBlock } from '@/data/planner';
import DayPlanCell from './DayPlanCell';

interface WeekViewProps {
  weekStart: string;
  tracks: Track[];
  trackGroups: TrackGroup[];
  dayPlans: DayPlan[];
  cycles: PlannerCycle[];
  blocks: PlannerBlock[];
  onCellClick: (trackId: string, date: string) => void;
}

export default function WeekView({ weekStart, tracks, trackGroups, dayPlans, cycles, blocks, onCellClick }: WeekViewProps) {
  if (!weekStart) return (
    <div className="bg-white rounded-2xl border border-dark-100 flex items-center justify-center py-20 text-dark-400 text-sm">
      Click a week in the timeline to view the week plan.
    </div>
  );

  // Generate 7 days (Mon-Sun)
  const days: { date: Date; dateStr: string; label: string; dayName: string }[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      dateStr: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group tracks by track group
  const grouped = trackGroups
    .map(g => ({ group: g, groupTracks: tracks.filter(t => t.trackGroupId === g.id) }))
    .filter(g => g.groupTracks.length > 0);

  return (
    <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-dark-50/60">
              <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 w-[180px] border-r border-dark-100">
                Track
              </th>
              {days.map(d => {
                const isToday = d.date.getTime() === today.getTime();
                return (
                  <th key={d.dateStr} className={`text-center px-2 py-3 text-[11px] border-r border-dark-100 last:border-r-0 ${isToday ? 'bg-court-50' : ''}`}>
                    <div className="font-bold text-dark-500">{d.dayName}</div>
                    <div className={`text-[10px] mt-0.5 ${isToday ? 'text-court-600 font-bold' : 'text-dark-400'}`}>
                      {isToday ? (
                        <span className="inline-flex items-center justify-center bg-court-500 text-white rounded-full w-5 h-5 text-[9px]">
                          {d.date.getDate()}
                        </span>
                      ) : d.label}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ group, groupTracks }) => (
              <React.Fragment key={group.id}>
                {/* Group header row */}
                <tr className="bg-dark-50/30">
                  <td colSpan={8} className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Users size={12} style={{ color: group.color }} />
                      <span className="text-[11px] font-bold text-dark-600">{group.name}</span>
                    </div>
                  </td>
                </tr>
                {/* Track rows */}
                {groupTracks.map(track => (
                  <tr key={track.id} className="border-b border-dark-50 hover:bg-dark-50/10">
                    <td className="px-4 py-2 border-r border-dark-100">
                      <span className="text-xs font-medium text-dark-600">{track.name}</span>
                    </td>
                    {days.map(d => {
                      const plan = dayPlans.find(dp => dp.trackId === track.id && dp.date === d.dateStr);
                      const cycle = plan ? cycles.find(c => c.id === plan.cycleId) : undefined;
                      const block = plan ? blocks.find(b => b.id === plan.blockId) : undefined;
                      const isToday = d.date.getTime() === today.getTime();
                      return (
                        <td key={d.dateStr} className={`border-r border-dark-100 last:border-r-0 p-1 ${isToday ? 'bg-court-50/30' : ''}`}>
                          <DayPlanCell
                            plan={plan}
                            cycle={cycle}
                            block={block}
                            onClick={() => onCellClick(track.id, d.dateStr)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
