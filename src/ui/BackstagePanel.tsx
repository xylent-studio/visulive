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
  ReplayProofScenarioKind,
  ReplayProofValidity,
  ReplayRunLifecycleState
} from '../replay/types';
import { BUILD_INFO, BUILD_LABEL } from '../buildInfo';
import {
  ADVANCED_STEERING_KEYS,
  DIRECTOR_BIAS_DESCRIPTORS,
  DIRECTOR_STANCE_DEFINITIONS,
  LOOK_DEFINITIONS,
  LOOK_POOL_DEFINITIONS,
  SHOW_START_ROUTE_DEFINITIONS,
  SHOW_WORLD_DEFINITIONS,
  WORLD_POOL_DEFINITIONS,
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
  lifecycleState: ReplayRunLifecycleState;
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
  proofScenarioKind: ReplayProofScenarioKind | null;
  runJournalStatus: RunJournalStatus;
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
  onProofScenarioChange: (kind: ReplayProofScenarioKind | null) => void;
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

const PROOF_SCENARIO_OPTIONS: Array<{
  value: ReplayProofScenarioKind;
  label: string;
}> = [
  { value: 'primary-benchmark', label: 'Primary benchmark' },
  { value: 'room-floor', label: 'Room floor' },
  { value: 'coverage', label: 'Coverage' },
  { value: 'sparse-silence', label: 'Sparse / silence' },
  { value: 'operator-trust', label: 'Operator trust' },
  { value: 'steering', label: 'Steering' }
];

function BiasSlider({
  label,
  hint,
  lowLabel,
  highLabel,
  value,
  onChange
}: {
  label: string;
  hint: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="director-slider">
      <div className="director-slider__head">
        <span>{label}</span>
        <strong>{Math.round(value * 100)}</strong>
      </div>
      <input
        max={1}
        min={0}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
        step={0.01}
        type="range"
        value={value}
      />
      <div className="director-slider__scale">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="director-slider__hint">{hint}</div>
    </label>
  );
}

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
  proofScenarioKind,
  runJournalStatus,
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
  onProofScenarioChange,
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

  const selectedWorldPool = WORLD_POOL_DEFINITIONS[curation.worldPoolId];
  const selectedLookPool = LOOK_POOL_DEFINITIONS[curation.lookPoolId];
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
        {(['style', 'steer', 'backstage'] as const).map((tab) => (
          <button
            className={`backstage-tab ${activeAdvancedTab === tab ? 'backstage-tab--active' : ''}`}
            key={tab}
            onClick={() => {
              onAdvancedTabChange(tab);
            }}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {activeAdvancedTab === 'style' ? (
        <div className="backstage-panel__body">
          <section className="backstage-section">
            <div className="backstage-section__title">Auto Show Library</div>
            <div className="backstage-note">
              These are optional curation choices. If you never touch them, Auto Show
              keeps its full autonomous world and look spread.
            </div>
            <div className="backstage-actions">
              <button
                className="backstage-action"
                onClick={onResetAdvanced}
                type="button"
              >
                Return To Full Auto
              </button>
              <button
                className="backstage-action backstage-action--ghost"
                onClick={onApplyCurrentDriftAnchors}
                type="button"
              >
                Anchor Current Drift
              </button>
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">World Pool</div>
            <div className="director-chip-grid">
              {Object.values(WORLD_POOL_DEFINITIONS).map((pool) => (
                <button
                  className={`director-chip ${curation.worldPoolId === pool.id ? 'director-chip--active' : ''}`}
                  key={pool.id}
                  onClick={() => {
                    onWorldPoolChange(pool.id);
                  }}
                  type="button"
                >
                  <span>{pool.label}</span>
                  <small>Pool</small>
                </button>
              ))}
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">World Anchor</div>
            <div className="director-chip-grid">
              <button
                className={`director-chip ${curation.showWorldId === null ? 'director-chip--active' : ''}`}
                onClick={() => {
                  onWorldChange(null);
                }}
                type="button"
              >
                <span>Auto</span>
                <small>Let the director choose</small>
              </button>
              {selectedWorldPool.worldIds.map((worldOption) => {
                const world = SHOW_WORLD_DEFINITIONS[worldOption];

                return (
                  <button
                    className={`director-chip ${worldId === world.id ? 'director-chip--active' : ''}`}
                    key={world.id}
                    onClick={() => {
                      onWorldChange(world.id);
                    }}
                    type="button"
                  >
                    <span>{world.label}</span>
                    <small>{world.eyebrow}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Look Pool</div>
            <div className="director-chip-grid">
              {Object.values(LOOK_POOL_DEFINITIONS).map((pool) => (
                <button
                  className={`director-chip ${curation.lookPoolId === pool.id ? 'director-chip--active' : ''}`}
                  key={pool.id}
                  onClick={() => {
                    onLookPoolChange(pool.id);
                  }}
                  type="button"
                >
                  <span>{pool.label}</span>
                  <small>Pool</small>
                </button>
              ))}
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Look Anchor</div>
            <div className="director-chip-grid">
              <button
                className={`director-chip ${curation.lookId === null ? 'director-chip--active' : ''}`}
                onClick={() => {
                  onLookChange(null);
                }}
                type="button"
              >
                <span>Auto</span>
                <small>Let the director choose</small>
              </button>
              {selectedLookPool.lookIds.map((lookOption) => {
                const look = LOOK_DEFINITIONS[lookOption];

                return (
                  <button
                    className={`director-chip ${lookId === look.id ? 'director-chip--active' : ''}`}
                    key={look.id}
                    onClick={() => {
                      onLookChange(look.id);
                    }}
                    type="button"
                  >
                    <span>{look.label}</span>
                    <small>{look.eyebrow}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Director Stance</div>
            <div className="director-chip-grid">
              <button
                className={`director-chip ${curation.stanceId === null ? 'director-chip--active' : ''}`}
                onClick={() => {
                  onStanceChange(null);
                }}
                type="button"
              >
                <span>Auto</span>
                <small>Balanced autonomous stance</small>
              </button>
              {Object.values(DIRECTOR_STANCE_DEFINITIONS).map((stance) => (
                <button
                  className={`director-chip ${stanceId === stance.id ? 'director-chip--active' : ''}`}
                  key={stance.id}
                  onClick={() => {
                    onStanceChange(stance.id);
                  }}
                  type="button"
                >
                  <span>{stance.label}</span>
                  <small>Stance</small>
                </button>
              ))}
            </div>
          </section>

          <section className="backstage-section">
            <div className="backstage-section__title">Saved Stances</div>
            <div className="backstage-actions">
              <button
                className="backstage-action"
                onClick={() => {
                  const name = window.prompt('Save current advanced stance as:', 'Saved stance');

                  if (!name) {
                    return;
                  }

                  onSaveCurrentStance(name);
                }}
                type="button"
              >
                Save Current Stance
              </button>
            </div>
            {savedStances.length > 0 ? (
              <div className="director-deck__saved-list">
                {savedStances.map((stance) => (
                  <div
                    className="director-deck__saved-item"
                    key={stance.id}
                  >
                    <button
                      className="director-deck__saved-main"
                      onClick={() => {
                        onLoadSavedStance(stance.id);
                      }}
                      type="button"
                    >
                      <strong>{stance.name}</strong>
                      <span>
                        {WORLD_POOL_DEFINITIONS[stance.worldPoolId].label} /{' '}
                        {SHOW_WORLD_DEFINITIONS[stance.showWorldId].label} /{' '}
                        {LOOK_POOL_DEFINITIONS[stance.lookPoolId].label} /{' '}
                        {LOOK_DEFINITIONS[stance.lookId].label} /{' '}
                        {DIRECTOR_STANCE_DEFINITIONS[stance.stanceId].label}
                      </span>
                    </button>
                    <button
                      className="director-deck__saved-delete"
                      onClick={() => {
                        onDeleteSavedStance(stance.id);
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="backstage-note">
                Save a stance if you want to recall a curated world/look/stance
                combination later.
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeAdvancedTab === 'steer' ? (
        <div className="backstage-panel__body">
          <section className="backstage-section">
            <div className="backstage-section__title">Semantic Steering</div>
            <div className="backstage-note">
              These controls bias the director over time. They should never be
              required to make the show good.
            </div>
            <div className="backstage-actions">
              <button
                className="backstage-action"
                onClick={onResetSteering}
                type="button"
              >
                Reset Steering
              </button>
            </div>
          </section>

          <div className="director-deck__controls">
            {ADVANCED_STEERING_KEYS.map((key) => {
              const descriptor = DIRECTOR_BIAS_DESCRIPTORS[key];

              return (
                <BiasSlider
                  hint={descriptor.hint}
                  highLabel={descriptor.highLabel}
                  key={key}
                  label={descriptor.label}
                  lowLabel={descriptor.lowLabel}
                  onChange={(value) => {
                    onBiasChange(key, value);
                  }}
                  value={steering[key]}
                />
              );
            })}
          </div>
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
                    type="button"
                  >
                    {proofWaveArmed ? 'Proof Wave Armed' : 'Arm Proof Wave'}
                  </button>
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
                  <span>Proof Scenario</span>
                  <select
                    className="backstage-select"
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      onProofScenarioChange(
                        nextValue === '' ? null : (nextValue as ReplayProofScenarioKind)
                      );
                    }}
                    value={proofScenarioKind ?? ''}
                  >
                    <option value="">Unassigned</option>
                    {PROOF_SCENARIO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small>
                    Required before `Start Show` for serious proof. Use Primary benchmark
                    for normal PC Audio no-touch runs.
                  </small>
                </label>
                <div className="backstage-note">
                  {runJournalStatus.active
                    ? `Run ${runJournalStatus.runId} | samples ${runJournalStatus.sampleCount} | markers ${runJournalStatus.markerCount} | clips ${runJournalStatus.clipCount} | stills ${runJournalStatus.checkpointStillCount}`
                    : 'Run journal will start on the next Start Show.'}
                </div>
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
