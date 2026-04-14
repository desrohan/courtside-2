import { useState } from 'react';
import { CalendarEvent, AttendanceRecord } from '@/data/events';
import { segments } from '@/data/segments';
import { Users, Activity, Home, CheckCircle2, Clock, MapPin, ChevronDown, Tag, Layers, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  event: CalendarEvent;
  onGoToAttendanceReview?: () => void;
}

const moduleConfig = [
  { key: 'hasItinerary',  label: 'Itinerary',   emoji: '🗺️' },
  { key: 'hasChecklist',  label: 'Checklist',    emoji: '✅' },
  { key: 'hasSession',    label: 'Session',      emoji: '⚡' },
  { key: 'hasHydration',  label: 'Hydration',    emoji: '💧' },
  { key: 'hasAssignment', label: 'Assignment',   emoji: '📋' },
  { key: 'hasFiles',      label: 'Files',        emoji: '📁' },
];

const roleColors: Record<AttendanceRecord['role'], { bg: string; text: string; dot: string; avatarFrom: string; avatarTo: string }> = {
  player:  { bg: 'bg-court-50',  text: 'text-court-700',  dot: 'bg-court-400',  avatarFrom: 'from-court-400',  avatarTo: 'to-court-600'  },
  coach:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400',  avatarFrom: 'from-amber-400',  avatarTo: 'to-amber-600'  },
  staff:   { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400', avatarFrom: 'from-violet-400', avatarTo: 'to-violet-600' },
  admin:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400',   avatarFrom: 'from-blue-400',   avatarTo: 'to-blue-600'   },
  medical: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400',    avatarFrom: 'from-red-400',    avatarTo: 'to-red-500'    },
};

function Avatar({ initials, from, to }: { initials: string; from: string; to: string }) {
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center border-2 border-white shadow-sm shrink-0`}>
      <span className="text-[10px] font-bold text-white">{initials}</span>
    </div>
  );
} 

function OverflowBadge({ members, from, to }: { members: AttendanceRecord[]; from: string; to: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const handleEnter = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: r.left, y: r.top });
  };

  return (
    <div
      className="flex items-center gap-1.5"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setPos(null)}
    >
      <div className="w-8 h-8 rounded-full bg-dark-100 flex items-center justify-center border-2 border-white shrink-0 cursor-default">
        <span className="text-[10px] font-bold text-dark-500">+{members.length}</span>
      </div>
      <span className="text-[11px] text-dark-400 font-medium">more</span>

      <AnimatePresence>
        {pos && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[9999] bg-dark-900 rounded-xl shadow-xl p-3 min-w-[160px] pointer-events-none"
            style={{ left: pos.x, top: pos.y - 8, transform: 'translateY(-100%)' }}
          >
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.userId} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center shrink-0`}>
                    <span className="text-[8px] font-bold text-white">{m.avatar}</span>
                  </div>
                  <span className="text-xs text-white font-medium whitespace-nowrap">{m.name}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-dark-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EventOverview({ event, onGoToAttendanceReview }: Props) {
  const dateDisplay = (() => {
    const s = event.start.date;
    const e = event.end.date;
    if (s === e) return format(parseISO(s), 'EEEE, MMMM do yyyy');
    return `${format(parseISO(s), 'MMM d')} – ${format(parseISO(e), 'MMM d, yyyy')}`;
  })();

  const fmt12 = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`; };
  const timeDisplay = event.allDay ? 'All Day' : `${fmt12(event.start.time)} – ${fmt12(event.end.time)}`;

  const activeModules = moduleConfig.filter(m => event[m.key as keyof CalendarEvent]);
  const [peopleOpen, setPeopleOpen] = useState(false);

  const attendance = event.attendance || [];
  const roleGroups = (['player', 'coach', 'staff', 'admin', 'medical'] as AttendanceRecord['role'][])
    .map(role => ({ role, members: attendance.filter(a => a.role === role) }))
    .filter(g => g.members.length > 0);

  // Segment / Batch resolution
  const segment = event.segmentId ? segments.find(s => s.id === event.segmentId) : undefined;
  const selectedBatches = segment?.batches?.filter(b => event.batchIds?.includes(b.id)) ?? [];

  const pendingAppeals = attendance.filter(a => a.appeal?.status === 'pending').length;
  const unresolvedCheckouts = attendance.filter(a => a.staleMissedCheckout && !a.checkoutResolution).length;
  const reviewTotal = pendingAppeals + unresolvedCheckouts;

  return (
    <div className="space-y-4">
      {reviewTotal > 0 && (
        <div
          onClick={onGoToAttendanceReview}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 ${onGoToAttendanceReview ? 'cursor-pointer hover:bg-amber-100 transition-colors' : ''}`}
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800">Attendance Needs Review</p>
            <p className="text-[10px] text-amber-600 mt-0.5">
              {pendingAppeals > 0 && <span>{pendingAppeals} pending appeal{pendingAppeals !== 1 ? 's' : ''}</span>}
              {pendingAppeals > 0 && unresolvedCheckouts > 0 && <span className="mx-1.5">·</span>}
              {unresolvedCheckouts > 0 && <span>{unresolvedCheckouts} unresolved checkout{unresolvedCheckouts !== 1 ? 's' : ''}</span>}
            </p>
          </div>
          <span className="text-2xl font-extrabold text-amber-600">{reviewTotal}</span>
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div className="relative rounded-2xl overflow-hidden border border-dark-100/80">
          <div className="absolute inset-0 bg-gradient-to-br from-court-50/50 via-white to-violet-50/30" />
          <div className="relative px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-dark-400 mb-1.5">About</p>
            <p className="text-sm text-dark-700 leading-relaxed">{event.description}</p>
          </div>
        </div>
      )}

      {/* When & Where */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl border border-dark-100 bg-white hover:border-court-200 hover:shadow-sm transition-all group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Clock size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-0.5">When</p>
            <p className="text-xs font-bold text-dark-900 leading-snug">{dateDisplay}</p>
            <p className="text-[11px] text-dark-500 font-medium mt-0.5">{timeDisplay}</p>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-2.5 p-4 rounded-2xl border border-dark-100 bg-white hover:border-violet-200 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              {event.locationtype === 'home' ? <Home size={16} className="text-white" /> : <MapPin size={16} className="text-white" />}
            </div>
            <div className="w-6 h-6 rounded-lg bg-dark-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors shrink-0 mt-0.5">
              <MapPin size={12} className="text-dark-400 group-hover:text-violet-500 transition-colors" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-0.5">Where</p>
            <p className="text-xs font-bold text-dark-900 leading-snug truncate group-hover:text-violet-600 transition-colors">{event.location}</p>
            <p className="text-[11px] text-dark-500 font-medium mt-0.5 capitalize">{event.locationtype === 'home' ? 'Home venue' : 'Away'}</p>
          </div>
        </a>
      </div>

      {/* Event Type + Teams + Segment in one card */}
      <div className="rounded-2xl border border-dark-100 bg-white overflow-hidden divide-y divide-dark-100">
        {/* Type */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: event.eventType.color + '18' }}
          >
            <Tag size={14} style={{ color: event.eventType.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Event Type</p>
            <p className="text-xs font-bold mt-0.5" style={{ color: event.eventType.color }}>
              {event.eventType.name}
            </p>
          </div>
        </div>

        {/* Teams — only if present */}
        {event.teamNames.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-court-50 flex items-center justify-center shrink-0">
              <Users size={14} className="text-court-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-1.5">Teams</p>
              <div className="flex flex-wrap gap-1.5">
                {event.teamNames.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-court-500 text-white rounded-lg text-[11px] font-bold shadow-sm">
                    <Users size={10} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Segment — only if present */}
        {segment && (
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Layers size={14} className="text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">
                  {segment.type === 'batch' ? 'Segment · Batch' : 'Segment'}
                </p>
                <p className="text-xs font-bold text-dark-900 mt-0.5">{segment.name}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                segment.type === 'batch' ? 'bg-amber-50 text-amber-700' : 'bg-violet-50 text-violet-700'
              }`}>
                {segment.type === 'batch' ? 'Batch' : 'Segment'}
              </span>
            </div>

            {/* Batches — if this segment is batch-type and event has specific batches */}
            {segment.type === 'batch' && selectedBatches.length > 0 && (
              <div className="mt-3 ml-11 space-y-2">
                {selectedBatches.map(batch => (
                  <div
                    key={batch.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-dark-100 bg-dark-50/40"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: batch.eventColor }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-dark-800 truncate">{batch.name}</p>
                      <p className="text-[10px] text-dark-400 mt-0.5">
                        {batch.days.join(', ')} · {batch.time} · {batch.enrolledCount}{batch.capacity ? `/${batch.capacity}` : ''} enrolled
                      </p>
                    </div>
                    {batch.fee && (
                      <span className="text-[10px] font-bold text-dark-500 shrink-0">{batch.fee}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Segment type — no batches, show schedule hint */}
            {segment.type === 'segment' && segment.schedule && (
              <p className="text-[11px] text-dark-400 mt-1.5 ml-11">{segment.schedule}</p>
            )}
          </div>
        )}
      </div>

      {/* People — collapsible */}
      {roleGroups.length > 0 && (
        <div className="rounded-2xl border border-dark-100 overflow-hidden bg-white">
          <button
            onClick={() => setPeopleOpen(o => !o)}
            className="w-full flex items-center gap-2.5 px-4 py-3.5 hover:bg-dark-50/40 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-dark-50 flex items-center justify-center shrink-0">
              <Users size={14} className="text-dark-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-dark-400 leading-none">People</p>
              <p className="text-xs font-semibold text-dark-700 mt-0.5">{attendance.length} member{attendance.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-1 mr-2">
              {roleGroups.map(({ role, members }) => (
                <div key={role} className="flex items-center gap-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${roleColors[role].dot}`} />
                  <span className="text-[10px] text-dark-400">{members.length}</span>
                </div>
              ))}
            </div>
            <ChevronDown
              size={14}
              className={`text-dark-400 transition-transform duration-200 ${peopleOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {peopleOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-dark-100">
                  {roleGroups.map(({ role, members }, gi) => {
                    const cfg = roleColors[role];
                    const MAX = 5;
                    const shown = members.slice(0, MAX);
                    const overflow = members.length - MAX;
                    return (
                      <div key={role} className={`px-4 py-3 ${gi < roleGroups.length - 1 ? 'border-b border-dark-50' : ''}`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}s
                          </span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                            {members.length}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
                          {shown.map(member => (
                            <div key={member.userId} className="flex items-center gap-1.5">
                              <Avatar initials={member.avatar} from={cfg.avatarFrom} to={cfg.avatarTo} />
                              <span className="text-xs font-semibold text-dark-700">{member.name}</span>
                            </div>
                          ))}
                          {overflow > 0 && (
                            <OverflowBadge
                              members={members.slice(MAX)}
                              from={cfg.avatarFrom}
                              to={cfg.avatarTo}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modules */}
      <div className="rounded-2xl border border-dark-100 bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-dark-400">Modules</p>
          {activeModules.length > 0 && (
            <span className="px-1.5 py-0.5 bg-court-100 text-court-700 rounded-md text-[10px] font-bold ml-1">
              {activeModules.length} active
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-0 divide-x divide-y divide-dark-100">
          {moduleConfig.map(mod => {
            const active = !!event[mod.key as keyof CalendarEvent];
            return (
              <div
                key={mod.key}
                className={`relative flex flex-col items-center justify-center gap-1.5 py-4 px-2 text-center transition-all ${
                  active ? 'bg-court-50/60' : 'bg-white'
                }`}
              >
                <span className={`text-xl leading-none ${!active ? 'grayscale opacity-40' : ''}`}>{mod.emoji}</span>
                <span className={`text-[10px] font-bold leading-none ${active ? 'text-court-700' : 'text-dark-300'}`}>
                  {mod.label}
                </span>
                {active && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={11} className="text-court-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
