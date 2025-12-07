
import { PhysicsState, Vector2 } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { MapObject } from '../../game/types';

export interface RendererContext {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    isDark: boolean;
    cameraPos: Vector2;
}

export interface IRenderer {
    render(ctx: RendererContext, state: PhysicsState, config: CarConfig, objects: MapObject[]): void;
}
