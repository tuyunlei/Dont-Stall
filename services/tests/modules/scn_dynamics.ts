

import { TestDefinition } from '../types';
import { ScenarioContext } from '../context';
import { DEFAULT_CAR_CONFIG } from '../../../constants';

export const DYNAMIC_SCENARIOS: TestDefinition[] = [
    {
        id: 'SCN-HILL-START-01',
        category: 'SCENARIO',
        name: 'Hill Start (15% Slope)',
        description: 'Verify gravity effects, brake holding, and hill start capability.',
        steps: [
            'Set slope 15%',
            'Hold with brakes -> Assert no movement',
            'Release brakes -> Assert rollback',
            'Launch with throttle -> Assert climb'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.environment.slope = 0.15;
            ctx.state.engineOn = true;
            ctx.state.rpm = 800;
            ctx.state.gear = 1;
            
            // 1. Hold
            // Fix: Explicitly hold brake and clutch inputs. 
            // Otherwise inputSystem will smooth them to 0 (release) if {} is passed.
            ctx.state.brakeInput = 1.0;
            ctx.state.clutchPosition = 1.0; 
            ctx.action("Holding with brakes");
            
            ctx.simulate(30, { brake: true, clutch: true });
            
            ctx.assert(Math.abs(ctx.state.localVelocity.x) < 0.01, 'Brakes hold car on slope');
            
            // 2. Rollback
            ctx.action("Releasing brakes (Neutral)");
            ctx.state.brakeInput = 0;
            
            // Keep clutch disengaged to simulate Neutral (Disconnect engine from wheels)
            ctx.simulate(60, { clutch: true });
            
            ctx.log(`Rollback V: ${ctx.state.localVelocity.x.toFixed(2)} m/s`);
            ctx.assert(ctx.state.localVelocity.x < -0.1, 'Gravity causes rollback');
            
            // 3. Launch
            ctx.action("Launching");
            ctx.state.localVelocity.x = 0;
            ctx.state.rpm = 2500;
            ctx.state.clutchPosition = 0; // Dump clutch
            ctx.state.throttleInput = 1.0;
            
            // Hold throttle input to maintain power
            ctx.simulate(60, { throttle: true });
            
            ctx.log(`Climb V: ${ctx.state.localVelocity.x.toFixed(2)} m/s`);
            ctx.assert(ctx.state.localVelocity.x > 0.5, 'Car climbs slope');
        }
    },
    {
        id: 'SCN-SHIFT-01',
        category: 'SCENARIO',
        name: 'Shift Shock (Jerk Analysis)',
        description: 'Measure G-force spike during 1-2 shift to verify smoothing.',
        steps: [
            'Drive steady in Gear 1',
            'Instant shift to Gear 2',
            'Measure peak Jerk (da/dt)',
            'Assert Jerk < Limit'
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
            
            ctx.action("Shifting 1->2");
            ctx.state.gear = 2;
            
            let maxJerk = 0;
            let lastAx = ax_steady;
            
            for(let i=0; i<30; i++) {
                ctx.simulate(1, {});
                const jerk = Math.abs(ctx.state.lastAx - lastAx) / 0.016;
                if (jerk > maxJerk) maxJerk = jerk;
                lastAx = ctx.state.lastAx;
            }
            
            ctx.log(`Max Jerk: ${maxJerk.toFixed(1)}`);
            ctx.assert(maxJerk < 150, 'Shift shock constrained by effective mass smoothing');
        }
    },
    {
        id: 'SCN-LOW-BLEND-01',
        category: 'SCENARIO',
        name: 'Low Speed Kinematic Blend',
        description: 'Verify trajectory follows Ackermann geometry at low speeds.',
        steps: [
            'Set speed 2.0 m/s',
            'Calculate equivalent steering wheel angle',
            'Simulate with held steering',
            'Compare Yaw Rate vs Kinematic Formula'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.localVelocity.x = 2.0;
            
            // Fix: Drive steerAngle via steeringWheelAngle to work with physics loop
            // Because updatePhysics recalculates steerAngle from steeringWheelAngle every frame.
            const targetSteerAngle = 0.5; // rad
            const ratio = ctx.config.chassis.steeringRatio;
            const targetWheelAngleDeg = targetSteerAngle * ratio * (180 / Math.PI);

            // Simulate with held steering wheel to prevent input system auto-return
            for(let i=0; i<10; i++) {
                ctx.state.steeringWheelAngle = targetWheelAngleDeg;
                ctx.simulate(1, {});
            }

            const r = ctx.state.angularVelocity;
            
            // Kinematic R = V / L * tan(delta)
            const r_kin = (2.0 / ctx.config.chassis.wheelBase) * Math.tan(targetSteerAngle);
            
            ctx.log(`Actual Yaw: ${r.toFixed(3)}, Kinematic: ${r_kin.toFixed(3)}`);
            ctx.assert(Math.abs(r - r_kin) < 0.1, 'Matches kinematic model at low speed');
        }
    },
    {
        id: 'SCN-COAST-01',
        category: 'SCENARIO',
        name: 'High Speed Coasting',
        description: 'Verify natural deceleration when throttle is released at speed.',
        steps: [
            'Set speed 25 m/s (90km/h), Gear 4',
            'Release Throttle completely',
            'Simulate 1 second',
            'Assert Speed Decays, but not too abruptly'
        ],
        run: (ctx: ScenarioContext) => {
            ctx.state.engineOn = true;
            ctx.state.gear = 4;
            ctx.state.isClutchLocked = true;
            ctx.state.clutchPosition = 0;
            ctx.state.localVelocity.x = 25.0; // 90 km/h
            ctx.state.rpm = 3000; // Approx for 4th gear
            ctx.state.throttleInput = 0.0;
            
            const startV = ctx.state.localVelocity.x;
            ctx.simulate(60, { throttle: false });
            const endV = ctx.state.localVelocity.x;
            
            const deceleration = (startV - endV) / 1.0; // m/s^2
            
            ctx.log(`Start V: ${startV.toFixed(2)}, End V: ${endV.toFixed(2)}, Decel: ${deceleration.toFixed(2)} m/s^2`);
            
            ctx.assert(endV < startV, 'Car decelerates');
            // Typical engine braking ~0.1 - 0.2 G (1-2 m/s^2) at this speed/gear
            ctx.assert(deceleration > 0.5, 'Deceleration is perceptible (>0.5 m/s^2)');
            ctx.assert(deceleration < 3.0, 'Deceleration is not violent (<3.0 m/s^2)');
        }
    }
];