import * as THREE from 'three';
import type { ListeningFrame } from '../../types/audio';
import {
  DEFAULT_RUNTIME_TUNING,
  type RuntimeTuning
} from '../../types/tuning';
import type { StageFrameContext } from './types';

export type DirectorState = {
  energy: number;
  worldActivity: number;
  spectacle: number;
  radiance: number;
  geometry: number;
  atmosphere: number;
  framing: number;
  colorBias: number;
  colorWarp: number;
  laserDrive: number;
};

export type DirectorUpdateInput = {
  frame: ListeningFrame;
  tuning: RuntimeTuning;
  elapsedSeconds: number;
  deltaSeconds: number;
};

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);
  return Math.exp(-clamped * 7);
}

function smoothValue(
  current: number,
  target: number,
  rate: number,
  deltaSeconds: number
): number {
  const mix = 1 - Math.exp(-rate * deltaSeconds);

  return current + (target - current) * mix;
}

function createDefaultDirectorState(): DirectorState {
  return {
    energy: DEFAULT_RUNTIME_TUNING.energy,
    worldActivity: DEFAULT_RUNTIME_TUNING.worldActivity,
    spectacle: DEFAULT_RUNTIME_TUNING.spectacle,
    radiance: DEFAULT_RUNTIME_TUNING.radiance,
    geometry: DEFAULT_RUNTIME_TUNING.geometry,
    atmosphere: DEFAULT_RUNTIME_TUNING.atmosphere,
    framing: DEFAULT_RUNTIME_TUNING.framing,
    colorBias: DEFAULT_RUNTIME_TUNING.colorBias,
    colorWarp: 0.34,
    laserDrive: DEFAULT_RUNTIME_TUNING.beatDrive
  };
}

export class DirectorStateRig {
  private initialized = false;
  private readonly state: DirectorState = createDefaultDirectorState();

  get energy(): number {
    return this.state.energy;
  }

  set energy(value: number) {
    this.state.energy = value;
  }

  get worldActivity(): number {
    return this.state.worldActivity;
  }

  set worldActivity(value: number) {
    this.state.worldActivity = value;
  }

  get spectacle(): number {
    return this.state.spectacle;
  }

  set spectacle(value: number) {
    this.state.spectacle = value;
  }

  get radiance(): number {
    return this.state.radiance;
  }

  set radiance(value: number) {
    this.state.radiance = value;
  }

  get geometry(): number {
    return this.state.geometry;
  }

  set geometry(value: number) {
    this.state.geometry = value;
  }

  get atmosphere(): number {
    return this.state.atmosphere;
  }

  set atmosphere(value: number) {
    this.state.atmosphere = value;
  }

  get framing(): number {
    return this.state.framing;
  }

  set framing(value: number) {
    this.state.framing = value;
  }

  get colorBias(): number {
    return this.state.colorBias;
  }

  set colorBias(value: number) {
    this.state.colorBias = value;
  }

  get colorWarp(): number {
    return this.state.colorWarp;
  }

  set colorWarp(value: number) {
    this.state.colorWarp = value;
  }

  get laserDrive(): number {
    return this.state.laserDrive;
  }

  set laserDrive(value: number) {
    this.state.laserDrive = value;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  initializeFromTuning(tuning: RuntimeTuning): void {
    this.energy = tuning.energy;
    this.worldActivity = tuning.worldActivity;
    this.spectacle = tuning.spectacle;
    this.radiance = tuning.radiance;
    this.geometry = tuning.geometry;
    this.atmosphere = tuning.atmosphere;
    this.framing = tuning.framing;
    this.colorBias = tuning.colorBias;
    this.laserDrive = tuning.beatDrive;
    this.colorWarp = THREE.MathUtils.clamp(
      tuning.radiance * 0.42 + tuning.spectacle * 0.16,
      0,
      1
    );
    this.initialized = true;
  }

  getStageDirectorSnapshot(): StageFrameContext['director'] {
    return {
      worldActivity: this.worldActivity,
      spectacle: this.spectacle,
      geometry: this.geometry,
      radiance: this.radiance,
      atmosphere: this.atmosphere,
      framing: this.framing,
      colorBias: this.colorBias,
      colorWarp: this.colorWarp,
      laserDrive: this.laserDrive
    };
  }

  update(input: DirectorUpdateInput): void {
    const { frame, tuning, elapsedSeconds, deltaSeconds } = input;
    const smooth = (current: number, target: number, rate: number) =>
      smoothValue(current, target, rate, deltaSeconds);
    const detonate = frame.performanceIntent === 'detonate' ? 1 : 0;
    const ignite = frame.performanceIntent === 'ignite' ? 1 : 0;
    const haunt = frame.performanceIntent === 'haunt' ? 1 : 0;
    const surge = frame.showState === 'surge' ? 1 : 0;
    const generative = frame.showState === 'generative' ? 1 : 0;
    const aftermath = frame.showState === 'aftermath' ? 1 : 0;
    const sourceBoost =
      frame.mode === 'system-audio' ? 0.12 : frame.mode === 'hybrid' ? 0.18 : 0;
    const beatPulse = onsetPulse(frame.beatPhase);
    const barPulse = phasePulse(
      frame.barPhase,
      elapsedSeconds * (0.56 + frame.beatConfidence * 0.18 + sourceBoost * 0.8)
    );
    const phrasePulse = phasePulse(
      frame.phrasePhase,
      elapsedSeconds * (0.18 + frame.musicConfidence * 0.08 + sourceBoost * 0.24)
    );
    const slowOrbit =
      0.5 +
      0.5 *
        Math.sin(
          elapsedSeconds *
            (0.06 +
              frame.musicConfidence * 0.04 +
              frame.resonance * 0.03 +
              sourceBoost * 0.06) +
            frame.harmonicColor * Math.PI * 2
        );
    const laserOrbit =
      0.5 +
      0.5 *
        Math.sin(
          elapsedSeconds *
            (0.16 +
              frame.beatConfidence * 0.18 +
              frame.preDropTension * 0.08 +
              sourceBoost * 0.12) +
            frame.barPhase * Math.PI * 2
        );
    const quietRoomMusicStructure =
      frame.mode === 'room-mic' &&
      frame.musicConfidence > 0.12 &&
      frame.speechConfidence < 0.34 &&
      frame.releaseTail < 0.28
        ? THREE.MathUtils.clamp(
            frame.musicConfidence * 0.86 +
              frame.body * 0.22 +
              frame.tonalStability * 0.18 +
              frame.harmonicColor * 0.22 +
              frame.shimmer * 0.18 +
              frame.momentum * 0.14,
            0,
            0.72
          )
        : 0;
    const adaptiveMusicStructure = THREE.MathUtils.clamp(
      frame.musicConfidence * 0.34 +
        frame.body * 0.18 +
        frame.tonalStability * 0.14 +
        frame.harmonicColor * 0.14 +
        frame.shimmer * 0.12 +
        frame.momentum * 0.1 -
        frame.releaseTail * 0.1 -
        frame.speechConfidence * 0.18,
      0,
      1
    );
    const livingStageFloor =
      Math.max(quietRoomMusicStructure, adaptiveMusicStructure) *
      (0.62 +
        tuning.neonStageFloor * 0.26 +
        tuning.worldBootFloor * 0.22 +
        tuning.readableHeroFloor * 0.18);

    const targetEnergy = THREE.MathUtils.clamp(
      tuning.energy * 0.76 +
        detonate * 0.18 +
        ignite * 0.08 +
        surge * 0.08 +
        frame.dropImpact * 0.14 +
        frame.preDropTension * 0.08 +
        livingStageFloor * 0.08 +
        sourceBoost,
      0,
      1
    );
    const targetWorldActivity = THREE.MathUtils.clamp(
      tuning.worldActivity * 0.78 +
        generative * 0.08 +
        surge * 0.12 +
        aftermath * 0.1 +
        frame.sectionChange * 0.12 +
        frame.resonance * 0.08 +
        slowOrbit * 0.08 +
        frame.body * 0.06 +
        livingStageFloor * (0.12 + tuning.worldBootFloor * 0.16) +
        sourceBoost * 0.6,
      0,
      1
    );
    const targetSpectacle = THREE.MathUtils.clamp(
      tuning.spectacle * 0.8 +
        detonate * 0.22 +
        surge * 0.12 +
        frame.sectionChange * 0.14 +
        frame.phraseTension * 0.1 +
        frame.harmonicColor * 0.08 +
        livingStageFloor * (0.16 + tuning.neonStageFloor * 0.18) +
        sourceBoost * 0.8 +
        beatPulse * 0.04,
      0,
      1
    );
    const targetRadiance = THREE.MathUtils.clamp(
      tuning.radiance * 0.64 +
        detonate * 0.08 +
        frame.musicConfidence * 0.08 +
        frame.body * 0.06 +
        frame.shimmer * 0.06 +
        frame.harmonicColor * 0.08 +
        frame.air * 0.04 +
        frame.sectionChange * 0.04 +
        laserOrbit * 0.02 +
        livingStageFloor * (0.18 + tuning.neonStageFloor * 0.22) +
        sourceBoost * 0.16,
      0,
      1
    );
    const targetGeometry = THREE.MathUtils.clamp(
      tuning.geometry * 0.78 +
        surge * 0.1 +
        detonate * 0.08 +
        frame.tonalStability * 0.06 +
        barPulse * 0.04 -
        haunt * 0.06,
      0,
      1
    );
    const targetAtmosphere = THREE.MathUtils.clamp(
      tuning.atmosphere * 0.74 +
        aftermath * 0.14 +
        generative * 0.08 +
        frame.releaseTail * 0.14 +
        frame.resonance * 0.1 +
        slowOrbit * 0.06 +
        livingStageFloor * (0.08 + tuning.worldBootFloor * 0.12),
      0,
      1
    );
    const targetFraming = THREE.MathUtils.clamp(
      tuning.framing +
        frame.musicConfidence * 0.08 +
        frame.momentum * 0.06 +
        haunt * 0.06 +
        frame.releaseTail * 0.04 -
        detonate * 0.08 -
        frame.dropImpact * 0.06 +
        (slowOrbit - 0.5) * 0.08 +
        livingStageFloor * 0.06,
      0,
      1
    );
    const targetColorBias = THREE.MathUtils.clamp(
      tuning.colorBias +
        (frame.harmonicColor - 0.5) * 0.28 +
        (phrasePulse - 0.5) * (0.16 + frame.musicConfidence * 0.08) +
        detonate * 0.08 -
        haunt * 0.06 +
        sourceBoost * 0.06,
      0,
      1
    );
    const targetColorWarp = THREE.MathUtils.clamp(
      tuning.radiance * 0.22 +
        tuning.spectacle * 0.08 +
        frame.shimmer * 0.12 +
        frame.dropImpact * 0.16 +
        frame.sectionChange * 0.12 +
        barPulse * 0.06 +
        phrasePulse * 0.04 +
        sourceBoost * 0.08,
      0,
      1
    );
    const targetLaserDrive = THREE.MathUtils.clamp(
      tuning.beatDrive * 0.56 +
        frame.beatConfidence * 0.22 +
        frame.preDropTension * 0.12 +
        beatPulse * 0.12 +
        detonate * 0.1 +
        sourceBoost * 0.18,
      0,
      1
    );

    this.energy = smooth(
      this.energy,
      targetEnergy,
      targetEnergy > this.energy ? 1.4 : 0.72
    );
    this.worldActivity = smooth(
      this.worldActivity,
      targetWorldActivity,
      targetWorldActivity > this.worldActivity ? 1.1 : 0.58
    );
    this.spectacle = smooth(
      this.spectacle,
      targetSpectacle,
      targetSpectacle > this.spectacle ? 1.4 : 0.7
    );
    this.radiance = smooth(
      this.radiance,
      targetRadiance,
      targetRadiance > this.radiance ? 1.15 : 1.08
    );
    this.geometry = smooth(this.geometry, targetGeometry, 0.92);
    this.atmosphere = smooth(
      this.atmosphere,
      targetAtmosphere,
      targetAtmosphere > this.atmosphere ? 0.9 : 0.46
    );
    this.framing = smooth(this.framing, targetFraming, 0.86);
    this.colorBias = smooth(this.colorBias, targetColorBias, 0.98);
    this.colorWarp = smooth(
      this.colorWarp,
      targetColorWarp,
      targetColorWarp > this.colorWarp ? 1.2 : 1
    );
    this.laserDrive = smooth(
      this.laserDrive,
      targetLaserDrive,
      targetLaserDrive > this.laserDrive ? 1.8 : 0.94
    );
  }
}
