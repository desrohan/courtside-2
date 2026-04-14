import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, MapPin, Users, Pencil, Trash2,
  Calendar, ListChecks, Route, Activity, Droplets,
  UserCog, FileText, ClipboardList, Star, BarChart3, Trophy, History,
  Globe, Eye, FileEdit, Home, ScrollText,
} from 'lucide-react';
import { CalendarEvent } from '@/data/events';
import { format, parseISO } from 'date-fns';
import EventOverview from './EventOverview';
import ChecklistTab from './ChecklistTab';
import ItineraryTab from './ItineraryTab';
import AttendanceTab from './AttendanceTab';
import SessionTab from './SessionTab';
import HydrationTab from './HydrationTab';
import AssignmentTab from './AssignmentTab';
import FilesTab from './FilesTab';
import RatingsTab from './RatingsTab';
import StatisticsTab from './StatisticsTab';
import ScoresTab from './ScoresTab';
import HistoryTab from './HistoryTab';
import ReportsTab from './ReportsTab';

interface Props {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (event: CalendarEvent) => void;
}

const tabDefs = [
  { key: 'event', label: 'Event', icon: <Calendar size={15} /> },
  { key: 'scores', label: 'Scores', icon: <Trophy size={15} />, needsFlag: 'hasScores' as const },
  { key: 'itinerary', label: 'Itinerary', icon: <Route size={15} />, needsFlag: 'hasItinerary' as const },
  { key: 'checklist', label: 'Checklist', icon: <ListChecks size={15} />, needsFlag: 'hasChecklist' as const },
  { key: 'attendance', label: 'Attendance', icon: <ClipboardList size={15} /> },
  { key: 'session', label: 'Session', icon: <Activity size={15} />, needsFlag: 'hasSession' as const },
  { key: 'hydration', label: 'Hydration', icon: <Droplets size={15} />, needsFlag: 'hasHydration' as const },
  { key: 'assignment', label: 'Assignment', icon: <UserCog size={15} />, needsFlag: 'hasAssignment' as const },
  { key: 'files', label: 'Files', icon: <FileText size={15} />, needsFlag: 'hasFiles' as const },
  { key: 'ratings', label: 'Ratings', icon: <Star size={15} /> },
  { key: 'statistics', label: 'Statistics', icon: <BarChart3 size={15} /> },
  { key: 'history', label: 'History', icon: <History size={15} /> },
  { key: 'reports', label: 'Reports', icon: <ScrollText size={15} /> },
];

const statusConfig = {
  draft:      { label: 'Draft',     icon: <FileEdit size={11} />, bg: 'bg-dark-100', text: 'text-dark-600', dot: 'bg-dark-400' },
  in_review:  { label: 'In Review', icon: <Eye size={11} />,      bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  published:  { label: 'Published', icon: <Globe size={11} />,    bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
};

export default function EventDetailDrawer({ event, open, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState('event');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'review'>('all');

  const goToAttendanceReview = () => {
    setAttendanceFilter('review');
    setActiveTab('attendance');
  };

  if (!event) return null;

  const dateDisplay = (() => {
    const startDate = event.start.date;
    const endDate = event.end.date;
    if (startDate === endDate) {
      return format(parseISO(startDate), 'EEEE, MMMM do yyyy');
    }
    return `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`;
  })();

  const fmt12 = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ap}`; };
  const timeDisplay = event.allDay
    ? 'All Day'
    : `${fmt12(event.start.time)} - ${fmt12(event.end.time)}`;

  const availableTabs = tabDefs.filter(tab => {
    if (!tab.needsFlag) return true;
    return event[tab.needsFlag];
  });

  const sCfg = statusConfig[event.status];

  const renderTab = () => {
    switch (activeTab) {
      case 'event': return <EventOverview event={event} onGoToAttendanceReview={goToAttendanceReview} />;
      case 'scores': return <ScoresTab event={event} />;
      case 'itinerary': return <ItineraryTab items={event.itinerary || []} eventStartTime={event.start.time} eventEndTime={event.end.time} />;
      case 'checklist': return <ChecklistTab items={event.checklist || []} eventEndDate={event.end.date} eventEndTime={event.end.time} />;
      case 'attendance': return <AttendanceTab records={event.attendance || []} event={event} initialFilter={attendanceFilter} />;
      case 'session': return <SessionTab session={event.session} />;
      case 'hydration': return <HydrationTab records={event.hydration || []} attendance={event.attendance || []} />;
      case 'assignment': return <AssignmentTab records={event.assignments || []} eventStartDate={event.start.date} eventEndDate={event.end.date} eventTimezone={event.start.timezone} />;
      case 'files': return <FilesTab files={event.files || []} />;
      case 'ratings': return <RatingsTab event={event} />;
      case 'statistics': return <StatisticsTab event={event} />;
      case 'history': return <HistoryTab entries={event.history || []} />;
      case 'reports': return <ReportsTab reports={event.reports || []} />;
      default: return <EventOverview event={event} />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-drawer z-50 flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0">
              {/* Color banner */}
              <div className="h-2 w-full" style={{ backgroundColor: event.eventType.color }} />

              <div className="px-6 pt-5 pb-4">
                {/* Top row: badges + actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      style={{ backgroundColor: event.eventType.color + '15', color: event.eventType.color }}
                    >
                      {event.eventType.name}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold ${sCfg.bg} ${sCfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}`} />
                      {sCfg.label}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-[11px] font-medium ${event.privacy === 'public' ? 'bg-court-50 text-court-600' : 'bg-dark-50 text-dark-500'}`}>
                      {event.privacy === 'public' ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onEdit?.(event)} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400 hover:text-dark-700 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-red-50 text-dark-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-50 text-dark-400 hover:text-dark-700 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-extrabold text-dark-900 leading-tight mb-3">{event.title}</h2>

                {/* Info cards row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-dark-100 bg-white">
                    <div className="w-9 h-9 rounded-xl bg-court-500 flex items-center justify-center shrink-0 shadow-sm">
                      <Clock size={16} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider leading-none">When</p>
                      <p className="text-xs font-bold text-dark-900 mt-0.5 truncate">{dateDisplay}</p>
                      <p className="text-[11px] text-dark-500 font-medium mt-0.5">{timeDisplay}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-dark-100 bg-white hover:border-violet-200 hover:shadow-sm transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {event.locationtype === 'home' ? <Home size={16} className="text-white" /> : <MapPin size={16} className="text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider leading-none">Where</p>
                      <p className="text-xs font-bold text-dark-900 mt-0.5 truncate group-hover:text-violet-600 transition-colors">{event.location}</p>
                      <p className="text-[11px] text-dark-500 font-medium mt-0.5 capitalize">{event.locationtype === 'home' ? 'Home venue' : 'Away'}</p>
                    </div>
                    <MapPin size={13} className="text-dark-300 group-hover:text-violet-400 transition-colors shrink-0" />
                  </a>
                </div>

                {/* Teams */}
                {event.teamNames.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <Users size={13} className="text-dark-400 shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                      {event.teamNames.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-court-50 text-court-700 rounded-md text-[11px] font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="px-5 flex items-center gap-0.5 overflow-x-auto scrollbar-hide border-t border-dark-100">
                {availableTabs.map(tab => {
                  const isActive = activeTab === tab.key;
                  const hasData = tab.needsFlag ? event[tab.needsFlag] : true;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors rounded-t-lg
                        ${isActive
                          ? 'text-court-600'
                          : 'text-dark-400 hover:text-dark-700'
                        }
                      `}
                    >
                      {tab.icon}
                      {tab.label}
                      {hasData && tab.needsFlag && (
                        <span className="w-1.5 h-1.5 rounded-full bg-court-400" />
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="drawer-tab-indicator"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-court-500 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderTab()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
