
import React from 'react';
import { CarConfig } from '../types';
import { CAR_PRESETS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface SandboxControlsProps {
    config: CarConfig;
    onUpdate: (newConfig: CarConfig) => void;
}

export const SandboxControls: React.FC<SandboxControlsProps> = ({ config, onUpdate }) => {
    const { t } = useLanguage();
    
    const updateEngine = (key: keyof typeof config.engine, val: number) => {
        onUpdate({ ...config, name: 'Custom', engine: { ...config.engine, [key]: val } });
    };

    const updateFriction = (key: string, val: number) => {
        onUpdate({ ...config, name: 'Custom', engine: { ...config.engine, frictionCoef: { ...config.engine.frictionCoef, [key]: val } } });
    }

    const updateChassis = (key: keyof typeof config.chassis, val: number) => {
        onUpdate({ ...config, name: 'Custom', chassis: { ...config.chassis, [key]: val } });
    };
    
    const updateControls = (key: keyof typeof config.controls, val: number) => {
        onUpdate({ ...config, name: 'Custom', controls: { ...config.controls, [key]: val } });
    };

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetKey = e.target.value;
        if (CAR_PRESETS[presetKey]) {
            onUpdate({ ...CAR_PRESETS[presetKey] });
        }
    };

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-l border-slate-200 dark:border-slate-700 p-6 overflow-y-auto shadow-xl z-30 transition-colors duration-300">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">{t('sandbox.title')}</h2>
            
            <div className="mb-6">
                <label className="text-xs font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wider block mb-2">{t('sandbox.preset')}</label>
                <select 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-sm rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    onChange={handlePresetChange}
                    defaultValue=""
                >
                    <option value="" disabled>{t('sandbox.preset.select')}</option>
                    {Object.keys(CAR_PRESETS).map(key => (
                        <option key={key} value={key}>{CAR_PRESETS[key].name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-6">
                <ControlGroup label={t('sandbox.group.engine')}>
                    <Slider label="Idle RPM" value={config.engine.idleRPM} min={500} max={1200} step={50} onChange={(v) => updateEngine('idleRPM', v)} />
                    <Slider label="Inertia (kg*m2)" value={config.engine.inertia} min={0.1} max={5.0} step={0.1} onChange={(v) => updateEngine('inertia', v)} />
                    
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <label className="text-[10px] font-bold text-slate-500 mb-2 block">{t('sandbox.friction')}</label>
                        <Slider label="c0 (Static)" value={config.engine.frictionCoef.c0 ?? 10} min={0} max={50} step={1} onChange={(v) => updateFriction('c0', v)} />
                        <Slider label="kPump (Vacuum)" value={config.engine.frictionCoef.kPump ?? 0.01} min={0} max={0.1} step={0.001} onChange={(v) => updateFriction('kPump', v)} />
                    </div>
                </ControlGroup>

                <ControlGroup label={t('sandbox.group.chassis')}>
                    <Slider label="Mass (kg)" value={config.chassis.mass} min={800} max={3000} step={50} onChange={(v) => updateChassis('mass', v)} />
                    <Slider label="CG Height (m)" value={config.chassis.cgHeight} min={0.2} max={1.0} step={0.05} onChange={(v) => updateChassis('cgHeight', v)} />
                    <Slider label="Friction Coeff" value={config.chassis.tireFriction} min={0.5} max={2.0} step={0.1} onChange={(v) => updateChassis('tireFriction', v)} />
                    <Slider label="Front Stiffness" value={config.chassis.tireStiffnessFront} min={20000} max={150000} step={5000} onChange={(v) => updateChassis('tireStiffnessFront', v)} />
                </ControlGroup>

                <ControlGroup label={t('sandbox.group.controls')}>
                    <Slider label="Throttle Lag (Tau)" value={config.controls.throttleTau} min={0.01} max={0.5} step={0.01} onChange={(v) => updateControls('throttleTau', v)} />
                </ControlGroup>
            </div>
        </div>
    );
};

const ControlGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800/50">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{label}</h3>
        {children}
    </div>
);

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div>
        <div className="flex justify-between mb-1">
            <label className="text-xs text-slate-600 dark:text-slate-400">{label}</label>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{value}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
        />
    </div>
);
