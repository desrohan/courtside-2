import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Plus, Pencil, Trash2, X, Save, Check, Eye, ArrowLeft,
  ChevronDown, Lock, Users, User, ListChecks, Building2, ChevronRight, Send, FileText, Search,
} from 'lucide-react';
import { ChecklistItem } from '@/data/events';
import { currentUser, users } from '@/data/users';
import { AssignUsersModal } from '@/components/ui/VisibilityPicker';
import { format, parseISO } from 'date-fns';

interface Props {
  items: ChecklistItem[];
  eventEndDate?: string;
  eventEndTime?: string;
}

type ChecklistType = 'before' | 'during' | 'after';
type Visibility = 'everyone' | 'private';
type SubView = 'event' | 'mine';

interface TypedChecklist extends ChecklistItem {
  type: ChecklistType;
  visibility: Visibility;
  visibleTo: string[];
  visibleToGroups: string[];
  assignedTo: string[];
  sendAsTask: boolean;
}

const TYPE_COLORS: Record<ChecklistType, { bg: string; text: string; badge: string; dot: string; border: string }> = {
  before: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400', border: 'border-l-amber-400' },
  during: { bg: 'bg-court-50', text: 'text-court-700', badge: 'bg-court-100 text-court-700', dot: 'bg-court-500', border: 'border-l-court-500' },
  after:  { bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', border: 'border-l-slate-400' },
};

// ── Private Badge with Instant Tooltip ───────────────────
function PrivateBadge() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <span className="shrink-0"
      onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top }); }}
      onMouseLeave={() => setPos(null)}>
      <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-500 bg-orange-50 px-1 py-0.5 rounded cursor-help"><Lock size={8} /></span>
      {pos && (
        <span className="fixed z-[100] pointer-events-none" style={{ left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}>
          <span className="bg-dark-800 text-white rounded-lg px-2.5 py-1.5 text-[10px] shadow-lg whitespace-nowrap block">Private checklist</span>
          <span className="w-2 h-2 bg-dark-800 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
        </span>
      )}
    </span>
  );
}

// ── Avatar Stack with Hover Tooltip ──────────────────────
function AvatarStack({ userIds, groupIds = [], max = 3, label }: { userIds: string[]; groupIds?: string[]; max?: number; label?: string }) {
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
          <div className="w-5 h-5 rounded-full bg-court-100 flex items-center justify-center border-[1.5px] border-white">
            <Users size={9} className="text-court-600" />
          </div>
        )}
        {shown.map(u => (
          <div key={u.id} className="w-5 h-5 rounded-full bg-gradient-to-br from-dark-200 to-dark-300 flex items-center justify-center border-[1.5px] border-white">
            <span className="text-[7px] font-bold text-dark-600">{u.initials}</span>
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-5 h-5 rounded-full bg-dark-100 flex items-center justify-center border-[1.5px] border-white">
            <span className="text-[7px] font-bold text-dark-500">+{overflow}</span>
          </div>
        )}
      </div>
      {pos && (
        <div className="fixed z-[100] pointer-events-none" style={{ left: pos.x, top: pos.y - 8, transform: 'translateY(-100%)' }}>
          <div className="bg-dark-800 text-white rounded-lg px-3 py-2 text-[11px] shadow-lg whitespace-nowrap">
            {label && <p className="text-dark-400 text-[10px] font-medium mb-1">{label}</p>}
            {resolvedGroups.map(g => <p key={g.id} className="text-court-300">{g.name} ({g.type})</p>)}
            {resolvedUsers.map(u => <p key={u.id}>{u.name}</p>)}
          </div>
          <div className="w-2 h-2 bg-dark-800 rotate-45 ml-3 -mt-1" />
        </div>
      )}
    </div>
  );
}

// ── Add/Edit Checklist Form Modal ─────────────────────────
function ChecklistFormModal({ onClose, onSave, editItem, eventEndDate, eventEndTime }: {
  onClose: () => void;
  onSave: (desc: string, type: ChecklistType, visibility: Visibility, visibleTo: string[], visibleToGroups: string[], assignedTo: string[], sendAsTask: boolean) => void;
  editItem?: TypedChecklist | null;
  eventEndDate?: string;
  eventEndTime?: string;
}) {
  const [desc, setDesc] = useState(editItem?.text || '');
  const [type, setType] = useState<ChecklistType>(editItem?.type || 'before');
  const [visibility, setVisibility] = useState<Visibility>(editItem?.visibility || 'everyone');
  const [visibleTo, setVisibleTo] = useState<string[]>(editItem?.visibleTo || []);
  const [visibleToGroups, setVisibleToGroups] = useState<string[]>(editItem?.visibleToGroups || []);
  const [sendAsTask, setSendAsTask] = useState(editItem?.sendAsTask || false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleSubmit = () => {
    if (!desc.trim()) return;
    onSave(desc.trim(), type, visibility, visibleTo, visibleToGroups, visibleTo, sendAsTask);
  };

  // Resolve group name for display
  const resolveGroupName = (id: string) => {
    if (id.startsWith('des-')) return id.replace('des-', '');
    if (id.startsWith('tag-')) {
      const parts = id.replace('tag-', '');
      return parts;
    }
    if (id.startsWith('pos-')) return id.replace('pos-', '');
    return id;
  };

  const totalSelections = visibleTo.length + visibleToGroups.length;

  return (
    <>
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-lg font-bold text-dark-900">{editItem ? 'Edit Checklist Item' : 'Add Checklist Item'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Description *</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400" placeholder="e.g. Pack away kit" autoFocus />
          </div>

          {/* Phase */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Phase *</label>
            <div className="flex gap-2">
              {([
                { key: 'before' as ChecklistType, active: 'bg-amber-400 text-white shadow-sm', inactive: 'bg-dark-50 text-dark-500 hover:bg-dark-100' },
                { key: 'during' as ChecklistType, active: 'bg-court-500 text-white shadow-sm', inactive: 'bg-dark-50 text-dark-500 hover:bg-dark-100' },
                { key: 'after' as ChecklistType, active: 'bg-slate-500 text-white shadow-sm', inactive: 'bg-dark-50 text-dark-500 hover:bg-dark-100' },
              ]).map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold capitalize transition-all ${type === t.key ? t.active : t.inactive}`}>{t.key}</button>
              ))}
            </div>
          </div>

          {/* Send as Task */}
          <div className="flex items-center gap-2.5">
            <button onClick={() => setSendAsTask(!sendAsTask)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                sendAsTask ? 'bg-court-500 border-court-500' : 'border-dark-300 hover:border-dark-400'}`}>
              {sendAsTask && <CheckCircle2 size={12} className="text-white" />}
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Send size={14} className={sendAsTask ? 'text-court-600' : 'text-dark-400'} />
                <span className={`text-sm font-medium ${sendAsTask ? 'text-court-700' : 'text-dark-700'}`}>Send as task</span>
              </div>
              {sendAsTask && eventEndDate && (
                <p className="text-[11px] text-dark-400 mt-0.5 ml-5">
                  Task expires on {format(parseISO(eventEndDate), 'EEEE, MMM do yyyy')}{eventEndTime ? ` at ${eventEndTime}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Assign To — All Event Attendees / Private */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Assign To *</label>
            <div className="flex gap-2">
              <button onClick={() => setVisibility('everyone')}
                className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-semibold transition-all ${
                  visibility === 'everyone' ? 'bg-court-500 text-white shadow-sm' : 'bg-dark-50 text-dark-600 hover:bg-dark-100'}`}>
                <Building2 size={14} /> All Event Attendees
              </button>
              <button onClick={() => setVisibility('private')}
                className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-semibold transition-all ${
                  visibility === 'private' ? 'bg-orange-500 text-white shadow-sm' : 'bg-dark-50 text-dark-600 hover:bg-dark-100'}`}>
                <Lock size={14} /> Private
              </button>
            </div>

            <AnimatePresence>
              {visibility === 'private' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-3 space-y-2">
                    {/* Open assign modal button */}
                    <button onClick={() => setShowAssignModal(true)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-dark-200 hover:border-court-300 hover:bg-court-50/30 transition-colors group">
                      <span className="flex items-center gap-2 text-sm font-medium text-dark-500 group-hover:text-court-600">
                        <Users size={16} /> Select Users & Groups
                      </span>
                      <ChevronRight size={16} className="text-dark-400 group-hover:text-court-500" />
                    </button>

                    {/* Show selected tags */}
                    {totalSelections > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {visibleToGroups.map(id => (
                          <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-court-50 text-court-700 border border-court-200">
                            <Users size={10} />
                            {resolveGroupName(id)}
                            <button onClick={() => setVisibleToGroups(prev => prev.filter(x => x !== id))} className="ml-0.5 p-0.5 rounded hover:bg-court-100"><X size={10} /></button>
                          </span>
                        ))}
                        {visibleTo.map(id => {
                          const u = users.find(u => u.id === id);
                          if (!u) return null;
                          return (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-dark-50 text-dark-700 border border-dark-200">
                              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                                <span className="text-[6px] font-bold text-white">{u.avatar}</span>
                              </div>
                              {u.firstName} {u.lastName.charAt(0)}.
                              <button onClick={() => setVisibleTo(prev => prev.filter(x => x !== id))} className="ml-0.5 p-0.5 rounded hover:bg-dark-100"><X size={10} /></button>
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

        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!desc.trim()}
            className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-2 transition-colors">
            <Save size={15} /> {editItem ? 'Update' : 'Add Item'}
          </button>
        </div>
      </motion.div>
    </div>

    {/* Assign Users Modal */}
    <AssignUsersModal
      open={showAssignModal}
      onClose={() => setShowAssignModal(false)}
      onDone={(groupIds, userIds) => {
        setVisibleToGroups(groupIds);
        setVisibleTo(userIds);
        setShowAssignModal(false);
      }}
      initialGroupIds={visibleToGroups}
      initialUserIds={visibleTo}
    />
    </>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN CHECKLIST TAB
// ══════════════════════════════════════════════════════════
export default function ChecklistTab({ items: initialItems, eventEndDate, eventEndTime }: Props) {
  const [checklist, setChecklist] = useState<TypedChecklist[]>(
    initialItems.map((item, i) => {
      // Distribute items across types
      const type: ChecklistType = i < Math.ceil(initialItems.length / 3) ? 'before' : i < Math.ceil(initialItems.length * 2 / 3) ? 'during' : 'after';
      // Assign different users for realism — some to current user, some to others
      const assignmentPool: string[][] = [
        [currentUser.id],
        ['u-003'],
        ['u-006'],
        [currentUser.id, 'u-005'],
        ['u-002', 'u-006'],
        ['u-003', 'u-005'],
      ];
      const assignedTo = assignmentPool[i % assignmentPool.length];
      // Make some items private for demo; i===1 is private + task, i===3 is private with groups
      const isPrivate = i === 1 || i === 3 || i === 4;
      return {
        ...item,
        type,
        visibility: isPrivate ? 'private' as Visibility : 'everyone' as Visibility,
        visibleTo: i === 1 ? ['u-003', currentUser.id] : i === 3 ? ['u-006'] : i === 4 ? ['u-002', 'u-005'] : [],
        visibleToGroups: i === 1 ? ['des-Head Coach'] : i === 3 ? ['des-Medical Staff', 'tag-tag-03'] : i === 4 ? ['pos-Goalkeeper'] : [],
        assignedTo,
        sendAsTask: i === 0 || i === 1 || i === 2 || i === 5,
      };
    })
  );
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<TypedChecklist | null>(null);
  const [expandedType, setExpandedType] = useState<ChecklistType | null>('before');
  const [subView, setSubView] = useState<SubView>('event');
  const [showActions, setShowActions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const toggle = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const handleSave = (desc: string, type: ChecklistType, visibility: Visibility, visibleTo: string[], visibleToGroups: string[], assignedTo: string[], sendAsTask: boolean) => {
    if (editItem) {
      setChecklist(prev => prev.map(c => c.id === editItem.id ? { ...c, text: desc, type, visibility, visibleTo, visibleToGroups, assignedTo, sendAsTask } : c));
    } else {
      setChecklist(prev => [...prev, {
        id: `cl-new-${Date.now()}`,
        text: desc,
        completed: false,
        type,
        visibility,
        visibleTo,
        visibleToGroups,
        assignedTo,
        sendAsTask,
      }]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = (id: string) => {
    setChecklist(prev => prev.filter(c => c.id !== id));
  };

  // Filter by sub-view
  const displayed = subView === 'mine'
    ? checklist.filter(c => c.assignedTo.includes(currentUser.id))
    : checklist;

  const myCount = checklist.filter(c => c.assignedTo.includes(currentUser.id)).length;

  // Group by type
  const grouped = displayed.reduce((acc, item) => {
    (acc[item.type] = acc[item.type] || []).push(item);
    return acc;
  }, {} as Record<ChecklistType, TypedChecklist[]>);

  const completedCount = displayed.filter(c => c.completed).length;
  const progress = displayed.length > 0 ? (completedCount / displayed.length) * 100 : 0;
  const isEventView = subView === 'event';

  return (
    <div className="space-y-4">
      {/* Header: Sub-view toggle with counts + Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-dark-100/60 rounded-lg p-0.5">
          <button
            onClick={() => setSubView('event')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              subView === 'event' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
            }`}
          >
            <Users size={13} /> Event Checklist
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${subView === 'event' ? 'bg-court-100 text-court-700' : 'bg-dark-200 text-dark-400'}`}>{checklist.length}</span>
          </button>
          <button
            onClick={() => setSubView('mine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              subView === 'mine' ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
            }`}
          >
            <User size={13} /> My Checklist
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${subView === 'mine' ? 'bg-court-100 text-court-700' : 'bg-dark-200 text-dark-400'}`}>{myCount}</span>
          </button>
        </div>
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
                    Create New Checklist
                  </button>
                  <button onClick={() => { setShowActions(false); setShowTemplates(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 font-medium hover:bg-court-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><FileText size={14} /></div>
                    Default Checklist
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Bar — only in My Checklist view */}
      {!isEventView && displayed.length > 0 && (
        <div className="bg-white border border-dark-100 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-dark-700">
              {completedCount} of {displayed.length} completed
            </p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              progress === 100 ? 'bg-court-100 text-court-700' : progress > 50 ? 'bg-amber-100 text-amber-700' : 'bg-dark-100 text-dark-500'
            }`}>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-court-500 to-court-400"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {displayed.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-dark-50 flex items-center justify-center mx-auto mb-3">
            <ListChecks size={28} className="text-dark-300" />
          </div>
          <p className="text-sm font-medium text-dark-500 mb-1">
            {subView === 'mine' ? 'No checklist items assigned to you' : 'No checklist items yet'}
          </p>
          <p className="text-xs text-dark-400">
            {subView === 'mine' ? 'Items assigned to you will appear here' : 'Add items to track tasks for this event'}
          </p>
        </div>
      ) : (
        /* Grouped Accordion Sections */
        <div className="space-y-2">
          {(['before', 'during', 'after'] as ChecklistType[]).map(type => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            const isExpanded = expandedType === type;
            const typeCompleted = items.filter(i => i.completed).length;
            const tc = TYPE_COLORS[type];

            return (
              <div key={type} className="border border-dark-100 rounded-xl overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => setExpandedType(isExpanded ? null : type)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-dark-50/50 hover:bg-dark-50 transition-colors"
                >
                  <ChevronDown size={14} className={`text-dark-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  <div className={`w-2 h-2 rounded-full ${tc.dot}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${tc.text}`}>{type}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    {!isEventView ? (
                      <>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tc.badge}`}>
                          {typeCompleted}/{items.length}
                        </span>
                        <div className="w-12 h-1.5 bg-dark-100 rounded-full overflow-hidden hidden sm:block">
                          <div className={`h-full rounded-full ${tc.dot}`} style={{ width: `${items.length > 0 ? (typeCompleted / items.length) * 100 : 0}%` }} />
                        </div>
                      </>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tc.badge}`}>
                        {items.length}
                      </span>
                    )}
                  </div>
                </button>

                {/* Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="divide-y divide-dark-50">
                        {items.map(item => {
                          const isMyItem = item.assignedTo.includes(currentUser.id);

                          return (
                            <div key={item.id} className={`flex items-center gap-3 px-4 py-2.5 group hover:bg-dark-50/30 transition-colors border-l-[3px] ${tc.border}`}>
                              {/* Checkbox — only in My Checklist view */}
                              {!isEventView && (
                                <button onClick={() => toggle(item.id)} className="shrink-0">
                                  {item.completed
                                    ? <CheckCircle2 size={18} className="text-court-500" />
                                    : <Circle size={18} className="text-dark-300 group-hover:text-court-400 transition-colors" />}
                                </button>
                              )}

                              {/* Dot indicator in event view (replaces checkbox) */}
                              {isEventView && (
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${tc.dot}`} />
                              )}

                              {/* Content */}
                              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                <span className={`text-sm leading-snug truncate ${!isEventView && item.completed ? 'line-through text-dark-400' : 'text-dark-800 font-medium'}`}>
                                  {item.text}
                                </span>
                                {item.sendAsTask && (
                                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                                    <Send size={8} /> Task
                                  </span>
                                )}
                                {item.visibility === 'private' && <PrivateBadge />}
                              </div>

                              {/* Avatar stack — only in event view + private items */}
                              {isEventView && item.visibility === 'private' && (
                                <AvatarStack
                                  userIds={item.visibleTo}
                                  groupIds={item.visibleToGroups}
                                  max={3}
                                  label="Assigned to"
                                />
                              )}

                              {/* Actions — only in event checklist view */}
                              {isEventView && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button onClick={() => { setEditItem(item); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-dark-700">
                                    <Pencil size={13} />
                                  </button>
                                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <ChecklistFormModal
            editItem={editItem}
            eventEndDate={eventEndDate}
            eventEndTime={eventEndTime}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Default Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <DefaultChecklistModal
            onClose={() => setShowTemplates(false)}
            onApply={(items) => {
              const newItems: TypedChecklist[] = items.map((item, idx) => ({
                id: `cl-tpl-${Date.now()}-${idx}`,
                text: item.text,
                completed: false,
                type: item.type,
                visibility: (item.visibility || 'everyone') as Visibility,
                visibleTo: item.visibleTo || [],
                visibleToGroups: item.visibleToGroups || [],
                assignedTo: item.visibleTo || [],
                sendAsTask: item.sendAsTask || false,
              }));
              setChecklist(prev => [...prev, ...newItems]);
              setShowTemplates(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// DEFAULT CHECKLIST TEMPLATES
// ══════════════════════════════════════════════════════════

interface ChecklistTemplateItem {
  text: string;
  type: ChecklistType;
  visibility?: 'everyone' | 'private';
  visibleToGroups?: string[];
  visibleTo?: string[];
  sendAsTask?: boolean;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  items: ChecklistTemplateItem[];
}

const orgChecklistTemplates: ChecklistTemplate[] = [
  { id: 'cl-tpl-01', name: 'Match Day Preparation', items: [
    { text: 'Kit prepared and laid out', type: 'before' },
    { text: 'Medical bag stocked', type: 'before', visibility: 'private', visibleToGroups: ['des-Medical Staff'], sendAsTask: true },
    { text: 'GPS vests charged and ready', type: 'before', visibility: 'private', visibleToGroups: ['des-Performance Analyst'], sendAsTask: true },
    { text: 'Water bottles filled and labelled', type: 'before' },
    { text: 'Tactical boards set up', type: 'during', visibility: 'private', visibleToGroups: ['des-Head Coach', 'des-Assistant Coach'] },
    { text: 'Half-time refreshments ready', type: 'during' },
    { text: 'Post-match media briefing scheduled', type: 'after' },
    { text: 'Collect GPS data', type: 'after', visibility: 'private', visibleToGroups: ['des-Performance Analyst'], sendAsTask: true },
  ]},
  { id: 'cl-tpl-02', name: 'Training Session Setup', items: [
    { text: 'Set up cones and markers', type: 'before' },
    { text: 'Prepare bibs (3 colours)', type: 'before' },
    { text: 'Inflate and set out match balls', type: 'before' },
    { text: 'Video camera positioned', type: 'during' },
    { text: 'Pack away all equipment', type: 'after' },
    { text: 'Upload session video', type: 'after' },
  ]},
  { id: 'cl-tpl-03', name: 'Away Travel Checklist', items: [
    { text: 'Confirm travel arrangements', type: 'before' },
    { text: 'Pack home and away kits', type: 'before' },
    { text: 'First aid kit checked', type: 'before', visibility: 'private', visibleToGroups: ['des-Medical Staff'] },
    { text: 'Player meals organised', type: 'before' },
    { text: 'Hotel booking confirmed', type: 'before' },
    { text: 'Media accreditation sorted', type: 'before' },
    { text: 'Collect all belongings from changing room', type: 'after' },
  ]},
];

const teamChecklistTemplates: (ChecklistTemplate & { team: string })[] = [
  { id: 'cl-tpl-t01', team: 'First Team', name: 'First Team Recovery Day', items: [
    { text: 'Pool session scheduled', type: 'before', visibility: 'private', visibleToGroups: ['des-Medical Staff'], visibleTo: ['u-005'] },
    { text: 'Individual physio appointments set', type: 'before', visibility: 'private', visibleToGroups: ['des-Medical Staff'] },
    { text: 'Monitor wellness questionnaire completion', type: 'during' },
    { text: 'Review recovery metrics', type: 'after', visibility: 'private', visibleToGroups: ['des-Head Coach', 'tag-tag-03'] },
  ]},
  { id: 'cl-tpl-t02', team: 'Under-17', name: 'U-17 Academy Session', items: [
    { text: 'Confirm parent transport arrangements', type: 'before' },
    { text: 'Academy pitch booked', type: 'before' },
    { text: 'Record attendance', type: 'during' },
    { text: 'Send session report to parents', type: 'after', visibility: 'private', visibleToGroups: ['des-Head Coach'], sendAsTask: true },
    { text: 'Update player development logs', type: 'after' },
  ]},
];

// ── Default Checklist Modal ──────────────────────────────
function DefaultChecklistModal({ onClose, onApply }: {
  onClose: () => void;
  onApply: (items: ChecklistTemplateItem[]) => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);

  const allTemplates = [
    ...orgChecklistTemplates.map(t => ({ ...t, group: 'Organization', groupLabel: 'org templates' })),
    ...teamChecklistTemplates.map(t => ({ ...t, group: t.team, groupLabel: 'team templates' })),
  ];
  const filtered = allTemplates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const groups = [...new Set(filtered.map(t => t.group))];
  const selectedTpl = allTemplates.find(t => t.id === selected);
  const previewTpl = allTemplates.find(t => t.id === previewing);

  const typeLabel: Record<ChecklistType, { text: string; color: string }> = {
    before: { text: 'Before', color: 'text-amber-600 bg-amber-50' },
    during: { text: 'During', color: 'text-court-600 bg-court-50' },
    after: { text: 'After', color: 'text-slate-600 bg-slate-50' },
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[75vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-dark-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-dark-900">{previewing ? 'Template Preview' : 'Default Checklist Templates'}</h3>
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
              <div className="w-10 h-10 rounded-xl bg-court-50 flex items-center justify-center"><ListChecks size={18} className="text-court-600" /></div>
              <div>
                <p className="text-sm font-bold text-dark-900">{previewTpl.name}</p>
                <p className="text-[10px] text-dark-400">{previewTpl.items.length} items</p>
              </div>
            </div>
            <div className="border border-dark-100 rounded-xl overflow-hidden">
              {previewTpl.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-dark-50 last:border-b-0">
                  <Circle size={14} className="text-dark-300 shrink-0" />
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="text-sm font-medium text-dark-800 truncate">{item.text}</p>
                    {item.sendAsTask && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                        <Send size={8} /> Task
                      </span>
                    )}
                    {item.visibility === 'private' && <PrivateBadge />}
                  </div>
                  {item.visibility === 'private' && (
                    <AvatarStack userIds={item.visibleTo || []} groupIds={item.visibleToGroups || []} max={2} />
                  )}
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize shrink-0 ${typeLabel[item.type].color}`}>{typeLabel[item.type].text}</span>
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
                    {groupTpls.map(tpl => {
                      const beforeCount = tpl.items.filter(i => i.type === 'before').length;
                      const duringCount = tpl.items.filter(i => i.type === 'during').length;
                      const afterCount = tpl.items.filter(i => i.type === 'after').length;
                      return (
                        <div key={tpl.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          selected === tpl.id ? 'border-court-400 bg-court-50/30 shadow-sm' : 'border-dark-100 hover:border-dark-200 hover:bg-dark-50/30'}`}
                          onClick={() => setSelected(tpl.id)}>
                          <input type="radio" name="cl-template" checked={selected === tpl.id} onChange={() => setSelected(tpl.id)}
                            className="w-4 h-4 text-court-500 border-dark-300 focus:ring-court-500/20 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-dark-800">{tpl.name}</p>
                            <p className="text-[10px] text-dark-400">{tpl.items.length} items · {beforeCount > 0 ? `${beforeCount} before` : ''}{duringCount > 0 ? ` · ${duringCount} during` : ''}{afterCount > 0 ? ` · ${afterCount} after` : ''}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setPreviewing(tpl.id); }}
                            className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-court-600 shrink-0" title="Preview template">
                            <Eye size={14} />
                          </button>
                        </div>
                      );
                    })}
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
