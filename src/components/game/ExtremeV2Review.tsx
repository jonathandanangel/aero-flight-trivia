import type { Question } from "@/game/types";

export interface ExtremeV2LogEntry {
  id: string;
  given: string;
  ok: boolean;
}

export function ExtremeV2Review({
  questions,
  log,
  score,
  onRestart,
  onMenu,
}: {
  questions: Question[];
  log: ExtremeV2LogEntry[];
  score: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const btn =
    "rounded-lg border border-[#e879f9]/60 bg-deepblue/70 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-[#e879f9] hover:bg-[#e879f9]/20";

  return (
    <div className="extreme-v2-shell mx-auto w-full max-w-3xl space-y-5">
      <div className="panel p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#e879f9]">
          Class 05 Aerodynamics Practice Quiz
        </p>
        <h2 className="mt-2 font-display text-3xl text-[#e879f9] text-glow">SCORE {score} / 33</h2>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" className={btn} onClick={onRestart}>
            Restart quiz
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
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#e879f9]">
                Question {index + 1} · {entry?.ok ? "Correct" : "Review"}
              </p>
              <p className="font-display text-sm text-moon">{question.prompt}</p>
              {entry?.given && (
                <p className="font-mono text-xs text-muted-foreground">Your answer: {entry.given}</p>
              )}
              <p className="font-mono text-xs text-mint">
                Correct: {question.correctAnswer.join(" · ")}
              </p>
              <p className="text-sm text-moon/80">{question.explanation}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
