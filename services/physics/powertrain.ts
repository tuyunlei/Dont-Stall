

import { CarConfig, PhysicsState } from '../../types';
import { calculateEngineTorque, calculateIdleThrottle } from './modules/engine';
import { calculateBrakeTorques } from './modules/brakes';
import { getTotalRatio, calculateEffectiveInertiaRatio } from './modules/transmission';
import { RAD_TO_RPM, lerp } from '../../utils/math';

export interface PowertrainOutput {
    rpm: number; 
    driveForce: number; // Force on wheels (N)
    effectiveLongitudinalMass: number; // Only for longitudinal acceleration
    stalled: boolean; 
    engineOn: boolean;
    idleIntegral: number;
    brakeTorqueFront: number;
    brakeTorqueRear: number;
    isClutchLocked: boolean;
    currentEffectiveMass: number;
}

export const updatePowertrain = (
    state: PhysicsState,
    config: CarConfig,
    dt: number
): PowertrainOutput => {
    const { throttleInput, brakeInput, clutchPosition, gear, rpm, engineOn, stalled, localVelocity } = state;

    // 1. Idle Control
    let finalThrottle = throttleInput;
    let nextIdleIntegral = state.idleIntegral;

    if (engineOn && !stalled) {
        // Pass state.lastRpm as prevState.rpm for correct derivative calculation (RPM_t - RPM_{t-1})
        const idleResult = calculateIdleThrottle(rpm, dt, config.engine, { rpm: state.lastRpm, integralError: state.idleIntegral });
        nextIdleIntegral = idleResult.newIntegral;
        finalThrottle = Math.max(throttleInput, idleResult.throttleOffset);
    }

    // 2. Engine Torque (Net Combustion - Friction)
    const engineTorque = calculateEngineTorque(rpm, finalThrottle, engineOn, stalled, config.engine);

    // 3. Driveline State
    const gearRatio = getTotalRatio(gear, config.transmission);
    const wheelRadius = config.chassis.wheelRadius;
    const wheelRotSpeed = localVelocity.x / wheelRadius; // rad/s
    const transmissionInputRPM = wheelRotSpeed * gearRatio * RAD_TO_RPM;

    const clutchEngagement = 1.0 - clutchPosition;
    const clutchMaxCap = config.transmission.clutchMaxTorque;
    const clutchCapacity = clutchEngagement * clutchMaxCap; 

    // v3.0: Effective Mass Smoothing (Shift Shock Reduction)
    const targetInertiaRatio = calculateEffectiveInertiaRatio(gear, config.transmission);
    // I_eff / R^2 = Mass equivalent
    const targetEffectiveMass = (config.engine.inertia * targetInertiaRatio) / (wheelRadius * wheelRadius);
    
    // Smooth the mass transition during shifts
    let nextEffectiveMass = state.currentEffectiveMass || 0;
    // Initialize if zero (first frame)
    if (nextEffectiveMass === 0) nextEffectiveMass = targetEffectiveMass;
    
    const smoothFactor = config.transmission.effectiveMassSmoothFactor ?? 0.2;
    // If gear changed, we want to slide towards new mass, not jump
    nextEffectiveMass = lerp(nextEffectiveMass, targetEffectiveMass, smoothFactor);


    // 4. Constraint Solver (Torque-based Stick-Slip v3.0)
    
    const rpmDiff = rpm - transmissionInputRPM;
    let nextRPM = rpm;
    let driveForce = 0;
    let effectiveLongitudinalMass = 0;
    let isLocked = state.isClutchLocked;
    const idleTarget = config.engine.idleRPM;

    // Load estimation (Simplified: Load reflected to Engine Shaft)
    // T_load approx = T_wheels / Ratio. 
    // But we don't know T_wheels fully yet (depends on chassis).
    // Strategy: Evaluate torque demand.
    // T_demand_static = |T_engine| (The torque engine wants to push)
    // For proper lock breaking, we need: T_engine - T_load_inertial.
    // Here we use a simplified heuristic:
    // Can the clutch hold the current Net Torque from Engine? 
    // + Inertial shock if RPMs are different.
    
    // Force Unlock conditions
    if (gear === 0 || clutchEngagement < 0.05) {
        isLocked = false;
    } else {
        // Hysteresis factors
        const h = config.transmission.clutchHysteresis || 0.1;

        if (isLocked) {
            // BREAK LOCK CONDITION
            // If the torque required to accelerate the car + engine exceeds clutch capacity
            // Simplified: If Engine Torque exceeds Capacity significantly
            const torqueOverload = Math.abs(engineTorque) > clutchCapacity * (1.0 + h);
            
            // v3.1 Logic Update: Anti-Lug / Anti-Stall
            // If RPM is significantly below idle (e.g. < 60% idle), break lock to allow slip recovery.
            // This prevents the engine from being mechanically dragged to a stall by slow wheels.
            const rpmTooLow = rpm < (idleTarget * 0.6);

            if (torqueOverload || rpmTooLow) {
                isLocked = false;
            }
        } else {
            // ENTER LOCK CONDITION
            // 1. Torque is manageable
            // 2. RPMs are close (Gatekeeper)
            const torqueOk = Math.abs(engineTorque) < clutchCapacity * (1.0 - h);
            const rpmDiffOk = Math.abs(rpmDiff) < 200; // Gatekeeper threshold
            
            // v3.1 Logic Update: Healthy RPM Check
            // Only enter lock if engine is in a healthy operating range (e.g. > 90% idle).
            // This prevents "locking into a stall" during launch where RPMs might cross paths at 400rpm.
            const rpmHealthy = rpm > (idleTarget * 0.9);

            if (torqueOk && rpmDiffOk && rpmHealthy) {
                isLocked = true;
            }
        }
    }

    // Special case: Gear Change Detection logic is external (in inputSystem or GameCanvas), 
    // but here we can force slip if effective mass is transitioning rapidly? 
    // No, rely on state passed in.

    if (gear === 0 || clutchEngagement < 0.01) {
        // --- DISCONNECTED ---
        const alpha = engineTorque / config.engine.inertia;
        nextRPM += alpha * RAD_TO_RPM * dt;
        driveForce = 0;
        effectiveLongitudinalMass = 0;
        isLocked = false;
    } else if (isLocked) {
        // --- LOCKED (STICK) ---
        effectiveLongitudinalMass = nextEffectiveMass; // Use smoothed mass
        
        // Drive force is combustion torque converted
        driveForce = (engineTorque * gearRatio) / wheelRadius;
        
        // Sync RPM
        nextRPM = transmissionInputRPM; 
    } else {
        // --- SLIPPING (SLIP) ---
        const slipSign = Math.sign(rpm - transmissionInputRPM);
        
        // Kinetic friction (Capacity)
        const transmittedTorque = clutchCapacity * slipSign;
        
        // Engine dynamics: T_net - T_load
        const alpha = (engineTorque - transmittedTorque) / config.engine.inertia;
        nextRPM += alpha * RAD_TO_RPM * dt;
        
        // Force on wheels
        driveForce = (transmittedTorque * gearRatio) / wheelRadius;
        effectiveLongitudinalMass = 0;
    }

    nextRPM = Math.max(0, nextRPM);

    // 5. Stall Logic
    let nextStalled = stalled;
    let nextEngineOn = engineOn;
    
    // If locked and RPM drops too low, stall
    // v3.0: Make stall threshold configurable or lower
    if (engineOn && !stalled && nextRPM < 300 && isLocked) {
        nextStalled = true;
        nextEngineOn = false;
    }

    const brakes = calculateBrakeTorques(brakeInput, config.brakes);

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
