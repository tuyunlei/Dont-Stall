

import { TestDefinition } from '../types';
import { ScenarioContext } from '../context';
import { StoppingState } from '../../../types';
import { DEFAULT_CAR_CONFIG } from '../../../constants';

export const BASIC_SCENARIOS: TestDefinition[] = [
    {
        id: 'SCN-IDLE-01',
        category: 'SCENARIO',
        name: 'Neutral Idle Stability',
        description: 'Engine should maintain RPM in neutral without input.',
        steps: [
            'Start Engine',
            'Wait 60 frames (1s)',
            'Check RPM stability'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            ctx.state.rpm = 1000;
            ctx.state.lastRpm = 1000; // Initialize lastRpm to avoid initial derivative spike
            ctx.state.gear = 0; // Neutral
            
            ctx.simulate(60, { throttle: false });
            
            const target = ctx.config.engine.idleRPM;
            ctx.log(`Final RPM: ${ctx.state.rpm.toFixed(0)} (Target: ${target})`);
            ctx.assert(Math.abs(ctx.state.rpm - target) < 50, 'RPM stabilized near idle target');
            ctx.assert(Math.abs(ctx.state.localVelocity.x) < 0.1, 'Car remains stationary');
        }
    },
    {
        id: 'SCN-START-FLAT-01',
        category: 'SCENARIO',
        name: 'Flat Ground Launch',
        description: 'Smooth launch from standstill on flat ground.',
        steps: [
            'Engine On, Gear 1',
            'Partial Throttle (0.3)',
            'Release Clutch linearly over 60 frames',
            'Verify acceleration and no stall'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            ctx.state.rpm = 800;
            ctx.state.gear = 1;
            ctx.state.clutchPosition = 1.0; // Pressed
            
            ctx.action('Launching...');
            // Linear clutch release with partial throttle
            for(let i=0; i<60; i++) {
                ctx.state.clutchPosition = 1.0 - (i / 60);
                // Manually inject partial throttle since simulate inputs are boolean
                ctx.state.throttleInput = 0.3; 
                ctx.simulate(1, { throttle: true }); 
            }
            
            ctx.log(`Final Speed: ${ctx.state.localVelocity.x.toFixed(2)} m/s, RPM: ${ctx.state.rpm.toFixed(0)}`);
            ctx.assert(ctx.state.localVelocity.x > 1.0, 'Car is moving forward');
            ctx.assert(!ctx.state.stalled, 'Engine did not stall');
            ctx.assert(ctx.state.rpm > 600, 'RPM stayed healthy');
        }
    },
    {
        id: 'SCN-REVERSE-01',
        category: 'SCENARIO',
        name: 'Reverse Gear Launch',
        description: 'Launch in reverse gear.',
        steps: [
            'Engine On, Gear -1 (Reverse)',
            'Clutch dump with throttle',
            'Verify negative velocity'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            // INCREASED RPM: Provide more initial kinetic energy
            ctx.state.rpm = 2000;
            ctx.state.gear = -1;
            
            ctx.action('Reversing...');
            ctx.state.clutchPosition = 0; // Dump clutch
            // INCREASED THROTTLE: Max torque to fight clutch load
            ctx.state.throttleInput = 1.0;
            
            // Fix: Pass { throttle: true } to maintain input signal through the input processing system
            ctx.simulate(30, { throttle: true }); 
            
            ctx.log(`Velocity: ${ctx.state.localVelocity.x.toFixed(2)} m/s, RPM: ${ctx.state.rpm.toFixed(0)}`);
            ctx.assert(ctx.state.localVelocity.x < -0.5, 'Car moves backwards');
            ctx.assert(ctx.state.rpm > 800, 'Engine running');
        }
    },
    {
        id: 'SCN-BRAKE-STOP-01',
        category: 'SCENARIO',
        name: 'Brake to Stop (FSM Check)',
        description: 'Braking from speed until full stop.',
        steps: [
            'Start at 10 m/s',
            'Apply Full Brakes',
            'Wait for speed 0',
            'Verify Stop State transitions'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.localVelocity.x = 10;
            ctx.state.speedKmh = 36;
            ctx.state.stoppingState = StoppingState.MOVING;
            
            ctx.action('Braking...');
            let stopped = false;
            for(let i=0; i<120; i++) {
                ctx.state.brakeInput = 1.0;
                ctx.simulate(1, {});
                if ((ctx.state.stoppingState as StoppingState) === StoppingState.STOPPED) {
                    stopped = true;
                    ctx.log(`Stopped at frame ${i}`);
                    break;
                }
            }
            
            ctx.assert(stopped, 'Car entered STOPPED state');
            ctx.assert(Math.abs(ctx.state.localVelocity.x) < 0.01, 'Velocity is effectively zero');
        }
    }
];