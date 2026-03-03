import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { GlassCard } from '../shared/GlassCard';

const typeIcons: Record<string, string> = {
  timeout: '⏱',
  interval: '🔁',
  fetch: '🌐',
};

export function WebAPIs() {
  const { currentState } = useSimulationStore();

  return (
    <GlassCard
      title="Web APIs"
      icon={<Globe size={14} />}
      accentColor="border-accent-orange/20"
    >
      <div className="space-y-1.5 min-h-[80px]">
        <AnimatePresence mode="popLayout">
          {currentState.webAPIs.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-metal-500 text-xs text-center py-6"
            >
              No active Web APIs
            </motion.div>
          )}
          {currentState.webAPIs.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent-orange/5 border border-accent-orange/10"
            >
              <span className="text-sm">{typeIcons[entry.type] ?? '⏱'}</span>
              <span className="text-metal-200 text-xs font-mono">{entry.name}</span>
              <span className="ml-auto text-accent-orange text-[10px] font-semibold">{entry.delay}ms</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
