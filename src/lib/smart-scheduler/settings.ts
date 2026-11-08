export type ResourceSetting = {
  id: string;
  kind: "lift" | "tyre_machine" | "balancer" | "ac_station" | "diagnostic_device";
  label: string;
  available: boolean;
  operational: boolean;
};

export type MechanicBreak = {
  mechanicId: string;
  start: string;
  end: string;
};

export type SchedulerSettings = {
  resources: ResourceSetting[];
  breaks: MechanicBreak[];
  reservePct: number;
  runflatCoefficient: number;
};

export const defaultSchedulerSettings: SchedulerSettings = {
  reservePct: 15,
  runflatCoefficient: 1.2,
  resources: [
    { id: "lift-1", kind: "lift", label: "Подъёмник 1", available: true, operational: true },
    { id: "lift-2", kind: "lift", label: "Подъёмник 2", available: true, operational: true },
    { id: "tyre-1", kind: "tyre_machine", label: "Шиномонтажный станок", available: true, operational: true },
    { id: "balancer-1", kind: "balancer", label: "Балансировочный станок", available: true, operational: true },
    { id: "ac-1", kind: "ac_station", label: "Станция кондиционера", available: true, operational: true },
    { id: "diag-1", kind: "diagnostic_device", label: "Диагностическое оборудование", available: true, operational: true },
  ],
  breaks: [
    { mechanicId: "mech-1", start: "13:00", end: "13:20" },
    { mechanicId: "mech-2", start: "13:30", end: "13:50" },
  ],
};

export function resourceReady(resources: ResourceSetting[], id: string): boolean {
  const resource = resources.find((item) => item.id === id);
  return Boolean(resource?.available && resource.operational);
}
