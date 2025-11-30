
import { Vector2 } from '../physics/types';

export type DrivetrainMode = 'NORMAL' | 'C1_TRAINER';
export type HandbrakeMode = 'LINEAR' | 'RATCHET';

export interface TorqueCurvePoint {
  rpm: number;
  torque: number;
}

export interface AssistConfig {
  // If true, the clutch will automatically disengage when RPM drops too low to prevent stalling.
  // Set to false for hardcore/simulation modes (like C1 training).
  automaticClutchOnStall: boolean;
  
  // The ratio of Idle RPM at which the auto-clutch triggers.
  // Default is 0.6 (e.g., if Idle is 800, triggers at 480).
  automaticClutchRpmRatio?: number;
}

export interface StarterConfig {
  torque: number;      // Starter motor torque (Nm)
  maxRPM: number;      // Max RPM the starter can spin the engine to (free load)
  ignitionRPM: number; // RPM required to ignite the engine
}

export interface EngineConfig {
  idleRPM: number;
  redlineRPM: number;
  maxRPM: number;
  inertia: number;
  starter?: StarterConfig; // Optional starter config
  frictionCoef: { c0: number; c1: number; c2: number; kPump: number }; 
  torqueCurve: TorqueCurvePoint[]; 
  idlePID: { 
      kP: number; 
      kI: number; 
      kD: number; 
      feedforward: number; 
      // Gain Scheduling for Anti-Stall
      maxThrottleIdle: number;       // Max throttle allowed during normal neutral idle
      maxThrottleAntiStall: number;  // Max throttle allowed when fighting a stall
      antiStallKpMultiplier: number; // Multiplier for kP when in anti-stall mode
      antiStallRpmDropThreshold: number; // RPM drop from target to trigger anti-stall
  };
}

export interface TransmissionConfig {
  gearRatios: number[];     
  finalDriveRatio: number;  
  clutchMaxTorque: number;  
  clutchHysteresis: number;
  effectiveMassSmoothFactor: number;
}

export interface BrakesConfig {
  maxBrakeTorque: number;   
  brakeBias: number;        
  handbrakeRearMaxTorque?: number;
}

export interface SteeringCurvePoint {
  speed: number;
  tau: number;
}

export interface ChassisConfig {
  mass: number;             
  wheelBase: number;        
  trackWidth: number;       
  wheelRadius: number;      
  cgHeight: number;         
  dragCoefficient: number;  
  rollingResistance: number;
  cgToFront: number;        
  cgToRear: number;         
  momentOfInertia: number;  
  tireStiffnessFront: number; 
  tireStiffnessRear: number;  
  tireFriction: number;       
  steeringRatio: number;      
  maxSteeringWheelAngle: number; 
}

export interface ControlsConfig {
  throttleTau: number; 
  brakeTau: number;
  clutchTau: number;
  handbrakeTau?: number;
  handbrakeMode: HandbrakeMode;
  handbrakeRatchetSpeed: number; // Units per second (0-1 range)
  steeringCurve: SteeringCurvePoint[];
  steeringReturnTau: number; 
}

export interface FeelConfig {
  lowSpeedBlendStart: number; 
  lowSpeedBlendEnd: number;   
  vSlipMin: number;           
  vStopThreshold: number;     
  minStopTime: number;        
}

export interface CarConfig {
  name: string;
  drivetrainMode?: DrivetrainMode; // Mode selector
  width: number;
  length: number;
  assists: AssistConfig;
  engine: EngineConfig;
  transmission: TransmissionConfig;
  brakes: BrakesConfig;
  chassis: ChassisConfig;
  controls: ControlsConfig;
  feel: FeelConfig;
}
