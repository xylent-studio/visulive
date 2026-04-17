import { describe, expect, it } from 'vitest';
import { ListeningInterpreter } from './listeningInterpreter';
import { DEFAULT_ANALYSIS_FRAME, type ListeningMode } from '../types/audio';
import { DEFAULT_RUNTIME_TUNING } from '../types/tuning';

function stepInterpreter(
  interpreter: ListeningInterpreter,
  frames: Array<Partial<typeof DEFAULT_ANALYSIS_FRAME>>,
  startTimestampMs = 1000,
  mode: ListeningMode = 'room-mic'
) {
  let timestampMs = startTimestampMs;
  let result = interpreter.update({
    analysis: {
      ...DEFAULT_ANALYSIS_FRAME,
      timestampMs
    },
    mode,
    calibrated: true,
    noiseFloor: 0.01,
    adaptiveCeiling: 0.1,
    rawPathGranted: true,
    tuning: DEFAULT_RUNTIME_TUNING
  });

  for (const frame of frames) {
    timestampMs += 50;
    result = interpreter.update({
      analysis: {
        ...DEFAULT_ANALYSIS_FRAME,
        timestampMs,
        ...frame
      },
      mode,
      calibrated: true,
      noiseFloor: 0.01,
      adaptiveCeiling: 0.1,
      rawPathGranted: true,
      tuning: DEFAULT_RUNTIME_TUNING
    });
  }

  return result.frame;
}

function repeatFrame(
  frame: Partial<typeof DEFAULT_ANALYSIS_FRAME>,
  count: number
): Array<Partial<typeof DEFAULT_ANALYSIS_FRAME>> {
  return Array.from({ length: count }, () => frame);
}

describe('ListeningInterpreter', () => {
  it('keeps silence calm and stable', () => {
    const interpreter = new ListeningInterpreter();
    const frame = stepInterpreter(interpreter, repeatFrame({}, 40));

    expect(frame.presence).toBeLessThan(0.12);
    expect(frame.accent).toBeLessThan(0.05);
    expect(frame.state).toBe('dormant');
    expect(['void', 'atmosphere']).toContain(frame.showState);
  });

  it('treats steady hum as roomness rather than music', () => {
    const interpreter = new ListeningInterpreter();
    const frame = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.03,
          peak: 0.04,
          envelopeFast: 0.028,
          envelopeSlow: 0.032,
          lowEnergy: 0.036,
          midEnergy: 0.014,
          highEnergy: 0.005,
          brightness: 0.08,
          lowStability: 0.98,
          modulation: 0.01,
          transient: 0.002
        },
        40
      )
    );

    expect(frame.roomness).toBeGreaterThan(0.08);
    expect(frame.musicConfidence).toBeLessThan(0.25);
    expect(frame.accent).toBeLessThan(0.08);
  });

  it('distinguishes speech from impacts', () => {
    const interpreter = new ListeningInterpreter();
    const frame = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.032,
          peak: 0.046,
          envelopeFast: 0.035,
          envelopeSlow: 0.028,
          lowEnergy: 0.012,
          midEnergy: 0.04,
          highEnergy: 0.012,
          brightness: 0.18,
          midFlux: 0.01,
          highFlux: 0.004,
          modulation: 0.18,
          transient: 0.012,
          lowStability: 0.54
        },
        28
      )
    );

    expect(frame.speech).toBeGreaterThan(frame.accent);
    expect(frame.speech).toBeGreaterThan(0.14);
    expect(frame.showState).toBe('cadence');
  });

  it('raises accent quickly for transient-heavy input and lets it decay', () => {
    const interpreter = new ListeningInterpreter();
    const struck = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.032,
          peak: 0.08,
          envelopeFast: 0.05,
          envelopeSlow: 0.018,
          lowEnergy: 0.018,
          midEnergy: 0.032,
          highEnergy: 0.048,
          brightness: 0.32,
          transient: 0.11,
          midFlux: 0.018,
          highFlux: 0.026,
          crestFactor: 3.1,
          modulation: 0.12,
          lowStability: 0.32
        },
        5
      )
    );

    const decayed = stepInterpreter(interpreter, repeatFrame({}, 24), struck.timestampMs);

    expect(struck.accent).toBeGreaterThan(0.3);
    expect(decayed.accent).toBeLessThan(struck.accent);
  });

  it('lets sustained broadband music accumulate body and resonance', () => {
    const interpreter = new ListeningInterpreter();
    const frame = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.04,
          peak: 0.054,
          envelopeFast: 0.042,
          envelopeSlow: 0.046,
          lowEnergy: 0.03,
          midEnergy: 0.038,
          highEnergy: 0.024,
          brightness: 0.24,
          lowFlux: 0.006,
          midFlux: 0.012,
          highFlux: 0.01,
          modulation: 0.16,
          transient: 0.014,
          crestFactor: 1.9,
          lowStability: 0.56
        },
        50
      )
    );

    expect(frame.musicConfidence).toBeGreaterThan(0.35);
    expect(frame.body).toBeGreaterThan(0.25);
    expect(frame.momentum).toBeGreaterThan(0.22);
    expect(frame.resonance).toBeGreaterThan(0.25);
    expect(['entrained', 'blooming']).toContain(frame.state);
    expect(['generative', 'surge']).toContain(frame.showState);
    expect(frame.lowMidBody).toBeGreaterThan(0.18);
    expect(frame.phraseTension).toBeGreaterThan(0.18);
    expect(frame.beatConfidence).toBeGreaterThan(0.12);
    expect(frame.performanceIntent).toMatch(/gather|ignite|detonate/);
  });

  it('promotes structured system-audio grooves into ignite before full detonation', () => {
    const interpreter = new ListeningInterpreter();
    const frames = Array.from({ length: 64 }, (_, index) => {
      const onBeat = index % 4 === 0;

      return onBeat
        ? {
            rms: 0.052,
            peak: 0.084,
            envelopeFast: 0.058,
            envelopeSlow: 0.04,
            lowEnergy: 0.036,
            midEnergy: 0.03,
            highEnergy: 0.024,
            brightness: 0.22,
            lowFlux: 0.02,
            midFlux: 0.014,
            highFlux: 0.012,
            modulation: 0.18,
            transient: 0.044,
            crestFactor: 2.5,
            lowStability: 0.44
          }
        : {
            rms: 0.038,
            peak: 0.05,
            envelopeFast: 0.04,
            envelopeSlow: 0.038,
            lowEnergy: 0.026,
            midEnergy: 0.024,
            highEnergy: 0.016,
            brightness: 0.16,
            lowFlux: 0.006,
            midFlux: 0.008,
            highFlux: 0.006,
            modulation: 0.14,
            transient: 0.012,
            crestFactor: 1.9,
            lowStability: 0.52
          };
    });
    const frame = stepInterpreter(interpreter, frames, 1000, 'system-audio');

    expect(frame.showState).toBe('generative');
    expect(frame.beatConfidence).toBeGreaterThan(0.16);
    expect(frame.phraseTension).toBeGreaterThan(0.18);
    expect(frame.performanceIntent).toBe('ignite');
  });

  it('promotes structured room music into ignite once sustained musical body is present', () => {
    const interpreter = new ListeningInterpreter();
    const frames = Array.from({ length: 72 }, (_, index) => {
      const onBeat = index % 4 === 0;

      return onBeat
        ? {
            rms: 0.038,
            peak: 0.062,
            envelopeFast: 0.044,
            envelopeSlow: 0.03,
            lowEnergy: 0.028,
            midEnergy: 0.024,
            highEnergy: 0.012,
            brightness: 0.18,
            lowFlux: 0.016,
            midFlux: 0.012,
            highFlux: 0.006,
            modulation: 0.14,
            transient: 0.032,
            crestFactor: 2.3,
            lowStability: 0.5
          }
        : {
            rms: 0.024,
            peak: 0.034,
            envelopeFast: 0.026,
            envelopeSlow: 0.028,
            lowEnergy: 0.018,
            midEnergy: 0.018,
            highEnergy: 0.008,
            brightness: 0.14,
            lowFlux: 0.004,
            midFlux: 0.006,
            highFlux: 0.003,
            modulation: 0.1,
            transient: 0.008,
            crestFactor: 1.7,
            lowStability: 0.68
          };
    });
    const frame = stepInterpreter(interpreter, frames, 1000, 'room-mic');

    expect(['generative', 'surge']).toContain(frame.showState);
    expect(frame.musicConfidence).toBeGreaterThan(0.3);
    expect(frame.beatConfidence).toBeGreaterThan(0.12);
    expect(frame.performanceIntent).toBe('ignite');
  });

  it('builds beat and drop intent for repeated bass-led impacts', () => {
    const interpreter = new ListeningInterpreter();
    const frames = Array.from({ length: 48 }, (_, index) => {
      const onBeat = index % 4 === 0;

      return onBeat
        ? {
            rms: 0.052,
            peak: 0.095,
            envelopeFast: 0.062,
            envelopeSlow: 0.044,
            lowEnergy: 0.042,
            midEnergy: 0.032,
            highEnergy: 0.018,
            brightness: 0.18,
            lowFlux: 0.024,
            midFlux: 0.018,
            highFlux: 0.008,
            modulation: 0.18,
            transient: 0.06,
            crestFactor: 2.8,
            lowStability: 0.44
          }
        : {
            rms: 0.034,
            peak: 0.046,
            envelopeFast: 0.036,
            envelopeSlow: 0.04,
            lowEnergy: 0.028,
            midEnergy: 0.026,
            highEnergy: 0.014,
            brightness: 0.14,
            lowFlux: 0.004,
            midFlux: 0.006,
            highFlux: 0.004,
            modulation: 0.12,
            transient: 0.01,
            crestFactor: 1.8,
            lowStability: 0.56
          };
    });
    const frame = stepInterpreter(interpreter, frames);

    expect(frame.beatConfidence).toBeGreaterThan(0.18);
    expect(frame.dropImpact).toBeGreaterThan(0.08);
    expect(frame.barPhase).toBeGreaterThanOrEqual(0);
    expect(frame.barPhase).toBeLessThanOrEqual(1);
    expect(frame.preDropTension).toBeGreaterThan(0.14);
  });

  it('escalates clean system audio more readily than room-mic input', () => {
    const roomInterpreter = new ListeningInterpreter();
    const systemInterpreter = new ListeningInterpreter();
    const frames = Array.from({ length: 73 }, (_, index) => {
      const onBeat = index % 4 === 0;

      return onBeat
        ? {
            rms: 0.06,
            peak: 0.108,
            envelopeFast: 0.07,
            envelopeSlow: 0.048,
            lowEnergy: 0.05,
            midEnergy: 0.036,
            highEnergy: 0.022,
            brightness: 0.24,
            lowFlux: 0.03,
            midFlux: 0.02,
            highFlux: 0.012,
            modulation: 0.22,
            transient: 0.072,
            crestFactor: 3.1,
            lowStability: 0.4
          }
        : {
            rms: 0.038,
            peak: 0.052,
            envelopeFast: 0.04,
            envelopeSlow: 0.044,
            lowEnergy: 0.032,
            midEnergy: 0.03,
            highEnergy: 0.018,
            brightness: 0.16,
            lowFlux: 0.005,
            midFlux: 0.009,
            highFlux: 0.004,
            modulation: 0.14,
            transient: 0.012,
            crestFactor: 1.8,
            lowStability: 0.54
          };
    });

    const roomFrame = stepInterpreter(roomInterpreter, frames, 1000, 'room-mic');
    const systemFrame = stepInterpreter(systemInterpreter, frames, 1000, 'system-audio');

    expect(systemFrame.dropImpact).toBeGreaterThan(roomFrame.dropImpact);
    expect(systemFrame.sectionChange).toBeGreaterThan(roomFrame.sectionChange);
    expect(['generative', 'surge']).toContain(systemFrame.showState);
    expect(systemFrame.performanceIntent).not.toBe('hold');
  });

  it('lets a long electronic drop tail fall out of surge instead of staying pinned to ghost-state resonance', () => {
    const interpreter = new ListeningInterpreter();
    const surged = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.056,
          peak: 0.102,
          envelopeFast: 0.074,
          envelopeSlow: 0.054,
          lowEnergy: 0.046,
          midEnergy: 0.034,
          highEnergy: 0.022,
          brightness: 0.26,
          lowFlux: 0.02,
          midFlux: 0.018,
          highFlux: 0.01,
          modulation: 0.2,
          transient: 0.058,
          crestFactor: 2.9,
          lowStability: 0.44
        },
        52
      ),
      1000,
      'system-audio'
    );

    const tail = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.044,
          peak: 0.062,
          envelopeFast: 0.042,
          envelopeSlow: 0.05,
          lowEnergy: 0.038,
          midEnergy: 0.03,
          highEnergy: 0.016,
          brightness: 0.16,
          lowFlux: 0.003,
          midFlux: 0.006,
          highFlux: 0.003,
          modulation: 0.1,
          transient: 0.006,
          crestFactor: 1.8,
          lowStability: 0.72
        },
        132
      ),
      surged.timestampMs,
      'system-audio'
    );

    expect(['generative', 'surge']).toContain(surged.showState);
    expect(['detonate', 'ignite']).toContain(surged.performanceIntent);
    expect(tail.showState).not.toBe('surge');
    expect(['aftermath', 'generative', 'atmosphere']).toContain(tail.showState);
    expect(tail.performanceIntent).not.toBe('haunt');
    expect(['gather', 'hold', 'ignite']).toContain(tail.performanceIntent);
    expect(tail.showState).not.toBe('surge');
    expect(tail.resonance).toBeLessThan(surged.resonance);
  });

  it('lets a phrase reset escape surge even when the music remains active', () => {
    const interpreter = new ListeningInterpreter();
    const surged = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.05,
          peak: 0.095,
          envelopeFast: 0.064,
          envelopeSlow: 0.05,
          lowEnergy: 0.04,
          midEnergy: 0.036,
          highEnergy: 0.02,
          brightness: 0.23,
          lowFlux: 0.018,
          midFlux: 0.016,
          highFlux: 0.008,
          modulation: 0.18,
          transient: 0.048,
          crestFactor: 2.7,
          lowStability: 0.48
        },
        48
      ),
      1000,
      'system-audio'
    );

    const reset = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.042,
          peak: 0.058,
          envelopeFast: 0.039,
          envelopeSlow: 0.044,
          lowEnergy: 0.032,
          midEnergy: 0.034,
          highEnergy: 0.017,
          brightness: 0.18,
          lowFlux: 0.006,
          midFlux: 0.012,
          highFlux: 0.005,
          modulation: 0.14,
          transient: 0.004,
          crestFactor: 1.7,
          lowStability: 0.82
        },
        132
      ),
      surged.timestampMs,
      'system-audio'
    );

    expect(['generative', 'surge']).toContain(surged.showState);
    expect(reset.showState).not.toBe('surge');
    expect(['aftermath', 'generative', 'atmosphere']).toContain(reset.showState);
    expect(['haunt', 'gather', 'hold', 'ignite']).toContain(reset.performanceIntent);
    expect(reset.performanceIntent).not.toBe('detonate');
  });

  it('holds an aftermath posture after a stronger musical section releases', () => {
    const interpreter = new ListeningInterpreter();
    const surged = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.05,
          peak: 0.09,
          envelopeFast: 0.056,
          envelopeSlow: 0.052,
          lowEnergy: 0.034,
          midEnergy: 0.046,
          highEnergy: 0.03,
          brightness: 0.3,
          lowFlux: 0.018,
          midFlux: 0.024,
          highFlux: 0.018,
          modulation: 0.24,
          transient: 0.038,
          crestFactor: 2.6,
          lowStability: 0.5
        },
        44
      )
    );

    let released: typeof surged | null = null;
    let timestampMs = surged.timestampMs;
    for (const frame of repeatFrame(
      {
        rms: 0.014,
        peak: 0.018,
        envelopeFast: 0.012,
        envelopeSlow: 0.016,
        lowEnergy: 0.012,
        midEnergy: 0.012,
        highEnergy: 0.004,
        brightness: 0.06,
        lowFlux: 0.001,
        midFlux: 0.002,
        highFlux: 0.001,
        modulation: 0.02,
        transient: 0.002,
        crestFactor: 1.3,
        lowStability: 0.9
      },
      60
    )) {
      timestampMs += 50;
      const updated = interpreter.update({
        analysis: {
          ...DEFAULT_ANALYSIS_FRAME,
          timestampMs,
          ...frame
        },
        mode: 'room-mic',
        calibrated: true,
        noiseFloor: 0.01,
        adaptiveCeiling: 0.1,
        rawPathGranted: true,
        tuning: DEFAULT_RUNTIME_TUNING
      });

      if (!released && updated.frame.momentKind === 'release') {
        released = updated.frame;
      }
    }

    expect(['generative', 'surge']).toContain(surged.showState);
    expect(released).not.toBeNull();
    expect(released?.showState).toBe('aftermath');
    expect(released?.momentKind).toBe('release');
    expect(['settling', 'entrained']).toContain(released?.state);
    expect(released?.performanceIntent).toBe('haunt');
    expect(released?.resonance).toBeLessThan(surged.resonance);
    expect(released?.resonance).toBeGreaterThan(0.14);
  });

  it('allows a later release re-entry after aftermath goes stale and the music reopens', () => {
    const interpreter = new ListeningInterpreter();
    const surged = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.056,
          peak: 0.1,
          envelopeFast: 0.068,
          envelopeSlow: 0.05,
          lowEnergy: 0.042,
          midEnergy: 0.038,
          highEnergy: 0.024,
          brightness: 0.24,
          lowFlux: 0.02,
          midFlux: 0.018,
          highFlux: 0.01,
          modulation: 0.2,
          transient: 0.052,
          crestFactor: 2.8,
          lowStability: 0.46
        },
        42
      ),
      1000,
      'system-audio'
    );

    let firstRelease: typeof surged | null = null;
    let firstReleaseTimestampMs = surged.timestampMs;
    for (const frame of repeatFrame(
      {
        rms: 0.018,
        peak: 0.024,
        envelopeFast: 0.016,
        envelopeSlow: 0.02,
        lowEnergy: 0.014,
        midEnergy: 0.014,
        highEnergy: 0.006,
        brightness: 0.08,
        lowFlux: 0.001,
        midFlux: 0.002,
        highFlux: 0.001,
        modulation: 0.04,
        transient: 0.004,
        crestFactor: 1.4,
        lowStability: 0.88
      },
      60
    )) {
      firstReleaseTimestampMs += 50;
      const updated = interpreter.update({
        analysis: {
          ...DEFAULT_ANALYSIS_FRAME,
          timestampMs: firstReleaseTimestampMs,
          ...frame
        },
        mode: 'system-audio',
        calibrated: true,
        noiseFloor: 0.01,
        adaptiveCeiling: 0.1,
        rawPathGranted: true,
        tuning: DEFAULT_RUNTIME_TUNING
      });

      if (!firstRelease && updated.frame.momentKind === 'release') {
        firstRelease = updated.frame;
      }
    }

    const reopened = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.048,
          peak: 0.082,
          envelopeFast: 0.058,
          envelopeSlow: 0.046,
          lowEnergy: 0.036,
          midEnergy: 0.034,
          highEnergy: 0.02,
          brightness: 0.2,
          lowFlux: 0.014,
          midFlux: 0.012,
          highFlux: 0.008,
          modulation: 0.16,
          transient: 0.022,
          crestFactor: 2.2,
          lowStability: 0.54
        },
        132
      ),
      firstReleaseTimestampMs,
      'system-audio'
    );

    let secondRelease: typeof surged | null = null;
    let secondReleaseTimestampMs = reopened.timestampMs;
    for (const frame of repeatFrame(
      {
        rms: 0.016,
        peak: 0.022,
        envelopeFast: 0.014,
        envelopeSlow: 0.018,
        lowEnergy: 0.012,
        midEnergy: 0.012,
        highEnergy: 0.005,
        brightness: 0.06,
        lowFlux: 0.001,
        midFlux: 0.001,
        highFlux: 0.001,
        modulation: 0.03,
        transient: 0.003,
        crestFactor: 1.3,
        lowStability: 0.92
      },
      44
    )) {
      secondReleaseTimestampMs += 50;
      const updated = interpreter.update({
        analysis: {
          ...DEFAULT_ANALYSIS_FRAME,
          timestampMs: secondReleaseTimestampMs,
          ...frame
        },
        mode: 'system-audio',
        calibrated: true,
        noiseFloor: 0.01,
        adaptiveCeiling: 0.1,
        rawPathGranted: true,
        tuning: DEFAULT_RUNTIME_TUNING
      });

      if (!secondRelease && updated.frame.momentKind === 'release') {
        secondRelease = updated.frame;
      }
    }

    expect(firstRelease).not.toBeNull();
    expect(firstRelease?.momentKind).toBe('release');
    expect(reopened.showState).not.toBe('void');
    expect(secondRelease).not.toBeNull();
    expect(secondRelease?.showState).toBe('aftermath');
    expect(secondRelease?.momentKind).toBe('release');
    expect(secondRelease?.performanceIntent).toMatch(/haunt|gather|hold|ignite/);
  });

  it('lets long electronic drops relax out of detonate instead of staying locked there', () => {
    const interpreter = new ListeningInterpreter();
    const frames = [
      ...Array.from({ length: 24 }, (_, index) =>
        index % 4 === 0
          ? {
              rms: 0.062,
              peak: 0.11,
              envelopeFast: 0.074,
              envelopeSlow: 0.05,
              lowEnergy: 0.052,
              midEnergy: 0.04,
              highEnergy: 0.024,
              brightness: 0.26,
              lowFlux: 0.034,
              midFlux: 0.022,
              highFlux: 0.012,
              modulation: 0.24,
              transient: 0.076,
              crestFactor: 3,
              lowStability: 0.4
            }
          : {
              rms: 0.04,
              peak: 0.056,
              envelopeFast: 0.046,
              envelopeSlow: 0.05,
              lowEnergy: 0.034,
              midEnergy: 0.03,
              highEnergy: 0.018,
              brightness: 0.18,
              lowFlux: 0.008,
              midFlux: 0.01,
              highFlux: 0.005,
              modulation: 0.14,
              transient: 0.014,
              crestFactor: 1.8,
              lowStability: 0.52
            }
      ),
      ...Array.from({ length: 120 }, (_, index) =>
        index % 4 === 0
          ? {
              rms: 0.05,
              peak: 0.078,
              envelopeFast: 0.056,
              envelopeSlow: 0.048,
              lowEnergy: 0.044,
              midEnergy: 0.032,
              highEnergy: 0.018,
              brightness: 0.22,
              lowFlux: 0.016,
              midFlux: 0.014,
              highFlux: 0.008,
              modulation: 0.18,
              transient: 0.042,
              crestFactor: 2.3,
              lowStability: 0.46
            }
          : {
              rms: 0.042,
              peak: 0.054,
              envelopeFast: 0.044,
              envelopeSlow: 0.046,
              lowEnergy: 0.036,
              midEnergy: 0.03,
              highEnergy: 0.016,
              brightness: 0.16,
              lowFlux: 0.004,
              midFlux: 0.008,
              highFlux: 0.004,
              modulation: 0.12,
              transient: 0.01,
              crestFactor: 1.8,
              lowStability: 0.56
            }
      )
    ];
    const frame = stepInterpreter(interpreter, frames, 1000, 'system-audio');

    expect(frame.showState).not.toBe('surge');
    expect(frame.performanceIntent).not.toBe('detonate');
    expect(['generative', 'aftermath']).toContain(frame.showState);
    expect(['ignite', 'gather', 'haunt']).toContain(frame.performanceIntent);
  });

  it('keeps quiet room music out of ghost aftermath without stronger release evidence', () => {
    const interpreter = new ListeningInterpreter();
    const frame = stepInterpreter(
      interpreter,
      repeatFrame(
        {
          rms: 0.02,
          peak: 0.028,
          envelopeFast: 0.021,
          envelopeSlow: 0.023,
          lowEnergy: 0.016,
          midEnergy: 0.02,
          highEnergy: 0.008,
          brightness: 0.12,
          lowFlux: 0.002,
          midFlux: 0.004,
          highFlux: 0.002,
          modulation: 0.08,
          transient: 0.006,
          crestFactor: 1.6,
          lowStability: 0.72
        },
        84
      ),
      1000,
      'room-mic'
    );

    expect(frame.showState).not.toBe('aftermath');
    expect(frame.performanceIntent).not.toBe('haunt');
    expect(['generative', 'tactile', 'atmosphere', 'cadence']).toContain(frame.showState);
    expect(['gather', 'hold']).toContain(frame.performanceIntent);
  });
});
