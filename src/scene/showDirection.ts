import { clamp01 } from '../audio/audioMath';
import type { ListeningFrame } from '../types/audio';
import type { RuntimeTuning } from '../types/tuning';
import type {
  HeroFormSwitchReason,
  HeroSemanticRole,
  PaletteState,
  PaletteFrame,
  PaletteBaseHoldReason,
  PaletteTransitionReason,
  RingPosture,
  SemanticEpisodeTransitionReason,
  ShowAct,
  StageCuePlan,
  VisualCueState,
  VisualMotifKind,
  VisualMotifSnapshot,
  VisualTemporalWindows
} from '../types/visual';

const PALETTE_STATES: PaletteState[] = [
  'void-cyan',
  'tron-blue',
  'acid-lime',
  'solar-magenta',
  'ghost-white'
];

const SHOW_ACTS: ShowAct[] = [
  'void-chamber',
  'laser-bloom',
  'matrix-storm',
  'eclipse-rupture',
  'ghost-afterimage'
];

function paletteSpreadOf(targets: Record<PaletteState, number>): number {
  return 1 - Math.max(...Object.values(targets));
}

export function semanticPaletteBaseForMotif(
  motif: VisualMotifKind,
  targets: Record<PaletteState, number>
): PaletteState {
  switch (motif) {
    case 'machine-grid':
      return 'tron-blue';
    case 'neon-portal':
      return targets['acid-lime'] > targets['solar-magenta']
        ? 'acid-lime'
        : 'solar-magenta';
    case 'rupture-scar':
      return 'solar-magenta';
    case 'ghost-residue':
    case 'silence-constellation':
      return 'ghost-white';
    case 'acoustic-transient':
      return 'acid-lime';
    case 'world-takeover':
      return targets['tron-blue'] >= targets['acid-lime'] ? 'tron-blue' : 'acid-lime';
    default:
      return targets['tron-blue'] > 0.28 ? 'tron-blue' : 'void-cyan';
  }
}

function paletteRolesForBase(baseState: PaletteState): PaletteFrame['roles'] {
  switch (baseState) {
    case 'tron-blue':
      return {
        anchorDark: 'void-cyan',
        primaryEmission: 'tron-blue',
        rimSeam: 'void-cyan',
        accentTransient: 'acid-lime',
        residueMemory: 'ghost-white',
        flashWhite: 'ghost-white'
      };
    case 'acid-lime':
      return {
        anchorDark: 'tron-blue',
        primaryEmission: 'acid-lime',
        rimSeam: 'void-cyan',
        accentTransient: 'solar-magenta',
        residueMemory: 'ghost-white',
        flashWhite: 'ghost-white'
      };
    case 'solar-magenta':
      return {
        anchorDark: 'void-cyan',
        primaryEmission: 'solar-magenta',
        rimSeam: 'tron-blue',
        accentTransient: 'acid-lime',
        residueMemory: 'ghost-white',
        flashWhite: 'ghost-white'
      };
    case 'ghost-white':
      return {
        anchorDark: 'void-cyan',
        primaryEmission: 'ghost-white',
        rimSeam: 'tron-blue',
        accentTransient: 'solar-magenta',
        residueMemory: 'ghost-white',
        flashWhite: 'ghost-white'
      };
    default:
      return {
        anchorDark: 'void-cyan',
        primaryEmission: 'void-cyan',
        rimSeam: 'tron-blue',
        accentTransient: 'acid-lime',
        residueMemory: 'ghost-white',
        flashWhite: 'ghost-white'
      };
  }
}

function heroRoleForMotif(
  motif: VisualMotifKind,
  plan: Pick<StageCuePlan, 'dominance' | 'heroWeight' | 'worldWeight' | 'eventDensity'>
): HeroSemanticRole {
  if (plan.worldWeight > 0.74 && plan.heroWeight < 0.26) {
    return 'world-as-hero';
  }
  if (plan.heroWeight < 0.22 || plan.dominance === 'world') {
    return 'suppressed';
  }
  if (motif === 'rupture-scar') {
    return 'fractured';
  }
  if (motif === 'ghost-residue' || motif === 'silence-constellation') {
    return 'ghost';
  }
  if (plan.eventDensity > 0.52) {
    return 'twin';
  }
  if (plan.dominance === 'hero') {
    return 'dominant';
  }
  return 'supporting';
}

function heroFormForMotif(
  motif: VisualMotifKind,
  plan: Pick<StageCuePlan, 'worldMode' | 'dominance' | 'family' | 'eventDensity'>
): StageCuePlan['heroForm'] {
  switch (motif) {
    case 'machine-grid':
      return 'cube';
    case 'neon-portal':
      return plan.worldMode === 'cathedral-rise' ? 'pyramid' : 'prism';
    case 'rupture-scar':
      return 'shard';
    case 'ghost-residue':
      return 'diamond';
    case 'silence-constellation':
      return (plan.family === 'haunt' || plan.worldMode === 'ghost-chamber') &&
        plan.eventDensity < 0.24
        ? 'mushroom'
        : 'diamond';
    case 'acoustic-transient':
      return 'shard';
    case 'world-takeover':
      return plan.worldMode === 'cathedral-rise'
        ? 'pyramid'
        : plan.dominance === 'world'
          ? 'orb'
          : 'cube';
    default:
      return 'orb';
  }
}

function heroFormReasonForMotif(
  motif: VisualMotifKind,
  plan: Pick<StageCuePlan, 'family' | 'dominance'>
): HeroFormSwitchReason {
  if (plan.dominance === 'world') {
    return 'authority-demotion';
  }
  switch (motif) {
    case 'rupture-scar':
      return 'drop-rupture';
    case 'ghost-residue':
    case 'silence-constellation':
      return 'release-residue';
    case 'neon-portal':
    case 'world-takeover':
      return 'motif-change';
    default:
      return plan.family === 'gather' || plan.family === 'reveal'
        ? 'cue-family'
        : 'hold';
  }
}

function heroFormHoldSecondsForMotif(
  motif: VisualMotifKind,
  plan: Pick<StageCuePlan, 'worldMode' | 'family' | 'eventDensity'>
): number {
  const base =
    motif === 'rupture-scar' || motif === 'acoustic-transient'
      ? 5.8
      : motif === 'neon-portal'
        ? plan.worldMode === 'cathedral-rise'
          ? 9.2
          : 7.4
        : motif === 'ghost-residue' || motif === 'silence-constellation'
          ? 9.6
          : motif === 'world-takeover'
            ? 8.4
            : motif === 'machine-grid'
              ? 7.6
              : 8.8;

  return Math.max(5.6, base - (plan.eventDensity > 0.62 ? 0.8 : 0));
}

function normalizePaletteTargets(
  targets: Partial<Record<PaletteState, number>>
): Record<PaletteState, number> {
  const normalized = {
    'void-cyan': Math.max(0, targets['void-cyan'] ?? 0),
    'tron-blue': Math.max(0, targets['tron-blue'] ?? 0),
    'acid-lime': Math.max(0, targets['acid-lime'] ?? 0),
    'solar-magenta': Math.max(0, targets['solar-magenta'] ?? 0),
    'ghost-white': Math.max(0, targets['ghost-white'] ?? 0)
  };
  const total =
    normalized['void-cyan'] +
    normalized['tron-blue'] +
    normalized['acid-lime'] +
    normalized['solar-magenta'] +
    normalized['ghost-white'];

  if (total <= 0.0001) {
    return {
      'void-cyan': 0.2,
      'tron-blue': 0.2,
      'acid-lime': 0.2,
      'solar-magenta': 0.2,
      'ghost-white': 0.2
    };
  }

  return {
    'void-cyan': normalized['void-cyan'] / total,
    'tron-blue': normalized['tron-blue'] / total,
    'acid-lime': normalized['acid-lime'] / total,
    'solar-magenta': normalized['solar-magenta'] / total,
    'ghost-white': normalized['ghost-white'] / total
  };
}

function entropyOfRecord(record: Record<string, number>): number {
  const values = Object.values(record).filter((value) => value > 0);
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum - value * Math.log2(value), 0);
}

function phaseDistance(phase: number, anchor: number): number {
  const direct = Math.abs(phase - anchor);
  return Math.min(direct, 1 - direct);
}

function chooseScoredState<TState extends string>(input: {
  currentState: TState;
  secondsSinceLastChange: number;
  scores: Record<TState, number>;
  states: readonly TState[];
  minimumHoldSeconds: number;
  switchThreshold: number;
  earlySwitchThresholdMultiplier?: number;
  fatigueProfiles?: Partial<
    Record<
      TState,
      {
        afterSeconds: number;
        thresholdReduction: number;
      }
    >
  >;
}): TState {
  const currentScore = input.scores[input.currentState] ?? 0;
  const winner = [...input.states].sort(
    (left, right) => input.scores[right] - input.scores[left]
  )[0]!;
  const winnerScore = input.scores[winner] ?? 0;
  const fatigueProfile = input.fatigueProfiles?.[input.currentState];
  const fatigueThresholdReduction =
    fatigueProfile && input.secondsSinceLastChange >= fatigueProfile.afterSeconds
      ? fatigueProfile.thresholdReduction
      : 0;
  const effectiveSwitchThreshold = Math.max(
    0.02,
    input.switchThreshold - fatigueThresholdReduction
  );

  if (winner === input.currentState) {
    return input.currentState;
  }

  if (input.secondsSinceLastChange < input.minimumHoldSeconds) {
    return winnerScore >
      currentScore + effectiveSwitchThreshold * (input.earlySwitchThresholdMultiplier ?? 2)
      ? winner
      : input.currentState;
  }

  return winnerScore > currentScore + effectiveSwitchThreshold
    ? winner
    : input.currentState;
}

type OperatorShowBias = Pick<
  RuntimeTuning,
  | 'energy'
  | 'spectacle'
  | 'worldActivity'
  | 'radiance'
  | 'geometry'
  | 'framing'
  | 'colorBias'
  | 'readableHeroFloor'
  | 'neonStageFloor'
  | 'worldBootFloor'
  | 'cameraNearFloor'
>;

function deriveOperatorBias(
  tuning?: Partial<OperatorShowBias>
): {
  spectacle: number;
  world: number;
  radiance: number;
  geometry: number;
  energy: number;
  framingTight: number;
  framingWide: number;
  warm: number;
  cool: number;
  neon: number;
  life: number;
  heroFloor: number;
  neonStage: number;
  worldBoot: number;
  cameraNear: number;
} {
  if (!tuning) {
    return {
      spectacle: 0,
      world: 0,
      radiance: 0,
      geometry: 0,
      energy: 0,
      framingTight: 0,
      framingWide: 0,
      warm: 0,
      cool: 0,
      neon: 0,
      life: 0,
      heroFloor: 0,
      neonStage: 0,
      worldBoot: 0,
      cameraNear: 0
    };
  }

  const spectacle = clamp01(((tuning.spectacle ?? 0.5) - 0.5) * 2);
  const world = clamp01(((tuning.worldActivity ?? 0.5) - 0.5) * 2);
  const radiance = clamp01(((tuning.radiance ?? 0.5) - 0.5) * 2);
  const geometry = clamp01(((tuning.geometry ?? 0.5) - 0.5) * 2);
  const energy = clamp01(((tuning.energy ?? 0.5) - 0.5) * 2);
  const framingTight = clamp01((0.5 - (tuning.framing ?? 0.5)) * 2);
  const framingWide = clamp01((((tuning.framing ?? 0.5) - 0.5) * 2));
  const warm = clamp01((((tuning.colorBias ?? 0.5) - 0.5) * 2));
  const cool = clamp01(((0.5 - (tuning.colorBias ?? 0.5)) * 2));
  const neon = clamp01(radiance * 0.48 + spectacle * 0.34 + world * 0.18);
  const life = clamp01(spectacle * 0.36 + world * 0.28 + radiance * 0.22 + energy * 0.14);
  const heroFloor = clamp01(
    tuning.readableHeroFloor ??
      clamp01(
        0.08 +
          (tuning.framing ?? 0.5) * 0.24 +
          (tuning.energy ?? 0.5) * 0.16 +
          (tuning.radiance ?? 0.5) * 0.16 +
          (tuning.spectacle ?? 0.5) * 0.14
      )
  );
  const neonStage = clamp01(
    tuning.neonStageFloor ??
      clamp01(
        0.06 +
          (tuning.radiance ?? 0.5) * 0.28 +
          (tuning.spectacle ?? 0.5) * 0.22 +
          (tuning.worldActivity ?? 0.5) * 0.2
      )
  );
  const worldBoot = clamp01(
    tuning.worldBootFloor ??
      clamp01(
        0.04 +
          (tuning.worldActivity ?? 0.5) * 0.32 +
          (tuning.framing ?? 0.5) * 0.16 +
          (tuning.spectacle ?? 0.5) * 0.12
      )
  );
  const cameraNear = clamp01(
    tuning.cameraNearFloor ??
      clamp01(
        0.06 +
          (tuning.framing ?? 0.5) * 0.28 +
          (tuning.energy ?? 0.5) * 0.12 +
          (tuning.spectacle ?? 0.5) * 0.12
      )
  );

  return {
    spectacle,
    world,
    radiance,
    geometry,
    energy,
    framingTight,
    framingWide,
    warm,
    cool,
    neon,
    life,
    heroFloor,
    neonStage,
    worldBoot,
    cameraNear
  };
}

export function deriveTemporalWindows(
  frame: Pick<
    ListeningFrame,
    | 'beatPhase'
    | 'barPhase'
    | 'phrasePhase'
    | 'beatConfidence'
    | 'preDropTension'
    | 'dropImpact'
    | 'releaseTail'
    | 'musicConfidence'
    | 'resonance'
    | 'sectionChange'
  >
): VisualTemporalWindows {
  const beatStrike =
    Math.exp(-clamp01(frame.beatPhase) * 14) *
    clamp01(frame.beatConfidence * 0.72 + frame.dropImpact * 0.44);
  const preBeatLift =
    clamp01((frame.beatPhase - 0.7) / 0.22) *
    clamp01(
      0.18 +
        frame.preDropTension * 0.54 +
        frame.sectionChange * 0.14 +
        frame.musicConfidence * 0.16
    );
  const postBeatRelease =
    clamp01((frame.beatPhase - 0.06) / 0.14) *
    clamp01((0.56 - frame.beatPhase) / 0.26) *
    clamp01(
      0.18 +
        frame.releaseTail * 0.54 +
        frame.resonance * 0.28 +
        frame.sectionChange * 0.08
    );
  const interBeatFloat =
    clamp01(1 - Math.abs(frame.beatPhase - 0.5) * 2) *
    clamp01(
      0.28 +
        frame.musicConfidence * 0.24 +
        frame.resonance * 0.3 +
        frame.preDropTension * 0.12 -
        beatStrike * 0.18
    );
  const barTurn =
    clamp01(1 - phaseDistance(frame.barPhase, 0) / 0.12) *
    clamp01(
      0.22 +
        frame.sectionChange * 0.38 +
        frame.preDropTension * 0.18 +
        frame.musicConfidence * 0.1
    );
  const phraseResolve =
    clamp01(1 - phaseDistance(frame.phrasePhase, 0) / 0.16) *
    clamp01(
      0.16 +
        frame.releaseTail * 0.44 +
        frame.sectionChange * 0.26 +
        frame.resonance * 0.12
    );

  return {
    preBeatLift,
    beatStrike,
    postBeatRelease,
    interBeatFloat,
    barTurn,
    phraseResolve
  };
}

export function buildShowActScores(
  frame: Pick<
    ListeningFrame,
    | 'showState'
    | 'performanceIntent'
    | 'mode'
    | 'musicConfidence'
    | 'peakConfidence'
    | 'beatConfidence'
    | 'preDropTension'
    | 'dropImpact'
    | 'sectionChange'
    | 'releaseTail'
    | 'resonance'
    | 'momentum'
    | 'momentKind'
    | 'momentAmount'
    | 'shimmer'
    | 'air'
    | 'subPressure'
    | 'bassBody'
    | 'body'
    | 'tonalStability'
    | 'speechConfidence'
    | 'harmonicColor'
    | 'sourceHintConfidence'
    | 'percussionEvidence'
    | 'bassSourceEvidence'
    | 'airMotionEvidence'
  >,
  tuning?: Partial<OperatorShowBias>
): Record<ShowAct, number> {
  const operatorBias = deriveOperatorBias(tuning);
  const systemBias =
    frame.mode === 'system-audio' ? 0.08 : frame.mode === 'hybrid' ? 0.04 : 0;
  const quietRoomMusicBias =
    frame.mode === 'room-mic'
      ? clamp01(
          frame.musicConfidence * 0.48 +
            frame.momentum * 0.24 +
            frame.resonance * 0.08 +
            frame.shimmer * 0.08 +
            frame.air * 0.06 +
            frame.bassBody * 0.08 -
            frame.releaseTail * 0.08 -
            frame.speechConfidence * 0.22
        )
      : 0;
  const quietRoomNeonBias =
    frame.mode === 'room-mic'
      ? clamp01(
          quietRoomMusicBias * 0.72 +
            Math.max(0, frame.harmonicColor - 0.46) * 0.52 +
            frame.shimmer * 0.18 +
            frame.air * 0.14 +
            frame.beatConfidence * 0.12
        )
      : 0;
  const livingMusicFloor = clamp01(
    frame.musicConfidence * 0.28 +
      frame.momentum * 0.16 +
      frame.body * 0.16 +
      frame.tonalStability * 0.1 +
      frame.harmonicColor * 0.08 +
      frame.shimmer * 0.1 +
      frame.air * 0.06 -
      frame.releaseTail * 0.06 -
      frame.speechConfidence * 0.16 -
      frame.dropImpact * 0.08
  );
  const adaptiveNeonBias = clamp01(
    livingMusicFloor * 0.62 +
      frame.harmonicColor * 0.22 +
      frame.shimmer * 0.16 +
      frame.air * 0.12 +
      frame.beatConfidence * 0.08
  );
  const systemOpenVarietyBias =
    frame.mode === 'system-audio'
      ? clamp01(
          frame.musicConfidence * 0.22 +
            frame.beatConfidence * 0.18 +
            frame.momentum * 0.14 +
            frame.tonalStability * 0.14 +
            frame.sectionChange * 0.08 -
            frame.dropImpact * 0.12 -
            frame.releaseTail * 0.04
        )
      : 0;
  const systemSourceRhythmBias =
    frame.mode === 'system-audio'
      ? clamp01(
          frame.sourceHintConfidence * 0.16 +
            frame.percussionEvidence * 0.36 +
            frame.bassSourceEvidence * 0.28 +
            frame.beatConfidence * 0.16 +
            frame.momentum * 0.12 +
            frame.preDropTension * 0.1 -
            frame.releaseTail * 0.08
        )
      : 0;
  const systemLongformMotionBias =
    frame.mode === 'system-audio'
      ? clamp01(
          frame.musicConfidence * 0.24 +
            frame.beatConfidence * 0.18 +
            frame.momentum * 0.16 +
            frame.tonalStability * 0.12 +
            frame.bassBody * 0.12 +
            frame.shimmer * 0.08 +
            systemSourceRhythmBias * 0.16 -
            frame.speechConfidence * 0.18 -
            frame.releaseTail * 0.06
        )
      : 0;
  const violentBias = clamp01(
    frame.dropImpact * 0.5 +
      frame.sectionChange * 0.24 +
      frame.peakConfidence * 0.18 +
      frame.subPressure * 0.16
  );
  const spectralBias = clamp01(
    frame.releaseTail * 0.52 +
      frame.resonance * 0.28 +
      frame.air * 0.1 +
      frame.speechConfidence * 0.06
  );
  const motionRecoveryBias = clamp01(
    frame.momentum * 0.24 +
      frame.beatConfidence * 0.18 +
      frame.sectionChange * 0.24 +
      frame.musicConfidence * 0.12 +
      frame.momentAmount * 0.06 +
      (frame.momentKind === 'release' ? 0.12 : 0) +
      (frame.momentKind === 'lift' ? 0.08 : 0)
  );
  const systemBloomRecoveryBias =
    frame.mode === 'system-audio'
      ? clamp01(
          frame.musicConfidence * 0.18 +
            frame.sectionChange * 0.18 +
            frame.tonalStability * 0.16 +
            frame.momentum * 0.12 +
            frame.harmonicColor * 0.08 +
            motionRecoveryBias * 0.12 -
            frame.dropImpact * 0.18 -
            frame.releaseTail * 0.04
        )
      : 0;
  const systemStructuredVoidBias =
    frame.mode === 'system-audio'
      ? clamp01(
          (frame.showState === 'generative' ? 0.12 : 0) +
            (frame.showState === 'atmosphere' ? 0.1 : 0) +
            frame.sectionChange * 0.18 +
            frame.releaseTail * 0.16 +
            frame.resonance * 0.12 +
            frame.air * 0.1 +
            frame.tonalStability * 0.12 -
            frame.dropImpact * 0.16 -
            frame.shimmer * 0.04
        )
      : 0;
  const systemPrismaticBloomBias =
    frame.mode === 'system-audio'
      ? clamp01(
          frame.sectionChange * 0.22 +
            frame.harmonicColor * 0.16 +
            frame.musicConfidence * 0.14 +
            frame.shimmer * 0.12 +
            frame.momentum * 0.1 +
            frame.beatConfidence * 0.08 -
            frame.dropImpact * 0.16 -
            frame.releaseTail * 0.04
        )
      : 0;
  const systemSpectralAfterimageBias =
    frame.mode === 'system-audio'
      ? clamp01(
          frame.releaseTail * 0.22 +
            frame.resonance * 0.18 +
            frame.air * 0.14 +
            frame.sectionChange * 0.08 +
            frame.musicConfidence * 0.08 -
            frame.dropImpact * 0.08
        )
      : 0;
  const lowImpactMatrixRecoveryBias =
    frame.mode === 'system-audio'
      ? clamp01(
          (frame.showState === 'generative' ? 0.12 : 0) +
            (frame.showState === 'surge' ? 0.08 : 0) +
            frame.momentum * 0.18 +
            frame.beatConfidence * 0.14 -
            frame.dropImpact * 0.22 -
            frame.sectionChange * 0.08 -
            frame.releaseTail * 0.04
        )
      : 0;
  const ghostDwellPenalty = clamp01(
    (frame.showState === 'aftermath' ? 0.22 : 0) +
      (frame.performanceIntent === 'haunt' ? 0.16 : 0) +
      frame.releaseTail * 0.36 +
      frame.resonance * 0.16 +
      frame.momentum * 0.08
  );
  const rhythmicBias = clamp01(
    frame.beatConfidence * 0.36 +
      frame.musicConfidence * 0.18 +
      frame.shimmer * 0.2 +
      systemBias
  );
  const structuralBias = clamp01(
    frame.preDropTension * 0.28 +
      frame.sectionChange * 0.22 +
      frame.musicConfidence * 0.24 +
      frame.bassBody * 0.12
  );
  const surgeBias = clamp01(
    (frame.showState === 'surge' ? 0.2 : 0) +
      (frame.performanceIntent === 'detonate' ? 0.14 : 0) +
      (frame.performanceIntent === 'ignite' ? 0.08 : 0) +
      frame.musicConfidence * 0.08
  );
  const stormBias = clamp01(
    frame.beatConfidence * 0.34 +
      frame.shimmer * 0.3 +
      frame.musicConfidence * 0.14 +
      frame.resonance * 0.1 +
      systemBias * 0.5
  );
  const bloomBias = clamp01(
    frame.peakConfidence * 0.18 +
      frame.preDropTension * 0.2 +
      frame.sectionChange * 0.08 +
      frame.musicConfidence * 0.12
  );
  const structuredRecoveryBias = clamp01(
    structuralBias * 0.34 +
      motionRecoveryBias * 0.24 +
      frame.beatConfidence * 0.12 +
      frame.sectionChange * 0.08 +
      frame.momentum * 0.12 +
      (frame.momentKind === 'release' ? 0.08 : 0) +
      (frame.momentKind === 'lift' ? 0.06 : 0) -
      violentBias * 0.12 -
      frame.dropImpact * 0.08
  );
  const nonImpactGenerativeBias = clamp01(
    (frame.showState === 'generative' ? 0.16 : 0) +
      frame.beatConfidence * 0.12 +
      frame.momentum * 0.1 +
      frame.musicConfidence * 0.08 -
      frame.dropImpact * 0.24 -
      frame.sectionChange * 0.06
  );

  return {
    'void-chamber': clamp01(
      0.18 +
        (frame.showState === 'void' ? 0.42 : 0) +
        (frame.showState === 'atmosphere' ? 0.14 : 0) +
        (frame.showState === 'generative' ? 0.06 : 0) +
        (frame.performanceIntent === 'hold' ? 0.08 : 0) +
        spectralBias * 0.14 +
        motionRecoveryBias * 0.04 +
        structuredRecoveryBias * 0.54 +
        systemStructuredVoidBias * 0.18 +
        systemSpectralAfterimageBias * 0.08 +
        quietRoomMusicBias * 0.02 -
        (frame.dropImpact < 0.24 ? 0.08 : 0) -
        ghostDwellPenalty * 0.06 -
        violentBias * 0.22 -
        livingMusicFloor * 0.26 -
        adaptiveNeonBias * 0.16 -
        quietRoomMusicBias * 0.42 -
        quietRoomNeonBias * 0.32 -
        operatorBias.neon * 0.18 -
        operatorBias.neonStage * 0.36 -
        operatorBias.worldBoot * 0.28 -
        operatorBias.heroFloor * 0.2 -
        operatorBias.world * 0.18 -
        operatorBias.spectacle * 0.12
    ),
    'laser-bloom': clamp01(
      0.08 +
        (frame.performanceIntent === 'ignite' ? 0.24 : 0) +
        (frame.showState === 'generative' ? 0.18 : 0) +
        (frame.showState === 'surge' && frame.performanceIntent !== 'detonate'
          ? 0.08
          : 0) +
        rhythmicBias * 0.14 +
        structuralBias * 0.12 +
        bloomBias * 0.28 +
        motionRecoveryBias * 0.18 +
        structuredRecoveryBias * 0.04 +
        nonImpactGenerativeBias * 0.14 -
        frame.momentum * 0.1 +
        frame.sectionChange * 0.12 +
        livingMusicFloor * 0.22 +
        adaptiveNeonBias * 0.18 +
        systemOpenVarietyBias * 0.24 +
        systemBloomRecoveryBias * 0.14 +
        systemPrismaticBloomBias * 0.18 +
        lowImpactMatrixRecoveryBias * -0.08 +
        quietRoomMusicBias * 0.4 +
        quietRoomNeonBias * 0.34 +
        (frame.showState === 'atmosphere' && quietRoomNeonBias > 0.18 ? 0.08 : 0) +
        (frame.momentKind === 'release' ? 0.12 : 0) -
        (frame.sectionChange < 0.2 ? 0.08 : 0) -
        frame.beatConfidence * 0.06 -
        frame.preDropTension * 0.1 -
        ghostDwellPenalty * 0.12 -
        violentBias * 0.1 +
        operatorBias.neon * 0.18 +
        operatorBias.neonStage * 0.24 +
        operatorBias.worldBoot * 0.08 +
        operatorBias.heroFloor * 0.08 +
        operatorBias.spectacle * 0.1 +
        operatorBias.radiance * 0.1
    ),
    'matrix-storm': clamp01(
      0.06 +
        (frame.showState === 'tactile' ? 0.18 : 0) +
        (frame.showState === 'surge' ? 0.12 : 0) +
        (frame.showState === 'generative' ? 0.06 : 0) +
        (frame.performanceIntent === 'ignite' ? 0.08 : 0) +
        stormBias * 0.22 +
        rhythmicBias * 0.18 +
        motionRecoveryBias * 0.14 +
        structuredRecoveryBias * 0.04 +
        nonImpactGenerativeBias * 0.04 +
        quietRoomMusicBias * 0.3 +
        quietRoomNeonBias * 0.22 +
        frame.momentum * 0.08 +
        frame.beatConfidence * 0.14 +
        frame.sectionChange * 0.08 +
        (frame.sectionChange < 0.2 ? 0.06 : 0) +
        livingMusicFloor * 0.12 +
        adaptiveNeonBias * 0.12 +
        lowImpactMatrixRecoveryBias * 0.08 +
        systemSourceRhythmBias * 0.24 +
        systemLongformMotionBias * 0.24 +
        ((frame.performanceIntent === 'detonate' ? -0.12 : 0) +
          (frame.dropImpact > 0.42 ? -0.12 : 0)) +
        (frame.momentKind === 'release' ? 0.04 : 0) +
        (frame.dropImpact < 0.28 ? 0.06 : 0) -
        systemOpenVarietyBias * 0.1 -
        systemBloomRecoveryBias * 0.06 -
        systemStructuredVoidBias * 0.26 -
        systemPrismaticBloomBias * 0.08 -
        systemSpectralAfterimageBias * 0.12 -
        spectralBias * 0.12 -
        (frame.showState === 'aftermath' ? 0.26 : 0) -
        (frame.showState === 'generative' && frame.dropImpact < 0.14 ? 0.12 : 0) -
        frame.releaseTail * 0.12 -
        (frame.showState === 'atmosphere' ? 0.1 : 0) -
        (frame.performanceIntent === 'hold' ? 0.12 : 0) -
        (frame.performanceIntent === 'detonate' ? 0.28 : 0) -
        ghostDwellPenalty * 0.14 -
        violentBias * 0.1 +
        operatorBias.neonStage * 0.24 +
        operatorBias.worldBoot * 0.34 +
        operatorBias.world * 0.16 +
        operatorBias.geometry * 0.12 +
        operatorBias.spectacle * 0.14
    ),
    'eclipse-rupture': clamp01(
      0.04 +
        (frame.performanceIntent === 'detonate' ? 0.18 : 0) +
        (frame.showState === 'surge' ? 0.16 : 0) +
        violentBias * 0.24 +
        structuralBias * 0.08 +
        frame.dropImpact * 0.12 +
        surgeBias * 0.04 -
        systemBloomRecoveryBias * 0.08 -
        structuredRecoveryBias * 0.08 -
        spectralBias * 0.1 -
        motionRecoveryBias * 0.06 -
        ghostDwellPenalty * 0.12 -
        frame.releaseTail * 0.12 -
        (frame.dropImpact < 0.32 ? 0.18 : 0) -
        (frame.beatConfidence > 0.72 && frame.dropImpact < 0.3 ? 0.08 : 0) +
        operatorBias.energy * 0.06 +
        operatorBias.spectacle * 0.04
    ),
    'ghost-afterimage': clamp01(
      0.04 +
        (frame.performanceIntent === 'haunt' ? 0.28 : 0) +
        (frame.showState === 'aftermath' ? 0.34 : 0) +
        spectralBias * 0.38 +
        systemSpectralAfterimageBias * 0.28 +
        structuredRecoveryBias * 0.12 +
        frame.releaseTail * 0.1 -
        frame.subPressure * 0.06 -
        motionRecoveryBias * 0.08 -
        ghostDwellPenalty * 0.4 -
        quietRoomMusicBias * 0.34 -
        quietRoomNeonBias * 0.12 -
        operatorBias.neon * 0.08 -
        operatorBias.spectacle * 0.06
    )
  };
}

export function chooseShowAct(input: {
  currentAct: ShowAct;
  secondsSinceLastChange: number;
  scores: Record<ShowAct, number>;
  minimumHoldSeconds?: number;
  switchThreshold?: number;
}): ShowAct {
  return chooseScoredState({
    currentState: input.currentAct,
    secondsSinceLastChange: input.secondsSinceLastChange,
    scores: input.scores,
    states: SHOW_ACTS,
    minimumHoldSeconds: input.minimumHoldSeconds ?? 4.2,
    switchThreshold: input.switchThreshold ?? 0.09,
    fatigueProfiles: {
      'matrix-storm': {
        afterSeconds: 4,
        thresholdReduction: 0.24
      },
      'laser-bloom': {
        afterSeconds: 4.2,
        thresholdReduction: 0.18
      },
      'eclipse-rupture': {
        afterSeconds: 3.8,
        thresholdReduction: 0.1
      },
      'ghost-afterimage': {
        afterSeconds: 5.4,
        thresholdReduction: 0.12
      },
      'void-chamber': {
        afterSeconds: 7.2,
        thresholdReduction: 0.06
      }
    }
  });
}

export function buildPaletteStateScores(
  frame: Pick<
    ListeningFrame,
    | 'showState'
    | 'performanceIntent'
    | 'mode'
    | 'harmonicColor'
    | 'shimmer'
    | 'dropImpact'
    | 'sectionChange'
    | 'releaseTail'
    | 'musicConfidence'
    | 'resonance'
    | 'transientConfidence'
    | 'beatConfidence'
    | 'air'
    | 'body'
    | 'tonalStability'
    | 'speechConfidence'
  >,
  showAct: ShowAct,
  cuePlan?: Pick<
    StageCuePlan,
    'family' | 'worldMode' | 'paletteTargets' | 'paletteHoldSeconds'
  >,
  tuning?: Partial<OperatorShowBias>
): Record<PaletteState, number> {
  const operatorBias = deriveOperatorBias(tuning);
  const coolBias = clamp01((0.58 - frame.harmonicColor) * 1.8 + frame.air * 0.22);
  const warmBias = clamp01(
    (frame.harmonicColor - 0.42) * 1.8 + frame.dropImpact * 0.22
  );
  const spectralBias = clamp01(frame.releaseTail * 0.56 + frame.resonance * 0.26);
  const impactBias = clamp01(
    frame.dropImpact * 0.56 +
      frame.sectionChange * 0.28 +
      frame.transientConfidence * 0.14
  );
  const shimmerBias = clamp01(frame.shimmer * 0.48 + frame.transientConfidence * 0.18);
  const systemBias =
    frame.mode === 'system-audio' ? 0.08 : frame.mode === 'hybrid' ? 0.05 : 0;
  const beatBias = clamp01(frame.beatConfidence * 0.62 + frame.transientConfidence * 0.14);
  const quietRoomNeonBias =
    frame.mode === 'room-mic'
      ? clamp01(
          frame.musicConfidence * 0.26 +
            Math.max(0, frame.harmonicColor - 0.46) * 0.54 +
            frame.shimmer * 0.24 +
            frame.air * 0.16 +
            beatBias * 0.1 -
            frame.speechConfidence * 0.16
        )
      : 0;
  const livingNeonBias = clamp01(
    frame.musicConfidence * 0.2 +
      frame.body * 0.14 +
      frame.tonalStability * 0.08 +
      frame.harmonicColor * 0.18 +
      frame.shimmer * 0.2 +
      frame.air * 0.1 +
      beatBias * 0.08 -
      frame.releaseTail * 0.06 -
      frame.speechConfidence * 0.12
  );
  const systemPaletteVarietyBias =
    frame.mode === 'system-audio'
      ? clamp01(
          frame.musicConfidence * 0.18 +
            frame.tonalStability * 0.16 +
            frame.sectionChange * 0.14 +
            beatBias * 0.12 +
            frame.shimmer * 0.08 -
            frame.releaseTail * 0.04
        )
      : 0;
  const matrixPaletteVarietyBias =
    showAct === 'matrix-storm'
      ? clamp01(
          frame.musicConfidence * 0.14 +
            frame.beatConfidence * 0.16 +
            frame.tonalStability * 0.12 +
            frame.shimmer * 0.16 +
            frame.air * 0.08 +
            frame.sectionChange * 0.1
        )
      : 0;
  const matrixStructuralPaletteBias =
    showAct === 'matrix-storm'
      ? clamp01(
          (cuePlan?.family === 'brood' ? 0.22 : 0) +
            (cuePlan?.family === 'release' ? 0.28 : 0) +
            (cuePlan?.family === 'haunt' ? 0.18 : 0) +
            (cuePlan?.worldMode === 'ghost-chamber' ? 0.28 : 0) +
            (cuePlan?.worldMode === 'field-bloom' ? 0.22 : 0) +
            frame.releaseTail * 0.2 +
            frame.resonance * 0.16 +
            frame.air * 0.12 +
            frame.sectionChange * 0.1 -
            frame.dropImpact * 0.24
        )
      : 0;
  const matrixNeonBurstBias =
    showAct === 'matrix-storm'
      ? clamp01(
          (cuePlan?.family === 'gather' ? 0.18 : 0) +
            (cuePlan?.family === 'reveal' ? 0.22 : 0) +
            (cuePlan?.worldMode === 'aperture-cage' ? 0.14 : 0) +
            (cuePlan?.worldMode === 'fan-sweep' ? 0.16 : 0) +
            frame.shimmer * 0.16 +
            beatBias * 0.16 +
            frame.sectionChange * 0.12 -
            frame.releaseTail * 0.04
        )
      : 0;
  const matrixSolarPenalty =
    showAct === 'matrix-storm'
      ? clamp01(
          0.12 +
            beatBias * 0.1 +
            livingNeonBias * 0.08 +
            (frame.showState === 'generative' ? 0.08 : 0) -
            (frame.performanceIntent === 'detonate' ? 0.08 : 0) -
            impactBias * 0.06 -
            matrixNeonBurstBias * 0.04
        )
      : 0;
  const laserBloomSolarLift =
    showAct === 'laser-bloom'
      ? clamp01(
          frame.sectionChange * 0.22 +
            warmBias * 0.18 +
            (frame.showState === 'generative' ? 0.08 : 0) +
            frame.musicConfidence * 0.06
        )
      : 0;
  const paletteTargets = normalizePaletteTargets(cuePlan?.paletteTargets ?? {});
  const paletteAuthority = clamp01(
    0.24 +
      (cuePlan?.family === 'brood' || cuePlan?.family === 'haunt' ? 0.18 : 0) +
      (cuePlan?.worldMode === 'ghost-chamber' ? 0.16 : 0) +
      (cuePlan?.worldMode === 'cathedral-rise' ? 0.12 : 0) +
      ((cuePlan?.paletteHoldSeconds ?? 0) - 3.2) * 0.08
  );

  const actBias: Record<ShowAct, Partial<Record<PaletteState, number>>> = {
    'void-chamber': {
      'void-cyan': 0.22,
      'tron-blue': 0.06,
      'ghost-white': 0.08
    },
    'laser-bloom': {
      'void-cyan': 0.18,
      'tron-blue': 0.12,
      'acid-lime': 0.04,
      'solar-magenta': 0.08
    },
    'matrix-storm': {
      'void-cyan': 0.2,
      'tron-blue': 0.1,
      'acid-lime': 0.06,
      'solar-magenta': 0.01,
      'ghost-white': 0.12
    },
    'eclipse-rupture': {
      'solar-magenta': 0.18,
      'ghost-white': 0.08,
      'void-cyan': 0.04
    },
    'ghost-afterimage': {
      'void-cyan': 0.08,
      'tron-blue': 0.04,
      'ghost-white': 0.24
    }
  };

  return {
    'void-cyan': clamp01(
      0.18 +
        (frame.showState === 'void' ? 0.28 : 0) +
        (frame.showState === 'atmosphere' ? 0.12 : 0) +
        coolBias * 0.44 +
        shimmerBias * 0.12 +
        beatBias * 0.1 +
        systemBias +
        systemPaletteVarietyBias * 0.28 +
        matrixStructuralPaletteBias * 0.28 +
        paletteTargets['void-cyan'] * paletteAuthority * 0.72 +
        (actBias[showAct]['void-cyan'] ?? 0) -
        matrixNeonBurstBias * 0.08 -
        livingNeonBias * 0.06 -
        quietRoomNeonBias * 0.18 -
        impactBias * 0.08 -
        warmBias * 0.04 -
        operatorBias.neon * 0.16 -
        operatorBias.neonStage * 0.28 -
        operatorBias.worldBoot * 0.16 -
        operatorBias.warm * 0.04
    ),
    'tron-blue': clamp01(
      0.06 +
        (frame.showState === 'generative' ? 0.08 : 0) +
        coolBias * 0.18 +
        beatBias * 0.1 +
        frame.musicConfidence * 0.1 +
        livingNeonBias * 0.12 +
        systemBias * 0.36 +
        systemPaletteVarietyBias * 0.12 +
        matrixPaletteVarietyBias * 0.18 +
        matrixStructuralPaletteBias * 0.1 +
        matrixNeonBurstBias * 0.18 +
        paletteTargets['tron-blue'] * paletteAuthority * 0.84 +
        quietRoomNeonBias * 0.3 +
        (actBias[showAct]['tron-blue'] ?? 0) -
        spectralBias * 0.04 +
        operatorBias.cool * 0.08 +
        operatorBias.neonStage * 0.16 +
        operatorBias.neon * 0.18 +
        operatorBias.heroFloor * 0.08
    ),
    'acid-lime': clamp01(
      0.08 +
        (frame.showState === 'tactile' ? 0.2 : 0) +
        (frame.showState === 'generative' ? 0.12 : 0) +
        shimmerBias * 0.42 +
        beatBias * 0.18 +
        frame.musicConfidence * 0.14 +
        livingNeonBias * 0.2 +
        paletteTargets['acid-lime'] * paletteAuthority * 0.86 +
        quietRoomNeonBias * 0.26 +
        matrixPaletteVarietyBias * 0.16 +
        matrixNeonBurstBias * 0.2 +
        (actBias[showAct]['acid-lime'] ?? 0) -
        matrixStructuralPaletteBias * 0.28 -
        systemPaletteVarietyBias * 0.08 -
        frame.releaseTail * 0.08 +
        operatorBias.geometry * 0.08 +
        operatorBias.neonStage * 0.16 +
        operatorBias.neon * 0.14 +
        operatorBias.worldBoot * 0.08
    ),
    'solar-magenta': clamp01(
      0.04 +
        (frame.showState === 'surge' ? 0.12 : 0) +
        (frame.showState === 'generative' ? 0.06 : 0) +
        (frame.performanceIntent === 'detonate' ? 0.14 : 0) +
        impactBias * 0.2 +
        warmBias * 0.12 +
        frame.sectionChange * 0.16 +
        livingNeonBias * 0.12 +
        frame.musicConfidence * 0.08 +
        systemPaletteVarietyBias * 0.12 +
        paletteTargets['solar-magenta'] * paletteAuthority * 0.72 +
        quietRoomNeonBias * 0.08 +
        laserBloomSolarLift * 0.26 +
        matrixNeonBurstBias * 0.04 +
        (actBias[showAct]['solar-magenta'] ?? 0) -
        matrixStructuralPaletteBias * 0.18 -
        matrixSolarPenalty * 0.4 -
        spectralBias * 0.02 +
        operatorBias.warm * 0.18 +
        operatorBias.neon * 0.08
    ),
    'ghost-white': clamp01(
      0.02 +
        (frame.showState === 'aftermath' ? 0.16 : 0) +
        (frame.performanceIntent === 'haunt' ? 0.14 : 0) +
        spectralBias * 0.22 +
        matrixStructuralPaletteBias * 0.3 +
        paletteTargets['ghost-white'] * paletteAuthority * 0.84 +
        frame.sectionChange * 0.08 +
        coolBias * 0.08 +
        (actBias[showAct]['ghost-white'] ?? 0) -
        impactBias * 0.04 -
        operatorBias.neon * 0.08
    )
  };
}

export function choosePaletteState(input: {
  currentState: PaletteState;
  secondsSinceLastChange: number;
  scores: Record<PaletteState, number>;
  minimumHoldSeconds?: number;
  switchThreshold?: number;
}): PaletteState {
  return chooseScoredState({
    currentState: input.currentState,
    secondsSinceLastChange: input.secondsSinceLastChange,
    scores: input.scores,
    states: PALETTE_STATES,
    minimumHoldSeconds: input.minimumHoldSeconds ?? 2.8,
    switchThreshold: input.switchThreshold ?? 0.09,
    earlySwitchThresholdMultiplier: 3.25,
    fatigueProfiles: {
      'tron-blue': {
        afterSeconds: 3.8,
        thresholdReduction: 0.12
      },
      'acid-lime': {
        afterSeconds: 3.2,
        thresholdReduction: 0.16
      },
      'solar-magenta': {
        afterSeconds: 3.4,
        thresholdReduction: 0.1
      },
      'ghost-white': {
        afterSeconds: 6.4,
        thresholdReduction: 0.04
      }
    }
  });
}

export function deriveVisualMotifKind(input: {
  frame: Pick<
    ListeningFrame,
    | 'performanceIntent'
    | 'mode'
    | 'dropImpact'
    | 'sectionChange'
    | 'releaseTail'
    | 'musicConfidence'
    | 'transientConfidence'
    | 'beatConfidence'
    | 'air'
    | 'body'
    | 'shimmer'
    | 'harmonicColor'
  >;
  cuePlan: Pick<
    StageCuePlan,
    'family' | 'dominance' | 'worldMode' | 'heroWeight' | 'worldWeight' | 'eventDensity'
  >;
}): VisualMotifKind {
  const { frame, cuePlan } = input;
  const acousticTransient =
    frame.mode === 'system-audio' &&
    frame.transientConfidence > 0.55 &&
    frame.beatConfidence < 0.52 &&
    frame.air > 0.28;

  if (
    cuePlan.worldMode === 'collapse-well' ||
    cuePlan.family === 'rupture' ||
    frame.performanceIntent === 'detonate' ||
    frame.dropImpact > 0.58
  ) {
    return 'rupture-scar';
  }
  if (
    cuePlan.worldMode === 'ghost-chamber' ||
    cuePlan.family === 'release' ||
    cuePlan.family === 'haunt' ||
    frame.releaseTail > 0.34
  ) {
    return frame.musicConfidence < 0.32 || frame.air > frame.body + 0.18
      ? 'silence-constellation'
      : 'ghost-residue';
  }
  if (
    cuePlan.worldMode === 'cathedral-rise' ||
    cuePlan.family === 'reveal' ||
    frame.sectionChange > 0.28
  ) {
    return 'neon-portal';
  }
  if (cuePlan.dominance === 'world' || cuePlan.worldWeight > 0.72) {
    return 'world-takeover';
  }
  if (acousticTransient) {
    return 'acoustic-transient';
  }
  if (
    cuePlan.family === 'gather' ||
    cuePlan.worldMode === 'aperture-cage' ||
    cuePlan.worldMode === 'fan-sweep' ||
    frame.beatConfidence > 0.56
  ) {
    return 'machine-grid';
  }
  return frame.shimmer > 0.42 || frame.harmonicColor > 0.58
    ? 'neon-portal'
    : 'void-anchor';
}

export function chooseVisualMotifKind(input: {
  rawMotif: VisualMotifKind;
  currentMotif?: VisualMotifKind;
  currentMotifAgeSeconds?: number;
  frame: Pick<
    ListeningFrame,
    | 'performanceIntent'
    | 'dropImpact'
    | 'sectionChange'
    | 'releaseTail'
    | 'musicConfidence'
    | 'air'
    | 'body'
  >;
  cuePlan: Pick<
    StageCuePlan,
    'family' | 'dominance' | 'worldMode' | 'worldWeight' | 'transformIntent'
  >;
  signatureMomentKind?: string;
  signatureMomentPhase?: string;
}): VisualMotifKind {
  const currentMotif = input.currentMotif;

  if (!currentMotif || currentMotif === 'void-anchor' || currentMotif === input.rawMotif) {
    return input.rawMotif;
  }

  const currentAge = Math.max(0, input.currentMotifAgeSeconds ?? Number.POSITIVE_INFINITY);
  const signatureActive =
    input.signatureMomentKind &&
    input.signatureMomentKind !== 'none' &&
    input.signatureMomentPhase !== 'idle' &&
    input.signatureMomentPhase !== 'clear';
  const hardRupture =
    input.rawMotif === 'rupture-scar' &&
    (input.frame.performanceIntent === 'detonate' ||
      input.frame.dropImpact > 0.52 ||
      (input.cuePlan.family === 'rupture' &&
        input.cuePlan.worldMode === 'collapse-well' &&
        (input.frame.dropImpact > 0.34 || input.frame.sectionChange > 0.24)));
  const releaseInterrupt =
    (input.rawMotif === 'ghost-residue' ||
      input.rawMotif === 'silence-constellation') &&
    (input.frame.releaseTail > 0.28 ||
      input.cuePlan.family === 'release' ||
      input.cuePlan.family === 'haunt');
  const neonInterrupt =
    input.rawMotif === 'neon-portal' &&
    input.frame.dropImpact < 0.54 &&
    (input.cuePlan.worldMode === 'cathedral-rise' ||
      input.cuePlan.family === 'reveal' ||
      input.frame.sectionChange > 0.28 ||
      input.frame.air > input.frame.body + 0.16);
  const authorityInterrupt =
    input.rawMotif === 'world-takeover' &&
    (input.cuePlan.dominance === 'world' || input.cuePlan.worldWeight > 0.78);
  const minHoldSeconds =
    currentMotif === 'rupture-scar'
      ? 1.6
      : currentMotif === 'ghost-residue' || currentMotif === 'silence-constellation'
        ? 2.2
        : currentMotif === 'neon-portal' || currentMotif === 'world-takeover'
          ? 1.35
          : 0.9;
  const canInterrupt =
    hardRupture ||
    releaseInterrupt ||
    authorityInterrupt ||
    (neonInterrupt && (currentMotif !== 'rupture-scar' || currentAge > 1.15)) ||
    Boolean(signatureActive && currentAge > 0.9);

  if (currentAge < minHoldSeconds && !canInterrupt) {
    return currentMotif;
  }

  if (input.rawMotif === 'rupture-scar' && !hardRupture) {
    return currentMotif;
  }

  if (
    currentMotif === 'rupture-scar' &&
    input.rawMotif !== 'ghost-residue' &&
    input.rawMotif !== 'silence-constellation' &&
    !neonInterrupt &&
    currentAge < 1.9
  ) {
    return currentMotif;
  }

  return input.rawMotif;
}

export function derivePaletteTransitionReason(input: {
  frame: Pick<ListeningFrame, 'dropImpact' | 'sectionChange' | 'releaseTail'>;
  cuePlan: Pick<StageCuePlan, 'family' | 'dominance'>;
  motif: VisualMotifKind;
  currentBaseState: PaletteState;
  nextBaseState: PaletteState;
  signatureMomentKind?: string;
}): PaletteTransitionReason {
  if (input.nextBaseState === input.currentBaseState) {
    return 'hold';
  }
  if (input.signatureMomentKind && input.signatureMomentKind !== 'none') {
    return 'signature-moment';
  }
  if (input.frame.dropImpact > 0.46 || input.cuePlan.family === 'rupture') {
    return 'drop-rupture';
  }
  if (input.frame.releaseTail > 0.28 || input.cuePlan.family === 'release') {
    return 'release-residue';
  }
  if (input.frame.sectionChange > 0.2) {
    return 'section-turn';
  }
  if (input.cuePlan.dominance === 'world') {
    return 'authority-shift';
  }
  return input.motif === 'void-anchor' ? 'hold' : 'motif-change';
}

function derivePaletteBaseHoldReason(input: {
  transitionReason: PaletteTransitionReason;
  motif: VisualMotifKind;
  cuePlan: Pick<StageCuePlan, 'family' | 'worldMode'>;
  signatureMomentKind?: string;
}): PaletteBaseHoldReason {
  if (input.transitionReason !== 'hold') {
    return input.transitionReason;
  }

  if (input.signatureMomentKind && input.signatureMomentKind !== 'none') {
    return 'signature-moment';
  }

  if (
    input.motif === 'ghost-residue' ||
    input.motif === 'silence-constellation' ||
    input.cuePlan.family === 'haunt' ||
    input.cuePlan.family === 'release'
  ) {
    return 'semantic-episode';
  }

  if (
    input.cuePlan.worldMode === 'cathedral-rise' ||
    input.cuePlan.worldMode === 'collapse-well'
  ) {
    return 'scene-held';
  }

  return 'motif-held';
}

function deriveRingPosture(input: {
  motif: VisualMotifKind;
  cuePlan: Pick<StageCuePlan, 'family' | 'ringAuthority' | 'worldMode' | 'residueMode'>;
  signatureMomentKind?: string;
  signatureMomentPhase?: string;
}): RingPosture {
  const signatureActive =
    input.signatureMomentKind &&
    input.signatureMomentKind !== 'none' &&
    input.signatureMomentPhase !== 'idle' &&
    input.signatureMomentPhase !== 'clear';

  if (
    input.motif === 'rupture-scar' ||
    input.cuePlan.family === 'rupture' ||
    input.signatureMomentKind === 'collapse-scar'
  ) {
    return 'event-strike';
  }

  if (
    input.motif === 'ghost-residue' ||
    input.motif === 'silence-constellation' ||
    input.cuePlan.residueMode === 'ghost' ||
    input.cuePlan.residueMode === 'afterglow'
  ) {
    return 'residue-trace';
  }

  if (
    input.cuePlan.ringAuthority === 'framing-architecture' &&
    (input.motif === 'neon-portal' ||
      input.cuePlan.worldMode === 'cathedral-rise' ||
      input.signatureMomentKind === 'cathedral-open')
  ) {
    return 'cathedral-architecture';
  }

  if (input.cuePlan.ringAuthority === 'event-platform' || signatureActive) {
    return 'event-strike';
  }

  return input.cuePlan.ringAuthority === 'background-scaffold'
    ? 'suppressed'
    : 'background-scaffold';
}

export function deriveSemanticEpisodeSnapshot(input: {
  motif: VisualMotifKind;
  paletteBaseState: PaletteState;
  heroRole: HeroSemanticRole;
  heroForm: StageCuePlan['heroForm'];
  cuePlan: Pick<StageCuePlan, 'family' | 'worldMode' | 'dominance'>;
  transitionReason: PaletteTransitionReason;
  currentEpisodeId?: string;
  currentEpisodeAgeSeconds?: number;
  elapsedSeconds?: number;
  lastEpisodeChangeSeconds?: number;
  signatureMomentKind?: string;
}): {
  semanticEpisodeId: string;
  semanticEpisodeAgeSeconds: number;
  semanticEpisodeTransitionReason: SemanticEpisodeTransitionReason;
} {
  const semanticEpisodeId = [
    input.motif,
    input.paletteBaseState,
    input.heroRole,
    input.heroForm,
    input.cuePlan.family,
    input.cuePlan.worldMode,
    input.cuePlan.dominance
  ].join(':');

  const changed = semanticEpisodeId !== input.currentEpisodeId;
  const semanticEpisodeAgeSeconds = changed
    ? 0
    : input.lastEpisodeChangeSeconds !== undefined && input.elapsedSeconds !== undefined
      ? Math.max(0, input.elapsedSeconds - input.lastEpisodeChangeSeconds)
      : Math.max(0, input.currentEpisodeAgeSeconds ?? 0);
  const semanticEpisodeTransitionReason: SemanticEpisodeTransitionReason =
    !changed
      ? 'hold'
      : input.signatureMomentKind && input.signatureMomentKind !== 'none'
        ? 'signature-moment'
        : input.transitionReason !== 'hold'
          ? input.transitionReason
          : 'cue-family';

  return {
    semanticEpisodeId,
    semanticEpisodeAgeSeconds,
    semanticEpisodeTransitionReason
  };
}

export function buildPaletteFrame(input: {
  baseState: PaletteState;
  targets: Record<PaletteState, number>;
  transitionReason: PaletteTransitionReason;
  semanticConfidence: number;
}): PaletteFrame {
  const targetDominance = Math.max(...Object.values(input.targets));
  const targetSpread = paletteSpreadOf(input.targets);
  return {
    baseState: input.baseState,
    modulationTargets: normalizePaletteTargets(input.targets),
    modulationAmount: clamp01(0.18 + targetSpread * 0.52 + (1 - targetDominance) * 0.18),
    targetDominance,
    targetSpread,
    transitionReason: input.transitionReason,
    semanticConfidence: input.semanticConfidence,
    roles: paletteRolesForBase(input.baseState)
  };
}

export function deriveVisualMotifSnapshot(input: {
  frame: Pick<
    ListeningFrame,
    | 'performanceIntent'
    | 'mode'
    | 'dropImpact'
    | 'sectionChange'
    | 'releaseTail'
    | 'musicConfidence'
    | 'transientConfidence'
    | 'beatConfidence'
    | 'air'
    | 'body'
    | 'shimmer'
    | 'harmonicColor'
  >;
  cuePlan: StageCuePlan;
  paletteBaseState: PaletteState;
  paletteTransitionReason: PaletteTransitionReason;
  signatureMomentKind?: string;
  signatureMomentPhase?: string;
  currentEpisodeId?: string;
  currentEpisodeAgeSeconds?: number;
  currentMotif?: VisualMotifKind;
  currentMotifAgeSeconds?: number;
  motif?: VisualMotifKind;
  elapsedSeconds?: number;
  lastEpisodeChangeSeconds?: number;
}): VisualMotifSnapshot {
  const rawMotif =
    input.motif ??
    deriveVisualMotifKind({
      frame: input.frame,
      cuePlan: input.cuePlan
    });
  const motif = chooseVisualMotifKind({
    rawMotif,
    currentMotif: input.currentMotif,
    currentMotifAgeSeconds: input.currentMotifAgeSeconds,
    frame: input.frame,
    cuePlan: input.cuePlan,
    signatureMomentKind: input.signatureMomentKind,
    signatureMomentPhase: input.signatureMomentPhase
  });
  const targetDominance = Math.max(...Object.values(input.cuePlan.paletteTargets));
  const targetSpread = paletteSpreadOf(input.cuePlan.paletteTargets);
  const semanticConfidence = clamp01(
    0.42 +
      targetDominance * 0.2 +
      input.frame.musicConfidence * 0.18 +
      Math.max(input.frame.sectionChange, input.frame.dropImpact, input.frame.releaseTail) *
        0.18 -
      targetSpread * 0.06
  );
  const paletteFrame = buildPaletteFrame({
    baseState: input.paletteBaseState,
    targets: input.cuePlan.paletteTargets,
    transitionReason: input.paletteTransitionReason,
    semanticConfidence
  });
  const heroRole = heroRoleForMotif(motif, input.cuePlan);
  const heroFormReason =
    input.signatureMomentKind && input.signatureMomentKind !== 'none'
      ? 'signature-moment'
      : heroFormReasonForMotif(motif, input.cuePlan);
  const semanticEpisode = deriveSemanticEpisodeSnapshot({
    motif,
    paletteBaseState: input.paletteBaseState,
    heroRole,
    heroForm: input.cuePlan.heroForm,
    cuePlan: input.cuePlan,
    transitionReason: input.paletteTransitionReason,
    currentEpisodeId: input.currentEpisodeId,
    currentEpisodeAgeSeconds: input.currentEpisodeAgeSeconds,
    elapsedSeconds: input.elapsedSeconds,
    lastEpisodeChangeSeconds: input.lastEpisodeChangeSeconds,
    signatureMomentKind: input.signatureMomentKind
  });
  return {
    ...semanticEpisode,
    kind: motif,
    confidence: semanticConfidence,
    reason: `${motif}:${input.cuePlan.family}:${input.cuePlan.worldMode}`,
    paletteFrame,
    paletteBaseHoldReason: derivePaletteBaseHoldReason({
      transitionReason: input.paletteTransitionReason,
      motif,
      cuePlan: input.cuePlan,
      signatureMomentKind: input.signatureMomentKind
    }),
    ringPosture: deriveRingPosture({
      motif,
      cuePlan: input.cuePlan,
      signatureMomentKind: input.signatureMomentKind,
      signatureMomentPhase: input.signatureMomentPhase
    }),
    heroRole,
    heroForm: input.cuePlan.heroForm,
    heroAccentForm: input.cuePlan.heroAccentForm,
    heroFormReason
  };
}

export function deriveVisualCue(
  frame: Pick<
    ListeningFrame,
    | 'showState'
    | 'performanceIntent'
    | 'musicConfidence'
    | 'peakConfidence'
    | 'beatConfidence'
    | 'preDropTension'
    | 'dropImpact'
    | 'sectionChange'
    | 'releaseTail'
    | 'resonance'
    | 'momentum'
    | 'momentKind'
    | 'momentAmount'
  >,
  showAct: ShowAct,
  temporalWindows: VisualTemporalWindows
): VisualCueState {
  const ruptureAuthority = clamp01(
    frame.dropImpact * 0.56 +
      frame.sectionChange * 0.2 +
      frame.peakConfidence * 0.12 +
      temporalWindows.beatStrike * 0.12 +
      (frame.performanceIntent === 'detonate' ? 0.18 : 0)
  );
  const revealAuthority = clamp01(
    frame.preDropTension * 0.32 +
      temporalWindows.preBeatLift * 0.24 +
      frame.musicConfidence * 0.12 +
      frame.sectionChange * 0.12 +
      frame.momentum * 0.08 +
      (frame.performanceIntent === 'ignite' ? 0.16 : 0)
  );
  const motionRecoveryAuthority = clamp01(
    frame.momentum * 0.24 +
      frame.beatConfidence * 0.16 +
      frame.sectionChange * 0.2 +
      temporalWindows.interBeatFloat * 0.1 +
      temporalWindows.barTurn * 0.08 +
      (frame.momentKind === 'release' ? 0.12 : 0) +
      (frame.momentKind === 'lift' ? 0.08 : 0)
  );
  const matrixAuthority = clamp01(
    frame.beatConfidence * 0.3 +
      frame.musicConfidence * 0.14 +
      temporalWindows.interBeatFloat * 0.18 +
      temporalWindows.barTurn * 0.1 +
      frame.sectionChange * 0.08 +
      motionRecoveryAuthority * 0.2 +
      (showAct === 'matrix-storm' ? 0.18 : 0)
  );
  const afterglowAuthority = clamp01(
    frame.releaseTail * 0.42 +
      temporalWindows.postBeatRelease * 0.22 +
      temporalWindows.phraseResolve * 0.28 +
      motionRecoveryAuthority * 0.14 +
      frame.sectionChange * 0.1 +
      (frame.showState === 'aftermath' ? 0.12 : 0) +
      (frame.momentKind === 'release' ? 0.08 : 0)
  );
  const gatherAuthority = clamp01(
    frame.preDropTension * 0.34 +
      temporalWindows.preBeatLift * 0.2 +
      frame.musicConfidence * 0.1 +
      motionRecoveryAuthority * 0.16 +
      (frame.performanceIntent === 'gather' ? 0.18 : 0) +
      matrixAuthority * 0.12
  );
  const hauntAuthority = clamp01(
    frame.releaseTail * 0.22 +
      frame.resonance * 0.14 +
      temporalWindows.phraseResolve * 0.1 +
      (frame.performanceIntent === 'haunt' ? 0.18 : 0) +
      (showAct === 'ghost-afterimage' ? 0.08 : 0) -
      motionRecoveryAuthority * 0.22 -
      frame.sectionChange * 0.08
  );

  let cueClass: VisualCueState['cueClass'] = 'brood';
  const ruptureDominates =
    ruptureAuthority >= 0.46 &&
    ruptureAuthority >= revealAuthority + 0.1 &&
    ruptureAuthority >= matrixAuthority + 0.12 &&
    ruptureAuthority >= afterglowAuthority + 0.14;

  if (
    ruptureDominates ||
    (showAct === 'eclipse-rupture' &&
      ruptureAuthority >= 0.42 &&
      frame.dropImpact >= 0.34 &&
      frame.sectionChange >= 0.18)
  ) {
    cueClass = 'rupture';
  } else if (
    afterglowAuthority >= 0.26 &&
    frame.dropImpact < 0.28 &&
    frame.sectionChange > 0.1 &&
    (temporalWindows.phraseResolve > 0.26 ||
      frame.momentKind === 'release' ||
      motionRecoveryAuthority > 0.34) &&
    !(
      showAct === 'matrix-storm' &&
      motionRecoveryAuthority > 0.34 &&
      frame.dropImpact < 0.24
    ) &&
    !(
      frame.performanceIntent === 'haunt' &&
      hauntAuthority >= 0.34 &&
      frame.resonance >= 0.32 &&
      frame.sectionChange < 0.3
    ) &&
    afterglowAuthority >= hauntAuthority - 0.02
  ) {
    cueClass = 'afterglow';
  } else if (
    hauntAuthority >= 0.34 &&
    frame.performanceIntent === 'haunt' &&
    frame.dropImpact < 0.28 &&
    frame.sectionChange < 0.3 &&
    (temporalWindows.phraseResolve < 0.34 ||
      (frame.releaseTail > 0.5 && frame.resonance > 0.44))
  ) {
    cueClass = 'haunt';
  } else if (
    matrixAuthority >= 0.32 &&
    (showAct === 'matrix-storm' || matrixAuthority >= revealAuthority + 0.08)
  ) {
    const matrixPrefersReveal =
      temporalWindows.beatStrike >= temporalWindows.preBeatLift + 0.12 &&
      (frame.sectionChange > 0.18 ||
        frame.beatConfidence > 0.42 ||
        frame.dropImpact > 0.16);
    cueClass =
      showAct === 'matrix-storm' &&
      motionRecoveryAuthority > 0.34 &&
      frame.dropImpact < 0.24
        ? 'brood'
        : matrixPrefersReveal
          ? 'reveal'
          : 'gather';
  } else if (
    revealAuthority >= 0.3 ||
    (showAct === 'laser-bloom' && revealAuthority >= 0.24)
  ) {
    cueClass = 'reveal';
  } else if (gatherAuthority >= 0.26) {
    cueClass = 'gather';
  }

  const intensity = clamp01(
    0.12 +
      ruptureAuthority * 0.34 +
      revealAuthority * 0.16 +
      hauntAuthority * 0.16 +
      gatherAuthority * 0.1 +
      afterglowAuthority * 0.12 +
      frame.momentAmount * 0.08
  );
  const attack = clamp01(
    temporalWindows.preBeatLift * 0.24 +
      temporalWindows.beatStrike * 0.34 +
      frame.sectionChange * 0.12 +
      (cueClass === 'rupture' ? 0.16 : 0) +
      (cueClass === 'reveal' ? 0.12 : 0)
  );
  const sustain = clamp01(
    0.12 +
      frame.musicConfidence * 0.08 +
      frame.preDropTension * 0.18 +
      temporalWindows.interBeatFloat * 0.12 +
      temporalWindows.barTurn * 0.12 +
      (cueClass === 'gather' ? 0.18 : 0) +
      (cueClass === 'reveal' ? 0.1 : 0)
  );
  const decay = clamp01(
    temporalWindows.postBeatRelease * 0.2 +
      temporalWindows.phraseResolve * 0.18 +
      frame.releaseTail * 0.34 +
      hauntAuthority * 0.12 +
      (cueClass === 'afterglow' ? 0.16 : 0) +
      (cueClass === 'haunt' ? 0.18 : 0)
  );

  const screenWeightByCue: Record<VisualCueState['cueClass'], number> = {
    brood: 0.1,
    gather: 0.24,
    reveal: 0.42,
    rupture: 0.72,
    afterglow: 0.24,
    haunt: 0.3
  };
  const residueWeightByCue: Record<VisualCueState['cueClass'], number> = {
    brood: 0.04,
    gather: 0.08,
    reveal: 0.12,
    rupture: 0.22,
    afterglow: 0.48,
    haunt: 0.56
  };
  const worldWeightByCue: Record<VisualCueState['cueClass'], number> = {
    brood: 0.56,
    gather: 0.74,
    reveal: 0.82,
    rupture: 0.86,
    afterglow: 0.7,
    haunt: 0.72
  };
  const heroWeightByCue: Record<VisualCueState['cueClass'], number> = {
    brood: 0.58,
    gather: 0.52,
    reveal: 0.36,
    rupture: 0.32,
    afterglow: 0.32,
    haunt: 0.28
  };
  const eventDensityByCue: Record<VisualCueState['cueClass'], number> = {
    brood: 0.14,
    gather: 0.28,
    reveal: 0.38,
    rupture: 0.6,
    afterglow: 0.22,
    haunt: 0.18
  };

  return {
    cueClass,
    intensity,
    attack,
    sustain,
    decay,
    screenWeight: clamp01(
      screenWeightByCue[cueClass] +
        intensity * 0.12 +
        temporalWindows.beatStrike * 0.08
    ),
    residueWeight: clamp01(
      residueWeightByCue[cueClass] +
        decay * 0.14 +
        frame.releaseTail * 0.08
    ),
    worldWeight: clamp01(
      worldWeightByCue[cueClass] +
        sustain * 0.1 +
        frame.sectionChange * 0.06
    ),
    heroWeight: clamp01(
      heroWeightByCue[cueClass] +
        (1 - worldWeightByCue[cueClass]) * 0.08 +
        frame.preDropTension * 0.04 -
        frame.sectionChange * 0.04
    ),
    eventDensity: clamp01(
      eventDensityByCue[cueClass] +
        attack * 0.1 +
        frame.sectionChange * 0.08
    )
  };
}

export function deriveStageCuePlan(input: {
  frame: Pick<
    ListeningFrame,
    | 'showState'
    | 'performanceIntent'
    | 'mode'
    | 'beatPhase'
    | 'barPhase'
    | 'phrasePhase'
    | 'musicConfidence'
    | 'peakConfidence'
    | 'beatConfidence'
    | 'preDropTension'
    | 'dropImpact'
    | 'sectionChange'
    | 'releaseTail'
    | 'resonance'
    | 'momentum'
    | 'speechConfidence'
    | 'transientConfidence'
    | 'body'
    | 'tonalStability'
    | 'harmonicColor'
    | 'brightness'
    | 'shimmer'
    | 'air'
    | 'momentKind'
  >;
  cueState: VisualCueState;
  showAct: ShowAct;
  cueFamilySeconds?: number;
  tuning?: Partial<OperatorShowBias>;
}): StageCuePlan {
  const { frame, cueState, showAct } = input;
  const operatorBias = deriveOperatorBias(input.tuning);
  const adaptiveEarnedFloor = clamp01(
    operatorBias.heroFloor * 0.38 +
      operatorBias.neonStage * 0.34 +
      operatorBias.worldBoot * 0.28
  );
  const clampSigned = (value: number): number => Math.max(-1, Math.min(1, value));
  type StageCueDraft = Omit<
    StageCuePlan,
    | 'motionPhrase'
    | 'cameraPhrase'
    | 'heroForm'
    | 'heroAccentForm'
    | 'heroFormHoldSeconds'
    | 'heroRole'
    | 'heroFormReason'
    | 'visualMotif'
    | 'visualMotifConfidence'
    | 'visualMotifReason'
    | 'paletteBaseState'
    | 'paletteTransitionReason'
    | 'paletteModulationAmount'
    | 'paletteTargetDominance'
    | 'paletteTargetSpread'
    | 'paletteTargets'
    | 'paletteHoldSeconds'
    | 'screenEffectIntent'
  > &
    Partial<
      Pick<
        StageCuePlan,
        | 'motionPhrase'
        | 'cameraPhrase'
        | 'heroForm'
        | 'heroAccentForm'
        | 'heroFormHoldSeconds'
        | 'heroRole'
        | 'heroFormReason'
        | 'visualMotif'
        | 'visualMotifConfidence'
        | 'visualMotifReason'
        | 'paletteBaseState'
        | 'paletteTransitionReason'
        | 'paletteModulationAmount'
        | 'paletteTargetDominance'
        | 'paletteTargetSpread'
        | 'paletteTargets'
        | 'paletteHoldSeconds'
        | 'screenEffectIntent'
      >
    >;
  const derivePaletteTargets = (plan: StageCueDraft): StageCuePlan['paletteTargets'] => {
    const baseByFamily: Record<StageCuePlan['family'], Partial<Record<PaletteState, number>>> =
      {
        brood: {
          'void-cyan': 0.28,
          'tron-blue': 0.18,
          'acid-lime': 0.06,
          'solar-magenta': 0.14,
          'ghost-white': 0.34
        },
        gather: {
          'void-cyan': 0.22,
          'tron-blue': 0.18,
          'acid-lime': 0.2,
          'solar-magenta': 0.2,
          'ghost-white': 0.2
        },
        reveal: {
          'void-cyan': 0.2,
          'tron-blue': 0.18,
          'acid-lime': 0.16,
          'solar-magenta': 0.22,
          'ghost-white': 0.24
        },
        rupture: {
          'void-cyan': 0.08,
          'tron-blue': 0.16,
          'acid-lime': 0.18,
          'solar-magenta': 0.42,
          'ghost-white': 0.16
        },
        release: {
          'void-cyan': 0.14,
          'tron-blue': 0.14,
          'acid-lime': 0.08,
          'solar-magenta': 0.16,
          'ghost-white': 0.48
        },
        haunt: {
          'void-cyan': 0.18,
          'tron-blue': 0.08,
          'acid-lime': 0.04,
          'solar-magenta': 0.08,
          'ghost-white': 0.62
        },
        reset: {
          'void-cyan': 0.12,
          'tron-blue': 0.1,
          'acid-lime': 0.06,
          'solar-magenta': 0.18,
          'ghost-white': 0.54
        }
      };
    const actBias: Partial<Record<PaletteState, number>> =
      showAct === 'void-chamber'
        ? { 'void-cyan': 0.16, 'ghost-white': 0.08 }
        : showAct === 'laser-bloom'
          ? {
              'tron-blue': 0.1,
              'acid-lime': 0.04,
              'solar-magenta': 0.12,
              'ghost-white': 0.04
            }
          : showAct === 'matrix-storm'
            ? plan.family === 'brood' ||
              plan.family === 'release' ||
              plan.family === 'haunt' ||
              plan.worldMode === 'ghost-chamber' ||
              plan.worldMode === 'field-bloom'
              ? {
                  'void-cyan': 0.14,
                  'ghost-white': 0.14,
                  'tron-blue': 0.04,
                  'acid-lime': -0.02,
                  'solar-magenta': -0.08
                }
              : plan.family === 'gather' ||
                  plan.family === 'reveal' ||
                  plan.worldMode === 'aperture-cage' ||
                  plan.worldMode === 'fan-sweep'
                ? {
                    'tron-blue': 0.12,
                    'acid-lime': 0.08,
                    'void-cyan': 0.08,
                    'ghost-white': 0.02,
                    'solar-magenta': -0.04
                  }
                : {
                    'tron-blue': 0.08,
                    'acid-lime': 0.02,
                    'solar-magenta': -0.04,
                    'ghost-white': 0.1,
                    'void-cyan': 0.12
                  }
            : showAct === 'eclipse-rupture'
              ? { 'solar-magenta': 0.16, 'ghost-white': 0.06, 'tron-blue': 0.04 }
              : { 'ghost-white': 0.16, 'void-cyan': 0.06, 'tron-blue': 0.04 };
    const worldBias: Partial<Record<PaletteState, number>> =
      plan.worldMode === 'ghost-chamber'
        ? { 'ghost-white': 0.14, 'void-cyan': 0.08 }
        : plan.worldMode === 'cathedral-rise'
          ? { 'solar-magenta': 0.12, 'acid-lime': 0.06 }
          : plan.worldMode === 'fan-sweep'
            ? { 'void-cyan': 0.06, 'tron-blue': 0.12, 'acid-lime': 0.06 }
            : plan.worldMode === 'field-bloom'
              ? { 'ghost-white': 0.1, 'void-cyan': 0.08 }
              : {};
    const matrixStructuralPaletteLift =
      showAct === 'matrix-storm'
        ? clamp01(
            (plan.family === 'brood' ? 0.22 : 0) +
              (plan.family === 'release' ? 0.28 : 0) +
              (plan.family === 'haunt' ? 0.18 : 0) +
              (plan.worldMode === 'ghost-chamber' ? 0.28 : 0) +
              (plan.worldMode === 'field-bloom' ? 0.2 : 0) +
              frame.releaseTail * 0.16 +
              frame.resonance * 0.12 +
              frame.air * 0.1 -
              frame.dropImpact * 0.24
          )
        : 0;
    const matrixBurstPaletteLift =
      showAct === 'matrix-storm'
        ? clamp01(
            (plan.family === 'gather' ? 0.18 : 0) +
              (plan.family === 'reveal' ? 0.22 : 0) +
              (plan.worldMode === 'aperture-cage' ? 0.12 : 0) +
              (plan.worldMode === 'fan-sweep' ? 0.16 : 0) +
              frame.shimmer * 0.14 +
              frame.beatConfidence * 0.12 +
              frame.sectionChange * 0.1 -
              frame.releaseTail * 0.04
          )
        : 0;

    return normalizePaletteTargets({
      ...baseByFamily[plan.family],
      'void-cyan':
        (baseByFamily[plan.family]['void-cyan'] ?? 0) +
        (actBias['void-cyan'] ?? 0) +
        (worldBias['void-cyan'] ?? 0) +
        matrixStructuralPaletteLift * 0.2 -
        matrixBurstPaletteLift * 0.04 +
        clamp01((0.58 - frame.harmonicColor) * 0.8) * 0.08,
      'tron-blue':
        (baseByFamily[plan.family]['tron-blue'] ?? 0) +
        (actBias['tron-blue'] ?? 0) +
        (worldBias['tron-blue'] ?? 0) +
        matrixStructuralPaletteLift * 0.06 +
        matrixBurstPaletteLift * 0.12 +
        frame.shimmer * 0.06,
      'acid-lime':
        (baseByFamily[plan.family]['acid-lime'] ?? 0) +
        (actBias['acid-lime'] ?? 0) +
        (worldBias['acid-lime'] ?? 0) +
        matrixBurstPaletteLift * 0.16 -
        matrixStructuralPaletteLift * 0.2 +
        clamp01(frame.shimmer * 0.22 + frame.beatConfidence * 0.12) * 0.08,
      'solar-magenta':
        (baseByFamily[plan.family]['solar-magenta'] ?? 0) +
        (actBias['solar-magenta'] ?? 0) +
        (worldBias['solar-magenta'] ?? 0) +
        matrixBurstPaletteLift * 0.04 -
        matrixStructuralPaletteLift * 0.16 +
        clamp01(frame.harmonicColor * 0.24 + frame.sectionChange * 0.12) * 0.1,
      'ghost-white':
        (baseByFamily[plan.family]['ghost-white'] ?? 0) +
        (actBias['ghost-white'] ?? 0) +
        (worldBias['ghost-white'] ?? 0) +
        matrixStructuralPaletteLift * 0.24 +
        clamp01(frame.releaseTail * 0.34 + frame.resonance * 0.14) * 0.12
    });
  };
  const deriveMotionPhrase = (plan: StageCueDraft): StageCuePlan['motionPhrase'] => {
    if (plan.family === 'rupture') {
      return 'recoil-dive';
    }
    if (plan.family === 'release' || plan.family === 'haunt') {
      return 'tumble-release';
    }
    if (plan.worldMode === 'cathedral-rise') {
      return 'cathedral-precession';
    }
    if (plan.family === 'reveal') {
      return 'bank-rise';
    }
    if (plan.family === 'gather') {
      return 'arc-handoff';
    }
    return 'drift-orbit';
  };
  const deriveCameraPhrase = (plan: StageCueDraft): StageCuePlan['cameraPhrase'] => {
    if (plan.family === 'rupture') {
      return 'recoil-dive';
    }
    if (plan.worldMode === 'cathedral-rise' || plan.dominance === 'world') {
      return 'cathedral-precession';
    }
    if (plan.family === 'reveal') {
      return 'bank-rise';
    }
    if (plan.family === 'gather') {
      return 'arc-handoff';
    }
    return 'drift-orbit';
  };
  const deriveHeroForms = (
    plan: StageCueDraft
  ): Pick<StageCuePlan, 'heroForm' | 'heroAccentForm' | 'heroFormHoldSeconds'> => {
    const paletteTargets = normalizePaletteTargets(plan.paletteTargets ?? derivePaletteTargets(plan));
    const rankedPalettes = Object.entries(paletteTargets)
      .sort((left, right) => right[1] - left[1]) as Array<[PaletteState, number]>;
    const primaryPalette = rankedPalettes[0]?.[0] ?? 'void-cyan';
    const secondaryPalette = rankedPalettes[1]?.[0] ?? primaryPalette;
    const resolvePaletteForm = (
      palette: PaletteState,
      family: StageCuePlan['family']
    ): StageCuePlan['heroForm'] => {
      switch (palette) {
        case 'tron-blue':
          return family === 'rupture' ? 'shard' : 'cube';
        case 'acid-lime':
          return family === 'rupture' ? 'shard' : family === 'haunt' ? 'diamond' : 'prism';
        case 'solar-magenta':
          return family === 'rupture' ? 'shard' : family === 'reveal' ? 'pyramid' : 'prism';
        case 'ghost-white':
          return family === 'release' || family === 'haunt' ? 'diamond' : 'orb';
        default:
          return family === 'gather' ? 'cube' : family === 'release' ? 'diamond' : 'orb';
      }
    };
    const accentFallback: Record<StageCuePlan['heroForm'], StageCuePlan['heroForm']> = {
      orb: 'diamond',
      cube: 'prism',
      pyramid: 'shard',
      diamond: 'orb',
      prism: 'cube',
      shard: 'pyramid',
      mushroom: 'diamond'
    };

    let heroForm =
      plan.family === 'rupture'
        ? paletteTargets['solar-magenta'] > 0.24
          ? 'shard'
          : 'pyramid'
        : plan.family === 'reveal'
          ? plan.worldMode === 'cathedral-rise'
            ? 'prism'
            : resolvePaletteForm(primaryPalette, plan.family)
          : plan.family === 'gather'
            ? primaryPalette === 'tron-blue'
              ? 'cube'
              : primaryPalette === 'acid-lime'
                ? 'prism'
                : 'diamond'
            : plan.family === 'release'
              ? primaryPalette === 'solar-magenta'
                ? 'prism'
                : 'diamond'
              : plan.family === 'haunt'
                ? primaryPalette === 'ghost-white'
                  ? 'mushroom'
                  : 'diamond'
                : resolvePaletteForm(primaryPalette, plan.family);

    if (showAct === 'matrix-storm' && plan.family === 'brood') {
      heroForm =
        primaryPalette === 'acid-lime'
          ? 'prism'
          : primaryPalette === 'tron-blue'
            ? 'cube'
            : primaryPalette === 'ghost-white'
              ? 'diamond'
              : 'orb';
    }

    if (
      showAct === 'ghost-afterimage' &&
      (plan.family === 'haunt' || plan.worldMode === 'ghost-chamber')
    ) {
      heroForm =
        primaryPalette === 'ghost-white' &&
        plan.worldMode === 'ghost-chamber' &&
        plan.eventDensity < 0.22
          ? 'mushroom'
          : 'diamond';
    }

    let heroAccentForm = resolvePaletteForm(secondaryPalette, plan.family);
    if (heroAccentForm === heroForm) {
      heroAccentForm = accentFallback[heroForm];
    }

    const heroFormHoldSeconds = Math.max(
      1.8,
      Math.min(
        4.8,
      (plan.family === 'rupture'
        ? 2.1
        : plan.family === 'reveal'
          ? 2.8
        : plan.family === 'gather'
            ? 3.2
            : plan.family === 'release'
              ? 3.6
              : plan.family === 'haunt'
              ? 4.2
              : 3.8) +
        (plan.worldMode === 'ghost-chamber' ? 0.8 : 0) -
        (plan.eventDensity > 0.46 ? 0.5 : 0) -
        (1 - Math.max(...Object.values(paletteTargets))) * 0.8
      )
    );

    return {
      heroForm,
      heroAccentForm,
      heroFormHoldSeconds
    };
  };
  const deriveScreenEffectIntent = (
    plan: StageCueDraft
  ): StageCuePlan['screenEffectIntent'] => {
    if (plan.family === 'rupture') {
      return {
        family: 'impact-memory',
        intensity: clamp01(0.58 + cueState.intensity * 0.28),
        directionalBias: clamp01(0.26 + cueState.attack * 0.2),
        memoryBias: clamp01(0.24 + frame.dropImpact * 0.28),
        carveBias: clamp01(0.32 + cueState.screenWeight * 0.26)
      };
    }
    if (plan.family === 'release' || plan.family === 'haunt') {
      return {
        family: 'directional-afterimage',
        intensity: clamp01(0.34 + cueState.decay * 0.34 + frame.releaseTail * 0.22),
        directionalBias: clamp01(0.18 + cueState.screenWeight * 0.18),
        memoryBias: clamp01(0.34 + cueState.residueWeight * 0.24),
        carveBias: clamp01(0.08 + cueState.worldWeight * 0.08)
      };
    }
    if (plan.family === 'gather') {
      return {
        family: 'stain',
        intensity: clamp01(0.22 + cueState.screenWeight * 0.18 + frame.preDropTension * 0.12),
        directionalBias: clamp01(0.14 + frame.beatConfidence * 0.12),
        memoryBias: clamp01(0.18 + cueState.residueWeight * 0.14),
        carveBias: clamp01(0.1 + cueState.worldWeight * 0.12)
      };
    }
    if (plan.family === 'reveal') {
      return {
        family: 'wipe',
        intensity: clamp01(0.22 + cueState.screenWeight * 0.24 + cueState.attack * 0.12),
        directionalBias: clamp01(0.22 + cueState.attack * 0.18),
        memoryBias: clamp01(0.12 + cueState.residueWeight * 0.12),
        carveBias: clamp01(0.18 + cueState.worldWeight * 0.16)
      };
    }
    return {
      family: 'stain',
      intensity: clamp01(0.08 + cueState.screenWeight * 0.14 + frame.releaseTail * 0.04),
      directionalBias: clamp01(0.06 + cueState.screenWeight * 0.08),
      memoryBias: clamp01(0.1 + cueState.residueWeight * 0.1),
      carveBias: clamp01(0.12 + cueState.worldWeight * 0.12)
    };
  };
  const finalizePlan = (draft: StageCueDraft): StageCuePlan => {
    const plan: StageCuePlan = {
      ...draft,
      motionPhrase: draft.motionPhrase ?? deriveMotionPhrase(draft),
      cameraPhrase: draft.cameraPhrase ?? deriveCameraPhrase(draft),
      ...deriveHeroForms(draft),
      paletteTargets: normalizePaletteTargets(
        draft.paletteTargets ?? derivePaletteTargets(draft)
      ),
      paletteHoldSeconds:
        draft.paletteHoldSeconds ??
        (draft.family === 'rupture'
          ? 2.2
          : draft.family === 'reveal'
            ? 3
            : draft.family === 'gather'
              ? 3.8
              : draft.family === 'brood'
                ? 4.6
                : draft.family === 'haunt'
                  ? 4.8
                  : 4.2),
      screenEffectIntent:
        draft.screenEffectIntent ?? deriveScreenEffectIntent(draft)
    };
    const applySemanticFields = (targetPlan: StageCuePlan): StageCuePlan => {
      const visualMotif = deriveVisualMotifKind({
        frame,
        cuePlan: targetPlan
      });
      const paletteBaseState =
        targetPlan.paletteBaseState ??
        semanticPaletteBaseForMotif(visualMotif, targetPlan.paletteTargets);
      const paletteTransitionReason =
        targetPlan.paletteTransitionReason ??
        derivePaletteTransitionReason({
          frame,
          cuePlan: targetPlan,
          motif: visualMotif,
          currentBaseState: paletteBaseState,
          nextBaseState: paletteBaseState
        });
      const paletteFrame = buildPaletteFrame({
        baseState: paletteBaseState,
        targets: targetPlan.paletteTargets,
        transitionReason: paletteTransitionReason,
        semanticConfidence: targetPlan.visualMotifConfidence ?? 0.62
      });
      targetPlan.visualMotif = targetPlan.visualMotif ?? visualMotif;
      targetPlan.visualMotifConfidence =
        targetPlan.visualMotifConfidence ?? paletteFrame.semanticConfidence;
      targetPlan.visualMotifReason =
        targetPlan.visualMotifReason ??
        `${targetPlan.visualMotif}:${targetPlan.family}:${targetPlan.worldMode}`;
      targetPlan.paletteBaseState = paletteBaseState;
      targetPlan.paletteTransitionReason = paletteTransitionReason;
      targetPlan.paletteModulationAmount = paletteFrame.modulationAmount;
      targetPlan.paletteTargetDominance = paletteFrame.targetDominance;
      targetPlan.paletteTargetSpread = paletteFrame.targetSpread;
      targetPlan.heroRole = targetPlan.heroRole ?? heroRoleForMotif(visualMotif, targetPlan);
      const semanticHeroForm = heroFormForMotif(visualMotif, targetPlan);
      const priorHeroForm = targetPlan.heroForm;
      targetPlan.heroForm = semanticHeroForm;
      if (targetPlan.heroAccentForm === semanticHeroForm) {
        targetPlan.heroAccentForm =
          priorHeroForm !== semanticHeroForm
            ? priorHeroForm
            : semanticHeroForm === 'prism'
              ? 'cube'
              : semanticHeroForm === 'pyramid'
                ? 'prism'
                : semanticHeroForm === 'shard'
                  ? 'pyramid'
                  : semanticHeroForm === 'diamond'
                    ? 'orb'
                    : semanticHeroForm === 'mushroom'
                      ? 'diamond'
                      : 'prism';
      }
      targetPlan.heroFormHoldSeconds = Math.max(
        targetPlan.heroFormHoldSeconds,
        heroFormHoldSecondsForMotif(visualMotif, targetPlan)
      );
      targetPlan.heroFormReason =
        targetPlan.heroFormReason ?? heroFormReasonForMotif(visualMotif, targetPlan);

      return targetPlan;
    };
    if (!input.tuning) {
      return applySemanticFields(plan);
    }

    const neonLift = operatorBias.neon;
    const lifeLift = operatorBias.life;
    const wideLift = operatorBias.framingWide;
    const tightLift = operatorBias.framingTight;

    if (
      plan.family === 'brood' ||
      plan.family === 'gather' ||
      plan.family === 'reveal'
    ) {
      plan.stageWeight = clamp01(
        plan.stageWeight +
          operatorBias.spectacle * 0.14 +
          neonLift * 0.12 +
          operatorBias.neonStage * 0.12 +
          operatorBias.worldBoot * 0.16
      );
      plan.chamberWeight = clamp01(
        plan.chamberWeight +
          operatorBias.world * 0.12 +
          wideLift * 0.08 +
          operatorBias.neonStage * 0.08 +
          operatorBias.worldBoot * 0.18
      );
      plan.worldWeight = clamp01(
        plan.worldWeight +
          operatorBias.world * 0.12 +
          wideLift * 0.08 +
          operatorBias.neonStage * 0.06 +
          operatorBias.worldBoot * 0.16
      );
      plan.screenWeight = clamp01(
        plan.screenWeight +
          neonLift * 0.18 +
          operatorBias.radiance * 0.1 +
          operatorBias.neonStage * 0.16 +
          lifeLift * 0.06
      );
      plan.heroScaleBias = clampSigned(
        plan.heroScaleBias +
          tightLift * 0.22 +
          neonLift * (plan.family === 'brood' ? 0.08 : 0.12) +
          operatorBias.spectacle * 0.08 +
          operatorBias.heroFloor * 0.16
      );
      plan.heroStageX = clampSigned(
        plan.heroStageX +
          wideLift * (plan.family === 'brood' ? 0.12 : 0.18) -
          tightLift * 0.04
      );
      plan.heroStageY = clampSigned(
        plan.heroStageY +
          lifeLift * (plan.family === 'brood' ? 0.06 : 0.1) +
          (plan.family === 'reveal' ? 0.06 : 0)
      );
      plan.heroDepthBias = clampSigned(
        plan.heroDepthBias +
          tightLift * 0.12 +
          (plan.family === 'gather' || plan.family === 'reveal' ? 0.08 : 0.04) +
          operatorBias.cameraNear * 0.12
      );
      plan.heroMotionBias = clamp01(
        plan.heroMotionBias +
          lifeLift * 0.18 +
          operatorBias.heroFloor * 0.12 +
          operatorBias.spectacle * 0.06
      );
      plan.heroMorphBias = clamp01(
        plan.heroMorphBias + operatorBias.geometry * 0.1 + lifeLift * 0.06
      );
      plan.heroScaleMin = clamp01(
        plan.heroScaleMin +
          (plan.family === 'brood' ? 0.08 : plan.family === 'gather' ? 0.1 : 0.08) +
          tightLift * 0.08 +
          operatorBias.heroFloor * 0.12
      );
      plan.heroScaleMax = Math.max(
        plan.heroScaleMin + 0.06,
        plan.heroScaleMax +
          (plan.family === 'brood' ? 0.08 : plan.family === 'gather' ? 0.12 : 0.1) +
          tightLift * 0.12 +
          operatorBias.spectacle * 0.08 +
          operatorBias.heroFloor * 0.14
      );
    }

    if (plan.family === 'haunt') {
      plan.screenWeight = clamp01(plan.screenWeight + neonLift * 0.08);
      plan.heroMotionBias = clamp01(plan.heroMotionBias + lifeLift * 0.06);
      plan.heroScaleMin = clamp01(plan.heroScaleMin + 0.02 + tightLift * 0.04);
      plan.heroScaleMax = Math.max(
        plan.heroScaleMin + 0.06,
        plan.heroScaleMax + 0.06 + tightLift * 0.06
      );
    }

    return applySemanticFields(plan);
  };
  const cueFamilySeconds = Math.max(0, input.cueFamilySeconds ?? 0);
  const temporalWindows = deriveTemporalWindows(frame);
  const quietRoomMusicFloor =
    frame.mode === 'room-mic' &&
    frame.musicConfidence > 0.16 &&
    frame.speechConfidence < 0.34 &&
    frame.dropImpact < 0.18 &&
    frame.releaseTail < 0.28;
  const quietRoomColorLift = clamp01(
    frame.musicConfidence * 0.26 +
      frame.harmonicColor * 0.22 +
      frame.shimmer * 0.16 +
      frame.brightness * 0.12 -
      frame.speechConfidence * 0.14
  );
  const livingMusicFloor = clamp01(
    frame.musicConfidence * 0.32 +
      frame.body * 0.18 +
      frame.tonalStability * 0.12 +
      frame.momentum * 0.14 +
      frame.harmonicColor * 0.1 +
      frame.shimmer * 0.08 +
      frame.air * 0.06 -
      frame.releaseTail * 0.06 -
      frame.speechConfidence * 0.18 -
      frame.dropImpact * 0.08 +
      operatorBias.neonStage * 0.08 +
      operatorBias.heroFloor * 0.06
  );
  const livingNeonLift = clamp01(
    livingMusicFloor * 0.66 +
      frame.harmonicColor * 0.18 +
      frame.shimmer * 0.16 +
      frame.brightness * 0.12
  );
  const settledGhostPenalty = clamp01(cueFamilySeconds / 4.2);
  const ruptureAuthority = clamp01(
    frame.dropImpact * 0.56 +
      frame.sectionChange * 0.2 +
      frame.peakConfidence * 0.12 +
      frame.beatConfidence * 0.08 +
      (frame.performanceIntent === 'detonate' ? 0.16 : 0)
  );
  const revealAuthority = clamp01(
    frame.preDropTension * 0.32 +
      frame.beatConfidence * 0.12 +
      frame.musicConfidence * 0.12 +
      frame.sectionChange * 0.12 +
      (frame.performanceIntent === 'ignite' ? 0.16 : 0)
  );
  const motionRecoveryAuthority = clamp01(
    frame.momentum * 0.24 +
      frame.beatConfidence * 0.16 +
      frame.sectionChange * 0.2 +
      temporalWindows.interBeatFloat * 0.1 +
      temporalWindows.barTurn * 0.08 +
      (frame.momentKind === 'release' ? 0.12 : 0) +
      (frame.momentKind === 'lift' ? 0.08 : 0)
  );
  const structuredRecoveryBias = clamp01(
    frame.sectionChange * 0.24 +
      frame.beatConfidence * 0.18 +
      frame.musicConfidence * 0.12 +
      frame.momentum * 0.16 +
      cueState.eventDensity * 0.08 +
      cueState.decay * 0.08 +
      (frame.momentKind === 'release' ? 0.08 : 0) +
      (frame.momentKind === 'lift' ? 0.06 : 0) -
      frame.dropImpact * 0.12 -
      cueState.heroWeight * 0.04
  );
  const matrixAuthority = clamp01(
    frame.beatConfidence * 0.3 +
      frame.musicConfidence * 0.14 +
      cueState.eventDensity * 0.16 +
      cueState.residueWeight * 0.08 +
      frame.sectionChange * 0.08 +
      motionRecoveryAuthority * 0.18 +
      (showAct === 'matrix-storm' ? 0.18 : 0)
  );
  const releaseAuthority = clamp01(
    frame.releaseTail * 0.36 +
      cueState.decay * 0.22 +
      cueState.residueWeight * 0.16 +
      cueState.intensity * 0.08 +
      motionRecoveryAuthority * 0.12 +
      frame.momentum * 0.1 +
      (frame.sectionChange > 0.18 ? 0.06 : 0)
  );
  const hauntAuthority = clamp01(
    frame.releaseTail * 0.22 +
      cueState.residueWeight * 0.24 +
      cueState.decay * 0.14 +
      (frame.performanceIntent === 'haunt' ? 0.16 : 0) +
      (showAct === 'ghost-afterimage' ? 0.08 : 0) -
      motionRecoveryAuthority * 0.22 -
      frame.sectionChange * 0.08 -
      frame.momentum * 0.08
  );
  const ruptureLike =
    cueState.cueClass === 'rupture' ||
    (showAct === 'eclipse-rupture' &&
      ruptureAuthority >= 0.5 &&
      frame.dropImpact >= 0.38 &&
      frame.sectionChange >= 0.18)
      ? 1
      : 0;
  const revealLike =
    cueState.cueClass === 'reveal' ||
    (showAct === 'laser-bloom' && revealAuthority >= 0.28)
      ? 1
      : 0;
  const gatherLike = cueState.cueClass === 'gather' ? 1 : 0;
  const releaseLike =
    cueState.cueClass === 'afterglow' ||
    (releaseAuthority >= 0.28 &&
      frame.dropImpact < 0.28 &&
      frame.sectionChange > 0.12 &&
      frame.releaseTail > 0.2 &&
      (temporalWindows.phraseResolve > 0.28 ||
        motionRecoveryAuthority > 0.32 ||
        (frame.momentKind === 'release' && temporalWindows.postBeatRelease > 0.22)) &&
      releaseAuthority >= hauntAuthority - 0.02 &&
      settledGhostPenalty < 0.92) ||
    (frame.releaseTail > 0.36 &&
      frame.sectionChange > 0.18 &&
      frame.dropImpact < 0.2 &&
      (temporalWindows.phraseResolve > 0.34 ||
        motionRecoveryAuthority > 0.36 ||
        (frame.momentKind === 'release' &&
          temporalWindows.postBeatRelease > 0.28 &&
          frame.momentum > 0.3)))
      ? 1
      : 0;
  const hauntLike =
    cueState.cueClass === 'haunt' ||
    (showAct === 'ghost-afterimage' &&
      frame.performanceIntent === 'haunt' &&
      frame.releaseTail > 0.32 &&
      releaseAuthority < hauntAuthority + 0.04 &&
      motionRecoveryAuthority < 0.34 &&
      temporalWindows.phraseResolve < 0.38 &&
      settledGhostPenalty < 0.9)
      ? 1
      : 0;
  const resetLike =
    frame.sectionChange > 0.28 &&
    frame.preDropTension < 0.26 &&
    frame.dropImpact < 0.22 &&
    frame.releaseTail < 0.24 &&
    (motionRecoveryAuthority > 0.16 || cueState.decay > 0.2) &&
    temporalWindows.barTurn > 0.28 &&
      temporalWindows.phraseResolve > 0.2 &&
    cueState.cueClass !== 'rupture'
      ? 1
      : 0;
  const releaseDominatesHaunt =
    releaseAuthority >= hauntAuthority + 0.04 ||
    (frame.sectionChange >= 0.24 && motionRecoveryAuthority >= 0.34);
  const actAnchor = {
    'void-chamber': { x: 0, y: -0.06 },
    'laser-bloom': { x: 0.28, y: 0.12 },
    'matrix-storm': { x: -0.12, y: -0.04 },
    'eclipse-rupture': { x: 0.44, y: 0.06 },
    'ghost-afterimage': { x: -0.18, y: 0.2 }
  }[showAct];
  const confidence = clamp01(
    frame.musicConfidence * 0.42 +
      frame.peakConfidence * 0.3 +
      frame.beatConfidence * 0.08 +
      cueState.intensity * 0.12 +
      cueState.attack * 0.08
  );

  const resolveSpendProfile = (
    family: StageCuePlan['family']
  ): StageCuePlan['spendProfile'] => {
    const quietRoomEarnedFloor =
      quietRoomMusicFloor &&
      (family === 'brood' || family === 'gather' || family === 'reveal') &&
      frame.musicConfidence > 0.18 &&
      (frame.brightness > 0.14 || frame.harmonicColor > 0.5 || frame.momentum > 0.14) &&
      frame.releaseTail < 0.22;
    const adaptiveMusicEarnedFloor =
      !quietRoomMusicFloor &&
      (family === 'brood' || family === 'gather' || family === 'reveal') &&
      livingMusicFloor > 0.08 &&
      adaptiveEarnedFloor > 0.22 &&
      frame.releaseTail < 0.34 &&
      frame.dropImpact < 0.3;
    const peakEligible =
      (family === 'rupture' || family === 'reveal') &&
      cueState.attack >= 0.64 &&
      confidence >= 0.74 &&
      cueState.worldWeight >= 0.58 &&
      cueFamilySeconds < 1.4 &&
      frame.releaseTail < 0.3;
    const longPeakDecay =
      (family === 'rupture' || family === 'reveal') && cueFamilySeconds > 2.2;
    const longDwellWithhold = cueFamilySeconds > 4.6;
    const lowConfidenceAftermath =
      (!quietRoomEarnedFloor && !adaptiveMusicEarnedFloor && confidence < 0.34) ||
      (family === 'haunt' && frame.releaseTail > 0.48 && motionRecoveryAuthority < 0.28) ||
      family === 'haunt' ||
      family === 'reset';
    const persistentRupture = family === 'rupture' && cueFamilySeconds > 3.8;

    if (lowConfidenceAftermath || persistentRupture || longDwellWithhold) {
      return 'withheld';
    }

    if (peakEligible && !longPeakDecay) {
      return 'peak';
    }

    if (quietRoomEarnedFloor || adaptiveMusicEarnedFloor) {
      return 'earned';
    }

    return 'earned';
  };
  const matrixDrivenFamily =
    !ruptureLike &&
    matrixAuthority >= 0.38 &&
    (showAct === 'matrix-storm' ||
      frame.beatConfidence >= 0.58 ||
      cueState.eventDensity >= 0.42);
  const roamingLaneOrder: StageCuePlan['heroAnchorLane'][] = [
    'left',
    'right',
    'high',
    'low'
  ];
  const roamingLane =
    roamingLaneOrder[
      Math.floor(
        ((frame.barPhase * 1.8 +
          frame.phrasePhase * 0.9 +
          frame.harmonicColor * 0.7 +
          operatorBias.life * 0.3) %
          1) *
          roamingLaneOrder.length
      ) % roamingLaneOrder.length
    ]!;
  const lowEnergyRoam =
    quietRoomMusicFloor ||
    livingMusicFloor > 0.1 ||
    adaptiveEarnedFloor > 0.2;

  const resolveAnchorLane = (
    family: StageCuePlan['family']
  ): StageCuePlan['heroAnchorLane'] => {
      if (family === 'haunt') {
        return 'high';
      }
      if (family === 'reset') {
        return 'low';
      }
      if (family === 'rupture') {
        return 'center';
      }
      if (family === 'release') {
        return Math.abs(actAnchor.x) > 0.1
          ? actAnchor.x > 0
            ? 'right'
            : 'left'
          : lowEnergyRoam
            ? roamingLane
            : 'center';
      }
      if (family === 'gather') {
        if (actAnchor.x > 0.16) {
          return 'right';
        }
        if (actAnchor.x < -0.16) {
          return 'left';
        }
        if (lowEnergyRoam) {
          return roamingLane;
        }
      }
    if (family === 'reveal') {
      if (Math.abs(actAnchor.x) > 0.12) {
        return actAnchor.x > 0 ? 'right' : 'left';
      }
      return lowEnergyRoam ? roamingLane : 'high';
    }
    if (family === 'brood' && lowEnergyRoam) {
      return roamingLane;
    }

    return 'center';
  };

  const buildSpendTuning = (
    family: StageCuePlan['family']
  ): Pick<
    StageCuePlan,
    | 'spendProfile'
    | 'heroScaleMin'
    | 'heroScaleMax'
    | 'heroAnchorLane'
    | 'heroAnchorStrength'
    | 'exposureCeiling'
    | 'bloomCeiling'
    | 'ringAuthority'
    | 'washoutSuppression'
    > => {
    const spendProfile = resolveSpendProfile(family);
    const anchorLane = resolveAnchorLane(family);
    const spendDefaults = {
      withheld: {
        exposureCeiling: 0.8,
        bloomCeiling: 0.52,
        washoutSuppression: 0.74,
        heroAnchorStrength: 0.6,
        scaleBoost: -0.2
      },
      earned: {
        exposureCeiling: 0.88,
        bloomCeiling: 0.74,
        washoutSuppression: 0.5,
        heroAnchorStrength: 0.74,
        scaleBoost: 0
      },
      peak: {
        exposureCeiling: 0.94,
        bloomCeiling: 0.92,
        washoutSuppression: 0.28,
        heroAnchorStrength: 0.82,
        scaleBoost: 0.22
      }
    }[spendProfile];
    const familyBaseScales: Record<
      StageCuePlan['family'],
      { min: number; max: number; ringAuthority: StageCuePlan['ringAuthority'] }
    > = {
      brood: {
        min: 0.54,
        max: 1.08,
        ringAuthority: 'framing-architecture'
      },
      gather: {
        min: 0.5,
        max: 1.14,
        ringAuthority: 'framing-architecture'
      },
      reveal: {
        min: 0.48,
        max: 1.16,
        ringAuthority: 'framing-architecture'
      },
      rupture: {
        min: 0.4,
        max: 1.12,
        ringAuthority: 'event-platform'
      },
      release: {
        min: 0.34,
        max: 0.94,
        ringAuthority: 'framing-architecture'
      },
      haunt: {
        min: 0.24,
        max: 0.72,
        ringAuthority: 'framing-architecture'
      },
      reset: {
        min: 0.22,
        max: 0.62,
        ringAuthority: 'framing-architecture'
      }
    };
    const base = familyBaseScales[family];
    const scaleBoost = spendDefaults.scaleBoost;

    return {
      spendProfile,
      heroScaleMin: clamp01(base.min + scaleBoost * 0.5),
      heroScaleMax: Math.max(
        clamp01(base.min + scaleBoost * 0.5) + 0.06,
        base.max + scaleBoost
      ),
      heroAnchorLane: anchorLane,
      heroAnchorStrength: spendDefaults.heroAnchorStrength,
      exposureCeiling: spendDefaults.exposureCeiling,
      bloomCeiling: spendDefaults.bloomCeiling,
      ringAuthority: base.ringAuthority,
      washoutSuppression: spendDefaults.washoutSuppression
    };
  };

  const livingStageFloor =
    !ruptureLike &&
    !releaseLike &&
    !hauntLike &&
    (livingMusicFloor + operatorBias.neonStage * 0.18 + operatorBias.heroFloor * 0.12) > 0.12 &&
    frame.dropImpact < 0.28 &&
    frame.releaseTail < 0.28 &&
    (showAct === 'void-chamber' ||
      frame.showState === 'void' ||
      frame.showState === 'atmosphere' ||
      frame.showState === 'generative' ||
      frame.showState === 'cadence' ||
      gatherLike === 1);

  if (resetLike === 1) {
    return finalizePlan({
      family: 'reset',
      dominance: 'chamber',
      ...buildSpendTuning('reset'),
      worldMode: 'fan-sweep',
      compositorMode: 'wipe',
      residueMode: 'clear',
      transformIntent: 'clear',
      stageWeight: clamp01(0.46 + frame.sectionChange * 0.3),
      chamberWeight: clamp01(0.78 + cueState.worldWeight * 0.08),
      heroWeight: clamp01(0.28 + cueState.heroWeight * 0.1),
      worldWeight: clamp01(0.72 + cueState.worldWeight * 0.08),
      screenWeight: clamp01(0.3 + cueState.screenWeight * 0.14),
      residueWeight: 0.08,
      eventDensity: clamp01(0.24 + cueState.eventDensity * 0.24),
      subtractiveAmount: clamp01(0.2 + frame.sectionChange * 0.22),
      wipeAmount: clamp01(0.34 + cueState.screenWeight * 0.24),
      flashAmount: 0.04,
      heroScaleBias: -0.6,
      heroStageX: clampSigned(actAnchor.x * 0.32),
      heroStageY: clampSigned(-0.1 + actAnchor.y * 0.28),
      heroDepthBias: -0.22,
      heroMotionBias: 0.22,
      heroMorphBias: 0.2
    });
  }

  if (
    !ruptureLike &&
    showAct === 'matrix-storm' &&
    matrixAuthority >= 0.32 &&
    motionRecoveryAuthority > 0.34 &&
    frame.dropImpact < 0.24
  ) {
    const matrixReleaseWindow =
      frame.releaseTail > 0.14 &&
      (temporalWindows.phraseResolve > 0.24 ||
        temporalWindows.postBeatRelease > 0.2 ||
        frame.resonance > 0.2 ||
        frame.momentKind === 'release');
    if (matrixReleaseWindow) {
      return finalizePlan({
        family: 'release',
        dominance: frame.releaseTail > 0.24 ? 'world' : 'hybrid',
        ...buildSpendTuning('release'),
        worldMode: frame.releaseTail > 0.22 ? 'ghost-chamber' : 'field-bloom',
        compositorMode: 'afterimage',
        residueMode: 'afterglow',
        transformIntent: 'exhale',
        stageWeight: clamp01(0.3 + cueState.intensity * 0.12 + structuredRecoveryBias * 0.08),
        chamberWeight: clamp01(0.52 + cueState.worldWeight * 0.12 + frame.releaseTail * 0.08),
        heroWeight: clamp01(0.3 + cueState.heroWeight * 0.12),
        worldWeight: clamp01(0.62 + cueState.worldWeight * 0.12 + frame.releaseTail * 0.08),
        screenWeight: clamp01(0.22 + cueState.screenWeight * 0.1 + frame.releaseTail * 0.08),
        residueWeight: clamp01(0.22 + cueState.residueWeight * 0.18 + frame.releaseTail * 0.14),
        eventDensity: clamp01(0.14 + cueState.eventDensity * 0.1),
        subtractiveAmount: 0.08,
        wipeAmount: 0.04,
        flashAmount: 0.02,
        heroScaleBias: -0.12,
        heroStageX: clampSigned(actAnchor.x * 1.08 + (actAnchor.x >= 0 ? 0.08 : -0.08)),
        heroStageY: clampSigned(actAnchor.y * 0.64 + 0.06),
        heroDepthBias: -0.02,
        heroMotionBias: 0.64,
        heroMorphBias: 0.62
      });
    }
    return finalizePlan({
      family: 'brood',
      dominance: 'hybrid',
      ...buildSpendTuning('brood'),
      worldMode: frame.releaseTail > 0.12 ? 'field-bloom' : 'hold',
      compositorMode: 'none',
      residueMode: frame.releaseTail > 0.12 ? 'short' : 'none',
      transformIntent: 'hold',
      stageWeight: clamp01(0.28 + cueState.intensity * 0.12 + structuredRecoveryBias * 0.08),
      chamberWeight: clamp01(0.5 + cueState.worldWeight * 0.12 + structuredRecoveryBias * 0.06),
      heroWeight: clamp01(0.42 + cueState.heroWeight * 0.12),
      worldWeight: clamp01(0.58 + cueState.worldWeight * 0.1),
      screenWeight: clamp01(0.16 + cueState.screenWeight * 0.1),
      residueWeight: clamp01(0.08 + cueState.residueWeight * 0.1 + frame.releaseTail * 0.06),
      eventDensity: clamp01(0.14 + cueState.eventDensity * 0.08),
      subtractiveAmount: 0.04,
      wipeAmount: 0,
      flashAmount: 0,
      heroScaleBias: clampSigned(-0.1 + cueState.intensity * 0.04),
      heroStageX: clampSigned(actAnchor.x * 0.86 + (actAnchor.x >= 0 ? 0.06 : -0.06)),
      heroStageY: clampSigned(actAnchor.y * 0.52 - 0.02),
      heroDepthBias: 0.04,
      heroMotionBias: 0.54,
      heroMorphBias: 0.56
    });
  }

  if (ruptureLike === 1) {
    const ruptureSpendProfileBias = {
      withheld: {
        stageWeight: 0.64,
        chamberWeight: 0.92,
        heroWeight: 0.18,
        worldWeight: 0.94,
        screenWeight: 0.62,
        residueWeight: 0.42,
        eventDensity: 0.56,
        subtractiveAmount: 0.34,
        wipeAmount: 0.16,
        flashAmount: 0.24,
        heroScaleBias: -0.06,
        heroStageX: -0.02,
        heroStageY: 0.04,
        heroDepthBias: 0.18,
        heroMotionBias: 0.44,
        heroMorphBias: 0.56
      },
      earned: {
        stageWeight: 0.68,
        chamberWeight: 0.94,
        heroWeight: 0.2,
        worldWeight: 0.96,
        screenWeight: 0.66,
        residueWeight: 0.44,
        eventDensity: 0.62,
        subtractiveAmount: 0.3,
        wipeAmount: 0.14,
        flashAmount: 0.3,
        heroScaleBias: 0.14,
        heroStageX: 0.02,
        heroStageY: 0.06,
        heroDepthBias: 0.24,
        heroMotionBias: 0.52,
        heroMorphBias: 0.64
      },
      peak: {
        stageWeight: 0.72,
        chamberWeight: 0.96,
        heroWeight: 0.22,
        worldWeight: 0.98,
        screenWeight: 0.7,
        residueWeight: 0.48,
        eventDensity: 0.68,
        subtractiveAmount: 0.28,
        wipeAmount: 0.12,
        flashAmount: 0.34,
        heroScaleBias: 0.28,
        heroStageX: 0.06,
        heroStageY: 0.08,
        heroDepthBias: 0.3,
        heroMotionBias: 0.6,
        heroMorphBias: 0.7
      }
    }[resolveSpendProfile('rupture')];

    return finalizePlan({
      family: 'rupture',
      dominance: 'world',
      ...buildSpendTuning('rupture'),
      worldMode: 'collapse-well',
      compositorMode: 'flash',
      residueMode: 'scar',
      transformIntent: 'collapse',
      stageWeight: clamp01(
        ruptureSpendProfileBias.stageWeight + cueState.intensity * 0.04
      ),
      chamberWeight: clamp01(
        ruptureSpendProfileBias.chamberWeight + cueState.worldWeight * 0.04
      ),
      heroWeight: clamp01(
        ruptureSpendProfileBias.heroWeight + cueState.heroWeight * 0.06
      ),
      worldWeight: clamp01(
        ruptureSpendProfileBias.worldWeight + cueState.worldWeight * 0.02
      ),
      screenWeight: clamp01(
        ruptureSpendProfileBias.screenWeight + cueState.screenWeight * 0.08
      ),
      residueWeight: clamp01(
        ruptureSpendProfileBias.residueWeight + cueState.residueWeight * 0.16
      ),
      eventDensity: clamp01(
        ruptureSpendProfileBias.eventDensity + cueState.eventDensity * 0.1
      ),
      subtractiveAmount: clamp01(
        ruptureSpendProfileBias.subtractiveAmount + frame.dropImpact * 0.18
      ),
      wipeAmount: clamp01(
        ruptureSpendProfileBias.wipeAmount + frame.sectionChange * 0.08
      ),
      flashAmount: clamp01(
        ruptureSpendProfileBias.flashAmount + cueState.attack * 0.12
      ),
      heroScaleBias: clampSigned(
        ruptureSpendProfileBias.heroScaleBias + cueState.intensity * 0.18
      ),
      heroStageX: clampSigned(
        ruptureSpendProfileBias.heroStageX + cueState.attack * 0.06
      ),
      heroStageY: clampSigned(
        ruptureSpendProfileBias.heroStageY + cueState.intensity * 0.04
      ),
      heroDepthBias: clampSigned(
        ruptureSpendProfileBias.heroDepthBias + frame.dropImpact * 0.1
      ),
      heroMotionBias: clamp01(
        ruptureSpendProfileBias.heroMotionBias + cueState.eventDensity * 0.08
      ),
      heroMorphBias: clamp01(
        ruptureSpendProfileBias.heroMorphBias + cueState.attack * 0.08
      )
    });
  }

  if (releaseLike === 1 && (!hauntLike || releaseDominatesHaunt)) {
    return finalizePlan({
      family: 'release',
      dominance: 'hybrid',
      ...buildSpendTuning('release'),
      worldMode: 'field-bloom',
      compositorMode: 'afterimage',
      residueMode: 'afterglow',
      transformIntent: 'exhale',
      stageWeight: clamp01(0.42 + cueState.intensity * 0.16),
      chamberWeight: clamp01(0.64 + cueState.worldWeight * 0.14),
      heroWeight: clamp01(0.34 + cueState.heroWeight * 0.18),
      worldWeight: clamp01(0.66 + cueState.worldWeight * 0.14),
      screenWeight: clamp01(0.22 + cueState.screenWeight * 0.12),
      residueWeight: clamp01(0.38 + cueState.residueWeight * 0.26),
      eventDensity: clamp01(0.18 + cueState.eventDensity * 0.16),
      subtractiveAmount: 0.08,
      wipeAmount: 0.04,
      flashAmount: 0.06,
      heroScaleBias: 0.2,
      heroStageX: clampSigned(actAnchor.x * 0.92 + 0.04),
      heroStageY: clampSigned(actAnchor.y * 0.56 + 0.08),
      heroDepthBias: 0.16,
      heroMotionBias: 0.58,
      heroMorphBias: 0.58
    });
  }

  if (hauntLike === 1) {
    return finalizePlan({
      family: 'haunt',
      dominance: 'chamber',
      ...buildSpendTuning('haunt'),
      worldMode: 'ghost-chamber',
      compositorMode: 'scar',
      residueMode: 'ghost',
      transformIntent: 'hold',
      stageWeight: clamp01(0.54 + cueState.intensity * 0.18),
      chamberWeight: clamp01(0.8 + cueState.worldWeight * 0.1),
      heroWeight: clamp01(0.18 + cueState.heroWeight * 0.18),
      worldWeight: clamp01(0.76 + cueState.worldWeight * 0.12),
      screenWeight: clamp01(0.34 + cueState.screenWeight * 0.12),
      residueWeight: clamp01(0.68 + cueState.residueWeight * 0.22),
      eventDensity: clamp01(0.22 + cueState.eventDensity * 0.14),
      subtractiveAmount: clamp01(0.18 + frame.releaseTail * 0.16),
      wipeAmount: 0.06,
      flashAmount: 0.02,
      heroScaleBias: -0.5,
      heroStageX: clampSigned(actAnchor.x * 1.08 - 0.2),
      heroStageY: clampSigned(0.2 + actAnchor.y * 0.76),
      heroDepthBias: -0.4,
      heroMotionBias: 0.46,
      heroMorphBias: 0.82
    });
  }

  if (quietRoomMusicFloor) {
    const roomReveal =
      frame.momentum > 0.14 ||
      frame.beatConfidence > 0.08 ||
      frame.sectionChange > 0.08 ||
      (frame.musicConfidence > 0.19 && quietRoomColorLift > 0.16) ||
      quietRoomColorLift > 0.22;

    if (roomReveal) {
      return finalizePlan({
        family: 'reveal',
        dominance: 'chamber',
        ...buildSpendTuning('reveal'),
        worldMode: 'fan-sweep',
        compositorMode: 'wipe',
        residueMode: 'short',
        transformIntent: 'open',
        stageWeight: clamp01(0.58 + cueState.intensity * 0.16 + quietRoomColorLift * 0.14),
        chamberWeight: clamp01(0.76 + cueState.worldWeight * 0.12),
        heroWeight: clamp01(0.48 + cueState.heroWeight * 0.14),
        worldWeight: clamp01(0.74 + cueState.worldWeight * 0.1),
        screenWeight: clamp01(0.34 + cueState.screenWeight * 0.12 + quietRoomColorLift * 0.1),
        residueWeight: clamp01(0.14 + cueState.residueWeight * 0.1),
        eventDensity: clamp01(0.36 + cueState.eventDensity * 0.14),
        subtractiveAmount: 0.06,
        wipeAmount: 0.22,
        flashAmount: 0.04,
        heroScaleBias: 0.42,
        heroStageX: clampSigned(actAnchor.x * 1.04 + 0.12),
        heroStageY: clampSigned(actAnchor.y * 0.66 + 0.1),
        heroDepthBias: 0.36,
        heroMotionBias: 0.76,
        heroMorphBias: 0.64
      });
    }

    return finalizePlan({
      family: 'gather',
      dominance: 'chamber',
      ...buildSpendTuning('gather'),
      worldMode: 'aperture-cage',
      compositorMode: 'precharge',
      residueMode: 'short',
      transformIntent: 'compress',
      stageWeight: clamp01(0.5 + cueState.intensity * 0.14 + quietRoomColorLift * 0.1),
      chamberWeight: clamp01(0.74 + cueState.worldWeight * 0.12),
      heroWeight: clamp01(0.5 + cueState.heroWeight * 0.14),
      worldWeight: clamp01(0.7 + cueState.worldWeight * 0.1),
      screenWeight: clamp01(0.28 + cueState.screenWeight * 0.1 + quietRoomColorLift * 0.08),
      residueWeight: 0.08,
      eventDensity: clamp01(0.3 + cueState.eventDensity * 0.16),
      subtractiveAmount: 0.08,
      wipeAmount: 0.12,
      flashAmount: 0.02,
      heroScaleBias: 0.3,
      heroStageX: clampSigned(actAnchor.x * 1.08 + 0.08),
      heroStageY: clampSigned(actAnchor.y * 0.72 + 0.06),
      heroDepthBias: 0.28,
      heroMotionBias: 0.7,
      heroMorphBias: 0.64
    });
  }

  if (livingStageFloor) {
    const matrixLivingReveal = showAct === 'matrix-storm';
    const matrixAmbientFloat =
      matrixLivingReveal &&
      frame.dropImpact < 0.22 &&
      frame.sectionChange < 0.14 &&
      frame.beatConfidence < 0.44 &&
      (frame.releaseTail > 0.16 ||
        frame.resonance > 0.2 ||
        frame.showState === 'atmosphere' ||
        cueFamilySeconds > 2.6);
    const matrixLivingWorldMode =
      frame.sectionChange > 0.18 || cueState.attack > 0.48
        ? 'cathedral-rise'
        : matrixAmbientFloat && frame.releaseTail > 0.16
          ? 'ghost-chamber'
          : matrixAmbientFloat
            ? 'fan-sweep'
            : 'field-bloom';
    const livingReveal =
      matrixLivingReveal
        ? frame.sectionChange > 0.18 ||
          (frame.beatConfidence > 0.38 && frame.momentum > 0.28) ||
          livingNeonLift > 0.34
        : frame.beatConfidence > 0.22 ||
          frame.sectionChange > 0.12 ||
          frame.momentum > 0.22 ||
          livingNeonLift > 0.22;

    if (matrixAmbientFloat && frame.releaseTail > 0.18) {
      const matrixFloatFamily =
        cueFamilySeconds > 3.2 ? 'haunt' : 'release';
      return finalizePlan({
        family: matrixFloatFamily,
        dominance: cueFamilySeconds > 3.2 ? 'world' : 'hybrid',
        ...buildSpendTuning(matrixFloatFamily),
        worldMode: 'ghost-chamber',
        compositorMode: 'afterimage',
        residueMode: cueFamilySeconds > 3.2 ? 'ghost' : 'afterglow',
        transformIntent: cueFamilySeconds > 3.2 ? 'exhale' : 'hold',
        stageWeight: clamp01(0.4 + cueState.intensity * 0.12 + livingNeonLift * 0.08),
        chamberWeight: clamp01(0.68 + cueState.worldWeight * 0.1 + frame.resonance * 0.08),
        heroWeight: clamp01(0.28 + cueState.heroWeight * 0.1),
        worldWeight: clamp01(0.76 + cueState.worldWeight * 0.12 + frame.releaseTail * 0.08),
        screenWeight: clamp01(0.34 + cueState.screenWeight * 0.14 + frame.releaseTail * 0.08),
        residueWeight: clamp01(0.34 + cueState.residueWeight * 0.18 + frame.releaseTail * 0.12),
        eventDensity: clamp01(0.16 + cueState.eventDensity * 0.08),
        subtractiveAmount: 0.1,
        wipeAmount: 0.08,
        flashAmount: 0.02,
        heroScaleBias: -0.2,
        heroStageX: clampSigned(actAnchor.x * 1.2 + (actAnchor.x >= 0 ? 0.12 : -0.12)),
        heroStageY: clampSigned(actAnchor.y * 0.78 + 0.08),
        heroDepthBias: -0.08,
        heroMotionBias: 0.66,
        heroMorphBias: 0.54
      });
    }

    if (matrixAmbientFloat && cueFamilySeconds > 1.6) {
      return finalizePlan({
        family: 'brood',
        dominance: 'chamber',
        ...buildSpendTuning('brood'),
        worldMode: matrixLivingWorldMode,
        compositorMode: 'afterimage',
        residueMode: 'afterglow',
        transformIntent: 'hold',
        stageWeight: clamp01(0.42 + cueState.intensity * 0.1 + livingNeonLift * 0.1),
        chamberWeight: clamp01(0.72 + cueState.worldWeight * 0.12),
        heroWeight: clamp01(0.28 + cueState.heroWeight * 0.08),
        worldWeight: clamp01(0.7 + cueState.worldWeight * 0.12),
        screenWeight: clamp01(0.24 + cueState.screenWeight * 0.1 + frame.releaseTail * 0.06),
        residueWeight: clamp01(0.18 + cueState.residueWeight * 0.14 + frame.releaseTail * 0.08),
        eventDensity: clamp01(0.18 + cueState.eventDensity * 0.08),
        subtractiveAmount: 0.08,
        wipeAmount: 0.06,
        flashAmount: 0.01,
        heroScaleBias: -0.18,
        heroStageX: clampSigned(actAnchor.x * 1.3 + (actAnchor.x >= 0 ? 0.14 : -0.14)),
        heroStageY: clampSigned(actAnchor.y * 0.86 + 0.06),
        heroDepthBias: -0.06,
        heroMotionBias: 0.72,
        heroMorphBias: 0.56
      });
    }

    if (livingReveal) {
      return finalizePlan({
        family: 'reveal',
        dominance: matrixLivingReveal ? 'hybrid' : 'chamber',
        ...buildSpendTuning('reveal'),
        worldMode: matrixLivingReveal ? matrixLivingWorldMode : 'cathedral-rise',
        compositorMode: 'wipe',
        residueMode: 'short',
        transformIntent: 'open',
        stageWeight: clamp01(
          (matrixLivingReveal ? 0.5 : 0.58) +
            cueState.intensity * 0.16 +
            livingNeonLift * 0.16
        ),
        chamberWeight: clamp01(
          (matrixLivingReveal ? 0.66 : 0.76) + cueState.worldWeight * 0.12
        ),
        heroWeight: clamp01(
          (matrixLivingReveal ? 0.34 : 0.5) + cueState.heroWeight * 0.14
        ),
        worldWeight: clamp01(
          (matrixLivingReveal ? 0.6 : 0.74) + cueState.worldWeight * 0.1
        ),
        screenWeight: clamp01(
          (matrixLivingReveal ? 0.26 : 0.36) +
            cueState.screenWeight * 0.14 +
            livingNeonLift * 0.12
        ),
        residueWeight: clamp01(0.12 + cueState.residueWeight * 0.1),
        eventDensity: clamp01(
          (matrixLivingReveal ? 0.28 : 0.34) + cueState.eventDensity * 0.18
        ),
        subtractiveAmount: matrixLivingReveal ? 0.1 : 0.08,
        wipeAmount: matrixLivingReveal ? 0.16 : 0.22,
        flashAmount: 0.05,
        heroScaleBias: matrixLivingReveal ? -0.12 : 0.34,
        heroStageX: clampSigned(
          actAnchor.x * (matrixLivingReveal ? 1.28 : 1.14) +
            (matrixLivingReveal
              ? actAnchor.x >= 0
                ? 0.16
                : -0.16
              : 0.08)
        ),
        heroStageY: clampSigned(
          actAnchor.y * (matrixLivingReveal ? 0.9 : 0.8) +
            (matrixLivingReveal ? 0.1 : 0.1)
        ),
        heroDepthBias: matrixLivingReveal ? -0.04 : 0.36,
        heroMotionBias: matrixLivingReveal ? 0.78 : 0.76,
        heroMorphBias: matrixLivingReveal ? 0.6 : 0.68
      });
    }

    return finalizePlan({
      family: 'gather',
      dominance: 'chamber',
      ...buildSpendTuning('gather'),
      worldMode: 'aperture-cage',
      compositorMode: 'precharge',
      residueMode: 'short',
      transformIntent: 'compress',
      stageWeight: clamp01(0.54 + cueState.intensity * 0.16 + livingNeonLift * 0.12),
      chamberWeight: clamp01(0.72 + cueState.worldWeight * 0.12),
      heroWeight: clamp01(0.42 + cueState.heroWeight * 0.14),
      worldWeight: clamp01(0.68 + cueState.worldWeight * 0.1),
      screenWeight: clamp01(0.28 + cueState.screenWeight * 0.12 + livingNeonLift * 0.1),
      residueWeight: 0.1,
      eventDensity: clamp01(0.3 + cueState.eventDensity * 0.16),
      subtractiveAmount: 0.12,
      wipeAmount: 0.1,
      flashAmount: 0.03,
      heroScaleBias: 0.08,
      heroStageX: clampSigned(actAnchor.x * 1.12 + 0.08),
      heroStageY: clampSigned(actAnchor.y * 0.82 + 0.06),
      heroDepthBias: 0.24,
      heroMotionBias: 0.72,
      heroMorphBias: 0.7
    });
  }

  if (matrixDrivenFamily) {
    const matrixStructuredRelease =
      frame.releaseTail > 0.14 &&
      (temporalWindows.phraseResolve > 0.22 ||
        temporalWindows.postBeatRelease > 0.18 ||
        frame.resonance > 0.18);
    const matrixTargetsReveal =
      frame.dropImpact < 0.3 &&
      (frame.sectionChange > 0.22 ||
        (frame.beatConfidence >= frame.preDropTension + 0.18 &&
          frame.momentum > 0.28) ||
        (frame.beatConfidence >= 0.86 && frame.momentum > 0.32));
    const matrixBroodRecovery =
      !matrixStructuredRelease &&
      structuredRecoveryBias > 0.3 &&
      frame.beatConfidence < 0.56 &&
      frame.dropImpact < 0.22;
    const matrixFamily: 'brood' | 'gather' | 'reveal' | 'release' = matrixStructuredRelease
      ? 'release'
      : matrixTargetsReveal
        ? 'reveal'
        : matrixBroodRecovery
          ? 'brood'
          : 'gather';
    const matrixRevealWorldMode =
      frame.sectionChange > 0.18 || cueState.attack > 0.44
        ? 'cathedral-rise'
        : frame.releaseTail > 0.12
          ? 'fan-sweep'
          : 'field-bloom';
    return finalizePlan({
      family: matrixFamily,
      dominance:
        matrixFamily === 'release'
          ? 'hybrid'
          : matrixFamily === 'brood'
            ? 'hero'
            : 'hybrid',
      ...buildSpendTuning(matrixFamily),
      worldMode:
        matrixFamily === 'reveal'
          ? matrixRevealWorldMode
          : matrixFamily === 'release'
            ? frame.releaseTail > 0.22
              ? 'ghost-chamber'
              : 'field-bloom'
            : matrixFamily === 'brood'
              ? 'field-bloom'
              : frame.releaseTail > 0.1
                ? 'fan-sweep'
                : 'aperture-cage',
      compositorMode:
        matrixFamily === 'reveal'
          ? 'wipe'
          : matrixFamily === 'release'
            ? 'afterimage'
            : matrixFamily === 'brood'
              ? 'none'
              : 'precharge',
      residueMode:
        matrixFamily === 'release'
          ? 'afterglow'
          : matrixFamily === 'brood'
            ? 'none'
            : 'short',
      transformIntent:
        matrixFamily === 'reveal'
          ? 'open'
          : matrixFamily === 'release'
            ? 'exhale'
            : matrixFamily === 'brood'
              ? 'hold'
              : 'compress',
      stageWeight: clamp01(
        (matrixFamily === 'release'
          ? 0.34
          : matrixFamily === 'reveal'
            ? 0.42
            : matrixFamily === 'brood'
              ? 0.32
              : 0.46) + cueState.intensity * 0.14
      ),
      chamberWeight: clamp01(
        (matrixFamily === 'release'
          ? 0.58
          : matrixFamily === 'reveal'
            ? 0.6
            : matrixFamily === 'brood'
              ? 0.52
              : 0.66) + cueState.worldWeight * 0.12
      ),
      heroWeight: clamp01(
        (matrixFamily === 'release'
          ? 0.3
          : matrixFamily === 'reveal'
            ? 0.34
            : matrixFamily === 'brood'
              ? 0.46
              : 0.38) + cueState.heroWeight * 0.16
      ),
      worldWeight: clamp01(
        (matrixFamily === 'release'
          ? 0.62
          : matrixFamily === 'reveal'
            ? 0.56
            : matrixFamily === 'brood'
              ? 0.58
              : 0.62) + cueState.worldWeight * 0.1
      ),
      screenWeight: clamp01(
        (matrixFamily === 'release'
          ? 0.22
          : matrixFamily === 'reveal'
            ? 0.24
            : matrixFamily === 'brood'
              ? 0.12
              : 0.18) + cueState.screenWeight * 0.12
      ),
      residueWeight: clamp01(
        (matrixFamily === 'release'
          ? 0.24
          : matrixFamily === 'reveal'
            ? 0.16
            : matrixFamily === 'brood'
              ? 0.08
              : 0.1) + cueState.residueWeight * 0.12
      ),
      eventDensity: clamp01(0.34 + cueState.eventDensity * 0.18),
      subtractiveAmount:
        matrixFamily === 'release'
          ? 0.08
          : clamp01(0.1 + frame.preDropTension * 0.14),
      wipeAmount:
        matrixFamily === 'reveal'
          ? 0.14
          : matrixFamily === 'release'
            ? 0.04
            : 0.08,
      flashAmount: matrixFamily === 'release' ? 0.02 : 0.06,
      heroScaleBias:
        matrixFamily === 'release'
          ? -0.16
          : matrixFamily === 'reveal'
            ? -0.18
            : matrixFamily === 'brood'
              ? -0.12
              : -0.06,
      heroStageX: clampSigned(
        actAnchor.x *
          (matrixFamily === 'reveal'
            ? 1.2
            : matrixFamily === 'release'
              ? 1.08
              : matrixFamily === 'brood'
                ? 0.88
                : 0.94) +
          (matrixFamily === 'reveal'
            ? actAnchor.x >= 0
              ? 0.16
              : -0.16
            : matrixFamily === 'release'
              ? actAnchor.x >= 0
                ? 0.1
                : -0.1
              : -0.08)
      ),
      heroStageY: clampSigned(
        actAnchor.y *
          (matrixFamily === 'reveal'
            ? 0.84
            : matrixFamily === 'release'
              ? 0.72
              : 0.74) +
          (matrixFamily === 'reveal' ? 0.12 : matrixFamily === 'release' ? 0.08 : 0)
      ),
      heroDepthBias:
        matrixFamily === 'release'
          ? -0.08
          : matrixFamily === 'reveal'
            ? -0.22
            : -0.16,
      heroMotionBias:
        matrixFamily === 'release'
          ? 0.66
          : matrixFamily === 'reveal'
            ? 0.74
            : matrixFamily === 'brood'
              ? 0.58
              : 0.6,
      heroMorphBias:
        matrixFamily === 'release'
          ? 0.58
          : matrixFamily === 'reveal'
            ? 0.6
            : matrixFamily === 'brood'
              ? 0.54
              : 0.68
    });
  }

  if (revealLike === 1) {
    const laserReveal = showAct === 'laser-bloom';
    const matrixReveal = showAct === 'matrix-storm';
    const matrixRevealWorldMode =
      frame.sectionChange > 0.18 || cueState.attack > 0.44
        ? 'cathedral-rise'
        : frame.releaseTail > 0.12
          ? 'fan-sweep'
          : frame.resonance > 0.18
            ? 'ghost-chamber'
            : 'field-bloom';
    return finalizePlan({
      family: 'reveal',
      dominance: matrixReveal ? 'hybrid' : 'chamber',
      ...buildSpendTuning('reveal'),
      worldMode: matrixReveal ? matrixRevealWorldMode : laserReveal ? 'fan-sweep' : 'cathedral-rise',
      compositorMode: 'wipe',
      residueMode: 'short',
      transformIntent: 'open',
      stageWeight: clamp01(
        (laserReveal ? 0.6 : matrixReveal ? 0.48 : 0.52) +
          cueState.intensity * 0.18 +
          livingNeonLift * 0.08
      ),
      chamberWeight: clamp01(
        (laserReveal ? 0.88 : matrixReveal ? 0.58 : 0.74) +
          cueState.worldWeight * 0.14 +
          livingNeonLift * 0.08
      ),
      heroWeight: clamp01(
        (laserReveal ? 0.22 : matrixReveal ? 0.3 : 0.36) +
          cueState.heroWeight * (laserReveal ? 0.08 : 0.18)
      ),
      worldWeight: clamp01(
        (laserReveal ? 0.86 : matrixReveal ? 0.52 : 0.72) +
          cueState.worldWeight * 0.12 +
          operatorBias.worldBoot * 0.1
      ),
      screenWeight: clamp01(
        (laserReveal ? 0.42 : matrixReveal ? 0.24 : 0.36) +
          cueState.screenWeight * 0.18 +
          livingNeonLift * 0.08
      ),
      residueWeight: clamp01(0.14 + cueState.residueWeight * 0.18),
      eventDensity: clamp01(0.38 + cueState.eventDensity * 0.2),
      subtractiveAmount: clamp01(0.12 + frame.preDropTension * 0.14),
      wipeAmount: clamp01(
        (matrixReveal ? 0.18 : 0.28) + cueState.screenWeight * 0.22
      ),
      flashAmount: 0.08,
      heroScaleBias: clampSigned(
        (laserReveal ? 0.18 : matrixReveal ? -0.08 : 0.62) +
          cueState.intensity * (laserReveal ? 0.08 : matrixReveal ? 0.1 : 0.16)
      ),
      heroStageX: clampSigned(
        actAnchor.x * (laserReveal ? 0.94 : matrixReveal ? 1.22 : 1.32) +
          (matrixReveal
            ? actAnchor.x >= 0
              ? 0.18
              : -0.18
            : 0.08)
      ),
      heroStageY: clampSigned(
        actAnchor.y * (laserReveal ? 0.72 : matrixReveal ? 0.9 : 0.92) + 0.08
      ),
      heroDepthBias: laserReveal ? 0.12 : matrixReveal ? -0.02 : 0.48,
      heroMotionBias: laserReveal ? 0.64 : matrixReveal ? 0.76 : 0.78,
      heroMorphBias: matrixReveal ? 0.64 : 0.7
    });
  }

  if (gatherLike === 1) {
    const matrixGather = showAct === 'matrix-storm';
    return finalizePlan({
      family: 'gather',
      dominance: matrixGather ? 'hybrid' : 'chamber',
      ...buildSpendTuning('gather'),
      worldMode:
        matrixGather && frame.releaseTail > 0.12
          ? 'field-bloom'
          : matrixGather && frame.sectionChange < 0.16
            ? 'fan-sweep'
            : 'aperture-cage',
      compositorMode: 'precharge',
      residueMode: 'short',
      transformIntent: 'compress',
      stageWeight: clamp01(0.4 + cueState.intensity * 0.16),
      chamberWeight: clamp01(0.72 + cueState.worldWeight * 0.14),
      heroWeight: clamp01((matrixGather ? 0.38 : 0.34) + cueState.heroWeight * 0.18),
      worldWeight: clamp01((matrixGather ? 0.6 : 0.64) + cueState.worldWeight * 0.12),
      screenWeight: clamp01((matrixGather ? 0.18 : 0.14) + cueState.screenWeight * 0.12),
      residueWeight: 0.1,
      eventDensity: clamp01(0.28 + cueState.eventDensity * 0.18),
      subtractiveAmount: clamp01(0.16 + frame.preDropTension * 0.22),
      wipeAmount: 0.08,
      flashAmount: 0.04,
      heroScaleBias: matrixGather ? -0.02 : 0.04,
      heroStageX: clampSigned(actAnchor.x * (matrixGather ? 1.22 : 1.14) + 0.08),
      heroStageY: clampSigned(actAnchor.y * (matrixGather ? 0.94 : 0.88) + 0.04),
      heroDepthBias: matrixGather ? 0.08 : 0.18,
      heroMotionBias: matrixGather ? 0.8 : 0.72,
      heroMorphBias: 0.72
    });
  }

  return finalizePlan({
    family: 'brood',
    dominance: lowEnergyRoam ? 'chamber' : 'hybrid',
    ...buildSpendTuning('brood'),
    worldMode:
      lowEnergyRoam || cueState.worldWeight > 0.56 || operatorBias.worldBoot > 0.16
        ? 'field-bloom'
        : 'hold',
    compositorMode: lowEnergyRoam ? 'precharge' : 'none',
    residueMode: 'none',
    transformIntent: 'hold',
    stageWeight: clamp01(0.44 + cueState.intensity * 0.14 + adaptiveEarnedFloor * 0.16),
    chamberWeight: clamp01(0.64 + cueState.worldWeight * 0.14 + operatorBias.worldBoot * 0.18),
    heroWeight: clamp01(0.54 + cueState.heroWeight * 0.08),
    worldWeight: clamp01(0.72 + cueState.worldWeight * 0.12 + operatorBias.worldBoot * 0.16),
    screenWeight: clamp01(0.18 + cueState.screenWeight * 0.08 + operatorBias.neonStage * 0.12),
    residueWeight: clamp01(0.04 + cueState.residueWeight * 0.06),
    eventDensity: clamp01(0.18 + cueState.eventDensity * 0.14),
    subtractiveAmount: 0.08,
    wipeAmount: lowEnergyRoam ? 0.04 : 0,
    flashAmount: 0.02,
    heroScaleBias: 0.06,
    heroStageX: clampSigned(actAnchor.x * 1.04 + (lowEnergyRoam ? 0.14 : 0.08)),
    heroStageY: clampSigned(actAnchor.y * 0.68 + 0.02),
    heroDepthBias: 0.14,
    heroMotionBias: 0.64,
    heroMorphBias: 0.58
  });
}
