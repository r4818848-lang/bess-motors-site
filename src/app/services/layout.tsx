import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/StructuredData";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { servicesItemListSchema } from "@/lib/seo-structured-data";

export const metadata: Metadata = buildPageMetadata({
  title: "Usługi — wulkanizacja, klimatyzacja, tuning",
  description:
    "Usługi BESS MOTORS Warszawa: wymiana opon, klimatyzacja, wymiana oleju, hamulce, chip tuning, diagnostyka komputerowa. Cennik i zapis online.",
  path: "/services",
  keywords: [
    "usługi serwis samochodowy",
    "wulkanizacja Warszawa",
    "chip tuning",
    "diagnostyka komputerowa",
  ],
});

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={servicesItemListSchema()} />
      {children}
    </>
  );
}
