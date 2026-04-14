import { motion } from 'framer-motion';
import { Eye, FileText, KeyRound, Shield, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { governanceConfigs, governingBodies, resolveAthleteRequirements } from '@/data/governance';

export default function InheritancePreview() {
  const config = governanceConfigs[0];

  const firstTime16 = resolveAthleteRequirements(config, 16, 'first_time');
  const firstTime20 = resolveAthleteRequirements(config, 20, 'first_time');
  const existing = resolveAthleteRequirements(config, 22, 'existing');
  const transfer = resolveAthleteRequirements(config, 24, 'transfer', 'contract_active');

  const scenarios = [
    { label: 'New Player (Under 18)', age: 16, pathway: 'first_time' as const, result: firstTime16 },
    { label: 'New Player (Adult)', age: 20, pathway: 'first_time' as const, result: firstTime20 },
    { label: 'Existing Player', age: 22, pathway: 'existing' as const, result: existing },
    { label: 'Transfer (Contract Active)', age: 24, pathway: 'transfer' as const, result: transfer },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={16} className="text-court-500" />
          <h2 className="text-sm font-bold text-dark-900">Inheritance Preview</h2>
        </div>
        <p className="text-xs text-dark-500">
          This preview shows what athletes will inherit from your governance configuration.
          Requirements change dynamically based on the athlete's age, registration pathway, and transfer status.
        </p>
      </div>

      {/* Governing Bodies Inherited */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
        <h3 className="text-xs font-bold text-dark-700 flex items-center gap-2"><Shield size={14} className="text-blue-500" /> Governing Bodies</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {config.governingBodyConfigs.map((bc, i) => {
            const body = governingBodies.find(b => b.id === bc.governingBodyId);
            return (
              <div key={bc.governingBodyId} className="flex items-center gap-2">
                {i > 0 && <ArrowRight size={12} className="text-dark-300" />}
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">{body?.abbreviation || bc.governingBodyName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-2 gap-4">
        {scenarios.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-dark-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-dark-800">{s.label}</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-dark-100 text-dark-500">Age {s.age}</span>
            </div>

            {/* Required IDs */}
            <div>
              <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><KeyRound size={10} /> Required IDs</p>
              {s.result.requiredIds.length === 0 ? (
                <p className="text-[11px] text-dark-400 italic">No IDs required</p>
              ) : (
                <div className="space-y-1">
                  {s.result.requiredIds.map(id => (
                    <div key={id.id} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 size={11} className="text-court-500" />
                      <span className="text-dark-600">{id.label}</span>
                      <span className="text-[9px] text-dark-400">({id.scope})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Required Documents */}
            <div>
              <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><FileText size={10} /> Required Documents</p>
              {s.result.requiredDocuments.length === 0 ? (
                <p className="text-[11px] text-dark-400 italic">No documents required</p>
              ) : (
                <div className="space-y-1">
                  {s.result.requiredDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center gap-1.5 text-[11px]">
                      <CheckCircle2 size={11} className="text-orange-500" />
                      <span className="text-dark-600">{doc.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Flags */}
            <div className="flex gap-2 flex-wrap">
              {s.result.showTransferFlow && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 flex items-center gap-1">
                  <AlertCircle size={9} /> Transfer / NOC Flow
                </span>
              )}
              {s.result.approvalWorkflowEnabled && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 flex items-center gap-1">
                  <AlertCircle size={9} /> Approval Workflow
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document Requirements Summary */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
        <h3 className="text-xs font-bold text-dark-700 flex items-center gap-2"><FileText size={14} className="text-orange-500" /> All Document Requirements</h3>
        <div className="space-y-2">
          {config.documentRequirements.map(doc => (
            <div key={doc.id} className="flex items-start gap-3 bg-dark-50 rounded-lg px-3 py-2">
              <FileText size={13} className="text-dark-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-dark-700">{doc.label}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {doc.conditions.pathway && (
                    <span className="text-[10px] text-dark-400">Pathway: {doc.conditions.pathway.join(', ')}</span>
                  )}
                  {doc.conditions.ageRange?.max && (
                    <span className="text-[10px] text-dark-400">&middot; Age ≤ {doc.conditions.ageRange.max}</span>
                  )}
                  {doc.conditions.transferStatus && (
                    <span className="text-[10px] text-dark-400">&middot; Transfer: {doc.conditions.transferStatus.join(', ')}</span>
                  )}
                </div>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${doc.required ? 'bg-red-50 text-red-600' : 'bg-dark-100 text-dark-500'}`}>
                {doc.required ? 'Required' : 'Optional'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}