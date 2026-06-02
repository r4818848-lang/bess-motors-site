"use client";

import { useEffect, useState } from "react";
import { CRM_DRAFT_LOCK_EVENT, isCrmDraftLockActive } from "@/lib/crm-draft-lock";

export function useCrmDraftLockActive(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const update = () => setActive(isCrmDraftLockActive());
    update();
    window.addEventListener(CRM_DRAFT_LOCK_EVENT, update);
    return () => window.removeEventListener(CRM_DRAFT_LOCK_EVENT, update);
  }, []);

  return active;
}
