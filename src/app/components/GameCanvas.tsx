
import React, { useRef, useEffect, useState } from 'react';
import { PhysicsState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { LevelData } from '../../game/types';
import { renderService } from '../renderService';
import { Dashboard } from './Dashboard';
import { useInputControl } from '../hooks/useInputControl';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { GameLoop } from '../../game/GameLoop';
import { createInitialState } from '../../physics/factory';
import { InstructionText } from './InstructionText';

interface GameCanvasProps {
  level: LevelData;
  mode: 'LEVELS' | 'SANDBOX';
  carConfig: CarConfig;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, mode, carConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  
  const { t } = useLanguage();
  const { isDark } = useTheme();
  
  // Use Factory
  const initialState = createInitialState(level.startPos, level.startHeading);

  const [dashboardState, setDashboardState] = useState<PhysicsState>(initialState);
  const [message, setMessage] = useState<string>('');
  
  const { inputsRef, consumeTriggers } = useInputControl();

  // Sync theme to render service
  useEffect(() => {
      renderService.setTheme(isDark);
  }, [isDark]);

  // Setup / Teardown Game Loop
  useEffect(() => {
    // 1. Initialize Loop
    const loop = new GameLoop(initialState, {
        getLevel: () => level,
        getConfig: () => carConfig,
        getInputs: () => inputsRef.current,
        getTriggers: () => consumeTriggers(),
        callbacks: {
            onTick: (newState) => {
                // Rendering
                renderService.clear();
                renderService.setupCamera(newState.position);
                renderService.drawGrid(newState.position);
                level.objects.forEach(obj => renderService.drawObject(obj));
                renderService.drawCar(newState, carConfig);
                renderService.restoreCamera();

                // UI Sync
                setDashboardState({...newState});
            },
            onMessage: (msgKey) => {
                setMessage(t(msgKey));
                setTimeout(() => setMessage(''), 2000);
            }
        }
    });

    gameLoopRef.current = loop;
    loop.start();

    // 2. Setup Canvas Context
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            renderService.setContext(ctx, canvasRef.current.width, canvasRef.current.height);
        }
    }

    return () => {
        loop.stop();
    };
  }, [level, carConfig]); // Re-create loop when level/config changes

  // Handle Resize
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

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-[#0f172a] overflow-hidden cursor-crosshair transition-colors duration-300">
      <canvas ref={canvasRef} className="block touch-none" />
      
      <div className="absolute top-0 left-0 p-4 pointer-events-none w-full max-w-lg">
         <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 drop-shadow-md">{t(level.name)}</h1>
         <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm drop-shadow-sm">{t(level.description)}</p>
         
         <div className="mt-4 bg-white/90 dark:bg-slate-800/90 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm pointer-events-auto">
             <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                <InstructionText textKey={level.instructions} />
             </div>
         </div>

         {message && (
             <div className="mt-4 p-3 bg-blue-600/90 text-white font-bold rounded animate-bounce shadow-lg inline-block">
                 {message}
             </div>
         )}
      </div>

      <div className="absolute top-4 right-4 text-right pointer-events-none opacity-50">
          <div className="text-xs text-slate-500">{t('hud.physics')}</div>
          <div className="font-mono text-xs text-slate-600 dark:text-slate-400">
              POS: {dashboardState.position.x.toFixed(2)}m, {dashboardState.position.y.toFixed(2)}m <br/>
              RPM: {Math.round(dashboardState.rpm)} <br/>
              SPEED: {dashboardState.speedKmh.toFixed(1)} km/h <br/>
              {t('hud.state')}: {dashboardState.stoppingState} <br/>
              {level.environment?.slope ? `${(level.environment.slope * 100).toFixed(0)}% ${t('hud.slope')}` : t('hud.flat')}
          </div>
      </div>

      <Dashboard state={dashboardState} config={carConfig} />
    </div>
  );
};
