
import { EngineConfig } from '../../config/types';
import { clamp, interpolateTable } from '../../utils/math';

export interface EngineState {
    rpm: number;
    integralError: number;
}

export const initialEngineState: EngineState = {
    rpm: 0,
    integralError: 0
};

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

    if (!engineOn || stalled) {
        return -totalFriction; 
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
    prevState: EngineState
): { throttleOffset: number, newIntegral: number } => {
    const targetRPM = config.idleRPM;
    const error = targetRPM - currentRPM;
    
    let newIntegral = prevState.integralError;
    if (Math.abs(error) < 1000) { 
        newIntegral += error * dt;
    }
    newIntegral = clamp(newIntegral, -0.5, 0.5);
    
    // Reset integral if RPM is very high to avoid windup hanging
    if (currentRPM > targetRPM + 1500) newIntegral = 0;

    const derivative = (currentRPM - prevState.rpm) / dt;

    const pidOut = 
        error * config.idlePID.kP + 
        newIntegral * config.idlePID.kI - 
        derivative * config.idlePID.kD; 

    return {
        throttleOffset: clamp(config.idlePID.feedforward + pidOut, 0, 0.4), 
        newIntegral
    };
};
