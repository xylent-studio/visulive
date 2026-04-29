import type { AudioDiagnostics, ListeningMode } from './audio';

export type UserTuningPreset = 'still' | 'room' | 'lift' | 'pulse';
export type AccentBias = 'balanced' | 'sharper-rhythm';
export type QuickStartProfileId =
  | 'pc-music'
  | 'room-music'
  | 'hybrid-show';

export type UserControlState = {
  preset: UserTuningPreset;
  sensitivity: number;
  inputGain: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  framing: number;
  energy: number;
  worldActivity: number;
  spectacle: number;
  geometry: number;
  radiance: number;
  beatDrive: number;
  eventfulness: number;
  accentBias: AccentBias;
  atmosphere: number;
  colorBias: number;
};

export type NumericUserControlKey = Exclude<
  keyof UserControlState,
  'preset' | 'accentBias'
>;

export type RuntimeTuning = UserControlState & {
  response: number;
  motion: number;
  accentStrength: number;
  eventRate: number;
  readableHeroFloor: number;
  neonStageFloor: number;
  worldBootFloor: number;
  cameraNearFloor: number;
};

type PresetBaseline = {
  response: number;
  motion: number;
  sensitivity: number;
  atmosphere: number;
  energy: number;
  framing: number;
  worldActivity: number;
  spectacle: number;
  geometry: number;
  radiance: number;
  beatDrive: number;
  eventfulness: number;
  colorBias: number;
  accentBias: AccentBias;
};

export type QuickStartProfile = {
  id: QuickStartProfileId;
  label: string;
  hint: string;
  sourceMode: ListeningMode;
  preset: UserTuningPreset;
  controls: Partial<UserControlState>;
};

export type SettingsHealthTone = 'ok' | 'warn' | 'info';

export type SettingsHealthItem = {
  tone: SettingsHealthTone;
  title: string;
  body: string;
};

export type SettingsHealthSummary = {
  activeQuickStart: QuickStartProfile | null;
  recommendedQuickStart: QuickStartProfile;
  customizedLabels: string[];
  customSummary: string;
  customChangeCount: number;
  recalibrateLabel: string;
  inputRepairRecommended: boolean;
  pathHealthItems: SettingsHealthItem[];
};

export const CONTROL_LABELS: Record<
  NumericUserControlKey | 'accentBias' | 'preset',
  string
> = {
  preset: 'Preset',
  sensitivity: 'Wake',
  inputGain: 'Input Trim',
  eqLow: 'Low Bias',
  eqMid: 'Mid Bias',
  eqHigh: 'High Bias',
  framing: 'Composition',
  energy: 'Intensity',
  worldActivity: 'World Activity',
  spectacle: 'Show Scale',
  geometry: 'Architecture',
  radiance: 'Radiance',
  beatDrive: 'Rhythm Lock',
  eventfulness: 'Macro Spend',
  accentBias: 'Accent Bias',
  atmosphere: 'Air',
  colorBias: 'Temperature'
};

export const PRESET_BASELINES: Record<UserTuningPreset, PresetBaseline> = {
  still: {
    response: 0.52,
    motion: 0.44,
    sensitivity: 0.42,
    atmosphere: 0.32,
    energy: 0.34,
    framing: 0.84,
    worldActivity: 0.24,
    spectacle: 0.22,
    geometry: 0.42,
    radiance: 0.22,
    beatDrive: 0.22,
    eventfulness: 0.16,
    colorBias: 0.38,
    accentBias: 'balanced'
  },
  room: {
    response: 0.78,
    motion: 0.7,
    sensitivity: 0.68,
    atmosphere: 0.58,
    energy: 0.64,
    framing: 0.76,
    worldActivity: 0.52,
    spectacle: 0.56,
    geometry: 0.52,
    radiance: 0.5,
    beatDrive: 0.44,
    eventfulness: 0.4,
    colorBias: 0.56,
    accentBias: 'balanced'
  },
  lift: {
    response: 0.88,
    motion: 0.82,
    sensitivity: 0.82,
    atmosphere: 0.72,
    energy: 0.78,
    framing: 0.72,
    worldActivity: 0.72,
    spectacle: 0.82,
    geometry: 0.48,
    radiance: 0.62,
    beatDrive: 0.66,
    eventfulness: 0.68,
    colorBias: 0.64,
    accentBias: 'sharper-rhythm'
  },
  pulse: {
    response: 0.96,
    motion: 0.9,
    sensitivity: 0.88,
    atmosphere: 0.68,
    energy: 0.9,
    framing: 0.64,
    worldActivity: 0.86,
    spectacle: 0.96,
    geometry: 0.7,
    radiance: 0.72,
    beatDrive: 0.88,
    eventfulness: 0.88,
    colorBias: 0.72,
    accentBias: 'sharper-rhythm'
  }
};

export const QUICK_START_PROFILES: Record<
  QuickStartProfileId,
  QuickStartProfile
> = {
  'pc-music': {
    id: 'pc-music',
    label: 'Music On This PC',
    hint: 'Best starting point when this computer is already playing the music.',
    sourceMode: 'system-audio',
    preset: 'pulse',
    controls: {
      sensitivity: 0.84,
      inputGain: 0.5,
      eqLow: 0.58,
      eqMid: 0.5,
      eqHigh: 0.6,
      framing: 0.84,
      energy: 0.9,
      worldActivity: 0.82,
      spectacle: 0.92,
      geometry: 0.58,
      radiance: 0.72,
      beatDrive: 0.86,
      eventfulness: 0.78,
      accentBias: 'sharper-rhythm',
      atmosphere: 0.8,
      colorBias: 0.7
    }
  },
  'room-music': {
    id: 'room-music',
    label: 'Music In The Room',
    hint: 'Best when the speakers are in the space and the microphone should hear the room.',
    sourceMode: 'room-mic',
    preset: 'pulse',
    controls: {
      sensitivity: 0.98,
      inputGain: 0.88,
      eqLow: 0.62,
      eqMid: 0.5,
      eqHigh: 0.58,
      framing: 0.84,
      energy: 1,
      worldActivity: 0.88,
      spectacle: 0.96,
      geometry: 0.6,
      radiance: 0.74,
      beatDrive: 0.94,
      eventfulness: 0.82,
      accentBias: 'sharper-rhythm',
      atmosphere: 0.82,
      colorBias: 0.72
    }
  },
  'hybrid-show': {
    id: 'hybrid-show',
    label: 'Big Show Hybrid',
    hint: 'The biggest, most reactive path when you want direct music plus room life.',
    sourceMode: 'hybrid',
    preset: 'pulse',
    controls: {
      sensitivity: 0.94,
      inputGain: 0.52,
      eqLow: 0.6,
      eqMid: 0.5,
      eqHigh: 0.62,
      framing: 0.82,
      energy: 1,
      worldActivity: 0.96,
      spectacle: 1,
      geometry: 0.72,
      radiance: 0.78,
      beatDrive: 0.96,
      eventfulness: 0.88,
      accentBias: 'sharper-rhythm',
      atmosphere: 0.86,
      colorBias: 0.78
    }
  }
};

export const DEFAULT_USER_CONTROL_STATE: UserControlState = {
  preset: 'lift',
  sensitivity: PRESET_BASELINES.lift.sensitivity,
  inputGain: 0.5,
  eqLow: 0.5,
  eqMid: 0.5,
  eqHigh: 0.5,
  framing: PRESET_BASELINES.lift.framing,
  energy: PRESET_BASELINES.lift.energy,
  worldActivity: PRESET_BASELINES.lift.worldActivity,
  spectacle: PRESET_BASELINES.lift.spectacle,
  geometry: PRESET_BASELINES.lift.geometry,
  radiance: PRESET_BASELINES.lift.radiance,
  beatDrive: PRESET_BASELINES.lift.beatDrive,
  eventfulness: PRESET_BASELINES.lift.eventfulness,
  accentBias: PRESET_BASELINES.lift.accentBias,
  atmosphere: PRESET_BASELINES.lift.atmosphere,
  colorBias: PRESET_BASELINES.lift.colorBias
};

function clampRuntimeValue(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value <= 0) {
    return 0;
  }

  if (value >= max) {
    return max;
  }

  return value;
}

function softCapRuntimeValue(
  value: number,
  max: number,
  knee = 1
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value <= 0) {
    return 0;
  }

  if (value <= knee) {
    return value;
  }

  const safeMax = Math.max(max, knee + 0.01);
  const range = safeMax - knee;
  const overflow = value - knee;

  return Math.min(safeMax, knee + range * (1 - Math.exp(-overflow / range)));
}

export function clampTuningValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

function sanitizePreset(value: unknown): UserTuningPreset {
  if (
    value === 'still' ||
    value === 'room' ||
    value === 'lift' ||
    value === 'pulse'
  ) {
    return value;
  }

  return DEFAULT_USER_CONTROL_STATE.preset;
}

function sanitizeAccentBias(value: unknown): AccentBias {
  if (value === 'balanced' || value === 'sharper-rhythm') {
    return value;
  }

  return DEFAULT_USER_CONTROL_STATE.accentBias;
}

export function sanitizeUserControlState(
  input: Partial<UserControlState> | null | undefined
): UserControlState {
  const preset = sanitizePreset(input?.preset);
  const defaultAtmosphere = PRESET_BASELINES[preset].atmosphere;

  return {
    preset,
    sensitivity: clampTuningValue(
      input?.sensitivity ?? DEFAULT_USER_CONTROL_STATE.sensitivity
    ),
    inputGain: clampTuningValue(
      input?.inputGain ?? DEFAULT_USER_CONTROL_STATE.inputGain
    ),
    eqLow: clampTuningValue(input?.eqLow ?? DEFAULT_USER_CONTROL_STATE.eqLow),
    eqMid: clampTuningValue(input?.eqMid ?? DEFAULT_USER_CONTROL_STATE.eqMid),
    eqHigh: clampTuningValue(input?.eqHigh ?? DEFAULT_USER_CONTROL_STATE.eqHigh),
    framing: clampTuningValue(
      input?.framing ?? PRESET_BASELINES[preset].framing
    ),
    energy: clampTuningValue(input?.energy ?? DEFAULT_USER_CONTROL_STATE.energy),
    worldActivity: clampTuningValue(
      input?.worldActivity ?? PRESET_BASELINES[preset].worldActivity
    ),
    spectacle: clampTuningValue(
      input?.spectacle ?? PRESET_BASELINES[preset].spectacle
    ),
    geometry: clampTuningValue(
      input?.geometry ?? PRESET_BASELINES[preset].geometry
    ),
    radiance: clampTuningValue(
      input?.radiance ?? PRESET_BASELINES[preset].radiance
    ),
    beatDrive: clampTuningValue(
      input?.beatDrive ?? PRESET_BASELINES[preset].beatDrive
    ),
    eventfulness: clampTuningValue(
      input?.eventfulness ?? PRESET_BASELINES[preset].eventfulness
    ),
    accentBias: sanitizeAccentBias(input?.accentBias),
    atmosphere: clampTuningValue(input?.atmosphere ?? defaultAtmosphere),
    colorBias: clampTuningValue(
      input?.colorBias ?? PRESET_BASELINES[preset].colorBias
    )
  };
}

export function parseStoredUserControlState(
  raw: string | null | undefined
): UserControlState {
  if (!raw) {
    return DEFAULT_USER_CONTROL_STATE;
  }

  try {
    return sanitizeUserControlState(
      JSON.parse(raw) as Partial<UserControlState>
    );
  } catch {
    return DEFAULT_USER_CONTROL_STATE;
  }
}

export function serializeUserControlState(state: UserControlState): string {
  return JSON.stringify(sanitizeUserControlState(state));
}

export function deriveRuntimeTuning(
  controls: UserControlState
): RuntimeTuning {
  const sanitized = sanitizeUserControlState(controls);
  const baseline = PRESET_BASELINES[sanitized.preset];
  const colorDrive = Math.abs(sanitized.colorBias - 0.5) * 2;
  const compositionDrive =
    sanitized.framing * 0.34 +
    sanitized.spectacle * 0.26 +
    sanitized.worldActivity * 0.24 +
    sanitized.radiance * 0.16;
  const sensitivityLift = 0.92 + sanitized.sensitivity * 0.48;
  const energyLift = 0.88 + sanitized.energy * 0.42;
  const beatLift = 0.9 + sanitized.beatDrive * 0.36;
  const responseHeadroom = 0.92 + sanitized.spectacle * 0.12;
  const motionHeadroom =
    0.92 +
    sanitized.sensitivity * 0.16 +
    sanitized.energy * 0.24 +
    sanitized.spectacle * 0.22 +
    sanitized.worldActivity * 0.28 +
    sanitized.beatDrive * 0.08;
  const eventRateBase =
    0.18 +
    baseline.eventfulness * 0.22 +
    Math.pow(sanitized.eventfulness, 1.08) * 0.22 +
    Math.pow(sanitized.spectacle, 1.12) * 0.12 +
    sanitized.beatDrive * 0.08;
  const readableHeroFloor = clampTuningValue(
    0.1 +
      sanitized.framing * 0.32 +
      sanitized.energy * 0.22 +
      sanitized.radiance * 0.22 +
      sanitized.spectacle * 0.24 +
      compositionDrive * 0.12 +
      colorDrive * 0.06
  );
  const neonStageFloor = clampTuningValue(
    0.08 +
      sanitized.radiance * 0.42 +
      sanitized.spectacle * 0.34 +
      sanitized.worldActivity * 0.28 +
      colorDrive * 0.16 +
      compositionDrive * 0.1
  );
  const worldBootFloor = clampTuningValue(
    0.06 +
      sanitized.worldActivity * 0.46 +
      sanitized.framing * 0.24 +
      sanitized.spectacle * 0.24 +
      sanitized.atmosphere * 0.14 +
      sanitized.energy * 0.06
  );
  const cameraNearFloor = clampTuningValue(
    0.08 +
      sanitized.framing * 0.38 +
      sanitized.energy * 0.18 +
      sanitized.spectacle * 0.22 +
      sanitized.radiance * 0.12 +
      readableHeroFloor * 0.12
  );

  return {
    ...sanitized,
    response: softCapRuntimeValue(
      baseline.response *
        sensitivityLift *
        energyLift *
        beatLift *
        responseHeadroom,
      1.75
    ),
    motion: softCapRuntimeValue(
      baseline.motion * motionHeadroom,
      1.55
    ),
    accentStrength:
      sanitized.accentBias === 'sharper-rhythm'
        ? 1.04 +
          sanitized.energy * 0.22 +
          sanitized.spectacle * 0.08 +
          sanitized.beatDrive * 0.08
        : 0.78 + sanitized.energy * 0.08 + sanitized.beatDrive * 0.04,
    eventRate: clampRuntimeValue(eventRateBase, 0.92),
    readableHeroFloor,
    neonStageFloor,
    worldBootFloor,
    cameraNearFloor
  };
}

export const DEFAULT_RUNTIME_TUNING = deriveRuntimeTuning(
  DEFAULT_USER_CONTROL_STATE
);

export function applyPresetToControlState(
  current: UserControlState,
  preset: UserTuningPreset
): UserControlState {
  const baseline = PRESET_BASELINES[preset];

  return sanitizeUserControlState({
    ...current,
    preset,
    sensitivity: baseline.sensitivity,
    energy: baseline.energy,
    framing: baseline.framing,
    worldActivity: baseline.worldActivity,
    spectacle: baseline.spectacle,
    geometry: baseline.geometry,
    radiance: baseline.radiance,
    beatDrive: baseline.beatDrive,
    eventfulness: baseline.eventfulness,
    accentBias: baseline.accentBias,
    atmosphere: baseline.atmosphere,
    colorBias: baseline.colorBias
  });
}

export function applyQuickStartToControlState(
  current: UserControlState,
  quickStartId: QuickStartProfileId
): UserControlState {
  const profile = QUICK_START_PROFILES[quickStartId];
  const presetApplied = applyPresetToControlState(current, profile.preset);

  return sanitizeUserControlState({
    ...presetApplied,
    ...profile.controls
  });
}

export function getRecommendedQuickStartProfileId(
  sourceMode: ListeningMode
): QuickStartProfileId {
  switch (sourceMode) {
    case 'system-audio':
      return 'pc-music';
    case 'hybrid':
      return 'hybrid-show';
    case 'room-mic':
    default:
      return 'room-music';
  }
}

export function isQuickStartActive(
  state: UserControlState,
  sourceMode: ListeningMode,
  quickStartId: QuickStartProfileId
): boolean {
  const profile = QUICK_START_PROFILES[quickStartId];
  const expected = applyQuickStartToControlState(state, quickStartId);
  const numericKeys = Object.keys(profile.controls).filter(
    (key) => key !== 'accentBias'
  ) as Array<Exclude<keyof UserControlState, 'preset' | 'accentBias'>>;

  if (sourceMode !== profile.sourceMode || state.preset !== profile.preset) {
    return false;
  }

  if (
    profile.controls.accentBias &&
    state.accentBias !== profile.controls.accentBias
  ) {
    return false;
  }

  return numericKeys.every((key) => {
    const actual = state[key];
    const target = expected[key];

    return Math.abs(actual - target) < 0.0001;
  });
}

export function getActiveQuickStartProfile(
  state: UserControlState,
  sourceMode: ListeningMode
): QuickStartProfile | null {
  for (const profile of Object.values(QUICK_START_PROFILES)) {
    if (isQuickStartActive(state, sourceMode, profile.id)) {
      return profile;
    }
  }

  return null;
}

export function deriveSettingsHealthSummary(
  controls: UserControlState,
  sourceMode: ListeningMode,
  audio: AudioDiagnostics
): SettingsHealthSummary {
  const activeQuickStart = getActiveQuickStartProfile(controls, sourceMode);
  const recommendedQuickStartId = getRecommendedQuickStartProfileId(sourceMode);
  const recommendedQuickStart = QUICK_START_PROFILES[recommendedQuickStartId];
  const recommendedState = applyQuickStartToControlState(
    controls,
    recommendedQuickStartId
  );
  const customizedLabels = [
    ...(controls.preset !== recommendedState.preset ? [CONTROL_LABELS.preset] : []),
    ...(controls.accentBias !== recommendedState.accentBias
      ? [CONTROL_LABELS.accentBias]
      : []),
    ...(
      Object.keys(CONTROL_LABELS).filter(
        (key) => key !== 'preset' && key !== 'accentBias'
      ) as NumericUserControlKey[]
    ).filter((key) => Math.abs(controls[key] - recommendedState[key]) >= 0.0001)
      .map((key) => CONTROL_LABELS[key])
  ];
  const customChangeCount = customizedLabels.length;
  const customSummary =
    customChangeCount > 0
      ? customizedLabels.slice(0, 4).join(', ')
      : 'On recommended launch path';
  const recalibrateLabel =
    sourceMode === 'system-audio'
      ? 'Restart Source'
      : sourceMode === 'hybrid'
        ? 'Restart Inputs'
        : 'Recalibrate Room';
  const clipped = audio.listeningFrame.clipped || audio.analysisFrame.clipped;
  const pcAudioRequired = sourceMode === 'system-audio' || sourceMode === 'hybrid';
  const pathHealthItems: SettingsHealthItem[] = [
    activeQuickStart
      ? {
          tone: 'ok',
          title: 'Recommended launch path active',
          body: `${activeQuickStart.label} is active for ${
            sourceMode === 'system-audio'
              ? 'Use PC Audio'
              : sourceMode === 'hybrid'
                ? 'Use Both'
                : 'Use Microphone'
          }. Stay here unless captures show a real failure.`
        }
      : {
          tone: customChangeCount > 4 ? 'warn' : 'info',
          title: 'Custom drift from recommended path',
          body: `${customChangeCount} setting change${
            customChangeCount === 1 ? '' : 's'
          } off ${recommendedQuickStart.label}: ${customSummary}.`
        }
  ];

  if (pcAudioRequired && !audio.displayAudioGranted) {
    pathHealthItems.push({
      tone: 'warn',
      title: 'PC audio is not currently granted',
      body: 'Restart the source and make sure Chrome share audio is enabled, or the show cannot trust the direct music path.'
    });
  }

  if (!audio.rawPathGranted) {
    pathHealthItems.push({
      tone: 'warn',
      title: 'Raw input path is compromised',
      body: 'The input path is not in its clean expected state. Restart the active source path before trusting tuning results.'
    });
  }

  if (clipped) {
    pathHealthItems.push({
      tone: 'warn',
      title: 'Clipping is currently present',
      body: 'Input clipping is active. Lower source level first, then reduce Input Repair trim only if needed.'
    });
  }

  if (sourceMode === 'room-mic' && audio.roomMusicFloorActive) {
    pathHealthItems.push({
      tone: 'info',
      title: 'Quiet room-music floor is assisting',
      body: 'The room floor support path is active. Keep this run separate from direct PC-audio truth when reviewing captures.'
    });
  }

  for (const warning of audio.warnings.slice(0, 2)) {
    pathHealthItems.push({
      tone: 'warn',
      title: 'Runtime warning',
      body: warning
    });
  }

  if (
    pathHealthItems.length === 1 &&
    activeQuickStart &&
    audio.rawPathGranted &&
    !clipped
  ) {
    pathHealthItems.push({
      tone: 'info',
      title: 'Use Advanced steering before deeper tuning',
      body: 'If the launch profile feels close, steer with World Takeover, Motion Appetite, Depth, Contrast, Palette Heat, Saturation, Impact Appetite, and Aftermath before opening repair or diagnostics.'
    });
  }

  const inputRepairRecommended =
    (!activeQuickStart && customChangeCount > 4) ||
    clipped ||
    !audio.rawPathGranted ||
    (pcAudioRequired && !audio.displayAudioGranted) ||
    audio.warnings.length > 0;

  return {
    activeQuickStart,
    recommendedQuickStart,
    customizedLabels,
    customSummary,
    customChangeCount,
    recalibrateLabel,
    inputRepairRecommended,
    pathHealthItems
  };
}

export function getPresetLabel(preset: UserTuningPreset): string {
  switch (preset) {
    case 'still':
      return 'Hush';
    case 'room':
      return 'Room';
    case 'lift':
      return 'Music';
    case 'pulse':
      return 'Surge';
    default:
      return preset;
  }
}

export function formatControlValue(
  key: NumericUserControlKey,
  value: number
): string {
  const sanitized = clampTuningValue(value);

  switch (key) {
    case 'inputGain':
    case 'eqLow':
    case 'eqMid':
    case 'eqHigh': {
      const delta = Math.round((sanitized - 0.5) * 100);
      return delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${delta}`;
    }
    case 'colorBias': {
      const delta = Math.round((sanitized - 0.5) * 100);
      if (delta === 0) {
        return 'Neutral';
      }

      return delta > 0 ? `Warm +${delta}` : `Cool ${Math.abs(delta)}`;
    }
    default:
      return String(Math.round(sanitized * 100));
  }
}
