export const serviceCategories = [
  { id: "oil", icon: "Droplets" },
  { id: "diagnostic", icon: "Scan" },
  { id: "electric", icon: "Zap" },
  { id: "suspension", icon: "Settings" },
  { id: "brakes", icon: "Disc" },
  { id: "engine", icon: "Cog" },
  { id: "transmission", icon: "Settings2" },
  { id: "ac", icon: "Wind" },
  { id: "detailing", icon: "Sparkles" },
  { id: "polish", icon: "Sun" },
  { id: "paint", icon: "Paintbrush" },
  { id: "stage1", icon: "Gauge" },
  { id: "stage2", icon: "Gauge" },
  { id: "chip", icon: "Cpu" },
  { id: "turbo", icon: "Fan" },
  { id: "exhaust", icon: "Flame" },
] as const;

export const mechanics = [
  { id: "mech-1", name: "Jan Kowalski", specialty: "Engine / Tuning", rating: 4.9 },
  { id: "mech-2", name: "Piotr Nowak", specialty: "Diagnostics / Electric", rating: 4.8 },
  { id: "mech-3", name: "Marek Wiśniewski", specialty: "Detailing / Paint", rating: 5.0 },
];

export const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

export const reviews = [
  { name: "Michał K.", car: "BMW M340i", text: "Stage 2 + downpipe — +80 KM. Profesjonalizm na najwyższym poziomie!", rating: 5 },
  { name: "Anna W.", car: "Mercedes C300", text: "Detailing ceramiczny — auto jak nowe. Polecam BESS MOTORS!", rating: 5 },
  { name: "Dmitry S.", car: "Audi RS3", text: "Chip tuning i diagnostyka AI — szybko i dokładnie.", rating: 5 },
];

export const galleryProjects = [
  { id: 1, title: "BMW M4 — Stage 2", category: "tuning", before: "#1a1a2e", after: "#16213e" },
  { id: 2, title: "Porsche 911 — Detailing", category: "detailing", before: "#2d132c", after: "#801336" },
  { id: 3, title: "Mercedes AMG — Paint", category: "paint", before: "#0f3460", after: "#e94560" },
  { id: 4, title: "Audi RS6 — Exhaust", category: "tuning", before: "#1b262c", after: "#3282b8" },
  { id: 5, title: "VW Golf GTI — Chip", category: "tuning", before: "#2b2d42", after: "#ef233c" },
  { id: 6, title: "Tesla Model 3 — Wrap", category: "detailing", before: "#212529", after: "#495057" },
];

export const stats = [
  { value: "2,500+", key: "clients" as const },
  { value: "8,000+", key: "repairs" as const },
  { value: "12+", key: "years" as const },
  { value: "4.9", key: "rating" as const },
];
