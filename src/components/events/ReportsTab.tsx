import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText, Plus, ArrowLeft, Pencil, Trash2, Globe,
  EyeOff, Eye, UserCog, Users, ChevronRight, Shield, Check,
} from 'lucide-react';
import { EventReport, ReportStatus, ReportVisibility, ReportSection } from '@/data/events';
import { reportTypes, ReportTypeConfig, ReportFieldDef } from '@/data/settings';
import RichTextEditor from './RichTextEditor';
import { format, parseISO } from 'date-fns';

interface Props {
  reports: EventReport[];
}

interface EditDraft {
  id: string | null;
  typeId: string;
  status: ReportStatus;
  visibility: ReportVisibility[];
  fieldValues: Record<string, string>;
  sections: ReportSection[];
}

// ── Constants ────────────────────────────────────────────

const visibilityConfig: Record<ReportVisibility, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  coaches_only: { label: 'Coaches Only', icon: <UserCog size={11} />, bg: 'bg-amber-50',  text: 'text-amber-700' },
  all_staff:    { label: 'All Staff',    icon: <Users size={11} />,   bg: 'bg-dark-100',  text: 'text-dark-600' },
  players:      { label: 'Players',      icon: <Eye size={11} />,     bg: 'bg-court-50',  text: 'text-court-700' },
  guardians:    { label: 'Guardians',    icon: <Shield size={11} />,  bg: 'bg-purple-50', text: 'text-purple-700' },
};

const reportStatusConfig: Record<ReportStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft:     { label: 'Draft',     bg: 'bg-dark-100', text: 'text-dark-600', dot: 'bg-dark-400' },
  published: { label: 'Published', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};

// ── Helpers ──────────────────────────────────────────────

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function getTypeConfig(typeId: string): ReportTypeConfig | undefined {
  return reportTypes.find(rt => rt.id === typeId);
}

function buildSectionsFromType(typeId: string): ReportSection[] {
  const rt = getTypeConfig(typeId);
  return (rt?.defaultSections ?? ['Overview']).map((title, i) => ({
    id: `rs-new-${i}`,
    title,
    content: '',
  }));
}

function buildEmptyFieldValues(typeId: string): Record<string, string> {
  const rt = getTypeConfig(typeId);
  return Object.fromEntries((rt?.fields ?? []).map(f => [f.id, '']));
}

function reportToEditDraft(r: EventReport): EditDraft {
  return {
    id: r.id,
    typeId: r.typeId,
    status: r.status,
    visibility: r.visibility,
    fieldValues: { ...r.fieldValues },
    sections: r.sections.map(s => ({ ...s })),
  };
}

function buildNewDraft(typeId: string): EditDraft {
  return {
    id: null,
    typeId,
    status: 'draft',
    visibility: ['coaches_only'],
    fieldValues: buildEmptyFieldValues(typeId),
    sections: buildSectionsFromType(typeId),
  };
}

// ── Component ────────────────────────────────────────────

export default function ReportsTab({ reports: initialReports }: Props) {
  const [reports, setReports] = useState<EventReport[]>(initialReports);
  const [view, setView] = useState<'list' | 'detail' | 'edit'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedReport = reports.find(r => r.id === selectedId) ?? null;

  // Types already used by existing reports (used to enforce one-per-type)
  const usedTypeIds = reports.map(r => r.typeId);
  // Types available for a new report (not yet used in this event)
  const availableForNew = reportTypes.filter(rt => !usedTypeIds.includes(rt.id));
  const allTypesUsed = availableForNew.length === 0;

  // ── Handlers ──────────────────────────────────────────

  function handleNewReport() {
    if (allTypesUsed) return;
    setEditDraft(buildNewDraft(availableForNew[0].id));
    setSelectedId(null);
    setView('edit');
  }

  function handleOpenDetail(report: EventReport) {
    setSelectedId(report.id);
    setActiveSectionIdx(0);
    setShowDeleteConfirm(false);
    setView('detail');
  }

  function handleEdit(report: EventReport) {
    setEditDraft(reportToEditDraft(report));
    setView('edit');
  }

  function handleSave() {
    if (!editDraft) return;
    const now = new Date().toISOString();
    if (editDraft.id === null) {
      const newReport: EventReport = {
        id: newId('rep'),
        title: getTypeConfig(editDraft.typeId)?.name ?? 'Report',
        typeId: editDraft.typeId,
        status: editDraft.status,
        visibility: editDraft.visibility,
        author: { id: 'u-002', name: 'James Carter', avatar: 'JC' },
        createdAt: now,
        updatedAt: now,
        fieldValues: editDraft.fieldValues,
        sections: editDraft.sections,
      };
      setReports(prev => [...prev, newReport]);
      setSelectedId(newReport.id);
    } else {
      setReports(prev => prev.map(r =>
        r.id === editDraft.id
          ? { ...r, title: getTypeConfig(editDraft.typeId)?.name ?? r.title, typeId: editDraft.typeId, status: editDraft.status, visibility: editDraft.visibility, fieldValues: editDraft.fieldValues, sections: editDraft.sections, updatedAt: now }
          : r
      ));
    }
    setActiveSectionIdx(0);
    setEditDraft(null);
    setView('detail');
  }

  function handleCancel() {
    setEditDraft(null);
    setView(selectedId ? 'detail' : 'list');
  }

  function handleTogglePublish(id: string) {
    setReports(prev => prev.map(r =>
      r.id === id
        ? { ...r, status: r.status === 'published' ? 'draft' : 'published', updatedAt: new Date().toISOString() }
        : r
    ));
  }

  function handleDelete(id: string) {
    setReports(prev => prev.filter(r => r.id !== id));
    setShowDeleteConfirm(false);
    setSelectedId(null);
    setView('list');
  }

  function handleTypeChange(newTypeId: string) {
    if (!editDraft) return;
    // Treat TipTap's empty output (<p></p>) as empty by stripping all tags
    const allEmpty = editDraft.sections.every(s =>
      s.content.replace(/<[^>]*>/g, '').trim() === ''
    );
    setEditDraft(prev => prev ? {
      ...prev,
      typeId: newTypeId,
      fieldValues: buildEmptyFieldValues(newTypeId),
      sections: allEmpty ? buildSectionsFromType(newTypeId) : prev.sections,
    } : null);
  }

  function handleFieldValueChange(fieldId: string, value: string) {
    setEditDraft(prev => prev ? { ...prev, fieldValues: { ...prev.fieldValues, [fieldId]: value } } : null);
  }

  function handleVisibilityToggle(v: ReportVisibility) {
    setEditDraft(prev => {
      if (!prev) return null;
      const current = prev.visibility;
      if (current.includes(v)) {
        if (current.length <= 1) return prev; // must keep at least one
        return { ...prev, visibility: current.filter(x => x !== v) };
      }
      return { ...prev, visibility: [...current, v] };
    });
  }

  function handleAddSection() {
    setEditDraft(prev => prev ? {
      ...prev,
      sections: [...prev.sections, { id: newId('rs'), title: 'New Section', content: '' }],
    } : null);
  }

  function handleRemoveSection(idx: number) {
    setEditDraft(prev => {
      if (!prev || prev.sections.length <= 1) return prev;
      return { ...prev, sections: prev.sections.filter((_, i) => i !== idx) };
    });
  }

  function handleSectionChange(idx: number, field: 'title' | 'content', value: string) {
    setEditDraft(prev => {
      if (!prev) return null;
      return { ...prev, sections: prev.sections.map((s, i) => i === idx ? { ...s, [field]: value } : s) };
    });
  }

  // ── Sub-renders ───────────────────────────────────────

  function renderListView() {
    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-dark-900">Reports</h3>
          <button
            onClick={handleNewReport}
            disabled={allTypesUsed}
            title={allTypesUsed ? 'All report types have been created for this event' : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-court-500 text-white text-xs font-semibold hover:bg-court-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            New Report
          </button>
        </div>

        {reports.length === 0 ? renderEmptyState() : (
          <div className="space-y-3">
            {reports.map(report => renderReportCard(report))}
            {allTypesUsed && (
              <p className="text-center text-xs text-dark-400 pt-1">
                All report types have been added for this event.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-dark-50 flex items-center justify-center mb-3">
          <ScrollText size={24} className="text-dark-300" />
        </div>
        <p className="text-sm font-semibold text-dark-700">No reports yet</p>
        <p className="text-xs text-dark-400 mt-1">Create the first report for this event</p>
        <button
          onClick={handleNewReport}
          className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-court-500 text-white text-xs font-semibold hover:bg-court-600 transition-colors"
        >
          <Plus size={13} />
          Create Report
        </button>
      </div>
    );
  }

  function renderReportCard(report: EventReport) {
    const rt = getTypeConfig(report.typeId);
    const sCfg = reportStatusConfig[report.status];

    return (
      <div
        key={report.id}
        onClick={() => handleOpenDetail(report)}
        className="bg-white border border-dark-100 rounded-2xl overflow-hidden hover:border-dark-200 hover:shadow-sm cursor-pointer transition-all group flex"
      >
        {/* Left color accent */}
        {rt && (
          <div className="w-1 shrink-0 rounded-l-2xl" style={{ backgroundColor: rt.color }} />
        )}

        <div className="flex-1 p-4 min-w-0">
          {/* Type name as title */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {rt && (
                <p className="text-base font-extrabold text-dark-900 leading-tight group-hover:text-dark-700 transition-colors">
                  {rt.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${sCfg.bg} ${sCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
                {sCfg.label}
              </span>
              <ChevronRight size={13} className="text-dark-300 group-hover:text-dark-500 transition-colors" />
            </div>
          </div>

          {/* Author + date */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-white">{report.author.avatar}</span>
            </div>
            <span className="text-xs text-dark-400">
              {report.author.name}
              <span className="mx-1 text-dark-200">·</span>
              {format(parseISO(report.createdAt), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {report.visibility.map(v => {
              const vCfg = visibilityConfig[v];
              return (
                <span key={v} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium ${vCfg.bg} ${vCfg.text}`}>
                  {vCfg.icon}
                  {vCfg.label}
                </span>
              );
            })}
            {rt?.availableToGuardians && report.status === 'published' && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700">
                <Shield size={11} />
                Guardians
              </span>
            )}
            <span className="text-[11px] text-dark-300 ml-auto">
              {report.sections.length} section{report.sections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    );
  }

  function renderDetailView(report: EventReport) {
    const rt = getTypeConfig(report.typeId);
    const sCfg = reportStatusConfig[report.status];
    const activeSection = report.sections[activeSectionIdx] ?? report.sections[0];

    return (
      <div>
        {/* Back + actions */}
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-1.5 text-xs font-semibold text-dark-500 hover:text-dark-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Reports
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleEdit(report)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dark-200 text-xs font-semibold text-dark-600 hover:border-dark-300 hover:text-dark-900 transition-colors"
            >
              <Pencil size={12} />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg border border-dark-200 text-dark-400 hover:border-red-200 hover:text-red-500 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm font-semibold text-red-800 mb-1">Delete this report?</p>
            <p className="text-xs text-red-600 mb-3">This cannot be undone. The report type will become available again.</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(report.id)}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-dark-200 text-dark-600 text-xs font-semibold hover:border-dark-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Type name as title + status */}
        <div className="flex items-center gap-3 mt-1">
          {rt && (
            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: rt.color }} />
          )}
          <div className="flex-1 min-w-0">
            {rt && (
              <p className="text-lg font-extrabold text-dark-900 leading-tight">{rt.name}</p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${sCfg.bg} ${sCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
            {sCfg.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">{report.author.avatar}</span>
          </div>
          <span className="text-xs text-dark-500 flex items-center gap-1.5 flex-wrap">
            {report.author.name}
            <span className="text-dark-300">·</span>
            {format(parseISO(report.createdAt), 'MMM d, yyyy')}
            <span className="text-dark-300">·</span>
            {report.visibility.map(v => {
              const vCfg = visibilityConfig[v];
              return (
                <span key={v} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium ${vCfg.bg} ${vCfg.text}`}>
                  {vCfg.icon}
                  {vCfg.label}
                </span>
              );
            })}
            {rt?.availableToGuardians && report.status === 'published' && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700">
                <Shield size={11} />
                Guardians
              </span>
            )}
            {rt?.availableToGuardians && report.status === 'draft' && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-dark-100 text-dark-400" title="Guardians can view this once published">
                <Shield size={11} />
                Guardians (on publish)
              </span>
            )}
          </span>
        </div>

        {/* Publish / Unpublish toggle */}
        <div className="mt-3">
          {report.status === 'draft' ? (
            <button
              onClick={() => handleTogglePublish(report.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-court-500 text-white text-xs font-semibold hover:bg-court-600 transition-colors"
            >
              <Globe size={13} />
              Publish Report
            </button>
          ) : (
            <button
              onClick={() => handleTogglePublish(report.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dark-200 text-dark-600 text-xs font-semibold hover:border-dark-300 hover:text-dark-900 transition-colors"
            >
              <EyeOff size={13} />
              Unpublish
            </button>
          )}
        </div>

        {/* Field values */}
        {(() => {
          const fields = rt?.fields ?? [];
          const filled = fields.filter(f => report.fieldValues?.[f.id]);
          if (filled.length === 0) return null;
          return (
            <div className="mt-4 rounded-2xl border border-dark-100 bg-dark-50/40 p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {filled.map(field => (
                  <div key={field.id} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-0.5">{field.label}</p>
                    <p className="text-sm font-semibold text-dark-800">
                      {field.type === 'date' && report.fieldValues[field.id]
                        ? format(new Date(report.fieldValues[field.id]), 'MMM d, yyyy')
                        : report.fieldValues[field.id]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Section tabs */}
        {report.sections.length > 0 && (
          <>
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide border-b border-dark-100 mt-5 -mx-5 px-5">
              {report.sections.map((section, idx) => {
                const isActive = idx === activeSectionIdx;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionIdx(idx)}
                    className={`relative flex items-center px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors shrink-0
                      ${isActive ? 'text-court-600' : 'text-dark-400 hover:text-dark-700'}`}
                  >
                    {section.title}
                    {isActive && (
                      <motion.div
                        layoutId="report-section-tab-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-court-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSectionIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
                className="mt-4"
              >
                {activeSection?.content ? (
                  /<[a-z][\s\S]*>/i.test(activeSection.content) ? (
                    <div
                      className={[
                        'text-sm text-dark-700 leading-relaxed',
                        '[&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-dark-900 [&_h2]:mt-3 [&_h2]:mb-1',
                        '[&_strong]:font-semibold [&_strong]:text-dark-900',
                        '[&_em]:italic [&_u]:underline [&_s]:line-through [&_s]:text-dark-400',
                        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5 [&_ul]:my-1',
                        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-0.5 [&_ol]:my-1',
                        '[&_li]:text-dark-700',
                        '[&_p]:mb-1.5 [&_p:last-child]:mb-0',
                        '[&_hr]:border-dark-100 [&_hr]:my-2',
                      ].join(' ')}
                      dangerouslySetInnerHTML={{ __html: activeSection.content }}
                    />
                  ) : (
                    <p className="text-sm text-dark-700 leading-relaxed whitespace-pre-wrap">
                      {activeSection.content}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-dark-400 italic">No content in this section yet.</p>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    );
  }

  function renderEditView(draft: EditDraft) {
    // When editing, this report's own type is available; for new reports, only unused types
    const availableTypes = draft.id === null
      ? availableForNew
      : reportTypes.filter(rt => rt.id === draft.typeId || !usedTypeIds.includes(rt.id) || reports.find(r => r.id === draft.id)?.typeId === rt.id);

    return (
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-court-50 flex items-center justify-center shrink-0">
            <ScrollText size={16} className="text-court-500" />
          </div>
          <h3 className="text-sm font-bold text-dark-900">
            {draft.id === null ? 'New Report' : 'Edit Report'}
          </h3>
        </div>

        {/* Type + Status row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-1.5">Type</label>
            <select
              value={draft.typeId}
              onChange={e => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-dark-200 text-xs font-semibold text-dark-700 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
            >
              {availableTypes.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={draft.status}
              onChange={e => setEditDraft(prev => prev ? { ...prev, status: e.target.value as ReportStatus } : null)}
              className="w-full px-3 py-2 rounded-xl border border-dark-200 text-xs font-semibold text-dark-700 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Visibility multi-select */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-2">Visibility</label>
          <div className="flex flex-wrap gap-2">
            {(['coaches_only', 'all_staff', 'players'] as ReportVisibility[]).map(v => {
              const cfg = visibilityConfig[v];
              const isSelected = draft.visibility.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleVisibilityToggle(v)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors
                    ${isSelected
                      ? `${cfg.bg} ${cfg.text} border-transparent`
                      : 'bg-white text-dark-400 border-dark-200 hover:border-dark-300 hover:text-dark-600'
                    }`}
                >
                  {cfg.icon}
                  {cfg.label}
                  {isSelected && <Check size={11} />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-dark-400 mt-1.5">
            Select staff audiences that can view this report.
            {getTypeConfig(draft.typeId)?.availableToGuardians && (
              <> <span className="inline-flex items-center gap-0.5 text-purple-600 font-medium">
                <Shield size={10} /> Guardian access is set by the report type.
              </span></>
            )}
          </p>
        </div>

        {/* Fields */}
        {(() => {
          const rt = getTypeConfig(draft.typeId);
          if (!rt || rt.fields.length === 0) return null;
          return (
            <div key={`fields-${draft.typeId}`} className="mb-6 rounded-2xl border border-dark-100 bg-dark-50/40 p-4 space-y-3">
              <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider">Report Fields</p>
              <div className="grid grid-cols-2 gap-3">
                {rt.fields.map(field => (
                  <div key={field.id} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-dark-600 mb-1">
                      {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={draft.fieldValues[field.id] ?? ''}
                        onChange={e => handleFieldValueChange(field.id, e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm text-dark-700 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={draft.fieldValues[field.id] ?? ''}
                        onChange={e => handleFieldValueChange(field.id, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-dark-200 text-sm text-dark-700 resize-none focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={draft.fieldValues[field.id] ?? ''}
                        onChange={e => handleFieldValueChange(field.id, e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Sections */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-3">Sections</label>
          <div className="space-y-4">
            {draft.sections.map((section, idx) => (
              <div key={section.id} className="rounded-2xl border border-dark-100 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={section.title}
                    onChange={e => handleSectionChange(idx, 'title', e.target.value)}
                    className="flex-1 text-[11px] font-bold uppercase tracking-wider text-dark-500 bg-transparent border-b border-dark-100 focus:border-court-400 focus:outline-none pb-1 transition-colors"
                    placeholder="Section title"
                  />
                  {draft.sections.length > 1 && (
                    <button
                      onClick={() => handleRemoveSection(idx)}
                      className="p-1 rounded-lg text-dark-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <RichTextEditor
                  content={section.content}
                  onChange={html => handleSectionChange(idx, 'content', html)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleAddSection}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-court-500 hover:text-court-600 transition-colors"
          >
            <Plus size={14} />
            Add Section
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-dark-100 mt-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl border border-dark-200 text-dark-600 text-xs font-semibold hover:border-dark-300 hover:text-dark-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-court-500 text-white text-xs font-semibold hover:bg-court-600 transition-colors"
          >
            Save Report
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
      >
        {view === 'list' && renderListView()}
        {view === 'detail' && selectedReport && renderDetailView(selectedReport)}
        {view === 'edit' && editDraft && renderEditView(editDraft)}
      </motion.div>
    </AnimatePresence>
  );
}
