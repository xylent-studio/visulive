import type { QualityTier } from './rendering';

export type PaletteState =
  | 'void-cyan'
  | 'tron-blue'
  | 'acid-lime'
  | 'solar-magenta'
  | 'ghost-white';

export type ShowAct =
  | 'void-chamber'
  | 'laser-bloom'
  | 'matrix-storm'
  | 'eclipse-rupture'
  | 'ghost-afterimage';

export const ATMOSPHERE_MATTER_STATES = [
  'gas',
  'liquid',
  'plasma',
  'crystal'
] as const;

export type AtmosphereMatterState = (typeof ATMOSPHERE_MATTER_STATES)[number];

export type VisualTemporalWindows = {
  preBeatLift: number;
  beatStrike: number;
  postBeatRelease: number;
  interBeatFloat: number;
  barTurn: number;
  phraseResolve: number;
};

export type VisualCueClass =
  | 'brood'
  | 'gather'
  | 'reveal'
  | 'rupture'
  | 'afterglow'
  | 'haunt';

export type CueClass =
  | 'hold'
  | 'gather'
  | 'tighten'
  | 'reveal'
  | 'orbit-widen'
  | 'fan-sweep'
  | 'laser-burst'
  | 'rupture'
  | 'collapse'
  | 'haunt'
  | 'residue'
  | 'recovery';

export type PerformanceRegime =
  | 'silence-beauty'
  | 'room-floor'
  | 'suspense'
  | 'gathering'
  | 'driving'
  | 'surge'
  | 'aftermath';

export type StageIntent =
  | 'hero-pressure'
  | 'chamber-pressure'
  | 'world-takeover'
  | 'residue-memory'
  | 'recovery-hold'
  | 'hybrid';

export type WorldAuthorityState =
  | 'background'
  | 'support'
  | 'shared'
  | 'dominant';

export type HeroAuthorityState =
  | 'subtracted'
  | 'support'
  | 'shared'
  | 'dominant';

export type PostSpendIntent =
  | 'withhold'
  | 'trace'
  | 'stress'
  | 'memory'
  | 'wipe'
  | 'burn';

export type SilenceState =
  | 'none'
  | 'room-floor'
  | 'beauty'
  | 'suspense';

export type PhraseConfidence =
  | 'uncertain'
  | 'forming'
  | 'confident'
  | 'locked';

export type SectionIntent =
  | 'hold'
  | 'turn'
  | 'drop'
  | 'release'
  | 'recovery';

export type VisualCueState = {
  cueClass: VisualCueClass;
  intensity: number;
  attack: number;
  sustain: number;
  decay: number;
  screenWeight: number;
  residueWeight: number;
  worldWeight: number;
  heroWeight: number;
  eventDensity: number;
};

export type StageCueFamily =
  | 'brood'
  | 'gather'
  | 'reveal'
  | 'rupture'
  | 'release'
  | 'haunt'
  | 'reset';

export type StageCueDominance = 'hero' | 'chamber' | 'world' | 'hybrid';

export type StageSpendProfile = 'withheld' | 'earned' | 'peak';

export type StageHeroAnchorLane =
  | 'center'
  | 'left'
  | 'right'
  | 'high'
  | 'low';

export type StageRingAuthority =
  | 'background-scaffold'
  | 'framing-architecture'
  | 'event-platform';

export type StageWorldMode =
  | 'hold'
  | 'aperture-cage'
  | 'fan-sweep'
  | 'cathedral-rise'
  | 'collapse-well'
  | 'ghost-chamber'
  | 'field-bloom';

export type StageCompositorMode =
  | 'none'
  | 'precharge'
  | 'wipe'
  | 'flash'
  | 'scar'
  | 'afterimage'
  | 'cut';

export type StageResidueMode =
  | 'none'
  | 'short'
  | 'afterglow'
  | 'ghost'
  | 'scar'
  | 'clear';

export type StageTransformIntent =
  | 'hold'
  | 'compress'
  | 'open'
  | 'collapse'
  | 'sweep'
  | 'exhale'
  | 'clear';

export type StageMotionPhrase =
  | 'drift-orbit'
  | 'bank-rise'
  | 'arc-handoff'
  | 'tumble-release'
  | 'recoil-dive'
  | 'cathedral-precession';

export type StageHeroForm =
  | 'orb'
  | 'cube'
  | 'pyramid'
  | 'diamond'
  | 'prism'
  | 'shard'
  | 'mushroom';

export type VisualMotifKind =
  | 'void-anchor'
  | 'machine-grid'
  | 'neon-portal'
  | 'rupture-scar'
  | 'ghost-residue'
  | 'silence-constellation'
  | 'acoustic-transient'
  | 'world-takeover';

export type HeroSemanticRole =
  | 'dominant'
  | 'supporting'
  | 'fractured'
  | 'ghost'
  | 'twin'
  | 'membrane'
  | 'suppressed'
  | 'world-as-hero';

export type HeroFormSwitchReason =
  | 'hold'
  | 'motif-change'
  | 'cue-family'
  | 'section-turn'
  | 'drop-rupture'
  | 'release-residue'
  | 'signature-moment'
  | 'authority-demotion';

export type PaletteTransitionReason =
  | 'hold'
  | 'motif-change'
  | 'section-turn'
  | 'drop-rupture'
  | 'release-residue'
  | 'signature-moment'
  | 'authority-shift';

export type PaletteFrameRoles = {
  anchorDark: PaletteState;
  primaryEmission: PaletteState;
  rimSeam: PaletteState;
  accentTransient: PaletteState;
  residueMemory: PaletteState;
  flashWhite: PaletteState;
};

export type PaletteFrame = {
  baseState: PaletteState;
  modulationTargets: Record<PaletteState, number>;
  modulationAmount: number;
  targetDominance: number;
  targetSpread: number;
  transitionReason: PaletteTransitionReason;
  semanticConfidence: number;
  roles: PaletteFrameRoles;
};

export type VisualMotifSnapshot = {
  kind: VisualMotifKind;
  confidence: number;
  reason: string;
  paletteFrame: PaletteFrame;
  heroRole: HeroSemanticRole;
  heroForm: StageHeroForm;
  heroAccentForm: StageHeroForm;
  heroFormReason: HeroFormSwitchReason;
};

export type PlayableMotifSceneKind =
  | 'none'
  | 'neon-cathedral'
  | 'machine-tunnel'
  | 'void-pressure'
  | 'ghost-constellation'
  | 'collapse-scar';

export type PlayableMotifSceneTransitionReason =
  | 'hold'
  | 'motif-change'
  | 'section-turn'
  | 'drop-rupture'
  | 'release-residue'
  | 'signature-moment'
  | 'authority-shift'
  | 'quiet-state';

export type StageScreenEffectFamily =
  | 'none'
  | 'residue'
  | 'carve'
  | 'wipe'
  | 'stain'
  | 'directional-afterimage'
  | 'impact-memory';

export type StageScreenEffectIntent = {
  family: StageScreenEffectFamily;
  intensity: number;
  directionalBias: number;
  memoryBias: number;
  carveBias: number;
};

export type SignatureMomentKind =
  | 'none'
  | 'collapse-scar'
  | 'cathedral-open'
  | 'ghost-residue'
  | 'silence-constellation';

export type SignatureMomentPhase =
  | 'idle'
  | 'armed'
  | 'eligible'
  | 'precharge'
  | 'strike'
  | 'hold'
  | 'residue'
  | 'clear';

export type SignatureMomentStyle =
  | 'auto'
  | 'contrast-mythic'
  | 'maximal-neon'
  | 'ambient-premium';

export type ResolvedSignatureMomentStyle = Exclude<
  SignatureMomentStyle,
  'auto'
>;

export type SignatureMomentCandidateScores = Record<
  Exclude<SignatureMomentKind, 'none'>,
  number
>;

export type SignatureMomentDistinctnessHint =
  | 'none'
  | 'dark-cut'
  | 'architectural-open'
  | 'memory-afterimage'
  | 'quiet-spatial-field';

export type SignatureMomentPreviewProfile =
  | 'natural'
  | 'drop'
  | 'reveal'
  | 'release'
  | 'quiet';

export type SignatureMomentDevOverride = {
  kind: Exclude<SignatureMomentKind, 'none'>;
  style: SignatureMomentStyle;
  syntheticProfile: SignatureMomentPreviewProfile;
  startedAtSeconds: number;
  durationSeconds: number;
  intensity: number;
  receiptRequested?: boolean;
};

export type SignatureMomentSuppressionReason =
  | 'none'
  | 'cooldown'
  | 'low-confidence'
  | 'safety-risk'
  | 'overbright-risk'
  | 'insufficient-cue'
  | 'memory-empty';

export type SignatureMomentDecisionTrace = {
  selectedReason: string;
  styleReason: string;
  safetyAction: 'none' | 'preserve-neon' | 'convert-contrast' | 'convert-ambient';
  deferredReason: SignatureMomentSuppressionReason;
  convertedFromStyle: ResolvedSignatureMomentStyle | null;
  dominantCandidate: Exclude<SignatureMomentKind, 'none'> | null;
  dominantCandidateScore: number;
};

export type SignatureMomentSnapshot = {
  kind: SignatureMomentKind;
  phase: SignatureMomentPhase;
  style: ResolvedSignatureMomentStyle;
  intensity: number;
  ageSeconds: number;
  seed: number;
  startedAtSeconds: number | null;
  suppressionReason: SignatureMomentSuppressionReason;
  candidateScores: SignatureMomentCandidateScores;
  triggerConfidence: number;
  rarityBudget: number;
  prechargeProgress: number;
  distinctnessHint: SignatureMomentDistinctnessHint;
  decisionTrace: SignatureMomentDecisionTrace;
  forcedPreview: boolean;
  worldLead: number;
  heroSuppression: number;
  chamberArchitecture: number;
  postConsequence: number;
  memoryStrength: number;
  safetyRisk: number;
};

export type SignatureMomentSpread = Record<SignatureMomentKind, number>;
export type SignatureMomentStyleSpread = Record<ResolvedSignatureMomentStyle, number>;

export type StagePaletteTargets = Record<PaletteState, number>;

export type StageShotClass =
  | 'anchor'
  | 'pressure'
  | 'rupture'
  | 'worldTakeover'
  | 'aftermath'
  | 'isolate';

export type StageTransitionClass =
  | 'hold'
  | 'wipe'
  | 'collapse'
  | 'iris'
  | 'blackoutCut'
  | 'residueDissolve'
  | 'vectorHandoff';

export type StageEventScale = 'micro' | 'phrase' | 'stage';

export type StageTempoCadenceMode =
  | 'float'
  | 'metered'
  | 'driving'
  | 'surge'
  | 'aftermath';

export type StageHeroEnvelope = {
  coverageMin: number;
  coverageMax: number;
  offCenterMax: number;
  depthMax: number;
  scaleCeiling: number;
  driftAllowance: number;
  travelMinX: number;
  travelMinY: number;
  laneTargetX: number;
  laneTargetY: number;
};

export type StageChamberEnvelope = {
  presenceFloor: number;
  dominanceFloor: number;
  ringOpacityCap: number;
  wireDensityCap: number;
  worldTakeoverBias: number;
};

export type StageSubtractivePolicy = {
  apertureClamp: number;
  blackoutBias: number;
  wipeBias: number;
  residueBias: number;
};

export type StageCompositionPlan = {
  shotClass: StageShotClass;
  transitionClass: StageTransitionClass;
  eventScale: StageEventScale;
  tempoCadenceMode: StageTempoCadenceMode;
  heroEnvelope: StageHeroEnvelope;
  chamberEnvelope: StageChamberEnvelope;
  subtractivePolicy: StageSubtractivePolicy;
  compositionSafety: number;
  fallbackDemoteHero: boolean;
  fallbackWidenShot: boolean;
  fallbackForceWorldTakeover: boolean;
};

export type StageCuePlan = {
  family: StageCueFamily;
  dominance: StageCueDominance;
  spendProfile: StageSpendProfile;
  worldMode: StageWorldMode;
  compositorMode: StageCompositorMode;
  residueMode: StageResidueMode;
  transformIntent: StageTransformIntent;
  stageWeight: number;
  chamberWeight: number;
  heroWeight: number;
  worldWeight: number;
  screenWeight: number;
  residueWeight: number;
  eventDensity: number;
  subtractiveAmount: number;
  wipeAmount: number;
  flashAmount: number;
  heroScaleMin: number;
  heroScaleMax: number;
  heroAnchorLane: StageHeroAnchorLane;
  heroAnchorStrength: number;
  exposureCeiling: number;
  bloomCeiling: number;
  ringAuthority: StageRingAuthority;
  washoutSuppression: number;
  motionPhrase: StageMotionPhrase;
  cameraPhrase: StageMotionPhrase;
  heroForm: StageHeroForm;
  heroAccentForm: StageHeroForm;
  heroFormHoldSeconds: number;
  heroRole?: HeroSemanticRole;
  heroFormReason?: HeroFormSwitchReason;
  visualMotif?: VisualMotifKind;
  visualMotifConfidence?: number;
  visualMotifReason?: string;
  paletteBaseState?: PaletteState;
  paletteTransitionReason?: PaletteTransitionReason;
  paletteModulationAmount?: number;
  paletteTargetDominance?: number;
  paletteTargetSpread?: number;
  paletteTargets: StagePaletteTargets;
  paletteHoldSeconds: number;
  screenEffectIntent: StageScreenEffectIntent;
  heroScaleBias: number;
  heroStageX: number;
  heroStageY: number;
  heroDepthBias: number;
  heroMotionBias: number;
  heroMorphBias: number;
};

export const VISUAL_ASSET_LAYERS = [
  'worldSphere',
  'worldStain',
  'worldFlash',
  'fog',
  'heroShell',
  'heroAura',
  'heroFresnel',
  'heroEnergyShell',
  'heroSeam',
  'ghostHero',
  'heroCore',
  'heroEdges',
  'heroMembrane',
  'heroCrown',
  'heroTwins',
  'chamberRings',
  'portalRings',
  'chromaHalos',
  'ghostLattice',
  'laserBeams',
  'stageBlades',
  'stageSweeps',
  'satellites',
  'pressureWaves',
  'particles',
  'ambientLight',
  'fillLight',
  'warmLight',
  'coolLight',
  'afterImage'
] as const;

export type VisualAssetLayer = (typeof VISUAL_ASSET_LAYERS)[number];

export type VisualAssetLayerActivity = Record<VisualAssetLayer, number>;

export type VisualAssetLayerSummaryEntry = {
  mean: number;
  peak: number;
  activeFrameRate: number;
};

export type VisualAssetLayerSummary = Record<
  VisualAssetLayer,
  VisualAssetLayerSummaryEntry
>;

export type VisualTelemetryFrame = {
  qualityTier: QualityTier | 'unknown';
  exposure: number;
  bloomStrength: number;
  bloomThreshold: number;
  bloomRadius: number;
  ambientGlowBudget: number;
  eventGlowBudget: number;
  worldGlowSpend: number;
  heroGlowSpend: number;
  shellGlowSpend: number;
  activeAct: ShowAct;
  paletteState: PaletteState;
  showFamily: string;
  macroEventsActive: string[];
  heroHue: number;
  worldHue: number;
  temporalWindows: VisualTemporalWindows;
  cueClass?: VisualCueClass;
  canonicalCueClass?: CueClass;
  performanceRegime?: PerformanceRegime;
  stageIntent?: StageIntent;
  worldAuthorityState?: WorldAuthorityState;
  heroAuthorityState?: HeroAuthorityState;
  postSpendIntent?: PostSpendIntent;
  silenceState?: SilenceState;
  phraseConfidence?: PhraseConfidence;
  sectionIntent?: SectionIntent;
  visualMotif?: VisualMotifKind;
  visualMotifConfidence?: number;
  visualMotifReason?: string;
  paletteBaseState?: PaletteState;
  paletteBaseAgeSeconds?: number;
  paletteTransitionReason?: PaletteTransitionReason;
  paletteModulationAmount?: number;
  paletteTargetDominance?: number;
  paletteTargetSpread?: number;
  heroRole?: HeroSemanticRole;
  heroFormReason?: HeroFormSwitchReason;
  plannedHeroForm?: StageHeroForm;
  activeHeroForm?: StageHeroForm;
  plannedActiveHeroFormMatch?: boolean;
  heroFormHoldElapsedSeconds?: number;
  heroFormSwitchCount?: number;
  semanticConfidence?: number;
  heroWorldHueDivergence?: number;
  unearnedChangeRisk?: number;
  cueIntensity?: number;
  cueAttack?: number;
  cueSustain?: number;
  cueDecay?: number;
  cueScreenWeight?: number;
  cueResidueWeight?: number;
  cueWorldWeight?: number;
  cueHeroWeight?: number;
  cueEventDensity?: number;
  stageCueFamily?: StageCueFamily;
  stageCueDominance?: StageCueDominance;
  stageSpendProfile?: StageSpendProfile;
  stageWorldMode?: StageWorldMode;
  stageCompositorMode?: StageCompositorMode;
  stageResidueMode?: StageResidueMode;
  stageTransformIntent?: StageTransformIntent;
  stageHeroScaleMin?: number;
  stageHeroScaleMax?: number;
  stageHeroAnchorLane?: StageHeroAnchorLane;
  stageHeroAnchorStrength?: number;
  stageExposureCeiling?: number;
  stageBloomCeiling?: number;
  stageRingAuthority?: StageRingAuthority;
  stageWashoutSuppression?: number;
  stageMotionPhrase?: StageMotionPhrase;
  stageCameraPhrase?: StageMotionPhrase;
  stageHeroForm?: StageHeroForm;
  stageHeroAccentForm?: StageHeroForm;
  stageHeroFormHoldSeconds?: number;
  stagePaletteHoldSeconds?: number;
  stageScreenEffectFamily?: StageScreenEffectFamily;
  stageScreenEffectIntensity?: number;
  stageScreenEffectDirectionalBias?: number;
  stageScreenEffectMemoryBias?: number;
  stageScreenEffectCarveBias?: number;
  stageHeroScaleBias?: number;
  stageHeroStageX?: number;
  stageHeroStageY?: number;
  stageHeroDepthBias?: number;
  stageHeroMotionBias?: number;
  stageHeroMorphBias?: number;
  stageShotClass?: StageShotClass;
  stageTransitionClass?: StageTransitionClass;
  stageEventScale?: StageEventScale;
  stageTempoCadenceMode?: StageTempoCadenceMode;
  stageCompositionSafety?: number;
  stageFallbackDemoteHero?: boolean;
  stageFallbackWidenShot?: boolean;
  stageFallbackForceWorldTakeover?: boolean;
  heroScale?: number;
  heroScreenX?: number;
  heroScreenY?: number;
  heroCoverageEstimate?: number;
  heroOffCenterPenalty?: number;
  heroDepthPenalty?: number;
  heroTranslateX?: number;
  heroTranslateY?: number;
  heroTranslateZ?: number;
  heroRotationPitch?: number;
  heroRotationYaw?: number;
  heroRotationRoll?: number;
  chamberTranslateX?: number;
  chamberTranslateY?: number;
  chamberTranslateZ?: number;
  chamberRotationPitch?: number;
  chamberRotationYaw?: number;
  chamberRotationRoll?: number;
  cameraTranslateX?: number;
  cameraTranslateY?: number;
  cameraTranslateZ?: number;
  cameraRotationPitch?: number;
  cameraRotationYaw?: number;
  cameraRotationRoll?: number;
  ringAuthority?: number;
  chamberPresenceScore?: number;
  frameHierarchyScore?: number;
  compositionSafetyFlag?: boolean;
  compositionSafetyScore?: number;
  overbright?: number;
  ringBeltPersistence?: number;
  wirefieldDensityScore?: number;
  worldDominanceDelivered?: number;
  stageFallbackHeroOverreach?: boolean;
  stageFallbackRingOverdraw?: boolean;
  stageFallbackOverbrightRisk?: boolean;
  stageFallbackWashoutRisk?: boolean;
  afterImageDamp?: number;
  activeSignatureMoment?: SignatureMomentKind;
  signatureMomentPhase?: SignatureMomentPhase;
  signatureMomentStyle?: ResolvedSignatureMomentStyle;
  signatureMomentIntensity?: number;
  signatureMomentAgeSeconds?: number;
  signatureMomentSuppressionReason?: SignatureMomentSuppressionReason;
  signatureMomentTriggerConfidence?: number;
  signatureMomentPrechargeProgress?: number;
  signatureMomentRarityBudget?: number;
  signatureMomentForcedPreview?: boolean;
  signatureMomentDistinctnessHint?: SignatureMomentDistinctnessHint;
  collapseScarAmount?: number;
  cathedralOpenAmount?: number;
  ghostResidueAmount?: number;
  silenceConstellationAmount?: number;
  memoryTraceCount?: number;
  aftermathClearance?: number;
  postConsequenceIntensity?: number;
  postOverprocessRisk?: number;
  compositorSignatureMask?: number;
  compositorCutAmount?: number;
  compositorVignetteAmount?: number;
  compositorChromaticAmount?: number;
  compositorEdgeWindowAmount?: number;
  compositorContrastLift?: number;
  compositorSaturationLift?: number;
  compositorExposureBias?: number;
  compositorBloomBias?: number;
  compositorAfterImageBias?: number;
  compositorOverprocessRisk?: number;
  perceptualContrastScore?: number;
  perceptualColorfulnessScore?: number;
  perceptualWashoutRisk?: number;
  activePlayableMotifScene?: PlayableMotifSceneKind;
  playableMotifSceneAgeSeconds?: number;
  playableMotifSceneTransitionReason?: PlayableMotifSceneTransitionReason;
  playableMotifSceneIntensity?: number;
  playableMotifSceneMotifMatch?: boolean;
  playableMotifScenePaletteMatch?: boolean;
  playableMotifSceneDistinctness?: number;
  playableMotifSceneSilhouetteConfidence?: number;
  atmosphereMatterState: AtmosphereMatterState;
  atmosphereGas: number;
  atmosphereLiquid: number;
  atmospherePlasma: number;
  atmosphereCrystal: number;
  atmospherePressure: number;
  atmosphereIonization: number;
  atmosphereResidue: number;
  atmosphereStructureReveal: number;
  assetLayerActivity: VisualAssetLayerActivity;
};

export type AuthorityFrameSnapshot = {
  worldGlowSpend: number;
  heroGlowSpend: number;
  shellGlowSpend: number;
  ringAuthority: number;
  ringBeltPersistence: number;
  wirefieldDensityScore: number;
  chamberPresenceScore: number;
  worldDominanceDelivered: number;
  frameHierarchyScore: number;
  compositionSafetyScore: number;
  compositionSafetyFlag: boolean;
  overbright: number;
};

export type VisualTelemetrySummary = {
  dominantQualityTier: QualityTier | 'unknown';
  exposureMean: number;
  exposurePeak: number;
  bloomStrengthMean: number;
  bloomStrengthPeak: number;
  bloomThresholdMean: number;
  bloomRadiusMean?: number;
  bloomRadiusPeak?: number;
  afterImageDampMean?: number;
  afterImageDampPeak?: number;
  ambientGlowMean: number;
  ambientGlowPeak: number;
  eventGlowMean: number;
  eventGlowPeak: number;
  worldGlowMean: number;
  heroGlowMean: number;
  shellGlowMean: number;
  atmosphereMatterStateSpread?: Record<AtmosphereMatterState, number>;
  dominantAtmosphereMatterState?: AtmosphereMatterState;
  atmosphereGasMean?: number;
  atmosphereLiquidMean?: number;
  atmospherePlasmaMean?: number;
  atmosphereCrystalMean?: number;
  atmospherePressureMean?: number;
  atmospherePressurePeak?: number;
  atmosphereIonizationMean?: number;
  atmosphereIonizationPeak?: number;
  atmosphereResidueMean?: number;
  atmosphereResiduePeak?: number;
  atmosphereStructureRevealMean?: number;
  atmosphereStructureRevealPeak?: number;
  dominantShowFamily: string;
  showFamilySpread: Record<string, number>;
  actSpread: Record<ShowAct, number>;
  dominantAct: ShowAct;
  paletteStateSpread: Record<PaletteState, number>;
  paletteStateSpreadByAct?: Record<ShowAct, Record<PaletteState, number>>;
  paletteStateSpreadByFamily?: Record<StageCueFamily, Record<PaletteState, number>>;
  dominantPaletteState: PaletteState;
  stageCueFamilySpread: Record<StageCueFamily, number>;
  dominantStageCueFamily: StageCueFamily;
  canonicalCueClassSpread?: Record<CueClass, number>;
  dominantCanonicalCueClass?: CueClass;
  performanceRegimeSpread?: Record<PerformanceRegime, number>;
  dominantPerformanceRegime?: PerformanceRegime;
  stageIntentSpread?: Record<StageIntent, number>;
  dominantStageIntent?: StageIntent;
  worldAuthorityStateSpread?: Record<WorldAuthorityState, number>;
  dominantWorldAuthorityState?: WorldAuthorityState;
  heroAuthorityStateSpread?: Record<HeroAuthorityState, number>;
  dominantHeroAuthorityState?: HeroAuthorityState;
  postSpendIntentSpread?: Record<PostSpendIntent, number>;
  dominantPostSpendIntent?: PostSpendIntent;
  silenceStateSpread?: Record<SilenceState, number>;
  dominantSilenceState?: SilenceState;
  phraseConfidenceSpread?: Record<PhraseConfidence, number>;
  dominantPhraseConfidence?: PhraseConfidence;
  sectionIntentSpread?: Record<SectionIntent, number>;
  dominantSectionIntent?: SectionIntent;
  visualMotifSpread?: Record<VisualMotifKind, number>;
  dominantVisualMotif?: VisualMotifKind;
  playableMotifSceneSpread?: Record<PlayableMotifSceneKind, number>;
  dominantPlayableMotifScene?: PlayableMotifSceneKind;
  playableMotifSceneTransitionReasonSpread?: Record<
    PlayableMotifSceneTransitionReason,
    number
  >;
  dominantPlayableMotifSceneTransitionReason?: PlayableMotifSceneTransitionReason;
  playableMotifSceneLongestRunMs?: number;
  playableMotifSceneMotifMatchRate?: number;
  playableMotifScenePaletteMatchRate?: number;
  playableMotifSceneDistinctnessMean?: number;
  playableMotifSceneSilhouetteConfidenceMean?: number;
  heroRoleSpread?: Record<HeroSemanticRole, number>;
  dominantHeroRole?: HeroSemanticRole;
  heroFormSpread?: Record<StageHeroForm, number>;
  dominantHeroForm?: StageHeroForm;
  heroFormReasonSpread?: Record<HeroFormSwitchReason, number>;
  dominantHeroFormReason?: HeroFormSwitchReason;
  paletteTransitionReasonSpread?: Record<PaletteTransitionReason, number>;
  dominantPaletteTransitionReason?: PaletteTransitionReason;
  paletteBaseStateSpread?: Record<PaletteState, number>;
  dominantPaletteBaseState?: PaletteState;
  paletteBaseLongestRunMs?: number;
  heroFormLongestRunMs?: number;
  heroFormSwitchesPerMinute?: number;
  plannedActiveHeroFormMatchRate?: number;
  heroWorldHueDivergenceMean?: number;
  semanticConfidenceMean?: number;
  unearnedChangeRiskMean?: number;
  stageWorldModeSpread?: Record<StageWorldMode, number>;
  stageWorldModeSpreadByFamily?: Record<StageCueFamily, Record<StageWorldMode, number>>;
  dominantStageWorldMode?: StageWorldMode;
  macroEventSpread: Record<string, number>;
  dominantMacroEvent: string;
  heroHueRange: number;
  worldHueRange: number;
  temporalWindowMeans: VisualTemporalWindows;
  spendProfileSpread?: Record<StageSpendProfile, number>;
  dominantSpendProfile?: StageSpendProfile;
  overbrightRate?: number;
  overbrightPeak?: number;
  heroScaleMean?: number;
  heroScalePeak?: number;
  heroScreenXMean?: number;
  heroScreenYMean?: number;
  ringAuthorityMean?: number;
  stageExposureCeilingMean?: number;
  stageBloomCeilingMean?: number;
  stageWashoutSuppressionMean?: number;
  stageHeroScaleMinMean?: number;
  stageHeroScaleMaxMean?: number;
  stageRingAuthoritySpread?: Record<StageRingAuthority, number>;
  dominantStageRingAuthority?: StageRingAuthority;
  stageShotClassSpread?: Record<StageShotClass, number>;
  stageShotClassSpreadByFamily?: Record<StageCueFamily, Record<StageShotClass, number>>;
  dominantStageShotClass?: StageShotClass;
  stageTransitionClassSpread?: Record<StageTransitionClass, number>;
  dominantStageTransitionClass?: StageTransitionClass;
  stageTempoCadenceModeSpread?: Record<StageTempoCadenceMode, number>;
  dominantStageTempoCadenceMode?: StageTempoCadenceMode;
  actEntropy?: number;
  paletteEntropy?: number;
  stageShotClassEntropy?: number;
  stageWorldModeEntropy?: number;
  actLongestRunMs?: number;
  paletteStateLongestRunMs?: number;
  stageShotClassLongestRunMs?: number;
  stageWorldModeLongestRunMs?: number;
  stageCompositionSafetyMean?: number;
  compositionSafetyRate?: number;
  heroCoverageMean?: number;
  heroCoveragePeak?: number;
  heroOffCenterPenaltyMean?: number;
  heroOffCenterPenaltyPeak?: number;
  heroDepthPenaltyMean?: number;
  heroDepthPenaltyPeak?: number;
  chamberPresenceMean?: number;
  frameHierarchyMean?: number;
  ringBeltPersistenceMean?: number;
  ringBeltPersistencePeak?: number;
  wirefieldDensityMean?: number;
  wirefieldDensityPeak?: number;
  worldDominanceDeliveredMean?: number;
  heroTravelRangeX?: number;
  heroTravelRangeY?: number;
  heroTravelRangeZ?: number;
  heroRotationVariancePitch?: number;
  heroRotationVarianceYaw?: number;
  heroRotationVarianceRoll?: number;
  chamberTravelRangeX?: number;
  chamberTravelRangeY?: number;
  chamberTravelRangeZ?: number;
  chamberRotationVariancePitch?: number;
  chamberRotationVarianceYaw?: number;
  chamberRotationVarianceRoll?: number;
  cameraTravelRangeX?: number;
  cameraTravelRangeY?: number;
  cameraTravelRangeZ?: number;
  cameraRotationVariancePitch?: number;
  cameraRotationVarianceYaw?: number;
  cameraRotationVarianceRoll?: number;
  heroOverreachFallbackRate?: number;
  ringOverdrawFallbackRate?: number;
  overbrightFallbackRate?: number;
  washoutFallbackRate?: number;
  qualityTransitionCount?: number;
  firstQualityDowngradeMs?: number;
  signatureMomentSpread?: SignatureMomentSpread;
  dominantSignatureMoment?: SignatureMomentKind;
  signatureMomentStyleSpread?: SignatureMomentStyleSpread;
  dominantSignatureMomentStyle?: ResolvedSignatureMomentStyle;
  signatureMomentActiveRate?: number;
  signatureMomentIntensityMean?: number;
  signatureMomentIntensityPeak?: number;
  signatureMomentTriggerConfidenceMean?: number;
  signatureMomentForcedPreviewRate?: number;
  collapseScarMean?: number;
  collapseScarPeak?: number;
  cathedralOpenMean?: number;
  cathedralOpenPeak?: number;
  ghostResidueMean?: number;
  ghostResiduePeak?: number;
  silenceConstellationMean?: number;
  silenceConstellationPeak?: number;
  aftermathClearanceMean?: number;
  postConsequenceMean?: number;
  postOverprocessRiskMean?: number;
  postOverprocessRiskPeak?: number;
  compositorContrastLiftMean?: number;
  compositorSaturationLiftMean?: number;
  compositorOverprocessRiskMean?: number;
  compositorOverprocessRiskPeak?: number;
  perceptualContrastMean?: number;
  perceptualColorfulnessMean?: number;
  perceptualWashoutRiskMean?: number;
  perceptualWashoutRiskPeak?: number;
  assetLayerSummary: VisualAssetLayerSummary;
};

export type CaptureQualityFlag =
  | 'manualCustom'
  | 'oversizedWindow'
  | 'multiEventWindow'
  | 'safeTierActive'
  | 'highAmbientGlow'
  | 'lowPaletteVariation'
  | 'undercommittedDrop'
  | 'weakPhraseRelease'
  | 'staleBuildIdentity'
  | 'scenarioMismatch'
  | 'weakWorldAuthorityDelivery'
  | 'heroMonopolyRisk'
  | 'ringOverdrawRisk'
  | 'lowChamberPresence'
  | 'randomFeelingPaletteChurn'
  | 'unearnedHeroFormSwitch'
  | 'heroWorldHueDivergence'
  | 'ambiguousHeroSilhouette'
  | 'sceneChurn'
  | 'sceneMotifMismatch'
  | 'sameySceneSilhouette'
  | 'missedOpportunity';

export const DEFAULT_VISUAL_TEMPORAL_WINDOWS: VisualTemporalWindows = {
  preBeatLift: 0,
  beatStrike: 0,
  postBeatRelease: 0,
  interBeatFloat: 0,
  barTurn: 0,
  phraseResolve: 0
};

export const DEFAULT_VISUAL_CUE_STATE: VisualCueState = {
  cueClass: 'brood',
  intensity: 0,
  attack: 0,
  sustain: 0,
  decay: 0,
  screenWeight: 0,
  residueWeight: 0,
  worldWeight: 0.58,
  heroWeight: 0.48,
  eventDensity: 0.16
};

export const DEFAULT_STAGE_CUE_PLAN: StageCuePlan = {
  family: 'brood',
  dominance: 'hybrid',
  spendProfile: 'withheld',
  worldMode: 'field-bloom',
  compositorMode: 'none',
  residueMode: 'none',
  transformIntent: 'hold',
  stageWeight: 0.24,
  chamberWeight: 0.42,
  heroWeight: 0.52,
  worldWeight: 0.58,
  screenWeight: 0.1,
  residueWeight: 0.02,
  eventDensity: 0.16,
  subtractiveAmount: 0.08,
  wipeAmount: 0,
  flashAmount: 0,
  heroScaleMin: 0.26,
  heroScaleMax: 0.68,
  heroAnchorLane: 'left',
  heroAnchorStrength: 0.08,
  exposureCeiling: 0.78,
  bloomCeiling: 0.42,
  ringAuthority: 'framing-architecture',
  washoutSuppression: 0.24,
  motionPhrase: 'bank-rise',
  cameraPhrase: 'bank-rise',
  heroForm: 'prism',
  heroAccentForm: 'shard',
  heroFormHoldSeconds: 3.2,
  heroRole: 'supporting',
  heroFormReason: 'motif-change',
  visualMotif: 'neon-portal',
  visualMotifConfidence: 0.62,
  visualMotifReason: 'default portal stage cue',
  paletteBaseState: 'void-cyan',
  paletteTransitionReason: 'hold',
  paletteModulationAmount: 0.22,
  paletteTargetDominance: 0.32,
  paletteTargetSpread: 0.68,
  paletteTargets: {
    'void-cyan': 0.32,
    'tron-blue': 0.22,
    'acid-lime': 0.18,
    'solar-magenta': 0.16,
    'ghost-white': 0.12
  },
  paletteHoldSeconds: 3.2,
  screenEffectIntent: {
    family: 'stain',
    intensity: 0.06,
    directionalBias: 0.08,
    memoryBias: 0.04,
    carveBias: 0.12
  },
  heroScaleBias: -0.24,
  heroStageX: -0.18,
  heroStageY: -0.02,
  heroDepthBias: 0,
  heroMotionBias: 0.22,
  heroMorphBias: 0.18
};

export const DEFAULT_STAGE_COMPOSITION_PLAN: StageCompositionPlan = {
  shotClass: 'pressure',
  transitionClass: 'hold',
  eventScale: 'phrase',
  tempoCadenceMode: 'metered',
  heroEnvelope: {
    coverageMin: 0,
    coverageMax: 0.14,
    offCenterMax: 0.36,
    depthMax: 0.28,
    scaleCeiling: 0.72,
    driftAllowance: 0.34,
    travelMinX: 0.14,
    travelMinY: 0.08,
    laneTargetX: 0.42,
    laneTargetY: 0.48
  },
  chamberEnvelope: {
    presenceFloor: 0.3,
    dominanceFloor: 0.24,
    ringOpacityCap: 0.12,
    wireDensityCap: 0.18,
    worldTakeoverBias: 0.22
  },
  subtractivePolicy: {
    apertureClamp: 0.1,
    blackoutBias: 0.06,
    wipeBias: 0.02,
    residueBias: 0.02
  },
  compositionSafety: 0.78,
  fallbackDemoteHero: true,
  fallbackWidenShot: true,
  fallbackForceWorldTakeover: false
};

export const DEFAULT_AUTHORITY_FRAME_SNAPSHOT: AuthorityFrameSnapshot = {
  worldGlowSpend: 0,
  heroGlowSpend: 0,
  shellGlowSpend: 0,
  ringAuthority: 0,
  ringBeltPersistence: 0.08,
  wirefieldDensityScore: 0.16,
  chamberPresenceScore: 0.18,
  worldDominanceDelivered: 0.18,
  frameHierarchyScore: 0.72,
  compositionSafetyScore: 0.82,
  compositionSafetyFlag: false,
  overbright: 0
};

export const DEFAULT_SIGNATURE_MOMENT_SNAPSHOT: SignatureMomentSnapshot = {
  kind: 'none',
  phase: 'idle',
  style: 'contrast-mythic',
  intensity: 0,
  ageSeconds: 0,
  seed: 0,
  startedAtSeconds: null,
  suppressionReason: 'none',
  candidateScores: {
    'collapse-scar': 0,
    'cathedral-open': 0,
    'ghost-residue': 0,
    'silence-constellation': 0
  },
  triggerConfidence: 0,
  rarityBudget: 1,
  prechargeProgress: 0,
  distinctnessHint: 'none',
  decisionTrace: {
    selectedReason: 'idle',
    styleReason: 'default',
    safetyAction: 'none',
    deferredReason: 'none',
    convertedFromStyle: null,
    dominantCandidate: null,
    dominantCandidateScore: 0
  },
  forcedPreview: false,
  worldLead: 0,
  heroSuppression: 0,
  chamberArchitecture: 0,
  postConsequence: 0,
  memoryStrength: 0,
  safetyRisk: 0
};

export const DEFAULT_PALETTE_FRAME: PaletteFrame = {
  baseState: 'void-cyan',
  modulationTargets: {
    'void-cyan': 0.48,
    'tron-blue': 0.22,
    'acid-lime': 0.08,
    'solar-magenta': 0.06,
    'ghost-white': 0.16
  },
  modulationAmount: 0.22,
  targetDominance: 0.48,
  targetSpread: 0.72,
  transitionReason: 'hold',
  semanticConfidence: 0.62,
  roles: {
    anchorDark: 'void-cyan',
    primaryEmission: 'void-cyan',
    rimSeam: 'tron-blue',
    accentTransient: 'acid-lime',
    residueMemory: 'ghost-white',
    flashWhite: 'ghost-white'
  }
};

export const DEFAULT_VISUAL_MOTIF_SNAPSHOT: VisualMotifSnapshot = {
  kind: 'void-anchor',
  confidence: 0.62,
  reason: 'default void anchor',
  paletteFrame: DEFAULT_PALETTE_FRAME,
  heroRole: 'supporting',
  heroForm: DEFAULT_STAGE_CUE_PLAN.heroForm,
  heroAccentForm: DEFAULT_STAGE_CUE_PLAN.heroAccentForm,
  heroFormReason: 'hold'
};

export const DEFAULT_VISUAL_TELEMETRY: VisualTelemetryFrame = {
  qualityTier: 'unknown',
  exposure: 1,
  bloomStrength: 0,
  bloomThreshold: 0.2,
  bloomRadius: 0.1,
  ambientGlowBudget: 0,
  eventGlowBudget: 0,
  worldGlowSpend: 0,
  heroGlowSpend: 0,
  shellGlowSpend: 0,
  activeAct: 'void-chamber',
  paletteState: 'void-cyan',
  showFamily: 'eclipse-chamber',
  macroEventsActive: [],
  heroHue: 0,
  worldHue: 0,
  temporalWindows: { ...DEFAULT_VISUAL_TEMPORAL_WINDOWS },
  cueClass: DEFAULT_VISUAL_CUE_STATE.cueClass,
  canonicalCueClass: 'hold',
  performanceRegime: 'silence-beauty',
  stageIntent: 'hybrid',
  worldAuthorityState: 'background',
  heroAuthorityState: 'shared',
  postSpendIntent: 'withhold',
  silenceState: 'beauty',
  phraseConfidence: 'uncertain',
  sectionIntent: 'hold',
  visualMotif: DEFAULT_VISUAL_MOTIF_SNAPSHOT.kind,
  visualMotifConfidence: DEFAULT_VISUAL_MOTIF_SNAPSHOT.confidence,
  visualMotifReason: DEFAULT_VISUAL_MOTIF_SNAPSHOT.reason,
  paletteBaseState: DEFAULT_PALETTE_FRAME.baseState,
  paletteBaseAgeSeconds: 0,
  paletteTransitionReason: DEFAULT_PALETTE_FRAME.transitionReason,
  paletteModulationAmount: DEFAULT_PALETTE_FRAME.modulationAmount,
  paletteTargetDominance: DEFAULT_PALETTE_FRAME.targetDominance,
  paletteTargetSpread: DEFAULT_PALETTE_FRAME.targetSpread,
  heroRole: DEFAULT_VISUAL_MOTIF_SNAPSHOT.heroRole,
  heroFormReason: DEFAULT_VISUAL_MOTIF_SNAPSHOT.heroFormReason,
  plannedHeroForm: DEFAULT_STAGE_CUE_PLAN.heroForm,
  activeHeroForm: DEFAULT_STAGE_CUE_PLAN.heroForm,
  plannedActiveHeroFormMatch: true,
  heroFormHoldElapsedSeconds: 0,
  heroFormSwitchCount: 0,
  semanticConfidence: DEFAULT_VISUAL_MOTIF_SNAPSHOT.confidence,
  heroWorldHueDivergence: 0,
  unearnedChangeRisk: 0,
  cueIntensity: DEFAULT_VISUAL_CUE_STATE.intensity,
  cueAttack: DEFAULT_VISUAL_CUE_STATE.attack,
  cueSustain: DEFAULT_VISUAL_CUE_STATE.sustain,
  cueDecay: DEFAULT_VISUAL_CUE_STATE.decay,
  cueScreenWeight: DEFAULT_VISUAL_CUE_STATE.screenWeight,
  cueResidueWeight: DEFAULT_VISUAL_CUE_STATE.residueWeight,
  cueWorldWeight: DEFAULT_VISUAL_CUE_STATE.worldWeight,
  cueHeroWeight: DEFAULT_VISUAL_CUE_STATE.heroWeight,
  cueEventDensity: DEFAULT_VISUAL_CUE_STATE.eventDensity,
  stageCueFamily: DEFAULT_STAGE_CUE_PLAN.family,
  stageCueDominance: DEFAULT_STAGE_CUE_PLAN.dominance,
  stageSpendProfile: DEFAULT_STAGE_CUE_PLAN.spendProfile,
  stageWorldMode: DEFAULT_STAGE_CUE_PLAN.worldMode,
  stageCompositorMode: DEFAULT_STAGE_CUE_PLAN.compositorMode,
  stageResidueMode: DEFAULT_STAGE_CUE_PLAN.residueMode,
  stageTransformIntent: DEFAULT_STAGE_CUE_PLAN.transformIntent,
  stageHeroScaleMin: DEFAULT_STAGE_CUE_PLAN.heroScaleMin,
  stageHeroScaleMax: DEFAULT_STAGE_CUE_PLAN.heroScaleMax,
  stageHeroAnchorLane: DEFAULT_STAGE_CUE_PLAN.heroAnchorLane,
  stageHeroAnchorStrength: DEFAULT_STAGE_CUE_PLAN.heroAnchorStrength,
  stageExposureCeiling: DEFAULT_STAGE_CUE_PLAN.exposureCeiling,
  stageBloomCeiling: DEFAULT_STAGE_CUE_PLAN.bloomCeiling,
  stageRingAuthority: DEFAULT_STAGE_CUE_PLAN.ringAuthority,
  stageWashoutSuppression: DEFAULT_STAGE_CUE_PLAN.washoutSuppression,
  stageMotionPhrase: DEFAULT_STAGE_CUE_PLAN.motionPhrase,
  stageCameraPhrase: DEFAULT_STAGE_CUE_PLAN.cameraPhrase,
  stageHeroForm: DEFAULT_STAGE_CUE_PLAN.heroForm,
  stageHeroAccentForm: DEFAULT_STAGE_CUE_PLAN.heroAccentForm,
  stageHeroFormHoldSeconds: DEFAULT_STAGE_CUE_PLAN.heroFormHoldSeconds,
  stagePaletteHoldSeconds: DEFAULT_STAGE_CUE_PLAN.paletteHoldSeconds,
  stageScreenEffectFamily: DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.family,
  stageScreenEffectIntensity: DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.intensity,
  stageScreenEffectDirectionalBias:
    DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.directionalBias,
  stageScreenEffectMemoryBias: DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.memoryBias,
  stageScreenEffectCarveBias: DEFAULT_STAGE_CUE_PLAN.screenEffectIntent.carveBias,
  stageHeroScaleBias: DEFAULT_STAGE_CUE_PLAN.heroScaleBias,
  stageHeroStageX: DEFAULT_STAGE_CUE_PLAN.heroStageX,
  stageHeroStageY: DEFAULT_STAGE_CUE_PLAN.heroStageY,
  stageHeroDepthBias: DEFAULT_STAGE_CUE_PLAN.heroDepthBias,
  stageHeroMotionBias: DEFAULT_STAGE_CUE_PLAN.heroMotionBias,
  stageHeroMorphBias: DEFAULT_STAGE_CUE_PLAN.heroMorphBias,
  stageShotClass: DEFAULT_STAGE_COMPOSITION_PLAN.shotClass,
  stageTransitionClass: DEFAULT_STAGE_COMPOSITION_PLAN.transitionClass,
  stageEventScale: DEFAULT_STAGE_COMPOSITION_PLAN.eventScale,
  stageTempoCadenceMode: DEFAULT_STAGE_COMPOSITION_PLAN.tempoCadenceMode,
  stageCompositionSafety: DEFAULT_STAGE_COMPOSITION_PLAN.compositionSafety,
  stageFallbackDemoteHero: DEFAULT_STAGE_COMPOSITION_PLAN.fallbackDemoteHero,
  stageFallbackWidenShot: DEFAULT_STAGE_COMPOSITION_PLAN.fallbackWidenShot,
  stageFallbackForceWorldTakeover:
    DEFAULT_STAGE_COMPOSITION_PLAN.fallbackForceWorldTakeover,
  heroScale: 0.56,
  heroScreenX: 0.5,
  heroScreenY: 0.5,
  heroCoverageEstimate: 0.12,
  heroOffCenterPenalty: 0,
  heroDepthPenalty: 0,
  heroTranslateX: 0,
  heroTranslateY: 0,
  heroTranslateZ: 0,
  heroRotationPitch: 0,
  heroRotationYaw: 0,
  heroRotationRoll: 0,
  chamberTranslateX: 0,
  chamberTranslateY: 0,
  chamberTranslateZ: 0,
  chamberRotationPitch: 0,
  chamberRotationYaw: 0,
  chamberRotationRoll: 0,
  cameraTranslateX: 0,
  cameraTranslateY: 0,
  cameraTranslateZ: 10.4,
  cameraRotationPitch: 0,
  cameraRotationYaw: 0,
  cameraRotationRoll: 0,
  ringAuthority: 0,
  chamberPresenceScore: 0.18,
  frameHierarchyScore: 0.72,
  compositionSafetyFlag: false,
  compositionSafetyScore: 0.82,
  overbright: 0,
  ringBeltPersistence: 0.08,
  wirefieldDensityScore: 0.16,
  worldDominanceDelivered: 0.18,
  stageFallbackHeroOverreach: false,
  stageFallbackRingOverdraw: false,
  stageFallbackOverbrightRisk: false,
  stageFallbackWashoutRisk: false,
  afterImageDamp: 0.78,
  activeSignatureMoment: DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.kind,
  signatureMomentPhase: DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.phase,
  signatureMomentStyle: DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.style,
  signatureMomentIntensity: DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.intensity,
  signatureMomentAgeSeconds: DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.ageSeconds,
  signatureMomentSuppressionReason:
    DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.suppressionReason,
  signatureMomentTriggerConfidence:
    DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.triggerConfidence,
  signatureMomentPrechargeProgress:
    DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.prechargeProgress,
  signatureMomentRarityBudget: DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.rarityBudget,
  signatureMomentForcedPreview: DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.forcedPreview,
  signatureMomentDistinctnessHint:
    DEFAULT_SIGNATURE_MOMENT_SNAPSHOT.distinctnessHint,
  collapseScarAmount: 0,
  cathedralOpenAmount: 0,
  ghostResidueAmount: 0,
  silenceConstellationAmount: 0,
  memoryTraceCount: 0,
  aftermathClearance: 1,
  postConsequenceIntensity: 0,
  postOverprocessRisk: 0,
  compositorSignatureMask: 0,
  compositorCutAmount: 0,
  compositorVignetteAmount: 0,
  compositorChromaticAmount: 0,
  compositorEdgeWindowAmount: 0,
  compositorContrastLift: 0,
  compositorSaturationLift: 0,
  compositorExposureBias: 0,
  compositorBloomBias: 0,
  compositorAfterImageBias: 0,
  compositorOverprocessRisk: 0,
  perceptualContrastScore: 0.62,
  perceptualColorfulnessScore: 0.52,
  perceptualWashoutRisk: 0,
  activePlayableMotifScene: 'none',
  playableMotifSceneAgeSeconds: 0,
  playableMotifSceneTransitionReason: 'hold',
  playableMotifSceneIntensity: 0,
  playableMotifSceneMotifMatch: true,
  playableMotifScenePaletteMatch: true,
  playableMotifSceneDistinctness: 0,
  playableMotifSceneSilhouetteConfidence: 0,
  atmosphereMatterState: 'gas',
  atmosphereGas: 1,
  atmosphereLiquid: 0,
  atmospherePlasma: 0,
  atmosphereCrystal: 0,
  atmospherePressure: 0,
  atmosphereIonization: 0,
  atmosphereResidue: 0,
  atmosphereStructureReveal: 0,
  assetLayerActivity: Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [layer, 0])
  ) as VisualAssetLayerActivity
};

export const DEFAULT_VISUAL_TELEMETRY_SUMMARY: VisualTelemetrySummary = {
  dominantQualityTier: 'unknown',
  exposureMean: 0,
  exposurePeak: 0,
  bloomStrengthMean: 0,
  bloomStrengthPeak: 0,
  bloomThresholdMean: 0,
  bloomRadiusMean: 0,
  bloomRadiusPeak: 0,
  afterImageDampMean: 0,
  afterImageDampPeak: 0,
  ambientGlowMean: 0,
  ambientGlowPeak: 0,
  eventGlowMean: 0,
  eventGlowPeak: 0,
  worldGlowMean: 0,
  heroGlowMean: 0,
  shellGlowMean: 0,
  atmosphereMatterStateSpread: {
    gas: 0,
    liquid: 0,
    plasma: 0,
    crystal: 0
  },
  dominantAtmosphereMatterState: 'gas',
  atmosphereGasMean: 0,
  atmosphereLiquidMean: 0,
  atmospherePlasmaMean: 0,
  atmosphereCrystalMean: 0,
  atmospherePressureMean: 0,
  atmospherePressurePeak: 0,
  atmosphereIonizationMean: 0,
  atmosphereIonizationPeak: 0,
  atmosphereResidueMean: 0,
  atmosphereResiduePeak: 0,
  atmosphereStructureRevealMean: 0,
  atmosphereStructureRevealPeak: 0,
  dominantShowFamily: 'unknown',
  showFamilySpread: {},
  actSpread: {
    'void-chamber': 0,
    'laser-bloom': 0,
    'matrix-storm': 0,
    'eclipse-rupture': 0,
    'ghost-afterimage': 0
  },
  dominantAct: 'void-chamber',
  paletteStateSpread: {
    'void-cyan': 0,
    'tron-blue': 0,
    'acid-lime': 0,
    'solar-magenta': 0,
    'ghost-white': 0
  },
  paletteStateSpreadByAct: {
    'void-chamber': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    'laser-bloom': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    'matrix-storm': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    'eclipse-rupture': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    'ghost-afterimage': {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    }
  },
  paletteStateSpreadByFamily: {
    brood: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    gather: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    reveal: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    rupture: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    release: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    haunt: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    },
    reset: {
      'void-cyan': 0,
      'tron-blue': 0,
      'acid-lime': 0,
      'solar-magenta': 0,
      'ghost-white': 0
    }
  },
  dominantPaletteState: 'void-cyan',
  stageCueFamilySpread: {
    brood: 0,
    gather: 0,
    reveal: 0,
    rupture: 0,
    release: 0,
    haunt: 0,
    reset: 0
  },
  dominantStageCueFamily: 'brood',
  canonicalCueClassSpread: {
    hold: 0,
    gather: 0,
    tighten: 0,
    reveal: 0,
    'orbit-widen': 0,
    'fan-sweep': 0,
    'laser-burst': 0,
    rupture: 0,
    collapse: 0,
    haunt: 0,
    residue: 0,
    recovery: 0
  },
  dominantCanonicalCueClass: 'hold',
  performanceRegimeSpread: {
    'silence-beauty': 0,
    'room-floor': 0,
    suspense: 0,
    gathering: 0,
    driving: 0,
    surge: 0,
    aftermath: 0
  },
  dominantPerformanceRegime: 'silence-beauty',
  stageIntentSpread: {
    'hero-pressure': 0,
    'chamber-pressure': 0,
    'world-takeover': 0,
    'residue-memory': 0,
    'recovery-hold': 0,
    hybrid: 0
  },
  dominantStageIntent: 'hybrid',
  worldAuthorityStateSpread: {
    background: 0,
    support: 0,
    shared: 0,
    dominant: 0
  },
  dominantWorldAuthorityState: 'background',
  heroAuthorityStateSpread: {
    subtracted: 0,
    support: 0,
    shared: 0,
    dominant: 0
  },
  dominantHeroAuthorityState: 'shared',
  postSpendIntentSpread: {
    withhold: 0,
    trace: 0,
    stress: 0,
    memory: 0,
    wipe: 0,
    burn: 0
  },
  dominantPostSpendIntent: 'withhold',
  silenceStateSpread: {
    none: 0,
    'room-floor': 0,
    beauty: 0,
    suspense: 0
  },
  dominantSilenceState: 'beauty',
  phraseConfidenceSpread: {
    uncertain: 0,
    forming: 0,
    confident: 0,
    locked: 0
  },
  dominantPhraseConfidence: 'uncertain',
  sectionIntentSpread: {
    hold: 0,
    turn: 0,
    drop: 0,
    release: 0,
    recovery: 0
  },
  dominantSectionIntent: 'hold',
  visualMotifSpread: {
    'void-anchor': 0,
    'machine-grid': 0,
    'neon-portal': 0,
    'rupture-scar': 0,
    'ghost-residue': 0,
    'silence-constellation': 0,
    'acoustic-transient': 0,
    'world-takeover': 0
  },
  dominantVisualMotif: 'void-anchor',
  playableMotifSceneSpread: {
    none: 0,
    'neon-cathedral': 0,
    'machine-tunnel': 0,
    'void-pressure': 0,
    'ghost-constellation': 0,
    'collapse-scar': 0
  },
  dominantPlayableMotifScene: 'none',
  playableMotifSceneTransitionReasonSpread: {
    hold: 0,
    'motif-change': 0,
    'section-turn': 0,
    'drop-rupture': 0,
    'release-residue': 0,
    'signature-moment': 0,
    'authority-shift': 0,
    'quiet-state': 0
  },
  dominantPlayableMotifSceneTransitionReason: 'hold',
  playableMotifSceneLongestRunMs: 0,
  playableMotifSceneMotifMatchRate: 1,
  playableMotifScenePaletteMatchRate: 1,
  playableMotifSceneDistinctnessMean: 0,
  playableMotifSceneSilhouetteConfidenceMean: 0,
  heroRoleSpread: {
    dominant: 0,
    supporting: 0,
    fractured: 0,
    ghost: 0,
    twin: 0,
    membrane: 0,
    suppressed: 0,
    'world-as-hero': 0
  },
  dominantHeroRole: 'supporting',
  heroFormSpread: {
    orb: 0,
    cube: 0,
    pyramid: 0,
    diamond: 0,
    prism: 0,
    shard: 0,
    mushroom: 0
  },
  dominantHeroForm: 'orb',
  heroFormReasonSpread: {
    hold: 0,
    'motif-change': 0,
    'cue-family': 0,
    'section-turn': 0,
    'drop-rupture': 0,
    'release-residue': 0,
    'signature-moment': 0,
    'authority-demotion': 0
  },
  dominantHeroFormReason: 'hold',
  paletteTransitionReasonSpread: {
    hold: 0,
    'motif-change': 0,
    'section-turn': 0,
    'drop-rupture': 0,
    'release-residue': 0,
    'signature-moment': 0,
    'authority-shift': 0
  },
  dominantPaletteTransitionReason: 'hold',
  paletteBaseStateSpread: {
    'void-cyan': 0,
    'tron-blue': 0,
    'acid-lime': 0,
    'solar-magenta': 0,
    'ghost-white': 0
  },
  dominantPaletteBaseState: 'void-cyan',
  paletteBaseLongestRunMs: 0,
  heroFormLongestRunMs: 0,
  heroFormSwitchesPerMinute: 0,
  plannedActiveHeroFormMatchRate: 1,
  heroWorldHueDivergenceMean: 0,
  semanticConfidenceMean: 0,
  unearnedChangeRiskMean: 0,
  stageWorldModeSpread: {
    hold: 0,
    'aperture-cage': 0,
    'fan-sweep': 0,
    'cathedral-rise': 0,
    'collapse-well': 0,
    'ghost-chamber': 0,
    'field-bloom': 0
  },
  stageWorldModeSpreadByFamily: {
    brood: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    gather: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    reveal: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    rupture: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    release: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    haunt: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    },
    reset: {
      hold: 0,
      'aperture-cage': 0,
      'fan-sweep': 0,
      'cathedral-rise': 0,
      'collapse-well': 0,
      'ghost-chamber': 0,
      'field-bloom': 0
    }
  },
  dominantStageWorldMode: 'hold',
  stageShotClassSpread: {
    anchor: 0,
    pressure: 0,
    rupture: 0,
    worldTakeover: 0,
    aftermath: 0,
    isolate: 0
  },
  stageShotClassSpreadByFamily: {
    brood: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    gather: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    reveal: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    rupture: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    release: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    haunt: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    },
    reset: {
      anchor: 0,
      pressure: 0,
      rupture: 0,
      worldTakeover: 0,
      aftermath: 0,
      isolate: 0
    }
  },
  dominantStageShotClass: 'anchor',
  stageTransitionClassSpread: {
    hold: 0,
    wipe: 0,
    collapse: 0,
    iris: 0,
    blackoutCut: 0,
    residueDissolve: 0,
    vectorHandoff: 0
  },
  dominantStageTransitionClass: 'hold',
  stageTempoCadenceModeSpread: {
    float: 0,
    metered: 0,
    driving: 0,
    surge: 0,
    aftermath: 0
  },
  dominantStageTempoCadenceMode: 'float',
  actEntropy: 0,
  paletteEntropy: 0,
  stageShotClassEntropy: 0,
  stageWorldModeEntropy: 0,
  actLongestRunMs: 0,
  paletteStateLongestRunMs: 0,
  stageShotClassLongestRunMs: 0,
  stageWorldModeLongestRunMs: 0,
  macroEventSpread: {},
  dominantMacroEvent: 'unknown',
  heroHueRange: 0,
  worldHueRange: 0,
  temporalWindowMeans: { ...DEFAULT_VISUAL_TEMPORAL_WINDOWS },
  stageCompositionSafetyMean: 0,
  compositionSafetyRate: 0,
  heroCoverageMean: 0,
  heroCoveragePeak: 0,
  heroOffCenterPenaltyMean: 0,
  heroOffCenterPenaltyPeak: 0,
  heroDepthPenaltyMean: 0,
  heroDepthPenaltyPeak: 0,
  chamberPresenceMean: 0,
  frameHierarchyMean: 0,
  ringBeltPersistenceMean: 0,
  ringBeltPersistencePeak: 0,
  wirefieldDensityMean: 0,
  wirefieldDensityPeak: 0,
  worldDominanceDeliveredMean: 0,
  heroTravelRangeX: 0,
  heroTravelRangeY: 0,
  heroTravelRangeZ: 0,
  heroRotationVariancePitch: 0,
  heroRotationVarianceYaw: 0,
  heroRotationVarianceRoll: 0,
  chamberTravelRangeX: 0,
  chamberTravelRangeY: 0,
  chamberTravelRangeZ: 0,
  chamberRotationVariancePitch: 0,
  chamberRotationVarianceYaw: 0,
  chamberRotationVarianceRoll: 0,
  cameraTravelRangeX: 0,
  cameraTravelRangeY: 0,
  cameraTravelRangeZ: 0,
  cameraRotationVariancePitch: 0,
  cameraRotationVarianceYaw: 0,
  cameraRotationVarianceRoll: 0,
  heroOverreachFallbackRate: 0,
  ringOverdrawFallbackRate: 0,
  overbrightFallbackRate: 0,
  washoutFallbackRate: 0,
  qualityTransitionCount: 0,
  firstQualityDowngradeMs: undefined,
  signatureMomentSpread: {
    none: 1,
    'collapse-scar': 0,
    'cathedral-open': 0,
    'ghost-residue': 0,
    'silence-constellation': 0
  },
  dominantSignatureMoment: 'none',
  signatureMomentStyleSpread: {
    'contrast-mythic': 1,
    'maximal-neon': 0,
    'ambient-premium': 0
  },
  dominantSignatureMomentStyle: 'contrast-mythic',
  signatureMomentActiveRate: 0,
  signatureMomentIntensityMean: 0,
  signatureMomentIntensityPeak: 0,
  signatureMomentTriggerConfidenceMean: 0,
  signatureMomentForcedPreviewRate: 0,
  collapseScarMean: 0,
  collapseScarPeak: 0,
  cathedralOpenMean: 0,
  cathedralOpenPeak: 0,
  ghostResidueMean: 0,
  ghostResiduePeak: 0,
  silenceConstellationMean: 0,
  silenceConstellationPeak: 0,
  aftermathClearanceMean: 1,
  postConsequenceMean: 0,
  postOverprocessRiskMean: 0,
  postOverprocessRiskPeak: 0,
  compositorContrastLiftMean: 0,
  compositorSaturationLiftMean: 0,
  compositorOverprocessRiskMean: 0,
  compositorOverprocessRiskPeak: 0,
  perceptualContrastMean: 0.62,
  perceptualColorfulnessMean: 0.52,
  perceptualWashoutRiskMean: 0,
  perceptualWashoutRiskPeak: 0,
  assetLayerSummary: Object.fromEntries(
    VISUAL_ASSET_LAYERS.map((layer) => [
      layer,
      {
        mean: 0,
        peak: 0,
        activeFrameRate: 0
      }
    ])
  ) as VisualAssetLayerSummary
};
