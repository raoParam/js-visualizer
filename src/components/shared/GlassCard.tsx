import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  accentColor?: string;
  className?: string;
}

export function GlassCard({ title, icon, children, accentColor = 'border-metal-500/30', className = '' }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative z-0 bg-dark-800/80 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-lg shadow-black/20 ${className}`}
    >
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${accentColor}`}>
        <span className="text-metal-400">{icon}</span>
        <h3 className="text-metal-200 text-xs font-semibold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-3 relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
