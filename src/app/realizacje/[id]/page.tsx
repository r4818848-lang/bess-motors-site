import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCase } from "@/lib/seo-growth/case-store";
import { caseTitle, isPublicCase, serviceHref } from "@/lib/seo-growth/work-cases";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const loaded = await getCase(id);
  const story = loaded.ok ? loaded.story : null;
  if (!story || !isPublicCase(story)) return { robots: { index: false, follow: false } };
  const title = caseTitle(story);
  const description = `${story.problemPl} ${story.workPl}`.replace(/\s+/g, " ").slice(0, 160);
  const photo = story.photoIds[0];
  const image = photo ? `${getSiteUrl()}/realizacje/${story.id}/photo/${photo}` : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/realizacje/${story.id}` },
    openGraph: { title, description, images: image ? [image] : undefined },
    robots: { index: true, follow: true },
  };
}

export default async function RealizacjaPage({ params }: Params) {
  const { id } = await params;
  const loaded = await getCase(id);
  if (!loaded.ok && loaded.error === "STORAGE_UNAVAILABLE") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-3xl uppercase">Realizacje</h1>
        <p>STORAGE_UNAVAILABLE</p>
      </main>
    );
  }
  const story = loaded.ok ? loaded.story : null;
  if (!story || !isPublicCase(story)) notFound();
  const href = serviceHref(story.serviceId);
  const title = caseTitle(story);
  const photo = story.photoIds[0];
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl uppercase">{title}</h1>
      {photo ? (
        <Image
          className="mt-6 w-full rounded-xl"
          src={`/realizacje/${story.id}/photo/${photo}`}
          alt={title}
          width={1200}
          height={800}
          unoptimized
        />
      ) : null}
      <h2 className="mt-8 text-lg">Problem</h2>
      <p>{story.problemPl}</p>
      <h2 className="mt-6 text-lg">Diagnostyka</h2>
      <p>{story.diagnosisPl}</p>
      <h2 className="mt-6 text-lg">Wykonane prace</h2>
      <p>{story.workPl}</p>
      {story.notesPl ? (
        <>
          <h2 className="mt-6 text-lg">Uwagi</h2>
          <p>{story.notesPl}</p>
        </>
      ) : null}
      {story.year || story.engine || story.generation ? (
        <p className="mt-6 text-sm text-bm-muted">
          {[story.generation, story.year, story.engine].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {href ? (
        <Link className="mt-8 inline-block text-bm-red" href={href}>
          Powiązana usługa
        </Link>
      ) : null}
    </main>
  );
}
