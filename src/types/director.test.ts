import { describe, expect, it } from 'vitest';
import { DEFAULT_LISTENING_FRAME, type ListeningFrame } from './audio';
import { DEFAULT_USER_CONTROL_STATE, deriveRuntimeTuning } from './tuning';
import {
  DEFAULT_ADVANCED_CURATION_STATE,
  DEFAULT_ADVANCED_STEERING_STATE,
  createDirectorBiasStateFromLegacyControls,
  DEFAULT_DIRECTOR_INTENT,
  parseStoredDirectorIntent,
  resolveAppliedShowIntent,
  resolveAutoShowState,
  resolveAutoRoutePlan,
  resolveAutoRouteRecommendation,
  resolveDirectorBaseState,
  resolveDirectorOptionAudit,
  resolveDirectorState,
  resolveListeningModeFromRoutePolicy
} from './director';

describe('director intent layer', () => {
  it('parses and sanitizes persisted intent payloads', () => {
    const intent = parseStoredDirectorIntent(
      JSON.stringify({
        routePolicy: 'hybrid',
        showWorldId: 'storm-crown',
        lookId: 'acid-flare',
        stanceId: 'volatile',
        worldPoolId: 'pressure-worlds',
        lookPoolId: 'burn-looks',
        biases: {
          heroPresence: 2,
          worldTakeover: -1
        }
      })
    );

    expect(intent.routePolicy).toBe('hybrid');
    expect(intent.showWorldId).toBe('storm-crown');
    expect(intent.lookId).toBe('acid-flare');
    expect(intent.stanceId).toBe('volatile');
    expect(intent.worldPoolId).toBe('pressure-worlds');
    expect(intent.lookPoolId).toBe('burn-looks');
    expect(intent.biases.heroPresence).toBe(1);
    expect(intent.biases.worldTakeover).toBe(0);
  });

  it('derives semantic director bias from legacy controls', () => {
    const biases = createDirectorBiasStateFromLegacyControls({
      ...DEFAULT_USER_CONTROL_STATE,
      worldActivity: 0.92,
      spectacle: 0.86,
      atmosphere: 0.74,
      geometry: 0.68,
      eventfulness: 0.82
    });

    expect(biases.worldTakeover).toBeCloseTo(0.92);
    expect(biases.scale).toBeCloseTo(0.86);
    expect(biases.depth).toBeGreaterThan(0.65);
    expect(biases.eventAppetite).toBeCloseTo(0.82);
  });

  it('resolves auto route policy against the current listening mode', () => {
    const base = resolveDirectorBaseState(
      {
        ...DEFAULT_DIRECTOR_INTENT,
        routePolicy: 'auto'
      },
      'hybrid'
    );

    expect(resolveListeningModeFromRoutePolicy('auto', 'hybrid')).toBe('hybrid');
    expect(base.sourceMode).toBe('hybrid');
    expect(base.compatibilityQuickStartId).toBe('hybrid-show');
    expect(base.baseControls.worldActivity).toBeGreaterThan(0.8);
  });

  it('starts auto show room-first when microphone capture is available', () => {
    const plan = resolveAutoRoutePlan('auto', 'system-audio', {
      microphoneAvailable: true,
      displayAudioAvailable: true
    });

    expect(plan.resolvedRoute).toBe('the-room');
    expect(plan.sourceMode).toBe('room-mic');
    expect(plan.reason).toBe('room-first-default');
  });

  it('falls back to direct computer audio when room capture is unavailable', () => {
    const plan = resolveAutoRoutePlan('auto', 'room-mic', {
      microphoneAvailable: false,
      displayAudioAvailable: true
    });

    expect(plan.resolvedRoute).toBe('this-computer');
    expect(plan.sourceMode).toBe('system-audio');
    expect(plan.reason).toBe('microphone-unavailable');
  });

  it('changes world, look, and consequence with the music instead of staying static', () => {
    const quietFrame: ListeningFrame = {
      ...DEFAULT_LISTENING_FRAME,
      calibrated: true,
      showState: 'void',
      performanceIntent: 'hold',
      musicConfidence: 0.08,
      mode: 'system-audio'
    };
    const surgeFrame: ListeningFrame = {
      ...DEFAULT_LISTENING_FRAME,
      calibrated: true,
      showState: 'surge',
      performanceIntent: 'detonate',
      musicConfidence: 0.86,
      sectionChange: 0.54,
      dropImpact: 0.58,
      beatConfidence: 0.82,
      mode: 'system-audio'
    };

    const quiet = resolveDirectorState(DEFAULT_DIRECTOR_INTENT, quietFrame, 'system-audio');
    const surge = resolveDirectorState(DEFAULT_DIRECTOR_INTENT, surgeFrame, 'system-audio');
    const baseRuntime = deriveRuntimeTuning(quiet.baseControls);

    expect(quiet.phase).toBe('quiet');
    expect(quiet.effectiveWorldId).toBe('haunted-residue');
    expect(quiet.effectiveLookId).toBe('ghost-signal');
    expect(surge.phase).toBe('surge');
    expect(surge.effectiveWorldId).toBe('storm-crown');
    expect(surge.effectiveLookId).toBe('acid-flare');
    expect(surge.runtimeTuning.eventRate).toBeGreaterThan(baseRuntime.eventRate);
    expect(quiet.runtimeTuning.eventRate).toBeLessThan(baseRuntime.eventRate);
  });

  it('respects world pool constraints during migration', () => {
    const quiet = resolveDirectorState(
      {
        ...DEFAULT_DIRECTOR_INTENT,
        showWorldId: 'pressure-chamber',
        worldPoolId: 'spectral-worlds'
      },
      {
        ...DEFAULT_LISTENING_FRAME,
        calibrated: true,
        showState: 'void',
        performanceIntent: 'hold',
        musicConfidence: 0.04
      },
      'room-mic'
    );

    expect(quiet.effectiveWorldId).toBe('spectral-plume');
  });

  it('keeps effective look migration inside the selected look pool', () => {
    const surge = resolveDirectorState(
      {
        ...DEFAULT_DIRECTOR_INTENT,
        lookId: 'ghost-signal',
        lookPoolId: 'ghost-looks'
      },
      {
        ...DEFAULT_LISTENING_FRAME,
        calibrated: true,
        showState: 'surge',
        performanceIntent: 'detonate',
        musicConfidence: 0.82,
        dropImpact: 0.6,
        sectionChange: 0.5
      },
      'system-audio'
    );

    expect(surge.effectiveLookId).toBe('ghost-signal');
  });

  it('keeps untouched start runs in full-autonomous mode', () => {
    const applied = resolveAppliedShowIntent(
      'pc-audio',
      DEFAULT_ADVANCED_CURATION_STATE,
      DEFAULT_ADVANCED_STEERING_STATE,
      {
        ...DEFAULT_LISTENING_FRAME,
        calibrated: true,
        showState: 'generative',
        performanceIntent: 'ignite',
        musicConfidence: 0.64,
        beatConfidence: 0.72
      },
      'system-audio'
    );

    expect(applied.showCapabilityMode).toBe('full-autonomous');
    expect(applied.compatibilityIntent.worldPoolId).toBe('full-spectrum');
    expect(applied.compatibilityIntent.lookPoolId).toBe('full-spectrum');
    expect(applied.compatibilityIntent.stanceId).toBe('autonomous');
    expect(applied.anthologyDirectorState.poolState.worldPoolId).toBe('full-spectrum');
    expect(applied.anthologyDirectorState.poolState.worldAnchorId).toBeNull();
    expect(applied.anthologyDirectorState.heroSpeciesId).toBe('idol-core');
    expect(applied.anthologyDirectorState.graduationStatus).toBe('flagship');
  });

  it('marks advanced curation as curated and applies explicit constraints', () => {
    const applied = resolveAppliedShowIntent(
      'combo',
      {
        worldPoolId: 'spectral-worlds',
        lookPoolId: 'ghost-looks',
        showWorldId: 'spectral-plume',
        lookId: 'ghost-signal',
        stanceId: 'spectral'
      },
      {
        ...DEFAULT_ADVANCED_STEERING_STATE,
        aftermath: 0.92
      },
      {
        ...DEFAULT_LISTENING_FRAME,
        calibrated: true,
        showState: 'void',
        performanceIntent: 'hold',
        musicConfidence: 0.08
      },
      'hybrid'
    );

    expect(applied.showCapabilityMode).toBe('curated');
    expect(applied.constraintState.hasWorldPoolConstraint).toBe(true);
    expect(applied.constraintState.hasLookPoolConstraint).toBe(true);
    expect(applied.constraintState.hasStanceOverride).toBe(true);
    expect(applied.compatibilityIntent.worldPoolId).toBe('spectral-worlds');
    expect(applied.compatibilityIntent.lookPoolId).toBe('ghost-looks');
    expect(applied.compatibilityIntent.stanceId).toBe('spectral');
    expect(applied.compatibilityIntent.biases.aftermath).toBeCloseTo(0.92);
    expect(applied.anthologyDirectorState.poolState.worldAnchorId).toBe('spectral-plume');
    expect(applied.anthologyDirectorState.poolState.lookAnchorId).toBe('ghost-signal');
    expect(applied.anthologyDirectorState.music.regime).toBe('listening');
    expect(applied.anthologyDirectorState.mixedMediaAssetId).toBe('ghost-echo');
  });

  it('audits whether advanced options keep the autonomous scene spread healthy', () => {
    const fullAuto = resolveDirectorOptionAudit(
      DEFAULT_ADVANCED_CURATION_STATE,
      DEFAULT_ADVANCED_STEERING_STATE
    );
    const constrained = resolveDirectorOptionAudit(
      {
        worldPoolId: 'spectral-worlds',
        lookPoolId: 'ghost-looks',
        showWorldId: 'spectral-plume',
        lookId: 'void-silk',
        stanceId: 'volatile'
      },
      {
        ...DEFAULT_ADVANCED_STEERING_STATE,
        contrast: 0.42,
        saturation: 0.44
      }
    );

    expect(fullAuto.tone).toBe('ok');
    expect(fullAuto.expectedSceneCount).toBeGreaterThanOrEqual(4);
    expect(fullAuto.notes.some((note) => note.title === 'Autonomous migration active')).toBe(
      true
    );
    expect(constrained.tone).toBe('warn');
    expect(constrained.autonomyScore).toBeLessThan(fullAuto.autonomyScore);
    expect(constrained.notes.some((note) => note.title === 'Premium color risk')).toBe(
      true
    );
    expect(constrained.notes.some((note) => note.title === 'Quiet/ghost reach reduced')).toBe(
      true
    );
  });

  it('lets advanced steering directly bias depth, contrast, and saturation', () => {
    const applied = resolveAppliedShowIntent(
      'pc-audio',
      DEFAULT_ADVANCED_CURATION_STATE,
      {
        ...DEFAULT_ADVANCED_STEERING_STATE,
        depth: 0.95,
        contrast: 0.92,
        saturation: 0.94
      },
      {
        ...DEFAULT_LISTENING_FRAME,
        calibrated: true,
        showState: 'generative',
        performanceIntent: 'ignite',
        musicConfidence: 0.7,
        beatConfidence: 0.72
      },
      'system-audio'
    );

    expect(applied.showCapabilityMode).toBe('curated');
    expect(applied.compatibilityIntent.biases.depth).toBeCloseTo(0.95);
    expect(applied.compatibilityIntent.biases.contrast).toBeCloseTo(0.92);
    expect(applied.compatibilityIntent.biases.saturation).toBeCloseTo(0.94);
    expect(applied.base.baseControls.geometry).toBeGreaterThan(
      resolveAppliedShowIntent(
        'pc-audio',
        DEFAULT_ADVANCED_CURATION_STATE,
        DEFAULT_ADVANCED_STEERING_STATE,
        {
          ...DEFAULT_LISTENING_FRAME,
          calibrated: true,
          showState: 'generative',
          performanceIntent: 'ignite',
          musicConfidence: 0.7,
          beatConfidence: 0.72
        },
        'system-audio'
      ).base.baseControls.geometry
    );
  });

  it('derives route-specific autonomous seeds before advanced curation is applied', () => {
    const microphone = resolveAutoShowState(
      'microphone',
      {
        ...DEFAULT_LISTENING_FRAME,
        calibrated: true,
        showState: 'void',
        performanceIntent: 'hold',
        musicConfidence: 0.1
      },
      'room-mic'
    );
    const combo = resolveAutoShowState(
      'combo',
      {
        ...DEFAULT_LISTENING_FRAME,
        calibrated: true,
        showState: 'surge',
        performanceIntent: 'detonate',
        musicConfidence: 0.82,
        dropImpact: 0.56
      },
      'hybrid'
    );

    expect(microphone.showWorldId).toBe('spectral-plume');
    expect(microphone.lookId).toBe('ghost-signal');
    expect(combo.showWorldId).toBe('portal-chamber');
    expect(combo.lookId).toBe('neon-cathedral');
  });

  it('derives anthology intent from current music phase and resolved world behavior', () => {
    const applied = resolveAppliedShowIntent(
      'combo',
      DEFAULT_ADVANCED_CURATION_STATE,
      DEFAULT_ADVANCED_STEERING_STATE,
      {
        ...DEFAULT_LISTENING_FRAME,
        calibrated: true,
        showState: 'surge',
        performanceIntent: 'detonate',
        musicConfidence: 0.84,
        beatConfidence: 0.78,
        dropImpact: 0.62,
        sectionChange: 0.48
      },
      'hybrid'
    );

    expect(applied.anthologyDirectorState.music.regime).toBe('detonating');
    expect(applied.anthologyDirectorState.worldFamilyId).toBe('pressure-chamber');
    expect(applied.anthologyDirectorState.worldMutationVerb).toBe('fracture');
    expect(applied.anthologyDirectorState.heroSpeciesId).toBe('twin-entities');
    expect(applied.anthologyDirectorState.heroMutationVerb).toBe('crystallize');
    expect(applied.anthologyDirectorState.consequenceMode).toBe('rupture');
    expect(applied.anthologyDirectorState.lightingRigState).toBe('beam-cage');
    expect(applied.anthologyDirectorState.cameraPhrase).toBe('recoil');
    expect(applied.anthologyDirectorState.particleFieldRole).toBe('cue-punctuation');
  });

  it('recommends stronger routes when a room-led auto run is too weak', () => {
    const recommendation = resolveAutoRouteRecommendation({
      routePolicy: 'auto',
      currentMode: 'room-mic',
      statusPhase: 'live',
      diagnostics: {
        rawRms: 0.015,
        noiseFloor: 0.012,
        roomMusicFloorActive: false
      },
      frame: {
        musicConfidence: 0.08,
        speechConfidence: 0.2
      },
      capabilities: {
        microphoneAvailable: true,
        displayAudioAvailable: true
      }
    });

    expect(recommendation?.recommendedRoute).toBe('this-computer');
    expect(recommendation?.strength).toBe('strong');
  });
});
