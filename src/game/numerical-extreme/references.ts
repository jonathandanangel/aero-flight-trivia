/** Credits and literature behind Numerical Extreme / NumericalAnalysisToolbox_V15. */

export type ReferenceEntry = {
  title: string;
  authors: string;
  detail: string;
  venue?: string;
};

export type ReferenceSection = {
  heading: string;
  blurb: string;
  entries: ReferenceEntry[];
};

export const TOOLBOX_REFERENCES: ReferenceSection[] = [
  {
    heading: "ACM Collected Algorithms (CALGO)",
    blurb:
      "Core numerical kernels in the original Octave/MATLAB toolbox were adapted from Transactions on Mathematical Software collected algorithms.",
    entries: [
      {
        title: "Algorithm 420 — HIDE: Hidden-Line Plotting Program",
        authors: "Hugh Williamson",
        detail:
          "Hidden-line removal and surface rendering for technical plots; cited in the V15 header as part of the visualization lineage.",
        venue: "ACM TOMS / CALGO",
      },
      {
        title: "Algorithm 502 — DERPAR: Continuation Method",
        authors: "Milan Kubíček",
        detail:
          "Parameter continuation with Newton correction, GAUSE free-coordinate selection, and Adams–Bashforth prediction (ADAMS/GAUSE loop in V15).",
        venue: "ACM TOMS / CALGO",
      },
      {
        title: "Algorithm 652 — HOMPACK: Globally Convergent Homotopy Algorithms",
        authors: "Layne T. Watson, Stephen C. Billups, Alexander P. Morgan",
        detail:
          "Homotopy / continuation framework for globally convergent nonlinear solves; referenced as an inspiration for robust path-following design.",
        venue: "ACM TOMS / CALGO",
      },
      {
        title: "Algorithm 677 — C¹ Surface Interpolation (MASUB)",
        authors: "L. Bacchelli Montefusco, Giulio Casciola",
        detail:
          "C¹ surface interpolation package; informs the DIFF / spline and surface-interpolation discussion in the toolbox notes.",
        venue: "ACM TOMS / CALGO",
      },
      {
        title: "Algorithm 681 — INTBIS: Interval Newton / Bisection",
        authors: "R. Baker Kearfott, Manuel Novoa III",
        detail:
          "Interval Newton and bisection for rigorous root enclosure; complements classical IVT/bisection checks in the MAIN analyzer.",
        venue: "ACM TOMS / CALGO",
      },
      {
        title: "Algorithm 682 — Talbot’s Method for Laplace Inversion",
        authors: "A. Murli, M. Rizzardi",
        detail:
          "Contour quadrature for numerical Laplace transform inversion (talbot_tapar / talbot_tsum demos in ALGORITHMS and MAIN §10).",
        venue: "ACM TOMS / CALGO",
      },
      {
        title: "Algorithm 695 — Modified Cholesky Factorization",
        authors: "Elizabeth Eskow, Robert B. Schnabel",
        detail:
          "Modified Cholesky of the form PᵀAP + E = LLᵀ with Gerschgorin-guided diagonal additions (Eskow–Schnabel phase 1/2).",
        venue: "ACM TOMS, Vol. 17, No. 3, Sept. 1991, pp. 306–312",
      },
    ],
  },
  {
    heading: "Textbooks & classical analysis",
    blurb:
      "Pedagogical structure for IVT scans, bisection, Newton, secant, MVT, Taylor, and composite quadrature.",
    entries: [
      {
        title: "Numerical Analysis",
        authors: "Timothy Sauer",
        detail:
          "Intermediate Value Theorem bracketing, bisection checks, and classroom-style root-finding workflow mirrored in MAIN sections 3–8.",
        venue: "Pearson / textbook editions",
      },
      {
        title: "Mean Value Theorem & integral MVT",
        authors: "Classical real analysis (Cauchy / Lagrange forms)",
        detail:
          "Chord-slope derivative matching and average-value location used in MAIN §§5–6.",
      },
      {
        title: "Newton, secant, and damped line search",
        authors: "Classical nonlinear equations literature",
        detail:
          "Damped Newton with residual decrease tests and multi-seed secant pairs (shift-to-zero y = x − c mode from V15).",
      },
    ],
  },
  {
    heading: "Applied mechanics & vibrations",
    blurb: "Single-degree-of-freedom free response and forced steady-state FRF tools.",
    entries: [
      {
        title: "SDOF vibration response & magnification factor",
        authors: "Standard mechanical vibrations curriculum",
        detail:
          "Underdamped free response x(t), natural frequency ωₙ, damping ratio ζ, and forced M(r) = X/(F₀/k) curves in the Vibrations panel.",
      },
    ],
  },
  {
    heading: "Nonlinear systems & quadrature labs (V11 Neon)",
    blurb:
      "Method Builder, COMPOSITE, DIFF, and VECTOR overlays from NumericalAnalysisToolbox_V11_Neon_Vectorized_Calculus.",
    entries: [
      {
        title: "Nonlinear Jacobi & inexact Newton–Jacobi",
        authors: "Classical iterative methods for nonlinear systems",
        detail:
          "Diagonal nonlinear Jacobi vs inexact Newton with inner Jacobi linear solves (METHOD lab workflow / Jacobian / split / pseudocode tabs).",
      },
      {
        title: "Composite trapezoidal, midpoint, Simpson 1/3 & 3/8",
        authors: "Classical numerical integration",
        detail:
          "COMPOSITE lab formulas and node tables against a dense reference integral.",
      },
      {
        title: "Newton divided differences, Lagrange, natural cubic splines",
        authors: "Classical interpolation theory",
        detail:
          "DIFF lab tables, P(x) / L(x) forms, and natural spline segments Sᵢ(t).",
      },
    ],
  },
  {
    heading: "Project lineage",
    blurb: "Ports and presentation layers that carried the toolbox into ZEUS AMMON-RA 11.",
    entries: [
      {
        title: "NumericalAnalysisToolbox_V15",
        authors: "Jonathan Angel (original Octave/MATLAB GUI)",
        detail:
          "Cross-platform Octave-compatible analyzer with plot inspect, symbolic factorization/shift when available, ACM demos, and SDOF vibrations.",
      },
      {
        title: "NumericalAnalysisToolbox_V11_Neon_Vectorized_Calculus",
        authors: "Jonathan Angel (neon overlay)",
        detail:
          "Non-destructive neon theme, VECTOR / METHOD / COMPOSITE / DIFF laboratories, keyboard shortcuts, and display utilities.",
      },
      {
        title: "NUMERICAL EXTREME (ZEUS AMMON-RA 11)",
        authors: "Jonathan Angel · WOZKAF presentation layer",
        detail:
          "Client-side TypeScript port of the math engine inside the ZEUS neon UI with Extreme-style audio and Enoch-Ra compute feedback.",
      },
    ],
  },
];
