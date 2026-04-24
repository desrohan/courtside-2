import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Calendar, FileText, BarChart3, LogIn, LogOut,
  Users, User, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Check, X, AlertTriangle, Coffee, Briefcase, Timer, TrendingUp,
  Download, Eye, MoreVertical, CalendarDays, Pencil, Plus, Send,
  ShieldCheck, ShieldX, ClipboardEdit,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
  hrmsCheckIns, HRMSCheckIn, HRMSAttendanceStatus, employeeUsers,
  dailyAttendanceSummaries, DailyAttendanceSummary,
  leaveRequests, LeaveRequest, LeaveRequestStatus,
  leaveBalances, LeaveBalance,
  attendanceRequests, AttendanceRequest, AttendanceRequestStatus, AttendanceRequestWorkType,
} from '@/data/hrms';
import { currentUser, users } from '@/data/users';
import { workSchedules, leavePolicies, employeeTypeConfigs, LeaveType } from '@/data/settings';

type HRMSTab = 'my-attendance' | 'overview' | 'work-records' | 'leave' | 'reports';

const tabDefs: { key: HRMSTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { key: 'my-attendance', label: 'My Attendance', icon: <Clock size={15} /> },
  { key: 'overview', label: 'Attendance Overview', icon: <Users size={15} />, adminOnly: true },
  { key: 'work-records', label: 'Work Records', icon: <Briefcase size={15} />, adminOnly: true },
  { key: 'leave', label: 'Leave', icon: <Calendar size={15} /> },
  { key: 'reports', label: 'Reports', icon: <BarChart3 size={15} />, adminOnly: true },
];

export default function HRMSModule() {
  const [activeTab, setActiveTab] = useState<HRMSTab>('my-attendance');
  const isAdmin = currentUser.role === 'admin';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-dark-900">Attendance</h1>
          <p className="text-xs text-dark-400 mt-0.5">Workforce attendance, work records, leave, and reporting for employees and staff</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-dark-100/60 rounded-xl p-0.5 w-fit">
        {tabDefs.filter(t => !t.adminOnly || isAdmin).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'my-attendance' && <MyAttendance />}
      {activeTab === 'overview' && <AttendanceOverview />}
      {activeTab === 'work-records' && <WorkRecords />}
      {activeTab === 'leave' && <LeaveManagement />}
      {activeTab === 'reports' && <AttendanceReports />}
    </motion.div>
  );
}

// ── Helpers ──────────────────────────────────────────
const statusColors: Record<HRMSAttendanceStatus, { bg: string; text: string; label: string }> = {
  present:  { bg: 'bg-green-50',  text: 'text-green-600',  label: 'Present' },
  absent:   { bg: 'bg-red-50',    text: 'text-red-600',    label: 'Absent' },
  late:     { bg: 'bg-amber-50',  text: 'text-amber-600',  label: 'Late' },
  half_day: { bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'Half Day' },
  on_leave: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'On Leave' },
  holiday:  { bg: 'bg-dark-50',   text: 'text-dark-500',   label: 'Holiday' },
};

const leaveTypeColors: Record<LeaveType, { bg: string; text: string }> = {
  sick:   { bg: 'bg-red-50',   text: 'text-red-600' },
  casual: { bg: 'bg-amber-50', text: 'text-amber-600' },
  annual: { bg: 'bg-blue-50',  text: 'text-blue-600' },
};

function formatTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function monthKeyFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function shiftMonth(monthKey: string, diff: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const next = new Date(year, month - 1 + diff, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function weekdayFromMonthDay(monthKey: string, day: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
}

function isWeekendInMonth(monthKey: string, day: number): boolean {
  const [year, month] = monthKey.split('-').map(Number);
  const weekDay = new Date(year, month - 1, day).getDay();
  return weekDay === 0 || weekDay === 6;
}

function today(): string {
  return '2026-04-23';
}

// ── My Attendance ────────────────────────────────────
const workTypeLabels: Record<AttendanceRequestWorkType, { label: string; bg: string; text: string }> = {
  office: { label: 'Office', bg: 'bg-blue-50', text: 'text-blue-600' },
  remote: { label: 'Remote', bg: 'bg-purple-50', text: 'text-purple-600' },
  field: { label: 'Field', bg: 'bg-green-50', text: 'text-green-600' },
  on_site: { label: 'On-Site', bg: 'bg-amber-50', text: 'text-amber-600' },
};

const requestStatusColors: Record<AttendanceRequestStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-600' },
  approved: { bg: 'bg-green-50', text: 'text-green-600' },
  rejected: { bg: 'bg-red-50', text: 'text-red-600' },
};

function MyAttendance() {
  const myRecords = hrmsCheckIns.filter(r => r.userId === currentUser.id);
  const baseTodayRecord = myRecords.find(r => r.date === today());
  const [checkInTime, setCheckInTime] = useState<string | null>(baseTodayRecord?.checkInTime ?? null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(baseTodayRecord?.checkOutTime ?? null);
  const isCheckedIn = !!checkInTime && !checkOutTime;
  const isDayComplete = !!checkInTime && !!checkOutTime;
  const [elapsed, setElapsed] = useState('0h 0m');
  const [workedTotal, setWorkedTotal] = useState(baseTodayRecord?.totalHours ?? 0);
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  const [myAttendanceRequests, setMyAttendanceRequests] = useState(
    attendanceRequests.filter(r => r.userId === currentUser.id)
  );
  const [reqDate, setReqDate] = useState('');
  const [reqCheckIn, setReqCheckIn] = useState('');
  const [reqCheckOut, setReqCheckOut] = useState('');
  const [reqWorkType, setReqWorkType] = useState<AttendanceRequestWorkType>('office');
  const [reqReason, setReqReason] = useState('');
  const [historyMonth, setHistoryMonth] = useState('2026-04');

  const handleCheckIn = () => {
    setCheckInTime(new Date().toISOString());
    setCheckOutTime(null);
  };

  const handleCheckOut = () => {
    const now = new Date();
    setCheckOutTime(now.toISOString());
    if (checkInTime) {
      const diff = now.getTime() - new Date(checkInTime).getTime();
      setWorkedTotal(Math.round((diff / 3600000) * 10) / 10);
    }
  };

  const handleSubmitRequest = () => {
    if (!reqDate || !reqCheckIn || !reqReason.trim()) return;
    let workedHours = 0;
    if (reqCheckIn && reqCheckOut) {
      const [inH, inM] = reqCheckIn.split(':').map(Number);
      const [outH, outM] = reqCheckOut.split(':').map(Number);
      workedHours = Math.max(0, Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10);
    }
    const newReq: AttendanceRequest = {
      id: `ar-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userAvatar: currentUser.avatar,
      attendanceDate: reqDate,
      checkInTime: reqCheckIn,
      checkOutTime: reqCheckOut || undefined,
      workedHours,
      workType: reqWorkType,
      reason: reqReason.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    setMyAttendanceRequests(prev => [newReq, ...prev]);
    setShowRequestDrawer(false);
    setReqDate('');
    setReqCheckIn('');
    setReqCheckOut('');
    setReqWorkType('office');
    setReqReason('');
  };

  useEffect(() => {
    if (!checkInTime || checkOutTime) return;
    const tick = () => {
      const start = new Date(checkInTime).getTime();
      const now = Date.now();
      const diff = now - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [checkInTime, checkOutTime]);

  // Monthly stats
  const thisMonth = myRecords.filter(r => r.date.startsWith('2026-04'));
  const presentDays = thisMonth.filter(r => r.status === 'present').length;
  const lateDays = thisMonth.filter(r => r.status === 'late').length;
  const absentDays = thisMonth.filter(r => r.status === 'absent').length;
  const leaveDays = thisMonth.filter(r => r.status === 'on_leave').length;
  const totalHoursWorked = thisMonth.reduce((sum, r) => sum + r.totalHours, 0);
  const totalRequired = thisMonth.reduce((sum, r) => sum + r.requiredHours, 0);

  // Leave balance
  const myLeaveBalance = leaveBalances.find(lb => lb.userId === currentUser.id);

  return (
    <div className="space-y-4">
      {/* Check-in Card */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-dark-400 font-medium">Today — {formatDateFull(today())}</p>
            <div className="flex items-center gap-3 mt-2">
              {checkInTime && (
                <div className="flex items-center gap-1.5 text-xs text-dark-500">
                  <LogIn size={12} className="text-green-500" />
                  Checked in at <span className="font-bold text-dark-700">{formatTime(checkInTime)}</span>
                </div>
              )}
              {checkOutTime && (
                <div className="flex items-center gap-1.5 text-xs text-dark-500">
                  <LogOut size={12} className="text-red-500" />
                  Checked out at <span className="font-bold text-dark-700">{formatTime(checkOutTime)}</span>
                </div>
              )}
            </div>
            {isCheckedIn && (
              <div className="mt-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs font-semibold text-green-600">Active session</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {!checkInTime && (
              <button onClick={handleCheckIn} className="h-10 px-5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 flex items-center gap-2 shadow-sm transition-colors">
                <LogIn size={16} /> Check In
              </button>
            )}
            {isCheckedIn && (
              <button onClick={handleCheckOut} className="group h-auto min-h-[44px] px-5 py-2 rounded-xl bg-dark-800 text-white text-sm font-bold hover:bg-red-500 flex flex-col items-center gap-0.5 shadow-sm transition-all duration-200">
                <div className="flex items-center gap-2">
                  <LogOut size={15} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute" />
                  <Timer size={15} className="group-hover:opacity-0 transition-opacity duration-200" />
                  <span className="relative">
                    <span className="group-hover:opacity-0 transition-opacity duration-200 tabular-nums font-extrabold tracking-tight">{elapsed}</span>
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">Check Out</span>
                  </span>
                </div>
                <span className="text-[10px] font-medium opacity-50 group-hover:opacity-0 transition-opacity duration-200">worked today</span>
              </button>
            )}
            {isDayComplete && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-50 text-xs font-bold text-dark-500">
                <Check size={14} /> Day Complete — {workedTotal}h logged
              </span>
            )}
          </div>
        </div>
        <div className="px-5 py-3 bg-dark-25 border-t border-dark-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-dark-400">
            <ClipboardEdit size={13} />
            <span className="text-xs">Forgot to check in? Submit a correction request for approval.</span>
          </div>
          <button onClick={() => setShowRequestDrawer(true)} className="h-8 px-3.5 rounded-lg border border-dark-200 bg-white text-dark-600 text-xs font-semibold hover:bg-dark-50 hover:border-dark-300 flex items-center gap-1.5 transition-colors shadow-sm">
            <Plus size={12} /> New Request
          </button>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Present', value: presentDays, sub: 'days', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Late', value: lateDays, sub: 'days', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Absent', value: absentDays, sub: 'days', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'On Leave', value: leaveDays, sub: 'days', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Hours Worked', value: totalHoursWorked.toFixed(1), sub: `/ ${totalRequired}h`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Check-in', value: getAverageCheckIn(thisMonth), sub: '', color: 'text-dark-600', bg: 'bg-dark-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-dark-100 rounded-xl p-3">
            <p className="text-[10px] text-dark-400 font-semibold uppercase tracking-wide">{stat.label}</p>
            <p className={`text-lg font-extrabold mt-0.5 ${stat.color}`}>{stat.value}</p>
            {stat.sub && <p className="text-[10px] text-dark-300">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Leave Balances */}
      {myLeaveBalance && (
        <div className="bg-white border border-dark-100 rounded-xl p-4">
          <h3 className="text-sm font-bold text-dark-900 mb-3">Leave Balances</h3>
          <div className="grid grid-cols-3 gap-4">
            {myLeaveBalance.balances.map(b => {
              const pct = b.total > 0 ? (b.used / b.total) * 100 : 0;
              const colors = leaveTypeColors[b.leaveType];
              return (
                <div key={b.leaveType} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase ${colors.text}`}>{b.leaveType}</span>
                    <span className="text-[10px] text-dark-400">{b.used}/{b.total} used</span>
                  </div>
                  <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors.bg.replace('50', '400').replace('bg-', 'bg-')}`}
                      style={{ width: `${pct}%`, background: b.leaveType === 'sick' ? '#EF4444' : b.leaveType === 'casual' ? '#F59E0B' : '#3B82F6' }} />
                  </div>
                  <p className="text-xs font-bold text-dark-700">{b.remaining} days remaining</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Attendance Requests */}
      {myAttendanceRequests.length > 0 && (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-dark-900">My Attendance Requests</h3>
            <span className="text-[10px] font-semibold text-dark-400">{myAttendanceRequests.filter(r => r.status === 'pending').length} pending</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Check In</th>
                <th className="px-4 py-2.5">Check Out</th>
                <th className="px-4 py-2.5">Hours</th>
                <th className="px-4 py-2.5">Work Type</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {myAttendanceRequests.map(req => {
                const wt = workTypeLabels[req.workType];
                const sc = requestStatusColors[req.status];
                return (
                  <tr key={req.id} className="border-t border-dark-50 hover:bg-dark-25">
                    <td className="px-4 py-2.5 font-medium text-dark-700">{formatDateShort(req.attendanceDate)}</td>
                    <td className="px-4 py-2.5 text-dark-600">{req.checkInTime}</td>
                    <td className="px-4 py-2.5 text-dark-500">{req.checkOutTime ?? '—'}</td>
                    <td className="px-4 py-2.5 font-bold text-dark-700">{req.workedHours > 0 ? `${req.workedHours}h` : '—'}</td>
                    <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${wt.bg} ${wt.text}`}>{wt.label}</span></td>
                    <td className="px-4 py-2.5 text-dark-500 max-w-[200px] truncate">{req.reason}</td>
                    <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${sc.bg} ${sc.text}`}>{req.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance Request Drawer */}
      <AnimatePresence>
        {showRequestDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[60]" onClick={() => setShowRequestDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[440px] bg-white shadow-elevated z-[61] flex flex-col">
              <div className="px-6 py-5 border-b border-dark-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-dark-900">New Attendance Request</h3>
                  <p className="text-xs text-dark-400 mt-0.5">Submit a correction for a missed or failed check-in</p>
                </div>
                <button onClick={() => setShowRequestDrawer(false)} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Attendance Date *</label>
                  <input type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-dark-200 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Check-In Time *</label>
                    <input type="time" value={reqCheckIn} onChange={e => setReqCheckIn(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-dark-200 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Check-Out Time</label>
                    <input type="time" value={reqCheckOut} onChange={e => setReqCheckOut(e.target.value)} className="w-full h-11 px-4 rounded-xl border border-dark-200 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  </div>
                </div>

                {reqCheckIn && reqCheckOut && (() => {
                  const [inH, inM] = reqCheckIn.split(':').map(Number);
                  const [outH, outM] = reqCheckOut.split(':').map(Number);
                  const hrs = Math.max(0, Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10);
                  return (
                    <div className="bg-dark-25 border border-dark-100 rounded-xl p-3 flex items-center gap-2">
                      <Timer size={14} className="text-dark-400" />
                      <span className="text-sm font-bold text-dark-700">{hrs}h</span>
                      <span className="text-xs text-dark-400">estimated worked hours</span>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Work Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(workTypeLabels) as [AttendanceRequestWorkType, typeof workTypeLabels[AttendanceRequestWorkType]][]).map(([key, val]) => (
                      <button key={key} onClick={() => setReqWorkType(key)}
                        className={`h-11 rounded-xl border text-sm font-semibold transition-all ${
                          reqWorkType === key
                            ? `${val.bg} ${val.text} border-current ring-2 ring-current/20`
                            : 'border-dark-200 text-dark-500 hover:bg-dark-50'
                        }`}>
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Request Description *</label>
                  <textarea value={reqReason} onChange={e => setReqReason(e.target.value)} rows={4}
                    placeholder="Explain why you were unable to check in through the regular system..."
                    className="w-full px-4 py-3 rounded-xl border border-dark-200 text-sm text-dark-700 resize-none focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-dark-100 flex items-center justify-between gap-3">
                <p className="text-[11px] text-dark-400">Your request will be sent to an admin for approval.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowRequestDrawer(false)} className="h-10 px-4 rounded-xl border border-dark-200 bg-white text-dark-600 text-sm font-semibold hover:bg-dark-50">Cancel</button>
                  <button onClick={handleSubmitRequest} disabled={!reqDate || !reqCheckIn || !reqReason.trim()}
                    className="h-10 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                    <Send size={14} /> Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Attendance History */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-dark-900">Attendance History</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setHistoryMonth(shiftMonth(historyMonth, -1))} className="p-1 rounded-lg hover:bg-dark-100 text-dark-400"><ChevronLeft size={15} /></button>
            <span className="text-xs font-semibold text-dark-700 min-w-[120px] text-center">{monthLabel(historyMonth)}</span>
            <button onClick={() => setHistoryMonth(shiftMonth(historyMonth, 1))} className="p-1 rounded-lg hover:bg-dark-100 text-dark-400"><ChevronRight size={15} /></button>
          </div>
        </div>
        {(() => {
          const monthRecords = myRecords.filter(r => r.date.startsWith(historyMonth)).slice().reverse();
          return monthRecords.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Check In</th>
                  <th className="px-4 py-2.5">Check Out</th>
                  <th className="px-4 py-2.5">Worked</th>
                  <th className="px-4 py-2.5">Event Hours</th>
                  <th className="px-4 py-2.5">Total</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthRecords.map(r => {
                  const sc = statusColors[r.status];
                  return (
                    <tr key={r.id} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5 font-medium text-dark-700">{formatDateShort(r.date)}</td>
                      <td className="px-4 py-2.5 text-dark-500">{formatTime(r.checkInTime)}</td>
                      <td className="px-4 py-2.5 text-dark-500">{formatTime(r.checkOutTime)}</td>
                      <td className="px-4 py-2.5 font-bold text-dark-700">{r.workedHours > 0 ? `${r.workedHours}h` : '—'}</td>
                      <td className="px-4 py-2.5 text-dark-500">{r.eventHours > 0 ? `${r.eventHours}h` : '—'}</td>
                      <td className="px-4 py-2.5 font-bold text-dark-700">{r.totalHours > 0 ? `${r.totalHours}h` : '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-8 text-center text-dark-300 text-xs">No records for {monthLabel(historyMonth)}</div>
          );
        })()}
      </div>
    </div>
  );
}

function getAverageCheckIn(records: HRMSCheckIn[]): string {
  const withCheckIn = records.filter(r => r.checkInTime);
  if (withCheckIn.length === 0) return '—';
  const totalMinutes = withCheckIn.reduce((sum, r) => {
    const d = new Date(r.checkInTime!);
    return sum + d.getHours() * 60 + d.getMinutes();
  }, 0);
  const avg = totalMinutes / withCheckIn.length;
  const h = Math.floor(avg / 60);
  const m = Math.round(avg % 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

// ── Attendance Overview (Admin) ──────────────────────
function AttendanceOverview() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allAttendanceRequests, setAllAttendanceRequests] = useState(attendanceRequests);
  const [validatedRecords, setValidatedRecords] = useState<Record<string, 'validated' | 'invalidated'>>({});

  const pendingAttRequests = allAttendanceRequests.filter(r => r.status === 'pending');

  const handleAttendanceRequestAction = (id: string, action: 'approved' | 'rejected') => {
    setAllAttendanceRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: action,
      resolvedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      resolvedAt: new Date().toISOString(),
    } : r));
  };

  const handleValidate = (recordId: string) => {
    setValidatedRecords(prev => ({ ...prev, [recordId]: prev[recordId] === 'validated' ? 'validated' : 'validated' }));
  };

  const handleInvalidate = (recordId: string) => {
    setValidatedRecords(prev => ({ ...prev, [recordId]: 'invalidated' }));
  };

  const dateRecords = hrmsCheckIns.filter(r => r.date === selectedDate);
  const summary = dailyAttendanceSummaries.find(s => s.date === selectedDate);

  const filteredRecords = dateRecords.filter(r => {
    const user = employeeUsers.find(u => u.id === r.userId);
    if (roleFilter !== 'all' && user?.role !== roleFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const summaryCards = [
    { label: 'Total', value: summary?.totalEmployees ?? 0, color: 'text-dark-700', bg: 'bg-dark-50', icon: Users },
    { label: 'Present', value: summary?.present ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: Check },
    { label: 'Late', value: summary?.late ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
    { label: 'Absent', value: summary?.absent ?? 0, color: 'text-red-600', bg: 'bg-red-50', icon: X },
    { label: 'On Leave', value: summary?.onLeave ?? 0, color: 'text-purple-600', bg: 'bg-purple-50', icon: Calendar },
    { label: 'Half Day', value: summary?.halfDay ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: Coffee },
  ];

  return (
    <div className="space-y-4">
      {/* Date picker row */}
      <div className="flex items-center gap-3">
        <button onClick={() => {
          const d = new Date(selectedDate + 'T00:00:00');
          d.setDate(d.getDate() - 1);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setSelectedDate(`${yyyy}-${mm}-${dd}`);
        }} className="p-1.5 rounded-lg hover:bg-dark-100"><ChevronLeft size={16} /></button>
        <span className="text-sm font-bold text-dark-900">{formatDateFull(selectedDate)}</span>
        <button onClick={() => {
          const d = new Date(selectedDate + 'T00:00:00');
          d.setDate(d.getDate() + 1);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setSelectedDate(`${yyyy}-${mm}-${dd}`);
        }} className="p-1.5 rounded-lg hover:bg-dark-100"><ChevronRight size={16} /></button>
        <button onClick={() => setSelectedDate(today())} className="ml-2 text-xs font-semibold text-court-500 hover:text-court-600">Today</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map(sc => (
          <div key={sc.label} className="bg-white border border-dark-100 rounded-xl p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center`}>
              <sc.icon size={16} className={sc.color} />
            </div>
            <div>
              <p className="text-[10px] text-dark-400 font-semibold uppercase">{sc.label}</p>
              <p className={`text-lg font-extrabold ${sc.color}`}>{sc.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-semibold text-dark-600 bg-white">
          <option value="all">All Roles</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
          <option value="medical">Medical</option>
          <option value="staff">Staff</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-semibold text-dark-600 bg-white">
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="on_leave">On Leave</option>
          <option value="half_day">Half Day</option>
        </select>
      </div>

      {/* Employee Table */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
              <th className="px-4 py-2.5">Employee</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Check In</th>
              <th className="px-4 py-2.5">Check Out</th>
              <th className="px-4 py-2.5">Worked</th>
              <th className="px-4 py-2.5">Event Hrs</th>
              <th className="px-4 py-2.5">Total</th>
              <th className="px-4 py-2.5">Late</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Validate</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(r => {
              const user = employeeUsers.find(u => u.id === r.userId);
              if (!user) return null;
              const sc = statusColors[r.status];
              const roleColors: Record<string, string> = { admin: '#8E33FF', coach: '#00A76F', medical: '#FF6C40', staff: '#637381' };
              const validation = validatedRecords[r.id];
              return (
                <tr key={r.id} className="border-t border-dark-50 hover:bg-dark-25">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: roleColors[user.role] || '#637381' }}>{user.avatar}</div>
                      <div>
                        <p className="font-semibold text-dark-800">{user.firstName} {user.lastName}</p>
                        <p className="text-[10px] text-dark-400">{user.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold capitalize" style={{ background: (roleColors[user.role] || '#637381') + '15', color: roleColors[user.role] || '#637381' }}>{user.role}</span>
                  </td>
                  <td className="px-4 py-2.5 text-dark-500">{formatTime(r.checkInTime)}</td>
                  <td className="px-4 py-2.5 text-dark-500">{formatTime(r.checkOutTime)}</td>
                  <td className="px-4 py-2.5 font-bold text-dark-700">{r.workedHours > 0 ? `${r.workedHours}h` : '—'}</td>
                  <td className="px-4 py-2.5 text-dark-500">{r.eventHours > 0 ? `${r.eventHours}h` : '—'}</td>
                  <td className="px-4 py-2.5 font-bold text-dark-700">{r.totalHours > 0 ? `${r.totalHours}h` : '—'}</td>
                  <td className="px-4 py-2.5">{r.lateMinutes > 0 ? <span className="text-amber-600 font-bold">{r.lateMinutes}m</span> : '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {validation === 'validated' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold"><ShieldCheck size={10} /> Validated</span>
                    ) : validation === 'invalidated' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold"><ShieldX size={10} /> Invalidated</span>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => handleValidate(r.id)} className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100" title="Validate"><ShieldCheck size={12} /></button>
                        <button onClick={() => handleInvalidate(r.id)} className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100" title="Invalidate"><ShieldX size={12} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredRecords.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-dark-300 text-xs">No records for this date</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance Requests (Admin) */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-dark-900">Attendance Requests</h3>
            <p className="text-xs text-dark-400 mt-0.5">Employees who missed check-in can submit correction requests for your approval</p>
          </div>
          {pendingAttRequests.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold">
              <AlertTriangle size={10} /> {pendingAttRequests.length} pending
            </span>
          )}
        </div>
        {allAttendanceRequests.length === 0 ? (
          <div className="p-8 text-center text-dark-300 text-xs">No attendance requests submitted</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Check-In</th>
                <th className="px-4 py-2.5">Check-Out</th>
                <th className="px-4 py-2.5">Hours</th>
                <th className="px-4 py-2.5">Work Type</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allAttendanceRequests.slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map(req => {
                const wt = workTypeLabels[req.workType];
                const sc = requestStatusColors[req.status];
                return (
                  <tr key={req.id} className="border-t border-dark-50 hover:bg-dark-25">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-dark-200 flex items-center justify-center text-white text-[9px] font-bold">{req.userAvatar}</div>
                        <span className="font-semibold text-dark-800">{req.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-dark-700">{formatDateShort(req.attendanceDate)}</td>
                    <td className="px-4 py-2.5 text-dark-600">{req.checkInTime}</td>
                    <td className="px-4 py-2.5 text-dark-500">{req.checkOutTime ?? '—'}</td>
                    <td className="px-4 py-2.5 font-bold text-dark-700">{req.workedHours > 0 ? `${req.workedHours}h` : '—'}</td>
                    <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${wt.bg} ${wt.text}`}>{wt.label}</span></td>
                    <td className="px-4 py-2.5 text-dark-500 max-w-[180px] truncate">{req.reason}</td>
                    <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${sc.bg} ${sc.text}`}>{req.status}</span></td>
                    <td className="px-4 py-2.5">
                      {req.status === 'pending' ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleAttendanceRequestAction(req.id, 'approved')} className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100" title="Approve"><Check size={12} /></button>
                          <button onClick={() => handleAttendanceRequestAction(req.id, 'rejected')} className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100" title="Reject"><X size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-dark-300">{req.resolvedBy && `by ${req.resolvedBy}`}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Monthly Heatmap */}
      {/* <div className="bg-white border border-dark-100 rounded-xl p-4">
        <h3 className="text-sm font-bold text-dark-900 mb-3">Monthly Attendance Rate</h3>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-[10px] font-semibold text-dark-400 py-1">{d}</div>
          ))}
          {Array.from({ length: 2 }).map((_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            const dateStr = `2026-04-${String(day).padStart(2, '0')}`;
            const daySummary = dailyAttendanceSummaries.find(s => s.date === dateStr);
            const rate = daySummary && daySummary.totalEmployees > 0
              ? ((daySummary.present + daySummary.late) / daySummary.totalEmployees)
              : 0;
            const opacity = daySummary ? 0.2 + rate * 0.8 : 0.05;
            return (
              <div key={day} className="py-2 rounded-lg text-[10px] font-semibold cursor-default"
                style={{ background: `rgba(34, 197, 94, ${opacity})` }}
                title={daySummary ? `${Math.round(rate * 100)}% attendance` : 'No data'}>
                {day}
              </div>
            );
          })}
        </div>
      </div> */}

    </div>
  );
}

function WorkRecords() {
  const [selectedMonth, setSelectedMonth] = useState(monthKeyFromDate(today()));
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const monthDays = daysInMonth(selectedMonth);
  const monthlyUsers = employeeUsers.filter(user => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-dark-900">Work Records</h2>
          <p className="text-xs text-dark-400 mt-0.5">Monthly employee attendance matrix based on current HRMS mock records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-dark-200 text-xs font-semibold text-dark-600 bg-white"
          >
            <option value="all">All Roles</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
            <option value="medical">Medical</option>
            <option value="staff">Staff</option>
          </select>
          <div className="flex items-center gap-1 bg-dark-50 rounded-xl p-0.5 w-fit">
            <button
              onClick={() => setSelectedMonth(prev => shiftMonth(prev, -1))}
              className="w-8 h-8 rounded-lg text-dark-500 hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
              aria-label="Previous month"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="px-3 min-w-[150px] text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Month</p>
              <p className="text-sm font-semibold text-dark-800">{monthLabel(selectedMonth)}</p>
            </div>
            <button
              onClick={() => setSelectedMonth(prev => shiftMonth(prev, 1))}
              className="w-8 h-8 rounded-lg text-dark-500 hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
              aria-label="Next month"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-dark-200 bg-white px-3 h-9">
            <CalendarDays size={14} className="text-dark-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-dark-700 bg-transparent focus:outline-none"
            />
          </div>
          <button className="h-9 px-4 rounded-xl border border-dark-200 bg-white text-dark-600 text-sm font-semibold hover:bg-dark-50 flex items-center gap-2 transition-colors shadow-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-100 flex flex-wrap items-center gap-2">
          {[
            { key: 'present', label: 'Present', classes: 'bg-green-50 text-green-700 border-green-100', dot: '#22C55E' },
            { key: 'late', label: 'Late', classes: 'bg-amber-50 text-amber-700 border-amber-100', dot: '#F59E0B' },
            { key: 'half_day', label: 'Half Day', classes: 'bg-blue-50 text-blue-700 border-blue-100', dot: '#3B82F6' },
            { key: 'on_leave', label: 'On Leave', classes: 'bg-purple-50 text-purple-700 border-purple-100', dot: '#8B5CF6' },
            { key: 'holiday', label: 'Leave / Holiday', classes: 'bg-dark-50 text-dark-600 border-dark-100', dot: '#9CA3AF' },
            { key: 'absent', label: 'Absent', classes: 'bg-red-50 text-red-700 border-red-100', dot: '#EF4444' },
          ].map(item => (
            <span key={item.key} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold ${item.classes}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.dot }} />
              {item.label}
            </span>
          ))}
        </div>

        <div className="overflow-auto max-h-[70vh] bg-dark-25/40">
          <table className="border-separate border-spacing-0 min-w-max text-xs">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-40 bg-white border-b border-r border-dark-100 px-4 py-3 min-w-[240px] text-left">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Employee</p>
                    <p className="text-xs font-semibold text-dark-700 mt-0.5">{monthlyUsers.length} team member{monthlyUsers.length === 1 ? '' : 's'}</p>
                  </div>
                </th>
                {Array.from({ length: monthDays }).map((_, index) => {
                  const day = index + 1;
                  const weekend = isWeekendInMonth(selectedMonth, day);
                  return (
                    <th
                      key={day}
                      className={`sticky top-0 z-30 border-b border-r border-dark-100 px-0 py-2 min-w-[42px] text-center ${weekend ? 'bg-dark-100/95' : 'bg-white'}`}
                    >
                      <div className="flex flex-col items-center leading-none gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-dark-400">{weekdayFromMonthDay(selectedMonth, day).slice(0, 3)}</span>
                        <span className="text-[11px] font-bold text-dark-700">{day}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {monthlyUsers.map(user => {
                const roleColors: Record<string, string> = { admin: '#8E33FF', coach: '#00A76F', medical: '#FF6C40', staff: '#637381' };
                return (
                  <tr key={user.id}>
                    <td className="sticky left-0 z-20 bg-white border-r border-b border-dark-100 px-4 py-3 min-w-[240px] align-middle">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ background: `linear-gradient(135deg, ${roleColors[user.role] || '#637381'}, ${(roleColors[user.role] || '#637381')}bb)` }}
                        >
                          {user.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-dark-800 truncate">{user.firstName} {user.lastName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold capitalize"
                              style={{ backgroundColor: (roleColors[user.role] || '#637381') + '15', color: roleColors[user.role] || '#637381' }}
                            >
                              {user.role}
                            </span>
                            <span className="text-[10px] text-dark-400 truncate">{user.designation}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: monthDays }).map((_, index) => {
                      const day = index + 1;
                      const date = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                      const weekend = isWeekendInMonth(selectedMonth, day);
                      const record = hrmsCheckIns.find(r => r.userId === user.id && r.date === date);

                      const cell = record
                        ? (() => {
                            switch (record.status) {
                              case 'present':
                                return { label: 'P', wrapper: 'bg-green-50 text-green-700', title: 'Present' };
                              case 'late':
                                return { label: 'L', wrapper: 'bg-amber-50 text-amber-700', title: `Late (${record.lateMinutes}m)` };
                              case 'half_day':
                                return { label: 'H', wrapper: 'bg-blue-50 text-blue-700', title: 'Half Day' };
                              case 'on_leave':
                                return { label: 'O', wrapper: 'bg-purple-50 text-purple-700', title: 'On Leave' };
                              case 'holiday':
                                return { label: 'W', wrapper: 'bg-dark-50 text-dark-500', title: 'Leave / Holiday' };
                              case 'absent':
                                return { label: 'A', wrapper: 'bg-red-50 text-red-700', title: 'Absent' };
                            }
                          })()
                        : null;

                      return (
                        <td
                          key={date}
                          className={`border-r border-b border-dark-100 p-1 text-center align-middle ${weekend ? 'bg-dark-50/70' : 'bg-white'}`}
                          title={cell ? `${user.firstName} ${user.lastName}: ${cell.title}` : `${weekdayFromMonthDay(selectedMonth, day)}, no record`}
                        >
                          <div
                            className={`w-[34px] h-[34px] rounded-lg mx-auto flex items-center justify-center text-[11px] font-bold transition-colors ${cell ? cell.wrapper : weekend ? 'bg-dark-100 text-dark-300' : 'bg-dark-25 text-dark-300'}`}
                          >
                            {cell?.label ?? '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Leave Management ─────────────────────────────────
function LeaveManagement() {
  const isAdmin = currentUser.role === 'admin';
  const [view, setView] = useState<'my' | 'admin'>(isAdmin ? 'admin' : 'my');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [requests, setRequests] = useState(leaveRequests);
  const [balances, setBalances] = useState(leaveBalances);

  // Apply form state
  const [applyType, setApplyType] = useState<LeaveType>('casual');
  const [applyStart, setApplyStart] = useState('');
  const [applyEnd, setApplyEnd] = useState('');
  const [applyReason, setApplyReason] = useState('');

  const myRequests = requests.filter(r => r.userId === currentUser.id);
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const myBalance = balances.find(b => b.userId === currentUser.id);

  const handleApply = () => {
    if (!applyStart || !applyEnd || !applyReason) return;
    const start = new Date(applyStart + 'T00:00:00');
    const end = new Date(applyEnd + 'T00:00:00');
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      userAvatar: currentUser.avatar,
      leaveType: applyType,
      startDate: applyStart,
      endDate: applyEnd,
      days,
      reason: applyReason,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };
    setRequests(prev => [newReq, ...prev]);
    setShowApplyForm(false);
    setApplyStart('');
    setApplyEnd('');
    setApplyReason('');
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: action,
      approvedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      resolvedAt: new Date().toISOString(),
    } : r));
  };

  return (
    <div className="space-y-4">
      {/* View toggle */}
      {isAdmin && (
        <div className="flex gap-1 bg-dark-100/60 rounded-xl p-0.5 w-fit">
          {[{ key: 'admin' as const, label: 'Manage Requests' }, { key: 'my' as const, label: 'My Leaves' }].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${view === v.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>{v.label}</button>
          ))}
        </div>
      )}

      {/* Admin View: Pending Requests */}
      {view === 'admin' && isAdmin && (
        <>
          {pendingRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">{pendingRequests.length} pending leave request{pendingRequests.length > 1 ? 's' : ''} require your attention</span>
            </div>
          )}

          <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-100">
              <h3 className="text-sm font-bold text-dark-900">All Leave Requests</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Dates</th>
                  <th className="px-4 py-2.5">Days</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const tc = leaveTypeColors[r.leaveType];
                  return (
                    <tr key={r.id} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-dark-200 flex items-center justify-center text-white text-[9px] font-bold">{r.userAvatar}</div>
                          <span className="font-semibold text-dark-800">{r.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${tc.bg} ${tc.text} capitalize`}>{r.leaveType}</span>
                      </td>
                      <td className="px-4 py-2.5 text-dark-500">{formatDateShort(r.startDate)} — {formatDateShort(r.endDate)}</td>
                      <td className="px-4 py-2.5 font-bold text-dark-700">{r.days}</td>
                      <td className="px-4 py-2.5 text-dark-500 max-w-[200px] truncate">{r.reason}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          r.status === 'approved' ? 'bg-green-50 text-green-600' :
                          'bg-red-50 text-red-600'
                        } capitalize`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {r.status === 'pending' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleAction(r.id, 'approved')}
                              className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100"><Check size={12} /></button>
                            <button onClick={() => handleAction(r.id, 'rejected')}
                              className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"><X size={12} /></button>
                          </div>
                        )}
                        {r.status !== 'pending' && (
                          <span className="text-[10px] text-dark-300">{r.approvedBy && `by ${r.approvedBy}`}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Employee Leave Balances */}
          <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-100">
              <h3 className="text-sm font-bold text-dark-900">Employee Leave Balances</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5 text-center">Sick (used/total)</th>
                  <th className="px-4 py-2.5 text-center">Casual (used/total)</th>
                  <th className="px-4 py-2.5 text-center">Annual (used/total)</th>
                </tr>
              </thead>
              <tbody>
                {balances.map(lb => {
                  const user = employeeUsers.find(u => u.id === lb.userId);
                  if (!user) return null;
                  return (
                    <tr key={lb.userId} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5 font-semibold text-dark-800">{user.firstName} {user.lastName}</td>
                      {lb.balances.map(b => (
                        <td key={b.leaveType} className="px-4 py-2.5 text-center">
                          <span className="font-bold text-dark-700">{b.used}</span>
                          <span className="text-dark-300">/{b.total}</span>
                          <span className="text-dark-400 ml-1">({b.remaining} left)</span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* My View */}
      {view === 'my' && (
        <>
          {/* Leave Balances */}
          {myBalance && (
            <div className="bg-white border border-dark-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-dark-900">My Leave Balances</h3>
                <button onClick={() => setShowApplyForm(true)}
                  className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-bold hover:bg-court-600 flex items-center gap-1.5 transition-colors">
                  <Calendar size={12} /> Apply for Leave
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {myBalance.balances.map(b => {
                  const pct = b.total > 0 ? (b.used / b.total) * 100 : 0;
                  const colors = leaveTypeColors[b.leaveType];
                  return (
                    <div key={b.leaveType} className={`${colors.bg} rounded-xl p-3 space-y-1.5`}>
                      <p className={`text-[10px] font-bold uppercase ${colors.text}`}>{b.leaveType} Leave</p>
                      <p className="text-lg font-extrabold text-dark-900">{b.remaining} <span className="text-xs font-normal text-dark-400">remaining</span></p>
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${pct}%`,
                          background: b.leaveType === 'sick' ? '#EF4444' : b.leaveType === 'casual' ? '#F59E0B' : '#3B82F6',
                        }} />
                      </div>
                      <p className="text-[10px] text-dark-500">{b.used} used of {b.total}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Apply Form */}
          {showApplyForm && (
            <div className="bg-white border border-court-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-dark-900">Apply for Leave</h3>
                <button onClick={() => setShowApplyForm(false)} className="p-1 rounded hover:bg-dark-50"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-dark-500 uppercase">Leave Type</label>
                  <select value={applyType} onChange={e => setApplyType(e.target.value as LeaveType)}
                    className="mt-1 w-full h-9 px-3 rounded-lg border border-dark-200 text-xs font-semibold">
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="annual">Annual Leave</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-dark-500 uppercase">Start Date</label>
                  <input type="date" value={applyStart} onChange={e => setApplyStart(e.target.value)}
                    className="mt-1 w-full h-9 px-3 rounded-lg border border-dark-200 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-dark-500 uppercase">End Date</label>
                  <input type="date" value={applyEnd} onChange={e => setApplyEnd(e.target.value)}
                    className="mt-1 w-full h-9 px-3 rounded-lg border border-dark-200 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-dark-500 uppercase">Reason</label>
                <textarea value={applyReason} onChange={e => setApplyReason(e.target.value)}
                  placeholder="Briefly explain the reason for your leave..."
                  className="mt-1 w-full h-20 px-3 py-2 rounded-lg border border-dark-200 text-xs resize-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleApply}
                  className="h-9 px-4 rounded-lg bg-court-500 text-white text-xs font-bold hover:bg-court-600 transition-colors">
                  Submit Request
                </button>
              </div>
            </div>
          )}

          {/* My Requests */}
          <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-100">
              <h3 className="text-sm font-bold text-dark-900">My Leave Requests</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Dates</th>
                  <th className="px-4 py-2.5">Days</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Applied</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-dark-300 text-xs">No leave requests yet</td></tr>
                ) : myRequests.map(r => {
                  const tc = leaveTypeColors[r.leaveType];
                  return (
                    <tr key={r.id} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${tc.bg} ${tc.text} capitalize`}>{r.leaveType}</span>
                      </td>
                      <td className="px-4 py-2.5 text-dark-500">{formatDateShort(r.startDate)} — {formatDateShort(r.endDate)}</td>
                      <td className="px-4 py-2.5 font-bold text-dark-700">{r.days}</td>
                      <td className="px-4 py-2.5 text-dark-500 max-w-[200px] truncate">{r.reason}</td>
                      <td className="px-4 py-2.5 text-dark-400">{formatDateShort(r.appliedAt.split('T')[0])}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          r.status === 'approved' ? 'bg-green-50 text-green-600' :
                          'bg-red-50 text-red-600'
                        } capitalize`}>{r.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Reports ──────────────────────────────────────────
function AttendanceReports() {
  const [reportType, setReportType] = useState<'attendance' | 'punctuality' | 'leave'>('attendance');

  return (
    <div className="space-y-4">
      {/* Report type selector */}
      <div className="flex gap-1 bg-dark-100/60 rounded-xl p-0.5 w-fit">
        {[
          { key: 'attendance' as const, label: 'Monthly Attendance' },
          { key: 'punctuality' as const, label: 'Punctuality' },
          { key: 'leave' as const, label: 'Leave Utilization' },
        ].map(r => (
          <button key={r.key} onClick={() => setReportType(r.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              reportType === r.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>{r.label}</button>
        ))}
      </div>

      {/* Export button */}
      <div className="flex justify-end">
        <button className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-1.5">
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* Monthly Attendance Report */}
      {reportType === 'attendance' && (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-100">
            <h3 className="text-sm font-bold text-dark-900">Monthly Attendance Report — April 2026</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5 text-center">Present</th>
                <th className="px-4 py-2.5 text-center">Late</th>
                <th className="px-4 py-2.5 text-center">Absent</th>
                <th className="px-4 py-2.5 text-center">Half Day</th>
                <th className="px-4 py-2.5 text-center">On Leave</th>
                <th className="px-4 py-2.5 text-center">Total Hours</th>
                <th className="px-4 py-2.5 text-center">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {employeeUsers.map(user => {
                const records = hrmsCheckIns.filter(r => r.userId === user.id && r.date.startsWith('2026-04'));
                const present = records.filter(r => r.status === 'present').length;
                const late = records.filter(r => r.status === 'late').length;
                const absent = records.filter(r => r.status === 'absent').length;
                const halfDay = records.filter(r => r.status === 'half_day').length;
                const onLeave = records.filter(r => r.status === 'on_leave').length;
                const totalHours = records.reduce((s, r) => s + r.totalHours, 0);
                const workDays = records.filter(r => r.status !== 'holiday').length || 1;
                const pct = Math.round(((present + late + halfDay * 0.5) / workDays) * 100);
                return (
                  <tr key={user.id} className="border-t border-dark-50 hover:bg-dark-25">
                    <td className="px-4 py-2.5 font-semibold text-dark-800">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-2.5 text-center text-green-600 font-bold">{present}</td>
                    <td className="px-4 py-2.5 text-center text-amber-600 font-bold">{late}</td>
                    <td className="px-4 py-2.5 text-center text-red-600 font-bold">{absent}</td>
                    <td className="px-4 py-2.5 text-center text-blue-600 font-bold">{halfDay}</td>
                    <td className="px-4 py-2.5 text-center text-purple-600 font-bold">{onLeave}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-dark-700">{totalHours.toFixed(1)}h</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${pct >= 90 ? 'bg-green-50 text-green-600' : pct >= 75 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Punctuality Report */}
      {reportType === 'punctuality' && (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-100">
            <h3 className="text-sm font-bold text-dark-900">Punctuality Report — April 2026</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5 text-center">Late Arrivals</th>
                <th className="px-4 py-2.5 text-center">Avg Late (min)</th>
                <th className="px-4 py-2.5 text-center">Early Departures</th>
                <th className="px-4 py-2.5 text-center">Avg Check-in</th>
                <th className="px-4 py-2.5 text-center">Overtime Hours</th>
              </tr>
            </thead>
            <tbody>
              {employeeUsers.map(user => {
                const records = hrmsCheckIns.filter(r => r.userId === user.id && r.date.startsWith('2026-04'));
                const lateRecords = records.filter(r => r.lateMinutes > 0);
                const earlyDeps = records.filter(r => r.earlyDepartureMinutes > 0);
                const avgLate = lateRecords.length > 0 ? Math.round(lateRecords.reduce((s, r) => s + r.lateMinutes, 0) / lateRecords.length) : 0;
                const overtime = records.reduce((s, r) => s + r.overtimeHours, 0);
                const avgCheckIn = getAverageCheckIn(records);
                return (
                  <tr key={user.id} className="border-t border-dark-50 hover:bg-dark-25">
                    <td className="px-4 py-2.5 font-semibold text-dark-800">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-2.5 text-center">
                      {lateRecords.length > 0
                        ? <span className="text-amber-600 font-bold">{lateRecords.length}</span>
                        : <span className="text-green-600 font-bold">0</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-dark-700">{avgLate > 0 ? `${avgLate}m` : '—'}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-dark-700">{earlyDeps.length}</td>
                    <td className="px-4 py-2.5 text-center text-dark-500">{avgCheckIn}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-dark-700">{overtime > 0 ? `${overtime.toFixed(1)}h` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Leave Utilization Report */}
      {reportType === 'leave' && (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-100">
            <h3 className="text-sm font-bold text-dark-900">Leave Utilization Report</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5 text-center">Sick Used</th>
                <th className="px-4 py-2.5 text-center">Casual Used</th>
                <th className="px-4 py-2.5 text-center">Annual Used</th>
                <th className="px-4 py-2.5 text-center">Total Used</th>
                <th className="px-4 py-2.5 text-center">Total Remaining</th>
              </tr>
            </thead>
            <tbody>
              {leaveBalances.map(lb => {
                const user = employeeUsers.find(u => u.id === lb.userId);
                if (!user) return null;
                const totalUsed = lb.balances.reduce((s, b) => s + b.used, 0);
                const totalRemaining = lb.balances.reduce((s, b) => s + b.remaining, 0);
                return (
                  <tr key={lb.userId} className="border-t border-dark-50 hover:bg-dark-25">
                    <td className="px-4 py-2.5 font-semibold text-dark-800">{user.firstName} {user.lastName}</td>
                    {lb.balances.map(b => (
                      <td key={b.leaveType} className="px-4 py-2.5 text-center">
                        <span className="font-bold text-dark-700">{b.used}</span>
                        <span className="text-dark-300">/{b.total}</span>
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-center font-bold text-dark-700">{totalUsed}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-green-600">{totalRemaining}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
