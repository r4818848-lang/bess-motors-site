import { NextResponse } from "next/server";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import type { WorkOrder } from "@/lib/store";
import { calcServicesSubtotal } from "@/lib/workorder-calc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type PublicGalleryItem = {
  id: string;
  title: string;
  make?: string;
  job?: string;
  laborPriceZl?: number;
  caption?: string;
  beforeUrl?: string;
  afterUrl?: string;
};

function pickImage(files: WorkOrder["files"], category: "before" | "after"): string | undefined {
  const f = files.find((x) => x.category === category && x.type === "image" && x.dataUrl);
  return f?.dataUrl;
}

function galleryCaption(make: string, job: string, laborPriceZl?: number): string {
  const head = [make, job].filter(Boolean).join(" · ");
  if (laborPriceZl && laborPriceZl > 0) {
    return `${head} · robocizna ${Math.round(laborPriceZl)} zł`;
  }
  return head;
}

/** Public gallery from CRM orders marked showInGallery (admin checkbox). */
export async function GET() {
  const items: PublicGalleryItem[] = [];

  const cloud = await cloudGetCrmStore();
  const orders = [...(cloud?.doc.workOrders ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  for (const order of orders) {
    if (!order.showInGallery) continue;
    const vehicle = cloud?.doc.vehicles.find((v) => v.id === order.vehicleId);
    const beforeUrl = pickImage(order.files, "before");
    const afterUrl = pickImage(order.files, "after");
    if (!beforeUrl && !afterUrl) continue;

    const make = [vehicle?.make, vehicle?.model].filter(Boolean).join(" ");
    const job = order.services[0]?.name || order.number;
    const laborRaw = calcServicesSubtotal(order);
    const laborPriceZl = laborRaw > 0 ? Math.round(laborRaw) : undefined;
    const title = make || order.number;

    items.push({
      id: order.id,
      title,
      make: vehicle?.make,
      job,
      laborPriceZl,
      caption: galleryCaption(make || title, job, laborPriceZl),
      beforeUrl,
      afterUrl,
    });
  }

  return NextResponse.json({ items: items.slice(0, 48) });
}
