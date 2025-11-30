
import { CarConfig } from '../types';

export const CIVILIAN: CarConfig = {
    name: "Civilian 1.6L Sedan",
    drivetrainMode: 'NORMAL',
    width: 1.8,
    length: 4.5,
    assists: {
      automaticClutchOnStall: true, // Default friendly behavior
      automaticClutchRpmRatio: 0.6
    },
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
      idlePID: { 
          kP: 0.002, 
          kI: 0.0001, 
          kD: 0.00005, 
          feedforward: 0.16, 
          // Gain Scheduling
          maxThrottleIdle: 0.4,
          maxThrottleAntiStall: 0.8,
          antiStallKpMultiplier: 2.5, // Effective kP becomes 0.005 during stalls
          antiStallRpmDropThreshold: 100
      }
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
  };
