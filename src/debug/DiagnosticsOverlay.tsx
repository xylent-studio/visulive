import type {
  AudioDiagnostics,
  AudioEngineStatus
} from '../types/audio';
import { BUILD_INFO, BUILD_LABEL } from '../buildInfo';
import type { RendererDiagnostics } from '../engine/VisualizerEngine';
import { formatReplayDuration } from '../replay/session';
import type {
  ReplayProofMissionSnapshot,
  ReplayProofReadiness,
  ReplayProofScenarioKind,
  ReplayProofValidity,
  ReplayStatus
} from '../replay/types';
import {
  formatControlValue,
  getActiveQuickStartProfile,
  getPresetLabel,
  type UserControlState
} from '../types/tuning';

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
  currentTriggerProfile: string | null;
  latestTriggerProfile: string | null;
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

type SessionInterventionSummary = {
  sessionStartedAtMs: number | null;
  interventionCount: number;
  firstInterventionTimestampMs: number | null;
  lastInterventionReason: string | null;
  interventionReasons: string[];
};

type RunJournalStatus = {
  active: boolean;
  proofWaveArmed: boolean;
  runId: string | null;
  proofMission: ReplayProofMissionSnapshot | null;
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
  lifecycleState: 'inbox' | 'reviewed-candidate' | 'canonical' | 'archive';
};

type AutoCaptureSummary = {
  id: string;
  label: string;
  triggerLabel: string;
  triggerReason: string;
  capturedAt: string;
  durationMs: number;
  peakDropImpact: number;
  peakSectionChange: number;
  peakBeatConfidence: number;
  peakMusicConfidence: number;
};

type DiagnosticsOverlayProps = {
  visible: boolean;
  status: AudioEngineStatus;
  audio: AudioDiagnostics;
  renderer: RendererDiagnostics;
  controls: UserControlState;
  replay: ReplayStatus;
  recording: RecordingSummary;
  autoCaptureStatus: AutoCaptureStatus;
  captureFolder: CaptureFolderStatus;
  latestAutoCapture: AutoCaptureSummary | null;
  launchQuickStartLabel: string | null;
  proofScenarioKind: ReplayProofScenarioKind | null;
  proofMissionLabel: string | null;
  sessionInterventionSummary: SessionInterventionSummary;
  runJournalStatus: RunJournalStatus;
  noTouchProofWindowMs: number;
  recentAutoCaptures: AutoCaptureSummary[];
  replayError: string | null;
  onChooseCaptureFolder: () => void;
  onToggleAutoCapture: () => void;
  onToggleAutoDownload: () => void;
  onToggleProofStills: () => void;
  onToggleAutoSaveToFolder: () => void;
  onLoadLatestAutoCapture: () => void;
  onDownloadLatestAutoCapture: () => void;
  onSaveLatestAutoCaptureToFolder: () => void;
  onLoadAutoCapture: (captureId: string) => void;
  onDownloadAutoCapture: (captureId: string) => void;
  onClearAutoCaptures: () => void;
  onForgetCaptureFolder: () => void;
  onStartCapture: () => void;
  onStopCapture: () => void;
  onLoadReplay: () => void;
  onToggleReplayPlayback: () => void;
  onStopReplay: () => void;
  onClearReplay: () => void;
  onSeekReplay: (ratio: number) => void;
};

const formatNumber = (value: number): string => value.toFixed(3);

function formatProofScenarioLabel(kind: ReplayProofScenarioKind | null): string {
  switch (kind) {
    case 'primary-benchmark':
      return 'Primary benchmark';
    case 'room-floor':
      return 'Room floor';
    case 'coverage':
      return 'Coverage';
    case 'sparse-silence':
      return 'Sparse / silence';
    case 'operator-trust':
      return 'Operator trust';
    case 'steering':
      return 'Steering';
    default:
      return 'Unassigned';
  }
}

export function DiagnosticsOverlay({
  visible,
  status,
  audio,
  renderer,
  controls,
  replay,
  recording,
  autoCaptureStatus,
  captureFolder,
  latestAutoCapture,
  launchQuickStartLabel,
  proofScenarioKind,
  proofMissionLabel,
  sessionInterventionSummary,
  runJournalStatus,
  noTouchProofWindowMs,
  recentAutoCaptures,
  replayError,
  onChooseCaptureFolder,
  onToggleAutoCapture,
  onToggleAutoDownload,
  onToggleProofStills,
  onToggleAutoSaveToFolder,
  onLoadLatestAutoCapture,
  onDownloadLatestAutoCapture,
  onSaveLatestAutoCaptureToFolder,
  onLoadAutoCapture,
  onDownloadAutoCapture,
  onClearAutoCaptures,
  onForgetCaptureFolder,
  onStartCapture,
  onStopCapture,
  onLoadReplay,
  onToggleReplayPlayback,
  onStopReplay,
  onClearReplay,
  onSeekReplay
}: DiagnosticsOverlayProps) {
  if (!visible) {
    return null;
  }

  const frame = audio.listeningFrame;
  const analysis = audio.analysisFrame;
  const activeQuickStart = getActiveQuickStartProfile(controls, audio.sourceMode);
  const replayProgress =
    replay.durationMs > 0 ? replay.currentTimeMs / replay.durationMs : 0;
  const replayActive = replay.mode !== 'idle';
  const visual = renderer.visualTelemetry;
  const lowerConfidenceEvidence =
    launchQuickStartLabel === null || activeQuickStart === null;
  const noTouchElapsedMs =
    sessionInterventionSummary.sessionStartedAtMs === null
      ? 0
      : Math.max(0, Date.now() - sessionInterventionSummary.sessionStartedAtMs);
  const noTouchWindowCleared =
    sessionInterventionSummary.sessionStartedAtMs !== null &&
    sessionInterventionSummary.interventionCount === 0 &&
    noTouchElapsedMs >= noTouchProofWindowMs;
  const noTouchWindowLabel =
    sessionInterventionSummary.sessionStartedAtMs === null
      ? 'not started'
      : sessionInterventionSummary.interventionCount > 0
        ? `broken (${sessionInterventionSummary.interventionCount})`
        : noTouchWindowCleared
          ? 'cleared'
          : `${formatReplayDuration(noTouchElapsedMs)} / ${formatReplayDuration(
              noTouchProofWindowMs
            )}`;

  return (
    <aside className="diagnostics-overlay">
      <div className="diagnostics-heading">
        <div>
          <span className="diagnostics-eyebrow">Runtime truth</span>
          <strong>Show diagnostics</strong>
        </div>
      </div>

      <div className="diagnostics-grid">
        <div>
          <span>source mode</span>
          <strong>{audio.sourceMode}</strong>
        </div>
        <div>
          <span>phase</span>
          <strong>{status.phase}</strong>
        </div>
        <div>
          <span>boot step</span>
          <strong>{audio.bootStep}</strong>
        </div>
        <div>
          <span>proof wave</span>
          <strong>{runJournalStatus.proofWaveArmed ? 'armed' : 'idle'}</strong>
        </div>
        <div>
          <span>run id</span>
          <strong>{runJournalStatus.runId ?? 'n/a'}</strong>
        </div>
        <div>
          <span>build identity</span>
          <strong>{runJournalStatus.buildIdentityValid ? 'valid' : 'missing / dev'}</strong>
        </div>
        <div>
          <span>scenario validation</span>
          <strong>
            {runJournalStatus.scenarioAssessment?.validated === true
              ? 'validated'
              : runJournalStatus.scenarioAssessment
                ? 'mismatch / pending'
                : 'pending'}
          </strong>
        </div>
        <div>
          <span>run journal</span>
          <strong>
            {runJournalStatus.active
              ? `${runJournalStatus.sampleCount} samples / ${runJournalStatus.markerCount} markers`
              : 'inactive'}
          </strong>
        </div>
        <div>
          <span>proof ready</span>
          <strong>
            {runJournalStatus.readiness?.ready
              ? 'yes'
              : runJournalStatus.proofWaveArmed
                ? 'blocked'
                : 'idle'}
          </strong>
        </div>
        <div>
          <span>proof verdict</span>
          <strong>{runJournalStatus.proofValidity?.verdict ?? 'exploratory'}</strong>
        </div>
        <div>
          <span>lifecycle</span>
          <strong>{runJournalStatus.lifecycleState}</strong>
        </div>
        <div>
          <span>build</span>
          <strong>{BUILD_LABEL}</strong>
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
          <span>backend</span>
          <strong>{renderer.backend}</strong>
        </div>
        <div>
          <span>launch profile</span>
          <strong>{launchQuickStartLabel ?? 'manual/none'}</strong>
        </div>
        <div>
          <span>quality</span>
          <strong>{renderer.qualityTier}</strong>
        </div>
        <div>
          <span>fps</span>
          <strong>{renderer.fps.toFixed(1)}</strong>
        </div>
        <div>
          <span>frame ms</span>
          <strong>{renderer.frameTimeMs.toFixed(1)}</strong>
        </div>
        <div>
          <span>dpr</span>
          <strong>
            {renderer.devicePixelRatio.toFixed(2)} -&gt;{' '}
            {renderer.cappedPixelRatio.toFixed(2)}
          </strong>
        </div>
        <div>
          <span>sample rate</span>
          <strong>{audio.sampleRate ?? 'n/a'}</strong>
        </div>
        <div>
          <span>cal ms</span>
          <strong>{audio.calibrationDurationMs || '0'}</strong>
        </div>
        <div>
          <span>cal samples</span>
          <strong>{audio.calibrationSampleCount || '0'}</strong>
        </div>
        <div>
          <span>calibrated</span>
          <strong>{frame.calibrated ? 'yes' : 'no'}</strong>
        </div>
        <div>
          <span>raw path</span>
          <strong>{audio.rawPathGranted ? 'clean' : 'compromised'}</strong>
        </div>
        <div>
          <span>display audio</span>
          <strong>{audio.displayAudioGranted ? 'granted' : 'none'}</strong>
        </div>
        <div>
          <span>track label</span>
          <strong>{audio.displayTrackLabel ?? 'n/a'}</strong>
        </div>
        <div>
          <span>clipping</span>
          <strong>{frame.clipped ? 'yes' : 'no'}</strong>
        </div>
        <div>
          <span>confidence</span>
          <strong>{formatNumber(frame.confidence)}</strong>
        </div>
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Listening frame</div>
        <div className="diagnostics-grid diagnostics-grid--dense">
          <div>
            <span>show</span>
            <strong>{frame.showState}</strong>
          </div>
          <div>
            <span>state</span>
            <strong>{frame.state}</strong>
          </div>
          <div>
            <span>moment</span>
            <strong>
              {frame.momentKind} {frame.momentAmount > 0 ? formatNumber(frame.momentAmount) : ''}
            </strong>
          </div>
          <div>
            <span>regime</span>
            <strong>{visual.performanceRegime ?? 'n/a'}</strong>
          </div>
          <div>
            <span>cue</span>
            <strong>{visual.canonicalCueClass ?? visual.cueClass ?? 'n/a'}</strong>
          </div>
          <div>
            <span>silence</span>
            <strong>{visual.silenceState ?? 'n/a'}</strong>
          </div>
          <div>
            <span>phrase</span>
            <strong>{visual.phraseConfidence ?? 'n/a'}</strong>
          </div>
          <div>
            <span>section</span>
            <strong>{visual.sectionIntent ?? 'n/a'}</strong>
          </div>
          <div>
            <span>sub</span>
            <strong>{formatNumber(frame.subPressure)}</strong>
          </div>
          <div>
            <span>bass</span>
            <strong>{formatNumber(frame.bassBody)}</strong>
          </div>
          <div>
            <span>low-mid</span>
            <strong>{formatNumber(frame.lowMidBody)}</strong>
          </div>
          <div>
            <span>presence</span>
            <strong>{formatNumber(frame.presence)}</strong>
          </div>
          <div>
            <span>body</span>
            <strong>{formatNumber(frame.body)}</strong>
          </div>
          <div>
            <span>air</span>
            <strong>{formatNumber(frame.air)}</strong>
          </div>
          <div>
            <span>shimmer</span>
            <strong>{formatNumber(frame.shimmer)}</strong>
          </div>
          <div>
            <span>accent</span>
            <strong>{formatNumber(frame.accent)}</strong>
          </div>
          <div>
            <span>brightness</span>
            <strong>{formatNumber(frame.brightness)}</strong>
          </div>
          <div>
            <span>rough</span>
            <strong>{formatNumber(frame.roughness)}</strong>
          </div>
          <div>
            <span>stability</span>
            <strong>{formatNumber(frame.tonalStability)}</strong>
          </div>
          <div>
            <span>color</span>
            <strong>{formatNumber(frame.harmonicColor)}</strong>
          </div>
          <div>
            <span>tension</span>
            <strong>{formatNumber(frame.phraseTension)}</strong>
          </div>
          <div>
            <span>resonance</span>
            <strong>{formatNumber(frame.resonance)}</strong>
          </div>
          <div>
            <span>speech</span>
            <strong>{formatNumber(frame.speech)}</strong>
          </div>
          <div>
            <span>roomness</span>
            <strong>{formatNumber(frame.roomness)}</strong>
          </div>
          <div>
            <span>ambience</span>
            <strong>{formatNumber(frame.ambienceConfidence)}</strong>
          </div>
          <div>
            <span>speech conf</span>
            <strong>{formatNumber(frame.speechConfidence)}</strong>
          </div>
          <div>
            <span>impact conf</span>
            <strong>{formatNumber(frame.transientConfidence)}</strong>
          </div>
          <div>
            <span>music conf</span>
            <strong>{formatNumber(frame.musicConfidence)}</strong>
          </div>
          <div>
            <span>peak conf</span>
            <strong>{formatNumber(frame.peakConfidence)}</strong>
          </div>
          <div>
            <span>momentum</span>
            <strong>{formatNumber(frame.momentum)}</strong>
          </div>
          <div>
            <span>beat conf</span>
            <strong>{formatNumber(frame.beatConfidence)}</strong>
          </div>
          <div>
            <span>beat phase</span>
            <strong>{formatNumber(frame.beatPhase)}</strong>
          </div>
          <div>
            <span>bar phase</span>
            <strong>{formatNumber(frame.barPhase)}</strong>
          </div>
          <div>
            <span>phrase phase</span>
            <strong>{formatNumber(frame.phrasePhase)}</strong>
          </div>
          <div>
            <span>predrop</span>
            <strong>{formatNumber(frame.preDropTension)}</strong>
          </div>
          <div>
            <span>drop</span>
            <strong>{formatNumber(frame.dropImpact)}</strong>
          </div>
          <div>
            <span>section</span>
            <strong>{formatNumber(frame.sectionChange)}</strong>
          </div>
          <div>
            <span>release tail</span>
            <strong>{formatNumber(frame.releaseTail)}</strong>
          </div>
          <div>
            <span>intent</span>
            <strong>{frame.performanceIntent}</strong>
          </div>
        </div>
        <div className="diagnostics-code">
          state reason: {audio.stateReason}
        </div>
        <div className="diagnostics-code">
          show reason: {audio.showStateReason}
        </div>
        <div className="diagnostics-code">
          moment reason: {audio.momentReason}
        </div>
        <div className="diagnostics-code">
          conductor reason: {audio.conductorReason}
        </div>
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Interpreter guardrails</div>
        <div className="diagnostics-grid diagnostics-grid--dense">
          <div>
            <span>hum reject</span>
            <strong>{formatNumber(audio.humRejection)}</strong>
          </div>
          <div>
            <span>music trend</span>
            <strong>{formatNumber(audio.musicTrend)}</strong>
          </div>
          <div>
            <span>silence gate</span>
            <strong>{formatNumber(audio.silenceGate)}</strong>
          </div>
          <div>
            <span>ceiling</span>
            <strong>{formatNumber(audio.adaptiveCeiling)}</strong>
          </div>
          <div>
            <span>beat ms</span>
            <strong>{audio.beatIntervalMs > 0 ? audio.beatIntervalMs.toFixed(0) : 'n/a'}</strong>
          </div>
        </div>
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Visual telemetry</div>
        <div className="diagnostics-grid diagnostics-grid--dense">
          <div>
            <span>palette</span>
            <strong>{visual.paletteState}</strong>
          </div>
          <div>
            <span>family</span>
            <strong>{visual.showFamily}</strong>
          </div>
          <div>
            <span>exposure</span>
            <strong>{formatNumber(visual.exposure)}</strong>
          </div>
          <div>
            <span>bloom</span>
            <strong>{formatNumber(visual.bloomStrength)}</strong>
          </div>
          <div>
            <span>threshold</span>
            <strong>{formatNumber(visual.bloomThreshold)}</strong>
          </div>
          <div>
            <span>ambient glow</span>
            <strong>{formatNumber(visual.ambientGlowBudget)}</strong>
          </div>
          <div>
            <span>event glow</span>
            <strong>{formatNumber(visual.eventGlowBudget)}</strong>
          </div>
          <div>
            <span>world spend</span>
            <strong>{formatNumber(visual.worldGlowSpend)}</strong>
          </div>
          <div>
            <span>hero spend</span>
            <strong>{formatNumber(visual.heroGlowSpend)}</strong>
          </div>
          <div>
            <span>shell spend</span>
            <strong>{formatNumber(visual.shellGlowSpend)}</strong>
          </div>
          <div>
            <span>hero hue</span>
            <strong>{formatNumber(visual.heroHue)}</strong>
          </div>
          <div>
            <span>world hue</span>
            <strong>{formatNumber(visual.worldHue)}</strong>
          </div>
          <div>
            <span>pre-beat</span>
            <strong>{formatNumber(visual.temporalWindows.preBeatLift)}</strong>
          </div>
          <div>
            <span>beat</span>
            <strong>{formatNumber(visual.temporalWindows.beatStrike)}</strong>
          </div>
          <div>
            <span>post-beat</span>
            <strong>{formatNumber(visual.temporalWindows.postBeatRelease)}</strong>
          </div>
          <div>
            <span>float</span>
            <strong>{formatNumber(visual.temporalWindows.interBeatFloat)}</strong>
          </div>
          <div>
            <span>bar turn</span>
            <strong>{formatNumber(visual.temporalWindows.barTurn)}</strong>
          </div>
          <div>
            <span>phrase resolve</span>
            <strong>{formatNumber(visual.temporalWindows.phraseResolve)}</strong>
          </div>
        </div>
        <div className="diagnostics-code">
          active events:{' '}
          {visual.macroEventsActive.length > 0
            ? visual.macroEventsActive.join(', ')
            : 'none'}
        </div>
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Analysis frame</div>
        <div className="diagnostics-grid diagnostics-grid--dense">
          <div>
            <span>rms</span>
            <strong>{formatNumber(analysis.rms)}</strong>
          </div>
          <div>
            <span>peak</span>
            <strong>{formatNumber(analysis.peak)}</strong>
          </div>
          <div>
            <span>fast</span>
            <strong>{formatNumber(analysis.envelopeFast)}</strong>
          </div>
          <div>
            <span>slow</span>
            <strong>{formatNumber(analysis.envelopeSlow)}</strong>
          </div>
          <div>
            <span>transient</span>
            <strong>{formatNumber(analysis.transient)}</strong>
          </div>
          <div>
            <span>low</span>
            <strong>{formatNumber(analysis.lowEnergy)}</strong>
          </div>
          <div>
            <span>mid</span>
            <strong>{formatNumber(analysis.midEnergy)}</strong>
          </div>
          <div>
            <span>high</span>
            <strong>{formatNumber(analysis.highEnergy)}</strong>
          </div>
          <div>
            <span>flux low</span>
            <strong>{formatNumber(analysis.lowFlux)}</strong>
          </div>
          <div>
            <span>flux mid</span>
            <strong>{formatNumber(analysis.midFlux)}</strong>
          </div>
          <div>
            <span>flux high</span>
            <strong>{formatNumber(analysis.highFlux)}</strong>
          </div>
          <div>
            <span>modulation</span>
            <strong>{formatNumber(analysis.modulation)}</strong>
          </div>
          <div>
            <span>brightness</span>
            <strong>{formatNumber(analysis.brightness)}</strong>
          </div>
          <div>
            <span>crest</span>
            <strong>{formatNumber(analysis.crestFactor)}</strong>
          </div>
          <div>
            <span>low stable</span>
            <strong>{formatNumber(analysis.lowStability)}</strong>
          </div>
          <div>
            <span>debug spec</span>
            <strong>
              {formatNumber(audio.spectrumLow)}/{formatNumber(audio.spectrumMid)}/
              {formatNumber(audio.spectrumHigh)}
            </strong>
          </div>
        </div>
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Input truth</div>
        <div className="diagnostics-code">
          requested: ec={String(audio.requestedConstraints.echoCancellation)} ns=
          {String(audio.requestedConstraints.noiseSuppression)} agc=
          {String(audio.requestedConstraints.autoGainControl)} channels=
          {audio.requestedConstraints.channelCount ?? 'auto'}
        </div>
        <div className="diagnostics-code">
          supported: ec={String(audio.supportedConstraints.echoCancellation)} ns=
          {String(audio.supportedConstraints.noiseSuppression)} agc=
          {String(audio.supportedConstraints.autoGainControl)} channels=
          {String(audio.supportedConstraints.channelCount)}
        </div>
        <div className="diagnostics-code">
          applied: ec=
          {String(audio.appliedTrackSettings?.echoCancellation ?? 'n/a')} ns=
          {String(audio.appliedTrackSettings?.noiseSuppression ?? 'n/a')} agc=
          {String(audio.appliedTrackSettings?.autoGainControl ?? 'n/a')} channels=
          {audio.appliedTrackSettings?.channelCount ?? 'n/a'} sr=
          {audio.appliedTrackSettings?.sampleRate ?? 'n/a'} latency=
          {audio.appliedTrackSettings?.latency ?? 'n/a'}
        </div>
        <div className="diagnostics-code">device: {audio.deviceLabel || 'Unknown microphone'}</div>
        <div className="diagnostics-code">
          selected input: {audio.selectedInputId ?? 'default'} ({audio.availableInputs.length} inputs visible)
        </div>
        <div className="diagnostics-code">
          display audio: {audio.displayAudioGranted ? 'granted' : 'not active'} | share=
          {audio.displayTrackLabel ?? 'n/a'} | surface=
          {audio.appliedDisplayTrackSettings?.displaySurface ?? 'n/a'}
        </div>
        <div className="diagnostics-code">
          display settings: suppressLocal=
          {String(audio.appliedDisplayTrackSettings?.suppressLocalAudioPlayback ?? 'n/a')} restrictOwn=
          {String(audio.appliedDisplayTrackSettings?.restrictOwnAudio ?? 'n/a')}
        </div>
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Curated controls</div>
        <div className="diagnostics-code">
          launch={launchQuickStartLabel ?? 'manual/none'} active=
          {activeQuickStart?.label ?? 'Custom Mix'} preset=
          {getPresetLabel(controls.preset)} wake=
          {formatControlValue('sensitivity', controls.sensitivity)} intensity=
          {formatControlValue('energy', controls.energy)} composition=
          {formatControlValue('framing', controls.framing)} showScale=
          {formatControlValue('spectacle', controls.spectacle)} world=
          {formatControlValue('worldActivity', controls.worldActivity)}
        </div>
        <div className="diagnostics-code">
          structure={formatControlValue('geometry', controls.geometry)} glow=
          {formatControlValue('radiance', controls.radiance)} rhythm=
          {formatControlValue('beatDrive', controls.beatDrive)} eventRate=
          {formatControlValue('eventfulness', controls.eventfulness)} atmosphere=
          {formatControlValue('atmosphere', controls.atmosphere)} color=
          {formatControlValue('colorBias', controls.colorBias)} accent=
          {controls.accentBias}
        </div>
        <div className="diagnostics-code">
          inputTrim={formatControlValue('inputGain', controls.inputGain)} low=
          {formatControlValue('eqLow', controls.eqLow)} mid=
          {formatControlValue('eqMid', controls.eqMid)} high=
          {formatControlValue('eqHigh', controls.eqHigh)}
        </div>
        {lowerConfidenceEvidence ? (
          <div className="diagnostics-code">
            warning: this session is lower-confidence tuning evidence because it did not stay on a locked Proof Mission / launch profile path.
          </div>
        ) : null}
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Replay workflow</div>
        <div className="diagnostics-grid diagnostics-grid--dense">
          <div>
            <span>recording</span>
            <strong>{recording.active ? 'active' : 'idle'}</strong>
          </div>
          <div>
            <span>captured</span>
            <strong>
              {recording.frameCount} / {formatReplayDuration(recording.durationMs)}
            </strong>
          </div>
          <div>
            <span>replay</span>
            <strong>{replay.mode}</strong>
          </div>
          <div>
            <span>current</span>
            <strong>
              {formatReplayDuration(replay.currentTimeMs)} /{' '}
              {formatReplayDuration(replay.durationMs)}
            </strong>
          </div>
        </div>
        <div className="diagnostics-code">capture: {replay.captureName}</div>
        <div className="diagnostics-actions">
          <button
            className="diagnostics-button"
            disabled={recording.active || status.phase !== 'live' || replayActive}
            onClick={onStartCapture}
            type="button"
          >
            Start Capture
          </button>
          <button
            className="diagnostics-button"
            disabled={!recording.active}
            onClick={onStopCapture}
            type="button"
          >
            Stop + Save
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            onClick={onLoadReplay}
            type="button"
          >
            Load Capture
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            disabled={replay.mode === 'idle'}
            onClick={onToggleReplayPlayback}
            type="button"
          >
            {replay.mode === 'playing' ? 'Pause' : 'Play'}
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            disabled={replay.mode === 'idle'}
            onClick={onStopReplay}
            type="button"
          >
            Restart
          </button>
          <button
            className="diagnostics-button diagnostics-button--ghost"
            disabled={replay.mode === 'idle'}
            onClick={onClearReplay}
            type="button"
          >
            Return To Live
          </button>
        </div>
        <label className="diagnostics-slider">
          <span>Replay scrub</span>
          <input
            disabled={replay.mode === 'idle' || replay.durationMs <= 0}
            max={1}
            min={0}
            onChange={(event) => {
              onSeekReplay(Number(event.target.value));
            }}
            step={0.001}
            type="range"
            value={replayProgress}
          />
        </label>
        {replayError ? (
          <div className="diagnostics-error">{replayError}</div>
        ) : null}
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Proof wave</div>
        <div className="diagnostics-grid diagnostics-grid--dense">
          <div>
            <span>mission</span>
            <strong>{runJournalStatus.proofMission?.label ?? proofMissionLabel ?? 'n/a'}</strong>
          </div>
          <div>
            <span>scenario</span>
            <strong>{formatProofScenarioLabel(proofScenarioKind)}</strong>
          </div>
          <div>
            <span>session</span>
            <strong>
              {sessionInterventionSummary.sessionStartedAtMs === null ? 'idle' : 'active'}
            </strong>
          </div>
          <div>
            <span>no-touch</span>
            <strong>{noTouchWindowLabel}</strong>
          </div>
          <div>
            <span>interventions</span>
            <strong>{sessionInterventionSummary.interventionCount}</strong>
          </div>
        </div>
        <div className="diagnostics-code">
          Mission selection lives in Backstage {'>'} Capture. Armed proof locks the
          mission snapshot into the run package and disables shortcut steering.
        </div>
        <div className="diagnostics-code">
          Last intervention:{' '}
          {sessionInterventionSummary.lastInterventionReason ?? 'none since Start Show'}
        </div>
        {runJournalStatus.readiness &&
        runJournalStatus.readiness.checks.some((check) => !check.passed) ? (
          <div className="diagnostics-code">
            readiness blockers:{' '}
            {runJournalStatus.readiness.checks
              .filter((check) => !check.passed)
              .map((check) => check.reason)
              .join(' | ')}
          </div>
        ) : null}
        {runJournalStatus.proofValidity?.recoveryGuidance ? (
          <div className="diagnostics-code">
            recovery: {runJournalStatus.proofValidity.recoveryGuidance}
          </div>
        ) : null}
      </div>

      <div className="diagnostics-section">
        <div className="diagnostics-section-title">Auto evidence capture</div>
        <div className="diagnostics-grid diagnostics-grid--dense">
          <div>
            <span>status</span>
            <strong>
              {replayActive
                ? 'paused for replay'
                : autoCaptureStatus.enabled
                  ? 'armed'
                  : 'off'}
            </strong>
          </div>
          <div>
            <span>browser dl</span>
            <strong>{autoCaptureStatus.autoDownload ? 'on' : 'off'}</strong>
          </div>
          <div>
            <span>folder</span>
            <strong>
              {captureFolder.ready
                ? captureFolder.folderName ?? 'ready'
                : captureFolder.folderName
                  ? `${captureFolder.folderName} (re-arm)`
                  : captureFolder.supported
                    ? 'not set'
                    : 'unsupported'}
            </strong>
          </div>
          <div>
            <span>folder save</span>
            <strong>{captureFolder.autoSave ? 'armed' : 'off'}</strong>
          </div>
          <div>
            <span>proof stills</span>
            <strong>{autoCaptureStatus.proofStillsEnabled ? 'armed' : 'off'}</strong>
          </div>
          <div>
            <span>pending</span>
            <strong>{autoCaptureStatus.pending ? autoCaptureStatus.pendingLabel : 'idle'}</strong>
          </div>
          <div>
            <span>profile</span>
            <strong>{autoCaptureStatus.currentTriggerProfile ?? autoCaptureStatus.latestTriggerProfile ?? 'n/a'}</strong>
          </div>
          <div>
            <span>captures</span>
            <strong>{autoCaptureStatus.captureCount}</strong>
          </div>
          <div>
            <span>latest</span>
            <strong>{autoCaptureStatus.latestTriggerLabel ?? 'none'}</strong>
          </div>
          <div>
            <span>duration</span>
            <strong>{formatReplayDuration(autoCaptureStatus.latestDurationMs)}</strong>
          </div>
          <div>
            <span>saved stills</span>
            <strong>{autoCaptureStatus.latestProofStillCount}</strong>
          </div>
        </div>
        <div className="diagnostics-code">
          latest label: {autoCaptureStatus.latestLabel ?? 'none'}
        </div>
        <div className="diagnostics-code">
          latest reason: {autoCaptureStatus.latestTriggerReason ?? 'No auto capture has been finalized yet.'}
        </div>
        <div className="diagnostics-code">
          source integrity: mode={audio.sourceMode} label={audio.deviceLabel || 'unknown'} display=
          {audio.displayAudioGranted ? 'granted' : 'none'} raw={audio.rawPathGranted ? 'clean' : 'compromised'}
        </div>
        <div className="diagnostics-code">
          calibration: p20 rms={formatNumber(audio.calibrationRmsPercentile20)} p90 peak=
          {formatNumber(audio.calibrationPeakPercentile90)} floor={formatNumber(audio.noiseFloor)} ceiling=
          {formatNumber(audio.adaptiveCeiling)}
        </div>
        <div className="diagnostics-code">
          capture folder: {captureFolder.folderName ?? 'not selected'} | last saved: {captureFolder.lastSavedLabel ?? 'none'}
        </div>
        <div className="diagnostics-code">
          recommended folder: repo `captures/inbox` for active auto-save batches; keep `canonical` and `archive` out of the live inbox loop.
        </div>
        <div className="diagnostics-code">
          in-app recent window: {recentAutoCaptures.length} captures kept ready for quick replay/load. Folder auto-save can continue beyond that without a session cap.
        </div>
        {captureFolder.folderName && !captureFolder.folderName.includes('inbox') ? (
          <div className="diagnostics-code">
            warning: this folder is not the preferred live inbox target. Prefer `captures/inbox` so active evidence stays separate from canonical and archived material.
          </div>
        ) : null}
        {captureFolder.error ? (
          <div className="diagnostics-error">{captureFolder.error}</div>
        ) : null}
        {latestAutoCapture ? (
          <div className="diagnostics-code">
            peaks: drop={formatNumber(latestAutoCapture.peakDropImpact)} section=
            {formatNumber(latestAutoCapture.peakSectionChange)} beat=
            {formatNumber(latestAutoCapture.peakBeatConfidence)} music=
            {formatNumber(latestAutoCapture.peakMusicConfidence)}
          </div>
        ) : null}
        {recentAutoCaptures.length > 0 ? (
          <div className="diagnostics-actions diagnostics-actions--stack">
            {recentAutoCaptures.map((capture) => (
              <div className="diagnostics-code" key={capture.id}>
                <strong>{capture.triggerLabel}</strong> | {capture.label} |{' '}
                {formatReplayDuration(capture.durationMs)}
                <div className="diagnostics-actions">
                  <button
                    className="diagnostics-button diagnostics-button--secondary"
                    onClick={() => {
                      onLoadAutoCapture(capture.id);
                    }}
                    type="button"
                  >
                    Load
                  </button>
                  <button
                    className="diagnostics-button diagnostics-button--secondary"
                    onClick={() => {
                      onDownloadAutoCapture(capture.id);
                    }}
                    type="button"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="diagnostics-actions">
          <button
            className="diagnostics-button"
            disabled={!captureFolder.supported}
            onClick={onChooseCaptureFolder}
            type="button"
          >
            {captureFolder.folderName ? 'Choose Capture Folder Again' : 'Choose Capture Folder'}
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            disabled={!captureFolder.supported || !captureFolder.ready}
            onClick={onToggleAutoSaveToFolder}
            type="button"
          >
            {captureFolder.autoSave ? 'Turn Folder Auto Save Off' : 'Turn Folder Auto Save On'}
          </button>
          <button
            className="diagnostics-button"
            disabled={status.phase !== 'live' || replayActive}
            onClick={onToggleAutoCapture}
            type="button"
          >
            {autoCaptureStatus.enabled ? 'Disable Auto Capture' : 'Enable Auto Capture'}
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            onClick={onToggleAutoDownload}
            type="button"
          >
            {autoCaptureStatus.autoDownload ? 'Turn Browser Download Off' : 'Turn Browser Download On'}
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            onClick={onToggleProofStills}
            type="button"
          >
            {autoCaptureStatus.proofStillsEnabled ? 'Turn Proof Stills Off' : 'Turn Proof Stills On'}
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            disabled={!latestAutoCapture}
            onClick={onLoadLatestAutoCapture}
            type="button"
          >
            Load Latest Auto
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            disabled={!latestAutoCapture}
            onClick={onDownloadLatestAutoCapture}
            type="button"
          >
            Download Latest Auto
          </button>
          <button
            className="diagnostics-button diagnostics-button--secondary"
            disabled={!latestAutoCapture || !captureFolder.ready}
            onClick={onSaveLatestAutoCaptureToFolder}
            type="button"
          >
            Save Latest To Folder
          </button>
          <button
            className="diagnostics-button diagnostics-button--ghost"
            disabled={!captureFolder.folderName}
            onClick={onForgetCaptureFolder}
            type="button"
          >
            Forget Capture Folder
          </button>
          <button
            className="diagnostics-button diagnostics-button--ghost"
            disabled={autoCaptureStatus.captureCount === 0}
            onClick={onClearAutoCaptures}
            type="button"
          >
            Clear Auto Captures
          </button>
        </div>
        {replayActive ? (
          <div className="diagnostics-code">
            Auto evidence capture is paused while replay mode is active. Return to live to arm new captures.
          </div>
        ) : null}
      </div>

      {audio.warnings.length > 0 || renderer.warnings.length > 0 ? (
        <div className="diagnostics-section">
          <div className="diagnostics-section-title">Warnings</div>
          <ul className="diagnostics-warnings">
            {[...renderer.warnings, ...audio.warnings].map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
