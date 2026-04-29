import type { Camera, Scene } from 'three';
import type { ListeningFrame } from '../types/audio';
import type { QualityTier } from '../types/rendering';
import type { RuntimeTuning } from '../types/tuning';
import type {
  SignatureMomentDevOverride,
  VisualTelemetryFrame
} from '../types/visual';

export type SceneQualityProfile = {
  tier: QualityTier;
  particleDrawCount: number;
  particleOpacityMultiplier: number;
  auraOpacityMultiplier: number;
};

export type ScenePostTelemetry = {
  qualityTier: QualityTier;
  exposure: number;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  afterImageDamp?: number;
};

export interface VisualizerSceneRuntime {
  readonly scene: Scene;
  readonly camera: Camera;
  resize(width: number, height: number): void;
  setQualityProfile(profile: SceneQualityProfile): void;
  setTuning(tuning: RuntimeTuning): void;
  setPointerInfluence(x: number, y: number): void;
  update(
    frame: ListeningFrame,
    elapsedSeconds: number,
    deltaSeconds: number
  ): void;
  getVisualTelemetry(): VisualTelemetryFrame;
  setSignatureMomentDevOverride(override: SignatureMomentDevOverride | null): void;
  setPostTelemetry(input: ScenePostTelemetry): void;
  dispose(): void;
}

export type VisualizerSceneFactory = (
  profile: SceneQualityProfile
) => VisualizerSceneRuntime;
