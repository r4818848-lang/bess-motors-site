export type ResourceStatus = "available" | "broken" | "maintenance";

export type ResourceSetting = {
  id: string;
  kind: "lift" | "tyre_machine" | "balancer" | "ac_station" | "diagnostic_device";
  label: string;
  status: ResourceStatus;
  confirmed: boolean;
};

export type MechanicBreak = {
  mechanicId: string;
  start: string;
  end: string;
};

export type MechanicSchedule = {
  mechanicId: string;
  shiftStart: string | null;
  shiftEnd: string | null;
  breaks: { start: string; end: string }[];
  vacation: { from: string; to: string }[];
  absent: string[];
};

export type SchedulerSettings = {
  resources: ResourceSetting[];
  schedules: MechanicSchedule[];
  displayNames: Record<string, string>;
  reservePct: number;
  runflatCoefficient: number;
};

const blankSchedule = (mechanicId: string): MechanicSchedule => ({
  mechanicId,
  shiftStart: null,
  shiftEnd: null,
  breaks: [],
  vacation: [],
  absent: [],
});

export const defaultSchedulerSettings: SchedulerSettings = {
  reservePct: 15,
  runflatCoefficient: 1.2,
  displayNames: {},
  schedules: [blankSchedule("mech-1"), blankSchedule("mech-2")],
  resources: [
    { id: "lift-1", kind: "lift", label: "Подъёмник 1", status: "maintenance", confirmed: false },
    { id: "lift-2", kind: "lift", label: "Подъёмник 2", status: "maintenance", confirmed: false },
    { id: "tyre-1", kind: "tyre_machine", label: "Шиномонтажный станок", status: "maintenance", confirmed: false },
    { id: "balancer-1", kind: "balancer", label: "Балансировочный станок", status: "maintenance", confirmed: false },
    { id: "ac-1", kind: "ac_station", label: "Станция кондиционера", status: "maintenance", confirmed: false },
    { id: "diag-1", kind: "diagnostic_device", label: "Диагностическое оборудование", status: "maintenance", confirmed: false },
  ],
};

export function resourceReady(resources: ResourceSetting[], id: string): boolean {
  const resource = resources.find((item) => item.id === id);
  return resource?.confirmed === true && resource.status === "available";
}

export function scheduledBreaks(settings: SchedulerSettings): MechanicBreak[] {
  return settings.schedules.flatMap((schedule) => schedule.breaks.map((item) => ({ mechanicId: schedule.mechanicId, start: item.start, end: item.end })));
}
