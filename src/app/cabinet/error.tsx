"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/context";

export default function CabinetError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  const c = t.cabinet;

  return (
    <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center glass-red rounded-2xl p-8">
        <h1 className="font-display text-xl font-bold uppercase text-bm-red mb-4">
          {c.errorTitle}
        </h1>
        <p className="text-sm text-bm-muted mb-6">{c.errorDesc}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={reset}>{c.errorRetry}</Button>
          <Link href="/cabinet" className="btn-outline text-sm">
            {c.errorLoginLink}
          </Link>
          <Link href="/" className="text-xs text-bm-muted hover:text-bm-red">
            {c.errorHomeLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
