import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Building } from 'lucide-react';
import { governanceConfigs, governingBodies, associations as allAssociations, type Association } from '@/data/governance';

export default function AssociationsTab() {
  const config = governanceConfigs[0];
  const items = config.associations.length > 0 ? config.associations : allAssociations.filter(a => a.sport === config.sport);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-dark-900">Associations & Conferences</h2>
            <p className="text-[11px] text-dark-400 mt-0.5">Membership structures linked to governing bodies</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </div>

        {showAdd && (
          <div className="px-5 py-4 border-b border-dark-100 bg-dark-50/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Name</label>
                <input className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" placeholder="Association name" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Type</label>
                <select className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20">
                  <option value="association">Association</option>
                  <option value="conference">Conference</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Linked Governing Body</label>
                <select className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20">
                  {config.governingBodyConfigs.map(bc => (
                    <option key={bc.governingBodyId} value={bc.governingBodyId}>{bc.governingBodyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Level</label>
                <input className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" placeholder="e.g. District, State" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowAdd(false)} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
              <button className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600">Save</button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Building size={32} className="mx-auto text-dark-300 mb-2" />
            <p className="text-sm text-dark-400">No associations configured yet</p>
            <p className="text-[11px] text-dark-300 mt-1">Add associations or conferences linked to your governing bodies</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50/60">
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Name</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Type</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Level</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Governing Body</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {items.map((assoc: Association) => {
                const body = governingBodies.find(b => b.id === assoc.governingBodyId);
                return (
                  <tr key={assoc.id} className="hover:bg-dark-50/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-dark-800">{assoc.name}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${assoc.type === 'association' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {assoc.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-dark-500">{assoc.level}</td>
                    <td className="px-5 py-3 text-xs text-dark-500">{body?.abbreviation || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400"><Pencil size={13} /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
