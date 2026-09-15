import * as React from "react";
import {
  JEHOVAH_BOOK_TITLE,
  SCATTERED_PAPERS,
  type ScatteredPaper,
} from "@/game/spirit-bound/scattered-papers";

type Props = {
  collectedIds: Set<string>;
  onClose: () => void;
  /** Tab to open first (usually the page just collected). */
  initialTabId?: string | null;
};

/** Renders page body; [[HL]]…[[/HL]] become red (1 Tim 5:23 medicinal wine). */
function BookPageBody({ paper }: { paper: ScatteredPaper }) {
  if (!paper.highlightMarkers || !paper.text.includes("[[HL]]")) {
    return (
      <pre className="whitespace-pre-wrap font-pixel text-[9px] leading-relaxed text-[#f8f0c8]">
        {paper.text}
      </pre>
    );
  }

  const parts = paper.text.split(/(\[\[HL\]\][\s\S]*?\[\[\/HL\]\])/g);
  return (
    <pre className="whitespace-pre-wrap font-pixel text-[9px] leading-relaxed text-[#f8f0c8]">
      {parts.map((part, i) => {
        const m = part.match(/^\[\[HL\]\]([\s\S]*?)\[\[\/HL\]\]$/);
        if (m) {
          return (
            <span key={i} className="font-bold text-[#f02828]">
              {m[1]}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </pre>
  );
}

export function JehovahBook({ collectedIds, onClose, initialTabId = null }: Props) {
  const collected = SCATTERED_PAPERS.filter((p) => collectedIds.has(p.id));
  const firstId = initialTabId && collectedIds.has(initialTabId) ? initialTabId : collected[0]?.id ?? null;
  const [activeId, setActiveId] = React.useState<string | null>(firstId);

  React.useEffect(() => {
    if (initialTabId && collectedIds.has(initialTabId)) setActiveId(initialTabId);
  }, [initialTabId, collectedIds]);

  const active: ScatteredPaper | undefined = collected.find((p) => p.id === activeId) ?? collected[0];

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-2">
      <div
        className="pointer-events-auto flex max-h-[min(94%,560px)] w-full max-w-xl flex-col border-4 border-[#f8d030] bg-gradient-to-b from-[#3a2810] via-[#2a1c08] to-[#181008] shadow-[0_0_0_4px_#181010,inset_0_0_0_2px_#a88828]"
        role="dialog"
        aria-labelledby="jehovah-book-title"
      >
        <header className="border-b-2 border-[#f8d030]/50 px-3 py-3">
          <p id="jehovah-book-title" className="text-center font-pixel text-[10px] tracking-[0.2em] text-[#f8d030]">
            {JEHOVAH_BOOK_TITLE}
          </p>
          <p className="mt-1 text-center text-[8px] text-[#c8a048]">
            Bound leaves · {collected.length} / {SCATTERED_PAPERS.length} tabs
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav
            className="flex max-h-28 shrink-0 gap-1 overflow-x-auto border-b-2 border-[#f8d030]/30 px-2 py-2 sm:max-h-none sm:w-36 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r-2"
            aria-label="Book tabs"
          >
            {SCATTERED_PAPERS.map((p) => {
              const owned = collectedIds.has(p.id);
              const selected = active?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!owned}
                  onClick={() => owned && setActiveId(p.id)}
                  className={`shrink-0 border px-2 py-1.5 text-left font-pixel text-[7px] leading-tight tracking-wide transition-colors ${
                    !owned
                      ? "cursor-not-allowed border-[#504028]/60 text-[#504028]"
                      : selected
                        ? "border-[#f8d030] bg-[#f8d030] text-[#201808]"
                        : "border-[#a88828] text-[#e8c860] hover:bg-[#f8d030]/20"
                  }`}
                >
                  {owned ? p.tab : `· ${p.order} ·`}
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {active ? (
              <>
                <p className="mb-2 font-pixel text-[9px] tracking-[0.18em] text-[#f8d030]">{active.tab}</p>
                <BookPageBody paper={active} />
              </>
            ) : (
              <p className="font-pixel text-[9px] leading-relaxed text-[#a88828]">
                The covers wait. Gather every scrap from the grasslands to bind the leaves.
              </p>
            )}
          </div>
        </div>

        <footer className="border-t-2 border-[#f8d030]/50 px-3 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full border-2 border-[#f8d030] px-3 py-2 font-pixel text-[10px] text-[#f8d030] transition-colors hover:bg-[#f8d030] hover:text-[#201808]"
          >
            CLOSE BOOK (Z / ESC)
          </button>
        </footer>
      </div>
    </div>
  );
}
