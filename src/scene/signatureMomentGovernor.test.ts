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
import { SignatureMomentGovernor } from './governors/SignatureMomentGovernor';

function buildInput(input: {
  frame?: Partial<ListeningFrame>;
  stage?: Partial<StageCuePlan>;
  composition?: Partial<StageCompositionPlan>;
  authority?: Partial<AuthorityFrameSnapshot>;
  elapsedSeconds?: number;
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
    qualityTier: 'premium' as const
  };
}

describe('SignatureMomentGovernor', () => {
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
          family: 'reveal',
          worldMode: 'cathedral-rise',
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
          family: 'reveal',
          worldMode: 'cathedral-rise',
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
