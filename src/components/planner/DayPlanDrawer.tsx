import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Calendar, Clock, FileText, Check, Users } from 'lucide-react';
import type { DayPlan, Track, PlannerCycle, PlannerBlock } from '@/data/planner';
import { drills } from '@/data/drills';
import { activityAttributes } from '@/data/settings';
import { users } from '@/data/users';
import { teams } from '@/data/teams';

interface DayPlanDrawerProps {
  dayPlan: DayPlan | null;
  defaults: { trackId: string; date: string } | null;
  tracks: Track[];
  cycles: PlannerCycle[];
  blocks: PlannerBlock[];
  activityId: string;
  onClose: () => void;
  onSave: (dp: DayPlan) => void;
}

export default function DayPlanDrawer({ dayPlan, defaults, tracks, cycles, blocks, activityId, onClose, onSave }: DayPlanDrawerProps) {
  const trackId = dayPlan?.trackId || defaults?.trackId || '';
  const date = dayPlan?.date || defaults?.date || '';
  const track = tracks.find(t => t.id === trackId);

  // Auto-determine cycle and block from date
  const linkedCycle = useMemo(() => {
    const d = new Date(date);
    return cycles.find(c => d >= new Date(c.startDate) && d <= new Date(c.endDate));
  }, [date, cycles]);

  const linkedBlock = useMemo(() => {
    const d = new Date(date);
    return blocks.find(b => b.trackId === trackId && d >= new Date(b.startDate) && d <= new Date(b.endDate));
  }, [date, trackId, blocks]);

  const [durationMinutes, setDurationMinutes] = useState(dayPlan?.durationMinutes || 60);
  const [selectedDrills, setSelectedDrills] = useState<string[]>(dayPlan?.drillIds || []);
  const [notes, setNotes] = useState(dayPlan?.notes || '');
  const [inheritUsers, setInheritUsers] = useState(dayPlan?.inheritUsersFromTrack ?? true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(dayPlan?.userIds || track?.userIds || []);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(dayPlan?.teamIds || track?.teamIds || []);

  const activityDrills = drills.filter(d => d.activityId === activityId);

  const toggleDrill = (id: string) => setSelectedDrills(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleUser = (id: string) => setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleTeam = (id: string) => setSelectedTeams(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSave = () => {
    onSave({
      id: dayPlan?.id || `dp-${Date.now()}`,
      trackId,
      date,
      cycleId: linkedCycle?.id || '',
      blockId: linkedBlock?.id || '',
      drillIds: selectedDrills,
      notes: notes || undefined,
      userIds: selectedUsers,
      teamIds: selectedTeams,
      inheritUsersFromTrack: inheritUsers,
      durationMinutes,
    });
  };

  const dateFormatted = date ? new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-drawer flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-court-500 to-court-600 px-6 py-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{dayPlan ? 'Edit Day Plan' : 'Create Day Plan'}</h2>
              <p className="text-sm text-white/80 mt-0.5">{track?.name} &middot; {dateFormatted}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Read-only context */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-50/60 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Linked Cycle</div>
              <div className="flex items-center gap-2">
                {linkedCycle && <div className="w-3 h-3 rounded" style={{ backgroundColor: linkedCycle.color }} />}
                <span className="text-xs font-semibold text-dark-700">{linkedCycle?.name || 'None'}</span>
              </div>
            </div>
            <div className="bg-dark-50/60 rounded-xl p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Linked Block</div>
              <div className="flex items-center gap-2">
                {linkedBlock && <div className="w-3 h-3 rounded" style={{ backgroundColor: linkedBlock.color }} />}
                <span className="text-xs font-semibold text-dark-700">{linkedBlock?.name || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">
              <Clock size={12} /> Duration (minutes) *
            </label>
            <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))}
              min={5} step={5}
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>

          {/* Drills multi-select */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-2">
              <Calendar size={12} /> Drills / Sessions
            </label>
            <div className="border border-dark-100 rounded-xl overflow-hidden">
              <div className="max-h-48 overflow-y-auto divide-y divide-dark-50">
                {activityDrills.map(drill => {
                  const selected = selectedDrills.includes(drill.id);
                  const drillAttrs = drill.attributeIds.map(id => activityAttributes.find(a => a.id === id)?.name).filter(Boolean);
                  return (
                    <button key={drill.id} onClick={() => toggleDrill(drill.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${selected ? 'bg-court-50' : 'hover:bg-dark-50/50'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected ? 'bg-court-500 border-court-500' : 'border-dark-300'}`}>
                        {selected && <Check size={10} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-dark-700">{drill.name}</div>
                        <div className="text-[10px] text-dark-400 flex items-center gap-2 mt-0.5">
                          <span>{drill.durationMinutes}m</span>
                          <span className={`px-1 rounded text-[9px] font-bold ${
                            drill.intensity === 'high' ? 'bg-red-50 text-red-500' :
                            drill.intensity === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-green-50 text-green-500'}`}>
                            {drill.intensity}
                          </span>
                          {drillAttrs.length > 0 && <span className="text-dark-300 truncate">{drillAttrs.join(', ')}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedDrills.length > 0 && (
              <p className="text-[10px] text-court-600 font-semibold mt-1">{selectedDrills.length} drill{selectedDrills.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">
              <FileText size={12} /> Notes (optional)
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 resize-none"
              placeholder="Add notes about this day plan..." />
          </div>

          {/* Users / Teams */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-2">
              <Users size={12} /> Users & Teams
            </label>
            {/* Inherit toggle */}
            <button onClick={() => setInheritUsers(!inheritUsers)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-dark-100 hover:border-court-200 transition-colors mb-3">
              <div className="text-left">
                <p className="text-xs font-semibold text-dark-700">Inherit from track</p>
                <p className="text-[10px] text-dark-400">Use users assigned to {track?.name || 'this track'}</p>
              </div>
              <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${inheritUsers ? 'bg-court-500 justify-end' : 'bg-dark-200 justify-start'}`}>
                <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
              </div>
            </button>
            {/* Teams */}
            <div className="mb-2">
              <div className="text-[10px] font-bold text-dark-400 mb-1">Teams</div>
              <div className="flex flex-wrap gap-1.5">
                {teams.map(t => (
                  <button key={t.id} onClick={() => toggleTeam(t.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedTeams.includes(t.id) ? 'bg-court-50 text-court-700 border border-court-200' : 'bg-dark-50 text-dark-500 hover:bg-dark-100 border border-transparent'}`}>
                    {selectedTeams.includes(t.id) && <Check size={10} />}
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Additional users */}
            <div>
              <div className="text-[10px] font-bold text-dark-400 mb-1">Additional Users</div>
              <div className="max-h-32 overflow-y-auto space-y-0.5 border border-dark-100 rounded-xl p-2">
                {users.filter(u => u.role === 'player' || u.role === 'coach').map(u => {
                  const isTrackUser = track?.userIds.includes(u.id);
                  return (
                    <button key={u.id} onClick={() => toggleUser(u.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-50 text-left transition-colors">
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                        selectedUsers.includes(u.id) ? 'bg-court-500 border-court-500' : 'border-dark-300'}`}>
                        {selectedUsers.includes(u.id) && <Check size={8} className="text-white" />}
                      </div>
                      <span className="text-[11px] text-dark-600 flex-1">{u.firstName} {u.lastName}</span>
                      {isTrackUser && <span className="text-[9px] text-court-500 font-bold">TRACK</span>}
                      <span className="text-[9px] text-dark-400 capitalize">{u.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={handleSave} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
            <Save size={15} /> Save Day Plan
          </button>
        </div>
      </motion.div>
    </div>
  );
}
