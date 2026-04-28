export const anthologyFamilyCategories = [
  'hero',
  'world',
  'consequence',
  'lighting',
  'particles',
  'compositor',
  'memory',
  'music-semantics'
] as const;

export type AnthologyFamilyCategory =
  (typeof anthologyFamilyCategories)[number];

export const anthologyFamilyStatuses = [
  'lab',
  'frontier',
  'flagship',
  'retired'
] as const;

export type AnthologyFamilyStatus = (typeof anthologyFamilyStatuses)[number];

export const runtimeOwnershipStatuses = [
  'legacy-monolith',
  'partial-system',
  'owned-system'
] as const;

export type RuntimeOwnershipStatus =
  (typeof runtimeOwnershipStatuses)[number];

export const anthologyOwnerLanes = [
  'Hero Ecology',
  'World Grammar / Mutation',
  'Consequence / Aftermath / Post',
  'Lighting / Cinematography',
  'Particles / Fields',
  'Mixed Media / Compositor / Content',
  'Motif / Memory',
  'Music Semantics / Conductor',
  'Evidence / Proof / Analyzer',
  'Operator UX / Trust',
  'Runtime / Ownership Extraction'
] as const;

export type AnthologyOwnerLane = (typeof anthologyOwnerLanes)[number];

export const anthologyCueRoles = [
  'dominant-authority',
  'world-authority',
  'transition-driver',
  'quiet-anchor',
  'aftermath-memory',
  'supporting-authority'
] as const;

export type AnthologyCueRole = (typeof anthologyCueRoles)[number];

export type AnthologyFamilyId = string;

export type AnthologyBehaviorProfile = {
  summary: string;
  authorityMode: string;
  roomRead: string;
  proofSignals: string[];
};

export type AnthologyAbsenceRule = {
  when: string;
  mustAvoid: string;
  reason: string;
};

export type AnthologySafeTierExpectation = {
  targetTier: 'webgpu-safe';
  requirement: string;
  budgetNotes: string[];
};

export type AnthologyProofRequirement = {
  id: string;
  label: string;
  description: string;
  proofKind:
    | 'quiet'
    | 'impact'
    | 'aftermath'
    | 'safe-tier'
    | 'no-touch'
    | 'coverage';
};

export type AnthologyGraduationTarget = {
  from: AnthologyFamilyStatus;
  to: AnthologyFamilyStatus;
  gate: string;
};

export interface AnthologyFamilyDeclaration {
  id: AnthologyFamilyId;
  label: string;
  category: AnthologyFamilyCategory;
  status: AnthologyFamilyStatus;
  intendedOwnerLane: AnthologyOwnerLane;
  runtimeOwnershipStatus: RuntimeOwnershipStatus;
  runtimeOwner: string;
  blockingOwner?: string;
  cueRole: AnthologyCueRole;
  quietBehavior: AnthologyBehaviorProfile;
  impactBehavior: AnthologyBehaviorProfile;
  aftermathBehavior: AnthologyBehaviorProfile;
  absenceRules: AnthologyAbsenceRule[];
  safeTierExpectation: AnthologySafeTierExpectation;
  proofRequirements: AnthologyProofRequirement[];
  nextTarget: string;
  nextDependency: string;
  blockingDependency: string;
  graduationTarget: AnthologyGraduationTarget;
  proofStatus: string;
  lastMeaningfulPass: string;
  currentBiggestFailureMode: string;
}
