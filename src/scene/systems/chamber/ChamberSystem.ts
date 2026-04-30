import * as THREE from 'three';
import type { StageAudioFeatures } from '../../../audio/stageAudioFeatures';
import type { RuntimeTuning } from '../../../types/tuning';
import type {
  PaletteState,
  RingPosture,
  SignatureMomentSnapshot,
  StageCompositionPlan,
  StageCuePlan
} from '../../../types/visual';
import type { SceneQualityProfile } from '../../runtime';
import type { SceneVariationProfile } from '../../direction/sceneVariation';
import type { MotionPoseState } from '../motion/MotionSystem';

type ChamberRing = {
  mesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  baseRotation: THREE.Euler;
  speed: number;
  offset: number;
};

type PortalRing = {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  baseScale: number;
  offset: number;
};

type ChromaHalo = {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  baseScale: number;
  offset: number;
};

type LaserBeam = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  baseRotation: THREE.Euler;
  offset: number;
  spread: number;
  depth: number;
  side: -1 | 1;
};

export type ChamberSystemUpdateContext = {
  elapsedSeconds: number;
  idleBreath: number;
  qualityProfile: SceneQualityProfile;
  tuning: Pick<RuntimeTuning, 'neonStageFloor' | 'worldBootFloor'>;
  paletteState: PaletteState;
  sceneVariation: Pick<
    SceneVariationProfile,
    | 'ringSuppression'
    | 'portalSuppression'
    | 'latticeBoost'
    | 'beamBoost'
    | 'haloBoost'
    | 'bladeBoost'
    | 'sweepBoost'
    | 'postContrastBoost'
  >;
  actWeights: {
    void: number;
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
    cathedralRise: number;
    haloIgnition: number;
  };
  director: {
    worldActivity: number;
    colorBias: number;
    colorWarp: number;
    laserDrive: number;
    geometry: number;
    radiance: number;
    spectacle: number;
  };
  shell: {
    tension: number;
    bloom: number;
    orbit: number;
    halo: number;
    glowOverdrive: number;
  };
  atmosphere: {
    gas: number;
    liquid: number;
    plasma: number;
    crystal: number;
    pressure: number;
    ionization: number;
    structureReveal: number;
  };
  budgets: {
    ambientGlow: number;
    eventGlow: number;
    roomMusicVisualFloor: number;
    adaptiveMusicVisualFloor: number;
  };
  stage: {
    cuePlan: StageCuePlan;
    compositionPlan: StageCompositionPlan;
    ringPosture: RingPosture;
  };
  stageAudioFeatures: StageAudioFeatures;
  motion: {
    chamberDrift: THREE.Vector3;
    shellDrift: THREE.Vector3;
    chamberMotion: MotionPoseState;
    gazeX: number;
    gazeY: number;
    livingField: number;
  };
  audio: {
    beatConfidence: number;
    barPhase: number;
    phrasePhase: number;
    roomness: number;
    body: number;
    shimmer: number;
    harmonicColor: number;
    transientConfidence: number;
    peakConfidence: number;
    phraseTension: number;
    preDropTension: number;
    dropImpact: number;
    sectionChange: number;
    releaseTail: number;
    preBeatLift: number;
    interBeatFloat: number;
    beatPulse: number;
    phraseResolve: number;
    barTurn: number;
    releasePulse: number;
  };
  metrics: {
    heroScaleCurrent: number;
    heroCoverageEstimateCurrent: number;
    ringBeltPersistenceCurrent: number;
    wirefieldDensityScoreCurrent: number;
  };
  signatureMoment: SignatureMomentSnapshot;
};

export type ChamberSystemTelemetry = {
  chamberRingOpacityAverage: number;
  portalRingOpacityAverage: number;
  chromaHaloOpacityAverage: number;
  ghostLatticeOpacityAverage: number;
  laserBeamOpacityAverage: number;
  frontRingOpacity: number;
  frontPortalOpacity: number;
  frontHaloOpacity: number;
};

const HERO_GOLD = new THREE.Color('#b67c3e');
const HERO_TEAL = new THREE.Color('#1e7a77');
const GHOST_PALE = new THREE.Color('#f1e8d8');
const LASER_CYAN = new THREE.Color('#35f4ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const VOLT_VIOLET = new THREE.Color('#7c4dff');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const ACID_LIME = new THREE.Color('#bcff39');
const MATRIX_GREEN = new THREE.Color('#37ff7c');
const CYBER_YELLOW = new THREE.Color('#ffe933');
const TOXIC_PINK = new THREE.Color('#ff5cff');
const ELECTRIC_WHITE = new THREE.Color('#f7fbff');

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

function pulseShape(phase: number): number {
  if (phase <= 0 || phase >= 1) {
    return 0;
  }

  return Math.sin(phase * Math.PI);
}

function averageMaterialOpacity(
  values: Array<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>
): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce((sum, mesh) => sum + mesh.material.opacity, 0) / values.length
  );
}

export class ChamberSystem {
  private readonly chamberGroup: THREE.Group;
  private readonly chamberRings: ChamberRing[] = [];
  private readonly portalRings: PortalRing[] = [];
  private readonly chromaHalos: ChromaHalo[] = [];
  private readonly latticeMaterials: THREE.LineBasicMaterial[] = [];
  private readonly ghostLattice = new THREE.Group();
  private readonly laserGroup = new THREE.Group();
  private readonly laserBeams: LaserBeam[] = [];
  private readonly motionBaseQuaternion = new THREE.Quaternion();
  private readonly motionCompositeQuaternion = new THREE.Quaternion();
  private readonly motionEulerScratch = new THREE.Euler();

  constructor(input: { chamberGroup: THREE.Group }) {
    this.chamberGroup = input.chamberGroup;
  }

  build(): void {
    for (let index = 0; index < 6; index += 1) {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: HERO_GOLD.clone(),
        transparent: true,
        opacity: 0.02,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(
          2.8 + index * 0.76,
          0.026 + index * 0.004,
          18,
          180
        ),
        ringMaterial
      );
      ringMesh.rotation.set(
        0.5 + index * 0.3,
        index * 0.28,
        index * 0.18
      );
      ringMesh.position.z = -1 - index * 0.46;
      this.chamberRings.push({
        mesh: ringMesh,
        baseRotation: ringMesh.rotation.clone(),
        speed: 0.06 + index * 0.02,
        offset: index * 0.6
      });
      this.chamberGroup.add(ringMesh);
    }

    for (let index = 0; index < 4; index += 1) {
      const portalMaterial = new THREE.MeshBasicMaterial({
        color: HERO_TEAL.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const portalMesh = new THREE.Mesh(
        new THREE.RingGeometry(2.3 + index * 0.9, 2.46 + index * 0.9, 144),
        portalMaterial
      );
      portalMesh.position.z = -3 - index * 0.56;
      this.portalRings.push({
        mesh: portalMesh,
        baseScale: 1 + index * 0.14,
        offset: index * 0.8
      });
      this.chamberGroup.add(portalMesh);
    }

    for (let index = 0; index < 4; index += 1) {
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: LASER_CYAN.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const haloMesh = new THREE.Mesh(
        new THREE.RingGeometry(5.8 + index * 1.4, 6.08 + index * 1.4, 192),
        haloMaterial
      );
      haloMesh.position.z = -8.5 - index * 0.8;
      this.chromaHalos.push({
        mesh: haloMesh,
        baseScale: 1 + index * 0.12,
        offset: index * 0.9
      });
      this.chamberGroup.add(haloMesh);
    }

    for (let index = 0; index < 3; index += 1) {
      const material = new THREE.LineBasicMaterial({
        color: GHOST_PALE.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false
      });
      const geometry = new THREE.EdgesGeometry(
        new THREE.IcosahedronGeometry(3.4 + index * 1.1, index === 0 ? 1 : 0)
      );
      const line = new THREE.LineSegments(geometry, material);
      line.rotation.set(index * 0.4, index * 0.7, index * 0.2);
      this.latticeMaterials.push(material);
      this.ghostLattice.add(line);
    }

    this.chamberGroup.add(this.ghostLattice);

    for (let index = 0; index < 10; index += 1) {
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: LASER_CYAN.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const beamMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(
          0.1 + (index % 3) * 0.04,
          17 + (index % 4) * 1.6
        ),
        beamMaterial
      );
      beamMesh.position.z = -4.8 - (index % 4) * 0.65;
      beamMesh.rotation.set(
        (index % 2 === 0 ? -1 : 1) * (0.18 + (index % 3) * 0.06),
        (index % 2 === 0 ? 1 : -1) * (0.26 + (index % 4) * 0.08),
        -0.82 + index * 0.18
      );
      this.laserBeams.push({
        mesh: beamMesh,
        baseRotation: beamMesh.rotation.clone(),
        offset: index * 0.72,
        spread: 0.36 + index * 0.08,
        depth: beamMesh.position.z,
        side: index % 2 === 0 ? -1 : 1
      });
      this.laserGroup.add(beamMesh);
    }

    this.chamberGroup.add(this.laserGroup);
  }

  applyQualityProfile(profile: SceneQualityProfile): void {
    this.portalRings.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
    this.chromaHalos.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });
    this.laserBeams.forEach(({ mesh }) => {
      mesh.material.opacity = 0;
    });

    if (profile.auraOpacityMultiplier <= 0) {
      this.latticeMaterials.forEach((material) => {
        material.opacity = 0;
      });
    }
  }

  update(context: ChamberSystemUpdateContext): void {
    const voidAct = context.actWeights.void;
    const laserAct = context.actWeights.laser;
    const matrixAct = context.actWeights.matrix;
    const eclipseAct = context.actWeights.eclipse;
    const ghostAct = context.actWeights.ghost;
    const portal = context.familyWeights.portal;
    const cathedral = context.familyWeights.cathedral;
    const ghost = context.familyWeights.ghost;
    const storm = context.familyWeights.storm;
    const eclipse = context.familyWeights.eclipse;
    const plume = context.familyWeights.plume;
    const portalOpen = context.events.portalOpen;
    const cathedralRise = context.events.cathedralRise;
    const haloIgnition = context.events.haloIgnition;
    const worldActivity = context.director.worldActivity;
    const warmBias = Math.max(0, (context.director.colorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - context.director.colorBias) * 2);
    const chromaWarp = context.director.colorWarp;
    const laserDrive = context.director.laserDrive;
    const geometryBias = context.director.geometry;
    const radiance = context.director.radiance;
    const spectacle = context.director.spectacle;
    const shellTension = context.shell.tension;
    const shellBloom = context.shell.bloom;
    const shellOrbit = context.shell.orbit;
    const shellHalo = context.shell.halo;
    const glowOverdrive = context.shell.glowOverdrive;
    const livingField = context.motion.livingField;
    const gasMatter = context.atmosphere.gas;
    const liquidMatter = context.atmosphere.liquid;
    const plasmaMatter = context.atmosphere.plasma;
    const crystalMatter = context.atmosphere.crystal;
    const atmospherePressure = context.atmosphere.pressure;
    const atmosphereIonization = context.atmosphere.ionization;
    const atmosphereStructureReveal = context.atmosphere.structureReveal;
    const ambientGlow = context.budgets.ambientGlow;
    const eventGlow = context.budgets.eventGlow;
    const roomMusicVisualFloor = context.budgets.roomMusicVisualFloor;
    const adaptiveMusicVisualFloor = context.budgets.adaptiveMusicVisualFloor;
    const paletteVoid = context.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = context.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = context.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = context.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = context.paletteState === 'ghost-white' ? 1 : 0;
    const cueGather = context.stage.cuePlan.family === 'gather' ? 1 : 0;
    const cueReveal = context.stage.cuePlan.family === 'reveal' ? 1 : 0;
    const cueRupture = context.stage.cuePlan.family === 'rupture' ? 1 : 0;
    const cueRelease = context.stage.cuePlan.family === 'release' ? 1 : 0;
    const cueHaunt = context.stage.cuePlan.family === 'haunt' ? 1 : 0;
    const apertureCage =
      context.stage.cuePlan.worldMode === 'aperture-cage' ? 1 : 0;
    const fanSweep = context.stage.cuePlan.worldMode === 'fan-sweep' ? 1 : 0;
    const cathedralFrame =
      context.stage.cuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const collapseWell =
      context.stage.cuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const ghostChamber =
      context.stage.cuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const fieldBloom =
      context.stage.cuePlan.worldMode === 'field-bloom' ? 1 : 0;
    const collapseScarMoment =
      context.signatureMoment.kind === 'collapse-scar'
        ? context.signatureMoment.postConsequence
        : 0;
    const cathedralOpenMoment =
      context.signatureMoment.kind === 'cathedral-open'
        ? context.signatureMoment.chamberArchitecture
        : 0;
    const ghostResidueMoment =
      context.signatureMoment.kind === 'ghost-residue'
        ? context.signatureMoment.memoryStrength
        : 0;
    const silenceConstellationMoment =
      context.signatureMoment.kind === 'silence-constellation'
        ? context.signatureMoment.chamberArchitecture
        : 0;
    const signaturePhase = context.signatureMoment.phase;
    const signatureStyle = context.signatureMoment.style;
    const signatureResidueOrClear =
      signaturePhase === 'residue' || signaturePhase === 'clear'
        ? context.signatureMoment.intensity
        : 0;
    const signaturePortalActive =
      context.signatureMoment.kind === 'cathedral-open' &&
      (signaturePhase === 'precharge' ||
        signaturePhase === 'strike' ||
        signaturePhase === 'hold')
        ? cathedralOpenMoment
        : 0;
    const signaturePortalArchitectureLift = THREE.MathUtils.clamp(
      signaturePortalActive *
        (signatureStyle === 'maximal-neon' ? 0.34 : 0.18) *
        (signaturePhase === 'strike' || signaturePhase === 'hold' ? 1 : 0.58),
      0,
      0.34
    );
    const signatureRingDemotion = THREE.MathUtils.clamp(
      collapseScarMoment * 0.44 +
        ghostResidueMoment * 0.32 +
        silenceConstellationMoment * 0.34 +
        signatureResidueOrClear * 0.42 +
        Math.max(0, context.metrics.ringBeltPersistenceCurrent - 0.24) * 0.34 -
        signaturePortalArchitectureLift * 0.58,
      0,
      0.76
    );
    const ringSuppression = context.sceneVariation.ringSuppression;
    const portalSuppression = context.sceneVariation.portalSuppression;
    const latticeBoost = context.sceneVariation.latticeBoost;
    const beamBoost = context.sceneVariation.beamBoost;
    const haloBoost = context.sceneVariation.haloBoost;
    const bladeBoost = context.sceneVariation.bladeBoost;
    const sweepBoost = context.sceneVariation.sweepBoost;
    const cueWorld = context.stage.cuePlan.worldWeight;
    const stageSubtractive = context.stage.cuePlan.subtractiveAmount;
    const washoutSuppression = context.stage.cuePlan.washoutSuppression;
    const peakSpend = context.stage.cuePlan.spendProfile === 'peak' ? 1 : 0;
    const tempoLock = context.stageAudioFeatures.tempo.lock;
    const tempoDensity = context.stageAudioFeatures.tempo.density;
    const impactBuild = context.stageAudioFeatures.impact.build;
    const impactHit = context.stageAudioFeatures.impact.hit;
    const spatialPresence = context.stageAudioFeatures.presence.spatial;
    const textureShimmer = context.stageAudioFeatures.texture.shimmer;
    const memoryAfterglow = context.stageAudioFeatures.memory.afterglow;
    const ringEventPlatform =
      context.stage.cuePlan.ringAuthority === 'event-platform' ? 1 : 0;
    const ringFrameArchitecture =
      context.stage.cuePlan.ringAuthority === 'framing-architecture' ? 1 : 0;
    const ringBackground =
      context.stage.cuePlan.ringAuthority === 'background-scaffold' ? 1 : 0;
    const ringCathedralArchitecture =
      context.stage.ringPosture === 'cathedral-architecture' ? 1 : 0;
    const ringEventStrike =
      context.stage.ringPosture === 'event-strike' ? 1 : 0;
    const ringResidueTrace =
      context.stage.ringPosture === 'residue-trace' ? 1 : 0;
    const ringSuppressed =
      context.stage.ringPosture === 'suppressed' ? 1 : 0;
    const shotAnchor =
      context.stage.compositionPlan.shotClass === 'anchor' ? 1 : 0;
    const shotPressure =
      context.stage.compositionPlan.shotClass === 'pressure' ? 1 : 0;
    const shotWorldTakeover =
      context.stage.compositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotAftermath =
      context.stage.compositionPlan.shotClass === 'aftermath' ? 1 : 0;
    const shotIsolate =
      context.stage.compositionPlan.shotClass === 'isolate' ? 1 : 0;
    const matrixRevealFlow =
      matrixAct * (cueReveal * 0.82 + cueGather * 0.48);
    const chamberEnvelope = context.stage.compositionPlan.chamberEnvelope;
    const chamberPresenceFloor = chamberEnvelope.presenceFloor;
    const chamberDominanceFloor = chamberEnvelope.dominanceFloor;
    const chamberRingOpacityCap = chamberEnvelope.ringOpacityCap;
    const chamberWireDensityCap = chamberEnvelope.wireDensityCap;
    const chamberWorldTakeoverBias = chamberEnvelope.worldTakeoverBias;
    const musicStageFloor = Math.max(
      roomMusicVisualFloor,
      adaptiveMusicVisualFloor
    );
    const chamberStageLift = THREE.MathUtils.clamp(
      musicStageFloor * 0.36 +
        gasMatter * 0.06 +
        liquidMatter * 0.08 +
        plasmaMatter * 0.08 +
        crystalMatter * 0.1 +
        chamberPresenceFloor * 0.42 +
        chamberDominanceFloor * 0.38 +
          chamberWorldTakeoverBias * 0.34 +
          context.tuning.neonStageFloor * 0.22 +
          context.tuning.worldBootFloor * 0.18 +
        cathedralOpenMoment * 0.26 +
        signaturePortalArchitectureLift * 0.22 +
        silenceConstellationMoment * 0.18 +
        ghostResidueMoment * 0.12 -
        collapseScarMoment * 0.06,
      0,
      1
    );
    const chamberEmitterFloor =
      0.008 +
      gasMatter * 0.004 +
      liquidMatter * 0.006 +
      plasmaMatter * 0.008 +
      crystalMatter * 0.01 +
      atmosphereIonization * 0.004 +
      chamberPresenceFloor * 0.018 +
      chamberDominanceFloor * 0.016 +
      chamberWorldTakeoverBias * 0.014 +
      musicStageFloor * 0.018 +
      context.tuning.neonStageFloor * 0.012 +
      context.tuning.worldBootFloor * 0.01;
    const ringPostureSuppression = THREE.MathUtils.clamp(
      ringSuppressed * 0.72 +
        ringResidueTrace * 0.52 +
        ringEventStrike * 0.22 -
        ringCathedralArchitecture * 0.24,
      0,
      0.82
    );
    const ringPersistencePressure = THREE.MathUtils.clamp(
      Math.max(0, context.metrics.ringBeltPersistenceCurrent - 0.18) * 1.65 +
        Math.max(
          0,
          context.metrics.wirefieldDensityScoreCurrent - chamberWireDensityCap
        ) *
          0.46,
      0,
      0.56
    );
    const chamberColorIntegrityGuard = THREE.MathUtils.clamp(
      1 - ringPersistencePressure * 0.54 - washoutSuppression * 0.18,
      0.56,
      1
    );
    const chamberChromaRecoveryLift = THREE.MathUtils.clamp(
      ringPersistencePressure * 0.12 + washoutSuppression * 0.08,
      0,
      0.14
    );
    const chamberDrift = context.motion.chamberDrift;
    const shellDrift = context.motion.shellDrift;
    const chamberMotion = context.motion.chamberMotion;
    const gazeX = context.motion.gazeX;
    const gazeY = context.motion.gazeY;
    const chromaPulse =
      0.5 +
      0.5 *
        Math.sin(
          context.director.colorBias * Math.PI * 4 + context.elapsedSeconds * 0.2
        );
    const laserScan =
      0.5 +
      0.5 *
        Math.sin(
          context.elapsedSeconds * (0.34 + laserDrive * 0.28) +
            context.audio.barPhase * Math.PI * 2
        );
    const beatPulse = context.audio.beatPulse;
    const phrasePulse = Math.max(
      context.audio.phraseResolve,
      phasePulse(context.audio.phrasePhase, context.elapsedSeconds * 0.18)
    );
    const barPulse = Math.max(
      context.audio.barTurn,
      phasePulse(context.audio.barPhase, context.elapsedSeconds * 0.32)
    );

    const chamberBaseYaw =
      context.elapsedSeconds *
        (0.05 +
          gasMatter * 0.02 +
          liquidMatter * 0.03 +
          plasmaMatter * 0.018 +
          portal * 0.08 +
          fanSweep * 0.12 +
          cathedral * 0.03 +
          shellOrbit * 0.06 +
          worldActivity * 0.07 +
          tempoDensity * 0.04 +
          context.audio.preDropTension * 0.04 +
          context.audio.dropImpact * 0.08) +
      chamberDrift.x * 0.22;
    const chamberBasePitch =
      Math.sin(context.elapsedSeconds * 0.14) * (0.06 + gasMatter * 0.03) +
      gazeY * 0.04 +
      Math.sin(context.elapsedSeconds * (0.08 + shellOrbit * 0.08)) *
        shellBloom *
        0.06 +
      worldActivity * 0.04 +
      context.audio.sectionChange * 0.12 +
      chamberDrift.y * 0.22;
    const chamberBaseRoll =
      Math.sin(
        context.elapsedSeconds * 0.09 + context.audio.phrasePhase * Math.PI * 2
      ) *
        (0.03 +
          livingField * 0.04 +
          liquidMatter * 0.02 +
          plasmaMatter * 0.02) +
      shellDrift.x * 0.12;
    this.motionBaseQuaternion.setFromEuler(
      this.motionEulerScratch.set(
        chamberBasePitch,
        chamberBaseYaw,
        chamberBaseRoll
      )
    );
    this.motionCompositeQuaternion
      .copy(this.motionBaseQuaternion)
      .multiply(chamberMotion.quaternion);
    this.chamberGroup.quaternion.copy(this.motionCompositeQuaternion);
    this.chamberGroup.position.x =
      chamberDrift.x * 0.9 + chamberMotion.position.x;
    this.chamberGroup.position.y =
      chamberDrift.y * 0.66 + shellDrift.y * 0.16 + chamberMotion.position.y;
    this.chamberGroup.position.z =
      -shellTension * 0.18 +
      atmospherePressure * -0.08 +
      apertureCage * 0.16 -
      collapseWell * 0.14 +
      shellBloom * 0.1 +
      fieldBloom * 0.08 +
      memoryAfterglow * 0.06 -
      impactHit * 0.04 +
      context.audio.releaseTail * 0.08 -
      context.audio.preDropTension * 0.06 +
      chamberDrift.z * 0.74 +
      chamberMotion.position.z;
    this.chamberGroup.scale.setScalar(
      1 +
        gasMatter * 0.04 +
        liquidMatter * 0.06 +
        plasmaMatter * 0.05 +
        crystalMatter * 0.08 +
        worldActivity * 0.14 +
        portal * 0.06 +
        apertureCage * 0.08 +
        cathedral * 0.08 +
        cathedralFrame * 0.12 +
        cueWorld * 0.08 +
        cueReveal * 0.06 +
        shellBloom * 0.08 +
        cathedralRise * 0.12 -
        stageSubtractive * 0.08 -
        eclipse * 0.04 +
        cueRupture * 0.06 +
        fieldBloom * 0.08 +
        atmosphereStructureReveal * 0.06 +
        context.audio.dropImpact * 0.16 +
        context.audio.sectionChange * 0.12 +
        spatialPresence * 0.08 +
        livingField * 0.04 +
        chamberPresenceFloor * 0.12 +
        chamberDominanceFloor * 0.1 +
        chamberWorldTakeoverBias * 0.08 +
        musicStageFloor * 0.1
    );

    this.chamberRings.forEach((ring, index) => {
      const architectural = portal * 0.42 + cathedral * 0.5 + eclipse * 0.28;
      const ringClock =
        context.elapsedSeconds *
          (0.12 +
            shellOrbit * 0.18 +
            index * 0.015 +
            context.audio.beatConfidence * 0.04) +
        ring.offset * 1.7 +
        context.audio.barPhase * Math.PI * 2 * (0.24 + index * 0.02);
      const ringPulse = 0.5 + 0.5 * Math.sin(ringClock);
      const motion =
        context.elapsedSeconds *
        ring.speed *
        (0.28 +
          architectural * 0.8 +
          shellOrbit * 0.2 +
          laserDrive * 0.14 +
          context.audio.preBeatLift * 0.16 +
          context.audio.interBeatFloat * 0.08 +
          context.audio.dropImpact * 0.18);
      const scale =
        1 +
        architectural * (0.22 + index * 0.04) +
        apertureCage * (0.18 + index * 0.06) +
        cathedralFrame * (0.2 + index * 0.04) -
        collapseWell * (0.14 + index * 0.03) +
        shellBloom * (0.08 + index * 0.02) +
        portalOpen * 0.18 +
        cathedralRise * 0.2 +
        worldActivity * (0.08 + index * 0.02) +
        impactBuild * 0.08 +
        context.audio.body * 0.05 +
        context.audio.phraseTension * 0.08 +
        context.audio.dropImpact * 0.14 +
        context.audio.sectionChange * 0.08;
      const thicknessOpacity =
        0.0016 +
        context.audio.roomness * 0.009 +
        worldActivity * 0.01 +
        portal * 0.014 +
        cathedral * 0.015 +
        haloIgnition * 0.024 +
        (context.audio.shimmer + textureShimmer) * 0.008 +
        cathedralRise * 0.02 +
        context.audio.sectionChange * 0.014 +
        tempoLock * 0.008 +
        ringFrameArchitecture * 0.004 -
        ringBackground * 0.0024;

      ring.mesh.rotation.set(
        ring.baseRotation.x +
          motion +
          Math.sin(
            context.elapsedSeconds * 0.3 +
              ring.offset +
              context.audio.barPhase * Math.PI * 2
          ) *
            0.08 +
          ringPulse * shellBloom * 0.08,
        ring.baseRotation.y -
          motion * (0.75 + context.audio.dropImpact * 0.14) +
          Math.cos(ringClock * 0.72) * shellTension * 0.1,
        ring.baseRotation.z +
          motion * 0.52 +
          Math.sin(ringClock * 0.54) * shellOrbit * 0.12
      );
      ring.mesh.scale.set(
        scale * (1 + ringPulse * shellBloom * 0.06),
        scale *
          (0.92 +
            eclipse * 0.08 +
            shellTension * 0.08 +
            ringPulse * 0.03),
        1
      );
      ring.mesh.position.x =
        Math.sin(ringClock * 0.38) *
        shellOrbit *
        0.18 *
        (0.6 + index * 0.08);
      ring.mesh.position.y =
        Math.cos(ringClock * 0.46) *
        shellBloom *
        0.12 *
        (0.5 + index * 0.06);
      ring.mesh.position.z =
        -0.5 -
        index * 0.4 -
        portal * 0.45 -
        apertureCage * 0.24 -
        eclipse * 0.24 -
        collapseWell * 0.42 -
        shellTension * 0.12 +
        ringPulse * shellBloom * 0.08;
      ring.mesh.material.color
        .copy(LASER_CYAN)
        .lerp(
          TRON_BLUE,
          0.16 +
            coolBias * 0.22 +
            portal * 0.12 +
            laserAct * 0.12 +
            matrixAct * 0.08 +
            paletteVoid * 0.16 +
            paletteTron * 0.18
        )
        .lerp(
          VOLT_VIOLET,
          0.02 + cathedral * 0.03 + phrasePulse * 0.02 + ghostAct * 0.04
        )
        .lerp(
          HOT_MAGENTA,
          0.02 +
            context.audio.dropImpact * 0.05 +
            warmBias * 0.04 +
            eclipseAct * 0.08 +
            paletteSolar * 0.12
        )
        .lerp(
          ACID_LIME,
          0.05 +
            paletteAcid * 0.22 +
            context.audio.shimmer * 0.06 +
            matrixAct * 0.12 +
            chamberChromaRecoveryLift
        )
        .lerp(
          CYBER_YELLOW,
          shellHalo * 0.06 + glowOverdrive * 0.04 + paletteSolar * 0.1
        )
        .lerp(
          ELECTRIC_WHITE,
          (ghost * 0.08 +
            cathedral * 0.06 +
            beatPulse * 0.05 +
            voidAct * 0.06 +
            ghostAct * 0.08 +
            paletteGhost * 0.16) *
            chamberColorIntegrityGuard
        );
      ring.mesh.material.opacity = THREE.MathUtils.clamp(
        (ambientGlow * thicknessOpacity * 0.92 +
          eventGlow *
            thicknessOpacity *
            (0.34 +
              context.audio.dropImpact * 0.18 +
              context.audio.sectionChange * 0.1)) *
          (1 +
            Math.max(
              roomMusicVisualFloor,
              adaptiveMusicVisualFloor
            ) *
              (0.9 + cueGather * 0.2 + cueReveal * 0.3)) *
          (1 + shellHalo * 0.08 + glowOverdrive * 0.06) *
          context.qualityProfile.auraOpacityMultiplier +
          chamberEmitterFloor *
            (0.34 +
              ringFrameArchitecture * 0.14 +
              ringCathedralArchitecture * 0.18 +
              ringEventPlatform * 0.08 +
              ringEventStrike * 0.06 -
              ringResidueTrace * 0.08 -
              ringSuppressed * 0.12 +
              shotWorldTakeover * 0.12 +
              cueReveal * 0.08 +
              cueGather * 0.04) +
          cathedralOpenMoment * 0.028 +
          signaturePortalArchitectureLift * 0.018 +
          ghostResidueMoment * 0.014 +
          silenceConstellationMoment * 0.018,
        0,
        Math.max(
          chamberRingOpacityCap,
          0.12 +
            chamberStageLift * 0.12 +
            shotWorldTakeover * 0.06 +
            ringEventPlatform * 0.04 +
            bladeBoost * 0.03
        )
      );
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 - (ringSuppression * 0.62 + ringPersistencePressure * 0.28),
        0.18,
        1
      );
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 - ringPostureSuppression * (0.72 + index * 0.035),
        ringCathedralArchitecture > 0 ? 0.28 : 0.08,
        1
      );
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 - signatureRingDemotion * (0.58 + index * 0.035),
        0.12,
        1
      );
      ring.mesh.material.opacity *= 1 - collapseScarMoment * 0.2;
      ring.mesh.material.opacity *=
        1 -
        peakSpend *
          washoutSuppression *
          (0.36 +
            Math.max(0, context.metrics.heroScaleCurrent - 1.05) * 0.22);
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          shotPressure * 0.24 -
          shotWorldTakeover * 0.2 -
          shotIsolate * 0.04 -
          cueReveal * 0.08 -
          cueGather * 0.06 -
          matrixRevealFlow * 0.12 -
          Math.max(0, context.metrics.heroScaleCurrent - 0.92) * 0.22 -
          Math.max(
            0,
            context.metrics.ringBeltPersistenceCurrent - 0.22
          ) *
            0.74 -
          Math.max(
            0,
            context.metrics.heroCoverageEstimateCurrent - 0.2
          ) *
            0.38,
        0.14,
        1
      );
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          Math.max(
            0,
            context.metrics.wirefieldDensityScoreCurrent -
              chamberWireDensityCap
          ) *
            0.34 -
          Math.max(
            0,
            context.metrics.ringBeltPersistenceCurrent - 0.24
          ) *
            0.58,
        0.36,
        1
      );
    });

    this.portalRings.forEach((ring, index) => {
      const irisClock =
        context.elapsedSeconds * (0.16 + shellOrbit * 0.22 + index * 0.03) +
        ring.offset * 1.6 +
        context.audio.phrasePhase * Math.PI * 2;
      const irisPulse = 0.5 + 0.5 * Math.sin(irisClock);
      const open =
        portal * 0.34 +
        portalOpen * 0.7 +
        apertureCage * 0.22 +
        cathedralOpenMoment * 0.48 +
        signaturePortalArchitectureLift * 0.42 +
        eclipse * 0.22 +
        worldActivity * 0.16 +
        shellBloom * 0.12 +
        context.audio.peakConfidence * 0.08 +
        context.audio.preDropTension * 0.16 +
        context.audio.dropImpact * 0.22;
      const scale =
        ring.baseScale *
        (1 +
          open * (0.3 + index * 0.08) +
          spectacle * 0.08 +
          chromaWarp * 0.06 +
          irisPulse * shellBloom * 0.08);
      ring.mesh.scale.set(
        scale * (1 + shellTension * 0.05 + irisPulse * 0.04),
        scale *
          (0.76 +
            geometryBias * 0.28 +
            shellTension * 0.1 +
            irisPulse * 0.06 -
            apertureCage * 0.18 +
            fanSweep * 0.1),
        1
      );
      ring.mesh.rotation.z =
        context.elapsedSeconds *
          (0.08 + index * 0.02 + context.audio.preDropTension * 0.05) +
        ring.offset +
        gazeX * 0.08 +
        context.audio.barPhase * (0.26 + context.audio.dropImpact * 0.18) +
        Math.sin(irisClock * 0.6) * shellOrbit * 0.18 +
        shellDrift.x * 0.16;
      ring.mesh.rotation.x =
        Math.cos(irisClock * 0.42) * shellTension * 0.1 + shellDrift.y * 0.08;
      ring.mesh.position.x =
        Math.sin(irisClock * 0.34) *
          shellOrbit *
          0.16 *
          (0.7 + index * 0.12) +
        shellDrift.x * (0.24 + index * 0.05);
      ring.mesh.position.y =
        Math.cos(irisClock * 0.28) *
          shellBloom *
          0.1 *
          (0.5 + index * 0.08) +
        shellDrift.y * (0.18 + index * 0.04);
      ring.mesh.material.color
        .copy(LASER_CYAN)
        .lerp(
          TRON_BLUE,
          coolBias * 0.18 +
            portal * 0.12 +
            laserAct * 0.14 +
            matrixAct * 0.1 +
            paletteVoid * 0.18 +
            paletteTron * 0.18
        )
        .lerp(
          HOT_MAGENTA,
          0.03 +
            context.audio.harmonicColor * 0.05 +
            portalOpen * 0.05 +
            warmBias * 0.05 +
            eclipseAct * 0.08 +
            paletteSolar * 0.14
        )
        .lerp(
          ACID_LIME,
          0.05 +
            context.audio.shimmer * 0.08 +
            barPulse * 0.08 +
            laserScan * 0.08 +
            irisPulse * 0.04 +
            matrixAct * 0.14 +
            paletteAcid * 0.22 +
            chamberChromaRecoveryLift
        )
        .lerp(VOLT_VIOLET, phrasePulse * 0.02 + ghostAct * 0.04)
        .lerp(
          CYBER_YELLOW,
          shellHalo * 0.08 + glowOverdrive * 0.05 + paletteSolar * 0.1
        )
        .lerp(
          ELECTRIC_WHITE,
          (ghost * 0.06 +
            chromaWarp * 0.04 +
            glowOverdrive * 0.05 +
            ghostAct * 0.08 +
            paletteGhost * 0.16) *
            chamberColorIntegrityGuard
        )
        .lerp(MATRIX_GREEN, chromaPulse * 0.06 + paletteAcid * 0.18);
      ring.mesh.material.opacity = THREE.MathUtils.clamp(
        open *
          (ambientGlow * (0.01 + index * 0.004) +
            eventGlow *
              (0.075 +
                index * 0.01 +
                context.audio.dropImpact * 0.06 +
                beatPulse * 0.03 +
                context.audio.sectionChange * 0.03 +
                shellHalo * 0.024 +
                glowOverdrive * 0.026)) *
          context.qualityProfile.auraOpacityMultiplier +
          chamberEmitterFloor *
            (0.42 +
              ringCathedralArchitecture * 0.16 +
              ringEventStrike * 0.06 -
              ringResidueTrace * 0.08 -
              ringSuppressed * 0.14 +
              chamberWorldTakeoverBias * 0.14 +
              cueReveal * 0.12 +
              shotWorldTakeover * 0.1) +
          cathedralOpenMoment * 0.034 +
          signaturePortalArchitectureLift * 0.032 +
          ghostResidueMoment * 0.016,
        0,
        Math.max(
          chamberRingOpacityCap + 0.08,
          0.18 +
            chamberStageLift * 0.16 +
            shotWorldTakeover * 0.08 +
            haloBoost * 0.03
        )
      );
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          (ringSuppression * 0.36 +
            portalSuppression * 0.44 +
            ringPersistencePressure * 0.32),
        0.16,
        1
      );
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 - ringPostureSuppression * (0.78 + index * 0.04),
        ringCathedralArchitecture > 0 ? 0.32 : 0.06,
        1
      );
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          Math.max(0, signatureRingDemotion - signaturePortalArchitectureLift * 0.7) *
            (0.5 + index * 0.04),
        0.1,
        1
      );
      ring.mesh.material.opacity *= 1 - collapseScarMoment * 0.16;
      ring.mesh.material.opacity *=
        1 -
        peakSpend *
          washoutSuppression *
          (0.42 + Math.max(0, context.metrics.heroScaleCurrent - 1) * 0.28);
      ring.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          shotPressure * 0.36 -
          shotWorldTakeover * 0.32 -
          shotAnchor * 0.08 -
          cueReveal * 0.12 -
          cueGather * 0.1 -
          fanSweep * 0.08 -
          matrixRevealFlow * 0.16 -
          Math.max(0, context.metrics.heroScaleCurrent - 0.88) * 0.3 -
          Math.max(
            0,
            context.metrics.ringBeltPersistenceCurrent - 0.22
          ) *
            0.82 -
          Math.max(
            0,
            context.metrics.heroCoverageEstimateCurrent - 0.2
          ) *
            0.36,
        0.06,
        1
      );
    });

    this.chromaHalos.forEach((halo, index) => {
      const widePulse = pulseShape((context.audio.phrasePhase + index * 0.16) % 1);
      const haloClock =
        context.elapsedSeconds * (0.1 + shellOrbit * 0.12 + index * 0.02) +
        halo.offset * 1.9 +
        context.audio.barPhase * Math.PI * 2;
      const haloBreath = 0.5 + 0.5 * Math.sin(haloClock);
      const open =
        portal * 0.26 +
        cathedral * 0.24 +
        fieldBloom * 0.18 +
        cathedralRise * 0.34 +
        haloIgnition * 0.38 +
        worldActivity * 0.2 +
        shellHalo * 0.2 +
        context.audio.dropImpact * 0.32 +
        context.audio.sectionChange * 0.22 +
        widePulse * 0.08;
      const scale =
        halo.baseScale *
        (1 +
          open * (0.24 + index * 0.06) +
          spectacle * 0.08 +
          context.audio.preDropTension * 0.08 +
          haloBreath * shellBloom * 0.08);
      halo.mesh.scale.set(
        scale * (1 + haloBreath * shellHalo * 0.08),
        scale * (0.82 + geometryBias * 0.24 + shellTension * 0.08),
        1
      );
      halo.mesh.rotation.z =
        context.elapsedSeconds *
          (0.04 + index * 0.015 + context.audio.preDropTension * 0.04) +
        halo.offset +
        context.audio.barPhase * (0.34 + context.audio.dropImpact * 0.18) +
        Math.sin(haloClock * 0.54) * shellOrbit * 0.16;
      halo.mesh.rotation.x =
        Math.sin(context.elapsedSeconds * 0.08 + halo.offset) * 0.08 +
        Math.cos(haloClock * 0.32) * shellHalo * 0.12;
      halo.mesh.position.z =
        -0.2 - index * 0.14 + haloBreath * shellBloom * 0.14;
      halo.mesh.material.color
        .copy(LASER_CYAN)
        .lerp(
          TRON_BLUE,
          coolBias * 0.2 +
            portal * 0.08 +
            laserAct * 0.12 +
            matrixAct * 0.1 +
            paletteVoid * 0.18 +
            paletteTron * 0.18
        )
        .lerp(VOLT_VIOLET, phrasePulse * 0.02 + cathedral * 0.02 + ghostAct * 0.04)
        .lerp(
          TOXIC_PINK,
          context.audio.sectionChange * 0.03 +
            context.audio.harmonicColor * 0.03 +
            eclipseAct * 0.08 +
            paletteSolar * 0.1
        )
        .lerp(
          HOT_MAGENTA,
          context.audio.harmonicColor * 0.05 +
            warmBias * 0.08 +
            eclipseAct * 0.1 +
            paletteSolar * 0.16
        )
        .lerp(
          CYBER_YELLOW,
          haloIgnition * 0.12 +
            beatPulse * 0.04 +
            laserScan * 0.04 +
            glowOverdrive * 0.04 +
            paletteSolar * 0.06
        )
        .lerp(
          ELECTRIC_WHITE,
          (ghost * 0.08 +
            cathedralRise * 0.06 +
            chromaWarp * 0.04 +
            shellHalo * 0.04 +
            paletteGhost * 0.18) *
            chamberColorIntegrityGuard
        )
        .lerp(
          MATRIX_GREEN,
          chromaPulse * 0.08 +
            matrixAct * 0.14 +
            paletteAcid * 0.18 +
            chamberChromaRecoveryLift
        );
      halo.mesh.material.opacity = THREE.MathUtils.clamp(
        open *
          (ambientGlow * (0.008 + index * 0.003 + radiance * 0.004) +
            eventGlow *
              (0.046 +
                context.audio.dropImpact * 0.05 +
                context.audio.sectionChange * 0.03 +
                chromaWarp * 0.018 +
                shellHalo * 0.03 +
                glowOverdrive * 0.022 +
                haloBoost * 0.03 +
                sweepBoost * 0.014)) *
          context.qualityProfile.auraOpacityMultiplier +
          chamberEmitterFloor *
            (0.38 +
              chamberWorldTakeoverBias * 0.12 +
              cueReveal * 0.1 +
              shotWorldTakeover * 0.1),
        0,
        0.16 +
          chamberStageLift * 0.14 +
          shotWorldTakeover * 0.06 +
          haloBoost * 0.04
      );
      halo.mesh.material.opacity *= 1 + haloBoost * 0.26;
      halo.mesh.material.opacity *=
        1 -
        peakSpend *
          washoutSuppression *
          (0.24 + Math.max(0, context.metrics.heroScaleCurrent - 1.08) * 0.18);
      halo.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          shotWorldTakeover * 0.12 -
          shotPressure * 0.08 -
          cueReveal * 0.06 -
          Math.max(0, context.metrics.heroScaleCurrent - 1.02) * 0.1 -
          Math.max(
            0,
            context.metrics.ringBeltPersistenceCurrent - 0.22
          ) *
            0.5 -
          Math.max(
            0,
            context.metrics.heroCoverageEstimateCurrent - 0.24
          ) *
            0.2,
        0.28,
        1
      );
    });

    this.ghostLattice.rotation.y = context.elapsedSeconds * (0.05 + ghost * 0.12);
    this.ghostLattice.rotation.x =
      Math.sin(context.elapsedSeconds * 0.11) * 0.18 + chamberDrift.y * 0.2;
    this.ghostLattice.position.set(
      chamberDrift.x * 0.42,
      chamberDrift.y * 0.26,
      chamberDrift.z * 0.32
    );
    this.ghostLattice.scale.setScalar(
      1 +
        ghost * 0.18 +
        ghostChamber * 0.28 +
        eclipse * 0.08 +
        context.audio.releasePulse * 0.16 +
        worldActivity * 0.12 +
        context.audio.releaseTail * 0.18
    );
    this.ghostLattice.children.forEach((child, index) => {
      child.rotation.y = context.elapsedSeconds * (0.08 + index * 0.03);
      child.rotation.z = context.elapsedSeconds * (0.05 + index * 0.02);
      child.position.z = -0.4 - index * 0.36 - eclipse * 0.3;
    });
    this.latticeMaterials.forEach((material, index) => {
      material.color
        .copy(ELECTRIC_WHITE)
        .lerp(
          LASER_CYAN,
          plume * 0.18 +
            index * 0.04 +
            coolBias * 0.14 +
            voidAct * 0.06 +
            paletteVoid * 0.16
        )
        .lerp(
          VOLT_VIOLET,
          phrasePulse * 0.02 + ghost * 0.04 + ghostAct * 0.06
        )
        .lerp(
          HOT_MAGENTA,
          warmBias * 0.04 +
            context.audio.releaseTail * 0.03 +
            eclipseAct * 0.08 +
            paletteSolar * 0.08
        )
        .lerp(
          ACID_LIME,
          context.audio.shimmer * 0.05 +
            context.audio.transientConfidence * 0.04 +
            matrixAct * 0.08 +
            paletteAcid * 0.12
        );
      material.opacity =
        (ambientGlow *
          (ghost * 0.022 +
            ghostChamber * 0.024 +
            eclipse * 0.01 +
            plume * 0.008 +
            worldActivity * 0.008 +
            latticeBoost * 0.016) +
          eventGlow *
            (context.audio.releasePulse * 0.038 +
              cueHaunt * 0.04 +
              context.audio.sectionChange * 0.018 +
              context.audio.releaseTail * 0.024 +
              latticeBoost * 0.032)) *
        (1 - index * 0.12);
      material.opacity *= 1 + latticeBoost * 0.48;
      material.opacity *= THREE.MathUtils.clamp(
        1 -
          laserAct * 0.12 -
          cueReveal * 0.16 -
          cueGather * 0.1 -
          shotPressure * 0.22 -
          shotWorldTakeover * 0.28 -
          shotAnchor * 0.06 -
          shotAftermath * 0.04,
        cueHaunt > 0.5 ? 0.46 : 0.18,
        1
      );
    });

    const laserPulse =
      beatPulse * 0.12 +
      context.audio.transientConfidence * 0.06 +
      context.audio.shimmer * 0.04 +
      context.audio.dropImpact * 0.18 +
      context.audio.sectionChange * 0.12 +
      portalOpen * 0.1 +
      haloIgnition * 0.08;
    this.laserGroup.rotation.z =
      Math.sin(
        context.elapsedSeconds * 0.1 + context.audio.barPhase * Math.PI * 2
      ) *
        0.12 +
      gazeX * 0.05 +
      chamberDrift.x * 0.08;
    this.laserGroup.rotation.y =
      context.elapsedSeconds * (0.02 + portal * 0.04 + worldActivity * 0.05) +
      shellDrift.z * 0.14;

    this.laserBeams.forEach((beam, index) => {
      const beamActivation = THREE.MathUtils.clamp(
        cueReveal * 0.42 +
          cueRupture * 0.36 +
          fanSweep * 0.42 +
          shotWorldTakeover * 0.28 +
          shotPressure * 0.1 +
          portalOpen * 0.16 +
          context.audio.dropImpact * 0.18 +
          context.audio.sectionChange * 0.12 +
          laserAct * 0.16,
        0,
        1.4
      );
      const phase =
        context.elapsedSeconds *
          (0.22 +
            portal * 0.14 +
            laserDrive * 0.12 +
            chromaWarp * 0.06) +
        beam.offset +
        context.audio.barPhase * Math.PI * 2;
      const sweep =
        Math.sin(phase) *
          (0.18 + portal * 0.24 + context.audio.preDropTension * 0.08) +
        Math.sin(context.elapsedSeconds * 0.32 + beam.offset) * 0.08 +
        beam.side * fanSweep * (0.22 + index * 0.01);
      const lift =
        Math.sin(context.elapsedSeconds * 0.18 + beam.offset * 0.8) *
        (0.18 + worldActivity * 0.26 + cathedral * 0.08);
      const width =
        1 +
        laserPulse * (2.2 + index * 0.06) +
        fanSweep * 0.8 +
        radiance * 0.48 +
        shellHalo * 0.18 +
        portalOpen * 0.4 +
        context.audio.dropImpact * 0.4 +
        chromaWarp * 0.3 +
        beamBoost * 0.72;
      const length =
        0.8 +
        worldActivity * 0.4 +
        portal * 0.4 +
        cathedral * 0.24 +
        shellOrbit * 0.18 +
        context.audio.preDropTension * 0.24 +
        context.audio.dropImpact * 0.42 +
        context.audio.sectionChange * 0.18 +
        beamBoost * 0.34;

      beam.mesh.position.x =
        Math.sin(phase * 0.7) *
        beam.spread *
        (0.9 + worldActivity * 1.4 + portal * 0.9);
      beam.mesh.position.y = lift;
      beam.mesh.position.z =
        beam.depth - portal * 0.8 - cathedral * 0.3 - context.audio.dropImpact * 0.4;
      beam.mesh.rotation.set(
        beam.baseRotation.x +
          lift * 0.06 +
          gazeY * 0.04 +
          shellDrift.y * 0.08,
        beam.baseRotation.y +
          sweep * 0.3 +
          beam.side * context.audio.preDropTension * 0.12,
        beam.baseRotation.z +
          sweep +
          beam.side * context.audio.sectionChange * 0.22
      );
      beam.mesh.scale.set(width, length, 1);
      beam.mesh.material.color
        .copy(
          index % 3 === 0
            ? LASER_CYAN
            : index % 3 === 1
              ? HOT_MAGENTA
              : ACID_LIME
        )
        .lerp(
          TRON_BLUE,
          coolBias * 0.18 +
            portal * 0.12 +
            laserAct * 0.14 +
            matrixAct * 0.1 +
            paletteVoid * 0.14 +
            paletteTron * 0.18
        )
        .lerp(
          VOLT_VIOLET,
          phrasePulse * 0.03 + cathedral * 0.02 + ghostAct * 0.04
        )
        .lerp(
          TOXIC_PINK,
          context.audio.harmonicColor * 0.04 +
            warmBias * 0.05 +
            eclipseAct * 0.1 +
            paletteSolar * 0.12
        )
        .lerp(
          CYBER_YELLOW,
          haloIgnition * 0.14 +
            beatPulse * 0.08 +
            laserScan * 0.06 +
            paletteSolar * 0.06
        )
        .lerp(
          ELECTRIC_WHITE,
          (context.audio.dropImpact * 0.08 +
            context.audio.sectionChange * 0.06 +
            chromaWarp * 0.06 +
            ghostAct * 0.08 +
            paletteGhost * 0.12) *
            chamberColorIntegrityGuard
        )
        .lerp(
          MATRIX_GREEN,
          chromaPulse * 0.08 +
            matrixAct * 0.12 +
            paletteAcid * 0.18 +
            chamberChromaRecoveryLift
        );
      beam.mesh.material.opacity = THREE.MathUtils.clamp(
        (ambientGlow * (0.0018 + worldActivity * 0.003 + radiance * 0.002) +
          eventGlow *
            beamActivation *
            (laserPulse * (0.11 + index * 0.005) +
              fanSweep * 0.06 +
              cueReveal * 0.08 +
              cueRupture * 0.06 +
              cueGather * 0.01 +
              beamBoost * 0.04 +
              chromaWarp * 0.02 +
              context.audio.dropImpact * 0.04 +
              shotWorldTakeover * 0.08 +
              shotPressure * 0.02 +
              context.audio.sectionChange * 0.02)) *
          (1 +
            Math.max(
              roomMusicVisualFloor,
              adaptiveMusicVisualFloor
            ) *
              (1.12 +
                cueGather * 0.12 +
                cueReveal * 0.26 +
                fanSweep * 0.2)) *
          context.qualityProfile.auraOpacityMultiplier +
          chamberEmitterFloor *
            (0.42 +
              chamberWorldTakeoverBias * 0.14 +
              cueReveal * 0.16 +
              shotWorldTakeover * 0.18 +
              shotPressure * 0.04),
        0,
        0.18 +
          chamberStageLift * 0.16 +
          shotWorldTakeover * 0.1 +
          cueReveal * 0.08 +
          beamBoost * 0.04
      );
      beam.mesh.material.opacity *= 1 + beamBoost * 0.18;
      beam.mesh.material.opacity *= THREE.MathUtils.clamp(
        0.26 + beamActivation * 0.94,
        0.18,
        1
      );
      beam.mesh.material.opacity *= THREE.MathUtils.clamp(
        1 -
          Math.max(
            0,
            context.metrics.wirefieldDensityScoreCurrent -
              chamberWireDensityCap
          ) *
            0.22 -
          Math.max(
            0,
            context.metrics.ringBeltPersistenceCurrent - 0.24
          ) *
            0.38 -
          Math.max(
            0,
            context.metrics.heroCoverageEstimateCurrent - 0.2
          ) *
            0.18,
        0.42,
        1
      );
    });

    this.chamberGroup.position.x +=
      Math.sin(context.elapsedSeconds * (0.16 + sweepBoost * 0.08)) *
      (0.06 + bladeBoost * 0.08 + sweepBoost * 0.06);
    this.chamberGroup.position.y +=
      Math.sin(context.elapsedSeconds * (0.2 + sweepBoost * 0.06)) *
      (0.08 + haloBoost * 0.06) *
      context.idleBreath;
    this.chamberGroup.position.z +=
      -storm * 0.04 -
      apertureCage * 0.06 -
      eclipse * 0.05 -
      collapseWell * 0.08 +
      worldActivity * 0.04 -
      context.audio.preDropTension * 0.06 +
      cueRelease * 0.03 +
      context.audio.releaseTail * 0.04 -
      context.sceneVariation.postContrastBoost * 0.04;
  }

  collectTelemetryInputs(): ChamberSystemTelemetry {
    const chamberRingOpacityAverage = averageMaterialOpacity(
      this.chamberRings.map(({ mesh }) => mesh)
    );
    const portalRingOpacityAverage = averageMaterialOpacity(
      this.portalRings.map(({ mesh }) => mesh)
    );
    const chromaHaloOpacityAverage = averageMaterialOpacity(
      this.chromaHalos.map(({ mesh }) => mesh)
    );
    const ghostLatticeOpacityAverage =
      this.latticeMaterials.length > 0
        ? this.latticeMaterials.reduce(
            (sum, material) => sum + material.opacity,
            0
          ) / this.latticeMaterials.length
        : 0;
    const laserBeamOpacityAverage =
      this.laserBeams.length > 0
        ? this.laserBeams.reduce(
            (sum, beam) => sum + beam.mesh.material.opacity,
            0
          ) / this.laserBeams.length
        : 0;
    const frontRingOpacity = this.chamberRings[0]?.mesh.material.opacity ?? 0;
    const frontPortalOpacity = this.portalRings[0]?.mesh.material.opacity ?? 0;
    const frontHaloOpacity = this.chromaHalos[0]?.mesh.material.opacity ?? 0;

    return {
      chamberRingOpacityAverage,
      portalRingOpacityAverage,
      chromaHaloOpacityAverage,
      ghostLatticeOpacityAverage,
      laserBeamOpacityAverage,
      frontRingOpacity,
      frontPortalOpacity,
      frontHaloOpacity
    };
  }

  dispose(): void {
    this.chamberGroup.removeFromParent();

    this.chamberRings.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.portalRings.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.chromaHalos.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.latticeMaterials.forEach((material) => material.dispose());
    this.ghostLattice.children.forEach((child) => {
      const line = child as THREE.LineSegments;
      line.geometry.dispose();
    });
    this.laserBeams.forEach(({ mesh }) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
  }
}
