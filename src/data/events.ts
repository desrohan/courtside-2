import { addDays, format, subDays, addHours, startOfMonth, endOfMonth, setHours, setMinutes } from 'date-fns';
import { attendanceGeofenceConfig, AttendanceGeofenceConfig, attendanceQrConfig, AttendanceQrConfig, attendanceRules, AttendancePreference } from './settings';
export type { AttendanceGeofenceConfig, AttendanceQrConfig, AttendancePreference };

export type EventPrivacy = 'public' | 'private';
export type LocationType = 'home' | 'away';
export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

export interface EventDateTime {
  date: string;
  time: string;
  timezone: string;
}

export interface EventType {
  id: string;
  name: string;
  color: string;
  icon: string;
  config?: { travelPossible?: boolean };
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
}

export type AttendanceCheckInType = 'to_be_marked' | 'geolocation' | 'qr_code';
export type AttendanceStatus = 'none' | 'present' | 'absent' | 'late' | 'excused' | 'pending' | 'left_early';

export interface AttendanceRecord {
  userId: string;
  name: string;
  avatar: string;
  role: 'player' | 'coach' | 'staff' | 'admin' | 'medical';
  status: AttendanceStatus;
  checkInType: AttendanceCheckInType;
  checkInTime?: string;
  checkInAdminName?: string;              // QR: name of admin holding the scanner at check-in
  qrCheckInTiming?: 'on_time' | 'late';  // QR: check-in timing relative to event start
  geoCheckInTiming?: 'early' | 'on_time' | 'late'; // Geo: check-in timing relative to event start
  geoLocation?: { lat: number; lng: number; accuracy: number; withinRadius: boolean };
  checkOutTime?: string;
  checkOutType?: 'qr_code' | 'geolocation'; // check-out method (may differ from check-in)
  checkOutAdminName?: string;                // QR: name of admin holding the scanner at check-out
  qrCheckOutTiming?: 'on_time' | 'early';   // QR: check-out timing relative to event end
  geoCheckOutTiming?: 'on_time' | 'early';  // Geo: was check-out after event end?
  geoCheckOutLocation?: { lat: number; lng: number; accuracy: number; withinRadius: boolean };
  overriddenBy?: string;       // who overrode a self-check-in
  overrideReason?: string;     // required note when overriding
  appeal?: AttendanceAppeal;   // coach-filed appeal for review
  staleMissedCheckout?: boolean; // true = >12h since event end with no checkout recorded
  checkoutResolution?: {         // set when admin resolves a stale missed checkout
    status: AttendanceStatus;
    note: string;
    resolvedBy: string;
    resolvedAt: string;
  };
  note?: string;
  jerseyNumber?: number;
  position?: string;
}

export interface AttendanceAppeal {
  note: string;
  filedBy: string;
  filedAt: string;             // ISO timestamp
  status: 'pending' | 'accepted' | 'rejected';
  resolvedBy?: string;
  resolvedStatus?: AttendanceStatus;
}

export interface SessionData {
  id: string;
  duration: number;
  rpe: number;
  tags: string[];
  notes: string;
}

export interface HydrationRecord {
  userId: string;
  name: string;
  avatar: string;
  preWeight?: number;
  postWeight?: number;
}

export interface AssignmentRecord {
  userId: string;
  name: string;
  avatar: string;
  role: string;
  confirmed: boolean;
}

export interface FileRecord {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

// ── Reports ───────────────────────────────────────────────
export type ReportStatus     = 'draft' | 'published';
export type ReportVisibility = 'coaches_only' | 'all_staff' | 'players' | 'guardians';

export interface ReportSection {
  id: string;
  title: string;
  content: string;
}

export interface EventReport {
  id: string;
  title: string;
  typeId: string;   // references ReportTypeConfig.id from settings
  status: ReportStatus;
  visibility: ReportVisibility[];
  author: { id: string; name: string; avatar: string };
  createdAt: string;
  updatedAt: string;
  fieldValues: Record<string, string>;  // keyed by ReportFieldDef.id
  sections: ReportSection[];
}

// ── Scores / Results ─────────────────────────────────────
export type MatchStatus = 'not_entered' | 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled' | 'abandoned';
export type Sport = 'football' | 'tennis' | 'cricket' | 'american_football';

export type FootballDecider = 'normal_time' | 'extra_time' | 'penalty_shootout' | 'forfeit' | 'abandoned';
export type TennisDecider = 'completed' | 'retirement' | 'walkover' | 'default' | 'abandoned';
export type CricketResultType = 'won_by_runs' | 'won_by_wickets' | 'tie' | 'draw' | 'no_result' | 'abandoned' | 'won_by_dls';
export type AmericanFootballDecider = 'regulation' | 'overtime' | 'forfeit' | 'abandoned';

export type Outcome = 'win' | 'loss' | 'draw' | 'tie' | 'no_result' | 'abandoned' | 'walkover_win' | 'walkover_loss' | 'retired_win' | 'retired_loss';

export interface FootballScoreInput {
  home_goals: number;
  away_goals: number;
  decider: FootballDecider;
  penalties?: { home: number; away: number };
}

export interface TennisScoreInput {
  score_summary: string;       // e.g. "6-3, 6-4"
  decider: TennisDecider;
}

export interface CricketScoreInput {
  home_innings: { runs: number; wickets: number; overs: string };
  away_innings: { runs: number; wickets: number; overs: string };
  result_type: CricketResultType;
  margin?: { value: number; unit: 'runs' | 'wickets' | 'innings' };
}

export interface AmericanFootballScoreInput {
  home_points: number;
  away_points: number;
  period_scores?: { Q1?: number; Q2?: number; Q3?: number; Q4?: number; OT?: number }[];
  decider: AmericanFootballDecider;
}

export type ScoreInput = FootballScoreInput | TennisScoreInput | CricketScoreInput | AmericanFootballScoreInput;

export interface ScoreResult {
  sport: Sport;
  match_status: MatchStatus;
  home_participant: string;   // team or player name
  away_participant: string;
  score_input?: ScoreInput;
  winner?: 'home' | 'away' | 'draw' | 'no_result';
  outcome?: Outcome;           // from home perspective
  score_display?: string;      // e.g. "3-1"
  summary?: string;            // e.g. "Won 3-1 vs Riverside FC"
  scorers?: { name: string; minute: number; type: 'goal' | 'penalty' | 'own_goal' | 'free_kick'; team: 'home' | 'away' }[];
}

export interface RatingHistoryItem {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  jerseyNumber?: number;
  position?: string;
  mode: 'basic' | 'dimensional' | 'advanced';
  overall?: number | null;
  dimensions?: { key: string; label: string; color: string; value: number | null }[];
  comment?: string;
}

export interface EventHistoryEntry {
  id: string;
  action: 'created' | 'updated' | 'published' | 'unpublished' | 'submitted_for_review' | 'rated' | 'self_rated';
  timestamp: string;
  userId: string;
  userName: string;
  changes?: { field: string; from: string; to: string }[];
  ratings?: RatingHistoryItem[];
  notified: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: EventDateTime;
  end: EventDateTime;
  eventType: EventType;
  privacy: EventPrivacy;
  teamIds: string[];
  teamNames: string[];
  locationtype: LocationType;
  location: string;
  facilityCenterId?: string;
  facilityIds?: string[];
  allDay: boolean;
  published: boolean;
  status: 'draft' | 'in_review' | 'published';
  ownerId: string;
  expectedRpe?: number;
  hasItinerary: boolean;
  hasChecklist: boolean;
  hasSession: boolean;
  hasHydration: boolean;
  hasFiles: boolean;
  hasAssignment: boolean;
  hasScores: boolean;
  checklist?: ChecklistItem[];
  itinerary?: ItineraryItem[];
  attendance?: AttendanceRecord[];
  session?: SessionData;
  hydration?: HydrationRecord[];
  assignments?: AssignmentRecord[];
  files?: FileRecord[];
  reports?: EventReport[];
  scores?: ScoreResult;
  history?: EventHistoryEntry[];
  geoSettings?: AttendanceGeofenceConfig;                   // per-event override of global geo config
  qrSettings?: AttendanceQrConfig;                          // per-event override of global QR config
  roleAttendanceTypes?: Record<string, AttendancePreference>; // per-event role→check-in type override
  roleRequireCheckOut?: Record<string, boolean>;            // per-event role→requireCheckOut override
  segmentId?: string;
  batchIds?: string[];
}

export const eventTypes: EventType[] = [
  { id: 'et-training', name: 'Training', color: '#00A76F', icon: 'dumbbell', config: { travelPossible: false } },
  { id: 'et-match', name: 'Match Day', color: '#FF5630', icon: 'trophy', config: { travelPossible: true } },
  { id: 'et-friendly', name: 'Friendly', color: '#FFAB00', icon: 'handshake', config: { travelPossible: true } },
  { id: 'et-recovery', name: 'Recovery', color: '#00B8D9', icon: 'heart-pulse', config: { travelPossible: false } },
  { id: 'et-meeting', name: 'Team Meeting', color: '#8E33FF', icon: 'presentation', config: { travelPossible: false } },
  { id: 'et-medical', name: 'Medical Assessment', color: '#FF6C40', icon: 'stethoscope', config: { travelPossible: false } },
  { id: 'et-media', name: 'Media / Press', color: '#637381', icon: 'camera', config: { travelPossible: false } },
];

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');

function d(offset: number): string {
  return format(addDays(today, offset), 'yyyy-MM-dd');
}

const defaultAttendance: AttendanceRecord[] = [
  { userId: 'p-001', name: 'Liam Henderson',  avatar: 'LH', role: 'player',  status: 'none',    checkInType: 'to_be_marked', jerseyNumber: 1,  position: 'GK' },
  { userId: 'p-002', name: 'Marcus Williams',  avatar: 'MW', role: 'player',  status: 'none',    checkInType: 'to_be_marked', jerseyNumber: 4,  position: 'CB' },
  { userId: 'p-003', name: 'Kai Tanaka',       avatar: 'KT', role: 'player',  status: 'none',    checkInType: 'to_be_marked', jerseyNumber: 5,  position: 'CB' },
  { userId: 'p-004', name: 'Omar Hassan',      avatar: 'OH', role: 'player',  status: 'none',    checkInType: 'to_be_marked', jerseyNumber: 3,  position: 'LB' },
  { userId: 'p-005', name: 'Andre Silva',      avatar: 'AS', role: 'player',  status: 'late',    checkInType: 'to_be_marked', jerseyNumber: 2,  position: 'RB', note: 'Traffic delay' },
  // All players use manual (to_be_marked) — consistent per role
  { userId: 'p-006', name: 'Jack Brennan',     avatar: 'JB', role: 'player',  status: 'present', checkInType: 'to_be_marked', jerseyNumber: 8,  position: 'CM' },
  { userId: 'p-007', name: 'Leo Fernandez',    avatar: 'LF', role: 'player',  status: 'none',    checkInType: 'to_be_marked', jerseyNumber: 6,  position: 'DM' },
  { userId: 'p-008', name: 'Noah Clarke',      avatar: 'NC', role: 'player',  status: 'none',    checkInType: 'to_be_marked', jerseyNumber: 10, position: 'AM' },
  { userId: 'p-009', name: 'Ethan Brooks',     avatar: 'EB', role: 'player',  status: 'excused', checkInType: 'to_be_marked', jerseyNumber: 7,  position: 'RW', note: 'Hamstring strain - rehab' },
  { userId: 'p-010', name: 'Lucas Dubois',     avatar: 'LD', role: 'player',  status: 'present', checkInType: 'to_be_marked', jerseyNumber: 11, position: 'LW' },
  { userId: 'p-011', name: 'Gabriel Torres',   avatar: 'GT', role: 'player',  status: 'present', checkInType: 'to_be_marked', jerseyNumber: 9,  position: 'ST' },
  // ── Coaches (geolocation) — all 4 timing scenarios ──
  // On-time check-in, after-end checkout
  { userId: 'u-002', name: 'James Carter',  avatar: 'JC', role: 'coach', status: 'present', checkInType: 'geolocation', checkInTime: '08:30', geoCheckInTiming: 'on_time',
    geoLocation: { lat: 51.4817, lng: -0.0091, accuracy: 5, withinRadius: true },
    checkOutTime: '11:38', checkOutType: 'geolocation', geoCheckOutTiming: 'on_time',
    geoCheckOutLocation: { lat: 51.4817, lng: -0.0090, accuracy: 6, withinRadius: true } },
  // Late check-in, early checkout — has filed an appeal
  { userId: 'u-003', name: 'Elena Vasquez', avatar: 'EV', role: 'coach', status: 'late',    checkInType: 'geolocation', checkInTime: '09:14', geoCheckInTiming: 'late',
    geoLocation: { lat: 51.4815, lng: -0.0095, accuracy: 12, withinRadius: true },
    checkOutTime: '11:15', checkOutType: 'geolocation', geoCheckOutTiming: 'early',
    geoCheckOutLocation: { lat: 51.4815, lng: -0.0094, accuracy: 9, withinRadius: true },
    appeal: { note: 'Staff briefing ran over — arrived as soon as it ended. Happy to provide meeting minutes as evidence.', filedBy: 'Elena Vasquez', filedAt: '2026-04-05T10:15:00Z', status: 'pending' } },
  // On-time check-in, no checkout yet
  // On-time check-in, no checkout — stale (>12h): status reset to pending, requires modal resolution
  { userId: 'u-007', name: 'Ryan Mitchell', avatar: 'RM', role: 'coach', status: 'pending', checkInType: 'geolocation', checkInTime: '08:45', geoCheckInTiming: 'on_time',
    geoLocation: { lat: 51.4816, lng: -0.0092, accuracy: 7, withinRadius: true }, staleMissedCheckout: true },
  // No check-in at all (pending)
  { userId: 'u-008', name: 'Priya Nair',    avatar: 'PN', role: 'coach', status: 'pending',    checkInType: 'geolocation' },
  // Arrived early (before event start), left early — flagged for review
  { userId: 'u-011', name: 'Tom Bradley',   avatar: 'TB', role: 'coach', status: 'left_early', checkInType: 'geolocation', checkInTime: '08:22', geoCheckInTiming: 'early',
    geoLocation: { lat: 51.4818, lng: -0.0089, accuracy: 10, withinRadius: true },
    checkOutTime: '10:45', checkOutType: 'geolocation', geoCheckOutTiming: 'early',
    geoCheckOutLocation: { lat: 51.4818, lng: -0.0089, accuracy: 8, withinRadius: true },
    appeal: { note: 'Family emergency required me to leave before the session ended. Can provide documentation if needed.', filedBy: 'Tom Bradley', filedAt: '2026-04-05T11:20:00Z', status: 'pending' } },

  // ── Medical (qr_code) — all 4 timing scenarios ──
  // On-time check-in, on-time checkout
  { userId: 'u-005', name: "Sarah O'Brien", avatar: 'SO', role: 'medical', status: 'present',    checkInType: 'qr_code', checkInTime: '08:50', checkInAdminName: 'Daniel Kim', qrCheckInTiming: 'on_time',
    checkOutTime: '11:32', checkOutType: 'qr_code', checkOutAdminName: 'James Carter', qrCheckOutTiming: 'on_time' },
  // Late check-in, on-time checkout — has pending appeal
  { userId: 'u-009', name: 'Marcus Webb',   avatar: 'MW', role: 'medical', status: 'late',       checkInType: 'qr_code', checkInTime: '09:18', checkInAdminName: 'James Carter', qrCheckInTiming: 'late',
    checkOutTime: '11:25', checkOutType: 'qr_code', checkOutAdminName: 'James Carter', qrCheckOutTiming: 'on_time',
    appeal: { note: 'Delayed by ambulance bay access issue at the venue — had to wait for clearance.', filedBy: 'Marcus Webb', filedAt: '2026-04-05T11:30:00Z', status: 'pending' } },
  // On-time check-in, early checkout — has pending appeal
  { userId: 'u-012', name: 'Aisha Patel',   avatar: 'AP', role: 'medical', status: 'left_early', checkInType: 'qr_code', checkInTime: '08:45', checkInAdminName: 'Daniel Kim', qrCheckInTiming: 'on_time',
    checkOutTime: '11:08', checkOutType: 'qr_code', checkOutAdminName: 'Daniel Kim', qrCheckOutTiming: 'early',
    appeal: { note: 'Had to leave early to attend an urgent patient consultation.', filedBy: 'Aisha Patel', filedAt: '2026-04-05T11:10:00Z', status: 'pending' } },
  // No check-in at all (pending)
  { userId: 'u-013', name: 'Owen Burke',    avatar: 'OB', role: 'medical', status: 'pending',    checkInType: 'qr_code' },
  // Checked in, no checkout — fresh (within 12h): shows inline time input
  { userId: 'u-016', name: 'Priya Sharma',  avatar: 'PS', role: 'medical', status: 'present',    checkInType: 'qr_code', checkInTime: '08:55', checkInAdminName: 'Daniel Kim', qrCheckInTiming: 'on_time',
    staleMissedCheckout: false },
  // Checked in, no checkout — stale (>12h): status reset to pending, requires modal resolution
  { userId: 'u-017', name: 'Ben Hargreaves', avatar: 'BH', role: 'medical', status: 'pending',   checkInType: 'qr_code', checkInTime: '09:02', checkInAdminName: 'James Carter', qrCheckInTiming: 'late',
    staleMissedCheckout: true },

  // ── Staff (qr_code) — all 4 timing scenarios ──
  // Late check-in, on-time checkout
  { userId: 'u-006', name: 'Daniel Kim',    avatar: 'DK', role: 'staff',   status: 'late',       checkInType: 'qr_code', checkInTime: '09:20', checkInAdminName: 'James Carter', qrCheckInTiming: 'late',
    checkOutTime: '11:35', checkOutType: 'qr_code', checkOutAdminName: 'James Carter', qrCheckOutTiming: 'on_time' },
  // On-time check-in, early checkout — has pending appeal
  { userId: 'u-010', name: 'Zoe Park',      avatar: 'ZP', role: 'staff',   status: 'left_early', checkInType: 'qr_code', checkInTime: '08:55', checkInAdminName: 'Daniel Kim', qrCheckInTiming: 'on_time',
    checkOutTime: '11:10', checkOutType: 'qr_code', checkOutAdminName: 'Daniel Kim', qrCheckOutTiming: 'early',
    appeal: { note: 'Left early to collect an injured player\'s equipment from another facility — pre-approved by head coach.', filedBy: 'Zoe Park', filedAt: '2026-04-05T11:12:00Z', status: 'pending' } },
  // On-time check-in, on-time checkout
  // On-time check-in, no checkout — fresh (within 12h): shows inline time input
  { userId: 'u-014', name: 'Leo Watts',     avatar: 'LW', role: 'staff',   status: 'present',    checkInType: 'qr_code', checkInTime: '08:48', checkInAdminName: 'James Carter', qrCheckInTiming: 'on_time',
    staleMissedCheckout: false },
  // No check-in at all (pending)
  { userId: 'u-015', name: 'Hana Kim',      avatar: 'HK', role: 'staff',   status: 'pending',    checkInType: 'qr_code' },
];

export const events: CalendarEvent[] = [
  // ─── TODAY ────────────────────────────────────────
  {
    id: 'ev-001',
    title: 'First Team Training',
    description: 'Tactical session focusing on pressing patterns and defensive transitions. 4-3-3 shape work.',
    start: { date: todayStr, time: '09:00', timezone: 'Europe/London' },
    end: { date: todayStr, time: '11:30', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-04'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-002',
    expectedRpe: 7,
    hasItinerary: true,
    hasChecklist: true,
    hasSession: true,
    hasHydration: true,
    hasFiles: true,
    hasAssignment: false, hasScores: false,
    geoSettings: { ...attendanceGeofenceConfig },
    qrSettings: { ...attendanceQrConfig },
    roleAttendanceTypes: Object.fromEntries(
      attendanceRules.filter(r => r.eventTypeId === 'set-01').map(r => [r.userType, r.preference])
    ) as Record<string, AttendancePreference>,
    roleRequireCheckOut: Object.fromEntries(
      attendanceRules.filter(r => r.eventTypeId === 'set-01').map(r => [r.userType, r.requireCheckOut])
    ),
    history: [
      { id: 'h-001-1', action: 'created', timestamp: '2026-03-28T09:00:00Z', userId: 'u-002', userName: 'James Carter', notified: false },
      { id: 'h-001-2', action: 'updated', timestamp: '2026-03-30T14:22:00Z', userId: 'u-002', userName: 'James Carter', notified: true, changes: [{ field: 'Start Time', from: '08:00', to: '09:00' }, { field: 'End Time', from: '10:30', to: '11:30' }] },
      { id: 'h-001-3', action: 'published', timestamp: '2026-03-31T08:00:00Z', userId: 'u-002', userName: 'James Carter', notified: true },
      {
        id: 'h-001-4', action: 'rated', timestamp: '2026-04-01T10:28:00Z', userId: 'u-002', userName: 'James Carter', notified: false,
        ratings: [
          { playerId: 'p-011', playerName: 'Gabriel Torres', playerAvatar: 'GT', jerseyNumber: 9, position: 'ST', mode: 'dimensional', overall: 5, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 5 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 4 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 4 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 5 }], comment: 'Clinical finishing. Great movement.' },
          { playerId: 'p-008', playerName: 'Noah Clarke', playerAvatar: 'NC', jerseyNumber: 10, position: 'AM', mode: 'dimensional', overall: 4, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 4 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 5 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 3 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 4 }], comment: 'Excellent vision and passing.' },
          { playerId: 'p-006', playerName: 'Jack Brennan', playerAvatar: 'JB', jerseyNumber: 8, position: 'CM', mode: 'dimensional', overall: 4, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 3 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 4 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 5 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 4 }], comment: 'Covered every blade of grass.' },
          { playerId: 'p-002', playerName: 'Marcus Williams', playerAvatar: 'MW', jerseyNumber: 4, position: 'CB', mode: 'dimensional', overall: 4, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 3 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 4 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 4 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 5 }], comment: 'Won every aerial duel.' },
          { playerId: 'p-003', playerName: 'Kai Tanaka', playerAvatar: 'KT', jerseyNumber: 5, position: 'CB', mode: 'dimensional', overall: 3, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 3 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 3 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 4 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 3 }], comment: 'Struggled first half. Improved after.' },
          { playerId: 'p-010', playerName: 'Lucas Dubois', playerAvatar: 'LD', jerseyNumber: 11, position: 'LW', mode: 'dimensional', overall: 3, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 4 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 3 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 3 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: null }] },
        ],
      },
      {
        id: 'h-001-5', action: 'rated', timestamp: '2026-04-01T11:14:00Z', userId: 'u-003', userName: 'Elena Vasquez', notified: false,
        ratings: [
          { playerId: 'p-007', playerName: 'Leo Fernandez', playerAvatar: 'LF', jerseyNumber: 6, position: 'DM', mode: 'dimensional', overall: 4, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 4 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 5 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 4 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 4 }], comment: 'Metronomic passing. Controlled tempo.' },
          { playerId: 'p-004', playerName: 'Omar Hassan', playerAvatar: 'OH', jerseyNumber: 3, position: 'LB', mode: 'dimensional', overall: 3, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 3 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 3 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 4 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 4 }], comment: 'Good overlapping runs.' },
          { playerId: 'p-005', playerName: 'Andre Silva', playerAvatar: 'AS', jerseyNumber: 2, position: 'RB', mode: 'dimensional', overall: 3, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 3 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 3 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 3 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 3 }], comment: 'Subbed off 78 min. Decent.' },
        ],
      },
      {
        id: 'h-001-6', action: 'rated', timestamp: '2026-04-01T13:55:00Z', userId: 'u-006', userName: 'Ryan Mitchell', notified: false,
        ratings: [
          { playerId: 'p-001', playerName: 'Liam Henderson', playerAvatar: 'LH', jerseyNumber: 1, position: 'GK', mode: 'dimensional', overall: 4, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 4 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: null }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 3 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 5 }], comment: 'Commanded the box. Big saves.' },
        ],
      },
      {
        id: 'h-001-7', action: 'self_rated', timestamp: '2026-04-02T09:03:00Z', userId: 'system', userName: 'Players (4)', notified: false,
        ratings: [
          { playerId: 'p-011', playerName: 'Gabriel Torres', playerAvatar: 'GT', jerseyNumber: 9, position: 'ST', mode: 'advanced', overall: 4, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 4 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 4 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 5 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 4 }], comment: 'Good game. Felt strong physically.' },
          { playerId: 'p-008', playerName: 'Noah Clarke', playerAvatar: 'NC', jerseyNumber: 10, position: 'AM', mode: 'advanced', overall: 5, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 5 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 5 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 3 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 5 }] },
          { playerId: 'p-002', playerName: 'Marcus Williams', playerAvatar: 'MW', jerseyNumber: 4, position: 'CB', mode: 'advanced', overall: 5, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 3 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 3 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 5 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 5 }], comment: 'Dominated aerially. Tactical positioning needs work.' },
          { playerId: 'p-010', playerName: 'Lucas Dubois', playerAvatar: 'LD', jerseyNumber: 11, position: 'LW', mode: 'advanced', overall: 3, dimensions: [{ key: 'technical', label: 'Technical', color: '#00A76F', value: 4 }, { key: 'tactical', label: 'Tactical', color: '#8E33FF', value: 3 }, { key: 'physical', label: 'Physical', color: '#FF5630', value: 3 }, { key: 'mental', label: 'Mental', color: '#00B8D9', value: 3 }] },
        ],
      },
    ],
    checklist: [
      { id: 'cl-1', text: 'Set up cones for pressing drill', completed: true, assignee: 'u-003' },
      { id: 'cl-2', text: 'Prepare GPS vests', completed: true, assignee: 'u-006' },
      { id: 'cl-3', text: 'Review video clips for tactical brief', completed: false, assignee: 'u-002' },
      { id: 'cl-4', text: 'Confirm medical staff availability', completed: true, assignee: 'u-005' },
      { id: 'cl-5', text: 'Inflate and set out match balls', completed: true },
    ],
    itinerary: [
      { id: 'it-1', time: '08:30', title: 'Arrival & Changing', location: 'Changing Rooms', description: '' },
      { id: 'it-2', time: '09:00', title: 'Warm-Up & Activation', location: 'Training Pitch A', description: 'Dynamic stretching, rondos' },
      { id: 'it-3', time: '09:30', title: 'Tactical Pressing Drills', location: 'Training Pitch A', description: '4-3-3 high press patterns, trigger movements' },
      { id: 'it-4', time: '10:15', title: 'Small-Sided Games', location: '', description: '8v8 with pressing conditions' },
      { id: 'it-5', time: '10:50', title: 'Set Pieces', location: '', description: '' },
      { id: 'it-6', time: '11:15', title: 'Cool Down & Recovery', location: 'Recovery Pool', description: 'Light stretching and ice baths' },
    ],
    attendance: defaultAttendance,
    session: { id: 'sess-1', duration: 150, rpe: 7, tags: ['Tactical', 'Pressing', 'Set Pieces'], notes: 'Good intensity. Brooks absent - hamstring rehab continues.' },
    hydration: [
      { userId: 'p-001', name: 'Liam Henderson', avatar: 'LH', preWeight: 84.2, postWeight: 82.8 },
      { userId: 'p-006', name: 'Jack Brennan', avatar: 'JB', preWeight: 78.5, postWeight: 77.1 },
      { userId: 'p-011', name: 'Gabriel Torres', avatar: 'GT', preWeight: 81.0, postWeight: 79.5 },
      { userId: 'p-008', name: 'Noah Clarke', avatar: 'NC', preWeight: 73.2, postWeight: 71.9 },
    ],
    files: [
      { id: 'file-1', name: 'Pressing_Triggers_Analysis.pdf', type: 'pdf', size: '2.4 MB', uploadedBy: 'Daniel Kim', uploadedAt: d(-1) },
      { id: 'file-2', name: 'SetPiece_Routines_v3.pdf', type: 'pdf', size: '1.1 MB', uploadedBy: 'James Carter', uploadedAt: d(-2) },
      { id: 'file-3', name: 'GPS_Template_April.xlsx', type: 'xlsx', size: '340 KB', uploadedBy: 'Daniel Kim', uploadedAt: d(-1) },
    ],
    reports: [
      {
        id: 'rep-001',
        title: 'Riverside FC — Opponent Analysis',
        typeId: 'rt-01',
        status: 'published' as ReportStatus,
        visibility: ['coaches_only'] as ReportVisibility[],
        author: { id: 'u-002', name: 'James Carter', avatar: 'JC' },
        createdAt: '2026-04-04T09:00:00Z',
        updatedAt: '2026-04-05T14:30:00Z',
        fieldValues: { 'rf-01-1': 'Riverside FC', 'rf-01-2': '2026-04-08', 'rf-01-3': '4-2-3-1' },
        sections: [
          {
            id: 'rs-001-1',
            title: 'Formation',
            content: 'Riverside FC lines up in a 4-2-3-1 with a high defensive line. The two holding midfielders screen the back four aggressively, limiting space between the lines. Their full-backs push very high in possession, creating overloads on the flanks.\n\nKey structural weakness: the space vacated behind the right-back (#2 — Delgado) when they transition into attack is significant and should be targeted with quick vertical passes into our left channel.',
          },
          {
            id: 'rs-001-2',
            title: 'Key Players',
            content: '#10 — Marcus Reid (AM): Their primary creative outlet. Drops deep to collect and drives at pace. Must be pressed high and denied time on the ball. Leo Fernandez should track him aggressively.\n\n#9 — Tyler Grant (ST): Physical target man. Wins headers, holds up play effectively. Our centre-backs must communicate early and avoid individual defending against him.',
          },
          {
            id: 'rs-001-3',
            title: 'Strengths & Weaknesses',
            content: 'STRENGTHS\n• Set-piece delivery (corners, free-kicks around the box)\n• High press triggers very well-drilled\n• Transition speed from defence to attack\n\nWEAKNESSES\n• Susceptible to quick combinations through the half-space\n• Right CB struggles to deal with runners in behind\n• Poor discipline under sustained pressure — 3 red cards in last 8 games',
          },
          {
            id: 'rs-001-4',
            title: 'Game Plan',
            content: 'OUT OF POSSESSION\nMid-block 4-3-3, press trigger is their goalkeeper playing short. Win the ball centrally and transition immediately.\n\nIN POSSESSION\nBuild through the thirds patiently. Use width through our full-backs to stretch their 4-2-3-1. Look to isolate #10 Reid on the turn and play early combinations between Noah Clarke and Gabriel Torres in the final third.',
          },
          {
            id: 'rs-001-5',
            title: 'Conclusion',
            content: 'Riverside FC are a well-organised side but carry clear vulnerabilities in the half-spaces and behind their right-back. If we execute our pressing triggers cleanly and transition at pace, we have significant opportunities to create and score.\n\nKey message to the group: stay disciplined, maintain shape, and be ruthless when chances arrive.',
          },
        ],
      },
      {
        id: 'rep-002',
        title: 'Post-Session Analysis — First Team Training',
        typeId: 'rt-02',
        status: 'draft' as ReportStatus,
        visibility: ['all_staff', 'coaches_only'] as ReportVisibility[],
        author: { id: 'u-003', name: 'Elena Vasquez', avatar: 'EV' },
        createdAt: '2026-04-06T12:00:00Z',
        updatedAt: '2026-04-06T12:00:00Z',
        fieldValues: { 'rf-02-1': '2-1', 'rf-02-2': 'Win', 'rf-02-3': '' },
        sections: [
          {
            id: 'rs-002-1',
            title: 'Match Overview',
            content: 'The session served as a final rehearsal ahead of the Riverside FC fixture. Overall intensity was high — RPE tracked at 7/10 across the squad. Some notable fatigue in the final 20 minutes among the central midfielders.\n\n[DRAFT — to be completed after full video review]',
          },
          {
            id: 'rs-002-2',
            title: 'Attacking Phase',
            content: 'Combination play through the right channel looked particularly sharp. Torres and Clarke linked well on three occasions in the final-third SSG scenarios.\n\nAreas to address: timing of runs in behind remains inconsistent — several offside traps were sprung in the 4v4 finishing drills.',
          },
          {
            id: 'rs-002-3',
            title: 'Defending Phase',
            content: 'Pressing triggers were executed well in the first half of the session. The 4-3-3 block held its shape effectively.\n\n[DRAFT — detail pending after video analysis of 2nd pressing drill block]',
          },
          {
            id: 'rs-002-4',
            title: 'Set Play Analysis',
            content: 'Worked two new corner routines — near-post flick on and a blocking movement for the back-post runner. Both will be carried into the match-day tactical briefing.\n\n[DRAFT — success rates TBC once tracking data is exported from GPS vests]',
          },
        ],
      },
    ],
    segmentId: 'seg-001',
  },
  {
    id: 'ev-002',
    title: 'Recovery Session',
    description: 'Light recovery for players who featured in the weekend match. Pool session and yoga.',
    start: { date: todayStr, time: '14:00', timezone: 'Europe/London' },
    end: { date: todayStr, time: '15:30', timezone: 'Europe/London' },
    eventType: eventTypes[3],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-08'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-005',
    expectedRpe: 3,
    hasItinerary: false,
    hasChecklist: false,
    hasSession: true,
    hasHydration: false,
    hasFiles: false,
    hasAssignment: false, hasScores: false,
    session: { id: 'sess-2', duration: 90, rpe: 3, tags: ['Recovery', 'Pool', 'Yoga'], notes: 'Standard post-match recovery protocol.' },
  },
  {
    id: 'ev-003',
    title: 'U-21 Training',
    description: 'Technical session focused on ball retention and build-up play from the back.',
    start: { date: todayStr, time: '10:00', timezone: 'Europe/London' },
    end: { date: todayStr, time: '12:00', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['u21'],
    teamNames: ['Under-21'],
    locationtype: 'home',
    location: 'Academy Complex',
    facilityCenterId: 'fc-academy',
    facilityIds: ['f-10'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-003',
    expectedRpe: 6,
    hasItinerary: false,
    hasChecklist: true,
    hasSession: true,
    hasHydration: false,
    hasFiles: false,
    hasAssignment: false, hasScores: false,
    history: [
      { id: 'h-003-1', action: 'created', timestamp: '2026-03-25T11:00:00Z', userId: 'u-003', userName: 'Elena Vasquez', notified: false },
      { id: 'h-003-2', action: 'submitted_for_review', timestamp: '2026-03-26T09:15:00Z', userId: 'u-003', userName: 'Elena Vasquez', notified: true },
      { id: 'h-003-3', action: 'updated', timestamp: '2026-03-27T16:40:00Z', userId: 'u-002', userName: 'James Carter', notified: false, changes: [{ field: 'Description', from: 'Ball retention drills', to: 'Technical session focused on ball retention and build-up play from the back.' }] },
      { id: 'h-003-4', action: 'updated', timestamp: '2026-03-29T10:05:00Z', userId: 'u-003', userName: 'Elena Vasquez', notified: true, changes: [{ field: 'Location', from: 'Training Pitch B', to: 'Academy Complex' }, { field: 'Expected RPE', from: '5', to: '6' }] },
      { id: 'h-003-5', action: 'published', timestamp: '2026-03-30T08:30:00Z', userId: 'u-002', userName: 'James Carter', notified: true },
    ],
    checklist: [
      { id: 'cl-6', text: 'Set up passing gates', completed: true },
      { id: 'cl-7', text: 'Prepare bibs (3 colours)', completed: true },
      { id: 'cl-8', text: 'Video camera setup', completed: false },
    ],
    session: { id: 'sess-3', duration: 120, rpe: 6, tags: ['Technical', 'Passing', 'Build-Up'], notes: 'Strong session. Park and Murphy stood out.' },
    segmentId: 'seg-004',
    batchIds: ['bat-01', 'bat-02'],
  },
  // ─── TOMORROW ─────────────────────────────────────
  {
    id: 'ev-004',
    title: 'Pre-Match Team Meeting',
    description: 'Tactical briefing and video review ahead of Saturday league fixture vs. Riverside FC.',
    start: { date: d(1), time: '10:00', timezone: 'Europe/London' },
    end: { date: d(1), time: '11:30', timezone: 'Europe/London' },
    eventType: eventTypes[4],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-09'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-002',
    hasItinerary: true,
    hasChecklist: true,
    hasSession: false,
    hasHydration: false,
    hasFiles: true,
    hasAssignment: false, hasScores: false,
    itinerary: [
      { id: 'it-7', time: '10:00', title: 'Opposition Analysis', location: 'Tactical Room', description: 'Video breakdown of Riverside FC\'s last 3 matches' },
      { id: 'it-8', time: '10:30', title: 'Set Piece Strategy', location: '', description: 'Attacking and defending set pieces' },
      { id: 'it-9', time: '11:00', title: 'Team Shape & Roles', location: '', description: '' },
    ],
    checklist: [
      { id: 'cl-9', text: 'Prepare opposition video clips', completed: true, assignee: 'u-006' },
      { id: 'cl-10', text: 'Print tactical boards', completed: false, assignee: 'u-003' },
    ],
    files: [
      { id: 'file-4', name: 'Riverside_FC_Scouting_Report.pdf', type: 'pdf', size: '5.2 MB', uploadedBy: 'Daniel Kim', uploadedAt: todayStr },
    ],
  },
  {
    id: 'ev-005',
    title: 'First Team Light Training',
    description: 'Matchday minus one. Light tactical walk-through and set piece rehearsal.',
    start: { date: d(1), time: '14:00', timezone: 'Europe/London' },
    end: { date: d(1), time: '15:30', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-04'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-002',
    expectedRpe: 4,
    hasItinerary: false,
    hasChecklist: false,
    hasSession: true,
    hasHydration: false,
    hasFiles: false,
    hasAssignment: false, hasScores: false,
    session: { id: 'sess-4', duration: 90, rpe: 4, tags: ['Light', 'Walk-Through', 'Set Pieces'], notes: '' },
  },
  // ─── MATCH DAY (DAY +2) ──────────────────────────
  {
    id: 'ev-006',
    title: 'League Match vs Riverside FC',
    description: 'Premier League matchday 28. Home fixture at Courtside Stadium. Kick-off 15:00.',
    start: { date: d(2), time: '15:00', timezone: 'Europe/London' },
    end: { date: d(2), time: '17:00', timezone: 'Europe/London' },
    eventType: eventTypes[1],
    privacy: 'public',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Stadium',
    facilityCenterId: 'fc-main',
    facilityIds: ['f-01'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-002',
    expectedRpe: 9,
    hasItinerary: true,
    hasChecklist: true,
    hasSession: true,
    hasHydration: true,
    hasFiles: true,
    hasAssignment: true,
    hasScores: true,
    scores: {
      sport: 'football',
      match_status: 'scheduled',
      home_participant: 'FC Courtside',
      away_participant: 'Riverside FC',
    },
    itinerary: [
      { id: 'it-10', time: '12:00', title: 'Team Arrival', location: 'Courtside Stadium', description: '' },
      { id: 'it-11', time: '12:30', title: 'Pre-Match Meal', location: 'Players Lounge', description: 'Pasta, chicken, vegetables' },
      { id: 'it-12', time: '13:30', title: 'Final Team Talk', location: 'Changing Room', description: 'Tactical reminders and motivation' },
      { id: 'it-13', time: '14:00', title: 'Warm-Up', location: '', description: '' },
      { id: 'it-14', time: '15:00', title: 'Kick-Off', location: 'Main Pitch', description: '' },
      { id: 'it-15', time: '17:00', title: 'Post-Match', location: '', description: 'Cool down, media duties' },
    ],
    checklist: [
      { id: 'cl-11', text: 'Kit prepared and laid out', completed: true },
      { id: 'cl-12', text: 'Medical bag stocked', completed: true, assignee: 'u-005' },
      { id: 'cl-13', text: 'GPS vests charged', completed: true, assignee: 'u-006' },
      { id: 'cl-14', text: 'Tactical boards in changing room', completed: true },
      { id: 'cl-15', text: 'Water bottles labelled', completed: false },
      { id: 'cl-16', text: 'Post-match media briefing scheduled', completed: true },
    ],
    attendance: defaultAttendance,
    session: { id: 'sess-5', duration: 120, rpe: 9, tags: ['Match', 'Competition', 'League'], notes: '' },
    hydration: [
      { userId: 'p-001', name: 'Liam Henderson', avatar: 'LH', preWeight: 84.2, postWeight: 81.5 },
      { userId: 'p-006', name: 'Jack Brennan', avatar: 'JB', preWeight: 78.5, postWeight: 76.0 },
      { userId: 'p-011', name: 'Gabriel Torres', avatar: 'GT', preWeight: 81.0, postWeight: 78.2 },
    ],
    assignments: [
      { userId: 'u-002', name: 'James Carter', avatar: 'JC', role: 'Head Coach', confirmed: true },
      { userId: 'u-003', name: 'Elena Vasquez', avatar: 'EV', role: 'Assistant Coach', confirmed: true },
      { userId: 'u-004', name: 'Ryan Mitchell', avatar: 'RM', role: 'GK Coach', confirmed: true },
      { userId: 'u-005', name: 'Sarah O\'Brien', avatar: 'SO', role: 'Physio', confirmed: true },
      { userId: 'u-006', name: 'Daniel Kim', avatar: 'DK', role: 'Analyst', confirmed: true },
    ],
    files: [
      { id: 'file-5', name: 'Matchday_Teamsheet.pdf', type: 'pdf', size: '180 KB', uploadedBy: 'James Carter', uploadedAt: d(1) },
      { id: 'file-6', name: 'Riverside_SetPiece_Analysis.mp4', type: 'video', size: '42 MB', uploadedBy: 'Daniel Kim', uploadedAt: todayStr },
    ],
  },
  // ─── UPCOMING WEEK ────────────────────────────────
  {
    id: 'ev-007',
    title: 'Post-Match Recovery',
    description: 'Mandatory recovery session following matchday. Pool recovery and foam rolling.',
    start: { date: d(3), time: '10:00', timezone: 'Europe/London' },
    end: { date: d(3), time: '11:30', timezone: 'Europe/London' },
    eventType: eventTypes[3],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-08', 'f-07'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-005',
    expectedRpe: 2,
    hasItinerary: false, hasChecklist: false, hasSession: true, hasHydration: false, hasFiles: false, hasAssignment: false, hasScores: false,
    session: { id: 'sess-6', duration: 90, rpe: 2, tags: ['Recovery', 'Pool', 'Foam Roll'], notes: '' },
  },
  {
    id: 'ev-008',
    title: 'Medical Assessment - Brooks',
    description: 'Ethan Brooks hamstring review with physio team. Scan results discussion.',
    start: { date: d(3), time: '14:00', timezone: 'Europe/London' },
    end: { date: d(3), time: '15:00', timezone: 'Europe/London' },
    eventType: eventTypes[5],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-07'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-005',
    hasItinerary: false, hasChecklist: false, hasSession: false, hasHydration: false, hasFiles: true, hasAssignment: false, hasScores: false,
    files: [
      { id: 'file-7', name: 'Brooks_MRI_Report.pdf', type: 'pdf', size: '3.8 MB', uploadedBy: 'Sarah O\'Brien', uploadedAt: d(2) },
    ],
  },
  {
    id: 'ev-009',
    title: 'First Team Training',
    description: 'Full session. Attacking combinations and finishing drills.',
    start: { date: d(4), time: '09:30', timezone: 'Europe/London' },
    end: { date: d(4), time: '11:30', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-04', 'f-05'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-002',
    expectedRpe: 7,
    hasItinerary: false, hasChecklist: true, hasSession: true, hasHydration: false, hasFiles: false, hasAssignment: false, hasScores: false,
    checklist: [
      { id: 'cl-17', text: 'Set up finishing drill stations', completed: false },
      { id: 'cl-18', text: 'Bibs and mannequins ready', completed: false },
    ],
    session: { id: 'sess-7', duration: 120, rpe: 7, tags: ['Attacking', 'Finishing', 'Combinations'], notes: '' },
  },
  {
    id: 'ev-010',
    title: 'Press Conference',
    description: 'Weekly press conference ahead of the upcoming cup fixture.',
    start: { date: d(4), time: '13:00', timezone: 'Europe/London' },
    end: { date: d(4), time: '14:00', timezone: 'Europe/London' },
    eventType: eventTypes[6],
    privacy: 'public',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Stadium',
    facilityCenterId: 'fc-main',
    facilityIds: ['f-02'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-001',
    hasItinerary: false, hasChecklist: false, hasSession: false, hasHydration: false, hasFiles: false, hasAssignment: false, hasScores: false,
  },
  {
    id: 'ev-011',
    title: 'U-17 Friendly vs Hillcrest Academy',
    description: 'Pre-season friendly match for the U-17 squad at away ground.',
    start: { date: d(5), time: '14:00', timezone: 'Europe/London' },
    end: { date: d(5), time: '16:00', timezone: 'Europe/London' },
    eventType: eventTypes[2],
    privacy: 'public',
    teamIds: ['u17'],
    teamNames: ['Under-17'],
    locationtype: 'away',
    location: 'Hillcrest Academy Sports Centre, Leeds',
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-003',
    expectedRpe: 8,
    hasItinerary: true, hasChecklist: true, hasSession: false, hasHydration: false, hasFiles: false, hasAssignment: true, hasScores: true,
    scores: {
      sport: 'football',
      match_status: 'scheduled',
      home_participant: 'Hillcrest Academy',
      away_participant: 'FC Courtside U-17',
    },
    itinerary: [
      { id: 'it-16', time: '11:00', title: 'Depart Academy', location: 'Academy Complex', description: 'Coach departs for Leeds' },
      { id: 'it-17', time: '13:00', title: 'Arrive & Walk Pitch', location: 'Hillcrest Academy', description: '' },
      { id: 'it-18', time: '13:30', title: 'Warm-Up', location: 'Hillcrest Academy', description: '' },
      { id: 'it-19', time: '14:00', title: 'Kick-Off', location: 'Hillcrest Academy', description: '' },
    ],
    checklist: [
      { id: 'cl-19', text: 'Confirm travel arrangements', completed: true },
      { id: 'cl-20', text: 'Pack away kit', completed: true },
      { id: 'cl-21', text: 'First aid kit', completed: true },
    ],
    assignments: [
      { userId: 'u-003', name: 'Elena Vasquez', avatar: 'EV', role: 'Lead Coach', confirmed: true },
      { userId: 'u-005', name: 'Sarah O\'Brien', avatar: 'SO', role: 'Physio', confirmed: false },
    ],
  },
  // ─── PAST EVENTS ──────────────────────────────────
  {
    id: 'ev-012',
    title: 'First Team Training',
    description: 'Shape and possession work. 4-3-3 positional play.',
    start: { date: d(-1), time: '09:00', timezone: 'Europe/London' },
    end: { date: d(-1), time: '11:00', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-04'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-002',
    expectedRpe: 6,
    hasItinerary: false, hasChecklist: false, hasSession: true, hasHydration: false, hasFiles: false, hasAssignment: false, hasScores: false,
    session: { id: 'sess-8', duration: 120, rpe: 6, tags: ['Possession', 'Positional Play'], notes: '' },
  },
  {
    id: 'ev-013',
    title: 'First Team Training',
    description: 'Defensive structure and transition work.',
    start: { date: d(-2), time: '09:30', timezone: 'Europe/London' },
    end: { date: d(-2), time: '11:30', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-05'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-002',
    expectedRpe: 7,
    hasItinerary: false, hasChecklist: false, hasSession: true, hasHydration: false, hasFiles: false, hasAssignment: false, hasScores: false,
    session: { id: 'sess-9', duration: 120, rpe: 7, tags: ['Defensive', 'Transitions'], notes: '' },
  },
  {
    id: 'ev-014',
    title: 'League Match vs Northgate United',
    description: 'Away league fixture. Matchday 27.',
    start: { date: d(-4), time: '17:30', timezone: 'Europe/London' },
    end: { date: d(-4), time: '19:30', timezone: 'Europe/London' },
    eventType: eventTypes[1],
    privacy: 'public',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'away',
    location: 'Northgate Park, Manchester',
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-002',
    expectedRpe: 9,
    hasItinerary: true, hasChecklist: true, hasSession: true, hasHydration: true, hasFiles: true, hasAssignment: true, hasScores: true,
    scores: {
      sport: 'football',
      match_status: 'final',
      home_participant: 'Northgate United',
      away_participant: 'FC Courtside',
      score_input: {
        home_goals: 1,
        away_goals: 2,
        decider: 'normal_time',
      } as FootballScoreInput,
      winner: 'away',
      outcome: 'win',
      score_display: '1-2',
      summary: 'Won 2-1 away at Northgate United',
      scorers: [
        { name: 'Gabriel Torres', minute: 23, type: 'goal', team: 'away' },
        { name: 'J. Whitmore', minute: 55, type: 'goal', team: 'home' },
        { name: 'Noah Clarke', minute: 67, type: 'goal', team: 'away' },
        { name: 'Omar Hassan', minute: 34, type: 'yellow_card' as any, team: 'away' },
        { name: 'R. Dawson', minute: 41, type: 'yellow_card' as any, team: 'home' },
        { name: 'Ethan Brooks', minute: 72, type: 'substitution' as any, team: 'away' },
        { name: 'R. Dawson', minute: 78, type: 'red_card' as any, team: 'home' },
      ],
    },
    itinerary: [
      { id: 'it-20', time: '13:00', title: 'Depart', location: 'Courtside Stadium', description: 'Coach departs for Manchester' },
      { id: 'it-21', time: '15:30', title: 'Arrive Northgate Park', location: 'Northgate Park', description: '' },
      { id: 'it-22', time: '17:30', title: 'Kick-Off', location: 'Northgate Park', description: '' },
    ],
    checklist: [
      { id: 'cl-22', text: 'Away kit packed', completed: true },
      { id: 'cl-23', text: 'Travel meals organized', completed: true },
    ],
    attendance: defaultAttendance,
    session: { id: 'sess-10', duration: 120, rpe: 9, tags: ['Match', 'Away', 'League'], notes: 'Result: 2-1 Win. Torres and Clarke goals.' },
    hydration: [
      { userId: 'p-006', name: 'Jack Brennan', avatar: 'JB', preWeight: 78.5, postWeight: 75.8 },
      { userId: 'p-011', name: 'Gabriel Torres', avatar: 'GT', preWeight: 81.0, postWeight: 78.0 },
    ],
    assignments: [
      { userId: 'u-002', name: 'James Carter', avatar: 'JC', role: 'Head Coach', confirmed: true },
      { userId: 'u-003', name: 'Elena Vasquez', avatar: 'EV', role: 'Assistant Coach', confirmed: true },
      { userId: 'u-005', name: 'Sarah O\'Brien', avatar: 'SO', role: 'Physio', confirmed: true },
      { userId: 'u-006', name: 'Daniel Kim', avatar: 'DK', role: 'Analyst', confirmed: true },
    ],
    files: [
      { id: 'file-8', name: 'Northgate_PostMatch_Report.pdf', type: 'pdf', size: '1.5 MB', uploadedBy: 'Daniel Kim', uploadedAt: d(-3) },
    ],
  },
  // ─── MORE UPCOMING ────────────────────────────────
  {
    id: 'ev-015',
    title: 'Women\'s First Team Training',
    description: 'Full training session with focus on set pieces.',
    start: { date: d(1), time: '09:00', timezone: 'Europe/London' },
    end: { date: d(1), time: '11:00', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['women-first'],
    teamNames: ['Women\'s First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-05'],
    allDay: false,
    published: true, status: 'published' as const,
    ownerId: 'u-003',
    expectedRpe: 7,
    hasItinerary: false, hasChecklist: false, hasSession: true, hasHydration: false, hasFiles: false, hasAssignment: false, hasScores: false,
    session: { id: 'sess-11', duration: 120, rpe: 7, tags: ['Set Pieces', 'Full Training'], notes: '' },
  },
  {
    id: 'ev-016',
    title: 'U-21 Training',
    description: 'High-intensity session with fitness testing.',
    start: { date: d(2), time: '09:00', timezone: 'Europe/London' },
    end: { date: d(2), time: '11:30', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['u21'],
    teamNames: ['Under-21'],
    locationtype: 'home',
    location: 'Academy Complex',
    facilityCenterId: 'fc-academy',
    facilityIds: ['f-10'],
    allDay: false,
    published: false, status: 'in_review' as const,
    ownerId: 'u-003',
    expectedRpe: 8,
    hasItinerary: false, hasChecklist: false, hasSession: false, hasHydration: false, hasFiles: false, hasAssignment: false, hasScores: false,
  },
  {
    id: 'ev-017',
    title: 'First Team Training',
    description: 'Full training ahead of cup quarter-final.',
    start: { date: d(6), time: '09:30', timezone: 'Europe/London' },
    end: { date: d(6), time: '11:30', timezone: 'Europe/London' },
    eventType: eventTypes[0],
    privacy: 'private',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'home',
    location: 'Courtside Training Ground',
    facilityCenterId: 'fc-training',
    facilityIds: ['f-04'],
    allDay: false,
    published: false, status: 'draft' as const,
    ownerId: 'u-002',
    expectedRpe: 7,
    hasItinerary: false, hasChecklist: false, hasSession: false, hasHydration: false, hasFiles: false, hasAssignment: false, hasScores: false,
  },
  {
    id: 'ev-018',
    title: 'Cup Quarter-Final vs City Rangers',
    description: 'FA Cup quarter-final. Away fixture.',
    start: { date: d(8), time: '19:45', timezone: 'Europe/London' },
    end: { date: d(8), time: '21:45', timezone: 'Europe/London' },
    eventType: eventTypes[1],
    privacy: 'public',
    teamIds: ['first-team'],
    teamNames: ['First Team'],
    locationtype: 'away',
    location: 'Rangers Arena, Liverpool',
    allDay: false,
    published: false, status: 'draft' as const,
    ownerId: 'u-002',
    expectedRpe: 9,
    hasItinerary: true, hasChecklist: true, hasSession: false, hasHydration: false, hasFiles: false, hasAssignment: true, hasScores: true,
    scores: {
      sport: 'football',
      match_status: 'scheduled',
      home_participant: 'City Rangers',
      away_participant: 'FC Courtside',
    },
    itinerary: [
      { id: 'it-23', time: '14:00', title: 'Depart London', location: 'Courtside Stadium', description: 'Coach to Liverpool' },
      { id: 'it-24', time: '17:30', title: 'Hotel Check-In', location: 'The Grand Liverpool', description: 'Pre-match rest' },
      { id: 'it-25', time: '18:30', title: 'Depart for Stadium', location: 'Hotel', description: '' },
      { id: 'it-26', time: '19:45', title: 'Kick-Off', location: 'Rangers Arena', description: '' },
    ],
    checklist: [
      { id: 'cl-24', text: 'Away kit + alternative packed', completed: false },
      { id: 'cl-25', text: 'Hotel booking confirmed', completed: true },
      { id: 'cl-26', text: 'Travel meals organized', completed: false },
      { id: 'cl-27', text: 'Media accreditation sorted', completed: false },
    ],
    assignments: [
      { userId: 'u-002', name: 'James Carter', avatar: 'JC', role: 'Head Coach', confirmed: true },
      { userId: 'u-003', name: 'Elena Vasquez', avatar: 'EV', role: 'Assistant Coach', confirmed: false },
      { userId: 'u-005', name: 'Sarah O\'Brien', avatar: 'SO', role: 'Physio', confirmed: false },
    ],
  },
];

export function getEventsForCalendar() {
  return events.map(ev => {
    // For allDay multi-day events FullCalendar needs exclusive end date (end+1 day)
    const fcEnd = ev.allDay && ev.end.date !== ev.start.date
      ? format(addDays(new Date(ev.end.date), 1), 'yyyy-MM-dd')
      : ev.allDay
        ? ev.end.date
        : `${ev.end.date}T${ev.end.time}:00`;
    return ({
    id: ev.id,
    title: ev.title,
    start: ev.allDay ? ev.start.date : `${ev.start.date}T${ev.start.time}:00`,
    end: fcEnd,
    allDay: ev.allDay,
    backgroundColor: ev.eventType.color,
    borderColor: ev.eventType.color,
    textColor: '#fff',
    extendedProps: {
      eventType: ev.eventType,
      teamNames: ev.teamNames,
      locationtype: ev.locationtype,
      location: ev.location,
      published: ev.published,
      hasItinerary: ev.hasItinerary,
      hasChecklist: ev.hasChecklist,
      hasSession: ev.hasSession,
      hasHydration: ev.hasHydration,
      hasFiles: ev.hasFiles,
      hasAssignment: ev.hasAssignment,
      hasScores: ev.hasScores,
    },
  });});
}
