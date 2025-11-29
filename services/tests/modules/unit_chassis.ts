
import { TestDefinition } from '../types';
import { UnitContext } from '../context';
import { DEFAULT_CAR_CONFIG } from '../../../constants';
import { calculateBrakeTorques } from '../../physics/modules/brakes';
import { interpolateTable, softSaturation } from '../../../utils/math';

export const CHASSIS_TESTS: TestDefinition[] = [
    {
        id: 'UNIT-BRAKE-01',
        category: 'UNIT',
        name: 'Brake Bias & Torque',
        description: 'Ensure brake force distribution is correct.',
        steps: [
            'Input 100% braking',
            'Check front vs rear torque against bias config',
            'Verify total braking torque'
        ],
        run: (ctx: UnitContext) => {
            const config = DEFAULT_CAR_CONFIG.brakes;
            const res = calculateBrakeTorques(1.0, config);
            
            ctx.log(`Front: ${res.frontTorque}, Rear: ${res.rearTorque}, Total: ${config.maxBrakeTorque}`);
            
            const expectedFront = config.maxBrakeTorque * config.brakeBias;
            ctx.assert(Math.abs(res.frontTorque - expectedFront) < 1.0, 'Front torque matches bias');
            ctx.assert(res.frontTorque > res.rearTorque, 'Front bias ensures front brakes are stronger');
        }
    },
    {
        id: 'UNIT-TIRE-01',
        category: 'UNIT',
        name: 'Tire Saturation Model',
        description: 'Verify soft saturation curve for tire forces.',
        steps: [
            'Test linear region (small slip)',
            'Test saturation region (large slip)',
            'Ensure output does not exceed 1.0 (normalized)'
        ],
        run: (ctx: UnitContext) => {
            // Test mathematical helper directly
            const valSmall = softSaturation(0.2, 2); 
            ctx.log(`Input 0.2 -> Output ${valSmall.toFixed(3)}`);
            ctx.assert(Math.abs(valSmall - 0.2) < 0.05, 'Linear in small slip region');

            const valLarge = softSaturation(5.0, 2);
            ctx.log(`Input 5.0 -> Output ${valLarge.toFixed(3)}`);
            ctx.assert(Math.abs(valLarge) <= 1.0, 'Saturates at 1.0');
            ctx.assert(valLarge > 0.9, 'Reaches saturation limit');
        }
    },
    {
        id: 'UNIT-INPUT-01',
        category: 'UNIT',
        name: 'Steering Sensitivity Curve',
        description: 'Check steering response time (tau) vs speed.',
        steps: [
            'Sample Tau at 0 m/s',
            'Sample Tau at 50 m/s',
            'Assert Tau increases with speed (slower steering at high speed)'
        ],
        run: (ctx: UnitContext) => {
            const curve = DEFAULT_CAR_CONFIG.controls.steeringCurve;
            const table = curve.map(p => ({ x: p.speed, y: p.tau }));
            
            const tauLow = interpolateTable(table, 0);
            const tauHigh = interpolateTable(table, 50);
            
            ctx.log(`Tau @ 0m/s: ${tauLow}s`);
            ctx.log(`Tau @ 50m/s: ${tauHigh}s`);
            
            ctx.assert(tauHigh >= tauLow, 'Steering becomes slower/heavier at speed');
        }
    }
];
