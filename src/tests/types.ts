import { PhysicsState, InputState, EnvironmentConfig } from '../physics/types';
import { CarConfig } from '../config/types';

export type TestCategory = 'UNIT' | 'SCENARIO';
export type LogType = 'info' | 'action' | 'check' | 'pass' | 'fail';

export interface LogData {
    [key: string]: string | number | boolean | null | undefined;
}

export interface LocalizationParams {
    key: string;
    params?: Record<string, string | number>;
}

export interface TestLogEntry {
  frame: number;
  type: LogType;
  message: string;
  data?: LogData;
  l10n?: LocalizationParams;
}

// Interface for both UnitContext and ScenarioContext to implement
export interface ITestContext {
    log(message: string, data?: LogData, l10n?: LocalizationParams): void;
    assert(condition: boolean, message: string, data?: LogData, l10n?: LocalizationParams): void;
    // Common properties or methods that tests might use can be added here as optional
    state?: PhysicsState;
    config?: CarConfig;
    environment?: EnvironmentConfig;
    simulate?(frames: number, inputs: Partial<InputState>): void;
    action?(message: string, l10n?: LocalizationParams): void;
}

export interface TestDefinition {
  id: string;
  category: TestCategory;
  name: string;
  description: string;
  steps: string[]; // List of steps for UI display
  run: (ctx: ITestContext) => void;
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
  errorL10n?: LocalizationParams;
  duration: number;
  finalStateSnapshot?: Partial<PhysicsState>; // For debugging
}