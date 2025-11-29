
import { ChassisConfig, FeelConfig } from '../config/types';
import { PhysicsState, StoppingState } from './types';
import { EnvironmentConfig } from '../game/types';
import { smoothstep, clamp, softSaturation, lowpass } from '../utils/math';

const GRAVITY = 9.81;

export interface ChassisForces {
    driveForce: number;      
    effectiveLongitudinalMass: number; 
    brakeTorqueFront: number; 
    brakeTorqueRear: number;  
}

interface LoadDistribution {
    Fz_f: number;
    Fz_r: number;
    weightLong: number;
}

interface TireForcesResult {
    Fx_f: number;
    Fy_f: number;
    Fx_r: number;
    Fy_r: number;
}

// 1. Calculate Load Distribution (Static + Dynamic Transfer)
const computeLoadDistribution = (
    mass: number, 
    ax: number, 
    slope: number, 
    config: ChassisConfig
): LoadDistribution => {
    const weight = mass * GRAVITY * Math.cos(slope);
    const staticFzFront = (config.cgToRear / config.wheelBase) * weight;
    const staticFzRear = (config.cgToFront / config.wheelBase) * weight;
    
    const dynamicLoad = (ax * mass * config.cgHeight) / config.wheelBase;
    
    return {
        Fz_f: clamp(staticFzFront - dynamicLoad, 100, weight),
        Fz_r: clamp(staticFzRear + dynamicLoad, 100, weight),
        weightLong: -mass * GRAVITY * Math.sin(slope)
    };
};

// 2. Stop State Machine (Pure Logic)
const updateStoppingState = (
    currentState: StoppingState,
    currentTimer: number,
    velocity: number,
    totalBrakeTorque: number,
    netPropulsionForce: number, // Drive + Gravity
    config: ChassisConfig,
    feel: FeelConfig,
    dt: number
): { stoppingState: StoppingState; stopTimer: number } => {
    const absVx = Math.abs(velocity);
    const isBraking = totalBrakeTorque > 10;
    
    // Condition to hold the car still
    // Brake Force Limit > Propulsion (Gravity + Engine)
    const maxBrakeForce = totalBrakeTorque / config.wheelRadius;
    const holdCondition = maxBrakeForce > Math.abs(netPropulsionForce);

    let nextState = currentState;
    let nextTimer = currentTimer;

    switch (currentState) {
        case StoppingState.MOVING:
            // Transition: Speed low AND braking
            if (absVx < feel.vStopThreshold && isBraking) {
                nextState = StoppingState.STOPPING;
                nextTimer = 0;
            }
            break;

        case StoppingState.STOPPING:
            nextTimer += dt;
            // Transition: Success (Speed near zero, time passed)
            if (absVx < feel.vStopThreshold / 2 && nextTimer > feel.minStopTime) {
                nextState = StoppingState.STOPPED;
            } 
            // Transition: Abort (Speed rose again or brakes released)
            else if (absVx > feel.vStopThreshold * 1.5 || !isBraking) {
                nextState = StoppingState.MOVING;
            }
            break;

        case StoppingState.STOPPED:
            // Transition: Wake up if brakes released or overwhelmed
            if (!holdCondition) {
                nextState = StoppingState.MOVING;
            }
            break;
    }

    return { stoppingState: nextState, stopTimer: nextTimer };
};

// 3. Apply Stop State (Zero out velocity if Stopped)
const applyStopState = (
    state: Partial<PhysicsState>,
    stoppingState: StoppingState
): Partial<PhysicsState> => {
    if (stoppingState === StoppingState.STOPPED) {
        return {
            ...state,
            velocity: { x: 0, y: 0 },
            localVelocity: { x: 0, y: 0 },
            angularVelocity: 0,
            speedKmh: 0,
            lastAx: 0,
            lastAy: 0
        };
    }
    return state;
};

// 4. Calculate Tire Forces
const computeTireForces = (
    localVelocity: {x: number, y: number}, 
    angularVelocity: number, 
    steerAngle: number, 
    loads: LoadDistribution,
    inputs: ChassisForces, 
    config: ChassisConfig,
    stoppingState: StoppingState
): TireForcesResult => {
    const vx = localVelocity.x;
    const vy = localVelocity.y;
    const r = angularVelocity;

    const vx_safe = Math.abs(vx) < 0.5 ? 0.5 : Math.abs(vx);
    
    const vy_f = vy + config.cgToFront * r;
    const vy_r = vy - config.cgToRear * r;
    
    const alpha_f = Math.atan2(vy_f, vx_safe) - steerAngle * Math.sign(vx);
    const alpha_r = Math.atan2(vy_r, vx_safe);

    // Brake Scaling during stop phase to smooth transition
    let brakeScale = 1.0;
    if (stoppingState === StoppingState.STOPPING) {
        brakeScale = Math.min(1.0, Math.abs(vx) * 5);
    }

    const Fx_brake_f = -Math.sign(vx) * inputs.brakeTorqueFront / config.wheelRadius * brakeScale;
    const Fx_brake_r = -Math.sign(vx) * inputs.brakeTorqueRear / config.wheelRadius * brakeScale;
    const Fx_drive_f = inputs.driveForce;

    const mu = config.tireFriction;
    
    const kappa_f = (config.tireStiffnessFront * alpha_f) / (mu * loads.Fz_f);
    const kappa_r = (config.tireStiffnessRear * alpha_r) / (mu * loads.Fz_r);

    const Fy_f_raw = -softSaturation(kappa_f, 2.0) * (mu * loads.Fz_f);
    const Fy_r_raw = -softSaturation(kappa_r, 2.0) * (mu * loads.Fz_r);

    // Friction Circle
    const applyFrictionCircle = (Fx: number, Fy: number, Fz: number) => {
        const maxForce = Fz * mu;
        const currentMag = Math.hypot(Fx, Fy);
        if (currentMag > maxForce) {
            const scale = maxForce / currentMag;
            return { x: Fx * scale, y: Fy * scale };
        }
        return { x: Fx, y: Fy };
    };

    const front = applyFrictionCircle(Fx_drive_f + Fx_brake_f, Fy_f_raw, loads.Fz_f);
    const rear = applyFrictionCircle(Fx_brake_r, Fy_r_raw, loads.Fz_r);

    return { Fx_f: front.x, Fy_f: front.y, Fx_r: rear.x, Fy_r: rear.y };
};

// 5. Integrate Motion (Newton-Euler)
const integrateMotion = (
    currentPose: { vx: number, vy: number, r: number, heading: number, x: number, y: number },
    forces: TireForcesResult,
    loads: LoadDistribution,
    steerAngle: number,
    effectiveLongMass: number,
    config: ChassisConfig,
    dt: number
) => {
    const { vx, vy, r, heading, x, y } = currentPose;
    const mass_long = config.mass + effectiveLongMass;
    const mass_lat = config.mass;
    
    const sinS = Math.sin(steerAngle);
    const cosS = Math.cos(steerAngle);

    const F_aero = -config.dragCoefficient * vx * Math.abs(vx);
    const F_roll = -config.rollingResistance * config.mass * GRAVITY * Math.sign(vx);

    const Fx_total = forces.Fx_f * cosS + forces.Fx_r - forces.Fy_f * sinS + F_aero + F_roll + loads.weightLong;
    const Fy_total = forces.Fy_f * cosS + forces.Fy_r + forces.Fx_f * sinS;
    const Mz_total = (forces.Fy_f * cosS + forces.Fx_f * sinS) * config.cgToFront - forces.Fy_r * config.cgToRear;

    const ax = Fx_total / mass_long + vy * r;
    const ay = Fy_total / mass_lat - vx * r;
    const alpha = Mz_total / config.momentOfInertia;

    return {
        vx: vx + ax * dt,
        vy: vy + ay * dt,
        r: r + alpha * dt,
        ax, ay
    };
};

// 6. Low Speed Kinematic Blend
const blendKinematics = (
    dynResult: { vx: number, vy: number, r: number },
    steerAngle: number,
    config: ChassisConfig,
    feel: FeelConfig
) => {
    const blendFactor = smoothstep(feel.lowSpeedBlendStart, feel.lowSpeedBlendEnd, Math.abs(dynResult.vx));
    
    if (blendFactor >= 1.0) return dynResult;

    const beta = Math.atan((config.cgToRear / config.wheelBase) * Math.tan(steerAngle));
    const vy_kin = dynResult.vx * Math.tan(beta);
    const r_kin = (dynResult.vx * Math.cos(beta) * Math.tan(steerAngle)) / config.wheelBase;
    
    return {
        vx: dynResult.vx,
        vy: vy_kin * (1 - blendFactor) + dynResult.vy * blendFactor,
        r: r_kin * (1 - blendFactor) + dynResult.r * blendFactor
    };
};

// --- Main Update Function ---

export const updateChassisDynamics = (
    state: PhysicsState,
    inputs: ChassisForces,
    config: ChassisConfig,
    feel: FeelConfig,
    environment: EnvironmentConfig,
    dt: number
): Partial<PhysicsState> => {
    // 1. Env & State Prep
    const slope = environment.slope || 0;
    const { velocity, localVelocity, heading, angularVelocity, steerAngle, lastAx } = state;
    const ax_filtered = lowpass(lastAx || 0, lastAx || 0, 0.1, dt);

    // 2. Load Transfer
    const loads = computeLoadDistribution(config.mass, ax_filtered, slope, config);

    // 3. Stop State Machine
    const totalBrakeTorque = inputs.brakeTorqueFront + inputs.brakeTorqueRear;
    const netPropulsion = inputs.driveForce + loads.weightLong; // Engine Push + Gravity Pull
    
    const { stoppingState: nextStopState, stopTimer: nextStopTimer } = updateStoppingState(
        state.stoppingState || StoppingState.MOVING,
        state.stopTimer || 0,
        localVelocity.x,
        totalBrakeTorque,
        netPropulsion,
        config,
        feel,
        dt
    );

    // If fully stopped, verify early return via helper
    if (nextStopState === StoppingState.STOPPED) {
        return applyStopState({
            velocity: state.velocity, 
            localVelocity: state.localVelocity,
            heading,
            position: state.position,
            stoppingState: nextStopState,
            stopTimer: nextStopTimer
        }, nextStopState);
    }

    // 4. Forces
    const forces = computeTireForces(localVelocity, angularVelocity, steerAngle, loads, inputs, config, nextStopState);

    // 5. Integration
    const motion = integrateMotion(
        { vx: localVelocity.x, vy: localVelocity.y, r: angularVelocity, heading, x: state.position.x, y: state.position.y },
        forces, loads, steerAngle, inputs.effectiveLongitudinalMass, config, dt
    );

    // 6. Blend
    const blended = blendKinematics({ vx: motion.vx, vy: motion.vy, r: motion.r }, steerAngle, config, feel);

    // 7. World Transform
    const next_heading = heading + blended.r * dt;
    const cosH = Math.cos(next_heading);
    const sinH = Math.sin(next_heading);
    const world_vx = blended.vx * cosH - blended.vy * sinH;
    const world_vy = blended.vx * sinH + blended.vy * cosH;

    const resultState = {
        velocity: { x: world_vx, y: world_vy },
        localVelocity: { x: blended.vx, y: blended.vy },
        heading: next_heading,
        angularVelocity: blended.r,
        position: {
            x: state.position.x + world_vx * dt,
            y: state.position.y + world_vy * dt
        },
        speedKmh: blended.vx * 3.6,
        stoppingState: nextStopState,
        stopTimer: nextStopTimer,
        lastAx: motion.ax,
        lastAy: motion.ay
    };

    return resultState;
};
