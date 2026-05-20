"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CabinetError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pt-28 pb-20 min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center glass-red rounded-2xl p-8">
        <h1 className="font-display text-xl font-bold uppercase text-bm-red mb-4">
          Ошибка кабинета
        </h1>
        <p className="text-sm text-bm-muted mb-6">
          Попробуйте обновить страницу. Если не помогло — очистите данные сайта в браузере и
          войдите снова.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={reset}>Повторить</Button>
          <Link href="/cabinet" className="btn-outline text-sm">
            На страницу входа
          </Link>
          <Link href="/" className="text-xs text-bm-muted hover:text-bm-red">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
