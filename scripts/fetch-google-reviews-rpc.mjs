import fs from "node:fs";
import path from "node:path";

const dir =
  process.argv[2] ??
  "C:/Users/Asus/.cursor/projects/c-Users-Asus-Desktop-website-bess-motors/agent-tools";

const shareUrls = [
  "https://maps.app.goo.gl/EWjHxWy8ysroUAgGA",
  "https://maps.app.goo.gl/GZi2JAfCvATFZSnt6",
  "https://maps.app.goo.gl/ieZuDj2DxLCUD8tS7",
  "https://maps.app.goo.gl/XdZWAjFwqoUUbSyN8",
  "https://maps.app.goo.gl/mc724gWMcaZk2YeZ7",
  "https://maps.app.goo.gl/CFLgqYqKeCWEYtSEA",
];

const PLACE_ID = "0x0:0x684ee899c310ad45";

function decode(s) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  );
}

function extractPb(html) {
  const m = html.match(/\/maps\/timeline\/_rpc\/pc\?[^"']+/);
  if (!m) return null;
  return "https://www.google.com" + m[0].replace(/&amp;/g, "&");
}

function buildMapsUrl(reviewId) {
  return `https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1s${reviewId}!2m1!1s${PLACE_ID}!3m1!1s2@1:CAIQACodChtycF9oOmJSNVBFRWNCSVF4aUtVWWpGVXdLZUE%7C%7C?hl=pl`;
}

function isOwnerReply(text) {
  return /BessMotors|najlepszy serwis samochodowy|Z poważaniem|Zapraszamy ponownie/i.test(
    text
  );
}

function parseRpc(text, reviewId) {
  const authors = [
    ...text.matchAll(/\[\["([^"]{2,80})"\],"https:\/\/www\.google\.com\/maps\/contrib\//g),
  ].map((m) => m[1]);

  const profileMatch = text.match(
    /\["([^"]{2,80})","https:\/\/lh3\.googleusercontent\.com\/a\/[^"]+","https:\/\/www\.google\.com\/maps\/contrib\/[^"]+","[^"]+",null,\d+,\d+,null,\[1,\d+,\d+\],\d+/
  );

  const texts = [
    ...text.matchAll(/\[\["([^"]{12,2500})",null,\[0,\d+\]\]\]/g),
  ].map((m) => decode(m[1].replace(/\\n/g, "\n")));

  const customerTexts = texts.filter((t) => !isOwnerReply(t));
  const reviewText = customerTexts[0] ?? texts.find((t) => !isOwnerReply(t)) ?? "";

  const rel =
    text.match(/\[2026,\d+,\d+,\d+,null,null,null,null,\["([^"]+)"\]\]/)?.[1] ??
    text.match(/"(\d+[^"]*temu)"/)?.[1] ??
    "";

  const photos = [
    ...text.matchAll(/https:\/\/lh3\.googleusercontent\.com\/grass-cs\/[^"\\]+/g),
  ].map((m) => decode(m[0].replace(/\\u003d/g, "=")));

  const mapsUrlM = text.match(/https:\/\/www\.google\.com\/maps\/reviews\/data[^"\\]+/);
  const mapsUrl = mapsUrlM
    ? decode(mapsUrlM[0].replace(/\\u003d/g, "="))
    : buildMapsUrl(reviewId);

  return {
    author: profileMatch?.[1] ?? authors[0] ?? "Google",
    reviewId,
    mapsUrl,
    relativeTime: rel,
    text: reviewText,
    photos: [...new Set(photos)],
  };
}

function relativeToDate(rel) {
  const now = new Date("2026-07-09T12:00:00+02:00");
  if (!rel) return "09.07.2026";
  const h = rel.match(/(\d+)\s*godzin/);
  if (h) {
    const d = new Date(now);
    d.setHours(d.getHours() - Number(h[1]));
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  }
  const days = rel.match(/(\d+)\s*dni/);
  if (days) {
    const d = new Date(now);
    d.setDate(d.getDate() - Number(days[1]));
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  }
  const weeks = rel.match(/(\d+)\s*tygodn/);
  if (weeks) {
    const d = new Date(now);
    d.setDate(d.getDate() - Number(weeks[1]) * 7);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  }
  return "09.07.2026";
}

async function main() {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("greview") && f.endsWith(".html"))
    .sort();

  const out = [];
  for (let i = 0; i < files.length; i++) {
    const html = fs.readFileSync(path.join(dir, files[i]), "utf8");
    const pb = extractPb(html);
    const reviewId =
      html.match(/Ci9DQUlRQUNvZENodHljRjlv[A-Za-z0-9_-]+/)?.[0] ?? `rev-${i}`;
    if (!pb) continue;
    const res = await fetch(pb, { headers: { "User-Agent": "Mozilla/5.0" } });
    const body = await res.text();
    fs.writeFileSync(path.join(dir, `rpc${i + 1}.txt`), body, "utf8");
    const parsed = parseRpc(body, reviewId);
    out.push({
      shareUrl: shareUrls[i],
      date: relativeToDate(parsed.relativeTime),
      rating: 5,
      ...parsed,
    });
  }
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
