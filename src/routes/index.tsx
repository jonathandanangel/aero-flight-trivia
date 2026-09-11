import { createFileRoute } from "@tanstack/react-router";
import { AeroGrid } from "@/components/game/AeroGrid";
import { GameProvider } from "@/game/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZEUS AMMON-RA 11: Flight Dynamics Trivia" },
      {
        name: "description",
        content:
          "A neon retro-arcade aerodynamics trivia game: 333 questions, interactive diagrams, drag-and-drop answers and the Electric Recall minigame.",
      },
      { property: "og:title", content: "ZEUS AMMON-RA 11: Flight Dynamics Trivia" },
      {
        property: "og:description",
        content:
          "Learn aerodynamics through 333 interactive questions, diagram labelling, formula building and a retro arcade recovery minigame.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <GameProvider>
      <AeroGrid />
    </GameProvider>
  );
}
