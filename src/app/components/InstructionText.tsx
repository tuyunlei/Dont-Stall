
import React from 'react';
import { useControls } from '../contexts/ControlsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { KeyCap } from './KeyCap';
import { ControlAction } from '../../config/controls';

interface InstructionTextProps {
    textKey: string;
    params?: Record<string, string | number>;
    className?: string;
}

export const InstructionText: React.FC<InstructionTextProps> = ({ textKey, params, className = '' }) => {
    const { t } = useLanguage();
    const { getFirstKeyForAction } = useControls();

    const rawText = t(textKey, params);

    // Regex to match {action.ACTION_NAME}
    // We split the string by this pattern
    const parts = rawText.split(/(\{action\.[A-Z_]+\})/g);

    return (
        <div className={`whitespace-pre-line leading-loose ${className}`}>
            {parts.map((part, idx) => {
                if (part.startsWith('{action.') && part.endsWith('}')) {
                    const actionName = part.replace('{action.', '').replace('}', '') as keyof typeof ControlAction;
                    if (ControlAction[actionName]) {
                        const key = getFirstKeyForAction(ControlAction[actionName]);
                        return <KeyCap key={idx} label={key} size="sm" />;
                    }
                }
                return <span key={idx}>{part}</span>;
            })}
        </div>
    );
};
