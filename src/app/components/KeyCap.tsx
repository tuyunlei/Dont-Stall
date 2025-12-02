
import React from 'react';

interface KeyCapProps {
    label: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const formatKeyLabel = (code: string) => {
    // Handle chords like "Shift+KeyW"
    const parts = code.split('+');
    
    return parts.map(part => part
        .replace('Key', '')
        .replace('ArrowUp', '↑')
        .replace('ArrowDown', '↓')
        .replace('ArrowLeft', '←')
        .replace('ArrowRight', '→')
        .replace('Digit', '')
        .replace('ShiftLeft', 'Shift')
        .replace('ControlLeft', 'Ctrl')
        .replace('Space', 'Space')
        .replace('Comma', ',')
        .replace('Period', '.')
        .replace('Shift', '⇧')
        .replace('Ctrl', '⌃')
        .replace('Alt', '⌥')
    ).join('+');
};

export const KeyCap: React.FC<KeyCapProps> = ({ label, size = 'sm', className = '' }) => {
    const displayLabel = formatKeyLabel(label);
    
    const sizeClasses = {
        sm: 'h-5 min-w-[1.25rem] px-1 text-[10px] border-b-2',
        md: 'h-8 min-w-[2rem] px-2 text-xs border-b-4',
        lg: 'h-10 min-w-[2.5rem] px-3 text-sm border-b-4'
    };

    return (
        <span className={`
            inline-flex items-center justify-center 
            bg-slate-100 dark:bg-slate-700 
            text-slate-600 dark:text-slate-200 
            border-slate-300 dark:border-slate-900 
            rounded font-mono font-bold leading-none select-none shadow-sm mx-1 align-middle whitespace-nowrap
            ${sizeClasses[size]} 
            ${className}
        `}>
            {displayLabel}
        </span>
    );
};
