import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { type RegistrationStatus, type TransferStatus, type RegistrationPathway } from '@/data/athleteRegistration';
import { getGovernanceConfig, type GovernanceConfig } from '@/data/governance';
import RegistrationHistoryStep from './RegistrationHistoryStep';
import ExistingPlayerStep from './ExistingPlayerStep';
import NewRegistrationStep from './NewRegistrationStep';
import DocumentsStep from './DocumentsStep';
import PostRegistrationOutcome from './PostRegistrationOutcome';

interface Props {
  organizationId: string;
  athleteName: string;
  onClose: () => void;
}

export interface WizardState {
  registrationStatus: RegistrationStatus | null;
  pathway: RegistrationPathway | null;
  transferStatus: TransferStatus;
  externalIds: Record<string, string>;
  previousClub: string;
  previousClubCountry: string;
  documents: Record<string, string>;
}

type WizardStep = 'history' | 'existing' | 'new' | 'unsure' | 'documents' | 'review';

export default function RegistrationWizard({ organizationId, athleteName, onClose }: Props) {
  const config = getGovernanceConfig(organizationId);
  const [step, setStep] = useState<WizardStep>('history');
  const [state, setState] = useState<WizardState>({
    registrationStatus: null,
    pathway: null,
    transferStatus: 'not_applicable',
    externalIds: {},
    previousClub: '',
    previousClubCountry: '',
    documents: {},
  });
  const [submitted, setSubmitted] = useState(false);

  if (!config) return <p className="text-sm text-dark-500 p-4">No governance configuration found for this organization.</p>;

  const update = (partial: Partial<WizardState>) => setState(prev => ({ ...prev, ...partial }));

  const onHistorySelect = (status: RegistrationStatus) => {
    if (status === 'already_registered') {
      update({ registrationStatus: status, pathway: 'existing' });
      setStep('existing');
    } else if (status === 'not_registered') {
      update({ registrationStatus: status, pathway: 'first_time' });
      setStep('new');
    } else {
      update({ registrationStatus: status, pathway: null });
      setStep('unsure');
    }
  };

  const goDocuments = () => setStep('documents');
  const goReview = () => setStep('review');

  const stepLabels: Record<WizardStep, string> = {
    history: 'Registration History',
    existing: 'Player Details',
    new: 'New Registration',
    unsure: 'Admin Review',
    documents: 'Documents',
    review: 'Review & Submit',
  };

  if (submitted) {
    return (
      <PostRegistrationOutcome
        config={config}
        state={state}
        athleteName={athleteName}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-dark-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-dark-900">Registration Wizard</h2>
          <p className="text-[11px] text-dark-400">{stepLabels[step]} &mdash; {athleteName}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400"><X size={16} /></button>
      </div>

      {/* Steps */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {step === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <RegistrationHistoryStep config={config} onSelect={onHistorySelect} />
            </motion.div>
          )}

          {step === 'existing' && (
            <motion.div key="existing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ExistingPlayerStep config={config} state={state} onUpdate={update} onNext={goDocuments} onBack={() => setStep('history')} />
            </motion.div>
          )}

          {step === 'new' && (
            <motion.div key="new" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <NewRegistrationStep config={config} state={state} onUpdate={update} onNext={goDocuments} onBack={() => setStep('history')} />
            </motion.div>
          )}

          {step === 'unsure' && (
            <motion.div key="unsure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4">
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800">Registration Status: Unsure</p>
                  <p className="text-xs text-amber-600 mt-1">This athlete's record will be saved as a draft and flagged for admin review. An administrator will follow up to verify the registration status.</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setStep('history')} className="h-9 px-4 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-2">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button onClick={() => setSubmitted(true)} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
                    Save as Draft <Check size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'documents' && (
            <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DocumentsStep config={config} state={state} onUpdate={update} onNext={goReview} onBack={() => setStep(state.pathway === 'existing' ? 'existing' : 'new')} />
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-900">Review Registration</h3>

                <div className="bg-dark-50 rounded-xl p-3 space-y-2">
                  <Row label="Status" value={state.registrationStatus || '—'} />
                  <Row label="Pathway" value={state.pathway?.replace('_', ' ') || '—'} />
                  <Row label="Transfer Status" value={state.transferStatus.replace('_', ' ')} />
                  {state.previousClub && <Row label="Previous Club" value={`${state.previousClub} (${state.previousClubCountry || '—'})`} />}
                </div>

                {Object.keys(state.externalIds).length > 0 && (
                  <div className="bg-dark-50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">External IDs</p>
                    {Object.entries(state.externalIds).map(([k, v]) => (
                      <Row key={k} label={k} value={v || 'Not provided'} />
                    ))}
                  </div>
                )}

                {Object.keys(state.documents).length > 0 && (
                  <div className="bg-dark-50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Documents</p>
                    {Object.entries(state.documents).map(([k, v]) => (
                      <Row key={k} label={k.replace(/_/g, ' ')} value={v || 'Skipped'} />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setStep('documents')} className="h-9 px-4 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-2">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button onClick={() => setSubmitted(true)} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
                    <Check size={14} /> Submit Registration
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-dark-500 capitalize">{label}</span>
      <span className="text-xs font-semibold text-dark-700 capitalize">{value}</span>
    </div>
  );
}