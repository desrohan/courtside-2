import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Check, ChevronLeft, ChevronRight, CreditCard, DollarSign,
  Download, Eye, FileBadge2, History, PencilLine, Receipt, Wallet, X,
} from 'lucide-react';
import { currentUser, users } from '@/data/users';
import {
  CompensationChangeRecord,
  EmployeeCompensationVersion,
  EmployeePayProfile,
  PaySlip,
  PayrollRun,
  ReimbursementClaim,
  buildPaySlips,
  buildPayrollRuns,
  compensationChangeRecords,
  employeeCompensationVersions,
  getPrintablePaySlipTitle,
  getEmployeeCompensationHistory,
  getEmployeePayProfile,
  getEmployeePayProfilesForMonth,
  payrollMonthKeys,
  payrollRuns,
  paySlips,
  reimbursementClaims,
} from '@/data/payroll';
import { payrollConfig, reimbursementCategoryConfigs, ReimbursementCategory, salaryTemplates } from '@/data/settings';

type PayrollTab = 'my-pay' | 'payroll' | 'compensation' | 'payslips' | 'reimbursements' | 'cost-analytics';

const tabDefs: { key: PayrollTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { key: 'my-pay', label: 'My Pay', icon: <DollarSign size={15} /> },
  { key: 'payroll', label: 'Payroll', icon: <Wallet size={15} />, adminOnly: true },
  { key: 'compensation', label: 'Compensation', icon: <PencilLine size={15} />, adminOnly: true },
  { key: 'payslips', label: 'Payslips', icon: <Receipt size={15} /> },
  { key: 'reimbursements', label: 'Reimbursements', icon: <CreditCard size={15} /> },
  { key: 'cost-analytics', label: 'Cost Analytics', icon: <BarChart3 size={15} />, adminOnly: true },
];

const claimStatusClasses: Record<ReimbursementClaim['status'], string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-blue-50 text-blue-600',
  rejected: 'bg-red-50 text-red-600',
  paid: 'bg-green-50 text-green-600',
};

const runStatusClasses: Record<PayrollRun['status'], string> = {
  draft: 'bg-dark-50 text-dark-500',
  completed: 'bg-blue-50 text-blue-600',
  paid: 'bg-green-50 text-green-600',
};

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(monthKey: string, diff: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const next = new Date(year, month - 1 + diff, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: payrollConfig.currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function mergeSlipRuntimeState(previousSlips: PaySlip[], nextSlips: PaySlip[]): PaySlip[] {
  return nextSlips.map(slip => {
    const previous = previousSlips.find(entry => entry.id === slip.id);
    return previous ? {
      ...slip,
      status: previous.status,
      paidAt: previous.paidAt,
      paymentMethod: previous.paymentMethod,
      paymentReference: previous.paymentReference,
    } : slip;
  });
}

function mergeRunRuntimeState(previousRuns: PayrollRun[], nextRuns: PayrollRun[]): PayrollRun[] {
  return nextRuns.map(run => {
    const previous = previousRuns.find(entry => entry.id === run.id);
    return previous ? {
      ...run,
      status: previous.status,
      paidAt: previous.paidAt,
      paidVia: previous.paidVia,
      processedAt: previous.processedAt,
    } : run;
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getSalaryTemplate(employeeType: string) {
  return salaryTemplates.find(template => template.employeeType === employeeType) ?? salaryTemplates[0];
}

function getPayModel(profile: EmployeePayProfile): 'hourly' | 'salaried' {
  return profile.hourlyRate > 0 ? 'hourly' : 'salaried';
}

function getCompensationValue(profile: EmployeePayProfile): string {
  return getPayModel(profile) === 'hourly'
    ? `${formatCurrency(profile.hourlyRate)}/hr`
    : formatCurrency(profile.baseSalary);
}

function getAuditFieldChanges(previous: EmployeePayProfile, nextVersion: EmployeeCompensationVersion): string[] {
  const fieldsChanged: string[] = [];

  if (previous.department !== nextVersion.department) fieldsChanged.push('department');
  if (previous.baseSalary !== nextVersion.baseSalary) fieldsChanged.push('base salary');
  if (previous.hourlyRate !== nextVersion.hourlyRate) fieldsChanged.push('hourly rate');
  if (JSON.stringify(previous.allowances) !== JSON.stringify(nextVersion.allowances)) fieldsChanged.push('allowances');
  if (JSON.stringify(previous.deductions) !== JSON.stringify(nextVersion.deductions)) fieldsChanged.push('deductions');

  return fieldsChanged.length > 0 ? fieldsChanged : ['effective-date adjustment'];
}

function printPaySlip(slip: PaySlip, profile?: EmployeePayProfile) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  const earningsRows = slip.earnings.map(item => `<tr><td>${item.label}</td><td style="text-align:right">${formatCurrency(item.amount)}</td></tr>`).join('');
  const deductionRows = slip.deductions.map(item => `<tr><td>${item.label}</td><td style="text-align:right">${formatCurrency(item.amount)}</td></tr>`).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>${getPrintablePaySlipTitle(slip)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
          h1, h2, h3 { margin: 0; }
          .muted { color: #6B7280; }
          .header { display:flex; justify-content:space-between; margin-bottom: 24px; }
          .card { border: 1px solid #E5E7EB; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px 0; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
          th { text-align: left; color: #6B7280; }
          .summary { display:grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .summary-item { background:#F9FAFB; border-radius: 12px; padding: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Courtside Payroll</h1>
            <p class="muted">Payslip for ${monthLabel(slip.monthKey)}</p>
          </div>
          <div>
            <h3>${slip.employeeName}</h3>
            <p class="muted">${slip.designation}</p>
            <p class="muted">${profile?.department ?? slip.department}</p>
          </div>
        </div>
        <div class="card summary">
          <div class="summary-item"><div class="muted">Gross Pay</div><strong>${formatCurrency(slip.grossPay)}</strong></div>
          <div class="summary-item"><div class="muted">Deductions</div><strong>${formatCurrency(slip.totalDeductions)}</strong></div>
          <div class="summary-item"><div class="muted">Net Pay</div><strong>${formatCurrency(slip.netPay)}</strong></div>
        </div>
        <div class="card">
          <h3>Earnings</h3>
          <table>
            <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${earningsRows}</tbody>
          </table>
        </div>
        <div class="card">
          <h3>Deductions</h3>
          <table>
            <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${deductionRows}</tbody>
          </table>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

function PaySlipBreakdown({ slip }: { slip: PaySlip }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 grid sm:grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Compensation Snapshot</p>
          <p className="text-sm font-bold text-blue-900 mt-1">Effective from {monthLabel(slip.compensationEffectiveFrom)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Last Revised By</p>
          <p className="text-sm font-bold text-blue-900 mt-1">{slip.compensationChangedBy}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">Reason</p>
          <p className="text-sm font-bold text-blue-900 mt-1">{slip.compensationChangeReason}</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-dark-25 rounded-xl border border-dark-100 p-4">
        <h4 className="text-sm font-bold text-dark-900 mb-3">Earnings</h4>
        <div className="space-y-2">
          {slip.earnings.map(item => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-dark-500">{item.label}</span>
              <span className="font-bold text-dark-800">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>
        <div className="bg-dark-25 rounded-xl border border-dark-100 p-4">
          <h4 className="text-sm font-bold text-dark-900 mb-3">Deductions</h4>
          <div className="space-y-2">
            {slip.deductions.map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-dark-500">{item.label}</span>
                <span className="font-bold text-dark-800">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayrollModule() {
  const isAdmin = currentUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<PayrollTab>('my-pay');
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [compensationVersions, setCompensationVersions] = useState(employeeCompensationVersions);
  const [compensationAudit, setCompensationAudit] = useState(compensationChangeRecords);
  const [runs, setRuns] = useState(payrollRuns);
  const [slips, setSlips] = useState(paySlips);
  const [claims, setClaims] = useState(reimbursementClaims);
  const [expandedPayslipId, setExpandedPayslipId] = useState<string | null>(null);
  const [reimbursementView, setReimbursementView] = useState<'my' | 'admin'>(isAdmin ? 'admin' : 'my');
  const [claimCategory, setClaimCategory] = useState<ReimbursementCategory>('travel');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimReceiptDate, setClaimReceiptDate] = useState('2026-04-23');
  const [editingCompensationUserId, setEditingCompensationUserId] = useState<string | null>(null);
  const [compensationEffectiveFrom, setCompensationEffectiveFrom] = useState('2026-04');
  const [compensationDepartment, setCompensationDepartment] = useState('');
  const [compensationBaseSalary, setCompensationBaseSalary] = useState('');
  const [compensationHourlyRate, setCompensationHourlyRate] = useState('');
  const [compensationReason, setCompensationReason] = useState('');
  const [compensationAllowanceName, setCompensationAllowanceName] = useState('');
  const [compensationAllowanceAmount, setCompensationAllowanceAmount] = useState('');
  const [compensationDeductionName, setCompensationDeductionName] = useState('');
  const [compensationDeductionType, setCompensationDeductionType] = useState<'fixed' | 'percentage'>('fixed');
  const [compensationDeductionValue, setCompensationDeductionValue] = useState('');

  const currentRun = runs.find(run => run.monthKey === selectedMonth);
  const monthSlips = slips.filter(slip => slip.monthKey === selectedMonth);
  const mySlip = slips.find(slip => slip.userId === currentUser.id && slip.monthKey === selectedMonth);
  const myHistory = slips.filter(slip => slip.userId === currentUser.id).slice().sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const myClaims = claims.filter(claim => claim.userId === currentUser.id).slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const pendingClaims = claims.filter(claim => claim.status === 'pending');
  const editableMonths = payrollMonthKeys.filter(monthKey => runs.find(run => run.monthKey === monthKey)?.status !== 'paid');
  const compensationViewMonth = editableMonths.includes(selectedMonth) ? selectedMonth : editableMonths[0] ?? selectedMonth;
  const compensationProfiles = getEmployeePayProfilesForMonth(compensationViewMonth, compensationVersions);
  const scheduledChangeCount = compensationVersions.filter(version => version.effectiveFrom === compensationViewMonth).length;
  const latestAuditRecord = compensationAudit.slice().sort((left, right) => right.changedAt.localeCompare(left.changedAt))[0];
  const editingCompensationProfile = editingCompensationUserId
    ? getEmployeePayProfile(editingCompensationUserId, compensationEffectiveFrom, compensationVersions)
    : null;
  const editingCompensationHistory = editingCompensationUserId
    ? getEmployeeCompensationHistory(editingCompensationUserId, compensationVersions)
    : [];

  const regeneratePayroll = (nextVersions: EmployeeCompensationVersion[], nextClaims: ReimbursementClaim[]) => {
    const regeneratedSlips = buildPaySlips(payrollMonthKeys, nextClaims, nextVersions);
    const mergedSlips = mergeSlipRuntimeState(slips, regeneratedSlips);
    const regeneratedRuns = buildPayrollRuns(mergedSlips, payrollMonthKeys);
    const mergedRuns = mergeRunRuntimeState(runs, regeneratedRuns);
    setSlips(mergedSlips);
    setRuns(mergedRuns);
  };

  const resetCompensationDraft = (userId: string, useTemplateDefaults = false) => {
    const baseProfile = getEmployeePayProfile(userId, compensationViewMonth, compensationVersions);
    const template = getSalaryTemplate(baseProfile.employeeType);
    const draftProfile = useTemplateDefaults ? {
      ...baseProfile,
      department: baseProfile.department,
      baseSalary: template.baseSalary,
      hourlyRate: template.hourlyRate,
      allowances: template.allowances,
      deductions: template.deductions,
    } : baseProfile;

    setCompensationEffectiveFrom(compensationViewMonth);
    setCompensationDepartment(draftProfile.department);
    setCompensationBaseSalary(String(draftProfile.baseSalary));
    setCompensationHourlyRate(String(draftProfile.hourlyRate));
    setCompensationReason('');
    setCompensationAllowanceName('');
    setCompensationAllowanceAmount('');
    setCompensationDeductionName('');
    setCompensationDeductionType('fixed');
    setCompensationDeductionValue('');
  };

  const openCompensationEditor = (userId: string) => {
    setEditingCompensationUserId(userId);
    resetCompensationDraft(userId);
  };

  const closeCompensationEditor = () => {
    setEditingCompensationUserId(null);
    setCompensationReason('');
  };

  const handleRunPayroll = () => {
    setRuns(prev => prev.map(run => run.monthKey === selectedMonth ? { ...run, status: 'completed', processedAt: new Date().toISOString() } : run));
  };

  const handleDisburse = () => {
    const paidAt = new Date().toISOString();
    setRuns(prev => prev.map(run => run.monthKey === selectedMonth ? { ...run, status: 'paid', paidAt, paidVia: 'razorpay' } : run));
    setSlips(prev => prev.map(slip => slip.monthKey === selectedMonth ? {
      ...slip,
      status: 'paid',
      paidAt,
      paymentMethod: 'razorpay',
      paymentReference: slip.paymentReference ?? `RZP-${slip.userId.toUpperCase()}-${selectedMonth.replace('-', '')}`,
    } : slip));
    setClaims(prev => prev.map(claim => claim.settlementMonthKey === selectedMonth && claim.status === 'approved' ? { ...claim, status: 'paid' } : claim));
  };

  const handleClaimSubmit = () => {
    if (!claimAmount || !claimDescription.trim()) return;
    const newClaim: ReimbursementClaim = {
      id: `rc-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userAvatar: currentUser.avatar,
      category: claimCategory,
      description: claimDescription.trim(),
      amount: Number(claimAmount),
      receiptDate: claimReceiptDate,
      submittedAt: new Date().toISOString(),
      settlementMonthKey: selectedMonth,
      status: 'pending',
    };
    setClaims(prev => [newClaim, ...prev]);
    setClaimAmount('');
    setClaimDescription('');
  };

  const handleClaimAction = (claimId: string, nextStatus: 'approved' | 'rejected') => {
    const claim = claims.find(entry => entry.id === claimId);
    if (!claim) return;

    const nextClaims = claims.map(entry => entry.id === claimId ? { ...entry, status: nextStatus, approvedBy: `${currentUser.firstName} ${currentUser.lastName}` } : entry);
    setClaims(nextClaims);
    regeneratePayroll(compensationVersions, nextClaims);
  };

  const handleCompensationSave = () => {
    if (!editingCompensationUserId || !compensationReason.trim()) return;

    const baseProfile = getEmployeePayProfile(editingCompensationUserId, compensationEffectiveFrom, compensationVersions);
    const employee = users.find(user => user.id === editingCompensationUserId);
    if (!employee) return;

    const nextAllowances = baseProfile.allowances.map(allowance => ({ ...allowance }));
    const nextDeductions = baseProfile.deductions.map(deduction => ({ ...deduction }));

    if (compensationAllowanceName.trim() && Number(compensationAllowanceAmount) > 0) {
      nextAllowances.push({
        name: compensationAllowanceName.trim(),
        amount: Number(compensationAllowanceAmount),
        taxable: false,
      });
    }

    if (compensationDeductionName.trim() && Number(compensationDeductionValue) > 0) {
      nextDeductions.push({
        name: compensationDeductionName.trim(),
        type: compensationDeductionType,
        value: Number(compensationDeductionValue),
        preTax: false,
      });
    }

    const changedAt = new Date().toISOString();
    const versionId = `comp-${editingCompensationUserId}-${compensationEffectiveFrom}-${Date.now()}`;
    const nextVersion: EmployeeCompensationVersion = {
      id: versionId,
      versionId,
      userId: editingCompensationUserId,
      employeeType: baseProfile.employeeType,
      sourceTemplate: baseProfile.sourceTemplate,
      department: compensationDepartment,
      baseSalary: getPayModel(baseProfile) === 'hourly' ? 0 : Number(compensationBaseSalary || 0),
      hourlyRate: getPayModel(baseProfile) === 'hourly' ? Number(compensationHourlyRate || 0) : 0,
      allowances: nextAllowances,
      deductions: nextDeductions,
      bankDetails: { ...baseProfile.bankDetails },
      panNumberMasked: baseProfile.panNumberMasked,
      pfNumber: baseProfile.pfNumber,
      effectiveFrom: compensationEffectiveFrom,
      changedAt,
      changedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      changeReason: compensationReason.trim(),
    };

    const nextVersions = [...compensationVersions.filter(version => !(version.userId === editingCompensationUserId && version.effectiveFrom === compensationEffectiveFrom)), nextVersion]
      .sort((left, right) => {
        if (left.userId !== right.userId) return left.userId.localeCompare(right.userId);
        return left.effectiveFrom.localeCompare(right.effectiveFrom);
      });

    const nextAuditRecord: CompensationChangeRecord = {
      id: `audit-${versionId}`,
      userId: editingCompensationUserId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      compensationVersionId: versionId,
      effectiveFrom: compensationEffectiveFrom,
      changedAt,
      changedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      reason: compensationReason.trim(),
      summary: `${baseProfile.sourceTemplate} compensation scheduled for ${monthLabel(compensationEffectiveFrom)}`,
      fieldsChanged: getAuditFieldChanges(baseProfile, nextVersion),
    };

    setCompensationVersions(nextVersions);
    setCompensationAudit(prev => [nextAuditRecord, ...prev.filter(record => !(record.userId === editingCompensationUserId && record.effectiveFrom === compensationEffectiveFrom))]);
    regeneratePayroll(nextVersions, claims);
    closeCompensationEditor();
  };

  const departmentRows = monthSlips.reduce<Record<string, { count: number; net: number }>>((acc, slip) => {
    const row = acc[slip.department] ?? { count: 0, net: 0 };
    row.count += 1;
    row.net += slip.netPay;
    acc[slip.department] = row;
    return acc;
  }, {});
  const maxDepartmentCost = Math.max(...Object.values(departmentRows).map(row => row.net), 1);
  const trendMax = Math.max(...runs.map(run => run.totalNet), 1);
  const previousMonth = runs.find(run => run.monthKey === shiftMonth(selectedMonth, -1));
  const monthChange = currentRun && previousMonth
    ? roundCurrency(((currentRun.totalNet - previousMonth.totalNet) / Math.max(previousMonth.totalNet, 1)) * 100)
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-dark-900">Payroll</h1>
          <p className="text-xs text-dark-400 mt-0.5">Month-wise salary processing, payslips, reimbursements, and workforce cost analytics</p>
        </div>
        <div className="flex items-center gap-1 bg-dark-50 rounded-xl p-0.5 w-fit">
          <button onClick={() => setSelectedMonth(prev => shiftMonth(prev, -1))} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm text-dark-500 flex items-center justify-center"><ChevronLeft size={15} /></button>
          <div className="px-3 min-w-[150px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Payroll Month</p>
            <p className="text-sm font-semibold text-dark-800">{monthLabel(selectedMonth)}</p>
          </div>
          <button onClick={() => setSelectedMonth(prev => shiftMonth(prev, 1))} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm text-dark-500 flex items-center justify-center"><ChevronRight size={15} /></button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-dark-100/60 rounded-xl p-0.5 w-fit flex-wrap">
        {tabDefs.filter(tab => !tab.adminOnly || isAdmin).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'my-pay' && mySlip && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Gross Pay', value: formatCurrency(mySlip.grossPay), tone: 'text-green-600' },
              { label: 'Deductions', value: formatCurrency(mySlip.totalDeductions), tone: 'text-red-600' },
              { label: 'Reimbursements', value: formatCurrency(mySlip.reimbursementTotal), tone: 'text-blue-600' },
              { label: 'Net Pay', value: formatCurrency(mySlip.netPay), tone: 'text-dark-900' },
            ].map(card => (
              <div key={card.label} className="bg-white border border-dark-100 rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">{card.label}</p>
                <p className={`text-lg font-extrabold mt-1 ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-dark-100 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-dark-900">Current Payslip Snapshot</h2>
                <p className="text-xs text-dark-400 mt-0.5">{mySlip.designation} · {mySlip.department} · {monthLabel(selectedMonth)}</p>
              </div>
              <button onClick={() => printPaySlip(mySlip, getEmployeePayProfile(mySlip.userId, mySlip.monthKey, compensationVersions))} className="h-9 px-4 rounded-xl border border-dark-200 bg-white text-dark-600 text-sm font-semibold hover:bg-dark-50 flex items-center gap-2">
                <Download size={14} /> Download Payslip
              </button>
            </div>
            <PaySlipBreakdown slip={mySlip} />
          </div>

          <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-100">
              <h3 className="text-sm font-bold text-dark-900">Month-wise Pay History</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                  <th className="px-4 py-2.5">Month</th>
                  <th className="px-4 py-2.5">Gross</th>
                  <th className="px-4 py-2.5">Reimbursements</th>
                  <th className="px-4 py-2.5">Deductions</th>
                  <th className="px-4 py-2.5">Net</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {myHistory.map(slip => (
                  <tr key={slip.id} className="border-t border-dark-50 hover:bg-dark-25">
                    <td className="px-4 py-2.5 font-semibold text-dark-800">{monthLabel(slip.monthKey)}</td>
                    <td className="px-4 py-2.5 text-dark-600">{formatCurrency(slip.grossPay)}</td>
                    <td className="px-4 py-2.5 text-blue-600 font-bold">{formatCurrency(slip.reimbursementTotal)}</td>
                    <td className="px-4 py-2.5 text-red-600 font-bold">{formatCurrency(slip.totalDeductions)}</td>
                    <td className="px-4 py-2.5 font-bold text-dark-800">{formatCurrency(slip.netPay)}</td>
                    <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${slip.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{slip.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && isAdmin && currentRun && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Gross Payroll', value: formatCurrency(currentRun.totalGross), tone: 'text-dark-900' },
              { label: 'Deductions', value: formatCurrency(currentRun.totalDeductions), tone: 'text-red-600' },
              { label: 'Reimbursements', value: formatCurrency(currentRun.totalReimbursements), tone: 'text-blue-600' },
              { label: 'Net Payroll', value: formatCurrency(currentRun.totalNet), tone: 'text-green-600' },
              { label: 'Headcount', value: String(currentRun.employeeCount), tone: 'text-dark-700' },
            ].map(card => (
              <div key={card.label} className="bg-white border border-dark-100 rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">{card.label}</p>
                <p className={`text-lg font-extrabold mt-1 ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-dark-100 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-dark-900">Payroll Run Status</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${runStatusClasses[currentRun.status]}`}>{currentRun.status}</span>
                <span className="text-xs text-dark-400">Pay day: {payrollConfig.payDay} · Provider: Razorpay Payouts</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleRunPayroll} disabled={currentRun.status !== 'draft'} className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-court-600 transition-colors">Run Payroll</button>
              <button onClick={handleDisburse} disabled={currentRun.status !== 'completed'} className="h-9 px-4 rounded-xl border border-dark-200 bg-white text-dark-600 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dark-50 transition-colors">Disburse via Razorpay</button>
            </div>
          </div>

          <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5">Gross</th>
                  <th className="px-4 py-2.5">Reimbursements</th>
                  <th className="px-4 py-2.5">Deductions</th>
                  <th className="px-4 py-2.5">Net</th>
                </tr>
              </thead>
              <tbody>
                {monthSlips.map(slip => (
                  <tr key={slip.id} className="border-t border-dark-50 hover:bg-dark-25">
                    <td className="px-4 py-2.5"><p className="font-semibold text-dark-800">{slip.employeeName}</p><p className="text-[10px] text-dark-400">{slip.designation}</p></td>
                    <td className="px-4 py-2.5 text-dark-500">{slip.department}</td>
                    <td className="px-4 py-2.5 text-dark-600">{formatCurrency(slip.grossPay)}</td>
                    <td className="px-4 py-2.5 text-blue-600 font-bold">{formatCurrency(slip.reimbursementTotal)}</td>
                    <td className="px-4 py-2.5 text-red-600 font-bold">{formatCurrency(slip.totalDeductions)}</td>
                    <td className="px-4 py-2.5 font-bold text-dark-800">{formatCurrency(slip.netPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compensation' && isAdmin && (
        <div className="space-y-4">
          {compensationViewMonth !== selectedMonth && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-semibold text-amber-700">
              Payroll is locked for {monthLabel(selectedMonth)}. New compensation revisions can take effect from {monthLabel(compensationViewMonth)} onward.
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-dark-100 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Editable Payroll Month</p>
              <p className="text-lg font-extrabold text-dark-900 mt-1">{monthLabel(compensationViewMonth)}</p>
              <p className="text-[10px] text-dark-400 mt-1">Compensation changes are applied as effective-dated revisions.</p>
            </div>
            <div className="bg-white border border-dark-100 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Employees on Payroll</p>
              <p className="text-lg font-extrabold text-dark-900 mt-1">{compensationProfiles.length}</p>
              <p className="text-[10px] text-dark-400 mt-1">Each employee resolves from a template snapshot plus version history.</p>
            </div>
            <div className="bg-white border border-dark-100 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Scheduled Revisions</p>
              <p className="text-lg font-extrabold text-blue-600 mt-1">{scheduledChangeCount}</p>
              <p className="text-[10px] text-dark-400 mt-1">Compensation versions taking effect in {monthLabel(compensationViewMonth)}.</p>
            </div>
            <div className="bg-white border border-dark-100 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Latest Audit Update</p>
              <p className="text-sm font-extrabold text-dark-900 mt-1">{latestAuditRecord?.changedBy ?? 'System'}</p>
              <p className="text-[10px] text-dark-400 mt-1">{latestAuditRecord ? formatDateTime(latestAuditRecord.changedAt) : 'No revisions yet'}</p>
            </div>
          </div>

          <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-dark-900">Compensation Profiles</h3>
                <p className="text-xs text-dark-400 mt-0.5">Templates provide the default pay model and components. Editing creates a new effective-dated employee snapshot without rewriting older months.</p>
              </div>
              <div className="text-[11px] text-dark-400 font-semibold">
                Historical payslips stay tied to the version that was effective in that payroll month.
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Template</th>
                  <th className="px-4 py-2.5">Pay Model</th>
                  <th className="px-4 py-2.5">Effective Pay</th>
                  <th className="px-4 py-2.5">Effective From</th>
                  <th className="px-4 py-2.5">Last Revision</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {compensationProfiles.map(profile => {
                  const employee = users.find(user => user.id === profile.userId);
                  return (
                    <tr key={profile.userId} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-dark-800">{employee ? `${employee.firstName} ${employee.lastName}` : profile.userId}</p>
                        <p className="text-[10px] text-dark-400">{employee?.designation ?? profile.department}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-dark-100 text-dark-600 text-[10px] font-bold">{profile.sourceTemplate}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${getPayModel(profile) === 'hourly' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {getPayModel(profile)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-dark-800">{getCompensationValue(profile)}</td>
                      <td className="px-4 py-2.5 text-dark-500">{monthLabel(profile.effectiveFrom)}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-dark-700">{profile.changedBy}</p>
                        <p className="text-[10px] text-dark-400">{formatDateTime(profile.changedAt)}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => openCompensationEditor(profile.userId)} disabled={!editableMonths.length} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-dark-200 text-dark-600 hover:bg-dark-50 disabled:opacity-40 disabled:cursor-not-allowed">
                          <PencilLine size={11} /> Edit Revision
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4">
            <div className="bg-white border border-dark-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <History size={15} className="text-blue-600" />
                <h3 className="text-sm font-bold text-dark-900">Versioning Rules</h3>
              </div>
              <div className="space-y-2 text-xs text-dark-500">
                <p>Each employee starts with a template-derived compensation snapshot.</p>
                <p>Editing compensation creates a new version with its own effective month, reason, and actor.</p>
                <p>Payroll runs and payslips resolve the latest version effective for that month, so prior paid months remain historically attributable to the earlier version.</p>
              </div>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-dark-100">
                <h3 className="text-sm font-bold text-dark-900">Compensation Audit Trail</h3>
                <p className="text-xs text-dark-400 mt-0.5">Who changed compensation, when it takes effect, and what moved</p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                    <th className="px-4 py-2.5">Employee</th>
                    <th className="px-4 py-2.5">Effective</th>
                    <th className="px-4 py-2.5">Summary</th>
                    <th className="px-4 py-2.5">Fields</th>
                    <th className="px-4 py-2.5">Changed By</th>
                  </tr>
                </thead>
                <tbody>
                  {compensationAudit.slice().sort((left, right) => right.changedAt.localeCompare(left.changedAt)).map(record => (
                    <tr key={record.id} className="border-t border-dark-50 hover:bg-dark-25 align-top">
                      <td className="px-4 py-2.5 font-semibold text-dark-800">{record.employeeName}</td>
                      <td className="px-4 py-2.5 text-dark-500">{monthLabel(record.effectiveFrom)}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-dark-700">{record.summary}</p>
                        <p className="text-[10px] text-dark-400 mt-1">{record.reason}</p>
                      </td>
                      <td className="px-4 py-2.5 text-dark-500">{record.fieldsChanged.join(', ')}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-dark-700">{record.changedBy}</p>
                        <p className="text-[10px] text-dark-400">{formatDateTime(record.changedAt)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payslips' && (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Month</th>
                <th className="px-4 py-2.5">Gross</th>
                <th className="px-4 py-2.5">Net</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(isAdmin ? monthSlips : myHistory).map(slip => {
                const profile = getEmployeePayProfile(slip.userId, slip.monthKey, compensationVersions);
                return (
                  <>
                    <tr key={slip.id} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5"><p className="font-semibold text-dark-800">{slip.employeeName}</p><p className="text-[10px] text-dark-400">{slip.designation}</p></td>
                      <td className="px-4 py-2.5 text-dark-500">{monthLabel(slip.monthKey)}</td>
                      <td className="px-4 py-2.5 text-dark-600">{formatCurrency(slip.grossPay)}</td>
                      <td className="px-4 py-2.5 font-bold text-dark-800">{formatCurrency(slip.netPay)}</td>
                      <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${slip.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{slip.status}</span></td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2">
                          <button onClick={() => setExpandedPayslipId(prev => prev === slip.id ? null : slip.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-dark-200 text-dark-600 hover:bg-dark-50"><Eye size={11} /> {expandedPayslipId === slip.id ? 'Hide' : 'View'}</button>
                          <button onClick={() => printPaySlip(slip, profile)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-dark-200 text-dark-600 hover:bg-dark-50"><Download size={11} /> Download</button>
                        </div>
                      </td>
                    </tr>
                    {expandedPayslipId === slip.id && (
                      <tr className="border-t border-dark-50 bg-dark-25/50">
                        <td colSpan={6} className="px-4 py-4">
                          <PaySlipBreakdown slip={slip} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reimbursements' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex gap-1 bg-dark-100/60 rounded-xl p-0.5 w-fit">
              {[{ key: 'admin' as const, label: 'Manage Claims' }, { key: 'my' as const, label: 'My Claims' }].map(view => (
                <button key={view.key} onClick={() => setReimbursementView(view.key)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${reimbursementView === view.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>{view.label}</button>
              ))}
            </div>
          )}

          {reimbursementView === 'my' && (
            <>
              <div className="bg-white border border-dark-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-dark-900">Submit Reimbursement Claim</h3>
                <div className="grid sm:grid-cols-4 gap-3">
                  <select value={claimCategory} onChange={e => setClaimCategory(e.target.value as ReimbursementCategory)} className="h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700 bg-white">
                    {reimbursementCategoryConfigs.map(item => <option key={item.category} value={item.category}>{item.label}</option>)}
                  </select>
                  <input value={claimAmount} onChange={e => setClaimAmount(e.target.value)} placeholder="Amount" className="h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                  <input value={claimReceiptDate} onChange={e => setClaimReceiptDate(e.target.value)} type="date" className="h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                  <button onClick={handleClaimSubmit} className="h-10 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 transition-colors">Submit Claim</button>
                </div>
                <textarea value={claimDescription} onChange={e => setClaimDescription(e.target.value)} rows={3} placeholder="Describe the expense" className="w-full px-3 py-2 rounded-xl border border-dark-200 text-sm text-dark-700 resize-none" />
              </div>

              <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Settlement</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myClaims.map(claim => (
                      <tr key={claim.id} className="border-t border-dark-50 hover:bg-dark-25">
                        <td className="px-4 py-2.5 font-semibold text-dark-800 capitalize">{claim.category}</td>
                        <td className="px-4 py-2.5 text-dark-500">{claim.description}</td>
                        <td className="px-4 py-2.5 font-bold text-dark-800">{formatCurrency(claim.amount)}</td>
                        <td className="px-4 py-2.5 text-dark-500">{monthLabel(claim.settlementMonthKey)}</td>
                        <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${claimStatusClasses[claim.status]}`}>{claim.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {reimbursementView === 'admin' && isAdmin && (
            <>
              {pendingClaims.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                  <FileBadge2 size={14} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">{pendingClaims.length} reimbursement claims are waiting for approval</span>
                </div>
              )}
              <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                      <th className="px-4 py-2.5">Employee</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Settlement</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map(claim => (
                      <tr key={claim.id} className="border-t border-dark-50 hover:bg-dark-25">
                        <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-dark-200 flex items-center justify-center text-white text-[9px] font-bold">{claim.userAvatar}</div><span className="font-semibold text-dark-800">{claim.userName}</span></div></td>
                        <td className="px-4 py-2.5 capitalize text-dark-500">{claim.category}</td>
                        <td className="px-4 py-2.5 text-dark-500">{claim.description}</td>
                        <td className="px-4 py-2.5 font-bold text-dark-800">{formatCurrency(claim.amount)}</td>
                        <td className="px-4 py-2.5 text-dark-500">{monthLabel(claim.settlementMonthKey)}</td>
                        <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${claimStatusClasses[claim.status]}`}>{claim.status}</span></td>
                        <td className="px-4 py-2.5">
                          {claim.status === 'pending' ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleClaimAction(claim.id, 'approved')} className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100"><Check size={12} /></button>
                              <button onClick={() => handleClaimAction(claim.id, 'rejected')} className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"><X size={12} /></button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-dark-300">{claim.approvedBy ?? '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'cost-analytics' && isAdmin && currentRun && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-dark-100 rounded-xl p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Total Payroll Cost</p><p className="text-lg font-extrabold text-dark-900 mt-1">{formatCurrency(currentRun.totalNet)}</p></div>
            <div className="bg-white border border-dark-100 rounded-xl p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Headcount</p><p className="text-lg font-extrabold text-dark-900 mt-1">{currentRun.employeeCount}</p></div>
            <div className="bg-white border border-dark-100 rounded-xl p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Cost Per Employee</p><p className="text-lg font-extrabold text-dark-900 mt-1">{formatCurrency(currentRun.totalNet / Math.max(currentRun.employeeCount, 1))}</p></div>
            <div className="bg-white border border-dark-100 rounded-xl p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">MoM Change</p><p className={`text-lg font-extrabold mt-1 ${monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{monthChange}%</p></div>
          </div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-dark-100"><h3 className="text-sm font-bold text-dark-900">Department Cost Breakdown</h3></div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5">Headcount</th>
                    <th className="px-4 py-2.5">Net Cost</th>
                    <th className="px-4 py-2.5">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(departmentRows).map(([department, row]) => (
                    <tr key={department} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5 font-semibold text-dark-800">{department}</td>
                      <td className="px-4 py-2.5 text-dark-600">{row.count}</td>
                      <td className="px-4 py-2.5 font-bold text-dark-800">{formatCurrency(row.net)}</td>
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="w-24 h-2 rounded-full bg-dark-100 overflow-hidden"><div className="h-full bg-court-500 rounded-full" style={{ width: `${(row.net / maxDepartmentCost) * 100}%` }} /></div><span className="text-dark-500">{Math.round((row.net / Math.max(currentRun.totalNet, 1)) * 100)}%</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl p-4">
              <h3 className="text-sm font-bold text-dark-900">Monthly Payroll Trend</h3>
              <div className="mt-4 space-y-3">
                {payrollMonthKeys.map(monthKey => {
                  const run = runs.find(entry => entry.monthKey === monthKey);
                  const width = ((run?.totalNet ?? 0) / trendMax) * 100;
                  return (
                    <div key={monthKey} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-dark-500"><span>{monthLabel(monthKey)}</span><span>{formatCurrency(run?.totalNet ?? 0)}</span></div>
                      <div className="h-2 rounded-full bg-dark-100 overflow-hidden"><div className="h-full rounded-full bg-court-500" style={{ width: `${Math.max(width, 10)}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingCompensationUserId && editingCompensationProfile && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={closeCompensationEditor}>
          <div onClick={event => event.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-5xl max-h-[88vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-dark-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-dark-900">Edit Compensation Revision</h3>
                <p className="text-xs text-dark-400 mt-0.5">{users.find(user => user.id === editingCompensationUserId)?.firstName} {users.find(user => user.id === editingCompensationUserId)?.lastName} · {editingCompensationProfile.sourceTemplate} template</p>
              </div>
              <button onClick={closeCompensationEditor} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid lg:grid-cols-4 gap-3">
                <div className="bg-dark-25 border border-dark-100 rounded-xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Template Default</p>
                  <p className="text-sm font-extrabold text-dark-900 mt-1">{getPayModel(editingCompensationProfile) === 'hourly' ? `${formatCurrency(getSalaryTemplate(editingCompensationProfile.employeeType).hourlyRate)}/hr` : formatCurrency(getSalaryTemplate(editingCompensationProfile.employeeType).baseSalary)}</p>
                </div>
                <div className="bg-dark-25 border border-dark-100 rounded-xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Current Effective</p>
                  <p className="text-sm font-extrabold text-dark-900 mt-1">{getCompensationValue(editingCompensationProfile)}</p>
                </div>
                <div className="bg-dark-25 border border-dark-100 rounded-xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Allowances</p>
                  <p className="text-sm font-extrabold text-dark-900 mt-1">{editingCompensationProfile.allowances.length}</p>
                </div>
                <div className="bg-dark-25 border border-dark-100 rounded-xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Deductions</p>
                  <p className="text-sm font-extrabold text-dark-900 mt-1">{editingCompensationProfile.deductions.length}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl bg-blue-50 border border-blue-100 p-3">
                <div>
                  <p className="text-sm font-bold text-blue-900">Template inheritance stays intact</p>
                  <p className="text-xs text-blue-600 mt-0.5">This revision starts from the employee's current compensation snapshot. Use the template reset if you want to discard prior overrides and seed from defaults again.</p>
                </div>
                <button onClick={() => resetCompensationDraft(editingCompensationUserId, true)} className="h-9 px-4 rounded-xl border border-blue-200 bg-white text-blue-700 text-sm font-semibold hover:bg-blue-50">Use Template Defaults</button>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Effective Month</label>
                      <select value={compensationEffectiveFrom} onChange={event => setCompensationEffectiveFrom(event.target.value)} className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700 bg-white">
                        {editableMonths.map(monthKey => <option key={monthKey} value={monthKey}>{monthLabel(monthKey)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Department</label>
                      <input value={compensationDepartment} onChange={event => setCompensationDepartment(event.target.value)} className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                    </div>
                  </div>

                  {getPayModel(editingCompensationProfile) === 'hourly' ? (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Hourly Rate</label>
                      <input value={compensationHourlyRate} onChange={event => setCompensationHourlyRate(event.target.value)} className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Base Salary</label>
                      <input value={compensationBaseSalary} onChange={event => setCompensationBaseSalary(event.target.value)} className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Revision Reason</label>
                    <textarea value={compensationReason} onChange={event => setCompensationReason(event.target.value)} rows={3} placeholder="Explain why the compensation change is being made" className="w-full px-3 py-2 rounded-xl border border-dark-200 text-sm text-dark-700 resize-none" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Add Allowance</label>
                      <input value={compensationAllowanceName} onChange={event => setCompensationAllowanceName(event.target.value)} placeholder="Allowance name" className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Allowance Amount</label>
                      <input value={compensationAllowanceAmount} onChange={event => setCompensationAllowanceAmount(event.target.value)} placeholder="0" className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-[1.2fr_0.8fr_0.8fr] gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Add Deduction</label>
                      <input value={compensationDeductionName} onChange={event => setCompensationDeductionName(event.target.value)} placeholder="Deduction name" className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Type</label>
                      <select value={compensationDeductionType} onChange={event => setCompensationDeductionType(event.target.value as 'fixed' | 'percentage')} className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700 bg-white">
                        <option value="fixed">Fixed</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Value</label>
                      <input value={compensationDeductionValue} onChange={event => setCompensationDeductionValue(event.target.value)} placeholder="0" className="w-full h-10 px-3 rounded-xl border border-dark-200 text-sm text-dark-700" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-dark-25 border border-dark-100 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-dark-900">Current Snapshot</h4>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between"><span className="text-dark-500">Pay model</span><span className="font-bold text-dark-800 capitalize">{getPayModel(editingCompensationProfile)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-dark-500">Effective pay</span><span className="font-bold text-dark-800">{getCompensationValue(editingCompensationProfile)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-dark-500">Effective from</span><span className="font-bold text-dark-800">{monthLabel(editingCompensationProfile.effectiveFrom)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-dark-500">Last revised by</span><span className="font-bold text-dark-800">{editingCompensationProfile.changedBy}</span></div>
                    </div>
                  </div>

                  <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-dark-100">
                      <h4 className="text-sm font-bold text-dark-900">Employee Compensation History</h4>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                          <th className="px-4 py-2.5">Effective</th>
                          <th className="px-4 py-2.5">Pay</th>
                          <th className="px-4 py-2.5">Reason</th>
                          <th className="px-4 py-2.5">Changed By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingCompensationHistory.map(version => (
                          <tr key={version.id} className="border-t border-dark-50 align-top">
                            <td className="px-4 py-2.5 text-dark-500">{monthLabel(version.effectiveFrom)}</td>
                            <td className="px-4 py-2.5 font-bold text-dark-800">{version.hourlyRate > 0 ? `${formatCurrency(version.hourlyRate)}/hr` : formatCurrency(version.baseSalary)}</td>
                            <td className="px-4 py-2.5 text-dark-500">{version.changeReason}</td>
                            <td className="px-4 py-2.5">
                              <p className="font-semibold text-dark-700">{version.changedBy}</p>
                              <p className="text-[10px] text-dark-400">{formatDateTime(version.changedAt)}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-dark-100 flex items-center justify-between gap-3">
              <p className="text-xs text-dark-400">Saving creates a new compensation version and regenerates payroll for unpaid months using that version.</p>
              <div className="flex gap-2">
                <button onClick={closeCompensationEditor} className="h-9 px-4 rounded-xl border border-dark-200 bg-white text-dark-600 text-sm font-semibold hover:bg-dark-50">Cancel</button>
                <button onClick={handleCompensationSave} disabled={!compensationReason.trim() || !editableMonths.length} className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-court-600">Save Revision</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}