import { employeeUsers, hrmsCheckIns } from './hrms';
import { users, User } from './users';
import {
  payrollConfig,
  salaryTemplates,
  ReimbursementCategory,
  SalaryTemplate,
  AllowanceTemplate,
  DeductionTemplate,
} from './settings';

export type PayrollRunStatus = 'draft' | 'completed' | 'paid';
export type PayrollPaymentMethod = 'razorpay' | 'manual' | 'bank_transfer';
export type PaySlipStatus = 'generated' | 'paid';
export type ReimbursementClaimStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface EmployeePayProfile {
  versionId: string;
  userId: string;
  employeeType: string;
  sourceTemplate: string;
  department: string;
  baseSalary: number;
  hourlyRate: number;
  allowances: AllowanceTemplate[];
  deductions: DeductionTemplate[];
  bankDetails: {
    bankName: string;
    accountNumberMasked: string;
    ifscCode: string;
  };
  panNumberMasked: string;
  pfNumber?: string;
  effectiveFrom: string;
  changedAt: string;
  changedBy: string;
  changeReason: string;
}

export interface EmployeeCompensationVersion extends EmployeePayProfile {
  id: string;
}

export interface CompensationChangeRecord {
  id: string;
  userId: string;
  employeeName: string;
  compensationVersionId: string;
  effectiveFrom: string;
  changedAt: string;
  changedBy: string;
  reason: string;
  summary: string;
  fieldsChanged: string[];
}

export interface PaySlipLineItem {
  label: string;
  amount: number;
}

export interface PaySlip {
  id: string;
  payrollRunId: string;
  userId: string;
  employeeName: string;
  employeeRole: string;
  employeeType: string;
  department: string;
  designation: string;
  monthKey: string;
  compensationVersionId: string;
  compensationEffectiveFrom: string;
  compensationChangedAt: string;
  compensationChangedBy: string;
  compensationChangeReason: string;
  earnings: PaySlipLineItem[];
  deductions: PaySlipLineItem[];
  reimbursementTotal: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  workedDays: number;
  requiredDays: number;
  overtimeHours: number;
  lossOfPayDays: number;
  status: PaySlipStatus;
  paidAt?: string;
  paymentMethod?: PayrollPaymentMethod;
  paymentReference?: string;
}

export interface PayrollRun {
  id: string;
  monthKey: string;
  status: PayrollRunStatus;
  totalGross: number;
  totalDeductions: number;
  totalReimbursements: number;
  totalNet: number;
  employeeCount: number;
  paidVia?: PayrollPaymentMethod;
  processedAt?: string;
  paidAt?: string;
}

export interface ReimbursementClaim {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  category: ReimbursementCategory;
  description: string;
  amount: number;
  receiptDate: string;
  submittedAt: string;
  settlementMonthKey: string;
  status: ReimbursementClaimStatus;
  approvedBy?: string;
  attachedToPayslipId?: string;
}

interface MonthlyAttendanceMetrics {
  workedDays: number;
  requiredDays: number;
  absentDays: number;
  halfDays: number;
  onLeaveDays: number;
  totalHours: number;
  overtimeHours: number;
}

export const payrollMonthKeys = ['2026-01', '2026-02', '2026-03', '2026-04'];

const roleToEmployeeType: Record<string, string> = {
  admin: 'General Admin',
  coach: 'Coach',
  medical: 'Medical',
  staff: 'Operations',
};

const roleToDepartment: Record<string, string> = {
  admin: 'Administration',
  coach: 'Coaching',
  medical: 'Medical',
  staff: 'Performance',
};

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getWeekdayCount(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= days; day++) {
    const weekDay = new Date(year, month - 1, day).getDay();
    if (weekDay !== 0 && weekDay !== 6) count++;
  }
  return count;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function cloneAllowances(allowances: AllowanceTemplate[]): AllowanceTemplate[] {
  return allowances.map(allowance => ({ ...allowance }));
}

function cloneDeductions(deductions: DeductionTemplate[]): DeductionTemplate[] {
  return deductions.map(deduction => ({ ...deduction }));
}

function getTemplateForEmployeeType(employeeType: string): SalaryTemplate {
  return salaryTemplates.find(template => template.employeeType === employeeType) ?? salaryTemplates[0];
}

function getMonthlyAttendanceMetrics(userId: string, monthKey: string): MonthlyAttendanceMetrics {
  const records = hrmsCheckIns.filter(record => record.userId === userId && record.date.startsWith(monthKey));
  if (records.length > 0) {
    const absentDays = records.filter(record => record.status === 'absent').length;
    const halfDays = records.filter(record => record.status === 'half_day').length;
    const onLeaveDays = records.filter(record => record.status === 'on_leave').length;
    const presentDays = records.filter(record => record.status === 'present' || record.status === 'late').length;
    return {
      workedDays: presentDays + halfDays * 0.5,
      requiredDays: records.filter(record => record.status !== 'holiday').length,
      absentDays,
      halfDays,
      onLeaveDays,
      totalHours: roundCurrency(records.reduce((sum, record) => sum + record.totalHours, 0)),
      overtimeHours: roundCurrency(records.reduce((sum, record) => sum + record.overtimeHours, 0)),
    };
  }

  const monthSeed = Number(monthKey.replace('-', '')) + userId.length;
  const weekdayCount = getWeekdayCount(monthKey);
  const absentDays = monthSeed % 3;
  const halfDays = monthSeed % 2;
  const onLeaveDays = monthSeed % 2;
  const workedDays = Math.max(weekdayCount - absentDays - onLeaveDays - halfDays * 0.5, 0);
  const hourlyBase = userId.includes('u-00') && (userId === 'u-002' || userId === 'u-003' || userId === 'u-004') ? 8.2 : 8;
  const totalHours = roundCurrency(workedDays * hourlyBase + (monthSeed % 4) * 2.5);
  const overtimeHours = roundCurrency((monthSeed % 5) * 1.5);

  return {
    workedDays,
    requiredDays: weekdayCount,
    absentDays,
    halfDays,
    onLeaveDays,
    totalHours,
    overtimeHours,
  };
}

function getBankDetails(index: number) {
  return {
    bankName: index % 2 === 0 ? 'HDFC Bank' : 'ICICI Bank',
    accountNumberMasked: `XXXXXX${String(4521 + index).padStart(4, '0')}`,
    ifscCode: index % 2 === 0 ? 'HDFC0001044' : 'ICIC0000331',
  };
}

function createInitialCompensationVersion(user: User, index: number): EmployeeCompensationVersion {
  const employeeType = roleToEmployeeType[user.role] ?? 'General Admin';
  const template = getTemplateForEmployeeType(employeeType);
  const allowances = cloneAllowances(template.allowances);
  const deductions = cloneDeductions(template.deductions);

  if (user.role === 'staff') {
    allowances.push({ name: 'Data Tools Allowance', amount: 1800, taxable: false });
  }

  if (user.role === 'coach') {
    deductions.push({ name: 'Kit Recovery', type: 'fixed', value: 750, preTax: false });
  }

  return {
    id: `comp-${user.id}-2026-01`,
    versionId: `comp-${user.id}-2026-01`,
    userId: user.id,
    employeeType,
    sourceTemplate: employeeType,
    department: roleToDepartment[user.role] ?? 'Administration',
    baseSalary: template.baseSalary,
    hourlyRate: template.hourlyRate,
    allowances,
    deductions,
    bankDetails: getBankDetails(index),
    panNumberMasked: `ABCDE${String(1200 + index)}X`,
    pfNumber: `PF-${2300 + index}`,
    effectiveFrom: '2026-01',
    changedAt: '2026-01-01T09:00:00Z',
    changedBy: 'System',
    changeReason: `Initial compensation setup from ${employeeType} template`,
  };
}

function createRevision(base: EmployeeCompensationVersion, changes: Partial<EmployeeCompensationVersion>): EmployeeCompensationVersion {
  const id = changes.id ?? `${base.id}-${changes.effectiveFrom ?? 'revision'}`;
  return {
    ...base,
    ...changes,
    id,
    versionId: id,
    allowances: changes.allowances ? cloneAllowances(changes.allowances) : cloneAllowances(base.allowances),
    deductions: changes.deductions ? cloneDeductions(changes.deductions) : cloneDeductions(base.deductions),
    bankDetails: changes.bankDetails ? { ...changes.bankDetails } : { ...base.bankDetails },
  };
}

const initialCompensationVersions = employeeUsers.map((user, index) => createInitialCompensationVersion(user, index));

const compensationRevisionSeeds: EmployeeCompensationVersion[] = initialCompensationVersions.flatMap(version => {
  if (version.userId === 'u-002') {
    return [
      createRevision(version, {
        id: 'comp-u-002-2026-03',
        hourlyRate: 1950,
        effectiveFrom: '2026-03',
        changedAt: '2026-02-26T11:00:00Z',
        changedBy: 'Marcus Reid',
        changeReason: 'Annual coaching rate revision after first-team review',
      }),
    ];
  }

  if (version.userId === 'u-005') {
    return [
      createRevision(version, {
        id: 'comp-u-005-2026-04',
        baseSalary: 152000,
        allowances: [
          ...version.allowances,
          { name: 'On-Call Recovery Allowance', amount: 6500, taxable: true },
        ],
        effectiveFrom: '2026-04',
        changedAt: '2026-03-29T16:20:00Z',
        changedBy: 'Marcus Reid',
        changeReason: 'Expanded matchday coverage and on-call recovery support',
      }),
    ];
  }

  if (version.userId === 'u-006') {
    return [
      createRevision(version, {
        id: 'comp-u-006-2026-02',
        baseSalary: 104000,
        allowances: version.allowances.map(allowance => allowance.name === 'Data Tools Allowance'
          ? { ...allowance, amount: 2600 }
          : allowance),
        effectiveFrom: '2026-02',
        changedAt: '2026-01-28T15:10:00Z',
        changedBy: 'Marcus Reid',
        changeReason: 'Analytics tooling stipend revision for expanded reporting scope',
      }),
    ];
  }

  return [];
});

export const employeeCompensationVersions: EmployeeCompensationVersion[] = [...initialCompensationVersions, ...compensationRevisionSeeds]
  .sort((left, right) => {
    if (left.userId !== right.userId) return left.userId.localeCompare(right.userId);
    return left.effectiveFrom.localeCompare(right.effectiveFrom);
  });

function getFieldsChanged(previous: EmployeeCompensationVersion | undefined, current: EmployeeCompensationVersion): string[] {
  if (!previous) {
    return ['template', 'base pay', 'allowances', 'deductions'];
  }

  const fieldsChanged: string[] = [];

  if (previous.employeeType !== current.employeeType) fieldsChanged.push('employee type');
  if (previous.department !== current.department) fieldsChanged.push('department');
  if (previous.baseSalary !== current.baseSalary) fieldsChanged.push('base salary');
  if (previous.hourlyRate !== current.hourlyRate) fieldsChanged.push('hourly rate');
  if (JSON.stringify(previous.allowances) !== JSON.stringify(current.allowances)) fieldsChanged.push('allowances');
  if (JSON.stringify(previous.deductions) !== JSON.stringify(current.deductions)) fieldsChanged.push('deductions');
  if (JSON.stringify(previous.bankDetails) !== JSON.stringify(current.bankDetails)) fieldsChanged.push('bank details');
  if (previous.panNumberMasked !== current.panNumberMasked) fieldsChanged.push('PAN');
  if (previous.pfNumber !== current.pfNumber) fieldsChanged.push('PF');

  return fieldsChanged.length > 0 ? fieldsChanged : ['effective-date adjustment'];
}

export const compensationChangeRecords: CompensationChangeRecord[] = employeeUsers.flatMap(user => {
  const versions = employeeCompensationVersions
    .filter(version => version.userId === user.id)
    .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));

  return versions.map((version, index) => ({
    id: `audit-${version.id}`,
    userId: user.id,
    employeeName: `${user.firstName} ${user.lastName}`,
    compensationVersionId: version.id,
    effectiveFrom: version.effectiveFrom,
    changedAt: version.changedAt,
    changedBy: version.changedBy,
    reason: version.changeReason,
    summary: index === 0
      ? `${version.sourceTemplate} compensation profile created`
      : `${version.sourceTemplate} compensation updated for ${monthLabel(version.effectiveFrom)}`,
    fieldsChanged: getFieldsChanged(versions[index - 1], version),
  }));
});

function getEffectiveCompensationVersion(
  userId: string,
  monthKey: string,
  versions: EmployeeCompensationVersion[] = employeeCompensationVersions,
): EmployeeCompensationVersion {
  const userVersions = versions
    .filter(version => version.userId === userId)
    .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));

  const eligibleVersions = userVersions.filter(version => version.effectiveFrom <= monthKey);
  const resolved = eligibleVersions[eligibleVersions.length - 1] ?? userVersions[0];
  return {
    ...resolved,
    allowances: cloneAllowances(resolved.allowances),
    deductions: cloneDeductions(resolved.deductions),
    bankDetails: { ...resolved.bankDetails },
  };
}

export function getEmployeeCompensationHistory(
  userId: string,
  versions: EmployeeCompensationVersion[] = employeeCompensationVersions,
): EmployeeCompensationVersion[] {
  return versions
    .filter(version => version.userId === userId)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))
    .map(version => ({
      ...version,
      allowances: cloneAllowances(version.allowances),
      deductions: cloneDeductions(version.deductions),
      bankDetails: { ...version.bankDetails },
    }));
}

export function getEmployeePayProfile(
  userId: string,
  monthKey: string,
  versions: EmployeeCompensationVersion[] = employeeCompensationVersions,
): EmployeePayProfile {
  const version = getEffectiveCompensationVersion(userId, monthKey, versions);
  return {
    versionId: version.id,
    userId: version.userId,
    employeeType: version.employeeType,
    sourceTemplate: version.sourceTemplate,
    department: version.department,
    baseSalary: version.baseSalary,
    hourlyRate: version.hourlyRate,
    allowances: cloneAllowances(version.allowances),
    deductions: cloneDeductions(version.deductions),
    bankDetails: { ...version.bankDetails },
    panNumberMasked: version.panNumberMasked,
    pfNumber: version.pfNumber,
    effectiveFrom: version.effectiveFrom,
    changedAt: version.changedAt,
    changedBy: version.changedBy,
    changeReason: version.changeReason,
  };
}

export function getEmployeePayProfilesForMonth(
  monthKey: string,
  versions: EmployeeCompensationVersion[] = employeeCompensationVersions,
): EmployeePayProfile[] {
  return employeeUsers.map(user => getEmployeePayProfile(user.id, monthKey, versions));
}

function calculateDeductionAmount(deduction: DeductionTemplate, taxableBase: number): number {
  if (deduction.type === 'percentage') {
    return roundCurrency((taxableBase * deduction.value) / 100);
  }
  return roundCurrency(deduction.value);
}

function getReimbursementEarnings(userId: string, monthKey: string, claims: ReimbursementClaim[]): PaySlipLineItem[] {
  return claims
    .filter(claim => claim.userId === userId && claim.settlementMonthKey === monthKey && (claim.status === 'approved' || claim.status === 'paid'))
    .map(claim => ({
      label: `Reimbursement: ${claim.description}`,
      amount: claim.amount,
    }));
}

const baseReimbursementClaims: ReimbursementClaim[] = [
  {
    id: 'rc-001',
    userId: 'u-002',
    userName: 'James Carter',
    userAvatar: 'JC',
    category: 'travel',
    description: 'Away fixture taxi',
    amount: 3200,
    receiptDate: '2026-01-18',
    submittedAt: '2026-01-19T09:15:00Z',
    settlementMonthKey: '2026-01',
    status: 'paid',
    approvedBy: 'Marcus Reid',
  },
  {
    id: 'rc-002',
    userId: 'u-005',
    userName: "Sarah O'Brien",
    userAvatar: 'SO',
    category: 'medical',
    description: 'Recovery tape restock',
    amount: 5400,
    receiptDate: '2026-01-24',
    submittedAt: '2026-01-25T13:10:00Z',
    settlementMonthKey: '2026-02',
    status: 'paid',
    approvedBy: 'Marcus Reid',
  },
  {
    id: 'rc-003',
    userId: 'u-006',
    userName: 'Daniel Kim',
    userAvatar: 'DK',
    category: 'equipment',
    description: 'GPS pod replacement',
    amount: 11800,
    receiptDate: '2026-02-03',
    submittedAt: '2026-02-04T10:30:00Z',
    settlementMonthKey: '2026-02',
    status: 'paid',
    approvedBy: 'Marcus Reid',
  },
  {
    id: 'rc-004',
    userId: 'u-003',
    userName: 'Elena Vasquez',
    userAvatar: 'EV',
    category: 'food',
    description: 'Matchday meal pack',
    amount: 1800,
    receiptDate: '2026-02-11',
    submittedAt: '2026-02-12T08:45:00Z',
    settlementMonthKey: '2026-03',
    status: 'paid',
    approvedBy: 'Marcus Reid',
  },
  {
    id: 'rc-005',
    userId: 'u-004',
    userName: 'Ryan Mitchell',
    userAvatar: 'RM',
    category: 'travel',
    description: 'Scouting mileage',
    amount: 4200,
    receiptDate: '2026-03-02',
    submittedAt: '2026-03-03T15:00:00Z',
    settlementMonthKey: '2026-03',
    status: 'approved',
    approvedBy: 'Marcus Reid',
  },
  {
    id: 'rc-006',
    userId: 'u-001',
    userName: 'Marcus Reid',
    userAvatar: 'MR',
    category: 'travel',
    description: 'League meeting travel',
    amount: 6100,
    receiptDate: '2026-03-14',
    submittedAt: '2026-03-14T11:20:00Z',
    settlementMonthKey: '2026-03',
    status: 'paid',
    approvedBy: 'System',
  },
  {
    id: 'rc-007',
    userId: 'u-006',
    userName: 'Daniel Kim',
    userAvatar: 'DK',
    category: 'food',
    description: 'Analyst travel meal',
    amount: 1350,
    receiptDate: '2026-04-05',
    submittedAt: '2026-04-05T18:10:00Z',
    settlementMonthKey: '2026-04',
    status: 'approved',
    approvedBy: 'Marcus Reid',
  },
  {
    id: 'rc-008',
    userId: 'u-002',
    userName: 'James Carter',
    userAvatar: 'JC',
    category: 'equipment',
    description: 'Whistle and marker pack',
    amount: 2600,
    receiptDate: '2026-04-08',
    submittedAt: '2026-04-09T07:45:00Z',
    settlementMonthKey: '2026-04',
    status: 'approved',
    approvedBy: 'Marcus Reid',
  },
  {
    id: 'rc-009',
    userId: 'u-005',
    userName: "Sarah O'Brien",
    userAvatar: 'SO',
    category: 'medical',
    description: 'Emergency physio supplies',
    amount: 7400,
    receiptDate: '2026-04-12',
    submittedAt: '2026-04-12T16:20:00Z',
    settlementMonthKey: '2026-04',
    status: 'pending',
  },
  {
    id: 'rc-010',
    userId: 'u-003',
    userName: 'Elena Vasquez',
    userAvatar: 'EV',
    category: 'travel',
    description: 'Academy scouting ride share',
    amount: 2850,
    receiptDate: '2026-04-16',
    submittedAt: '2026-04-16T20:10:00Z',
    settlementMonthKey: '2026-04',
    status: 'pending',
  },
  {
    id: 'rc-011',
    userId: 'u-004',
    userName: 'Ryan Mitchell',
    userAvatar: 'RM',
    category: 'food',
    description: 'Goalkeeper camp refreshments',
    amount: 900,
    receiptDate: '2026-04-18',
    submittedAt: '2026-04-18T09:35:00Z',
    settlementMonthKey: '2026-04',
    status: 'rejected',
    approvedBy: 'Marcus Reid',
  },
  {
    id: 'rc-012',
    userId: 'u-001',
    userName: 'Marcus Reid',
    userAvatar: 'MR',
    category: 'travel',
    description: 'Board presentation commute',
    amount: 2500,
    receiptDate: '2026-04-20',
    submittedAt: '2026-04-20T08:05:00Z',
    settlementMonthKey: '2026-04',
    status: 'approved',
    approvedBy: 'System',
  },
];

export function calculatePaySlip(
  userId: string,
  monthKey: string,
  claims: ReimbursementClaim[] = baseReimbursementClaims,
  versions: EmployeeCompensationVersion[] = employeeCompensationVersions,
): PaySlip {
  const user = users.find(entry => entry.id === userId) ?? users[0];
  const profile = getEmployeePayProfile(userId, monthKey, versions);
  const metrics = getMonthlyAttendanceMetrics(userId, monthKey);
  const reimbursementLines = getReimbursementEarnings(userId, monthKey, claims);
  const reimbursementTotal = roundCurrency(reimbursementLines.reduce((sum, item) => sum + item.amount, 0));

  const allowanceLines: PaySlipLineItem[] = profile.allowances.map(allowance => ({ label: allowance.name, amount: allowance.amount }));
  const allowanceTotal = roundCurrency(allowanceLines.reduce((sum, item) => sum + item.amount, 0));

  const earnings: PaySlipLineItem[] = [];
  const deductionLines: PaySlipLineItem[] = [];
  let grossPay = 0;

  if (profile.hourlyRate > 0) {
    const regularHours = roundCurrency(Math.max(metrics.totalHours - metrics.overtimeHours, 0));
    const basePay = roundCurrency(regularHours * profile.hourlyRate);
    const overtimePay = roundCurrency(metrics.overtimeHours * profile.hourlyRate * payrollConfig.overtimeMultiplier);
    earnings.push({ label: 'Regular Hours', amount: basePay });
    if (overtimePay > 0) {
      earnings.push({ label: 'Overtime Premium', amount: overtimePay });
    }
    grossPay = basePay + overtimePay + allowanceTotal + reimbursementTotal;
  } else {
    const dailyRate = profile.baseSalary / Math.max(metrics.requiredDays || getWeekdayCount(monthKey), 1);
    const overtimeRate = profile.baseSalary / 160;
    const overtimePay = roundCurrency(metrics.overtimeHours * overtimeRate * payrollConfig.overtimeMultiplier);
    const absenceDeduction = payrollConfig.absenceDeductionType === 'proportional'
      ? roundCurrency(dailyRate * metrics.absentDays)
      : roundCurrency(payrollConfig.fixedAbsentDeduction * metrics.absentDays);
    const halfDayDeduction = roundCurrency(dailyRate * payrollConfig.halfDayDeductionPercent * metrics.halfDays);

    earnings.push({ label: 'Base Salary', amount: profile.baseSalary });
    if (overtimePay > 0) {
      earnings.push({ label: 'Overtime Adjustment', amount: overtimePay });
    }
    if (absenceDeduction > 0) {
      deductionLines.push({ label: 'Loss of Pay', amount: absenceDeduction });
    }
    if (halfDayDeduction > 0) {
      deductionLines.push({ label: 'Half Day Deduction', amount: halfDayDeduction });
    }
    grossPay = profile.baseSalary + overtimePay + allowanceTotal + reimbursementTotal;
  }

  earnings.push(...allowanceLines, ...reimbursementLines);

  const taxableBase = roundCurrency(grossPay - reimbursementTotal);
  for (const deduction of profile.deductions) {
    const amount = calculateDeductionAmount(deduction, taxableBase);
    if (amount > 0) {
      deductionLines.push({ label: deduction.name, amount });
    }
  }

  const totalDeductions = roundCurrency(deductionLines.reduce((sum, item) => sum + item.amount, 0));
  const netPay = roundCurrency(grossPay - totalDeductions);
  const payrollRunId = `pr-${monthKey}`;

  return {
    id: `ps-${userId}-${monthKey}`,
    payrollRunId,
    userId,
    employeeName: `${user.firstName} ${user.lastName}`,
    employeeRole: user.role,
    employeeType: profile.employeeType,
    department: profile.department,
    designation: user.designation,
    monthKey,
    compensationVersionId: profile.versionId,
    compensationEffectiveFrom: profile.effectiveFrom,
    compensationChangedAt: profile.changedAt,
    compensationChangedBy: profile.changedBy,
    compensationChangeReason: profile.changeReason,
    earnings,
    deductions: deductionLines,
    reimbursementTotal,
    grossPay: roundCurrency(grossPay),
    totalDeductions,
    netPay,
    workedDays: metrics.workedDays,
    requiredDays: metrics.requiredDays,
    overtimeHours: metrics.overtimeHours,
    lossOfPayDays: metrics.absentDays + metrics.halfDays * payrollConfig.halfDayDeductionPercent,
    status: monthKey === '2026-04' ? 'generated' : 'paid',
    paidAt: monthKey === '2026-04' ? undefined : `${monthKey}-30T10:00:00Z`,
    paymentMethod: monthKey === '2026-04' ? undefined : 'razorpay',
    paymentReference: monthKey === '2026-04' ? undefined : `RZP-${userId.toUpperCase()}-${monthKey.replace('-', '')}`,
  };
}

export function buildPaySlips(
  monthKeys: string[] = payrollMonthKeys,
  claims: ReimbursementClaim[] = baseReimbursementClaims,
  versions: EmployeeCompensationVersion[] = employeeCompensationVersions,
): PaySlip[] {
  return monthKeys.flatMap(monthKey =>
    employeeUsers.map(user => calculatePaySlip(user.id, monthKey, claims, versions))
  );
}

export function buildPayrollRuns(
  slipList: PaySlip[] = buildPaySlips(),
  monthKeys: string[] = payrollMonthKeys,
): PayrollRun[] {
  return monthKeys.map(monthKey => {
    const monthSlips = slipList.filter(slip => slip.monthKey === monthKey);
    return {
      id: `pr-${monthKey}`,
      monthKey,
      status: monthKey === '2026-04' ? 'draft' : 'paid',
      totalGross: roundCurrency(monthSlips.reduce((sum, slip) => sum + slip.grossPay, 0)),
      totalDeductions: roundCurrency(monthSlips.reduce((sum, slip) => sum + slip.totalDeductions, 0)),
      totalReimbursements: roundCurrency(monthSlips.reduce((sum, slip) => sum + slip.reimbursementTotal, 0)),
      totalNet: roundCurrency(monthSlips.reduce((sum, slip) => sum + slip.netPay, 0)),
      employeeCount: monthSlips.length,
      paidVia: monthKey === '2026-04' ? undefined : 'razorpay',
      processedAt: `${monthKey}-28T12:00:00Z`,
      paidAt: monthKey === '2026-04' ? undefined : `${monthKey}-30T16:00:00Z`,
    };
  });
}

export const employeePayProfiles: EmployeePayProfile[] = getEmployeePayProfilesForMonth(
  payrollMonthKeys[payrollMonthKeys.length - 1],
  employeeCompensationVersions,
);

export const paySlips: PaySlip[] = buildPaySlips(payrollMonthKeys, baseReimbursementClaims, employeeCompensationVersions);

export const reimbursementClaims: ReimbursementClaim[] = baseReimbursementClaims.map(claim => ({
  ...claim,
  attachedToPayslipId: claim.status === 'approved' || claim.status === 'paid'
    ? paySlips.find(slip => slip.userId === claim.userId && slip.monthKey === claim.settlementMonthKey)?.id
    : undefined,
}));

export const payrollRuns: PayrollRun[] = buildPayrollRuns(paySlips, payrollMonthKeys);

export function getPayrollCostForMonth(monthKey: string): number {
  const monthSlips = paySlips.filter(slip => slip.monthKey === monthKey);
  return roundCurrency(monthSlips.reduce((sum, slip) => sum + slip.netPay, 0));
}

export function getHeadcountForMonth(monthKey: string): number {
  return paySlips.filter(slip => slip.monthKey === monthKey).length;
}

export function getPrintablePaySlipTitle(slip: PaySlip): string {
  return `${slip.employeeName} - ${monthLabel(slip.monthKey)} Payslip`;
}