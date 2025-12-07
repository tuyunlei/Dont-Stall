
import { PhysicsState, InputState, StoppingState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { EnvironmentConfig, MapObject } from '../types';
import { updatePhysics } from '../../physics/physicsEngine';
import { checkCollisions, CollisionResult } from '../collision';
import { TriggerState } from './InputSystem';
import { GameLoopCallbacks } from '../GameLoop';

export class PhysicsSystem {
    
    public update(
        state: PhysicsState, 
        config: CarConfig, 
        inputs: InputState, 
        env: EnvironmentConfig, 
        dt: number
    ): PhysicsState {
        return updatePhysics(state, config, inputs, env, dt);
    }

    public checkCollisions(state: PhysicsState, objects: MapObject[]): CollisionResult {
        return checkCollisions(state, objects);
    }

    /**
     * Handles non-continuous vehicle logic like shifting, engine toggle, reset.
     * Mutates state directly for these discrete events.
     */
    public handleVehicleLogic(
        state: PhysicsState, 
        triggers: TriggerState, 
        config: CarConfig, 
        startPos: { x: number, y: number },
        startHeading: number,
        callbacks: GameLoopCallbacks
    ) {
        const isC1 = config.drivetrainMode === 'C1_TRAINER';

        // 1. Engine Toggle
        if (triggers.toggleEngine) {
            if (!state.engineOn) {
                if (isC1) {
                    state.starterActive = !state.starterActive;
                    state.stalled = false; 
                } else {
                    state.engineOn = true;
                    state.stalled = false;
                    state.rpm = config.engine.idleRPM;
                    state.idleIntegral = 0;
                    callbacks.onMessage('msg.engine_on');
                }
            } else {
                state.engineOn = false;
                state.starterActive = false;
                callbacks.onMessage('msg.engine_off');
            }
        }
        
        // 2. Reset
        if (triggers.reset) {
            state.position = { ...startPos };
            state.heading = startHeading;
            state.velocity = { x: 0, y: 0 };
            state.localVelocity = { x: 0, y: 0 };
            state.rpm = 0;
            state.gear = 0;
            state.engineOn = false;
            state.stalled = false;
            state.starterActive = false;
            state.stoppingState = StoppingState.MOVING;
            
            // Reset Virtual Pedals
            state.virtualThrottle = 0;
            state.virtualBrake = 0;
            state.virtualClutch = 0;
            state.virtualSteering = 0;

            state.handbrakeInput = 1.0;
            state.handbrakePulled = true;

            callbacks.onMessage('msg.reset');
        }

        // 3. Shifting
        if (triggers.shiftUp) {
            if (state.clutchPosition > 0.5) {
                const nextGear = state.gear + 1;
                if (nextGear < config.transmission.gearRatios.length) state.gear = nextGear;
            } else {
                callbacks.onMessage('msg.clutch_warn');
            }
        }

        if (triggers.shiftDown) {
            if (state.clutchPosition > 0.5) {
                const prevGear = state.gear - 1;
                // Reverse Block
                if (isC1 && prevGear === -1) {
                    const fwdSpeed = state.localVelocity.x;
                    if (fwdSpeed > 2.0) {
                        callbacks.onMessage('msg.reverse_block');
                        return;
                    }
                }
                if (prevGear >= -1) state.gear = prevGear;
            } else {
                callbacks.onMessage('msg.clutch_warn');
            }
        }
    }

    public handleCollisionConsequences(state: PhysicsState) {
        state.velocity = { x: -state.velocity.x * 0.5, y: -state.velocity.y * 0.5 };
        state.localVelocity = { x: 0, y: 0 };
        state.engineOn = false;
        state.stalled = true;
    }
}
