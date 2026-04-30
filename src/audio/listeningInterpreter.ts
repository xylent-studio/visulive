import { clamp01, normalizeLevel } from './audioMath';
import {
  DEFAULT_LISTENING_FRAME,
  type AnalysisFrame,
  type ListeningFrame,
  type ListeningMode,
  type ListeningState,
  type MomentKind,
  type PerformanceIntent,
  type SourceHintFrame,
  type SourceHintId,
  type SourceHintRuntimeMode,
  type ShowState
} from '../types/audio';
import type { RuntimeTuning } from '../types/tuning';

export type InterpreterUpdateInput = {
  analysis: AnalysisFrame;
  mode: ListeningMode;
  calibrated: boolean;
  noiseFloor: number;
  adaptiveCeiling: number;
  rawPathGranted: boolean;
  tuning: RuntimeTuning;
  sourceHints?: SourceHintFrame;
  sourceHintMode?: SourceHintRuntimeMode;
};

export type ListeningInterpreterDiagnostics = {
  humRejection: number;
  musicTrend: number;
  silenceGate: number;
  beatIntervalMs: number;
  roomMusicFloorActive: boolean;
  roomMusicDrive: number;
  aftermathEntryEvidence: number;
  aftermathExitPressure: number;
  stateReason: string;
  showStateReason: string;
  momentReason: string;
  conductorReason: string;
};

type MomentState = {
  kind: MomentKind;
  amount: number;
  reason: string;
};

type SourceHintEvidence = {
  confidence: number;
  percussion: number;
  bassSource: number;
  airMotion: number;
  highSweep: number;
  silenceAir: number;
};

function damp(
  current: number,
  target: number,
  rate: number,
  deltaSeconds: number
): number {
  const mix = 1 - Math.exp(-rate * deltaSeconds);

  return current + (target - current) * mix;
}

function hintSignal(frame: SourceHintFrame, id: SourceHintId): number {
  const hint = frame.hints.find((candidate) => candidate.id === id);

  return hint ? clamp01(hint.value * hint.confidence) : 0;
}

export class ListeningInterpreter {
  private frame = DEFAULT_LISTENING_FRAME;
  private diagnostics: ListeningInterpreterDiagnostics = {
    humRejection: 0,
    musicTrend: 0,
    silenceGate: 0,
    beatIntervalMs: 0,
    roomMusicFloorActive: false,
    roomMusicDrive: 0,
    aftermathEntryEvidence: 0,
    aftermathExitPressure: 0,
    stateReason: 'Waiting for calibration.',
    showStateReason: 'Waiting for calibration.',
    momentReason: 'No active moment.',
    conductorReason: 'Waiting for calibration.'
  };
  private lastTimestampMs = 0;
  private lastLiftMs = -Infinity;
  private lastStrikeMs = -Infinity;
  private lastReleaseMs = -Infinity;
  private lastSurgeMs = -Infinity;
  private lastGenerativeMs = -Infinity;
  private lastQualifiedSectionMs = -Infinity;
  private lastBeatMs = -Infinity;
  private beatIntervalMs = 520;
  private beatCounter = 0;
  private beatStability = 0;
  private preDropMemory = 0;
  private dropMemory = 0;
  private sectionMemory = 0;
  private releaseMemory = 0;
  private aftermathDwellMs = 0;
  private hauntDwellMs = 0;

  reset(): void {
    this.frame = DEFAULT_LISTENING_FRAME;
    this.diagnostics = {
      humRejection: 0,
      musicTrend: 0,
      silenceGate: 0,
      beatIntervalMs: 0,
      roomMusicFloorActive: false,
      roomMusicDrive: 0,
      aftermathEntryEvidence: 0,
      aftermathExitPressure: 0,
      stateReason: 'Waiting for calibration.',
      showStateReason: 'Waiting for calibration.',
      momentReason: 'No active moment.',
      conductorReason: 'Waiting for calibration.'
    };
    this.lastTimestampMs = 0;
    this.lastLiftMs = -Infinity;
    this.lastStrikeMs = -Infinity;
    this.lastReleaseMs = -Infinity;
    this.lastSurgeMs = -Infinity;
    this.lastGenerativeMs = -Infinity;
    this.lastQualifiedSectionMs = -Infinity;
    this.lastBeatMs = -Infinity;
    this.beatIntervalMs = 520;
    this.beatCounter = 0;
    this.beatStability = 0;
    this.preDropMemory = 0;
    this.dropMemory = 0;
    this.sectionMemory = 0;
    this.releaseMemory = 0;
    this.aftermathDwellMs = 0;
    this.hauntDwellMs = 0;
  }

  getFrame(): ListeningFrame {
    return this.frame;
  }

  getDiagnostics(): ListeningInterpreterDiagnostics {
    return this.diagnostics;
  }

  update({
    analysis,
    mode,
    calibrated,
    noiseFloor,
    adaptiveCeiling,
    rawPathGranted,
    tuning,
    sourceHints,
    sourceHintMode
  }: InterpreterUpdateInput): {
    frame: ListeningFrame;
    diagnostics: ListeningInterpreterDiagnostics;
  } {
    const deltaSeconds = this.computeDeltaSeconds(analysis.timestampMs);

    if (!calibrated) {
      this.frame = {
        ...DEFAULT_LISTENING_FRAME,
        timestampMs: analysis.timestampMs,
        mode,
        confidence: rawPathGranted ? 0.8 : 0.65
      };
      this.diagnostics = {
        humRejection: 0,
        musicTrend: 0,
        silenceGate: 0,
        beatIntervalMs: 0,
        roomMusicFloorActive: false,
        roomMusicDrive: 0,
        aftermathEntryEvidence: 0,
        aftermathExitPressure: 0,
        stateReason: 'Waiting for calibration.',
        showStateReason: 'Waiting for calibration.',
        momentReason: 'No active moment.',
        conductorReason: 'Waiting for calibration.'
      };

      return {
        frame: this.frame,
        diagnostics: this.diagnostics
      };
    }

    const peak = normalizeLevel(analysis.peak, noiseFloor * 0.98, adaptiveCeiling);
    const fast = normalizeLevel(
      analysis.envelopeFast,
      noiseFloor * 0.98,
      adaptiveCeiling
    );
    const slow = normalizeLevel(
      analysis.envelopeSlow,
      noiseFloor * 1.01,
      adaptiveCeiling
    );
    const low = normalizeLevel(
      analysis.lowEnergy,
      noiseFloor * 0.76,
      adaptiveCeiling * 0.88
    );
    const mid = normalizeLevel(
      analysis.midEnergy,
      noiseFloor * 0.6,
      adaptiveCeiling * 0.74
    );
    const high = normalizeLevel(
      analysis.highEnergy,
      noiseFloor * 0.4,
      adaptiveCeiling * 0.58
    );
    const lowFlux = clamp01(analysis.lowFlux * 18);
    const midFlux = clamp01(analysis.midFlux * 24);
    const highFlux = clamp01(analysis.highFlux * 30);
    const brightness = clamp01(
      analysis.brightness * (0.88 + tuning.sensitivity * 0.28 + tuning.radiance * 0.1)
    );
    const sourceAggression =
      mode === 'system-audio' ? 1 : mode === 'hybrid' ? 0.62 : 0.12;
    const crest = clamp01((analysis.crestFactor - 1.2) / 5);
    const modulation = clamp01(analysis.modulation * 4.3);
    const sensitivityScale =
      0.92 + tuning.sensitivity * 0.52 + tuning.beatDrive * 0.12;
    const energyScale = 0.9 + tuning.energy * 0.26 + tuning.spectacle * 0.12;
    const beatScale = 0.88 + tuning.beatDrive * 0.4;

    const transientBase = clamp01(
      analysis.transient * (6.6 + tuning.response * 2.8) +
        Math.max(0, fast - slow) * (1.45 + tuning.accentStrength * 0.5) +
        lowFlux * 0.22 +
        midFlux * 0.18 +
        highFlux * 0.18 +
        crest * 0.14
    );

    const humCandidate = clamp01(
      (low * 0.72 + slow * 0.22) *
        analysis.lowStability *
        (1 - modulation * 0.84) *
        (1 - transientBase * 0.92) *
        (1 - high * 0.58)
    );
    const humRejection = damp(
      this.diagnostics.humRejection,
      humCandidate,
      humCandidate > this.diagnostics.humRejection ? 1.8 : 1.1,
      deltaSeconds
    );

    const silenceCandidate = clamp01(
      normalizeLevel(
        analysis.rms,
        noiseFloor * (1 - tuning.sensitivity * 0.16),
        adaptiveCeiling
      ) *
        (0.78 + modulation * 0.2 + transientBase * 0.14) -
        humRejection * 0.16
    );
    const silenceGate = damp(
      this.diagnostics.silenceGate,
      silenceCandidate,
      3.8,
      deltaSeconds
    );

    const speechEnvironmentTrust =
      mode === 'system-audio' ? 0.46 : mode === 'hybrid' ? 0.74 : 1;
    const speechTarget = clamp01(
      (mid * 0.96 +
        modulation * 0.36 +
        midFlux * 0.2 -
        low * 0.12 -
        high * 0.05) *
        (1 - transientBase * 0.48) *
        (1 - humRejection * 0.54) *
        speechEnvironmentTrust
    );
    const speech = damp(this.frame.speech, speechTarget, 4.8, deltaSeconds);
    const speechConfidence = damp(
      this.frame.speechConfidence,
      clamp01(speechTarget * 0.9 + mid * 0.14),
      4.8,
      deltaSeconds
    );
    const sourceHintEvidence = this.resolveSourceHintEvidence({
      frame: sourceHints,
      mode,
      runtimeMode: sourceHintMode,
      humRejection,
      speechConfidence,
      clipped: analysis.clipped
    });

    const ambienceConfidenceTarget = clamp01(
      silenceGate * 0.46 +
        slow * 0.18 +
        humRejection * 0.16 +
        Math.max(low, mid) * 0.08
    );
    const ambienceConfidence = damp(
      this.frame.ambienceConfidence,
      ambienceConfidenceTarget,
      2.2,
      deltaSeconds
    );

    const roomnessTarget = clamp01(
      (peak * 0.18 + slow * 0.2 + humRejection * 0.34 + mid * 0.1) *
        (0.44 + tuning.atmosphere * 0.5)
    );
    const roomness = damp(
      this.frame.roomness,
      roomnessTarget,
      2.2,
      deltaSeconds
    );

    const subPressureTarget = clamp01(
      low * 0.74 +
        slow * 0.16 +
        lowFlux * 0.1 +
        sourceHintEvidence.bassSource * 0.08 -
        humRejection * 0.22
    );
    const subPressure = damp(
      this.frame.subPressure,
      subPressureTarget,
      2.1,
      deltaSeconds
    );

    const bassBodyTarget = clamp01(
      low * 0.5 +
        slow * 0.22 +
        lowFlux * 0.08 +
        modulation * 0.06 +
        sourceHintEvidence.bassSource * 0.1 -
        humRejection * 0.2
    );
    const bassBody = damp(
      this.frame.bassBody,
      bassBodyTarget,
      2.6,
      deltaSeconds
    );

    const lowMidBodyTarget = clamp01(
      mid * 0.48 + slow * 0.2 + midFlux * 0.1 + modulation * 0.08 - speech * 0.06
    );
    const lowMidBody = damp(
      this.frame.lowMidBody,
      lowMidBodyTarget,
      3,
      deltaSeconds
    );

    const shimmerTarget = clamp01(
      high * 0.4 +
        brightness * 0.32 +
        highFlux * 0.2 +
        midFlux * 0.08 +
        sourceHintEvidence.airMotion * 0.08
    );
    const shimmer = damp(this.frame.shimmer, shimmerTarget, 4.6, deltaSeconds);

    const roughnessTarget = clamp01(
      highFlux * 0.26 +
        midFlux * 0.22 +
        crest * 0.18 +
        transientBase * 0.18 +
        modulation * 0.1
    );
    const roughness = damp(
      this.frame.roughness,
      roughnessTarget,
      4.2,
      deltaSeconds
    );

    const tonalStabilityTarget = clamp01(
      slow * 0.28 +
        analysis.lowStability * 0.28 +
        (1 - midFlux) * 0.12 +
        (1 - highFlux) * 0.08 +
        modulation * 0.14 -
        roughnessTarget * 0.22
    );
    const tonalStability = damp(
      this.frame.tonalStability,
      tonalStabilityTarget,
      2.2,
      deltaSeconds
    );

    const harmonicColorTarget = clamp01(
      0.5 +
        (brightness * 0.46 + high * 0.22 + highFlux * 0.12) -
        (low * 0.24 + bassBodyTarget * 0.14 + mid * 0.08)
    );
    const harmonicColor = damp(
      this.frame.harmonicColor,
      harmonicColorTarget,
      2.6,
      deltaSeconds
    );

    const steadyHumPenalty =
      humRejection * 0.18 +
      analysis.lowStability * low * (1 - modulation) * 0.24;
    const roomMusicSignature = clamp01(
      mode === 'room-mic'
        ? lowMidBody * 0.28 +
            bassBody * 0.18 +
            tonalStability * 0.14 +
            modulation * 0.1 +
            lowFlux * 0.08 +
            midFlux * 0.12 +
            roomness * 0.04 -
            speech * 0.04 -
            humRejection * 0.08
        : 0
    );

    const musicTarget = clamp01(
      (slow * 0.24 +
        bassBody * 0.16 +
        lowMidBody * 0.24 +
        high * 0.08 +
        lowFlux * 0.08 +
        midFlux * 0.18 +
        highFlux * 0.14 +
        modulation * 0.18 +
        tonalStability * 0.12 +
        roomMusicSignature * 0.16) *
        sensitivityScale *
        energyScale *
        (1 + sourceAggression * 0.14) -
        humRejection * (0.24 - sourceAggression * 0.08) -
        steadyHumPenalty -
        speech * (0.16 - sourceAggression * 0.04) -
        transientBase * 0.04
    );
    const musicTrend = damp(
      this.diagnostics.musicTrend,
      musicTarget,
      musicTarget > this.diagnostics.musicTrend ? 2.3 : 0.58,
      deltaSeconds
    );

    const transientConfidenceTarget = clamp01(
      transientBase * 0.74 +
        highFlux * 0.12 +
        crest * 0.12 +
        peak * 0.08 +
        sourceHintEvidence.percussion * 0.08
    );
    const transientConfidence = damp(
      this.frame.transientConfidence,
      transientConfidenceTarget,
      transientConfidenceTarget > this.frame.transientConfidence ? 12 : 6.2,
      deltaSeconds
    );

    const bodyTarget = clamp01(
      (slow * 0.26 +
        bassBody * 0.26 +
        lowMidBody * 0.22 +
        musicTrend * 0.28 +
        tonalStability * 0.08 +
        sourceHintEvidence.bassSource * 0.04) *
        (0.92 + tuning.energy * 0.2 + tuning.spectacle * 0.08) -
        humRejection * 0.12
    );
    const body = damp(
      this.frame.body,
      bodyTarget,
      bodyTarget > this.frame.body ? 3.4 : 1.8,
      deltaSeconds
    );

    const airTarget = clamp01(
      (shimmer * 0.54 +
        high * 0.12 +
        brightness * 0.18 +
        modulation * 0.08 +
        sourceHintEvidence.airMotion * 0.08) *
        (0.84 + tuning.atmosphere * 0.16 + tuning.radiance * 0.1)
    );
    const air = damp(this.frame.air, airTarget, 4.8, deltaSeconds);

    const accentTarget = clamp01(
      (transientConfidence * (0.76 + tuning.beatDrive * 0.08) +
        sourceHintEvidence.percussion * 0.07) *
        beatScale *
        tuning.accentStrength -
        humRejection * 0.42 -
        speech * 0.16
    );
    const accent = damp(
      this.frame.accent,
      accentTarget,
      accentTarget > this.frame.accent ? 15 : 6.6,
      deltaSeconds
    );

    const presenceTarget = clamp01(
      Math.max(
        ambienceConfidence * 0.42 + roomness * 0.2,
        body * 0.46 +
          air * 0.28 +
          accent * 0.22 +
          speech * 0.16 +
          musicTrend * 0.18
      )
    );
    const presence = damp(
      this.frame.presence,
      presenceTarget,
      3.6,
      deltaSeconds
    );

    const momentumTarget = clamp01(
      body * 0.34 +
        accent * 0.16 +
        musicTrend * 0.24 +
        transientConfidence * 0.08 +
        shimmer * 0.06
    );
    const momentum = damp(
      this.frame.momentum,
      momentumTarget,
      momentumTarget > this.frame.momentum ? 2.8 : 0.84,
      deltaSeconds
    );

    const phraseTensionTarget = clamp01(
      musicTrend * 0.36 +
        body * 0.18 +
        momentum * 0.2 +
        roughness * 0.08 +
        accent * 0.08 +
        tonalStability * 0.1 +
        sourceHintEvidence.highSweep * 0.07
    );
    const phraseTension = damp(
      this.frame.phraseTension,
      phraseTensionTarget,
      phraseTensionTarget > this.frame.phraseTension ? 1.7 : 0.42,
      deltaSeconds
    );

    const resonanceFreshness = clamp01(
      transientConfidence * 0.38 +
        accent * 0.24 +
        highFlux * 0.12 +
        lowFlux * 0.08 +
        momentum * 0.14
    );
    const resonanceCarry = clamp01(
      this.frame.resonance * (0.015 + resonanceFreshness * 0.11)
    );
    const staleResonancePressure = clamp01((0.22 - resonanceFreshness) * 3.2);
    const resonanceTarget = clamp01(
      body * 0.44 +
        musicTrend * 0.16 +
        roomness * 0.09 +
        momentum * 0.08 +
        phraseTension * 0.06 +
        accent * 0.07 +
        transientConfidence * 0.04 +
        resonanceCarry -
        this.frame.resonance * staleResonancePressure * 0.16
    );
    const resonance = damp(
      this.frame.resonance,
      resonanceTarget,
      resonanceTarget > this.frame.resonance ? 2.2 : 1.34,
      deltaSeconds
    );

    const musicConfidence = clamp01(
      musicTrend * 0.62 +
        body * 0.16 +
        tonalStability * 0.08 +
        phraseTension * 0.1 +
        bassBody * 0.04
    );
    const peakConfidence = clamp01(
      musicConfidence * 0.46 +
        phraseTension * 0.24 +
        accent * 0.1 +
        resonance * 0.08 +
        bassBody * 0.06 +
        transientConfidence * 0.06
    );
    const roomOperatorIntent = clamp01(
      tuning.sensitivity * 0.18 +
        tuning.inputGain * 0.14 +
        tuning.beatDrive * 0.18 +
        tuning.eventRate * 0.18 +
        tuning.energy * 0.14 +
        tuning.eventfulness * 0.1 +
        tuning.worldActivity * 0.08
    );
    const roomMusicDrive = clamp01(
      mode === 'room-mic'
        ? musicConfidence * 0.42 +
            roomMusicSignature * 0.18 +
            body * 0.16 +
            tonalStability * 0.1 +
            momentum * 0.12 +
            presence * 0.08 +
            roomOperatorIntent * 0.16 -
            speechConfidence * 0.26 -
            humRejection * 0.18
        : 0
    );
    const roomMusicFloorActive =
      mode === 'room-mic' &&
      roomMusicDrive > 0.22 &&
      musicConfidence > 0.14 &&
      speechConfidence < 0.3 &&
      humRejection < 0.62 &&
      (body > 0.1 || resonance > 0.14 || momentum > 0.1);
    const previousMusicConfidence = this.frame.musicConfidence;
    const previousTransientConfidence = this.frame.transientConfidence;
    const previousPeakConfidence = this.frame.peakConfidence;
    const previousPhraseTension = this.frame.phraseTension;
    const previousReleaseTail = this.frame.releaseTail;
    const previousSectionChange = this.frame.sectionChange;
    const previousBeatConfidence = this.frame.beatConfidence;
    const releaseEvidence = clamp01(
      Math.max(0, previousMusicConfidence - musicConfidence) * 0.34 +
        Math.max(0, previousTransientConfidence - transientConfidence) * 0.24 +
        Math.max(0, previousPeakConfidence - peakConfidence) * 0.16 +
        Math.max(0, previousPhraseTension - phraseTension) * 0.18 +
        sourceHintEvidence.silenceAir * 0.08 +
        previousReleaseTail * 0.3 +
        previousSectionChange * 0.12
    );
    const aftermathEntryEvidence = clamp01(
      releaseEvidence * 0.52 +
        previousSectionChange * 0.16 +
        previousBeatConfidence * 0.1 +
        transientConfidence * 0.08 +
        Math.max(0, 0.58 - musicConfidence) * 0.08 +
        Math.max(0, 0.46 - peakConfidence) * 0.06
    );
    const aftermathExitPressure = clamp01(
      previousBeatConfidence * 0.22 +
        previousSectionChange * 0.2 +
        transientConfidence * 0.18 +
        phraseTension * 0.16 +
        musicConfidence * 0.12 +
        releaseEvidence * 0.24
    );
    const semanticBrightness = clamp01(brightness * 0.62 + shimmer * 0.38);
    const confidence = clamp01(
      (analysis.clipped ? 0.56 : 0.98) * (rawPathGranted ? 1 : 0.74)
    );

    const previousState = this.frame.state;
    const previousShowState = this.frame.showState;
    const surgeAgeMs = Number.isFinite(this.lastSurgeMs)
      ? analysis.timestampMs - this.lastSurgeMs
      : Infinity;
    const recentQualifiedSectionAgeMs = Number.isFinite(this.lastQualifiedSectionMs)
      ? analysis.timestampMs - this.lastQualifiedSectionMs
      : Infinity;
    const { state, reason: stateReason } = this.resolveState({
      timestampMs: analysis.timestampMs,
      previousState,
      presence,
      body,
      roomness,
      resonance,
      speech,
      musicConfidence,
      momentum
    });
    const { showState, reason: showStateReason } = this.resolveShowState({
      timestampMs: analysis.timestampMs,
      mode,
      sourceAggression,
      previousShowState,
      surgeAgeMs,
      aftermathDwellMs: this.aftermathDwellMs,
      hauntDwellMs: this.hauntDwellMs,
      ambienceConfidence,
      speechConfidence,
      transientConfidence,
      beatConfidence: previousBeatConfidence,
      musicConfidence,
      peakConfidence,
      resonance,
      phraseTension,
      sectionChange: previousSectionChange,
      releaseEvidence,
      aftermathEntryEvidence,
      aftermathExitPressure,
      roomMusicFloorActive,
      roomMusicDrive,
      recentQualifiedSectionAgeMs
    });
    const moment = this.resolveMoment({
      timestampMs: analysis.timestampMs,
      previousShowState,
      showState,
      accent,
      musicConfidence,
      peakConfidence,
      beatConfidence: previousBeatConfidence,
      phraseTension,
      resonance,
      sectionChange: previousSectionChange,
      releaseEvidence,
      aftermathDwellMs: this.aftermathDwellMs
    });
    const conductor = this.resolveConductor({
      timestampMs: analysis.timestampMs,
      deltaSeconds,
      surgeAgeMs,
      peak,
      fast,
      slow,
      lowFlux,
      musicTrend,
      subPressure,
      bassBody,
      lowMidBody,
      accent,
      transientConfidence,
      musicConfidence,
      peakConfidence,
      phraseTension,
      resonance,
      momentum,
      moment,
      showState,
      previousShowState,
      sourceAggression,
      mode,
      humRejection,
      speech,
      releaseEvidence,
      sourcePercussionEvidence: sourceHintEvidence.percussion,
      sourceBassEvidence: sourceHintEvidence.bassSource,
      sourceHighSweepEvidence: sourceHintEvidence.highSweep,
      sourceSilenceAirEvidence: sourceHintEvidence.silenceAir,
      aftermathDwellMs: this.aftermathDwellMs,
      hauntDwellMs: this.hauntDwellMs,
      roomMusicFloorActive,
      roomMusicDrive,
      recentQualifiedSectionAgeMs
    });

    if ((showState === 'generative' || showState === 'surge') && previousShowState !== showState) {
      this.lastGenerativeMs = analysis.timestampMs;
    }

    if (showState === 'surge' && previousShowState !== 'surge') {
      this.lastSurgeMs = analysis.timestampMs;
    }

    this.aftermathDwellMs =
      showState === 'aftermath' ? this.aftermathDwellMs + deltaSeconds * 1000 : 0;
    this.hauntDwellMs =
      conductor.performanceIntent === 'haunt'
        ? this.hauntDwellMs + deltaSeconds * 1000
        : 0;
    const qualifiedSection =
      showState === 'surge' ||
      conductor.performanceIntent === 'detonate' ||
      (conductor.performanceIntent === 'ignite' &&
        musicConfidence > 0.34 &&
        phraseTension > 0.22) ||
      conductor.dropImpact > 0.18 ||
      conductor.sectionChange > 0.22;
    if (qualifiedSection) {
      this.lastQualifiedSectionMs = analysis.timestampMs;
    }

    this.frame = {
      timestampMs: analysis.timestampMs,
      mode,
      calibrated: true,
      confidence,
      clipped: analysis.clipped,
      subPressure,
      bassBody,
      lowMidBody,
      presence,
      body,
      air,
      shimmer,
      accent,
      brightness: semanticBrightness,
      roughness,
      tonalStability,
      harmonicColor,
      phraseTension,
      resonance,
      speech,
      roomness,
      ambienceConfidence,
      speechConfidence,
      transientConfidence,
      musicConfidence,
      peakConfidence,
      momentum,
      beatConfidence: conductor.beatConfidence,
      beatIntervalMs: conductor.beatIntervalMs,
      beatStability: this.beatStability,
      beatPhase: conductor.beatPhase,
      barPhase: conductor.barPhase,
      phrasePhase: conductor.phrasePhase,
      preDropTension: conductor.preDropTension,
      dropImpact: conductor.dropImpact,
      sectionChange: conductor.sectionChange,
      releaseTail: conductor.releaseTail,
      sourceHintConfidence: sourceHintEvidence.confidence,
      percussionEvidence: sourceHintEvidence.percussion,
      bassSourceEvidence: sourceHintEvidence.bassSource,
      airMotionEvidence: sourceHintEvidence.airMotion,
      state,
      showState,
      momentKind: moment.kind,
      momentAmount: moment.amount,
      performanceIntent: conductor.performanceIntent
    };

    this.diagnostics = {
      humRejection,
      musicTrend,
      silenceGate,
      beatIntervalMs: conductor.beatIntervalMs,
      roomMusicFloorActive,
      roomMusicDrive,
      aftermathEntryEvidence,
      aftermathExitPressure,
      stateReason,
      showStateReason,
      momentReason: moment.reason,
      conductorReason: conductor.reason
    };

    return {
      frame: this.frame,
      diagnostics: this.diagnostics
    };
  }

  private resolveSourceHintEvidence(input: {
    frame?: SourceHintFrame;
    mode: ListeningMode;
    runtimeMode?: SourceHintRuntimeMode;
    humRejection: number;
    speechConfidence: number;
    clipped: boolean;
  }): SourceHintEvidence {
    if (!input.frame || input.runtimeMode !== 'active') {
      return {
        confidence: 0,
        percussion: 0,
        bassSource: 0,
        airMotion: 0,
        highSweep: 0,
        silenceAir: 0
      };
    }

    const modeCap =
      input.mode === 'system-audio' ? 1 : input.mode === 'hybrid' ? 0.56 : 0.38;
    const sourceConfidence = input.frame.confidence * modeCap;
    const speechPresence = hintSignal(input.frame, 'speechPresenceCandidate');
    const suppressionCodes = new Set(input.frame.suppressionCodes);
    const noiseSuppression = clamp01(
      (suppressionCodes.has('hiss-like') ? 0.28 : 0) +
        (suppressionCodes.has('dense-noise') ? 0.22 : 0) +
        (input.clipped || suppressionCodes.has('clip-risk') ? 0.3 : 0)
    );
    const percussionSuppression = clamp01(
      input.humRejection * 0.28 +
        input.speechConfidence * 0.22 +
        speechPresence * 0.32 +
        noiseSuppression
    );
    const bassSuppression = clamp01(
      input.humRejection * 0.34 +
        (suppressionCodes.has('hum-risk') || suppressionCodes.has('steady-low-hum-risk') ? 0.28 : 0) +
        (input.mode === 'room-mic' ? 0.18 : 0)
    );
    const airSuppression = clamp01(
      noiseSuppression * 0.72 +
        (suppressionCodes.has('hiss-like') ? 0.26 : 0) +
        input.speechConfidence * 0.1
    );

    const percussion = clamp01(
      Math.max(
        hintSignal(input.frame, 'lowImpactCandidate'),
        hintSignal(input.frame, 'percussiveSnap') * 0.86,
        hintSignal(input.frame, 'broadbandHit') * 0.72
      ) *
        modeCap *
        (1 - percussionSuppression)
    );
    const bassSource = clamp01(
      Math.max(
        hintSignal(input.frame, 'bassBodySupport') * 0.9,
        hintSignal(input.frame, 'subSustain') * 0.72
      ) *
        modeCap *
        (1 - bassSuppression)
    );
    const airMotion = clamp01(
      hintSignal(input.frame, 'airMotion') * modeCap * (1 - airSuppression)
    );
    const highSweep = clamp01(
      hintSignal(input.frame, 'highSweepCandidate') *
        modeCap *
        (1 - airSuppression * 0.74)
    );
    const silenceAir = clamp01(
      hintSignal(input.frame, 'silenceAir') *
        modeCap *
        (1 - Math.max(noiseSuppression * 0.48, speechPresence * 0.22))
    );

    return {
      confidence: clamp01(sourceConfidence),
      percussion,
      bassSource,
      airMotion,
      highSweep,
      silenceAir
    };
  }

  private computeDeltaSeconds(timestampMs: number): number {
    if (this.lastTimestampMs <= 0) {
      this.lastTimestampMs = timestampMs;

      return 0.016;
    }

    const delta = Math.max(0.016, (timestampMs - this.lastTimestampMs) / 1000);
    this.lastTimestampMs = timestampMs;

    return Math.min(delta, 0.1);
  }

  private resolveConductor(input: {
    timestampMs: number;
    deltaSeconds: number;
    surgeAgeMs: number;
    peak: number;
    fast: number;
    slow: number;
    lowFlux: number;
    musicTrend: number;
    subPressure: number;
    bassBody: number;
    lowMidBody: number;
    accent: number;
    transientConfidence: number;
    musicConfidence: number;
    peakConfidence: number;
    phraseTension: number;
    resonance: number;
    momentum: number;
    moment: MomentState;
    showState: ShowState;
    previousShowState: ShowState;
    sourceAggression: number;
    mode: ListeningMode;
    roomMusicFloorActive: boolean;
    roomMusicDrive: number;
    recentQualifiedSectionAgeMs: number;
    humRejection: number;
    speech: number;
    releaseEvidence: number;
    sourcePercussionEvidence: number;
    sourceBassEvidence: number;
    sourceHighSweepEvidence: number;
    sourceSilenceAirEvidence: number;
    aftermathDwellMs: number;
    hauntDwellMs: number;
  }): {
    beatConfidence: number;
    beatPhase: number;
    barPhase: number;
    phrasePhase: number;
    preDropTension: number;
    dropImpact: number;
    sectionChange: number;
    releaseTail: number;
    beatIntervalMs: number;
    performanceIntent: PerformanceIntent;
    reason: string;
  } {
    const beatCandidate = clamp01(
      input.subPressure * 0.28 +
        input.bassBody * 0.24 +
        input.lowMidBody * 0.06 +
        input.transientConfidence * 0.2 +
        input.lowFlux * 0.14 +
        Math.max(0, input.fast - input.slow) * 0.1 +
        input.peak * 0.08 +
        input.sourcePercussionEvidence * 0.02 +
        input.sourceBassEvidence * 0.04 -
        input.humRejection * (0.18 - input.sourceAggression * 0.06) -
        input.speech * (0.08 - input.sourceAggression * 0.03) +
        input.sourceAggression * 0.04
    );
    const sinceBeat =
      this.lastBeatMs > 0 ? input.timestampMs - this.lastBeatMs : Infinity;
    const canTriggerBeat =
      input.musicConfidence > 0.2 &&
      beatCandidate > 0.32 - input.sourceAggression * 0.06 &&
      sinceBeat > 180 &&
      (input.transientConfidence > 0.24 ||
        input.subPressure > 0.18 ||
        input.sourcePercussionEvidence > 0.34);

    let beatTriggered = false;
    if (canTriggerBeat) {
      if (Number.isFinite(sinceBeat) && sinceBeat > 220 && sinceBeat < 900) {
        const intervalDelta = Math.abs(sinceBeat - this.beatIntervalMs);
        const intervalConsistency = clamp01(1 - intervalDelta / this.beatIntervalMs);
        this.beatIntervalMs = this.beatIntervalMs * 0.72 + sinceBeat * 0.28;
        this.beatStability = damp(
          this.beatStability,
          intervalConsistency,
          intervalConsistency > this.beatStability ? 4.2 : 1.8,
          input.deltaSeconds
        );
      } else {
        this.beatStability = damp(
          this.beatStability,
          0.18,
          1.4,
          input.deltaSeconds
        );
      }

      this.lastBeatMs = input.timestampMs;
      this.beatCounter += 1;
      beatTriggered = true;
    } else {
      const beatStabilityTarget =
        input.musicConfidence > 0.28 && sinceBeat < this.beatIntervalMs * 1.5
          ? this.beatStability
          : 0;
      this.beatStability = damp(
        this.beatStability,
        beatStabilityTarget,
        0.9,
        input.deltaSeconds
      );
    }

    const safeBeatInterval = Math.max(260, this.beatIntervalMs);
    const elapsedBeatMs =
      this.lastBeatMs > 0 ? input.timestampMs - this.lastBeatMs : safeBeatInterval;
    const rawBeatPhase = clamp01(elapsedBeatMs / safeBeatInterval);
    const beatPhase = beatTriggered ? 0 : rawBeatPhase;
    const beatProgress = this.beatCounter + beatPhase;
    const barPhase = (beatProgress % 4) / 4;
    const phrasePhase = (beatProgress % 16) / 16;
    const boundaryPulse = (phase: number, width: number) =>
      clamp01(1 - Math.min(phase, 1 - phase) / width);
    const barBoundary = boundaryPulse(barPhase, 0.16);
    const phraseBoundary = boundaryPulse(phrasePhase, 0.18);

    const beatConfidence = clamp01(
      this.beatStability * 0.54 +
        input.musicConfidence * 0.22 +
        input.bassBody * 0.1 +
        input.subPressure * 0.08 +
        input.transientConfidence * 0.06 +
        input.sourcePercussionEvidence * 0.04 +
        input.sourceBassEvidence * 0.03
    );

    const phraseBoundaryApproach = clamp01((phrasePhase - 0.66) / 0.26);
    const preDropTarget = clamp01(
      input.phraseTension * 0.34 +
        input.momentum * 0.2 +
        input.musicConfidence * 0.14 +
        beatConfidence * 0.1 +
        phraseBoundaryApproach * 0.18 +
        phraseBoundary * 0.14 +
        input.subPressure * 0.08 +
        input.sourceHighSweepEvidence * 0.08 +
        input.sourceAggression * 0.04
    );
    const preDropTension = damp(
      this.preDropMemory,
      preDropTarget,
      preDropTarget > this.preDropMemory ? 1.9 : 0.46,
      input.deltaSeconds
    );
    this.preDropMemory = preDropTension;

    const dropTriggered =
      beatTriggered &&
      (preDropTension > 0.42 - input.sourceAggression * 0.1 ||
        (beatConfidence > 0.24 - input.sourceAggression * 0.05 &&
          input.peakConfidence > 0.4 - input.sourceAggression * 0.06 &&
          input.musicConfidence > 0.32 - input.sourceAggression * 0.05 &&
          input.phraseTension > 0.26) ||
        (input.showState === 'surge' &&
          input.previousShowState !== 'surge' &&
          input.peakConfidence > 0.54 - input.sourceAggression * 0.08) ||
        (input.moment.kind === 'lift' && input.peakConfidence > 0.38));
    const dropTarget = dropTriggered
      ? clamp01(
          input.peakConfidence * 0.26 +
            beatCandidate * 0.2 +
            input.subPressure * 0.18 +
            preDropTension * 0.16 +
            beatConfidence * 0.14 +
            input.accent * 0.06 +
            input.momentum * 0.08 +
            input.sourceAggression * 0.12
        )
      : 0;
    const dropImpact = damp(
      this.dropMemory,
      dropTarget,
      dropTarget > this.dropMemory ? 13 : 2.5,
      input.deltaSeconds
    );
    this.dropMemory = dropImpact;

    const sectionChangeTriggered =
      dropTriggered ||
      (input.showState !== input.previousShowState &&
        (input.showState === 'surge' ||
          input.showState === 'generative' ||
          input.showState === 'aftermath')) ||
      (beatTriggered &&
        phraseBoundary > 0.72 &&
        input.musicConfidence > 0.34 &&
        input.phraseTension > 0.3);
    const sectionTarget = sectionChangeTriggered
      ? clamp01(
          dropImpact * 0.5 +
          input.peakConfidence * 0.16 +
          input.resonance * 0.08 +
          input.phraseTension * 0.18 +
          beatConfidence * 0.08 +
          phraseBoundary * 0.16 +
          barBoundary * 0.06 +
          input.sourceAggression * 0.04
        )
      : 0;
    const sectionChange = damp(
      this.sectionMemory,
      sectionTarget,
      sectionTarget > this.sectionMemory ? 5.6 : 1.18,
      input.deltaSeconds
    );
    this.sectionMemory = sectionChange;

    const releaseSource =
      input.moment.kind === 'release'
        ? clamp01(
            input.resonance * 0.46 +
              input.musicConfidence * 0.18 +
              input.phraseTension * 0.12 +
              sectionChange * 0.18 +
              input.releaseEvidence * 0.18 +
              input.sourceSilenceAirEvidence * 0.08
          )
        : input.showState === 'aftermath'
          ? clamp01(
              input.resonance * 0.24 +
                sectionChange * 0.18 +
                phraseBoundary * 0.12 +
                barBoundary * 0.06 +
                input.releaseEvidence * 0.22 +
                input.sourceSilenceAirEvidence * 0.1
            )
          : 0;
    const releaseTail = damp(
      this.releaseMemory,
      releaseSource,
      releaseSource > this.releaseMemory ? 2.6 : 0.42,
      input.deltaSeconds
    );
    this.releaseMemory = releaseTail;

    const { performanceIntent, reason } = this.resolvePerformanceIntent({
      showState: input.showState,
      sourceAggression: input.sourceAggression,
      mode: input.mode,
      roomMusicFloorActive: input.roomMusicFloorActive,
      roomMusicDrive: input.roomMusicDrive,
      recentQualifiedSectionAgeMs: input.recentQualifiedSectionAgeMs,
      musicConfidence: input.musicConfidence,
      beatConfidence,
      surgeAgeMs: input.surgeAgeMs,
      preDropTension,
      dropImpact,
      sectionChange,
      releaseTail,
      phraseTension: input.phraseTension,
      releaseEvidence: input.releaseEvidence,
      aftermathDwellMs: input.aftermathDwellMs,
      hauntDwellMs: input.hauntDwellMs
    });

    return {
      beatConfidence,
      beatPhase,
      barPhase,
      phrasePhase,
      preDropTension,
      dropImpact,
      sectionChange,
      releaseTail,
      beatIntervalMs: Number.isFinite(this.lastBeatMs)
        ? safeBeatInterval
        : 0,
      performanceIntent,
      reason
    };
  }

  private resolvePerformanceIntent(input: {
    showState: ShowState;
    sourceAggression: number;
    mode: ListeningMode;
    roomMusicFloorActive: boolean;
    roomMusicDrive: number;
    recentQualifiedSectionAgeMs: number;
    musicConfidence: number;
    beatConfidence: number;
    surgeAgeMs: number;
    preDropTension: number;
    dropImpact: number;
    sectionChange: number;
    releaseTail: number;
    phraseTension: number;
    releaseEvidence: number;
    aftermathDwellMs: number;
    hauntDwellMs: number;
  }): { performanceIntent: PerformanceIntent; reason: string } {
    const roomFloorGhostSuppressed =
      input.mode === 'room-mic' &&
      input.roomMusicFloorActive &&
      input.releaseEvidence < 0.24 &&
      input.releaseTail < 0.28 &&
      input.sectionChange < 0.2 &&
      input.recentQualifiedSectionAgeMs > 2200;
    const releaseCarrySuppression =
      input.showState !== 'surge' &&
      Number.isFinite(input.surgeAgeMs) &&
      input.surgeAgeMs > 900 &&
      (input.releaseEvidence > 0.14 || input.releaseTail > 0.16) &&
      input.sectionChange < 0.42;
    const detonateImpact =
      input.dropImpact > 0.42 - input.sourceAggression * 0.04 ||
      input.sectionChange > 0.46 - input.sourceAggression * 0.04;

    if (
      !releaseCarrySuppression &&
      ((input.showState === 'surge' && detonateImpact) ||
        input.dropImpact > 0.58 - input.sourceAggression * 0.04 ||
        input.sectionChange > 0.58 - input.sourceAggression * 0.04 ||
        (input.showState === 'surge' &&
          input.surgeAgeMs < 2200 &&
          input.beatConfidence > 0.3 - input.sourceAggression * 0.03 &&
          input.phraseTension > 0.44 - input.sourceAggression * 0.04 &&
          (input.dropImpact > 0.16 || input.preDropTension > 0.34)))
    ) {
      return {
        performanceIntent: 'detonate',
        reason: 'A beat-aligned impact or section handoff deserves a full-scene detonation.'
      };
    }

    if (
      roomFloorGhostSuppressed &&
      (input.showState === 'aftermath' || input.showState === 'generative')
    ) {
      return {
        performanceIntent:
          input.roomMusicDrive > 0.34 ||
          input.musicConfidence > 0.3 ||
          input.beatConfidence > 0.16
            ? 'gather'
            : 'hold',
        reason:
          'Quiet room music is still structurally present, so the scene should gather instead of hardening into haunt.'
      };
    }

    if (
      input.hauntDwellMs > 5200 &&
      input.releaseTail > 0.12 &&
      input.releaseEvidence < 0.24 &&
      input.musicConfidence > 0.28
    ) {
      return {
        performanceIntent:
          input.beatConfidence > 0.34 || input.musicConfidence > 0.36 ? 'gather' : 'hold',
        reason:
          'Ghost-state linger has gone stale without fresh release evidence, so it should demote.'
      };
    }

    if (
      input.mode === 'system-audio' &&
      input.showState === 'aftermath' &&
      input.aftermathDwellMs > 1800 &&
      input.musicConfidence > 0.34 &&
      (input.beatConfidence > 0.24 || input.phraseTension > 0.28) &&
      input.dropImpact < 0.42
    ) {
      return {
        performanceIntent:
          input.beatConfidence > 0.38 || input.phraseTension > 0.36
            ? 'ignite'
            : 'gather',
        reason:
          'Direct system audio is still musically structured after the release, so recovery should stay active instead of settling into haunt.'
      };
    }

    const aftermathEligible =
      (input.showState === 'aftermath' ||
        input.aftermathDwellMs > 1200 ||
        input.releaseEvidence > 0.2) &&
      input.surgeAgeMs > 1200 &&
      (input.mode !== 'room-mic' ||
        input.releaseEvidence > 0.18 ||
        input.releaseTail > 0.22 ||
        input.sectionChange > 0.18 ||
        input.recentQualifiedSectionAgeMs < 2400) &&
      (input.releaseEvidence > 0.18 ||
        input.releaseTail > 0.14 ||
        input.aftermathDwellMs < 2200);
    const hauntEligible =
      input.releaseTail > 0.18 &&
      input.dropImpact < 0.24 &&
      input.sectionChange < 0.3 &&
      input.beatConfidence < 0.38 &&
      input.preDropTension < 0.32 &&
      input.surgeAgeMs > 1600 &&
      (input.releaseEvidence > 0.2 || input.aftermathDwellMs < 1800);

    if (!roomFloorGhostSuppressed && (aftermathEligible || hauntEligible)) {
      return {
        performanceIntent: 'haunt',
        reason: 'The section has released and the scene should stay with the ghost of it.'
      };
    }

    const structuredIgniteEligible =
      (input.showState === 'generative' || input.showState === 'tactile') &&
      input.musicConfidence > 0.34 - input.sourceAggression * 0.04 &&
      input.beatConfidence > 0.14 - input.sourceAggression * 0.03 &&
      input.phraseTension > 0.18 - input.sourceAggression * 0.03 &&
      (input.preDropTension > 0.12 ||
        input.sectionChange > 0.1 ||
        input.dropImpact > 0.1 ||
        input.surgeAgeMs < 1800);

    if (structuredIgniteEligible) {
      return {
        performanceIntent: 'ignite',
        reason:
          'The music is structured and animated enough to promote stronger scene motion before a full detonation.'
      };
    }

    if (
      input.preDropTension > 0.42 - input.sourceAggression * 0.05 ||
      (input.showState === 'surge' &&
        input.surgeAgeMs < 2800 &&
        input.beatConfidence > 0.22 - input.sourceAggression * 0.03 &&
        (input.preDropTension > 0.18 || input.sectionChange > 0.12)) ||
      (input.sourceAggression > 0.4 &&
        input.musicConfidence > 0.34 &&
        input.beatConfidence > 0.18 &&
        input.phraseTension > 0.22 &&
        (input.preDropTension > 0.2 || input.sectionChange > 0.2)) ||
      (input.beatConfidence > 0.24 - input.sourceAggression * 0.03 &&
        input.musicConfidence > 0.36 - input.sourceAggression * 0.04 &&
        input.phraseTension > 0.26 - input.sourceAggression * 0.03 &&
        (input.preDropTension > 0.2 || input.sectionChange > 0.2))
    ) {
      return {
        performanceIntent: 'ignite',
        reason: 'The music is gathering enough pressure to ignite stronger scene motion.'
      };
    }

    if (
      input.showState === 'generative' ||
      input.musicConfidence > 0.3 ||
      input.phraseTension > 0.24
    ) {
      return {
        performanceIntent: 'gather',
        reason: 'The system has enough musical structure to gather and organize the frame.'
      };
    }

    return {
      performanceIntent: 'hold',
      reason: 'The scene should stay composed and withhold larger consequences for now.'
    };
  }

  private resolveState(input: {
    timestampMs: number;
    previousState: ListeningState;
    presence: number;
    body: number;
    roomness: number;
    resonance: number;
    speech: number;
    musicConfidence: number;
    momentum: number;
  }): { state: ListeningState; reason: string } {
    const recentlyGenerative = input.timestampMs - this.lastGenerativeMs < 2600;

    if (
      input.previousState === 'settling' &&
      input.musicConfidence < 0.32 &&
      (input.resonance > 0.18 || recentlyGenerative)
    ) {
      return {
        state: 'settling',
        reason: 'The system is intentionally holding into a post-musical settling state.'
      };
    }

    if (
      (input.previousState === 'entrained' || input.previousState === 'blooming') &&
      input.musicConfidence < 0.34 &&
      input.resonance > 0.24 &&
      input.momentum < 0.4
    ) {
      return {
        state: 'settling',
        reason: 'Previous musical energy is decaying into afterglow.'
      };
    }

    if (
      input.musicConfidence > 0.58 &&
      (input.momentum > 0.5 || input.resonance > 0.56)
    ) {
      return {
        state: 'blooming',
        reason: 'Sustained music has accumulated enough pressure to bloom.'
      };
    }

    if (
      input.musicConfidence > 0.28 ||
      input.body > 0.22 ||
      (recentlyGenerative && input.resonance > 0.22)
    ) {
      return {
        state: 'entrained',
        reason: 'The room contains enough musical body for generative behavior.'
      };
    }

    if (
      input.presence > 0.1 ||
      input.roomness > 0.12 ||
      input.speech > 0.12 ||
      input.resonance > 0.16
    ) {
      return {
        state: 'aware',
        reason: 'The room is active enough to wake the object without full lock.'
      };
    }

    return {
      state: 'dormant',
      reason: 'The room is quiet enough for a suspended dormant state.'
    };
  }

  private resolveShowState(input: {
    timestampMs: number;
    mode: ListeningMode;
    previousShowState: ShowState;
    sourceAggression: number;
    surgeAgeMs: number;
    aftermathDwellMs: number;
    hauntDwellMs: number;
    ambienceConfidence: number;
    speechConfidence: number;
    transientConfidence: number;
    beatConfidence: number;
    musicConfidence: number;
    peakConfidence: number;
    resonance: number;
    phraseTension: number;
    sectionChange: number;
    releaseEvidence: number;
    aftermathEntryEvidence: number;
    aftermathExitPressure: number;
    roomMusicFloorActive: boolean;
    roomMusicDrive: number;
    recentQualifiedSectionAgeMs: number;
  }): { showState: ShowState; reason: string } {
    const recentlyGenerative = input.timestampMs - this.lastGenerativeMs < 2600;
    const surgeHoldWindowMs = 4200 - input.sourceAggression * 420;
    const recentQualifiedSection =
      input.recentQualifiedSectionAgeMs <
      (input.mode === 'room-mic' ? 2600 : 4200);
    const roomFloorNeedsRecovery =
      input.mode === 'room-mic' &&
      input.roomMusicFloorActive &&
      input.releaseEvidence < 0.16 &&
      input.sectionChange < 0.14 &&
      input.musicConfidence > 0.16 &&
      input.previousShowState !== 'surge' &&
      !recentQualifiedSection;
    const aftermathEligible =
      ((input.previousShowState === 'surge' ||
        input.previousShowState === 'aftermath' ||
        input.surgeAgeMs < 1800) &&
        input.resonance > 0.18 &&
        (input.musicConfidence < 0.56 ||
          input.surgeAgeMs > surgeHoldWindowMs ||
          (input.phraseTension < 0.36 && input.transientConfidence < 0.18)));

    if (roomFloorNeedsRecovery) {
      return {
        showState:
          input.transientConfidence > 0.26 && input.musicConfidence < 0.28
            ? 'tactile'
            : 'generative',
        reason:
          'Quiet room music is still present, so the system should stay musically alive instead of dropping into ghost aftermath.'
      };
    }

    if (
      aftermathEligible &&
      ((input.mode !== 'room-mic' &&
        (input.aftermathEntryEvidence > 0.24 ||
          input.aftermathDwellMs < 1600 ||
          (input.previousShowState === 'aftermath' &&
            input.aftermathExitPressure < 0.42))) ||
        (input.mode === 'room-mic' &&
          (input.aftermathEntryEvidence > 0.28 ||
            input.releaseEvidence > 0.16 ||
            input.sectionChange > 0.16 ||
            recentQualifiedSection ||
            (input.previousShowState === 'aftermath' &&
              input.aftermathExitPressure < 0.36)))) &&
      !input.roomMusicFloorActive
    ) {
      return {
        showState: 'aftermath',
        reason: 'The system is carrying ghost energy after a stronger musical section.'
      };
    }

    if (
      input.previousShowState === 'aftermath' &&
      input.aftermathDwellMs > 2200 &&
      input.aftermathExitPressure > 0.44 &&
      input.releaseEvidence < 0.28
    ) {
      return {
        showState:
          input.musicConfidence > 0.42 || input.beatConfidence > 0.34 || input.sectionChange > 0.2
            ? 'generative'
            : input.transientConfidence > 0.26
              ? 'tactile'
              : 'atmosphere',
        reason: 'Ghost-state pressure has gone stale enough to release back into active motion.'
      };
    }

    if (
      input.previousShowState === 'generative' &&
      input.musicConfidence <
        (input.mode === 'room-mic' ? 0.4 : 0.46) &&
      input.transientConfidence < 0.12 &&
      input.resonance > (input.mode === 'room-mic' ? 0.3 : 0.26) &&
      (input.releaseEvidence > (input.mode === 'room-mic' ? 0.14 : 0.08) ||
        input.sectionChange > (input.mode === 'room-mic' ? 0.14 : 0.08) ||
        recentQualifiedSection)
    ) {
      return {
        showState: 'aftermath',
        reason: 'The system is carrying ghost energy after a stronger musical section.'
      };
    }

    const surgePeakThreshold = 0.72 - input.sourceAggression * 0.08;
    const surgeMusicThreshold = 0.6 - input.sourceAggression * 0.05;
    const surgePhraseThreshold = 0.68 - input.sourceAggression * 0.05;
    const freshSurgeWindowOpen =
      input.previousShowState === 'surge'
        ? input.surgeAgeMs < surgeHoldWindowMs * 1.05
        : input.surgeAgeMs > 900 || !Number.isFinite(input.surgeAgeMs);
    const freshSurgeRhythmGate =
      input.beatConfidence > 0.38 - input.sourceAggression * 0.03 ||
      input.peakConfidence > 0.68 - input.sourceAggression * 0.04;
    const freshSurgeImpactGate =
      freshSurgeRhythmGate &&
      (input.transientConfidence > 0.6 - input.sourceAggression * 0.04 ||
        input.sectionChange > 0.52 - input.sourceAggression * 0.04 ||
        (input.peakConfidence > 0.7 - input.sourceAggression * 0.04 &&
          input.sectionChange > 0.28 - input.sourceAggression * 0.03));
    const freshSurgeEvidence =
      input.peakConfidence > surgePeakThreshold ||
      (input.musicConfidence > surgeMusicThreshold + 0.04 &&
        input.phraseTension > surgePhraseThreshold - 0.1 &&
        input.transientConfidence > 0.22 - input.sourceAggression * 0.03) ||
      (input.peakConfidence > 0.58 - input.sourceAggression * 0.06 &&
        input.resonance > 0.34 &&
        input.phraseTension > 0.44);
    const surgeSustainEvidence = clamp01(
      input.peakConfidence * 0.34 +
        input.transientConfidence * 0.28 +
        input.phraseTension * 0.22 +
        input.musicConfidence * 0.12 +
        Math.max(0, input.musicConfidence - input.resonance) * 0.14
    );

    if (
      (freshSurgeEvidence &&
        freshSurgeWindowOpen &&
        freshSurgeImpactGate &&
        (input.transientConfidence > 0.2 - input.sourceAggression * 0.03 ||
          input.resonance > 0.36)) ||
      (input.musicConfidence > surgeMusicThreshold &&
        input.phraseTension > surgePhraseThreshold &&
        input.transientConfidence > 0.2 - input.sourceAggression * 0.03 &&
        freshSurgeWindowOpen &&
        freshSurgeImpactGate)
    ) {
      return {
        showState: 'surge',
        reason: 'The room has entered a peak musical section with enough tension to surge.'
      };
    }

    if (
      input.previousShowState === 'surge' &&
      input.surgeAgeMs < surgeHoldWindowMs &&
      surgeSustainEvidence > 0.42 - input.sourceAggression * 0.04 &&
      (input.beatConfidence > 0.38 - input.sourceAggression * 0.03 ||
        input.transientConfidence > 0.52 - input.sourceAggression * 0.04 ||
        input.peakConfidence > 0.74 - input.sourceAggression * 0.04) &&
      ((input.peakConfidence > 0.6 - input.sourceAggression * 0.04 &&
        input.phraseTension > 0.44 - input.sourceAggression * 0.04 &&
        input.transientConfidence > 0.18) ||
        (input.musicConfidence > 0.58 - input.sourceAggression * 0.04 &&
          input.peakConfidence > 0.4 &&
          input.transientConfidence > 0.22 &&
          input.phraseTension > 0.42)) &&
      (input.surgeAgeMs < 2200 ||
        input.peakConfidence > 0.66 - input.sourceAggression * 0.04 ||
        input.transientConfidence > 0.28 - input.sourceAggression * 0.03)
    ) {
      return {
        showState: 'surge',
        reason: 'The previous surge still has enough pressure to hold.'
      };
    }

    const roomFloorGenerative =
      input.mode === 'room-mic' &&
      input.roomMusicFloorActive &&
      input.speechConfidence < 0.2 &&
      input.musicConfidence > 0.16 &&
      (input.roomMusicDrive > 0.18 ||
        input.beatConfidence > 0.04 ||
        input.phraseTension > 0.14);

    if (roomFloorGenerative) {
      return {
        showState: 'generative',
        reason:
          'Quiet room music is still persistent and structured enough to sustain readable generative motion.'
      };
    }

    if (
      input.speechConfidence > 0.24 &&
      input.peakConfidence < 0.48 &&
      input.speechConfidence >= input.musicConfidence * 0.84 &&
      input.speechConfidence >= input.transientConfidence * 0.86
    ) {
      return {
        showState: 'cadence',
        reason: 'Speech cadence is leading the system right now.'
      };
    }

    if (
      input.musicConfidence > 0.3 ||
      (recentlyGenerative &&
        input.musicConfidence > 0.22 &&
        input.phraseTension > 0.18)
    ) {
      return {
        showState: 'generative',
        reason: 'Ongoing musical structure is driving full generative behavior.'
      };
    }

    if (
      input.transientConfidence > 0.32 &&
      input.musicConfidence < 0.3 &&
      input.transientConfidence >= input.speechConfidence * 0.96
    ) {
      return {
        showState: 'tactile',
        reason: 'Short impacts are currently the strongest readable signal.'
      };
    }

    if (input.ambienceConfidence > 0.08 || input.resonance > 0.12) {
      return {
        showState: 'atmosphere',
        reason: 'The room is quiet but alive enough for atmospheric behavior.'
      };
    }

    return {
      showState: 'void',
      reason: 'The room is suspended enough for a hush / void posture.'
    };
  }

  private resolveMoment(input: {
    timestampMs: number;
    previousShowState: ShowState;
    showState: ShowState;
    accent: number;
    musicConfidence: number;
    peakConfidence: number;
    beatConfidence: number;
    phraseTension: number;
    resonance: number;
    sectionChange: number;
    releaseEvidence: number;
    aftermathDwellMs: number;
  }): MomentState {
    if (
      input.showState === 'surge' &&
      input.previousShowState !== 'surge' &&
      input.timestampMs - this.lastLiftMs > 6500
    ) {
      this.lastLiftMs = input.timestampMs;

      return {
        kind: 'lift',
        amount: clamp01(input.peakConfidence * 0.7 + input.phraseTension * 0.3),
        reason: 'A surge state just ignited after a phrase build.'
      };
    }

    if (
      input.accent > 0.28 &&
      input.timestampMs - this.lastStrikeMs > 320
    ) {
      this.lastStrikeMs = input.timestampMs;

      return {
        kind: 'strike',
        amount: clamp01(input.accent * 0.84 + input.peakConfidence * 0.16),
        reason: 'A tactile or percussive impact deserves a visible strike.'
      };
    }

    if (
      input.showState === 'aftermath' &&
      (input.previousShowState !== 'aftermath' ||
        input.releaseEvidence > 0.02 ||
        input.aftermathDwellMs > 4200) &&
      (input.sectionChange > 0.05 ||
        input.beatConfidence > 0.1 ||
        input.musicConfidence > 0.16 ||
        input.previousShowState !== 'aftermath') &&
      input.resonance > 0.12 &&
      input.timestampMs -
        this.lastReleaseMs >=
        (input.aftermathDwellMs > 3200 ? 1000 : 1500)
    ) {
      this.lastReleaseMs = input.timestampMs;

      return {
        kind: 'release',
        amount: clamp01(
          input.resonance * 0.42 +
            input.musicConfidence * 0.24 +
            input.phraseTension * 0.16 +
            input.releaseEvidence * 0.18
        ),
        reason: 'A fresh release window surfaced inside or after the ghost state.'
      };
    }

    return {
      kind: 'none',
      amount: 0,
      reason: 'No active moment.'
    };
  }
}
