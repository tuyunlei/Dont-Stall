
import { BrakesConfig } from '../../config/types';

export const calculateBrakeTorques = (
    brakeInput: number,
    handbrakeInput: number,
    config: BrakesConfig
): { frontTorque: number, rearTorque: number } => {
    // Foot Brake
    const totalFootTorque = brakeInput * config.maxBrakeTorque;
    const footFront = totalFootTorque * config.brakeBias;
    const footRear = totalFootTorque * (1 - config.brakeBias);
    
    // Handbrake
    const rearMax = config.maxBrakeTorque * (1 - config.brakeBias);
    const handbrakeMax = config.handbrakeRearMaxTorque ?? rearMax;
    const handRear = handbrakeInput * handbrakeMax;

    return {
        frontTorque: footFront,
        rearTorque: footRear + handRear
    };
};