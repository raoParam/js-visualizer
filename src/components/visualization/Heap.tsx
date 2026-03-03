import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { GlassCard } from '../shared/GlassCard';

export function Heap() {
  const { currentState } = useSimulationStore();

  return (
    <GlassCard
      title="Heap Memory"
      icon={<HardDrive size={14} />}
      accentColor="border-accent-cyan/20"
    >
      <div className="min-h-[100px]">
        <AnimatePresence mode="popLayout">
          {currentState.heap.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-metal-500 text-xs text-center py-8"
            >
              No allocations
            </motion.div>
          )}
        </AnimatePresence>
        <div className="grid grid-cols-2 gap-1.5">
          <AnimatePresence>
            {currentState.heap.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="px-2.5 py-2 rounded-md bg-accent-cyan/5 border border-accent-cyan/10"
              >
                <div className="text-accent-cyan text-[10px] font-mono font-semibold">{entry.name}</div>
                <div className="text-metal-300 text-xs font-mono mt-0.5 truncate">{entry.value}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </GlassCard>
  );
}
