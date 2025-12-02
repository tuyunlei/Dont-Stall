
import { CarConfig } from '../config/types';
import { PhysicsState, StoppingState, InputState } from './types';
import { EnvironmentConfig } from '../game/types';
import { processInputs } from './inputSystem';
import { updatePowertrain } from './powertrain';
import { updateChassisDynamics } from './chassis';

export const updatePhysics = (
  state: PhysicsState,
  config: CarConfig,
  inputState: InputState, 
  environment: EnvironmentConfig, 
  dt: number
): PhysicsState => {
  // Ensure state has new fields if upgrading from old state
  if (!state.stoppingState) state.stoppingState = StoppingState.MOVING;
  if (state.currentEffectiveMass === undefined) state.currentEffectiveMass = 0;
  
  // 1. Process Inputs
  const currentSpeed = state.localVelocity.x;
  let nextState = processInputs(
    state, 
    config.controls, 
    config.chassis.maxSteeringWheelAngle, 
    inputState, 
    dt, 
    currentSpeed
  );

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
