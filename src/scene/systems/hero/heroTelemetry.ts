import * as THREE from 'three';
import type { StageHeroAnchorLane } from '../../../types/visual';

export type HeroCoverageContext = {
  camera: THREE.Camera;
  heroGroup: THREE.Group;
  heroGeometry: THREE.BufferGeometry;
  heroScaleCurrent: number;
  heroTelemetryVector: THREE.Vector3;
  heroTelemetryOffsetX: THREE.Vector3;
  heroTelemetryOffsetY: THREE.Vector3;
};

export function estimateHeroCoverage({
  camera,
  heroGroup,
  heroGeometry,
  heroScaleCurrent,
  heroTelemetryVector,
  heroTelemetryOffsetX,
  heroTelemetryOffsetY
}: HeroCoverageContext): number {
  const baseRadius =
    (heroGeometry.boundingSphere?.radius ?? 1.04) * heroScaleCurrent * 1.18;
  const projectedCenter = heroGroup
    .getWorldPosition(heroTelemetryVector)
    .project(camera);
  const projectedX = heroGroup
    .localToWorld(heroTelemetryOffsetX.set(baseRadius, 0, 0))
    .project(camera);
  const projectedY = heroGroup
    .localToWorld(heroTelemetryOffsetY.set(0, baseRadius, 0))
    .project(camera);
  const radiusX = Math.abs(projectedX.x - projectedCenter.x) * 0.5;
  const radiusY = Math.abs(projectedY.y - projectedCenter.y) * 0.5;

  return THREE.MathUtils.clamp(Math.PI * radiusX * radiusY * 1.12, 0, 1);
}

export function measureHeroOffCenterPenalty(input: {
  heroScreenX: number;
  heroScreenY: number;
  laneTargetX: number;
  laneTargetY: number;
  offCenterMax: number;
}): number {
  const deltaX = input.heroScreenX - input.laneTargetX;
  const deltaY = input.heroScreenY - input.laneTargetY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  return THREE.MathUtils.clamp(
    (distance - input.offCenterMax) / Math.max(0.18, 0.62 - input.offCenterMax),
    0,
    1
  );
}

export function measureHeroDepthPenalty(input: {
  heroDepth: number;
  depthMax: number;
}): number {
  return THREE.MathUtils.clamp(
    Math.max(0, input.heroDepth - input.depthMax) / 0.72,
    0,
    1
  );
}

export function resolveHeroAnchorOffsets(
  lane: StageHeroAnchorLane,
  strength: number
): { x: number; y: number } {
  switch (lane) {
    case 'left':
      return { x: -0.44 * strength, y: 0 };
    case 'right':
      return { x: 0.44 * strength, y: 0 };
    case 'high':
      return { x: 0, y: 0.34 * strength };
    case 'low':
      return { x: 0, y: -0.26 * strength };
    default:
      return { x: 0, y: 0 };
  }
}
