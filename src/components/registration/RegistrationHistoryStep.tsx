import { Shield, HelpCircle, UserX, Globe } from 'lucide-react';
import { type RegistrationStatus } from '@/data/athleteRegistration';
import { type GovernanceConfig } from '@/data/governance';

interface Props {
  config: GovernanceConfig;
  onSelect: (status: RegistrationStatus) => void;
}

export default function RegistrationHistoryStep({ config, onSelect }: Props) {
  const primaryBody = config.governingBodyConfigs.find(bc => bc.askExistingId);
  const bodyName = primaryBody?.governingBodyName || 'a governing body';
  const showUnsure = primaryBody?.allowUnsureOption ?? true;

  const options: { status: RegistrationStatus; icon: React.ReactNode; title: string; description: string; color: string }[] = [
    {
      status: 'already_registered',
      icon: <Shield size={20} />,
      title: `Yes, registered with ${bodyName}`,
      description: `The athlete already has a ${bodyName} player ID and has played organized ${config.sport.toLowerCase()} before.`,
      color: '#00A76F',
    },
    {
      status: 'not_registered',
      icon: <UserX size={20} />,
      title: 'No, not yet registered',
      description: `The athlete has never been registered with ${bodyName}. We'll collect the required documents for a new registration.`,
      color: '#FF5630',
    },
  ];

  if (showUnsure) {
    options.push({
      status: 'unsure',
      icon: <HelpCircle size={20} />,
      title: 'Not sure',
      description: "We'll save the profile as a draft and an admin can follow up to determine the registration status.",
      color: '#FFAB00',
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-dark-900">Registration History</h3>
        <p className="text-xs text-dark-500 mt-1">Is this athlete already registered with a {config.sport.toLowerCase()} governing body?</p>
      </div>

      <div className="space-y-2">
        {options.map(opt => (
          <button key={opt.status} onClick={() => onSelect(opt.status)}
            className="w-full text-left bg-dark-50 hover:bg-dark-100/80 rounded-xl p-4 transition-all group border border-transparent hover:border-dark-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: opt.color + '15', color: opt.color }}>
                {opt.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-dark-800 group-hover:text-dark-900">{opt.title}</p>
                <p className="text-[11px] text-dark-400 mt-0.5 leading-relaxed">{opt.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
