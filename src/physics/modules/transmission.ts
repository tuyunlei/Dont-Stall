
import { TransmissionConfig } from '../../config/types';

export const getGearRatio = (gear: number, config: TransmissionConfig): number => {
    if (gear === 0) return 0;
    if (gear === -1) return -3.5; 
    if (gear >= config.gearRatios.length) return 1.0;
    return config.gearRatios[gear];
};

export const getTotalRatio = (gear: number, config: TransmissionConfig): number => {
    const gr = getGearRatio(gear, config);
    return gr * config.finalDriveRatio;
};

// Calculate how much inertia the engine adds to the wheels (I_effective = I_engine * ratio^2)
export const calculateEffectiveInertiaRatio = (gear: number, config: TransmissionConfig): number => {
    const ratio = getTotalRatio(gear, config);
    return ratio * ratio;
};
