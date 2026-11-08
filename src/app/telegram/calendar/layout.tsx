import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Календарь | BESS MOTORS",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function TelegramCalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
