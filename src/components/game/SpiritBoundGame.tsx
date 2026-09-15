import * as React from "react";
import { Battle, type BattleResult } from "@/components/game/spirit-bound/Battle";
import { DialogueBox } from "@/components/game/spirit-bound/DialogueBox";
import { Overworld } from "@/components/game/spirit-bound/Overworld";
import { SplashIntro } from "@/components/game/spirit-bound/SplashIntro";
import { ArcadeTree } from "@/components/game/spirit-bound/shrine/ArcadeTree";
import { ReasonTrial } from "@/components/game/spirit-bound/reason/ReasonTrial";
import { ShrineTrial } from "@/components/game/spirit-bound/shrine/ShrineTrial";
import { startMusic } from "@/game/spirit-bound/shrine/audio";
import { ENEMIES, TILE, type Npc } from "@/game/spirit-bound/data";
import { cn } from "@/lib/utils";

type Mode =
  | "splash"
  | "title"
  | "overworld"
  | "dialogue"
  | "shrine"
  | "sprint"
  | "endless"
  | "reason"
  | "reasonEndless"
  | "reasonCampaign"
  | "battle"
  | "gameover"
  | "ending";

const MAX_HP_BY_LEVEL = (lv: number) => 20 + (lv - 1) * 6;

export interface SpiritBoundGameProps {
  onMenu: () => void;
  /** Called when the Triangle King is beaten — parent shows rocket finale. */
  onVictory: (stats: { level: number; gold: number; exp: number }) => void;
}

/**
 * THE LEGEND OF TRIANGLES (spirit-bound-dialogue @ 701b61c),
 * wrapped in ZEUS AMMON-RA 11 neon chrome.
 */
export function SpiritBoundGame({ onMenu, onVictory }: SpiritBoundGameProps) {
  const [mode, setMode] = React.useState<Mode>("splash");
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
  const [shrineCleared, setShrineCleared] = React.useState(false);

  const maxHp = MAX_HP_BY_LEVEL(level);
  const finishSplash = React.useCallback(() => setMode("title"), []);
  const btn =
    "rounded-lg border border-cyan/50 bg-deepblue/70 px-5 py-3 font-display text-sm uppercase tracking-[0.22em] text-cyan transition-colors hover:bg-cyan/20 hover:text-moon";
  const menuBtn =
    "w-full border-2 border-game-yellow px-3 py-2 font-pixel text-[10px] text-game-yellow transition-colors hover:bg-game-yellow hover:text-game-bg";

  React.useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 2200);
    return () => window.clearTimeout(id);
  }, [banner]);

  React.useEffect(() => {
    if (mode !== "title") return;
    const onKey = (e: KeyboardEvent) => {
      if (["Enter", "z", "Z", " "].includes(e.key)) {
        e.preventDefault();
        startMusic();
        setMode("overworld");
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        startMusic();
        setMode("sprint");
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        startMusic();
        setMode("endless");
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        startMusic();
        setMode("reason");
      }
      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        startMusic();
        setMode("reasonEndless");
      }
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        startMusic();
        setMode("reasonCampaign");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  const onTalk = React.useCallback(
    (npc: Npc) => {
      if (npc.id === "nurse") setHp(MAX_HP_BY_LEVEL(level));
      setDialogue({ name: npc.name, lines: npc.lines });
      setMode("dialogue");
    },
    [level],
  );

  const onEncounter = React.useCallback((id: string, at: { x: number; y: number }) => {
    setSpawn(at);
    setEnemyId(id);
    setMode("battle");
  }, []);

  const onBossDoor = React.useCallback(
    (at: { x: number; y: number }) => {
      setSpawn({ x: at.x, y: at.y });
      if (bossBeaten) {
        setDialogue({
          lines: [
            "* The shrine is quiet now.",
            "* The TRIANGLE KING waves you off. Thanks for playing!",
          ],
        });
        setMode("dialogue");
        return;
      }
      if (shrineCleared) {
        setEnemyId("saltking");
        setMode("battle");
        return;
      }
      setMode("shrine");
    },
    [bossBeaten, shrineCleared],
  );

  const onBattleEnd = (r: BattleResult) => {
    setItems(r.items);
    setHp(r.hp);
    const wasBoss = enemyId === "saltking";
    setEnemyId(null);

    if (r.outcome === "dead") {
      setMode("gameover");
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
        setBanner(`+${r.exp} EXP  +${r.gold} R`);
      }
    }
    if (wasBoss && (r.outcome === "win" || r.outcome === "spare")) {
      setBossBeaten(true);
      onVictory({ level: nextLevel, gold: nextGold, exp: nextExp });
      return;
    }
    setMode("overworld");
  };

  const restart = () => {
    setLevel(1);
    setExp(0);
    setGold(20);
    setHp(20);
    setItems({ cookie: 3, hotdog: 1 });
    setBossBeaten(false);
    setShrineCleared(false);
    setSpawn({ x: 2 * TILE, y: 1 * TILE });
    setMode("overworld");
  };

  const onShrineSolved = (reward: { score: number; stars: number }) => {
    setShrineCleared(true);
    const rupees = 15 + reward.stars * 5;
    setGold((g) => g + rupees);
    setBanner(`SHRINE SEALED  +${rupees} R`);
    setEnemyId("saltking");
    setMode("battle");
  };

  return (
    <div className="spirit-bound-shell extreme-shell mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-2 py-4 font-pixel">
      {mode === "splash" && <SplashIntro onDone={finishSplash} />}

      {mode !== "splash" && (
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-magenta">ZEUS AMMON-RA 11</p>
            <h2 className="font-display text-xl text-cyan text-glow sm:text-2xl">THE LEGEND OF TRIANGLES</h2>
          </div>
          <button type="button" className={btn} onClick={onMenu}>
            Main menu
          </button>
        </div>
      )}

      <div className="relative w-full max-w-[640px]">
        {mode === "title" && (
          <section className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-lg border-4 border-game-yellow bg-game-bg p-8 text-center text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
            <div className="flex flex-col items-center leading-none text-game-yellow">
              <span className="text-[28px]">▲</span>
              <span className="-mt-2 text-[28px] tracking-[0.55em]">▲ ▲</span>
            </div>
            <p className="text-[11px] leading-relaxed text-game-yellow">A tiny pixel quest through GREENVALE</p>
            <div className="space-y-2 text-[10px] leading-relaxed">
              <p>ARROW KEYS — walk & dodge</p>
              <p>Z / ENTER — talk & confirm</p>
              <p>X / ESC — cancel</p>
              <p className="text-game-orange">
                Tall grass hides monsters. The gold door hides a shrine, then a king.
              </p>
            </div>
            <div className="mt-2 flex w-full max-w-[420px] flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  startMusic();
                  setMode("overworld");
                }}
                className={menuBtn}
              >
                Z · GREENVALE QUEST
              </button>
              <button
                type="button"
                onClick={() => {
                  startMusic();
                  setMode("sprint");
                }}
                className="w-full border-2 border-game-orange px-3 py-2 font-pixel text-[10px] leading-relaxed text-game-orange hover:bg-game-orange hover:text-game-bg"
              >
                T · BUILD YOUR EXECUTIVE ACUMEN
                <span className="mt-1 block text-[8px]">Tree mode · 1:30 · rising difficulty</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  startMusic();
                  setMode("endless");
                }}
                className="w-full border-2 border-[#38c060] px-3 py-2 font-pixel text-[10px] leading-relaxed text-[#38c060] hover:bg-[#38c060] hover:text-game-bg"
              >
                L · LONG GAME
                <span className="mt-1 block text-[8px]">Endless · adapts to your pace · stop anytime</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  startMusic();
                  setMode("reason");
                }}
                className="w-full border-2 border-[#48a0f8] px-3 py-2 font-pixel text-[10px] leading-relaxed text-[#48a0f8] hover:bg-[#48a0f8] hover:text-game-bg"
              >
                R · INTERCEPT THE WATCH NOTES
                <span className="mt-1 block text-[8px]">True / false · 1:30 · Greenvale intelligence</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  startMusic();
                  setMode("reasonEndless");
                }}
                className="w-full border-2 border-[#c060e8] px-3 py-2 font-pixel text-[10px] leading-relaxed text-[#c060e8] hover:bg-[#c060e8] hover:text-game-bg"
              >
                Y · FIELD WATCH
                <span className="mt-1 block text-[8px]">Endless · three strikes · the watch goes dark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  startMusic();
                  setMode("reasonCampaign");
                }}
                className="w-full border-2 border-[#f8d030] px-3 py-2 font-pixel text-[10px] leading-relaxed text-[#f8d030] hover:bg-[#f8d030] hover:text-game-bg"
              >
                C · SEVEN BRIEFINGS
                <span className="mt-1 block text-[8px]">Campaign · sealed verses and recovered relics</span>
              </button>
            </div>
          </section>
        )}

        {(mode === "overworld" || mode === "dialogue") && (
          <section className="relative overflow-hidden rounded-lg border-4 border-game-yellow bg-game-bg shadow-[0_0_0_4px_#181010]">
            <Overworld
              spawn={spawn}
              paused={mode !== "overworld"}
              onTalk={onTalk}
              onEncounter={onEncounter}
              onBossDoor={onBossDoor}
            />
            {mode === "dialogue" && dialogue && (
              <DialogueBox
                {...(dialogue.name ? { name: dialogue.name } : {})}
                lines={dialogue.lines}
                onDone={() => {
                  setDialogue(null);
                  setMode("overworld");
                }}
              />
            )}
            {banner && (
              <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 animate-fade-in border-2 border-game-yellow bg-game-bg px-3 py-1 text-[10px] text-game-yellow">
                {banner}
              </div>
            )}
          </section>
        )}

        {mode === "shrine" && <ShrineTrial onSolved={onShrineSolved} />}

        {mode === "sprint" && <ArcadeTree kind="sprint" onExit={() => setMode("title")} />}

        {mode === "endless" && <ArcadeTree kind="endless" onExit={() => setMode("title")} />}

        {mode === "reason" && <ReasonTrial kind="sprint" onExit={() => setMode("title")} />}

        {mode === "reasonEndless" && <ReasonTrial kind="endless" onExit={() => setMode("title")} />}

        {mode === "reasonCampaign" && <ReasonTrial kind="campaign" onExit={() => setMode("title")} />}

        {mode === "battle" && enemyId && ENEMIES[enemyId] && (
          <Battle
            enemy={ENEMIES[enemyId]!}
            level={level}
            hp={hp}
            maxHp={maxHp}
            items={items}
            onEnd={onBattleEnd}
          />
        )}

        {mode === "gameover" && (
          <section className="flex min-h-[420px] flex-col items-center justify-center gap-6 rounded-lg border-4 border-game-yellow bg-game-bg p-8 text-center text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
            <p className="text-[28px] text-game-yellow">▲</p>
            <p className="text-[18px] text-game-hp">GAME OVER</p>
            <p className="text-[10px] leading-relaxed text-game-yellow">
              * The triangles dim.
              <br />* Your quest can begin again.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={restart} className={cn(menuBtn, "w-auto px-4")}>
                RESTART?
              </button>
              <button type="button" className={btn} onClick={onMenu}>
                Main menu
              </button>
            </div>
          </section>
        )}

        {mode === "ending" && (
          <section className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-lg border-4 border-game-yellow bg-game-bg p-8 text-center text-[#f8f0c8] shadow-[0_0_0_4px_#181010]">
            <div className="leading-none text-game-yellow">
              <p className="text-[22px]">▲</p>
              <p className="-mt-1 text-[22px] tracking-[0.4em]">▲ ▲</p>
            </div>
            <p className="text-[14px] text-game-yellow">THE TRIANGLE KING YIELDS</p>
            <p className="max-w-sm text-[10px] leading-relaxed">
              * The three relics shine again.
              <br />* You finished the demo at LV {level} with {gold} R.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setMode("overworld")}
                className="border-2 border-game-orange px-4 py-2 font-pixel text-[11px] text-game-orange hover:bg-game-orange hover:text-game-bg"
              >
                KEEP EXPLORING
              </button>
              <button type="button" onClick={restart} className={cn(menuBtn, "w-auto px-4")}>
                NEW GAME
              </button>
              <button type="button" className={btn} onClick={onMenu}>
                Main menu
              </button>
            </div>
          </section>
        )}
      </div>

      {mode !== "battle" &&
        mode !== "title" &&
        mode !== "splash" &&
        mode !== "shrine" &&
        mode !== "sprint" &&
        mode !== "endless" &&
        mode !== "reason" &&
        mode !== "reasonEndless" &&
        mode !== "reasonCampaign" &&
        mode !== "ending" && (
          <div className="flex w-full max-w-[640px] flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="text-game-yellow">LV {level}</span>
            <span>
              HP {Math.max(0, hp)} / {maxHp}
            </span>
            <span>EXP {exp}</span>
            <span className="text-[#38c060]">{gold} R</span>
            <span>
              Heart x{items.cookie} · Fairy x{items.hotdog}
            </span>
          </div>
        )}
    </div>
  );
}
