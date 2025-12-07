
import { Vector2 } from '../physics/types';

export interface MapObject {
  id: string;
  type: 'wall' | 'parking-spot' | 'cone';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  target?: boolean;
}

// Re-export from physics to avoid circular dependency
export type { EnvironmentConfig } from '../physics/types';

export interface LevelData {
  id: string;
  name: string;
  description: string;
  startPos: Vector2;
  startHeading: number;
  objects: MapObject[];
  instructions: string;
  // Use 'any' here temporarily if needed, but ideally it matches the re-exported type
  environment?: { gravity: number; slope: number };
}

export enum GameMode {
  LEVELS = 'LEVELS',
  SANDBOX = 'SANDBOX'
}

// Extended types for UI state management
export type AppGameMode = GameMode | 'LESSON';
export type GameCanvasMode = GameMode | 'LESSON';

// Type Guard
export function isValidGameCanvasMode(value: unknown): value is GameCanvasMode {
    return (
        value === GameMode.LEVELS ||
        value === GameMode.SANDBOX ||
        value === 'LESSON'
    );
}
