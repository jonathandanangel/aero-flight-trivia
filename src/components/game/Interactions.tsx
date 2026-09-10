import * as React from "react";
import type { Question } from "@/game/types";
import { stableShuffle } from "@/game/answer";
import { audio } from "@/game/audio";
import { Diagram } from "./Diagram";
import { cn } from "@/lib/utils";

export interface InteractionProps {
  question: Question;
  answer: string[];
  setAnswer: (next: string[]) => void;
  locked: boolean;
}

const tokenClass =
  "rounded-md border border-cyan/50 bg-deepblue/80 px-3 py-2 font-mono text-sm text-cyan transition-colors hover:bg-cyan/20 disabled:opacity-40";

const blankClass =
  "mx-1 inline-flex min-w-[86px] items-center justify-center rounded-md border-b-2 border-dashed border-amber/70 bg-midnight/70 px-2 py-1 font-mono text-sm text-moon";

function ChoiceList({ question, answer, setAnswer, locked }: InteractionProps) {
  const choices = question.choices ?? [];
  React.useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      const idx = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
      if (idx >= 0 && idx < choices.length) {
        audio.play("select");
        setAnswer([choices[idx]!]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choices, locked, setAnswer]);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {choices.map((c, i) => {
        const active = answer[0] === c;
        return (
          <button
            key={c}
            type="button"
            disabled={locked}
            onClick={() => {
              audio.play("select");
              setAnswer([c]);
            }}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
              active
                ? "border-mint bg-mint/15 text-moon glow-mint"
                : "border-border bg-deepblue/70 text-foreground hover:border-cyan hover:bg-cyan/10",
            )}
          >
            <span className="font-mono text-xs text-amber">{"ABCD"[i]}</span>
            <span>{c}</span>
          </button>
        );
      })}
    </div>
  );
}

function TokenSentence({ question, answer, setAnswer, locked }: InteractionProps) {
  const blanks = question.correctAnswer.length;
  const parts = question.sentenceParts ?? Array.from({ length: blanks + 1 }, () => "");
  const pool = React.useMemo(
    () => stableShuffle(question.draggableTokens ?? [], question.id),
    [question.draggableTokens, question.id],
  );
  const [active, setActive] = React.useState(0);

  const place = (token: string) => {
    if (locked) return;
    const next = [...answer];
    const slot = next[active] ? next.findIndex((v, i) => !v && i >= 0) : active;
    const target = slot === -1 ? active : slot;
    next[target] = token;
    for (let i = 0; i < blanks; i += 1) next[i] = next[i] ?? "";
    audio.play("place");
    setAnswer(next);
    const empty = next.findIndex((v) => !v);
    setActive(empty === -1 ? target : empty);
  };

  const clear = (i: number) => {
    if (locked) return;
    const next = [...answer];
    next[i] = "";
    audio.play("pickup");
    setAnswer(next);
    setActive(i);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span>{part}</span>
            {i < blanks && (
              <button
                type="button"
                disabled={locked}
                onClick={() => (answer[i] ? clear(i) : setActive(i))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const token = e.dataTransfer.getData("text/plain");
                  if (token) {
                    const next = [...answer];
                    next[i] = token;
                    audio.play("place");
                    setAnswer(next);
                  }
                }}
                aria-label={`Blank ${i + 1}${answer[i] ? `, filled with ${answer[i]}` : ", empty"}`}
                className={cn(blankClass, active === i && !locked && "border-cyan text-cyan glow-cyan")}
              >
                {answer[i] || "____"}
              </button>
            )}
          </React.Fragment>
        ))}
      </p>
      <div className="flex flex-wrap gap-2">
        {pool.map((t) => (
          <button
            key={t}
            type="button"
            draggable={!locked}
            onDragStart={(e) => e.dataTransfer.setData("text/plain", t)}
            disabled={locked || answer.includes(t)}
            onClick={() => place(t)}
            className={cn(tokenClass, answer.includes(t) && "opacity-40")}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Click a blank, then a token — or drag tokens in. Click a filled blank to clear it.
      </p>
    </div>
  );
}

function Hotspot({ question, answer, setAnswer, locked }: InteractionProps) {
  const targets = question.targets ?? [];
  return (
    <div className="space-y-3">
      <Diagram
        type={question.diagramType ?? "airfoil-geometry"}
        targets={targets}
        selected={answer}
        onTargetClick={
          locked
            ? undefined
            : (id) => {
                audio.play("select");
                setAnswer([id]);
              }
        }
      />
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={locked}
            onClick={() => {
              audio.play("select");
              setAnswer([t.id]);
            }}
            className={cn(tokenClass, answer[0] === t.id && "border-mint text-mint glow-mint")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Click a point on the diagram, or pick the same target from the list.
      </p>
    </div>
  );
}

function Placement({ question, answer, setAnswer, locked }: InteractionProps) {
  const targets = question.targets ?? [];
  const pool = React.useMemo(
    () => stableShuffle(question.draggableTokens ?? [], question.id),
    [question.draggableTokens, question.id],
  );
  const [active, setActive] = React.useState(0);
  const labels: Record<string, string> = {};
  targets.forEach((t, i) => {
    if (answer[i]) labels[t.id] = answer[i]!;
  });

  const assign = (token: string) => {
    if (locked) return;
    const next = [...answer];
    for (let i = 0; i < targets.length; i += 1) next[i] = next[i] ?? "";
    next[active] = token;
    audio.play("place");
    setAnswer(next);
    const empty = next.findIndex((v, i) => i < targets.length && !v);
    setActive(empty === -1 ? active : empty);
  };

  return (
    <div className="space-y-3">
      <Diagram
        type={question.diagramType ?? "airfoil-geometry"}
        targets={targets}
        labels={labels}
        selected={targets.filter((_, i) => i === active).map((t) => t.id)}
        onTargetClick={locked ? undefined : (id) => setActive(targets.findIndex((t) => t.id === id))}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {targets.map((t, i) => (
          <button
            key={t.id}
            type="button"
            disabled={locked}
            onClick={() => setActive(i)}
            className={cn(
              "flex items-center justify-between rounded-md border px-3 py-2 text-sm",
              active === i ? "border-cyan bg-cyan/10 text-cyan" : "border-border bg-deepblue/60",
            )}
          >
            <span>{t.label}</span>
            <span className="font-mono text-xs text-amber">{answer[i] || "—"}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((t) => (
          <button
            key={t}
            type="button"
            disabled={locked}
            onClick={() => assign(t)}
            className={cn(tokenClass, answer.includes(t) && "opacity-40")}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Select a slot, then choose the label or vector that belongs there.
      </p>
    </div>
  );
}

function Sequencing({ question, answer, setAnswer, locked }: InteractionProps) {
  const steps = question.steps ?? [];
  const order = answer.length === steps.length && answer.every(Boolean)
    ? answer
    : stableShuffle(steps, question.id + "seq");

  React.useEffect(() => {
    if (answer.length !== steps.length || answer.some((a) => !a)) setAnswer(order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (locked || j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j]!, next[i]!];
    audio.play("pickup");
    setAnswer(next);
  };

  return (
    <ol className="space-y-2">
      {order.map((s, i) => (
        <li key={s} className="flex items-center gap-2 rounded-md border border-border bg-deepblue/60 p-2">
          <span className="font-mono text-xs text-amber">{i + 1}</span>
          <span className="flex-1 text-sm">{s}</span>
          <button type="button" disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label={`Move "${s}" up`} className={tokenClass}>
            ▲
          </button>
          <button
            type="button"
            disabled={locked || i === order.length - 1}
            onClick={() => move(i, 1)}
            aria-label={`Move "${s}" down`}
            className={tokenClass}
          >
            ▼
          </button>
        </li>
      ))}
    </ol>
  );
}

function Matching({ question, answer, setAnswer, locked }: InteractionProps) {
  const pairs = question.pairs ?? [];
  const options = React.useMemo(
    () => stableShuffle(pairs.map((p) => p.right), question.id + "match"),
    [pairs, question.id],
  );
  return (
    <div className="space-y-2">
      {pairs.map((p, i) => (
        <div key={p.left} className="rounded-md border border-border bg-deepblue/60 p-3">
          <p className="font-mono text-sm text-cyan">{p.left}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                disabled={locked}
                onClick={() => {
                  const next = [...answer];
                  for (let k = 0; k < pairs.length; k += 1) next[k] = next[k] ?? "";
                  next[i] = o;
                  audio.play("select");
                  setAnswer(next);
                }}
                className={cn(tokenClass, answer[i] === o && "border-mint text-mint glow-mint")}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FillIn({ question, answer, setAnswer, locked }: InteractionProps) {
  return (
    <div className="space-y-2">
      <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground" htmlFor="fill-in">
        Type your answer
      </label>
      <input
        id="fill-in"
        autoComplete="off"
        disabled={locked}
        value={answer[0] ?? ""}
        onChange={(e) => setAnswer([e.target.value])}
        className="w-full rounded-md border border-input bg-midnight/80 px-3 py-2 font-mono text-base text-moon outline-none focus:border-cyan"
      />
    </div>
  );
}

export function Interaction(props: InteractionProps) {
  const { question } = props;
  switch (question.interactionType) {
    case "multiple-choice":
    case "compare-select":
      return <ChoiceList {...props} />;
    case "drag-drop":
    case "equation-builder":
      return <TokenSentence {...props} />;
    case "hotspot":
      return <Hotspot {...props} />;
    case "label-placement":
    case "vector-placement":
      return <Placement {...props} />;
    case "sequencing":
      return <Sequencing {...props} />;
    case "matching":
      return <Matching {...props} />;
    case "fill-in":
      return <FillIn {...props} />;
    default:
      return null;
  }
}
