// ══════════════════════════════════════════════════════
// ATHLETE REGISTRATION DOMAIN MODEL
// ══════════════════════════════════════════════════════

export interface ExternalIdRecord {
  id: string;
  idType: string;
  idValue: string;
  issuingBody: string;
  governingBodyId: string;
  scope: 'local' | 'national' | 'international';
  sport: string;
  verifiedStatus: boolean;
  metadata?: Record<string, unknown>;
}

export type RegistrationStatus = 'already_registered' | 'not_registered' | 'unsure';

export type TransferStatus =
  | 'not_applicable'
  | 'contract_active'
  | 'contract_expired'
  | 'transfer_required'
  | 'noc_uploaded';

export interface DocumentRecord {
  id: string;
  documentType: string;
  label: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'not_uploaded';
  rejectionReason?: string;
  expiresAt?: string;
}

export type ApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'state_approval_pending'
  | 'state_approved'
  | 'national_approval_pending'
  | 'national_approved'
  | 'rejected';

export interface GoverningWorkflow {
  stateApprovalStatus: ApprovalStatus;
  nationalApprovalStatus: ApprovalStatus;
  remarks?: string;
  submittedAt?: string;
  stateApprovedAt?: string;
  nationalApprovedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export type RegistrationPathway = 'first_time' | 'existing' | 'transfer' | 'international';

export interface AthleteRegistration {
  id: string;
  athleteId: string;
  organizationId: string;

  sportContext: {
    sport: string;
    country: string;
    state?: string;
  };

  externalIds: ExternalIdRecord[];
  registrationStatus: RegistrationStatus;
  registrationPathway?: RegistrationPathway;

  transferStatus: TransferStatus;
  previousClub?: string;
  previousClubCountry?: string;

  documents: DocumentRecord[];
  governingWorkflow?: GoverningWorkflow;

  createdAt: string;
  updatedAt: string;
}

// ══════════════════════════════════════════════════════
// STATUS HELPERS
// ══════════════════════════════════════════════════════

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  already_registered: 'Already Registered',
  not_registered: 'Not Registered',
  unsure: 'Unsure',
};

export const transferStatusLabels: Record<TransferStatus, string> = {
  not_applicable: 'Not Applicable',
  contract_active: 'Contract Active',
  contract_expired: 'Contract Expired',
  transfer_required: 'Transfer Required',
  noc_uploaded: 'NOC Uploaded',
};

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  state_approval_pending: 'State Approval Pending',
  state_approved: 'State Approved',
  national_approval_pending: 'National Approval Pending',
  national_approved: 'National Approved',
  rejected: 'Rejected',
};

export const approvalStatusColors: Record<ApprovalStatus, string> = {
  draft: '#919EAB',
  submitted: '#00B8D9',
  state_approval_pending: '#FFAB00',
  state_approved: '#36B37E',
  national_approval_pending: '#FFAB00',
  national_approved: '#00A76F',
  rejected: '#FF5630',
};

export const registrationStatusColors: Record<RegistrationStatus, string> = {
  already_registered: '#00A76F',
  not_registered: '#FF5630',
  unsure: '#FFAB00',
};

export const transferStatusColors: Record<TransferStatus, string> = {
  not_applicable: '#919EAB',
  contract_active: '#FF5630',
  contract_expired: '#FFAB00',
  transfer_required: '#8E33FF',
  noc_uploaded: '#00B8D9',
};

// ══════════════════════════════════════════════════════
// MOCK DATA
// ══════════════════════════════════════════════════════

export const athleteRegistrations: AthleteRegistration[] = [
  // Athlete A — Complete, registered, approved
  {
    id: 'areg-001',
    athleteId: 'p-001',
    organizationId: 'fc-courtside',
    sportContext: { sport: 'Football', country: 'United Kingdom' },
    externalIds: [
      { id: 'eid-001', idType: 'FA_FAN', idValue: 'FAN-7823456', issuingBody: 'The FA', governingBodyId: 'gb-fa', scope: 'national', sport: 'Football', verifiedStatus: true },
      { id: 'eid-002', idType: 'FIFA_CONNECT', idValue: 'FC-90001234', issuingBody: 'FIFA', governingBodyId: 'gb-fifa', scope: 'international', sport: 'Football', verifiedStatus: true },
    ],
    registrationStatus: 'already_registered',
    registrationPathway: 'existing',
    transferStatus: 'not_applicable',
    documents: [
      { id: 'doc-001', documentType: 'id_proof', label: 'Passport', fileName: 'liam_passport.pdf', uploadedAt: '2024-08-15', verificationStatus: 'verified' },
    ],
    governingWorkflow: {
      stateApprovalStatus: 'national_approved',
      nationalApprovalStatus: 'national_approved',
      submittedAt: '2024-07-01',
      nationalApprovedAt: '2024-07-20',
    },
    createdAt: '2024-07-01',
    updatedAt: '2024-07-20',
  },
  // Athlete B — New registration, pending approval
  {
    id: 'areg-002',
    athleteId: 'p-002',
    organizationId: 'fc-courtside',
    sportContext: { sport: 'Football', country: 'United Kingdom' },
    externalIds: [],
    registrationStatus: 'not_registered',
    registrationPathway: 'first_time',
    transferStatus: 'not_applicable',
    documents: [
      { id: 'doc-002', documentType: 'birth_certificate', label: 'Birth Certificate', fileName: 'marcus_birth_cert.pdf', uploadedAt: '2025-01-10', verificationStatus: 'verified' },
      { id: 'doc-003', documentType: 'id_proof', label: 'Passport', fileName: 'marcus_passport.pdf', uploadedAt: '2025-01-10', verificationStatus: 'pending' },
      { id: 'doc-004', documentType: 'consent_form', label: 'Parental Consent Form', fileName: 'marcus_consent.pdf', uploadedAt: '2025-01-10', verificationStatus: 'verified' },
    ],
    governingWorkflow: {
      stateApprovalStatus: 'state_approval_pending',
      nationalApprovalStatus: 'draft',
      submittedAt: '2025-01-10',
      remarks: 'Documents uploaded, awaiting FA review.',
    },
    createdAt: '2025-01-10',
    updatedAt: '2025-01-10',
  },
  // Athlete C — Transfer required, contract expired
  {
    id: 'areg-003',
    athleteId: 'p-003',
    organizationId: 'fc-courtside',
    sportContext: { sport: 'Football', country: 'United Kingdom' },
    externalIds: [
      { id: 'eid-003', idType: 'FA_FAN', idValue: 'FAN-5551234', issuingBody: 'The FA', governingBodyId: 'gb-fa', scope: 'national', sport: 'Football', verifiedStatus: true },
    ],
    registrationStatus: 'already_registered',
    registrationPathway: 'transfer',
    transferStatus: 'contract_expired',
    previousClub: 'Arsenal Academy',
    previousClubCountry: 'United Kingdom',
    documents: [
      { id: 'doc-005', documentType: 'id_proof', label: 'Passport', fileName: 'kai_passport.pdf', uploadedAt: '2025-02-01', verificationStatus: 'verified' },
    ],
    governingWorkflow: {
      stateApprovalStatus: 'national_approved',
      nationalApprovalStatus: 'national_approved',
      submittedAt: '2025-02-01',
      nationalApprovedAt: '2025-02-15',
    },
    createdAt: '2025-02-01',
    updatedAt: '2025-02-15',
  },
  // Athlete D — Unsure, draft, flagged
  {
    id: 'areg-004',
    athleteId: 'p-004',
    organizationId: 'fc-courtside',
    sportContext: { sport: 'Football', country: 'United Kingdom' },
    externalIds: [],
    registrationStatus: 'unsure',
    registrationPathway: undefined,
    transferStatus: 'not_applicable',
    documents: [],
    governingWorkflow: {
      stateApprovalStatus: 'draft',
      nationalApprovalStatus: 'draft',
      remarks: 'Parent unsure about previous registration. Flagged for admin follow-up.',
    },
    createdAt: '2025-03-01',
    updatedAt: '2025-03-01',
  },
];

export function getAthleteRegistration(athleteId: string): AthleteRegistration | undefined {
  return athleteRegistrations.find(r => r.athleteId === athleteId);
}

export function getRegistrationCompletionPercent(reg: AthleteRegistration): number {
  let total = 4; // status, pathway, transfer check, at least one doc or ID
  let done = 0;
  if (reg.registrationStatus !== 'unsure') done++;
  if (reg.registrationPathway) done++;
  if (reg.externalIds.length > 0) done++;
  if (reg.documents.filter(d => d.verificationStatus !== 'not_uploaded').length > 0) done++;
  return Math.round((done / total) * 100);
}
