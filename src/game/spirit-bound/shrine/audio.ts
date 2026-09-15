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
 * Greenvale stroll — one optimistic EarthBound-town *feel* loop (original, not licensed).
 */
const GREENVALE = {
  lead: [523, 587, 659, 523, 0, 659, 698, 784, 698, 659, 587, 523, 0, 0, 392, 440, 523, 587, 659, 523, 587, 659, 784, 659, 587, 523, 440, 392, 523, 0, 0, 0],
  bass: [130, 0, 130, 0, 196, 0, 196, 0, 146, 0, 146, 0, 220, 0, 196, 0, 174, 0, 174, 0, 130, 0, 196, 0, 164, 0, 196, 0, 130, 0, 98, 0],
  step: 0.255,
};

type Theme = { lead: number[]; bass: number[]; step: number };

/** Stretch a short motif into an EarthBound-town-length track (~90–110s). */
function stretchTheme(motif: Theme, targetSec = 100): Theme {
  const onePass = Math.max(1, motif.lead.length) * motif.step;
  const repeats = Math.max(1, Math.ceil(targetSec / onePass));
  const lead: number[] = [];
  const bass: number[] = [];
  for (let r = 0; r < repeats; r++) {
    // Slight A / A' / B variation so long plays don't feel stuck.
    const lift = r % 3 === 2 ? 1.122 : r % 3 === 1 ? 1 : 0.944; // ~±2 semitones-ish on lead rests kept
    for (let i = 0; i < motif.lead.length; i++) {
      const L = motif.lead[i] ?? 0;
      const B = motif.bass[i % motif.bass.length] ?? 0;
      lead.push(L > 0 ? Math.round(L * (r % 3 === 0 ? 1 : lift)) : 0);
      bass.push(B);
    }
    // short breath between phrase blocks
    for (let k = 0; k < 4; k++) {
      lead.push(0);
      bass.push(0);
    }
  }
  return { lead, bass, step: motif.step };
}

/**
 * Measured from the reference Onett town-theme MP3 (~117.75 BPM).
 * Eighth-note grid = 60 / 117.75 / 2 ≈ 0.2548s. Original motifs only —
 * inspired by cheerful SNES town-theme *feel*, not a licensed copy.
 */
const TOWN_BPM = 117.75;
const TOWN_STEP = 60 / TOWN_BPM / 2; // ~0.2548s eighths
const TOWN_THEME_SEC = 152; // ~full playthrough length of the reference track

/** Bounce bass: root–rest–fifth–rest pattern (town stroll backbone). */
function townBass(roots: number[]): number[] {
  const out: number[] = [];
  for (const r of roots) {
    const fifth = Math.round(r * 1.5);
    out.push(r, 0, fifth, 0);
  }
  return out;
}

/**
 * Ten+ original grasslands themes — same beat family, different melodies.
 * Each stretch ~152s (length of a typical full town-theme playthrough).
 */
const GRASSLAND_MOTIFS: Theme[] = [
  {
    // 1 · sunny porch
    lead: [
      523, 523, 659, 784, 659, 587, 523, 0, 440, 523, 587, 659, 523, 440, 392, 0, 587, 659, 784, 880, 784, 659, 587, 0, 523, 587, 659, 523, 440, 392, 523, 0, 659, 784, 659, 587, 523, 587, 659, 0, 784, 659, 523, 440, 523, 659, 784, 0, 440, 523, 659, 784, 659, 523, 440, 0, 523, 392, 440, 523, 587, 659, 523, 0,
    ],
    bass: townBass([131, 165, 147, 196, 131, 110, 147, 131, 131, 165, 147, 196, 110, 131, 98, 131]),
    step: TOWN_STEP,
  },
  {
    // 2 · bike path
    lead: [
      659, 784, 880, 784, 659, 587, 523, 0, 587, 659, 784, 659, 523, 440, 523, 0, 784, 880, 988, 880, 784, 698, 659, 0, 523, 587, 659, 784, 659, 587, 523, 0, 880, 784, 698, 659, 587, 523, 440, 0, 523, 659, 784, 880, 784, 659, 523, 0, 698, 784, 659, 523, 587, 659, 784, 0, 440, 523, 587, 659, 523, 440, 392, 0,
    ],
    bass: townBass([165, 196, 131, 165, 196, 247, 165, 131, 165, 196, 147, 165, 131, 196, 110, 165]),
    step: TOWN_STEP,
  },
  {
    // 3 · lemonade stand
    lead: [
      392, 523, 659, 523, 440, 523, 659, 0, 349, 440, 523, 659, 523, 440, 392, 0, 523, 587, 659, 784, 659, 587, 523, 0, 440, 523, 587, 659, 523, 440, 392, 0, 659, 587, 523, 440, 392, 440, 523, 0, 587, 659, 784, 659, 523, 440, 392, 0, 440, 523, 659, 784, 880, 784, 659, 0, 523, 440, 392, 440, 523, 587, 659, 0,
    ],
    bass: townBass([98, 131, 110, 147, 98, 131, 87, 110, 98, 147, 131, 165, 110, 147, 98, 131]),
    step: TOWN_STEP,
  },
  {
    // 4 · picnic blanket
    lead: [
      784, 659, 523, 659, 784, 880, 784, 0, 698, 784, 880, 784, 659, 587, 523, 0, 880, 784, 698, 659, 587, 659, 784, 0, 523, 659, 784, 988, 784, 659, 523, 0, 880, 988, 880, 784, 698, 659, 587, 0, 523, 587, 659, 784, 880, 784, 659, 0, 698, 659, 587, 523, 587, 659, 784, 0, 523, 440, 523, 659, 784, 880, 784, 0,
    ],
    bass: townBass([196, 131, 175, 165, 196, 247, 165, 131, 220, 175, 165, 196, 131, 165, 196, 247]),
    step: TOWN_STEP,
  },
  {
    // 5 · sunrise bus stop
    lead: [
      440, 494, 523, 587, 659, 587, 523, 0, 523, 587, 659, 698, 784, 698, 659, 0, 587, 659, 784, 880, 784, 659, 587, 0, 523, 440, 392, 440, 523, 587, 659, 0, 784, 698, 659, 587, 523, 494, 440, 0, 523, 587, 659, 784, 880, 784, 659, 0, 587, 523, 494, 523, 587, 659, 784, 0, 440, 523, 587, 659, 523, 440, 392, 0,
    ],
    bass: townBass([110, 147, 131, 165, 147, 196, 131, 110, 110, 165, 196, 220, 147, 165, 98, 110]),
    step: TOWN_STEP,
  },
  {
    // 6 · mailbox skip
    lead: [
      523, 659, 523, 784, 659, 523, 440, 0, 587, 784, 659, 523, 587, 659, 784, 0, 440, 523, 659, 880, 784, 659, 523, 0, 392, 523, 659, 784, 659, 523, 392, 0, 784, 659, 587, 523, 659, 784, 880, 0, 523, 440, 523, 659, 784, 659, 523, 0, 587, 523, 440, 392, 523, 659, 784, 0, 659, 523, 440, 523, 659, 784, 523, 0,
    ],
    bass: townBass([131, 196, 165, 131, 147, 220, 196, 131, 110, 165, 196, 131, 98, 147, 131, 165]),
    step: TOWN_STEP,
  },
  {
    // 7 · sidewalk chalk
    lead: [
      659, 659, 784, 659, 587, 523, 587, 0, 784, 784, 880, 784, 659, 587, 659, 0, 523, 587, 659, 784, 880, 784, 659, 0, 440, 523, 587, 659, 523, 440, 392, 0, 880, 784, 659, 587, 659, 784, 880, 0, 523, 659, 523, 440, 523, 587, 659, 0, 784, 659, 523, 587, 659, 784, 988, 0, 784, 659, 523, 440, 523, 659, 784, 0,
    ],
    bass: townBass([165, 165, 196, 131, 165, 247, 196, 131, 147, 196, 165, 110, 165, 196, 131, 165]),
    step: TOWN_STEP,
  },
  {
    // 8 · creek bridge
    lead: [
      349, 392, 440, 523, 440, 392, 349, 0, 392, 440, 523, 659, 523, 440, 392, 0, 440, 523, 587, 659, 587, 523, 440, 0, 523, 587, 659, 784, 659, 523, 440, 0, 392, 523, 659, 523, 440, 392, 349, 0, 523, 440, 392, 440, 523, 659, 784, 0, 659, 587, 523, 440, 523, 587, 659, 0, 440, 392, 349, 392, 440, 523, 392, 0,
    ],
    bass: townBass([87, 110, 98, 131, 110, 147, 98, 87, 110, 131, 147, 165, 98, 131, 87, 110]),
    step: TOWN_STEP,
  },
  {
    // 9 · evening porch light
    lead: [
      523, 440, 523, 659, 587, 523, 440, 0, 392, 440, 523, 587, 659, 587, 523, 0, 440, 523, 659, 784, 659, 523, 440, 0, 523, 587, 659, 523, 440, 392, 440, 0, 659, 587, 523, 440, 523, 659, 784, 0, 880, 784, 659, 587, 523, 587, 659, 0, 440, 523, 587, 659, 523, 440, 392, 0, 523, 659, 784, 659, 523, 440, 523, 0,
    ],
    bass: townBass([131, 110, 98, 131, 147, 165, 131, 110, 131, 165, 196, 147, 110, 131, 98, 131]),
    step: TOWN_STEP,
  },
  {
    // 10 · kite hill
    lead: [
      784, 880, 784, 659, 784, 880, 988, 0, 659, 784, 880, 784, 659, 523, 659, 0, 523, 659, 784, 880, 784, 659, 523, 0, 440, 523, 659, 784, 880, 784, 659, 0, 988, 880, 784, 659, 587, 659, 784, 0, 523, 587, 659, 784, 659, 523, 440, 0, 784, 659, 587, 523, 587, 659, 784, 0, 880, 784, 659, 523, 659, 784, 880, 0,
    ],
    bass: townBass([196, 165, 131, 196, 147, 165, 131, 110, 196, 247, 165, 131, 175, 196, 165, 196]),
    step: TOWN_STEP,
  },
  {
    // 11 · neighborhood bounce (extra)
    lead: [
      523, 587, 659, 784, 659, 523, 587, 0, 440, 523, 659, 784, 880, 784, 659, 0, 392, 523, 659, 523, 440, 523, 659, 0, 587, 659, 784, 880, 784, 659, 523, 0, 659, 523, 440, 523, 659, 784, 880, 0, 523, 440, 392, 440, 523, 659, 784, 0, 440, 523, 587, 659, 784, 659, 523, 0, 587, 523, 440, 392, 523, 659, 523, 0,
    ],
    bass: townBass([131, 147, 165, 196, 110, 131, 98, 131, 165, 131, 110, 147, 131, 196, 165, 131]),
    step: TOWN_STEP,
  },
  {
    // 12 · corner store jingle (extra)
    lead: [
      659, 523, 659, 784, 880, 784, 659, 0, 523, 440, 523, 659, 784, 659, 523, 0, 784, 659, 587, 659, 784, 880, 784, 0, 440, 523, 587, 659, 523, 587, 659, 0, 880, 784, 659, 523, 440, 523, 659, 0, 784, 880, 784, 659, 523, 440, 523, 0, 587, 659, 784, 659, 523, 440, 392, 0, 523, 659, 784, 880, 784, 659, 523, 0,
    ],
    bass: townBass([165, 131, 196, 165, 147, 196, 131, 165, 110, 165, 196, 131, 147, 165, 98, 131]),
    step: TOWN_STEP,
  },
];

const GRASSLAND_THEMES: Theme[] = GRASSLAND_MOTIFS.map((m) => stretchTheme(m, TOWN_THEME_SEC));

let grasslandsPlaylistIndex = 0;

function startThemeLoop(
  lead: number[],
  bass: number[],
  stepMs: number,
  opts?: { loopForever?: boolean; onComplete?: () => void },
) {
  const ac = context();
  if (!ac) return;
  void ac.resume();
  stopBurnLoop();
  // Clear prior music without calling stopAmbient recursion into a new start.
  if (music) {
    try {
      music.stop();
    } catch {
      /* already stopped */
    }
    music = null;
  }

  const gain = ac.createGain();
  gain.gain.value = 0.04;
  gain.connect(ac.destination);

  const loopForever = opts?.loopForever ?? true;
  const totalSteps = lead.length;
  let step = 0;
  let finished = false;
  let timer = 0;

  const tick = () => {
    if (finished) return;
    const t = ac.currentTime;
    const L = lead[step % lead.length] ?? 0;
    const B = bass[step % bass.length] ?? 0;
    if (L > 0) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "square";
      o.frequency.value = L;
      g.gain.setValueAtTime(0.038, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + stepMs * 0.85);
      o.connect(g);
      g.connect(gain);
      o.start(t);
      o.stop(t + stepMs);
    }
    if (B > 0) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = B;
      g.gain.setValueAtTime(0.045, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + stepMs * 1.05);
      o.connect(g);
      g.connect(gain);
      o.start(t);
      o.stop(t + stepMs * 1.1);
    }
    if (step % 8 === 0) {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = 180;
      g.gain.setValueAtTime(0.018, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g);
      g.connect(gain);
      o.start(t);
      o.stop(t + 0.1);
    }
    step += 1;
    if (!loopForever && step >= totalSteps) {
      finished = true;
      window.clearInterval(timer);
      music = null;
      opts?.onComplete?.();
    }
  };

  tick();
  timer = window.setInterval(tick, stepMs * 1000);
  music = {
    gain,
    timer,
    stop: () => {
      finished = true;
      window.clearInterval(timer);
    },
  };
}

function playGrasslandsThemeAt(index: number) {
  const theme = GRASSLAND_THEMES[index % GRASSLAND_THEMES.length] ?? GRASSLAND_THEMES[0]!;
  grasslandsPlaylistIndex = index % GRASSLAND_THEMES.length;
  startThemeLoop(theme.lead, theme.bass, theme.step, {
    loopForever: false,
    onComplete: () => {
      playGrasslandsThemeAt(grasslandsPlaylistIndex + 1);
    },
  });
}

export function startMusic() {
  startThemeLoop(GREENVALE.lead, GREENVALE.bass, GREENVALE.step, { loopForever: true });
}

/** Entering grasslands — cycle all Onett-feel town themes (~152s / ~117.75 BPM each), then repeat. */
export function startGrasslandsMusic() {
  playGrasslandsThemeAt(0);
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
