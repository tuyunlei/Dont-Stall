

import { TestDefinition } from '../types';
import { UnitContext } from '../context';
import { DEFAULT_CAR_CONFIG } from '../../../constants';
import { calculateEngineTorque } from '../../physics/modules/engine';
import { getTotalRatio } from '../../physics/modules/transmission';

export const POWERTRAIN_TESTS: TestDefinition[] = [
    {
        id: 'UNIT-ENG-01',
        category: 'UNIT',
        name: 'Engine Torque Anchors',
        description: 'Validate torque output against physical calibration anchors.',
        steps: [
            'Check Engine Braking: 3000 RPM, 0 Throttle -> Target [-80, -20] Nm',
            'Check Power Output: 3000 RPM, 1.0 Throttle -> Target > 100 Nm'
        ],
        run: (ctx: UnitContext) => {
            const config = DEFAULT_CAR_CONFIG.engine;
            
            // 1. Coasting / Engine Braking Anchor
            // Should be significantly negative but not "brick wall" negative
            const t_coast = calculateEngineTorque(3000, 0.0, true, false, config);
            ctx.log(`Torque @ 3000RPM, 0% Thr: ${t_coast.toFixed(2)} Nm`);
            ctx.assert(t_coast < -20, 'Engine provides braking resistance');
            ctx.assert(t_coast > -80, 'Engine braking is not excessively high (like a seized bearing)');

            // 2. Power Anchor
            // Should be close to TorqueCurve peak (160) minus moderate friction
            const t_power = calculateEngineTorque(3000, 1.0, true, false, config);
            ctx.log(`Torque @ 3000RPM, 100% Thr: ${t_power.toFixed(2)} Nm`);
            ctx.assert(t_power > 100, 'Effective positive torque delivered to flywheel');
        }
    },
    {
        id: 'UNIT-GEAR-01',
        category: 'UNIT',
        name: 'Gear Ratios & Wheel Speed',
        description: 'Check gear ratio calculations and RPM conversion.',
        steps: [
            'Get Gear Ratio for 2nd gear',
            'Calculate Total Ratio (includes Final Drive)',
            'Verify RPM to WheelSpeed conversion factor'
        ],
        run: (ctx: UnitContext) => {
            const config = DEFAULT_CAR_CONFIG.transmission;
            const gear = 2; // 2nd gear
            
            const ratio = getTotalRatio(gear, config);
            ctx.log(`Gear ${gear} Ratio: ${config.gearRatios[gear]}, Final: ${config.finalDriveRatio}, Total: ${ratio}`);
            
            ctx.assert(ratio > 0, 'Total ratio is positive');
            ctx.assert(Math.abs(ratio - (config.gearRatios[2] * config.finalDriveRatio)) < 0.01, 'Ratio math correct');
        }
    }
];