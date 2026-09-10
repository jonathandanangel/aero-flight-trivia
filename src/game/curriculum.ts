import type { Chapter, LearningSet } from "./types";

interface ChapterSpec {
  id: string;
  title: string;
  blurb: string;
  sets: [string, string][];
}

const specs: ChapterSpec[] = [
  {
    id: "foundations",
    title: "A · Foundations of Aerodynamics",
    blurb: "What aerodynamics is, what air is, and the assumptions we fly on.",
    sets: [
      ["set-01", "Definition and purpose of aerodynamics"],
      ["set-02", "Aerodynamics as a branch of fluid mechanics"],
      ["set-03", "Fluids, liquids, and gases"],
      ["set-04", "Air composition and physical characteristics"],
      ["set-05", "Perfect-gas and continuum assumptions"],
    ],
  },
  {
    id: "streamlines",
    title: "B · Streamlines, Stream Tubes, Conservation",
    blurb: "Velocity fields, stream tubes and conservation of mass.",
    sets: [
      ["set-06", "Velocity vectors and streamlines"],
      ["set-07", "Streamline intersection rules"],
      ["set-08", "Stream tubes"],
      ["set-09", "Conservation of mass"],
      ["set-10", "Continuity equation and mass flow"],
    ],
  },
  {
    id: "momentum",
    title: "C · Momentum, Euler, and Bernoulli",
    blurb: "Newton's second law for fluids and the pressure-velocity trade.",
    sets: [
      ["set-11", "Newton's second law for fluids"],
      ["set-12", "Distance-exerted and contact-exerted forces"],
      ["set-13", "One-dimensional Euler equation"],
      ["set-14", "Bernoulli equation terms"],
      ["set-15", "Dynamic, static, and piezometric pressure"],
      ["set-16", "Stagnation point and stagnation pressure"],
    ],
  },
  {
    id: "viscosity",
    title: "D · Viscosity and Shear",
    blurb: "Why real air sticks, shears and drags.",
    sets: [
      ["set-17", "Meaning of viscosity"],
      ["set-18", "Fluidity comparisons"],
      ["set-19", "Shear stress"],
      ["set-20", "Dynamic viscosity equation"],
      ["set-21", "Typical viscosity values"],
    ],
  },
  {
    id: "boundary-layer",
    title: "E · Boundary Layers and Reynolds Number",
    blurb: "Prandtl's thin layer, and the number that decides its character.",
    sets: [
      ["set-22", "No-slip condition"],
      ["set-23", "Boundary-layer velocity profile"],
      ["set-24", "Inside versus outside the boundary layer"],
      ["set-25", "Boundary-layer drag and heat transfer"],
      ["set-26", "Ludwig Prandtl and the 1904 concept"],
      ["set-27", "Reynolds number formula"],
      ["set-28", "Laminar, transitional, and turbulent flow"],
      ["set-29", "Boundary-layer control and natural laminar flow"],
    ],
  },
  {
    id: "airfoil",
    title: "F · Airfoil Fundamentals and Geometry",
    blurb: "Chord, camber, thickness and angle of attack.",
    sets: [
      ["set-30", "Airfoil as the cross section of a wing"],
      ["set-31", "Two-dimensional and infinite-wing assumptions"],
      ["set-32", "Leading edge, trailing edge, and chord line"],
      ["set-33", "Chord length"],
      ["set-34", "Mean camber line and maximum camber"],
      ["set-35", "Thickness"],
      ["set-36", "Angle of attack"],
      ["set-37", "Symmetric versus cambered airfoils"],
    ],
  },
  {
    id: "forces",
    title: "G · Aerodynamic Forces",
    blurb: "Pressure, shear, and the resultant force they build.",
    sets: [
      ["set-38", "Lift, drag, thrust, and weight"],
      ["set-39", "Lift and drag relative to the free stream"],
      ["set-40", "Pressure and shear-stress distributions"],
      ["set-41", "Pressure direction and shear direction"],
      ["set-42", "Resultant aerodynamic force"],
      ["set-43", "Pressure distributions and lift generation"],
    ],
  },
  {
    id: "drag",
    title: "H · Drag, Cylinder Flow, and Separation",
    blurb: "Adverse gradients, separation, wakes and profile drag.",
    sets: [
      ["set-44", "Flow around a cylinder"],
      ["set-45", "Cylinder stagnation points"],
      ["set-46", "Flow acceleration and pressure reduction"],
      ["set-47", "Adverse pressure gradient and separation"],
      ["set-48", "Wake formation and pressure drag"],
      ["set-49", "Profile, skin-friction drag, and wetted area"],
    ],
  },
  {
    id: "coefficients",
    title: "I · Coefficients, CoP, and Aerodynamic Center",
    blurb: "Non-dimensional forces and where they act.",
    sets: [
      ["set-50", "Dynamic pressure"],
      ["set-51", "Lift coefficient"],
      ["set-52", "Drag coefficient"],
      ["set-53", "Pitching-moment coefficient"],
      ["set-54", "Center of pressure"],
      ["set-55", "Aerodynamic center"],
    ],
  },
  {
    id: "mach",
    title: "J · Speed of Sound, Mach, Shock Waves",
    blurb: "Compressibility, Mach cones and shock waves.",
    sets: [
      ["set-56", "Speed of sound"],
      ["set-57", "Mach number formula"],
      ["set-58", "Mach-regime classification"],
      ["set-59", "Pressure waves, sonic conditions, Mach cones"],
      ["set-60", "Shock-wave changes and hypersonic effects"],
    ],
  },
  {
    id: "high-speed",
    title: "K · High-Speed Aerodynamics",
    blurb: "Transonic shocks, supersonic wave systems, and the hypersonic thermal frontier.",
    sets: [
      ["set-61", "Flight regimes"],
      ["set-62", "Critical Mach and transonic flow"],
      ["set-63", "Shock waves"],
      ["set-64", "Expansion fans and supersonic turning"],
      ["set-65", "Mach cones and sonic booms"],
      ["set-66", "Wave drag and area rule"],
      ["set-67", "Hypersonic heating and thermal barriers"],
    ],
  },
];

export const chapters: Chapter[] = specs.map((s) => ({
  id: s.id,
  title: s.title,
  blurb: s.blurb,
  setIds: s.sets.map(([id]) => id),
}));

export const learningSets: LearningSet[] = specs.flatMap((s) =>
  s.sets.map(([id, title]) => ({ id, chapterId: s.id, title })),
);

export const chapterById = (id: string) => chapters.find((c) => c.id === id);
export const setTitle = (id: string) =>
  learningSets.find((s) => s.id === id)?.title ?? id;
