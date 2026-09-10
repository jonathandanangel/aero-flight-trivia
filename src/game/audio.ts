import type { AudioGenre } from "./types";

export type SoundName =
  | "hover"
  | "select"
  | "pickup"
  | "place"
  | "correct"
  | "wrong"
  | "whoosh"
  | "recall-note"
  | "recall-note-fast"
  | "recall-evolved"
  | "recall-win"
  | "recall-fail"
  | "cycle-start"
  | "cycle-turn"
  | "cycle-crash"
  | "cycle-win"
  | "maze-start"
  | "maze-pellet"
  | "maze-power"
  | "maze-ghost"
  | "maze-hit"
  | "maze-win"
  | "maze-lose"
  | "path-link"
  | "path-clear"
  | "stage-clear"
  | "stage-fail"
  | "gauntlet-start"
  | "brain-overload"
  | "gunshot"
  | "launch";

export interface AudioSettings {
  master: number;
  music: number;
  effects: number;
  muted: boolean;
}

const GENRE_PRESETS: Record<
  AudioGenre,
  { bpm: number; root: number; scale: number[]; wave: OscillatorType; pulse: number }
> = {
  synthwave: { bpm: 104, root: 110, scale: [0, 3, 5, 7, 10], wave: "sawtooth", pulse: 0.34 },
  chiptune: { bpm: 132, root: 147, scale: [0, 2, 4, 7, 9], wave: "square", pulse: 0.16 },
  "ambient-space": { bpm: 66, root: 98, scale: [0, 5, 7, 12], wave: "sine", pulse: 1.4 },
  breakbeat: { bpm: 150, root: 82, scale: [0, 3, 7, 10], wave: "triangle", pulse: 0.2 },
  "retro-funk": { bpm: 116, root: 123, scale: [0, 3, 5, 6, 7, 10], wave: "sawtooth", pulse: 0.24 },
};

const semitone = (root: number, steps: number) => root * Math.pow(2, steps / 12);

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private fxGain: GainNode | null = null;
  private loopTimer: number | null = null;
  private step = 0;
  private genre: AudioGenre = "synthwave";
  private intensity = 0.6;
  private tempoMultiplier = 1;
  settings: AudioSettings = { master: 0.7, music: 0.5, effects: 0.8, muted: false };

  get ready() {
    return this.ctx !== null;
  }

  init() {
    if (this.ctx || typeof window === "undefined") return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.fxGain = ctx.createGain();
    this.musicGain.connect(this.masterGain);
    this.fxGain.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
    this.applySettings(this.settings);
  }

  resume() {
    void this.ctx?.resume();
  }

  applySettings(settings: AudioSettings) {
    this.settings = settings;
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.fxGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(settings.muted ? 0 : settings.master, t, 0.05);
    this.musicGain.gain.setTargetAtTime(settings.music * 0.35, t, 0.05);
    this.fxGain.gain.setTargetAtTime(settings.effects * 0.6, t, 0.05);
  }

  /** Smoothly switch the backing track's genre without restarting hard. */
  setGenre(genre: AudioGenre, intensity = 0.6) {
    this.intensity = intensity;
    if (genre === this.genre) return;
    this.genre = genre;
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(0.02, t, 0.25);
    window.setTimeout(() => {
      if (!this.ctx || !this.musicGain) return;
      this.musicGain.gain.setTargetAtTime(this.settings.music * 0.35, this.ctx.currentTime, 0.4);
    }, 500);
  }

  setTempoMultiplier(multiplier: number) {
    this.tempoMultiplier = Math.min(2, Math.max(0.75, multiplier));
  }

  startMusic() {
    this.init();
    if (!this.ctx || this.loopTimer !== null) return;
    this.resume();
    const tick = () => {
      const preset = GENRE_PRESETS[this.genre];
      const beat = 60000 / (preset.bpm * this.tempoMultiplier) / 2;
      this.playStep();
      this.loopTimer = window.setTimeout(tick, beat);
    };
    tick();
  }

  stopMusic() {
    if (this.loopTimer !== null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  private playStep() {
    const ctx = this.ctx;
    const bus = this.musicGain;
    if (!ctx || !bus) return;
    const preset = GENRE_PRESETS[this.genre];
    const now = ctx.currentTime;
    const degree = preset.scale[this.step % preset.scale.length] ?? 0;
    const octave = this.step % 8 === 0 ? 12 : this.step % 5 === 0 ? 7 : 0;

    // bass / lead voice
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = preset.wave;
    osc.frequency.value = semitone(preset.root, degree + octave);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18 * this.intensity, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + preset.pulse);
    osc.connect(gain).connect(bus);
    osc.start(now);
    osc.stop(now + preset.pulse + 0.05);

    // pad shimmer every 4 steps
    if (this.step % 4 === 0) {
      const pad = ctx.createOscillator();
      const padGain = ctx.createGain();
      pad.type = "sine";
      pad.frequency.value = semitone(preset.root * 2, degree);
      padGain.gain.setValueAtTime(0, now);
      padGain.gain.linearRampToValueAtTime(0.07 * this.intensity, now + 0.3);
      padGain.gain.exponentialRampToValueAtTime(0.0008, now + 1.2);
      pad.connect(padGain).connect(bus);
      pad.start(now);
      pad.stop(now + 1.3);
    }

    // percussive click for rhythmic genres
    if ((this.genre === "breakbeat" || this.genre === "chiptune") && this.step % 2 === 1) {
      this.noiseBurst(0.06, 1800, 0.09, bus);
    }
    this.step += 1;
  }

  private noiseBurst(duration: number, filterHz: number, level: number, bus: AudioNode) {
    const ctx = this.ctx;
    if (!ctx) return;
    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterHz;
    const gain = ctx.createGain();
    gain.gain.value = level;
    src.connect(filter).connect(gain).connect(bus);
    src.start();
  }

  private blip(freqs: number[], duration: number, wave: OscillatorType, level = 0.25) {
    const ctx = this.ctx;
    const bus = this.fxGain;
    if (!ctx || !bus) return;
    const now = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      const start = now + i * (duration / Math.max(freqs.length, 1));
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(level, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0006, start + duration);
      osc.connect(gain).connect(bus);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    });
  }

  play(name: SoundName, extra = 0) {
    this.init();
    if (!this.ctx || this.settings.muted) return;
    switch (name) {
      case "hover":
        this.blip([880], 0.05, "sine", 0.08);
        break;
      case "select":
        this.blip([420, 300], 0.16, "sawtooth", 0.14);
        this.noiseBurst(0.18, 900, 0.05, this.fxGain!);
        break;
      case "pickup":
        this.blip([620], 0.07, "square", 0.12);
        break;
      case "place":
        this.blip([784, 1046], 0.12, "sine", 0.14);
        break;
      case "correct":
        this.blip([523, 659, 784, 1046], 0.16, "triangle", 0.16);
        break;
      case "wrong":
        this.blip([330, 262, 196], 0.2, "sine", 0.14);
        this.noiseBurst(0.9, 2600, 0.09, this.fxGain!);
        break;
      case "whoosh":
        this.noiseBurst(0.7, 700 + extra * 400, 0.1, this.fxGain!);
        break;
      case "recall-note":
        this.blip([330 * Math.pow(2, extra / 12)], 0.24, "square", 0.16);
        break;
      case "recall-note-fast":
        this.blip([392 * Math.pow(2, extra / 12)], 0.13, "square", 0.17);
        break;
      case "recall-evolved":
        this.blip([147, 220, 294, 440, 587], 0.24, "sawtooth", 0.2);
        this.noiseBurst(1.1, 520, 0.13, this.fxGain!);
        break;
      case "recall-win":
        this.blip([659, 784, 988, 1319], 0.18, "square", 0.18);
        break;
      case "recall-fail":
        this.blip([300, 220, 150, 90], 0.26, "sawtooth", 0.16);
        break;
      case "cycle-start":
        this.blip([110, 165, 220, 440], 0.24, "square", 0.18);
        break;
      case "cycle-turn":
        this.blip([660 + extra * 40], 0.045, "square", 0.07);
        break;
      case "cycle-crash":
        this.noiseBurst(0.75, 420, 0.2, this.fxGain!);
        this.blip([260, 150, 80], 0.3, "sawtooth", 0.18);
        break;
      case "cycle-win":
        this.blip([392, 523, 659, 784, 1046], 0.15, "square", 0.16);
        break;
      case "maze-start":
        this.blip([147, 220, 294, 440], 0.18, "square", 0.16);
        break;
      case "maze-pellet":
        this.blip([740 + (extra % 4) * 55], 0.035, "square", 0.055);
        break;
      case "maze-power":
        this.blip([220, 330, 494, 659], 0.14, "sawtooth", 0.15);
        break;
      case "maze-ghost":
        this.blip([988, 784, 1175], 0.12, "square", 0.14);
        break;
      case "maze-hit":
        this.blip([294, 220, 147], 0.2, "triangle", 0.15);
        break;
      case "maze-win":
        this.blip([523, 659, 784, 1046, 1319], 0.15, "square", 0.17);
        break;
      case "maze-lose":
        this.noiseBurst(0.6, 360, 0.16, this.fxGain!);
        this.blip([247, 165, 110], 0.26, "sawtooth", 0.15);
        break;
      case "path-link":
        this.blip([1560 - extra * 40, 980 - extra * 30], 0.11, "sawtooth", 0.13);
        this.noiseBurst(0.14, 3200, 0.05, this.fxGain!);
        break;
      case "path-clear":
        this.blip([523, 784, 1046, 1568, 2093], 0.13, "square", 0.17);
        break;
      case "stage-clear":
        this.blip([440, 660, 880, 1320], 0.16, "triangle", 0.17);
        break;
      case "stage-fail":
        this.blip([392, 262, 175, 110], 0.24, "sawtooth", 0.16);
        this.noiseBurst(0.5, 480, 0.12, this.fxGain!);
        break;
      case "gauntlet-start":
        this.blip([98, 147, 220, 330, 494], 0.2, "sawtooth", 0.18);
        break;
      case "brain-overload":
        this.blip([196, 294, 440, 659, 988, 1319], 0.22, "square", 0.19);
        this.noiseBurst(1.6, 340, 0.2, this.fxGain!);
        break;
      case "launch":
        this.noiseBurst(2.4, 260, 0.22, this.fxGain!);
        this.blip([131, 165, 196, 262, 330, 392], 0.5, "triangle", 0.18);
        break;
    }
  }
}

export const audio = new AudioManager();
