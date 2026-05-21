import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Konto klienta",
  robots: { index: false, follow: false },
};

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
