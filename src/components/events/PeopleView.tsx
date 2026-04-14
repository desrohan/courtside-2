import { useState } from 'react';
import { users, User } from '@/data/users';
import { events, CalendarEvent } from '@/data/events';
import { format, parseISO, isSameDay, addDays, subDays, isToday } from 'date-fns';

interface Props {
  onEventClick: (event: CalendarEvent) => void;
}

const conditionColors: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-500', text: 'text-green-600', label: 'Healthy' },
  injured: { bg: 'bg-red-500', text: 'text-red-600', label: 'Injured' },
  suspended: { bg: 'bg-yellow-500', text: 'text-yellow-600', label: 'Suspended' },
};

export default function PeopleView({ onEventClick }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const hours = Array.from({ length: 14 }, (_, i) => i + 6);

  const playerUsers = users.filter(u => u.role === 'player' || u.role === 'coach');

  const getUserEvents = (userId: string, date: Date) =>
    events.filter(ev => {
      const evDate = parseISO(ev.start.date);
      return isSameDay(evDate, date) && ev.teamIds.some(tid => {
        const user = users.find(u => u.id === userId);
        return user?.teamIds.includes(tid);
      });
    });

  const getEventPosition = (ev: CalendarEvent) => {
    const [sh, sm] = ev.start.time.split(':').map(Number);
    const [eh, em] = ev.end.time.split(':').map(Number);
    const startMin = (sh - 6) * 60 + sm;
    const endMin = (eh - 6) * 60 + em;
    const left = (startMin / (14 * 60)) * 100;
    const width = ((endMin - startMin) / (14 * 60)) * 100;
    return { left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  // Week days
  const weekDays = viewMode === 'week'
    ? Array.from({ length: 7 }, (_, i) => addDays(subDays(viewDate, viewDate.getDay()), i))
    : [viewDate];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewDate(subDays(viewDate, viewMode === 'week' ? 7 : 1))} className="p-2 rounded-lg hover:bg-dark-50 text-dark-500 text-sm">&larr;</button>
          <button onClick={() => setViewDate(new Date())} className="h-8 px-3 rounded-lg bg-dark-50 text-xs font-semibold text-dark-600 hover:bg-dark-100">Today</button>
          <button onClick={() => setViewDate(addDays(viewDate, viewMode === 'week' ? 7 : 1))} className="p-2 rounded-lg hover:bg-dark-50 text-dark-500 text-sm">&rarr;</button>
          <h2 className="text-base font-bold text-dark-900 ml-2">
            {viewMode === 'week'
              ? `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`
              : format(viewDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          {isToday(viewDate) && <span className="px-2 py-0.5 bg-court-50 text-court-600 rounded-full text-[10px] font-bold">Today</span>}
        </div>
        <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5">
          <button onClick={() => setViewMode('day')} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${viewMode === 'day' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>Day</button>
          <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${viewMode === 'week' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>Week</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {Object.entries(conditionColors).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px] text-dark-500">
            <span className={`w-2.5 h-2.5 rounded-full ${val.bg}`} /> {val.label}
          </span>
        ))}
      </div>

      {/* Day view */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
          <div className="flex border-b border-dark-100">
            <div className="w-60 shrink-0 px-4 py-2 bg-dark-50/60 border-r border-dark-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-dark-400">Player / Staff</span>
            </div>
            <div className="flex-1 flex">
              {hours.map(h => (
                <div key={h} className="flex-1 px-1 py-2 text-center border-r border-dark-100 last:border-r-0 bg-dark-50/30">
                  <span className="text-[10px] font-semibold text-dark-400">{h > 12 ? h - 12 : h}{h >= 12 ? 'pm' : 'am'}</span>
                </div>
              ))}
            </div>
          </div>

          {playerUsers.map(user => {
            const userEvents = getUserEvents(user.id, viewDate);
            const cond = conditionColors[user.status] || conditionColors.active;
            return (
              <div key={user.id} className="flex border-b border-dark-100 last:border-b-0 hover:bg-dark-50/20 transition-colors">
                <div className="w-60 shrink-0 px-4 py-2.5 border-r border-dark-100 flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{user.avatar}</span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${cond.bg} border-2 border-white`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-dark-800 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-dark-400">{user.position || user.designation}</p>
                  </div>
                  {user.jerseyNumber && (
                    <span className="ml-auto text-[10px] font-bold text-dark-400 bg-dark-50 px-1.5 py-0.5 rounded">#{user.jerseyNumber}</span>
                  )}
                </div>
                <div className="flex-1 relative h-11">
                  {hours.map((h, i) => (
                    <div key={h} className="absolute top-0 bottom-0 border-r border-dark-100/50"
                      style={{ left: `${(i / hours.length) * 100}%`, width: `${100 / hours.length}%` }} />
                  ))}
                  {userEvents.map(ev => {
                    const pos = getEventPosition(ev);
                    return (
                      <button key={ev.id} onClick={() => onEventClick(ev)}
                        className="absolute top-1 bottom-1 rounded-md px-1.5 flex items-center gap-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all text-white text-[10px] font-semibold shadow-sm"
                        style={{ left: pos.left, width: pos.width, backgroundColor: ev.eventType.color }}>
                        <span className="truncate">{ev.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Week view */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
          <div className="flex border-b border-dark-100">
            <div className="w-52 shrink-0 px-4 py-2 bg-dark-50/60 border-r border-dark-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-dark-400">Player</span>
            </div>
            {weekDays.map(d => (
              <div key={d.toISOString()} className={`flex-1 px-2 py-2 text-center border-r border-dark-100 last:border-r-0 ${isToday(d) ? 'bg-court-50/30' : 'bg-dark-50/30'}`}>
                <p className="text-[10px] font-bold text-dark-400 uppercase">{format(d, 'EEE')}</p>
                <p className={`text-xs font-bold ${isToday(d) ? 'text-court-600' : 'text-dark-700'}`}>{format(d, 'd')}</p>
              </div>
            ))}
          </div>
          {playerUsers.slice(0, 12).map(user => {
            const cond = conditionColors[user.status] || conditionColors.active;
            return (
              <div key={user.id} className="flex border-b border-dark-100 last:border-b-0">
                <div className="w-52 shrink-0 px-4 py-2 border-r border-dark-100 flex items-center gap-2">
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{user.avatar}</span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${cond.bg} border border-white`} />
                  </div>
                  <span className="text-[11px] font-medium text-dark-700 truncate">{user.firstName} {user.lastName.charAt(0)}.</span>
                </div>
                {weekDays.map(d => {
                  const dayEvs = getUserEvents(user.id, d);
                  return (
                    <div key={d.toISOString()} className={`flex-1 px-1 py-1 border-r border-dark-100 last:border-r-0 ${isToday(d) ? 'bg-court-50/10' : ''}`}>
                      <div className="space-y-0.5">
                        {dayEvs.slice(0, 2).map(ev => (
                          <button key={ev.id} onClick={() => onEventClick(ev)}
                            className="w-full px-1 py-0.5 rounded text-[9px] font-semibold text-white truncate text-left hover:brightness-110 transition-all"
                            style={{ backgroundColor: ev.eventType.color }}>
                            {ev.title}
                          </button>
                        ))}
                        {dayEvs.length > 2 && <p className="text-[9px] text-dark-400 text-center">+{dayEvs.length - 2}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
