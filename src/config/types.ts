
import { Vector2 } from '../physics/types';

export interface TorqueCurvePoint {
  rpm: number;
  torque: number;
}

export interface EngineConfig {
  idleRPM: number;
  redlineRPM: number;
  maxRPM: number;
  inertia: number;
  frictionCoef: { c0: number; c1: number; c2: number; kPump: number }; 
  torqueCurve: TorqueCurvePoint[]; 
  idlePID: { kP: number; kI: number; kD: number; feedforward: number; };
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
  width: number;
  length: number;
  engine: EngineConfig;
  transmission: TransmissionConfig;
  brakes: BrakesConfig;
  chassis: ChassisConfig;
  controls: ControlsConfig;
  feel: FeelConfig;
}
