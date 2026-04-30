import { describe, expect, it } from 'vitest';
import {
  detectAutoCaptureTrigger,
  getAutoCaptureTriggerPriority,
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
    expect(resolveAutoCaptureTimingProfile('authority-turn').postRollMs).toBe(3200);
    expect(resolveAutoCaptureTimingProfile('authority-turn').maxTriggerCount).toBe(8);
    expect(resolveAutoCaptureTimingProfile('authority-turn').maxCapturesPerRun).toBe(8);
    expect(resolveAutoCaptureTimingProfile('governance-risk').maxCapturesPerRun).toBe(3);
    expect(resolveAutoCaptureTimingProfile('governance-risk').cooldownMs).toBe(18000);
    expect(resolveAutoCaptureTimingProfile('operator-trust-clear').maxCapturesPerRun).toBe(1);
    expect(getAutoCaptureTriggerPriority('operator-trust-clear')).toBeGreaterThan(
      getAutoCaptureTriggerPriority('authority-turn')
    );
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

  it('prioritizes operator trust evidence when no-touch clears during an authority turn', () => {
    const trigger = detectAutoCaptureTrigger(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 36000,
        mode: 'system-audio',
        musicConfidence: 0.72,
        beatConfidence: 0.5,
        dropImpact: 0.1,
        sectionChange: 0.08
      },
      DEFAULT_AUDIO_DIAGNOSTICS,
      {
        noTouchWindowPassed: true,
        previousNoTouchWindowPassed: false,
        previousWorldAuthorityState: 'support',
        visualTelemetry: {
          worldAuthorityState: 'shared',
          worldDominanceDelivered: 0.46,
          chamberPresenceScore: 0.66,
          compositionSafetyScore: 0.92,
          overbright: 0.08
        } as any
      }
    );

    expect(trigger?.kind).toBe('operator-trust-clear');
  });

  it('prioritizes rare quiet-beauty evidence over authority churn', () => {
    const trigger = detectAutoCaptureTrigger(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 104000,
        mode: 'system-audio',
        musicConfidence: 0.34,
        ambienceConfidence: 0.62,
        beatConfidence: 0.16,
        dropImpact: 0.04,
        sectionChange: 0.05,
        releaseTail: 0.08
      },
      DEFAULT_AUDIO_DIAGNOSTICS,
      {
        previousWorldAuthorityState: 'support',
        visualTelemetry: {
          worldAuthorityState: 'shared',
          worldDominanceDelivered: 0.5,
          chamberPresenceScore: 0.62,
          compositionSafetyScore: 0.92,
          overbright: 0.03
        } as any
      }
    );

    expect(trigger?.kind).toBe('quiet-beauty');
    expect(getAutoCaptureTriggerPriority('quiet-beauty')).toBeGreaterThan(
      getAutoCaptureTriggerPriority('authority-turn')
    );
  });

  it('captures sustained authority landmarks during long no-touch spans', () => {
    const trigger = detectAutoCaptureTrigger(
      {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: 464000,
        mode: 'system-audio',
        musicConfidence: 0.78,
        beatConfidence: 0.46,
        dropImpact: 0.08,
        sectionChange: 0.1
      },
      DEFAULT_AUDIO_DIAGNOSTICS,
      {
        previousWorldAuthorityState: 'dominant',
        visualTelemetry: {
          worldAuthorityState: 'dominant',
          worldDominanceDelivered: 0.74,
          chamberPresenceScore: 0.62,
          compositionSafetyScore: 0.9,
          overbright: 0.08
        } as any
      }
    );

    expect(trigger?.kind).toBe('authority-turn');
    expect(trigger?.label).toBe('Authority Landmark');
  });
});
