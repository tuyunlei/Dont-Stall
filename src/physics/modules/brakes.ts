
import { BrakesConfig } from '../../config/types';

export const calculateBrakeTorques = (
    brakeInput: number,
    config: BrakesConfig
): { frontTorque: number, rearTorque: number } => {
    const totalTorque = brakeInput * config.maxBrakeTorque;
    
    return {
        frontTorque: totalTorque * config.brakeBias,
        rearTorque: totalTorque * (1 - config.brakeBias)
    };
};
