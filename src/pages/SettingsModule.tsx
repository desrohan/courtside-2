import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Shield, Briefcase, Calendar, Warehouse, Tag, Activity,
  Plus, Pencil, Trash2, X, Save, Check, ChevronDown, ChevronRight,
  GripVertical, Eye, Search, ToggleLeft, ToggleRight, Palette, Upload,
  ScrollText, AlignLeft, Hash, CalendarDays, List, Type, UserCog, Users,
  MapPin, QrCode, DollarSign, Clock, Timer, Hand, Ban, UserCheck,
} from 'lucide-react';
import {
  roles, Role, designations, Designation, settingsEventTypes, SettingsEventType,
  settingsFacilityCenters, SettingsFacilityCenter, SettingsFacility,
  settingsTags, SettingsTag, settingsActivities, permissionGroups, allPermissions,
  userTypes,
  attendanceRules, attendanceUserTypes, attendancePreferenceLabels, attendanceGeofenceConfig,
  AttendancePreference, AttendanceRule,
  eventAttendanceConfigs, EventAttendanceConfig, RoleAttendanceConfig,
  checkInMethodLabels, CheckInMethod, AttendanceDefaultStatus,
  reportTypes, ReportTypeConfig, ReportFieldDef, ReportFieldType,
  employeeTypeConfigs, EmployeeTypeConfig, workSchedules, WorkSchedule, WorkDay,
  leavePolicies, LeavePolicy, CompensationType, LeaveType,
  payrollConfig, PayrollConfig, salaryTemplates, SalaryTemplate,
  reimbursementCategoryConfigs, ReimbursementCategoryConfig,
} from '@/data/settings';
import { organizations } from '@/data/organizations';
import {
  statDefinitions, statGroups, StatDefinition, StatGroupDef, StatScope,
  getFormulaDisplay,
} from '@/data/statDefinitions';
import GovernanceSection from '@/components/governance/GovernanceSection';
import { seasons, Season } from '@/data/seasons';
import { settingsActivities as activities } from '@/data/settings';

type SettingsSection = 'account' | 'resources' | 'governance';
type AccountTab = 'organization' | 'roles' | 'designations';
type ResourceTab = 'event-types' | 'facilities' | 'tags' | 'activity' | 'stats' | 'attendance' | 'report-types' | 'seasons';

export default function SettingsModule() {
  const location = useLocation();
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const basePath = `/o/${organizationId}/settings`;

  // Derive section from URL path
  const pathEnd = location.pathname.split('/settings/')[1]?.split('/')[0] || 'account';
  const section: SettingsSection = (['account', 'resources', 'governance'].includes(pathEnd) ? pathEnd : 'account') as SettingsSection;

  const setSection = (s: SettingsSection) => navigate(`${basePath}/${s}`);

  const [accountTab, setAccountTab] = useState<AccountTab>('organization');
  const [resourceTab, setResourceTab] = useState<ResourceTab>('event-types');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-dark-900">Settings</h1>
        <p className="text-xs text-dark-400 mt-0.5">Manage your organisation configuration</p>
      </div>

      {/* Section toggle */}
      <div className="flex gap-1 bg-dark-100/60 rounded-xl p-0.5 w-fit">
        {([
          { key: 'account' as SettingsSection, label: 'Account', icon: <Building2 size={14} /> },
          { key: 'resources' as SettingsSection, label: 'Resources', icon: <Activity size={14} /> },
          { key: 'governance' as SettingsSection, label: 'Governance', icon: <Shield size={14} /> },
        ]).map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              section === s.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {section === 'account' && <AccountSection tab={accountTab} setTab={setAccountTab} />}
      {section === 'resources' && <ResourceSection tab={resourceTab} setTab={setResourceTab} />}
      {section === 'governance' && <GovernanceSection />}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════
// ACCOUNT SECTION
// ══════════════════════════════════════════════════════
function AccountSection({ tab, setTab }: { tab: AccountTab; setTab: (t: AccountTab) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5 w-fit">
        {([
          { key: 'organization' as AccountTab, label: 'Organization' },
          { key: 'roles' as AccountTab, label: 'Roles' },
          { key: 'designations' as AccountTab, label: 'Designations' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === t.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'organization' && <OrganizationSettings />}
      {tab === 'roles' && <RolesSettings />}
      {tab === 'designations' && <DesignationsSettings />}
    </div>
  );
}

// ── Organization Edit ─────────────────────────────────
function OrganizationSettings() {
  const org = organizations[0];
  return (
    <div className="bg-white rounded-2xl border border-dark-100 p-6 space-y-5">
      <h2 className="text-base font-bold text-dark-900">Organization Details</h2>
      <div className="flex items-center gap-5 mb-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-court-500 to-court-700 flex items-center justify-center text-white text-2xl font-bold">{org.logo}</div>
        <button className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-1.5"><Upload size={13} /> Change Logo</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Name" value={org.name} />
        <FormField label="Short Name" value="FCC" />
        <FormField label="Type" value="Competitive Team" disabled />
        <FormField label="Activity" value="Football" disabled />
        <FormField label="Address Line 1" value={org.address} />
        <FormField label="Address Line 2" value="" placeholder="Optional" />
        <FormField label="Country" value="United Kingdom" />
        <FormField label="City" value="London" />
        <FormField label="Timezone" value="Europe/London" />
        <FormField label="Region" value="Europe" disabled />
        <FormField label="Email" value={org.email} />
        <FormField label="Phone" value={org.phone} />
      </div>
      <div className="flex justify-end pt-2">
        <button className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2"><Save size={15} /> Save Changes</button>
      </div>
    </div>
  );
}

// ── Roles ─────────────────────────────────────────────
function RolesSettings() {
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = roles.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles..."
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
        </div>
        <button onClick={() => setShowCreate(true)} className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Create Role</button>
      </div>
      <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-dark-50/60">
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 w-12">#</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Role</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Type</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Permissions</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-dark-100">
            {filtered.map((role, i) => (
              <tr key={role.id} className="hover:bg-dark-50/30">
                <td className="px-4 py-3 text-xs text-dark-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-dark-800">{role.name}</span>
                  {role.isSystem && <span className="ml-2 px-1.5 py-0.5 bg-dark-100 text-dark-400 rounded text-[9px] font-bold">SYSTEM</span>}
                </td>
                <td className="px-4 py-3 text-xs text-dark-500">{role.type}</td>
                <td className="px-4 py-3 text-xs text-dark-500">{role.permissionIds.length}/{allPermissions.length}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setEditRole(role)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
                    <button onClick={() => setEditRole(role)} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Eye size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Edit/Create Modal */}
      <AnimatePresence>
        {(editRole || showCreate) && (
          <RoleModal role={editRole} onClose={() => { setEditRole(null); setShowCreate(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleModal({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const [name, setName] = useState(role?.name || '');
  const [type, setType] = useState(role?.type || '');
  const [perms, setPerms] = useState<string[]>(role?.permissionIds || []);

  const togglePerm = (id: string) => setPerms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleGroup = (group: string) => {
    const ids = permissionGroups[group].map(p => p.id);
    const allSelected = ids.every(id => perms.includes(id));
    setPerms(p => allSelected ? p.filter(x => !ids.includes(x)) : [...new Set([...p, ...ids])]);
  };
  const selectAll = () => setPerms(p => p.length === allPermissions.length ? [] : allPermissions.map(p => p.id));

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-lg font-bold text-dark-900">{role ? 'Edit Role' : 'Create Role'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Type *</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
                <option value="">Select type...</option>
                {userTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Permission Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-dark-800">Permissions ({perms.length}/{allPermissions.length})</h4>
              <button onClick={selectAll} className="text-xs font-semibold text-court-500 hover:underline">
                {perms.length === allPermissions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(permissionGroups).map(([group, permissions]) => {
                const groupIds = permissions.map(p => p.id);
                const allGroupSelected = groupIds.every(id => perms.includes(id));
                return (
                  <div key={group} className="border border-dark-100 rounded-xl overflow-hidden">
                    <button onClick={() => toggleGroup(group)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-dark-50/60 hover:bg-dark-50 transition-colors">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                        allGroupSelected ? 'bg-court-500 border-court-500' : 'border-dark-300'}`}>
                        {allGroupSelected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-xs font-bold text-dark-700">{group}</span>
                      <span className="ml-auto text-[10px] text-dark-400">{groupIds.filter(id => perms.includes(id)).length}/{groupIds.length}</span>
                    </button>
                    <div className="p-2 space-y-0.5">
                      {permissions.map(p => (
                        <button key={p.id} onClick={() => togglePerm(p.id)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-50 text-left transition-colors">
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                            perms.includes(p.id) ? 'bg-court-500 border-court-500' : 'border-dark-300'}`}>
                            {perms.includes(p.id) && <Check size={8} className="text-white" />}
                          </div>
                          <span className="text-[11px] text-dark-600">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2"><Save size={15} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Designations ──────────────────────────────────────
function DesignationsSettings() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Designation | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Create Designation</button>
      </div>
      <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-dark-50/60">
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 w-12">#</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Designation</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Role</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-dark-100">
            {designations.map((d, i) => (
              <tr key={d.id} className="hover:bg-dark-50/30">
                <td className="px-4 py-3 text-xs text-dark-400">{i + 1}</td>
                <td className="px-4 py-3 text-sm font-semibold text-dark-800">{d.name}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-court-50 text-court-700 rounded text-[10px] font-semibold">{d.roleName}</span></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={() => { setEditItem(d); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>{showModal && <CrudModal title={editItem ? 'Edit Designation' : 'Create Designation'} onClose={() => { setShowModal(false); setEditItem(null); }}
        fields={[{ label: 'Name', value: editItem?.name || '', type: 'text' }, { label: 'Role', value: editItem?.roleName || '', type: 'select', options: roles.map(r => r.name) }]} />}</AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// RESOURCES SECTION
// ══════════════════════════════════════════════════════
function ResourceSection({ tab, setTab }: { tab: ResourceTab; setTab: (t: ResourceTab) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5 w-fit">
        {([
          { key: 'event-types' as ResourceTab, label: 'Event Types' },
          { key: 'activity' as ResourceTab, label: 'Activity' },
          { key: 'facilities' as ResourceTab, label: 'Facility Centers' },
          { key: 'tags' as ResourceTab, label: 'Tags' },
          { key: 'stats' as ResourceTab, label: 'Stats' },
          { key: 'attendance' as ResourceTab, label: 'Attendance' },
          { key: 'report-types' as ResourceTab, label: 'Report Types' },
          { key: 'seasons' as ResourceTab, label: 'Seasons' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === t.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>{t.label}</button>
        ))}
      </div>
      {tab === 'event-types' && <EventTypesSettings />}
      {tab === 'activity' && <ActivitySettings />}
      {tab === 'facilities' && <FacilitiesSettings />}
      {tab === 'tags' && <TagsSettings />}
      {tab === 'stats' && <StatsSettings />}
      {tab === 'attendance' && <AttendanceSettings />}
      {tab === 'report-types' && <ReportTypesSettings />}
      {tab === 'seasons' && <SeasonsSettings />}
    </div>
  );
}

// ── Event Types ───────────────────────────────────────
function EventTypesSettings() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SettingsEventType | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Create Event Type</button>
      </div>
      <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-dark-50/60">
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 w-12">#</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Event Type</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Color</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Compliance</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Competitive</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Travel</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-dark-100">
            {settingsEventTypes.map((et, i) => (
              <tr key={et.id} className="hover:bg-dark-50/30">
                <td className="px-4 py-3 text-xs text-dark-400">{i + 1}</td>
                <td className="px-4 py-3"><span className="text-sm font-semibold text-dark-800">{et.name}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-md" style={{ backgroundColor: et.color }} /><span className="text-xs text-dark-500">{et.color}</span></div></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${et.compliance === 'NONE' ? 'bg-dark-50 text-dark-400' : 'bg-blue-50 text-blue-600'}`}>{et.compliance}</span></td>
                <td className="px-4 py-3"><TogglePill on={et.competitive} /></td>
                <td className="px-4 py-3"><TogglePill on={et.travelPossible} /></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={() => { setEditItem(et); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>{showModal && <EventTypeModal item={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} />}</AnimatePresence>
    </div>
  );
}

function EventTypeModal({ item, onClose }: { item: SettingsEventType | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name || '');
  const [color, setColor] = useState(item?.color || '#00A76F');
  const [compliance, setCompliance] = useState(item?.compliance || 'NONE');
  const [competitive, setCompetitive] = useState(item?.competitive || false);
  const [skilled, setSkilled] = useState(item?.skilledEvents || false);
  const [travel, setTravel] = useState(item?.travelPossible || false);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h3 className="text-base font-bold text-dark-900">{item ? 'Edit Event Type' : 'Create Event Type'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-9 rounded-lg border border-dark-200 cursor-pointer" />
              <input value={color} onChange={e => setColor(e.target.value)} className="flex-1 h-9 px-3 rounded-lg border border-dark-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-court-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Compliance</label>
            <div className="flex gap-2">
              {(['NONE', 'CARA', 'VARA', 'RARA'] as const).map(c => (
                <button key={c} onClick={() => setCompliance(c)}
                  className={`flex-1 h-8 rounded-lg text-[11px] font-bold transition-all ${compliance === c ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <ToggleRow label="Competitive" desc="Is this a competitive event?" on={competitive} onToggle={() => setCompetitive(!competitive)} />
            <ToggleRow label="Skilled Events" desc="Track skilled event data" on={skilled} onToggle={() => setSkilled(!skilled)} />
            <ToggleRow label="Travel Possible" desc="Can this event involve travel?" on={travel} onToggle={() => setTravel(!travel)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2"><Save size={15} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Activity ──────────────────────────────────────────
function ActivitySettings() {
  return (
    <div className="space-y-4">
      {settingsActivities.map(act => (
        <div key={act.id} className="bg-white rounded-xl border border-dark-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-dark-100">
            <h3 className="text-sm font-bold text-dark-800">{act.name}</h3>
            <span className="text-xs text-dark-400">{act.linkedEventTypeIds.length} event types linked</span>
          </div>
          <div className="p-4">
            <div className="space-y-1.5">
              {act.linkedEventTypeIds.map((etId, i) => {
                const et = settingsEventTypes.find(e => e.id === etId);
                if (!et) return null;
                return (
                  <div key={etId} className="flex items-center gap-3 px-3 py-2.5 bg-dark-50/60 rounded-lg group">
                    <GripVertical size={14} className="text-dark-300 cursor-grab" />
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: et.color }} />
                    <span className="text-sm font-medium text-dark-700 flex-1">{et.name}</span>
                    <span className="text-[10px] text-dark-400">#{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Facility Centers & Facilities ─────────────────────
function FacilitiesSettings() {
  const [showModal, setShowModal] = useState(false);
  const [editFC, setEditFC] = useState<SettingsFacilityCenter | null>(null);
  const [expandedFc, setExpandedFc] = useState<string | null>(settingsFacilityCenters[0]?.id || null);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [editFacility, setEditFacility] = useState<SettingsFacility | null>(null);
  const [activeFcId, setActiveFcId] = useState<string>('');

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditFC(null); setShowModal(true); }} className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Create Facility Center</button>
      </div>
      <div className="space-y-3">
        {settingsFacilityCenters.map(fc => {
          const isOpen = expandedFc === fc.id;
          return (
            <div key={fc.id} className="bg-white rounded-xl border border-dark-100 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-50/30" onClick={() => setExpandedFc(isOpen ? null : fc.id)}>
                <GripVertical size={14} className="text-dark-300" />
                <Warehouse size={16} className="text-court-500" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-dark-800">{fc.name}</p>
                  <p className="text-[11px] text-dark-400">{fc.facilities.length} facilities</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setEditFC(fc); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><Pencil size={13} /></button>
                <button onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={13} /></button>
                <ChevronDown size={14} className={`text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 py-3 border-t border-dark-100 bg-dark-50/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-dark-400">Facilities</span>
                        <button onClick={() => { setActiveFcId(fc.id); setEditFacility(null); setShowFacilityModal(true); }}
                          className="text-[11px] font-semibold text-court-500 hover:underline flex items-center gap-1"><Plus size={12} /> Add Facility</button>
                      </div>
                      <div className="space-y-1">
                        {fc.facilities.map(f => (
                          <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-dark-100 group">
                            <GripVertical size={12} className="text-dark-300" />
                            <span className="text-xs font-medium text-dark-700 flex-1">{f.name}</span>
                            <button onClick={() => { setActiveFcId(fc.id); setEditFacility(f); setShowFacilityModal(true); }}
                              className="p-1 rounded hover:bg-dark-50 text-dark-400 opacity-0 group-hover:opacity-100"><Pencil size={12} /></button>
                            <button className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {showModal && <CrudModal title={editFC ? 'Edit Facility Center' : 'Create Facility Center'} onClose={() => { setShowModal(false); setEditFC(null); }}
          fields={[{ label: 'Name', value: editFC?.name || '', type: 'text' }, { label: 'Activity', value: 'Football', type: 'select', options: ['Football'] }]} />}
        {showFacilityModal && <CrudModal title={editFacility ? 'Edit Facility' : 'Add Facility'} onClose={() => { setShowFacilityModal(false); setEditFacility(null); }}
          fields={[{ label: 'Name', value: editFacility?.name || '', type: 'text' }]} />}
      </AnimatePresence>
    </div>
  );
}

// ── Tags ──────────────────────────────────────────────
function TagsSettings() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SettingsTag | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Create Tag</button>
      </div>
      <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-dark-50/60">
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Tag Name</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Activity</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-dark-100">
            {settingsTags.map(tag => (
              <tr key={tag.id} className="hover:bg-dark-50/30">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Tag size={14} className="text-court-500" /><span className="text-sm font-semibold text-dark-800">{tag.name}</span></div></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-court-50 text-court-700 rounded text-[10px] font-semibold">{tag.activityName}</span></td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={() => { setEditItem(tag); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>{showModal && <CrudModal title={editItem ? 'Edit Tag' : 'Create Tag'} onClose={() => { setShowModal(false); setEditItem(null); }}
        fields={[{ label: 'Activity', value: editItem?.activityName || '', type: 'select', options: ['Football'], disabled: !!editItem }, { label: 'Name', value: editItem?.name || '', type: 'text' }]} />}</AnimatePresence>
    </div>
  );
}

// ── Stats Configuration ───────────────────────────────
function StatsSettings() {
  const [defs, setDefs] = useState<StatDefinition[]>(statDefinitions);
  const [scopeFilter, setScopeFilter] = useState<'all' | StatScope>('all');
  const [showModal, setShowModal] = useState(false);
  const [editDef, setEditDef] = useState<StatDefinition | null>(null);

  const filtered = defs.filter(d => scopeFilter === 'all' || d.scope === scopeFilter);
  const teamDefs = filtered.filter(d => d.scope === 'team');
  const indDefs = filtered.filter(d => d.scope === 'individual');
  const computedCount = defs.filter(d => d.type === 'computed').length;
  const manualCount = defs.filter(d => d.type === 'manual').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-dark-500">{defs.length} stats defined &middot; <span className="text-court-600 font-semibold">{computedCount} computed</span> &middot; {manualCount} manual</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5">
            {(['all', 'team', 'individual'] as const).map(s => (
              <button key={s} onClick={() => setScopeFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${scopeFilter === s ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>{s}</button>
            ))}
          </div>
          <button onClick={() => { setEditDef(null); setShowModal(true); }}
            className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Add Stat</button>
        </div>
      </div>

      {/* Team Stats */}
      {(scopeFilter === 'all' || scopeFilter === 'team') && teamDefs.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Team Stats ({teamDefs.length})
          </h3>
          {statGroups.filter(g => g.scope === 'team').map(group => {
            const groupDefs = teamDefs.filter(d => d.group === group.key);
            if (groupDefs.length === 0) return null;
            return (
              <div key={group.key} className="mb-3 bg-white border border-dark-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-dark-100 flex items-center gap-2" style={{ backgroundColor: group.color + '06' }}>
                  <div className="w-2 h-4 rounded-full" style={{ backgroundColor: group.color }} />
                  <span className="text-xs font-bold" style={{ color: group.color }}>{group.label}</span>
                  <span className="ml-auto text-[10px] text-dark-400">{groupDefs.length} stats</span>
                </div>
                <div className="divide-y divide-dark-100">
                  {groupDefs.map(def => <StatDefRow key={def.id} def={def} onEdit={() => { setEditDef(def); setShowModal(true); }} onDelete={() => setDefs(p => p.filter(d => d.id !== def.id))} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Individual Stats */}
      {(scopeFilter === 'all' || scopeFilter === 'individual') && indDefs.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-court-500" /> Individual Stats ({indDefs.length})
          </h3>
          {statGroups.filter(g => g.scope === 'individual').map(group => {
            const groupDefs = indDefs.filter(d => d.group === group.key);
            if (groupDefs.length === 0) return null;
            return (
              <div key={group.key} className="mb-3 bg-white border border-dark-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-dark-100 flex items-center gap-2" style={{ backgroundColor: group.color + '06' }}>
                  <div className="w-2 h-4 rounded-full" style={{ backgroundColor: group.color }} />
                  <span className="text-xs font-bold" style={{ color: group.color }}>{group.label}</span>
                  <span className="ml-auto text-[10px] text-dark-400">{groupDefs.length} stats</span>
                </div>
                <div className="divide-y divide-dark-100">
                  {groupDefs.map(def => <StatDefRow key={def.id} def={def} onEdit={() => { setEditDef(def); setShowModal(true); }} onDelete={() => setDefs(p => p.filter(d => d.id !== def.id))} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && <StatDefModal def={editDef} allDefs={defs} onClose={() => { setShowModal(false); setEditDef(null); }}
          onSave={def => { if (editDef) { setDefs(p => p.map(d => d.id === def.id ? def : d)); } else { setDefs(p => [...p, { ...def, id: `sd-${Date.now()}` }]); } setShowModal(false); setEditDef(null); }} />}
      </AnimatePresence>
    </div>
  );
}

function StatDefRow({ def, onEdit, onDelete }: { def: StatDefinition; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-50/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-dark-800">{def.label}</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-dark-100 text-dark-500">{def.short}</span>
          {def.type === 'computed' ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-600">Computed</span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-dark-50 text-dark-400">Manual</span>
          )}
          {def.unit && <span className="text-[10px] text-dark-400">{def.unit}</span>}
        </div>
        {def.type === 'computed' && (
          <p className="text-[10px] text-purple-500 mt-0.5 font-mono">{getFormulaDisplay(def)}</p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function StatDefModal({ def, allDefs, onClose, onSave }: {
  def: StatDefinition | null; allDefs: StatDefinition[]; onClose: () => void;
  onSave: (d: StatDefinition) => void;
}) {
  const [key, setKey] = useState(def?.key || '');
  const [label, setLabel] = useState(def?.label || '');
  const [short, setShort] = useState(def?.short || '');
  const [scope, setScope] = useState<StatScope>(def?.scope || 'individual');
  const [group, setGroup] = useState(def?.group || '');
  const [type, setType] = useState<'manual' | 'computed'>(def?.type || 'manual');
  const [unit, setUnit] = useState(def?.unit || '');
  const [formulaOp, setFormulaOp] = useState(def?.formula?.op || 'sum_individual');
  const [sourceStatKey, setSourceStatKey] = useState(def?.formula?.sourceStatKey || '');
  const [numeratorKey, setNumeratorKey] = useState(def?.formula?.numeratorKey || '');
  const [denominatorKey, setDenominatorKey] = useState(def?.formula?.denominatorKey || '');
  const [formulaScope, setFormulaScope] = useState<StatScope>(def?.formula?.sourceScope || 'individual');

  const scopeGroups = statGroups.filter(g => g.scope === scope);
  const availableStats = allDefs.filter(d => d.scope === formulaScope && d.key !== key);
  const indStats = allDefs.filter(d => d.scope === 'individual');

  const handleSave = () => {
    const newDef: StatDefinition = {
      id: def?.id || '', key, label, short, scope, group, type, unit: unit || undefined,
      formula: type === 'computed' ? {
        op: formulaOp as any,
        sourceStatKey: formulaOp === 'sum_individual' ? sourceStatKey : undefined,
        numeratorKey: formulaOp !== 'sum_individual' ? numeratorKey : undefined,
        denominatorKey: formulaOp !== 'sum_individual' ? denominatorKey : undefined,
        sourceScope: formulaScope,
      } : undefined,
    };
    onSave(newDef);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-base font-bold text-dark-900">{def ? 'Edit Stat' : 'Add Stat'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Scope */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Scope *</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setScope('team'); setGroup(''); }}
                className={`h-9 rounded-xl text-xs font-semibold transition-all ${scope === 'team' ? 'bg-blue-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>Team Stat</button>
              <button onClick={() => { setScope('individual'); setGroup(''); }}
                className={`h-9 rounded-xl text-xs font-semibold transition-all ${scope === 'individual' ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>Individual Stat</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Label *</label>
              <input value={label} onChange={e => { setLabel(e.target.value); if (!def) setKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_')); }}
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" placeholder="e.g. Shot Accuracy" /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Short *</label>
              <input value={short} onChange={e => setShort(e.target.value)} maxLength={5}
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" placeholder="SA%" /></div>
            <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Unit</label>
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. %"
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" /></div>
          </div>

          <div><label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Group *</label>
            <select value={group} onChange={e => setGroup(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
              <option value="">Select group...</option>
              {scopeGroups.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
          </div>

          {/* Type: Manual or Computed */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setType('manual')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${type === 'manual' ? 'border-court-500 bg-court-50/50' : 'border-dark-200 hover:border-dark-300'}`}>
                <p className="text-xs font-bold text-dark-900">Manual</p>
                <p className="text-[10px] text-dark-400 mt-0.5">Entered by coach during event</p>
              </button>
              <button onClick={() => setType('computed')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${type === 'computed' ? 'border-purple-500 bg-purple-50/50' : 'border-dark-200 hover:border-dark-300'}`}>
                <p className="text-xs font-bold text-dark-900">Computed</p>
                <p className="text-[10px] text-dark-400 mt-0.5">Auto-calculated from a formula</p>
              </button>
            </div>
          </div>

          {/* Formula builder */}
          {type === 'computed' && (
            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/20 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Formula</p>
              <div>
                <label className="block text-[10px] font-bold text-dark-500 mb-1">Operation</label>
                <select value={formulaOp} onChange={e => setFormulaOp(e.target.value as any)}
                  className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500/30">
                  <option value="sum_individual">SUM of individual stat → team total</option>
                  <option value="percentage">(A / B) × 100 — Percentage</option>
                  <option value="divide">A / B — Division</option>
                </select>
              </div>

              {formulaOp === 'sum_individual' && (
                <div>
                  <label className="block text-[10px] font-bold text-dark-500 mb-1">Sum of which individual stat?</label>
                  <select value={sourceStatKey} onChange={e => setSourceStatKey(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500/30">
                    <option value="">Select...</option>
                    {indStats.map(s => <option key={s.key} value={s.key}>{s.label} ({s.short})</option>)}
                  </select>
                  <p className="text-[10px] text-purple-500 mt-1 font-mono">Result = SUM({sourceStatKey || '...'}) across all players</p>
                </div>
              )}

              {(formulaOp === 'percentage' || formulaOp === 'divide') && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-dark-500 mb-1">Source scope</label>
                    <div className="flex gap-2">
                      <button onClick={() => setFormulaScope('team')} className={`flex-1 h-7 rounded-lg text-[10px] font-bold ${formulaScope === 'team' ? 'bg-blue-500 text-white' : 'bg-dark-50 text-dark-500'}`}>Team stats</button>
                      <button onClick={() => setFormulaScope('individual')} className={`flex-1 h-7 rounded-lg text-[10px] font-bold ${formulaScope === 'individual' ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500'}`}>Individual stats</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-dark-500 mb-1">Numerator (A)</label>
                      <select value={numeratorKey} onChange={e => setNumeratorKey(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500/30">
                        <option value="">Select...</option>
                        {availableStats.filter(s => s.scope === formulaScope).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-dark-500 mb-1">Denominator (B)</label>
                      <select value={denominatorKey} onChange={e => setDenominatorKey(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-purple-500/30">
                        <option value="">Select...</option>
                        {availableStats.filter(s => s.scope === formulaScope).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-purple-500 font-mono">
                    Result = {numeratorKey || 'A'} / {denominatorKey || 'B'}{formulaOp === 'percentage' ? ' × 100' : ''}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={handleSave} disabled={!label || !short || !group}
            className="h-8 px-4 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-1.5"><Save size={13} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Visibility Group Picker ───────────────────────────
const DESIGNATION_MOCK_COUNTS: Record<string, number> = {
  'des-01': 1, 'des-02': 1, 'des-03': 2, 'des-04': 1,
  'des-05': 1, 'des-06': 1, 'des-07': 1, 'des-08': 14, 'des-09': 1,
};

function VisibilityGroupPicker({
  selected,
  onClose,
  onDone,
}: {
  selected: string[];
  onClose: () => void;
  onDone: (sel: string[]) => void;
}) {
  const [localSelected, setLocalSelected] = useState<string[]>(selected);
  const [search, setSearch] = useState('');

  const filtered = designations.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setLocalSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const selectedDesigs = designations.filter(d => localSelected.includes(d.id));

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <h3 className="text-base font-bold text-dark-900">Select Visibility Groups</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left — searchable designation list */}
          <div className="flex-1 border-r border-dark-100 flex flex-col min-h-0">
            {/* Search */}
            <div className="px-4 py-3 border-b border-dark-100 shrink-0">
              <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-dark-200 bg-white focus-within:border-court-400 focus-within:ring-1 focus-within:ring-court-400/20 transition-colors">
                <Search size={13} className="text-dark-400 shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search groups..."
                  className="flex-1 text-xs bg-transparent focus:outline-none text-dark-700 placeholder:text-dark-400"
                />
              </div>
            </div>

            {/* Designation list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map(des => {
                const isChecked = localSelected.includes(des.id);
                const count = DESIGNATION_MOCK_COUNTS[des.id] ?? 1;
                return (
                  <button
                    key={des.id}
                    onClick={() => toggle(des.id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-dark-50 transition-colors border-b border-dark-50 last:border-0 text-left"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked ? 'bg-court-500 border-court-500' : 'border-dark-300 bg-white'
                    }`}>
                      {isChecked && <Check size={10} className="text-white" />}
                    </div>
                    <UserCog size={15} className="text-dark-400 shrink-0" />
                    <span className="flex-1 text-sm font-semibold text-dark-800">{des.name}</span>
                    <span className="text-xs text-dark-400 shrink-0">({count})</span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-dark-400 text-center py-8">No groups found</p>
              )}
            </div>
          </div>

          {/* Right — selected groups */}
          <div className="w-60 shrink-0 flex flex-col">
            <div className="px-4 py-3.5 border-b border-dark-100 shrink-0">
              <p className="text-xs font-bold text-dark-800">Selected Groups</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {selectedDesigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-10 h-10 rounded-xl bg-dark-50 flex items-center justify-center mb-2">
                    <Users size={18} className="text-dark-300" />
                  </div>
                  <p className="text-xs text-dark-400 leading-relaxed">
                    No groups selected.<br />Check groups on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDesigs.map(des => (
                    <div
                      key={des.id}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-dark-50 hover:bg-dark-100 transition-colors group"
                    >
                      <UserCog size={13} className="text-dark-500 shrink-0" />
                      <span className="flex-1 text-xs font-medium text-dark-700 truncate">{des.name}</span>
                      <button
                        onClick={() => toggle(des.id)}
                        className="p-0.5 rounded text-dark-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-dark-100 shrink-0">
          <p className="text-[11px] text-dark-400">
            {localSelected.length} group{localSelected.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDone(localSelected)}
              className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Report Types ─────────────────────────────────────
function ReportTypesSettings() {
  const [items, setItems] = useState<ReportTypeConfig[]>(reportTypes);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ReportTypeConfig | null>(null);

  const fieldTypeIcon: Record<ReportFieldType, React.ReactNode> = {
    text:     <Type size={11} />,
    textarea: <AlignLeft size={11} />,
    number:   <Hash size={11} />,
    date:     <CalendarDays size={11} />,
    select:   <List size={11} />,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"
        >
          <Plus size={14} /> Create Report Type
        </button>
      </div>

      <div className="space-y-3">
        {items.map((rt, i) => (
          <div key={rt.id} className="bg-white rounded-xl border border-dark-100 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: rt.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-dark-800">{rt.name}</p>
                <p className="text-[11px] text-dark-400 mt-0.5">
                  {rt.defaultSections.length} section{rt.defaultSections.length !== 1 ? 's' : ''}
                  {rt.fields.length > 0 && <> · {rt.fields.length} field{rt.fields.length !== 1 ? 's' : ''}</>}
                </p>
              </div>
              <button
                onClick={() => { setEditItem(rt); setShowModal(true); }}
                className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"
              >
                <Pencil size={13} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>

            {/* Sections + fields preview */}
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {rt.defaultSections.map(s => (
                <span key={s} className="px-2 py-0.5 bg-dark-50 text-dark-500 rounded-md text-[11px] font-medium">{s}</span>
              ))}
              {rt.fields.map(f => (
                <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                  style={{ backgroundColor: rt.color + '15', color: rt.color }}>
                  {fieldTypeIcon[f.type]}
                  {f.label}
                  {f.required && <span className="opacity-60">*</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <ReportTypeModal
            item={editItem}
            onClose={() => { setShowModal(false); setEditItem(null); }}
            onSave={saved => {
              setItems(prev => editItem
                ? prev.map(r => r.id === saved.id ? saved : r)
                : [...prev, saved]
              );
              setShowModal(false);
              setEditItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportTypeModal({ item, onClose, onSave }: {
  item: ReportTypeConfig | null;
  onClose: () => void;
  onSave: (rt: ReportTypeConfig) => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [color, setColor] = useState(item?.color || '#3B82F6');
  const [sections, setSections] = useState<string[]>(item?.defaultSections || ['Overview']);
  const [fields, setFields] = useState<ReportFieldDef[]>(item?.fields || []);
  const [newSection, setNewSection] = useState('');
  const [defaultVisibility, setDefaultVisibility] = useState<string[]>(
    item?.defaultVisibility || []
  );
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);
  const [availableToGuardians, setAvailableToGuardians] = useState(item?.availableToGuardians ?? false);

  const fieldTypeOptions: { value: ReportFieldType; label: string; icon: React.ReactNode }[] = [
    { value: 'text',     label: 'Short Text',  icon: <Type size={13} /> },
    { value: 'textarea', label: 'Long Text',   icon: <AlignLeft size={13} /> },
    { value: 'number',   label: 'Number',      icon: <Hash size={13} /> },
    { value: 'date',     label: 'Date',        icon: <CalendarDays size={13} /> },
    { value: 'select',   label: 'Dropdown',    icon: <List size={13} /> },
  ];

  function newFieldId() {
    return `rf-new-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  }

  function addField() {
    setFields(prev => [...prev, { id: newFieldId(), label: '', type: 'text', required: false }]);
  }

  function updateField(idx: number, patch: Partial<ReportFieldDef>) {
    setFields(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
  }

  function removeField(idx: number) {
    setFields(prev => prev.filter((_, i) => i !== idx));
  }

  function addSection() {
    const s = newSection.trim();
    if (s && !sections.includes(s)) { setSections(prev => [...prev, s]); setNewSection(''); }
  }

  function removeSection(idx: number) {
    if (sections.length > 1) setSections(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: item?.id || `rt-${Date.now()}`,
      name: name.trim(),
      color,
      defaultSections: sections.filter(Boolean),
      fields: fields.filter(f => f.label.trim()),
      defaultVisibility,
      availableToGuardians,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[88vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
              <ScrollText size={14} style={{ color }} />
            </div>
            <h3 className="text-base font-bold text-dark-900">{item ? 'Edit Report Type' : 'Create Report Type'}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name + Color */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Name *</label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Pre-Match Analysis"
                className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-dark-200 cursor-pointer p-0.5" />
                <input value={color} onChange={e => setColor(e.target.value)}
                  className="w-24 h-9 px-2 rounded-lg border border-dark-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-court-500/20" />
              </div>
            </div>
          </div>

          {/* Default Sections */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-2">Default Sections</label>
            <div className="space-y-1.5 mb-2">
              {sections.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-dark-50 rounded-lg group">
                  <GripVertical size={13} className="text-dark-300 shrink-0" />
                  <input
                    value={s}
                    onChange={e => setSections(prev => prev.map((x, i) => i === idx ? e.target.value : x))}
                    className="flex-1 text-xs font-medium text-dark-700 bg-transparent focus:outline-none"
                  />
                  {sections.length > 1 && (
                    <button onClick={() => removeSection(idx)} className="p-0.5 rounded text-dark-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSection} onChange={e => setNewSection(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSection()}
                placeholder="Add section..."
                className="flex-1 h-8 px-3 rounded-lg border border-dashed border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-300"
              />
              <button onClick={addSection}
                className="h-8 px-3 rounded-lg bg-dark-100 text-dark-600 text-xs font-semibold hover:bg-dark-200 flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400">Fields</label>
              <p className="text-[10px] text-dark-400">Shown above the report body when filling it in</p>
            </div>

            {fields.length === 0 && (
              <div className="px-4 py-5 rounded-xl border border-dashed border-dark-200 text-center mb-3">
                <p className="text-xs text-dark-400">No fields yet. Add fields to capture structured data.</p>
              </div>
            )}

            <div className="space-y-2 mb-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="rounded-xl border border-dark-100 bg-dark-50/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={field.label} onChange={e => updateField(idx, { label: e.target.value })}
                      placeholder="Field label *"
                      className="flex-1 h-8 px-2.5 rounded-lg border border-dark-200 text-xs font-semibold text-dark-700 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20"
                    />
                    <select
                      value={field.type} onChange={e => updateField(idx, { type: e.target.value as ReportFieldType, options: undefined })}
                      className="h-8 px-2 rounded-lg border border-dark-200 text-xs font-medium text-dark-700 bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20"
                    >
                      {fieldTypeOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateField(idx, { required: !field.required })}
                      title="Required"
                      className={`h-8 px-2.5 rounded-lg border text-[11px] font-bold transition-colors ${
                        field.required ? 'bg-court-50 border-court-200 text-court-600' : 'bg-white border-dark-200 text-dark-400 hover:border-dark-300'
                      }`}
                    >
                      REQ
                    </button>
                    <button onClick={() => removeField(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {field.type === 'select' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Options (comma-separated)</label>
                      <input
                        value={field.options?.join(', ') || ''}
                        onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="e.g. Win, Draw, Loss"
                        className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addField}
              className="flex items-center gap-1.5 text-xs font-semibold text-court-500 hover:text-court-600 transition-colors">
              <Plus size={13} /> Add Field
            </button>
          </div>

          {/* Default Visibility */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Default Visibility</label>
            <p className="text-[11px] text-dark-400 mb-2">Which staff groups can view reports of this type by default.</p>

            {/* Selected group pills */}
            {defaultVisibility.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {defaultVisibility.map(id => {
                  const des = designations.find(d => d.id === id);
                  if (!des) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-court-50 text-court-700 text-xs font-medium border border-court-100">
                      <Users size={11} />
                      {des.name}
                    </span>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowVisibilityPicker(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-dark-300 text-xs font-semibold text-dark-500 hover:border-court-400 hover:text-court-600 transition-colors"
            >
              <Users size={13} />
              {defaultVisibility.length === 0 ? 'Select Groups' : 'Edit Groups'}
            </button>
          </div>

          {/* Guardian Access */}
          <div className={`rounded-xl border p-3.5 transition-colors ${availableToGuardians ? 'border-purple-200 bg-purple-50/50' : 'border-dark-100'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Shield size={13} className={availableToGuardians ? 'text-purple-600' : 'text-dark-400'} />
                  <p className={`text-xs font-bold ${availableToGuardians ? 'text-purple-800' : 'text-dark-700'}`}>
                    Available to Guardians
                  </p>
                </div>
                <p className="text-[11px] text-dark-400">
                  When enabled, guardians can view this report — but only once it is <span className="font-semibold">published</span>. Draft reports remain private.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAvailableToGuardians(v => !v)}
                className={`shrink-0 w-10 h-5 rounded-full transition-colors flex items-center ${availableToGuardians ? 'bg-purple-500 justify-end' : 'bg-dark-200 justify-start'}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-2">
            <Save size={15} /> Save
          </button>
        </div>
      </motion.div>

      {/* Visibility Group Picker — renders above the report type modal */}
      <AnimatePresence>
        {showVisibilityPicker && (
          <VisibilityGroupPicker
            selected={defaultVisibility}
            onClose={() => setShowVisibilityPicker(false)}
            onDone={sel => { setDefaultVisibility(sel); setShowVisibilityPicker(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Seasons ──────────────────────────────────────────
function SeasonsSettings() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Season | null>(null);
  const [localSeasons, setLocalSeasons] = useState<Season[]>(seasons);

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-600',
    upcoming: 'bg-blue-50 text-blue-600',
    completed: 'bg-dark-50 text-dark-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"><Plus size={14} /> Create Season</button>
      </div>
      {activities.map(act => {
        const actSeasons = localSeasons.filter(s => s.activityId === act.id);
        if (actSeasons.length === 0) return null;
        return (
          <div key={act.id} className="bg-white rounded-xl border border-dark-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-dark-100">
              <h3 className="text-sm font-bold text-dark-800">{act.name}</h3>
              <span className="text-xs text-dark-400">{actSeasons.length} season{actSeasons.length !== 1 ? 's' : ''}</span>
            </div>
            <table className="w-full">
              <thead><tr className="bg-dark-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Season</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Start Date</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">End Date</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-dark-100">
                {actSeasons.map(s => (
                  <tr key={s.id} className="hover:bg-dark-50/30">
                    <td className="px-4 py-3"><span className="text-sm font-semibold text-dark-800">{s.name}</span></td>
                    <td className="px-4 py-3 text-xs text-dark-500">{new Date(s.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-xs text-dark-500">{new Date(s.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${statusColors[s.status] || ''}`}>{s.status}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <button onClick={() => { setEditItem(s); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700"><Pencil size={14} /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <AnimatePresence>{showModal && <SeasonModal item={editItem} onClose={() => { setShowModal(false); setEditItem(null); }} onSave={(s) => {
        if (editItem) {
          setLocalSeasons(prev => prev.map(x => x.id === s.id ? s : x));
        } else {
          setLocalSeasons(prev => [...prev, s]);
        }
        setShowModal(false); setEditItem(null);
      }} />}</AnimatePresence>
    </div>
  );
}

function SeasonModal({ item, onClose, onSave }: { item: Season | null; onClose: () => void; onSave: (s: Season) => void }) {
  const [activityId, setActivityId] = useState(item?.activityId || 'act-football');
  const [startDate, setStartDate] = useState(item?.startDate || '');
  const [name, setName] = useState(item?.name || '');
  const [status, setStatus] = useState<Season['status']>(item?.status || 'upcoming');

  const actName = activities.find(a => a.id === activityId)?.name || '';

  const endDate = startDate ? (() => {
    const d = new Date(startDate);
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })() : '';

  const autoName = startDate ? (() => {
    const y1 = new Date(startDate).getFullYear();
    const y2 = y1 + 1;
    return `${actName}-Season-${y1}/${String(y2).slice(2)}`;
  })() : '';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h3 className="text-base font-bold text-dark-900">{item ? 'Edit Season' : 'Create Season'}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Activity *</label>
            <select value={activityId} onChange={e => setActivityId(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
              {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Start Date *</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (!item) setName(''); }}
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">End Date (auto-calculated)</label>
            <input type="date" value={endDate} disabled className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-dark-50 text-dark-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Name</label>
            <input value={name || autoName} onChange={e => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Status</label>
            <div className="flex gap-2">
              {(['upcoming', 'active', 'completed'] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 h-8 rounded-lg text-[11px] font-bold capitalize transition-all ${status === s ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={() => {
            if (!startDate) return;
            onSave({
              id: item?.id || `sea-${Date.now()}`,
              name: name || autoName,
              activityId,
              startDate,
              endDate,
              status,
            });
          }} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2"><Save size={15} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════
function FormField({ label, value, placeholder, disabled }: { label: string; value: string; placeholder?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">{label}</label>
      <input defaultValue={value} placeholder={placeholder} disabled={disabled}
        className={`w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 ${disabled ? 'bg-dark-50 text-dark-400 cursor-not-allowed' : ''}`} />
    </div>
  );
}

function TogglePill({ on }: { on: boolean }) {
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${on ? 'bg-green-50 text-green-600' : 'bg-dark-50 text-dark-400'}`}>{on ? 'Yes' : 'No'}</span>;
}

function ToggleRow({ label, desc, on, onToggle }: { label: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-dark-100 hover:border-court-200 transition-colors">
      <div className="text-left"><p className="text-xs font-semibold text-dark-700">{label}</p><p className="text-[10px] text-dark-400">{desc}</p></div>
      <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${on ? 'bg-court-500 justify-end' : 'bg-dark-200 justify-start'}`}>
        <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
      </div>
    </button>
  );
}

interface CrudField { label: string; value: string; type: 'text' | 'select'; options?: string[]; disabled?: boolean }

function CrudModal({ title, onClose, fields }: { title: string; onClose: () => void; fields: CrudField[] }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h3 className="text-base font-bold text-dark-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {fields.map(f => (
            <div key={f.label}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">{f.label} *</label>
              {f.type === 'select' ? (
                <select defaultValue={f.value} disabled={f.disabled} className={`w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20 ${f.disabled ? 'bg-dark-50 text-dark-400' : ''}`}>
                  <option value="">Select...</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input defaultValue={f.value} className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2"><Save size={15} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Attendance Settings (Tabbed Options) ─────────────────
type AttendanceOptionTab = 'option-1' | 'option-2' | 'option-3' | 'option-4' | 'option-5';
function AttendanceSettings() {
  const [activeOption, setActiveOption] = useState<AttendanceOptionTab>('option-2');
  const options: { key: AttendanceOptionTab; label: string }[] = [
    { key: 'option-1', label: 'Option 1' },
    { key: 'option-2', label: 'Option 2' },
    { key: 'option-3', label: 'HRMS' },
    { key: 'option-4', label: 'Option 4' },
    { key: 'option-5', label: 'Option 5' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5 w-fit">
        {options.map(o => (
          <button key={o.key} onClick={() => setActiveOption(o.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeOption === o.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            {o.label}
          </button>
        ))}
      </div>
      {activeOption === 'option-1' && <AttendanceOption1 />}
      {activeOption === 'option-2' && <AttendanceOption2 />}
      {activeOption === 'option-3' && <AttendanceHRMSConfig />}
      {activeOption === 'option-4' && <AttendanceOptionPlaceholder n={4} />}
      {activeOption === 'option-5' && <AttendanceOptionPlaceholder n={5} />}
    </div>
  );
}

// ── Option 3: HRMS Configuration ─────────────────────────
function AttendanceHRMSConfig() {
  const [empConfigs, setEmpConfigs] = useState(employeeTypeConfigs);
  const [schedules, setSchedules] = useState(workSchedules);
  const [policies, setPolicies] = useState(leavePolicies);
  const [payrollSettings] = useState(payrollConfig);
  const [salaryConfig] = useState(salaryTemplates);
  const [reimbursementConfig] = useState(reimbursementCategoryConfigs);
  const [activeSection, setActiveSection] = useState<'employees' | 'schedules' | 'leave' | 'integration' | 'payroll'>('employees');

  const toggleEmployee = (userType: string) => {
    setEmpConfigs(prev => prev.map(c => c.userType === userType ? { ...c, isEmployee: !c.isEmployee } : c));
  };

  const toggleCompensation = (userType: string) => {
    setEmpConfigs(prev => prev.map(c => c.userType === userType ? { ...c, compensationType: c.compensationType === 'hourly' ? 'salaried' : 'hourly' } : c));
  };

  const toggleEventHours = (userType: string) => {
    setEmpConfigs(prev => prev.map(c => c.userType === userType ? { ...c, eventHoursCount: !c.eventHoursCount } : c));
  };

  const sections = [
    { key: 'employees' as const, label: 'Employee Types', icon: Users },
    { key: 'schedules' as const, label: 'Work Schedules', icon: Clock },
    { key: 'leave' as const, label: 'Leave Policies', icon: Calendar },
    { key: 'integration' as const, label: 'Event Integration', icon: Activity },
    { key: 'payroll' as const, label: 'Payroll', icon: DollarSign },
  ];

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-1 bg-dark-50 rounded-lg p-0.5 w-fit">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeSection === s.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-700'}`}>
            <s.icon size={12} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Employee Types */}
      {activeSection === 'employees' && (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-100">
            <h3 className="text-sm font-bold text-dark-900">Employee Type Configuration</h3>
            <p className="text-xs text-dark-400 mt-0.5">Configure which user types are considered employees and their compensation type</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">User Type</th>
                <th className="px-4 py-2.5 text-center">Is Employee</th>
                <th className="px-4 py-2.5 text-center">Compensation</th>
              </tr>
            </thead>
            <tbody>
              {empConfigs.map(c => (
                <tr key={c.userType} className="border-t border-dark-50 hover:bg-dark-25">
                  <td className="px-4 py-2.5 font-medium text-dark-700">{c.userType}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => toggleEmployee(c.userType)} className="inline-flex">
                      {c.isEmployee
                        ? <ToggleRight size={20} className="text-green-500" />
                        : <ToggleLeft size={20} className="text-dark-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {c.isEmployee && (
                      <button onClick={() => toggleCompensation(c.userType)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.compensationType === 'hourly' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {c.compensationType === 'hourly' ? <Clock size={10} /> : <DollarSign size={10} />}
                        {c.compensationType === 'hourly' ? 'Hourly' : 'Salaried'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Work Schedules */}
      {activeSection === 'schedules' && (
        <div className="space-y-3">
          {schedules.map(schedule => (
            <div key={schedule.id} className="bg-white border border-dark-100 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-dark-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-dark-900">{schedule.name}</h3>
                  <p className="text-xs text-dark-400 mt-0.5">Applies to: {schedule.userTypes.join(', ')}</p>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><Pencil size={14} /></button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                    <th className="px-4 py-2">Day</th>
                    <th className="px-4 py-2 text-center">Work Day</th>
                    <th className="px-4 py-2 text-center">Start</th>
                    <th className="px-4 py-2 text-center">End</th>
                    <th className="px-4 py-2 text-center">Required Hours</th>
                    <th className="px-4 py-2 text-center">Grace (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.days.map(d => (
                    <tr key={d.day} className={`border-t border-dark-50 ${!d.isWorkDay ? 'bg-dark-25 text-dark-300' : ''}`}>
                      <td className="px-4 py-2 font-medium capitalize">{d.day}</td>
                      <td className="px-4 py-2 text-center">
                        {d.isWorkDay
                          ? <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          : <span className="inline-block w-2 h-2 rounded-full bg-dark-200" />}
                      </td>
                      <td className="px-4 py-2 text-center">{d.isWorkDay ? d.startTime : '—'}</td>
                      <td className="px-4 py-2 text-center">{d.isWorkDay ? d.endTime : '—'}</td>
                      <td className="px-4 py-2 text-center">{d.isWorkDay ? (d.requiredHours > 0 ? `${d.requiredHours}h` : 'Flexible') : '—'}</td>
                      <td className="px-4 py-2 text-center">{d.isWorkDay ? `${d.graceMinutes}m` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-dark-200 text-xs font-semibold text-dark-400 hover:text-dark-600 hover:border-dark-300 w-full justify-center">
            <Plus size={14} /> Add Work Schedule
          </button>
        </div>
      )}

      {/* Leave Policies */}
      {activeSection === 'leave' && (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-100">
            <h3 className="text-sm font-bold text-dark-900">Leave Policies</h3>
            <p className="text-xs text-dark-400 mt-0.5">Configure annual quotas and approval requirements for each leave type</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">Leave Type</th>
                <th className="px-4 py-2.5 text-center">Annual Quota</th>
                <th className="px-4 py-2.5 text-center">Carry Forward</th>
                <th className="px-4 py-2.5 text-center">Max Carry</th>
                <th className="px-4 py-2.5 text-center">Requires Approval</th>
                <th className="px-4 py-2.5">Applicable To</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(p => (
                <tr key={p.id} className="border-t border-dark-50 hover:bg-dark-25">
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.leaveType === 'sick' ? 'bg-red-50 text-red-600' :
                      p.leaveType === 'casual' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold text-dark-700">{p.annualQuota} days</td>
                  <td className="px-4 py-2.5 text-center">
                    {p.carryForward
                      ? <Check size={14} className="text-green-500 mx-auto" />
                      : <X size={14} className="text-dark-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-2.5 text-center text-dark-500">{p.carryForward ? `${p.maxCarryForward} days` : '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    {p.requiresApproval
                      ? <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Required</span>
                      : <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Auto-approve</span>}
                  </td>
                  <td className="px-4 py-2.5 text-dark-500 text-[10px]">{p.applicableUserTypes.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Event Integration */}
      {activeSection === 'integration' && (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-100">
            <h3 className="text-sm font-bold text-dark-900">Event Attendance Integration</h3>
            <p className="text-xs text-dark-400 mt-0.5">Configure which employee types have their event attendance hours counted toward HRMS work hours</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                <th className="px-4 py-2.5">User Type</th>
                <th className="px-4 py-2.5 text-center">Count Event Hours</th>
                <th className="px-4 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {empConfigs.filter(c => c.isEmployee).map(c => (
                <tr key={c.userType} className="border-t border-dark-50 hover:bg-dark-25">
                  <td className="px-4 py-2.5 font-medium text-dark-700">{c.userType}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => toggleEventHours(c.userType)} className="inline-flex">
                      {c.eventHoursCount
                        ? <ToggleRight size={20} className="text-green-500" />
                        : <ToggleLeft size={20} className="text-dark-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-dark-400">
                    {c.eventHoursCount
                      ? 'Event attendance hours will be added to daily HRMS work hours'
                      : 'Only direct HRMS check-in/out hours will be tracked'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSection === 'payroll' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Pay Period', value: payrollSettings.payPeriod.replace('_', ' '), sub: 'Cycle', tone: 'text-dark-900' },
              { label: 'Pay Day', value: `${payrollSettings.payDay}`, sub: 'Of every month', tone: 'text-dark-900' },
              { label: 'Overtime Multiplier', value: `${payrollSettings.overtimeMultiplier}x`, sub: 'Applied to extra hours', tone: 'text-blue-600' },
              { label: 'Default Currency', value: payrollSettings.currency, sub: 'Razorpay ready', tone: 'text-green-600' },
            ].map(card => (
              <div key={card.label} className="bg-white border border-dark-100 rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">{card.label}</p>
                <p className={`text-lg font-extrabold mt-1 capitalize ${card.tone}`}>{card.value}</p>
                <p className="text-[10px] text-dark-300 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-dark-100">
              <h3 className="text-sm font-bold text-dark-900">Salary Templates</h3>
              <p className="text-xs text-dark-400 mt-0.5">Base or hourly pay setup used by the Payroll module for monthly calculations and payslips</p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                  <th className="px-4 py-2.5">Employee Type</th>
                  <th className="px-4 py-2.5">Pay Model</th>
                  <th className="px-4 py-2.5">Base / Rate</th>
                  <th className="px-4 py-2.5">Allowances</th>
                  <th className="px-4 py-2.5">Deductions</th>
                </tr>
              </thead>
              <tbody>
                {salaryConfig.map(template => {
                  const employeeConfig = empConfigs.find(config => config.userType === template.employeeType);
                  const allowanceTotal = template.allowances.reduce((sum, allowance) => sum + allowance.amount, 0);
                  return (
                    <tr key={template.employeeType} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5 font-semibold text-dark-800">{template.employeeType}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${employeeConfig?.compensationType === 'hourly' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {employeeConfig?.compensationType === 'hourly' ? 'Hourly' : 'Salaried'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-dark-600 font-bold">
                        {employeeConfig?.compensationType === 'hourly' ? `INR ${template.hourlyRate}/hr` : `INR ${template.baseSalary.toLocaleString('en-IN')}`}
                      </td>
                      <td className="px-4 py-2.5 text-dark-500">{template.allowances.length} items · INR {allowanceTotal.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-dark-500">{template.deductions.map(deduction => `${deduction.name} (${deduction.type === 'percentage' ? `${deduction.value}%` : `INR ${deduction.value}`})`).join(', ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-dark-100">
                <h3 className="text-sm font-bold text-dark-900">Reimbursement Categories</h3>
                <p className="text-xs text-dark-400 mt-0.5">Approved claims flow into the payroll run and appear on the employee payslip</p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-dark-50 text-dark-500 font-semibold text-left">
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Monthly Limit</th>
                    <th className="px-4 py-2.5">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {reimbursementConfig.map(category => (
                    <tr key={category.category} className="border-t border-dark-50 hover:bg-dark-25">
                      <td className="px-4 py-2.5 font-semibold text-dark-800">{category.label}</td>
                      <td className="px-4 py-2.5 text-dark-600">INR {category.monthlyLimit.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${category.requiresReceipt ? 'bg-blue-50 text-blue-600' : 'bg-dark-50 text-dark-500'}`}>
                          {category.requiresReceipt ? 'Required' : 'Optional'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl p-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-dark-900">Disbursement & Compliance</h3>
                <p className="text-xs text-dark-400 mt-0.5">Frontend mock configuration for payout processing and payroll controls</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-dark-25 border border-dark-100 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Payout Provider</p>
                  <p className="text-sm font-bold text-dark-800 mt-1 capitalize">{payrollSettings.payoutProvider}</p>
                  <p className="text-[11px] text-dark-400 mt-1">Payroll disbursement buttons in the module are wired for Razorpay batch payouts.</p>
                </div>
                <div className="rounded-xl bg-dark-25 border border-dark-100 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-dark-400">Absence Handling</p>
                  <p className="text-sm font-bold text-dark-800 mt-1 capitalize">{payrollSettings.absenceDeductionType}</p>
                  <p className="text-[11px] text-dark-400 mt-1">Half day deduction: {(payrollSettings.halfDayDeductionPercent * 100).toFixed(0)}% of daily pay.</p>
                </div>
                <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600">Connected Outputs</p>
                  <p className="text-sm font-bold text-green-700 mt-1">Payroll, Payslips, Reimbursements</p>
                  <p className="text-[11px] text-green-600 mt-1">These settings feed the new Workforce → Payroll child module.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceOptionPlaceholder({ n }: { n: number }) {
  return (
    <div className="flex items-center justify-center py-20 bg-white border border-dark-100 rounded-xl">
      <div className="text-center">
        <p className="text-sm font-bold text-dark-400">Option {n}</p>
        <p className="text-xs text-dark-300 mt-1">This layout option is reserved for a new design.</p>
      </div>
    </div>
  );
}

// ── Option 1: Original 3-Matrix Layout ───────────────────
function AttendanceOption1() {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [rules, setRules] = useState(attendanceRules);
  const [geoConfig, setGeoConfig] = useState(attendanceGeofenceConfig);
  const [showGeoModal, setShowGeoModal] = useState(false);

  const getRule = (eventTypeId: string, userType: string) => {
    return rules.find(r => r.eventTypeId === eventTypeId && r.userType === userType) || { preference: 'to_be_marked' as AttendancePreference, requireCheckOut: false, qrRole: undefined as 'scanner' | 'code' | undefined };
  };

  const updateRule = (eventTypeId: string, userType: string, updates: Partial<AttendanceRule>) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.eventTypeId === eventTypeId && r.userType === userType);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updates };
        return copy;
      }
      return [...prev, { eventTypeId, userType: userType as any, preference: 'to_be_marked', requireCheckOut: false, ...updates } as AttendanceRule];
    });
    setEditingCell(null);
  };

  const prefs: AttendancePreference[] = ['to_be_marked', 'geolocation', 'qr_code', 'present_by_default', 'absent_by_default'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-dark-900">Attendance Preferences</h3>
        <p className="text-xs text-dark-400 mt-0.5">Configure default attendance check-in type per event type and user role. Click any cell to change.</p>
      </div>

      {/* Matrix table — Check-in Type */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-dark-100 bg-dark-50/30">
          <p className="text-xs font-bold text-dark-700">Check-in Type</p>
          <p className="text-[10px] text-dark-400">How each user type records attendance per event type</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 sticky left-0 bg-dark-50/60 z-10 min-w-[140px]">Event Type</th>
                {attendanceUserTypes.map(ut => (
                  <th key={ut} className="text-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 min-w-[100px]">{ut}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {settingsEventTypes.map(et => (
                <tr key={et.id} className="hover:bg-dark-50/20">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: et.color }} />
                      <span className="text-xs font-semibold text-dark-800">{et.name}</span>
                    </div>
                  </td>
                  {attendanceUserTypes.map(ut => {
                    const cellKey = `pref-${et.id}-${ut}`;
                    const rule = getRule(et.id, ut);
                    const cfg = attendancePreferenceLabels[rule.preference];
                    const isEditing = editingCell === cellKey;
                    return (
                      <td key={ut} className="px-2 py-2 text-center relative">
                        {isEditing ? (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white border-2 border-court-400 rounded-lg shadow-lg p-1">
                            <div className="flex flex-col gap-0.5 w-full">
                              {prefs.map(p => {
                                const pc = attendancePreferenceLabels[p];
                                return (
                                  <button key={p} onClick={() => updateRule(et.id, ut, { preference: p })}
                                    className={`px-2 py-1 rounded text-[9px] font-bold text-left transition-all ${rule.preference === p ? `${pc.bg} ${pc.color} ring-1 ring-current` : 'hover:bg-dark-50 text-dark-500'}`}>
                                    {pc.short}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setEditingCell(cellKey)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all hover:ring-2 hover:ring-court-200 ${cfg.bg} ${cfg.color}`}>
                            {cfg.short}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Check-out Required matrix */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-dark-100 bg-dark-50/30">
          <p className="text-xs font-bold text-dark-700">Check-out Required</p>
          <p className="text-[10px] text-dark-400">Whether check-out is required when check-in type is Geolocation or QR. Only applies to Geo/QR cells.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 sticky left-0 bg-dark-50/60 z-10 min-w-[140px]">Event Type</th>
                {attendanceUserTypes.map(ut => (
                  <th key={ut} className="text-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 min-w-[100px]">{ut}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {settingsEventTypes.map(et => (
                <tr key={et.id} className="hover:bg-dark-50/20">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: et.color }} />
                      <span className="text-xs font-semibold text-dark-800">{et.name}</span>
                    </div>
                  </td>
                  {attendanceUserTypes.map(ut => {
                    const rule = getRule(et.id, ut);
                    const isGeoOrQr = rule.preference === 'geolocation' || rule.preference === 'qr_code';
                    return (
                      <td key={ut} className="px-2 py-2 text-center">
                        {isGeoOrQr ? (
                          <button onClick={() => updateRule(et.id, ut, { requireCheckOut: !rule.requireCheckOut })}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all hover:ring-2 hover:ring-court-200 ${
                              rule.requireCheckOut ? 'bg-green-50 text-green-600' : 'bg-dark-50 text-dark-400'}`}>
                            {rule.requireCheckOut ? 'Yes' : 'No'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-dark-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Role matrix */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-dark-100 bg-purple-50/30">
          <p className="text-xs font-bold text-purple-800">QR Code Roles</p>
          <p className="text-[10px] text-dark-400"><strong className="text-purple-700">Scanner</strong> = holds the device and scans others&apos; codes. <strong className="text-purple-700">Code</strong> = shows QR from their profile to be scanned. Only applies to QR cells.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-50/60">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 sticky left-0 bg-dark-50/60 z-10 min-w-[140px]">Event Type</th>
                {attendanceUserTypes.map(ut => (
                  <th key={ut} className="text-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 min-w-[100px]">{ut}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {settingsEventTypes.map(et => (
                <tr key={et.id} className="hover:bg-dark-50/20">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: et.color }} />
                      <span className="text-xs font-semibold text-dark-800">{et.name}</span>
                    </div>
                  </td>
                  {attendanceUserTypes.map(ut => {
                    const rule = getRule(et.id, ut);
                    const isQr = rule.preference === 'qr_code';
                    return (
                      <td key={ut} className="px-2 py-2 text-center">
                        {isQr ? (
                          <button onClick={() => updateRule(et.id, ut, { qrRole: rule.qrRole === 'scanner' ? 'code' : 'scanner' })}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all hover:ring-2 hover:ring-purple-200 ${
                              rule.qrRole === 'scanner' ? 'bg-purple-100 text-purple-700' : 'bg-purple-50 text-purple-500'}`}>
                            {rule.qrRole === 'scanner' ? 'Scanner' : 'Code'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-dark-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Legend:</span>
        {prefs.map(p => {
          const c = attendancePreferenceLabels[p];
          return (
            <div key={p} className="flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${c.bg} ${c.color}`}>{c.short}</span>
              <span className="text-[10px] text-dark-500">{c.label}</span>
            </div>
          );
        })}
      </div>

      {/* Geofencing Configuration */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-100">
          <div>
            <h4 className="text-sm font-bold text-dark-800">Geolocation Settings</h4>
            <p className="text-[10px] text-dark-400 mt-0.5">Configure geofencing parameters for location-based check-ins</p>
          </div>
          <button onClick={() => setShowGeoModal(true)}
            className="h-7 px-3 rounded-lg border border-dark-200 text-[11px] font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-1.5"><Pencil size={11} /> Edit</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          <div className="p-3 bg-dark-50/40 rounded-xl">
            <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">Radius</p>
            <p className="text-sm font-bold text-dark-800 mt-1">{geoConfig.radiusMeters} meters</p>
          </div>
          <div className="p-3 bg-dark-50/40 rounded-xl">
            <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">Check-in Window</p>
            <p className="text-sm font-bold text-dark-800 mt-1">{geoConfig.timeBeforeEvent} before event</p>
          </div>
          <div className="p-3 bg-dark-50/40 rounded-xl">
            <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">Frequency</p>
            <p className="text-sm font-bold text-dark-800 mt-1">{geoConfig.requireEveryEvent ? 'Every event' : 'Once per day'}</p>
          </div>
          <div className="p-3 bg-dark-50/40 rounded-xl">
            <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold">Max Gap (Same Venue)</p>
            <p className="text-sm font-bold text-dark-800 mt-1">{geoConfig.maxTimeBetweenEvents} min</p>
          </div>
        </div>
      </div>

      {/* Exception rules */}
      <div className="bg-white border border-dark-100 rounded-xl p-5">
        <h4 className="text-sm font-bold text-dark-800 mb-2">Override Rules</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-yellow-50/50 rounded-xl border border-yellow-100">
            <div className="w-6 h-6 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={12} className="text-yellow-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-800">Manual override requires note</p>
              <p className="text-[10px] text-dark-500 mt-0.5">When an admin marks a geolocation or QR check-in person as present/absent manually, they must provide a text reason explaining the override.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Eye size={12} className="text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-800">Location required for geolocation events</p>
              <p className="text-[10px] text-dark-500 mt-0.5">If an event has geolocation check-in configured but no venue location is set, a warning is shown to users with "Set Attendance Preferences" permission.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Geo config modal */}
      <AnimatePresence>
        {showGeoModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowGeoModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
                <h3 className="text-base font-bold text-dark-900">Geolocation Settings</h3>
                <button onClick={() => setShowGeoModal(false)} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Check-in Radius (meters)</label>
                  <input type="number" value={geoConfig.radiusMeters} onChange={e => setGeoConfig({ ...geoConfig, radiusMeters: parseInt(e.target.value) || 0 })}
                    className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                  <p className="text-[10px] text-dark-400 mt-1">User must be within this radius of the event venue to check in</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Time Before Event</label>
                  <select value={geoConfig.timeBeforeEvent} onChange={e => setGeoConfig({ ...geoConfig, timeBeforeEvent: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-court-500/20">
                    <option value="15m">15 minutes</option>
                    <option value="30m">30 minutes</option>
                    <option value="1h">1 hour</option>
                    <option value="2h">2 hours</option>
                    <option value="day_of">Day of event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Check-in Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setGeoConfig({ ...geoConfig, requireEveryEvent: true })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${geoConfig.requireEveryEvent ? 'border-court-500 bg-court-50/50' : 'border-dark-200 hover:border-dark-300'}`}>
                      <p className="text-xs font-bold text-dark-800">Every Event</p>
                      <p className="text-[10px] text-dark-400 mt-0.5">Require check-in for each event</p>
                    </button>
                    <button onClick={() => setGeoConfig({ ...geoConfig, requireEveryEvent: false })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${!geoConfig.requireEveryEvent ? 'border-court-500 bg-court-50/50' : 'border-dark-200 hover:border-dark-300'}`}>
                      <p className="text-xs font-bold text-dark-800">Once Per Day</p>
                      <p className="text-[10px] text-dark-400 mt-0.5">First event check-in covers the day</p>
                    </button>
                  </div>
                </div>
                {!geoConfig.requireEveryEvent && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Max Time Between Events (same venue)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={geoConfig.maxTimeBetweenEvents} onChange={e => setGeoConfig({ ...geoConfig, maxTimeBetweenEvents: parseInt(e.target.value) || 0 })}
                        className="w-24 h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
                      <span className="text-xs text-dark-500 font-semibold">minutes</span>
                    </div>
                    <p className="text-[10px] text-dark-400 mt-1">If events at same venue are within this gap, first check-in counts for both</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-100">
                <button onClick={() => setShowGeoModal(false)} className="h-9 px-4 rounded-xl border border-dark-200 text-sm font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
                <button onClick={() => setShowGeoModal(false)} className="h-9 px-5 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2"><Save size={15} /> Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Option 2: Event-Type-First Drill-Down ────────────────
function AttendanceOption2() {
  const [configs, setConfigs] = useState<EventAttendanceConfig[]>(() => JSON.parse(JSON.stringify(eventAttendanceConfigs)));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingGeoId, setEditingGeoId] = useState<string | null>(null);

  const getEventType = (id: string) => settingsEventTypes.find(e => e.id === id)!;

  const updateConfig = (eventTypeId: string, patch: Partial<EventAttendanceConfig>) => {
    setConfigs(prev => prev.map(c => c.eventTypeId === eventTypeId ? { ...c, ...patch } : c));
  };

  const updateRole = (eventTypeId: string, userType: string, patch: Partial<RoleAttendanceConfig>) => {
    setConfigs(prev => prev.map(c => {
      if (c.eventTypeId !== eventTypeId) return c;
      return { ...c, roles: c.roles.map(r => r.userType === userType ? { ...r, ...patch } : r) };
    }));
  };

  const methods: CheckInMethod[] = ['manual', 'geolocation', 'qr_code', 'hrms'];
  const checkoutReqOptions = ['Attendance', 'Ratings', 'Session RPE', 'Hydration'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-dark-900">Attendance Configuration</h3>
          <p className="text-xs text-dark-400 mt-0.5">Configure check-in methods, checkout rules, geolocation, and QR per event type.</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-dark-50/40 rounded-xl">
        <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mr-1">Methods:</span>
        {methods.map(m => {
          const c = checkInMethodLabels[m];
          return (
            <div key={m} className="flex items-center gap-1.5">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${c.bg} ${c.color}`}>{c.short}</span>
              <span className="text-[10px] text-dark-500">{c.label}</span>
            </div>
          );
        })}
      </div>

      {/* Summary Table */}
      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-50/60 border-b border-dark-100">
              <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 w-[200px]">Event Type</th>
              <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Check-in Methods</th>
              <th className="text-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400">Checkout</th>
              <th className="text-center px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-dark-400 w-[60px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {configs.map(cfg => {
              const et = getEventType(cfg.eventTypeId);
              const isExpanded = expandedId === cfg.eventTypeId;
              const uniqueMethods = [...new Set(cfg.roles.map(r => r.checkInMethod).filter((m): m is CheckInMethod => m !== null))];
              const checkoutCount = cfg.roles.filter(r => r.requireCheckOut).length;

              return (
                <React.Fragment key={cfg.eventTypeId}>
                  {/* Summary row */}
                  <tr
                    className={`cursor-pointer transition-colors ${isExpanded ? 'bg-court-50/30' : 'hover:bg-dark-50/30'}`}
                    onClick={() => setExpandedId(isExpanded ? null : cfg.eventTypeId)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: et.color }} />
                        <span className="text-xs font-semibold text-dark-800">{et.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {uniqueMethods.length === 0 ? (
                          <span className="text-[10px] text-dark-300">No active check-in</span>
                        ) : (
                          uniqueMethods.map(m => {
                            const ml = checkInMethodLabels[m];
                            return <span key={m} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ml.bg} ${ml.color}`}>{ml.short}</span>;
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {checkoutCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600">{checkoutCount} role{checkoutCount > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-[10px] text-dark-300">Off</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                        <ChevronRight size={14} className="text-dark-400" />
                      </motion.div>
                    </td>
                  </tr>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-dark-100 bg-dark-50/20 px-4 py-4 space-y-4">

                            {/* ── Per-Role Config Table ── */}
                            <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                              <div className="px-4 py-2.5 border-b border-dark-100 bg-dark-50/30">
                                <p className="text-xs font-bold text-dark-700">Role Configuration</p>
                                <p className="text-[10px] text-dark-400">Set check-in method, default status, and checkout requirement per role</p>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-dark-50/40">
                                      <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400 w-[120px]">Role</th>
                                      <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400 w-[100px]">Default</th>
                                      <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400 w-[130px]">Check-in</th>
                                      <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400 w-[75px]">QR Role</th>
                                      <th className="text-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400 w-[85px]">Checkout</th>
                                      <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-dark-400">Before Checkout</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-dark-50">
                                    {cfg.roles.map(role => {
                                      const isGeoOrQr = role.defaultStatus === 'none' && (role.checkInMethod === 'geolocation' || role.checkInMethod === 'qr_code');
                                      const isQr = role.defaultStatus === 'none' && role.checkInMethod === 'qr_code';
                                      return (
                                        <tr key={role.userType} className="hover:bg-dark-50/20">
                                          <td className="px-4 py-2.5">
                                            <span className="text-xs font-semibold text-dark-800">{role.userType}</span>
                                          </td>
                                          {/* Default Status */}
                                          <td className="px-3 py-2.5">
                                            <select
                                              value={role.defaultStatus}
                                              onChange={e => {
                                                const nextStatus = e.target.value as AttendanceDefaultStatus;
                                                const patch: Partial<RoleAttendanceConfig> = { defaultStatus: nextStatus };
                                                if (nextStatus === 'none') {
                                                  patch.checkInMethod = role.checkInMethod ?? 'manual';
                                                } else {
                                                  patch.checkInMethod = null;
                                                  patch.qrRole = undefined;
                                                  patch.requireCheckOut = false;
                                                  patch.checkOutRequirements = [];
                                                }
                                                updateRole(cfg.eventTypeId, role.userType, patch);
                                              }}
                                              className={`h-7 px-2 rounded-lg border text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-court-500/20 ${
                                                role.defaultStatus === 'present'
                                                  ? 'border-green-200 bg-green-50 text-green-600'
                                                  : role.defaultStatus === 'absent'
                                                    ? 'border-red-200 bg-red-50 text-red-600'
                                                    : 'border-dark-200 bg-dark-50 text-dark-500'
                                              }`}
                                            >
                                              <option value="none">None</option>
                                              <option value="absent">Absent</option>
                                              <option value="present">Present</option>
                                            </select>
                                          </td>
                                          {/* Check-in Method */}
                                          <td className="px-3 py-2.5">
                                            <select
                                              value={role.checkInMethod ?? ''}
                                              disabled={role.defaultStatus !== 'none'}
                                              onChange={e => {
                                                const newMethod = e.target.value as CheckInMethod;
                                                const patch: Partial<RoleAttendanceConfig> = { checkInMethod: newMethod };
                                                if (newMethod !== 'qr_code') patch.qrRole = undefined;
                                                if (newMethod === 'qr_code' && !role.qrRole) patch.qrRole = 'code';
                                                if (newMethod !== 'geolocation' && newMethod !== 'qr_code') {
                                                  patch.requireCheckOut = false;
                                                  patch.checkOutRequirements = [];
                                                }
                                                updateRole(cfg.eventTypeId, role.userType, patch);
                                              }}
                                              className={`h-7 px-2 rounded-lg border text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-court-500/20 ${
                                                role.defaultStatus !== 'none'
                                                  ? 'bg-dark-50 text-dark-300 border-dark-200 cursor-not-allowed'
                                                  : `${checkInMethodLabels[role.checkInMethod ?? 'manual'].bg} ${checkInMethodLabels[role.checkInMethod ?? 'manual'].color} border-dark-200`
                                              }`}
                                            >
                                              <option value="" disabled>Choose method</option>
                                              {methods.map(m => (
                                                <option key={m} value={m}>{checkInMethodLabels[m].label}</option>
                                              ))}
                                            </select>
                                          </td>
                                          {/* QR Role */}
                                          <td className="px-3 py-2.5 text-center">
                                            {isQr ? (
                                              <button
                                                onClick={() => updateRole(cfg.eventTypeId, role.userType, { qrRole: role.qrRole === 'scanner' ? 'code' : 'scanner' })}
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all hover:ring-2 hover:ring-purple-200 ${
                                                  role.qrRole === 'scanner' ? 'bg-purple-100 text-purple-700' : 'bg-purple-50 text-purple-500'
                                                }`}
                                              >
                                                {role.qrRole === 'scanner' ? 'Scanner' : 'Code'}
                                              </button>
                                            ) : (
                                              <span className="text-[10px] text-dark-300">—</span>
                                            )}
                                          </td>
                                          {/* Checkout Required */}
                                          <td className="px-3 py-2.5 text-center">
                                            {isGeoOrQr ? (
                                              <button
                                                onClick={() => updateRole(cfg.eventTypeId, role.userType, {
                                                  requireCheckOut: !role.requireCheckOut,
                                                  checkOutRequirements: !role.requireCheckOut ? ['Attendance'] : [],
                                                })}
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all hover:ring-2 hover:ring-court-200 ${
                                                  role.requireCheckOut ? 'bg-green-50 text-green-600' : 'bg-dark-50 text-dark-400'
                                                }`}
                                              >
                                                {role.requireCheckOut ? 'Yes' : 'No'}
                                              </button>
                                            ) : (
                                              <span className="text-[10px] text-dark-300">—</span>
                                            )}
                                          </td>
                                          {/* Before Checkout */}
                                          <td className="px-3 py-2.5">
                                            {role.requireCheckOut ? (
                                              <div className="flex flex-wrap gap-1">
                                                {checkoutReqOptions.map(opt => {
                                                  const active = role.checkOutRequirements.includes(opt);
                                                  return (
                                                    <button
                                                      key={opt}
                                                      onClick={() => {
                                                        const next = active
                                                          ? role.checkOutRequirements.filter(x => x !== opt)
                                                          : [...role.checkOutRequirements, opt];
                                                        updateRole(cfg.eventTypeId, role.userType, { checkOutRequirements: next });
                                                      }}
                                                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${
                                                        active ? 'bg-court-500 text-white' : 'bg-dark-50 text-dark-400 hover:bg-dark-100'
                                                      }`}
                                                    >
                                                      {opt}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <span className="text-[10px] text-dark-300">—</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* ── Event-Level Settings ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                              {/* Geolocation Settings */}
                              <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-100 bg-blue-50/30">
                                  <div className="flex items-center gap-2">
                                    <MapPin size={13} className="text-blue-600" />
                                    <p className="text-xs font-bold text-blue-800">Geolocation</p>
                                  </div>
                                  <button
                                    onClick={() => setEditingGeoId(editingGeoId === cfg.eventTypeId ? null : cfg.eventTypeId)}
                                    className="h-6 px-2 rounded-md border border-dark-200 text-[10px] font-semibold text-dark-600 hover:bg-dark-50 flex items-center gap-1"
                                  >
                                    <Pencil size={10} /> {editingGeoId === cfg.eventTypeId ? 'Done' : 'Edit'}
                                  </button>
                                </div>
                                {editingGeoId === cfg.eventTypeId ? (
                                  <div className="p-4 space-y-3">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">
                                        1. How far from the venue can participants check in?
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={cfg.geolocation.radiusMeters}
                                          onChange={e => updateConfig(cfg.eventTypeId, { geolocation: { ...cfg.geolocation, radiusMeters: parseInt(e.target.value) || 0 } })}
                                          className="w-20 h-8 px-2 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20"
                                        />
                                        <div className="flex rounded-lg border border-dark-200 overflow-hidden">
                                          {(['m', 'km'] as const).map(u => (
                                            <button
                                              key={u}
                                              onClick={() => updateConfig(cfg.eventTypeId, { geolocation: { ...cfg.geolocation, radiusUnit: u } })}
                                              className={`px-2.5 py-1 text-[10px] font-bold ${cfg.geolocation.radiusUnit === u ? 'bg-court-500 text-white' : 'bg-white text-dark-500 hover:bg-dark-50'}`}
                                            >
                                              {u}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">
                                        2. How early can they check in before the event starts?
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={Math.floor(cfg.geolocation.earlyCheckInMinutes / 60)}
                                          onChange={e => {
                                            const hrs = parseInt(e.target.value) || 0;
                                            const mins = cfg.geolocation.earlyCheckInMinutes % 60;
                                            updateConfig(cfg.eventTypeId, { geolocation: { ...cfg.geolocation, earlyCheckInMinutes: hrs * 60 + mins } });
                                          }}
                                          className="w-14 h-8 px-2 rounded-lg border border-dark-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-court-500/20"
                                        />
                                        <span className="text-[10px] text-dark-400">hrs</span>
                                        <input
                                          type="number"
                                          value={cfg.geolocation.earlyCheckInMinutes % 60}
                                          onChange={e => {
                                            const hrs = Math.floor(cfg.geolocation.earlyCheckInMinutes / 60);
                                            const mins = parseInt(e.target.value) || 0;
                                            updateConfig(cfg.eventTypeId, { geolocation: { ...cfg.geolocation, earlyCheckInMinutes: hrs * 60 + mins } });
                                          }}
                                          className="w-14 h-8 px-2 rounded-lg border border-dark-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-court-500/20"
                                        />
                                        <span className="text-[10px] text-dark-400">mins</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3 p-4">
                                    <div className="p-2.5 bg-dark-50/40 rounded-lg">
                                      <p className="text-[9px] text-dark-400 uppercase tracking-wider font-bold">Radius</p>
                                      <p className="text-xs font-bold text-dark-800 mt-0.5">{cfg.geolocation.radiusMeters}{cfg.geolocation.radiusUnit}</p>
                                    </div>
                                    <div className="p-2.5 bg-dark-50/40 rounded-lg">
                                      <p className="text-[9px] text-dark-400 uppercase tracking-wider font-bold">Early Check-in</p>
                                      <p className="text-xs font-bold text-dark-800 mt-0.5">{cfg.geolocation.earlyCheckInMinutes} min</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* QR Code Settings */}
                              <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-dark-100 bg-purple-50/30">
                                  <QrCode size={13} className="text-purple-600" />
                                  <p className="text-xs font-bold text-purple-800">QR Code</p>
                                </div>
                                <div className="p-4 space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Check-in opens before event</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        value={cfg.qrCode.checkInOpensBeforeMinutes}
                                        onChange={e => updateConfig(cfg.eventTypeId, { qrCode: { ...cfg.qrCode, checkInOpensBeforeMinutes: parseInt(e.target.value) || 0 } })}
                                        className="w-16 h-8 px-2 rounded-lg border border-dark-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-court-500/20"
                                      />
                                      <span className="text-[10px] text-dark-400 font-semibold">minutes</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Penalty & Back-to-Back */}
                              <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-dark-100 bg-yellow-50/30">
                                  <Timer size={13} className="text-yellow-600" />
                                  <p className="text-xs font-bold text-yellow-800">Penalties & Timing</p>
                                </div>
                                <div className="p-4 space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">When should penalties start after the event ends?</label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        value={Math.floor(cfg.penaltyStartAfterMinutes / 60)}
                                        onChange={e => {
                                          const hrs = parseInt(e.target.value) || 0;
                                          const mins = cfg.penaltyStartAfterMinutes % 60;
                                          updateConfig(cfg.eventTypeId, { penaltyStartAfterMinutes: hrs * 60 + mins });
                                        }}
                                        className="w-14 h-8 px-2 rounded-lg border border-dark-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-court-500/20"
                                      />
                                      <span className="text-[10px] text-dark-400">hrs</span>
                                      <input
                                        type="number"
                                        value={cfg.penaltyStartAfterMinutes % 60}
                                        onChange={e => {
                                          const hrs = Math.floor(cfg.penaltyStartAfterMinutes / 60);
                                          const mins = parseInt(e.target.value) || 0;
                                          updateConfig(cfg.eventTypeId, { penaltyStartAfterMinutes: hrs * 60 + mins });
                                        }}
                                        className="w-14 h-8 px-2 rounded-lg border border-dark-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-court-500/20"
                                      />
                                      <span className="text-[10px] text-dark-400">mins</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Back-to-back */}
                              <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-dark-100 bg-dark-50/30">
                                  <Calendar size={13} className="text-dark-600" />
                                  <p className="text-xs font-bold text-dark-700">Back-to-Back Events</p>
                                </div>
                                <div className="p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-dark-700 font-medium">Require new check-in for back-to-back events at same venue?</span>
                                    <button
                                      onClick={() => updateConfig(cfg.eventTypeId, { backToBackSameVenue: !cfg.backToBackSameVenue })}
                                      className="flex items-center gap-1.5"
                                    >
                                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border-2 transition-all ${cfg.backToBackSameVenue ? 'border-court-500 bg-court-50 text-court-600' : 'border-dark-200 text-dark-400'}`}>Yes</span>
                                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border-2 transition-all ${!cfg.backToBackSameVenue ? 'border-court-500 bg-court-50 text-court-600' : 'border-dark-200 text-dark-400'}`}>No</span>
                                    </button>
                                  </div>
                                  {cfg.backToBackSameVenue && (
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Minimum time gap between events</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={Math.floor(cfg.backToBackGapMinutes / 60)}
                                          onChange={e => {
                                            const hrs = parseInt(e.target.value) || 0;
                                            const mins = cfg.backToBackGapMinutes % 60;
                                            updateConfig(cfg.eventTypeId, { backToBackGapMinutes: hrs * 60 + mins });
                                          }}
                                          className="w-14 h-8 px-2 rounded-lg border border-dark-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-court-500/20"
                                        />
                                        <span className="text-[10px] text-dark-400">hrs</span>
                                        <input
                                          type="number"
                                          value={cfg.backToBackGapMinutes % 60}
                                          onChange={e => {
                                            const hrs = Math.floor(cfg.backToBackGapMinutes / 60);
                                            const mins = parseInt(e.target.value) || 0;
                                            updateConfig(cfg.eventTypeId, { backToBackGapMinutes: hrs * 60 + mins });
                                          }}
                                          className="w-14 h-8 px-2 rounded-lg border border-dark-200 text-xs text-center focus:outline-none focus:ring-2 focus:ring-court-500/20"
                                        />
                                        <span className="text-[10px] text-dark-400">mins</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Override Rules */}
      <div className="bg-white border border-dark-100 rounded-xl p-5">
        <h4 className="text-sm font-bold text-dark-800 mb-2">Override Rules</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-yellow-50/50 rounded-xl border border-yellow-100">
            <div className="w-6 h-6 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={12} className="text-yellow-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-800">Manual override requires note</p>
              <p className="text-[10px] text-dark-500 mt-0.5">When an admin marks a geolocation or QR check-in person as present/absent manually, they must provide a text reason explaining the override.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Eye size={12} className="text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-dark-800">Location required for geolocation events</p>
              <p className="text-[10px] text-dark-500 mt-0.5">If an event has geolocation check-in configured but no venue location is set, a warning is shown to users with "Set Attendance Preferences" permission.</p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
