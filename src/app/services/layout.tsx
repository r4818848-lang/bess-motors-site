import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/StructuredData";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { servicesItemListSchema } from "@/lib/seo-structured-data";

export const metadata: Metadata = buildPageMetadata({
  title: "Usługi — olej, hamulce, klima, diagnostyka",
  description:
    "Usługi BESS MOTORS Warszawa Włochy: wymiana oleju 80 zł + zawieszenie gratis przy oleju, klocki od 100 zł (kod BessMotors), opony, diagnostyka. Zapis online.",
  path: "/services",
  keywords: [
    "usługi serwis samochodowy Warszawa",
    "wymiana oleju Warszawa",
    "wulkanizacja Warszawa",
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
