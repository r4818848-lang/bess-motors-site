"use client";

import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  return (
    <div
      className="flex items-center justify-center px-4 py-16 grid-bg"
      style={{ minHeight: "calc(100vh - 12rem)" }}
    >
      <PhoneAuthForm variant="crm" onSuccess={(role) => role === "admin" && onSuccess()} />
    </div>
  );
}
