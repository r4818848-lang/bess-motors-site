import { clockToMinutes } from "@/lib/workshop-schedule";

export type OverlapRow = {
  id: string;
  mechanicId: string;
  date: string;
  workStart: string;
  workMinutes: number;
  lift: string;
  plate: string;
};

/** Reports existing overlaps. It does not move or rewrite the appointments. */
export function workOverlapWarnings(rows: OverlapRow[]): string[] {
  const warnings: string[] = [];
  for (let left = 0; left < rows.length; left += 1) {
    for (let right = left + 1; right < rows.length; right += 1) {
      const first = rows[left];
      const second = rows[right];
      if (first.date !== second.date || first.workMinutes <= 0 || second.workMinutes <= 0) continue;
      const startA = clockToMinutes(first.workStart);
      const startB = clockToMinutes(second.workStart);
      if (startA == null || startB == null) continue;
      if (startA + first.workMinutes <= startB || startB + second.workMinutes <= startA) continue;
      if (first.mechanicId && first.mechanicId === second.mechanicId) {
        warnings.push(`Пересечение механика ${first.mechanicId}: ${first.plate || first.id} и ${second.plate || second.id}. Записи не изменены.`);
      }
      if (first.lift && first.lift === second.lift) {
        warnings.push(`Пересечение ${first.lift}: ${first.plate || first.id} и ${second.plate || second.id}. Записи не изменены.`);
      }
    }
  }
  return warnings;
}
