"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isMechanicAuthenticated, restoreSessionFromToken } from "@/lib/auth";

/** Protects /mechanic/* — only mechanic session; others go to client cabinet login */
export function MechanicGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    restoreSessionFromToken()
      .catch(() => null)
      .finally(() => {
        if (isMechanicAuthenticated()) {
          setAllowed(true);
        } else {
          router.replace("/cabinet");
        }
      });
  }, [router]);

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
