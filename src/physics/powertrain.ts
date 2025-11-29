
import { CarConfig } from '../config/types';
import { PhysicsState } from './types';
import { calculateEngineTorque, calculateIdleThrottle } from './modules/engine';
import { calculateBrakeTorques } from './modules/brakes';
import { getTotalRatio, calculateEffectiveInertiaRatio } from './modules/transmission';
import { RAD_TO_RPM, lerp } from '../utils/math';

export interface PowertrainOutput {
    rpm: number; 
    driveForce: number; 
    effectiveLongitudinalMass: number; 
    stalled: boolean; 
    engineOn: boolean;
    idleIntegral: number;
    brakeTorqueFront: number;
    brakeTorqueRear: number;
    isClutchLocked: boolean;
    currentEffectiveMass: number;
}

// 1. Compute Net Torque (Combustion - Friction + Idle Correction)
const computeEngineNetTorque = (
    state: PhysicsState, 
    config: CarConfig, 
    dt: number
): { netTorque: number; throttleUsed: number; nextIdleIntegral: number } => {
    let finalThrottle = state.throttleInput;
    let nextIdleIntegral = state.idleIntegral;
    
    if (state.engineOn && !state.stalled) {
        const idleRes = calculateIdleThrottle(state.rpm, dt, config.engine, { rpm: state.lastRpm, integralError: state.idleIntegral });
        nextIdleIntegral = idleRes.newIntegral;
        finalThrottle = Math.max(state.throttleInput, idleRes.throttleOffset);
    }
    
    const torque = calculateEngineTorque(state.rpm, finalThrottle, state.engineOn, state.stalled, config.engine);
    return { netTorque: torque, throttleUsed: finalThrottle, nextIdleIntegral };
};

// 2. Solve Clutch & Transmission State
const solveClutchState = (
    state: PhysicsState,
    engineTorque: number,
    transmissionInputRPM: number,
    clutchCapacity: number,
    config: CarConfig
): { isLocked: boolean; transmittedTorque: number } => {
    const { gear, rpm } = state;
    const rpmDiff = rpm - transmissionInputRPM;
    
    // Determine Lock State (Hysteresis)
    let isLocked = state.isClutchLocked;
    const h = config.transmission.clutchHysteresis;
    const idleRPM = config.engine.idleRPM;

    if (gear === 0 || clutchCapacity < 5.0) {
        isLocked = false;
    } else if (isLocked) {
        const torqueOverload = Math.abs(engineTorque) > clutchCapacity * (1.0 + h);
        const rpmTooLow = rpm < (idleRPM * 0.6);
        if (torqueOverload || rpmTooLow) isLocked = false;
    } else {
        const torqueOk = Math.abs(engineTorque) < clutchCapacity * (1.0 - h);
        const rpmDiffOk = Math.abs(rpmDiff) < 150; 
        const rpmHealthy = rpm > (idleRPM * 0.9);
        if (torqueOk && rpmDiffOk && rpmHealthy) isLocked = true;
    }

    // Calculate Transmitted Torque based on state
    let transmittedTorque = 0;
    if (isLocked) {
        // In locked state, we don't calculate transmitted torque here for the engine side 
        // because the engine is kinematic constrained. 
        // But for the sake of checking limits, we assume it holds.
        transmittedTorque = engineTorque; 
    } else {
        const slipSign = Math.sign(rpmDiff);
        transmittedTorque = clutchCapacity * slipSign;
    }

    return { isLocked, transmittedTorque };
};

// 3. Project Torque to Wheels (Force & Mass)
const projectTorqueToWheels = (
    isLocked: boolean,
    engineTorque: number,
    transmittedTorque: number,
    gear: number,
    config: CarConfig,
    effectiveMass: number
): { driveForce: number; effectiveLongitudinalMass: number } => {
    const gearRatio = getTotalRatio(gear, config.transmission);
    const wheelRadius = config.chassis.wheelRadius;

    let driveForce = 0;
    let effLongMass = 0;

    if (gear === 0) {
        driveForce = 0;
        effLongMass = 0;
    } else if (isLocked) {
        // Locked: Engine directly drives wheels
        driveForce = (engineTorque * gearRatio) / wheelRadius;
        effLongMass = effectiveMass;
    } else {
        // Slipping: Friction torque drives wheels
        driveForce = (transmittedTorque * gearRatio) / wheelRadius;
        effLongMass = 0;
    }

    return { driveForce, effectiveLongitudinalMass: effLongMass };
};

// 4. Integrate Engine RPM
const integrateEngine = (
    currentRPM: number,
    isLocked: boolean,
    netEngineTorque: number, // (Combustion - Transmitted)
    transmissionInputRPM: number,
    inertia: number,
    dt: number
): number => {
    if (isLocked) {
        return transmissionInputRPM;
    } else {
        const alpha = netEngineTorque / inertia;
        return Math.max(0, currentRPM + alpha * RAD_TO_RPM * dt);
    }
};

export const updatePowertrain = (
    state: PhysicsState,
    config: CarConfig,
    dt: number
): PowertrainOutput => {
    const { localVelocity, gear, clutchPosition } = state;

    // A. Engine Torque Calculation
    const { netTorque: engineTorque, nextIdleIntegral } = computeEngineNetTorque(state, config, dt);

    // B. Driveline Kinematics
    const wheelRadius = config.chassis.wheelRadius;
    const gearRatio = getTotalRatio(gear, config.transmission);
    const wheelRotSpeed = localVelocity.x / wheelRadius; 
    const transmissionInputRPM = wheelRotSpeed * gearRatio * RAD_TO_RPM;
    
    const engagement = 1.0 - clutchPosition;
    const clutchCapacity = Math.max(0, engagement * config.transmission.clutchMaxTorque);

    // C. Effective Mass Smoothing
    const targetEffectiveMass = (config.engine.inertia * calculateEffectiveInertiaRatio(gear, config.transmission)) / (wheelRadius * wheelRadius);
    const smoothFactor = config.transmission.effectiveMassSmoothFactor ?? 0.2;
    let nextEffectiveMass = lerp(state.currentEffectiveMass || 0, targetEffectiveMass, smoothFactor);
    if (state.currentEffectiveMass === 0) nextEffectiveMass = targetEffectiveMass;

    // D. Solve Clutch
    const { isLocked, transmittedTorque } = solveClutchState(state, engineTorque, transmissionInputRPM, clutchCapacity, config);

    // E. Project Forces
    const { driveForce, effectiveLongitudinalMass } = projectTorqueToWheels(
        isLocked, 
        engineTorque, 
        transmittedTorque, 
        gear, 
        config, 
        nextEffectiveMass
    );

    // F. Integrate Engine
    // If slipping, net torque on engine = generated - transmitted
    // If locked, integration is overridden by wheel speed, but logically torque balances out.
    const torqueLoadOnEngine = (gear !== 0 && !isLocked) ? transmittedTorque : 0; // If locked, torque isn't "lost" to friction, but constrained.
    // Note: If disconnected (gear 0), transmitted is 0.
    
    const nextRPM = integrateEngine(state.rpm, isLocked, engineTorque - torqueLoadOnEngine, transmissionInputRPM, config.engine.inertia, dt);

    // G. Stall Logic
    let nextStalled = state.stalled;
    let nextEngineOn = state.engineOn;
    if (state.engineOn && !state.stalled && nextRPM < 300 && isLocked) {
        nextStalled = true;
        nextEngineOn = false;
    }

    // H. Brakes
    const brakes = calculateBrakeTorques(state.brakeInput, config.brakes);

    return {
        rpm: nextRPM,
        driveForce,
        effectiveLongitudinalMass,
        stalled: nextStalled,
        engineOn: nextEngineOn,
        idleIntegral: nextIdleIntegral,
        brakeTorqueFront: brakes.frontTorque,
        brakeTorqueRear: brakes.rearTorque,
        isClutchLocked: isLocked,
        currentEffectiveMass: nextEffectiveMass
    };
};
