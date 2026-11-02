import {
  AI_TOOLS,
  runAiTool,
  sanitizeUntrustedContext,
  type AiToolName,
} from "@/lib/ai/erp-tools";
import { redactForLog } from "@/lib/server/secrets-crypto";

export type AiMessage = { role: "user" | "assistant" | "system"; content: string };

export type AiAuditEntry = {
  at: string;
  userId: string;
  role: string;
  promptPreview: string;
  toolsUsed: string[];
  model: string;
  tokensIn?: number;
  tokensOut?: number;
  confirmedActions: string[];
};

const auditRing: AiAuditEntry[] = [];
const MAX_AUDIT = 200;

export function getAiAuditLog(): AiAuditEntry[] {
  return [...auditRing].reverse();
}

function pushAudit(e: AiAuditEntry) {
  auditRing.push(e);
  if (auditRing.length > MAX_AUDIT) auditRing.shift();
}

function pickModel(complexity: "simple" | "complex"): string {
  if (complexity === "complex") {
    return process.env.ERP_AI_MODEL_COMPLEX?.trim() || "gpt-4o-mini";
  }
  return process.env.ERP_AI_MODEL_SIMPLE?.trim() || "gpt-4o-mini";
}

function detectTools(prompt: string): AiToolName[] {
  const p = prompt.toLowerCase();
  const tools: AiToolName[] = [];
  if (/częś|запчаст|parts|oem|vin|filtr|klock|tarcze|диск|колод/.test(p)) {
    tools.push("search_parts", "compare_prices");
  }
  if (/porówn|сравн|compare|tańsz|дешев/.test(p)) tools.push("compare_prices");
  if (/bess\/|bm-|zl |заказ|zlecen|order/.test(p)) tools.push("find_order");
  if (/pensj|зарплат|payroll|mechanic|mechanik|сиерг|илj|sierg|ilja/.test(p)) {
    tools.push("payroll_week");
  }
  if (/zysk|прибыл|profit|przychód|выручк|finance/.test(p)) tools.push("finance_summary");
  if (/usług|услуг|service|грм|rozrząd|sprzęg/.test(p)) tools.push("list_services");
  if (/wiadomość|сообщен|message|ofert|предложен/.test(p)) tools.push("draft_client_message");
  return Array.from(new Set(tools));
}

function extractArgs(prompt: string): Record<string, unknown> {
  const vin = prompt.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i)?.[1];
  const order =
    prompt.match(/\b(BESS\/\d{4}\/\d+)\b/i)?.[1] ||
    prompt.match(/\b(BM-\d{4}-\d+)\b/i)?.[1] ||
    prompt.match(/\b(ZL\s*\d+\/\d+\/\d+)\b/i)?.[1];
  const oem = prompt.match(/\bOEM[:\s]*([A-Z0-9\-]+)\b/i)?.[1];
  const article = prompt.match(/\b(?:art(?:ykuł|icle)?|sku)[:\s]*([A-Z0-9\-./]+)\b/i)?.[1];
  return {
    vin,
    orderNumber: order,
    oem,
    article,
    name: !article && !oem ? prompt.slice(0, 120) : undefined,
    topic: "wycena",
    language: /рус|ru\b/i.test(prompt) ? "ru" : /english|\ben\b/i.test(prompt) ? "en" : "pl",
  };
}

/**
 * ERP AI agent: runs allowlisted tools with real data, then optionally calls an LLM
 * to narrate. Without ERP_AI_API_KEY, returns structured tool results only (no invented prices).
 */
export async function runErpAgent(opts: {
  prompt: string;
  userId: string;
  role: string;
  confirmActions?: string[];
}): Promise<{
  reply: string;
  toolResults: { name: string; result: unknown }[];
  model: string;
  needsConfirmation?: string[];
  auditId: string;
}> {
  const safePrompt = sanitizeUntrustedContext(opts.prompt);
  const tools = detectTools(safePrompt);
  const args = extractArgs(safePrompt);
  const toolResults: { name: string; result: unknown }[] = [];

  for (const name of tools) {
    const result = await runAiTool(name, args);
    toolResults.push({ name, result });
  }

  const needsConfirmation = ["send_client_message"].filter(
    (a) => !(opts.confirmActions || []).includes(a)
  );

  const model = pickModel(tools.includes("compare_prices") ? "complex" : "simple");
  let reply = formatToolFallback(toolResults, safePrompt);

  const apiKey = process.env.ERP_AI_API_KEY?.trim();
  const baseUrl = (process.env.ERP_AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  if (apiKey && toolResults.length) {
    try {
      const system = [
        "You are the BESS MOTORS workshop ERP assistant.",
        "Use ONLY the tool JSON provided. Never invent prices, stock, or VIN fitment.",
        "If tool data is empty, say credentials/search are missing.",
        "Reply in the user's language (RU/PL/EN). Keep answers concise.",
        "Never reveal passwords or ask to paste supplier passwords in chat.",
        "Sending messages/orders requires human confirmation.",
      ].join(" ");
      const userContent = `User: ${safePrompt}\n\nTool results JSON:\n${JSON.stringify(toolResults).slice(0, 12000)}`;
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: Number(process.env.ERP_AI_MAX_TOKENS || 800),
          messages: [
            { role: "system", content: system },
            { role: "user", content: userContent },
          ],
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const content = json.choices?.[0]?.message?.content?.trim();
        if (content) reply = content;
        pushAudit({
          at: new Date().toISOString(),
          userId: opts.userId,
          role: opts.role,
          promptPreview: safePrompt.slice(0, 200),
          toolsUsed: tools,
          model,
          tokensIn: json.usage?.prompt_tokens,
          tokensOut: json.usage?.completion_tokens,
          confirmedActions: opts.confirmActions || [],
        });
      } else {
        console.warn("[ai] llm http", res.status, redactForLog(await res.text()));
      }
    } catch (e) {
      console.warn("[ai] llm error", redactForLog(e));
    }
  } else {
    pushAudit({
      at: new Date().toISOString(),
      userId: opts.userId,
      role: opts.role,
      promptPreview: safePrompt.slice(0, 200),
      toolsUsed: tools,
      model: apiKey ? model : "tools-only",
      confirmedActions: opts.confirmActions || [],
    });
  }

  return {
    reply,
    toolResults,
    model: apiKey ? model : "tools-only",
    needsConfirmation: needsConfirmation.length ? needsConfirmation : undefined,
    auditId: `${Date.now()}`,
  };
}

function formatToolFallback(
  toolResults: { name: string; result: unknown }[],
  prompt: string
): string {
  if (!toolResults.length) {
    return (
      "Не нашёл подходящих инструментов для запроса. Уточните артикул/OEM/VIN или номер заказа BESS/…. " +
      `(prompt: ${prompt.slice(0, 80)})`
    );
  }
  const lines: string[] = ["Результаты инструментов ERP (без выдуманных цен):"];
  for (const t of toolResults) {
    lines.push(`\n### ${t.name}`);
    lines.push("```json");
    lines.push(JSON.stringify(t.result, null, 2).slice(0, 2500));
    lines.push("```");
  }
  if (!process.env.ERP_AI_API_KEY?.trim()) {
    lines.push(
      "\n_LLM отключён (нет ERP_AI_API_KEY). Показаны только реальные данные инструментов._"
    );
  }
  return lines.join("\n");
}

export function listAiToolCatalog() {
  return AI_TOOLS;
}
