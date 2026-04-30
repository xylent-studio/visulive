import type {
  AnalysisFrame,
  ListeningMode,
  SourceHint,
  SourceHintFrame,
  SourceHintId,
  SourceHintRuntimeMode,
  SpectrumBandId,
  SpectrumFrame,
} from '../types/audio';
import { clamp01 } from './audioMath';
import { getSpectrumBand } from './spectrumBands';

export const SOURCE_HINT_IDS: readonly SourceHintId[] = [
  'lowImpactCandidate',
  'subSustain',
  'bassBodySupport',
  'percussiveSnap',
  'airMotion',
  'speechPresenceCandidate',
  'highSweepCandidate',
  'tonalLift',
  'silenceAir',
  'broadbandHit',
];

type HintState = Record<SourceHintId, number>;

export interface SourceHintUpdateInput {
  analysis: AnalysisFrame;
  spectrumFrame: SpectrumFrame;
  mode: ListeningMode;
  runtimeMode: SourceHintRuntimeMode;
  calibrated?: boolean;
}

interface HintRecipe {
  id: SourceHintId;
  value: number;
  confidence: number;
  reasonCodes: string[];
  suppressionCodes: string[];
}

const INITIAL_HINT_STATE: HintState = SOURCE_HINT_IDS.reduce((state, id) => {
  state[id] = 0;
  return state;
}, {} as HintState);

export class SourceHintInterpreter {
  private previousTimestampMs = 0;
  private densityState: HintState = { ...INITIAL_HINT_STATE };

  reset(): void {
    this.previousTimestampMs = 0;
    this.densityState = { ...INITIAL_HINT_STATE };
  }

  update(input: SourceHintUpdateInput): SourceHintFrame {
    const timestampMs = input.spectrumFrame.timestampMs;
    const deltaSeconds =
      this.previousTimestampMs > 0 ? Math.max(1 / 120, Math.min(0.25, (timestampMs - this.previousTimestampMs) / 1000)) : 1 / 60;
    this.previousTimestampMs = timestampMs;

    const recipes = this.buildRecipes(input);
    const hints = recipes.map((recipe) => this.materializeHint(recipe, deltaSeconds, input.mode, input.calibrated === true));
    const confidence = this.resolveFrameConfidence(hints, input.mode, input.runtimeMode, input.calibrated === true);
    const topHint = [...hints].sort((a, b) => b.value * b.confidence - a.value * a.confidence)[0];

    return {
      schemaVersion: 1,
      timestampMs,
      sourceMode: input.mode,
      runtimeMode: input.runtimeMode,
      confidence,
      hints,
      topHintId: topHint && topHint.value * topHint.confidence > 0.08 ? topHint.id : null,
      reasonCodes: collectCodes(hints.flatMap((hint) => hint.reasonCodes)),
      suppressionCodes: collectCodes(hints.flatMap((hint) => hint.suppressionCodes)),
    };
  }

  private buildRecipes(input: SourceHintUpdateInput): HintRecipe[] {
    const { analysis, spectrumFrame } = input;
    const sub = band(spectrumFrame, 'sub');
    const kick = band(spectrumFrame, 'kick');
    const punch = band(spectrumFrame, 'punch');
    const bass = band(spectrumFrame, 'bass');
    const lowMid = band(spectrumFrame, 'lowMid');
    const body = band(spectrumFrame, 'body');
    const presence = band(spectrumFrame, 'presence');
    const snap = band(spectrumFrame, 'snap');
    const crack = band(spectrumFrame, 'crack');
    const sheen = band(spectrumFrame, 'sheen');
    const air = band(spectrumFrame, 'air');
    const fizz = band(spectrumFrame, 'fizz');

    const lowOnset = weighted([kick.onset, 0.48], [punch.onset, 0.26], [sub.onset, 0.16], [analysis.transient * 1.15, 0.1]);
    const lowSustain = weighted([sub.sustain, 0.32], [kick.sustain, 0.16], [punch.sustain, 0.16], [bass.sustain, 0.24], [analysis.lowEnergy, 0.12]);
    const midVoice = weighted([body.sustain, 0.24], [presence.sustain, 0.28], [snap.sustain, 0.16], [analysis.midEnergy, 0.22], [analysis.brightness, 0.1]);
    const highMotion = weighted([sheen.flux, 0.25], [air.flux, 0.23], [fizz.flux, 0.12], [sheen.onset, 0.18], [air.onset, 0.14], [analysis.highEnergy, 0.08]);
    const highSustain = weighted([sheen.sustain, 0.24], [air.sustain, 0.34], [fizz.sustain, 0.2], [analysis.highEnergy, 0.22]);
    const broadOnset = weighted([kick.onset, 0.15], [punch.onset, 0.16], [body.onset, 0.14], [snap.onset, 0.18], [crack.onset, 0.16], [sheen.onset, 0.1], [analysis.transient, 0.11]);

    const lowReliability = weighted([kick.reliability, 0.34], [punch.reliability, 0.22], [sub.reliability, 0.18], [bass.reliability, 0.26]);
    const midReliability = weighted([body.reliability, 0.28], [presence.reliability, 0.32], [snap.reliability, 0.2], [crack.reliability, 0.2]);
    const highReliability = weighted([sheen.reliability, 0.28], [air.reliability, 0.32], [fizz.reliability, 0.18], [crack.reliability, 0.22]);
    const dynamicRange = clamp01((analysis.peak - analysis.rms) * 1.8 + Math.min(1, analysis.crestFactor / 8) * 0.28);
    const clipped = analysis.clipped || (analysis.peak > 0.96 && analysis.crestFactor < 2.2);
    const steadyLow = lowSustain > 0.55 && lowOnset < 0.16 && analysis.modulation < 0.08;
    const speechLike = midVoice > 0.36 && analysis.modulation > 0.1 && lowOnset < 0.26 && broadOnset < 0.34;
    const hissLike = highSustain > 0.45 && highMotion < 0.16 && dynamicRange < 0.3;
    const denseNoise = (analysis.highEnergy > 0.48 && analysis.lowStability < 0.22) || (analysis.brightness > 0.72 && highSustain > 0.38 && dynamicRange < 0.38);
    const quiet = analysis.rms < 0.038 && analysis.transient < 0.055;

    return [
      {
        id: 'lowImpactCandidate',
        value: clamp01(lowOnset * 1.35 + Math.max(0, analysis.lowEnergy - analysis.highEnergy) * 0.24),
        confidence: lowReliability * (input.mode === 'system-audio' ? 1 : input.mode === 'hybrid' ? 0.72 : 0.52),
        reasonCodes: codes(['low-onset', lowOnset], ['low-energy', analysis.lowEnergy], ['transient', analysis.transient]),
        suppressionCodes: codes(['steady-low', steadyLow ? 1 : 0], ['speech-like', speechLike ? 1 : 0], ['clip-risk', clipped ? 1 : 0]),
      },
      {
        id: 'subSustain',
        value: clamp01(lowSustain * 1.16),
        confidence: weighted([sub.reliability, 0.28], [kick.reliability, 0.2], [bass.reliability, 0.28], [input.mode === 'system-audio' ? 1 : 0.58, 0.24]),
        reasonCodes: codes(['sub-sustain', sub.sustain], ['bass-sustain', bass.sustain], ['low-energy', analysis.lowEnergy]),
        suppressionCodes: codes(['steady-low-hum-risk', steadyLow ? 1 : 0], ['clip-risk', clipped ? 1 : 0]),
      },
      {
        id: 'bassBodySupport',
        value: clamp01(weighted([punch.sustain, 0.2], [bass.sustain, 0.38], [lowMid.sustain, 0.2], [analysis.lowEnergy, 0.22]) * 1.12),
        confidence: weighted([punch.reliability, 0.16], [bass.reliability, 0.34], [lowMid.reliability, 0.22], [input.mode === 'system-audio' ? 1 : 0.64, 0.28]),
        reasonCodes: codes(['bass-body', bass.sustain], ['low-mid-body', lowMid.sustain], ['low-energy', analysis.lowEnergy]),
        suppressionCodes: codes(['hum-risk', steadyLow ? 1 : 0], ['room-source', input.mode === 'room-mic' ? 1 : 0]),
      },
      {
        id: 'percussiveSnap',
        value: clamp01(weighted([snap.onset, 0.32], [crack.onset, 0.24], [body.onset, 0.16], [analysis.transient, 0.28]) * 1.18),
        confidence: weighted([midReliability, 0.46], [dynamicRange, 0.18], [input.mode === 'system-audio' ? 1 : input.mode === 'hybrid' ? 0.62 : 0.42, 0.36]),
        reasonCodes: codes(['snap-onset', snap.onset], ['crack-onset', crack.onset], ['transient', analysis.transient]),
        suppressionCodes: codes(['speech-like', speechLike ? 1 : 0], ['hiss-like', hissLike ? 1 : 0], ['dense-noise', denseNoise ? 1 : 0], ['clip-risk', clipped ? 1 : 0]),
      },
      {
        id: 'airMotion',
        value: clamp01(weighted([highMotion, 0.58], [air.sustain, 0.18], [sheen.sustain, 0.12], [analysis.highEnergy, 0.12]) * 1.12),
        confidence: weighted([highReliability, 0.46], [dynamicRange, 0.14], [input.mode === 'system-audio' ? 1 : input.mode === 'hybrid' ? 0.74 : 0.58, 0.4]),
        reasonCodes: codes(['air-flux', air.flux], ['sheen-flux', sheen.flux], ['high-energy', analysis.highEnergy]),
        suppressionCodes: codes(['hiss-like', hissLike ? 1 : 0], ['dense-noise', denseNoise ? 1 : 0], ['clip-risk', clipped ? 1 : 0]),
      },
      {
        id: 'speechPresenceCandidate',
        value: clamp01(midVoice * 1.1 + Math.max(0, analysis.modulation - 0.08) * 0.55),
        confidence: weighted([midReliability, 0.34], [analysis.modulation, 0.24], [input.mode === 'room-mic' ? 1 : input.mode === 'hybrid' ? 0.64 : 0.3, 0.42]),
        reasonCodes: codes(['mid-presence', midVoice], ['modulation', analysis.modulation], ['room-source', input.mode === 'room-mic' ? 1 : 0]),
        suppressionCodes: codes(['broadband-hit', broadOnset > 0.55 ? 1 : 0], ['music-lock', input.mode === 'system-audio' && analysis.lowStability > 0.5 ? 1 : 0]),
      },
      {
        id: 'highSweepCandidate',
        value: clamp01(weighted([air.flux, 0.24], [sheen.flux, 0.26], [fizz.flux, 0.14], [air.onset, 0.16], [analysis.brightness, 0.2]) * 1.1),
        confidence: weighted([highReliability, 0.46], [dynamicRange, 0.14], [input.mode === 'system-audio' ? 1 : 0.68, 0.4]),
        reasonCodes: codes(['air-rise', air.flux], ['sheen-rise', sheen.flux], ['brightness', analysis.brightness]),
        suppressionCodes: codes(['hiss-like', hissLike ? 1 : 0], ['dense-noise', denseNoise ? 1 : 0], ['clip-risk', clipped ? 1 : 0]),
      },
      {
        id: 'tonalLift',
        value: clamp01(weighted([body.tonal, 0.18], [presence.tonal, 0.22], [sheen.tonal, 0.22], [air.tonal, 0.16], [analysis.lowStability, 0.22]) * 1.08),
        confidence: weighted([midReliability, 0.32], [highReliability, 0.22], [analysis.lowStability, 0.2], [input.mode === 'system-audio' ? 1 : 0.7, 0.26]),
        reasonCodes: codes(['tonal-stability', analysis.lowStability], ['presence-tonal', presence.tonal], ['air-tonal', air.tonal]),
        suppressionCodes: codes(['dense-noise', denseNoise ? 1 : 0], ['clip-risk', clipped ? 1 : 0]),
      },
      {
        id: 'silenceAir',
        value: clamp01((quiet ? 0.42 : 0) + (1 - clamp01(analysis.rms * 18)) * 0.26 + weighted([air.sustain, 0.18], [sheen.sustain, 0.14])),
        confidence: weighted([highReliability, 0.32], [quiet ? 1 : 0, 0.34], [input.mode === 'system-audio' ? 1 : 0.68, 0.34]),
        reasonCodes: codes(['quiet', quiet ? 1 : 0], ['air-tail', air.sustain], ['low-rms', 1 - clamp01(analysis.rms * 18)]),
        suppressionCodes: codes(['active-hit', broadOnset > 0.36 ? 1 : 0], ['speech-like', speechLike ? 1 : 0]),
      },
      {
        id: 'broadbandHit',
        value: clamp01(weighted([broadOnset, 0.44], [lowOnset, 0.2], [highMotion, 0.14], [analysis.transient, 0.22]) * 1.14),
        confidence: weighted([lowReliability, 0.25], [midReliability, 0.25], [highReliability, 0.2], [dynamicRange, 0.1], [input.mode === 'system-audio' ? 1 : 0.55, 0.2]),
        reasonCodes: codes(['broad-onset', broadOnset], ['low-onset', lowOnset], ['transient', analysis.transient]),
        suppressionCodes: codes(['clip-risk', clipped ? 1 : 0], ['dense-noise', denseNoise ? 1 : 0], ['speech-like', speechLike ? 1 : 0]),
      },
    ];
  }

  private materializeHint(recipe: HintRecipe, deltaSeconds: number, mode: ListeningMode, calibrated: boolean): SourceHint {
    const suppression = clamp01(recipe.suppressionCodes.length * 0.22);
    const modeTrust = mode === 'system-audio' ? 1 : mode === 'hybrid' ? 0.72 : 0.54;
    const calibrationTrust = calibrated ? 1 : 0.82;
    const value = clamp01(recipe.value * (1 - suppression * 0.68));
    const confidence = clamp01(recipe.confidence * modeTrust * calibrationTrust * (1 - suppression * 0.48));
    const previous = this.densityState[recipe.id] ?? 0;
    const target = value > 0.2 && confidence > 0.22 ? value : 0;
    const attack = 1 - Math.exp(-deltaSeconds * 5.5);
    const release = 1 - Math.exp(-deltaSeconds * 2.25);
    const density = target > previous ? previous + (target - previous) * attack : previous + (target - previous) * release;
    this.densityState[recipe.id] = clamp01(density);

    return {
      id: recipe.id,
      value,
      confidence,
      density: this.densityState[recipe.id],
      reasonCodes: recipe.reasonCodes,
      suppressionCodes: recipe.suppressionCodes,
    };
  }

  private resolveFrameConfidence(
    hints: SourceHint[],
    mode: ListeningMode,
    runtimeMode: SourceHintRuntimeMode,
    calibrated: boolean,
  ): number {
    if (runtimeMode === 'diagnostic') {
      return 0;
    }
    const top = [...hints].sort((a, b) => b.value * b.confidence - a.value * a.confidence)[0];
    const support = top ? top.value * top.confidence : 0;
    const spread = hints.filter((hint) => hint.value > 0.25 && hint.confidence > 0.24).length;
    const modeTrust = mode === 'system-audio' ? 1 : mode === 'hybrid' ? 0.72 : 0.54;
    const calibrationTrust = calibrated ? 1 : 0.82;
    return clamp01((support * 0.72 + Math.min(1, spread / 4) * 0.28) * modeTrust * calibrationTrust);
  }
}

export function getSourceHint(frame: SourceHintFrame | undefined, id: SourceHintId): SourceHint | undefined {
  return frame?.hints.find((hint) => hint.id === id);
}

function band(frame: SpectrumFrame, id: SpectrumBandId) {
  return (
    getSpectrumBand(frame, id) ?? {
      id,
      hzLow: 0,
      hzHigh: 0,
      energy: 0,
      peak: 0,
      flux: 0,
      onset: 0,
      sustain: 0,
      noise: 0,
      tonal: 0,
      confidence: 0,
      reliability: 0,
      binCount: 0,
    }
  );
}

function weighted(...values: Array<[number, number]>): number {
  let total = 0;
  let weight = 0;
  for (const [value, valueWeight] of values) {
    total += clamp01(value) * valueWeight;
    weight += valueWeight;
  }
  return weight > 0 ? clamp01(total / weight) : 0;
}

function codes(...entries: Array<[string, number]>): string[] {
  return entries.filter(([, value]) => value > 0.32).map(([code]) => code);
}

function collectCodes(codes: string[]): string[] {
  return Array.from(new Set(codes)).sort();
}
