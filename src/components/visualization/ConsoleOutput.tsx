import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { GlassCard } from '../shared/GlassCard';

export function ConsoleOutput() {
  const { currentState } = useSimulationStore();

  return (
    <GlassCard
      title="Console"
      icon={<Terminal size={14} />}
      accentColor="border-accent-green/20"
    >
      <div className="min-h-[80px] font-mono text-xs space-y-0.5">
        <AnimatePresence>
          {currentState.consoleLogs.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-metal-500 text-center py-6 font-sans"
            >
              No output yet
            </motion.div>
          )}
          {currentState.consoleLogs.map((log, index) => (
            <motion.div
              key={`${log}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 px-2 py-1 rounded bg-accent-green/[0.03]"
            >
              <span className="text-accent-green/60 select-none">›</span>
              <span className="text-accent-green">{log}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
