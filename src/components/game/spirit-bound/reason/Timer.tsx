import { cn } from "@/lib/utils";

type Props = {
  seconds: number;
  urgent?: boolean;
  live?: boolean;
};

export function Timer({ seconds, urgent, live }: Props) {
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <span className={cn("text-[10px]", urgent ? "text-game-hp" : "text-game-yellow")}>
      {live ? "LIVE " : ""}
      {clock}
    </span>
  );
}
