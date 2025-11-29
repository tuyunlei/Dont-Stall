
import React from 'react';
import { describeArc, mapValueToAngle, polarToCartesian } from '../../utils/math';

interface Zone {
    min: number;
    max: number;
    color: string;
    width?: number;
    opacity?: number;
}

interface GaugeProps {
    value: number;
    min?: number;
    max: number;
    label: string;
    unit: string;
    zones?: Zone[];
    majorTicksCount?: number;
    minorTicksPerMajor?: number;
    labelDivider?: number;
    isDark?: boolean;
}

export const Gauge: React.FC<GaugeProps> = ({
    value,
    min = 0,
    max,
    label,
    unit,
    zones = [],
    majorTicksCount = 5,
    minorTicksPerMajor = 4,
    labelDivider = 1,
    isDark = true
}) => {
    const CX = 64;
    const CY = 64;
    const RADIUS = 56;
    const START_ANGLE = -135;
    const END_ANGLE = 135;
    const currentAngle = mapValueToAngle(value, min, max);

    const strokeColor = isDark ? "#e2e8f0" : "#334155";
    const subTickColor = isDark ? "#64748b" : "#94a3b8";
    const labelColor = isDark ? "#94a3b8" : "#64748b";
    const ringColor = isDark ? "#1e293b" : "#cbd5e1";
    const textColor = isDark ? "white" : "#1e293b";

    // Generate Ticks
    const ticks = [];
    const totalRange = max - min;
    const majorStep = totalRange / majorTicksCount;

    for (let v = min; v <= max; v += majorStep) {
        const angle = mapValueToAngle(v, min, max);
        const p1 = polarToCartesian(CX, CY, RADIUS, angle);
        const p2 = polarToCartesian(CX, CY, RADIUS - 8, angle);

        ticks.push(
            <line key={`maj-${v}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={strokeColor} strokeWidth="2" />
        );

        const labelRadius = RADIUS - 18;
        const pLabel = polarToCartesian(CX, CY, labelRadius, angle);
        ticks.push(
            <text key={`lbl-${v}`} x={pLabel.x} y={pLabel.y} fill={labelColor} fontSize="8" fontWeight="600" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">
                {Math.round(v / labelDivider)}
            </text>
        );

        if (v < max) {
            const minorStep = majorStep / (minorTicksPerMajor + 1);
            for (let m = 1; m <= minorTicksPerMajor; m++) {
                const minorV = v + m * minorStep;
                if (minorV > max) break;
                const mAngle = mapValueToAngle(minorV, min, max);
                const mp1 = polarToCartesian(CX, CY, RADIUS, mAngle);
                const mp2 = polarToCartesian(CX, CY, RADIUS - 4, mAngle);
                ticks.push(
                    <line key={`min-${minorV}`} x1={mp1.x} y1={mp1.y} x2={mp2.x} y2={mp2.y} stroke={subTickColor} strokeWidth="1" />
                );
            }
        }
    }

    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 128 128" className="overflow-visible select-none">
                <defs>
                    <linearGradient id="needle-gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                </defs>
                <path d={describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE)} fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round" />
                {zones.map((zone, i) => {
                    const zMin = Math.max(min, zone.min);
                    const zMax = Math.min(max, zone.max);
                    if (zMin >= zMax) return null;
                    const start = mapValueToAngle(zMin, min, max);
                    const end = mapValueToAngle(zMax, min, max);
                    return <path key={`zone-${i}`} d={describeArc(CX, CY, RADIUS, start, end)} fill="none" stroke={zone.color} strokeWidth={zone.width || 6} strokeOpacity={zone.opacity || 1} strokeLinecap="butt" />;
                })}
                <g>{ticks}</g>
                <g transform={`rotate(${currentAngle}, ${CX}, ${CY})`}>
                    <path d={`M${CX - 1},${CY} L${CX},${CY - RADIUS + 4} L${CX + 1},${CY}`} fill="black" opacity="0.3" filter="blur(2px)" transform="translate(1, 1)" />
                    <path d={`M${CX - 2},${CY + 8} L${CX},${CY - RADIUS + 2} L${CX + 2},${CY + 8}`} fill="url(#needle-gradient)" />
                    <circle cx={CX} cy={CY} r="3" fill="#cbd5e1" />
                    <circle cx={CX} cy={CY} r="1.5" fill="#1e293b" />
                </g>
            </svg>
            <div className="absolute top-[60%] flex flex-col items-center pointer-events-none">
                <span className="text-2xl font-bold font-mono tracking-tighter drop-shadow-md" style={{ color: textColor }}>{Math.round(value)}</span>
                <div className="flex flex-col items-center -mt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{label}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{unit}</span>
                </div>
            </div>
        </div>
    );
};
