import * as React from "react";

export interface TitleScreenProps {
  hasSave: boolean;
  onStart: () => void;
  onResume: () => void;
  onPractice: () => void;
  onArchive: () => void;
  onSettings: () => void;
  onValidate: () => void;
}

export function TitleScreen(p: TitleScreenProps) {
  const item =
    "w-full rounded-lg border border-cyan/50 bg-deepblue/70 px-5 py-3 text-left font-display text-sm uppercase tracking-[0.22em] text-cyan transition-colors hover:bg-cyan/20 hover:text-moon";

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-magenta">Flight Dynamics Trivia</p>
        <h1 className="mt-2 font-display text-4xl text-cyan text-glow sm:text-6xl">AEROGRID 99</h1>
        <p className="mt-3 font-mono text-sm text-muted-foreground">
          333 questions · 60 learning sets · Impact Archive
        </p>
        <p className="mt-1 font-mono text-xs text-amber">Press START to enable sound</p>
      </div>
      <div className="grid w-full max-w-sm gap-3">
        <button type="button" className={item} onClick={p.onStart}>
          Start new campaign
        </button>
        {p.hasSave && (
          <button type="button" className={item} onClick={p.onResume}>
            Resume
          </button>
        )}
        <button type="button" className={item} onClick={p.onPractice}>
          Practice mode
        </button>
        <button type="button" className={item} onClick={p.onArchive}>
          Impact Archive
        </button>
        <button type="button" className={item} onClick={p.onSettings}>
          Settings
        </button>
        <button type="button" className={item} onClick={p.onValidate}>
          Developer validation
        </button>
      </div>
      <p className="max-w-md font-mono text-[11px] leading-relaxed text-muted-foreground">
        Photosensitivity notice: this game uses neon flashes and light trails. Reduced-motion mode is
        available in Settings.
      </p>
    </div>
  );
}
