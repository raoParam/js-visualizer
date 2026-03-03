# JSFlow — JavaScript Execution Visualizer

An interactive, educational web application that visually simulates how JavaScript executes code. Understand the **Call Stack**, **Heap**, **Web APIs**, **Microtask Queue**, **Callback Queue**, and **Event Loop** — all in a beautiful dark-themed UI.

![JSFlow](https://img.shields.io/badge/React-19-blue?style=flat-square) ![Tailwind](https://img.shields.io/badge/Tailwind-4-blue?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square)

## Features

- **Monaco Code Editor** — Full-featured code editor with syntax highlighting and line tracking
- **Step-by-Step Execution** — Walk through each stage of JavaScript execution
- **Animated Visualization** — Smooth Framer Motion animations for stack push/pop and queue operations
- **Event Loop Simulation** — See microtask vs macrotask priority in action
- **Predefined Examples** — Classic interview questions like `setTimeout` vs `Promise` ordering
- **Speed Control** — Adjust simulation playback speed
- **Dark Theme** — Modern dark + metallic white UI with color-coded elements

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI Framework |
| Vite 7 | Build tool |
| Tailwind CSS 4 | Styling |
| Framer Motion | Animations |
| Monaco Editor | Code editor |
| Zustand | State management |
| Lucide React | Icons |

## Setup

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/raoParam/js-visualizer.git
cd js-visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Architecture

```
src/
├── types/                    # TypeScript type definitions
│   └── index.ts
├── store/                    # Zustand state management
│   └── useSimulationStore.ts
├── simulator/                # Simulation engine
│   ├── parser.ts             # Code pattern parser
│   └── stepGenerator.ts      # Execution step generator
├── data/                     # Predefined examples
│   └── examples.ts
├── components/
│   ├── shared/               # Reusable components
│   │   └── GlassCard.tsx
│   ├── layout/               # Layout components
│   │   └── Header.tsx
│   ├── editor/               # Code editor
│   │   └── CodeEditor.tsx
│   ├── visualization/        # Visualization panels
│   │   ├── CallStack.tsx
│   │   ├── Heap.tsx
│   │   ├── WebAPIs.tsx
│   │   ├── MicrotaskQueue.tsx
│   │   ├── CallbackQueue.tsx
│   │   ├── EventLoop.tsx
│   │   ├── ConsoleOutput.tsx
│   │   └── StepInfo.tsx
│   └── controls/             # Control panel
│       └── ControlPanel.tsx
├── App.tsx                   # Main application
├── main.tsx                  # Entry point
└── index.css                 # Global styles + Tailwind config
```

## How It Works

1. **Parser** — Analyzes JavaScript code and identifies patterns (console.log, setTimeout, Promise.then, variable declarations)
2. **Step Generator** — Converts parsed statements into a sequence of simulation steps, each with a full state snapshot
3. **Store** — Manages the current step index and derived visualization state
4. **Visualization** — Components read from the store and animate state transitions

### Simulation Engine

The engine does **not** execute real JavaScript. Instead, it:

- Pattern-matches known constructs
- Generates execution steps in the correct order
- Respects microtask > macrotask priority
- Produces state snapshots for each step

## Color System

| Element | Color | Hex |
|---|---|---|
| Call Stack (functions) | Blue | `#58a6ff` |
| Microtask Queue | Purple | `#bc8cff` |
| Callback Queue | Orange | `#d29922` |
| Console Output | Green | `#3fb950` |
| Event Loop | Cyan | `#56d4dd` |
| Errors | Red | `#f85149` |

## License

ISC
