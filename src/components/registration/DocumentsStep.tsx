import { ArrowLeft, ArrowRight, Upload, FileText, Check } from 'lucide-react';
import { type GovernanceConfig, resolveAthleteRequirements } from '@/data/governance';
import { type WizardState } from './RegistrationWizard';

interface Props {
  config: GovernanceConfig;
  state: WizardState;
  onUpdate: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function DocumentsStep({ config, state, onUpdate, onNext, onBack }: Props) {
  const pathway = state.pathway || 'first_time';
  const { requiredDocuments } = resolveAthleteRequirements(config, 17, pathway, state.transferStatus);

  const setDoc = (key: string, value: string) => {
    onUpdate({ documents: { ...state.documents, [key]: value } });
  };

  if (requiredDocuments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <Check size={24} className="mx-auto text-green-500 mb-2" />
          <p className="text-sm font-semibold text-green-800">No Documents Required</p>
          <p className="text-xs text-green-600 mt-1">Based on the registration pathway and athlete details, no documents are needed at this time.</p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-dark-100">
          <button onClick={onBack} className="h-9 px-4 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-2">
            <ArrowLeft size={14} /> Back
          </button>
          <button onClick={onNext} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
            Review <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-dark-900">Upload Documents</h3>
        <p className="text-xs text-dark-500 mt-1">The following documents are required based on the registration pathway. You can skip any and upload later.</p>
      </div>

      <div className="space-y-3">
        {requiredDocuments.map(doc => {
          const uploaded = state.documents[doc.documentType];
          return (
            <div key={doc.id} className={`rounded-xl border p-4 transition-all ${uploaded ? 'border-court-500 bg-court-50/30' : 'border-dark-200 bg-white'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-dark-800">{doc.label}</p>
                  <p className="text-[10px] text-dark-400 mt-0.5 capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
                  {doc.conditions.ageRange?.max && (
                    <p className="text-[10px] text-dark-400">Required for athletes under {doc.conditions.ageRange.max}</p>
                  )}
                </div>
                {doc.required && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600">Required</span>
                )}
              </div>

              {uploaded ? (
                <div className="mt-3 flex items-center gap-2 bg-court-50 rounded-lg px-3 py-2">
                  <FileText size={14} className="text-court-500" />
                  <span className="text-xs font-medium text-court-700 flex-1 truncate">{uploaded}</span>
                  <Check size={14} className="text-court-500" />
                </div>
              ) : (
                <button onClick={() => setDoc(doc.documentType, `${doc.documentType}_upload.pdf`)}
                  className="mt-3 w-full border-2 border-dashed border-dark-200 rounded-lg p-3 flex items-center justify-center gap-2 text-xs text-dark-400 hover:border-dark-300 hover:text-dark-500 transition-colors">
                  <Upload size={14} /> Click to upload {doc.label.toLowerCase()}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => {
        requiredDocuments.forEach(doc => {
          if (!state.documents[doc.documentType]) {
            setDoc(doc.documentType, '');
          }
        });
      }}
        className="text-xs text-dark-400 hover:text-dark-600 underline">
        Skip all for now
      </button>

      <div className="flex items-center justify-between pt-3 border-t border-dark-100">
        <button onClick={onBack} className="h-9 px-4 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={onNext} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
          Review <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
