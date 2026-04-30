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
import type { PlayableMotifSystemTelemetry } from './systems/motif/PlayableMotifSystem';

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

const PLAYABLE_MOTIF_TELEMETRY: PlayableMotifSystemTelemetry = {
  activePlayableMotifScene: 'collapse-scar',
  playableMotifSceneProfileId: 'collapse-scar',
  playableMotifSceneAssetPackIds: ['collapse-scar-matte', 'collapse-residue-trace'],
  playableMotifSceneSilhouetteFamily: 'diagonal-rupture',
  playableMotifSceneSurfaceRole: 'scar-matte',
  playableMotifSceneProfileMatch: true,
  compositorMaskFamily: 'scar-matte',
  particleFieldJob: 'punctuation',
  playableMotifSceneDriver: 'signature',
  playableMotifSceneIntentMatch: true,
  playableMotifSceneAgeSeconds: 1.2,
  playableMotifSceneTransitionReason: 'signature-moment',
  playableMotifSceneIntensity: 0.82,
  playableMotifSceneMotifMatch: true,
  playableMotifScenePaletteMatch: true,
  playableMotifSceneDistinctness: 0.9,
  playableMotifSceneSilhouetteConfidence: 0.88
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
    playableMotif: PLAYABLE_MOTIF_TELEMETRY,
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
    expect(telemetry.compositorMaskFamily).toBe('scar-matte');
    expect(telemetry.compositorContrastLift).toBeGreaterThan(0);
    expect(telemetry.perceptualContrastScore).toBeGreaterThan(0);
    expect(telemetry.perceptualWashoutRisk).toBeGreaterThanOrEqual(0);
    expect(() => system.dispose()).not.toThrow();
  });

  it('preserves neon through saturation and edge windows instead of exposure washout', () => {
    const system = new CompositorSystem();
    const context = buildContext();

    system.build();
    system.update({
      ...context,
      signatureMoment: {
        ...context.signatureMoment,
        kind: 'cathedral-open',
        style: 'maximal-neon',
        chamberArchitecture: 0.9,
        postConsequence: 0.72
      },
      postTelemetry: {
        ...context.postTelemetry,
        activeSignatureMoment: 'cathedral-open',
        signatureMomentStyle: 'maximal-neon',
        cathedralOpenAmount: 0.86,
        collapseScarAmount: 0
      },
      playableMotif: {
        ...PLAYABLE_MOTIF_TELEMETRY,
        activePlayableMotifScene: 'neon-cathedral',
        playableMotifSceneProfileId: 'neon-cathedral',
        compositorMaskFamily: 'portal-aperture'
      }
    });

    const telemetry = system.collectTelemetryInputs();

    expect(telemetry.compositorSaturationLift).toBeGreaterThan(0.1);
    expect(telemetry.compositorMaskFamily).toBe('portal-aperture');
    expect(telemetry.compositorEdgeWindowAmount).toBeGreaterThan(0.2);
    expect(telemetry.compositorExposureBias).toBeLessThan(0.04);
    expect(telemetry.perceptualColorfulnessScore).toBeGreaterThan(0.45);
    system.dispose();
  });

  it('lets playable scene masks own the frame until a signature reaches precharge', () => {
    const system = new CompositorSystem();
    const context = buildContext();

    system.build();
    system.update({
      ...context,
      signatureMoment: {
        ...context.signatureMoment,
        kind: 'ghost-residue',
        phase: 'armed',
        intensity: 0.24,
        style: 'ambient-premium'
      },
      playableMotif: {
        ...PLAYABLE_MOTIF_TELEMETRY,
        activePlayableMotifScene: 'neon-cathedral',
        playableMotifSceneProfileId: 'neon-cathedral',
        compositorMaskFamily: 'portal-aperture'
      }
    });

    const telemetry = system.collectTelemetryInputs();
    expect(telemetry.compositorMaskFamily).toBe('portal-aperture');
    system.dispose();
  });

  it('keeps the authored playable mask when an unrelated signature is still over it', () => {
    const system = new CompositorSystem();
    const context = buildContext();

    system.build();
    system.update({
      ...context,
      signatureMoment: {
        ...context.signatureMoment,
        kind: 'cathedral-open',
        phase: 'hold',
        intensity: 0.58,
        style: 'contrast-mythic'
      },
      playableMotif: {
        ...PLAYABLE_MOTIF_TELEMETRY,
        activePlayableMotifScene: 'collapse-scar',
        playableMotifSceneProfileId: 'collapse-scar',
        compositorMaskFamily: 'scar-matte'
      }
    });

    expect(system.collectTelemetryInputs().compositorMaskFamily).toBe('scar-matte');
    system.dispose();
  });

  it('lets a real collapse strike preempt a stale playable mask', () => {
    const system = new CompositorSystem();
    const context = buildContext();

    system.build();
    system.update({
      ...context,
      signatureMoment: {
        ...context.signatureMoment,
        kind: 'collapse-scar',
        phase: 'strike',
        intensity: 0.92,
        style: 'contrast-mythic'
      },
      playableMotif: {
        ...PLAYABLE_MOTIF_TELEMETRY,
        activePlayableMotifScene: 'neon-cathedral',
        playableMotifSceneProfileId: 'neon-cathedral',
        compositorMaskFamily: 'portal-aperture'
      }
    });

    expect(system.collectTelemetryInputs().compositorMaskFamily).toBe('scar-matte');
    system.dispose();
  });
});
