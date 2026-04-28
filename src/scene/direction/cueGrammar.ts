import type { ListeningFrame } from '../../types/audio';
import type {
  CueClass,
  HeroAuthorityState,
  PerformanceRegime,
  PhraseConfidence,
  PostSpendIntent,
  SectionIntent,
  SilenceState,
  StageCompositorMode,
  StageCueDominance,
  StageCueFamily,
  StageIntent,
  StageResidueMode,
  StageScreenEffectFamily,
  WorldAuthorityState
} from '../../types/visual';

type CueGrammarInput = {
  frame: ListeningFrame;
  activeAct: string;
  cueFamily: StageCueFamily;
  cueDominance: StageCueDominance;
  compositorMode: StageCompositorMode;
  residueMode: StageResidueMode;
  screenEffectFamily: StageScreenEffectFamily;
  worldWeight: number;
  heroWeight: number;
  shotClass?: string;
  transformIntent?: string;
  worldMode?: string;
};

export function derivePhraseConfidence(frame: ListeningFrame): PhraseConfidence {
  const confidence =
    frame.tonalStability * 0.34 +
    frame.musicConfidence * 0.24 +
    frame.beatStability * 0.18 +
    (1 - frame.roughness) * 0.12 +
    frame.momentum * 0.12;

  if (confidence >= 0.74) {
    return 'locked';
  }

  if (confidence >= 0.56) {
    return 'confident';
  }

  if (confidence >= 0.32) {
    return 'forming';
  }

  return 'uncertain';
}

export function deriveSilenceState(frame: ListeningFrame): SilenceState {
  if (frame.musicConfidence < 0.12 && frame.roomness < 0.16) {
    return 'beauty';
  }

  if (frame.musicConfidence < 0.2 && frame.roomness >= 0.16) {
    return 'room-floor';
  }

  if (frame.preDropTension >= 0.42 && frame.dropImpact < 0.18) {
    return 'suspense';
  }

  return 'none';
}

export function derivePerformanceRegime(frame: ListeningFrame): PerformanceRegime {
  const silenceState = deriveSilenceState(frame);
  if (silenceState === 'beauty') {
    return 'silence-beauty';
  }

  if (silenceState === 'room-floor') {
    return 'room-floor';
  }

  if (silenceState === 'suspense') {
    return 'suspense';
  }

  if (frame.showState === 'surge' || frame.performanceIntent === 'detonate') {
    return 'surge';
  }

  if (frame.showState === 'aftermath' || frame.releaseTail >= 0.34) {
    return 'aftermath';
  }

  if (
    frame.performanceIntent === 'ignite' ||
    frame.beatConfidence >= 0.46 ||
    frame.momentum >= 0.44
  ) {
    return 'driving';
  }

  return 'gathering';
}

export function deriveSectionIntent(frame: ListeningFrame): SectionIntent {
  if (
    frame.dropImpact >= 0.42 ||
    (frame.momentKind === 'strike' && frame.performanceIntent === 'detonate')
  ) {
    return 'drop';
  }

  if (frame.releaseTail >= 0.34 || frame.momentKind === 'release') {
    return 'release';
  }

  if (frame.sectionChange >= 0.3) {
    return 'turn';
  }

  if (frame.showState === 'aftermath') {
    return 'recovery';
  }

  return 'hold';
}

export function deriveCanonicalCueClass(input: CueGrammarInput): CueClass {
  if (
    input.cueFamily === 'brood' &&
    input.transformIntent === 'compress' &&
    input.heroWeight >= input.worldWeight
  ) {
    return 'tighten';
  }

  if (input.cueFamily === 'brood') {
    return 'hold';
  }

  if (input.cueFamily === 'gather') {
    return 'gather';
  }

  if (input.cueFamily === 'reveal' && input.worldMode === 'fan-sweep') {
    return 'fan-sweep';
  }

  if (input.cueFamily === 'reveal' && input.activeAct === 'laser-bloom') {
    return 'laser-burst';
  }

  if (input.cueFamily === 'reveal' && input.cueDominance !== 'hero') {
    return 'orbit-widen';
  }

  if (input.cueFamily === 'reveal') {
    return 'reveal';
  }

  if (
    input.cueFamily === 'rupture' &&
    (input.transformIntent === 'collapse' || input.worldMode === 'collapse-well')
  ) {
    return 'collapse';
  }

  if (input.cueFamily === 'rupture') {
    return 'rupture';
  }

  if (input.cueFamily === 'haunt') {
    return 'haunt';
  }

  if (
    input.cueFamily === 'release' &&
    (input.residueMode === 'afterglow' ||
      input.residueMode === 'ghost' ||
      input.screenEffectFamily === 'impact-memory')
  ) {
    return 'residue';
  }

  if (input.cueFamily === 'release' || input.cueFamily === 'reset') {
    return 'recovery';
  }

  return 'hold';
}

export function deriveWorldAuthorityState(input: CueGrammarInput): WorldAuthorityState {
  if (input.cueDominance === 'world' || input.shotClass === 'worldTakeover') {
    return 'dominant';
  }

  if (input.worldWeight >= 0.52) {
    return 'shared';
  }

  if (input.worldWeight >= 0.28) {
    return 'support';
  }

  return 'background';
}

export function deriveHeroAuthorityState(input: CueGrammarInput): HeroAuthorityState {
  if (input.heroWeight <= 0.12) {
    return 'subtracted';
  }

  if (input.cueDominance === 'hero') {
    return 'dominant';
  }

  if (input.heroWeight >= 0.5) {
    return 'shared';
  }

  return 'support';
}

export function derivePostSpendIntent(input: CueGrammarInput): PostSpendIntent {
  if (
    input.compositorMode === 'wipe' ||
    input.compositorMode === 'cut' ||
    input.screenEffectFamily === 'wipe'
  ) {
    return 'wipe';
  }

  if (
    input.compositorMode === 'scar' ||
    input.residueMode === 'scar' ||
    input.screenEffectFamily === 'carve'
  ) {
    return 'burn';
  }

  if (
    input.compositorMode === 'flash' ||
    input.screenEffectFamily === 'impact-memory'
  ) {
    return 'stress';
  }

  if (
    input.residueMode === 'afterglow' ||
    input.residueMode === 'ghost' ||
    input.compositorMode === 'afterimage'
  ) {
    return 'memory';
  }

  if (input.residueMode === 'short' || input.screenEffectFamily === 'stain') {
    return 'trace';
  }

  return 'withhold';
}

export function deriveStageIntent(input: CueGrammarInput): StageIntent {
  const postSpendIntent = derivePostSpendIntent(input);
  const canonicalCueClass = deriveCanonicalCueClass(input);

  if (input.cueDominance === 'world' || input.shotClass === 'worldTakeover') {
    return 'world-takeover';
  }

  if (postSpendIntent === 'memory' || canonicalCueClass === 'residue') {
    return 'residue-memory';
  }

  if (canonicalCueClass === 'recovery' || canonicalCueClass === 'hold') {
    return 'recovery-hold';
  }

  if (input.cueDominance === 'hero') {
    return 'hero-pressure';
  }

  if (input.cueDominance === 'chamber') {
    return 'chamber-pressure';
  }

  return 'hybrid';
}
