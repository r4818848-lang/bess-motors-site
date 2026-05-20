"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, LogIn, UserPlus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  loginWithPhonePassword,
  registerClient,
  type AuthResult,
} from "@/lib/auth";
import { Button } from "@/components/ui/Button";

type Mode = "login" | "register";

interface PhoneAuthFormProps {
  /** CRM: hide register tab; redirect client logins to cabinet */
  variant?: "cabinet" | "crm";
  onSuccess?: (role: "admin" | "client") => void;
}

const glowCard: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(20,20,20,0.98) 0%, rgba(10,10,10,0.99) 100%)",
  border: "1px solid rgba(225, 6, 0, 0.35)",
  boxShadow:
    "0 0 40px rgba(225, 6, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
};

export function PhoneAuthForm({ variant = "cabinet", onSuccess }: PhoneAuthFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showRegister = variant === "cabinet";

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
        onSuccess?.("admin");
        if (variant === "crm") return;
        router.push("/crm");
        return;
      }

      onSuccess?.("client");
      if (variant === "crm") {
        router.push("/cabinet");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-md mx-auto rounded-2xl p-6 sm:p-8 relative overflow-hidden"
      style={glowCard}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(225,6,0,0.25) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-center tracking-wide">
          {variant === "crm" ? t.crm.adminLogin : t.cabinet.title}
        </h1>
        <p className="text-center text-sm text-bm-muted mt-2 mb-6">{t.auth.subtitle}</p>

        {showRegister && (
          <div className="flex rounded-lg border border-bm-border/80 p-1 mb-6 bg-bm-graphite/50">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2.5 text-xs font-display font-semibold uppercase tracking-wider rounded-md transition-all duration-300 ${
                  mode === m
                    ? "bg-bm-red text-white shadow-neon-sm"
                    : "text-bm-muted hover:text-white"
                }`}
              >
                {m === "login" ? t.cabinet.login : t.cabinet.register}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "login" ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="relative group">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted group-focus-within:text-bm-red transition-colors" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="input-premium pl-10 w-full transition-shadow duration-300 focus:shadow-[0_0_20px_rgba(225,6,0,0.35)]"
                placeholder={t.cabinet.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted group-focus-within:text-bm-red transition-colors" />
              <input
                type="password"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="input-premium pl-10 w-full transition-shadow duration-300 focus:shadow-[0_0_20px_rgba(225,6,0,0.35)]"
                placeholder={t.cabinet.password}
                value={password}
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

        <Button
          className="w-full mt-6 gap-2"
          onClick={handleSubmit}
          disabled={loading}
        >
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

        <p className="mt-4 text-[11px] text-center text-bm-muted leading-relaxed">
          {t.auth.demoHint}
        </p>

        {variant === "cabinet" && (
          <div className="mt-6 pt-5 border-t border-bm-border/60 text-center">
            <Link
              href="/crm"
              className="text-xs uppercase tracking-wider text-bm-muted hover:text-bm-red transition-colors"
            >
              {t.auth.adminPanelLink}
            </Link>
          </div>
        )}

        {variant === "crm" && (
          <p className="mt-6 text-center text-xs text-bm-muted">
            <Link href="/" className="hover:text-bm-red transition-colors">
              ← {t.nav.home}
            </Link>
            {" · "}
            <Link href="/cabinet" className="hover:text-bm-red transition-colors">
              {t.cabinet.title}
            </Link>
          </p>
        )}
      </div>
    </motion.div>
  );
}
