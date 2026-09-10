import * as React from "react";
import { useGame, type Settings } from "@/game/store";

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label} · {Math.round(value * 100)}%
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-cyan"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-deepblue/60 px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-cyan" />
    </label>
  );
}

export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { settings, setSettings } = useGame();
  const set = (patch: Partial<Settings>) => setSettings(patch);

  return (
    <div className="panel mx-auto w-full max-w-xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-cyan text-glow">SETTINGS</h2>
        <button type="button" onClick={onBack} className="rounded-md border border-border px-3 py-1 font-mono text-xs">
          Back
        </button>
      </div>
      <Slider label="Master volume" value={settings.master} onChange={(master) => set({ master })} />
      <Slider label="Music" value={settings.music} onChange={(music) => set({ music })} />
      <Slider label="Effects" value={settings.effects} onChange={(effects) => set({ effects })} />
      <Toggle label="Mute all audio" checked={settings.muted} onChange={(muted) => set({ muted })} />
      <Toggle label="CRT scanlines" checked={settings.scanlines} onChange={(scanlines) => set({ scanlines })} />
      <Toggle label="Reduced motion" checked={settings.reducedMotion} onChange={(reducedMotion) => set({ reducedMotion })} />
      <Toggle label="No timers" checked={settings.noTimer} onChange={(noTimer) => set({ noTimer })} />
      <label className="block">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Light-rider interstitials
        </span>
        <select
          value={settings.interstitials}
          onChange={(e) => set({ interstitials: e.target.value as Settings["interstitials"] })}
          className="mt-1 w-full rounded-md border border-input bg-midnight px-3 py-2 text-sm"
        >
          <option value="full">Full (2 seconds)</option>
          <option value="short">Short</option>
          <option value="off">Off</option>
        </select>
      </label>
    </div>
  );
}
