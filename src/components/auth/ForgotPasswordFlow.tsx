"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Phone,
  Lock,
  KeyRound,
  ArrowLeft,
  MessageSquare,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import {
  requestPasswordResetCode,
  verifyPasswordResetCode,
  resetClientPassword,
  smsResetCodeUrl,
  whatsappResetHelpUrl,
  type ResetError,
} from "@/lib/password-reset";

type Step = "phone" | "code" | "password" | "done";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  initialPhone?: string;
}

export function ForgotPasswordFlow({ onBack, onSuccess, initialPhone = "" }: Props) {
  const { t, locale } = useI18n();
  const r = t.passwordReset;
  const lang = locale === "ru" || locale === "uk" ? "ru" : "pl";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [demoCode, setDemoCode] = useState<string | undefined>();
  const [resendSec, setResendSec] = useState(0);
  const [smsEnabled, setSmsEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/forgot-password/status")
      .then((res) => res.json())
      .then((data: { enabled?: boolean }) => setSmsEnabled(!!data.enabled))
      .catch(() => setSmsEnabled(false));
  }, []);

  useEffect(() => {
    if (resendSec <= 0) return;
    const id = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendSec]);

  const errMsg = useCallback(
    (e: ResetError) => {
      const map = r.errors as Record<string, string>;
      return map[e] ?? r.errors.invalid_code;
    },
    [r.errors]
  );

  const sendCode = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await requestPasswordResetCode(phone, lang);
      if (!result.ok) {
        setError(errMsg(result.error));
        if (result.error === "rate_limit") setResendSec(60);
        return;
      }
      setMaskedPhone(result.data!.maskedPhone);
      setDemoCode(result.data!.demoCode);
      setResendSec(result.data!.resendInSec);
      setStep("code");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await verifyPasswordResetCode(phone, code);
      if (!result.ok) {
        setError(errMsg(result.error));
        return;
      }
      setResetToken(result.data!.resetToken);
      setStep("password");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await resetClientPassword(
        phone,
        resetToken,
        newPassword,
        confirmPassword
      );
      if (!result.ok) {
        setError(errMsg(result.error));
        return;
      }
      setStep("done");
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

      <div className="relative rounded-2xl p-6 sm:p-8 glass-red neon-border overflow-hidden">
        <button
          type="button"
          onClick={step === "phone" ? onBack : () => setStep(step === "password" ? "code" : "phone")}
          className="flex items-center gap-1 text-xs text-bm-muted hover:text-bm-red mb-4"
        >
          <ArrowLeft size={14} /> {step === "phone" ? r.backToLogin : r.back}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-bm-red/20">
            <Shield className="w-6 h-6 text-bm-red" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold uppercase text-glow">{r.title}</h2>
            <p className="text-xs text-bm-muted">{r.subtitle}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6">
          {(["phone", "code", "password"] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                (step === "phone" && i === 0) ||
                (step === "code" && i <= 1) ||
                (step === "password" && i <= 2) ||
                step === "done"
                  ? "bg-bm-red shadow-neon-sm"
                  : "bg-bm-border"
              }`}
            />
          ))}
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <p className="text-sm text-bm-muted">{r.phoneStep}</p>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
              <input
                type="tel"
                className="input-premium pl-10 w-full"
                placeholder={t.cabinet.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendCode()}
              />
            </div>
            <Button className="w-full" onClick={sendCode} disabled={loading}>
              {loading ? r.sending : r.sendCode}
            </Button>
            <a
              href={whatsappResetHelpUrl(lang)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full text-xs justify-center"
            >
              <MessageSquare size={14} /> {r.contactService}
            </a>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <p className="text-sm text-bm-muted">
              {r.codeSent} <span className="text-white font-mono">{maskedPhone}</span>
            </p>

            {smsEnabled ? (
              <div className="rounded-xl border border-bm-red/30 bg-bm-red/5 p-4 text-center">
                <p className="text-sm text-bm-muted">{r.smsSentReal}</p>
              </div>
            ) : (
              demoCode && (
                <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4 text-center">
                  <p className="text-[10px] uppercase text-amber-400 tracking-widest mb-2">
                    {r.demoCodeLabel}
                  </p>
                  <p className="font-mono text-3xl font-bold tracking-[0.4em] text-white">
                    {demoCode}
                  </p>
                  <p className="text-[10px] text-bm-muted mt-2">{r.demoCodeHint}</p>
                  <a
                    href={smsResetCodeUrl(phone, demoCode, lang)}
                    className="btn-outline text-xs inline-flex mt-3"
                  >
                    <MessageSquare size={14} /> {r.openSms}
                  </a>
                </div>
              )
            )}

            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input-premium pl-10 w-full font-mono text-xl tracking-[0.3em] text-center"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verifyCode()}
              />
            </div>
            <Button
              className="w-full"
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
            >
              {loading ? r.verifying : r.verifyCode}
            </Button>
            <button
              type="button"
              disabled={resendSec > 0 || loading}
              onClick={sendCode}
              className="w-full text-xs text-bm-muted hover:text-bm-red disabled:opacity-40"
            >
              {resendSec > 0 ? `${r.resendIn} ${resendSec}s` : r.resendCode}
            </button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-4">
            <p className="text-sm text-bm-muted">{r.newPasswordStep}</p>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
              <input
                type="password"
                autoComplete="new-password"
                className="input-premium pl-10 w-full"
                placeholder={r.newPassword}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
              <input
                type="password"
                autoComplete="new-password"
                className="input-premium pl-10 w-full"
                placeholder={r.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitPassword()}
              />
            </div>
            <Button className="w-full" onClick={submitPassword} disabled={loading}>
              {loading ? r.saving : r.savePassword}
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
            <p className="font-display text-lg text-glow">{r.successTitle}</p>
            <p className="text-sm text-bm-muted">{r.successDesc}</p>
            <Button className="w-full" onClick={onSuccess}>
              {r.loginNow}
            </Button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-bm-red text-center">{error}</p>}
      </div>
    </div>
  );
}
