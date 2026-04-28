import * as THREE from 'three';
import type {
  AtmosphereMatterState,
  StageCueFamily,
  StageShotClass,
  StageWorldMode
} from '../../../types/visual';

export type WorldAtmosphereState = {
  activeMatterState: AtmosphereMatterState;
  atmosphereGas: number;
  atmosphereLiquid: number;
  atmospherePlasma: number;
  atmosphereCrystal: number;
  atmospherePressure: number;
  atmosphereIonization: number;
  atmosphereResidue: number;
  atmosphereStructureReveal: number;
};

export type WorldAtmosphereUpdateContext = {
  deltaSeconds: number;
  cueFamily: StageCueFamily;
  worldMode: StageWorldMode;
  shotClass: StageShotClass;
  familyWeights: {
    liquidPressureCore: number;
    cathedralRings: number;
    stormCrown: number;
    spectralPlume: number;
    ghostLattice: number;
  };
  actWeights: {
    laserBloom: number;
    matrixStorm: number;
  };
  directors: {
    atmosphere: number;
    worldActivity: number;
    radiance: number;
    laserDrive: number;
    spectacle: number;
    geometry: number;
    colorWarp: number;
  };
  audio: {
    air: number;
    roomness: number;
    resonance: number;
    subPressure: number;
    tonalStability: number;
    beatStrike: number;
    releaseTail: number;
    phraseTension: number;
    sectionChange: number;
    dropImpact: number;
    preDropTension: number;
  };
  stageAudioFeatures: {
    memoryAfterglow: number;
    impactBuild: number;
    impactHit: number;
    impactSection: number;
    presenceSpatial: number;
    textureRoughness: number;
    stabilityRestraint: number;
    tempoLock: number;
  };
  chamberWorldTakeoverBias: number;
};

function smoothValue(
  current: number,
  target: number,
  rate: number,
  deltaSeconds: number
): number {
  const mix = 1 - Math.exp(-rate * deltaSeconds);
  return current + (target - current) * mix;
}

export function updateWorldAtmosphereState(
  state: WorldAtmosphereState,
  context: WorldAtmosphereUpdateContext
): WorldAtmosphereState {
  const cueReveal = context.cueFamily === 'reveal' ? 1 : 0;
  const cueRupture = context.cueFamily === 'rupture' ? 1 : 0;
  const cueRelease = context.cueFamily === 'release' ? 1 : 0;
  const cueHaunt = context.cueFamily === 'haunt' ? 1 : 0;
  const cueReset = context.cueFamily === 'reset' ? 1 : 0;
  const fieldBloom = context.worldMode === 'field-bloom' ? 1 : 0;
  const cathedralRise = context.worldMode === 'cathedral-rise' ? 1 : 0;
  const ghostChamber = context.worldMode === 'ghost-chamber' ? 1 : 0;
  const collapseWell = context.worldMode === 'collapse-well' ? 1 : 0;
  const shotWorldTakeover = context.shotClass === 'worldTakeover' ? 1 : 0;

  const gasTarget = THREE.MathUtils.clamp(
    0.28 +
      context.directors.atmosphere * 0.22 +
      context.audio.air * 0.14 +
      context.audio.releaseTail * 0.12 +
      context.stageAudioFeatures.memoryAfterglow * 0.14 +
      context.familyWeights.spectralPlume * 0.2 +
      context.familyWeights.ghostLattice * 0.08 +
      context.stageAudioFeatures.presenceSpatial * 0.08 +
      ghostChamber * 0.12 +
      cueRelease * 0.08 +
      cueHaunt * 0.1 -
      context.audio.dropImpact * 0.12 -
      cueRupture * 0.08,
    0.04,
    1.4
  );
  const liquidTarget = THREE.MathUtils.clamp(
    0.08 +
      context.familyWeights.liquidPressureCore * 0.32 +
      context.audio.roomness * 0.12 +
      context.audio.resonance * 0.16 +
      context.audio.subPressure * 0.12 +
      context.stageAudioFeatures.textureRoughness * 0.1 +
      context.directors.worldActivity * 0.16 +
      fieldBloom * 0.1 +
      context.stageAudioFeatures.impactBuild * 0.08 -
      cueReset * 0.08,
    0.03,
    1.25
  );
  const plasmaTarget = THREE.MathUtils.clamp(
    0.06 +
      context.directors.radiance * 0.16 +
      context.directors.laserDrive * 0.14 +
      context.directors.spectacle * 0.08 +
      context.familyWeights.stormCrown * 0.22 +
      context.actWeights.laserBloom * 0.12 +
      context.actWeights.matrixStorm * 0.14 +
      context.stageAudioFeatures.impactHit * 0.18 +
      context.audio.dropImpact * 0.18 +
      context.audio.sectionChange * 0.14 +
      cueReveal * 0.08 +
      cueRupture * 0.14,
    0.02,
    1.35
  );
  const crystalTarget = THREE.MathUtils.clamp(
    0.04 +
      context.directors.geometry * 0.18 +
      context.familyWeights.cathedralRings * 0.26 +
      context.audio.tonalStability * 0.1 +
      context.stageAudioFeatures.tempoLock * 0.08 +
      context.chamberWorldTakeoverBias * 0.1 +
      cathedralRise * 0.18 +
      shotWorldTakeover * 0.16 +
      cueReveal * 0.18 +
      collapseWell * 0.08 -
      cueReset * 0.08 -
      context.stageAudioFeatures.stabilityRestraint * 0.05,
    0.02,
    1.22
  );

  const total = gasTarget + liquidTarget + plasmaTarget + crystalTarget;
  const nextGas = gasTarget / total;
  const nextLiquid = liquidTarget / total;
  const nextPlasma = plasmaTarget / total;
  const nextCrystal = crystalTarget / total;

  let atmosphereGas = smoothValue(
    state.atmosphereGas,
    nextGas,
    nextGas > state.atmosphereGas ? 0.96 : 0.52,
    context.deltaSeconds
  );
  let atmosphereLiquid = smoothValue(
    state.atmosphereLiquid,
    nextLiquid,
    nextLiquid > state.atmosphereLiquid ? 1.02 : 0.56,
    context.deltaSeconds
  );
  let atmospherePlasma = smoothValue(
    state.atmospherePlasma,
    nextPlasma,
    nextPlasma > state.atmospherePlasma ? 1.26 : 0.74,
    context.deltaSeconds
  );
  let atmosphereCrystal = smoothValue(
    state.atmosphereCrystal,
    nextCrystal,
    nextCrystal > state.atmosphereCrystal ? 0.82 : 0.42,
    context.deltaSeconds
  );

  const normalizedTotal =
    atmosphereGas + atmosphereLiquid + atmospherePlasma + atmosphereCrystal;
  if (normalizedTotal > 0.0001) {
    atmosphereGas /= normalizedTotal;
    atmosphereLiquid /= normalizedTotal;
    atmospherePlasma /= normalizedTotal;
    atmosphereCrystal /= normalizedTotal;
  }

  const statePairs: Array<[AtmosphereMatterState, number]> = [
    ['gas', atmosphereGas],
    ['liquid', atmosphereLiquid],
    ['plasma', atmospherePlasma],
    ['crystal', atmosphereCrystal]
  ];
  const [nextState, nextStateWeight] = statePairs.reduce((best, candidate) =>
    candidate[1] > best[1] ? candidate : best
  );
  const currentStateWeight =
    statePairs.find(([matter]) => matter === state.activeMatterState)?.[1] ?? 0;
  const activeMatterState =
    nextState === state.activeMatterState || nextStateWeight >= currentStateWeight + 0.04
      ? nextState
      : state.activeMatterState;

  const nextPressure = THREE.MathUtils.clamp(
    0.06 +
      context.audio.subPressure * 0.22 +
      context.audio.preDropTension * 0.2 +
      context.stageAudioFeatures.impactBuild * 0.16 +
      context.audio.phraseTension * 0.08 +
      context.directors.worldActivity * 0.12 +
      atmosphereLiquid * 0.12 +
      atmosphereCrystal * 0.06 -
      cueRelease * 0.06 -
      cueReset * 0.08,
    0,
    1.1
  );
  const nextIonization = THREE.MathUtils.clamp(
    0.04 +
      atmospherePlasma * 0.28 +
      context.directors.laserDrive * 0.14 +
      context.directors.colorWarp * 0.14 +
      context.audio.beatStrike * 0.08 +
      context.stageAudioFeatures.impactHit * 0.18 +
      cueReveal * 0.08 +
      cueRupture * 0.14,
    0,
    1.2
  );
  const nextResidue = THREE.MathUtils.clamp(
    0.06 +
      atmosphereGas * 0.08 +
      context.audio.releaseTail * 0.18 +
      context.stageAudioFeatures.memoryAfterglow * 0.24 +
      context.audio.resonance * 0.12 +
      cueRelease * 0.08 +
      cueHaunt * 0.1,
    0,
    1.2
  );
  const nextStructureReveal = THREE.MathUtils.clamp(
    0.02 +
      atmosphereCrystal * 0.26 +
      cathedralRise * 0.18 +
      shotWorldTakeover * 0.16 +
      cueReveal * 0.18 +
      context.audio.sectionChange * 0.1 +
      context.stageAudioFeatures.impactSection * 0.08,
    0,
    1.2
  );

  return {
    activeMatterState,
    atmosphereGas,
    atmosphereLiquid,
    atmospherePlasma,
    atmosphereCrystal,
    atmospherePressure: smoothValue(
      state.atmospherePressure,
      nextPressure,
      nextPressure > state.atmospherePressure ? 1.12 : 0.54,
      context.deltaSeconds
    ),
    atmosphereIonization: smoothValue(
      state.atmosphereIonization,
      nextIonization,
      nextIonization > state.atmosphereIonization ? 1.42 : 0.8,
      context.deltaSeconds
    ),
    atmosphereResidue: smoothValue(
      state.atmosphereResidue,
      nextResidue,
      nextResidue > state.atmosphereResidue ? 0.94 : 0.34,
      context.deltaSeconds
    ),
    atmosphereStructureReveal: smoothValue(
      state.atmosphereStructureReveal,
      nextStructureReveal,
      nextStructureReveal > state.atmosphereStructureReveal ? 0.72 : 0.28,
      context.deltaSeconds
    )
  };
}
