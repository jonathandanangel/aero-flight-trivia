# Aerodynamics Extreme

A new high-stakes mode: pass a three-stage memory gauntlet, then face a curated run of the toughest airfoil, four-forces, and Mach questions.

## Mode entry

- New "Aerodynamics Extreme" entry on the title menu, sitting under High-Speed Lab with its own laboratory styling (distinct neon accent, warning strapline about the gauntlet).
- Choosing it goes to a short brief screen, then straight into the gauntlet.

## Curated question bank

The mode draws only from existing questions in these areas, kept in a fixed teaching order:
- Airfoil design and geometry (chapter F)
- The four flight forces, including the left-facing aircraft diagram question (chapter G)
- Mach science: incompressible below M 0.3, subsonic, transonic, supersonic, hypersonic, critical Mach, shock angles, wave drag (chapters J and K)

Selection is by chapter and category matching, so no new question content is authored and the main campaign is untouched.

## Three-stage memory gauntlet

Runs before any question, with a stage banner, retro sound cues, and keyboard plus touch input throughout.

- Stage 1 — Classic: fixed grid sequence memory, same feel as the standard recovery trial.
- Stage 2 — Evolved: the same sequence rules on randomly scattered, non-overlapping nodes.
- Stage 3 — Path Memory (new): neon nodes appear and a path lights up between them one link at a time. After playback the nodes and lines pulse through rainbow neon. The player retraces the connections in order by clicking, tapping, or using arrow-key node focus plus Enter.

Scoring and stakes:
- Clearing a stage: +3 points and a longer sequence for the next stage.
- Failing a stage: -3 points, one life lost, and a retry with a shorter sequence.
- Three failures ends the gauntlet run and returns to the title with the score shown.
- Path Memory length scales from how the first two stages went.

Clearing Path Memory unlocks the question gauntlet.

## Question gauntlet

- Full HUD: stage/question counter, score, streak, and lives.
- Same answering, hint, and reveal flow as the main game, with gauntlet score kept separate from campaign progress.
- Wrong answers cost a life instead of triggering the standard recovery minigame; running out ends the run with a summary and retry option.
- Finishing the curated set shows a completion panel with score, accuracy, and best streak.

## Technical notes

- New `src/components/game/MemoryGauntlet.tsx` (three stages, shared node engine) and `src/components/game/PathMemory.tsx` for the path trial.
- New `src/game/extreme.ts` selecting the curated question list from the existing bank.
- `AeroGrid.tsx` gains an `extreme` mode plus `gauntlet` screen state; `TitleScreen.tsx` gains the new entry.
- New retro cues in `audio.ts` (path link, path complete, stage clear, stage fail); rainbow pulse and node styling as tokens in `styles.css`.
- Reduced motion disables pulsing and shortens splashes; all interactive nodes stay keyboard reachable and labelled.
- Extreme-mode score and best result persist alongside existing save data, without altering campaign fields.
