import * as React from "react";
import { formatNumber } from "@/game/numerical-extreme";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-lg border border-cyan/40 bg-deepblue/80 px-3 py-2 font-mono text-xs text-moon outline-none transition placeholder:text-muted-foreground hover:border-cyan/60 focus:border-cyan focus:ring-1 focus:ring-cyan/30";

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-cyan/40 bg-deepblue/70 shadow-[0_0_28px_rgba(34,211,238,0.08)]",
        className,
      )}
    >
      {(title || eyebrow || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-cyan/25 px-4 py-3">
          <div>
            {eyebrow && (
              <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-magenta">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-display text-sm uppercase tracking-[0.14em] text-cyan">
                {title}
              </h2>
            )}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {hint && <span className="normal-case tracking-normal text-amber/80">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function NumberInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      className={cn(controlClass, "tabular-nums", className)}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(controlClass, "min-h-24 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlClass, "appearance-none", className)} {...props} />;
}

export function RunButton({
  loading,
  children = "Run analysis",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={loading || props.disabled}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-lg border border-cyan/60 bg-cyan/20 px-4 py-2.5 font-display text-xs uppercase tracking-[0.2em] text-cyan shadow-[0_0_24px_rgba(34,211,238,0.18)] transition hover:bg-cyan/30 hover:text-moon disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {loading ? "Computing…" : children}
    </button>
  );
}

export function GhostButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-cyan/30 bg-deepblue/50 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-moon/80 transition hover:border-amber/50 hover:text-amber disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Metric({
  label,
  value,
  detail,
  accent = "cyan",
}: {
  label: string;
  value: string | number | null | undefined;
  detail?: string;
  accent?: "cyan" | "magenta" | "amber" | "moon";
}) {
  const colors = {
    cyan: "border-cyan/30 from-cyan/15 text-cyan",
    magenta: "border-magenta/30 from-magenta/15 text-magenta",
    amber: "border-amber/30 from-amber/15 text-amber",
    moon: "border-moon/20 from-moon/10 text-moon",
  };
  const display = typeof value === "number" ? formatNumber(value) : (value ?? "—");
  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br to-transparent p-3",
        colors[accent],
      )}
    >
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-base font-semibold tabular-nums">{display}</p>
      {detail && <p className="mt-1 font-mono text-[10px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-magenta/40 bg-magenta/10 px-3 py-2.5 font-mono text-xs text-magenta">
      {message}
    </div>
  );
}
