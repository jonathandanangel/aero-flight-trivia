# Question authoring contract (AeroGrid 99)

All question data lives in `src/data/questions/<chapter>.ts` and exports:

```ts
import type { QuestionSeed } from "@/game/seed";
export const chapterXQuestions: QuestionSeed[] = [ ... ];
```

`QuestionSeed = Omit<Question, "id" | "globalNumber">` (see `src/game/types.ts`).
Ids and global numbers are stamped automatically in `src/data/questions/index.ts`,
so authors must NOT set them. Order inside the array matters: set 01 q1..q5, set 02 q1..q5, ...

## Required fields on every seed

`chapterId`, `setId` (e.g. `"set-07"`), `category`, `difficulty` (1-5),
`interactionType`, `prompt`, `correctAnswer`, `explanation`, `hint`,
`audioGenre`, `points` (100 base; 100 + 25*(difficulty-1) is fine),
`diagramType` (or `null`), `misconceptionFeedback` (at least one entry).

## Per interaction type

- `drag-drop`: `sentenceParts` (n+1 fragments; blanks between them),
  `draggableTokens` (correct tokens + 2-4 plausible distractors, all unique),
  `correctAnswer` = tokens in blank order. Prompt restates the sentence.
- `equation-builder`: same shape as drag-drop, plus `formula` (display string).
  Use unicode: ρ, μ, ν, ∞, ², ½, √, α, θ, π, ⁄.
- `multiple-choice`: `choices` = EXACTLY 4 unique strings; `correctAnswer` = [the correct choice text].
- `compare-select`: `choices` = 2-4 unique strings; `correctAnswer` = [correct choice text].
- `hotspot`: `diagramType` set, `targets` = 3-6 `{id,label,x,y}` (x,y are % of the
  diagram stage), `correctAnswer` = [correct target id].
- `label-placement` / `vector-placement`: `diagramType` set, `targets` = 2-5 slots where
  `label` is the CORRECT term for that slot, `draggableTokens` = all correct labels plus
  1-3 distractors, `correctAnswer` = labels in the same order as `targets`.
- `sequencing`: `steps` = correct order (3-7 items), `correctAnswer` = same array.
- `matching`: `pairs` = 3-5 `{left,right}` (unique), `correctAnswer` = right values in pair order.
- `fill-in`: `correctAnswer` = [primary answer], `acceptedAnswers` = lowercase synonyms
  (include the primary answer lowercased). Single-word or short phrase only.

## Quality rules (enforced by the in-app validator)

- No two questions anywhere may share identical `prompt` wording.
- No duplicated string inside `choices`, `draggableTokens`, `steps` or `targets`.
- Every question must be answerable with a keyboard (all our renderers are, so just
  keep token/target counts reasonable).
- Explanations: 1-2 sentences, scientifically accurate, no fluff.
- Hints: one short nudge, never the literal answer.
- Content must be real aerodynamics, correct and self-consistent. No placeholders,
  no "Question goes here", no TODO.

## Set composition

Each 5-question set normally contains: one drag-drop, one diagram (hotspot or
label-placement), one multiple-choice, one equation-builder or matching, one applied
challenge (sequencing / compare-select / harder multiple-choice / fill-in).
Deviate when a topic does not suit a format.

## Diagram types available

`atmospheric-flight`, `airfoil-geometry`, `airfoil-camber`, `airfoil-symmetric`,
`airfoil-pressure`, `airfoil-forces`, `airfoil-shear`, `boundary-layer`,
`center-of-pressure`, `aerodynamic-center`, `wing-3d`, `cylinder-flow`,
`cylinder-separation`, `aircraft-forces`, `stream-tube`, `velocity-profile`,
`mach-cone`.

Coordinate hints (percent of stage, all diagrams draw the body centred):
- airfoil-*: leading edge ~ (18,52), trailing edge ~ (82,55), upper surface ~ (45,40),
  lower surface ~ (45,62), quarter-chord ~ (34,50), chord line ~ (50,55), max camber ~ (42,44).
- cylinder-*: front stagnation ~ (34,50), rear stagnation ~ (66,50), top shoulder ~ (50,33),
  separation point ~ (60,36), wake ~ (80,50).
- aircraft-forces: lift arrow ~ (50,20), weight ~ (50,80), thrust ~ (22,50), drag ~ (78,50).
- boundary-layer / velocity-profile: wall ~ (50,78), edge of layer ~ (50,45), free stream ~ (50,22).
- mach-cone: apex ~ (30,50), cone edge ~ (65,28), wave front ~ (70,72).
- stream-tube: inlet ~ (20,50), throat ~ (50,50), outlet ~ (80,50).

## Audio genre guidance

`ambient-space` for equation/matching, `breakbeat` for sequencing, `chiptune` for
diagram work, `synthwave` for multiple choice, `retro-funk` for applied challenges.
