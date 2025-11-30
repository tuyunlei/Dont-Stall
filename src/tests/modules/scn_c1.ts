
import { TestDefinition } from '../types';
import { ScenarioContext } from '../context';
import { CAR_PRESETS } from '../../config/cars';
import { simulateLaunchSequence } from '../helpers';

export const C1_SCENARIOS: TestDefinition[] = [
    {
        id: 'SCN-C1-CREEP-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_creep.name',
        description: 'test.scn_c1_creep.desc',
        steps: [
            'test.scn_c1_creep.s1',
            'test.scn_c1_creep.s2',
            'test.scn_c1_creep.s3'
        ],
        run: (ctx: ScenarioContext) => {
            // Force C1 Config
            ctx.config = CAR_PRESETS.C1_TRAINER;
            
            // 1. Init: Neutral, Idle, Clutch Pressed
            ctx.state.engineOn = true;
            ctx.state.rpm = 800;
            ctx.state.gear = 0;
            ctx.state.clutchPosition = 1.0; 
            ctx.state.brakeInput = 0;
            ctx.state.throttleInput = 0;
            
            ctx.action('Shift 1st & Release Clutch (No Throttle)...', { key: 'action.creeping' });

            // 2. Shift to 1st
            ctx.state.gear = 1;

            // 3. Realistic Release: 1.0s release time, 0% Throttle
            simulateLaunchSequence(ctx, {
                targetThrottle: 0.0,
                clutchReleaseFrames: 60,
                holdFrames: 120 // Allow 2s to settle
            });
            
            const v = ctx.state.localVelocity.x;
            const rpm = ctx.state.rpm;
            
            // C1 Creep target: ~5-8 km/h (1.4 - 2.2 m/s)
            ctx.log(
                `Creep Speed: ${v.toFixed(2)} m/s, RPM: ${rpm.toFixed(0)}`,
                undefined,
                { key: 'log.scn.velocity', params: { v: v.toFixed(2), rpm: rpm.toFixed(0) } }
            );

            // Assert positive direction (forward) and reasonable creep speed
            ctx.assert(v > 0.5, 'Car creeps forward (> 0.5 m/s)', { key: 'assert.c1.creep_speed' });
            ctx.assert(v < 3.0, 'Car does not accelerate uncontrollably', { key: 'assert.scn.rpm_healthy' });
            ctx.assert(rpm > 600, 'Engine maintains idle under load', { key: 'assert.c1.creep_rpm' });
            ctx.assert(!ctx.state.stalled, 'Engine does not stall', { key: 'assert.scn.no_stall' });
        }
    },
    {
        id: 'SCN-C1-STALL-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_stall.name',
        description: 'test.scn_c1_stall.desc',
        steps: [
            'test.scn_c1_stall.s1',
            'test.scn_c1_stall.s2',
            'test.scn_c1_stall.s3'
        ],
        run: (ctx: ScenarioContext) => {
            // Force C1 Config
            ctx.config = CAR_PRESETS.C1_TRAINER;

            ctx.state.engineOn = true;
            ctx.state.rpm = 800;
            ctx.state.gear = 1;
            ctx.state.localVelocity.x = 2.0; // Moving slightly
            ctx.state.clutchPosition = 0.0;
            ctx.state.isClutchLocked = true;
            
            ctx.action('Slamming brakes without clutch...', { key: 'action.brake_stall' });
            
            // Simulate heavy braking without clutch
            // The anti-stall should TRY to help, but fail against the brakes
            // The auto-clutch assist is OFF, so it should stay locked until death
            for(let i=0; i<60; i++) {
                ctx.simulate(1, { brake: true, clutch: false });
                if (ctx.state.stalled) break;
            }
            
            ctx.log(
                `Final RPM: ${ctx.state.rpm.toFixed(0)}, Stalled: ${ctx.state.stalled}`,
                undefined,
                { key: 'log.c1.stall_status', params: { rpm: ctx.state.rpm.toFixed(0), stalled: ctx.state.stalled.toString() } }
            );

            ctx.assert(ctx.state.stalled, 'Engine stalled as expected', { key: 'assert.c1.stalled' });
            ctx.assert(ctx.state.rpm < 300, 'RPM dropped to zero', { key: 'assert.c1.rpm_zero' });
            ctx.assert(!ctx.state.engineOn, 'Engine state is OFF', { key: 'assert.c1.engine_off' });
        }
    },
    {
        id: 'SCN-C1-STALL-ROLL-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_stall_roll.name',
        description: 'test.scn_c1_stall_roll.desc',
        steps: [
            'test.scn_c1_stall_roll.s1',
            'test.scn_c1_stall_roll.s2',
            'test.scn_c1_stall_roll.s3',
            'test.scn_c1_stall_roll.s4'
        ],
        run: (ctx: ScenarioContext) => {
            // REGRESSION TEST: Ghost Force Fix
            ctx.config = CAR_PRESETS.C1_TRAINER;

            // 1. Setup: Moving in 1st gear, about to stall
            ctx.state.engineOn = true;
            ctx.state.rpm = 1000;
            ctx.state.gear = 1;
            ctx.state.localVelocity.x = 2.0;
            ctx.state.clutchPosition = 0; // Engaged
            ctx.state.isClutchLocked = true;

            ctx.action('Braking to stall...', { key: 'action.brake_stall' });

            // 2. Brake until stall
            for(let i=0; i<120; i++) {
                ctx.simulate(1, { brake: true });
                if(ctx.state.stalled && ctx.state.localVelocity.x < 0.1) break;
            }

            ctx.assert(ctx.state.stalled, 'Car stalled', { key: 'assert.c1.stalled' });

            // 3. Release Brake and Wait (The Regression Check)
            // If the bug exists, the static friction (c0) will push the car backwards
            ctx.action('Releasing brake, checking for ghost force...');
            ctx.simulate(300, { brake: false, throttle: false, clutch: false }); // 5 seconds wait

            // 4. Assertions
            const v = ctx.state.localVelocity.x;
            const rpm = ctx.state.rpm;

            ctx.log(
                `Final V: ${v.toFixed(3)}, RPM: ${rpm.toFixed(1)}`,
                undefined,
                { key: 'log.scn.velocity', params: { v: v.toFixed(3), rpm: rpm.toFixed(1) } }
            );

            // Should be basically 0. If ghost force exists, v will be negative (reversing).
            ctx.assert(Math.abs(v) < 0.1, 'Car remains stationary after stall', { key: 'assert.scn.stationary' });
            ctx.assert(Math.abs(rpm) < 10, 'Engine remains stopped', { key: 'assert.c1.rpm_zero' });
        }
    },
    {
        id: 'SCN-C1-START-SUCCESS-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_start_success.name',
        description: 'test.scn_c1_start_success.desc',
        steps: [
            'test.scn_c1_start_success.s1',
            'test.scn_c1_start_success.s2',
            'test.scn_c1_start_success.s3'
        ],
        run: (ctx: ScenarioContext) => {
             // Force C1 Config
            ctx.config = CAR_PRESETS.C1_TRAINER;
            
            // 1. Setup: Neutral, Engine Off
            ctx.state.engineOn = false;
            ctx.state.stalled = false;
            ctx.state.starterActive = false;
            ctx.state.gear = 0;
            ctx.state.rpm = 0;

            // 2. Action: Hold Starter
            ctx.action('Holding starter in neutral...');
            ctx.state.starterActive = true;

            // 3. Simulate
            // Should ignite quickly (within 0.5s ~ 30 frames)
            let ignitedFrame = -1;
            for(let i=0; i<90; i++) {
                ctx.simulate(1, {});
                if (ctx.state.engineOn) {
                    ignitedFrame = i;
                    break;
                }
            }

            ctx.log(`Ignited at frame: ${ignitedFrame}, RPM: ${ctx.state.rpm.toFixed(0)}`);

            ctx.assert(ctx.state.engineOn, 'Engine eventually starts', { key: 'assert.c1.engine_on' });
            
            // 4. Stabilize
            ctx.state.starterActive = false; // Release key
            ctx.simulate(60, {}); // Let idle stabilize

            const target = ctx.config.engine.idleRPM;
            ctx.log(`Final RPM: ${ctx.state.rpm.toFixed(0)} (Target: ${target})`);
            ctx.assert(Math.abs(ctx.state.rpm - target) < 100, 'RPM settles near idle', { key: 'assert.scn.rpm_stable' });
        }
    },
    {
        id: 'SCN-C1-START-FAIL-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_start_fail.name',
        description: 'test.scn_c1_start_fail.desc',
        steps: [
            'test.scn_c1_start_fail.s1',
            'test.scn_c1_start_fail.s2',
            'test.scn_c1_start_fail.s3',
            'test.scn_c1_start_fail.s4'
        ],
        run: (ctx: ScenarioContext) => {
            // Requirement B: In-gear start fail
            ctx.config = CAR_PRESETS.C1_TRAINER;
            
            // 1. Setup: Stopped, 1st Gear, Clutch UP (Engaged), Engine OFF
            ctx.state.engineOn = false;
            ctx.state.stalled = false;
            ctx.state.starterActive = false;
            ctx.state.gear = 1;
            ctx.state.clutchPosition = 0; 
            ctx.state.isClutchLocked = true;
            ctx.state.localVelocity.x = 0;

            // 2. Activate Starter
            ctx.action('Cranking engine in 1st gear...', { key: 'action.launching' });
            ctx.state.starterActive = true;

            // 3. Simulate cranking
            // Starter torque (40Nm) vs Vehicle Mass (1250kg + Engine Inertia)
            // Should still fail to reach 300 RPM due to load
            ctx.simulate(60, {}); // 1 Second

            const rpm = ctx.state.rpm;
            const v = ctx.state.localVelocity.x;

            ctx.log(
                `Cranking RPM: ${rpm.toFixed(0)}, Speed: ${v.toFixed(3)} m/s`,
                undefined,
                { key: 'log.scn.velocity', params: { v: v.toFixed(3), rpm: rpm.toFixed(0) } }
            );

            // Assertions
            const ignitionThreshold = ctx.config.engine.starter!.ignitionRPM;
            ctx.assert(rpm < ignitionThreshold, 'RPM did not reach ignition threshold', { key: 'assert.c1.engine_off' });
            ctx.assert(!ctx.state.engineOn, 'Engine did not start', { key: 'assert.c1.engine_off' });
            ctx.assert(v > 0.05, 'Car moved slightly (Lurch)', { key: 'assert.scn.moving_fwd' });
        }
    },
    {
        id: 'SCN-C1-IDLE-UPSHIFT-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_idle_upshift.name',
        description: 'test.scn_c1_idle_upshift.desc',
        steps: [
            'test.scn_c1_idle_upshift.s1',
            'test.scn_c1_idle_upshift.s2',
            'test.scn_c1_idle_upshift.s3',
            'test.scn_c1_idle_upshift.s4'
        ],
        run: (ctx: ScenarioContext) => {
            // Requirement A: High gear idle stall
            ctx.config = CAR_PRESETS.C1_TRAINER;

            // 1. Moving in 2nd Gear (should be fine)
            ctx.state.engineOn = true;
            ctx.state.gear = 2;
            ctx.state.localVelocity.x = 4.0; 
            ctx.state.clutchPosition = 0;
            ctx.state.isClutchLocked = true;
            ctx.state.throttleInput = 0;

            ctx.simulate(30, {});
            ctx.assert(!ctx.state.stalled, '2nd gear idle is sustainable', { key: 'assert.scn.no_stall' });

            // 2. Shift to 3rd -> 4th
            ctx.action('Shifting up to 4th without throttle...');
            ctx.state.gear = 3;
            ctx.simulate(10, {});
            ctx.state.gear = 4;
            
            // 3. Wait for resistance to kill the engine
            // The logic added to powertrain.ts forces stall if RPM drops < 0.8 * Idle in high gear
            for(let i=0; i<120; i++) {
                ctx.simulate(1, {});
                if (ctx.state.stalled) break;
            }

            ctx.log(
                `Final State - Stalled: ${ctx.state.stalled}, RPM: ${ctx.state.rpm.toFixed(0)}`,
                undefined,
                { key: 'log.c1.stall_status', params: { rpm: ctx.state.rpm.toFixed(0), stalled: ctx.state.stalled.toString() } }
            );

            ctx.assert(ctx.state.stalled, 'Engine stalled in high gear', { key: 'assert.c1.stalled' });
        }
    },
    {
        id: 'SCN-C1-REVERSE-BLOCK-01',
        category: 'SCENARIO',
        name: 'test.scn_c1_reverse_block.name',
        description: 'test.scn_c1_reverse_block.desc',
        steps: [
            'test.scn_c1_reverse_block.s1',
            'test.scn_c1_reverse_block.s2',
            'test.scn_c1_reverse_block.s3'
        ],
        run: (ctx: ScenarioContext) => {
            // Requirement C: Reverse logic
            ctx.config = CAR_PRESETS.C1_TRAINER;
            
            // 1. High Speed Block
            ctx.state.engineOn = true;
            ctx.state.gear = 2;
            ctx.state.localVelocity.x = 10.0;
            ctx.state.clutchPosition = 1.0; // Clutch pressed, trying to shift

            // In simulation context, we don't run GameLoop logic (which handles the block).
            // This test is tricky because blocking happens in Input/GameLoop layer.
            // But we can verify the PHYSICS consequence if it WAS forced (Low speed case).
            // For high speed block, we rely on manual testing or mocking GameLoop, 
            // but here we focus on the "Low Speed Stall" physics part.

            ctx.action('Forcing Reverse at 2 m/s...');
            ctx.state.localVelocity.x = 2.0; 
            ctx.state.gear = -1; // Force gear state to Reverse
            ctx.state.clutchPosition = 0; // Dump clutch
            ctx.state.isClutchLocked = true; // Assume lock for shock

            // 2. Simulate shock
            ctx.simulate(10, {});

            ctx.log(
                `Stalled: ${ctx.state.stalled}, RPM: ${ctx.state.rpm.toFixed(0)}`,
                undefined,
                { key: 'log.c1.stall_status', params: { rpm: ctx.state.rpm.toFixed(0), stalled: ctx.state.stalled.toString() } }
            );

            ctx.assert(ctx.state.stalled, 'Low speed reverse shock caused stall', { key: 'assert.c1.stalled' });
        }
    }
];
