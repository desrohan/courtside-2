import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Clock, AlertCircle, Minus, MapPin, QrCode, UserCheck,
  Shield, Navigation, AlertTriangle, LogIn, LogOut, User, MessageSquare, Info, ArrowUpLeft,
  FileText, CheckCircle2, Settings2, ChevronDown, RotateCcw,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, AttendanceCheckInType, CalendarEvent, AttendanceGeofenceConfig, AttendanceQrConfig, AttendancePreference } from '@/data/events';
import { attendanceGeofenceConfig, attendanceQrConfig, attendanceRules, attendancePreferenceLabels, attendanceUserTypes, AttendanceUserType, designations, employeeTypeConfigs } from '@/data/settings';
import { AssignUsersModal } from '@/components/ui/VisibilityPicker';
import { users } from '@/data/users';
import { roles as settingsRoles } from '@/data/settings';
import { teams } from '@/data/teams';

interface Props {
  records: AttendanceRecord[];
  event?: CalendarEvent;
  initialFilter?: 'all' | 'players' | 'coach' | 'medical' | 'staff' | 'review';
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ReactNode; bg: string; text: string; dot: string }> = {
  none:       { label: 'None',       icon: <Minus size={12} />,       bg: 'bg-dark-50',   text: 'text-dark-400',   dot: 'bg-dark-300' },
  present:    { label: 'Present',    icon: <Check size={12} />,       bg: 'bg-green-50',  text: 'text-green-600',  dot: 'bg-green-500' },
  absent:     { label: 'Absent',     icon: <X size={12} />,           bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-500' },
  late:       { label: 'Late',       icon: <Clock size={12} />,       bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-500' },
  excused:    { label: 'Excused',    icon: <AlertCircle size={12} />, bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-500' },
  pending:    { label: 'Pending',    icon: <Minus size={12} />,       bg: 'bg-dark-100',  text: 'text-dark-500',   dot: 'bg-dark-400' },
  left_early: { label: 'Left Early', icon: <ArrowUpLeft size={12} />, bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
};

const checkInTypeConfig: Record<AttendanceCheckInType, { label: string; short: string; icon: React.ReactNode; bg: string; text: string }> = {
  to_be_marked: { label: 'Manual Mark', short: 'Manual', icon: <UserCheck size={12} />, bg: 'bg-dark-100', text: 'text-dark-600' },
  geolocation:  { label: 'Geolocation', short: 'Geo',    icon: <MapPin size={12} />,    bg: 'bg-blue-50',  text: 'text-blue-600' },
  qr_code:      { label: 'QR Code',     short: 'QR',     icon: <QrCode size={12} />,    bg: 'bg-purple-50',text: 'text-purple-600' },
};

const statusCycle: AttendanceStatus[] = ['none', 'present', 'absent', 'late', 'left_early', 'excused'];

export default function AttendanceTab({ records, event, initialFilter }: Props) {
  const [attendance, setAttendance] = useState(records);
  const defaultGeo = event?.geoSettings ?? attendanceGeofenceConfig;
  const [geoSettings, setGeoSettings] = useState<AttendanceGeofenceConfig>({ ...defaultGeo });
  const isGeoModified = JSON.stringify(geoSettings) !== JSON.stringify(attendanceGeofenceConfig);

  const defaultQr = event?.qrSettings ?? attendanceQrConfig;
  const [qrSettings, setQrSettings] = useState<AttendanceQrConfig>({ ...defaultQr });
  const isQrModified = JSON.stringify(qrSettings) !== JSON.stringify(attendanceQrConfig);
  const [qrAdminGroupIds, setQrAdminGroupIds] = useState<string[]>([]);
  const [qrAdminUserIds, setQrAdminUserIds] = useState<string[]>([]);
  const [showQrAdminModal, setShowQrAdminModal] = useState(false);

  const templateCheckOut: Record<string, boolean> = Object.fromEntries(
    attendanceRules.filter(r => r.eventTypeId === (event?.eventType?.id ?? '')).map(r => [r.userType, r.requireCheckOut])
  );
  const defaultCheckOut = event?.roleRequireCheckOut ?? templateCheckOut;
  const [roleCheckOut, setRoleCheckOut] = useState<Record<string, boolean>>({ ...defaultCheckOut });

  // Role attendance types — loaded from event or derived from template rules for this event type
  const templateRoleTypes: Record<string, AttendancePreference> = Object.fromEntries(
    attendanceRules
      .filter(r => r.eventTypeId === (event?.eventType?.id ?? ''))
      .map(r => [r.userType, r.preference])
  );
  const defaultRoleTypes = event?.roleAttendanceTypes ?? templateRoleTypes;
  const [roleTypes, setRoleTypes] = useState<Record<string, AttendancePreference>>({ ...defaultRoleTypes });
  const [roleExpanded, setRoleExpanded] = useState(false);
  const isRoleModified = JSON.stringify(roleTypes) !== JSON.stringify(templateRoleTypes);

  // The 5 user-facing roles that map to our attendance records
  const displayRoles: { key: string; label: string }[] = [
    { key: 'Athlete',    label: 'Athlete' },
    { key: 'Coach',      label: 'Coach' },
    { key: 'Medical',    label: 'Medical' },
    { key: 'Operations', label: 'Operations' },
    { key: 'Guest',      label: 'Guest' },
  ];
  const [showOverride, setShowOverride] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<AttendanceStatus>('present');
  const [filter, setFilter] = useState<'all' | 'players' | 'coach' | 'medical' | 'staff' | 'review'>(initialFilter ?? 'all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [showAppeal, setShowAppeal] = useState<string | null>(null);
  const [appealDecision, setAppealDecision] = useState<'accepted' | 'rejected'>('accepted');
  const [appealStatus, setAppealStatus] = useState<AttendanceStatus>('excused');
  const [showCheckoutResolution, setShowCheckoutResolution] = useState<string | null>(null);
  const [checkoutResolutionStatus, setCheckoutResolutionStatus] = useState<AttendanceStatus>('present');
  const [checkoutResolutionNote, setCheckoutResolutionNote] = useState('');
  const [checkoutTimeInputs, setCheckoutTimeInputs] = useState<Record<string, string>>({});

  const roleToUserType: Record<string, string> = {
    player: 'Athlete', coach: 'Coach', medical: 'Medical', staff: 'Operations', admin: 'Super Admin',
  };

  const cycleStatus = (userId: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.userId !== userId) return a;
      if (a.checkInType !== 'to_be_marked') {
        setShowOverride(userId);
        setOverrideStatus(a.status === 'present' ? 'absent' : 'present');
        setOverrideReason('');
        return a;
      }
      const idx = statusCycle.indexOf(a.status);
      return { ...a, status: statusCycle[(idx + 1) % statusCycle.length] };
    }));
  };

  const applyOverride = (userId: string) => {
    if (!overrideReason.trim()) return;
    setAttendance(prev => prev.map(a =>
      a.userId === userId ? { ...a, status: overrideStatus, overriddenBy: 'Admin', overrideReason } : a
    ));
    setShowOverride(null);
    setOverrideReason('');
  };

  const resolveAppeal = (userId: string) => {
    setAttendance(prev => prev.map(a => {
      if (a.userId !== userId || !a.appeal) return a;
      const accepted = appealDecision === 'accepted';
      return {
        ...a,
        status: accepted ? appealStatus : a.status,
        appeal: { ...a.appeal, status: appealDecision, resolvedBy: 'Admin', resolvedStatus: accepted ? appealStatus : undefined },
        ...(accepted ? { overriddenBy: 'Admin (Appeal)', overrideReason: `Appeal accepted: ${a.appeal.note}` } : {}),
      };
    }));
    setShowAppeal(null);
  };

  // Parse "HH:MM" → total minutes; returns diff in minutes (always positive)
  const minsFromTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const startMins = event?.start?.time ? minsFromTime(event.start.time) : null;
  const endMins   = event?.end?.time   ? minsFromTime(event.end.time)   : null;
  const lateMins  = (checkInTime: string) => startMins !== null ? Math.max(0, minsFromTime(checkInTime) - startMins) : null;
  const earlyMins = (checkOutTime: string) => endMins !== null ? Math.max(0, endMins - minsFromTime(checkOutTime)) : null;

  const reviewItems = attendance.filter(a =>
    (a.appeal?.status === 'pending') ||
    (a.staleMissedCheckout && !a.checkoutResolution)
  );

  const filtered = filter === 'all' ? attendance
    : filter === 'players' ? attendance.filter(a => a.role === 'player')
    : filter === 'review' ? reviewItems
    : attendance.filter(a => a.role === filter);

  const counts = {
    none:       attendance.filter(a => a.status === 'none').length,
    present:    attendance.filter(a => a.status === 'present').length,
    absent:     attendance.filter(a => a.status === 'absent').length,
    late:       attendance.filter(a => a.status === 'late').length,
    excused:    attendance.filter(a => a.status === 'excused').length,
    pending:    attendance.filter(a => a.status === 'pending').length,
    left_early: attendance.filter(a => a.status === 'left_early').length,
  };

  const checkInCounts = {
    to_be_marked: attendance.filter(a => a.checkInType === 'to_be_marked').length,
    geolocation: attendance.filter(a => a.checkInType === 'geolocation').length,
    qr_code: attendance.filter(a => a.checkInType === 'qr_code').length,
  };

  // Detect roles where members have mixed check-in types
  const roles = ['player', 'coach', 'staff', 'admin', 'medical'] as const;
  const mixedRoles = roles.flatMap(role => {
    const members = attendance.filter(a => a.role === role);
    if (members.length === 0) return [];
    const types = [...new Set(members.map(a => a.checkInType))];
    if (types.length <= 1) return [];
    return [{ role, types }];
  });

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-7 gap-2">
        {(['none', 'present', 'absent', 'late', 'left_early', 'excused', 'pending'] as AttendanceStatus[]).map(s => {
          const c = statusConfig[s];
          return (
            <div key={s} className={`${c.bg} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-extrabold ${c.text}`}>{counts[s]}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${c.text} opacity-70`}>{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Needs action card */}
      {(() => {
        const pendingAppeals = attendance.filter(a => a.appeal?.status === 'pending').length;
        const pendingCheckouts = attendance.filter(a => a.staleMissedCheckout && !a.checkoutResolution).length;
        const total = pendingAppeals + pendingCheckouts;
        if (total === 0) return null;
        return (
          <button onClick={() => setFilter('review')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-800">Needs Review</p>
              <p className="text-[10px] text-amber-600 mt-0.5">
                {pendingAppeals > 0 && <span>{pendingAppeals} pending appeal{pendingAppeals !== 1 ? 's' : ''}</span>}
                {pendingAppeals > 0 && pendingCheckouts > 0 && <span className="mx-1.5">·</span>}
                {pendingCheckouts > 0 && <span>{pendingCheckouts} unresolved checkout{pendingCheckouts !== 1 ? 's' : ''}</span>}
              </p>
            </div>
            <span className="text-2xl font-extrabold text-amber-600">{total}</span>
          </button>
        );
      })()}

      {/* Check-in type breakdown */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Check-in types:</span>
        {(['to_be_marked', 'geolocation', 'qr_code'] as AttendanceCheckInType[]).map(t => {
          const c = checkInTypeConfig[t];
          return (
            <div key={t} className="flex items-center gap-1.5">
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${c.bg} ${c.text}`}>{c.icon} {c.short}</span>
              <span className="text-[10px] text-dark-500">{checkInCounts[t]}</span>
            </div>
          );
        })}
      </div>

      {/* Mixed check-in type warning */}
      {mixedRoles.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Info size={13} className="text-amber-600 shrink-0" />
            <p className="text-[11px] font-bold text-amber-700">Mixed check-in types detected</p>
          </div>
          <p className="text-[10px] text-amber-600 leading-relaxed">
            All members of the same designation should use the same check-in method. The following groups have inconsistent types:
          </p>
          <div className="space-y-1.5">
            {mixedRoles.map(({ role, types }) => {
              const byType = types.map(t => {
                const names = attendance
                  .filter(a => a.role === role && a.checkInType === t)
                  .map(a => a.name.split(' ')[0]);
                const cfg = checkInTypeConfig[t];
                return { t, cfg, names };
              });
              return (
                <div key={role} className="flex items-start gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-amber-800 capitalize bg-amber-100 px-1.5 py-0.5 rounded mt-0.5">{role}s</span>
                  {byType.map(({ t, cfg, names }) => (
                    <span key={t} className="flex items-center gap-1 text-[10px] text-amber-700">
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold text-[9px] ${cfg.bg} ${cfg.text}`}>{cfg.icon} {cfg.short}</span>
                      <span className="text-amber-600">{names.join(', ')}</span>
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Role Check-in Types Panel */}
      <div className="rounded-xl border border-dark-100 bg-white overflow-hidden">
        <button
          onClick={() => setRoleExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-50/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-dark-500" />
            <span className="text-sm font-semibold text-dark-800">Role Check-in Types</span>
            {isRoleModified && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Modified</span>
            )}
            {!isRoleModified && (
              <span className="text-[9px] font-medium text-dark-400">Imported from template</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isRoleModified && (
              <button
                onClick={e => { e.stopPropagation(); setRoleTypes({ ...templateRoleTypes }); }}
                className="flex items-center gap-1 text-[10px] font-semibold text-dark-400 hover:text-dark-700 px-2 py-1 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <RotateCcw size={10} /> Reset to default
              </button>
            )}
            <ChevronDown size={14} className={`text-dark-400 transition-transform duration-200 ${roleExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence>
          {roleExpanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="border-t border-dark-100 divide-y divide-dark-50">
                {displayRoles.map(({ key, label }) => {
                  const current = roleTypes[key];
                  const templateVal = templateRoleTypes[key];
                  const changed = current !== templateVal;
                  const pref = current ? attendancePreferenceLabels[current] : null;
                  const isGeo = current === 'geolocation';
                  return (
                    <div key={key}>
                      {/* Role row */}
                      <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold text-dark-700 w-24 shrink-0">{label}</span>
                          {changed && templateVal && (
                            <span className="text-[9px] text-dark-400 italic truncate">
                              was: {attendancePreferenceLabels[templateVal].short}
                            </span>
                          )}
                        </div>
                        <select
                          value={current ?? ''}
                          onChange={e => setRoleTypes(r => ({ ...r, [key]: e.target.value as AttendancePreference }))}
                          className={`h-7 px-2 rounded-lg border text-[11px] font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20 ${
                            pref ? `${pref.color} border-dark-200` : 'text-dark-400 border-dark-200'
                          }`}
                        >
                          <option value="to_be_marked">Manual</option>
                          <option value="geolocation">Geolocation</option>
                          <option value="qr_code">QR Code</option>
                          <option value="present_by_default">Present by Default</option>
                          <option value="absent_by_default">Absent by Default</option>
                        </select>
                      </div>

                      {/* Inline geo settings — shown when geolocation is selected */}
                      <AnimatePresence>
                        {isGeo && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mx-4 mb-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1"><MapPin size={10} /> Geolocation Settings</span>
                                {isGeoModified && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Modified</span>
                                    <button
                                      onClick={() => setGeoSettings({ ...attendanceGeofenceConfig })}
                                      className="flex items-center gap-1 text-[10px] font-semibold text-dark-400 hover:text-dark-700 transition-colors"
                                    >
                                      <RotateCcw size={9} /> Reset
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-dark-500 mb-1">Radius (m)</label>
                                  <input
                                    type="number"
                                    value={geoSettings.radiusMeters}
                                    onChange={e => setGeoSettings(g => ({ ...g, radiusMeters: parseInt(e.target.value) || 0 }))}
                                    className="w-full h-7 px-2 rounded-lg border border-blue-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                                  />
                                  <p className="text-[9px] text-dark-400 mt-0.5">Default: {attendanceGeofenceConfig.radiusMeters}m</p>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-dark-500 mb-1">Opens</label>
                                  <select
                                    value={geoSettings.timeBeforeEvent}
                                    onChange={e => setGeoSettings(g => ({ ...g, timeBeforeEvent: e.target.value }))}
                                    className="w-full h-7 px-2 rounded-lg border border-blue-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                                  >
                                    <option value="15m">15 min before</option>
                                    <option value="30m">30 min before</option>
                                    <option value="1h">1 hour before</option>
                                    <option value="2h">2 hours before</option>
                                    <option value="day_of">Day of event</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-dark-500 mb-1.5">Frequency</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => setGeoSettings(g => ({ ...g, requireEveryEvent: true }))}
                                    className={`p-2 rounded-lg border-2 text-left transition-all ${geoSettings.requireEveryEvent ? 'border-blue-400 bg-white' : 'border-blue-100 bg-white/50 hover:border-blue-200'}`}
                                  >
                                    <p className="text-[10px] font-bold text-dark-800">Every Event</p>
                                    <p className="text-[9px] text-dark-400">Each event separately</p>
                                  </button>
                                  <button
                                    onClick={() => setGeoSettings(g => ({ ...g, requireEveryEvent: false }))}
                                    className={`p-2 rounded-lg border-2 text-left transition-all ${!geoSettings.requireEveryEvent ? 'border-blue-400 bg-white' : 'border-blue-100 bg-white/50 hover:border-blue-200'}`}
                                  >
                                    <p className="text-[10px] font-bold text-dark-800">Once Per Day</p>
                                    <p className="text-[9px] text-dark-400">First check-in covers day</p>
                                  </button>
                                </div>
                              </div>
                              {!geoSettings.requireEveryEvent && (
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-bold text-dark-500 shrink-0">Max gap (same venue)</label>
                                  <input
                                    type="number"
                                    value={geoSettings.maxTimeBetweenEvents}
                                    onChange={e => setGeoSettings(g => ({ ...g, maxTimeBetweenEvents: parseInt(e.target.value) || 0 }))}
                                    className="w-16 h-7 px-2 rounded-lg border border-blue-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                                  />
                                  <span className="text-[10px] text-dark-500">min</span>
                                </div>
                              )}
                              {/* Check-out Required */}
                              <div className="flex items-center justify-between pt-1 border-t border-blue-100">
                                <label className="text-[10px] font-bold text-dark-500">Check-out Required</label>
                                <div className="flex gap-1.5">
                                  <button onClick={() => setRoleCheckOut(r => ({ ...r, [key]: true }))}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${roleCheckOut[key] ? 'bg-court-500 text-white' : 'bg-white text-dark-400 border border-blue-200 hover:bg-blue-50'}`}>Yes</button>
                                  <button onClick={() => setRoleCheckOut(r => ({ ...r, [key]: false }))}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${!roleCheckOut[key] ? 'bg-dark-600 text-white' : 'bg-white text-dark-400 border border-blue-200 hover:bg-blue-50'}`}>No</button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Inline QR settings — shown when qr_code is selected */}
                      <AnimatePresence>
                        {current === 'qr_code' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mx-4 mb-3 rounded-xl border border-purple-100 bg-purple-50/40 p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1"><QrCode size={10} /> QR Settings</span>
                                {isQrModified && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Modified</span>
                                    <button
                                      onClick={() => setQrSettings({ ...attendanceQrConfig })}
                                      className="flex items-center gap-1 text-[10px] font-semibold text-dark-400 hover:text-dark-700 transition-colors"
                                    >
                                      <RotateCcw size={9} /> Reset
                                    </button>
                                  </div>
                                )}
                              </div>
                              {/* Admin Role */}
                              <div>
                                <label className="block text-[10px] font-bold text-dark-500 mb-1.5">Admin Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => setQrSettings(q => ({ ...q, adminRole: 'scanner' }))}
                                    className={`p-2 rounded-lg border-2 text-left transition-all ${qrSettings.adminRole === 'scanner' ? 'border-purple-400 bg-white' : 'border-purple-100 bg-white/50 hover:border-purple-200'}`}
                                  >
                                    <p className="text-[10px] font-bold text-dark-800">Scanner</p>
                                    <p className="text-[9px] text-dark-400">Admin holds device, scans others</p>
                                  </button>
                                  <button
                                    onClick={() => setQrSettings(q => ({ ...q, adminRole: 'code' }))}
                                    className={`p-2 rounded-lg border-2 text-left transition-all ${qrSettings.adminRole === 'code' ? 'border-purple-400 bg-white' : 'border-purple-100 bg-white/50 hover:border-purple-200'}`}
                                  >
                                    <p className="text-[10px] font-bold text-dark-800">Code</p>
                                    <p className="text-[9px] text-dark-400">User shows QR from profile</p>
                                  </button>
                                </div>
                              </div>
                              {/* QR Admin — who holds/manages the scanner */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-[10px] font-bold text-dark-500">QR Admin</label>
                                  <button
                                    onClick={() => setShowQrAdminModal(true)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-purple-200 text-[10px] font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
                                  >
                                    <User size={9} /> {qrAdminGroupIds.length + qrAdminUserIds.length > 0 ? 'Edit' : 'Select'}
                                  </button>
                                </div>

                                {qrAdminGroupIds.length === 0 && qrAdminUserIds.length === 0 ? (
                                  <p className="text-[9px] text-dark-300 italic">No admin selected</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {/* Groups */}
                                    {qrAdminGroupIds.map(gid => {
                                      const isRoleGroup = gid.startsWith('role-');
                                      const rawId = gid.replace(/^(role-|team-)/, '');

                                      let groupName = gid;
                                      let groupMembers: typeof users = [];

                                      if (isRoleGroup) {
                                        const role = settingsRoles.find(r => r.id === rawId);
                                        groupName = role?.name ?? gid;
                                        // Find users whose designation maps to this role
                                        const desByRole = designations.filter(d => d.roleId === rawId).map(d => d.name);
                                        groupMembers = users.filter(u => desByRole.includes(u.designation));
                                      } else {
                                        const team = teams.find(t => t.id === rawId);
                                        groupName = team?.name ?? gid;
                                        groupMembers = users.filter(u => u.teamIds.includes(rawId));
                                      }

                                      // Which group members are in this event's attendance?
                                      const inEvent = groupMembers.filter(gm => attendance.some(a => a.userId === gm.id));
                                      const hasNone = inEvent.length === 0;

                                      return (
                                        <div key={gid} className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-purple-50/60">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <Shield size={9} className="text-purple-500 shrink-0" />
                                            <span className="text-[10px] font-semibold text-purple-700 truncate">{groupName}</span>
                                          </div>
                                          {hasNone ? (
                                            <div className="relative group/none shrink-0">
                                              <AlertTriangle size={11} className="text-dark-300" />
                                              <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/none:opacity-100 pointer-events-none transition-opacity z-30">
                                                No members from this group in the event
                                                <div className="absolute top-full right-2 border-4 border-transparent border-t-dark-900" />
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center shrink-0">
                                              {inEvent.slice(0, 4).map((u, i) => (
                                                <div key={u.id} className="relative group/gm" style={{ marginLeft: i > 0 ? '-6px' : 0 }}>
                                                  <span className="w-5 h-5 rounded-full bg-purple-400 flex items-center justify-center text-[7px] font-bold text-white border border-white cursor-default">
                                                    {u.avatar}
                                                  </span>
                                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/gm:opacity-100 pointer-events-none transition-opacity z-30">
                                                    {u.firstName} {u.lastName}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-900" />
                                                  </div>
                                                </div>
                                              ))}
                                              {inEvent.length > 4 && (
                                                <div className="relative group/gmore" style={{ marginLeft: '-6px' }}>
                                                  <span className="w-5 h-5 rounded-full bg-purple-200 flex items-center justify-center text-[7px] font-bold text-purple-700 border border-white cursor-default">
                                                    +{inEvent.length - 4}
                                                  </span>
                                                  <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1.5 bg-dark-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/gmore:opacity-100 pointer-events-none transition-opacity z-30 space-y-0.5">
                                                    {inEvent.slice(4).map(u => <div key={u.id}>{u.firstName} {u.lastName}</div>)}
                                                    <div className="absolute top-full right-2 border-4 border-transparent border-t-dark-900" />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {/* Individual users */}
                                    {qrAdminUserIds.map(uid => {
                                      const u = users.find(x => x.id === uid);
                                      if (!u) return null;
                                      const inEvent = attendance.some(a => a.userId === uid);
                                      return (
                                        <div key={uid} className="flex items-center justify-between gap-2 py-1 px-2 rounded-lg bg-purple-50/60">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="w-5 h-5 rounded-full bg-purple-400 flex items-center justify-center text-[7px] font-bold text-white shrink-0">{u.avatar}</span>
                                            <span className="text-[10px] font-semibold text-purple-700 truncate">{u.firstName} {u.lastName}</span>
                                          </div>
                                          {!inEvent ? (
                                            <div className="relative group/uabs shrink-0">
                                              <AlertTriangle size={11} className="text-dark-300" />
                                              <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/uabs:opacity-100 pointer-events-none transition-opacity z-30">
                                                Not in this event's attendance
                                                <div className="absolute top-full right-2 border-4 border-transparent border-t-dark-900" />
                                            </div>
                                            </div>
                                          ) : (
                                            <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              {/* Frequency */}
                              <div>
                                <label className="block text-[10px] font-bold text-dark-500 mb-1.5">Frequency</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => setQrSettings(q => ({ ...q, requireEveryEvent: true }))}
                                    className={`p-2 rounded-lg border-2 text-left transition-all ${qrSettings.requireEveryEvent ? 'border-purple-400 bg-white' : 'border-purple-100 bg-white/50 hover:border-purple-200'}`}
                                  >
                                    <p className="text-[10px] font-bold text-dark-800">Every Event</p>
                                    <p className="text-[9px] text-dark-400">Each event separately</p>
                                  </button>
                                  <button
                                    onClick={() => setQrSettings(q => ({ ...q, requireEveryEvent: false }))}
                                    className={`p-2 rounded-lg border-2 text-left transition-all ${!qrSettings.requireEveryEvent ? 'border-purple-400 bg-white' : 'border-purple-100 bg-white/50 hover:border-purple-200'}`}
                                  >
                                    <p className="text-[10px] font-bold text-dark-800">Once Per Day</p>
                                    <p className="text-[9px] text-dark-400">First scan covers the day</p>
                                  </button>
                                </div>
                              </div>
                              {!qrSettings.requireEveryEvent && (
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-bold text-dark-500 shrink-0">Max gap (same venue)</label>
                                  <input
                                    type="number"
                                    value={qrSettings.maxTimeBetweenEvents}
                                    onChange={e => setQrSettings(q => ({ ...q, maxTimeBetweenEvents: parseInt(e.target.value) || 0 }))}
                                    className="w-16 h-7 px-2 rounded-lg border border-purple-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                                  />
                                  <span className="text-[10px] text-dark-500">min</span>
                                </div>
                              )}
                              {/* Check-out Required */}
                              <div className="flex items-center justify-between pt-1 border-t border-purple-100">
                                <label className="text-[10px] font-bold text-dark-500">Check-out Required</label>
                                <div className="flex gap-1.5">
                                  <button onClick={() => setRoleCheckOut(r => ({ ...r, [key]: true }))}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${roleCheckOut[key] ? 'bg-court-500 text-white' : 'bg-white text-dark-400 border border-purple-200 hover:bg-purple-50'}`}>Yes</button>
                                  <button onClick={() => setRoleCheckOut(r => ({ ...r, [key]: false }))}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${!roleCheckOut[key] ? 'bg-dark-600 text-white' : 'bg-white text-dark-400 border border-purple-200 hover:bg-purple-50'}`}>No</button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'players', 'coach', 'medical', 'staff'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${filter === f ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>{f}</button>
        ))}
        {reviewItems.length > 0 && (
          <button onClick={() => setFilter('review')}
            className={`ml-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${filter === 'review' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
            <AlertTriangle size={11} /> Review
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === 'review' ? 'bg-amber-400/60 text-white' : 'bg-amber-200 text-amber-800'}`}>{reviewItems.length}</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-50/60">
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400 w-10">#</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Name</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Check-in</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {filtered.map((record, i) => {
              const sc = statusConfig[record.status];
              const ci = checkInTypeConfig[record.checkInType];
              const isSelfCheckIn = record.checkInType !== 'to_be_marked';
              const isOverridden = !!record.overriddenBy;
              const checkoutRequired = roleCheckOut[roleToUserType[record.role]] ?? false;
              const missedCheckout = isSelfCheckIn && !!record.checkInTime && !record.checkOutTime && checkoutRequired && !record.checkoutResolution;
              const isStale = missedCheckout && !!record.staleMissedCheckout;
              return (
                <tr key={record.userId} className="hover:bg-dark-50/30 group">
                  <td className="px-4 py-3 text-xs text-dark-400 font-semibold">{record.jerseyNumber || i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        record.role === 'player' ? 'bg-gradient-to-br from-court-400 to-court-600' :
                        record.role === 'coach' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                        record.role === 'medical' ? 'bg-gradient-to-br from-red-400 to-red-500' :
                        'bg-gradient-to-br from-dark-400 to-dark-600'
                      }`}>
                        <span className="text-[9px] font-bold text-white">{record.avatar}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-dark-800">{record.name}</span>
                        {(() => {
                          const roleToType: Record<string, string> = { player: 'Athlete', coach: 'Coach', medical: 'Medical', staff: 'Operations', admin: 'General Admin' };
                          const userType = roleToType[record.role] || '';
                          const empCfg = employeeTypeConfigs.find(c => c.userType === userType);
                          if (empCfg?.isEmployee && empCfg?.eventHoursCount) {
                            return <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-600">HRMS</span>;
                          }
                          return null;
                        })()}
                        {filter === 'review' && (
                          <p className="text-[10px] text-dark-400 capitalize mt-0.5">{record.role}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${ci.bg} ${ci.text}`}>
                      {ci.icon} {ci.short}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => cycleStatus(record.userId)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all hover:ring-2 hover:ring-offset-1 hover:ring-current ${sc.bg} ${sc.text}`}>
                      {sc.icon} {sc.label}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">

                      {/* ── Check-in ── */}
                      {record.checkInTime ? (
                        <div className="flex items-start gap-1.5">
                          <LogIn size={9} className="text-green-500 mt-0.5 shrink-0" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-dark-700">In: {record.checkInTime}</span>
                            {/* QR: who held the scanner + timing */}
                            {record.checkInType === 'qr_code' && record.checkInAdminName && (
                              <span className="text-[10px] text-purple-600 flex items-center gap-1">
                                <User size={8} /> Admin: {record.checkInAdminName}
                              </span>
                            )}
                            {record.checkInType === 'qr_code' && record.qrCheckInTiming && (
                              <span className={`text-[10px] flex items-center gap-1 font-medium ${record.qrCheckInTiming === 'on_time' ? 'text-green-600' : 'text-red-500'}`}>
                                <Clock size={8} />
                                {record.qrCheckInTiming === 'on_time' ? 'On time' : (
                                  <>Late arrival{record.checkInTime && lateMins(record.checkInTime) ? <span className="font-normal opacity-60 ml-0.5">·{lateMins(record.checkInTime)}m</span> : null}</>
                                )}
                              </span>
                            )}
                            {/* Geo: early / on-time / late */}
                            {record.checkInType === 'geolocation' && record.geoCheckInTiming && (
                              <span className={`text-[10px] flex items-center gap-1 font-medium ${
                                record.geoCheckInTiming === 'on_time' ? 'text-green-600' :
                                record.geoCheckInTiming === 'early'   ? 'text-blue-500' :
                                'text-red-500'
                              }`}>
                                <Clock size={8} />
                                {record.geoCheckInTiming === 'on_time' ? 'On time' :
                                 record.geoCheckInTiming === 'early'   ? 'Arrived early' :
                                 <>{`Late arrival`}{record.checkInTime && lateMins(record.checkInTime) ? <span className="font-normal opacity-60 ml-0.5">·{lateMins(record.checkInTime)}m</span> : null}</>}
                              </span>
                            )}
                            {/* Geo: radius info */}
                            {record.geoLocation && (
                              <span className={`text-[10px] flex items-center gap-1 ${record.geoLocation.withinRadius ? 'text-dark-400' : 'text-red-500'}`}>
                                <Navigation size={8} />
                                {record.geoLocation.withinRadius ? 'Within radius' : 'Outside radius'} · {record.geoLocation.accuracy}m
                              </span>
                            )}
                          </div>
                        </div>
                      ) : isSelfCheckIn && record.status === 'pending' ? (
                        <span className="text-[10px] text-yellow-600 flex items-center gap-1">
                          <AlertTriangle size={9} /> Awaiting {record.checkInType === 'geolocation' ? 'geo' : 'QR'} check-in
                        </span>
                      ) : null}

                      {/* ── Check-out ── */}
                      {record.checkOutTime && (
                        <div className="flex items-start gap-1.5">
                          <LogOut size={9} className="text-dark-400 mt-0.5 shrink-0" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-semibold text-dark-700">Out: {record.checkOutTime}</span>
                            {/* QR check-out admin + timing */}
                            {record.checkOutType === 'qr_code' && record.checkOutAdminName && (
                              <span className="text-[10px] text-purple-600 flex items-center gap-1">
                                <User size={8} /> Admin: {record.checkOutAdminName}
                              </span>
                            )}
                            {record.checkOutType === 'qr_code' && record.qrCheckOutTiming && (
                              <span className={`text-[10px] flex items-center gap-1 font-medium ${record.qrCheckOutTiming === 'on_time' ? 'text-green-600' : 'text-amber-500'}`}>
                                <Clock size={8} />
                                {record.qrCheckOutTiming === 'on_time' ? 'On time' : (
                                  <>Left early{record.checkOutTime && earlyMins(record.checkOutTime) ? <span className="font-normal opacity-60 ml-0.5">·{earlyMins(record.checkOutTime)}m</span> : null}</>
                                )}
                              </span>
                            )}
                            {/* Geo check-out: on-time vs early */}
                            {record.checkOutType === 'geolocation' && record.geoCheckOutTiming && (
                              <span className={`text-[10px] flex items-center gap-1 font-medium ${record.geoCheckOutTiming === 'on_time' ? 'text-green-600' : 'text-amber-500'}`}>
                                <Clock size={8} />
                                {record.geoCheckOutTiming === 'on_time' ? 'After event end' : <>{`Left early`}{record.checkOutTime && earlyMins(record.checkOutTime) ? <span className="font-normal opacity-60 ml-0.5">·{earlyMins(record.checkOutTime)}m</span> : null}</>}
                              </span>
                            )}
                            {/* Geo check-out radius info */}
                            {record.geoCheckOutLocation && (
                              <span className={`text-[10px] flex items-center gap-1 ${record.geoCheckOutLocation.withinRadius ? 'text-dark-400' : 'text-red-500'}`}>
                                <Navigation size={8} />
                                {record.geoCheckOutLocation.withinRadius ? 'Within radius' : 'Outside radius'} · {record.geoCheckOutLocation.accuracy}m
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ── Override ── */}
                      {isOverridden && (
                        <span className="text-[10px] text-orange-600 flex items-center gap-1">
                          <Shield size={9} /> Override by {record.overriddenBy}: {record.overrideReason}
                        </span>
                      )}

                      {/* ── Note (manual rows only) ── */}
                      {!isSelfCheckIn && !isOverridden && (
                        editingNoteId === record.userId ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MessageSquare size={9} className="text-dark-400 shrink-0" />
                            <input
                              autoFocus
                              type="text"
                              value={noteInput}
                              onChange={e => setNoteInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  setAttendance(prev => prev.map(a => a.userId === record.userId ? { ...a, note: noteInput.trim() || undefined } : a));
                                  setEditingNoteId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingNoteId(null);
                                }
                              }}
                              onBlur={() => {
                                setAttendance(prev => prev.map(a => a.userId === record.userId ? { ...a, note: noteInput.trim() || undefined } : a));
                                setEditingNoteId(null);
                              }}
                              placeholder="Add comment…"
                              className="text-[10px] flex-1 bg-transparent border-b border-dark-300 focus:border-court-400 focus:outline-none text-dark-600 placeholder:text-dark-300 py-0.5 min-w-0"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => { setNoteInput(record.note || ''); setEditingNoteId(record.userId); }}
                            className="flex items-center gap-1 text-[10px] text-dark-400 hover:text-dark-700 transition-colors group/note mt-0.5 max-w-[180px]"
                          >
                            <MessageSquare size={9} className="shrink-0" />
                            {record.note ? (
                              <div className="relative min-w-0">
                                <span className="italic text-dark-500 group-hover/note:text-dark-700 truncate block max-w-[150px]">
                                  {record.note}
                                </span>
                                {record.note.length > 22 && (
                                  <div className="absolute bottom-full left-0 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/note:opacity-100 pointer-events-none transition-opacity z-30 font-normal not-italic max-w-[240px] break-words whitespace-normal">
                                    {record.note}
                                    <div className="absolute top-full left-3 border-4 border-transparent border-t-dark-900" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="opacity-0 group-hover/note:opacity-100 transition-opacity">Add comment</span>
                            )}
                          </button>
                        )
                      )}

                      {/* Note for non-manual rows (read-only) */}
                      {isSelfCheckIn && record.note && !isOverridden && (
                        <span className="text-[10px] text-dark-400 italic flex items-center gap-1">
                          <MessageSquare size={9} /> {record.note}
                        </span>
                      )}

                      {/* ── Missed checkout ── */}
                      {missedCheckout && !isStale && (
                        <div className="flex items-start gap-1.5 mt-0.5">
                          <LogOut size={9} className="text-amber-500 mt-0.5 shrink-0" />
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                              <AlertTriangle size={8} /> Checkout not recorded
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="time"
                                value={checkoutTimeInputs[record.userId] ?? ''}
                                onChange={e => setCheckoutTimeInputs(t => ({ ...t, [record.userId]: e.target.value }))}
                                className="h-6 px-1.5 rounded-lg border border-amber-200 text-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-amber-300"
                              />
                              <button
                                onClick={() => {
                                  const t = checkoutTimeInputs[record.userId];
                                  if (!t) return;
                                  setAttendance(prev => prev.map(a =>
                                    a.userId === record.userId
                                      ? { ...a, checkOutTime: t, staleMissedCheckout: false }
                                      : a
                                  ));
                                  setCheckoutTimeInputs(t2 => { const n = { ...t2 }; delete n[record.userId]; return n; });
                                }}
                                disabled={!checkoutTimeInputs[record.userId]}
                                className="h-6 px-2 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 disabled:opacity-40 transition-colors"
                              >
                                Log
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {isStale && !record.checkoutResolution && (
                        <button
                          onClick={e => { e.stopPropagation(); setShowCheckoutResolution(record.userId); setCheckoutResolutionStatus('present'); setCheckoutResolutionNote(''); }}
                          className="mt-0.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          <LogOut size={9} /> Resolve Checkout
                        </button>
                      )}
                      {record.checkoutResolution && (
                        <span className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={9} /> Resolved by {record.checkoutResolution.resolvedBy}
                        </span>
                      )}

                      {/* ── Appeal ── */}
                      {record.appeal?.status === 'pending' && (
                        <button
                          onClick={e => { e.stopPropagation(); setShowAppeal(record.userId); setAppealDecision('accepted'); setAppealStatus('excused'); }}
                          className="mt-0.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          <FileText size={9} /> View Appeal
                        </button>
                      )}
                      {record.appeal?.status === 'accepted' && (
                        <span className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={9} /> Appeal accepted by {record.appeal.resolvedBy}
                        </span>
                      )}
                      {record.appeal?.status === 'rejected' && (
                        <span className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                          <X size={9} /> Appeal rejected by {record.appeal.resolvedBy}
                        </span>
                      )}

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Override Modal */}
      <AnimatePresence>
        {showOverride && (() => {
          const record = attendance.find(a => a.userId === showOverride);
          if (!record) return null;
          const ci = checkInTypeConfig[record.checkInType];
          const sc = statusConfig[record.status];
          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowOverride(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
                onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

                {/* Header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">{record.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-900">{record.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${ci.bg} ${ci.text}`}>{ci.icon} {ci.short}</span>
                        <span className="text-dark-300 text-[10px]">·</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status selector */}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-2">Set Status To</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[...statusCycle.filter(s => s !== 'none'), 'pending' as AttendanceStatus].map(s => {
                      const c = statusConfig[s];
                      const selected = overrideStatus === s;
                      return (
                        <button key={s} onClick={() => setOverrideStatus(s)}
                          className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                            selected ? `${c.bg} ${c.text} border-current` : 'bg-dark-50 text-dark-400 border-transparent hover:bg-dark-100'}`}>
                          {c.icon} {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="px-5 pb-5 space-y-3">
                  {/* Reason */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">
                      Reason <span className="text-red-400">*</span>
                    </label>
                    <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} rows={3}
                      placeholder="Why are you overriding this check-in?"
                      className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm text-dark-700 placeholder:text-dark-300 focus:outline-none focus:ring-2 focus:ring-court-500/20 resize-none" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => setShowOverride(null)}
                      className="flex-1 h-9 rounded-xl border border-dark-200 text-sm font-medium text-dark-500 hover:bg-dark-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => applyOverride(showOverride)} disabled={!overrideReason.trim()}
                      className="flex-1 h-9 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5">
                      <Shield size={13} /> Apply Override
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Appeal Review Modal */}
      <AnimatePresence>
        {showAppeal && (() => {
          const record = attendance.find(a => a.userId === showAppeal);
          if (!record || !record.appeal) return null;
          const sc = statusConfig[record.status];
          return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowAppeal(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-dark-100">
                  <h3 className="text-base font-bold text-dark-900">Appeal Review</h3>
                  <p className="text-xs text-dark-400 mt-0.5">
                    Review the appeal filed by <span className="font-semibold text-dark-600">{record.name}</span> and accept or reject it.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Person + current status */}
                  <div className="flex items-center gap-3 p-3 bg-dark-50/60 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{record.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-dark-800">{record.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        <span className="text-[9px] text-dark-400">Current status</span>
                      </div>
                    </div>
                  </div>

                  {/* Appeal note */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1"><FileText size={10} /> Appeal Note</span>
                      <span className="text-[9px] text-amber-600">
                        {record.appeal.filedBy} · {new Date(record.appeal.filedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {new Date(record.appeal.filedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 italic leading-relaxed">"{record.appeal.note}"</p>
                  </div>

                  {/* Decision */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Decision</label>
                    <div className="flex gap-2">
                      <button onClick={() => setAppealDecision('accepted')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border ${appealDecision === 'accepted' ? 'bg-green-50 text-green-700 border-green-300 ring-2 ring-green-400 ring-offset-1' : 'bg-dark-50 text-dark-400 border-dark-200 hover:bg-dark-100'}`}>
                        <CheckCircle2 size={12} /> Accept
                      </button>
                      <button onClick={() => setAppealDecision('rejected')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all border ${appealDecision === 'rejected' ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-400 ring-offset-1' : 'bg-dark-50 text-dark-400 border-dark-200 hover:bg-dark-100'}`}>
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>

                  {/* Status selector — only when accepting */}
                  {appealDecision === 'accepted' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Set Status To</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {statusCycle.map(s => {
                          const c = statusConfig[s];
                          return (
                            <button key={s} onClick={() => setAppealStatus(s)}
                              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-bold transition-all ${
                                appealStatus === s ? `${c.bg} ${c.text} ring-2 ring-offset-1 ring-current` : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>
                              {c.icon} {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100">
                  <button onClick={() => setShowAppeal(null)} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
                  <button onClick={() => resolveAppeal(showAppeal)}
                    className={`h-9 px-5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-colors ${appealDecision === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    <Shield size={14} /> Resolve Appeal
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Checkout Resolution Modal */}
      <AnimatePresence>
        {showCheckoutResolution && (() => {
          const record = attendance.find(a => a.userId === showCheckoutResolution);
          if (!record) return null;
          const endTime = event?.end?.time ?? '—';
          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowCheckoutResolution(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
                onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">{record.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-900">{record.name}</p>
                      <p className="text-[10px] text-dark-400 mt-0.5">Checkout not recorded</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 mb-4 space-y-0.5">
                    <p className="text-[10px] text-amber-700">
                      <span className="font-bold">Checked in:</span> {record.checkInTime}
                    </p>
                    <p className="text-[10px] text-amber-700">
                      <span className="font-bold">Event ended:</span> {endTime} — no checkout was recorded
                    </p>
                    <p className="text-[10px] text-amber-600 italic mt-1">Requires manual resolution as it has been more than 12 hours.</p>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-2">Set Final Status</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-4">
                    {(['present', 'left_early', 'absent', 'excused'] as AttendanceStatus[]).map(s => {
                      const c = statusConfig[s];
                      return (
                        <button key={s} onClick={() => setCheckoutResolutionStatus(s)}
                          className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                            checkoutResolutionStatus === s ? `${c.bg} ${c.text} border-current` : 'bg-dark-50 text-dark-400 border-transparent hover:bg-dark-100'}`}>
                          {c.icon} {c.label}
                        </button>
                      );
                    })}
                  </div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">
                    Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={checkoutResolutionNote}
                    onChange={e => setCheckoutResolutionNote(e.target.value)}
                    rows={2}
                    placeholder="Explain the resolution for this missed checkout..."
                    className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm text-dark-700 placeholder:text-dark-300 focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none"
                  />
                </div>
                <div className="flex gap-2 px-5 pb-5">
                  <button onClick={() => setShowCheckoutResolution(null)}
                    className="flex-1 h-9 rounded-xl border border-dark-200 text-sm font-medium text-dark-500 hover:bg-dark-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!checkoutResolutionNote.trim()) return;
                      setAttendance(prev => prev.map(a =>
                        a.userId === showCheckoutResolution ? {
                          ...a,
                          status: checkoutResolutionStatus,
                          staleMissedCheckout: false,
                          checkoutResolution: { status: checkoutResolutionStatus, note: checkoutResolutionNote, resolvedBy: 'Admin', resolvedAt: new Date().toISOString() },
                        } : a
                      ));
                      setShowCheckoutResolution(null);
                      setCheckoutResolutionNote('');
                    }}
                    disabled={!checkoutResolutionNote.trim()}
                    className="flex-1 h-9 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Shield size={13} /> Resolve
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* QR Admin picker modal */}
      <AssignUsersModal
        open={showQrAdminModal}
        onClose={() => setShowQrAdminModal(false)}
        onDone={(groupIds, userIds) => {
          setQrAdminGroupIds(groupIds);
          setQrAdminUserIds(userIds);
          setShowQrAdminModal(false);
        }}
        initialGroupIds={qrAdminGroupIds}
        initialUserIds={qrAdminUserIds}
      />
    </div>
  );
}
