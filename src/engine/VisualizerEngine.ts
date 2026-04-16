import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import RenderPipelineImpl from 'three/src/renderers/common/RenderPipeline.js';
import { pass, uniform } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js';
import type { ListeningFrame } from '../types/audio';
import type { RuntimeTuning } from '../types/tuning';
import {
  ObsidianBloomScene,
  type SceneQualityProfile
} from '../scene/ObsidianBloomScene';
import {
  DEFAULT_VISUAL_TELEMETRY,
  type AtmosphereMatterState,
  type VisualTelemetryFrame
} from '../types/visual';

export type RendererBackend = 'webgpu' | 'webgl2-fallback' | 'unavailable';
export type QualityTier = 'safe' | 'balanced' | 'premium';

export type RendererDiagnostics = {
  backend: RendererBackend;
  ready: boolean;
  qualityTier: QualityTier;
  devicePixelRatio: number;
  cappedPixelRatio: number;
  fps: number;
  frameTimeMs: number;
  warnings: string[];
  visualTelemetry: VisualTelemetryFrame;
  error?: string;
};

type RenderPipelineLike = {
  outputNode: unknown;
  render(): void;
  dispose?(): void;
};

type AtmospherePostProfile = {
  dominantState: AtmosphereMatterState;
  gas: number;
  liquid: number;
  plasma: number;
  crystal: number;
  pressure: number;
  ionization: number;
  residue: number;
  structureReveal: number;
  exposureBias: number;
  bloomStrengthBias: number;
  bloomRadiusBias: number;
  bloomThresholdBias: number;
  afterImageBias: number;
  bloomMixRate: number;
  afterImageMixRate: number;
};

const QUALITY_PROFILES: Record<QualityTier, SceneQualityProfile & { dprCap: number }> = {
  safe: {
    tier: 'safe',
    dprCap: 1,
    particleDrawCount: 140,
    particleOpacityMultiplier: 0.9,
    auraOpacityMultiplier: 1.08
  },
  balanced: {
    tier: 'balanced',
    dprCap: 1.2,
    particleDrawCount: 320,
    particleOpacityMultiplier: 0.94,
    auraOpacityMultiplier: 1
  },
  premium: {
    tier: 'premium',
    dprCap: 1.5,
    particleDrawCount: 620,
    particleOpacityMultiplier: 0.96,
    auraOpacityMultiplier: 1.02
  }
};

const POINTER_INTERACTION_ENABLED = false;

export class VisualizerEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly getFrame: () => ListeningFrame;
  private renderer: WebGPURenderer | null = null;
  private sceneRuntime: ObsidianBloomScene | null = null;
  private renderPipeline: RenderPipelineLike | null = null;
  private scenePass: ReturnType<typeof pass> | null = null;
  private bloomPass: ReturnType<typeof bloom> | null = null;
  private afterImagePass:
    | (ReturnType<typeof afterImage> & { dispose?(): void; getTextureNode(): unknown })
    | null = null;
  private afterImageDampNode: { value: number } | null = null;
  private lastTime = 0;
  private backend: RendererBackend = 'unavailable';
  private qualityTier: QualityTier = 'balanced';
  private cappedPixelRatio = 1;
  private frameTimeMs = 16.7;
  private fps = 60;
  private warnings: string[] = [];
  private overBudgetFrames = 0;
  private tuning: RuntimeTuning | null = null;
  private toneMappingExposure = 0.72;
  private latestVisualTelemetry: VisualTelemetryFrame = {
    ...DEFAULT_VISUAL_TELEMETRY
  };
  private resizeHandler = () => {
    this.resize();
  };
  private pointerMoveHandler = (event: PointerEvent) => {
    this.handlePointerMove(event);
  };
  private pointerLeaveHandler = () => {
    this.sceneRuntime?.setPointerInfluence(0, 0);
  };

  constructor(
    canvas: HTMLCanvasElement,
    getFrame: () => ListeningFrame
  ) {
    this.canvas = canvas;
    this.getFrame = getFrame;
  }

  async start(): Promise<RendererDiagnostics> {
    try {
      this.renderer = await this.createRenderer(false);
    } catch {
      try {
        this.renderer = await this.createRenderer(true);
      } catch (error) {
        return {
          backend: 'unavailable',
          ready: false,
          qualityTier: 'safe',
          devicePixelRatio: window.devicePixelRatio,
          cappedPixelRatio: 1,
          fps: 0,
          frameTimeMs: 0,
          warnings: [],
          visualTelemetry: {
            ...DEFAULT_VISUAL_TELEMETRY,
            qualityTier: 'safe'
          },
          error:
            error instanceof Error
              ? error.message
              : 'Renderer initialization failed.'
        };
      }
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.setRendererExposure(this.toneMappingExposure);

    this.qualityTier = this.chooseInitialQualityTier();
    this.sceneRuntime = new ObsidianBloomScene(QUALITY_PROFILES[this.qualityTier]);
    if (this.tuning) {
      this.sceneRuntime.setTuning(this.tuning);
    }
    this.scenePass = pass(this.sceneRuntime.scene, this.sceneRuntime.camera);
    const scenePassColor = this.scenePass.getTextureNode('output');
    this.bloomPass = bloom(scenePassColor, 1.12, 0.3, 0.08);
    this.renderPipeline = new (RenderPipelineImpl as unknown as new (
      renderer: WebGPURenderer
    ) => RenderPipelineLike)(this.renderer);
    const bloomTextureNode = (this.bloomPass as unknown as {
      getTextureNode(): unknown;
    }).getTextureNode();
    const composedSceneNode = (scenePassColor as unknown as {
      add(value: unknown): unknown;
    }).add(bloomTextureNode);
    this.afterImageDampNode = uniform(0.78) as unknown as { value: number };
    this.afterImagePass = afterImage(
      composedSceneNode as never,
      this.afterImageDampNode as never
    ) as ReturnType<typeof afterImage> & {
      dispose?(): void;
      getTextureNode(): unknown;
    };
    this.renderPipeline.outputNode = this.afterImagePass.getTextureNode();
    this.applyQualityProfile(this.qualityTier);
    this.resize();
    window.addEventListener('resize', this.resizeHandler);
    if (POINTER_INTERACTION_ENABLED) {
      this.canvas.addEventListener('pointermove', this.pointerMoveHandler);
      this.canvas.addEventListener('pointerleave', this.pointerLeaveHandler);
    } else {
      this.sceneRuntime.setPointerInfluence(0, 0);
    }

    await this.renderer.setAnimationLoop((time) => {
      this.renderFrame(time);
    });

    return this.getDiagnostics();
  }

  getDiagnostics(): RendererDiagnostics {
    return {
      backend: this.backend,
      ready: this.renderer !== null && this.sceneRuntime !== null,
      qualityTier: this.qualityTier,
      devicePixelRatio: window.devicePixelRatio,
      cappedPixelRatio: this.cappedPixelRatio,
      fps: this.fps,
      frameTimeMs: this.frameTimeMs,
      warnings: [...this.warnings],
      visualTelemetry: {
        ...this.latestVisualTelemetry,
        macroEventsActive: [...this.latestVisualTelemetry.macroEventsActive],
        temporalWindows: { ...this.latestVisualTelemetry.temporalWindows }
      }
    };
  }

  setTuning(tuning: RuntimeTuning): void {
    this.tuning = tuning;
    this.sceneRuntime?.setTuning(tuning);
  }

  dispose(): void {
    window.removeEventListener('resize', this.resizeHandler);
    if (POINTER_INTERACTION_ENABLED) {
      this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
      this.canvas.removeEventListener('pointerleave', this.pointerLeaveHandler);
    }

    if (this.renderer) {
      void this.renderer.setAnimationLoop(null);
      this.renderer.dispose();
    }

    this.sceneRuntime?.dispose();
    this.afterImagePass?.dispose?.();
    this.renderPipeline?.dispose?.();
    this.renderer = null;
    this.sceneRuntime = null;
    this.renderPipeline = null;
    this.scenePass = null;
    this.bloomPass = null;
    this.afterImagePass = null;
    this.afterImageDampNode = null;
    this.lastTime = 0;
    this.backend = 'unavailable';
    this.qualityTier = 'balanced';
    this.cappedPixelRatio = 1;
    this.frameTimeMs = 16.7;
    this.fps = 60;
    this.warnings = [];
    this.overBudgetFrames = 0;
    this.toneMappingExposure = 0.72;
    this.latestVisualTelemetry = {
      ...DEFAULT_VISUAL_TELEMETRY,
      qualityTier: 'balanced'
    };
  }

  private async createRenderer(forceWebGL: boolean): Promise<WebGPURenderer> {
    const renderer = new WebGPURenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      forceWebGL
    });

    await renderer.init();

    const context = renderer.getContext();

    this.backend =
      typeof WebGL2RenderingContext !== 'undefined' &&
      context instanceof WebGL2RenderingContext
        ? 'webgl2-fallback'
        : 'webgpu';

    return renderer;
  }

  private chooseInitialQualityTier(): QualityTier {
    const deviceMemory = navigator.deviceMemory ?? 8;
    const hardwareConcurrency = navigator.hardwareConcurrency ?? 8;

    if (this.backend === 'webgl2-fallback') {
      return 'safe';
    }

    if (deviceMemory <= 4 && hardwareConcurrency <= 4) {
      return 'safe';
    }

    if (deviceMemory <= 8 || hardwareConcurrency <= 8) {
      return 'balanced';
    }

    return 'premium';
  }

  private applyQualityProfile(tier: QualityTier): void {
    if (!this.renderer || !this.sceneRuntime) {
      return;
    }

    const profile = QUALITY_PROFILES[tier];

    this.qualityTier = tier;
    this.cappedPixelRatio = Math.min(window.devicePixelRatio, profile.dprCap);
    this.renderer.setPixelRatio(this.cappedPixelRatio);
    this.sceneRuntime.setQualityProfile(profile);
    this.latestVisualTelemetry.qualityTier = tier;
    this.refreshWarnings();
  }

  private refreshWarnings(): void {
    const warnings: string[] = [];

    if (this.backend === 'webgl2-fallback') {
      warnings.push('WebGPU is unavailable; WebGL2 fallback is active.');
    }

    if (this.qualityTier !== 'premium') {
      warnings.push(
        `Quality governor is active at ${this.qualityTier} tier to protect frame pacing.`
      );
    }

    if (this.cappedPixelRatio < window.devicePixelRatio) {
      warnings.push(
        `Device pixel ratio is capped at ${this.cappedPixelRatio.toFixed(2)}.`
      );
    }

    this.warnings = warnings;
  }

  private degradeQuality(): void {
    if (this.qualityTier === 'safe') {
      return;
    }

    if (
      this.qualityTier === 'balanced' &&
      this.backend !== 'webgl2-fallback' &&
      this.frameTimeMs < 31.5
    ) {
      this.overBudgetFrames = 0;
      return;
    }

    const nextTier =
      this.qualityTier === 'premium' ? 'balanced' : 'safe';
    this.applyQualityProfile(nextTier);
    this.warnings.push(
      `Quality guardrail lowered the scene to ${nextTier} to hold stable frame pacing.`
    );
    this.overBudgetFrames = 0;
  }

  private resize(): void {
    if (!this.renderer || !this.sceneRuntime) {
      return;
    }

    const width = Math.max(this.canvas.clientWidth, window.innerWidth);
    const height = Math.max(this.canvas.clientHeight, window.innerHeight);

    this.renderer.setSize(width, height, false);
    this.sceneRuntime.resize(width, height);
  }

  private deriveAtmospherePostProfile(
    sceneTelemetry: VisualTelemetryFrame
  ): AtmospherePostProfile {
    const gasRaw = Math.max(0, sceneTelemetry.atmosphereGas ?? 1);
    const liquidRaw = Math.max(0, sceneTelemetry.atmosphereLiquid ?? 0);
    const plasmaRaw = Math.max(0, sceneTelemetry.atmospherePlasma ?? 0);
    const crystalRaw = Math.max(0, sceneTelemetry.atmosphereCrystal ?? 0);
    const total = gasRaw + liquidRaw + plasmaRaw + crystalRaw;
    const gas = total > 0.0001 ? gasRaw / total : 1;
    const liquid = total > 0.0001 ? liquidRaw / total : 0;
    const plasma = total > 0.0001 ? plasmaRaw / total : 0;
    const crystal = total > 0.0001 ? crystalRaw / total : 0;
    const pressure = THREE.MathUtils.clamp(
      sceneTelemetry.atmospherePressure ?? 0,
      0,
      1.5
    );
    const ionization = THREE.MathUtils.clamp(
      sceneTelemetry.atmosphereIonization ?? 0,
      0,
      1.4
    );
    const residue = THREE.MathUtils.clamp(
      sceneTelemetry.atmosphereResidue ?? 0,
      0,
      1.3
    );
    const structureReveal = THREE.MathUtils.clamp(
      sceneTelemetry.atmosphereStructureReveal ?? 0,
      0,
      1.25
    );
    const dominantState =
      sceneTelemetry.atmosphereMatterState ??
      (plasma >= crystal && plasma >= liquid && plasma >= gas
        ? 'plasma'
        : crystal >= liquid && crystal >= gas
          ? 'crystal'
          : liquid >= gas
            ? 'liquid'
            : 'gas');

    return {
      dominantState,
      gas,
      liquid,
      plasma,
      crystal,
      pressure,
      ionization,
      residue,
      structureReveal,
      exposureBias:
        gas * -0.024 +
        liquid * -0.008 +
        plasma * 0.018 +
        crystal * -0.004 -
        pressure * 0.028 -
        structureReveal * 0.014 +
        ionization * 0.014 +
        residue * -0.006,
      bloomStrengthBias:
        gas * -0.05 +
        liquid * 0.03 +
        plasma * 0.16 +
        crystal * -0.035 -
        pressure * 0.032 +
        ionization * 0.11 +
        residue * 0.03 +
        structureReveal * 0.048,
      bloomRadiusBias:
        gas * 0.042 +
        liquid * 0.055 +
        plasma * 0.006 +
        crystal * -0.052 +
        pressure * 0.022 +
        residue * 0.034 -
        structureReveal * 0.028,
      bloomThresholdBias:
        gas * 0.028 +
        liquid * -0.008 +
        plasma * -0.058 +
        crystal * 0.052 +
        pressure * 0.016 -
        ionization * 0.042 -
        residue * 0.01 +
        structureReveal * 0.048,
      afterImageBias:
        gas * 0.062 +
        liquid * 0.024 +
        plasma * -0.02 +
        crystal * 0.036 +
        pressure * 0.016 -
        ionization * 0.026 +
        residue * 0.086 +
        structureReveal * 0.03,
      bloomMixRate: THREE.MathUtils.clamp(
        2.5 +
          gas * -0.25 +
          liquid * 0.2 +
          plasma * 1.05 +
          crystal * 0.5 +
          ionization * 0.5,
        2.1,
        4.8
      ),
      afterImageMixRate: THREE.MathUtils.clamp(
        1.95 +
          gas * -0.35 +
          liquid * 0.18 +
          plasma * 0.82 +
          crystal * 0.38 +
          structureReveal * 0.24,
        1.5,
        3.5
      )
    };
  }

  private renderFrame(time: number): void {
    if (!this.renderer || !this.sceneRuntime) {
      return;
    }

    const elapsedSeconds = time * 0.001;
    const deltaSeconds =
      this.lastTime === 0 ? 0.016 : Math.max(0.001, elapsedSeconds - this.lastTime);
    const deltaMs = deltaSeconds * 1000;

    this.lastTime = elapsedSeconds;
    this.frameTimeMs = this.frameTimeMs * 0.92 + deltaMs * 0.08;
    this.fps = 1000 / Math.max(this.frameTimeMs, 1);

    if (this.frameTimeMs > 27.5) {
      this.overBudgetFrames += 1;

      if (this.overBudgetFrames > 240) {
        this.degradeQuality();
      }
    } else {
      this.overBudgetFrames = Math.max(0, this.overBudgetFrames - 2);
    }

    const frame = this.getFrame();
    this.sceneRuntime.update(frame, elapsedSeconds, deltaSeconds);
    const sceneTelemetry = this.sceneRuntime.getVisualTelemetry();
    const atmospherePostProfile = this.deriveAtmospherePostProfile(sceneTelemetry);
    const exposureCeiling = sceneTelemetry.stageExposureCeiling ?? 0.98;
    const washoutSuppression = sceneTelemetry.stageWashoutSuppression ?? 0;
    const screenEffectFamily = sceneTelemetry.stageScreenEffectFamily ?? 'none';
    const screenEffectIntensity = sceneTelemetry.stageScreenEffectIntensity ?? 0;
    const directionalBias = sceneTelemetry.stageScreenEffectDirectionalBias ?? 0;
    const memoryBias = sceneTelemetry.stageScreenEffectMemoryBias ?? 0;
    const carveBias = sceneTelemetry.stageScreenEffectCarveBias ?? 0;
    const cueFamily = sceneTelemetry.stageCueFamily ?? 'brood';
    const worldMode = sceneTelemetry.stageWorldMode ?? 'hold';
    const shotClass = sceneTelemetry.stageShotClass ?? 'anchor';
    const structuralContrast =
      (worldMode === 'ghost-chamber' ? 0.16 : 0) +
      (worldMode === 'collapse-well' ? 0.24 : 0) +
      (cueFamily === 'haunt' ? 0.12 : 0) +
      (cueFamily === 'release' ? 0.08 : 0) +
      (screenEffectFamily === 'carve' ? 0.16 : 0) +
      (screenEffectFamily === 'impact-memory' ? 0.1 : 0) +
      (shotClass === 'worldTakeover' ? 0.1 : 0);
    const prismaticLift =
      (worldMode === 'fan-sweep' ? 0.14 : 0) +
      (worldMode === 'field-bloom' ? 0.08 : 0) +
      (cueFamily === 'reveal' ? 0.08 : 0) +
      (cueFamily === 'gather' ? 0.06 : 0) +
      screenEffectIntensity * 0.08;
    const additivePressure = THREE.MathUtils.clamp(
      Math.max(0, sceneTelemetry.heroGlowSpend - 0.96) +
        Math.max(0, sceneTelemetry.worldGlowSpend - 0.88) +
        Math.max(0, sceneTelemetry.shellGlowSpend - 0.82),
      0,
      1.8
    );
    const screenExposureBias =
      (screenEffectFamily === 'stain' ? 0.016 : 0) +
      (screenEffectFamily === 'wipe' ? 0.012 : 0) +
      (screenEffectFamily === 'impact-memory' ? 0.008 : 0) -
      carveBias * 0.032 -
      (screenEffectFamily === 'carve' ? 0.022 : 0) -
      directionalBias * 0.012 +
      screenEffectIntensity * 0.018;
    const exposureFloor = THREE.MathUtils.clamp(
      0.6 +
        prismaticLift * 0.04 -
        structuralContrast * 0.06 +
        atmospherePostProfile.gas * -0.012 +
        atmospherePostProfile.plasma * 0.008 -
        atmospherePostProfile.pressure * 0.012,
      0.52,
      0.68
    );
    const dynamicExposureCeiling = THREE.MathUtils.clamp(
      exposureCeiling +
        prismaticLift * 0.04 -
        structuralContrast * 0.08 +
        atmospherePostProfile.plasma * 0.012 -
        atmospherePostProfile.pressure * 0.018 -
        atmospherePostProfile.structureReveal * 0.01,
      exposureFloor + 0.06,
      0.98
    );
    const targetExposure = THREE.MathUtils.clamp(
      0.69 +
        (this.tuning?.radiance ?? 0.8) * 0.03 +
        sceneTelemetry.ambientGlowBudget * 0.006 +
        sceneTelemetry.eventGlowBudget * 0.22 +
        frame.dropImpact * 0.1 +
        frame.sectionChange * 0.05 +
        frame.releaseTail * 0.024 -
        frame.ambienceConfidence * 0.04 -
        additivePressure * (0.05 + washoutSuppression * 0.08) -
        washoutSuppression * 0.04 +
        prismaticLift * 0.03 -
        structuralContrast * 0.06 +
        screenExposureBias +
        atmospherePostProfile.exposureBias,
      exposureFloor,
      dynamicExposureCeiling
    );
    const exposureMix = 1 - Math.exp(-deltaSeconds * 2.6);

    this.toneMappingExposure +=
      (targetExposure - this.toneMappingExposure) * exposureMix;
    this.setRendererExposure(this.toneMappingExposure);
    this.updateBloom(frame, sceneTelemetry, atmospherePostProfile, deltaSeconds);
    this.updateAfterImage(frame, sceneTelemetry, atmospherePostProfile, deltaSeconds);
    this.sceneRuntime.setPostTelemetry({
      qualityTier: this.qualityTier,
      exposure: this.toneMappingExposure,
      bloomStrength: this.bloomPass?.strength.value ?? 0,
      bloomThreshold: this.bloomPass?.threshold.value ?? 0.2,
      bloomRadius: this.bloomPass?.radius.value ?? DEFAULT_VISUAL_TELEMETRY.bloomRadius,
      afterImageDamp: this.afterImageDampNode?.value
    });
    this.latestVisualTelemetry = this.sceneRuntime.getVisualTelemetry();
    if (this.renderPipeline) {
      this.renderPipeline.render();
    } else {
      this.renderer.render(this.sceneRuntime.scene, this.sceneRuntime.camera);
    }
  }

  private updateBloom(
    frame: ListeningFrame,
    sceneTelemetry: VisualTelemetryFrame,
    atmospherePostProfile: AtmospherePostProfile,
    deltaSeconds: number
  ): void {
    if (!this.bloomPass) {
      return;
    }

    const bloomCeiling = sceneTelemetry.stageBloomCeiling ?? 1.25;
    const washoutSuppression = sceneTelemetry.stageWashoutSuppression ?? 0;
    const peakSpend = sceneTelemetry.stageSpendProfile === 'peak' ? 1 : 0;
    const screenEffectFamily = sceneTelemetry.stageScreenEffectFamily ?? 'none';
    const screenEffectIntensity = sceneTelemetry.stageScreenEffectIntensity ?? 0;
    const directionalBias = sceneTelemetry.stageScreenEffectDirectionalBias ?? 0;
    const memoryBias = sceneTelemetry.stageScreenEffectMemoryBias ?? 0;
    const carveBias = sceneTelemetry.stageScreenEffectCarveBias ?? 0;
    const cueFamily = sceneTelemetry.stageCueFamily ?? 'brood';
    const worldMode = sceneTelemetry.stageWorldMode ?? 'hold';
    const shotClass = sceneTelemetry.stageShotClass ?? 'anchor';
    const structuralContrast =
      (worldMode === 'ghost-chamber' ? 0.16 : 0) +
      (worldMode === 'collapse-well' ? 0.22 : 0) +
      (cueFamily === 'haunt' ? 0.12 : 0) +
      (cueFamily === 'release' ? 0.08 : 0) +
      (screenEffectFamily === 'carve' ? 0.14 : 0) +
      (shotClass === 'worldTakeover' ? 0.08 : 0);
    const prismaticLift =
      (worldMode === 'fan-sweep' ? 0.16 : 0) +
      (worldMode === 'field-bloom' ? 0.08 : 0) +
      (cueFamily === 'reveal' ? 0.08 : 0) +
      (cueFamily === 'gather' ? 0.06 : 0) +
      screenEffectIntensity * 0.08;
    const additivePressure = THREE.MathUtils.clamp(
      Math.max(0, sceneTelemetry.heroGlowSpend - 0.96) +
        Math.max(0, sceneTelemetry.worldGlowSpend - 0.88) +
        Math.max(0, sceneTelemetry.shellGlowSpend - 0.82),
      0,
      1.8
    );
    const suppression =
      washoutSuppression * (0.24 + additivePressure * 0.32 + peakSpend * 0.08);
    const bloomFamilyLift =
      (screenEffectFamily === 'residue' ? 0.12 : 0) +
      (screenEffectFamily === 'stain' ? 0.16 : 0) +
      (screenEffectFamily === 'wipe' ? 0.08 : 0) +
      (screenEffectFamily === 'impact-memory' ? 0.1 : 0) +
      (screenEffectFamily === 'directional-afterimage' ? 0.06 : 0) -
      carveBias * 0.18 -
      (screenEffectFamily === 'carve' ? 0.12 : 0);
    const strengthTarget = THREE.MathUtils.clamp(
      0.01 +
        sceneTelemetry.ambientGlowBudget * 0.02 +
        sceneTelemetry.eventGlowBudget * 1.28 +
        frame.dropImpact * 0.38 +
        frame.sectionChange * 0.18 +
        frame.releaseTail * 0.06 +
        sceneTelemetry.temporalWindows.beatStrike * 0.1 +
        sceneTelemetry.temporalWindows.phraseResolve * 0.14 -
        suppression * 0.72 +
        prismaticLift * 0.12 -
        structuralContrast * 0.18 +
        bloomFamilyLift * (0.28 + screenEffectIntensity * 0.42) +
        atmospherePostProfile.bloomStrengthBias,
      0.01,
      bloomCeiling
    );
    const radiusTarget = THREE.MathUtils.clamp(
      0.1 +
        sceneTelemetry.ambientGlowBudget * 0.02 +
        sceneTelemetry.eventGlowBudget * 0.12 +
        frame.releaseTail * 0.06 +
        frame.dropImpact * 0.08 +
        directionalBias * 0.07 +
        memoryBias * 0.03 +
        prismaticLift * 0.04 -
        structuralContrast * 0.04 +
        screenEffectIntensity * 0.04 -
        suppression * 0.06 +
        atmospherePostProfile.bloomRadiusBias,
      0.1,
      0.3
    );
    const thresholdTarget = THREE.MathUtils.clamp(
      0.38 -
        sceneTelemetry.eventGlowBudget * 0.12 -
        sceneTelemetry.temporalWindows.beatStrike * 0.05 -
        sceneTelemetry.temporalWindows.phraseResolve * 0.03 +
        sceneTelemetry.ambientGlowBudget * 0.04 +
        frame.ambienceConfidence * 0.04 +
        suppression * 0.14 +
        structuralContrast * 0.08 -
        prismaticLift * 0.04 +
        carveBias * 0.08 +
        (screenEffectFamily === 'carve' ? 0.05 : 0) -
        screenEffectIntensity * 0.04 -
        memoryBias * 0.02 +
        atmospherePostProfile.bloomThresholdBias,
      0.26,
      0.54
    );
    const mix = 1 - Math.exp(-deltaSeconds * atmospherePostProfile.bloomMixRate);

    this.bloomPass.strength.value +=
      (strengthTarget - this.bloomPass.strength.value) * mix;
    this.bloomPass.radius.value +=
      (radiusTarget - this.bloomPass.radius.value) * mix;
    this.bloomPass.threshold.value +=
      (thresholdTarget - this.bloomPass.threshold.value) * mix;
  }

  private updateAfterImage(
    frame: ListeningFrame,
    sceneTelemetry: VisualTelemetryFrame,
    atmospherePostProfile: AtmospherePostProfile,
    deltaSeconds: number
  ): void {
    if (!this.afterImageDampNode) {
      return;
    }

    const cueClass = sceneTelemetry.cueClass ?? 'brood';
    const residueWeight = sceneTelemetry.cueResidueWeight ?? 0;
    const screenWeight = sceneTelemetry.cueScreenWeight ?? 0;
    const compositorMode = sceneTelemetry.stageCompositorMode ?? 'none';
    const residueMode = sceneTelemetry.stageResidueMode ?? 'none';
    const washoutSuppression = sceneTelemetry.stageWashoutSuppression ?? 0;
    const screenEffectFamily = sceneTelemetry.stageScreenEffectFamily ?? 'none';
    const screenEffectIntensity = sceneTelemetry.stageScreenEffectIntensity ?? 0;
    const directionalBias = sceneTelemetry.stageScreenEffectDirectionalBias ?? 0;
    const memoryBias = sceneTelemetry.stageScreenEffectMemoryBias ?? 0;
    const carveBias = sceneTelemetry.stageScreenEffectCarveBias ?? 0;
    const cueFamily = sceneTelemetry.stageCueFamily ?? 'brood';
    const worldMode = sceneTelemetry.stageWorldMode ?? 'hold';
    const structuralContrast =
      (worldMode === 'ghost-chamber' ? 0.14 : 0) +
      (worldMode === 'collapse-well' ? 0.18 : 0) +
      (cueFamily === 'haunt' ? 0.12 : 0) +
      (cueFamily === 'release' ? 0.06 : 0);
    const prismaticLift =
      (worldMode === 'fan-sweep' ? 0.14 : 0) +
      (cueFamily === 'reveal' ? 0.08 : 0) +
      (cueFamily === 'gather' ? 0.06 : 0);
    const screenPersistenceLift =
      memoryBias * 0.08 +
      directionalBias * 0.05 +
      (screenEffectFamily === 'directional-afterimage' ? 0.05 : 0) +
      (screenEffectFamily === 'impact-memory' ? 0.06 : 0) +
      (screenEffectFamily === 'residue' ? 0.04 : 0) +
      (screenEffectFamily === 'stain' ? 0.03 : 0) -
      carveBias * 0.06 -
      (screenEffectFamily === 'carve' ? 0.04 : 0);
    const targetDamp = THREE.MathUtils.clamp(
      0.72 +
        residueWeight * 0.16 +
        screenWeight * 0.04 +
        frame.releaseTail * 0.05 +
        sceneTelemetry.temporalWindows.phraseResolve * 0.04 +
        (compositorMode === 'afterimage' ? 0.03 : 0) +
        (compositorMode === 'scar' ? 0.02 : 0) +
        (residueMode === 'ghost' ? 0.03 : 0) +
        (residueMode === 'afterglow' ? 0.02 : 0) +
        (residueMode === 'clear' ? -0.05 : 0) +
        (cueClass === 'haunt' ? 0.03 : 0) +
        (cueClass === 'afterglow' ? 0.02 : 0) -
        frame.dropImpact * 0.02 +
        washoutSuppression * 0.02 +
        prismaticLift * 0.02 +
        structuralContrast * 0.04 +
        screenPersistenceLift * (0.4 + screenEffectIntensity * 0.5) +
        atmospherePostProfile.afterImageBias,
      0.72,
      0.94
    );
    const mix = 1 - Math.exp(-deltaSeconds * atmospherePostProfile.afterImageMixRate);

    this.afterImageDampNode.value +=
      (targetDamp - this.afterImageDampNode.value) * mix;
  }

  private setRendererExposure(exposure: number): void {
    if (!this.renderer) {
      return;
    }

    const rendererWithExposure = this.renderer as WebGPURenderer & {
      toneMappingExposure?: number;
    };

    rendererWithExposure.toneMappingExposure = exposure;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.sceneRuntime) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

    this.sceneRuntime.setPointerInfluence(x, y);
  }
}
