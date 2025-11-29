
import { TestDefinition } from '../types';
import { UnitContext } from '../context';
import { DEFAULT_CAR_CONFIG } from '../../config/cars';
import { calculateBrakeTorques } from '../../physics/modules/brakes';
import { interpolateTable, softSaturation } from '../../utils/math';

export const CHASSIS_TESTS: TestDefinition[] = [
    {
        id: 'UNIT-BRAKE-01',
        category: 'UNIT',
        name: 'test.unit_brake_01.name',
        description: 'test.unit_brake_01.desc',
        steps: [
            'test.unit_brake_01.s1',
            'test.unit_brake_01.s2',
            'test.unit_brake_01.s3'
        ],
        run: (ctx: UnitContext) => {
            const config = DEFAULT_CAR_CONFIG.brakes;
            const res = calculateBrakeTorques(1.0, config);
            
            ctx.log(
                `Front: ${res.frontTorque}, Rear: ${res.rearTorque}, Total: ${config.maxBrakeTorque}`,
                undefined,
                { key: 'log.chassis.brake_dist', params: { f: res.frontTorque, r: res.rearTorque, total: config.maxBrakeTorque } }
            );
            
            const expectedFront = config.maxBrakeTorque * config.brakeBias;
            ctx.assert(Math.abs(res.frontTorque - expectedFront) < 1.0, 'Front torque matches bias', undefined, { key: 'assert.chassis.bias_match' });
            ctx.assert(res.frontTorque > res.rearTorque, 'Front bias ensures front brakes are stronger', undefined, { key: 'assert.chassis.front_stronger' });
        }
    },
    {
        id: 'UNIT-TIRE-01',
        category: 'UNIT',
        name: 'test.unit_tire_01.name',
        description: 'test.unit_tire_01.desc',
        steps: [
            'test.unit_tire_01.s1',
            'test.unit_tire_01.s2',
            'test.unit_tire_01.s3'
        ],
        run: (ctx: UnitContext) => {
            const valSmall = softSaturation(0.2, 2); 
            ctx.log(
                `Input 0.2 -> Output ${valSmall.toFixed(3)}`,
                undefined,
                { key: 'log.chassis.sat_io', params: { in: 0.2, out: valSmall.toFixed(3) } }
            );
            ctx.assert(Math.abs(valSmall - 0.2) < 0.05, 'Linear in small slip region', undefined, { key: 'assert.chassis.linear_slip' });

            const valLarge = softSaturation(5.0, 2);
            ctx.log(
                `Input 5.0 -> Output ${valLarge.toFixed(3)}`,
                undefined,
                { key: 'log.chassis.sat_io', params: { in: 5.0, out: valLarge.toFixed(3) } }
            );
            ctx.assert(Math.abs(valLarge) <= 1.0, 'Saturates at 1.0', undefined, { key: 'assert.chassis.saturates' });
            ctx.assert(valLarge > 0.9, 'Reaches saturation limit', undefined, { key: 'assert.chassis.reach_limit' });
        }
    },
    {
        id: 'UNIT-INPUT-01',
        category: 'UNIT',
        name: 'test.unit_input_01.name',
        description: 'test.unit_input_01.desc',
        steps: [
            'test.unit_input_01.s1',
            'test.unit_input_01.s2',
            'test.unit_input_01.s3'
        ],
        run: (ctx: UnitContext) => {
            const curve = DEFAULT_CAR_CONFIG.controls.steeringCurve;
            const table = curve.map(p => ({ x: p.speed, y: p.tau }));
            
            const tauLow = interpolateTable(table, 0);
            const tauHigh = interpolateTable(table, 50);
            
            ctx.log(
                `Tau @ 0m/s: ${tauLow}s`,
                undefined,
                { key: 'log.chassis.steering_tau', params: { s: 0, t: tauLow } }
            );
            ctx.log(
                `Tau @ 50m/s: ${tauHigh}s`,
                undefined,
                { key: 'log.chassis.steering_tau', params: { s: 50, t: tauHigh } }
            );
            
            ctx.assert(tauHigh >= tauLow, 'Steering becomes slower/heavier at speed', undefined, { key: 'assert.chassis.steering_slow' });
        }
    }
];
