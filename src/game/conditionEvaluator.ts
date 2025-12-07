import { 
    ConditionDefinition, 
    AtomicCondition, 
    ConditionGroup, 
    TelemetryField,
    ComparisonOperator
} from './lessonTypes';
import { TelemetrySnapshot } from './telemetry';
import { GameEvent } from './events';

type OpStrategy = (actual: any, cond: AtomicCondition) => boolean;

const STRATEGIES: Record<ComparisonOperator, OpStrategy> = {
    'EQ': (val, cond) => val === cond.value,
    'NEQ': (val, cond) => val !== cond.value,
    'GT': (val, cond) => typeof val === 'number' && typeof cond.value === 'number' && val > cond.value,
    'GTE': (val, cond) => typeof val === 'number' && typeof cond.value === 'number' && val >= cond.value,
    'LT': (val, cond) => typeof val === 'number' && typeof cond.value === 'number' && val < cond.value,
    'LTE': (val, cond) => typeof val === 'number' && typeof cond.value === 'number' && val <= cond.value,
    'BETWEEN': (val, cond) => {
        if (typeof val !== 'number' || cond.min === undefined || cond.max === undefined) return false;
        return val >= cond.min && val <= cond.max;
    }
};

/**
 * 评估单个条件是否满足
 * 这是一个纯函数，不保留状态。
 */
export const evaluateCondition = (
    condition: ConditionDefinition, 
    telemetry: TelemetrySnapshot,
    events: GameEvent[] = []
): boolean => {
    if (condition.type === 'atomic') {
        return evaluateAtomic(condition, telemetry, events);
    } else {
        return evaluateGroup(condition, telemetry, events);
    }
};

const evaluateAtomic = (
    cond: AtomicCondition, 
    telemetry: TelemetrySnapshot,
    events: GameEvent[]
): boolean => {
    // 1. 获取被比较的值 (Subject)
    let actualValue: number | boolean | undefined;

    if (cond.field in telemetry) {
        actualValue = telemetry[cond.field as TelemetryField];
    } else {
        // 简单的事件存在性检查
        const eventMatch = events.find(e => e.type === cond.field);
        if (eventMatch) {
            actualValue = true;
        } else {
            return false;
        }
    }

    // 2. 使用策略模式执行比较
    const strategy = STRATEGIES[cond.op];
    if (!strategy) {
        console.warn(`Unknown operator: ${cond.op}`);
        return false;
    }

    return strategy(actualValue, cond);
};

const evaluateGroup = (
    group: ConditionGroup, 
    telemetry: TelemetrySnapshot,
    events: GameEvent[]
): boolean => {
    if (!group.conditions || group.conditions.length === 0) {
        if (group.type === 'and') return true;
        if (group.type === 'or') return false;
        return false;
    }

    if (group.type === 'not') {
        return !evaluateCondition(group.conditions[0], telemetry, events);
    }

    if (group.type === 'and') {
        return group.conditions.every(c => evaluateCondition(c, telemetry, events));
    }

    if (group.type === 'or') {
        return group.conditions.some(c => evaluateCondition(c, telemetry, events));
    }

    return false;
};