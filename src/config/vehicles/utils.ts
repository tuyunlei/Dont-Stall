
// Helper to generate generic torque curve
export const generateGenericTorqueCurve = (peakTorque: number, redline: number) => [
  { rpm: 0, torque: 0 },
  { rpm: 500, torque: peakTorque * 0.6 },
  { rpm: 1000, torque: peakTorque * 0.8 },
  { rpm: 3000, torque: peakTorque },
  { rpm: redline - 1000, torque: peakTorque * 0.95 },
  { rpm: redline, torque: peakTorque * 0.8 },
  { rpm: redline + 1000, torque: 0 }
];
