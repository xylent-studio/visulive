import { FlagshipShowRuntime } from './runtime/FlagshipShowRuntime';
import type {
  SceneQualityProfile,
  VisualizerSceneFactory
} from './runtime';

export const createSceneRuntime: VisualizerSceneFactory = (
  profile: SceneQualityProfile
) => new FlagshipShowRuntime(profile);
