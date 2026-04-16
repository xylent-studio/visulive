import { describe, expect, it } from 'vitest';
import {
  deriveSettingsHealthSummary,
  DEFAULT_USER_CONTROL_STATE,
  getActiveQuickStartProfile,
  getRecommendedQuickStartProfileId,
  QUICK_START_PROFILES,
  applyPresetToControlState,
  applyQuickStartToControlState,
  deriveRuntimeTuning,
  getPresetLabel,
  isQuickStartActive,
  parseStoredUserControlState,
  sanitizeUserControlState,
  serializeUserControlState
} from './tuning';
import { DEFAULT_AUDIO_DIAGNOSTICS } from './audio';

describe('tuning controls', () => {
  it('parses and sanitizes persisted control state', () => {
    const state = parseStoredUserControlState(
      JSON.stringify({
        preset: 'pulse',
        sensitivity: 2,
        inputGain: 2,
        eqLow: -1,
        eqMid: 2,
        eqHigh: -1,
        framing: 2,
        energy: -1,
        worldActivity: 2,
        spectacle: 2,
        geometry: -1,
        radiance: 2,
        beatDrive: -1,
        eventfulness: 2,
        accentBias: 'sharper-rhythm',
        atmosphere: -1,
        colorBias: 2
      })
    );

    expect(state.preset).toBe('pulse');
    expect(state.sensitivity).toBe(1);
    expect(state.inputGain).toBe(1);
    expect(state.eqLow).toBe(0);
    expect(state.eqMid).toBe(1);
    expect(state.eqHigh).toBe(0);
    expect(state.framing).toBe(1);
    expect(state.energy).toBe(0);
    expect(state.worldActivity).toBe(1);
    expect(state.spectacle).toBe(1);
    expect(state.geometry).toBe(0);
    expect(state.radiance).toBe(1);
    expect(state.beatDrive).toBe(0);
    expect(state.eventfulness).toBe(1);
    expect(state.atmosphere).toBe(0);
    expect(state.colorBias).toBe(1);
  });

  it('falls back to defaults for invalid stored payloads', () => {
    expect(parseStoredUserControlState('{nope')).toEqual(DEFAULT_USER_CONTROL_STATE);
    expect(
      sanitizeUserControlState({
        preset: 'invalid' as never,
        accentBias: 'invalid' as never
      })
    ).toEqual(DEFAULT_USER_CONTROL_STATE);
  });

  it('derives runtime tuning with preset bias and accent strength', () => {
    const tuning = deriveRuntimeTuning({
      preset: 'still',
      sensitivity: 0.3,
      inputGain: 0.55,
      eqLow: 0.6,
      eqMid: 0.45,
      eqHigh: 0.35,
      framing: 0.7,
      energy: 0.2,
      worldActivity: 0.65,
      spectacle: 0.25,
      geometry: 0.45,
      radiance: 0.35,
      beatDrive: 0.3,
      eventfulness: 0.2,
      accentBias: 'balanced',
      atmosphere: 0.25,
      colorBias: 0.6
    });

    expect(tuning.response).toBeLessThan(0.75);
    expect(tuning.motion).toBeGreaterThan(0.45);
    expect(tuning.accentStrength).toBeCloseTo(0.808);
    expect(tuning.eventRate).toBeGreaterThan(0.2);
    expect(tuning.inputGain).toBeCloseTo(0.55);
    expect(tuning.framing).toBeCloseTo(0.7);
    expect(tuning.worldActivity).toBeCloseTo(0.65);
    expect(tuning.colorBias).toBeCloseTo(0.6);
    expect(serializeUserControlState(tuning)).toContain('"preset":"still"');
  });

  it('applies presets as full authored starting points', () => {
    const next = applyPresetToControlState(
      {
        ...DEFAULT_USER_CONTROL_STATE,
        preset: 'room',
        sensitivity: 0.2,
        energy: 0.3,
        accentBias: 'balanced'
      },
      'pulse'
    );

    expect(next.preset).toBe('pulse');
    expect(next.sensitivity).toBeGreaterThan(0.8);
    expect(next.energy).toBeGreaterThan(0.85);
    expect(next.accentBias).toBe('sharper-rhythm');
    expect(getPresetLabel(next.preset)).toBe('Surge');
  });

  it('applies quick starts with source-specific bias', () => {
    const next = applyQuickStartToControlState(
      DEFAULT_USER_CONTROL_STATE,
      'room-music'
    );

    expect(next.preset).toBe(QUICK_START_PROFILES['room-music'].preset);
    expect(next.inputGain).toBeCloseTo(0.56);
    expect(next.eqLow).toBeGreaterThan(0.5);
    expect(next.eqHigh).toBeGreaterThan(0.5);
    expect(isQuickStartActive(next, 'room-mic', 'room-music')).toBe(true);
    expect(isQuickStartActive(next, 'system-audio', 'room-music')).toBe(false);
    expect(getActiveQuickStartProfile(next, 'room-mic')?.id).toBe('room-music');
  });

  it('preserves extra headroom for stronger show stances instead of flattening them all to 1', () => {
    const music = deriveRuntimeTuning(
      applyQuickStartToControlState(DEFAULT_USER_CONTROL_STATE, 'pc-music')
    );
    const hybrid = deriveRuntimeTuning(
      applyQuickStartToControlState(DEFAULT_USER_CONTROL_STATE, 'hybrid-show')
    );

    expect(music.response).toBeGreaterThan(1);
    expect(music.motion).toBeGreaterThan(1);
    expect(music.eventRate).toBeLessThanOrEqual(0.92);
    expect(hybrid.response).toBeGreaterThan(music.response);
    expect(hybrid.motion).toBeGreaterThanOrEqual(music.motion);
  });

  it('maps each source mode back to a recommended quick start', () => {
    expect(getRecommendedQuickStartProfileId('room-mic')).toBe('room-music');
    expect(getRecommendedQuickStartProfileId('system-audio')).toBe('pc-music');
    expect(getRecommendedQuickStartProfileId('hybrid')).toBe('hybrid-show');
  });

  it('treats edited quick starts as custom states', () => {
    const next = applyQuickStartToControlState(
      DEFAULT_USER_CONTROL_STATE,
      'pc-music'
    );
    const edited = {
      ...next,
      worldActivity: next.worldActivity + 0.01
    };

    expect(isQuickStartActive(edited, 'system-audio', 'pc-music')).toBe(false);
    expect(getActiveQuickStartProfile(edited, 'system-audio')).toBeNull();
  });

  it('derives healthy settings guidance for an active recommended path', () => {
    const controls = applyQuickStartToControlState(
      DEFAULT_USER_CONTROL_STATE,
      'pc-music'
    );
    const summary = deriveSettingsHealthSummary(controls, 'system-audio', {
      ...DEFAULT_AUDIO_DIAGNOSTICS,
      sourceMode: 'system-audio',
      rawPathGranted: true,
      displayAudioGranted: true
    });

    expect(summary.activeQuickStart?.id).toBe('pc-music');
    expect(summary.customChangeCount).toBe(0);
    expect(summary.inputRepairRecommended).toBe(false);
    expect(summary.pathHealthItems[0]?.tone).toBe('ok');
    expect(
      summary.pathHealthItems.some((item) =>
        item.title.includes('Use Live Shaping before deeper tuning')
      )
    ).toBe(true);
  });

  it('recommends input repair when the live source path is unhealthy', () => {
    const controls = {
      ...applyQuickStartToControlState(DEFAULT_USER_CONTROL_STATE, 'pc-music'),
      worldActivity: 0.7,
      beatDrive: 0.75,
      colorBias: 0.62,
      eventfulness: 0.7,
      spectacle: 0.84
    };
    const summary = deriveSettingsHealthSummary(controls, 'system-audio', {
      ...DEFAULT_AUDIO_DIAGNOSTICS,
      sourceMode: 'system-audio',
      rawPathGranted: false,
      displayAudioGranted: false,
      warnings: ['Input trim is high while clipping is present; reduce input trim or lower the source level.'],
      analysisFrame: {
        ...DEFAULT_AUDIO_DIAGNOSTICS.analysisFrame,
        clipped: true
      }
    });

    expect(summary.activeQuickStart).toBeNull();
    expect(summary.customChangeCount).toBeGreaterThan(0);
    expect(summary.inputRepairRecommended).toBe(true);
    expect(
      summary.pathHealthItems.some((item) =>
        item.title.includes('PC audio is not currently granted')
      )
    ).toBe(true);
    expect(
      summary.pathHealthItems.some((item) =>
        item.title.includes('Raw input path is compromised')
      )
    ).toBe(true);
  });
});
