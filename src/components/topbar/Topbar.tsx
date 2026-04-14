import { useParams, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, ChevronDown, LogOut, ArrowLeftRight } from 'lucide-react';
import { organizations } from '@/data/organizations';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const { user, currentOrg, signOut } = useAuth();
  const org = organizations.find(o => o.id === organizationId);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? '';
  const email = user?.email ?? '';
  const firstName = displayName.split(' ')[0] ?? '';
  const initials = displayName.split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '?';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const orgName = currentOrg?.orgName ?? org?.name ?? 'Organization';
  const orgSport = currentOrg?.sport ?? org?.sport ?? '';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    setShowProfile(false);
    await signOut();
    navigate('/auth/login', { replace: true });
  };

  const handleSwitchOrg = () => {
    setShowProfile(false);
    navigate('/o');
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 h-[72px] bg-white/80 backdrop-blur-xl border-b border-dark-100 flex items-center justify-between px-6 transition-all duration-250"
      style={{ left: sidebarCollapsed ? 72 : 272 }}
    >
      {/* Left: Org name */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-dark-900">{orgName}</h1>
          <p className="text-xs text-dark-400 mt-0.5">{orgSport ? `${orgSport} ` : ''}Organization</p>
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
        <button className="relative p-2.5 rounded-xl hover:bg-dark-50 transition-colors group">
          <Bell size={19} className="text-dark-500 group-hover:text-dark-700" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-white">{initials}</span>}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-dark-800 leading-tight">{displayName || firstName}</p>
              <p className="text-[11px] text-dark-400 leading-tight">{email}</p>
            </div>
            <ChevronDown size={14} className="text-dark-400 hidden lg:block" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-elevated border border-dark-100 p-2 z-50">
              <div className="px-3 py-2 mb-1">
                <p className="text-sm font-semibold text-dark-900">{displayName}</p>
                <p className="text-xs text-dark-400 truncate">{email}</p>
              </div>
              <hr className="border-dark-100 my-1" />
              <button
                onClick={handleSwitchOrg}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-dark-600 hover:bg-dark-50 hover:text-dark-900 transition-colors"
              >
                <ArrowLeftRight size={16} />
                Switch Organization
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
