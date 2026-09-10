# Evolved Electric Recall

## Goal
Upgrade Electric Recall for campaign questions 150 and above without changing the existing recovery rules or earlier-question experience.

## Implementation
- Pass the active campaign question number into Electric Recall and enable evolved mode at question 150+.
- Show an immediate neon-purple `EVOLVED!` splash before the sequence begins; shorten or remove its motion when reduced-motion is enabled.
- Generate a stable randomized, collision-free arrangement of all 11 memory squares inside a bounded play area, with responsive sizing for desktop and mobile.
- Keep the same sequence and answer checking, then activate a distraction state after playback where each square cycles through a distinct neon color pattern.
- Accelerate evolved sequence timing and shorten recall-note playback so audio and visual pacing stay synchronized.
- Preserve the fixed grid and original pacing before question 150.

## Validation
- Verify normal Electric Recall still uses its grid below question 150.
- Verify question 150+ shows the splash, random non-overlapping positions, color pulses after playback, and faster cues.
- Verify reduced-motion mode avoids animated pulsing while preserving clear colors and full gameplay.
- Check keyboard-accessible buttons, mobile fit, and browser errors.

## Technical details
- Random layout generation will use bounded normalized coordinates and minimum-distance rejection with a deterministic fallback, preventing overlap across rerenders.
- Evolved visuals will use semantic neon tokens and CSS custom properties; reduced-motion will disable continuous color animation.
