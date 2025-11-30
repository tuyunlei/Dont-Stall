
import React, { useState, useEffect } from 'react';
import { useControls } from '../contexts/ControlsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ControlAction } from '../../config/controls';
import { KeyCap } from './KeyCap';
import { PresetPreview } from './PresetPreview';

interface ControlsSettingsProps {
    onClose: () => void;
}

export const ControlsSettings: React.FC<ControlsSettingsProps> = ({ onClose }) => {
    const { 
        presets, 
        activePresetId, 
        currentMapping, 
        applyPreset, 
        updateBinding, 
        saveAsPreset, 
        deletePreset 
    } = useControls();
    
    const { t } = useLanguage();
    const [listeningAction, setListeningAction] = useState<ControlAction | null>(null);
    const [newPresetName, setNewPresetName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    // Key Listener
    useEffect(() => {
        if (!listeningAction) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.code === 'Escape') {
                setListeningAction(null);
                return;
            }

            const currentKeys = currentMapping[listeningAction];
            // Don't add if already exists in this specific action mapping
            if (!currentKeys.includes(e.code)) {
                updateBinding(listeningAction, [...currentKeys, e.code]);
            }
            setListeningAction(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [listeningAction, currentMapping, updateBinding]);

    const handleRemoveKey = (action: ControlAction, keyToRemove: string) => {
        const currentKeys = currentMapping[action];
        updateBinding(action, currentKeys.filter(k => k !== keyToRemove));
    };

    const handleSavePreset = () => {
        if (newPresetName.trim()) {
            saveAsPreset(newPresetName.trim());
            setNewPresetName('');
            setShowSaveInput(false);
        }
    };

    const systemPresets = presets.filter(p => !p.isCustom);
    const customPresets = presets.filter(p => p.isCustom);

    // Define logical groups for the list view
    const groups = [
        {
            label: t('controls.group.movement'),
            actions: [ControlAction.THROTTLE, ControlAction.BRAKE, ControlAction.LEFT, ControlAction.RIGHT]
        },
        {
            label: t('controls.group.transmission'),
            actions: [ControlAction.SHIFT_UP, ControlAction.SHIFT_DOWN, ControlAction.CLUTCH]
        },
        {
            label: t('controls.group.functions'),
            actions: [ControlAction.HANDBRAKE, ControlAction.START_ENGINE, ControlAction.RESET]
        }
    ];

    const activePreset = presets.find(p => p.id === activePresetId);
    const activePresetName = activePreset 
        ? (activePreset.isCustom ? activePreset.name : t(activePreset.name)) 
        : t('controls.preset.custom');

    return (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/90 backdrop-blur z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-fade-in">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            {t('controls.title')}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('controls.desc')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 hover:text-slate-800 dark:hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col md:flex-row">
                    
                    {/* Left Panel: Presets Gallery */}
                    <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 p-6 flex flex-col gap-6 shrink-0">
                        
                        {/* System Presets */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{t('controls.system_presets')}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {systemPresets.map(preset => (
                                    <PresetPreview 
                                        key={preset.id}
                                        id={preset.id}
                                        name={t(preset.name)}
                                        mapping={preset.mapping}
                                        isActive={activePresetId === preset.id}
                                        onClick={() => applyPreset(preset.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Custom Presets */}
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('controls.user_presets')}</h3>
                                {activePresetId === null && !showSaveInput && (
                                    <button 
                                        onClick={() => setShowSaveInput(true)} 
                                        className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 py-1 rounded font-bold hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                                    >
                                        + {t('controls.preset.save')}
                                    </button>
                                )}
                            </div>

                            {showSaveInput && (
                                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg animate-fade-in">
                                    <input 
                                        type="text" 
                                        value={newPresetName}
                                        onChange={(e) => setNewPresetName(e.target.value)}
                                        placeholder={t('controls.preset.name_placeholder')}
                                        className="w-full text-sm bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-slate-800 dark:text-slate-200"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleSavePreset} className="flex-1 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500">
                                            {t('controls.preset.save_confirm')}
                                        </button>
                                        <button onClick={() => setShowSaveInput(false)} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-bold hover:bg-slate-300">
                                            {t('controls.preset.cancel')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                {customPresets.map(preset => (
                                    <PresetPreview 
                                        key={preset.id}
                                        id={preset.id}
                                        name={preset.name}
                                        mapping={preset.mapping}
                                        isActive={activePresetId === preset.id}
                                        onClick={() => applyPreset(preset.id)}
                                        onDelete={() => deletePreset(preset.id)}
                                    />
                                ))}
                                {customPresets.length === 0 && !showSaveInput && (
                                    <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-400 text-sm italic whitespace-pre-line">
                                        {t('controls.empty_custom')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Binding Editor */}
                    <div className="flex-1 p-6 md:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {activePresetName}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {activePresetId === null ? t('controls.unsaved_changes') : t('controls.using_saved')}
                                </p>
                            </div>
                            
                            {activePresetId === null && (
                                <span className="text-xs font-bold text-orange-500 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded border border-orange-200 dark:border-orange-800">
                                    {t('controls.modified')}
                                </span>
                            )}
                        </div>
                        
                        <div className="space-y-8">
                            {groups.map((group) => (
                                <div key={group.label}>
                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
                                        {group.label}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {group.actions.map(action => (
                                            <div key={action} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-slate-600 transition-colors group">
                                                <span className="font-medium text-sm text-slate-700 dark:text-slate-300 pl-1">
                                                    {t(`key.${action.toLowerCase()}`)}
                                                </span>
                                                
                                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                                    {currentMapping[action]?.length === 0 && (
                                                        <span className="text-xs text-red-400 italic mr-2 bg-red-50 dark:bg-red-900/10 px-2 py-0.5 rounded">
                                                            {t('controls.unbound')}
                                                        </span>
                                                    )}
                                                    
                                                    {currentMapping[action]?.map(key => (
                                                        <div key={key} className="relative group/key">
                                                            <KeyCap label={key} size="md" className="shadow-sm" />
                                                            <button 
                                                                onClick={() => handleRemoveKey(action, key)}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/key:opacity-100 transition-all scale-75 group-hover/key:scale-100 shadow-md z-10"
                                                                title="Unbind Key"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                    
                                                    <button 
                                                        onClick={() => setListeningAction(action)}
                                                        className={`ml-2 text-xs font-bold px-3 py-1.5 rounded border transition-all min-w-[3rem] ${
                                                            listeningAction === action 
                                                            ? 'bg-blue-500 text-white border-blue-600 animate-pulse ring-2 ring-blue-300 dark:ring-blue-900' 
                                                            : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                                        }`}
                                                    >
                                                        {listeningAction === action ? '...' : '+'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
