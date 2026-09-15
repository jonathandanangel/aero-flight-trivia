import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const HOLD_MS = 1500;
const FADE_MS = 450;

type Props = {
  onDone: () => void;
};

export function SplashIntro({ onDone }: Props) {
  const reduced = usePrefersReducedMotion();
  const done = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      onDone();
    };
    const hold = reduced ? 1100 : HOLD_MS;
    const fade = reduced ? 0 : FADE_MS;
    const leaveTimer = window.setTimeout(() => setLeaving(true), hold);
    const doneTimer = window.setTimeout(finish, hold + fade);
    const onKey = (e: KeyboardEvent) => {
      if (["Enter", " ", "Escape", "z", "Z"].includes(e.key)) {
        e.preventDefault();
        setLeaving(true);
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onDone, reduced]);

  return (
    <motion.button
      type="button"
      aria-label="The Legend of Triangles intro. Continue to title."
      onClick={() => {
        if (done.current) return;
        done.current = true;
        onDone();
      }}
      initial={false}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduced ? 0 : FADE_MS / 1000 }}
      className="splash-root font-pixel"
    >
      <span className="splash-star splash-star-a" aria-hidden>
        ✦
      </span>
      <span className="splash-star splash-star-b" aria-hidden>
        +
      </span>
      <span className="splash-star splash-star-c" aria-hidden>
        ✦
      </span>
      <span className="splash-star splash-star-d" aria-hidden>
        ·
      </span>
      <span className="splash-star splash-star-e" aria-hidden>
        +
      </span>

      <section className="splash-card">
        <div className="splash-crest" aria-hidden>
          <span className="splash-wing splash-wing-left">⟨⟨</span>
          <div className="splash-triforce">
            <span className="splash-eye">◉</span>
            <span className="splash-tri splash-tri-top">▲</span>
            <span className="splash-tri-row">
              <span className="splash-tri splash-tri-left">▲</span>
              <span className="splash-tri splash-tri-right">▲</span>
            </span>
          </div>
          <span className="splash-wing splash-wing-right">⟩⟩</span>
        </div>
        <p className="splash-title">THE LEGEND OF TRIANGLES</p>
        <p className="splash-sub">GREENVALE</p>
      </section>
    </motion.button>
  );
}
