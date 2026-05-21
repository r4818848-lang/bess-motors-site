"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Eraser } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  height?: number;
}

export function SignaturePad({ onChange, height = 200 }: SignaturePadProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasStroke, setHasStroke] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  const initCanvas = useCallback(() => {
    const pack = getCtx();
    if (!pack) return;
    const { canvas, ctx } = pack;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "#e10600";
    ctx.lineWidth = 2.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const grad = ctx.createLinearGradient(0, 0, rect.width, height);
    grad.addColorStop(0, "#0d0d0d");
    grad.addColorStop(1, "#141414");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, height);
    ctx.strokeStyle = "#e10600";
  }, [getCtx, height]);

  useEffect(() => {
    initCanvas();
    const onResize = () => initCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initCanvas]);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const emitChange = () => {
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  };

  const drawSmooth = (x: number, y: number) => {
    const pack = getCtx();
    if (!pack) return;
    const { ctx } = pack;
    const last = lastPoint.current;
    if (last) {
      const midX = (last.x + x) / 2;
      const midY = (last.y + y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, midX, midY);
      ctx.stroke();
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastPoint.current = { x, y };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const { ctx } = getCtx()!;
    const p = pos(e);
    lastPoint.current = p;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = pos(e);
    drawSmooth(p.x, p.y);
    setHasStroke(true);
    emitChange();
  };

  const end = () => {
    if (drawing.current && hasStroke) emitChange();
    drawing.current = false;
    lastPoint.current = null;
    const pack = getCtx();
    if (pack) pack.ctx.beginPath();
  };

  const clear = () => {
    initCanvas();
    setHasStroke(false);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl border-2 border-bm-red/50 neon-border overflow-hidden bg-bm-black/80 backdrop-blur-sm">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-bm-red/5 to-transparent" />
        <p className="absolute top-2 left-3 text-[10px] uppercase tracking-widest text-bm-muted z-10">
          {t.signature.signHere}
        </p>
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none relative z-[1]"
          style={{ height }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" className="text-xs" onClick={clear}>
          <Eraser size={14} /> {t.signature.clearPad}
        </Button>
        {!hasStroke && (
          <p className="text-[10px] text-bm-muted text-center flex-1">
            {t.signature.touchHint}
          </p>
        )}
      </div>
    </div>
  );
}
