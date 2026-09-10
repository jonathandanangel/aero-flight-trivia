# Blood Moon Awakening

## Goal
At question 150+, make the first evolved Electric Recall reveal permanently transform the background moon and sky into a vivid blood-moon state.

## Implementation
- Add a dedicated evolved announcement sound when the `EVOLVED!` splash appears.
- At the end of that splash, signal the main game to activate the blood moon so the visual transformation follows the announcement and sound.
- Persist a `bloodMoonAwakened` campaign flag so the transformed sky remains active for all later questions, intermissions, and resumed saves; reset it only when starting a new campaign.
- Update the world background with a bright red moon, layered crimson halo, atmospheric red wash, and glowing red horizon while preserving the existing skyline and motion settings.
- Keep the normal moon and atmosphere unchanged before the transformation.

## Validation
- Reach evolved Electric Recall at question 150 and verify the normal moon remains during the splash, then transforms immediately afterward.
- Verify the blood moon stays active after recovery, across later screens, and after reloading/resuming the campaign.
- Verify a new campaign restores the normal moon and reduced-motion mode avoids unnecessary animation.

## Technical details
- The transformation trigger will be an explicit callback from Electric Recall when its splash phase completes, rather than relying only on the current question number.
- The persisted flag will be backward-compatible with existing saves through the current default-progress merge.
- Crimson colors, glow, and atmosphere will use semantic design tokens and CSS classes.
