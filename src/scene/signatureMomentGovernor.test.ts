import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AUTHORITY_FRAME_SNAPSHOT,
  DEFAULT_STAGE_COMPOSITION_PLAN,
  DEFAULT_STAGE_CUE_PLAN,
  type AuthorityFrameSnapshot,
  type StageCompositionPlan,
  type StageCuePlan
} from '../types/visual';
import { DEFAULT_LISTENING_FRAME, type ListeningFrame } from '../types/audio';
import {
  deriveSignatureMomentStyle,
  SignatureMomentGovernor
} from './governors/SignatureMomentGovernor';

function buildInput(input: {
  frame?: Partial<ListeningFrame>;
  stage?: Partial<StageCuePlan>;
  composition?: Partial<StageCompositionPlan>;
  authority?: Partial<AuthorityFrameSnapshot>;
  qualityTier?: 'safe' | 'balanced' | 'premium';
  elapsedSeconds?: number;
  devOverride?: Parameters<SignatureMomentGovernor['resolveFrame']>[0]['devOverride'];
}) {
  return {
    frame: { ...DEFAULT_LISTENING_FRAME, ...input.frame },
    elapsedSeconds: input.elapsedSeconds ?? 10,
    deltaSeconds: 1 / 60,
    stageCuePlan: { ...DEFAULT_STAGE_CUE_PLAN, ...input.stage },
    stageCompositionPlan: {
      ...DEFAULT_STAGE_COMPOSITION_PLAN,
      ...input.composition,
      heroEnvelope: {
        ...DEFAULT_STAGE_COMPOSITION_PLAN.heroEnvelope,
        ...input.composition?.heroEnvelope
      },
      chamberEnvelope: {
        ...DEFAULT_STAGE_COMPOSITION_PLAN.chamberEnvelope,
        ...input.composition?.chamberEnvelope
      },
      subtractivePolicy: {
        ...DEFAULT_STAGE_COMPOSITION_PLAN.subtractivePolicy,
        ...input.composition?.subtractivePolicy
      }
    },
    authority: { ...DEFAULT_AUTHORITY_FRAME_SNAPSHOT, ...input.authority },
    qualityTier: input.qualityTier ?? ('premium' as const),
    devOverride: input.devOverride
  };
}

describe('SignatureMomentGovernor', () => {
  it('derives contrast, neon, and ambient styles from music character', () => {
    expect(
      deriveSignatureMomentStyle(
        buildInput({
          frame: {
            dropImpact: 0.85,
            musicConfidence: 0.9,
            shimmer: 0.1,
            ambienceConfidence: 0.02
          },
          stage: { family: 'rupture', worldMode: 'collapse-well' }
        })
      )
    ).toBe('contrast-mythic');

    expect(
      deriveSignatureMomentStyle(
        buildInput({
          frame: {
            musicConfidence: 0.9,
            shimmer: 0.9,
            beatConfidence: 0.8,
            sectionChange: 0.6,
            preDropTension: 0.6
          },
          stage: { family: 'reveal', worldMode: 'fan-sweep' },
          authority: { compositionSafetyScore: 0.92, overbright: 0.02 }
        })
      )
    ).toBe('maximal-neon');

    expect(
      deriveSignatureMomentStyle(
        buildInput({
          frame: {
            musicConfidence: 0.04,
            ambienceConfidence: 0.9,
            air: 0.8,
            releaseTail: 0.2,
            dropImpact: 0
          },
          stage: { family: 'haunt' }
        })
      )
    ).toBe('ambient-premium');
  });

  it('selects collapse scar for earned rupture/drop passages', () => {
    const governor = new SignatureMomentGovernor();
    const snapshot = governor.resolveFrame(
      buildInput({
        frame: {
          dropImpact: 0.9,
          sectionChange: 0.4,
          preDropTension: 0.5,
          musicConfidence: 0.9
        },
        stage: {
          family: 'rupture',
          worldMode: 'collapse-well',
          compositorMode: 'scar',
          transformIntent: 'collapse'
        },
        composition: { shotClass: 'worldTakeover' },
        authority: { worldDominanceDelivered: 0.6 }
      })
    );

    expect(snapshot.kind).toBe('collapse-scar');
    expect(snapshot.worldLead).toBeGreaterThan(0);
    expect(snapshot.heroSuppression).toBeGreaterThan(0);
  });

  it('selects cathedral open for reveal architecture when safety is clean', () => {
    const governor = new SignatureMomentGovernor();
    const snapshot = governor.resolveFrame(
      buildInput({
        frame: {
          preDropTension: 0.65,
          sectionChange: 0.45,
          tonalStability: 0.9,
          musicConfidence: 0.85
        },
        stage: {
          family: 'gather',
          worldMode: 'fan-sweep',
          transformIntent: 'open'
        },
        composition: { transitionClass: 'iris' },
        authority: {
          chamberPresenceScore: 0.7,
          compositionSafetyScore: 0.94,
          overbright: 0.02
        }
      })
    );

    expect(snapshot.kind).toBe('cathedral-open');
    expect(snapshot.chamberArchitecture).toBeGreaterThan(0);
  });

  it('suppresses bright cathedral moments while still allowing darker collapse moments', () => {
    const governor = new SignatureMomentGovernor();
    const cathedral = governor.resolveFrame(
      buildInput({
        frame: {
          preDropTension: 0.65,
          sectionChange: 0.45,
          tonalStability: 0.9,
          musicConfidence: 0.85
        },
        stage: {
          family: 'gather',
          worldMode: 'fan-sweep',
          transformIntent: 'open'
        },
        authority: {
          overbright: 0.8,
          compositionSafetyScore: 0.2,
          chamberPresenceScore: 0.7
        }
      })
    );

    expect(cathedral.kind).not.toBe('cathedral-open');
    expect(cathedral.suppressionReason).toBe('overbright-risk');

    const collapse = new SignatureMomentGovernor().resolveFrame(
      buildInput({
        frame: { dropImpact: 0.95, sectionChange: 0.45, musicConfidence: 0.9 },
        stage: {
          family: 'rupture',
          worldMode: 'collapse-well',
          compositorMode: 'scar',
          transformIntent: 'collapse'
        },
        authority: { overbright: 0.8, compositionSafetyScore: 0.2 }
      })
    );

    expect(collapse.kind).toBe('collapse-scar');
  });

  it('selects ghost residue for release aftermath', () => {
    const governor = new SignatureMomentGovernor();
    const snapshot = governor.resolveFrame(
      buildInput({
        frame: {
          releaseTail: 0.9,
          resonance: 0.75,
          shimmer: 0.55,
          musicConfidence: 0.55
        },
        stage: {
          family: 'release',
          residueMode: 'ghost',
          compositorMode: 'afterimage'
        },
        authority: { frameHierarchyScore: 0.86 }
      })
    );

    expect(snapshot.kind).toBe('ghost-residue');
    expect(snapshot.style).toBe('ambient-premium');
    expect(snapshot.memoryStrength).toBeGreaterThan(0);
  });

  it('selects silence constellation for quiet readable passages', () => {
    const governor = new SignatureMomentGovernor();
    const snapshot = governor.resolveFrame(
      buildInput({
        frame: {
          showState: 'atmosphere',
          musicConfidence: 0.04,
          dropImpact: 0,
          speechConfidence: 0,
          ambienceConfidence: 0.85,
          air: 0.55,
          shimmer: 0.45
        },
        stage: { worldMode: 'field-bloom' }
      })
    );

    expect(snapshot.kind).toBe('silence-constellation');
    expect(snapshot.style).toBe('ambient-premium');
  });

  it('precharges a weak candidate before striking on phrase-scale proof', () => {
    const governor = new SignatureMomentGovernor();
    const precharge = governor.resolveFrame(
      buildInput({
        elapsedSeconds: 20,
        frame: {
          preDropTension: 0.55,
          sectionChange: 0.18,
          tonalStability: 0.8,
          musicConfidence: 0.7
        },
        stage: {
          family: 'gather',
          worldMode: 'fan-sweep',
          transformIntent: 'open'
        },
        authority: { chamberPresenceScore: 0.45, compositionSafetyScore: 0.92 }
      })
    );

    expect(precharge.kind).toBe('cathedral-open');
    expect(precharge.phase === 'armed' || precharge.phase === 'precharge').toBe(true);
    expect(precharge.prechargeProgress).toBeGreaterThanOrEqual(0);

    const strike = governor.resolveFrame(
      buildInput({
        elapsedSeconds: 21.5,
        frame: {
          preDropTension: 0.55,
          sectionChange: 0.36,
          tonalStability: 0.8,
          musicConfidence: 0.7
        },
        stage: {
          family: 'gather',
          worldMode: 'fan-sweep',
          transformIntent: 'open'
        },
        authority: { chamberPresenceScore: 0.45, compositionSafetyScore: 0.92 }
      })
    );

    expect(strike.kind).toBe('cathedral-open');
    expect(strike.startedAtSeconds).toBe(21.5);
    expect(strike.triggerConfidence).toBeGreaterThan(0);
  });

  it('supports forced preview overrides without natural cue eligibility', () => {
    const governor = new SignatureMomentGovernor();
    const snapshot = governor.resolveFrame(
      buildInput({
        elapsedSeconds: 30,
        frame: {
          musicConfidence: 0,
          dropImpact: 0,
          sectionChange: 0,
          ambienceConfidence: 0
        },
        devOverride: {
          kind: 'ghost-residue',
          style: 'ambient-premium',
          syntheticProfile: 'release',
          startedAtSeconds: 29.5,
          durationSeconds: 4,
          intensity: 1,
          receiptRequested: true
        }
      })
    );

    expect(snapshot.kind).toBe('ghost-residue');
    expect(snapshot.style).toBe('ambient-premium');
    expect(snapshot.forcedPreview).toBe(true);
  });

  it('preserves clean safe-tier neon and converts only risky neon', () => {
    const clean = new SignatureMomentGovernor().resolveFrame(
      buildInput({
        elapsedSeconds: 30,
        qualityTier: 'safe',
        authority: {
          compositionSafetyScore: 0.88,
          overbright: 0.08,
          ringBeltPersistence: 0.18
        },
        devOverride: {
          kind: 'cathedral-open',
          style: 'maximal-neon',
          syntheticProfile: 'reveal',
          startedAtSeconds: 29.5,
          durationSeconds: 4,
          intensity: 1
        }
      })
    );

    expect(clean.style).toBe('maximal-neon');
    expect(clean.decisionTrace.safetyAction).toBe('preserve-neon');

    const risky = new SignatureMomentGovernor().resolveFrame(
      buildInput({
        elapsedSeconds: 30,
        qualityTier: 'safe',
        authority: {
          compositionSafetyScore: 0.48,
          overbright: 0.52,
          ringBeltPersistence: 0.74
        },
        devOverride: {
          kind: 'cathedral-open',
          style: 'maximal-neon',
          syntheticProfile: 'reveal',
          startedAtSeconds: 29.5,
          durationSeconds: 4,
          intensity: 1
        }
      })
    );

    expect(risky.style).toBe('contrast-mythic');
    expect(risky.decisionTrace.safetyAction).toBe('convert-contrast');
  });

  it('does not spend natural rarity budget for forced preview overrides', () => {
    const governor = new SignatureMomentGovernor();

    governor.resolveFrame(
      buildInput({
        elapsedSeconds: 30,
        devOverride: {
          kind: 'collapse-scar',
          style: 'auto',
          syntheticProfile: 'drop',
          startedAtSeconds: 29.5,
          durationSeconds: 4,
          intensity: 1,
          receiptRequested: true
        }
      })
    );

    const natural = governor.resolveFrame(
      buildInput({
        elapsedSeconds: 31,
        frame: { dropImpact: 0.95, sectionChange: 0.4, musicConfidence: 0.9 },
        stage: {
          family: 'rupture',
          worldMode: 'collapse-well',
          compositorMode: 'scar',
          transformIntent: 'collapse'
        }
      })
    );

    expect(natural.kind).toBe('collapse-scar');
    expect(natural.forcedPreview).toBe(false);
  });

  it('uses cooldowns to prevent repeated phrase spam', () => {
    const governor = new SignatureMomentGovernor();

    expect(
      governor.resolveFrame(
        buildInput({
          elapsedSeconds: 10,
          frame: { dropImpact: 0.95, sectionChange: 0.4, musicConfidence: 0.9 },
          stage: {
            family: 'rupture',
            worldMode: 'collapse-well',
            compositorMode: 'scar',
            transformIntent: 'collapse'
          }
        })
      ).kind
    ).toBe('collapse-scar');

    expect(
      governor.resolveFrame(
        buildInput({
          elapsedSeconds: 16,
          frame: { dropImpact: 0.95, sectionChange: 0.4, musicConfidence: 0.9 },
          stage: {
            family: 'rupture',
            worldMode: 'collapse-well',
            compositorMode: 'scar',
            transformIntent: 'collapse'
          }
        })
      ).kind
    ).toBe('none');

    expect(
      governor.resolveFrame(
        buildInput({
          elapsedSeconds: 16.2,
          frame: { dropImpact: 0.95, sectionChange: 0.4, musicConfidence: 0.9 },
          stage: {
            family: 'rupture',
            worldMode: 'collapse-well',
            compositorMode: 'scar',
            transformIntent: 'collapse'
          }
        })
      ).suppressionReason
    ).toBe('cooldown');
  });
});
