"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export function CrmBroadcastPanel() {
  const c = useI18n().t.crm;
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const send = async () => {
    const token = localStorage.getItem("bess-jwt");
    if (!token) {
      setStatus(c.broadcastLoginRequired);
      return;
    }
    setStatus(c.broadcastSending);
    const res = await fetch("/api/crm/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setStatus(
      res.ok
        ? c.broadcastSent.replace("{count}", String(data.sent ?? 0))
        : c.broadcastError
    );
    if (res.ok) setText("");
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <p className="font-display uppercase text-sm text-bm-red">{c.broadcastTitle}</p>
      <p className="text-xs text-bm-muted">{c.broadcastHint}</p>
      <textarea
        className="input-premium w-full min-h-[80px] text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={c.broadcastPlaceholder}
      />
      <button
        type="button"
        className="btn-primary text-sm"
        disabled={text.trim().length < 3}
        onClick={() => void send()}
      >
        {c.broadcastSend}
      </button>
      {status && <p className="text-xs text-bm-muted">{status}</p>}
    </div>
  );
}
