import { motion } from 'framer-motion';
import {
  Check, CheckCircle2, Clock, AlertTriangle, Shield, FileText,
  ArrowRight, KeyRound, Send, UserCheck, XCircle, Eye, RotateCcw,
  GitPullRequest, Stamp, Globe, Flag,
} from 'lucide-react';
import { type GovernanceConfig, type GoverningBodyConfig, governingBodies, resolveAthleteRequirements } from '@/data/governance';
import { type WizardState } from './RegistrationWizard';
import {
  type RegistrationStatus, type TransferStatus, type ApprovalStatus,
  approvalStatusLabels, approvalStatusColors,
  transferStatusLabels, transferStatusColors,
  registrationStatusLabels, registrationStatusColors,
} from '@/data/athleteRegistration';

interface Props {
  config: GovernanceConfig;
  state: WizardState;
  athleteName: string;
  onClose: () => void;
}

// ── Derive the full post-registration outcome from governance toggles ──
function deriveOutcome(config: GovernanceConfig, state: WizardState) {
  const status = state.registrationStatus!;
  const pathway = state.pathway;
  const transfer = state.transferStatus;

  // Which toggles are active?
  const activeToggles = config.governingBodyConfigs.reduce((acc, bc) => ({
    askExistingId: acc.askExistingId || bc.askExistingId,
    allowUnsure: acc.allowUnsure || bc.allowUnsureOption,
    requireTransfer: acc.requireTransfer || bc.requireTransferLogic,
    requireDocs: acc.requireDocs || bc.requireDocumentsIfUnregistered,
    approvalWorkflow: acc.approvalWorkflow || bc.approvalWorkflowEnabled,
  }), { askExistingId: false, allowUnsure: false, requireTransfer: false, requireDocs: false, approvalWorkflow: false });

  // Count what was collected
  const idsProvided = Object.values(state.externalIds).filter(v => v && v.trim()).length;
  const docsUploaded = Object.values(state.documents).filter(v => v && v.trim()).length;
  const hasTransferData = !!(state.previousClub);

  // Determine outcome status
  let outcomeStatus: 'complete' | 'pending_approval' | 'transfer_in_progress' | 'draft' | 'incomplete' = 'incomplete';
  let approvalEntry: ApprovalStatus = 'draft';
  let nextSteps: { icon: React.ReactNode; label: string; description: string; urgent: boolean }[] = [];
  let warnings: string[] = [];

  if (status === 'unsure') {
    outcomeStatus = 'draft';
    approvalEntry = 'draft';
    nextSteps.push({
      icon: <Eye size={14} />,
      label: 'Admin Review Required',
      description: 'An administrator needs to verify this athlete\'s registration status with the governing body.',
      urgent: true,
    });
  } else if (status === 'already_registered') {
    // EXISTING PLAYER PATH
    if (activeToggles.requireTransfer && transfer === 'contract_active') {
      outcomeStatus = 'transfer_in_progress';
      nextSteps.push({
        icon: <GitPullRequest size={14} />,
        label: 'NOC Verification',
        description: 'The No Objection Certificate needs to be verified by the previous club and governing body.',
        urgent: true,
      });
      nextSteps.push({
        icon: <Stamp size={14} />,
        label: 'Transfer Clearance',
        description: 'Once NOC is verified, the governing body will issue transfer clearance.',
        urgent: false,
      });
    } else if (activeToggles.requireTransfer && transfer === 'contract_expired') {
      outcomeStatus = idsProvided > 0 ? 'complete' : 'incomplete';
      nextSteps.push({
        icon: <CheckCircle2 size={14} />,
        label: 'Free Agent Registration',
        description: 'Contract expired — player is free to register. IDs will be verified automatically.',
        urgent: false,
      });
    } else if (activeToggles.requireTransfer && transfer === 'transfer_required') {
      outcomeStatus = 'transfer_in_progress';
      nextSteps.push({
        icon: <GitPullRequest size={14} />,
        label: 'Initiate Transfer',
        description: 'A formal transfer request must be submitted to the governing body.',
        urgent: true,
      });
    } else {
      outcomeStatus = idsProvided > 0 ? 'complete' : 'incomplete';
      if (idsProvided > 0) {
        nextSteps.push({
          icon: <CheckCircle2 size={14} />,
          label: 'ID Verification',
          description: 'External IDs will be verified against the governing body records.',
          urgent: false,
        });
      }
    }

    if (idsProvided === 0) {
      warnings.push('No external IDs were provided. These will need to be added before the athlete can participate in sanctioned competitions.');
    }
  } else if (status === 'not_registered') {
    // NEW REGISTRATION PATH
    if (activeToggles.approvalWorkflow) {
      outcomeStatus = 'pending_approval';
      approvalEntry = 'submitted';

      // Build approval chain from config
      const bodiesWithApproval = config.governingBodyConfigs.filter(bc => bc.approvalWorkflowEnabled);
      bodiesWithApproval.forEach(bc => {
        const body = governingBodies.find(b => b.id === bc.governingBodyId);
        if (body && (body.level === 'state' || body.level === 'regional')) {
          nextSteps.push({
            icon: <Flag size={14} />,
            label: `${body.abbreviation} State Approval`,
            description: `Registration submitted to ${body.name} for state-level review and approval.`,
            urgent: true,
          });
        }
        if (body && body.level === 'national') {
          nextSteps.push({
            icon: <Globe size={14} />,
            label: `${body.abbreviation} National Approval`,
            description: `After state approval, ${body.name} will review for national federation registration.`,
            urgent: false,
          });
        }
      });
    } else {
      outcomeStatus = docsUploaded > 0 ? 'incomplete' : 'incomplete';
      nextSteps.push({
        icon: <Send size={14} />,
        label: 'Submit to Governing Body',
        description: 'Registration data will be submitted directly. No internal approval workflow is required.',
        urgent: false,
      });
    }

    if (activeToggles.requireDocs && docsUploaded === 0) {
      warnings.push('Documents are required for new registrations but none were uploaded. The registration cannot proceed to approval until documents are provided.');
    }
  }

  // Generic next steps regardless of path
  nextSteps.push({
    icon: <UserCheck size={14} />,
    label: 'Eligibility Determination',
    description: 'Once all verifications are complete, the athlete\'s eligibility for competition will be determined.',
    urgent: false,
  });

  return { outcomeStatus, approvalEntry, activeToggles, nextSteps, warnings, idsProvided, docsUploaded, hasTransferData };
}

const outcomeStatusMeta: Record<string, { color: string; icon: React.ReactNode; label: string; bg: string }> = {
  complete: { color: '#00A76F', icon: <CheckCircle2 size={24} />, label: 'Registration Complete', bg: 'bg-green-50' },
  pending_approval: { color: '#FFAB00', icon: <Clock size={24} />, label: 'Pending Approval', bg: 'bg-amber-50' },
  transfer_in_progress: { color: '#8E33FF', icon: <GitPullRequest size={24} />, label: 'Transfer In Progress', bg: 'bg-purple-50' },
  draft: { color: '#919EAB', icon: <AlertTriangle size={24} />, label: 'Saved as Draft', bg: 'bg-dark-50' },
  incomplete: { color: '#FF5630', icon: <XCircle size={24} />, label: 'Incomplete — Action Required', bg: 'bg-red-50' },
};

export default function PostRegistrationOutcome({ config, state, athleteName, onClose }: Props) {
  const outcome = deriveOutcome(config, state);
  const meta = outcomeStatusMeta[outcome.outcomeStatus];

  return (
    <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
      {/* ── Outcome Header ── */}
      <div className={`px-6 py-6 ${meta.bg}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: meta.color + '20', color: meta.color }}>
            {meta.icon}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-dark-900">{meta.label}</h2>
            <p className="text-sm text-dark-500 mt-0.5"><strong>{athleteName}</strong>'s registration has been processed.</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* ── What was collected ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<KeyRound size={14} />} label="External IDs" value={outcome.idsProvided} color={outcome.idsProvided > 0 ? '#00A76F' : '#FF5630'} />
          <StatCard icon={<FileText size={14} />} label="Documents" value={outcome.docsUploaded} color={outcome.docsUploaded > 0 ? '#00A76F' : '#FFAB00'} />
          <StatCard icon={<Shield size={14} />} label="Bodies" value={config.governingBodyConfigs.length} color="#3B82F6" />
        </div>

        {/* ── Active Governance Toggles ── */}
        <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-dark-100 bg-dark-50/50">
            <h3 className="text-[11px] font-bold text-dark-500 uppercase tracking-wider">Active Governance Rules</h3>
          </div>
          <div className="divide-y divide-dark-50">
            <ToggleRow label="Ask Existing ID" active={outcome.activeToggles.askExistingId}
              activeNote={`Athlete answered: "${registrationStatusLabels[state.registrationStatus!]}"`}
              inactiveNote="All athletes treated as new registrations" />
            <ToggleRow label="Allow Unsure Option" active={outcome.activeToggles.allowUnsure}
              activeNote={state.registrationStatus === 'unsure' ? 'Athlete selected "Unsure" — flagged for admin' : 'Option was available but not selected'}
              inactiveNote="Athletes must answer Yes or No" />
            <ToggleRow label="Transfer / NOC Logic" active={outcome.activeToggles.requireTransfer}
              activeNote={
                state.transferStatus === 'contract_active' ? 'Contract active — NOC required from previous club'
                : state.transferStatus === 'contract_expired' ? 'Contract expired — free to transfer'
                : state.transferStatus === 'transfer_required' ? 'Transfer clearance needed from governing body'
                : 'No transfer scenario detected'
              }
              activeColor={
                state.transferStatus === 'contract_active' ? '#FF5630'
                : state.transferStatus === 'contract_expired' ? '#00A76F'
                : undefined
              }
              inactiveNote="Transfer checks disabled — direct registration" />
            <ToggleRow label="Documents if Unregistered" active={outcome.activeToggles.requireDocs}
              activeNote={
                state.registrationStatus === 'not_registered'
                  ? (outcome.docsUploaded > 0 ? `${outcome.docsUploaded} document(s) uploaded` : 'Required but none uploaded — blocks approval')
                  : 'Not triggered (athlete is already registered)'
              }
              activeColor={
                state.registrationStatus === 'not_registered' && outcome.docsUploaded === 0 ? '#FF5630' : undefined
              }
              inactiveNote="No documents required for new registrations" />
            <ToggleRow label="Approval Workflow" active={outcome.activeToggles.approvalWorkflow}
              activeNote={
                state.registrationStatus === 'not_registered'
                  ? 'State → National approval chain initiated'
                  : 'Workflow available but not triggered for this pathway'
              }
              inactiveNote="Direct registration — no approval chain" />
          </div>
        </div>

        {/* ── Warnings ── */}
        {outcome.warnings.length > 0 && (
          <div className="space-y-2">
            {outcome.warnings.map((w, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 bg-red-50 rounded-xl px-4 py-3">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">{w}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Approval Workflow Stepper (if applicable) ── */}
        {outcome.outcomeStatus === 'pending_approval' && (
          <div className="bg-white rounded-xl border border-dark-100 p-4 space-y-3">
            <h3 className="text-xs font-bold text-dark-700">Approval Workflow Status</h3>
            <div className="space-y-0">
              {['submitted', 'state_approval_pending', 'state_approved', 'national_approval_pending', 'national_approved'].map((step, i) => {
                const isActive = i === 0;
                const isPending = i === 1;
                const color = isActive ? '#00B8D9' : isPending ? '#FFAB00' : '#919EAB';
                return (
                  <div key={step} className="flex items-center gap-3 py-2">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: (isActive ? color : '#E5E7EB') + (isActive ? '' : ''), color: isActive ? 'white' : '#9CA3AF',
                          ...(isActive ? { backgroundColor: color } : {}) }}>
                        {isActive ? <Check size={12} /> : i + 1}
                      </div>
                      {i < 4 && <div className="w-px h-4" style={{ backgroundColor: isActive ? color : '#E5E7EB' }} />}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${isActive ? 'text-dark-800' : isPending ? 'text-amber-700' : 'text-dark-400'}`}>
                        {approvalStatusLabels[step as ApprovalStatus]}
                      </p>
                      {isActive && <p className="text-[10px] text-dark-400">Just now</p>}
                      {isPending && <p className="text-[10px] text-amber-500">Awaiting review</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Transfer Outcome (if applicable) ── */}
        {outcome.outcomeStatus === 'transfer_in_progress' && state.previousClub && (
          <div className="bg-white rounded-xl border border-dark-100 p-4 space-y-3">
            <h3 className="text-xs font-bold text-dark-700">Transfer Status</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-dark-50 rounded-lg px-3 py-2.5 text-center">
                <p className="text-[10px] text-dark-400 uppercase tracking-wider">From</p>
                <p className="text-xs font-bold text-dark-700">{state.previousClub}</p>
                <p className="text-[10px] text-dark-400">{state.previousClubCountry}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ArrowRight size={16} className="text-purple-400" />
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{ backgroundColor: transferStatusColors[state.transferStatus] + '15', color: transferStatusColors[state.transferStatus] }}>
                  {transferStatusLabels[state.transferStatus]}
                </span>
              </div>
              <div className="flex-1 bg-court-50 rounded-lg px-3 py-2.5 text-center">
                <p className="text-[10px] text-court-500 uppercase tracking-wider">To</p>
                <p className="text-xs font-bold text-court-700">FC Courtside</p>
                <p className="text-[10px] text-court-500">United Kingdom</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Next Steps ── */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-dark-700">What Happens Next</h3>
          {outcome.nextSteps.map((ns, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
              className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${ns.urgent ? 'border-amber-200 bg-amber-50/50' : 'border-dark-100 bg-dark-50/30'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${ns.urgent ? 'bg-amber-100 text-amber-600' : 'bg-dark-100 text-dark-500'}`}>
                {ns.icon}
              </div>
              <div>
                <p className={`text-xs font-semibold ${ns.urgent ? 'text-amber-800' : 'text-dark-700'}`}>{ns.label}</p>
                <p className="text-[11px] text-dark-500 mt-0.5 leading-relaxed">{ns.description}</p>
              </div>
              {ns.urgent && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 self-start flex-shrink-0">Action</span>}
            </motion.div>
          ))}
        </div>

        {/* ── Data Summary ── */}
        <details className="group">
          <summary className="text-xs font-semibold text-dark-500 cursor-pointer hover:text-dark-700 flex items-center gap-1">
            <Eye size={12} /> View submitted data
          </summary>
          <div className="mt-3 space-y-2">
            <SummaryRow label="Registration Status" value={registrationStatusLabels[state.registrationStatus!]} color={registrationStatusColors[state.registrationStatus!]} />
            {state.pathway && <SummaryRow label="Pathway" value={state.pathway.replace('_', ' ')} />}
            <SummaryRow label="Transfer Status" value={transferStatusLabels[state.transferStatus]} color={transferStatusColors[state.transferStatus]} />
            {state.previousClub && <SummaryRow label="Previous Club" value={`${state.previousClub} (${state.previousClubCountry || '—'})`} />}
            {Object.entries(state.externalIds).filter(([,v]) => v).map(([k, v]) => (
              <SummaryRow key={k} label={`ID: ${k}`} value={v} />
            ))}
            {Object.entries(state.documents).filter(([,v]) => v).map(([k, v]) => (
              <SummaryRow key={k} label={`Doc: ${k.replace(/_/g, ' ')}`} value={v} />
            ))}
          </div>
        </details>

        {/* ── Done ── */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-100">
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-2">
            <RotateCcw size={14} /> Back to Profile
          </button>
          <button onClick={onClose} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
            <Check size={14} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-dark-50 rounded-xl px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>{icon}<span className="text-lg font-extrabold">{value}</span></div>
      <p className="text-[10px] text-dark-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function ToggleRow({ label, active, activeNote, inactiveNote, activeColor }: {
  label: string; active: boolean; activeNote: string; inactiveNote: string; activeColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? 'bg-court-500' : 'bg-dark-200'}`}>
        {active ? <Check size={11} className="text-white" /> : <XCircle size={11} className="text-dark-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-dark-700">{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: active ? (activeColor || '#637381') : '#919EAB' }}>
          {active ? activeNote : inactiveNote}
        </p>
      </div>
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${active ? 'bg-court-50 text-court-600' : 'bg-dark-100 text-dark-400'}`}>
        {active ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between bg-dark-50 rounded-lg px-3 py-2">
      <span className="text-[11px] text-dark-500 capitalize">{label}</span>
      <span className="text-[11px] font-semibold capitalize" style={{ color: color || '#212B36' }}>{value}</span>
    </div>
  );
}