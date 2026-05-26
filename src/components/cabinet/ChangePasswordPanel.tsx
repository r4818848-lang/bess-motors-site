"use client";

import { useState } from "react";
import { Car, KeyRound } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { saveClientCredentials } from "@/lib/client-credentials";
import { localChangeClientPassword } from "@/lib/client-portal";
import { Button } from "@/components/ui/Button";

type Props = {
  userId: string;
  phone: string;
};

export function ChangePasswordPanel({ userId, phone }: Props) {
  const { t } = useI18n();
  const c = t.cabinet;
  const [currentPlate, setCurrentPlate] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [confirmPlate, setConfirmPlate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPlate.trim().length < 2) {
      setError(t.auth.plateRequired);
      return;
    }
    if (newPlate.trim() !== confirmPlate.trim()) {
      setError(c.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("bess-jwt") : null;

      if (token) {
        const res = await fetch("/api/client-portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "change-password",
            currentPlate: currentPlate.trim(),
            newPlate: newPlate.trim(),
            confirmPlate: confirmPlate.trim(),
          }),
        });

        if (res.ok) {
          saveClientCredentials(phone, newPlate.trim());
          await localChangeClientPassword(userId, currentPlate.trim(), newPlate.trim());
          setSuccess(true);
          setCurrentPlate("");
          setNewPlate("");
          setConfirmPlate("");
          return;
        }

        const data = (await res.json()) as { error?: string };
        if (data.error === "password_mismatch") {
          setError(c.passwordMismatch);
          return;
        }
        if (data.error === "invalid_current") {
          setError(c.passwordWrong);
          return;
        }
        if (res.status === 503) {
          const local = await localChangeClientPassword(
            userId,
            currentPlate.trim(),
            newPlate.trim()
          );
          if (local === "ok") {
            saveClientCredentials(phone, newPlate.trim());
            setSuccess(true);
            setCurrentPlate("");
            setNewPlate("");
            setConfirmPlate("");
            return;
          }
          if (local === "invalid_current") {
            setError(c.passwordWrong);
            return;
          }
        }
        setError(c.passwordChangeFailed);
        return;
      }

      const local = await localChangeClientPassword(
        userId,
        currentPlate.trim(),
        newPlate.trim()
      );
      if (local === "ok") {
        saveClientCredentials(phone, newPlate.trim());
        setSuccess(true);
        setCurrentPlate("");
        setNewPlate("");
        setConfirmPlate("");
        return;
      }
      if (local === "invalid_current") {
        setError(c.passwordWrong);
        return;
      }
      setError(c.passwordChangeFailed);
    } catch {
      setError(c.passwordChangeFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-red rounded-xl p-6 neon-border max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="w-5 h-5 text-bm-red" />
        <h2 className="font-display text-lg uppercase">{c.changePassword}</h2>
      </div>
      <p className="text-xs text-bm-muted mb-4">{c.changePasswordHint}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="text-[10px] uppercase text-bm-muted block">{c.currentPassword}</label>
        <div className="relative">
          <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted" />
          <input
            type="text"
            autoCapitalize="characters"
            required
            className="input-premium pl-10 w-full font-mono"
            value={currentPlate}
            onChange={(e) => setCurrentPlate(e.target.value)}
            placeholder={c.registrationPlate}
          />
        </div>

        <label className="text-[10px] uppercase text-bm-muted block pt-2">{c.newPassword}</label>
        <input
          type="text"
          autoCapitalize="characters"
          required
          className="input-premium w-full font-mono"
          value={newPlate}
          onChange={(e) => setNewPlate(e.target.value)}
          placeholder={c.registrationPlate}
        />

        <label className="text-[10px] uppercase text-bm-muted block">{c.confirmPassword}</label>
        <input
          type="text"
          autoCapitalize="characters"
          required
          className="input-premium w-full font-mono"
          value={confirmPlate}
          onChange={(e) => setConfirmPlate(e.target.value)}
          placeholder={c.registrationPlate}
        />

        {error && <p className="text-sm text-bm-red">{error}</p>}
        {success && <p className="text-sm text-green-500">{c.passwordChanged}</p>}

        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? t.auth.loading : c.savePassword}
        </Button>
      </form>
    </div>
  );
}
