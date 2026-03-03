import { parse as acornParse } from 'acorn';
import type * as ESTree from 'estree';
import type { SimulationState, SimulationStep, StackFrame, HeapEntry, WebAPIEntry, QueueEntry, StepAction } from '../types';

function formatValue(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (isClosure(val)) return 'ƒ()';
  if (Array.isArray(val)) return '[' + val.map(v => formatValue(v)).join(', ') + ']';
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return '{ ' + entries.map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ') + ' }';
  }
  return String(val);
}

function formatDisplayValue(val: unknown): string {
  if (typeof val === 'string') return val;
  return formatValue(val);
}

interface Closure {
  __closure: true;
  params: string[];
  body: ESTree.BlockStatement | ESTree.Expression;
  env: Environment;
}

function isClosure(val: unknown): val is Closure {
  return typeof val === 'object' && val !== null && '__closure' in val;
}

interface PromiseVal {
  __promise: true;
  value: unknown;
}

function isPromiseVal(val: unknown): val is PromiseVal {
  return typeof val === 'object' && val !== null && '__promise' in val;
}

interface PendingTask {
  name: string;
  closure: Closure;
  arg?: unknown;
  chainedCallbacks?: Closure[];
  delay?: number;
}

class Environment {
  private vars = new Map<string, unknown>();
  private parent: Environment | null;

  constructor(parent?: Environment) {
    this.parent = parent ?? null;
  }

  define(name: string, value: unknown): void {
    this.vars.set(name, value);
  }

  get(name: string): unknown {
    if (this.vars.has(name)) return this.vars.get(name);
    if (this.parent) return this.parent.get(name);
    return undefined;
  }

  has(name: string): boolean {
    if (this.vars.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }
}

function getLine(node: { loc?: ESTree.SourceLocation | null }): number | null {
  return node.loc ? node.loc.start.line - 1 : null;
}

export class JSFlowInterpreter {
  private steps: SimulationStep[] = [];
  private state: SimulationState;
  private globalEnv: Environment;
  private pendingMicrotasks: PendingTask[] = [];
  private pendingMacrotasks: PendingTask[] = [];
  private stepId = 0;
  private frameId = 0;
  private entryId = 0;
  private timerCount = 0;
  private promiseCount = 0;

  constructor(private code: string) {
    this.state = {
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
    this.globalEnv = new Environment();
  }

  run(): SimulationStep[] {
    let program: ESTree.Program;
    try {
      const ast = acornParse(this.code, {
        ecmaVersion: 2020,
        locations: true,
        sourceType: 'script',
      });
      program = ast as unknown as ESTree.Program;
    } catch (err) {
      this.emitStep(
        'complete',
        'Syntax Error',
        String(err instanceof Error ? err.message : err),
        '❌ The code could not be parsed. Check for syntax errors like missing brackets, semicolons, or invalid JavaScript syntax.'
      );
      return this.steps;
    }

    this.executeProgram(program);
    return this.steps;
  }

  private executeProgram(program: ESTree.Program): void {
    this.emitStep(
      'push_stack',
      'Create global execution context',
      'The JavaScript engine creates the Global Execution Context before running any code.',
      '🌍 Every JavaScript program starts by creating a **Global Execution Context**. This is the base environment where your top-level code runs. It sets up the global scope and the `this` keyword (which points to `window` in browsers).'
    );
    this.pushFrame('global()', 'global');
    this.emitStep(
      'push_stack',
      'global() on Call Stack',
      'Begin executing synchronous code from top to bottom.',
      '📚 The global context is pushed onto the **Call Stack**. JavaScript is single-threaded — it can only execute one thing at a time. The Call Stack keeps track of which function is currently running.'
    );

    for (const node of program.body) {
      this.execStatement(node as ESTree.Statement);
    }

    this.state.currentLine = null;
    this.popFrame();
    this.emitStep(
      'pop_stack',
      'Pop global()',
      'All synchronous code has finished executing.',
      '✅ All top-level synchronous code has been executed. The global execution context is popped off the Call Stack. But the program may not be done yet — there could be async callbacks waiting in the queues!'
    );

    this.processTimerCompletions();
    this.processEventLoop();

    this.state.eventLoopActive = false;
    this.state.eventLoopPhase = 'idle';
    this.emitStep(
      'complete',
      'Execution Complete',
      'All queues are empty — the program has finished.',
      '🏁 The Call Stack is empty, the Microtask Queue is empty, and the Callback Queue is empty. The Event Loop has no more work to do. The program execution is complete.'
    );
  }

  private execStatement(node: ESTree.Statement): void {
    switch (node.type) {
      case 'VariableDeclaration':
        this.execVariableDeclaration(node);
        break;
      case 'ExpressionStatement':
        this.execExpressionStatement(node);
        break;
      case 'ReturnStatement':
        break;
      case 'BlockStatement':
        for (const stmt of node.body) {
          this.execStatement(stmt);
        }
        break;
      case 'IfStatement':
        this.execIfStatement(node);
        break;
      case 'EmptyStatement':
        break;
      default:
        break;
    }
  }

  private execVariableDeclaration(node: ESTree.VariableDeclaration): void {
    const line = getLine(node);
    if (line !== null) this.state.currentLine = line;

    for (const decl of node.declarations) {
      if (decl.id.type !== 'Identifier') continue;
      const name = decl.id.name;
      const rawInit = decl.init ? this.nodeToString(decl.init) : 'undefined';
      const value = decl.init ? this.evalExpr(decl.init) : undefined;
      this.globalEnv.define(name, value);

      const displayVal = formatValue(value);
      const isComputed = rawInit !== displayVal && rawInit !== displayVal.replace(/"/g, '');

      const heapEntry: HeapEntry = {
        id: `heap-${this.entryId++}`,
        name,
        value: displayVal,
        type: typeof value === 'object' && value !== null && !isClosure(value) ? 'object' :
              isClosure(value) ? 'function' : 'variable',
      };
      this.state.heap.push(heapEntry);

      const kindLabel = node.kind === 'const' ? 'constant' : node.kind === 'let' ? 'let variable' : 'var variable';
      const evalNote = isComputed
        ? ` The expression \`${rawInit}\` is evaluated to \`${displayVal}\`.`
        : '';

      this.emitStep(
        'add_heap',
        `${node.kind} ${name} = ${displayVal}`,
        `Declare ${kindLabel} "${name}" with value ${displayVal} on line ${(line ?? 0) + 1}.`,
        `📦 \`${node.kind}\` declares a ${node.kind === 'const' ? 'block-scoped **constant** (cannot be reassigned)' : 'block-scoped **variable**'}.${evalNote} The value is stored in **heap memory** and the identifier \`${name}\` points to it.`
      );
    }
  }

  private execExpressionStatement(node: ESTree.ExpressionStatement): void {
    const expr = node.expression;
    const line = getLine(node);
    if (line !== null) this.state.currentLine = line;

    if (expr.type === 'CallExpression') {
      this.execCallExpression(expr, line);
    } else {
      this.evalExpr(expr);
    }
  }

  private execCallExpression(node: ESTree.CallExpression, line: number | null): void {
    if (this.isConsoleLog(node)) {
      this.execConsoleLog(node, line);
      return;
    }

    if (this.isSetTimeout(node)) {
      this.execSetTimeout(node, line);
      return;
    }

    const promiseChain = this.detectPromiseChain(node);
    if (promiseChain) {
      this.execPromiseChain(promiseChain, line);
      return;
    }

    this.evalExpr(node);
  }

  private execConsoleLog(node: ESTree.CallExpression, line: number | null): void {
    const args = node.arguments.map(arg => this.evalExpr(arg as ESTree.Expression));
    const output = args.map(a => formatDisplayValue(a)).join(' ');

    this.pushFrame(`console.log(${args.map(a => formatValue(a)).join(', ')})`, 'function');
    this.emitStep(
      'push_stack',
      `console.log(${formatValue(output)})`,
      `Execute console.log on line ${(line ?? 0) + 1}.`,
      `📝 \`console.log()\` is a **synchronous** built-in function. It is pushed onto the Call Stack and executes immediately. The argument${args.length > 1 ? 's are' : ' is'} evaluated: ${args.map(a => '`' + formatValue(a) + '`').join(', ')}.`
    );

    this.state.consoleLogs.push(output);
    this.emitStep(
      'log',
      `Output: "${output}"`,
      `"${output}" printed to the console.`,
      `🖥️ The value \`${output}\` is sent to the browser's console. In a real browser, you would see this in DevTools (F12 → Console tab).`
    );

    this.popFrame();
    this.emitStep(
      'pop_stack',
      'Pop console.log',
      'console.log completed and removed from Call Stack.',
      '⬆️ \`console.log\` has finished executing. It is **popped off** the Call Stack. The engine continues to the next line of code.'
    );
  }

  private execSetTimeout(node: ESTree.CallExpression, line: number | null): void {
    const callbackNode = node.arguments[0] as ESTree.Expression;
    const delayNode = node.arguments[1] as ESTree.Expression | undefined;
    const delay = delayNode ? (this.evalExpr(delayNode) as number) : 0;
    const closure = this.evalExpr(callbackNode) as Closure;

    this.timerCount++;
    const timerName = `Timer #${this.timerCount} (${delay}ms)`;
    const fnName = `setTimeout(${delay}ms)`;

    this.pushFrame(fnName, 'function');
    this.emitStep(
      'push_stack',
      fnName,
      `Register setTimeout with ${delay}ms delay on line ${(line ?? 0) + 1}.`,
      `⏱️ \`setTimeout\` is called with a delay of **${delay}ms**. This is NOT a JavaScript feature — it\'s a **Web API** provided by the browser. The JS engine hands the callback to the browser\'s timer system.`
    );

    const webApi: WebAPIEntry = {
      id: `api-${this.entryId++}`,
      name: timerName,
      type: 'timeout',
      delay,
    };
    this.state.webAPIs.push(webApi);
    this.emitStep(
      'add_webapi',
      `${timerName} → Web APIs`,
      `Timer registered in the browser's Web APIs environment.`,
      `🌐 The browser starts counting down **${delay}ms**. The callback function is stored outside of JavaScript, in the browser\'s Web API environment. When the timer expires, the callback will be moved to the **Callback Queue** (not directly to the Call Stack!).${delay === 0 ? ' Even with 0ms delay, the callback must wait for the Call Stack to be empty.' : ''}`
    );

    this.popFrame();
    this.emitStep(
      'pop_stack',
      `Pop ${fnName}`,
      'setTimeout registered, continue synchronous execution.',
      '⬆️ \`setTimeout\` itself is done (it just registered the timer). It is popped off the Call Stack. Execution continues synchronously — the callback has NOT run yet.'
    );

    this.pendingMacrotasks.push({
      name: timerName,
      closure,
      delay,
    });
  }

  private execPromiseChain(
    chain: { resolveValue: unknown; callbacks: Closure[]; argNode?: ESTree.Expression },
    line: number | null
  ): void {
    const fnName = 'Promise.resolve().then()';
    this.pushFrame(fnName, 'function');

    const resolveDisplay = chain.argNode ? this.nodeToString(chain.argNode) : '';
    const resolveValDisplay = formatValue(chain.resolveValue);

    this.emitStep(
      'push_stack',
      fnName,
      `Execute Promise.resolve(${resolveDisplay}).then() on line ${(line ?? 0) + 1}.`,
      `🔗 \`Promise.resolve(${resolveDisplay})\` creates an **already-resolved** Promise${chain.resolveValue !== undefined ? ' with value `' + resolveValDisplay + '`' : ''}. The \`.then()\` callback is immediately scheduled in the **Microtask Queue**. It will NOT execute now — it waits until the Call Stack is empty.`
    );

    this.promiseCount++;
    const callbackName = `Promise callback #${this.promiseCount}`;
    const qEntry: QueueEntry = {
      id: `micro-${this.entryId++}`,
      name: callbackName,
      type: 'microtask',
    };
    this.state.microtaskQueue.push(qEntry);

    const chainNote = chain.callbacks.length > 1
      ? ` This is a chain of ${chain.callbacks.length} \`.then()\` calls — only the first callback is queued now. Each subsequent \`.then()\` will be queued when the previous one completes.`
      : '';

    this.emitStep(
      'add_microtask',
      `${callbackName} → Microtask Queue`,
      'Promise resolved, callback queued as microtask.',
      `⚡ The \`.then()\` callback is added to the **Microtask Queue**. Microtasks have **higher priority** than macrotasks (setTimeout). The Event Loop will process ALL microtasks before any macrotask.${chainNote}`
    );

    this.popFrame();
    this.emitStep(
      'pop_stack',
      `Pop ${fnName}`,
      'Promise.then registered, continue synchronous execution.',
      '⬆️ The Promise setup is complete. The \`.then()\` callback is queued but NOT executed yet. Synchronous execution continues.'
    );

    this.pendingMicrotasks.push({
      name: callbackName,
      closure: chain.callbacks[0],
      arg: chain.resolveValue,
      chainedCallbacks: chain.callbacks.length > 1 ? chain.callbacks.slice(1) : undefined,
    });
  }

  private processTimerCompletions(): void {
    const sorted = [...this.pendingMacrotasks].sort((a, b) => (a.delay ?? 0) - (b.delay ?? 0));

    for (const timer of sorted) {
      const webApiEntry = this.state.webAPIs.find(w => w.name === timer.name);
      if (webApiEntry) {
        this.state.webAPIs = this.state.webAPIs.filter(w => w.id !== webApiEntry.id);
        const qEntry: QueueEntry = {
          id: `cb-${this.entryId++}`,
          name: timer.name,
          type: 'macrotask',
        };
        this.state.callbackQueue.push(qEntry);
        this.emitStep(
          'timer_complete',
          `Timer done → ${timer.name}`,
          `${timer.name} finished counting. Callback moved to Callback Queue.`,
          `⏰ The browser\'s timer for **${timer.name}** has expired. The callback is moved from Web APIs to the **Callback Queue** (also called the Macrotask Queue). It still can\'t execute yet — it must wait for the Event Loop to pick it up.`
        );
      }
    }
  }

  private processEventLoop(): void {
    const hasMicro = this.pendingMicrotasks.length > 0;
    const hasMacro = this.pendingMacrotasks.length > 0;
    if (!hasMicro && !hasMacro) return;

    this.state.eventLoopActive = true;
    this.state.eventLoopPhase = 'checking';
    this.emitStep(
      'event_loop_check',
      'Event Loop: Start',
      'The Call Stack is empty. The Event Loop begins checking the queues.',
      '🔄 The **Event Loop** is the heart of JavaScript\'s async model. It continuously checks: "Is the Call Stack empty?" If yes, it looks for pending callbacks. It follows a strict priority: **1)** Drain ALL microtasks first, **2)** Then process ONE macrotask, **3)** Check for new microtasks again.'
    );

    if (hasMicro) {
      this.state.eventLoopPhase = 'microtask';
      this.emitStep(
        'event_loop_check',
        'Check Microtask Queue',
        'Microtasks have higher priority — process them first.',
        '⚡ The Event Loop checks the **Microtask Queue** first. This queue holds Promise callbacks (\`.then\`, \`.catch\`, \`.finally\`), \`queueMicrotask\` calls, and \`MutationObserver\` callbacks. ALL microtasks must be drained before ANY macrotask runs.'
      );

      while (this.pendingMicrotasks.length > 0) {
        const task = this.pendingMicrotasks.shift()!;
        this.executeMicrotask(task);
      }
    }

    if (hasMacro) {
      this.state.eventLoopPhase = 'callback';
      this.emitStep(
        'event_loop_check',
        'Check Callback Queue',
        'Process macrotasks from the Callback Queue.',
        '📋 Now the Event Loop checks the **Callback Queue** (Macrotask Queue). This holds \`setTimeout\`, \`setInterval\`, I/O callbacks, and UI rendering tasks. The Event Loop picks them up one at a time.'
      );

      const sorted = [...this.pendingMacrotasks].sort((a, b) => (a.delay ?? 0) - (b.delay ?? 0));
      for (const task of sorted) {
        this.executeMacrotask(task);

        if (this.pendingMicrotasks.length > 0) {
          this.state.eventLoopPhase = 'microtask';
          this.emitStep(
            'event_loop_check',
            'Check Microtask Queue (again)',
            'New microtasks were added — process them before next macrotask.',
            '⚡ New microtasks appeared! The Event Loop **always** drains the Microtask Queue between macrotasks.'
          );
          while (this.pendingMicrotasks.length > 0) {
            const micro = this.pendingMicrotasks.shift()!;
            this.executeMicrotask(micro);
          }
          this.state.eventLoopPhase = 'callback';
        }
      }
    }
  }

  private executeMicrotask(task: PendingTask): void {
    const qEntry = this.state.microtaskQueue.find(q => q.name === task.name);
    if (qEntry) {
      this.state.microtaskQueue = this.state.microtaskQueue.filter(q => q.id !== qEntry.id);
    }

    this.pushFrame(task.name, 'promise');
    this.emitStep(
      'move_microtask',
      `Move ${task.name} → Call Stack`,
      `${task.name} is dequeued and pushed onto the Call Stack for execution.`,
      `⬇️ The Event Loop moves **${task.name}** from the Microtask Queue to the Call Stack. The callback function will now execute.`
    );

    const returnValue = this.execClosure(task.closure, task.arg !== undefined ? [task.arg] : []);

    this.popFrame();
    this.emitStep(
      'pop_stack',
      `Pop ${task.name}`,
      `${task.name} execution complete.`,
      `✅ **${task.name}** has finished executing${returnValue !== undefined ? ' and returned `' + formatValue(returnValue) + '`' : ''}. It is removed from the Call Stack.`
    );

    if (task.chainedCallbacks && task.chainedCallbacks.length > 0) {
      this.promiseCount++;
      const nextName = `Promise callback #${this.promiseCount}`;
      const nextQEntry: QueueEntry = {
        id: `micro-${this.entryId++}`,
        name: nextName,
        type: 'microtask',
      };
      this.state.microtaskQueue.push(nextQEntry);
      this.emitStep(
        'add_microtask',
        `${nextName} → Microtask Queue`,
        `Next .then() in the chain is queued with value ${formatValue(returnValue)}.`,
        `🔗 The previous \`.then()\` returned \`${formatValue(returnValue)}\`. This value is passed to the next \`.then()\` in the chain. The next callback is added to the Microtask Queue.`
      );

      this.pendingMicrotasks.push({
        name: nextName,
        closure: task.chainedCallbacks[0],
        arg: returnValue,
        chainedCallbacks: task.chainedCallbacks.length > 1 ? task.chainedCallbacks.slice(1) : undefined,
      });
    }
  }

  private executeMacrotask(task: PendingTask): void {
    const qEntry = this.state.callbackQueue.find(q => q.name === task.name);
    if (qEntry) {
      this.state.callbackQueue = this.state.callbackQueue.filter(q => q.id !== qEntry.id);
    }

    this.pushFrame(task.name, 'callback');
    this.emitStep(
      'move_callback',
      `Move ${task.name} → Call Stack`,
      `${task.name} is dequeued and pushed onto the Call Stack for execution.`,
      `⬇️ The Event Loop moves **${task.name}** from the Callback Queue to the Call Stack. This is the callback that was registered with \`setTimeout\`.`
    );

    this.execClosure(task.closure, []);

    this.popFrame();
    this.emitStep(
      'pop_stack',
      `Pop ${task.name}`,
      `${task.name} execution complete.`,
      `✅ **${task.name}** (setTimeout callback) has finished executing and is removed from the Call Stack.`
    );
  }

  private execClosure(closure: Closure, args: unknown[]): unknown {
    const childEnv = new Environment(closure.env);
    for (let i = 0; i < closure.params.length; i++) {
      childEnv.define(closure.params[i], args[i]);
    }

    const prevEnv = this.globalEnv;
    this.globalEnv = childEnv;

    let returnValue: unknown;
    if (closure.body.type === 'BlockStatement') {
      for (const stmt of closure.body.body) {
        if (stmt.type === 'ReturnStatement') {
          returnValue = stmt.argument ? this.evalExpr(stmt.argument) : undefined;
          break;
        }
        this.execStatement(stmt);
      }
    } else {
      returnValue = this.evalExpr(closure.body);
    }

    this.globalEnv = prevEnv;
    return returnValue;
  }

  private execIfStatement(node: ESTree.IfStatement): void {
    const line = getLine(node);
    if (line !== null) this.state.currentLine = line;
    const test = this.evalExpr(node.test);
    if (test) {
      this.execStatement(node.consequent);
    } else if (node.alternate) {
      this.execStatement(node.alternate);
    }
  }

  // ── Expression Evaluation ──────────────────────────────────────────

  private evalExpr(node: ESTree.Expression | ESTree.SpreadElement): unknown {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier':
        return this.globalEnv.get(node.name);

      case 'BinaryExpression':
        return this.evalBinary(node);

      case 'UnaryExpression':
        return this.evalUnary(node);

      case 'LogicalExpression':
        return this.evalLogical(node);

      case 'ConditionalExpression': {
        const test = this.evalExpr(node.test);
        return test ? this.evalExpr(node.consequent) : this.evalExpr(node.alternate);
      }

      case 'AssignmentExpression': {
        const val = this.evalExpr(node.right);
        if (node.left.type === 'Identifier') {
          this.globalEnv.define(node.left.name, val);
        }
        return val;
      }

      case 'MemberExpression':
        return this.evalMemberExpr(node);

      case 'CallExpression':
        return this.evalCallExpr(node);

      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return this.makeClosure(node);

      case 'ObjectExpression':
        return this.evalObjectExpr(node);

      case 'ArrayExpression': {
        return node.elements.map(el => {
          if (!el) return undefined;
          return this.evalExpr(el as ESTree.Expression);
        });
      }

      case 'TemplateLiteral':
        return this.evalTemplateLiteral(node);

      case 'SequenceExpression':
        return node.expressions.reduce<unknown>(
          (_acc, expr) => this.evalExpr(expr), undefined
        );

      default:
        return undefined;
    }
  }

  private evalBinary(node: ESTree.BinaryExpression): unknown {
    const left = this.evalExpr(node.left) as number | string;
    const right = this.evalExpr(node.right) as number | string;
    switch (node.operator) {
      case '+': return typeof left === 'string' || typeof right === 'string' ? String(left) + String(right) : (left as number) + (right as number);
      case '-': return (left as number) - (right as number);
      case '*': return (left as number) * (right as number);
      case '/': return (left as number) / (right as number);
      case '%': return (left as number) % (right as number);
      case '**': return (left as number) ** (right as number);
      case '===': return left === right;
      case '!==': return left !== right;
      case '==': return left == right;
      case '!=': return left != right;
      case '<': return (left as number) < (right as number);
      case '>': return (left as number) > (right as number);
      case '<=': return (left as number) <= (right as number);
      case '>=': return (left as number) >= (right as number);
      default: return undefined;
    }
  }

  private evalUnary(node: ESTree.UnaryExpression): unknown {
    const arg = this.evalExpr(node.argument as ESTree.Expression);
    switch (node.operator) {
      case '-': return -(arg as number);
      case '+': return +(arg as number);
      case '!': return !arg;
      case 'typeof': return typeof arg;
      default: return undefined;
    }
  }

  private evalLogical(node: ESTree.LogicalExpression): unknown {
    const left = this.evalExpr(node.left);
    switch (node.operator) {
      case '&&': return left ? this.evalExpr(node.right) : left;
      case '||': return left ? left : this.evalExpr(node.right);
      case '??': return left !== null && left !== undefined ? left : this.evalExpr(node.right);
      default: return undefined;
    }
  }

  private evalMemberExpr(node: ESTree.MemberExpression): unknown {
    const obj = this.evalExpr(node.object as ESTree.Expression);
    if (obj === null || obj === undefined) return undefined;

    if (node.computed) {
      const prop = this.evalExpr(node.property as ESTree.Expression);
      return (obj as Record<string, unknown>)[String(prop)];
    }
    if (node.property.type === 'Identifier') {
      if (typeof obj === 'string') {
        if (node.property.name === 'length') return obj.length;
      }
      if (Array.isArray(obj)) {
        if (node.property.name === 'length') return obj.length;
      }
      return (obj as Record<string, unknown>)[node.property.name];
    }
    return undefined;
  }

  private evalCallExpr(node: ESTree.CallExpression): unknown {
    if (this.isConsoleLog(node)) {
      const args = node.arguments.map(arg => this.evalExpr(arg as ESTree.Expression));
      const output = args.map(a => formatDisplayValue(a)).join(' ');

      this.pushFrame(`console.log(${args.map(a => formatValue(a)).join(', ')})`, 'function');
      this.state.consoleLogs.push(output);
      this.emitStep(
        'log',
        `Output: "${output}"`,
        `"${output}" printed to the console.`,
        `📝 \`console.log\` outputs: \`${output}\``
      );
      this.popFrame();
      return undefined;
    }

    if (this.isPromiseResolve(node)) {
      const val = node.arguments.length > 0 ? this.evalExpr(node.arguments[0] as ESTree.Expression) : undefined;
      return { __promise: true, value: val } as PromiseVal;
    }

    if (node.callee.type === 'MemberExpression') {
      const obj = this.evalExpr(node.callee.object as ESTree.Expression);
      if (isPromiseVal(obj) && node.callee.property.type === 'Identifier' && node.callee.property.name === 'then') {
        const callback = this.evalExpr(node.arguments[0] as ESTree.Expression) as Closure;
        this.promiseCount++;
        const name = `Promise callback #${this.promiseCount}`;
        const qEntry: QueueEntry = { id: `micro-${this.entryId++}`, name, type: 'microtask' };
        this.state.microtaskQueue.push(qEntry);
        this.pendingMicrotasks.push({ name, closure: callback, arg: obj.value });
        return { __promise: true, value: undefined } as PromiseVal;
      }
    }

    const callee = this.evalExpr(node.callee as ESTree.Expression);
    if (isClosure(callee)) {
      const args = node.arguments.map(arg => this.evalExpr(arg as ESTree.Expression));
      return this.callClosure(callee, args);
    }

    return undefined;
  }

  private callClosure(closure: Closure, args: unknown[]): unknown {
    const childEnv = new Environment(closure.env);
    for (let i = 0; i < closure.params.length; i++) {
      childEnv.define(closure.params[i], args[i]);
    }
    const prevEnv = this.globalEnv;
    this.globalEnv = childEnv;

    let returnValue: unknown;
    if (closure.body.type === 'BlockStatement') {
      for (const stmt of closure.body.body) {
        if (stmt.type === 'ReturnStatement') {
          returnValue = stmt.argument ? this.evalExpr(stmt.argument) : undefined;
          break;
        }
        this.execStatement(stmt);
      }
    } else {
      returnValue = this.evalExpr(closure.body);
    }

    this.globalEnv = prevEnv;
    return returnValue;
  }

  private evalObjectExpr(node: ESTree.ObjectExpression): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (prop.type === 'Property') {
        const key = prop.key.type === 'Identifier' ? prop.key.name : String(this.evalExpr(prop.key as ESTree.Expression));
        obj[key] = this.evalExpr(prop.value as ESTree.Expression);
      }
    }
    return obj;
  }

  private evalTemplateLiteral(node: ESTree.TemplateLiteral): string {
    let result = '';
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.cooked ?? '';
      if (i < node.expressions.length) {
        result += String(this.evalExpr(node.expressions[i]));
      }
    }
    return result;
  }

  private makeClosure(node: ESTree.ArrowFunctionExpression | ESTree.FunctionExpression): Closure {
    const params = node.params.map(p => {
      if (p.type === 'Identifier') return p.name;
      return '_';
    });
    return {
      __closure: true,
      params,
      body: node.body as ESTree.BlockStatement | ESTree.Expression,
      env: this.globalEnv,
    };
  }

  // ── Pattern Detection ──────────────────────────────────────────────

  private isConsoleLog(node: ESTree.CallExpression): boolean {
    return (
      node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'console' &&
      node.callee.property.type === 'Identifier' &&
      node.callee.property.name === 'log'
    );
  }

  private isSetTimeout(node: ESTree.CallExpression): boolean {
    return node.callee.type === 'Identifier' && node.callee.name === 'setTimeout';
  }

  private isPromiseResolve(node: ESTree.CallExpression): boolean {
    return (
      node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'Promise' &&
      node.callee.property.type === 'Identifier' &&
      node.callee.property.name === 'resolve'
    );
  }

  private detectPromiseChain(
    node: ESTree.CallExpression
  ): { resolveValue: unknown; callbacks: Closure[]; argNode?: ESTree.Expression } | null {
    if (node.callee.type !== 'MemberExpression') return null;
    const prop = node.callee.property;
    if (prop.type !== 'Identifier' || prop.name !== 'then') return null;

    const callbackNode = node.arguments[0] as ESTree.Expression;
    const callback = this.evalExpr(callbackNode) as Closure;
    const obj = node.callee.object;

    if (obj.type === 'CallExpression') {
      if (this.isPromiseResolve(obj)) {
        const argNode = obj.arguments[0] as ESTree.Expression | undefined;
        const resolveValue = argNode ? this.evalExpr(argNode) : undefined;
        return { resolveValue, callbacks: [callback], argNode };
      }

      const inner = this.detectPromiseChain(obj);
      if (inner) {
        return { ...inner, callbacks: [...inner.callbacks, callback] };
      }
    }

    return null;
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private nodeToString(node: ESTree.Expression | ESTree.SpreadElement): string {
    if (node.type === 'Literal') {
      if (typeof node.value === 'string') return `"${node.value}"`;
      return String(node.value);
    }
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'BinaryExpression') {
      return `${this.nodeToString(node.left)} ${node.operator} ${this.nodeToString(node.right)}`;
    }
    if (node.type === 'MemberExpression' && node.property.type === 'Identifier') {
      return `${this.nodeToString(node.object as ESTree.Expression)}.${node.property.name}`;
    }
    if (node.type === 'CallExpression') {
      const callee = this.nodeToString(node.callee as ESTree.Expression);
      const args = node.arguments.map(a => this.nodeToString(a as ESTree.Expression)).join(', ');
      return `${callee}(${args})`;
    }
    if (node.type === 'ObjectExpression') return '{...}';
    if (node.type === 'ArrayExpression') return '[...]';
    return '...';
  }

  private pushFrame(name: string, type: StackFrame['type']): void {
    this.state.callStack.push({ id: `frame-${this.frameId++}`, name, type });
  }

  private popFrame(): void {
    this.state.callStack.pop();
  }

  private cloneState(): SimulationState {
    return {
      callStack: this.state.callStack.map(f => ({ ...f })),
      heap: this.state.heap.map(h => ({ ...h })),
      webAPIs: this.state.webAPIs.map(w => ({ ...w })),
      microtaskQueue: this.state.microtaskQueue.map(q => ({ ...q })),
      callbackQueue: this.state.callbackQueue.map(q => ({ ...q })),
      consoleLogs: [...this.state.consoleLogs],
      eventLoopActive: this.state.eventLoopActive,
      eventLoopPhase: this.state.eventLoopPhase,
      currentLine: this.state.currentLine,
    };
  }

  private emitStep(action: StepAction, label: string, description: string, explanation: string): void {
    this.steps.push({
      id: this.stepId++,
      action,
      label,
      description,
      explanation,
      state: this.cloneState(),
    });
  }
}
