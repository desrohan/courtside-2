// ══════════════════════════════════════════════════════
// GOVERNANCE DOMAIN MODEL
// ══════════════════════════════════════════════════════

export interface GoverningBody {
  id: string;
  name: string;
  abbreviation: string;
  sport: string;
  country: string; // '*' for global
  state?: string;
  level: 'global' | 'national' | 'regional' | 'state' | 'optional';
  parentId?: string;
  website?: string;
  required: boolean;
}

export interface GoverningBodyChain {
  sport: string;
  country: string;
  state?: string;
  bodies: GoverningBody[];
}

export interface Association {
  id: string;
  name: string;
  type: 'association' | 'conference';
  sport: string;
  country: string;
  level: string;
  governingBodyId?: string;
}

export interface LeagueCompetition {
  id: string;
  name: string;
  type: 'league' | 'tournament' | 'cup';
  sport: string;
  country: string;
  level: string;
  governingBodyId?: string;
  season?: string;
}

export interface ExternalIdTemplate {
  id: string;
  label: string;
  idType: string;
  governingBodyId: string;
  scope: 'local' | 'national' | 'international';
  required: boolean;
  pattern?: string;
  example?: string;
}

export interface GoverningBodyConfig {
  governingBodyId: string;
  governingBodyName: string;
  requiredIds: ExternalIdTemplate[];
  askExistingId: boolean;
  allowUnsureOption: boolean;
  requireTransferLogic: boolean;
  requireDocumentsIfUnregistered: boolean;
  approvalWorkflowEnabled: boolean;
}

export interface OrgIdTemplate {
  id: string;
  label: string;
  governingBodyId: string;
  required: boolean;
  example?: string;
}

export interface UserIdTemplate {
  id: string;
  label: string;
  governingBodyId: string;
  roles: string[];
  required: boolean;
  example?: string;
}

export interface DocumentRequirement {
  id: string;
  label: string;
  documentType: string;
  governingBodyId: string;
  conditions: {
    pathway?: ('first_time' | 'existing' | 'transfer' | 'international')[];
    ageRange?: { min?: number; max?: number };
    registrationStatus?: string[];
    transferStatus?: string[];
  };
  required: boolean;
}

export interface GovernanceConfig {
  id: string;
  organizationId: string;
  sport: string;
  country: string;
  state?: string;
  governingBodyConfigs: GoverningBodyConfig[];
  associations: Association[];
  leagues: LeagueCompetition[];
  orgIds: OrgIdTemplate[];
  userIds: UserIdTemplate[];
  documentRequirements: DocumentRequirement[];
}

// ══════════════════════════════════════════════════════
// RESOLVE REQUIREMENTS (PURE FUNCTION)
// ══════════════════════════════════════════════════════

export function resolveAthleteRequirements(
  config: GovernanceConfig,
  age: number,
  pathway: 'first_time' | 'existing' | 'transfer' | 'international',
  transferStatus?: string,
): {
  requiredIds: ExternalIdTemplate[];
  requiredDocuments: DocumentRequirement[];
  showTransferFlow: boolean;
  approvalWorkflowEnabled: boolean;
} {
  const requiredIds: ExternalIdTemplate[] = [];
  let showTransferFlow = false;
  let approvalWorkflowEnabled = false;

  for (const bodyConfig of config.governingBodyConfigs) {
    for (const idTpl of bodyConfig.requiredIds) {
      if (idTpl.required) requiredIds.push(idTpl);
    }
    if (bodyConfig.requireTransferLogic && (pathway === 'transfer' || pathway === 'international')) {
      showTransferFlow = true;
    }
    if (bodyConfig.approvalWorkflowEnabled && pathway === 'first_time') {
      approvalWorkflowEnabled = true;
    }
  }

  const requiredDocuments = config.documentRequirements.filter(doc => {
    if (!doc.required) return false;
    if (doc.conditions.pathway && !doc.conditions.pathway.includes(pathway)) return false;
    if (doc.conditions.ageRange) {
      if (doc.conditions.ageRange.min !== undefined && age < doc.conditions.ageRange.min) return false;
      if (doc.conditions.ageRange.max !== undefined && age > doc.conditions.ageRange.max) return false;
    }
    if (doc.conditions.transferStatus && transferStatus && !doc.conditions.transferStatus.includes(transferStatus)) return false;
    return true;
  });

  return { requiredIds, requiredDocuments, showTransferFlow, approvalWorkflowEnabled };
}

// ══════════════════════════════════════════════════════
// MOCK: GOVERNING BODIES
// ══════════════════════════════════════════════════════

export const governingBodies: GoverningBody[] = [
  // Global
  { id: 'gb-fifa', name: 'Federation Internationale de Football Association', abbreviation: 'FIFA', sport: 'Football', country: '*', level: 'global', required: true, website: 'https://www.fifa.com' },
  { id: 'gb-itf', name: 'International Tennis Federation', abbreviation: 'ITF', sport: 'Tennis', country: '*', level: 'global', required: true, website: 'https://www.itftennis.com' },
  { id: 'gb-utr', name: 'Universal Tennis Rating', abbreviation: 'UTR', sport: 'Tennis', country: '*', level: 'global', required: false, website: 'https://www.utrsports.net' },
  // National — Football
  { id: 'gb-fa', name: 'The Football Association', abbreviation: 'The FA', sport: 'Football', country: 'United Kingdom', level: 'national', parentId: 'gb-fifa', required: true, website: 'https://www.thefa.com' },
  { id: 'gb-aiff', name: 'All India Football Federation', abbreviation: 'AIFF', sport: 'Football', country: 'India', level: 'national', parentId: 'gb-fifa', required: true, website: 'https://www.the-aiff.com' },
  // National — Tennis
  { id: 'gb-aita', name: 'All India Tennis Association', abbreviation: 'AITA', sport: 'Tennis', country: 'India', level: 'national', parentId: 'gb-itf', required: true, website: 'https://www.aitatennis.com' },
  { id: 'gb-usta', name: 'United States Tennis Association', abbreviation: 'USTA', sport: 'Tennis', country: 'United States', level: 'national', parentId: 'gb-itf', required: true, website: 'https://www.usta.com' },
  // State/Regional
  { id: 'gb-wifa', name: 'Western India Football Association', abbreviation: 'WIFA', sport: 'Football', country: 'India', state: 'Maharashtra', level: 'state', parentId: 'gb-aiff', required: true },
  { id: 'gb-mslta', name: 'Maharashtra State Lawn Tennis Association', abbreviation: 'MSLTA', sport: 'Tennis', country: 'India', state: 'Maharashtra', level: 'state', parentId: 'gb-aita', required: true },
  { id: 'gb-usta-south', name: 'USTA Southern Section', abbreviation: 'USTA Southern', sport: 'Tennis', country: 'United States', state: 'Southern', level: 'regional', parentId: 'gb-usta', required: true },
  // Optional
  { id: 'gb-ncaa', name: 'National Collegiate Athletic Association', abbreviation: 'NCAA', sport: 'Tennis', country: 'United States', level: 'optional', required: false },
  { id: 'gb-naia', name: 'National Association of Intercollegiate Athletics', abbreviation: 'NAIA', sport: 'Tennis', country: 'United States', level: 'optional', required: false },
];

export const governingBodyChains: GoverningBodyChain[] = [
  {
    sport: 'Football', country: 'United Kingdom',
    bodies: [governingBodies[0], governingBodies[3]], // FIFA → FA
  },
  {
    sport: 'Football', country: 'India', state: 'Maharashtra',
    bodies: [governingBodies[0], governingBodies[4], governingBodies[7]], // FIFA → AIFF → WIFA
  },
  {
    sport: 'Tennis', country: 'India', state: 'Maharashtra',
    bodies: [governingBodies[1], governingBodies[2], governingBodies[5], governingBodies[8]], // ITF, UTR → AITA → MSLTA
  },
  {
    sport: 'Tennis', country: 'United States', state: 'Southern',
    bodies: [governingBodies[1], governingBodies[2], governingBodies[6], governingBodies[9], governingBodies[10], governingBodies[11]], // ITF, UTR → USTA → Section → NCAA/NAIA
  },
];

// ══════════════════════════════════════════════════════
// MOCK: ASSOCIATIONS & LEAGUES
// ══════════════════════════════════════════════════════

export const associations: Association[] = [
  { id: 'assoc-1', name: 'Mumbai District Football Association', type: 'association', sport: 'Football', country: 'India', level: 'District', governingBodyId: 'gb-wifa' },
  { id: 'assoc-2', name: 'Maharashtra Tennis Association', type: 'association', sport: 'Tennis', country: 'India', level: 'State', governingBodyId: 'gb-mslta' },
  { id: 'assoc-3', name: 'SEC Conference', type: 'conference', sport: 'Tennis', country: 'United States', level: 'Collegiate', governingBodyId: 'gb-ncaa' },
];

export const leagues: LeagueCompetition[] = [
  { id: 'league-1', name: 'MDFA Elite Division', type: 'league', sport: 'Football', country: 'India', level: 'District', governingBodyId: 'gb-wifa', season: '2025-26' },
  { id: 'league-2', name: 'AITA National Series', type: 'tournament', sport: 'Tennis', country: 'India', level: 'National', governingBodyId: 'gb-aita', season: '2025' },
  { id: 'league-3', name: 'FA Youth Cup', type: 'cup', sport: 'Football', country: 'United Kingdom', level: 'National', governingBodyId: 'gb-fa', season: '2025-26' },
];

// ══════════════════════════════════════════════════════
// MOCK: GOVERNANCE CONFIG (FC Courtside = Football UK)
// ══════════════════════════════════════════════════════

export const governanceConfigs: GovernanceConfig[] = [
  {
    id: 'gc-fc-courtside',
    organizationId: 'fc-courtside',
    sport: 'Football',
    country: 'United Kingdom',
    state: undefined,
    governingBodyConfigs: [
      {
        governingBodyId: 'gb-fifa',
        governingBodyName: 'FIFA',
        requiredIds: [
          { id: 'eid-fifa-connect', label: 'FIFA Connect ID', idType: 'FIFA_CONNECT', governingBodyId: 'gb-fifa', scope: 'international', required: false, example: 'FC-12345678' },
        ],
        askExistingId: false,
        allowUnsureOption: false,
        requireTransferLogic: true,
        requireDocumentsIfUnregistered: false,
        approvalWorkflowEnabled: false,
      },
      {
        governingBodyId: 'gb-fa',
        governingBodyName: 'The FA',
        requiredIds: [
          { id: 'eid-fa-fan', label: 'FA FAN Number', idType: 'FA_FAN', governingBodyId: 'gb-fa', scope: 'national', required: true, example: 'FAN-9876543' },
        ],
        askExistingId: true,
        allowUnsureOption: true,
        requireTransferLogic: true,
        requireDocumentsIfUnregistered: true,
        approvalWorkflowEnabled: false,
      },
    ],
    associations: [],
    leagues: [leagues[2]],
    orgIds: [
      { id: 'oid-fa-club', label: 'FA Club Affiliation Number', governingBodyId: 'gb-fa', required: true, example: 'AFC-1234' },
    ],
    userIds: [
      { id: 'uid-fa-coach', label: 'FA Coaching License', governingBodyId: 'gb-fa', roles: ['coach'], required: true, example: 'UEFA-B-12345' },
    ],
    documentRequirements: [
      { id: 'doc-birth', label: 'Birth Certificate', documentType: 'birth_certificate', governingBodyId: 'gb-fa', conditions: { pathway: ['first_time'], ageRange: { max: 18 } }, required: true },
      { id: 'doc-id', label: 'ID Proof (Passport or Driving License)', documentType: 'id_proof', governingBodyId: 'gb-fa', conditions: { pathway: ['first_time', 'transfer', 'international'] }, required: true },
      { id: 'doc-consent', label: 'Parental Consent Form', documentType: 'consent_form', governingBodyId: 'gb-fa', conditions: { pathway: ['first_time'], ageRange: { max: 18 } }, required: true },
      { id: 'doc-noc', label: 'No Objection Certificate (NOC)', documentType: 'noc', governingBodyId: 'gb-fa', conditions: { pathway: ['transfer'], transferStatus: ['contract_active'] }, required: true },
    ],
  },
  // Football India — AIFF + WIFA
  {
    id: 'gc-india-football',
    organizationId: 'courtside-academy',
    sport: 'Football',
    country: 'India',
    state: 'Maharashtra',
    governingBodyConfigs: [
      {
        governingBodyId: 'gb-fifa',
        governingBodyName: 'FIFA',
        requiredIds: [],
        askExistingId: false,
        allowUnsureOption: false,
        requireTransferLogic: false,
        requireDocumentsIfUnregistered: false,
        approvalWorkflowEnabled: false,
      },
      {
        governingBodyId: 'gb-aiff',
        governingBodyName: 'AIFF',
        requiredIds: [
          { id: 'eid-aiff-player', label: 'AIFF Player Number', idType: 'AIFF', governingBodyId: 'gb-aiff', scope: 'national', required: true, example: 'AIFF-2024-12345' },
        ],
        askExistingId: true,
        allowUnsureOption: true,
        requireTransferLogic: true,
        requireDocumentsIfUnregistered: true,
        approvalWorkflowEnabled: true,
      },
      {
        governingBodyId: 'gb-wifa',
        governingBodyName: 'WIFA',
        requiredIds: [
          { id: 'eid-wifa-player', label: 'WIFA State Player ID', idType: 'WIFA', governingBodyId: 'gb-wifa', scope: 'local', required: true, example: 'WIFA-MH-5678' },
        ],
        askExistingId: true,
        allowUnsureOption: true,
        requireTransferLogic: false,
        requireDocumentsIfUnregistered: true,
        approvalWorkflowEnabled: true,
      },
    ],
    associations: [associations[0]],
    leagues: [leagues[0]],
    orgIds: [
      { id: 'oid-aiff-club', label: 'AIFF Club Registration Number', governingBodyId: 'gb-aiff', required: true, example: 'AIFF-CLB-001' },
      { id: 'oid-wifa-club', label: 'WIFA Club Affiliation ID', governingBodyId: 'gb-wifa', required: true, example: 'WIFA-AFF-123' },
    ],
    userIds: [
      { id: 'uid-aiff-coach', label: 'AIFF Coaching Certificate', governingBodyId: 'gb-aiff', roles: ['coach'], required: true, example: 'AIFF-D-LIC-001' },
      { id: 'uid-aiff-ref', label: 'AIFF Referee License', governingBodyId: 'gb-aiff', roles: ['staff'], required: false, example: 'AIFF-REF-001' },
    ],
    documentRequirements: [
      { id: 'doc-in-birth', label: 'Birth Certificate', documentType: 'birth_certificate', governingBodyId: 'gb-aiff', conditions: { pathway: ['first_time'] }, required: true },
      { id: 'doc-in-aadhaar', label: 'Aadhaar Card (Front & Back)', documentType: 'id_proof', governingBodyId: 'gb-aiff', conditions: { pathway: ['first_time', 'transfer'] }, required: true },
      { id: 'doc-in-consent', label: 'Consent Form (Signed & Stamped)', documentType: 'consent_form', governingBodyId: 'gb-aiff', conditions: { pathway: ['first_time'], ageRange: { max: 18 } }, required: true },
      { id: 'doc-in-passport', label: 'Passport', documentType: 'passport', governingBodyId: 'gb-aiff', conditions: { pathway: ['international'] }, required: true },
      { id: 'doc-in-noc', label: 'No Objection Certificate (NOC)', documentType: 'noc', governingBodyId: 'gb-aiff', conditions: { pathway: ['transfer'], transferStatus: ['contract_active'] }, required: true },
      { id: 'doc-in-address', label: 'Address Proof', documentType: 'address_proof', governingBodyId: 'gb-wifa', conditions: { pathway: ['first_time'] }, required: true },
    ],
  },
];

// Helper to find config for an org
export function getGovernanceConfig(organizationId: string): GovernanceConfig | undefined {
  return governanceConfigs.find(gc => gc.organizationId === organizationId);
}

// Helper to find chain for sport+country
export function getBodyChain(sport: string, country: string, state?: string): GoverningBodyChain | undefined {
  return governingBodyChains.find(c =>
    c.sport === sport && c.country === country && (!state || c.state === state)
  );
}
