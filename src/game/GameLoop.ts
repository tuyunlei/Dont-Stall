
import { PhysicsState, InputState } from '../physics/types';
import { CarConfig } from '../config/types';
import { LevelData } from './types';
import { TelemetrySnapshot } from './telemetry';
import { LessonRuntime, LessonRuntimeState } from './lessonRuntime';
import { GameEvent } from './events';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { InputSystem, TriggerState } from './systems/InputSystem';

export interface GameLoopCallbacks {
    onTick: (state: PhysicsState) => void;
    onMessage: (msg: string) => void;
}

export interface GameLoopDeps {
    getLevel: () => LevelData;
    getConfig: () => CarConfig;
    getInputs: () => InputState;
    getTriggers: () => TriggerState;
    callbacks: GameLoopCallbacks;
}

export class GameLoop {
    private rafId: number = 0;
    private isRunning: boolean = false;
    private state: PhysicsState;
    private deps: GameLoopDeps;
    
    // Systems
    private physicsSystem: PhysicsSystem;
    private inputSystem: InputSystem;
    private currentLessonRuntime?: LessonRuntime;
    
    // Time management
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly FIXED_DT = 0.016; // 60hz physics fixed step
    
    // Telemetry
    private currentTelemetry: TelemetrySnapshot | null = null;
    private sessionStartTime: number = 0;

    constructor(initialState: PhysicsState, deps: GameLoopDeps) {
        this.state = JSON.parse(JSON.stringify(initialState));
        this.deps = deps;
        
        // Initialize Systems
        this.physicsSystem = new PhysicsSystem();
        this.inputSystem = new InputSystem();
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

    public attachLessonRuntime(runtime: LessonRuntime) {
        this.currentLessonRuntime = runtime;
    }

    public detachLessonRuntime() {
        this.currentLessonRuntime = undefined;
    }

    public getLessonRuntimeState(): LessonRuntimeState | undefined {
        return this.currentLessonRuntime?.getState();
    }

    private loop = (timestamp: number) => {
        if (!this.isRunning) return;

        let deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (deltaTime > 0.25) deltaTime = 0.25;

        this.accumulator += deltaTime;

        while (this.accumulator >= this.FIXED_DT) {
            this.tick(this.FIXED_DT);
            this.accumulator -= this.FIXED_DT;
        }
        
        this.deps.callbacks.onTick(this.state);
        
        this.rafId = requestAnimationFrame(this.loop);
    }

    private tick(dt: number) {
        const config = this.deps.getConfig();
        const level = this.deps.getLevel();
        const rawInputs = this.deps.getInputs();
        const triggers = this.deps.getTriggers();
        
        // 1. Input System
        const inputs = this.inputSystem.mergeInputs(rawInputs, triggers);
        
        // 2. Physics System (Vehicle Logic)
        this.physicsSystem.handleVehicleLogic(
            this.state, 
            triggers, 
            config, 
            level.startPos, 
            level.startHeading, 
            this.deps.callbacks
        );

        // 3. Physics System (Simulation)
        const env = level.environment || { gravity: 9.81, slope: 0 };
        this.state = this.physicsSystem.update(this.state, config, inputs, env, dt);

        // 4. Physics System (Collisions)
        const { collision, inTargetZone } = this.physicsSystem.checkCollisions(this.state, level.objects);
        const events: GameEvent[] = [];
        
        if (collision) {
            this.physicsSystem.handleCollisionConsequences(this.state);
            events.push({ type: 'COLLISION', timestamp: performance.now() });
        }
        
        // 5. Telemetry Generation
        this.updateTelemetry(collision, inTargetZone);

        // 6. Lesson System
        if (this.currentLessonRuntime && this.currentTelemetry) {
            this.currentLessonRuntime.update(dt, this.currentTelemetry, events);
        }
    }

    private updateTelemetry(collision: boolean, inTargetZone: boolean) {
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
    }
}
