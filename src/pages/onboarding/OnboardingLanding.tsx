import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Plus, Hash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function OnboardingLanding() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-court-50 flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-dark-100 bg-white/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-court-500 to-court-700 flex items-center justify-center">
            <Hexagon size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-dark-900">Courtside</span>
        </div>
        <button onClick={signOut} className="text-xs text-dark-400 hover:text-dark-700 transition-colors">
          Sign out
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-extrabold text-dark-900 mb-2">
              Welcome, {displayName.split(' ')[0]}!
            </h1>
            <p className="text-sm text-dark-400">
              Get started by creating a new organization or joining an existing one.
            </p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => navigate('/onboarding/create')}
              className="group flex items-center gap-4 p-5 bg-white border-2 border-dark-100 rounded-2xl hover:border-court-400 transition-all shadow-card hover:shadow-card-hover text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-court-50 group-hover:bg-court-100 flex items-center justify-center transition-colors shrink-0">
                <Plus size={22} className="text-court-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-dark-900">Create an organization</p>
                <p className="text-xs text-dark-400 mt-0.5">Set up a new team, club or academy</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/onboarding/join')}
              className="group flex items-center gap-4 p-5 bg-white border-2 border-dark-100 rounded-2xl hover:border-court-400 transition-all shadow-card hover:shadow-card-hover text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-dark-50 group-hover:bg-dark-100 flex items-center justify-center transition-colors shrink-0">
                <Hash size={22} className="text-dark-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-dark-900">Join an organization</p>
                <p className="text-xs text-dark-400 mt-0.5">Enter an invite code from your team admin</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
