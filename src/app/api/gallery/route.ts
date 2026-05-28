import { NextResponse } from "next/server";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import type { WorkOrder } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type PublicGalleryItem = {
  id: string;
  title: string;
  make?: string;
  beforeUrl?: string;
  afterUrl?: string;
};

function pickImage(files: WorkOrder["files"], category: "before" | "after"): string | undefined {
  const f = files.find((x) => x.category === category && x.type === "image" && x.dataUrl);
  return f?.dataUrl;
}

/** Public gallery from CRM orders marked showInGallery (admin checkbox). */
export async function GET() {
  const items: PublicGalleryItem[] = [];

  const cloud = await cloudGetCrmStore();
  const orders = cloud?.doc.workOrders ?? [];

  for (const order of orders) {
    if (!order.showInGallery) continue;
    const vehicle = cloud?.doc.vehicles.find((v) => v.id === order.vehicleId);
    const beforeUrl = pickImage(order.files, "before");
    const afterUrl = pickImage(order.files, "after");
    if (!beforeUrl && !afterUrl) continue;

    const title = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ") || order.number;
    items.push({
      id: order.id,
      title,
      make: vehicle?.make,
      beforeUrl,
      afterUrl,
    });
  }

  return NextResponse.json({ items: items.slice(0, 48) });
}
