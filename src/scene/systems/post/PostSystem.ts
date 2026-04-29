import * as THREE from 'three';
import type { SceneQualityProfile } from '../../runtime';
import type {
  AuthorityFrameSnapshot,
  PaletteState,
  SignatureMomentKind,
  SignatureMomentPhase,
  SignatureMomentSnapshot,
  StageCuePlan
} from '../../../types/visual';

export type PostSystemUpdateContext = {
  elapsedSeconds: number;
  deltaSeconds: number;
  qualityProfile: SceneQualityProfile;
  signatureMoment: SignatureMomentSnapshot;
  authority: AuthorityFrameSnapshot;
  paletteState: PaletteState;
  stageCuePlan: StageCuePlan;
  audio: {
    beatPhase: number;
    phrasePhase: number;
    dropImpact: number;
    releaseTail: number;
    shimmer: number;
    air: number;
    musicConfidence: number;
  };
};

export type PostSystemTelemetry = {
  activeSignatureMoment: SignatureMomentKind;
  signatureMomentPhase: SignatureMomentPhase;
  signatureMomentIntensity: number;
  signatureMomentAgeSeconds: number;
  signatureMomentSuppressionReason: SignatureMomentSnapshot['suppressionReason'];
  collapseScarAmount: number;
  cathedralOpenAmount: number;
  ghostResidueAmount: number;
  silenceConstellationAmount: number;
  memoryTraceCount: number;
  aftermathClearance: number;
  postConsequenceIntensity: number;
  postOverprocessRisk: number;
};

type MemoryTrace = {
  kind: Exclude<SignatureMomentKind, 'none'>;
  seed: number;
  ageSeconds: number;
  intensity: number;
  color: THREE.Color;
  direction: number;
};

const VOID_BLACK = new THREE.Color('#010205');
const SCAR_VIOLET = new THREE.Color('#5f2bff');
const LASER_CYAN = new THREE.Color('#35f4ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const ACID_LIME = new THREE.Color('#bcff39');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const TOXIC_PINK = new THREE.Color('#ff5cff');
const SOLAR_ORANGE = new THREE.Color('#ff9f2d');
const GHOST_PALE = new THREE.Color('#f1e8d8');

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function phaseEnvelope(phase: SignatureMomentPhase): number {
  switch (phase) {
    case 'eligible':
      return 0.22;
    case 'precharge':
      return 0.5;
    case 'strike':
      return 1;
    case 'hold':
      return 0.82;
    case 'residue':
      return 0.48;
    case 'clear':
      return 0.18;
    default:
      return 0;
  }
}

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);
  return Math.exp(-clamped * 7);
}

function copyPaletteColor(target: THREE.Color, palette: PaletteState): THREE.Color {
  switch (palette) {
    case 'tron-blue':
      return target.copy(TRON_BLUE);
    case 'acid-lime':
      return target.copy(ACID_LIME);
    case 'solar-magenta':
      return target.copy(HOT_MAGENTA);
    case 'ghost-white':
      return target.copy(GHOST_PALE);
    default:
      return target.copy(LASER_CYAN);
  }
}

export class PostSystem {
  readonly group = new THREE.Group();

  private readonly veilMaterial = new THREE.MeshBasicMaterial({
    color: VOID_BLACK.clone(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  private readonly veilMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(12.8, 7.2),
    this.veilMaterial
  );
  private readonly scarMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly scarMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly cathedralMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly cathedralPlanes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly ghostMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly ghostRings: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly constellationGeometry = new THREE.BufferGeometry();
  private readonly constellationMaterial = new THREE.PointsMaterial({
    size: 0.034,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexColors: true,
    sizeAttenuation: false
  });
  private readonly constellationPoints = new THREE.Points(
    this.constellationGeometry,
    this.constellationMaterial
  );
  private readonly memoryTraces: MemoryTrace[] = [];
  private readonly colorScratch = new THREE.Color();
  private readonly colorScratchB = new THREE.Color();
  private lastTraceStartedAtSeconds: number | null = null;
  private qualityOpacityScalar = 1;
  private qualityPointCount = 180;
  private built = false;
  private telemetry: PostSystemTelemetry = {
    activeSignatureMoment: 'none',
    signatureMomentPhase: 'idle',
    signatureMomentIntensity: 0,
    signatureMomentAgeSeconds: 0,
    signatureMomentSuppressionReason: 'none',
    collapseScarAmount: 0,
    cathedralOpenAmount: 0,
    ghostResidueAmount: 0,
    silenceConstellationAmount: 0,
    memoryTraceCount: 0,
    aftermathClearance: 1,
    postConsequenceIntensity: 0,
    postOverprocessRisk: 0
  };

  build(): void {
    if (this.built) {
      return;
    }

    this.group.position.z = -6.2;
    this.veilMesh.renderOrder = 42;
    this.group.add(this.veilMesh);

    for (let index = 0; index < 4; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: SCAR_VIOLET.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.18 + index * 0.05, 8.6),
        material
      );
      mesh.renderOrder = 43;
      this.scarMaterials.push(material);
      this.scarMeshes.push(mesh);
      this.group.add(mesh);
    }

    for (let index = 0; index < 6; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? LASER_CYAN.clone() : HOT_MAGENTA.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16 + index * 0.035, 8.2),
        material
      );
      mesh.renderOrder = 44;
      this.cathedralMaterials.push(material);
      this.cathedralPlanes.push(mesh);
      this.group.add(mesh);
    }

    for (let index = 0; index < 3; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: GHOST_PALE.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.72 + index * 0.32, 0.75 + index * 0.32, 96),
        material
      );
      mesh.renderOrder = 45;
      this.ghostMaterials.push(material);
      this.ghostRings.push(mesh);
      this.group.add(mesh);
    }

    this.buildConstellationGeometry();
    this.constellationPoints.renderOrder = 46;
    this.group.add(this.constellationPoints);
    this.built = true;
  }

  applyQualityProfile(profile: SceneQualityProfile): void {
    this.qualityOpacityScalar =
      profile.tier === 'premium' ? 1 : profile.tier === 'balanced' ? 0.88 : 0.74;
    this.qualityPointCount =
      profile.tier === 'premium' ? 180 : profile.tier === 'balanced' ? 140 : 100;
    this.constellationGeometry.setDrawRange(0, this.qualityPointCount);
  }

  update(context: PostSystemUpdateContext): void {
    if (!this.built) {
      return;
    }

    this.applyQualityProfile(context.qualityProfile);
    this.updateMemoryTraces(context);

    const moment = context.signatureMoment;
    const envelope = phaseEnvelope(moment.phase);
    const momentIntensity = clamp01(moment.intensity * envelope);
    const collapseScarAmount =
      moment.kind === 'collapse-scar' ? momentIntensity : 0;
    const cathedralOpenAmount =
      moment.kind === 'cathedral-open' ? momentIntensity : 0;
    const ghostResidueAmount =
      moment.kind === 'ghost-residue' ? momentIntensity : 0;
    const silenceConstellationAmount =
      moment.kind === 'silence-constellation' ? momentIntensity : 0;
    const memoryTraceStrength = this.resolveMemoryTraceStrength();
    const beatPulse = onsetPulse(context.audio.beatPhase);
    const phasePulse =
      0.5 +
      0.5 *
        Math.sin(context.audio.phrasePhase * Math.PI * 2 + context.elapsedSeconds * 0.22);
    const safetyDamp = clamp01(
      1 -
        context.authority.overbright * 0.44 -
        Math.max(0, context.authority.ringBeltPersistence - 0.28) * 0.24
    );
    const qualityScalar = this.qualityOpacityScalar * safetyDamp;

    this.updateVeil({
      collapseScarAmount,
      ghostResidueAmount,
      silenceConstellationAmount,
      qualityScalar
    });
    this.updateScarPlanes(context, collapseScarAmount, memoryTraceStrength, qualityScalar);
    this.updateCathedralPlanes(context, cathedralOpenAmount, phasePulse, qualityScalar);
    this.updateGhostRings(context, ghostResidueAmount, memoryTraceStrength, qualityScalar);
    this.updateConstellation(
      context,
      silenceConstellationAmount,
      ghostResidueAmount,
      beatPulse,
      phasePulse,
      qualityScalar
    );

    const postConsequenceIntensity = clamp01(
      collapseScarAmount * 0.92 +
        cathedralOpenAmount * 0.72 +
        ghostResidueAmount * 0.7 +
        silenceConstellationAmount * 0.38 +
        memoryTraceStrength * 0.34
    );
    const aftermathClearance = clamp01(
      1 - postConsequenceIntensity * 0.52 - memoryTraceStrength * 0.18
    );
    const postOverprocessRisk = clamp01(
      postConsequenceIntensity * 0.34 +
        context.authority.overbright * 0.46 +
        Math.max(0, context.authority.ringBeltPersistence - 0.3) * 0.3 -
        context.authority.compositionSafetyScore * 0.12
    );

    this.telemetry = {
      activeSignatureMoment: moment.kind,
      signatureMomentPhase: moment.phase,
      signatureMomentIntensity: moment.intensity,
      signatureMomentAgeSeconds: moment.ageSeconds,
      signatureMomentSuppressionReason: moment.suppressionReason,
      collapseScarAmount,
      cathedralOpenAmount,
      ghostResidueAmount,
      silenceConstellationAmount,
      memoryTraceCount: this.memoryTraces.length,
      aftermathClearance,
      postConsequenceIntensity,
      postOverprocessRisk
    };
  }

  collectTelemetryInputs(): PostSystemTelemetry {
    return { ...this.telemetry };
  }

  dispose(): void {
    this.veilMesh.removeFromParent();
    this.veilMesh.geometry.dispose();
    this.veilMaterial.dispose();

    for (const mesh of this.scarMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    for (const mesh of this.cathedralPlanes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    for (const mesh of this.ghostRings) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    this.constellationPoints.removeFromParent();
    this.constellationGeometry.dispose();
    this.constellationMaterial.dispose();
    this.memoryTraces.length = 0;
  }

  private buildConstellationGeometry(): void {
    const positions = new Float32Array(180 * 3);
    const colors = new Float32Array(180 * 3);

    for (let index = 0; index < 180; index += 1) {
      const ring = Math.floor(index / 30);
      const inner = index % 30;
      const theta = inner * 2.399963 + ring * 0.41;
      const radius = 0.64 + Math.pow(index / 180, 0.72) * 5.4;
      const wobble = Math.sin(index * 12.9898) * 0.16;
      const baseIndex = index * 3;

      positions[baseIndex] = Math.cos(theta) * (radius + wobble) * 0.92;
      positions[baseIndex + 1] =
        Math.sin(theta) * (radius * 0.52 + wobble) + Math.sin(index * 0.31) * 0.16;
      positions[baseIndex + 2] = 0.04 + ring * 0.006;

      this.colorScratch
        .copy(LASER_CYAN)
        .lerp(TRON_BLUE, (index % 5) * 0.08)
        .lerp(ACID_LIME, index % 7 === 0 ? 0.22 : 0)
        .lerp(GHOST_PALE, index % 11 === 0 ? 0.26 : 0);
      colors[baseIndex] = this.colorScratch.r;
      colors[baseIndex + 1] = this.colorScratch.g;
      colors[baseIndex + 2] = this.colorScratch.b;
    }

    this.constellationGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.constellationGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
  }

  private updateMemoryTraces(context: PostSystemUpdateContext): void {
    for (const trace of this.memoryTraces) {
      trace.ageSeconds += context.deltaSeconds;
    }

    while (
      this.memoryTraces.length > 0 &&
      (this.memoryTraces[0]?.ageSeconds ?? 0) > 12
    ) {
      this.memoryTraces.shift();
    }

    const moment = context.signatureMoment;
    if (
      moment.kind === 'none' ||
      moment.startedAtSeconds === null ||
      moment.startedAtSeconds === this.lastTraceStartedAtSeconds ||
      moment.intensity < 0.24
    ) {
      return;
    }

    this.lastTraceStartedAtSeconds = moment.startedAtSeconds;
    this.memoryTraces.push({
      kind: moment.kind,
      seed: moment.seed,
      ageSeconds: 0,
      intensity: moment.intensity,
      color: copyPaletteColor(new THREE.Color(), context.paletteState),
      direction: ((moment.seed % 2000) / 1000 - 1) * Math.PI
    });

    if (this.memoryTraces.length > 5) {
      this.memoryTraces.splice(0, this.memoryTraces.length - 5);
    }
  }

  private resolveMemoryTraceStrength(): number {
    return clamp01(
      this.memoryTraces.reduce((sum, trace) => {
        const fade = clamp01(1 - trace.ageSeconds / 12);
        return sum + trace.intensity * fade;
      }, 0)
    );
  }

  private updateVeil(input: {
    collapseScarAmount: number;
    ghostResidueAmount: number;
    silenceConstellationAmount: number;
    qualityScalar: number;
  }): void {
    this.veilMaterial.color
      .copy(VOID_BLACK)
      .lerp(SCAR_VIOLET, input.collapseScarAmount * 0.12)
      .lerp(TRON_BLUE, input.silenceConstellationAmount * 0.08);
    this.veilMaterial.opacity = THREE.MathUtils.clamp(
      (input.collapseScarAmount * 0.22 +
        input.ghostResidueAmount * 0.07 +
        input.silenceConstellationAmount * 0.08) *
        input.qualityScalar,
      0,
      0.26
    );
    this.veilMesh.scale.setScalar(
      1 + input.collapseScarAmount * 0.08 + input.ghostResidueAmount * 0.04
    );
  }

  private updateScarPlanes(
    context: PostSystemUpdateContext,
    collapseScarAmount: number,
    memoryTraceStrength: number,
    qualityScalar: number
  ): void {
    this.scarMeshes.forEach((mesh, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const seed = ((context.signatureMoment.seed + index * 137) % 1000) / 1000;
      const sway =
        Math.sin(context.elapsedSeconds * (0.3 + index * 0.04) + seed * 6.28) *
        0.18;
      const amount = collapseScarAmount + memoryTraceStrength * 0.18;

      mesh.material.color
        .copy(SCAR_VIOLET)
        .lerp(HOT_MAGENTA, index * 0.08 + collapseScarAmount * 0.16)
        .lerp(LASER_CYAN, index % 2 === 0 ? 0.18 : 0.06);
      mesh.material.opacity = THREE.MathUtils.clamp(
        amount * (0.08 + index * 0.012) * qualityScalar,
        0,
        0.16
      );
      mesh.position.set(side * (0.4 + seed * 1.8) + sway, 0, index * 0.012);
      mesh.rotation.z =
        side * (0.38 + seed * 0.54) +
        context.signatureMoment.ageSeconds * 0.04 * side;
      mesh.scale.set(
        1 + collapseScarAmount * 2.4,
        1 + collapseScarAmount * 0.3,
        1
      );
    });
  }

  private updateCathedralPlanes(
    context: PostSystemUpdateContext,
    cathedralOpenAmount: number,
    phasePulse: number,
    qualityScalar: number
  ): void {
    this.cathedralPlanes.forEach((mesh, index) => {
      const side = index < 3 ? -1 : 1;
      const lane = index % 3;
      const open = cathedralOpenAmount * (0.86 + lane * 0.08);
      const sweep = context.stageCuePlan.wipeAmount * 0.4 + open * 2.2;

      mesh.material.color
        .copy(side < 0 ? LASER_CYAN : HOT_MAGENTA)
        .lerp(ACID_LIME, lane === 1 ? 0.16 + open * 0.1 : 0.04)
        .lerp(GHOST_PALE, open * 0.12);
      mesh.material.opacity = THREE.MathUtils.clamp(
        open * (0.035 + lane * 0.012) * qualityScalar,
        0,
        0.12
      );
      mesh.position.x =
        side * (4.7 - sweep - lane * 0.38) +
        Math.sin(context.elapsedSeconds * 0.22 + lane) * 0.08;
      mesh.position.y =
        (lane - 1) * 0.24 + Math.sin(context.elapsedSeconds * 0.18) * 0.06;
      mesh.position.z = 0.04 + lane * 0.012;
      mesh.rotation.z =
        side * (0.18 + lane * 0.1 + open * 0.16) +
        Math.sin(context.elapsedSeconds * 0.12 + lane) * 0.02;
      mesh.scale.set(
        1 + open * (1.8 + lane * 0.3),
        1 + phasePulse * open * 0.22,
        1
      );
    });
  }

  private updateGhostRings(
    context: PostSystemUpdateContext,
    ghostResidueAmount: number,
    memoryTraceStrength: number,
    qualityScalar: number
  ): void {
    this.ghostRings.forEach((mesh, index) => {
      const trace = this.memoryTraces[this.memoryTraces.length - 1 - index];
      const traceStrength = trace
        ? trace.intensity * clamp01(1 - trace.ageSeconds / 12)
        : 0;
      const amount = ghostResidueAmount + memoryTraceStrength * 0.24 + traceStrength * 0.18;

      mesh.material.color
        .copy(trace?.color ?? GHOST_PALE)
        .lerp(GHOST_PALE, 0.36)
        .lerp(LASER_CYAN, index * 0.08);
      mesh.material.opacity = THREE.MathUtils.clamp(
        amount * (0.05 + index * 0.012) * qualityScalar,
        0,
        0.13
      );
      mesh.position.x =
        Math.cos((trace?.direction ?? 0) + context.elapsedSeconds * 0.08) *
        amount *
        0.42;
      mesh.position.y =
        Math.sin((trace?.direction ?? 0) + context.elapsedSeconds * 0.06) *
        amount *
        0.24;
      mesh.position.z = 0.08 + index * 0.018;
      mesh.rotation.z =
        (trace?.direction ?? 0) +
        context.elapsedSeconds * (0.08 + index * 0.02);
      mesh.scale.setScalar(
        1.2 + amount * (1.4 + index * 0.32) + context.audio.releaseTail * 0.18
      );
    });
  }

  private updateConstellation(
    context: PostSystemUpdateContext,
    silenceConstellationAmount: number,
    ghostResidueAmount: number,
    beatPulse: number,
    phasePulse: number,
    qualityScalar: number
  ): void {
    const amount = THREE.MathUtils.clamp(
      silenceConstellationAmount +
        ghostResidueAmount * 0.18 +
        context.audio.air * 0.04 +
        context.audio.shimmer * 0.03,
      0,
      1
    );

    copyPaletteColor(this.colorScratch, context.paletteState);
    this.constellationMaterial.opacity = THREE.MathUtils.clamp(
      amount *
        (0.12 +
          context.authority.chamberPresenceScore * 0.05 +
          phasePulse * 0.02) *
        qualityScalar,
      0,
      0.18
    );
    this.constellationMaterial.size =
      0.026 +
      amount * 0.03 +
      beatPulse * 0.004 +
      context.audio.shimmer * 0.008;
    this.constellationPoints.rotation.z =
      context.elapsedSeconds * (0.01 + amount * 0.008) +
      context.audio.phrasePhase * 0.04;
    this.constellationPoints.rotation.x =
      Math.sin(context.elapsedSeconds * 0.04) * amount * 0.04;
    this.constellationPoints.position.y = amount * 0.04;

    const colors = this.constellationGeometry.getAttribute(
      'color'
    ) as THREE.BufferAttribute;
    const colorArray = colors.array as Float32Array;
    const count = Math.min(this.qualityPointCount, 180);

    for (let index = 0; index < count; index += 1) {
      const baseIndex = index * 3;
      const coolMix = 0.24 + ((index * 17) % 100) / 500;
      this.colorScratchB
        .copy(LASER_CYAN)
        .lerp(TRON_BLUE, coolMix)
        .lerp(this.colorScratch, 0.18 + amount * 0.22)
        .lerp(GHOST_PALE, index % 13 === 0 ? 0.22 + amount * 0.08 : 0)
        .lerp(ACID_LIME, index % 19 === 0 ? 0.16 : 0);
      colorArray[baseIndex] = this.colorScratchB.r;
      colorArray[baseIndex + 1] = this.colorScratchB.g;
      colorArray[baseIndex + 2] = this.colorScratchB.b;
    }

    colors.needsUpdate = true;
  }
}
