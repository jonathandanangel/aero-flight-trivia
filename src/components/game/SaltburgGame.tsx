import * as React from "react";
import { Battle, type BattleResult } from "@/components/game/saltburg/Battle";
import { DialogueBox } from "@/components/game/saltburg/DialogueBox";
import { Overworld } from "@/components/game/saltburg/Overworld";
import { ENEMIES, TILE, type Npc } from "@/game/saltburg/data";
import { cn } from "@/lib/utils";

type Phase = "title" | "overworld" | "dialogue" | "battle" | "gameover" | "ending";

const MAX_HP_BY_LEVEL = (lv: number) => 20 + (lv - 1) * 6;

export interface SaltburgGameProps {
  onMenu: () => void;
  /** Called when the Salt King is beaten — parent shows rocket finale. */
  onVictory: (stats: { level: number; gold: number; exp: number }) => void;
}

/**
 * Full SALTBURG RPG demo from spirit-bound-dialogue, wrapped in ZEUS AMMON-RA 11 neon chrome.
 */
export function SaltburgGame({ onMenu, onVictory }: SaltburgGameProps) {
  const [phase, setPhase] = React.useState<Phase>("title");
  const [level, setLevel] = React.useState(1);
  const [exp, setExp] = React.useState(0);
  const [gold, setGold] = React.useState(20);
  const [hp, setHp] = React.useState(20);
  const [items, setItems] = React.useState({ cookie: 3, hotdog: 1 });
  const [dialogue, setDialogue] = React.useState<{ name?: string; lines: string[] } | null>(null);
  const [enemyId, setEnemyId] = React.useState<string | null>(null);
  const [spawn, setSpawn] = React.useState({ x: 2 * TILE, y: 1 * TILE });
  const [banner, setBanner] = React.useState<string | null>(null);
  const [bossBeaten, setBossBeaten] = React.useState(false);

  const maxHp = MAX_HP_BY_LEVEL(level);
  const btn =
    "rounded-lg border border-cyan/50 bg-deepblue/70 px-5 py-3 font-display text-sm uppercase tracking-[0.22em] text-cyan transition-colors hover:bg-cyan/20 hover:text-moon";

  React.useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 2200);
    return () => window.clearTimeout(id);
  }, [banner]);

  React.useEffect(() => {
    if (phase !== "title") return;
    const onKey = (e: KeyboardEvent) => {
      if (["Enter", "z", "Z", " "].includes(e.key)) {
        e.preventDefault();
        setPhase("overworld");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const onTalk = React.useCallback(
    (npc: Npc) => {
      if (npc.id === "nurse") setHp(MAX_HP_BY_LEVEL(level));
      setDialogue({ name: npc.name, lines: npc.lines });
      setPhase("dialogue");
    },
    [level],
  );

  const onEncounter = React.useCallback((id: string, at: { x: number; y: number }) => {
    setSpawn(at);
    setEnemyId(id);
    setPhase("battle");
  }, []);

  const onBossDoor = React.useCallback(
    (at: { x: number; y: number }) => {
      setSpawn({ x: at.x, y: at.y });
      if (bossBeaten) {
        setDialogue({
          lines: [
            "* The throne room is quiet now.",
            "* The SALT KING waves you off. Thanks for playing!",
          ],
        });
        setPhase("dialogue");
        return;
      }
      setEnemyId("saltking");
      setPhase("battle");
    },
    [bossBeaten],
  );

  const onBattleEnd = (r: BattleResult) => {
    setItems(r.items);
    setHp(r.hp);
    const wasBoss = enemyId === "saltking";
    setEnemyId(null);

    if (r.outcome === "dead") {
      setPhase("gameover");
      return;
    }
    let nextLevel = level;
    let nextExp = exp;
    let nextGold = gold;
    if (r.exp || r.gold) {
      nextExp = exp + r.exp;
      nextGold = gold + r.gold;
      setExp(nextExp);
      setGold(nextGold);
      nextLevel = Math.min(9, 1 + Math.floor(nextExp / 25));
      if (nextLevel > level) {
        setLevel(nextLevel);
        setHp(MAX_HP_BY_LEVEL(nextLevel));
        setBanner(`LEVEL UP! LV ${nextLevel}`);
      } else {
        setBanner(`+${r.exp} EXP  +${r.gold}G`);
      }
    }
    if (wasBoss && (r.outcome === "win" || r.outcome === "spare")) {
      setBossBeaten(true);
      onVictory({ level: nextLevel, gold: nextGold, exp: nextExp });
      return;
    }
    setPhase("overworld");
  };

  const restart = () => {
    setLevel(1);
    setExp(0);
    setGold(20);
    setHp(20);
    setItems({ cookie: 3, hotdog: 1 });
    setBossBeaten(false);
    setSpawn({ x: 2 * TILE, y: 1 * TILE });
    setPhase("overworld");
  };

  return (
    <div className="saltburg-shell extreme-shell mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-2 py-4">
      <div className="flex w-full items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-magenta">ZEUS AMMON-RA 11</p>
          <h2 className="font-display text-2xl text-cyan text-glow sm:text-3xl">SALTBURG</h2>
        </div>
        <button type="button" className={btn} onClick={onMenu}>
          Main menu
        </button>
      </div>

      <div className="relative w-full max-w-[640px]">
        {phase === "title" && (
          <section className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-lg border border-cyan/50 bg-deepblue/80 p-8 text-center">
            <p className="font-mono text-xs leading-relaxed text-amber">
              A tiny RPG in the spirit of UNDERTALE and EARTHBOUND
            </p>
            <div className="space-y-2 font-mono text-[11px] leading-relaxed text-moon">
              <p>ARROW KEYS — walk & dodge</p>
              <p>Z / ENTER — talk & confirm</p>
              <p>X / ESC — cancel</p>
              <p className="text-magenta">Tall grass hides monsters. The gold door hides a king.</p>
            </div>
            <button type="button" className={cn(btn, "animate-pulse")} onClick={() => setPhase("overworld")}>
              Press Z / Start
            </button>
          </section>
        )}

        {(phase === "overworld" || phase === "dialogue") && (
          <section className="relative overflow-hidden rounded-lg border border-cyan/40 bg-deepblue/90">
            <Overworld
              spawn={spawn}
              paused={phase !== "overworld"}
              onTalk={onTalk}
              onEncounter={onEncounter}
              onBossDoor={onBossDoor}
            />
            {phase === "dialogue" && dialogue && (
              <DialogueBox
                {...(dialogue.name ? { name: dialogue.name } : {})}
                lines={dialogue.lines}
                onDone={() => {
                  setDialogue(null);
                  setPhase("overworld");
                }}
              />
            )}
            {banner && (
              <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 animate-fade-in rounded border border-amber bg-deepblue/90 px-3 py-1 font-mono text-[10px] text-amber">
                {banner}
              </div>
            )}
          </section>
        )}

        {phase === "battle" && enemyId && ENEMIES[enemyId] && (
          <Battle
            enemy={ENEMIES[enemyId]!}
            level={level}
            hp={hp}
            maxHp={maxHp}
            items={items}
            onEnd={onBattleEnd}
          />
        )}

        {phase === "gameover" && (
          <section className="flex min-h-[420px] flex-col items-center justify-center gap-6 rounded-lg border border-magenta/50 bg-deepblue/80 p-8 text-center">
            <p className="font-display text-3xl text-magenta">GAME OVER</p>
            <p className="font-mono text-xs leading-relaxed text-amber">
              * Stay determined.
              <br />* Your soul cracked... but you can try again.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className={btn} onClick={restart}>
                Restart?
              </button>
              <button type="button" className={btn} onClick={onMenu}>
                Main menu
              </button>
            </div>
          </section>
        )}

        {phase === "ending" && (
          <section className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-lg border border-cyan/50 bg-deepblue/80 p-8 text-center">
            <p className="font-display text-2xl text-cyan">THE SALT KING YIELDS</p>
            <p className="max-w-sm font-mono text-xs leading-relaxed text-moon">
              * The kingdom of one gets a second citizen.
              <br />* You finished the demo at LV {level} with {gold}G.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className={btn} onClick={() => setPhase("overworld")}>
                Keep exploring
              </button>
              <button type="button" className={btn} onClick={restart}>
                New game
              </button>
              <button type="button" className={btn} onClick={onMenu}>
                Main menu
              </button>
            </div>
          </section>
        )}
      </div>

      {phase !== "battle" && phase !== "title" && phase !== "ending" && (
        <div className="flex w-full max-w-[640px] flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground">
          <span className="text-amber">LV {level}</span>
          <span>
            HP {Math.max(0, hp)} / {maxHp}
          </span>
          <span>EXP {exp}</span>
          <span>{gold}G</span>
          <span>
            Cookie x{items.cookie} · Hotdog x{items.hotdog}
          </span>
        </div>
      )}
    </div>
  );
}
