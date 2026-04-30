import * as THREE from 'three';
import type { SceneQualityProfile } from '../../runtime';
import type { PostSystemTelemetry } from '../post/PostSystem';
import type {
  AuthorityFrameSnapshot,
  CompositorMaskFamily,
  PaletteFrame,
  ParticleFieldJob,
  PlayableMotifSceneDriver,
  PlayableMotifSceneKind,
  PlayableMotifSceneTransitionReason,
  SceneSilhouetteFamily,
  SceneSurfaceRole,
  SignatureMomentSnapshot,
  StageCuePlan,
  VisualAssetPackId,
  VisualMotifKind
} from '../../../types/visual';
import {
  getSceneVisualProfile,
  sceneProfileMatchesMotif,
  sceneProfileMatchesPalette
} from '../../assets/visualAssetProfiles';

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
  playableMotifSceneProfileId: PlayableMotifSceneKind;
  playableMotifSceneAssetPackIds: readonly VisualAssetPackId[];
  playableMotifSceneSilhouetteFamily: SceneSilhouetteFamily;
  playableMotifSceneSurfaceRole: SceneSurfaceRole;
  playableMotifSceneProfileMatch: boolean;
  compositorMaskFamily: CompositorMaskFamily;
  particleFieldJob: ParticleFieldJob;
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

  if (moment.kind === 'collapse-scar') {
    const collapseIsEarned =
      motif === 'rupture-scar' ||
      (moment.postConsequence > 0.58 &&
        (moment.worldLead > 0.7 || moment.safetyRisk > 0.58));
    const collapseResidueStillOwnsScene =
      motif === 'rupture-scar' ||
      (moment.postConsequence > 0.64 &&
        (moment.worldLead > 0.72 || moment.safetyRisk > 0.6));

    if (
      ((moment.phase === 'precharge' ||
        moment.phase === 'strike' ||
        moment.phase === 'hold') &&
        collapseIsEarned) ||
      (moment.phase === 'residue' && collapseResidueStillOwnsScene)
    ) {
      return 'collapse-scar';
    }
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

function isHardRuptureContext(context: PlayableMotifSystemUpdateContext): boolean {
  return (
    context.stageCuePlan.family === 'rupture' ||
    context.stageCuePlan.worldMode === 'collapse-well' ||
    context.stageCuePlan.transformIntent === 'collapse'
  );
}

function resolveSceneFromContext(
  context: PlayableMotifSystemUpdateContext
): PlayableMotifSceneKind {
  const signatureScene = resolveSceneFromSignature(
    context.signatureMoment,
    context.visualMotif
  );
  if (signatureScene) {
    return signatureScene;
  }

  if (
    isHardRuptureContext(context) &&
    context.audio.dropImpact >= 0.34 &&
    context.audio.releaseTail < 0.34
  ) {
    return 'collapse-scar';
  }

  if (context.visualMotif === 'rupture-scar' && !isHardRuptureContext(context)) {
    if (
      context.stageCuePlan.family === 'release' ||
      context.stageCuePlan.residueMode === 'ghost' ||
      context.audio.releaseTail > 0.32
    ) {
      return 'ghost-constellation';
    }

    if (
      context.stageCuePlan.family === 'reveal' ||
      context.stageCuePlan.worldMode === 'fan-sweep' ||
      context.stageCuePlan.worldMode === 'cathedral-rise'
    ) {
      return 'neon-cathedral';
    }

    return context.authority.worldDominanceDelivered > 0.58
      ? 'void-pressure'
      : 'machine-tunnel';
  }

  if (
    context.stageCuePlan.family === 'gather' &&
    context.audio.dropImpact < 0.42 &&
    context.audio.releaseTail < 0.36
  ) {
    return 'machine-tunnel';
  }

  return resolveSceneFromMotif(context.visualMotif, context.stageCuePlan);
}

function resolveTransitionReason(
  context: PlayableMotifSystemUpdateContext,
  targetScene: PlayableMotifSceneKind
): PlayableMotifSceneTransitionReason {
  if (resolveSceneFromSignature(context.signatureMoment, context.visualMotif) === targetScene) {
    return 'signature-moment';
  }

  if (
    targetScene === 'collapse-scar' &&
    (isHardRuptureContext(context) || context.visualMotif === 'rupture-scar')
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
    playableMotifSceneProfileId: 'none',
    playableMotifSceneAssetPackIds: [],
    playableMotifSceneSilhouetteFamily: 'none',
    playableMotifSceneSurfaceRole: 'none',
    playableMotifSceneProfileMatch: true,
    compositorMaskFamily: 'none',
    particleFieldJob: 'none',
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

    const targetScene = resolveSceneFromContext(context);
    const reason = resolveTransitionReason(context, targetScene);
    const requestedSceneDriver = resolveSceneDriver(context, targetScene, this.activeScene);
    this.maybeTransitionScene(context, targetScene, reason);
    const sceneDriver =
      this.transitionReason === 'hold' && this.activeScene !== targetScene
        ? 'hold'
        : requestedSceneDriver;

    const ageSeconds = Math.max(0, context.elapsedSeconds - this.lastSceneChangeSeconds);
    const intensity = this.resolveIntensity(context, ageSeconds);
    const motifMatch = this.matchesMotif(this.activeScene, context.visualMotif);
    const paletteMatch = this.matchesPalette(this.activeScene, context.paletteFrame.baseState);
    const profile = getSceneVisualProfile(this.activeScene);
    const sceneIntentMatch = this.matchesSceneIntent(
      this.activeScene,
      context,
      sceneDriver,
      targetScene
    );
    const profileMatch =
      this.activeScene === 'none'
        ? true
        : profile?.id === this.activeScene &&
          (motifMatch ||
            resolveSceneFromSignature(context.signatureMoment, context.visualMotif) ===
              this.activeScene) &&
          (paletteMatch ||
            resolveSceneFromSignature(context.signatureMoment, context.visualMotif) ===
              this.activeScene);
    const distinctness = profile?.distinctness ?? 0;
    const silhouetteConfidence =
      (profile?.silhouetteConfidence ?? 0) *
      (motifMatch ? 1 : 0.78) *
      (paletteMatch ? 1 : 0.88) *
      (profileMatch ? 1 : 0.92);

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
      playableMotifSceneProfileId: profile?.id ?? 'none',
      playableMotifSceneAssetPackIds: profile?.assetPackIds ?? [],
      playableMotifSceneSilhouetteFamily: profile?.silhouetteFamily ?? 'none',
      playableMotifSceneSurfaceRole: profile?.surfaceRole ?? 'none',
      playableMotifSceneProfileMatch: profileMatch,
      compositorMaskFamily: profile?.compositorMask ?? 'none',
      particleFieldJob: profile?.particleJob ?? 'none',
      playableMotifSceneDriver: sceneDriver,
      playableMotifSceneIntentMatch: sceneIntentMatch,
      playableMotifSceneAgeSeconds: ageSeconds,
      playableMotifSceneTransitionReason: this.transitionReason,
      playableMotifSceneIntensity: intensity,
      playableMotifSceneMotifMatch: motifMatch,
      playableMotifScenePaletteMatch: paletteMatch,
      playableMotifSceneDistinctness: distinctness,
      playableMotifSceneSilhouetteConfidence: clamp01(
        silhouetteConfidence * (sceneIntentMatch ? 1 : 0.84)
      )
    };
  }

  collectTelemetryInputs(): PlayableMotifSystemTelemetry {
    return { ...this.telemetry };
  }

  resetForShowStart(): void {
    this.activeScene = 'none';
    this.lastSceneChangeSeconds = 0;
    this.transitionReason = 'hold';
    this.voidMaterial.opacity = 0;
    this.constellationMaterial.opacity = 0;
    for (const material of this.portalMaterials) {
      material.opacity = 0;
    }
    for (const material of this.tunnelMaterials) {
      material.opacity = 0;
    }
    for (const material of this.scarMaterials) {
      material.opacity = 0;
    }
    this.telemetry = {
      activePlayableMotifScene: 'none',
      playableMotifSceneProfileId: 'none',
      playableMotifSceneAssetPackIds: [],
      playableMotifSceneSilhouetteFamily: 'none',
      playableMotifSceneSurfaceRole: 'none',
      playableMotifSceneProfileMatch: true,
      compositorMaskFamily: 'none',
      particleFieldJob: 'none',
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
    const posture = getSceneVisualProfile(this.activeScene);
    const urgent =
      reason === 'signature-moment' ||
      reason === 'drop-rupture';
    const yieldingFromCollapse =
      this.activeScene === 'collapse-scar' && targetScene !== 'collapse-scar';
    const collapseIsResidueOnly =
      context.signatureMoment.kind !== 'collapse-scar' ||
      context.signatureMoment.phase === 'idle' ||
      context.signatureMoment.phase === 'clear' ||
      context.signatureMoment.phase === 'residue';
    const minimumDwellSeconds =
      this.activeScene === 'none'
        ? 0
        : urgent
          ? 1.2
          : yieldingFromCollapse
            ? collapseIsResidueOnly && !isHardRuptureContext(context)
              ? 1.1
              : 2.2
            : posture?.minimumDwellSeconds ?? 7;

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

    return sceneProfileMatchesMotif(getSceneVisualProfile(scene), motif);
  }

  private matchesPalette(
    scene: PlayableMotifSceneKind,
    baseState: PaletteFrame['baseState']
  ): boolean {
    if (scene === 'none') {
      return true;
    }

    return sceneProfileMatchesPalette(getSceneVisualProfile(scene), baseState);
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

    if (driver === 'hold') {
      return true;
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
      const vaultCurve = lane === 2 ? 0.52 : lane === 1 ? 0.18 : -0.1;
      mesh.material.color
        .copy(index % 3 === 0 ? ELECTRIC_CYAN : HOT_MAGENTA)
        .lerp(ACID_LIME, context.paletteFrame.baseState === 'acid-lime' ? 0.22 : 0)
        .lerp(GHOST_WARM, context.signatureMoment.style === 'ambient-premium' ? 0.12 : 0);
      mesh.material.opacity = THREE.MathUtils.clamp(
        opacityBase * (0.07 + lane * 0.024),
        0,
        0.26
      );
      mesh.position.set(
        side * (1.34 + lane * 0.88 + amount * 0.58),
        vaultCurve + amount * (lane === 2 ? 0.36 : 0.08),
        lane * 0.012
      );
      mesh.rotation.z = side * (0.03 + lane * 0.18 + amount * 0.06);
      mesh.scale.set(1 + amount * (1.95 + lane * 0.52), 1 + amount * (0.42 + lane * 0.08), 1);
    });
  }

  private updateTunnel(
    context: PlayableMotifSystemUpdateContext,
    amount: number
  ): void {
    this.tunnelMeshes.forEach((mesh, index) => {
      const lane = index - (this.tunnelMeshes.length - 1) / 2;
      const perspective = 1 - Math.abs(lane) / 6;
      const scan = (context.elapsedSeconds * 0.38 + index * 0.11) % 1;
      const beatPulse =
        0.72 +
        Math.sin(context.audio.beatPhase * Math.PI * 2 + index) * 0.1 +
        Math.max(0, 1 - Math.abs(scan - 0.5) * 3.2) * 0.22;
      mesh.material.color
        .copy(index % 2 === 0 ? TRON_BLUE : ACID_LIME)
        .lerp(HOT_MAGENTA, context.audio.shimmer * 0.14);
      mesh.material.opacity = THREE.MathUtils.clamp(
        amount * beatPulse * (0.034 + perspective * 0.048) * this.qualityScalar,
        0,
        0.18
      );
      mesh.position.set(
        lane * amount * 0.08 + Math.sin(context.elapsedSeconds * 0.16 + index) * amount * 0.1,
        lane * (0.32 + amount * 0.2),
        index * 0.018
      );
      mesh.rotation.z = lane * 0.035 + amount * 0.08;
      mesh.scale.set(1 + amount * (2.2 + Math.abs(lane) * 0.16), 1 + amount * 0.18, 1);
    });
  }

  private updateVoidPressure(
    context: PlayableMotifSystemUpdateContext,
    amount: number
  ): void {
    this.voidMaterial.color.copy(VOID_BLACK).lerp(DEEP_BLUE, amount * 0.18);
    this.voidMaterial.opacity = THREE.MathUtils.clamp(
      amount *
        (0.12 + context.authority.worldDominanceDelivered * 0.08) *
        this.qualityScalar,
      0,
      0.24
    );
    this.voidMesh.position.set(
      Math.sin(context.elapsedSeconds * 0.09) * amount * 0.16,
      -0.08 - amount * 0.12,
      0.015
    );
    this.voidMesh.rotation.z = Math.sin(context.elapsedSeconds * 0.045) * amount * 0.08;
    this.voidMesh.scale.set(0.78 + amount * 0.58, 0.62 + amount * 0.38, 1);
  }

  private updateGhostConstellation(
    context: PlayableMotifSystemUpdateContext,
    amount: number
  ): void {
    this.constellationMaterial.color
      .copy(GHOST_WARM)
      .lerp(paletteColor(this.colorScratch, context.paletteFrame.baseState), 0.18);
    this.constellationMaterial.opacity = THREE.MathUtils.clamp(
      amount * (0.18 + context.audio.releaseTail * 0.16) * this.qualityScalar,
      0,
      0.3
    );
    this.constellationPoints.rotation.z =
      Math.sin(context.elapsedSeconds * 0.045) * 0.04;
    this.constellationPoints.position.set(
      Math.sin(context.elapsedSeconds * 0.035) * amount * 0.12,
      Math.cos(context.elapsedSeconds * 0.027) * amount * 0.08,
      0.018
    );
    this.constellationPoints.scale.set(1 + amount * 0.16, 0.92 + amount * 0.1, 1);
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
        amount * (darkCut ? 0.22 : 0.085) * this.qualityScalar,
        0,
        darkCut ? 0.36 : 0.18
      );
      mesh.position.set(index * 0.22 - 0.58 + amount * 0.18, -0.06 + index * 0.05, 0.025 + index * 0.012);
      mesh.rotation.z = -0.78 + index * 0.07 + context.audio.dropImpact * 0.1;
      mesh.scale.set(1 + amount * (5.8 + index * 0.34), 1 + amount * (0.7 + index * 0.12), 1);
    });
  }

  private seedConstellation(count: number): void {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399963 + Math.sin(index * 0.37) * 0.24;
      const radius = (0.24 + Math.sqrt(index / count) * 3.9) * (index % 7 === 0 ? 1.18 : 1);
      const negativeSpace = index % 11 === 0 ? 0.36 : 1;
      positions[index * 3] = Math.cos(angle) * radius * 1.58 * negativeSpace;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.8 * negativeSpace;
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
