/** Popular services order (homepage) + smart booking flow options */

export type ServiceId = (typeof popularServices)[number]["id"];

export const popularServices = [
  { id: "oil", icon: "Droplets" },
  { id: "acRefill", icon: "Wind" },
  { id: "brakePads", icon: "Disc" },
  { id: "diagnostic", icon: "ScanLine" },
  { id: "suspension", icon: "Settings" },
  { id: "filters", icon: "Filter" },
  { id: "tires", icon: "Circle" },
  { id: "alignment", icon: "Crosshair" },
  { id: "electric", icon: "Zap" },
  { id: "brakesFull", icon: "CircleDot" },
  { id: "acRepair", icon: "Snowflake" },
  { id: "timingBelt", icon: "Clock" },
  { id: "otherReason", icon: "HelpCircle" },
  { id: "engine", icon: "Cog" },
  { id: "transmission", icon: "Settings2" },
  { id: "detailing", icon: "Sparkles" },
  { id: "polish", icon: "Sun" },
  { id: "paint", icon: "Paintbrush" },
  { id: "stage1", icon: "Gauge" },
  { id: "chip", icon: "Cpu" },
  { id: "turbo", icon: "Fan" },
  { id: "exhaust", icon: "Flame" },
  { id: "webasto", icon: "Thermometer" },
  { id: "starterGen", icon: "Battery" },
  { id: "multimedia", icon: "Monitor" },
  { id: "cameras", icon: "Camera" },
  { id: "audio", icon: "Volume2" },
  { id: "ppf", icon: "Shield" },
  { id: "radiators", icon: "Droplets" },
  { id: "clutch", icon: "Cog" },
  { id: "fuel", icon: "Fuel" },
] as const;

export type FlowOption = { id: string; labelKey: string };

export type ServiceFlow =
  | { kind: "options"; questionKey: string; options: FlowOption[]; multi?: boolean }
  | { kind: "yesno"; questionKey: string; yesKey: string; noKey: string }
  | {
      kind: "yesnoThen";
      questionKey: string;
      yesKey: string;
      noKey: string;
      ifYes: { kind: "multi"; questionKey: string; options: FlowOption[] }[];
      then: { kind: "options"; questionKey: string; options: FlowOption[] }[];
    };

export const serviceFlows: Partial<Record<ServiceId, ServiceFlow[]>> = {
  oil: [
    {
      kind: "yesnoThen",
      questionKey: "oilExtra",
      yesKey: "yes",
      noKey: "no",
      ifYes: [
        {
          kind: "multi",
          questionKey: "oilFilters",
          options: [
            { id: "oilFilter", labelKey: "oilFilter" },
            { id: "cabinFilter", labelKey: "cabinFilter" },
            { id: "airFilter", labelKey: "airFilter" },
            { id: "fuelFilter", labelKey: "fuelFilter" },
          ],
        },
      ],
      then: [
        {
          kind: "options",
          questionKey: "oilType",
          options: [
            { id: "5w30", labelKey: "w5w30" },
            { id: "5w40", labelKey: "w5w40" },
            { id: "0w30", labelKey: "w0w30" },
            { id: "0w20", labelKey: "w0w20" },
            { id: "other", labelKey: "other" },
          ],
        },
        {
          kind: "options",
          questionKey: "oilBrand",
          options: [
            { id: "motul", labelKey: "motul" },
            { id: "liqui", labelKey: "liqui" },
            { id: "castrol", labelKey: "castrol" },
            { id: "shell", labelKey: "shell" },
            { id: "valvoline", labelKey: "valvoline" },
            { id: "other", labelKey: "other" },
          ],
        },
      ],
    },
  ],
  brakePads: [
    {
      kind: "options",
      questionKey: "brakesOpts",
      options: [
        { id: "front", labelKey: "brakeFront" },
        { id: "rear", labelKey: "brakeRear" },
        { id: "frontRear", labelKey: "brakeFrontRear" },
        { id: "discFront", labelKey: "brakeDiscFront" },
        { id: "discAll", labelKey: "brakeDiscAll" },
        { id: "diag", labelKey: "brakeDiag" },
      ],
    },
  ],
  brakesFull: [
    {
      kind: "options",
      questionKey: "brakesOpts",
      options: [
        { id: "front", labelKey: "brakeFront" },
        { id: "rear", labelKey: "brakeRear" },
        { id: "frontRear", labelKey: "brakeFrontRear" },
        { id: "discFront", labelKey: "brakeDiscFront" },
        { id: "discAll", labelKey: "brakeDiscAll" },
        { id: "diag", labelKey: "brakeDiag" },
      ],
    },
  ],
  acRefill: [
    {
      kind: "options",
      questionKey: "acOpts",
      options: [
        { id: "refill", labelKey: "acRefill" },
        { id: "leak", labelKey: "acLeak" },
        { id: "ozone", labelKey: "acOzone" },
        { id: "clean", labelKey: "acClean" },
        { id: "diag", labelKey: "acDiag" },
      ],
    },
  ],
  acRepair: [
    {
      kind: "options",
      questionKey: "acOpts",
      options: [
        { id: "refill", labelKey: "acRefill" },
        { id: "leak", labelKey: "acLeak" },
        { id: "ozone", labelKey: "acOzone" },
        { id: "clean", labelKey: "acClean" },
        { id: "diag", labelKey: "acDiag" },
      ],
    },
  ],
  tires: [
    {
      kind: "options",
      questionKey: "tireOpts",
      options: [
        { id: "change", labelKey: "tireChange" },
        { id: "balance", labelKey: "tireBalance" },
        { id: "repair", labelKey: "tireRepair" },
        { id: "storage", labelKey: "tireStorage" },
        { id: "runflat", labelKey: "tireRunflat" },
      ],
    },
  ],
  suspension: [
    {
      kind: "options",
      questionKey: "suspOpts",
      options: [
        { id: "diag", labelKey: "suspDiag" },
        { id: "shocks", labelKey: "suspShocks" },
        { id: "bushings", labelKey: "suspBushings" },
        { id: "arms", labelKey: "suspArms" },
        { id: "springs", labelKey: "suspSprings" },
      ],
    },
  ],
  timingBelt: [
    {
      kind: "options",
      questionKey: "grmOpts",
      options: [
        { id: "belt", labelKey: "grmBelt" },
        { id: "chain", labelKey: "grmChain" },
        { id: "kit", labelKey: "grmKit" },
        { id: "pump", labelKey: "grmPump" },
        { id: "diag", labelKey: "grmDiag" },
      ],
    },
  ],
  transmission: [
    {
      kind: "options",
      questionKey: "dsgOpts",
      options: [
        { id: "oilDsg", labelKey: "dsgOil" },
        { id: "diag", labelKey: "dsgDiag" },
        { id: "repair", labelKey: "dsgRepair" },
        { id: "adapt", labelKey: "dsgAdapt" },
        { id: "clutch", labelKey: "dsgClutch" },
      ],
    },
  ],
};

/** Legacy list for dropdowns — same order */
export const serviceCategories = popularServices;

/** Online booking grid: 12 popular + «other reason» */
export const bookingGridServiceIds = [
  "oil",
  "acRefill",
  "brakePads",
  "diagnostic",
  "suspension",
  "filters",
  "tires",
  "electric",
  "brakesFull",
  "acRepair",
  "timingBelt",
  "otherReason",
] as const satisfies readonly ServiceId[];

export const bookingGridServices = bookingGridServiceIds.map(
  (id) => popularServices.find((s) => s.id === id)!
);
