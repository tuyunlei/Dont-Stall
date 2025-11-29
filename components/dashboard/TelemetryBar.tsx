
import React from 'react';

export const TelemetryBar = ({ value, color, label }: { value: number; color: string; label: string }) => (
    <div className="flex flex-col items-center gap-1">
        <div className="w-6 h-32 bg-slate-900 rounded border border-slate-700 relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-between p-px opacity-20">
                {[...Array(10)].map((_, i) => <div key={i} className="w-full h-px bg-slate-400" />)}
            </div>
            <div className={`absolute bottom-0 left-0 right-0 transition-all duration-75 ease-linear ${color}`} style={{ height: `${Math.min(100, Math.max(0, value * 100))}%` }} />
        </div>
        <span className="text-[10px] font-mono text-slate-500 font-bold">{label}</span>
    </div>
);
