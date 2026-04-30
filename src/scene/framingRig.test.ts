import { describe, expect, it } from 'vitest';
import { DEFAULT_STAGE_AUDIO_FEATURES } from '../audio/stageAudioFeatures';
import { DEFAULT_LISTENING_FRAME } from '../types/audio';
import {
  DEFAULT_STAGE_CUE_PLAN,
  DEFAULT_VISUAL_CUE_STATE,
  DEFAULT_VISUAL_TEMPORAL_WINDOWS
} from '../types/visual';
import { resolveStageCompositionPlan } from './rigs/FramingRig';
import type { StageIdleContext } from './rigs/types';

function createContext(
  overrides: Partial<StageIdleContext> = {}
): StageIdleContext {
  return {
    frame: { ...DEFAULT_LISTENING_FRAME },
    elapsedSeconds: 32,
    deltaSeconds: 1 / 60,
    idleBreath: 0.5,
    activeAct: 'eclipse-rupture',
    paletteState: 'void-cyan',
    cueState: { ...DEFAULT_VISUAL_CUE_STATE },
    cuePlan: { ...DEFAULT_STAGE_CUE_PLAN },
    audioFeatures: { ...DEFAULT_STAGE_AUDIO_FEATURES },
    temporalWindows: { ...DEFAULT_VISUAL_TEMPORAL_WINDOWS },
    qualityTier: 'safe',
    pointer: { x: 0, y: 0 },
    budgets: {
      ambientGlow: 0.12,
      eventGlow: 0.28
    },
    director: {
      worldActivity: 0.54,
      spectacle: 0.68,
      geometry: 0.46,
      radiance: 0.52,
      atmosphere: 0.44,
      framing: 0.82,
      colorBias: 0.52,
      colorWarp: 0.36,
      laserDrive: 0.78
    },
    ...overrides
  };
}

describe('FramingRig composition planning', () => {
  it('forces worldTakeover fallback for unsafe rupture windows', () => {
    const plan = resolveStageCompositionPlan({
      context: createContext({
        cueState: {
          ...DEFAULT_VISUAL_CUE_STATE,
          intensity: 0.84,
          attack: 0.82,
          eventDensity: 0.78
        },
        cuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'rupture',
          dominance: 'world',
          spendProfile: 'peak',
          stageWeight: 0.84,
          eventDensity: 0.76,
          heroScaleMin: 0.52,
          heroScaleMax: 1.74,
          heroAnchorLane: 'right'
        },
        audioFeatures: {
          ...DEFAULT_STAGE_AUDIO_FEATURES,
          tempo: {
            bpm: 128,
            lock: 0.86,
            density: 0.82
          },
          impact: {
            build: 0.76,
            hit: 0.84,
            section: 0.52,
            percussion: 0
          }
        },
        temporalWindows: {
          ...DEFAULT_VISUAL_TEMPORAL_WINDOWS,
          beatStrike: 0.86,
          phraseResolve: 0.2
        }
      }),
      previousTelemetry: {
        heroCoverageEstimate: 0.42,
        heroOffCenterPenalty: 0.2,
        heroDepthPenalty: 0.18,
        chamberPresenceScore: 0.34,
        frameHierarchyScore: 0.42,
        compositionSafetyFlag: true,
        ringBeltPersistence: 0.4,
        wirefieldDensityScore: 0.3,
        worldDominanceDelivered: 0.24,
        overbright: 0.28
      },
      shotSeconds: 14
    });

    expect(plan.shotClass).toBe('worldTakeover');
    expect(plan.transitionClass).toBe('wipe');
    expect(plan.tempoCadenceMode).toBe('surge');
    expect(plan.fallbackDemoteHero).toBe(true);
    expect(plan.fallbackForceWorldTakeover).toBe(true);
    expect(plan.heroEnvelope.scaleCeiling).toBeLessThan(1.1);
  });

  it('keeps release out of aftermath cadence while still allowing aftermath shot language', () => {
    const plan = resolveStageCompositionPlan({
      context: createContext({
        activeAct: 'ghost-afterimage',
        cuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'release',
          dominance: 'hybrid',
          spendProfile: 'earned',
          stageWeight: 0.44,
          eventDensity: 0.24,
          heroScaleMin: 0.4,
          heroScaleMax: 1.02,
          heroAnchorLane: 'left'
        },
        audioFeatures: {
          ...DEFAULT_STAGE_AUDIO_FEATURES,
          tempo: {
            bpm: 124,
            lock: 0.74,
            density: 0.54
          },
          impact: {
            build: 0.32,
            hit: 0.14,
            section: 0.18,
            percussion: 0
          },
          memory: {
            afterglow: 0.82,
            resonance: 0.64
          }
        },
        temporalWindows: {
          ...DEFAULT_VISUAL_TEMPORAL_WINDOWS,
          phraseResolve: 0.52,
          postBeatRelease: 0.36,
          beatStrike: 0.16,
          interBeatFloat: 0.24
        }
      }),
      shotSeconds: 2.2
    });

    expect(plan.shotClass).toBe('aftermath');
    expect(plan.transitionClass).toBe('residueDissolve');
    expect(plan.tempoCadenceMode).toBe('metered');
    expect(plan.heroEnvelope.scaleCeiling).toBeLessThan(1.05);
    expect(plan.chamberEnvelope.dominanceFloor).toBeGreaterThan(0.4);
  });

  it('routes haunt into isolate with off-center mobility instead of aftermath lock', () => {
    const plan = resolveStageCompositionPlan({
      context: createContext({
        activeAct: 'ghost-afterimage',
        cuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'haunt',
          dominance: 'chamber',
          spendProfile: 'withheld',
          stageWeight: 0.34,
          eventDensity: 0.18,
          heroScaleMin: 0.26,
          heroScaleMax: 0.74,
          heroAnchorLane: 'left'
        },
        audioFeatures: {
          ...DEFAULT_STAGE_AUDIO_FEATURES,
          tempo: {
            bpm: 118,
            lock: 0.38,
            density: 0.26
          },
          memory: {
            afterglow: 0.7,
            resonance: 0.52
          }
        },
        cueState: {
          ...DEFAULT_VISUAL_CUE_STATE,
          intensity: 0.38,
          attack: 0.16,
          sustain: 0.2,
          eventDensity: 0.14
        },
        temporalWindows: {
          ...DEFAULT_VISUAL_TEMPORAL_WINDOWS,
          phraseResolve: 0.22,
          postBeatRelease: 0.2,
          beatStrike: 0.12
        }
      }),
      shotSeconds: 1.8
    });

    expect(plan.shotClass).toBe('isolate');
    expect(plan.transitionClass).toBe('hold');
    expect(plan.tempoCadenceMode).toBe('float');
    expect(plan.eventScale).toBe('micro');
    expect(plan.heroEnvelope.scaleCeiling).toBeLessThan(0.8);
    expect(plan.heroEnvelope.coverageMax).toBeLessThan(0.16);
    expect(plan.heroEnvelope.offCenterMax).toBeGreaterThan(0.23);
    expect(plan.heroEnvelope.driftAllowance).toBeGreaterThan(0.2);
    expect(plan.heroEnvelope.laneTargetX).toBeLessThan(0.45);
  });

  it('widens reveal and gather hero envelopes in safe framing classes without forcing default world takeover', () => {
    const revealPlan = resolveStageCompositionPlan({
      context: createContext({
        activeAct: 'laser-bloom',
        cuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'reveal',
          dominance: 'world',
          spendProfile: 'peak',
          stageWeight: 0.84,
          eventDensity: 0.62,
          heroScaleMin: 0.48,
          heroScaleMax: 1.12,
          heroAnchorLane: 'right'
        },
        cueState: {
          ...DEFAULT_VISUAL_CUE_STATE,
          intensity: 0.82,
          attack: 0.78,
          sustain: 0.46,
          eventDensity: 0.58
        },
        audioFeatures: {
          ...DEFAULT_STAGE_AUDIO_FEATURES,
          tempo: {
            bpm: 132,
            lock: 0.82,
            density: 0.84
          },
          impact: {
            build: 0.72,
            hit: 0.66,
            section: 0.52,
            percussion: 0
          }
        },
        temporalWindows: {
          ...DEFAULT_VISUAL_TEMPORAL_WINDOWS,
          phraseResolve: 0.58,
          beatStrike: 0.78,
          postBeatRelease: 0.22
        }
      }),
      shotSeconds: 1.4
    });

    expect(revealPlan.shotClass).toBe('worldTakeover');
    expect(revealPlan.tempoCadenceMode).toBe('driving');
    expect(revealPlan.heroEnvelope.coverageMax).toBeGreaterThan(0.3);
    expect(revealPlan.heroEnvelope.offCenterMax).toBeGreaterThan(0.28);
    expect(revealPlan.heroEnvelope.driftAllowance).toBeGreaterThan(0.28);
    expect(revealPlan.heroEnvelope.scaleCeiling).toBeGreaterThan(1);

    const gatherPlan = resolveStageCompositionPlan({
      context: createContext({
        activeAct: 'matrix-storm',
        cuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'gather',
          dominance: 'chamber',
          spendProfile: 'withheld',
          stageWeight: 0.48,
          eventDensity: 0.38,
          heroScaleMin: 0.3,
          heroScaleMax: 0.88,
          heroAnchorLane: 'high'
        },
        cueState: {
          ...DEFAULT_VISUAL_CUE_STATE,
          intensity: 0.44,
          attack: 0.18,
          sustain: 0.24,
          eventDensity: 0.32
        },
        audioFeatures: {
          ...DEFAULT_STAGE_AUDIO_FEATURES,
          tempo: {
            bpm: 108,
            lock: 0.62,
            density: 0.38
          },
          impact: {
            build: 0.42,
            hit: 0.18,
            section: 0.16,
            percussion: 0
          }
        }
      }),
      shotSeconds: 1.6
    });

    expect(gatherPlan.shotClass).toBe('pressure');
    expect(gatherPlan.tempoCadenceMode).toBe('metered');
    expect(gatherPlan.heroEnvelope.coverageMax).toBeGreaterThan(0.3);
    expect(gatherPlan.heroEnvelope.offCenterMax).toBeGreaterThan(0.28);
    expect(gatherPlan.heroEnvelope.driftAllowance).toBeGreaterThan(0.23);
    expect(gatherPlan.fallbackForceWorldTakeover).toBe(false);
  });

  it('raises quiet room-mic floors for readable hero travel without forcing world takeover', () => {
    const plan = resolveStageCompositionPlan({
      context: createContext({
        frame: {
          ...DEFAULT_LISTENING_FRAME,
          mode: 'room-mic',
          showState: 'generative',
          performanceIntent: 'gather',
          musicConfidence: 0.28,
          speechConfidence: 0.08,
          dropImpact: 0.06,
          releaseTail: 0.08
        },
        activeAct: 'laser-bloom',
        cuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'gather',
          dominance: 'chamber',
          spendProfile: 'withheld',
          stageWeight: 0.34,
          eventDensity: 0.22,
          heroScaleMin: 0.26,
          heroScaleMax: 0.82,
          heroAnchorLane: 'left'
        },
        cueState: {
          ...DEFAULT_VISUAL_CUE_STATE,
          intensity: 0.3,
          attack: 0.14,
          sustain: 0.18,
          eventDensity: 0.2
        },
        audioFeatures: {
          ...DEFAULT_STAGE_AUDIO_FEATURES,
          tempo: {
            bpm: 96,
            lock: 0.22,
            density: 0.16
          }
        }
      }),
      shotSeconds: 3.2
    });

    expect(['anchor', 'pressure']).toContain(plan.shotClass);
    expect(plan.heroEnvelope.coverageMin).toBeGreaterThanOrEqual(0.05);
    expect(plan.heroEnvelope.travelMinX).toBeGreaterThanOrEqual(0.18);
    expect(plan.heroEnvelope.travelMinY).toBeGreaterThanOrEqual(0.1);
    expect(plan.heroEnvelope.driftAllowance).toBeGreaterThan(0.4);
    expect(plan.heroEnvelope.offCenterMax).toBeGreaterThan(0.4);
    expect(plan.heroEnvelope.scaleCeiling).toBeGreaterThan(1);
  });

  it('uses shared music floor and composition control to keep generative shots readable outside room-mic', () => {
    const plan = resolveStageCompositionPlan({
      context: createContext({
        frame: {
          ...DEFAULT_LISTENING_FRAME,
          mode: 'system-audio',
          showState: 'generative',
          performanceIntent: 'gather',
          musicConfidence: 0.34,
          speechConfidence: 0.02,
          releaseTail: 0.08,
          body: 0.18,
          tonalStability: 0.34,
          harmonicColor: 0.62,
          shimmer: 0.18,
          momentum: 0.24
        },
        activeAct: 'laser-bloom',
        cuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'gather',
          dominance: 'chamber',
          spendProfile: 'withheld',
          stageWeight: 0.46,
          eventDensity: 0.26,
          heroScaleMin: 0.38,
          heroScaleMax: 1.04,
          heroAnchorLane: 'right'
        },
        cueState: {
          ...DEFAULT_VISUAL_CUE_STATE,
          intensity: 0.34,
          attack: 0.16,
          sustain: 0.2,
          eventDensity: 0.22
        },
        director: {
          worldActivity: 0.82,
          spectacle: 0.84,
          geometry: 0.56,
          radiance: 0.74,
          atmosphere: 0.46,
          framing: 0.92,
          colorBias: 0.62,
          colorWarp: 0.44,
          laserDrive: 0.86
        }
      }),
      shotSeconds: 2.4
    });

    expect(['pressure', 'worldTakeover']).toContain(plan.shotClass);
    expect(plan.heroEnvelope.coverageMin).toBeGreaterThan(0.05);
    expect(plan.heroEnvelope.travelMinX).toBeGreaterThan(0.14);
    expect(plan.heroEnvelope.offCenterMax).toBeGreaterThan(0.3);
    expect(plan.heroEnvelope.driftAllowance).toBeGreaterThan(0.28);
    expect(plan.heroEnvelope.scaleCeiling).toBeGreaterThan(1);
  });

  it('keeps fan-sweep reveal from being auto-forced back into worldTakeover', () => {
    const plan = resolveStageCompositionPlan({
      context: createContext({
        activeAct: 'matrix-storm',
        cuePlan: {
          ...DEFAULT_STAGE_CUE_PLAN,
          family: 'reveal',
          dominance: 'hybrid',
          worldMode: 'fan-sweep',
          spendProfile: 'peak',
          stageWeight: 0.58,
          chamberWeight: 0.66,
          worldWeight: 0.62,
          heroScaleMin: 0.38,
          heroScaleMax: 0.96,
          heroAnchorLane: 'left'
        },
        cueState: {
          ...DEFAULT_VISUAL_CUE_STATE,
          intensity: 0.54,
          attack: 0.48,
          sustain: 0.32,
          eventDensity: 0.34
        },
        audioFeatures: {
          ...DEFAULT_STAGE_AUDIO_FEATURES,
          tempo: {
            bpm: 122,
            lock: 0.74,
            density: 0.58
          },
          impact: {
            build: 0.34,
            hit: 0.22,
            section: 0.18,
            percussion: 0
          }
        },
        temporalWindows: {
          ...DEFAULT_VISUAL_TEMPORAL_WINDOWS,
          beatStrike: 0.38,
          phraseResolve: 0.24,
          interBeatFloat: 0.28
        }
      }),
      previousTelemetry: {
        heroCoverageEstimate: 0.2,
        heroOffCenterPenalty: 0,
        heroDepthPenalty: 0,
        chamberPresenceScore: 0.4,
        frameHierarchyScore: 0.78,
        compositionSafetyFlag: false,
        ringBeltPersistence: 0.34,
        wirefieldDensityScore: 0.22,
        worldDominanceDelivered: 0.42,
        overbright: 0.08
      },
      shotSeconds: 1.4
    });

    expect(plan.shotClass).toBe('pressure');
    expect(plan.fallbackForceWorldTakeover).toBe(false);
    expect(plan.chamberEnvelope.worldTakeoverBias).toBeLessThan(0.42);
  });
});
