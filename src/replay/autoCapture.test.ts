import { describe, expect, it } from 'vitest';
import {
  detectAutoCaptureTrigger,
  resolveAutoCaptureTimingProfile
} from './autoCapture';
import {
  DEFAULT_AUDIO_DIAGNOSTICS,
  DEFAULT_LISTENING_FRAME
} from '../types/audio';

describe('auto capture helpers', () => {
  it('detects quiet room-floor captures only for room-mic music', () => {
    const trigger = detectAutoCaptureTrigger(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 1000,
        mode: 'room-mic',
        musicConfidence: 0.42,
        speechConfidence: 0.06,
        dropImpact: 0.04,
        sectionChange: 0.06,
        releaseTail: 0.08
      },
      {
        ...DEFAULT_AUDIO_DIAGNOSTICS,
        roomMusicFloorActive: true,
        roomMusicDrive: 0.24
      }
    );

    expect(trigger?.kind).toBe('floor');
    expect(trigger?.label).toContain('Quiet Music Floor');
  });

  it('does not arm floor captures for system-audio runs', () => {
    const trigger = detectAutoCaptureTrigger(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 1000,
        mode: 'system-audio',
        musicConfidence: 0.42,
        speechConfidence: 0.06,
        dropImpact: 0.04,
        sectionChange: 0.06,
        releaseTail: 0.08
      },
      {
        ...DEFAULT_AUDIO_DIAGNOSTICS,
        roomMusicFloorActive: true,
        roomMusicDrive: 0.24
      }
    );

    expect(trigger).toBeNull();
  });

  it('uses the tighter dense-music profiles and explicit extension caps', () => {
    expect(resolveAutoCaptureTimingProfile('drop').preRollMs).toBe(2400);
    expect(resolveAutoCaptureTimingProfile('drop').postRollMs).toBe(2200);
    expect(resolveAutoCaptureTimingProfile('drop').maxDurationMs).toBe(7600);
    expect(resolveAutoCaptureTimingProfile('drop').maxExtensions).toBe(1);
    expect(resolveAutoCaptureTimingProfile('drop').maxTriggerCount).toBe(3);
    expect(resolveAutoCaptureTimingProfile('release').postRollMs).toBe(3200);
    expect(resolveAutoCaptureTimingProfile('release').maxExtensions).toBe(2);
    expect(resolveAutoCaptureTimingProfile('release').maxTriggerCount).toBe(4);
    expect(resolveAutoCaptureTimingProfile('floor').postRollMs).toBe(5500);
    expect(resolveAutoCaptureTimingProfile('floor').cooldownMs).toBe(4000);
    expect(resolveAutoCaptureTimingProfile('governance-risk').maxCapturesPerRun).toBe(3);
    expect(resolveAutoCaptureTimingProfile('governance-risk').cooldownMs).toBe(18000);
  });

  it('does not let persistent governance risk starve musical event captures', () => {
    const trigger = detectAutoCaptureTrigger(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 1000,
        mode: 'system-audio',
        beatConfidence: 0.62,
        dropImpact: 0.58,
        sectionChange: 0.46,
        performanceIntent: 'detonate'
      },
      DEFAULT_AUDIO_DIAGNOSTICS,
      {
        visualTelemetry: {
          overbright: 0.72,
          ringBeltPersistence: 0.62,
          compositionSafetyFlag: true
        } as any
      }
    );

    expect(trigger?.kind).toBe('drop');
  });
});
