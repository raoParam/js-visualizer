import { Header } from './components/layout/Header';
import { CodeEditor } from './components/editor/CodeEditor';
import { CallStack } from './components/visualization/CallStack';
import { Heap } from './components/visualization/Heap';
import { WebAPIs } from './components/visualization/WebAPIs';
import { MicrotaskQueue } from './components/visualization/MicrotaskQueue';
import { CallbackQueue } from './components/visualization/CallbackQueue';
import { EventLoop } from './components/visualization/EventLoop';
import { ConsoleOutput } from './components/visualization/ConsoleOutput';
import { ControlPanel } from './components/controls/ControlPanel';
import { StepInfo } from './components/visualization/StepInfo';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-dark-900 text-metal-200 overflow-hidden">
      <Header />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 p-3">
        <div className="lg:w-[38%] min-h-[350px] lg:min-h-0 lg:order-1 order-2 relative z-20">
          <CodeEditor />
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto relative z-10">
          <StepInfo />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CallStack />
            <Heap />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <WebAPIs />
            <ConsoleOutput />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MicrotaskQueue />
            <CallbackQueue />
            <EventLoop />
          </div>
        </div>
      </div>

      <ControlPanel />
    </div>
  );
}
