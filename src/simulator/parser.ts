import type { ParsedStatement } from '../types';

function findClosingBrace(lines: string[], startLine: number): number {
  let depth = 0;
  for (let i = startLine; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (depth === 0 && i > startLine) return i;
    }
  }
  return lines.length - 1;
}

function parseBody(lines: string[], startLine: number, endLine: number): ParsedStatement[] {
  const bodyLines = lines.slice(startLine, endLine + 1);
  return parse(bodyLines.join('\n'), startLine);
}

export function parse(code: string, lineOffset: number = 0): ParsedStatement[] {
  const lines = code.split('\n');
  const statements: ParsedStatement[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    const absoluteLine = i + lineOffset;

    if (!line || line === '}' || line === '});' || line === '})' || line === ');') {
      i++;
      continue;
    }

    const logMatch = line.match(/console\.log\((.+)\)/);
    if (logMatch) {
      statements.push({
        type: 'console_log',
        line: absoluteLine,
        endLine: absoluteLine,
        args: [logMatch[1].replace(/["'`]/g, '').replace(/;$/, '')],
        raw: line,
      });
      i++;
      continue;
    }

    const timeoutMatch = line.match(/setTimeout\(/);
    if (timeoutMatch) {
      const closingLine = findClosingBrace(lines, i);
      const fullBlock = lines.slice(i, closingLine + 1).join(' ');
      const delayMatch = fullBlock.match(/(\d+)\s*\)\s*;?\s*$/);
      const delay = delayMatch ? parseInt(delayMatch[1], 10) : 0;

      const bodyStart = i + 1;
      const bodyEnd = closingLine - 1;
      const body = bodyStart <= bodyEnd ? parseBody(lines, bodyStart, bodyEnd) : [];

      statements.push({
        type: 'set_timeout',
        line: absoluteLine,
        endLine: closingLine + lineOffset,
        delay,
        body,
        raw: line,
      });
      i = closingLine + 1;
      continue;
    }

    const promiseMatch = line.match(/Promise\.resolve\(\)\.then\(/);
    if (promiseMatch) {
      const closingLine = findClosingBrace(lines, i);
      const bodyStart = i + 1;
      const bodyEnd = closingLine - 1;
      const body = bodyStart <= bodyEnd ? parseBody(lines, bodyStart, bodyEnd) : [];

      statements.push({
        type: 'promise_then',
        line: absoluteLine,
        endLine: closingLine + lineOffset,
        body,
        raw: line,
      });
      i = closingLine + 1;
      continue;
    }

    const varMatch = line.match(/^(const|let|var)\s+(\w+)\s*=\s*(.+?)\s*;?\s*$/);
    if (varMatch) {
      statements.push({
        type: 'variable_declaration',
        line: absoluteLine,
        endLine: absoluteLine,
        name: varMatch[2],
        value: varMatch[3],
        raw: line,
      });
      i++;
      continue;
    }

    statements.push({
      type: 'expression',
      line: absoluteLine,
      endLine: absoluteLine,
      raw: line,
    });
    i++;
  }

  return statements;
}
