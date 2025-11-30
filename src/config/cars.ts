
import { CarConfig } from './types';
import { CIVILIAN } from './vehicles/civilian';
import { SPORT } from './vehicles/sport';
import { C1_TRAINER } from './vehicles/c1_trainer';

export const CAR_PRESETS: Record<string, CarConfig> = {
  CIVILIAN,
  SPORT,
  C1_TRAINER
};

export const DEFAULT_CAR_CONFIG: CarConfig = CAR_PRESETS.C1_TRAINER;
