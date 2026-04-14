import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, ChevronDown, Calendar as CalendarIcon, Clock,
  MapPin, Plus,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, Link2, RemoveFormatting,
  MessageSquare, Users, UserPlus, Repeat,
  Sparkles, Clock3, MapPinned, Type, UsersRound, Bell,
  ChevronUp, FileText, Eye, Globe, BellRing, BellOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { eventTypes, CalendarEvent } from '@/data/events';
import { teams as allTeams } from '@/data/teams';
import { facilityCenters } from '@/data/facilities';
import { settingsActivities } from '@/data/settings';
import { seasons } from '@/data/seasons';
import { segments, getSegmentsForTeam, Segment } from '@/data/segments';
import { users } from '@/data/users';
import { AssignUsersModal } from '@/components/ui/VisibilityPicker';

// ══════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ══════════════════════════════════════════════════════
type PublishMode = 'draft' | 'review' | 'publish';
type Recurrence = 'none' | 'custom';
type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';
type RecurrenceEnd = 'never' | 'on_date' | 'after';
type ReminderAudience = 'attendees' | 'attendees_guardians' | 'guardians' | 'none';

interface CustomRecurrence {
  repeatEvery: number;
  frequency: RecurrenceFrequency;
  repeatOnDays: boolean[];
  monthlyOrdinal: string;
  monthlyDay: string;
  endType: RecurrenceEnd;
  endDate: string;
  endAfterOccurrences: number;
}

interface ReminderTiming { id: string; value: number; unit: 'minutes' | 'hours' | 'days'; }

interface CreateEventForm {
  activityId: string; seasonId: string; eventTypeId: string;
  date: string; startTime: string; endTime: string; noEndTime: boolean;
  timezone: string; allDay: boolean; allDayEndDate: string; recurrence: Recurrence;
  customRecurrence: CustomRecurrence;
  locationType: 'home' | 'away' | 'neutral'; venueId: string; facilityId: string; awayLocation: string;
  title: string; description: string;
  addToSegment: boolean; teamIds: string[]; segmentId: string; batchIds: string[];
  selectedMemberIds: string[]; selectedGroupIds: string[];
  reminderAudience: ReminderAudience; reminderChannels: string[]; reminders: ReminderTiming[];
}

interface Props { open: boolean; onClose: () => void; initialDate?: string; initialEndDate?: string; initialAllDay?: boolean; initialStartTime?: string; initialEndTime?: string; initialVenueId?: string; initialFacilityId?: string; editEvent?: CalendarEvent | null; }

const timezones = [
  { id: 'Asia/Kolkata', label: 'IST - (GMT+5:30)' },
  { id: 'Europe/London', label: 'GMT - (GMT+0:00)' },
  { id: 'America/New_York', label: 'EST - (GMT-5:00)' },
  { id: 'America/Los_Angeles', label: 'PST - (GMT-8:00)' },
  { id: 'Europe/Paris', label: 'CET - (GMT+1:00)' },
  { id: 'Asia/Dubai', label: 'GST - (GMT+4:00)' },
];

const defaultCustomRecurrence: CustomRecurrence = {
  repeatEvery: 1, frequency: 'weekly',
  repeatOnDays: [false, true, false, false, false, false, false],
  monthlyOrdinal: 'first', monthlyDay: 'Monday',
  endType: 'never', endDate: '', endAfterOccurrences: 10,
};

const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ordinals = ['first', 'second', 'third', 'fourth', 'last'];

// ══════════════════════════════════════════════════════
// REUSABLE UI
// ══════════════════════════════════════════════════════
function Dropdown({ label, value, options, onChange, placeholder, className = '' }: {
  label?: string; value: string;
  options: { id: string; label: string; color?: string; disabled?: boolean; hint?: string }[];
  onChange: (id: string) => void; placeholder?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  return (
    <div className={`relative min-w-0 ${className}`}>
      {label && <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1.5">{label}</label>}
      <button onClick={() => setOpen(!open)}
        className="w-full h-10 px-3 rounded-xl border border-dark-200 bg-white text-left flex items-center justify-between gap-2 hover:border-dark-300 transition-colors">
        <span className={`text-sm truncate flex items-center gap-2 ${selected ? 'text-dark-800 font-medium' : 'text-dark-400'}`}>
          {selected?.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />}
          {selected?.label || placeholder || 'Select...'}
        </span>
        <ChevronDown size={14} className={`text-dark-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (<>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-dark-200 rounded-xl shadow-elevated z-[71] max-h-52 overflow-y-auto">
            {options.map(opt => (
              <button key={opt.id} disabled={opt.disabled} onClick={() => { onChange(opt.id); setOpen(false); }}
                className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                  opt.disabled ? 'opacity-40 cursor-not-allowed' : opt.id === value ? 'bg-court-50 text-court-700 font-medium' : 'hover:bg-dark-50 text-dark-700'
                }`}>
                {opt.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
                <span className="truncate">{opt.label}</span>
                {opt.hint && <span className="ml-auto text-[10px] text-dark-400 shrink-0">{opt.hint}</span>}
              </button>
            ))}
          </motion.div>
        </>)}
      </AnimatePresence>
    </div>
  );
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-dark-100 bg-white p-5 space-y-4 ${className}`}>{children}</div>;
}

function SectionHeader({ icon, children, trailing }: { icon: React.ReactNode; children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-court-50 flex items-center justify-center text-court-500 shrink-0">{icon}</div>
      <p className="text-sm font-bold text-dark-800 flex-1">{children}</p>
      {trailing}
    </div>
  );
}

function Divider({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-dark-200" />
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-50 border border-dark-100">
        <span className="text-dark-400">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">{label}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-dark-200" />
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN DRAWER
// ══════════════════════════════════════════════════════
export default function CreateEventWizard({ open, onClose, initialDate, initialEndDate, initialAllDay, initialStartTime, initialEndTime, initialVenueId, initialFacilityId, editEvent }: Props) {
  const isEditing = !!editEvent;
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);
  const [publishMode, setPublishMode] = useState<PublishMode>('publish');
  const [notifyOnPublish, setNotifyOnPublish] = useState(true);
  const [publishMenuOpen, setPublishMenuOpen] = useState(false);

  const defaultForm: CreateEventForm = {
    activityId: settingsActivities[0]?.id || '',
    seasonId: seasons.find(s => s.status === 'active')?.id || seasons[0]?.id || '',
    eventTypeId: '', date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00', endTime: '10:00', noEndTime: false,
    timezone: 'Asia/Kolkata', allDay: false, allDayEndDate: '', recurrence: 'none',
    customRecurrence: { ...defaultCustomRecurrence },
    locationType: 'home', venueId: '', facilityId: '', awayLocation: '',
    title: '', description: '',
    addToSegment: false, teamIds: [], segmentId: '', batchIds: [],
    selectedMemberIds: [], selectedGroupIds: [],
    reminderAudience: 'attendees', reminderChannels: ['courtside', 'whatsapp'],
    reminders: [{ id: 'r-1', value: 10, unit: 'minutes' }],
  };

  const [form, setForm] = useState<CreateEventForm>(defaultForm);

  useEffect(() => {
    if (open) {
      if (editEvent) {
        setForm({
          ...defaultForm,
          eventTypeId: editEvent.eventType.id,
          date: editEvent.start.date,
          startTime: editEvent.start.time,
          endTime: editEvent.end.time,
          timezone: editEvent.start.timezone,
          allDay: editEvent.allDay,
          allDayEndDate: editEvent.allDay ? editEvent.end.date : '',
          locationType: editEvent.locationtype as CreateEventForm['locationType'],
          venueId: editEvent.facilityCenterId || '',
          facilityId: editEvent.facilityIds?.[0] || '',
          awayLocation: editEvent.locationtype !== 'home' ? editEvent.location : '',
          title: editEvent.title,
          description: editEvent.description,
          teamIds: editEvent.teamIds,
        });
      } else {
        const startDate = initialDate || format(new Date(), 'yyyy-MM-dd');
        setForm({
          ...defaultForm,
          date: startDate,
          allDay: initialAllDay ?? false,
          allDayEndDate: initialAllDay && initialEndDate ? initialEndDate : '',
          startTime: initialStartTime || '09:00',
          endTime: initialEndTime || '10:00',
          venueId: initialVenueId || '',
          facilityId: initialFacilityId || '',
        });
      }
      setPublishMode('publish'); setNotifyOnPublish(true); setPublishMenuOpen(false);
    }
  }, [open]);

  const set = <K extends keyof CreateEventForm>(key: K, val: CreateEventForm[K]) =>
    setForm(p => {
      const next = { ...p, [key]: val };
      if (key === 'date') next.allDayEndDate = next.allDayEndDate || (val as string);
      if (key === 'allDay' && val) { if (!p.allDayEndDate) next.allDayEndDate = p.date; next.recurrence = 'none'; }
      return next;
    });

  const selectedEventType = eventTypes.find(et => et.id === form.eventTypeId);
  const selectedVenue = facilityCenters.find(fc => fc.id === form.venueId);
  const availableSegments = useMemo(() => {
    if (form.teamIds.length === 0) return [];
    const segs: Segment[] = [];
    for (const tid of form.teamIds) segs.push(...getSegmentsForTeam(tid));
    return segs;
  }, [form.teamIds]);
  const selectedSegment = segments.find(s => s.id === form.segmentId);

  const handleCreate = () => { onClose(); setForm(defaultForm); };

  // Change detection for edit mode
  const editChanges = useMemo(() => {
    if (!editEvent) return [];
    const ch: { field: string; from: string; to: string }[] = [];
    const fmt12 = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`; };
    const fmtDate = (d: string) => { try { return format(new Date(d + 'T00:00'), 'MMM d, yyyy'); } catch { return d; } };
    const trunc = (s: string, n: number) => s.length > n ? s.slice(0, n) + '...' : s;
    const etOld = eventTypes.find(e => e.id === editEvent.eventType.id);
    const etNew = eventTypes.find(e => e.id === form.eventTypeId);
    if (editEvent.eventType.id !== form.eventTypeId) ch.push({ field: 'Event Type', from: etOld?.name || '—', to: etNew?.name || '—' });
    if (editEvent.title !== form.title) ch.push({ field: 'Title', from: trunc(editEvent.title || '(empty)', 30), to: trunc(form.title || '(empty)', 30) });
    if (editEvent.description !== form.description) ch.push({ field: 'Description', from: trunc(editEvent.description || '(empty)', 30), to: trunc(form.description || '(empty)', 30) });
    if (editEvent.start.date !== form.date) ch.push({ field: 'Date', from: fmtDate(editEvent.start.date), to: fmtDate(form.date) });
    if (editEvent.start.time !== form.startTime) ch.push({ field: 'Start Time', from: fmt12(editEvent.start.time), to: fmt12(form.startTime) });
    if (editEvent.end.time !== form.endTime) ch.push({ field: 'End Time', from: fmt12(editEvent.end.time), to: fmt12(form.endTime) });
    if (editEvent.start.timezone !== form.timezone) ch.push({ field: 'Timezone', from: editEvent.start.timezone, to: form.timezone });
    if (editEvent.allDay !== form.allDay) ch.push({ field: 'All Day', from: editEvent.allDay ? 'Yes' : 'No', to: form.allDay ? 'Yes' : 'No' });
    if (editEvent.locationtype !== form.locationType) ch.push({ field: 'Location Type', from: editEvent.locationtype, to: form.locationType });
    if (editEvent.locationtype === 'home' && form.locationType === 'home') {
      if ((editEvent.facilityCenterId || '') !== form.venueId) {
        const vOld = facilityCenters.find(f => f.id === editEvent.facilityCenterId)?.name || '—';
        const vNew = facilityCenters.find(f => f.id === form.venueId)?.name || '—';
        ch.push({ field: 'Venue', from: vOld, to: vNew });
      }
    }
    if (editEvent.locationtype !== 'home' && form.locationType !== 'home' && editEvent.location !== form.awayLocation) ch.push({ field: 'Location', from: editEvent.location, to: form.awayLocation });
    if (JSON.stringify(editEvent.teamIds.sort()) !== JSON.stringify([...form.teamIds].sort())) {
      const oldNames = editEvent.teamNames.join(', ') || '(none)';
      const newNames = allTeams.filter(t => form.teamIds.includes(t.id)).map(t => t.name).join(', ') || '(none)';
      ch.push({ field: 'Teams', from: oldNames, to: newNames });
    }
    return ch;
  }, [editEvent, form]);

  const [editNotify, setEditNotify] = useState(false);

  // People helpers
  const [teamsOpen, setTeamsOpen] = useState(false);
  const toggleTeam = (teamId: string) => {
    const next = form.teamIds.includes(teamId) ? form.teamIds.filter(t => t !== teamId) : [...form.teamIds, teamId];
    set('teamIds', next);
    if (!next.includes(selectedSegment?.teamId || '')) { set('segmentId', ''); set('batchIds', []); }
  };
  const toggleBatch = (batchId: string) => {
    set('batchIds', form.batchIds.includes(batchId) ? form.batchIds.filter(b => b !== batchId) : [...form.batchIds, batchId]);
  };
  const isSegmentValid = (seg: Segment) => !form.date || (form.date >= seg.startDate && form.date <= seg.endDate);
  const memberCount = form.selectedMemberIds.length + form.selectedGroupIds.length;

  // Reminder helpers
  const audienceOptions: { key: ReminderAudience; label: string; desc: string }[] = [
    { key: 'attendees', label: 'Only Event Attendees', desc: 'Players and staff assigned to this event' },
    { key: 'attendees_guardians', label: 'Attendees + Guardians', desc: 'Players, staff, and their guardians' },
    { key: 'guardians', label: 'Only Guardians', desc: 'Only guardians of assigned players' },
    { key: 'none', label: "Don't send reminders", desc: 'No notifications will be sent' },
  ];
  const addReminder = () => set('reminders', [...form.reminders, { id: `r-${Date.now()}`, value: 10, unit: 'minutes' as const }]);
  const removeReminder = (id: string) => set('reminders', form.reminders.filter(r => r.id !== id));
  const updateReminder = (id: string, u: Partial<ReminderTiming>) => set('reminders', form.reminders.map(r => r.id === id ? { ...r, ...u } : r));
  const toggleChannel = (ch: string) => set('reminderChannels', form.reminderChannels.includes(ch) ? form.reminderChannels.filter(c => c !== ch) : [...form.reminderChannels, ch]);
  const showReminderDetails = form.reminderAudience !== 'none';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-drawer z-50 flex flex-col"
          >
            {/* ── Header ──────────────────────────────── */}
            <div className="shrink-0 bg-gradient-to-r from-court-500 to-court-600 text-white">
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight">{isEditing ? 'Edit Event' : 'Create Event'}</h2>
                    <p className="text-court-100 text-xs mt-0.5">
                      {isEditing ? (editEvent?.title || 'Update event details') : form.date ? format(new Date(form.date + 'T00:00'), 'EEEE, MMM d, yyyy') : 'Set up your event details'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedEventType && (
                    <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/20 backdrop-blur truncate">
                      {selectedEventType.name}
                    </span>
                  )}
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={18} /></button>
                </div>
              </div>
            </div>

            {/* ── Scrollable Body ──────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-gradient-to-b from-dark-50/40 to-white">
              <div className="space-y-5">

                {/* ─── Section: Activity / Season / Type ─── */}
                <Section>
                  <SectionHeader icon={<Sparkles size={14} />}>Event Details</SectionHeader>
                  <div className="grid grid-cols-3 gap-3">
                    <Dropdown label="Activity" value={form.activityId} onChange={v => set('activityId', v)}
                      options={settingsActivities.map(a => ({ id: a.id, label: a.name }))} placeholder="Activity" />
                    <Dropdown label="Season" value={form.seasonId} onChange={v => set('seasonId', v)}
                      options={seasons.filter(s => s.activityId === form.activityId).map(s => ({ id: s.id, label: s.name }))} placeholder="Season" />
                    <Dropdown label="Type" value={form.eventTypeId} onChange={v => set('eventTypeId', v)}
                      options={eventTypes.map(et => ({ id: et.id, label: et.name, color: et.color }))} placeholder="Type" />
                  </div>
                </Section>

                {/* ─── Section: Date & Time ─── */}
                <Section>
                  <SectionHeader icon={<Clock3 size={14} />}>When does this event occur?</SectionHeader>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1.5">{form.allDay ? 'Start Date' : 'Date'}</label>
                      <div className="relative">
                        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                          className="w-full h-10 px-3 pr-9 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-300 transition-shadow" />
                        <CalendarIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                      </div>
                      {form.date && <p className="text-[11px] text-court-500 font-medium mt-1">{format(new Date(form.date + 'T00:00'), 'EEEE, MMM d, yyyy')}</p>}
                    </div>
                    {form.allDay ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1.5">End Date</label>
                        <div className="relative">
                          <input type="date" value={form.allDayEndDate} onChange={e => set('allDayEndDate', e.target.value)} min={form.date}
                            className="w-full h-10 px-3 pr-9 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-300 transition-shadow" />
                          <CalendarIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                        </div>
                        {form.allDayEndDate && <p className="text-[11px] text-court-500 font-medium mt-1">{format(new Date(form.allDayEndDate + 'T00:00'), 'EEEE, MMM d, yyyy')}</p>}
                      </div>
                    ) : (
                      <Dropdown label="Timezone" value={form.timezone} onChange={v => set('timezone', v)}
                        options={timezones.map(tz => ({ id: tz.id, label: tz.label }))} />
                    )}
                  </div>

                  {!form.allDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1.5">Start time</label>
                        <div className="relative">
                          <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                            className="w-full h-10 px-3 pr-9 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-300 transition-shadow" />
                          <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                        </div>
                      </div>
                      {!form.noEndTime && (
                        <div>
                          <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1.5">End time</label>
                          <div className="relative">
                            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                              className="w-full h-10 px-3 pr-9 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-300 transition-shadow" />
                            <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-5 flex-wrap">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <button onClick={() => set('allDay', !form.allDay)}
                        className={`w-10 h-[22px] rounded-full relative transition-colors ${form.allDay ? 'bg-court-500' : 'bg-dark-200'}`}>
                        <motion.div className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm"
                          animate={{ left: form.allDay ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                      </button>
                      <span className="text-xs font-medium text-dark-600">All day</span>
                    </label>
                    {!form.allDay && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.noEndTime} onChange={e => set('noEndTime', e.target.checked)}
                          className="w-4 h-4 rounded border-dark-300 text-court-500 focus:ring-court-500/20" />
                        <span className="text-xs font-medium text-dark-600">No end time</span>
                      </label>
                    )}
                  </div>

                  {!form.allDay && (<>
                    <div className="flex items-center gap-3 pt-1 border-t border-dashed border-dark-100">
                      <Repeat size={14} className="text-dark-400 shrink-0" />
                      <Dropdown value={form.recurrence} onChange={v => { if (v === 'custom') setRecurrenceModalOpen(true); else set('recurrence', v as Recurrence); }}
                        options={[{ id: 'none', label: 'Does not repeat' }, { id: 'custom', label: 'Custom...' }]} className="flex-1" />
                      {form.recurrence === 'custom' && (
                        <button onClick={() => setRecurrenceModalOpen(true)} className="text-[11px] font-semibold text-court-600 hover:text-court-700 shrink-0">Edit</button>
                      )}
                    </div>
                    {form.recurrence === 'custom' && (() => {
                      const cr = form.customRecurrence;
                      const every = cr.repeatEvery === 1 ? '' : `${cr.repeatEvery} `;
                      const freq = cr.frequency === 'daily' ? (cr.repeatEvery === 1 ? 'day' : 'days')
                        : cr.frequency === 'weekly' ? (cr.repeatEvery === 1 ? 'week' : 'weeks')
                        : (cr.repeatEvery === 1 ? 'month' : 'months');
                      let text = `Every ${every}${freq}`;
                      if (cr.frequency === 'weekly') {
                        const days = cr.repeatOnDays.map((on, i) => on ? dayNames[i] : '').filter(Boolean);
                        if (days.length) text += ` on ${days.join(', ')}`;
                      }
                      if (cr.frequency === 'monthly') text += ` on the ${cr.monthlyOrdinal} ${cr.monthlyDay}`;
                      if (cr.endType === 'on_date' && cr.endDate) text += ` till ${format(new Date(cr.endDate + 'T00:00'), 'MMM d, yyyy')}`;
                      if (cr.endType === 'after') text += ` for ${cr.endAfterOccurrences} occurrences`;
                      return <p className="text-[11px] text-court-500 font-medium -mt-2 ml-[26px]">{text}</p>;
                    })()}
                  </>)}
                </Section>

                {/* ─── Section: Location ─── */}
                <Section>
                  <SectionHeader icon={<MapPinned size={14} />}
                    trailing={
                      <div className="flex items-center border border-dark-200 rounded-lg overflow-hidden">
                        {(['home', 'away', 'neutral'] as const).map(loc => (
                          <button key={loc} onClick={() => set('locationType', loc)}
                            className={`px-3.5 py-1.5 text-xs font-semibold transition-all capitalize ${form.locationType === loc ? 'bg-court-500 text-white' : 'bg-white text-dark-500 hover:bg-dark-50'}`}>
                            {loc}
                          </button>
                        ))}
                      </div>
                    }>
                    Event Location
                  </SectionHeader>

                  {form.locationType === 'home' ? (<>
                    <Dropdown label="Venue" value={form.venueId} onChange={v => { set('venueId', v); set('facilityId', ''); }}
                      options={facilityCenters.map(fc => ({ id: fc.id, label: fc.name }))} placeholder="Venue" />
                    {selectedVenue && (
                      <Dropdown label="Select Facility" value={form.facilityId} onChange={v => set('facilityId', v)}
                        options={selectedVenue.facilities.map(f => ({ id: f.id, label: f.name, hint: f.type }))} placeholder="Select Facility" />
                    )}
                    {form.venueId && (
                      <div className="rounded-xl border border-dark-200 overflow-hidden bg-gradient-to-br from-court-50/30 to-dark-50/50 relative" style={{ height: 140 }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center"><MapPin size={24} className="text-court-500 mx-auto mb-1 animate-bounce" /><p className="text-[10px] text-dark-400">HERE Maps</p></div>
                        </div>
                        <button className="absolute bottom-2.5 right-2.5 h-7 px-2.5 rounded-lg bg-white/90 backdrop-blur border border-dark-200 text-[10px] font-semibold text-dark-600 hover:bg-white flex items-center gap-1 shadow-sm">
                          <MapPin size={10} /> View on Map
                        </button>
                      </div>
                    )}
                  </>) : (<>
                    <div>
                      <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider mb-1.5">Location</label>
                      <div className="flex gap-2">
                        <input type="text" value={form.awayLocation} onChange={e => set('awayLocation', e.target.value)} placeholder="Enter location..."
                          className="flex-1 h-10 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-300 transition-shadow min-w-0" />
                        <button className="h-10 w-10 rounded-xl border border-dark-200 flex items-center justify-center text-dark-400 hover:bg-court-50 hover:text-court-500 hover:border-court-200 transition-colors shrink-0">
                          <MapPin size={16} />
                        </button>
                      </div>
                    </div>
                  </>)}
                </Section>

                {/* ─── Section: Title & Description ─── */}
                <Section>
                  <SectionHeader icon={<Type size={14} />}>Title & Description</SectionHeader>
                  <div>
                    <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Event title"
                      className="w-full h-11 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-800 placeholder:text-dark-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-300 transition-shadow" />
                    <p className="text-[11px] text-dark-400 mt-1.5 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-dark-100 flex items-center justify-center text-[8px] font-bold text-dark-400 shrink-0">i</span>
                      Event type will appear as the title if not entered.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 px-2.5 py-1.5 border border-dark-200 border-b-0 rounded-t-xl bg-dark-50/60 overflow-x-hidden">
                      <span className="text-xs font-medium text-dark-600 px-2 py-1 rounded hover:bg-dark-100 cursor-pointer flex items-center gap-1 shrink-0">Normal <ChevronDown size={10} /></span>
                      <div className="w-px h-5 bg-dark-200 mx-0.5 shrink-0" />
                      {[Bold, Italic, Underline, Strikethrough].map((Icon, i) => (
                        <button key={i} className="p-1.5 rounded hover:bg-dark-100 text-dark-500 shrink-0"><Icon size={14} /></button>
                      ))}
                      <div className="w-px h-5 bg-dark-200 mx-0.5 shrink-0" />
                      {[ListOrdered, List].map((Icon, i) => (
                        <button key={i} className="p-1.5 rounded hover:bg-dark-100 text-dark-500 shrink-0"><Icon size={14} /></button>
                      ))}
                      <div className="w-px h-5 bg-dark-200 mx-0.5 shrink-0" />
                      {[AlignLeft, AlignCenter].map((Icon, i) => (
                        <button key={i} className="p-1.5 rounded hover:bg-dark-100 text-dark-500 shrink-0"><Icon size={14} /></button>
                      ))}
                      <div className="w-px h-5 bg-dark-200 mx-0.5 shrink-0" />
                      <button className="p-1.5 rounded hover:bg-dark-100 text-dark-500 shrink-0"><Link2 size={14} /></button>
                      <button className="p-1.5 rounded hover:bg-dark-100 text-dark-500 shrink-0"><RemoveFormatting size={14} /></button>
                    </div>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                      placeholder="Description (Optional)"
                      className="w-full px-3 py-2.5 rounded-b-xl border border-dark-200 text-sm text-dark-700 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-300 resize-none transition-shadow" />
                  </div>
                </Section>

                {/* ─── Divider: People ─── */}
                <Divider icon={<UsersRound size={11} />} label="People" />

                {/* ─── Section: Teams ─── */}
                <Section>
                  <SectionHeader icon={<Users size={14} />}>Teams</SectionHeader>
                  <div className="relative">
                    <button onClick={() => setTeamsOpen(!teamsOpen)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-dark-200 bg-white text-left flex items-center flex-wrap gap-1.5 hover:border-dark-300 transition-colors">
                      {form.teamIds.length === 0 && <span className="text-sm text-dark-400">Select teams...</span>}
                      {form.teamIds.map(tid => {
                        const team = allTeams.find(t => t.id === tid);
                        if (!team) return null;
                        return (
                          <span key={tid} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-sm" style={{ backgroundColor: team.color }}>
                            {team.shortName || team.name}
                            <button onClick={e => { e.stopPropagation(); toggleTeam(tid); }} className="hover:opacity-70"><X size={10} /></button>
                          </span>
                        );
                      })}
                      <ChevronDown size={14} className={`ml-auto text-dark-400 shrink-0 transition-transform ${teamsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {teamsOpen && (<>
                        <div className="fixed inset-0 z-[70]" onClick={() => setTeamsOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-dark-200 rounded-xl shadow-elevated z-[71] max-h-52 overflow-y-auto">
                          {allTeams.map(team => {
                            const sel = form.teamIds.includes(team.id);
                            return (
                              <button key={team.id} onClick={() => toggleTeam(team.id)}
                                className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors ${sel ? 'bg-court-50' : 'hover:bg-dark-50'}`}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${sel ? 'bg-court-500 border-court-500' : 'border-dark-300'}`}>
                                  {sel && <Check size={10} className="text-white" strokeWidth={3} />}
                                </div>
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                                <span className="font-medium text-dark-700 truncate">{team.name}</span>
                                <span className="ml-auto text-[10px] text-dark-400 shrink-0">{team.memberCount}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      </>)}
                    </AnimatePresence>
                  </div>
                </Section>

                {/* ─── Section: Segment Toggle ─── */}
                <Section>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm font-medium text-dark-700">Add this event to a segment?</span>
                    <div className="flex items-center border border-dark-200 rounded-lg overflow-hidden">
                      <button onClick={() => set('addToSegment', true)}
                        className={`px-4 py-1.5 text-xs font-semibold transition-all ${form.addToSegment ? 'bg-court-500 text-white' : 'bg-white text-dark-500 hover:bg-dark-50'}`}>Yes</button>
                      <button onClick={() => { set('addToSegment', false); set('segmentId', ''); set('batchIds', []); }}
                        className={`px-4 py-1.5 text-xs font-semibold transition-all ${!form.addToSegment ? 'bg-court-500 text-white' : 'bg-white text-dark-500 hover:bg-dark-50'}`}>No</button>
                    </div>
                  </div>
                </Section>

                {/* ─── Section: Segments & Batches ─── */}
                {form.addToSegment && form.teamIds.length > 0 && (
                  <Section>
                    <Dropdown label="Segments" value={form.segmentId} onChange={v => { set('segmentId', v); set('batchIds', []); }}
                      options={availableSegments.map(seg => ({ id: seg.id, label: seg.name, disabled: !isSegmentValid(seg), hint: seg.type === 'batch' ? 'Batch' : 'Segment' }))} placeholder="Select segment..." />
                    <p className="text-[10px] text-dark-400 flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-dark-100 flex items-center justify-center text-[7px] font-bold text-dark-400 shrink-0">i</span>
                      Segments outside event date range are disabled
                    </p>
                    {selectedSegment?.type === 'batch' && selectedSegment.batches && (
                      <div className="space-y-2 pt-2 border-t border-dashed border-dark-100">
                        <label className="block text-[11px] font-semibold text-dark-500 uppercase tracking-wider">Select Batches</label>
                        {selectedSegment.batches.map(batch => {
                          const sel = form.batchIds.includes(batch.id);
                          return (
                            <button key={batch.id} onClick={() => toggleBatch(batch.id)}
                              className={`w-full p-3 rounded-xl border text-left transition-all ${sel ? 'border-court-500 bg-court-50/50 shadow-sm shadow-court-500/10' : 'border-dark-200 hover:border-dark-300'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${sel ? 'bg-court-500 border-court-500' : 'border-dark-300'}`}>
                                  {sel && <Check size={11} className="text-white" strokeWidth={3} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: batch.eventColor }} /><span className="text-sm font-semibold text-dark-800 truncate">{batch.name}</span></div>
                                  <p className="text-[11px] text-dark-400 mt-0.5 truncate">{batch.days.join(', ')} · {batch.time} · {batch.enrolledCount}/{batch.capacity || '∞'}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Section>
                )}

                {/* ─── Section: Members ─── */}
                <Section>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <SectionHeader icon={<UserPlus size={14} />}>Members</SectionHeader>
                    <button onClick={() => setMemberModalOpen(true)}
                      className="h-9 px-4 rounded-xl bg-court-500 text-white text-xs font-bold hover:bg-court-600 transition-colors flex items-center gap-2 shadow-sm shadow-court-500/20">
                      <UserPlus size={13} /> Select
                    </button>
                  </div>
                  {memberCount === 0 && (
                    <div className="flex items-center justify-center py-4 rounded-xl border border-dashed border-dark-200 bg-dark-50/30">
                      <p className="text-xs text-dark-400">Click "Select" to add members from your organization</p>
                    </div>
                  )}
                  {memberCount > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.selectedGroupIds.map(gid => (
                        <span key={gid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-court-50 text-court-700 text-[11px] font-semibold">
                          <Users size={11} /> {gid.replace(/^(des-|tag-|pos-)/, '')}
                          <button onClick={() => set('selectedGroupIds', form.selectedGroupIds.filter(g => g !== gid))} className="hover:text-red-500"><X size={10} /></button>
                        </span>
                      ))}
                      {form.selectedMemberIds.map(uid => {
                        const user = users.find(u => u.id === uid);
                        return (
                          <span key={uid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-100 text-dark-700 text-[11px] font-semibold">
                            {user ? `${user.firstName} ${user.lastName}` : uid}
                            <button onClick={() => set('selectedMemberIds', form.selectedMemberIds.filter(m => m !== uid))} className="hover:text-red-500"><X size={10} /></button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </Section>

                {/* ─── Divider: Reminders ─── */}
                <Divider icon={<Bell size={11} />} label="Reminders" />

                {/* ─── Section: Reminder Audience ─── */}
                <Section>
                  <SectionHeader icon={<Bell size={14} />}>Who should get reminders?</SectionHeader>
                  <div className="space-y-1.5">
                    {audienceOptions.map(opt => (
                      <label key={opt.key} onClick={() => set('reminderAudience', opt.key)}
                        className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${form.reminderAudience === opt.key ? 'bg-court-50/60 border-court-200' : 'border-transparent hover:bg-dark-50/50'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${form.reminderAudience === opt.key ? 'border-court-500' : 'border-dark-300'}`}>
                          {form.reminderAudience === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-court-500" />}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-sm block ${form.reminderAudience === opt.key ? 'text-dark-800 font-semibold' : 'text-dark-600 font-medium'}`}>{opt.label}</span>
                          <span className="text-[11px] text-dark-400 block">{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </Section>

                {/* ─── Section: Channels & Timing ─── */}
                {showReminderDetails && (
                  <Section>
                    <SectionHeader icon={<MessageSquare size={14} />}>Channels & Timing</SectionHeader>
                    <div className="flex items-center gap-4">
                      {[
                        { key: 'courtside', label: 'Courtside', color: 'bg-court-500', icon: <span className="text-[10px] font-extrabold text-white">S</span>, checkColor: 'bg-court-500' },
                        { key: 'whatsapp', label: 'WhatsApp', color: 'bg-green-500', icon: <MessageSquare size={12} className="text-white" />, checkColor: 'bg-green-500' },
                      ].map(ch => {
                        const active = form.reminderChannels.includes(ch.key);
                        return (
                          <label key={ch.key} onClick={() => toggleChannel(ch.key)}
                            className={`flex items-center gap-2.5 cursor-pointer px-4 py-2.5 rounded-xl border transition-all ${active ? 'border-court-200 bg-court-50/40' : 'border-dark-200 hover:border-dark-300'}`}>
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${active ? ch.checkColor : 'border-2 border-dark-300'}`}>
                              {active && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                            <div className={`w-6 h-6 ${ch.key === 'whatsapp' ? 'rounded-full' : 'rounded-lg'} ${ch.color} flex items-center justify-center`}>{ch.icon}</div>
                            <span className={`text-sm ${active ? 'text-dark-800 font-medium' : 'text-dark-500'}`}>{ch.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="border-t border-dark-100 pt-4 space-y-3">
                      <p className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider">Reminder Timing</p>
                      <div className="space-y-2.5">
                        {form.reminders.map(rem => (
                          <div key={rem.id} className="flex items-center gap-2 flex-wrap">
                            <input type="number" min={1} value={rem.value} onChange={e => updateReminder(rem.id, { value: parseInt(e.target.value) || 1 })}
                              className="w-16 h-10 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 text-center focus:outline-none focus:ring-2 focus:ring-court-500/20 transition-shadow" />
                            <select value={rem.unit} onChange={e => updateReminder(rem.id, { unit: e.target.value as ReminderTiming['unit'] })}
                              className="h-10 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
                              <option value="minutes">minutes</option><option value="hours">hours</option><option value="days">days</option>
                            </select>
                            <span className="text-sm text-dark-500">before</span>
                            {form.reminders.length > 1 && (
                              <button onClick={() => removeReminder(rem.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500 ml-auto transition-colors"><X size={14} /></button>
                            )}
                          </div>
                        ))}
                        <button onClick={addReminder} className="text-sm font-semibold text-court-600 hover:text-court-700 flex items-center gap-1.5 pt-1 transition-colors">
                          <Plus size={14} /> Add reminder
                        </button>
                      </div>
                    </div>
                  </Section>
                )}

              </div>
            </div>

            {/* ── Footer ───────────────────────────────── */}
            <div className="shrink-0 border-t border-dark-100 px-6 py-4 bg-white flex items-center justify-between">
              <button onClick={onClose}
                className="h-10 px-5 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50 transition-colors">
                Cancel
              </button>

              {isEditing ? (
                <div className="flex items-center gap-3">
                  {/* Change summary */}
                  {editChanges.length > 0 ? (
                    <div className="relative group">
                      <div className="flex items-center gap-1.5 cursor-default">
                        <span className="w-5 h-5 rounded-full bg-court-100 text-court-600 text-[10px] font-bold flex items-center justify-center">{editChanges.length}</span>
                        <span className="text-[11px] font-semibold text-dark-600">{editChanges.length === 1 ? 'change' : 'changes'}</span>
                      </div>
                      {/* Hover popover with details */}
                      <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-xl border border-dark-200 shadow-elevated opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-[71]">
                        <div className="px-3 py-2 border-b border-dark-100">
                          <p className="text-[11px] font-bold text-dark-500 uppercase tracking-wider">Changes</p>
                        </div>
                        <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                          {editChanges.map((ch, i) => (
                            <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-dark-50/50 text-[11px]">
                              <span className="font-semibold text-dark-700 shrink-0 mt-px">{ch.field}</span>
                              <div className="flex items-center gap-1 min-w-0 text-dark-500">
                                <span className="truncate" title={ch.from}>{ch.from}</span>
                                <span className="text-dark-300 shrink-0">&rarr;</span>
                                <span className="truncate font-medium text-dark-800" title={ch.to}>{ch.to}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-dark-400">No changes</p>
                  )}

                  {/* Notify toggle */}
                  {editChanges.length > 0 && (
                    <div className={`flex items-center gap-1.5 text-[11px] font-medium cursor-pointer select-none ${editNotify ? 'text-court-500' : 'text-dark-400'}`}
                      onClick={() => setEditNotify(!editNotify)}>
                      {editNotify ? <BellRing size={12} /> : <BellOff size={12} />}
                      {editNotify ? 'Notify' : 'Silent'}
                    </div>
                  )}

                  <button onClick={handleCreate} disabled={editChanges.length === 0}
                    className={`h-10 px-6 rounded-xl text-white text-sm font-bold transition-all shrink-0 ${editChanges.length === 0 ? 'bg-dark-300 cursor-not-allowed' : 'bg-gradient-to-r from-court-500 to-court-600 hover:from-court-600 hover:to-court-700 shadow-lg shadow-court-500/25'}`}>
                    {editNotify && editChanges.length > 0 ? 'Update & Notify' : 'Update'}
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center">
                  <AnimatePresence>
                    {publishMenuOpen && (<>
                      <div className="fixed inset-0 z-[70]" onClick={() => setPublishMenuOpen(false)} />
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-xl border border-dark-200 shadow-elevated z-[71] overflow-hidden">
                        <div className="p-1.5">
                          {([
                            { key: 'draft' as PublishMode, icon: <FileText size={15} />, label: 'Save as Draft', desc: 'Only visible to you', color: 'text-dark-500' },
                            { key: 'review' as PublishMode, icon: <Eye size={15} />, label: 'Submit for Review', desc: 'Visible to reviewers & admins', color: 'text-amber-500' },
                            { key: 'publish' as PublishMode, icon: <Globe size={15} />, label: 'Publish', desc: 'Visible to everyone', color: 'text-court-500' },
                          ]).map(opt => (
                            <button key={opt.key} onClick={() => { setPublishMode(opt.key); if (opt.key === 'draft') setNotifyOnPublish(false); }}
                              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${publishMode === opt.key ? 'bg-court-50' : 'hover:bg-dark-50'}`}>
                              <div className={`w-8 h-8 rounded-lg ${publishMode === opt.key ? 'bg-court-100' : 'bg-dark-50'} flex items-center justify-center ${opt.color} shrink-0`}>
                                {opt.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold ${publishMode === opt.key ? 'text-dark-900' : 'text-dark-700'}`}>{opt.label}</p>
                                <p className="text-[11px] text-dark-400">{opt.desc}</p>
                              </div>
                              {publishMode === opt.key && <Check size={14} className="text-court-500 shrink-0" />}
                            </button>
                          ))}
                        </div>

                        {publishMode !== 'draft' && (
                          <div className="border-t border-dark-100 px-4 py-3">
                            <label className="flex items-center justify-between cursor-pointer" onClick={() => setNotifyOnPublish(!notifyOnPublish)}>
                              <div className="flex items-center gap-2.5">
                                {notifyOnPublish
                                  ? <BellRing size={14} className="text-court-500" />
                                  : <BellOff size={14} className="text-dark-400" />
                                }
                                <span className="text-sm font-medium text-dark-700">Notify members</span>
                              </div>
                              <div className={`w-9 h-[20px] rounded-full relative transition-colors ${notifyOnPublish ? 'bg-court-500' : 'bg-dark-200'}`}>
                                <motion.div className="absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm"
                                  animate={{ left: notifyOnPublish ? 19 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                              </div>
                            </label>
                          </div>
                        )}
                      </motion.div>
                    </>)}
                  </AnimatePresence>

                  {publishMode !== 'draft' && (
                    <div className={`flex items-center gap-1.5 mr-3 text-[11px] font-medium ${notifyOnPublish ? 'text-court-500' : 'text-dark-400'}`}>
                      {notifyOnPublish ? <BellRing size={12} /> : <BellOff size={12} />}
                      {notifyOnPublish ? 'Will notify' : 'Silent'}
                    </div>
                  )}

                  <div className="flex items-center">
                    <button onClick={handleCreate}
                      className={`h-10 pl-5 pr-4 rounded-l-xl text-white text-sm font-bold transition-all ${
                        publishMode === 'draft' ? 'bg-dark-700 hover:bg-dark-800' :
                        publishMode === 'review' ? 'bg-amber-500 hover:bg-amber-600' :
                        'bg-gradient-to-r from-court-500 to-court-600 hover:from-court-600 hover:to-court-700'
                      } shadow-lg ${publishMode === 'draft' ? 'shadow-dark-500/15' : publishMode === 'review' ? 'shadow-amber-500/25' : 'shadow-court-500/25'}`}>
                      {publishMode === 'draft' ? 'Save Draft' : publishMode === 'review' ? 'Submit for Review' : 'Publish Event'}
                    </button>
                    <button onClick={() => setPublishMenuOpen(!publishMenuOpen)}
                      className={`h-10 px-2.5 rounded-r-xl border-l border-white/20 text-white transition-all ${
                        publishMode === 'draft' ? 'bg-dark-700 hover:bg-dark-800' :
                        publishMode === 'review' ? 'bg-amber-500 hover:bg-amber-600' :
                        'bg-gradient-to-r from-court-600 to-court-600 hover:from-court-700 hover:to-court-700'
                      }`}>
                      <ChevronUp size={14} className={`transition-transform ${publishMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <AssignUsersModal open={memberModalOpen} onClose={() => setMemberModalOpen(false)}
            onDone={(groupIds, userIds) => { set('selectedGroupIds', groupIds); set('selectedMemberIds', userIds); setMemberModalOpen(false); }}
            initialGroupIds={form.selectedGroupIds} initialUserIds={form.selectedMemberIds} />

          <CustomRecurrenceModal open={recurrenceModalOpen} value={form.customRecurrence}
            onClose={() => setRecurrenceModalOpen(false)}
            onDone={(cr) => { set('customRecurrence', cr); set('recurrence', 'custom'); setRecurrenceModalOpen(false); }} />
        </>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════
// CUSTOM RECURRENCE MODAL
// ══════════════════════════════════════════════════════
function CustomRecurrenceModal({ open, value, onClose, onDone }: {
  open: boolean; value: CustomRecurrence; onClose: () => void; onDone: (cr: CustomRecurrence) => void;
}) {
  const [form, setForm] = useState<CustomRecurrence>({ ...value });
  if (!open) return null;
  const freqLabel = form.frequency === 'daily' ? 'day(s)' : form.frequency === 'weekly' ? 'week(s)' : 'month(s)';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[65]" onClick={onClose} />
      <div className="fixed inset-0 z-[66] flex items-center justify-center p-4 overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
          <div className="px-6 py-5 space-y-6">
            <h3 className="text-lg font-bold text-dark-900">Custom Recurrence</h3>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-dark-700 shrink-0">Repeat Every</span>
              <div className="flex items-center border border-dark-200 rounded-xl overflow-hidden">
                <input type="number" min={1} max={99} value={form.repeatEvery}
                  onChange={e => setForm(p => ({ ...p, repeatEvery: parseInt(e.target.value) || 1 }))}
                  className="w-12 h-10 text-center text-sm font-semibold text-dark-800 border-r border-dark-200 focus:outline-none" />
                <span className="px-3 text-sm text-dark-500">{freqLabel}</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-0.5">Frequency</label>
                <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value as RecurrenceFrequency }))}
                  className="h-10 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 bg-white focus:outline-none">
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {form.frequency === 'weekly' && (
              <div className="space-y-2.5">
                <span className="text-sm font-medium text-dark-700">Repeat On</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {dayLetters.map((letter, i) => (
                    <button key={i} onClick={() => { const n = [...form.repeatOnDays]; n[i] = !n[i]; setForm(p => ({ ...p, repeatOnDays: n })); }}
                      className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                        form.repeatOnDays[i] ? 'border-2 border-court-500 text-court-600 bg-court-50' : 'border-2 border-dark-200 text-dark-400 hover:border-dark-300'
                      }`}>{letter}</button>
                  ))}
                </div>
              </div>
            )}

            {form.frequency === 'monthly' && (
              <div className="space-y-2.5">
                <span className="text-sm font-medium text-dark-700">Repeat On</span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <select value={form.monthlyOrdinal} onChange={e => setForm(p => ({ ...p, monthlyOrdinal: e.target.value }))}
                    className="h-10 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 bg-white focus:outline-none capitalize">
                    {ordinals.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <select value={form.monthlyDay} onChange={e => setForm(p => ({ ...p, monthlyDay: e.target.value }))}
                    className="h-10 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 bg-white focus:outline-none">
                    {dayNames.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span className="text-sm text-dark-500">of the month</span>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <span className="text-sm font-bold text-dark-800">End Recurrence</span>

              <label className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-colors ${form.endType === 'never' ? 'bg-court-50/60' : 'hover:bg-dark-50/50'}`}
                onClick={() => setForm(p => ({ ...p, endType: 'never' }))}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.endType === 'never' ? 'border-court-500' : 'border-dark-300'}`}>
                  {form.endType === 'never' && <div className="w-2.5 h-2.5 rounded-full bg-court-500" />}
                </div>
                <span className="text-sm text-dark-700">Never</span>
              </label>

              <label className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-colors ${form.endType === 'on_date' ? 'bg-court-50/60' : 'hover:bg-dark-50/50'}`}
                onClick={() => setForm(p => ({ ...p, endType: 'on_date' }))}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.endType === 'on_date' ? 'border-court-500' : 'border-dark-300'}`}>
                  {form.endType === 'on_date' && <div className="w-2.5 h-2.5 rounded-full bg-court-500" />}
                </div>
                <span className="text-sm text-dark-700 shrink-0">On Date</span>
                <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value, endType: 'on_date' }))}
                  onFocus={() => setForm(p => ({ ...p, endType: 'on_date' }))}
                  className="h-9 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 focus:outline-none focus:ring-2 focus:ring-court-500/20 ml-auto" />
              </label>

              <label className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-colors ${form.endType === 'after' ? 'bg-court-50/60' : 'hover:bg-dark-50/50'}`}
                onClick={() => setForm(p => ({ ...p, endType: 'after' }))}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.endType === 'after' ? 'border-court-500' : 'border-dark-300'}`}>
                  {form.endType === 'after' && <div className="w-2.5 h-2.5 rounded-full bg-court-500" />}
                </div>
                <span className="text-sm text-dark-700 shrink-0">After</span>
                <input type="number" min={1} value={form.endAfterOccurrences}
                  onChange={e => setForm(p => ({ ...p, endAfterOccurrences: parseInt(e.target.value) || 1, endType: 'after' }))}
                  onFocus={() => setForm(p => ({ ...p, endType: 'after' }))}
                  className="w-20 h-9 px-3 rounded-xl border border-dark-200 text-sm font-medium text-dark-800 text-center focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                <span className="text-sm text-dark-500">occurrences</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100">
            <button onClick={onClose} className="h-10 px-5 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50 transition-colors">Cancel</button>
            <button onClick={() => onDone(form)} className="h-10 px-6 rounded-xl bg-dark-900 text-white text-sm font-bold hover:bg-dark-800 transition-colors">Done</button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
