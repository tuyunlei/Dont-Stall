
import { ControlsConfig } from '../config/types';
import { PhysicsState, InputState } from './types';
import { interpolateTable, clamp, exponentialDecay } from '../utils/math';

// Helper: Linearly move current towards target by maxDelta
const moveTowards = (current: number, target: number, maxDelta: number) => {
    if (Math.abs(target - current) <= maxDelta) return target;
    return current + Math.sign(target - current) * maxDelta;
};

export const processInputs = (
    currentState: PhysicsState,
    config: ControlsConfig, 
    inputs: InputState,
    dt: number,
    currentSpeed: number 
): PhysicsState => {
    const newState = { ...currentState };

    // 1. Clutch
    // Priority: Analog -> Digital -> 0.0
    let clutchTarget = 0.0;
    if (inputs.clutchAnalog !== undefined) {
        clutchTarget = clamp(inputs.clutchAnalog, 0, 1);
    } else {
        clutchTarget = inputs.clutch ? 1.0 : 0.0;
    }
    newState.clutchPosition = exponentialDecay(newState.clutchPosition, clutchTarget, config.clutchTau, dt);

    // 2. Throttle
    let throttleTarget = 0.0;
    if (inputs.throttleAnalog !== undefined) {
        throttleTarget = clamp(inputs.throttleAnalog, 0, 1);
    } else {
        throttleTarget = inputs.throttle ? 1.0 : 0.0;
    }
    newState.throttleInput = exponentialDecay(newState.throttleInput, throttleTarget, config.throttleTau, dt);

    // 3. Brake
    let brakeTarget = 0.0;
    if (inputs.brakeAnalog !== undefined) {
        brakeTarget = clamp(inputs.brakeAnalog, 0, 1);
    } else {
        brakeTarget = inputs.brake ? 1.0 : 0.0;
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
    }

    const effectiveTau = steerTarget === 0 ? config.steeringReturnTau : currentSteerTau;
    const MAX_WHEEL_ANGLE = 540; 
    
    const targetAngle = steerTarget * MAX_WHEEL_ANGLE;
    newState.steeringWheelAngle = exponentialDecay(newState.steeringWheelAngle, targetAngle, effectiveTau, dt);

    return newState;
};
