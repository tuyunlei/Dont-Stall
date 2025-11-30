
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
    starterActive: boolean;
    idleIntegral: number;
    brakeTorqueFront: number;
    brakeTorqueRear: number;
    isClutchLocked: boolean;
    currentEffectiveMass: number;
}

// 1. Compute Net Torque (Combustion - Friction + Idle Correction + Starter)
const computeEngineNetTorque = (
    state: PhysicsState, 
    config: CarConfig, 
    dt: number
): { netTorque: number; throttleUsed: number; nextIdleIntegral: number } => {
    let finalThrottle = state.throttleInput;
    let nextIdleIntegral = state.idleIntegral;
    
    if (state.engineOn && !state.stalled) {
        // Clutch Position 0.0 = Fully Engaged, 1.0 = Disconnected
        const isClutchEngaged = state.clutchPosition < 0.9;
        const inGear = state.gear !== 0;

        const idleRes = calculateIdleThrottle(
            state.rpm, 
            dt, 
            config.engine, 
            { rpm: state.lastRpm, integralError: state.idleIntegral },
            { inGear, isClutchEngaged }
        );
        nextIdleIntegral = idleRes.newIntegral;
        finalThrottle = Math.max(state.throttleInput, idleRes.throttleOffset);
    }
    
    let netTorque = calculateEngineTorque(state.rpm, finalThrottle, state.engineOn, state.stalled, config.engine);

    // Apply Starter Torque if actively cranking and engine is off
    if (state.starterActive && !state.engineOn && !state.stalled) {
        // Simple linear torque drop-off: Max torque at 0 RPM, 0 torque at maxStarterRPM
        const starterCfg = config.engine.starter;
        if (starterCfg) {
            const starterFactor = Math.max(0, 1.0 - (state.rpm / starterCfg.maxRPM));
            const starterTorque = starterCfg.torque * starterFactor;
            netTorque += starterTorque;
        }
    }

    return { netTorque, throttleUsed: finalThrottle, nextIdleIntegral };
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
        
        let shouldAutoDisconnect = false;
        // Check Assist Config
        if (config.assists.automaticClutchOnStall) {
            const ratio = config.assists.automaticClutchRpmRatio ?? 0.6;
            if (rpm < idleRPM * ratio) {
                shouldAutoDisconnect = true;
            }
        }

        if (torqueOverload || shouldAutoDisconnect) isLocked = false;
    } else {
        const torqueOk = Math.abs(engineTorque) < clutchCapacity * (1.0 - h);
        const rpmDiffOk = Math.abs(rpmDiff) < 150; 
        
        // Logic: Only allow locking if RPM is healthy, OR if we are being dragged by the starter/wheels
        // For C1 Hardcore, we allow locking even at low RPM to simulate stall conditions
        const isC1 = config.drivetrainMode === 'C1_TRAINER';
        const rpmHealthy = rpm > (idleRPM * 0.9);
        const canLock = isC1 ? true : rpmHealthy;

        if (torqueOk && rpmDiffOk && canLock) isLocked = true;
    }

    // Calculate Transmitted Torque based on state
    let transmittedTorque = 0;
    if (isLocked) {
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
    let nextRPM = 0;
    
    if (isLocked) {
        nextRPM = transmissionInputRPM;
    } else {
        const alpha = netEngineTorque / inertia;
        nextRPM = currentRPM + alpha * RAD_TO_RPM * dt;
    }

    // Physical Invariant: RPM cannot be negative.
    return Math.max(0, nextRPM);
};

export const updatePowertrain = (
    state: PhysicsState,
    config: CarConfig,
    dt: number
): PowertrainOutput => {
    const { localVelocity, gear, clutchPosition } = state;
    const isC1 = config.drivetrainMode === 'C1_TRAINER';

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
    const torqueLoadOnEngine = (gear !== 0 && !isLocked) ? transmittedTorque : 0; 
    const nextRPM = integrateEngine(state.rpm, isLocked, engineTorque - torqueLoadOnEngine, transmissionInputRPM, config.engine.inertia, dt);

    // G. State Logic (Stall / Ignition)
    let nextStalled = state.stalled;
    let nextEngineOn = state.engineOn;
    let nextStarterActive = state.starterActive;
    
    // 1. Ignition Check
    if (nextStarterActive && !nextEngineOn) {
        const ignitionThreshold = config.engine.starter?.ignitionRPM || 300;
        if (nextRPM > ignitionThreshold) {
            nextEngineOn = true;
            nextStarterActive = false; // Disengage starter
            nextStalled = false;
        }
    }

    // 2. Standard Stall Logic
    // With Hardcore settings, isLocked remains true even at low RPM.
    // If RPM drops below critical threshold while locked, we stall.
    if (nextEngineOn && !nextStalled && nextRPM < 300 && isLocked) {
        nextStalled = true;
        nextEngineOn = false;
    }

    // 3. C1 Special: High Gear Idle Stall Logic
    // If in high gear (>=3), low throttle, and RPM dropping, force stall earlier to prevent infinite cruise
    if (isC1 && nextEngineOn && Math.abs(gear) >= 3 && state.throttleInput < 0.05 && isLocked) {
        const idleThreshold = config.engine.idleRPM * 0.8;
        if (nextRPM < idleThreshold) {
            nextStalled = true;
            nextEngineOn = false;
        }
    }

    // 4. C1 Special: Reverse Shock Logic
    // If gear direction opposes motion direction at low speed (high speed blocked by GameLoop), force stall
    if (isC1 && nextEngineOn && isLocked) {
        const speedDir = Math.sign(localVelocity.x);
        const gearDir = Math.sign(gear); // -1 for Reverse
        if (gearDir !== 0 && speedDir !== 0 && gearDir !== speedDir && Math.abs(localVelocity.x) > 0.5) {
             // Severe shock -> immediate stall
             nextStalled = true;
             nextEngineOn = false;
        }
    }

    // H. Brakes
    const brakes = calculateBrakeTorques(state.brakeInput, state.handbrakeInput, config.brakes);

    return {
        rpm: nextRPM,
        driveForce,
        effectiveLongitudinalMass,
        stalled: nextStalled,
        engineOn: nextEngineOn,
        starterActive: nextStarterActive,
        idleIntegral: nextIdleIntegral,
        brakeTorqueFront: brakes.frontTorque,
        brakeTorqueRear: brakes.rearTorque,
        isClutchLocked: isLocked,
        currentEffectiveMass: nextEffectiveMass
    };
};