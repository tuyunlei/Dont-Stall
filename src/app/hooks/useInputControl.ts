

import { useEffect, useRef } from 'react';
import { InputState } from '../../physics/types';
import { useControls } from '../contexts/ControlsContext';
import { ControlAction, KeyMapping } from '../../config/controls';
import { getEventKeyString } from '../../utils/input';

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

const DOUBLE_TAP_THRESHOLD_MS = 250;

export const useInputControl = () => {
    const { currentMapping } = useControls();
    
    // We use a Ref for the mapping to access the latest version inside the event listener
    const mappingRef = useRef(currentMapping);
    const keyLookupRef = useRef(generateKeyMap(currentMapping));

    // Track last press time for double-tap detection
    const lastPressTimeRef = useRef<Map<ControlAction, number>>(new Map());

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
        handbrake: false,
        // Virtual Init
        throttleInc: false, throttleDec: false,
        brakeInc: false, brakeDec: false,
        clutchInc: false, clutchDec: false,
        steerLeftInc: false, steerRightInc: false
    });

    const triggerRefs = useRef<{
        toggleEngine: boolean;
        shiftUp: boolean;
        shiftDown: boolean;
        reset: boolean;
        toggleHandbrake: boolean;
        
        // Virtual Shortcuts
        setVirtualThrottleFull: boolean;
        setVirtualThrottleZero: boolean;
        setVirtualBrakeFull: boolean;
        setVirtualBrakeZero: boolean;
        setVirtualClutchFull: boolean;
        setVirtualClutchZero: boolean;
        setVirtualSteeringLeftFull: boolean;
        setVirtualSteeringRightFull: boolean;
    }>({ 
        toggleEngine: false, shiftUp: false, shiftDown: false, reset: false, toggleHandbrake: false,
        setVirtualThrottleFull: false, setVirtualThrottleZero: false,
        setVirtualBrakeFull: false, setVirtualBrakeZero: false,
        setVirtualClutchFull: false, setVirtualClutchZero: false,
        setVirtualSteeringLeftFull: false, setVirtualSteeringRightFull: false
    });

    useEffect(() => {
        const updateInputs = (actions: ControlAction[], isDown: boolean, isDoubleTap: boolean = false) => {
            actions.forEach(action => {
                switch (action) {
                    // Digital
                    case ControlAction.THROTTLE: inputsRef.current.throttle = isDown; break;
                    case ControlAction.BRAKE: inputsRef.current.brake = isDown; break;
                    case ControlAction.LEFT: inputsRef.current.left = isDown; break;
                    case ControlAction.RIGHT: inputsRef.current.right = isDown; break;
                    case ControlAction.CLUTCH: inputsRef.current.clutch = isDown; break;
                    case ControlAction.HANDBRAKE: {
                        inputsRef.current.handbrake = isDown;
                        if (isDown) triggerRefs.current.toggleHandbrake = true;
                        break;
                    }
                    // Triggers (Only on Down)
                    case ControlAction.START_ENGINE: if (isDown) triggerRefs.current.toggleEngine = true; break;
                    case ControlAction.SHIFT_UP: if (isDown) triggerRefs.current.shiftUp = true; break;
                    case ControlAction.SHIFT_DOWN: if (isDown) triggerRefs.current.shiftDown = true; break;
                    case ControlAction.RESET: if (isDown) triggerRefs.current.reset = true; break;

                    // Incremental (Virtual Pedals) + Double Tap Logic
                    case ControlAction.THROTTLE_INC: 
                        inputsRef.current.throttleInc = isDown;
                        if (isDoubleTap) triggerRefs.current.setVirtualThrottleFull = true;
                        break;
                    case ControlAction.THROTTLE_DEC: 
                        inputsRef.current.throttleDec = isDown; 
                        if (isDoubleTap) triggerRefs.current.setVirtualThrottleZero = true;
                        break;
                    
                    case ControlAction.BRAKE_INC: 
                        inputsRef.current.brakeInc = isDown; 
                        if (isDoubleTap) triggerRefs.current.setVirtualBrakeFull = true;
                        break;
                    case ControlAction.BRAKE_DEC: 
                        inputsRef.current.brakeDec = isDown; 
                        if (isDoubleTap) triggerRefs.current.setVirtualBrakeZero = true;
                        break;

                    case ControlAction.CLUTCH_INC: 
                        inputsRef.current.clutchInc = isDown; 
                        if (isDoubleTap) triggerRefs.current.setVirtualClutchFull = true;
                        break;
                    case ControlAction.CLUTCH_DEC: 
                        inputsRef.current.clutchDec = isDown; 
                        if (isDoubleTap) triggerRefs.current.setVirtualClutchZero = true;
                        break;

                    case ControlAction.STEER_LEFT_INC:
                        inputsRef.current.steerLeftInc = isDown;
                        if (isDoubleTap) triggerRefs.current.setVirtualSteeringLeftFull = true;
                        break;
                    case ControlAction.STEER_RIGHT_INC:
                        inputsRef.current.steerRightInc = isDown;
                        if (isDoubleTap) triggerRefs.current.setVirtualSteeringRightFull = true;
                        break;
                }
            });
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            
            const comboKey = getEventKeyString(e);
            
            // Priority 1: Exact Combo Match (e.g. "Shift+KeyW")
            let actions = keyLookupRef.current[comboKey];

            // Priority 2: Base Key Match (e.g. "KeyW")
            if (!actions && comboKey !== e.code) {
                actions = keyLookupRef.current[e.code];
            }

            if (!actions) return;

            e.preventDefault();

            // Double Tap Detection
            const now = performance.now();
            let isDoubleTap = false;
            
            for (const action of actions) {
                const lastTime = lastPressTimeRef.current.get(action) || 0;
                if (now - lastTime < DOUBLE_TAP_THRESHOLD_MS) {
                    isDoubleTap = true;
                }
                lastPressTimeRef.current.set(action, now);
            }

            updateInputs(actions, true, isDoubleTap);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const comboKey = getEventKeyString(e);
            const baseKey = e.code;
            
            // On KeyUp, we check both the combo string and the base key.
            // Since modifier state changes *during* this event (shiftKey becomes false),
            // getEventKeyString(e) might differ from KeyDown. 
            // However, with our logic:
            // KeyDown Shift: code=ShiftLeft, shiftKey=true -> "ShiftLeft"
            // KeyUp Shift: code=ShiftLeft, shiftKey=false -> "ShiftLeft"
            // So for single modifiers, it's consistent now.
            
            // For Combos (e.g. Shift+W):
            // KeyDown W: code=KeyW, shiftKey=true -> "Shift+KeyW"
            // KeyUp W: code=KeyW, shiftKey=true (usually still true) -> "Shift+KeyW"
            
            const comboActions = keyLookupRef.current[comboKey];
            const baseActions = keyLookupRef.current[baseKey];
            
            if (comboActions) updateInputs(comboActions, false);
            if (baseActions && baseActions !== comboActions) updateInputs(baseActions, false);
        };

        const handleBlur = () => {
            // Safety: Clear all inputs on window blur
            inputsRef.current = {
                throttle: false, brake: false, left: false, right: false, clutch: false, handbrake: false,
                throttleInc: false, throttleDec: false,
                brakeInc: false, brakeDec: false,
                clutchInc: false, clutchDec: false,
                steerLeftInc: false, steerRightInc: false
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
        // Reset triggers
        triggerRefs.current = {
            toggleEngine: false,
            shiftUp: false,
            shiftDown: false,
            reset: false,
            toggleHandbrake: false,
            setVirtualThrottleFull: false, setVirtualThrottleZero: false,
            setVirtualBrakeFull: false, setVirtualBrakeZero: false,
            setVirtualClutchFull: false, setVirtualClutchZero: false,
            setVirtualSteeringLeftFull: false, setVirtualSteeringRightFull: false
        };
        return triggers;
    };

    return { inputsRef, consumeTriggers };
};