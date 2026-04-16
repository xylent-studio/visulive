import {
  DEFAULT_ANALYSIS_FRAME,
  DEFAULT_LISTENING_FRAME,
  type AnalysisFrame,
  type ListeningFrame
} from '../types/audio';
import type {
  ReplayCapture,
  ReplayFrameDiagnostics,
  ReplayStatus
} from './types';

export class ReplayController {
  private capture: ReplayCapture | null = null;
  private mode: ReplayStatus['mode'] = 'idle';
  private currentIndex = 0;
  private currentTimeMs = 0;
  private lastTickMs = 0;

  hasCapture(): boolean {
    return this.capture !== null;
  }

  isActive(): boolean {
    return this.capture !== null && this.mode !== 'idle';
  }

  getCapture(): ReplayCapture | null {
    return this.capture;
  }

  getStatus(): ReplayStatus {
    return {
      mode: this.mode,
      captureName: this.capture?.metadata.label ?? 'No capture loaded',
      frameCount: this.capture?.frames.length ?? 0,
      durationMs: this.getDurationMs(),
      currentTimeMs: this.currentTimeMs
    };
  }

  load(capture: ReplayCapture): void {
    this.capture = capture;
    this.mode = 'loaded';
    this.currentIndex = 0;
    this.currentTimeMs = 0;
    this.lastTickMs = 0;
  }

  clear(): void {
    this.capture = null;
    this.mode = 'idle';
    this.currentIndex = 0;
    this.currentTimeMs = 0;
    this.lastTickMs = 0;
  }

  play(nowMs: number): void {
    if (!this.capture) {
      return;
    }

    if (this.currentTimeMs >= this.getDurationMs()) {
      this.stop();
    }

    this.mode = 'playing';
    this.lastTickMs = nowMs;
  }

  pause(): void {
    if (!this.capture) {
      return;
    }

    this.mode = 'paused';
    this.lastTickMs = 0;
  }

  stop(): void {
    if (!this.capture) {
      return;
    }

    this.mode = 'loaded';
    this.currentIndex = 0;
    this.currentTimeMs = 0;
    this.lastTickMs = 0;
  }

  seekRatio(ratio: number): void {
    if (!this.capture) {
      return;
    }

    const clamped = Math.max(0, Math.min(1, ratio));
    this.currentTimeMs = this.getDurationMs() * clamped;
    this.currentIndex = this.resolveFrameIndex(this.currentTimeMs);
    this.lastTickMs = 0;
  }

  update(nowMs: number): void {
    if (!this.capture || this.mode !== 'playing') {
      return;
    }

    if (this.lastTickMs === 0) {
      this.lastTickMs = nowMs;
      return;
    }

    const deltaMs = nowMs - this.lastTickMs;
    this.lastTickMs = nowMs;
    this.currentTimeMs = Math.min(
      this.currentTimeMs + Math.max(0, deltaMs),
      this.getDurationMs()
    );
    this.currentIndex = this.resolveFrameIndex(this.currentTimeMs);

    if (this.currentTimeMs >= this.getDurationMs()) {
      this.mode = 'paused';
      this.lastTickMs = 0;
    }
  }

  getCurrentFrame(): ListeningFrame {
    if (!this.capture) {
      return DEFAULT_LISTENING_FRAME;
    }

    return this.capture.frames[this.currentIndex]?.listeningFrame ?? DEFAULT_LISTENING_FRAME;
  }

  getCurrentAnalysisFrame(): AnalysisFrame {
    if (!this.capture) {
      return DEFAULT_ANALYSIS_FRAME;
    }

    return this.capture.frames[this.currentIndex]?.analysisFrame ?? DEFAULT_ANALYSIS_FRAME;
  }

  getCurrentDiagnostics(): ReplayFrameDiagnostics | null {
    if (!this.capture) {
      return null;
    }

    return this.capture.frames[this.currentIndex]?.diagnostics ?? null;
  }

  private getDurationMs(): number {
    if (!this.capture || this.capture.frames.length < 2) {
      return 0;
    }

    const first = this.capture.frames[0]?.timestampMs ?? 0;
    const last =
      this.capture.frames[this.capture.frames.length - 1]?.timestampMs ?? first;

    return Math.max(0, last - first);
  }

  private resolveFrameIndex(relativeTimeMs: number): number {
    if (!this.capture || this.capture.frames.length <= 1) {
      return 0;
    }

    const firstTimestamp = this.capture.frames[0]?.timestampMs ?? 0;
    const targetTimestamp = firstTimestamp + relativeTimeMs;
    let low = 0;
    let high = this.capture.frames.length - 1;

    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const timestamp = this.capture.frames[mid]?.timestampMs ?? firstTimestamp;

      if (timestamp <= targetTimestamp) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    return low;
  }
}
