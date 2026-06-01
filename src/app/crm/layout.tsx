import type { Metadata } from "next";
import { CrmGuard } from "@/components/auth/CrmGuard";
import { CrmDisplayProvider } from "@/contexts/CrmDisplayContext";
import { CrmShell } from "@/components/crm/CrmShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** CRM — dark (default) or Motowarsztat-style light theme */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmDisplayProvider>
      <CrmShell>
        <CrmGuard>{children}</CrmGuard>
      </CrmShell>
    </CrmDisplayProvider>
  );
}
