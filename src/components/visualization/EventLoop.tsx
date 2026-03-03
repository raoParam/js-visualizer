import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { GlassCard } from '../shared/GlassCard';

const phaseConfig = {
  idle: { color: 'text-metal-500', ring: 'border-metal-500/20', bg: 'bg-metal-500/5', label: 'Idle' },
  checking: { color: 'text-accent-cyan', ring: 'border-accent-cyan/40', bg: 'bg-accent-cyan/5', label: 'Checking' },
  microtask: { color: 'text-accent-purple', ring: 'border-accent-purple/40', bg: 'bg-accent-purple/5', label: 'Microtask' },
  callback: { color: 'text-accent-orange', ring: 'border-accent-orange/40', bg: 'bg-accent-orange/5', label: 'Callback' },
};

export function EventLoop() {
  const { currentState } = useSimulationStore();
  const { eventLoopActive, eventLoopPhase } = currentState;
  const config = phaseConfig[eventLoopPhase];

  return (
    <GlassCard
      title="Event Loop"
      icon={<RefreshCw size={14} />}
      accentColor="border-accent-cyan/20"
    >
      <div className="flex flex-col items-center justify-center min-h-[100px] py-2">
        <div className="relative">
          <motion.div
            className={`w-20 h-20 rounded-full border-2 border-dashed ${config.ring} ${config.bg} flex items-center justify-center`}
            animate={{
              rotate: eventLoopActive ? 360 : 0,
            }}
            transition={{
              rotate: {
                duration: 2,
                repeat: eventLoopActive ? Infinity : 0,
                ease: 'linear',
              },
            }}
          >
            <motion.div
              animate={{
                scale: eventLoopActive ? [1, 1.1, 1] : 1,
              }}
              transition={{
                duration: 1,
                repeat: eventLoopActive ? Infinity : 0,
              }}
            >
              <RefreshCw size={24} className={config.color} />
            </motion.div>
          </motion.div>

          {eventLoopActive && (
            <motion.div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${config.bg} border ${config.ring}`}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        <motion.div
          className="mt-3 text-center"
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <span className={`text-xs font-semibold ${config.color}`}>
            {config.label}
          </span>
          {eventLoopPhase === 'microtask' && (
            <p className="text-metal-500 text-[10px] mt-0.5">Higher priority</p>
          )}
          {eventLoopPhase === 'callback' && (
            <p className="text-metal-500 text-[10px] mt-0.5">Processing macrotasks</p>
          )}
        </motion.div>
      </div>
    </GlassCard>
  );
}
