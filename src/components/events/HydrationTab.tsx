import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Save, CheckCircle2, Bell, BellRing, TrendingDown, Scale, ArrowRight, LayoutGrid, List, Pencil, X } from 'lucide-react';
import { HydrationRecord, AttendanceRecord } from '@/data/events';
import { eventResourcePreferences, WeightUnit } from '@/data/settings';

interface Props {
  records: HydrationRecord[];
  attendance: AttendanceRecord[];
}

interface WeightEntry { pre: string; post: string; }
interface PlayerActionState { saved: boolean; informed: boolean; }
interface ConfirmPopup { userId: string; name: string; type: 'save' | 'notify'; }

function toKg(v: number, unit: WeightUnit) { return unit === 'lbs' ? v * 0.453592 : v; }
function calcFluidL(preKg: number, postKg: number) { return (preKg - postKg) * 1.5; }

function StatTooltip({ names, value, label, color, bg, border }: {
  names: string[]; value: number; label: string;
  color: string; bg: string; border: string;
}) {
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const hasNames = names.length > 0;

  // Clamp tooltip so it never leaves the viewport, and offset the arrow to still point at the card
  const TOOLTIP_W = 170;
  const MARGIN = 8;
  const idealX = cardRect ? cardRect.left + cardRect.width / 2 : 0;
  const clampedX = cardRect
    ? Math.max(MARGIN + TOOLTIP_W / 2, Math.min(idealX, window.innerWidth - MARGIN - TOOLTIP_W / 2)) - 30
    : 0;
  const arrowShift = idealX - clampedX; // shift arrow back to point at the card

  return (
    <div
      className={`relative rounded-xl border ${bg} ${border} px-3 py-2.5 text-center ${hasNames ? 'cursor-default' : ''}`}
      onMouseEnter={e => {
        if (!hasNames) return;
        setCardRect((e.currentTarget as HTMLElement).getBoundingClientRect());
      }}
      onMouseLeave={() => setCardRect(null)}
    >
      <p className={`text-lg font-extrabold leading-none ${color}`}>{value}</p>
      <p className="text-[10px] font-semibold text-dark-400 mt-1 uppercase tracking-wide">{label}</p>
      <AnimatePresence>
        {cardRect && hasNames && (
          <motion.div
            className="fixed z-[9999] bg-dark-900 rounded-xl shadow-xl py-2.5 px-3 pointer-events-none"
            style={{
              left: clampedX,
              top: cardRect.top - 6,
              transform: 'translate(-50%, -100%)',
              minWidth: TOOLTIP_W,
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
          >
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-2">{label}</p>
            <div className="space-y-1.5">
              {names.map(name => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-dark-500 shrink-0" />
                  <span className="text-xs font-medium text-white whitespace-nowrap">{name}</span>
                </div>
              ))}
            </div>
            {/* Arrow — shifted to point at the original card center */}
            <div
              className="absolute top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-dark-900"
              style={{ left: `calc(50% + ${arrowShift}px)`, transform: 'translateX(-50%)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HydrationTab({ records, attendance }: Props) {
  const [enabled, setEnabled] = useState(records.length > 0);
  const [unit, setUnit] = useState<WeightUnit>(eventResourcePreferences.weightUnit);
  const [view, setView] = useState<'card' | 'compact'>('compact');

  const players = useMemo(() => {
    const ap = attendance.filter(a => a.role === 'player');
    const list = ap.length > 0
      ? ap.map(a => ({ userId: a.userId, name: a.name, avatar: a.avatar }))
      : records.map(r => ({ userId: r.userId, name: r.name, avatar: r.avatar }));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [attendance, records]);

  const [weights, setWeights] = useState<Record<string, WeightEntry>>(() => {
    const m: Record<string, WeightEntry> = {};
    records.forEach(r => {
      m[r.userId] = { pre: r.preWeight != null ? String(r.preWeight) : '', post: r.postWeight != null ? String(r.postWeight) : '' };
    });
    return m;
  });

  const [actions, setActions] = useState<Record<string, PlayerActionState>>(() => {
    const m: Record<string, PlayerActionState> = {};
    records.forEach(r => { if (r.preWeight != null && r.postWeight != null) m[r.userId] = { saved: true, informed: false }; });
    return m;
  });

  // The last committed weight values — used to revert on edit cancel
  const [savedWeights, setSavedWeights] = useState<Record<string, WeightEntry>>(() => {
    const m: Record<string, WeightEntry> = {};
    records.forEach(r => {
      if (r.preWeight != null || r.postWeight != null)
        m[r.userId] = { pre: r.preWeight != null ? String(r.preWeight) : '', post: r.postWeight != null ? String(r.postWeight) : '' };
    });
    return m;
  });

  // Which players are currently in edit mode
  const [editingIds, setEditingIds] = useState<Record<string, boolean>>({});

  // Confirmation popup for edits to already-saved rows
  const [confirmPopup, setConfirmPopup] = useState<ConfirmPopup | null>(null);

  const isEditing = (userId: string) => editingIds[userId] === true;
  const isLocked = (userId: string) => {
    const act = actions[userId] ?? { saved: false, informed: false };
    return (act.saved || act.informed) && !isEditing(userId);
  };

  const setWeight = (userId: string, field: 'pre' | 'post', value: string) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
    setWeights(prev => ({ ...prev, [userId]: { ...(prev[userId] ?? { pre: '', post: '' }), [field]: value } }));
  };

  const clearPost = (userId: string) => {
    setWeights(prev => ({ ...prev, [userId]: { ...(prev[userId] ?? { pre: '', post: '' }), post: '' } }));
  };

  const startEdit = (userId: string) =>
    setEditingIds(prev => ({ ...prev, [userId]: true }));

  const cancelEdit = (userId: string) => {
    setWeights(prev => ({ ...prev, [userId]: savedWeights[userId] ?? { pre: '', post: '' } }));
    setEditingIds(prev => ({ ...prev, [userId]: false }));
  };

  const commitSave = (userId: string) => {
    setSavedWeights(prev => ({ ...prev, [userId]: weights[userId] }));
    setActions(prev => ({ ...prev, [userId]: { ...(prev[userId] ?? { saved: false, informed: false }), saved: true } }));
    setEditingIds(prev => ({ ...prev, [userId]: false }));
  };

  const commitInform = (userId: string) => {
    setSavedWeights(prev => ({ ...prev, [userId]: weights[userId] }));
    setActions(prev => ({ ...prev, [userId]: { ...(prev[userId] ?? { saved: false, informed: false }), saved: true, informed: true } }));
    setEditingIds(prev => ({ ...prev, [userId]: false }));
  };

  // Called when Save/Notify is clicked — shows confirmation if editing, commits directly otherwise
  const handleSaveClick = (userId: string, name: string) => {
    if (isEditing(userId)) {
      setConfirmPopup({ userId, name, type: 'save' });
    } else {
      commitSave(userId);
    }
  };

  const handleInformClick = (userId: string, name: string) => {
    if (isEditing(userId)) {
      setConfirmPopup({ userId, name, type: 'notify' });
    } else {
      commitInform(userId);
    }
  };

  const handleConfirm = () => {
    if (!confirmPopup) return;
    if (confirmPopup.type === 'save') commitSave(confirmPopup.userId);
    else commitInform(confirmPopup.userId);
    setConfirmPopup(null);
  };

  const handleCancelConfirm = () => {
    if (!confirmPopup) return;
    cancelEdit(confirmPopup.userId);
    setConfirmPopup(null);
  };

  // Summary stats with name lists for tooltips
  const stats = useMemo(() => {
    const savedNames: string[] = [], highLossNames: string[] = [], notifiedNames: string[] = [];
    players.forEach(p => {
      const act = actions[p.userId];
      const w = weights[p.userId];
      if (act?.saved) savedNames.push(p.name);
      if (act?.informed) notifiedNames.push(p.name);
      if (act?.saved && w) {
        const pre = parseFloat(w.pre), post = parseFloat(w.post);
        if (!isNaN(pre) && !isNaN(post) && pre > 0 && post > 0 && (pre - post) / pre * 100 > 2)
          highLossNames.push(p.name);
      }
    });
    return {
      savedNames: savedNames.sort(),
      highLossNames: highLossNames.sort(),
      notifiedNames: notifiedNames.sort(),
    };
  }, [players, actions, weights]);

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-50/60 rounded-2xl border border-dark-100">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: enabled ? 'linear-gradient(135deg,#00B8D920,#00B8D940)' : '#f1f3f4' }}
          >
            <Droplets size={18} className={enabled ? 'text-blue-500' : 'text-dark-300'} />
          </div>
          <div>
            <p className="text-sm font-bold text-dark-800">Hydration Tracking</p>
            <p className="text-[11px] text-dark-400">Pre/post weight · fluid replacement</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {enabled && (
            <>
              {/* Unit toggle */}
              <div className="flex items-center gap-0.5 bg-dark-100 rounded-lg p-0.5">
                {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                      unit === u ? 'bg-white text-dark-800 shadow-sm' : 'text-dark-400 hover:text-dark-600'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              {/* View toggle */}
              <div className="flex items-center gap-0.5 bg-dark-100 rounded-lg p-0.5">
                <button
                  onClick={() => setView('card')}
                  title="Card view"
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                    view === 'card' ? 'bg-white text-dark-700 shadow-sm' : 'text-dark-400 hover:text-dark-600'
                  }`}
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => setView('compact')}
                  title="Compact view"
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                    view === 'compact' ? 'bg-white text-dark-700 shadow-sm' : 'text-dark-400 hover:text-dark-600'
                  }`}
                >
                  <List size={13} />
                </button>
              </div>
            </>
          )}
          <button onClick={() => setEnabled(e => !e)} className="relative shrink-0">
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-court-500' : 'bg-dark-200'}`}>
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                animate={{ left: enabled ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Disabled empty state */}
      {!enabled && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dark-50 flex items-center justify-center mx-auto mb-4">
            <Droplets size={28} className="text-dark-200" />
          </div>
          <p className="text-sm font-semibold text-dark-500 mb-1">Hydration Tracking Disabled</p>
          <p className="text-xs text-dark-400 max-w-xs mx-auto">
            Enable to record pre/post weight and calculate recommended fluid replacement.
          </p>
        </motion.div>
      )}

      {/* No players */}
      {enabled && players.length === 0 && (
        <div className="text-center py-12">
          <Droplets size={24} className="text-dark-300 mx-auto mb-3" />
          <p className="text-sm text-dark-400">No players found for this event</p>
        </div>
      )}

      {/* Content */}
      {enabled && players.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2">
            {/* Total — no tooltip */}
            <div className="rounded-xl border bg-dark-50 border-dark-100 px-3 py-2.5 text-center">
              <p className="text-lg font-extrabold leading-none text-dark-700">{players.length}</p>
              <p className="text-[10px] font-semibold text-dark-400 mt-1 uppercase tracking-wide">Total</p>
            </div>
            <StatTooltip names={stats.savedNames}   value={stats.savedNames.length}   label="Saved"     color="text-court-700" bg="bg-court-50" border="border-court-100" />
            <StatTooltip names={stats.highLossNames} value={stats.highLossNames.length} label="High Loss" color="text-red-600"   bg="bg-red-50"   border="border-red-100" />
            <StatTooltip names={stats.notifiedNames} value={stats.notifiedNames.length} label="Notified"  color="text-amber-700" bg="bg-amber-50"  border="border-amber-100" />
          </div>

          {/* ── Compact view ── */}
          {view === 'compact' && (
            <div className="rounded-xl border border-dark-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-dark-50/70 border-b border-dark-100">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Player</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Pre</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Post</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Loss</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Fluid</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">%</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {players.map(player => {
                    const w = weights[player.userId] ?? { pre: '', post: '' };
                    const act = actions[player.userId] ?? { saved: false, informed: false };
                    const editing = isEditing(player.userId);
                    const locked = isLocked(player.userId);
                    const preNum = parseFloat(w.pre), postNum = parseFloat(w.post);
                    const hasPreValid = w.pre !== '' && !isNaN(preNum) && preNum > 0;
                    const hasPostEntered = hasPreValid && w.post !== '' && !isNaN(postNum) && postNum > 0;
                    const hasPostValid = hasPostEntered && postNum < preNum;
                    const canSaveData = hasPostEntered && postNum < preNum;
                    const loss = hasPostValid ? preNum - postNum : null;
                    const lossPct = hasPostValid && loss !== null ? (loss / preNum * 100) : null;
                    const fluidL = hasPostValid ? calcFluidL(toKg(preNum, unit), toKg(postNum, unit)) : null;
                    const isHighLoss = lossPct !== null && lossPct > 2;
                    // In edit mode, re-enable buttons per existing logic
                    const canSave = editing ? hasPostEntered : hasPostEntered && !act.saved && !act.informed;
                    const canInform = editing ? canSaveData : canSaveData && !act.informed;

                    return (
                      <tr key={player.userId} className={`hover:bg-dark-50/40 transition-colors group ${editing ? 'bg-amber-50/30' : ''}`}>
                        {/* Player */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-white">{player.avatar}</span>
                            </div>
                            <span className="text-xs font-semibold text-dark-800 truncate max-w-[110px]">{player.name}</span>
                            {editing && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">editing</span>}
                          </div>
                        </td>

                        {/* Pre input */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            {locked ? (
                              <span className="w-14 text-right text-xs font-bold text-dark-700 py-0.5 border-b border-transparent inline-block">{w.pre || '—'}</span>
                            ) : (
                              <input
                                type="text" inputMode="decimal" value={w.pre}
                                onChange={e => { if (!editing && w.post !== '') clearPost(player.userId); setWeight(player.userId, 'pre', e.target.value); }}
                                placeholder="—"
                                className="w-14 text-right bg-transparent border-b border-dark-200 focus:border-court-400 focus:outline-none text-xs font-bold text-dark-800 py-0.5 placeholder:text-dark-300 transition-colors"
                              />
                            )}
                            <span className="text-[10px] text-dark-400">{unit}</span>
                          </div>
                        </td>

                        {/* Post input */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            {locked ? (
                              <span className="w-14 text-right text-xs font-bold text-dark-700 py-0.5 border-b border-transparent inline-block">{w.post || '—'}</span>
                            ) : (
                              <input
                                type="text" inputMode="decimal" value={w.post}
                                onChange={e => setWeight(player.userId, 'post', e.target.value)}
                                placeholder="—" disabled={!hasPreValid}
                                className={`w-14 text-right bg-transparent border-b text-xs font-bold py-0.5 transition-colors focus:outline-none placeholder:text-dark-300 ${
                                  hasPreValid ? 'border-dark-200 focus:border-court-400 text-dark-800' : 'border-dark-100 text-dark-300 opacity-40 cursor-not-allowed'
                                }`}
                              />
                            )}
                            <span className={`text-[10px] ${hasPreValid ? 'text-dark-400' : 'text-dark-200'}`}>{unit}</span>
                          </div>
                        </td>

                        {/* Loss */}
                        <td className="px-3 py-2.5 text-right">
                          {loss !== null ? <span className="text-xs font-bold text-orange-600">−{loss.toFixed(1)}</span> : <span className="text-xs text-dark-200">—</span>}
                        </td>

                        {/* Fluid */}
                        <td className="px-3 py-2.5 text-right">
                          {fluidL !== null ? <span className="text-xs font-bold text-blue-600">{fluidL.toFixed(2)} L</span> : <span className="text-xs text-dark-200">—</span>}
                        </td>

                        {/* Loss % */}
                        <td className="px-3 py-2.5 text-center">
                          {lossPct !== null
                            ? <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isHighLoss ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{lossPct.toFixed(1)}%</span>
                            : <span className="text-xs text-dark-200">—</span>}
                        </td>

                        {/* Action buttons */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            {locked ? (
                              /* Locked: show Edit button */
                              <div className="relative group/ed">
                                <button onClick={() => startEdit(player.userId)}
                                  className="w-6 h-6 rounded-md flex items-center justify-center bg-dark-100 text-dark-400 hover:bg-amber-50 hover:text-amber-600 transition-all">
                                  <Pencil size={10} strokeWidth={2} />
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/ed:opacity-100 pointer-events-none transition-opacity z-10">
                                  Edit
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-900" />
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Save */}
                                <div className="relative group/st">
                                  <button onClick={() => canSave && handleSaveClick(player.userId, player.name)} disabled={!canSave && !act.saved}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                      act.saved && !editing ? 'bg-green-50 text-green-600'
                                      : canSave ? 'bg-dark-100 text-dark-400 hover:bg-court-50 hover:text-court-600'
                                      : 'bg-dark-50 text-dark-200 cursor-not-allowed'
                                    }`}>
                                    {act.saved && !editing ? <CheckCircle2 size={11} strokeWidth={2.5} /> : <Save size={11} strokeWidth={2} />}
                                  </button>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/st:opacity-100 pointer-events-none transition-opacity z-10">
                                    {act.saved && !editing ? 'Saved' : canSave ? 'Save' : 'Enter weights'}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-900" />
                                  </div>
                                </div>
                                {/* Notify */}
                                <div className="relative group/nt">
                                  <button onClick={() => canInform && handleInformClick(player.userId, player.name)} disabled={!canInform && !act.informed}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                      act.informed && !editing ? 'bg-amber-50 text-amber-600'
                                      : canInform ? 'bg-dark-100 text-dark-400 hover:bg-amber-50 hover:text-amber-600'
                                      : 'bg-dark-50 text-dark-200 cursor-not-allowed'
                                    }`}>
                                    {act.informed && !editing ? <BellRing size={11} strokeWidth={2.5} /> : <Bell size={11} strokeWidth={2} />}
                                  </button>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/nt:opacity-100 pointer-events-none transition-opacity z-10">
                                    {act.informed && !editing ? 'Notified' : canInform ? 'Notify' : 'Need weight loss'}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-900" />
                                  </div>
                                </div>
                                {/* Cancel edit */}
                                {editing && (
                                  <div className="relative group/cx">
                                    <button onClick={() => cancelEdit(player.userId)}
                                      className="w-6 h-6 rounded-md flex items-center justify-center bg-dark-100 text-dark-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                      <X size={10} strokeWidth={2.5} />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/cx:opacity-100 pointer-events-none transition-opacity z-10">
                                      Cancel edit
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-900" />
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Card view ── */}
          {view === 'card' && (
          <div className="space-y-3">
            {players.map(player => {
              const w = weights[player.userId] ?? { pre: '', post: '' };
              const act = actions[player.userId] ?? { saved: false, informed: false };
              const editing = isEditing(player.userId);
              const locked = isLocked(player.userId);

              const preNum = parseFloat(w.pre);
              const postNum = parseFloat(w.post);
              const hasPreValid = w.pre !== '' && !isNaN(preNum) && preNum > 0;
              const hasPostEntered = hasPreValid && w.post !== '' && !isNaN(postNum) && postNum > 0;
              const hasPostValid = hasPostEntered && postNum < preNum;
              const canSaveData = hasPostEntered && postNum < preNum;

              const loss = hasPostValid ? preNum - postNum : null;
              const lossPct = hasPostValid && loss !== null ? (loss / preNum * 100) : null;
              const fluidL = hasPostValid ? calcFluidL(toKg(preNum, unit), toKg(postNum, unit)) : null;
              const isHighLoss = lossPct !== null && lossPct > 2;

              const canSave = editing ? hasPostEntered : canSaveData && !act.saved;
              const canInform = editing ? canSaveData : act.saved && !act.informed;

              // Left accent color
              const accentColor = act.saved
                ? (isHighLoss ? '#EF4444' : '#00A76F')
                : canSaveData ? '#00A76F'
                : hasPostValid ? '#F97316'
                : hasPreValid ? '#6366F1'
                : '#E5E7EB';

              return (
                <div
                  key={player.userId}
                  className="rounded-2xl border border-dark-100 bg-white overflow-hidden"
                  style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-white">{player.avatar}</span>
                      </div>
                      <span className="text-sm font-bold text-dark-900">{player.name}</span>
                      {editing && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">editing</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {act.saved && !editing && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-bold border border-green-100">
                          <CheckCircle2 size={10} strokeWidth={2.5} /> Saved
                        </span>
                      )}
                      {act.informed && !editing && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100">
                          <BellRing size={10} strokeWidth={2.5} /> Notified
                        </span>
                      )}
                      {locked && (
                        <button onClick={() => startEdit(player.userId)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-dark-50 text-dark-500 hover:bg-amber-50 hover:text-amber-600 rounded-md text-[10px] font-bold border border-dark-200 hover:border-amber-200 transition-all">
                          <Pencil size={9} strokeWidth={2} /> Edit
                        </button>
                      )}
                      {editing && (
                        <button onClick={() => cancelEdit(player.userId)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-dark-50 text-dark-500 hover:bg-red-50 hover:text-red-500 rounded-md text-[10px] font-bold border border-dark-200 hover:border-red-200 transition-all">
                          <X size={9} strokeWidth={2.5} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Weight inputs */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2">
                      {/* Pre weight */}
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Scale size={10} /> Pre Weight
                        </p>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          locked
                            ? 'border-dark-100 bg-dark-50/50'
                            : hasPreValid
                              ? 'border-indigo-200 bg-indigo-50/50 focus-within:border-court-400 focus-within:bg-white focus-within:shadow-sm'
                              : 'border-dark-150 bg-dark-50/60 focus-within:border-court-400 focus-within:bg-white focus-within:shadow-sm'
                        }`}>
                          {locked ? (
                            <span className="flex-1 text-sm font-bold text-dark-700">{w.pre || '—'}</span>
                          ) : (
                            <input type="text" inputMode="decimal" value={w.pre}
                              onChange={e => { if (!editing && w.post !== '') clearPost(player.userId); setWeight(player.userId, 'pre', e.target.value); }}
                              placeholder="0.0"
                              className="flex-1 bg-transparent text-sm font-bold text-dark-900 focus:outline-none placeholder:text-dark-300 min-w-0"
                            />
                          )}
                          <span className="text-xs font-semibold text-dark-400 shrink-0">{unit}</span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="pt-6 shrink-0">
                        <ArrowRight size={14} className="text-dark-300" />
                      </div>

                      {/* Post weight */}
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Scale size={10} /> Post Weight
                        </p>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          locked
                            ? 'border-dark-100 bg-dark-50/50'
                            : !hasPreValid
                              ? 'border-dark-100 bg-dark-50/30 opacity-40 cursor-not-allowed'
                              : canSaveData
                                ? 'border-court-300 bg-court-50/50'
                                : hasPostValid
                                  ? (isHighLoss ? 'border-red-200 bg-red-50/40' : 'border-green-200 bg-green-50/40')
                                  : 'border-dark-150 bg-dark-50/60 focus-within:border-court-400 focus-within:bg-white focus-within:shadow-sm'
                        }`}>
                          {locked ? (
                            <span className="flex-1 text-sm font-bold text-dark-700">{w.post || '—'}</span>
                          ) : (
                            <input type="text" inputMode="decimal" value={w.post}
                              onChange={e => setWeight(player.userId, 'post', e.target.value)}
                              placeholder="0.0" disabled={!hasPreValid}
                              className="flex-1 bg-transparent text-sm font-bold text-dark-900 focus:outline-none placeholder:text-dark-300 min-w-0 disabled:cursor-not-allowed"
                            />
                          )}
                          <span className="text-xs font-semibold text-dark-400 shrink-0">{unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results row — animates in */}
                  <AnimatePresence>
                    {hasPostValid && loss !== null && lossPct !== null && fluidL !== null && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-3"
                      >
                        <div className="flex items-center gap-2 p-3 bg-dark-50/60 rounded-xl border border-dark-100">
                          {/* Loss */}
                          <div className="flex items-center gap-1.5 flex-1">
                            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                              <TrendingDown size={13} className="text-orange-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-dark-400 font-medium leading-none">Weight loss</p>
                              <p className="text-sm font-extrabold text-orange-600 leading-tight mt-0.5">
                                −{loss.toFixed(1)} {unit}
                              </p>
                            </div>
                          </div>

                          <div className="w-px h-8 bg-dark-150 shrink-0" />

                          {/* Fluid */}
                          <div className="flex items-center gap-1.5 flex-1">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                              <Droplets size={13} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-dark-400 font-medium leading-none">Fluid needed</p>
                              <p className="text-sm font-extrabold text-blue-600 leading-tight mt-0.5">
                                {fluidL.toFixed(2)} L
                              </p>
                            </div>
                          </div>

                          <div className="w-px h-8 bg-dark-150 shrink-0" />

                          {/* Loss % */}
                          <div className="flex items-center justify-center flex-1">
                            <span className={`px-3 py-1.5 rounded-xl text-sm font-extrabold ${
                              isHighLoss
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-green-50 text-green-600 border border-green-200'
                            }`}>
                              {lossPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions bar */}
                  <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-dark-100 bg-dark-50/40">
                    {locked ? (
                      /* Locked state — just show Edit button */
                      <button onClick={() => startEdit(player.userId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-dark-50 text-dark-500 hover:bg-amber-50 hover:text-amber-600 border border-dark-200 hover:border-amber-200 transition-all">
                        <Pencil size={11} strokeWidth={2} /> Edit
                      </button>
                    ) : (
                      <>
                        {/* Save */}
                        <button
                          onClick={() => canSave && handleSaveClick(player.userId, player.name)}
                          disabled={!canSave && !(act.saved && !editing)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            act.saved && !editing
                              ? 'bg-green-50 text-green-600 cursor-default border border-green-200'
                              : canSave
                                ? 'bg-court-500 text-white hover:bg-court-600 shadow-sm'
                                : 'bg-dark-100 text-dark-300 cursor-not-allowed'
                          }`}
                        >
                          {act.saved && !editing
                            ? <><CheckCircle2 size={12} strokeWidth={2.5} /> Saved</>
                            : <><Save size={12} strokeWidth={2} /> Save</>
                          }
                        </button>

                        {/* Notify */}
                        <button
                          onClick={() => canInform && handleInformClick(player.userId, player.name)}
                          disabled={!canInform && !(act.informed && !editing)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            act.informed && !editing
                              ? 'bg-amber-50 text-amber-600 cursor-default border border-amber-200'
                              : canInform
                                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                                : 'bg-dark-100 text-dark-300 cursor-not-allowed'
                          }`}
                        >
                          {act.informed && !editing
                            ? <><BellRing size={12} strokeWidth={2.5} /> Notified</>
                            : <><Bell size={12} strokeWidth={2} /> Notify</>
                          }
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Confirmation popup */}
          <AnimatePresence>
            {confirmPopup && (() => {
              const old = savedWeights[confirmPopup.userId] ?? { pre: '', post: '' };
              const curr = weights[confirmPopup.userId] ?? { pre: '', post: '' };
              const preChanged = old.pre !== curr.pre;
              const postChanged = old.post !== curr.post;
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white rounded-2xl shadow-elevated w-full max-w-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                          <Pencil size={15} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-dark-900">Confirm Changes</p>
                          <p className="text-[11px] text-dark-400">{confirmPopup.name}</p>
                        </div>
                      </div>
                      <button onClick={handleCancelConfirm} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400">
                        <X size={15} />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 space-y-3">
                      <p className="text-xs text-dark-500">
                        The following weights will be {confirmPopup.type === 'notify' ? 'saved and the player notified' : 'saved'}:
                      </p>
                      <div className="space-y-2">
                        {(preChanged || (!preChanged && !postChanged)) && (
                          <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${preChanged ? 'bg-amber-50 border border-amber-100' : 'bg-dark-50 border border-dark-100'}`}>
                            <span className="text-xs font-semibold text-dark-600">Pre Weight</span>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              {preChanged ? (
                                <>
                                  <span className="text-dark-400 line-through">{old.pre || '—'}</span>
                                  <ArrowRight size={10} className="text-dark-300" />
                                  <span className="text-dark-900">{curr.pre || '—'} {unit}</span>
                                </>
                              ) : (
                                <span className="text-dark-700">{curr.pre || '—'} {unit}</span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${postChanged ? 'bg-amber-50 border border-amber-100' : 'bg-dark-50 border border-dark-100'}`}>
                          <span className="text-xs font-semibold text-dark-600">Post Weight</span>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            {postChanged ? (
                              <>
                                <span className="text-dark-400 line-through">{old.post || '—'}</span>
                                <ArrowRight size={10} className="text-dark-300" />
                                <span className="text-dark-900">{curr.post || '—'} {unit}</span>
                              </>
                            ) : (
                              <span className="text-dark-700">{curr.post || '—'} {unit}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-dark-100 bg-dark-50/50">
                      <button onClick={handleCancelConfirm}
                        className="h-8 px-4 rounded-lg border border-dark-200 text-xs font-semibold text-dark-600 hover:bg-dark-100 transition-colors">
                        Keep old values
                      </button>
                      <button onClick={handleConfirm}
                        className={`h-8 px-4 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors ${
                          confirmPopup.type === 'notify' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-court-500 hover:bg-court-600'
                        }`}>
                        {confirmPopup.type === 'notify' ? <span className="flex items-center gap-1.5"><Bell size={12} /> Save & Notify</span> : <span className="flex items-center gap-1.5"><Save size={12} /> Confirm Save</span>}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Legend */}
          <div className="flex items-center flex-wrap gap-x-5 gap-y-2 px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 block shrink-0" />
              <span className="text-[11px] text-dark-400">≤ 2% — normal hydration</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 block shrink-0" />
              <span className="text-[11px] text-dark-400">&gt; 2% — high dehydration risk</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-dark-400">Fluid = (pre − post) × 1.5{unit === 'lbs' ? ' (converted to kg)' : ''}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
