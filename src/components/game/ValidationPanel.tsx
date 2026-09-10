import * as React from "react";
import { runValidation } from "@/game/validate";
import { cn } from "@/lib/utils";

export function ValidationPanel({ onBack }: { onBack: () => void }) {
  const rules = React.useMemo(() => runValidation(), []);
  const failing = rules.filter((r) => !r.passed);

  return (
    <div className="panel mx-auto w-full max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-cyan text-glow">QUESTION BANK VALIDATION</h2>
        <button type="button" onClick={onBack} className="rounded-md border border-border px-3 py-1 font-mono text-xs">
          Back
        </button>
      </div>
      <p className={cn("mt-2 font-mono text-sm", failing.length ? "text-orange" : "text-mint")}>
        {failing.length ? `${failing.length} rule(s) failing` : "All checks passed"}
      </p>
      <ul className="mt-4 space-y-2">
        {rules.map((r) => (
          <li key={r.name} className="rounded-md border border-border bg-deepblue/60 p-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm">{r.name}</span>
              <span className={cn("font-mono text-xs", r.passed ? "text-mint" : "text-orange")}>
                {r.passed ? "PASS" : "FAIL"}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{r.detail}</p>
            {!r.passed && r.failingIds.length > 0 && (
              <p className="mt-1 break-words font-mono text-xs text-orange">{r.failingIds.join(", ")}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
