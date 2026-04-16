import { useState } from 'react';
import type { AudioDiagnostics, ListeningMode, SourceDescriptor } from '../types/audio';
import {
  deriveSettingsHealthSummary,
  formatControlValue,
  getPresetLabel,
  isQuickStartActive,
  QUICK_START_PROFILES,
  type AccentBias,
  type NumericUserControlKey,
  type QuickStartProfileId,
  type UserControlState,
  type UserTuningPreset
} from '../types/tuning';
import type { QualityTier } from '../engine/VisualizerEngine';

type SettingsPanelProps = {
  controls: UserControlState;
  audio: AudioDiagnostics;
  audioInputs: SourceDescriptor[];
  selectedInputId: string | null;
  activeInputLabel: string;
  sourceMode: ListeningMode;
  qualityTier: QualityTier;
  live: boolean;
  immersive: boolean;
  isFullscreen: boolean;
  onApplyPreset: (preset: UserTuningPreset) => void;
  onApplyQuickStart: (quickStartId: QuickStartProfileId) => void;
  onSensitivityChange: (value: number) => void;
  onInputGainChange: (value: number) => void;
  onEqLowChange: (value: number) => void;
  onEqMidChange: (value: number) => void;
  onEqHighChange: (value: number) => void;
  onFramingChange: (value: number) => void;
  onEnergyChange: (value: number) => void;
  onWorldActivityChange: (value: number) => void;
  onSpectacleChange: (value: number) => void;
  onGeometryChange: (value: number) => void;
  onRadianceChange: (value: number) => void;
  onBeatDriveChange: (value: number) => void;
  onEventfulnessChange: (value: number) => void;
  onAccentBiasChange: (value: AccentBias) => void;
  onAtmosphereChange: (value: number) => void;
  onColorBiasChange: (value: number) => void;
  onSourceModeChange: (mode: ListeningMode) => void;
  onInputDeviceChange: (deviceId: string) => void;
  onToggleFullscreen: () => void;
  onRecalibrate: () => void;
  onReset: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const PRESET_DETAILS: Array<{
  id: UserTuningPreset;
  hint: string;
}> = [
  {
    id: 'still',
    hint: 'Silence-first, suspended, and gallery-like.'
  },
  {
    id: 'room',
    hint: 'Balanced ambient chamber behavior.'
  },
  {
    id: 'lift',
    hint: 'Best all-around preset when you want music to feel alive.'
  },
  {
    id: 'pulse',
    hint: 'Bigger rhythmic show with harder consequences.'
  }
];

const ACCENT_BIAS_OPTIONS: Array<{
  id: AccentBias;
  label: string;
  hint: string;
}> = [
  {
    id: 'balanced',
    label: 'Balanced',
    hint: 'Smoother support motion and softer punctuation.'
  },
  {
    id: 'sharper-rhythm',
    label: 'Sharper Rhythm',
    hint: 'Harder strikes and clearer rhythmic punctuation.'
  }
];

type SliderConfig = {
  key: NumericUserControlKey;
  label: string;
  hint: string;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
};

type SliderRowProps = {
  label: string;
  hint: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  valueLabel: string;
  onChange: (value: number) => void;
};

function SliderRow({
  label,
  hint,
  lowLabel,
  highLabel,
  value,
  valueLabel,
  onChange
}: SliderRowProps) {
  return (
    <label className="setting-row">
      <div className="setting-row__head">
        <span>{label}</span>
        <strong>{valueLabel}</strong>
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
      <div className="setting-row__scale">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="setting-row__hint">{hint}</div>
    </label>
  );
}

export function SettingsPanel({
  controls,
  audio,
  audioInputs,
  selectedInputId,
  activeInputLabel,
  sourceMode,
  qualityTier,
  live,
  immersive,
  isFullscreen,
  onApplyPreset,
  onApplyQuickStart,
  onSensitivityChange,
  onInputGainChange,
  onEqLowChange,
  onEqMidChange,
  onEqHighChange,
  onFramingChange,
  onEnergyChange,
  onWorldActivityChange,
  onSpectacleChange,
  onGeometryChange,
  onRadianceChange,
  onBeatDriveChange,
  onEventfulnessChange,
  onAccentBiasChange,
  onAtmosphereChange,
  onColorBiasChange,
  onSourceModeChange,
  onInputDeviceChange,
  onToggleFullscreen,
  onRecalibrate,
  onReset,
  open,
  setOpen
}: SettingsPanelProps) {
  const [advancedLookOpen, setAdvancedLookOpen] = useState(false);
  const [inputRepairOpen, setInputRepairOpen] = useState(false);
  const sourceModes: Array<{
    id: ListeningMode;
    label: string;
    hint: string;
  }> = [
    {
      id: 'room-mic',
      label: 'Use Microphone',
      hint: 'React to the room as the built-in mic hears it.'
    },
    {
      id: 'system-audio',
      label: 'Use PC Audio',
      hint: 'React to audio shared directly from Chrome screen/tab capture.'
    },
    {
      id: 'hybrid',
      label: 'Use Both',
      hint: 'Combine direct PC audio with live room behavior.'
    }
  ];
  const activeSourceLabel =
    sourceModes.find((option) => option.id === sourceMode)?.label ?? 'Input source';
  const {
    activeQuickStart,
    recommendedQuickStart,
    customSummary,
    customChangeCount,
    recalibrateLabel,
    inputRepairRecommended,
    pathHealthItems
  } = deriveSettingsHealthSummary(controls, sourceMode, audio);
  const quickControls: SliderConfig[] = [
    {
      key: 'sensitivity',
      label: 'Wake',
      hint: 'How easily the system decides the room is worth responding to.',
      lowLabel: 'More withheld',
      highLabel: 'Wakes sooner',
      onChange: onSensitivityChange
    },
    {
      key: 'energy',
      label: 'Intensity',
      hint: 'How far the performance physically commits once it wakes.',
      lowLabel: 'Restrained',
      highLabel: 'Harder commit',
      onChange: onEnergyChange
    },
    {
      key: 'framing',
      label: 'Composition',
      hint: 'Hero close-up versus a wider chamber composition.',
      lowLabel: 'Tighter',
      highLabel: 'Wider chamber',
      onChange: onFramingChange
    },
    {
      key: 'spectacle',
      label: 'Show Scale',
      hint: 'How much the whole frame behaves like a show instead of a study.',
      lowLabel: 'Study-like',
      highLabel: 'Room-scale',
      onChange: onSpectacleChange
    },
    {
      key: 'worldActivity',
      label: 'World Activity',
      hint: 'How much the chamber and background participate versus the hero.',
      lowLabel: 'Hero-led',
      highLabel: 'World-led',
      onChange: onWorldActivityChange
    }
  ];
  const quickDockControls = quickControls.filter((slider) =>
    ['sensitivity', 'energy', 'spectacle', 'worldActivity'].includes(slider.key)
  );

  const showControls: SliderConfig[] = [
    {
      key: 'geometry',
      label: 'Architecture',
      hint: 'Organic membranes versus stronger chamber architecture.',
      lowLabel: 'Organic',
      highLabel: 'Architectural',
      onChange: onGeometryChange
    },
    {
      key: 'radiance',
      label: 'Radiance',
      hint: 'Dark withholding versus a more luminous reveal.',
      lowLabel: 'Dark',
      highLabel: 'Radiant',
      onChange: onRadianceChange
    },
    {
      key: 'beatDrive',
      label: 'Rhythm Lock',
      hint: 'Drift and atmosphere versus tighter rhythmic choreography.',
      lowLabel: 'Drift',
      highLabel: 'Beat-led',
      onChange: onBeatDriveChange
    },
    {
      key: 'atmosphere',
      label: 'Air',
      hint: 'How much haze, field, and chamber air join the performance.',
      lowLabel: 'Lean',
      highLabel: 'Heavy air',
      onChange: onAtmosphereChange
    }
  ];

  const advancedShowControls: SliderConfig[] = [
    {
      key: 'eventfulness',
      label: 'Macro Spend',
      hint: 'How often the show is willing to spend rare macro moments.',
      lowLabel: 'Rare',
      highLabel: 'Frequent',
      onChange: onEventfulnessChange
    },
    {
      key: 'colorBias',
      label: 'Temperature',
      hint: 'Cool teal/graphite versus warmer amber/violet tendency.',
      lowLabel: 'Cool',
      highLabel: 'Warm',
      onChange: onColorBiasChange
    }
  ];

  const inputTrimHint =
    sourceMode === 'system-audio'
      ? 'Pre-analysis trim for shared PC audio. Neutral is 0.'
      : sourceMode === 'hybrid'
        ? 'Pre-analysis trim for the mixed room + PC audio path. Neutral is 0.'
        : 'Pre-analysis trim for the microphone path. Neutral is 0.';

  const lowBiasHint =
    sourceMode === 'system-audio'
      ? 'Bias the interpreter toward sub pressure and bass body in shared PC audio.'
      : 'Bias the interpreter toward sub pressure and bass body.';

  const midBiasHint =
    sourceMode === 'system-audio'
      ? 'Bias toward vocals, cadence, and low-mid musical body in shared PC audio.'
      : 'Bias toward speech, cadence, and low-mid musical body.';

  const highBiasHint =
    sourceMode === 'system-audio'
      ? 'Bias toward shimmer, air, and impact edges in shared PC audio.'
      : 'Bias toward shimmer, air, and impact edges.';

  const audioControls: SliderConfig[] = [
    {
      key: 'inputGain',
      label: 'Input Trim',
      hint: inputTrimHint,
      lowLabel: 'Lower trim',
      highLabel: 'Higher trim',
      onChange: onInputGainChange
    },
    {
      key: 'eqLow',
      label: 'Low Bias',
      hint: lowBiasHint,
      lowLabel: 'Less bass',
      highLabel: 'More bass',
      onChange: onEqLowChange
    },
    {
      key: 'eqMid',
      label: 'Mid Bias',
      hint: midBiasHint,
      lowLabel: 'Less mid',
      highLabel: 'More mid',
      onChange: onEqMidChange
    },
    {
      key: 'eqHigh',
      label: 'High Bias',
      hint: highBiasHint,
      lowLabel: 'Softer highs',
      highLabel: 'Sharper highs',
      onChange: onEqHighChange
    }
  ];

  const showQuickDock = live && !isFullscreen && !open;
  const quickDockProfileLabel = activeQuickStart?.label ?? 'Custom Mix';

  return (
    <>
      {showQuickDock ? (
        <aside className="quick-dock">
          <div className="quick-dock__head">
            <div>
              <span className="settings-eyebrow">Quick controls</span>
              <strong>{quickDockProfileLabel}</strong>
              <small className="quick-dock__subhead">
                {getPresetLabel(controls.preset)} preset
              </small>
            </div>
            <div className="quick-dock__actions">
              <button
                className="quick-dock__button"
                onClick={() => {
                  setOpen(true);
                }}
                type="button"
              >
                Menu
              </button>
              <button
                className="quick-dock__button"
                onClick={onToggleFullscreen}
                type="button"
              >
                Fullscreen
              </button>
            </div>
          </div>

          <div className="quick-dock__quickstarts">
            {Object.values(QUICK_START_PROFILES).map((profile) => (
              <button
                className={`quick-preset ${activeQuickStart?.id === profile.id ? 'quick-preset--active' : ''}`}
                key={profile.id}
                onClick={() => {
                  onApplyQuickStart(profile.id);
                }}
                type="button"
              >
                {profile.id === 'pc-music'
                  ? 'PC Music'
                  : profile.id === 'room-music'
                    ? 'Room Music'
                    : 'Hybrid'}
              </button>
            ))}
          </div>

          <div className="quick-dock__presets">
            {PRESET_DETAILS.map((preset) => (
              <button
                className={`quick-preset ${controls.preset === preset.id ? 'quick-preset--active' : ''}`}
                key={preset.id}
                onClick={() => {
                  onApplyPreset(preset.id);
                }}
                type="button"
              >
                {getPresetLabel(preset.id)}
              </button>
            ))}
          </div>

          <div className="quick-dock__grid">
            {quickDockControls.map((slider) => (
              <SliderRow
                hint={slider.hint}
                highLabel={slider.highLabel}
                key={slider.key}
                label={slider.label}
                lowLabel={slider.lowLabel}
                onChange={slider.onChange}
                value={controls[slider.key]}
                valueLabel={formatControlValue(slider.key, controls[slider.key])}
              />
            ))}
          </div>

          <div className="quick-dock__footer">
            <div className="quick-dock__footer-copy">
              <span className="quick-dock__footer-line">
                {activeSourceLabel}
              </span>
              <span className="quick-dock__footer-line quick-dock__footer-line--muted">
                {activeInputLabel || 'Input pending'}
              </span>
              <span className="quick-dock__footer-line quick-dock__footer-line--muted">
                {activeQuickStart
                  ? 'Menu adds Composition, look shaping, and input repair when needed.'
                  : `${customChangeCount} custom change${customChangeCount === 1 ? '' : 's'} from ${recommendedQuickStart.label}: ${customSummary}`}
              </span>
            </div>
            <div className="quick-dock__footer-actions">
              {!activeQuickStart ? (
                <button
                  className="quick-dock__text-button"
                  onClick={onReset}
                  type="button"
                >
                  Restore Recommended
                </button>
              ) : null}
              <button
                className="quick-dock__text-button"
                onClick={onRecalibrate}
                type="button"
              >
                {recalibrateLabel}
              </button>
            </div>
          </div>
        </aside>
      ) : null}

      {open ? (
        <aside
          className={`settings-panel settings-panel--wide ${immersive ? 'settings-panel--immersive' : ''}`}
        >
          <div className="settings-panel__header settings-panel__header--stacked">
            <div>
              <span className="settings-eyebrow">Performance system</span>
              <strong>Quick-start-led show controls</strong>
            </div>
            <div className="settings-panel__header-actions">
              <button
                className="settings-action settings-action--secondary"
                onClick={onToggleFullscreen}
                type="button"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </button>
              <button
                className="settings-action settings-action--ghost"
                onClick={() => {
                  setOpen(false);
                }}
                type="button"
              >
                Close
              </button>
            </div>
          </div>

          <section className="settings-section">
            <div className="settings-section__title">Operator Path</div>
            <div className="settings-meta-grid">
              <div>
                <span>recommended path</span>
                <strong>{recommendedQuickStart.label}</strong>
              </div>
              <div>
                <span>current state</span>
                <strong>{activeQuickStart ? 'On recommended' : `${customChangeCount} custom change${customChangeCount === 1 ? '' : 's'}`}</strong>
              </div>
              <div>
                <span>source path</span>
                <strong>{activeSourceLabel}</strong>
              </div>
              <div>
                <span>input</span>
                <strong>{activeInputLabel || 'Pending source or microphone'}</strong>
              </div>
            </div>
            <div className="settings-note settings-note--card">
              Start with <strong>Music On This PC</strong>, <strong>Music In The Room</strong>, or <strong>Big Show Hybrid</strong>. Use <strong>Live Shaping</strong> first. Open <strong>Advanced Look Tuning</strong> or <strong>Input Repair</strong> only when captures show a specific problem.
              {!activeQuickStart ? (
                <>
                  <br />
                  Current custom state: <strong>{customSummary}</strong>
                </>
              ) : null}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section__title">Quick Starts</div>
            <div className="settings-presets">
              {Object.values(QUICK_START_PROFILES).map((profile) => (
                <button
                  className={`settings-preset ${isQuickStartActive(controls, sourceMode, profile.id) ? 'settings-preset--active' : ''}`}
                  key={profile.id}
                  onClick={() => {
                    onApplyQuickStart(profile.id);
                  }}
                  type="button"
                >
                  <span>{profile.label}</span>
                  <small>{profile.hint}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section__title">Presets</div>
            <div className="settings-presets">
              {PRESET_DETAILS.map((preset) => (
                <button
                  className={`settings-preset ${controls.preset === preset.id ? 'settings-preset--active' : ''}`}
                  key={preset.id}
                  onClick={() => {
                    onApplyPreset(preset.id);
                  }}
                  type="button"
                >
                  <span>{getPresetLabel(preset.id)}</span>
                  <small>{preset.hint}</small>
                </button>
              ))}
            </div>
            <div className="settings-note">
              Presets change the overall stance. Quick starts remain the main product path because they bind source mode and starting posture together.
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section__title">Path Health</div>
            <div className="settings-health-list">
              {pathHealthItems.map((item, index) => (
                <div
                  className={`settings-health-item settings-health-item--${item.tone}`}
                  key={`${item.title}-${index}`}
                >
                  <span>{item.title}</span>
                  <strong>{item.body}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section__title">Live Shaping</div>
            <div className="settings-list">
              {quickControls.map((slider) => (
                <SliderRow
                  hint={slider.hint}
                  highLabel={slider.highLabel}
                  key={slider.key}
                  label={slider.label}
                  lowLabel={slider.lowLabel}
                  onChange={slider.onChange}
                  value={controls[slider.key]}
                  valueLabel={formatControlValue(slider.key, controls[slider.key])}
                />
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section__title">Look Shaping</div>
            <div className="settings-list">
              {showControls.map((slider) => (
                <SliderRow
                  hint={slider.hint}
                  highLabel={slider.highLabel}
                  key={slider.key}
                  label={slider.label}
                  lowLabel={slider.lowLabel}
                  onChange={slider.onChange}
                  value={controls[slider.key]}
                  valueLabel={formatControlValue(slider.key, controls[slider.key])}
                />
              ))}
            </div>
            <div className="settings-note">
              These are the main authored look controls. If one of them does not solve a capture finding, leave it alone and fix the show logic instead.
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section__title">Advanced Look Tuning</div>
            <div className="settings-note settings-note--card">
              Use this only when reports show monopoly, missing lanes, or a persistent warm/cool or macro-spend bias. This is tuning territory, not the normal operator path.
            </div>
            <div className="settings-actions">
              <button
                className="settings-action settings-action--secondary"
                onClick={() => {
                  setAdvancedLookOpen((current) => !current);
                }}
                type="button"
              >
                {advancedLookOpen ? 'Hide Advanced Look Tuning' : 'Open Advanced Look Tuning'}
              </button>
            </div>
            {advancedLookOpen ? (
              <>
                <div className="settings-list">
                  {advancedShowControls.map((slider) => (
                    <SliderRow
                      hint={slider.hint}
                      highLabel={slider.highLabel}
                      key={slider.key}
                      label={slider.label}
                      lowLabel={slider.lowLabel}
                      onChange={slider.onChange}
                      value={controls[slider.key]}
                      valueLabel={formatControlValue(slider.key, controls[slider.key])}
                    />
                  ))}
                </div>

                <div className="settings-segmented">
                  <span className="settings-segmented__label">Accent Bias</span>
                  <div className="settings-segmented__options">
                    {ACCENT_BIAS_OPTIONS.map((option) => (
                      <button
                        className={`settings-chip ${controls.accentBias === option.id ? 'settings-chip--active' : ''}`}
                        key={option.id}
                        onClick={() => {
                          onAccentBiasChange(option.id);
                        }}
                        type="button"
                      >
                        <span>{option.label}</span>
                        <small>{option.hint}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </section>

          <section className="settings-section">
            <div className="settings-section__title">Input & Detection</div>
            <div className="settings-note settings-note--card">
              <strong>{activeSourceLabel}</strong>
              <br />
              Active input: {activeInputLabel || 'Pending source or microphone'}
              <br />
              {inputRepairRecommended
                ? 'Input Repair is worth opening now because the current path shows a real warning or drift.'
                : 'Input Repair can stay closed unless captures show a clear hearing problem.'}
            </div>
            <div className="settings-segmented">
              <span className="settings-segmented__label">Input Source</span>
              <div className="settings-segmented__options">
                {sourceModes.map((option) => (
                  <button
                    className={`settings-chip ${sourceMode === option.id ? 'settings-chip--active' : ''}`}
                    key={option.id}
                    onClick={() => {
                      onSourceModeChange(option.id);
                    }}
                    type="button"
                  >
                    <span>{option.label}</span>
                    <small>{option.hint}</small>
                  </button>
                ))}
              </div>
            </div>

            {sourceMode !== 'system-audio' ? (
            <label className="settings-field">
              <span className="settings-field__label">Microphone</span>
              <select
                className="settings-select"
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
              <div className="settings-field__hint">
                Active input: {activeInputLabel || 'Unknown microphone'}
              </div>
            </label>
            ) : (
              <div className="settings-note settings-note--card">
                PC audio mode uses Chrome's share picker. When you start or recalibrate, choose a tab, window, or screen source and make sure audio sharing is enabled.
              </div>
            )}

            <div className="settings-actions">
              <button
                className={`settings-action ${inputRepairRecommended ? '' : 'settings-action--secondary'}`}
                onClick={() => {
                  setInputRepairOpen((current) => !current);
                }}
                type="button"
              >
                {inputRepairOpen ? 'Hide Input Repair' : 'Open Input Repair'}
              </button>
              <button
                className="settings-action"
                onClick={onRecalibrate}
                type="button"
              >
                {recalibrateLabel}
              </button>
            </div>
            {inputRepairOpen ? (
              <>
                <div className="settings-list">
                  {audioControls.map((slider) => (
                    <SliderRow
                      hint={slider.hint}
                      highLabel={slider.highLabel}
                      key={slider.key}
                      label={slider.label}
                      lowLabel={slider.lowLabel}
                      onChange={slider.onChange}
                      value={controls[slider.key]}
                      valueLabel={formatControlValue(slider.key, controls[slider.key])}
                    />
                  ))}
                </div>
                <div className="settings-note">
                  Leave these neutral unless captures show a real input problem such as shyness, clipping, or obvious spectral bias.
                </div>
              </>
            ) : null}
          </section>

          <section className="settings-section">
            <div className="settings-section__title">System</div>
            <div className="settings-meta-grid">
              <div>
                <span>quality tier</span>
                <strong>{qualityTier}</strong>
              </div>
              <div>
                <span>shortcuts</span>
                <strong>F fullscreen, M menu, Shift + D diagnostics</strong>
              </div>
            </div>
            <div className="settings-actions">
              <button
                className="settings-action settings-action--secondary"
                onClick={onReset}
                type="button"
              >
                Restore Recommended
              </button>
            </div>
          </section>

          <div className="settings-note">
            Quick starts are the main product. Live Shaping is for fast steering. Look Shaping adjusts the authored language. Advanced Look Tuning and Input Repair exist to answer evidence, not to replace the quick-start path.
          </div>
        </aside>
      ) : null}
    </>
  );
}
