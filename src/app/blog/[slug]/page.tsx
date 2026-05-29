import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPost } from "@/lib/blog-posts";

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
  return { title: `${post.title} — BESS MOTORS`, description: post.excerpt };
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
    <article className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <Link href="/blog" className="text-sm text-bm-muted hover:text-bm-red">
        ← Blog
      </Link>
      <p className="text-xs text-bm-muted mt-4">{post.date}</p>
      <h1 className="font-display text-3xl uppercase text-glow mt-2">{post.title}</h1>
      <p className="text-bm-muted mt-6 leading-relaxed whitespace-pre-line">{post.body}</p>
    </article>
  );
}
