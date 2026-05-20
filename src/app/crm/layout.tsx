import type { Metadata } from "next";
import { CrmGuard } from "@/components/auth/CrmGuard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** CRM routes — hidden ERP; no public links, not indexed */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative z-10 w-full"
      style={{ minHeight: "calc(100vh - 8rem)", backgroundColor: "#0a0a0a" }}
    >
      <CrmGuard>{children}</CrmGuard>
    </div>
  );
}
