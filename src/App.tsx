import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
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
import PlannerModule from './pages/PlannerModule';
import SettingsModule from './pages/SettingsModule';
import WorkforceModule from './pages/WorkforceModule';
import PlaceholderPage from './pages/PlaceholderPage';
import AthleteSignup from './pages/AthleteSignup';
import LoginPage from './pages/auth/LoginPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import OnboardingLanding from './pages/onboarding/OnboardingLanding';
import CreateOrgPage from './pages/onboarding/CreateOrgPage';
import JoinOrgPage from './pages/onboarding/JoinOrgPage';

function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-court-500 border-t-transparent animate-spin" />
        <p className="text-sm text-dark-400 font-medium">Loading…</p>
      </div>
    </div>
  );
}

// Route guard: redirects unauthenticated users to /auth/login
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

// Route guard: redirects users with no org to /onboarding, with 1+ orgs into the app
function RequireOrg({ children }: { children: React.ReactNode }) {
  const { user, loading, memberships, currentOrg } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (memberships.length === 0) return <Navigate to="/onboarding" replace />;
  if (!currentOrg && memberships.length > 0) return <Navigate to="/o" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading, memberships, currentOrg } = useAuth();

  if (loading) return <FullPageSpinner />;

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public */}
        <Route path="/register/:orgSlug" element={<AthleteSignup />} />
        <Route path="/auth/login" element={
          user ? <Navigate to="/o" replace /> : <LoginPage />
        } />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Onboarding (auth required, no org yet) */}
        <Route path="/onboarding" element={
          <RequireAuth><OnboardingLanding /></RequireAuth>
        } />
        <Route path="/onboarding/create" element={
          <RequireAuth><CreateOrgPage /></RequireAuth>
        } />
        <Route path="/onboarding/join" element={
          <RequireAuth><JoinOrgPage /></RequireAuth>
        } />

        {/* Org selector (multi-org users or post-login redirect) */}
        <Route path="/o" element={
          <RequireAuth>
            {memberships.length === 0
              ? <Navigate to="/onboarding" replace />
              : memberships.length === 1
                ? <Navigate to={`/o/${memberships[0].orgId}`} replace />
                : <SelectOrganization />}
          </RequireAuth>
        } />

        {/* Main app */}
        <Route path="/o/:organizationId" element={
          <RequireOrg>
            <ChatProvider>
              <OrgLayout />
            </ChatProvider>
          </RequireOrg>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="schedule/calendar" element={<Scheduler />} />
          <Route path="planner" element={<PlannerModule />} />
          <Route path="workforce/*" element={<WorkforceModule />} />
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/o' : '/auth/login'} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
