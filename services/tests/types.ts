
import { PhysicsState } from '../../types';

export type TestCategory = 'UNIT' | 'SCENARIO';
export type LogType = 'info' | 'action' | 'check' | 'pass' | 'fail';

export interface TestLogEntry {
  frame: number;
  type: LogType;
  message: string;
  data?: Record<string, any>;
  l10n?: {
      key: string;
      params?: Record<string, any>;
  };
}

export interface TestDefinition {
  id: string;
  category: TestCategory;
  name: string;
  description: string;
  steps: string[]; // List of steps for UI display
  run: (ctx: any) => void;
}

export interface TestResult {
  id: string;
  category: TestCategory;
  name: string;
  description: string;
  steps: string[];
  passed: boolean;
  logs: TestLogEntry[];
  error?: string;
  errorL10n?: { key: string; params?: Record<string, any> };
  duration: number;
  finalStateSnapshot?: Partial<PhysicsState>; // For debugging
}
