
import { CarConfig, PhysicsState, StoppingState, EnvironmentConfig } from '../../types';
import { TestLogEntry } from './types';
import { updatePhysics } from '../physicsEngine';

export class UnitContext {
    public logs: TestLogEntry[] = [];
    public testId: string;
    
    constructor(testId: string) { this.testId = testId; }
    
    log(message: string, data?: Record<string, any>) { 
        this.logs.push({ frame: 0, type: 'info', message, data }); 
    }
    
    assert(condition: boolean, message: string, data?: Record<string, any>) {
        if (condition) {
            this.logs.push({ frame: 0, type: 'pass', message: `PASS: ${message}`, data });
        } else { 
            this.logs.push({ frame: 0, type: 'fail', message: `FAIL: ${message}`, data }); 
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
    this.state = {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      localVelocity: { x: 0, y: 0 },
      heading: 0,
      angularVelocity: 0,
      steerAngle: 0,
      steeringWheelAngle: 0, 
      rpm: 0,
      lastRpm: 0, 
      gear: 0,
      clutchPosition: 1.0, // Disengaged
      throttleInput: 0,
      brakeInput: 0,
      idleIntegral: 0, 
      engineOn: false,
      stalled: false,
      speedKmh: 0,
      stoppingState: StoppingState.MOVING,
      stopTimer: 0,
      lastAx: 0,
      lastAy: 0,
      isClutchLocked: false,
      currentEffectiveMass: 0
    };
  }

  log(message: string, data?: Record<string, any>) {
    this.logs.push({ frame: this.frame, type: 'info', message, data });
  }

  action(message: string) {
      this.logs.push({ frame: this.frame, type: 'action', message });
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

  assert(condition: boolean, message: string) {
    if (condition) {
      this.logs.push({ frame: this.frame, type: 'pass', message: `PASS: ${message}`, data: this.snapshot });
    } else {
      this.logs.push({ frame: this.frame, type: 'fail', message: `FAIL: ${message}`, data: this.snapshot });
      throw new Error(message);
    }
  }
}
