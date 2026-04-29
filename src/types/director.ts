import type {
  AudioDiagnostics,
  AudioEngineStatus,
  ListeningFrame,
  ListeningMode
} from './audio';
import {
  DEFAULT_USER_CONTROL_STATE,
  applyQuickStartToControlState,
  deriveRuntimeTuning,
  sanitizeUserControlState,
  type QuickStartProfileId,
  type RuntimeTuning,
  type UserControlState
} from './tuning';
import type {
  HeroSemanticRole,
  PaletteState,
  PlayableMotifSceneKind,
  RingPosture,
  StageHeroForm,
  VisualMotifKind
} from './visual';

export type InputRoutePolicy =
  | 'auto'
  | 'this-computer'
  | 'the-room'
  | 'hybrid'
  | 'demo';

export type ShowStartRoute = 'pc-audio' | 'microphone' | 'combo';

export type ShowWorldId =
  | 'pressure-chamber'
  | 'portal-chamber'
  | 'cathedral-lattice'
  | 'storm-crown'
  | 'eclipse-chamber'
  | 'spectral-plume'
  | 'liquid-pressure'
  | 'haunted-residue';

export type LookId =
  | 'void-silk'
  | 'machine-halo'
  | 'neon-cathedral'
  | 'acid-flare'
  | 'ghost-signal'
  | 'ember-veil';

export type DirectorStanceId =
  | 'autonomous'
  | 'monumental'
  | 'volatile'
  | 'ritual'
  | 'spectral'
  | 'velvet-danger';

export type WorldPoolId =
  | 'full-spectrum'
  | 'autonomous-core'
  | 'pressure-worlds'
  | 'spectral-worlds'
  | 'architectural-worlds';

export type LookPoolId =
  | 'full-spectrum'
  | 'autonomous-core'
  | 'electric-looks'
  | 'ghost-looks'
  | 'burn-looks';

export type ResolvedRouteId =
  | 'this-computer'
  | 'the-room'
  | 'hybrid'
  | 'demo';

export type RouteCapabilitySnapshot = {
  microphoneAvailable: boolean;
  displayAudioAvailable: boolean;
};

export type AutoRoutePlanReason =
  | 'room-first-default'
  | 'microphone-unavailable'
  | 'display-audio-unavailable'
  | 'manual-route'
  | 'demo-route';

export type AutoRoutePlan = {
  requestedPolicy: InputRoutePolicy;
  resolvedRoute: ResolvedRouteId;
  sourceMode: ListeningMode;
  compatibilityQuickStartId: QuickStartProfileId | null;
  headline: string;
  detail: string;
  reason: AutoRoutePlanReason;
};

export type AutoRouteRecommendationReason =
  | 'room-feed-weak'
  | 'room-feed-limited'
  | 'room-path-unavailable'
  | 'pc-audio-ended';

export type AutoRouteRecommendation = {
  recommendedRoute: ResolvedRouteId;
  sourceMode: ListeningMode;
  strength: 'soft' | 'strong';
  reason: AutoRouteRecommendationReason;
  headline: string;
  detail: string;
};

export type DirectorBiasKey =
  | 'heroPresence'
  | 'worldTakeover'
  | 'scale'
  | 'depth'
  | 'motionAppetite'
  | 'cameraAppetite'
  | 'syncAppetite'
  | 'drift'
  | 'emission'
  | 'paletteHeat'
  | 'contrast'
  | 'saturation'
  | 'impactAppetite'
  | 'aftermath'
  | 'residueAppetite'
  | 'eventAppetite'
  | 'ritual'
  | 'machine'
  | 'elegance'
  | 'danger';

export type DirectorBiasGroup =
  | 'authority'
  | 'motion'
  | 'color'
  | 'consequence'
  | 'character';

export type DirectorBiasState = Record<DirectorBiasKey, number>;

export type AdvancedSteeringKey =
  | 'worldTakeover'
  | 'depth'
  | 'motionAppetite'
  | 'paletteHeat'
  | 'contrast'
  | 'saturation'
  | 'impactAppetite'
  | 'aftermath';

export type AdvancedSteeringState = Record<AdvancedSteeringKey, number>;

export type AdvancedCurationState = {
  worldPoolId: WorldPoolId;
  lookPoolId: LookPoolId;
  showWorldId: ShowWorldId | null;
  lookId: LookId | null;
  stanceId: DirectorStanceId | null;
};

export type ShowCapabilityMode = 'full-autonomous' | 'curated';

export type ShowConstraintState = {
  hasWorldPoolConstraint: boolean;
  hasLookPoolConstraint: boolean;
  hasWorldAnchor: boolean;
  hasLookAnchor: boolean;
  hasStanceOverride: boolean;
  hasSteeringOverride: boolean;
};

export type DirectorSceneIntent = Exclude<PlayableMotifSceneKind, 'none'>;

export type DirectorOptionAuditTone = 'ok' | 'info' | 'warn';

export type DirectorOptionAuditItem = {
  tone: DirectorOptionAuditTone;
  title: string;
  body: string;
};

export type DirectorOptionAudit = {
  tone: DirectorOptionAuditTone;
  headline: string;
  detail: string;
  autonomyScore: number;
  expectedSceneCount: number;
  expectedSceneIntents: DirectorSceneIntent[];
  notes: DirectorOptionAuditItem[];
};

export type AnthologyGraduationStatus =
  | 'lab'
  | 'frontier'
  | 'flagship'
  | 'retired';

export type WorldFamilyId = ShowWorldId;

export type LookProfileId = LookId;

export type HeroSpeciesId =
  | 'idol-core'
  | 'twin-entities'
  | 'shard-flock'
  | 'membrane-body'
  | 'lattice-skeleton'
  | 'signal-glyph'
  | 'world-as-hero';

export type HeroMutationVerb =
  | 'hold'
  | 'split'
  | 'fuse'
  | 'molt'
  | 'peel'
  | 'crystallize'
  | 'liquefy'
  | 'invert'
  | 'hollow'
  | 'chorus-spawn';

export type WorldMutationVerb =
  | 'hold'
  | 'open'
  | 'seal'
  | 'flood'
  | 'hollow'
  | 'fracture'
  | 'rotate'
  | 'invert'
  | 'stain'
  | 'scar'
  | 'veil'
  | 'burn'
  | 'blackout';

export type ConsequenceMode =
  | 'gather'
  | 'reveal'
  | 'rupture'
  | 'collapse'
  | 'haunt'
  | 'recovery';

export type AftermathState =
  | 'clean-recovery'
  | 'haunted-recovery'
  | 'ember-memory'
  | 'collapsed-void'
  | 'charged-suspension';

export type LightingRigState =
  | 'quiet-halo'
  | 'rim-carve'
  | 'beam-cage'
  | 'scan-sweep'
  | 'eclipse-cut'
  | 'flare-burst';

export type CameraPhrase =
  | 'witness'
  | 'stalk'
  | 'orbit'
  | 'plunge'
  | 'crane'
  | 'recoil'
  | 'float'
  | 'snap-lock';

export type ParticleFieldRole =
  | 'weather'
  | 'offspring'
  | 'chamber-current'
  | 'cue-punctuation'
  | 'aftermath-residue'
  | 'memory-echo';

export type MixedMediaAssetId =
  | 'none'
  | 'signal-mask'
  | 'portal-veil'
  | 'scar-field'
  | 'ghost-echo'
  | 'crown-glyph';

export type MotifId =
  | 'idol-sigil'
  | 'portal-rune'
  | 'cathedral-trace'
  | 'storm-crown'
  | 'eclipse-burn'
  | 'spectral-plume'
  | 'residue-scar';

export type MusicSemanticRegime =
  | 'listening'
  | 'gathering'
  | 'driving'
  | 'detonating'
  | 'recovering';

export type MusicSemanticState = {
  phase: DirectorMusicPhase;
  regime: MusicSemanticRegime;
  sourceMode: ListeningMode;
  inputTrust: number;
  musicConfidence: number;
  pulseWeight: number;
  sectionTurnWeight: number;
  dropWeight: number;
  silenceWeight: number;
};

export type MemoryState = {
  motifId: MotifId;
  recurrenceBias: number;
  scarPersistence: number;
  revisitPressure: number;
};

export type AnthologyPoolState = {
  worldPoolId: WorldPoolId;
  lookPoolId: LookPoolId;
  seedWorldId: ShowWorldId;
  seedLookId: LookId;
  worldAnchorId: ShowWorldId | null;
  lookAnchorId: LookId | null;
  stanceId: DirectorStanceId;
  showCapabilityMode: ShowCapabilityMode;
};

export type AnthologyDirectorState = {
  poolState: AnthologyPoolState;
  music: MusicSemanticState;
  worldFamilyId: WorldFamilyId;
  worldMutationVerb: WorldMutationVerb;
  lookProfileId: LookProfileId;
  stanceId: DirectorStanceId;
  heroSpeciesId: HeroSpeciesId;
  heroMutationVerb: HeroMutationVerb;
  consequenceMode: ConsequenceMode;
  aftermathState: AftermathState;
  lightingRigState: LightingRigState;
  cameraPhrase: CameraPhrase;
  particleFieldRole: ParticleFieldRole;
  mixedMediaAssetId: MixedMediaAssetId;
  motifId: MotifId;
  memoryState: MemoryState;
  graduationStatus: AnthologyGraduationStatus;
};

export type AutoShowState = {
  startRoute: ShowStartRoute;
  routePolicy: InputRoutePolicy;
  sourceMode: ListeningMode;
  phase: DirectorMusicPhase;
  showWorldId: ShowWorldId;
  lookId: LookId;
  worldPoolId: WorldPoolId;
  lookPoolId: LookPoolId;
  stanceId: DirectorStanceId;
  biases: DirectorBiasState;
  permissions: DirectorPermissionProfile;
  compatibilityQuickStartId: QuickStartProfileId | null;
};

export type DirectorIntentState = {
  routePolicy: InputRoutePolicy;
  showWorldId: ShowWorldId;
  lookId: LookId;
  worldPoolId: WorldPoolId;
  lookPoolId: LookPoolId;
  stanceId: DirectorStanceId;
  biases: DirectorBiasState;
};

export type DirectorPermissionProfile = {
  allowWorldMigration: boolean;
  allowLookMigration: boolean;
  allowHeroSuppression: boolean;
  allowAggressiveConsequence: boolean;
  allowQuietResidue: boolean;
  maxRisk: number;
};

export type SavedStance = {
  id: string;
  name: string;
  showWorldId: ShowWorldId;
  lookId: LookId;
  worldPoolId: WorldPoolId;
  lookPoolId: LookPoolId;
  stanceId: DirectorStanceId;
  biases: DirectorBiasState;
  updatedAt: string;
};

export type DirectorMusicPhase =
  | 'quiet'
  | 'gather'
  | 'flow'
  | 'surge'
  | 'aftermath';

export type InputRouteDefinition = {
  id: InputRoutePolicy;
  label: string;
  shortLabel: string;
  description: string;
  startLabel: string;
  mode: ListeningMode | null;
};

export type ShowStartRouteDefinition = {
  id: ShowStartRoute;
  label: string;
  shortLabel: string;
  description: string;
  recommended?: boolean;
};

export type ShowWorldDefinition = {
  id: ShowWorldId;
  label: string;
  eyebrow: string;
  description: string;
  sceneIntent: DirectorSceneIntent;
  motifIntent: VisualMotifKind;
  paletteIntent: PaletteState;
  ringPostureIntent: RingPosture;
  heroRoleIntent: HeroSemanticRole;
  heroFormIntent: StageHeroForm;
  baseControls: Partial<UserControlState>;
  phaseTargets: Partial<Record<DirectorMusicPhase, ShowWorldId>>;
};

export type LookDefinition = {
  id: LookId;
  label: string;
  eyebrow: string;
  description: string;
  sceneIntent: DirectorSceneIntent;
  motifIntent: VisualMotifKind;
  paletteIntent: PaletteState;
  ringPostureIntent: RingPosture;
  heroRoleIntent: HeroSemanticRole;
  heroFormIntent: StageHeroForm;
  baseControls: Partial<UserControlState>;
  phaseTargets: Partial<Record<DirectorMusicPhase, LookId>>;
};

export type WorldPoolDefinition = {
  id: WorldPoolId;
  label: string;
  description: string;
  worldIds: ShowWorldId[];
  defaultWorldId: ShowWorldId;
};

export type LookPoolDefinition = {
  id: LookPoolId;
  label: string;
  description: string;
  lookIds: LookId[];
  defaultLookId: LookId;
};

export type DirectorStanceDefinition = {
  id: DirectorStanceId;
  label: string;
  description: string;
  baseControls: Partial<UserControlState>;
  permissions: DirectorPermissionProfile;
};

export type DirectorBiasDescriptor = {
  key: DirectorBiasKey;
  group: DirectorBiasGroup;
  label: string;
  hint: string;
  lowLabel: string;
  highLabel: string;
};

export type DirectorResolution = {
  phase: DirectorMusicPhase;
  sourceMode: ListeningMode;
  compatibilityQuickStartId: QuickStartProfileId | null;
  baseControls: UserControlState;
  runtimeTuning: RuntimeTuning;
  effectiveWorldId: ShowWorldId;
  effectiveLookId: LookId;
  permissions: DirectorPermissionProfile;
};

export type DirectorBaseResolution = {
  sourceMode: ListeningMode;
  compatibilityQuickStartId: QuickStartProfileId | null;
  baseControls: UserControlState;
  permissions: DirectorPermissionProfile;
};

export type AppliedShowIntent = {
  showStartRoute: ShowStartRoute;
  autoShowState: AutoShowState;
  curation: AdvancedCurationState;
  steering: AdvancedSteeringState;
  showCapabilityMode: ShowCapabilityMode;
  constraintState: ShowConstraintState;
  anthologyDirectorState: AnthologyDirectorState;
  compatibilityIntent: DirectorIntentState;
  base: DirectorBaseResolution;
  resolution: DirectorResolution;
};

const clamp01 = (value: number): number => {
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
};

const adjust = (value: number, delta: number): number => clamp01(value + delta);

export const INPUT_ROUTE_DEFINITIONS: Record<InputRoutePolicy, InputRouteDefinition> = {
  auto: {
    id: 'auto',
    label: 'Auto Show',
    shortLabel: 'Auto',
    description:
      'Start from the strongest current listening path and let the director take over immediately.',
    startLabel: 'Start Auto Show',
    mode: null
  },
  'this-computer': {
    id: 'this-computer',
    label: 'This Computer',
    shortLabel: 'Computer',
    description:
      'Best when the music is already playing on this machine and direct audio should lead.',
    startLabel: 'Start PC Audio',
    mode: 'system-audio'
  },
  'the-room': {
    id: 'the-room',
    label: 'The Room',
    shortLabel: 'Room',
    description:
      'Best when speakers are in the space and the room itself should shape the performance.',
    startLabel: 'Start Room Listening',
    mode: 'room-mic'
  },
  hybrid: {
    id: 'hybrid',
    label: 'Hybrid',
    shortLabel: 'Hybrid',
    description:
      'Blend direct computer audio with room life so the body and the space can both matter.',
    startLabel: 'Start Hybrid Show',
    mode: 'hybrid'
  },
  demo: {
    id: 'demo',
    label: 'Demo',
    shortLabel: 'Demo',
    description:
      'Reserved fallback route for future non-live autoplay and unattended showroom behavior.',
    startLabel: 'Start Demo',
    mode: null
  }
};

export const SHOW_START_ROUTE_DEFINITIONS: Record<
  ShowStartRoute,
  ShowStartRouteDefinition
> = {
  'pc-audio': {
    id: 'pc-audio',
    label: 'PC Audio',
    shortLabel: 'PC',
    description:
      'Best when the music is already playing on this computer and the cleanest direct feed should lead.',
    recommended: true
  },
  microphone: {
    id: 'microphone',
    label: 'Microphone',
    shortLabel: 'Mic',
    description:
      'Best when the room itself should shape the show and live atmosphere matters as much as direct fidelity.'
  },
  combo: {
    id: 'combo',
    label: 'Combo',
    shortLabel: 'Combo',
    description:
      'Blend direct computer audio with the room so the music stays clear while the space still has a body.'
  }
};

export const SHOW_WORLD_DEFINITIONS: Record<ShowWorldId, ShowWorldDefinition> = {
  'pressure-chamber': {
    id: 'pressure-chamber',
    label: 'Pressure Chamber',
    eyebrow: 'World',
    description: 'Dense, forceful, chamber-led staging with heavy consequence and compressed scale.',
    sceneIntent: 'void-pressure',
    motifIntent: 'world-takeover',
    paletteIntent: 'tron-blue',
    ringPostureIntent: 'event-strike',
    heroRoleIntent: 'supporting',
    heroFormIntent: 'orb',
    baseControls: {
      preset: 'pulse',
      worldActivity: 0.92,
      spectacle: 0.9,
      geometry: 0.82,
      radiance: 0.7,
      atmosphere: 0.72,
      eventfulness: 0.8
    },
    phaseTargets: {
      quiet: 'haunted-residue',
      gather: 'portal-chamber',
      surge: 'storm-crown',
      aftermath: 'eclipse-chamber'
    }
  },
  'portal-chamber': {
    id: 'portal-chamber',
    label: 'Portal Chamber',
    eyebrow: 'World',
    description: 'Apertures, stage openings, and deep spatial transitions that reframe the image.',
    sceneIntent: 'neon-cathedral',
    motifIntent: 'neon-portal',
    paletteIntent: 'tron-blue',
    ringPostureIntent: 'cathedral-architecture',
    heroRoleIntent: 'supporting',
    heroFormIntent: 'prism',
    baseControls: {
      preset: 'lift',
      worldActivity: 0.82,
      spectacle: 0.84,
      geometry: 0.72,
      radiance: 0.64,
      atmosphere: 0.58,
      eventfulness: 0.7
    },
    phaseTargets: {
      quiet: 'spectral-plume',
      gather: 'cathedral-lattice',
      surge: 'pressure-chamber',
      aftermath: 'eclipse-chamber'
    }
  },
  'cathedral-lattice': {
    id: 'cathedral-lattice',
    label: 'Cathedral Lattice',
    eyebrow: 'World',
    description: 'Architectural line worlds, volumetric vaulting, and formal stage authority.',
    sceneIntent: 'neon-cathedral',
    motifIntent: 'neon-portal',
    paletteIntent: 'acid-lime',
    ringPostureIntent: 'cathedral-architecture',
    heroRoleIntent: 'supporting',
    heroFormIntent: 'pyramid',
    baseControls: {
      preset: 'lift',
      framing: 0.88,
      worldActivity: 0.84,
      spectacle: 0.8,
      geometry: 0.9,
      radiance: 0.58,
      beatDrive: 0.62
    },
    phaseTargets: {
      quiet: 'spectral-plume',
      gather: 'portal-chamber',
      surge: 'storm-crown',
      aftermath: 'eclipse-chamber'
    }
  },
  'storm-crown': {
    id: 'storm-crown',
    label: 'Storm Crown',
    eyebrow: 'World',
    description: 'High-risk aerial world with dramatic arcs, exposed force, and event-scale ignition.',
    sceneIntent: 'machine-tunnel',
    motifIntent: 'machine-grid',
    paletteIntent: 'acid-lime',
    ringPostureIntent: 'event-strike',
    heroRoleIntent: 'twin',
    heroFormIntent: 'cube',
    baseControls: {
      preset: 'pulse',
      worldActivity: 0.96,
      spectacle: 1,
      geometry: 0.72,
      radiance: 0.82,
      beatDrive: 0.9,
      eventfulness: 0.9
    },
    phaseTargets: {
      quiet: 'haunted-residue',
      gather: 'pressure-chamber',
      surge: 'storm-crown',
      aftermath: 'eclipse-chamber'
    }
  },
  'eclipse-chamber': {
    id: 'eclipse-chamber',
    label: 'Eclipse Chamber',
    eyebrow: 'World',
    description: 'Dark recovery chamber with strong shadow authority, negative space, and post-memory.',
    sceneIntent: 'void-pressure',
    motifIntent: 'void-anchor',
    paletteIntent: 'void-cyan',
    ringPostureIntent: 'suppressed',
    heroRoleIntent: 'world-as-hero',
    heroFormIntent: 'orb',
    baseControls: {
      preset: 'room',
      worldActivity: 0.78,
      spectacle: 0.68,
      geometry: 0.68,
      radiance: 0.36,
      atmosphere: 0.76,
      eventfulness: 0.42
    },
    phaseTargets: {
      quiet: 'haunted-residue',
      gather: 'portal-chamber',
      surge: 'pressure-chamber',
      aftermath: 'eclipse-chamber'
    }
  },
  'spectral-plume': {
    id: 'spectral-plume',
    label: 'Spectral Plume',
    eyebrow: 'World',
    description: 'Ghosted field behavior, airy spread, and low-energy life without dead air.',
    sceneIntent: 'ghost-constellation',
    motifIntent: 'silence-constellation',
    paletteIntent: 'ghost-white',
    ringPostureIntent: 'residue-trace',
    heroRoleIntent: 'ghost',
    heroFormIntent: 'mushroom',
    baseControls: {
      preset: 'room',
      framing: 0.8,
      worldActivity: 0.76,
      spectacle: 0.64,
      geometry: 0.46,
      radiance: 0.54,
      atmosphere: 0.88
    },
    phaseTargets: {
      quiet: 'spectral-plume',
      gather: 'portal-chamber',
      surge: 'pressure-chamber',
      aftermath: 'haunted-residue'
    }
  },
  'liquid-pressure': {
    id: 'liquid-pressure',
    label: 'Liquid Pressure',
    eyebrow: 'World',
    description: 'Fluid, pressurized, drifting world with a heavy body and slower reconfiguration.',
    sceneIntent: 'void-pressure',
    motifIntent: 'void-anchor',
    paletteIntent: 'void-cyan',
    ringPostureIntent: 'suppressed',
    heroRoleIntent: 'membrane',
    heroFormIntent: 'orb',
    baseControls: {
      preset: 'lift',
      framing: 0.74,
      worldActivity: 0.84,
      spectacle: 0.78,
      geometry: 0.56,
      radiance: 0.62,
      atmosphere: 0.84
    },
    phaseTargets: {
      quiet: 'spectral-plume',
      gather: 'pressure-chamber',
      surge: 'storm-crown',
      aftermath: 'eclipse-chamber'
    }
  },
  'haunted-residue': {
    id: 'haunted-residue',
    label: 'Haunted Residue',
    eyebrow: 'World',
    description: 'Residual ghosts, frame scars, and aftermath-led image memory with slow breathing.',
    sceneIntent: 'ghost-constellation',
    motifIntent: 'ghost-residue',
    paletteIntent: 'ghost-white',
    ringPostureIntent: 'residue-trace',
    heroRoleIntent: 'ghost',
    heroFormIntent: 'diamond',
    baseControls: {
      preset: 'room',
      framing: 0.86,
      worldActivity: 0.74,
      spectacle: 0.58,
      geometry: 0.52,
      radiance: 0.42,
      atmosphere: 0.92
    },
    phaseTargets: {
      quiet: 'haunted-residue',
      gather: 'spectral-plume',
      surge: 'pressure-chamber',
      aftermath: 'haunted-residue'
    }
  }
};

export const LOOK_DEFINITIONS: Record<LookId, LookDefinition> = {
  'void-silk': {
    id: 'void-silk',
    label: 'Void Silk',
    eyebrow: 'Look',
    description: 'Dark-body restraint, soft void spread, and elegant quiet-stage contrast.',
    sceneIntent: 'void-pressure',
    motifIntent: 'void-anchor',
    paletteIntent: 'void-cyan',
    ringPostureIntent: 'suppressed',
    heroRoleIntent: 'world-as-hero',
    heroFormIntent: 'orb',
    baseControls: {
      preset: 'room',
      radiance: 0.36,
      atmosphere: 0.72,
      colorBias: 0.38
    },
    phaseTargets: {
      quiet: 'void-silk',
      surge: 'machine-halo',
      aftermath: 'ember-veil'
    }
  },
  'machine-halo': {
    id: 'machine-halo',
    label: 'Machine Halo',
    eyebrow: 'Look',
    description: 'Cold-voltage machine read with strong seams, wire, and emitted edge authority.',
    sceneIntent: 'machine-tunnel',
    motifIntent: 'machine-grid',
    paletteIntent: 'tron-blue',
    ringPostureIntent: 'event-strike',
    heroRoleIntent: 'supporting',
    heroFormIntent: 'cube',
    baseControls: {
      preset: 'pulse',
      geometry: 0.74,
      radiance: 0.72,
      beatDrive: 0.86,
      colorBias: 0.44
    },
    phaseTargets: {
      quiet: 'ghost-signal',
      surge: 'acid-flare',
      aftermath: 'ember-veil'
    }
  },
  'neon-cathedral': {
    id: 'neon-cathedral',
    label: 'Neon Cathedral',
    eyebrow: 'Look',
    description: 'High-emission sacred-tech read with bright edges, disciplined void, and premium color worlds.',
    sceneIntent: 'neon-cathedral',
    motifIntent: 'neon-portal',
    paletteIntent: 'solar-magenta',
    ringPostureIntent: 'cathedral-architecture',
    heroRoleIntent: 'supporting',
    heroFormIntent: 'prism',
    baseControls: {
      preset: 'pulse',
      geometry: 0.8,
      radiance: 0.8,
      atmosphere: 0.68,
      colorBias: 0.58
    },
    phaseTargets: {
      quiet: 'ghost-signal',
      surge: 'acid-flare',
      aftermath: 'ember-veil'
    }
  },
  'acid-flare': {
    id: 'acid-flare',
    label: 'Acid Flare',
    eyebrow: 'Look',
    description: 'Dangerous neon burn with harder impact windows and hotter frame spends.',
    sceneIntent: 'collapse-scar',
    motifIntent: 'rupture-scar',
    paletteIntent: 'acid-lime',
    ringPostureIntent: 'event-strike',
    heroRoleIntent: 'fractured',
    heroFormIntent: 'shard',
    baseControls: {
      preset: 'pulse',
      energy: 0.94,
      radiance: 0.86,
      beatDrive: 0.9,
      eventfulness: 0.9,
      colorBias: 0.72
    },
    phaseTargets: {
      quiet: 'void-silk',
      aftermath: 'ember-veil'
    }
  },
  'ghost-signal': {
    id: 'ghost-signal',
    label: 'Ghost Signal',
    eyebrow: 'Look',
    description: 'Cool spectral drift, ghosted residue, and soft but alive low-energy presence.',
    sceneIntent: 'ghost-constellation',
    motifIntent: 'silence-constellation',
    paletteIntent: 'ghost-white',
    ringPostureIntent: 'residue-trace',
    heroRoleIntent: 'ghost',
    heroFormIntent: 'diamond',
    baseControls: {
      preset: 'room',
      radiance: 0.52,
      atmosphere: 0.88,
      colorBias: 0.34
    },
    phaseTargets: {
      quiet: 'ghost-signal',
      surge: 'machine-halo',
      aftermath: 'ember-veil'
    }
  },
  'ember-veil': {
    id: 'ember-veil',
    label: 'Ember Veil',
    eyebrow: 'Look',
    description: 'Warm memory, burnished residue, and aftermath-biased screen consequence.',
    sceneIntent: 'ghost-constellation',
    motifIntent: 'ghost-residue',
    paletteIntent: 'solar-magenta',
    ringPostureIntent: 'residue-trace',
    heroRoleIntent: 'ghost',
    heroFormIntent: 'diamond',
    baseControls: {
      preset: 'lift',
      radiance: 0.58,
      atmosphere: 0.82,
      eventfulness: 0.54,
      colorBias: 0.78
    },
    phaseTargets: {
      quiet: 'void-silk',
      surge: 'acid-flare',
      aftermath: 'ember-veil'
    }
  }
};

export const WORLD_POOL_DEFINITIONS: Record<WorldPoolId, WorldPoolDefinition> = {
  'full-spectrum': {
    id: 'full-spectrum',
    label: 'Full Spectrum',
    description:
      'All flagship worlds stay available so untouched Auto Show runs are never narrowed by default.',
    worldIds: [
      'pressure-chamber',
      'portal-chamber',
      'cathedral-lattice',
      'storm-crown',
      'eclipse-chamber',
      'spectral-plume',
      'liquid-pressure',
      'haunted-residue'
    ],
    defaultWorldId: 'pressure-chamber'
  },
  'autonomous-core': {
    id: 'autonomous-core',
    label: 'Autonomous Core',
    description:
      'Balanced flagship pool with the strongest all-around worlds for no-touch Auto Show runs.',
    worldIds: [
      'pressure-chamber',
      'portal-chamber',
      'storm-crown',
      'eclipse-chamber',
      'spectral-plume',
      'haunted-residue'
    ],
    defaultWorldId: 'pressure-chamber'
  },
  'pressure-worlds': {
    id: 'pressure-worlds',
    label: 'Pressure Worlds',
    description:
      'Heavier force, compressed scale, and more event-forward world migration.',
    worldIds: [
      'pressure-chamber',
      'liquid-pressure',
      'storm-crown',
      'portal-chamber'
    ],
    defaultWorldId: 'pressure-chamber'
  },
  'spectral-worlds': {
    id: 'spectral-worlds',
    label: 'Spectral Worlds',
    description:
      'Ghosted fields, quieter migrations, and more aftermath-capable spatial vocabulary.',
    worldIds: [
      'spectral-plume',
      'haunted-residue',
      'eclipse-chamber',
      'portal-chamber'
    ],
    defaultWorldId: 'spectral-plume'
  },
  'architectural-worlds': {
    id: 'architectural-worlds',
    label: 'Architectural Worlds',
    description:
      'Formal chambers, lattice structure, and stronger stage-space composition.',
    worldIds: [
      'cathedral-lattice',
      'portal-chamber',
      'eclipse-chamber',
      'pressure-chamber'
    ],
    defaultWorldId: 'cathedral-lattice'
  }
};

export const LOOK_POOL_DEFINITIONS: Record<LookPoolId, LookPoolDefinition> = {
  'full-spectrum': {
    id: 'full-spectrum',
    label: 'Full Spectrum',
    description:
      'All flagship looks stay available so untouched Auto Show runs keep the full palette and material spread.',
    lookIds: [
      'void-silk',
      'machine-halo',
      'neon-cathedral',
      'acid-flare',
      'ghost-signal',
      'ember-veil'
    ],
    defaultLookId: 'machine-halo'
  },
  'autonomous-core': {
    id: 'autonomous-core',
    label: 'Autonomous Core',
    description:
      'Balanced flagship look pool with premium color, residue, and material spread.',
    lookIds: [
      'machine-halo',
      'neon-cathedral',
      'ghost-signal',
      'ember-veil',
      'acid-flare'
    ],
    defaultLookId: 'machine-halo'
  },
  'electric-looks': {
    id: 'electric-looks',
    label: 'Electric Looks',
    description:
      'Higher-emission, sharper-voltage looks with hotter chroma and clearer impact spends.',
    lookIds: ['machine-halo', 'neon-cathedral', 'acid-flare'],
    defaultLookId: 'machine-halo'
  },
  'ghost-looks': {
    id: 'ghost-looks',
    label: 'Ghost Looks',
    description:
      'Quieter residue, spectral air, and low-energy life without dead gray fallback.',
    lookIds: ['void-silk', 'ghost-signal', 'ember-veil'],
    defaultLookId: 'ghost-signal'
  },
  'burn-looks': {
    id: 'burn-looks',
    label: 'Burn Looks',
    description:
      'Hotter memory, burn, and aftermath-biased color language for more consequence-driven runs.',
    lookIds: ['ember-veil', 'acid-flare', 'machine-halo'],
    defaultLookId: 'ember-veil'
  }
};

export const WORLD_POOL_IDS = Object.keys(
  WORLD_POOL_DEFINITIONS
) as WorldPoolId[];
export const LOOK_POOL_IDS = Object.keys(LOOK_POOL_DEFINITIONS) as LookPoolId[];

export const DIRECTOR_STANCE_DEFINITIONS: Record<
  DirectorStanceId,
  DirectorStanceDefinition
> = {
  autonomous: {
    id: 'autonomous',
    label: 'Autonomous',
    description: 'Balanced flagship stance that lets the director keep changing the picture with the music.',
    baseControls: {
      preset: 'pulse',
      worldActivity: 0.86,
      spectacle: 0.9,
      radiance: 0.72,
      beatDrive: 0.82,
      eventfulness: 0.78
    },
    permissions: {
      allowWorldMigration: true,
      allowLookMigration: true,
      allowHeroSuppression: true,
      allowAggressiveConsequence: true,
      allowQuietResidue: true,
      maxRisk: 0.76
    }
  },
  monumental: {
    id: 'monumental',
    label: 'Monumental',
    description: 'Bigger chamber/world authority, slower pace, heavier scale, and more formal composition.',
    baseControls: {
      preset: 'lift',
      framing: 0.86,
      worldActivity: 0.92,
      spectacle: 0.94,
      geometry: 0.82,
      atmosphere: 0.74
    },
    permissions: {
      allowWorldMigration: true,
      allowLookMigration: true,
      allowHeroSuppression: true,
      allowAggressiveConsequence: true,
      allowQuietResidue: true,
      maxRisk: 0.68
    }
  },
  volatile: {
    id: 'volatile',
    label: 'Volatile',
    description: 'Faster escalation, stronger event appetite, and bigger willingness to spend consequence.',
    baseControls: {
      preset: 'pulse',
      energy: 0.96,
      spectacle: 1,
      radiance: 0.82,
      beatDrive: 0.92,
      eventfulness: 0.92
    },
    permissions: {
      allowWorldMigration: true,
      allowLookMigration: true,
      allowHeroSuppression: true,
      allowAggressiveConsequence: true,
      allowQuietResidue: false,
      maxRisk: 0.92
    }
  },
  ritual: {
    id: 'ritual',
    label: 'Ritual',
    description: 'Slower ceremonial escalation with residue, darkness, and recovered grandeur.',
    baseControls: {
      preset: 'lift',
      framing: 0.84,
      worldActivity: 0.84,
      geometry: 0.64,
      atmosphere: 0.88,
      colorBias: 0.68,
      accentBias: 'balanced'
    },
    permissions: {
      allowWorldMigration: true,
      allowLookMigration: true,
      allowHeroSuppression: true,
      allowAggressiveConsequence: false,
      allowQuietResidue: true,
      maxRisk: 0.58
    }
  },
  spectral: {
    id: 'spectral',
    label: 'Spectral',
    description: 'Ghosted low-energy dignity with more drift, less blunt force, and stronger aftermath.',
    baseControls: {
      preset: 'room',
      framing: 0.82,
      worldActivity: 0.8,
      radiance: 0.56,
      atmosphere: 0.92,
      eventfulness: 0.48
    },
    permissions: {
      allowWorldMigration: true,
      allowLookMigration: true,
      allowHeroSuppression: true,
      allowAggressiveConsequence: false,
      allowQuietResidue: true,
      maxRisk: 0.46
    }
  },
  'velvet-danger': {
    id: 'velvet-danger',
    label: 'Velvet Danger',
    description: 'Elegant but risky stance with a darker floor, sharper event language, and hotter spends.',
    baseControls: {
      preset: 'pulse',
      framing: 0.76,
      worldActivity: 0.9,
      radiance: 0.76,
      atmosphere: 0.68,
      eventfulness: 0.86,
      colorBias: 0.62
    },
    permissions: {
      allowWorldMigration: true,
      allowLookMigration: true,
      allowHeroSuppression: true,
      allowAggressiveConsequence: true,
      allowQuietResidue: true,
      maxRisk: 0.84
    }
  }
};

export const DIRECTOR_BIAS_DESCRIPTORS: Record<
  DirectorBiasKey,
  DirectorBiasDescriptor
> = {
  heroPresence: {
    key: 'heroPresence',
    group: 'authority',
    label: 'Hero Presence',
    hint: 'How often the emblem should claim the frame instead of yielding to the chamber or world.',
    lowLabel: 'Demoted',
    highLabel: 'Iconic'
  },
  worldTakeover: {
    key: 'worldTakeover',
    group: 'authority',
    label: 'World Takeover',
    hint: 'How willing the director should be to let architecture, field, and chamber own the moment.',
    lowLabel: 'Contained',
    highLabel: 'World-led'
  },
  scale: {
    key: 'scale',
    group: 'authority',
    label: 'Scale',
    hint: 'How much the frame should feel like a room-scale event instead of an object study.',
    lowLabel: 'Intimate',
    highLabel: 'Monumental'
  },
  depth: {
    key: 'depth',
    group: 'authority',
    label: 'Depth',
    hint: 'How much layered space, negative depth, and chamber architecture the director should spend.',
    lowLabel: 'Flat',
    highLabel: 'Deep'
  },
  motionAppetite: {
    key: 'motionAppetite',
    group: 'motion',
    label: 'Motion Appetite',
    hint: 'How eager the show should be to move, travel, and phrase through space when the music supports it.',
    lowLabel: 'Held',
    highLabel: 'Restless'
  },
  cameraAppetite: {
    key: 'cameraAppetite',
    group: 'motion',
    label: 'Camera Appetite',
    hint: 'How much camera authorship the director is allowed to spend instead of fixed observing.',
    lowLabel: 'Observe',
    highLabel: 'Roam'
  },
  syncAppetite: {
    key: 'syncAppetite',
    group: 'motion',
    label: 'Sync Appetite',
    hint: 'How tightly the show should lock to rhythm instead of drifting through broader phrase motion.',
    lowLabel: 'Float',
    highLabel: 'Lock'
  },
  drift: {
    key: 'drift',
    group: 'motion',
    label: 'Drift',
    hint: 'How much slow inter-beat travel, hover, and off-beat life the show should keep alive.',
    lowLabel: 'Clean',
    highLabel: 'Breathing'
  },
  emission: {
    key: 'emission',
    group: 'color',
    label: 'Emission',
    hint: 'How willing the frame should be to spend emitted light, edge flare, and radiance.',
    lowLabel: 'Dark-body',
    highLabel: 'Luminous'
  },
  paletteHeat: {
    key: 'paletteHeat',
    group: 'color',
    label: 'Palette Heat',
    hint: 'Cool spectral versus hotter ember and acid directions in the palette drift.',
    lowLabel: 'Cool',
    highLabel: 'Hot'
  },
  contrast: {
    key: 'contrast',
    group: 'color',
    label: 'Contrast',
    hint: 'How hard the frame should separate dark anchor from emitted spend.',
    lowLabel: 'Soft',
    highLabel: 'Hard'
  },
  saturation: {
    key: 'saturation',
    group: 'color',
    label: 'Saturation',
    hint: 'How pure or restrained the color worlds should become when the show opens up.',
    lowLabel: 'Reserved',
    highLabel: 'Vivid'
  },
  impactAppetite: {
    key: 'impactAppetite',
    group: 'consequence',
    label: 'Impact Appetite',
    hint: 'How strongly major events are allowed to transform the whole frame instead of just the object.',
    lowLabel: 'Measured',
    highLabel: 'Violent'
  },
  aftermath: {
    key: 'aftermath',
    group: 'consequence',
    label: 'Aftermath',
    hint: 'How much recovery, echo, and spent memory should remain after the biggest events.',
    lowLabel: 'Clean reset',
    highLabel: 'Lingering'
  },
  residueAppetite: {
    key: 'residueAppetite',
    group: 'consequence',
    label: 'Residue Appetite',
    hint: 'How willing the director should be to spend stains, ghosts, and residual frame memory.',
    lowLabel: 'Sparse',
    highLabel: 'Scarred'
  },
  eventAppetite: {
    key: 'eventAppetite',
    group: 'consequence',
    label: 'Event Appetite',
    hint: 'How frequently the director is allowed to escalate into bigger show consequences.',
    lowLabel: 'Rare',
    highLabel: 'Frequent'
  },
  ritual: {
    key: 'ritual',
    group: 'character',
    label: 'Ritual',
    hint: 'How ceremonial, sacred, and processional the show should feel instead of purely reactive.',
    lowLabel: 'Neutral',
    highLabel: 'Ceremonial'
  },
  machine: {
    key: 'machine',
    group: 'character',
    label: 'Machine',
    hint: 'How much the world should read like a precise mechanism instead of an organic apparition.',
    lowLabel: 'Organic',
    highLabel: 'Mechanical'
  },
  elegance: {
    key: 'elegance',
    group: 'character',
    label: 'Elegance',
    hint: 'How much the director should prefer composure, restraint, and premium pacing over brute force.',
    lowLabel: 'Raw',
    highLabel: 'Elegant'
  },
  danger: {
    key: 'danger',
    group: 'character',
    label: 'Danger',
    hint: 'How risky, sharp, and unstable the show is allowed to become when the music turns.',
    lowLabel: 'Safe',
    highLabel: 'Risky'
  }
};

export const DIRECTOR_BIAS_GROUP_ORDER: DirectorBiasGroup[] = [
  'authority',
  'motion',
  'color',
  'consequence',
  'character'
];

export const ADVANCED_STEERING_KEYS: AdvancedSteeringKey[] = [
  'worldTakeover',
  'depth',
  'motionAppetite',
  'paletteHeat',
  'contrast',
  'saturation',
  'impactAppetite',
  'aftermath'
];

export const DEFAULT_DIRECTOR_BIAS_STATE: DirectorBiasState = {
  heroPresence: 0.44,
  worldTakeover: 0.74,
  scale: 0.82,
  depth: 0.78,
  motionAppetite: 0.72,
  cameraAppetite: 0.66,
  syncAppetite: 0.68,
  drift: 0.62,
  emission: 0.74,
  paletteHeat: 0.58,
  contrast: 0.72,
  saturation: 0.7,
  impactAppetite: 0.78,
  aftermath: 0.66,
  residueAppetite: 0.56,
  eventAppetite: 0.72,
  ritual: 0.46,
  machine: 0.62,
  elegance: 0.58,
  danger: 0.62
};

export const DEFAULT_DIRECTOR_INTENT: DirectorIntentState = {
  routePolicy: 'auto',
  showWorldId: 'pressure-chamber',
  lookId: 'machine-halo',
  worldPoolId: 'full-spectrum',
  lookPoolId: 'full-spectrum',
  stanceId: 'autonomous',
  biases: DEFAULT_DIRECTOR_BIAS_STATE
};

export const DEFAULT_ADVANCED_CURATION_STATE: AdvancedCurationState = {
  worldPoolId: 'full-spectrum',
  lookPoolId: 'full-spectrum',
  showWorldId: null,
  lookId: null,
  stanceId: null
};

export const DEFAULT_ADVANCED_STEERING_STATE: AdvancedSteeringState = {
  worldTakeover: DEFAULT_DIRECTOR_BIAS_STATE.worldTakeover,
  depth: DEFAULT_DIRECTOR_BIAS_STATE.depth,
  motionAppetite: DEFAULT_DIRECTOR_BIAS_STATE.motionAppetite,
  paletteHeat: DEFAULT_DIRECTOR_BIAS_STATE.paletteHeat,
  contrast: DEFAULT_DIRECTOR_BIAS_STATE.contrast,
  saturation: DEFAULT_DIRECTOR_BIAS_STATE.saturation,
  impactAppetite: DEFAULT_DIRECTOR_BIAS_STATE.impactAppetite,
  aftermath: DEFAULT_DIRECTOR_BIAS_STATE.aftermath
};

function isWorldPoolId(value: unknown): value is WorldPoolId {
  return typeof value === 'string' && value in WORLD_POOL_DEFINITIONS;
}

function isLookPoolId(value: unknown): value is LookPoolId {
  return typeof value === 'string' && value in LOOK_POOL_DEFINITIONS;
}

export function sanitizeDirectorBiasState(
  input?: Partial<DirectorBiasState> | null
): DirectorBiasState {
  return {
    heroPresence: clamp01(input?.heroPresence ?? DEFAULT_DIRECTOR_BIAS_STATE.heroPresence),
    worldTakeover: clamp01(input?.worldTakeover ?? DEFAULT_DIRECTOR_BIAS_STATE.worldTakeover),
    scale: clamp01(input?.scale ?? DEFAULT_DIRECTOR_BIAS_STATE.scale),
    depth: clamp01(input?.depth ?? DEFAULT_DIRECTOR_BIAS_STATE.depth),
    motionAppetite: clamp01(
      input?.motionAppetite ?? DEFAULT_DIRECTOR_BIAS_STATE.motionAppetite
    ),
    cameraAppetite: clamp01(
      input?.cameraAppetite ?? DEFAULT_DIRECTOR_BIAS_STATE.cameraAppetite
    ),
    syncAppetite: clamp01(
      input?.syncAppetite ?? DEFAULT_DIRECTOR_BIAS_STATE.syncAppetite
    ),
    drift: clamp01(input?.drift ?? DEFAULT_DIRECTOR_BIAS_STATE.drift),
    emission: clamp01(input?.emission ?? DEFAULT_DIRECTOR_BIAS_STATE.emission),
    paletteHeat: clamp01(input?.paletteHeat ?? DEFAULT_DIRECTOR_BIAS_STATE.paletteHeat),
    contrast: clamp01(input?.contrast ?? DEFAULT_DIRECTOR_BIAS_STATE.contrast),
    saturation: clamp01(input?.saturation ?? DEFAULT_DIRECTOR_BIAS_STATE.saturation),
    impactAppetite: clamp01(
      input?.impactAppetite ?? DEFAULT_DIRECTOR_BIAS_STATE.impactAppetite
    ),
    aftermath: clamp01(input?.aftermath ?? DEFAULT_DIRECTOR_BIAS_STATE.aftermath),
    residueAppetite: clamp01(
      input?.residueAppetite ?? DEFAULT_DIRECTOR_BIAS_STATE.residueAppetite
    ),
    eventAppetite: clamp01(
      input?.eventAppetite ?? DEFAULT_DIRECTOR_BIAS_STATE.eventAppetite
    ),
    ritual: clamp01(input?.ritual ?? DEFAULT_DIRECTOR_BIAS_STATE.ritual),
    machine: clamp01(input?.machine ?? DEFAULT_DIRECTOR_BIAS_STATE.machine),
    elegance: clamp01(input?.elegance ?? DEFAULT_DIRECTOR_BIAS_STATE.elegance),
    danger: clamp01(input?.danger ?? DEFAULT_DIRECTOR_BIAS_STATE.danger)
  };
}

export function sanitizeAdvancedSteeringState(
  input?: Partial<AdvancedSteeringState> | null
): AdvancedSteeringState {
  return {
    worldTakeover: clamp01(
      input?.worldTakeover ?? DEFAULT_ADVANCED_STEERING_STATE.worldTakeover
    ),
    depth: clamp01(input?.depth ?? DEFAULT_ADVANCED_STEERING_STATE.depth),
    motionAppetite: clamp01(
      input?.motionAppetite ?? DEFAULT_ADVANCED_STEERING_STATE.motionAppetite
    ),
    paletteHeat: clamp01(
      input?.paletteHeat ?? DEFAULT_ADVANCED_STEERING_STATE.paletteHeat
    ),
    contrast: clamp01(input?.contrast ?? DEFAULT_ADVANCED_STEERING_STATE.contrast),
    saturation: clamp01(
      input?.saturation ?? DEFAULT_ADVANCED_STEERING_STATE.saturation
    ),
    impactAppetite: clamp01(
      input?.impactAppetite ?? DEFAULT_ADVANCED_STEERING_STATE.impactAppetite
    ),
    aftermath: clamp01(input?.aftermath ?? DEFAULT_ADVANCED_STEERING_STATE.aftermath)
  };
}

export function sanitizeAdvancedCurationState(
  input?: Partial<AdvancedCurationState> | null
): AdvancedCurationState {
  return {
    worldPoolId: isWorldPoolId(input?.worldPoolId)
      ? input.worldPoolId
      : DEFAULT_ADVANCED_CURATION_STATE.worldPoolId,
    lookPoolId: isLookPoolId(input?.lookPoolId)
      ? input.lookPoolId
      : DEFAULT_ADVANCED_CURATION_STATE.lookPoolId,
    showWorldId:
      input?.showWorldId && input.showWorldId in SHOW_WORLD_DEFINITIONS
        ? input.showWorldId
        : DEFAULT_ADVANCED_CURATION_STATE.showWorldId,
    lookId:
      input?.lookId && input.lookId in LOOK_DEFINITIONS
        ? input.lookId
        : DEFAULT_ADVANCED_CURATION_STATE.lookId,
    stanceId:
      input?.stanceId && input.stanceId in DIRECTOR_STANCE_DEFINITIONS
        ? input.stanceId
        : DEFAULT_ADVANCED_CURATION_STATE.stanceId
  };
}

export function parseStoredAdvancedCurationState(
  raw?: string | null
): AdvancedCurationState {
  if (!raw) {
    return DEFAULT_ADVANCED_CURATION_STATE;
  }

  try {
    return sanitizeAdvancedCurationState(
      JSON.parse(raw) as Partial<AdvancedCurationState>
    );
  } catch {
    return DEFAULT_ADVANCED_CURATION_STATE;
  }
}

export function serializeAdvancedCurationState(
  state: AdvancedCurationState
): string {
  return JSON.stringify(sanitizeAdvancedCurationState(state));
}

export function parseStoredAdvancedSteeringState(
  raw?: string | null
): AdvancedSteeringState {
  if (!raw) {
    return DEFAULT_ADVANCED_STEERING_STATE;
  }

  try {
    return sanitizeAdvancedSteeringState(
      JSON.parse(raw) as Partial<AdvancedSteeringState>
    );
  } catch {
    return DEFAULT_ADVANCED_STEERING_STATE;
  }
}

export function serializeAdvancedSteeringState(
  state: AdvancedSteeringState
): string {
  return JSON.stringify(sanitizeAdvancedSteeringState(state));
}

export function resolveInputRoutePolicyFromShowStartRoute(
  startRoute: ShowStartRoute
): InputRoutePolicy {
  switch (startRoute) {
    case 'microphone':
      return 'the-room';
    case 'combo':
      return 'hybrid';
    case 'pc-audio':
    default:
      return 'this-computer';
  }
}

export function resolveShowStartRouteFromInputRoutePolicy(
  routePolicy: InputRoutePolicy
): ShowStartRoute {
  switch (routePolicy) {
    case 'the-room':
      return 'microphone';
    case 'hybrid':
      return 'combo';
    case 'auto':
    case 'this-computer':
    case 'demo':
    default:
      return 'pc-audio';
  }
}

export function resolveShowStartRouteFromListeningMode(
  mode: ListeningMode
): ShowStartRoute {
  switch (mode) {
    case 'room-mic':
      return 'microphone';
    case 'hybrid':
      return 'combo';
    case 'system-audio':
    default:
      return 'pc-audio';
  }
}

export function resolveListeningModeFromShowStartRoute(
  startRoute: ShowStartRoute
): ListeningMode {
  switch (startRoute) {
    case 'microphone':
      return 'room-mic';
    case 'combo':
      return 'hybrid';
    case 'pc-audio':
    default:
      return 'system-audio';
  }
}

export function extractAdvancedSteeringFromBiasState(
  biases: DirectorBiasState
): AdvancedSteeringState {
  return sanitizeAdvancedSteeringState({
    worldTakeover: biases.worldTakeover,
    depth: biases.depth,
    motionAppetite: biases.motionAppetite,
    paletteHeat: biases.paletteHeat,
    contrast: biases.contrast,
    saturation: biases.saturation,
    impactAppetite: biases.impactAppetite,
    aftermath: biases.aftermath
  });
}

export function applyAdvancedSteeringToBiasState(
  biases: DirectorBiasState,
  steering: AdvancedSteeringState
): DirectorBiasState {
  return sanitizeDirectorBiasState({
    ...biases,
    worldTakeover: steering.worldTakeover,
    depth: steering.depth,
    motionAppetite: steering.motionAppetite,
    paletteHeat: steering.paletteHeat,
    contrast: steering.contrast,
    saturation: steering.saturation,
    impactAppetite: steering.impactAppetite,
    aftermath: steering.aftermath
  });
}

export function sanitizeDirectorIntent(
  input?: Partial<DirectorIntentState> | null
): DirectorIntentState {
  const routePolicy =
    input?.routePolicy && input.routePolicy in INPUT_ROUTE_DEFINITIONS
      ? input.routePolicy
      : DEFAULT_DIRECTOR_INTENT.routePolicy;
  const showWorldId =
    input?.showWorldId && input.showWorldId in SHOW_WORLD_DEFINITIONS
      ? input.showWorldId
      : DEFAULT_DIRECTOR_INTENT.showWorldId;
  const lookId =
    input?.lookId && input.lookId in LOOK_DEFINITIONS
      ? input.lookId
      : DEFAULT_DIRECTOR_INTENT.lookId;
  const stanceId =
    input?.stanceId && input.stanceId in DIRECTOR_STANCE_DEFINITIONS
      ? input.stanceId
      : DEFAULT_DIRECTOR_INTENT.stanceId;
  const worldPoolId = isWorldPoolId(input?.worldPoolId)
    ? input.worldPoolId
    : DEFAULT_DIRECTOR_INTENT.worldPoolId;
  const lookPoolId = isLookPoolId(input?.lookPoolId)
    ? input.lookPoolId
    : DEFAULT_DIRECTOR_INTENT.lookPoolId;

  return {
    routePolicy,
    showWorldId,
    lookId,
    stanceId,
    worldPoolId,
    lookPoolId,
    biases: sanitizeDirectorBiasState(input?.biases)
  };
}

export function parseStoredDirectorIntent(raw?: string | null): DirectorIntentState {
  if (!raw) {
    return DEFAULT_DIRECTOR_INTENT;
  }

  try {
    return sanitizeDirectorIntent(
      JSON.parse(raw) as Partial<DirectorIntentState>
    );
  } catch {
    return DEFAULT_DIRECTOR_INTENT;
  }
}

export function serializeDirectorIntent(intent: DirectorIntentState): string {
  return JSON.stringify(sanitizeDirectorIntent(intent));
}

export function parseStoredSavedStances(raw?: string | null): SavedStance[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SavedStance[];

    return Array.isArray(parsed)
      ? parsed
          .map((stance) => sanitizeSavedStance(stance))
          .filter((stance): stance is SavedStance => stance !== null)
      : [];
  } catch {
    return [];
  }
}

export function serializeSavedStances(stances: SavedStance[]): string {
  return JSON.stringify(
    stances
      .map((stance) => sanitizeSavedStance(stance))
      .filter((stance): stance is SavedStance => stance !== null)
  );
}

export function sanitizeSavedStance(input: SavedStance | null | undefined): SavedStance | null {
  if (!input || typeof input.name !== 'string') {
    return null;
  }

  return {
    id: input.id || `stance-${Math.random().toString(36).slice(2, 9)}`,
    name: input.name.trim() || 'Saved stance',
    showWorldId:
      input.showWorldId in SHOW_WORLD_DEFINITIONS
        ? input.showWorldId
        : DEFAULT_DIRECTOR_INTENT.showWorldId,
    lookId:
      input.lookId in LOOK_DEFINITIONS
        ? input.lookId
        : DEFAULT_DIRECTOR_INTENT.lookId,
    worldPoolId: isWorldPoolId(input.worldPoolId)
      ? input.worldPoolId
      : DEFAULT_DIRECTOR_INTENT.worldPoolId,
    lookPoolId: isLookPoolId(input.lookPoolId)
      ? input.lookPoolId
      : DEFAULT_DIRECTOR_INTENT.lookPoolId,
    stanceId:
      input.stanceId in DIRECTOR_STANCE_DEFINITIONS
        ? input.stanceId
        : DEFAULT_DIRECTOR_INTENT.stanceId,
    biases: sanitizeDirectorBiasState(input.biases),
    updatedAt:
      typeof input.updatedAt === 'string' && input.updatedAt.length > 0
        ? input.updatedAt
        : new Date().toISOString()
  };
}

export function createSavedStance(
  name: string,
  intent: DirectorIntentState
): SavedStance {
  return {
    id: `stance-${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim() || 'Saved stance',
    showWorldId: intent.showWorldId,
    lookId: intent.lookId,
    worldPoolId: intent.worldPoolId,
    lookPoolId: intent.lookPoolId,
    stanceId: intent.stanceId,
    biases: sanitizeDirectorBiasState(intent.biases),
    updatedAt: new Date().toISOString()
  };
}

export function createDirectorBiasStateFromLegacyControls(
  controls: UserControlState
): DirectorBiasState {
  return sanitizeDirectorBiasState({
    heroPresence: clamp01(0.76 - controls.worldActivity * 0.4 + controls.framing * 0.18),
    worldTakeover: controls.worldActivity,
    scale: controls.spectacle,
    depth: controls.geometry * 0.54 + controls.atmosphere * 0.46,
    motionAppetite: controls.energy * 0.42 + controls.beatDrive * 0.58,
    cameraAppetite: controls.framing * 0.58 + controls.spectacle * 0.42,
    syncAppetite: controls.beatDrive,
    drift: controls.atmosphere * 0.72 + (1 - controls.beatDrive) * 0.28,
    emission: controls.radiance,
    paletteHeat: controls.colorBias,
    contrast: controls.radiance * 0.56 + controls.spectacle * 0.44,
    saturation: controls.radiance * 0.46 + controls.colorBias * 0.54,
    impactAppetite: controls.energy * 0.64 + controls.eventfulness * 0.36,
    aftermath: controls.atmosphere * 0.52 + (1 - controls.eventfulness) * 0.18 + 0.3,
    residueAppetite: controls.atmosphere * 0.6 + (1 - controls.radiance) * 0.14,
    eventAppetite: controls.eventfulness,
    ritual: controls.atmosphere * 0.38 + controls.colorBias * 0.22,
    machine: controls.geometry * 0.56 + controls.beatDrive * 0.26,
    elegance: controls.framing * 0.28 + (1 - controls.eventfulness) * 0.24 + 0.4,
    danger:
      controls.energy * 0.36 +
      controls.eventfulness * 0.38 +
      controls.beatDrive * 0.16 +
      (controls.accentBias === 'sharper-rhythm' ? 0.1 : 0)
  });
}

export function detectRouteCapabilities(): RouteCapabilitySnapshot {
  const mediaDevices =
    typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;

  return {
    microphoneAvailable: Boolean(mediaDevices?.getUserMedia),
    displayAudioAvailable: Boolean(mediaDevices?.getDisplayMedia)
  };
}

export function resolveRouteIdFromListeningMode(mode: ListeningMode): ResolvedRouteId {
  switch (mode) {
    case 'system-audio':
      return 'this-computer';
    case 'hybrid':
      return 'hybrid';
    case 'room-mic':
    default:
      return 'the-room';
  }
}

export function resolveListeningModeFromRoutePolicy(
  routePolicy: InputRoutePolicy,
  currentMode: ListeningMode
): ListeningMode {
  switch (routePolicy) {
    case 'this-computer':
      return 'system-audio';
    case 'the-room':
      return 'room-mic';
    case 'hybrid':
      return 'hybrid';
    case 'auto':
      return currentMode;
    case 'demo':
    default:
      return currentMode;
  }
}

export function resolveAutoRoutePlan(
  routePolicy: InputRoutePolicy,
  currentMode: ListeningMode,
  capabilities: RouteCapabilitySnapshot
): AutoRoutePlan {
  if (routePolicy === 'demo') {
    return {
      requestedPolicy: routePolicy,
      resolvedRoute: 'demo',
      sourceMode: currentMode,
      compatibilityQuickStartId: null,
      headline: 'Demo route',
      detail:
        'Demo mode is reserved for future unattended show behavior and does not force a live source route yet.',
      reason: 'demo-route'
    };
  }

  if (routePolicy !== 'auto') {
    const sourceMode = resolveListeningModeFromRoutePolicy(routePolicy, currentMode);

    return {
      requestedPolicy: routePolicy,
      resolvedRoute: routePolicy,
      sourceMode,
      compatibilityQuickStartId: getCompatibilityQuickStartProfileId(routePolicy, sourceMode),
      headline: INPUT_ROUTE_DEFINITIONS[routePolicy].label,
      detail: INPUT_ROUTE_DEFINITIONS[routePolicy].description,
      reason: 'manual-route'
    };
  }

  if (capabilities.microphoneAvailable) {
    return {
      requestedPolicy: routePolicy,
      resolvedRoute: 'the-room',
      sourceMode: 'room-mic',
      compatibilityQuickStartId: getCompatibilityQuickStartProfileId('the-room', 'room-mic'),
      headline: 'Room First',
      detail:
        'Auto Show opens on room listening first and only recommends stronger direct routes if the live feed needs help.',
      reason: 'room-first-default'
    };
  }

  if (capabilities.displayAudioAvailable) {
    return {
      requestedPolicy: routePolicy,
      resolvedRoute: 'this-computer',
      sourceMode: 'system-audio',
      compatibilityQuickStartId: getCompatibilityQuickStartProfileId(
        'this-computer',
        'system-audio'
      ),
      headline: 'Auto Show fell back to This Computer',
      detail:
        'Microphone capture is unavailable here, so Auto Show starts from direct PC audio instead.',
      reason: 'microphone-unavailable'
    };
  }

  const resolvedRoute = resolveRouteIdFromListeningMode(currentMode);

  return {
    requestedPolicy: routePolicy,
    resolvedRoute,
    sourceMode: currentMode,
    compatibilityQuickStartId: getCompatibilityQuickStartProfileId(
      resolvedRoute,
      currentMode
    ),
    headline: 'Auto Show is holding the current route',
    detail:
      'The browser does not expose a stronger live capture path right now, so Auto Show stays on the current route.',
    reason: 'display-audio-unavailable'
  };
}

export function resolveAutoRouteRecommendation(input: {
  routePolicy: InputRoutePolicy;
  currentMode: ListeningMode;
  statusPhase: AudioEngineStatus['phase'];
  diagnostics: Pick<
    AudioDiagnostics,
    'rawRms' | 'noiseFloor' | 'roomMusicFloorActive'
  >;
  frame: Pick<ListeningFrame, 'musicConfidence' | 'speechConfidence'>;
  capabilities: RouteCapabilitySnapshot;
}): AutoRouteRecommendation | null {
  const routeIsRoomLed =
    input.currentMode === 'room-mic' &&
    (input.routePolicy === 'auto' || input.routePolicy === 'the-room');

  if (!routeIsRoomLed) {
    return null;
  }

  if (
    input.statusPhase === 'error' &&
    input.capabilities.displayAudioAvailable
  ) {
    return {
      recommendedRoute: 'this-computer',
      sourceMode: 'system-audio',
      strength: 'strong',
      reason: 'room-path-unavailable',
      headline: 'Switch to This Computer',
      detail:
        'Room listening could not stay live here. Direct PC audio is the strongest recovery path.'
    };
  }

  if (input.statusPhase !== 'live' || !input.capabilities.displayAudioAvailable) {
    return null;
  }

  const weakRoomFeed =
    input.frame.musicConfidence < 0.18 &&
    input.frame.speechConfidence < 0.38 &&
    input.diagnostics.rawRms <= Math.max(input.diagnostics.noiseFloor * 1.5, 0.03) &&
    !input.diagnostics.roomMusicFloorActive;

  if (weakRoomFeed) {
    return {
      recommendedRoute: 'this-computer',
      sourceMode: 'system-audio',
      strength: 'strong',
      reason: 'room-feed-weak',
      headline: 'This Computer would read the music more clearly',
      detail:
        'The room feed is too weak for a strong autonomous run. Switch to direct PC audio for a cleaner musical lead.'
    };
  }

  if (
    input.frame.musicConfidence < 0.34 ||
    input.diagnostics.roomMusicFloorActive
  ) {
    return {
      recommendedRoute: 'hybrid',
      sourceMode: 'hybrid',
      strength: 'soft',
      reason: 'room-feed-limited',
      headline: 'Hybrid could add a cleaner musical spine',
      detail:
        'The room path is alive but still soft. Hybrid can keep the space while giving the director a steadier direct feed.'
    };
  }

  return null;
}

export function getCompatibilityQuickStartProfileId(
  routePolicy: InputRoutePolicy,
  mode: ListeningMode
): QuickStartProfileId | null {
  switch (routePolicy) {
    case 'this-computer':
      return 'pc-music';
    case 'the-room':
      return 'room-music';
    case 'hybrid':
      return 'hybrid-show';
    case 'auto':
      switch (mode) {
        case 'system-audio':
          return 'pc-music';
        case 'hybrid':
          return 'hybrid-show';
        case 'room-mic':
        default:
          return 'room-music';
      }
    case 'demo':
    default:
      return null;
  }
}

export function getCompatibilityQuickStartProfileIdFromShowStartRoute(
  startRoute: ShowStartRoute
): QuickStartProfileId | null {
  return getCompatibilityQuickStartProfileId(
    resolveInputRoutePolicyFromShowStartRoute(startRoute),
    resolveListeningModeFromShowStartRoute(startRoute)
  );
}

export function classifyDirectorMusicPhase(frame: ListeningFrame): DirectorMusicPhase {
  if (
    frame.showState === 'aftermath' ||
    frame.releaseTail > 0.26
  ) {
    return 'aftermath';
  }

  if (
    frame.showState === 'surge' ||
    frame.dropImpact > 0.34 ||
    frame.sectionChange > 0.42
  ) {
    return 'surge';
  }

  if (
    frame.performanceIntent === 'gather' ||
    frame.preDropTension > 0.22 ||
    frame.sectionChange > 0.16
  ) {
    return 'gather';
  }

  if (
    frame.showState === 'void' ||
    frame.showState === 'atmosphere' ||
    frame.musicConfidence < 0.18
  ) {
    return 'quiet';
  }

  return 'flow';
}

function resolvePoolWorld(
  worldId: ShowWorldId,
  poolId: WorldPoolId
): ShowWorldId {
  const pool = WORLD_POOL_DEFINITIONS[poolId];

  return pool.worldIds.includes(worldId) ? worldId : pool.defaultWorldId;
}

function resolvePoolLook(lookId: LookId, poolId: LookPoolId): LookId {
  const pool = LOOK_POOL_DEFINITIONS[poolId];

  return pool.lookIds.includes(lookId) ? lookId : pool.defaultLookId;
}

function resolveAutonomousSeedWorld(startRoute: ShowStartRoute): ShowWorldId {
  switch (startRoute) {
    case 'microphone':
      return 'spectral-plume';
    case 'combo':
      return 'portal-chamber';
    case 'pc-audio':
    default:
      return 'pressure-chamber';
  }
}

function resolveAutonomousSeedLook(startRoute: ShowStartRoute): LookId {
  switch (startRoute) {
    case 'microphone':
      return 'ghost-signal';
    case 'combo':
      return 'neon-cathedral';
    case 'pc-audio':
    default:
      return 'machine-halo';
  }
}

function resolveAutonomousBiasState(startRoute: ShowStartRoute): DirectorBiasState {
  const base = { ...DEFAULT_DIRECTOR_BIAS_STATE };

  switch (startRoute) {
    case 'microphone':
      return sanitizeDirectorBiasState({
        ...base,
        worldTakeover: 0.8,
        motionAppetite: 0.58,
        paletteHeat: 0.42,
        impactAppetite: 0.64,
        aftermath: 0.82,
        residueAppetite: 0.68,
        ritual: 0.58
      });
    case 'combo':
      return sanitizeDirectorBiasState({
        ...base,
        worldTakeover: 0.78,
        motionAppetite: 0.76,
        paletteHeat: 0.64,
        impactAppetite: 0.82,
        aftermath: 0.7,
        syncAppetite: 0.76,
        eventAppetite: 0.78
      });
    case 'pc-audio':
    default:
      return sanitizeDirectorBiasState({
        ...base,
        worldTakeover: 0.72,
        motionAppetite: 0.74,
        paletteHeat: 0.56,
        impactAppetite: 0.8,
        aftermath: 0.62,
        syncAppetite: 0.74,
        emission: 0.78
      });
  }
}

export function resolveShowConstraintState(
  curationInput?: Partial<AdvancedCurationState> | null,
  steeringInput?: Partial<AdvancedSteeringState> | null
): ShowConstraintState {
  const curation = sanitizeAdvancedCurationState(curationInput);
  const steering = sanitizeAdvancedSteeringState(steeringInput);
  const hasSteeringOverride = ADVANCED_STEERING_KEYS.some(
    (key) =>
      Math.abs(steering[key] - DEFAULT_ADVANCED_STEERING_STATE[key]) > 0.0001
  );

  return {
    hasWorldPoolConstraint: curation.worldPoolId !== 'full-spectrum',
    hasLookPoolConstraint: curation.lookPoolId !== 'full-spectrum',
    hasWorldAnchor: curation.showWorldId !== null,
    hasLookAnchor: curation.lookId !== null,
    hasStanceOverride: curation.stanceId !== null,
    hasSteeringOverride
  };
}

function collectExpectedSceneIntents(curation: AdvancedCurationState): DirectorSceneIntent[] {
  const scenes = new Set<DirectorSceneIntent>();
  const worldIds = curation.showWorldId
    ? [curation.showWorldId]
    : WORLD_POOL_DEFINITIONS[curation.worldPoolId].worldIds;
  const lookIds = curation.lookId
    ? [curation.lookId]
    : LOOK_POOL_DEFINITIONS[curation.lookPoolId].lookIds;

  for (const worldId of worldIds) {
    scenes.add(SHOW_WORLD_DEFINITIONS[worldId].sceneIntent);
  }

  for (const lookId of lookIds) {
    scenes.add(LOOK_DEFINITIONS[lookId].sceneIntent);
  }

  return [...scenes];
}

export function resolveDirectorOptionAudit(
  curationInput?: Partial<AdvancedCurationState> | null,
  steeringInput?: Partial<AdvancedSteeringState> | null
): DirectorOptionAudit {
  const curation = sanitizeAdvancedCurationState(curationInput);
  const steering = sanitizeAdvancedSteeringState(steeringInput);
  const constraints = resolveShowConstraintState(curation, steering);
  const notes: DirectorOptionAuditItem[] = [];
  const steeringOverrideCount = ADVANCED_STEERING_KEYS.filter(
    (key) =>
      Math.abs(steering[key] - DEFAULT_ADVANCED_STEERING_STATE[key]) > 0.0001
  ).length;
  const expectedSceneIntents = collectExpectedSceneIntents(curation);
  const selectedWorld = curation.showWorldId
    ? SHOW_WORLD_DEFINITIONS[curation.showWorldId]
    : null;
  const selectedLook = curation.lookId ? LOOK_DEFINITIONS[curation.lookId] : null;
  const selectedStance = curation.stanceId
    ? DIRECTOR_STANCE_DEFINITIONS[curation.stanceId]
    : null;

  let autonomyScore = 1;
  if (constraints.hasWorldPoolConstraint) {
    autonomyScore -= 0.1;
  }
  if (constraints.hasLookPoolConstraint) {
    autonomyScore -= 0.1;
  }
  if (constraints.hasWorldAnchor) {
    autonomyScore -= 0.2;
  }
  if (constraints.hasLookAnchor) {
    autonomyScore -= 0.2;
  }
  if (constraints.hasStanceOverride) {
    autonomyScore -= 0.1;
  }
  autonomyScore -= Math.min(0.16, steeringOverrideCount * 0.035);

  if (expectedSceneIntents.length < 3 && !(selectedWorld && selectedLook)) {
    notes.push({
      tone: 'warn',
      title: 'Narrow scene spread',
      body:
        'This setup leaves fewer than three playable scene families available. It is fine for a focused look, but it can make the show feel samey over a full song.'
    });
    autonomyScore -= 0.1;
  }

  if (selectedWorld && selectedLook && selectedWorld.sceneIntent !== selectedLook.sceneIntent) {
    notes.push({
      tone: 'info',
      title: 'Cross-scene blend',
      body: `${selectedWorld.label} points at ${selectedWorld.sceneIntent}, while ${selectedLook.label} points at ${selectedLook.sceneIntent}. Auto Show will blend them, but a single-scene anchor will read cleaner.`
    });
    autonomyScore -= 0.06;
  }

  if (selectedStance && !selectedStance.permissions.allowQuietResidue) {
    notes.push({
      tone: 'warn',
      title: 'Quiet/ghost reach reduced',
      body:
        'This stance favors impact over recovery. Use it for high-energy exploration, not for proving silence, ghost residue, or premium low-energy states.'
    });
    autonomyScore -= 0.08;
  }

  if (
    steering.contrast < DEFAULT_ADVANCED_STEERING_STATE.contrast - 0.18 ||
    steering.saturation < DEFAULT_ADVANCED_STEERING_STATE.saturation - 0.18
  ) {
    notes.push({
      tone: 'warn',
      title: 'Premium color risk',
      body:
        'Low contrast or saturation steering can make the current neon-portals build read washed out. Use this deliberately, not as a default.'
    });
    autonomyScore -= 0.08;
  }

  if (!constraints.hasWorldAnchor && !constraints.hasLookAnchor) {
    notes.push({
      tone: 'ok',
      title: 'Autonomous migration active',
      body:
        'World and look anchors are open, so the director can still change scenes on phrase, release, rupture, and signature-moment causes.'
    });
  }

  if (
    constraints.hasWorldPoolConstraint ||
    constraints.hasLookPoolConstraint ||
    constraints.hasStanceOverride ||
    constraints.hasSteeringOverride
  ) {
    notes.push({
      tone: 'info',
      title: 'Curated, not proof default',
      body:
        'These choices are remembered for exploration. Serious Proof Wave starts reset them so stale preferences cannot count as proof truth.'
    });
  }

  const score = clamp01(autonomyScore);
  const tone: DirectorOptionAuditTone =
    notes.some((note) => note.tone === 'warn') || score < 0.62
      ? 'warn'
      : score < 0.9
        ? 'info'
        : 'ok';
  const headline =
    tone === 'ok'
      ? 'Director autonomy is open'
      : tone === 'info'
        ? 'Director autonomy is guided'
        : 'Director autonomy is constrained';

  return {
    tone,
    headline,
    detail: `${expectedSceneIntents.length} playable scene family${
      expectedSceneIntents.length === 1 ? '' : 'ies'
    } available from the current world/look setup.`,
    autonomyScore: score,
    expectedSceneCount: expectedSceneIntents.length,
    expectedSceneIntents,
    notes
  };
}

function buildBiasAdjustedControls(
  input: UserControlState,
  biases: DirectorBiasState
): UserControlState {
  return sanitizeUserControlState({
    ...input,
    framing: adjust(
      input.framing,
      (biases.heroPresence - 0.5) * 0.22 -
        (biases.worldTakeover - 0.5) * 0.18 +
        (biases.depth - 0.5) * 0.12 +
        (biases.elegance - 0.5) * 0.08
    ),
    energy: adjust(
      input.energy,
      (biases.impactAppetite - 0.5) * 0.22 +
        (biases.danger - 0.5) * 0.18 -
        (biases.elegance - 0.5) * 0.06
    ),
    worldActivity: adjust(
      input.worldActivity,
      (biases.worldTakeover - 0.5) * 0.34 +
        (biases.depth - 0.5) * 0.18 +
        (biases.scale - 0.5) * 0.14 -
        (biases.heroPresence - 0.5) * 0.22
    ),
    spectacle: adjust(
      input.spectacle,
      (biases.scale - 0.5) * 0.32 +
        (biases.impactAppetite - 0.5) * 0.12 +
        (biases.elegance - 0.5) * 0.06
    ),
    geometry: adjust(
      input.geometry,
      (biases.depth - 0.5) * 0.18 +
        (biases.machine - 0.5) * 0.22 +
        (biases.ritual - 0.5) * 0.08 +
        (biases.contrast - 0.5) * 0.12
    ),
    radiance: adjust(
      input.radiance,
      (biases.emission - 0.5) * 0.2 +
        (biases.saturation - 0.5) * 0.18 -
        (biases.contrast - 0.5) * 0.04
    ),
    beatDrive: adjust(
      input.beatDrive,
      (biases.syncAppetite - 0.5) * 0.28 -
        (biases.drift - 0.5) * 0.16 +
        (biases.machine - 0.5) * 0.08
    ),
    eventfulness: adjust(
      input.eventfulness,
      (biases.eventAppetite - 0.5) * 0.26 +
        (biases.impactAppetite - 0.5) * 0.12 +
        (biases.danger - 0.5) * 0.12
    ),
    atmosphere: adjust(
      input.atmosphere,
      (biases.aftermath - 0.5) * 0.2 +
        (biases.residueAppetite - 0.5) * 0.14 +
        (biases.drift - 0.5) * 0.18 +
        (biases.ritual - 0.5) * 0.12 -
        (biases.contrast - 0.5) * 0.12
    ),
    colorBias: adjust(
      input.colorBias,
      (biases.paletteHeat - 0.5) * 0.3 +
        (biases.ritual - 0.5) * 0.06 -
        (biases.machine - 0.5) * 0.04
    ),
    accentBias:
      biases.syncAppetite + biases.danger + biases.machine > 1.68
        ? 'sharper-rhythm'
        : 'balanced'
  });
}

function buildBaseCompatControls(intent: DirectorIntentState): {
  sourceMode: ListeningMode;
  compatibilityQuickStartId: QuickStartProfileId | null;
  controls: UserControlState;
} {
  const sourceMode = resolveListeningModeFromRoutePolicy(
    intent.routePolicy,
    intent.routePolicy === 'the-room'
      ? 'room-mic'
      : intent.routePolicy === 'hybrid'
        ? 'hybrid'
        : 'system-audio'
  );
  const quickStartId = getCompatibilityQuickStartProfileId(intent.routePolicy, sourceMode);
  const quickStartBase = quickStartId
    ? applyQuickStartToControlState(DEFAULT_USER_CONTROL_STATE, quickStartId)
    : DEFAULT_USER_CONTROL_STATE;
  const stance = DIRECTOR_STANCE_DEFINITIONS[intent.stanceId];
  const world = SHOW_WORLD_DEFINITIONS[resolvePoolWorld(intent.showWorldId, intent.worldPoolId)];
  const look = LOOK_DEFINITIONS[resolvePoolLook(intent.lookId, intent.lookPoolId)];
  const merged = sanitizeUserControlState({
    ...quickStartBase,
    ...stance.baseControls,
    ...world.baseControls,
    ...look.baseControls
  });

  return {
    sourceMode,
    compatibilityQuickStartId: quickStartId,
    controls: buildBiasAdjustedControls(merged, intent.biases)
  };
}

function resolveEffectiveWorldId(
  intent: DirectorIntentState,
  phase: DirectorMusicPhase
): ShowWorldId {
  const pooled = resolvePoolWorld(intent.showWorldId, intent.worldPoolId);
  const base = SHOW_WORLD_DEFINITIONS[pooled];
  const target = base.phaseTargets[phase] ?? pooled;
  const pool = WORLD_POOL_DEFINITIONS[intent.worldPoolId];

  return pool.worldIds.includes(target) ? target : pooled;
}

function resolveEffectiveLookId(
  intent: DirectorIntentState,
  phase: DirectorMusicPhase
): LookId {
  const pooled = resolvePoolLook(intent.lookId, intent.lookPoolId);
  const base = LOOK_DEFINITIONS[pooled];
  const target = base.phaseTargets[phase] ?? pooled;
  const pool = LOOK_POOL_DEFINITIONS[intent.lookPoolId];

  return pool.lookIds.includes(target) ? target : pooled;
}

function buildDynamicRuntimeTuning(
  tuning: RuntimeTuning,
  frame: ListeningFrame,
  phase: DirectorMusicPhase,
  world: ShowWorldDefinition,
  look: LookDefinition,
  stance: DirectorStanceDefinition,
  biases: DirectorBiasState
): RuntimeTuning {
  const quietBias = phase === 'quiet' ? 1 : 0;
  const gatherBias = phase === 'gather' ? 1 : 0;
  const surgeBias = phase === 'surge' ? 1 : 0;
  const aftermathBias = phase === 'aftermath' ? 1 : 0;
  const flowBias = phase === 'flow' ? 1 : 0;
  const worldWeightBias =
    biases.worldTakeover * 0.22 +
    (world.id === 'storm-crown' || world.id === 'pressure-chamber' ? 0.06 : 0) +
    (world.id === 'spectral-plume' || world.id === 'haunted-residue' ? 0.04 : 0);
  const lookEmissionBias =
    biases.emission * 0.18 +
    biases.saturation * 0.08 +
    (look.id === 'acid-flare' || look.id === 'neon-cathedral' ? 0.08 : 0) -
    (look.id === 'void-silk' ? 0.06 : 0);
  const riskBias =
    biases.danger * 0.18 +
    biases.impactAppetite * 0.12 +
    stance.permissions.maxRisk * 0.08;

  return {
    ...tuning,
    response: Math.min(
      1.92,
      tuning.response *
        (1 +
          gatherBias * 0.08 +
          surgeBias * (0.08 + riskBias * 0.18) -
          quietBias * 0.06)
    ),
    motion: Math.min(
      1.72,
      tuning.motion *
        (1 +
          flowBias * 0.06 +
          surgeBias * (0.14 + biases.motionAppetite * 0.12) +
          quietBias * (-0.08 + biases.drift * 0.12) +
          aftermathBias * 0.06)
    ),
    accentStrength:
      tuning.accentStrength *
      (1 +
        surgeBias * (0.12 + biases.syncAppetite * 0.1 + biases.danger * 0.08) -
        quietBias * 0.1),
    eventRate: clamp01(
      tuning.eventRate *
        (1 +
          gatherBias * 0.12 +
          surgeBias * (0.22 + biases.eventAppetite * 0.16) -
          quietBias * 0.2 +
          aftermathBias * 0.08)
    ),
    readableHeroFloor: clamp01(
      tuning.readableHeroFloor *
        (1 +
          (biases.heroPresence - 0.5) * 0.34 -
          worldWeightBias * 0.22 -
          aftermathBias * 0.1 +
          (biases.contrast - 0.5) * 0.08)
    ),
    neonStageFloor: clamp01(
      tuning.neonStageFloor *
        (1 +
          lookEmissionBias +
          frame.musicConfidence * 0.08 +
          surgeBias * 0.12 +
          (biases.saturation - 0.5) * 0.1 -
          quietBias * 0.08)
    ),
    worldBootFloor: clamp01(
      tuning.worldBootFloor *
        (1 +
          worldWeightBias +
          (biases.contrast - 0.5) * 0.08 +
          gatherBias * 0.1 +
          surgeBias * 0.18 +
          aftermathBias * 0.08)
    ),
    cameraNearFloor: clamp01(
      tuning.cameraNearFloor *
        (1 +
          (biases.cameraAppetite - 0.5) * 0.22 +
          (biases.heroPresence - 0.5) * 0.12 -
          (biases.worldTakeover - 0.5) * 0.16 +
          surgeBias * 0.06)
    )
  };
}

export function resolveDirectorBaseState(
  intentInput: DirectorIntentState,
  currentMode: ListeningMode
): DirectorBaseResolution {
  const intent = sanitizeDirectorIntent(intentInput);
  const base = buildBaseCompatControls({
    ...intent,
    routePolicy:
      intent.routePolicy === 'auto'
        ? currentMode === 'hybrid'
          ? 'hybrid'
          : currentMode === 'room-mic'
            ? 'the-room'
          : 'this-computer'
        : intent.routePolicy
  });

  return {
    sourceMode:
      intent.routePolicy === 'auto'
        ? currentMode
        : resolveListeningModeFromRoutePolicy(intent.routePolicy, currentMode),
    compatibilityQuickStartId: base.compatibilityQuickStartId,
    baseControls: base.controls,
    permissions: DIRECTOR_STANCE_DEFINITIONS[intent.stanceId].permissions
  };
}

export function resolveAutoShowState(
  startRoute: ShowStartRoute,
  frame: ListeningFrame,
  currentMode: ListeningMode
): AutoShowState {
  const routePolicy = resolveInputRoutePolicyFromShowStartRoute(startRoute);
  const sourceMode =
    currentMode === resolveListeningModeFromShowStartRoute(startRoute)
      ? currentMode
      : resolveListeningModeFromShowStartRoute(startRoute);
  const phase = classifyDirectorMusicPhase(frame);
  const biases = resolveAutonomousBiasState(startRoute);
  const baseIntent = sanitizeDirectorIntent({
    routePolicy,
    showWorldId: resolveAutonomousSeedWorld(startRoute),
    lookId: resolveAutonomousSeedLook(startRoute),
    worldPoolId: 'full-spectrum',
    lookPoolId: 'full-spectrum',
    stanceId: 'autonomous',
    biases
  });

  return {
    startRoute,
    routePolicy,
    sourceMode,
    phase,
    showWorldId: baseIntent.showWorldId,
    lookId: baseIntent.lookId,
    worldPoolId: baseIntent.worldPoolId,
    lookPoolId: baseIntent.lookPoolId,
    stanceId: baseIntent.stanceId,
    biases: baseIntent.biases,
    permissions: DIRECTOR_STANCE_DEFINITIONS.autonomous.permissions,
    compatibilityQuickStartId: getCompatibilityQuickStartProfileIdFromShowStartRoute(
      startRoute
    )
  };
}

export function resolveMusicSemanticState(
  frame: ListeningFrame,
  phase: DirectorMusicPhase,
  sourceMode: ListeningMode
): MusicSemanticState {
  const routeTrustBase =
    sourceMode === 'hybrid' ? 0.88 : sourceMode === 'system-audio' ? 0.92 : 0.78;

  let regime: MusicSemanticRegime = 'driving';
  switch (phase) {
    case 'quiet':
      regime = 'listening';
      break;
    case 'gather':
      regime = 'gathering';
      break;
    case 'flow':
      regime = 'driving';
      break;
    case 'surge':
      regime = 'detonating';
      break;
    case 'aftermath':
      regime = 'recovering';
      break;
  }

  return {
    phase,
    regime,
    sourceMode,
    inputTrust: clamp01(routeTrustBase * 0.55 + clamp01(frame.musicConfidence) * 0.45),
    musicConfidence: clamp01(frame.musicConfidence),
    pulseWeight: clamp01(frame.beatConfidence),
    sectionTurnWeight: clamp01(frame.sectionChange),
    dropWeight: clamp01(frame.dropImpact),
    silenceWeight: clamp01(
      1 -
        Math.max(
          clamp01(frame.musicConfidence),
          clamp01(frame.beatConfidence),
          clamp01(frame.dropImpact)
        )
    )
  };
}

export function resolveAnthologyPoolState(
  autoShowState: AutoShowState,
  compatibilityIntent: DirectorIntentState,
  curation: AdvancedCurationState,
  showCapabilityMode: ShowCapabilityMode
): AnthologyPoolState {
  return {
    worldPoolId: compatibilityIntent.worldPoolId,
    lookPoolId: compatibilityIntent.lookPoolId,
    seedWorldId: autoShowState.showWorldId,
    seedLookId: autoShowState.lookId,
    worldAnchorId: curation.showWorldId,
    lookAnchorId: curation.lookId,
    stanceId: compatibilityIntent.stanceId,
    showCapabilityMode
  };
}

function resolveConsequenceMode(
  phase: DirectorMusicPhase,
  frame: ListeningFrame
): ConsequenceMode {
  if (phase === 'surge') {
    return clamp01(frame.dropImpact) > 0.54 ? 'rupture' : 'reveal';
  }

  if (phase === 'aftermath') {
    return clamp01(frame.dropImpact) > 0.36 ? 'haunt' : 'recovery';
  }

  if (phase === 'quiet') {
    return 'haunt';
  }

  if (phase === 'gather') {
    return 'gather';
  }

  return clamp01(frame.sectionChange) > 0.34 ? 'reveal' : 'gather';
}

function resolveAftermathState(
  phase: DirectorMusicPhase,
  worldFamilyId: WorldFamilyId,
  lookProfileId: LookProfileId
): AftermathState {
  if (phase === 'aftermath') {
    if (worldFamilyId === 'haunted-residue' || lookProfileId === 'ghost-signal') {
      return 'haunted-recovery';
    }

    if (worldFamilyId === 'eclipse-chamber') {
      return 'collapsed-void';
    }

    return 'ember-memory';
  }

  if (phase === 'surge') {
    return 'charged-suspension';
  }

  return 'clean-recovery';
}

function resolveWorldMutationVerb(
  phase: DirectorMusicPhase,
  worldFamilyId: WorldFamilyId
): WorldMutationVerb {
  if (phase === 'quiet') {
    if (worldFamilyId === 'spectral-plume') {
      return 'veil';
    }

    if (worldFamilyId === 'haunted-residue') {
      return 'stain';
    }

    return 'hold';
  }

  if (phase === 'gather') {
    return worldFamilyId === 'portal-chamber' ? 'open' : 'rotate';
  }

  if (phase === 'surge') {
    if (worldFamilyId === 'storm-crown') {
      return 'burn';
    }

    if (worldFamilyId === 'pressure-chamber') {
      return 'fracture';
    }

    return 'invert';
  }

  if (phase === 'aftermath') {
    return worldFamilyId === 'eclipse-chamber' ? 'blackout' : 'scar';
  }

  return worldFamilyId === 'liquid-pressure' ? 'flood' : 'seal';
}

function resolveHeroSpeciesId(
  startRoute: ShowStartRoute,
  phase: DirectorMusicPhase,
  worldFamilyId: WorldFamilyId
): HeroSpeciesId {
  if (phase === 'quiet' && (worldFamilyId === 'spectral-plume' || worldFamilyId === 'haunted-residue')) {
    return 'signal-glyph';
  }

  if (worldFamilyId === 'cathedral-lattice') {
    return 'lattice-skeleton';
  }

  if (worldFamilyId === 'liquid-pressure') {
    return 'membrane-body';
  }

  if (phase === 'surge' && startRoute === 'combo') {
    return 'twin-entities';
  }

  if (phase === 'surge' && worldFamilyId === 'storm-crown') {
    return 'shard-flock';
  }

  if (phase === 'aftermath' && worldFamilyId === 'eclipse-chamber') {
    return 'world-as-hero';
  }

  return 'idol-core';
}

function resolveHeroMutationVerb(
  phase: DirectorMusicPhase,
  heroSpeciesId: HeroSpeciesId,
  consequenceMode: ConsequenceMode
): HeroMutationVerb {
  if (phase === 'quiet') {
    return heroSpeciesId === 'signal-glyph' ? 'hollow' : 'hold';
  }

  if (phase === 'gather') {
    return heroSpeciesId === 'twin-entities' ? 'split' : 'peel';
  }

  if (phase === 'surge') {
    if (heroSpeciesId === 'shard-flock') {
      return 'chorus-spawn';
    }

    return consequenceMode === 'rupture' ? 'crystallize' : 'invert';
  }

  if (phase === 'aftermath') {
    return heroSpeciesId === 'membrane-body' ? 'liquefy' : 'molt';
  }

  return heroSpeciesId === 'world-as-hero' ? 'fuse' : 'molt';
}

function resolveLightingRigState(
  phase: DirectorMusicPhase,
  worldFamilyId: WorldFamilyId
): LightingRigState {
  if (phase === 'quiet') {
    return worldFamilyId === 'eclipse-chamber' ? 'eclipse-cut' : 'quiet-halo';
  }

  if (phase === 'gather') {
    return worldFamilyId === 'portal-chamber' ? 'scan-sweep' : 'rim-carve';
  }

  if (phase === 'surge') {
    return worldFamilyId === 'storm-crown' ? 'flare-burst' : 'beam-cage';
  }

  if (phase === 'aftermath') {
    return 'eclipse-cut';
  }

  return 'rim-carve';
}

function resolveCameraPhrase(
  phase: DirectorMusicPhase,
  worldFamilyId: WorldFamilyId
): CameraPhrase {
  if (phase === 'quiet') {
    return worldFamilyId === 'spectral-plume' ? 'float' : 'witness';
  }

  if (phase === 'gather') {
    return worldFamilyId === 'portal-chamber' ? 'orbit' : 'crane';
  }

  if (phase === 'surge') {
    return worldFamilyId === 'storm-crown' ? 'plunge' : 'recoil';
  }

  if (phase === 'aftermath') {
    return 'stalk';
  }

  return 'snap-lock';
}

function resolveParticleFieldRole(
  phase: DirectorMusicPhase,
  worldFamilyId: WorldFamilyId
): ParticleFieldRole {
  if (phase === 'quiet') {
    return worldFamilyId === 'haunted-residue' ? 'memory-echo' : 'weather';
  }

  if (phase === 'surge') {
    return worldFamilyId === 'storm-crown' ? 'offspring' : 'cue-punctuation';
  }

  if (phase === 'aftermath') {
    return 'aftermath-residue';
  }

  return 'chamber-current';
}

function resolveMixedMediaAssetId(
  phase: DirectorMusicPhase,
  worldFamilyId: WorldFamilyId,
  lookProfileId: LookProfileId
): MixedMediaAssetId {
  if (phase === 'quiet' && lookProfileId === 'ghost-signal') {
    return 'ghost-echo';
  }

  if (phase === 'gather' && worldFamilyId === 'portal-chamber') {
    return 'portal-veil';
  }

  if (phase === 'surge' && worldFamilyId === 'storm-crown') {
    return 'crown-glyph';
  }

  if (phase === 'aftermath' && (worldFamilyId === 'haunted-residue' || worldFamilyId === 'eclipse-chamber')) {
    return 'scar-field';
  }

  return 'none';
}

function resolveMotifId(
  worldFamilyId: WorldFamilyId,
  lookProfileId: LookProfileId
): MotifId {
  switch (worldFamilyId) {
    case 'portal-chamber':
      return 'portal-rune';
    case 'cathedral-lattice':
      return 'cathedral-trace';
    case 'storm-crown':
      return 'storm-crown';
    case 'eclipse-chamber':
      return 'eclipse-burn';
    case 'spectral-plume':
      return 'spectral-plume';
    case 'haunted-residue':
      return 'residue-scar';
    case 'pressure-chamber':
    case 'liquid-pressure':
    default:
      return lookProfileId === 'ghost-signal' ? 'residue-scar' : 'idol-sigil';
  }
}

function resolveMemoryState(
  phase: DirectorMusicPhase,
  motifId: MotifId,
  showCapabilityMode: ShowCapabilityMode
): MemoryState {
  return {
    motifId,
    recurrenceBias: clamp01(
      (phase === 'quiet' ? 0.68 : phase === 'aftermath' ? 0.82 : 0.54) +
        (showCapabilityMode === 'curated' ? 0.06 : 0)
    ),
    scarPersistence: clamp01(
      phase === 'aftermath' ? 0.86 : phase === 'surge' ? 0.62 : 0.34
    ),
    revisitPressure: clamp01(
      phase === 'gather' ? 0.58 : phase === 'quiet' ? 0.66 : 0.44
    )
  };
}

export function resolveAnthologyDirectorState(
  startRoute: ShowStartRoute,
  autoShowState: AutoShowState,
  compatibilityIntent: DirectorIntentState,
  curation: AdvancedCurationState,
  showCapabilityMode: ShowCapabilityMode,
  resolution: DirectorResolution,
  frame: ListeningFrame,
  currentMode: ListeningMode
): AnthologyDirectorState {
  const poolState = resolveAnthologyPoolState(
    autoShowState,
    compatibilityIntent,
    curation,
    showCapabilityMode
  );
  const music = resolveMusicSemanticState(frame, resolution.phase, currentMode);
  const worldFamilyId: WorldFamilyId = resolution.effectiveWorldId;
  const lookProfileId: LookProfileId = resolution.effectiveLookId;
  const consequenceMode = resolveConsequenceMode(resolution.phase, frame);
  const heroSpeciesId = resolveHeroSpeciesId(startRoute, resolution.phase, worldFamilyId);
  const motifId = resolveMotifId(worldFamilyId, lookProfileId);

  return {
    poolState,
    music,
    worldFamilyId,
    worldMutationVerb: resolveWorldMutationVerb(resolution.phase, worldFamilyId),
    lookProfileId,
    stanceId: compatibilityIntent.stanceId,
    heroSpeciesId,
    heroMutationVerb: resolveHeroMutationVerb(
      resolution.phase,
      heroSpeciesId,
      consequenceMode
    ),
    consequenceMode,
    aftermathState: resolveAftermathState(
      resolution.phase,
      worldFamilyId,
      lookProfileId
    ),
    lightingRigState: resolveLightingRigState(resolution.phase, worldFamilyId),
    cameraPhrase: resolveCameraPhrase(resolution.phase, worldFamilyId),
    particleFieldRole: resolveParticleFieldRole(resolution.phase, worldFamilyId),
    mixedMediaAssetId: resolveMixedMediaAssetId(
      resolution.phase,
      worldFamilyId,
      lookProfileId
    ),
    motifId,
    memoryState: resolveMemoryState(resolution.phase, motifId, showCapabilityMode),
    graduationStatus: 'flagship'
  };
}

export function resolveAppliedShowIntent(
  startRoute: ShowStartRoute,
  curationInput: Partial<AdvancedCurationState> | null | undefined,
  steeringInput: Partial<AdvancedSteeringState> | null | undefined,
  frame: ListeningFrame,
  currentMode: ListeningMode
): AppliedShowIntent {
  const autoShowState = resolveAutoShowState(startRoute, frame, currentMode);
  const curation = sanitizeAdvancedCurationState(curationInput);
  const steering = sanitizeAdvancedSteeringState(steeringInput);
  const constraintState = resolveShowConstraintState(curation, steering);
  const showCapabilityMode: ShowCapabilityMode =
    constraintState.hasWorldPoolConstraint ||
    constraintState.hasLookPoolConstraint ||
    constraintState.hasWorldAnchor ||
    constraintState.hasLookAnchor ||
    constraintState.hasStanceOverride ||
    constraintState.hasSteeringOverride
      ? 'curated'
      : 'full-autonomous';

  const compatibilityIntent = sanitizeDirectorIntent({
    routePolicy: autoShowState.routePolicy,
    showWorldId: curation.showWorldId ?? autoShowState.showWorldId,
    lookId: curation.lookId ?? autoShowState.lookId,
    worldPoolId: curation.worldPoolId,
    lookPoolId: curation.lookPoolId,
    stanceId: curation.stanceId ?? autoShowState.stanceId,
    biases: applyAdvancedSteeringToBiasState(autoShowState.biases, steering)
  });
  const base = resolveDirectorBaseState(compatibilityIntent, currentMode);
  const resolution = resolveDirectorState(compatibilityIntent, frame, currentMode);
  const anthologyDirectorState = resolveAnthologyDirectorState(
    startRoute,
    autoShowState,
    compatibilityIntent,
    curation,
    showCapabilityMode,
    resolution,
    frame,
    currentMode
  );

  return {
    showStartRoute: startRoute,
    autoShowState,
    curation,
    steering,
    showCapabilityMode,
    constraintState,
    anthologyDirectorState,
    compatibilityIntent,
    base,
    resolution
  };
}

export function resolveDirectorState(
  intentInput: DirectorIntentState,
  frame: ListeningFrame,
  currentMode: ListeningMode
): DirectorResolution {
  const intent = sanitizeDirectorIntent(intentInput);
  const phase = classifyDirectorMusicPhase(frame);
  const base = resolveDirectorBaseState(intent, currentMode);
  const effectiveWorldId = resolveEffectiveWorldId(intent, phase);
  const effectiveLookId = resolveEffectiveLookId(intent, phase);
  const runtimeTuning = buildDynamicRuntimeTuning(
    deriveRuntimeTuning(base.baseControls),
    frame,
    phase,
    SHOW_WORLD_DEFINITIONS[effectiveWorldId],
    LOOK_DEFINITIONS[effectiveLookId],
    DIRECTOR_STANCE_DEFINITIONS[intent.stanceId],
    intent.biases
  );

  return {
    ...base,
    phase,
    runtimeTuning,
    effectiveWorldId,
    effectiveLookId
  };
}
