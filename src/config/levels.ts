
import { LevelData } from '../game/types';

export const LEVELS: LevelData[] = [
  {
    id: 'lvl1',
    name: 'level.lvl1.name',
    description: 'level.lvl1.desc',
    startPos: { x: 5, y: 15 }, 
    startHeading: 0,
    instructions: 'level.lvl1.inst',
    objects: [
      { id: 'wall_top', type: 'wall', x: 0, y: 7.5, width: 40, height: 0.5, rotation: 0 },
      { id: 'wall_bottom', type: 'wall', x: 0, y: 22.5, width: 40, height: 0.5, rotation: 0 },
      { id: 'target', type: 'parking-spot', x: 24, y: 13.5, width: 5, height: 3, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0 }
  },
  {
    id: 'lvl2',
    name: 'level.lvl2.name',
    description: 'level.lvl2.desc',
    startPos: { x: 10, y: 15 },
    startHeading: 0,
    instructions: 'level.lvl2.inst',
    objects: [
      { id: 'wall_top', type: 'wall', x: 10, y: 5, width: 30, height: 0.5, rotation: 0 },
      { id: 'spot_left', type: 'wall', x: 19, y: 10, width: 0.5, height: 5, rotation: 0 },
      { id: 'spot_right', type: 'wall', x: 22, y: 10, width: 0.5, height: 5, rotation: 0 },
      { id: 'spot_back', type: 'wall', x: 19, y: 10, width: 3.5, height: 0.5, rotation: 0 },
      { id: 'target', type: 'parking-spot', x: 20.5, y: 10, width: 2.5, height: 4.5, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0 }
  },
  {
    id: 'lvl3',
    name: 'level.lvl3.name',
    description: 'level.lvl3.desc',
    startPos: { x: 2, y: 15 },
    startHeading: 0,
    instructions: 'level.lvl3.inst',
    objects: [
        { id: 'wall_top', type: 'wall', x: 0, y: 10, width: 50, height: 0.5, rotation: 0 },
        { id: 'wall_bottom', type: 'wall', x: 0, y: 20, width: 50, height: 0.5, rotation: 0 },
        { id: 'target', type: 'parking-spot', x: 30, y: 13.5, width: 5, height: 3, rotation: 0, target: true }
    ],
    environment: { gravity: 9.81, slope: 0.15 } 
  }
];
