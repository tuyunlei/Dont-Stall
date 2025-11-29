
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

export interface EnvironmentConfig {
    gravity: number;
    slope: number;
}

export interface LevelData {
  id: string;
  name: string;
  description: string;
  startPos: Vector2;
  startHeading: number;
  objects: MapObject[];
  instructions: string;
  environment?: EnvironmentConfig;
}

export enum GameMode {
  LEVELS = 'LEVELS',
  SANDBOX = 'SANDBOX'
}
