

import React, { useRef, useEffect, useState } from 'react';
import { PhysicsState, CarConfig, LevelData, StoppingState } from '../types';
import { updatePhysics } from '../services/physicsEngine';
import { renderService } from '../services/renderService';
import { checkCollisions } from '../services/collisionService';
import { Dashboard } from './Dashboard';
import { useInputControl } from '../hooks/useInputControl';

interface GameCanvasProps {
  level: LevelData;
  mode: 'LEVELS' | 'SANDBOX';
  carConfig: CarConfig;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, mode, carConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const initialState: PhysicsState = {
    position: { ...level.startPos },
    velocity: { x: 0, y: 0 },
    localVelocity: { x: 0, y: 0 },
    heading: level.startHeading,
    angularVelocity: 0,
    steerAngle: 0,
    steeringWheelAngle: 0, 
    rpm: 0,
    lastRpm: 0,
    gear: 0,
    clutchPosition: 0,
    throttleInput: 0,
    brakeInput: 0,
    idleIntegral: 0,
    engineOn: false,
    stalled: false,
    speedKmh: 0,
    stoppingState: StoppingState.MOVING,
    stopTimer: 0,
    lastAx: 0,
    lastAy: 0,
    isClutchLocked: false,
    currentEffectiveMass: 0
  };

  const physicsStateRef = useRef<PhysicsState>(initialState);
  const [dashboardState, setDashboardState] = useState<PhysicsState>(initialState);
  const [message, setMessage] = useState<string>('');
  
  const { inputsRef, consumeTriggers } = useInputControl();

  const resetCar = () => {
      physicsStateRef.current = { ...initialState, position: { ...level.startPos }, heading: level.startHeading };
      inputsRef.current.throttle = false;
      setMessage("重置车辆");
      setTimeout(() => setMessage(''), 2000);
  };

  useEffect(() => {
      resetCar();
  }, [level]);

  const tick = () => {
    const dt = 0.016; 
    const triggers = consumeTriggers();
    const currentState = physicsStateRef.current;
    
    // Default env if missing
    const env = level.environment || { gravity: 9.81, slope: 0 };

    if (triggers.toggleEngine) {
        if (!currentState.engineOn) {
            currentState.engineOn = true;
            currentState.stalled = false;
            currentState.rpm = carConfig.engine.idleRPM;
            currentState.idleIntegral = 0;
            setMessage("引擎启动");
            setTimeout(() => setMessage(''), 2000);
        } else {
            currentState.engineOn = false;
            setMessage("引擎关闭");
            setTimeout(() => setMessage(''), 2000);
        }
    }
    if (triggers.reset) {
        resetCar();
        requestRef.current = requestAnimationFrame(tick);
        return; 
    }
    if (triggers.shiftUp) {
        if (currentState.clutchPosition > 0.5) {
            const nextGear = currentState.gear + 1;
            if (nextGear < carConfig.transmission.gearRatios.length) currentState.gear = nextGear;
        } else {
            setMessage("请踩下离合器换挡!");
            setTimeout(() => setMessage(''), 1000);
        }
    }
    if (triggers.shiftDown) {
        if (currentState.clutchPosition > 0.5) {
            const prevGear = currentState.gear - 1;
            if (prevGear >= -1) currentState.gear = prevGear;
        } else {
            setMessage("请踩下离合器换挡!");
            setTimeout(() => setMessage(''), 1000);
        }
    }

    // Pass raw inputs to physics engine
    physicsStateRef.current = updatePhysics(physicsStateRef.current, carConfig, inputsRef.current, env, dt);

    const { collision, success } = checkCollisions(physicsStateRef.current, level.objects);
    if (collision) {
        physicsStateRef.current.velocity = { x: -physicsStateRef.current.velocity.x * 0.5, y: -physicsStateRef.current.velocity.y * 0.5 };
        physicsStateRef.current.localVelocity = { x: 0, y: 0 };
        physicsStateRef.current.engineOn = false;
        physicsStateRef.current.stalled = true;
        setMessage("碰撞! 引擎熄火");
    }
    if (success) {
        setMessage("任务完成! 完美停车");
    }
    
    renderService.clear();
    renderService.setupCamera(physicsStateRef.current.position);
    renderService.drawGrid(physicsStateRef.current.position);
    level.objects.forEach(obj => renderService.drawObject(obj));
    renderService.drawCar(physicsStateRef.current, carConfig);
    renderService.restoreCamera();
    
    setDashboardState({...physicsStateRef.current});
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                renderService.setContext(ctx, window.innerWidth, window.innerHeight);
            }
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [carConfig, level]);

  return (
    <div className="relative w-full h-full bg-[#0f172a] overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} className="block touch-none" />
      
      <div className="absolute top-0 left-0 p-4 pointer-events-none">
         <h1 className="text-2xl font-bold text-slate-200">{level.name}</h1>
         <p className="text-slate-400 max-w-md mt-2 text-sm">{level.description}</p>
         <div className="mt-4 bg-slate-800/80 p-4 rounded border border-slate-700 text-sm font-mono whitespace-pre-line text-slate-300">
             {level.instructions}
         </div>
         {message && (
             <div className="mt-4 p-3 bg-blue-600/90 text-white font-bold rounded animate-bounce">
                 {message}
             </div>
         )}
      </div>

      <div className="absolute top-4 right-4 text-right pointer-events-none opacity-50">
          <div className="text-xs text-slate-500">PHYSICS 3.0 STABLE</div>
          <div className="font-mono text-xs text-slate-400">
              POS: {dashboardState.position.x.toFixed(2)}m, {dashboardState.position.y.toFixed(2)}m <br/>
              RPM: {Math.round(dashboardState.rpm)} <br/>
              SPEED: {dashboardState.speedKmh.toFixed(1)} km/h <br/>
              STATE: {dashboardState.stoppingState} <br/>
              ENV: {level.environment?.slope ? `${(level.environment.slope * 100).toFixed(0)}% SLOPE` : 'FLAT'}
          </div>
      </div>

      <Dashboard state={dashboardState} config={carConfig} />
    </div>
  );
};
