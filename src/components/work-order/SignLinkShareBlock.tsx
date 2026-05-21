"use client";

import { useState, useCallback } from "react";
import { Link2, Copy, Check, MessageSquare, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder, User } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import {
  buildShareMessage,
  getSignUrl,
  smsShareUrl,
} from "@/lib/work-order-share";

interface Props {
  order: WorkOrder;
  client: User;
  /** Compact row in table */
  inline?: boolean;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function SignLinkShareBlock({ order, client, inline }: Props) {
  const { t, locale } = useI18n();
  const d = t.document;
  const lang = locale === "ru" || locale === "uk" ? "ru" : "pl";
  const signUrl = getSignUrl(order.id);
  const smsText = buildShareMessage(order, client, lang);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);

  const flash = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const onCopyLink = useCallback(async () => {
    if (await copyText(signUrl)) flash(setCopiedLink);
  }, [signUrl]);

  const onCopySms = useCallback(async () => {
    if (await copyText(smsText)) flash(setCopiedSms);
  }, [smsText]);

  if (inline) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          title={d.copySignLink}
          onClick={(e) => {
            e.stopPropagation();
            onCopyLink();
          }}
          className="p-2 rounded-lg text-bm-red hover:bg-bm-red/20 transition-colors"
        >
          {copiedLink ? <Check size={16} /> : <Link2 size={16} />}
        </button>
        <a
          href={smsShareUrl(client.phone, smsText)}
          title={d.sendSms}
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-lg text-bm-muted hover:text-white hover:bg-white/10 transition-colors"
        >
          <Smartphone size={16} />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-bm-red/40 bg-bm-red/5 p-4 neon-border space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-5 h-5 text-bm-red shrink-0" />
        <div>
          <h4 className="font-display text-sm font-bold uppercase text-bm-red">{d.signLinkTitle}</h4>
          <p className="text-[10px] text-bm-muted mt-0.5">{d.signLinkHint}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          readOnly
          value={signUrl}
          className="input-premium text-xs font-mono flex-1 py-2 bg-bm-black/50"
          onFocus={(e) => e.target.select()}
        />
        <Button type="button" className="text-xs shrink-0" onClick={onCopyLink}>
          {copiedLink ? <Check size={14} /> : <Copy size={14} />}
          {copiedLink ? d.copied : d.copySignLink}
        </Button>
      </div>

      <p className="text-[10px] text-bm-muted">
        {d.clientPhone}: <span className="font-mono text-white">{client.phone}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="text-xs" onClick={onCopySms}>
          {copiedSms ? <Check size={14} /> : <MessageSquare size={14} />}
          {copiedSms ? d.copied : d.copySmsText}
        </Button>
        <a
          href={smsShareUrl(client.phone, smsText)}
          className="btn-outline text-xs inline-flex items-center gap-1"
        >
          <Smartphone size={14} /> {d.sendSms}
        </a>
      </div>

      <details className="text-[10px] text-bm-muted">
        <summary className="cursor-pointer hover:text-bm-red">{d.previewSms}</summary>
        <pre className="mt-2 p-2 rounded bg-bm-black/60 whitespace-pre-wrap font-sans text-white/80">
          {smsText}
        </pre>
      </details>
    </div>
  );
}
