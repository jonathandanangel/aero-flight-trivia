import type { QuestionSeed } from "@/game/seed";

export const chapterDQuestions: QuestionSeed[] = [
  // ===== set-17: Meaning of viscosity =====
  {
    chapterId: "viscosity",
    setId: "set-17",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "drag-drop",
    prompt: "Complete the sentence defining viscosity.",
    sentenceParts: [
      "Viscosity is a measure of a fluid's internal ",
      " to ",
      " deformation between adjacent layers."
    ],
    draggableTokens: ["resistance", "shear", "affinity", "tension"],
    correctAnswer: ["resistance", "shear"],
    explanation: "Viscosity quantifies how strongly a fluid resists shear deformation, that is, the relative sliding of adjacent fluid layers.",
    hint: "Think of it as internal friction between fluid layers.",
    diagramType: null,
    misconceptionFeedback: {
      "affinity": "Affinity is not the physical property being described here.",
      "tension": "Tension usually refers to surface tension, a different property."
    },
    audioGenre: "breakbeat",
    points: 125
  },
  {
    chapterId: "viscosity",
    setId: "set-17",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "multiple-choice",
    prompt: "Which everyday phenomenon best illustrates the effect of viscosity?",
    choices: ["Honey flowing more slowly than water when poured", "A stone sinking in air", "Sound traveling faster in solids than gases", "Ice being denser than liquid water"],
    correctAnswer: ["Honey flowing more slowly than water when poured"],
    explanation: "Honey has a much higher viscosity than water, so it resists deformation and flows far more sluggishly when poured.",
    hint: "Compare how easily two common fluids pour.",
    diagramType: null,
    misconceptionFeedback: {
      "A stone sinking in air": "This is mainly about gravity and density, not primarily viscosity.",
      "Sound traveling faster in solids than gases": "This relates to elasticity and density of the medium, not viscosity.",
      "Ice being denser than liquid water": "This is a density anomaly of water, unrelated to viscosity."
    },
    audioGenre: "synthwave",
    points: 125
  },
  {
    chapterId: "viscosity",
    setId: "set-17",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "hotspot",
    prompt: "On this velocity profile near a solid wall, click the region where viscous shearing between fluid layers is strongest.",
    diagramType: "velocity-profile",
    targets: [
      { id: "wall", label: "Near the wall (steep velocity gradient)", x: 50, y: 78 },
      { id: "edge", label: "Edge of the boundary layer", x: 50, y: 45 },
      { id: "freestream", label: "Free stream (uniform velocity)", x: 50, y: 22 }
    ],
    correctAnswer: ["wall"],
    explanation: "Viscous shear stress is proportional to the velocity gradient, which is steepest near the wall where the no-slip condition forces velocity to drop rapidly to zero.",
    hint: "Where does the velocity change most rapidly with distance?",
    misconceptionFeedback: {
      "edge": "The gradient is smaller near the edge of the boundary layer than right at the wall.",
      "freestream": "In the free stream the velocity is nearly uniform, so the gradient and shear are close to zero."
    },
    audioGenre: "chiptune",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-17",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "fill-in",
    prompt: "What term describes a hypothetical fluid with zero viscosity that experiences no shear resistance?",
    correctAnswer: ["inviscid fluid"],
    acceptedAnswers: ["inviscid fluid", "inviscid", "ideal fluid"],
    explanation: "An inviscid (or ideal) fluid is a theoretical fluid with zero viscosity, so it offers no resistance to shear deformation.",
    hint: "It's the opposite of a viscous fluid.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "retro-funk",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-17",
    category: "Viscosity",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "Why does viscosity matter even though the real atmosphere is mostly dominated by inertial effects at typical flight speeds?",
    choices: ["It creates the thin boundary layer responsible for skin friction drag", "It changes the color of the sky", "It prevents air from having any density", "It makes lift impossible to generate"],
    correctAnswer: ["It creates the thin boundary layer responsible for skin friction drag"],
    explanation: "Even at high Reynolds numbers, viscosity is essential within the thin boundary layer near a surface, producing skin friction drag and enabling the no-slip condition.",
    hint: "Think about where viscous effects concentrate near a surface.",
    diagramType: null,
    misconceptionFeedback: {
      "It changes the color of the sky": "Sky color is a light-scattering phenomenon, unrelated to viscosity.",
      "It prevents air from having any density": "Viscosity and density are independent fluid properties.",
      "It makes lift impossible to generate": "Viscosity does not prevent lift; lift is generated even in real, viscous air."
    },
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-18: Fluidity comparisons =====
  {
    chapterId: "viscosity",
    setId: "set-18",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "drag-drop",
    prompt: "Complete the sentence relating fluidity to viscosity.",
    sentenceParts: [
      "Fluidity is the ",
      " of viscosity, so a fluid with low viscosity has ",
      " fluidity."
    ],
    draggableTokens: ["reciprocal", "high", "sum", "low"],
    correctAnswer: ["reciprocal", "high"],
    explanation: "Fluidity is defined as the reciprocal of viscosity, so fluids that flow easily (low viscosity) have high fluidity.",
    hint: "Fluidity and viscosity are inversely related.",
    diagramType: null,
    misconceptionFeedback: {
      "sum": "Fluidity is not a sum involving viscosity; it is its reciprocal.",
      "low": "A low-viscosity fluid flows easily, which corresponds to high, not low, fluidity."
    },
    audioGenre: "breakbeat",
    points: 125
  },
  {
    chapterId: "viscosity",
    setId: "set-18",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "compare-select",
    prompt: "Which fluid has greater fluidity: air or engine oil, both at room temperature?",
    choices: ["Air", "Engine oil", "They have identical fluidity", "Fluidity cannot be compared between gases and liquids"],
    correctAnswer: ["Air"],
    explanation: "Air has a much lower viscosity than engine oil, so it has far greater fluidity and flows much more readily.",
    hint: "Which one pours and flows more easily?",
    diagramType: null,
    misconceptionFeedback: {
      "Engine oil": "Engine oil is much more viscous than air, giving it lower, not higher, fluidity.",
      "They have identical fluidity": "Their viscosities differ by several orders of magnitude, so their fluidities differ greatly.",
      "Fluidity cannot be compared between gases and liquids": "Fluidity, as the reciprocal of viscosity, can be compared across any fluids."
    },
    audioGenre: "synthwave",
    points: 125
  },
  {
    chapterId: "viscosity",
    setId: "set-18",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "multiple-choice",
    prompt: "As temperature increases, how does the viscosity of a typical liquid such as water generally change, and how does its fluidity respond?",
    choices: ["Viscosity decreases, so fluidity increases", "Viscosity increases, so fluidity increases", "Viscosity decreases, so fluidity decreases", "Neither viscosity nor fluidity changes with temperature"],
    correctAnswer: ["Viscosity decreases, so fluidity increases"],
    explanation: "For most liquids, increasing temperature weakens intermolecular attractions, lowering viscosity and correspondingly raising fluidity.",
    hint: "Warm honey flows more easily than cold honey.",
    diagramType: null,
    misconceptionFeedback: {
      "Viscosity increases, so fluidity increases": "These two changes would be inconsistent, since fluidity is the reciprocal of viscosity.",
      "Viscosity decreases, so fluidity decreases": "If viscosity decreases, fluidity (its reciprocal) must increase, not decrease.",
      "Neither viscosity nor fluidity changes with temperature": "Both properties are known to be temperature dependent for liquids."
    },
    audioGenre: "synthwave",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-18",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "matching",
    prompt: "Match each fluid to its relative fluidity compared with the others at room temperature.",
    pairs: [
      { left: "Air", right: "Very high fluidity" },
      { left: "Water", right: "Moderate fluidity" },
      { left: "Honey", right: "Low fluidity" },
      { left: "Tar", right: "Extremely low fluidity" }
    ],
    correctAnswer: ["Very high fluidity", "Moderate fluidity", "Low fluidity", "Extremely low fluidity"],
    explanation: "Fluidity decreases as viscosity increases; air flows most easily, followed by water, then honey, then highly viscous substances such as tar.",
    hint: "Rank these substances from easiest to hardest to pour.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "ambient-space",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-18",
    category: "Viscosity",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "Unlike liquids, gas viscosity increases with temperature. What does this imply about the fluidity of air as it is heated?",
    choices: ["Air's fluidity decreases slightly as it is heated", "Air's fluidity increases sharply as it is heated", "Air's fluidity is unaffected by temperature", "Air becomes a liquid when heated"],
    correctAnswer: ["Air's fluidity decreases slightly as it is heated"],
    explanation: "Because gas viscosity rises with temperature due to increased molecular momentum exchange, fluidity, the reciprocal of viscosity, correspondingly decreases slightly.",
    hint: "Recall that fluidity and viscosity move in opposite directions.",
    diagramType: null,
    misconceptionFeedback: {
      "Air's fluidity increases sharply as it is heated": "This would require viscosity to decrease, but gas viscosity actually increases with temperature.",
      "Air's fluidity is unaffected by temperature": "Gas viscosity is known to depend on temperature, so fluidity is affected too.",
      "Air becomes a liquid when heated": "Heating a gas does not cause it to become a liquid."
    },
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-19: Shear stress =====
  {
    chapterId: "viscosity",
    setId: "set-19",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "drag-drop",
    prompt: "Complete the sentence describing shear stress in a fluid.",
    sentenceParts: [
      "Shear stress is a force acting ",
      " to a surface, per unit ",
      ", that tends to slide adjacent fluid layers relative to one another."
    ],
    draggableTokens: ["tangentially", "area", "perpendicularly", "volume"],
    correctAnswer: ["tangentially", "area"],
    explanation: "Shear stress is the tangential force per unit area that causes adjacent fluid layers to slide past one another, distinguishing it from normal (pressure) stress.",
    hint: "Shear acts parallel to the surface, unlike pressure.",
    diagramType: null,
    misconceptionFeedback: {
      "perpendicularly": "A perpendicular force per unit area describes normal stress (pressure), not shear stress.",
      "volume": "Stress is defined per unit area, not per unit volume."
    },
    audioGenre: "breakbeat",
    points: 125
  },
  {
    chapterId: "viscosity",
    setId: "set-19",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "hotspot",
    prompt: "On this airfoil, click the region where viscous shear stress acts directly on the surface.",
    diagramType: "airfoil-shear",
    targets: [
      { id: "surface", label: "Boundary layer next to the airfoil surface", x: 45, y: 40 },
      { id: "chord", label: "Chord line inside the airfoil", x: 50, y: 55 },
      { id: "farfield", label: "Undisturbed far-field flow", x: 50, y: 22 }
    ],
    correctAnswer: ["surface"],
    explanation: "Viscous shear stress is generated in the boundary layer immediately adjacent to the surface, where the velocity gradient is steep due to the no-slip condition.",
    hint: "Shear stress requires a velocity gradient near the wall.",
    misconceptionFeedback: {
      "chord": "The chord line is a geometric reference inside the solid body, not a location of fluid shear.",
      "farfield": "Far from the surface, the velocity gradient is essentially zero, so shear stress is negligible there."
    },
    audioGenre: "chiptune",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-19",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "multiple-choice",
    prompt: "What are the standard SI units of shear stress?",
    choices: ["Pascals (N/m²)", "Newtons (N)", "Joules (J)", "Watts (W)"],
    correctAnswer: ["Pascals (N/m²)"],
    explanation: "Shear stress is a force per unit area, so it carries the same units as pressure, pascals (newtons per square meter).",
    hint: "It's a force divided by an area, just like pressure.",
    diagramType: null,
    misconceptionFeedback: {
      "Newtons (N)": "Newtons measure force alone, not force per unit area.",
      "Joules (J)": "Joules measure energy, not stress.",
      "Watts (W)": "Watts measure power, not stress."
    },
    audioGenre: "synthwave",
    points: 125
  },
  {
    chapterId: "viscosity",
    setId: "set-19",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "fill-in",
    prompt: "What is the name for the total force obtained by integrating shear stress over an entire wetted surface, contributing to aerodynamic drag?",
    correctAnswer: ["skin friction drag"],
    acceptedAnswers: ["skin friction drag", "skin friction", "friction drag"],
    explanation: "Integrating shear stress over the surface of a body gives the skin friction drag, one of the main components of aerodynamic drag.",
    hint: "It's the drag component caused directly by viscous shear on the surface.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "retro-funk",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-19",
    category: "Viscosity",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "Two flat plates have the same shear stress distribution, but plate A has twice the wetted surface area of plate B. How do their skin friction drag forces compare?",
    choices: ["Plate A has roughly twice the skin friction drag of plate B", "Plate A has half the skin friction drag of plate B", "Both plates have identical skin friction drag", "Skin friction drag depends only on shear stress, not area"],
    correctAnswer: ["Plate A has roughly twice the skin friction drag of plate B"],
    explanation: "Since skin friction drag is the integral of shear stress over the wetted area, doubling the area while keeping the stress distribution the same roughly doubles the total drag force.",
    hint: "Drag force is stress integrated over area.",
    diagramType: null,
    misconceptionFeedback: {
      "Plate A has half the skin friction drag of plate B": "A larger area with the same stress distribution produces more, not less, total force.",
      "Both plates have identical skin friction drag": "Total force depends on area even if the stress distribution per unit area is identical.",
      "Skin friction drag depends only on shear stress, not area": "Drag force requires integrating stress over the surface area, so area matters."
    },
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-20: Dynamic viscosity equation =====
  {
    chapterId: "viscosity",
    setId: "set-20",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "equation-builder",
    prompt: "Build Newton's law of viscosity relating shear stress to the velocity gradient.",
    formula: "τ = μ du/dy",
    sentenceParts: ["", " = ", " ", "/dy"],
    draggableTokens: ["τ", "μ", "du", "dt"],
    correctAnswer: ["τ", "μ", "du"],
    explanation: "Newton's law of viscosity states that shear stress τ equals the dynamic viscosity μ multiplied by the velocity gradient du/dy perpendicular to the flow.",
    hint: "Shear stress equals viscosity times the rate of change of velocity with distance from the wall.",
    diagramType: null,
    misconceptionFeedback: {
      "dt": "The gradient here is with respect to distance y, not time t."
    },
    audioGenre: "ambient-space",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-20",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "drag-drop",
    prompt: "Complete the sentence describing the terms of Newton's law of viscosity, τ = μ du/dy.",
    sentenceParts: [
      "In this equation, μ is the fluid's ",
      " and du/dy is the ",
      " perpendicular to the flow direction."
    ],
    draggableTokens: ["dynamic viscosity", "velocity gradient", "density", "pressure gradient"],
    correctAnswer: ["dynamic viscosity", "velocity gradient"],
    explanation: "μ is the dynamic viscosity, a property of the fluid, and du/dy is the velocity gradient normal to the flow, describing how quickly velocity changes with distance from the wall.",
    hint: "One term is a fluid property, the other describes how velocity varies with position.",
    diagramType: null,
    misconceptionFeedback: {
      "density": "Density is a separate property, not represented by μ in this equation.",
      "pressure gradient": "This equation involves a velocity gradient, not a pressure gradient."
    },
    audioGenre: "breakbeat",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-20",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "multiple-choice",
    prompt: "According to τ = μ du/dy, what happens to shear stress if the velocity gradient du/dy doubles while μ stays constant?",
    choices: ["Shear stress doubles", "Shear stress halves", "Shear stress stays the same", "Shear stress becomes zero"],
    correctAnswer: ["Shear stress doubles"],
    explanation: "Because shear stress is directly proportional to the velocity gradient in a Newtonian fluid, doubling du/dy doubles τ.",
    hint: "τ is directly proportional to du/dy.",
    diagramType: null,
    misconceptionFeedback: {
      "Shear stress halves": "This is inconsistent with direct proportionality; doubling the gradient increases stress.",
      "Shear stress stays the same": "τ depends directly on du/dy, so a change in the gradient changes τ.",
      "Shear stress becomes zero": "There is no reason for shear stress to vanish when the gradient merely doubles."
    },
    audioGenre: "synthwave",
    points: 125
  },
  {
    chapterId: "viscosity",
    setId: "set-20",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "hotspot",
    prompt: "On this velocity profile, click the location where du/dy is largest, giving the highest shear stress by τ = μ du/dy.",
    diagramType: "velocity-profile",
    targets: [
      { id: "wall", label: "Right at the wall", x: 50, y: 78 },
      { id: "mid", label: "Mid-height of the boundary layer", x: 50, y: 60 },
      { id: "edge", label: "Edge of the boundary layer", x: 50, y: 45 }
    ],
    correctAnswer: ["wall"],
    explanation: "The velocity gradient du/dy is steepest at the wall due to the no-slip condition, so this is where shear stress is highest according to τ = μ du/dy.",
    hint: "Where is velocity changing fastest with distance from the surface?",
    misconceptionFeedback: {
      "mid": "The gradient is less steep at mid-height than directly at the wall.",
      "edge": "Near the edge of the boundary layer the velocity approaches the free-stream value, so the gradient is small."
    },
    audioGenre: "chiptune",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-20",
    category: "Viscosity",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "A fluid is called Newtonian if it obeys τ = μ du/dy with μ constant. What characterizes a non-Newtonian fluid such as ketchup?",
    choices: ["Its apparent viscosity changes with the applied shear rate", "It has zero viscosity under all conditions", "It obeys τ = μ du/dy exactly at every shear rate", "It cannot exert any shear stress"],
    correctAnswer: ["Its apparent viscosity changes with the applied shear rate"],
    explanation: "Non-Newtonian fluids like ketchup have an apparent viscosity that varies with shear rate, so the simple linear relation τ = μ du/dy with constant μ does not hold.",
    hint: "Think about why ketchup is hard to pour until you shake it.",
    diagramType: null,
    misconceptionFeedback: {
      "It has zero viscosity under all conditions": "Non-Newtonian fluids still have viscosity; it just varies with shear rate.",
      "It obeys τ = μ du/dy exactly at every shear rate": "This is the definition of a Newtonian fluid, the opposite of what is being described.",
      "It cannot exert any shear stress": "Non-Newtonian fluids still exert shear stress; only the proportionality is nonlinear."
    },
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-21: Typical viscosity values =====
  {
    chapterId: "viscosity",
    setId: "set-21",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "fill-in",
    prompt: "What is the approximate dynamic viscosity of air at 20 degrees Celsius, in pascal-seconds?",
    correctAnswer: ["1.8e-5"],
    acceptedAnswers: ["1.8e-5", "1.8 x 10^-5", "1.8x10^-5", "0.000018", "1.8e-5 pa s"],
    explanation: "The dynamic viscosity of air at about 20 degrees Celsius is approximately 1.8 x 10^-5 pascal-seconds.",
    hint: "It's a very small number, around 1.8 times ten to the minus five.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "retro-funk",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-21",
    category: "Viscosity",
    difficulty: 2,
    interactionType: "multiple-choice",
    prompt: "Approximately how much more viscous is water than air at around 20 degrees Celsius?",
    choices: ["About 55 times more viscous", "About the same viscosity", "About 5 times more viscous", "About 5000 times more viscous"],
    correctAnswer: ["About 55 times more viscous"],
    explanation: "Water's viscosity is about 1.0 x 10^-3 Pa·s, while air's is about 1.8 x 10^-5 Pa·s, making water roughly 55 times more viscous than air.",
    hint: "Divide water's viscosity by air's viscosity: 1.0e-3 / 1.8e-5.",
    diagramType: null,
    misconceptionFeedback: {
      "About the same viscosity": "Their viscosities differ by nearly two orders of magnitude.",
      "About 5 times more viscous": "This underestimates the ratio; the actual factor is closer to 55.",
      "About 5000 times more viscous": "This overestimates the ratio by roughly two orders of magnitude."
    },
    audioGenre: "synthwave",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-21",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "drag-drop",
    prompt: "Complete the sentence with the correct order-of-magnitude viscosity values at 20 degrees Celsius.",
    sentenceParts: [
      "At 20 degrees Celsius, air has a dynamic viscosity of about ",
      " Pa·s, while water has a dynamic viscosity of about ",
      " Pa·s."
    ],
    draggableTokens: ["1.8 x 10^-5", "1.0 x 10^-3", "1.0 x 10^3", "1.8 x 10^5"],
    correctAnswer: ["1.8 x 10^-5", "1.0 x 10^-3"],
    explanation: "Air's dynamic viscosity is about 1.8 x 10^-5 Pa·s and water's is about 1.0 x 10^-3 Pa·s at 20 degrees Celsius, showing water is noticeably more viscous.",
    hint: "Both values are small, but water's is larger than air's.",
    diagramType: null,
    misconceptionFeedback: {
      "1.0 x 10^3": "This value is far too large; it does not correspond to water's actual viscosity.",
      "1.8 x 10^5": "This value is far too large; it does not correspond to air's actual viscosity."
    },
    audioGenre: "breakbeat",
    points: 150
  },
  {
    chapterId: "viscosity",
    setId: "set-21",
    category: "Viscosity",
    difficulty: 3,
    interactionType: "compare-select",
    prompt: "As altitude increases and atmospheric temperature drops, what happens to the dynamic viscosity of air?",
    choices: ["It decreases slightly, since gas viscosity decreases with lower temperature", "It increases sharply due to higher density", "It remains exactly 1.8 x 10^-5 Pa·s at all altitudes", "It becomes negative"],
    correctAnswer: ["It decreases slightly, since gas viscosity decreases with lower temperature"],
    explanation: "Gas viscosity depends on temperature and decreases as temperature drops, so air's dynamic viscosity is slightly lower at the cold, high-altitude conditions than at sea level.",
    hint: "Recall how gas viscosity depends on temperature.",
    diagramType: null,
    misconceptionFeedback: {
      "It increases sharply due to higher density": "Density actually decreases with altitude, and in any case viscosity of a gas is governed primarily by temperature, not density.",
      "It remains exactly 1.8 x 10^-5 Pa·s at all altitudes": "That value is only representative of sea-level conditions at about 20 degrees Celsius; viscosity changes with temperature.",
      "It becomes negative": "Viscosity is always a positive physical quantity."
    },
    audioGenre: "retro-funk",
    points: 175
  },
  {
    chapterId: "viscosity",
    setId: "set-21",
    category: "Viscosity",
    difficulty: 4,
    interactionType: "hotspot",
    prompt: "This cylinder is towed through both air and water at the same speed and diameter. Click the stagnation region where you would expect the local pressure rise to be far larger in water than in air, due to water's much higher density (a related but distinct property from viscosity).",
    diagramType: "cylinder-flow",
    targets: [
      { id: "front", label: "Front stagnation point", x: 34, y: 50 },
      { id: "top", label: "Top shoulder", x: 50, y: 33 },
      { id: "wake", label: "Wake region", x: 80, y: 50 }
    ],
    correctAnswer: ["front"],
    explanation: "The stagnation pressure rise, ½ρu², scales with fluid density; since water is roughly 800 times denser than air, the pressure rise at the front stagnation point is far greater in water even though viscosity differs by a smaller factor.",
    hint: "Stagnation pressure depends on density, which is much higher for water than air.",
    misconceptionFeedback: {
      "top": "The top shoulder is a region of accelerated flow and reduced pressure, not the stagnation pressure rise.",
      "wake": "The wake is a low-pressure separated region, not where the stagnation pressure rise occurs."
    },
    audioGenre: "chiptune",
    points: 175
  }
];
