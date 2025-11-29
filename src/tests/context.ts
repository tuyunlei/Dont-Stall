
import { CarConfig } from '../config/types';
import { PhysicsState } from '../physics/types';
import { EnvironmentConfig } from '../game/types';
import { TestLogEntry } from './types';
import { updatePhysics } from '../physics/physicsEngine';
import { createInitialState } from '../physics/factory';

export class UnitContext {
    public logs: TestLogEntry[] = [];
    public testId: string;
    
    constructor(testId: string) { this.testId = testId; }
    
    log(message: string, data?: Record<string, any>, l10n?: { key: string; params?: any }) { 
        this.logs.push({ frame: 0, type: 'info', message, data, l10n }); 
    }
    
    assert(condition: boolean, message: string, data?: Record<string, any>, l10n?: { key: string; params?: any }) {
        if (condition) {
            this.logs.push({ frame: 0, type: 'pass', message: `PASS: ${message}`, data, l10n });
        } else { 
            this.logs.push({ frame: 0, type: 'fail', message: `FAIL: ${message}`, data, l10n }); 
            throw new Error(message); 
        }
    }
}

export class ScenarioContext {
  public logs: TestLogEntry[] = [];
  public state: PhysicsState;
  public config: CarConfig;
  public environment: EnvironmentConfig;
  public frame: number = 0;
  public testId: string;

  constructor(config: CarConfig, testId: string) {
    this.config = JSON.parse(JSON.stringify(config)); // Deep copy
    this.testId = testId;
    this.environment = { gravity: 9.81, slope: 0 };
    // Use the factory to create a consistent initial state
    this.state = createInitialState({ x: 0, y: 0 }, 0);
    // Overrides for specific test needs
    this.state.clutchPosition = 1.0; 
  }

  log(message: string, data?: Record<string, any>, l10n?: { key: string; params?: any }) {
    this.logs.push({ frame: this.frame, type: 'info', message, data, l10n });
  }

  action(message: string, l10n?: { key: string; params?: any }) {
      this.logs.push({ frame: this.frame, type: 'action', message, l10n });
  }

  // Helper to extract key state for logs
  get snapshot() {
      return {
          rpm: Math.round(this.state.rpm),
          speed: this.state.speedKmh.toFixed(1),
          vx: this.state.localVelocity.x.toFixed(2),
          gear: this.state.gear,
          clutch: this.state.isClutchLocked ? 'LOCKED' : 'SLIP',
          brake: this.state.brakeInput.toFixed(2)
      };
  }

  simulate(frames: number, inputs: any) {
    for (let i = 0; i < frames; i++) {
      this.state = updatePhysics(this.state, this.config, inputs, this.environment, 0.016);
      this.frame++;
    }
  }

  assert(condition: boolean, message: string, l10n?: { key: string; params?: any }) {
    if (condition) {
      this.logs.push({ frame: this.frame, type: 'pass', message: `PASS: ${message}`, data: this.snapshot, l10n });
    } else {
      this.logs.push({ frame: this.frame, type: 'fail', message: `FAIL: ${message}`, data: this.snapshot, l10n });
      throw new Error(message);
    }
  }
}
