

export interface Vector2 {
  x: number;
  y: number;
}

// --- 分层配置体系 ---

export interface TorqueCurvePoint {
  rpm: number;
  torque: number; // Nm
}

export interface EngineConfig {
  idleRPM: number;       // 目标怠速
  redlineRPM: number;    // 红线
  maxRPM: number;        // 断油转速
  
  inertia: number;       // 飞轮与曲轴惯量 (kg*m^2)
  
  // 物理模型参数 v3.0 Update: 
  // T_mech = c0 + c1 * rpm + c2 * rpm^2
  // T_pump = k_pump * (1 - throttle) * rpm
  frictionCoef: { c0: number; c1: number; c2: number; kPump: number }; 
  brakingCoeff: number;   // Deprecated in v3.0 logic, kept for type compat if needed, but logic moved to frictionCoef

  torqueCurve: TorqueCurvePoint[]; 

  // 怠速控制器参数
  idlePID: {
    kP: number;
    kI: number;
    kD: number;
    feedforward: number; 
  };
}

export interface TransmissionConfig {
  gearRatios: number[];     
  finalDriveRatio: number;  
  clutchMaxTorque: number;  
  clutchHysteresis: number; // v3.0: 锁定判定的滞回系数 (e.g. 0.1)
  effectiveMassSmoothFactor: number; // v3.0: 换挡惯量平滑系数 (0.0 - 1.0)
}

export interface BrakesConfig {
  maxBrakeTorque: number;   
  brakeBias: number;        
}

export interface SteeringCurvePoint {
  speed: number; // m/s
  tau: number;   // s
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
  // 手感层参数
  lowSpeedBlendStart: number; 
  lowSpeedBlendEnd: number;   
  vSlipMin: number;           
  
  // 停车状态机参数
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

// --- 实时物理状态 ---

export enum StoppingState {
  MOVING = 'MOVING',
  STOPPING = 'STOPPING', 
  STOPPED = 'STOPPED'    
}

export interface PhysicsState {
  // Pose
  position: Vector2;
  velocity: Vector2;       
  localVelocity: Vector2;  
  heading: number;         
  angularVelocity: number; 
  
  // Dynamics History
  lastAx: number;
  lastAy: number;
  stoppingState: StoppingState;
  stopTimer: number;

  // Input State
  throttleInput: number;   
  brakeInput: number;      
  clutchPosition: number;  
  steeringWheelAngle: number; 
  steerAngle: number;      

  // Powertrain State
  rpm: number;
  gear: number;            
  engineOn: boolean;
  stalled: boolean;
  isClutchLocked: boolean; 
  
  // v3.0: 平滑后的有效纵向惯量，用于减轻换挡冲击
  currentEffectiveMass: number; 

  // Internal State
  idleIntegral: number;    
  lastRpm: number;

  // Derived
  speedKmh: number;
}

export interface MapObject {
  id: string;
  type: 'wall' | 'parking-spot' | 'cone';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  target?: boolean;
}

export interface EnvironmentConfig {
    gravity: number; // m/s^2
    slope: number;   // rad, positive = uphill
}

export interface LevelData {
  id: string;
  name: string;
  description: string;
  startPos: Vector2;
  startHeading: number;
  objects: MapObject[];
  instructions: string;
  environment?: EnvironmentConfig; // v3.0
}

export enum GameMode {
  LEVELS = 'LEVELS',
  SANDBOX = 'SANDBOX'
}
