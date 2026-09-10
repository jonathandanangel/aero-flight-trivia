import type { QuestionSeed } from "@/game/seed";

const mc = (
  setId: string,
  category: string,
  difficulty: 1 | 2 | 3 | 4 | 5,
  prompt: string,
  choices: [string, string, string, string],
  answer: string,
  explanation: string,
  hint: string,
  points = 125,
  diagramType: QuestionSeed["diagramType"] = null,
): QuestionSeed => ({
  chapterId: "high-speed",
  setId,
  category,
  difficulty,
  interactionType: "multiple-choice",
  prompt,
  choices,
  correctAnswer: [answer],
  explanation,
  diagramType,
  hint,
  misconceptionFeedback: {},
  audioGenre: difficulty >= 4 ? "breakbeat" : "synthwave",
  points,
});

const fill = (
  setId: string,
  category: string,
  difficulty: 1 | 2 | 3 | 4 | 5,
  prompt: string,
  answer: string,
  acceptedAnswers: string[],
  explanation: string,
  hint: string,
  points = 125,
): QuestionSeed => ({
  chapterId: "high-speed",
  setId,
  category,
  difficulty,
  interactionType: "fill-in",
  prompt,
  correctAnswer: [answer],
  acceptedAnswers,
  explanation,
  diagramType: null,
  hint,
  misconceptionFeedback: {},
  audioGenre: difficulty >= 4 ? "breakbeat" : "ambient-space",
  points,
});

export const highSpeedQuestions: QuestionSeed[] = [
  // K1 · Flight regimes
  mc("set-61", "Mach Regimes", 1, "Which Mach-number range is conventionally called subsonic flight?", ["Below about Mach 0.8", "Mach 0.8 to 1.2", "Mach 1.2 to 5", "Above Mach 5"], "Below about Mach 0.8", "Subsonic flow is conventionally below about Mach 0.8, where strong local transonic effects are normally absent.", "Choose the range entirely below the transonic band."),
  mc("set-61", "Mach Regimes", 1, "Which range best describes the transonic regime?", ["Mach 0.8 to 1.2", "Mach 0.2 to 0.4", "Mach 1.5 to 3", "Mach 5 to 10"], "Mach 0.8 to 1.2", "Transonic flight is roughly Mach 0.8–1.2 and commonly contains both locally subsonic and supersonic flow.", "It straddles Mach 1."),
  mc("set-61", "Mach Regimes", 1, "Which range is normally classified as supersonic rather than hypersonic?", ["Mach 1.2 to 5", "Below Mach 0.3", "Mach 0.8 to 1.2", "Above Mach 10 only"], "Mach 1.2 to 5", "A common convention places supersonic flight from about Mach 1.2 to Mach 5.", "This band lies above transonic and below hypersonic."),
  mc("set-61", "Mach Regimes", 2, "At approximately what Mach number does the hypersonic regime begin?", ["Mach 5", "Mach 0.5", "Mach 1", "Mach 2"], "Mach 5", "Hypersonic flight is conventionally defined as Mach 5 and above, where high-temperature effects become increasingly important.", "The threshold is five times the local speed of sound."),
  fill("set-61", "Mach Regimes", 2, "An aircraft travels at 680 m/s where the local speed of sound is 340 m/s. What is its Mach number?", "2", ["2", "mach 2", "2.0"], "Mach number is speed divided by local sound speed: 680/340 = 2.", "Divide aircraft speed by local sound speed."),

  // K2 · Critical Mach and transonic flow
  mc("set-62", "Critical Mach", 2, "What does an aircraft's critical Mach number, Mcrit, identify?", ["The free-stream Mach number at which airflow first becomes locally sonic", "The speed at which the entire aircraft becomes supersonic", "The minimum speed for generating lift", "The Mach number at which the engine must shut down"], "The free-stream Mach number at which airflow first becomes locally sonic", "Mcrit is reached when the first point in the flow over the aircraft attains Mach 1, even though the free stream is still subsonic.", "Think local flow, not the entire aircraft."),
  mc("set-62", "Critical Mach", 3, "Why can locally supersonic flow appear over a wing while the aircraft is still flying below Mach 1?", ["The curved wing surface accelerates the local airflow", "The wing lowers the local speed of sound to zero", "The aircraft's instruments always under-read speed", "The wake pushes air forward over the wing"], "The curved wing surface accelerates the local airflow", "Flow accelerates over portions of an airfoil, so local Mach number can reach or exceed one before free-stream Mach does.", "Consider the velocity increase over the wing surface."),
  mc("set-62", "Critical Mach", 3, "What typically forms where a locally supersonic pocket over a transonic wing returns to subsonic speed?", ["A shock wave", "A Prandtl–Meyer expansion fan", "A steady vortex sheet only", "A vacuum boundary"], "A shock wave", "The supersonic pocket usually terminates through a shock that compresses and decelerates the flow to subsonic speed.", "The transition is compressive and abrupt.", 150, "mach-cone"),
  mc("set-62", "Critical Mach", 4, "What is drag-divergence Mach number?", ["The Mach number where drag begins rising rapidly", "The Mach number where induced drag becomes zero", "The maximum Mach number of sound", "The speed where skin friction disappears"], "The Mach number where drag begins rising rapidly", "Near drag-divergence Mach number, shock formation and compressibility cause a steep increase in drag.", "Its name describes a rapid departure in the drag curve."),
  mc("set-62", "Critical Mach", 3, "Which design change generally raises an airliner's critical Mach number?", ["Sweeping the wing", "Increasing frontal area", "Adding a blunt vertical plate", "Increasing airfoil thickness dramatically"], "Sweeping the wing", "Wing sweep reduces the velocity component normal to the leading edge, delaying compressibility effects.", "Reduce the airflow component normal to the leading edge."),

  // K3 · Shock waves
  mc("set-63", "Shock Waves", 2, "Across a normal shock wave, what happens to static pressure and Mach number?", ["Pressure rises and Mach number falls", "Pressure falls and Mach number rises", "Both pressure and Mach number remain constant", "Pressure and Mach number both fall to zero"], "Pressure rises and Mach number falls", "A normal shock compresses the gas: static pressure rises while a supersonic upstream Mach number becomes subsonic.", "A shock compresses and decelerates the flow.", 150, "mach-cone"),
  mc("set-63", "Shock Waves", 3, "What happens to total pressure across a real shock wave?", ["It decreases", "It increases", "It remains exactly constant", "It becomes equal to static pressure"], "It decreases", "A shock is irreversible, so stagnation or total pressure decreases even though total enthalpy is conserved for adiabatic flow.", "Entropy rises across a shock."),
  mc("set-63", "Shock Waves", 3, "How does an oblique shock differ from a normal shock?", ["The flow crosses it at an angle and is turned", "It can occur only below Mach 1", "It always expands the gas", "It produces no pressure change"], "The flow crosses it at an angle and is turned", "An oblique shock is inclined to the upstream flow and both compresses and turns it, often leaving the downstream flow supersonic.", "Its surface is not perpendicular to the upstream streamlines."),
  mc("set-63", "Shock Waves", 4, "When can an attached oblique shock become a detached bow shock ahead of a body?", ["When the body is too blunt or the required flow deflection is too large", "Whenever angle of attack is exactly zero", "Only when the free stream is subsonic", "When viscosity becomes exactly zero"], "When the body is too blunt or the required flow deflection is too large", "A blunt nose or excessive turning demand cannot support an attached oblique shock, so a detached bow shock forms upstream.", "Think of a blunt reentry capsule."),
  mc("set-63", "Shock Waves", 4, "Which quantity remains constant across an adiabatic shock with no external work?", ["Stagnation temperature", "Stagnation pressure", "Entropy", "Static density"], "Stagnation temperature", "For a calorically perfect gas with no heat or work transfer, total temperature remains constant while total pressure falls.", "Energy is conserved, but the process is irreversible."),

  // K4 · Expansion and supersonic turning
  mc("set-64", "Expansion Fans", 2, "What occurs when supersonic flow turns around a convex corner away from itself?", ["A Prandtl–Meyer expansion fan", "A normal shock", "An incompressible stagnation zone", "A detached bow shock"], "A Prandtl–Meyer expansion fan", "A convex turn produces a continuous fan of expansion waves that accelerates and turns supersonic flow.", "The corner opens away from the flow."),
  mc("set-64", "Expansion Fans", 3, "How do pressure and Mach number change through a Prandtl–Meyer expansion fan?", ["Pressure decreases and Mach number increases", "Pressure increases and Mach number decreases", "Both remain constant", "Pressure and Mach number both increase"], "Pressure decreases and Mach number increases", "An isentropic expansion lowers pressure and temperature while accelerating the supersonic flow to a higher Mach number.", "Expansion trades pressure for speed."),
  mc("set-64", "Expansion Fans", 3, "Compared with a shock wave, an ideal Prandtl–Meyer expansion is best described as what?", ["Continuous and isentropic", "Discontinuous and strongly irreversible", "Possible only in liquids", "A process that always makes flow subsonic"], "Continuous and isentropic", "An ideal expansion fan consists of many infinitesimal Mach waves and is isentropic, unlike an irreversible shock.", "Its changes are spread across a fan."),
  mc("set-64", "Supersonic Turning", 4, "In two-dimensional supersonic flow, turning the stream into itself around a concave corner generally creates what?", ["A compression shock", "An expansion fan", "No wave at all", "A purely vortical wake"], "A compression shock", "Turning supersonic flow into itself compresses it, and the compression waves coalesce into a shock.", "Concave means compression."),

  // K5 · Mach cone and sonic boom
  fill("set-65", "Mach Cone", 3, "For supersonic flow, the Mach angle μ satisfies sin μ = 1 divided by what quantity?", "Mach number", ["mach number", "m", "the mach number"], "The Mach-angle relation is sin μ = 1/M, valid for M greater than one.", "Use the symbol M.", 150),
  mc("set-65", "Mach Cone", 3, "As Mach number increases, what happens to the Mach-cone half-angle?", ["It decreases", "It increases toward 90 degrees", "It remains fixed", "It becomes undefined above Mach 2"], "It decreases", "Because μ = arcsin(1/M), increasing M produces a narrower Mach cone.", "Evaluate how 1/M changes."),
  mc("set-65", "Sonic Booms", 2, "What produces the sonic boom heard from a supersonic aircraft?", ["Its pressure disturbances coalescing into shock waves", "The engine exhaust striking the ground directly", "The aircraft crossing a fixed sound barrier wall", "Wing vibration at exactly one frequency"], "Its pressure disturbances coalescing into shock waves", "A sonic boom is the ground signature of aircraft-generated shock waves and associated pressure changes.", "It is a pressure-wave phenomenon.", 150, "mach-cone"),
  mc("set-65", "Sonic Booms", 3, "Is a sonic boom generated only at the instant an aircraft crosses Mach 1?", ["No, it is continuously generated during supersonic flight", "Yes, it is a one-time sound at Mach 1", "Yes, unless the aircraft climbs", "No, but only engine noise continues afterward"], "No, it is continuously generated during supersonic flight", "A supersonic aircraft continuously creates shock waves; observers hear the boom as the shock pattern sweeps over them.", "The shock pattern travels with the aircraft."),
  mc("set-65", "Mach Cone", 4, "What does the Mach cone represent physically?", ["The envelope of pressure disturbances emitted by a supersonic source", "The region where all air is motionless", "The exhaust plume boundary only", "A cone of constant temperature behind every aircraft"], "The envelope of pressure disturbances emitted by a supersonic source", "Because a supersonic source outruns its earlier disturbances, their wavefronts form a conical envelope.", "Imagine overlapping spherical wavefronts from a moving source.", 175, "mach-cone"),

  // K6 · Wave drag and area rule
  mc("set-66", "Wave Drag", 3, "What is wave drag?", ["Drag associated with shock waves and compressibility", "Drag caused only by wheel bearings", "The induced drag of a slow glider", "Skin friction in an incompressible liquid only"], "Drag associated with shock waves and compressibility", "Wave drag arises from pressure changes and energy losses linked to compressibility waves and shocks.", "It becomes prominent near and above Mach 1."),
  mc("set-66", "Area Rule", 3, "What does the transonic area rule seek to vary smoothly along an aircraft?", ["Total cross-sectional area", "Wing color", "Fuel temperature", "Landing-gear tire pressure"], "Total cross-sectional area", "The area rule reduces transonic wave drag by smoothing the longitudinal distribution of total aircraft cross-sectional area.", "Include wings and fuselage together."),
  mc("set-66", "Area Rule", 3, "Why does an area-ruled fuselage often narrow near the wing?", ["To offset the wing's added cross-sectional area", "To increase cabin pressure", "To eliminate all skin-friction drag", "To move the sonic boom behind the aircraft"], "To offset the wing's added cross-sectional area", "The fuselage waist compensates for wing area so the aircraft's total area distribution changes more smoothly.", "The wing adds area where it joins the fuselage."),
  mc("set-66", "Wave Drag", 4, "Which nose shape is generally favored for sustained supersonic flight to reduce wave drag?", ["A slender pointed nose", "A broad flat disk", "A hemispherical cup facing forward", "A square vertical plate"], "A slender pointed nose", "A slender pointed nose produces weaker, more oblique compression waves than a blunt shape at supersonic speed.", "Gentle compression creates weaker shocks."),
  mc("set-66", "Wave Drag", 4, "Why are thin airfoils commonly used for supersonic wings?", ["They reduce flow turning and shock strength", "They make air incompressible", "They eliminate the need for lift", "They force every shock to become normal"], "They reduce flow turning and shock strength", "Thin sections disturb supersonic flow less, helping reduce shock strength and wave drag.", "Less thickness means smaller compression angles."),

  // K7 · Hypersonic heating and thermal barriers
  mc("set-67", "Hypersonic Flight", 3, "Why does aerodynamic heating become severe at hypersonic speed?", ["Large kinetic energy is converted into internal energy near the vehicle", "The Sun becomes substantially closer", "Air loses all molecular motion", "Skin friction becomes the only aerodynamic force"], "Large kinetic energy is converted into internal energy near the vehicle", "Strong compression and viscous dissipation convert enormous kinetic energy into thermal energy in the shock layer and boundary layer.", "Track where the vehicle's kinetic energy goes.", 175),
  mc("set-67", "Thermal Barriers", 4, "Where is convective heating usually greatest on a blunt hypersonic vehicle?", ["Near the stagnation region", "At the far wake center", "Inside an insulated fuel tank", "Only at the trailing edge"], "Near the stagnation region", "The nose stagnation region experiences intense compression and high heat transfer as the flow is brought nearly to rest.", "Find where the incoming flow first stops."),
  mc("set-67", "Thermal Barriers", 4, "Why can a blunt nose be useful for atmospheric reentry despite producing high drag?", ["It holds the bow shock away and spreads heating over a larger area", "It eliminates the bow shock completely", "It prevents any air from touching the vehicle", "It makes the vehicle aerodynamically invisible"], "It holds the bow shock away and spreads heating over a larger area", "Blunt-body theory uses a detached shock and broad area to reduce peak heat flux at the surface, trading efficiency for survivability.", "Think heat management rather than low drag.", 175),
  mc("set-67", "Thermal Barriers", 4, "What is the purpose of an ablative thermal-protection material?", ["To carry heat away as its surface chars, melts, or vaporizes", "To increase shock-wave strength", "To make the gas perfectly incompressible", "To store all heat permanently inside the cabin"], "To carry heat away as its surface chars, melts, or vaporizes", "Ablators sacrifice material and absorb energy through chemical and phase changes, protecting the structure below.", "The protective layer is intentionally consumed."),
  mc("set-67", "Hypersonic Flight", 5, "At sufficiently high hypersonic temperatures, which real-gas effects can become important?", ["Molecular dissociation and ionization", "Permanent incompressibility", "The disappearance of viscosity", "Instant condensation of all air"], "Molecular dissociation and ionization", "Very high shock-layer temperatures excite molecules and can cause dissociation and ionization, so perfect-gas assumptions break down.", "Chemical changes occur when gas temperature becomes extreme.", 200),
];