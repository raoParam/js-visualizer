JSFlow — JavaScript Execution Visualizer

1. Project Overview

JSFlow is a single-page React application that visually simulates how JavaScript executes code.

The app demonstrates:

• Call Stack behavior
• Heap memory allocation
• Web APIs
• Callback Queue (Macrotask Queue)
• Microtask Queue (Promises)
• Event Loop processing
• Async behavior (setTimeout, Promise, async/await simulation)

This is an educational tool designed to help developers understand the JavaScript execution model visually.

---

2. Goal

Build a clean, modern, dark-themed React application that:

• Simulates JavaScript execution
• Animates stack and queue movement
• Works step-by-step
• Does NOT execute real JavaScript
• Uses a predefined simulation engine

---

3. Target Users

• JavaScript learners
• Frontend interview candidates
• Developers confused about event loop behavior

---

4. Tech Stack

• React (Vite)
• Tailwind CSS (dark theme only)
• Framer Motion (for animations)
• useState or Zustand for global simulation state
• No backend
• No real JS execution engine

---

5. Application Layout (Single Page)

---

| JSFlow Title                                  |

| Code Editor        |  Execution Visualization |
|                    |                          |
|                    |  Call Stack              |
|                    |  Heap                    |
|                    |  Web APIs                |
|                    |  Microtask Queue         |
|                    |  Callback Queue          |
|                    |  Event Loop Indicator    |

| Controls: Run | Step | Reset | Speed Slider   |

Dark theme only.

---

6. Core Components

6.1 CodeEditor

• Textarea or Monaco editor
• Preloaded examples:
  - setTimeout example
  - Promise example
  - async/await example
• Run button
• Step button

---

6.2 CallStack Component

• Vertical stack UI
• Push/pop animations
• Highlight active frame

---

6.3 Heap Component

• Display variables
• Display objects
• Show references visually
• Animated allocation

---

6.4 WebAPI Component

• Show pending setTimeout timers
• Show simulated fetch tasks

---

6.5 MicrotaskQueue Component

• Show Promise ".then()" callbacks
• FIFO structure
• Higher priority than callback queue

---

6.6 CallbackQueue Component

• Show macrotasks (setTimeout)
• FIFO structure

---

6.7 EventLoop Component

• Rotating animated circle
• Visually moves tasks from queues to stack

---

6.8 ControlPanel Component

• Run
• Step
• Reset
• Speed slider
• Example selector dropdown

---

7. Simulation Engine Design

Important: Do NOT execute real JavaScript.

Instead:

• Parse predefined patterns
• Generate execution steps
• Store steps in an array
• Animate state changes step-by-step

---

Example Input

console.log("Start");

setTimeout(() => {
  console.log("Timeout");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise");
});

console.log("End");

---

Example Simulation Steps

1. Push global()
2. Log "Start"
3. Register setTimeout → Web API
4. Register Promise → Microtask Queue
5. Log "End"
6. Pop global()
7. Event loop moves Promise → Call Stack
8. Execute Promise callback
9. Event loop moves Timeout → Call Stack
10. Execute Timeout callback

Each step should be a structured JSON object like:

{
  action: "push_stack",
  value: "global()"
}

---

8. Folder Structure

src/
 ├── components/
 │    ├── CodeEditor.jsx
 │    ├── CallStack.jsx
 │    ├── Heap.jsx
 │    ├── WebAPI.jsx
 │    ├── CallbackQueue.jsx
 │    ├── MicrotaskQueue.jsx
 │    ├── EventLoop.jsx
 │    └── ControlPanel.jsx
 │
 ├── simulator/
 │    ├── parser.js
 │    ├── stepGenerator.js
 │
 ├── data/
 │    └── examples.js
 │
 ├── App.jsx
 └── main.jsx

---

9. UI Requirements

• Dark theme only
• Minimal modern UI
• Glass or subtle shadow cards
• Smooth animations
• Clean typography
• Fully responsive

---

10. MVP Requirements

Must include:

• Code input
• Run simulation
• Step execution
• Stack animation
• Microtask vs Callback priority behavior
• Event loop animation
• Reset functionality

---

11. Phase 2 (Optional Enhancements)

• Closure visualization
• Timeline execution mode
• Memory leak simulation
• Drag-and-drop frames
• Custom function visualization

---

OpenCode Prompt

Build a single-page React application called JSFlow that visually simulates JavaScript execution including Call Stack, Heap, Web APIs, Microtask Queue, Callback Queue, and Event Loop. Do not execute real JavaScript. Use a predefined simulation engine that generates step-by-step state updates. Use Tailwind CSS dark theme and smooth animations. Keep the UI clean, modern, and fully responsive. No backend required.