import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type GovernanceConfig } from '@/data/governance';
import { type WizardState } from './RegistrationWizard';

interface Props {
  config: GovernanceConfig;
  state: WizardState;
  onUpdate: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ExistingPlayerStep({ config, state, onUpdate, onNext, onBack }: Props) {
  const hasTransferLogic = config.governingBodyConfigs.some(bc => bc.requireTransferLogic);

  const setId = (key: string, value: string) => {
    onUpdate({ externalIds: { ...state.externalIds, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-dark-900">Existing Player Details</h3>
        <p className="text-xs text-dark-500 mt-1">Enter the player's existing governing body IDs and transfer details.</p>
      </div>

      {/* External IDs */}
      {config.governingBodyConfigs.map(bc => {
        if (bc.requiredIds.length === 0) return null;
        return (
          <div key={bc.governingBodyId} className="space-y-2">
            <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider">{bc.governingBodyName}</p>
            {bc.requiredIds.map(idTpl => (
              <div key={idTpl.id}>
                <label className="text-[11px] font-semibold text-dark-500">
                  {idTpl.label} {idTpl.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  value={state.externalIds[idTpl.idType] || ''}
                  onChange={e => setId(idTpl.idType, e.target.value)}
                  placeholder={idTpl.example || `Enter ${idTpl.label}`}
                  className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20"
                />
              </div>
            ))}
          </div>
        );
      })}

      {/* Previous Club + Transfer */}
      <div className="border-t border-dark-100 pt-4 space-y-3">
        <p className="text-[11px] font-bold text-dark-400 uppercase tracking-wider">Previous Club</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-dark-500">Club Name</label>
            <input value={state.previousClub} onChange={e => onUpdate({ previousClub: e.target.value })}
              placeholder="e.g. Arsenal Academy"
              className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-dark-500">Country</label>
            <input value={state.previousClubCountry} onChange={e => onUpdate({ previousClubCountry: e.target.value })}
              placeholder="e.g. United Kingdom"
              className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
        </div>

        {hasTransferLogic && (
          <div>
            <label className="text-[11px] font-semibold text-dark-500">Contract Status</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {([
                { key: 'not_applicable', label: 'Not Applicable', desc: 'No contract in place' },
                { key: 'contract_active', label: 'Active Contract', desc: 'NOC will be required' },
                { key: 'contract_expired', label: 'Contract Expired', desc: 'Free to transfer' },
              ] as const).map(opt => (
                <button key={opt.key} onClick={() => onUpdate({ transferStatus: opt.key })}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    state.transferStatus === opt.key
                      ? 'border-court-500 bg-court-50'
                      : 'border-dark-200 bg-white hover:border-dark-300'
                  }`}>
                  <p className="text-xs font-semibold text-dark-700">{opt.label}</p>
                  <p className="text-[10px] text-dark-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {state.transferStatus === 'contract_active' && (
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-800">NOC Required</p>
            <p className="text-[11px] text-amber-600 mt-0.5">A No Objection Certificate from the previous club will need to be uploaded in the documents step.</p>
          </div>
        )}

        {state.transferStatus === 'contract_expired' && (
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-green-800">Free Player</p>
            <p className="text-[11px] text-green-600 mt-0.5">Contract has expired. The player is free to register with a new club.</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-100">
        <button onClick={onBack} className="h-9 px-4 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={onNext} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2">
          Next <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}