

import { ChassisConfig, FeelConfig, PhysicsState, StoppingState, EnvironmentConfig } from '../../types';
import { smoothstep, clamp, softSaturation, lowpass } from '../../utils/math';

const GRAVITY = 9.81;

export interface ChassisInputs {
    driveForce: number;      
    effectiveLongitudinalMass: number; 
    brakeTorqueFront: number; 
    brakeTorqueRear: number;  
}

export const updateChassisDynamics = (
    state: PhysicsState,
    inputs: ChassisInputs,
    config: ChassisConfig,
    feel: FeelConfig,
    environment: EnvironmentConfig, // v3.0: Environment Injection
    dt: number
): Partial<PhysicsState> => {
    let { 
        position, velocity, localVelocity, heading, angularVelocity, 
        steerAngle, lastAx, lastAy, stoppingState, stopTimer 
    } = state;

    let vx = localVelocity.x;
    let vy = localVelocity.y;
    let r = angularVelocity;

    // v3.0: Slope & Gravity Forces
    // Positive slope = Uphill. Gravity pulls BACK (-x).
    const slope = environment.slope || 0;
    const gravityForceLong = -config.mass * GRAVITY * Math.sin(slope);
    
    // Total Brake Force available
    const totalBrakeTorque = inputs.brakeTorqueFront + inputs.brakeTorqueRear;
    const maxBrakeForce = totalBrakeTorque / config.wheelRadius;
    const isBraking = totalBrakeTorque > 10;

    // --- 1. Stopping State Machine (Updated for Slope) ---
    // Condition to stay stopped: Brake Force > (Drive Force + Gravity Force)
    const netPropulsion = inputs.driveForce + gravityForceLong;
    const holdCondition = maxBrakeForce > Math.abs(netPropulsion);

    let nextStoppingState = stoppingState || StoppingState.MOVING;
    let nextStopTimer = stopTimer || 0;
    const absVx = Math.abs(vx);

    if (nextStoppingState === StoppingState.MOVING) {
        if (absVx < feel.vStopThreshold && isBraking) {
            nextStoppingState = StoppingState.STOPPING;
            nextStopTimer = 0;
        }
    } else if (nextStoppingState === StoppingState.STOPPING) {
        nextStopTimer += dt;
        if (absVx < feel.vStopThreshold / 2 && nextStopTimer > feel.minStopTime) {
             nextStoppingState = StoppingState.STOPPED;
        } else if (absVx > feel.vStopThreshold * 1.5 || !isBraking) {
             nextStoppingState = StoppingState.MOVING;
        }
    } else if (nextStoppingState === StoppingState.STOPPED) {
        // Wake up if brakes released OR propulsion overcomes brakes
        if (!holdCondition) {
             nextStoppingState = StoppingState.MOVING;
        }
    }

    // --- 2. Load Transfer (Filtered) ---
    const weight = config.mass * GRAVITY * Math.cos(slope); // Adjust Fz for slope
    const distFront = config.cgToFront;
    const distRear = config.cgToRear;
    const Fz_static_f = (distRear / config.wheelBase) * weight;
    const Fz_static_r = (distFront / config.wheelBase) * weight;

    const TAU_LOAD = 0.1; 
    const ax_filtered = lowpass(lastAx || 0, state.lastAx || 0, TAU_LOAD, dt);
    const h = config.cgHeight;
    const loadTransferLong = (ax_filtered * config.mass * h) / config.wheelBase;

    const Fz_f = clamp(Fz_static_f - loadTransferLong, 100, weight);
    const Fz_r = clamp(Fz_static_r + loadTransferLong, 100, weight);

    // --- 3. Tire Dynamics ---
    
    if (nextStoppingState === StoppingState.STOPPED) {
        return {
            velocity: { x: 0, y: 0 },
            localVelocity: { x: 0, y: 0 },
            heading: heading,
            angularVelocity: 0,
            position: position,
            speedKmh: 0,
            stoppingState: StoppingState.STOPPED,
            stopTimer: 0,
            lastAx: 0,
            lastAy: 0
        };
    }

    // Slip Angles
    const vSlipMin = feel.vSlipMin; 
    const vx_safe = Math.abs(vx) < vSlipMin ? vSlipMin : Math.abs(vx);
    
    const vy_f = vy + distFront * r;
    const vy_r = vy - distRear * r;
    
    const alpha_f = Math.atan2(vy_f, vx_safe) - steerAngle * Math.sign(vx);
    const alpha_r = Math.atan2(vy_r, vx_safe);

    // Forces
    const Fx_drive_f = inputs.driveForce; 
    
    // Braking (Dynamic)
    let brakeScale = 1.0;
    if (nextStoppingState === StoppingState.STOPPING) {
        brakeScale = Math.min(1.0, absVx * 5); 
    }
    
    const Fx_brake_f = -Math.sign(vx) * inputs.brakeTorqueFront / config.wheelRadius * brakeScale;
    const Fx_brake_r = -Math.sign(vx) * inputs.brakeTorqueRear / config.wheelRadius * brakeScale;

    const Fx_f_raw = Fx_drive_f + Fx_brake_f;
    const Fx_r_raw = Fx_brake_r;

    // Friction Circle
    const mu = config.tireFriction;
    
    const kappa_f = (config.tireStiffnessFront * alpha_f) / (mu * Fz_f);
    const kappa_r = (config.tireStiffnessRear * alpha_r) / (mu * Fz_r);

    const Fy_f_raw = -softSaturation(kappa_f, 2.0) * (mu * Fz_f);
    const Fy_r_raw = -softSaturation(kappa_r, 2.0) * (mu * Fz_r);

    const applyFrictionCircle = (Fx: number, Fy: number, Fz: number) => {
        const maxForce = Fz * mu;
        const currentMag = Math.hypot(Fx, Fy);
        if (currentMag > maxForce) {
            const scale = maxForce / currentMag;
            return { x: Fx * scale, y: Fy * scale };
        }
        return { x: Fx, y: Fy };
    };

    const frontForces = applyFrictionCircle(Fx_f_raw, Fy_f_raw, Fz_f);
    const rearForces = applyFrictionCircle(Fx_r_raw, Fy_r_raw, Fz_r);

    const Fx_f = frontForces.x;
    const Fy_f = frontForces.y;
    const Fx_r = rearForces.x;
    const Fy_r = rearForces.y;

    // --- 4. Integration ---
    const mass_long = config.mass + inputs.effectiveLongitudinalMass; 
    const mass_lat = config.mass; 
    
    const F_aero = -config.dragCoefficient * vx * Math.abs(vx);
    const F_roll = -config.rollingResistance * weight * Math.sign(vx);

    const sinS = Math.sin(steerAngle);
    const cosS = Math.cos(steerAngle);

    // Body Frame Forces
    // v3.0: Add gravityForceLong to Fx_total
    const Fx_total = Fx_f * cosS + Fx_r - Fy_f * sinS + F_aero + F_roll + gravityForceLong;
    const Fy_total = Fy_f * cosS + Fy_r + Fx_f * sinS;
    const Mz_total = (Fy_f * cosS + Fx_f * sinS) * distFront - Fy_r * distRear;

    // Accels
    const ax = Fx_total / mass_long + vy * r;
    const ay = Fy_total / mass_lat - vx * r;
    const alpha = Mz_total / config.momentOfInertia;

    const vx_dyn = vx + ax * dt;
    const vy_dyn = vy + ay * dt;
    const r_dyn = r + alpha * dt;

    // Low Speed Blend (v3.0 Configurable)
    const blendFactor = smoothstep(feel.lowSpeedBlendStart, feel.lowSpeedBlendEnd, Math.abs(vx));

    let next_vx = vx_dyn;
    let next_vy = vy_dyn;
    let next_r = r_dyn;

    if (blendFactor < 1.0) {
        const beta = Math.atan((distRear / config.wheelBase) * Math.tan(steerAngle));
        const vy_kin = vx * Math.tan(beta);
        const r_kin = (vx * Math.cos(beta) * Math.tan(steerAngle)) / config.wheelBase;
        
        // v3.0: Respect kinematic constraints but allow sliding if inputs are wild
        next_vy = vy_kin * (1 - blendFactor) + vy_dyn * blendFactor;
        next_r = r_kin * (1 - blendFactor) + r_dyn * blendFactor;
    }

    // World Pos
    const next_heading = heading + next_r * dt;
    const cosH = Math.cos(next_heading);
    const sinH = Math.sin(next_heading);
    
    const world_vx = next_vx * cosH - next_vy * sinH;
    const world_vy = next_vx * sinH + next_vy * cosH;

    return {
        velocity: { x: world_vx, y: world_vy },
        localVelocity: { x: next_vx, y: next_vy },
        heading: next_heading,
        angularVelocity: next_r,
        position: {
            x: position.x + world_vx * dt,
            y: position.y + world_vy * dt
        },
        speedKmh: next_vx * 3.6,
        stoppingState: nextStoppingState,
        stopTimer: nextStopTimer,
        lastAx: ax, 
        lastAy: ay
    };
};
