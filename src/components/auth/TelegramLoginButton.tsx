"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Car } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/session-context";
import { establishClientSessionFromToken } from "@/lib/auth";
import { pullClientPortalFromCloud } from "@/lib/client-portal";
import { Button } from "@/components/ui/Button";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

const BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "BessMotors_bot";

export function TelegramLoginButton() {
  const { locale } = useI18n();
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [needPlate, setNeedPlate] = useState(false);
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [tgUser, setTgUser] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const labels =
    locale === "ru" || locale === "uk"
      ? {
          divider: "или через Telegram",
          needPlate: "Укажите телефон и госномер — как при первом визите",
          phone: "Телефон",
          plate: "Госномер (пароль кабинета)",
          continue: "Войти",
          fail: "Не удалось войти через Telegram",
        }
      : {
          divider: "lub przez Telegram",
          needPlate: "Podaj telefon i numer rejestracyjny",
          phone: "Telefon",
          plate: "Numer rejestracyjny",
          continue: "Zaloguj",
          fail: "Logowanie Telegram nie powiodło się",
        };

  const finishLogin = async (payload: Record<string, unknown>) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        token?: string;
      };

      if (data.error === "need_plate") {
        setTgUser(payload);
        setNeedPlate(true);
        return;
      }

      if (!res.ok || !data.token) {
        setError(labels.fail);
        return;
      }

      const user = await establishClientSessionFromToken(data.token);
      if (!user) {
        setError(labels.fail);
        return;
      }

      await pullClientPortalFromCloud().catch(() => null);
      refreshAuth();
      router.refresh();
    } catch {
      setError(labels.fail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.onTelegramAuth = (user) => {
      void finishLogin(user as Record<string, unknown>);
    };

    const el = containerRef.current;
    if (!el || el.dataset.loaded === "1") return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    el.appendChild(script);
    el.dataset.loaded = "1";

    return () => {
      delete window.onTelegramAuth;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (needPlate && tgUser) {
    return (
      <div className="space-y-3 pt-2 border-t border-white/10">
        <p className="text-xs text-bm-muted text-center">{labels.needPlate}</p>
        <input
          className="input-dark w-full text-sm"
          placeholder={labels.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div className="relative">
          <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
          <input
            className="input-dark w-full pl-10 text-sm uppercase"
            placeholder={labels.plate}
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <Button
          type="button"
          className="w-full"
          disabled={loading || phone.trim().length < 9 || plate.trim().length < 2}
          onClick={() =>
            void finishLogin({ ...tgUser, phone: phone.trim(), plate: plate.trim() })
          }
        >
          {labels.continue}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2 border-t border-white/10">
      <p className="text-xs text-bm-muted text-center uppercase tracking-wider">
        {labels.divider}
      </p>
      <div ref={containerRef} className="flex justify-center min-h-[44px]" />
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
