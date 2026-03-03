export interface StackFrame {
  id: string;
  name: string;
  type: 'global' | 'function' | 'callback' | 'promise' | 'async';
}

export interface HeapEntry {
  id: string;
  name: string;
  value: string;
  type: 'variable' | 'object' | 'function';
}

export interface WebAPIEntry {
  id: string;
  name: string;
  type: 'timeout' | 'interval' | 'fetch';
  delay: number;
}

export interface QueueEntry {
  id: string;
  name: string;
  type: 'microtask' | 'macrotask';
}

export interface SimulationState {
  callStack: StackFrame[];
  heap: HeapEntry[];
  webAPIs: WebAPIEntry[];
  microtaskQueue: QueueEntry[];
  callbackQueue: QueueEntry[];
  consoleLogs: string[];
  eventLoopActive: boolean;
  eventLoopPhase: 'idle' | 'checking' | 'microtask' | 'callback';
  currentLine: number | null;
}

export type StepAction =
  | 'push_stack'
  | 'pop_stack'
  | 'log'
  | 'add_heap'
  | 'add_webapi'
  | 'remove_webapi'
  | 'add_microtask'
  | 'remove_microtask'
  | 'add_callback'
  | 'remove_callback'
  | 'move_microtask'
  | 'move_callback'
  | 'event_loop_check'
  | 'timer_complete'
  | 'complete';

export interface SimulationStep {
  id: number;
  action: StepAction;
  label: string;
  description: string;
  explanation: string;
  state: SimulationState;
}

export interface ParsedStatement {
  type: 'console_log' | 'set_timeout' | 'promise_then' | 'promise_chain' | 'variable_declaration' | 'function_call' | 'expression';
  line: number;
  endLine: number;
  args?: string[];
  delay?: number;
  body?: ParsedStatement[];
  chainedBodies?: ParsedStatement[][];
  name?: string;
  value?: string;
  raw: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
}
