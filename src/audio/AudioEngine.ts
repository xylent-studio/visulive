import {
  clamp01,
  summarizeCalibrationSamples,
  updateAdaptiveCeiling,
  updateAdaptiveNoiseFloor
} from './audioMath';
import { ListeningInterpreter } from './listeningInterpreter';
import { SourceHintInterpreter } from './sourceHintInterpreter';
import {
  createSilentSpectrumFrame,
  deriveSpectrumBaseline,
  deriveSpectrumFrame,
  type SpectrumBaseline
} from './spectrumBands';
import {
  buildMicSupportWarnings,
  evaluateMicTruth,
  extractAppliedTrackSettings
} from './audioTruth';
import {
  DEFAULT_ANALYSIS_FRAME,
  DEFAULT_AUDIO_DIAGNOSTICS,
  DEFAULT_AUDIO_STATUS,
  DEFAULT_LISTENING_FRAME,
  DEFAULT_SOURCE_DESCRIPTOR,
  DEFAULT_SUPPORTED_MIC_CONSTRAINTS,
  REQUESTED_MIC_CONSTRAINTS,
  type AnalysisFrame,
  type AppliedDisplayTrackSettings,
  type AppliedMicTrackSettings,
  type AudioDiagnostics,
  type AudioSnapshot,
  type AudioEngineStatus,
  type ListeningFrame,
  type ListeningMode,
  type ListeningSource,
  type SourceHintRuntimeMode,
  type SpectrumFrame,
  type SourceDescriptor,
  type SupportedMicConstraints
} from '../types/audio';
import {
  DEFAULT_RUNTIME_TUNING,
  type RuntimeTuning
} from '../types/tuning';

type DisplayMediaAudioConstraints = MediaTrackConstraints & {
  suppressLocalAudioPlayback?: boolean;
  restrictOwnAudio?: boolean;
};

type ExtendedDisplayMediaStreamOptions = DisplayMediaStreamOptions & {
  systemAudio?: 'include' | 'exclude';
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  monitorTypeSurfaces?: 'include' | 'exclude';
  preferCurrentTab?: boolean;
  audio?: DisplayMediaAudioConstraints | boolean;
};

const CALIBRATION_MS = 2400;

export class AudioEngine implements ListeningSource {
  private status = DEFAULT_AUDIO_STATUS;
  private latestFrame = DEFAULT_LISTENING_FRAME;
  private latestAnalysisFrame = DEFAULT_ANALYSIS_FRAME;
  private diagnostics = DEFAULT_AUDIO_DIAGNOSTICS;
  private readonly interpreter = new ListeningInterpreter();
  private readonly sourceHintInterpreter = new SourceHintInterpreter();
  private readonly sourceHintMode: SourceHintRuntimeMode = 'active';
  private listeners = new Set<(status: AudioEngineStatus) => void>();
  private frameListeners = new Set<(snapshot: AudioSnapshot) => void>();
  private context: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private displayStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private displaySource: MediaStreamAudioSourceNode | null = null;
  private worklet: AudioWorkletNode | null = null;
  private analyser: AnalyserNode | null = null;
  private silentGain: GainNode | null = null;
  private frequencyData: Float32Array | null = null;
  private analysisFrameId = 0;
  private calibrationStartedAt = 0;
  private calibrationEndsAt = 0;
  private calibrationRms: number[] = [];
  private calibrationPeaks: number[] = [];
  private calibrationSpectrumFrames: SpectrumFrame[] = [];
  private previousSpectrumFrame: SpectrumFrame | null = null;
  private spectrumBaseline: SpectrumBaseline = {};
  private noiseFloor = 0.02;
  private calibrationNoiseFloor = 0.02;
  private minimumCeiling = 0.06;
  private calibrationPeak = 0.06;
  private adaptiveCeiling = 0.06;
  private calibrationDurationMs = 0;
  private calibrationSampleCount = 0;
  private calibrationRmsPercentile20 = 0;
  private calibrationPeakPercentile90 = 0;
  private sourceMode: ListeningMode = 'room-mic';
  private sourceDescriptor: SourceDescriptor = DEFAULT_SOURCE_DESCRIPTOR;
  private availableInputs: SourceDescriptor[] = [DEFAULT_SOURCE_DESCRIPTOR];
  private preferredInputId: string | null = null;
  private selectedInputId: string | null = null;
  private supportedConstraints = DEFAULT_SUPPORTED_MIC_CONSTRAINTS;
  private appliedTrackSettings: AppliedMicTrackSettings | null = null;
  private appliedDisplayTrackSettings: AppliedDisplayTrackSettings | null = null;
  private displayTrackLabel: string | null = null;
  private displayAudioGranted = false;
  private rawPathGranted = false;
  private staticWarnings: string[] = [];
  private bootStep = 'idle';
  private tuning = DEFAULT_RUNTIME_TUNING;
  private workletPacket: AnalysisFrame = DEFAULT_ANALYSIS_FRAME;
  private isTearingDown = false;

  subscribe(listener: (status: AudioEngineStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);

    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeFrames(listener: (snapshot: AudioSnapshot) => void): () => void {
    this.frameListeners.add(listener);

    return () => {
      this.frameListeners.delete(listener);
    };
  }

  getStatus(): AudioEngineStatus {
    return this.status;
  }

  getLatestFrame(): ListeningFrame {
    return this.latestFrame;
  }

  getAnalysisFrame(): AnalysisFrame {
    return this.latestAnalysisFrame;
  }

  getDiagnostics(): AudioDiagnostics {
    return this.diagnostics;
  }

  getAvailableInputs(): SourceDescriptor[] {
    return this.availableInputs;
  }

  getSelectedInputId(): string | null {
    return this.selectedInputId;
  }

  getSourceMode(): ListeningMode {
    return this.sourceMode;
  }

  setTuning(tuning: RuntimeTuning): void {
    this.tuning = tuning;
  }

  async setSourceMode(mode: ListeningMode): Promise<void> {
    this.sourceMode = mode;

    if (
      this.status.phase === 'requesting-permission' ||
      this.status.phase === 'booting' ||
      this.status.phase === 'calibrating' ||
      this.status.phase === 'live'
    ) {
      await this.restart();
      return;
    }

    await this.refreshAvailableInputs();
  }

  async setInputDevice(deviceId: string | null): Promise<void> {
    this.preferredInputId = deviceId || null;
    this.selectedInputId = deviceId || null;

    if (
      this.status.phase === 'requesting-permission' ||
      this.status.phase === 'booting' ||
      this.status.phase === 'calibrating' ||
      this.status.phase === 'live'
    ) {
      await this.restart();
      return;
    }

    await this.refreshAvailableInputs();
  }

  async restart(): Promise<void> {
    this.latestFrame = DEFAULT_LISTENING_FRAME;
    this.latestAnalysisFrame = DEFAULT_ANALYSIS_FRAME;
    this.diagnostics = DEFAULT_AUDIO_DIAGNOSTICS;
    this.updateStatus(DEFAULT_AUDIO_STATUS);
    await this.start(true);
  }

  async start(force = false): Promise<void> {
    if (
      !force &&
      (this.status.phase === 'requesting-permission' ||
        this.status.phase === 'booting' ||
        this.status.phase === 'calibrating' ||
        this.status.phase === 'live')
    ) {
      return;
    }

    const needsMic = this.sourceMode !== 'system-audio';
    const needsDisplayAudio = this.sourceMode !== 'room-mic';

    if (needsMic && !navigator.mediaDevices?.getUserMedia) {
      this.updateStatus({
        phase: 'error',
        message: 'Microphone capture is unavailable.',
        error: 'The browser does not support microphone capture.'
      });

      return;
    }

    if (needsDisplayAudio && !navigator.mediaDevices?.getDisplayMedia) {
      this.updateStatus({
        phase: 'error',
        message: 'PC audio capture is unavailable.',
        error:
          'This browser does not support display/tab audio capture for the selected input mode.'
      });

      return;
    }

    let requestedMicStream: MediaStream | null = null;
    let requestedDisplayStream: MediaStream | null = null;

    try {
      this.supportedConstraints = needsMic
        ? this.readSupportedConstraints()
        : DEFAULT_SUPPORTED_MIC_CONSTRAINTS;
      this.staticWarnings = needsMic
        ? this.buildMicSupportWarnings(this.supportedConstraints)
        : [];

      if (needsDisplayAudio) {
        this.staticWarnings.push(
          'PC audio mode uses Chrome screen/tab sharing. Choose a source with audio enabled in the share picker.'
        );
      }

      this.bootStep = 'requesting-permission';
      this.updateStatus({
        phase: 'requesting-permission',
        message: this.getPermissionMessage()
      });

      const micPromise = needsMic ? this.requestPreferredStream() : Promise.resolve(null);
      const displayPromise = needsDisplayAudio
        ? this.requestDisplayStream()
        : Promise.resolve(null);

      [requestedMicStream, requestedDisplayStream] = await Promise.all([
        micPromise,
        displayPromise
      ]);

      if (
        needsDisplayAudio &&
        (!requestedDisplayStream ||
          requestedDisplayStream.getAudioTracks().length === 0)
      ) {
        throw new Error(
          'The selected shared source did not include audio. Retry and enable audio in the share picker.'
        );
      }

      await this.teardown();

      this.micStream = requestedMicStream;
      this.displayStream = requestedDisplayStream;

      await this.refreshAvailableInputs();

      this.bootStep = 'creating-audio-context';
      this.updateStatus({
        phase: 'booting',
        message: 'Starting audio engine...'
      });

      this.context = new AudioContext({ latencyHint: 'interactive' });
      await this.context.resume();

      if (!this.context.audioWorklet) {
        throw new Error('AudioWorklet is unavailable in this browser.');
      }

      this.bootStep = 'loading-worklet';
      this.updateStatus({
        phase: 'booting',
        message: 'Loading listening engine...'
      });

      await this.context.audioWorklet.addModule(
        new URL('./audio-feature-processor.js', import.meta.url)
      );

      const micTrack = this.micStream?.getAudioTracks()[0];
      const displayAudioTrack = this.displayStream?.getAudioTracks()[0];
      const displayVideoTrack = this.displayStream?.getVideoTracks()[0];
      const micLabel = micTrack?.label || DEFAULT_SOURCE_DESCRIPTOR.label;
      const displayLabel =
        displayAudioTrack?.label || displayVideoTrack?.label || 'PC audio share';

      this.appliedTrackSettings = needsMic
        ? this.extractAppliedTrackSettings(micTrack)
        : null;
      this.appliedDisplayTrackSettings = needsDisplayAudio
        ? this.extractAppliedDisplayTrackSettings(
            displayVideoTrack,
            displayAudioTrack
          )
        : null;
      this.displayTrackLabel = needsDisplayAudio ? displayLabel : null;
      this.displayAudioGranted = Boolean(displayAudioTrack);

      this.selectedInputId = needsMic
        ? micTrack?.getSettings().deviceId ?? this.preferredInputId ?? null
        : null;
      this.sourceDescriptor = this.buildSourceDescriptor(micLabel, displayLabel);

      const micTruth = needsMic
        ? this.evaluateMicTruth(
            this.supportedConstraints,
            this.appliedTrackSettings
          )
        : {
            rawPathGranted: true,
            warnings: []
          };
      this.rawPathGranted = micTruth.rawPathGranted;
      this.staticWarnings = [...this.staticWarnings, ...micTruth.warnings];

      this.bootStep = 'connecting-graph';
      this.updateStatus({
        phase: 'booting',
        message: this.getGraphMessage()
      });

      this.worklet = new AudioWorkletNode(
        this.context,
        'audio-feature-processor'
      );
      this.analyser = this.context.createAnalyser();
      this.silentGain = this.context.createGain();

      this.analyser.fftSize = 2048;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      this.analyser.smoothingTimeConstant = 0.68;
      this.silentGain.gain.value = 0;

      if (this.micStream) {
        this.micSource = this.context.createMediaStreamSource(this.micStream);
        this.micSource.connect(this.worklet);
      }

      if (this.displayStream) {
        this.displaySource = this.context.createMediaStreamSource(this.displayStream);
        this.displaySource.connect(this.worklet);
      }

      this.worklet.connect(this.analyser);
      this.analyser.connect(this.silentGain);
      this.silentGain.connect(this.context.destination);

      this.attachTrackEndHandlers();

      this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
      this.worklet.port.onmessage = (event: MessageEvent<AnalysisFrame>) => {
        const packet = event.data;

        this.workletPacket = packet;

        if (this.status.phase === 'calibrating') {
          this.calibrationRms.push(packet.rms);
          this.calibrationPeaks.push(packet.peak);
        }
      };

      this.calibrationRms = [];
      this.calibrationPeaks = [];
      this.calibrationSpectrumFrames = [];
      this.previousSpectrumFrame = null;
      this.spectrumBaseline = {};
      this.noiseFloor = 0.02;
      this.calibrationNoiseFloor = 0.02;
      this.minimumCeiling = 0.06;
      this.calibrationPeak = 0.06;
      this.adaptiveCeiling = 0.06;
      this.calibrationDurationMs = 0;
      this.calibrationSampleCount = 0;
      this.calibrationRmsPercentile20 = 0;
      this.calibrationPeakPercentile90 = 0;
      this.interpreter.reset();
      this.sourceHintInterpreter.reset();
      this.calibrationStartedAt = performance.now();
      this.calibrationEndsAt = this.calibrationStartedAt + CALIBRATION_MS;

      this.bootStep = 'calibrating';
      this.updateStatus({
        phase: 'calibrating',
        message: this.getCalibrationMessage()
      });

      this.startAnalysisLoop();
    } catch (error) {
      this.stopStream(requestedMicStream);
      this.stopStream(requestedDisplayStream);
      await this.teardown();
      this.updateStatus({
        phase: 'error',
        message: 'Unable to start listening.',
        error:
          error instanceof Error
            ? error.message
            : 'Unknown input startup error.'
      });
    }
  }

  async stop(): Promise<void> {
    await this.dispose();
  }

  async dispose(): Promise<void> {
    await this.teardown();
    this.latestFrame = DEFAULT_LISTENING_FRAME;
    this.latestAnalysisFrame = DEFAULT_ANALYSIS_FRAME;
    this.diagnostics = DEFAULT_AUDIO_DIAGNOSTICS;
    this.updateStatus(DEFAULT_AUDIO_STATUS);
  }

  private updateStatus(status: AudioEngineStatus): void {
    this.status = status;

    for (const listener of this.listeners) {
      listener(status);
    }
  }

  private startAnalysisLoop(): void {
    if (this.analysisFrameId !== 0) {
      cancelAnimationFrame(this.analysisFrameId);
    }

    const step = () => {
      const now = performance.now();

      if (this.status.phase === 'calibrating' && now >= this.calibrationEndsAt) {
        this.finishCalibration();
      }

      this.updateListeningFrame();
      this.analysisFrameId = window.requestAnimationFrame(step);
    };

    this.analysisFrameId = window.requestAnimationFrame(step);
  }

  private finishCalibration(): void {
    if (this.calibrationRms.length < 4 || this.calibrationPeaks.length < 4) {
      this.updateStatus({
        phase: 'error',
        message: 'Calibration failed.',
        error: 'Not enough input signal was captured during calibration.'
      });

      return;
    }

    const profile = summarizeCalibrationSamples(
      this.calibrationRms,
      this.calibrationPeaks
    );

    this.noiseFloor = Math.max(profile.noiseFloor, 0.0025);
    this.calibrationNoiseFloor = this.noiseFloor;
    this.minimumCeiling = Math.max(profile.ceiling, this.noiseFloor + 0.028);
    this.calibrationPeak = Math.max(profile.peak, this.minimumCeiling);
    this.adaptiveCeiling = this.minimumCeiling;
    this.calibrationDurationMs = Math.max(
      0,
      this.calibrationEndsAt - this.calibrationStartedAt
    );
    this.calibrationSampleCount = profile.sampleCount;
    this.calibrationRmsPercentile20 = profile.rmsPercentile20;
    this.calibrationPeakPercentile90 = profile.peakPercentile90;
    this.spectrumBaseline = deriveSpectrumBaseline(this.calibrationSpectrumFrames);
    this.previousSpectrumFrame = null;
    this.interpreter.reset();
    this.sourceHintInterpreter.reset();
    this.bootStep = 'live';

    this.updateStatus({
      phase: 'live',
      message: 'Live'
    });
  }

  private updateListeningFrame(): void {
    const spectrumFrame = this.sampleSpectrumFrame();
    const calibrated = this.status.phase === 'live';

    if (this.status.phase === 'calibrating') {
      this.calibrationSpectrumFrames.push(spectrumFrame);
    }

    if (calibrated && this.sourceMode === 'room-mic') {
      const quietWindow =
        this.workletPacket.modulation < 0.045 &&
        this.workletPacket.transient < 0.016 &&
        this.workletPacket.peak <
          Math.max(this.calibrationPeak * 0.82, this.calibrationNoiseFloor + 0.022);
      const floorProbe = Math.min(
        this.workletPacket.rms,
        this.workletPacket.envelopeSlow * 0.98
      );

      this.noiseFloor = updateAdaptiveNoiseFloor(
        this.noiseFloor,
        floorProbe,
        this.calibrationNoiseFloor,
        quietWindow
      );
    }

    const analysisFrame = this.shapeAnalysisFrame(this.workletPacket);

    if (calibrated) {
      this.adaptiveCeiling = updateAdaptiveCeiling(
        this.adaptiveCeiling,
        analysisFrame.peak,
        this.minimumCeiling
      );
    }

    this.latestAnalysisFrame = analysisFrame;

    const sourceHintFrame = this.sourceHintInterpreter.update({
      analysis: analysisFrame,
      spectrumFrame,
      mode: this.sourceMode,
      runtimeMode: this.sourceHintMode,
      calibrated
    });

    const interpreterResult = this.interpreter.update({
      analysis: analysisFrame,
      mode: this.sourceMode,
      calibrated,
      noiseFloor: this.noiseFloor,
      adaptiveCeiling: this.adaptiveCeiling,
      rawPathGranted: this.rawPathGranted,
      tuning: this.tuning,
      sourceHints: sourceHintFrame,
      sourceHintMode: this.sourceHintMode
    });

    this.latestFrame = {
      ...interpreterResult.frame,
      mode: this.sourceMode
    };

    this.diagnostics = {
      source: this.sourceDescriptor,
      sourceMode: this.sourceMode,
      availableInputs: this.availableInputs,
      selectedInputId: this.selectedInputId,
      sampleRate: this.context?.sampleRate ?? null,
      fftSize: this.analyser?.fftSize ?? DEFAULT_AUDIO_DIAGNOSTICS.fftSize,
      deviceLabel: this.sourceDescriptor.label,
      bootStep: this.bootStep,
      requestedConstraints: REQUESTED_MIC_CONSTRAINTS,
      supportedConstraints: this.supportedConstraints,
      appliedTrackSettings: this.appliedTrackSettings,
      appliedDisplayTrackSettings: this.appliedDisplayTrackSettings,
      displayTrackLabel: this.displayTrackLabel,
      displayAudioGranted: this.displayAudioGranted,
      rawPathGranted: this.rawPathGranted,
      calibrationDurationMs: this.calibrationDurationMs,
      calibrationSampleCount: this.calibrationSampleCount,
      calibrationRmsPercentile20: this.calibrationRmsPercentile20,
      calibrationPeakPercentile90: this.calibrationPeakPercentile90,
      rawRms: this.workletPacket.rms,
      rawPeak: this.workletPacket.peak,
      adaptiveCeiling: this.adaptiveCeiling,
      noiseFloor: this.noiseFloor,
      minimumCeiling: this.minimumCeiling,
      calibrationPeak: this.calibrationPeak,
      spectrumLow: spectrumFrame.legacyLow,
      spectrumMid: spectrumFrame.legacyMid,
      spectrumHigh: spectrumFrame.legacyHigh,
      spectrumFrame,
      sourceHintFrame,
      humRejection: interpreterResult.diagnostics.humRejection,
      musicTrend: interpreterResult.diagnostics.musicTrend,
      silenceGate: interpreterResult.diagnostics.silenceGate,
      beatIntervalMs: interpreterResult.diagnostics.beatIntervalMs,
      roomMusicFloorActive: interpreterResult.diagnostics.roomMusicFloorActive,
      roomMusicDrive: interpreterResult.diagnostics.roomMusicDrive,
      aftermathEntryEvidence: interpreterResult.diagnostics.aftermathEntryEvidence,
      aftermathExitPressure: interpreterResult.diagnostics.aftermathExitPressure,
      stateReason: interpreterResult.diagnostics.stateReason,
      showStateReason: interpreterResult.diagnostics.showStateReason,
      momentReason: interpreterResult.diagnostics.momentReason,
      conductorReason: interpreterResult.diagnostics.conductorReason,
      analysisFrame: this.latestAnalysisFrame,
      listeningFrame: this.latestFrame,
      warnings: this.buildDynamicWarnings(calibrated, this.latestFrame)
    };

    const snapshot: AudioSnapshot = {
      analysisFrame: this.latestAnalysisFrame,
      listeningFrame: this.latestFrame,
      diagnostics: this.diagnostics
    };

    for (const listener of this.frameListeners) {
      listener(snapshot);
    }
  }

  private sampleSpectrumFrame(): SpectrumFrame {
    const timestampMs = performance.now();

    if (!this.analyser || !this.frequencyData || !this.context) {
      const silentFrame = createSilentSpectrumFrame(timestampMs);
      this.previousSpectrumFrame = silentFrame;
      return silentFrame;
    }

    this.analyser.getFloatFrequencyData(
      this.frequencyData as unknown as Float32Array<ArrayBuffer>
    );

    const spectrumFrame = deriveSpectrumFrame({
      frequencyData: this.frequencyData,
      sampleRate: this.context.sampleRate,
      fftSize: this.analyser.fftSize,
      timestampMs,
      minDecibels: this.analyser.minDecibels,
      maxDecibels: this.analyser.maxDecibels,
      previousFrame: this.previousSpectrumFrame,
      baseline: this.spectrumBaseline
    });
    this.previousSpectrumFrame = spectrumFrame;
    return spectrumFrame;
  }

  private shapeAnalysisFrame(packet: AnalysisFrame): AnalysisFrame {
    const hybridGainLift = this.sourceMode === 'hybrid' ? 0.9 : 1;
    const roomMode = this.sourceMode === 'room-mic';
    const quietRoomFactor = roomMode
      ? clamp01((0.026 - packet.rms) / 0.018)
      : 0;
    const structuredRoomFactor = roomMode
      ? clamp01(
          packet.envelopeSlow * 18 +
            (packet.lowFlux + packet.midFlux) * 10 +
            packet.modulation * 6
        )
      : 0;
    const roomGainLift = roomMode
      ? 1.04 +
        quietRoomFactor * 0.12 +
        structuredRoomFactor * 0.1 +
        this.tuning.sensitivity * 0.06
      : 1;
    const roomBodyLift = roomMode
      ? 1 + quietRoomFactor * 0.12 + structuredRoomFactor * 0.08
      : 1;
    const roomMidLift = roomMode
      ? 1 + quietRoomFactor * 0.08 + structuredRoomFactor * 0.06
      : 1;
    const gainScale =
      (0.55 + this.tuning.inputGain * 0.9) * hybridGainLift * roomGainLift;
    const lowScale = (1 + (this.tuning.eqLow - 0.5) * 1.2) * roomBodyLift;
    const midScale = (1 + (this.tuning.eqMid - 0.5) * 1.2) * roomMidLift;
    const highScale =
      (1 + (this.tuning.eqHigh - 0.5) * 1.2) *
      (roomMode ? 0.98 + quietRoomFactor * 0.04 : 1);
    const rms = packet.rms * gainScale;
    const peak = Math.min(1, packet.peak * gainScale);
    const envelopeFast = packet.envelopeFast * gainScale;
    const envelopeSlow = packet.envelopeSlow * gainScale;
    const lowEnergy = packet.lowEnergy * gainScale * lowScale;
    const midEnergy = packet.midEnergy * gainScale * midScale;
    const highEnergy = packet.highEnergy * gainScale * highScale;
    const totalEnergy = lowEnergy + midEnergy + highEnergy;

    return {
      ...packet,
      rms,
      peak,
      envelopeFast,
      envelopeSlow,
      transient: packet.transient * gainScale,
      lowEnergy,
      midEnergy,
      highEnergy,
      brightness:
        totalEnergy > 0
          ? (midEnergy * 0.38 + highEnergy) / totalEnergy
          : packet.brightness,
      lowFlux: packet.lowFlux * lowScale,
      midFlux: packet.midFlux * midScale,
      highFlux: packet.highFlux * highScale,
      clipped: packet.clipped || peak >= 0.985
    };
  }

  private buildAudioConstraints(): MediaTrackConstraints {
    return {
      echoCancellation: REQUESTED_MIC_CONSTRAINTS.echoCancellation,
      noiseSuppression: REQUESTED_MIC_CONSTRAINTS.noiseSuppression,
      autoGainControl: REQUESTED_MIC_CONSTRAINTS.autoGainControl,
      ...(REQUESTED_MIC_CONSTRAINTS.channelCount !== null
        ? { channelCount: REQUESTED_MIC_CONSTRAINTS.channelCount }
        : {}),
      ...(this.preferredInputId
        ? { deviceId: { exact: this.preferredInputId } }
        : {})
    };
  }

  private async requestPreferredStream(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: this.buildAudioConstraints(),
        video: false
      });
    } catch (error) {
      if (!this.preferredInputId) {
        throw error;
      }

      this.staticWarnings.push(
        'Preferred microphone could not be opened; fell back to the default microphone.'
      );
      this.preferredInputId = null;
      this.selectedInputId = null;

      return navigator.mediaDevices.getUserMedia({
        audio: this.buildAudioConstraints(),
        video: false
      });
    }
  }

  private async requestDisplayStream(): Promise<MediaStream> {
    const options: ExtendedDisplayMediaStreamOptions = {
      video: true,
      audio: {
        suppressLocalAudioPlayback: false
      },
      selfBrowserSurface: 'exclude',
      surfaceSwitching: 'include',
      systemAudio: 'include',
      monitorTypeSurfaces: 'include'
    };

    return navigator.mediaDevices.getDisplayMedia(
      options as DisplayMediaStreamOptions
    );
  }

  private async refreshAvailableInputs(): Promise<void> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      this.availableInputs = [DEFAULT_SOURCE_DESCRIPTOR];
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          id: device.deviceId || `room-mic-${index}`,
          kind: 'room-mic' as const,
          label: device.label || `Microphone ${index + 1}`,
          available: true
        }));

      this.availableInputs =
        inputs.length > 0 ? inputs : [DEFAULT_SOURCE_DESCRIPTOR];
    } catch {
      const warning =
        'Audio input list could not be refreshed; default input routing remains available.';
      this.availableInputs = [DEFAULT_SOURCE_DESCRIPTOR];
      if (!this.staticWarnings.includes(warning)) {
        this.staticWarnings.push(warning);
      }
    }
  }

  private buildMicSupportWarnings(
    supported: SupportedMicConstraints
  ): string[] {
    return buildMicSupportWarnings(supported);
  }

  private evaluateMicTruth(
    supported: SupportedMicConstraints,
    applied: AppliedMicTrackSettings | null
  ): { rawPathGranted: boolean; warnings: string[] } {
    return evaluateMicTruth(supported, applied);
  }

  private extractAppliedTrackSettings(
    track: MediaStreamTrack | undefined
  ): AppliedMicTrackSettings | null {
    if (!track) {
      return null;
    }

    const settings = track.getSettings() as MediaTrackSettings & {
      latency?: number;
    };

    return extractAppliedTrackSettings(settings);
  }

  private extractAppliedDisplayTrackSettings(
    videoTrack: MediaStreamTrack | undefined,
    audioTrack: MediaStreamTrack | undefined
  ): AppliedDisplayTrackSettings | null {
    if (!videoTrack && !audioTrack) {
      return null;
    }

    const videoSettings = (videoTrack?.getSettings() ?? {}) as MediaTrackSettings & {
      displaySurface?: string;
    };
    const audioSettings = (audioTrack?.getSettings() ?? {}) as MediaTrackSettings & {
      suppressLocalAudioPlayback?: boolean;
      restrictOwnAudio?: boolean;
    };

    return {
      displaySurface: videoSettings.displaySurface ?? null,
      suppressLocalAudioPlayback:
        audioSettings.suppressLocalAudioPlayback ?? null,
      restrictOwnAudio: audioSettings.restrictOwnAudio ?? null
    };
  }

  private readSupportedConstraints(): SupportedMicConstraints {
    const supported = navigator.mediaDevices.getSupportedConstraints();

    return {
      echoCancellation: Boolean(supported.echoCancellation),
      noiseSuppression: Boolean(supported.noiseSuppression),
      autoGainControl: Boolean(supported.autoGainControl),
      channelCount: Boolean(supported.channelCount)
    };
  }

  private buildDynamicWarnings(
    calibrated: boolean,
    frame: ListeningFrame
  ): string[] {
    const warnings = [...this.staticWarnings];

    if (!calibrated) {
      warnings.push('Calibration is not complete; listening values are provisional.');
    }

    if (this.workletPacket.clipped) {
      warnings.push('Input clipping detected; signal trust is reduced.');
    }

    if (this.sourceMode === 'hybrid') {
      warnings.push(
        'Hybrid mode is active. Direct PC audio and room sounds are being interpreted together.'
      );
    }

    if (calibrated && this.diagnostics.humRejection > 0.72) {
      warnings.push('Steady low-frequency room noise is being heavily rejected.');
    }

    if (
      calibrated &&
      frame.musicConfidence < 0.18 &&
      this.diagnostics.spectrumMid > 0.18
    ) {
      warnings.push(
        'The current source does not appear musically strong enough to trigger a larger wake-up at the current wake setting.'
      );
    }

    if (
      calibrated &&
      frame.showState === 'surge' &&
      frame.peakConfidence < 0.58
    ) {
      warnings.push(
        'A surge posture is active with only moderate peak confidence; consider lowering show scale or event rate.'
      );
    }

    if (calibrated && frame.body > 0.92) {
      warnings.push(
        'Listening body is nearing saturation; the current source may dominate the scene.'
      );
    }

    if (calibrated && frame.confidence < 0.7) {
      warnings.push(
        'Listening confidence is reduced by clipping or compromised microphone processing.'
      );
    }

    if (
      calibrated &&
      this.tuning.inputGain > 0.8 &&
      this.workletPacket.clipped
    ) {
      warnings.push(
        'Input trim is high while clipping is present; reduce input trim or lower the source level.'
      );
    }

    return warnings;
  }

  private buildSourceDescriptor(
    micLabel: string,
    displayLabel: string
  ): SourceDescriptor {
    if (this.sourceMode === 'system-audio') {
      return {
        id: 'system-audio',
        kind: 'system-audio',
        label: displayLabel,
        available: true
      };
    }

    if (this.sourceMode === 'hybrid') {
      return {
        id: 'hybrid',
        kind: 'hybrid',
        label: `${micLabel} + ${displayLabel}`,
        available: true
      };
    }

    return {
      id: this.selectedInputId ?? 'room-mic',
      kind: 'room-mic',
      label: micLabel,
      available: true
    };
  }

  private getPermissionMessage(): string {
    switch (this.sourceMode) {
      case 'system-audio':
        return 'Requesting PC audio sharing...';
      case 'hybrid':
        return 'Requesting microphone and PC audio access...';
      default:
        return 'Requesting microphone access...';
    }
  }

  private getGraphMessage(): string {
    switch (this.sourceMode) {
      case 'system-audio':
        return 'Connecting PC audio graph...';
      case 'hybrid':
        return 'Connecting hybrid listening graph...';
      default:
        return 'Connecting microphone graph...';
    }
  }

  private getCalibrationMessage(): string {
    switch (this.sourceMode) {
      case 'system-audio':
        return 'Listening to PC audio...';
      case 'hybrid':
        return 'Listening to the room and PC audio...';
      default:
        return 'Listening to the room...';
    }
  }

  private attachTrackEndHandlers(): void {
    const attach = (stream: MediaStream | null, kind: ListeningMode) => {
      stream?.getTracks().forEach((track) => {
        track.onended = () => {
          if (this.isTearingDown) {
            return;
          }

          void this.handleExternalSourceEnded(kind);
        };
      });
    };

    attach(this.micStream, this.sourceMode);
    attach(this.displayStream, this.sourceMode);
  }

  private async handleExternalSourceEnded(kind: ListeningMode): Promise<void> {
    await this.teardown();
    this.latestFrame = DEFAULT_LISTENING_FRAME;
    this.latestAnalysisFrame = DEFAULT_ANALYSIS_FRAME;
    this.diagnostics = DEFAULT_AUDIO_DIAGNOSTICS;

    const error =
      kind === 'system-audio'
        ? 'The PC audio share ended. Start again and choose a source with audio.'
        : kind === 'hybrid'
          ? 'One of the hybrid inputs ended. Start again to restore both microphone and PC audio.'
          : 'The microphone stream ended. Start again to resume room listening.';

    this.updateStatus({
      phase: 'error',
      message: 'Input source ended.',
      error
    });
  }

  private stopStream(stream: MediaStream | null): void {
    stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
  }

  private async teardown(): Promise<void> {
    this.isTearingDown = true;

    if (this.analysisFrameId !== 0) {
      cancelAnimationFrame(this.analysisFrameId);
      this.analysisFrameId = 0;
    }

    this.worklet?.port.close();
    this.worklet?.disconnect();
    this.micSource?.disconnect();
    this.displaySource?.disconnect();
    this.analyser?.disconnect();
    this.silentGain?.disconnect();

    this.stopStream(this.micStream);
    this.stopStream(this.displayStream);

    if (this.context && this.context.state !== 'closed') {
      await this.context.close();
    }

    this.context = null;
    this.micStream = null;
    this.displayStream = null;
    this.micSource = null;
    this.displaySource = null;
    this.worklet = null;
    this.analyser = null;
    this.silentGain = null;
    this.frequencyData = null;
    this.sourceDescriptor = DEFAULT_SOURCE_DESCRIPTOR;
    this.availableInputs = [DEFAULT_SOURCE_DESCRIPTOR];
    this.supportedConstraints = DEFAULT_SUPPORTED_MIC_CONSTRAINTS;
    this.appliedTrackSettings = null;
    this.appliedDisplayTrackSettings = null;
    this.displayTrackLabel = null;
    this.displayAudioGranted = false;
    this.selectedInputId = this.sourceMode === 'room-mic' ? this.preferredInputId : null;
    this.rawPathGranted = false;
    this.calibrationDurationMs = 0;
    this.calibrationSampleCount = 0;
    this.calibrationRmsPercentile20 = 0;
    this.calibrationPeakPercentile90 = 0;
    this.staticWarnings = [];
    this.bootStep = 'idle';
    this.workletPacket = DEFAULT_ANALYSIS_FRAME;
    this.interpreter.reset();
    this.isTearingDown = false;
  }
}
