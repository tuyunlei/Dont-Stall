
import { CarConfig } from '../types';

export const C1_TRAINER: CarConfig = {
    name: "C1 Trainer (Manual)",
    drivetrainMode: 'C1_TRAINER', // Hardcore mode
    width: 1.8,
    length: 4.5,
    assists: {
      automaticClutchOnStall: false, // HARDCORE: Will stall on brake
      automaticClutchRpmRatio: 0.6
    },
    engine: {
      idleRPM: 800,
      redlineRPM: 6000,
      maxRPM: 6500,
      inertia: 0.35, // Slightly heavier flywheel for stability
      starter: {
        torque: 40.0,     // Strong starter torque
        maxRPM: 600,      // INCREASED: Allow starter to maintain higher torque at 300rpm to ensure ignition
        ignitionRPM: 300  // Engine fires up at 300
      },
      frictionCoef: { c0: 8, c1: 0.005, c2: 0.000001, kPump: 0.008 },
      torqueCurve: [
        { rpm: 0, torque: 40 },    // Higher starting torque
        { rpm: 500, torque: 120 }, // Strong low-end for creep
        { rpm: 800, torque: 135 }, // Robust idle torque
        { rpm: 1000, torque: 145 },
        { rpm: 3000, torque: 155 },
        { rpm: 5500, torque: 140 },
        { rpm: 6500, torque: 0 }
      ],
      idlePID: { 
          kP: 0.003, // Aggressive idle control to fight clutch load
          kI: 0.0002, 
          kD: 0.00005, 
          feedforward: 0.16, 
          maxThrottleIdle: 0.4,
          maxThrottleAntiStall: 0.5, // Reduced from 0.9 to 0.5 to allow stalling in high gears
          antiStallKpMultiplier: 3.0, 
          antiStallRpmDropThreshold: 50 // Trigger help sooner
      }
    },
    transmission: {
      gearRatios: [0, 3.8, 2.1, 1.4, 1.0, 0.8], // Short 1st gear for easy creep
      finalDriveRatio: 4.2,
      clutchMaxTorque: 160, // Slightly softer clutch limit for easier modulation
      clutchHysteresis: 0.15,
      effectiveMassSmoothFactor: 0.15 
    },
    brakes: {
      maxBrakeTorque: 3500,
      brakeBias: 0.65,
      handbrakeRearMaxTorque: 3500,
    },
    chassis: {
      mass: 1250,
      wheelBase: 2.60,
      trackWidth: 1.55,
      wheelRadius: 0.28, // Smaller wheels
      cgHeight: 0.5,
      dragCoefficient: 0.35,
      rollingResistance: 0.015,
      cgToFront: 1.0, 
      cgToRear: 1.6,
      momentOfInertia: 1900,
      tireStiffnessFront: 55000,
      tireStiffnessRear: 55000,
      tireFriction: 0.95, // Economy tires
      steeringRatio: 16, // Slower steering
      maxSteeringWheelAngle: 540,
    },
    controls: {
      throttleTau: 0.04, // Faster throttle response
      brakeTau: 0.03,    // Faster brake response
      clutchTau: 0.05,   // Much faster clutch response
      handbrakeTau: 0.05,
      steeringReturnTau: 0.25,
      steeringCurve: [
          { speed: 0, tau: 0.12 },
          { speed: 10, tau: 0.2 },
          { speed: 30, tau: 0.4 }
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