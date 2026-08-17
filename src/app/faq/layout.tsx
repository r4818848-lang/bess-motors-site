import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/StructuredData";
import { siteFaqSchemaItems } from "@/lib/seo-faq-schema";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { faqPageSchema } from "@/lib/seo-structured-data";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ — olej, hamulce, klima, ceny",
  description:
    "FAQ BESS MOTORS Warszawa: wymiana oleju 100 zł, klocki od 100 zł (kod BessMotors), nabijanie klimatyzacji −50%, chip tuning, zapis online. Aleja Krakowska 48/52.",
  path: "/faq",
  keywords: ["FAQ serwis samochodowy Warszawa", "wymiana oleju 100 zł", "chip tuning Warszawa"],
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={faqPageSchema(siteFaqSchemaItems)} />
      {children}
    </>
  );
}
