import type { CodeExample } from '../types';

export const examples: CodeExample[] = [
  {
    id: 'basic-event-loop',
    title: '1. Basic Event Loop',
    description: 'Classic: setTimeout vs Promise vs sync code',
    code: `console.log("Start");

setTimeout(() => {
  console.log("Timeout");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise");
});

console.log("End");`,
  },
  {
    id: 'multiple-timers',
    title: '2. Multiple Timers',
    description: 'Multiple setTimeout calls with different delays',
    code: `console.log("First");

setTimeout(() => {
  console.log("Timer 1 (1000ms)");
}, 1000);

setTimeout(() => {
  console.log("Timer 2 (500ms)");
}, 500);

setTimeout(() => {
  console.log("Timer 3 (0ms)");
}, 0);

console.log("Last");`,
  },
  {
    id: 'promise-vs-timeout',
    title: '3. Promise vs Timeout',
    description: 'Microtask priority over macrotask',
    code: `console.log("Script start");

setTimeout(() => {
  console.log("setTimeout 1");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise 1");
});

Promise.resolve().then(() => {
  console.log("Promise 2");
});

setTimeout(() => {
  console.log("setTimeout 2");
}, 0);

console.log("Script end");`,
  },
  {
    id: 'promise-chaining',
    title: '4. Promise Chaining',
    description: 'Multiple .then() calls in sequence',
    code: `console.log("Start");

Promise.resolve(1).then(x => {
  console.log("Then 1: " + x);
  return x + 1;
}).then(x => {
  console.log("Then 2: " + x);
  return x + 1;
}).then(x => {
  console.log("Then 3: " + x);
});

console.log("End");`,
  },
  {
    id: 'nested-settimeout',
    title: '5. Nested Timers',
    description: 'setTimeout inside another setTimeout',
    code: `console.log("Outer start");

setTimeout(() => {
  console.log("Outer timeout");
}, 0);

setTimeout(() => {
  console.log("Inner timeout");
}, 100);

console.log("Outer end");`,
  },
  {
    id: 'variables',
    title: '6. Variable Allocation',
    description: 'Heap memory allocation demo',
    code: `const a = 5;
const b = 10;
const result = a + b;

console.log("a = " + a);
console.log("b = " + b);
console.log("result = " + result);

const name = "JSFlow";
console.log("App: " + name);`,
  },
  {
    id: 'mixed-async',
    title: '7. Mixed Operations',
    description: 'Complex mix of sync, microtask, and macrotask',
    code: `const x = 10;
console.log("Value: " + x);

setTimeout(() => {
  console.log("Macro 1");
}, 0);

Promise.resolve().then(() => {
  console.log("Micro 1");
});

console.log("Sync done");`,
  },
];
