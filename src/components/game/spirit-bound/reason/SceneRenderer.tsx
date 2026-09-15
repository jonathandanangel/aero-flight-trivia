import { motion } from "framer-motion";
import { glyph, HUE_COLORBLIND, HUE_HEX, HUE_MARK } from "@/game/spirit-bound/reason/catalog";
import { isActive } from "@/game/spirit-bound/reason/logicEngine";
import type { AccessMode, Entity, Scene } from "@/game/spirit-bound/reason/types";
import { cn } from "@/lib/utils";

type Props = {
  scene: Scene;
  access: AccessMode;
  pulse?: boolean;
};

function tokenColor(entity: Entity, colorblind: boolean): string {
  return colorblind ? HUE_COLORBLIND[entity.hue] : HUE_HEX[entity.hue];
}

function Token({
  entity,
  ownerLabel,
  access,
  delay,
}: {
  entity: Entity;
  ownerLabel: string | null;
  access: AccessMode;
  delay: number;
}) {
  const color = tokenColor(entity, access.colorblind);
  return (
    <motion.div
      initial={access.reducedMotion ? false : { scale: 0.86, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: access.reducedMotion ? 0 : delay, duration: 0.2 }}
      className={cn(
        "flex min-h-[74px] flex-col items-center justify-center border-2 px-1 py-2 text-center",
        access.highContrast ? "border-white bg-black" : "border-[#705018] bg-[#201808]",
      )}
    >
      <span className="text-[16px] leading-none" style={{ color }} aria-hidden>
        {glyph(entity.kind)}
      </span>
      {access.colorblind && (
        <span className="mt-1 text-[8px] text-[#f8f0c8]">{HUE_MARK[entity.hue]}</span>
      )}
      <span className={cn("mt-1 text-[7px] leading-tight", access.textSize === "lg" && "text-[8px]")}>
        {entity.label}
      </span>
      <span className="mt-1 text-[7px] text-game-yellow">FIRE {entity.power}{isActive(entity) ? "" : " · DIM"}</span>
      {ownerLabel ? <span className="text-[6px] text-[#f8f0c8]/70">HELD BY {ownerLabel}</span> : null}
    </motion.div>
  );
}

export function SceneRenderer({ scene, access, pulse }: Props) {
  const grid = [0, 1].flatMap((row) =>
    [0, 1, 2].map((col) => scene.entities.find((e) => e.col === col && e.row === row) ?? null),
  );
  const events = [...scene.events].sort((a, b) => a.time - b.time);

  return (
    <div
      className={cn(
        "relative border-2 p-3",
        access.highContrast ? "border-white bg-black" : "border-[#3a2810] bg-[#142010]",
        pulse && !access.reducedMotion && "animate-pulse",
      )}
    >
      <div className="mb-2 flex justify-between text-[7px] text-game-yellow">
        <span>WEST</span>
        <span>THE GREEN</span>
        <span>EAST</span>
      </div>
      <div className="mb-2 text-center text-[7px] text-game-yellow">NORTH CROWN · AFTER</div>
      <div className="grid grid-cols-3 gap-2">
        {grid.map((entity, i) =>
          entity ? (
            <Token
              key={entity.id}
              entity={entity}
              ownerLabel={
                entity.ownerId
                  ? (scene.entities.find((h) => h.id === entity.ownerId)?.label ?? null)
                  : null
              }
              access={access}
              delay={i * 0.04}
            />
          ) : (
            <div key={`empty-${i}`} className="min-h-[74px] border border-dashed border-[#705018]/40" />
          ),
        )}
      </div>
      <div className="mt-2 text-center text-[7px] text-game-yellow">SOUTH ROOTS · BEFORE / BEHIND</div>
      {events.length > 0 && (
        <div className="mt-3 border-t border-[#705018] pt-2">
          <p className="mb-1 text-[7px] text-game-orange">TIMELINE</p>
          <div className="flex items-center gap-1">
            {events.map((ev, i) => (
              <div key={ev.id} className="flex flex-1 items-center">
                <div className="flex-1 border-t border-game-yellow" />
                <span className="border border-game-yellow px-1 py-1 text-[7px] text-[#f8f0c8]">
                  {ev.phrase.replace(/^the /, "").toUpperCase()}
                </span>
                {i === events.length - 1 && <div className="flex-1 border-t border-game-yellow" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
