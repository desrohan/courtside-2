import { motion } from 'framer-motion';
import {
  Shield, AlertCircle, CheckCircle2, Clock, FileText, KeyRound,
  ArrowRight, ChevronRight, Check, XCircle, ToggleRight, ToggleLeft,
} from 'lucide-react';
import {
  type AthleteRegistration, registrationStatusLabels, registrationStatusColors,
  approvalStatusLabels, approvalStatusColors, transferStatusLabels, transferStatusColors,
  getRegistrationCompletionPercent,
} from '@/data/athleteRegistration';
import { getGovernanceConfig, governingBodies } from '@/data/governance';

interface Props {
  registration: AthleteRegistration;
  onStartWizard: () => void;
}

const approvalSteps = ['draft', 'submitted', 'state_approval_pending', 'state_approved', 'national_approval_pending', 'national_approved'] as const;

export default function RegistrationStatusCard({ registration, onStartWizard }: Props) {
  const completion = getRegistrationCompletionPercent(registration);
  const config = getGovernanceConfig(registration.organizationId);
  const statusColor = registrationStatusColors[registration.registrationStatus];

  const missingIds = config?.governingBodyConfigs
    .flatMap(bc => bc.requiredIds.filter(id => id.required))
    .filter(idTpl => !registration.externalIds.some(eid => eid.idType === idTpl.idType)) || [];

  const missingDocs = registration.documents.filter(d => d.verificationStatus === 'not_uploaded');
  const pendingDocs = registration.documents.filter(d => d.verificationStatus === 'pending');
  const rejectedDocs = registration.documents.filter(d => d.verificationStatus === 'rejected');

  const workflowActive = registration.governingWorkflow &&
    registration.governingWorkflow.stateApprovalStatus !== 'draft';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Status Banner */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: statusColor + '15' }}>
              <Shield size={20} style={{ color: statusColor }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-dark-900">Registration Status</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ backgroundColor: statusColor + '15', color: statusColor }}>
                  {registrationStatusLabels[registration.registrationStatus]}
                </span>
                {registration.registrationPathway && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-dark-100 text-dark-500 capitalize">
                    {registration.registrationPathway.replace('_', ' ')}
                  </span>
                )}
                {registration.transferStatus !== 'not_applicable' && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                    style={{ backgroundColor: transferStatusColors[registration.transferStatus] + '15', color: transferStatusColors[registration.transferStatus] }}>
                    {transferStatusLabels[registration.transferStatus]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {completion < 100 && (
            <button onClick={onStartWizard}
              className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
              Complete Registration <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-dark-500">Completion</span>
            <span className="text-[11px] font-bold text-dark-700">{completion}%</span>
          </div>
          <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-court-500 transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

        {/* Sport Context */}
        <div className="flex gap-2 text-[11px]">
          <span className="px-2 py-1 bg-dark-50 rounded-lg text-dark-600">
            {registration.sportContext.sport}
          </span>
          <span className="px-2 py-1 bg-dark-50 rounded-lg text-dark-600">
            {registration.sportContext.country}
          </span>
          {registration.sportContext.state && (
            <span className="px-2 py-1 bg-dark-50 rounded-lg text-dark-600">
              {registration.sportContext.state}
            </span>
          )}
        </div>
      </div>

      {/* Governing Bodies */}
      {config && (
        <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
          <h3 className="text-xs font-bold text-dark-700">Governing Bodies</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {config.governingBodyConfigs.map((bc, i) => {
              const body = governingBodies.find(b => b.id === bc.governingBodyId);
              return (
                <div key={bc.governingBodyId} className="flex items-center gap-2">
                  {i > 0 && <ArrowRight size={10} className="text-dark-300" />}
                  <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold">{body?.abbreviation}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* External IDs */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
        <h3 className="text-xs font-bold text-dark-700 flex items-center gap-2"><KeyRound size={13} /> External Identifiers</h3>
        {registration.externalIds.length === 0 && missingIds.length === 0 ? (
          <p className="text-xs text-dark-400 italic">No external IDs configured</p>
        ) : (
          <div className="space-y-2">
            {registration.externalIds.map(eid => (
              <div key={eid.id} className="flex items-center justify-between bg-dark-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-dark-700">{eid.issuingBody} — {eid.idType}</p>
                  <p className="text-[11px] text-dark-500 font-mono">{eid.idValue}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-dark-400 capitalize">{eid.scope}</span>
                  {eid.verifiedStatus
                    ? <CheckCircle2 size={14} className="text-green-500" />
                    : <Clock size={14} className="text-amber-500" />
                  }
                </div>
              </div>
            ))}
            {missingIds.map(id => (
              <div key={id.id} className="flex items-center justify-between bg-red-50/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={13} className="text-red-400" />
                  <span className="text-xs text-red-600">{id.label} — missing</span>
                </div>
                <ChevronRight size={13} className="text-red-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
        <h3 className="text-xs font-bold text-dark-700 flex items-center gap-2"><FileText size={13} /> Documents</h3>
        {registration.documents.length === 0 ? (
          <p className="text-xs text-dark-400 italic">No documents uploaded yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {registration.documents.map(doc => {
              const colors: Record<string, string> = { verified: '#00A76F', pending: '#FFAB00', rejected: '#FF5630', not_uploaded: '#919EAB' };
              const color = colors[doc.verificationStatus];
              return (
                <div key={doc.id} className="bg-dark-50 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">{doc.documentType.replace(/_/g, ' ')}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold capitalize" style={{ backgroundColor: color + '15', color }}>{doc.verificationStatus.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-dark-700 truncate">{doc.fileName || doc.label}</p>
                  {doc.uploadedAt && <p className="text-[10px] text-dark-400 mt-0.5">{doc.uploadedAt}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval Workflow */}
      {workflowActive && registration.governingWorkflow && (
        <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
          <h3 className="text-xs font-bold text-dark-700">Approval Workflow</h3>
          <div className="flex items-center gap-1">
            {approvalSteps.map((s, i) => {
              const currentIdx = approvalSteps.indexOf(registration.governingWorkflow!.stateApprovalStatus as typeof approvalSteps[number]);
              const isActive = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`h-1.5 flex-1 rounded-full transition-all ${isActive ? 'bg-court-500' : 'bg-dark-200'}`} />
                  {isCurrent && (
                    <span className="text-[9px] font-bold text-court-600 whitespace-nowrap">{approvalStatusLabels[s]}</span>
                  )}
                </div>
              );
            })}
          </div>
          {registration.governingWorkflow.remarks && (
            <p className="text-[11px] text-dark-500 bg-dark-50 rounded-lg px-3 py-2">{registration.governingWorkflow.remarks}</p>
          )}
        </div>
      )}

      {/* Transfer Info */}
      {registration.previousClub && (
        <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-2">
          <h3 className="text-xs font-bold text-dark-700">Transfer Details</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-dark-50 rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-dark-400">From</p>
              <p className="text-xs font-semibold text-dark-700">{registration.previousClub}</p>
              {registration.previousClubCountry && <p className="text-[10px] text-dark-400">{registration.previousClubCountry}</p>}
            </div>
            <ArrowRight size={16} className="text-dark-300 flex-shrink-0" />
            <div className="flex-1 bg-court-50 rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-court-500">To</p>
              <p className="text-xs font-semibold text-court-700">FC Courtside</p>
            </div>
          </div>
        </div>
      )}

      {/* Governance Rules (Toggle Awareness) */}
      {config && (
        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-dark-100 bg-dark-50/30">
            <h3 className="text-xs font-bold text-dark-600 flex items-center gap-1.5">
              <Shield size={12} className="text-court-500" /> Active Governance Rules
            </h3>
          </div>
          <div className="divide-y divide-dark-50">
            {config.governingBodyConfigs.map(bc => {
              const body = governingBodies.find(b => b.id === bc.governingBodyId);
              if (!body) return null;
              const toggles = [
                { label: 'Ask Existing ID', active: bc.askExistingId },
                { label: 'Allow Unsure', active: bc.allowUnsureOption },
                { label: 'Transfer / NOC', active: bc.requireTransferLogic },
                { label: 'Docs if New', active: bc.requireDocumentsIfUnregistered },
                { label: 'Approval Workflow', active: bc.approvalWorkflowEnabled },
              ];
              const activeCount = toggles.filter(t => t.active).length;
              if (activeCount === 0 && bc.requiredIds.length === 0) return null;
              return (
                <div key={bc.governingBodyId} className="px-5 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600">{body.abbreviation}</span>
                      <span className="text-[11px] text-dark-500">{body.name}</span>
                    </div>
                    <span className="text-[10px] text-dark-400">{activeCount}/5 rules active</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {toggles.map(t => (
                      <span key={t.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.active ? 'bg-court-50 text-court-600' : 'bg-dark-50 text-dark-400'
                      }`}>
                        {t.active ? <Check size={9} /> : <XCircle size={9} />}
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
