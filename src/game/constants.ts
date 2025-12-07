
export const PX_PER_METER = 20.0;

// === Scoring System ===
export const SCORING_CONSTANTS = {
    /** S Grade Threshold */
    GRADE_S_THRESHOLD: 95,

    /** A Grade Threshold */
    GRADE_A_THRESHOLD: 85,

    /** B Grade Threshold */
    GRADE_B_THRESHOLD: 70,

    /** C Grade Threshold */
    GRADE_C_THRESHOLD: 60,
} as const;

// === Event System Constants ===
export const EVENT_CONSTANTS = {
    /** Collision Cooldown (ms) */
    COLLISION_COOLDOWN_MS: 500,

    /** Area Entry Threshold (meters) */
    AREA_ENTER_THRESHOLD: 0.5,
} as const;
