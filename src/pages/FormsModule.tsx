import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Eye, Pencil, Trash2, Send, FileText,
  Clock, Globe, Lock, Users, User, X, CheckCircle2,
  ClipboardList, ArrowRight, Calendar, ToggleLeft, ToggleRight, Copy,
  BarChart3, GripVertical, Type, Hash, AlignLeft, List, CheckSquare,
  CircleDot, Upload, ChevronDown, ChevronUp, Flag, AlertTriangle,
  Heading, Save, ArrowLeft,
} from 'lucide-react';
import { forms, formAssignments, formSubmissions, getMyAssignments, Form, FormAssignment, FormSubmission, FormField, FieldType, FormFieldValue } from '@/data/forms';
import { currentUser, users } from '@/data/users';
import { format, parseISO, isBefore } from 'date-fns';

type FormsTab = 'forms' | 'assign' | 'my_assignment' | 'submissions';

const tabDefs: { key: FormsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'forms', label: 'Create & Edit', icon: <FileText size={15} /> },
  { key: 'assign', label: 'Assign Form', icon: <Send size={15} /> },
  { key: 'my_assignment', label: 'My Assignment', icon: <User size={15} /> },
  { key: 'submissions', label: 'Form Submissions', icon: <BarChart3 size={15} /> },
];

export default function FormsModule() {
  const [activeTab, setActiveTab] = useState<FormsTab>('forms');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string>(formAssignments[0]?.id || '');
  const [previewForm, setPreviewForm] = useState<Form | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editForm, setEditForm] = useState<Form | null>(null);

  const openBuilder = (form?: Form) => {
    setEditForm(form || null);
    setShowBuilder(true);
  };

  if (showBuilder) {
    return <FormBuilder existingForm={editForm} onClose={() => { setShowBuilder(false); setEditForm(null); }} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-dark-900">Forms</h1>
          <p className="text-xs text-dark-400 mt-0.5">Build, assign, and manage forms</p>
        </div>
        <button onClick={() => openBuilder()} className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={16} /> New Form
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-dark-100/60 rounded-xl p-0.5 w-fit">
        {tabDefs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Create & Edit Tab ──────────────────────── */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search forms..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div className="flex items-center gap-1 bg-dark-50 rounded-xl p-0.5">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
                  {s} {s === 'all' ? `(${forms.length})` : s === 'active' ? `(${forms.filter(f => f.active).length})` : `(${forms.filter(f => !f.active).length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-dark-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Form</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Created By</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Created</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Activity</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Fields</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-100">
                {forms.filter(f => statusFilter === 'all' ? true : statusFilter === 'active' ? f.active : !f.active)
                  .filter(f => !search || f.title.toLowerCase().includes(search.toLowerCase()))
                  .map(form => (
                  <tr key={form.id} className="hover:bg-dark-50/30 transition-colors">
                    <td className="px-4 py-3"><p className="text-sm font-semibold text-dark-800">{form.title}</p></td>
                    <td className="px-4 py-3 text-xs text-dark-500">{form.createdBy}</td>
                    <td className="px-4 py-3 text-xs text-dark-500">{form.createdAt}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-court-50 text-court-700 rounded text-[10px] font-semibold">{form.activityNames[0]}</span></td>
                    <td className="px-4 py-3 text-xs text-dark-500 font-medium">{form.fields.filter(f => f.type !== 'header').length}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${form.active ? 'bg-green-50 text-green-600' : 'bg-dark-100 text-dark-400'}`}>
                        {form.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPreviewForm(form)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Eye size={14} /></button>
                        <button onClick={() => openBuilder(form)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Assign Form Tab ────────────────────────── */}
      {activeTab === 'assign' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-dark-50 rounded-xl p-0.5">
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-dark-900 shadow-sm">Published ({formAssignments.filter(a => a.published).length})</button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-dark-500">Unpublished ({formAssignments.filter(a => !a.published).length})</button>
            </div>
            <button className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Create Assignment</button>
          </div>
          <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-dark-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Assignment</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Form</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Type</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Visibility</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Assigned</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-100">
                {formAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-dark-50/30">
                    <td className="px-4 py-3"><p className="text-sm font-semibold text-dark-800">{a.name}</p><p className="text-[10px] text-dark-400">{a.description}</p></td>
                    <td className="px-4 py-3 text-xs text-dark-500">{a.formTitle}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.type === 'time_sensitive' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {a.type === 'time_sensitive' ? 'Time Sensitive' : 'Perpetual'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-dark-500">{a.visibility === 'public' ? <Globe size={12} /> : <Lock size={12} />} {a.visibility}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-500">{a.assignedUserIds.length} users</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${a.published ? 'bg-green-50 text-green-600' : 'bg-dark-100 text-dark-400'}`}>
                        {a.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Copy size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── My Assignment Tab ──────────────────────── */}
      {activeTab === 'my_assignment' && (
        <div className="space-y-4">
          {getMyAssignments('u-001').length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dark-100"><ClipboardList size={28} className="text-dark-200 mx-auto mb-3" /><p className="text-sm text-dark-400">No forms assigned to you</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getMyAssignments('u-001').map((a, i) => {
                const submitted = formSubmissions.some(s => s.formAssignmentId === a.id && s.userId === 'u-001');
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-dark-100 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-dark-900">{a.name}</h3>
                        <p className="text-xs text-dark-500 mt-0.5">{a.description}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${a.type === 'time_sensitive' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                        {a.type === 'time_sensitive' ? 'Time Sensitive' : 'Perpetual'}
                      </span>
                    </div>
                    {a.expiry && <p className="text-[10px] text-dark-400 mb-3 flex items-center gap-1"><Clock size={10} /> Due: {format(parseISO(a.expiry), 'MMM d, yyyy')}</p>}
                    <button disabled={submitted && !a.allowMultiple}
                      className={`w-full h-9 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        submitted && !a.allowMultiple ? 'bg-green-50 text-green-600 cursor-default' : 'bg-court-500 text-white hover:bg-court-600'}`}>
                      {submitted && !a.allowMultiple ? <><CheckCircle2 size={14} /> Submitted</> : <><ArrowRight size={14} /> Fill Form</>}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Form Submissions Tab ───────────────────── */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select value={selectedAssignment} onChange={e => setSelectedAssignment(e.target.value)}
              className="h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 min-w-[300px]">
              {formAssignments.map(a => <option key={a.id} value={a.id}>{a.name} ({a.formTitle})</option>)}
            </select>
          </div>
          {(() => {
            const assignment = formAssignments.find(a => a.id === selectedAssignment);
            const form = forms.find(f => f.id === assignment?.formId);
            const subs = formSubmissions.filter(s => s.formAssignmentId === selectedAssignment);
            if (!form || !assignment) return <p className="text-sm text-dark-400 text-center py-8">Select an assignment</p>;
            const dataFields = form.fields.filter(f => f.type !== 'header');
            return (
              <div className="bg-white rounded-xl border border-dark-100 overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-dark-50/60">
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">User</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Submitted</th>
                    {dataFields.map(f => (
                      <th key={f.id} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 min-w-[120px]">{f.label}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-dark-100">
                    {subs.map(sub => (
                      <tr key={sub.id} className="hover:bg-dark-50/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">{sub.userAvatar}</span>
                            </div>
                            <span className="text-sm font-medium text-dark-800">{sub.userName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-dark-500">{sub.submittedAt}</td>
                        {dataFields.map(f => {
                          const val = sub.data[f.name];
                          const isFlagged = f.values?.some(v => v.flagged && (Array.isArray(val) ? val.includes(v.value) : val === v.value));
                          return (
                            <td key={f.id} className="px-4 py-3 text-xs text-dark-600">
                              <span className={isFlagged ? 'px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-bold flex items-center gap-1 w-fit' : ''}>
                                {isFlagged && <Flag size={9} />}
                                {Array.isArray(val) ? val.join(', ') : val ?? '—'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── Form Preview Modal ─────────────────────── */}
      <AnimatePresence>
        {previewForm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setPreviewForm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
                <h3 className="text-lg font-bold text-dark-900">{previewForm.title}</h3>
                <button onClick={() => setPreviewForm(null)} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {previewForm.fields.map(field => (
                  <div key={field.id}>
                    {field.type === 'header' ? (
                      <h4 className="text-base font-bold text-dark-900 border-b border-dark-100 pb-2 mb-2">{field.label}</h4>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-dark-600 mb-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea rows={field.rows || 3} className="w-full px-3 py-2 rounded-lg border border-dark-200 text-sm bg-dark-50" disabled placeholder={field.placeholder} />
                        ) : field.type === 'select' ? (
                          <select className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-dark-50" disabled>
                            <option>Select...</option>
                            {field.values?.map(v => <option key={v.value}>{v.label}</option>)}
                          </select>
                        ) : field.type === 'radio-group' ? (
                          <div className="flex flex-wrap gap-3">
                            {field.values?.map(v => (
                              <label key={v.value} className={`flex items-center gap-1.5 text-sm ${v.flagged ? 'text-red-600 font-semibold' : 'text-dark-600'}`}>
                                <input type="radio" name={field.name} disabled className="accent-court-500" /> {v.label}
                                {v.flagged && <Flag size={10} className="text-red-500" />}
                              </label>
                            ))}
                          </div>
                        ) : field.type === 'checkbox-group' ? (
                          <div className="flex flex-wrap gap-3">
                            {field.values?.map(v => (
                              <label key={v.value} className={`flex items-center gap-1.5 text-sm ${v.flagged ? 'text-red-600 font-semibold' : 'text-dark-600'}`}>
                                <input type="checkbox" disabled className="accent-court-500" /> {v.label}
                                {v.flagged && <Flag size={10} className="text-red-500" />}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                            className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-dark-50" disabled placeholder={field.placeholder} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════
// FORM BUILDER
// ══════════════════════════════════════════════════════════

const fieldTypeOptions: { type: FieldType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'header',         label: 'Section Header', icon: <Heading size={16} />,     desc: 'Section divider' },
  { type: 'text',           label: 'Short Text',     icon: <Type size={16} />,         desc: 'Single line input' },
  { type: 'textarea',       label: 'Long Text',      icon: <AlignLeft size={16} />,    desc: 'Multi-line text' },
  { type: 'number',         label: 'Number',         icon: <Hash size={16} />,         desc: 'Numeric input' },
  { type: 'date',           label: 'Date',           icon: <Calendar size={16} />,     desc: 'Date picker' },
  { type: 'select',         label: 'Dropdown',       icon: <List size={16} />,         desc: 'Single select' },
  { type: 'radio-group',    label: 'Radio',          icon: <CircleDot size={16} />,    desc: 'Single choice' },
  { type: 'checkbox-group', label: 'Checkbox',       icon: <CheckSquare size={16} />,  desc: 'Multi choice' },
  { type: 'file',           label: 'File Upload',    icon: <Upload size={16} />,       desc: 'File attachment' },
];

function FormBuilder({ existingForm, onClose }: { existingForm: Form | null; onClose: () => void }) {
  const [title, setTitle] = useState(existingForm?.title || '');
  const [fields, setFields] = useState<FormField[]>(existingForm?.fields || []);
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addField = (type: FieldType) => {
    const id = `f-${Date.now()}`;
    const name = `field_${Date.now()}`;
    const newField: FormField = {
      id, type, name, required: false,
      label: type === 'header' ? 'New Section' : `New ${fieldTypeOptions.find(f => f.type === type)?.label || 'Field'}`,
      ...((['select', 'radio-group', 'checkbox-group'].includes(type)) && {
        values: [{ label: 'Option 1', value: 'opt_1' }, { label: 'Option 2', value: 'opt_2' }],
      }),
      ...(type === 'textarea' && { rows: 3 }),
      ...(type === 'text' && { placeholder: 'Enter text...' }),
    };
    setFields(prev => [...prev, newField]);
    setExpandedField(id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (expandedField === id) setExpandedField(null);
  };

  const moveField = (fromIdx: number, toIdx: number) => {
    const copy = [...fields];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setFields(copy);
  };

  // Option management for select/radio/checkbox
  const addOption = (fieldId: string) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f;
      const idx = (f.values?.length || 0) + 1;
      return { ...f, values: [...(f.values || []), { label: `Option ${idx}`, value: `opt_${idx}` }] };
    }));
  };

  const updateOption = (fieldId: string, optIdx: number, updates: Partial<FormFieldValue>) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId || !f.values) return f;
      const vals = [...f.values];
      vals[optIdx] = { ...vals[optIdx], ...updates };
      return { ...f, values: vals };
    }));
  };

  const removeOption = (fieldId: string, optIdx: number) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId || !f.values) return f;
      return { ...f, values: f.values.filter((_, i) => i !== optIdx) };
    }));
  };

  const toggleFlag = (fieldId: string, optIdx: number) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId || !f.values) return f;
      const vals = [...f.values];
      vals[optIdx] = { ...vals[optIdx], flagged: !vals[optIdx].flagged };
      return { ...f, values: vals };
    }));
  };

  const hasOptions = (type: FieldType) => ['select', 'radio-group', 'checkbox-group'].includes(type);
  const fieldIcon = (type: FieldType) => fieldTypeOptions.find(f => f.type === type)?.icon || <Type size={14} />;
  const fieldLabel = (type: FieldType) => fieldTypeOptions.find(f => f.type === type)?.label || type;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-dark-700">
            <ArrowLeft size={16} /> Back to Forms
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-semibold text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={onClose} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 shadow-sm">
            <Save size={14} /> {existingForm ? 'Save Changes' : 'Create Form'}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* ─── LEFT: Field Palette ──────────────────── */}
        <div className="w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-dark-100 p-4 sticky top-4">
            <p className="text-xs font-bold text-dark-700 uppercase tracking-wider mb-3">Add Fields</p>
            <p className="text-[10px] text-dark-400 mb-3">Click to add to form</p>
            <div className="space-y-1.5">
              {fieldTypeOptions.map(opt => (
                <button key={opt.type} onClick={() => addField(opt.type)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dark-100 text-left hover:border-court-200 hover:bg-court-50/20 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-dark-50 group-hover:bg-court-100 flex items-center justify-center text-dark-400 group-hover:text-court-600 transition-colors shrink-0">{opt.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-dark-800">{opt.label}</p>
                    <p className="text-[9px] text-dark-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Form Canvas ──────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Form title */}
          <div className="bg-white rounded-2xl border border-dark-100 p-5 mb-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Form Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Pre-Match Medical Clearance"
              className="w-full h-10 px-3 rounded-lg border border-dark-200 text-base font-bold focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>

          {/* Fields */}
          {fields.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-dark-200 p-12 text-center">
              <FileText size={32} className="text-dark-200 mx-auto mb-3" />
              <p className="text-sm text-dark-400 font-semibold mb-1">No fields yet</p>
              <p className="text-xs text-dark-300">Click a field type from the left panel to start building your form</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((field, idx) => {
                const isExpanded = expandedField === field.id;
                const isDragging = dragIdx === idx;
                const isDragOver = dragOverIdx === idx;
                return (
                  <motion.div key={field.id} layout
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                    onDrop={() => { if (dragIdx !== null && dragIdx !== idx) moveField(dragIdx, idx); setDragIdx(null); setDragOverIdx(null); }}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    className={`bg-white rounded-xl border transition-all ${
                      isDragging ? 'opacity-50 border-court-300' :
                      isDragOver ? 'border-court-400 shadow-md' :
                      isExpanded ? 'border-court-200 shadow-sm' : 'border-dark-100 hover:border-dark-200'}`}>
                    {/* Field header */}
                    <div className="flex items-center gap-2 px-4 py-3 cursor-pointer" onClick={() => setExpandedField(isExpanded ? null : field.id)}>
                      <div className="cursor-grab text-dark-300 hover:text-dark-500" onMouseDown={e => e.stopPropagation()}>
                        <GripVertical size={14} />
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-dark-50 flex items-center justify-center text-dark-400 shrink-0">{fieldIcon(field.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark-800 truncate">{field.label}</p>
                        <p className="text-[10px] text-dark-400">{fieldLabel(field.type)}{field.required ? ' · Required' : ''}</p>
                      </div>
                      {field.values?.some(v => v.flagged) && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-500 rounded text-[9px] font-bold flex items-center gap-0.5"><Flag size={8} /> Flags</span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                        className="p-1 rounded hover:bg-red-50 text-dark-300 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
                      {isExpanded ? <ChevronUp size={14} className="text-dark-400" /> : <ChevronDown size={14} className="text-dark-400" />}
                    </div>

                    {/* Expanded editor */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <div className="px-4 pb-4 pt-1 border-t border-dark-100 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Label *</label>
                                <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })}
                                  className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Field Name</label>
                                <input value={field.name} onChange={e => updateField(field.id, { name: e.target.value })}
                                  className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                              </div>
                            </div>

                            {field.type !== 'header' && (
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })}
                                    className="w-4 h-4 rounded border-dark-300 text-court-500 focus:ring-court-500/20" />
                                  <span className="text-xs font-semibold text-dark-700">Required</span>
                                </label>
                              </div>
                            )}

                            {(field.type === 'text' || field.type === 'textarea') && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Placeholder</label>
                                <input value={field.placeholder || ''} onChange={e => updateField(field.id, { placeholder: e.target.value })}
                                  className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                              </div>
                            )}

                            {field.type === 'number' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Min</label>
                                  <input type="number" value={field.min ?? ''} onChange={e => updateField(field.id, { min: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Max</label>
                                  <input type="number" value={field.max ?? ''} onChange={e => updateField(field.id, { max: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                                </div>
                              </div>
                            )}

                            {/* Options editor for select/radio/checkbox */}
                            {hasOptions(field.type) && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Options</label>
                                  <span className="text-[9px] text-dark-400"><Flag size={8} className="inline text-red-400" /> = Flagged response</span>
                                </div>
                                {field.values?.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <GripVertical size={12} className="text-dark-300 shrink-0" />
                                    <input value={opt.label} onChange={e => updateOption(field.id, optIdx, { label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                      className="flex-1 h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                                    <button onClick={() => toggleFlag(field.id, optIdx)}
                                      title={opt.flagged ? 'Remove flag' : 'Flag this response'}
                                      className={`p-1.5 rounded-lg transition-all ${opt.flagged ? 'bg-red-50 text-red-500 ring-1 ring-red-200' : 'text-dark-300 hover:bg-dark-50 hover:text-dark-500'}`}>
                                      <Flag size={12} />
                                    </button>
                                    <button onClick={() => removeOption(field.id, optIdx)}
                                      className="p-1 rounded hover:bg-red-50 text-dark-300 hover:text-red-500"><X size={12} /></button>
                                  </div>
                                ))}
                                <button onClick={() => addOption(field.id)}
                                  className="w-full h-8 rounded-lg border border-dashed border-dark-200 text-xs font-semibold text-dark-400 hover:text-dark-600 hover:border-dark-300 flex items-center justify-center gap-1 transition-all">
                                  <Plus size={12} /> Add Option
                                </button>
                                {field.values?.some(v => v.flagged) && (
                                  <div className="flex items-start gap-2 p-2.5 bg-red-50/50 rounded-lg border border-red-100">
                                    <AlertTriangle size={12} className="text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-red-600">
                                      <strong>{field.values.filter(v => v.flagged).length}</strong> flagged option{field.values.filter(v => v.flagged).length > 1 ? 's' : ''}: Submissions selecting {field.values.filter(v => v.flagged).map(v => `"${v.label}"`).join(', ')} will be flagged for review.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
