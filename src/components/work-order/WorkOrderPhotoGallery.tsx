"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, Camera } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { AttachedFile } from "@/lib/store";

interface Props {
  files: AttachedFile[];
  className?: string;
}

function byCategory(files: AttachedFile[], cats: AttachedFile["category"][]) {
  return files.filter(
    (f) => f.type === "image" && f.dataUrl && cats.includes(f.category)
  );
}

export function WorkOrderPhotoGallery({ files, className = "" }: Props) {
  const { t } = useI18n();
  const p = t.premiumWo;
  const [preview, setPreview] = useState<AttachedFile | null>(null);

  const before = byCategory(files, ["before"]);
  const after = byCategory(files, ["after"]);
  const other = files.filter(
    (f) =>
      f.type === "image" &&
      f.dataUrl &&
      f.category !== "before" &&
      f.category !== "after" &&
      f.category !== "internal"
  );

  const sections = [
    { key: "before", label: p.photosBefore, items: before },
    { key: "after", label: p.photosAfter, items: after },
    { key: "other", label: p.photosOther, items: other },
  ].filter((s) => s.items.length > 0);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  if (sections.length === 0) {
    return (
      <div
        className={`wo-premium-card border-dashed border-bm-border/60 text-center py-10 ${className}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <Camera className="w-10 h-10 text-bm-muted mx-auto mb-3 opacity-50" />
        <p className="text-sm text-bm-muted">{p.noPhotos}</p>
        <p className="text-[10px] text-bm-muted/70 mt-2">{p.dropHint}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="wo-premium-section-title mb-6">
        <Camera className="w-4 h-4 shrink-0" />
        {p.photosTitle}
      </h3>
      <div className="space-y-6">
        {sections.map((sec, si) => (
          <motion.div
            key={sec.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08 }}
          >
            <p className="text-[10px] uppercase tracking-widest text-bm-silver mb-3">
              {sec.label}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sec.items.map((f, i) => (
                <motion.button
                  key={f.id}
                  type="button"
                  className="wo-premium-photo-frame group text-left"
                  onClick={() => setPreview(f)}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ scale: 1.03 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.dataUrl}
                    alt={f.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                    <span className="text-[9px] text-white truncate max-w-[70%]">
                      {f.name}
                    </span>
                    <ZoomIn className="w-4 h-4 text-bm-red shrink-0" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {preview?.dataUrl && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/92 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-white hover:text-bm-red z-10"
              onClick={() => setPreview(null)}
            >
              <X size={28} />
            </button>
            <motion.div
              className="relative max-w-5xl max-h-[90vh] w-full rounded-2xl overflow-hidden neon-border"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.dataUrl}
                alt={preview.name}
                className="w-full h-auto max-h-[85vh] object-contain bg-bm-black"
              />
              <p className="absolute bottom-0 left-0 right-0 py-3 px-4 text-center text-xs text-bm-silver bg-gradient-to-t from-black to-transparent">
                {preview.name} · {p.fullscreen}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
