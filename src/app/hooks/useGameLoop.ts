import React, { useRef, useEffect, useCallback } from 'react';
import { PhysicsState, InputState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { LevelData } from '../../game/types';
import { GameLoop } from '../../game/GameLoop';
import { createInitialState } from '../../physics/factory';
import { TriggerState } from '../../game/systems/InputSystem';

export interface GameLoopCallbacks {
    onTick: (state: PhysicsState) => void;
    onMessage: (msgKey: string) => void;
}

export interface UseGameLoopOptions {
    level: LevelData;
    carConfig: CarConfig;
    getInputs: () => InputState;
    getTriggers: () => TriggerState;
    callbacks: GameLoopCallbacks;
}

export interface UseGameLoopResult {
    gameLoopRef: React.MutableRefObject<GameLoop | null>;
    initialState: PhysicsState;
    reset: (state: PhysicsState) => void;
}

export function useGameLoop(options: UseGameLoopOptions): UseGameLoopResult {
    const { level, carConfig, getInputs, getTriggers, callbacks } = options;

    const gameLoopRef = useRef<GameLoop | null>(null);

    // Use refs to store callbacks and variable dependencies to avoid re-triggering useEffect
    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;

    const getInputsRef = useRef(getInputs);
    getInputsRef.current = getInputs;

    const getTriggersRef = useRef(getTriggers);
    getTriggersRef.current = getTriggers;

    // Memoize initialState so it doesn't change on every render unless level start properties change
    const initialState = React.useMemo(
        () => createInitialState(level.startPos, level.startHeading),
        [level.startPos.x, level.startPos.y, level.startHeading]
    );

    useEffect(() => {
        const loop = new GameLoop(initialState, {
            getLevel: () => level,
            getConfig: () => carConfig,
            // Wrap calls to ensure we always use the latest ref value
            getInputs: () => getInputsRef.current(),
            getTriggers: () => getTriggersRef.current(),
            callbacks: {
                onTick: (state) => callbacksRef.current.onTick(state),
                onMessage: (msg) => callbacksRef.current.onMessage(msg)
            }
        });

        gameLoopRef.current = loop;
        loop.start();

        return () => {
            loop.stop();
        };
    }, [level, carConfig, initialState]); // Removed callbacks/inputs/triggers from dependencies

    const reset = useCallback((state: PhysicsState) => {
        gameLoopRef.current?.reset(state);
    }, []);

    return { gameLoopRef, initialState, reset };
}