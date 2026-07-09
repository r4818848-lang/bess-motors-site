import fs from "node:fs";
import path from "node:path";

const dir =
  process.argv[2] ??
  "C:/Users/Asus/.cursor/projects/c-Users-Asus-Desktop-website-bess-motors/agent-tools";

function decodeUnicode(s) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function extractFromHtml(html, label) {
  const reviewId =
    html.match(/Ci9DQUlRQUNvZENodHljRjlv[A-Za-z0-9_-]+/)?.[0] ?? null;
  const photos = [
    ...html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/[^"\\]+/g),
  ].map((m) => m[0]);

  const texts = new Set();
  for (const m of html.matchAll(/"((?:[^"\\]|\\.){8,800})"/g)) {
    const raw = decodeUnicode(m[1]);
    if (
      /[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\u0400-\u04FF]/.test(raw) &&
      !/google|maps|http|function|null|undefined|rgba|gstatic|signature|AIza/i.test(
        raw
      ) &&
      raw.length >= 12
    ) {
      texts.add(raw);
    }
  }

  const sorted = [...texts].sort((a, b) => b.length - a.length);
  console.log(`\n=== ${label} ===`);
  console.log("reviewId:", reviewId);
  console.log("photos:", photos.slice(0, 4));
  console.log("top strings:");
  for (const t of sorted.slice(0, 15)) {
    console.log(" -", t.slice(0, 200));
  }
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.startsWith("greview") && f.endsWith(".html"))
  .sort();

for (const file of files) {
  const html = fs.readFileSync(path.join(dir, file), "utf8");
  extractFromHtml(html, file);
}
