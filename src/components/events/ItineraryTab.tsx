import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, Plus, X, Pencil, Trash2, ChevronDown, ChevronUp,
  Globe, CheckCircle2, Circle, Eye, EyeOff, Lock, Users, User,
  Calendar, Building2, ArrowLeft, Check, Info, List, LayoutList, BarChart3,
  ChevronsRight, FileText, Search, ArrowDownUp,
} from 'lucide-react';
import { ItineraryItem } from '@/data/events';
import { currentUser, users } from '@/data/users';
import { AssignUsersModal } from '@/components/ui/VisibilityPicker';

interface Props {
  items: ItineraryItem[];
  eventStartTime?: string;
  eventEndTime?: string;
}

type ChecklistType = 'before' | 'during' | 'after';
type Visibility = 'everyone' | 'private';
type SubView = 'event' | 'mine';
type ItinViewMode = 'compact' | 'expanded' | 'timeline';
type TimeMethod = 'fixed' | 'relative';
type RelativeRef = 'start' | 'end';
type RelativeDir = 'before' | 'after';

interface ItinChecklist {
  id: string;
  description: string;
  type: ChecklistType;
}

interface ExtendedItinerary extends ItineraryItem {
  visibility: Visibility;
  visibleTo: string[];
  visibleToGroups: string[];
  assignedTo: string[];
}

interface ItineraryFormData {
  method: TimeMethod;
  title: string;
  location: string;
  timezone: string;
  date: string;
  startTime: string;
  endTime: string;
  // relative fields
  relativeRef: RelativeRef;
  relativeDir: RelativeDir;
  relativeHours: number;
  relativeMinutes: number;
  durationHours: number;
  durationMinutes: number;
  description: string;
  checklist: ItinChecklist[];
  visibility: Visibility;
  visibleTo: string[];
  visibleToGroups: string[];
  assignedTo: string[];
}

const TIMEZONES = [
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'America/New_York',
  'America/Chicago', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney',
];

const STEP_LABELS = ['Method', 'Basic', 'Optional', 'Groups', 'Review'];

// ── Step Progress Indicator ─────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-5">
      {Array.from({ length: total }).map((_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < current;
        const isCurrent = stepNum === current;
        const isFuture = stepNum > current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              {/* Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isCompleted ? 'bg-court-500 text-white' :
                isCurrent ? 'border-2 border-court-500 text-court-600 bg-white' :
                'border-2 border-dark-200 text-dark-400 bg-white'
              }`}>
                {isCompleted ? <Check size={14} /> : stepNum}
              </div>
              {/* Label */}
              <span className={`text-[11px] font-semibold whitespace-nowrap ${
                isCompleted || isCurrent ? 'text-court-600' : 'text-dark-400'
              }`}>{STEP_LABELS[i]}</span>
            </div>
            {/* Connector line */}
            {i < total - 1 && (
              <div className={`w-16 h-0.5 mx-1 -mt-5 ${isCompleted ? 'bg-court-500' : 'bg-dark-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ITINERARY WIZARD (5-Step)
// ══════════════════════════════════════════════════════════
function ItineraryWizard({ onClose, onSave, editItem, eventStartTime, eventEndTime }: {
  onClose: () => void;
  onSave: (data: ItineraryFormData) => void;
  editItem?: ExtendedItinerary | null;
  eventStartTime?: string;
  eventEndTime?: string;
}) {
  const [step, setStep] = useState(editItem ? 5 : 1);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const hasEventTime = !!eventStartTime;

  const [form, setForm] = useState<ItineraryFormData>({
    method: 'fixed',
    title: editItem?.title || '',
    location: editItem?.location || '',
    timezone: 'Europe/London',
    date: new Date().toISOString().split('T')[0],
    startTime: editItem?.time || '',
    endTime: '',
    relativeRef: 'start',
    relativeDir: 'before',
    relativeHours: 0,
    relativeMinutes: 30,
    durationHours: 0,
    durationMinutes: 30,
    description: editItem?.description || '',
    checklist: [],
    visibility: editItem?.visibility || 'everyone',
    visibleTo: editItem?.visibleTo || [],
    visibleToGroups: editItem?.visibleToGroups || [],
    assignedTo: editItem?.assignedTo || [],
  });

  // Checklist state
  const [expandedCl, setExpandedCl] = useState<ChecklistType | null>('before');
  const [clInput, setClInput] = useState('');
  const [editingCl, setEditingCl] = useState<string | null>(null);
  const [editClDesc, setEditClDesc] = useState('');

  const addChecklistItem = (type: ChecklistType) => {
    if (!clInput.trim()) return;
    setForm(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: `icl-${Date.now()}`, description: clInput.trim(), type }],
    }));
    setClInput('');
  };

  const removeChecklistItem = (id: string) => {
    setForm(prev => ({ ...prev, checklist: prev.checklist.filter(c => c.id !== id) }));
  };

  const saveEditChecklist = (id: string) => {
    setForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(c => c.id === id ? { ...c, description: editClDesc } : c),
    }));
    setEditingCl(null);
  };

  // Compute relative time display
  const computedTime = (() => {
    if (form.method !== 'relative' || !eventStartTime) return '';
    const ref = form.relativeRef === 'start' ? eventStartTime : (eventEndTime || eventStartTime);
    const [hh, mm] = ref.split(':').map(Number);
    const offsetMin = form.relativeHours * 60 + form.relativeMinutes;
    let totalMin = hh * 60 + mm + (form.relativeDir === 'before' ? -offsetMin : offsetMin);
    if (totalMin < 0) totalMin += 1440;
    if (totalMin >= 1440) totalMin -= 1440;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  })();

  const canNext = () => {
    if (step === 1) return true;
    if (step === 2) return !!form.title.trim() && (form.method === 'fixed' ? !!form.startTime : true);
    return true;
  };

  const next = () => { if (step < 5 && canNext()) setStep(step + 1); };
  const back = () => { if (step > 1) setStep(step - 1); };

  const handleCreate = () => {
    // Set computed time for relative mode
    if (form.method === 'relative' && computedTime) {
      form.startTime = computedTime;
    }
    onSave(form);
  };

  const clGrouped = form.checklist.reduce((acc, item) => {
    (acc[item.type] = acc[item.type] || []).push(item);
    return acc;
  }, {} as Record<string, ItinChecklist[]>);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-xl h-[600px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-0 shrink-0">
          <h3 className="text-lg font-bold text-dark-900">{editItem ? 'Edit Itinerary' : 'Create Itinerary'}</h3>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={5} />

        <div className="h-px bg-dark-100" />

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>

              {/* ── STEP 1: Method ─────────────────── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-bold text-dark-800">How do you want to set time for itinerary?</h4>
                    <p className="text-xs text-dark-400 mt-0.5">Choose whether to set a specific date/time or relative to the event</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setForm(p => ({ ...p, method: 'fixed' }))}
                      className={`p-5 rounded-xl border-2 text-left transition-all relative group ${
                        form.method === 'fixed' ? 'border-court-500 bg-court-50/30 shadow-sm' : 'border-dark-200 hover:border-dark-300 hover:bg-dark-50/30'}`}>
                      <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center transition-all">
                        {form.method === 'fixed'
                          ? <div className="w-5 h-5 rounded-full bg-court-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>
                          : <div className="w-5 h-5 rounded-full border-2 border-dark-200 group-hover:border-dark-300" />}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-dark-50 group-hover:bg-court-50 flex items-center justify-center mb-3 transition-colors">
                        <Calendar size={18} className={form.method === 'fixed' ? 'text-court-600' : 'text-dark-400'} />
                      </div>
                      <p className="text-sm font-bold text-dark-900">Fixed Time</p>
                      <p className="text-xs text-dark-400 mt-0.5">Select date & time</p>
                    </button>
                    <button onClick={() => hasEventTime && setForm(p => ({ ...p, method: 'relative' }))}
                      disabled={!hasEventTime}
                      className={`p-5 rounded-xl border-2 text-left transition-all relative group ${
                        !hasEventTime ? 'border-dark-100 bg-dark-50/30 opacity-50 cursor-not-allowed' :
                        form.method === 'relative' ? 'border-court-500 bg-court-50/30 shadow-sm' : 'border-dark-200 hover:border-dark-300 hover:bg-dark-50/30'}`}>
                      <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center transition-all">
                        {form.method === 'relative'
                          ? <div className="w-5 h-5 rounded-full bg-court-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>
                          : <div className="w-5 h-5 rounded-full border-2 border-dark-200" />}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-dark-50 flex items-center justify-center mb-3">
                        <Clock size={18} className={form.method === 'relative' ? 'text-court-600' : 'text-dark-400'} />
                      </div>
                      <p className={`text-sm font-bold ${hasEventTime ? 'text-dark-900' : 'text-dark-400'}`}>Relative Time</p>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {hasEventTime ? 'Create timeline relative to event' : 'Event must have start/end time'}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Basic ──────────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  {form.method === 'fixed' ? (
                    <>
                      <div>
                        <h4 className="text-sm font-bold text-dark-800">When does this item occur?</h4>
                        <p className="text-xs text-dark-400 mt-0.5">Set the exact date and time</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Date</label>
                          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Time</label>
                          <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Timezone</label>
                        <select value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
                          className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
                          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-sm font-bold text-dark-800">Set time relative to event</h4>
                        <p className="text-xs text-dark-400 mt-0.5">Define offset from event start or end time</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Direction</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button onClick={() => setForm(p => ({ ...p, relativeDir: 'before' }))}
                              className={`h-9 rounded-lg text-xs font-semibold transition-all ${form.relativeDir === 'before' ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>
                              Before
                            </button>
                            <button onClick={() => setForm(p => ({ ...p, relativeDir: 'after' }))}
                              className={`h-9 rounded-lg text-xs font-semibold transition-all ${form.relativeDir === 'after' ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>
                              After
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Reference</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button onClick={() => setForm(p => ({ ...p, relativeRef: 'start' }))}
                              className={`h-9 rounded-lg text-xs font-semibold transition-all ${form.relativeRef === 'start' ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>
                              Start Time
                            </button>
                            <button onClick={() => setForm(p => ({ ...p, relativeRef: 'end' }))}
                              disabled={!eventEndTime}
                              className={`h-9 rounded-lg text-xs font-semibold transition-all ${!eventEndTime ? 'opacity-40 cursor-not-allowed bg-dark-50 text-dark-400' : form.relativeRef === 'end' ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>
                              End Time
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Hours</label>
                          <input type="number" min={0} max={24} value={form.relativeHours} onChange={e => setForm(p => ({ ...p, relativeHours: parseInt(e.target.value) || 0 }))}
                            className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Minutes</label>
                          <input type="number" min={0} max={59} value={form.relativeMinutes} onChange={e => setForm(p => ({ ...p, relativeMinutes: parseInt(e.target.value) || 0 }))}
                            className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                        </div>
                      </div>
                      {computedTime && (
                        <div className="flex items-center gap-2 p-3 bg-court-50/40 rounded-xl border border-court-100">
                          <Info size={14} className="text-court-600 shrink-0" />
                          <p className="text-xs text-court-700">
                            Itinerary will occur at <strong>{computedTime}</strong>{' '}
                            ({form.relativeHours > 0 ? `${form.relativeHours}h ` : ''}{form.relativeMinutes}m {form.relativeDir} {form.relativeRef === 'start' ? 'start time' : 'end time'})
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Duration</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input type="number" min={0} max={24} value={form.durationHours} onChange={e => setForm(p => ({ ...p, durationHours: parseInt(e.target.value) || 0 }))}
                          className="w-full h-9 px-3 pr-12 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dark-400">hours</span>
                      </div>
                      <div className="relative">
                        <input type="number" min={0} max={59} value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 0 }))}
                          className="w-full h-9 px-3 pr-10 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dark-400">min</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Title *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Warm-Up, Team Talk"
                      className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  </div>
                </div>
              )}

              {/* ── STEP 3: Optional ───────────────── */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-dark-800">Additional Details</h4>
                    <p className="text-xs text-dark-400 mt-0.5">Location, description, and checklist items (all optional)</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Location</label>
                    <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Training Pitch A"
                      className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 resize-none"
                      placeholder="Write something awesome..." />
                  </div>

                  {/* Checklist builder — accordion style */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-court-600 mb-2">Checklist</label>
                    <div className="space-y-2">
                      {(['before', 'during', 'after'] as ChecklistType[]).map(type => {
                        const items = clGrouped[type] || [];
                        const isExpanded = expandedCl === type;
                        return (
                          <div key={type} className="border border-dark-200 rounded-xl overflow-hidden">
                            {/* Section header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-dark-50/30 cursor-pointer" onClick={() => setExpandedCl(isExpanded ? null : type)}>
                              <span className="text-sm font-semibold text-dark-800 capitalize">{type} ({items.length})</span>
                              <div className="flex items-center gap-1">
                                <button onClick={e => { e.stopPropagation(); setExpandedCl(type); }}
                                  className="p-1 rounded hover:bg-dark-100 text-dark-400"><Plus size={14} /></button>
                                {isExpanded ? <ChevronUp size={14} className="text-dark-400" /> : <ChevronDown size={14} className="text-dark-400" />}
                              </div>
                            </div>
                            {/* Expanded content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                  <div className="px-4 py-3 space-y-2">
                                    {items.length === 0 && <p className="text-xs text-dark-400 py-1">No items</p>}
                                    {items.map(item => (
                                      <div key={item.id} className="flex items-center gap-2 group">
                                        {editingCl === item.id ? (
                                          <>
                                            <input value={editClDesc} onChange={e => setEditClDesc(e.target.value)} autoFocus
                                              className="flex-1 h-7 px-2 rounded border border-dark-200 text-xs focus:outline-none focus:ring-1 focus:ring-court-500/30" />
                                            <button onClick={() => saveEditChecklist(item.id)} className="p-1 rounded hover:bg-court-50 text-court-600"><CheckCircle2 size={13} /></button>
                                            <button onClick={() => setEditingCl(null)} className="p-1 rounded hover:bg-dark-50 text-dark-400"><X size={13} /></button>
                                          </>
                                        ) : (
                                          <>
                                            <span className="flex-1 text-xs text-dark-700">{item.description}</span>
                                            <button onClick={() => { setEditingCl(item.id); setEditClDesc(item.description); }}
                                              className="p-1 rounded hover:bg-dark-50 text-dark-400 opacity-0 group-hover:opacity-100"><Pencil size={11} /></button>
                                            <button onClick={() => removeChecklistItem(item.id)}
                                              className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={11} /></button>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                    {/* Add item inline */}
                                    <div className="flex items-center gap-2 pt-1">
                                      <input value={expandedCl === type ? clInput : ''} onChange={e => setClInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addChecklistItem(type)}
                                        placeholder={`Add ${type} item...`}
                                        className="flex-1 h-8 px-2.5 rounded-lg border border-dashed border-dark-200 text-xs focus:outline-none focus:ring-1 focus:ring-court-500/30 focus:border-court-300" />
                                      <button onClick={() => addChecklistItem(type)} disabled={!clInput.trim()}
                                        className="h-8 w-8 rounded-lg bg-court-500 text-white flex items-center justify-center hover:bg-court-600 disabled:opacity-40 shrink-0"><Plus size={14} /></button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Groups ──────────────────── */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-dark-800">Assign this to:</h4>
                    <p className="text-xs text-dark-400 mt-0.5">Choose who can see and is assigned to this itinerary item</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setForm(p => ({ ...p, visibility: 'everyone' }))}
                      className={`p-5 rounded-xl border-2 text-left transition-all relative group ${
                        form.visibility === 'everyone' ? 'border-court-500 bg-court-50/30 shadow-sm' : 'border-dark-200 hover:border-dark-300 hover:bg-dark-50/30'}`}>
                      <div className="absolute top-3.5 right-3.5">
                        {form.visibility === 'everyone'
                          ? <div className="w-5 h-5 rounded-full bg-court-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>
                          : <div className="w-5 h-5 rounded-full border-2 border-dark-200 group-hover:border-dark-300" />}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-dark-50 group-hover:bg-court-50 flex items-center justify-center mb-3 transition-colors">
                        <Building2 size={18} className={form.visibility === 'everyone' ? 'text-court-600' : 'text-dark-400'} />
                      </div>
                      <p className={`text-sm font-bold ${form.visibility === 'everyone' ? 'text-court-700' : 'text-dark-900'}`}>Event Attendees</p>
                      <p className={`text-xs mt-0.5 ${form.visibility === 'everyone' ? 'text-court-600' : 'text-dark-400'}`}>Assign to all members in the event</p>
                    </button>
                    <button onClick={() => setForm(p => ({ ...p, visibility: 'private' }))}
                      className={`p-5 rounded-xl border-2 text-left transition-all relative group ${
                        form.visibility === 'private' ? 'border-court-500 bg-court-50/30 shadow-sm' : 'border-dark-200 hover:border-dark-300 hover:bg-dark-50/30'}`}>
                      <div className="absolute top-3.5 right-3.5">
                        {form.visibility === 'private'
                          ? <div className="w-5 h-5 rounded-full bg-court-500 flex items-center justify-center"><Check size={12} className="text-white" /></div>
                          : <div className="w-5 h-5 rounded-full border-2 border-dark-200 group-hover:border-dark-300" />}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-dark-50 group-hover:bg-court-50 flex items-center justify-center mb-3 transition-colors">
                        <Users size={18} className={form.visibility === 'private' ? 'text-court-600' : 'text-dark-400'} />
                      </div>
                      <p className={`text-sm font-bold ${form.visibility === 'private' ? 'text-court-700' : 'text-dark-900'}`}>Private</p>
                      <p className={`text-xs mt-0.5 ${form.visibility === 'private' ? 'text-court-600' : 'text-dark-400'}`}>Assign to specific groups</p>
                    </button>
                  </div>
                  <AnimatePresence>
                    {form.visibility === 'private' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-2">
                          <button onClick={() => setShowAssignModal(true)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-dark-200 hover:border-court-300 hover:bg-court-50/30 transition-colors group">
                            <span className="flex items-center gap-2 text-sm font-medium text-dark-500 group-hover:text-court-600">
                              <Users size={16} /> Select Users & Groups
                            </span>
                            <ChevronsRight size={16} className="text-dark-400 group-hover:text-court-500" />
                          </button>
                          {(form.visibleToGroups.length > 0 || form.visibleTo.length > 0) && (
                            <div className="flex flex-wrap gap-1.5">
                              {form.visibleToGroups.map(id => {
                                const name = id.startsWith('des-') ? id.replace('des-', '') : id.startsWith('tag-') ? id.replace('tag-', '') : id.startsWith('pos-') ? id.replace('pos-', '') : id;
                                return (
                                  <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-court-50 text-court-700 border border-court-200">
                                    <Users size={10} /> {name}
                                    <button onClick={() => setForm(p => ({ ...p, visibleToGroups: p.visibleToGroups.filter(x => x !== id) }))} className="ml-0.5 p-0.5 rounded hover:bg-court-100"><X size={10} /></button>
                                  </span>
                                );
                              })}
                              {form.visibleTo.map(id => {
                                const u = users.find(u => u.id === id);
                                if (!u) return null;
                                return (
                                  <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-dark-50 text-dark-700 border border-dark-200">
                                    <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                                      <span className="text-[6px] font-bold text-white">{u.avatar}</span>
                                    </div>
                                    {u.firstName} {u.lastName.charAt(0)}.
                                    <button onClick={() => setForm(p => ({ ...p, visibleTo: p.visibleTo.filter(x => x !== id) }))} className="ml-0.5 p-0.5 rounded hover:bg-dark-100"><X size={10} /></button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── STEP 5: Review ──────────────────── */}
              {step === 5 && (
                <div className="space-y-5">
                  {/* Section 1: Basic Details */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-dark-900">1. Itinerary Basic Details</h4>
                      <button onClick={() => setStep(2)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                    <div className="border border-dark-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-dark-800">{form.title || '—'}</p>
                          {form.method === 'fixed' ? (
                            <p className="text-xs text-dark-500 mt-0.5">
                              {form.date ? new Date(form.date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', weekday: 'long' }) : '—'}
                            </p>
                          ) : (
                            <p className="text-xs text-dark-500 mt-0.5">
                              {form.relativeHours > 0 ? `${form.relativeHours}h ` : ''}{form.relativeMinutes}m {form.relativeDir} {form.relativeRef === 'start' ? 'start time' : 'end time'}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-dark-800">{form.method === 'fixed' ? (form.startTime || '—') : (computedTime || '—')}</p>
                          <p className="text-xs text-dark-400">
                            {(form.durationHours > 0 || form.durationMinutes > 0)
                              ? `${form.durationHours > 0 ? `${form.durationHours}h ` : ''}${form.durationMinutes}m`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-dark-100" />

                  {/* Section 2: Optional Details */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-dark-900">2. Optional Details</h4>
                      <button onClick={() => setStep(3)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-dark-400">Location:</p>
                        <p className="text-sm text-dark-700">{form.location || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-400">Description:</p>
                        <p className="text-sm text-dark-700">{form.description || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-400 mb-1.5">Checklist:</p>
                        <div className="space-y-1.5">
                          {(['before', 'during', 'after'] as ChecklistType[]).map(type => {
                            const items = clGrouped[type] || [];
                            return (
                              <div key={type} className="bg-dark-50/40 rounded-lg px-3 py-2">
                                <span className="text-xs font-semibold text-dark-700 capitalize">{type} ({items.length})</span>
                                {items.length > 0 && (
                                  <ul className="ml-3 mt-0.5">
                                    {items.map(i => <li key={i.id} className="text-xs text-dark-600 list-disc">{i.description}</li>)}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-dark-100" />

                  {/* Section 3: Groups */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-dark-900">3. Groups</h4>
                        <span className="px-2 py-0.5 rounded-lg bg-court-50 text-court-700 text-xs font-semibold flex items-center gap-1">
                          {form.visibility === 'everyone' ? (
                            <><Building2 size={11} /> Event Attendees</>
                          ) : (
                            <><Lock size={11} /> Private ({form.visibleTo.length + form.visibleToGroups.length})</>
                          )}
                        </span>
                      </div>
                      <button onClick={() => setStep(4)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50">Cancel</button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button onClick={back} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50">Back</button>
            )}
            {step < 5 ? (
              <button onClick={next} disabled={!canNext()}
                className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 transition-colors">Next</button>
            ) : (
              <button onClick={handleCreate}
                className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm">
                {editItem ? 'Update' : 'Create'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Assign Users Modal */}
      <AssignUsersModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onDone={(groupIds, userIds) => {
          setForm(p => ({ ...p, visibleToGroups: groupIds, visibleTo: userIds }));
          setShowAssignModal(false);
        }}
        initialGroupIds={form.visibleToGroups}
        initialUserIds={form.visibleTo}
      />
    </div>
  );
}

// ── Private Badge with Instant Tooltip ───────────────────
function PrivateBadge() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useState<HTMLSpanElement | null>(null);
  return (
    <span className="shrink-0"
      onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top }); }}
      onMouseLeave={() => setPos(null)}>
      <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500 bg-orange-50 px-1 py-0.5 rounded cursor-help"><Lock size={8} /></span>
      {pos && (
        <span className="fixed z-[100] pointer-events-none" style={{ left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}>
          <span className="bg-dark-800 text-white rounded-lg px-2.5 py-1.5 text-[10px] shadow-lg whitespace-nowrap block">Private itinerary</span>
          <span className="w-2 h-2 bg-dark-800 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
        </span>
      )}
    </span>
  );
}

// ── Avatar Stack with Hover Tooltip ──────────────────────
function AvatarStack({ userIds, groupIds = [], max = 3 }: { userIds: string[]; groupIds?: string[]; max?: number }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  if (userIds.length === 0 && groupIds.length === 0) return null;
  const resolvedUsers = userIds.map(id => { const u = users.find(u => u.id === id); return u ? { id, initials: u.avatar, name: `${u.firstName} ${u.lastName}` } : { id, initials: id.slice(0, 2).toUpperCase(), name: id }; });
  const resolvedGroups = groupIds.map(id => {
    if (id.startsWith('des-')) return { id, name: id.replace('des-', ''), type: 'Designation' };
    if (id.startsWith('tag-')) return { id, name: id.replace('tag-', ''), type: 'Tag' };
    if (id.startsWith('pos-')) return { id, name: id.replace('pos-', ''), type: 'Position' };
    return { id, name: id, type: 'Group' };
  });
  const shown = resolvedUsers.slice(0, max);
  const overflow = resolvedUsers.length - max;

  return (
    <div className="flex items-center"
      onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: r.left + 12, y: r.top }); }}
      onMouseLeave={() => setPos(null)}>
      <div className="flex -space-x-1.5">
        {resolvedGroups.length > 0 && (
          <div className="w-6 h-6 rounded-full bg-court-100 flex items-center justify-center border-2 border-white">
            <Users size={10} className="text-court-600" />
          </div>
        )}
        {shown.map(u => (
          <div key={u.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-dark-200 to-dark-300 flex items-center justify-center border-2 border-white">
            <span className="text-[8px] font-bold text-dark-600">{u.initials}</span>
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-6 h-6 rounded-full bg-dark-100 flex items-center justify-center border-2 border-white">
            <span className="text-[8px] font-bold text-dark-500">+{overflow}</span>
          </div>
        )}
      </div>
      {pos && (
        <div className="fixed z-[100] pointer-events-none" style={{ left: pos.x, top: pos.y - 8, transform: 'translateY(-100%)' }}>
          <div className="bg-dark-800 text-white rounded-lg px-3 py-2 text-[11px] shadow-lg whitespace-nowrap">
            {resolvedGroups.map(g => <p key={g.id} className="text-court-300">{g.name} ({g.type})</p>)}
            {resolvedUsers.map(u => <p key={u.id}>{u.name}</p>)}
          </div>
          <div className="w-2 h-2 bg-dark-800 rotate-45 ml-3 -mt-1" />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN ITINERARY TAB
// ══════════════════════════════════════════════════════════
export default function ItineraryTab({ items: initialItems, eventStartTime, eventEndTime }: Props) {
  const [items, setItems] = useState<ExtendedItinerary[]>(
    initialItems.map((item, i) => ({
      ...item,
      visibility: (i === 2 || i === 4 || i === 5) ? 'private' as Visibility : 'everyone' as Visibility,
      visibleTo: (i === 2) ? ['u-002', 'u-003'] : (i === 4) ? [currentUser.id, 'u-005'] : (i === 5) ? ['u-006'] : [],
      visibleToGroups: (i === 2) ? ['des-Head Coach'] : (i === 5) ? ['des-Medical Staff', 'tag-tag-03'] : [],
      assignedTo: i % 2 === 0 ? [currentUser.id, 'u-003'] : ['u-002', 'u-006'],
    }))
  );
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ExtendedItinerary | null>(null);
  const [subView, setSubView] = useState<SubView>('event');
  const [viewMode, setViewMode] = useState<ItinViewMode>('compact');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSlide, setShowSlide] = useState(false);

  const displayed = subView === 'mine'
    ? items.filter(i => i.assignedTo.includes(currentUser.id))
    : items;

  const handleSave = (data: ItineraryFormData) => {
    const newItem: ExtendedItinerary = {
      id: editItem?.id || `it-new-${Date.now()}`,
      time: data.method === 'relative' ? data.startTime : data.startTime,
      title: data.title,
      location: data.location,
      description: data.description,
      visibility: data.visibility,
      visibleTo: data.visibleTo,
      visibleToGroups: data.visibleToGroups,
      assignedTo: data.assignedTo,
    };
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? newItem : i));
    } else {
      setItems(prev => [...prev, newItem]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const myCount = items.filter(i => i.assignedTo.includes(currentUser.id)).length;

  // Shared helpers
  const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const sorted = [...displayed].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  const startMin = eventStartTime ? timeToMin(eventStartTime) : null;
  const endMin = eventEndTime ? timeToMin(eventEndTime) : null;
  const getPhase = (time: string): 'before' | 'during' | 'after' => {
    const m = timeToMin(time);
    if (startMin !== null && m < startMin) return 'before';
    if (endMin !== null && m >= endMin) return 'after';
    return 'during';
  };
  const getOffset = (time: string): string => {
    const m = timeToMin(time);
    if (startMin !== null && m < startMin) { const d = startMin - m; return `${d}m before`; }
    if (endMin !== null && m >= endMin) { const d = m - endMin; return d === 0 ? 'at end' : `${d}m after`; }
    if (startMin !== null) { const d = m - startMin; return d === 0 ? 'at start' : `+${d}m`; }
    return '';
  };
  const getDuration = (idx: number): string => {
    if (idx >= sorted.length - 1) return '';
    const curr = timeToMin(sorted[idx].time);
    const next = timeToMin(sorted[idx + 1].time);
    const diff = next - curr;
    if (diff <= 0) return '';
    if (diff >= 60) return `${Math.floor(diff / 60)}h ${diff % 60 > 0 ? `${diff % 60}m` : ''}`;
    return `${diff}m`;
  };
  const phaseConfig = (phase: 'before' | 'during' | 'after') => ({
    dot: phase === 'during' ? 'bg-court-500' : phase === 'before' ? 'bg-yellow-400' : 'bg-dark-300',
    border: phase === 'before' ? 'border-l-yellow-400' : phase === 'after' ? 'border-l-dark-300' : 'border-l-court-400',
    bg: phase === 'during' ? 'bg-court-50/30' : phase === 'before' ? 'bg-yellow-50/20' : 'bg-dark-50/40',
    time: phase === 'during' ? 'text-court-600' : phase === 'before' ? 'text-yellow-600' : 'text-dark-500',
    badge: phase === 'before' ? 'bg-yellow-100 text-yellow-700' : phase === 'during' ? 'bg-court-100 text-court-700' : 'bg-dark-100 text-dark-500',
    label: phase === 'before' ? 'Pre-Event' : phase === 'during' ? 'During' : 'Post-Event',
  });

  // Build nodes with markers
  type TNode = { type: 'item'; item: ExtendedItinerary; idx: number } | { type: 'marker'; label: string; time: string; kind: 'start' | 'end' };
  const nodes: TNode[] = [];
  let si = !startMin; let ei = !endMin;
  sorted.forEach((item, idx) => {
    const m = timeToMin(item.time);
    if (!si && startMin !== null && m >= startMin) { nodes.push({ type: 'marker', label: 'Event Starts', time: eventStartTime!, kind: 'start' }); si = true; }
    if (!ei && endMin !== null && m >= endMin) { nodes.push({ type: 'marker', label: 'Event Ends', time: eventEndTime!, kind: 'end' }); ei = true; }
    nodes.push({ type: 'item', item, idx });
  });
  if (!si) nodes.push({ type: 'marker', label: 'Event Starts', time: eventStartTime!, kind: 'start' });
  if (!ei) nodes.push({ type: 'marker', label: 'Event Ends', time: eventEndTime!, kind: 'end' });

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-dark-100/60 rounded-lg p-0.5">
          <button onClick={() => setSubView('event')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              subView === 'event' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            <Users size={13} /> Event Itinerary
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${subView === 'event' ? 'bg-court-100 text-court-700' : 'bg-dark-200 text-dark-400'}`}>{items.length}</span>
          </button>
          <button onClick={() => setSubView('mine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              subView === 'mine' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            <User size={13} /> My Itinerary
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${subView === 'mine' ? 'bg-court-100 text-court-700' : 'bg-dark-200 text-dark-400'}`}>{myCount}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex items-center gap-0.5 bg-dark-50 rounded-lg p-0.5">
            {([
              { key: 'compact' as ItinViewMode, icon: <List size={13} />, tip: 'Compact' },
              { key: 'expanded' as ItinViewMode, icon: <LayoutList size={13} />, tip: 'Expanded' },
              { key: 'timeline' as ItinViewMode, icon: <BarChart3 size={13} />, tip: 'Timeline' },
            ]).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} title={v.tip}
                className={`p-1.5 rounded-md transition-all ${viewMode === v.key ? 'bg-white text-dark-800 shadow-sm' : 'text-dark-400 hover:text-dark-600'}`}>
                {v.icon}
              </button>
            ))}
          </div>
          {/* Actions dropdown */}
          <div className="relative">
            <button onClick={() => setShowActions(!showActions)}
              className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5 transition-colors shadow-sm">
              <ChevronDown size={13} className={`transition-transform ${showActions ? 'rotate-180' : ''}`} /> Actions
            </button>
            <AnimatePresence>
              {showActions && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowActions(false)} />
                  <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-white rounded-xl shadow-elevated border border-dark-100 overflow-hidden">
                    <button onClick={() => { setShowActions(false); setEditItem(null); setShowForm(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 font-medium hover:bg-court-50 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-court-50 flex items-center justify-center text-court-600"><Plus size={14} /></div>
                      Create New Itinerary
                    </button>
                    <button onClick={() => { setShowActions(false); setShowSlide(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 font-medium hover:bg-court-50 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><ChevronsRight size={14} /></div>
                      Slide Itineraries
                    </button>
                    <button onClick={() => { setShowActions(false); setShowTemplates(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 font-medium hover:bg-court-50 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><FileText size={14} /></div>
                      Default Itinerary
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-dark-50 flex items-center justify-center mx-auto mb-3"><Clock size={24} className="text-dark-300" /></div>
          <p className="text-sm text-dark-400">{subView === 'mine' ? 'No itinerary items assigned to you' : 'No itinerary items yet'}</p>
        </div>
      ) : viewMode === 'compact' ? (
        /* ─── COMPACT VIEW ───────────────────────── */
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          {nodes.map((node) => {
            if (node.type === 'marker') {
              const isStart = node.kind === 'start';
              return (
                <div key={`m-${node.kind}`} className={`flex items-center gap-2 px-4 py-1.5 ${isStart ? 'bg-court-50/50' : 'bg-dark-50/60'}`}>
                  <div className={`w-2 h-2 rounded-sm ${isStart ? 'bg-court-500' : 'bg-dark-400'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isStart ? 'text-court-600' : 'text-dark-500'}`}>
                    {node.time} — {node.label}
                  </span>
                </div>
              );
            }
            const item = node.item;
            const phase = getPhase(item.time);
            const pc = phaseConfig(phase);
            const dur = getDuration(node.idx);
            const offset = getOffset(item.time);
            return (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-dark-50 last:border-b-0 hover:bg-dark-50/30 transition-colors group border-l-[3px] ${pc.border}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${pc.dot}`} />
                <span className={`text-xs font-bold tabular-nums w-12 shrink-0 ${pc.time}`}>{item.time}</span>
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-dark-800 truncate">{item.title}</p>
                  {item.visibility === 'private' && <PrivateBadge />}
                  {item.visibility === 'private' && <AvatarStack userIds={item.visibleTo} groupIds={item.visibleToGroups} max={2} />}
                </div>
                {dur && <span className="text-[10px] text-dark-400 font-medium shrink-0 bg-dark-50 px-1.5 py-0.5 rounded">{dur}</span>}
                {offset && <span className={`text-[9px] font-bold shrink-0 px-1.5 py-0.5 rounded ${pc.badge}`}>{offset}</span>}
                {item.location && <span className="text-[10px] text-dark-400 shrink-0 hidden sm:inline"><MapPin size={9} className="inline mr-0.5" />{item.location}</span>}
                {subView === 'event' && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                    <button onClick={() => { setEditItem(item); setShowForm(true); }} className="p-1 rounded hover:bg-white text-dark-400 hover:text-dark-700"><Pencil size={11} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'expanded' ? (
        /* ─── EXPANDED VIEW ──────────────────────── */
        <div className="relative">
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-dark-200" />
          <div className="space-y-0">
            {nodes.map((node) => {
              if (node.type === 'marker') {
                const isStart = node.kind === 'start';
                return (
                  <div key={`m-${node.kind}`} className="relative flex items-center gap-4 py-2">
                    <div className="relative z-10 shrink-0"><div className={`w-[11px] h-[11px] rounded-sm ${isStart ? 'bg-court-500' : 'bg-dark-500'}`} /></div>
                    <div className="flex-1">
                      <div className={`flex items-center gap-2 ${isStart ? 'text-court-600' : 'text-dark-500'}`}>
                        <div className="flex-1 h-px" style={{ backgroundImage: `repeating-linear-gradient(to right, ${isStart ? '#00A76F60' : '#91949960'} 0, ${isStart ? '#00A76F60' : '#91949960'} 4px, transparent 4px, transparent 8px)`, height: '1px', background: 'none' }} />
                        <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${isStart ? 'text-court-600' : 'text-dark-500'}`}>
                          <Clock size={10} /> {node.time} — {node.label}
                        </span>
                        <div className="flex-1 h-px" style={{ backgroundImage: `repeating-linear-gradient(to right, ${isStart ? '#00A76F60' : '#91949960'} 0, ${isStart ? '#00A76F60' : '#91949960'} 4px, transparent 4px, transparent 8px)`, height: '1px', background: 'none' }} />
                      </div>
                    </div>
                  </div>
                );
              }
              const item = node.item;
              const phase = getPhase(item.time);
              const pc = phaseConfig(phase);
              const dur = getDuration(node.idx);
              return (
                <div key={item.id} className="relative flex items-start gap-4 py-3 group">
                  <div className="relative z-10 shrink-0"><div className={`w-[11px] h-[11px] rounded-full ${pc.dot}`} /></div>
                  <div className={`flex-1 -mt-1 p-3.5 rounded-xl hover:bg-dark-50 transition-colors border-l-[3px] ${pc.border} ${pc.bg}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${pc.time}`}><Clock size={12} /> {item.time}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${pc.badge}`}>{pc.label}</span>
                        {dur && <span className="text-[10px] text-dark-400 font-medium bg-white/60 px-1.5 py-0.5 rounded">{dur}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {item.location && <span className="flex items-center gap-1 text-[11px] text-dark-400 mr-2"><MapPin size={11} /> {item.location}</span>}
                        {subView === 'event' && <>
                          <button onClick={() => { setEditItem(item); setShowForm(true); }} className="p-1 rounded hover:bg-white text-dark-400 hover:text-dark-700 opacity-0 group-hover:opacity-100"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                        </>}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-dark-800">{item.title}</p>
                    {item.description && <p className="text-xs text-dark-500 mt-1">{item.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {item.visibility === 'private' ? (
                        <>
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded"><Lock size={8} /> Private</span>
                          <AvatarStack userIds={item.visibleTo} groupIds={item.visibleToGroups} />
                        </>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[9px] font-medium text-dark-400 bg-white px-1.5 py-0.5 rounded"><Users size={8} /> All</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── TIMELINE VIEW ──────────────────────── */
        (() => {
          const allMins = sorted.map(s => timeToMin(s.time));
          const minTime = Math.min(...allMins, startMin || Infinity, endMin || Infinity);
          const maxTime = Math.max(...allMins, startMin || -Infinity, endMin || -Infinity);
          const range = Math.max(maxTime - minTime, 30);
          const pct = (m: number) => ((m - minTime) / range) * 100;

          return (
            <div className="bg-white border border-dark-100 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-dark-700">Timeline View</p>
                <p className="text-[10px] text-dark-400">{eventStartTime} — {eventEndTime}</p>
              </div>
              {/* Visual bar */}
              <div className="relative h-6 bg-dark-50 rounded-full overflow-hidden">
                {startMin !== null && endMin !== null && (
                  <div className="absolute top-0 bottom-0 bg-court-100 rounded-full"
                    style={{ left: `${pct(startMin)}%`, width: `${pct(endMin) - pct(startMin)}%` }} />
                )}
                {/* Item markers */}
                {sorted.map((item, idx) => {
                  const m = timeToMin(item.time);
                  const phase = getPhase(item.time);
                  const color = phase === 'during' ? '#00A76F' : phase === 'before' ? '#EAB308' : '#919499';
                  return (
                    <div key={item.id} className="absolute top-1 bottom-1 w-1 rounded-full" title={`${item.time} ${item.title}`}
                      style={{ left: `${pct(m)}%`, backgroundColor: color }} />
                  );
                })}
                {/* Start/End labels */}
                {startMin !== null && <div className="absolute top-0 bottom-0 w-0.5 bg-court-500" style={{ left: `${pct(startMin)}%` }} />}
                {endMin !== null && <div className="absolute top-0 bottom-0 w-0.5 bg-dark-500" style={{ left: `${pct(endMin)}%` }} />}
              </div>

              {/* Item rows */}
              <div className="space-y-1">
                {sorted.map((item, idx) => {
                  const m = timeToMin(item.time);
                  const phase = getPhase(item.time);
                  const pc = phaseConfig(phase);
                  const dur = getDuration(idx);
                  const offset = getOffset(item.time);
                  // Duration bar width
                  const durMin = idx < sorted.length - 1 ? timeToMin(sorted[idx + 1].time) - m : 15;
                  const barWidth = Math.max((durMin / range) * 100, 3);

                  const isHovered = hoveredItem === item.id;
                  return (
                    <div key={item.id} className="flex items-center gap-3 group">
                      <span className={`text-[11px] font-bold tabular-nums w-10 shrink-0 text-right ${pc.time}`}>{item.time}</span>
                      <div className="flex-1 relative h-7">
                        {/* Duration bar */}
                        <div className={`absolute top-0.5 bottom-0.5 rounded-md ${pc.bg} border ${pc.border} cursor-default transition-shadow ${isHovered ? 'shadow-md ring-1 ring-dark-200' : ''}`}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          style={{ left: `${pct(m)}%`, width: `${Math.min(barWidth, 100 - pct(m))}%` }}>
                          <div className="px-2 flex items-center h-full gap-1">
                            <span className="text-[10px] font-semibold text-dark-800 truncate">{item.title}</span>
                            {item.visibility === 'private' && <Lock size={8} className="text-orange-500 shrink-0" />}
                          </div>
                          {/* Instant tooltip */}
                          {isHovered && (
                            <div className="absolute bottom-full left-0 mb-1.5 z-30 pointer-events-none">
                              <div className="bg-dark-800 text-white rounded-lg px-3 py-2 text-[11px] shadow-lg whitespace-nowrap">
                                <p className="font-bold">{item.time} — {item.title}</p>
                                {(dur || item.location) && (
                                  <p className="text-dark-300 mt-0.5">
                                    {dur && <span>{dur}</span>}
                                    {dur && item.location && <span> · </span>}
                                    {item.location && <span>{item.location}</span>}
                                  </p>
                                )}
                                <p className="text-dark-300 mt-0.5">
                                  {item.visibility === 'private'
                                    ? `Private · ${item.visibleTo.map(id => { const u = users.find(u => u.id === id); return u ? `${u.firstName} ${u.lastName.charAt(0)}.` : id; }).join(', ')}`
                                    : 'All Event Attendees'}
                                </p>
                              </div>
                              <div className="w-2 h-2 bg-dark-800 rotate-45 ml-4 -mt-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {dur && <span className="text-[9px] text-dark-400 font-medium bg-dark-50 px-1 py-0.5 rounded">{dur}</span>}
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${pc.badge}`}>{offset}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 pt-2 border-t border-dark-100">
                {[
                  { label: 'Pre-Event', color: 'bg-yellow-400' },
                  { label: 'During Event', color: 'bg-court-500' },
                  { label: 'Post-Event', color: 'bg-dark-300' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                    <span className="text-[10px] text-dark-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()
      )}

      <AnimatePresence>
        {showForm && (
          <ItineraryWizard
            editItem={editItem}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            onSave={handleSave}
            eventStartTime={eventStartTime}
            eventEndTime={eventEndTime}
          />
        )}
        {showTemplates && (
          <DefaultItineraryModal
            onClose={() => setShowTemplates(false)}
            onApply={(templateItems) => {
              const newItems: ExtendedItinerary[] = templateItems.map((t, i) => ({
                id: `it-tpl-${Date.now()}-${i}`,
                time: t.time, title: t.title, location: t.location, description: t.description,
                visibility: 'everyone' as Visibility, visibleTo: [], visibleToGroups: [], assignedTo: [],
              }));
              setItems(prev => [...prev, ...newItems]);
              setShowTemplates(false);
            }}
          />
        )}
        {showSlide && (
          <SlideItineraryModal
            items={items}
            eventStartTime={eventStartTime}
            eventEndTime={eventEndTime}
            onClose={() => setShowSlide(false)}
            onApply={(updated) => { setItems(updated); setShowSlide(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// DEFAULT ITINERARY (TEMPLATE) MODAL
// ══════════════════════════════════════════════════════════
interface TemplateItinItem {
  time: string; title: string; location: string; description: string;
  visibility?: 'everyone' | 'private';
  visibleToGroups?: string[];
  visibleTo?: string[];
}

const orgTemplates: { id: string; name: string; items: TemplateItinItem[] }[] = [
  { id: 'tpl-01', name: 'Match Day Standard', items: [
    { time: '12:00', title: 'Team Arrival', location: 'Stadium', description: '' },
    { time: '12:30', title: 'Pre-Match Meal', location: 'Lounge', description: 'Pasta, chicken, vegetables' },
    { time: '13:30', title: 'Team Talk', location: 'Changing Room', description: 'Tactical reminders', visibility: 'private', visibleToGroups: ['des-Head Coach', 'des-Player'] },
    { time: '14:00', title: 'Warm-Up', location: '', description: '' },
  ]},
  { id: 'tpl-02', name: 'Training Day', items: [
    { time: '08:30', title: 'Arrival & Changing', location: 'Changing Rooms', description: '' },
    { time: '09:00', title: 'Warm-Up', location: 'Training Pitch', description: 'Dynamic stretching' },
    { time: '09:30', title: 'Main Session', location: 'Training Pitch', description: '' },
    { time: '11:00', title: 'Cool Down', location: 'Recovery Pool', description: '' },
  ]},
  { id: 'tpl-03', name: 'Recovery Protocol', items: [
    { time: '10:00', title: 'Pool Recovery', location: 'Recovery Pool', description: '', visibility: 'private', visibleToGroups: ['des-Medical Staff'] },
    { time: '10:30', title: 'Foam Rolling', location: 'Gym', description: '' },
    { time: '11:00', title: 'Individual Physio', location: '', description: '', visibility: 'private', visibleToGroups: ['des-Medical Staff'], visibleTo: ['u-005'] },
  ]},
];

const teamTemplates: { id: string; team: string; name: string; items: TemplateItinItem[] }[] = [
  { id: 'tpl-t01', team: 'First Team', name: 'First Team Matchday', items: [
    { time: '11:00', title: 'Arrival', location: 'Stadium', description: '' },
    { time: '11:30', title: 'Tactical Briefing', location: 'Tactical Room', description: '', visibility: 'private', visibleToGroups: ['des-Head Coach', 'tag-tag-03'] },
    { time: '12:00', title: 'Pre-Match Meal', location: 'Players Lounge', description: '' },
    { time: '13:30', title: 'Warm-Up', location: 'Main Pitch', description: '' },
  ]},
  { id: 'tpl-t02', team: 'Under-17', name: 'U-17 Training Day', items: [
    { time: '15:30', title: 'Arrival', location: 'Academy', description: '' },
    { time: '16:00', title: 'Training', location: 'Academy Pitch 1', description: '' },
    { time: '17:30', title: 'Debrief', location: '', description: '', visibility: 'private', visibleToGroups: ['des-Head Coach'] },
  ]},
];

function DefaultItineraryModal({ onClose, onApply }: {
  onClose: () => void;
  onApply: (items: { time: string; title: string; location: string; description: string }[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const allTemplates = [
    ...orgTemplates.map(t => ({ ...t, group: 'Organization', groupLabel: 'org templates' })),
    ...teamTemplates.map(t => ({ ...t, group: t.team, groupLabel: 'team templates' })),
  ];
  const filtered = allTemplates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const groups = [...new Set(filtered.map(t => t.group))];
  const selectedTpl = allTemplates.find(t => t.id === selected);
  const previewTpl = allTemplates.find(t => t.id === previewing);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[75vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-dark-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-dark-900">{previewing ? 'Template Preview' : 'Default Itinerary Templates'}</h3>
              {!previewing && <p className="text-xs text-dark-400 mt-0.5">Select a template to apply to this event</p>}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
          </div>
        </div>

        {previewing && previewTpl ? (
          /* ── Preview view ─────────────── */
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setPreviewing(null)} className="flex items-center gap-1 text-xs text-court-600 font-semibold hover:underline">
                <ArrowLeft size={12} /> Back to templates
              </button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-court-50 flex items-center justify-center"><FileText size={18} className="text-court-600" /></div>
              <div>
                <p className="text-sm font-bold text-dark-900">{previewTpl.name}</p>
                <p className="text-[10px] text-dark-400">{previewTpl.items.length} items · {previewTpl.items[0]?.time} — {previewTpl.items[previewTpl.items.length - 1]?.time}</p>
              </div>
            </div>
            <div className="border border-dark-100 rounded-xl overflow-hidden">
              {previewTpl.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-dark-50 last:border-b-0">
                  <span className="text-xs font-bold text-court-600 tabular-nums w-12 shrink-0">{item.time}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-dark-800">{item.title}</p>
                      {item.visibility === 'private' && <PrivateBadge />}
                    </div>
                    {item.location && <p className="text-[10px] text-dark-400 flex items-center gap-0.5"><MapPin size={8} /> {item.location}</p>}
                  </div>
                  {item.visibility === 'private' && (
                    <AvatarStack userIds={item.visibleTo || []} groupIds={item.visibleToGroups || []} max={2} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Selection view ──────────── */
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
            {groups.map(group => {
              const groupTpls = filtered.filter(t => t.group === group);
              const label = groupTpls[0]?.groupLabel || '';
              return (
                <div key={group}>
                  <p className="text-xs font-bold text-dark-800 mb-2">{group} <span className="text-court-500 font-normal ml-1">{label}</span></p>
                  <div className="space-y-1.5">
                    {groupTpls.map(tpl => (
                      <div key={tpl.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        selected === tpl.id ? 'border-court-400 bg-court-50/30 shadow-sm' : 'border-dark-100 hover:border-dark-200 hover:bg-dark-50/30'}`}
                        onClick={() => setSelected(tpl.id)}>
                        <input type="radio" name="template" checked={selected === tpl.id} onChange={() => setSelected(tpl.id)}
                          className="w-4 h-4 text-court-500 border-dark-300 focus:ring-court-500/20 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark-800">{tpl.name}</p>
                          <p className="text-[10px] text-dark-400">{tpl.items.length} items · {tpl.items[0]?.time} — {tpl.items[tpl.items.length - 1]?.time}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setPreviewing(tpl.id); }}
                          className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-court-600 shrink-0" title="Preview template">
                          <Eye size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={previewing ? () => setPreviewing(null) : onClose}
            className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50">
            {previewing ? 'Back' : 'Cancel'}
          </button>
          <button onClick={() => selectedTpl && onApply(selectedTpl.items)} disabled={!selected}
            className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-1.5">
            <Check size={14} /> Apply Template
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SLIDE ITINERARY MODAL
// ══════════════════════════════════════════════════════════
function SlideItineraryModal({ items, eventStartTime, eventEndTime, onClose, onApply }: {
  items: ExtendedItinerary[];
  eventStartTime?: string;
  eventEndTime?: string;
  onClose: () => void;
  onApply: (updated: ExtendedItinerary[]) => void;
}) {
  const [minutes, setMinutes] = useState(5);
  const [direction, setDirection] = useState<'backward' | 'forward'>('backward');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(items.map(i => i.id)));

  const timeToMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const minToTime = (m: number) => { const h = Math.floor(((m % 1440) + 1440) % 1440 / 60); const mm = ((m % 1440) + 1440) % 1440 % 60; return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`; };

  const startMin = eventStartTime ? timeToMin(eventStartTime) : null;
  const endMin = eventEndTime ? timeToMin(eventEndTime) : null;

  const getOffset = (time: string): string => {
    const m = timeToMin(time);
    if (startMin !== null && m < startMin) return `${startMin - m}m before event starts`;
    if (endMin !== null && m >= endMin) return `${m - endMin}m after event ends`;
    if (startMin !== null) return `${m - startMin}m after event starts`;
    return '';
  };

  const getNewTime = (time: string) => {
    const m = timeToMin(time);
    const offset = direction === 'forward' ? minutes : -minutes;
    return minToTime(m + offset);
  };

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = selectedIds.size === items.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map(i => i.id)));
  };

  const handleApply = () => {
    const updated = items.map(item => {
      if (!selectedIds.has(item.id)) return item;
      return { ...item, time: getNewTime(item.time) };
    });
    onApply(updated);
  };

  const sorted = [...items].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-dark-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-dark-900">Slide Itinerary</h3>
              <p className="text-xs text-dark-400 mt-0.5">Shift selected items forward or backward in time</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Controls card */}
          <div className="bg-dark-50/40 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Slide by</label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input type="number" min={1} max={480} value={minutes} onChange={e => setMinutes(parseInt(e.target.value) || 0)}
                    className="w-24 h-10 px-3 pr-12 rounded-lg border border-dark-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dark-400">min</span>
                </div>
                <span className="text-sm font-semibold text-court-600">{minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? `${minutes % 60}m` : ''}` : `${minutes} minutes`}</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Direction</label>
              <div className="flex items-center gap-0 bg-white rounded-xl p-0.5 w-fit border border-dark-100">
                <button onClick={() => setDirection('backward')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${direction === 'backward' ? 'bg-court-500 text-white shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
                  ← Backward
                </button>
                <button onClick={() => setDirection('forward')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${direction === 'forward' ? 'bg-court-500 text-white shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
                  Forward →
                </button>
              </div>
            </div>
          </div>

          {/* Select all */}
          <div className="flex items-center justify-between py-2 border-b border-dark-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={toggleAll}
                className="w-4 h-4 rounded text-court-500 border-dark-300 focus:ring-court-500/20" />
              <span className="text-sm font-bold text-dark-800">Select All</span>
            </label>
            <span className="text-[10px] text-dark-400 font-medium">{selectedIds.size}/{items.length} selected</span>
          </div>

          {/* Items */}
          <div className="space-y-1">
            {sorted.map(item => {
              const isSelected = selectedIds.has(item.id);
              const newTime = getNewTime(item.time);
              const offset = getOffset(item.time);
              return (
                <div key={item.id} onClick={() => toggleItem(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-court-50/30 border border-court-200' : 'border border-transparent hover:bg-dark-50/30'}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 rounded text-court-500 border-dark-300 focus:ring-court-500/20 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-dark-800">{item.title}</p>
                    <p className={`text-xs text-dark-400 mt-0.5 ${isSelected ? 'line-through' : ''}`}>{offset} ({item.time})</p>
                    {isSelected && (
                      <p className="text-xs text-court-600 font-bold mt-0.5">→ {newTime}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={handleApply} disabled={selectedIds.size === 0}
            className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-1.5">
            <ChevronsRight size={14} /> Confirm Slide
          </button>
        </div>
      </motion.div>
    </div>
  );
}
