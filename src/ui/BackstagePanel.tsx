import { useState } from 'react';
import type {
  AudioDiagnostics,
  AudioEngineStatus,
  ListeningMode,
  SourceDescriptor
} from '../types/audio';
import type { RendererDiagnostics } from '../engine/VisualizerEngine';
import type {
  ReplayProofReadiness,
  ReplayArtifactIntegrity,
  ReplayProofMissionEligibility,
  ReplayProofMissionKind,
  ReplayProofMissionSnapshot,
  ReplayProofRunState,
  ReplayProofValidity,
  ReplayRunLifecycleState
} from '../replay/types';
import type {
  SignatureMomentKind,
  SignatureMomentPreviewProfile,
  SignatureMomentStyle
} from '../types/visual';
import {
  PROOF_MISSION_PROFILES,
  getReplayProofMissionProfile
} from '../replay/proofMission';
import { getSceneVisualProfile } from '../scene/assets/visualAssetProfiles';
import { BUILD_INFO, BUILD_LABEL } from '../buildInfo';
import {
  LOOK_DEFINITIONS,
  SHOW_START_ROUTE_DEFINITIONS,
  SHOW_WORLD_DEFINITIONS,
  resolveDirectorOptionAudit,
  type AdvancedCurationState,
  type AdvancedSteeringKey,
  type AdvancedSteeringState,
  type AutoRouteRecommendation,
  type DirectorStanceId,
  type LookId,
  type LookPoolId,
  type ResolvedRouteId,
  type SavedStance,
  type ShowCapabilityMode,
  type ShowStartRoute,
  type ShowWorldId,
  type WorldPoolId
} from '../types/director';

type ReplayStatusSummary = {
  mode: string;
  currentTimeMs: number;
  durationMs: number;
};

type RecordingSummary = {
  active: boolean;
  frameCount: number;
  durationMs: number;
};

type AutoCaptureStatus = {
  enabled: boolean;
  autoDownload: boolean;
  pending: boolean;
  pendingLabel: string | null;
  captureCount: number;
  latestLabel: string | null;
  latestTriggerLabel: string | null;
  latestDurationMs: number;
  latestTriggerReason: string | null;
  latestProofStillCount: number;
  proofStillsEnabled: boolean;
};

type CaptureFolderStatus = {
  supported: boolean;
  autoSave: boolean;
  folderName: string | null;
  ready: boolean;
  error: string | null;
  lastSavedLabel: string | null;
};

type RunJournalStatus = {
  active: boolean;
  proofWaveArmed: boolean;
  runId: string | null;
  proofMission: ReplayProofMissionSnapshot | null;
  proofRunState: ReplayProofRunState;
  sampleCount: number;
  markerCount: number;
  clipCount: number;
  checkpointStillCount: number;
  lastPersistedAt: string | null;
  buildIdentityValid: boolean;
  scenarioAssessment: {
    declaredScenario: string | null;
    derivedScenario: string | null;
    confidence: number;
    mismatchReasons: string[];
    validated: boolean;
  } | null;
  readiness: ReplayProofReadiness | null;
  proofValidity: ReplayProofValidity | null;
  proofMissionEligibility: ReplayProofMissionEligibility | null;
  artifactIntegrity: ReplayArtifactIntegrity | null;
  suppressedInterventionCount: number;
  lifecycleState: ReplayRunLifecycleState;
};

type MomentLabKind = Exclude<SignatureMomentKind, 'none'>;

type MomentLabState = {
  available: boolean;
  active: boolean;
  autoCycleActive: boolean;
  disabledReason: string | null;
  kind: MomentLabKind;
  style: SignatureMomentStyle;
  syntheticProfile: SignatureMomentPreviewProfile;
  durationSeconds: number;
  latestReceipt: string | null;
};

type BackstagePanelProps = {
  open: boolean;
  activeAdvancedTab: 'style' | 'steer' | 'backstage';
  capabilityMode: ShowCapabilityMode;
  showStartRoute: ShowStartRoute;
  routeId: ResolvedRouteId;
  routeRecommendation: AutoRouteRecommendation | null;
  curation: AdvancedCurationState;
  steering: AdvancedSteeringState;
  worldId: ShowWorldId;
  effectiveWorldId: ShowWorldId;
  lookId: LookId;
  effectiveLookId: LookId;
  stanceId: DirectorStanceId;
  sourceMode: ListeningMode;
  status: AudioEngineStatus;
  audio: AudioDiagnostics;
  renderer: RendererDiagnostics;
  audioInputs: SourceDescriptor[];
  selectedInputId: string | null;
  activeInputLabel: string;
  isFullscreen: boolean;
  replay: ReplayStatusSummary;
  recording: RecordingSummary;
  autoCaptureStatus: AutoCaptureStatus;
  captureFolder: CaptureFolderStatus;
  proofWaveArmed: boolean;
  proofMissionKind: ReplayProofMissionKind;
  runJournalStatus: RunJournalStatus;
  momentLab: MomentLabState;
  momentLabKinds: MomentLabKind[];
  momentLabStyles: SignatureMomentStyle[];
  momentLabProfiles: SignatureMomentPreviewProfile[];
  replayError: string | null;
  diagnosticsVisible: boolean;
  savedStances: SavedStance[];
  onClose: () => void;
  onAdvancedTabChange: (tab: 'style' | 'steer' | 'backstage') => void;
  onShowStartRouteChange: (route: ShowStartRoute) => void;
  onApplyRouteRecommendation: () => void;
  onWorldPoolChange: (poolId: WorldPoolId) => void;
  onWorldChange: (worldId: ShowWorldId | null) => void;
  onLookPoolChange: (poolId: LookPoolId) => void;
  onLookChange: (lookId: LookId | null) => void;
  onStanceChange: (stanceId: DirectorStanceId | null) => void;
  onBiasChange: (key: AdvancedSteeringKey, value: number) => void;
  onSaveCurrentStance: (name: string) => void;
  onLoadSavedStance: (stanceId: string) => void;
  onDeleteSavedStance: (stanceId: string) => void;
  onResetAdvanced: () => void;
  onResetSteering: () => void;
  onApplyCurrentDriftAnchors: () => void;
  onInputDeviceChange: (deviceId: string) => void;
  onRecalibrate: () => void;
  onToggleFullscreen: () => void;
  onToggleDiagnostics: () => void;
  onChooseCaptureFolder: () => void;
  onArmProofWave: () => void;
  onFinishProofRun: () => void;
  onOverrideProofToExploratory: () => void;
  onProofMissionChange: (kind: ReplayProofMissionKind) => void;
  onMomentLabKindChange: (kind: MomentLabKind) => void;
  onMomentLabStyleChange: (style: SignatureMomentStyle) => void;
  onMomentLabProfileChange: (profile: SignatureMomentPreviewProfile) => void;
  onMomentLabDurationChange: (durationSeconds: number) => void;
  onMomentLabPreview: () => void;
  onMomentLabAutoCycle: () => void;
  onForgetCaptureFolder: () => void;
  onToggleAutoCapture: () => void;
  onToggleAutoDownload: () => void;
  onToggleProofStills: () => void;
  onToggleAutoSaveToFolder: () => void;
  onStartCapture: () => void;
  onStopCapture: () => void;
  onLoadReplay: () => void;
  onToggleReplayPlayback: () => void;
  onStopReplay: () => void;
  onClearReplay: () => void;
};

const PROOF_MISSION_OPTIONS = Object.values(PROOF_MISSION_PROFILES);

export function BackstagePanel({
  open,
  activeAdvancedTab,
  capabilityMode,
  showStartRoute,
  routeId,
  routeRecommendation,
  curation,
  steering,
  worldId,
  effectiveWorldId,
  lookId,
  effectiveLookId,
  stanceId,
  sourceMode,
  status,
  audio,
  renderer,
  audioInputs,
  selectedInputId,
  activeInputLabel,
  isFullscreen,
  replay,
  recording,
  autoCaptureStatus,
  captureFolder,
  proofWaveArmed,
  proofMissionKind,
  runJournalStatus,
  momentLab,
  momentLabKinds,
  momentLabStyles,
  momentLabProfiles,
  replayError,
  diagnosticsVisible,
  savedStances,
  onClose,
  onAdvancedTabChange,
  onShowStartRouteChange,
  onApplyRouteRecommendation,
  onWorldPoolChange,
  onWorldChange,
  onLookPoolChange,
  onLookChange,
  onStanceChange,
  onBiasChange,
  onSaveCurrentStance,
  onLoadSavedStance,
  onDeleteSavedStance,
  onResetAdvanced,
  onResetSteering,
  onApplyCurrentDriftAnchors,
  onInputDeviceChange,
  onRecalibrate,
  onToggleFullscreen,
  onToggleDiagnostics,
  onChooseCaptureFolder,
  onArmProofWave,
  onFinishProofRun,
  onOverrideProofToExploratory,
  onProofMissionChange,
  onMomentLabKindChange,
  onMomentLabStyleChange,
  onMomentLabProfileChange,
  onMomentLabDurationChange,
  onMomentLabPreview,
  onMomentLabAutoCycle,
  onForgetCaptureFolder,
  onToggleAutoCapture,
  onToggleAutoDownload,
  onToggleProofStills,
  onToggleAutoSaveToFolder,
  onStartCapture,
  onStopCapture,
  onLoadReplay,
  onToggleReplayPlayback,
  onStopReplay,
  onClearReplay
}: BackstagePanelProps) {
  const [backstageTab, setBackstageTab] = useState<
    'input' | 'capture' | 'replay' | 'system'
  >('input');

  if (!open) {
    return null;
  }

  const directorOptionAudit = resolveDirectorOptionAudit(curation, steering);
  const selectedProofMission = getReplayProofMissionProfile(proofMissionKind);
  const activeProofMission =
    runJournalStatus.proofMission ?? selectedProofMission;
  const visual = renderer.visualTelemetry;
  const activeScene = visual.activePlayableMotifScene ?? 'none';
  const sceneProfile = getSceneVisualProfile(activeScene);
  const activeSignatureMoment =
    visual.activeSignatureMoment && visual.activeSignatureMoment !== 'none'
      ? visual.activeSignatureMoment
      : 'none';
  const directorWhy =
    activeSignatureMoment !== 'none'
      ? `Signature moment ${activeSignatureMoment} is driving a ${visual.signatureMomentPhase ?? 'live'} ${visual.signatureMomentStyle ?? 'contrast-mythic'} frame.`
      : visual.playableMotifSceneTransitionReason &&
          visual.playableMotifSceneTransitionReason !== 'hold'
        ? `Playable scene changed because ${visual.playableMotifSceneTransitionReason}.`
        : visual.paletteBaseHoldReason
          ? `The director is holding ${visual.paletteBaseState ?? visual.paletteState} because ${visual.paletteBaseHoldReason}.`
          : directorOptionAudit.headline;
  const currentRouteLabel =
    routeId === 'the-room'
      ? SHOW_START_ROUTE_DEFINITIONS.microphone.label
      : routeId === 'hybrid'
        ? SHOW_START_ROUTE_DEFINITIONS.combo.label
        : routeId === 'demo'
          ? 'Demo'
          : SHOW_START_ROUTE_DEFINITIONS['pc-audio'].label;

  return (
    <aside className="backstage-panel backstage-panel--advanced">
      <div className="backstage-panel__header">
        <div>
          <span className="backstage-panel__eyebrow">Advanced</span>
          <strong>
            {capabilityMode === 'full-autonomous'
              ? 'Full autonomous show'
              : 'Curated show'}
          </strong>
        </div>
        <button
          className="backstage-panel__close"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>

      <div className="backstage-panel__summary">
        <div>
          <span>active route</span>
          <strong>{currentRouteLabel}</strong>
        </div>
        <div>
          <span>current drift</span>
          <strong>
            {SHOW_WORLD_DEFINITIONS[effectiveWorldId].label} /{' '}
            {LOOK_DEFINITIONS[effectiveLookId].label}
          </strong>
        </div>
        <div>
          <span>renderer</span>
          <strong>{renderer.backend}</strong>
        </div>
      </div>

      <div className="backstage-panel__tabs">
        {(['style', 'backstage'] as const).map((tab) => (
          <button
            className={`backstage-tab ${activeAdvancedTab === tab ? 'backstage-tab--active' : ''}`}
            key={tab}
            onClick={() => {
              onAdvancedTabChange(tab);
            }}
            type="button"
          >
            {tab === 'style' ? 'director' : tab}
          </button>
        ))}
      </div>

      {activeAdvancedTab !== 'backstage' ? (
        <div className="backstage-panel__body">
          <section className="backstage-section">
            <div className="backstage-section__title">Autonomous Director Console</div>
            <div className="backstage-note">
              <strong>{directorWhy}</strong> This surface is read-only during
              normal operation. Worlds, looks, pools, stances, and steering now
              exist as internal repertoire for the autonomous director, not as
              user tuning controls.
            </div>
          </section>

          <section
            className={`backstage-section backstage-director-audit backstage-director-audit--${directorOptionAudit.tone}`}
          >
            <div className="backstage-section__title">Director Autonomy</div>
            <div className="backstage-note">
              <strong>{directorOptionAudit.headline}</strong> |{' '}
              {directorOptionAudit.detail} Serious proof starts from full
              autonomous defaults.
            </div>
            <div className="backstage-meta-grid">
              <div>
                <span>autonomy</span>
                <strong>{Math.round(directorOptionAudit.autonomyScore * 100)}%</strong>
              </div>
              <div>
                <span>scene families</span>
                <strong>{directorOptionAudit.expectedSceneCount}</strong>
              </div>
              <div>
                <span>mode</span>
                <strong>{capabilityMode}</strong>
              </div>
              <div>
                <span>proof lock</span>
                <strong>{proofWaveArmed ? 'armed' : 'open'}</strong>
              </div>
            </div>
            <ul className="backstage-audit-list">
              {directorOptionAudit.notes.slice(0, 4).map((note) => (
                <li
                  className={`backstage-audit-list__item backstage-audit-list__item--${note.tone}`}
                  key={`${note.title}:${note.body}`}
                >
                  <strong>{note.title}</strong>
                  <span>{note.body}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Current Image Class</div>
            <div className="backstage-meta-grid">
              <div>
                <span>scene</span>
                <strong>{activeScene}</strong>
              </div>
              <div>
                <span>image class</span>
                <strong>{sceneProfile?.imageClass ?? 'n/a'}</strong>
              </div>
              <div>
                <span>frame owner</span>
                <strong>{sceneProfile?.frameOwner ?? 'n/a'}</strong>
              </div>
              <div>
                <span>composition</span>
                <strong>{sceneProfile?.compositionClass ?? 'n/a'}</strong>
              </div>
              <div>
                <span>lighting</span>
                <strong>{sceneProfile?.lightingClass ?? 'n/a'}</strong>
              </div>
              <div>
                <span>material</span>
                <strong>{sceneProfile?.materialClass ?? 'n/a'}</strong>
              </div>
              <div>
                <span>surface</span>
                <strong>{visual.playableMotifSceneSurfaceRole ?? sceneProfile?.surfaceRole ?? 'n/a'}</strong>
              </div>
              <div>
                <span>silhouette</span>
                <strong>{visual.playableMotifSceneSilhouetteFamily ?? sceneProfile?.silhouetteFamily ?? 'n/a'}</strong>
              </div>
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Semantic Frame</div>
            <div className="backstage-meta-grid">
              <div>
                <span>motif</span>
                <strong>{visual.visualMotif ?? 'n/a'}</strong>
              </div>
              <div>
                <span>palette chapter</span>
                <strong>{visual.paletteBaseState ?? visual.paletteState}</strong>
              </div>
              <div>
                <span>palette reason</span>
                <strong>{visual.paletteBaseHoldReason ?? 'n/a'}</strong>
              </div>
              <div>
                <span>ring posture</span>
                <strong>{visual.ringPosture ?? 'n/a'}</strong>
              </div>
              <div>
                <span>hero role</span>
                <strong>{visual.heroRole ?? 'n/a'}</strong>
              </div>
              <div>
                <span>hero form</span>
                <strong>{visual.activeHeroForm ?? visual.plannedHeroForm ?? 'n/a'}</strong>
              </div>
              <div>
                <span>pending form</span>
                <strong>{visual.pendingHeroForm ?? 'n/a'}</strong>
              </div>
              <div>
                <span>form reason</span>
                <strong>{visual.heroFormReason ?? 'n/a'}</strong>
              </div>
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Playable Scene State</div>
            <div className="backstage-meta-grid">
              <div>
                <span>age</span>
                <strong>
                  {typeof visual.playableMotifSceneAgeSeconds === 'number'
                    ? `${visual.playableMotifSceneAgeSeconds.toFixed(1)}s`
                    : 'n/a'}
                </strong>
              </div>
              <div>
                <span>transition</span>
                <strong>{visual.playableMotifSceneTransitionReason ?? 'n/a'}</strong>
              </div>
              <div>
                <span>driver</span>
                <strong>{visual.playableMotifSceneDriver ?? 'n/a'}</strong>
              </div>
              <div>
                <span>intent match</span>
                <strong>{visual.playableMotifSceneIntentMatch === false ? 'no' : 'yes'}</strong>
              </div>
              <div>
                <span>motif match</span>
                <strong>{visual.playableMotifSceneMotifMatch === false ? 'no' : 'yes'}</strong>
              </div>
              <div>
                <span>palette match</span>
                <strong>{visual.playableMotifScenePaletteMatch === false ? 'no' : 'yes'}</strong>
              </div>
              <div>
                <span>mask</span>
                <strong>{visual.compositorMaskFamily ?? sceneProfile?.compositorMask ?? 'n/a'}</strong>
              </div>
              <div>
                <span>particle job</span>
                <strong>{visual.particleFieldJob ?? sceneProfile?.particleJob ?? 'n/a'}</strong>
              </div>
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Signature Moment</div>
            <div className="backstage-meta-grid">
              <div>
                <span>moment</span>
                <strong>{activeSignatureMoment}</strong>
              </div>
              <div>
                <span>phase</span>
                <strong>{visual.signatureMomentPhase ?? 'idle'}</strong>
              </div>
              <div>
                <span>style</span>
                <strong>{visual.signatureMomentStyle ?? 'n/a'}</strong>
              </div>
              <div>
                <span>intensity</span>
                <strong>
                  {typeof visual.signatureMomentIntensity === 'number'
                    ? visual.signatureMomentIntensity.toFixed(2)
                    : 'n/a'}
                </strong>
              </div>
              <div>
                <span>precharge</span>
                <strong>
                  {typeof visual.signatureMomentPrechargeProgress === 'number'
                    ? `${Math.round(visual.signatureMomentPrechargeProgress * 100)}%`
                    : 'n/a'}
                </strong>
              </div>
              <div>
                <span>forced preview</span>
                <strong>{visual.signatureMomentForcedPreview ? 'yes' : 'no'}</strong>
              </div>
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Internal Repertoire</div>
            <div className="backstage-note">
              The former Style and Steer controls are now autonomous repertoire.
              The director can still use the same worlds, looks, pools, stances,
              and bias grammar internally, but normal operators cannot lock or
              tune them from this surface.
            </div>
            <div className="backstage-meta-grid">
              <div>
                <span>world library</span>
                <strong>{Object.keys(SHOW_WORLD_DEFINITIONS).length}</strong>
              </div>
              <div>
                <span>look library</span>
                <strong>{Object.keys(LOOK_DEFINITIONS).length}</strong>
              </div>
              <div>
                <span>scene ontology</span>
                <strong>{directorOptionAudit.expectedSceneIntents.join(', ')}</strong>
              </div>
              <div>
                <span>saved stances</span>
                <strong>{savedStances.length}</strong>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeAdvancedTab === 'backstage' ? (
        <>
          <div className="backstage-panel__tabs backstage-panel__tabs--nested">
            {(['input', 'capture', 'replay', 'system'] as const).map((tab) => (
              <button
                className={`backstage-tab ${backstageTab === tab ? 'backstage-tab--active' : ''}`}
                key={tab}
                onClick={() => {
                  setBackstageTab(tab);
                }}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {backstageTab === 'input' ? (
            <div className="backstage-panel__body">
              <section className="backstage-section">
                <div className="backstage-section__title">Source Route</div>
                <div className="backstage-chip-grid">
                  {(Object.keys(SHOW_START_ROUTE_DEFINITIONS) as ShowStartRoute[]).map(
                    (route) => (
                      <button
                        className={`backstage-chip ${showStartRoute === route ? 'backstage-chip--active' : ''}`}
                        key={route}
                        onClick={() => {
                          onShowStartRouteChange(route);
                        }}
                        type="button"
                      >
                        {SHOW_START_ROUTE_DEFINITIONS[route].label}
                      </button>
                    )
                  )}
                </div>
              </section>

              {routeRecommendation ? (
                <section className="backstage-section">
                  <div className="backstage-section__title">Route Recommendation</div>
                  <div className="backstage-note">
                    <strong>{routeRecommendation.headline}</strong> |{' '}
                    {routeRecommendation.detail}
                  </div>
                  <div className="backstage-actions">
                    <button
                      className="backstage-action"
                      onClick={onApplyRouteRecommendation}
                      type="button"
                    >
                      Use Recommendation
                    </button>
                  </div>
                </section>
              ) : null}

              {sourceMode !== 'system-audio' ? (
                <label className="backstage-field">
                  <span>Microphone</span>
                  <select
                    className="backstage-select"
                    onChange={(event) => {
                      onInputDeviceChange(event.target.value);
                    }}
                    value={selectedInputId ?? ''}
                  >
                    <option value="">Default microphone</option>
                    {audioInputs.map((input) => (
                      <option
                        key={input.id}
                        value={input.id}
                      >
                        {input.label}
                      </option>
                    ))}
                  </select>
                  <small>Active input: {activeInputLabel || 'Unknown microphone'}</small>
                </label>
              ) : (
                <div className="backstage-note">
                  PC audio uses the Chrome share picker. Restart the inputs if the
                  direct-audio path was not granted cleanly.
                </div>
              )}

              <div className="backstage-actions">
                <button
                  className="backstage-action"
                  onClick={onRecalibrate}
                  type="button"
                >
                  Restart Inputs
                </button>
              </div>

              <div className="backstage-note">
                phase: <strong>{status.phase}</strong> | input:{' '}
                <strong>{activeInputLabel || 'pending'}</strong>
              </div>
              <div className="backstage-note">
                source trust: <strong>{audio.calibrationTrust}</strong> | quality:{' '}
                <strong>{audio.calibrationQuality}</strong> | music lock:{' '}
                <strong>{audio.sourceReadiness.musicLock ? 'yes' : 'no'}</strong>
              </div>
              <div className="backstage-note">
                source ladder: share{' '}
                <strong>{audio.displayAudioGranted ? 'granted' : 'pending'}</strong> |
                engine{' '}
                <strong>{audio.workletPacketCount > 0 ? 'frames' : 'waiting'}</strong> |
                signal{' '}
                <strong>
                  {audio.sourceReadiness.currentSignalPresent ||
                  audio.sourceReadiness.signalPresent
                    ? 'heard'
                    : 'waiting'}
                </strong>{' '}
                | proof{' '}
                <strong>{audio.sourceReadiness.proofReady ? 'ready' : 'waiting'}</strong>
              </div>
              {audio.startupBlocker !== 'none' ? (
                <div className="backstage-note backstage-note--error">
                  startup blocker: <strong>{audio.startupBlocker}</strong>
                </div>
              ) : null}
              {audio.warnings.length > 0 ? (
                <ul className="backstage-warnings">
                  {audio.warnings.slice(0, 3).map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {backstageTab === 'capture' ? (
            <div className="backstage-panel__body">
              <section className="backstage-section">
                <div className="backstage-section__title">Capture Folder</div>
                <div className="backstage-note">
                  {captureFolder.folderName
                    ? `Folder: ${captureFolder.folderName}`
                    : 'No capture folder selected yet.'}
                </div>
                <div className="backstage-actions">
                  <button
                    className={`backstage-action ${proofWaveArmed ? 'backstage-action--ghost' : ''}`}
                    onClick={onArmProofWave}
                    disabled={runJournalStatus.active}
                    type="button"
                  >
                    {proofWaveArmed ? 'Proof Wave Armed' : 'Arm Proof Wave'}
                  </button>
                  {runJournalStatus.active ? (
                    <button
                      className="backstage-action"
                      onClick={onFinishProofRun}
                      type="button"
                    >
                      Finish Proof Run
                    </button>
                  ) : null}
                  {runJournalStatus.active && runJournalStatus.proofWaveArmed ? (
                    <button
                      className="backstage-action backstage-action--ghost"
                      onClick={onOverrideProofToExploratory}
                      type="button"
                    >
                      Override To Exploratory
                    </button>
                  ) : null}
                  {!runJournalStatus.active &&
                  runJournalStatus.proofRunState === 'waiting-for-source' ? (
                    <button
                      className="backstage-action backstage-action--ghost"
                      onClick={onFinishProofRun}
                      type="button"
                    >
                      Cancel Proof Setup
                    </button>
                  ) : null}
                  <button
                    className="backstage-action"
                    onClick={onChooseCaptureFolder}
                    type="button"
                  >
                    {captureFolder.folderName ? 'Choose Folder Again' : 'Choose Folder'}
                  </button>
                  {captureFolder.folderName ? (
                    <button
                      className="backstage-action backstage-action--ghost"
                      onClick={onForgetCaptureFolder}
                      type="button"
                    >
                      Forget Folder
                    </button>
                  ) : null}
                </div>
                {captureFolder.error ? (
                  <div className="backstage-note backstage-note--error">
                    {captureFolder.error}
                  </div>
                ) : null}
                <label className="backstage-field">
                  <span>Proof Mission</span>
                  <select
                    className="backstage-select"
                    disabled={runJournalStatus.active}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      onProofMissionChange(nextValue as ReplayProofMissionKind);
                    }}
                    value={proofMissionKind}
                  >
                    {PROOF_MISSION_OPTIONS.map((option) => (
                      <option key={option.kind} value={option.kind}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small>
                    Choose the mission once. Proof Wave will force the matching route,
                    scenario, journal, auto capture, auto-save, and proof stills.
                  </small>
                </label>
                <div className="backstage-note">
                  Mission {activeProofMission.label} | scenario{' '}
                  {activeProofMission.scenarioKind} | route{' '}
                  {activeProofMission.expectedRoute} | source{' '}
                  {activeProofMission.expectedSourceMode}
                </div>
                <div className="backstage-note">
                  Expected duration{' '}
                  {Math.round(activeProofMission.expectedDurationSeconds.min / 60)}-
                  {Math.round(activeProofMission.expectedDurationSeconds.max / 60)} min |{' '}
                  {activeProofMission.strictNoTouch
                    ? 'no-touch required'
                    : 'manual steering allowed'}
                </div>
                <div className="backstage-note">
                  Capture coach: {activeProofMission.musicGuidance}
                </div>
                {activeProofMission.operatorInstructions.length > 0 ? (
                  <ul className="backstage-warnings">
                    {activeProofMission.operatorInstructions.map((instruction) => (
                      <li key={instruction}>{instruction}</li>
                    ))}
                  </ul>
                ) : null}
                {runJournalStatus.proofMission?.autoCorrections.length ? (
                  <div className="backstage-note">
                    Auto-corrected:{' '}
                    {runJournalStatus.proofMission.autoCorrections.join(' | ')}
                  </div>
                ) : null}
                <div className="backstage-note">
                  {runJournalStatus.active
                    ? `Run ${runJournalStatus.runId} | samples ${runJournalStatus.sampleCount} | markers ${runJournalStatus.markerCount} | clips ${runJournalStatus.clipCount} | stills ${runJournalStatus.checkpointStillCount}`
                    : runJournalStatus.runId
                      ? `Last run ${runJournalStatus.runId} | clips ${runJournalStatus.clipCount} | stills ${runJournalStatus.checkpointStillCount}`
                      : runJournalStatus.proofRunState === 'waiting-for-source'
                        ? 'Proof setup is waiting for music lock. The run journal and no-touch clock have not started.'
                        : 'Run journal will start after Start Show succeeds.'}
                </div>
                {runJournalStatus.runId ? (
                  <div className="backstage-note">
                    state {runJournalStatus.proofRunState} | suppressed attempts{' '}
                    {runJournalStatus.suppressedInterventionCount} | integrity{' '}
                    {runJournalStatus.artifactIntegrity?.verdict ?? 'pending'} | eligibility{' '}
                    {runJournalStatus.proofMissionEligibility?.verdict ?? 'pending'}
                  </div>
                ) : null}
                <div className="backstage-note">
                  Build identity {runJournalStatus.buildIdentityValid ? 'recording' : 'invalid'} | scenario{' '}
                  {runJournalStatus.scenarioAssessment?.validated === true
                    ? 'validated'
                    : runJournalStatus.scenarioAssessment
                      ? 'pending / mismatched'
                      : 'pending'}
                </div>
                <div className="backstage-note">
                  Serious proof{' '}
                  {runJournalStatus.readiness?.ready
                    ? 'ready'
                    : runJournalStatus.proofWaveArmed
                      ? 'blocked'
                      : 'idle'}{' '}
                  | verdict {runJournalStatus.proofValidity?.verdict ?? 'exploratory'} | lifecycle{' '}
                  {runJournalStatus.lifecycleState}
                </div>
                {runJournalStatus.readiness &&
                runJournalStatus.readiness.checks.some((check) => !check.passed) ? (
                  <div className="backstage-note backstage-note--error">
                    {runJournalStatus.readiness.checks
                      .filter((check) => !check.passed)
                      .map((check) => check.reason)
                      .join(' ')}
                  </div>
                ) : null}
                {runJournalStatus.proofValidity?.recoveryGuidance ? (
                  <div className="backstage-note backstage-note--error">
                    {runJournalStatus.proofValidity.recoveryGuidance}
                  </div>
                ) : null}
                {!runJournalStatus.active &&
                runJournalStatus.runId &&
                runJournalStatus.proofRunState !== 'idle' ? (
                  <div className="backstage-note">
                    Receipt: captures/inbox/runs/{runJournalStatus.runId}. Then run npm run
                    proof:current; npm run evidence:index; npm run run:review -- --run-id{' '}
                    {runJournalStatus.runId}.
                  </div>
                ) : null}
              </section>

              <section className="backstage-section">
                <div className="backstage-section__title">Auto Evidence</div>
                <div className="backstage-chip-grid">
                  <button
                    className={`backstage-chip ${autoCaptureStatus.enabled ? 'backstage-chip--active' : ''}`}
                    onClick={onToggleAutoCapture}
                    type="button"
                  >
                    Auto Capture
                  </button>
                  <button
                    className={`backstage-chip ${captureFolder.autoSave ? 'backstage-chip--active' : ''}`}
                    onClick={onToggleAutoSaveToFolder}
                    type="button"
                  >
                    Auto Save To Folder
                  </button>
                  <button
                    className={`backstage-chip ${autoCaptureStatus.proofStillsEnabled ? 'backstage-chip--active' : ''}`}
                    onClick={onToggleProofStills}
                    type="button"
                  >
                    Proof Stills
                  </button>
                  <button
                    className={`backstage-chip ${autoCaptureStatus.autoDownload ? 'backstage-chip--active' : ''}`}
                    onClick={onToggleAutoDownload}
                    type="button"
                  >
                    Auto Download
                  </button>
                </div>
                <div className="backstage-note">
                  {autoCaptureStatus.captureCount} saved auto capture
                  {autoCaptureStatus.captureCount === 1 ? '' : 's'}
                  {autoCaptureStatus.latestLabel ? ` | latest: ${autoCaptureStatus.latestLabel}` : ''}
                </div>
              </section>

              {momentLab.available ? (
                <section className="backstage-section">
                  <div className="backstage-section__title">Moment Lab</div>
                  <div className="backstage-note">
                    Local exploratory preview only. Moment Lab is disabled for serious
                    proof and forced previews never count as current proof.
                  </div>
                  <div className="backstage-field-grid">
                    <label className="backstage-field">
                      <span>Moment</span>
                      <select
                        className="backstage-select"
                        disabled={!momentLab.active}
                        onChange={(event) => {
                          onMomentLabKindChange(event.target.value as MomentLabKind);
                        }}
                        value={momentLab.kind}
                      >
                        {momentLabKinds.map((kind) => (
                          <option key={kind} value={kind}>
                            {kind}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="backstage-field">
                      <span>Style</span>
                      <select
                        className="backstage-select"
                        disabled={!momentLab.active}
                        onChange={(event) => {
                          onMomentLabStyleChange(
                            event.target.value as SignatureMomentStyle
                          );
                        }}
                        value={momentLab.style}
                      >
                        {momentLabStyles.map((style) => (
                          <option key={style} value={style}>
                            {style}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="backstage-field">
                      <span>Profile</span>
                      <select
                        className="backstage-select"
                        disabled={!momentLab.active}
                        onChange={(event) => {
                          onMomentLabProfileChange(
                            event.target.value as SignatureMomentPreviewProfile
                          );
                        }}
                        value={momentLab.syntheticProfile}
                      >
                        {momentLabProfiles.map((profile) => (
                          <option key={profile} value={profile}>
                            {profile}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="backstage-field">
                      <span>Duration</span>
                      <input
                        disabled={!momentLab.active}
                        max={9}
                        min={2.2}
                        onChange={(event) => {
                          onMomentLabDurationChange(Number(event.target.value));
                        }}
                        step={0.2}
                        type="range"
                        value={momentLab.durationSeconds}
                      />
                      <small>{momentLab.durationSeconds.toFixed(1)} seconds</small>
                    </label>
                  </div>
                  <div className="backstage-actions">
                    <button
                      className="backstage-action"
                      disabled={!momentLab.active}
                      onClick={onMomentLabPreview}
                      type="button"
                    >
                      Preview + Receipt
                    </button>
                    <button
                      className={`backstage-action ${
                        momentLab.autoCycleActive ? '' : 'backstage-action--ghost'
                      }`}
                      disabled={!momentLab.active}
                      onClick={onMomentLabAutoCycle}
                      type="button"
                    >
                      {momentLab.autoCycleActive ? 'Stop 4x3 Cycle' : 'Auto-Cycle 4x3'}
                    </button>
                  </div>
                  {momentLab.disabledReason ? (
                    <div className="backstage-note backstage-note--error">
                      {momentLab.disabledReason}
                    </div>
                  ) : null}
                  {momentLab.latestReceipt ? (
                    <div className="backstage-note">{momentLab.latestReceipt}</div>
                  ) : null}
                </section>
              ) : null}

              <section className="backstage-section">
                <div className="backstage-section__title">Manual Capture</div>
                <div className="backstage-actions">
                  <button
                    className="backstage-action"
                    onClick={recording.active ? onStopCapture : onStartCapture}
                    type="button"
                  >
                    {recording.active ? 'Stop Capture' : 'Start Capture'}
                  </button>
                </div>
                <div className="backstage-note">
                  {recording.active
                    ? `Recording live frames: ${recording.frameCount}`
                    : `Last manual capture window: ${recording.durationMs}ms`}
                </div>
              </section>
            </div>
          ) : null}

          {backstageTab === 'replay' ? (
            <div className="backstage-panel__body">
              <section className="backstage-section">
                <div className="backstage-section__title">Replay</div>
                <div className="backstage-actions">
                  <button
                    className="backstage-action"
                    onClick={onLoadReplay}
                    type="button"
                  >
                    Load Replay
                  </button>
                  <button
                    className="backstage-action backstage-action--ghost"
                    onClick={onToggleReplayPlayback}
                    type="button"
                  >
                    {replay.mode === 'playing' ? 'Pause' : 'Play'}
                  </button>
                  <button
                    className="backstage-action backstage-action--ghost"
                    onClick={onStopReplay}
                    type="button"
                  >
                    Stop
                  </button>
                  <button
                    className="backstage-action backstage-action--ghost"
                    onClick={onClearReplay}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
                <div className="backstage-note">
                  mode: <strong>{replay.mode}</strong> | {Math.round(replay.currentTimeMs)} /{' '}
                  {Math.round(replay.durationMs)} ms
                </div>
                {replayError ? (
                  <div className="backstage-note backstage-note--error">{replayError}</div>
                ) : null}
              </section>
            </div>
          ) : null}

          {backstageTab === 'system' ? (
            <div className="backstage-panel__body">
              <section className="backstage-section">
                <div className="backstage-section__title">Show Info</div>
                <div className="backstage-meta-grid">
                  <div>
                    <span>build</span>
                    <strong>{BUILD_LABEL}</strong>
                  </div>
                  <div>
                    <span>branch</span>
                    <strong>{BUILD_INFO.branch}</strong>
                  </div>
                  <div>
                    <span>lane</span>
                    <strong>{BUILD_INFO.lane}</strong>
                  </div>
                  <div>
                    <span>proof</span>
                    <strong>{BUILD_INFO.proofStatus}</strong>
                  </div>
                  <div>
                    <span>renderer</span>
                    <strong>{renderer.backend}</strong>
                  </div>
                  <div>
                    <span>quality</span>
                    <strong>{renderer.qualityTier}</strong>
                  </div>
                </div>
              </section>

              <section className="backstage-section">
                <div className="backstage-section__title">Runtime Tools</div>
                <div className="backstage-actions">
                  <button
                    className="backstage-action"
                    onClick={onToggleDiagnostics}
                    type="button"
                  >
                    {diagnosticsVisible ? 'Hide Diagnostics' : 'Show Diagnostics'}
                  </button>
                  <button
                    className="backstage-action backstage-action--ghost"
                    onClick={onToggleFullscreen}
                    type="button"
                  >
                    {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  </button>
                </div>
                <div className="backstage-note">
                  F = fullscreen | M = Advanced | Shift + D = diagnostics
                </div>
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
