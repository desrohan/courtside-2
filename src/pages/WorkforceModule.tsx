import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileDown,
  Filter,
  UserCircle,
  History,
  PenLine,
  Plus,
  Search,
  ShieldCheck,
  ShieldX,
  TrendingUp,
  X,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  computePayroll,
  getAttendanceRequests,
  getCompensationHistory,
  getDailyAttendance,
  getMonthlyAttendance,
  getStaffUsers,
  getUserPayslips,
  workforceReferenceMonth,
  type AttendanceRequest,
  type AttendanceRequestStatus,
  type AttendanceStatus,
  type Payslip,
} from '@/data/workforce';
import { designations } from '@/data/settings';
import { currentUser, type User } from '@/data/users';

type WorkforceTab = 'attendance' | 'payroll';
type AttendanceView = 'day' | 'month' | 'requests';
type PayrollView = 'register' | 'compensation' | 'payslips';

const attendanceStatusMeta: Record<AttendanceStatus, { label: string; short: string; pillClass: string; cellClass: string; dotClass: string }> = {
  present: {
    label: 'Present',
    short: 'P',
    pillClass: 'bg-emerald-50 text-emerald-700',
    cellClass: 'bg-emerald-400 text-white',
    dotClass: 'bg-emerald-500',
  },
  absent: {
    label: 'Absent',
    short: 'A',
    pillClass: 'bg-indigo-50 text-indigo-700',
    cellClass: 'bg-indigo-200 text-indigo-800',
    dotClass: 'bg-indigo-400',
  },
  leave: {
    label: 'Leave',
    short: 'L',
    pillClass: 'bg-dark-100 text-dark-600',
    cellClass: 'bg-dark-400 text-white',
    dotClass: 'bg-dark-400',
  },
  half_day: {
    label: 'Half Day',
    short: 'H',
    pillClass: 'bg-amber-50 text-amber-700',
    cellClass: 'bg-amber-300 text-amber-950',
    dotClass: 'bg-amber-400',
  },
  holiday: {
    label: 'Holiday',
    short: 'O',
    pillClass: 'bg-sky-50 text-sky-700',
    cellClass: 'bg-sky-100 text-sky-700',
    dotClass: 'bg-sky-400',
  },
  week_off: {
    label: 'Week Off',
    short: '',
    pillClass: 'bg-white text-dark-500 border border-dark-100',
    cellClass: 'bg-white text-dark-300',
    dotClass: 'bg-dark-200',
  },
};

const roleGradients: Record<string, string> = {
  admin: 'from-court-500 to-court-700',
  coach: 'from-purple-500 to-purple-700',
  medical: 'from-red-400 to-red-500',
  staff: 'from-dark-500 to-dark-700',
};

const paymentStatusClass: Record<'paid' | 'pending' | 'processing', string> = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-sky-50 text-sky-700',
};

const dailySummaryOrder: AttendanceStatus[] = ['present', 'half_day', 'leave', 'absent'];
const referenceDate = '2026-04-24';

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateValue: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(`${dateValue}T00:00:00`));
}

function formatMonthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatHours(value?: number) {
  if (value === undefined) return '0.0h';
  return `${value.toFixed(1)}h`;
}

export default function WorkforceModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organizationId = '' } = useParams();
  const [attendanceView, setAttendanceView] = useState<AttendanceView>('day');
  const [selectedDate, setSelectedDate] = useState(referenceDate);
  const [visibleMonth, setVisibleMonth] = useState(workforceReferenceMonth.month);
  const [visibleYear, setVisibleYear] = useState(workforceReferenceMonth.year);
  const [payrollView, setPayrollView] = useState<PayrollView>('register');
  const [selectedCompUser, setSelectedCompUser] = useState<User | null>(null);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [selectedPayslipUser, setSelectedPayslipUser] = useState<User | null>(null);
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  const [validationStates, setValidationStates] = useState<Record<string, 'validated' | 'invalidated'>>({});

  useEffect(() => {
    if (location.pathname.endsWith('/workforce')) {
      navigate(`/o/${organizationId}/workforce/attendance`, { replace: true });
    }
  }, [location.pathname, navigate, organizationId]);

  const activeTab: WorkforceTab = location.pathname.includes('/workforce/payroll') ? 'payroll' : 'attendance';

  const staffUsers = useMemo(() => getStaffUsers(), []);
  const dailyRows = useMemo(() => getDailyAttendance(selectedDate), [selectedDate]);
  const monthlyRows = useMemo(() => getMonthlyAttendance(visibleMonth, visibleYear), [visibleMonth, visibleYear]);
  const payrollRows = useMemo(() => computePayroll(visibleMonth, visibleYear), [visibleMonth, visibleYear]);
  const attendanceRequestRows = useMemo(() => getAttendanceRequests(), []);

  const dailySummary = useMemo(() => {
    return dailyRows.reduce<Record<AttendanceStatus, number>>((accumulator, row) => {
      const status = row.record?.status ?? 'week_off';
      accumulator[status] += 1;
      return accumulator;
    }, {
      present: 0,
      absent: 0,
      leave: 0,
      half_day: 0,
      holiday: 0,
      week_off: 0,
    });
  }, [dailyRows]);

  const monthlyDisplayRows = useMemo(() => {
    return monthlyRows.map(row => ({
      ...row,
      recordMap: new Map(row.records.map(record => [record.date, record])),
    }));
  }, [monthlyRows]);

  const monthlyRowByUserId = useMemo(() => new Map(monthlyRows.map(row => [row.user.id, row])), [monthlyRows]);

  const payrollDisplayRows = useMemo(() => {
    return payrollRows.map(entry => ({
      ...entry,
      user: monthlyRowByUserId.get(entry.userId)?.user,
    }));
  }, [monthlyRowByUserId, payrollRows]);

  const payrollSummary = useMemo(() => {
    const totals = payrollRows.reduce((accumulator, entry) => {
      accumulator.totalPayroll += entry.netPay;
      accumulator.totalGross += entry.grossPay;
      accumulator.totalOvertimeCost += entry.payType === 'hourly'
        ? (entry.grossPay - (entry.hoursWorked - entry.overtimeHours) * entry.rate)
        : entry.overtimeHours * (entry.rate / 160);
      accumulator.highestPay = Math.max(accumulator.highestPay, entry.netPay);
      return accumulator;
    }, {
      totalPayroll: 0,
      totalGross: 0,
      totalOvertimeCost: 0,
      highestPay: 0,
    });

    return {
      ...totals,
      averagePay: payrollRows.length ? totals.totalPayroll / payrollRows.length : 0,
    };
  }, [payrollRows]);

  const monthDays = useMemo(() => {
    const count = new Date(visibleYear, visibleMonth, 0).getDate();
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [visibleMonth, visibleYear]);

  const switchTab = (tab: WorkforceTab) => {
    navigate(`/o/${organizationId}/workforce/${tab}`);
  };

  const openUserProfile = (userId: string) => {
    navigate(`/o/${organizationId}/user?id=${userId}&tab=attendance`);
  };

  const moveDate = (direction: number) => {
    const current = new Date(`${selectedDate}T00:00:00`);
    current.setDate(current.getDate() + direction);
    const nextDate = formatIsoDate(current);
    setSelectedDate(nextDate);
    setVisibleMonth(current.getMonth() + 1);
    setVisibleYear(current.getFullYear());
  };

  const moveMonth = (direction: number) => {
    const next = new Date(visibleYear, visibleMonth - 1 + direction, 1);
    setVisibleMonth(next.getMonth() + 1);
    setVisibleYear(next.getFullYear());
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-dark-900">Attendance and payroll</h1>
          <p className="text-xs text-dark-400 mt-0.5">Staff attendance rolls up into monthly payroll</p>
        </div>

        {/* <div className="flex gap-1 bg-dark-100/60 rounded-xl p-0.5">
          {([
            { key: 'attendance' as WorkforceTab, label: 'Attendance' },
            { key: 'payroll' as WorkforceTab, label: 'Payroll' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div> */}
      </div>

      {activeTab === 'attendance' ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {attendanceView === 'day' && (
                <>
                  <div className="flex items-center gap-1 bg-dark-50 rounded-lg p-0.5">
                    <button onClick={() => moveDate(-1)} className="flex h-7 w-7 items-center justify-center rounded-md text-dark-500 transition-colors hover:bg-white hover:text-dark-800">
                      <ChevronLeft size={14} />
                    </button>
                    <div className="min-w-[180px] px-1.5 text-center">
                      <p className="text-xs font-semibold text-dark-900">{formatDateLabel(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <button onClick={() => moveDate(1)} className="flex h-7 w-7 items-center justify-center rounded-md text-dark-500 transition-colors hover:bg-white hover:text-dark-800">
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <button onClick={() => setSelectedDate(referenceDate)} className="h-7 rounded-lg border border-dark-200 bg-white px-3 text-xs font-semibold text-dark-700 transition-colors hover:border-dark-300 hover:bg-dark-50">
                    Today
                  </button>
                </>
              )}

              {attendanceView === 'month' && (
                <>
                  <div className="flex items-center gap-1 bg-dark-50 rounded-lg p-0.5">
                    <button onClick={() => moveMonth(-1)} className="flex h-7 w-7 items-center justify-center rounded-md text-dark-500 transition-colors hover:bg-white hover:text-dark-800">
                      <ChevronLeft size={14} />
                    </button>
                    <div className="min-w-[120px] px-1.5 text-center text-xs font-semibold text-dark-900">{formatMonthLabel(visibleMonth, visibleYear)}</div>
                    <button onClick={() => moveMonth(1)} className="flex h-7 w-7 items-center justify-center rounded-md text-dark-500 transition-colors hover:bg-white hover:text-dark-800">
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <button className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-dark-200 bg-white px-3 text-xs font-semibold text-dark-700 transition-colors hover:border-dark-300 hover:bg-dark-50">
                    <Filter size={12} /> Filter
                  </button>
                  <button className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-dark-800 px-3 text-xs font-semibold text-white transition-colors hover:bg-dark-900">
                    <Download size={12} /> Export
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5">
                {([
                  { key: 'day' as AttendanceView, label: 'Day' },
                  { key: 'month' as AttendanceView, label: 'Month' },
                  { key: 'requests' as AttendanceView, label: 'Requests' },
                ]).map(view => (
                  <button
                    key={view.key}
                    onClick={() => setAttendanceView(view.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      attendanceView === view.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
                    }`}
                  >
                    {view.key === 'requests' ? (
                      <span className="inline-flex items-center">
                        {view.label}
                        {attendanceRequestRows.filter(r => r.status === 'pending').length > 0 && (
                          <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                            {attendanceRequestRows.filter(r => r.status === 'pending').length}
                          </span>
                        )}
                      </span>
                    ) : view.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowRequestDrawer(true)}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-court-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-court-600"
              >
                <Plus size={12} /> Attendance request
              </button>
            </div>
          </div>

          {attendanceView !== 'requests' && (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {dailySummaryOrder.map(status => (
              <div key={status} className="rounded-xl border border-dark-100 bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">{attendanceStatusMeta[status].label}</p>
                    <p className="mt-1 text-lg font-bold text-dark-900">{dailySummary[status]}</p>
                  </div>
                  <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-bold ${attendanceStatusMeta[status].pillClass}`}>
                    {attendanceStatusMeta[status].short || 'Off'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}

          {attendanceView === 'day' && (
            <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
              <div className="flex items-center justify-between border-b border-dark-100 bg-dark-50/60 px-4 py-2.5">
                <p className="text-xs font-bold text-dark-700">Daily attendance register</p>
                <span className="text-[10px] font-semibold text-dark-400">{formatDateLabel(selectedDate, { month: 'short', day: 'numeric' })}</span>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="bg-dark-50/40">
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Employee</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Check-In</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Check-Out</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Hours</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Overtime</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                    <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-dark-400">Validate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {dailyRows.map(({ user, designation, record }) => {
                    const status = record?.status ?? 'week_off';
                    const meta = attendanceStatusMeta[status];
                    const vState = validationStates[`${user.id}-${selectedDate}`];

                    return (
                      <tr key={user.id} className="cursor-pointer transition-colors hover:bg-dark-50/30" onClick={() => openUserProfile(user.id)}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white ${roleGradients[user.role] ?? roleGradients.staff}`}>
                              {user.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-dark-900">{user.firstName} {user.lastName}</p>
                              <p className="text-[10px] text-dark-500">{designation?.name ?? user.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-dark-700">{record?.checkIn ?? 'Not clocked'}</td>
                        <td className="px-3 py-2.5 text-xs text-dark-700">{record?.checkOut ?? 'Not clocked'}</td>
                        <td className="px-3 py-2.5 text-xs font-semibold text-dark-900">{record?.hoursWorked ? formatHours(record.hoursWorked) : '0.0h'}</td>
                        <td className="px-3 py-2.5 text-xs text-dark-600">{record?.overtimeHours ? formatHours(record.overtimeHours) : '0.0h'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${meta.pillClass}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {vState === 'validated' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <ShieldCheck size={11} /> Validated
                              </span>
                            ) : vState === 'invalidated' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                <ShieldX size={11} /> Invalidated
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => setValidationStates(prev => ({ ...prev, [`${user.id}-${selectedDate}`]: 'validated' }))}
                                  className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50"
                                  title="Validate"
                                >
                                  <ShieldCheck size={14} />
                                </button>
                                <button
                                  onClick={() => setValidationStates(prev => ({ ...prev, [`${user.id}-${selectedDate}`]: 'invalidated' }))}
                                  className="flex h-6 w-6 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50"
                                  title="Invalidate"
                                >
                                  <ShieldX size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {attendanceView === 'month' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dark-100 bg-white px-3 py-2">
                <div className="flex flex-wrap items-center gap-3">
                  {Object.entries(attendanceStatusMeta)
                    .filter(([key]) => key !== 'holiday')
                    .map(([key, meta]) => (
                      <div key={key} className="inline-flex items-center gap-1.5 text-xs text-dark-600">
                        <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                        {meta.label}
                      </div>
                    ))}
                </div>
              </div>

              <div className="overflow-auto rounded-xl border border-dark-100 bg-white">
                <table className="min-w-max border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-30 min-w-[180px] border-b border-r border-dark-100 bg-dark-50 px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-500">
                        Employee
                      </th>
                      {monthDays.map(day => {
                        const weekDay = new Date(visibleYear, visibleMonth - 1, day).getDay();
                        const weekend = weekDay === 0 || weekDay === 6;

                        return (
                          <th
                            key={day}
                            className={`sticky top-0 z-20 h-9 min-w-[36px] border-b border-r border-dark-100 px-0 text-center text-xs font-semibold ${weekend ? 'bg-dark-100/80 text-dark-600' : 'bg-dark-50 text-dark-700'}`}
                          >
                            {day}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDisplayRows.map(({ user, designation, recordMap }) => (
                      <tr key={user.id}>
                        <td className="sticky left-0 z-10 border-b border-r border-dark-100 bg-white px-4 py-2 cursor-pointer hover:bg-dark-50/40" onClick={() => openUserProfile(user.id)}>
                          <div className="flex items-center gap-2">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-[9px] font-bold text-white ${roleGradients[user.role] ?? roleGradients.staff}`}>
                              {user.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-dark-900">{user.firstName} {user.lastName}</p>
                              <p className="text-[10px] text-dark-500">{designation?.name ?? user.designation}</p>
                            </div>
                          </div>
                        </td>
                        {monthDays.map(day => {
                          const key = `${visibleYear}-${String(visibleMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const status = recordMap.get(key)?.status ?? 'week_off';
                          const meta = attendanceStatusMeta[status];
                          const weekDay = new Date(visibleYear, visibleMonth - 1, day).getDay();
                          const weekend = weekDay === 0 || weekDay === 6;

                          return (
                            <td
                              key={key}
                              className={`h-9 min-w-[36px] border-b border-r border-dark-100 px-0 text-center text-[10px] font-bold ${weekend && status === 'week_off' ? 'bg-dark-50 text-dark-300' : meta.cellClass}`}
                            >
                              {meta.short}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {attendanceView === 'requests' && (
            <AttendanceRequestsView requests={attendanceRequestRows} />
          )}

          {/* Attendance Request Drawer */}
          <AttendanceRequestDrawer
            open={showRequestDrawer}
            onClose={() => setShowRequestDrawer(false)}
          />
        </section>
      ) : (
        <section className="space-y-3">
          {/* Payroll sub-tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5">
              {([
                { key: 'register' as PayrollView, label: 'Monthly Register' },
                { key: 'compensation' as PayrollView, label: 'Compensation' },
                { key: 'payslips' as PayrollView, label: 'Payslips' },
              ]).map(view => (
                <button
                  key={view.key}
                  onClick={() => setPayrollView(view.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    payrollView === view.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {payrollView === 'register' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-dark-50 rounded-lg p-0.5">
                  <button onClick={() => moveMonth(-1)} className="flex h-7 w-7 items-center justify-center rounded-md text-dark-500 transition-colors hover:bg-white hover:text-dark-800">
                    <ChevronLeft size={14} />
                  </button>
                  <div className="min-w-[120px] px-1.5 text-center text-xs font-semibold text-dark-900">{formatMonthLabel(visibleMonth, visibleYear)}</div>
                  <button onClick={() => moveMonth(1)} className="flex h-7 w-7 items-center justify-center rounded-md text-dark-500 transition-colors hover:bg-white hover:text-dark-800">
                    <ChevronRight size={14} />
                  </button>
                </div>
                <button className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-red-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-600">
                  <Download size={12} /> Export payroll
                </button>
              </div>
            )}
          </div>

          {payrollView === 'register' && (
            <>
              <div className="grid gap-2 xl:grid-cols-4 md:grid-cols-2">
                {[
                  { label: 'Total Payroll', value: formatCurrency(payrollSummary.totalPayroll) },
                  { label: 'Average Pay', value: formatCurrency(payrollSummary.averagePay) },
                  { label: 'Highest Pay', value: formatCurrency(payrollSummary.highestPay) },
                  { label: 'Overtime Cost', value: formatCurrency(payrollSummary.totalOvertimeCost) },
                ].map(card => (
                  <div key={card.label} className="rounded-xl border border-dark-100 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">{card.label}</p>
                    <p className="mt-1 text-lg font-bold text-dark-900">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
                <div className="flex items-center justify-between border-b border-dark-100 bg-dark-50/60 px-4 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-dark-700">Monthly payroll register</p>
                    <p className="text-[10px] text-dark-400">Attendance hours, payroll type and monthly payout for each staff member.</p>
                  </div>
                  <span className="text-[10px] font-semibold text-dark-400">{formatMonthLabel(visibleMonth, visibleYear)}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-dark-50/40">
                        <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Employee</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Pay Type</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Base Rate</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Days / Hours</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Overtime</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Gross Pay</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Deductions</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-100">
                      {payrollDisplayRows.map(entry => (
                        <tr key={entry.userId} className="transition-colors hover:bg-dark-50/30">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white ${roleGradients[entry.user?.role ?? 'staff'] ?? roleGradients.staff}`}>
                                {entry.user?.avatar ?? '--'}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-dark-900">{entry.user?.firstName} {entry.user?.lastName}</p>
                                <p className="text-[10px] text-dark-500">{entry.designation}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="space-y-1">
                              <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${entry.payType === 'hourly' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {entry.payType === 'hourly' ? 'Hourly' : 'Salaried'}
                              </span>
                              <div>
                                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${paymentStatusClass[entry.paymentStatus]}`}>
                                  {entry.paymentStatus}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-dark-900">{formatCurrency(entry.rate, entry.currency)}</td>
                          <td className="px-3 py-2.5 text-xs text-dark-700">
                            <p>{entry.daysWorked.toFixed(1)} days</p>
                            <p className="text-[10px] text-dark-500">{formatHours(entry.hoursWorked)}</p>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-dark-700">{formatHours(entry.overtimeHours)}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-dark-900">{formatCurrency(entry.grossPay, entry.currency)}</td>
                          <td className="px-3 py-2.5 text-xs text-dark-600">
                            <div className="space-y-0.5">
                              {entry.deductions.map(deduction => (
                                <p key={deduction.name} className="text-[10px] text-dark-500">{deduction.name}: {formatCurrency(deduction.amount, entry.currency)}</p>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-xs font-bold text-dark-900">{formatCurrency(entry.netPay, entry.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-dark-100 bg-dark-50/60">
                        <td className="px-4 py-2.5 text-xs font-semibold text-dark-900">Monthly totals</td>
                        <td className="px-3 py-2.5" colSpan={4} />
                        <td className="px-3 py-2.5 text-xs font-semibold text-dark-900">{formatCurrency(payrollRows.reduce((sum, entry) => sum + entry.grossPay, 0))}</td>
                        <td className="px-3 py-2.5 text-xs text-dark-600">{formatCurrency(payrollRows.reduce((sum, entry) => sum + entry.deductions.reduce((total, deduction) => total + deduction.amount, 0), 0))}</td>
                        <td className="px-3 py-2.5 text-xs font-bold text-dark-900">{formatCurrency(payrollSummary.totalPayroll)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {payrollView === 'compensation' && (
            <CompensationManagement
              staffUsers={staffUsers}
              selectedUser={selectedCompUser}
              onSelectUser={setSelectedCompUser}
              onRevise={() => setShowReviseModal(true)}
            />
          )}

          {payrollView === 'payslips' && (
            <PayslipManager
              staffUsers={staffUsers}
              selectedUser={selectedPayslipUser}
              onSelectUser={setSelectedPayslipUser}
            />
          )}
        </section>
      )}

      {/* Revise compensation modal */}
      <AnimatePresence>
        {showReviseModal && selectedCompUser && (
          <ReviseCompensationModal
            user={selectedCompUser}
            onClose={() => setShowReviseModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Compensation Management sub-view
   ═══════════════════════════════════════════════════════ */
function CompensationManagement({ staffUsers, selectedUser, onSelectUser, onRevise }: {
  staffUsers: User[];
  selectedUser: User | null;
  onSelectUser: (u: User | null) => void;
  onRevise: () => void;
}) {
  const [search, setSearch] = useState('');
  const [payTypeFilter, setPayTypeFilter] = useState<'all' | 'salaried' | 'hourly'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const enrichedUsers = useMemo(() => {
    return staffUsers.map(user => {
      const des = designations.find(d => d.name === user.designation);
      const history = getCompensationHistory(user.id);
      const currentComp = history[0];
      return { user, designation: des, currentComp, historyCount: history.length };
    });
  }, [staffUsers]);

  const roles = useMemo(() => {
    const set = new Set(staffUsers.map(u => u.role));
    return Array.from(set);
  }, [staffUsers]);

  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter(({ user, designation: des }) => {
      const matchesSearch = search === '' ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        user.designation.toLowerCase().includes(search.toLowerCase());
      const matchesPayType = payTypeFilter === 'all' || des?.payType === payTypeFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesPayType && matchesRole;
    });
  }, [enrichedUsers, search, payTypeFilter, roleFilter]);

  return (
    <div className="space-y-3">
      {/* Search and filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search staff..."
            className="h-8 w-full rounded-lg border border-dark-200 bg-white pl-8 pr-3 text-xs text-dark-900 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-court-500/20"
          />
        </div>
        <select
          value={payTypeFilter}
          onChange={e => setPayTypeFilter(e.target.value as 'all' | 'salaried' | 'hourly')}
          className="h-8 rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-700 focus:outline-none focus:ring-2 focus:ring-court-500/20"
        >
          <option value="all">All pay types</option>
          <option value="salaried">Salaried</option>
          <option value="hourly">Hourly</option>
        </select>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="h-8 rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-700 focus:outline-none focus:ring-2 focus:ring-court-500/20"
        >
          <option value="all">All roles</option>
          {roles.map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <span className="text-[10px] text-dark-400">{filteredUsers.length} of {staffUsers.length} staff</span>
      </div>

      {/* Full-width table */}
      <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-50/60">
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Employee</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Role</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Pay Type</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Current Rate</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Effective From</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Last Change</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Revisions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {filteredUsers.map(({ user, designation: des, currentComp, historyCount }) => (
              <tr
                key={user.id}
                onClick={() => onSelectUser(selectedUser?.id === user.id ? null : user)}
                className={`cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-court-50' : 'hover:bg-dark-50/30'}`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white ${roleGradients[user.role] ?? roleGradients.staff}`}>
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-dark-900">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-dark-500">{user.designation}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-xs text-dark-700 capitalize">{user.role}</span>
                </td>
                <td className="px-3 py-2.5">
                  {des && des.payType !== 'none' && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${des.payType === 'hourly' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {des.payType === 'hourly' ? 'Hourly' : 'Monthly'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs font-semibold text-dark-900">
                  {des ? formatCurrency(des.rate, des.currency) : '—'}
                  {des && <span className="ml-0.5 text-[10px] font-normal text-dark-500">/ {des.payType === 'hourly' ? 'hr' : 'mo'}</span>}
                </td>
                <td className="px-3 py-2.5 text-xs text-dark-600">
                  {currentComp ? new Date(currentComp.effectiveFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="px-3 py-2.5 text-[10px] text-dark-500">
                  {currentComp?.reason ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-xs text-dark-600">{historyCount}</td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-xs text-dark-400">No staff members match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Compensation detail drawer */}
      <CompensationDrawer
        user={selectedUser}
        onClose={() => onSelectUser(null)}
        onRevise={onRevise}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Compensation Detail Drawer
   ═══════════════════════════════════════════════════════ */
function CompensationDrawer({ user, onClose, onRevise }: {
  user: User | null;
  onClose: () => void;
  onRevise: () => void;
}) {
  const history = useMemo(() => user ? getCompensationHistory(user.id) : [], [user]);
  const designation = useMemo(() => user ? designations.find(d => d.name === user.designation) : null, [user]);

  return (
    <AnimatePresence>
      {user && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-drawer z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white ${roleGradients[user.role] ?? roleGradients.staff}`}>
                  {user.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-dark-900">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] text-dark-500">{user.designation}</p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-dark-50 hover:text-dark-700">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Current compensation */}
              {designation && (
                <div className="rounded-xl border border-dark-100 bg-dark-50/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Current compensation</p>
                      <p className="mt-1 text-xl font-bold text-dark-900">
                        {formatCurrency(designation.rate, designation.currency)}
                        <span className="ml-1 text-xs font-medium text-dark-500">/ {designation.payType === 'hourly' ? 'hour' : 'month'}</span>
                      </p>
                    </div>
                    <button
                      onClick={onRevise}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-court-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-court-600"
                    >
                      <PenLine size={12} /> Revise
                    </button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${designation.payType === 'hourly' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {designation.payType === 'hourly' ? 'Hourly' : 'Monthly salaried'}
                    </span>
                    {designation.payType === 'hourly' && (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        OT: {(designation.overtimeMultiplier ?? 1).toFixed(2)}x
                      </span>
                    )}
                    <span className="text-[10px] text-dark-500">{user.designation} under {designation.roleName}</span>
                  </div>
                </div>
              )}

              {/* Compensation history */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <History size={12} className="text-dark-400" />
                  <p className="text-xs font-bold text-dark-700">Compensation history</p>
                </div>
                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history.map((change, idx) => (
                      <div key={change.id} className={`rounded-lg border border-dark-100 px-3 py-2.5 ${idx === 0 ? 'bg-court-50/30 border-court-100' : 'bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${idx === 0 ? 'bg-court-500 text-white' : 'bg-dark-100 text-dark-500'}`}>
                            {idx === 0 ? '✓' : idx + 1}
                          </div>
                          <p className="text-xs font-semibold text-dark-900">
                            {formatCurrency(change.rate, change.currency)} / {change.payType === 'hourly' ? 'hr' : 'mo'}
                          </p>
                          {idx === 0 && <span className="rounded-md bg-court-50 px-1.5 py-0.5 text-[9px] font-semibold text-court-700">Current</span>}
                        </div>
                        <p className="mt-1 text-[10px] text-dark-600">{change.reason}</p>
                        <p className="mt-0.5 text-[10px] text-dark-400">
                          Effective {new Date(change.effectiveFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' '}&middot; {change.changedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-dark-200 px-3 py-6 text-center text-xs text-dark-400">
                    No compensation history recorded.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   Revise Compensation Modal
   ═══════════════════════════════════════════════════════ */
function ReviseCompensationModal({ user, onClose }: { user: User; onClose: () => void }) {
  const designation = designations.find(d => d.name === user.designation);
  const [payType, setPayType] = useState(designation?.payType ?? 'salaried');
  const [rate, setRate] = useState(String(designation?.rate ?? ''));
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(String(designation?.overtimeMultiplier ?? 1));
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-md rounded-xl border border-dark-100 bg-white shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-dark-900">Revise compensation</h2>
            <p className="text-[10px] text-dark-500">{user.firstName} {user.lastName} &middot; {user.designation}</p>
          </div>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-md text-dark-400 transition-colors hover:bg-dark-50 hover:text-dark-700">
            <X size={14} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Pay type</label>
            <select
              value={payType}
              onChange={e => setPayType(e.target.value as 'hourly' | 'salaried' | 'none')}
              className="h-8 w-full rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-900 focus:outline-none focus:ring-2 focus:ring-court-500/20"
            >
              <option value="hourly">Hourly</option>
              <option value="salaried">Monthly salaried</option>
              <option value="none">Excluded</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">New rate (INR)</label>
              <input
                type="number"
                value={rate}
                onChange={e => setRate(e.target.value)}
                placeholder={designation?.payType === 'hourly' ? 'Per hour' : 'Per month'}
                className="h-8 w-full rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-900 focus:outline-none focus:ring-2 focus:ring-court-500/20"
              />
            </div>
            {payType === 'hourly' && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Overtime multiplier</label>
                <input
                  type="number"
                  step="0.25"
                  value={overtimeMultiplier}
                  onChange={e => setOvertimeMultiplier(e.target.value)}
                  className="h-8 w-full rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-900 focus:outline-none focus:ring-2 focus:ring-court-500/20"
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Effective from</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={e => setEffectiveFrom(e.target.value)}
              className="h-8 w-full rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-900 focus:outline-none focus:ring-2 focus:ring-court-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Reason for change</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="Annual appraisal, promotion, market adjustment..."
              className="w-full rounded-lg border border-dark-200 bg-white px-2.5 py-2 text-xs text-dark-900 focus:outline-none focus:ring-2 focus:ring-court-500/20 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-dark-100 px-4 py-3">
          <button onClick={onClose} className="h-7 rounded-lg border border-dark-200 px-3 text-xs font-semibold text-dark-700 transition-colors hover:bg-dark-50">
            Cancel
          </button>
          <button
            onClick={onClose}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-court-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-court-600"
          >
            <TrendingUp size={12} /> Save revision
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Payslip Manager sub-view
   ═══════════════════════════════════════════════════════ */
type PayslipTab = 'my' | 'all';

type PayslipRow = {
  user: User;
  slips: Payslip[];
  latestSlip: Payslip | null;
  totalSlips: number;
};

function PayslipManager({ staffUsers, selectedUser, onSelectUser }: {
  staffUsers: User[];
  selectedUser: User | null;
  onSelectUser: (u: User | null) => void;
}) {
  const [payslipTab, setPayslipTab] = useState<PayslipTab>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const mySlips = useMemo(() => getUserPayslips(currentUser.id), []);
  const allSlips = useMemo(() => {
    return staffUsers.flatMap(user => getUserPayslips(user.id).map(slip => ({ ...slip, user })));
  }, [staffUsers]);
  const payslipRows = useMemo<PayslipRow[]>(() => {
    return staffUsers.map(user => {
      const slips = getUserPayslips(user.id);
      return {
        user,
        slips,
        latestSlip: slips[0] ?? null,
        totalSlips: slips.length,
      };
    });
  }, [staffUsers]);
  const roles = useMemo(() => {
    const set = new Set(staffUsers.map(user => user.role));
    return Array.from(set);
  }, [staffUsers]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allSlips.forEach(slip => set.add(`${slip.year}-${slip.month}`));
    return Array.from(set)
      .map(key => {
        const [year, month] = key.split('-').map(Number);
        return { month, year, label: formatMonthLabel(month, year) };
      })
      .sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month));
  }, [allSlips]);

  const filteredMySlips = useMemo(() => {
    if (monthFilter === 'all') return mySlips;
    const [filteredYear, filteredMonth] = monthFilter.split('-').map(Number);
    return mySlips.filter(slip => slip.month === filteredMonth && slip.year === filteredYear);
  }, [mySlips, monthFilter]);

  const filteredPayslipRows = useMemo(() => {
    return payslipRows.filter(({ user, slips }) => {
      const matchesSearch = searchQuery.trim() === '' ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.designation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesMonth = monthFilter === 'all' || slips.some(slip => `${slip.year}-${slip.month}` === monthFilter);
      return matchesSearch && matchesRole && matchesMonth;
    });
  }, [monthFilter, payslipRows, roleFilter, searchQuery]);

  const drawerSlips = useMemo(() => {
    if (!selectedUser) return [];
    const slips = getUserPayslips(selectedUser.id);
    if (monthFilter === 'all') return slips;
    return slips.filter(slip => `${slip.year}-${slip.month}` === monthFilter);
  }, [monthFilter, selectedUser]);

  useEffect(() => {
    if (payslipTab !== 'all' || !selectedUser) return;
    const rowStillVisible = filteredPayslipRows.some(row => row.user.id === selectedUser.id);
    if (!rowStillVisible) onSelectUser(null);
  }, [filteredPayslipRows, onSelectUser, payslipTab, selectedUser]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5">
            {([
              { key: 'my' as PayslipTab, label: 'My payslips', icon: UserCircle },
              { key: 'all' as PayslipTab, label: 'All payslips', icon: FileDown },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => { setPayslipTab(tab.key); if (tab.key === 'my') onSelectUser(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  payslipTab === tab.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="h-7 rounded-lg border border-dark-200 bg-white px-2 text-xs font-semibold text-dark-700 transition-colors hover:border-dark-300 focus:outline-none focus:ring-1 focus:ring-court-300"
          >
            <option value="all">All months</option>
            {availableMonths.map(m => (
              <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{m.label}</option>
            ))}
          </select>

          {payslipTab === 'all' && (
            <button className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-court-500 px-3 text-[10px] font-semibold text-white transition-colors hover:bg-court-600">
              <Download size={11} /> Download all
            </button>
          )}
        </div>
      </div>

      {payslipTab === 'my' && (
        <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
          <div className="flex items-center justify-between border-b border-dark-100 bg-dark-50/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-[9px] font-bold text-white ${roleGradients[currentUser.role] ?? roleGradients.staff}`}>
                {currentUser.avatar}
              </div>
              <div>
                <p className="text-xs font-bold text-dark-700">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-[10px] text-dark-400">{currentUser.designation}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-dark-400">{filteredMySlips.length} payslip{filteredMySlips.length !== 1 ? 's' : ''}</span>
          </div>
          {filteredMySlips.length > 0 ? (
            <div className="divide-y divide-dark-100">
              {filteredMySlips.map(slip => (
                <div key={slip.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <FileDown size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-dark-900">{formatMonthLabel(slip.month, slip.year)}</p>
                      <p className="text-[10px] text-dark-500">Generated {new Date(slip.generatedAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <button className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-dark-200 bg-white px-2.5 text-[10px] font-semibold text-dark-700 transition-colors hover:border-dark-300 hover:bg-dark-50">
                    <Download size={12} /> Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-xs text-dark-400">No payslips found for the selected period.</div>
          )}
        </div>
      )}

      {payslipTab === 'all' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="h-8 w-full rounded-lg border border-dark-200 bg-white pl-8 pr-3 text-xs text-dark-900 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-court-500/20"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="h-8 rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-700 focus:outline-none focus:ring-2 focus:ring-court-500/20"
            >
              <option value="all">All roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
              ))}
            </select>
            <span className="text-[10px] text-dark-400">{filteredPayslipRows.length} of {staffUsers.length} staff</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-50/60">
                  <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Employee</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Role</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Latest payslip</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Generated on</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Payslips</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {filteredPayslipRows.map(({ user, latestSlip, totalSlips }) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <tr
                      key={user.id}
                      onClick={() => onSelectUser(isSelected ? null : user)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-court-50' : 'hover:bg-dark-50/30'}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white ${roleGradients[user.role] ?? roleGradients.staff}`}>
                            {user.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-dark-900">{user.firstName} {user.lastName}</p>
                            <p className="text-[10px] text-dark-500">{user.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs text-dark-700 capitalize">{user.role}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-dark-900">
                        {latestSlip ? formatMonthLabel(latestSlip.month, latestSlip.year) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-dark-600">
                        {latestSlip
                          ? new Date(latestSlip.generatedAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-dark-600">{totalSlips}</td>
                      <td className="px-3 py-2.5 text-[10px] text-dark-500">
                        {totalSlips > 0 ? `${totalSlips} month${totalSlips === 1 ? '' : 's'} available` : 'No payslips'}
                      </td>
                    </tr>
                  );
                })}
                {filteredPayslipRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-xs text-dark-400">No staff members match your payslip filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PayslipDrawer
            user={selectedUser}
            slips={drawerSlips}
            monthFilter={monthFilter}
            onClose={() => onSelectUser(null)}
          />
        </>
      )}
    </div>
  );
}

function PayslipDrawer({ user, slips, monthFilter, onClose }: {
  user: User | null;
  slips: Payslip[];
  monthFilter: string;
  onClose: () => void;
}) {
  const latestSlip = slips[0] ?? null;

  return (
    <AnimatePresence>
      {user && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-white shadow-drawer"
          >
            <div className="shrink-0 border-b border-dark-100 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white ${roleGradients[user.role] ?? roleGradients.staff}`}>
                    {user.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-dark-900">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-dark-500">{user.designation}</p>
                  </div>
                </div>
                <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-dark-50 hover:text-dark-700">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-3 rounded-xl border border-dark-100 bg-dark-50/40 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Payslip history</p>
                    <p className="mt-1 text-sm font-semibold text-dark-900">
                      {latestSlip ? formatMonthLabel(latestSlip.month, latestSlip.year) : 'No payslips available'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-dark-500">
                      {monthFilter === 'all'
                        ? `${slips.length} payslip${slips.length === 1 ? '' : 's'} available`
                        : `Filtered to ${formatMonthLabel(Number(monthFilter.split('-')[1]), Number(monthFilter.split('-')[0]))}`}
                    </p>
                  </div>
                  {latestSlip && (
                    <button className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-court-500 px-3 text-[10px] font-semibold text-white transition-colors hover:bg-court-600">
                      <Download size={11} /> Latest
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {slips.length > 0 ? (
                slips.map((slip, index) => (
                  <div key={slip.id} className={`rounded-xl border px-3 py-3 ${index === 0 ? 'border-court-100 bg-court-50/30' : 'border-dark-100 bg-white'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${index === 0 ? 'bg-court-500 text-white' : 'bg-red-50 text-red-600'}`}>
                          <FileDown size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-dark-900">{formatMonthLabel(slip.month, slip.year)}</p>
                          <p className="text-[10px] text-dark-500">
                            Generated {new Date(slip.generatedAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <button className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-dark-200 bg-white px-2.5 text-[10px] font-semibold text-dark-700 transition-colors hover:border-dark-300 hover:bg-dark-50">
                        <Download size={12} /> Download
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-dark-500">
                      <span>{slip.fileName}</span>
                      {index === 0 && <span className="rounded-md bg-court-50 px-1.5 py-0.5 font-semibold text-court-700">Latest</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-dark-200 px-4 py-8 text-center text-xs text-dark-400">
                  No payslips found for this selection.
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   Attendance Requests View
   ═══════════════════════════════════════════════════════ */
const requestStatusMeta: Record<AttendanceRequestStatus, { label: string; pillClass: string }> = {
  pending: { label: 'Pending', pillClass: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', pillClass: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Rejected', pillClass: 'bg-red-50 text-red-700' },
};

function AttendanceRequestsView({ requests }: { requests: (AttendanceRequest & { user: User })[] }) {
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceRequestStatus>('all');
  const [requestStates, setRequestStates] = useState<Record<string, AttendanceRequestStatus>>({});

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const currentStatus = requestStates[r.id] ?? r.status;
      return statusFilter === 'all' || currentStatus === statusFilter;
    });
  }, [requests, statusFilter, requestStates]);

  const pendingCount = requests.filter(r => (requestStates[r.id] ?? r.status) === 'pending').length;

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setRequestStates(prev => ({ ...prev, [id]: action }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | AttendanceRequestStatus)}
            className="h-7 rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-700 focus:outline-none focus:ring-2 focus:ring-court-500/20"
          >
            <option value="all">All requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          {pendingCount > 0 && (
            <span className="text-[10px] font-semibold text-amber-700">{pendingCount} pending</span>
          )}
        </div>
        <span className="text-[10px] text-dark-400">{filtered.length} requests</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-50/60">
              <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Employee</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Date</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Check-In</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Check-Out</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Hours</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Reason</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-dark-400">Status</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-dark-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {filtered.map(req => {
              const currentStatus = requestStates[req.id] ?? req.status;
              const meta = requestStatusMeta[currentStatus];
              return (
                <tr key={req.id} className="transition-colors hover:bg-dark-50/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-[10px] font-bold text-white ${roleGradients[req.user.role] ?? roleGradients.staff}`}>
                        {req.user.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-dark-900">{req.user.firstName} {req.user.lastName}</p>
                        <p className="text-[10px] text-dark-500">{req.user.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-dark-700">
                    {new Date(req.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-dark-700">{req.checkIn}</td>
                  <td className="px-3 py-2.5 text-xs text-dark-700">{req.checkOut}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-dark-900">{req.workedHours}h</td>
                  <td className="px-3 py-2.5 text-xs text-dark-600 max-w-[200px] truncate" title={req.reason}>{req.reason}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${meta.pillClass}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {currentStatus === 'pending' ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleAction(req.id, 'approved')}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50"
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'rejected')}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50"
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-center text-[10px] text-dark-400">
                        {req.reviewedBy ?? 'You'}, {req.reviewedAt ? new Date(req.reviewedAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'just now'}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-xs text-dark-400">No attendance requests match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Attendance Request Drawer
   ═══════════════════════════════════════════════════════ */
function AttendanceRequestDrawer({ open, onClose }: {
  open: boolean;
  onClose: () => void;
}) {
  const [date, setDate] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [workedHours, setWorkedHours] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onClose();
    setDate('');
    setCheckIn('');
    setCheckOut('');
    setWorkedHours('');
    setReason('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-drawer z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3 shrink-0">
              <div>
                <p className="text-sm font-bold text-dark-900">New attendance request</p>
                <p className="text-[10px] text-dark-500">Submit a request for missed or failed check-in</p>
              </div>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-dark-400 transition-colors hover:bg-dark-50 hover:text-dark-700">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-xl border border-dark-100 bg-dark-50/40 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Request for</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white ${roleGradients[currentUser.role] ?? roleGradients.staff}`}>
                    {currentUser.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-dark-900">{currentUser.firstName} {currentUser.lastName}</p>
                    <p className="text-[10px] text-dark-500">{currentUser.designation}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Attendance date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="h-8 w-full rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-900 focus:outline-none focus:ring-2 focus:ring-court-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Check-in *</label>
                  <input
                    type="time"
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                    className="h-8 w-full rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-900 focus:outline-none focus:ring-2 focus:ring-court-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Check-out</label>
                  <input
                    type="time"
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                    className="h-8 w-full rounded-lg border border-dark-200 bg-white px-2.5 text-xs text-dark-900 focus:outline-none focus:ring-2 focus:ring-court-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Worked hours *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={workedHours}
                    onChange={e => setWorkedHours(e.target.value)}
                    placeholder="e.g. 8:30"
                    className="h-8 w-full rounded-lg border border-dark-200 bg-white px-2.5 pr-8 text-xs text-dark-900 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-court-500/20"
                  />
                  <Clock size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-dark-500">Reason *</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why attendance couldn't be recorded normally..."
                  className="w-full rounded-lg border border-dark-200 bg-white px-2.5 py-2 text-xs text-dark-900 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-court-500/20 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-dark-100 px-4 py-3 shrink-0">
              <button onClick={onClose} className="h-8 rounded-lg border border-dark-200 px-4 text-xs font-semibold text-dark-700 transition-colors hover:bg-dark-50">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-court-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-court-600"
              >
                Submit request
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}