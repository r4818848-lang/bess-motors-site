import type { Operation } from "@/lib/smart-scheduler/catalog";
import { mayAutoAssignMechanic } from "@/lib/smart-scheduler/identity";
import {
  explainOverlap,
  findHoldConflict,
  planOperationMinutes,
  splitWorkBlocks,
  suggestSlots,
  type Hold,
  type OverlapRule,
} from "@/lib/smart-scheduler/schedule";
import type { WorkshopHours } from "@/lib/workshop-schedule";

export type JobPlan = {
  minutes: number | null;
  source: "catalog" | "estimate" | "unconfirmed";
  normTrusted: boolean;
  explanation: string;
  operationCodes: string[];
};

/**
 * Combined labour time. A packaged operation in the same overlap group
 * replaces the sum of its parts. An unapproved overlap rule does not invent a discount.
 * Missing catalog minutes are an estimate, not a factory norm.
 */
export function planCombinedJob(operations: Operation[], rules: OverlapRule[] = []): JobPlan {
  const active = operations.filter((item) => item.isActive);
  if (active.length === 0) {
    return { minutes: null, source: "unconfirmed", normTrusted: false, explanation: "Операции не выбраны.", operationCodes: [] };
  }
  const groups = new Map<string, Operation[]>();
  for (const operation of active) {
    const key = operation.overlapGroup || operation.operationCode;
    groups.set(key, [...(groups.get(key) ?? []), operation]);
  }
  let minutes = 0;
  let estimate = false;
  let unconfirmed = false;
  const notes: string[] = [];
  const codes: string[] = [];
  for (const group of groups.values()) {
    const packaged = group.find((item) => /[+]/.test(item.operationNameRu) && item.referenceCalendarMinutes != null);
    const chosen = group.length > 1 && packaged ? [packaged] : group;
    if (group.length > 1 && packaged) {
      notes.push(`${packaged.operationNameRu}: пакет ${packaged.referenceCalendarMinutes} мин вместо суммы частей.`);
    }
    for (const operation of chosen) {
      codes.push(operation.operationCode);
      const planned = planOperationMinutes(operation);
      if (planned.minutes == null) {
        unconfirmed = true;
        notes.push(`${operation.operationNameRu}: подтверждённой нормы нет. Сумма остальных операций не резервируется.`);
        continue;
      }
      if (planned.source !== "reference") {
        estimate = true;
        notes.push(`${operation.operationNameRu}: ${planned.minutes} мин — оценка, не заводская норма.`);
      }
      minutes += planned.minutes;
    }
  }
  if (unconfirmed) {
    return {
      minutes: null,
      source: "unconfirmed",
      normTrusted: false,
      explanation: `${notes.join(" ")} Окончательное время задаёт владелец.`,
      operationCodes: codes,
    };
  }
  const overlap = explainOverlap(codes, active, rules);
  const savings = overlap.reduce((total, item) => total + item.savingsMinutes, 0);
  if (savings > 0) {
    minutes = Math.max(15, minutes - savings);
    notes.push(overlap.map((item) => item.explanation).join(" "));
  } else if (overlap.some((item) => !item.savingsMinutes)) {
    notes.push("Правило совмещения есть, но скидка не подтверждена. Время не уменьшено.");
  }
  if (unconfirmed && minutes === 0) {
    return { minutes: null, source: "unconfirmed", normTrusted: false, explanation: notes.join(" "), operationCodes: codes };
  }
  return {
    minutes: minutes || null,
    source: unconfirmed || estimate ? "estimate" : "catalog",
    normTrusted: !unconfirmed && !estimate && savings === 0,
    explanation: notes.join(" ") || "Сумма справочных минут. Скидка за совмещение не применялась.",
    operationCodes: codes,
  };
}

export function recommendMechanics(input: {
  mechanics: { id: string; confirmed: boolean; label: string }[];
  source: "live" | "fixture";
  date: string;
  start: string;
  minutes: number;
  resourceIds: string[];
  hours: WorkshopHours;
  occupied: Hold[];
}): { mechanicId: string; label: string; reason: string }[] {
  const ideas = suggestSlots({
    date: input.date,
    start: input.start,
    minutes: input.minutes,
    mechanicId: "",
    mechanicIds: input.mechanics.filter((item) => mayAutoAssignMechanic(item, input.source)).map((item) => item.id),
    resourceIds: input.resourceIds,
    hours: input.hours,
    occupied: input.occupied,
  });
  return ideas.map((idea) => {
    const mechanic = input.mechanics.find((item) => item.id === idea.mechanicId);
    return {
      mechanicId: idea.mechanicId,
      label: mechanic?.label ?? idea.mechanicId,
      reason: mechanic?.confirmed ? "Свободен в этот интервал." : "Доступен только в тестовой конфигурации.",
    };
  });
}

export function assignmentRefusal(input: {
  date: string;
  start: string;
  minutes: number;
  mechanicId: string;
  confirmed: boolean;
  source: "live" | "fixture";
  resourceIds: string[];
  hours: WorkshopHours;
  occupied: Hold[];
}): string | null {
  if (input.source === "live" && !input.confirmed) return "Личность механика не подтверждена. Автоназначение закрыто.";
  const split = splitWorkBlocks({
    id: "check",
    date: input.date,
    start: input.start,
    minutes: input.minutes,
    hours: input.hours,
    mechanicId: input.mechanicId,
    resourceIds: input.resourceIds,
    operationCode: "check",
  });
  if (!split.ok) return "Время вне часов сервиса или день закрыт.";
  const conflict = split.blocks.map((block) => findHoldConflict(input.occupied, block)).find(Boolean);
  if (!conflict) return null;
  return conflict.code === "resource" ? "Ресурс уже занят в этот интервал." : "Механик уже занят в этот интервал.";
}
