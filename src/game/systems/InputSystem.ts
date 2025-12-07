
import { InputState, PhysicsState } from '../../physics/types';

export interface TriggerState {
    toggleEngine: boolean; 
    shiftUp: boolean; 
    shiftDown: boolean; 
    reset: boolean; 
    toggleHandbrake: boolean;
    
    // Virtual Pedal Shortcuts
    setVirtualThrottleFull: boolean;
    setVirtualThrottleZero: boolean;
    setVirtualBrakeFull: boolean;
    setVirtualBrakeZero: boolean;
    setVirtualClutchFull: boolean;
    setVirtualClutchZero: boolean;
    setVirtualSteeringLeftFull: boolean;
    setVirtualSteeringRightFull: boolean;
}

export class InputSystem {
    /**
     * Merges raw digital/analog inputs with one-shot triggers into a unified InputState.
     */
    public mergeInputs(baseInputs: InputState, triggers: TriggerState): InputState {
        return {
            ...baseInputs,
            toggleHandbrake: triggers.toggleHandbrake,
            setVirtualThrottleFull: triggers.setVirtualThrottleFull,
            setVirtualThrottleZero: triggers.setVirtualThrottleZero,
            setVirtualBrakeFull: triggers.setVirtualBrakeFull,
            setVirtualBrakeZero: triggers.setVirtualBrakeZero,
            setVirtualClutchFull: triggers.setVirtualClutchFull,
            setVirtualClutchZero: triggers.setVirtualClutchZero,
            setVirtualSteeringLeftFull: triggers.setVirtualSteeringLeftFull,
            setVirtualSteeringRightFull: triggers.setVirtualSteeringRightFull
        };
    }

    public getSafetyInputs(): InputState {
        return {
            throttle: false,
            brake: false,
            left: false,
            right: false,
            clutch: false,
            handbrake: true,
            handbrakeAnalog: 1.0,
            throttleAnalog: 0,
            brakeAnalog: 0,
            clutchAnalog: 0
        } as InputState;
    }
}
