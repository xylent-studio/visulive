import { describe, expect, it } from 'vitest';
import { SourceHintInterpreter, getSourceHint } from './sourceHintInterpreter';
import {
  DEFAULT_ANALYSIS_FRAME,
  type AnalysisFrame,
  type ListeningMode,
  type SpectrumBand,
  type SpectrumBandId,
  type SpectrumFrame,
} from '../types/audio';

function spectrumFrame(
  overrides: Partial<Record<SpectrumBandId, Partial<SpectrumBand>>>,
  timestampMs = 1000,
): SpectrumFrame {
  const ids: SpectrumBandId[] = [
    'sub',
    'kick',
    'punch',
    'bass',
    'lowMid',
    'body',
    'presence',
    'snap',
    'crack',
    'sheen',
    'air',
    'fizz',
  ];
  return {
    schemaVersion: 1,
    timestampMs,
    sampleRate: 48000,
    fftSize: 2048,
    binWidth: 23.4375,
    legacyLow: 0,
    legacyMid: 0,
    legacyHigh: 0,
    coverageConfidence: 1,
    bands: ids.map((id) => ({
      id,
      hzLow: 0,
      hzHigh: 0,
      energy: 0,
      peak: 0,
      flux: 0,
      onset: 0,
      sustain: 0,
      noise: 0,
      tonal: 0.2,
      confidence: 0.85,
      reliability: 0.85,
      binCount: 8,
      ...(overrides[id] ?? {}),
    })),
  };
}

function update(
  interpreter: SourceHintInterpreter,
  spectrum: SpectrumFrame,
  analysis: Partial<AnalysisFrame> = {},
  mode: ListeningMode = 'system-audio',
) {
  return interpreter.update({
    analysis: {
      ...DEFAULT_ANALYSIS_FRAME,
      timestampMs: spectrum.timestampMs,
      peak: 0.32,
      rms: 0.12,
      crestFactor: 3.5,
      ...analysis,
    },
    spectrumFrame: spectrum,
    mode,
    runtimeMode: 'active',
    calibrated: true,
  });
}

describe('SourceHintInterpreter', () => {
  it('marks low impact without claiming a full drop', () => {
    const interpreter = new SourceHintInterpreter();
    const frame = update(interpreter, spectrumFrame({
      kick: { onset: 0.82, sustain: 0.32, reliability: 0.92 },
      punch: { onset: 0.68, sustain: 0.35, reliability: 0.9 },
      sub: { onset: 0.32, sustain: 0.2, reliability: 0.68 },
    }), {
      transient: 0.62,
      lowEnergy: 0.58,
      midEnergy: 0.24,
      highEnergy: 0.2,
    });

    expect(getSourceHint(frame, 'lowImpactCandidate')?.value).toBeGreaterThan(0.5);
    expect(getSourceHint(frame, 'lowImpactCandidate')?.reasonCodes).toContain('low-onset');
    expect(frame.topHintId).toBe('lowImpactCandidate');
  });

  it('separates sustained bass support from a hit', () => {
    const interpreter = new SourceHintInterpreter();
    const frame = update(interpreter, spectrumFrame({
      sub: { sustain: 0.76, onset: 0.04, reliability: 0.75 },
      bass: { sustain: 0.72, onset: 0.03, reliability: 0.86 },
      kick: { sustain: 0.36, onset: 0.04, reliability: 0.74 },
    }), {
      transient: 0.03,
      lowEnergy: 0.66,
      modulation: 0.03,
    });

    expect(getSourceHint(frame, 'subSustain')?.value).toBeGreaterThan(0.45);
    expect(getSourceHint(frame, 'lowImpactCandidate')?.value).toBeLessThan(0.25);
    expect(getSourceHint(frame, 'subSustain')?.suppressionCodes).toContain('steady-low-hum-risk');
  });

  it('suppresses snare-like snap when the frame looks speech-like in room mode', () => {
    const interpreter = new SourceHintInterpreter();
    const frame = update(interpreter, spectrumFrame({
      body: { sustain: 0.58, onset: 0.12 },
      presence: { sustain: 0.7, onset: 0.14 },
      snap: { sustain: 0.6, onset: 0.44 },
      crack: { onset: 0.38 },
    }), {
      transient: 0.28,
      midEnergy: 0.64,
      modulation: 0.42,
      lowEnergy: 0.12,
    }, 'room-mic');

    expect(getSourceHint(frame, 'speechPresenceCandidate')?.value).toBeGreaterThan(0.5);
    expect(getSourceHint(frame, 'percussiveSnap')?.suppressionCodes).toContain('speech-like');
  });

  it('distinguishes high sweep motion from static hiss', () => {
    const interpreter = new SourceHintInterpreter();
    const sweep = update(interpreter, spectrumFrame({
      sheen: { flux: 0.72, onset: 0.62, sustain: 0.28 },
      air: { flux: 0.76, onset: 0.58, sustain: 0.34 },
      fizz: { flux: 0.42, onset: 0.36, sustain: 0.2 },
    }), {
      highEnergy: 0.54,
      brightness: 0.7,
      peak: 0.45,
      rms: 0.12,
    });

    const hiss = update(interpreter, spectrumFrame({
      sheen: { flux: 0.04, onset: 0.02, sustain: 0.72 },
      air: { flux: 0.04, onset: 0.02, sustain: 0.82 },
      fizz: { flux: 0.03, onset: 0.01, sustain: 0.75 },
    }, 1100), {
      highEnergy: 0.64,
      brightness: 0.84,
      peak: 0.18,
      rms: 0.15,
      crestFactor: 1.2,
    });

    expect(getSourceHint(sweep, 'highSweepCandidate')?.value).toBeGreaterThan(0.45);
    expect(getSourceHint(hiss, 'airMotion')?.suppressionCodes).toContain('hiss-like');
  });

  it('supports tonal lift and silence air as quiet texture hints', () => {
    const interpreter = new SourceHintInterpreter();
    const frame = update(interpreter, spectrumFrame({
      presence: { tonal: 0.78, sustain: 0.28 },
      sheen: { tonal: 0.74, sustain: 0.36 },
      air: { tonal: 0.8, sustain: 0.42 },
    }), {
      rms: 0.015,
      peak: 0.025,
      transient: 0.01,
      lowStability: 0.78,
      highEnergy: 0.16,
    });

    expect(getSourceHint(frame, 'tonalLift')?.value).toBeGreaterThan(0.45);
    expect(getSourceHint(frame, 'silenceAir')?.value).toBeGreaterThan(0.45);
  });

  it('does not classify low-level system music as silence air when musical structure is present', () => {
    const interpreter = new SourceHintInterpreter();
    const frame = update(interpreter, spectrumFrame({
      body: { tonal: 0.62, sustain: 0.2 },
      presence: { tonal: 0.7, sustain: 0.22 },
      sheen: { tonal: 0.58, sustain: 0.06 },
      air: { tonal: 0.58, sustain: 0.04 },
      bass: { sustain: 0.16 },
      lowMid: { sustain: 0.18 },
    }), {
      rms: 0.022,
      peak: 0.052,
      transient: 0.012,
      lowEnergy: 0.018,
      midEnergy: 0.02,
      highEnergy: 0.01,
      lowFlux: 0.003,
      midFlux: 0.005,
      modulation: 0.018,
      lowStability: 0.72,
    }, 'system-audio');

    expect(getSourceHint(frame, 'tonalLift')?.value ?? 0).toBeGreaterThan(
      getSourceHint(frame, 'silenceAir')?.value ?? 1
    );
    expect(frame.topHintId).not.toBe('silenceAir');
  });

  it('suppresses clipped broadband events instead of overtrusting them', () => {
    const interpreter = new SourceHintInterpreter();
    const frame = update(interpreter, spectrumFrame({
      kick: { onset: 0.8 },
      body: { onset: 0.82 },
      snap: { onset: 0.82 },
      crack: { onset: 0.82 },
      sheen: { onset: 0.82, flux: 0.7 },
    }), {
      transient: 0.85,
      peak: 0.99,
      rms: 0.76,
      crestFactor: 1.1,
      clipped: true,
    });

    expect(getSourceHint(frame, 'broadbandHit')?.suppressionCodes).toContain('clip-risk');
    expect(frame.suppressionCodes).toContain('clip-risk');
  });
});
