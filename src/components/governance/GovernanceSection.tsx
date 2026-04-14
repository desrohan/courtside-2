import { useState } from 'react';
import GoverningBodiesTab from './GoverningBodiesTab';
import AssociationsTab from './AssociationsTab';
import LeaguesTab from './LeaguesTab';
import IdsLicensesTab from './IdsLicensesTab';
import InheritancePreview from './InheritancePreview';

type GovernanceTab = 'governing-bodies' | 'associations' | 'leagues' | 'ids-licenses' | 'inheritance';

export default function GovernanceSection() {
  const [tab, setTab] = useState<GovernanceTab>('governing-bodies');

  const tabs: { key: GovernanceTab; label: string }[] = [
    { key: 'governing-bodies', label: 'Governing Bodies' },
    { key: 'associations', label: 'Associations' },
    { key: 'leagues', label: 'Leagues' },
    { key: 'ids-licenses', label: 'IDs & Licenses' },
    { key: 'inheritance', label: 'Inheritance' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5 w-fit overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              tab === t.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'governing-bodies' && <GoverningBodiesTab />}
      {tab === 'associations' && <AssociationsTab />}
      {tab === 'leagues' && <LeaguesTab />}
      {tab === 'ids-licenses' && <IdsLicensesTab />}
      {tab === 'inheritance' && <InheritancePreview />}
    </div>
  );
}
