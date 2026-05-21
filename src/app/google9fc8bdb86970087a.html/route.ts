/** Google Search Console — plain response for crawler (no app layout) */
export function GET() {
  const body = "google-site-verification: google9fc8bdb86970087a.html";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
