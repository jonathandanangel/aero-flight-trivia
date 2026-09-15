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
        authors: "A. Murli, M. Rizzardi (implementation); A. Talbot (contour method)",
        detail:
          "Contour quadrature for numerical Laplace transform inversion (talbot_tapar / talbot_tsum demos in ALGORITHMS and MAIN §10). Talbot’s original contour deformation underlies the CALGO packaging.",
        venue: "ACM TOMS / CALGO; Talbot, IMA J. Numer. Anal. / related Laplace-inversion literature",
      },
      {
        title: "Algorithm 695 — Modified Cholesky Factorization",
        authors: "Elizabeth Eskow, Robert B. Schnabel",
        detail:
          "Modified Cholesky of the form PᵀAP + E = LLᵀ with Gerschgorin-guided diagonal additions (Eskow–Schnabel phase 1/2). Driver / modchl / mkmat / solve Fortran lineage from TOMS Vol. 17.",
        venue: "ACM TOMS, Vol. 17, No. 3, Sept. 1991, pp. 306–312",
      },
    ],
  },
  {
    heading: "Named classical methods (V15 method roster)",
    blurb:
      "Authors and eponyms listed in the NumericalAnalysisToolbox_V15 footer — Adams–Bashforth through Taylor — that the MAIN / ALGORITHMS labs exercise.",
    entries: [
      {
        title: "Adams–Bashforth multistep predictors",
        authors: "John Couch Adams, Francis Bashforth",
        detail:
          "Explicit multistep ODE stepping used as the ADAMS predictor inside DERPAR continuation (orders 1–4 in the V15 / TypeScript port).",
      },
      {
        title: "Bolzano Intermediate Value Theorem & bisection",
        authors: "Bernard Bolzano; classical NA pedagogy (Timothy Sauer)",
        detail:
          "Sign-change bracketing on a grid, then refined bisection — MAIN §3 IVT scan.",
      },
      {
        title: "Newton–Raphson iteration (damped)",
        authors: "Isaac Newton, Joseph Raphson",
        detail:
          "Local quadratic root-finding with residual line-search damping and weighted step tests (MAIN §8, shift-to-zero y = x − c).",
      },
      {
        title: "Secant method",
        authors: "Classical (chord / secant lineage; cf. Newton–Raphson texts)",
        detail:
          "Derivative-free two-point updates over proposed seed pairs and user plot seeds.",
      },
      {
        title: "Mean Value Theorem (derivative & integral forms)",
        authors: "Joseph-Louis Lagrange; Augustin-Louis Cauchy",
        detail:
          "Find c with f′(c) = (f(b)−f(a))/(b−a), and c with f(c) = average value — MAIN §§5–6.",
      },
      {
        title: "Taylor polynomials via finite differences",
        authors: "Brook Taylor; finite-difference NA practice",
        detail:
          "Numeric Taylor coefficients about x = 0 using central / recursive FD (MAIN §7).",
      },
      {
        title: "Gaussian elimination with pivoting & substitution",
        authors: "Carl Friedrich Gauss; pivoting refinements (Wilkinson et al.)",
        detail:
          "GAUSE free-coordinate selection and forward/back substitution in the DERPAR corrector linear algebra.",
      },
      {
        title: "Gerschgorin circle / bound estimation",
        authors: "Semyon Aranovich Gershgorin",
        detail:
          "Negative Gerschgorin bounds guide Phase-2 diagonal additions in modified Cholesky (Alg 695).",
      },
      {
        title: "QR / Householder orthogonalization (test matrices)",
        authors: "Alston S. Householder; Francis / Gram–Schmidt QR lineage",
        detail:
          "mkmatESK / generateEskowMatrix builds QDQᵀ spectra via QR of random matrices (Householder-style orthonormal factors in the Fortran mkmat notes).",
      },
      {
        title: "Machine epsilon / unit roundoff",
        authors: "Forsythe / Moler numerical computing tradition; IEEE-754 practice",
        detail:
          "mcheps-style ε used for τ₁, τ₂ = ε^(1/3) tolerances in Eskow–Schnabel; d1mach_local analogs in Talbot overflow tests.",
      },
      {
        title: "Brent-style scalar root polishing",
        authors: "Richard P. Brent",
        detail:
          "Hybrid bisection / inverse-quadratic polishing used where V15 called fzero for MVT and average-value locations.",
      },
    ],
  },
  {
    heading: "Textbooks & classroom NA",
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
        title: "Burden & Faires — Numerical Analysis",
        authors: "Richard L. Burden, J. Douglas Faires",
        detail:
          "Standard undergraduate treatment of Newton, secant, interpolation, and composite quadrature parallel to COMPOSITE / DIFF labs.",
      },
      {
        title: "Atkinson — An Introduction to Numerical Analysis",
        authors: "Kendall E. Atkinson",
        detail:
          "Classical theory for approximation, nonlinear equations, and quadrature referenced by the toolbox’s method roster.",
      },
    ],
  },
  {
    heading: "Applied mechanics & vibrations",
    blurb: "Single-degree-of-freedom free response and forced steady-state FRF tools.",
    entries: [
      {
        title: "SDOF vibration response & magnification factor",
        authors:
          "Singiresu S. Rao; Daniel J. Inman; William T. Thomson; J. P. Den Hartog (classical FRF / magnification)",
        detail:
          "Underdamped free response x(t) with ωₙ, ζ, ω_d; forced M(r) = X/(F₀/k) and phase φ — Vibrations panel / vibrationCore.",
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
        authors:
          "Carl Gustav Jacob Jacobi (Jacobi iteration); Newton–Raphson system extensions (Ortega / Rheinboldt lineage)",
        detail:
          "Diagonal nonlinear Jacobi vs inexact Newton with inner Jacobi linear solves (METHOD lab workflow / Jacobian / split / pseudocode tabs).",
      },
      {
        title: "Composite trapezoidal, midpoint, Simpson 1/3 & 3/8",
        authors: "Isaac Newton & Roger Cotes (Newton–Cotes); Thomas Simpson",
        detail:
          "COMPOSITE lab formulas and node tables against a dense reference integral.",
      },
      {
        title: "Newton divided differences, Lagrange, natural cubic splines",
        authors:
          "Isaac Newton (divided differences); Joseph-Louis Lagrange; I. J. Schoenberg (splines)",
        detail:
          "DIFF lab tables, P(x) / L(x) forms, and natural spline segments Sᵢ(t).",
      },
      {
        title: "Barycentric Lagrange evaluation",
        authors: "Jean-Paul Berrut, Lloyd N. Trefethen (modern barycentric form)",
        detail:
          "Stable barycentric weights for Lagrange evaluation in the DIFF lab (avoids naïve Π basis blow-up).",
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
          "Cross-platform Octave-compatible analyzer with plot inspect, symbolic factorization/shift when available, ACM demos (420–695 roster), and SDOF vibrations. Designed for MATLAB↔Octave portability.",
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
