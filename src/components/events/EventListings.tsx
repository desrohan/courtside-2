import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Calendar, Clock, MapPin, Users, Eye, EyeOff,
  ChevronDown, ArrowUpDown, MoreHorizontal, Pencil, Trash2,
  Route, ListChecks, Activity, Droplets, UserCog, FileText,
} from 'lucide-react';
import { events, CalendarEvent, eventTypes } from '@/data/events';
import { teams } from '@/data/teams';
import { currentUser } from '@/data/users';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';

interface Props {
  onEventClick: (event: CalendarEvent) => void;
  filterMine?: boolean;
}

type SortField = 'date' | 'title' | 'type' | 'team';
type SortDir = 'asc' | 'desc';

export default function EventListings({ onEventClick, filterMine = false }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showFilters, setShowFilters] = useState(false);

  let filtered = [...events];

  // Mine filter
  if (filterMine) {
    filtered = filtered.filter(e =>
      e.ownerId === currentUser.id ||
      e.teamIds.some(tid => currentUser.teamIds.includes(tid))
    );
  }

  // Search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    );
  }

  // Type filter
  if (typeFilter) {
    filtered = filtered.filter(e => e.eventType.id === typeFilter);
  }

  // Team filter
  if (teamFilter) {
    filtered = filtered.filter(e => e.teamIds.includes(teamFilter));
  }

  // Sort
  filtered.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'date': cmp = a.start.date.localeCompare(b.start.date) || a.start.time.localeCompare(b.start.time); break;
      case 'title': cmp = a.title.localeCompare(b.title); break;
      case 'type': cmp = a.eventType.name.localeCompare(b.eventType.name); break;
      case 'team': cmp = a.teamNames.join(',').localeCompare(b.teamNames.join(',')); break;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-dark-400 hover:text-dark-600 transition-colors"
    >
      {label}
      <ArrowUpDown size={11} className={sortField === field ? 'text-court-500' : 'text-dark-300'} />
    </button>
  );

  const moduleIcons = (ev: CalendarEvent) => {
    const modules = [
      { flag: ev.hasItinerary, icon: <Route size={10} />, label: 'Itinerary', color: '#8E33FF' },
      { flag: ev.hasChecklist, icon: <ListChecks size={10} />, label: 'Checklist', color: '#00B8D9' },
      { flag: ev.hasSession, icon: <Activity size={10} />, label: 'Session', color: '#FFAB00' },
      { flag: ev.hasHydration, icon: <Droplets size={10} />, label: 'Hydration', color: '#00A76F' },
      { flag: ev.hasAssignment, icon: <UserCog size={10} />, label: 'Assignment', color: '#FF6C40' },
      { flag: ev.hasFiles, icon: <FileText size={10} />, label: 'Files', color: '#637381' },
    ].filter(m => m.flag);

    if (modules.length === 0) return null;
    return (
      <div className="flex items-center gap-0.5">
        {modules.map(m => (
          <span
            key={m.label}
            title={m.label}
            className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full"
            style={{ backgroundColor: m.color + '18', color: m.color }}
          >
            {m.icon}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search + Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-500/40"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
            showFilters || typeFilter || teamFilter
              ? 'border-court-300 bg-court-50 text-court-700'
              : 'border-dark-200 bg-white text-dark-600 hover:bg-dark-50'
          }`}
        >
          <Filter size={14} /> Filters
          {(typeFilter || teamFilter) && <span className="w-1.5 h-1.5 rounded-full bg-court-500" />}
        </button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-3 overflow-hidden">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-dark-200 bg-white text-xs font-medium text-dark-600 focus:outline-none focus:ring-2 focus:ring-court-500/20"
          >
            <option value="">All Event Types</option>
            {eventTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
          </select>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-dark-200 bg-white text-xs font-medium text-dark-600 focus:outline-none focus:ring-2 focus:ring-court-500/20"
          >
            <option value="">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {(typeFilter || teamFilter) && (
            <button onClick={() => { setTypeFilter(''); setTeamFilter(''); }} className="text-xs text-court-500 font-semibold hover:underline">
              Clear
            </button>
          )}
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-50/60">
              <th className="text-left px-4 py-3 w-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-dark-400">#</span>
              </th>
              <th className="text-left px-4 py-3"><SortHeader field="title" label="Event" /></th>
              <th className="text-left px-4 py-3"><SortHeader field="date" label="Date & Time" /></th>
              <th className="text-left px-4 py-3"><SortHeader field="type" label="Type" /></th>
              <th className="text-left px-4 py-3"><SortHeader field="team" label="Team" /></th>
              <th className="text-left px-4 py-3"><span className="text-[11px] font-bold uppercase tracking-wider text-dark-400">Modules</span></th>
              <th className="text-left px-4 py-3"><span className="text-[11px] font-bold uppercase tracking-wider text-dark-400">Status</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-dark-400">
                  No events found
                </td>
              </tr>
            ) : filtered.map((ev, i) => {
              const isPast = isBefore(parseISO(ev.start.date), new Date()) && !isToday(parseISO(ev.start.date));
              return (
                <tr
                  key={ev.id}
                  onClick={() => onEventClick(ev)}
                  className={`hover:bg-dark-50/40 cursor-pointer transition-colors ${isPast ? 'opacity-60' : ''}`}
                >
                  <td className="px-4 py-3 text-xs text-dark-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: ev.eventType.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-dark-800 truncate">{ev.title}</p>
                        <p className="text-[11px] text-dark-400 flex items-center gap-1 truncate">
                          <MapPin size={10} /> {ev.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-dark-700">
                      {format(parseISO(ev.start.date), 'EEE, MMM d')}
                    </p>
                    <p className="text-[11px] text-dark-400">
                      {ev.allDay ? 'All Day' : `${ev.start.time} - ${ev.end.time}`}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-md text-[10px] font-bold"
                      style={{ backgroundColor: ev.eventType.color + '15', color: ev.eventType.color }}
                    >
                      {ev.eventType.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ev.teamNames.map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-court-50 text-court-700 rounded text-[10px] font-semibold">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{moduleIcons(ev)}</td>
                  <td className="px-4 py-3">
                    {ev.published ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-court-600">
                        <Eye size={12} /> Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-500">
                        <EyeOff size={12} /> Draft
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-dark-400 text-center">
        Showing {filtered.length} of {events.length} events
      </p>
    </div>
  );
}
