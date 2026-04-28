import * as THREE from 'three';
import type {
  ShowAct,
  StageCompositionPlan,
  StageCuePlan,
  StageHeroForm
} from '../../types/visual';

export type SceneVariationProfile = {
  voidProfile: number;
  spectralProfile: number;
  stormProfile: number;
  solarProfile: number;
  eclipseProfile: number;
  prismaticProfile: number;
  noveltyDrive: number;
  ringSuppression: number;
  portalSuppression: number;
  latticeBoost: number;
  beamBoost: number;
  haloBoost: number;
  bladeBoost: number;
  sweepBoost: number;
  heroRoamBoost: number;
  cameraSpreadBoost: number;
  postContrastBoost: number;
};

export type SceneVariationInput = {
  stageCuePlan: StageCuePlan;
  stageCompositionPlan: StageCompositionPlan;
  actWeights: Record<ShowAct, number>;
  familyWeights: {
    portalIris: number;
    cathedralRings: number;
    ghostLattice: number;
    stormCrown: number;
    eclipseChamber: number;
    spectralPlume: number;
  };
  activeHeroForm: StageHeroForm;
  activeHeroAccentForm: StageHeroForm;
};

export function resolveSceneVariationProfile(
  input: SceneVariationInput
): SceneVariationProfile {
  const paletteTargets = input.stageCuePlan.paletteTargets;
  const paletteTargetDominance = Math.max(
    paletteTargets['void-cyan'],
    paletteTargets['tron-blue'],
    paletteTargets['acid-lime'],
    paletteTargets['solar-magenta'],
    paletteTargets['ghost-white']
  );
  const paletteSpread = 1 - paletteTargetDominance;
  const cueFamily = input.stageCuePlan.family;
  const worldMode = input.stageCuePlan.worldMode;
  const screenEffectFamily = input.stageCuePlan.screenEffectIntent.family;
  const shotClass = input.stageCompositionPlan.shotClass;
  const voidProfile = THREE.MathUtils.clamp(
    input.actWeights['void-chamber'] * 0.42 +
      paletteTargets['void-cyan'] * 0.22 +
      paletteTargets['ghost-white'] * 0.12 +
      (cueFamily === 'brood' ? 0.14 : 0) +
      (cueFamily === 'haunt' ? 0.12 : 0) +
      (cueFamily === 'release' ? 0.08 : 0) +
      (worldMode === 'hold' ? 0.16 : 0) +
      (worldMode === 'ghost-chamber' ? 0.22 : 0),
    0,
    1
  );
  const spectralProfile = THREE.MathUtils.clamp(
    input.actWeights['ghost-afterimage'] * 0.34 +
      input.familyWeights.spectralPlume * 0.18 +
      (cueFamily === 'release' ? 0.16 : 0) +
      (cueFamily === 'haunt' ? 0.22 : 0) +
      (worldMode === 'ghost-chamber' ? 0.14 : 0) +
      (input.activeHeroForm === 'mushroom' ? 0.12 : 0) +
      (input.activeHeroForm === 'diamond' ? 0.08 : 0) +
      paletteTargets['ghost-white'] * 0.16,
    0,
    1
  );
  const stormProfile = THREE.MathUtils.clamp(
    input.actWeights['matrix-storm'] * 0.3 +
      input.familyWeights.stormCrown * 0.18 +
      input.stageCuePlan.heroMotionBias * 0.16 +
      (cueFamily === 'gather' ? 0.16 : 0) +
      (cueFamily === 'reveal' ? 0.14 : 0) +
      paletteTargets['tron-blue'] * 0.16 +
      paletteTargets['acid-lime'] * 0.14 +
      input.stageCuePlan.eventDensity * 0.08,
    0,
    1
  );
  const solarProfile = THREE.MathUtils.clamp(
    input.actWeights['laser-bloom'] * 0.28 +
      input.actWeights['eclipse-rupture'] * 0.14 +
      (cueFamily === 'reveal' ? 0.14 : 0) +
      (cueFamily === 'rupture' ? 0.14 : 0) +
      paletteTargets['solar-magenta'] * 0.24 +
      paletteTargets['acid-lime'] * 0.08,
    0,
    1
  );
  const eclipseProfile = THREE.MathUtils.clamp(
    input.actWeights['eclipse-rupture'] * 0.36 +
      (cueFamily === 'rupture' ? 0.2 : 0) +
      (worldMode === 'collapse-well' ? 0.22 : 0) +
      (screenEffectFamily === 'impact-memory' ? 0.16 : 0) +
      (screenEffectFamily === 'carve' ? 0.14 : 0) +
      (input.activeHeroForm === 'shard' ? 0.08 : 0),
    0,
    1
  );
  const prismaticProfile = THREE.MathUtils.clamp(
    paletteSpread * 0.42 +
      input.stageCuePlan.heroMorphBias * 0.18 +
      (cueFamily === 'gather' ? 0.08 : 0) +
      (cueFamily === 'reveal' ? 0.12 : 0) +
      (worldMode === 'fan-sweep' ? 0.14 : 0) +
      (worldMode === 'field-bloom' ? 0.08 : 0) +
      (input.activeHeroForm === 'prism' ? 0.18 : 0) +
      (input.activeHeroAccentForm === 'prism' ? 0.08 : 0) +
      (input.activeHeroForm === 'pyramid' ? 0.08 : 0) +
      (input.activeHeroForm === 'shard' ? 0.08 : 0),
    0,
    1.2
  );
  const noveltyDrive = THREE.MathUtils.clamp(
    paletteSpread * 0.36 +
      prismaticProfile * 0.22 +
      spectralProfile * 0.12 +
      solarProfile * 0.1 +
      input.stageCuePlan.eventDensity * 0.12 +
      input.stageCuePlan.heroMotionBias * 0.08 +
      input.stageCuePlan.screenEffectIntent.intensity * 0.08,
    0,
    1.4
  );

  return {
    voidProfile,
    spectralProfile,
    stormProfile,
    solarProfile,
    eclipseProfile,
    prismaticProfile,
    noveltyDrive,
    ringSuppression: THREE.MathUtils.clamp(
      prismaticProfile * 0.24 +
        spectralProfile * 0.18 +
        stormProfile * 0.12 +
        (cueFamily === 'reveal' ? 0.08 : 0) +
        (worldMode === 'field-bloom' ? 0.08 : 0),
      0,
      0.72
    ),
    portalSuppression: THREE.MathUtils.clamp(
      spectralProfile * 0.12 + voidProfile * 0.08 + eclipseProfile * 0.12,
      0,
      0.6
    ),
    latticeBoost: THREE.MathUtils.clamp(
      voidProfile * 0.18 + spectralProfile * 0.32 + prismaticProfile * 0.08,
      0,
      0.82
    ),
    beamBoost: THREE.MathUtils.clamp(
      stormProfile * 0.26 + solarProfile * 0.18 + prismaticProfile * 0.1,
      0,
      0.82
    ),
    haloBoost: THREE.MathUtils.clamp(
      solarProfile * 0.28 + prismaticProfile * 0.14 + voidProfile * 0.04,
      0,
      0.72
    ),
    bladeBoost: THREE.MathUtils.clamp(
      eclipseProfile * 0.22 + stormProfile * 0.1 + solarProfile * 0.12,
      0,
      0.72
    ),
    sweepBoost: THREE.MathUtils.clamp(
      prismaticProfile * 0.22 +
        stormProfile * 0.12 +
        spectralProfile * 0.08 +
        (worldMode === 'fan-sweep' ? 0.14 : 0),
      0,
      0.78
    ),
    heroRoamBoost: THREE.MathUtils.clamp(
      noveltyDrive * 0.22 +
        prismaticProfile * 0.1 +
        stormProfile * 0.08 +
        (shotClass !== 'anchor' ? 0.06 : 0),
      0,
      0.82
    ),
    cameraSpreadBoost: THREE.MathUtils.clamp(
      noveltyDrive * 0.18 +
        spectralProfile * 0.08 +
        prismaticProfile * 0.1 +
        (shotClass === 'worldTakeover' ? 0.14 : 0),
      0,
      0.8
    ),
    postContrastBoost: THREE.MathUtils.clamp(
      eclipseProfile * 0.26 + voidProfile * 0.12 + spectralProfile * 0.1,
      0,
      0.82
    )
  };
}
