import type {
  PaletteState,
  PlayableMotifSceneKind,
  SceneVisualProfile,
  VisualMotifKind
} from '../../types/visual';

const PROCEDURAL_PROVENANCE = {
  source: 'procedural-code',
  createdAt: '2026-04-29',
  generator: 'VisuLive procedural Three.js scene profile catalog',
  license: 'project-owned',
  notes:
    'Abstract procedural scene ontology only. No stock VJ loops, copied show imagery, or opaque media assets.'
} as const;

export const SCENE_VISUAL_PROFILES: Record<
  Exclude<PlayableMotifSceneKind, 'none'>,
  SceneVisualProfile
> = {
  'neon-cathedral': {
    id: 'neon-cathedral',
    label: 'Neon Cathedral',
    assetPacks: ['stage-geometry-pack', 'mask-pack', 'surface-pack', 'particle-job-pack'],
    assetPackIds: ['portal-aperture-mask', 'cathedral-rib-geometry'],
    provenance: PROCEDURAL_PROVENANCE,
    imageClass: 'cathedral-vault',
    frameOwner: 'chamber',
    compositionClass: 'portal-vault',
    lightingClass: 'neon-seams',
    materialClass: 'emissive-architecture',
    audioZoneBinding: 'build-reveal',
    memoryBehavior: 'clean-clear',
    proofStatus: 'diagnostic',
    previewRecipe: {
      cueProfile: 'reveal',
      preferredStyle: 'maximal-neon',
      stillKind: 'signature-preview',
      reviewPrompt:
        'Reads as a wide architectural portal or vault before details are visible.'
    },
    silhouetteFamily: 'vertical-vault',
    surfaceRole: 'architectural-aperture',
    expectedMotifs: ['neon-portal', 'world-takeover'],
    expectedPaletteBases: ['tron-blue', 'acid-lime', 'solar-magenta'],
    paletteBase: 'tron-blue',
    ringPosture: 'cathedral-architecture',
    heroRole: 'supporting',
    heroForm: 'prism',
    particleJob: 'punctuation',
    compositorMask: 'portal-aperture',
    motionBias: 'cathedral-precession',
    minimumDwellSeconds: 9.4,
    distinctness: 0.92,
    silhouetteConfidence: 0.89
  },
  'machine-tunnel': {
    id: 'machine-tunnel',
    label: 'Machine Tunnel',
    assetPacks: ['stage-geometry-pack', 'mask-pack', 'glyph-pack', 'particle-job-pack'],
    assetPackIds: ['machine-shutter-mask', 'machine-depth-glyphs'],
    provenance: PROCEDURAL_PROVENANCE,
    imageClass: 'machine-shutter-tunnel',
    frameOwner: 'world',
    compositionClass: 'perspective-lanes',
    lightingClass: 'scanline-voltage',
    materialClass: 'mechanical-glass',
    audioZoneBinding: 'grid-rhythm',
    memoryBehavior: 'shutter-afterimage',
    proofStatus: 'unproven',
    previewRecipe: {
      cueProfile: 'drop',
      preferredStyle: 'maximal-neon',
      stillKind: 'signature-preview',
      reviewPrompt:
        'Reads as depth lanes or shutter travel, not just rings with a different label.'
    },
    silhouetteFamily: 'perspective-tunnel',
    surfaceRole: 'shutter-lanes',
    expectedMotifs: ['machine-grid', 'acoustic-transient'],
    expectedPaletteBases: ['tron-blue', 'acid-lime', 'void-cyan'],
    paletteBase: 'acid-lime',
    ringPosture: 'event-strike',
    heroRole: 'supporting',
    heroForm: 'cube',
    particleJob: 'pressure-dust',
    compositorMask: 'shutter',
    motionBias: 'arc-handoff',
    minimumDwellSeconds: 8.6,
    distinctness: 0.86,
    silhouetteConfidence: 0.84
  },
  'void-pressure': {
    id: 'void-pressure',
    label: 'Void Pressure',
    assetPacks: ['surface-pack', 'mask-pack', 'particle-job-pack'],
    assetPackIds: ['void-pressure-scrim', 'void-dust-field'],
    provenance: PROCEDURAL_PROVENANCE,
    imageClass: 'void-mass',
    frameOwner: 'world',
    compositionClass: 'negative-space-body',
    lightingClass: 'dark-pressure',
    materialClass: 'velvet-void',
    audioZoneBinding: 'pressure-drop',
    memoryBehavior: 'pressure-residue',
    proofStatus: 'diagnostic',
    previewRecipe: {
      cueProfile: 'drop',
      preferredStyle: 'contrast-mythic',
      stillKind: 'authority',
      reviewPrompt:
        'Reads as a dark pressure body or compression well with color used locally.'
    },
    silhouetteFamily: 'negative-space-mass',
    surfaceRole: 'void-scrim',
    expectedMotifs: ['void-anchor', 'world-takeover'],
    expectedPaletteBases: ['void-cyan', 'tron-blue'],
    paletteBase: 'void-cyan',
    ringPosture: 'suppressed',
    heroRole: 'world-as-hero',
    heroForm: 'orb',
    particleJob: 'pressure-dust',
    compositorMask: 'iris',
    motionBias: 'recoil-dive',
    minimumDwellSeconds: 10.5,
    distinctness: 0.88,
    silhouetteConfidence: 0.86
  },
  'ghost-constellation': {
    id: 'ghost-constellation',
    label: 'Ghost Constellation',
    assetPacks: ['glyph-pack', 'surface-pack', 'post-memory-pack', 'particle-job-pack'],
    assetPackIds: ['ghost-constellation-map', 'ghost-memory-veil'],
    provenance: PROCEDURAL_PROVENANCE,
    imageClass: 'ghost-starfield',
    frameOwner: 'post',
    compositionClass: 'wide-field',
    lightingClass: 'soft-memory',
    materialClass: 'spectral-dust',
    audioZoneBinding: 'quiet-release',
    memoryBehavior: 'ghost-recall',
    proofStatus: 'diagnostic',
    previewRecipe: {
      cueProfile: 'quiet',
      preferredStyle: 'ambient-premium',
      stillKind: 'quiet',
      reviewPrompt:
        'Reads as premium sparse negative space with memory points, not empty holding.'
    },
    silhouetteFamily: 'wide-constellation',
    surfaceRole: 'celestial-field',
    expectedMotifs: ['ghost-residue', 'silence-constellation'],
    expectedPaletteBases: ['ghost-white', 'void-cyan', 'solar-magenta'],
    paletteBase: 'ghost-white',
    ringPosture: 'residue-trace',
    heroRole: 'ghost',
    heroForm: 'diamond',
    particleJob: 'memory-echo',
    compositorMask: 'ghost-veil',
    motionBias: 'drift-orbit',
    minimumDwellSeconds: 11.5,
    distinctness: 0.84,
    silhouetteConfidence: 0.82
  },
  'collapse-scar': {
    id: 'collapse-scar',
    label: 'Collapse Scar',
    assetPacks: ['mask-pack', 'surface-pack', 'post-memory-pack', 'particle-job-pack'],
    assetPackIds: ['collapse-scar-matte', 'collapse-residue-trace'],
    provenance: PROCEDURAL_PROVENANCE,
    imageClass: 'diagonal-scar',
    frameOwner: 'post',
    compositionClass: 'asymmetric-rupture',
    lightingClass: 'subtractive-cut',
    materialClass: 'scar-matte',
    audioZoneBinding: 'rupture-impact',
    memoryBehavior: 'scar-residue',
    proofStatus: 'diagnostic',
    previewRecipe: {
      cueProfile: 'drop',
      preferredStyle: 'contrast-mythic',
      stillKind: 'signature',
      reviewPrompt:
        'Reads as a diagonal bite or scar before glow, not a generic impact flash.'
    },
    silhouetteFamily: 'diagonal-rupture',
    surfaceRole: 'scar-matte',
    expectedMotifs: ['rupture-scar', 'world-takeover', 'machine-grid'],
    expectedPaletteBases: ['void-cyan', 'solar-magenta', 'tron-blue'],
    paletteBase: 'solar-magenta',
    ringPosture: 'event-strike',
    heroRole: 'fractured',
    heroForm: 'shard',
    particleJob: 'punctuation',
    compositorMask: 'scar-matte',
    motionBias: 'recoil-dive',
    minimumDwellSeconds: 6.4,
    distinctness: 0.95,
    silhouetteConfidence: 0.93
  }
};

export function getSceneVisualProfile(
  scene: PlayableMotifSceneKind
): SceneVisualProfile | null {
  return scene === 'none' ? null : SCENE_VISUAL_PROFILES[scene];
}

export function sceneProfileMatchesMotif(
  profile: SceneVisualProfile | null,
  motif: VisualMotifKind
): boolean {
  return profile ? profile.expectedMotifs.includes(motif) : true;
}

export function sceneProfileMatchesPalette(
  profile: SceneVisualProfile | null,
  baseState: PaletteState
): boolean {
  return profile ? profile.expectedPaletteBases.includes(baseState) : true;
}
