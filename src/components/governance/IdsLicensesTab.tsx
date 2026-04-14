import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, KeyRound, BadgeCheck } from 'lucide-react';
import { governanceConfigs, governingBodies } from '@/data/governance';

export default function IdsLicensesTab() {
  const config = governanceConfigs[0];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Organization IDs */}
      <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-dark-900 flex items-center gap-2"><KeyRound size={15} className="text-court-500" /> Organization IDs</h2>
            <p className="text-[11px] text-dark-400 mt-0.5">IDs your organization holds with governing bodies</p>
          </div>
          <button className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </div>

        {config.orgIds.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-dark-400">No organization IDs configured</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50/60">
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">ID Label</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Governing Body</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Example</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Required</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {config.orgIds.map(oid => {
                const body = governingBodies.find(b => b.id === oid.governingBodyId);
                return (
                  <tr key={oid.id} className="hover:bg-dark-50/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-dark-800">{oid.label}</td>
                    <td className="px-5 py-3 text-xs text-dark-500">{body?.abbreviation || '—'}</td>
                    <td className="px-5 py-3 text-xs text-dark-400 font-mono">{oid.example || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${oid.required ? 'bg-red-50 text-red-600' : 'bg-dark-100 text-dark-500'}`}>
                        {oid.required ? 'Required' : 'Optional'}
                      </span>
                    </td>
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

      {/* User / Staff IDs */}
      <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-dark-900 flex items-center gap-2"><BadgeCheck size={15} className="text-purple-500" /> User & Staff IDs</h2>
            <p className="text-[11px] text-dark-400 mt-0.5">Licenses and certifications required for coaches, referees, and staff</p>
          </div>
          <button className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </div>

        {config.userIds.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-dark-400">No user IDs configured</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50/60">
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">License / ID</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Governing Body</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Applies To</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Example</th>
                <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Required</th>
                <th className="text-right px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {config.userIds.map(uid => {
                const body = governingBodies.find(b => b.id === uid.governingBodyId);
                return (
                  <tr key={uid.id} className="hover:bg-dark-50/30 transition-colors">
                    <td className="px-5 py-3 text-sm font-semibold text-dark-800">{uid.label}</td>
                    <td className="px-5 py-3 text-xs text-dark-500">{body?.abbreviation || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {uid.roles.map(r => (
                          <span key={r} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 capitalize">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-dark-400 font-mono">{uid.example || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${uid.required ? 'bg-red-50 text-red-600' : 'bg-dark-100 text-dark-500'}`}>
                        {uid.required ? 'Required' : 'Optional'}
                      </span>
                    </td>
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
