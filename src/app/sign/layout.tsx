import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Подпись заказ-наряда",
  robots: { index: false, follow: false },
};

/** Minimal layout wrapper — avoids pulling heavy CRM chunks into sign route */
export default function SignLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
