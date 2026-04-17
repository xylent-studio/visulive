import { describe, expect, it } from 'vitest';
import {
  estimateCalibration,
  normalizeLevel,
  updateAdaptiveCeiling,
  updateAdaptiveNoiseFloor
} from './audioMath';

describe('audioMath', () => {
  it('keeps the calibration floor anchored to quiet input', () => {
    const profile = estimateCalibration(
      [0.004, 0.005, 0.006, 0.005, 0.007, 0.08],
      [0.01, 0.012, 0.014, 0.016, 0.02, 0.18]
    );

    expect(profile.noiseFloor).toBeGreaterThan(0.003);
    expect(profile.noiseFloor).toBeLessThan(0.01);
    expect(profile.ceiling).toBeGreaterThan(profile.noiseFloor);
  });

  it('normalizes input above the floor without saturating early', () => {
    const normalized = normalizeLevel(0.05, 0.01, 0.12);

    expect(normalized).toBeGreaterThan(0.3);
    expect(normalized).toBeLessThan(0.5);
  });

  it('raises the adaptive ceiling for stronger peaks and eases back down', () => {
    const lifted = updateAdaptiveCeiling(0.08, 0.2, 0.08);
    const settled = updateAdaptiveCeiling(0.2, 0.05, 0.08);

    expect(lifted).toBeGreaterThan(0.08);
    expect(settled).toBeLessThan(0.2);
    expect(settled).toBeGreaterThan(0.08);
  });

  it('lets the room noise floor drift down during quieter steady windows', () => {
    let lowered = 0.012;

    for (let index = 0; index < 20; index += 1) {
      lowered = updateAdaptiveNoiseFloor(lowered, 0.004, 0.01, true);
    }

    const recovered = updateAdaptiveNoiseFloor(lowered, 0.02, 0.01, false);

    expect(lowered).toBeLessThan(0.012);
    expect(lowered).toBeLessThan(0.01);
    expect(lowered).toBeGreaterThan(0.004);
    expect(recovered).toBeGreaterThan(lowered);
    expect(recovered).toBeLessThan(0.01);
  });
});
