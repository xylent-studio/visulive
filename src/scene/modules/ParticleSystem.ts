import * as THREE from 'three';
import type { AuthorityFrameSnapshot, PaletteState } from '../../types/visual';
import type { SceneQualityProfile } from '../runtime';

type ParticlePoint = {
  radius: number;
  theta: number;
  phi: number;
  drift: number;
  bias: number;
};

export type ParticleSystemUpdateContext = {
  elapsedSeconds: number;
  qualityProfile: SceneQualityProfile;
  authority: AuthorityFrameSnapshot;
  paletteState: PaletteState;
  actWeights: {
    laser: number;
    matrix: number;
    eclipse: number;
    ghost: number;
  };
  familyWeights: {
    portal: number;
    cathedral: number;
    ghost: number;
    storm: number;
    eclipse: number;
    plume: number;
  };
  events: {
    portalOpen: number;
    haloIgnition: number;
    worldStain: number;
  };
  director: {
    energy: number;
    spectacle: number;
    laserDrive: number;
    worldActivity: number;
    colorBias: number;
    colorWarp: number;
  };
  atmosphere: {
    gas: number;
    liquid: number;
    plasma: number;
    crystal: number;
    pressure: number;
    ionization: number;
    residue: number;
  };
  budgets: {
    ambientGlow: number;
    eventGlow: number;
  };
  audio: {
    air: number;
    shimmer: number;
    resonance: number;
    dropImpact: number;
    sectionChange: number;
    transientConfidence: number;
    roomness: number;
    harmonicColor: number;
    phrasePhase: number;
    beatPhase: number;
  };
};

const LASER_CYAN = new THREE.Color('#35f4ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const VOLT_VIOLET = new THREE.Color('#7c4dff');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const ACID_LIME = new THREE.Color('#bcff39');
const MATRIX_GREEN = new THREE.Color('#37ff7c');
const SOLAR_ORANGE = new THREE.Color('#ff9f2d');
const CYBER_YELLOW = new THREE.Color('#ffe933');
const ELECTRIC_WHITE = new THREE.Color('#f7fbff');

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);

  return Math.exp(-clamped * 7);
}

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

export class ParticleSystem {
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material = new THREE.PointsMaterial({
    size: 0.032,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    sizeAttenuation: true,
    vertexColors: true
  });
  private readonly cloud = new THREE.Points(this.geometry, this.material);
  private readonly points: ParticlePoint[] = [];
  private readonly pointScratch = new THREE.Vector3();
  private readonly colorScratch = new THREE.Color();
  private built = false;

  build(): void {
    if (this.built) {
      return;
    }

    const particleCount = 960;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const spread = index / particleCount;
      const point: ParticlePoint = {
        radius: 4.2 + Math.pow(spread, 0.7) * 9.4,
        theta: index * 0.37,
        phi: (index * 0.63) % Math.PI,
        drift: 0.16 + (index % 11) * 0.013,
        bias: ((index % 17) - 8) / 8
      };

      this.points.push(point);
      positions[index * 3] = 0;
      positions[index * 3 + 1] = 0;
      positions[index * 3 + 2] = 0;
      colors[index * 3] = 0.7;
      colors[index * 3 + 1] = 0.66;
      colors[index * 3 + 2] = 0.6;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.built = true;
  }

  getObject(): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
    return this.cloud;
  }

  applyQualityProfile(profile: SceneQualityProfile): void {
    this.geometry.setDrawRange(0, profile.particleDrawCount);
    this.material.opacity = 0.08 * profile.particleOpacityMultiplier;
    this.material.size =
      profile.tier === 'premium' ? 0.04 : profile.tier === 'balanced' ? 0.035 : 0.03;
  }

  update(context: ParticleSystemUpdateContext): void {
    if (!this.built) {
      return;
    }

    const paletteVoid = context.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = context.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = context.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = context.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = context.paletteState === 'ghost-white' ? 1 : 0;
    const warmBias = Math.max(0, (context.director.colorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - context.director.colorBias) * 2);
    const chromaPulse =
      0.5 + 0.5 * Math.sin(context.director.colorBias * Math.PI * 4 + context.elapsedSeconds * 0.22);
    const phrasePulse = phasePulse(
      context.audio.phrasePhase,
      context.elapsedSeconds * 0.36
    );
    const beatPulse = onsetPulse(context.audio.beatPhase);
    const authorityWorldLift = THREE.MathUtils.clamp(
      context.authority.worldDominanceDelivered * 0.86 +
        context.authority.worldGlowSpend * 0.18,
      0,
      1.2
    );
    const authorityChamberLift = THREE.MathUtils.clamp(
      context.authority.chamberPresenceScore * 0.76 +
        context.authority.ringAuthority * 0.14,
      0,
      1.2
    );
    const authorityRingSuppression = THREE.MathUtils.clamp(
      Math.max(0, context.authority.ringBeltPersistence - 0.24) * 0.68 +
        Math.max(0, context.authority.wirefieldDensityScore - 0.2) * 0.56,
      0,
      0.6
    );
    const authorityWashoutSuppression = THREE.MathUtils.clamp(
      context.authority.overbright * 0.32 +
        authorityRingSuppression * 0.24 +
        Math.max(0, context.authority.ringAuthority - 1.04) * 0.16,
      0,
      0.46
    );
    const authorityProminence = THREE.MathUtils.clamp(
      authorityWorldLift * 0.42 +
        authorityChamberLift * 0.28 +
        context.authority.compositionSafetyScore * 0.12 -
        authorityRingSuppression * 0.22 -
        authorityWashoutSuppression * 0.18,
      0,
      1.2
    );
    const positions = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colors = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    const positionArray = positions.array as Float32Array;
    const colorArray = colors.array as Float32Array;
    const count = Math.min(context.qualityProfile.particleDrawCount, this.points.length);

    for (let index = 0; index < count; index += 1) {
      const point = this.points[index]!;
      const orbit =
        point.theta +
        context.elapsedSeconds *
          point.drift *
          (0.4 +
            context.atmosphere.gas * 0.28 +
            context.atmosphere.liquid * 0.36 +
            context.atmosphere.plasma * 0.22 +
            context.familyWeights.portal * 0.7 +
            context.familyWeights.storm * 0.6 +
            context.director.energy * 0.22 +
            context.director.laserDrive * 0.12 +
            context.director.worldActivity * 0.26);
      const lift =
        context.familyWeights.plume * (0.8 + point.bias * 0.4) +
        context.audio.air * 0.12 +
        context.atmosphere.gas * 0.2 +
        context.atmosphere.residue * 0.08;
      const radius =
        point.radius *
        (1 +
          context.atmosphere.gas * 0.05 +
          context.atmosphere.liquid * 0.08 +
          context.atmosphere.plasma * 0.04 +
          context.atmosphere.crystal * 0.02 +
          context.audio.resonance * 0.08 +
          context.director.worldActivity * 0.08 +
          authorityWorldLift * 0.06 +
          context.familyWeights.portal * 0.12 +
          context.familyWeights.cathedral * 0.08 +
          context.events.portalOpen * 0.08 -
          authorityRingSuppression * 0.04 -
          authorityWashoutSuppression * 0.025 -
          context.familyWeights.eclipse * 0.05);
      const polar =
        point.phi +
        Math.sin(context.elapsedSeconds * 0.2 + point.bias * 4.2) *
          (0.04 +
            context.atmosphere.gas * 0.08 +
            context.atmosphere.liquid * 0.12 +
            context.familyWeights.plume * 0.12);

      this.pointScratch.setFromSphericalCoords(radius, polar, orbit);
      this.pointScratch.x +=
        Math.sin(context.elapsedSeconds * 0.8 + point.bias * 9) *
          context.familyWeights.storm *
          0.2 +
        Math.cos(context.elapsedSeconds * 0.24 + point.radius * 0.6) *
          context.atmosphere.liquid *
          0.34;
      this.pointScratch.y +=
        lift * radius * 0.12 +
        Math.sin(context.elapsedSeconds * 0.52 + point.theta) *
          context.atmosphere.plasma *
          0.22 +
        Math.sin(context.elapsedSeconds * 0.4 + point.radius) *
          context.audio.roomness *
          0.08;
      this.pointScratch.z +=
        Math.cos(context.elapsedSeconds * 0.3 + point.bias * 7) *
          context.familyWeights.ghost *
          0.18 +
        Math.sin(context.elapsedSeconds * 0.18 + point.theta * 0.4) *
          context.atmosphere.gas *
          0.3 -
        context.atmosphere.pressure * 0.04;

      const baseIndex = index * 3;
      positionArray[baseIndex] = this.pointScratch.x;
      positionArray[baseIndex + 1] = this.pointScratch.y;
      positionArray[baseIndex + 2] = this.pointScratch.z;

      const baseColor = this.colorScratch
        .copy(LASER_CYAN)
        .lerp(
          TRON_BLUE,
          coolBias * 0.18 +
            context.familyWeights.portal * 0.12 +
            context.actWeights.laser * 0.12 +
            context.actWeights.matrix * 0.14 +
            context.atmosphere.gas * 0.08 +
            context.atmosphere.plasma * 0.08 +
            paletteVoid * 0.14 +
            paletteTron * 0.18
        )
        .lerp(
          ACID_LIME,
          context.audio.shimmer * 0.1 +
            beatPulse * 0.08 +
            context.atmosphere.liquid * 0.08 +
            context.actWeights.matrix * 0.14 +
            paletteAcid * 0.2
        )
        .lerp(
          HOT_MAGENTA,
          context.audio.harmonicColor * 0.08 +
            context.events.haloIgnition * 0.08 +
            warmBias * 0.08 +
            context.atmosphere.plasma * 0.08 +
            context.actWeights.eclipse * 0.12 +
            paletteSolar * 0.06
        )
        .lerp(
          VOLT_VIOLET,
          phrasePulse * 0.03 +
            context.events.worldStain * 0.04 +
            context.atmosphere.residue * 0.06 +
            context.actWeights.ghost * 0.06
        )
        .lerp(SOLAR_ORANGE, warmBias * 0.06 + paletteSolar * 0.12)
        .lerp(
          CYBER_YELLOW,
          beatPulse * 0.06 +
            context.audio.transientConfidence * 0.04 +
            context.atmosphere.ionization * 0.04 +
            chromaPulse * 0.04 +
            paletteSolar * 0.04
        )
        .lerp(
          ELECTRIC_WHITE,
          context.familyWeights.ghost * 0.14 +
            context.familyWeights.eclipse * 0.1 +
            context.atmosphere.crystal * 0.12 +
            point.bias * 0.02 +
            context.director.colorWarp * 0.06 +
            paletteGhost * 0.18
        )
        .lerp(
          MATRIX_GREEN,
          chromaPulse * 0.06 +
            context.atmosphere.liquid * 0.04 +
            context.actWeights.matrix * 0.14 +
            paletteAcid * 0.18
        );

      colorArray[baseIndex] = baseColor.r;
      colorArray[baseIndex + 1] = baseColor.g;
      colorArray[baseIndex + 2] = baseColor.b;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    this.geometry.setDrawRange(0, count);
    this.material.opacity =
      (context.budgets.ambientGlow *
        (0.036 +
          context.audio.air * 0.06 +
          context.atmosphere.gas * 0.04 +
          context.atmosphere.liquid * 0.02 +
          context.atmosphere.residue * 0.04 +
          context.familyWeights.plume * 0.04 +
          context.familyWeights.ghost * 0.04 +
          context.director.worldActivity * 0.03 +
          context.audio.resonance * 0.04) +
        context.budgets.eventGlow *
          (context.events.worldStain * 0.12 +
            context.atmosphere.plasma * 0.08 +
            context.atmosphere.crystal * 0.04 +
            context.audio.dropImpact * 0.14 +
            context.audio.sectionChange * 0.09 +
            context.audio.transientConfidence * 0.08)) *
      context.qualityProfile.particleOpacityMultiplier;
    this.material.opacity +=
      (authorityProminence * 0.028 +
        context.authority.worldDominanceDelivered * 0.018 -
        authorityRingSuppression * 0.024 -
        authorityWashoutSuppression * 0.018) *
      context.qualityProfile.particleOpacityMultiplier;
    this.material.opacity = THREE.MathUtils.clamp(
      this.material.opacity * (1 - authorityWashoutSuppression * 0.24),
      0,
      0.2 * context.qualityProfile.particleOpacityMultiplier
    );
    this.material.size =
      0.032 +
      context.director.spectacle * 0.028 +
      context.director.worldActivity * 0.012 +
      authorityProminence * 0.016 -
      authorityRingSuppression * 0.01 -
      authorityWashoutSuppression * 0.008 +
      context.atmosphere.gas * 0.01 +
      context.atmosphere.liquid * 0.014 +
      context.atmosphere.plasma * 0.012 +
      context.audio.air * 0.016 +
      context.familyWeights.plume * 0.02 +
      context.events.portalOpen * 0.018 +
      context.audio.dropImpact * 0.016 +
      context.director.colorWarp * 0.014;
    this.cloud.rotation.y =
      context.elapsedSeconds *
      (0.03 +
        context.atmosphere.gas * 0.02 +
        context.atmosphere.liquid * 0.03 +
        context.familyWeights.portal * 0.05 +
        context.familyWeights.plume * 0.04 +
        context.director.worldActivity * 0.04);
    this.cloud.rotation.x =
      Math.sin(context.elapsedSeconds * 0.09) *
      (0.04 + context.atmosphere.gas * 0.03);
    this.cloud.rotation.z =
      Math.sin(context.elapsedSeconds * 0.05 + context.audio.phrasePhase * Math.PI * 2) *
      (0.02 + context.atmosphere.plasma * 0.05);
  }

  getOpacity(): number {
    return this.material.opacity;
  }

  dispose(): void {
    this.cloud.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }
}
