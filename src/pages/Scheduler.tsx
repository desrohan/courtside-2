import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FullCalendarComponent from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import {
  ChevronLeft, ChevronRight, Plus, Upload, Filter as FilterIcon,
  CalendarDays, CalendarClock, List, LayoutGrid, Eye, EyeOff,
  X, Save, Bookmark, Route, ListChecks, Activity, Droplets,
  UserCog, FileText,
} from 'lucide-react';
import { events, getEventsForCalendar, CalendarEvent, CalendarViewType } from '@/data/events';
import { teams } from '@/data/teams';
import EventDetailDrawer from '@/components/events/EventDetailDrawer';
import EventListings from '@/components/events/EventListings';
import FacilityView, { FacilitySelection } from '@/components/events/FacilityView';
import PeopleView from '@/components/events/PeopleView';
import CreateEventWizard from '@/components/events/CreateEventWizard';
import { format } from 'date-fns';

type ViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

const viewOptions: { key: ViewType; label: string; icon: React.ReactNode }[] = [
  { key: 'dayGridMonth', label: 'Month', icon: <LayoutGrid size={15} /> },
  { key: 'timeGridWeek', label: 'Week', icon: <CalendarDays size={15} /> },
  { key: 'timeGridDay', label: 'Day', icon: <CalendarClock size={15} /> },
  { key: 'listWeek', label: 'List', icon: <List size={15} /> },
];

type SchedulerTab = 'calendar' | 'listings' | 'mine' | 'facility' | 'people';

export default function Scheduler() {
  const calendarRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState<SchedulerTab>('calendar');
  const [currentView, setCurrentView] = useState<ViewType>('dayGridMonth');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [calendarTitle, setCalendarTitle] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<string | undefined>();
  const [createEndDate, setCreateEndDate] = useState<string | undefined>();
  const [createAllDay, setCreateAllDay] = useState<boolean | undefined>();
  const [createStartTime, setCreateStartTime] = useState<string | undefined>();
  const [createEndTime, setCreateEndTime] = useState<string | undefined>();
  const [createVenueId, setCreateVenueId] = useState<string | undefined>();
  const [createFacilityId, setCreateFacilityId] = useState<string | undefined>();
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const unpublishedCount = events.filter(e => !e.published).length;

  const calendarEvents = getEventsForCalendar().filter(ev => {
    if (selectedTeams.length === 0) return true;
    const fullEvent = events.find(e => e.id === ev.id);
    return fullEvent?.teamIds.some(tid => selectedTeams.includes(tid));
  });

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    const api = calendarRef.current?.getApi();
    if (api) api.changeView(view);
  };

  const handlePrev = () => calendarRef.current?.getApi()?.prev();
  const handleNext = () => calendarRef.current?.getApi()?.next();
  const handleToday = () => calendarRef.current?.getApi()?.today();

  const handleEventClick = useCallback((info: any) => {
    const ev = events.find(e => e.id === info.event.id);
    if (ev) {
      setSelectedEvent(ev);
      setDrawerOpen(true);
    }
  }, []);

  const handleDateClick = useCallback((info: any) => {
    setCreateInitialDate(info.dateStr);
    setCreateEndDate(undefined);
    setCreateAllDay(undefined);
    setCreateOpen(true);
  }, []);

  const handleSelect = useCallback((info: any) => {
    const start: string = info.startStr; // "2026-04-07"
    // FullCalendar allDay end is exclusive — convert to inclusive
    const rawEnd = new Date(info.endStr);
    rawEnd.setDate(rawEnd.getDate() - 1);
    const inclusiveEnd = format(rawEnd, 'yyyy-MM-dd');
    const isMultiDay = start !== inclusiveEnd;
    setCreateInitialDate(start);
    setCreateEndDate(isMultiDay ? inclusiveEnd : undefined);
    // Multi-day drag → allDay trip. Single day → timed event (9am–10am default).
    setCreateAllDay(isMultiDay ? true : false);
    setCreateOpen(true);
  }, []);

  const handleDatesSet = useCallback((arg: any) => {
    setCalendarTitle(arg.view.title);
  }, []);

  const handleFacilitySelect = useCallback((sel: FacilitySelection) => {
    setCreateInitialDate(sel.date);
    setCreateEndDate(undefined);
    setCreateAllDay(false);
    setCreateStartTime(sel.startTime);
    setCreateEndTime(sel.endTime);
    setCreateVenueId(sel.venueId || undefined);
    setCreateFacilityId(sel.facilityId || undefined);
    setCreateOpen(true);
  }, []);

  const toggleTeamFilter = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
    );
  };

  // Module icon definitions for calendar badges
  const moduleIcons: { key: string; icon: React.ReactNode; label: string; color: string }[] = [
    { key: 'hasItinerary', icon: <Route size={9} strokeWidth={2.5} />, label: 'Itinerary', color: '#8E33FF' },
    { key: 'hasChecklist', icon: <ListChecks size={9} strokeWidth={2.5} />, label: 'Checklist', color: '#00B8D9' },
    { key: 'hasSession', icon: <Activity size={9} strokeWidth={2.5} />, label: 'Session', color: '#FFAB00' },
    { key: 'hasHydration', icon: <Droplets size={9} strokeWidth={2.5} />, label: 'Hydration', color: '#00A76F' },
    { key: 'hasAssignment', icon: <UserCog size={9} strokeWidth={2.5} />, label: 'Assignment', color: '#FF6C40' },
    { key: 'hasFiles', icon: <FileText size={9} strokeWidth={2.5} />, label: 'Files', color: '#637381' },
  ];

  // Custom event content renderer with module icons
  const renderEventContent = useCallback((arg: any) => {
    const props = arg.event.extendedProps;
    const activeModules = moduleIcons.filter(m => props[m.key]);
    const timeText = arg.timeText;
    const isMonth = currentView === 'dayGridMonth';
    const isList = currentView === 'listWeek';

    if (isList) {
      return (
        <div className="flex items-center gap-2 py-0.5">
          <span className="font-semibold text-sm">{arg.event.title}</span>
          {activeModules.length > 0 && (
            <span className="flex items-center gap-0.5 ml-1">
              {activeModules.map(m => (
                <span
                  key={m.key}
                  title={m.label}
                  className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full"
                  style={{ backgroundColor: m.color + '22', color: m.color }}
                >
                  {m.icon}
                </span>
              ))}
            </span>
          )}
          {!props.published && (
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-bold uppercase tracking-wider opacity-80">Draft</span>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 overflow-hidden w-full px-0.5">
        {timeText && <span className="text-[10px] font-semibold opacity-90 shrink-0">{timeText}</span>}
        <span className="text-[11px] font-semibold truncate flex-1">{arg.event.title}</span>
        {activeModules.length > 0 && (
          <span className="flex items-center gap-px shrink-0 ml-auto">
            {activeModules.map(m => (
              <span
                key={m.key}
                title={m.label}
                className="inline-flex items-center justify-center w-[14px] h-[14px] rounded-full bg-white/25"
              >
                {m.icon}
              </span>
            ))}
          </span>
        )}
      </div>
    );
  }, [currentView]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-dark-900">Scheduler</h1>
          <div className="flex items-center gap-1 mt-1.5 bg-dark-100/60 rounded-lg p-0.5 w-fit">
            {([
              { key: 'calendar' as SchedulerTab, label: 'Calendar' },
              { key: 'facility' as SchedulerTab, label: 'Facility' },
              { key: 'people' as SchedulerTab, label: 'People' },
              { key: 'listings' as SchedulerTab, label: 'Event Listings' },
              { key: 'mine' as SchedulerTab, label: 'Mine' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-dark-900 shadow-sm'
                    : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'calendar' && <>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`h-9 px-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all ${
              filterOpen || selectedTeams.length > 0
                ? 'border-court-300 bg-court-50 text-court-700'
                : 'border-dark-200 bg-white text-dark-600 hover:bg-dark-50'
            }`}
          >
            <FilterIcon size={15} />
            Filter
            {selectedTeams.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-court-500 text-white text-[10px] font-bold flex items-center justify-center">
                {selectedTeams.length}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-dark-200" />

          {/* Publish */}
          <button className="h-9 px-3.5 rounded-xl border border-dark-200 bg-white text-sm font-medium text-dark-600 hover:bg-dark-50 flex items-center gap-2 transition-all">
            <Upload size={15} />
            Publish
            {unpublishedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold">
                {unpublishedCount}
              </span>
            )}
          </button>
          </>}

          {/* New Event */}
          <button
            onClick={() => { setCreateInitialDate(undefined); setCreateEndDate(undefined); setCreateAllDay(undefined); setCreateOpen(true); }}
            className="h-9 px-4 rounded-xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Event
          </button>
        </div>
      </div>

      {/* ─── Facility view ─── */}
      {activeTab === 'facility' && (
        <FacilityView
          onEventClick={(ev) => { setSelectedEvent(ev); setDrawerOpen(true); }}
          onSelect={handleFacilitySelect}
        />
      )}

      {/* ─── People view ─── */}
      {activeTab === 'people' && (
        <PeopleView onEventClick={(ev) => { setSelectedEvent(ev); setDrawerOpen(true); }} />
      )}

      {/* ─── Event Listings / Mine views ─── */}
      {activeTab === 'listings' && (
        <EventListings
          onEventClick={(ev) => { setSelectedEvent(ev); setDrawerOpen(true); }}
        />
      )}
      {activeTab === 'mine' && (
        <EventListings
          filterMine
          onEventClick={(ev) => { setSelectedEvent(ev); setDrawerOpen(true); }}
        />
      )}

      {/* ─── Calendar view ─── */}
      {activeTab === 'calendar' && <>
      {/* Filter Drawer */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-dark-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-dark-800">Filter by Team</h3>
                {selectedTeams.length > 0 && (
                  <button
                    onClick={() => setSelectedTeams([])}
                    className="text-xs text-court-500 font-medium hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {teams.map(team => {
                  const isSelected = selectedTeams.includes(team.id);
                  return (
                    <button
                      key={team.id}
                      onClick={() => toggleTeamFilter(team.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isSelected
                          ? 'text-white shadow-sm'
                          : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                      }`}
                      style={isSelected ? { backgroundColor: team.color } : {}}
                    >
                      {team.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
        {/* Calendar Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3 border-b border-dark-100 gap-3">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 rounded-lg hover:bg-dark-50 transition-colors">
              <ChevronLeft size={18} className="text-dark-600" />
            </button>
            <button onClick={handleNext} className="p-2 rounded-lg hover:bg-dark-50 transition-colors">
              <ChevronRight size={18} className="text-dark-600" />
            </button>
            <button
              onClick={handleToday}
              className="h-8 px-3 rounded-lg bg-dark-50 text-xs font-semibold text-dark-600 hover:bg-dark-100 transition-colors"
            >
              Today
            </button>
            <h2 className="text-base font-bold text-dark-900 ml-2">{calendarTitle}</h2>
          </div>
          <div className="flex items-center bg-dark-50 rounded-xl p-0.5">
            {viewOptions.map(v => (
              <button
                key={v.key}
                onClick={() => handleViewChange(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === v.key
                    ? 'bg-white text-dark-900 shadow-sm'
                    : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="p-3">
          <FullCalendarComponent
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={calendarEvents}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            select={handleSelect}
            datesSet={handleDatesSet}
            eventContent={renderEventContent}
            height="auto"
            dayMaxEvents={3}
            nowIndicator
            editable
            selectable
            eventDisplay="block"
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
          />
        </div>
      </div>

      </>}

      {/* Event Detail Drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedEvent(null); }}
        onEdit={(event) => { setDrawerOpen(false); setSelectedEvent(null); setEditingEvent(event); setCreateOpen(true); }}
      />

      {/* Create / Edit Event Wizard */}
      <CreateEventWizard
        open={createOpen}
        onClose={() => {
          setCreateOpen(false); setEditingEvent(null);
          setCreateEndDate(undefined); setCreateAllDay(undefined);
          setCreateStartTime(undefined); setCreateEndTime(undefined);
          setCreateVenueId(undefined); setCreateFacilityId(undefined);
        }}
        initialDate={createInitialDate}
        initialEndDate={createEndDate}
        initialAllDay={createAllDay}
        initialStartTime={createStartTime}
        initialEndTime={createEndTime}
        initialVenueId={createVenueId}
        initialFacilityId={createFacilityId}
        editEvent={editingEvent}
      />
    </motion.div>
  );
}
