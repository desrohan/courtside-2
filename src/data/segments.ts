import { format, addDays, subDays } from 'date-fns';

export type SegmentStatus = 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
export type SegmentType = 'segment' | 'batch';

export interface SegmentRegistrant {
  id: string;
  name: string;
  avatar: string;
  email: string;
  registeredAt: string;
  status: 'confirmed' | 'pending' | 'waitlisted' | 'cancelled';
  batchId?: string;       // which batch they joined (batch type only)
  sessionsChosen?: number; // how many sessions (batch type only)
}

// ── Segment-type: event schedule ──────────────────────
export interface SegmentEvent {
  id: string;
  title: string;
  eventType: string; // Training, Fitness, Meeting, etc.
  eventColor: string;
  day: string;       // Mon, Tue, etc. or specific date
  time: string;
  duration: string;
}

// ── Batch-type: batches with schedules ────────────────
export interface Batch {
  id: string;
  name: string;
  eventType: string;
  eventColor: string;
  days: string[];       // e.g. ['Mon', 'Wed', 'Fri']
  time: string;
  duration: string;
  totalSessions: number;
  capacity: number | null;
  enrolledCount: number;
  fee?: string;
}

export interface Segment {
  id: string;
  teamId: string;
  name: string;
  description: string;
  type: SegmentType;
  startDate: string;
  endDate: string;
  status: SegmentStatus;
  capacity: number | null;
  registeredCount: number;
  registrants: SegmentRegistrant[];
  signupLink: string;
  signupEnabled: boolean;
  ageGroup?: string;
  fee?: string;
  schedule?: string;
  location?: string;
  createdBy: string;
  createdAt: string;
  // segment-type fields
  events?: SegmentEvent[];
  // batch-type fields
  batches?: Batch[];
}

const now = new Date();

export const segments: Segment[] = [
  // ── SEGMENT TYPE: First Team Season ─────────────────
  {
    id: 'seg-001', teamId: 'first-team', type: 'segment',
    name: '2025/26 Premier League Season',
    description: 'Full competitive season programme. Includes multiple event types: training sessions, tactical meetings, recovery, and match days.',
    startDate: format(subDays(now, 120), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 60), 'yyyy-MM-dd'),
    status: 'active',
    capacity: 30, registeredCount: 25,
    signupLink: 'https://courtside.app/register/fc-courtside/premier-league-2526',
    signupEnabled: false,
    schedule: 'Mon-Fri Training, Sat/Sun Matchday',
    location: 'Courtside Stadium & Training Ground',
    createdBy: 'Marcus Reid', createdAt: format(subDays(now, 150), 'yyyy-MM-dd'),
    events: [
      { id: 'se-01', title: 'Tactical Training', eventType: 'Training', eventColor: '#00A76F', day: 'Mon', time: '09:00', duration: '2h 30m' },
      { id: 'se-02', title: 'Gym & Strength', eventType: 'Fitness', eventColor: '#FF6C40', day: 'Mon', time: '14:00', duration: '1h 30m' },
      { id: 'se-03', title: 'Technical Training', eventType: 'Training', eventColor: '#00A76F', day: 'Tue', time: '09:00', duration: '2h' },
      { id: 'se-04', title: 'Video Analysis', eventType: 'Meeting', eventColor: '#8E33FF', day: 'Tue', time: '14:00', duration: '1h' },
      { id: 'se-05', title: 'Full Training', eventType: 'Training', eventColor: '#00A76F', day: 'Wed', time: '09:30', duration: '2h' },
      { id: 'se-06', title: 'Recovery Session', eventType: 'Recovery', eventColor: '#00B8D9', day: 'Thu', time: '10:00', duration: '1h 30m' },
      { id: 'se-07', title: 'Light Walk-Through', eventType: 'Training', eventColor: '#00A76F', day: 'Fri', time: '10:00', duration: '1h' },
      { id: 'se-08', title: 'Match Day', eventType: 'Match', eventColor: '#FF5630', day: 'Sat', time: '15:00', duration: '2h' },
    ],
    registrants: [
      { id: 'r-01', name: 'Gabriel Torres', avatar: 'GT', email: 'g.torres@fccourtside.com', registeredAt: format(subDays(now, 140), 'yyyy-MM-dd'), status: 'confirmed' },
      { id: 'r-02', name: 'Noah Clarke', avatar: 'NC', email: 'n.clarke@fccourtside.com', registeredAt: format(subDays(now, 140), 'yyyy-MM-dd'), status: 'confirmed' },
      { id: 'r-03', name: 'Jack Brennan', avatar: 'JB', email: 'j.brennan@fccourtside.com', registeredAt: format(subDays(now, 139), 'yyyy-MM-dd'), status: 'confirmed' },
      { id: 'r-04', name: 'Leo Fernandez', avatar: 'LF', email: 'l.fernandez@fccourtside.com', registeredAt: format(subDays(now, 138), 'yyyy-MM-dd'), status: 'confirmed' },
      { id: 'r-05', name: 'Liam Henderson', avatar: 'LH', email: 'l.henderson@fccourtside.com', registeredAt: format(subDays(now, 140), 'yyyy-MM-dd'), status: 'confirmed' },
    ],
  },

  // ── SEGMENT TYPE: Pre-Season Tour ───────────────────
  {
    id: 'seg-002', teamId: 'first-team', type: 'segment',
    name: 'Pre-Season Tour - USA 2026',
    description: 'Summer pre-season tour. Training camps, friendlies, and team bonding across multiple event types.',
    startDate: format(addDays(now, 75), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 95), 'yyyy-MM-dd'),
    status: 'upcoming',
    capacity: 28, registeredCount: 22,
    signupLink: 'https://courtside.app/register/fc-courtside/usa-tour-2026',
    signupEnabled: false,
    schedule: 'Daily training, Match every 5 days',
    location: 'New York & Los Angeles, USA',
    createdBy: 'James Carter', createdAt: format(subDays(now, 30), 'yyyy-MM-dd'),
    events: [
      { id: 'se-09', title: 'Double Training', eventType: 'Training', eventColor: '#00A76F', day: 'Mon-Sat', time: '09:00 & 16:00', duration: '2h each' },
      { id: 'se-10', title: 'Friendly Match', eventType: 'Friendly', eventColor: '#FFAB00', day: 'Wed & Sat', time: '19:00', duration: '2h' },
      { id: 'se-11', title: 'Team Meeting', eventType: 'Meeting', eventColor: '#8E33FF', day: 'Mon', time: '20:00', duration: '1h' },
      { id: 'se-12', title: 'Pool Recovery', eventType: 'Recovery', eventColor: '#00B8D9', day: 'Thu & Sun', time: '10:00', duration: '1h' },
    ],
    registrants: [
      { id: 'r-06', name: 'Gabriel Torres', avatar: 'GT', email: 'g.torres@fccourtside.com', registeredAt: format(subDays(now, 25), 'yyyy-MM-dd'), status: 'confirmed' },
      { id: 'r-07', name: 'Noah Clarke', avatar: 'NC', email: 'n.clarke@fccourtside.com', registeredAt: format(subDays(now, 24), 'yyyy-MM-dd'), status: 'pending' },
    ],
  },

  // ── BATCH TYPE: Easter Skills Camp ──────────────────
  {
    id: 'seg-004', teamId: 'u17', type: 'batch',
    name: 'Easter Skills Camp 2026',
    description: 'Users choose which batch to join (Training or Fitness) and how many sessions they want to attend. Each batch runs on set days.',
    startDate: format(addDays(now, 10), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 24), 'yyyy-MM-dd'),
    status: 'upcoming',
    capacity: 40, registeredCount: 22,
    signupLink: 'https://courtside.app/register/fc-courtside/easter-camp-2026',
    signupEnabled: true,
    ageGroup: 'Under 17',
    fee: '£250',
    schedule: 'Choose your batches',
    location: 'Academy Complex',
    createdBy: 'Marcus Reid', createdAt: format(subDays(now, 45), 'yyyy-MM-dd'),
    batches: [
      { id: 'bat-01', name: 'Skills Training', eventType: 'Training', eventColor: '#00A76F', days: ['Mon', 'Wed', 'Fri'], time: '09:00-12:00', duration: '3h', totalSessions: 6, capacity: 20, enrolledCount: 14, fee: '£150' },
      { id: 'bat-02', name: 'Fitness & Conditioning', eventType: 'Fitness', eventColor: '#FF6C40', days: ['Tue', 'Thu'], time: '09:00-11:00', duration: '2h', totalSessions: 4, capacity: 15, enrolledCount: 10, fee: '£100' },
      { id: 'bat-03', name: 'Goalkeeping Masterclass', eventType: 'Training', eventColor: '#00B8D9', days: ['Mon', 'Wed'], time: '13:00-15:00', duration: '2h', totalSessions: 4, capacity: 8, enrolledCount: 5, fee: '£120' },
    ],
    registrants: [
      { id: 'r-11', name: 'Tom Wilson', avatar: 'TW', email: 'tom.wilson@email.com', registeredAt: format(subDays(now, 30), 'yyyy-MM-dd'), status: 'confirmed', batchId: 'bat-01', sessionsChosen: 6 },
      { id: 'r-12', name: 'Jake Murray', avatar: 'JM', email: 'jake.m@email.com', registeredAt: format(subDays(now, 28), 'yyyy-MM-dd'), status: 'confirmed', batchId: 'bat-01', sessionsChosen: 4 },
      { id: 'r-13', name: 'Sam Chen', avatar: 'SC', email: 'sam.chen@email.com', registeredAt: format(subDays(now, 20), 'yyyy-MM-dd'), status: 'pending', batchId: 'bat-02', sessionsChosen: 4 },
      { id: 'r-14', name: 'Alex Rivera', avatar: 'AR', email: 'alex.r@email.com', registeredAt: format(subDays(now, 15), 'yyyy-MM-dd'), status: 'waitlisted', batchId: 'bat-01', sessionsChosen: 3 },
      { id: 'r-15', name: 'Kai Patel', avatar: 'KP', email: 'kai.p@email.com', registeredAt: format(subDays(now, 12), 'yyyy-MM-dd'), status: 'confirmed', batchId: 'bat-02', sessionsChosen: 2 },
      { id: 'r-16', name: 'Luca Rossi', avatar: 'LR', email: 'luca.r@email.com', registeredAt: format(subDays(now, 10), 'yyyy-MM-dd'), status: 'confirmed', batchId: 'bat-03', sessionsChosen: 4 },
    ],
  },

  // ── BATCH TYPE: U-21 Development ────────────────────
  {
    id: 'seg-003', teamId: 'u21', type: 'batch',
    name: 'U-21 Development Programme 2025/26',
    description: 'Year-long development programme. Players choose between Technical, Tactical, or combined batches running on different days.',
    startDate: format(subDays(now, 90), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 180), 'yyyy-MM-dd'),
    status: 'active',
    capacity: 24, registeredCount: 22,
    signupLink: 'https://courtside.app/register/fc-courtside/u21-dev-2526',
    signupEnabled: false,
    ageGroup: 'Under 21',
    schedule: 'Choose your batches',
    location: 'Academy Complex',
    createdBy: 'Elena Vasquez', createdAt: format(subDays(now, 100), 'yyyy-MM-dd'),
    batches: [
      { id: 'bat-04', name: 'Technical Development', eventType: 'Training', eventColor: '#00A76F', days: ['Mon', 'Wed', 'Fri'], time: '10:00-12:00', duration: '2h', totalSessions: 48, capacity: 16, enrolledCount: 14 },
      { id: 'bat-05', name: 'Tactical Sessions', eventType: 'Training', eventColor: '#8E33FF', days: ['Tue', 'Thu'], time: '10:00-12:00', duration: '2h', totalSessions: 32, capacity: 16, enrolledCount: 12 },
      { id: 'bat-06', name: 'Physical Conditioning', eventType: 'Fitness', eventColor: '#FF6C40', days: ['Mon', 'Wed', 'Fri'], time: '14:00-15:30', duration: '1h 30m', totalSessions: 48, capacity: 20, enrolledCount: 18 },
    ],
    registrants: [
      { id: 'r-08', name: 'Aiden Murphy', avatar: 'AM', email: 'a.murphy@fccourtside.com', registeredAt: format(subDays(now, 95), 'yyyy-MM-dd'), status: 'confirmed', batchId: 'bat-04', sessionsChosen: 48 },
      { id: 'r-09', name: 'Jayden Park', avatar: 'JP', email: 'j.park@fccourtside.com', registeredAt: format(subDays(now, 94), 'yyyy-MM-dd'), status: 'confirmed', batchId: 'bat-05', sessionsChosen: 32 },
      { id: 'r-10', name: 'Finn O\'Connor', avatar: 'FO', email: 'f.oconnor@fccourtside.com', registeredAt: format(subDays(now, 93), 'yyyy-MM-dd'), status: 'confirmed', batchId: 'bat-06', sessionsChosen: 24 },
    ],
  },

  // ── SEGMENT TYPE: U-17 League ───────────────────────
  {
    id: 'seg-005', teamId: 'u17', type: 'segment',
    name: 'U-17 League Season 2025/26',
    description: 'Full season competitive programme for the under-17 squad with mixed event types.',
    startDate: format(subDays(now, 100), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 60), 'yyyy-MM-dd'),
    status: 'active',
    capacity: null, registeredCount: 20,
    signupLink: '', signupEnabled: false,
    ageGroup: 'Under 17',
    schedule: 'Tue, Thu Training + Sat Matchday',
    location: 'Academy Complex',
    createdBy: 'Elena Vasquez', createdAt: format(subDays(now, 110), 'yyyy-MM-dd'),
    events: [
      { id: 'se-13', title: 'Training', eventType: 'Training', eventColor: '#00A76F', day: 'Tue & Thu', time: '16:00', duration: '1h 30m' },
      { id: 'se-14', title: 'Match Day', eventType: 'Match', eventColor: '#FF5630', day: 'Sat', time: '11:00', duration: '2h' },
      { id: 'se-15', title: 'Team Talk', eventType: 'Meeting', eventColor: '#8E33FF', day: 'Fri', time: '16:30', duration: '45m' },
    ],
    registrants: [],
  },

  // ── BATCH TYPE: Women's Summer ──────────────────────
  {
    id: 'seg-006', teamId: 'women-first', type: 'batch',
    name: 'Summer Fitness Programme 2026',
    description: 'Off-season conditioning. Choose between morning strength, evening cardio, or both.',
    startDate: format(addDays(now, 100), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 142), 'yyyy-MM-dd'),
    status: 'draft',
    capacity: 28, registeredCount: 0,
    signupLink: '', signupEnabled: false,
    schedule: 'Choose your batches',
    location: 'Courtside Training Ground',
    createdBy: 'Lisa Morgan', createdAt: format(subDays(now, 5), 'yyyy-MM-dd'),
    batches: [
      { id: 'bat-07', name: 'Morning Strength', eventType: 'Fitness', eventColor: '#FF6C40', days: ['Mon', 'Wed', 'Fri'], time: '07:00-08:30', duration: '1h 30m', totalSessions: 18, capacity: 20, enrolledCount: 0, fee: '£80' },
      { id: 'bat-08', name: 'Evening Cardio', eventType: 'Fitness', eventColor: '#00B8D9', days: ['Tue', 'Thu'], time: '18:00-19:30', duration: '1h 30m', totalSessions: 12, capacity: 20, enrolledCount: 0, fee: '£60' },
    ],
    registrants: [],
  },
];

export function getSegmentsForTeam(teamId: string): Segment[] {
  return segments.filter(s => s.teamId === teamId);
}

// ── Flat batch helpers ───────────────────────────────────
export interface FlatBatch extends Batch {
  parentSegmentId: string;
  parentSegmentName: string;
  parentSegmentStatus: SegmentStatus;
  teamId: string;
  startDate: string;
  endDate: string;
  registrants: SegmentRegistrant[];
}

export function getFlatBatches(): FlatBatch[] {
  return segments
    .filter(s => s.type === 'batch' && s.batches && s.batches.length > 0)
    .flatMap(seg =>
      seg.batches!.map(batch => ({
        ...batch,
        parentSegmentId: seg.id,
        parentSegmentName: seg.name,
        parentSegmentStatus: seg.status,
        teamId: seg.teamId,
        startDate: seg.startDate,
        endDate: seg.endDate,
        registrants: seg.registrants.filter(r => r.batchId === batch.id),
      }))
    );
}

export const statusConfig: Record<SegmentStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-dark-100', text: 'text-dark-500' },
  upcoming: { label: 'Upcoming', bg: 'bg-blue-50', text: 'text-blue-600' },
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-600' },
  completed: { label: 'Completed', bg: 'bg-dark-50', text: 'text-dark-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500' },
};

export const registrantStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  confirmed: { label: 'Confirmed', bg: 'bg-green-50', text: 'text-green-600' },
  pending: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  waitlisted: { label: 'Waitlisted', bg: 'bg-blue-50', text: 'text-blue-600' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500' },
};
