"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  height?: number;
}

export function SignaturePad({ onChange, height = 180 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  useEffect(() => {
    const pack = getCtx();
    if (!pack) return;
    const { canvas, ctx } = pack;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#e10600";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, rect.width, height);
  }, [getCtx, height]);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const { ctx } = getCtx()!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { canvas, ctx } = getCtx()!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasStroke(true);
    onChange(canvas.toDataURL("image/png"));
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const pack = getCtx();
    if (!pack) return;
    const { canvas, ctx } = pack;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, rect.width, height);
    setHasStroke(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border-2 border-bm-red/40 cursor-crosshair touch-none neon-border"
        style={{ height }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <Button type="button" variant="outline" className="text-xs" onClick={clear}>
        <Eraser size={14} /> Clear
      </Button>
      {!hasStroke && (
        <p className="text-[10px] text-bm-muted text-center">Sign with finger, mouse or stylus</p>
      )}
    </div>
  );
}
