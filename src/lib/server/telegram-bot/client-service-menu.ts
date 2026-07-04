import { getTranslations } from "@/lib/i18n/translations";
import {
  bookingGridServiceIds,
  serviceFlows,
  type ServiceId,
} from "@/lib/services-catalog";
import { botContentLocale, type BotLocale } from "./client-i18n";
import { getClientServiceLabel } from "./client-services";

export type ServiceSubOption = { id: string; label: string };

export function telegramServiceCategoryIds(): ServiceId[] {
  return [...bookingGridServiceIds];
}

function flowOptionLabel(
  labelKey: string,
  locale: BotLocale
): string {
  const loc = botContentLocale(locale);
  const bf = getTranslations(loc).bookingFlow as Record<string, string>;
  return bf[labelKey] ?? labelKey;
}

function collectFlowOptions(categoryId: ServiceId, locale: BotLocale): ServiceSubOption[] {
  const flows = serviceFlows[categoryId];
  if (!flows?.length) return [];

  const seen = new Set<string>();
  const result: ServiceSubOption[] = [];

  const push = (id: string, labelKey: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    result.push({ id, label: flowOptionLabel(labelKey, locale) });
  };

  for (const flow of flows) {
    if (flow.kind === "options") {
      for (const opt of flow.options) push(opt.id, opt.labelKey);
    }
    if (flow.kind === "yesnoThen") {
      for (const block of flow.ifYes) {
        if (block.kind === "multi") {
          for (const opt of block.options) push(opt.id, opt.labelKey);
        }
      }
      for (const block of flow.then) {
        if (block.kind === "options") {
          for (const opt of block.options) {
            if (opt.id !== "other") push(opt.id, opt.labelKey);
          }
        }
      }
    }
  }
  return result;
}

export function getCategorySubOptions(
  categoryId: ServiceId,
  locale: BotLocale
): ServiceSubOption[] {
  if (categoryId === "otherReason") return [];

  const sub = collectFlowOptions(categoryId, locale);
  if (sub.length === 0) {
    return [{ id: "_default", label: getClientServiceLabel(categoryId, locale) }];
  }

  const basic = getClientServiceLabel(categoryId, locale);
  if (sub.some((s) => s.label === basic)) return sub;
  return [{ id: "_default", label: basic }, ...sub];
}

export function hasMultipleSubOptions(categoryId: ServiceId, locale: BotLocale): boolean {
  return getCategorySubOptions(categoryId, locale).length > 1;
}

export function buildTelegramServiceLabel(
  categoryId: string,
  optionId: string,
  locale: BotLocale
): string {
  const opts = getCategorySubOptions(categoryId as ServiceId, locale);
  const opt = opts.find((o) => o.id === optionId);
  if (!opt || optionId === "_default") {
    return getClientServiceLabel(categoryId, locale);
  }
  const cat = getClientServiceLabel(categoryId, locale);
  return `${cat} — ${opt.label}`;
}
