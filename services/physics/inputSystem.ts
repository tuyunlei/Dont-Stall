
import { ControlsConfig, PhysicsState } from '../../types';
import { interpolateTable } from '../../utils/math';

export interface InputState {
    throttle: boolean;
    brake: boolean;
    left: boolean;
    right: boolean;
    clutch: boolean;
}

// Helper: First-order lag (Exponential smoothing)
// Returns new value
const smoothInput = (current: number, target: number, tau: number, dt: number): number => {
    // Prevent div by zero
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

    // 1. Clutch (First order lag)
    const clutchTarget = inputs.clutch ? 1.0 : 0.0;
    newState.clutchPosition = smoothInput(newState.clutchPosition, clutchTarget, config.clutchTau, dt);

    // 2. Throttle & Brake
    const throttleTarget = inputs.throttle ? 1.0 : 0.0;
    newState.throttleInput = smoothInput(newState.throttleInput, throttleTarget, config.throttleTau, dt);

    const brakeTarget = inputs.brake ? 1.0 : 0.0;
    newState.brakeInput = smoothInput(newState.brakeInput, brakeTarget, config.brakeTau, dt);

    // Deadzones
    if (Math.abs(newState.throttleInput) < 0.01) newState.throttleInput = 0;
    if (Math.abs(newState.brakeInput) < 0.01) newState.brakeInput = 0;

    // 3. Steering
    // Use data-driven curve for steering response time
    // table: {speed, tau}
    // We convert speed to positive for lookup
    const absSpeed = Math.abs(currentSpeed);
    
    // Map table for interpolateTable (expects x, y)
    const steeringTable = config.steeringCurve.map(p => ({ x: p.speed, y: p.tau }));
    const currentSteerTau = interpolateTable(steeringTable, absSpeed);

    let steerTarget = 0;
    if (inputs.left) steerTarget -= 1.0; 
    if (inputs.right) steerTarget += 1.0;

    // If no input, use return tau, otherwise use active tau from curve
    const effectiveTau = steerTarget === 0 ? config.steeringReturnTau : currentSteerTau;

    // Target is max degrees (e.g. 540). 
    // We update steeringWheelAngle directly.
    // NOTE: Max steering angle is conceptually part of Chassis, but inputs drive the "Request".
    // We assume 1.0 normalized input maps to Chassis Max Angle.
    // However, processInputs doesn't have ChassisConfig here. 
    // We will assume 540 as a fallback or preserve ratio if we want, 
    // but cleaner is to just smooth normalized input and let Chassis map to Angle.
    // BUT: The UI displays steeringWheelAngle.
    
    // Let's stick to the current convention: 
    // We smooth the angle towards +/- 540 (or whatever max is). 
    // Ideally pass maxAngle in arguments, but for now we assume 540 or just update `steeringWheelAngle` 
    // and assume the consumer knows the limit.
    const MAX_WHEEL_ANGLE = 540; 
    const targetAngle = steerTarget * MAX_WHEEL_ANGLE;
    
    newState.steeringWheelAngle = smoothInput(newState.steeringWheelAngle, targetAngle, effectiveTau, dt);

    return newState;
};
