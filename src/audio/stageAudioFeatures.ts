import { clamp01 } from './audioMath';
import type { ListeningFrame } from '../types/audio';

export type StageAudioFeatures = {
  tempo: {
    bpm: number;
    lock: number;
    density: number;
  };
  impact: {
    build: number;
    hit: number;
    section: number;
  };
  presence: {
    music: number;
    spatial: number;
    speech: number;
    sourceBias: number;
  };
  texture: {
    brightness: number;
    roughness: number;
    shimmer: number;
  };
  memory: {
    afterglow: number;
    resonance: number;
  };
  stability: {
    tonal: number;
    confidence: number;
    restraint: number;
  };
};

export const DEFAULT_STAGE_AUDIO_FEATURES: StageAudioFeatures = {
  tempo: {
    bpm: 0,
    lock: 0,
    density: 0
  },
  impact: {
    build: 0,
    hit: 0,
    section: 0
  },
  presence: {
    music: 0,
    spatial: 0,
    speech: 0,
    sourceBias: 0
  },
  texture: {
    brightness: 0,
    roughness: 0,
    shimmer: 0
  },
  memory: {
    afterglow: 0,
    resonance: 0
  },
  stability: {
    tonal: 0,
    confidence: 0,
    restraint: 1
  }
};

export function deriveStageAudioFeatures(
  frame: Pick<
    ListeningFrame,
    | 'mode'
    | 'confidence'
    | 'musicConfidence'
    | 'peakConfidence'
    | 'beatConfidence'
    | 'beatIntervalMs'
    | 'beatStability'
    | 'preDropTension'
    | 'dropImpact'
    | 'sectionChange'
    | 'releaseTail'
    | 'phraseTension'
    | 'momentum'
    | 'presence'
    | 'body'
    | 'air'
    | 'brightness'
    | 'roughness'
    | 'shimmer'
    | 'roomness'
    | 'ambienceConfidence'
    | 'speech'
    | 'speechConfidence'
    | 'resonance'
    | 'tonalStability'
    | 'harmonicColor'
    | 'accent'
    | 'transientConfidence'
  >
): StageAudioFeatures {
  const sourceBias =
    frame.mode === 'system-audio' ? 1 : frame.mode === 'hybrid' ? 0.56 : 0.18;
  const speechPresence = clamp01(
    frame.speech * 0.54 + frame.speechConfidence * 0.46
  );
  const beatIntervalMs = Math.max(0, frame.beatIntervalMs);
  const bpm = beatIntervalMs > 0 ? 60000 / Math.max(beatIntervalMs, 1) : 0;
  const bpmNormalized =
    bpm > 0 ? clamp01((Math.min(bpm, 180) - 72) / (180 - 72)) : 0;
  const tempoLock = clamp01(
    frame.beatConfidence * 0.62 + frame.beatStability * 0.38
  );
  const tempoDensity = clamp01(tempoLock * 0.56 + bpmNormalized * 0.44);

  const impactBuild = clamp01(
    frame.preDropTension * 0.46 +
      frame.phraseTension * 0.26 +
      frame.momentum * 0.18 +
      frame.musicConfidence * 0.1
  );
  const impactHit = clamp01(
    frame.dropImpact * 0.58 +
      frame.sectionChange * 0.22 +
      frame.peakConfidence * 0.12 +
      frame.beatConfidence * 0.08
  );
  const impactSection = clamp01(
    frame.sectionChange * 0.54 +
      frame.preDropTension * 0.18 +
      frame.releaseTail * 0.16 +
      frame.peakConfidence * 0.12
  );

  const musicPresence = clamp01(
    frame.musicConfidence * 0.48 +
      frame.body * 0.18 +
      frame.presence * 0.18 +
      sourceBias * 0.16
  );
  const spatialPresence = clamp01(
    frame.roomness * 0.28 +
      frame.ambienceConfidence * 0.24 +
      frame.air * 0.12 +
      frame.resonance * 0.12 +
      sourceBias * 0.16 -
      speechPresence * 0.12
  );

  const textureBrightness = clamp01(
    frame.brightness * 0.68 +
      frame.shimmer * 0.18 +
      frame.harmonicColor * 0.14
  );
  const textureRoughness = clamp01(
    frame.roughness * 0.7 +
      frame.transientConfidence * 0.18 +
      frame.accent * 0.12
  );
  const textureShimmer = clamp01(
    frame.shimmer * 0.66 + frame.air * 0.24 + frame.brightness * 0.1
  );

  const memoryAfterglow = clamp01(
    frame.releaseTail * 0.5 +
      frame.resonance * 0.26 +
      frame.ambienceConfidence * 0.14 +
      frame.roomness * 0.1
  );
  const memoryResonance = clamp01(
    frame.resonance * 0.72 +
      frame.releaseTail * 0.18 +
      frame.phraseTension * 0.1
  );

  const stabilityConfidence = clamp01(
    frame.confidence * 0.46 +
      frame.musicConfidence * 0.22 +
      frame.peakConfidence * 0.1 +
      frame.ambienceConfidence * 0.1 +
      frame.tonalStability * 0.12
  );
  const stabilityRestraint = clamp01(
    frame.tonalStability * 0.34 +
      (1 - impactHit) * 0.24 +
      speechPresence * 0.18 +
      (1 - tempoLock) * 0.12 +
      memoryAfterglow * 0.12
  );

  return {
    tempo: {
      bpm,
      lock: tempoLock,
      density: tempoDensity
    },
    impact: {
      build: impactBuild,
      hit: impactHit,
      section: impactSection
    },
    presence: {
      music: musicPresence,
      spatial: spatialPresence,
      speech: speechPresence,
      sourceBias
    },
    texture: {
      brightness: textureBrightness,
      roughness: textureRoughness,
      shimmer: textureShimmer
    },
    memory: {
      afterglow: memoryAfterglow,
      resonance: memoryResonance
    },
    stability: {
      tonal: frame.tonalStability,
      confidence: stabilityConfidence,
      restraint: stabilityRestraint
    }
  };
}
