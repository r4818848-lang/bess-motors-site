"use client";

import { useCrmDisplay } from "@/contexts/CrmDisplayContext";

export function CrmShell({ children }: { children: React.ReactNode }) {
  const { theme } = useCrmDisplay();
  return (
    <div className="crm-shell relative z-10 w-full min-h-screen" data-theme={theme}>
      {children}
    </div>
  );
}
