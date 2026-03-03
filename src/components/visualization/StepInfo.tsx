import { motion, AnimatePresence } from 'framer-motion';
import { Info, BookOpen } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useState } from 'react';

function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-metal-100 font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="text-accent-blue bg-accent-blue/10 px-1 py-0.5 rounded text-[10px] font-mono">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function StepInfo() {
  const { steps, currentStepIndex, hasStarted } = useSimulationStore();
  const currentStep = hasStarted && steps[currentStepIndex] ? steps[currentStepIndex] : null;
  const [showExplanation, setShowExplanation] = useState(true);

  return (
    <AnimatePresence mode="wait">
      {currentStep && (
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="bg-dark-800/60 border border-white/[0.06] rounded-lg overflow-hidden"
        >
          <div className="flex items-start gap-2 px-4 py-2.5">
            <Info size={14} className="text-accent-blue mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-metal-200 text-xs font-medium">{currentStep.label}</p>
              <p className="text-metal-500 text-[11px] mt-0.5">{currentStep.description}</p>
            </div>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-dark-700 hover:bg-dark-600 border border-white/[0.06] text-metal-400 hover:text-metal-200 text-[10px] font-medium transition-all shrink-0"
            >
              <BookOpen size={11} />
              {showExplanation ? 'Hide' : 'Explain'}
            </button>
          </div>

          <AnimatePresence>
            {showExplanation && currentStep.explanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-2.5 border-t border-white/[0.04] bg-accent-blue/[0.02]">
                  <p className="text-metal-300 text-[11px] leading-relaxed">
                    {renderMarkdown(currentStep.explanation)}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
