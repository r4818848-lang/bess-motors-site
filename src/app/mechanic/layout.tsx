import type { Metadata } from "next";
import { MechanicGuard } from "@/components/auth/MechanicGuard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MechanicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative z-10 w-full"
      style={{ minHeight: "calc(100vh - 8rem)", backgroundColor: "#0a0a0a" }}
    >
      <MechanicGuard>{children}</MechanicGuard>
    </div>
  );
}
