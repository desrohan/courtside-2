import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import type { TrackGroup } from '@/data/planner';

interface TrackGroupModalProps {
  seasonId: string;
  onClose: () => void;
  onSave: (g: TrackGroup) => void;
}

export default function TrackGroupModal({ seasonId, onClose, onSave }: TrackGroupModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8E33FF');

  const handleSave = () => {
    if (!name) return;
    onSave({
      id: `tg-${Date.now()}`,
      seasonId,
      name,
      color,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h3 className="text-base font-bold text-dark-900">Create Track Group</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Group Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20"
              placeholder="e.g. Mid-fielders" />
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
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={handleSave} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
            <Save size={15} /> Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
