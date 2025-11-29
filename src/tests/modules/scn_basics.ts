
import { TestDefinition } from '../types';
import { ScenarioContext } from '../context';
import { StoppingState } from '../../physics/types';

export const BASIC_SCENARIOS: TestDefinition[] = [
    {
        id: 'SCN-IDLE-01',
        category: 'SCENARIO',
        name: 'test.scn_idle_01.name',
        description: 'test.scn_idle_01.desc',
        steps: [
            'test.scn_idle_01.s1',
            'test.scn_idle_01.s2',
            'test.scn_idle_01.s3'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            ctx.state.rpm = 1000;
            ctx.state.lastRpm = 1000; 
            ctx.state.gear = 0; 
            
            ctx.simulate(60, { throttle: false });
            
            const target = ctx.config.engine.idleRPM;
            ctx.log(
                `Final RPM: ${ctx.state.rpm.toFixed(0)} (Target: ${target})`,
                undefined,
                { key: 'log.scn.final_rpm', params: { rpm: ctx.state.rpm.toFixed(0), target } }
            );
            ctx.assert(Math.abs(ctx.state.rpm - target) < 50, 'RPM stabilized near idle target', { key: 'assert.scn.rpm_stable' });
            ctx.assert(Math.abs(ctx.state.localVelocity.x) < 0.1, 'Car remains stationary', { key: 'assert.scn.stationary' });
        }
    },
    {
        id: 'SCN-START-FLAT-01',
        category: 'SCENARIO',
        name: 'test.scn_start_flat_01.name',
        description: 'test.scn_start_flat_01.desc',
        steps: [
            'test.scn_start_flat_01.s1',
            'test.scn_start_flat_01.s2',
            'test.scn_start_flat_01.s3',
            'test.scn_start_flat_01.s4'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            ctx.state.rpm = 800;
            ctx.state.gear = 1;
            // Setup initial condition: Clutch held down
            ctx.state.clutchPosition = 1.0; 
            
            ctx.action('Launching...', { key: 'action.launching' });
            
            // Simulate driver holding throttle and releasing clutch linearly
            // Using analog input channel for clutch
            const frames = 60;
            for(let i=0; i<frames; i++) {
                const clutchAnalog = 1.0 - (i / frames);
                
                // Simulate partial throttle + linear clutch release
                ctx.simulate(1, { 
                    throttleAnalog: 0.3, 
                    clutchAnalog: clutchAnalog 
                }); 
            }
            
            ctx.log(
                `Final Speed: ${ctx.state.localVelocity.x.toFixed(2)} m/s, RPM: ${ctx.state.rpm.toFixed(0)}`,
                undefined,
                { key: 'log.scn.final_speed', params: { v: ctx.state.localVelocity.x.toFixed(2), rpm: ctx.state.rpm.toFixed(0) } }
            );
            ctx.assert(ctx.state.localVelocity.x > 1.0, 'Car is moving forward', { key: 'assert.scn.moving_fwd' });
            ctx.assert(!ctx.state.stalled, 'Engine did not stall', { key: 'assert.scn.no_stall' });
            ctx.assert(ctx.state.rpm > 600, 'RPM stayed healthy', { key: 'assert.scn.rpm_healthy' });
        }
    },
    {
        id: 'SCN-REVERSE-01',
        category: 'SCENARIO',
        name: 'test.scn_reverse_01.name',
        description: 'test.scn_reverse_01.desc',
        steps: [
            'test.scn_reverse_01.s1',
            'test.scn_reverse_01.s2',
            'test.scn_reverse_01.s3'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            ctx.state.rpm = 2000;
            ctx.state.gear = -1;
            
            ctx.action('Reversing...', { key: 'action.reversing' });
            
            // Setup: Fully engaged, pressing throttle
            ctx.state.clutchPosition = 0; 
            
            ctx.simulate(30, { throttle: true }); 
            
            ctx.log(
                `Velocity: ${ctx.state.localVelocity.x.toFixed(2)} m/s, RPM: ${ctx.state.rpm.toFixed(0)}`,
                undefined,
                { key: 'log.scn.velocity', params: { v: ctx.state.localVelocity.x.toFixed(2), rpm: ctx.state.rpm.toFixed(0) } }
            );
            ctx.assert(ctx.state.localVelocity.x < -0.5, 'Car moves backwards', { key: 'assert.scn.moving_back' });
            ctx.assert(ctx.state.rpm > 800, 'Engine running', { key: 'assert.scn.engine_running' });
        }
    },
    {
        id: 'SCN-BRAKE-STOP-01',
        category: 'SCENARIO',
        name: 'test.scn_brake_stop_01.name',
        description: 'test.scn_brake_stop_01.desc',
        steps: [
            'test.scn_brake_stop_01.s1',
            'test.scn_brake_stop_01.s2',
            'test.scn_brake_stop_01.s3',
            'test.scn_brake_stop_01.s4'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.localVelocity.x = 10;
            ctx.state.speedKmh = 36;
            ctx.state.stoppingState = StoppingState.MOVING;
            
            ctx.action('Braking...', { key: 'action.braking' });
            let stopped = false;
            for(let i=0; i<120; i++) {
                // Use input command instead of hard setting state.brakeInput
                ctx.simulate(1, { brake: true });
                if ((ctx.state.stoppingState as StoppingState) === StoppingState.STOPPED) {
                    stopped = true;
                    ctx.log(`Stopped at frame ${i}`, undefined, { key: 'log.scn.stopped_frame', params: { f: i } });
                    break;
                }
            }
            
            ctx.assert(stopped, 'Car entered STOPPED state', { key: 'assert.scn.stopped_state' });
            ctx.assert(Math.abs(ctx.state.localVelocity.x) < 0.01, 'Velocity is effectively zero', { key: 'assert.scn.zero_vel' });
        }
    }
];
