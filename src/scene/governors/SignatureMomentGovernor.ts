import * as THREE from 'three';
import type { ListeningFrame } from '../../types/audio';
import type {
  AuthorityFrameSnapshot,
  ResolvedSignatureMomentStyle,
  SignatureMomentCandidateScores,
  SignatureMomentDecisionTrace,
  SignatureMomentDevOverride,
  SignatureMomentDistinctnessHint,
  SignatureMomentKind,
  SignatureMomentPhase,
  SignatureMomentPreviewProfile,
  SignatureMomentSnapshot,
  SignatureMomentStyle,
  SignatureMomentSuppressionReason,
  StageCompositionPlan,
  StageCuePlan
} from '../../types/visual';
import { DEFAULT_SIGNATURE_MOMENT_SNAPSHOT } from '../../types/visual';

type MomentKind = Exclude<SignatureMomentKind, 'none'>;

export type SignatureMomentGovernorInput = {
  frame: ListeningFrame;
  elapsedSeconds: number;
  deltaSeconds: number;
  stageCuePlan: StageCuePlan;
  stageCompositionPlan: StageCompositionPlan;
  authority: AuthorityFrameSnapshot;
  qualityTier: 'safe' | 'balanced' | 'premium';
  devOverride?: SignatureMomentDevOverride | null;
};

type ActiveSignatureMoment = {
  kind: MomentKind;
  style: ResolvedSignatureMomentStyle;
  requestedStyle: ResolvedSignatureMomentStyle;
  startedAtSeconds: number;
  seed: number;
  sourceScore: number;
  rarityBudget: number;
  forcedPreview: boolean;
};

type ArmedSignatureCandidate = {
  kind: MomentKind;
  style: ResolvedSignatureMomentStyle;
  armedAtSeconds: number;
  seed: number;
  sourceScore: number;
  suppressionReason: SignatureMomentSuppressionReason;
};

type SignatureCandidate = {
  kind: MomentKind;
  score: number;
  suppressionReason: SignatureMomentSuppressionReason;
};

const MOMENT_KINDS: MomentKind[] = [
  'collapse-scar',
  'cathedral-open',
  'ghost-residue',
  'silence-constellation'
];

const MOMENT_DURATIONS: Record<MomentKind, number> = {
  'collapse-scar': 4.2,
  'cathedral-open': 4.9,
  'ghost-residue': 5.0,
  'silence-constellation': 6.2
};

const MOMENT_COOLDOWNS: Record<MomentKind, number> = {
  'collapse-scar': 10.5,
  'cathedral-open': 12,
  'ghost-residue': 9.5,
  'silence-constellation': 8.5
};

const MOMENT_ARM_WINDOW_SECONDS: Record<MomentKind, number> = {
  'collapse-scar': 2.2,
  'cathedral-open': 3.2,
  'ghost-residue': 2.4,
  'silence-constellation': 2.8
};

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function hasLowPercussionSourceHint(frame: ListeningFrame): boolean {
  return frame.sourceHintConfidence > 0.08 && frame.percussionEvidence < 0.08;
}

function hasRuptureStructure(stage: StageCuePlan): boolean {
  return (
    stage.family === 'rupture' ||
    stage.worldMode === 'collapse-well' ||
    stage.transformIntent === 'collapse'
  );
}

function hashSignature(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function phaseForAge(kind: MomentKind, ageSeconds: number): SignatureMomentPhase {
  if (ageSeconds < 0.32) {
    return 'eligible';
  }

  if (ageSeconds < (kind === 'collapse-scar' ? 0.78 : 1.12)) {
    return 'precharge';
  }

  if (ageSeconds < (kind === 'collapse-scar' ? 1.48 : 1.9)) {
    return 'strike';
  }

  if (ageSeconds < MOMENT_DURATIONS[kind] * 0.58) {
    return 'hold';
  }

  if (ageSeconds < MOMENT_DURATIONS[kind] * 0.86) {
    return 'residue';
  }

  return 'clear';
}

function phaseEnvelope(phase: SignatureMomentPhase): number {
  switch (phase) {
    case 'armed':
      return 0.18;
    case 'eligible':
      return 0.28;
    case 'precharge':
      return 0.58;
    case 'strike':
      return 1;
    case 'hold':
      return 0.84;
    case 'residue':
      return 0.5;
    case 'clear':
      return 0.2;
    default:
      return 0;
  }
}

function distinctnessForKind(kind: MomentKind): SignatureMomentDistinctnessHint {
  switch (kind) {
    case 'collapse-scar':
      return 'dark-cut';
    case 'cathedral-open':
      return 'architectural-open';
    case 'ghost-residue':
      return 'memory-afterimage';
    case 'silence-constellation':
      return 'quiet-spatial-field';
  }
}

export function resolveSignatureMomentStyle(
  style: SignatureMomentStyle,
  input: SignatureMomentGovernorInput
): ResolvedSignatureMomentStyle {
  if (style !== 'auto') {
    return style;
  }

  return deriveSignatureMomentStyle(input);
}

export function deriveSignatureMomentStyle(
  input: SignatureMomentGovernorInput
): ResolvedSignatureMomentStyle {
  const frame = input.frame;
  const stage = input.stageCuePlan;
  const composition = input.stageCompositionPlan;
  const safetyRisk =
    (1 - input.authority.compositionSafetyScore) * 0.54 +
    input.authority.overbright * 0.36;
  const quietScore =
    frame.ambienceConfidence * 0.38 +
    frame.air * 0.18 +
    frame.releaseTail * 0.18 +
    (frame.musicConfidence < 0.18 ? 0.2 : 0) +
    (stage.family === 'release' || stage.family === 'haunt' ? 0.08 : 0);
  const darkPressureScore =
    frame.dropImpact * 0.32 +
    frame.lowMidBody * 0.16 +
    frame.body * 0.12 +
    (stage.family === 'rupture' ? 0.24 : 0) +
    (stage.worldMode === 'collapse-well' ? 0.18 : 0) +
    (composition.shotClass === 'worldTakeover' ? 0.08 : 0);
  const neonPortalScore =
    frame.musicConfidence * 0.14 +
    frame.shimmer * 0.22 +
    frame.beatConfidence * 0.14 +
    frame.transientConfidence * 0.12 +
    frame.sectionChange * 0.18 +
    frame.preDropTension * 0.16 +
    frame.tonalStability * 0.06 +
    (stage.family === 'reveal' || stage.family === 'gather' ? 0.14 : 0) +
    (stage.worldMode === 'fan-sweep' || stage.worldMode === 'cathedral-rise'
      ? 0.14
      : 0) +
    (stage.transformIntent === 'open' ? 0.08 : 0);

  if (quietScore >= 0.62 && frame.dropImpact < 0.22 && darkPressureScore < 0.38) {
    return 'ambient-premium';
  }

  if (darkPressureScore >= 0.58 && frame.dropImpact > 0.42) {
    return 'contrast-mythic';
  }

  if (neonPortalScore >= 0.54 && safetyRisk < 0.56) {
    return 'maximal-neon';
  }

  return 'contrast-mythic';
}

function resolveStyleSafetyRisk(input: SignatureMomentGovernorInput): number {
  return clamp01(
    (1 - input.authority.compositionSafetyScore) * 0.54 +
      input.authority.overbright * 0.36
  );
}

function deriveSignatureMomentStyleForKind(
  kind: MomentKind,
  input: SignatureMomentGovernorInput
): ResolvedSignatureMomentStyle {
  const baseStyle = deriveSignatureMomentStyle(input);
  if (baseStyle === 'ambient-premium') {
    return baseStyle;
  }

  const quietOrRelease =
    input.frame.ambienceConfidence > 0.32 ||
    input.frame.releaseTail > 0.22 ||
    input.frame.musicConfidence < 0.26 ||
    input.stageCuePlan.family === 'release' ||
    input.stageCuePlan.family === 'haunt';
  const lowImpact = input.frame.dropImpact < 0.26 && input.frame.sectionChange < 0.3;
  const safeEnough = resolveStyleSafetyRisk(input) < 0.68;

  if (
    safeEnough &&
    lowImpact &&
    quietOrRelease &&
    (kind === 'ghost-residue' || kind === 'silence-constellation')
  ) {
    return 'ambient-premium';
  }

  return baseStyle;
}

export class SignatureMomentGovernor {
  private activeMoment: ActiveSignatureMoment | null = null;
  private armedCandidate: ArmedSignatureCandidate | null = null;
  private cooldownUntilSeconds = 0;
  private lastStartedByKind: Partial<Record<MomentKind, number>> = {};
  private latestSnapshot: SignatureMomentSnapshot = {
    ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
    candidateScores: { ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.candidateScores }
  };

  resolveFrame(input: SignatureMomentGovernorInput): SignatureMomentSnapshot {
    const safetyRisk = this.resolveSafetyRisk(input);
    const candidateScores = this.buildCandidateScores(input, safetyRisk);

    if (input.devOverride) {
      this.latestSnapshot = this.resolveForcedPreview(
        input,
        input.devOverride,
        safetyRisk,
        candidateScores
      );
      return this.latestSnapshot;
    }

    if (this.activeMoment?.forcedPreview) {
      this.activeMoment = null;
    }

    if (this.activeMoment) {
      const snapshot = this.resolveActiveSnapshot(input, safetyRisk, candidateScores);

      if (snapshot.kind !== 'none') {
        this.latestSnapshot = snapshot;
        return snapshot;
      }
    }

    const candidate = this.selectCandidate(candidateScores, input, safetyRisk);
    const rarityBudget = this.resolveRarityBudget(candidate.kind, input.elapsedSeconds);
    const cooldownActive =
      input.elapsedSeconds < this.cooldownUntilSeconds &&
      candidate.kind !== 'silence-constellation';

    if (cooldownActive) {
      this.armedCandidate = null;
      this.latestSnapshot = this.buildNoneSnapshot(
        input,
        'cooldown',
        safetyRisk,
        candidateScores
      );
      return this.latestSnapshot;
    }

    if (candidate.score <= 0) {
      this.armedCandidate = null;
      this.latestSnapshot = this.buildNoneSnapshot(
        input,
        candidate.suppressionReason,
        safetyRisk,
        candidateScores
      );
      return this.latestSnapshot;
    }

    const shouldStrike = this.shouldStrikeCandidate(candidate, input, rarityBudget);

    if (shouldStrike) {
      this.activeMoment = this.startMoment(
        candidate.kind,
        deriveSignatureMomentStyleForKind(candidate.kind, input),
        input,
        candidate.score,
        rarityBudget,
        false
      );
      this.armedCandidate = null;
      this.latestSnapshot = this.resolveActiveSnapshot(
        input,
        safetyRisk,
        candidateScores
      );
      return this.latestSnapshot;
    }

    this.armedCandidate = this.resolveArmedCandidate(candidate, input);
    this.latestSnapshot = this.buildArmedSnapshot(
      input,
      safetyRisk,
      candidateScores,
      rarityBudget
    );
    return this.latestSnapshot;
  }

  getSnapshot(): SignatureMomentSnapshot {
    return {
      ...this.latestSnapshot,
      candidateScores: { ...this.latestSnapshot.candidateScores }
    };
  }

  resetForShowStart(): void {
    this.activeMoment = null;
    this.armedCandidate = null;
    this.cooldownUntilSeconds = 0;
    this.lastStartedByKind = {};
    this.latestSnapshot = {
      ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
      candidateScores: { ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.candidateScores }
    };
  }

  private resolveForcedPreview(
    input: SignatureMomentGovernorInput,
    override: SignatureMomentDevOverride,
    safetyRisk: number,
    candidateScores: SignatureMomentCandidateScores
  ): SignatureMomentSnapshot {
    const duration = Math.max(1.6, override.durationSeconds);
    const ageSeconds = Math.max(0, input.elapsedSeconds - override.startedAtSeconds);
    const normalizedAge = clamp01(ageSeconds / duration);
    const phase = this.resolveForcedPreviewPhase(
      override.syntheticProfile,
      normalizedAge
    );
    const style = this.resolveForcedPreviewStyle(input, override);
    const intensity = clamp01(
      override.intensity * phaseEnvelope(phase) * (1 - safetyRisk * 0.12)
    );
    const previewCandidateScores = {
      ...candidateScores,
      [override.kind]: Math.max(candidateScores[override.kind], 1)
    };

    return this.buildMomentSnapshot({
      input,
      kind: override.kind,
      phase,
      style,
      requestedStyle: resolveSignatureMomentStyle(override.style, input),
      intensity,
      ageSeconds,
      seed: hashSignature(
        `preview:${override.kind}:${style}:${override.syntheticProfile}:${override.startedAtSeconds}`
      ),
      startedAtSeconds: override.startedAtSeconds,
      suppressionReason: 'none',
      safetyRisk,
      candidateScores: previewCandidateScores,
      triggerConfidence: 1,
      rarityBudget: 1,
      prechargeProgress: clamp01(normalizedAge / 0.18),
      forcedPreview: true
    });
  }

  private resolveForcedPreviewPhase(
    profile: SignatureMomentPreviewProfile,
    normalizedAge: number
  ): SignatureMomentPhase {
    switch (profile) {
      case 'drop':
        return normalizedAge < 0.08
          ? 'precharge'
          : normalizedAge < 0.38
            ? 'strike'
            : normalizedAge < 0.64
              ? 'hold'
              : normalizedAge < 0.9
                ? 'residue'
                : 'clear';
      case 'reveal':
        return normalizedAge < 0.22
          ? 'precharge'
          : normalizedAge < 0.48
            ? 'strike'
            : normalizedAge < 0.82
              ? 'hold'
              : normalizedAge < 0.94
                ? 'residue'
                : 'clear';
      case 'release':
        return normalizedAge < 0.08
          ? 'precharge'
          : normalizedAge < 0.22
            ? 'strike'
            : normalizedAge < 0.44
              ? 'hold'
              : normalizedAge < 0.9
                ? 'residue'
                : 'clear';
      case 'quiet':
        return normalizedAge < 0.26
          ? 'precharge'
          : normalizedAge < 0.68
            ? 'hold'
            : normalizedAge < 0.92
              ? 'residue'
              : 'clear';
      default:
        return normalizedAge < 0.12
          ? 'precharge'
          : normalizedAge < 0.34
            ? 'strike'
            : normalizedAge < 0.72
              ? 'hold'
              : normalizedAge < 0.92
                ? 'residue'
                : 'clear';
    }
  }

  private resolveForcedPreviewStyle(
    input: SignatureMomentGovernorInput,
    override: SignatureMomentDevOverride
  ): ResolvedSignatureMomentStyle {
    if (override.style !== 'auto') {
      return this.convertStyleForSafety(
        override.kind,
        resolveSignatureMomentStyle(override.style, input),
        input
      );
    }

    const syntheticStyle: ResolvedSignatureMomentStyle =
      override.syntheticProfile === 'quiet' || override.syntheticProfile === 'release'
        ? 'ambient-premium'
        : override.syntheticProfile === 'reveal'
          ? 'maximal-neon'
          : 'contrast-mythic';

    return this.convertStyleForSafety(override.kind, syntheticStyle, input);
  }

  private resolveActiveSnapshot(
    input: SignatureMomentGovernorInput,
    safetyRisk: number,
    candidateScores: SignatureMomentCandidateScores
  ): SignatureMomentSnapshot {
    if (!this.activeMoment) {
      return this.buildNoneSnapshot(input, 'none', safetyRisk, candidateScores);
    }

    const ageSeconds = Math.max(
      0,
      input.elapsedSeconds - this.activeMoment.startedAtSeconds
    );
    const duration = MOMENT_DURATIONS[this.activeMoment.kind];
    const silenceStillEligible =
      this.activeMoment.kind === 'silence-constellation' &&
      candidateScores['silence-constellation'] >= 0.46;

    if (ageSeconds > duration && !silenceStillEligible) {
      this.cooldownUntilSeconds =
        input.elapsedSeconds + MOMENT_COOLDOWNS[this.activeMoment.kind];
      this.activeMoment = null;
      return this.buildNoneSnapshot(input, 'cooldown', safetyRisk, candidateScores);
    }

    const phase = phaseForAge(this.activeMoment.kind, ageSeconds);
    const envelope = phaseEnvelope(phase);
    const sourceIntensity = THREE.MathUtils.clamp(
      this.activeMoment.sourceScore,
      0.42,
      1
    );
    const styleDamp = this.activeMoment.style === 'contrast-mythic' ? 0.08 : 0;
    const intensity = THREE.MathUtils.clamp(
      sourceIntensity * envelope * (1 - safetyRisk * (0.22 - styleDamp)),
      0,
      1
    );

    return this.buildMomentSnapshot({
      input,
      kind: this.activeMoment.kind,
      phase,
      style: this.activeMoment.style,
      requestedStyle: this.activeMoment.requestedStyle,
      intensity,
      ageSeconds,
      seed: this.activeMoment.seed,
      startedAtSeconds: this.activeMoment.startedAtSeconds,
      suppressionReason: 'none',
      safetyRisk,
      candidateScores,
      triggerConfidence: this.activeMoment.sourceScore,
      rarityBudget: this.activeMoment.rarityBudget,
      prechargeProgress: phase === 'precharge' ? clamp01(ageSeconds / 1.1) : 1,
      forcedPreview: this.activeMoment.forcedPreview
    });
  }

  private buildNoneSnapshot(
    input: SignatureMomentGovernorInput,
    suppressionReason: SignatureMomentSuppressionReason,
    safetyRisk: number,
    candidateScores: SignatureMomentCandidateScores
  ): SignatureMomentSnapshot {
    return {
      ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
      ageSeconds: input.elapsedSeconds,
      style: deriveSignatureMomentStyle(input),
      suppressionReason,
      safetyRisk,
      candidateScores: { ...candidateScores },
      rarityBudget: 1,
      decisionTrace: this.buildDecisionTrace({
        kind: null,
        style: deriveSignatureMomentStyle(input),
        input,
        candidateScores,
        suppressionReason,
        safetyRisk,
        triggerConfidence: 0,
        forcedPreview: false
      })
    };
  }

  private buildArmedSnapshot(
    input: SignatureMomentGovernorInput,
    safetyRisk: number,
    candidateScores: SignatureMomentCandidateScores,
    rarityBudget: number
  ): SignatureMomentSnapshot {
    if (!this.armedCandidate) {
      return this.buildNoneSnapshot(input, 'insufficient-cue', safetyRisk, candidateScores);
    }

    const ageSeconds = Math.max(
      0,
      input.elapsedSeconds - this.armedCandidate.armedAtSeconds
    );
    const armWindow = MOMENT_ARM_WINDOW_SECONDS[this.armedCandidate.kind];
    const prechargeProgress = clamp01(ageSeconds / armWindow);
    const intensity = clamp01(
      (0.18 + prechargeProgress * 0.34) *
        this.armedCandidate.sourceScore *
        (1 - safetyRisk * 0.2)
    );

    return this.buildMomentSnapshot({
      input,
      kind: this.armedCandidate.kind,
      phase: prechargeProgress < 0.18 ? 'armed' : 'precharge',
      style: this.armedCandidate.style,
      intensity,
      ageSeconds,
      seed: this.armedCandidate.seed,
      startedAtSeconds: null,
      suppressionReason: 'none',
      safetyRisk,
      candidateScores,
      triggerConfidence: this.armedCandidate.sourceScore,
      rarityBudget,
      prechargeProgress,
      forcedPreview: false
    });
  }

  private buildMomentSnapshot(input: {
    input: SignatureMomentGovernorInput;
    kind: MomentKind;
    phase: SignatureMomentPhase;
    style: ResolvedSignatureMomentStyle;
    requestedStyle?: ResolvedSignatureMomentStyle;
    intensity: number;
    ageSeconds: number;
    seed: number;
    startedAtSeconds: number | null;
    suppressionReason: SignatureMomentSuppressionReason;
    safetyRisk: number;
    candidateScores: SignatureMomentCandidateScores;
    triggerConfidence: number;
    rarityBudget: number;
    prechargeProgress: number;
    forcedPreview: boolean;
  }): SignatureMomentSnapshot {
    return {
      kind: input.kind,
      phase: input.phase,
      style: input.style,
      intensity: input.intensity,
      ageSeconds: input.ageSeconds,
      seed: input.seed,
      startedAtSeconds: input.startedAtSeconds,
      suppressionReason: input.suppressionReason,
      candidateScores: { ...input.candidateScores },
      triggerConfidence: clamp01(input.triggerConfidence),
      rarityBudget: clamp01(input.rarityBudget),
      prechargeProgress: clamp01(input.prechargeProgress),
      distinctnessHint: distinctnessForKind(input.kind),
      decisionTrace: this.buildDecisionTrace({
        kind: input.kind,
        style: input.style,
        requestedStyle: input.requestedStyle,
        input: input.input,
        candidateScores: input.candidateScores,
        suppressionReason: input.suppressionReason,
        safetyRisk: input.safetyRisk,
        triggerConfidence: input.triggerConfidence,
        forcedPreview: input.forcedPreview
      }),
      forcedPreview: input.forcedPreview,
      worldLead: this.resolveWorldLead(input.kind, input.intensity, input.style),
      heroSuppression: this.resolveHeroSuppression(
        input.kind,
        input.intensity,
        input.style
      ),
      chamberArchitecture: this.resolveChamberArchitecture(
        input.kind,
        input.intensity,
        input.style
      ),
      postConsequence: this.resolvePostConsequence(
        input.kind,
        input.intensity,
        input.style
      ),
      memoryStrength: this.resolveMemoryStrength(input.kind, input.intensity),
      safetyRisk: input.safetyRisk
    };
  }

  private buildDecisionTrace(input: {
    kind: MomentKind | null;
    style: ResolvedSignatureMomentStyle;
    requestedStyle?: ResolvedSignatureMomentStyle;
    input: SignatureMomentGovernorInput;
    candidateScores: SignatureMomentCandidateScores;
    suppressionReason: SignatureMomentSuppressionReason;
    safetyRisk: number;
    triggerConfidence: number;
    forcedPreview: boolean;
  }): SignatureMomentDecisionTrace {
    const dominant = MOMENT_KINDS.reduce(
      (best, kind) =>
        input.candidateScores[kind] > best.score
          ? { kind, score: input.candidateScores[kind] }
          : best,
      { kind: null as MomentKind | null, score: 0 }
    );
    const preferredStyle = input.requestedStyle ?? deriveSignatureMomentStyle(input.input);
    const convertedFromStyle =
      preferredStyle !== input.style ? preferredStyle : null;
    const safetyAction =
      convertedFromStyle === 'maximal-neon' && input.style === 'contrast-mythic'
        ? 'convert-contrast'
        : convertedFromStyle === 'maximal-neon' && input.style === 'ambient-premium'
          ? 'convert-ambient'
          : input.style === 'maximal-neon'
            ? 'preserve-neon'
            : 'none';
    const selectedReason = input.forcedPreview
      ? 'forced-preview'
      : input.kind
        ? `${input.kind}:${input.triggerConfidence >= 0.62 ? 'phrase-strike' : 'precharge'}`
        : input.suppressionReason === 'none'
          ? 'idle'
          : `deferred:${input.suppressionReason}`;
    const styleReason =
      input.style === 'ambient-premium'
        ? 'quiet-release-space'
        : input.style === 'maximal-neon'
          ? 'neon-portal-energy'
          : input.safetyRisk > 0.56
            ? 'contrast-safety'
            : 'dark-pressure-contrast';

    return {
      selectedReason,
      styleReason,
      safetyAction,
      deferredReason: input.suppressionReason,
      convertedFromStyle,
      dominantCandidate: dominant.kind,
      dominantCandidateScore: clamp01(dominant.score)
    };
  }

  private buildCandidateScores(
    input: SignatureMomentGovernorInput,
    safetyRisk: number
  ): SignatureMomentCandidateScores {
    const cathedralRaw = this.scoreCathedralOpen(input);
    const cathedralConverted =
      safetyRisk > 0.42 || input.authority.overbright > 0.3
        ? cathedralRaw * 0.72
        : cathedralRaw;
    const cathedralSuppressed =
      safetyRisk > 0.72 || input.authority.overbright > 0.62 ? 0 : cathedralConverted;

    return {
      'collapse-scar': this.scoreCollapseScar(input),
      'cathedral-open': cathedralSuppressed,
      'ghost-residue': this.scoreGhostResidue(input),
      'silence-constellation': this.scoreSilenceConstellation(input)
    };
  }

  private selectCandidate(
    candidateScores: SignatureMomentCandidateScores,
    input: SignatureMomentGovernorInput,
    safetyRisk: number
  ): SignatureCandidate {
    const candidates: SignatureCandidate[] = MOMENT_KINDS.map((kind) => ({
      kind,
      score: candidateScores[kind],
      suppressionReason:
        kind === 'cathedral-open' &&
        (safetyRisk > 0.72 || input.authority.overbright > 0.62)
          ? 'overbright-risk'
          : kind === 'ghost-residue'
            ? 'memory-empty'
            : kind === 'silence-constellation'
              ? 'low-confidence'
              : 'insufficient-cue'
    }));
    const ranked = candidates.sort((left, right) => right.score - left.score);
    const winner = ranked[0] ?? {
      kind: 'collapse-scar' as const,
      score: 0,
      suppressionReason: 'insufficient-cue' as const
    };
    const threshold = winner.kind === 'silence-constellation' ? 0.46 : 0.48;

    if (winner.score < threshold) {
      if (
        (safetyRisk > 0.72 || input.authority.overbright > 0.62) &&
        this.scoreCathedralOpen(input) >= 0.46
      ) {
        return {
          kind: 'cathedral-open',
          score: 0,
          suppressionReason: 'overbright-risk'
        };
      }

      return {
        kind: winner.kind,
        score: 0,
        suppressionReason: winner.suppressionReason
      };
    }

    return winner;
  }

  private shouldStrikeCandidate(
    candidate: SignatureCandidate,
    input: SignatureMomentGovernorInput,
    rarityBudget: number
  ): boolean {
    const armAge =
      this.armedCandidate?.kind === candidate.kind
        ? input.elapsedSeconds - this.armedCandidate.armedAtSeconds
        : 0;
    const ruptureStructure = hasRuptureStructure(input.stageCuePlan);
    const lowPercussionSourceHint = hasLowPercussionSourceHint(input.frame);
    const sourcePermitsCollapseImpact =
      !lowPercussionSourceHint || input.frame.percussionEvidence > 0.18;
    const impactStrike =
      candidate.kind === 'collapse-scar' &&
      ((input.frame.dropImpact > 0.52 && sourcePermitsCollapseImpact) ||
        (ruptureStructure &&
          (sourcePermitsCollapseImpact || input.frame.dropImpact > 0.42)));
    const revealStrike =
      candidate.kind === 'cathedral-open' &&
      (input.frame.sectionChange > 0.3 ||
        input.stageCuePlan.worldMode === 'cathedral-rise');
    const releaseStrike =
      candidate.kind === 'ghost-residue' &&
      (input.frame.releaseTail > 0.36 || input.stageCuePlan.family === 'release');
    const quietStrike =
      candidate.kind === 'silence-constellation' &&
      armAge > 1.0 &&
      input.frame.dropImpact < 0.12;
    const enoughScore = candidate.score * (0.7 + rarityBudget * 0.3) >= 0.62;

    return (
      enoughScore &&
      (impactStrike || revealStrike || releaseStrike || quietStrike || armAge > 1.35)
    );
  }

  private resolveArmedCandidate(
    candidate: SignatureCandidate,
    input: SignatureMomentGovernorInput
  ): ArmedSignatureCandidate {
    if (this.armedCandidate?.kind === candidate.kind) {
      return {
        ...this.armedCandidate,
        style: deriveSignatureMomentStyleForKind(candidate.kind, input),
        sourceScore: Math.max(this.armedCandidate.sourceScore, candidate.score)
      };
    }

    return {
      kind: candidate.kind,
      style: deriveSignatureMomentStyleForKind(candidate.kind, input),
      armedAtSeconds: input.elapsedSeconds,
      seed: hashSignature(
        `armed:${candidate.kind}:${Math.floor(input.elapsedSeconds * 2)}:${input.stageCuePlan.family}:${input.stageCuePlan.worldMode}`
      ),
      sourceScore: candidate.score,
      suppressionReason: candidate.suppressionReason
    };
  }

  private startMoment(
    kind: MomentKind,
    style: ResolvedSignatureMomentStyle,
    input: SignatureMomentGovernorInput,
    sourceScore: number,
    rarityBudget: number,
    forcedPreview: boolean
  ): ActiveSignatureMoment {
    this.lastStartedByKind[kind] = input.elapsedSeconds;

    return {
      kind,
      style: this.convertStyleForSafety(kind, style, input),
      requestedStyle: style,
      startedAtSeconds: input.elapsedSeconds,
      seed: hashSignature(
        `${kind}:${style}:${Math.floor(input.elapsedSeconds * 2)}:${input.stageCuePlan.family}:${input.stageCuePlan.worldMode}`
      ),
      sourceScore,
      rarityBudget,
      forcedPreview
    };
  }

  private convertStyleForSafety(
    kind: MomentKind,
    style: ResolvedSignatureMomentStyle,
    input: SignatureMomentGovernorInput
  ): ResolvedSignatureMomentStyle {
    if (style !== 'maximal-neon') {
      return style;
    }

    const safetyRisk = this.resolveSafetyRisk(input);
    const ringRisk = Math.max(0, input.authority.ringBeltPersistence - 0.34);
    const cleanNeonWindow =
      input.authority.overbright < 0.3 &&
      input.authority.compositionSafetyScore >= 0.7 &&
      ringRisk < 0.22;

    if (kind === 'silence-constellation') {
      return safetyRisk > 0.54 ? 'ambient-premium' : style;
    }

    if (
      kind === 'cathedral-open' &&
      (input.authority.overbright > 0.42 ||
        input.authority.compositionSafetyScore < 0.62 ||
        safetyRisk > 0.68)
    ) {
      return 'contrast-mythic';
    }

    if (input.qualityTier === 'safe' && !cleanNeonWindow) {
      return safetyRisk > 0.62 ? 'contrast-mythic' : style;
    }

    return style;
  }

  private resolveRarityBudget(kind: MomentKind, elapsedSeconds: number): number {
    const lastStarted = this.lastStartedByKind[kind];

    if (lastStarted === undefined) {
      return 1;
    }

    const phraseGap = Math.max(0, elapsedSeconds - lastStarted);
    return clamp01(phraseGap / (MOMENT_COOLDOWNS[kind] * 2.4));
  }

  private scoreCollapseScar(input: SignatureMomentGovernorInput): number {
    const stage = input.stageCuePlan;
    const composition = input.stageCompositionPlan;
    const ruptureStructure = hasRuptureStructure(stage);
    const lowPercussionSourceHint = hasLowPercussionSourceHint(input.frame);
    const dropImpactWeight =
      lowPercussionSourceHint && !ruptureStructure ? 0.16 : 0.42;
    const sourceHintLift =
      input.frame.sourceHintConfidence > 0.08
        ? input.frame.percussionEvidence * 0.18
        : 0;
    const lowPercussionPenalty =
      lowPercussionSourceHint && !ruptureStructure ? 0.18 : 0;

    return clamp01(
      (stage.family === 'rupture' ? 0.28 : 0) +
        (stage.worldMode === 'collapse-well' ? 0.24 : 0) +
        (stage.transformIntent === 'collapse' ? 0.12 : 0) +
        (stage.compositorMode === 'scar' || stage.compositorMode === 'cut'
          ? 0.12
          : 0) +
        (composition.shotClass === 'worldTakeover' ? 0.14 : 0) +
        (composition.shotClass === 'rupture' ? 0.12 : 0) +
        input.frame.dropImpact * dropImpactWeight +
        input.frame.sectionChange * 0.16 +
        input.frame.preDropTension * 0.12 +
        input.authority.worldDominanceDelivered * 0.08 +
        sourceHintLift -
        lowPercussionPenalty
    );
  }

  private scoreCathedralOpen(input: SignatureMomentGovernorInput): number {
    const stage = input.stageCuePlan;
    const composition = input.stageCompositionPlan;

    return clamp01(
      (stage.family === 'reveal' ? 0.24 : 0) +
        (stage.family === 'gather' ? 0.12 : 0) +
        (stage.worldMode === 'cathedral-rise' ? 0.26 : 0) +
        (stage.worldMode === 'fan-sweep' ? 0.18 : 0) +
        (stage.transformIntent === 'open' ? 0.12 : 0) +
        (composition.transitionClass === 'iris' ? 0.08 : 0) +
        input.frame.preDropTension * 0.16 +
        input.frame.sectionChange * 0.18 +
        input.frame.tonalStability * 0.08 +
        input.authority.chamberPresenceScore * 0.1
    );
  }

  private scoreGhostResidue(input: SignatureMomentGovernorInput): number {
    const stage = input.stageCuePlan;

    return clamp01(
      (stage.family === 'release' ? 0.22 : 0) +
        (stage.family === 'haunt' ? 0.24 : 0) +
        (stage.residueMode === 'ghost' ? 0.18 : 0) +
        (stage.residueMode === 'afterglow' ? 0.1 : 0) +
        (stage.compositorMode === 'afterimage' ? 0.12 : 0) +
        input.frame.releaseTail * 0.34 +
        input.frame.resonance * 0.12 +
        input.frame.shimmer * 0.08 +
        input.authority.frameHierarchyScore * 0.04
    );
  }

  private scoreSilenceConstellation(input: SignatureMomentGovernorInput): number {
    const lowMusic = clamp01((0.32 - input.frame.musicConfidence) / 0.32);
    const lowImpact = clamp01(1 - input.frame.dropImpact * 3.2);
    const lowSpeech = clamp01(1 - input.frame.speechConfidence * 2.6);
    const quietBeauty =
      input.frame.showState === 'void' || input.frame.showState === 'atmosphere'
        ? 0.12
        : 0;

    return clamp01(
      lowMusic * 0.36 +
        lowImpact * 0.16 +
        lowSpeech * 0.12 +
        input.frame.ambienceConfidence * 0.16 +
        input.frame.air * 0.08 +
        input.frame.shimmer * 0.06 +
        quietBeauty +
        (input.stageCuePlan.worldMode === 'field-bloom' ? 0.1 : 0) -
        input.frame.preDropTension * 0.2
    );
  }

  private resolveSafetyRisk(input: SignatureMomentGovernorInput): number {
    return clamp01(
      (1 - input.authority.compositionSafetyScore) * 0.58 +
        input.authority.overbright * 0.32 +
        Math.max(0, input.authority.ringBeltPersistence - 0.28) * 0.28 +
        (input.qualityTier === 'safe' ? 0.04 : 0)
    );
  }

  private resolveWorldLead(
    kind: MomentKind,
    intensity: number,
    style: ResolvedSignatureMomentStyle
  ): number {
    const bias =
      kind === 'collapse-scar'
        ? 1
        : kind === 'cathedral-open'
          ? 0.74
          : kind === 'silence-constellation'
            ? 0.54
            : 0.36;
    const styleLift = style === 'contrast-mythic' ? 0.08 : style === 'ambient-premium' ? 0.04 : 0;

    return clamp01(intensity * (bias + styleLift));
  }

  private resolveHeroSuppression(
    kind: MomentKind,
    intensity: number,
    style: ResolvedSignatureMomentStyle
  ): number {
    const bias =
      kind === 'collapse-scar'
        ? 0.72
        : kind === 'ghost-residue'
          ? 0.46
          : kind === 'silence-constellation'
            ? 0.3
            : 0.18;
    const styleLift = style === 'contrast-mythic' ? 0.08 : 0;

    return clamp01(intensity * (bias + styleLift));
  }

  private resolveChamberArchitecture(
    kind: MomentKind,
    intensity: number,
    style: ResolvedSignatureMomentStyle
  ): number {
    const bias =
      kind === 'cathedral-open'
        ? 1
        : kind === 'silence-constellation'
          ? 0.62
          : kind === 'ghost-residue'
            ? 0.44
            : 0.34;
    const styleLift = style === 'ambient-premium' ? 0.08 : style === 'maximal-neon' ? 0.05 : 0;

    return clamp01(intensity * (bias + styleLift));
  }

  private resolvePostConsequence(
    kind: MomentKind,
    intensity: number,
    style: ResolvedSignatureMomentStyle
  ): number {
    const bias =
      kind === 'collapse-scar'
        ? 1
        : kind === 'ghost-residue'
          ? 0.86
          : kind === 'cathedral-open'
            ? 0.72
            : 0.48;
    const styleLift = style === 'maximal-neon' ? 0.07 : style === 'contrast-mythic' ? 0.04 : 0;

    return clamp01(intensity * (bias + styleLift));
  }

  private resolveMemoryStrength(kind: MomentKind, intensity: number): number {
    const bias =
      kind === 'ghost-residue'
        ? 1
        : kind === 'collapse-scar'
          ? 0.48
          : kind === 'cathedral-open'
            ? 0.28
            : 0.36;

    return clamp01(intensity * bias);
  }
}
