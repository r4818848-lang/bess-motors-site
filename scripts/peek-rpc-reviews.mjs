import fs from "node:fs";
import path from "node:path";

const dir =
  "C:/Users/Asus/.cursor/projects/c-Users-Asus-Desktop-website-bess-motors/agent-tools";

for (let i = 1; i <= 6; i++) {
  const t = fs.readFileSync(path.join(dir, `rpc${i}.txt`), "utf8");
  const author = t.match(/^\[1,"[^"]+",\["([^"]+)"/)?.[1];
  const marker = '["pl"],[["';
  const idx = t.indexOf(marker);
  let text = "";
  if (idx >= 0) {
    const chunk = t.slice(idx + marker.length);
    const end = chunk.indexOf('",null,[0,');
    text = chunk.slice(0, end);
  }
  const rel = t.match(/\[2026,\d+,\d+,\d+,null,null,null,null,\["([^"]+)"\]\]/)?.[1];
  const photos = [...t.matchAll(/https:\/\/lh3\.googleusercontent\.com\/grass-cs\/[^"\\]+/g)].map(
    (m) => m[0].replace(/\\u003d/g, "=")
  );
  console.log({ i, author, rel, textLen: text.length, text: text.slice(0, 120), photos: photos.length });
}
