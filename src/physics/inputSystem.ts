
import { ControlsConfig } from '../config/types';
import { PhysicsState, InputState } from './types';
import { interpolateTable, clamp, exponentialDecay } from '../utils/math';

// Helper: Linearly move current towards target by maxDelta
const moveTowards = (current: number, target: number, maxDelta: number) => {
    if (Math.abs(target - current) <= maxDelta) return target;
    return current + Math.sign(target - current) * maxDelta;
};

// Virtual Pedal Rate (Units per second)
// 2.0 = 0.5 seconds full travel (Fast adjustment, as requested)
const VIRTUAL_STEP_RATE = 2.0; 

const updateVirtualPedal = (
    currentValue: number,
    inc: boolean,
    dec: boolean,
    setFull: boolean | undefined,
    setZero: boolean | undefined,
    dt: number
): number => {
    // 1. Double-Tap Shortcuts (Instant)
    if (setFull) return 1.0;
    if (setZero) return 0.0;

    // 2. Incremental Adjustment
    let delta = 0;
    if (inc) delta += VIRTUAL_STEP_RATE * dt;
    if (dec) delta -= VIRTUAL_STEP_RATE * dt;
    
    return clamp(currentValue + delta, 0, 1);
};

const updateVirtualSteering = (
    currentValue: number,
    left: boolean,
    right: boolean,
    setFullLeft: boolean | undefined,
    setFullRight: boolean | undefined,
    dt: number
): number => {
    if (setFullLeft) return -1.0;
    if (setFullRight) return 1.0;

    let delta = 0;
    if (left) delta -= VIRTUAL_STEP_RATE * dt;
    if (right) delta += VIRTUAL_STEP_RATE * dt;

    return clamp(currentValue + delta, -1, 1);
};

export const processInputs = (
    currentState: PhysicsState,
    config: ControlsConfig, 
    maxSteeringWheelAngle: number,
    inputs: InputState,
    dt: number,
    currentSpeed: number 
): PhysicsState => {
    const newState = { ...currentState };

    // Initialize virtuals if undefined (safety)
    if (newState.virtualThrottle === undefined) newState.virtualThrottle = 0;
    if (newState.virtualBrake === undefined) newState.virtualBrake = 0;
    if (newState.virtualClutch === undefined) newState.virtualClutch = 0;
    if (newState.virtualSteering === undefined) newState.virtualSteering = 0;

    // --- 1. Update Virtual Pedals (Accumulators) ---
    // Handle Double-Tap Shortcuts and Incremental keys
    newState.virtualThrottle = updateVirtualPedal(
        newState.virtualThrottle, 
        inputs.throttleInc, 
        inputs.throttleDec, 
        inputs.setVirtualThrottleFull,
        inputs.setVirtualThrottleZero,
        dt
    );
    newState.virtualBrake = updateVirtualPedal(
        newState.virtualBrake, 
        inputs.brakeInc, 
        inputs.brakeDec, 
        inputs.setVirtualBrakeFull,
        inputs.setVirtualBrakeZero,
        dt
    );
    newState.virtualClutch = updateVirtualPedal(
        newState.virtualClutch, 
        inputs.clutchInc, 
        inputs.clutchDec, 
        inputs.setVirtualClutchFull,
        inputs.setVirtualClutchZero,
        dt
    );

    // Update Virtual Steering Accumulator
    // IMPORTANT: If main digital steering keys are pressed, we reset the fine tune
    if (inputs.left || inputs.right) {
        newState.virtualSteering = 0;
    } else {
        newState.virtualSteering = updateVirtualSteering(
            newState.virtualSteering,
            inputs.steerLeftInc,
            inputs.steerRightInc,
            inputs.setVirtualSteeringLeftFull,
            inputs.setVirtualSteeringRightFull,
            dt
        );
    }

    // --- 2. Resolve Targets (Priority: Analog > Digital Full > Virtual) ---

    // THROTTLE
    let throttleTarget = 0.0;
    if (inputs.throttleAnalog !== undefined) {
        throttleTarget = clamp(inputs.throttleAnalog, 0, 1);
    } else if (inputs.throttle) {
        // Digital "Floor it" overrides virtual
        throttleTarget = 1.0; 
        // User Request: Reset virtual throttle so release returns to 0 (no memory)
        newState.virtualThrottle = 0;
    } else {
        // Fallback to virtual accumulator
        throttleTarget = newState.virtualThrottle;
    }
    newState.throttleInput = exponentialDecay(newState.throttleInput, throttleTarget, config.throttleTau, dt);

    // CLUTCH
    let clutchTarget = 0.0;
    if (inputs.clutchAnalog !== undefined) {
        clutchTarget = clamp(inputs.clutchAnalog, 0, 1);
    } else if (inputs.clutch) {
        clutchTarget = 1.0;
        // Note: We intentionally do NOT reset virtual clutch here.
        // It's useful to keep bite point setting after a full shift.
    } else {
        clutchTarget = newState.virtualClutch;
    }
    newState.clutchPosition = exponentialDecay(newState.clutchPosition, clutchTarget, config.clutchTau, dt);

    // BRAKE
    let brakeTarget = 0.0;
    if (inputs.brakeAnalog !== undefined) {
        brakeTarget = clamp(inputs.brakeAnalog, 0, 1);
    } else if (inputs.brake) {
        brakeTarget = 1.0;
    } else {
        brakeTarget = newState.virtualBrake;
    }
    newState.brakeInput = exponentialDecay(newState.brakeInput, brakeTarget, config.brakeTau, dt);

    // 4. Handbrake (Mode Dependent)
    if (config.handbrakeMode === 'RATCHET') {
        // Toggle logic based on one-shot trigger
        if (inputs.toggleHandbrake) {
            newState.handbrakePulled = !newState.handbrakePulled;
        }

        // Target: 1.0 if pulled, 0.0 if released
        const ratchetTarget = newState.handbrakePulled ? 1.0 : 0.0;
        
        // Linear movement to simulate physical lever travel time
        const speed = config.handbrakeRatchetSpeed || 3.0;
        const maxDelta = speed * dt;
        newState.handbrakeInput = moveTowards(newState.handbrakeInput, ratchetTarget, maxDelta);

    } else {
        // LINEAR Mode (Racing/Drift Style) - Hold to brake
        let handbrakeTarget = 0.0;
        if (inputs.handbrakeAnalog !== undefined) {
            handbrakeTarget = clamp(inputs.handbrakeAnalog, 0, 1);
        } else {
            handbrakeTarget = inputs.handbrake ? 1.0 : 0.0;
        }
        
        const handbrakeTau = config.handbrakeTau ?? config.brakeTau;
        newState.handbrakeInput = exponentialDecay(newState.handbrakeInput, handbrakeTarget, handbrakeTau, dt);
        
        // Update logical state for UI visualization
        newState.handbrakePulled = newState.handbrakeInput > 0.1;
    }

    // 5. Steering
    const absSpeed = Math.abs(currentSpeed);
    const steeringTable = config.steeringCurve.map(p => ({ x: p.speed, y: p.tau }));
    const currentSteerTau = interpolateTable(steeringTable, absSpeed);

    let steerTarget = 0; // -1.0 to 1.0
    
    if (inputs.steeringAnalog !== undefined) {
        steerTarget = clamp(inputs.steeringAnalog, -1, 1);
    } else {
        if (inputs.left) steerTarget -= 1.0; 
        if (inputs.right) steerTarget += 1.0;
        
        // If digital steering is NOT engaged, use virtual steering
        if (!inputs.left && !inputs.right) {
            steerTarget = newState.virtualSteering;
        }
    }

    const effectiveTau = steerTarget === 0 ? config.steeringReturnTau : currentSteerTau;
    const MAX_WHEEL_ANGLE = maxSteeringWheelAngle; 
    
    const targetAngle = steerTarget * MAX_WHEEL_ANGLE;
    newState.steeringWheelAngle = exponentialDecay(newState.steeringWheelAngle, targetAngle, effectiveTau, dt);

    return newState;
};
