
import { PhysicsState, InputState, StoppingState } from '../physics/types';
import { CarConfig } from '../config/types';
import { LevelData } from './types';
import { updatePhysics } from '../physics/physicsEngine';
import { checkCollisions } from './collision';
import { TelemetrySnapshot } from './telemetry';
import { LessonRuntime, LessonRuntimeState } from './lessonRuntime';
import { GameEvent } from './events';

export interface GameLoopCallbacks {
    onTick: (state: PhysicsState) => void;
    onMessage: (msg: string) => void;
}

export interface GameLoopDeps {
    getLevel: () => LevelData;
    getConfig: () => CarConfig;
    getInputs: () => InputState;
    getTriggers: () => { 
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
    };
    callbacks: GameLoopCallbacks;
}

export class GameLoop {
    private rafId: number = 0;
    private isRunning: boolean = false;
    private state: PhysicsState;
    private deps: GameLoopDeps;
    
    // Time management
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly FIXED_DT = 0.016; // 60hz physics fixed step
    
    // Telemetry
    private currentTelemetry: TelemetrySnapshot | null = null;
    private sessionStartTime: number = 0;

    // Lesson Runtime (Phase 4 Integration)
    private currentLessonRuntime?: LessonRuntime;

    constructor(initialState: PhysicsState, deps: GameLoopDeps) {
        this.state = JSON.parse(JSON.stringify(initialState));
        this.deps = deps;
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.sessionStartTime = this.lastTime;
        this.accumulator = 0;
        this.loop(this.lastTime);
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
        // Reset time accumulators to prevent huge jumps after reset
        this.accumulator = 0;
        this.lastTime = performance.now();
        this.sessionStartTime = this.lastTime;
        this.currentTelemetry = null;
    }

    public getState(): PhysicsState {
        return this.state;
    }

    public getTelemetry(): TelemetrySnapshot | null {
        return this.currentTelemetry;
    }

    // --- Lesson Runtime Integration ---

    public attachLessonRuntime(runtime: LessonRuntime) {
        this.currentLessonRuntime = runtime;
        // Note: Caller is responsible for calling runtime.start() if needed,
        // or we assume it's ready to go.
    }

    public detachLessonRuntime() {
        this.currentLessonRuntime = undefined;
    }

    public getLessonRuntimeState(): LessonRuntimeState | undefined {
        return this.currentLessonRuntime?.getState();
    }

    // ----------------------------------

    private loop = (timestamp: number) => {
        if (!this.isRunning) return;

        // Calculate real time delta
        let deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Prevent spiral of death (if lag is huge, don't try to simulate too much at once)
        if (deltaTime > 0.25) deltaTime = 0.25;

        this.accumulator += deltaTime;

        // Catch up physics to real time
        while (this.accumulator >= this.FIXED_DT) {
            this.tick(this.FIXED_DT);
            this.accumulator -= this.FIXED_DT;
        }
        
        // Render triggers (passing state for interpolation if needed, but using latest for now)
        this.deps.callbacks.onTick(this.state);
        
        this.rafId = requestAnimationFrame(this.loop);
    }

    private tick(dt: number) {
        const config = this.deps.getConfig();
        const level = this.deps.getLevel();
        const baseInputs = this.deps.getInputs();
        const triggers = this.deps.getTriggers();
        
        // Merge discrete triggers into inputs for physics step
        const inputs: InputState = {
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

        // Default env
        const env = level.environment || { gravity: 9.81, slope: 0 };
        const isC1 = config.drivetrainMode === 'C1_TRAINER';

        // 1. Handle Triggers (Discrete Events)
        if (triggers.toggleEngine) {
            if (!this.state.engineOn) {
                // START SEQUENCE
                if (isC1) {
                    this.state.starterActive = !this.state.starterActive;
                    this.state.stalled = false; 
                } else {
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
            
            // Reset Virtual Pedals
            this.state.virtualThrottle = 0;
            this.state.virtualBrake = 0;
            this.state.virtualClutch = 0;
            this.state.virtualSteering = 0;

            this.state.handbrakeInput = 1.0;
            this.state.handbrakePulled = true;

            this.deps.callbacks.onMessage('msg.reset');
            this.sessionStartTime = performance.now();
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

        // 3. Collision Check & Event Generation
        // We only gather data here. No logic about "winning" or "losing" happens in GameLoop anymore.
        const events: GameEvent[] = [];
        const { collision, inTargetZone } = checkCollisions(this.state, level.objects);
        
        if (collision) {
            // Physics consequence of collision
            this.state.velocity = { x: -this.state.velocity.x * 0.5, y: -this.state.velocity.y * 0.5 };
            this.state.localVelocity = { x: 0, y: 0 };
            this.state.engineOn = false;
            this.state.stalled = true;
            
            // We just emit the event. LessonRuntime (if active) will decide if this fails the lesson.
            events.push({ type: 'COLLISION', timestamp: performance.now() });
        }
        
        // 4. Update Telemetry Snapshot
        this.currentTelemetry = {
            timestamp: performance.now(),
            elapsedTime: performance.now() - this.sessionStartTime,
            speedKmh: this.state.speedKmh,
            engineRpm: this.state.rpm,
            gear: this.state.gear,
            throttleInput: this.state.throttleInput,
            brakeInput: this.state.brakeInput,
            clutchInput: this.state.clutchPosition,
            handbrakeInput: this.state.handbrakeInput,
            steeringAngle: this.state.steeringWheelAngle,
            stalled: this.state.stalled,
            engineOn: this.state.engineOn,
            position: { ...this.state.position },
            heading: this.state.heading,
            isColliding: collision,
            isInTargetZone: inTargetZone
        };

        // 5. Update Lesson Runtime (Sidecar Observer)
        if (this.currentLessonRuntime) {
            this.currentLessonRuntime.update(dt, this.currentTelemetry, events);
        }
    }
}
