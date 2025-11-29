
import { CarConfig } from './types';

// Helper
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
      inertia: 0.3,
      frictionCoef: { c0: 8, c1: 0.005, c2: 0.000001, kPump: 0.008 },
      torqueCurve: [
        { rpm: 0, torque: 30 },
        { rpm: 500, torque: 110 },
        { rpm: 1000, torque: 140 },
        { rpm: 3000, torque: 160 },
        { rpm: 5500, torque: 152 },
        { rpm: 6500, torque: 128 },
        { rpm: 7500, torque: 0 }
      ],
      idlePID: { kP: 0.002, kI: 0.0001, kD: 0.00005, feedforward: 0.16 }
    },
    transmission: {
      gearRatios: [0, 3.5, 2.0, 1.4, 1.0, 0.8],
      finalDriveRatio: 4.0,
      clutchMaxTorque: 180,
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
      vStopThreshold: 0.1,
      minStopTime: 0.2
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
      frictionCoef: { c0: 12, c1: 0.008, c2: 0.0000015, kPump: 0.012 },
      torqueCurve: generateGenericTorqueCurve(350, 7000),
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
