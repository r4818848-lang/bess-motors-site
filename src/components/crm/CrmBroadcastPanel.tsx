"use client";

import { useState } from "react";

export function CrmBroadcastPanel() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const send = async () => {
    const token = localStorage.getItem("bess-jwt");
    if (!token) {
      setStatus("Zaloguj się jako admin (CRM).");
      return;
    }
    setStatus("…");
    const res = await fetch("/api/crm/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setStatus(res.ok ? `Wysłano: ${data.sent ?? 0}` : "Błąd");
    if (res.ok) setText("");
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <p className="font-display uppercase text-sm text-bm-red">Broadcast Telegram</p>
      <p className="text-xs text-bm-muted">Wszyscy klienci z podłączonym Telegram (bez wyciszenia).</p>
      <textarea
        className="input-premium w-full min-h-[80px] text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tekst wiadomości…"
      />
      <button type="button" className="btn-primary text-sm" disabled={text.trim().length < 3} onClick={() => void send()}>
        Wyślij automatycznie
      </button>
      {status && <p className="text-xs text-bm-muted">{status}</p>}
    </div>
  );
}
