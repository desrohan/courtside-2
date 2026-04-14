import { format, subDays } from 'date-fns';

export type FieldType = 'text' | 'textarea' | 'select' | 'checkbox-group' | 'radio-group' | 'date' | 'number' | 'file' | 'header';
export type AssignmentType = 'time_sensitive' | 'perpetual';
export type AssignmentVisibility = 'public' | 'private';

export interface FormFieldValue {
  label: string;
  value: string;
  flagged?: boolean;  // true = this response triggers a flag/alert for review
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  required: boolean;
  values?: FormFieldValue[];
  placeholder?: string;
  rows?: number;
  min?: number;
  max?: number;
}

export interface Form {
  id: string;
  title: string;
  activityIds: string[];
  activityNames: string[];
  fields: FormField[];
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface FormAssignment {
  id: string;
  name: string;
  formId: string;
  formTitle: string;
  description: string;
  type: AssignmentType;
  visibility: AssignmentVisibility;
  allowMultiple: boolean;
  published: boolean;
  expiry?: string;
  assignedUserIds: string[];
  assignedBy: string;
  createdAt: string;
}

export interface FormSubmission {
  id: string;
  formAssignmentId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  data: Record<string, any>;
  submittedAt: string;
}

const today = format(new Date(), 'yyyy-MM-dd');

export const forms: Form[] = [
  {
    id: 'form-001',
    title: 'Pre-Match Medical Clearance',
    activityIds: ['act-football'],
    activityNames: ['Football'],
    active: true,
    createdBy: 'Sarah O\'Brien',
    createdAt: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    fields: [
      { id: 'f1', type: 'header', label: 'Pre-Match Medical Assessment', name: 'header1', required: false },
      { id: 'f2', type: 'text', label: 'Player Full Name', name: 'player_name', required: true },
      { id: 'f3', type: 'radio-group', label: 'Any pain or discomfort?', name: 'pain', required: true, values: [{ label: 'Yes', value: 'yes', flagged: true }, { label: 'No', value: 'no' }] },
      { id: 'f4', type: 'textarea', label: 'If yes, describe location and severity', name: 'pain_desc', required: false, rows: 3 },
      { id: 'f5', type: 'select', label: 'Current Fitness Level', name: 'fitness', required: true, values: [{ label: 'Fully Fit', value: 'full' }, { label: 'Minor Concern', value: 'minor', flagged: true }, { label: 'Not Match Ready', value: 'not_ready', flagged: true }] },
      { id: 'f6', type: 'number', label: 'Hours of Sleep Last Night', name: 'sleep', required: true, min: 0, max: 24 },
      { id: 'f7', type: 'radio-group', label: 'Cleared to Play?', name: 'cleared', required: true, values: [{ label: 'Yes - Full', value: 'yes_full' }, { label: 'Yes - Limited', value: 'yes_limited', flagged: true }, { label: 'No', value: 'no', flagged: true }] },
    ],
  },
  {
    id: 'form-002',
    title: 'Weekly Wellness Questionnaire',
    activityIds: ['act-football'],
    activityNames: ['Football'],
    active: true,
    createdBy: 'Sarah O\'Brien',
    createdAt: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
    fields: [
      { id: 'f8', type: 'header', label: 'Weekly Wellness Check', name: 'header2', required: false },
      { id: 'f9', type: 'number', label: 'Muscle Soreness (1-10)', name: 'soreness', required: true, min: 1, max: 10 },
      { id: 'f10', type: 'number', label: 'Fatigue Level (1-10)', name: 'fatigue', required: true, min: 1, max: 10 },
      { id: 'f11', type: 'number', label: 'Stress Level (1-10)', name: 'stress', required: true, min: 1, max: 10 },
      { id: 'f12', type: 'number', label: 'Sleep Quality (1-10)', name: 'sleep_quality', required: true, min: 1, max: 10 },
      { id: 'f13', type: 'number', label: 'Mood (1-10)', name: 'mood', required: true, min: 1, max: 10 },
      { id: 'f14', type: 'textarea', label: 'Additional Notes', name: 'notes', required: false, rows: 3 },
    ],
  },
  {
    id: 'form-003',
    title: 'Player Feedback Survey',
    activityIds: ['act-football'],
    activityNames: ['Football'],
    active: true,
    createdBy: 'James Carter',
    createdAt: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
    fields: [
      { id: 'f15', type: 'select', label: 'Training Session Rating', name: 'rating', required: true, values: [{ label: 'Excellent', value: '5' }, { label: 'Good', value: '4' }, { label: 'Average', value: '3' }, { label: 'Below Average', value: '2' }, { label: 'Poor', value: '1' }] },
      { id: 'f16', type: 'checkbox-group', label: 'What went well?', name: 'positives', required: false, values: [{ label: 'Tactics', value: 'tactics' }, { label: 'Fitness', value: 'fitness' }, { label: 'Team Spirit', value: 'spirit' }, { label: 'Communication', value: 'comm' }] },
      { id: 'f17', type: 'textarea', label: 'Suggestions for improvement', name: 'suggestions', required: false, rows: 4 },
    ],
  },
  {
    id: 'form-004',
    title: 'Injury Report Form',
    activityIds: ['act-football'],
    activityNames: ['Football'],
    active: true,
    createdBy: 'Sarah O\'Brien',
    createdAt: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
    fields: [
      { id: 'f18', type: 'text', label: 'Player Name', name: 'player', required: true },
      { id: 'f19', type: 'date', label: 'Date of Injury', name: 'injury_date', required: true },
      { id: 'f20', type: 'select', label: 'Injury Type', name: 'injury_type', required: true, values: [{ label: 'Muscle', value: 'muscle' }, { label: 'Ligament', value: 'ligament' }, { label: 'Bone', value: 'bone' }, { label: 'Concussion', value: 'concussion' }, { label: 'Other', value: 'other' }] },
      { id: 'f21', type: 'text', label: 'Body Part Affected', name: 'body_part', required: true },
      { id: 'f22', type: 'textarea', label: 'Description of Incident', name: 'incident', required: true, rows: 4 },
      { id: 'f23', type: 'number', label: 'Estimated Recovery Days', name: 'recovery_days', required: false, min: 1 },
    ],
  },
  {
    id: 'form-005',
    title: 'Travel Consent Form',
    activityIds: ['act-football'],
    activityNames: ['Football'],
    active: false,
    createdBy: 'Marcus Reid',
    createdAt: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    fields: [
      { id: 'f24', type: 'text', label: 'Player Name', name: 'name', required: true },
      { id: 'f25', type: 'text', label: 'Parent/Guardian Name', name: 'guardian', required: true },
      { id: 'f26', type: 'radio-group', label: 'Consent Given?', name: 'consent', required: true, values: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
      { id: 'f27', type: 'date', label: 'Date', name: 'date', required: true },
    ],
  },
];

export const formAssignments: FormAssignment[] = [
  {
    id: 'fa-001', name: 'Pre-Match Medical - vs Riverside FC', formId: 'form-001', formTitle: 'Pre-Match Medical Clearance',
    description: 'All first team players must complete before Saturday match',
    type: 'time_sensitive', visibility: 'private', allowMultiple: false, published: true,
    expiry: format(new Date(Date.now() + 2 * 86400000), 'yyyy-MM-dd'),
    assignedUserIds: ['p-001', 'p-002', 'p-003', 'p-004', 'p-005', 'p-006', 'p-007', 'p-008', 'p-010', 'p-011'],
    assignedBy: 'Sarah O\'Brien', createdAt: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
  },
  {
    id: 'fa-002', name: 'Weekly Wellness - Week 14', formId: 'form-002', formTitle: 'Weekly Wellness Questionnaire',
    description: 'Monday morning wellness check for all squads',
    type: 'perpetual', visibility: 'private', allowMultiple: true, published: true,
    assignedUserIds: ['p-001', 'p-002', 'p-003', 'p-004', 'p-005', 'p-006', 'p-007', 'p-008', 'p-009', 'p-010', 'p-011', 'p-012', 'p-013'],
    assignedBy: 'Sarah O\'Brien', createdAt: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
  },
  {
    id: 'fa-003', name: 'Training Feedback - March', formId: 'form-003', formTitle: 'Player Feedback Survey',
    description: 'Monthly training quality feedback',
    type: 'time_sensitive', visibility: 'private', allowMultiple: false, published: true,
    expiry: format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'),
    assignedUserIds: ['p-001', 'p-002', 'p-003', 'p-006', 'p-008', 'p-011'],
    assignedBy: 'James Carter', createdAt: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
  },
  {
    id: 'fa-004', name: 'Injury Report - Brooks Hamstring', formId: 'form-004', formTitle: 'Injury Report Form',
    description: 'Document Brooks hamstring injury details',
    type: 'perpetual', visibility: 'private', allowMultiple: false, published: false,
    assignedUserIds: ['u-005'],
    assignedBy: 'Sarah O\'Brien', createdAt: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
  },
];

export const formSubmissions: FormSubmission[] = [
  { id: 'fs-001', formAssignmentId: 'fa-002', userId: 'p-001', userName: 'Liam Henderson', userAvatar: 'LH', data: { soreness: 4, fatigue: 3, stress: 2, sleep_quality: 8, mood: 7, notes: '' }, submittedAt: format(subDays(new Date(), 0), 'yyyy-MM-dd') },
  { id: 'fs-002', formAssignmentId: 'fa-002', userId: 'p-006', userName: 'Jack Brennan', userAvatar: 'JB', data: { soreness: 6, fatigue: 5, stress: 3, sleep_quality: 6, mood: 7, notes: 'Slight tightness in left calf' }, submittedAt: format(subDays(new Date(), 0), 'yyyy-MM-dd') },
  { id: 'fs-003', formAssignmentId: 'fa-002', userId: 'p-011', userName: 'Gabriel Torres', userAvatar: 'GT', data: { soreness: 3, fatigue: 4, stress: 2, sleep_quality: 9, mood: 9, notes: '' }, submittedAt: format(subDays(new Date(), 0), 'yyyy-MM-dd') },
  { id: 'fs-004', formAssignmentId: 'fa-002', userId: 'p-008', userName: 'Noah Clarke', userAvatar: 'NC', data: { soreness: 5, fatigue: 6, stress: 4, sleep_quality: 7, mood: 6, notes: 'Bit tired from travel' }, submittedAt: format(subDays(new Date(), 0), 'yyyy-MM-dd') },
  { id: 'fs-005', formAssignmentId: 'fa-003', userId: 'p-011', userName: 'Gabriel Torres', userAvatar: 'GT', data: { rating: '5', positives: ['tactics', 'spirit'], suggestions: 'More shooting drills please' }, submittedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd') },
  { id: 'fs-006', formAssignmentId: 'fa-003', userId: 'p-006', userName: 'Jack Brennan', userAvatar: 'JB', data: { rating: '4', positives: ['fitness', 'comm'], suggestions: '' }, submittedAt: format(subDays(new Date(), 2), 'yyyy-MM-dd') },
];

// Helper for "my assignments" - forms assigned to current user
export function getMyAssignments(userId: string) {
  return formAssignments.filter(fa => fa.assignedUserIds.includes(userId) && fa.published);
}
