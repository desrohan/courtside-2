import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar/Sidebar';
import Topbar from '@/components/topbar/Topbar';

export default function OrgLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-dark-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar sidebarCollapsed={collapsed} />
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 272 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="pt-[72px] min-h-screen"
      >
        <div className="p-6">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
