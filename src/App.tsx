import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SelectOrganization from './pages/SelectOrganization';
import OrgLayout from './layouts/OrgLayout';
import Dashboard from './pages/Dashboard';
import Scheduler from './pages/Scheduler';
import FormsModule from './pages/FormsModule';
import TeamsModule from './pages/TeamsModule';
import GroupsModule from './pages/GroupsModule';
import UsersModule from './pages/UsersModule';
import ChatModule from './pages/ChatModule';
import TournamentModule from './pages/TournamentModule';
import SettingsModule from './pages/SettingsModule';
import PlaceholderPage from './pages/PlaceholderPage';
import AthleteSignup from './pages/AthleteSignup';

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Navigate to="/o" replace />} />
        <Route path="/register/:orgSlug" element={<AthleteSignup />} />
        <Route path="/o" element={<SelectOrganization />} />
        <Route path="/o/:organizationId" element={<OrgLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="schedule/calendar" element={<Scheduler />} />
          <Route path="user/*" element={<UsersModule />} />
          <Route path="invite" element={<PlaceholderPage title="Approve Requests" icon="user-check" />} />
          <Route path="team/*" element={<TeamsModule />} />
          <Route path="groups/*" element={<GroupsModule />} />
          <Route path="form/*" element={<FormsModule />} />
          <Route path="session" element={<PlaceholderPage title="Sessions" icon="target" />} />
          <Route path="chat/*" element={<ChatModule />} />
          <Route path="tournament/*" element={<TournamentModule />} />
          <Route path="settings/*" element={<SettingsModule />} />
          <Route path="helpguide/*" element={<PlaceholderPage title="Help Guide" icon="help-circle" />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
