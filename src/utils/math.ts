
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_RPM = 9.5493; // 60 / (2 * PI)

export const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const smoothstep = (min: number, max: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

// S-curve saturation function for tire models
// y = x / (1 + |x|^n)^(1/n) -> Algebraic Sigmoid
export const softSaturation = (value: number, n: number = 2): number => {
    const absVal = Math.abs(value);
    const sat = absVal / Math.pow(1 + Math.pow(absVal, n), 1 / n);
    return Math.sign(value) * sat;
};

// Low pass filter: y = y_prev + alpha * (x - y_prev)
// alpha = dt / (tau + dt)
export const lowpass = (current: number, target: number, tau: number, dt: number): number => {
    const alpha = dt / (tau + dt);
    return current + (target - current) * alpha;
};

// Linear interpolation for lookup table
export const interpolateTable = (table: {x: number, y: number}[], xVal: number): number => {
  if (table.length === 0) return 0;
  if (xVal <= table[0].x) return table[0].y;
  if (xVal >= table[table.length - 1].x) return table[table.length - 1].y;

  // Find segment
  for (let i = 0; i < table.length - 1; i++) {
    if (xVal >= table[i].x && xVal < table[i+1].x) {
      const t = (xVal - table[i].x) / (table[i+1].x - table[i].x);
      return lerp(table[i].y, table[i+1].y, t);
    }
  }
  return 0;
};

export const rotateVector = (v: {x: number, y: number}, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: v.x * cos - v.y * sin,
        y: v.x * sin + v.y * cos
    };
};

export const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + (radius * Math.cos(angleInRadians)),
    y: cy + (radius * Math.sin(angleInRadians))
  };
};

export const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    if (endAngle - startAngle >= 360) {
        endAngle = startAngle + 359.99;
    }
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
};

export const mapValueToAngle = (value: number, min: number, max: number, startAngle: number = -135, totalAngle: number = 270) => {
    const clamped = clamp(value, min, max);
    const ratio = (clamped - min) / (max - min);
    return startAngle + ratio * totalAngle;
};
