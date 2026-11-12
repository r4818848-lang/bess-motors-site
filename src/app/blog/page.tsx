import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog — porady serwisowe Warszawa",
  description:
    "Porady BESS MOTORS Warszawa: wymiana oleju, Check Engine, hamulce i opony. Warsztat Włochy, Aleja Krakowska 48/52.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <div className="pt-28 pb-20 px-4 max-w-5xl mx-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bm-red">BESS MOTORS</p>
      <h1 className="mt-3 font-display text-4xl uppercase text-white">Blog</h1>
      <div className="mt-4 h-1 w-16 bg-bm-red" />
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {blogPosts.map((p) => (
          <li key={p.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs uppercase tracking-wide text-bm-muted">{p.date}</p>
            <h2 className="mt-2 font-display text-xl text-white">
              <Link href={`/blog/${p.slug}`} className="hover:text-bm-red">
                {p.title}
              </Link>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-bm-muted">{p.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
