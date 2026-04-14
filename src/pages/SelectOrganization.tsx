import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Building2, MapPin, Phone, Mail, Users, ChevronRight, Hexagon, Plus, LogOut } from 'lucide-react';
import { organizations } from '@/data/organizations';
import { currentUser } from '@/data/users';

export default function SelectOrganization() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = organizations.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-court-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-dark-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-court-500 to-court-700 flex items-center justify-center">
              <Hexagon size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-dark-900">Courtside</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-sm font-semibold text-dark-800">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-[11px] text-dark-400">{currentUser.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{currentUser.avatar}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-extrabold text-dark-900 mb-2">
            Select Organization
          </h1>
          <p className="text-dark-400 text-base">
            Choose an organization to manage, or create a new one.
          </p>
        </motion.div>

        {/* Search + Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-dark-200 text-sm text-dark-800 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-500/40 shadow-card transition-all"
            />
          </div>
          <button className="h-12 px-5 rounded-2xl bg-court-500 text-white text-sm font-semibold hover:bg-court-600 transition-colors flex items-center gap-2 shadow-card hover:shadow-card-hover">
            <Plus size={18} />
            New Organization
          </button>
        </motion.div>

        {/* Org Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
              onClick={() => navigate(`/o/${org.id}/dashboard`)}
              className="group relative bg-white rounded-2xl border border-dark-100 p-6 cursor-pointer hover:shadow-card-hover hover:border-court-200 transition-all duration-300"
            >
              {/* Accent bar */}
              <div
                className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-all duration-300 group-hover:h-[calc(100%-24px)]"
                style={{ backgroundColor: org.primaryColor }}
              />

              {/* Logo + Name */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${org.primaryColor}, ${org.primaryColor}cc)` }}
                  >
                    {org.logo}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-dark-900 group-hover:text-court-600 transition-colors">
                      {org.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs text-dark-400 mt-0.5">
                      <Building2 size={12} />
                      {org.sport}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-dark-300 group-hover:text-court-500 group-hover:translate-x-1 transition-all mt-1"
                />
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 text-dark-500">
                  <MapPin size={14} className="text-dark-400 shrink-0" />
                  <span className="truncate">{org.address}, {org.city}</span>
                </div>
                <div className="flex items-center gap-2.5 text-dark-500">
                  <Phone size={14} className="text-dark-400 shrink-0" />
                  <span>{org.phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-dark-500">
                  <Mail size={14} className="text-dark-400 shrink-0" />
                  <span className="truncate">{org.email}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-dark-100">
                <div className="flex items-center gap-1.5 text-xs text-dark-400">
                  <Users size={13} />
                  <span className="font-semibold text-dark-700">{org.memberCount}</span> members
                </div>
                <div className="w-px h-3 bg-dark-200" />
                <div className="flex items-center gap-1.5 text-xs text-dark-400">
                  <span className="font-semibold text-dark-700">{org.teamCount}</span> teams
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination hint */}
        <div className="mt-8 text-center text-sm text-dark-400">
          Showing {filtered.length} of {organizations.length} organizations
        </div>
      </main>
    </div>
  );
}
