

import { EngineConfig } from '../../config/types';
import { clamp, interpolateTable } from '../../utils/math';

export interface EngineState {
    rpm: number;
    integralError: number;
}

export const calculateEngineTorque = (
    rpm: number, 
    throttle: number, 
    engineOn: boolean, 
    stalled: boolean, 
    config: EngineConfig
): number => {
    // 1. Friction & Pumping Losses
    const c0 = config.frictionCoef.c0;
    const c1 = config.frictionCoef.c1;
    const c2 = config.frictionCoef.c2;
    const kPump = config.frictionCoef.kPump;

    const rpmAbs = Math.abs(rpm);
    const frictionMech = c0 + c1 * rpmAbs + c2 * (rpmAbs * rpmAbs);
    const frictionPump = kPump * (1.0 - throttle) * rpmAbs;

    const totalFriction = frictionMech + frictionPump;

    // FIX: Handle Stalled/Off state specifically to prevent "Ghost Force"
    if (!engineOn || stalled) {
        // If RPM is effectively zero, there should be no torque.
        // Prevents the static friction term (c0) from acting as a constant reverse motor.
        if (rpmAbs < 1.0) {
            return 0;
        }
        // Friction always opposes rotation.
        // If RPM > 0, returns -Friction (Braking)
        // If RPM < 0, returns +Friction (Resisting reverse rotation)
        return -Math.sign(rpm) * totalFriction; 
    }

    // 2. Combustion Torque
    const maxTorqueAtRPM = interpolateTable(
        config.torqueCurve.map(p => ({x: p.rpm, y: p.torque})), 
        rpm
    );
    
    // Rev Limiter
    if (rpm > config.maxRPM) return -totalFriction;

    const combustionTorque = maxTorqueAtRPM * throttle;

    return combustionTorque - totalFriction;
};

export const calculateIdleThrottle = (
    currentRPM: number, 
    dt: number, 
    config: EngineConfig,
    prevState: EngineState,
    context: { inGear: boolean; isClutchEngaged: boolean }
): { throttleOffset: number, newIntegral: number } => {
    const targetRPM = config.idleRPM;
    const error = targetRPM - currentRPM;
    
    // Gain Scheduling: Determine Context
    // We boost responsiveness if the engine is under load (In Gear + Clutch engaged) 
    // AND the RPM has dropped significantly below target.
    const isAntiStallNeeded = context.inGear && 
                              context.isClutchEngaged && 
                              (error > config.idlePID.antiStallRpmDropThreshold);

    // Select parameters based on context
    const activeKP = isAntiStallNeeded 
        ? config.idlePID.kP * config.idlePID.antiStallKpMultiplier 
        : config.idlePID.kP;

    const maxThrottle = isAntiStallNeeded 
        ? config.idlePID.maxThrottleAntiStall 
        : config.idlePID.maxThrottleIdle;

    // Integral calculation (Standard anti-windup)
    let newIntegral = prevState.integralError;
    if (Math.abs(error) < 1000) { 
        newIntegral += error * dt;
    }
    newIntegral = clamp(newIntegral, -0.5, 0.5);
    
    // Reset integral if RPM is very high to avoid windup hanging
    if (currentRPM > targetRPM + 1500) newIntegral = 0;

    const derivative = (currentRPM - prevState.rpm) / dt;

    // PID Output using scheduled gain
    const pidOut = 
        error * activeKP + 
        newIntegral * config.idlePID.kI - 
        derivative * config.idlePID.kD; 

    return {
        throttleOffset: clamp(config.idlePID.feedforward + pidOut, 0, maxThrottle), 
        newIntegral
    };
};