import { Suspense } from "react";
import GalleryPageClient from "./GalleryPageClient";

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-28 pb-20 text-center text-bm-muted animate-pulse">…</div>
      }
    >
      <GalleryPageClient />
    </Suspense>
  );
}
