import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Календарь | BESS MOTORS",
  robots: { index: false, follow: false },
};

export default function TelegramCalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
