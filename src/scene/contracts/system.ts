import type { ListeningFrame } from '../../types/audio';
import type { RuntimeTuning } from '../../types/tuning';
import type {
  CueClass,
  HeroAuthorityState,
  PerformanceRegime,
  PhraseConfidence,
  PostSpendIntent,
  SectionIntent,
  StageIntent,
  WorldAuthorityState
} from '../../types/visual';
import type { SceneQualityProfile } from '../runtime';

export type AudioConductorContext = {
  frame: ListeningFrame;
  tuning: RuntimeTuning;
  phraseConfidence: PhraseConfidence;
  sectionIntent: SectionIntent;
  performanceRegime: PerformanceRegime;
};

export type ShowDirectionContext = {
  canonicalCueClass: CueClass;
  stageIntent: StageIntent;
  worldAuthorityState: WorldAuthorityState;
  heroAuthorityState: HeroAuthorityState;
  postSpendIntent: PostSpendIntent;
};

export type StageIntentContext = AudioConductorContext & ShowDirectionContext;

export type FrameUpdateContext = {
  elapsedSeconds: number;
  deltaSeconds: number;
  stage: StageIntentContext;
};

export type PostDecisionContext = {
  postSpendIntent: PostSpendIntent;
  qualityProfile: SceneQualityProfile;
};

export type TelemetryInputContext = {
  elapsedSeconds: number;
  stage: StageIntentContext;
};

export interface FlagshipSystem<
  TUpdateContext = FrameUpdateContext,
  TTelemetry = unknown
> {
  build(): void;
  update(context: TUpdateContext): void;
  applyQualityProfile(profile: SceneQualityProfile): void;
  collectTelemetryInputs?(context: TelemetryInputContext): TTelemetry;
  dispose(): void;
}
