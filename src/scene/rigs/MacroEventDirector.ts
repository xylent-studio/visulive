import * as THREE from 'three';
import type { ListeningFrame, PerformanceIntent } from '../../types/audio';
import type { RuntimeTuning } from '../../types/tuning';
import type {
  PaletteState,
  ShowAct,
  VisualCueState
} from '../../types/visual';
import type { PressureWaveTriggerContext } from '../modules/PressureWaveSystem';

export type MacroEventKind =
  | 'pressure-wave'
  | 'portal-open'
  | 'singularity-collapse'
  | 'halo-ignition'
  | 'ghost-afterimage'
  | 'twin-split'
  | 'world-stain'
  | 'cathedral-rise';

type MacroEvent = {
  kind: MacroEventKind;
  age: number;
  duration: number;
  intensity: number;
};

export type MacroEventDirectorUpdateInput = {
  frame: ListeningFrame;
  elapsedSeconds: number;
  deltaSeconds: number;
  cueState: VisualCueState;
  tuning: RuntimeTuning;
  directorEnergy: number;
  directorSpectacle: number;
  performanceIntent: PerformanceIntent;
  beatJustHit: boolean;
  dropImpact: number;
  barPhase: number;
  activeAct: ShowAct;
  activeFamily: string;
  paletteState: PaletteState;
  triggerPressureWave: (context: PressureWaveTriggerContext) => void;
};

function pulseShape(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  return Math.sin(t * Math.PI);
}

function hashSignature(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export class MacroEventDirector {
  private readonly activeEvents: MacroEvent[] = [];
  private nextEventAt = 10;
  private liftPulse = 0;
  private strikePulse = 0;
  private releasePulse = 0;
  private lastMomentSignature = '';

  getLiftPulse(): number {
    return this.liftPulse;
  }

  getStrikePulse(): number {
    return this.strikePulse;
  }

  getReleasePulse(): number {
    return this.releasePulse;
  }

  registerMoment(frame: ListeningFrame): void {
    const momentSignature =
      frame.momentKind === 'none'
        ? 'none'
        : `${frame.momentKind}:${frame.timestampMs}`;

    if (
      frame.momentKind !== 'none' &&
      momentSignature !== this.lastMomentSignature
    ) {
      if (frame.momentKind === 'lift') {
        this.liftPulse = Math.max(this.liftPulse, frame.momentAmount);
      } else if (frame.momentKind === 'strike') {
        this.strikePulse = Math.max(this.strikePulse, frame.momentAmount);
      } else if (frame.momentKind === 'release') {
        this.releasePulse = Math.max(this.releasePulse, frame.momentAmount);
      }

      this.lastMomentSignature = momentSignature;
    }
  }

  update(input: MacroEventDirectorUpdateInput): void {
    const cueRupture = input.cueState.cueClass === 'rupture' ? 1 : 0;
    const cueReveal = input.cueState.cueClass === 'reveal' ? 1 : 0;
    const cueResidue =
      input.cueState.cueClass === 'haunt' ||
      input.cueState.cueClass === 'afterglow'
        ? 1
        : 0;
    const eventRate =
      input.tuning.eventRate * 0.42 +
      input.directorSpectacle * 0.4 +
      input.directorEnergy * 0.18 +
      input.cueState.eventDensity * 0.18;

    this.liftPulse = Math.max(0, this.liftPulse - input.deltaSeconds * 0.18);
    this.strikePulse = Math.max(
      0,
      this.strikePulse - input.deltaSeconds * 1.2
    );
    this.releasePulse = Math.max(
      0,
      this.releasePulse - input.deltaSeconds * 0.12
    );

    for (let index = this.activeEvents.length - 1; index >= 0; index -= 1) {
      const event = this.activeEvents[index];
      event.age += input.deltaSeconds;
      if (event.age >= event.duration) {
        this.activeEvents.splice(index, 1);
      }
    }

    if (input.frame.momentKind === 'strike' && input.frame.momentAmount > 0.12) {
      input.triggerPressureWave({
        frame: input.frame,
        elapsedSeconds: input.elapsedSeconds,
        intensity:
          0.64 +
          input.frame.momentAmount *
            (1 +
              input.directorSpectacle * 0.3 +
              input.dropImpact * 0.22 +
              input.cueState.screenWeight * 0.24),
        warmMix: input.frame.harmonicColor,
        triggerSource: 'moment',
        activeAct: input.activeAct,
        activeFamily: input.activeFamily,
        paletteState: input.paletteState
      });
    }

    if (input.dropImpact > 0.18 && input.beatJustHit) {
      input.triggerPressureWave({
        frame: input.frame,
        elapsedSeconds: input.elapsedSeconds,
        intensity:
          1.08 +
          input.dropImpact *
            (1.35 +
              input.directorSpectacle * 0.42 +
              eventRate * 0.18 +
              input.cueState.screenWeight * 0.24),
        warmMix: input.frame.harmonicColor,
        triggerSource: 'drop',
        activeAct: input.activeAct,
        activeFamily: input.activeFamily,
        paletteState: input.paletteState
      });
    }

    if (input.elapsedSeconds < this.nextEventAt) {
      return;
    }

    if (
      input.frame.performanceIntent === 'detonate' &&
      input.frame.dropImpact > 0.24 - input.cueState.screenWeight * 0.08 &&
      (input.beatJustHit ||
        input.frame.sectionChange > 0.34 ||
        input.frame.peakConfidence > 0.58 - cueRupture * 0.04)
    ) {
      const primaryEvent = this.chooseSurgeEvent(
        input.frame,
        input.performanceIntent
      );
      this.triggerMacroEvent(primaryEvent, input);
      this.triggerMacroEvent(
        primaryEvent === 'singularity-collapse'
          ? 'world-stain'
          : 'halo-ignition',
        input,
        0.94
      );

      if (
        input.frame.sectionChange > 0.24 ||
        input.frame.preDropTension > 0.42
      ) {
        this.triggerMacroEvent('cathedral-rise', input, 0.86);
      }

      return;
    }

    if (
      input.frame.showState === 'surge' &&
      input.frame.peakConfidence >
        0.48 - eventRate * 0.08 - input.cueState.intensity * 0.04 &&
      (input.frame.momentKind === 'lift' ||
        (input.frame.peakConfidence > 0.64 &&
          input.frame.phraseTension > 0.5))
    ) {
      this.triggerMacroEvent(
        this.chooseSurgeEvent(input.frame, input.performanceIntent),
        input
      );
      return;
    }

    if (
      input.frame.showState === 'aftermath' &&
      (input.frame.momentKind === 'release' ||
        input.frame.releaseTail >
          0.24 - input.cueState.residueWeight * 0.06) &&
      input.frame.resonance > 0.24 - cueResidue * 0.04 &&
      input.frame.musicConfidence > 0.14
    ) {
      this.triggerMacroEvent(
        this.chooseAftermathEvent(input.frame, input.performanceIntent),
        input
      );
      return;
    }

    if (
      input.frame.showState === 'generative' &&
      input.frame.musicConfidence > 0.34 - cueReveal * 0.04 &&
      (input.frame.phraseTension >
        0.32 - input.cueState.intensity * 0.04 ||
        input.frame.preDropTension > 0.26) &&
      input.frame.momentum > 0.3 &&
      (input.beatJustHit || input.barPhase < 0.08 || input.barPhase > 0.92)
    ) {
      this.triggerMacroEvent(
        this.chooseGenerativeEvent(input.frame, input.performanceIntent),
        input
      );
    }
  }

  getEventAmount(kind: MacroEventKind): number {
    let total = 0;

    for (const event of this.activeEvents) {
      if (event.kind !== kind) {
        continue;
      }

      total += pulseShape(event.age / event.duration) * event.intensity;
    }

    return THREE.MathUtils.clamp(total, 0, 1.35);
  }

  getActiveEventKinds(): MacroEventKind[] {
    return this.activeEvents.map((event) => event.kind);
  }

  private chooseSurgeEvent(
    frame: ListeningFrame,
    performanceIntent: PerformanceIntent
  ): MacroEventKind {
    const signature = this.buildEventSignature('surge', performanceIntent, frame);
    const hashed = hashSignature(signature) % 5;

    if (frame.dropImpact > 0.68 && frame.subPressure > 0.48) {
      return 'singularity-collapse';
    }

    if (frame.sectionChange > 0.44 && frame.tonalStability > 0.4) {
      return 'cathedral-rise';
    }

    if (frame.accent > 0.54 && frame.transientConfidence > 0.46) {
      return hashed % 2 === 0 ? 'twin-split' : 'halo-ignition';
    }

    if (frame.preDropTension > 0.48 || frame.momentum > 0.52) {
      return hashed % 2 === 0 ? 'portal-open' : 'cathedral-rise';
    }

    return [
      'portal-open',
      'halo-ignition',
      'twin-split',
      'cathedral-rise',
      'singularity-collapse'
    ][hashed] as MacroEventKind;
  }

  private chooseGenerativeEvent(
    frame: ListeningFrame,
    performanceIntent: PerformanceIntent
  ): MacroEventKind {
    if (frame.sectionChange > 0.4 && frame.momentum > 0.44) {
      return frame.harmonicColor > 0.52 ? 'twin-split' : 'pressure-wave';
    }

    if (frame.releaseTail > 0.3 && frame.resonance > 0.28) {
      return frame.harmonicColor > 0.52 ? 'world-stain' : 'ghost-afterimage';
    }

    if (frame.tonalStability > 0.58 && frame.body > 0.44) {
      return frame.harmonicColor > 0.54 ? 'twin-split' : 'cathedral-rise';
    }

    if (frame.preDropTension > 0.5 || frame.momentum > 0.56) {
      return frame.beatConfidence > 0.56 ? 'pressure-wave' : 'portal-open';
    }

    if (frame.brightness > 0.52 || frame.shimmer > 0.48) {
      return frame.harmonicColor > 0.56 ? 'halo-ignition' : 'twin-split';
    }

    const signature = this.buildEventSignature(
      'generative',
      performanceIntent,
      frame
    );
    const hashed = hashSignature(signature) % 6;

    return [
      'portal-open',
      'cathedral-rise',
      'halo-ignition',
      'twin-split',
      'pressure-wave',
      'world-stain'
    ][hashed] as MacroEventKind;
  }

  private chooseAftermathEvent(
    frame: ListeningFrame,
    performanceIntent: PerformanceIntent
  ): MacroEventKind {
    if (frame.releaseTail > 0.52 && frame.resonance > 0.44) {
      return frame.sectionChange > 0.26 ? 'world-stain' : 'ghost-afterimage';
    }

    if (frame.harmonicColor > 0.56 || frame.sectionChange > 0.34) {
      return 'world-stain';
    }

    if (frame.momentum > 0.36 && frame.beatConfidence > 0.34) {
      return 'pressure-wave';
    }

    const signature = this.buildEventSignature(
      'aftermath',
      performanceIntent,
      frame
    );

    return [
      'ghost-afterimage',
      'world-stain',
      'pressure-wave',
      'twin-split'
    ][hashSignature(signature) % 4] as MacroEventKind;
  }

  private buildEventSignature(
    stage: 'surge' | 'generative' | 'aftermath',
    performanceIntent: PerformanceIntent,
    frame: ListeningFrame
  ): string {
    const bins = [
      stage,
      performanceIntent,
      frame.showState,
      Math.round(frame.dropImpact * 4),
      Math.round(frame.sectionChange * 4),
      Math.round(frame.preDropTension * 4),
      Math.round(frame.accent * 4),
      Math.round(frame.body * 4),
      Math.round(frame.tonalStability * 4),
      Math.round(frame.harmonicColor * 4)
    ];

    return bins.join('|');
  }

  private triggerMacroEvent(
    kind: MacroEventKind,
    input: MacroEventDirectorUpdateInput,
    intensityScale = 1
  ): void {
    const durationByKind: Record<MacroEventKind, number> = {
      'pressure-wave': 1.1,
      'portal-open': 4.8,
      'singularity-collapse': 2.8,
      'halo-ignition': 2.4,
      'ghost-afterimage': 5.6,
      'twin-split': 4.2,
      'world-stain': 6.4,
      'cathedral-rise': 5.2
    };
    const intensity =
      THREE.MathUtils.clamp(
        0.62 +
          input.frame.peakConfidence * 0.18 +
          input.frame.momentAmount * 0.14 +
          input.frame.dropImpact * 0.24 +
          input.frame.sectionChange * 0.18 +
          input.directorSpectacle * 0.18 +
          input.tuning.eventRate * 0.12 +
          (input.performanceIntent === 'detonate' ? 0.08 : 0),
        0.42,
        1
      ) * intensityScale;

    const existing = this.activeEvents.find((event) => event.kind === kind);
    if (existing) {
      existing.age = 0;
      existing.duration = Math.max(existing.duration, durationByKind[kind]);
      existing.intensity = Math.max(existing.intensity, intensity);
    } else {
      this.activeEvents.push({
        kind,
        age: 0,
        duration: durationByKind[kind],
        intensity
      });
    }

    if (this.activeEvents.length > 4) {
      this.activeEvents.sort((left, right) => right.intensity - left.intensity);
      this.activeEvents.length = 4;
    }

    if (kind === 'pressure-wave' || kind === 'halo-ignition') {
      input.triggerPressureWave({
        frame: input.frame,
        elapsedSeconds: input.elapsedSeconds,
        intensity: 0.8 * intensity,
        warmMix: input.frame.harmonicColor,
        triggerSource: 'macro',
        activeAct: input.activeAct,
        activeFamily: input.activeFamily,
        paletteState: input.paletteState
      });
    }

    if (kind === 'portal-open') {
      this.liftPulse = Math.max(this.liftPulse, intensity * 1.1);
    }

    if (kind === 'singularity-collapse') {
      this.releasePulse = Math.max(this.releasePulse, intensity * 0.85);
    }

    if (kind === 'world-stain' || kind === 'ghost-afterimage') {
      this.releasePulse = Math.max(this.releasePulse, intensity * 0.5);
    }

    this.nextEventAt =
      input.elapsedSeconds +
      Math.max(
        1.3,
        5.4 +
          (1 - input.tuning.eventRate) * 6.6 +
          (kind === 'ghost-afterimage' ? 1.2 : 0) +
          (kind === 'world-stain' ? 1.6 : 0) -
          input.frame.dropImpact * 3.2 -
          input.frame.sectionChange * 1.6 -
          (input.performanceIntent === 'detonate' ? 0.6 : 0)
      );
  }
}
