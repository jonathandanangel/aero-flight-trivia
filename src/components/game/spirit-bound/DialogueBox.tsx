import { useEffect, useRef, useState } from "react";

type Props = {
  name?: string;
  lines: string[];
  onDone: () => void;
};

export function DialogueBox({ name, lines, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState("");
  const full = lines[idx] ?? "";
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 22);
    return () => window.clearInterval(id);
  }, [full]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!["z", "Z", "Enter", " ", "x", "X"].includes(e.key)) return;
      e.preventDefault();
      if (shown.length < full.length) {
        setShown(full);
        return;
      }
      if (idx + 1 < lines.length) setIdx(idx + 1);
      else doneRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, full, idx, lines.length]);

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3">
      <div className="pointer-events-auto border-4 border-game-yellow bg-[#201808] p-4 shadow-[0_0_0_4px_#181010,inset_0_0_0_2px_#705018]">
        {name && <div className="mb-2 text-[10px] tracking-widest text-game-yellow">{name}</div>}
        <p className="min-h-[3.2em] whitespace-pre-line text-[11px] leading-relaxed text-[#f8f0c8]">
          {shown}
          <span className="animate-pulse">▲</span>
        </p>
        <div className="mt-2 text-right text-[9px] text-game-yellow/70">
          {idx + 1}/{lines.length} &nbsp; Z ▼
        </div>
      </div>
    </div>
  );
}
