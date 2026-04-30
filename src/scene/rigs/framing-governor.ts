import { DEFAULT_STAGE_COMPOSITION_PLAN } from '../../types/visual';
import type {
  FramingFallbackAdjustments,
  FramingFallbackRule,
  FramingGovernorSnapshot,
  FramingEventScale,
  FramingHeroEnvelope,
  FramingShotClass,
  FramingTempoCadenceMode,
  FramingTransitionClass,
  StageCompositionPlan,
  StageCompositionTelemetry,
  StageFrameContext
} from './types';

const EVENT_SCALE_ORDER: FramingEventScale[] = ['micro', 'phrase', 'stage'];
const SHOT_CLASS_ORDER: FramingShotClass[] = [
  'anchor',
  'pressure',
  'rupture',
  'worldTakeover',
  'aftermath',
  'isolate'
];
const TRANSITION_ORDER: FramingTransitionClass[] = [
  'hold',
  'wipe',
  'collapse',
  'iris',
  'blackoutCut',
  'residueDissolve',
  'vectorHandoff'
];
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function deepCloneRule(rule: FramingFallbackRule): FramingFallbackRule {
  return {
    ...rule,
    adjustments: {
      ...rule.adjustments,
      heroEnvelope: rule.adjustments.heroEnvelope
        ? { ...rule.adjustments.heroEnvelope }
        : undefined,
      chamberEnvelope: rule.adjustments.chamberEnvelope
        ? { ...rule.adjustments.chamberEnvelope }
        : undefined
    }
  };
}

function deepClonePlan(plan: StageCompositionPlan): StageCompositionPlan {
  return {
    ...plan,
    heroEnvelope: { ...plan.heroEnvelope },
    chamberEnvelope: { ...plan.chamberEnvelope },
    subtractivePolicy: { ...plan.subtractivePolicy }
  };
}

function normalizeTelemetry(
  telemetry: StageCompositionTelemetry | undefined
): StageCompositionTelemetry | undefined {
  if (!telemetry) {
    return undefined;
  }

  const shotClass = telemetry.shotClass ?? telemetry.stageShotClass;
  const transitionClass = telemetry.transitionClass ?? telemetry.stageTransitionClass;
  const eventScale = telemetry.eventScale ?? telemetry.stageEventScale;
  const tempoCadenceMode =
    telemetry.tempoCadenceMode ?? telemetry.stageTempoCadenceMode;
  const compositionSafety =
    typeof telemetry.compositionSafety === 'number'
      ? telemetry.compositionSafety
      : typeof telemetry.stageCompositionSafety === 'number'
        ? telemetry.stageCompositionSafety
        : undefined;
  const fallbackDemoteHero =
    typeof telemetry.fallbackDemoteHero === 'boolean'
      ? telemetry.fallbackDemoteHero
      : typeof telemetry.stageFallbackDemoteHero === 'boolean'
        ? telemetry.stageFallbackDemoteHero
        : undefined;
  const fallbackWidenShot =
    typeof telemetry.fallbackWidenShot === 'boolean'
      ? telemetry.fallbackWidenShot
      : typeof telemetry.stageFallbackWidenShot === 'boolean'
        ? telemetry.stageFallbackWidenShot
        : undefined;
  const fallbackForceWorldTakeover =
    typeof telemetry.fallbackForceWorldTakeover === 'boolean'
      ? telemetry.fallbackForceWorldTakeover
      : typeof telemetry.stageFallbackForceWorldTakeover === 'boolean'
        ? telemetry.stageFallbackForceWorldTakeover
        : undefined;

  return {
    ...telemetry,
    shotClass,
    stageShotClass: shotClass,
    transitionClass,
    stageTransitionClass: transitionClass,
    eventScale,
    stageEventScale: eventScale,
    tempoCadenceMode,
    stageTempoCadenceMode: tempoCadenceMode,
    compositionSafety,
    stageCompositionSafety: compositionSafety,
    fallbackDemoteHero,
    stageFallbackDemoteHero: fallbackDemoteHero,
    fallbackWidenShot,
    stageFallbackWidenShot: fallbackWidenShot,
    fallbackForceWorldTakeover,
    stageFallbackForceWorldTakeover: fallbackForceWorldTakeover
  };
}

function readTelemetryNumber(
  telemetry: StageCompositionTelemetry | undefined,
  ...keys: (keyof StageCompositionTelemetry)[]
): number | undefined {
  if (!telemetry) {
    return undefined;
  }

  for (const key of keys) {
    const value = telemetry[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function readTelemetryScalar(
  telemetry: StageCompositionTelemetry | undefined,
  ...keys: (keyof StageCompositionTelemetry)[]
): number | undefined {
  if (!telemetry) {
    return undefined;
  }

  for (const key of keys) {
    const value = telemetry[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
  }

  return undefined;
}

function readTelemetryString<T extends string>(
  telemetry: StageCompositionTelemetry | undefined,
  allowed: readonly T[],
  ...keys: (keyof StageCompositionTelemetry)[]
): T | undefined {
  if (!telemetry) {
    return undefined;
  }

  for (const key of keys) {
    const value = telemetry[key];
    if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
      return value as T;
    }
  }

  return undefined;
}

function stepEventScale(
  scale: FramingEventScale,
  direction: -1 | 0 | 1
): FramingEventScale {
  const index = EVENT_SCALE_ORDER.indexOf(scale);
  if (index === -1 || direction === 0) {
    return scale;
  }

  return EVENT_SCALE_ORDER[
    clampRange(index + direction, 0, EVENT_SCALE_ORDER.length - 1)
  ];
}

function stepShotClass(
  shotClass: FramingShotClass,
  direction: -1 | 0 | 1
): FramingShotClass {
  const index = SHOT_CLASS_ORDER.indexOf(shotClass);
  if (index === -1 || direction === 0) {
    return shotClass;
  }

  return SHOT_CLASS_ORDER[
    clampRange(index + direction, 0, SHOT_CLASS_ORDER.length - 1)
  ];
}

function stepTransitionClass(
  transitionClass: FramingTransitionClass,
  direction: -1 | 0 | 1
): FramingTransitionClass {
  const index = TRANSITION_ORDER.indexOf(transitionClass);
  if (index === -1 || direction === 0) {
    return transitionClass;
  }

  return TRANSITION_ORDER[
    clampRange(index + direction, 0, TRANSITION_ORDER.length - 1)
  ];
}

function resolveHeroLaneBase(
  lane: StageFrameContext['cuePlan']['heroAnchorLane']
): { x: number; y: number } {
  switch (lane) {
    case 'left':
      return { x: 0.34, y: 0.52 };
    case 'right':
      return { x: 0.66, y: 0.52 };
    case 'high':
      return { x: 0.5, y: 0.38 };
    case 'low':
      return { x: 0.5, y: 0.64 };
    default:
      return { x: 0.5, y: 0.5 };
  }
}

function isQuietRoomMusicFloor(context: StageFrameContext): boolean {
  return (
    context.frame.mode === 'room-mic' &&
    context.cuePlan.spendProfile !== 'peak' &&
    context.frame.musicConfidence > 0.16 &&
    context.frame.speechConfidence < 0.34 &&
    context.cuePlan.family !== 'rupture' &&
    context.cuePlan.family !== 'release' &&
    context.cuePlan.family !== 'reset'
  );
}

function isAdaptiveMusicFloor(context: StageFrameContext): boolean {
  return (
    context.cuePlan.spendProfile !== 'peak' &&
    context.cuePlan.family !== 'rupture' &&
    context.cuePlan.family !== 'reset' &&
    context.frame.musicConfidence > 0.16 &&
    context.frame.speechConfidence < 0.2 &&
    context.frame.releaseTail < 0.3 &&
    (context.frame.body > 0.08 ||
      context.frame.tonalStability > 0.22 ||
      context.frame.harmonicColor > 0.34 ||
      context.frame.shimmer > 0.08 ||
      context.frame.momentum > 0.14)
  );
}

function resolveQuietRoomLaneTarget(context: StageFrameContext): { x: number; y: number } {
  const cycle = [
    { x: 0.28, y: 0.54 },
    { x: 0.5, y: 0.34 },
    { x: 0.72, y: 0.54 },
    { x: 0.5, y: 0.7 }
  ];
  const cycleSeconds =
    context.cuePlan.family === 'haunt'
      ? 7.5
      : context.cuePlan.family === 'reveal'
        ? 4.5
        : 5.75;
  const familyPhase =
    context.cuePlan.family === 'reveal'
      ? 1
      : context.cuePlan.family === 'gather'
        ? 0.5
        : context.cuePlan.family === 'brood'
          ? 0.25
          : 0;
  const index =
    Math.floor((context.elapsedSeconds + familyPhase) / cycleSeconds) % cycle.length;

  return cycle[index >= 0 ? index : 0];
}

function resolveAdaptiveMusicLaneTarget(context: StageFrameContext): { x: number; y: number } {
  const readableHeroFloor = context.tuning?.readableHeroFloor ?? 0;
  const cycle = [
    { x: 0.26, y: 0.56 },
    { x: 0.52, y: 0.36 },
    { x: 0.74, y: 0.54 },
    { x: 0.46, y: 0.68 }
  ];
  const cycleSeconds =
    context.cuePlan.family === 'reveal'
      ? 3.8
      : context.cuePlan.family === 'gather'
        ? 4.6
        : 5.8;
  const phase =
    context.elapsedSeconds * 0.18 +
    context.frame.barPhase * 1.4 +
    context.frame.phrasePhase * 0.8 +
    context.frame.harmonicColor * 0.7 +
    readableHeroFloor * 0.4;
  const index = Math.floor(phase / cycleSeconds) % cycle.length;

  return cycle[index >= 0 ? index : 0];
}

function chooseEventScale(context: StageFrameContext): FramingEventScale {
  const { cuePlan, cueState, temporalWindows, audioFeatures } = context;
  const impact = clamp01(
    cueState.intensity * 0.24 +
      cueState.attack * 0.2 +
      cueState.eventDensity * 0.08 +
      cuePlan.stageWeight * 0.18 +
      cuePlan.eventDensity * 0.12 +
      audioFeatures.impact.build * 0.08 +
      audioFeatures.impact.hit * 0.06 +
      audioFeatures.impact.section * 0.04
  );
  const sustain = clamp01(
    cueState.sustain * 0.32 +
      temporalWindows.phraseResolve * 0.2 +
      cuePlan.stageWeight * 0.18 +
      audioFeatures.tempo.lock * 0.12 +
      audioFeatures.impact.build * 0.12
  );
  const spend = cuePlan.spendProfile;

  if (spend === 'peak' && impact >= 0.72) {
    return 'stage';
  }

  if (cuePlan.family === 'rupture' || cuePlan.family === 'reveal') {
    if (
      cuePlan.family === 'reveal' &&
      (impact >= 0.62 ||
        (impact >= 0.5 &&
          (audioFeatures.impact.section >= 0.22 ||
            temporalWindows.barTurn >= 0.18 ||
            cuePlan.stageWeight >= 0.56)))
    ) {
      return 'stage';
    }

    return impact >= 0.42 ? 'phrase' : 'micro';
  }

  if (cuePlan.family === 'gather') {
    if (
      sustain >= 0.38 &&
      (audioFeatures.tempo.lock >= 0.54 ||
        audioFeatures.impact.build >= 0.34 ||
        cuePlan.stageWeight >= 0.5)
    ) {
      return 'stage';
    }

    return sustain >= 0.2 || audioFeatures.impact.build >= 0.28 || audioFeatures.tempo.lock >= 0.48
      ? 'phrase'
      : 'micro';
  }

  if (cuePlan.family === 'release') {
    return sustain >= 0.3 ? 'phrase' : 'micro';
  }

  if (cuePlan.family === 'haunt' || cuePlan.family === 'reset') {
    return 'micro';
  }

  return impact >= 0.52 ? 'phrase' : 'micro';
}

function chooseShotClass(
  context: StageFrameContext,
  eventScale: FramingEventScale,
  previous: StageCompositionTelemetry | undefined
): FramingShotClass {
  const { cuePlan, cueState } = context;
  const previousHeroScale = readTelemetryNumber(previous, 'heroScale');
  const previousStageHeroScaleMax = readTelemetryNumber(previous, 'stageHeroScaleMax');
  const previousOverbright = (readTelemetryScalar(previous, 'overbright') ?? 0) > 0.5;
  const ringAuthority = readTelemetryString(
    previous,
    ['background-scaffold', 'framing-architecture', 'event-platform'],
    'stageRingAuthority'
  );
  const quietRoomFloor = isQuietRoomMusicFloor(context);
  const adaptiveMusicFloor = isAdaptiveMusicFloor(context);
  const chamberPresence = readTelemetryNumber(previous, 'chamberPresenceScore') ?? 0;
  const worldDominanceDelivered = readTelemetryNumber(
    previous,
    'worldDominanceDelivered'
  ) ?? 0;
  const framingAuthority = context.director.framing;
  const worldAuthority = context.director.worldActivity;
  const spectacleAuthority = context.director.spectacle;
  const radianceAuthority = context.director.radiance;
  const worldBootFloor = context.tuning?.worldBootFloor ?? 0;
  const neonStageFloor = context.tuning?.neonStageFloor ?? 0;
  const canReadWorldTakeover =
    eventScale !== 'micro' &&
    chamberPresence >= 0.3 &&
    worldDominanceDelivered >= 0.24;
  const canBootstrapWorldTakeover =
    eventScale !== 'micro' &&
    (((adaptiveMusicFloor || quietRoomFloor) &&
      (worldAuthority >= 0.42 ||
        spectacleAuthority >= 0.5 ||
        framingAuthority >= 0.54 ||
        context.cuePlan.stageWeight >= 0.32 ||
        worldBootFloor >= 0.12 ||
        neonStageFloor >= 0.1)) ||
      ((cuePlan.dominance === 'chamber' || cuePlan.dominance === 'world') &&
        (worldAuthority >= 0.5 ||
          spectacleAuthority >= 0.56 ||
          cuePlan.stageWeight >= 0.4)));
  const canDeliverWorldTakeover = canReadWorldTakeover || canBootstrapWorldTakeover;

  if (cuePlan.family === 'reset') {
    return 'isolate';
  }

  if (quietRoomFloor) {
    if (cuePlan.family === 'haunt') {
      return 'isolate';
    }

    if (cuePlan.family === 'reveal') {
      return canDeliverWorldTakeover ? 'worldTakeover' : 'pressure';
    }

    if (cuePlan.family === 'gather') {
      return canDeliverWorldTakeover
        ? 'worldTakeover'
        : context.frame.musicConfidence > 0.18 || context.frame.momentum > 0.16
          ? 'pressure'
          : 'anchor';
    }

    return context.frame.musicConfidence > 0.2 ? 'pressure' : 'anchor';
  }

  if (
    adaptiveMusicFloor &&
    cuePlan.family === 'brood' &&
    cuePlan.dominance === 'hero' &&
    (framingAuthority > 0.72 ||
      radianceAuthority > 0.58 ||
      worldAuthority > 0.64 ||
      spectacleAuthority > 0.66)
  ) {
    return canDeliverWorldTakeover && worldAuthority > 0.62 ? 'worldTakeover' : 'pressure';
  }

  if (cuePlan.family === 'haunt') {
    return 'isolate';
  }

  if (cuePlan.family === 'release') {
    return 'aftermath';
  }

  if (cuePlan.family === 'gather') {
    if (
      adaptiveMusicFloor &&
      (framingAuthority > 0.68 ||
        worldAuthority > 0.62 ||
        spectacleAuthority > 0.64 ||
        cuePlan.stageWeight > 0.42)
    ) {
      return canDeliverWorldTakeover &&
        eventScale === 'stage' &&
        cuePlan.worldMode === 'cathedral-rise' &&
        cuePlan.spendProfile === 'peak'
        ? 'worldTakeover'
        : 'pressure';
    }

    if (
      context.frame.mode === 'system-audio' &&
      eventScale !== 'micro' &&
      canDeliverWorldTakeover &&
      (worldAuthority > 0.54 ||
        framingAuthority > 0.58 ||
        cuePlan.stageWeight > 0.38 ||
        cuePlan.worldMode === 'cathedral-rise' ||
        cuePlan.worldMode === 'fan-sweep')
    ) {
      return cuePlan.worldMode === 'cathedral-rise' ||
        cuePlan.stageWeight > 0.56 ||
        cuePlan.dominance === 'world'
        ? 'worldTakeover'
        : 'pressure';
    }

    return eventScale === 'stage' &&
      cuePlan.worldMode === 'cathedral-rise' &&
      cuePlan.spendProfile === 'peak'
      ? 'worldTakeover'
      : eventScale !== 'micro' || cueState.attack > 0.2 || cuePlan.stageWeight > 0.36
        ? 'pressure'
        : 'anchor';
  }

  if (cuePlan.dominance === 'world') {
    return eventScale !== 'micro' || cuePlan.family === 'rupture'
      ? 'worldTakeover'
      : 'anchor';
  }

  if (cuePlan.dominance === 'chamber' || ringAuthority === 'event-platform') {
    return (eventScale === 'stage' &&
      cuePlan.worldMode === 'cathedral-rise' &&
      cuePlan.spendProfile === 'peak') ||
      (canDeliverWorldTakeover &&
        (cuePlan.stageWeight > 0.5 || worldAuthority > 0.58))
      ? 'worldTakeover'
      : eventScale !== 'micro'
        ? 'pressure'
        : 'anchor';
  }

  if (cuePlan.family === 'rupture') {
    return eventScale === 'stage' ? 'rupture' : 'pressure';
  }

  if (cuePlan.family === 'reveal') {
    const restrainedReveal =
      cuePlan.worldMode === 'fan-sweep' || cuePlan.worldMode === 'aperture-cage';
    const denseReveal =
      context.frame.mode === 'system-audio' &&
      eventScale !== 'micro' &&
      (framingAuthority > 0.56 ||
        worldAuthority > 0.52 ||
        spectacleAuthority > 0.54 ||
        cuePlan.stageWeight > 0.4);
    if (
      adaptiveMusicFloor &&
      (framingAuthority > 0.66 || worldAuthority > 0.6 || spectacleAuthority > 0.6)
    ) {
      return canDeliverWorldTakeover &&
        !restrainedReveal &&
        cuePlan.worldMode === 'cathedral-rise' &&
        cuePlan.spendProfile === 'peak'
        ? 'worldTakeover'
        : eventScale !== 'micro'
          ? 'pressure'
          : 'anchor';
    }

    if (restrainedReveal) {
      return denseReveal && canDeliverWorldTakeover && cuePlan.worldMode === 'fan-sweep'
        ? 'pressure'
        : eventScale === 'stage' && cuePlan.stageWeight > 0.58
        ? 'pressure'
        : eventScale !== 'micro' || cueState.attack > 0.48 || cuePlan.stageWeight > 0.46
        ? 'pressure'
        : 'anchor';
    }

    return (eventScale === 'stage' &&
      cuePlan.worldMode === 'cathedral-rise' &&
      cuePlan.spendProfile === 'peak') ||
      (denseReveal &&
        canDeliverWorldTakeover &&
        cuePlan.worldMode !== 'aperture-cage' &&
        cuePlan.stageWeight > 0.46) ||
      (cuePlan.spendProfile === 'peak' &&
        cuePlan.worldMode === 'cathedral-rise' &&
        cuePlan.stageWeight > 0.54)
      ? 'worldTakeover'
      : eventScale !== 'micro' || cueState.attack > 0.42 || cuePlan.stageWeight > 0.42
        ? 'pressure'
        : 'anchor';
  }

  if (previousOverbright || (previousHeroScale ?? 0) > 0.92 || (previousStageHeroScaleMax ?? 0) > 0.92) {
    return 'isolate';
  }

  return eventScale === 'stage' ? 'pressure' : 'anchor';
}

function chooseTransitionClass(
  context: StageFrameContext,
  eventScale: FramingEventScale,
  previous: StageCompositionTelemetry | undefined
): FramingTransitionClass {
  const { cuePlan } = context;

  if (cuePlan.family === 'reset') {
    return 'blackoutCut';
  }

  if (cuePlan.family === 'haunt') {
    return eventScale === 'stage' ? 'vectorHandoff' : 'hold';
  }

  if (cuePlan.family === 'release') {
    return 'residueDissolve';
  }

  if (cuePlan.family === 'gather') {
    return 'iris';
  }

  if (cuePlan.family === 'reveal') {
    return cuePlan.worldMode === 'aperture-cage' && eventScale === 'micro'
      ? 'vectorHandoff'
      : 'iris';
  }

  if (cuePlan.family === 'rupture') {
    return 'collapse';
  }

  if (cuePlan.family === 'brood') {
    return 'hold';
  }

  return eventScale === 'stage' ? 'vectorHandoff' : 'hold';
}

function chooseTempoCadenceMode(
  context: StageFrameContext,
  eventScale: FramingEventScale
): FramingTempoCadenceMode {
  const { cuePlan, cueState, temporalWindows, audioFeatures } = context;
  const phraseEnergy = clamp01(cueState.sustain * 0.45 + temporalWindows.phraseResolve * 0.35);
  const driveEnergy = clamp01(cueState.attack * 0.5 + cueState.intensity * 0.25);

  if (cuePlan.family === 'reset') {
    return 'aftermath';
  }

  if (cuePlan.family === 'brood') {
    return 'float';
  }

  if (cuePlan.family === 'haunt') {
    return phraseEnergy > 0.32 || audioFeatures.tempo.lock > 0.42 ? 'metered' : 'float';
  }

  if (cuePlan.family === 'gather') {
    return eventScale === 'stage' ||
      driveEnergy > 0.54 ||
      audioFeatures.tempo.lock > 0.62 ||
      audioFeatures.impact.build > 0.42
      ? 'driving'
      : phraseEnergy > 0.28 || audioFeatures.tempo.lock > 0.44 || audioFeatures.impact.build > 0.24
      ? 'metered'
      : 'float';
  }

  if (cuePlan.family === 'release') {
    return phraseEnergy > 0.36 || audioFeatures.impact.build > 0.24 ? 'metered' : 'float';
  }

  if (cuePlan.family === 'reveal') {
    return eventScale === 'stage' && driveEnergy > 0.78
      ? 'surge'
      : eventScale !== 'micro' || driveEnergy > 0.52 || audioFeatures.tempo.lock > 0.58
        ? 'driving'
        : 'metered';
  }

  if (cuePlan.family === 'rupture') {
    return eventScale === 'stage' || driveEnergy > 0.72 ? 'surge' : 'driving';
  }

  return driveEnergy > 0.62 ? 'driving' : 'metered';
}

function deriveLaneTarget(
  base: number,
  previous: number | undefined,
  overbright: boolean
): number {
  if (typeof previous !== 'number' || !Number.isFinite(previous)) {
    return clamp01(base);
  }

  const blendWeight = overbright ? 0.18 : 0.42;
  return clamp01(base * (1 - blendWeight) + previous * blendWeight);
}

function chooseHeroEnvelope(
  context: StageFrameContext,
  previous: StageCompositionTelemetry | undefined,
  eventScale: FramingEventScale,
  overbrightRisk: number
): FramingHeroEnvelope {
  const { cuePlan } = context;
  const previousOverbright = (readTelemetryScalar(previous, 'overbright') ?? 0) > 0.5;
  const previousHeroScale = readTelemetryNumber(previous, 'heroScale');
  const previousLaneX = readTelemetryNumber(previous, 'heroScreenX');
  const previousLaneY = readTelemetryNumber(previous, 'heroScreenY');
  const quietRoomFloor = isQuietRoomMusicFloor(context);
  const adaptiveMusicFloor = isAdaptiveMusicFloor(context);
  const framingAuthority = context.director.framing;
  const worldAuthority = context.director.worldActivity;
  const spectacleAuthority = context.director.spectacle;
  const radianceAuthority = context.director.radiance;
  const readableHeroFloor = context.tuning?.readableHeroFloor ?? 0;
  const neonStageFloor = context.tuning?.neonStageFloor ?? 0;
  const worldBootFloor = context.tuning?.worldBootFloor ?? 0;
  const cameraNearFloor = context.tuning?.cameraNearFloor ?? 0;
  const tuningLift = clamp01(
    readableHeroFloor * 0.88 +
      neonStageFloor * 0.72 +
      worldBootFloor * 0.54 +
      cameraNearFloor * 0.68
  );
  const controlLift = clamp01(
    Math.max(0, framingAuthority - 0.44) * 0.7 +
      Math.max(0, radianceAuthority - 0.4) * 0.3 +
      Math.max(0, worldAuthority - 0.44) * 0.28 +
      Math.max(0, spectacleAuthority - 0.46) * 0.24 +
      tuningLift * 0.4
  );

  const scaleBias =
    eventScale === 'stage' ? 0.14 : eventScale === 'phrase' ? 0.04 : -0.08;
  const coverageMax = clamp01(
    0.18 + cuePlan.heroWeight * 0.16 + (eventScale === 'stage' ? 0.12 : 0) + scaleBias * 0.5
  );
  const offCenterMax = clamp01(
    0.18 +
      cuePlan.heroAnchorStrength * 0.35 +
      (cuePlan.heroAnchorLane === 'center' ? 0.02 : 0.06) +
      (eventScale === 'stage' ? 0.08 : 0)
  );
  const depthMax = clamp01(
    0.16 +
      (cuePlan.family === 'rupture' || cuePlan.family === 'reveal' ? 0.08 : 0) +
      (eventScale === 'stage' ? 0.06 : 0)
  );
  const scaleCeiling = clampRange(
    cuePlan.heroScaleMax + scaleBias - (previousOverbright ? 0.08 : 0),
    0.5,
    1.25
  );
  const driftAllowance = clamp01(
    0.14 + cuePlan.heroMotionBias * 0.22 + (eventScale === 'stage' ? 0.1 : 0)
  );
  const laneBase = resolveHeroLaneBase(cuePlan.heroAnchorLane);
  const dynamicLaneTarget = quietRoomFloor
    ? resolveQuietRoomLaneTarget(context)
    : adaptiveMusicFloor
      ? resolveAdaptiveMusicLaneTarget(context)
      : laneBase;
  const laneTargetX = deriveLaneTarget(
    clamp01(
      dynamicLaneTarget.x +
        cuePlan.heroStageX *
          (cuePlan.family === 'gather' || cuePlan.family === 'reveal' || cuePlan.dominance !== 'hero'
            ? 0.24
            : cuePlan.family === 'haunt'
              ? 0.2
              : 0.18)
    ),
    previousLaneX,
    previousOverbright
  );
  const laneTargetY = deriveLaneTarget(
    clamp01(
      dynamicLaneTarget.y +
        cuePlan.heroStageY *
          (cuePlan.family === 'gather' || cuePlan.family === 'reveal' || cuePlan.dominance !== 'hero'
            ? 0.2
            : cuePlan.family === 'haunt'
              ? 0.18
              : 0.14)
    ),
    previousLaneY,
    previousOverbright
  );

  const heroEnvelope: FramingHeroEnvelope = {
    coverageMin: 0,
    coverageMax: clamp01(coverageMax - (overbrightRisk > 0.28 ? 0.04 : 0)),
    offCenterMax: clamp01(offCenterMax - (overbrightRisk > 0.28 ? 0.03 : 0)),
    depthMax: clamp01(depthMax - (previousOverbright ? 0.04 : 0)),
    scaleCeiling,
    driftAllowance,
    travelMinX: 0,
    travelMinY: 0,
    laneTargetX,
    laneTargetY
  };

  if (cuePlan.family === 'reveal') {
    heroEnvelope.coverageMax = clamp01(Math.max(heroEnvelope.coverageMax, eventScale === 'stage' ? 0.36 : 0.3));
    heroEnvelope.offCenterMax = clamp01(Math.max(heroEnvelope.offCenterMax, eventScale === 'stage' ? 0.32 : 0.28));
    heroEnvelope.depthMax = clamp01(Math.max(heroEnvelope.depthMax, 0.22));
    heroEnvelope.driftAllowance = clamp01(Math.max(heroEnvelope.driftAllowance, eventScale === 'stage' ? 0.32 : 0.26));
    heroEnvelope.scaleCeiling = clampRange(heroEnvelope.scaleCeiling + 0.06, 0.5, 1.12);
  }

  if (cuePlan.family === 'gather') {
    heroEnvelope.coverageMax = clamp01(Math.max(heroEnvelope.coverageMax, eventScale === 'stage' ? 0.34 : 0.34));
    heroEnvelope.offCenterMax = clamp01(Math.max(heroEnvelope.offCenterMax, eventScale === 'stage' ? 0.32 : 0.3));
    heroEnvelope.depthMax = clamp01(Math.max(heroEnvelope.depthMax, 0.2));
    heroEnvelope.driftAllowance = clamp01(Math.max(heroEnvelope.driftAllowance, eventScale === 'stage' ? 0.3 : 0.24));
    heroEnvelope.scaleCeiling = clampRange(heroEnvelope.scaleCeiling + 0.02, 0.5, 1.06);
  }

  if (cuePlan.family !== 'haunt' && cuePlan.family !== 'release' && eventScale === 'stage') {
    heroEnvelope.coverageMax = clamp01(Math.max(heroEnvelope.coverageMax, cuePlan.dominance === 'hero' ? 0.28 : 0.34));
    heroEnvelope.offCenterMax = clamp01(Math.max(heroEnvelope.offCenterMax, cuePlan.dominance === 'hero' ? 0.24 : 0.3));
    heroEnvelope.depthMax = clamp01(Math.max(heroEnvelope.depthMax, 0.22));
    heroEnvelope.driftAllowance = clamp01(Math.max(heroEnvelope.driftAllowance, cuePlan.dominance === 'hero' ? 0.26 : 0.3));
  }

  if (cuePlan.dominance === 'world' || cuePlan.dominance === 'chamber') {
    heroEnvelope.coverageMax = clamp01(Math.max(heroEnvelope.coverageMax, eventScale === 'stage' ? 0.34 : 0.28));
    heroEnvelope.offCenterMax = clamp01(Math.max(heroEnvelope.offCenterMax, eventScale === 'stage' ? 0.34 : 0.26));
    heroEnvelope.depthMax = clamp01(Math.max(heroEnvelope.depthMax, 0.22));
    heroEnvelope.driftAllowance = clamp01(Math.max(heroEnvelope.driftAllowance, eventScale === 'stage' ? 0.3 : 0.24));
  }

  if (typeof previousHeroScale === 'number' && previousHeroScale > heroEnvelope.scaleCeiling) {
    heroEnvelope.scaleCeiling = clampRange(previousHeroScale - 0.04, 0.5, 1.25);
    heroEnvelope.coverageMax = clamp01(heroEnvelope.coverageMax - 0.04);
    heroEnvelope.driftAllowance = clamp01(heroEnvelope.driftAllowance - 0.04);
  }

  if (cuePlan.family === 'release') {
    heroEnvelope.scaleCeiling = clampRange(heroEnvelope.scaleCeiling - 0.08, 0.5, 1.25);
    heroEnvelope.coverageMax = clamp01(heroEnvelope.coverageMax - 0.02);
    heroEnvelope.depthMax = clamp01(heroEnvelope.depthMax - 0.02);
    heroEnvelope.driftAllowance = clamp01(Math.max(heroEnvelope.driftAllowance, 0.2));
  }

  if (cuePlan.family === 'haunt') {
    heroEnvelope.scaleCeiling = clampRange(heroEnvelope.scaleCeiling - 0.16, 0.5, 1.25);
    heroEnvelope.coverageMax = clamp01(Math.min(heroEnvelope.coverageMax, 0.14));
    heroEnvelope.offCenterMax = clamp01(Math.max(heroEnvelope.offCenterMax, 0.24));
    heroEnvelope.depthMax = clamp01(Math.min(heroEnvelope.depthMax, 0.18));
    heroEnvelope.driftAllowance = clamp01(Math.max(heroEnvelope.driftAllowance, 0.22));
  }

  if (adaptiveMusicFloor && cuePlan.family !== 'haunt' && cuePlan.family !== 'reset') {
    heroEnvelope.offCenterMax = clamp01(
      Math.max(heroEnvelope.offCenterMax, cuePlan.family === 'brood' ? 0.32 : 0.4)
    );
    heroEnvelope.driftAllowance = clamp01(
      Math.max(heroEnvelope.driftAllowance, cuePlan.family === 'brood' ? 0.32 : 0.42)
    );
    heroEnvelope.travelMinX = Math.max(
      heroEnvelope.travelMinX,
      cuePlan.family === 'brood' ? 0.18 : cuePlan.family === 'gather' ? 0.24 : 0.28
    );
    heroEnvelope.travelMinY = Math.max(
      heroEnvelope.travelMinY,
      cuePlan.family === 'brood' ? 0.1 : cuePlan.family === 'gather' ? 0.14 : 0.18
    );
    heroEnvelope.depthMax = clamp01(
      Math.max(
        heroEnvelope.depthMax,
        cuePlan.family === 'brood' ? 0.24 : cuePlan.family === 'gather' ? 0.3 : 0.36
      )
    );

    if (cuePlan.family === 'brood') {
      heroEnvelope.coverageMin = Math.max(
        heroEnvelope.coverageMin,
        0.056 + controlLift * 0.024 + tuningLift * 0.02
      );
      heroEnvelope.coverageMax = clamp01(
        Math.max(heroEnvelope.coverageMax, 0.26 + controlLift * 0.1 + tuningLift * 0.06)
      );
      heroEnvelope.scaleCeiling = clampRange(
        Math.max(heroEnvelope.scaleCeiling, 1.02 + controlLift * 0.16 + tuningLift * 0.08),
        0.5,
        1.25
      );
    } else if (cuePlan.family === 'gather') {
      heroEnvelope.coverageMin = Math.max(
        heroEnvelope.coverageMin,
        0.078 + controlLift * 0.028 + tuningLift * 0.024
      );
      heroEnvelope.coverageMax = clamp01(
        Math.max(heroEnvelope.coverageMax, 0.3 + controlLift * 0.08 + tuningLift * 0.04)
      );
      heroEnvelope.scaleCeiling = clampRange(
        Math.max(heroEnvelope.scaleCeiling, 1 + controlLift * 0.1 + tuningLift * 0.06),
        0.5,
        1.08
      );
    } else if (cuePlan.family === 'reveal') {
      heroEnvelope.coverageMin = Math.max(
        heroEnvelope.coverageMin,
        0.102 + controlLift * 0.028 + tuningLift * 0.028
      );
      heroEnvelope.coverageMax = clamp01(
        Math.max(heroEnvelope.coverageMax, 0.34 + controlLift * 0.08 + tuningLift * 0.06)
      );
      heroEnvelope.scaleCeiling = clampRange(
        Math.max(heroEnvelope.scaleCeiling, 1.08 + controlLift * 0.08 + tuningLift * 0.06),
        0.5,
        1.14
      );
    } else if (cuePlan.family === 'release') {
      heroEnvelope.coverageMin = Math.max(
        heroEnvelope.coverageMin,
        0.058 + controlLift * 0.018 + tuningLift * 0.016
      );
      heroEnvelope.coverageMax = clamp01(
        Math.max(heroEnvelope.coverageMax, 0.26 + controlLift * 0.08 + tuningLift * 0.04)
      );
      heroEnvelope.scaleCeiling = clampRange(
        Math.max(heroEnvelope.scaleCeiling, 1.04 + controlLift * 0.08 + tuningLift * 0.04),
        0.5,
        1.25
      );
    }
  }

  if (quietRoomFloor) {
    heroEnvelope.laneTargetX = deriveLaneTarget(
      dynamicLaneTarget.x,
      previousLaneX,
      false
    );
    heroEnvelope.laneTargetY = deriveLaneTarget(
      dynamicLaneTarget.y,
      previousLaneY,
      false
    );
    heroEnvelope.offCenterMax = clamp01(
      Math.max(heroEnvelope.offCenterMax, cuePlan.family === 'haunt' ? 0.34 : 0.48)
    );
    heroEnvelope.driftAllowance = clamp01(
      Math.max(heroEnvelope.driftAllowance, cuePlan.family === 'haunt' ? 0.32 : 0.48)
    );
    heroEnvelope.travelMinX = cuePlan.family === 'haunt' ? 0.18 : 0.28;
    heroEnvelope.travelMinY = cuePlan.family === 'haunt' ? 0.1 : 0.16;
    heroEnvelope.depthMax = clamp01(
      Math.max(
        heroEnvelope.depthMax,
        cuePlan.family === 'haunt'
          ? 0.22
          : cuePlan.family === 'reveal'
            ? 0.34
            : cuePlan.family === 'gather'
              ? 0.3
              : 0.26
      )
    );

    if (cuePlan.family === 'haunt') {
      heroEnvelope.coverageMin = 0.036;
      heroEnvelope.coverageMax = clamp01(Math.max(heroEnvelope.coverageMax, 0.14));
      heroEnvelope.scaleCeiling = clampRange(
        Math.max(heroEnvelope.scaleCeiling, 0.84),
        0.5,
        1.25
      );
    } else if (cuePlan.family === 'reveal') {
      heroEnvelope.coverageMin = 0.11;
      heroEnvelope.coverageMax = clamp01(Math.max(heroEnvelope.coverageMax, 0.34));
      heroEnvelope.scaleCeiling = clampRange(
        Math.max(heroEnvelope.scaleCeiling, 1.2),
        0.5,
        1.25
      );
    } else if (cuePlan.family === 'gather') {
      heroEnvelope.coverageMin = 0.09;
      heroEnvelope.coverageMax = clamp01(Math.max(heroEnvelope.coverageMax, 0.3));
      heroEnvelope.scaleCeiling = clampRange(
        Math.max(heroEnvelope.scaleCeiling, 1.1),
        0.5,
        1.25
      );
    } else {
      heroEnvelope.coverageMin = 0.068;
      heroEnvelope.coverageMax = clamp01(Math.max(heroEnvelope.coverageMax, 0.24));
      heroEnvelope.scaleCeiling = clampRange(
        Math.max(heroEnvelope.scaleCeiling, 1),
        0.5,
        1.25
      );
    }
  }

  return heroEnvelope;
}

function chooseChamberEnvelope(
  context: StageFrameContext,
  previous: StageCompositionTelemetry | undefined,
  eventScale: FramingEventScale,
  overbrightRisk: number
) {
  const { cuePlan } = context;
  const quietRoomFloor = isQuietRoomMusicFloor(context);
  const adaptiveMusicFloor = isAdaptiveMusicFloor(context);
  const readableHeroFloor = context.tuning?.readableHeroFloor ?? 0;
  const neonStageFloor = context.tuning?.neonStageFloor ?? 0;
  const worldBootFloor = context.tuning?.worldBootFloor ?? 0;
  const previousRingAuthority = readTelemetryNumber(previous, 'ringAuthority');
  const previousHeroCoverage = readTelemetryNumber(previous, 'heroCoverageEstimate') ?? 0;
  const previousRingBeltPersistence =
    readTelemetryNumber(previous, 'ringBeltPersistence') ?? 0;
  const previousStageRingAuthority = readTelemetryString(
    previous,
    ['background-scaffold', 'framing-architecture', 'event-platform'],
    'stageRingAuthority'
  );
  const priorWorldBias = readTelemetryNumber(previous, 'stageExposureCeiling');
  const ringAuthority = cuePlan.ringAuthority;
  const canDeliverWorldTakeover =
    eventScale !== 'micro' &&
    (cuePlan.worldMode === 'cathedral-rise' ||
      cuePlan.worldMode === 'ghost-chamber' ||
      cuePlan.dominance === 'world' ||
      cuePlan.spendProfile === 'peak');
  const ringOpacityCap =
    ringAuthority === 'event-platform'
      ? 0.34
      : ringAuthority === 'framing-architecture'
        ? 0.16
        : 0.08;
  const musicFloorLift = quietRoomFloor ? 0.14 : adaptiveMusicFloor ? 0.12 : 0;
  const chamberEnvelope = {
    presenceFloor: clamp01(
      0.22 +
        cuePlan.chamberWeight * 0.18 +
        (cuePlan.dominance === 'chamber' || cuePlan.dominance === 'world' ? 0.1 : 0) +
        (eventScale === 'stage' ? 0.08 : 0) +
        neonStageFloor * 0.18 +
        worldBootFloor * 0.14 +
        readableHeroFloor * 0.06 +
        musicFloorLift
    ),
    dominanceFloor: clamp01(
      0.18 +
        cuePlan.worldWeight * 0.14 +
        (cuePlan.dominance === 'world' ? 0.12 : 0) +
        (eventScale === 'stage' ? 0.06 : 0) +
        worldBootFloor * 0.16 +
        neonStageFloor * 0.08 +
        musicFloorLift * 0.84
    ),
    ringOpacityCap: clamp01(
      ringOpacityCap +
        neonStageFloor * 0.08 +
        worldBootFloor * 0.06 +
        musicFloorLift * 0.12 -
        (overbrightRisk > 0.28 ? 0.08 : 0) -
        (previousRingAuthority ?? 0) * 0.12 -
        previousHeroCoverage * 0.08 -
        previousRingBeltPersistence * 0.16
    ),
    wireDensityCap: clamp01(
      0.12 +
        cuePlan.screenWeight * 0.12 +
        (eventScale === 'stage' ? 0.06 : 0) -
        (cuePlan.family === 'haunt' || cuePlan.family === 'reset' ? 0.06 : 0) +
        neonStageFloor * 0.04 -
        previousHeroCoverage * 0.04 -
        previousRingBeltPersistence * 0.08 -
        (ringAuthority === 'background-scaffold' ? 0.04 : 0)
    ),
    worldTakeoverBias: clamp01(
      (canDeliverWorldTakeover ? 0.04 : 0.01) +
        (canDeliverWorldTakeover && cuePlan.dominance === 'world' ? 0.14 : 0) +
        (canDeliverWorldTakeover && cuePlan.dominance === 'hybrid' ? 0.06 : 0) +
        (canDeliverWorldTakeover && cuePlan.family === 'reveal' && eventScale === 'stage'
          ? 0.04
          : 0) +
        (canDeliverWorldTakeover ? worldBootFloor * 0.14 : worldBootFloor * 0.04) +
        (canDeliverWorldTakeover ? neonStageFloor * 0.06 : neonStageFloor * 0.02) +
        musicFloorLift * (canDeliverWorldTakeover ? 0.08 : 0.02)
    )
  };

  if (
    previousStageRingAuthority === 'event-platform' ||
    (typeof previousRingAuthority === 'number' && previousRingAuthority > 0.72)
  ) {
    chamberEnvelope.ringOpacityCap = clamp01(chamberEnvelope.ringOpacityCap - 0.12);
    chamberEnvelope.worldTakeoverBias = clamp01(chamberEnvelope.worldTakeoverBias - 0.02);
  }

  if (previousRingBeltPersistence > 0.48 || previousHeroCoverage > 0.3) {
    chamberEnvelope.ringOpacityCap = clamp01(chamberEnvelope.ringOpacityCap - 0.1);
    chamberEnvelope.wireDensityCap = clamp01(chamberEnvelope.wireDensityCap - 0.04);
  }

  if (typeof priorWorldBias === 'number' && priorWorldBias > 0.9) {
    chamberEnvelope.dominanceFloor = clamp01(chamberEnvelope.dominanceFloor + 0.02);
  }

  if (cuePlan.family === 'release' || cuePlan.family === 'haunt') {
    chamberEnvelope.presenceFloor = clamp01(chamberEnvelope.presenceFloor + 0.08);
    chamberEnvelope.dominanceFloor = clamp01(chamberEnvelope.dominanceFloor + 0.16);
    chamberEnvelope.worldTakeoverBias = clamp01(
      chamberEnvelope.worldTakeoverBias + (canDeliverWorldTakeover ? 0.08 : 0.02)
    );
  }

  return chamberEnvelope;
}

function chooseSubtractivePolicy(
  context: StageFrameContext,
  previous: StageCompositionTelemetry | undefined,
  transitionClass: FramingTransitionClass,
  overbrightRisk: number
): StageCompositionPlan['subtractivePolicy'] {
  const { cuePlan } = context;
  const previousOverbright = (readTelemetryScalar(previous, 'overbright') ?? 0) > 0.5;
  const baseClamp = cuePlan.subtractiveAmount + (cuePlan.family === 'rupture' ? 0.05 : 0);

  return {
    apertureClamp: clamp01(baseClamp + (overbrightRisk > 0.2 || previousOverbright ? 0.06 : 0)),
    blackoutBias: clamp01(
      0.04 +
        (cuePlan.family === 'reset' ? 0.1 : 0) +
        (transitionClass === 'blackoutCut' ? 0.08 : 0) +
        (overbrightRisk > 0.25 ? 0.04 : 0)
    ),
    wipeBias: clamp01(
      cuePlan.wipeAmount +
        (transitionClass === 'wipe' || transitionClass === 'vectorHandoff' ? 0.05 : 0) +
        (overbrightRisk > 0.32 ? 0.04 : 0)
    ),
    residueBias: clamp01(
      cuePlan.residueWeight +
        (cuePlan.family === 'haunt' || cuePlan.family === 'release' ? 0.06 : 0) +
        (transitionClass === 'residueDissolve' ? 0.04 : 0)
    )
  };
}

function deriveOverbrightRisk(
  context: StageFrameContext,
  previous: StageCompositionTelemetry | undefined,
  heroEnvelope: FramingHeroEnvelope,
  chamberEnvelope: ReturnType<typeof chooseChamberEnvelope>
): number {
  const previousOverbright = readTelemetryNumber(previous, 'overbright');
  const previousHeroScale = readTelemetryNumber(previous, 'heroScale');
  const previousCompositionSafety = readTelemetryNumber(previous, 'compositionSafety');
  const previousRingAuthority = readTelemetryNumber(previous, 'ringAuthority');

  const heroRisk =
    typeof previousHeroScale === 'number'
      ? clamp01((previousHeroScale - heroEnvelope.scaleCeiling) * 2.4)
      : 0;
  const ringRisk =
    typeof previousRingAuthority === 'number'
      ? clamp01((previousRingAuthority - chamberEnvelope.ringOpacityCap) * 1.6)
      : 0;
  const safetyRisk =
    typeof previousCompositionSafety === 'number'
      ? clamp01(1 - previousCompositionSafety)
      : 0;

  const cuePressure = clamp01(
    context.cueState.intensity * 0.3 +
      context.cueState.attack * 0.3 +
      context.cueState.eventDensity * 0.1 +
      (context.cuePlan.spendProfile === 'peak' ? 0.18 : 0)
  );

  return clamp01(
    (typeof previousOverbright === 'number' ? previousOverbright : 0) * 0.55 +
      heroRisk * 0.22 +
      ringRisk * 0.12 +
      safetyRisk * 0.08 +
      cuePressure * 0.12
  );
}

function buildFallbackRules(
  context: StageFrameContext,
  previous: StageCompositionTelemetry | undefined,
  shotSeconds: number,
  eventScale: FramingEventScale,
  shotClass: FramingShotClass,
  transitionClass: FramingTransitionClass,
  heroEnvelope: FramingHeroEnvelope,
  chamberEnvelope: ReturnType<typeof chooseChamberEnvelope>,
  overbrightRisk: number
): FramingFallbackRule[] {
  const previousTelemetryPresent = Boolean(previous);
  const previousHeroScale = readTelemetryNumber(previous, 'heroScale');
  const previousRingAuthority = readTelemetryNumber(previous, 'ringAuthority');
  const previousOverbright = (readTelemetryScalar(previous, 'overbright') ?? 0) > 0.5;
  const previousCompositionSafety = readTelemetryNumber(previous, 'compositionSafety');
  const prolongedPressure = shotSeconds > 12;
  const heroOverreach =
    typeof previousHeroScale === 'number' ? previousHeroScale > heroEnvelope.scaleCeiling : false;
  const ringOverdraw =
    typeof previousRingAuthority === 'number'
      ? previousRingAuthority > chamberEnvelope.ringOpacityCap + 0.08 ||
        (prolongedPressure && previousRingAuthority > 0.56)
      : false;
  const washoutRisk =
    overbrightRisk > 0.28 ||
    previousOverbright ||
    (typeof previousCompositionSafety === 'number' && previousCompositionSafety < 0.66) ||
    prolongedPressure;

  const rules: FramingFallbackRule[] = [
    {
      id: 'missing-previous-telemetry',
      reason: 'missing-previous-telemetry',
      priority: 0,
      applied: !previousTelemetryPresent,
      adjustments: {}
    },
    {
      id: 'hero-overreach',
      reason: 'hero-overreach',
      priority: 10,
      applied: heroOverreach,
      adjustments: {
        shotClass: stepShotClass(shotClass, -1),
        transitionClass:
          transitionClass === 'blackoutCut' ? transitionClass : stepTransitionClass(transitionClass, -1),
        eventScale: stepEventScale(eventScale, -1),
        heroEnvelope: {
          coverageMax: clamp01(heroEnvelope.coverageMax - 0.04),
          scaleCeiling: clampRange(heroEnvelope.scaleCeiling - 0.08, 0.5, 1.25),
          driftAllowance: clamp01(heroEnvelope.driftAllowance - 0.04)
        },
        chamberEnvelope: {
          ringOpacityCap: clamp01(chamberEnvelope.ringOpacityCap - 0.04)
        }
      }
    },
    {
      id: 'overbright-risk',
      reason: 'overbright-risk',
      priority: 20,
      applied: washoutRisk,
      adjustments: {
        shotClass:
          context.cuePlan.family === 'haunt'
            ? 'isolate'
            : context.cuePlan.family === 'reset'
              ? 'isolate'
            : stepShotClass(shotClass, -1),
        transitionClass:
          context.cuePlan.family === 'reset'
            ? 'blackoutCut'
            : context.cuePlan.family === 'haunt'
              ? 'vectorHandoff'
              : context.cuePlan.family === 'release'
                ? 'residueDissolve'
                : overbrightRisk > 0.38 || previousOverbright || prolongedPressure
                  ? 'wipe'
                  : stepTransitionClass(transitionClass, -1),
        eventScale: stepEventScale(eventScale, -1),
        heroEnvelope: {
          coverageMax: clamp01(heroEnvelope.coverageMax - 0.06),
          offCenterMax: clamp01(heroEnvelope.offCenterMax - 0.04),
          scaleCeiling: clampRange(heroEnvelope.scaleCeiling - 0.1, 0.5, 1.25),
          driftAllowance: clamp01(heroEnvelope.driftAllowance - 0.05)
        },
        chamberEnvelope: {
          ringOpacityCap: clamp01(chamberEnvelope.ringOpacityCap - 0.06),
          wireDensityCap: clamp01(chamberEnvelope.wireDensityCap - 0.04),
          worldTakeoverBias: clamp01(chamberEnvelope.worldTakeoverBias - 0.02)
        }
      }
    },
    {
      id: 'ring-overdraw',
      reason: 'ring-overdraw',
      priority: 30,
      applied: ringOverdraw,
      adjustments: {
        shotClass: stepShotClass(shotClass, -1),
        chamberEnvelope: {
          ringOpacityCap: clamp01(chamberEnvelope.ringOpacityCap - 0.08),
          wireDensityCap: clamp01(chamberEnvelope.wireDensityCap - 0.04),
          worldTakeoverBias: clamp01(chamberEnvelope.worldTakeoverBias - 0.04)
        }
      }
    }
  ];

  if (context.cuePlan.spendProfile === 'peak' && overbrightRisk > 0.34) {
    rules.push({
      id: 'washout-risk',
      reason: 'washout-risk',
      priority: 40,
      applied: true,
      adjustments: {
        transitionClass:
          overbrightRisk > 0.42 || previousOverbright || prolongedPressure
            ? 'wipe'
            : stepTransitionClass(transitionClass, -1),
        heroEnvelope: {
          coverageMax: clamp01(heroEnvelope.coverageMax - 0.02),
          offCenterMax: clamp01(heroEnvelope.offCenterMax - 0.02),
          driftAllowance: clamp01(heroEnvelope.driftAllowance - 0.02)
        },
        chamberEnvelope: {
          ringOpacityCap: clamp01(chamberEnvelope.ringOpacityCap - 0.05),
          wireDensityCap: clamp01(chamberEnvelope.wireDensityCap - 0.03)
        }
      }
    });
  }

  return rules.sort((left, right) => left.priority - right.priority).map(deepCloneRule);
}

function applyFallbackAdjustments(
  plan: StageCompositionPlan,
  adjustments: FramingFallbackAdjustments
): void {
  if (adjustments.shotClass) {
    plan.shotClass = adjustments.shotClass;
  }
  if (adjustments.transitionClass) {
    plan.transitionClass = adjustments.transitionClass;
  }
  if (adjustments.eventScale) {
    plan.eventScale = adjustments.eventScale;
  }
  if (adjustments.heroEnvelope) {
    plan.heroEnvelope = {
      ...plan.heroEnvelope,
      ...adjustments.heroEnvelope
    };
  }
  if (adjustments.chamberEnvelope) {
    plan.chamberEnvelope = {
      ...plan.chamberEnvelope,
      ...adjustments.chamberEnvelope
    };
  }
}

export function normalizeStageCompositionTelemetry(
  telemetry: StageCompositionTelemetry | undefined
): StageCompositionTelemetry | undefined {
  return normalizeTelemetry(telemetry);
}

export function cloneStageCompositionPlan(
  plan: StageCompositionPlan = DEFAULT_STAGE_COMPOSITION_PLAN
): StageCompositionPlan {
  return deepClonePlan(plan);
}

export function cloneStageCompositionTelemetry(
  telemetry: StageCompositionTelemetry | undefined
): StageCompositionTelemetry | undefined {
  return telemetry ? { ...telemetry } : undefined;
}

export function deriveFramingGovernorSnapshot(
  context: StageFrameContext,
  previousTelemetry?: StageCompositionTelemetry,
  shotSeconds = 0
): FramingGovernorSnapshot {
  const normalizedPrevious = normalizeTelemetry(previousTelemetry);
  const plan = deepClonePlan(DEFAULT_STAGE_COMPOSITION_PLAN);
  const eventScale = chooseEventScale(context);
  const shotClass = chooseShotClass(context, eventScale, normalizedPrevious);
  const transitionClass = chooseTransitionClass(context, eventScale, normalizedPrevious);
  const tempoCadenceMode = chooseTempoCadenceMode(context, eventScale);
  const provisionalHeroEnvelope = chooseHeroEnvelope(
    context,
    normalizedPrevious,
    eventScale,
    0
  );
  const provisionalChamberEnvelope = chooseChamberEnvelope(
    context,
    normalizedPrevious,
    eventScale,
    0
  );
  const provisionalOverbrightRisk = deriveOverbrightRisk(
    context,
    normalizedPrevious,
    provisionalHeroEnvelope,
    provisionalChamberEnvelope
  );
  const heroEnvelope = chooseHeroEnvelope(
    context,
    normalizedPrevious,
    eventScale,
    provisionalOverbrightRisk
  );
  const chamberEnvelope = chooseChamberEnvelope(
    context,
    normalizedPrevious,
    eventScale,
    provisionalOverbrightRisk
  );
  const overbrightRisk = deriveOverbrightRisk(
    context,
    normalizedPrevious,
    heroEnvelope,
    chamberEnvelope
  );
  const fallbackRules = buildFallbackRules(
    context,
    normalizedPrevious,
    shotSeconds,
    eventScale,
    shotClass,
    transitionClass,
    heroEnvelope,
    chamberEnvelope,
    overbrightRisk
  );

  plan.shotClass = shotClass;
  plan.transitionClass = transitionClass;
  plan.eventScale = eventScale;
  plan.tempoCadenceMode = tempoCadenceMode;
  plan.heroEnvelope = heroEnvelope;
  plan.chamberEnvelope = chamberEnvelope;
  plan.subtractivePolicy = chooseSubtractivePolicy(
    context,
    normalizedPrevious,
    transitionClass,
    overbrightRisk
  );
  plan.compositionSafety = clamp01(
    0.74 +
      context.cuePlan.washoutSuppression * 0.08 -
      overbrightRisk * 0.42 -
      (normalizedPrevious?.heroScale != null &&
      normalizedPrevious.heroScale > heroEnvelope.scaleCeiling
        ? 0.08
        : 0) +
      (normalizedPrevious?.compositionSafety ?? 0) * 0.04
  );
  plan.fallbackDemoteHero = fallbackRules.some((rule) => rule.applied && rule.reason !== 'missing-previous-telemetry' && rule.reason !== 'ring-overdraw');
  plan.fallbackWidenShot =
    plan.shotClass === 'worldTakeover' ||
    (eventScale === 'stage' && context.cuePlan.dominance !== 'hero');
  const revealNeedsForcedWorldTakeover =
    context.cuePlan.family === 'reveal' &&
    context.cuePlan.spendProfile === 'peak' &&
    eventScale === 'stage' &&
    context.cuePlan.worldMode === 'cathedral-rise';
  plan.fallbackForceWorldTakeover =
    context.cuePlan.dominance === 'world' ||
    (context.cuePlan.dominance === 'chamber' && eventScale === 'stage') ||
    revealNeedsForcedWorldTakeover;

  for (const rule of fallbackRules) {
    if (rule.applied) {
      applyFallbackAdjustments(plan, rule.adjustments);
    }
  }

  plan.compositionSafety = clamp01(
    plan.compositionSafety -
      (plan.fallbackDemoteHero ? 0.03 : 0) -
      (plan.fallbackForceWorldTakeover ? 0.02 : 0) +
      (plan.fallbackWidenShot ? 0.01 : 0)
  );

  if (
    plan.fallbackForceWorldTakeover &&
    context.cuePlan.family !== 'reset' &&
    context.cuePlan.family !== 'haunt' &&
    context.cuePlan.family !== 'release'
  ) {
    plan.shotClass = 'worldTakeover';
    plan.heroEnvelope.coverageMax = clamp01(plan.heroEnvelope.coverageMax - 0.06);
    plan.heroEnvelope.scaleCeiling = clampRange(plan.heroEnvelope.scaleCeiling - 0.08, 0.5, 1.25);
    plan.chamberEnvelope.presenceFloor = clamp01(Math.max(plan.chamberEnvelope.presenceFloor, 0.48));
    plan.chamberEnvelope.dominanceFloor = clamp01(Math.max(plan.chamberEnvelope.dominanceFloor, 0.46));
    plan.chamberEnvelope.worldTakeoverBias = clamp01(Math.max(plan.chamberEnvelope.worldTakeoverBias, 0.34));
  }

  return {
    plan,
    telemetry: normalizedPrevious,
    overbrightRisk,
    fallbacks: fallbackRules
  };
}
