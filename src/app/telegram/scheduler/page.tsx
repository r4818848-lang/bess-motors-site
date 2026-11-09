import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { workshopHours } from "@/lib/businessConfig";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { schedulerOwnerWritePilotEnabled, schedulerPageOpen, schedulerReadOnlyPilotEnabled, smartWorkSchedulerEnabled } from "@/lib/smart-scheduler/flag";
import type { OverlapRule } from "@/lib/smart-scheduler/schedule";
import { WorkScheduler } from "@/components/scheduler/WorkScheduler";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "План работ | BESS MOTORS",
  robots: { index: false, follow: false },
};

export default function SmartSchedulerPage() {
  if (!schedulerPageOpen()) notFound();
  const csv = readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8");
  const rules = JSON.parse(readFileSync(join(process.cwd(), "data/smart-scheduler/overlap-rules.json"), "utf8")) as OverlapRule[];
  const ownerWrite = schedulerOwnerWritePilotEnabled();
  return <WorkScheduler catalog={parseOperationCatalog(csv)} hours={workshopHours()} rules={rules} readOnly={!ownerWrite && (!smartWorkSchedulerEnabled() || schedulerReadOnlyPilotEnabled())} allowTestMode={process.env.VERCEL_ENV !== "production" && !ownerWrite} />;
}
