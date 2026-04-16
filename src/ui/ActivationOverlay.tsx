import { useEffect, useState } from 'react';
import type { AudioEngineStatus } from '../types/audio';
import type { RendererDiagnostics } from '../engine/VisualizerEngine';
import type { ListeningMode } from '../types/audio';
import {
  getPresetLabel,
  QUICK_START_PROFILES,
  type QuickStartProfileId,
  type UserTuningPreset
} from '../types/tuning';

type ActivationOverlayProps = {
  bootStep: string;
  status: AudioEngineStatus;
  renderer: RendererDiagnostics;
  sourceMode: ListeningMode;
  preset: UserTuningPreset;
  activeQuickStartId: QuickStartProfileId | null;
  onSourceModeChange: (mode: ListeningMode) => void;
  onApplyQuickStart: (quickStartId: QuickStartProfileId) => void;
  onStart: () => void;
  suppressed?: boolean;
};

type BootStage = {
  id: 'permission' | 'engine' | 'calibration';
  label: string;
  hint: string;
};

const BOOT_STAGES: BootStage[] = [
  {
    id: 'permission',
    label: 'Permission',
    hint: 'Request access to the selected input source.'
  },
  {
    id: 'engine',
    label: 'Engine',
    hint: 'Boot the listening graph.'
  },
  {
    id: 'calibration',
    label: 'Calibration',
    hint: 'Read the room before going live.'
  }
];

export function ActivationOverlay({
  bootStep,
  status,
  renderer,
  sourceMode,
  preset,
  activeQuickStartId,
  onSourceModeChange,
  onApplyQuickStart,
  onStart,
  suppressed = false
}: ActivationOverlayProps) {
  const [manualInputOpen, setManualInputOpen] = useState(false);
  const isBusy =
    status.phase === 'requesting-permission' ||
    status.phase === 'booting' ||
    status.phase === 'calibrating';
  const showOverlay = status.phase !== 'live';
  const activeQuickStart = activeQuickStartId
    ? QUICK_START_PROFILES[activeQuickStartId]
    : null;
  const sourceModeLabel =
    sourceMode === 'system-audio'
      ? 'Use PC Audio'
      : sourceMode === 'hybrid'
        ? 'Use Both'
        : 'Use Microphone';

  const sourceTip =
    sourceMode === 'system-audio'
      ? 'Chrome will open a share picker. Choose a source with audio enabled, calibrate with playback paused or very low, then let the music drive the show.'
      : sourceMode === 'hybrid'
        ? 'Chrome will ask for PC audio and the room should stay quiet. Keep playback paused or very low for calibration, then bring both back in.'
        : 'Keep music off during calibration. HVAC and normal room tone are fine.';

  const settingsTip =
    sourceMode === 'system-audio'
      ? 'Start with Music On This PC. If it still feels shy, raise Wake first, then Intensity.'
      : sourceMode === 'hybrid'
        ? 'Start with Big Show Hybrid. Judge the base behavior before opening the full menu.'
        : 'Start with Music In The Room. If the world feels too still, raise Wake, then World Activity.';

  const startLabel =
    status.phase === 'error'
      ? 'Retry Listening'
      : isBusy
        ? 'Waking The Room'
        : sourceMode === 'system-audio'
          ? 'Start PC Audio'
          : sourceMode === 'hybrid'
            ? 'Start Hybrid Show'
            : 'Start Room Listening';

  useEffect(() => {
    if (activeQuickStartId !== null) {
      setManualInputOpen(false);
    }
  }, [activeQuickStartId]);

  const resolveStageState = (stageId: BootStage['id']) => {
    switch (stageId) {
      case 'permission':
        if (
          status.phase === 'requesting-permission' ||
          status.phase === 'booting' ||
          status.phase === 'calibrating' ||
          status.phase === 'live'
        ) {
          return status.phase === 'requesting-permission' ? 'active' : 'done';
        }

        return status.phase === 'error' ? 'error' : 'idle';
      case 'engine':
        if (status.phase === 'booting') {
          return 'active';
        }

        if (status.phase === 'calibrating' || status.phase === 'live') {
          return 'done';
        }

        return 'idle';
      case 'calibration':
        if (status.phase === 'calibrating') {
          return 'active';
        }

        if (status.phase === 'live') {
          return 'done';
        }

        return 'idle';
    }
  };

  if (!showOverlay || suppressed) {
    return null;
  }

  return (
    <div className="activation-overlay">
      <div className="activation-panel">
        <div className="activation-eyebrow">Room instrument</div>
        <h1>Obsidian Bloom</h1>
        <p>
          Choose the listening path that matches the way music is actually
          reaching the room. Let calibration read that baseline first, then let
          the show wake up around it.
        </p>
        <div className="activation-source-mode">
          <span className="activation-source-mode__label">Quick starts</span>
          <div className="activation-quickstarts">
            {Object.values(QUICK_START_PROFILES).map((profile) => (
              <button
                className={`activation-quickstart ${activeQuickStart?.id === profile.id ? 'activation-quickstart--active' : ''}`}
                key={profile.id}
                onClick={() => {
                  onApplyQuickStart(profile.id);
                }}
                type="button"
              >
                <strong>{profile.label}</strong>
                <span>{profile.hint}</span>
                <small>
                  {profile.sourceMode === 'system-audio'
                    ? 'Uses PC Audio'
                    : profile.sourceMode === 'hybrid'
                      ? 'Uses Both'
                      : 'Uses Microphone'}{' '}
                  + {getPresetLabel(profile.preset)}
                </small>
              </button>
            ))}
          </div>
        </div>
        <div className="activation-current-path">
          <span className="activation-current-path__label">Selected launch path</span>
          <strong>
            {activeQuickStart
              ? `${activeQuickStart.label} (${getPresetLabel(activeQuickStart.preset)})`
              : `Manual input setup (${getPresetLabel(preset)})`}
          </strong>
          <span className="activation-current-path__detail">
            {activeQuickStart
              ? `${sourceModeLabel} with ${getPresetLabel(activeQuickStart.preset)} as the opening show stance.`
              : `${sourceModeLabel} with ${getPresetLabel(preset)} as the current starting preset.`}
          </span>
        </div>
        <div className="activation-source-mode">
          <button
            className="activation-secondary-toggle"
            onClick={() => {
              setManualInputOpen((current) => !current);
            }}
            type="button"
          >
            {manualInputOpen ? 'Hide Manual Input Setup' : 'Manual Input Setup'}
          </button>
          {manualInputOpen ? (
            <div className="activation-manual-source">
              <span className="activation-source-mode__label">Input source override</span>
              <div className="activation-source-mode__options">
                {[
                  ['room-mic', 'Use Microphone'],
                  ['system-audio', 'Use PC Audio'],
                  ['hybrid', 'Use Both']
                ].map(([mode, label]) => (
                  <button
                    className={`activation-source-mode__button ${sourceMode === mode ? 'activation-source-mode__button--active' : ''}`}
                    key={mode}
                    onClick={() => {
                      onSourceModeChange(mode as ListeningMode);
                    }}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="activation-manual-source__hint">
                Use this only if you want to override the quick starts and choose the source path yourself.
              </div>
            </div>
          ) : null}
        </div>
        <div className="activation-tips">
          <div>
            <strong>Calibrate clean</strong>
            <span>{sourceTip}</span>
          </div>
          <div>
            <strong>First moves</strong>
            <span>{settingsTip}</span>
          </div>
          <div>
            <strong>Keyboard</strong>
            <span>
              Press F for fullscreen. Press M for the full menu. When the menu
              is closed in fullscreen, the screen becomes visualization-only.
            </span>
          </div>
        </div>
        <div className="activation-boot">
          {BOOT_STAGES.map((stage) => {
            const stageState = resolveStageState(stage.id);

            return (
              <div
                className={`activation-stage activation-stage--${stageState}`}
                key={stage.id}
              >
                <div className="activation-stage__marker" />
                <div>
                  <strong>{stage.label}</strong>
                  <span>{stage.hint}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="activation-status">{status.message}</div>
        <div className="activation-meta">
          <span>Renderer: {renderer.backend}</span>
          <span>Boot step: {bootStep}</span>
        </div>
        {status.error ? <div className="activation-error">{status.error}</div> : null}
        {renderer.error ? (
          <div className="activation-error">{renderer.error}</div>
        ) : null}
        <button
          className="activation-button"
          disabled={isBusy || !renderer.ready}
          onClick={onStart}
          type="button"
        >
          {startLabel}
        </button>
      </div>
    </div>
  );
}
