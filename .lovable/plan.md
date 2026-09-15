# Add creator credits to title screen

## Goal
Display the game creator names in small text on the title screen:
- Bottom left: "WOZKAF"
- Bottom right: "Jonathan Angel"

## What will change
- `src/components/game/TitleScreen.tsx`
  - Add a fixed-position/footer row inside the title screen container.
  - Place "WOZKAF" at the bottom left and "Jonathan Angel" at the bottom right.
  - Use the existing `font-mono` typeface and `text-muted-foreground` color token at a small size (`text-[10px]` or `text-xs`) so it matches the retro HUD aesthetic without competing with the title or menu buttons.
  - Ensure the names sit below the existing menu grid and photosensitivity notice, with adequate vertical spacing.
  - Keep the layout responsive: names should remain pinned to left/right on narrow viewports and not wrap under the buttons.

- `src/styles.css` (if needed)
  - No new tokens required; reuse existing muted-foreground and mono font utilities.
  - Only add a tiny utility if the default flex/grid alignment cannot place the credits cleanly.

## Verification
- Typecheck passes (`bunx tsgo --noEmit`).
- Title screen renders both names in the correct corners at small size.
- Names remain readable and do not overlap buttons or the photosensitivity notice on mobile and desktop.
