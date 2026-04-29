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
    provenance: PROCEDURAL_PROVENANCE,
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
    minimumDwellSeconds: 7.4,
    distinctness: 0.9,
    silhouetteConfidence: 0.86
  },
  'machine-tunnel': {
    id: 'machine-tunnel',
    label: 'Machine Tunnel',
    assetPacks: ['stage-geometry-pack', 'mask-pack', 'glyph-pack', 'particle-job-pack'],
    provenance: PROCEDURAL_PROVENANCE,
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
    minimumDwellSeconds: 6.8,
    distinctness: 0.82,
    silhouetteConfidence: 0.8
  },
  'void-pressure': {
    id: 'void-pressure',
    label: 'Void Pressure',
    assetPacks: ['surface-pack', 'mask-pack', 'particle-job-pack'],
    provenance: PROCEDURAL_PROVENANCE,
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
    minimumDwellSeconds: 8.2,
    distinctness: 0.86,
    silhouetteConfidence: 0.84
  },
  'ghost-constellation': {
    id: 'ghost-constellation',
    label: 'Ghost Constellation',
    assetPacks: ['glyph-pack', 'surface-pack', 'post-memory-pack', 'particle-job-pack'],
    provenance: PROCEDURAL_PROVENANCE,
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
    minimumDwellSeconds: 9.2,
    distinctness: 0.78,
    silhouetteConfidence: 0.74
  },
  'collapse-scar': {
    id: 'collapse-scar',
    label: 'Collapse Scar',
    assetPacks: ['mask-pack', 'surface-pack', 'post-memory-pack', 'particle-job-pack'],
    provenance: PROCEDURAL_PROVENANCE,
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
    minimumDwellSeconds: 5.6,
    distinctness: 0.94,
    silhouetteConfidence: 0.91
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
