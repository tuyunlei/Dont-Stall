
import { PhysicsState, InputState, StoppingState } from '../physics/types';
import { CarConfig } from '../config/types';
import { LevelData } from './types';
import { updatePhysics } from '../physics/physicsEngine';
import { checkCollisions } from './collision';

export interface GameLoopCallbacks {
    onTick: (state: PhysicsState) => void;
    onMessage: (msg: string) => void;
}

export interface GameLoopDeps {
    getLevel: () => LevelData;
    getConfig: () => CarConfig;
    getInputs: () => InputState;
    getTriggers: () => { toggleEngine: boolean; shiftUp: boolean; shiftDown: boolean; reset: boolean; };
    callbacks: GameLoopCallbacks;
}

export class GameLoop {
    private rafId: number = 0;
    private isRunning: boolean = false;
    private state: PhysicsState;
    private deps: GameLoopDeps;

    constructor(initialState: PhysicsState, deps: GameLoopDeps) {
        this.state = JSON.parse(JSON.stringify(initialState));
        this.deps = deps;
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop();
    }

    public stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    public reset(newState: PhysicsState) {
        this.state = JSON.parse(JSON.stringify(newState));
    }

    public getState(): PhysicsState {
        return this.state;
    }

    private loop = () => {
        if (!this.isRunning) return;

        this.tick();
        this.deps.callbacks.onTick(this.state);
        
        this.rafId = requestAnimationFrame(this.loop);
    }

    private tick() {
        const dt = 0.016; // Fixed timestep
        const config = this.deps.getConfig();
        const level = this.deps.getLevel();
        const inputs = this.deps.getInputs();
        const triggers = this.deps.getTriggers();
        
        // Default env
        const env = level.environment || { gravity: 9.81, slope: 0 };
        const isC1 = config.drivetrainMode === 'C1_TRAINER';

        // 1. Handle Triggers (Discrete Events)
        if (triggers.toggleEngine) {
            if (!this.state.engineOn) {
                // START SEQUENCE
                if (isC1) {
                    // C1 Mode: Toggle Starter Motor (Latching button behavior)
                    this.state.starterActive = !this.state.starterActive;
                    this.state.stalled = false; // Clear stall flag when attempting to crank
                } else {
                    // Normal Mode: Instant Magic Start
                    this.state.engineOn = true;
                    this.state.stalled = false;
                    this.state.rpm = config.engine.idleRPM;
                    this.state.idleIntegral = 0;
                    this.deps.callbacks.onMessage('msg.engine_on');
                }
            } else {
                // SHUTDOWN SEQUENCE
                this.state.engineOn = false;
                this.state.starterActive = false;
                this.deps.callbacks.onMessage('msg.engine_off');
            }
        }
        
        if (triggers.reset) {
            this.state.position = { ...level.startPos };
            this.state.heading = level.startHeading;
            this.state.velocity = { x: 0, y: 0 };
            this.state.localVelocity = { x: 0, y: 0 };
            this.state.rpm = 0;
            this.state.gear = 0;
            this.state.engineOn = false;
            this.state.stalled = false;
            this.state.starterActive = false;
            this.state.stoppingState = StoppingState.MOVING;
            this.deps.callbacks.onMessage('msg.reset');
        }

        if (triggers.shiftUp) {
            if (this.state.clutchPosition > 0.5) {
                const nextGear = this.state.gear + 1;
                if (nextGear < config.transmission.gearRatios.length) this.state.gear = nextGear;
            } else {
                this.deps.callbacks.onMessage('msg.clutch_warn');
            }
        }

        if (triggers.shiftDown) {
            if (this.state.clutchPosition > 0.5) {
                const prevGear = this.state.gear - 1;
                
                // REVERSE GEAR PROTECTION (C1 Mode)
                if (isC1 && prevGear === -1) {
                    const fwdSpeed = this.state.localVelocity.x;
                    // Block if moving forward faster than 2 m/s (~7 km/h)
                    if (fwdSpeed > 2.0) {
                        this.deps.callbacks.onMessage('msg.reverse_block');
                        return; // ABORT SHIFT
                    }
                }

                if (prevGear >= -1) this.state.gear = prevGear;
            } else {
                this.deps.callbacks.onMessage('msg.clutch_warn');
            }
        }

        // 2. Physics Update
        this.state = updatePhysics(this.state, config, inputs, env, dt);

        // 3. Collision Check
        const { collision, success } = checkCollisions(this.state, level.objects);
        if (collision) {
            this.state.velocity = { x: -this.state.velocity.x * 0.5, y: -this.state.velocity.y * 0.5 };
            this.state.localVelocity = { x: 0, y: 0 };
            this.state.engineOn = false;
            this.state.stalled = true;
            this.deps.callbacks.onMessage('msg.collision');
        }
        if (success) {
            this.deps.callbacks.onMessage('msg.success');
        }
    }
}
