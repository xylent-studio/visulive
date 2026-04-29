import { describe, expect, it } from 'vitest';
import { VISUAL_ASSET_PACKS } from './visualAssetPacks';
import { SCENE_VISUAL_PROFILES } from './visualAssetProfiles';

describe('scene visual asset profiles', () => {
  it('gives each playable scene a distinct authored ontology', () => {
    expect(SCENE_VISUAL_PROFILES['neon-cathedral']).toMatchObject({
      silhouetteFamily: 'vertical-vault',
      surfaceRole: 'architectural-aperture',
      ringPosture: 'cathedral-architecture',
      heroForm: 'prism',
      compositorMask: 'portal-aperture'
    });

    expect(SCENE_VISUAL_PROFILES['machine-tunnel']).toMatchObject({
      silhouetteFamily: 'perspective-tunnel',
      surfaceRole: 'shutter-lanes',
      heroForm: 'cube',
      compositorMask: 'shutter',
      particleJob: 'pressure-dust'
    });

    expect(SCENE_VISUAL_PROFILES['void-pressure']).toMatchObject({
      silhouetteFamily: 'negative-space-mass',
      surfaceRole: 'void-scrim',
      ringPosture: 'suppressed',
      heroRole: 'world-as-hero',
      compositorMask: 'iris'
    });

    expect(SCENE_VISUAL_PROFILES['ghost-constellation']).toMatchObject({
      silhouetteFamily: 'wide-constellation',
      surfaceRole: 'celestial-field',
      heroForm: 'diamond',
      compositorMask: 'ghost-veil',
      particleJob: 'memory-echo'
    });

    expect(SCENE_VISUAL_PROFILES['collapse-scar']).toMatchObject({
      silhouetteFamily: 'diagonal-rupture',
      surfaceRole: 'scar-matte',
      heroForm: 'shard',
      compositorMask: 'scar-matte',
      particleJob: 'punctuation'
    });

    const silhouetteFamilies = new Set(
      Object.values(SCENE_VISUAL_PROFILES).map((profile) => profile.silhouetteFamily)
    );
    expect(silhouetteFamilies.size).toBe(5);
  });

  it('keeps every authored asset pack procedural and project-owned', () => {
    for (const profile of Object.values(SCENE_VISUAL_PROFILES)) {
      expect(profile.provenance.source).toBe('procedural-code');
      expect(profile.provenance.license).toBe('project-owned');
      expect(profile.assetPacks.length).toBeGreaterThan(0);
      expect(profile.assetPackIds.length).toBeGreaterThan(0);

      for (const packId of profile.assetPackIds) {
        const pack = VISUAL_ASSET_PACKS[packId];
        expect(pack).toBeDefined();
        expect(pack.provenance.source).toBe('procedural-code');
        expect(pack.provenance.license).toBe('project-owned');
        expect(pack.legalScenes).toContain(profile.id);
        expect(profile.assetPacks).toContain(pack.kind);
        expect(pack.fallbackBehavior.length).toBeGreaterThan(12);
        expect(pack.generatorSeed).toMatch(/:v\d:/);
      }
    }
  });

  it('keeps the asset catalog small, legal, and source-defined', () => {
    const packs = Object.values(VISUAL_ASSET_PACKS);

    expect(packs.length).toBeGreaterThanOrEqual(10);

    for (const pack of packs) {
      expect(pack.legalScenes.length).toBeGreaterThan(0);
      expect(pack.legalMoments.length).toBeGreaterThan(0);
      expect(pack.commitPolicy).toMatch(/source-definition-only|small-generated-atlas-allowed/);
      expect(pack.provenance.notes).toMatch(/No stock VJ loops/i);
    }
  });
});
