
import React, { useRef, useEffect, useState } from 'react';
import { PhysicsState, InputState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { LevelData } from '../../game/types';
import { LessonDefinition, LessonResult } from '../../game/lessonTypes';
import { renderService } from '../renderService';
import { Dashboard } from './Dashboard';
import { useInputControl } from '../hooks/useInputControl';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { GameLoop } from '../../game/GameLoop';
import { createInitialState } from '../../physics/factory';
import { InstructionText } from './InstructionText';
import { LessonRuntime, LessonRuntimeState, LessonStatus } from '../../game/lessonRuntime';
import { LessonOverlay } from './LessonOverlay';

interface GameCanvasProps {
  level: LevelData;
  mode: 'LEVELS' | 'SANDBOX' | 'LESSON';
  carConfig: CarConfig;
  activeLesson?: LessonDefinition;
  onExit?: () => void;
  onLessonFinish?: (lessonId: string, result: 'success' | 'failed') => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, mode, carConfig, activeLesson, onExit, onLessonFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  
  // Throttle Control for React UI Updates
  const lastUiUpdateRef = useRef<number>(0);
  const UI_UPDATE_INTERVAL = 33; // ~30 FPS for React UI updates

  // High-Frequency State Ref for smooth animations (RAF)
  // This bypasses React's render cycle for things like needles and steering wheels
  const latestStateRef = useRef<PhysicsState>(createInitialState(level.startPos, level.startHeading));

  // FPS Counter Refs (Bypass React Render)
  const fpsRef = useRef<HTMLDivElement>(null);
  const fpsStatsRef = useRef({ frames: 0, lastTime: performance.now() });

  const { t } = useLanguage();
  const { isDark } = useTheme();
  
  // Use Factory
  const initialState = createInitialState(level.startPos, level.startHeading);

  const [dashboardState, setDashboardState] = useState<PhysicsState>(initialState);
  const [lessonState, setLessonState] = useState<LessonRuntimeState | null>(null);
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const hintTimeoutRef = useRef<number | undefined>(undefined);
  
  const { inputsRef, consumeTriggers } = useInputControl();

  // Sync theme to render service
  useEffect(() => {
      renderService.setTheme(isDark);
  }, [isDark]);

  const showHint = (msgKey: string) => {
      setActiveHint(msgKey);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      // Auto-dismiss hint after 4 seconds
      hintTimeoutRef.current = window.setTimeout(() => {
          setActiveHint(null);
      }, 4000);
  };

  const createRuntime = (def: LessonDefinition) => {
      return new LessonRuntime(def, {
          onLessonSuccess: (result: LessonResult) => {
              console.log('Lesson Success', result);
              setLessonStatus('success');
              // Only notify parent of success status, result is handled in Overlay
              onLessonFinish?.(def.id, 'success');
          },
          onLessonFailed: (reason) => {
              console.log('Lesson Failed', reason);
              setLessonStatus('failed');
              onLessonFinish?.(def.id, 'failed');
          },
          onObjectiveCompleted: (id) => console.log('Objective Complete', id),
          onHintTriggered: (msgKey) => {
              showHint(msgKey);
          }
      });
  };

  // Handle Retry Logic
  const handleRetryLesson = () => {
      if (!gameLoopRef.current || !activeLesson) return;

      // 1. Reset Physics
      const freshState = createInitialState(level.startPos, level.startHeading);
      gameLoopRef.current.reset(freshState);
      setDashboardState(freshState);
      latestStateRef.current = freshState;

      // 2. Reset Runtime
      const runtime = createRuntime(activeLesson);
      gameLoopRef.current.attachLessonRuntime(runtime);
      runtime.start();
      setLessonState(runtime.getState());
      setLessonStatus('running');
      setActiveHint(null);
  };

  // Setup / Teardown Game Loop
  useEffect(() => {
    // 1. Initialize Loop
    const loop = new GameLoop(initialState, {
        getLevel: () => level,
        getConfig: () => carConfig,
        getInputs: () => {
            // INPUT FREEZING: If Lesson Ended, block inputs
            if (activeLesson && (lessonStatus === 'success' || lessonStatus === 'failed')) {
                // Return safety state (Neutral, Idle, Handbrake On)
                return {
                    throttle: false,
                    brake: false,
                    left: false,
                    right: false,
                    clutch: false,
                    handbrake: true, // Force Handbrake
                    handbrakeAnalog: 1.0,
                    throttleAnalog: 0,
                    brakeAnalog: 0,
                    clutchAnalog: 0
                } as InputState;
            }
            return inputsRef.current;
        },
        getTriggers: () => {
            // BLOCK TRIGGERS if Lesson Ended (Prevent 'R' reset or engine toggle)
            if (activeLesson && (lessonStatus === 'success' || lessonStatus === 'failed')) {
                consumeTriggers(); // Consume to clear buffer, but return empty
                return { 
                    toggleEngine: false, shiftUp: false, shiftDown: false, reset: false, toggleHandbrake: false,
                    setVirtualThrottleFull: false, setVirtualThrottleZero: false,
                    setVirtualBrakeFull: false, setVirtualBrakeZero: false,
                    setVirtualClutchFull: false, setVirtualClutchZero: false,
                    setVirtualSteeringLeftFull: false, setVirtualSteeringRightFull: false
                };
            }
            return consumeTriggers();
        },
        callbacks: {
            onTick: (newState) => {
                // 1. Update the High-Frequency Ref immediately (Zero Overhead)
                latestStateRef.current = newState;

                // 2. Rendering (Canvas)
                renderService.clear();
                renderService.setupCamera(newState.position);
                renderService.drawGrid(newState.position);
                level.objects.forEach(obj => renderService.drawObject(obj));
                renderService.drawCar(newState, carConfig);
                renderService.restoreCamera();

                // 3. FPS Calculation (Direct DOM update)
                const now = performance.now();
                fpsStatsRef.current.frames++;
                if (now - fpsStatsRef.current.lastTime >= 500) {
                    const fps = Math.round((fpsStatsRef.current.frames * 1000) / (now - fpsStatsRef.current.lastTime));
                    if (fpsRef.current) {
                        fpsRef.current.textContent = `FPS: ${fps}`;
                    }
                    fpsStatsRef.current.frames = 0;
                    fpsStatsRef.current.lastTime = now;
                }

                // 4. UI Sync (Throttled for heavy React tree)
                if (now - lastUiUpdateRef.current >= UI_UPDATE_INTERVAL) {
                    setDashboardState({...newState}); // Clone to trigger React diff
                    
                    // Sync Lesson State if active
                    if (gameLoopRef.current?.getLessonRuntimeState()) {
                        setLessonState({...gameLoopRef.current.getLessonRuntimeState()!});
                    }

                    lastUiUpdateRef.current = now;
                }
            },
            onMessage: (msgKey) => {
                // If in lesson mode, use hints system for physics messages instead of overlay messages?
                // Or keep legacy messages separate. Let's keep separate for now.
                setMessage(t(msgKey));
                setTimeout(() => setMessage(''), 2000);
            }
        }
    });

    // 2. Initialize Lesson Runtime if present
    if (activeLesson) {
        const runtime = createRuntime(activeLesson);
        loop.attachLessonRuntime(runtime);
        runtime.start();
        setLessonState(runtime.getState());
        setLessonStatus('running');
        setActiveHint(null);
    } else {
        setLessonStatus('idle');
    }

    gameLoopRef.current = loop;
    loop.start();

    return () => {
        loop.stop();
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [level, carConfig, activeLesson]); 

  // Handle Resize & High-DPI Scaling
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const dpr = window.devicePixelRatio || 1;
            const logicalWidth = window.innerWidth;
            const logicalHeight = window.innerHeight;

            canvas.width = logicalWidth * dpr;
            canvas.height = logicalHeight * dpr;
            canvas.style.width = `${logicalWidth}px`;
            canvas.style.height = `${logicalHeight}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
                ctx.scale(dpr, dpr);
                renderService.setContext(ctx, logicalWidth, logicalHeight);
            }
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-[#0f172a] overflow-hidden cursor-crosshair transition-colors duration-300">
      <canvas ref={canvasRef} className="block touch-none" />
      
      {/* HUD Info Area - Hide in Lesson Mode if we want cleaner UI */}
      <div className="absolute top-0 left-0 p-4 pointer-events-none w-full max-w-lg z-0">
         <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 drop-shadow-md">{t(level.name)}</h1>
         <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm drop-shadow-sm">{t(level.description)}</p>
         
         {!activeLesson && (
             <div className="mt-4 bg-white/90 dark:bg-slate-800/90 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm pointer-events-auto">
                 <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <InstructionText textKey={level.instructions} />
                 </div>
             </div>
         )}

         {message && (
             <div className="mt-4 p-3 bg-blue-600/90 text-white font-bold rounded animate-bounce shadow-lg inline-block">
                 {message}
             </div>
         )}
      </div>

      {/* Physics Debug Info */}
      <div className="absolute top-4 right-4 text-right pointer-events-none opacity-50 z-0">
          <div ref={fpsRef} className="font-mono text-sm font-bold text-green-600 dark:text-green-400 mb-1">FPS: --</div>
          <div className="text-xs text-slate-500">{t('hud.physics')}</div>
          <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
              POS: {dashboardState.position.x.toFixed(2)}m, {dashboardState.position.y.toFixed(2)}m <br/>
              RPM: {Math.round(dashboardState.rpm)} <br/>
              SPEED: {dashboardState.speedKmh.toFixed(1)} km/h <br/>
              {t('hud.state')}: {dashboardState.stoppingState} <br/>
              {level.environment?.slope ? `${(level.environment.slope * 100).toFixed(0)}% ${t('hud.slope')}` : t('hud.flat')}
          </div>
      </div>

      {/* Lesson Overlay */}
      {activeLesson && lessonState && (
          <LessonOverlay 
            lesson={activeLesson} 
            state={lessonState} 
            activeHint={activeHint}
            onRetry={handleRetryLesson}
            onExit={() => onExit && onExit()}
          />
      )}

      {/* Pass both the reactive state (for static UI) and the Ref (for high-fps UI) */}
      <Dashboard 
          state={dashboardState} 
          latestStateRef={latestStateRef} 
          config={carConfig} 
      />
    </div>
  );
};
