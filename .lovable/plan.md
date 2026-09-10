# AeroGrid 99: Flight Dynamics Trivia

A complete neon retro-arcade aerodynamics trivia game with 333 questions, interactive diagrams, a memory recovery minigame, and a rocket-launch finale.

## What you'll get

**Title screen** — neon city skyline, star field, moon, "press Start to enable sound", Start / Resume / Practice / Impact Archive / Settings.

**Main game** — big question panel, diagram stage, progress readout (QUESTION 001 / 333), score, streak, energy-plant recovery indicator, music genre badge, hint and submit buttons, pause menu.

**Ten ways to answer questions**
- Drag-and-drop sentence completion (with tap-to-place on phones)
- Multiple choice, exactly four options, keyboard 1-4 / A-D
- Diagram hotspots (click the point, plus a keyboard list of the same targets)
- Diagram label placement onto airfoils, cylinders, aircraft
- Equation builder with fractions, Greek letters, superscripts
- Sequencing physical events
- Force-vector placement
- Compare-and-select
- Formula-to-meaning matching
- Short fill-in

**Question bank** — 300 aerodynamics questions in 60 five-question sets across chapters A-J, plus 33 Impact Archive questions, each with prompt, answer, explanation, hint, difficulty, category, misconception feedback, and music mood. A hidden validation panel checks every rule from the spec (counts, four choices, no duplicate wording, diagram data present, keyboard playable) and lists failing question IDs.

**Right answer** — cyan/mint highlight, success tone, explanation, glowing disc-aircraft wipe, and a brief 2-second neon light-rider chase (skippable and disableable).

**Wrong answer** — amber highlight, rain-on-metal tone, misconception feedback, then Electric Recall.

**Electric Recall minigame** — 11 electric squares flash a fresh sequence; repeat it. Success shows "AMAZING!" and raises the sequence length by 3 (max 11); failure lowers it by 3 (min 2). At 2 the HUD shows two glowing bio-energy plants, and failing there is GAME OVER with restart chapter / restart campaign / review missed / main menu.

**Finale** — after question 333, rocket launch, MISSION SUCCESS, full stats, review missed, mastery mode, export summary.

**World and audio** — sky shifts from late afternoon through night to sunrise as you progress; drifting clouds, moon, light riders. Five synthesized retro music beds (synthwave, chiptune, ambient space, breakbeat, retro-funk) that crossfade, plus all the described sound effects, with master/music/effects sliders saved locally.

**Accessibility** — full keyboard play, reduced-motion mode, no-timer option, CRT scanline toggle, symbols and tones alongside color, photosensitivity warning before intense effects.

**Saving** — progress, score, streak, recovery length, settings, and missed questions persist in the browser, so you can close the tab and resume.

## Technical approach

- TanStack Start routes: `/` (title), `/play`, `/practice`, `/archive`, `/finale`, plus a dev-only `/validate` panel.
- Game state in a reducer-backed store with localStorage persistence; no backend needed.
- Questions live in typed TS modules under `src/data/questions/` split by chapter, matching the spec's data model exactly (`AERO-001`…`AERO-300`, `IMPACT-001`…`IMPACT-033`, continuous `globalNumber`).
- Diagrams are hand-authored parametric SVG components (airfoil variants, cylinder flow, aircraft force vectors, boundary layer, Mach cone, pressure distribution) driven by `diagramConfig`, so no external images are required.
- Audio via a small Web Audio manager that synthesizes loops and effects — no audio files, no autoplay violations.
- Design tokens (midnight navy, electric cyan, mint, amber, magenta) added to `src/styles.css`; no hardcoded colors in components.

## Build order

1. Design system, shell, title screen, world background, audio manager.
2. Question data model, validation panel, and the interaction components.
3. Game loop: HUD, submit/lock, celebration, transitions, persistence.
4. Electric Recall minigame and recovery-length rules.
5. Question bank authored chapter by chapter to the full 333.
6. Finale sequence, practice mode, Impact Archive, stats, accessibility pass.

Authoring 333 unique questions is the bulk of the work and will run in batches; the game stays playable throughout as sets land.
