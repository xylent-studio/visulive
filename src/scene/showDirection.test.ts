import { describe, expect, it } from 'vitest';
import { DEFAULT_LISTENING_FRAME } from '../types/audio';
import { DEFAULT_STAGE_CUE_PLAN } from '../types/visual';
import {
  buildShowActScores,
  buildPaletteStateScores,
  buildPaletteFrame,
  chooseShowAct,
  choosePaletteState,
  chooseVisualMotifKind,
  deriveStageCuePlan,
  deriveVisualCue,
  deriveVisualMotifKind,
  deriveVisualMotifSnapshot,
  deriveTemporalWindows
} from './showDirection';

describe('showDirection', () => {
  it('derives semantic motifs and hero grammar from musical cues', () => {
    const ruptureFrame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      performanceIntent: 'detonate' as const,
      musicConfidence: 0.84,
      beatConfidence: 0.72,
      transientConfidence: 0.68,
      dropImpact: 0.72,
      sectionChange: 0.28,
      releaseTail: 0.04,
      air: 0.2,
      body: 0.74,
      shimmer: 0.24,
      harmonicColor: 0.48
    };

    expect(
      deriveVisualMotifKind({
        frame: ruptureFrame,
        cuePlan: {
          family: 'rupture',
          dominance: 'hybrid',
          worldMode: 'collapse-well',
          heroWeight: 0.32,
          worldWeight: 0.68,
          eventDensity: 0.68
        }
      })
    ).toBe('rupture-scar');

    const ruptureSnapshot = deriveVisualMotifSnapshot({
      frame: ruptureFrame,
      cuePlan: {
        ...DEFAULT_STAGE_CUE_PLAN,
        family: 'rupture',
        worldMode: 'collapse-well',
        heroForm: 'shard',
        heroAccentForm: 'pyramid'
      },
      paletteBaseState: 'solar-magenta',
      paletteTransitionReason: 'drop-rupture'
    });

    expect(ruptureSnapshot.kind).toBe('rupture-scar');
    expect(ruptureSnapshot.heroForm).toBe('shard');
    expect(ruptureSnapshot.heroFormReason).toBe('drop-rupture');

    const releaseSnapshot = deriveVisualMotifSnapshot({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        mode: 'system-audio' as const,
        performanceIntent: 'haunt' as const,
        musicConfidence: 0.64,
        beatConfidence: 0.28,
        transientConfidence: 0.12,
        dropImpact: 0.04,
        sectionChange: 0.08,
        releaseTail: 0.58,
        air: 0.42,
        body: 0.24,
        shimmer: 0.36,
        harmonicColor: 0.38
      },
      cuePlan: {
        ...DEFAULT_STAGE_CUE_PLAN,
        family: 'release',
        worldMode: 'ghost-chamber',
        heroForm: 'diamond',
        heroAccentForm: 'orb'
      },
      paletteBaseState: 'ghost-white',
      paletteTransitionReason: 'release-residue'
    });

    expect(['ghost-residue', 'silence-constellation']).toContain(releaseSnapshot.kind);
    expect(releaseSnapshot.heroForm).toBe('diamond');
    expect(releaseSnapshot.heroFormReason).toBe('release-residue');
  });

  it('separates semantic palette base from continuous modulation targets', () => {
    const frame = buildPaletteFrame({
      baseState: 'tron-blue',
      targets: {
        'void-cyan': 0.18,
        'tron-blue': 0.32,
        'acid-lime': 0.24,
        'solar-magenta': 0.18,
        'ghost-white': 0.08
      },
      transitionReason: 'hold',
      semanticConfidence: 0.72
    });

    expect(frame.baseState).toBe('tron-blue');
    expect(frame.modulationTargets['acid-lime']).toBeGreaterThan(0.2);
    expect(frame.roles.primaryEmission).toBe('tron-blue');
    expect(frame.transitionReason).toBe('hold');
  });

  it('latches semantic episodes and exposes authored ring posture instead of anonymous holds', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.8,
      beatConfidence: 0.62,
      transientConfidence: 0.28,
      dropImpact: 0.08,
      sectionChange: 0.34,
      releaseTail: 0.04,
      air: 0.36,
      body: 0.42,
      shimmer: 0.72,
      harmonicColor: 0.68
    };
    const cuePlan = {
      ...DEFAULT_STAGE_CUE_PLAN,
      family: 'reveal' as const,
      worldMode: 'cathedral-rise' as const,
      dominance: 'hybrid' as const,
      heroForm: 'prism' as const,
      heroAccentForm: 'pyramid' as const,
      ringAuthority: 'framing-architecture' as const
    };

    const opened = deriveVisualMotifSnapshot({
      frame,
      cuePlan,
      paletteBaseState: 'tron-blue',
      paletteTransitionReason: 'hold',
      elapsedSeconds: 12,
      lastEpisodeChangeSeconds: 12
    });
    const held = deriveVisualMotifSnapshot({
      frame,
      cuePlan,
      paletteBaseState: 'tron-blue',
      paletteTransitionReason: 'hold',
      currentEpisodeId: opened.semanticEpisodeId,
      elapsedSeconds: 17,
      lastEpisodeChangeSeconds: 12
    });

    expect(opened.kind).toBe('neon-portal');
    expect(opened.semanticEpisodeTransitionReason).toBe('cue-family');
    expect(opened.paletteBaseHoldReason).toBe('scene-held');
    expect(opened.ringPosture).toBe('cathedral-architecture');
    expect(held.semanticEpisodeId).toBe(opened.semanticEpisodeId);
    expect(held.semanticEpisodeAgeSeconds).toBe(5);
    expect(held.semanticEpisodeTransitionReason).toBe('hold');
  });

  it('keeps fan-sweep neon portals out of static cathedral ring posture', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.74,
      beatConfidence: 0.5,
      transientConfidence: 0.36,
      dropImpact: 0.12,
      sectionChange: 0.18,
      releaseTail: 0.06,
      air: 0.36,
      body: 0.38,
      shimmer: 0.62,
      harmonicColor: 0.62
    };
    const snapshot = deriveVisualMotifSnapshot({
      frame,
      cuePlan: {
        ...DEFAULT_STAGE_CUE_PLAN,
        family: 'reveal',
        worldMode: 'fan-sweep',
        ringAuthority: 'framing-architecture'
      },
      paletteBaseState: 'acid-lime',
      paletteTransitionReason: 'hold'
    });

    expect(snapshot.kind).toBe('neon-portal');
    expect(snapshot.ringPosture).toBe('event-strike');
  });

  it('lets cathedral-open residue decay out of architectural ring posture', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.74,
      beatConfidence: 0.44,
      transientConfidence: 0.2,
      dropImpact: 0.08,
      sectionChange: 0.12,
      releaseTail: 0.22,
      air: 0.42,
      body: 0.3,
      shimmer: 0.58,
      harmonicColor: 0.56
    };

    const snapshot = deriveVisualMotifSnapshot({
      frame,
      cuePlan: {
        ...DEFAULT_STAGE_CUE_PLAN,
        family: 'reveal',
        worldMode: 'cathedral-rise',
        residueMode: 'short',
        ringAuthority: 'framing-architecture'
      },
      paletteBaseState: 'tron-blue',
      paletteTransitionReason: 'hold',
      signatureMomentKind: 'cathedral-open',
      signatureMomentPhase: 'residue'
    });

    expect(snapshot.kind).toBe('neon-portal');
    expect(snapshot.ringPosture).toBe('residue-trace');
  });

  it('lets motif grammar choose readable hero forms instead of palette jitter', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'surge' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.82,
      peakConfidence: 0.64,
      beatConfidence: 0.76,
      preDropTension: 0.7,
      dropImpact: 0.18,
      sectionChange: 0.34,
      releaseTail: 0.04,
      resonance: 0.34,
      momentum: 0.78,
      speechConfidence: 0.02,
      transientConfidence: 0.42,
      body: 0.62,
      tonalStability: 0.58,
      harmonicColor: 0.72,
      brightness: 0.66,
      shimmer: 0.84,
      air: 0.58,
      momentKind: 'lift' as const
    };
    const windows = deriveTemporalWindows(frame);
    const cueState = deriveVisualCue(frame, 'matrix-storm', windows);
    const plan = deriveStageCuePlan({
      frame,
      cueState,
      showAct: 'matrix-storm'
    });

    expect(plan.visualMotif).toBe('neon-portal');
    expect(['prism', 'pyramid']).toContain(plan.heroForm);
    expect(plan.heroFormHoldSeconds).toBeGreaterThanOrEqual(7);
    expect(plan.heroFormReason).toBe('motif-change');
  });

  it('holds a luminous motif through brief non-urgent rupture flicker', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.72,
      dropImpact: 0.3,
      sectionChange: 0.22,
      releaseTail: 0.03,
      air: 0.42,
      body: 0.36
    };

    expect(
      chooseVisualMotifKind({
        rawMotif: 'rupture-scar',
        currentMotif: 'neon-portal',
        currentMotifAgeSeconds: 0.62,
        frame,
        cuePlan: {
          family: 'gather',
          dominance: 'hybrid',
          worldMode: 'aperture-cage',
          worldWeight: 0.68,
          transformIntent: 'compress'
        }
      })
    ).toBe('neon-portal');

    expect(
      chooseVisualMotifKind({
        rawMotif: 'rupture-scar',
        currentMotif: 'neon-portal',
        currentMotifAgeSeconds: 0.62,
        frame: {
          ...frame,
          performanceIntent: 'detonate',
          dropImpact: 0.72,
          sectionChange: 0.34
        },
        cuePlan: {
          family: 'rupture',
          dominance: 'world',
          worldMode: 'collapse-well',
          worldWeight: 0.9,
          transformIntent: 'collapse'
        }
      })
    ).toBe('rupture-scar');
  });

  it('keeps palette changes deliberate until a strong new winner appears', () => {
    const frame: Parameters<typeof buildPaletteStateScores>[0] = {
      ...DEFAULT_LISTENING_FRAME,
      showState: 'tactile',
      performanceIntent: 'gather',
      harmonicColor: 0.28,
      shimmer: 0.82,
      transientConfidence: 0.62,
      musicConfidence: 0.7,
      resonance: 0.28,
      releaseTail: 0.04,
      sectionChange: 0.08,
      dropImpact: 0.1,
      air: 0.42
    };
    const scores = buildPaletteStateScores(frame, 'matrix-storm');

    expect(scores['acid-lime']).toBeGreaterThan(scores['solar-magenta']);

    const holdScores = {
      'void-cyan': 0.18,
      'tron-blue': 0.24,
      'acid-lime': 0.46,
      'solar-magenta': 0.2,
      'ghost-white': 0.16
    } as const;

    const held = choosePaletteState({
      currentState: 'solar-magenta',
      secondsSinceLastChange: 0.8,
      scores: holdScores,
      minimumHoldSeconds: 2.2,
      switchThreshold: 0.16
    });

    expect(held).toBe('solar-magenta');

    const switched = choosePaletteState({
      currentState: 'solar-magenta',
      secondsSinceLastChange: 3,
      scores: holdScores,
      minimumHoldSeconds: 2.2,
      switchThreshold: 0.16
    });

    expect(switched).toBe('acid-lime');
  });

  it('resists early base-palette flips from close challengers', () => {
    const held = choosePaletteState({
      currentState: 'acid-lime',
      secondsSinceLastChange: 0.7,
      scores: {
        'void-cyan': 0.18,
        'tron-blue': 0.63,
        'acid-lime': 0.5,
        'solar-magenta': 0.36,
        'ghost-white': 0.12
      },
      minimumHoldSeconds: 5.2,
      switchThreshold: 0.06
    });

    expect(held).toBe('acid-lime');
  });

  it('keeps act changes deliberate until a stronger act wins', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'surge' as const,
      performanceIntent: 'detonate' as const,
      musicConfidence: 0.82,
      peakConfidence: 0.74,
      beatConfidence: 0.72,
      preDropTension: 0.78,
      dropImpact: 0.68,
      sectionChange: 0.44,
      releaseTail: 0.1,
      resonance: 0.3,
      shimmer: 0.36,
      air: 0.28,
      subPressure: 0.7,
      bassBody: 0.62,
      speechConfidence: 0.02
    };
    const scores = buildShowActScores(frame);

    expect(scores['eclipse-rupture']).toBeGreaterThan(scores['void-chamber']);

    const held = chooseShowAct({
      currentAct: 'void-chamber',
      secondsSinceLastChange: 1.6,
      scores,
      minimumHoldSeconds: 4.2,
      switchThreshold: 0.08
    });

    expect(held).toBe('eclipse-rupture');

    const resisted = chooseShowAct({
      currentAct: 'laser-bloom',
      secondsSinceLastChange: 1,
      scores: {
        'void-chamber': 0.18,
        'laser-bloom': 0.44,
        'matrix-storm': 0.46,
        'eclipse-rupture': 0.49,
        'ghost-afterimage': 0.2
      },
      minimumHoldSeconds: 4.2,
      switchThreshold: 0.08
    });

    expect(resisted).toBe('laser-bloom');
  });

  it('lets rhythmic system-audio surge resolve into a non-rupture authored act instead of defaulting to matrix lock', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'surge' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.86,
      peakConfidence: 0.46,
      beatConfidence: 0.9,
      preDropTension: 0.42,
      dropImpact: 0.18,
      sectionChange: 0.16,
      releaseTail: 0.04,
      resonance: 0.24,
      shimmer: 0.88,
      air: 0.34,
      subPressure: 0.12,
      bassBody: 0.28,
      speechConfidence: 0.02
    };

    const scores = buildShowActScores(frame);

    expect(
      Math.max(scores['matrix-storm'], scores['laser-bloom'])
    ).toBeGreaterThan(scores['eclipse-rupture']);

    const act = chooseShowAct({
      currentAct: 'void-chamber',
      secondsSinceLastChange: 6,
      scores
    });

    expect(['matrix-storm', 'laser-bloom']).toContain(act);
  });

  it('keeps eclipse-rupture from monopolizing every strong rhythmic surge', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'surge' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.88,
      peakConfidence: 0.52,
      beatConfidence: 0.86,
      preDropTension: 0.46,
      dropImpact: 0.22,
      sectionChange: 0.18,
      releaseTail: 0.06,
      resonance: 0.28,
      shimmer: 0.82,
      air: 0.3,
      subPressure: 0.18,
      bassBody: 0.34,
      speechConfidence: 0.02
    };
    const scores = buildShowActScores(frame);

    expect(scores['matrix-storm']).toBeGreaterThan(scores['eclipse-rupture']);
    expect(scores['laser-bloom']).toBeGreaterThan(0.5);
  });

  it('keeps non-impact generative motion in non-rupture authored acts', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'generative' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.84,
      peakConfidence: 0.36,
      beatConfidence: 0.84,
      preDropTension: 0.14,
      dropImpact: 0.06,
      sectionChange: 0.08,
      releaseTail: 0.04,
      resonance: 0.16,
      momentum: 0.72,
      shimmer: 0.28,
      air: 0.14,
      harmonicColor: 0.22,
      tonalStability: 0.42,
      subPressure: 0.08,
      bassBody: 0.22,
      speechConfidence: 0.02
    };

    const scores = buildShowActScores(frame);

    expect(
      Math.max(scores['matrix-storm'], scores['laser-bloom'])
    ).toBeGreaterThan(scores['eclipse-rupture']);

    const act = chooseShowAct({
      currentAct: 'laser-bloom',
      secondsSinceLastChange: 6,
      scores
    });

    expect(['matrix-storm', 'laser-bloom']).toContain(act);
  });

  it('lets section-driven system-audio generative motion open into laser-bloom', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'generative' as const,
      performanceIntent: 'ignite' as const,
      musicConfidence: 0.82,
      peakConfidence: 0.34,
      beatConfidence: 0.42,
      preDropTension: 0.22,
      dropImpact: 0.08,
      sectionChange: 0.34,
      releaseTail: 0.1,
      resonance: 0.2,
      momentum: 0.58,
      shimmer: 0.44,
      air: 0.3,
      subPressure: 0.1,
      bassBody: 0.26,
      speechConfidence: 0.02
    };

    const scores = buildShowActScores(frame);

    expect(scores['laser-bloom']).toBeGreaterThan(scores['matrix-storm']);

    const act = chooseShowAct({
      currentAct: 'matrix-storm',
      secondsSinceLastChange: 6,
      scores
    });

    expect(act).toBe('laser-bloom');
  });

  it('lets structured system-audio ambient passages leave matrix-storm for void or bloom', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'generative' as const,
      performanceIntent: 'hold' as const,
      musicConfidence: 0.76,
      peakConfidence: 0.22,
      beatConfidence: 0.36,
      preDropTension: 0.14,
      dropImpact: 0.04,
      sectionChange: 0.28,
      releaseTail: 0.26,
      resonance: 0.42,
      momentum: 0.46,
      shimmer: 0.24,
      air: 0.44,
      body: 0.32,
      tonalStability: 0.74,
      harmonicColor: 0.22,
      subPressure: 0.06,
      bassBody: 0.24,
      speechConfidence: 0.02
    };
    const scores = buildShowActScores(frame);

    expect(
      Math.max(scores['void-chamber'], scores['laser-bloom'])
    ).toBeGreaterThan(scores['matrix-storm']);

    const act = chooseShowAct({
      currentAct: 'matrix-storm',
      secondsSinceLastChange: 6.2,
      scores
    });

    expect(['void-chamber', 'laser-bloom']).toContain(act);
  });

  it('lets system-audio palette scoring break out of tron-blue lock on warmer section changes', () => {
    const frame: Parameters<typeof buildPaletteStateScores>[0] = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio',
      showState: 'generative',
      performanceIntent: 'ignite',
      harmonicColor: 0.58,
      shimmer: 0.42,
      dropImpact: 0.1,
      sectionChange: 0.34,
      releaseTail: 0.08,
      musicConfidence: 0.8,
      resonance: 0.22,
      transientConfidence: 0.34,
      beatConfidence: 0.44,
      air: 0.22,
      body: 0.34,
      tonalStability: 0.62,
      speechConfidence: 0.02
    };
    const scores = buildPaletteStateScores(frame, 'laser-bloom');

    expect(scores['solar-magenta']).toBeGreaterThan(scores['tron-blue']);
  });

  it('gives matrix recovery palettes colder and ghostlier escape routes', () => {
    const frame: Parameters<typeof buildPaletteStateScores>[0] = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio',
      showState: 'generative',
      performanceIntent: 'hold',
      harmonicColor: 0.24,
      shimmer: 0.18,
      dropImpact: 0.08,
      sectionChange: 0.24,
      releaseTail: 0.34,
      musicConfidence: 0.74,
      resonance: 0.42,
      transientConfidence: 0.22,
      beatConfidence: 0.38,
      air: 0.42,
      body: 0.28,
      tonalStability: 0.78,
      speechConfidence: 0.02
    };
    const scores = buildPaletteStateScores(frame, 'matrix-storm', {
      family: 'release',
      worldMode: 'ghost-chamber',
      paletteTargets: {
        'void-cyan': 0.32,
        'tron-blue': 0.22,
        'acid-lime': 0.08,
        'solar-magenta': 0.08,
        'ghost-white': 0.3
      },
      paletteHoldSeconds: 3.8
    });

    expect(
      Math.max(scores['void-cyan'], scores['tron-blue'], scores['ghost-white'])
    ).toBeGreaterThan(scores['acid-lime']);
    expect(
      Math.max(scores['void-cyan'], scores['tron-blue'], scores['ghost-white'])
    ).toBeGreaterThan(scores['solar-magenta']);
  });

  it('lets long-lived matrix-storm and tron-blue dwell yield to close challengers', () => {
    const act = chooseShowAct({
      currentAct: 'matrix-storm',
      secondsSinceLastChange: 9.5,
      scores: {
        'void-chamber': 0.22,
        'laser-bloom': 0.71,
        'matrix-storm': 0.67,
        'eclipse-rupture': 0.28,
        'ghost-afterimage': 0.16
      },
      minimumHoldSeconds: 5.6,
      switchThreshold: 0.1
    });

    expect(act).toBe('laser-bloom');

    const palette = choosePaletteState({
      currentState: 'tron-blue',
      secondsSinceLastChange: 5.2,
      scores: {
        'void-cyan': 0.34,
        'tron-blue': 0.48,
        'acid-lime': 0.22,
        'solar-magenta': 0.54,
        'ghost-white': 0.16
      },
      minimumHoldSeconds: 3.2,
      switchThreshold: 0.1
    });

    expect(palette).toBe('solar-magenta');
  });

  it('keeps spectral ghost-afterimage available during long aftermath dwell', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'aftermath' as const,
      performanceIntent: 'haunt' as const,
      musicConfidence: 0.72,
      peakConfidence: 0.28,
      beatConfidence: 0.44,
      preDropTension: 0.16,
      dropImpact: 0.1,
      sectionChange: 0.26,
      releaseTail: 0.68,
      resonance: 0.54,
      momentum: 0.66,
      momentKind: 'release' as const,
      momentAmount: 0.58,
      shimmer: 0.44,
      air: 0.36,
      subPressure: 0.08,
      bassBody: 0.24,
      speechConfidence: 0.02
    };
    const scores = buildShowActScores(frame);

    expect(scores['ghost-afterimage']).toBeGreaterThan(scores['matrix-storm']);

    const act = chooseShowAct({
      currentAct: 'ghost-afterimage',
      secondsSinceLastChange: 8,
      scores,
      minimumHoldSeconds: 4.2,
      switchThreshold: 0.08
    });

    expect(['ghost-afterimage', 'void-chamber', 'laser-bloom']).toContain(act);
  });

  it('builds meaningful between-beat temporal windows', () => {
    const windows = deriveTemporalWindows({
      beatPhase: 0.82,
      barPhase: 0.03,
      phrasePhase: 0.98,
      beatConfidence: 0.74,
      preDropTension: 0.62,
      dropImpact: 0.28,
      releaseTail: 0.44,
      musicConfidence: 0.7,
      resonance: 0.48,
      sectionChange: 0.36
    });

    expect(windows.preBeatLift).toBeGreaterThan(0.3);
    expect(windows.barTurn).toBeGreaterThan(0.4);
    expect(windows.phraseResolve).toBeGreaterThan(0.4);
    expect(windows.interBeatFloat).toBeGreaterThanOrEqual(0);
  });

  it('derives rupture cues for detonation moments', () => {
    const cue = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'detonate',
        musicConfidence: 0.84,
        peakConfidence: 0.78,
        beatConfidence: 0.72,
        preDropTension: 0.66,
        dropImpact: 0.74,
        sectionChange: 0.52,
        releaseTail: 0.08,
        resonance: 0.24,
        momentKind: 'strike',
        momentAmount: 0.88
      },
      'eclipse-rupture',
      {
        preBeatLift: 0.42,
        beatStrike: 0.86,
        postBeatRelease: 0.12,
        interBeatFloat: 0.1,
        barTurn: 0.34,
        phraseResolve: 0.22
      }
    );

    expect(cue.cueClass).toBe('rupture');
    expect(cue.screenWeight).toBeGreaterThan(0.8);
    expect(cue.heroWeight).toBeLessThan(cue.worldWeight);
    expect(cue.eventDensity).toBeGreaterThan(0.7);
  });

  it('derives afterglow cues with strong residue for aftermath', () => {
    const cue = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'aftermath',
        performanceIntent: 'hold',
        musicConfidence: 0.48,
        peakConfidence: 0.22,
        beatConfidence: 0.18,
        preDropTension: 0.08,
        dropImpact: 0.06,
        sectionChange: 0.18,
        releaseTail: 0.64,
        resonance: 0.58,
        momentKind: 'release',
        momentAmount: 0.52
      },
      'ghost-afterimage',
      {
        preBeatLift: 0.04,
        beatStrike: 0.08,
        postBeatRelease: 0.44,
        interBeatFloat: 0.26,
        barTurn: 0.18,
        phraseResolve: 0.62
      }
    );

    expect(cue.cueClass).toBe('afterglow');
    expect(cue.residueWeight).toBeGreaterThan(0.6);
    expect(cue.heroWeight).toBeLessThan(0.45);
    expect(cue.decay).toBeGreaterThan(0.45);
  });

  it('lets afterglow reach release instead of getting swallowed by haunt', () => {
    const cue = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'aftermath',
        performanceIntent: 'hold',
        musicConfidence: 0.56,
        peakConfidence: 0.24,
        beatConfidence: 0.2,
        preDropTension: 0.1,
        dropImpact: 0.06,
        sectionChange: 0.2,
        releaseTail: 0.48,
        resonance: 0.32,
        momentKind: 'release',
        momentAmount: 0.56
      },
      'matrix-storm',
      {
        preBeatLift: 0.06,
        beatStrike: 0.12,
        postBeatRelease: 0.5,
        interBeatFloat: 0.2,
        barTurn: 0.22,
        phraseResolve: 0.58
      }
    );

    expect(cue.cueClass).toBe('afterglow');

    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'aftermath',
        performanceIntent: 'hold',
        mode: 'system-audio',
        musicConfidence: 0.56,
        peakConfidence: 0.24,
        beatConfidence: 0.2,
        preDropTension: 0.1,
        dropImpact: 0.06,
        sectionChange: 0.2,
        releaseTail: 0.48
      },
      cueState: cue,
      showAct: 'matrix-storm',
      cueFamilySeconds: 1.4
    });

    expect(plan.family).toBe('release');
    expect(plan.dominance).toBe('hybrid');
    expect(plan.spendProfile).toBe('earned');
    expect(plan.worldMode).toBe('field-bloom');
    expect(plan.compositorMode).toBe('afterimage');
      expect(plan.residueMode).toBe('afterglow');
  });

  it('prefers release before haunt when phrase resolve and section change recover', () => {
    const cue = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'aftermath',
        performanceIntent: 'haunt',
        musicConfidence: 0.6,
        peakConfidence: 0.24,
        beatConfidence: 0.28,
        preDropTension: 0.14,
        dropImpact: 0.12,
        sectionChange: 0.3,
        releaseTail: 0.54,
        resonance: 0.38,
        momentum: 0.58,
        momentKind: 'release',
        momentAmount: 0.62
      },
      'ghost-afterimage',
      {
        preBeatLift: 0.08,
        beatStrike: 0.1,
        postBeatRelease: 0.48,
        interBeatFloat: 0.22,
        barTurn: 0.2,
        phraseResolve: 0.54
      }
    );

    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'aftermath',
        performanceIntent: 'haunt',
        mode: 'system-audio',
        musicConfidence: 0.6,
        peakConfidence: 0.24,
        beatConfidence: 0.28,
        preDropTension: 0.14,
        dropImpact: 0.12,
        sectionChange: 0.3,
        releaseTail: 0.54,
        momentum: 0.58,
        momentKind: 'release'
      },
      cueState: cue,
      showAct: 'ghost-afterimage',
      cueFamilySeconds: 2.2
    });

    expect(plan.family).toBe('release');
    expect(plan.dominance).toBe('hybrid');
    expect(plan.spendProfile).toBe('earned');
    expect(plan.worldMode).toBe('field-bloom');
    expect(plan.residueMode).toBe('afterglow');
  });

  it('makes reset reachable on clean phrase handoffs after heavier material', () => {
    const cueState = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'generative',
        performanceIntent: 'hold',
        musicConfidence: 0.52,
        peakConfidence: 0.18,
        beatConfidence: 0.34,
        preDropTension: 0.14,
        dropImpact: 0.08,
        sectionChange: 0.3,
        releaseTail: 0.18,
        resonance: 0.24,
        momentKind: 'release',
        momentAmount: 0.42
      },
      'laser-bloom',
      {
        preBeatLift: 0.06,
        beatStrike: 0.08,
        postBeatRelease: 0.22,
        interBeatFloat: 0.26,
        barTurn: 0.42,
        phraseResolve: 0.44
      }
    );
    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'generative',
        performanceIntent: 'hold',
        mode: 'system-audio',
        musicConfidence: 0.52,
        peakConfidence: 0.18,
        beatConfidence: 0.34,
        preDropTension: 0.14,
        dropImpact: 0.08,
        sectionChange: 0.3,
        releaseTail: 0.18
      },
      cueState,
      showAct: 'laser-bloom',
      cueFamilySeconds: 0.8
    });

    expect(plan.family).toBe('reset');
    expect(plan.dominance).toBe('chamber');
    expect(plan.compositorMode).toBe('wipe');
  });

  it('keeps a strong rupture earned, centered, and chamber-led instead of shoving hero right', () => {
    const cueState = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'detonate',
        musicConfidence: 0.8,
        peakConfidence: 0.72,
        beatConfidence: 0.7,
        preDropTension: 0.62,
        dropImpact: 0.76,
        sectionChange: 0.48,
        releaseTail: 0.1,
        resonance: 0.22,
        momentKind: 'strike',
        momentAmount: 0.86
      },
      'eclipse-rupture',
      {
        preBeatLift: 0.34,
        beatStrike: 0.8,
        postBeatRelease: 0.1,
        interBeatFloat: 0.08,
        barTurn: 0.24,
        phraseResolve: 0.12
      }
    );
    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'detonate',
        mode: 'system-audio',
        musicConfidence: 0.8,
        peakConfidence: 0.72,
        beatConfidence: 0.7,
        preDropTension: 0.62,
        dropImpact: 0.76,
        sectionChange: 0.48,
        releaseTail: 0.1
      },
      cueState,
      showAct: 'eclipse-rupture',
      cueFamilySeconds: 0.6
    });

    expect(plan.family).toBe('rupture');
    expect(plan.dominance).toBe('world');
    expect(plan.spendProfile).toBe('earned');
    expect(plan.worldMode).toBe('collapse-well');
    expect(plan.compositorMode).toBe('flash');
    expect(plan.heroScaleMax).toBeLessThan(1.4);
    expect(plan.exposureCeiling).toBeLessThanOrEqual(0.9);
    expect(plan.bloomCeiling).toBeLessThan(0.8);
    expect(plan.subtractiveAmount).toBeGreaterThan(0.3);
    expect(plan.heroScaleBias).toBeLessThan(0.35);
    expect(plan.heroAnchorLane).toBe('center');
    expect(Math.abs(plan.heroStageX)).toBeLessThan(0.12);
    expect(plan.heroStageY).toBeGreaterThan(0);
    expect(plan.heroDepthBias).toBeLessThan(0.4);
    expect(plan.heroMorphBias).toBeLessThan(0.74);
    expect(plan.chamberWeight).toBeGreaterThan(plan.heroWeight);
    expect(plan.worldWeight).toBeGreaterThan(plan.heroWeight);
  });

  it('still allows a stricter rupture to reach peak without defaulting to right shove', () => {
    const cueState = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'detonate',
        musicConfidence: 0.94,
        peakConfidence: 0.88,
        beatConfidence: 0.86,
        preDropTension: 0.82,
        dropImpact: 0.9,
        sectionChange: 0.68,
        releaseTail: 0.03,
        resonance: 0.18,
        momentKind: 'strike',
        momentAmount: 0.96
      },
      'eclipse-rupture',
      {
        preBeatLift: 0.42,
        beatStrike: 0.88,
        postBeatRelease: 0.06,
        interBeatFloat: 0.04,
        barTurn: 0.2,
        phraseResolve: 0.1
      }
    );

    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'detonate',
        mode: 'system-audio',
        musicConfidence: 0.94,
        peakConfidence: 0.88,
        beatConfidence: 0.86,
        preDropTension: 0.82,
        dropImpact: 0.9,
        sectionChange: 0.68,
        releaseTail: 0.03
      },
      cueState,
      showAct: 'eclipse-rupture',
      cueFamilySeconds: 0.36
    });

    expect(plan.family).toBe('rupture');
    expect(plan.spendProfile).toBe('peak');
    expect(plan.heroAnchorLane).toBe('center');
    expect(plan.heroScaleMax).toBeLessThan(1.4);
    expect(plan.heroScaleBias).toBeLessThan(0.45);
    expect(Math.abs(plan.heroStageX)).toBeLessThan(0.12);
    expect(plan.heroDepthBias).toBeLessThan(0.42);
    expect(plan.chamberWeight).toBeGreaterThan(plan.heroWeight);
    expect(plan.worldWeight).toBeGreaterThan(plan.heroWeight);
  });

  it('routes matrix-storm energy into reveal or gather instead of forcing rupture', () => {
    const cueState = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'ignite',
        musicConfidence: 0.84,
        peakConfidence: 0.48,
        beatConfidence: 0.9,
        preDropTension: 0.42,
        dropImpact: 0.18,
        sectionChange: 0.16,
        releaseTail: 0.04,
        resonance: 0.22,
        momentKind: 'lift',
        momentAmount: 0.58
      },
      'matrix-storm',
      {
        preBeatLift: 0.22,
        beatStrike: 0.72,
        postBeatRelease: 0.08,
        interBeatFloat: 0.34,
        barTurn: 0.24,
        phraseResolve: 0.16
      }
    );
    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'ignite',
        mode: 'system-audio',
        musicConfidence: 0.84,
        peakConfidence: 0.48,
        beatConfidence: 0.9,
        preDropTension: 0.42,
        dropImpact: 0.18,
        sectionChange: 0.16,
        releaseTail: 0.04
      },
      cueState,
      showAct: 'matrix-storm',
      cueFamilySeconds: 0.9
    });

    expect(plan.family).not.toBe('rupture');
    expect(['gather', 'reveal']).toContain(plan.family);
    expect(plan.compositorMode).toMatch(/precharge|wipe/);
  });

  it('spends a progressive PC-audio lift as a rupture cue instead of staying polite', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      showState: 'generative' as const,
      performanceIntent: 'ignite' as const,
      mode: 'system-audio' as const,
      musicConfidence: 0.48,
      peakConfidence: 0.47,
      beatConfidence: 0.3,
      preDropTension: 0.44,
      dropImpact: 0.42,
      sectionChange: 0.34,
      releaseTail: 0.04,
      phraseTension: 0.46,
      transientConfidence: 0.52,
      momentum: 0.4,
      harmonicColor: 0.58,
      shimmer: 0.5
    };
    const cueState = deriveVisualCue(frame, 'matrix-storm', {
      preBeatLift: 0.34,
      beatStrike: 0.48,
      postBeatRelease: 0.06,
      interBeatFloat: 0.28,
      barTurn: 0.22,
      phraseResolve: 0.1
    });
    const plan = deriveStageCuePlan({
      frame,
      cueState,
      showAct: 'matrix-storm',
      cueFamilySeconds: 0.4
    });

    expect(plan.family).toBe('rupture');
    expect(plan.worldMode).toBe('collapse-well');
    expect(plan.compositorMode).toBe('flash');
    expect(plan.eventDensity).toBeGreaterThan(0.58);
  });

  it('spends transient PC-audio strike evidence instead of holding reveal wallpaper', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      showState: 'generative' as const,
      performanceIntent: 'ignite' as const,
      mode: 'system-audio' as const,
      musicConfidence: 0.46,
      peakConfidence: 0.46,
      beatConfidence: 0.4,
      preDropTension: 0.34,
      transientConfidence: 0.53,
      dropImpact: 0.35,
      sectionChange: 0.22,
      releaseTail: 0.04,
      phraseTension: 0.4,
      momentum: 0.36,
      harmonicColor: 0.56,
      shimmer: 0.44
    };
    const cueState = deriveVisualCue(frame, 'laser-bloom', {
      preBeatLift: 0.28,
      beatStrike: 0.5,
      postBeatRelease: 0.06,
      interBeatFloat: 0.22,
      barTurn: 0.2,
      phraseResolve: 0.1
    });
    const plan = deriveStageCuePlan({
      frame,
      cueState,
      showAct: 'laser-bloom',
      cueFamilySeconds: 0.6
    });

    expect(plan.family).toBe('rupture');
    expect(plan.worldMode).toBe('collapse-well');
    expect(plan.ringAuthority).toBe('event-platform');
    expect(plan.visualMotif).toBe('rupture-scar');
  });

  it('uses laser-bloom reveal as a moving stage rail instead of static cathedral framing', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      showState: 'generative' as const,
      performanceIntent: 'ignite' as const,
      mode: 'system-audio' as const,
      musicConfidence: 0.58,
      peakConfidence: 0.32,
      beatConfidence: 0.36,
      preDropTension: 0.24,
      transientConfidence: 0.22,
      dropImpact: 0.09,
      sectionChange: 0.16,
      releaseTail: 0.04,
      momentum: 0.3,
      harmonicColor: 0.62,
      shimmer: 0.5,
      body: 0.34,
      tonalStability: 0.48
    };
    const cueState = deriveVisualCue(frame, 'laser-bloom', {
      preBeatLift: 0.3,
      beatStrike: 0.2,
      postBeatRelease: 0.08,
      interBeatFloat: 0.28,
      barTurn: 0.16,
      phraseResolve: 0.1
    });
    const plan = deriveStageCuePlan({
      frame,
      cueState,
      showAct: 'laser-bloom',
      cueFamilySeconds: 0.8
    });

    expect(plan.family).toBe('reveal');
    expect(plan.worldMode).toBe('fan-sweep');
    expect(plan.ringAuthority).toBe('event-platform');
    expect(plan.heroWeight).toBeGreaterThan(0.5);
    expect(plan.worldWeight).toBeLessThan(0.9);
  });

  it('spends strong PC-audio detonation evidence as rupture even outside the rupture act', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      showState: 'surge' as const,
      performanceIntent: 'detonate' as const,
      mode: 'system-audio' as const,
      musicConfidence: 0.68,
      peakConfidence: 0.61,
      beatConfidence: 0.45,
      preDropTension: 0.62,
      transientConfidence: 0.39,
      dropImpact: 0.51,
      sectionChange: 0.44,
      releaseTail: 0.04,
      phraseTension: 0.58,
      momentum: 0.48,
      harmonicColor: 0.62,
      shimmer: 0.44
    };
    const cueState = deriveVisualCue(frame, 'matrix-storm', {
      preBeatLift: 0.42,
      beatStrike: 0.58,
      postBeatRelease: 0.04,
      interBeatFloat: 0.18,
      barTurn: 0.24,
      phraseResolve: 0.08
    });
    const plan = deriveStageCuePlan({
      frame,
      cueState,
      showAct: 'matrix-storm',
      cueFamilySeconds: 0.6
    });

    expect(plan.family).toBe('rupture');
    expect(plan.worldMode).toBe('collapse-well');
    expect(plan.compositorMode).toBe('flash');
    expect(plan.transformIntent).toBe('collapse');
    expect(plan.stageWeight).toBeGreaterThan(0.64);
  });

  it('keeps matrix-storm reveal in a lighter hybrid world mode instead of cathedral lock', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'generative' as const,
      performanceIntent: 'gather' as const,
      musicConfidence: 0.46,
      peakConfidence: 0.24,
      beatConfidence: 0.34,
      preDropTension: 0.18,
      dropImpact: 0.08,
      sectionChange: 0.14,
      releaseTail: 0.06,
      resonance: 0.18,
      momentum: 0.32,
      body: 0.22,
      tonalStability: 0.42,
      harmonicColor: 0.64,
      shimmer: 0.24,
      air: 0.22,
      momentKind: 'lift' as const,
      momentAmount: 0.26,
      speechConfidence: 0.02
    };
    const plan = deriveStageCuePlan({
      frame: {
        ...frame,
        beatPhase: 0.82,
        barPhase: 0.24,
        phrasePhase: 0.38
      },
      cueState: deriveVisualCue(
        frame,
        'matrix-storm',
        deriveTemporalWindows({
          beatPhase: 0.82,
          barPhase: 0.24,
          phrasePhase: 0.38,
          beatConfidence: frame.beatConfidence,
          preDropTension: frame.preDropTension,
          dropImpact: frame.dropImpact,
          releaseTail: frame.releaseTail,
          musicConfidence: frame.musicConfidence,
          resonance: frame.resonance,
          sectionChange: frame.sectionChange
        })
      ),
      showAct: 'matrix-storm',
      cueFamilySeconds: 0.8
    });

    expect(plan.family).toBe('reveal');
    expect(plan.dominance).toBe('hybrid');
    expect(plan.worldMode).toBe('field-bloom');
    expect(plan.heroScaleBias).toBeLessThan(0.3);
    expect(plan.worldWeight).toBeLessThan(0.76);
  });

  it('gives structured matrix recovery a non-pressure brood path', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'generative' as const,
      performanceIntent: 'hold' as const,
      musicConfidence: 0.74,
      peakConfidence: 0.26,
      beatConfidence: 0.76,
      preDropTension: 0.18,
      dropImpact: 0.12,
      sectionChange: 0.32,
      releaseTail: 0.14,
      resonance: 0.3,
      momentum: 0.7,
      momentKind: 'release' as const,
      momentAmount: 0.44,
      shimmer: 0.4,
      air: 0.42,
      subPressure: 0.08,
      bassBody: 0.24,
      speechConfidence: 0.02
    };
    const windows = deriveTemporalWindows({
      beatPhase: 0.34,
      barPhase: 0.14,
      phrasePhase: 0.42,
      beatConfidence: 0.76,
      preDropTension: 0.18,
      dropImpact: 0.12,
      releaseTail: 0.14,
      musicConfidence: 0.74,
      resonance: 0.3,
      sectionChange: 0.32
    });

    const cue = deriveVisualCue(frame, 'matrix-storm', windows);
    expect(cue.cueClass).toBe('brood');

    const plan = deriveStageCuePlan({
      frame: {
        ...frame,
        beatPhase: 0.34,
        barPhase: 0.14,
        phrasePhase: 0.42
      },
      cueState: cue,
      showAct: 'matrix-storm',
      cueFamilySeconds: 0.8
    });

    expect(plan.family).toBe('brood');
    expect(plan.compositorMode).toBe('none');
  });

  it('keeps matrix recovery hero forms from collapsing back to mushroom', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      showState: 'generative' as const,
      performanceIntent: 'hold' as const,
      mode: 'system-audio' as const,
      musicConfidence: 0.72,
      peakConfidence: 0.24,
      beatConfidence: 0.7,
      preDropTension: 0.18,
      dropImpact: 0.1,
      sectionChange: 0.2,
      releaseTail: 0.18,
      resonance: 0.28,
      momentum: 0.64,
      harmonicColor: 0.22,
      shimmer: 0.38,
      air: 0.34,
      momentKind: 'release' as const,
      momentAmount: 0.34,
      speechConfidence: 0.02
    };
    const cue = deriveVisualCue(
      frame,
      'matrix-storm',
      deriveTemporalWindows({
        beatPhase: 0.36,
        barPhase: 0.14,
        phrasePhase: 0.42,
        beatConfidence: frame.beatConfidence,
        preDropTension: frame.preDropTension,
        dropImpact: frame.dropImpact,
        releaseTail: frame.releaseTail,
        musicConfidence: frame.musicConfidence,
        resonance: frame.resonance,
        sectionChange: frame.sectionChange
      })
    );
    const plan = deriveStageCuePlan({
      frame: {
        ...frame,
        beatPhase: 0.36,
        barPhase: 0.14,
        phrasePhase: 0.42
      },
      cueState: cue,
      showAct: 'matrix-storm',
      cueFamilySeconds: 1.1
    });

    expect(['brood', 'release']).toContain(plan.family);
    expect(plan.heroForm).not.toBe('mushroom');
    expect(['orb', 'cube', 'prism', 'diamond']).toContain(plan.heroForm);
  });

  it('builds a ghost-chamber stage plan for haunt cues when recovery is weak', () => {
    const cueState = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'aftermath',
        performanceIntent: 'haunt',
        musicConfidence: 0.36,
        peakConfidence: 0.16,
        beatConfidence: 0.14,
        preDropTension: 0.06,
        dropImpact: 0.04,
        sectionChange: 0.06,
        releaseTail: 0.22,
        resonance: 0.64,
        momentum: 0.08,
        momentKind: 'none',
        momentAmount: 0.18
      },
      'ghost-afterimage',
      {
        preBeatLift: 0.02,
        beatStrike: 0.06,
        postBeatRelease: 0.12,
        interBeatFloat: 0.12,
        barTurn: 0.1,
        phraseResolve: 0.08
      }
    );
    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'aftermath',
        performanceIntent: 'haunt',
        mode: 'system-audio',
        musicConfidence: 0.36,
        peakConfidence: 0.16,
        beatConfidence: 0.14,
        preDropTension: 0.06,
        dropImpact: 0.04,
        sectionChange: 0.06,
        releaseTail: 0.22,
        momentum: 0.08,
        momentKind: 'none'
      },
      cueState,
      showAct: 'ghost-afterimage',
      cueFamilySeconds: 4.0
    });

    expect(plan.family).toBe('haunt');
    expect(plan.dominance).toBe('chamber');
    expect(plan.spendProfile).toBe('withheld');
    expect(plan.worldMode).toBe('ghost-chamber');
    expect(plan.residueMode).toBe('ghost');
    expect(plan.heroScaleMax).toBeLessThan(0.8);
    expect(plan.heroAnchorLane).toBe('high');
    expect(plan.heroWeight).toBeLessThan(0.3);
    expect(plan.heroForm).toBe('diamond');
    expect(plan.heroScaleBias).toBeLessThan(-0.2);
    expect(plan.heroStageY).toBeGreaterThan(0.1);
    expect(plan.heroMorphBias).toBeGreaterThan(0.6);
  });

  it('downgrades long rupture windows from peak to earned', () => {
    const cueState = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'detonate',
        musicConfidence: 0.78,
        peakConfidence: 0.7,
        beatConfidence: 0.68,
        preDropTension: 0.58,
        dropImpact: 0.72,
        sectionChange: 0.42,
        releaseTail: 0.08,
        resonance: 0.24,
        momentKind: 'strike',
        momentAmount: 0.84
      },
      'eclipse-rupture',
      {
        preBeatLift: 0.32,
        beatStrike: 0.78,
        postBeatRelease: 0.1,
        interBeatFloat: 0.08,
        barTurn: 0.22,
        phraseResolve: 0.14
      }
    );
    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'surge',
        performanceIntent: 'detonate',
        mode: 'system-audio',
        musicConfidence: 0.78,
        peakConfidence: 0.7,
        beatConfidence: 0.68,
        preDropTension: 0.58,
        dropImpact: 0.72,
        sectionChange: 0.42,
        releaseTail: 0.08
      },
      cueState,
      showAct: 'eclipse-rupture',
      cueFamilySeconds: 3.2
    });

    expect(plan.family).toBe('rupture');
    expect(plan.spendProfile).toBe('earned');
    expect(plan.heroScaleMax).toBeLessThan(1.2);
    expect(plan.heroAnchorLane).toBe('center');
    expect(Math.abs(plan.heroStageX)).toBeLessThan(0.08);
    expect(plan.chamberWeight).toBeGreaterThan(plan.heroWeight);
    expect(plan.worldWeight).toBeGreaterThan(plan.heroWeight);
  });

  it('keeps reset windows out of peak spend', () => {
    const cueState = deriveVisualCue(
      {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'generative',
        performanceIntent: 'hold',
        musicConfidence: 0.6,
        peakConfidence: 0.28,
        beatConfidence: 0.32,
        preDropTension: 0.08,
        dropImpact: 0.06,
        sectionChange: 0.44,
        releaseTail: 0.12,
        resonance: 0.2,
        momentKind: 'none',
        momentAmount: 0
      },
      'laser-bloom',
      {
        preBeatLift: 0.08,
        beatStrike: 0.1,
        postBeatRelease: 0.18,
        interBeatFloat: 0.22,
        barTurn: 0.36,
        phraseResolve: 0.28
      }
    );
    const plan = deriveStageCuePlan({
      frame: {
        ...DEFAULT_LISTENING_FRAME,
        showState: 'generative',
        performanceIntent: 'hold',
        mode: 'system-audio',
        musicConfidence: 0.6,
        peakConfidence: 0.28,
        beatConfidence: 0.32,
        preDropTension: 0.08,
        dropImpact: 0.06,
        sectionChange: 0.44,
        releaseTail: 0.12
      },
      cueState,
      showAct: 'laser-bloom',
      cueFamilySeconds: 0.3
    });

    expect(plan.family).toBe('reset');
    expect(plan.spendProfile).toBe('withheld');
    expect(plan.exposureCeiling).toBeLessThan(0.84);
    expect(plan.bloomCeiling).toBeLessThan(0.6);
  });

  it('keeps quiet room music out of ghost and brood monopoly', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'room-mic' as const,
      showState: 'generative' as const,
      performanceIntent: 'gather' as const,
      musicConfidence: 0.32,
      peakConfidence: 0.16,
      beatConfidence: 0.14,
      preDropTension: 0.12,
      dropImpact: 0.06,
      sectionChange: 0.08,
      releaseTail: 0.08,
      resonance: 0.2,
      momentum: 0.28,
      momentKind: 'none' as const,
      momentAmount: 0,
      shimmer: 0.18,
      air: 0.18,
      subPressure: 0.04,
      bassBody: 0.14,
      speechConfidence: 0.08
    };
    const scores = buildShowActScores(frame);

    expect(scores['ghost-afterimage']).toBeLessThan(scores['laser-bloom']);
    expect(scores['void-chamber']).toBeLessThan(scores['laser-bloom']);

    const windows = deriveTemporalWindows({
      beatPhase: 0.28,
      barPhase: 0.2,
      phrasePhase: 0.34,
      beatConfidence: frame.beatConfidence,
      preDropTension: frame.preDropTension,
      dropImpact: frame.dropImpact,
      releaseTail: frame.releaseTail,
      musicConfidence: frame.musicConfidence,
      resonance: frame.resonance,
      sectionChange: frame.sectionChange
    });
    const cue = deriveVisualCue(
      frame,
      'laser-bloom',
      windows
    );
    const plan = deriveStageCuePlan({
      frame: {
        ...frame,
        beatPhase: 0.28,
        barPhase: 0.2,
        phrasePhase: 0.34
      },
      cueState: cue,
      showAct: 'laser-bloom',
      cueFamilySeconds: 0.6
    });

    expect(['gather', 'reveal']).toContain(plan.family);
    expect(plan.family).not.toBe('brood');
    expect(plan.screenWeight).toBeGreaterThan(0.2);
    expect(plan.heroScaleBias).toBeGreaterThan(0);
  });

  it('lets color-rich quiet room music escalate into a restrained reveal floor', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'room-mic' as const,
      showState: 'atmosphere' as const,
      performanceIntent: 'gather' as const,
      musicConfidence: 0.21,
      peakConfidence: 0.19,
      beatConfidence: 0.07,
      preDropTension: 0.24,
      dropImpact: 0,
      sectionChange: 0.01,
      releaseTail: 0.07,
      resonance: 0.15,
      momentum: 0.17,
      brightness: 0.16,
      harmonicColor: 0.58,
      shimmer: 0.08,
      air: 0.08,
      subPressure: 0.04,
      bassBody: 0.04,
      speechConfidence: 0.01
    };

    const scores = buildShowActScores(frame);
    expect(scores['laser-bloom']).toBeGreaterThan(scores['void-chamber']);

    const plan = deriveStageCuePlan({
      frame: {
        ...frame,
        beatPhase: 1,
        barPhase: 0.5,
        phrasePhase: 0.62
      },
      cueState: deriveVisualCue(
        frame,
        'laser-bloom',
        deriveTemporalWindows({
          beatPhase: 1,
          barPhase: 0.5,
          phrasePhase: 0.62,
          beatConfidence: frame.beatConfidence,
          preDropTension: frame.preDropTension,
          dropImpact: frame.dropImpact,
          releaseTail: frame.releaseTail,
          musicConfidence: frame.musicConfidence,
          resonance: frame.resonance,
          sectionChange: frame.sectionChange
        })
      ),
      showAct: 'laser-bloom',
      cueFamilySeconds: 0.8
    });

    expect(plan.family).toBe('reveal');
    expect(plan.stageWeight).toBeGreaterThan(0.5);
    expect(plan.screenWeight).toBeGreaterThan(0.25);
  });

  it('keeps low-impact musical floors readable and neon outside quiet-room special casing', () => {
    const frame = {
      ...DEFAULT_LISTENING_FRAME,
      mode: 'system-audio' as const,
      showState: 'generative' as const,
      performanceIntent: 'gather' as const,
      musicConfidence: 0.34,
      peakConfidence: 0.12,
      beatConfidence: 0.18,
      preDropTension: 0.14,
      dropImpact: 0.02,
      sectionChange: 0.06,
      releaseTail: 0.08,
      resonance: 0.14,
      momentum: 0.26,
      body: 0.18,
      tonalStability: 0.34,
      brightness: 0.18,
      harmonicColor: 0.62,
      shimmer: 0.2,
      air: 0.18,
      subPressure: 0.06,
      bassBody: 0.12,
      speechConfidence: 0.01
    };

    const scores = buildShowActScores(frame);
    expect(scores['laser-bloom']).toBeGreaterThan(scores['void-chamber']);

    const plan = deriveStageCuePlan({
      frame: {
        ...frame,
        beatPhase: 0.82,
        barPhase: 0.36,
        phrasePhase: 0.42,
        momentKind: 'none'
      },
      cueState: deriveVisualCue(
        frame,
        'laser-bloom',
        deriveTemporalWindows({
          beatPhase: 0.82,
          barPhase: 0.36,
          phrasePhase: 0.42,
          beatConfidence: frame.beatConfidence,
          preDropTension: frame.preDropTension,
          dropImpact: frame.dropImpact,
          releaseTail: frame.releaseTail,
          musicConfidence: frame.musicConfidence,
          resonance: frame.resonance,
          sectionChange: frame.sectionChange
        })
      ),
      showAct: 'laser-bloom',
      cueFamilySeconds: 0.5
    });

    expect(['gather', 'reveal']).toContain(plan.family);
    expect(plan.heroScaleBias).toBeGreaterThan(0);
    expect(plan.stageWeight).toBeGreaterThan(0.42);
    expect(plan.screenWeight).toBeGreaterThan(0.2);
  });
});
