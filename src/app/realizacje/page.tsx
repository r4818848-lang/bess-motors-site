import { notFound } from "next/navigation";
import { publishedWorkStories } from "@/lib/work-stories";

/** Public only after a real job is marked published. Drafts stay out of the sitemap. */
export default function RealizacjePage() {
  const stories = publishedWorkStories();
  if (stories.length === 0) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl uppercase">Realizacje</h1>
      <ul className="mt-8 space-y-8">
        {stories.map((story) => (
          <li key={story.id} className="border border-white/10 rounded-xl p-4">
            <h2 className="text-xl">{story.titlePl}</h2>
            <p className="mt-2 text-bm-muted">{story.repairPl}</p>
            <a className="mt-3 inline-block text-bm-red" href={story.serviceHref}>
              Powiązana usługa
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
