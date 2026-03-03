import type { SimulationStep } from '../types';
import { JSFlowInterpreter } from './interpreter';

export function generateSteps(code: string): SimulationStep[] {
  const interpreter = new JSFlowInterpreter(code);
  return interpreter.run();
}
