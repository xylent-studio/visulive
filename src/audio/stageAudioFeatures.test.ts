import { describe, expect, it } from 'vitest';
import { DEFAULT_LISTENING_FRAME } from '../types/audio';
import { deriveStageAudioFeatures } from './stageAudioFeatures';

describe('deriveStageAudioFeatures', () => {
  it('builds a strong tempo and impact contract from a locked system-audio frame', () => {
    const features = deriveStageAudioFeatures({
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio',
      confidence: 0.94,
      musicConfidence: 0.86,
      peakConfidence: 0.76,
      beatConfidence: 0.82,
      beatIntervalMs: 480,
      beatStability: 0.88,
      preDropTension: 0.72,
      dropImpact: 0.68,
      sectionChange: 0.42,
      phraseTension: 0.64,
      momentum: 0.58,
      body: 0.66,
      presence: 0.6,
      brightness: 0.52,
      shimmer: 0.48,
      harmonicColor: 0.56,
      roughness: 0.34,
      transientConfidence: 0.62,
      accent: 0.54
    });

    expect(features.tempo.bpm).toBeCloseTo(125, 0);
    expect(features.tempo.lock).toBeGreaterThan(0.8);
    expect(features.impact.build).toBeGreaterThan(0.6);
    expect(features.impact.hit).toBeGreaterThan(0.5);
    expect(features.presence.music).toBeGreaterThan(0.65);
    expect(features.presence.sourceBias).toBe(1);
  });

  it('keeps aftermath frames spatial and restrained instead of over-accelerating them', () => {
    const features = deriveStageAudioFeatures({
      ...DEFAULT_LISTENING_FRAME,
      mode: 'room-mic',
      confidence: 0.76,
      musicConfidence: 0.38,
      peakConfidence: 0.16,
      beatConfidence: 0.2,
      beatIntervalMs: 0,
      beatStability: 0.08,
      releaseTail: 0.74,
      resonance: 0.68,
      ambienceConfidence: 0.58,
      roomness: 0.48,
      air: 0.42,
      speech: 0.12,
      speechConfidence: 0.1,
      tonalStability: 0.78,
      phraseTension: 0.22
    });

    expect(features.tempo.bpm).toBe(0);
    expect(features.memory.afterglow).toBeGreaterThan(0.55);
    expect(features.presence.spatial).toBeGreaterThan(0.35);
    expect(features.stability.restraint).toBeGreaterThan(0.55);
    expect(features.impact.hit).toBeLessThan(0.25);
  });
});
