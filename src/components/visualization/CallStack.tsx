import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { GlassCard } from '../shared/GlassCard';

const frameColors: Record<string, string> = {
  global: 'border-l-metal-400 bg-metal-400/5',
  function: 'border-l-accent-blue bg-accent-blue/5',
  callback: 'border-l-accent-orange bg-accent-orange/5',
  promise: 'border-l-accent-purple bg-accent-purple/5',
  async: 'border-l-accent-cyan bg-accent-cyan/5',
};

export function CallStack() {
  const { currentState } = useSimulationStore();
  const frames = [...currentState.callStack].reverse();

  return (
    <GlassCard
      title="Call Stack"
      icon={<Layers size={14} />}
      accentColor="border-accent-blue/20"
    >
      <div className="space-y-1.5 min-h-[100px]">
        <AnimatePresence mode="popLayout">
          {frames.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-metal-500 text-xs text-center py-8"
            >
              Stack is empty
            </motion.div>
          )}
          {frames.map((frame, index) => (
            <motion.div
              key={frame.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`px-3 py-2 rounded-md border-l-2 ${frameColors[frame.type] ?? frameColors.function}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-metal-100 text-xs font-mono font-medium">{frame.name}</span>
                {index === 0 && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded">
                    top
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
