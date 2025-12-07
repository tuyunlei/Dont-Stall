
import { IRenderer, RendererContext } from './types';
import { PhysicsState } from '../../physics/types';
import { CarConfig } from '../../config/types';
import { MapObject } from '../../game/types';
import { PX_PER_METER } from '../../game/constants';

export class CarRenderer implements IRenderer {
    render(ctx: RendererContext, state: PhysicsState, config: CarConfig, objects: MapObject[]) {
        const c = ctx.ctx;
        
        c.save();
        c.translate(state.position.x * PX_PER_METER, state.position.y * PX_PER_METER);
        c.rotate(state.heading);

        const w = config.width * PX_PER_METER;
        const l = config.length * PX_PER_METER;
        const wb = config.chassis.wheelBase * PX_PER_METER;

        // Shadow
        c.fillStyle = 'rgba(0,0,0,0.2)';
        c.fillRect(-l/2 + 4, -w/2 + 4, l, w);

        const wheelW = 0.2 * PX_PER_METER;
        const wheelL = 0.6 * PX_PER_METER;
        c.fillStyle = '#1e293b'; // Tire color
        
        // Rear Wheels
        c.fillRect(-wb/2 - wheelL/2, -w/2 - wheelW/2, wheelL, wheelW); 
        c.fillRect(-wb/2 - wheelL/2, w/2 - wheelW/2, wheelL, wheelW); 

        // Front Wheels
        c.save();
        c.translate(wb/2, -w/2);
        c.rotate(state.steerAngle); 
        c.fillRect(-wheelL/2, -wheelW/2, wheelL, wheelW);
        c.restore();

        c.save();
        c.translate(wb/2, w/2);
        c.rotate(state.steerAngle);
        c.fillRect(-wheelL/2, -wheelW/2, wheelL, wheelW);
        c.restore();

        // Body
        c.fillStyle = '#3b82f6'; 
        c.strokeStyle = '#1d4ed8';
        c.lineWidth = 2;
        
        c.beginPath();
        c.rect(-l/2, -w/2, l, w);
        c.fill();
        c.stroke();

        // Windshield
        c.fillStyle = ctx.isDark ? '#1e293b' : '#cbd5e1'; 
        c.fillRect(l*0.1, -w/2 + 2, l*0.2, w - 4);

        // Headlights
        c.fillStyle = '#fef08a'; 
        c.fillRect(l/2 - 2, -w/2 + 4, 2, 6);
        c.fillRect(l/2 - 2, w/2 - 10, 2, 6);

        // Brakelights
        if (state.brakeInput > 0.1) {
            c.fillStyle = '#ef4444'; 
            c.shadowColor = '#ef4444';
            c.shadowBlur = 10;
        } else {
            c.fillStyle = '#7f1d1d'; 
            c.shadowBlur = 0;
        }
        c.fillRect(-l/2, -w/2 + 4, 2, 6);
        c.fillRect(-l/2, w/2 - 10, 2, 6);
        c.shadowBlur = 0;

        c.restore();
    }
}
