
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ControlAction, ControlPreset, DEFAULT_PRESETS, KeyMapping } from '../../config/controls';

interface ControlsContextType {
  activePresetId: string | null;
  currentMapping: KeyMapping;
  presets: ControlPreset[];
  
  applyPreset: (presetId: string) => void;
  updateBinding: (action: ControlAction, keys: string[]) => void;
  saveAsPreset: (name: string) => void;
  deletePreset: (id: string) => void;
  resetToDefault: () => void;
  getFirstKeyForAction: (action: ControlAction) => string;
}

const ControlsContext = createContext<ControlsContextType | undefined>(undefined);

const STORAGE_KEY_PRESETS = 'ds_control_presets_v2';
const STORAGE_KEY_ACTIVE = 'ds_active_mapping_v2';
const STORAGE_KEY_ACTIVE_ID = 'ds_active_preset_id_v2';

export const ControlsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [presets, setPresets] = useState<ControlPreset[]>(DEFAULT_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string | null>('wasd');
  // Initialize with a deep copy of the default
  const [currentMapping, setCurrentMapping] = useState<KeyMapping>(JSON.parse(JSON.stringify(DEFAULT_PRESETS[0].mapping)));

  // Load from local storage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem(STORAGE_KEY_PRESETS);
    const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    const savedMapping = localStorage.getItem(STORAGE_KEY_ACTIVE);

    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }

    if (savedMapping) {
      setCurrentMapping(JSON.parse(savedMapping));
      setActivePresetId(savedActiveId || null);
    }
  }, []);

  // Save changes to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(currentMapping));
    if (activePresetId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activePresetId);
    } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
  }, [currentMapping, activePresetId]);

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setCurrentMapping(JSON.parse(JSON.stringify(preset.mapping)));
      setActivePresetId(presetId);
    }
  };

  const updateBinding = (action: ControlAction, keys: string[]) => {
    setCurrentMapping(prev => ({
      ...prev,
      [action]: keys
    }));
    // When modified, we are no longer on a strictly defined preset
    setActivePresetId(null);
  };

  const saveAsPreset = (name: string) => {
    const newId = `custom_${Date.now()}`;
    const newPreset: ControlPreset = {
      id: newId,
      name,
      mapping: JSON.parse(JSON.stringify(currentMapping)),
      isCustom: true
    };
    setPresets(prev => [...prev, newPreset]);
    setActivePresetId(newId);
  };

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (activePresetId === id) {
       // If deleting active preset, keep mapping but clear ID (it becomes 'custom')
       setActivePresetId(null);
    }
  };

  const resetToDefault = () => {
      setPresets(DEFAULT_PRESETS);
      applyPreset('wasd');
  };

  const getFirstKeyForAction = (action: ControlAction): string => {
      const keys = currentMapping[action];
      return keys && keys.length > 0 ? keys[0] : '?';
  };

  return (
    <ControlsContext.Provider value={{ 
      activePresetId, 
      currentMapping, 
      presets, 
      applyPreset, 
      updateBinding, 
      saveAsPreset,
      deletePreset,
      resetToDefault,
      getFirstKeyForAction
    }}>
      {children}
    </ControlsContext.Provider>
  );
};

export const useControls = () => {
  const context = useContext(ControlsContext);
  if (!context) {
    throw new Error('useControls must be used within a ControlsProvider');
  }
  return context;
};
