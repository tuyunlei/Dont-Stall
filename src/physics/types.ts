
export interface Vector2 {
  x: number;
  y: number;
}

export enum StoppingState {
  MOVING = 'MOVING',
  STOPPING = 'STOPPING', 
  STOPPED = 'STOPPED'    
}

export interface InputState {
    // Digital Channels (Keyboard)
    throttle: boolean;
    brake: boolean;
    left: boolean;
    right: boolean;
    clutch: boolean;
    handbrake?: boolean;

    // Analog Channels (0.0 - 1.0, Optional)
    // If provided, these take precedence over digital channels
    throttleAnalog?: number;
    brakeAnalog?: number;
    clutchAnalog?: number;
    handbrakeAnalog?: number;
    steeringAnalog?: number; // -1.0 (Left) to 1.0 (Right)
}

export interface PhysicsState {
  // Pose (World)
  position: Vector2;
  velocity: Vector2;       
  heading: number;         
  angularVelocity: number; 

  // Pose (Local)
  localVelocity: Vector2;  
  
  // Dynamics History
  lastAx: number;
  lastAy: number;
  stoppingState: StoppingState;
  stopTimer: number;

  // Input State (Processed)
  throttleInput: number;   
  brakeInput: number;      
  clutchPosition: number;
  handbrakeInput: number;
  steeringWheelAngle: number; 
  steerAngle: number;      

  // Powertrain State
  rpm: number;
  gear: number;            
  engineOn: boolean;
  stalled: boolean;
  starterActive: boolean; // New: cranking state
  isClutchLocked: boolean; 
  
  // Smoothing vars
  currentEffectiveMass: number; 

  // Internal State
  idleIntegral: number;    
  lastRpm: number;

  // Derived (Convenience)
  speedKmh: number;
}