
import { PhysicsState, StoppingState, Vector2 } from './types';

export const createInitialState = (startPos: Vector2, startHeading: number): PhysicsState => {
    return {
        // Pose
        position: { ...startPos },
        velocity: { x: 0, y: 0 },
        localVelocity: { x: 0, y: 0 },
        heading: startHeading,
        angularVelocity: 0,

        // Dynamics History
        lastAx: 0,
        lastAy: 0,
        stoppingState: StoppingState.MOVING,
        stopTimer: 0,

        // Input State
        throttleInput: 0,
        brakeInput: 0,
        clutchPosition: 0,
        handbrakeInput: 1.0,   // Default to engaged
        handbrakePulled: true, // Default to pulled state
        steeringWheelAngle: 0,
        steerAngle: 0,

        // Virtual Pedals (Accumulators)
        virtualThrottle: 0,
        virtualBrake: 0,
        virtualClutch: 0,
        virtualSteering: 0,

        // Powertrain State
        rpm: 0,
        gear: 0,
        engineOn: false,
        stalled: false,
        starterActive: false,
        isClutchLocked: false,
        currentEffectiveMass: 0,

        // Internal State
        idleIntegral: 0,
        lastRpm: 0,

        // Derived
        speedKmh: 0
    };
};
