/**
 * Heat Transfer Extreme Bananza — briefing slides.
 *
 * TO ADD MORE DEBRIEF IMAGES LATER:
 * 1. Drop a new PNG into `src/assets/ht-briefing/`
 * 2. Name it `ht-briefing-XX.png` with the next number (18, 19, …)
 * 3. Optionally add a title/alt override in SLIDE_META below
 *
 * The briefing auto-loads every `ht-briefing-*.png` in sorted order.
 * No other code changes are required for new images.
 */
import nerdBrain from "@/assets/nerd-brain.png";

const briefingModules = import.meta.glob<{ default: string }>(
  "@/assets/ht-briefing/ht-briefing-*.png",
  { eager: true },
);

export interface HtBriefingSlide {
  url: string;
  title: string;
  alt: string;
  filename: string;
}

/** Optional titles/alts keyed by filename (without path). Append as you add images. */
const SLIDE_META: Record<string, { title: string; alt: string }> = {
  "ht-briefing-01.png": {
    title: "Heat Transfer Modes — Conduction, Convection, Radiation",
    alt: "Figure showing conduction through a solid, convection to a moving fluid, and net radiation between surfaces",
  },
  "ht-briefing-02.png": {
    title: "Conduction and Molecular Diffusion of Energy",
    alt: "Temperature gradient and molecular kinetic energy exchange driving conduction heat flux",
  },
  "ht-briefing-03.png": {
    title: "Fourier's Law — One-Dimensional Conduction",
    alt: "Plane wall with linear temperature profile and Fourier law q''_x = -k dT/dx",
  },
  "ht-briefing-04.png": {
    title: "IHT Example 1.1 — Furnace Wall Conduction",
    alt: "Fireclay brick wall conduction example with heat flux and heat rate calculations",
  },
  "ht-briefing-05.png": {
    title: "Convection Boundary Layers",
    alt: "Velocity and thermal boundary layer development over a hot surface",
  },
  "ht-briefing-06.png": {
    title: "Newton's Law of Cooling and Radiation Intro",
    alt: "Convection coefficient ranges and Stefan-Boltzmann radiation introduction",
  },
  "ht-briefing-07.png": {
    title: "Forced, Natural, Boiling, and Condensation",
    alt: "Four convection process diagrams: forced, natural, boiling, and condensation",
  },
  "ht-briefing-08.png": {
    title: "Radiation Exchange and Surface Properties",
    alt: "Irradiation, emission, absorptivity, emissivity, and gray-surface radiation exchange",
  },
  "ht-briefing-09.png": {
    title: "Uninsulated Pipe — Combined Convection and Radiation",
    alt: "Pipe heat-loss example computing emissive power, irradiation, and q-prime",
  },
  "ht-briefing-10.png": {
    title: "Thermal Resistance Concept",
    alt: "Thermal resistance definition q = DeltaT / Rt and conduction resistance L/(kA)",
  },
  "ht-briefing-11.png": {
    title: "Energy Components and the First Law",
    alt: "Total energy hierarchy: internal, thermal, mechanical, and closed-system first law",
  },
  "ht-briefing-12.png": {
    title: "Closed System and Control Volume Energy Balances",
    alt: "Conservation of total energy and thermal-mechanical energy for open and closed systems",
  },
  "ht-briefing-13.png": {
    title: "Steady-Flow Open System Energy Balance",
    alt: "Control volume with inlet/outlet enthalpy, kinetic and potential energy, heat, and work",
  },
  "ht-briefing-14.png": {
    title: "Electrical Rod Transient Energy Balance",
    alt: "Current-carrying rod with ohmic heating, convection, radiation, and energy storage",
  },
  "ht-briefing-15.png": {
    title: "Wind Turbine Nacelle — Energy Balance Setup",
    alt: "Nacelle schematic with convection, radiation, gearbox and generator efficiencies",
  },
  "ht-briefing-16.png": {
    title: "Nacelle Surface Temperature Solution",
    alt: "Combined convection and radiation solution for nacelle surface temperature",
  },
  "ht-briefing-17.png": {
    title: "Example 1.3 — Wind Turbine Nacelle Problem",
    alt: "Full nacelle thermal analysis problem statement and energy-generation schematic",
  },
};

function filenameFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

function defaultMeta(filename: string, index: number): { title: string; alt: string } {
  const n = String(index + 1).padStart(2, "0");
  return {
    title: `Heat Transfer Briefing ${n}`,
    alt: `Heat transfer lecture slide ${n} (${filename})`,
  };
}

/** Sorted briefing slides. Grows automatically when new ht-briefing-*.png files are added. */
export const HT_BRIEFING_SLIDES: HtBriefingSlide[] = Object.entries(briefingModules)
  .map(([path, mod]) => {
    const filename = filenameFromPath(path);
    return { path, filename, url: mod.default };
  })
  .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }))
  .map((entry, index) => {
    const meta = SLIDE_META[entry.filename] ?? defaultMeta(entry.filename, index);
    return {
      url: entry.url,
      filename: entry.filename,
      title: meta.title,
      alt: meta.alt,
    };
  });

export const HT_BRIEFING_OUTRO_IMAGE = nerdBrain;
