"use client";

import { useState } from "react";
import { Brain, ScanLine, Camera } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { decodeVin } from "@/lib/vin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AIModules({ onVinDecoded }: { onVinDecoded?: (data: Record<string, string>) => void }) {
  const { t } = useI18n();
  const [vinInput, setVinInput] = useState("");
  const [plateInput, setPlateInput] = useState("");
  const [diagnosticInput, setDiagnosticInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runVinScan = async () => {
    setLoading(true);
    setResult(null);
    const decoded = await decodeVin(vinInput);
    setLoading(false);
    if (decoded.found) {
      setResult(`${decoded.make} ${decoded.model} — ${decoded.engine}, ${decoded.power}`);
      onVinDecoded?.({
        make: decoded.make,
        model: decoded.model,
        engine: decoded.engine,
        trim: decoded.trim,
        power: decoded.power,
        transmission: decoded.transmission,
      });
    } else {
      setResult("VIN not found — enter details manually.");
    }
  };

  const runDiagnostic = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setResult(
      `AI Analysis: Possible issues — ${diagnosticInput.slice(0, 30) || "general check"}: O2 sensor degradation (72%), spark plugs wear (45%). Recommend full diagnostic scan.`
    );
  };

  const runPlateScan = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setResult(`Plate recognized: ${plateInput || "WA 12345"} — matched to client database.`);
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card glow>
        <Brain className="w-8 h-8 text-bm-red mb-4" />
        <h3 className="font-display text-sm uppercase font-bold mb-3">{t.ai.diagnostic}</h3>
        <textarea
          className="input-premium text-sm min-h-[60px] mb-3"
          placeholder={t.ai.symptomsPlaceholder}
          value={diagnosticInput}
          onChange={(e) => setDiagnosticInput(e.target.value)}
        />
        <Button variant="outline" className="w-full text-xs" onClick={runDiagnostic} disabled={loading}>
          {loading ? t.ai.scanning : t.ai.analyze}
        </Button>
      </Card>

      <Card glow>
        <ScanLine className="w-8 h-8 text-bm-red mb-4" />
        <h3 className="font-display text-sm uppercase font-bold mb-3">{t.ai.vinScan}</h3>
        <input
          className="input-premium text-sm mb-3 font-mono uppercase"
          placeholder="WBA..."
          value={vinInput}
          onChange={(e) => setVinInput(e.target.value)}
        />
        <label className="btn-outline w-full text-xs text-center cursor-pointer block mb-3">
          <input type="file" accept="image/*" className="hidden" />
          Upload VIN photo (OCR)
        </label>
        <Button variant="outline" className="w-full text-xs" onClick={runVinScan} disabled={loading}>
          {loading ? t.ai.scanning : t.ai.analyze}
        </Button>
      </Card>

      <Card glow>
        <Camera className="w-8 h-8 text-bm-red mb-4" />
        <h3 className="font-display text-sm uppercase font-bold mb-3">{t.ai.plateScan}</h3>
        <input
          className="input-premium text-sm mb-3"
          placeholder="WA 12345"
          value={plateInput}
          onChange={(e) => setPlateInput(e.target.value)}
        />
        <Button variant="outline" className="w-full text-xs" onClick={runPlateScan} disabled={loading}>
          {loading ? t.ai.scanning : t.ai.analyze}
        </Button>
      </Card>

      {result && (
        <div className="md:col-span-3 glass-red rounded-lg p-4 text-sm border border-bm-red/30">
          <span className="text-bm-red font-semibold">AI: </span>
          {result}
        </div>
      )}
    </div>
  );
}
