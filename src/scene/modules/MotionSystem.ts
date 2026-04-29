import * as THREE from 'three';
import type { StageAudioFeatures } from '../../audio/stageAudioFeatures';
import type {
  SignatureMomentSnapshot,
  StageCompositionPlan,
  StageCuePlan
} from '../../types/visual';

export type MotionPoseState = {
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  targetQuaternion: THREE.Quaternion;
  euler: THREE.Euler;
  targetEuler: THREE.Euler;
  angularVelocity: THREE.Vector3;
};

export type MotionSceneVariation = {
  beamBoost: number;
  cameraSpreadBoost: number;
  heroRoamBoost: number;
  latticeBoost: number;
  noveltyDrive: number;
  postContrastBoost: number;
  prismaticProfile: number;
  spectralProfile: number;
};

export type MotionLocomotionContext = {
  elapsedSeconds: number;
  deltaSeconds: number;
  barPhase: number;
  phrasePhase: number;
  directorFraming: number;
  directorWorldActivity: number;
  stageCuePlan: StageCuePlan;
  stageCompositionPlan: StageCompositionPlan;
  sceneVariation: MotionSceneVariation;
};

export type MotionOrganicContext = {
  elapsedSeconds: number;
  deltaSeconds: number;
  barPhase: number;
  phrasePhase: number;
  ambienceConfidence: number;
  directorAtmosphere: number;
  directorEnergy: number;
  directorFraming: number;
  directorGeometry: number;
  directorSpectacle: number;
  directorWorldActivity: number;
  dropImpact: number;
  ghostLatticeWeight: number;
  harmonicColor: number;
  musicConfidence: number;
  phraseTension: number;
  preDropTension: number;
  releasePulse: number;
  releaseTail: number;
  resonance: number;
  roomness: number;
  sectionChange: number;
  shellBloom: number;
  shellOrbit: number;
  shellTension: number;
  speechConfidence: number;
  stageAudioFeatures: StageAudioFeatures;
};

export type MotionCameraContext = {
  elapsedSeconds: number;
  deltaSeconds: number;
  beatDrive: number;
  barPhase: number;
  beatPhase: number;
  phrasePhase: number;
  geometryBias: number;
  spectacle: number;
  directorFraming: number;
  directorWorldActivity: number;
  roomMusicVisualFloor: number;
  adaptiveMusicVisualFloor: number;
  body: number;
  preDropTension: number;
  dropImpact: number;
  sectionChange: number;
  releaseTail: number;
  heroCoverageEstimateCurrent: number;
  ringBeltPersistenceCurrent: number;
  wirefieldDensityScoreCurrent: number;
  tuningCameraNearFloor: number;
  tuningReadableHeroFloor: number;
  portalWeight: number;
  cathedralWeight: number;
  eclipseWeight: number;
  plumeWeight: number;
  collapseAmount: number;
  portalOpenAmount: number;
  gazeX: number;
  gazeY: number;
  gazeZ: number;
  cameraDrift: THREE.Vector3;
  heroDrift: THREE.Vector3;
  chamberDrift: THREE.Vector3;
  heroPosition: THREE.Vector3;
  stageAudioFeatures: StageAudioFeatures;
  stageCuePlan: StageCuePlan;
  stageCompositionPlan: StageCompositionPlan;
  signatureMoment: SignatureMomentSnapshot;
  sceneVariation: MotionSceneVariation;
};

function createMotionPoseState(): MotionPoseState {
  return {
    position: new THREE.Vector3(),
    targetPosition: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    targetQuaternion: new THREE.Quaternion(),
    euler: new THREE.Euler(),
    targetEuler: new THREE.Euler(),
    angularVelocity: new THREE.Vector3()
  };
}

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);
  return Math.exp(-clamped * 7);
}

export class MotionSystem {
  private readonly organicChamberDrift = new THREE.Vector3();
  private readonly organicChamberTarget = new THREE.Vector3();
  private readonly organicHeroDrift = new THREE.Vector3();
  private readonly organicHeroTarget = new THREE.Vector3();
  private readonly organicShellDrift = new THREE.Vector3();
  private readonly organicShellTarget = new THREE.Vector3();
  private readonly organicCameraDrift = new THREE.Vector3();
  private readonly organicCameraTarget = new THREE.Vector3();
  private readonly organicGazeDrift = new THREE.Vector3();
  private readonly organicGazeTarget = new THREE.Vector3();
  private readonly heroMotionState = createMotionPoseState();
  private readonly chamberMotionState = createMotionPoseState();
  private readonly cameraMotionState = createMotionPoseState();
  private readonly motionRotationMatrix = new THREE.Matrix4();
  private readonly motionBaseQuaternion = new THREE.Quaternion();
  private readonly motionCompositeQuaternion = new THREE.Quaternion();
  private readonly motionLookTarget = new THREE.Vector3();
  private readonly motionPositionScratch = new THREE.Vector3();
  private readonly motionPositionScratchB = new THREE.Vector3();
  private readonly motionPositionScratchC = new THREE.Vector3();
  private readonly motionEulerScratch = new THREE.Euler();
  private readonly motionEulerScratchB = new THREE.Euler();
  private readonly motionEulerScratchC = new THREE.Euler();
  private readonly motionVelocityScratch = new THREE.Vector3();
  private readonly motionAngularScratch = new THREE.Vector3();
  private readonly motionUp = new THREE.Vector3(0, 1, 0);
  private livingField = 0.22;

  initializeCamera(camera: THREE.PerspectiveCamera): void {
    this.cameraMotionState.position.copy(camera.position);
    this.cameraMotionState.targetPosition.copy(camera.position);
    this.cameraMotionState.quaternion.copy(camera.quaternion);
    this.cameraMotionState.targetQuaternion.copy(camera.quaternion);
  }

  getHeroMotionState(): MotionPoseState {
    return this.heroMotionState;
  }

  getChamberMotionState(): MotionPoseState {
    return this.chamberMotionState;
  }

  getOrganicChamberDrift(): THREE.Vector3 {
    return this.organicChamberDrift;
  }

  getOrganicHeroDrift(): THREE.Vector3 {
    return this.organicHeroDrift;
  }

  getOrganicShellDrift(): THREE.Vector3 {
    return this.organicShellDrift;
  }

  getOrganicCameraDrift(): THREE.Vector3 {
    return this.organicCameraDrift;
  }

  getOrganicGazeDrift(): THREE.Vector3 {
    return this.organicGazeDrift;
  }

  getLivingField(): number {
    return this.livingField;
  }

  updateOrganicSpatialLife(context: MotionOrganicContext): void {
    const tempoLock = context.stageAudioFeatures.tempo.lock;
    const tempoDensity = context.stageAudioFeatures.tempo.density;
    const impactBuild = context.stageAudioFeatures.impact.build;
    const impactHit = context.stageAudioFeatures.impact.hit;
    const spatialPresence = context.stageAudioFeatures.presence.spatial;
    const musicPresence = context.stageAudioFeatures.presence.music;
    const textureRoughness = context.stageAudioFeatures.texture.roughness;
    const memoryAfterglow = context.stageAudioFeatures.memory.afterglow;
    const memoryResonance = context.stageAudioFeatures.memory.resonance;
    const restraint = context.stageAudioFeatures.stability.restraint;
    const livingAuthority = THREE.MathUtils.clamp(
      context.musicConfidence * 0.28 +
        context.resonance * 0.2 +
        context.roomness * 0.08 +
        context.ambienceConfidence * 0.1 +
        musicPresence * 0.12 +
        spatialPresence * 0.12 +
        context.directorWorldActivity * 0.16 +
        context.directorAtmosphere * 0.14 +
        context.directorEnergy * 0.08,
      0,
      1.2
    );
    const tensionAuthority = THREE.MathUtils.clamp(
      context.preDropTension * 0.32 +
        context.phraseTension * 0.14 +
        context.sectionChange * 0.14 +
        context.dropImpact * 0.18 +
        impactBuild * 0.16 +
        impactHit * 0.18 -
        restraint * 0.06 +
        context.directorSpectacle * 0.1,
      0,
      1.2
    );
    const spectralAuthority = THREE.MathUtils.clamp(
      context.releaseTail * 0.28 +
        context.releasePulse * 0.12 +
        context.speechConfidence * 0.04 +
        memoryAfterglow * 0.22 +
        memoryResonance * 0.12 +
        context.directorAtmosphere * 0.18 +
        context.ghostLatticeWeight * 0.12,
      0,
      1
    );
    const shellAuthority = THREE.MathUtils.clamp(
      context.shellOrbit * 0.28 +
        context.shellBloom * 0.22 +
        context.shellTension * 0.18 +
        tempoLock * 0.08 +
        textureRoughness * 0.08 +
        context.directorGeometry * 0.14 +
        tensionAuthority * 0.18,
      0,
      1.2
    );
    const phase = context.harmonicColor * Math.PI * 2;
    const deepClock =
      context.elapsedSeconds *
      (0.045 + livingAuthority * 0.05 + spectralAuthority * 0.02);
    const driftClock =
      context.elapsedSeconds *
      (0.072 + livingAuthority * 0.07 + tensionAuthority * 0.025);
    const shellClock =
      context.elapsedSeconds *
      (0.14 + shellAuthority * 0.08 + tensionAuthority * 0.03);
    const gazeClock =
      context.elapsedSeconds *
      (0.058 + context.directorFraming * 0.04 + livingAuthority * 0.035);

    const chamberAmplitude =
      0.06 +
      livingAuthority * 0.16 +
      context.directorWorldActivity * 0.08 +
      spectralAuthority * 0.04 +
      spatialPresence * 0.05;
    const heroAmplitude =
      0.05 +
      livingAuthority * 0.12 +
      spectralAuthority * 0.05 +
      tensionAuthority * 0.04 +
      impactBuild * 0.03 +
      tempoDensity * 0.02;
    const shellAmplitude =
      0.07 +
      shellAuthority * 0.14 +
      tensionAuthority * 0.05 +
      spectralAuthority * 0.03 +
      textureRoughness * 0.03;
    const cameraAmplitude =
      0.04 +
      livingAuthority * 0.12 +
      context.directorFraming * 0.06 +
      spectralAuthority * 0.05 +
      spatialPresence * 0.04 +
      tempoDensity * 0.02;

    this.organicChamberTarget.set(
      Math.sin(deepClock + phase) * chamberAmplitude +
        Math.sin(driftClock * 0.62 + context.phrasePhase * Math.PI * 2) *
          chamberAmplitude *
          0.32,
      Math.sin(driftClock * 0.78 + phase * 0.35) * chamberAmplitude * 0.56 +
        Math.cos(deepClock * 0.84 + context.releaseTail * Math.PI * 2) *
          spectralAuthority *
          0.05,
      -Math.cos(gazeClock + phase * 0.24) * chamberAmplitude * 0.82 +
        tensionAuthority * 0.06 -
        context.dropImpact * 0.08 +
        spectralAuthority * 0.06
    );

    this.organicHeroTarget.set(
      -this.organicChamberTarget.x * 0.42 +
        Math.sin(driftClock * 1.08 + phase * 0.72) * heroAmplitude,
      Math.sin(driftClock * 0.94 + context.barPhase * Math.PI * 2) *
        heroAmplitude *
        1.2 +
        spectralAuthority * 0.06 -
        tensionAuthority * 0.03,
      Math.cos(deepClock * 1.16 + context.phrasePhase * Math.PI * 2) *
        heroAmplitude *
        0.7 +
        context.releaseTail * 0.05 -
        context.preDropTension * 0.03
    );

    this.organicShellTarget.set(
      Math.sin(shellClock + phase * 0.48) * shellAmplitude +
        Math.cos(driftClock * 1.22) * shellAmplitude * 0.24,
      Math.cos(shellClock * 0.84 + context.phrasePhase * Math.PI * 2) *
        shellAmplitude *
        0.86 +
        context.shellBloom * 0.04,
      Math.sin(shellClock * 0.66 + context.barPhase * Math.PI * 2) *
        shellAmplitude *
        0.54 -
        context.shellTension * 0.04 +
        context.releaseTail * 0.03
    );

    this.organicCameraTarget.set(
      this.organicChamberTarget.x * 0.72 +
        Math.sin(gazeClock + context.barPhase * Math.PI * 2) *
          cameraAmplitude,
      this.organicChamberTarget.y * 0.68 +
        Math.cos(gazeClock * 0.88 + phase * 0.2) * cameraAmplitude * 0.82,
      Math.sin(deepClock * 0.74 + phase * 0.3) * cameraAmplitude * 0.92 +
        spectralAuthority * 0.06 -
        tensionAuthority * 0.04
    );

    this.organicGazeTarget.set(
      -this.organicHeroTarget.x * 0.34 +
        Math.sin(gazeClock * 1.24 + phase) *
          (0.04 + livingAuthority * 0.06),
      this.organicHeroTarget.y * 0.28 +
        Math.cos(gazeClock * 1.08 + context.releaseTail * Math.PI * 2) *
          (0.03 + spectralAuthority * 0.04),
      -0.12 + context.preDropTension * 0.05 - context.releaseTail * 0.03
    );

    this.livingField = this.smoothValue(
      this.livingField,
      THREE.MathUtils.clamp(
        0.18 +
          livingAuthority * 0.44 +
          tensionAuthority * 0.08 +
          spectralAuthority * 0.1 +
          context.directorWorldActivity * 0.08,
        0,
        1.25
      ),
      0.82,
      context.deltaSeconds
    );

    this.smoothVector(
      this.organicChamberDrift,
      this.organicChamberTarget,
      0.84,
      context.deltaSeconds
    );
    this.smoothVector(
      this.organicHeroDrift,
      this.organicHeroTarget,
      0.92,
      context.deltaSeconds
    );
    this.smoothVector(
      this.organicShellDrift,
      this.organicShellTarget,
      1.04,
      context.deltaSeconds
    );
    this.smoothVector(
      this.organicCameraDrift,
      this.organicCameraTarget,
      0.78,
      context.deltaSeconds
    );
    this.smoothVector(
      this.organicGazeDrift,
      this.organicGazeTarget,
      0.86,
      context.deltaSeconds
    );
  }

  updateLocomotion(context: MotionLocomotionContext): void {
    const sceneVariation = context.sceneVariation;
    const eventScaleBias =
      context.stageCompositionPlan.eventScale === 'stage'
        ? 1
        : context.stageCompositionPlan.eventScale === 'phrase'
          ? 0.76
          : 0.44;
    const worldTakeoverBias =
      context.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const stageBias = THREE.MathUtils.clamp(
      context.stageCuePlan.stageWeight * 0.42 +
        context.stageCuePlan.worldWeight * 0.28 +
        context.stageCuePlan.heroMotionBias * 0.24 +
        eventScaleBias * 0.34 +
        worldTakeoverBias * 0.18 +
        sceneVariation.heroRoamBoost * 0.24 +
        sceneVariation.noveltyDrive * 0.08,
      0,
      1.35
    );
    const laneTargetX = THREE.MathUtils.clamp(
      (context.stageCompositionPlan.heroEnvelope.laneTargetX - 0.5) * 2,
      -1,
      1
    );
    const laneTargetY = THREE.MathUtils.clamp(
      (0.5 - context.stageCompositionPlan.heroEnvelope.laneTargetY) * 2,
      -1,
      1
    );
    const laneTravelBias = THREE.MathUtils.clamp(
      0.16 +
        context.stageCuePlan.heroMotionBias * 0.24 +
        context.stageCompositionPlan.heroEnvelope.driftAllowance * 0.54 +
        eventScaleBias * 0.18 +
        sceneVariation.heroRoamBoost * 0.22 +
        sceneVariation.cameraSpreadBoost * 0.06,
      0.1,
      0.92
    );
    const lanePositionX =
      laneTargetX *
      (0.14 +
        stageBias * 0.22 +
        laneTravelBias * 0.24 +
        sceneVariation.heroRoamBoost * 0.12);
    const lanePositionY =
      laneTargetY *
      (0.08 +
        stageBias * 0.14 +
        laneTravelBias * 0.16 +
        sceneVariation.heroRoamBoost * 0.08);
    const heroLaneSign =
      Math.sign(laneTargetX || context.stageCuePlan.heroStageX || 0.24) || 1;
    const heroClock =
      context.elapsedSeconds *
        (0.18 +
          context.stageCuePlan.heroMotionBias * 0.32 +
          eventScaleBias * 0.1 +
          sceneVariation.noveltyDrive * 0.06) +
      context.barPhase * Math.PI * 2;
    const chamberClock =
      context.elapsedSeconds *
        (0.1 +
          context.directorWorldActivity * 0.14 +
          eventScaleBias * 0.04 +
          sceneVariation.spectralProfile * 0.04) +
      context.phrasePhase * Math.PI * 2;
    const cameraClock =
      context.elapsedSeconds *
        (0.14 +
          context.directorFraming * 0.12 +
          context.stageCuePlan.heroMotionBias * 0.08 +
          sceneVariation.cameraSpreadBoost * 0.08) +
      context.barPhase * Math.PI * 2;
    const heroPulse = phasePulse(
      context.phrasePhase,
      context.elapsedSeconds * 0.24
    );
    const chamberPulse = phasePulse(
      context.barPhase,
      context.elapsedSeconds * 0.18
    );
    const heroTravelGain =
      1 + sceneVariation.heroRoamBoost * 0.68 + sceneVariation.noveltyDrive * 0.18;
    const chamberTravelGain =
      1 + sceneVariation.beamBoost * 0.22 + sceneVariation.latticeBoost * 0.18;
    const cameraTravelGain = 1 + sceneVariation.cameraSpreadBoost * 0.56;
    const worldLedCameraBias = THREE.MathUtils.clamp(
      worldTakeoverBias +
        (context.stageCompositionPlan.shotClass === 'pressure' ? 0.62 : 0) +
        (context.stageCuePlan.family === 'reveal' ? 0.34 : 0) +
        (context.stageCuePlan.family === 'rupture' ? 0.22 : 0) +
        (context.stageCuePlan.worldMode === 'cathedral-rise' ? 0.26 : 0),
      0,
      1.6
    );

    const heroTargetPosition = this.motionPositionScratch.set(0, 0, 0);
    const heroTargetEuler = this.motionEulerScratch.set(0, 0, 0);
    switch (context.stageCuePlan.motionPhrase) {
      case 'bank-rise':
        heroTargetPosition.set(
          lanePositionX + Math.sin(heroClock * 0.8) * 0.42 * stageBias,
          lanePositionY +
            (0.1 + heroPulse * 0.24 + context.stageCuePlan.heroStageY * 0.1) *
              stageBias,
          Math.cos(heroClock * 0.64) * 0.24 * stageBias
        );
        heroTargetEuler.set(
          0.18 * stageBias + Math.sin(heroClock * 0.54) * 0.16,
          heroLaneSign * 0.28 * stageBias + Math.cos(heroClock * 0.66) * 0.24,
          heroLaneSign * (0.18 + heroPulse * 0.28) * stageBias
        );
        break;
      case 'arc-handoff':
        heroTargetPosition.set(
          lanePositionX +
            heroLaneSign * (0.22 + Math.sin(heroClock) * 0.44) * stageBias,
          lanePositionY + Math.sin(heroClock * 0.72) * 0.28 * stageBias,
          Math.cos(heroClock * 0.46) * 0.28 * stageBias
        );
        heroTargetEuler.set(
          Math.cos(heroClock * 0.8) * 0.22 * stageBias,
          heroLaneSign *
            (0.14 + Math.sin(heroClock * 0.52) * 0.26) *
            stageBias,
          heroLaneSign * Math.sin(heroClock * 0.72) * 0.24 * stageBias
        );
        break;
      case 'tumble-release':
        heroTargetPosition.set(
          lanePositionX + Math.sin(heroClock * 0.6) * 0.24 * stageBias,
          lanePositionY + Math.cos(heroClock * 0.44) * 0.14 * stageBias,
          -0.06 * stageBias + Math.sin(heroClock * 0.82) * 0.24 * stageBias
        );
        heroTargetEuler.set(
          Math.sin(heroClock * 0.84) * 0.26 * stageBias,
          Math.cos(heroClock * 0.62) * 0.22 * stageBias,
          heroLaneSign * Math.sin(heroClock * 0.96) * 0.28 * stageBias
        );
        break;
      case 'recoil-dive':
        heroTargetPosition.set(
          lanePositionX +
            heroLaneSign * Math.sin(heroClock * 1.06) * 0.36 * stageBias,
          lanePositionY -
            Math.abs(Math.cos(heroClock * 0.9)) * 0.22 * stageBias,
          -0.18 * stageBias + Math.sin(heroClock * 0.72) * 0.24 * stageBias
        );
        heroTargetEuler.set(
          -0.2 * stageBias +
            Math.cos(heroClock * 0.88) * 0.24 * stageBias,
          heroLaneSign *
            (0.22 + Math.sin(heroClock * 0.7) * 0.32) *
            stageBias,
          heroLaneSign * Math.sin(heroClock * 1.04) * 0.3 * stageBias
        );
        break;
      case 'cathedral-precession':
        heroTargetPosition.set(
          lanePositionX +
            heroLaneSign * Math.sin(heroClock * 0.42) * 0.34 * stageBias,
          lanePositionY +
            0.12 * stageBias +
            Math.cos(heroClock * 0.38) * 0.18 * stageBias,
          Math.sin(heroClock * 0.32) * 0.22 * stageBias
        );
        heroTargetEuler.set(
          Math.sin(heroClock * 0.36) * 0.18 * stageBias,
          heroLaneSign *
            (0.28 + Math.sin(heroClock * 0.28) * 0.24) *
            stageBias,
          heroLaneSign * Math.sin(heroClock * 0.3) * 0.18 * stageBias
        );
        break;
      default:
        heroTargetPosition.set(
          lanePositionX + Math.sin(heroClock * 0.72) * 0.22 * stageBias,
          lanePositionY + Math.cos(heroClock * 0.54) * 0.12 * stageBias,
          Math.sin(heroClock * 0.46) * 0.16 * stageBias
        );
        heroTargetEuler.set(
          Math.sin(heroClock * 0.58) * 0.12 * stageBias,
          heroLaneSign * Math.cos(heroClock * 0.48) * 0.18 * stageBias,
          heroLaneSign * Math.sin(heroClock * 0.7) * 0.1 * stageBias
        );
        break;
    }
    heroTargetPosition.multiplyScalar(heroTravelGain);
    heroTargetPosition.x += lanePositionX * sceneVariation.heroRoamBoost * 0.32;
    heroTargetPosition.y += lanePositionY * sceneVariation.heroRoamBoost * 0.18;
    heroTargetPosition.z +=
      Math.sin(heroClock * 0.28 + context.phrasePhase * Math.PI * 2) *
      0.04 *
      sceneVariation.heroRoamBoost;
    heroTargetEuler.x *= 1 + sceneVariation.noveltyDrive * 0.22;
    heroTargetEuler.y *= 1 + sceneVariation.heroRoamBoost * 0.2;
    heroTargetEuler.z *= 1 + sceneVariation.cameraSpreadBoost * 0.18;

    const chamberScale = THREE.MathUtils.clamp(
      0.16 +
        context.stageCuePlan.worldWeight * 0.3 +
        context.directorWorldActivity * 0.16 +
        eventScaleBias * 0.16 +
        worldLedCameraBias * 0.08,
      0,
      0.92
    );
    const chamberTargetPosition = this.motionPositionScratchB.set(0, 0, 0);
    const chamberTargetEuler = this.motionEulerScratchB.set(0, 0, 0);
    switch (context.stageCuePlan.motionPhrase) {
      case 'cathedral-precession':
        chamberTargetPosition.set(
          Math.sin(chamberClock * 0.26) * 0.24 * chamberScale,
          Math.cos(chamberClock * 0.18) * 0.12 * chamberScale,
          Math.sin(chamberClock * 0.22) * 0.28 * chamberScale
        );
        chamberTargetEuler.set(
          Math.sin(chamberClock * 0.22) * 0.12 * chamberScale,
          Math.cos(chamberClock * 0.18) * 0.28 * chamberScale,
          Math.sin(chamberClock * 0.16) * 0.12 * chamberScale
        );
        break;
      case 'recoil-dive':
        chamberTargetPosition.set(
          Math.sin(chamberClock * 0.34) * 0.18 * chamberScale,
          -Math.abs(Math.cos(chamberClock * 0.26)) * 0.12 * chamberScale,
          -0.12 * chamberScale +
            Math.sin(chamberClock * 0.28) * 0.2 * chamberScale
        );
        chamberTargetEuler.set(
          Math.sin(chamberClock * 0.24) * 0.14 * chamberScale,
          Math.cos(chamberClock * 0.2) * 0.22 * chamberScale,
          Math.sin(chamberClock * 0.22) * 0.14 * chamberScale
        );
        break;
      default:
        chamberTargetPosition.set(
          Math.sin(chamberClock * 0.3) * 0.14 * chamberScale,
          Math.cos(chamberClock * 0.22) * 0.08 * chamberScale,
          Math.sin(chamberClock * 0.24) * 0.18 * chamberScale
        );
        chamberTargetEuler.set(
          Math.sin(chamberClock * 0.2) * 0.08 * chamberScale,
          Math.cos(chamberClock * 0.18) * 0.18 * chamberScale,
          Math.sin(chamberClock * 0.16) * 0.1 * chamberScale
        );
        break;
    }
    chamberTargetPosition.multiplyScalar(chamberTravelGain);
    chamberTargetPosition.z -= sceneVariation.postContrastBoost * 0.04;
    chamberTargetEuler.x *= 1 + sceneVariation.spectralProfile * 0.18;
    chamberTargetEuler.y *= 1 + sceneVariation.noveltyDrive * 0.16;
    chamberTargetEuler.z *= 1 + sceneVariation.prismaticProfile * 0.18;

    const cameraScale = THREE.MathUtils.clamp(
      0.08 +
        context.directorFraming * 0.14 +
        context.stageCuePlan.screenWeight * 0.1 +
        eventScaleBias * 0.12 +
        sceneVariation.cameraSpreadBoost * 0.1 +
        worldLedCameraBias * 0.08,
      0,
      0.68
    );
    const rollGate =
      context.stageCompositionPlan.eventScale === 'stage' ||
      context.stageCompositionPlan.shotClass === 'worldTakeover' ||
      context.stageCuePlan.family === 'rupture';
    const cameraTargetPosition = this.motionPositionScratchC.set(0, 0, 0);
    const cameraTargetEuler = this.motionEulerScratchC.set(0, 0, 0);
    switch (context.stageCuePlan.cameraPhrase) {
      case 'bank-rise':
        cameraTargetPosition.set(
          Math.sin(cameraClock * 0.52) * 0.24 * cameraScale,
          Math.cos(cameraClock * 0.36) * 0.18 * cameraScale,
          Math.sin(cameraClock * 0.44) * 0.18 * cameraScale
        );
        cameraTargetEuler.set(
          Math.sin(cameraClock * 0.38) * 0.08 * cameraScale,
          Math.cos(cameraClock * 0.3) * 0.12 * cameraScale,
          rollGate
            ? heroLaneSign *
                (0.14 + chamberPulse * 0.14 + worldLedCameraBias * 0.08) *
                cameraScale
            : 0
        );
        break;
      case 'arc-handoff':
        cameraTargetPosition.set(
          heroLaneSign * Math.sin(cameraClock * 0.58) * 0.28 * cameraScale,
          Math.cos(cameraClock * 0.34) * 0.16 * cameraScale,
          Math.sin(cameraClock * 0.22) * 0.2 * cameraScale
        );
        cameraTargetEuler.set(
          Math.sin(cameraClock * 0.32) * 0.08 * cameraScale,
          heroLaneSign * Math.cos(cameraClock * 0.28) * 0.12 * cameraScale,
          rollGate
            ? heroLaneSign *
                Math.sin(cameraClock * 0.52) *
                0.16 *
                cameraScale
            : 0
        );
        break;
      case 'recoil-dive':
        cameraTargetPosition.set(
          heroLaneSign * Math.sin(cameraClock * 0.74) * 0.22 * cameraScale,
          -Math.abs(Math.cos(cameraClock * 0.52)) * 0.14 * cameraScale,
          -0.14 * cameraScale +
            Math.sin(cameraClock * 0.4) * 0.14 * cameraScale
        );
        cameraTargetEuler.set(
          -Math.abs(Math.sin(cameraClock * 0.42)) * 0.1 * cameraScale,
          heroLaneSign * Math.cos(cameraClock * 0.34) * 0.14 * cameraScale,
          rollGate
            ? heroLaneSign *
                Math.sin(cameraClock * 0.62) *
                0.2 *
                cameraScale
            : 0
        );
        break;
      case 'cathedral-precession':
        cameraTargetPosition.set(
          Math.sin(cameraClock * 0.24) * 0.2 * cameraScale,
          Math.cos(cameraClock * 0.18) * 0.14 * cameraScale,
          Math.sin(cameraClock * 0.16) * 0.24 * cameraScale
        );
        cameraTargetEuler.set(
          Math.sin(cameraClock * 0.18) * 0.07 * cameraScale,
          Math.cos(cameraClock * 0.16) * 0.1 * cameraScale,
          rollGate
            ? heroLaneSign *
                Math.sin(cameraClock * 0.24) *
                0.16 *
                cameraScale
            : 0
        );
        break;
      default:
        cameraTargetPosition.set(
          Math.sin(cameraClock * 0.46) * 0.14 * cameraScale,
          Math.cos(cameraClock * 0.3) * 0.12 * cameraScale,
          Math.sin(cameraClock * 0.26) * 0.12 * cameraScale
        );
        cameraTargetEuler.set(
          Math.sin(cameraClock * 0.24) * 0.04 * cameraScale,
          Math.cos(cameraClock * 0.22) * 0.05 * cameraScale,
          rollGate
            ? heroLaneSign *
                Math.sin(cameraClock * 0.4) *
                0.1 *
                cameraScale
            : 0
        );
        break;
    }
    cameraTargetPosition.multiplyScalar(cameraTravelGain);
    cameraTargetPosition.x +=
      heroLaneSign *
      sceneVariation.cameraSpreadBoost *
      (0.06 + worldLedCameraBias * 0.03);
    cameraTargetPosition.y +=
      Math.sin(cameraClock * 0.32) *
      (0.04 + worldLedCameraBias * 0.02) *
      sceneVariation.cameraSpreadBoost;
    cameraTargetPosition.z +=
      Math.cos(cameraClock * 0.22) *
      (0.06 + worldLedCameraBias * 0.04) *
      cameraScale;
    cameraTargetEuler.x *=
      1 + sceneVariation.postContrastBoost * 0.18 + worldLedCameraBias * 0.08;
    cameraTargetEuler.y *=
      1 + sceneVariation.cameraSpreadBoost * 0.22 + worldLedCameraBias * 0.1;
    cameraTargetEuler.z *=
      1 + sceneVariation.cameraSpreadBoost * 0.48 + worldLedCameraBias * 0.16;

    this.applyMotionPoseState(
      this.heroMotionState,
      heroTargetPosition,
      heroTargetEuler,
      2.4 + context.stageCuePlan.heroMotionBias * 1.2,
      2.8 + eventScaleBias * 1.2,
      context.deltaSeconds
    );
    this.applyMotionPoseState(
      this.chamberMotionState,
      chamberTargetPosition,
      chamberTargetEuler,
      1.8 + context.directorWorldActivity * 1 + worldLedCameraBias * 0.4,
      2.2 + eventScaleBias * 0.8 + worldLedCameraBias * 0.3,
      context.deltaSeconds
    );
    this.applyMotionPoseState(
      this.cameraMotionState,
      cameraTargetPosition,
      cameraTargetEuler,
      2.2 + context.directorFraming * 0.9 + worldLedCameraBias * 0.4,
      2.7 + eventScaleBias * 1 + worldLedCameraBias * 0.5,
      context.deltaSeconds
    );
  }

  updateCamera(
    camera: THREE.PerspectiveCamera,
    context: MotionCameraContext
  ): void {
    const sceneVariation = context.sceneVariation;
    const cameraMotion = this.cameraMotionState;
    const beatPulse = onsetPulse(context.beatPhase);
    const tempoLock = context.stageAudioFeatures.tempo.lock;
    const tempoDensity = context.stageAudioFeatures.tempo.density;
    const impactBuild = context.stageAudioFeatures.impact.build;
    const impactHit = context.stageAudioFeatures.impact.hit;
    const spatialPresence = context.stageAudioFeatures.presence.spatial;
    const memoryAfterglow = context.stageAudioFeatures.memory.afterglow;
    const heroScaleBias = context.stageCuePlan.heroScaleBias;
    const heroStageX = context.stageCuePlan.heroStageX;
    const heroStageY = context.stageCuePlan.heroStageY;
    const heroDepthBias = context.stageCuePlan.heroDepthBias;
    const heroMotionBias = context.stageCuePlan.heroMotionBias;
    const shotWorldTakeover =
      context.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure =
      context.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const shotAftermath =
      context.stageCompositionPlan.shotClass === 'aftermath' ? 1 : 0;
    const shotIsolate =
      context.stageCompositionPlan.shotClass === 'isolate' ? 1 : 0;
    const cadenceSurge =
      context.stageCompositionPlan.tempoCadenceMode === 'surge' ? 1 : 0;
    const cadenceDriving =
      context.stageCompositionPlan.tempoCadenceMode === 'driving' ? 1 : 0;
    const cadenceAftermath =
      context.stageCompositionPlan.tempoCadenceMode === 'aftermath' ? 1 : 0;
    const fallbackDemoteHero =
      context.stageCompositionPlan.fallbackDemoteHero ? 1 : 0;
    const fallbackWidenShot =
      context.stageCompositionPlan.fallbackWidenShot ? 1 : 0;
    const cueRupture = context.stageCuePlan.family === 'rupture' ? 1 : 0;
    const cueReveal = context.stageCuePlan.family === 'reveal' ? 1 : 0;
    const cueHaunt = context.stageCuePlan.family === 'haunt' ? 1 : 0;
    const cueReset = context.stageCuePlan.family === 'reset' ? 1 : 0;
    const collapseScarMoment =
      context.signatureMoment.kind === 'collapse-scar'
        ? context.signatureMoment.worldLead
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
        ? context.signatureMoment.intensity
        : 0;
    const largeHeroBias = Math.max(0, heroScaleBias);
    const smallHeroBias = Math.max(0, -heroScaleBias);
    const framingLeadX = heroStageX * (0.9 + heroMotionBias * 0.3);
    const framingLeadY = heroStageY * (0.6 + heroMotionBias * 0.22);
    const offCenterTravelBias =
      cueReveal * 0.18 +
      shotPressure * 0.16 +
      shotWorldTakeover * 0.26 +
      shotIsolate * 0.22 +
      sceneVariation.cameraSpreadBoost * 0.24;

    const lowEnergyReadableFloorActive =
      context.stageCuePlan.family !== 'haunt' &&
      context.stageCuePlan.family !== 'reset' &&
      context.stageCuePlan.family !== 'release' &&
      context.stageCuePlan.spendProfile !== 'peak' &&
      (context.roomMusicVisualFloor > 0.08 ||
        context.adaptiveMusicVisualFloor > 0.12);
    const coverageExcess = THREE.MathUtils.clamp(
      (context.heroCoverageEstimateCurrent -
        context.stageCompositionPlan.heroEnvelope.coverageMax) /
        Math.max(context.stageCompositionPlan.heroEnvelope.coverageMax, 0.08),
      0,
      1
    );
    const ringBeltExcess = THREE.MathUtils.clamp(
      (context.ringBeltPersistenceCurrent - 0.32) / 0.42,
      0,
      1
    );
    const wirefieldExcess = THREE.MathUtils.clamp(
      (context.wirefieldDensityScoreCurrent - 0.28) / 0.48,
      0,
      1
    );
    const overfillPressure = THREE.MathUtils.clamp(
      coverageExcess * 0.44 +
        ringBeltExcess * 0.26 +
        wirefieldExcess * 0.32 +
        shotPressure * 0.12 +
        cueReveal * 0.06,
      0,
      1
    );
    const coverageDeficit = lowEnergyReadableFloorActive
      ? THREE.MathUtils.clamp(
          (context.stageCompositionPlan.heroEnvelope.coverageMin -
            context.heroCoverageEstimateCurrent) /
            Math.max(
              context.stageCompositionPlan.heroEnvelope.coverageMin,
              0.02
            ),
          0,
          1
        )
      : 0;
    const targetFov = THREE.MathUtils.clamp(
      50 +
        context.directorFraming * 14.5 +
        context.directorWorldActivity * 0.8 +
        context.eclipseWeight * 0.8 +
        context.preDropTension * 1.1 -
        context.spectacle * 1.4 -
        context.portalOpenAmount * 0.5 -
        context.dropImpact * 2.6 -
        impactHit * 0.8 -
        context.sectionChange * 0.8 -
        largeHeroBias * 5.6 -
        heroDepthBias * 2.4 +
        smallHeroBias * 2.4 +
        overfillPressure * 4.8 +
        shotWorldTakeover * (lowEnergyReadableFloorActive ? 2.6 : 4.4) +
        shotAftermath * (lowEnergyReadableFloorActive ? 2.2 : 3.2) +
        shotIsolate * (lowEnergyReadableFloorActive ? 3 : 5) +
        collapseScarMoment * 2.4 +
        cathedralOpenMoment * 2.2 +
        ghostResidueMoment * 1.4 +
        silenceConstellationMoment * 2.8 +
        fallbackWidenShot * 2.8 +
        cadenceAftermath * 1.4 -
        cadenceSurge * 1.2 -
        spatialPresence * 0.8 +
        cueReveal * 1.1 +
        cueHaunt * 1.4 +
        memoryAfterglow * 0.8 +
        cueReset * 1.8 -
        coverageDeficit *
          (4 +
            context.tuningCameraNearFloor * 6 +
            context.tuningReadableHeroFloor * 4),
      38,
      68 + sceneVariation.cameraSpreadBoost * 3
    );
    camera.fov = this.smoothValue(camera.fov, targetFov, 2.2, context.deltaSeconds);
    camera.updateProjectionMatrix();

    const targetX =
      framingLeadX *
        (1.24 +
          offCenterTravelBias -
          shotWorldTakeover * 0.42 -
          shotAftermath * 0.4) +
      context.adaptiveMusicVisualFloor *
        Math.sign(framingLeadX || heroStageX || 1) *
        0.08 +
      context.gazeX *
        (0.08 +
          context.spectacle * 0.06 +
          context.directorWorldActivity * 0.03) +
      Math.sin(context.elapsedSeconds * 0.18 + context.phrasePhase * Math.PI * 2) *
        0.18 *
        sceneVariation.cameraSpreadBoost +
      Math.sin(context.elapsedSeconds * 0.08 + context.barPhase * Math.PI * 2) *
        (0.18 +
          context.cathedralWeight * 0.28 +
          cathedralOpenMoment * 0.22 +
          context.preDropTension * 0.18 +
          heroMotionBias * 0.18 +
          tempoDensity * 0.14 +
          impactBuild * 0.08 +
          cadenceDriving * 0.08 +
          sceneVariation.cameraSpreadBoost * 0.22 +
          cadenceSurge * 0.1 -
          cadenceAftermath * 0.06) +
      context.cameraDrift.x * 1.4 +
      cathedralOpenMoment * Math.sin(context.elapsedSeconds * 0.11) * 0.28 -
      collapseScarMoment * Math.sign(framingLeadX || context.gazeX || 1) * 0.16 +
      cameraMotion.position.x;
    const targetY =
      framingLeadY *
        (0.96 - shotWorldTakeover * 0.26 - shotAftermath * 0.18) +
      context.adaptiveMusicVisualFloor *
        Math.sign(framingLeadY || heroStageY || -1) *
        0.04 +
      context.gazeY *
        (0.06 +
          context.geometryBias * 0.04 +
          context.directorWorldActivity * 0.02) +
      Math.cos(context.elapsedSeconds * 0.16 + context.barPhase * Math.PI * 2) *
        0.1 *
        sceneVariation.cameraSpreadBoost +
      Math.sin(
        context.elapsedSeconds * 0.12 +
          0.8 +
          context.phrasePhase * Math.PI * 2
      ) *
        (0.12 +
          context.plumeWeight * 0.2 +
          context.sectionChange * 0.18 +
          silenceConstellationMoment * 0.16 +
          ghostResidueMoment * 0.12 +
          heroMotionBias * 0.12 +
          spatialPresence * 0.12 +
          sceneVariation.cameraSpreadBoost * 0.12 +
          cadenceDriving * 0.04 -
          cadenceAftermath * 0.04) +
      context.cameraDrift.y * 1.26 +
      cathedralOpenMoment * 0.12 -
      collapseScarMoment * 0.1 +
      cameraMotion.position.y;
    const targetZ =
      9.8 +
      context.directorFraming * 2.4 -
      context.spectacle * 0.24 -
      context.body * 0.1 -
      context.portalWeight * 0.04 -
      context.portalOpenAmount * 0.08 +
      context.directorWorldActivity * 0.26 +
      tempoLock * 0.18 +
      cadenceDriving * 0.18 +
      cadenceAftermath * 0.24 +
      context.eclipseWeight * 0.34 +
      context.collapseAmount * 0.28 +
      context.preDropTension * 0.28 -
      context.dropImpact * (0.66 + beatPulse * 0.18) -
      context.sectionChange * 0.18 +
      memoryAfterglow * 0.18 +
      context.releaseTail * 0.18 +
      smallHeroBias * 1.2 -
      largeHeroBias * 3.4 -
      heroDepthBias * 2.4 -
      cueRupture * 0.72 -
      cueReveal * 0.42 +
      cueHaunt * 0.48 +
      shotWorldTakeover * (lowEnergyReadableFloorActive ? 0.88 : 1.44) +
      shotAftermath * (lowEnergyReadableFloorActive ? 0.6 : 0.96) +
      shotIsolate * (lowEnergyReadableFloorActive ? 1.1 : 1.78) +
      overfillPressure * 1.56 +
      fallbackWidenShot * 1.12 +
      sceneVariation.cameraSpreadBoost * 0.84 +
      cathedralOpenMoment * 0.8 +
      silenceConstellationMoment * 0.7 +
      ghostResidueMoment * 0.42 -
      collapseScarMoment * 0.32 +
      fallbackDemoteHero * 0.56 -
      cadenceSurge * 0.22 -
      coverageDeficit *
        (1.4 +
          context.tuningCameraNearFloor * 2.8 +
          context.tuningReadableHeroFloor * 1.8) +
      context.cameraDrift.z * 0.76 +
      cameraMotion.position.z;

    camera.position.x = this.smoothValue(
      camera.position.x,
      targetX,
      1.8,
      context.deltaSeconds
    );
    camera.position.y = this.smoothValue(
      camera.position.y,
      targetY,
      1.8,
      context.deltaSeconds
    );
    camera.position.z = this.smoothValue(
      camera.position.z,
      targetZ,
      context.dropImpact > 0.1 || largeHeroBias > 0.3 ? 4.2 : 1.9,
      context.deltaSeconds
    );
    const worldLedLookBias = THREE.MathUtils.clamp(
      shotWorldTakeover +
        shotPressure * 0.68 +
        cueReveal * 0.28 +
        cueRupture * 0.18 +
        context.signatureMoment.worldLead * 0.52 +
        context.signatureMoment.chamberArchitecture * 0.28 +
        sceneVariation.cameraSpreadBoost * 0.18,
      0,
      1.4
    );
    const lookHeroCoupling = THREE.MathUtils.clamp(
      0.11 -
        shotWorldTakeover * 0.05 -
        shotPressure * 0.03 -
        shotIsolate * 0.02 -
        overfillPressure * 0.04 -
        worldLedLookBias * 0.04 -
        context.signatureMoment.heroSuppression * 0.04,
      0.02,
      0.11
    );
    this.motionLookTarget.set(
      framingLeadX *
        (0.24 -
          shotWorldTakeover * 0.06 -
          shotAftermath * 0.08 +
          shotIsolate * 0.04) +
        context.gazeX * 0.08 +
        context.heroPosition.x * lookHeroCoupling +
        Math.sin(context.elapsedSeconds * 0.12) *
          (0.06 + worldLedLookBias * 0.04) *
          sceneVariation.cameraSpreadBoost +
        context.heroDrift.x * 0.12 +
        this.chamberMotionState.position.x *
          (0.08 + worldLedLookBias * 0.12) +
        context.chamberDrift.x * (0.1 + worldLedLookBias * 0.14),
      framingLeadY *
        (0.26 -
          shotWorldTakeover * 0.02 -
          shotAftermath * 0.04 +
          shotIsolate * 0.03) +
        context.gazeY * 0.06 +
        context.heroPosition.y * (lookHeroCoupling + 0.02) +
        Math.cos(context.elapsedSeconds * 0.1) *
          (0.04 + worldLedLookBias * 0.03) *
          sceneVariation.cameraSpreadBoost +
        context.heroDrift.y * 0.14 +
        context.sectionChange * 0.12 +
        this.chamberMotionState.position.y *
          (0.06 + worldLedLookBias * 0.1) +
        context.chamberDrift.y * (0.08 + worldLedLookBias * 0.12),
      -0.8 -
        context.beatDrive * 0.1 -
        context.portalWeight * 0.3 -
        heroDepthBias * 0.36 -
        context.preDropTension * 0.24 +
        context.releaseTail * 0.1 +
        shotWorldTakeover * 0.12 +
        shotAftermath * 0.08 +
        context.gazeZ +
        this.chamberMotionState.position.z *
          (0.08 + worldLedLookBias * 0.14) -
        worldLedLookBias * 0.16 +
        context.chamberDrift.z * (0.06 + worldLedLookBias * 0.1)
    );
    this.motionRotationMatrix.lookAt(
      camera.position,
      this.motionLookTarget,
      this.motionUp
    );
    this.motionBaseQuaternion.setFromRotationMatrix(this.motionRotationMatrix);
    this.motionCompositeQuaternion
      .copy(this.motionBaseQuaternion)
      .multiply(cameraMotion.quaternion);
    camera.quaternion.slerp(
      this.motionCompositeQuaternion,
      1 - Math.exp(-context.deltaSeconds * 3.2)
    );
  }

  private applyMotionPoseState(
    state: MotionPoseState,
    targetPosition: THREE.Vector3,
    targetEuler: THREE.Euler,
    positionRate: number,
    rotationRate: number,
    deltaSeconds: number
  ): void {
    const safeDelta = Math.max(deltaSeconds, 0.001);
    this.motionVelocityScratch.copy(targetPosition).sub(state.position);
    this.motionAngularScratch.set(
      targetEuler.x - state.euler.x,
      targetEuler.y - state.euler.y,
      targetEuler.z - state.euler.z
    );
    state.velocity.copy(this.motionVelocityScratch).multiplyScalar(1 / safeDelta);
    state.angularVelocity
      .copy(this.motionAngularScratch)
      .multiplyScalar(1 / safeDelta);
    state.targetPosition.copy(targetPosition);
    state.targetEuler.copy(targetEuler);
    this.smoothVector(
      state.position,
      state.targetPosition,
      positionRate,
      deltaSeconds
    );
    state.targetQuaternion.setFromEuler(state.targetEuler);
    this.smoothQuaternion(
      state.quaternion,
      state.targetQuaternion,
      rotationRate,
      deltaSeconds
    );
    state.euler.setFromQuaternion(state.quaternion);
  }

  private smoothVector(
    current: THREE.Vector3,
    target: THREE.Vector3,
    rate: number,
    deltaSeconds: number
  ): void {
    current.lerp(target, 1 - Math.exp(-rate * deltaSeconds));
  }

  private smoothQuaternion(
    current: THREE.Quaternion,
    target: THREE.Quaternion,
    rate: number,
    deltaSeconds: number
  ): void {
    current.slerp(target, 1 - Math.exp(-rate * deltaSeconds));
  }

  private smoothValue(
    current: number,
    target: number,
    rate: number,
    deltaSeconds: number
  ): number {
    const mix = 1 - Math.exp(-rate * deltaSeconds);

    return current + (target - current) * mix;
  }
}
