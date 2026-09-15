type Sfx = "select" | "move" | "invalid" | "success" | "fail" | "tick";

let ctx: AudioContext | null = null;
let music: { gain: GainNode; timer: number; stop: () => void } | null = null;

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
}

/** Original 8-bit loop — adventure square lead + warm bass, not a licensed theme. */
const LEAD = [523, 659, 784, 659, 698, 784, 880, 784, 659, 587, 523, 392, 523, 659, 587, 523];
const BASS = [130, 130, 196, 0, 146, 146, 196, 0, 174, 174, 220, 0, 130, 196, 164, 0];
const STEP = 0.18;

export function startMusic() {
  const ac = context();
  if (!ac || music) return;
  void ac.resume();
  const gain = ac.createGain();
  gain.gain.value = 0.045;
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
      g.gain.setValueAtTime(0.04, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 0.9);
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
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 1.1);
      o.connect(g);
      g.connect(gain);
      o.start(t);
      o.stop(t + STEP * 1.15);
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
  music.gain.gain.linearRampToValueAtTime(on ? 0.045 : 0.012, ac.currentTime + 0.35);
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
