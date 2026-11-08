import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { workshopHours } from "@/lib/businessConfig";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { syntheticSnapshot } from "@/lib/smart-scheduler/fixture";
import { smartWorkSchedulerEnabled } from "@/lib/smart-scheduler/flag";
import type { OverlapRule } from "@/lib/smart-scheduler/schedule";
import { WorkScheduler } from "@/components/scheduler/WorkScheduler";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "План работ | BESS MOTORS",
  robots: { index: false, follow: false },
};

export default function SmartSchedulerPage() {
  if (!smartWorkSchedulerEnabled()) notFound();
  const csv = readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8");
  const rules = JSON.parse(readFileSync(join(process.cwd(), "data/smart-scheduler/overlap-rules.json"), "utf8")) as OverlapRule[];
  return <WorkScheduler catalog={parseOperationCatalog(csv)} hours={workshopHours()} snapshot={syntheticSnapshot(new Date(), workshopHours())} rules={rules} />;
}
