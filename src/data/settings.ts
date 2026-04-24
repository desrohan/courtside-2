// ── Roles ──────────────────────────────────────────────
export interface Permission {
  id: string;
  name: string;
  group: string;
}

export interface Role {
  id: string;
  name: string;
  type: string;
  permissionIds: string[];
  isSystem: boolean;
}

export const permissionGroups: Record<string, Permission[]> = {
  'User Management': [
    { id: 'p-01', name: 'View User', group: 'User Management' },
    { id: 'p-02', name: 'Create User', group: 'User Management' },
    { id: 'p-03', name: 'Edit User', group: 'User Management' },
    { id: 'p-04', name: 'Delete User', group: 'User Management' },
    { id: 'p-05', name: 'Show User Details', group: 'User Management' },
    { id: 'p-06', name: 'User Request Approvals', group: 'User Management' },
  ],
  'Team Management': [
    { id: 'p-07', name: 'View Team', group: 'Team Management' },
    { id: 'p-08', name: 'Create Team', group: 'Team Management' },
    { id: 'p-09', name: 'Edit Team', group: 'Team Management' },
    { id: 'p-10', name: 'Delete Team', group: 'Team Management' },
  ],
  'Event Management': [
    { id: 'p-11', name: 'View Event', group: 'Event Management' },
    { id: 'p-12', name: 'Create Event', group: 'Event Management' },
    { id: 'p-13', name: 'Edit Event', group: 'Event Management' },
    { id: 'p-14', name: 'Delete Event', group: 'Event Management' },
    { id: 'p-15', name: 'Publish Event', group: 'Event Management' },
  ],
  'Itinerary & Checklist': [
    { id: 'p-16', name: 'View Itinerary', group: 'Itinerary & Checklist' },
    { id: 'p-17', name: 'Create Itinerary', group: 'Itinerary & Checklist' },
    { id: 'p-18', name: 'Delete Itinerary', group: 'Itinerary & Checklist' },
    { id: 'p-19', name: 'View Checklist', group: 'Itinerary & Checklist' },
    { id: 'p-20', name: 'Create Checklist', group: 'Itinerary & Checklist' },
  ],
  'Session & Attendance': [
    { id: 'p-21', name: 'View Event Session', group: 'Session & Attendance' },
    { id: 'p-22', name: 'Create Event Session', group: 'Session & Attendance' },
    { id: 'p-23', name: 'Mark Event Attendance', group: 'Session & Attendance' },
    { id: 'p-24', name: 'View Hydration', group: 'Session & Attendance' },
    { id: 'p-25', name: 'View Assignment', group: 'Session & Attendance' },
    { id: 'p-26', name: 'View Event Files', group: 'Session & Attendance' },
  ],
  'Forms': [
    { id: 'p-27', name: 'View Form', group: 'Forms' },
    { id: 'p-28', name: 'Create Form', group: 'Forms' },
    { id: 'p-29', name: 'Delete Form', group: 'Forms' },
    { id: 'p-30', name: 'View Form Assignment', group: 'Forms' },
    { id: 'p-31', name: 'My Form Assignment', group: 'Forms' },
    { id: 'p-32', name: 'View Form Submission', group: 'Forms' },
  ],
  'Organization': [
    { id: 'p-33', name: 'Edit Organization', group: 'Organization' },
    { id: 'p-34', name: 'View Role', group: 'Organization' },
    { id: 'p-35', name: 'View Designation', group: 'Organization' },
    { id: 'p-36', name: 'View Event Type', group: 'Organization' },
    { id: 'p-37', name: 'View Facility Center and Facility', group: 'Organization' },
    { id: 'p-38', name: 'View Tag', group: 'Organization' },
    { id: 'p-39', name: 'View Session', group: 'Organization' },
    { id: 'p-40', name: 'Chat', group: 'Organization' },
  ],
};

export const allPermissions = Object.values(permissionGroups).flat();

export const roles: Role[] = [
  { id: 'role-01', name: 'Administrator', type: 'General Admin', permissionIds: allPermissions.map(p => p.id), isSystem: true },
  { id: 'role-02', name: 'Head Coach', type: 'Coach', permissionIds: ['p-01', 'p-05', 'p-07', 'p-08', 'p-09', 'p-11', 'p-12', 'p-13', 'p-14', 'p-15', 'p-16', 'p-17', 'p-18', 'p-19', 'p-20', 'p-21', 'p-22', 'p-23', 'p-24', 'p-25', 'p-26', 'p-27', 'p-30', 'p-31', 'p-32', 'p-40'], isSystem: false },
  { id: 'role-03', name: 'Assistant Coach', type: 'Coach', permissionIds: ['p-01', 'p-05', 'p-07', 'p-11', 'p-12', 'p-13', 'p-16', 'p-17', 'p-19', 'p-20', 'p-21', 'p-22', 'p-23', 'p-24', 'p-25', 'p-31', 'p-40'], isSystem: false },
  { id: 'role-04', name: 'Medical Staff', type: 'Medical', permissionIds: ['p-01', 'p-05', 'p-11', 'p-16', 'p-19', 'p-21', 'p-23', 'p-24', 'p-27', 'p-28', 'p-30', 'p-31', 'p-32', 'p-40'], isSystem: false },
  { id: 'role-05', name: 'Player', type: 'Athlete', permissionIds: ['p-11', 'p-16', 'p-19', 'p-31', 'p-40'], isSystem: false },
  { id: 'role-06', name: 'Analyst', type: 'Operations', permissionIds: ['p-01', 'p-05', 'p-07', 'p-11', 'p-16', 'p-19', 'p-21', 'p-24', 'p-26', 'p-27', 'p-30', 'p-32', 'p-40'], isSystem: false },
];

// ── Designations ──────────────────────────────────────
export interface Designation {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  payType: CompensationPayType;
  rate: number;
  currency: string;
  overtimeMultiplier?: number;
}

export type CompensationPayType = 'hourly' | 'salaried' | 'none';

export const designations: Designation[] = [
  { id: 'des-01', name: 'Technical Director', roleId: 'role-01', roleName: 'Administrator', payType: 'salaried', rate: 180000, currency: 'INR', overtimeMultiplier: 1 },
  { id: 'des-02', name: 'Head Coach', roleId: 'role-02', roleName: 'Head Coach', payType: 'salaried', rate: 150000, currency: 'INR', overtimeMultiplier: 1 },
  { id: 'des-03', name: 'Assistant Coach', roleId: 'role-03', roleName: 'Assistant Coach', payType: 'salaried', rate: 95000, currency: 'INR', overtimeMultiplier: 1 },
  { id: 'des-04', name: 'Goalkeeping Coach', roleId: 'role-03', roleName: 'Assistant Coach', payType: 'hourly', rate: 900, currency: 'INR', overtimeMultiplier: 1.5 },
  { id: 'des-05', name: 'Head Physiotherapist', roleId: 'role-04', roleName: 'Medical Staff', payType: 'salaried', rate: 105000, currency: 'INR', overtimeMultiplier: 1 },
  { id: 'des-06', name: 'Sports Scientist', roleId: 'role-04', roleName: 'Medical Staff', payType: 'hourly', rate: 850, currency: 'INR', overtimeMultiplier: 1.75 },
  { id: 'des-07', name: 'Performance Analyst', roleId: 'role-06', roleName: 'Analyst', payType: 'hourly', rate: 700, currency: 'INR', overtimeMultiplier: 1.5 },
  { id: 'des-08', name: 'Player', roleId: 'role-05', roleName: 'Player', payType: 'none', rate: 0, currency: 'INR', overtimeMultiplier: 1 },
  { id: 'des-09', name: 'Kit Manager', roleId: 'role-06', roleName: 'Analyst', payType: 'hourly', rate: 500, currency: 'INR', overtimeMultiplier: 1.25 },
];

// ── Event Types ───────────────────────────────────────
export interface SettingsEventType {
  id: string;
  name: string;
  color: string;
  compliance: 'CARA' | 'VARA' | 'RARA' | 'NONE';
  competitive: boolean;
  skilledEvents: boolean;
  travelPossible: boolean;
}

export const settingsEventTypes: SettingsEventType[] = [
  { id: 'set-01', name: 'Training', color: '#00A76F', compliance: 'NONE', competitive: false, skilledEvents: false, travelPossible: false },
  { id: 'set-02', name: 'Match Day', color: '#FF5630', compliance: 'CARA', competitive: true, skilledEvents: true, travelPossible: true },
  { id: 'set-03', name: 'Friendly', color: '#FFAB00', compliance: 'VARA', competitive: false, skilledEvents: true, travelPossible: true },
  { id: 'set-04', name: 'Recovery', color: '#00B8D9', compliance: 'NONE', competitive: false, skilledEvents: false, travelPossible: false },
  { id: 'set-05', name: 'Team Meeting', color: '#8E33FF', compliance: 'NONE', competitive: false, skilledEvents: false, travelPossible: false },
  { id: 'set-06', name: 'Medical Assessment', color: '#FF6C40', compliance: 'NONE', competitive: false, skilledEvents: false, travelPossible: false },
  { id: 'set-07', name: 'Media / Press', color: '#637381', compliance: 'NONE', competitive: false, skilledEvents: false, travelPossible: false },
];

// ── Report Types ──────────────────────────────────────
export type ReportFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select';

export interface ReportFieldDef {
  id: string;
  label: string;
  type: ReportFieldType;
  required: boolean;
  options?: string[];   // only for 'select' type
}

export interface ReportTypeConfig {
  id: string;
  name: string;
  color: string;
  defaultSections: string[];
  fields: ReportFieldDef[];
  defaultVisibility: string[];   // designation IDs
  availableToGuardians: boolean;
}

export const reportTypes: ReportTypeConfig[] = [
  {
    id: 'rt-01', name: 'Pre-Match Analysis', color: '#3B82F6',
    defaultSections: ['Formation', 'Key Players', 'Strengths & Weaknesses', 'Game Plan', 'Conclusion'],
    fields: [
      { id: 'rf-01-1', label: 'Opponent', type: 'text', required: true },
      { id: 'rf-01-2', label: 'Match Date', type: 'date', required: false },
      { id: 'rf-01-3', label: 'Expected Formation', type: 'text', required: false },
    ],
    defaultVisibility: ['des-02', 'des-03', 'des-04'],
    availableToGuardians: false,
  },
  {
    id: 'rt-02', name: 'Post-Match Report', color: '#8B5CF6',
    defaultSections: ['Match Overview', 'Attacking Phase', 'Defending Phase', 'Set Play Analysis', 'Conclusion'],
    fields: [
      { id: 'rf-02-1', label: 'Final Score', type: 'text', required: true },
      { id: 'rf-02-2', label: 'Result', type: 'select', required: true, options: ['Win', 'Draw', 'Loss'] },
      { id: 'rf-02-3', label: 'Man of the Match', type: 'text', required: false },
    ],
    defaultVisibility: ['des-02', 'des-03', 'des-04', 'des-07'],
    availableToGuardians: false,
  },
  {
    id: 'rt-03', name: 'Training Report', color: '#00A76F',
    defaultSections: ['Session Overview', 'Drill Notes', 'Player Observations', 'Next Steps'],
    fields: [
      { id: 'rf-03-1', label: 'Session Focus', type: 'text', required: true },
      { id: 'rf-03-2', label: 'RPE (avg)', type: 'number', required: false },
    ],
    defaultVisibility: ['des-02', 'des-03', 'des-04'],
    availableToGuardians: false,
  },
  {
    id: 'rt-04', name: 'General', color: '#637381',
    defaultSections: ['Overview', 'Notes'],
    fields: [],
    defaultVisibility: ['des-02', 'des-03', 'des-04', 'des-05', 'des-06', 'des-07', 'des-09'],
    availableToGuardians: false,
  },
];

// ── Facility Centers & Facilities ─────────────────────
export interface SettingsFacility {
  id: string;
  name: string;
  facilityCenterId: string;
}

export interface SettingsFacilityCenter {
  id: string;
  name: string;
  activityIds: string[];
  facilities: SettingsFacility[];
}

export const settingsFacilityCenters: SettingsFacilityCenter[] = [
  {
    id: 'sfc-01', name: 'Courtside Stadium', activityIds: ['act-football'],
    facilities: [
      { id: 'sf-01', name: 'Main Pitch', facilityCenterId: 'sfc-01' },
      { id: 'sf-02', name: 'Press Conference Room', facilityCenterId: 'sfc-01' },
      { id: 'sf-03', name: 'VIP Lounge', facilityCenterId: 'sfc-01' },
    ],
  },
  {
    id: 'sfc-02', name: 'Courtside Training Ground', activityIds: ['act-football'],
    facilities: [
      { id: 'sf-04', name: 'Training Pitch A', facilityCenterId: 'sfc-02' },
      { id: 'sf-05', name: 'Training Pitch B', facilityCenterId: 'sfc-02' },
      { id: 'sf-06', name: 'Indoor Arena', facilityCenterId: 'sfc-02' },
      { id: 'sf-07', name: 'Gym & Fitness Centre', facilityCenterId: 'sfc-02' },
      { id: 'sf-08', name: 'Recovery Pool', facilityCenterId: 'sfc-02' },
      { id: 'sf-09', name: 'Tactical Room', facilityCenterId: 'sfc-02' },
    ],
  },
  {
    id: 'sfc-03', name: 'Academy Complex', activityIds: ['act-football'],
    facilities: [
      { id: 'sf-10', name: 'Academy Pitch 1', facilityCenterId: 'sfc-03' },
      { id: 'sf-11', name: 'Academy Pitch 2', facilityCenterId: 'sfc-03' },
      { id: 'sf-12', name: 'Academy Indoor Hall', facilityCenterId: 'sfc-03' },
      { id: 'sf-13', name: 'Classroom A', facilityCenterId: 'sfc-03' },
    ],
  },
];

// ── Tags ──────────────────────────────────────────────
export interface SettingsTag {
  id: string;
  name: string;
  activityId: string;
  activityName: string;
}

export const settingsTags: SettingsTag[] = [
  { id: 'tag-01', name: 'Starter', activityId: 'act-football', activityName: 'Football' },
  { id: 'tag-02', name: 'Substitute', activityId: 'act-football', activityName: 'Football' },
  { id: 'tag-03', name: 'Captain', activityId: 'act-football', activityName: 'Football' },
  { id: 'tag-04', name: 'Vice-Captain', activityId: 'act-football', activityName: 'Football' },
  { id: 'tag-05', name: 'Set Piece Taker', activityId: 'act-football', activityName: 'Football' },
  { id: 'tag-06', name: 'Penalty Taker', activityId: 'act-football', activityName: 'Football' },
  { id: 'tag-07', name: 'Loan Player', activityId: 'act-football', activityName: 'Football' },
  { id: 'tag-08', name: 'Youth Prospect', activityId: 'act-football', activityName: 'Football' },
];

// ── Activities ────────────────────────────────────────
export interface SettingsActivity {
  id: string;
  name: string;
  linkedEventTypeIds: string[];
}

export const settingsActivities: SettingsActivity[] = [
  { id: 'act-football', name: 'Football', linkedEventTypeIds: ['set-01', 'set-02', 'set-03', 'set-04', 'set-05', 'set-06', 'set-07'] },
];

// ── Activity Attributes ───────────────────────────────
export interface ActivityAttribute {
  id: string;
  name: string;
  activityId: string;
}

export const activityAttributes: ActivityAttribute[] = [
  { id: 'attr-01', name: 'Dribbling', activityId: 'act-football' },
  { id: 'attr-02', name: 'Shooting', activityId: 'act-football' },
  { id: 'attr-03', name: 'Passing', activityId: 'act-football' },
  { id: 'attr-04', name: 'Defending', activityId: 'act-football' },
  { id: 'attr-05', name: 'Tackling', activityId: 'act-football' },
  { id: 'attr-06', name: 'Set Pieces', activityId: 'act-football' },
  { id: 'attr-07', name: 'Fitness', activityId: 'act-football' },
  { id: 'attr-08', name: 'Tactical Awareness', activityId: 'act-football' },
  { id: 'attr-09', name: 'Positioning', activityId: 'act-football' },
  { id: 'attr-10', name: 'Crossing', activityId: 'act-football' },
  { id: 'attr-11', name: 'Heading', activityId: 'act-football' },
  { id: 'attr-12', name: 'Ball Control', activityId: 'act-football' },
];

// ── User Types ────────────────────────────────────────
export const userTypes = ['General Admin', 'Coach', 'Medical', 'Athlete', 'Operations', 'Connect'];

// ── Event Resource Preferences ────────────────────────
export type WeightUnit = 'kg' | 'lbs';

export interface EventResourcePreferences {
  weightUnit: WeightUnit;
}

export const eventResourcePreferences: EventResourcePreferences = {
  weightUnit: 'kg',
};

// ── Attendance Settings ──────────────────────────────
export type AttendancePreference = 'to_be_marked' | 'geolocation' | 'qr_code' | 'present_by_default' | 'absent_by_default';

export const attendancePreferenceLabels: Record<AttendancePreference, { label: string; short: string; color: string; bg: string }> = {
  to_be_marked:      { label: 'To Be Marked',       short: 'Marked',  color: 'text-dark-600',   bg: 'bg-dark-100' },
  geolocation:       { label: 'Geolocation Check-in', short: 'Geo',    color: 'text-blue-600',   bg: 'bg-blue-50' },
  qr_code:           { label: 'QR Code Check-in',   short: 'QR',      color: 'text-purple-600', bg: 'bg-purple-50' },
  present_by_default:{ label: 'Present by Default',  short: 'Present', color: 'text-green-600',  bg: 'bg-green-50' },
  absent_by_default: { label: 'Absent by Default',   short: 'Absent',  color: 'text-red-600',    bg: 'bg-red-50' },
};

export const attendanceUserTypes = ['Athlete', 'Coach', 'Medical', 'Operations', 'Super Admin', 'Guest'] as const;
export type AttendanceUserType = typeof attendanceUserTypes[number];

// Matrix: event type ID → user type → attendance preference
export interface AttendanceRule {
  eventTypeId: string;
  userType: AttendanceUserType;
  preference: AttendancePreference;
  requireCheckOut: boolean;      // true = must check out (only applies to geo/qr)
  qrRole?: 'scanner' | 'code';  // scanner = holds device & scans others, code = shows QR from profile (only for qr_code pref)
}

export interface AttendanceGeofenceConfig {
  radiusMeters: number;
  timeBeforeEvent: string;       // e.g. '30m', '1h', 'day_of'
  requireEveryEvent: boolean;    // false = once a day at same venue
  maxTimeBetweenEvents: number;  // minutes — if once a day, max gap for reuse
}

export const attendanceGeofenceConfig: AttendanceGeofenceConfig = {
  radiusMeters: 100,
  timeBeforeEvent: '30m',
  requireEveryEvent: false,
  maxTimeBetweenEvents: 120,
};

export interface AttendanceQrConfig {
  requireEveryEvent: boolean;     // false = one scan per day at same venue
  maxTimeBetweenEvents: number;   // minutes gap allowed for reuse
  adminRole: 'scanner' | 'code'; // scanner = admin holds device & scans others, code = user shows their QR
}

export const attendanceQrConfig: AttendanceQrConfig = {
  requireEveryEvent: true,
  maxTimeBetweenEvents: 0,
  adminRole: 'scanner',
};

// Default attendance rules matrix (event type × user type)
// qrRole: 'scanner' = holds the device & scans others' codes, 'code' = shows QR from their profile to be scanned
export const attendanceRules: AttendanceRule[] = [
  // Training
  { eventTypeId: 'set-01', userType: 'Athlete',     preference: 'absent_by_default',  requireCheckOut: false },
  { eventTypeId: 'set-01', userType: 'Coach',        preference: 'geolocation',        requireCheckOut: true },
  { eventTypeId: 'set-01', userType: 'Medical',      preference: 'qr_code',            requireCheckOut: true },
  { eventTypeId: 'set-01', userType: 'Operations',   preference: 'qr_code',            requireCheckOut: true,  qrRole: 'scanner' },
  { eventTypeId: 'set-01', userType: 'Super Admin',  preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-01', userType: 'Guest',        preference: 'absent_by_default',  requireCheckOut: false },
  // Match Day
  { eventTypeId: 'set-02', userType: 'Athlete',     preference: 'to_be_marked',       requireCheckOut: false },
  { eventTypeId: 'set-02', userType: 'Coach',        preference: 'geolocation',        requireCheckOut: true },
  { eventTypeId: 'set-02', userType: 'Medical',      preference: 'geolocation',        requireCheckOut: true },
  { eventTypeId: 'set-02', userType: 'Operations',   preference: 'qr_code',            requireCheckOut: true,  qrRole: 'scanner' },
  { eventTypeId: 'set-02', userType: 'Super Admin',  preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-02', userType: 'Guest',        preference: 'qr_code',            requireCheckOut: false, qrRole: 'code' },
  // Friendly
  { eventTypeId: 'set-03', userType: 'Athlete',     preference: 'to_be_marked',       requireCheckOut: false },
  { eventTypeId: 'set-03', userType: 'Coach',        preference: 'geolocation',        requireCheckOut: true },
  { eventTypeId: 'set-03', userType: 'Medical',      preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-03', userType: 'Operations',   preference: 'qr_code',            requireCheckOut: true,  qrRole: 'scanner' },
  { eventTypeId: 'set-03', userType: 'Super Admin',  preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-03', userType: 'Guest',        preference: 'absent_by_default',  requireCheckOut: false },
  // Recovery
  { eventTypeId: 'set-04', userType: 'Athlete',     preference: 'qr_code',            requireCheckOut: false, qrRole: 'code' },
  { eventTypeId: 'set-04', userType: 'Coach',        preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-04', userType: 'Medical',      preference: 'geolocation',        requireCheckOut: true },
  { eventTypeId: 'set-04', userType: 'Operations',   preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-04', userType: 'Super Admin',  preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-04', userType: 'Guest',        preference: 'absent_by_default',  requireCheckOut: false },
  // Team Meeting
  { eventTypeId: 'set-05', userType: 'Athlete',     preference: 'to_be_marked',       requireCheckOut: false },
  { eventTypeId: 'set-05', userType: 'Coach',        preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-05', userType: 'Medical',      preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-05', userType: 'Operations',   preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-05', userType: 'Super Admin',  preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-05', userType: 'Guest',        preference: 'absent_by_default',  requireCheckOut: false },
  // Medical Assessment
  { eventTypeId: 'set-06', userType: 'Athlete',     preference: 'to_be_marked',       requireCheckOut: false },
  { eventTypeId: 'set-06', userType: 'Coach',        preference: 'absent_by_default',  requireCheckOut: false },
  { eventTypeId: 'set-06', userType: 'Medical',      preference: 'geolocation',        requireCheckOut: true },
  { eventTypeId: 'set-06', userType: 'Operations',   preference: 'absent_by_default',  requireCheckOut: false },
  { eventTypeId: 'set-06', userType: 'Super Admin',  preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-06', userType: 'Guest',        preference: 'absent_by_default',  requireCheckOut: false },
  // Media / Press
  { eventTypeId: 'set-07', userType: 'Athlete',     preference: 'to_be_marked',       requireCheckOut: false },
  { eventTypeId: 'set-07', userType: 'Coach',        preference: 'absent_by_default',  requireCheckOut: false },
  { eventTypeId: 'set-07', userType: 'Medical',      preference: 'absent_by_default',  requireCheckOut: false },
  { eventTypeId: 'set-07', userType: 'Operations',   preference: 'qr_code',            requireCheckOut: true,  qrRole: 'scanner' },
  { eventTypeId: 'set-07', userType: 'Super Admin',  preference: 'present_by_default', requireCheckOut: false },
  { eventTypeId: 'set-07', userType: 'Guest',        preference: 'qr_code',            requireCheckOut: false, qrRole: 'code' },
];

// ── NEW Attendance Config Model (event-type-first) ───────────
export type CheckInMethod = 'manual' | 'geolocation' | 'qr_code' | 'none';

export const checkInMethodLabels: Record<CheckInMethod, { label: string; short: string; color: string; bg: string; icon: string }> = {
  manual:       { label: 'Manual',             short: 'Manual',  color: 'text-dark-600',   bg: 'bg-dark-100',   icon: '✋' },
  geolocation:  { label: 'Geolocation',        short: 'Geo',     color: 'text-blue-600',   bg: 'bg-blue-50',    icon: '📍' },
  qr_code:      { label: 'QR Code',            short: 'QR',      color: 'text-purple-600', bg: 'bg-purple-50',  icon: '📱' },
  none:         { label: 'No Check-in',        short: 'None',    color: 'text-dark-400',   bg: 'bg-dark-50',    icon: '—' },
};

export interface RoleAttendanceConfig {
  userType: AttendanceUserType;
  defaultStatus: 'absent' | 'present';
  checkInMethod: CheckInMethod;
  requireCheckOut: boolean;
  qrRole?: 'scanner' | 'code';
  checkOutRequirements: string[];    // e.g. ['attendance', 'ratings']
  payrollTracked: boolean;
}

export interface EventGeoConfig {
  radiusMeters: number;
  radiusUnit: 'm' | 'km';
  earlyCheckInMinutes: number;
}

export interface EventQrConfig {
  checkInOpensBeforeMinutes: number;
}

export interface EventAttendanceConfig {
  eventTypeId: string;
  roles: RoleAttendanceConfig[];
  geolocation: EventGeoConfig;
  qrCode: EventQrConfig;
  penaltyStartAfterMinutes: number;
  backToBackSameVenue: boolean;
  backToBackGapMinutes: number;
  checkoutRequired: boolean;       // event-level checkout toggle
}

// Helper: convert old preference to new defaultStatus + checkInMethod
function migratePreference(pref: AttendancePreference): { defaultStatus: 'absent' | 'present'; checkInMethod: CheckInMethod } {
  switch (pref) {
    case 'present_by_default': return { defaultStatus: 'present', checkInMethod: 'none' };
    case 'absent_by_default':  return { defaultStatus: 'absent',  checkInMethod: 'none' };
    case 'to_be_marked':       return { defaultStatus: 'absent',  checkInMethod: 'manual' };
    case 'geolocation':        return { defaultStatus: 'absent',  checkInMethod: 'geolocation' };
    case 'qr_code':            return { defaultStatus: 'absent',  checkInMethod: 'qr_code' };
  }
}

// Build new model from existing attendanceRules
export const eventAttendanceConfigs: EventAttendanceConfig[] = settingsEventTypes.map(et => {
  const etRules = attendanceRules.filter(r => r.eventTypeId === et.id);
  const hasGeo = etRules.some(r => r.preference === 'geolocation');
  const hasQr = etRules.some(r => r.preference === 'qr_code');

  const roles: RoleAttendanceConfig[] = attendanceUserTypes.map(ut => {
    const rule = etRules.find(r => r.userType === ut);
    const { defaultStatus, checkInMethod } = migratePreference(rule?.preference ?? 'to_be_marked');
    const isStaff = ['Coach', 'Medical', 'Operations'].includes(ut);
    return {
      userType: ut,
      defaultStatus,
      checkInMethod,
      requireCheckOut: rule?.requireCheckOut ?? false,
      qrRole: rule?.qrRole,
      checkOutRequirements: rule?.requireCheckOut ? ['attendance'] : [],
      payrollTracked: isStaff,
    };
  });

  return {
    eventTypeId: et.id,
    roles,
    geolocation: {
      radiusMeters: hasGeo ? attendanceGeofenceConfig.radiusMeters : 100,
      radiusUnit: 'm' as const,
      earlyCheckInMinutes: hasGeo ? 30 : 15,
    },
    qrCode: {
      checkInOpensBeforeMinutes: hasQr ? 15 : 15,
    },
    penaltyStartAfterMinutes: 30,
    backToBackSameVenue: hasGeo,
    backToBackGapMinutes: 30,
    checkoutRequired: etRules.some(r => r.requireCheckOut),
  };
});
