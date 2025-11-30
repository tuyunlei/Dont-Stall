
import { useEffect, useRef } from 'react';
import { InputState } from '../../physics/types';
import { useControls } from '../contexts/ControlsContext';
import { ControlAction, KeyMapping } from '../../config/controls';

// Helper to reverse map keys to actions for O(1) lookup
const generateKeyMap = (mapping: KeyMapping): Record<string, ControlAction[]> => {
    const map: Record<string, ControlAction[]> = {};
    Object.entries(mapping).forEach(([action, keys]) => {
        keys.forEach(key => {
            if (!map[key]) map[key] = [];
            map[key].push(action as ControlAction);
        });
    });
    return map;
};

export const useInputControl = () => {
    const { currentMapping } = useControls();
    
    // We use a Ref for the mapping to access the latest version inside the event listener
    const mappingRef = useRef(currentMapping);
    const keyLookupRef = useRef(generateKeyMap(currentMapping));

    useEffect(() => {
        mappingRef.current = currentMapping;
        keyLookupRef.current = generateKeyMap(currentMapping);
    }, [currentMapping]);

    const inputsRef = useRef<InputState>({
        throttle: false,
        brake: false,
        left: false,
        right: false,
        clutch: false,
        handbrake: false
    });

    const triggerRefs = useRef<{
        toggleEngine: boolean;
        shiftUp: boolean;
        shiftDown: boolean;
        reset: boolean;
    }>({ toggleEngine: false, shiftUp: false, shiftDown: false, reset: false });

    // Track which physical keys are currently held down to handle the many-to-one logic.
    const heldKeysRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            
            const actions = keyLookupRef.current[e.code];
            if (!actions) return;

            // Prevent default for game keys
            if (actions.some(a => [
                ControlAction.THROTTLE, 
                ControlAction.BRAKE, 
                ControlAction.HANDBRAKE, 
                ControlAction.LEFT, 
                ControlAction.RIGHT,
                ControlAction.SHIFT_UP,
                ControlAction.SHIFT_DOWN
            ].includes(a))) {
                e.preventDefault();
            }

            heldKeysRef.current.add(e.code);

            actions.forEach(action => {
                switch (action) {
                    case ControlAction.THROTTLE: inputsRef.current.throttle = true; break;
                    case ControlAction.BRAKE: inputsRef.current.brake = true; break;
                    case ControlAction.LEFT: inputsRef.current.left = true; break;
                    case ControlAction.RIGHT: inputsRef.current.right = true; break;
                    case ControlAction.CLUTCH: inputsRef.current.clutch = true; break;
                    case ControlAction.HANDBRAKE: inputsRef.current.handbrake = true; break;
                    // Triggers
                    case ControlAction.START_ENGINE: triggerRefs.current.toggleEngine = true; break;
                    case ControlAction.SHIFT_UP: triggerRefs.current.shiftUp = true; break;
                    case ControlAction.SHIFT_DOWN: triggerRefs.current.shiftDown = true; break;
                    case ControlAction.RESET: triggerRefs.current.reset = true; break;
                }
            });
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const actions = keyLookupRef.current[e.code];
            if (!actions) return;

            heldKeysRef.current.delete(e.code);

            actions.forEach(action => {
                // Before turning off an input, check if ANY OTHER key mapped to this action is still held
                // This is the core of 1-to-many support (OR logic)
                const mappedKeys = mappingRef.current[action];
                const isStillHeld = mappedKeys.some(k => heldKeysRef.current.has(k));

                if (!isStillHeld) {
                    switch (action) {
                        case ControlAction.THROTTLE: inputsRef.current.throttle = false; break;
                        case ControlAction.BRAKE: inputsRef.current.brake = false; break;
                        case ControlAction.LEFT: inputsRef.current.left = false; break;
                        case ControlAction.RIGHT: inputsRef.current.right = false; break;
                        case ControlAction.CLUTCH: inputsRef.current.clutch = false; break;
                        case ControlAction.HANDBRAKE: inputsRef.current.handbrake = false; break;
                    }
                }
            });
        };

        const handleBlur = () => {
            heldKeysRef.current.clear();
            inputsRef.current = {
                throttle: false,
                brake: false,
                left: false,
                right: false,
                clutch: false,
                handbrake: false
            };
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    const consumeTriggers = () => {
        const triggers = { ...triggerRefs.current };
        triggerRefs.current = {
            toggleEngine: false,
            shiftUp: false,
            shiftDown: false,
            reset: false
        };
        return triggers;
    };

    return { inputsRef, consumeTriggers };
};
