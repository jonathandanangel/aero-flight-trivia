import type { Question } from "@/game/types";

export interface HtIntroLogEntry {
  id: string;
  given: string;
  ok: boolean;
}

export function HeatTransferIntroReview({
  questions,
  log,
  score,
  onRestart,
  onContinueExtreme,
  onMenu,
}: {
  questions: Question[];
  log: HtIntroLogEntry[];
  score: number;
  onRestart: () => void;
  onContinueExtreme: () => void;
  onMenu: () => void;
}) {
  const total = questions.length;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const message =
    pct >= 90
      ? "Excellent. You can identify the principal heat-transfer modes, rate equations, and energy-balance terms."
      : pct >= 80
        ? "Strong understanding. Review the equations or physical situations that were missed."
        : pct >= 70
          ? "Good progress. Revisit Table 1.5 and the visual identification stage."
          : pct >= 60
            ? "Developing understanding. Review each physical mechanism before attempting equation-selection questions again."
            : "Restart with the Three Modes stage and use the hint on every unfamiliar concept.";

  const btn =
    "rounded-lg border border-[#ff8c1a]/70 bg-deepblue/70 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-[#ff8c1a] hover:bg-[#ff8c1a]/20";

  return (
    <div className="ht-intro-shell mx-auto w-full max-w-3xl space-y-5">
      <div className="panel p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#ff8c1a]">
          Heat Transfer Intro
        </p>
        <h2 className="mt-2 font-display text-3xl text-[#ff8c1a] text-glow">
          SCORE {score} / {total}
        </h2>
        <p className="mt-2 font-mono text-sm text-mint">{pct}% · {message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" className={btn} onClick={onRestart}>
            Restart campaign
          </button>
          <button type="button" className={btn} onClick={onContinueExtreme}>
            Continue to Heat Transfer Extreme
          </button>
          <button type="button" className={btn} onClick={onMenu}>
            Main menu
          </button>
        </div>
      </div>

      <ol className="space-y-3">
        {questions.map((question, index) => {
          const entry = log.find((item) => item.id === question.id);
          return (
            <li key={question.id} className="panel space-y-2 p-4 text-left">
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#ff8c1a]">
                Question {index + 1} · {question.setId} · {entry?.ok ? "Correct" : "Review"}
              </p>
              <p className="font-display text-sm text-moon">{question.prompt}</p>
              {entry?.given && (
                <p className="font-mono text-xs text-muted-foreground">Your answer: {entry.given}</p>
              )}
              <p className="font-mono text-xs text-mint">
                Correct: {question.correctAnswer.join(" · ")}
              </p>
              <p className="text-sm text-moon/80">{question.explanation}</p>
              {question.formula && <p className="font-mono text-xs text-cyan">{question.formula}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
