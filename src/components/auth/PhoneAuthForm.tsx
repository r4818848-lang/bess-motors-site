"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, LogIn, UserPlus, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { loginWithPhonePassword, registerClient, type AuthResult } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

type Mode = "login" | "register";

interface PhoneAuthFormProps {
  onSuccess?: () => void;
}

export function PhoneAuthForm({ onSuccess }: PhoneAuthFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<"phone" | "password" | null>(null);

  const errorMessage = (result: Extract<AuthResult, { ok: false }>) => {
    switch (result.error) {
      case "phone_exists":
        return t.auth.phoneExists;
      case "phone_required":
        return t.auth.phoneRequired;
      case "password_required":
        return t.auth.passwordRequired;
      default:
        return t.auth.invalidCredentials;
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "register"
          ? await registerClient(phone, password)
          : await loginWithPhonePassword(phone, password);

      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }

      if (result.role === "admin") {
        router.push("/crm");
        return;
      }

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
      <motion.div
        className="absolute -inset-1 rounded-3xl opacity-60 blur-xl"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(225,6,0,0.35), transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(225,6,0,0.25), transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(225,6,0,0.35), transparent 50%)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl p-6 sm:p-8 overflow-hidden glass-red neon-border"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% -20%, rgba(225,6,0,0.2) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10">
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-center tracking-widest text-glow">
            {t.cabinet.title}
          </h1>
          <p className="text-center text-sm text-bm-muted mt-2 mb-8">{t.auth.subtitle}</p>

          <div className="flex rounded-xl border border-bm-border/60 p-1 mb-6 bg-bm-black/50 backdrop-blur-sm">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2.5 text-xs font-display font-semibold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  mode === m
                    ? "bg-bm-red text-white shadow-neon-sm"
                    : "text-bm-muted hover:text-white"
                }`}
              >
                {m === "login" ? t.cabinet.login : t.cabinet.register}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="relative group">
                <Phone
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                    focused === "phone" ? "text-bm-red" : "text-bm-muted"
                  }`}
                />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
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
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>

              <div className="relative group">
                <Lock
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                    focused === "password" ? "text-bm-red" : "text-bm-muted"
                  }`}
                />
                <input
                  type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="input-premium pl-10 w-full bg-bm-black/60 backdrop-blur-md transition-all duration-300"
                  style={{
                    boxShadow:
                      focused === "password"
                        ? "0 0 24px rgba(225, 6, 0, 0.35), inset 0 0 0 1px rgba(225,6,0,0.5)"
                        : undefined,
                  }}
                  placeholder={t.cabinet.password}
                  value={password}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-bm-red text-center"
            >
              {error}
            </motion.p>
          )}

          <Button className="w-full mt-6 gap-2" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="animate-pulse">{t.auth.loading}</span>
            ) : mode === "register" ? (
              <>
                <UserPlus className="w-4 h-4" />
                {t.cabinet.register}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {t.cabinet.login}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
