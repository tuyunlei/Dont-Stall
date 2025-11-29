
import React from 'react';

export const SteeringWheelDisplay = ({ angle }: { angle: number }) => {
    return (
        <div className="flex flex-col items-center gap-1">
             <div className="w-32 h-32 rounded-full border-4 border-slate-700 bg-slate-800 relative flex items-center justify-center shadow-inner overflow-hidden">
                <div 
                    className="w-full h-full relative"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    <div className="absolute inset-0 rounded-full border-2 border-slate-600 opacity-50"></div>
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-900 -mt-1"></div> 
                    <div className="absolute top-1/2 left-1/2 w-2 h-1/2 bg-slate-900 -ml-1"></div> 
                    <div className="absolute top-0 left-1/2 w-1 h-4 bg-red-500 -ml-0.5 z-10"></div>
                </div>

                <div className="absolute w-8 h-8 bg-slate-900 rounded-full border border-slate-600 z-20 flex items-center justify-center">
                     <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800"></div>
                </div>
             </div>
             <div className="flex flex-col items-center -mt-1">
                 <span className="text-[10px] font-mono text-slate-500 font-bold">STEER</span>
                 <span className={`text-[9px] font-mono ${Math.abs(angle) > 360 ? 'text-red-400' : 'text-slate-600'}`}>
                     {Math.round(angle)}°
                 </span>
             </div>
        </div>
    );
};
