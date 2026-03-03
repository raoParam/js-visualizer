import { create } from 'zustand';
import type { SimulationState, SimulationStep } from '../types';
import { examples } from '../data/examples';
import { generateSteps } from '../simulator/stepGenerator';

const emptyState: SimulationState = {
  callStack: [],
  heap: [],
  webAPIs: [],
  microtaskQueue: [],
  callbackQueue: [],
  consoleLogs: [],
  eventLoopActive: false,
  eventLoopPhase: 'idle',
  currentLine: null,
};

interface SimulationStore {
  code: string;
  steps: SimulationStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;
  currentState: SimulationState;
  hasStarted: boolean;

  setCode: (code: string) => void;
  loadExample: (exampleId: string) => void;
  run: () => void;
  step: () => void;
  stepBack: () => void;
  reset: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  code: examples[0].code,
  steps: [],
  currentStepIndex: -1,
  isPlaying: false,
  speed: 1000,
  currentState: emptyState,
  hasStarted: false,

  setCode: (code: string) => {
    set({ code, steps: [], currentStepIndex: -1, currentState: emptyState, isPlaying: false, hasStarted: false });
  },

  loadExample: (exampleId: string) => {
    const example = examples.find(e => e.id === exampleId);
    if (example) {
      set({
        code: example.code,
        steps: [],
        currentStepIndex: -1,
        currentState: emptyState,
        isPlaying: false,
        hasStarted: false,
      });
    }
  },

  run: () => {
    const { code } = get();
    const steps = generateSteps(code);
    set({
      steps,
      currentStepIndex: 0,
      currentState: steps.length > 0 ? steps[0].state : emptyState,
      isPlaying: true,
      hasStarted: true,
    });
  },

  step: () => {
    const { steps, currentStepIndex, code, hasStarted } = get();

    if (!hasStarted) {
      const newSteps = generateSteps(code);
      set({
        steps: newSteps,
        currentStepIndex: 0,
        currentState: newSteps.length > 0 ? newSteps[0].state : emptyState,
        hasStarted: true,
        isPlaying: false,
      });
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      set({
        currentStepIndex: nextIndex,
        currentState: steps[nextIndex].state,
        isPlaying: false,
      });
    } else {
      set({ isPlaying: false });
    }
  },

  stepBack: () => {
    const { steps, currentStepIndex } = get();
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      set({
        currentStepIndex: prevIndex,
        currentState: steps[prevIndex].state,
      });
    }
  },

  reset: () => {
    set({
      steps: [],
      currentStepIndex: -1,
      currentState: emptyState,
      isPlaying: false,
      hasStarted: false,
    });
  },

  togglePlay: () => {
    const { isPlaying, hasStarted, code, steps, currentStepIndex } = get();

    if (!hasStarted) {
      const newSteps = generateSteps(code);
      set({
        steps: newSteps,
        currentStepIndex: 0,
        currentState: newSteps.length > 0 ? newSteps[0].state : emptyState,
        hasStarted: true,
        isPlaying: true,
      });
      return;
    }

    if (currentStepIndex >= steps.length - 1) {
      const newSteps = generateSteps(code);
      set({
        steps: newSteps,
        currentStepIndex: 0,
        currentState: newSteps.length > 0 ? newSteps[0].state : emptyState,
        isPlaying: true,
      });
      return;
    }

    set({ isPlaying: !isPlaying });
  },

  setSpeed: (speed: number) => set({ speed }),
}));
