

import { CarConfig, PhysicsState, StoppingState, EnvironmentConfig } from '../types';
import { processInputs } from './physics/inputSystem';
import { updatePowertrain } from './physics/powertrain';
import { updateChassisDynamics } from './physics/chassis';

export const updatePhysics = (
  state: PhysicsState,
  config: CarConfig,
  inputState: any, 
  environment: EnvironmentConfig, // v3.0
  dt: number
): PhysicsState => {
  // Ensure state has new fields if upgrading from old state
  if (!state.stoppingState) state.stoppingState = StoppingState.MOVING;
  if (state.currentEffectiveMass === undefined) state.currentEffectiveMass = 0;
  
  // 1. Process Inputs
  const currentSpeed = state.localVelocity.x;
  let nextState = processInputs(state, config.controls, inputState, dt, currentSpeed);

  nextState.steerAngle = (nextState.steeringWheelAngle / config.chassis.steeringRatio) * (Math.PI / 180);

  // 2. Powertrain
  const ptResult = updatePowertrain(nextState, config, dt);
  
  nextState.rpm = ptResult.rpm;
  nextState.stalled = ptResult.stalled;
  nextState.engineOn = ptResult.engineOn;
  nextState.idleIntegral = ptResult.idleIntegral;
  nextState.isClutchLocked = ptResult.isClutchLocked;
  nextState.currentEffectiveMass = ptResult.currentEffectiveMass; // Persist

  // 3. Chassis
  const chassisResult = updateChassisDynamics(
      nextState,
      {
          driveForce: ptResult.driveForce,
          effectiveLongitudinalMass: ptResult.effectiveLongitudinalMass,
          brakeTorqueFront: ptResult.brakeTorqueFront,
          brakeTorqueRear: ptResult.brakeTorqueRear
      },
      config.chassis,
      config.feel,
      environment, // Pass environment
      dt
  );

  nextState = { ...nextState, ...chassisResult };
  nextState.lastRpm = state.rpm;

  return nextState;
};
