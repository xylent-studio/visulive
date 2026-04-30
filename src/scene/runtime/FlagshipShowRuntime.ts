import { ObsidianBloomScene } from '../ObsidianBloomScene';
import type {
  ScenePostTelemetry,
  SceneQualityProfile,
  VisualizerSceneRuntime
} from '../runtime';
import { StageRuntimeRig } from '../rigs/StageRuntimeRig';
import type { ListeningFrame } from '../../types/audio';
import type { RuntimeTuning } from '../../types/tuning';
import type {
  SignatureMomentDevOverride,
  VisualTelemetryFrame
} from '../../types/visual';

export class FlagshipShowRuntime implements VisualizerSceneRuntime {
  private readonly sceneRuntime: ObsidianBloomScene;
  private readonly stageRuntimeRig: StageRuntimeRig;

  constructor(profile: SceneQualityProfile) {
    this.sceneRuntime = new ObsidianBloomScene(profile);
    this.stageRuntimeRig = new StageRuntimeRig({
      eventRig: this.sceneRuntime.getEventRig(),
      framingRig: this.sceneRuntime.getFramingRig(),
      bindings: {
        applyResolvedStage: (plan, fallbackState) => {
          this.sceneRuntime.applyResolvedStageComposition(plan, fallbackState);
        },
        updateLocomotion: (context) => {
          this.sceneRuntime.updateLocomotion(context);
        },
        updateStageFrame: (context) => {
          this.sceneRuntime.updateStageFrame(context);
        },
        updateLighting: (context) => {
          this.sceneRuntime.updateLighting(context);
        }
      }
    });
  }

  get scene() {
    return this.sceneRuntime.scene;
  }

  get camera() {
    return this.sceneRuntime.camera;
  }

  resize(width: number, height: number): void {
    this.sceneRuntime.resize(width, height);
  }

  setQualityProfile(profile: SceneQualityProfile): void {
    this.sceneRuntime.setQualityProfile(profile);
  }

  setTuning(tuning: RuntimeTuning): void {
    this.sceneRuntime.setTuning(tuning);
  }

  setPointerInfluence(x: number, y: number): void {
    this.sceneRuntime.setPointerInfluence(x, y);
  }

  resetForShowStart(): void {
    this.sceneRuntime.resetForShowStart();
  }

  update(
    frame: ListeningFrame,
    elapsedSeconds: number,
    deltaSeconds: number
  ): void {
    const preparedFrame = this.sceneRuntime.prepareFrame(
      frame,
      elapsedSeconds,
      deltaSeconds
    );
    const stageIdleContext = this.stageRuntimeRig.prepareStage({
      frame,
      elapsedSeconds,
      deltaSeconds,
      ...preparedFrame
    });

    this.sceneRuntime.resolveSignatureMoment(elapsedSeconds, deltaSeconds);
    this.sceneRuntime.updateWorldSystem(elapsedSeconds, preparedFrame.idleBreath);
    this.sceneRuntime.updateChamberSystem(
      elapsedSeconds,
      preparedFrame.idleBreath
    );
    this.sceneRuntime.updateHeroSystem(stageIdleContext);
    this.sceneRuntime.resolveAuthorityFrame();
    this.stageRuntimeRig.runStageFrame(stageIdleContext, preparedFrame.beatDrive);
    this.sceneRuntime.updatePostSystem(elapsedSeconds, deltaSeconds);
    this.sceneRuntime.updatePlayableMotifSystem(elapsedSeconds, deltaSeconds);
    this.sceneRuntime.updateCompositorSystem(elapsedSeconds, deltaSeconds);
    this.sceneRuntime.finalizeFrame();
  }

  getVisualTelemetry(): VisualTelemetryFrame {
    return this.sceneRuntime.getVisualTelemetry();
  }

  setPostTelemetry(input: ScenePostTelemetry): void {
    this.sceneRuntime.setPostTelemetry(input);
  }

  setSignatureMomentDevOverride(override: SignatureMomentDevOverride | null): void {
    this.sceneRuntime.setSignatureMomentDevOverride(override);
  }

  dispose(): void {
    this.sceneRuntime.dispose();
  }
}
