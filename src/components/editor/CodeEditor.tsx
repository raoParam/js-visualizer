import Editor, { type OnMount } from '@monaco-editor/react';
import { useRef, useEffect } from 'react';
import { Code2 } from 'lucide-react';
import { useSimulationStore } from '../../store/useSimulationStore';

type EditorInstance = Parameters<OnMount>[0];
type MonacoInstance = Parameters<OnMount>[1];

export function CodeEditor() {
  const { code, setCode, currentState, hasStarted } = useSimulationStore();
  const editorRef = useRef<EditorInstance | null>(null);
  const decorationsRef = useRef<ReturnType<EditorInstance['createDecorationsCollection']> | null>(null);

  const handleMount = (editorInstance: EditorInstance, monaco: MonacoInstance) => {
    editorRef.current = editorInstance;

    monaco.editor.defineTheme('jsflow-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editor.lineHighlightBackground': '#161b2200',
        'editor.selectionBackground': '#264f7844',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#8b949e',
        'editorCursor.foreground': '#58a6ff',
        'editor.selectionHighlightBackground': '#3fb95020',
      },
    });
    monaco.editor.setTheme('jsflow-dark');
    decorationsRef.current = editorInstance.createDecorationsCollection([]);
  };

  useEffect(() => {
    if (!editorRef.current || !decorationsRef.current) return;

    if (hasStarted && currentState.currentLine !== null) {
      decorationsRef.current.set([
        {
          range: {
            startLineNumber: currentState.currentLine + 1,
            startColumn: 1,
            endLineNumber: currentState.currentLine + 1,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'highlighted-line',
            glyphMarginClassName: 'highlighted-glyph',
          },
        },
      ]);
    } else {
      decorationsRef.current.set([]);
    }
  }, [currentState.currentLine, hasStarted]);

  return (
    <div className="h-full flex flex-col bg-dark-800 border border-white/[0.08] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-accent-blue/20">
        <Code2 size={14} className="text-metal-400" />
        <h3 className="text-metal-200 text-xs font-semibold uppercase tracking-wider">Code Editor</h3>
      </div>
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => setCode(value ?? '')}
          onMount={handleMount}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbersMinChars: 3,
            glyphMargin: true,
            folding: false,
            renderLineHighlight: 'none',
            padding: { top: 12, bottom: 12 },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-metal-500 text-sm">
              Loading editor...
            </div>
          }
        />
      </div>
      <style>{`
        .highlighted-line {
          background: rgba(88, 166, 255, 0.08) !important;
          border-left: 2px solid #58a6ff !important;
        }
        .highlighted-glyph {
          background: transparent;
          margin-left: 3px;
        }
      `}</style>
    </div>
  );
}