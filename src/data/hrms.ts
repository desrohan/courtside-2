import { users } from './users';
import { LeaveType } from './settings';

// ── HRMS Check-in Types ──────────────────────────────
export type HRMSAttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday';

export interface HRMSCheckIn {
  id: string;
  userId: string;
  date: string;           // YYYY-MM-DD
  checkInTime?: string;   // ISO timestamp
  checkOutTime?: string;  // ISO timestamp
  status: HRMSAttendanceStatus;
  workedHours: number;
  requiredHours: number;
  eventHours: number;     // hours from event attendance
  totalHours: number;     // workedHours + eventHours
  lateMinutes: number;
  earlyDepartureMinutes: number;
  overtimeHours: number;
  note?: string;
  source: 'manual' | 'self' | 'event_sync';
}

export interface DailyAttendanceSummary {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  halfDay: number;
}

// ── Attendance Requests ──────────────────────────────
export type AttendanceRequestStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceRequestWorkType = 'office' | 'remote' | 'field' | 'on_site';

export interface AttendanceRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime?: string;
  workedHours: number;
  workType: AttendanceRequestWorkType;
  reason: string;
  status: AttendanceRequestStatus;
  submittedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export const attendanceRequests: AttendanceRequest[] = [
  {
    id: 'ar-001',
    userId: 'u-003',
    userName: 'Elena Vasquez',
    userAvatar: 'EV',
    attendanceDate: '2026-04-14',
    checkInTime: '08:15',
    checkOutTime: '17:30',
    workedHours: 9,
    workType: 'field',
    reason: 'Was at the academy scouting session — forgot to check in on the app.',
    status: 'approved',
    submittedAt: '2026-04-15T08:30:00Z',
    resolvedBy: 'Marcus Reid',
    resolvedAt: '2026-04-15T10:15:00Z',
  },
  {
    id: 'ar-002',
    userId: 'u-006',
    userName: 'Daniel Kim',
    userAvatar: 'DK',
    attendanceDate: '2026-04-18',
    checkInTime: '09:00',
    checkOutTime: '18:00',
    workedHours: 8.5,
    workType: 'remote',
    reason: 'Worked from home on data review — app check-in did not register.',
    status: 'approved',
    submittedAt: '2026-04-19T09:00:00Z',
    resolvedBy: 'Marcus Reid',
    resolvedAt: '2026-04-19T09:30:00Z',
  },
  {
    id: 'ar-003',
    userId: 'u-002',
    userName: 'James Carter',
    userAvatar: 'JC',
    attendanceDate: '2026-04-22',
    checkInTime: '07:45',
    checkOutTime: '16:30',
    workedHours: 8.5,
    workType: 'on_site',
    reason: 'Phone was dead on arrival — checked in late on system.',
    status: 'pending',
    submittedAt: '2026-04-22T17:00:00Z',
  },
  {
    id: 'ar-004',
    userId: 'u-005',
    userName: "Sarah O'Brien",
    userAvatar: 'SO',
    attendanceDate: '2026-04-23',
    checkInTime: '08:30',
    workedHours: 0,
    workType: 'office',
    reason: 'Arrived at office but app showed error on check-in.',
    status: 'pending',
    submittedAt: '2026-04-23T12:00:00Z',
  },
];

// ── Leave Types ──────────────────────────────────────
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userAvatar: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveRequestStatus;
  approvedBy?: string;
  appliedAt: string;
  resolvedAt?: string;
}

export interface LeaveBalance {
  userId: string;
  balances: { leaveType: LeaveType; total: number; used: number; remaining: number }[];
}

// ── Mock Data Generators ─────────────────────────────

// Employee users only (non-player, non-guest)
export const employeeUsers = users.filter(u => ['coach', 'staff', 'admin', 'medical'].includes(u.role));

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatISO(d: Date, hours: number, minutes: number): string {
  const dt = new Date(d);
  dt.setHours(hours, minutes, 0, 0);
  return dt.toISOString();
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

// Generate 30 days of check-in records for all employees
function generateCheckInRecords(): HRMSCheckIn[] {
  const records: HRMSCheckIn[] = [];
  const now = new Date(2026, 3, 23); // April 23, 2026
  
  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = formatDate(date);
    const weekend = isWeekend(date);

    for (const user of employeeUsers) {
      const id = `hc-${user.id}-${dateStr}`;
      
      if (weekend) {
        // Coaches may work weekends (Saturday)
        if (user.role === 'coach' && date.getDay() === 6) {
          const lateChance = Math.random();
          const checkInHour = lateChance < 0.2 ? 8 + Math.floor(Math.random() * 2) : 8;
          const checkInMin = Math.floor(Math.random() * 45);
          const lateMinutes = checkInHour > 8 || checkInMin > 30 ? (checkInHour - 8) * 60 + checkInMin - 0 : 0;
          const checkOutHour = 13 + Math.floor(Math.random() * 2);
          const workedHours = checkOutHour - checkInHour - (checkInMin > 30 ? 1 : 0);

          records.push({
            id, userId: user.id, date: dateStr,
            checkInTime: formatISO(date, checkInHour, checkInMin),
            checkOutTime: dayOffset > 0 ? formatISO(date, checkOutHour, Math.floor(Math.random() * 60)) : undefined,
            status: lateMinutes > 0 ? 'late' : 'present',
            workedHours: dayOffset > 0 ? workedHours : 0,
            requiredHours: 0, eventHours: dayOffset > 0 ? Math.floor(Math.random() * 3) : 0,
            totalHours: dayOffset > 0 ? workedHours + Math.floor(Math.random() * 3) : 0,
            lateMinutes, earlyDepartureMinutes: 0, overtimeHours: 0,
            source: 'self',
          });
        }
        continue;
      }

      // Randomly decide status
      const rand = Math.random();
      if (rand < 0.05) {
        // On leave
        records.push({
          id, userId: user.id, date: dateStr,
          status: 'on_leave', workedHours: 0, requiredHours: 8,
          eventHours: 0, totalHours: 0, lateMinutes: 0,
          earlyDepartureMinutes: 0, overtimeHours: 0, source: 'self',
        });
      } else if (rand < 0.08) {
        // Absent
        records.push({
          id, userId: user.id, date: dateStr,
          status: 'absent', workedHours: 0, requiredHours: 8,
          eventHours: 0, totalHours: 0, lateMinutes: 0,
          earlyDepartureMinutes: 0, overtimeHours: 0, source: 'manual',
        });
      } else if (rand < 0.12) {
        // Half day
        const checkInHour = 9;
        const checkInMin = Math.floor(Math.random() * 15);
        records.push({
          id, userId: user.id, date: dateStr,
          checkInTime: formatISO(date, checkInHour, checkInMin),
          checkOutTime: formatISO(date, 13, Math.floor(Math.random() * 30)),
          status: 'half_day', workedHours: 4, requiredHours: 8,
          eventHours: 0, totalHours: 4, lateMinutes: 0,
          earlyDepartureMinutes: 0, overtimeHours: 0, source: 'self',
        });
      } else {
        // Present or late
        const isLate = rand < 0.25;
        const baseHour = user.role === 'coach' ? 8 : 9;
        const checkInHour = isLate ? baseHour + Math.ceil(Math.random() * 1) : baseHour;
        const checkInMin = isLate ? 15 + Math.floor(Math.random() * 45) : Math.floor(Math.random() * 15);
        const graceMinutes = user.role === 'coach' ? 30 : 15;
        const minutesPastStart = (checkInHour - baseHour) * 60 + checkInMin;
        const lateMinutes = minutesPastStart > graceMinutes ? minutesPastStart - graceMinutes : 0;
        
        const endHour = user.role === 'coach' ? 18 : 17;
        const earlyLeaveChance = Math.random();
        const checkOutHour = earlyLeaveChance < 0.1 ? endHour - 1 : endHour;
        const checkOutMin = Math.floor(Math.random() * 30);
        const earlyDep = checkOutHour < endHour ? (endHour - checkOutHour) * 60 - checkOutMin : 0;
        
        const workedDecimal = (checkOutHour + checkOutMin / 60) - (checkInHour + checkInMin / 60);
        const workedHours = Math.round(workedDecimal * 10) / 10;
        const requiredHours = user.role === 'coach' ? 0 : 8;
        const eventHours = user.role === 'coach' ? +(Math.random() * 4).toFixed(1) : 0;
        const totalHours = +(workedHours + eventHours).toFixed(1);
        const overtime = requiredHours > 0 && totalHours > requiredHours ? +(totalHours - requiredHours).toFixed(1) : 0;

        // Today (dayOffset === 0): only check-in, no check-out yet
        records.push({
          id, userId: user.id, date: dateStr,
          checkInTime: formatISO(date, checkInHour, checkInMin),
          checkOutTime: dayOffset > 0 ? formatISO(date, checkOutHour, checkOutMin) : undefined,
          status: lateMinutes > 0 ? 'late' : 'present',
          workedHours: dayOffset > 0 ? workedHours : 0,
          requiredHours,
          eventHours: dayOffset > 0 ? eventHours : 0,
          totalHours: dayOffset > 0 ? totalHours : 0,
          lateMinutes, earlyDepartureMinutes: dayOffset > 0 ? earlyDep : 0,
          overtimeHours: dayOffset > 0 ? overtime : 0,
          source: user.role === 'coach' ? 'self' : 'self',
        });
      }
    }
  }
  return records;
}

export const hrmsCheckIns: HRMSCheckIn[] = generateCheckInRecords();

// Generate daily summaries
export const dailyAttendanceSummaries: DailyAttendanceSummary[] = (() => {
  const summaries: DailyAttendanceSummary[] = [];
  const dateMap = new Map<string, HRMSCheckIn[]>();
  
  for (const r of hrmsCheckIns) {
    const arr = dateMap.get(r.date) || [];
    arr.push(r);
    dateMap.set(r.date, arr);
  }
  
  for (const [date, records] of dateMap) {
    summaries.push({
      date,
      totalEmployees: employeeUsers.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      onLeave: records.filter(r => r.status === 'on_leave').length,
      halfDay: records.filter(r => r.status === 'half_day').length,
    });
  }
  
  return summaries.sort((a, b) => a.date.localeCompare(b.date));
})();

// ── Leave Requests ───────────────────────────────────
export const leaveRequests: LeaveRequest[] = [
  {
    id: 'lr-001', userId: 'u-002', userName: 'James Carter', userRole: 'coach', userAvatar: 'JC',
    leaveType: 'annual', startDate: '2026-04-27', endDate: '2026-05-01', days: 5,
    reason: 'Family vacation planned months ago', status: 'pending',
    appliedAt: '2026-04-20T10:00:00Z',
  },
  {
    id: 'lr-002', userId: 'u-005', userName: "Sarah O'Brien", userRole: 'medical', userAvatar: 'SO',
    leaveType: 'sick', startDate: '2026-04-21', endDate: '2026-04-22', days: 2,
    reason: 'Flu symptoms, doctor advised rest', status: 'approved',
    approvedBy: 'Marcus Reid', appliedAt: '2026-04-21T07:30:00Z', resolvedAt: '2026-04-21T08:15:00Z',
  },
  {
    id: 'lr-003', userId: 'u-006', userName: 'Daniel Kim', userRole: 'staff', userAvatar: 'DK',
    leaveType: 'casual', startDate: '2026-04-25', endDate: '2026-04-25', days: 1,
    reason: 'Personal errand', status: 'pending',
    appliedAt: '2026-04-22T14:00:00Z',
  },
  {
    id: 'lr-004', userId: 'u-003', userName: 'Elena Vasquez', userRole: 'coach', userAvatar: 'EV',
    leaveType: 'annual', startDate: '2026-04-10', endDate: '2026-04-11', days: 2,
    reason: 'Personal time off', status: 'approved',
    approvedBy: 'Marcus Reid', appliedAt: '2026-04-05T09:00:00Z', resolvedAt: '2026-04-05T12:00:00Z',
  },
  {
    id: 'lr-005', userId: 'u-004', userName: 'Ryan Mitchell', userRole: 'coach', userAvatar: 'RM',
    leaveType: 'sick', startDate: '2026-04-15', endDate: '2026-04-15', days: 1,
    reason: 'Migraine', status: 'rejected',
    approvedBy: 'Marcus Reid', appliedAt: '2026-04-15T06:00:00Z', resolvedAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 'lr-006', userId: 'u-001', userName: 'Marcus Reid', userRole: 'admin', userAvatar: 'MR',
    leaveType: 'annual', startDate: '2026-05-05', endDate: '2026-05-09', days: 5,
    reason: 'Annual holiday', status: 'approved',
    approvedBy: 'System', appliedAt: '2026-04-01T10:00:00Z', resolvedAt: '2026-04-01T10:00:00Z',
  },
];

// ── Leave Balances ───────────────────────────────────
export const leaveBalances: LeaveBalance[] = employeeUsers.map(u => ({
  userId: u.id,
  balances: [
    { leaveType: 'sick' as LeaveType,   total: 12, used: u.id === 'u-005' ? 4 : u.id === 'u-004' ? 1 : 2, remaining: u.id === 'u-005' ? 8 : u.id === 'u-004' ? 11 : 10 },
    { leaveType: 'casual' as LeaveType, total: 10, used: u.id === 'u-006' ? 3 : 1, remaining: u.id === 'u-006' ? 7 : 9 },
    { leaveType: 'annual' as LeaveType, total: 15, used: u.id === 'u-002' ? 5 : u.id === 'u-003' ? 4 : u.id === 'u-001' ? 5 : 2, remaining: u.id === 'u-002' ? 10 : u.id === 'u-003' ? 11 : u.id === 'u-001' ? 10 : 13 },
  ],
}));

// ── Utility: Calculate event hours for a user on a date ──
export function calculateEventHours(userId: string, date: string, events: { attendance?: { userId: string; status: string }[]; startTime: string; endTime: string }[]): number {
  let totalMinutes = 0;
  for (const event of events) {
    const record = event.attendance?.find(a => a.userId === userId);
    if (record && (record.status === 'present' || record.status === 'late')) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      totalMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
    }
  }
  return +(totalMinutes / 60).toFixed(1);
}
