
import React, { useState, useEffect } from 'react';
import { useControls } from '../contexts/ControlsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ControlAction } from '../../config/controls';
import { KeyCap } from './KeyCap';

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
    const [isSaving, setIsSaving] = useState(false);

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
            // Don't add if already exists
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
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/90 backdrop-blur z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('controls.title')}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {/* Preset Selector */}
                    <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('controls.preset.label')}</label>
                        <div className="flex gap-4 items-center flex-wrap">
                            <select 
                                value={activePresetId || 'custom'} 
                                onChange={(e) => applyPreset(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                            >
                                <option value="custom" disabled>{t('controls.preset.custom')}</option>
                                {presets.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} {p.isCustom ? '(Custom)' : ''}</option>
                                ))}
                            </select>

                            {activePresetId === null && !isSaving && (
                                <button onClick={() => setIsSaving(true)} className="px-3 py-2 bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white rounded font-bold text-sm border border-blue-200 dark:border-blue-500 hover:bg-blue-200 dark:hover:bg-blue-500 transition-colors">
                                    {t('controls.preset.save')}
                                </button>
                            )}
                            
                            {/* Delete Custom Preset */}
                            {activePresetId && presets.find(p => p.id === activePresetId)?.isCustom && (
                                <button onClick={() => deletePreset(activePresetId)} className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded font-bold text-sm border border-red-200 dark:border-red-800 hover:bg-red-200 transition-colors">
                                    {t('controls.preset.delete')}
                                </button>
                            )}
                        </div>

                        {/* Save Preset Form */}
                        {isSaving && (
                            <div className="mt-3 flex gap-2 animate-fade-in">
                                <input 
                                    type="text" 
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    placeholder={t('controls.preset.name_placeholder')}
                                    className="flex-1 bg-white dark:bg-slate-950 border border-blue-400 rounded px-3 py-2 outline-none text-slate-800 dark:text-slate-200"
                                    autoFocus
                                />
                                <button onClick={handleSavePreset} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-sm transition-colors">
                                    {t('controls.preset.save_confirm')}
                                </button>
                                <button onClick={() => setIsSaving(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold hover:bg-slate-300 transition-colors">
                                    {t('controls.preset.cancel')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Controls List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                        {Object.values(ControlAction).map(action => (
                            <div key={action} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-2 min-w-[120px]">
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{t(`key.${action.toLowerCase()}`)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
                                    {currentMapping[action]?.length === 0 && (
                                         <span className="text-xs text-red-400 italic mr-2">{t('controls.unbound')}</span>
                                    )}
                                    {currentMapping[action]?.map(key => (
                                        <div key={key} className="relative group">
                                            <KeyCap label={key} size="md" />
                                            <button 
                                                onClick={() => handleRemoveKey(action, key)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                title="Remove"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    
                                    <button 
                                        onClick={() => setListeningAction(action)}
                                        className={`ml-1 text-xs font-bold px-3 py-1.5 rounded-md border transition-all ${
                                            listeningAction === action 
                                            ? 'bg-blue-500 text-white border-blue-600 animate-pulse ring-2 ring-blue-300 dark:ring-blue-900' 
                                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                                        }`}
                                    >
                                        {listeningAction === action ? t('controls.listening') : '+'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
