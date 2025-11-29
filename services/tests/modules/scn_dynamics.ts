
import { TestDefinition } from '../types';
import { ScenarioContext } from '../context';

export const DYNAMIC_SCENARIOS: TestDefinition[] = [
    {
        id: 'SCN-HILL-START-01',
        category: 'SCENARIO',
        name: 'test.scn_hill_start_01.name',
        description: 'test.scn_hill_start_01.desc',
        steps: [
            'test.scn_hill_start_01.s1',
            'test.scn_hill_start_01.s2',
            'test.scn_hill_start_01.s3',
            'test.scn_hill_start_01.s4'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.environment.slope = 0.15;
            ctx.state.engineOn = true;
            ctx.state.rpm = 800;
            ctx.state.gear = 1;
            
            ctx.state.brakeInput = 1.0;
            ctx.state.clutchPosition = 1.0; 
            ctx.action("Holding with brakes", { key: 'action.hold_brake' });
            
            ctx.simulate(30, { brake: true, clutch: true });
            
            ctx.assert(Math.abs(ctx.state.localVelocity.x) < 0.01, 'Brakes hold car on slope', { key: 'assert.dyn.brake_hold' });
            
            ctx.action("Releasing brakes (Neutral)", { key: 'action.release_brake' });
            ctx.state.brakeInput = 0;
            
            ctx.simulate(60, { clutch: true });
            
            ctx.log(
                `Rollback V: ${ctx.state.localVelocity.x.toFixed(2)} m/s`,
                undefined,
                { key: 'log.dyn.rollback', params: { v: ctx.state.localVelocity.x.toFixed(2) } }
            );
            ctx.assert(ctx.state.localVelocity.x < -0.1, 'Gravity causes rollback', { key: 'assert.dyn.rollback' });
            
            ctx.action("Launching", { key: 'action.launching' });
            ctx.state.localVelocity.x = 0;
            ctx.state.rpm = 2500;
            ctx.state.clutchPosition = 0; 
            ctx.state.throttleInput = 1.0;
            
            ctx.simulate(60, { throttle: true });
            
            ctx.log(
                `Climb V: ${ctx.state.localVelocity.x.toFixed(2)} m/s`,
                undefined,
                { key: 'log.dyn.climb', params: { v: ctx.state.localVelocity.x.toFixed(2) } }
            );
            ctx.assert(ctx.state.localVelocity.x > 0.5, 'Car climbs slope', { key: 'assert.dyn.climb' });
        }
    },
    {
        id: 'SCN-SHIFT-01',
        category: 'SCENARIO',
        name: 'test.scn_shift_01.name',
        description: 'test.scn_shift_01.desc',
        steps: [
            'test.scn_shift_01.s1',
            'test.scn_shift_01.s2',
            'test.scn_shift_01.s3',
            'test.scn_shift_01.s4'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            ctx.state.rpm = 4000;
            ctx.state.gear = 1;
            ctx.state.clutchPosition = 0;
            ctx.state.isClutchLocked = true;
            ctx.state.localVelocity.x = 10; 
            ctx.state.throttleInput = 1.0;
            
            ctx.simulate(10, {});
            const ax_steady = ctx.state.lastAx;
            
            ctx.action("Shifting 1->2", { key: 'action.shifting_1_2' });
            ctx.state.gear = 2;
            
            let maxJerk = 0;
            let lastAx = ax_steady;
            
            for(let i=0; i<30; i++) {
                ctx.simulate(1, {});
                const jerk = Math.abs(ctx.state.lastAx - lastAx) / 0.016;
                if (jerk > maxJerk) maxJerk = jerk;
                lastAx = ctx.state.lastAx;
            }
            
            ctx.log(
                `Max Jerk: ${maxJerk.toFixed(1)}`,
                undefined,
                { key: 'log.dyn.jerk', params: { j: maxJerk.toFixed(1) } }
            );
            ctx.assert(maxJerk < 150, 'Shift shock constrained by effective mass smoothing', { key: 'assert.dyn.shock' });
        }
    },
    {
        id: 'SCN-LOW-BLEND-01',
        category: 'SCENARIO',
        name: 'test.scn_low_blend_01.name',
        description: 'test.scn_low_blend_01.desc',
        steps: [
            'test.scn_low_blend_01.s1',
            'test.scn_low_blend_01.s2',
            'test.scn_low_blend_01.s3',
            'test.scn_low_blend_01.s4'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.localVelocity.x = 2.0;
            
            const targetSteerAngle = 0.5; 
            const ratio = ctx.config.chassis.steeringRatio;
            const targetWheelAngleDeg = targetSteerAngle * ratio * (180 / Math.PI);

            for(let i=0; i<10; i++) {
                ctx.state.steeringWheelAngle = targetWheelAngleDeg;
                ctx.simulate(1, {});
            }

            const r = ctx.state.angularVelocity;
            const r_kin = (2.0 / ctx.config.chassis.wheelBase) * Math.tan(targetSteerAngle);
            
            ctx.log(
                `Actual Yaw: ${r.toFixed(3)}, Kinematic: ${r_kin.toFixed(3)}`,
                undefined,
                { key: 'log.dyn.yaw', params: { r: r.toFixed(3), k: r_kin.toFixed(3) } }
            );
            ctx.assert(Math.abs(r - r_kin) < 0.1, 'Matches kinematic model at low speed', { key: 'assert.dyn.kinematic' });
        }
    },
    {
        id: 'SCN-COAST-01',
        category: 'SCENARIO',
        name: 'test.scn_coast_01.name',
        description: 'test.scn_coast_01.desc',
        steps: [
            'test.scn_coast_01.s1',
            'test.scn_coast_01.s2',
            'test.scn_coast_01.s3',
            'test.scn_coast_01.s4'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            ctx.state.gear = 4;
            ctx.state.isClutchLocked = true;
            ctx.state.clutchPosition = 0;
            ctx.state.localVelocity.x = 25.0; 
            ctx.state.rpm = 3000; 
            ctx.state.throttleInput = 0.0;
            
            const startV = ctx.state.localVelocity.x;
            ctx.simulate(60, { throttle: false });
            const endV = ctx.state.localVelocity.x;
            
            const deceleration = (startV - endV) / 1.0; 
            
            ctx.log(
                `Start V: ${startV.toFixed(2)}, End V: ${endV.toFixed(2)}, Decel: ${deceleration.toFixed(2)} m/s^2`,
                undefined,
                { key: 'log.dyn.coast', params: { v1: startV.toFixed(2), v2: endV.toFixed(2), d: deceleration.toFixed(2) } }
            );
            
            ctx.assert(endV < startV, 'Car decelerates', { key: 'assert.dyn.decel' });
            ctx.assert(deceleration > 0.5, 'Deceleration is perceptible (>0.5 m/s^2)', { key: 'assert.dyn.decel_perceptible' });
            ctx.assert(deceleration < 3.0, 'Deceleration is not violent (<3.0 m/s^2)', { key: 'assert.dyn.decel_gentle' });
        }
    }
];
