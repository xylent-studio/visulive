import * as THREE from 'three';
import type { SceneQualityProfile } from '../../runtime';
import type { PostSystemTelemetry } from '../post/PostSystem';
import type {
  AuthorityFrameSnapshot,
  PaletteFrame,
  PlayableMotifSceneDriver,
  PlayableMotifSceneKind,
  PlayableMotifSceneTransitionReason,
  SignatureMomentSnapshot,
  StageCuePlan,
  VisualMotifKind
} from '../../../types/visual';

export type PlayableMotifSystemUpdateContext = {
  elapsedSeconds: number;
  deltaSeconds: number;
  qualityProfile: SceneQualityProfile;
  signatureMoment: SignatureMomentSnapshot;
  authority: AuthorityFrameSnapshot;
  visualMotif: VisualMotifKind;
  paletteFrame: PaletteFrame;
  stageCuePlan: StageCuePlan;
  postTelemetry: PostSystemTelemetry;
  audio: {
    preDropTension: number;
    dropImpact: number;
    sectionChange: number;
    releaseTail: number;
    musicConfidence: number;
    beatPhase: number;
    phrasePhase: number;
    shimmer: number;
  };
};

export type PlayableMotifSystemTelemetry = {
  activePlayableMotifScene: PlayableMotifSceneKind;
  playableMotifSceneDriver: PlayableMotifSceneDriver;
  playableMotifSceneIntentMatch: boolean;
  playableMotifSceneAgeSeconds: number;
  playableMotifSceneTransitionReason: PlayableMotifSceneTransitionReason;
  playableMotifSceneIntensity: number;
  playableMotifSceneMotifMatch: boolean;
  playableMotifScenePaletteMatch: boolean;
  playableMotifSceneDistinctness: number;
  playableMotifSceneSilhouetteConfidence: number;
};

type ScenePosture = {
  expectedMotifs: readonly VisualMotifKind[];
  expectedPaletteBases: readonly PaletteFrame['baseState'][];
  minimumDwellSeconds: number;
  distinctness: number;
  silhouetteConfidence: number;
};

const SCENE_POSTURES: Record<Exclude<PlayableMotifSceneKind, 'none'>, ScenePosture> = {
  'neon-cathedral': {
    expectedMotifs: ['neon-portal', 'world-takeover'],
    expectedPaletteBases: ['tron-blue', 'acid-lime', 'solar-magenta'],
    minimumDwellSeconds: 7.4,
    distinctness: 0.86,
    silhouetteConfidence: 0.82
  },
  'machine-tunnel': {
    expectedMotifs: ['machine-grid', 'acoustic-transient'],
    expectedPaletteBases: ['tron-blue', 'acid-lime', 'void-cyan'],
    minimumDwellSeconds: 6.8,
    distinctness: 0.78,
    silhouetteConfidence: 0.76
  },
  'void-pressure': {
    expectedMotifs: ['void-anchor', 'world-takeover'],
    expectedPaletteBases: ['void-cyan', 'tron-blue'],
    minimumDwellSeconds: 8.2,
    distinctness: 0.82,
    silhouetteConfidence: 0.8
  },
  'ghost-constellation': {
    expectedMotifs: ['ghost-residue', 'silence-constellation'],
    expectedPaletteBases: ['ghost-white', 'void-cyan', 'solar-magenta'],
    minimumDwellSeconds: 9.2,
    distinctness: 0.72,
    silhouetteConfidence: 0.68
  },
  'collapse-scar': {
    expectedMotifs: ['rupture-scar', 'world-takeover', 'machine-grid'],
    expectedPaletteBases: ['void-cyan', 'solar-magenta', 'tron-blue'],
    minimumDwellSeconds: 5.6,
    distinctness: 0.9,
    silhouetteConfidence: 0.88
  }
};

const VOID_BLACK = new THREE.Color('#010205');
const DEEP_BLUE = new THREE.Color('#06133e');
const ELECTRIC_CYAN = new THREE.Color('#40f8ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const ACID_LIME = new THREE.Color('#baff32');
const HOT_MAGENTA = new THREE.Color('#ff32c8');
const GHOST_WARM = new THREE.Color('#f1e7d2');

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function paletteColor(target: THREE.Color, palette: PaletteFrame['baseState']): THREE.Color {
  switch (palette) {
    case 'tron-blue':
      return target.copy(TRON_BLUE);
    case 'acid-lime':
      return target.copy(ACID_LIME);
    case 'solar-magenta':
      return target.copy(HOT_MAGENTA);
    case 'ghost-white':
      return target.copy(GHOST_WARM);
    default:
      return target.copy(ELECTRIC_CYAN);
  }
}

function resolveSceneFromSignature(
  moment: SignatureMomentSnapshot,
  motif?: VisualMotifKind
): PlayableMotifSceneKind | null {
  if (
    moment.kind === 'cathedral-open' &&
    (moment.phase === 'precharge' ||
      moment.phase === 'strike' ||
      moment.phase === 'hold' ||
      moment.phase === 'residue')
  ) {
    return 'neon-cathedral';
  }

  if (
    moment.kind === 'collapse-scar' &&
    (moment.phase === 'precharge' ||
      moment.phase === 'strike' ||
      moment.phase === 'hold' ||
      (moment.phase === 'residue' &&
        (motif === 'rupture-scar' || moment.postConsequence > 0.48)))
  ) {
    return 'collapse-scar';
  }

  if (
    (moment.kind === 'ghost-residue' || moment.kind === 'silence-constellation') &&
    moment.phase !== 'idle' &&
    moment.phase !== 'clear'
  ) {
    return 'ghost-constellation';
  }

  return null;
}

function resolveSceneFromMotif(
  motif: VisualMotifKind,
  plan: StageCuePlan
): PlayableMotifSceneKind {
  if (motif === 'neon-portal') {
    return 'neon-cathedral';
  }

  if (motif === 'machine-grid' || motif === 'acoustic-transient') {
    return 'machine-tunnel';
  }

  if (motif === 'rupture-scar') {
    return 'collapse-scar';
  }

  if (motif === 'ghost-residue' || motif === 'silence-constellation') {
    return 'ghost-constellation';
  }

  if (motif === 'world-takeover') {
    return plan.worldMode === 'cathedral-rise' ? 'neon-cathedral' : 'void-pressure';
  }

  return 'void-pressure';
}

function resolveTransitionReason(
  context: PlayableMotifSystemUpdateContext,
  targetScene: PlayableMotifSceneKind
): PlayableMotifSceneTransitionReason {
  if (resolveSceneFromSignature(context.signatureMoment, context.visualMotif) === targetScene) {
    return 'signature-moment';
  }

  if (
    context.visualMotif === 'rupture-scar' ||
    context.stageCuePlan.family === 'rupture' ||
    context.audio.dropImpact > 0.62
  ) {
    return 'drop-rupture';
  }

  if (
    context.visualMotif === 'ghost-residue' ||
    context.stageCuePlan.family === 'release' ||
    context.audio.releaseTail > 0.48
  ) {
    return 'release-residue';
  }

  if (
    context.visualMotif === 'silence-constellation' ||
    context.stageCuePlan.family === 'haunt'
  ) {
    return 'quiet-state';
  }

  if (
    context.authority.worldDominanceDelivered > 0.58 ||
    context.stageCuePlan.dominance === 'world'
  ) {
    return 'authority-shift';
  }

  if (context.audio.sectionChange > 0.34) {
    return 'section-turn';
  }

  return 'motif-change';
}

function resolveSceneDriver(
  context: PlayableMotifSystemUpdateContext,
  targetScene: PlayableMotifSceneKind,
  activeScene: PlayableMotifSceneKind
): PlayableMotifSceneDriver {
  if (resolveSceneFromSignature(context.signatureMoment, context.visualMotif) === targetScene) {
    return 'signature';
  }

  if (
    context.visualMotif === 'ghost-residue' ||
    context.stageCuePlan.family === 'release' ||
    context.audio.releaseTail > 0.48
  ) {
    return 'release';
  }

  if (
    context.visualMotif === 'silence-constellation' ||
    context.stageCuePlan.family === 'haunt'
  ) {
    return 'quiet';
  }

  if (
    context.visualMotif === 'world-takeover' ||
    context.authority.worldDominanceDelivered > 0.58 ||
    context.stageCuePlan.dominance === 'world'
  ) {
    return 'authority';
  }

  return targetScene === activeScene ? 'hold' : 'motif';
}

export class PlayableMotifSystem {
  readonly group = new THREE.Group();

  private readonly portalMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly portalMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly tunnelMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly tunnelMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly voidMaterial = new THREE.MeshBasicMaterial({
    color: VOID_BLACK.clone(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  private readonly voidMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9.2, 5.2),
    this.voidMaterial
  );
  private readonly scarMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly scarMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly constellationGeometry = new THREE.BufferGeometry();
  private readonly constellationMaterial = new THREE.PointsMaterial({
    size: 0.035,
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
  private readonly colorScratch = new THREE.Color();
  private readonly colorScratchB = new THREE.Color();
  private activeScene: PlayableMotifSceneKind = 'none';
  private lastSceneChangeSeconds = 0;
  private transitionReason: PlayableMotifSceneTransitionReason = 'hold';
  private qualityScalar = 1;
  private built = false;
  private disposed = false;
  private telemetry: PlayableMotifSystemTelemetry = {
    activePlayableMotifScene: 'none',
    playableMotifSceneDriver: 'hold',
    playableMotifSceneIntentMatch: true,
    playableMotifSceneAgeSeconds: 0,
    playableMotifSceneTransitionReason: 'hold',
    playableMotifSceneIntensity: 0,
    playableMotifSceneMotifMatch: true,
    playableMotifScenePaletteMatch: true,
    playableMotifSceneDistinctness: 0,
    playableMotifSceneSilhouetteConfidence: 0
  };

  build(): void {
    if (this.built || this.disposed) {
      return;
    }

    this.group.position.z = -5.95;

    for (let index = 0; index < 6; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? ELECTRIC_CYAN.clone() : HOT_MAGENTA.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 5.8), material);
      mesh.renderOrder = 47;
      this.portalMaterials.push(material);
      this.portalMeshes.push(mesh);
      this.group.add(mesh);
    }

    for (let index = 0; index < 10; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? TRON_BLUE.clone() : ACID_LIME.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 0.055), material);
      mesh.renderOrder = 47;
      this.tunnelMaterials.push(material);
      this.tunnelMeshes.push(mesh);
      this.group.add(mesh);
    }

    this.voidMesh.renderOrder = 47;
    this.group.add(this.voidMesh);

    for (let index = 0; index < 5; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? VOID_BLACK.clone() : HOT_MAGENTA.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: index % 2 === 0 ? THREE.NormalBlending : THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 7.8), material);
      mesh.renderOrder = 48;
      this.scarMaterials.push(material);
      this.scarMeshes.push(mesh);
      this.group.add(mesh);
    }

    this.seedConstellation(140);
    this.constellationPoints.renderOrder = 48;
    this.group.add(this.constellationPoints);

    this.built = true;
  }

  applyQualityProfile(profile: SceneQualityProfile): void {
    this.qualityScalar =
      profile.tier === 'premium' ? 1 : profile.tier === 'balanced' ? 0.84 : 0.68;
  }

  update(context: PlayableMotifSystemUpdateContext): void {
    if (!this.built || this.disposed) {
      return;
    }

    this.applyQualityProfile(context.qualityProfile);

    const signatureScene = resolveSceneFromSignature(
      context.signatureMoment,
      context.visualMotif
    );
    const targetScene =
      signatureScene ?? resolveSceneFromMotif(context.visualMotif, context.stageCuePlan);
    const reason = resolveTransitionReason(context, targetScene);
    const sceneDriver = resolveSceneDriver(context, targetScene, this.activeScene);
    this.maybeTransitionScene(context, targetScene, reason);

    const ageSeconds = Math.max(0, context.elapsedSeconds - this.lastSceneChangeSeconds);
    const intensity = this.resolveIntensity(context, ageSeconds);
    const motifMatch = this.matchesMotif(this.activeScene, context.visualMotif);
    const paletteMatch = this.matchesPalette(this.activeScene, context.paletteFrame.baseState);
    const sceneIntentMatch = this.matchesSceneIntent(
      this.activeScene,
      context,
      sceneDriver,
      targetScene
    );
    const posture =
      this.activeScene !== 'none' ? SCENE_POSTURES[this.activeScene] : null;
    const distinctness =
      posture?.distinctness ?? 0;
    const silhouetteConfidence =
      (posture?.silhouetteConfidence ?? 0) *
      (motifMatch ? 1 : 0.72) *
      (paletteMatch ? 1 : 0.84);

    this.updatePortal(context, this.activeScene === 'neon-cathedral' ? intensity : 0);
    this.updateTunnel(context, this.activeScene === 'machine-tunnel' ? intensity : 0);
    this.updateVoidPressure(context, this.activeScene === 'void-pressure' ? intensity : 0);
    this.updateGhostConstellation(
      context,
      this.activeScene === 'ghost-constellation' ? intensity : 0
    );
    this.updateScar(context, this.activeScene === 'collapse-scar' ? intensity : 0);

    this.telemetry = {
      activePlayableMotifScene: this.activeScene,
      playableMotifSceneDriver: sceneDriver,
      playableMotifSceneIntentMatch: sceneIntentMatch,
      playableMotifSceneAgeSeconds: ageSeconds,
      playableMotifSceneTransitionReason: this.transitionReason,
      playableMotifSceneIntensity: intensity,
      playableMotifSceneMotifMatch: motifMatch,
      playableMotifScenePaletteMatch: paletteMatch,
      playableMotifSceneDistinctness: distinctness,
      playableMotifSceneSilhouetteConfidence: clamp01(
        silhouetteConfidence * (sceneIntentMatch ? 1 : 0.8)
      )
    };
  }

  collectTelemetryInputs(): PlayableMotifSystemTelemetry {
    return { ...this.telemetry };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    for (const mesh of this.portalMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    for (const mesh of this.tunnelMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    this.voidMesh.removeFromParent();
    this.voidMesh.geometry.dispose();
    this.voidMaterial.dispose();

    for (const mesh of this.scarMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    this.constellationPoints.removeFromParent();
    this.constellationGeometry.dispose();
    this.constellationMaterial.dispose();

    this.group.clear();
    this.disposed = true;
    this.built = false;
  }

  private maybeTransitionScene(
    context: PlayableMotifSystemUpdateContext,
    targetScene: PlayableMotifSceneKind,
    reason: PlayableMotifSceneTransitionReason
  ): void {
    if (targetScene === this.activeScene) {
      this.transitionReason = 'hold';
      return;
    }

    const ageSeconds = Math.max(0, context.elapsedSeconds - this.lastSceneChangeSeconds);
    const posture =
      this.activeScene !== 'none' ? SCENE_POSTURES[this.activeScene] : null;
    const urgent =
      reason === 'signature-moment' ||
      reason === 'drop-rupture' ||
      targetScene === 'collapse-scar';
    const minimumDwellSeconds =
      this.activeScene === 'none' ? 0 : urgent ? 1.2 : posture?.minimumDwellSeconds ?? 7;

    if (ageSeconds >= minimumDwellSeconds) {
      this.activeScene = targetScene;
      this.lastSceneChangeSeconds = context.elapsedSeconds;
      this.transitionReason = reason;
    } else {
      this.transitionReason = 'hold';
    }
  }

  private resolveIntensity(
    context: PlayableMotifSystemUpdateContext,
    ageSeconds: number
  ): number {
    const onset = 1 - Math.exp(-ageSeconds * 1.7);
    const phraseEnergy = clamp01(
      context.audio.preDropTension * 0.22 +
        context.audio.sectionChange * 0.24 +
        context.audio.dropImpact * 0.28 +
        context.audio.releaseTail * 0.14 +
        context.stageCuePlan.stageWeight * 0.22 +
        context.stageCuePlan.worldWeight * 0.18 +
        context.audio.musicConfidence * 0.18
    );
    const signatureLift =
      context.signatureMoment.kind !== 'none'
        ? context.signatureMoment.intensity * 0.42
        : 0;
    const safetyDamp = clamp01(
      1 -
        context.authority.overbright * 0.44 -
        Math.max(0, context.authority.ringBeltPersistence - 0.42) * 0.22
    );

    return clamp01((0.24 + phraseEnergy + signatureLift) * onset * safetyDamp);
  }

  private matchesMotif(
    scene: PlayableMotifSceneKind,
    motif: VisualMotifKind
  ): boolean {
    if (scene === 'none') {
      return true;
    }

    return SCENE_POSTURES[scene].expectedMotifs.includes(motif);
  }

  private matchesPalette(
    scene: PlayableMotifSceneKind,
    baseState: PaletteFrame['baseState']
  ): boolean {
    if (scene === 'none') {
      return true;
    }

    return SCENE_POSTURES[scene].expectedPaletteBases.includes(baseState);
  }

  private matchesSceneIntent(
    scene: PlayableMotifSceneKind,
    context: PlayableMotifSystemUpdateContext,
    driver: PlayableMotifSceneDriver,
    targetScene: PlayableMotifSceneKind
  ): boolean {
    if (scene === 'none') {
      return true;
    }

    if (scene === targetScene) {
      return true;
    }

    if (driver === 'signature') {
      return resolveSceneFromSignature(context.signatureMoment, context.visualMotif) === scene;
    }

    if (driver === 'release' || driver === 'quiet') {
      return scene === 'ghost-constellation';
    }

    if (driver === 'authority') {
      return scene === 'void-pressure' || scene === 'neon-cathedral';
    }

    return this.matchesMotif(scene, context.visualMotif);
  }

  private updatePortal(
    context: PlayableMotifSystemUpdateContext,
    amount: number
  ): void {
    const pulse =
      0.78 +
      Math.sin(context.elapsedSeconds * 0.56 + context.audio.phrasePhase * Math.PI) *
        0.08;
    const opacityBase =
      amount * pulse * this.qualityScalar *
      (context.signatureMoment.kind === 'cathedral-open' ? 1.16 : 0.88);
    this.portalMeshes.forEach((mesh, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const lane = Math.floor(index / 2);
      mesh.material.color
        .copy(index % 3 === 0 ? ELECTRIC_CYAN : HOT_MAGENTA)
        .lerp(ACID_LIME, context.paletteFrame.baseState === 'acid-lime' ? 0.22 : 0)
        .lerp(GHOST_WARM, context.signatureMoment.style === 'ambient-premium' ? 0.12 : 0);
      mesh.material.opacity = THREE.MathUtils.clamp(
        opacityBase * (0.05 + lane * 0.018),
        0,
        0.22
      );
      mesh.position.set(
        side * (1.65 + lane * 0.72 + amount * 0.42),
        lane === 2 ? 0.8 + amount * 0.18 : 0,
        lane * 0.012
      );
      mesh.rotation.z = side * (0.04 + lane * 0.12 + amount * 0.04);
      mesh.scale.set(1 + amount * (1.4 + lane * 0.35), 1 + amount * 0.28, 1);
    });
  }

  private updateTunnel(
    context: PlayableMotifSystemUpdateContext,
    amount: number
  ): void {
    this.tunnelMeshes.forEach((mesh, index) => {
      const lane = index - (this.tunnelMeshes.length - 1) / 2;
      const perspective = 1 - Math.abs(lane) / 6;
      const beatPulse = 0.86 + Math.sin(context.audio.beatPhase * Math.PI * 2 + index) * 0.12;
      mesh.material.color
        .copy(index % 2 === 0 ? TRON_BLUE : ACID_LIME)
        .lerp(HOT_MAGENTA, context.audio.shimmer * 0.14);
      mesh.material.opacity = THREE.MathUtils.clamp(
        amount * beatPulse * (0.028 + perspective * 0.035) * this.qualityScalar,
        0,
        0.14
      );
      mesh.position.set(
        Math.sin(context.elapsedSeconds * 0.16 + index) * amount * 0.12,
        lane * (0.34 + amount * 0.18),
        index * 0.008
      );
      mesh.rotation.z = lane * 0.025 + amount * 0.06;
      mesh.scale.set(1 + amount * (1.8 + Math.abs(lane) * 0.1), 1, 1);
    });
  }

  private updateVoidPressure(
    context: PlayableMotifSystemUpdateContext,
    amount: number
  ): void {
    this.voidMaterial.color.copy(VOID_BLACK).lerp(DEEP_BLUE, amount * 0.18);
    this.voidMaterial.opacity = THREE.MathUtils.clamp(
      amount *
        (0.08 + context.authority.worldDominanceDelivered * 0.06) *
        this.qualityScalar,
      0,
      0.18
    );
    this.voidMesh.scale.set(0.58 + amount * 0.36, 0.54 + amount * 0.24, 1);
  }

  private updateGhostConstellation(
    context: PlayableMotifSystemUpdateContext,
    amount: number
  ): void {
    this.constellationMaterial.color
      .copy(GHOST_WARM)
      .lerp(paletteColor(this.colorScratch, context.paletteFrame.baseState), 0.18);
    this.constellationMaterial.opacity = THREE.MathUtils.clamp(
      amount * (0.22 + context.audio.releaseTail * 0.1) * this.qualityScalar,
      0,
      0.34
    );
    this.constellationPoints.rotation.z =
      Math.sin(context.elapsedSeconds * 0.045) * 0.04;
    this.constellationPoints.scale.setScalar(1 + amount * 0.1);
  }

  private updateScar(
    context: PlayableMotifSystemUpdateContext,
    amount: number
  ): void {
    this.scarMeshes.forEach((mesh, index) => {
      const darkCut = index % 2 === 0;
      mesh.material.color
        .copy(darkCut ? VOID_BLACK : HOT_MAGENTA)
        .lerp(this.colorScratchB.copy(TRON_BLUE), darkCut ? 0.08 : 0.18);
      mesh.material.opacity = THREE.MathUtils.clamp(
        amount * (darkCut ? 0.17 : 0.075) * this.qualityScalar,
        0,
        darkCut ? 0.3 : 0.16
      );
      mesh.position.set(index * 0.18 - 0.36, 0, 0.025 + index * 0.01);
      mesh.rotation.z = -0.64 + index * 0.05 + context.audio.dropImpact * 0.08;
      mesh.scale.set(1 + amount * 4.8, 1 + amount * (0.4 + index * 0.08), 1);
    });
  }

  private seedConstellation(count: number): void {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399963 + Math.sin(index * 0.37) * 0.24;
      const radius = Math.sqrt(index / count) * 3.8;
      positions[index * 3] = Math.cos(angle) * radius * 1.35;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.72;
      positions[index * 3 + 2] = 0;

      const color = index % 3 === 0 ? GHOST_WARM : index % 3 === 1 ? ELECTRIC_CYAN : HOT_MAGENTA;
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
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
}
