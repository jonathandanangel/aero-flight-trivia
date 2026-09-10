import type { QuestionSeed } from "@/game/seed";

export const chapterCQuestions: QuestionSeed[] = [
  // ===== set-11: Newton's second law for fluids =====
  {
    chapterId: "momentum",
    setId: "set-11",
    category: "Momentum",
    difficulty: 2,
    interactionType: "drag-drop",
    prompt: "Complete the statement of Newton's second law as applied to a fluid particle.",
    sentenceParts: [
      "For a fluid particle, the net ",
      " acting on it equals its ",
      " multiplied by its ",
      "."
    ],
    draggableTokens: ["force", "mass", "acceleration", "volume", "temperature"],
    correctAnswer: ["force", "mass", "acceleration"],
    explanation: "Newton's second law, F = ma, applies to fluid particles just as it does to solid bodies: the net force on a particle equals its mass times its acceleration.",
    hint: "Think of the familiar F = ma relation.",
    diagramType: null,
    misconceptionFeedback: {
      "volume": "Volume alone does not determine the response to a force; mass (density times volume) does.",
      "temperature": "Temperature affects fluid properties but is not part of Newton's second law."
    },
    audioGenre: "breakbeat",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-11",
    category: "Momentum",
    difficulty: 3,
    interactionType: "hotspot",
    prompt: "In this stream-tube, click the location where a fluid particle experiences acceleration as it speeds up.",
    diagramType: "stream-tube",
    targets: [
      { id: "inlet", label: "Inlet (wide section)", x: 20, y: 50 },
      { id: "throat", label: "Throat (narrow section)", x: 50, y: 50 },
      { id: "outlet", label: "Outlet (wide section)", x: 80, y: 50 }
    ],
    correctAnswer: ["throat"],
    explanation: "As the tube narrows toward the throat, continuity forces the velocity to increase, so the fluid particle accelerates there under the net pressure force.",
    hint: "Where does the cross-sectional area shrink the most?",
    misconceptionFeedback: {
      "inlet": "At the wide inlet the flow has not yet been squeezed, so acceleration is smaller.",
      "outlet": "At the outlet the tube is widening again, so the flow is decelerating, not accelerating."
    },
    audioGenre: "chiptune",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-11",
    category: "Momentum",
    difficulty: 2,
    interactionType: "multiple-choice",
    prompt: "According to Newton's second law applied to a fluid particle, what directly causes the particle to accelerate?",
    choices: ["The net unbalanced force acting on the particle", "The particle's viscosity alone", "The color of the streamline", "The particle's temperature alone"],
    correctAnswer: ["The net unbalanced force acting on the particle"],
    explanation: "A fluid particle accelerates only when it experiences a net, unbalanced force, exactly as described by F = ma.",
    hint: "Recall F = ma.",
    diagramType: null,
    misconceptionFeedback: {
      "The particle's viscosity alone": "Viscosity affects the size of certain forces but is not itself a cause of acceleration.",
      "The color of the streamline": "Streamline color is just a visualization aid, not a physical cause.",
      "The particle's temperature alone": "Temperature can change fluid properties but does not itself produce acceleration."
    },
    audioGenre: "synthwave",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-11",
    category: "Momentum",
    difficulty: 3,
    interactionType: "matching",
    prompt: "Match each quantity in Newton's second law for a fluid particle to its role.",
    pairs: [
      { left: "Force", right: "Net push exerted on the fluid particle" },
      { left: "Mass", right: "Amount of matter in the particle" },
      { left: "Acceleration", right: "Rate of change of the particle's velocity" },
      { left: "Density", right: "Mass per unit volume of the fluid" }
    ],
    correctAnswer: ["Net push exerted on the fluid particle", "Amount of matter in the particle", "Rate of change of the particle's velocity", "Mass per unit volume of the fluid"],
    explanation: "Each term in F = ma has a distinct physical role; density links mass to the volume of the fluid particle being considered.",
    hint: "Think about what each symbol represents physically.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "ambient-space",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-11",
    category: "Momentum",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "A fluid particle moves along a streamline at constant speed but the streamline is curving. Is the particle accelerating?",
    choices: ["Yes, because its direction is changing", "No, because its speed is constant", "Only if the fluid is compressible", "Only if the flow is unsteady"],
    correctAnswer: ["Yes, because its direction is changing"],
    explanation: "Acceleration includes any change in velocity, and velocity is a vector; a change in direction alone (centripetal acceleration) counts as acceleration even at constant speed.",
    hint: "Velocity is a vector with both magnitude and direction.",
    diagramType: null,
    misconceptionFeedback: {
      "No, because its speed is constant": "Speed being constant does not mean velocity is constant; direction still matters.",
      "Only if the fluid is compressible": "Compressibility is unrelated to whether curved motion counts as acceleration.",
      "Only if the flow is unsteady": "Even in steady flow, a curved streamline produces acceleration for the particle moving along it."
    },
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-12: Distance-exerted and contact-exerted forces =====
  {
    chapterId: "momentum",
    setId: "set-12",
    category: "Momentum",
    difficulty: 2,
    interactionType: "drag-drop",
    prompt: "Complete the sentence describing the two broad classes of forces acting on a fluid.",
    sentenceParts: [
      "Forces on a fluid element are classified as ",
      " forces, such as gravity, which act without contact, and ",
      " forces, such as pressure and shear, which act on the element's surface."
    ],
    draggableTokens: ["distance-exerted (body)", "contact-exerted (surface)", "thermal", "chemical"],
    correctAnswer: ["distance-exerted (body)", "contact-exerted (surface)"],
    explanation: "Body (distance-exerted) forces act throughout the volume without physical contact, such as gravity, while surface (contact-exerted) forces such as pressure and shear act only on the boundary of the fluid element.",
    hint: "One type needs touching, the other acts at a distance.",
    diagramType: null,
    misconceptionFeedback: {
      "thermal": "Thermal effects are not one of the two classical force categories used here.",
      "chemical": "Chemical effects are not part of this basic force classification."
    },
    audioGenre: "breakbeat",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-12",
    category: "Momentum",
    difficulty: 2,
    interactionType: "multiple-choice",
    prompt: "Which of the following is an example of a distance-exerted (body) force on a fluid?",
    choices: ["Gravity acting on every fluid particle", "Pressure pushing on a surface", "Viscous shear stress on a wall", "Friction between fluid layers"],
    correctAnswer: ["Gravity acting on every fluid particle"],
    explanation: "Gravity acts on every particle of fluid without requiring direct contact, making it the classic example of a body (distance-exerted) force.",
    hint: "Which force does not need surface contact to act?",
    diagramType: null,
    misconceptionFeedback: {
      "Pressure pushing on a surface": "Pressure acts through direct contact on a surface, making it a contact force.",
      "Viscous shear stress on a wall": "Shear stress requires contact between fluid layers or with a wall.",
      "Friction between fluid layers": "Friction between layers is a contact (surface) effect."
    },
    audioGenre: "synthwave",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-12",
    category: "Momentum",
    difficulty: 3,
    interactionType: "hotspot",
    prompt: "On this airfoil, click the location where a contact-exerted (surface) shear force acts on the fluid.",
    diagramType: "airfoil-shear",
    targets: [
      { id: "upper", label: "Upper surface boundary layer", x: 45, y: 40 },
      { id: "farfield", label: "Far-field undisturbed air", x: 50, y: 22 },
      { id: "lower", label: "Lower surface boundary layer", x: 45, y: 62 }
    ],
    correctAnswer: ["upper"],
    explanation: "Shear stress is a contact force that arises where fluid touches the airfoil's surface, such as in the boundary layer along the upper surface.",
    hint: "Surface forces need direct contact between fluid and body.",
    misconceptionFeedback: {
      "farfield": "Far from the surface, there is no direct contact between fluid layers and the wall, so shear is negligible there.",
      "lower": "This is also a valid shear location, but the highlighted correct answer for this question is the upper surface boundary layer."
    },
    audioGenre: "chiptune",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-12",
    category: "Momentum",
    difficulty: 3,
    interactionType: "matching",
    prompt: "Match each force to its correct classification as body (distance-exerted) or surface (contact-exerted).",
    pairs: [
      { left: "Gravity", right: "Distance-exerted (body) force" },
      { left: "Pressure on a wall", right: "Contact-exerted (surface) force" },
      { left: "Viscous shear stress", right: "Contact-exerted (surface) force" },
      { left: "Electromagnetic force on charged fluid", right: "Distance-exerted (body) force" }
    ],
    correctAnswer: ["Distance-exerted (body) force", "Contact-exerted (surface) force", "Contact-exerted (surface) force", "Distance-exerted (body) force"],
    explanation: "Gravity and electromagnetic forces act throughout the fluid volume without contact, while pressure and shear act only where surfaces touch.",
    hint: "Ask whether the force needs a touching surface to act.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "ambient-space",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-12",
    category: "Momentum",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "In a control volume analysis of airflow over a wing, which force type dominates the net pressure force pushing fluid through the volume?",
    choices: ["Contact-exerted (surface) forces", "Distance-exerted (body) forces", "Neither type contributes", "Only thermal forces contribute"],
    correctAnswer: ["Contact-exerted (surface) forces"],
    explanation: "Pressure differences acting on the boundaries of the control volume are surface (contact-exerted) forces, and they typically dominate momentum changes in aerodynamic flows compared with gravity.",
    hint: "Pressure acts on the boundary surfaces of the control volume.",
    diagramType: null,
    misconceptionFeedback: {
      "Distance-exerted (body) forces": "Gravity is usually a minor contributor to momentum changes in aerodynamic flows compared with pressure.",
      "Neither type contributes": "Both contribute in general, but pressure (a surface force) dominates in this context.",
      "Only thermal forces contribute": "Thermal forces are not part of this force balance."
    },
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-13: One-dimensional Euler equation =====
  {
    chapterId: "momentum",
    setId: "set-13",
    category: "Momentum",
    difficulty: 3,
    interactionType: "equation-builder",
    prompt: "Build the one-dimensional Euler equation relating pressure change to velocity change along a streamline.",
    formula: "dp = -ρ u du",
    sentenceParts: ["", " = -", " ", " "],
    draggableTokens: ["dp", "ρ", "u", "du", "dt"],
    correctAnswer: ["dp", "ρ", "u", "du"],
    explanation: "The one-dimensional Euler equation, dp = -ρ u du, shows that for an inviscid flow along a streamline, an increase in speed is accompanied by a decrease in pressure.",
    hint: "Density times velocity times the change in velocity, with a negative sign.",
    diagramType: null,
    misconceptionFeedback: {
      "dt": "The Euler equation here is written per unit distance along the streamline, not per unit time."
    },
    audioGenre: "ambient-space",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-13",
    category: "Momentum",
    difficulty: 3,
    interactionType: "drag-drop",
    prompt: "Complete the description of the assumptions behind the one-dimensional Euler equation.",
    sentenceParts: [
      "The Euler equation is derived for ",
      " flow, meaning viscosity is neglected, applied along a ",
      "."
    ],
    draggableTokens: ["inviscid", "streamline", "viscous", "vortex line"],
    correctAnswer: ["inviscid", "streamline"],
    explanation: "The Euler equation assumes an inviscid (frictionless) fluid and relates pressure and velocity changes along a streamline.",
    hint: "Euler's equation ignores friction.",
    diagramType: null,
    misconceptionFeedback: {
      "viscous": "Euler's equation specifically excludes viscous effects.",
      "vortex line": "The equation applies along a streamline, not a vortex line."
    },
    audioGenre: "breakbeat",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-13",
    category: "Momentum",
    difficulty: 2,
    interactionType: "multiple-choice",
    prompt: "The one-dimensional Euler equation dp = -ρ u du describes the balance of forces along a streamline under which condition?",
    choices: ["Steady, inviscid flow with no body forces", "Unsteady, viscous flow with heat addition", "Flow with negligible density", "Flow where pressure is constant everywhere"],
    correctAnswer: ["Steady, inviscid flow with no body forces"],
    explanation: "This form of the Euler equation applies to steady, inviscid flow along a streamline where gravity and other body forces are neglected.",
    hint: "Which assumptions strip the equation down to just pressure and velocity terms?",
    diagramType: null,
    misconceptionFeedback: {
      "Unsteady, viscous flow with heat addition": "Viscosity and unsteadiness are excluded from this simple form.",
      "Flow with negligible density": "Density is explicitly present in the equation, so it cannot be negligible.",
      "Flow where pressure is constant everywhere": "The equation exists precisely because pressure changes along the streamline."
    },
    audioGenre: "synthwave",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-13",
    category: "Momentum",
    difficulty: 3,
    interactionType: "hotspot",
    prompt: "In this stream-tube, click the region where the Euler equation predicts the lowest pressure due to the highest velocity.",
    diagramType: "stream-tube",
    targets: [
      { id: "inlet", label: "Inlet (wide section)", x: 20, y: 50 },
      { id: "throat", label: "Throat (narrow section)", x: 50, y: 50 },
      { id: "outlet", label: "Outlet (wide section)", x: 80, y: 50 }
    ],
    correctAnswer: ["throat"],
    explanation: "Since dp = -ρ u du, wherever velocity is greatest (the throat), pressure must be lowest along the streamline.",
    hint: "Where is the flow moving fastest?",
    misconceptionFeedback: {
      "inlet": "The inlet has lower velocity and thus higher pressure than the throat.",
      "outlet": "The outlet has recovered some pressure as the tube widens again."
    },
    audioGenre: "chiptune",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-13",
    category: "Momentum",
    difficulty: 4,
    interactionType: "fill-in",
    prompt: "Integrating the one-dimensional Euler equation dp = -ρu du for constant density yields which famous equation?",
    correctAnswer: ["bernoulli equation"],
    acceptedAnswers: ["bernoulli equation", "bernoulli's equation", "bernoulli"],
    explanation: "Integrating the Euler equation along a streamline for incompressible flow produces Bernoulli's equation, p + ½ρu² = constant.",
    hint: "It's named after a Swiss mathematician and links pressure and speed.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-14: Bernoulli equation terms =====
  {
    chapterId: "momentum",
    setId: "set-14",
    category: "Momentum",
    difficulty: 3,
    interactionType: "equation-builder",
    prompt: "Build Bernoulli's equation for steady, incompressible, inviscid flow along a streamline.",
    formula: "p + ½ρu² + ρgz = C",
    sentenceParts: ["", " + ½", "", " + ", "", " = "],
    draggableTokens: ["p", "ρu²", "ρgz", "C", "μu²"],
    correctAnswer: ["p", "ρu²", "ρgz", "C"],
    explanation: "Bernoulli's equation states that static pressure plus dynamic pressure plus the hydrostatic term stays constant along a streamline for steady, inviscid, incompressible flow.",
    hint: "Static pressure, dynamic pressure, and a gravitational term sum to a constant.",
    diagramType: null,
    misconceptionFeedback: {
      "μu²": "Viscosity does not appear in the inviscid Bernoulli equation."
    },
    audioGenre: "ambient-space",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-14",
    category: "Momentum",
    difficulty: 3,
    interactionType: "matching",
    prompt: "Match each term in Bernoulli's equation, p + ½ρu² + ρgz = C, to its physical meaning.",
    pairs: [
      { left: "p", right: "Static pressure of the fluid" },
      { left: "½ρu²", right: "Dynamic pressure due to fluid motion" },
      { left: "ρgz", right: "Hydrostatic (potential) pressure due to elevation" },
      { left: "C", right: "Constant total pressure along the streamline" }
    ],
    correctAnswer: ["Static pressure of the fluid", "Dynamic pressure due to fluid motion", "Hydrostatic (potential) pressure due to elevation", "Constant total pressure along the streamline"],
    explanation: "Each term in Bernoulli's equation represents a distinct form of mechanical energy per unit volume that trades off along a streamline.",
    hint: "Think of pressure, motion, and height as three energy contributions.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "ambient-space",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-14",
    category: "Momentum",
    difficulty: 2,
    interactionType: "multiple-choice",
    prompt: "In Bernoulli's equation, what happens to static pressure when flow speed increases along a horizontal streamline?",
    choices: ["Static pressure decreases", "Static pressure increases", "Static pressure stays the same", "Static pressure becomes negative always"],
    correctAnswer: ["Static pressure decreases"],
    explanation: "For horizontal flow, ρgz is constant, so an increase in ½ρu² must be balanced by a decrease in static pressure p to keep the sum constant.",
    hint: "If dynamic pressure rises, something else must fall to keep the total constant.",
    diagramType: null,
    misconceptionFeedback: {
      "Static pressure increases": "This would violate Bernoulli's equation unless elevation also changed.",
      "Static pressure stays the same": "If pressure stayed constant while speed increased, the equation's sum would not remain constant.",
      "Static pressure becomes negative always": "Static pressure can drop but does not always become negative."
    },
    audioGenre: "synthwave",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-14",
    category: "Momentum",
    difficulty: 2,
    interactionType: "drag-drop",
    prompt: "Complete the sentence stating the key assumption behind Bernoulli's equation.",
    sentenceParts: [
      "Bernoulli's equation applies along a streamline for flow that is ",
      ", incompressible, and ",
      "."
    ],
    draggableTokens: ["steady", "inviscid", "unsteady", "viscous"],
    correctAnswer: ["steady", "inviscid"],
    explanation: "Bernoulli's equation, as commonly used, requires steady, incompressible, inviscid flow along a streamline.",
    hint: "Two of the four options describe the correct assumptions.",
    diagramType: null,
    misconceptionFeedback: {
      "unsteady": "Bernoulli's simple form requires steady flow.",
      "viscous": "Viscous effects violate the inviscid assumption needed here."
    },
    audioGenre: "breakbeat",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-14",
    category: "Momentum",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "Air accelerates over the top of a wing while remaining at essentially the same altitude. Which term of Bernoulli's equation changes most significantly?",
    choices: ["The dynamic pressure term ½ρu²", "The hydrostatic term ρgz", "The constant C", "None of the terms change"],
    correctAnswer: ["The dynamic pressure term ½ρu²"],
    explanation: "Since altitude barely changes over the airfoil, ρgz stays nearly constant, so the trade-off is between static pressure and the dynamic pressure term ½ρu².",
    hint: "Which term directly depends on speed?",
    diagramType: null,
    misconceptionFeedback: {
      "The hydrostatic term ρgz": "Elevation change over an airfoil chord is negligible, so this term barely changes.",
      "The constant C": "C is constant by definition along a given streamline; it does not change.",
      "None of the terms change": "Speed changes significantly over the airfoil, so the dynamic pressure term must change."
    },
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-15: Dynamic, static, and piezometric pressure =====
  {
    chapterId: "momentum",
    setId: "set-15",
    category: "Momentum",
    difficulty: 3,
    interactionType: "drag-drop",
    prompt: "Complete the sentence defining the three pressure terms used in Bernoulli's equation.",
    sentenceParts: [
      "The pressure p is called ",
      " pressure, ½ρu² is called ",
      " pressure, and p + ρgz is called ",
      " pressure."
    ],
    draggableTokens: ["static", "dynamic", "piezometric", "kinetic", "total"],
    correctAnswer: ["static", "dynamic", "piezometric"],
    explanation: "Static pressure is the thermodynamic pressure, dynamic pressure represents kinetic energy per unit volume, and piezometric pressure combines static pressure with the hydrostatic term.",
    hint: "Piezometric pressure includes an elevation contribution.",
    diagramType: null,
    misconceptionFeedback: {
      "kinetic": "Kinetic is a related idea, but the formal term used here is 'dynamic'.",
      "total": "Total pressure (stagnation pressure) equals static plus dynamic pressure, not p + ρgz."
    },
    audioGenre: "breakbeat",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-15",
    category: "Momentum",
    difficulty: 3,
    interactionType: "multiple-choice",
    prompt: "Which expression correctly defines piezometric pressure?",
    choices: ["p + ρgz", "½ρu²", "p + ½ρu²", "ρgz alone"],
    correctAnswer: ["p + ρgz"],
    explanation: "Piezometric pressure combines the static pressure p with the hydrostatic term ρgz, representing the pressure that would be measured by a static tube accounting for elevation.",
    hint: "It combines static pressure with an elevation term, not a velocity term.",
    diagramType: null,
    misconceptionFeedback: {
      "½ρu²": "This is the dynamic pressure, not piezometric pressure.",
      "p + ½ρu²": "This combination is the stagnation (total) pressure for horizontal flow, not piezometric pressure.",
      "ρgz alone": "This is only the hydrostatic term, missing the static pressure contribution."
    },
    audioGenre: "synthwave",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-15",
    category: "Momentum",
    difficulty: 2,
    interactionType: "fill-in",
    prompt: "What is the name of the pressure term ½ρu² that represents the kinetic energy of the flow per unit volume?",
    correctAnswer: ["dynamic pressure"],
    acceptedAnswers: ["dynamic pressure", "dynamic"],
    explanation: "The term ½ρu² is called dynamic pressure and represents the kinetic energy per unit volume of the moving fluid.",
    hint: "It depends on density and the square of velocity.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "retro-funk",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-15",
    category: "Momentum",
    difficulty: 3,
    interactionType: "hotspot",
    prompt: "On this airfoil pressure diagram, click the location where static pressure is lowest and dynamic pressure is therefore highest.",
    diagramType: "airfoil-pressure",
    targets: [
      { id: "upper", label: "Upper surface (near max camber)", x: 42, y: 44 },
      { id: "le", label: "Leading edge stagnation region", x: 18, y: 52 },
      { id: "lower", label: "Lower surface", x: 45, y: 62 }
    ],
    correctAnswer: ["upper"],
    explanation: "Flow accelerates most over the upper surface near maximum camber, so by Bernoulli's equation, static pressure is lowest and dynamic pressure highest there.",
    hint: "Where does the flow speed up the most?",
    misconceptionFeedback: {
      "le": "At the leading edge stagnation region the flow slows to zero, so dynamic pressure is lowest there, not highest.",
      "lower": "The lower surface generally has less flow acceleration than the upper surface for a cambered airfoil."
    },
    audioGenre: "chiptune",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-15",
    category: "Momentum",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "A pitot-static probe measures static pressure and stagnation pressure at the same altitude. Which pressure difference gives the dynamic pressure directly, with no need for the ρgz term?",
    choices: ["Stagnation pressure minus static pressure", "Static pressure minus piezometric pressure", "Piezometric pressure minus stagnation pressure", "Static pressure divided by density"],
    correctAnswer: ["Stagnation pressure minus static pressure"],
    explanation: "Because both readings are taken at the same elevation, the ρgz terms cancel, so subtracting static pressure from stagnation pressure isolates the dynamic pressure ½ρu².",
    hint: "Elevation is the same for both readings, so that term cancels.",
    diagramType: null,
    misconceptionFeedback: {
      "Static pressure minus piezometric pressure": "This combination isolates only the negative of the elevation term, not dynamic pressure.",
      "Piezometric pressure minus stagnation pressure": "This mixes an elevation-dependent term with dynamic pressure incorrectly.",
      "Static pressure divided by density": "Dividing by density does not extract the dynamic pressure term."
    },
    audioGenre: "retro-funk",
    points: 175
  },

  // ===== set-16: Stagnation point and stagnation pressure =====
  {
    chapterId: "momentum",
    setId: "set-16",
    category: "Momentum",
    difficulty: 2,
    interactionType: "hotspot",
    prompt: "On this cylinder in cross-flow, click the front stagnation point where the local velocity is zero.",
    diagramType: "cylinder-flow",
    targets: [
      { id: "front", label: "Front stagnation point", x: 34, y: 50 },
      { id: "top", label: "Top shoulder", x: 50, y: 33 },
      { id: "wake", label: "Wake region", x: 80, y: 50 }
    ],
    correctAnswer: ["front"],
    explanation: "The front stagnation point is where the oncoming flow splits and momentarily comes to rest, giving zero velocity and maximum pressure there.",
    hint: "Where does the oncoming flow first meet the cylinder and stop?",
    misconceptionFeedback: {
      "top": "At the top shoulder the flow has accelerated around the cylinder, so velocity is not zero there.",
      "wake": "The wake is a low-pressure separated region downstream, not a point of zero velocity at the surface."
    },
    audioGenre: "chiptune",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-16",
    category: "Momentum",
    difficulty: 3,
    interactionType: "multiple-choice",
    prompt: "What is the correct definition of stagnation pressure, p0, for incompressible flow?",
    choices: ["p0 = p + ½ρu²", "p0 = p - ½ρu²", "p0 = ½ρu² only", "p0 = ρgz only"],
    correctAnswer: ["p0 = p + ½ρu²"],
    explanation: "Stagnation pressure is the pressure a fluid would reach if it were brought to rest isentropically, equal to static pressure plus dynamic pressure.",
    hint: "It's the sum of static and dynamic pressure.",
    diagramType: null,
    misconceptionFeedback: {
      "p0 = p - ½ρu²": "This subtracts dynamic pressure rather than adding it, which is incorrect.",
      "p0 = ½ρu² only": "This ignores the static pressure contribution.",
      "p0 = ρgz only": "This is only the hydrostatic term and ignores both static and dynamic pressure."
    },
    audioGenre: "synthwave",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-16",
    category: "Momentum",
    difficulty: 2,
    interactionType: "drag-drop",
    prompt: "Complete the sentence describing a stagnation point.",
    sentenceParts: [
      "A stagnation point is a location in the flow where the local ",
      " is zero and the pressure reaches its ",
      " value."
    ],
    draggableTokens: ["velocity", "maximum", "density", "minimum"],
    correctAnswer: ["velocity", "maximum"],
    explanation: "At a stagnation point, the flow velocity drops to zero and, by Bernoulli's equation, the local pressure rises to its maximum value, the stagnation pressure.",
    hint: "Think about what happens to speed and pressure when flow is brought to rest.",
    diagramType: null,
    misconceptionFeedback: {
      "density": "Density is not the quantity that vanishes at a stagnation point.",
      "minimum": "Pressure reaches a maximum, not a minimum, at a stagnation point."
    },
    audioGenre: "breakbeat",
    points: 125
  },
  {
    chapterId: "momentum",
    setId: "set-16",
    category: "Momentum",
    difficulty: 3,
    interactionType: "fill-in",
    prompt: "What is the name of the instrument that uses stagnation pressure and static pressure to measure airspeed?",
    correctAnswer: ["pitot-static tube"],
    acceptedAnswers: ["pitot-static tube", "pitot tube", "pitot static tube", "pitot-static probe"],
    explanation: "A pitot-static tube measures the difference between stagnation pressure and static pressure, which is used to determine airspeed.",
    hint: "It's named after the French engineer who invented it.",
    diagramType: null,
    misconceptionFeedback: {},
    audioGenre: "retro-funk",
    points: 150
  },
  {
    chapterId: "momentum",
    setId: "set-16",
    category: "Momentum",
    difficulty: 4,
    interactionType: "compare-select",
    prompt: "At high subsonic Mach numbers, why must the simple incompressible stagnation pressure formula p0 = p + ½ρu² be corrected?",
    choices: ["Because air density changes appreciably as the flow is decelerated to rest", "Because gravity becomes stronger at high speed", "Because viscosity vanishes at high speed", "Because the formula was never valid for any flow"],
    correctAnswer: ["Because air density changes appreciably as the flow is decelerated to rest"],
    explanation: "At high subsonic and supersonic speeds, compressibility effects mean density changes significantly during deceleration, so a compressible form of the stagnation pressure relation is required.",
    hint: "Think about what assumption of incompressible Bernoulli breaks down at high speed.",
    diagramType: null,
    misconceptionFeedback: {
      "Because gravity becomes stronger at high speed": "Gravity does not depend on flow speed.",
      "Because viscosity vanishes at high speed": "Viscosity does not vanish at high speed; this is unrelated to the correction needed.",
      "Because the formula was never valid for any flow": "The incompressible formula is valid at low Mach numbers; it simply breaks down at high speed."
    },
    audioGenre: "retro-funk",
    points: 175
  }
];
