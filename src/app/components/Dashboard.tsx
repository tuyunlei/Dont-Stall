
import React from 'react';
import { PhysicsState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { Gauge } from './dashboard/Gauge';
import { SteeringWheelDisplay } from './dashboard/SteeringWheelDisplay';
import { HandbrakeLever } from './dashboard/HandbrakeLever';
import { TelemetryBar } from './dashboard/TelemetryBar';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { DASHBOARD_CONSTANTS } from '../constants';

interface DashboardProps {
    state: PhysicsState;
    config: CarConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, config }) => {
    const { t } = useLanguage();
    const { isDark } = useTheme();

    const maxRPM = Math.ceil(config.engine.maxRPM / DASHBOARD_CONSTANTS.RPM_GAUGE_ROUND_UNIT) * DASHBOARD_CONSTANTS.RPM_GAUGE_ROUND_UNIT;
    
    // RPM Zones configuration
    const rpmZones = [
        { min: 0, max: DASHBOARD_CONSTANTS.STALL_ZONE_MAX_RPM, color: '#ef4444', opacity: 0.3, width: 4 }, // Stall danger
        { min: config.engine.idleRPM - 100, max: config.engine.idleRPM + 100, color: '#22c55e', opacity: 0.3, width: 4 }, // Idle target
        { min: config.engine.redlineRPM - DASHBOARD_CONSTANTS.REDLINE_WARNING_OFFSET, max: config.engine.redlineRPM, color: '#eab308', opacity: 0.5, width: 6 }, // Warning zone
        { min: config.engine.redlineRPM, max: maxRPM, color: '#ef4444', opacity: 0.8, width: 8 } // Redline
    ];

    const isStalled = state.stalled;
    const isEngineOn = state.engineOn;
    const isRedlining = state.rpm > config.engine.redlineRPM;
    const isNearRedline = state.rpm > config.engine.redlineRPM - DASHBOARD_CONSTANTS.REDLINE_WARNING_OFFSET;
    const handbrakeMode = config.controls.handbrakeMode;

    return (
        <div className="absolute bottom-6 left-0 right-0 px-6 flex items-end justify-center gap-6 pointer-events-none select-none">
            
            {/* Left Block: Pedal Inputs */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex gap-3 items-end shadow-xl transition-colors duration-300">
                <TelemetryBar value={state.clutchPosition} color="bg-blue-500" label={t('dash.clutch')} isDark={isDark} />
                <TelemetryBar value={state.brakeInput} color="bg-red-500" label={t('dash.brake')} isDark={isDark} />
                <TelemetryBar value={state.throttleInput} color="bg-green-500" label={t('dash.throttle')} isDark={isDark} />
            </div>

            {/* Center Block: Main Gauges */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-3xl px-6 pb-8 pt-16 flex items-end gap-6 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-300 relative">
                {/* Status Indicators */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 flex gap-4">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-colors ${isEngineOn ? 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400' : 'bg-slate-500/20 border-slate-500 text-slate-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${isEngineOn ? 'bg-green-500 shadow-[0_0_5px_currentColor]' : 'bg-slate-500'}`} />
                        <span className="text-[10px] font-bold uppercase">{t('dash.engine_status')}</span>
                    </div>
                    
                    {isStalled && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50">
                            <span className="text-xs font-bold uppercase">⚠️ {t('dash.stall_warning')}</span>
                        </div>
                    )}
                </div>

                {/* RPM Gauge */}
                <Gauge 
                    value={state.rpm} 
                    valueAccessor={(s) => s.rpm}
                    max={maxRPM} 
                    label={t('dash.rpm')} 
                    unit="x1000" 
                    zones={rpmZones}
                    majorTicksCount={maxRPM / 1000}
                    minorTicksPerMajor={4}
                    labelDivider={1000}
                    isDark={isDark}
                />
                
                {/* Digital Gear Display */}
                <div className="flex flex-col items-center justify-end pb-8">
                    <div className={`
                        w-16 h-16 rounded-lg border-2 flex items-center justify-center mb-2 shadow-inner transition-colors
                        ${isRedlining ? 'bg-red-900/40 border-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-800'}
                        ${state.gear === 0 ? 'border-green-500/50' : (isRedlining ? '' : 'border-slate-300 dark:border-slate-600')}
                    `}>
                        <span className={`
                            text-3xl font-black font-mono 
                            ${state.gear === 0 ? 'text-green-600 dark:text-green-400' : 
                              state.gear < 0 ? 'text-red-500' : 
                              (isNearRedline && state.gear > 0) ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 
                              'text-slate-800 dark:text-white'}
                        `}>
                            {state.gear === 0 ? 'N' : (state.gear === -1 ? 'R' : state.gear)}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{t('dash.gear')}</span>
                </div>

                {/* Speedometer */}
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

            {/* Right Block: Steering & Handbrake */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex gap-4 items-end shadow-xl transition-colors duration-300">
                <SteeringWheelDisplay angle={state.steeringWheelAngle} isDark={isDark} />
                
                <div className="w-px bg-slate-300 dark:bg-slate-700 h-20 self-center opacity-50" />

                {handbrakeMode === 'RATCHET' ? (
                    <HandbrakeLever value={state.handbrakeInput} isDark={isDark} />
                ) : (
                    <TelemetryBar value={state.handbrakeInput} color="bg-orange-500" label={t('dash.handbrake')} isDark={isDark} />
                )}
            </div>
        </div>
    );
};
