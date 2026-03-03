import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { GlassCard } from '../shared/GlassCard';

export function CallbackQueue() {
  const { currentState } = useSimulationStore();

  return (
    <GlassCard
      title="Callback Queue"
      icon={<Timer size={14} />}
      accentColor="border-accent-orange/20"
    >
      <div className="min-h-[60px]">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-accent-orange bg-accent-orange/10 px-1.5 py-0.5 rounded">
            Macrotasks
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence mode="popLayout">
            {currentState.callbackQueue.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-metal-500 text-xs py-3 w-full text-center"
              >
                Queue empty
              </motion.div>
            )}
            {currentState.callbackQueue.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="px-3 py-1.5 rounded-md bg-accent-orange/8 border border-accent-orange/15 text-xs font-mono text-metal-200"
              >
                {entry.name}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}
