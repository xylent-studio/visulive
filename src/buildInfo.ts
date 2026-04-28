export type BuildInfo = {
  version: string;
  commit: string;
  branch: string;
  builtAt: string;
  lane: 'stable' | 'frontier' | 'dev';
  proofStatus: 'unverified' | 'proof-pack' | 'promoted';
  dirty: boolean;
};

declare const __VISULIVE_BUILD__: BuildInfo;

export const BUILD_INFO: BuildInfo =
  typeof __VISULIVE_BUILD__ !== 'undefined'
    ? __VISULIVE_BUILD__
    : {
        version: '1.0.0',
        commit: 'dev',
        branch: 'dev',
        builtAt: '',
        lane: 'dev',
        proofStatus: 'unverified',
        dirty: true
      };

export const BUILD_LABEL = BUILD_INFO.dirty
  ? `${BUILD_INFO.version} [${BUILD_INFO.lane}] (${BUILD_INFO.commit}, ${BUILD_INFO.proofStatus}, dirty)`
  : `${BUILD_INFO.version} [${BUILD_INFO.lane}] (${BUILD_INFO.commit}, ${BUILD_INFO.proofStatus})`;
