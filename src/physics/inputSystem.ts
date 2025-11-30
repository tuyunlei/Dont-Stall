
import { ControlsConfig } from '../config/types';
import { PhysicsState, InputState } from './types';
import { interpolateTable, clamp } from '../utils/math';

// Helper: First-order lag
const smoothInput = (current: number, target: number, tau: number, dt: number): number => {
    if (tau <= 0.001) return target;
    const alpha = 1.0 - Math.exp(-dt / tau);
    return current + (target - current) * alpha;
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
    newState.clutchPosition = smoothInput(newState.clutchPosition, clutchTarget, config.clutchTau, dt);

    // 2. Throttle
    let throttleTarget = 0.0;
    if (inputs.throttleAnalog !== undefined) {
        throttleTarget = clamp(inputs.throttleAnalog, 0, 1);
    } else {
        throttleTarget = inputs.throttle ? 1.0 : 0.0;
    }
    newState.throttleInput = smoothInput(newState.throttleInput, throttleTarget, config.throttleTau, dt);

    // 3. Brake
    let brakeTarget = 0.0;
    if (inputs.brakeAnalog !== undefined) {
        brakeTarget = clamp(inputs.brakeAnalog, 0, 1);
    } else {
        brakeTarget = inputs.brake ? 1.0 : 0.0;
    }
    newState.brakeInput = smoothInput(newState.brakeInput, brakeTarget, config.brakeTau, dt);

    // 4. Handbrake
    let handbrakeTarget = 0.0;
    if (inputs.handbrakeAnalog !== undefined) {
        handbrakeTarget = clamp(inputs.handbrakeAnalog, 0, 1);
    } else {
        handbrakeTarget = inputs.handbrake ? 1.0 : 0.0;
    }
    const handbrakeTau = config.handbrakeTau ?? config.brakeTau;
    newState.handbrakeInput = smoothInput(newState.handbrakeInput, handbrakeTarget, handbrakeTau, dt);

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
    newState.steeringWheelAngle = smoothInput(newState.steeringWheelAngle, targetAngle, effectiveTau, dt);

    return newState;
};