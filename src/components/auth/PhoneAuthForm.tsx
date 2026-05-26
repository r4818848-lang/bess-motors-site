"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, Car, LogIn, ChevronRight, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/session-context";
import { loginWithPhonePassword, type AuthResult } from "@/lib/auth";
import { loadClientCredentials } from "@/lib/client-credentials";
import { pullClientPortalFromCloud } from "@/lib/client-portal";
import { Button } from "@/components/ui/Button";

interface PhoneAuthFormProps {
  onSuccess?: () => void;
}

export function PhoneAuthForm({ onSuccess }: PhoneAuthFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<"phone" | "plate" | null>(null);

  useEffect(() => {
    const saved = loadClientCredentials();
    if (saved) {
      setPhone(saved.phone);
      setPlate(saved.plate);
    }
  }, []);

  const errorMessage = (result: Extract<AuthResult, { ok: false }>) => {
    switch (result.error) {
      case "phone_required":
        return t.auth.phoneRequired;
      case "plate_required":
        return t.auth.plateRequired;
      case "mechanic_account":
        return t.auth.mechanicAccountHint;
      default:
        return t.auth.invalidCredentials;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginWithPhonePassword(phone, plate);

      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }

      if (result.role === "admin") {
        router.push("/crm");
        return;
      }

      await pullClientPortalFromCloud().catch(() => null);

      refreshAuth();
      onSuccess?.();
      router.refresh();
    } catch {
      setError(t.auth.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        className="absolute -inset-1 rounded-3xl opacity-60 blur-xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(225,6,0,0.3), transparent 70%)",
        }}
      />

      <div className="relative rounded-2xl p-6 sm:p-8 overflow-hidden glass-red neon-border">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% -20%, rgba(225,6,0,0.2) 0%, transparent 60%)",
          }}
        />

        <form className="relative z-10" autoComplete="on" onSubmit={handleSubmit}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-center tracking-widest text-glow">
            {t.cabinet.title}
          </h1>
          <p className="text-center text-sm text-bm-muted mt-2 mb-2">{t.auth.subtitle}</p>
          <p className="text-center text-[10px] text-bm-muted/80 mb-6">{t.auth.plateHint}</p>
          <p className="text-center text-[10px] text-amber-400/90 mb-4">{t.auth.signCreatesAccount}</p>

          <div className="space-y-4">
            <div className="relative group">
              <Phone
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  focused === "phone" ? "text-bm-red" : "text-bm-muted"
                }`}
              />
              <input
                id="bess-client-phone"
                name="username"
                type="tel"
                inputMode="tel"
                autoComplete="username tel"
                className="input-premium pl-10 w-full bg-bm-black/60 backdrop-blur-md transition-all duration-300"
                style={{
                  boxShadow:
                    focused === "phone"
                      ? "0 0 24px rgba(225, 6, 0, 0.35), inset 0 0 0 1px rgba(225,6,0,0.5)"
                      : undefined,
                }}
                placeholder={t.cabinet.phone}
                value={phone}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused(null)}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Car
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  focused === "plate" ? "text-bm-red" : "text-bm-muted"
                }`}
              />
              <input
                id="bess-client-plate"
                name="password"
                type="text"
                autoComplete="current-password"
                autoCapitalize="characters"
                spellCheck={false}
                className="input-premium pl-10 w-full bg-bm-black/60 backdrop-blur-md font-mono tracking-wider transition-all duration-300"
                style={{
                  boxShadow:
                    focused === "plate"
                      ? "0 0 24px rgba(225, 6, 0, 0.35), inset 0 0 0 1px rgba(225,6,0,0.5)"
                      : undefined,
                }}
                placeholder={t.cabinet.registrationPlate}
                value={plate}
                onFocus={() => setFocused("plate")}
                onBlur={() => setFocused(null)}
                onChange={(e) => setPlate(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-bm-red text-center">{error}</p>}

          <Link
            href="/mechanic"
            className="mt-4 flex items-center justify-center gap-2 text-xs text-bm-muted hover:text-bm-red transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            {t.auth.mechanicLoginLink}
          </Link>

          <Button type="submit" className="w-full mt-4 gap-2" disabled={loading}>
            {loading ? (
              <span className="animate-pulse">{t.auth.loading}</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {t.cabinet.login}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
