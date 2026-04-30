import { describe, expect, it } from 'vitest';
import { DEFAULT_ANALYSIS_FRAME } from '../types/audio';
import {
  buildSourceReadiness,
  getCalibrationDurationMs,
  summarizeSourceAwareCalibration
} from './calibrationPolicy';

describe('calibrationPolicy', () => {
  it('uses longer representative calibration for PC audio than room mic', () => {
    expect(getCalibrationDurationMs('system-audio')).toBeGreaterThan(
      getCalibrationDurationMs('room-mic')
    );
    expect(getCalibrationDurationMs('hybrid')).toBeGreaterThan(
      getCalibrationDurationMs('room-mic')
    );
  });

  it('classifies silent PC audio as provisional and not proof ready', () => {
    const profile = summarizeSourceAwareCalibration(
      'system-audio',
      Array(80).fill(0.0008),
      Array(80).fill(0.003),
      { displayAudioGranted: true }
    );

    expect(profile.calibrationTrust).toBe('provisional');
    expect(profile.calibrationQuality).toBe('silent-system-audio');

    const readiness = buildSourceReadiness({
      mode: 'system-audio',
      displayAudioGranted: true,
      calibrationTrust: profile.calibrationTrust,
      calibrationQuality: profile.calibrationQuality,
      frame: {
        ...DEFAULT_ANALYSIS_FRAME,
        rms: 0.0008,
        peak: 0.003
      },
      sourceEnded: false,
      firstSourceHeardAtMs: null,
      firstMusicLockAtMs: null,
      stableAtMs: null
    });

    expect(readiness.signalPresent).toBe(false);
    expect(readiness.proofReady).toBe(false);
  });

  it('does not keep PC audio proof-ready from stale music lock alone', () => {
    const readiness = buildSourceReadiness({
      mode: 'system-audio',
      displayAudioGranted: true,
      calibrationTrust: 'stable',
      calibrationQuality: 'clean',
      frame: {
        ...DEFAULT_ANALYSIS_FRAME,
        rms: 0,
        peak: 0
      },
      sourceEnded: false,
      firstSourceHeardAtMs: 100,
      firstMusicLockAtMs: 120,
      lastSignalAtMs: 120,
      lastMusicLockAtMs: 120,
      timeSinceLastSignalMs: 8000,
      recentSignalFrameCount: 0,
      recentMusicLockFrameCount: 0,
      stableAtMs: 140
    });

    expect(readiness.signalPresent).toBe(false);
    expect(readiness.musicLock).toBe(false);
    expect(readiness.proofReady).toBe(false);
  });

  it('keeps PC audio ceilings broad enough after quiet intros', () => {
    const profile = summarizeSourceAwareCalibration(
      'system-audio',
      [0.001, 0.002, 0.003, 0.004, 0.005, 0.006],
      [0.006, 0.01, 0.014, 0.018, 0.024, 0.032],
      { displayAudioGranted: true }
    );

    expect(profile.ceiling).toBeGreaterThanOrEqual(0.08);
    expect(profile.noiseFloor).toBeLessThan(0.01);
  });

  it('does not let loud PC audio overfit the noise floor', () => {
    const profile = summarizeSourceAwareCalibration(
      'system-audio',
      Array(80).fill(0.12),
      Array(80).fill(0.5),
      { displayAudioGranted: true }
    );

    expect(profile.calibrationQuality).toBe('loud-calibration-risk');
    expect(profile.noiseFloor).toBeLessThanOrEqual(0.018);
    expect(profile.ceiling).toBeGreaterThan(0.5);
  });

  it('marks hybrid calibration as mixed-source risk', () => {
    const profile = summarizeSourceAwareCalibration(
      'hybrid',
      Array(80).fill(0.02),
      Array(80).fill(0.08),
      { displayAudioGranted: true }
    );

    expect(profile.calibrationTrust).toBe('provisional');
    expect(profile.calibrationQuality).toBe('mixed-source-risk');
  });

  it('keeps clean room mic calibration stable even when quiet', () => {
    const profile = summarizeSourceAwareCalibration(
      'room-mic',
      Array(80).fill(0.003),
      Array(80).fill(0.012),
      { displayAudioGranted: false }
    );

    expect(profile.calibrationTrust).toBe('stable');
    expect(profile.calibrationQuality).toBe('clean');
  });
});
