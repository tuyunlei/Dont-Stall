
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const HandbrakeLever = ({ value, isDark }: { value: number, isDark?: boolean }) => {
    const { t } = useLanguage();
    
    // 角度映射：
    // Value 0.0 (放下) -> 75度 (顺时针倒下，接近水平)
    // Value 1.0 (拉起) -> -15度 (逆时针向后拉，竖直偏后)
    const angle = 75 - (value * 90);

    const handleColor = isDark ? '#334155' : '#475569';
    const rodColor = isDark ? '#94a3b8' : '#cbd5e1'; 
    const baseColor = isDark ? '#1e293b' : '#334155';

    // 布局配置
    // 为了容纳倒下的长杆，我们需要较宽的 ViewBox
    // Pivot X 设为 36，意味着左侧留 36px (足够容纳后倾)，右侧留 140-36=104px (足够容纳倒下)
    const VIEWBOX_W = 140;
    const VIEWBOX_H = 128;
    const PIVOT_X = 36; 
    const PIVOT_Y = 110;

    return (
        <div className="flex flex-col items-start gap-1 w-32 relative group">
            <div className="relative w-full h-32 flex items-end overflow-visible select-none">
                <svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`} className="overflow-visible">
                    {/* 底座 */}
                    <ellipse cx={PIVOT_X} cy={PIVOT_Y} rx="12" ry="6" fill={baseColor} />
                    
                    {/* 旋转组 */}
                    <g transform={`rotate(${angle}, ${PIVOT_X}, ${PIVOT_Y})`}>
                        {/* 杆身 (相对于 Pivot X 居中) */}
                        <rect x={PIVOT_X - 4} y="40" width="8" height="70" fill={rodColor} rx="2" />
                        
                        {/* 握把 */}
                        <rect x={PIVOT_X - 8} y="10" width="16" height="50" fill={handleColor} rx="4" />
                        
                        {/* 按钮 */}
                        <rect x={PIVOT_X - 3} y="5" width="6" height="6" fill="#e2e8f0" rx="1" />
                        
                        {/* 纹理 */}
                        <line x1={PIVOT_X - 8} y1="20" x2={PIVOT_X + 8} y2="20" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
                        <line x1={PIVOT_X - 8} y1="30" x2={PIVOT_X + 8} y2="30" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
                        <line x1={PIVOT_X - 8} y1="40" x2={PIVOT_X + 8} y2="40" stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>
                    </g>
                </svg>
            </div>
            
            {/* 标签与指示灯 */}
            {/* 这里的 padding-right 是为了让文字视觉上对齐到底座(Pivot)，而不是整个 SVG 的中心 */}
            <div className="flex flex-col items-center w-full pr-[3.5rem]"> 
                 <span className="text-[10px] font-mono text-slate-500 font-bold uppercase whitespace-nowrap">
                    {t('dash.handbrake')}
                </span>
                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${value > 0.1 ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-slate-300 dark:bg-slate-700'}`} />
            </div>
        </div>
    );
};
