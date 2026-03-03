import { Play, Pause, SkipForward, SkipBack, RotateCcw, Gauge, BookOpen } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { examples } from '../../data/examples';
import { useEffect, useRef } from 'react';

export function ControlPanel() {
  const {
    isPlaying,
    speed,
    hasStarted,
    steps,
    currentStepIndex,
    togglePlay,
    step,
    stepBack,
    reset,
    setSpeed,
    loadExample,
    code,
  } = useSimulationStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFinished = hasStarted && currentStepIndex >= steps.length - 1;

  useEffect(() => {
    if (isPlaying && !isFinished) {
      intervalRef.current = setInterval(() => {
        const store = useSimulationStore.getState();
        if (store.currentStepIndex < store.steps.length - 1) {
          store.step();
        } else {
          useSimulationStore.setState({ isPlaying: false });
        }
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, isFinished]);

  const selectedExample = examples.find(e => e.code === code);

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-dark-800/60 backdrop-blur-sm border-t border-white/[0.06]">
      <div className="flex items-center gap-1.5">
        <button
          onClick={togglePlay}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/20 text-accent-blue text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          {isPlaying ? 'Pause' : hasStarted && !isFinished ? 'Resume' : 'Run'}
        </button>

        <button
          onClick={stepBack}
          disabled={!hasStarted || currentStepIndex <= 0}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 border border-white/[0.06] text-metal-300 text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          <SkipBack size={13} />
          Back
        </button>

        <button
          onClick={step}
          disabled={isFinished}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 border border-white/[0.06] text-metal-300 text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          <SkipForward size={13} />
          Step
        </button>

        <button
          onClick={reset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 border border-white/[0.06] text-metal-300 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      <div className="h-6 w-px bg-white/[0.06] hidden sm:block" />

      <div className="flex items-center gap-2">
        <Gauge size={13} className="text-metal-500" />
        <span className="text-metal-500 text-[10px] font-medium uppercase tracking-wider">Speed</span>
        <input
          type="range"
          min={100}
          max={2000}
          step={100}
          value={2100 - speed}
          onChange={(e) => setSpeed(2100 - Number(e.target.value))}
          className="w-20 accent-accent-blue h-1 cursor-pointer"
        />
      </div>

      <div className="h-6 w-px bg-white/[0.06] hidden sm:block" />

      <div className="flex items-center gap-2">
        <BookOpen size={13} className="text-metal-500" />
        <select
          value={selectedExample?.id ?? ''}
          onChange={(e) => loadExample(e.target.value)}
          className="bg-dark-700 text-metal-200 text-xs rounded-lg px-2.5 py-1.5 border border-white/[0.06] outline-none focus:border-accent-blue/30 cursor-pointer"
        >
          {examples.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title}
            </option>
          ))}
        </select>
      </div>

      {hasStarted && (
        <div className="ml-auto hidden lg:flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
            <span className="text-metal-500 text-[10px]">Function</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
            <span className="text-metal-500 text-[10px]">Promise</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
            <span className="text-metal-500 text-[10px]">Callback</span>
          </div>
        </div>
      )}
    </div>
  );
}
