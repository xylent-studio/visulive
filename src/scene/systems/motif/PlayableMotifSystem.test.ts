import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTHORITY_FRAME_SNAPSHOT,
  DEFAULT_PALETTE_FRAME,
  DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
  DEFAULT_STAGE_CUE_PLAN,
  type SignatureMomentSnapshot
} from '../../../types/visual';
import type { SceneQualityProfile } from '../../runtime';
import type { PostSystemTelemetry } from '../post/PostSystem';
import {
  PlayableMotifSystem,
  type PlayableMotifSystemUpdateContext
} from './PlayableMotifSystem';

const QUALITY: SceneQualityProfile = {
  tier: 'safe',
  particleDrawCount: 600,
  particleOpacityMultiplier: 0.72,
  auraOpacityMultiplier: 0.68
};

const POST_TELEMETRY: PostSystemTelemetry = {
  activeSignatureMoment: 'none',
  signatureMomentPhase: 'idle',
  signatureMomentStyle: 'contrast-mythic',
  signatureMomentIntensity: 0,
  signatureMomentAgeSeconds: 0,
  signatureMomentSuppressionReason: 'none',
  signatureMomentTriggerConfidence: 0,
  signatureMomentPrechargeProgress: 0,
  signatureMomentRarityBudget: 1,
  signatureMomentForcedPreview: false,
  signatureMomentDistinctnessHint: 'none',
  collapseScarAmount: 0,
  cathedralOpenAmount: 0,
  ghostResidueAmount: 0,
  silenceConstellationAmount: 0,
  memoryTraceCount: 0,
  aftermathClearance: 1,
  postConsequenceIntensity: 0,
  postOverprocessRisk: 0
};

function signatureMoment(
  overrides: Partial<SignatureMomentSnapshot>
): SignatureMomentSnapshot {
  return {
    ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
    ...overrides,
    candidateScores: {
      ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.candidateScores,
      ...overrides.candidateScores
    },
    decisionTrace: {
      ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.decisionTrace,
      ...overrides.decisionTrace
    }
  };
}

function context(
  overrides: Partial<PlayableMotifSystemUpdateContext> = {}
): PlayableMotifSystemUpdateContext {
  return {
    elapsedSeconds: 0,
    deltaSeconds: 1 / 60,
    qualityProfile: QUALITY,
    signatureMoment: DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
    authority: DEFAULT_AUTHORITY_FRAME_SNAPSHOT,
    visualMotif: 'void-anchor',
    paletteFrame: DEFAULT_PALETTE_FRAME,
    stageCuePlan: DEFAULT_STAGE_CUE_PLAN,
    postTelemetry: POST_TELEMETRY,
    audio: {
      preDropTension: 0.2,
      dropImpact: 0.05,
      sectionChange: 0.05,
      releaseTail: 0.04,
      musicConfidence: 0.7,
      beatPhase: 0.2,
      phrasePhase: 0.3,
      shimmer: 0.4
    },
    ...overrides
  };
}

describe('PlayableMotifSystem', () => {
  it('builds, updates telemetry, and disposes without leaking ownership to scene', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(context());

    expect(system.collectTelemetryInputs().activePlayableMotifScene).toBe('void-pressure');
    expect(system.collectTelemetryInputs().playableMotifSceneMotifMatch).toBe(true);
    expect(system.collectTelemetryInputs().playableMotifSceneSilhouetteFamily).toBe(
      'negative-space-mass'
    );
    expect(system.collectTelemetryInputs().playableMotifSceneAssetPackIds).toContain(
      'void-pressure-scrim'
    );
    expect(system.collectTelemetryInputs().particleFieldJob).toBe('pressure-dust');

    system.dispose();
    expect(system.group.children.length).toBe(0);
  });

  it('maps cathedral signature moments to the neon cathedral scene', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(
      context({
        elapsedSeconds: 4,
        visualMotif: 'neon-portal',
        signatureMoment: signatureMoment({
          kind: 'cathedral-open',
          phase: 'strike',
          intensity: 0.9,
          style: 'maximal-neon'
        }),
        paletteFrame: {
          ...DEFAULT_PALETTE_FRAME,
          baseState: 'tron-blue'
        }
      })
    );

    const telemetry = system.collectTelemetryInputs();
    expect(telemetry.activePlayableMotifScene).toBe('neon-cathedral');
    expect(telemetry.playableMotifSceneTransitionReason).toBe('signature-moment');
    expect(telemetry.playableMotifSceneDriver).toBe('signature');
    expect(telemetry.playableMotifSceneIntentMatch).toBe(true);
    expect(telemetry.playableMotifSceneProfileId).toBe('neon-cathedral');
    expect(telemetry.playableMotifSceneAssetPackIds).toEqual([
      'portal-aperture-mask',
      'cathedral-rib-geometry'
    ]);
    expect(telemetry.playableMotifSceneSurfaceRole).toBe('architectural-aperture');
    expect(telemetry.compositorMaskFamily).toBe('portal-aperture');
    expect(telemetry.playableMotifSceneSilhouetteConfidence).toBeGreaterThan(0.7);
  });

  it('maps collapse signatures to a dark scar scene with strong silhouette', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(
      context({
        elapsedSeconds: 3,
        visualMotif: 'rupture-scar',
        signatureMoment: signatureMoment({
          kind: 'collapse-scar',
          phase: 'strike',
          intensity: 0.88,
          style: 'contrast-mythic'
        }),
        audio: {
          ...context().audio,
          dropImpact: 0.72
        }
      })
    );

    const telemetry = system.collectTelemetryInputs();
    expect(telemetry.activePlayableMotifScene).toBe('collapse-scar');
    expect(telemetry.playableMotifSceneSilhouetteFamily).toBe('diagonal-rupture');
    expect(telemetry.playableMotifSceneMotifMatch).toBe(true);
    expect(telemetry.playableMotifSceneDistinctness).toBeGreaterThan(0.85);
  });

  it('holds non-urgent scene changes long enough to read', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(
      context({
        elapsedSeconds: 2,
        visualMotif: 'machine-grid',
        stageCuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'gather'
        }
      })
    );
    expect(system.collectTelemetryInputs().activePlayableMotifScene).toBe('machine-tunnel');

    system.update(
      context({
        elapsedSeconds: 4,
        visualMotif: 'neon-portal',
        stageCuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'reveal'
        }
      })
    );

    expect(system.collectTelemetryInputs().activePlayableMotifScene).toBe('machine-tunnel');
    expect(system.collectTelemetryInputs().playableMotifSceneTransitionReason).toBe('hold');
    expect(system.collectTelemetryInputs().playableMotifSceneDriver).toBe('motif');
    expect(system.collectTelemetryInputs().playableMotifSceneIntentMatch).toBe(false);
  });

  it('routes gather passages to machine tunnel instead of another portal colorway', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(
      context({
        elapsedSeconds: 3,
        visualMotif: 'neon-portal',
        stageCuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'gather'
        },
        audio: {
          ...context().audio,
          dropImpact: 0.08,
          releaseTail: 0.04
        }
      })
    );

    const telemetry = system.collectTelemetryInputs();
    expect(telemetry.activePlayableMotifScene).toBe('machine-tunnel');
    expect(telemetry.playableMotifSceneSilhouetteFamily).toBe('perspective-tunnel');
  });

  it('does not treat soft rupture residue as a collapse scene when reveal still owns the phrase', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(
      context({
        elapsedSeconds: 3,
        visualMotif: 'rupture-scar',
        stageCuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'reveal',
          worldMode: 'fan-sweep',
          transformIntent: 'open'
        },
        audio: {
          ...context().audio,
          dropImpact: 0.12,
          sectionChange: 0.18
        }
      })
    );

    const telemetry = system.collectTelemetryInputs();
    expect(telemetry.activePlayableMotifScene).toBe('neon-cathedral');
    expect(telemetry.playableMotifSceneTransitionReason).not.toBe('drop-rupture');
  });

  it('does not let weak collapse precharge steal a non-rupture scene', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(
      context({
        elapsedSeconds: 3,
        visualMotif: 'neon-portal',
        signatureMoment: signatureMoment({
          kind: 'collapse-scar',
          phase: 'precharge',
          intensity: 0.24,
          style: 'contrast-mythic',
          postConsequence: 0.18,
          worldLead: 0.42,
          safetyRisk: 0.18
        }),
        stageCuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'reveal',
          worldMode: 'cathedral-rise',
          transformIntent: 'open'
        },
        audio: {
          ...context().audio,
          dropImpact: 0.12,
          sectionChange: 0.22
        }
      })
    );

    const telemetry = system.collectTelemetryInputs();
    expect(telemetry.activePlayableMotifScene).toBe('neon-cathedral');
    expect(telemetry.playableMotifSceneTransitionReason).not.toBe('signature-moment');
  });

  it('does not treat a bright non-rupture drop as collapse scar scene ownership', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(
      context({
        elapsedSeconds: 3,
        visualMotif: 'neon-portal',
        stageCuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'reveal',
          worldMode: 'cathedral-rise',
          transformIntent: 'open'
        },
        paletteFrame: {
          ...DEFAULT_PALETTE_FRAME,
          baseState: 'acid-lime'
        },
        audio: {
          ...context().audio,
          dropImpact: 0.62,
          sectionChange: 0.36
        }
      })
    );

    const telemetry = system.collectTelemetryInputs();
    expect(telemetry.activePlayableMotifScene).toBe('neon-cathedral');
    expect(telemetry.playableMotifSceneTransitionReason).not.toBe('drop-rupture');
  });

  it('lets collapse residue yield back to the current motif once rupture no longer owns it', () => {
    const system = new PlayableMotifSystem();
    system.build();
    system.update(
      context({
        elapsedSeconds: 3,
        visualMotif: 'rupture-scar',
        signatureMoment: signatureMoment({
          kind: 'collapse-scar',
          phase: 'strike',
          intensity: 0.88,
          style: 'contrast-mythic',
          postConsequence: 0.72
        }),
        audio: {
          ...context().audio,
          dropImpact: 0.72
        }
      })
    );

    expect(system.collectTelemetryInputs().activePlayableMotifScene).toBe('collapse-scar');

    system.update(
      context({
        elapsedSeconds: 10,
        visualMotif: 'neon-portal',
        signatureMoment: signatureMoment({
          kind: 'collapse-scar',
          phase: 'residue',
          intensity: 0.22,
          style: 'contrast-mythic',
          postConsequence: 0.18
        }),
        stageCuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'reveal',
          worldMode: 'cathedral-rise'
        },
        paletteFrame: {
          ...DEFAULT_PALETTE_FRAME,
          baseState: 'tron-blue'
        },
        audio: {
          ...context().audio,
          sectionChange: 0.36,
          dropImpact: 0.05
        }
      })
    );

    const telemetry = system.collectTelemetryInputs();
    expect(telemetry.activePlayableMotifScene).toBe('neon-cathedral');
    expect(telemetry.playableMotifSceneDriver).toBe('motif');
    expect(telemetry.playableMotifSceneIntentMatch).toBe(true);
  });
});
