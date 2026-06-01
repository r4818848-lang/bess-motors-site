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
        </p>
        <h1 className="font-display text-3xl uppercase text-glow mt-2">{post.title}</h1>
        <p className="text-bm-muted mt-6 leading-relaxed whitespace-pre-line">{post.body}</p>
        <p className="mt-10">
          <Link href="/booking" className="btn-primary inline-flex text-sm">
            Umów wizytę online
          </Link>
        </p>
      </article>
    </>
  );
}
