export function GET() {
  const body = "google-site-verification: googleecfd58242e453c26.html";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
