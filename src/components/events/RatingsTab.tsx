import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Star, Pencil, ChevronDown, Clock, Settings2, CheckCircle2, UserCog, Users, AlertTriangle, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react';
import { CalendarEvent } from '@/data/events';

interface Props {
  event: CalendarEvent;
}

type RatingValue = 1 | 2 | 3 | 4 | 5 | null;
type RatingMode = 'basic' | 'dimensional' | 'advanced';

const modeConfig: { key: RatingMode; label: string; desc: string }[] = [
  { key: 'basic', label: 'Basic', desc: 'Overall 1-5 rating per player' },
  { key: 'dimensional', label: 'Dimensional', desc: 'Technical, Tactical, Physical, Mental' },
  { key: 'advanced', label: 'Advanced', desc: 'All attributes within each dimension' },
];

// ── Dimension & Attribute definitions ─────────────────
interface Attribute {
  key: string;
  label: string;
}

interface Dimension {
  key: string;
  label: string;
  color: string;
  attributes: Attribute[];
}

const dimensions: Dimension[] = [
  {
    key: 'technical', label: 'Technical', color: '#00A76F',
    attributes: [
      { key: 'passing', label: 'Passing' },
      { key: 'dribbling', label: 'Dribbling' },
      { key: 'shooting', label: 'Shooting' },
      { key: 'first_touch', label: 'First Touch' },
      { key: 'crossing', label: 'Crossing' },
      { key: 'heading', label: 'Heading' },
      { key: 'ball_control', label: 'Ball Control' },
    ],
  },
  {
    key: 'tactical', label: 'Tactical', color: '#8E33FF',
    attributes: [
      { key: 'positioning', label: 'Positioning' },
      { key: 'decision_making', label: 'Decision Making' },
      { key: 'awareness', label: 'Awareness' },
      { key: 'off_ball_movement', label: 'Off-Ball Movement' },
      { key: 'pressing', label: 'Pressing' },
      { key: 'game_reading', label: 'Game Reading' },
    ],
  },
  {
    key: 'physical', label: 'Physical', color: '#FF5630',
    attributes: [
      { key: 'speed', label: 'Speed' },
      { key: 'strength', label: 'Strength' },
      { key: 'stamina', label: 'Stamina' },
      { key: 'agility', label: 'Agility' },
      { key: 'balance', label: 'Balance' },
      { key: 'acceleration', label: 'Acceleration' },
    ],
  },
  {
    key: 'mental', label: 'Mental', color: '#00B8D9',
    attributes: [
      { key: 'composure', label: 'Composure' },
      { key: 'concentration', label: 'Concentration' },
      { key: 'leadership', label: 'Leadership' },
      { key: 'work_rate', label: 'Work Rate' },
      { key: 'aggression', label: 'Aggression' },
      { key: 'teamwork', label: 'Teamwork' },
    ],
  },
];

// ── Player rating data ────────────────────────────────
interface PlayerRating {
  userId: string;
  name: string;
  avatar: string;
  jerseyNumber?: number;
  position?: string;
  overall: RatingValue;
  dimensions: Record<string, RatingValue>;
  dimensionComments: Record<string, string>;
  attributes: Record<string, RatingValue>;
  attributeComments: Record<string, string>;
  comment: string;
  ratedBy: string;
  saved: boolean;
  completed: boolean;
}

function randR(min: number, max: number): RatingValue {
  return (Math.floor(Math.random() * (max - min + 1)) + min) as RatingValue;
}

function buildAttrs(tech: [number, number], tact: [number, number], phys: [number, number], ment: [number, number]): Record<string, RatingValue> {
  const a: Record<string, RatingValue> = {};
  dimensions[0].attributes.forEach(at => a[at.key] = randR(tech[0], tech[1]));
  dimensions[1].attributes.forEach(at => a[at.key] = randR(tact[0], tact[1]));
  dimensions[2].attributes.forEach(at => a[at.key] = randR(phys[0], phys[1]));
  dimensions[3].attributes.forEach(at => a[at.key] = randR(ment[0], ment[1]));
  return a;
}

const emptyDimComments = (): Record<string, string> => Object.fromEntries(dimensions.map(d => [d.key, '']));
const emptyAttrComments = (): Record<string, string> => Object.fromEntries(dimensions.flatMap(d => d.attributes.map(a => [a.key, ''])));

const initialRatings: PlayerRating[] = [
  { userId: 'p-011', name: 'Gabriel Torres', avatar: 'GT', jerseyNumber: 9, position: 'ST', overall: 5, dimensions: { technical: 5, tactical: 4, physical: 4, mental: 5 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([4,5],[3,5],[3,5],[4,5]), attributeComments: emptyAttrComments(), comment: 'Clinical finishing. Great movement.', ratedBy: 'James Carter', saved: true, completed: true },
  { userId: 'p-008', name: 'Noah Clarke', avatar: 'NC', jerseyNumber: 10, position: 'AM', overall: 4, dimensions: { technical: 4, tactical: 5, physical: 3, mental: 4 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([3,5],[4,5],[3,4],[3,5]), attributeComments: emptyAttrComments(), comment: 'Excellent vision and passing.', ratedBy: 'James Carter', saved: true, completed: true },
  { userId: 'p-006', name: 'Jack Brennan', avatar: 'JB', jerseyNumber: 8, position: 'CM', overall: 4, dimensions: { technical: 3, tactical: 4, physical: 5, mental: 4 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([3,4],[3,5],[4,5],[3,5]), attributeComments: emptyAttrComments(), comment: 'Covered every blade of grass.', ratedBy: 'James Carter', saved: true, completed: true },
  { userId: 'p-007', name: 'Leo Fernandez', avatar: 'LF', jerseyNumber: 6, position: 'DM', overall: 4, dimensions: { technical: 4, tactical: 5, physical: 4, mental: 4 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([3,5],[4,5],[3,5],[3,5]), attributeComments: emptyAttrComments(), comment: 'Metronomic passing. Controlled tempo.', ratedBy: 'Elena Vasquez', saved: true, completed: true },
  { userId: 'p-002', name: 'Marcus Williams', avatar: 'MW', jerseyNumber: 4, position: 'CB', overall: 4, dimensions: { technical: 3, tactical: 4, physical: 4, mental: 5 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([2,4],[3,5],[3,5],[4,5]), attributeComments: emptyAttrComments(), comment: 'Won every aerial duel.', ratedBy: 'James Carter', saved: false, completed: false },
  { userId: 'p-003', name: 'Kai Tanaka', avatar: 'KT', jerseyNumber: 5, position: 'CB', overall: 3, dimensions: { technical: 3, tactical: 3, physical: 4, mental: 3 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([2,4],[2,4],[3,5],[2,4]), attributeComments: emptyAttrComments(), comment: 'Struggled first half. Improved after.', ratedBy: 'James Carter', saved: false, completed: false },
  { userId: 'p-004', name: 'Omar Hassan', avatar: 'OH', jerseyNumber: 3, position: 'LB', overall: 3, dimensions: { technical: 3, tactical: 3, physical: 4, mental: 4 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([2,4],[2,4],[3,5],[3,5]), attributeComments: emptyAttrComments(), comment: 'Good overlapping runs.', ratedBy: 'Elena Vasquez', saved: false, completed: false },
  { userId: 'p-005', name: 'Andre Silva', avatar: 'AS', jerseyNumber: 2, position: 'RB', overall: 3, dimensions: { technical: 3, tactical: 3, physical: 3, mental: 3 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([2,4],[2,4],[2,4],[2,4]), attributeComments: emptyAttrComments(), comment: 'Subbed off 78 min. Decent.', ratedBy: 'Elena Vasquez', saved: false, completed: false },
  { userId: 'p-010', name: 'Lucas Dubois', avatar: 'LD', jerseyNumber: 11, position: 'LW', overall: 3, dimensions: { technical: 4, tactical: 3, physical: 3, mental: null }, dimensionComments: emptyDimComments(), attributes: buildAttrs([3,5],[2,4],[2,4],[2,4]), attributeComments: emptyAttrComments(), comment: '', ratedBy: 'James Carter', saved: false, completed: false },
  { userId: 'p-001', name: 'Liam Henderson', avatar: 'LH', jerseyNumber: 1, position: 'GK', overall: 4, dimensions: { technical: 4, tactical: null, physical: 3, mental: 5 }, dimensionComments: emptyDimComments(), attributes: buildAttrs([3,5],[2,4],[2,4],[4,5]), attributeComments: emptyAttrComments(), comment: 'Commanded the box. Big saves.', ratedBy: 'Ryan Mitchell', saved: false, completed: false },
];

// ── Star selector ─────────────────────────────────────
function StarSelect({ value, onChange, size = 16 }: { value: RatingValue; onChange: (v: RatingValue) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(value === n ? null : n as RatingValue)} className="p-0.5 transition-transform hover:scale-110">
          <Star size={size} className={n <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-200'} />
        </button>
      ))}
      <button onClick={() => onChange(null)}
        className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${value === null ? 'bg-dark-200 text-dark-600' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>N/A</button>
    </div>
  );
}

// ── Filled dots display ───────────────────────────────
function Dots({ value, color, size = 3.5 }: { value: RatingValue; color: string; size?: number }) {
  if (value === null) return <span className="text-[10px] font-bold text-dark-300 bg-dark-50 px-1.5 py-0.5 rounded">N/A</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className="rounded-full" style={{ width: `${size * 4}px`, height: `${size * 4}px`, backgroundColor: n <= value ? color : '#ebedf0' }} />
      ))}
      <span className="text-[11px] font-bold ml-1" style={{ color }}>{value}</span>
    </div>
  );
}

function avgOf(vals: (RatingValue)[]): string {
  const nums = vals.filter(v => v !== null) as number[];
  if (nums.length === 0) return 'N/A';
  return (nums.reduce((s, v) => s + v, 0) / nums.length).toFixed(1);
}

// ── Rate Player Modal (adapts to mode) ────────────────
function RateModal({ player, mode, onClose, onSave, onAutoSave, isSelf = false }: {
  player: PlayerRating; mode: RatingMode; onClose: () => void;
  onSave: (p: PlayerRating) => void; onAutoSave: (p: PlayerRating) => void; isSelf?: boolean;
}) {
  const [form, setForm] = useState({
    ...player,
    dimensionComments: player.dimensionComments ?? emptyDimComments(),
    attributeComments: player.attributeComments ?? emptyAttrComments(),
  });
  const [expandedDim, setExpandedDim] = useState<string | null>(dimensions[0].key);
  const [isSaved, setIsSaved] = useState(player.saved);
  const [isCompleted, setIsCompleted] = useState(player.completed);

  // Auto-save helper — saves without closing modal.
  // If player was previously marked done, a new change un-marks it.
  const autoSave = (updated: typeof form) => {
    const newCompleted = false; // any edit clears done state
    onAutoSave({ ...updated, saved: true, completed: newCompleted });
    setIsSaved(true);
    setIsCompleted(false);
  };

  const setDim = (dimKey: string, val: RatingValue) => {
    const updated = { ...form, dimensions: { ...form.dimensions, [dimKey]: val } };
    setForm(updated);
    autoSave(updated);
  };
  const setAttr = (attrKey: string, val: RatingValue) => {
    const updated = { ...form, attributes: { ...form.attributes, [attrKey]: val } };
    setForm(updated);
    autoSave(updated);
  };
  const setOverall = (val: RatingValue) => {
    const updated = { ...form, overall: val };
    setForm(updated);
    autoSave(updated);
  };
  const setDimComment = (dimKey: string, val: string) =>
    setForm(p => ({ ...p, dimensionComments: { ...p.dimensionComments, [dimKey]: val } }));
  const setAttrComment = (attrKey: string, val: string) =>
    setForm(p => ({ ...p, attributeComments: { ...p.attributeComments, [attrKey]: val } }));
  const blurSave = () => autoSave(form);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{player.avatar}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-dark-900">{player.name}</h3>
              <p className="text-[10px] text-dark-400">#{player.jerseyNumber} {player.position} &middot; {isSelf ? 'Self' : 'Coach'} · {modeConfig.find(m => m.key === mode)?.label} Rating</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <Tip label="Rating marked complete">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
                  <CheckCircle2 size={9} strokeWidth={2} /> Done
                </span>
              </Tip>
            ) : isSaved ? (
              <Tip label="Auto-saved draft">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <Save size={9} strokeWidth={1.5} /> Saved
                </span>
              </Tip>
            ) : null}
            <button title="Close" onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* BASIC */}
          {mode === 'basic' && (
            <div className="text-center py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-3">Overall Rating</p>
              <div className="flex justify-center">
                <StarSelect value={form.overall} onChange={setOverall} size={28} />
              </div>
            </div>
          )}

          {/* DIMENSIONAL */}
          {mode === 'dimensional' && (
            <div className="space-y-3">
              {dimensions.map(dim => (
                <div key={dim.key} className="rounded-xl border border-dark-100 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-3" style={{ backgroundColor: dim.color + '08' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-6 rounded-full" style={{ backgroundColor: dim.color }} />
                      <span className="text-sm font-bold text-dark-800">{dim.label}</span>
                    </div>
                    <StarSelect value={form.dimensions[dim.key]} onChange={v => setDim(dim.key, v)} />
                  </div>
                  <div className="px-3 py-1 border-t border-dark-100/60">
                    <input
                      type="text"
                      value={form.dimensionComments[dim.key] ?? ''}
                      onChange={e => setDimComment(dim.key, e.target.value)}
                      onBlur={blurSave}
                      placeholder="Optional comment…"
                      className="w-full text-[11px] text-dark-500 placeholder:text-dark-300 bg-transparent focus:outline-none leading-tight"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ADVANCED */}
          {mode === 'advanced' && (
            <div className="space-y-2">
              {dimensions.map(dim => {
                const isOpen = expandedDim === dim.key;
                const dimAttrVals = dim.attributes.map(a => form.attributes[a.key]);
                const dimAvg = avgOf(dimAttrVals);
                return (
                  <div key={dim.key} className="border border-dark-100 rounded-xl overflow-hidden">
                    {/* Dimension header — click to expand */}
                    <button onClick={() => setExpandedDim(isOpen ? null : dim.key)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-dark-50/50 transition-colors">
                      <div className="w-2 h-6 rounded-full" style={{ backgroundColor: dim.color }} />
                      <span className="text-sm font-bold text-dark-800 flex-1 text-left">{dim.label}</span>
                      <span className="text-xs font-bold mr-2" style={{ color: dim.color }}>Avg: {dimAvg}</span>
                      <ChevronDown size={14} className={`text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          {/* Dimension comment */}
                          <div className="px-4 py-1 border-b border-dark-100">
                            <input
                              type="text"
                              value={form.dimensionComments[dim.key] ?? ''}
                              onChange={e => setDimComment(dim.key, e.target.value)}
                              onBlur={blurSave}
                              placeholder="Optional comment…"
                              className="w-full text-[11px] text-dark-500 placeholder:text-dark-300 bg-transparent focus:outline-none leading-tight"
                            />
                          </div>
                          {/* Attributes */}
                          <div className="px-4 pb-2">
                            {dim.attributes.map(attr => (
                              <div key={attr.key} className="border-b border-dark-50 last:border-0">
                                <div className="flex items-center justify-between py-1.5">
                                  <span className="text-xs text-dark-600 font-medium w-28 shrink-0">{attr.label}</span>
                                  <StarSelect value={form.attributes[attr.key]} onChange={v => setAttr(attr.key, v)} size={14} />
                                </div>
                                {/* Attribute comment — only show if focused or has value */}
                                <input
                                  type="text"
                                  value={form.attributeComments[attr.key] ?? ''}
                                  onChange={e => setAttrComment(attr.key, e.target.value)}
                                  onBlur={blurSave}
                                  placeholder="Optional…"
                                  className="w-full text-[10px] text-dark-400 placeholder:text-dark-200 bg-transparent focus:outline-none pb-1.5 -mt-0.5 leading-tight"
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-dark-700 mb-1">Coach Comment</label>
            <textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
              onBlur={blurSave}
              rows={2} placeholder="Optional notes..."
              className="w-full px-3 py-2 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">Close</button>
          {!isCompleted ? (
            <button
              onClick={() => { onAutoSave({ ...form, saved: true, completed: true }); setIsCompleted(true); onClose(); }}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-bold bg-dark-50 text-dark-500 hover:bg-green-50 hover:text-green-600 border border-dark-200 hover:border-green-200 transition-all"
            >
              <CheckCircle2 size={13} strokeWidth={2.5} />
              Mark as Done
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-bold bg-green-100 text-green-600">
              <CheckCircle2 size={13} strokeWidth={2.5} /> Done
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN RATINGS TAB
// ══════════════════════════════════════════════════════
// ~40% of players have submitted self-ratings
const selfFilledData: Record<string, Partial<PlayerRating>> = {
  // Gabriel Torres — completed, rates himself physically stronger, slightly modest on technical
  'p-011': {
    overall: 4, saved: true, completed: true,
    dimensions: { technical: 4, tactical: 4, physical: 5, mental: 4 },
    attributes: {
      passing: 4, dribbling: 5, shooting: 5, first_touch: 4, crossing: 3, heading: 4, ball_control: 4,
      positioning: 5, decision_making: 4, awareness: 4, off_ball_movement: 5, pressing: 3, game_reading: 4,
      speed: 5, strength: 4, stamina: 5, agility: 4, balance: 4, acceleration: 5,
      composure: 5, concentration: 4, leadership: 5, work_rate: 4, aggression: 4, teamwork: 4,
    },
    comment: 'Good game overall. Felt strong physically — can improve technical consistency.',
  },
  // Noah Clarke — saved but not done; rates himself higher on mental than coach did
  'p-008': {
    overall: 5, saved: true, completed: false,
    dimensions: { technical: 5, tactical: 5, physical: 3, mental: 5 },
    attributes: {
      passing: 5, dribbling: 4, shooting: 4, first_touch: 5, crossing: 4, heading: 3, ball_control: 5,
      positioning: 4, decision_making: 5, awareness: 5, off_ball_movement: 4, pressing: 4, game_reading: 5,
      speed: 3, strength: 3, stamina: 3, agility: 4, balance: 3, acceleration: 3,
      composure: 5, concentration: 4, leadership: 4, work_rate: 5, aggression: 3, teamwork: 5,
    },
    comment: '',
  },
  // Marcus Williams — completed, overestimates overall, lower on tactical vs coach
  'p-002': {
    overall: 5, saved: true, completed: true,
    dimensions: { technical: 3, tactical: 3, physical: 5, mental: 5 },
    attributes: {
      passing: 3, dribbling: 2, shooting: 2, first_touch: 3, crossing: 3, heading: 5, ball_control: 3,
      positioning: 4, decision_making: 3, awareness: 3, off_ball_movement: 2, pressing: 3, game_reading: 3,
      speed: 4, strength: 5, stamina: 4, agility: 3, balance: 4, acceleration: 4,
      composure: 5, concentration: 5, leadership: 4, work_rate: 5, aggression: 4, teamwork: 4,
    },
    comment: 'Dominated aerially. Tactical positioning needs more work.',
  },
  // Lucas Dubois — saved but not done; broadly agrees with coach
  'p-010': {
    overall: 3, saved: true, completed: false,
    dimensions: { technical: 4, tactical: 3, physical: 3, mental: 3 },
    attributes: {
      passing: 3, dribbling: 4, shooting: 3, first_touch: 4, crossing: 4, heading: 2, ball_control: 4,
      positioning: 3, decision_making: 3, awareness: 3, off_ball_movement: 4, pressing: 2, game_reading: 3,
      speed: 4, strength: 3, stamina: 3, agility: 4, balance: 3, acceleration: 4,
      composure: 3, concentration: 3, leadership: 2, work_rate: 4, aggression: 3, teamwork: 3,
    },
    comment: '',
  },
};

const initialSelfRatings: PlayerRating[] = initialRatings.map(p => {
  const filled = selfFilledData[p.userId];
  if (filled) {
    return {
      ...p,
      ...filled,
      dimensions: filled.dimensions ?? { technical: null, tactical: null, physical: null, mental: null },
      dimensionComments: emptyDimComments(),
      attributeComments: emptyAttrComments(),
      ratedBy: p.name,
    };
  }
  return {
    ...p,
    overall: null,
    dimensions: { technical: null, tactical: null, physical: null, mental: null },
    dimensionComments: emptyDimComments(),
    attributes: Object.fromEntries(
      dimensions.flatMap(d => d.attributes.map(a => [a.key, null as RatingValue]))
    ),
    attributeComments: emptyAttrComments(),
    comment: '',
    ratedBy: p.name,
    saved: false,
    completed: false,
  };
});

export default function RatingsTab({ event }: Props) {
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [selfEnabled, setSelfEnabled] = useState(false);
  const [ratings, setRatings] = useState<PlayerRating[]>(initialRatings);
  const [selfRatings, setSelfRatings] = useState<PlayerRating[]>(initialSelfRatings);
  const [mode, setMode] = useState<RatingMode>('dimensional');
  const [selfMode, setSelfMode] = useState<RatingMode>('advanced');
  const [editPlayer, setEditPlayer] = useState<PlayerRating | null>(null);
  const [editContext, setEditContext] = useState<'coach' | 'self'>('coach');

  const anyEnabled = coachEnabled || selfEnabled;
  const showBoth = coachEnabled && selfEnabled;

  // Auto-save: update state without closing modal
  const handleAutoSave = (updated: PlayerRating) => {
    if (editContext === 'self') {
      setSelfRatings(prev => prev.map(r => r.userId === updated.userId ? updated : r));
    } else {
      setRatings(prev => prev.map(r => r.userId === updated.userId ? updated : r));
    }
  };

  const handleSave = (updated: PlayerRating) => {
    handleAutoSave(updated);
    setEditPlayer(null);
  };

  // Inline save for the basic coach table — un-completes if a completed rating is edited
  const inlineSaveCoach = (userId: string, patch: Partial<PlayerRating>) =>
    setRatings(prev => prev.map(r =>
      r.userId === userId ? { ...r, ...patch, saved: true, completed: false } : r
    ));

  const openEdit = (player: PlayerRating, context: 'coach' | 'self') => {
    setEditContext(context);
    setEditPlayer(player);
  };

  const toggleComplete = (userId: string, context: 'coach' | 'self') => {
    if (context === 'self') {
      setSelfRatings(prev => prev.map(r => r.userId === userId ? { ...r, completed: !r.completed } : r));
    } else {
      setRatings(prev => prev.map(r => r.userId === userId ? { ...r, completed: !r.completed } : r));
    }
  };

  const completedCount = ratings.filter(r => r.completed).length;
  const selfCompletedCount = selfRatings.filter(r => r.completed).length;

  const teamDimAvgs = dimensions.map(dim => {
    const vals = ratings.map(r => r.dimensions[dim.key]).filter(v => v !== null) as number[];
    return { ...dim, avg: vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : 'N/A' };
  });
  const teamOverallAvg = avgOf(ratings.map(r => r.overall));

  const selfDimAvgs = dimensions.map(dim => {
    const vals = selfRatings.map(r => r.dimensions[dim.key]).filter(v => v !== null) as number[];
    return { ...dim, avg: vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : 'N/A' };
  });
  const selfOverallAvg = avgOf(selfRatings.map(r => r.overall));

  // Toggle button helper
  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="relative shrink-0">
      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-court-500' : 'bg-dark-200'}`}>
        <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ left: on ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </div>
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Two independent toggles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-4 py-3 bg-dark-50/60 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: coachEnabled ? '#FFAB0018' : '#91919118' }}>
              <Users size={16} className={coachEnabled ? 'text-yellow-500' : 'text-dark-300'} />
            </div>
            <div>
              <p className="text-sm font-bold text-dark-800">Coach Ratings</p>
              <p className="text-[11px] text-dark-400">Rate player performance per the selected system</p>
            </div>
          </div>
          <Toggle on={coachEnabled} onToggle={() => setCoachEnabled(v => !v)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-dark-50/60 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: selfEnabled ? '#8E33FF18' : '#91919118' }}>
              <UserCog size={16} className={selfEnabled ? 'text-violet-500' : 'text-dark-300'} />
            </div>
            <div>
              <p className="text-sm font-bold text-dark-800">Rate Self</p>
              <p className="text-[11px] text-dark-400">Players rate their own performance</p>
            </div>
          </div>
          <Toggle on={selfEnabled} onToggle={() => setSelfEnabled(v => !v)} />
        </div>
      </div>

      {/* Neither enabled */}
      {!anyEnabled && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-dark-50 flex items-center justify-center mx-auto mb-4">
            <Star size={28} className="text-dark-200" />
          </div>
          <p className="text-sm font-semibold text-dark-500 mb-1">Player Ratings Disabled</p>
          <p className="text-xs text-dark-400 max-w-xs mx-auto">Enable coach ratings, self ratings, or both.</p>
        </motion.div>
      )}

      {anyEnabled && <>
      {/* Method selectors — one per enabled toggle */}
      <div className={`grid gap-3 ${showBoth ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {coachEnabled && (
          <div className="rounded-xl border border-dark-100 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-1.5">
              <Users size={10} /> Coach Method
            </p>
            <div className="space-y-1.5">
              {modeConfig.map(m => {
                const isSelected = mode === m.key;
                return (
                  <button key={m.key} onClick={() => setMode(m.key)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all ${
                      isSelected ? 'border-court-400 bg-court-50' : 'border-dark-100 hover:border-dark-200 hover:bg-dark-50/50'
                    }`}>
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-court-500 bg-court-500' : 'border-dark-300'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-none ${isSelected ? 'text-court-700' : 'text-dark-800'}`}>{m.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-court-500' : 'text-dark-400'}`}>{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {selfEnabled && (
          <div className="rounded-xl border border-violet-100 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2 flex items-center gap-1.5">
              <UserCog size={10} /> Self Method
            </p>
            <div className="space-y-1.5">
              {modeConfig.map(m => {
                const isSelected = selfMode === m.key;
                return (
                  <button key={m.key} onClick={() => setSelfMode(m.key)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all ${
                      isSelected ? 'border-violet-400 bg-violet-50' : 'border-dark-100 hover:border-violet-200 hover:bg-violet-50/30'
                    }`}>
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-violet-500 bg-violet-500' : 'border-dark-300'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-none ${isSelected ? 'text-violet-700' : 'text-dark-800'}`}>{m.label}</p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-violet-500' : 'text-dark-400'}`}>{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {showBoth && mode === selfMode && (
        <p className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
          <AlertTriangle size={10} /> Same method selected — differences will be flagged
        </p>
      )}

      {/* Progress bars */}
      <div className={`grid gap-2 ${showBoth ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {coachEnabled && (() => {
            const total = ratings.length;
            const done = ratings.filter(r => r.completed).length;
            const saved = ratings.filter(r => r.saved && !r.completed).length;
            const pctDone = (done / total) * 100;
            const pctSaved = (saved / total) * 100;
            return (
              <div className="flex items-center gap-3 p-3 bg-dark-50/60 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-dark-500 flex items-center gap-1"><Users size={10} /> Coach</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1 text-green-600 font-semibold"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{done} done</span>
                      {saved > 0 && <span className="flex items-center gap-1 text-amber-600 font-semibold"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{saved} saved</span>}
                      <span className="flex items-center gap-1 text-dark-400 font-semibold"><span className="w-2 h-2 rounded-full bg-dark-200 inline-block" />{total - done - saved} pending</span>
                    </div>
                  </div>
                  <div className="h-2 bg-dark-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-court-500 transition-all duration-500" style={{ width: `${pctDone}%` }} />
                    <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${pctSaved}%` }} />
                  </div>
                </div>
              </div>
            );
          })()}
        {selfEnabled && (
          <div className="flex items-center gap-3 p-3 bg-violet-50/60 rounded-xl">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-dark-500 flex items-center gap-1"><UserCog size={10} /> Self <strong className="text-dark-800">{selfCompletedCount}</strong>/{selfRatings.length}</span>
                <span className="font-bold text-violet-600">{Math.round((selfCompletedCount / selfRatings.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500" style={{ width: `${(selfCompletedCount / selfRatings.length) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── COACH RATINGS SECTION ──────────────────── */}
      {coachEnabled && (
        <div className="space-y-3">
          {showBoth && <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400 flex items-center gap-1.5"><Users size={10} /> Coach Ratings</p>}

          {/* Basic */}
          {mode === 'basic' && !showBoth && (
            <>
              <div className="bg-court-50 rounded-xl p-4 flex items-center gap-3">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-court-700">{teamOverallAvg}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-court-500 mt-0.5">Team Avg</p>
                </div>
                <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} size={18} className={n <= Math.round(parseFloat(teamOverallAvg) || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-court-200'} />)}</div>
              </div>
              <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-dark-50/60">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Player</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Rating</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Comment</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Done</th>
                  </tr></thead>
                  <tbody className="divide-y divide-dark-100">
                    {ratings.map(p => (
                      <tr key={p.userId} className={`${p.completed ? 'bg-green-50/30' : ''}`}>
                        <td className="px-4 py-3"><PlayerCell player={p} /></td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <button
                                key={n}
                                onClick={() => inlineSaveCoach(p.userId, { overall: p.overall === n ? null : n as RatingValue })}
                                className="p-0.5 transition-transform hover:scale-110"
                              >
                                <Star size={16} className={n <= (p.overall || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-200'} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            key={p.userId}
                            type="text"
                            defaultValue={p.comment}
                            onBlur={e => {
                              if (e.target.value !== p.comment) inlineSaveCoach(p.userId, { comment: e.target.value });
                            }}
                            placeholder="Add comment…"
                            className="w-full text-[11px] text-dark-600 placeholder:text-dark-300 bg-transparent border-b border-transparent hover:border-dark-200 focus:border-court-400 focus:outline-none py-0.5 transition-colors"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => setRatings(prev => prev.map(r => r.userId === p.userId ? { ...r, completed: true, saved: true } : r))}
                            disabled={p.completed}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${p.completed ? 'bg-green-100 text-green-600 cursor-default' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}
                          >
                            {p.completed ? <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Done</span> : 'Mark Done'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Dimensional */}
          {mode === 'dimensional' && !showBoth && (
            <>
              <div className="grid grid-cols-4 gap-3">
                {teamDimAvgs.map(d => (
                  <div key={d.key} className="rounded-xl p-3 text-center border border-dark-100" style={{ backgroundColor: d.color + '08' }}>
                    <p className="text-2xl font-extrabold" style={{ color: d.color }}>{d.avg}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: d.color }}>{d.label}</p>
                    <p className="text-[9px] text-dark-400">Team Avg</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {ratings.map(p => {
                  const avg = avgOf(dimensions.map(d => p.dimensions[d.key]));
                  const avgN = avg !== 'N/A' ? parseFloat(avg) : 0;
                  return (
                    <div key={p.userId} className={`bg-white rounded-xl border overflow-hidden ${p.completed ? 'border-green-200 bg-green-50/20' : 'border-dark-100'}`}>
                      {/* Player header row */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-100/60">
                        <div className="flex items-center gap-2.5">
                          <PlayerCell player={p} />
                        </div>
                        <div className="flex items-center gap-3">
                          {avg !== 'N/A' && (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${avgN >= 4 ? 'bg-green-50 text-green-600' : avgN >= 3 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                              Avg {avg}
                            </span>
                          )}
                          <button
                            onClick={() => setRatings(prev => prev.map(r => r.userId === p.userId ? { ...r, completed: true, saved: true } : r))}
                            disabled={p.completed}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${p.completed ? 'bg-green-100 text-green-600 cursor-default' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}
                          >
                            {p.completed ? <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Done</span> : 'Mark Done'}
                          </button>
                        </div>
                      </div>

                      {/* Dimensions grid */}
                      <div className="grid grid-cols-4 divide-x divide-dark-100/60">
                        {dimensions.map(d => (
                          <div key={d.key} className="px-3 py-2.5 space-y-1.5" style={{ backgroundColor: d.color + '06' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: d.color }}>{d.label}</span>
                              {p.dimensions[d.key] !== null && (
                                <span className="text-[10px] font-bold" style={{ color: d.color }}>{p.dimensions[d.key]}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[1,2,3,4,5].map(n => (
                                <button
                                  key={n}
                                  onClick={() => inlineSaveCoach(p.userId, { dimensions: { ...p.dimensions, [d.key]: p.dimensions[d.key] === n ? null : n as RatingValue } })}
                                  className="p-0.5 transition-transform hover:scale-110"
                                >
                                  <Star size={13} className={n <= (p.dimensions[d.key] || 0) ? 'fill-current' : 'text-dark-200'} style={{ color: n <= (p.dimensions[d.key] || 0) ? d.color : undefined }} />
                                </button>
                              ))}
                            </div>
                            <input
                              key={`${p.userId}-${d.key}`}
                              type="text"
                              defaultValue={p.dimensionComments?.[d.key] ?? ''}
                              onBlur={e => {
                                const val = e.target.value;
                                inlineSaveCoach(p.userId, { dimensionComments: { ...p.dimensionComments, [d.key]: val } });
                              }}
                              placeholder="Comment…"
                              className="w-full text-[10px] text-dark-500 placeholder:text-dark-300 bg-transparent border-b border-transparent hover:border-dark-200 focus:outline-none py-0.5 transition-colors"
                              style={{ borderColor: 'transparent' }}
                              onFocus={e => e.target.style.borderColor = d.color + '60'}
                              onBlurCapture={e => e.currentTarget.style.borderColor = 'transparent'}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Overall comment */}
                      <div className="px-4 py-2 border-t border-dark-100/60">
                        <input
                          key={`${p.userId}-overall`}
                          type="text"
                          defaultValue={p.comment}
                          onBlur={e => { if (e.target.value !== p.comment) inlineSaveCoach(p.userId, { comment: e.target.value }); }}
                          placeholder="Overall comment…"
                          className="w-full text-[11px] text-dark-600 placeholder:text-dark-300 bg-transparent border-b border-transparent hover:border-dark-200 focus:border-court-400 focus:outline-none py-0.5 transition-colors"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Advanced cards — shown for mode=advanced, or whenever showBoth (any selfMode) */}
          {(mode === 'advanced' || showBoth) && (
            <div>
              {/* Dimension column headers — hidden when both coach and self are basic (no dim bars shown) */}
              {!(showBoth && mode === 'basic' && selfMode === 'basic') && (
                <div className="flex items-center px-4 gap-3 pb-1.5">
                  <div className="w-3.5 shrink-0" />
                  <div className="w-7 shrink-0" />
                  <div className="w-28 shrink-0" />
                  {showBoth && <div className="w-3 shrink-0" />}
                  <div className="flex items-center flex-1 min-w-0 gap-3">
                    {dimensions.map(dim => (
                      <div key={dim.key} className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="w-1.5 shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: dim.color }}>{dim.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`shrink-0 ${showBoth ? 'w-20' : 'w-14'}`} />
                </div>
              )}
              <div className="space-y-4">
                {ratings.map(player => {
                  const sp = showBoth ? selfRatings.find(r => r.userId === player.userId) : undefined;
                  return (
                    <AdvancedPlayerCard
                      key={player.userId}
                      player={player}
                      selfPlayer={sp}
                      coachMode={mode}
                      sameSystem={showBoth && mode === selfMode}
                      selfMode={selfMode}
                      onEdit={() => openEdit(player, 'coach')}
                      onToggleComplete={() => toggleComplete(player.userId, 'coach')}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SELF RATINGS SECTION ───────────────────── */}
      {selfEnabled && (
        <div className="space-y-3">
          {showBoth && <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5"><UserCog size={10} /> Player Self Ratings</p>}

          {/* Basic */}
          {selfMode === 'basic' && !showBoth && (
            <>
              <div className="bg-violet-50 rounded-xl p-4 flex items-center gap-3">
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-violet-700">{selfOverallAvg}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500 mt-0.5">Team Avg</p>
                </div>
                <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <Star key={n} size={18} className={n <= Math.round(parseFloat(selfOverallAvg) || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-violet-200'} />)}</div>
              </div>
              <div className="bg-white rounded-xl border border-violet-100 overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-violet-50/40">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Player</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-violet-500">Self Rating</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Comment</th>
                    {coachEnabled && <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Done</th>}
                    {coachEnabled && <th className="w-10"></th>}
                  </tr></thead>
                  <tbody className="divide-y divide-dark-100">
                    {selfRatings.map(sp => {
                      const coachP = coachEnabled ? ratings.find(r => r.userId === sp.userId) : null;
                      const flagged = showBoth && mode === selfMode && coachP && coachP.overall !== null && sp.overall !== null && coachP.overall !== sp.overall;
                      return (
                        <tr key={sp.userId} className={`hover:bg-dark-50/30 ${sp.completed ? 'bg-green-50/30' : ''}`}>
                          <td className="px-4 py-3"><PlayerCell player={sp} /></td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              {[1,2,3,4,5].map(n => <Star key={n} size={14} className={n <= (sp.overall || 0) ? 'text-violet-400 fill-violet-400' : 'text-dark-200'} />)}
                              {sp.overall === null && <span className="text-[10px] font-bold text-dark-300">N/A</span>}
                              {flagged && <Tip label="Differs from coach rating"><AlertTriangle size={11} className="text-amber-500 ml-0.5" /></Tip>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-dark-500 italic truncate max-w-[140px]">{sp.comment || '—'}</td>
                          {coachEnabled && (
                            <td className="px-2 py-3 text-center">
                              <button onClick={() => toggleComplete(sp.userId, 'self')} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${sp.completed ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>
                                {sp.completed ? <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Done</span> : 'Mark Done'}
                              </button>
                            </td>
                          )}
                          {coachEnabled && (
                            <td className="px-2 py-3"><button title="Edit self-rating" onClick={() => openEdit(sp, 'self')} className="p-1 rounded-lg hover:bg-violet-50 text-violet-300 hover:text-violet-600"><Pencil size={13} /></button></td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Dimensional */}
          {selfMode === 'dimensional' && !showBoth && (
            <>
              <div className="grid grid-cols-4 gap-3">
                {selfDimAvgs.map(d => (
                  <div key={d.key} className="rounded-xl p-3 text-center border border-violet-100" style={{ backgroundColor: d.color + '08' }}>
                    <p className="text-2xl font-extrabold text-violet-600">{d.avg}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: d.color }}>{d.label}</p>
                    <p className="text-[9px] text-violet-400">Self Avg</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-violet-100 overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-violet-50/40">
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400 w-40">Player</th>
                    {dimensions.map(d => <th key={d.key} className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: d.color }}>{d.label}</th>)}
                    <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Avg</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Comment</th>
                    {coachEnabled && <th className="text-center px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Done</th>}
                    {coachEnabled && <th className="w-10"></th>}
                  </tr></thead>
                  <tbody className="divide-y divide-dark-100">
                    {selfRatings.map(sp => {
                      const avg = avgOf(dimensions.map(d => sp.dimensions[d.key]));
                      const avgN = avg !== 'N/A' ? parseFloat(avg) : 0;
                      const coachP = coachEnabled ? ratings.find(r => r.userId === sp.userId) : null;
                      return (
                        <tr key={sp.userId} className={`hover:bg-dark-50/30 ${sp.completed ? 'bg-green-50/30' : ''}`}>
                          <td className="px-4 py-3"><PlayerCell player={sp} /></td>
                          {dimensions.map(d => {
                            const selfVal = sp.dimensions[d.key];
                            const coachVal = coachP ? coachP.dimensions[d.key] : null;
                            const flagged = showBoth && mode === selfMode && coachVal !== null && selfVal !== null && coachVal !== selfVal;
                            return (
                              <td key={d.key} className="text-center px-2 py-3">
                                <div className="flex flex-col items-center gap-0.5">
                                  <Dots value={selfVal} color="#8E33FF" size={3} />
                                  {flagged && <Tip label="Differs from coach rating"><AlertTriangle size={8} className="text-amber-500" /></Tip>}
                                </div>
                              </td>
                            );
                          })}
                          <td className="text-center px-2 py-3">
                            <span className={`inline-flex items-center justify-center w-9 h-6 rounded-lg text-[11px] font-bold ${avg === 'N/A' ? 'bg-dark-50 text-dark-400' : avgN >= 4 ? 'bg-green-50 text-green-600' : avgN >= 3 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{avg}</span>
                          </td>
                          <td className="px-3 py-3 text-[11px] text-dark-500 italic truncate max-w-[130px]">{sp.comment || '—'}</td>
                          {coachEnabled && (
                            <td className="px-2 py-3 text-center">
                              <button onClick={() => toggleComplete(sp.userId, 'self')} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${sp.completed ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'}`}>
                                {sp.completed ? <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Done</span> : 'Mark Done'}
                              </button>
                            </td>
                          )}
                          {coachEnabled && (
                            <td className="px-2 py-3"><button title="Edit self-rating" onClick={() => openEdit(sp, 'self')} className="p-1 rounded-lg hover:bg-violet-50 text-violet-300 hover:text-violet-600"><Pencil size={13} /></button></td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Advanced — suppressed when showBoth (cards already shown in coach section) */}
          {selfMode === 'advanced' && !showBoth && (
            <div>
              {/* Dimension column headers */}
              <div className="flex items-center px-4 gap-3 pb-1.5">
                <div className="w-3.5 shrink-0" />
                <div className="w-7 shrink-0" />
                <div className="w-28 shrink-0" />
                <div className="flex items-center flex-1 min-w-0 gap-3">
                  {dimensions.map(dim => (
                    <div key={dim.key} className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="w-1.5 shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: dim.color }}>{dim.label}</span>
                    </div>
                  ))}
                </div>
                <div className="w-6 shrink-0" />
              </div>
              <div className="space-y-4">
                {selfRatings.map(sp => (
                  <AdvancedPlayerCard key={sp.userId} player={sp}
                    readOnly={!coachEnabled}
                    onEdit={() => openEdit(sp, 'self')}
                    onToggleComplete={() => toggleComplete(sp.userId, 'self')} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-dark-400 text-center">{ratings.length} players &middot; Scale: 1-5 or N/A</p>

      <AnimatePresence>
        {editPlayer && <RateModal player={editPlayer} mode={editContext === 'self' ? selfMode : mode} onClose={() => setEditPlayer(null)} onSave={handleSave} onAutoSave={handleAutoSave} isSelf={editContext === 'self'} />}
      </AnimatePresence>
      </>}
    </div>
  );
}

// ── Tooltip wrapper ───────────────────────────────────
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip shrink-0 inline-flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-opacity z-30 font-medium">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-900" />
      </div>
    </div>
  );
}

// ── Reusable player cell ──────────────────────────────
function PlayerCell({ player }: { player: PlayerRating }) {
  return (
    <div className="flex items-center gap-2">
      {player.completed
        ? <Tip label="Rating complete"><CheckCircle2 size={14} className="text-green-500 shrink-0" /></Tip>
        : player.saved
          ? <Tip label="Draft saved"><Save size={13} className="text-amber-500 shrink-0" strokeWidth={1.5} /></Tip>
          : <Tip label="Not yet rated"><span className="w-3.5 h-3.5 rounded-full border-2 border-dark-200 shrink-0 inline-block" /></Tip>
      }
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-white">{player.avatar}</span>
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-semibold truncate ${player.completed ? 'text-dark-500' : 'text-dark-800'}`}>{player.name}</p>
        <p className="text-[10px] text-dark-400">#{player.jerseyNumber} {player.position}</p>
      </div>
    </div>
  );
}

// ── Advanced: per-player expandable card ──────────────
function AdvancedPlayerCard({ player, selfPlayer, sameSystem, onEdit, onToggleComplete, coachMode, selfMode, readOnly }: {
  player: PlayerRating;
  selfPlayer?: PlayerRating;
  sameSystem?: boolean;
  onEdit: () => void;
  onToggleComplete: () => void;
  coachMode?: RatingMode;
  selfMode?: RatingMode;
  readOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSelf = !!selfPlayer;
  const effectiveCoachMode = coachMode ?? 'advanced';
  const effectiveSelfMode = selfMode ?? 'advanced';
  const selfPending = hasSelf && !selfPlayer!.saved && !selfPlayer!.completed;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${player.completed ? 'border-green-200 bg-green-50/20' : 'border-dark-100'}`}>
      {/* Clickable header row — entire row toggles expand */}
      <div
        className="flex items-center px-4 py-3 hover:bg-dark-50/30 transition-colors cursor-pointer gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status icon */}
        <div className="shrink-0">
          {player.completed
            ? <Tip label="Rating complete"><CheckCircle2 size={14} className="text-green-500" /></Tip>
            : player.saved
              ? <Tip label="Draft saved"><Save size={13} className="text-amber-500" strokeWidth={1.5} /></Tip>
              : <Tip label="Not yet rated"><span className="w-3.5 h-3.5 rounded-full border-2 border-dark-200 inline-block" /></Tip>
          }
        </div>
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-white">{player.avatar}</span>
        </div>
        {/* Player name — fixed width, truncated */}
        <div className="w-28 shrink-0">
          <p className={`text-xs font-semibold truncate ${player.completed ? 'text-dark-500' : 'text-dark-800'}`}>{player.name}</p>
          <p className="text-[10px] text-dark-400">#{player.jerseyNumber} {player.position}</p>
        </div>
        {/* Self status indicator */}
        {hasSelf && (
          <div className="shrink-0">
            {selfPlayer!.completed
              ? <Tip label="Self-rating complete"><CheckCircle2 size={11} className="text-green-500" /></Tip>
              : selfPlayer!.saved && !selfPlayer!.completed
                ? <Tip label="Self-rating saved"><Save size={10} className="text-amber-500" strokeWidth={1.5} /></Tip>
                : <Tip label="Self-rating pending"><Clock size={10} className="text-dark-300" /></Tip>
            }
          </div>
        )}
        {/* Both-basic: show inline overall comparison instead of empty dim bars */}
        {effectiveCoachMode === 'basic' && effectiveSelfMode === 'basic' ? (
          <div className="flex items-center flex-1 min-w-0 gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-dark-500">Coach</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => <Star key={n} size={11} className={n <= (player.overall || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-100'} />)}
              </div>
              {player.overall !== null && <span className="text-[9px] font-bold text-dark-600">{player.overall}</span>}
            </div>
            {hasSelf && !selfPending && (
              <>
                <span className="text-[9px] text-dark-300">vs</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-indigo-500">Self</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => <Star key={n} size={11} className={n <= (selfPlayer!.overall || 0) ? 'text-indigo-400 fill-indigo-400' : 'text-dark-100'} />)}
                  </div>
                  {selfPlayer!.overall !== null && <span className="text-[9px] font-bold text-indigo-500">{selfPlayer!.overall}</span>}
                  {player.overall !== null && selfPlayer!.overall !== null && selfPlayer!.overall !== player.overall && (
                    selfPlayer!.overall > player.overall
                      ? <Tip label="Player rates self higher"><ArrowUp size={9} className="text-green-500" /></Tip>
                      : <Tip label="Player rates self lower"><ArrowDown size={9} className="text-red-500" /></Tip>
                  )}
                </div>
              </>
            )}
            {hasSelf && selfPending && (
              <span className="text-[9px] text-dark-300 italic">Self: pending</span>
            )}
          </div>
        ) : (
        <div className="flex items-center flex-1 min-w-0 gap-3">
          {dimensions.map(dim => {
            const coachBarValue: number | null = (() => {
              if (effectiveCoachMode === 'advanced') {
                const attrVals = dim.attributes.map(a => player.attributes[a.key]).filter(v => v !== null) as number[];
                return attrVals.length > 0 ? attrVals.reduce((s, v) => s + v, 0) / attrVals.length : null;
              }
              if (effectiveCoachMode === 'dimensional') {
                const dv = player.dimensions[dim.key];
                return dv !== null ? (dv as number) : null;
              }
              return null; // basic: no coach bar
            })();
            const selfBarValue: number | null = (() => {
              if (!selfPlayer || selfPending) return null;
              if (effectiveSelfMode === 'advanced') {
                const vals = dim.attributes.map(a => selfPlayer.attributes[a.key]).filter(v => v !== null) as number[];
                return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
              }
              if (effectiveSelfMode === 'dimensional') {
                const dv = selfPlayer.dimensions[dim.key];
                return dv !== null ? (dv as number) : null;
              }
              return null; // basic: no self bar per dimension
            })();
            const flagDim = effectiveCoachMode !== 'basic' && effectiveSelfMode !== 'basic' && hasSelf && sameSystem && coachBarValue !== null && selfBarValue !== null && Math.abs(selfBarValue - coachBarValue) >= 1;
            const dimDir = (flagDim && selfBarValue !== null && coachBarValue !== null) ? (selfBarValue > coachBarValue ? 'up' : 'down') : null;
            return (
              <div key={dim.key} className="flex items-center gap-1.5 flex-1">
                <div className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: dim.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-end gap-0.5 mb-0.5">
                    {coachBarValue !== null && <span className="text-[9px] font-bold text-dark-600">{coachBarValue.toFixed(1)}</span>}
                    {hasSelf && selfBarValue !== null && <span className="text-[9px] text-indigo-500">/{selfBarValue.toFixed(1)}</span>}
                    {dimDir === 'up' && <Tip label="Self-rated higher"><ArrowUp size={8} className="text-green-500" /></Tip>}
                    {dimDir === 'down' && <Tip label="Self-rated lower"><ArrowDown size={8} className="text-red-500" /></Tip>}
                  </div>
                  {coachBarValue !== null && (
                    <div className="h-1 bg-dark-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(coachBarValue / 5) * 100}%`, backgroundColor: dim.color }} />
                    </div>
                  )}
                  {hasSelf && selfBarValue !== null && (
                    <div className={`h-0.5 bg-dark-100 rounded-full overflow-hidden ${coachBarValue !== null ? 'mt-0.5' : ''}`}>
                      <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(selfBarValue / 5) * 100}%` }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )} {/* end both-basic ternary */}
        {/* Action buttons — stop propagation so they don't toggle expand */}
        <div className="flex items-center gap-0.5 shrink-0">
          {!readOnly && (
            <button title="Edit rating" onClick={e => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-700">
              <Pencil size={13} />
            </button>
          )}
        </div>
        <ChevronDown size={14} className={`text-dark-400 transition-transform duration-200 shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            {hasSelf && !(effectiveCoachMode === 'basic' && effectiveSelfMode === 'basic') && (
              <div className="mx-4 mt-2 mb-1 flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 font-semibold text-dark-500"><span className="w-2 h-2 rounded-full bg-dark-400 inline-block" /> Coach</span>
                <span className="flex items-center gap-1 font-semibold text-indigo-500"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Self</span>
                {sameSystem && (
                  <span className="flex items-center gap-2 font-semibold ml-auto">
                    <span className="flex items-center gap-0.5 text-green-500"><ArrowUp size={9} /> self higher</span>
                    <span className="flex items-center gap-0.5 text-red-500"><ArrowDown size={9} /> self lower</span>
                  </span>
                )}
              </div>
            )}
            {/* Coach Overall banner — only when coachMode=basic and comparison is active */}
            {effectiveCoachMode === 'basic' && hasSelf && (
              <div className="mx-4 mt-2 mb-1 flex items-center gap-2 text-[10px]">
                <span className="font-bold text-dark-600">Coach Overall:</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={11} className={n <= (player.overall || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-dark-200'} />
                  ))}
                </div>
                {player.overall !== null && <span className="font-bold text-dark-700">{player.overall}</span>}
              </div>
            )}
            {/* Divider between the two overall banners when c=b & p=b */}
            {effectiveCoachMode === 'basic' && effectiveSelfMode === 'basic' && hasSelf && !selfPending && (
              <hr className="mx-4 border-dark-100" />
            )}
            {/* Player Overall banner — when p=b and self has submitted */}
            {effectiveSelfMode === 'basic' && hasSelf && !selfPending && selfPlayer!.overall !== null && (
              <div className="mx-4 mt-1 mb-1 flex items-center gap-2 text-[10px]">
                <span className="font-bold text-indigo-600">Player Overall:</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={11} className={n <= (selfPlayer!.overall || 0) ? 'text-indigo-400 fill-indigo-400' : 'text-dark-200'} />
                  ))}
                </div>
                <span className="font-bold text-indigo-500">{selfPlayer!.overall}</span>
              </div>
            )}
            {!(effectiveCoachMode === 'basic' && effectiveSelfMode === 'basic') && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
              {dimensions.map(dim => (
                <div key={dim.key} className="rounded-lg border border-dark-100 overflow-hidden">
                  <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: dim.color + '0a' }}>
                    <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: dim.color }} />
                    <span className="text-xs font-bold" style={{ color: dim.color }}>{dim.label}</span>
                    {player.dimensionComments?.[dim.key] && (
                      <div className="relative group/dc">
                        <MessageSquare size={10} className="text-dark-300 hover:text-dark-500 cursor-default shrink-0" />
                        <div className="absolute bottom-full left-0 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/dc:opacity-100 pointer-events-none transition-opacity z-20 max-w-[200px] truncate">
                          {player.dimensionComments[dim.key]}
                          <div className="absolute top-full left-2 border-4 border-transparent border-t-dark-900" />
                        </div>
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-1.5">
                      {effectiveCoachMode === 'advanced' && (
                        <span className="text-[10px] font-bold" style={{ color: dim.color }}>
                          {avgOf(dim.attributes.map(a => player.attributes[a.key]))}
                        </span>
                      )}
                      {effectiveCoachMode === 'dimensional' && player.dimensions[dim.key] !== null && (
                        <span className="text-[10px] font-bold" style={{ color: dim.color }}>
                          {(player.dimensions[dim.key] as number).toFixed(1)}
                        </span>
                      )}
                      {selfPlayer && (() => {
                        if (selfPending) return <span className="text-[10px] font-bold text-dark-300">/ —</span>;
                        // Pick self value based on effectiveSelfMode
                        const selfDimAvg = effectiveSelfMode === 'advanced'
                          ? avgOf(dim.attributes.map(a => selfPlayer.attributes[a.key]))
                          : effectiveSelfMode === 'dimensional' && selfPlayer.dimensions[dim.key] !== null
                            ? (selfPlayer.dimensions[dim.key] as number).toFixed(1)
                            : null;
                        if (!selfDimAvg) return null; // basic: no self dim avg
                        const coachDimAvg = effectiveCoachMode === 'advanced'
                          ? avgOf(dim.attributes.map(a => player.attributes[a.key]))
                          : effectiveCoachMode === 'dimensional' && player.dimensions[dim.key] !== null
                            ? String((player.dimensions[dim.key] as number).toFixed(1))
                            : null;
                        const diff = (coachDimAvg && coachDimAvg !== 'N/A' && selfDimAvg !== 'N/A')
                          ? parseFloat(selfDimAvg) - parseFloat(coachDimAvg)
                          : null;
                        return (
                          <span className="flex items-center gap-0.5">
                            <span className="text-[10px] font-bold text-indigo-500">/ {selfDimAvg}</span>
                            {diff !== null && Math.abs(diff) >= 1 && diff > 0 && <Tip label="Self-rated higher"><ArrowUp size={9} className="text-green-500" /></Tip>}
                            {diff !== null && Math.abs(diff) >= 1 && diff < 0 && <Tip label="Self-rated lower"><ArrowDown size={9} className="text-red-500" /></Tip>}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="px-3 py-1.5 space-y-1">
                    {dim.attributes.map(attr => {
                      const val = player.attributes[attr.key];
                      const selfVal = selfPlayer ? selfPlayer.attributes[attr.key] : null;
                      const flagged = hasSelf && sameSystem && effectiveCoachMode !== 'basic'
                        && effectiveSelfMode === 'advanced'
                        && val !== null && selfVal !== null && Math.abs(val - selfVal) >= 1;
                      const attrDir = (flagged && val !== null && selfVal !== null)
                        ? (selfVal > val ? 'up' : 'down') : null;
                      const attrComment = player.attributeComments?.[attr.key];
                      return (
                        <div key={attr.key} className={`flex items-center justify-between py-0.5 px-1 rounded ${attrDir === 'up' ? 'bg-green-50' : attrDir === 'down' ? 'bg-red-50' : ''}`}>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-dark-600">{attr.label}</span>
                            {attrDir === 'up' && <Tip label="Player rates self higher"><ArrowUp size={9} className="text-green-500 shrink-0" /></Tip>}
                            {attrDir === 'down' && <Tip label="Player rates self lower"><ArrowDown size={9} className="text-red-500 shrink-0" /></Tip>}
                            {attrComment && (
                              <div className="relative group/ac">
                                <MessageSquare size={9} className="text-dark-300 hover:text-dark-500 cursor-default shrink-0" />
                                <div className="absolute bottom-full left-0 mb-1.5 px-2 py-1 bg-dark-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/ac:opacity-100 pointer-events-none transition-opacity z-20 max-w-[180px] truncate">
                                  {attrComment}
                                  <div className="absolute top-full left-2 border-4 border-transparent border-t-dark-900" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* Coach dots — only when coach has attribute-level data */}
                            {(!hasSelf || effectiveCoachMode === 'advanced') && (
                              val === null ? (
                                <span className="text-[9px] font-bold text-dark-300 bg-dark-50 px-1 rounded">N/A</span>
                              ) : (
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(n => (
                                    <div key={n} className="w-2 h-2 rounded-full" style={{ backgroundColor: n <= val ? dim.color : '#ebedf0' }} />
                                  ))}
                                  <span className="text-[10px] font-bold ml-0.5" style={{ color: dim.color }}>{val}</span>
                                </div>
                              )
                            )}
                            {/* Separator between coach and self — only when both show attr dots */}
                            {hasSelf && !selfPending && effectiveCoachMode === 'advanced' && effectiveSelfMode === 'advanced' && (
                              <span className="w-px h-3 bg-dark-200 shrink-0" />
                            )}
                            {/* Self dots — only when self has attribute-level data */}
                            {hasSelf && effectiveSelfMode === 'advanced' && (
                              selfPending ? (
                                <span className="text-[10px] text-dark-300 italic">—</span>
                              ) : selfVal === null ? (
                                <span className="text-[9px] font-bold text-indigo-300 bg-indigo-50 px-1 rounded">N/A</span>
                              ) : (
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(n => (
                                    <div key={n} className="w-2 h-2 rounded-full" style={{ backgroundColor: n <= selfVal ? '#4F46E5' : '#ebedf0' }} />
                                  ))}
                                  <span className="text-[10px] font-bold text-indigo-500 ml-0.5">{selfVal}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            )}
            {(player.comment || (selfPlayer && selfPlayer.comment && !selfPending)) && (
              <div className="px-4 pb-3 space-y-1.5">
                {player.comment && (
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] font-bold text-dark-400 uppercase tracking-wider shrink-0 mt-1">Coach</span>
                    <p className="text-[11px] text-dark-500 italic bg-dark-50/50 px-3 py-2 rounded-lg flex-1">"{player.comment}" — {player.ratedBy}</p>
                  </div>
                )}
                {selfPlayer && selfPlayer.comment && !selfPending && (
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider shrink-0 mt-1">Player</span>
                    <p className="text-[11px] text-indigo-600 italic bg-indigo-50/50 px-3 py-2 rounded-lg flex-1">"{selfPlayer.comment}" — {selfPlayer.ratedBy}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
