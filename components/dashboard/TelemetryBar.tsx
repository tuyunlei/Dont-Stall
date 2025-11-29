
import React from 'react';

export const TelemetryBar = ({ value, color, label, isDark }: { value: number; color: string; label: string; isDark?: boolean }) => (
    <div className="flex flex-col items-center gap-1">
        <div className={`w-6 h-32 rounded border relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'}`}>
            <div className="absolute inset-0 flex flex-col justify-between p-px opacity-20">
                {[...Array(10)].map((_, i) => <div key={i} className={`w-full h-px ${isDark ? 'bg-slate-400' : 'bg-slate-500'}`} />)}
            </div>
            <div className={`absolute bottom-0 left-0 right-0 transition-all duration-75 ease-linear ${color}`} style={{ height: `${Math.min(100, Math.max(0, value * 100))}%` }} />
        </div>
        <span className="text-[10px] font-mono text-slate-500 font-bold">{label}</span>
    </div>
);
