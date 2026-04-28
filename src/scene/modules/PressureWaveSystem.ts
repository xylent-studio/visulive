import * as THREE from 'three';
import type { ListeningFrame } from '../../types/audio';
import type { PaletteState, ShowAct } from '../../types/visual';

type PressureWaveBand = 'sub' | 'mid' | 'high';
type PressureWaveStyle = 'ground-swell' | 'torsion-arc' | 'ion-crown';
type PressureWaveTriggerSource = 'moment' | 'drop' | 'macro';

type PressureWave = {
  group: THREE.Group;
  waveMesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  torusMesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  haloMesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  age: number;
  active: boolean;
  intensity: number;
  warmMix: number;
  band: PressureWaveBand;
  colorCycle: number;
  spin: number;
  tiltX: number;
  tiltY: number;
  driftX: number;
  driftY: number;
  depthBias: number;
  style: PressureWaveStyle;
  expansion: number;
  anchorY: number;
  anchorZ: number;
  haloBias: number;
  glowBias: number;
};

export type PressureWaveTriggerContext = {
  frame: ListeningFrame;
  elapsedSeconds: number;
  intensity: number;
  warmMix: number;
  triggerSource?: PressureWaveTriggerSource;
  activeAct: ShowAct;
  activeFamily: string;
  paletteState: PaletteState;
};

export type PressureWaveUpdateContext = {
  elapsedSeconds: number;
  deltaSeconds: number;
  ambientGlow: number;
  eventGlow: number;
  beatPhase: number;
  dropImpact: number;
  ghostWeight: number;
  ghostActWeight: number;
  qualityTier: 'safe' | 'balanced' | 'premium';
  auraOpacityMultiplier: number;
  heroPrimaryColor: THREE.Color;
  heroAccentColor: THREE.Color;
  heroPulseColor: THREE.Color;
  smoothValue: (
    current: number,
    target: number,
    smoothing: number,
    deltaSeconds: number
  ) => number;
};

const LASER_CYAN = new THREE.Color('#35f4ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const VOLT_VIOLET = new THREE.Color('#7c4dff');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const ACID_LIME = new THREE.Color('#bcff39');
const SOLAR_ORANGE = new THREE.Color('#ff9f2d');
const CYBER_YELLOW = new THREE.Color('#ffe933');
const TOXIC_PINK = new THREE.Color('#ff5cff');
const ELECTRIC_WHITE = new THREE.Color('#f7fbff');

const PRESSURE_WAVE_COLOR_FAMILIES: Record<
  PressureWaveBand,
  readonly THREE.Color[]
> = {
  sub: [SOLAR_ORANGE, CYBER_YELLOW, ACID_LIME],
  mid: [HOT_MAGENTA, TOXIC_PINK, VOLT_VIOLET],
  high: [LASER_CYAN, TRON_BLUE, ELECTRIC_WHITE]
};

function pulseShape(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  return Math.sin(t * Math.PI);
}

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);
  return Math.exp(-clamped * 7);
}

function copyPressureWaveColor(
  target: THREE.Color,
  band: PressureWaveBand,
  cycle: number,
  offset = 0
): THREE.Color {
  const family = PRESSURE_WAVE_COLOR_FAMILIES[band];
  const index = (cycle + offset) % family.length;

  return target.copy(family[index] ?? family[0]!);
}

function hashSignature(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export class PressureWaveSystem {
  private readonly accentGroup: THREE.Group;
  private readonly pressureWaves: PressureWave[] = [];
  private readonly pressureWaveColorScratch = new THREE.Color();
  private readonly pressureWaveColorScratchB = new THREE.Color();
  private readonly pressureWaveLightColorScratch = new THREE.Color();
  private readonly pressureWaveLightColorScratchB = new THREE.Color();
  private readonly pressureWaveLight = new THREE.PointLight('#35f4ff', 0, 8, 2);
  private readonly pressureWaveAccentLight = new THREE.PointLight('#ff3bc9', 0, 7, 2);
  private lastPressureWaveTriggerSeconds = -999;
  private built = false;

  constructor(input: { accentGroup: THREE.Group }) {
    this.accentGroup = input.accentGroup;
  }

  build(): void {
    if (this.built) {
      return;
    }

    this.pressureWaveLight.position.set(0, -0.14, -0.82);
    this.pressureWaveAccentLight.position.set(0, 0.06, -1.08);
    this.accentGroup.add(this.pressureWaveLight);
    this.accentGroup.add(this.pressureWaveAccentLight);

    for (let index = 0; index < 7; index += 1) {
      const waveMaterial = new THREE.MeshBasicMaterial({
        color: SOLAR_ORANGE.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const torusMaterial = new THREE.MeshBasicMaterial({
        color: LASER_CYAN.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: HOT_MAGENTA.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const group = new THREE.Group();
      const waveMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 0.98, 128),
        waveMaterial
      );
      const torusMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.92, 0.045, 18, 96),
        torusMaterial
      );
      const haloMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.58, 0.62, 96),
        haloMaterial
      );

      waveMesh.renderOrder = 6;
      torusMesh.renderOrder = 7;
      haloMesh.renderOrder = 5;
      haloMesh.rotation.y = Math.PI / 2;
      group.visible = false;
      group.add(waveMesh);
      group.add(torusMesh);
      group.add(haloMesh);

      this.pressureWaves.push({
        group,
        waveMesh,
        torusMesh,
        haloMesh,
        age: 0,
        active: false,
        intensity: 0,
        warmMix: 0.5,
        band: 'mid',
        colorCycle: index % PRESSURE_WAVE_COLOR_FAMILIES.mid.length,
        spin: 0,
        tiltX: 0,
        tiltY: 0,
        driftX: 0,
        driftY: 0,
        depthBias: 0,
        style: 'torsion-arc',
        expansion: 3.2,
        anchorY: -0.08,
        anchorZ: -0.72,
        haloBias: 0.72,
        glowBias: 0.62
      });

      this.accentGroup.add(group);
    }

    this.built = true;
  }

  update(context: PressureWaveUpdateContext): void {
    if (!this.built) {
      return;
    }

    const beatPulse = onsetPulse(context.beatPhase);
    let strongestWaveLight = 0;
    let strongestWaveAccent = 0;
    let strongestWaveX = 0;
    let strongestWaveY = -0.12;
    let strongestWaveZ = -0.8;
    let strongestWaveBand: PressureWaveBand = 'mid';
    let strongestWaveCycle = 0;

    this.pressureWaves.forEach((wave, index) => {
      if (!wave.active) {
        return;
      }

      wave.age += context.deltaSeconds;

      const groundSwell = wave.style === 'ground-swell' ? 1 : 0;
      const torsionArc = wave.style === 'torsion-arc' ? 1 : 0;
      const ionCrown = wave.style === 'ion-crown' ? 1 : 0;
      const duration =
        0.86 +
        wave.intensity * (groundSwell * 0.72 + torsionArc * 0.56 + ionCrown * 0.46) +
        wave.haloBias * 0.18;
      const progress = wave.age / duration;

      if (progress >= 1) {
        wave.active = false;
        wave.group.visible = false;
        wave.waveMesh.material.opacity = 0;
        wave.torusMesh.material.opacity = 0;
        wave.haloMesh.material.opacity = 0;
        return;
      }

      const growth = THREE.MathUtils.smoothstep(progress, 0, 1);
      const pulse = pulseShape(progress);
      const frontPulse = pulseShape(
        THREE.MathUtils.clamp(progress * 1.08 + 0.02, 0, 1)
      );
      const haloPulse = pulseShape(
        THREE.MathUtils.clamp(progress * 0.82 + 0.12, 0, 1)
      );
      const residuePulse = Math.pow(1 - progress, 1.32);
      const baseScale = 1.02 + growth * wave.expansion;
      const driftBlend =
        growth * (groundSwell * 0.22 + torsionArc * 0.36 + ionCrown * 0.24);
      const verticalOrbit =
        Math.sin(
          progress *
            Math.PI *
            (groundSwell * 1.2 + torsionArc * 1.7 + ionCrown * 2.2) +
            index * 0.62
        ) *
        (groundSwell * 0.02 + torsionArc * 0.05 + ionCrown * 0.08);
      const spinAmount =
        context.elapsedSeconds *
          wave.spin *
          (0.12 + pulse * 0.18 + ionCrown * 0.16) +
        growth *
          wave.spin *
          (groundSwell * 0.48 + torsionArc * 1.2 + ionCrown * 1.8);
      const groupX = wave.driftX * driftBlend;
      const groupY = wave.anchorY + wave.driftY * driftBlend + verticalOrbit;
      const groupZ =
        wave.anchorZ +
        wave.depthBias * (0.18 + growth * 0.2) -
        groundSwell * growth * 0.12 +
        ionCrown * growth * 0.14 -
        index * 0.012;

      wave.group.visible = true;
      wave.group.position.set(groupX, groupY, groupZ);
      wave.group.rotation.set(
        Math.PI / 2 +
          wave.tiltX * (groundSwell * 0.26 + torsionArc * 0.52 + ionCrown * 0.68),
        wave.tiltY * (groundSwell * 0.24 + torsionArc * 0.62 + ionCrown * 0.88),
        spinAmount * (groundSwell * 0.28 + torsionArc * 0.74 + ionCrown)
      );
      wave.waveMesh.scale.set(
        baseScale * (groundSwell * 1.22 + torsionArc * 0.96 + ionCrown * 0.78),
        baseScale *
          (groundSwell * 0.58 +
            torsionArc * 0.84 +
            ionCrown * 0.56 +
            Math.abs(wave.tiltX) * 0.08),
        1
      );
      wave.torusMesh.scale.setScalar(
        baseScale * (groundSwell * 0.94 + torsionArc * 0.78 + ionCrown * 0.64)
      );
      wave.torusMesh.rotation.set(
        wave.tiltX * (groundSwell * 0.22 + torsionArc * 0.48 + ionCrown * 0.42) +
          growth *
            wave.spin *
            (groundSwell * 0.08 + torsionArc * 0.22 + ionCrown * 0.18),
        wave.tiltY * (groundSwell * 0.28 + torsionArc * 0.62 + ionCrown * 0.5) +
          growth * wave.spin * (torsionArc * 0.12 + ionCrown * 0.18),
        -spinAmount * (groundSwell * 0.14 + torsionArc * 0.34 + ionCrown * 0.22)
      );
      wave.haloMesh.scale.set(
        baseScale * (groundSwell * 0.68 + torsionArc * 0.74 + ionCrown * 0.92),
        baseScale *
          (groundSwell * 0.28 +
            torsionArc * 0.46 +
            ionCrown * 0.9 +
            wave.haloBias * 0.04),
        1
      );
      wave.haloMesh.rotation.set(
        wave.tiltY * (groundSwell * 0.12 + torsionArc * 0.28 + ionCrown * 0.22),
        Math.PI / 2 +
          growth *
            wave.spin *
            (groundSwell * 0.22 + torsionArc * 0.44 + ionCrown * 0.82),
        wave.tiltX * (groundSwell * 0.08 + torsionArc * 0.18 + ionCrown * 0.16) -
          spinAmount * (groundSwell * 0.08 + torsionArc * 0.16 + ionCrown * 0.1)
      );

      copyPressureWaveColor(this.pressureWaveColorScratch, wave.band, wave.colorCycle);
      copyPressureWaveColor(
        this.pressureWaveColorScratchB,
        wave.band,
        wave.colorCycle,
        1
      );
      wave.waveMesh.material.color
        .copy(this.pressureWaveColorScratch)
        .lerp(
          context.heroPrimaryColor,
          0.08 + torsionArc * 0.06 + ionCrown * 0.08
        )
        .lerp(context.heroAccentColor, 0.04 + ionCrown * 0.06)
        .lerp(this.pressureWaveColorScratchB, 0.12 + wave.haloBias * 0.06)
        .lerp(ELECTRIC_WHITE, pulse * 0.02 + ionCrown * 0.04);
      copyPressureWaveColor(
        this.pressureWaveColorScratch,
        wave.band,
        wave.colorCycle,
        1
      );
      wave.torusMesh.material.color
        .copy(this.pressureWaveColorScratch)
        .lerp(
          context.heroPulseColor,
          0.1 + torsionArc * 0.08 + ionCrown * 0.12
        )
        .lerp(context.heroAccentColor, 0.06 + groundSwell * 0.04)
        .lerp(
          ELECTRIC_WHITE,
          frontPulse * 0.05 + beatPulse * 0.04 + ionCrown * 0.04
        );
      copyPressureWaveColor(
        this.pressureWaveColorScratch,
        wave.band,
        wave.colorCycle,
        2
      );
      wave.haloMesh.material.color
        .copy(this.pressureWaveColorScratch)
        .lerp(context.heroAccentColor, 0.08 + wave.haloBias * 0.08)
        .lerp(context.heroPulseColor, 0.05 + torsionArc * 0.06)
        .lerp(
          ELECTRIC_WHITE,
          residuePulse * 0.04 +
            context.ghostWeight * 0.04 +
            context.ghostActWeight * 0.06
        );
      wave.waveMesh.material.opacity =
        pulse *
        (0.028 +
          context.ambientGlow * 0.01 +
          wave.intensity *
            (groundSwell * 0.036 + torsionArc * 0.05 + ionCrown * 0.032) +
          context.eventGlow *
            (groundSwell * 0.02 + torsionArc * 0.024 + ionCrown * 0.018)) *
        wave.glowBias *
        context.auraOpacityMultiplier;
      wave.torusMesh.material.opacity =
        frontPulse *
        (0.04 +
          wave.intensity *
            (groundSwell * 0.056 + torsionArc * 0.07 + ionCrown * 0.062) +
          context.dropImpact * 0.026 +
          context.eventGlow * 0.03) *
        (0.84 + wave.glowBias * 0.16) *
        context.auraOpacityMultiplier;
      wave.haloMesh.material.opacity =
        (haloPulse * 0.7 + residuePulse * 0.46) *
        (0.018 +
          context.ambientGlow * 0.012 +
          wave.intensity *
            (groundSwell * 0.018 + torsionArc * 0.028 + ionCrown * 0.05) +
          context.ghostWeight * 0.014 +
          context.ghostActWeight * 0.018) *
        wave.haloBias *
        context.auraOpacityMultiplier;

      const waveLightAmount =
        (wave.torusMesh.material.opacity * 1.24 +
          wave.haloMesh.material.opacity * 0.96 +
          wave.waveMesh.material.opacity * 0.72) *
        (0.76 + wave.glowBias * 0.34);

      if (waveLightAmount > strongestWaveLight) {
        strongestWaveLight = waveLightAmount;
        strongestWaveAccent =
          wave.haloMesh.material.opacity * (0.72 + wave.haloBias * 0.24);
        strongestWaveX = groupX;
        strongestWaveY = groupY;
        strongestWaveZ = groupZ;
        strongestWaveBand = wave.band;
        strongestWaveCycle = wave.colorCycle;
      }
    });

    copyPressureWaveColor(
      this.pressureWaveLightColorScratch,
      strongestWaveBand,
      strongestWaveCycle
    );
    copyPressureWaveColor(
      this.pressureWaveLightColorScratchB,
      strongestWaveBand,
      strongestWaveCycle,
      1
    );
    this.pressureWaveLight.color
      .copy(this.pressureWaveLightColorScratch)
      .lerp(context.heroPrimaryColor, 0.1)
      .lerp(ELECTRIC_WHITE, strongestWaveLight * 0.08);
    this.pressureWaveAccentLight.color
      .copy(this.pressureWaveLightColorScratchB)
      .lerp(context.heroPulseColor, 0.12)
      .lerp(ELECTRIC_WHITE, strongestWaveAccent * 0.12);
    this.pressureWaveLight.position.set(
      strongestWaveX,
      strongestWaveY + 0.04,
      strongestWaveZ + 0.28
    );
    this.pressureWaveAccentLight.position.set(
      strongestWaveX * 0.72,
      strongestWaveY + 0.16,
      strongestWaveZ - 0.08
    );

    const pressureLightBudget =
      context.qualityTier === 'safe'
        ? 0.34
        : context.qualityTier === 'balanced'
          ? 0.46
          : 0.58;

    this.pressureWaveLight.intensity = context.smoothValue(
      this.pressureWaveLight.intensity,
      strongestWaveLight * pressureLightBudget,
      4.8,
      context.deltaSeconds
    );
    this.pressureWaveAccentLight.intensity = context.smoothValue(
      this.pressureWaveAccentLight.intensity,
      strongestWaveAccent * pressureLightBudget * 0.86,
      4.2,
      context.deltaSeconds
    );
    this.pressureWaveLight.distance = context.smoothValue(
      this.pressureWaveLight.distance,
      4.8 + strongestWaveLight * 3.6,
      3.6,
      context.deltaSeconds
    );
    this.pressureWaveAccentLight.distance = context.smoothValue(
      this.pressureWaveAccentLight.distance,
      4.2 + strongestWaveAccent * 3.2,
      3.2,
      context.deltaSeconds
    );
  }

  trigger(context: PressureWaveTriggerContext): void {
    if (!this.built || this.pressureWaves.length === 0) {
      return;
    }

    const triggerSource = context.triggerSource ?? 'moment';
    const band = this.selectPressureWaveBand(context.frame);
    const style = this.resolvePressureWaveStyle(context.frame, band, triggerSource);
    const activeWaveCount = this.pressureWaves.reduce(
      (count, candidate) => count + (candidate.active ? 1 : 0),
      0
    );
    const baseCooldown =
      triggerSource === 'macro'
        ? 0.34
        : triggerSource === 'drop'
          ? 0.42
          : 0.56;
    const cooldown = THREE.MathUtils.clamp(
      baseCooldown -
        context.intensity * 0.06 -
        context.frame.sectionChange * 0.04 -
        context.frame.dropImpact * 0.03,
      0.28,
      0.68
    );
    const secondsSinceLast =
      context.elapsedSeconds - this.lastPressureWaveTriggerSeconds;
    const intensityOverride =
      context.intensity > (triggerSource === 'moment' ? 1.42 : 1.24) ||
      context.frame.sectionChange > 0.32;

    if (
      triggerSource === 'moment' &&
      context.frame.transientConfidence < 0.32 &&
      context.frame.accent < 0.34 &&
      context.frame.momentAmount < 0.3
    ) {
      return;
    }

    if (
      triggerSource === 'drop' &&
      context.frame.dropImpact < 0.34 &&
      context.frame.sectionChange < 0.24
    ) {
      return;
    }

    if (
      activeWaveCount >= 1 &&
      secondsSinceLast < cooldown * 1.15 &&
      !intensityOverride
    ) {
      return;
    }

    if (secondsSinceLast < cooldown && !intensityOverride) {
      return;
    }

    const wave =
      this.pressureWaves.find((candidate) => !candidate.active) ??
      this.pressureWaves.reduce((oldest, candidate) =>
        candidate.age > oldest.age ? candidate : oldest
      );
    const signature = hashSignature(
      [
        Math.floor(context.frame.timestampMs / 90),
        band,
        style,
        triggerSource,
        context.activeAct,
        context.activeFamily,
        context.paletteState,
        context.frame.momentKind,
        Math.round(context.frame.harmonicColor * 10),
        Math.round(context.intensity * 10),
        Math.round(context.warmMix * 10)
      ].join(':')
    );
    const spinNorm = ((signature >>> 1) % 1024) / 1023;
    const tiltXNorm = ((signature >>> 11) % 1024) / 1023;
    const tiltYNorm = ((signature >>> 21) % 1024) / 1023;
    const driftNorm = ((signature >>> 7) % 1024) / 1023;
    const liftNorm = ((signature >>> 17) % 1024) / 1023;
    const depthNorm = ((signature >>> 27) % 32) / 31;

    wave.age = 0;
    wave.active = true;
    wave.intensity = context.intensity;
    wave.warmMix = THREE.MathUtils.clamp(context.warmMix, 0, 1);
    wave.band = band;
    wave.style = style;
    wave.colorCycle = signature % PRESSURE_WAVE_COLOR_FAMILIES[band].length;

    switch (style) {
      case 'ground-swell':
        wave.spin =
          (signature % 2 === 0 ? 1 : -1) *
          THREE.MathUtils.lerp(0.08, 0.28, spinNorm) *
          (0.82 + context.intensity * 0.12);
        wave.tiltX = THREE.MathUtils.lerp(-0.08, 0.08, tiltXNorm);
        wave.tiltY = THREE.MathUtils.lerp(-0.12, 0.12, tiltYNorm);
        wave.driftX = THREE.MathUtils.lerp(-0.16, 0.16, driftNorm);
        wave.driftY = THREE.MathUtils.lerp(-0.08, 0.04, liftNorm);
        wave.depthBias = THREE.MathUtils.lerp(-0.18, 0.04, depthNorm);
        wave.expansion = 4.4 + context.intensity * 1.8;
        wave.anchorY = -0.22 - context.frame.body * 0.08;
        wave.anchorZ = -0.98 - context.frame.dropImpact * 0.16;
        wave.haloBias = 0.44;
        wave.glowBias = 0.78;
        break;
      case 'ion-crown':
        wave.spin =
          (signature % 2 === 0 ? 1 : -1) *
          THREE.MathUtils.lerp(0.32, 0.82, spinNorm) *
          (0.78 + context.intensity * 0.18);
        wave.tiltX = THREE.MathUtils.lerp(0.08, 0.24, tiltXNorm);
        wave.tiltY = THREE.MathUtils.lerp(-0.26, 0.26, tiltYNorm);
        wave.driftX = THREE.MathUtils.lerp(-0.18, 0.18, driftNorm);
        wave.driftY = THREE.MathUtils.lerp(0.02, 0.18, liftNorm);
        wave.depthBias = THREE.MathUtils.lerp(-0.04, 0.18, depthNorm);
        wave.expansion = 2.8 + context.intensity * 1.26;
        wave.anchorY = 0.02 + context.frame.air * 0.06;
        wave.anchorZ = -0.56 - context.frame.releaseTail * 0.08;
        wave.haloBias = 1.06;
        wave.glowBias = 0.52;
        break;
      default:
        wave.spin =
          (signature % 2 === 0 ? 1 : -1) *
          THREE.MathUtils.lerp(0.18, 0.52, spinNorm) *
          (0.74 + context.intensity * 0.18);
        wave.tiltX = THREE.MathUtils.lerp(-0.18, 0.18, tiltXNorm);
        wave.tiltY = THREE.MathUtils.lerp(-0.18, 0.18, tiltYNorm);
        wave.driftX = THREE.MathUtils.lerp(-0.24, 0.24, driftNorm);
        wave.driftY = THREE.MathUtils.lerp(-0.08, 0.12, liftNorm);
        wave.depthBias = THREE.MathUtils.lerp(-0.1, 0.12, depthNorm);
        wave.expansion = 3.5 + context.intensity * 1.58;
        wave.anchorY = -0.08 + (liftNorm - 0.5) * 0.08;
        wave.anchorZ = -0.76 - context.frame.dropImpact * 0.1;
        wave.haloBias = 0.76;
        wave.glowBias = 0.66;
        break;
    }

    wave.group.visible = true;
    wave.group.position.set(0, wave.anchorY, wave.anchorZ);
    wave.group.rotation.set(Math.PI / 2, 0, 0);
    wave.waveMesh.scale.setScalar(1);
    wave.torusMesh.scale.setScalar(0.92);
    wave.haloMesh.scale.setScalar(0.84);
    wave.waveMesh.material.opacity = 0;
    wave.torusMesh.material.opacity = 0;
    wave.haloMesh.material.opacity = 0;
    this.lastPressureWaveTriggerSeconds = context.elapsedSeconds;
  }

  getAverageOpacity(): number {
    return this.pressureWaves.length > 0
      ? this.pressureWaves.reduce(
          (sum, wave) =>
            sum +
            (wave.group.visible
              ? (wave.waveMesh.material.opacity +
                  wave.torusMesh.material.opacity * 1.15 +
                  wave.haloMesh.material.opacity * 0.9) /
                3.05
              : 0),
          0
        ) / this.pressureWaves.length
      : 0;
  }

  dispose(): void {
    this.pressureWaves.forEach(({ group, waveMesh, torusMesh, haloMesh }) => {
      this.accentGroup.remove(group);
      waveMesh.geometry.dispose();
      waveMesh.material.dispose();
      torusMesh.geometry.dispose();
      torusMesh.material.dispose();
      haloMesh.geometry.dispose();
      haloMesh.material.dispose();
    });

    this.pressureWaves.length = 0;
    this.accentGroup.remove(this.pressureWaveLight);
    this.accentGroup.remove(this.pressureWaveAccentLight);
    this.pressureWaveLight.intensity = 0;
    this.pressureWaveAccentLight.intensity = 0;
    this.built = false;
  }

  private selectPressureWaveBand(frame: ListeningFrame): PressureWaveBand {
    const lowScore =
      frame.subPressure * 1.32 +
      frame.bassBody * 1.08 +
      frame.body * 0.3 +
      frame.dropImpact * 0.22;
    const midScore =
      frame.lowMidBody * 1.04 +
      frame.presence * 0.34 +
      frame.resonance * 0.48 +
      frame.accent * 0.28;
    const highScore =
      frame.air * 1.04 +
      frame.shimmer * 1.16 +
      frame.brightness * 0.74 +
      frame.accent * 0.22;

    if (lowScore >= midScore && lowScore >= highScore) {
      return 'sub';
    }

    if (highScore > lowScore && highScore > midScore) {
      return 'high';
    }

    return 'mid';
  }

  private resolvePressureWaveStyle(
    frame: ListeningFrame,
    band: PressureWaveBand,
    triggerSource: PressureWaveTriggerSource
  ): PressureWaveStyle {
    if (band === 'sub') {
      return 'ground-swell';
    }

    if (
      band === 'high' ||
      (triggerSource === 'macro' &&
        (frame.showState === 'aftermath' || frame.releaseTail > 0.26))
    ) {
      return 'ion-crown';
    }

    return 'torsion-arc';
  }
}
