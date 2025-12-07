
export const getEventKeyString = (e: KeyboardEvent): string => {
    const isShift = e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    const isCtrl = e.code === 'ControlLeft' || e.code === 'ControlRight';
    const isAlt = e.code === 'AltLeft' || e.code === 'AltRight';

    const parts = [];
    // Only add modifier prefix if the key itself isn't that modifier
    if (e.shiftKey && !isShift) parts.push('Shift');
    if (e.ctrlKey && !isCtrl) parts.push('Ctrl');
    if (e.altKey && !isAlt) parts.push('Alt');

    parts.push(e.code);
    return parts.join('+');
};
