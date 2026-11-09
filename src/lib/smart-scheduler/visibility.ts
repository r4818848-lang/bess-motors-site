export type SchedulerActor = {
  role: string;
  mechanicId?: string;
  canEdit: boolean;
};

export function visibleToActor<T extends { mechanicId: string }>(actor: SchedulerActor, rows: T[]): T[] {
  if (actor.role === "owner" || actor.role === "admin") return rows;
  if (actor.role === "mechanic" && actor.mechanicId) {
    return rows.filter((row) => row.mechanicId === actor.mechanicId);
  }
  return [];
}

const SECRET = /phone|password|vin|initData|service_role/i;

export function responseLeaksSecrets(value: unknown): boolean {
  return SECRET.test(JSON.stringify(value));
}
