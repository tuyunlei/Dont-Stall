
export type EventType =
    | 'COLLISION'      // 发生碰撞
    | 'ENTER_AREA'     // 进入区域
    | 'LEAVE_AREA'     // 离开区域
    | 'GEAR_CHANGE'    // 换挡事件
    | 'STALL';         // 熄火事件

// 为每种事件类型定义具体的 data 结构
export interface CollisionEventData {
    objectId: string;
    impactForce?: number;
}

export interface AreaEventData {
    areaId: string;
    areaType?: string;
}

export interface GearChangeEventData {
    fromGear: number;
    toGear: number;
}

export interface StallEventData {
    reason: 'clutch_dump' | 'low_rpm' | 'overload';
    rpm?: number;
}

// 事件数据联合类型
export type GameEventData =
    | CollisionEventData
    | AreaEventData
    | GearChangeEventData
    | StallEventData;

// 基础事件接口
interface BaseGameEvent {
    type: EventType;
    timestamp: number;
    objectId?: string;
}

// 类型安全的事件定义
export interface CollisionEvent extends BaseGameEvent {
    type: 'COLLISION';
    data?: CollisionEventData;
}

export interface EnterAreaEvent extends BaseGameEvent {
    type: 'ENTER_AREA';
    data?: AreaEventData;
}

export interface LeaveAreaEvent extends BaseGameEvent {
    type: 'LEAVE_AREA';
    data?: AreaEventData;
}

export interface GearChangeEvent extends BaseGameEvent {
    type: 'GEAR_CHANGE';
    data?: GearChangeEventData;
}

export interface StallEvent extends BaseGameEvent {
    type: 'STALL';
    data?: StallEventData;
}

// 导出联合类型供外部使用
export type GameEvent =
    | CollisionEvent
    | EnterAreaEvent
    | LeaveAreaEvent
    | GearChangeEvent
    | StallEvent;

// 类型守卫函数
export function isCollisionEvent(event: GameEvent): event is CollisionEvent {
    return event.type === 'COLLISION';
}

export function isAreaEvent(event: GameEvent): event is EnterAreaEvent | LeaveAreaEvent {
    return event.type === 'ENTER_AREA' || event.type === 'LEAVE_AREA';
}

export function isGearChangeEvent(event: GameEvent): event is GearChangeEvent {
    return event.type === 'GEAR_CHANGE';
}

export function isStallEvent(event: GameEvent): event is StallEvent {
    return event.type === 'STALL';
}

// 事件创建辅助函数
export function createGameEvent<T extends EventType>(
    type: T,
    data?: T extends 'COLLISION' ? CollisionEventData :
           T extends 'ENTER_AREA' | 'LEAVE_AREA' ? AreaEventData :
           T extends 'GEAR_CHANGE' ? GearChangeEventData :
           T extends 'STALL' ? StallEventData :
           never,
    objectId?: string
): GameEvent {
    return {
        type,
        timestamp: performance.now(),
        objectId,
        data
    } as GameEvent;
}
