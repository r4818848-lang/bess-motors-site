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
    let cancelled = false;

    const deny = () => {
      if (cancelled) return;
      if (isMechanicAuthenticated()) {
        router.replace(
          pathname.startsWith("/crm/work-orders") ? pathname : "/mechanic"
        );
        return;
      }
      router.replace("/cabinet?crm=1");
    };

    const allow = () => {
      if (!cancelled) setAllowed(true);
    };

    /* Right after login: token is in localStorage — do not block CRM on slow verify */
    if (isAdminAuthenticated()) {
      allow();
      void restoreSessionFromToken().then((user) => {
        if (cancelled) return;
        if (!user && !isAdminAuthenticated()) {
          setAllowed(false);
          deny();
        }
      });
      return () => {
        cancelled = true;
      };
    }

    restoreSessionFromToken()
      .catch(() => null)
      .finally(() => {
        if (cancelled) return;
        if (isAdminAuthenticated()) {
          allow();
          return;
        }
        if (
          isMechanicAuthenticated() &&
          pathname.startsWith("/crm/work-orders")
        ) {
          allow();
          return;
        }
        deny();
      });

    return () => {
      cancelled = true;
    };
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
