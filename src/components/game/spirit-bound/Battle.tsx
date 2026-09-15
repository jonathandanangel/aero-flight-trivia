import { useCallback, useEffect, useRef, useState } from "react";
import type { Enemy } from "@/game/spirit-bound/data";
import { useKeys } from "@/game/spirit-bound/useKeys";
import { BulletBox } from "./BulletBox";

export type BattleResult = {
  outcome: "win" | "spare" | "flee" | "dead";
  hp: number;
  exp: number;
  gold: number;
  items: { cookie: number; hotdog: number };
};

type Props = {
  enemy: Enemy;
  level: number;
  hp: number;
  maxHp: number;
  items: { cookie: number; hotdog: number };
  onEnd: (r: BattleResult) => void;
};

type Phase = "intro" | "action" | "sub" | "fight" | "enemy" | "message" | "over";
const ACTIONS = ["FIGHT", "ACT", "ITEM", "MERCY"] as const;

export function Battle({ enemy, level, hp, maxHp, items: startItems, onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [actionIdx, setActionIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0);
  const [subKind, setSubKind] = useState<"act" | "item" | "mercy">("act");
  const [message, setMessage] = useState(`* ${enemy.flavor}`);
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [realHp, setRealHp] = useState(hp);
  const [rollHp, setRollHp] = useState(hp);
  const [items, setItems] = useState(startItems);
  const [mercyProgress, setMercyProgress] = useState(0);
  const [hurt, setHurt] = useState(0);
  const [attackPos, setAttackPos] = useState(0);
  const [enemyShake, setEnemyShake] = useState(false);
  const finished = useRef(false);

  const actOptions = ["Check", enemy.boss ? "Plead" : "Compliment", "Joke"];
  const itemOptions = [`Heart (${items.cookie})`, `Fairy (${items.hotdog})`];
  const mercyOptions = ["Spare", "Flee"];
  const subOptions =
    subKind === "act" ? actOptions : subKind === "item" ? itemOptions : mercyOptions;

  /* Undertale-style: ACT enough times, or wear it down, and it can be spared */
  const hpRatio = enemyHp / enemy.hp;
  const spareable = mercyProgress >= enemy.mercyTurns || (!enemy.boss && hpRatio <= 0.25);
  /* EarthBound-style: a cornered enemy fights harder and faster */
  const desperate = hpRatio <= 0.35;

  const finish = useCallback(
    (outcome: BattleResult["outcome"], hpLeft: number) => {
      if (finished.current) return;
      finished.current = true;
      setPhase("over");
      onEnd({
        outcome,
        hp: Math.max(0, hpLeft),
        exp: outcome === "win" || outcome === "spare" ? enemy.exp : 0,
        gold: outcome === "win" || outcome === "spare" ? enemy.gold : 0,
        items,
      });
    },
    [enemy.exp, enemy.gold, items, onEnd],
  );

  /* EarthBound rolling HP odometer: damage ticks down, heal in time to survive */
  useEffect(() => {
    if (rollHp === realHp) return;
    const id = window.setInterval(() => {
      setRollHp((r) => (r < realHp ? Math.min(realHp, r + 1) : Math.max(realHp, r - 1)));
    }, 45);
    return () => window.clearInterval(id);
  }, [rollHp, realHp]);

  useEffect(() => {
    if (rollHp <= 0 && realHp <= 0 && !finished.current) {
      finished.current = true;
      setPhase("over");
      setMessage("* You ran out of HP...");
      window.setTimeout(() => onEnd({ outcome: "dead", hp: 0, exp: 0, gold: 0, items }), 900);
    }
  }, [rollHp, realHp, items, onEnd]);

  const heal = (amount: number, label: string) => {
    setRealHp((h) => Math.min(maxHp, Math.max(0, h) + amount));
    say(`* You ate the ${label}. HP recovered.`);
  };

  const say = (text: string, then: "action" | "enemy" = "enemy") => {
    setMessage(text);
    setPhase("message");
    window.setTimeout(() => {
      if (finished.current) return;
      setPhase(then === "enemy" ? "enemy" : "action");
    }, 1150);
  };

  /* attack timing line */
  useEffect(() => {
    if (phase !== "fight") return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = ((t - start) % 1400) / 1400;
      setAttackPos(p);
      if (t - start > 2900) {
        setAttackPos(0);
        say("* You missed your swing.");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const swing = () => {
    const accuracy = 1 - Math.abs(attackPos - 0.5) * 2;
    const crit = accuracy > 0.85;
    const attack = (6 + accuracy * 18) * (1 + level * 0.12);
    const raw = attack - enemy.def * (crit ? 0.25 : 1);
    const dmg = Math.max(1, Math.round(crit ? raw * 1.5 : raw));
    const left = Math.max(0, enemyHp - dmg);
    setEnemyHp(left);
    setAttackPos(0);
    setEnemyShake(true);
    window.setTimeout(() => setEnemyShake(false), 350);
    if (left <= 0) {
      setMessage(`* ${dmg} damage! ${enemy.name} was defeated.`);
      setPhase("message");
      window.setTimeout(() => finish("win", Math.max(0, realHp)), 1200);
      return;
    }
    const weak = left / enemy.hp < 0.3;
    say(
      `* ${crit ? "SMAAAASH! " : ""}${dmg} damage to ${enemy.name}.` +
        (weak ? `\n* ${enemy.name} looks exhausted. (Try MERCY?)` : ""),
    );
  };

  const chooseSub = () => {
    if (subKind === "act") {
      if (subIdx === 0) {
        say(enemy.check, "action");
        return;
      }
      setMercyProgress((m) => m + 1);
      say(
        `${enemy.mercyText}\n* ${enemy.name} seems ${mercyProgress + 1 >= enemy.mercyTurns ? "ready to stop" : "less hostile"}.`,
      );
      return;
    }
    if (subKind === "item") {
      if (subIdx === 0 && items.cookie > 0) {
        setItems((i) => ({ ...i, cookie: i.cookie - 1 }));
        heal(25, "Heart");
      } else if (subIdx === 1 && items.hotdog > 0) {
        setItems((i) => ({ ...i, hotdog: i.hotdog - 1 }));
        heal(40, "Fairy");
      } else {
        say("* You're all out of that.", "action");
      }
      return;
    }
    if (subIdx === 0) {
      if (spareable) {
        setMessage(`* You spared ${enemy.name}.\n* You earned 0 EXP and ${enemy.gold} R.`);
        setPhase("message");
        window.setTimeout(() => finish("spare", Math.max(0, realHp)), 1300);
      } else {
        say(`* ${enemy.name} isn't ready to be spared. (ACT more!)`);
      }
      return;
    }
    if (enemy.boss) {
      say("* You can't run from THE TRIANGLE KING!");
    } else {
      setMessage("* You escaped!");
      setPhase("message");
      window.setTimeout(() => finish("flee", Math.max(0, realHp)), 900);
    }
  };

  useKeys((key) => {
    if (finished.current) return;
    const confirm = ["Enter", "z", "Z", " "].includes(key);
    const cancel = ["Escape", "x", "X"].includes(key);

    if (phase === "intro" && confirm) {
      setPhase("action");
      return;
    }
    if (phase === "action") {
      if (key === "ArrowRight") setActionIdx((i) => Math.min(ACTIONS.length - 1, i + 1));
      if (key === "ArrowLeft") setActionIdx((i) => Math.max(0, i - 1));
      if (confirm) {
        if (actionIdx === 0) {
          setMessage("* Stop the line in the middle!");
          setPhase("fight");
        } else {
          setSubKind(actionIdx === 1 ? "act" : actionIdx === 2 ? "item" : "mercy");
          setSubIdx(0);
          setPhase("sub");
        }
      }
      return;
    }
    if (phase === "sub") {
      if (key === "ArrowDown") setSubIdx((i) => Math.min(subOptions.length - 1, i + 1));
      if (key === "ArrowUp") setSubIdx((i) => Math.max(0, i - 1));
      if (cancel) setPhase("action");
      if (confirm) chooseSub();
      return;
    }
    if (phase === "fight" && confirm) swing();
  });

  const onEnemyTurnEnd = () => {
    if (finished.current) return;
    setMessage(`* ${enemy.name} is waiting for your move.`);
    setPhase("action");
  };

  const takeHit = (dmg: number) => {
    setRealHp((h) => h - dmg);
    setHurt(Date.now());
  };

  const hpPct = Math.max(0, Math.min(1, rollHp / maxHp));

  return (
    <div className="relative mx-auto w-full max-w-[640px] select-none border-4 border-game-yellow bg-game-bg p-3 font-pixel text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
      <div className="relative flex h-[190px] items-center justify-center overflow-hidden bg-[#102010]">
        <TriangleField />
        <div
          className={`relative z-10 flex flex-col items-center transition-transform ${enemyShake ? "translate-x-1" : ""}`}
          style={{ opacity: enemyHp <= 0 ? 0.3 : 1 }}
        >
          <EnemySprite color={enemy.color} kind={enemy.pattern} />
          <div
            className={`mt-2 text-[10px] tracking-widest ${spareable ? "text-game-yellow" : ""}`}
          >
            {enemy.name}
            {spareable ? " ▲" : ""}
          </div>
          <div className="mt-1 h-2 w-32 border-2 border-game-yellow">
            <div
              className="h-full bg-game-hp transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(1, hpRatio)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative mt-2 border-4 border-game-yellow bg-[#201808] p-4">
        {phase === "enemy" ? (
          <BulletBox
            pattern={enemy.pattern}
            duration={Math.round(enemy.attackTime * (desperate ? 1.25 : 1))}
            damage={Math.max(1, Math.round(enemy.atk * (desperate ? 1.4 : 1) + level * 0.5))}
            onHit={takeHit}
            onDone={onEnemyTurnEnd}
          />
        ) : phase === "fight" ? (
          <div className="relative h-[110px] overflow-hidden border-2 border-game-yellow bg-[#181010]">
            <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-game-yellow/60" />
            <div
              className="absolute inset-y-0 w-3 border-2 border-[#181010] bg-game-yellow"
              style={{ left: `${attackPos * 96}%` }}
            />
            <p className="absolute bottom-2 left-2 text-[10px] text-game-yellow">
              {message} (Z / ENTER)
            </p>
          </div>
        ) : phase === "sub" ? (
          <ul className="h-[110px] space-y-2 text-[12px]">
            {subOptions.map((o, i) => (
              <li key={o} className={i === subIdx ? "text-game-yellow" : ""}>
                {i === subIdx ? "▲ " : "\u00A0\u00A0 "}
                {o}
              </li>
            ))}
            <li className="pt-1 text-[9px] text-game-ink/60">ESC / X to go back</li>
          </ul>
        ) : (
          <p className="h-[110px] whitespace-pre-line text-[12px] leading-relaxed">
            {message}
            {phase === "intro" && <span className="animate-pulse"> ▼</span>}
          </p>
        )}
        {hurt > 0 && phase === "enemy" && (
          <div
            key={hurt}
            className="pointer-events-none absolute inset-0 animate-fade-out bg-game-hp/30"
          />
        )}
      </div>

      {/* status bar */}
      <div className="mt-3 flex items-center gap-4 text-[12px]">
        <span>LV {level}</span>
        <span>HP</span>
        <div className="h-4 w-24 bg-game-hp-empty">
          <div
            className="h-full bg-game-yellow transition-[width]"
            style={{ width: `${hpPct * 100}%` }}
          />
        </div>
        <span>
          {Math.max(0, rollHp)} / {maxHp}
        </span>
      </div>

      {/* action bar */}
      <ul className="mt-3 grid grid-cols-4 gap-2 text-[13px]">
        {ACTIONS.map((a, i) => {
          const active = phase === "action" && i === actionIdx;
          return (
            <li
              key={a}
              className={`border-2 px-2 py-1 text-center ${
                active
                  ? "border-game-yellow text-game-yellow"
                  : "border-game-orange text-game-orange"
              }`}
            >
              {active ? "▲ " : ""}
              {a}
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-center text-[9px] text-game-ink/50">
        ARROWS move · Z / ENTER confirm · X / ESC cancel
      </p>
    </div>
  );
}

function TriangleField() {
  const spots = [
    [8, 16],
    [40, 120],
    [80, 40],
    [140, 150],
    [200, 24],
    [260, 110],
    [320, 50],
    [380, 140],
    [460, 30],
    [520, 100],
    [560, 160],
  ] as const;
  return (
    <div className="pointer-events-none absolute inset-0 opacity-40">
      {spots.map(([left, top], i) => (
        <span
          key={`${left}-${top}`}
          className="absolute text-[10px] text-game-yellow"
          style={{ left, top, transform: i % 2 ? "rotate(180deg)" : undefined }}
        >
          ▲
        </span>
      ))}
    </div>
  );
}

function EnemySprite({ color, kind }: { color: string; kind: Enemy["pattern"] }) {
  const size = kind === "king" ? 108 : 76;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
      <g fill={color}>
        {kind === "seeds" && (
          <>
            <rect x="7" y="1" width="2" height="2" />
            <rect x="6" y="3" width="4" height="2" />
            <rect x="4" y="5" width="8" height="2" />
            <rect x="3" y="7" width="10" height="2" />
            <rect x="7" y="9" width="2" height="5" />
            <rect x="5" y="13" width="6" height="2" />
          </>
        )}
        {kind === "salt" && (
          <>
            <rect x="6" y="2" width="4" height="2" />
            <rect x="4" y="4" width="8" height="3" />
            <rect x="3" y="7" width="10" height="5" />
            <rect x="2" y="6" width="2" height="2" />
            <rect x="12" y="6" width="2" height="2" />
            <rect x="5" y="12" width="2" height="3" />
            <rect x="9" y="12" width="2" height="3" />
          </>
        )}
        {kind === "king" && (
          <>
            <rect x="7" y="0" width="2" height="2" />
            <rect x="6" y="2" width="4" height="2" />
            <rect x="4" y="4" width="8" height="2" />
            <rect x="2" y="6" width="12" height="2" />
            <rect x="1" y="8" width="14" height="3" />
            <rect x="3" y="11" width="4" height="2" />
            <rect x="9" y="11" width="4" height="2" />
            <rect x="2" y="13" width="3" height="3" />
            <rect x="11" y="13" width="3" height="3" />
          </>
        )}
      </g>
      <g fill="#181010">
        <rect x="5" y={kind === "king" ? 8 : 6} width="2" height="2" />
        <rect x="9" y={kind === "king" ? 8 : 6} width="2" height="2" />
      </g>
      <g fill="#f8d030">
        <rect x="7" y={kind === "king" ? 5 : 4} width="2" height="2" />
      </g>
    </svg>
  );
}
