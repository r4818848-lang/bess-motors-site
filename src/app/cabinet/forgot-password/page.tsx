"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { useI18n } from "@/lib/i18n/context";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="pt-28 pb-20 min-h-[70vh] px-4">
      <div className="mx-auto max-w-md">
        <ForgotPasswordFlow
          onBack={() => router.push("/cabinet")}
          onSuccess={() => router.push("/cabinet")}
        />
        <Link
          href="/cabinet"
          className="block text-center text-sm text-bm-muted hover:text-bm-red mt-6"
        >
          ← {t.passwordReset.backToLogin}
        </Link>
      </div>
    </div>
  );
}
