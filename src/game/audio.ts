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
  | "launch"
  | "numeric-tab"
  | "numeric-run"
  | "numeric-result"
  | "numeric-error";

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
  supersonic: { bpm: 178, root: 73, scale: [0, 1, 5, 6, 8, 11], wave: "sawtooth", pulse: 0.11 },
};

/** Five escalating turbulent tracks used by Aerodynamics Extreme. */
const SUPERSONIC_TRACKS: {
  bpm: number;
  root: number;
  scale: number[];
  wave: OscillatorType;
  pulse: number;
  turbulence: number;
}[] = [
  { bpm: 168, root: 73, scale: [0, 3, 5, 7, 10], wave: "sawtooth", pulse: 0.13, turbulence: 0.8 },
  { bpm: 182, root: 78, scale: [0, 1, 5, 6, 8], wave: "sawtooth", pulse: 0.115, turbulence: 1.05 },
  { bpm: 196, root: 82, scale: [0, 2, 3, 7, 9, 11], wave: "square", pulse: 0.1, turbulence: 1.35 },
  { bpm: 212, root: 87, scale: [0, 1, 4, 6, 7, 10], wave: "sawtooth", pulse: 0.088, turbulence: 1.7 },
  { bpm: 230, root: 92, scale: [0, 1, 3, 6, 8, 11], wave: "square", pulse: 0.075, turbulence: 2.1 },
];

/** Ten escalating wind/turbulence levels for Heat Transfer Extreme Bananza. */
const BANANZA_WIND_LEVELS: { bpm: number; turbulence: number }[] = [
  { bpm: 150, turbulence: 0.7 },
  { bpm: 162, turbulence: 0.9 },
  { bpm: 174, turbulence: 1.1 },
  { bpm: 186, turbulence: 1.3 },
  { bpm: 198, turbulence: 1.5 },
  { bpm: 210, turbulence: 1.75 },
  { bpm: 222, turbulence: 2.0 },
  { bpm: 234, turbulence: 2.3 },
  { bpm: 246, turbulence: 2.6 },
  { bpm: 260, turbulence: 3.0 },
];

const HT_BED_URL = {
  bananza: "/audio/ht-bananza-bed.mp3",
  intro: "/audio/ht-portal-bed.mp3",
} as const;

/** Bananza: Armageddon (from 34:20) → Portal OST → repeat. */
const BANANZA_PLAYLIST = [
  "/audio/ht-bananza-bed.mp3",
  "/audio/ht-bananza-portal.mp3",
] as const;

/** Title-screen playlist (low volume): Crystal Vista → Armageddon → Portal, then repeats. */
const TITLE_PLAYLIST = [
  "/audio/title-crystal-vista.mp3",
  "/audio/title-armageddon.mp3",
  "/audio/title-portal.mp3",
] as const;

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
  private extremeTrack = 0;
  private bedEl: HTMLAudioElement | null = null;
  private bedSource: MediaElementAudioSourceNode | null = null;
  private bedGain: GainNode | null = null;
  private bedActive = false;
  private bedVolumeScale = 0.85;
  private bedUrl: string | null = null;
  private bedPlaylist: readonly string[] | null = null;
  private bedPlaylistIndex = 0;
  private bedEndedHandler: (() => void) | null = null;
  private windTimer: number | null = null;
  private windActive = false;
  private windTrack = 0;
  private windStep = 0;
  private thermalTimer: number | null = null;
  private thermalActive = false;
  private thermalStep = 0;
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
    this.syncBedGain();
  }

  /** Smoothly switch the backing track's genre without restarting hard. */
  setGenre(genre: AudioGenre, intensity = 0.6) {
    if (this.bedActive) {
      this.intensity = intensity;
      this.genre = genre;
      return;
    }
    this.intensity = intensity;
    if (genre === this.genre) return;
    this.genre = genre;
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(0.02, t, 0.25);
    window.setTimeout(() => {
      if (!this.ctx || !this.musicGain || this.bedActive) return;
      this.musicGain.gain.setTargetAtTime(this.settings.music * 0.35, this.ctx.currentTime, 0.4);
    }, 500);
  }

  setTempoMultiplier(multiplier: number) {
    this.tempoMultiplier = Math.min(3, Math.max(0.75, multiplier));
  }

  /** Select one of the five escalating Aerodynamics Extreme turbulence tracks (0-4). */
  setExtremeTrack(index: number) {
    if (this.bedActive) return;
    const next = Math.min(SUPERSONIC_TRACKS.length - 1, Math.max(0, Math.round(index)));
    if (next === this.extremeTrack) return;
    this.extremeTrack = next;
    this.step = 0;
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(0.02, t, 0.12);
    window.setTimeout(() => {
      if (!this.ctx || !this.musicGain || this.bedActive) return;
      this.musicGain.gain.setTargetAtTime(this.settings.music * 0.35, this.ctx.currentTime, 0.25);
    }, 260);
  }

  private get activePreset() {
    if (this.genre === "supersonic") {
      const track = SUPERSONIC_TRACKS[this.extremeTrack]!;
      return { bpm: track.bpm, root: track.root, scale: track.scale, wave: track.wave, pulse: track.pulse };
    }
    return GENRE_PRESETS[this.genre];
  }

  startMusic() {
    this.init();
    if (!this.ctx || this.loopTimer !== null || this.bedActive) return;
    this.resume();
    const tick = () => {
      if (this.bedActive) {
        this.loopTimer = null;
        return;
      }
      const preset = this.activePreset;
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

  /**
   * Heat Transfer bed tracks.
   * Bananza: Armageddon (from 34:20) then Portal OST, looping between the two.
   * Intro: quieter Portal-bed background only.
   * Calling again while the same bed is already playing does not restart it.
   */
  startHeatTransferBed(mode: "bananza" | "intro") {
    this.bedVolumeScale = mode === "bananza" ? 0.95 : 0.28;
    if (mode === "bananza") {
      if (this.bedActive && this.bedPlaylist === BANANZA_PLAYLIST) {
        this.syncBedGain();
        void this.bedEl?.play().catch(() => undefined);
        return;
      }
      this.bedPlaylist = BANANZA_PLAYLIST;
      this.bedPlaylistIndex = 0;
      this.startBed(BANANZA_PLAYLIST[0]!, { loopSame: false });
      return;
    }
    if (this.bedActive && this.bedPlaylist === null && this.bedUrl === HT_BED_URL.intro) {
      this.syncBedGain();
      void this.bedEl?.play().catch(() => undefined);
      return;
    }
    this.bedPlaylist = null;
    this.bedPlaylistIndex = 0;
    this.startBed(HT_BED_URL.intro, { loopSame: true });
  }

  stopHeatTransferBed() {
    if (this.bedPlaylist === TITLE_PLAYLIST) return;
    if (!this.bedActive && this.bedPlaylist == null) return;
    this.bedPlaylist = null;
    this.bedPlaylistIndex = 0;
    this.stopBed();
  }

  /** Quiet title-screen playlist: Crystal Vista → Armageddon → Portal → repeat. */
  startTitlePlaylist() {
    if (this.bedActive && this.bedPlaylist === TITLE_PLAYLIST) {
      this.bedVolumeScale = 0.22;
      this.syncBedGain();
      void this.bedEl?.play().catch(() => undefined);
      return;
    }
    this.bedPlaylist = TITLE_PLAYLIST;
    this.bedPlaylistIndex = 0;
    this.bedVolumeScale = 0.22;
    this.startBed(TITLE_PLAYLIST[0]!, { loopSame: false });
  }

  stopTitlePlaylist() {
    if (this.bedPlaylist !== TITLE_PLAYLIST) return;
    this.bedPlaylist = null;
    this.bedPlaylistIndex = 0;
    this.stopBed();
  }

  private ensureBedElement(url: string) {
    this.init();
    if (!this.ctx || !this.musicGain) return null;
    this.resume();
    this.stopMusic();
    if (!this.bedEl) {
      this.bedEl = new Audio(url);
      this.bedEl.preload = "auto";
      this.bedSource = this.ctx.createMediaElementSource(this.bedEl);
      this.bedGain = this.ctx.createGain();
      this.bedSource.connect(this.bedGain);
      this.bedGain.connect(this.musicGain);
      this.bedUrl = url;
      this.bedEndedHandler = () => {
        if (!this.bedActive || !this.bedEl) return;
        if (this.bedPlaylist && this.bedPlaylist.length > 0) {
          this.bedPlaylistIndex = (this.bedPlaylistIndex + 1) % this.bedPlaylist.length;
          const next = this.bedPlaylist[this.bedPlaylistIndex]!;
          this.bedEl.loop = false;
          this.bedEl.src = next;
          this.bedUrl = next;
          this.bedEl.load();
          void this.bedEl.play().catch(() => undefined);
          return;
        }
        this.bedEl.currentTime = 0;
        void this.bedEl.play().catch(() => undefined);
      };
      this.bedEl.addEventListener("ended", this.bedEndedHandler);
    } else if (this.bedUrl !== url) {
      this.bedEl.pause();
      this.bedEl.src = url;
      this.bedUrl = url;
      this.bedEl.load();
    }
    return this.bedEl;
  }

  private startBed(url: string, opts: { loopSame: boolean }) {
    const el = this.ensureBedElement(url);
    if (!el) return;
    // Truncated MP3s often break native loop; ended-handler restarts / advances.
    el.loop = opts.loopSame;
    const wasPlaying = this.bedActive && !el.paused && !el.ended && this.bedUrl === url;
    this.bedActive = true;
    this.syncBedGain();
    if (wasPlaying) return;
    if (el.ended || el.paused) {
      el.currentTime = 0;
    }
    void el.play().catch(() => {
      /* autoplay may wait until a user gesture */
    });
  }

  private stopBed() {
    this.bedActive = false;
    if (this.bedEl) {
      this.bedEl.pause();
      this.bedEl.currentTime = 0;
    }
    if (this.bedGain && this.ctx) {
      this.bedGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Escalating wind / turbulence SFX (10 speed levels) under the Bananza bed.
   * Level advances from the game via setWindTrack(0..9).
   */
  startWindEscalation() {
    this.init();
    if (!this.ctx || this.windActive) return;
    this.resume();
    this.windActive = true;
    this.windStep = 0;
    this.scheduleWindTick();
  }

  stopWindEscalation() {
    this.windActive = false;
    if (this.windTimer !== null) {
      window.clearTimeout(this.windTimer);
      this.windTimer = null;
    }
  }

  /** Select wind intensity 0–9 (ten increasing rush speeds). */
  setWindTrack(index: number) {
    this.windTrack = Math.min(BANANZA_WIND_LEVELS.length - 1, Math.max(0, Math.round(index)));
  }

  /** Constant fire crackle + plasma-particle ambience for Bananza atmosphere. */
  startThermalAmbience() {
    this.init();
    if (!this.ctx || this.thermalActive) return;
    this.resume();
    this.thermalActive = true;
    this.thermalStep = 0;
    this.scheduleThermalTick();
  }

  stopThermalAmbience() {
    this.thermalActive = false;
    if (this.thermalTimer !== null) {
      window.clearTimeout(this.thermalTimer);
      this.thermalTimer = null;
    }
  }

  private scheduleWindTick() {
    if (!this.windActive || !this.ctx) return;
    const level = BANANZA_WIND_LEVELS[this.windTrack]!;
    const beat = 60000 / (level.bpm * this.tempoMultiplier) / 2;
    this.playWindStep();
    this.windTimer = window.setTimeout(() => this.scheduleWindTick(), beat);
  }

  /** Wind-only layer: rushing air and shock shrieks — no melodic bed. */
  private playWindStep() {
    const ctx = this.ctx;
    const bus = this.fxGain;
    if (!ctx || !bus || !this.windActive) return;
    const level = BANANZA_WIND_LEVELS[this.windTrack]!;
    const turbulence = level.turbulence;
    const intensity = Math.max(0.55, this.intensity);
    const now = ctx.currentTime;

    if (this.windStep % 2 === 1) {
      this.noiseBurst(0.045, 7200 + turbulence * 900, 0.07 * intensity * turbulence, bus);
    }
    const rushEvery = turbulence > 2.2 ? 3 : turbulence > 1.5 ? 4 : turbulence > 1.1 ? 6 : 8;
    if (this.windStep % rushEvery === 0) {
      this.noiseBurst(
        Math.max(0.3, 1.05 / turbulence),
        420 + Math.random() * 900 * turbulence,
        Math.min(0.4, 0.14 * intensity * turbulence),
        bus,
      );
    }
    if (this.windStep % (turbulence > 2.0 ? 6 : turbulence > 1.4 ? 8 : 16) === 3) {
      const shriek = ctx.createOscillator();
      const sg = ctx.createGain();
      shriek.type = "sawtooth";
      shriek.frequency.setValueAtTime(900, now);
      shriek.frequency.exponentialRampToValueAtTime(2600 * Math.min(1.8, turbulence), now + 0.5);
      sg.gain.setValueAtTime(0, now);
      sg.gain.linearRampToValueAtTime(0.04 * intensity * Math.min(2.4, turbulence), now + 0.08);
      sg.gain.exponentialRampToValueAtTime(0.0006, now + 0.6);
      shriek.connect(sg).connect(bus);
      shriek.start(now);
      shriek.stop(now + 0.65);
    }
    this.windStep += 1;
  }

  private scheduleThermalTick() {
    if (!this.thermalActive || !this.ctx) return;
    this.playThermalStep();
    this.thermalTimer = window.setTimeout(() => this.scheduleThermalTick(), 140);
  }

  /** Constant fire crackle + sparking plasma particles. */
  private playThermalStep() {
    const ctx = this.ctx;
    const bus = this.fxGain;
    if (!ctx || !bus || !this.thermalActive) return;
    const now = ctx.currentTime;
    const intensity = Math.max(0.5, this.intensity);

    // low fiery rumble / burning ambience
    if (this.thermalStep % 3 === 0) {
      this.noiseBurst(0.28 + Math.random() * 0.22, 180 + Math.random() * 220, 0.045 * intensity, bus);
    }
    // mid crackle pops
    if (this.thermalStep % 5 === 2) {
      this.noiseBurst(0.05 + Math.random() * 0.05, 900 + Math.random() * 1400, 0.035 * intensity, bus);
    }
    // plasma particles — short bright zips always present
    if (this.thermalStep % 2 === 0) {
      const zip = ctx.createOscillator();
      const zg = ctx.createGain();
      zip.type = Math.random() > 0.5 ? "square" : "sawtooth";
      const startF = 1800 + Math.random() * 4200;
      zip.frequency.setValueAtTime(startF, now);
      zip.frequency.exponentialRampToValueAtTime(Math.max(400, startF * (0.25 + Math.random() * 0.4)), now + 0.08);
      zg.gain.setValueAtTime(0, now);
      zg.gain.linearRampToValueAtTime(0.018 * intensity, now + 0.008);
      zg.gain.exponentialRampToValueAtTime(0.0005, now + 0.09);
      zip.connect(zg).connect(bus);
      zip.start(now);
      zip.stop(now + 0.1);
    }
    // occasional hotter plasma burst
    if (this.thermalStep % 11 === 7) {
      this.noiseBurst(0.12, 3500 + Math.random() * 2500, 0.05 * intensity, bus);
      const spark = ctx.createOscillator();
      const sg = ctx.createGain();
      spark.type = "triangle";
      spark.frequency.setValueAtTime(3200, now);
      spark.frequency.exponentialRampToValueAtTime(700, now + 0.2);
      sg.gain.setValueAtTime(0.03 * intensity, now);
      sg.gain.exponentialRampToValueAtTime(0.0005, now + 0.22);
      spark.connect(sg).connect(bus);
      spark.start(now);
      spark.stop(now + 0.25);
    }
    this.thermalStep += 1;
  }

  private syncBedGain() {
    if (!this.bedGain || !this.ctx) return;
    const level = this.settings.muted ? 0 : this.settings.music * this.bedVolumeScale;
    this.bedGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.08);
  }

  private playStep() {
    if (this.bedActive) return;
    const ctx = this.ctx;
    const bus = this.musicGain;
    if (!ctx || !bus) return;
    const preset = this.activePreset;
    const turbulence = this.genre === "supersonic" ? SUPERSONIC_TRACKS[this.extremeTrack]!.turbulence : 1;
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

    // supersonic: driving kick, hi-hat and rushing turbulence noise
    if (this.genre === "supersonic") {
      if (this.step % 2 === 0) {
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.type = "sine";
        kick.frequency.setValueAtTime(140, now);
        kick.frequency.exponentialRampToValueAtTime(42, now + 0.13);
        kickGain.gain.setValueAtTime(0.32 * this.intensity, now);
        kickGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);
        kick.connect(kickGain).connect(bus);
        kick.start(now);
        kick.stop(now + 0.2);
      } else {
        this.noiseBurst(0.045, 7200 + turbulence * 900, 0.08 * this.intensity * turbulence, bus);
      }
      // turbulent air rush sweeping every bar — faster and wilder on later tracks
      const rushEvery = turbulence > 1.5 ? 4 : turbulence > 1.1 ? 6 : 8;
      if (this.step % rushEvery === 0) {
        this.noiseBurst(
          Math.max(0.35, 1.1 / turbulence),
          420 + Math.random() * 900 * turbulence,
          Math.min(0.4, 0.16 * this.intensity * turbulence),
          bus,
        );
      }
      // shock-wave shriek
      if (this.step % (turbulence > 1.6 ? 8 : 16) === 7) {
        const shriek = ctx.createOscillator();
        const sg = ctx.createGain();
        shriek.type = "sawtooth";
        shriek.frequency.setValueAtTime(900, now);
        shriek.frequency.exponentialRampToValueAtTime(2600 * Math.min(1.6, turbulence), now + 0.5);
        sg.gain.setValueAtTime(0, now);
        sg.gain.linearRampToValueAtTime(0.05 * this.intensity * turbulence, now + 0.08);
        sg.gain.exponentialRampToValueAtTime(0.0006, now + 0.6);
        shriek.connect(sg).connect(bus);
        shriek.start(now);
        shriek.stop(now + 0.65);
      }
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
      case "gunshot":
        this.noiseBurst(0.09, 2400, 0.32, this.fxGain!);
        this.noiseBurst(0.32, 220, 0.24, this.fxGain!);
        this.blip([180, 90], 0.14, "square", 0.2);
        break;
      case "launch":
        this.noiseBurst(2.4, 260, 0.22, this.fxGain!);
        this.blip([131, 165, 196, 262, 330, 392], 0.5, "triangle", 0.18);
        break;
      case "numeric-tab":
        this.blip([880 + extra * 60, 1320 + extra * 60], 0.06, "square", 0.09);
        this.noiseBurst(0.1, 4200, 0.03, this.fxGain!);
        break;
      case "numeric-run":
        this.blip([196, 294, 440, 659], 0.09, "sawtooth", 0.14);
        this.noiseBurst(0.35, 1600, 0.07, this.fxGain!);
        break;
      case "numeric-result":
        this.blip([659, 880, 1175, 1568], 0.1, "triangle", 0.15);
        this.noiseBurst(0.2, 5200, 0.04, this.fxGain!);
        break;
      case "numeric-error":
        this.blip([330, 233, 165], 0.18, "sawtooth", 0.15);
        this.noiseBurst(0.4, 700, 0.09, this.fxGain!);
        break;
    }
  }
}

export const audio = new AudioManager();
