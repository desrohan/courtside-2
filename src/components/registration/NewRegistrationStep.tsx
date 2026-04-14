import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { type GovernanceConfig } from '@/data/governance';
import { type WizardState } from './RegistrationWizard';

interface Props {
  config: GovernanceConfig;
  state: WizardState;
  onUpdate: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function NewRegistrationStep({ config, state, onUpdate, onNext, onBack }: Props) {
  const hasApproval = config.governingBodyConfigs.some(bc => bc.approvalWorkflowEnabled);
  const needsDocs = config.governingBodyConfigs.some(bc => bc.requireDocumentsIfUnregistered);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-dark-900">New Registration</h3>
        <p className="text-xs text-dark-500 mt-1">This athlete is not yet registered with a governing body. We'll collect the required information for a new registration.</p>
      </div>

      {/* Info Cards */}
      {needsDocs && (
        <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-800">Documents Required</p>
            <p className="text-[11px] text-blue-600 mt-0.5">
              Based on your organization's configuration, documents will be required for this new registration.
              You'll upload them in the next step.
            </p>
          </div>
        </div>
      )}

      {hasApproval && (
        <div className="bg-amber-50 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Approval Workflow Active</p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              After submission, the registration will go through a state and/or national approval process
              before the athlete is fully registered.
            </p>
          </div>
        </div>
      )}

      {/* Workflow Preview */}
      {hasApproval && (
        <div className="bg-white border border-dark-100 rounded-xl p-4 space-y-3">
          <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider">Approval Steps</p>
          <div className="space-y-2">
            {['Submit registration data', 'State association review & approval', 'National federation review & approval', 'Registration complete'].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-court-500 text-white' : 'bg-dark-100 text-dark-500'
                }`}>{i + 1}</div>
                <span className={`text-xs ${i === 0 ? 'font-semibold text-dark-700' : 'text-dark-500'}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Governing bodies that will be applied for */}
      <div className="bg-white border border-dark-100 rounded-xl p-4 space-y-2">
        <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider">Registering With</p>
        {config.governingBodyConfigs.filter(bc => bc.requiredIds.length > 0 || bc.approvalWorkflowEnabled).map(bc => (
          <div key={bc.governingBodyId} className="flex items-center justify-between bg-dark-50 rounded-lg px-3 py-2">
            <span className="text-xs font-semibold text-dark-700">{bc.governingBodyName}</span>
            <span className="text-[10px] text-dark-400">
              {bc.requiredIds.length} ID{bc.requiredIds.length !== 1 ? 's' : ''} required
            </span>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-100">
        <button onClick={onBack} className="h-9 px-4 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={onNext} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
          {needsDocs ? 'Next: Documents' : 'Review'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}