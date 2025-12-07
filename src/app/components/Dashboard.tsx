
import React from 'react';
import { PhysicsState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { Gauge } from './dashboard/Gauge';
import { TelemetryBar } from './dashboard/TelemetryBar';
import { HandbrakeLever } from './dashboard/HandbrakeLever';
import { SteeringWheelDisplay } from './dashboard/SteeringWheelDisplay';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  state: PhysicsState; // Throttled state for Low-Freq UI (Gear, Lights)
  config: CarConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, config }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  const getGearLabel = (g: number) => {
      if (g === 0) return 'N';
      if (g === -1) return 'R';
      return g.toString();
  };

  const redline = config.engine.redlineRPM;
  const maxDisplayedRPM = Math.ceil((redline + 1000) / 1000) * 1000;
  const stallZoneMax = 500; 

  const rpmZones = [
      { min: 0, max: stallZoneMax, color: '#f97316', width: 6 },
      { min: redline - 500, max: redline, color: '#eab308', width: 6 },
      { min: redline, max: maxDisplayedRPM, color: '#ef4444', width: 6 }
  ];

  const isRedlining = state.rpm > redline;
  const isNearRedline = state.rpm > redline - 500;

  // Colors based on theme
  const engineOnColor = state.engineOn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : (isDark ? 'bg-slate-700' : 'bg-slate-300');
  const stallColor = state.stalled ? 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]' : (isDark ? 'bg-slate-700' : 'bg-slate-300');
  const gearBorder = isRedlining ? 'bg-red-900/40 border-red-500 animate-pulse' : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300');
  const gearTextDefault = isDark ? 'text-blue-100' : 'text-slate-800';

  const handbrakeMode = config.controls.handbrakeMode;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-6 select-none perspective-[500px]">
        {/* Main Cluster */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 pb-8 flex items-end gap-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transform-gpu transition-colors duration-300">
            <Gauge 
                value={state.rpm} // Fallback
                valueAccessor={(s) => s.rpm}
                max={maxDisplayedRPM} 
                label={t('dash.rpm')} 
                unit="x1000" 
                zones={rpmZones} 
                labelDivider={1000} 
                majorTicksCount={maxDisplayedRPM / 1000} 
                minorTicksPerMajor={4} 
                isDark={isDark}
            />

            <div className="flex flex-col items-center justify-between h-40 pb-2">
                <div className="flex gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${engineOnColor}`} title={t('dash.engine_status')} />
                    <div className={`w-2 h-2 rounded-full ${stallColor}`} title={t('dash.stall_warning')} />
                </div>
                {/* Gear display is fine at 30fps */}
                <div className={`relative flex items-center justify-center w-28 h-28 rounded-2xl border-2 transition-colors duration-100 ${gearBorder} ${state.gear === 0 ? 'border-green-600/50' : ''}`}>
                    <span className="absolute top-2 text-[10px] font-bold text-slate-500 tracking-widest">{t('dash.gear')}</span>
                    <span className={`text-7xl font-black font-mono tracking-tighter z-10 ${state.gear === 0 ? 'text-green-500' : state.gear === -1 ? 'text-orange-500' : gearTextDefault} ${isNearRedline && state.gear > 0 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'drop-shadow-lg'}`}>{getGearLabel(state.gear)}</span>
                </div>
            </div>

            <Gauge 
                value={state.speedKmh} 
                valueAccessor={(s) => s.speedKmh}
                max={220} 
                label={t('dash.speed')} 
                unit="km/h" 
                majorTicksCount={11} 
                minorTicksPerMajor={1} 
                isDark={isDark}
            />
        </div>

        {/* Input Telemetry */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex gap-4 shadow-xl h-fit transition-colors duration-300 items-end">
            <SteeringWheelDisplay 
                angle={state.steeringWheelAngle} 
                isDark={isDark} 
            />
            
            <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 h-32 self-center"></div>
            
            <div className="flex gap-2 items-end">
                <TelemetryBar value={state.clutchPosition} color="bg-yellow-500" label={t('dash.clutch')} isDark={isDark} />
                <TelemetryBar value={state.brakeInput} color="bg-red-500" label={t('dash.brake')} isDark={isDark} />
                <TelemetryBar value={state.throttleInput} color="bg-green-500" label={t('dash.throttle')} isDark={isDark} />
            </div>

            <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 h-20 self-end opacity-50"></div>

            <div className="flex items-end pl-1">
                {handbrakeMode === 'RATCHET' ? (
                    <HandbrakeLever 
                        value={state.handbrakeInput} 
                        isDark={isDark} 
                    />
                ) : (
                    <TelemetryBar value={state.handbrakeInput} color="bg-orange-500" label={t('dash.handbrake')} isDark={isDark} />
                )}
            </div>
        </div>
    </div>
  );
};
