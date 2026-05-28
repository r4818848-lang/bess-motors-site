"use client";

import { useState } from "react";
import type { PublicGalleryItem } from "@/app/api/gallery/route";

export function GalleryBeforeAfter({ items }: { items: PublicGalleryItem[] }) {
  const pairs = items.filter((i) => i.beforeUrl && i.afterUrl).slice(0, 12);
  const [idx, setIdx] = useState(0);
  if (!pairs.length) return null;

  const item = pairs[idx]!;

  return (
    <div className="mt-12">
      <h2 className="font-display text-xl uppercase mb-4">Before / After</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="relative aspect-video rounded-xl overflow-hidden border border-bm-border/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.beforeUrl} alt="Before" className="object-cover w-full h-full" />
          <span className="absolute top-2 left-2 text-xs bg-black/70 px-2 py-1 rounded">Before</span>
        </div>
        <div className="relative aspect-video rounded-xl overflow-hidden border border-bm-border/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.afterUrl} alt="After" className="object-cover w-full h-full" />
          <span className="absolute top-2 left-2 text-xs bg-black/70 px-2 py-1 rounded">After</span>
        </div>
      </div>
      {pairs.length > 1 ? (
        <div className="flex gap-2 mt-4 justify-center">
          <button type="button" className="btn-outline text-sm" onClick={() => setIdx((i) => (i - 1 + pairs.length) % pairs.length)}>
            ←
          </button>
          <span className="text-sm text-bm-muted self-center">
            {idx + 1}/{pairs.length}
          </span>
          <button type="button" className="btn-outline text-sm" onClick={() => setIdx((i) => (i + 1) % pairs.length)}>
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
