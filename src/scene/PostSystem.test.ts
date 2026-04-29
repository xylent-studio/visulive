import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTHORITY_FRAME_SNAPSHOT,
  DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
  DEFAULT_STAGE_CUE_PLAN,
  type SignatureMomentSnapshot
} from '../types/visual';
import { PostSystem, type PostSystemUpdateContext } from './systems/post/PostSystem';
import type { SceneQualityProfile } from './runtime';

const QUALITY_PROFILE: SceneQualityProfile = {
  tier: 'premium',
  particleDrawCount: 960,
  particleOpacityMultiplier: 1,
  auraOpacityMultiplier: 1
};

function buildContext(
  signatureMoment: SignatureMomentSnapshot
): PostSystemUpdateContext {
  return {
    elapsedSeconds: signatureMoment.startedAtSeconds ?? 10,
    deltaSeconds: 1 / 60,
    qualityProfile: QUALITY_PROFILE,
    signatureMoment,
    authority: {
      ...DEFAULT_AUTHORITY_FRAME_SNAPSHOT,
      compositionSafetyScore: 0.9,
      overbright: 0.02
    },
    paletteState: 'tron-blue',
    stageCuePlan: DEFAULT_STAGE_CUE_PLAN,
    audio: {
      beatPhase: 0.08,
      phrasePhase: 0.35,
      dropImpact: 0.7,
      releaseTail: 0.2,
      shimmer: 0.4,
      air: 0.5,
      musicConfidence: 0.8
    }
  };
}

describe('PostSystem', () => {
  it('owns build, update, telemetry, quality reset, and dispose lifecycle', () => {
    const system = new PostSystem();
    system.build();
    system.applyQualityProfile(QUALITY_PROFILE);

    system.update(
      buildContext({
        ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
        kind: 'collapse-scar',
        phase: 'strike',
        intensity: 0.9,
        ageSeconds: 1.1,
        seed: 42,
        startedAtSeconds: 10,
        worldLead: 0.8,
        heroSuppression: 0.55,
        postConsequence: 0.9,
        safetyRisk: 0.05
      })
    );

    const telemetry = system.collectTelemetryInputs();

    expect(telemetry.activeSignatureMoment).toBe('collapse-scar');
    expect(telemetry.collapseScarAmount).toBeGreaterThan(0);
    expect(telemetry.postConsequenceIntensity).toBeGreaterThan(0);

    expect(() => system.dispose()).not.toThrow();
  });

  it('expires memory traces instead of growing unbounded', () => {
    const system = new PostSystem();
    system.build();

    for (let index = 0; index < 12; index += 1) {
      const startedAtSeconds = 10 + index * 2;
      system.update(
        buildContext({
          ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
          kind: 'ghost-residue',
          phase: 'strike',
          intensity: 0.8,
          ageSeconds: 0.8,
          seed: index,
          startedAtSeconds,
          memoryStrength: 0.8,
          postConsequence: 0.7
        })
      );
    }

    expect(system.collectTelemetryInputs().memoryTraceCount).toBeLessThanOrEqual(5);
    system.dispose();
  });
});
