"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  isAdminAuthenticated,
  isMechanicAuthenticated,
  restoreSessionFromToken,
} from "@/lib/auth";

/** Protects /crm/* — admin full access; mechanics only /crm/work-orders */
export function CrmGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    restoreSessionFromToken()
      .catch(() => null)
      .finally(() => {
        if (isAdminAuthenticated()) {
          setAllowed(true);
          return;
        }
        if (
          isMechanicAuthenticated() &&
          pathname.startsWith("/crm/work-orders")
        ) {
          setAllowed(true);
          return;
        }
        if (isMechanicAuthenticated()) {
          router.replace("/mechanic");
          return;
        }
        router.replace("/cabinet");
      });
  }, [router, pathname]);

  if (!allowed) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100vh - 8rem)" }}
      >
        <div className="h-8 w-8 rounded-full border-2 border-bm-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
