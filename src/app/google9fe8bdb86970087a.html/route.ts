/** Google Search Console verification — exact filename from GSC */
export function GET() {
  const body = "google-site-verification: google9fe8bdb86970087a.html";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
