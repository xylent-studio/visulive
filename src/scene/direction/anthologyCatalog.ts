import type { AnthologyFamilyDeclaration } from '../contracts/anthology';

export const anthologyCatalog = [
  {
    id: 'hero-ecology',
    label: 'Hero Ecology',
    category: 'hero',
    status: 'flagship',
    intendedOwnerLane: 'Hero Ecology',
    runtimeOwnershipStatus: 'owned-system',
    runtimeOwner:
      'C:/dev/GitHub/visulive/src/scene/systems/hero/HeroSystem.ts',
    blockingOwner:
      'HeroSystem owns core lifecycle now; alternate species and hero-suppressed/world-as-hero states are still unproven capability work.',
    cueRole: 'dominant-authority',
    quietBehavior: {
      summary:
        'The hero anchors the frame as emitted structure rather than a filled-shell blob.',
      authorityMode:
        'Hero can lead in quiet states without erasing chamber participation.',
      roomRead:
        'Dark body, seam, cavity, and rim contrast stay legible from across the room.',
      proofSignals: [
        'quiet frames retain silhouette',
        'seam and cavity reads survive safe tier',
        'hero can demote without disappearing completely'
      ]
    },
    impactBehavior: {
      summary:
        'The hero can split, intensify, or fracture when the cue earns a hero-led event.',
      authorityMode:
        'Hero authority becomes a cue choice, not the default answer to every hit.',
      roomRead:
        'Hero-led impact looks structurally hotter, not merely larger or brighter.',
      proofSignals: [
        'at least one alternate hero image class appears',
        'impact cues visibly change hero ontology',
        'hero escalation does not wash out chamber structure'
      ]
    },
    aftermathBehavior: {
      summary:
        'Hero residue can remain as scar, ghost, or absence after the event resolves.',
      authorityMode:
        'Aftermath may suppress the hero entirely when the world should own the frame.',
      roomRead:
        'Aftermath reads as memory or vacancy rather than a permanently glowing object.',
      proofSignals: [
        'hero suppression is visible in at least one aftermath cue',
        'ghost or scar states remain readable without monopolizing the frame'
      ]
    },
    absenceRules: [
      {
        when: 'World-takeover or aftermath-dominant cues',
        mustAvoid: 'Keeping the hero full-size, centered, and fully lit',
        reason: 'Hero monopoly collapses the intended frame hierarchy.'
      }
    ],
    safeTierExpectation: {
      targetTier: 'webgpu-safe',
      requirement:
        'Hero seams, cavities, and silhouette must read without premium-only bloom or dense fill light.',
      budgetNotes: [
        'Prefer emitted structure over broad shell brightness.',
        'Keep dark-body contrast intact when chamber or world light rises.'
      ]
    },
    proofRequirements: [
      {
        id: 'hero-quiet-read',
        label: 'Quiet hero readability',
        description:
          'Quiet no-touch frames must preserve hero silhouette and seam contrast.',
        proofKind: 'quiet'
      },
      {
        id: 'hero-impact-contrast',
        label: 'Hero impact contrast',
        description:
          'Hero-led events must visibly change ontology or structure instead of only intensity.',
        proofKind: 'impact'
      },
      {
        id: 'hero-safe-tier',
        label: 'Hero safe-tier dignity',
        description:
          'The hero must remain premium and intentional on webgpu/safe.',
        proofKind: 'safe-tier'
      },
      {
        id: 'hero-no-touch',
        label: 'Hero no-touch trust',
        description:
          'Untouched runs must show hero leadership without hero monopoly.',
        proofKind: 'no-touch'
      }
    ],
    nextTarget:
      'Land the first explicit alternate hero species plus a hero-suppressed/world-as-hero proof state.',
    nextDependency:
      'Use fresh authority-split proof to decide the first safe alternate-species and suppression behavior.',
    blockingDependency:
      'Species-specific materials, suppression legality, and world-as-hero choreography still need proof-led implementation.',
    graduationTarget: {
      from: 'flagship',
      to: 'flagship',
      gate:
        'Retain flagship seed status while alternate hero species prove themselves in lab and frontier.'
    },
    proofStatus:
      'Current flagship seed is shipped, but alternate species and hero suppression behavior are still unproven.',
    lastMeaningfulPass:
      '2026-04-23 hero mutation ownership extraction into HeroSystem',
    currentBiggestFailureMode:
      'Hero monopoly still crowds chamber/world authority and can drift back toward softly lit blob behavior.'
  },
  {
    id: 'world-grammar-mutation',
    label: 'World Grammar / Mutation',
    category: 'world',
    status: 'frontier',
    intendedOwnerLane: 'World Grammar / Mutation',
    runtimeOwnershipStatus: 'partial-system',
    runtimeOwner:
      'C:/dev/GitHub/visulive/src/scene/systems/world/WorldSystem.ts + C:/dev/GitHub/visulive/src/scene/systems/chamber/ChamberSystem.ts + C:/dev/GitHub/visulive/src/scene/governors/AuthorityGovernor.ts',
    blockingOwner:
      'World/chamber lifecycle and authority judgment are split, but explicit world mutation verbs are not yet proven capability behavior.',
    cueRole: 'world-authority',
    quietBehavior: {
      summary:
        'World families should keep the frame alive in sparse sections through pressure, aperture, or field behavior.',
      authorityMode:
        'World can lead even when the hero is small, absent, or suppressed.',
      roomRead:
        'Chamber and world silhouette must register clearly from distance.',
      proofSignals: [
        'quiet room-floor runs show world-led images',
        'world families remain distinguishable without relying on hero color'
      ]
    },
    impactBehavior: {
      summary:
        'Mutation verbs should open, cage, sweep, collapse, or stain the room itself.',
      authorityMode:
        'World changes become structural cue consequences rather than preset swaps.',
      roomRead:
        'Mutations change the whole frame, not just local object styling.',
      proofSignals: [
        'at least three mutation verbs are visibly distinct',
        'world-takeover frames become common enough to feel authored'
      ]
    },
    aftermathBehavior: {
      summary:
        'World aftermath should leave altered architecture, stain, or chamber memory after the hit.',
      authorityMode:
        'World can remain the primary author through recovery when the cue earns it.',
      roomRead:
        'Aftermath reads as changed space, not just left-over brightness.',
      proofSignals: [
        'post-event world stain or chamber alteration remains visible',
        'world-led aftermath does not collapse back into hero-only framing'
      ]
    },
    absenceRules: [
      {
        when: 'Hero-led anchor cues',
        mustAvoid: 'Forcing world mutation on every phrase',
        reason:
          'World mutation should feel consequential, not like permanent background churn.'
      }
    ],
    safeTierExpectation: {
      targetTier: 'webgpu-safe',
      requirement:
        'World authority must survive safe-tier trimming through large-scale silhouette, beam, and field behavior.',
      budgetNotes: [
        'Prioritize room-scale shape over dense particle detail.',
        'Use negative space and contrast instead of premium-only fog or post.'
      ]
    },
    proofRequirements: [
      {
        id: 'world-quiet-floor',
        label: 'World quiet-floor proof',
        description:
          'Room-floor runs must retain authored chamber/world life without the hero carrying every frame.',
        proofKind: 'quiet'
      },
      {
        id: 'world-mutation-impact',
        label: 'World mutation impact proof',
        description:
          'At least three world mutation verbs must produce visibly distinct frame changes.',
        proofKind: 'impact'
      },
      {
        id: 'world-aftermath',
        label: 'World aftermath proof',
        description:
          'Aftermath must leave changed space, stain, or altered chamber structure.',
        proofKind: 'aftermath'
      },
      {
        id: 'world-no-touch',
        label: 'World no-touch trust',
        description:
          'Untouched runs must demonstrate that world-led frames occur without advanced curation.',
        proofKind: 'no-touch'
      }
    ],
    nextTarget:
      'Make world mutation a real runtime behavior and normalize chamber/world takeover as a common authored result.',
    nextDependency:
      'Run fresh authority-split proof, then add mutation verbs through owned WorldSystem/ChamberSystem surfaces only.',
    blockingDependency:
      'World takeover readability and mutation grammar need fresh proof before capability expansion.',
    graduationTarget: {
      from: 'frontier',
      to: 'flagship',
      gate:
        'Promote only when world mutation is a stable no-touch behavior on safe tier.'
    },
    proofStatus:
      'World intent is named and seeded, but explicit mutation and aftermath delivery are still mostly target-state truth.',
    lastMeaningfulPass:
      '2026-04-22 anthology-engine runtime intent install and mastery operating system seeding',
    currentBiggestFailureMode:
      'The chamber still risks reading as decorative support instead of an equal frame authority.'
  },
  {
    id: 'consequence-aftermath-post',
    label: 'Consequence / Aftermath / Post',
    category: 'consequence',
    status: 'frontier',
    intendedOwnerLane: 'Consequence / Aftermath / Post',
    runtimeOwnershipStatus: 'partial-system',
    runtimeOwner:
      'C:/dev/GitHub/visulive/src/scene/ObsidianBloomScene.ts plus runtime post logic',
    blockingOwner:
      'Dedicated PostSystem and aftermath ownership do not exist yet.',
    cueRole: 'aftermath-memory',
    quietBehavior: {
      summary:
        'Quiet frames should stay clean enough that later consequence feels earned.',
      authorityMode:
        'Post remains withheld unless the cue or memory state actually earns a spend.',
      roomRead:
        'Dark value and untouched space remain visible before impact.',
      proofSignals: [
        'quiet states avoid permanent haze or residue',
        'baseline post spend remains selective'
      ]
    },
    impactBehavior: {
      summary:
        'Consequence modes should scar, wipe, shock, or collapse the image itself.',
      authorityMode:
        'Impact spend is cue-bound and image-changing instead of uniform brightness gain.',
      roomRead:
        'Major cues alter topology, framing, or screen-space treatment across the room.',
      proofSignals: [
        'major events visibly change the frame',
        'at least two consequence modes read differently'
      ]
    },
    aftermathBehavior: {
      summary:
        'Aftermath states should leave memory, stain, void, or charged suspension and then resolve.',
      authorityMode:
        'Aftermath owns the frame only when the cue class calls for it.',
      roomRead:
        'Residual image change remains readable without turning into permanent treatment.',
      proofSignals: [
        'aftermath remains distinct from the impact spend',
        'post-event recovery states visibly differ'
      ]
    },
    absenceRules: [
      {
        when: 'quiet, gather, or reset cues',
        mustAvoid: 'Always-on residue, bloom fog, or smear',
        reason: 'Permanent consequence destroys hierarchy and cheapens impact.'
      }
    ],
    safeTierExpectation: {
      targetTier: 'webgpu-safe',
      requirement:
        'Consequence must remain legible through selective overlays and structural change, not only heavy premium post.',
      budgetNotes: [
        'Prefer localized frame change over full-screen wash.',
        'Keep aftermath readable without relying on high blur or long afterimage chains.'
      ]
    },
    proofRequirements: [
      {
        id: 'consequence-quiet-discipline',
        label: 'Consequence quiet discipline',
        description:
          'Quiet states must remain mostly clean so consequence reads as earned.',
        proofKind: 'quiet'
      },
      {
        id: 'consequence-impact',
        label: 'Consequence impact proof',
        description:
          'Major cues must visibly alter the image class instead of only brightness.',
        proofKind: 'impact'
      },
      {
        id: 'consequence-aftermath',
        label: 'Consequence aftermath proof',
        description:
          'At least two aftermath states must remain visible and separable after impact.',
        proofKind: 'aftermath'
      },
      {
        id: 'consequence-safe-tier',
        label: 'Consequence safe-tier proof',
        description:
          'Frame-changing consequence must still read on webgpu/safe.',
        proofKind: 'safe-tier'
      }
    ],
    nextTarget:
      'Add a dedicated PostSystem and split shock, scar, wipe, haunt, and recovery into explicit families.',
    nextDependency:
      'PostSystem extraction and clear cue legality rules in direction/runtime.',
    blockingDependency:
      'Aftermath behavior is still distributed across scene logic rather than owned by a dedicated system.',
    graduationTarget: {
      from: 'frontier',
      to: 'flagship',
      gate:
        'Promote only when consequence and aftermath stay selective, legible, and proof-backed in untouched runs.'
    },
    proofStatus:
      'Consequence intent is stronger than before, but aftermath families are not yet fully extracted or analyzer-scored.',
    lastMeaningfulPass:
      '2026-04-22 anthology-engine runtime intent install and mastery operating system seeding',
    currentBiggestFailureMode:
      'Aftermath can still collapse into overlong treatment or fail to differentiate itself clearly from the impact moment.'
  },
  {
    id: 'lighting-cinematography',
    label: 'Lighting / Cinematography',
    category: 'lighting',
    status: 'frontier',
    intendedOwnerLane: 'Lighting / Cinematography',
    runtimeOwnershipStatus: 'partial-system',
    runtimeOwner:
      'C:/dev/GitHub/visulive/src/scene/systems/LightingSystem.ts plus scene/runtime camera logic',
    blockingOwner:
      'Lighting ownership is only partially extracted and camera phrase behavior is not yet a first-class system contract.',
    cueRole: 'supporting-authority',
    quietBehavior: {
      summary:
        'Light and camera should keep sparse passages alive with motivated drift, silhouette, and framing pressure.',
      authorityMode:
        'Lighting and camera can author quiet tension without forcing a big event.',
      roomRead:
        'Silhouette, negative space, and beam carve remain readable from the back of the room.',
      proofSignals: [
        'quiet passages still move with intent',
        'light and camera choices remain readable on safe tier'
      ]
    },
    impactBehavior: {
      summary:
        'Cue-linked rigs and phrases should sweep, carve, stalk, plunge, or widen the shot class.',
      authorityMode:
        'Lighting and camera help define cue identity instead of acting as generic motion support.',
      roomRead:
        'Changes in rig and shot class are obvious without close inspection.',
      proofSignals: [
        'at least two light-rig states read differently',
        'camera phrase changes alter the whole-frame class'
      ]
    },
    aftermathBehavior: {
      summary:
        'After impact, lighting and framing should either hold the wound, recoil, or clear the space.',
      authorityMode:
        'Cinematography can make aftermath feel haunted, suspended, or emptied.',
      roomRead:
        'Recovery feels staged, not like a default return to center-lock.',
      proofSignals: [
        'aftermath uses different framing from impact',
        'post-event lighting supports residue or void instead of flattening it'
      ]
    },
    absenceRules: [
      {
        when: 'all cues',
        mustAvoid: 'Treating light and camera as always-on generic motion layers',
        reason: 'Unmotivated motion weakens cue identity and room readability.'
      }
    ],
    safeTierExpectation: {
      targetTier: 'webgpu-safe',
      requirement:
        'Lighting and camera must preserve silhouette and phrase without relying on expensive premium-only fog or post.',
      budgetNotes: [
        'Prefer shape and contrast over subtle micro-lighting.',
        'Use shot-class changes that still register when effects are trimmed.'
      ]
    },
    proofRequirements: [
      {
        id: 'lighting-quiet',
        label: 'Lighting quiet dignity',
        description:
          'Quiet passes must remain readable and directed through light and framing, not only through the hero.',
        proofKind: 'quiet'
      },
      {
        id: 'lighting-impact',
        label: 'Lighting impact phrasing',
        description:
          'Light rigs and camera phrases must visibly shift cue identity during impact.',
        proofKind: 'impact'
      },
      {
        id: 'lighting-aftermath',
        label: 'Lighting aftermath phrasing',
        description:
          'Aftermath must show a distinct light or framing response rather than a default reset.',
        proofKind: 'aftermath'
      },
      {
        id: 'lighting-safe-tier',
        label: 'Lighting safe-tier proof',
        description:
          'Safe tier must preserve silhouette and cue-linked framing authority.',
        proofKind: 'safe-tier'
      }
    ],
    nextTarget:
      'Make cue-linked light rigs and camera phrases explicit runtime behavior with safe-tier room readability.',
    nextDependency:
      'Separate lasting lighting/camera ownership from monolithic scene code into owned systems.',
    blockingDependency:
      'Camera phrase logic is still too entangled with scene motion and macro-event logic.',
    graduationTarget: {
      from: 'frontier',
      to: 'flagship',
      gate:
        'Promote only when cue-linked light and framing states are clearly distinguishable in untouched proof runs.'
    },
    proofStatus:
      'Intent names lighting rigs and camera phrases, but system-owned light/camera authorship is still incomplete.',
    lastMeaningfulPass:
      '2026-04-22 anthology-engine runtime intent install and mastery operating system seeding',
    currentBiggestFailureMode:
      'Lighting and camera still risk reading as generic support layers instead of equal cue authors.'
  },
  {
    id: 'particles-fields',
    label: 'Particles / Fields',
    category: 'particles',
    status: 'frontier',
    intendedOwnerLane: 'Particles / Fields',
    runtimeOwnershipStatus: 'partial-system',
    runtimeOwner:
      'C:/dev/GitHub/visulive/src/scene/systems/ParticleSystem.ts',
    blockingOwner:
      'Particles exist as a system, but role-based field behavior is not yet explicit.',
    cueRole: 'supporting-authority',
    quietBehavior: {
      summary:
        'Particles and fields should provide atmosphere, dust, spores, or pressure without noise soup.',
      authorityMode:
        'Quiet fields support world life and hint at memory or weather.',
      roomRead:
        'Field behavior reads as large-scale motion or weather, not visual chatter.',
      proofSignals: [
        'quiet atmosphere stays alive without particle spam',
        'field motion remains directional and legible'
      ]
    },
    impactBehavior: {
      summary:
        'Particles can become offspring, sparks, debris, or punctuation when the cue class calls for it.',
      authorityMode:
        'Particles should occasionally become the readable event authority.',
      roomRead:
        'Impact fields read as organized eruption or weather, not random confetti.',
      proofSignals: [
        'at least one cue lets particles own the frame',
        'particle jobs differ by cue family'
      ]
    },
    aftermathBehavior: {
      summary:
        'Field behavior can remain as residue, embers, dust, or memory echo after the strike.',
      authorityMode:
        'Particles help hold aftermath only when they continue the cue logic.',
      roomRead:
        'Residual field behavior remains sparse enough to preserve black value.',
      proofSignals: [
        'particle residue reads differently from impact spray',
        'aftermath particles do not become permanent haze'
      ]
    },
    absenceRules: [
      {
        when: 'quiet or low-confidence cues',
        mustAvoid: 'Filling the frame with decorative micro-noise',
        reason: 'Particle chatter destroys clarity and makes silence look anxious.'
      }
    ],
    safeTierExpectation: {
      targetTier: 'webgpu-safe',
      requirement:
        'Particles must degrade toward fewer, larger, more legible roles rather than disappearing into mush.',
      budgetNotes: [
        'Prefer role clarity over count.',
        'Avoid building field identity on tiny premium-only detail.'
      ]
    },
    proofRequirements: [
      {
        id: 'particles-quiet',
        label: 'Particle quiet proof',
        description:
          'Quiet fields must feel atmospheric, not decorative or noisy.',
        proofKind: 'quiet'
      },
      {
        id: 'particles-impact',
        label: 'Particle impact proof',
        description:
          'At least one cue family must let particles become a readable authority.',
        proofKind: 'impact'
      },
      {
        id: 'particles-aftermath',
        label: 'Particle aftermath proof',
        description:
          'Aftermath fields must differ from impact spray and remain selective.',
        proofKind: 'aftermath'
      }
    ],
    nextTarget:
      'Assign explicit roles such as weather, offspring, punctuation, residue, and memory echo to particle behavior.',
    nextDependency:
      'Expand ParticleSystem ownership from existence to role-based field logic.',
    blockingDependency:
      'Particles exist, but field roles are not yet explicit enough for graduation or analyzer coverage.',
    graduationTarget: {
      from: 'frontier',
      to: 'flagship',
      gate:
        'Promote only when role-based fields become visibly distinct and safe-tier legible.'
    },
    proofStatus:
      'Particle ownership exists, but role-based authorship and aftermath behavior remain underdefined.',
    lastMeaningfulPass:
      '2026-04-22 anthology-engine runtime intent install and mastery operating system seeding',
    currentBiggestFailureMode:
      'Particles can still read as decorative support instead of a dramatic authority with explicit jobs.'
  },
  {
    id: 'mixed-media-compositor-content',
    label: 'Mixed Media / Compositor / Content',
    category: 'compositor',
    status: 'lab',
    intendedOwnerLane: 'Mixed Media / Compositor / Content',
    runtimeOwnershipStatus: 'legacy-monolith',
    runtimeOwner:
      'Target owner is future compositor/content systems; current runtime only names intent metadata.',
    blockingOwner:
      'CompositorSystem and content ownership do not exist yet.',
    cueRole: 'aftermath-memory',
    quietBehavior: {
      summary:
        'Mixed media should remain absent by default unless it clarifies memory, symbol, or atmosphere.',
      authorityMode:
        'Quiet usage should be sparse enough to feel intentional and authored.',
      roomRead:
        'Masks, symbols, or silhouette injections must read as part of the show language, not pasted overlays.',
      proofSignals: [
        'mixed-media silence is preserved when not needed',
        'quiet usage remains sparse and legible'
      ]
    },
    impactBehavior: {
      summary:
        'Compositor families should enable wipes, scars, glyph reveals, or masked consequence when cues demand more than geometry alone.',
      authorityMode:
        'Mixed media strengthens cue consequence or visual identity without replacing the show grammar.',
      roomRead:
        'Impact compositing changes the whole frame class without turning into collage.',
      proofSignals: [
        'at least one mixed-media family changes cue consequence visibly',
        'compositor spend remains localized and disciplined'
      ]
    },
    aftermathBehavior: {
      summary:
        'Mixed media should support scars, ghosts, symbols, or memory overlays after the hit.',
      authorityMode:
        'Aftermath-only usage is preferred until the vocabulary proves itself.',
      roomRead:
        'Residual overlays should feel like memory or stain, not a second unrelated layer.',
      proofSignals: [
        'aftermath mixed media reads as memory',
        'mixed media never becomes continuous wallpaper'
      ]
    },
    absenceRules: [
      {
        when: 'all cues until the family graduates',
        mustAvoid: 'Frequent or collage-like asset layering',
        reason:
          'Mixed media should enter as disciplined authored language, not novelty accumulation.'
      }
    ],
    safeTierExpectation: {
      targetTier: 'webgpu-safe',
      requirement:
        'Mixed-media operations must degrade toward sparse masks and broad overlays, never brittle premium-only tricks.',
      budgetNotes: [
        'Prefer mask logic and silhouette-level operations over heavy multipass stacks.',
        'Keep asset packs small, intentional, and legally tracked.'
      ]
    },
    proofRequirements: [
      {
        id: 'mixed-media-impact',
        label: 'Mixed-media impact proof',
        description:
          'At least one compositor-backed family must improve cue consequence without collage behavior.',
        proofKind: 'impact'
      },
      {
        id: 'mixed-media-aftermath',
        label: 'Mixed-media aftermath proof',
        description:
          'Mixed-media residues must read as memory, stain, or symbol rather than wallpaper.',
        proofKind: 'aftermath'
      },
      {
        id: 'mixed-media-safe-tier',
        label: 'Mixed-media safe-tier proof',
        description:
          'Compositor-backed language must remain legible and tasteful on webgpu/safe.',
        proofKind: 'safe-tier'
      }
    ],
    nextTarget:
      'Add CompositorSystem, define the first disciplined mask/asset families, and keep mixed media sparse and authored.',
    nextDependency:
      'Complete CompositorSystem and ContentSystem planning before landing any lasting asset-backed family.',
    blockingDependency:
      'There is no runtime owner yet for mixed-media layers, masks, or legality metadata.',
    graduationTarget: {
      from: 'lab',
      to: 'frontier',
      gate:
        'Promote only when the first compositor-backed family proves consequence or memory value without collage failure.'
    },
    proofStatus:
      'Mixed media currently exists only as intent metadata and doctrine; no runtime-backed family has graduated yet.',
    lastMeaningfulPass:
      '2026-04-22 anthology-engine runtime intent install and mastery operating system seeding',
    currentBiggestFailureMode:
      'The family is at risk of becoming collage novelty instead of disciplined show language if it lands before real ownership and proof.'
  },
  {
    id: 'motif-memory',
    label: 'Motif / Memory',
    category: 'memory',
    status: 'lab',
    intendedOwnerLane: 'Motif / Memory',
    runtimeOwnershipStatus: 'legacy-monolith',
    runtimeOwner:
      'Target owner is future MemorySystem; current runtime only names motif and memory state metadata.',
    blockingOwner:
      'MemorySystem and motif recurrence policy do not exist yet.',
    cueRole: 'aftermath-memory',
    quietBehavior: {
      summary:
        'Memory should bias recurrence and absence in quiet passages without making them repetitive.',
      authorityMode:
        'Quiet memory appears as faint recurrence, scar, or altered return.',
      roomRead:
        'Recurrence should feel intentional even if it is subtle.',
      proofSignals: [
        'quiet returns feel authored rather than repeated',
        'motif recurrence remains sparse and noticeable'
      ]
    },
    impactBehavior: {
      summary:
        'Impact cues may plant scars, symbols, or forms that later reappear altered.',
      authorityMode:
        'Memory begins at the moment of consequence rather than as an arbitrary callback.',
      roomRead:
        'The planted motif is memorable enough to recognize later.',
      proofSignals: [
        'at least one impact plants a recognizable motif',
        'the later recurrence is visibly linked to the earlier event'
      ]
    },
    aftermathBehavior: {
      summary:
        'Aftermath is where scars, recollections, and altered revisitation become explicit.',
      authorityMode:
        'Memory can steer what returns next without becoming a fixed preset loop.',
      roomRead:
        'The show visibly remembers itself over minutes, not just frames.',
      proofSignals: [
        'a motif returns altered after the original event',
        'memory affects later frame choices in untouched runs'
      ]
    },
    absenceRules: [
      {
        when: 'repeated musical situations',
        mustAvoid: 'Literal duplication of the same visual answer',
        reason: 'Memory should deepen authorship, not create sameness.'
      }
    ],
    safeTierExpectation: {
      targetTier: 'webgpu-safe',
      requirement:
        'Memory must register through composition, motif, stain, or recurrence rather than relying on fragile premium-only detail.',
      budgetNotes: [
        'Use recognizable structural returns instead of subtle pixel tricks.',
        'Keep scars and recollections bold enough to survive distance.'
      ]
    },
    proofRequirements: [
      {
        id: 'memory-quiet',
        label: 'Memory quiet proof',
        description:
          'Quiet passages must show altered recurrence or absence rather than dead reset.',
        proofKind: 'quiet'
      },
      {
        id: 'memory-aftermath',
        label: 'Memory aftermath proof',
        description:
          'Aftermath must plant or recall motifs that stay understandable over time.',
        proofKind: 'aftermath'
      },
      {
        id: 'memory-no-touch',
        label: 'Memory no-touch proof',
        description:
          'Untouched runs must visibly remember earlier events without operator steering.',
        proofKind: 'no-touch'
      }
    ],
    nextTarget:
      'Add MemorySystem and make recurrence, scars, and altered revisitation explicit runtime behavior.',
    nextDependency:
      'Land MemorySystem after PostSystem and CompositorSystem define where scars and residues live.',
    blockingDependency:
      'There is no runtime owner yet for motif recall, recurrence bias, or scar persistence.',
    graduationTarget: {
      from: 'lab',
      to: 'frontier',
      gate:
        'Promote only when the show visibly remembers itself over time in no-touch proof runs.'
    },
    proofStatus:
      'Memory is currently doctrine and metadata, not yet a runtime-backed family with proof coverage.',
    lastMeaningfulPass:
      '2026-04-22 anthology-engine runtime intent install and mastery operating system seeding',
    currentBiggestFailureMode:
      'Without a real owner, memory can only exist as naming, so repetition still risks reading as sameness.'
  },
  {
    id: 'music-semantics',
    label: 'Music Semantics',
    category: 'music-semantics',
    status: 'frontier',
    intendedOwnerLane: 'Music Semantics / Conductor',
    runtimeOwnershipStatus: 'owned-system',
    runtimeOwner:
      'C:/dev/GitHub/visulive/src/audio/AudioEngine.ts + C:/dev/GitHub/visulive/src/audio/listeningInterpreter.ts + C:/dev/GitHub/visulive/src/types/director.ts',
    blockingOwner:
      'Cue legality and regime hierarchy are stronger, but they still flatten too many situations into one answer.',
    cueRole: 'transition-driver',
    quietBehavior: {
      summary:
        'The conductor should distinguish silence, floor, gather, and held tension instead of forcing wake states.',
      authorityMode:
        'Music semantics decide when the show withholds, gathers, or stays quietly alive.',
      roomRead:
        'Quiet runs should remain coherent because the music semantics are confident enough to stay restrained.',
      proofSignals: [
        'silence dignity improves',
        'quiet room-floor runs stop feeling underdriven or dead'
      ]
    },
    impactBehavior: {
      summary:
        'Different musical character should produce different cue classes and image ontology, not just bigger numbers.',
      authorityMode:
        'Semantics promote or withhold world, hero, motion, and consequence based on phrase meaning.',
      roomRead:
        'Similar energy with different musical structure yields visibly different frame classes.',
      proofSignals: [
        'cue families separate by musical character',
        'false surges and samey drop answers decrease'
      ]
    },
    aftermathBehavior: {
      summary:
        'Release, recovery, and sparse tails should steer aftermath instead of collapsing instantly back to generic generative motion.',
      authorityMode:
        'Semantics should know when to hold, clear, haunt, or recover.',
      roomRead:
        'Aftermath timing feels musically motivated rather than timer-based.',
      proofSignals: [
        'release cues visibly differ from raw drop aftermath',
        'recovery windows stay musically grounded'
      ]
    },
    absenceRules: [
      {
        when: 'all musical situations',
        mustAvoid: 'Reducing semantics to raw energy and raw drops',
        reason:
          'The anthology engine needs musical character, confidence, and recovery truth to diversify the show.'
      }
    ],
    safeTierExpectation: {
      targetTier: 'webgpu-safe',
      requirement:
        'Semantics must preserve show hierarchy without depending on premium-only spectacle to make distinctions visible.',
      budgetNotes: [
        'Prefer cue separation and consequence timing over raw effect density.',
        'Keep silence and recovery states alive even when render budget is constrained.'
      ]
    },
    proofRequirements: [
      {
        id: 'semantics-quiet',
        label: 'Semantics quiet proof',
        description:
          'Silence and sparse-music interpretation must remain authored and compelling.',
        proofKind: 'quiet'
      },
      {
        id: 'semantics-coverage',
        label: 'Semantics coverage proof',
        description:
          'Different musical character must produce different cue families and image classes.',
        proofKind: 'coverage'
      },
      {
        id: 'semantics-aftermath',
        label: 'Semantics aftermath proof',
        description:
          'Release and recovery behavior must remain musically motivated rather than timer-only.',
        proofKind: 'aftermath'
      },
      {
        id: 'semantics-no-touch',
        label: 'Semantics no-touch proof',
        description:
          'Untouched runs must benefit from deeper regime hierarchy without manual steering.',
        proofKind: 'no-touch'
      }
    ],
    nextTarget:
      'Deepen the regime ladder and cue-eligibility model so similar energy no longer collapses into one house answer.',
    nextDependency:
      'Formalize the audio -> regime -> cue -> stage-intent ladder across audio, direction, and runtime.',
    blockingDependency:
      'Audio truth is strong enough to drive the next layer, but cue legality and hierarchy still need deeper separation.',
    graduationTarget: {
      from: 'frontier',
      to: 'flagship',
      gate:
        'Promote only when different musical character reliably produces different image classes in untouched proof runs.'
    },
    proofStatus:
      'Music semantics are materially stronger than before and already owned, but deeper regime hierarchy and cue eligibility remain unfinished.',
    lastMeaningfulPass:
      '2026-04-22 anthology-engine runtime intent install and mastery operating system seeding',
    currentBiggestFailureMode:
      'The show still resolves too many situations into one house answer because regime and cue legality are not yet deep enough.'
  }
] satisfies AnthologyFamilyDeclaration[];

export const anthologyCatalogById = Object.fromEntries(
  anthologyCatalog.map((family) => [family.id, family])
);

export function getAnthologyFamilyDeclaration(id: string) {
  return anthologyCatalogById[id];
}
