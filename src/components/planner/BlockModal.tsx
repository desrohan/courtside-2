import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Check } from 'lucide-react';
import type { PlannerBlock, PlannerCycle } from '@/data/planner';
import { activityAttributes } from '@/data/settings';

interface BlockModalProps {
  block: PlannerBlock | null;
  trackId: string;
  cycles: PlannerCycle[];
  activityId: string;
  onClose: () => void;
  onSave: (b: PlannerBlock) => void;
}

export default function BlockModal({ block, trackId, cycles, activityId, onClose, onSave }: BlockModalProps) {
  const [name, setName] = useState(block?.name || '');
  const [cycleId, setCycleId] = useState(block?.cycleId || cycles[0]?.id || '');
  const [startDate, setStartDate] = useState(block?.startDate || '');
  const [endDate, setEndDate] = useState(block?.endDate || '');
  const [color, setColor] = useState(block?.color || '#C8E6C9');
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>(block?.attributeIds || []);

  const attrs = activityAttributes.filter(a => a.activityId === activityId);
  const toggleAttr = (id: string) => setSelectedAttrs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSave = () => {
    if (!name || !cycleId || !startDate || !endDate) return;
    onSave({
      id: block?.id || `blk-${Date.now()}`,
      cycleId,
      trackId,
      name,
      startDate,
      endDate,
      color,
      attributeIds: selectedAttrs,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-base font-bold text-dark-900">{block ? 'Edit Block' : 'Create Block'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20"
              placeholder="e.g. Speed & Agility" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Cycle *</label>
            <select value={cycleId} onChange={e => setCycleId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
              <option value="">Select cycle...</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Start Date *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">End Date *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-10 h-9 rounded-lg border border-dark-200 cursor-pointer" />
              <input value={color} onChange={e => setColor(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-dark-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
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
