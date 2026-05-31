import type { Metadata } from "next";
import { CrmGuard } from "@/components/auth/CrmGuard";
import { CrmDisplayProvider } from "@/contexts/CrmDisplayContext";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** CRM routes — Motowarsztat-style light ERP workspace */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crm-shell relative z-10 w-full min-h-screen">
      <CrmDisplayProvider>
        <CrmGuard>{children}</CrmGuard>
      </CrmDisplayProvider>
    </div>
  );
}
