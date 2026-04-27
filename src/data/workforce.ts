import { designations, type CompensationPayType, type Designation } from './settings';
import { users, type User } from './users';

export type WorkforceUser = User & { role: Exclude<User['role'], 'player'> };

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'half_day' | 'holiday' | 'week_off';

export interface DailyAttendance {
  userId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  eventHours?: number;
  overtimeHours?: number;
  note?: string;
}

export interface MonthlyAttendanceSummary {
  userId: string;
  month: number;
  year: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  totalHoursWorked: number;
  eventHours: number;
  overtimeHours: number;
}

export interface PayrollDeduction {
  name: string;
  amount: number;
}

export interface PayrollEntry {
  userId: string;
  month: number;
  year: number;
  designation: string;
  payType: Exclude<CompensationPayType, 'none'>;
  rate: number;
  currency: string;
  daysWorked: number;
  hoursWorked: number;
  overtimeHours: number;
  grossPay: number;
  deductions: PayrollDeduction[];
  netPay: number;
  paymentStatus: 'paid' | 'pending' | 'processing';
}

export interface CompensationChange {
  id: string;
  userId: string;
  designationId: string;
  payType: Exclude<CompensationPayType, 'none'>;
  rate: number;
  currency: string;
  effectiveFrom: string;
  reason: string;
  changedBy: string;
  changedAt: string;
}

export interface Payslip {
  id: string;
  userId: string;
  month: number;
  year: number;
  generatedAt: string;
  fileName: string;
}

export const compensationHistory: CompensationChange[] = [
  { id: 'cc-01', userId: 'u-001', designationId: 'des-01', payType: 'salaried', rate: 180000, currency: 'INR', effectiveFrom: '2026-01-01', reason: 'Annual appraisal', changedBy: 'System', changedAt: '2025-12-20' },
  { id: 'cc-02', userId: 'u-001', designationId: 'des-01', payType: 'salaried', rate: 160000, currency: 'INR', effectiveFrom: '2025-01-01', reason: 'Initial compensation', changedBy: 'System', changedAt: '2024-12-15' },
  { id: 'cc-03', userId: 'u-002', designationId: 'des-02', payType: 'salaried', rate: 150000, currency: 'INR', effectiveFrom: '2026-01-01', reason: 'Annual appraisal', changedBy: 'Marcus Reid', changedAt: '2025-12-20' },
  { id: 'cc-04', userId: 'u-002', designationId: 'des-02', payType: 'salaried', rate: 130000, currency: 'INR', effectiveFrom: '2025-04-01', reason: 'Contract renewal', changedBy: 'Marcus Reid', changedAt: '2025-03-15' },
  { id: 'cc-05', userId: 'u-003', designationId: 'des-03', payType: 'salaried', rate: 95000, currency: 'INR', effectiveFrom: '2026-01-01', reason: 'Promotion to Assistant Coach', changedBy: 'Marcus Reid', changedAt: '2025-12-22' },
  { id: 'cc-06', userId: 'u-004', designationId: 'des-04', payType: 'hourly', rate: 900, currency: 'INR', effectiveFrom: '2025-07-01', reason: 'Hourly rate revision', changedBy: 'Marcus Reid', changedAt: '2025-06-28' },
  { id: 'cc-07', userId: 'u-005', designationId: 'des-05', payType: 'salaried', rate: 105000, currency: 'INR', effectiveFrom: '2026-01-01', reason: 'Annual appraisal', changedBy: 'Marcus Reid', changedAt: '2025-12-20' },
  { id: 'cc-08', userId: 'u-006', designationId: 'des-07', payType: 'hourly', rate: 700, currency: 'INR', effectiveFrom: '2025-10-01', reason: 'Market adjustment', changedBy: 'Marcus Reid', changedAt: '2025-09-25' },
];

export const payslips: Payslip[] = [
  { id: 'ps-01', userId: 'u-001', month: 4, year: 2026, generatedAt: '2026-04-30', fileName: 'Marcus_Reid_Apr2026.pdf' },
  { id: 'ps-02', userId: 'u-001', month: 3, year: 2026, generatedAt: '2026-03-31', fileName: 'Marcus_Reid_Mar2026.pdf' },
  { id: 'ps-03', userId: 'u-002', month: 4, year: 2026, generatedAt: '2026-04-30', fileName: 'James_Carter_Apr2026.pdf' },
  { id: 'ps-04', userId: 'u-002', month: 3, year: 2026, generatedAt: '2026-03-31', fileName: 'James_Carter_Mar2026.pdf' },
  { id: 'ps-05', userId: 'u-003', month: 4, year: 2026, generatedAt: '2026-04-30', fileName: 'Elena_Vasquez_Apr2026.pdf' },
  { id: 'ps-06', userId: 'u-004', month: 4, year: 2026, generatedAt: '2026-04-30', fileName: 'Ryan_Mitchell_Apr2026.pdf' },
  { id: 'ps-07', userId: 'u-005', month: 4, year: 2026, generatedAt: '2026-04-30', fileName: 'Sarah_OBrien_Apr2026.pdf' },
  { id: 'ps-08', userId: 'u-006', month: 4, year: 2026, generatedAt: '2026-04-30', fileName: 'Daniel_Kim_Apr2026.pdf' },
];

export function getCompensationHistory(userId: string) {
  return compensationHistory.filter(c => c.userId === userId).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
}

export function getUserPayslips(userId: string) {
  return payslips.filter(p => p.userId === userId).sort((a, b) => {
    const dateA = a.year * 100 + a.month;
    const dateB = b.year * 100 + b.month;
    return dateB - dateA;
  });
}

/* ── Attendance Requests ─────────────────────────────── */

export type AttendanceRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceRequest {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workedHours: string;
  reason: string;
  status: AttendanceRequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export const attendanceRequests: AttendanceRequest[] = [
  { id: 'ar-01', userId: 'u-003', date: '2026-04-23', checkIn: '08:45 AM', checkOut: '05:30 PM', workedHours: '8:45', reason: 'App was down, could not check in via geolocation', status: 'pending', createdAt: '2026-04-23' },
  { id: 'ar-02', userId: 'u-004', date: '2026-04-22', checkIn: '09:00 AM', checkOut: '06:00 PM', workedHours: '9:00', reason: 'Forgot to clock in, was on the field all day', status: 'pending', createdAt: '2026-04-22' },
  { id: 'ar-03', userId: 'u-006', date: '2026-04-21', checkIn: '07:30 AM', checkOut: '04:00 PM', workedHours: '8:30', reason: 'Phone battery died before check-in', status: 'pending', createdAt: '2026-04-21' },
  { id: 'ar-04', userId: 'u-002', date: '2026-04-18', checkIn: '08:00 AM', checkOut: '04:30 PM', workedHours: '8:30', reason: 'Was at off-site facility, no network access', status: 'approved', createdAt: '2026-04-18', reviewedBy: 'Marcus Reid', reviewedAt: '2026-04-19' },
  { id: 'ar-05', userId: 'u-005', date: '2026-04-17', checkIn: '10:00 AM', checkOut: '03:00 PM', workedHours: '5:00', reason: 'Late arrival, forgot to mark attendance', status: 'rejected', createdAt: '2026-04-17', reviewedBy: 'Marcus Reid', reviewedAt: '2026-04-18' },
];

export function getAttendanceRequests() {
  return attendanceRequests.map(req => ({
    ...req,
    user: users.find(u => u.id === req.userId)!,
  }));
}

export function getUserMonthlyAttendance(userId: string, month = workforceReferenceMonth.month, year = workforceReferenceMonth.year) {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const records = dailyAttendanceRecords.filter(r => r.userId === userId && r.date.startsWith(`${year}-${pad(month)}-`));
  const summary = records.reduce<MonthlyAttendanceSummary>((acc, entry) => {
    if (entry.status === 'present') acc.presentDays += 1;
    if (entry.status === 'absent') acc.absentDays += 1;
    if (entry.status === 'leave') acc.leaveDays += 1;
    if (entry.status === 'half_day') acc.halfDays += 1;
    acc.totalHoursWorked += entry.hoursWorked ?? 0;
    acc.eventHours += entry.eventHours ?? 0;
    acc.overtimeHours += entry.overtimeHours ?? 0;
    return acc;
  }, { userId, month, year, presentDays: 0, absentDays: 0, leaveDays: 0, halfDays: 0, totalHoursWorked: 0, eventHours: 0, overtimeHours: 0 });
  return { user, records, summary: { ...summary, totalHoursWorked: Number(summary.totalHoursWorked.toFixed(2)), eventHours: Number(summary.eventHours.toFixed(2)), overtimeHours: Number(summary.overtimeHours.toFixed(2)) } };
}

export const workforceReferenceMonth = { month: 4, year: 2026 };

const hourlyDefaultsByRole: Record<WorkforceUser['role'], number> = {
  admin: 8.5,
  coach: 8,
  medical: 8,
  staff: 8,
};

const attendanceOverrides: Record<string, Partial<Record<number, AttendanceStatus>>> = {
  'u-001': { 9: 'half_day', 17: 'leave', 24: 'present' },
  'u-002': { 8: 'leave', 15: 'leave', 22: 'half_day' },
  'u-003': { 4: 'absent', 18: 'half_day', 25: 'leave' },
  'u-004': { 10: 'present', 11: 'present', 16: 'absent' },
  'u-005': { 7: 'half_day', 14: 'leave', 28: 'leave' },
  'u-006': { 3: 'absent', 12: 'half_day', 21: 'present' },
};

function isWorkforceUser(user: User): user is WorkforceUser {
  return user.role !== 'player';
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getDesignationByName(name: string): Designation | undefined {
  return designations.find(designation => designation.name === name);
}

function getSeed(userId: string) {
  return Number(userId.replace(/\D/g, '')) || 1;
}

function buildDayRecord(user: WorkforceUser, year: number, month: number, day: number): DailyAttendance {
  const date = new Date(year, month - 1, day);
  const weekDay = date.getDay();
  const status = attendanceOverrides[user.id]?.[day]
    ?? (weekDay === 0 || weekDay === 6 ? 'week_off' : 'present');

  if (status !== 'present' && status !== 'half_day') {
    return {
      userId: user.id,
      date: toDateKey(year, month, day),
      status,
      note: status === 'leave' ? 'Approved leave' : status === 'absent' ? 'Unmarked attendance' : undefined,
    };
  }

  const seed = getSeed(user.id);
  const baseStartMinutes = 8 * 60 + 30 + ((day + seed) % 4) * 10;
  const baseHours = hourlyDefaultsByRole[user.role];
  const halfDayHours = 4.5;
  const overtimeHours = status === 'present' && (day + seed) % 5 === 0 ? 1 + ((day + seed) % 2) * 0.5 : 0;
  const eventHours = (user.role === 'coach' || user.role === 'medical') && (day + seed) % 3 === 0
    ? 1.5 + ((day + seed) % 3) * 0.5
    : (day + seed) % 4 === 0 ? 1 : 0;
  const totalHours = status === 'half_day' ? halfDayHours : baseHours + overtimeHours;
  const endMinutes = baseStartMinutes + Math.round(totalHours * 60);

  return {
    userId: user.id,
    date: toDateKey(year, month, day),
    status,
    checkIn: `${pad(Math.floor(baseStartMinutes / 60))}:${pad(baseStartMinutes % 60)}`,
    checkOut: `${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}`,
    hoursWorked: Number(totalHours.toFixed(2)),
    eventHours: Number(eventHours.toFixed(2)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
    note: status === 'half_day' ? 'Partial shift recorded' : undefined,
  };
}

export function getStaffUsers() {
  return users.filter(isWorkforceUser);
}

export const dailyAttendanceRecords: DailyAttendance[] = getStaffUsers().flatMap(user => {
  const daysInMonth = getDaysInMonth(workforceReferenceMonth.year, workforceReferenceMonth.month);

  return Array.from({ length: daysInMonth }, (_, index) => buildDayRecord(user, workforceReferenceMonth.year, workforceReferenceMonth.month, index + 1));
});

export function getDailyAttendance(date: string) {
  return getStaffUsers().map(user => {
    const record = dailyAttendanceRecords.find(entry => entry.userId === user.id && entry.date === date);
    const designation = getDesignationByName(user.designation);

    return {
      user,
      designation,
      record,
    };
  });
}

export function getMonthlyAttendance(month = workforceReferenceMonth.month, year = workforceReferenceMonth.year) {
  return getStaffUsers().map(user => {
    const records = dailyAttendanceRecords.filter(entry => entry.userId === user.id && entry.date.startsWith(`${year}-${pad(month)}-`));
    const summary = records.reduce<MonthlyAttendanceSummary>((accumulator, entry) => {
      if (entry.status === 'present') accumulator.presentDays += 1;
      if (entry.status === 'absent') accumulator.absentDays += 1;
      if (entry.status === 'leave') accumulator.leaveDays += 1;
      if (entry.status === 'half_day') accumulator.halfDays += 1;
      accumulator.totalHoursWorked += entry.hoursWorked ?? 0;
      accumulator.eventHours += entry.eventHours ?? 0;
      accumulator.overtimeHours += entry.overtimeHours ?? 0;
      return accumulator;
    }, {
      userId: user.id,
      month,
      year,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      halfDays: 0,
      totalHoursWorked: 0,
      eventHours: 0,
      overtimeHours: 0,
    });

    return {
      user,
      designation: getDesignationByName(user.designation),
      records,
      summary: {
        ...summary,
        totalHoursWorked: Number(summary.totalHoursWorked.toFixed(2)),
        eventHours: Number(summary.eventHours.toFixed(2)),
        overtimeHours: Number(summary.overtimeHours.toFixed(2)),
      },
    };
  });
}

export function computePayroll(month = workforceReferenceMonth.month, year = workforceReferenceMonth.year): PayrollEntry[] {
  return getMonthlyAttendance(month, year)
    .flatMap(({ user, designation, records, summary }, index) => {
      if (!designation || designation.payType === 'none') {
        return [];
      }

      const workingDays = records.filter(entry => entry.status !== 'week_off' && entry.status !== 'holiday').length || 1;
      const daysWorked = summary.presentDays + summary.halfDays * 0.5;
      const totalHoursWithEvents = summary.totalHoursWorked + summary.eventHours;
      const standardHours = Math.max(totalHoursWithEvents - summary.overtimeHours, 0);
      const overtimeMultiplier = designation.overtimeMultiplier ?? 1;

      let grossPay = 0;

      if (designation.payType === 'hourly') {
        grossPay = (standardHours * designation.rate) + (summary.overtimeHours * designation.rate * overtimeMultiplier);
      } else {
        const attendanceFactor = daysWorked / workingDays;
        const hourlyEquivalent = designation.rate / (workingDays * 8);
        const eventHoursPremium = summary.eventHours * hourlyEquivalent;
        const overtimePremium = summary.overtimeHours * hourlyEquivalent * Math.max(overtimeMultiplier - 1, 0.25);
        grossPay = (designation.rate * attendanceFactor) + eventHoursPremium + overtimePremium;
      }

      const deductions: PayrollDeduction[] = [
        { name: 'PF', amount: Number((grossPay * 0.02).toFixed(2)) },
        { name: 'Tax', amount: Number((grossPay * (designation.payType === 'salaried' ? 0.05 : 0.03)).toFixed(2)) },
      ];
      const totalDeductions = deductions.reduce((total, item) => total + item.amount, 0);

      return [{
        userId: user.id,
        month,
        year,
        designation: designation.name,
        payType: designation.payType,
        rate: designation.rate,
        currency: designation.currency,
        daysWorked: Number(daysWorked.toFixed(1)),
        hoursWorked: Number(summary.totalHoursWorked.toFixed(2)),
        overtimeHours: Number(summary.overtimeHours.toFixed(2)),
        grossPay: Number(grossPay.toFixed(2)),
        deductions,
        netPay: Number((grossPay - totalDeductions).toFixed(2)),
        paymentStatus: index % 3 === 0 ? 'paid' : index % 3 === 1 ? 'processing' : 'pending',
      } satisfies PayrollEntry];
    });
}