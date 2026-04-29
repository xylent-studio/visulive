import * as THREE from 'three';
import type { StageAudioFeatures } from '../../audio/stageAudioFeatures';
import type {
  SignatureMomentSnapshot,
  StageCompositionPlan,
  StageCuePlan
} from '../../types/visual';

type StageBlade = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  axis: 'x' | 'y';
  side: -1 | 1;
  baseOffset: number;
};

type StageSweepPlane = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  side: -1 | 1;
  baseOffset: number;
  tilt: number;
};

export type StageFrameSceneVariation = {
  prismaticProfile: number;
  solarProfile: number;
  bladeBoost: number;
  sweepBoost: number;
};

export type StageFrameUpdateContext = {
  elapsedSeconds: number;
  idleBreath: number;
  barPhase: number;
  phrasePhase: number;
  beatPhase: number;
  stageCuePlan: StageCuePlan;
  stageCompositionPlan: StageCompositionPlan;
  signatureMoment: SignatureMomentSnapshot;
  matrixAct: number;
  roomMusicVisualFloor: number;
  adaptiveMusicVisualFloor: number;
  tuningNeonStageFloor: number;
  stageAudioFeatures: StageAudioFeatures;
  directorWorldActivity: number;
  gazeX: number;
  gazeY: number;
  phraseResolve: number;
  transientConfidence: number;
  sceneVariation: StageFrameSceneVariation;
};

const BASE_BACKGROUND = new THREE.Color('#040507');
const COOL_BACKGROUND = new THREE.Color('#06141a');
const VOID_BACKGROUND = new THREE.Color('#020305');
const STAIN_VIOLET = new THREE.Color('#4f315a');
const LASER_CYAN = new THREE.Color('#35f4ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const ACID_LIME = new THREE.Color('#bcff39');
const TOXIC_PINK = new THREE.Color('#ff5cff');
const ELECTRIC_WHITE = new THREE.Color('#f7fbff');
const GHOST_PALE = new THREE.Color('#f1e8d8');

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);
  return Math.exp(-clamped * 7);
}

export class StageFrameSystem {
  readonly group = new THREE.Group();

  private readonly blades: StageBlade[] = [];
  private readonly sweepPlanes: StageSweepPlane[] = [];

  build(): void {
    for (const spec of [
      { axis: 'x' as const, side: -1 as const, width: 1.1, height: 16.8, baseOffset: 3.8 },
      { axis: 'x' as const, side: 1 as const, width: 1.1, height: 16.8, baseOffset: 3.8 },
      { axis: 'y' as const, side: -1 as const, width: 14.4, height: 0.9, baseOffset: 2.5 },
      { axis: 'y' as const, side: 1 as const, width: 14.4, height: 0.9, baseOffset: 2.5 }
    ]) {
      const material = new THREE.MeshBasicMaterial({
        color: BASE_BACKGROUND.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.width, spec.height),
        material
      );
      mesh.renderOrder = 30;
      if (spec.axis === 'x') {
        mesh.position.x = spec.side * spec.baseOffset;
      } else {
        mesh.position.y = spec.side * spec.baseOffset;
      }
      this.blades.push({
        mesh,
        axis: spec.axis,
        side: spec.side,
        baseOffset: spec.baseOffset
      });
      this.group.add(mesh);
    }

    for (let index = 0; index < 2; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: LASER_CYAN.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4 + index * 0.9, 16.8),
        material
      );
      mesh.renderOrder = 31;
      this.sweepPlanes.push({
        mesh,
        side: index === 0 ? -1 : 1,
        baseOffset: 8.4 + index * 0.8,
        tilt: (index === 0 ? -1 : 1) * (0.26 + index * 0.08)
      });
      this.group.add(mesh);
    }
  }

  update(context: StageFrameUpdateContext): void {
    const cueGather = context.stageCuePlan.family === 'gather' ? 1 : 0;
    const cueReveal = context.stageCuePlan.family === 'reveal' ? 1 : 0;
    const cueRupture = context.stageCuePlan.family === 'rupture' ? 1 : 0;
    const cueRelease = context.stageCuePlan.family === 'release' ? 1 : 0;
    const cueHaunt = context.stageCuePlan.family === 'haunt' ? 1 : 0;
    const cueReset = context.stageCuePlan.family === 'reset' ? 1 : 0;
    const heroDominant = context.stageCuePlan.dominance === 'hero' ? 1 : 0;
    const shotWorldTakeover =
      context.stageCompositionPlan.shotClass === 'worldTakeover' ? 1 : 0;
    const shotPressure =
      context.stageCompositionPlan.shotClass === 'pressure' ? 1 : 0;
    const shotAftermath =
      context.stageCompositionPlan.shotClass === 'aftermath' ? 1 : 0;
    const shotIsolate =
      context.stageCompositionPlan.shotClass === 'isolate' ? 1 : 0;
    const transitionCollapse =
      context.stageCompositionPlan.transitionClass === 'collapse' ? 1 : 0;
    const transitionWipe =
      context.stageCompositionPlan.transitionClass === 'wipe' ? 1 : 0;
    const transitionBlackout =
      context.stageCompositionPlan.transitionClass === 'blackoutCut' ? 1 : 0;
    const transitionResidue =
      context.stageCompositionPlan.transitionClass === 'residueDissolve' ? 1 : 0;
    const apertureCage =
      context.stageCuePlan.worldMode === 'aperture-cage' ? 1 : 0;
    const fanSweep = context.stageCuePlan.worldMode === 'fan-sweep' ? 1 : 0;
    const cathedralFrame =
      context.stageCuePlan.worldMode === 'cathedral-rise' ? 1 : 0;
    const collapseWell =
      context.stageCuePlan.worldMode === 'collapse-well' ? 1 : 0;
    const ghostChamber =
      context.stageCuePlan.worldMode === 'ghost-chamber' ? 1 : 0;
    const fieldBloom =
      context.stageCuePlan.worldMode === 'field-bloom' ? 1 : 0;
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
        ? context.signatureMoment.intensity
        : 0;
    const matrixRevealFlow =
      context.matrixAct * (cueReveal * 0.82 + cueGather * 0.48);
    const cueScreen = context.stageCuePlan.screenWeight;
    const cueResidue = context.stageCuePlan.residueWeight;
    const stageFlash = context.stageCuePlan.flashAmount;
    const stageWipe = context.stageCuePlan.wipeAmount;
    const stageSubtractive = context.stageCuePlan.subtractiveAmount;
    const subtractivePolicy = context.stageCompositionPlan.subtractivePolicy;
    const washoutSuppression = context.stageCuePlan.washoutSuppression;
    const peakSpend =
      context.stageCuePlan.spendProfile === 'peak' ? 1 : 0;
    const chamberEnvelope = context.stageCompositionPlan.chamberEnvelope;
    const chamberPresenceFloor = chamberEnvelope.presenceFloor;
    const chamberDominanceFloor = chamberEnvelope.dominanceFloor;
    const chamberWorldTakeoverBias = chamberEnvelope.worldTakeoverBias;
    const musicStageFloor = Math.max(
      context.roomMusicVisualFloor,
      context.adaptiveMusicVisualFloor
    );
    const chamberStageLift = THREE.MathUtils.clamp(
      musicStageFloor * 0.32 +
        chamberPresenceFloor * 0.34 +
        chamberDominanceFloor * 0.28 +
        chamberWorldTakeoverBias * 0.24 +
        context.tuningNeonStageFloor * 0.18,
      0,
      1
    );
    const tempoDensity = context.stageAudioFeatures.tempo.density;
    const impactHit = context.stageAudioFeatures.impact.hit;
    const spatialPresence = context.stageAudioFeatures.presence.spatial;
    const memoryAfterglow = context.stageAudioFeatures.memory.afterglow;
    const restraint = context.stageAudioFeatures.stability.restraint;
    const beatPulse = onsetPulse(context.beatPhase);
    const phrasePulse = Math.max(
      context.phraseResolve,
      phasePulse(context.phrasePhase, context.elapsedSeconds * 0.24)
    );
    const bladeBoost = context.sceneVariation.bladeBoost;
    const sweepBoost = context.sceneVariation.sweepBoost;
    const frameTint = new THREE.Color()
      .copy(BASE_BACKGROUND)
      .lerp(
        COOL_BACKGROUND,
          0.42 +
          fieldBloom * 0.12 +
          silenceConstellationMoment * 0.1 +
          cueHaunt * 0.08 +
          spatialPresence * 0.08 +
          chamberStageLift * 0.16
      )
      .lerp(
        TRON_BLUE,
          0.04 +
          cueReveal * 0.08 +
          cathedralOpenMoment * 0.12 +
          chamberStageLift * 0.18 +
          shotWorldTakeover * 0.08
      )
      .lerp(TOXIC_PINK, context.sceneVariation.prismaticProfile * 0.12)
      .lerp(
        VOID_BACKGROUND,
        THREE.MathUtils.clamp(
          0.28 + cueGather * 0.12 + collapseWell * 0.16 - chamberStageLift * 0.18,
          0,
          1
        )
      )
      .lerp(
        STAIN_VIOLET,
        cueHaunt * 0.08 +
          cueResidue * 0.06 +
          memoryAfterglow * 0.08 +
          collapseScarMoment * 0.14 +
          ghostResidueMoment * 0.08
      );

    this.group.rotation.z =
      Math.sin(context.elapsedSeconds * 0.08 + context.barPhase * Math.PI * 2) *
        0.01 +
      cueReveal * 0.012 +
      spatialPresence * 0.008 +
      tempoDensity * 0.006 -
      cueGather * 0.01;

    this.blades.forEach((blade, index) => {
      const axisBias = blade.axis === 'x' ? 1 : 0.82;
      const clampAmount =
        apertureCage * 1.26 +
        cueGather * 0.88 +
        collapseWell * 1.14 +
        cueRupture * 0.36 +
        stageSubtractive * 0.42 +
        subtractivePolicy.apertureClamp * 0.8 +
        transitionCollapse * 0.22 +
        transitionBlackout * 0.18 +
        shotWorldTakeover * 0.24 +
        shotIsolate * 0.18 -
        restraint * 0.16 -
        cueRelease * 0.38 -
        cueReset * 0.3 +
        collapseScarMoment * 0.42;
      const sweepBias =
        fanSweep * 0.82 +
        cathedralFrame * 0.68 +
        cathedralOpenMoment * 0.64 +
        cueReveal * 0.44 +
        transitionWipe * 0.2 +
        subtractivePolicy.wipeBias * 0.36 -
        cueHaunt * 0.18;
      const offset =
        blade.baseOffset -
        clampAmount * (blade.axis === 'x' ? 1.8 : 1.1) +
        sweepBias * (blade.axis === 'x' ? 0.6 : 0.4);
      const drift =
        Math.sin(
          context.elapsedSeconds * (0.16 + index * 0.03) + blade.side * 0.7
        ) * (0.06 + cueResidue * 0.08 + cueHaunt * 0.04);

      blade.mesh.material.color
        .copy(frameTint)
        .lerp(
          COOL_BACKGROUND,
          cueReveal * 0.12 + fanSweep * 0.08 + chamberStageLift * 0.08
        )
        .lerp(
          LASER_CYAN,
          0.03 + chamberStageLift * 0.14 + cueReveal * 0.12 + fanSweep * 0.1
        )
        .lerp(
          TOXIC_PINK,
          context.sceneVariation.prismaticProfile * 0.1 +
            context.sceneVariation.solarProfile * 0.04
        )
        .lerp(
          VOID_BACKGROUND,
          collapseWell * 0.2 + cueGather * 0.1 - chamberStageLift * 0.08
        );
      blade.mesh.material.opacity = THREE.MathUtils.clamp(
        0.008 +
          chamberPresenceFloor * 0.022 +
          chamberWorldTakeoverBias * 0.018 +
          axisBias *
            (apertureCage * 0.12 +
              cueGather * 0.09 +
              collapseWell * 0.1 +
              cueRupture * 0.04 +
              cueHaunt * 0.028 +
              cueScreen * 0.028 +
              cueResidue * 0.028 +
              impactHit * 0.02 +
              stageSubtractive * 0.04 +
              subtractivePolicy.blackoutBias * 0.04 +
              bladeBoost * 0.05 +
              shotWorldTakeover * 0.03 +
              shotIsolate * 0.02) +
          collapseScarMoment * 0.04 +
          cathedralOpenMoment * 0.026 +
          ghostResidueMoment * 0.018 +
          silenceConstellationMoment * 0.014 -
          matrixRevealFlow * 0.04 -
          cueRelease * 0.05 -
          cueReset * 0.06 -
          shotAftermath * 0.02,
        0,
        0.18 +
          shotPressure * 0.02 +
          shotWorldTakeover * 0.04 -
          matrixRevealFlow * 0.04 -
          chamberStageLift * -0.04 -
          bladeBoost * 0.02 -
          peakSpend * washoutSuppression * 0.05
      );

      if (blade.axis === 'x') {
        blade.mesh.position.x = blade.side * offset + drift;
        blade.mesh.position.y = context.gazeY * 0.12;
      } else {
        blade.mesh.position.x = context.gazeX * 0.1;
        blade.mesh.position.y = blade.side * offset + drift * 0.6;
      }
      blade.mesh.position.z =
        -0.2 +
        cueGather * 0.08 -
        cueRelease * 0.04 +
        cueHaunt * 0.06 +
        ghostChamber * 0.08;
      blade.mesh.rotation.z =
        blade.side *
        (fanSweep * 0.08 +
          cathedralFrame * 0.05 +
          collapseWell * 0.1 -
          cueGather * 0.04 +
          drift * 0.08);
      blade.mesh.scale.set(
        1 +
          collapseWell * 0.12 +
          cueRupture * 0.08 +
          cueHaunt * 0.06 +
          memoryAfterglow * 0.08 +
          context.directorWorldActivity * 0.04 +
          bladeBoost * 0.1 +
          shotWorldTakeover * 0.08,
        1 +
          cueGather * 0.08 +
          cueHaunt * 0.1 +
          spatialPresence * 0.08 +
          sweepBoost * 0.08 +
          context.idleBreath * 0.02,
        1
      );
    });

    this.sweepPlanes.forEach((plane, index) => {
      const sweepTravel =
        fanSweep * 3.6 +
        cueReveal * 2.2 +
        cathedralOpenMoment * 2.4 +
        stageWipe * 1.8 +
        cueRupture * 0.4 +
        transitionWipe * 0.8 +
        subtractivePolicy.wipeBias * 1.4;
      const wave = Math.sin(
        context.elapsedSeconds * (0.32 + cueReveal * 0.12 + fanSweep * 0.18) +
          index * 1.7 +
          context.barPhase * Math.PI * 2
      );
      plane.mesh.material.color
        .copy(index === 0 ? LASER_CYAN : HOT_MAGENTA)
        .lerp(
          TRON_BLUE,
          fieldBloom * 0.18 + cueReveal * 0.1 + chamberStageLift * 0.14
        )
        .lerp(
          ACID_LIME,
          fanSweep * 0.18 +
            context.transientConfidence * 0.08 +
            chamberStageLift * 0.08
        )
        .lerp(
          TOXIC_PINK,
          context.sceneVariation.prismaticProfile * 0.14 +
            context.sceneVariation.solarProfile * 0.06
        )
        .lerp(
          ELECTRIC_WHITE,
          cueRupture * 0.05 + stageFlash * 0.04 + beatPulse * 0.03
        )
        .lerp(GHOST_PALE, cueHaunt * 0.12 + cueResidue * 0.08);
      plane.mesh.material.opacity = THREE.MathUtils.clamp(
        chamberPresenceFloor * 0.014 +
          chamberWorldTakeoverBias * 0.01 +
          cueReveal * 0.026 +
          fanSweep * 0.036 +
          cathedralOpenMoment * 0.034 +
          ghostResidueMoment * 0.012 +
          silenceConstellationMoment * 0.012 +
          stageWipe * 0.026 +
          cueRupture * 0.008 +
          cueHaunt * 0.01 +
          cueResidue * 0.014 +
          impactHit * 0.008 +
          sweepBoost * 0.012 +
          stageFlash * 0.012 -
          heroDominant * 0.02 -
          cueReset * 0.04 -
          shotWorldTakeover * 0.004 -
          shotAftermath * 0.01 +
          transitionResidue * 0.01,
        0,
        0.09 +
          shotWorldTakeover * 0.014 +
          shotPressure * 0.006 -
          sweepBoost * 0.024 -
          chamberStageLift * -0.028 -
          washoutSuppression * 0.03 -
          peakSpend * 0.016
      );
      plane.mesh.position.x =
        plane.side *
          (plane.baseOffset -
            sweepTravel -
            wave * (0.6 + fanSweep * 0.7 + cueReveal * 0.4)) +
        context.gazeX * 0.2;
      plane.mesh.position.y =
        context.gazeY * 0.18 +
        Math.cos(context.elapsedSeconds * 0.18 + index * 1.2) *
          (0.12 + cueHaunt * 0.18);
      plane.mesh.position.z = -0.4 + cueRupture * 0.08 + cueHaunt * 0.1;
      plane.mesh.rotation.z =
        plane.tilt +
        plane.side * (fanSweep * 0.14 + cueReveal * 0.08 + cueRupture * 0.06) +
        wave * 0.03;
      plane.mesh.rotation.x = cueHaunt * 0.08 - cueReveal * 0.04;
      plane.mesh.scale.set(
        1 +
          fanSweep * 0.14 +
          cueReveal * 0.1 +
          spatialPresence * 0.08 +
          sweepBoost * 0.12 +
          cueRupture * 0.04 +
          cueHaunt * 0.04,
        1 +
          cueHaunt * 0.1 +
          cueResidue * 0.08 +
          memoryAfterglow * 0.12 +
          sweepBoost * 0.08 +
          phrasePulse * 0.04,
        1
      );
    });
  }

  dispose(): void {
    this.blades.forEach(({ mesh }) => {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.sweepPlanes.forEach(({ mesh }) => {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.blades.length = 0;
    this.sweepPlanes.length = 0;
  }

  getBladeAverageOpacity(): number {
    return this.blades.length > 0
      ? this.blades.reduce((sum, blade) => sum + blade.mesh.material.opacity, 0) /
          this.blades.length
      : 0;
  }

  getSweepAverageOpacity(): number {
    return this.sweepPlanes.length > 0
      ? this.sweepPlanes.reduce((sum, plane) => sum + plane.mesh.material.opacity, 0) /
          this.sweepPlanes.length
      : 0;
  }
}
