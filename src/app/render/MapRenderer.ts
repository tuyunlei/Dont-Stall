
import { IRenderer, RendererContext } from './types';
import { PhysicsState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { MapObject } from '../../game/types';
import { PX_PER_METER } from '../../game/constants';

export class MapRenderer implements IRenderer {
    render(ctx: RendererContext, state: PhysicsState, config: CarConfig, objects: MapObject[]) {
        objects.forEach(obj => this.drawObject(ctx, obj));
    }

    private drawObject(ctx: RendererContext, obj: MapObject) {
        const c = ctx.ctx;
        
        c.save();
        // Obj pos is in meters
        const px = obj.x * PX_PER_METER;
        const py = obj.y * PX_PER_METER;
        const pw = obj.width * PX_PER_METER;
        const ph = obj.height * PX_PER_METER;

        c.translate(px + pw/2, py + ph/2);
        c.rotate(obj.rotation);
        
        if (obj.type === 'wall') {
            c.fillStyle = ctx.isDark ? '#475569' : '#94a3b8';
            c.fillRect(-pw/2, -ph/2, pw, ph);
            c.strokeStyle = ctx.isDark ? '#94a3b8' : '#64748b';
            c.lineWidth = 2;
            c.strokeRect(-pw/2, -ph/2, pw, ph);
        } else if (obj.type === 'parking-spot') {
            c.strokeStyle = obj.target ? '#4ade80' : (ctx.isDark ? '#ffffff' : '#475569');
            c.lineWidth = 3;
            c.setLineDash([10, 5]);
            c.strokeRect(-pw/2, -ph/2, pw, ph);
            c.fillStyle = obj.target ? (ctx.isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(74, 222, 128, 0.2)') : 'transparent';
            c.fillRect(-pw/2, -ph/2, pw, ph);
            c.setLineDash([]);
        }
        c.restore();
    }
}
