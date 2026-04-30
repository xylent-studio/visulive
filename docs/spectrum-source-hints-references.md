# Spectrum Source Hints References

Date: 2026-04-30
Status: Research reference for future implementation
Companion docs:

- `docs/spectrum-source-hints.md`
- `docs/spectrum-source-hints-scenarios.md`

## Scope

This reference records the outside research used to shape the Spectrum Source Hints plan. It favors primary or official sources. The decision is intentionally conservative: native Web Audio spectrum hints first, optional MIR/ML later only if proof shows a real ceiling.

## Browser-Native Audio

### Web Audio `AnalyserNode`

Source:

- MDN: <https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData>
- W3C Web Audio API 1.1: <https://www.w3.org/TR/webaudio-1.1/#AnalyserNode>

Useful facts:

- `getFloatFrequencyData()` copies current frequency-domain data into a `Float32Array`.
- Each array item represents a decibel value for a frequency bin.
- Frequencies are distributed from 0 Hz to half the sample rate.
- `fftSize` defaults to 2048 in the Web Audio spec and must be a power of two from 32 to 32768.
- `frequencyBinCount` is half of `fftSize`.
- Larger FFT sizes can be more costly and smear low-latency event timing.

VisuLive read:

- This is already in the repo through `AudioEngine.ts`.
- It is enough to build a compact `SpectrumFrame`.
- It should remain a private analysis source, not a public control surface.

### Web Audio `AudioWorkletNode`

Source:

- MDN: <https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode>

Useful facts:

- `AudioWorkletNode` connects a custom audio processor into the Web Audio graph.
- The associated processor runs in the audio rendering thread.
- The node has a `port` for bidirectional communication.

VisuLive read:

- The repo already uses an audio worklet for time-domain and broad-band features.
- The first spectrum-hint pass can use the existing analyser on the main/audio graph path.
- Only move FFT work into a custom worklet if measurement proves main-thread spectrum sampling is the bottleneck.

## Professional Visual Tool Patterns

### Resolume Wire FFT

Source:

- Resolume support: <https://resolume.com/support/en/wire-fft>

Useful facts:

- Resolume receives FFT as an array of 1024 float values.
- Lower indices represent lower frequencies.
- The docs explicitly frame FFT as a way to rotate on kick, shake on snare, or change color from amplitude.
- Bin width is derived from sample rate divided by two, then divided by the number of values.

VisuLive read:

- This validates the basic VJ pattern the user described.
- VisuLive should adopt the useful part: spectrum regions can identify event evidence.
- VisuLive should not adopt raw patch-style routing directly into scene systems.

### Notch Sound FFT Modifier

Source:

- Notch manual: <https://manual.notch.one/2026.1/en/docs/reference/nodes/modifiers/sound-fft-modifier/>

Useful facts:

- Notch exposes rectangular regions over frequency and amplitude.
- A region ramps output from 0 to 1 when audio appears inside that region.
- Multiple regions can share one FFT calculation.
- Attack and decay shape the trigger envelope.

VisuLive read:

- The "one FFT, many regions" pattern is right.
- Attack/decay shaping maps directly to source-hint envelopes.
- The region-editor UI should stay internal/diagnostic, not public.

### TouchDesigner Audio Spectrum CHOP

Source:

- TouchDesigner docs: <https://docs.derivative.ca/Audio_Spectrum_CHOP>

Useful facts:

- TouchDesigner treats audio spectrum values as CHOP channels that can be routed into parameters.
- This is a mature live-visual control pattern.

VisuLive read:

- It confirms spectrum-as-control is a standard visual workflow.
- VisuLive needs stricter proof and conductor ownership because its product rule is public simplicity and authored show coherence.

## JavaScript and Python MIR Feature Libraries

### Meyda

Source:

- Meyda site: <https://meyda.github.io/>
- Meyda audio features: <https://meyda.js.org/audio-features>

Useful facts:

- Meyda is a JavaScript audio feature extraction library for Web Audio or arrays.
- It supports offline and real-time extraction.
- Its feature docs include zero crossing rate, energy, amplitude spectrum, power spectrum, spectral centroid, and more.
- Windowing choices affect feature values.

VisuLive read:

- Meyda is a plausible later dependency if native bands need higher-level spectral features.
- It should not be first because the repo already has enough native infrastructure to test the primary question.
- If used later, feature parity and windowing must be pinned in tests.

### librosa

Source:

- librosa feature extraction docs: <https://librosa.org/doc/main/feature.html>

Useful facts:

- librosa exposes a strong vocabulary for spectral, chroma, tonal, rhythm, and feature-delta analysis.
- Relevant features include chroma, mel spectrogram, MFCC, RMS, spectral centroid, bandwidth, contrast, flatness, rolloff, zero crossing rate, tempo, tempogram, and deltas.

VisuLive read:

- librosa is excellent for offline reference analysis, test data, and analyzer inspiration.
- It is not a browser runtime dependency.
- It can help validate whether the native source hints are missing an obvious MIR feature.

## Higher-Level Model Options

### Essentia Models

Source:

- Essentia model docs: <https://essentia.upf.edu/models.html>

Useful facts:

- Essentia provides pre-trained models for music/audio analysis tasks.
- Some models are available in TensorFlow.js or ONNX formats.
- The model docs note ongoing updates and specific licenses.

VisuLive read:

- Essentia could support future lab descriptors if native hints plateau.
- Licensing, payload size, and model confidence must be evaluated before runtime use.
- Do not introduce it before a native proof baseline exists.

### YAMNet

Source:

- TensorFlow Hub YAMNet tutorial: <https://www.tensorflow.org/hub/tutorials/yamnet>

Useful facts:

- YAMNet predicts 521 audio event classes from AudioSet-trained audio.
- It expects mono audio at 16 kHz in the tutorial path.
- It returns class scores, embeddings, and a spectrogram.

VisuLive read:

- Useful for broad sound-event labels in lab or offline diagnostics.
- Not ideal as first live music conductor logic because labels are generic audio events, not reliably music-structure decisions.

### Spotify Basic Pitch

Source:

- Basic Pitch demo: <https://basicpitch.spotify.com/>

Useful facts:

- Basic Pitch converts audio from a single instrument into MIDI with pitch bend detection.

VisuLive read:

- Useful future reference for pitch/melodic lab work.
- Not suitable as first live source-hint layer because VisuLive needs mixed-track cue evidence, not single-instrument transcription.

### Spleeter

Source:

- Deezer Spleeter GitHub: <https://github.com/deezer/spleeter>

Useful facts:

- Spleeter separates vocals/accompaniment, 4-stem vocals/drums/bass/other, or 5-stem vocals/drums/bass/piano/other.
- It is Python/TensorFlow based and can be fast with GPU.

VisuLive read:

- Good for offline analysis or a future local lab.
- Poor fit for the first public live browser runtime because it implies external dependencies, model management, and latency/operational complexity.

### Demucs

Source:

- Demucs GitHub: <https://github.com/facebookresearch/demucs>

Useful facts:

- Demucs is a music source separation model that separates drums, bass, vocals, and other stems.
- The referenced GitHub repo notes maintenance limitations and points to a fork.

VisuLive read:

- Strong source-separation reference for future offline experiments.
- Not first-path runtime material for VisuLive.

## Option Matrix

| Option | Strength | Cost/risk | Recommended status |
| --- | --- | --- | --- |
| Native `AnalyserNode` log bands | Already available, private, low dependency risk | Needs careful normalization and proof | First path |
| Current AudioWorklet broad bands | Already implemented, stable concept | Too coarse for source-like hints alone | Keep and augment |
| Custom worklet FFT | Potentially better thread placement | More implementation complexity | Only if measured need |
| Meyda | JS feature vocabulary, real-time capable | Dependency and feature parity work | Later if native bands plateau |
| librosa | Rich offline reference features | Python/offline, not browser runtime | Analyzer/reference only |
| Essentia.js/models | Higher-level descriptors | Payload, licensing, confidence, complexity | Lab/future only |
| YAMNet | Broad event classes | Generic labels, sample-rate/model pipeline | Diagnostic future only |
| Basic Pitch | Pitch/MIDI extraction | Single-instrument focus | Future lab only |
| Spleeter | Stem separation | Python/TensorFlow/runtime complexity | Offline/local lab only |
| Demucs | Strong source separation | Heavy, maintenance/runtime concerns | Offline/local lab only |

## Why Native Hints First

Native hints give the best risk-adjusted path because they:

- Use infrastructure already present in VisuLive.
- Preserve public simplicity.
- Preserve conductor ownership.
- Can be proven in capture reports before visual behavior changes.
- Avoid model and licensing uncertainty.
- Directly address current blockers: cue coherence, missed events, false positives, and low-energy readability.

## Research-Backed Implementation Warnings

- FFT bins are not instruments. They are energy regions.
- Instrument-like evidence needs time behavior: onset, decay, sustain, flux, and context.
- More frequency resolution is not automatically better if timing gets worse.
- More labels are not better if the conductor cannot prove them.
- A visual demo can feel better while making long-run proof worse.
- Every source hint should have a reason string and a suppression reason.

## Decision Record

Accepted:

- Build a private source-hint layer after diagnostic proof.
- Start with native Web Audio spectrum regions.
- Keep hints under Audio Conductor ownership.
- Add analyzer visibility before visual behavior.
- Use a 42-scenario matrix for first proof design.

Rejected for first implementation:

- Raw FFT bins into visual systems.
- Public frequency-region controls.
- ML/stem separation as the first live path.
- Any claim that the browser can reliably identify exact instruments from spectrum alone.

Deferred:

- Meyda features.
- Essentia/ONNX/TFJS model descriptors.
- YAMNet diagnostics.
- Basic Pitch melodic lab work.
- Spleeter/Demucs offline source-separation lab.
