
import React, { useRef } from 'react';
import { PhysicsState, CarConfig } from '../types';
import { lerp } from '../utils/math';
import { Gauge } from './dashboard/Gauge';
import { TelemetryBar } from './dashboard/TelemetryBar';
import { SteeringWheelDisplay } from './dashboard/SteeringWheelDisplay';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  state: PhysicsState;
  config: CarConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, config }) => {
  const visualStateRef = useRef(state);
  const { t } = useLanguage();
  
  if (!visualStateRef.current) visualStateRef.current = state;
  visualStateRef.current = {
      ...state,
      rpm: lerp(visualStateRef.current.rpm, state.rpm, 0.2),
      speedKmh: lerp(visualStateRef.current.speedKmh, state.speedKmh, 0.2),
      steeringWheelAngle: lerp(visualStateRef.current.steeringWheelAngle, state.steeringWheelAngle, 0.3),
      gear: state.gear,
      engineOn: state.engineOn,
      stalled: state.stalled,
      clutchPosition: state.clutchPosition,
      brakeInput: state.brakeInput,
      throttleInput: state.throttleInput,
  };
  
  const displayState = visualStateRef.current;

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

  const isRedlining = displayState.rpm > redline;
  const isNearRedline = displayState.rpm > redline - 500;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-6 select-none perspective-[500px]">
        {/* Main Cluster */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 pb-8 flex items-end gap-8 shadow-2xl ring-1 ring-white/10 transform-gpu">
            <Gauge value={displayState.rpm} max={maxDisplayedRPM} label={t('dash.rpm')} unit="x1000" zones={rpmZones} labelDivider={1000} majorTicksCount={maxDisplayedRPM / 1000} minorTicksPerMajor={4} />

            <div className="flex flex-col items-center justify-between h-40 pb-2">
                <div className="flex gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${displayState.engineOn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`} title={t('dash.engine_status')} />
                    <div className={`w-2 h-2 rounded-full ${displayState.stalled ? 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-slate-700'}`} title={t('dash.stall_warning')} />
                </div>
                <div className={`relative flex items-center justify-center w-28 h-28 rounded-2xl border-2 transition-colors duration-100 ${isRedlining ? 'bg-red-900/40 border-red-500 animate-pulse' : 'bg-slate-800 border-slate-700'} ${displayState.gear === 0 ? 'border-green-900/50' : ''}`}>
                    <span className="absolute top-2 text-[10px] font-bold text-slate-500 tracking-widest">{t('dash.gear')}</span>
                    <span className={`text-7xl font-black font-mono tracking-tighter z-10 ${displayState.gear === 0 ? 'text-green-500' : displayState.gear === -1 ? 'text-orange-500' : 'text-blue-100'} ${isNearRedline && displayState.gear > 0 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'drop-shadow-lg'}`}>{getGearLabel(displayState.gear)}</span>
                </div>
            </div>

            <Gauge value={displayState.speedKmh} max={220} label={t('dash.speed')} unit="km/h" majorTicksCount={11} minorTicksPerMajor={1} />
        </div>

        {/* Input Telemetry */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 flex gap-4 shadow-xl h-fit">
            <SteeringWheelDisplay angle={displayState.steeringWheelAngle} />
            <div className="w-px bg-slate-700 mx-1"></div>
            <TelemetryBar value={displayState.clutchPosition} color="bg-yellow-500" label={t('dash.clutch')} />
            <TelemetryBar value={displayState.brakeInput} color="bg-red-500" label={t('dash.brake')} />
            <TelemetryBar value={displayState.throttleInput} color="bg-green-500" label={t('dash.throttle')} />
        </div>
    </div>
  );
};
