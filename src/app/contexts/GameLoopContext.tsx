
import React, { createContext, useContext, useRef } from 'react';
import { PhysicsState } from '../../physics/types';

interface GameLoopContextType {
    // We expose a MutableRefObject to allow high-frequency reads without re-renders.
    // Components can use this in their own RAF loops.
    gameStateRef: React.MutableRefObject<PhysicsState | null>;
    setGameStateRef: (state: PhysicsState) => void;
}

const GameLoopContext = createContext<GameLoopContextType | undefined>(undefined);

export const GameLoopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const gameStateRef = useRef<PhysicsState | null>(null);

    const setGameStateRef = (state: PhysicsState) => {
        gameStateRef.current = state;
    };

    return (
        <GameLoopContext.Provider value={{ gameStateRef, setGameStateRef }}>
            {children}
        </GameLoopContext.Provider>
    );
};

export const useGameLoopState = () => {
    const context = useContext(GameLoopContext);
    if (!context) {
        throw new Error('useGameLoopState must be used within a GameLoopProvider');
    }
    return context.gameStateRef;
};

// Also export the setter for the GameCanvas (Producer)
export const useGameLoopSetter = () => {
    const context = useContext(GameLoopContext);
    if (!context) {
        throw new Error('useGameLoopSetter must be used within a GameLoopProvider');
    }
    return context.setGameStateRef;
};
