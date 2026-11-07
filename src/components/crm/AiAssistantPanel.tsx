"use client";

import { useState } from "react";
import { staffCrmFetch } from "@/lib/crm-staff-fetch";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AiAssistantPanel() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState("");

  const ask = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setReply("");
    const res = await staffCrmFetch("/api/crm/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    setLoading(false);
    if (!res?.ok) {
      setReply("Ошибка AI API");
      return;
    }
    const json = (await res.json()) as {
      reply: string;
      model: string;
      needsConfirmation?: string[];
      toolResults?: unknown[];
    };
    setReply(json.reply);
    setMeta(
      `model: ${json.model}` +
        (json.needsConfirmation?.length
          ? ` · нужно подтверждение: ${json.needsConfirmation.join(", ")}`
          : "")
    );
  };

  return (
    <Card className="p-4 space-y-3">
      <div>
        <h3 className="font-display text-lg uppercase">AI-ассистент ERP</h3>
        <p className="text-xs text-bm-muted">
          Работает через инструменты ERP (поиск, сравнение, заказы, зарплаты). Без выдуманных цен.
          Отправка сообщений клиенту — только после подтверждения.
        </p>
      </div>
      <textarea
        className="input-premium w-full min-h-[88px]"
        placeholder="Найди передние диски и колодки на Audi A4, сравни Bosch и Delphi…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button type="button" disabled={loading} onClick={() => void ask()}>
        {loading ? "…" : "Спросить"}
      </Button>
      {meta && <p className="text-[10px] text-bm-muted">{meta}</p>}
      {reply && (
        <pre className="whitespace-pre-wrap text-sm bg-black/20 p-3 rounded max-h-96 overflow-auto">
          {reply}
        </pre>
      )}
    </Card>
  );
}
