
import { TestDefinition } from '../types';
import { UnitContext } from '../context';
import { DEFAULT_CAR_CONFIG } from '../../../constants';
import { calculateEngineTorque } from '../../physics/modules/engine';
import { getTotalRatio } from '../../physics/modules/transmission';

export const POWERTRAIN_TESTS: TestDefinition[] = [
    {
        id: 'UNIT-ENG-01',
        category: 'UNIT',
        name: 'test.unit_eng_01.name',
        description: 'test.unit_eng_01.desc',
        steps: [
            'test.unit_eng_01.s1',
            'test.unit_eng_01.s2'
        ],
        run: (ctx: UnitContext) => {
            const config = DEFAULT_CAR_CONFIG.engine;
            
            const t_coast = calculateEngineTorque(3000, 0.0, true, false, config);
            ctx.log(
                `Torque @ 3000RPM, 0% Thr: ${t_coast.toFixed(2)} Nm`, 
                undefined, 
                { key: 'log.powertrain.torque_measure', params: { rpm: 3000, throttle: 0, torque: t_coast.toFixed(2) } }
            );
            ctx.assert(t_coast < -20, 'Engine provides braking resistance', undefined, { key: 'assert.powertrain.braking_resistance' });
            ctx.assert(t_coast > -80, 'Engine braking is not excessively high', undefined, { key: 'assert.powertrain.braking_limit' });

            const t_power = calculateEngineTorque(3000, 1.0, true, false, config);
            ctx.log(
                `Torque @ 3000RPM, 100% Thr: ${t_power.toFixed(2)} Nm`,
                undefined,
                { key: 'log.powertrain.torque_measure', params: { rpm: 3000, throttle: 100, torque: t_power.toFixed(2) } }
            );
            ctx.assert(t_power > 100, 'Effective positive torque delivered to flywheel', undefined, { key: 'assert.powertrain.positive_torque' });
        }
    },
    {
        id: 'UNIT-GEAR-01',
        category: 'UNIT',
        name: 'test.unit_gear_01.name',
        description: 'test.unit_gear_01.desc',
        steps: [
            'test.unit_gear_01.s1',
            'test.unit_gear_01.s2',
            'test.unit_gear_01.s3'
        ],
        run: (ctx: UnitContext) => {
            const config = DEFAULT_CAR_CONFIG.transmission;
            const gear = 2; 
            
            const ratio = getTotalRatio(gear, config);
            ctx.log(
                `Gear ${gear} Ratio: ${config.gearRatios[gear]}, Final: ${config.finalDriveRatio}, Total: ${ratio}`,
                undefined,
                { key: 'log.powertrain.gear_ratio', params: { g: gear, ratio: config.gearRatios[gear], final: config.finalDriveRatio, total: ratio } }
            );
            
            ctx.assert(ratio > 0, 'Total ratio is positive', undefined, { key: 'assert.powertrain.ratio_pos' });
            ctx.assert(Math.abs(ratio - (config.gearRatios[2] * config.finalDriveRatio)) < 0.01, 'Ratio math correct', undefined, { key: 'assert.powertrain.ratio_math' });
        }
    }
];
