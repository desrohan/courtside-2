import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Check } from 'lucide-react';
import type { Track } from '@/data/planner';
import { activityAttributes } from '@/data/settings';
import { users } from '@/data/users';
import { teams } from '@/data/teams';

interface TrackModalProps {
  trackGroupId: string;
  activityId: string;
  onClose: () => void;
  onSave: (t: Track) => void;
}

export default function TrackModal({ trackGroupId, activityId, onClose, onSave }: TrackModalProps) {
  const [name, setName] = useState('');
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const attrs = activityAttributes.filter(a => a.activityId === activityId);
  const toggleAttr = (id: string) => setSelectedAttrs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleUser = (id: string) => setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleTeam = (id: string) => setSelectedTeams(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSave = () => {
    if (!name) return;
    onSave({
      id: `tr-${Date.now()}`,
      trackGroupId,
      name,
      attributeIds: selectedAttrs,
      userIds: selectedUsers,
      teamIds: selectedTeams,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-base font-bold text-dark-900">Create Track</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Track Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20"
              placeholder="e.g. Dribbling" />
          </div>
          {/* Attributes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-2">Attributes</label>
            <div className="flex flex-wrap gap-1.5">
              {attrs.map(a => (
                <button key={a.id} onClick={() => toggleAttr(a.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedAttrs.includes(a.id) ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>
                  {selectedAttrs.includes(a.id) && <Check size={10} />}
                  {a.name}
                </button>
              ))}
            </div>
          </div>
          {/* Teams */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-2">Teams</label>
            <div className="flex flex-wrap gap-1.5">
              {teams.map(t => (
                <button key={t.id} onClick={() => toggleTeam(t.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedTeams.includes(t.id) ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>
                  {selectedTeams.includes(t.id) && <Check size={10} />}
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          {/* Users */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-2">Users</label>
            <div className="max-h-40 overflow-y-auto space-y-0.5 border border-dark-100 rounded-xl p-2">
              {users.filter(u => u.role === 'player' || u.role === 'coach').map(u => (
                <button key={u.id} onClick={() => toggleUser(u.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-50 text-left transition-colors">
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                    selectedUsers.includes(u.id) ? 'bg-court-500 border-court-500' : 'border-dark-300'}`}>
                    {selectedUsers.includes(u.id) && <Check size={8} className="text-white" />}
                  </div>
                  <span className="text-[11px] text-dark-600">{u.firstName} {u.lastName}</span>
                  <span className="ml-auto text-[9px] text-dark-400 capitalize">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={handleSave} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
            <Save size={15} /> Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
