
import { CarConfig } from '../types';
import { generateGenericTorqueCurve } from './utils';

export const SPORT: CarConfig = {
    name: "Sport 2.0L Turbo",
    drivetrainMode: 'NORMAL',
    width: 1.9,
    length: 4.4,
    assists: {
      automaticClutchOnStall: true,
      automaticClutchRpmRatio: 0.7 // Sport cars stall easier if not protected
    },
    engine: {
      idleRPM: 900,
      redlineRPM: 7000,
      maxRPM: 7500,
      inertia: 0.15,
      frictionCoef: { c0: 12, c1: 0.008, c2: 0.0000015, kPump: 0.012 },
      torqueCurve: generateGenericTorqueCurve(350, 7000),
      idlePID: { 
          kP: 0.0025, 
          kI: 0.0001, 
          kD: 0.00005, 
          feedforward: 0.12, 
          // Gain Scheduling
          maxThrottleIdle: 0.45,
          maxThrottleAntiStall: 0.9,
          antiStallKpMultiplier: 2.0,
          antiStallRpmDropThreshold: 150
      }
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
      handbrakeRearMaxTorque: 6000,
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
      handbrakeTau: 0.03,
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
  };