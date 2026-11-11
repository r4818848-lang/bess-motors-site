import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listPublishedCases } from "@/lib/seo-growth/case-store";
import { caseTitle, serviceHref } from "@/lib/seo-growth/work-cases";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const published = await listPublishedCases();
  const index = published.ok && published.cases.length > 0;
  return {
    title: "Realizacje serwisu | BESS MOTORS",
    description: "Opublikowane naprawy warsztatu BESS MOTORS w Warszawie. Szkice nie są widoczne.",
    alternates: { canonical: "/realizacje" },
    robots: { index, follow: index },
  };
}

export default async function RealizacjePage() {
  const published = await listPublishedCases();
  if (!published.ok && published.error === "STORAGE_UNAVAILABLE") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-3xl uppercase">Realizacje</h1>
        <p className="mt-4">STORAGE_UNAVAILABLE</p>
      </main>
    );
  }
  if (!published.ok || published.cases.length === 0) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl uppercase">Realizacje</h1>
      <ul className="mt-8 space-y-8">
        {published.cases.map((story) => {
          const href = serviceHref(story.serviceId);
          return (
            <li key={story.id} className="border border-white/10 rounded-xl p-4">
              <h2 className="text-xl">
                <Link href={`/realizacje/${story.id}`}>{caseTitle(story)}</Link>
              </h2>
              <p className="mt-2 text-bm-muted">{story.workPl}</p>
              {href ? (
                <Link className="mt-3 inline-block text-bm-red" href={href}>
                  Powiązana usługa
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
