
export enum ControlAction {
  THROTTLE = 'THROTTLE',
  BRAKE = 'BRAKE',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  CLUTCH = 'CLUTCH',
  HANDBRAKE = 'HANDBRAKE',
  SHIFT_UP = 'SHIFT_UP',
  SHIFT_DOWN = 'SHIFT_DOWN',
  START_ENGINE = 'START_ENGINE',
  RESET = 'RESET'
}

export type KeyMapping = Record<ControlAction, string[]>;

export interface ControlPreset {
  id: string;
  name: string;
  mapping: KeyMapping;
  isCustom?: boolean;
}

export const DEFAULT_MAPPING_WASD: KeyMapping = {
  [ControlAction.START_ENGINE]: ['KeyF'],
  [ControlAction.RESET]: ['KeyR'],
  [ControlAction.THROTTLE]: ['KeyW', 'ArrowUp'],
  [ControlAction.BRAKE]: ['KeyS', 'ArrowDown'],
  [ControlAction.LEFT]: ['KeyA', 'ArrowLeft'],
  [ControlAction.RIGHT]: ['KeyD', 'ArrowRight'],
  [ControlAction.CLUTCH]: ['ShiftLeft'],
  [ControlAction.SHIFT_UP]: ['KeyE'],
  [ControlAction.SHIFT_DOWN]: ['KeyQ'],
  [ControlAction.HANDBRAKE]: ['Space']
};

export const DEFAULT_MAPPING_DIRT: KeyMapping = {
  [ControlAction.START_ENGINE]: ['KeyQ'],
  [ControlAction.RESET]: ['KeyW'],
  [ControlAction.THROTTLE]: ['KeyA'],
  [ControlAction.BRAKE]: ['KeyZ'],
  [ControlAction.LEFT]: ['Comma', 'ArrowLeft'],
  [ControlAction.RIGHT]: ['Period', 'ArrowRight'],
  [ControlAction.CLUTCH]: ['KeyL'],
  [ControlAction.SHIFT_UP]: ['KeyS'],
  [ControlAction.SHIFT_DOWN]: ['KeyX'],
  [ControlAction.HANDBRAKE]: ['Space']
};

export const DEFAULT_PRESETS: ControlPreset[] = [
  {
    id: 'wasd',
    name: 'WASD Layout',
    mapping: DEFAULT_MAPPING_WASD
  },
  {
    id: 'dirt',
    name: 'Dirt Rally Style',
    mapping: DEFAULT_MAPPING_DIRT
  }
];
