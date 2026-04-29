import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTHORITY_FRAME_SNAPSHOT,
  DEFAULT_SIGNATURE_MOMENT_SNAPSHOT
} from '../types/visual';
import type { SceneQualityProfile } from './runtime';
import {
  CompositorSystem,
  type CompositorSystemUpdateContext
} from './systems/compositor/CompositorSystem';
import type { PostSystemTelemetry } from './systems/post/PostSystem';

const QUALITY_PROFILE: SceneQualityProfile = {
  tier: 'premium',
  particleDrawCount: 960,
  particleOpacityMultiplier: 1,
  auraOpacityMultiplier: 1
};

const POST_TELEMETRY: PostSystemTelemetry = {
  activeSignatureMoment: 'collapse-scar',
  signatureMomentPhase: 'strike',
  signatureMomentStyle: 'contrast-mythic',
  signatureMomentIntensity: 0.9,
  signatureMomentAgeSeconds: 1,
  signatureMomentSuppressionReason: 'none',
  signatureMomentTriggerConfidence: 0.9,
  signatureMomentPrechargeProgress: 1,
  signatureMomentRarityBudget: 1,
  signatureMomentForcedPreview: false,
  signatureMomentDistinctnessHint: 'dark-cut',
  collapseScarAmount: 0.9,
  cathedralOpenAmount: 0,
  ghostResidueAmount: 0,
  silenceConstellationAmount: 0,
  memoryTraceCount: 1,
  aftermathClearance: 0.5,
  postConsequenceIntensity: 0.8,
  postOverprocessRisk: 0.12
};

function buildContext(): CompositorSystemUpdateContext {
  return {
    elapsedSeconds: 12,
    deltaSeconds: 1 / 60,
    qualityProfile: QUALITY_PROFILE,
    signatureMoment: {
      ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
      kind: 'collapse-scar',
      phase: 'strike',
      style: 'contrast-mythic',
      intensity: 0.9,
      ageSeconds: 1,
      seed: 42,
      startedAtSeconds: 11,
      postConsequence: 0.9,
      forcedPreview: true,
      distinctnessHint: 'dark-cut'
    },
    postTelemetry: POST_TELEMETRY,
    authority: {
      ...DEFAULT_AUTHORITY_FRAME_SNAPSHOT,
      frameHierarchyScore: 0.86,
      compositionSafetyScore: 0.9,
      overbright: 0.04,
      ringBeltPersistence: 0.12
    },
    paletteState: 'tron-blue'
  };
}

describe('CompositorSystem', () => {
  it('owns lifecycle, compositor telemetry, and perceptual washout inputs', () => {
    const system = new CompositorSystem();

    system.build();
    system.applyQualityProfile(QUALITY_PROFILE);
    system.update(buildContext());

    const telemetry = system.collectTelemetryInputs();

    expect(telemetry.compositorSignatureMask).toBeGreaterThan(0);
    expect(telemetry.compositorContrastLift).toBeGreaterThan(0);
    expect(telemetry.perceptualContrastScore).toBeGreaterThan(0);
    expect(telemetry.perceptualWashoutRisk).toBeGreaterThanOrEqual(0);
    expect(() => system.dispose()).not.toThrow();
  });
});
