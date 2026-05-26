"use client";

import { useState } from "react";
import { Phone, Lock, LogIn, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loginMechanic } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

interface MechanicAuthFormProps {
  onSuccess?: () => void;
}

export function MechanicAuthForm({ onSuccess }: MechanicAuthFormProps) {
  const { t } = useI18n();
  const m = t.mechanic;
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginMechanic(phone, password);
      if (!result.ok) {
        setError(
          result.error === "phone_required"
            ? t.auth.phoneRequired
            : result.error === "password_required"
              ? t.auth.passwordRequired
              : t.auth.invalidCredentials
        );
        return;
      }
      onSuccess?.();
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
        <form className="relative z-10" autoComplete="on" onSubmit={handleSubmit}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-center tracking-widest text-glow">
            {m.title}
          </h1>
          <p className="text-center text-sm text-bm-muted mt-2 mb-6">{m.loginHint}</p>

          <div className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="username tel"
                required
                className="input-premium pl-10 w-full"
                placeholder={t.cabinet.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
              <input
                type="password"
                autoComplete="current-password"
                required
                className="input-premium pl-10 w-full"
                placeholder={m.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-bm-red text-center">{error}</p>}

          <Button type="submit" className="w-full mt-6 gap-2" disabled={loading}>
            {loading ? (
              <span className="animate-pulse">{t.auth.loading}</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {m.login}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
