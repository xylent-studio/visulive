import * as THREE from 'three';
import type { AuthorityFrameSnapshot, PaletteState } from '../../types/visual';

export type LightingSystemUpdateContext = {
  elapsedSeconds: number;
  authority: AuthorityFrameSnapshot;
  paletteState: PaletteState;
  sceneVariation: {
    voidProfile: number;
    spectralProfile: number;
    solarProfile: number;
    prismaticProfile: number;
    postContrastBoost: number;
  };
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
    eclipse: number;
  };
  events: {
    haloIgnition: number;
    portalOpen: number;
    worldStain: number;
  };
  director: {
    worldActivity: number;
    colorBias: number;
    colorWarp: number;
  };
  budgets: {
    ambientGlow: number;
    eventGlow: number;
  };
  audio: {
    air: number;
    roomness: number;
    body: number;
    brightness: number;
    shimmer: number;
    harmonicColor: number;
    transientConfidence: number;
    preDropTension: number;
    dropImpact: number;
    sectionChange: number;
    phrasePhase: number;
    beatPhase: number;
  };
  liftPulse: number;
  stage: {
    shotWorldTakeover: number;
    shotPressure: number;
    shotAnchor: number;
    chamberPresenceFloor: number;
    chamberDominanceFloor: number;
    chamberWorldTakeoverBias: number;
    roomMusicVisualFloor: number;
    adaptiveMusicVisualFloor: number;
    tuningNeonStageFloor: number;
    tuningWorldBootFloor: number;
  };
  motion: {
    cameraDrift: THREE.Vector3;
    gazeY: number;
  };
};

export type LightingSystemIntensities = {
  ambient: number;
  fill: number;
  warm: number;
  cool: number;
};

const LASER_CYAN = new THREE.Color('#35f4ff');
const TRON_BLUE = new THREE.Color('#1f6bff');
const VOLT_VIOLET = new THREE.Color('#7c4dff');
const HOT_MAGENTA = new THREE.Color('#ff3bc9');
const ACID_LIME = new THREE.Color('#bcff39');
const MATRIX_GREEN = new THREE.Color('#37ff7c');
const TOXIC_PINK = new THREE.Color('#ff5cff');
const CYBER_YELLOW = new THREE.Color('#ffe933');
const ELECTRIC_WHITE = new THREE.Color('#f7fbff');

function onsetPulse(phase: number): number {
  const clamped = THREE.MathUtils.clamp(phase, 0, 1);

  return Math.exp(-clamped * 7);
}

function phasePulse(phase: number, offset = 0): number {
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 + offset);
}

export class LightingSystem {
  private readonly ambientLight = new THREE.AmbientLight('#677483', 0.12);
  private readonly fillLight = new THREE.HemisphereLight('#26424f', '#040506', 0.36);
  private readonly warmLight = new THREE.PointLight('#ff4ed6', 0.42, 16, 2);
  private readonly coolLight = new THREE.PointLight('#35f4ff', 0.76, 20, 2);

  addToScene(scene: THREE.Scene): void {
    scene.add(this.ambientLight);
    scene.add(this.fillLight);
    scene.add(this.warmLight);
    scene.add(this.coolLight);
    this.warmLight.position.set(2.2, 1.5, 4);
    this.coolLight.position.set(-2.8, -1.4, 3.4);
  }

  update(context: LightingSystemUpdateContext): void {
    const paletteVoid = context.paletteState === 'void-cyan' ? 1 : 0;
    const paletteTron = context.paletteState === 'tron-blue' ? 1 : 0;
    const paletteAcid = context.paletteState === 'acid-lime' ? 1 : 0;
    const paletteSolar = context.paletteState === 'solar-magenta' ? 1 : 0;
    const paletteGhost = context.paletteState === 'ghost-white' ? 1 : 0;
    const warmBias = Math.max(0, (context.director.colorBias - 0.5) * 2);
    const coolBias = Math.max(0, (0.5 - context.director.colorBias) * 2);
    const chromaPulse =
      0.5 + 0.5 * Math.sin(context.director.colorBias * Math.PI * 4 + context.elapsedSeconds * 0.2);
    const phrasePulse = phasePulse(
      context.audio.phrasePhase,
      context.elapsedSeconds * 0.28
    );
    const beatPulse = onsetPulse(context.audio.beatPhase);
    const musicStageFloor = Math.max(
      context.stage.roomMusicVisualFloor,
      context.stage.adaptiveMusicVisualFloor
    );
    const authorityWorldLift = THREE.MathUtils.clamp(
      context.authority.worldDominanceDelivered * 0.82 +
        context.authority.worldGlowSpend * 0.18,
      0,
      1.2
    );
    const authorityChamberLift = THREE.MathUtils.clamp(
      context.authority.chamberPresenceScore * 0.84 +
        context.authority.ringAuthority * 0.16,
      0,
      1.2
    );
    const authorityRingSuppression = THREE.MathUtils.clamp(
      Math.max(0, context.authority.ringBeltPersistence - 0.24) * 0.62 +
        Math.max(0, context.authority.wirefieldDensityScore - 0.2) * 0.54 +
        Math.max(0, context.authority.ringAuthority - 1.02) * 0.24,
      0,
      0.44
    );
    const authorityWashoutSuppression = THREE.MathUtils.clamp(
      context.authority.overbright * 0.22 +
        Math.max(0, context.authority.ringBeltPersistence - 0.3) * 0.12,
      0,
      0.32
    );
    const authoritySafetyFloor = THREE.MathUtils.clamp(
      context.authority.compositionSafetyScore * 0.08 +
        context.authority.worldDominanceDelivered * 0.04,
      0,
      0.14
    );
    const stageColorLift = THREE.MathUtils.clamp(
      context.stage.tuningNeonStageFloor * 0.34 +
        context.stage.tuningWorldBootFloor * 0.24 +
        musicStageFloor * 0.42 +
        context.stage.chamberPresenceFloor * 0.22 +
        context.stage.chamberDominanceFloor * 0.16 +
        authorityChamberLift * 0.18 +
        authorityWorldLift * 0.14 -
        authorityRingSuppression * 0.12 -
        authorityWashoutSuppression * 0.08,
      0,
      1
    );
    const chamberStageLift = THREE.MathUtils.clamp(
      musicStageFloor * 0.34 +
        context.stage.chamberPresenceFloor * 0.46 +
        context.stage.chamberDominanceFloor * 0.54 +
        context.stage.chamberWorldTakeoverBias * 0.44 +
        context.stage.shotWorldTakeover * 0.24 +
        context.stage.shotPressure * 0.12 +
        authorityChamberLift * 0.24 +
        authorityWorldLift * 0.2 -
        authorityRingSuppression * 0.18 -
        authorityWashoutSuppression * 0.1,
      0,
      1.2
    );
    const stageLightFloor =
      context.stage.chamberPresenceFloor * 0.06 +
      context.stage.chamberDominanceFloor * 0.08 +
      chamberStageLift * 0.05 +
      musicStageFloor * 0.04 +
      authorityWorldLift * 0.028 +
      authoritySafetyFloor -
      authorityRingSuppression * 0.02 -
      authorityWashoutSuppression * 0.018;

    this.ambientLight.color
      .copy(LASER_CYAN)
      .lerp(
        TRON_BLUE,
        0.18 +
          context.audio.air * 0.12 +
          coolBias * 0.16 +
          context.actWeights.laser * 0.08 +
          context.actWeights.matrix * 0.12 +
          context.actWeights.void * 0.04 +
          paletteVoid * 0.1 +
          paletteTron * 0.16 +
          stageColorLift * 0.22 +
          context.stage.shotWorldTakeover * 0.08 +
          context.stage.shotPressure * 0.04
      )
      .lerp(
        VOLT_VIOLET,
        phrasePulse * 0.02 + context.familyWeights.ghost * 0.03 + context.actWeights.ghost * 0.06
      )
      .lerp(
        HOT_MAGENTA,
        context.audio.harmonicColor * 0.02 +
          warmBias * 0.02 +
          context.actWeights.eclipse * 0.06 +
          paletteSolar * 0.05 +
          chamberStageLift * 0.08
      )
      .lerp(
        TOXIC_PINK,
        context.sceneVariation.prismaticProfile * 0.12 +
          context.sceneVariation.solarProfile * 0.06
      )
      .lerp(
        ACID_LIME,
        context.director.colorWarp * 0.04 +
          context.actWeights.matrix * 0.1 +
          paletteAcid * 0.14 +
          stageColorLift * 0.08
      )
      .lerp(
        ELECTRIC_WHITE,
        context.actWeights.ghost * 0.06 +
          paletteGhost * 0.08 +
          context.stage.shotWorldTakeover * 0.06
      );
    this.ambientLight.intensity =
      0.012 +
      context.budgets.ambientGlow * (0.052 + chamberStageLift * 0.018) +
      context.audio.roomness * 0.012 +
      context.director.worldActivity * 0.008 +
      context.audio.air * 0.012 +
      context.familyWeights.ghost * 0.006 +
      context.familyWeights.eclipse * 0.006 +
      stageLightFloor +
      context.stage.shotPressure * 0.01 +
      context.stage.shotWorldTakeover * 0.014 -
      context.sceneVariation.postContrastBoost * 0.012 +
      context.authority.worldDominanceDelivered * 0.01 -
      authorityRingSuppression * 0.01 -
      authorityWashoutSuppression * 0.012;

    this.fillLight.color
      .copy(LASER_CYAN)
      .lerp(
        TRON_BLUE,
        coolBias * 0.14 +
          context.familyWeights.portal * 0.08 +
          context.actWeights.laser * 0.08 +
          context.actWeights.matrix * 0.1 +
          paletteVoid * 0.08 +
          paletteTron * 0.14 +
          stageColorLift * 0.18 +
          context.stage.shotWorldTakeover * 0.06
      )
      .lerp(
        VOLT_VIOLET,
        context.familyWeights.ghost * 0.03 +
          phrasePulse * 0.03 +
          context.actWeights.ghost * 0.06
      )
      .lerp(
        ACID_LIME,
        context.audio.shimmer * 0.06 +
          context.audio.transientConfidence * 0.05 +
          chromaPulse * 0.04 +
          paletteAcid * 0.18 +
          stageColorLift * 0.08
      )
      .lerp(
        HOT_MAGENTA,
        context.audio.harmonicColor * 0.02 +
          warmBias * 0.02 +
          context.actWeights.eclipse * 0.06 +
          paletteSolar * 0.06 +
          chamberStageLift * 0.06
      )
      .lerp(
        TOXIC_PINK,
        context.sceneVariation.prismaticProfile * 0.12 +
          context.sceneVariation.solarProfile * 0.08
      )
      .lerp(MATRIX_GREEN, context.director.colorWarp * 0.06 + paletteAcid * 0.12)
      .lerp(
        ELECTRIC_WHITE,
        context.actWeights.ghost * 0.06 +
          paletteGhost * 0.08 +
          context.stage.shotWorldTakeover * 0.05
      );
    this.fillLight.intensity =
      0.074 +
      context.budgets.ambientGlow * (0.052 + chamberStageLift * 0.026) +
      context.audio.air * 0.03 +
      context.director.worldActivity * 0.016 +
      context.familyWeights.cathedral * 0.02 +
      context.familyWeights.portal * 0.02 +
      context.budgets.eventGlow *
        (context.events.portalOpen * 0.04 + context.audio.dropImpact * 0.06) +
      stageLightFloor * 1.32 +
      context.sceneVariation.prismaticProfile * 0.028 +
      context.stage.shotPressure * 0.026 +
      context.stage.shotWorldTakeover * 0.04 +
      context.authority.worldDominanceDelivered * 0.018 -
      authorityRingSuppression * 0.016 -
      authorityWashoutSuppression * 0.018;

    this.warmLight.color
      .copy(HOT_MAGENTA)
      .lerp(
        TOXIC_PINK,
        context.audio.harmonicColor * 0.14 +
          context.events.worldStain * 0.1 +
          warmBias * 0.08 +
          paletteSolar * 0.16 +
          chamberStageLift * 0.08
      )
      .lerp(VOLT_VIOLET, phrasePulse * 0.03 + context.actWeights.ghost * 0.06)
      .lerp(
        CYBER_YELLOW,
        context.events.haloIgnition * 0.12 +
          context.audio.dropImpact * 0.06 +
          chromaPulse * 0.04 +
          context.actWeights.laser * 0.04 +
          paletteSolar * 0.04 +
          stageColorLift * 0.06
      )
      .lerp(
        TOXIC_PINK,
        context.sceneVariation.solarProfile * 0.12 +
          context.sceneVariation.prismaticProfile * 0.08
      )
      .lerp(
        ELECTRIC_WHITE,
        context.events.haloIgnition * 0.16 +
          context.director.colorWarp * 0.05 +
          paletteGhost * 0.12 +
          context.stage.shotWorldTakeover * 0.04
      )
      .lerp(MATRIX_GREEN, context.director.colorWarp * 0.04 + paletteAcid * 0.1);
    this.warmLight.intensity =
      0.03 +
      context.budgets.ambientGlow * (0.02 + chamberStageLift * 0.008) +
      context.audio.body * 0.028 +
      context.audio.brightness * 0.024 +
      context.budgets.eventGlow *
        (context.events.haloIgnition * 0.18 +
          context.events.portalOpen * 0.06 +
          context.audio.dropImpact * 0.14 +
          context.audio.sectionChange * 0.1) +
      stageLightFloor * 0.92 +
      context.sceneVariation.solarProfile * 0.026 +
      context.stage.shotPressure * 0.016 +
      context.stage.shotAnchor * 0.006 +
      context.authority.chamberPresenceScore * 0.012 -
      authorityRingSuppression * 0.008 -
      authorityWashoutSuppression * 0.014;
    this.warmLight.position.set(
      2.2 +
        Math.sin(context.elapsedSeconds * 0.32) *
          (0.4 + context.sceneVariation.prismaticProfile * 0.3) +
        context.motion.cameraDrift.x * 0.46,
      1.1 +
        context.liftPulse * 0.6 +
        context.motion.cameraDrift.y * 0.34 +
        context.sceneVariation.solarProfile * 0.18,
      3.6 -
        context.familyWeights.portal * 0.5 +
        context.motion.cameraDrift.z * 0.52 -
        context.sceneVariation.spectralProfile * 0.18
    );

    this.coolLight.color
      .copy(LASER_CYAN)
      .lerp(
        TRON_BLUE,
        coolBias * 0.16 +
          context.familyWeights.portal * 0.1 +
          context.actWeights.laser * 0.08 +
          context.actWeights.matrix * 0.14 +
          paletteVoid * 0.1 +
          paletteTron * 0.16 +
          stageColorLift * 0.2 +
          context.stage.shotWorldTakeover * 0.06
      )
      .lerp(
        VOLT_VIOLET,
        context.familyWeights.ghost * 0.04 +
          phrasePulse * 0.03 +
          context.actWeights.ghost * 0.06
      )
      .lerp(
        ACID_LIME,
        context.audio.shimmer * 0.08 +
          context.audio.transientConfidence * 0.06 +
          chromaPulse * 0.06 +
          paletteAcid * 0.18 +
          stageColorLift * 0.08
      )
      .lerp(
        CYBER_YELLOW,
        beatPulse * 0.05 +
          context.events.haloIgnition * 0.04 +
          context.director.colorWarp * 0.03 +
          paletteSolar * 0.03 +
          chamberStageLift * 0.04
      )
      .lerp(
        TOXIC_PINK,
        context.sceneVariation.prismaticProfile * 0.1 +
          context.sceneVariation.solarProfile * 0.04
      )
      .lerp(
        HOT_MAGENTA,
        context.audio.harmonicColor * 0.02 +
          context.actWeights.eclipse * 0.06 +
          paletteSolar * 0.04
      )
      .lerp(MATRIX_GREEN, context.director.colorWarp * 0.08 + paletteAcid * 0.14)
      .lerp(
        ELECTRIC_WHITE,
        context.actWeights.ghost * 0.06 +
          paletteGhost * 0.1 +
          context.stage.shotWorldTakeover * 0.04
      );
    this.coolLight.intensity =
      0.062 +
      context.budgets.ambientGlow * (0.042 + chamberStageLift * 0.02) +
      context.audio.air * 0.05 +
      context.director.worldActivity * 0.02 +
      context.familyWeights.portal * 0.05 +
      context.familyWeights.ghost * 0.018 +
      context.audio.shimmer * 0.04 +
      context.audio.preDropTension * 0.03 +
      context.budgets.eventGlow * context.audio.dropImpact * 0.14 +
      stageLightFloor * 1.18 +
      context.sceneVariation.spectralProfile * 0.024 +
      context.stage.shotPressure * 0.018 +
      context.stage.shotWorldTakeover * 0.028 +
      context.authority.worldDominanceDelivered * 0.02 -
      authorityRingSuppression * 0.014 -
      authorityWashoutSuppression * 0.016;
    this.coolLight.position.set(
      -2.6 -
        Math.cos(context.elapsedSeconds * 0.28) *
          (0.44 + context.sceneVariation.spectralProfile * 0.24) -
        context.motion.cameraDrift.x * 0.4,
      -1.2 +
        context.motion.gazeY * 0.14 +
        context.motion.cameraDrift.y * 0.28 -
        context.sceneVariation.voidProfile * 0.14,
      3.2 -
        context.familyWeights.cathedral * 0.3 -
        context.motion.cameraDrift.z * 0.48 -
        context.sceneVariation.postContrastBoost * 0.18
    );
  }

  getIntensities(): LightingSystemIntensities {
    return {
      ambient: this.ambientLight.intensity,
      fill: this.fillLight.intensity,
      warm: this.warmLight.intensity,
      cool: this.coolLight.intensity
    };
  }

  dispose(): void {
    this.ambientLight.removeFromParent();
    this.fillLight.removeFromParent();
    this.warmLight.removeFromParent();
    this.coolLight.removeFromParent();
  }
}
