
import { PhysicsState, CarConfig, MapObject, Vector2 } from '../types';
import { PX_PER_METER } from '../constants';

export class RenderService {
    private ctx: CanvasRenderingContext2D | null = null;
    private width: number = 0;
    private height: number = 0;

    constructor() {}

    setContext(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    clear() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // Camera: Center on car (in pixels)
    setupCamera(position: Vector2) {
        if (!this.ctx) return;
        this.ctx.save();
        // Convert world meters to pixels for camera center
        const camX = position.x * PX_PER_METER;
        const camY = position.y * PX_PER_METER;
        
        this.ctx.translate(this.width / 2 - camX, this.height / 2 - camY);
    }

    restoreCamera() {
        if (!this.ctx) return;
        this.ctx.restore();
    }

    drawGrid(center: Vector2) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        
        // Grid size 5 meters
        const gridSizeMeters = 5;
        const gridSizePx = gridSizeMeters * PX_PER_METER;
        
        const camX = center.x * PX_PER_METER;
        const camY = center.y * PX_PER_METER;

        const startX = Math.floor((camX - this.width/2) / gridSizePx) * gridSizePx;
        const startY = Math.floor((camY - this.height/2) / gridSizePx) * gridSizePx;
        const endX = startX + this.width + gridSizePx;
        const endY = startY + this.height + gridSizePx;

        ctx.beginPath();
        for (let x = startX; x < endX; x += gridSizePx) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y < endY; y += gridSizePx) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    }

    drawObject(obj: MapObject) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        
        ctx.save();
        // Obj pos is in meters
        const px = obj.x * PX_PER_METER;
        const py = obj.y * PX_PER_METER;
        const pw = obj.width * PX_PER_METER;
        const ph = obj.height * PX_PER_METER;

        ctx.translate(px + pw/2, py + ph/2);
        ctx.rotate(obj.rotation);
        
        if (obj.type === 'wall') {
            ctx.fillStyle = '#475569';
            ctx.fillRect(-pw/2, -ph/2, pw, ph);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.strokeRect(-pw/2, -ph/2, pw, ph);
        } else if (obj.type === 'parking-spot') {
            ctx.strokeStyle = obj.target ? '#4ade80' : '#ffffff';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(-pw/2, -ph/2, pw, ph);
            ctx.fillStyle = obj.target ? 'rgba(74, 222, 128, 0.1)' : 'transparent';
            ctx.fillRect(-pw/2, -ph/2, pw, ph);
            ctx.setLineDash([]);
        }
        ctx.restore();
    }

    drawCar(state: PhysicsState, config: CarConfig) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(state.position.x * PX_PER_METER, state.position.y * PX_PER_METER);
        ctx.rotate(state.heading);

        const w = config.width * PX_PER_METER;
        const l = config.length * PX_PER_METER;
        const wb = config.chassis.wheelBase * PX_PER_METER;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-l/2 + 4, -w/2 + 4, l, w);

        const wheelW = 0.2 * PX_PER_METER;
        const wheelL = 0.6 * PX_PER_METER;
        ctx.fillStyle = '#000';
        
        // Rear Wheels
        ctx.fillRect(-wb/2 - wheelL/2, -w/2 - wheelW/2, wheelL, wheelW); 
        ctx.fillRect(-wb/2 - wheelL/2, w/2 - wheelW/2, wheelL, wheelW); 

        // Front Wheels
        ctx.save();
        ctx.translate(wb/2, -w/2);
        ctx.rotate(state.steerAngle); 
        ctx.fillRect(-wheelL/2, -wheelW/2, wheelL, wheelW);
        ctx.restore();

        ctx.save();
        ctx.translate(wb/2, w/2);
        ctx.rotate(state.steerAngle);
        ctx.fillRect(-wheelL/2, -wheelW/2, wheelL, wheelW);
        ctx.restore();

        // Body
        ctx.fillStyle = '#3b82f6'; 
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.rect(-l/2, -w/2, l, w);
        ctx.fill();
        ctx.stroke();

        // Windshield
        ctx.fillStyle = '#1e293b'; 
        ctx.fillRect(l*0.1, -w/2 + 2, l*0.2, w - 4);

        // Headlights
        ctx.fillStyle = '#fef08a'; 
        ctx.fillRect(l/2 - 2, -w/2 + 4, 2, 6);
        ctx.fillRect(l/2 - 2, w/2 - 10, 2, 6);

        // Brakelights
        if (state.brakeInput > 0.1) {
            ctx.fillStyle = '#ef4444'; 
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
        } else {
            ctx.fillStyle = '#7f1d1d'; 
            ctx.shadowBlur = 0;
        }
        ctx.fillRect(-l/2, -w/2 + 4, 2, 6);
        ctx.fillRect(-l/2, w/2 - 10, 2, 6);
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

export const renderService = new RenderService();
