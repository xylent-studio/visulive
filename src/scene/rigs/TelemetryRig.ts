import type { VisualAssetLayerActivity } from '../../types/visual';

export type AssetLayerTelemetryInput = {
  worldSphereLuminance: number;
  worldStainOpacity: number;
  worldFlashOpacity: number;
  fogDensity: number;
  heroShellEmissiveIntensity: number;
  heroAuraOpacity: number;
  heroFresnelIntensity: number;
  heroEnergyShellOpacity: number;
  heroSeamOpacity: number;
  ghostHeroOpacity: number;
  heroCoreEmissiveIntensity: number;
  heroEdgesOpacity: number;
  heroMembraneOpacity: number;
  heroCrownOpacity: number;
  twinEmissiveMean: number;
  chamberRingOpacity: number;
  portalRingOpacity: number;
  chromaHaloOpacity: number;
  ghostLatticeOpacity: number;
  laserBeamOpacity: number;
  stageBladeOpacity: number;
  stageSweepOpacity: number;
  satelliteActivity: number;
  pressureWaveOpacity: number;
  particleOpacity: number;
  ambientLightIntensity: number;
  fillLightIntensity: number;
  warmLightIntensity: number;
  coolLightIntensity: number;
  afterImageDamp: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeToCap(value: number, authoredCap: number, emphasis = 1): number {
  if (!Number.isFinite(value) || authoredCap <= 0) {
    return 0;
  }

  return clamp01((value / authoredCap) * emphasis);
}

export class TelemetryRig {
  buildAssetLayerActivity(
    input: AssetLayerTelemetryInput
  ): VisualAssetLayerActivity {
    return {
      worldSphere: normalizeToCap(input.worldSphereLuminance, 0.56, 1.05),
      worldStain: normalizeToCap(input.worldStainOpacity, 0.32),
      worldFlash: normalizeToCap(input.worldFlashOpacity, 0.28),
      fog: normalizeToCap(input.fogDensity, 0.14),
      heroShell: normalizeToCap(input.heroShellEmissiveIntensity, 9.5, 0.92),
      heroAura: normalizeToCap(input.heroAuraOpacity, 0.12),
      heroFresnel: normalizeToCap(input.heroFresnelIntensity, 0.72, 0.96),
      heroEnergyShell: normalizeToCap(input.heroEnergyShellOpacity, 0.1),
      heroSeam: normalizeToCap(input.heroSeamOpacity, 0.08),
      ghostHero: normalizeToCap(input.ghostHeroOpacity, 0.1),
      heroCore: normalizeToCap(input.heroCoreEmissiveIntensity, 5.8, 0.94),
      heroEdges: normalizeToCap(input.heroEdgesOpacity, 0.08),
      heroMembrane: normalizeToCap(input.heroMembraneOpacity, 0.08),
      heroCrown: normalizeToCap(input.heroCrownOpacity, 0.09),
      heroTwins: normalizeToCap(input.twinEmissiveMean, 6.8, 0.92),
      chamberRings: normalizeToCap(input.chamberRingOpacity, 0.2),
      portalRings: normalizeToCap(input.portalRingOpacity, 0.18),
      chromaHalos: normalizeToCap(input.chromaHaloOpacity, 0.18),
      ghostLattice: normalizeToCap(input.ghostLatticeOpacity, 0.08),
      laserBeams: normalizeToCap(input.laserBeamOpacity, 0.18),
      stageBlades: normalizeToCap(input.stageBladeOpacity, 0.2),
      stageSweeps: normalizeToCap(input.stageSweepOpacity, 0.2),
      satellites: normalizeToCap(input.satelliteActivity, 0.72, 1.08),
      pressureWaves: normalizeToCap(input.pressureWaveOpacity, 0.22),
      particles: normalizeToCap(input.particleOpacity, 0.18),
      ambientLight: normalizeToCap(input.ambientLightIntensity, 0.42),
      fillLight: normalizeToCap(input.fillLightIntensity, 0.48),
      warmLight: normalizeToCap(input.warmLightIntensity, 0.56),
      coolLight: normalizeToCap(input.coolLightIntensity, 0.68),
      afterImage: normalizeToCap(1 - input.afterImageDamp, 0.24)
    };
  }
}
