
import { IRenderer, RendererContext } from './types';
import { PhysicsState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { MapObject } from '../../game/types';
import { PX_PER_METER } from '../../game/constants';

export class GridRenderer implements IRenderer {
    render(ctx: RendererContext, state: PhysicsState, config: CarConfig, objects: MapObject[]) {
        const c = ctx.ctx;
        
        // Grid color based on theme
        c.strokeStyle = ctx.isDark ? '#1e293b' : '#cbd5e1';
        c.lineWidth = 1;
        
        // Grid size 5 meters
        const gridSizeMeters = 5;
        const gridSizePx = gridSizeMeters * PX_PER_METER;
        
        const camX = ctx.cameraPos.x * PX_PER_METER;
        const camY = ctx.cameraPos.y * PX_PER_METER;

        const startX = Math.floor((camX - ctx.width/2) / gridSizePx) * gridSizePx;
        const startY = Math.floor((camY - ctx.height/2) / gridSizePx) * gridSizePx;
        const endX = startX + ctx.width + gridSizePx;
        const endY = startY + ctx.height + gridSizePx;

        c.beginPath();
        for (let x = startX; x < endX; x += gridSizePx) {
            c.moveTo(x, startY);
            c.lineTo(x, endY);
        }
        for (let y = startY; y < endY; y += gridSizePx) {
            c.moveTo(startX, y);
            c.lineTo(endX, y);
        }
        c.stroke();
    }
}
