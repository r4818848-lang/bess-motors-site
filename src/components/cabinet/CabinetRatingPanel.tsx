"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/lib/site";

export function CabinetRatingPanel({
  order,
  userId,
  clientName,
}: {
  order: WorkOrder;
  userId: string;
  clientName: string;
}) {
  const { t } = useI18n();
  const r = t.ratingPanel;
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  if (order.clientRating) return null;
  if (order.status !== "delivered" && !submitted) return null;

  const submit = async () => {
    if (stars < 1) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stars,
          comment,
          workOrderId: order.id,
          userId,
          clientName,
          source: "cabinet",
        }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-4 text-center space-y-3">
        <p className="text-bm-red text-sm">{r.thanks}</p>
        {stars >= 4 && (
          <a
            href={siteConfig.googleMapsReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs inline-block"
          >
            {r.googleReview}
          </a>
        )}
      </Card>
    );
  }

  if (order.status !== "delivered") return null;

  return (
    <Card glow className="p-5">
      <p className="font-display uppercase text-sm mb-3">{r.title}</p>
      <p className="text-xs text-bm-muted mb-3">{order.number}</p>
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            className="p-1"
            aria-label={`${n} stars`}
          >
            <Star
              className={`w-8 h-8 ${n <= stars ? "fill-bm-red text-bm-red" : "text-bm-muted"}`}
            />
          </button>
        ))}
      </div>
      <textarea
        className="input w-full text-sm mb-3 min-h-[72px]"
        placeholder="…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button type="button" className="btn-primary w-full text-sm" disabled={saving || stars < 1} onClick={submit}>
        {r.send}
      </button>
    </Card>
  );
}
