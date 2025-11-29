
import { useEffect, useRef } from 'react';
import { KEYS } from '../constants';
import { InputState } from '../services/physics/inputSystem';

export const useInputControl = () => {
    const inputsRef = useRef<InputState>({
        throttle: false,
        brake: false,
        left: false,
        right: false,
        clutch: false
    });

    const triggerRefs = useRef<{
        toggleEngine: boolean;
        shiftUp: boolean;
        shiftDown: boolean;
        reset: boolean;
    }>({ toggleEngine: false, shiftUp: false, shiftDown: false, reset: false });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ([KEYS.THROTTLE, KEYS.BRAKE, KEYS.LEFT, KEYS.RIGHT].includes(e.key)) {
                e.preventDefault();
            }
            switch (e.key) {
                case KEYS.THROTTLE: inputsRef.current.throttle = true; break;
                case KEYS.BRAKE: inputsRef.current.brake = true; break;
                case KEYS.LEFT: inputsRef.current.left = true; break;
                case KEYS.RIGHT: inputsRef.current.right = true; break;
                case KEYS.CLUTCH: inputsRef.current.clutch = true; break;
                case KEYS.START_ENGINE: triggerRefs.current.toggleEngine = true; break;
                case KEYS.SHIFT_UP: triggerRefs.current.shiftUp = true; break;
                case KEYS.SHIFT_DOWN: triggerRefs.current.shiftDown = true; break;
                case KEYS.RESET: triggerRefs.current.reset = true; break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.key) {
                case KEYS.THROTTLE: inputsRef.current.throttle = false; break;
                case KEYS.BRAKE: inputsRef.current.brake = false; break;
                case KEYS.LEFT: inputsRef.current.left = false; break;
                case KEYS.RIGHT: inputsRef.current.right = false; break;
                case KEYS.CLUTCH: inputsRef.current.clutch = false; break;
            }
        };

        const handleBlur = () => {
            inputsRef.current = {
                throttle: false,
                brake: false,
                left: false,
                right: false,
                clutch: false
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

    // 消费一次性触发事件
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
