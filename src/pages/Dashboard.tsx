import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Users, Trophy, Activity, TrendingUp, CheckCircle2,
  HelpCircle, ArrowRight, Clock, Shield, Dumbbell, HeartPulse,
  Route, ListChecks, Droplets, UserCog, FileText,
} from 'lucide-react';
import { currentUser } from '@/data/users';
import { events } from '@/data/events';
import { teams } from '@/data/teams';
import { format, isToday, isTomorrow, isAfter } from 'date-fns';

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const { organizationId } = useParams();
  const navigate = useNavigate();

  const todayEvents = events.filter(e => {
    const d = new Date(e.start.date);
    return isToday(d);
  });

  const upcomingEvents = events
    .filter(e => isAfter(new Date(e.start.date), new Date()))
    .slice(0, 5);

  const unpublishedCount = events.filter(e => !e.published).length;

  const timelineSteps = [
    { title: 'Role', subtitle: 'Set user permissions', path: 'Settings > Account > Role', completed: true, icon: <Shield size={16} /> },
    { title: 'Designation', subtitle: 'Assign Roles to a Designation', path: 'Settings > Account > Designation', completed: true, icon: <Shield size={16} /> },
    { title: 'Event Type', subtitle: 'Configure Event Details', path: 'Settings > Resources > Event Type', completed: true, icon: <Calendar size={16} /> },
    { title: 'Activity', subtitle: 'Link Event Types to Activity', path: 'Settings > Resources > Activity', completed: true, icon: <Activity size={16} /> },
    { title: 'Facility Center', subtitle: 'Create Main & Sub Facilities', path: 'Settings > Resources > Facility Center', completed: true, icon: <Dumbbell size={16} /> },
    { title: 'User', subtitle: 'Create & Manage Users', path: 'Users > View', completed: true, icon: <Users size={16} /> },
    { title: 'User Tags', subtitle: 'Create User Tags to Identify User groups', path: 'Settings > Resources > User Tags', completed: true, icon: <Users size={16} /> },
    { title: 'Team', subtitle: 'Assign users to your team & tag them', path: 'Teams > View', completed: true, icon: <Users size={16} /> },
    { title: 'Scheduler', subtitle: 'Create & Publish your first event', path: 'Scheduler > Calendar', completed: false, icon: <Calendar size={16} /> },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger.container}
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={stagger.item}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-court-600 via-court-500 to-court-400 p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 right-32 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-court-100 text-sm font-medium mb-1">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
          <h1 className="text-2xl font-extrabold mb-2">
            Welcome back, {currentUser.firstName}! 👋
          </h1>
          <p className="text-court-100 text-sm max-w-lg">
            You have <span className="text-white font-semibold">{todayEvents.length} events</span> scheduled today
            {unpublishedCount > 0 && (
              <> and <span className="text-yellow-300 font-semibold">{unpublishedCount} unpublished events</span> awaiting review</>
            )}.
          </p>
          <button
            onClick={() => navigate(`/o/${organizationId}/schedule/calendar`)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm"
          >
            Open Scheduler
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: '142', change: '+12', icon: <Users size={20} />, color: 'court' },
          { label: 'Active Teams', value: '6', change: '', icon: <Shield size={20} />, color: 'court' },
          { label: 'Events This Week', value: String(todayEvents.length + upcomingEvents.length), change: '', icon: <Calendar size={20} />, color: 'court' },
          { label: 'Avg Session RPE', value: '6.4', change: '-0.3', icon: <TrendingUp size={20} />, color: 'court' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-dark-100 p-5 hover:shadow-card-hover transition-all duration-300 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-court-500/10 flex items-center justify-center text-court-600 group-hover:bg-court-500 group-hover:text-white transition-all duration-300">
                {stat.icon}
              </div>
              {stat.change && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-extrabold text-dark-900">{stat.value}</p>
            <p className="text-xs text-dark-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Today's Schedule */}
        <motion.div variants={stagger.item} className="lg:col-span-3 bg-white rounded-2xl border border-dark-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
            <h2 className="text-base font-bold text-dark-900">Today's Schedule</h2>
            <button
              onClick={() => navigate(`/o/${organizationId}/schedule/calendar`)}
              className="text-xs font-semibold text-court-500 hover:text-court-600 flex items-center gap-1"
            >
              View Calendar <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-dark-100">
            {todayEvents.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar size={32} className="text-dark-200 mx-auto mb-3" />
                <p className="text-sm text-dark-400">No events scheduled for today</p>
              </div>
            ) : (
              todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-dark-50/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/o/${organizationId}/schedule/calendar`)}
                >
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: ev.eventType.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-dark-900 truncate group-hover:text-court-600 transition-colors">
                        {ev.title}
                      </p>
                      {/* Module icons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {ev.hasItinerary && <span title="Itinerary" className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-purple-50 text-purple-500"><Route size={10} /></span>}
                        {ev.hasChecklist && <span title="Checklist" className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-cyan-50 text-cyan-600"><ListChecks size={10} /></span>}
                        {ev.hasSession && <span title="Session" className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-amber-50 text-amber-500"><Activity size={10} /></span>}
                        {ev.hasHydration && <span title="Hydration" className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-court-50 text-court-500"><Droplets size={10} /></span>}
                        {ev.hasAssignment && <span title="Assignment" className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-orange-50 text-orange-500"><UserCog size={10} /></span>}
                        {ev.hasFiles && <span title="Files" className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-gray-50 text-gray-500"><FileText size={10} /></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {ev.start.time} - {ev.end.time}
                      </span>
                      <span>{ev.teamNames.join(', ')}</span>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0"
                    style={{
                      backgroundColor: ev.eventType.color + '15',
                      color: ev.eventType.color,
                    }}
                  >
                    {ev.eventType.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Setup Guide */}
        <motion.div variants={stagger.item} className="lg:col-span-2 bg-white rounded-2xl border border-dark-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-100">
            <h2 className="text-base font-bold text-dark-900">Setup Guide</h2>
            <p className="text-xs text-dark-400 mt-0.5">
              {timelineSteps.filter(s => s.completed).length}/{timelineSteps.length} completed
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-dark-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-court-500 to-court-400 rounded-full transition-all duration-500"
                style={{ width: `${(timelineSteps.filter(s => s.completed).length / timelineSteps.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto">
            {timelineSteps.map((step, i) => (
              <div
                key={step.title}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                  step.completed ? 'hover:bg-dark-50' : 'hover:bg-court-50 bg-court-50/50'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  step.completed
                    ? 'bg-court-500 text-white'
                    : 'bg-dark-100 text-dark-400'
                }`}>
                  {step.completed ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.completed ? 'text-dark-600' : 'text-dark-900'}`}>
                    {step.title}
                  </p>
                  <p className="text-[11px] text-dark-400 truncate">{step.subtitle}</p>
                </div>
                <span className="text-[10px] text-dark-400 hidden xl:block">{step.path}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Teams Overview */}
      <motion.div variants={stagger.item} className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100">
          <h2 className="text-base font-bold text-dark-900">Teams Overview</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-5">
          {teams.map((team) => (
            <div
              key={team.id}
              className="text-center p-4 rounded-2xl border border-dark-100 hover:border-court-200 hover:shadow-card transition-all duration-300 cursor-pointer group"
            >
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform"
                style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}bb)` }}
              >
                {team.shortName}
              </div>
              <p className="text-sm font-semibold text-dark-800 truncate">{team.name}</p>
              <p className="text-xs text-dark-400 mt-0.5">{team.memberCount} players</p>
              <p className="text-[11px] text-dark-400">{team.coachName}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
