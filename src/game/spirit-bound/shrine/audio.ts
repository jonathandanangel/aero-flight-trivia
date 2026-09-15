type Sfx = "select" | "move" | "invalid" | "success" | "fail" | "tick" | "burn" | "demonic";

let ctx: AudioContext | null = null;
let music: { gain: GainNode; timer: number; stop: () => void } | null = null;
let burnLoop: { gain: GainNode; timer: number; stop: () => void } | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.06, at = 0) {
  const ac = context();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.setValueAtTime(gain, ac.currentTime + at);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + at);
  osc.stop(ac.currentTime + at + dur + 0.02);
}

export function playSfx(kind: Sfx) {
  const ac = context();
  if (!ac) return;
  void ac.resume();
  if (kind === "select") beep(520, 0.07, "square", 0.05);
  if (kind === "move") {
    beep(380, 0.08, "triangle", 0.05);
    beep(620, 0.1, "square", 0.035, 0.05);
  }
  if (kind === "invalid") {
    beep(160, 0.12, "sawtooth", 0.05);
    beep(120, 0.16, "square", 0.04, 0.04);
  }
  if (kind === "success") {
    beep(392, 0.12, "square", 0.05);
    beep(523, 0.12, "square", 0.05, 0.1);
    beep(659, 0.18, "triangle", 0.06, 0.2);
    beep(784, 0.28, "square", 0.05, 0.32);
  }
  if (kind === "fail") {
    beep(220, 0.18, "triangle", 0.05);
    beep(165, 0.28, "sawtooth", 0.04, 0.12);
  }
  if (kind === "tick") beep(880, 0.04, "square", 0.03);
  if (kind === "burn") {
    beep(120, 0.08, "sawtooth", 0.06);
    beep(80, 0.2, "square", 0.05, 0.06);
    beep(60, 0.35, "triangle", 0.04, 0.12);
  }
}

/** Low demonic laugh after LORD PETER falls. */
export function playDemonicLaugh() {
  const ac = context();
  if (!ac) return;
  void ac.resume();
  const freqs = [110, 98, 87, 73, 65, 55];
  freqs.forEach((f, i) => {
    beep(f, 0.22, "sawtooth", 0.07, i * 0.18);
    beep(f * 1.5, 0.12, "square", 0.03, i * 0.18 + 0.05);
  });
}

export function playBurnSfx() {
  playSfx("burn");
}

/**
 * Original strolling overworld loop — bright C-major square lead + soft bass,
 * EarthBound-town *feel* (happy walk, ~118 BPM feel), not a licensed theme.
 */
const LEAD = [
  523, 587, 659, 523, 0, 659, 698, 784, 698, 659, 587, 523, 0, 0, 392, 440, 523, 587, 659, 523, 587, 659, 784, 659, 587, 523, 440, 392, 523, 0, 0, 0,
];
const BASS = [
  130, 0, 130, 0, 196, 0, 196, 0, 146, 0, 146, 0, 220, 0, 196, 0, 174, 0, 174, 0, 130, 0, 196, 0, 164, 0, 196, 0, 130, 0, 98, 0,
];
const STEP = 0.255; // ~117 BPM eighth notes

export function startMusic() {
  const ac = context();
  if (!ac) return;
  void ac.resume();
  stopBurnLoop();
  if (music) return;
  const gain = ac.createGain();
  gain.gain.value = 0.04;
  gain.connect(ac.destination);

  let step = 0;
  const tick = () => {
    const t = ac.currentTime;
    const lead = LEAD[step % LEAD.length] ?? 0;
    const bass = BASS[step % BASS.length] ?? 0;
    if (lead > 0) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "square";
      o.frequency.value = lead;
      g.gain.setValueAtTime(0.038, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 0.85);
      o.connect(g);
      g.connect(gain);
      o.start(t);
      o.stop(t + STEP);
    }
    if (bass > 0) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = bass;
      g.gain.setValueAtTime(0.045, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 1.05);
      o.connect(g);
      g.connect(gain);
      o.start(t);
      o.stop(t + STEP * 1.1);
    }
    // soft pulse "clap" every 4 bars — town stroll feel
    if (step % 8 === 0) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = 180;
      g.gain.setValueAtTime(0.02, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g);
      g.connect(gain);
      o.start(t);
      o.stop(t + 0.1);
    }
    step += 1;
  };

  tick();
  const timer = window.setInterval(tick, STEP * 1000);
  music = {
    gain,
    timer,
    stop: () => {
      window.clearInterval(timer);
    },
  };
}

export function startAmbient() {
  startMusic();
}

export function fadeAmbient(on: boolean) {
  const ac = context();
  if (!ac || !music) return;
  music.gain.gain.cancelScheduledValues(ac.currentTime);
  music.gain.gain.linearRampToValueAtTime(on ? 0.04 : 0.01, ac.currentTime + 0.35);
}

export function stopAmbient() {
  if (!music) return;
  try {
    music.stop();
  } catch {
    /* already stopped */
  }
  music = null;
}

/** Continuous crackle/hiss for the burning grasslands night — no music. */
export function startBurnLoop() {
  const ac = context();
  if (!ac) return;
  void ac.resume();
  stopAmbient();
  if (burnLoop) return;

  const gain = ac.createGain();
  gain.gain.value = 0.035;
  gain.connect(ac.destination);

  const tick = () => {
    const t = ac.currentTime;
    // low rumble
    const o1 = ac.createOscillator();
    const g1 = ac.createGain();
    o1.type = "sawtooth";
    o1.frequency.value = 45 + Math.random() * 25;
    g1.gain.setValueAtTime(0.04, t);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.35 + Math.random() * 0.2);
    o1.connect(g1);
    g1.connect(gain);
    o1.start(t);
    o1.stop(t + 0.55);
    // crackle pops
    for (let i = 0; i < 3; i++) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "square";
      o.frequency.value = 200 + Math.random() * 900;
      const at = t + Math.random() * 0.2;
      g.gain.setValueAtTime(0.012 + Math.random() * 0.02, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04 + Math.random() * 0.06);
      o.connect(g);
      g.connect(gain);
      o.start(at);
      o.stop(at + 0.12);
    }
  };

  tick();
  const timer = window.setInterval(tick, 280);
  burnLoop = {
    gain,
    timer,
    stop: () => {
      window.clearInterval(timer);
    },
  };
}

export function stopBurnLoop() {
  if (!burnLoop) return;
  try {
    burnLoop.stop();
  } catch {
    /* already stopped */
  }
  burnLoop = null;
}
