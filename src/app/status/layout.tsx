import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Status naprawy online",
  description:
    "Sprawdź status naprawy auta w BESS MOTORS Warszawa — postęp prac, gotowość odbioru.",
  path: "/status",
  noIndex: true,
});

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
