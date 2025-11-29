

import { CarConfig, LevelData } from './types';

export const PX_PER_METER = 20.0;

// Helper to generate a generic torque curve
const generateGenericTorqueCurve = (peakTorque: number, redline: number) => [
  { rpm: 0, torque: 0 },
  { rpm: 500, torque: peakTorque * 0.6 },
  { rpm: 1000, torque: peakTorque * 0.8 },
  { rpm: 3000, torque: peakTorque },
  { rpm: redline - 1000, torque: peakTorque * 0.95 },
  { rpm: redline, torque: peakTorque * 0.8 },
  { rpm: redline + 1000, torque: 0 }
];

export const CAR_PRESETS: Record<string, CarConfig> = {
  CIVILIAN: {
    name: "Civilian 1.6L Sedan",
    width: 1.8,
    length: 4.5,
    engine: {
      idleRPM: 800,
      redlineRPM: 6500,
      maxRPM: 7000,
      inertia: 0.3, // Increased from 0.2 to improve stall resistance
      // v3.0 Friction Model: c0(static) + c1(viscous) + c2(aero) + kPump
      // Calibration Target @ 3000RPM:
      // T_combustion ~ 160Nm
      // T_mech target ~ 30Nm -> c0=8, c1=0.005, c2=0.000001
      // T_pump target ~ 25Nm (at 0 throttle) -> kPump=0.008
      // Result: WOT Net ~ 130Nm, Coast Net ~ -55Nm
      frictionCoef: { c0: 8, c1: 0.005, c2: 0.000001, kPump: 0.008 },
      brakingCoeff: 1.0, // Legacy
      // Custom torque curve for Civilian to improve launch/anti-stall
      torqueCurve: [
        { rpm: 0, torque: 30 },    // Base anti-stall torque
        { rpm: 500, torque: 110 }, // Stronger low-end
        { rpm: 1000, torque: 140 },
        { rpm: 3000, torque: 160 }, // Peak
        { rpm: 5500, torque: 152 },
        { rpm: 6500, torque: 128 },
        { rpm: 7500, torque: 0 }
      ],
      // Recalibrated for v3.0 logic:
      // kD reduced 10x to prevent oscillation.
      // Feedforward adjusted to approx equilibrium at 800RPM (~19Nm Friction / ~120Nm MaxTorque = ~0.16)
      idlePID: { kP: 0.002, kI: 0.0001, kD: 0.00005, feedforward: 0.16 }
    },
    transmission: {
      gearRatios: [0, 3.5, 2.0, 1.4, 1.0, 0.8],
      finalDriveRatio: 4.0,
      clutchMaxTorque: 180, // Reduced from 300 to allow smoother slip and prevent stalling
      clutchHysteresis: 0.1,
      effectiveMassSmoothFactor: 0.15 
    },
    brakes: {
      maxBrakeTorque: 4000,
      brakeBias: 0.65,
    },
    chassis: {
      mass: 1300,
      wheelBase: 2.65,
      trackWidth: 1.6,
      wheelRadius: 0.3,
      cgHeight: 0.5,
      dragCoefficient: 0.35,
      rollingResistance: 0.015,
      cgToFront: 1.06, 
      cgToRear: 1.59,
      momentOfInertia: 2000,
      tireStiffnessFront: 60000,
      tireStiffnessRear: 60000,
      tireFriction: 1.0,
      steeringRatio: 15,
      maxSteeringWheelAngle: 540,
    },
    controls: {
      throttleTau: 0.05,
      brakeTau: 0.05,
      clutchTau: 0.1,
      steeringReturnTau: 0.2,
      steeringCurve: [
          { speed: 0, tau: 0.1 },
          { speed: 10, tau: 0.15 },
          { speed: 30, tau: 0.3 },
          { speed: 50, tau: 0.5 }
      ]
    },
    feel: {
      lowSpeedBlendStart: 0.5,
      lowSpeedBlendEnd: 5.0,
      vSlipMin: 0.5,
      vStopThreshold: 0.1, // m/s
      minStopTime: 0.2     // s
    }
  },
  SPORT: {
    name: "Sport 2.0L Turbo",
    width: 1.9,
    length: 4.4,
    engine: {
      idleRPM: 900,
      redlineRPM: 7000,
      maxRPM: 7500,
      inertia: 0.15,
      // Sport tuning: Higher friction due to aggressive components, but much higher power
      frictionCoef: { c0: 12, c1: 0.008, c2: 0.0000015, kPump: 0.012 },
      brakingCoeff: 1.2,
      torqueCurve: generateGenericTorqueCurve(350, 7000),
      // Recalibrated for v3.0 logic:
      // Feedforward lowered due to high engine power (31Nm Friction / 266Nm MaxTorque ~ 0.12)
      idlePID: { kP: 0.0025, kI: 0.0001, kD: 0.00005, feedforward: 0.12 }
    },
    transmission: {
      gearRatios: [0, 3.2, 2.1, 1.5, 1.1, 0.9],
      finalDriveRatio: 3.8,
      clutchMaxTorque: 500,
      clutchHysteresis: 0.1,
      effectiveMassSmoothFactor: 0.2
    },
    brakes: {
      maxBrakeTorque: 6000,
      brakeBias: 0.60,
    },
    chassis: {
      mass: 1400,
      wheelBase: 2.6,
      trackWidth: 1.65,
      wheelRadius: 0.32,
      cgHeight: 0.45,
      dragCoefficient: 0.32,
      rollingResistance: 0.015,
      cgToFront: 1.25,
      cgToRear: 1.35,
      momentOfInertia: 2200,
      tireStiffnessFront: 80000,
      tireStiffnessRear: 80000,
      tireFriction: 1.4,
      steeringRatio: 12,
      maxSteeringWheelAngle: 360,
    },
    controls: {
      throttleTau: 0.03,
      brakeTau: 0.02,
      clutchTau: 0.05,
      steeringReturnTau: 0.1,
      steeringCurve: [
        { speed: 0, tau: 0.05 },
        { speed: 15, tau: 0.1 },
        { speed: 40, tau: 0.2 }
    ]
    },
    feel: {
      lowSpeedBlendStart: 0.5,
      lowSpeedBlendEnd: 5.0,
      vSlipMin: 0.5,
      vStopThreshold: 0.1,
      minStopTime: 0.15
    }
  }
};

export const DEFAULT_CAR_CONFIG: CarConfig = CAR_PRESETS.CIVILIAN;

export const LEVELS: LevelData[] = [
  {
    id: 'lvl1',
    name: '课程一：直线起步与停车',
    description: '最基础的驾驶训练。练习离合器与油门的配合，平稳起步并停在目标区域。',
    startPos: { x: 5, y: 15 }, 
    startHeading: 0,
    instructions: '1. 按 [E] 启动引擎\n2. 按 [Q] 踩住离合\n3. 按 [W] 挂入1档\n4. 轻按 [↑] 给油，将转速维持在 1500-2000 转\n5. 慢慢松开 [Q] 离合找到半联动点\n6. 车身动起来后完全松开离合\n7. 到达绿色方框区域刹车停稳',
    objects: [
      { id: 'wall_top', type: 'wall', x: 0, y: 7.5, width: 40, height: 0.5, rotation: 0 },
      { id: 'wall_bottom', type: 'wall', x: 0, y: 22.5, width: 40, height: 0.5, rotation: 0 },
      { id: 'target', type: 'parking-spot', x: 24, y: 13.5, width: 5, height: 3, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0 }
  },
  {
    id: 'lvl2',
    name: '课程二：基础倒车入库',
    description: '学习使用倒档和后视镜原理（想象），将车辆停入指定车位。',
    startPos: { x: 10, y: 15 },
    startHeading: 0,
    instructions: '1. 向前开过车位，车尾超过库口\n2. 踩离合刹车停稳\n3. 按 [S] 挂入倒档 (R)\n4. 控制好离合器（半联动），缓慢倒车\n5. 配合转向倒入车位',
    objects: [
      { id: 'wall_top', type: 'wall', x: 10, y: 5, width: 30, height: 0.5, rotation: 0 },
      { id: 'spot_left', type: 'wall', x: 19, y: 10, width: 0.5, height: 5, rotation: 0 },
      { id: 'spot_right', type: 'wall', x: 22, y: 10, width: 0.5, height: 5, rotation: 0 },
      { id: 'spot_back', type: 'wall', x: 19, y: 10, width: 3.5, height: 0.5, rotation: 0 },
      { id: 'target', type: 'parking-spot', x: 20.5, y: 10, width: 2.5, height: 4.5, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0 }
  },
  {
    id: 'lvl3',
    name: '课程三：坡道起步 (Hill Start)',
    description: '进阶测试。在15%的坡度上完成起步，不溜车、不熄火。',
    startPos: { x: 2, y: 15 },
    startHeading: 0,
    instructions: '注意：本关卡处于上坡路段！\n1. 启动引擎，挂入1档\n2. 保持刹车防止溜车\n3. 慢慢抬离合直到车身颤抖（RPM下降）\n4. 稳住离合，快速松刹车并跟油门\n5. 目标是平稳爬坡',
    objects: [
        { id: 'wall_top', type: 'wall', x: 0, y: 10, width: 50, height: 0.5, rotation: 0 },
        { id: 'wall_bottom', type: 'wall', x: 0, y: 20, width: 50, height: 0.5, rotation: 0 },
        { id: 'target', type: 'parking-spot', x: 30, y: 13.5, width: 5, height: 3, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0.15 } // ~8.5 degrees
  }
];

export const KEYS = {
  THROTTLE: 'ArrowUp',
  BRAKE: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  CLUTCH: 'q',
  SHIFT_UP: 'w',
  SHIFT_DOWN: 's',
  START_ENGINE: 'e',
  RESET: 'r'
};