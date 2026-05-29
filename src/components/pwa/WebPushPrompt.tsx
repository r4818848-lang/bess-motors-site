"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { subscribeWebPush } from "@/lib/push-client";

export function WebPushPrompt({ userId }: { userId: string }) {
  const { t } = useI18n();
  const w = t.webPush;
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (done || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;

  const click = async () => {
    setError("");
    const res = await subscribeWebPush(userId);
    if (res.ok) setDone(true);
    else if (res.reason === "denied") setError(w.denied);
    else if (res.reason === "no_vapid") setError(w.noVapid);
    else setError(w.failed);
  };

  return (
    <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Bell size={18} className="text-bm-red" />
        <span>{w.label}</span>
      </div>
      <button type="button" className="btn-outline text-xs" onClick={click}>
        {w.enable}
      </button>
      {error && <p className="text-xs text-red-400 w-full">{error}</p>}
    </div>
  );
}
