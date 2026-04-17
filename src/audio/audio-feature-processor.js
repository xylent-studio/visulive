class AudioFeatureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.envelopeFast = 0;
    this.envelopeSlow = 0;
    this.lastPeak = 0;
    this.framesSincePost = 0;
    this.lowState = 0;
    this.midState = 0;
    this.lowAlpha = this.createLowPassAlpha(220);
    this.midAlpha = this.createLowPassAlpha(2200);
    this.lastLowEnergy = 0;
    this.lastMidEnergy = 0;
    this.lastHighEnergy = 0;
    this.lastEnvelopeSlow = 0;
  }

  createLowPassAlpha(cutoffHz) {
    const dt = 1 / sampleRate;
    const rc = 1 / (2 * Math.PI * cutoffHz);

    return dt / (rc + dt);
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    const activeChannels =
      input?.filter((channel) => channel && channel.length > 0) ?? [];
    const frameLength = activeChannels[0]?.length ?? 0;

    if (frameLength === 0) {
      return true;
    }

    const mixed = new Float32Array(frameLength);

    for (let index = 0; index < frameLength; index += 1) {
      let sampleSum = 0;

      for (let channelIndex = 0; channelIndex < activeChannels.length; channelIndex += 1) {
        sampleSum += activeChannels[channelIndex][index];
      }

      mixed[index] = sampleSum / activeChannels.length;
    }

    if (output) {
      for (let channelIndex = 0; channelIndex < output.length; channelIndex += 1) {
        output[channelIndex].set(mixed);
      }
    }

    let sumSquares = 0;
    let lowSquares = 0;
    let midSquares = 0;
    let highSquares = 0;
    let peak = 0;

    for (let index = 0; index < mixed.length; index += 1) {
      const sample = mixed[index];
      const absolute = Math.abs(sample);

      sumSquares += sample * sample;

      if (absolute > peak) {
        peak = absolute;
      }

      this.lowState += (sample - this.lowState) * this.lowAlpha;
      this.midState += (sample - this.midState) * this.midAlpha;

      const lowBand = this.lowState;
      const midBand = this.midState - this.lowState;
      const highBand = sample - this.midState;

      lowSquares += lowBand * lowBand;
      midSquares += midBand * midBand;
      highSquares += highBand * highBand;
    }

    const rms = Math.sqrt(sumSquares / mixed.length);
    const lowEnergy = Math.sqrt(lowSquares / mixed.length);
    const midEnergy = Math.sqrt(midSquares / mixed.length);
    const highEnergy = Math.sqrt(highSquares / mixed.length);
    const spectralTotal = lowEnergy + midEnergy + highEnergy;
    const brightness =
      spectralTotal > 0
        ? (midEnergy * 0.38 + highEnergy) / spectralTotal
        : 0;
    const fastAttack = rms > this.envelopeFast ? 0.42 : 0.16;
    const slowAttack = rms > this.envelopeSlow ? 0.09 : 0.03;

    this.envelopeFast += (rms - this.envelopeFast) * fastAttack;
    this.envelopeSlow += (rms - this.envelopeSlow) * slowAttack;

    const transient = Math.max(
      0,
      (this.envelopeFast - this.envelopeSlow) * 3.2 + (peak - this.lastPeak) * 0.9
    );
    const lowFlux = Math.abs(lowEnergy - this.lastLowEnergy);
    const midFlux = Math.abs(midEnergy - this.lastMidEnergy);
    const highFlux = Math.abs(highEnergy - this.lastHighEnergy);
    const crestFactor = peak / Math.max(rms, 0.00001);
    const lowStability = Math.max(
      0,
      1 - lowFlux / Math.max(lowEnergy, this.lastLowEnergy, 0.0001)
    );
    const modulation =
      Math.abs(this.envelopeFast - this.envelopeSlow) +
      Math.abs(this.envelopeSlow - this.lastEnvelopeSlow) * 2.8;

    this.lastPeak = peak;
    this.lastLowEnergy = lowEnergy;
    this.lastMidEnergy = midEnergy;
    this.lastHighEnergy = highEnergy;
    this.lastEnvelopeSlow = this.envelopeSlow;
    this.framesSincePost += 1;

    if (this.framesSincePost >= 4) {
      this.framesSincePost = 0;

      this.port.postMessage({
        timestampMs: currentTime * 1000,
        rms,
        peak,
        envelopeFast: this.envelopeFast,
        envelopeSlow: this.envelopeSlow,
        transient,
        lowEnergy,
        midEnergy,
        highEnergy,
        brightness,
        lowFlux,
        midFlux,
        highFlux,
        crestFactor,
        lowStability,
        modulation,
        clipped: peak >= 0.985
      });
    }

    return true;
  }
}

registerProcessor('audio-feature-processor', AudioFeatureProcessor);
