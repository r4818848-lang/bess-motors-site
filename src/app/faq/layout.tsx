import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/StructuredData";
import { siteFaqSchemaItems } from "@/lib/seo-faq-schema";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { faqPageSchema } from "@/lib/seo-structured-data";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ — częste pytania",
  description:
    "BESS MOTORS Warszawa — pytania o wymianę oleju, chip tuning, wulkanizację, ceny i rezerwację online.",
  path: "/faq",
  keywords: ["FAQ serwis samochodowy", "ceny wymiana oleju", "chip tuning Warszawa"],
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={faqPageSchema(siteFaqSchemaItems)} />
      {children}
    </>
  );
}
