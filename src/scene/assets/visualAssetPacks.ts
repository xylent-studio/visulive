import type {
  PlayableMotifSceneKind,
  SignatureMomentKind,
  VisualAssetPack,
  VisualAssetPackId,
  VisualAssetProvenance
} from '../../types/visual';

const PROCEDURAL_ASSET_PROVENANCE: VisualAssetProvenance = {
  source: 'procedural-code',
  createdAt: '2026-04-29',
  generator: 'VisuLive procedural asset-pack catalog',
  license: 'project-owned',
  notes:
    'Source-defined abstract masks, glyphs, surfaces, geometry roles, and particle jobs only. No stock VJ loops, copied show imagery, or opaque media imports.'
};

export const VISUAL_ASSET_PACKS: Record<VisualAssetPackId, VisualAssetPack> = {
  'portal-aperture-mask': {
    id: 'portal-aperture-mask',
    label: 'Portal Aperture Mask',
    kind: 'mask-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['neon-cathedral'],
    legalMoments: ['cathedral-open'],
    surfaceRole: 'architectural-aperture',
    compositorMask: 'portal-aperture',
    fallbackBehavior: 'Use procedural vertical portal ribs without bitmap masks.',
    generatorSeed: 'portal-aperture:v1:vertical-vault',
    commitPolicy: 'source-definition-only'
  },
  'cathedral-rib-geometry': {
    id: 'cathedral-rib-geometry',
    label: 'Cathedral Rib Geometry',
    kind: 'stage-geometry-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['neon-cathedral'],
    legalMoments: ['cathedral-open'],
    surfaceRole: 'architectural-aperture',
    particleJob: 'punctuation',
    fallbackBehavior: 'Render nested procedural ribs and aperture lanes.',
    generatorSeed: 'cathedral-ribs:v1:cyan-magenta-acid',
    commitPolicy: 'source-definition-only'
  },
  'machine-shutter-mask': {
    id: 'machine-shutter-mask',
    label: 'Machine Shutter Mask',
    kind: 'mask-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['machine-tunnel'],
    legalMoments: ['collapse-scar', 'cathedral-open'],
    surfaceRole: 'shutter-lanes',
    compositorMask: 'shutter',
    fallbackBehavior: 'Use procedural horizontal scan shutters and tunnel lanes.',
    generatorSeed: 'machine-shutter:v1:scan-lanes',
    commitPolicy: 'source-definition-only'
  },
  'machine-depth-glyphs': {
    id: 'machine-depth-glyphs',
    label: 'Machine Depth Glyphs',
    kind: 'glyph-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['machine-tunnel'],
    legalMoments: ['collapse-scar'],
    surfaceRole: 'shutter-lanes',
    particleJob: 'pressure-dust',
    fallbackBehavior: 'Use procedural perspective bars instead of glyph texture assets.',
    generatorSeed: 'machine-glyphs:v1:perspective-depth',
    commitPolicy: 'small-generated-atlas-allowed'
  },
  'void-pressure-scrim': {
    id: 'void-pressure-scrim',
    label: 'Void Pressure Scrim',
    kind: 'surface-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['void-pressure'],
    legalMoments: ['collapse-scar', 'silence-constellation'],
    surfaceRole: 'void-scrim',
    compositorMask: 'iris',
    fallbackBehavior: 'Use a large procedural dark body and iris compression.',
    generatorSeed: 'void-scrim:v1:negative-space',
    commitPolicy: 'source-definition-only'
  },
  'void-dust-field': {
    id: 'void-dust-field',
    label: 'Void Dust Field',
    kind: 'particle-job-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['void-pressure'],
    legalMoments: ['collapse-scar'],
    surfaceRole: 'void-scrim',
    particleJob: 'pressure-dust',
    fallbackBehavior: 'Use sparse procedural dust as pressure evidence, not decoration.',
    generatorSeed: 'void-dust:v1:compression',
    commitPolicy: 'source-definition-only'
  },
  'ghost-constellation-map': {
    id: 'ghost-constellation-map',
    label: 'Ghost Constellation Map',
    kind: 'glyph-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['ghost-constellation'],
    legalMoments: ['ghost-residue', 'silence-constellation'],
    surfaceRole: 'celestial-field',
    particleJob: 'memory-echo',
    fallbackBehavior: 'Use seeded procedural points and faint links.',
    generatorSeed: 'ghost-map:v1:wide-negative-space',
    commitPolicy: 'small-generated-atlas-allowed'
  },
  'ghost-memory-veil': {
    id: 'ghost-memory-veil',
    label: 'Ghost Memory Veil',
    kind: 'post-memory-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['ghost-constellation'],
    legalMoments: ['ghost-residue', 'silence-constellation'],
    surfaceRole: 'celestial-field',
    compositorMask: 'ghost-veil',
    particleJob: 'memory-echo',
    fallbackBehavior: 'Use bounded post memory traces with no persistent haze.',
    generatorSeed: 'ghost-veil:v1:afterimage-memory',
    commitPolicy: 'source-definition-only'
  },
  'collapse-scar-matte': {
    id: 'collapse-scar-matte',
    label: 'Collapse Scar Matte',
    kind: 'mask-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['collapse-scar'],
    legalMoments: ['collapse-scar'],
    surfaceRole: 'scar-matte',
    compositorMask: 'scar-matte',
    fallbackBehavior: 'Use diagonal procedural matte cuts before glow.',
    generatorSeed: 'collapse-scar:v1:diagonal-bite',
    commitPolicy: 'source-definition-only'
  },
  'collapse-residue-trace': {
    id: 'collapse-residue-trace',
    label: 'Collapse Residue Trace',
    kind: 'post-memory-pack',
    provenance: PROCEDURAL_ASSET_PROVENANCE,
    legalScenes: ['collapse-scar'],
    legalMoments: ['collapse-scar', 'ghost-residue'],
    surfaceRole: 'scar-matte',
    particleJob: 'residue',
    fallbackBehavior: 'Use short-lived scar residue; never leave ring wallpaper behind.',
    generatorSeed: 'collapse-residue:v1:short-memory',
    commitPolicy: 'source-definition-only'
  }
};

export function getVisualAssetPack(id: VisualAssetPackId): VisualAssetPack {
  return VISUAL_ASSET_PACKS[id];
}

export function getVisualAssetPacksForScene(
  scene: PlayableMotifSceneKind
): readonly VisualAssetPack[] {
  return scene === 'none'
    ? []
    : Object.values(VISUAL_ASSET_PACKS).filter((pack) =>
        pack.legalScenes.includes(scene)
      );
}

export function getVisualAssetPacksForMoment(
  moment: SignatureMomentKind
): readonly VisualAssetPack[] {
  return moment === 'none'
    ? []
    : Object.values(VISUAL_ASSET_PACKS).filter((pack) =>
        pack.legalMoments.includes(moment)
      );
}
