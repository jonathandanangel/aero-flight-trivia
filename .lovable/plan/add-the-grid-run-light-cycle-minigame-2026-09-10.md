# Add the Grid Run light-cycle minigame

## Goal
Add a playable 2D neon light-cycle duel that interrupts the campaign after every 15th correct trivia answer, then returns the player to the same campaign flow without losing score or progress.

## Player flow
1. A correct campaign answer still shows its normal explanation and winged-brain celebration.
2. If that answer reaches a new 15-correct milestone, pressing **Continue** starts a short full-screen fade.
3. The **Grid Run** arena appears with the player’s cyan cycle and an orange-red AI cycle. Both leave permanent trails; hitting a trail or the arena wall ends the round.
4. The player steers with arrow keys or WASD. Large directional controls make the same game playable on touch screens.
5. A win, loss, or draw shows the result and a **Return to flight deck** action. Returning fades back to the next unanswered trivia question with campaign score, streak, and progression preserved.
6. Pausing or returning to the main menu before starting a due milestone keeps that milestone pending, so it cannot be skipped.

## Game rules and presentation
- Use a stable, fixed-cell arena updated on a timed game loop, with immediate collision detection against boundaries and either racer’s solid trail.
- Prevent instant 180-degree reversals for both racers.
- Give the AI a lightweight survival strategy: continue when safe, otherwise prefer legal turns and bias toward open space rather than using random movement alone.
- Render crisp pixel-art cycles, cyan and orange-red trails, neon grid lines, a distant cyberpunk skyline, clouds, and a moving celestial body.
- Cycle the arena sky continuously through day, sunset, night, and dawn with ambient lighting changes.
- Show an accessible status announcement for round start and outcome. Keyboard/touch controls remain available even when motion is reduced.

## Milestone progression
- Track the highest completed or dismissed Grid Run milestone in the existing campaign save.
- Derive a due round from `floor(correctCount / 15)` so only campaign correctness triggers it and saved campaigns resume correctly.
- Increase simulation difficulty per milestone within safe caps: faster cycle ticks, quicker day/night cycles, and higher chiptune tempo.
- Do not award or remove trivia points, alter streaks, or change Electric Recall state based on the minigame result.
- Reset Grid Run milestone progress when starting a brand-new campaign; preserve it for resume and chapter restart.

## Audio and transitions
- Extend the synthesized audio manager with an adjustable tempo multiplier and light-cycle start/turn/crash/win sounds.
- Switch to chiptune for Grid Run, increasing tempo at each milestone; restore the active question’s music and normal tempo after leaving.
- Add a reusable full-screen fade state around entry and exit. With reduced motion enabled, use an immediate/static scene change instead of animated fades while preserving gameplay timing.

## Implementation structure
- Add a focused `LightCycleGame` component containing the arena loop, AI, controls, collision logic, scene cycle, HUD, and result state.
- Integrate a `lightcycle` screen and pending milestone state into the existing AeroGrid state machine.
- Add one backward-compatible progress field to the local save defaults; existing saves merge safely with the new default.
- Add semantic arena and transition styles to the global design system without external images or additional packages.

## Verification
- Verify static typing.
- Browser-test milestone triggering at 15 correct answers, keyboard steering, touch controls, collisions/results, exit fade, preserved score/index/streak, resume behavior, and no repeat trigger for a completed milestone.
- Check desktop and mobile layouts, console errors, and reduced-motion behavior.
