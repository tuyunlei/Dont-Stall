
import React from 'react';
import { ControlAction, KeyMapping } from '../../config/controls';
import { KeyCap } from './KeyCap';
import { useLanguage } from '../contexts/LanguageContext';

interface PresetPreviewProps {
    id: string;
    name: string;
    mapping: KeyMapping;
    isActive: boolean;
    onClick: () => void;
    onDelete?: () => void;
}

// Helper component for consistent key+label styling
const LabeledKey = ({ 
    labelKey, 
    keyLabel, 
    size = 'sm', 
    colorClass = '', 
    labelColorClass = 'text-slate-400',
    widthClass = ''
}: { 
    labelKey: string; 
    keyLabel: string; 
    size?: 'sm' | 'md' | 'lg'; 
    colorClass?: string;
    labelColorClass?: string;
    widthClass?: string;
}) => {
    const { t } = useLanguage();
    return (
        <div className={`flex flex-col items-center ${widthClass}`}>
            <KeyCap label={keyLabel} size={size} className={`${colorClass} ${widthClass ? 'w-full' : ''}`} />
            <span className={`text-[8px] font-bold mt-0.5 uppercase ${labelColorClass} text-center leading-none`}>{t(labelKey)}</span>
        </div>
    );
};

// Visualizer for WASD Layout (Keyboard style)
const WasdLayout = ({ mapping }: { mapping: KeyMapping }) => {
    const getKey = (action: ControlAction) => mapping[action]?.[0] || '';

    return (
        <div className="flex flex-col gap-2 items-start select-none scale-90 origin-top-left ml-4">
            {/* Row 1: Q W E R */}
            <div className="flex gap-2 ml-1">
                <LabeledKey labelKey="label.shift_down" keyLabel={getKey(ControlAction.SHIFT_DOWN)} />
                <LabeledKey labelKey="label.thr" keyLabel={getKey(ControlAction.THROTTLE)} colorClass="bg-slate-200 dark:bg-slate-600 border-b-blue-400" labelColorClass="text-blue-500" />
                <LabeledKey labelKey="label.shift_up" keyLabel={getKey(ControlAction.SHIFT_UP)} />
                <LabeledKey labelKey="label.reset" keyLabel={getKey(ControlAction.RESET)} colorClass="text-red-500" />
            </div>
            
            {/* Row 2: A S D F (Staggered) */}
            <div className="flex gap-2 ml-5">
                <LabeledKey labelKey="label.left" keyLabel={getKey(ControlAction.LEFT)} colorClass="bg-slate-200 dark:bg-slate-600 border-b-blue-400" labelColorClass="text-blue-500" />
                <LabeledKey labelKey="label.brk" keyLabel={getKey(ControlAction.BRAKE)} colorClass="bg-slate-200 dark:bg-slate-600 border-b-red-400" labelColorClass="text-red-500" />
                <LabeledKey labelKey="label.right" keyLabel={getKey(ControlAction.RIGHT)} colorClass="bg-slate-200 dark:bg-slate-600 border-b-blue-400" labelColorClass="text-blue-500" />
                <LabeledKey labelKey="label.engine" keyLabel={getKey(ControlAction.START_ENGINE)} colorClass="text-green-600" />
            </div>

            {/* Row 3: Shift Space */}
            <div className="flex gap-2 items-start mt-1">
                <div className="-ml-3">
                   <LabeledKey 
                        labelKey="label.clutch" 
                        keyLabel={getKey(ControlAction.CLUTCH)} 
                        size="md" 
                        widthClass="w-20" 
                    />
                </div>
                <div className="ml-8">
                     <LabeledKey 
                        labelKey="label.handbrake" 
                        keyLabel={getKey(ControlAction.HANDBRAKE)} 
                        size="md" 
                        widthClass="w-36" 
                    />
                </div>
            </div>
        </div>
    );
};

// Visualizer for Dirt Layout (Split Keyboard style)
const DirtLayout = ({ mapping }: { mapping: KeyMapping }) => {
    const getKey = (action: ControlAction) => mapping[action]?.[0] || '';
    const { t } = useLanguage();

    return (
        <div className="flex gap-6 justify-center select-none scale-90 origin-top">
            {/* Left Hand: QWAZSX */}
            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <LabeledKey labelKey="label.engine" keyLabel={getKey(ControlAction.START_ENGINE)} colorClass="text-green-600" />
                    <LabeledKey labelKey="label.reset" keyLabel={getKey(ControlAction.RESET)} colorClass="text-red-500" />
                </div>
                <div className="flex gap-2 ml-4">
                    <LabeledKey labelKey="label.thr" keyLabel={getKey(ControlAction.THROTTLE)} colorClass="bg-slate-200 dark:bg-slate-600 border-b-blue-400" labelColorClass="text-blue-500" />
                    <LabeledKey labelKey="label.shift_up" keyLabel={getKey(ControlAction.SHIFT_UP)} />
                </div>
                <div className="flex gap-2 ml-8">
                    <LabeledKey labelKey="label.brk" keyLabel={getKey(ControlAction.BRAKE)} colorClass="bg-slate-200 dark:bg-slate-600 border-b-red-400" labelColorClass="text-red-500" />
                    <LabeledKey labelKey="label.shift_down" keyLabel={getKey(ControlAction.SHIFT_DOWN)} />
                </div>
                <div className="text-center text-[9px] text-slate-400 font-bold border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">{t('label.left_hand')}</div>
            </div>

            {/* Divider */}
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>

            {/* Right Hand: L , . */}
            <div className="flex flex-col gap-2 items-center justify-center">
                <div className="flex flex-col items-center mb-1">
                    <LabeledKey labelKey="label.clutch" keyLabel={getKey(ControlAction.CLUTCH)} size="sm" />
                </div>
                <div className="flex gap-2">
                    <LabeledKey labelKey="label.left" keyLabel={getKey(ControlAction.LEFT)} colorClass="bg-slate-200 dark:bg-slate-600 border-b-blue-400" labelColorClass="text-blue-500" />
                    <LabeledKey labelKey="label.right" keyLabel={getKey(ControlAction.RIGHT)} colorClass="bg-slate-200 dark:bg-slate-600 border-b-blue-400" labelColorClass="text-blue-500" />
                </div>
                
                 <div className="mt-2">
                     <LabeledKey 
                        labelKey="label.handbrake" 
                        keyLabel={getKey(ControlAction.HANDBRAKE)} 
                        size="sm" 
                        widthClass="w-24" 
                    />
                </div>

                <div className="text-center text-[9px] text-slate-400 font-bold border-t border-slate-200 dark:border-slate-700 pt-1 mt-1 w-full">{t('label.right_hand')}</div>
            </div>
        </div>
    );
};

export const PresetPreview: React.FC<PresetPreviewProps> = ({ id, name, mapping, isActive, onClick, onDelete }) => {
    
    // Determine which visualizer to use
    let Content = null;
    if (id === 'wasd') {
        Content = <WasdLayout mapping={mapping} />;
    } else if (id === 'dirt') {
        Content = <DirtLayout mapping={mapping} />;
    }

    return (
        <div 
            onClick={onClick}
            className={`
                relative p-4 rounded-xl border-2 transition-all cursor-pointer group flex flex-col gap-3
                ${isActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-[1.02]' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                }
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <h3 className={`font-bold text-sm ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {name}
                </h3>
                {isActive && <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm tracking-wider">ACTIVE</span>}
            </div>

            {/* Content: Either custom visualizer or simple count for user presets */}
            <div className="pt-2 min-h-[5rem] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-lg overflow-hidden py-4">
                {Content ? (
                    Content
                ) : (
                    <div className="text-center">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Custom Preset</span>
                        <div className="flex gap-1 justify-center mt-2 opacity-50">
                             <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                             <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                             <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Button for Custom */}
            {onDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 hover:border-red-500 rounded-full transition-all shadow-sm opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                    title="Delete Preset"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
        </div>
    );
};