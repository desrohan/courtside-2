import { useParams, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, ChevronDown, LogOut } from 'lucide-react';
import { currentUser } from '@/data/users';
import { organizations } from '@/data/organizations';
import { useState, useRef, useEffect } from 'react';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const org = organizations.find(o => o.id === organizationId);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-30 h-[72px] bg-white/80 backdrop-blur-xl border-b border-dark-100 flex items-center justify-between px-6 transition-all duration-250"
      style={{ left: sidebarCollapsed ? 72 : 272 }}
    >
      {/* Left: Org name + breadcrumb */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-dark-900">{org?.name || 'FC Courtside'}</h1>
          <p className="text-xs text-dark-400 mt-0.5">{org?.sport} Organization</p>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center max-w-md w-full mx-8">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Search events, users, teams..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-dark-50 border border-transparent text-sm text-dark-800 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-court-500/20 focus:border-court-500/30 focus:bg-white transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-dark-400 bg-white border border-dark-200 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-dark-50 transition-colors group">
          <Bell size={19} className="text-dark-500 group-hover:text-dark-700" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate(`/o/${organizationId}/settings/account`)}
          className="p-2.5 rounded-xl hover:bg-dark-50 transition-colors group"
        >
          <Settings size={19} className="text-dark-500 group-hover:text-dark-700" />
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative ml-2">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-dark-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{currentUser.avatar}</span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-dark-800 leading-tight">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-[11px] text-dark-400 leading-tight">{currentUser.designation}</p>
            </div>
            <ChevronDown size={14} className="text-dark-400 hidden lg:block" />
          </button>

          {/* Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-dark-100 p-2 animate-scale-in z-50">
              <div className="px-3 py-2 mb-1">
                <p className="text-sm font-semibold text-dark-900">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-xs text-dark-400">{currentUser.email}</p>
              </div>
              <hr className="border-dark-100 my-1" />
              <button
                onClick={() => { setShowProfile(false); navigate('/o'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-dark-600 hover:bg-dark-50 hover:text-dark-900 transition-colors"
              >
                <LogOut size={16} />
                Switch Organization
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
