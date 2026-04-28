import * as THREE from 'three';
import type { PaletteState } from '../../types/visual';

type Satellite = {
  mesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshPhysicalMaterial>;
  orbitRadius: number;
  orbitSpeed: number;
  offset: number;
};

type Shard = {
  mesh: THREE.Mesh<THREE.TetrahedronGeometry, THREE.MeshPhysicalMaterial>;
  orbitRadius: number;
  orbitSpeed: number;
  offset: number;
  tilt: number;
};

export type AccentOrbitUpdateContext = {
  elapsedSeconds: number;
  paletteState: PaletteState;
  laserActWeight: number;
  matrixActWeight: number;
  eclipseActWeight: number;
  ghostActWeight: number;
  portalWeight: number;
  cathedralWeight: number;
  stormWeight: number;
  ghostWeight: number;
  haloIgnition: number;
  portalOpen: number;
  directorWorldActivity: number;
  directorLaserDrive: number;
  directorColorBias: number;
  ambientGlow: number;
  eventGlow: number;
  beatPhase: number;
  phrasePhase: number;
  body: number;
  liftPulse: number;
  sectionChange: number;
  shimmer: number;
  harmonicColor: number;
  accent: number;
  strikePulse: number;
  transientConfidence: number;
  preDropTension: number;
  dropImpact: number;
};

const HERO_GOLD = new THREE.Color('#b67c3e');
const HERO_TEAL = new THREE.Color('#1e7a77');
const GHOST_PALE = new THREE.Color('#f1e8d8');
const LASER_CYAN = new THREE.Color('#35f4ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const ACID_LIME = new THREE.Color('#bcff39');
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

export class AccentOrbitSystem {
  private readonly accentGroup: THREE.Group;
  private readonly satellites: Satellite[] = [];
  private readonly shards: Shard[] = [];
  private built = false;

  constructor(input: { accentGroup: THREE.Group }) {
    this.accentGroup = input.accentGroup;
  }

  build(): void {
    if (this.built) {
      return;
    }

    for (let index = 0; index < 7; index += 1) {
      const material = new THREE.MeshPhysicalMaterial({
        color: GHOST_PALE.clone(),
        emissive: HERO_GOLD.clone(),
        emissiveIntensity: 0.08,
        metalness: 0.22,
        roughness: 0.16,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 1), material);

      this.satellites.push({
        mesh,
        orbitRadius: 1.9 + index * 0.26,
        orbitSpeed: 0.22 + index * 0.05,
        offset: index * 0.8
      });
      this.accentGroup.add(mesh);
    }

    for (let index = 0; index < 12; index += 1) {
      const material = new THREE.MeshPhysicalMaterial({
        color: HERO_GOLD.clone(),
        emissive: HERO_TEAL.clone(),
        emissiveIntensity: 0.04,
        metalness: 0.36,
        roughness: 0.22,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.11, 0), material);

      this.shards.push({
        mesh,
        orbitRadius: 1.45 + index * 0.16,
        orbitSpeed: 0.34 + index * 0.04,
        offset: index * 0.52,
        tilt: 0.2 + index * 0.09
      });
      this.accentGroup.add(mesh);
    }

    this.built = true;
  }

  update(context: AccentOrbitUpdateContext): void {
    if (!this.built) {
      return;
    }

    const paletteVoid = context.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = context.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = context.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = context.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = context.paletteState === 'ghost-white' ? 1 : 0;
    const warmBias = Math.max(0, (context.directorColorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - context.directorColorBias) * 2);
    const beatPulse = onsetPulse(context.beatPhase);
    const phrasePulse = phasePulse(
      context.phrasePhase,
      context.elapsedSeconds * 0.44
    );

    this.satellites.forEach((satellite) => {
      const angle =
        context.elapsedSeconds *
          satellite.orbitSpeed *
          (0.5 +
            context.portalWeight * 0.8 +
            context.cathedralWeight * 0.26 +
            context.directorLaserDrive * 0.34 +
            context.directorWorldActivity * 0.22 +
            context.preDropTension * 0.14 +
            context.dropImpact * 0.18) +
        satellite.offset;
      const orbitRadius =
        satellite.orbitRadius +
        context.portalWeight * 0.6 +
        context.body * 0.18 +
        context.liftPulse * 0.22 +
        context.sectionChange * 0.16;

      satellite.mesh.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 1.14) * orbitRadius * 0.42,
        Math.sin(angle * 0.76) * 1.2 - context.portalWeight * 0.6
      );
      satellite.mesh.rotation.set(angle * 0.7, angle * 0.6, angle * 0.4);
      satellite.mesh.material.color
        .copy(ELECTRIC_WHITE)
        .lerp(
          LASER_CYAN,
          context.portalWeight * 0.34 +
            context.ghostWeight * 0.12 +
            coolBias * 0.2 +
            context.laserActWeight * 0.12 +
            paletteVoid * 0.22
        )
        .lerp(TRON_BLUE, context.matrixActWeight * 0.12 + paletteTron * 0.18)
        .lerp(
          ACID_LIME,
          context.shimmer * 0.1 +
            beatPulse * 0.12 +
            context.matrixActWeight * 0.12 +
            paletteAcid * 0.24
        )
        .lerp(
          SOLAR_ORANGE,
          context.harmonicColor * 0.14 +
            context.haloIgnition * 0.12 +
            warmBias * 0.1 +
            paletteSolar * 0.18
        )
        .lerp(
          HOT_MAGENTA,
          phrasePulse * 0.04 +
            context.dropImpact * 0.05 +
            context.eclipseActWeight * 0.08 +
            paletteSolar * 0.06
        )
        .lerp(
          ELECTRIC_WHITE,
          context.ghostActWeight * 0.06 + paletteGhost * 0.18
        )
        .lerp(
          CYBER_YELLOW,
          context.haloIgnition * 0.1 + paletteSolar * 0.06
        );
      satellite.mesh.material.opacity =
        context.ambientGlow *
          (0.026 +
            context.portalWeight * 0.02 +
            context.cathedralWeight * 0.012 +
            context.directorWorldActivity * 0.014) +
        context.eventGlow *
          (context.haloIgnition * 0.16 +
            context.shimmer * 0.1 +
            context.dropImpact * 0.14);
      satellite.mesh.material.emissiveIntensity =
        0.08 +
        context.ambientGlow * 0.08 +
        context.shimmer * 0.12 +
        context.haloIgnition * 0.24 +
        context.eventGlow * 0.18 +
        context.dropImpact * 0.14;
    });

    this.shards.forEach((shard) => {
      const angle =
        context.elapsedSeconds *
          shard.orbitSpeed *
          (0.54 +
            context.stormWeight * 1.2 +
            context.directorLaserDrive * 0.46 +
            context.directorWorldActivity * 0.28 +
            context.dropImpact * 0.24 +
            context.preDropTension * 0.16) +
        shard.offset;
      const orbitRadius =
        shard.orbitRadius +
        context.stormWeight * 1.2 +
        context.accent * 0.3 +
        context.strikePulse * 0.36 +
        beatPulse * context.dropImpact * 0.42;

      shard.mesh.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle * 1.4 + shard.tilt) * orbitRadius * 0.34,
        Math.cos(angle * 0.7 + shard.tilt) * 0.9 - context.stormWeight * 0.4
      );
      shard.mesh.rotation.set(angle * 1.2, angle * 0.7, angle * 1.4);
      shard.mesh.scale.setScalar(
        0.72 + context.stormWeight * 0.3 + context.accent * 0.18
      );
      shard.mesh.material.color
        .copy(ELECTRIC_WHITE)
        .lerp(
          LASER_CYAN,
          (1 - context.harmonicColor) * 0.28 +
            context.stormWeight * 0.18 +
            coolBias * 0.18 +
            context.laserActWeight * 0.12 +
            paletteVoid * 0.16
        )
        .lerp(TRON_BLUE, context.matrixActWeight * 0.12 + paletteTron * 0.16)
        .lerp(
          ACID_LIME,
          beatPulse * 0.08 +
            context.transientConfidence * 0.08 +
            context.matrixActWeight * 0.1 +
            paletteAcid * 0.22
        )
        .lerp(
          SOLAR_ORANGE,
          context.harmonicColor * 0.16 +
            context.stormWeight * 0.08 +
            warmBias * 0.1 +
            paletteSolar * 0.18
        )
        .lerp(
          HOT_MAGENTA,
          phrasePulse * 0.04 +
            context.dropImpact * 0.05 +
            context.eclipseActWeight * 0.08 +
            paletteSolar * 0.06
        )
        .lerp(
          ELECTRIC_WHITE,
          context.ghostWeight * 0.12 +
            beatPulse * 0.08 +
            paletteGhost * 0.18
        );
      shard.mesh.material.opacity =
        context.ambientGlow *
          (0.018 +
            context.stormWeight * 0.02 +
            context.directorWorldActivity * 0.014) +
        context.eventGlow *
          (context.accent * 0.14 +
            context.strikePulse * 0.16 +
            context.dropImpact * 0.18);
      shard.mesh.material.emissiveIntensity =
        0.06 +
        context.ambientGlow * 0.06 +
        context.stormWeight * 0.18 +
        context.strikePulse * 0.22 +
        context.portalOpen * 0.08 +
        context.eventGlow * 0.16 +
        context.dropImpact * 0.16;
    });
  }

  dispose(): void {
    this.satellites.forEach(({ mesh }) => {
      this.accentGroup.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.shards.forEach(({ mesh }) => {
      this.accentGroup.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.satellites.length = 0;
    this.shards.length = 0;
    this.built = false;
  }

  getSatelliteActivity(): number {
    return this.satellites.length > 0
      ? this.satellites.reduce(
          (sum, satellite) =>
            sum +
            (satellite.mesh.visible
              ? satellite.mesh.material.emissiveIntensity * 0.08 +
                satellite.mesh.material.opacity * 0.8
              : 0),
          0
        ) / this.satellites.length
      : 0;
  }
}
