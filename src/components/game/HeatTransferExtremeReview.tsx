import type { Question } from "@/game/types";

export interface HtLogEntry {
  id: string;
  given: string;
  ok: boolean;
}

export function HeatTransferExtremeReview({
  questions,
  log,
  score,
  onRestart,
  onMenu,
}: {
  questions: Question[];
  log: HtLogEntry[];
  score: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const total = questions.length;
  const btn =
    "rounded-lg border border-[#ff2a2a]/70 bg-deepblue/70 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-[#ff2a2a] hover:bg-[#ff2a2a]/20";

  return (
    <div className="ht-extreme-shell mx-auto w-full max-w-3xl space-y-5">
      <div className="panel p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#ff2a2a]">
          Heat Transfer Extreme Bananza
        </p>
        <h2 className="mt-2 font-display text-3xl text-[#ff2a2a] text-glow">
          SCORE {score} / {total}
        </h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" className={btn} onClick={onRestart}>
            Restart course
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
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#ff2a2a]">
                Question {index + 1} · {question.category} · {entry?.ok ? "Correct" : "Review"}
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
