import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { blogPostingSchema } from "@/lib/seo-structured-data";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    absoluteTitle: true,
    openGraphType: "article",
    publishedTime: post.date,
    modifiedTime: post.updatedAt ?? post.date,
    ogImageAlt: `${post.title} — BESS MOTORS`,
    keywords: [post.title, "BESS MOTORS", "serwis samochodowy Warszawa", "porady"],
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const updated = post.updatedAt ?? post.date;

  return (
    <>
      <StructuredData data={blogPostingSchema(post)} />
      <article className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
        <nav aria-label="Breadcrumb" className="text-sm text-bm-muted">
          <Link href="/" className="hover:text-bm-red">
            Strona główna
          </Link>
          {" · "}
          <Link href="/blog" className="hover:text-bm-red">
            Blog
          </Link>
        </nav>
        <p className="text-xs text-bm-muted mt-4">
          <time dateTime={post.date}>{post.date}</time>
          {updated !== post.date ? (
            <>
              {" · "}
              aktualizacja <time dateTime={updated}>{updated}</time>
            </>
          ) : null}
        </p>
        <h1 className="font-display text-3xl uppercase text-glow mt-2">{post.title}</h1>
        <p className="text-bm-muted mt-6 leading-relaxed whitespace-pre-line">{post.body}</p>

        {post.relatedHrefs?.length ? (
          <section className="mt-10 border-t border-bm-border/50 pt-6" aria-labelledby="related-services">
            <h2 id="related-services" className="font-display text-sm uppercase text-bm-red mb-3">
              Powiązane usługi
            </h2>
            <ul className="flex flex-wrap gap-2">
              {post.relatedHrefs.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-lg border border-bm-border/60 px-3 py-2 text-sm text-bm-silver hover:border-bm-red/40 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-10 flex flex-wrap gap-3">
          <Link href="/booking" className="btn-primary inline-flex text-sm">
            Umów wizytę online
          </Link>
          <Link href="/contacts" className="btn-outline inline-flex text-sm">
            Kontakt
          </Link>
        </p>
      </article>
    </>
  );
}
