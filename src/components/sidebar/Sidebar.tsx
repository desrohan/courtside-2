import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Home, HelpCircle, User, UserCheck, Users, Calendar,
  FileText, Target, MessageCircle, Settings, ChevronDown, ChevronLeft,
  ChevronRight, Hexagon, Trophy, GanttChart, Briefcase,
} from 'lucide-react';
import { getNavigation, NavItem, NavSection } from '@/data/navigation';

const iconMap: Record<string, React.ReactNode> = {
  'layout-dashboard': <LayoutDashboard size={20} />,
  'home': <Home size={20} />,
  'help-circle': <HelpCircle size={20} />,
  'user': <User size={20} />,
  'user-check': <UserCheck size={20} />,
  'users': <Users size={20} />,
  'calendar': <Calendar size={20} />,
  'file-text': <FileText size={20} />,
  'target': <Target size={20} />,
  'message-circle': <MessageCircle size={20} />,
  'trophy': <Trophy size={20} />,
  'gantt-chart': <GanttChart size={20} />,
  'briefcase': <Briefcase size={20} />,
  'settings': <Settings size={20} />,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navData = getNavigation(organizationId || '');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 272 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-dark-100"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[72px] border-b border-dark-100 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-court-500 to-court-700 flex items-center justify-center shrink-0">
          <Hexagon size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-lg font-bold tracking-tight text-dark-900">Courtside</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navData.map((section) => (
          <div key={section.subheader}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-dark-400"
                >
                  {section.subheader}
                </motion.p>
              )}
            </AnimatePresence>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemRow
                  key={item.title}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive(item.path)}
                  isExpanded={expandedItems.includes(item.title)}
                  onToggleExpand={() => toggleExpanded(item.title)}
                  onNavigate={(path) => navigate(path)}
                  currentPath={location.pathname}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-dark-100 p-3 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center h-9 rounded-xl hover:bg-dark-50 transition-colors text-dark-400 hover:text-dark-600"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}

function NavItemRow({
  item, collapsed, isActive: active, isExpanded, onToggleExpand, onNavigate, currentPath,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNavigate: (path: string) => void;
  currentPath: string;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const childActive = hasChildren && item.children!.some(c => currentPath === c.path || currentPath.startsWith(c.path + '/'));
  const isHighlighted = active || childActive;

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpand();
    } else {
      onNavigate(item.path);
    }
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={`
          relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
          ${isHighlighted
            ? 'bg-court-500/8 text-court-700'
            : 'text-dark-500 hover:bg-dark-50 hover:text-dark-800'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
      >
        {isHighlighted && (
          <motion.div
            layoutId="sidebar-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-court-500 rounded-r-full"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <span className={`shrink-0 ${isHighlighted ? 'text-court-600' : 'text-dark-400 group-hover:text-dark-600'}`}>
          {iconMap[item.icon] || <FileText size={20} />}
        </span>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 text-left truncate"
            >
              {item.title}
            </motion.span>
          )}
        </AnimatePresence>
        {!collapsed && item.badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
            {item.badge}
          </span>
        )}
        {!collapsed && hasChildren && (
          <ChevronDown
            size={14}
            className={`text-dark-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Children */}
      <AnimatePresence>
        {!collapsed && hasChildren && isExpanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-5 mt-0.5 space-y-0.5 border-l-2 border-dark-100 pl-3"
          >
            {item.children!.map((child) => {
              const childIsActive = currentPath === child.path || currentPath.startsWith(child.path + '/');
              return (
                <li key={child.title}>
                  <button
                    onClick={() => onNavigate(child.path)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all duration-150
                      ${childIsActive ? 'text-court-600 font-semibold bg-court-500/5' : 'text-dark-500 hover:text-dark-800 hover:bg-dark-50'}
                    `}
                  >
                    {child.title}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}
