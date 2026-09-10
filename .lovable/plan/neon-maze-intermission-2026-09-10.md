# Neon Maze Intermission

## Goal
Add a polished Pac-Man-inspired cyber-grid minigame and fold it into campaign intermissions without disrupting trivia score, streak, question position, or existing saves.

## Intermission rules
- Keep the existing Grid Run trigger every 15 correct campaign answers.
- Grid Run remains the only 15-correct intermission before question 150.
- Reaching question 150 unlocks the neon maze and also starts a second cadence at questions 150, 200, 250, and 300.
- Once unlocked, every due intermission—whether caused by 15 correct answers or a 50-question checkpoint—randomly selects Grid Run or Neon Maze.
- If both trigger types become due on the same answer, launch one randomly selected intermission and mark both milestones complete to avoid back-to-back interruptions.
- Use a stable per-trigger random seed so refreshing or resuming cannot reroll or skip the selected game.

## Neon Maze gameplay
- Build a compact, fully reachable pixel-grid maze rendered on canvas with neon walls that cycle through rainbow colors.
- Add classic movement with buffered turns, arrow/WASD keyboard controls, and an on-screen touch directional pad.
- Populate the maze with pellets and power pellets; collecting all pellets wins the run.
- Add multiple AI ghosts with distinct chase targets and safe intersection routing.
- Normal ghost contact costs a life; power pellets temporarily frighten ghosts so the player can eat them for bonus points.
- Include ready, running, win, and loss states, lives and pellet counters, clear status announcements, and an explicit return button after completion.

## Presentation and sound
- Match the existing cyber-Tron arcade framing, typography, canvas treatment, and HUD.
- Rapidly cycle wall/grid hues while keeping gameplay pieces readable against the maze.
- Use synthesized chiptune music plus pellet, power-up, ghost, life-loss, start, win, and loss effects through the existing audio controls.
- Reuse the existing smooth scene fade entering and leaving either intermission.
- Under reduced motion, stop rapid hue/pulse animation and use a stable high-contrast neon palette while preserving gameplay.

## Campaign and save integration
- Generalize the current pending Grid Run state into a pending intermission containing its trigger and selected game.
- Preserve the current saved 15-correct milestone field for backward compatibility and add a saved 50-question checkpoint marker.
- On resume, detect either overdue trigger, reconstruct the same selected game, and enter it before returning to trivia.
- Completing either minigame advances only the relevant saved milestone marker(s), then resumes the exact trivia run with score and streak intact.

## Technical details
- Add `src/components/game/NeonMazeGame.tsx` using the same canvas/tick architecture and cleanup discipline as Grid Run.
- Extend `src/game/audio.ts` with maze-specific synthesized effects.
- Update `src/game/store.tsx` with backward-compatible intermission checkpoint persistence.
- Update `src/components/game/AeroGrid.tsx` to schedule, render, and finish either minigame through one shared transition flow.
- Add semantic maze styling and reduced-motion rules in `src/styles.css`.

## Verification
- Verify TypeScript compilation.
- Play through movement, wall blocking, pellet collection, power mode, ghost collisions, win/loss, keyboard, and touch controls.
- Verify pre-150 15-correct triggers remain Grid Run only.
- Verify question 150 and later 50-question checkpoints can select either game, including simultaneous-trigger deduplication.
- Verify refresh/resume does not reroll or skip a pending intermission.
- Verify score, streak, and question progress survive both minigames.
- Check desktop, mobile overflow, reduced-motion behavior, audio controls, transitions, and browser console errors.
