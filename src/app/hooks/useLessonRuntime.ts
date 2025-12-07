import { useRef, useState, useCallback, useEffect } from 'react';
import { LessonDefinition, LessonResult } from '../../game/lessonTypes';
import { LessonRuntime, LessonRuntimeState, LessonRuntimeStatus } from '../../game/lessonRuntime';
import { GameLoop } from '../../game/GameLoop';
import { createInitialState } from '../../physics/factory';
import { Vector2 } from '../../physics/types';
import { TIMING_CONSTANTS } from '../constants';

export interface UseLessonRuntimeOptions {
    activeLesson: LessonDefinition | undefined;
    gameLoopRef: React.MutableRefObject<GameLoop | null>;
    startPos: Vector2;
    startHeading: number;
    onLessonFinish?: (lessonId: string, result: 'success' | 'failed') => void;
}

export interface UseLessonRuntimeResult {
    lessonState: LessonRuntimeState | null;
    lessonStatus: LessonRuntimeStatus;
    activeHint: string | null;
    retry: () => void;
}

export function useLessonRuntime(options: UseLessonRuntimeOptions): UseLessonRuntimeResult {
    const { activeLesson, gameLoopRef, startPos, startHeading, onLessonFinish } = options;

    const [lessonState, setLessonState] = useState<LessonRuntimeState | null>(null);
    const [lessonStatus, setLessonStatus] = useState<LessonRuntimeStatus>('idle');
    const [activeHint, setActiveHint] = useState<string | null>(null);
    const hintTimeoutRef = useRef<number | undefined>(undefined);

    // Use ref for callback to avoid dependency changes
    const onLessonFinishRef = useRef(onLessonFinish);
    onLessonFinishRef.current = onLessonFinish;

    const showHint = useCallback((msgKey: string) => {
        setActiveHint(msgKey);
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = window.setTimeout(() => {
            setActiveHint(null);
        }, TIMING_CONSTANTS.HINT_DISPLAY_DURATION);
    }, []);

    const createRuntime = useCallback((def: LessonDefinition) => {
        return new LessonRuntime(def, {
            onLessonSuccess: (result: LessonResult) => {
                setLessonStatus('success');
                onLessonFinishRef.current?.(def.id, 'success');
            },
            onLessonFailed: () => {
                setLessonStatus('failed');
                onLessonFinishRef.current?.(def.id, 'failed');
            },
            onObjectiveCompleted: () => {},
            onHintTriggered: showHint
        });
    }, [showHint]); // onLessonFinish removed from dependency

    const retry = useCallback(() => {
        if (!gameLoopRef.current || !activeLesson) return;

        const freshState = createInitialState(startPos, startHeading);
        gameLoopRef.current.reset(freshState);

        const runtime = createRuntime(activeLesson);
        gameLoopRef.current.attachLessonRuntime(runtime);
        runtime.start();

        setLessonState(runtime.getState());
        setLessonStatus('running');
        setActiveHint(null);
    }, [activeLesson, gameLoopRef, startPos, startHeading, createRuntime]);

    // Initialize lesson when activeLesson changes
    useEffect(() => {
        if (!activeLesson || !gameLoopRef.current) {
            setLessonStatus('idle');
            return;
        }

        const runtime = createRuntime(activeLesson);
        gameLoopRef.current.attachLessonRuntime(runtime);
        runtime.start();

        setLessonState(runtime.getState());
        setLessonStatus('running');
        setActiveHint(null);

        return () => {
            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        };
    }, [activeLesson, createRuntime, gameLoopRef]);

    // Polling lesson state for UI updates
    useEffect(() => {
        let rafId: number;
        const updateLessonState = () => {
            if (gameLoopRef.current) {
                const state = gameLoopRef.current.getLessonRuntimeState();
                if (state) {
                    setLessonState({ ...state });
                }
            }
            rafId = requestAnimationFrame(updateLessonState);
        };
        rafId = requestAnimationFrame(updateLessonState);
        return () => cancelAnimationFrame(rafId);
    }, [gameLoopRef]);

    return { lessonState, lessonStatus, activeHint, retry };
}