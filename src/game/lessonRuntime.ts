
import { 
    LessonDefinition, 
    ObjectiveDefinition, 
    ConditionDefinition,
    LessonResult,
    ScoringDefinition
} from './lessonTypes';
import { TelemetrySnapshot } from './telemetry';
import { GameEvent } from './events';
import { evaluateCondition } from './conditionEvaluator';
import { SCORING_CONSTANTS } from './constants';

export type LessonRuntimeStatus = 'idle' | 'running' | 'success' | 'failed';
export type ObjectiveStatus = 'pending' | 'completed';

export interface ObjectiveRuntimeState {
    id: string;
    status: ObjectiveStatus;
    currentHoldMs: number; // 当前连续满足的时长
}

export interface HintRuntimeState {
    id: string;
    currentHoldMs: number;
    hasTriggered: boolean;
}

export interface FailureMetadata {
    score?: number;
    passingScore?: number;
    elapsedMs?: number;
    [key: string]: string | number | boolean | undefined;
}

export interface LessonRuntimeState {
    status: LessonRuntimeStatus;
    elapsedMs: number;
    objectives: Map<string, ObjectiveRuntimeState>;
    result?: LessonResult; // 仅在 Success/Failed 后存在
    failureReason?: {
        code: string; 
        description?: string;
        meta?: FailureMetadata;
    };
    // 实时统计供 UI 显示
    stats: {
        stallCount: number;
        collisionCount: number;
    };
    activeHint?: string; // 当前显示的提示 Key
}

export interface LessonCallbacks {
    onLessonSuccess: (result: LessonResult) => void;
    onLessonFailed: (reason: string) => void;
    onObjectiveCompleted: (objectiveId: string) => void;
    onHintTriggered: (messageKey: string) => void;
}

export class LessonRuntime {
    private lesson: LessonDefinition;
    private callbacks: LessonCallbacks;
    
    private status: LessonRuntimeStatus = 'idle';
    private elapsedMs: number = 0;
    
    // Stats tracking
    private stallCount: number = 0;
    private collisionCount: number = 0;
    private wasStalled: boolean = false; // Edge detection for stall
    
    // Map<ObjectiveID, State>
    private objectiveStates: Map<string, ObjectiveRuntimeState> = new Map();
    private hintStates: Map<string, HintRuntimeState> = new Map();
    
    private finalResult?: LessonResult;
    private failureReason?: { code: string; description?: string; meta?: FailureMetadata };

    constructor(lesson: LessonDefinition, callbacks: LessonCallbacks) {
        this.lesson = lesson;
        this.callbacks = callbacks;
        this.reset();
    }

    public start() {
        this.reset();
        this.status = 'running';
    }

    public stop() {
        if (this.status === 'running') {
            this.status = 'idle'; 
        }
    }

    private reset() {
        this.status = 'idle';
        this.elapsedMs = 0;
        this.stallCount = 0;
        this.collisionCount = 0;
        this.wasStalled = false;
        this.finalResult = undefined;
        this.failureReason = undefined;

        this.objectiveStates.clear();
        this.lesson.objectives.forEach(obj => {
            this.objectiveStates.set(obj.id, {
                id: obj.id,
                status: 'pending',
                currentHoldMs: 0
            });
        });

        this.hintStates.clear();
        if (this.lesson.hints) {
            this.lesson.hints.forEach(h => {
                this.hintStates.set(h.id, {
                    id: h.id,
                    currentHoldMs: 0,
                    hasTriggered: false
                });
            });
        }
    }

    public update(dt: number, telemetry: TelemetrySnapshot, events: GameEvent[] = []) {
        if (this.status !== 'running') return;

        const dtMs = dt * 1000;
        this.elapsedMs += dtMs;

        // 0. Update Statistics
        // Stall detection (Rising Edge)
        if (telemetry.stalled && !this.wasStalled) {
            this.stallCount++;
        }
        this.wasStalled = telemetry.stalled;

        // Collision detection (Count events)
        const collisionsInFrame = events.filter(e => e.type === 'COLLISION').length;
        if (collisionsInFrame > 0) {
            this.collisionCount += collisionsInFrame; 
        }

        // 1. Check Failure Conditions (Priority High)
        for (const failCond of this.lesson.failConditions) {
            if (evaluateCondition(failCond, telemetry, events)) {
                this.failLesson('condition_violated'); 
                return;
            }
        }

        // 2. Check Objectives
        let requiredObjectivesDone = true;

        this.lesson.objectives.forEach(obj => {
            const state = this.objectiveStates.get(obj.id);
            if (!state) return;
            
            // Skip if already done
            if (state.status === 'completed') return;

            // Evaluate
            const isMet = evaluateCondition(obj.condition, telemetry, events);
            
            if (isMet) {
                state.currentHoldMs += dtMs;
            } else {
                state.currentHoldMs = 0; // Reset hold timer if condition breaks
            }

            // Check completion (Hold time or instant)
            const requiredHold = obj.mustHoldForMs || 0;
            if (isMet && state.currentHoldMs >= requiredHold) {
                state.status = 'completed';
                this.callbacks.onObjectiveCompleted(obj.id);
            }

            // Check if this is a required objective and it's NOT done
            if (obj.required && state.status !== 'completed') {
                requiredObjectivesDone = false;
            }
        });

        // 3. Check Hints
        if (this.lesson.hints) {
            this.lesson.hints.forEach(hint => {
                const hState = this.hintStates.get(hint.id);
                if (!hState) return;
                
                // If 'once' is true and already triggered, skip
                if (hint.once && hState.hasTriggered) return;

                const isMet = evaluateCondition(hint.trigger, telemetry, events);
                if (isMet) {
                    hState.currentHoldMs += dtMs;
                    // Trigger if hold time exceeded AND not currently triggered (debounce/latch)
                    if (hState.currentHoldMs >= hint.delayMs && !hState.hasTriggered) {
                         this.callbacks.onHintTriggered(hint.messageKey);
                         hState.hasTriggered = true;
                    }
                } else {
                    hState.currentHoldMs = 0;
                    // If not 'once', reset trigger state so it can fire again next time condition is met
                    if (!hint.once) {
                        hState.hasTriggered = false;
                    }
                }
            });
        }

        // 4. Check Lesson Success Logic
        if (requiredObjectivesDone) {
            // In EXAM mode, we must verify the score meets the requirement
            if (this.lesson.mode === 'EXAM') {
                const currentScore = this.calculateScoreValue();
                const passingScore = this.lesson.scoring?.passingScore ?? 0;
                
                if (currentScore < passingScore) {
                    this.failLesson('score_too_low', { score: currentScore, passingScore });
                    return;
                }
            }
            this.succeedLesson();
        }
    }

    private calculateScoreValue(): number {
        const cfg: ScoringDefinition = this.lesson.scoring || { baseScore: 100 };
        
        let score = cfg.baseScore;
        const minScore = cfg.minScore ?? 0;

        // Stall Penalty
        if (cfg.stallPenalty) {
            score -= this.stallCount * cfg.stallPenalty;
        }

        // Collision Penalty
        if (cfg.collisionPenalty) {
            score -= this.collisionCount * cfg.collisionPenalty;
        }

        // Time Penalty
        if (cfg.timePenaltyPerSecond) {
            const benchmark = (cfg.benchmarkTimeSeconds ?? 0) * 1000;
            if (this.elapsedMs > benchmark) {
                const overtimeSec = (this.elapsedMs - benchmark) / 1000;
                score -= overtimeSec * cfg.timePenaltyPerSecond;
            }
        }

        return Math.max(minScore, Math.round(score));
    }

    private calculateScoreResult(): LessonResult {
        const score = this.calculateScoreValue();

        // Grade Calculation
        let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'C';
        if (score >= SCORING_CONSTANTS.GRADE_S_THRESHOLD) grade = 'S';
        else if (score >= SCORING_CONSTANTS.GRADE_A_THRESHOLD) grade = 'A';
        else if (score >= SCORING_CONSTANTS.GRADE_B_THRESHOLD) grade = 'B';
        else if (score >= SCORING_CONSTANTS.GRADE_C_THRESHOLD) grade = 'C';
        else grade = 'D';

        return {
            lessonId: this.lesson.id,
            score,
            grade,
            elapsedMs: this.elapsedMs,
            stallCount: this.stallCount,
            collisionCount: this.collisionCount,
            passed: true
        };
    }

    private failLesson(code: string, meta?: FailureMetadata) {
        this.status = 'failed';
        this.failureReason = { code, meta };
        
        // Calculate a result for failure state too, to show score on fail screen if needed
        const result = this.calculateScoreResult();
        result.passed = false;
        this.finalResult = result;

        this.callbacks.onLessonFailed(code);
    }

    private succeedLesson() {
        this.status = 'success';
        this.finalResult = this.calculateScoreResult();
        this.finalResult.passed = true;
        this.callbacks.onLessonSuccess(this.finalResult);
    }

    // --- Public Getters for UI ---

    public getState(): LessonRuntimeState {
        return {
            status: this.status,
            elapsedMs: this.elapsedMs,
            objectives: new Map(this.objectiveStates),
            result: this.finalResult,
            failureReason: this.failureReason,
            stats: {
                stallCount: this.stallCount,
                collisionCount: this.collisionCount
            }
        };
    }

    public getObjectiveState(id: string): ObjectiveRuntimeState | undefined {
        return this.objectiveStates.get(id);
    }
}
