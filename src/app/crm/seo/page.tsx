"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth";
import { CASE_SERVICES } from "@/lib/seo-growth/work-cases";
import type { PanelSnapshot } from "@/lib/seo-growth/panel";

type Payload = {
  storage: string;
  snapshot: PanelSnapshot;
  weekly: { measured: string[]; hypotheses: string[] };
  cases: { id: string; version: number; status: string; make: string; model: string; workPl: string; photoIds: string[] }[] | null;
};

function token(): string {
  return localStorage.getItem("bess-jwt") ?? "";
}

export default function SeoControlPage() {
  const [allowed, setAllowed] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const draftKey = useRef("");
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    make: "",
    model: "",
    problemPl: "",
    diagnosisPl: "",
    workPl: "",
    serviceId: "tires",
  });

  async function load() {
    const res = await fetch("/api/internal/seo", { headers: { authorization: `Bearer ${token()}` } });
    if (!res.ok) {
      setError(res.status === 401 || res.status === 403 ? "Brak dostępu." : "UNAVAILABLE");
      return;
    }
    setData((await res.json()) as Payload);
  }

  useEffect(() => {
    const ok = isAdminAuthenticated();
    setAllowed(ok);
    if (ok) void load();
  }, []);

  async function createDraft(event: FormEvent) {
    event.preventDefault();
    if (!draftKey.current) draftKey.current = crypto.randomUUID();
    const res = await fetch("/api/internal/seo/cases", {
      method: "POST",
      headers: { authorization: `Bearer ${token()}`, "content-type": "application/json", "idempotency-key": draftKey.current },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError("Szkic odrzucony. Sprawdź, czy nie ma telefonu, VIN albo tablicy.");
      return;
    }
    setError("");
    draftKey.current = "";
    await load();
  }

  if (!allowed) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24">
        <h1 className="text-2xl">SEO</h1>
        <p className="mt-4">Panel jest tylko dla zalogowanego właściciela.</p>
        <Link className="mt-4 inline-block text-bm-red" href="/cabinet">
          Logowanie
        </Link>
      </main>
    );
  }

  const snapshot = data?.snapshot;
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl uppercase">SEO</h1>
      <p className="mt-2">Katalog napraw: {data?.storage ?? "STORAGE_NOT_CONFIGURED"}</p>
      <p className="mt-2 text-sm text-bm-muted">
        Liczby poniżej są z importu albo mają status NO_DATA. Rekomendacje nie zmieniają strony.
      </p>
      {error ? <p className="mt-4 text-bm-red">{error}</p> : null}
      {snapshot ? (
        <section className="mt-8 space-y-2">
          <h2 className="text-lg">Pomiary</h2>
          <p>Search Console: {snapshot.searchConsole.status}</p>
          <p>Kliknięcia: {snapshot.searchConsole.clicks.status === "MEASURED" ? snapshot.searchConsole.clicks.value : "NO_DATA"}</p>
          <p>Wyświetlenia: {snapshot.searchConsole.impressions.status === "MEASURED" ? snapshot.searchConsole.impressions.value : "NO_DATA"}</p>
          <p>CTR: {snapshot.searchConsole.ctr.status === "MEASURED" ? snapshot.searchConsole.ctr.value : "NO_DATA"}</p>
          <p>Pozycja: {snapshot.searchConsole.position.status === "MEASURED" ? snapshot.searchConsole.position.value : "NO_DATA"}</p>
          <p>Zapisy: NO_DATA</p>
          <p>Google Business Profile API: {snapshot.gbp.api}</p>
          <p>Pozycja Maps: {snapshot.gbp.mapsRank}</p>
          <p>
            Kolejka: {snapshot.queue ? `szkice ${snapshot.queue.drafts}, recenzja ${snapshot.queue.review}, zatwierdzone ${snapshot.queue.approved}, opublikowane ${snapshot.queue.published}` : snapshot.caseStorage}
          </p>
          <h2 className="pt-4 text-lg">Błędy integracji</h2>
          <ul>
            {snapshot.integrationErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2 className="pt-4 text-lg">Raport tygodnia</h2>
          <ul>
            {data?.weekly.measured.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2 className="pt-4 text-lg">Rekomendacje, nie pomiary</h2>
          <ul>
            {data?.weekly.hypotheses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <form className="mt-10 space-y-3" onSubmit={createDraft}>
        <h2 className="text-lg">Nowy szkic naprawy</h2>
        <input className="w-full rounded border border-white/20 bg-transparent p-2" placeholder="Marka" value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} />
        <input className="w-full rounded border border-white/20 bg-transparent p-2" placeholder="Model" value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
        <textarea className="w-full rounded border border-white/20 bg-transparent p-2" placeholder="Problem" value={form.problemPl} onChange={(event) => setForm({ ...form, problemPl: event.target.value })} />
        <textarea className="w-full rounded border border-white/20 bg-transparent p-2" placeholder="Diagnostyka" value={form.diagnosisPl} onChange={(event) => setForm({ ...form, diagnosisPl: event.target.value })} />
        <textarea className="w-full rounded border border-white/20 bg-transparent p-2" placeholder="Wykonane prace" value={form.workPl} onChange={(event) => setForm({ ...form, workPl: event.target.value })} />
        <select className="w-full rounded border border-white/20 bg-transparent p-2" value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })}>
          {CASE_SERVICES.map((service) => (
            <option key={service.id} value={service.id}>
              {service.labelPl}
            </option>
          ))}
        </select>
        <button className="btn-primary" type="submit" disabled={data?.storage !== "READY"}>
          Zapisz szkic
        </button>
      </form>
      <ul className="mt-8 space-y-4">
        {(data?.cases ?? []).map((story) => (
          <li key={story.id} className="rounded border border-white/10 p-3">
            <p>
              {story.status}: {story.make} {story.model} — {story.workPl}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["review", "approved", "published", "archived", "draft"] as const).map((to) => (
                <button
                  key={to}
                  className="btn-outline"
                  type="button"
                  onClick={async () => {
                    await fetch("/api/internal/seo/cases", {
                      method: "POST",
                      headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
                      body: JSON.stringify({ id: story.id, to, version: story.version }),
                    });
                    await load();
                  }}
                >
                  {to}
                </button>
              ))}
              <label className="text-sm">
                Zdjęcie
                <input
                  className="ml-2"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const body = new FormData();
                    body.set("caseId", story.id);
                    body.set("version", String(story.version));
                    body.set("file", file);
                    await fetch("/api/internal/seo/media", {
                      method: "POST",
                      headers: { authorization: `Bearer ${token()}` },
                      body,
                    });
                    await load();
                  }}
                />
              </label>
              <label className="text-sm">
                <input
                  className="mr-2"
                  type="checkbox"
                  checked={confirmed[story.id] === true}
                  onChange={(event) => setConfirmed({ ...confirmed, [story.id]: event.target.checked })}
                />
                Potwierdzam, że na zdjęciu nie widać tablic, twarzy ani VIN
              </label>
              <button
                className="btn-outline"
                type="button"
                disabled={confirmed[story.id] !== true || story.photoIds.length === 0}
                onClick={async () => {
                  await fetch("/api/internal/seo/cases", {
                    method: "POST",
                    headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
                    body: JSON.stringify({ id: story.id, photoId: story.photoIds[0], version: story.version }),
                  });
                  await load();
                }}
              >
                Zatwierdź zdjęcie
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
