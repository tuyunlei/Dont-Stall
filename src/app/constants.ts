
/**
 * UI 和游戏逻辑常量
 */

// Re-export scoring constants from the game layer to ensure single source of truth
export { SCORING_CONSTANTS } from '../game/constants';

// === 仪表盘 ===
export const DASHBOARD_CONSTANTS = {
    /** RPM 熄火危险区最大值 */
    STALL_ZONE_MAX_RPM: 500,

    /** 红线预警区间 (距红线 RPM) */
    REDLINE_WARNING_OFFSET: 500,

    /** RPM 表最大值向上取整的单位 */
    RPM_GAUGE_ROUND_UNIT: 1000,
} as const;

// === 时间常量 ===
export const TIMING_CONSTANTS = {
    /** 提示显示时长 (ms) */
    HINT_DISPLAY_DURATION: 4000,

    /** UI 更新间隔 (ms) */
    UI_UPDATE_INTERVAL: 33,

    /** FPS 计算间隔 (ms) */
    FPS_CALC_INTERVAL: 500,

    /** 消息显示时长 (ms) */
    MESSAGE_DISPLAY_DURATION: 2000,
} as const;
