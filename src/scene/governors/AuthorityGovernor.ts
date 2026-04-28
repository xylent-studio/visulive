import * as THREE from 'three';
import type { ScenePostTelemetry } from '../runtime';
import type { HeroSystemTelemetry } from '../systems/hero/HeroSystem';
import type { ChamberSystemTelemetry } from '../systems/chamber/ChamberSystem';
import type { WorldSystemTelemetry } from '../systems/world/WorldSystem';
import type { AuthorityFrameSnapshot, StageCuePlan } from '../../types/visual';

export type AuthorityGovernorFrameContext = {
  heroTelemetry: HeroSystemTelemetry;
  chamberTelemetry: ChamberSystemTelemetry;
  worldTelemetry: WorldSystemTelemetry;
  stage: {
    bladeAverage: number;
    sweepAverage: number;
    dominance: StageCuePlan['dominance'];
    compositionSafetyThreshold: number;
    heroCoverageMax: number;
    exposureCeiling: number;
    bloomCeiling: number;
  };
  overbright: number;
};

export class AuthorityGovernor {
  resolveFrame(
    context: AuthorityGovernorFrameContext
  ): AuthorityFrameSnapshot {
    return this.buildSnapshot(context, context.overbright);
  }

  applyPostTelemetry(
    context: AuthorityGovernorFrameContext,
    post: Pick<ScenePostTelemetry, 'exposure' | 'bloomStrength'>
  ): AuthorityFrameSnapshot {
    const baseSnapshot = this.buildSnapshot(context, context.overbright);
    const overbright = THREE.MathUtils.clamp(
      Math.max(0, post.exposure - context.stage.exposureCeiling) * 4.2 +
        Math.max(0, post.bloomStrength - context.stage.bloomCeiling) * 2.6 +
        Math.max(0, baseSnapshot.heroGlowSpend - 1.02) * 0.8 +
        Math.max(0, baseSnapshot.worldGlowSpend - 0.94) * 0.7,
      0,
      1.5
    );

    return this.buildSnapshot(context, overbright);
  }

  private buildSnapshot(
    context: AuthorityGovernorFrameContext,
    overbright: number
  ): AuthorityFrameSnapshot {
    const { heroTelemetry: hero, chamberTelemetry: chamber, worldTelemetry: world } =
      context;
    const worldGlowSpend = THREE.MathUtils.clamp(
      world.worldStainOpacity * 2.2 +
        world.worldFlashOpacity * 1.8 +
        world.atmosphereVeilOpacityAverage * 1.4 +
        world.atmosphereColumnOpacityAverage * 1.6,
      0,
      1.2
    );
    const heroGlowSpend = THREE.MathUtils.clamp(
      hero.heroShellEmissiveIntensity * 0.08 +
        hero.heroCoreEmissiveIntensity * 0.14 +
        hero.heroAuraOpacity * 2.2 +
        hero.heroFresnelIntensity * 1.8 +
        hero.heroEnergyShellOpacity * 3.2 +
        hero.heroSeamOpacity * 2.1 +
        hero.heroMembraneOpacity * 1.4 +
        hero.heroCrownOpacity * 1.2,
      0,
      1.2
    );
    const shellGlowSpend = THREE.MathUtils.clamp(
      hero.heroEdgesOpacity * 2.2 +
        hero.heroSeamOpacity * 1.2 +
        chamber.frontRingOpacity * 6 +
        chamber.frontPortalOpacity * 6 +
        chamber.frontHaloOpacity * 6,
      0,
      1.2
    );
    const midlineBias = THREE.MathUtils.clamp(
      1 - Math.abs(hero.heroScreenY - 0.5) * 2.4,
      0,
      1
    );
    const ringAuthority = THREE.MathUtils.clamp(
      chamber.chamberRingOpacityAverage * 8 +
        chamber.portalRingOpacityAverage * 6 +
        chamber.chromaHaloOpacityAverage * 5,
      0,
      1.5
    );
    const ringBeltPersistence = THREE.MathUtils.clamp(
      chamber.portalRingOpacityAverage * 4.8 +
        chamber.chromaHaloOpacityAverage * 1.8 +
        chamber.chamberRingOpacityAverage * 1.3 +
        midlineBias * 0.08,
      0,
      1
    );
    const wirefieldDensityScore = THREE.MathUtils.clamp(
      chamber.ghostLatticeOpacityAverage * 14 +
        hero.heroSeamOpacity * 2.4 +
        hero.heroEdgesOpacity * 2.6 +
        hero.ghostHeroOpacity * 1.8,
      0,
      1
    );
    const heroAuraDominance =
      hero.heroAuraOpacity * 1.8 + hero.heroEnergyShellOpacity * 2.2;
    const slabLock =
      chamber.portalRingOpacityAverage * 1.8 +
      chamber.chamberRingOpacityAverage * 1.3 +
      Math.max(0, ringBeltPersistence - 0.28) * 0.8;
    const chamberPresenceScore = THREE.MathUtils.clamp(
      ringAuthority * 0.18 +
        worldGlowSpend * 0.16 +
        world.atmosphereColumnOpacityAverage * 2.8 +
        context.stage.bladeAverage * 2.1 +
        context.stage.sweepAverage * 1.8 +
        chamber.chromaHaloOpacityAverage * 1.2 +
        chamber.ghostLatticeOpacityAverage * 1.4 +
        chamber.laserBeamOpacityAverage * 1.4 +
        chamber.chamberRingOpacityAverage * 0.9 +
        chamber.portalRingOpacityAverage * 0.7 -
        slabLock * 0.16 -
        heroAuraDominance * 0.18 -
        hero.heroCoverageEstimate * 0.18,
      0,
      1
    );
    const dominanceTarget =
      context.stage.dominance === 'world'
        ? 0.74
        : context.stage.dominance === 'chamber'
          ? 0.62
          : context.stage.dominance === 'hybrid'
            ? 0.48
            : 0.34;
    const worldDominanceDelivered = THREE.MathUtils.clamp(
      chamberPresenceScore * 0.56 +
        worldGlowSpend * 0.24 +
        world.atmosphereColumnOpacityAverage * 1.8 +
        world.atmosphereVeilOpacityAverage * 1.1 +
        chamber.chamberRingOpacityAverage * 0.6 +
        chamber.portalRingOpacityAverage * 0.4 +
        dominanceTarget * 0.16 -
        chamber.laserBeamOpacityAverage * 0.3 -
        ringBeltPersistence * 0.18 -
        heroAuraDominance * 0.16 -
        hero.heroCoverageEstimate * 0.34 -
        hero.heroDepthPenalty * 0.12 +
        hero.heroOffCenterPenalty * 0.04,
      0,
      1
    );
    const frameHierarchyScore = THREE.MathUtils.clamp(
      0.78 +
        worldDominanceDelivered * 0.18 +
        (1 - hero.heroCoverageEstimate) * 0.08 -
        hero.heroOffCenterPenalty * 0.22 -
        hero.heroDepthPenalty * 0.16 -
        ringBeltPersistence * 0.18 -
        wirefieldDensityScore * 0.2 -
        overbright * 0.24,
      0,
      1
    );
    const coverageOverflow = Math.max(
      0,
      hero.heroCoverageEstimate - context.stage.heroCoverageMax
    );
    const dominancePenalty =
      context.stage.dominance === 'world' ||
      context.stage.dominance === 'chamber'
        ? Math.max(0, 0.56 - worldDominanceDelivered)
        : 0;
    const compositionSafetyScore = THREE.MathUtils.clamp(
      1 -
        (coverageOverflow * 1.34 +
          hero.heroOffCenterPenalty * 0.28 +
          hero.heroDepthPenalty * 0.22 +
          ringBeltPersistence * 0.18 +
          wirefieldDensityScore * 0.16 +
          overbright * 0.18 +
          dominancePenalty * 0.22) +
        frameHierarchyScore * 0.14,
      0,
      1
    );

    return {
      worldGlowSpend,
      heroGlowSpend,
      shellGlowSpend,
      ringAuthority,
      ringBeltPersistence,
      wirefieldDensityScore,
      chamberPresenceScore,
      worldDominanceDelivered,
      frameHierarchyScore,
      compositionSafetyScore,
      compositionSafetyFlag:
        compositionSafetyScore < context.stage.compositionSafetyThreshold ||
        coverageOverflow > 0.06,
      overbright
    };
  }
}
