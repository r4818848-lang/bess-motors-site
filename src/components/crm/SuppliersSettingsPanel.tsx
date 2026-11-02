"use client";

import { useCallback, useEffect, useState } from "react";
import { staffCrmFetch } from "@/lib/crm-staff-fetch";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SupplierConnectionPublic, SupplierId } from "@/lib/suppliers/types";

const STATUS_RU: Record<string, string> = {
  not_configured: "Не настроено",
  checking: "Проверка подключения…",
  connected: "Подключено",
  reauth_required: "Требуется повторная авторизация",
  user_action_required: "Требуется действие пользователя",
  error: "Ошибка",
  temporarily_unavailable: "Временно недоступно",
  not_supported: "Интеграция не поддерживается",
};

type Draft = {
  login: string;
  password: string;
  extra: string;
  environment: "production" | "sandbox";
};

const emptyDraft = (): Draft => ({
  login: "",
  password: "",
  extra: "",
  environment: "production",
});

export function SuppliersSettingsPanel() {
  const [connections, setConnections] = useState<SupplierConnectionPublic[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await staffCrmFetch("/api/crm/suppliers/connections");
    if (!res?.ok) {
      setError("Не удалось загрузить статусы поставщиков");
      return;
    }
    const json = (await res.json()) as { connections: SupplierConnectionPublic[] };
    setConnections(json.connections || []);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const draftFor = (id: string): Draft => drafts[id] || emptyDraft();

  const setDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((d) => ({ ...d, [id]: { ...draftFor(id), ...patch } }));
  };

  const parseExtra = (raw: string): Record<string, string> | undefined => {
    const t = raw.trim();
    if (!t) return undefined;
    try {
      return JSON.parse(t) as Record<string, string>;
    } catch {
      return undefined;
    }
  };

  const connect = async (supplierId: SupplierId) => {
    const d = draftFor(supplierId);
    if (!d.login || !d.password) {
      setError("Введите логин и пароль");
      return;
    }
    setBusy(supplierId);
    setError("");
    const extra = parseExtra(d.extra);
    if (d.extra.trim() && !extra) {
      setError("Поле extra должно быть JSON (например {\"kh_kod\":\"…\"})");
      setBusy(null);
      return;
    }
    const res = await staffCrmFetch("/api/crm/suppliers/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId,
        login: d.login,
        password: d.password,
        extra,
        environment: d.environment,
      }),
    });
    setBusy(null);
    if (!res?.ok) {
      const j = res ? await res.json().catch(() => ({})) : {};
      setError((j as { error?: string }).error || "Ошибка подключения");
      return;
    }
    setDraft(supplierId, { password: "" });
    await load();
  };

  const test = async (supplierId: SupplierId) => {
    setBusy(supplierId);
    const res = await staffCrmFetch("/api/crm/suppliers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId }),
    });
    setBusy(null);
    if (!res?.ok) {
      setError("Проверка не удалась");
      return;
    }
    await load();
  };

  const disconnect = async (supplierId: SupplierId) => {
    if (!confirm("Отключить поставщика и удалить сохранённые секреты?")) return;
    setBusy(supplierId);
    await staffCrmFetch("/api/crm/suppliers/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId }),
    });
    setBusy(null);
    await load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg uppercase">Поставщики → Подключения</h3>
        <p className="text-sm text-bm-muted mt-1">
          Пароли шифруются на сервере (AES-256-GCM), никогда не возвращаются в браузер и не
          пишутся в localStorage. Статус «Подключено» только после реального ответа API.
        </p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="space-y-4">
        {connections.map((c) => {
          const d = draftFor(c.supplierId);
          const disabled = c.status === "not_supported";
          return (
            <Card key={c.supplierId} className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.displayName}</p>
                  <p className="text-xs text-bm-muted">
                    {STATUS_RU[c.status] || c.status}
                    {c.loginHint ? ` · логин ${c.loginHint}` : ""}
                    {c.lastSuccessAt
                      ? ` · OK ${new Date(c.lastSuccessAt).toLocaleString("pl-PL")}`
                      : ""}
                  </p>
                  {c.lastError && (
                    <p className="text-xs text-amber-400 mt-1 max-w-prose">{c.lastError}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] uppercase px-2 py-1 rounded ${
                    c.status === "connected"
                      ? "bg-green-900/40 text-green-300"
                      : "bg-bm-muted/20 text-bm-muted"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              {!disabled && (
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-xs space-y-1">
                    <span className="uppercase text-bm-muted">Логин</span>
                    <input
                      className="input-premium w-full"
                      autoComplete="off"
                      value={d.login}
                      onChange={(e) => setDraft(c.supplierId, { login: e.target.value })}
                      placeholder={c.loginHint || "login / client id / kh_kod"}
                    />
                  </label>
                  <label className="text-xs space-y-1">
                    <span className="uppercase text-bm-muted">Пароль / secret / token</span>
                    <input
                      className="input-premium w-full"
                      type="password"
                      autoComplete="new-password"
                      value={d.password}
                      onChange={(e) => setDraft(c.supplierId, { password: e.target.value })}
                      placeholder={c.hasPassword ? "•••• (оставьте пустым чтобы не менять — введите для смены)" : "••••"}
                    />
                  </label>
                  <label className="text-xs space-y-1 md:col-span-2">
                    <span className="uppercase text-bm-muted">
                      Extra JSON (опционально: mode, authUrl, webserviceUrl, searchPath, branchId…)
                    </span>
                    <textarea
                      className="input-premium w-full min-h-[64px] font-mono text-xs"
                      value={d.extra}
                      onChange={(e) => setDraft(c.supplierId, { extra: e.target.value })}
                      placeholder='{"mode":"katalog"} или {"environment":"sandbox"}'
                    />
                  </label>
                  <label className="text-xs space-y-1">
                    <span className="uppercase text-bm-muted">Среда</span>
                    <select
                      className="input-premium w-full"
                      value={d.environment}
                      onChange={(e) =>
                        setDraft(c.supplierId, {
                          environment: e.target.value as "production" | "sandbox",
                        })
                      }
                    >
                      <option value="production">Production</option>
                      <option value="sandbox">Sandbox</option>
                    </select>
                  </label>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {!disabled && (
                  <>
                    <Button
                      type="button"
                      disabled={busy === c.supplierId}
                      onClick={() => void connect(c.supplierId)}
                    >
                      Подключить
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy === c.supplierId || !c.hasPassword}
                      onClick={() => void test(c.supplierId)}
                    >
                      Проверить
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy === c.supplierId || !c.hasPassword}
                      onClick={() => void connect(c.supplierId)}
                    >
                      Переподключить
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy === c.supplierId || !c.hasPassword}
                      onClick={() => void disconnect(c.supplierId)}
                    >
                      Отключить
                    </Button>
                  </>
                )}
              </div>
              <p className="text-[10px] text-bm-muted">
                Возможности: {(c.capabilities || []).join(", ") || "—"}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
