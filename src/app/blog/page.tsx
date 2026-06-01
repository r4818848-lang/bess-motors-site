import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog — porady serwisowe",
  description:
    "Porady BESS MOTORS: wymiana oleju, check engine, geometria kół, chip tuning, program poleceń. Serwis samochodowy Warszawa.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl uppercase text-glow mb-8">Blog</h1>
      <ul className="space-y-6">
        {blogPosts.map((p) => (
          <li key={p.slug} className="glass rounded-xl p-6">
            <p className="text-xs text-bm-muted">{p.date}</p>
            <h2 className="font-display text-xl mt-1">
              <Link href={`/blog/${p.slug}`} className="hover:text-bm-red">
                {p.title}
              </Link>
            </h2>
            <p className="text-bm-muted text-sm mt-2">{p.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
