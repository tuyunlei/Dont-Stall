
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
    handbrake: boolean;

    // Incremental Controls (For Virtual Pedals)
    throttleInc: boolean;
    throttleDec: boolean;

    brakeInc: boolean;
    brakeDec: boolean;

    clutchInc: boolean;
    clutchDec: boolean;

    // Incremental Steering
    steerLeftInc: boolean;
    steerRightInc: boolean;

    // Triggers (One-shot events)
    toggleHandbrake?: boolean;
    
    // Virtual Pedal Shortcuts (Double-Tap Triggers)
    setVirtualThrottleFull?: boolean;
    setVirtualThrottleZero?: boolean;
    setVirtualBrakeFull?: boolean;
    setVirtualBrakeZero?: boolean;
    setVirtualClutchFull?: boolean;
    setVirtualClutchZero?: boolean;
    setVirtualSteeringLeftFull?: boolean;
    setVirtualSteeringRightFull?: boolean;

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
  handbrakePulled: boolean; // Logical state (Up/Down) for ratchet mode
  steeringWheelAngle: number; 
  steerAngle: number;      

  // Virtual Pedal State (Persistent)
  // Accumulators for key-based coarse/fine adjustment
  virtualThrottle: number;
  virtualBrake: number;
  virtualClutch: number;
  virtualSteering: number; // -1.0 to 1.0

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
