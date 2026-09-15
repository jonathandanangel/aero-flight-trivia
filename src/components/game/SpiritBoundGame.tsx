import * as React from "react";
import { Battle, type BattleResult } from "@/components/game/spirit-bound/Battle";
import { DialogueBox } from "@/components/game/spirit-bound/DialogueBox";
import { Overworld } from "@/components/game/spirit-bound/Overworld";
import { EggHatchIntro } from "@/components/game/spirit-bound/EggHatchIntro";
import { GoldenEggReader, HawkEggReader } from "@/components/game/spirit-bound/GoldenEggReader";
import { GrasslandsOverworld } from "@/components/game/spirit-bound/GrasslandsOverworld";
import { JehovahBook } from "@/components/game/spirit-bound/JehovahBook";
import { SplashIntro } from "@/components/game/spirit-bound/SplashIntro";
import { ArcadeTree } from "@/components/game/spirit-bound/shrine/ArcadeTree";
import { ReasonTrial } from "@/components/game/spirit-bound/reason/ReasonTrial";
import { ShrineTrial } from "@/components/game/spirit-bound/shrine/ShrineTrial";
import { LondonDoctrineGate } from "@/components/game/spirit-bound/shrine/LondonDoctrineGate";
import {
  startMusic,
  startGrasslandsMusic,
  startVineBattleMusic,
  startKingBattleMusic,
  playDemonicLaugh,
  playBurnSfx,
  stopAmbient,
  startBurnLoop,
  stopBurnLoop,
} from "@/game/spirit-bound/shrine/audio";
import { ENEMIES, TILE, type Npc } from "@/game/spirit-bound/data";
import { GRASS_TILE, VINE_MIN_LEVEL, generateRandomBushKeys, type GrassNpc } from "@/game/spirit-bound/grasslands-data";
import { allPapersCollected, type ScatteredPaper } from "@/game/spirit-bound/scattered-papers";
import { cn } from "@/lib/utils";

type Mode =
  | "splash"
  | "title"
  | "hatch"
  | "overworld"
  | "dialogue"
  | "shrine"
  | "sprint"
  | "endless"
  | "reason"
  | "reasonEndless"
  | "reasonCampaign"
  | "doctrine"
  | "battle"
  | "gameover"
  | "ending";

const MAX_HP_BY_LEVEL = (lv: number) => 20 + (lv - 1) * 6;
const MAX_LEVEL = 12;

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
  const [exitDoorOpen, setExitDoorOpen] = React.useState(false);
  const [mapId, setMapId] = React.useState<"greenvale" | "grasslands">("greenvale");
  const [burntBushes, setBurntBushes] = React.useState<Set<string>>(() => new Set());
  const [bushTiles, setBushTiles] = React.useState<Set<string>>(() => new Set());
  const [burningBushKey, setBurningBushKey] = React.useState<string | null>(null);
  const [vinePurged, setVinePurged] = React.useState(false);
  const [pendingBushKey, setPendingBushKey] = React.useState<string | null>(null);
  const [afterDialogue, setAfterDialogue] = React.useState<"none" | "vine">("none");
  const [goldenEggOpen, setGoldenEggOpen] = React.useState(false);
  const [hawkEggOpen, setHawkEggOpen] = React.useState(false);
  const [collectedPapers, setCollectedPapers] = React.useState<Set<string>>(() => new Set());
  const [bookOpen, setBookOpen] = React.useState(false);
  const [bookTabId, setBookTabId] = React.useState<string | null>(null);
  const [shrineCleared, setShrineCleared] = React.useState(false);
  const [pendingPaper, setPendingPaper] = React.useState<ScatteredPaper | null>(null);
  const demonicLaughPlayedRef = React.useRef(false);

  const maxHp = MAX_HP_BY_LEVEL(level);
  const goMenu = React.useCallback(() => {
    stopBurnLoop();
    onMenu();
  }, [onMenu]);
  const finishSplash = React.useCallback(() => setMode("title"), []);
  const startGreenvaleQuest = React.useCallback(() => {
    startMusic();
    setMode("hatch");
  }, []);
  const finishHatch = React.useCallback(() => {
    startMusic();
    setMode("overworld");
  }, []);
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
        startGreenvaleQuest();
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
  }, [mode, startGreenvaleQuest]);

  React.useEffect(() => {
    if (!goldenEggOpen && !hawkEggOpen && !bookOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (["Escape", "x", "X", "z", "Z", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setGoldenEggOpen(false);
        setHawkEggOpen(false);
        setBookOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goldenEggOpen, hawkEggOpen, bookOpen]);

  React.useEffect(() => {
    if (mode !== "overworld" || bookOpen || goldenEggOpen || hawkEggOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B") {
        if (!allPapersCollected(collectedPapers)) return;
        e.preventDefault();
        setBookOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, bookOpen, goldenEggOpen, hawkEggOpen, collectedPapers]);

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
          lines: exitDoorOpen
            ? [
                "* The shrine is quiet.",
                "* The bright door still leads to the IVY LAUREL GRASSLANDS.",
              ]
            : ["* The shrine is quiet now.", "* LORD PETER's crown lies in the dust."],
        });
        setMode("dialogue");
        return;
      }
      if (shrineCleared) {
        setEnemyId("saltking");
        startKingBattleMusic();
        setMode("battle");
        return;
      }
      setMode("shrine");
    },
    [bossBeaten, exitDoorOpen, shrineCleared],
  );

  const onExitToGrasslands = React.useCallback((_at: { x: number; y: number }) => {
    startGrasslandsMusic();
    setMapId("grasslands");
    setSpawn({ x: 2 * GRASS_TILE, y: 3 * GRASS_TILE });
    setBushTiles((prev) => (prev.size > 0 ? prev : generateRandomBushKeys(14)));
    setBanner("IVY LAUREL GRASSLANDS");
  }, []);

  React.useEffect(() => {
    if (!burningBushKey) return;
    const id = window.setTimeout(() => setBurningBushKey(null), 1400);
    return () => window.clearTimeout(id);
  }, [burningBushKey]);

  const collectedPapersRef = React.useRef(collectedPapers);
  collectedPapersRef.current = collectedPapers;

  const onPaper = React.useCallback((paper: ScatteredPaper) => {
    if (collectedPapersRef.current.has(paper.id)) return;
    setPendingPaper(paper);
    setMode("doctrine");
  }, []);

  const onDoctrineSolved = React.useCallback(() => {
    const paper = pendingPaper;
    setPendingPaper(null);
    if (!paper) {
      startGrasslandsMusic();
      setMode("overworld");
      return;
    }
    const next = new Set(collectedPapersRef.current).add(paper.id);
    collectedPapersRef.current = next;
    setCollectedPapers(next);
    startGrasslandsMusic();
    if (allPapersCollected(next)) {
      setBanner("Press B");
      setDialogue({
        lines: [
          "* You pick up a scrap of paper.",
          "* The scraps bind together.",
          "* Press B.",
        ],
      });
    } else {
      setDialogue({
        lines: [
          "* You pick up a scrap of paper.",
          "* The ink is sealed. You cannot read it yet.",
        ],
      });
    }
    setMode("dialogue");
  }, [pendingPaper]);

  const onDoctrineAbort = React.useCallback(() => {
    setPendingPaper(null);
    startGrasslandsMusic();
    setMode("overworld");
  }, []);

  const onGoldenEgg = React.useCallback(() => {
    setHawkEggOpen(false);
    setGoldenEggOpen(true);
  }, []);

  const onHawkEgg = React.useCallback(() => {
    setGoldenEggOpen(false);
    setHawkEggOpen(true);
  }, []);

  const onGrassTalk = React.useCallback((npc: GrassNpc) => {
    setDialogue({ name: npc.name, lines: npc.lines.map((l) => (l.startsWith("*") ? l : `* ${l}`)) });
    setMode("dialogue");
  }, []);

  const onGrassBush = React.useCallback(
    (at: { x: number; y: number }, key: string) => {
      if (vinePurged || burntBushes.has(key)) return;
      setSpawn(at);
      setPendingBushKey(key);
      setEnemyId("wildbush");
      setMode("battle");
    },
    [vinePurged, burntBushes],
  );

  const onGrassVine = React.useCallback(
    (at: { x: number; y: number }) => {
      if (vinePurged) return;
      setSpawn(at);
      if (level < VINE_MIN_LEVEL) {
        setDialogue({
          lines: [
            `* The vine's thorns ignore you. (Need LV ${VINE_MIN_LEVEL}, you are LV ${level})`,
            "* Train on the bushes in the grasslands first.",
          ],
        });
        setMode("dialogue");
        return;
      }
      setEnemyId("grapevine");
      startVineBattleMusic();
      setMode("battle");
    },
    [level, vinePurged],
  );

  const onGrassWild = React.useCallback(
    (at: { x: number; y: number }) => {
      if (vinePurged) return;
      setSpawn(at);
      setEnemyId("wildbush");
      setMode("battle");
    },
    [vinePurged],
  );

  const onBattleEnd = (r: BattleResult) => {
    setItems(r.items);
    setHp(r.hp);
    const wasKing = enemyId === "saltking";
    const wasBush = enemyId === "wildbush";
    const wasVine = enemyId === "grapevine";
    const bushKey = pendingBushKey;
    setEnemyId(null);
    setPendingBushKey(null);

    if (r.outcome === "dead") {
      stopAmbient();
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
      nextLevel = Math.min(MAX_LEVEL, 1 + Math.floor(nextExp / 25));
      if (nextLevel > level) {
        setLevel(nextLevel);
        setHp(MAX_HP_BY_LEVEL(nextLevel));
        setBanner(`LEVEL UP! LV ${nextLevel}`);
      } else {
        setBanner(`+${r.exp} EXP  +${r.gold} R`);
      }
    }

    if (wasBush && (r.outcome === "win" || r.outcome === "spare") && bushKey) {
      setBurntBushes((prev) => new Set(prev).add(bushKey));
      setBurningBushKey(bushKey);
      playBurnSfx();
      setBanner("BUSH BURNED");
    }

    if (wasKing && (r.outcome === "win" || r.outcome === "spare")) {
      setBossBeaten(true);
      setExitDoorOpen(true);
      demonicLaughPlayedRef.current = false;
      startMusic();
      setDialogue({
        name: "FATES",
        lines: [
          "* LORD PETER KING DE MI URGOS DE LOS CHRISTOS crumbles.",
          "* The triangle eye dims. The hat falls sideways.",
          "* Adoni Je Hovah your old ivy laurel leaves will be stopped by Paul Barnabus the Nazarene. Mark my words!",
          "* Demonic laughter echoes through the shrine...",
          "* The gold door blazes open. A pastoral field waits beyond.",
          "* Scraps of doctrine scatter across the grasslands — find them all.",
          "* That hunt is harder than the vine. The door still opens.",
        ],
      });
      setMode("dialogue");
      return;
    }

    if (wasVine && (r.outcome === "win" || r.outcome === "spare")) {
      setVinePurged(true);
      setAfterDialogue("vine");
      stopAmbient();
      playBurnSfx();
      startBurnLoop();
      setDialogue({
        lines: [
          "* The FRUITFUL GRAPE VINE shrivels.",
          "* Flames race across every meadow. Night falls.",
          "* Trees, houses, and the vine itself burn in the distance.",
          "* No enemies remain. The grasslands crackle under a burning sky.",
        ],
      });
      setMode("dialogue");
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
    setExitDoorOpen(false);
    setMapId("greenvale");
    setBurntBushes(new Set());
    setBushTiles(new Set());
    setBurningBushKey(null);
    setVinePurged(false);
    setPendingBushKey(null);
    setAfterDialogue("none");
    setGoldenEggOpen(false);
    setHawkEggOpen(false);
    setCollectedPapers(new Set());
    setBookOpen(false);
    setBookTabId(null);
    setShrineCleared(false);
    setSpawn({ x: 2 * TILE, y: 1 * TILE });
    stopBurnLoop();
    startMusic();
    setMode("overworld");
  };

  const onShrineSolved = (reward: { score: number; stars: number }) => {
    setShrineCleared(true);
    const rupees = 15 + reward.stars * 5;
    setGold((g) => g + rupees);
    setBanner(`SHRINE SEALED  +${rupees} R`);
    setEnemyId("saltking");
    startKingBattleMusic();
    setMode("battle");
  };

  return (
    <div
      className={cn(
        "spirit-bound-shell mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-2 py-4 font-pixel",
        mode === "splash" || mode === "hatch" || mode === "title"
          ? "min-h-[100dvh] justify-center"
          : "extreme-shell",
      )}
    >
      {mode === "splash" && <SplashIntro onDone={finishSplash} />}

      {mode === "hatch" && <EggHatchIntro onDone={finishHatch} />}

      {mode !== "splash" && mode !== "hatch" && (
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-magenta">ZEUS AMMON-RA 11</p>
            <h2 className="font-display text-xl text-cyan text-glow sm:text-2xl">THE LEGEND OF TRIANGLES</h2>
          </div>
          <button type="button" className={btn} onClick={goMenu}>
            Main menu
          </button>
        </div>
      )}

      <div
        className={cn(
          "relative w-full max-w-[640px]",
          mode === "title" && "flex flex-col items-center",
        )}
      >        {mode === "title" && (
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
                Defeat LORD PETER, then explore the grasslands beyond the door.
              </p>
            </div>
            <div className="mt-2 flex w-full max-w-[420px] flex-col gap-2">
              <button type="button" onClick={startGreenvaleQuest} className={menuBtn}>
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
            {mapId === "greenvale" ? (
              <Overworld
                spawn={spawn}
                paused={mode !== "overworld" || bookOpen}
                exitDoorOpen={exitDoorOpen}
                onTalk={onTalk}
                onEncounter={onEncounter}
                onBossDoor={onBossDoor}
                onExitToGrasslands={onExitToGrasslands}
              />
            ) : (
              <GrasslandsOverworld
                spawn={spawn}
                paused={mode !== "overworld" || goldenEggOpen || hawkEggOpen || bookOpen}
                night={vinePurged}
                bushTiles={bushTiles}
                burntBushes={burntBushes}
                burningBushKey={burningBushKey}
                vineDefeated={vinePurged}
                collectedPaperIds={collectedPapers}
                onTalk={onGrassTalk}
                onBush={onGrassBush}
                onVine={onGrassVine}
                onWildGrass={onGrassWild}
                onGoldenEgg={onGoldenEgg}
                onHawkEgg={onHawkEgg}
                onPaper={onPaper}
              />
            )}
            {goldenEggOpen && mapId === "grasslands" && (
              <GoldenEggReader onClose={() => setGoldenEggOpen(false)} />
            )}
            {hawkEggOpen && mapId === "grasslands" && (
              <HawkEggReader onClose={() => setHawkEggOpen(false)} />
            )}
            {bookOpen && allPapersCollected(collectedPapers) && (
              <JehovahBook
                collectedIds={collectedPapers}
                initialTabId={bookTabId}
                onClose={() => setBookOpen(false)}
              />
            )}
            {mode === "dialogue" && dialogue && (
              <DialogueBox
                {...(dialogue.name ? { name: dialogue.name } : {})}
                lines={dialogue.lines}
                onLine={(_i, line) => {
                  if (
                    !demonicLaughPlayedRef.current &&
                    line.includes("Demonic laughter echoes through the shrine")
                  ) {
                    demonicLaughPlayedRef.current = true;
                    playDemonicLaugh();
                  }
                }}
                onDone={() => {
                  setDialogue(null);
                  if (afterDialogue === "vine") {
                    setAfterDialogue("none");
                    onVictory({ level, gold, exp });
                    setMode("ending");
                    return;
                  }
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

        {mode === "doctrine" && pendingPaper && (
          <LondonDoctrineGate
            paperOrder={pendingPaper.order}
            onSolved={onDoctrineSolved}
            onAbort={onDoctrineAbort}
          />
        )}

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
              <button type="button" className={btn} onClick={goMenu}>
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
            <p className="text-[14px] text-game-yellow">THE FRUITFUL GRAPE VINE IS PURGED</p>
            <p className="max-w-sm text-[10px] leading-relaxed">
              * The grasslands burn into a peaceful night.
              <br />* You finished at LV {level} with {gold} R.
              <br />* Paul Barnabus's road is clear.
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
              <button type="button" className={btn} onClick={goMenu}>
                Main menu
              </button>
            </div>
          </section>
        )}
      </div>

      {mode !== "battle" &&
        mode !== "title" &&
        mode !== "splash" &&
        mode !== "hatch" &&
        mode !== "shrine" &&
        mode !== "sprint" &&
        mode !== "endless" &&
        mode !== "reason" &&
        mode !== "reasonEndless" &&
        mode !== "reasonCampaign" &&
        mode !== "ending" && (
          <div className="flex w-full max-w-[640px] flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="text-game-yellow">
              {mapId === "grasslands" ? (vinePurged ? "GRASSLANDS · NIGHT" : "GRASSLANDS") : "GREENVALE"} · LV{" "}
              {level}
            </span>
            <span>
              HP {Math.max(0, hp)} / {maxHp}
            </span>
            <span>EXP {exp}</span>
            <span className="text-[#38c060]">{gold} R</span>
            <span>
              Heart x{items.cookie} · Fairy x{items.hotdog}
            </span>
            {allPapersCollected(collectedPapers) && (
              <button
                type="button"
                className="border border-game-yellow px-2 py-1 font-pixel text-[9px] text-game-yellow hover:bg-game-yellow hover:text-game-bg"
                onClick={() => setBookOpen(true)}
              >
                B · BOOK
              </button>
            )}
          </div>
        )}
    </div>
  );
}
