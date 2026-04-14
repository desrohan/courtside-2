import { motion } from 'framer-motion';
import {
  User, UserCheck, Users, FileText, Target, MessageCircle,
  Settings, HelpCircle, Construction,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'user': <User size={32} />,
  'user-check': <UserCheck size={32} />,
  'users': <Users size={32} />,
  'file-text': <FileText size={32} />,
  'target': <Target size={32} />,
  'message-circle': <MessageCircle size={32} />,
  'settings': <Settings size={32} />,
  'help-circle': <HelpCircle size={32} />,
};

export default function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-court-500/10 flex items-center justify-center mb-6 text-court-500">
        {iconMap[icon] || <Construction size={32} />}
      </div>
      <h2 className="text-2xl font-bold text-dark-900 mb-2">{title}</h2>
      <p className="text-dark-400 text-sm max-w-sm">
        This module is part of the Courtside ERP. The scheduler module is fully designed — navigate there to see it in action.
      </p>
    </motion.div>
  );
}
