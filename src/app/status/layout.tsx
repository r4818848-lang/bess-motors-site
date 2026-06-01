import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Status naprawy online",
  description:
    "Sprawdź status naprawy auta w BESS MOTORS Warszawa — postęp prac, gotowość odbioru. Panel klienta i powiadomienia.",
  path: "/status",
  keywords: ["status naprawy", "BESS MOTORS", "serwis Warszawa"],
});

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
