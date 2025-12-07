
import { PhysicsState, Vector2 } from '../physics/types';
import { CarConfig } from '../config/types';
import { MapObject } from '../game/types';
import { PX_PER_METER } from '../game/constants';
import { GridRenderer } from './render/GridRenderer';
import { MapRenderer } from './render/MapRenderer';
import { CarRenderer } from './render/CarRenderer';
import { IRenderer } from './render/types';

export class RenderService {
    private ctx: CanvasRenderingContext2D | null = null;
    private width: number = 0;
    private height: number = 0;
    private isDark: boolean = true;
    
    // Sub-renderers
    private renderers: IRenderer[];

    constructor() {
        this.renderers = [
            new GridRenderer(),
            new MapRenderer(),
            new CarRenderer()
        ];
    }

    setContext(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    setTheme(isDark: boolean) {
        this.isDark = isDark;
    }

    clear() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    render(state: PhysicsState, config: CarConfig, objects: MapObject[]) {
        if (!this.ctx) return;

        // Clear previous frame to prevent ghosting/trails
        this.clear();

        const ctx = this.ctx;
        
        // 1. Setup Camera
        ctx.save();
        const camX = state.position.x * PX_PER_METER;
        const camY = state.position.y * PX_PER_METER;
        ctx.translate(this.width / 2 - camX, this.height / 2 - camY);

        // 2. Prepare Context Object
        const rendererContext = {
            ctx: this.ctx,
            width: this.width,
            height: this.height,
            isDark: this.isDark,
            cameraPos: state.position
        };

        // 3. Delegate to sub-renderers
        this.renderers.forEach(r => r.render(rendererContext, state, config, objects));

        // 4. Restore Camera
        ctx.restore();
    }
}

export const renderService = new RenderService();
