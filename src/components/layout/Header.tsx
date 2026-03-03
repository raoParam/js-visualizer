import { Braces, Github } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

export function Header() {
  const { steps, currentStepIndex, hasStarted } = useSimulationStore();
  const currentStep = hasStarted && steps[currentStepIndex] ? steps[currentStepIndex] : null;

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-dark-800/60 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
          <Braces size={18} className="text-accent-blue" />
        </div>
        <div>
          <h1 className="text-metal-100 text-base font-bold tracking-tight">JSFlow</h1>
          <p className="text-metal-500 text-[10px] font-medium tracking-wide uppercase">JS Execution Visualizer</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {currentStep && (
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-lg bg-dark-700/80 border border-white/[0.06]">
            <span className="text-metal-500 text-xs font-medium">Step {currentStepIndex + 1}/{steps.length}</span>
            <span className="text-metal-300 text-xs">{currentStep.label}</span>
          </div>
        )}

        <a
          href="https://github.com/raoParam/js-visualizer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-metal-500 hover:text-metal-200 transition-colors"
        >
          <Github size={18} />
        </a>
      </div>
    </header>
  );
}
