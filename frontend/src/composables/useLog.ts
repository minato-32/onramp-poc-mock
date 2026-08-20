import { reactive } from 'vue';

// In-UI activity log — shows every API call, step transition, and result live.
export type LogLevel = 'call' | 'ok' | 'err' | 'step' | 'info';

export interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  msg: string;
  detail?: string;
  ms?: number;
}

const MAX = 300;
const entries = reactive<LogEntry[]>([]);
let seq = 0;

function stamp(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function log(level: LogLevel, msg: string, detail?: string, ms?: number): void {
  entries.unshift({ id: ++seq, time: stamp(), level, msg, detail, ms });
  if (entries.length > MAX) entries.length = MAX;
}

export function clearLog(): void {
  entries.length = 0;
}

export function useLog() {
  return { entries, log, clearLog };
}
