
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
  RESET = 'RESET',

  // Virtual Pedal Increments
  THROTTLE_INC = 'THROTTLE_INC',
  THROTTLE_DEC = 'THROTTLE_DEC',

  BRAKE_INC = 'BRAKE_INC',
  BRAKE_DEC = 'BRAKE_DEC',

  CLUTCH_INC = 'CLUTCH_INC',
  CLUTCH_DEC = 'CLUTCH_DEC',

  // Virtual Steering Increments
  STEER_LEFT_INC = 'STEER_LEFT_INC',
  STEER_RIGHT_INC = 'STEER_RIGHT_INC',
}

// Support simple strings "KeyW" or chords "Shift+KeyW"
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
  [ControlAction.HANDBRAKE]: ['Space'],
  
  // Virtual Throttle via Option (Alt) + W/S
  [ControlAction.THROTTLE_INC]: ['Alt+KeyW', 'Alt+ArrowUp'], 
  [ControlAction.THROTTLE_DEC]: ['Alt+KeyS', 'Alt+ArrowDown'],
  
  // Virtual Steering via Option (Alt) + A/D
  [ControlAction.STEER_LEFT_INC]: ['Alt+KeyA', 'Alt+ArrowLeft'],
  [ControlAction.STEER_RIGHT_INC]: ['Alt+KeyD', 'Alt+ArrowRight'],

  // Leave others unbound by default in WASD
  [ControlAction.BRAKE_INC]: [], [ControlAction.BRAKE_DEC]: [],
  [ControlAction.CLUTCH_INC]: [], [ControlAction.CLUTCH_DEC]: [],
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
  [ControlAction.HANDBRAKE]: ['Space'],

  [ControlAction.THROTTLE_INC]: [], [ControlAction.THROTTLE_DEC]: [],
  [ControlAction.BRAKE_INC]: [], [ControlAction.BRAKE_DEC]: [],
  [ControlAction.CLUTCH_INC]: [], [ControlAction.CLUTCH_DEC]: [],
  [ControlAction.STEER_LEFT_INC]: [], [ControlAction.STEER_RIGHT_INC]: [],
};

export const DEFAULT_PRESETS: ControlPreset[] = [
  {
    id: 'wasd',
    name: 'preset.wasd',
    mapping: DEFAULT_MAPPING_WASD
  },
  {
    id: 'dirt',
    name: 'preset.dirt',
    mapping: DEFAULT_MAPPING_DIRT
  }
];
