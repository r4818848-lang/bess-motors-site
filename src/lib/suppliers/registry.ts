import type { SupplierAdapter, SupplierId } from "@/lib/suppliers/types";
import { hartAdapter } from "@/lib/suppliers/adapters/hart";
import { interCarsAdapter } from "@/lib/suppliers/adapters/inter-cars";
import { autoPartnerAdapter } from "@/lib/suppliers/adapters/auto-partner";
import { motowarsztatAdapter } from "@/lib/suppliers/adapters/motowarsztat";

const ADAPTERS: Record<SupplierId, SupplierAdapter> = {
  hart: hartAdapter,
  inter_cars: interCarsAdapter,
  auto_partner: autoPartnerAdapter,
  motowarsztat: motowarsztatAdapter,
};

export function getAdapter(id: SupplierId): SupplierAdapter | undefined {
  return ADAPTERS[id];
}

export function listAdapters(): SupplierAdapter[] {
  return Object.values(ADAPTERS);
}
