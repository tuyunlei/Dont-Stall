
import React, { useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGameLoopState } from '../../contexts/GameLoopContext';

interface HandbrakeLeverProps {
    value: number; // Low-freq fallback
    isDark?: boolean;
}

export const HandbrakeLever = ({ value, isDark }: HandbrakeLeverProps) => {
    const { t } = useLanguage();
    const latestStateRef = useGameLoopState();
    const leverRef = useRef<SVGGElement>(null);
    
    const VIEWBOX_W = 140;
    const VIEWBOX_H = 128;
    const PIVOT_X = 36; 
    const PIVOT_Y = 110;

    useEffect(() => {
        if (!latestStateRef) return;

        let rafId: number;

        const loop = () => {
            if (latestStateRef.current) {
                const currentVal = latestStateRef.current.handbrakeInput;
                const currentAngle = 75 - (currentVal * 90);

                if (leverRef.current) {
                    leverRef.current.setAttribute('transform', `rotate(${currentAngle}, ${PIVOT_X}, ${PIVOT_Y})`);
                }
            }
            rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [latestStateRef]);

    const handleColor = isDark ? '#334155' : '#475569';
    const rodColor = isDark ? '#94a3b8' : '#cbd5e1'; 
    const baseColor = isDark ? '#1e293b' : '#334155';

    const fallbackAngle = 75 - (value * 90);
    const groupProps = latestStateRef.current ? {} : { transform: `rotate(${fallbackAngle}, ${PIVOT_X}, ${PIVOT_Y})` };

    return (
        <div className="flex flex-col items-start gap-1 w-32 relative group">
            <div className="relative w-full h-32 flex items-end overflow-visible select-none">
                <svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className="overflow-visible">
                    <ellipse cx={PIVOT_X} cy={PIVOT_Y} rx="12" ry="6" fill={baseColor} />
                    <g ref={leverRef} {...groupProps}>
                        <rect x={PIVOT_X - 4} y="40" width="8" height="70" fill={rodColor} rx="2" />
                        <rect x={PIVOT_X - 8} y="10" width="16" height="50" fill={handleColor} rx="4" />
                        <rect x={PIVOT_X - 3} y="5" width="6" height="6" fill="#e2e8f0" rx="1" />
                        <line x1={PIVOT_X - 8} y1="20" x2={PIVOT_X + 8} y2="20" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
                        <line x1={PIVOT_X - 8} y1="30" x2={PIVOT_X + 8} y2="30" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
                        <line x1={PIVOT_X - 8} y1="40" x2={PIVOT_X + 8} y2="40" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
                    </g>
                </svg>
            </div>
            
            <div className="flex flex-col items-center w-full pr-[3.5rem]"> 
                 <span className="text-[10px] font-mono text-slate-500 font-bold uppercase whitespace-nowrap">
                    {t('dash.handbrake')}
                </span>
                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${value > 0.1 ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-slate-300 dark:bg-slate-700'}`} />
            </div>
        </div>
    );
};
