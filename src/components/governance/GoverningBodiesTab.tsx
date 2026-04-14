import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ChevronDown, Globe, Flag, MapPin, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import {
  governanceConfigs, governingBodyChains, governingBodies,
  type GoverningBodyConfig, type GoverningBody,
} from '@/data/governance';

const levelIcons: Record<string, React.ReactNode> = {
  global: <Globe size={14} className="text-blue-500" />,
  national: <Flag size={14} className="text-green-500" />,
  regional: <MapPin size={14} className="text-orange-500" />,
  state: <MapPin size={14} className="text-purple-500" />,
  optional: <Building2 size={14} className="text-dark-400" />,
};

const levelColors: Record<string, string> = {
  global: '#3B82F6',
  national: '#22C55E',
  regional: '#F97316',
  state: '#A855F7',
  optional: '#919EAB',
};

export default function GoverningBodiesTab() {
  const config = governanceConfigs[0]; // FC Courtside
  const [sport] = useState(config.sport);
  const [country] = useState(config.country);

  // Find matching chain
  const chain = governingBodyChains.find(c => c.sport === sport && c.country === country);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Context Selectors */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-dark-900">Governance Context</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Sport</label>
            <div className="mt-1 h-9 px-3 rounded-xl border border-dark-200 bg-dark-50 flex items-center text-sm text-dark-700">{sport}</div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Country</label>
            <div className="mt-1 h-9 px-3 rounded-xl border border-dark-200 bg-dark-50 flex items-center text-sm text-dark-700">{country}</div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">State / Region</label>
            <div className="mt-1 h-9 px-3 rounded-xl border border-dark-200 bg-dark-50 flex items-center text-sm text-dark-400">{config.state || 'Not set'}</div>
          </div>
        </div>
        {chain && (
          <div className="flex items-center gap-2 text-xs text-dark-500 bg-court-50 rounded-lg px-3 py-2">
            <Globe size={13} className="text-court-500" />
            <span>Auto-detected chain: <strong className="text-dark-700">{chain.bodies.map(b => b.abbreviation).join(' → ')}</strong></span>
          </div>
        )}
      </div>

      {/* Configured Bodies */}
      <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-dark-900">Configured Governing Bodies</h2>
          <button className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5">
            <Plus size={14} /> Add Body
          </button>
        </div>

        <div className="divide-y divide-dark-100">
          {config.governingBodyConfigs.map(bodyConfig => {
            const body = governingBodies.find(b => b.id === bodyConfig.governingBodyId);
            if (!body) return null;
            return (
              <GoverningBodyRow key={bodyConfig.governingBodyId} body={body} config={bodyConfig} />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function GoverningBodyRow({ body, config }: { body: GoverningBody; config: GoverningBodyConfig }) {
  const [expanded, setExpanded] = useState(false);

  const toggles = [
    { key: 'askExistingId', label: 'Ask "Already Registered?"', value: config.askExistingId },
    { key: 'allowUnsureOption', label: 'Allow "Not Sure" Option', value: config.allowUnsureOption },
    { key: 'requireTransferLogic', label: 'Require Transfer / NOC Logic', value: config.requireTransferLogic },
    { key: 'requireDocumentsIfUnregistered', label: 'Require Documents if Unregistered', value: config.requireDocumentsIfUnregistered },
    { key: 'approvalWorkflowEnabled', label: 'Enable Approval Workflow', value: config.approvalWorkflowEnabled },
  ];

  return (
    <div className="group">
      <div className="px-5 py-3 flex items-center gap-4 hover:bg-dark-50/30 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: levelColors[body.level] + '15' }}>
          {levelIcons[body.level]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-dark-800">{body.abbreviation}</p>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold capitalize" style={{ backgroundColor: levelColors[body.level] + '15', color: levelColors[body.level] }}>{body.level}</span>
            {body.required && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600">Required</span>}
          </div>
          <p className="text-[11px] text-dark-400 truncate">{body.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-dark-400">{config.requiredIds.length} ID{config.requiredIds.length !== 1 ? 's' : ''}</span>
          <ChevronDown size={14} className={`text-dark-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-4 space-y-3 border-t border-dark-50">
          {/* Required IDs */}
          {config.requiredIds.length > 0 && (
            <div className="pt-3">
              <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-2">Required External IDs</p>
              <div className="space-y-1.5">
                {config.requiredIds.map(idTpl => (
                  <div key={idTpl.id} className="flex items-center justify-between bg-dark-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-dark-700">{idTpl.label}</p>
                      <p className="text-[10px] text-dark-400">Type: {idTpl.idType} &middot; Scope: {idTpl.scope} {idTpl.example && <>Example: {idTpl.example}</>}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${idTpl.required ? 'bg-red-50 text-red-600' : 'bg-dark-100 text-dark-500'}`}>
                      {idTpl.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Config Toggles */}
          <div className="pt-2">
            <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider mb-2">Registration Rules</p>
            <div className="grid grid-cols-1 gap-2">
              {toggles.map(t => (
                <div key={t.key} className="flex items-center justify-between px-3 py-2 bg-dark-50 rounded-lg">
                  <span className="text-xs text-dark-600">{t.label}</span>
                  {t.value
                    ? <ToggleRight size={20} className="text-court-500" />
                    : <ToggleLeft size={20} className="text-dark-300" />
                  }
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
