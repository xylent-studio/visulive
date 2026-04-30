import * as THREE from 'three';
import type { SceneQualityProfile } from '../../runtime';
import type {
  AuthorityFrameSnapshot,
  CompositorMaskFamily,
  PaletteState,
  ResolvedSignatureMomentStyle,
  SignatureMomentSnapshot
} from '../../../types/visual';
import type { PostSystemTelemetry } from '../post/PostSystem';
import type { PlayableMotifSystemTelemetry } from '../motif/PlayableMotifSystem';

export type CompositorSystemUpdateContext = {
  elapsedSeconds: number;
  deltaSeconds: number;
  qualityProfile: SceneQualityProfile;
  signatureMoment: SignatureMomentSnapshot;
  postTelemetry: PostSystemTelemetry;
  playableMotif: PlayableMotifSystemTelemetry;
  authority: AuthorityFrameSnapshot;
  paletteState: PaletteState;
};

export type CompositorSystemTelemetry = {
  compositorMaskFamily: CompositorMaskFamily;
  compositorSignatureMask: number;
  compositorCutAmount: number;
  compositorVignetteAmount: number;
  compositorChromaticAmount: number;
  compositorEdgeWindowAmount: number;
  compositorContrastLift: number;
  compositorSaturationLift: number;
  compositorExposureBias: number;
  compositorBloomBias: number;
  compositorAfterImageBias: number;
  compositorOverprocessRisk: number;
  perceptualContrastScore: number;
  perceptualColorfulnessScore: number;
  perceptualWashoutRisk: number;
};

const VOID_BLACK = new THREE.Color('#010205');
const ELECTRIC_CYAN = new THREE.Color('#42f8ff');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const ACID_LIME = new THREE.Color('#bcff39');
const GHOST_WARM = new THREE.Color('#f4e6cf');
const DEEP_BLUE = new THREE.Color('#08184f');

function clamp01(value: number): number {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function styleSaturation(style: ResolvedSignatureMomentStyle): number {
  return style === 'maximal-neon' ? 1.18 : style === 'ambient-premium' ? 0.58 : 0.68;
}

function styleContrast(style: ResolvedSignatureMomentStyle): number {
  return style === 'contrast-mythic' ? 1.08 : style === 'ambient-premium' ? 0.6 : 0.86;
}

function resolveCompositorMaskFamily(
  context: CompositorSystemUpdateContext
): CompositorMaskFamily {
  const moment = context.signatureMoment;
  const signatureOwnsMask =
    moment.phase === 'precharge' ||
    moment.phase === 'strike' ||
    moment.phase === 'hold' ||
    moment.phase === 'residue';

  if (moment.kind === 'collapse-scar' && signatureOwnsMask) {
    return 'scar-matte';
  }

  if (moment.kind === 'cathedral-open' && signatureOwnsMask) {
    return 'portal-aperture';
  }

  if (
    (moment.kind === 'ghost-residue' || moment.kind === 'silence-constellation') &&
    signatureOwnsMask
  ) {
    return 'ghost-veil';
  }

  if (context.playableMotif.compositorMaskFamily) {
    return context.playableMotif.compositorMaskFamily;
  }

  switch (context.playableMotif.activePlayableMotifScene) {
    case 'machine-tunnel':
      return 'shutter';
    case 'void-pressure':
      return 'iris';
    case 'neon-cathedral':
      return 'portal-aperture';
    case 'ghost-constellation':
      return 'ghost-veil';
    case 'collapse-scar':
      return 'scar-matte';
    default:
      return 'none';
  }
}

export class CompositorSystem {
  readonly group = new THREE.Group();

  private readonly vignetteMaterial = new THREE.MeshBasicMaterial({
    color: VOID_BLACK.clone(),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  private readonly vignetteMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(13.2, 7.6),
    this.vignetteMaterial
  );
  private readonly cutMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly cutMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly bandMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly bandMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private readonly edgeMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly edgeMeshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private qualityScalar = 1;
  private built = false;
  private disposed = false;
  private telemetry: CompositorSystemTelemetry = {
    compositorMaskFamily: 'none',
    compositorSignatureMask: 0,
    compositorCutAmount: 0,
    compositorVignetteAmount: 0,
    compositorChromaticAmount: 0,
    compositorEdgeWindowAmount: 0,
    compositorContrastLift: 0,
    compositorSaturationLift: 0,
    compositorExposureBias: 0,
    compositorBloomBias: 0,
    compositorAfterImageBias: 0,
    compositorOverprocessRisk: 0,
    perceptualContrastScore: 0.62,
    perceptualColorfulnessScore: 0.52,
    perceptualWashoutRisk: 0
  };

  build(): void {
    if (this.built || this.disposed) {
      return;
    }

    this.group.position.z = -5.85;
    this.vignetteMesh.renderOrder = 50;
    this.group.add(this.vignetteMesh);

    for (let index = 0; index < 3; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: VOID_BLACK.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 8.2), material);
      mesh.renderOrder = 51;
      this.cutMaterials.push(material);
      this.cutMeshes.push(mesh);
      this.group.add(mesh);
    }

    for (let index = 0; index < 4; index += 1) {
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
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 0.08), material);
      mesh.renderOrder = 52;
      this.bandMaterials.push(material);
      this.bandMeshes.push(mesh);
      this.group.add(mesh);
    }

    for (let index = 0; index < 4; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: GHOST_WARM.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 7.5), material);
      mesh.renderOrder = 53;
      this.edgeMaterials.push(material);
      this.edgeMeshes.push(mesh);
      this.group.add(mesh);
    }

    this.built = true;
  }

  applyQualityProfile(profile: SceneQualityProfile): void {
    this.qualityScalar =
      profile.tier === 'premium' ? 1 : profile.tier === 'balanced' ? 0.84 : 0.68;
  }

  update(context: CompositorSystemUpdateContext): void {
    if (!this.built) {
      return;
    }

    this.applyQualityProfile(context.qualityProfile);

    const moment = context.signatureMoment;
    const style = moment.style;
    const intensity = clamp01(moment.intensity);
    const maskFamily = resolveCompositorMaskFamily(context);
    const collapse = moment.kind === 'collapse-scar' ? intensity : 0;
    const cathedral = moment.kind === 'cathedral-open' ? intensity : 0;
    const ghost = moment.kind === 'ghost-residue' ? intensity : 0;
    const quiet = moment.kind === 'silence-constellation' ? intensity : 0;
    const sceneIntensity = clamp01(context.playableMotif.playableMotifSceneIntensity);
    const sceneContrast =
      context.playableMotif.activePlayableMotifScene === 'collapse-scar' ||
      context.playableMotif.activePlayableMotifScene === 'void-pressure'
        ? sceneIntensity * 0.18
        : 0;
    const sceneNeon =
      context.playableMotif.activePlayableMotifScene === 'neon-cathedral' ||
      context.playableMotif.activePlayableMotifScene === 'machine-tunnel'
        ? sceneIntensity * 0.14
        : 0;
    const portalMask = maskFamily === 'portal-aperture' ? sceneIntensity * 0.18 : 0;
    const shutterMask = maskFamily === 'shutter' || maskFamily === 'slit' ? sceneIntensity * 0.16 : 0;
    const irisMask = maskFamily === 'iris' ? sceneIntensity * 0.2 : 0;
    const scarMask = maskFamily === 'scar-matte' ? sceneIntensity * 0.22 : 0;
    const ghostMask = maskFamily === 'ghost-veil' ? sceneIntensity * 0.14 : 0;
    const contrastBias = styleContrast(style);
    const saturationBias = styleSaturation(style);
    const safetyDamp = clamp01(
      1 -
        context.authority.overbright * 0.5 -
        Math.max(0, context.authority.ringBeltPersistence - 0.3) * 0.24
    );
    const signatureMask = clamp01(
      collapse * 0.82 +
        cathedral * 0.72 +
        ghost * 0.58 +
        quiet * 0.42 +
        portalMask +
        shutterMask +
        irisMask +
        scarMask +
        ghostMask
    );
    const cutAmount = clamp01(collapse * 0.86 + ghost * 0.18 + scarMask + shutterMask * 0.32);
    const vignetteAmount = clamp01(
      collapse * 0.36 +
        ghost * 0.18 +
        quiet * 0.16 +
        sceneContrast +
        irisMask +
        ghostMask * 0.4 +
        (style === 'contrast-mythic' ? signatureMask * 0.12 : 0)
    );
    const chromaticAmount = clamp01(
      cathedral * 0.6 * saturationBias +
        collapse * 0.18 +
        ghost * 0.16 +
        sceneNeon +
        portalMask * 0.42 +
        shutterMask * 0.28 +
        (style === 'maximal-neon' ? signatureMask * 0.28 : 0)
    );
    const edgeWindowAmount = clamp01(
      cathedral * (style === 'maximal-neon' ? 0.84 : 0.68) +
        quiet * 0.38 +
        portalMask +
        ghostMask * 0.4
    );

    this.updateVignette(vignetteAmount, contrastBias, safetyDamp);
    this.updateCuts(context, cutAmount, contrastBias, safetyDamp);
    this.updateBands(context, chromaticAmount, saturationBias, safetyDamp);
    this.updateEdges(context, edgeWindowAmount, style, safetyDamp);

    const compositorContrastLift = clamp01(
      cutAmount * 0.4 + vignetteAmount * 0.26 + edgeWindowAmount * 0.18 + sceneContrast * 0.22
    );
    const compositorSaturationLift = clamp01(
      chromaticAmount * 0.46 + quiet * 0.14 + cathedral * 0.22 + sceneNeon * 0.18
    );
    const perceptualContrastScore = clamp01(
      0.5 +
        compositorContrastLift * 0.34 +
        context.authority.frameHierarchyScore * 0.16 -
        context.authority.overbright * 0.16
    );
    const perceptualColorfulnessScore = clamp01(
      0.42 +
        compositorSaturationLift * 0.38 +
        context.postTelemetry.postConsequenceIntensity * 0.12 -
        context.authority.overbright * 0.1
    );
    const perceptualWashoutRisk = clamp01(
      context.authority.overbright * 0.44 +
        Math.max(0, context.authority.ringBeltPersistence - 0.34) * 0.34 +
        context.postTelemetry.postOverprocessRisk * 0.26 -
        perceptualContrastScore * 0.22 -
        perceptualColorfulnessScore * 0.1
    );
    const compositorOverprocessRisk = clamp01(
      signatureMask * 0.18 +
        chromaticAmount * 0.2 +
        context.postTelemetry.postOverprocessRisk * 0.36 +
        perceptualWashoutRisk * 0.32
    );

    this.telemetry = {
      compositorMaskFamily: maskFamily,
      compositorSignatureMask: signatureMask,
      compositorCutAmount: cutAmount,
      compositorVignetteAmount: vignetteAmount,
      compositorChromaticAmount: chromaticAmount,
      compositorEdgeWindowAmount: edgeWindowAmount,
      compositorContrastLift,
      compositorSaturationLift,
      compositorExposureBias:
        compositorContrastLift * -0.038 +
        compositorSaturationLift * (style === 'maximal-neon' ? 0.006 : 0.014) -
        perceptualWashoutRisk * 0.04,
      compositorBloomBias:
        compositorSaturationLift * (style === 'maximal-neon' ? 0.05 : 0.08) -
        compositorContrastLift * 0.06 -
        perceptualWashoutRisk * 0.12,
      compositorAfterImageBias:
        ghost * 0.05 + quiet * 0.02 + collapse * 0.018 - cutAmount * 0.012,
      compositorOverprocessRisk,
      perceptualContrastScore,
      perceptualColorfulnessScore,
      perceptualWashoutRisk
    };
  }

  collectTelemetryInputs(): CompositorSystemTelemetry {
    return { ...this.telemetry };
  }

  resetForShowStart(): void {
    this.vignetteMaterial.opacity = 0;
    for (const material of this.cutMaterials) {
      material.opacity = 0;
    }
    for (const material of this.bandMaterials) {
      material.opacity = 0;
    }
    for (const material of this.edgeMaterials) {
      material.opacity = 0;
    }
    this.telemetry = {
      compositorMaskFamily: 'none',
      compositorSignatureMask: 0,
      compositorCutAmount: 0,
      compositorVignetteAmount: 0,
      compositorChromaticAmount: 0,
      compositorEdgeWindowAmount: 0,
      compositorContrastLift: 0,
      compositorSaturationLift: 0,
      compositorExposureBias: 0,
      compositorBloomBias: 0,
      compositorAfterImageBias: 0,
      compositorOverprocessRisk: 0,
      perceptualContrastScore: 0.62,
      perceptualColorfulnessScore: 0.52,
      perceptualWashoutRisk: 0
    };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.vignetteMesh.removeFromParent();
    this.vignetteMesh.geometry.dispose();
    this.vignetteMaterial.dispose();

    for (const mesh of this.cutMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    for (const mesh of this.bandMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    for (const mesh of this.edgeMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    }

    this.group.clear();
    this.disposed = true;
    this.built = false;
  }

  private updateVignette(amount: number, contrastBias: number, safetyDamp: number): void {
    this.vignetteMaterial.color.copy(VOID_BLACK).lerp(DEEP_BLUE, amount * 0.14);
    this.vignetteMaterial.opacity = THREE.MathUtils.clamp(
      amount * 0.24 * contrastBias * safetyDamp * this.qualityScalar,
      0,
      0.28
    );
    this.vignetteMesh.scale.setScalar(1 + amount * 0.05);
  }

  private updateCuts(
    context: CompositorSystemUpdateContext,
    amount: number,
    contrastBias: number,
    safetyDamp: number
  ): void {
    this.cutMeshes.forEach((mesh, index) => {
      const lane = index - 1;
      const wobble = Math.sin(context.elapsedSeconds * 0.23 + index * 1.7) * 0.08;
      mesh.material.color.copy(VOID_BLACK).lerp(DEEP_BLUE, amount * 0.08);
      mesh.material.opacity = THREE.MathUtils.clamp(
        amount * (0.12 + index * 0.015) * contrastBias * safetyDamp * this.qualityScalar,
        0,
        0.22
      );
      mesh.position.set(lane * (1.2 + amount * 0.6) + wobble, 0, 0.02 + index * 0.01);
      mesh.rotation.z = lane * 0.12 + amount * 0.08;
      mesh.scale.set(1 + amount * 4.2, 1, 1);
    });
  }

  private updateBands(
    context: CompositorSystemUpdateContext,
    amount: number,
    saturationBias: number,
    safetyDamp: number
  ): void {
    this.bandMeshes.forEach((mesh, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const paletteMix = context.paletteState === 'acid-lime' ? ACID_LIME : HOT_MAGENTA;
      mesh.material.color
        .copy(index % 2 === 0 ? ELECTRIC_CYAN : HOT_MAGENTA)
        .lerp(paletteMix, amount * 0.18)
        .lerp(GHOST_WARM, context.signatureMoment.style === 'ambient-premium' ? 0.18 : 0);
      mesh.material.opacity = THREE.MathUtils.clamp(
        amount * (0.042 + index * 0.012) * saturationBias * safetyDamp * this.qualityScalar,
        0,
        0.16
      );
      mesh.position.set(
        Math.sin(context.elapsedSeconds * (0.12 + index * 0.02)) * amount * 0.2,
        side * (2.9 - index * 0.34 - amount * 0.6),
        0.04 + index * 0.01
      );
      mesh.rotation.z = side * (0.035 + amount * 0.05);
      mesh.scale.set(1 + amount * 0.12, 1 + amount * 1.6, 1);
    });
  }

  private updateEdges(
    context: CompositorSystemUpdateContext,
    amount: number,
    style: ResolvedSignatureMomentStyle,
    safetyDamp: number
  ): void {
    this.edgeMeshes.forEach((mesh, index) => {
      const side = index < 2 ? -1 : 1;
      const lane = index % 2;
      mesh.material.color
        .copy(style === 'ambient-premium' ? GHOST_WARM : ELECTRIC_CYAN)
        .lerp(ACID_LIME, style === 'maximal-neon' ? 0.22 : 0)
        .lerp(VOID_BLACK, style === 'contrast-mythic' ? 0.18 : 0);
      mesh.material.opacity = THREE.MathUtils.clamp(
        amount * (0.05 + lane * 0.018) * safetyDamp * this.qualityScalar,
        0,
        style === 'maximal-neon' ? 0.2 : 0.16
      );
      mesh.position.set(
        side * (5.45 - amount * (1.18 + lane * 0.46)),
        Math.sin(context.elapsedSeconds * 0.12 + lane) * amount * 0.1,
        0.06 + index * 0.008
      );
      mesh.rotation.z = side * (0.025 + amount * 0.06);
      mesh.scale.set(1 + amount * 2.2, 1 + amount * 0.2, 1);
    });
  }
}
