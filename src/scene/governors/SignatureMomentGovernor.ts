import * as THREE from 'three';
import type { ListeningFrame } from '../../types/audio';
import type {
  AuthorityFrameSnapshot,
  SignatureMomentKind,
  SignatureMomentPhase,
  SignatureMomentSnapshot,
  SignatureMomentSuppressionReason,
  StageCompositionPlan,
  StageCuePlan
} from '../../types/visual';
import { DEFAULT_SIGNATURE_MOMENT_SNAPSHOT } from '../../types/visual';

export type SignatureMomentGovernorInput = {
  frame: ListeningFrame;
  elapsedSeconds: number;
  deltaSeconds: number;
  stageCuePlan: StageCuePlan;
  stageCompositionPlan: StageCompositionPlan;
  authority: AuthorityFrameSnapshot;
  qualityTier: 'safe' | 'balanced' | 'premium';
};

type ActiveSignatureMoment = {
  kind: Exclude<SignatureMomentKind, 'none'>;
  startedAtSeconds: number;
  seed: number;
  sourceScore: number;
};

type SignatureCandidate = {
  kind: Exclude<SignatureMomentKind, 'none'>;
  score: number;
  suppressionReason: SignatureMomentSuppressionReason;
};

const MOMENT_DURATIONS: Record<Exclude<SignatureMomentKind, 'none'>, number> = {
  'collapse-scar': 4.8,
  'cathedral-open': 5.4,
  'ghost-residue': 5.8,
  'silence-constellation': 7.6
};

const MOMENT_COOLDOWNS: Record<Exclude<SignatureMomentKind, 'none'>, number> = {
  'collapse-scar': 5.6,
  'cathedral-open': 6.4,
  'ghost-residue': 4.8,
  'silence-constellation': 3.8
};

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function hashSignature(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function phaseForAge(
  kind: Exclude<SignatureMomentKind, 'none'>,
  ageSeconds: number
): SignatureMomentPhase {
  if (ageSeconds < 0.32) {
    return 'eligible';
  }

  if (ageSeconds < (kind === 'collapse-scar' ? 0.74 : 1.05)) {
    return 'precharge';
  }

  if (ageSeconds < (kind === 'collapse-scar' ? 1.42 : 1.8)) {
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
    case 'eligible':
      return 0.22;
    case 'precharge':
      return 0.54;
    case 'strike':
      return 1;
    case 'hold':
      return 0.82;
    case 'residue':
      return 0.48;
    case 'clear':
      return 0.2;
    default:
      return 0;
  }
}

export class SignatureMomentGovernor {
  private activeMoment: ActiveSignatureMoment | null = null;
  private cooldownUntilSeconds = 0;
  private latestSnapshot: SignatureMomentSnapshot = {
    ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT
  };

  resolveFrame(input: SignatureMomentGovernorInput): SignatureMomentSnapshot {
    const safetyRisk = this.resolveSafetyRisk(input);

    if (this.activeMoment) {
      const snapshot = this.resolveActiveSnapshot(input, safetyRisk);

      if (snapshot.kind !== 'none') {
        this.latestSnapshot = snapshot;
        return snapshot;
      }
    }

    const candidate = this.selectCandidate(input, safetyRisk);

    if (
      input.elapsedSeconds < this.cooldownUntilSeconds &&
      candidate.kind !== 'silence-constellation'
    ) {
      this.latestSnapshot = this.buildNoneSnapshot(
        input,
        'cooldown',
        safetyRisk
      );
      return this.latestSnapshot;
    }

    if (candidate.score <= 0) {
      this.latestSnapshot = this.buildNoneSnapshot(
        input,
        candidate.suppressionReason,
        safetyRisk
      );
      return this.latestSnapshot;
    }

    this.activeMoment = {
      kind: candidate.kind,
      startedAtSeconds: input.elapsedSeconds,
      seed: hashSignature(
        `${candidate.kind}:${Math.floor(input.elapsedSeconds * 2)}:${input.stageCuePlan.family}:${input.stageCuePlan.worldMode}`
      ),
      sourceScore: candidate.score
    };

    this.latestSnapshot = this.resolveActiveSnapshot(input, safetyRisk);
    return this.latestSnapshot;
  }

  getSnapshot(): SignatureMomentSnapshot {
    return { ...this.latestSnapshot };
  }

  private resolveActiveSnapshot(
    input: SignatureMomentGovernorInput,
    safetyRisk: number
  ): SignatureMomentSnapshot {
    if (!this.activeMoment) {
      return this.buildNoneSnapshot(input, 'none', safetyRisk);
    }

    const ageSeconds = Math.max(
      0,
      input.elapsedSeconds - this.activeMoment.startedAtSeconds
    );
    const duration = MOMENT_DURATIONS[this.activeMoment.kind];
    const silenceStillEligible =
      this.activeMoment.kind === 'silence-constellation' &&
      this.scoreSilenceConstellation(input) >= 0.32;

    if (ageSeconds > duration && !silenceStillEligible) {
      this.cooldownUntilSeconds =
        input.elapsedSeconds + MOMENT_COOLDOWNS[this.activeMoment.kind];
      this.activeMoment = null;
      return this.buildNoneSnapshot(input, 'cooldown', safetyRisk);
    }

    const phase = phaseForAge(this.activeMoment.kind, ageSeconds);
    const envelope = phaseEnvelope(phase);
    const sourceIntensity = THREE.MathUtils.clamp(
      this.activeMoment.sourceScore,
      0.42,
      1
    );
    const intensity = THREE.MathUtils.clamp(
      sourceIntensity * envelope * (1 - safetyRisk * 0.22),
      0,
      1
    );

    return {
      kind: this.activeMoment.kind,
      phase,
      intensity,
      ageSeconds,
      seed: this.activeMoment.seed,
      startedAtSeconds: this.activeMoment.startedAtSeconds,
      suppressionReason: 'none',
      worldLead: this.resolveWorldLead(this.activeMoment.kind, intensity),
      heroSuppression: this.resolveHeroSuppression(
        this.activeMoment.kind,
        intensity
      ),
      chamberArchitecture: this.resolveChamberArchitecture(
        this.activeMoment.kind,
        intensity
      ),
      postConsequence: this.resolvePostConsequence(
        this.activeMoment.kind,
        intensity
      ),
      memoryStrength: this.resolveMemoryStrength(this.activeMoment.kind, intensity),
      safetyRisk
    };
  }

  private buildNoneSnapshot(
    input: SignatureMomentGovernorInput,
    suppressionReason: SignatureMomentSuppressionReason,
    safetyRisk: number
  ): SignatureMomentSnapshot {
    return {
      ...DEFAULT_SIGNATURE_MOMENT_SNAPSHOT,
      ageSeconds: input.elapsedSeconds,
      suppressionReason,
      safetyRisk
    };
  }

  private selectCandidate(
    input: SignatureMomentGovernorInput,
    safetyRisk: number
  ): SignatureCandidate {
    const cathedralScore = this.scoreCathedralOpen(input);
    const cathedralBlocked = safetyRisk > 0.48 || input.authority.overbright > 0.34;
    const candidates: SignatureCandidate[] = [
      {
        kind: 'collapse-scar',
        score: this.scoreCollapseScar(input),
        suppressionReason: 'insufficient-cue'
      },
      {
        kind: 'cathedral-open',
        score: cathedralBlocked ? 0 : cathedralScore,
        suppressionReason: cathedralBlocked
          ? 'overbright-risk'
          : 'insufficient-cue'
      },
      {
        kind: 'ghost-residue',
        score: this.scoreGhostResidue(input),
        suppressionReason: 'memory-empty'
      },
      {
        kind: 'silence-constellation',
        score: this.scoreSilenceConstellation(input),
        suppressionReason: 'low-confidence'
      }
    ];
    const ranked = candidates.sort((left, right) => right.score - left.score);
    const winner = ranked[0] ?? {
      kind: 'collapse-scar' as const,
      score: 0,
      suppressionReason: 'insufficient-cue' as const
    };
    const threshold = winner.kind === 'silence-constellation' ? 0.42 : 0.48;

    if (winner.score < threshold) {
      if (cathedralBlocked && cathedralScore >= 0.48) {
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

  private scoreCollapseScar(input: SignatureMomentGovernorInput): number {
    const stage = input.stageCuePlan;
    const composition = input.stageCompositionPlan;

    return clamp01(
      (stage.family === 'rupture' ? 0.28 : 0) +
        (stage.worldMode === 'collapse-well' ? 0.24 : 0) +
        (stage.transformIntent === 'collapse' ? 0.12 : 0) +
        (stage.compositorMode === 'scar' || stage.compositorMode === 'cut'
          ? 0.12
          : 0) +
        (composition.shotClass === 'worldTakeover' ? 0.14 : 0) +
        (composition.shotClass === 'rupture' ? 0.12 : 0) +
        input.frame.dropImpact * 0.42 +
        input.frame.sectionChange * 0.16 +
        input.frame.preDropTension * 0.12 +
        input.authority.worldDominanceDelivered * 0.08
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
    kind: Exclude<SignatureMomentKind, 'none'>,
    intensity: number
  ): number {
    const bias =
      kind === 'collapse-scar'
        ? 1
        : kind === 'cathedral-open'
          ? 0.74
          : kind === 'silence-constellation'
            ? 0.54
            : 0.36;

    return clamp01(intensity * bias);
  }

  private resolveHeroSuppression(
    kind: Exclude<SignatureMomentKind, 'none'>,
    intensity: number
  ): number {
    const bias =
      kind === 'collapse-scar'
        ? 0.72
        : kind === 'ghost-residue'
          ? 0.46
          : kind === 'silence-constellation'
            ? 0.3
            : 0.18;

    return clamp01(intensity * bias);
  }

  private resolveChamberArchitecture(
    kind: Exclude<SignatureMomentKind, 'none'>,
    intensity: number
  ): number {
    const bias =
      kind === 'cathedral-open'
        ? 1
        : kind === 'silence-constellation'
          ? 0.62
          : kind === 'ghost-residue'
            ? 0.44
            : 0.34;

    return clamp01(intensity * bias);
  }

  private resolvePostConsequence(
    kind: Exclude<SignatureMomentKind, 'none'>,
    intensity: number
  ): number {
    const bias =
      kind === 'collapse-scar'
        ? 1
        : kind === 'ghost-residue'
          ? 0.86
          : kind === 'cathedral-open'
            ? 0.72
            : 0.48;

    return clamp01(intensity * bias);
  }

  private resolveMemoryStrength(
    kind: Exclude<SignatureMomentKind, 'none'>,
    intensity: number
  ): number {
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
