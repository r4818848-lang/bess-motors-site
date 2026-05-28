"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/session-context";
import { loadDb } from "@/lib/store";
import { ensureReferralCode } from "@/lib/referral-code";
import {
  REFERRAL_QUALIFIED_REQUIRED,
  REFERRAL_REWARD_DISCOUNT_PERCENT,
} from "@/lib/referral-system";
import { getSiteUrl } from "@/lib/seo";

export default function ReferralPage() {
  const { locale } = useI18n();
  const { clientUser: user } = useAuth();
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (!user) return;
    const db = loadDb();
    const u = db.users.find((x) => x.id === user.id);
    if (!u) return;
    const c = ensureReferralCode(u, db);
    setCode(c);
    const base = typeof window !== "undefined" ? window.location.origin : getSiteUrl();
    setLink(`${base}/cabinet?ref=${encodeURIComponent(c)}`);
  }, [user]);

  const title =
    locale === "ru"
      ? "Приведи друга"
      : locale === "en"
        ? "Refer a friend"
        : "Poleć znajomego";

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="mx-auto max-w-lg px-4 text-center">
        <h1 className="font-display text-3xl font-bold uppercase text-glow">{title}</h1>
        <p className="text-bm-muted mt-4">
          {REFERRAL_QUALIFIED_REQUIRED}{" "}
          {locale === "ru" ? "друзей с оплаченным визитом →" : "friends →"}{" "}
          <b className="text-bm-red">{REFERRAL_REWARD_DISCOUNT_PERCENT}%</b>
        </p>
        {user && code ? (
          <div className="glass rounded-xl p-6 mt-8 text-left">
            <p className="text-xs text-bm-muted uppercase">Kod</p>
            <p className="font-mono text-xl text-bm-red font-bold">{code}</p>
            <p className="text-xs text-bm-muted uppercase mt-4">Link</p>
            <p className="text-sm break-all">{link}</p>
          </div>
        ) : (
          <Link href="/cabinet" className="btn-primary mt-8 inline-block">
            {locale === "ru" ? "Войти в кабинет" : locale === "en" ? "Sign in" : "Zaloguj się"}
          </Link>
        )}
        <Link href="/" className="block mt-8 text-sm text-bm-muted hover:text-bm-red">
          ←
        </Link>
      </div>
    </div>
  );
}
