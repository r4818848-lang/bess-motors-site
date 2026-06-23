/**
 * Site-wide static audit: landings, telegram, routes, service IDs.
 * Run: npm run audit
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failed = false;

function run(name, script) {
  const r = spawnSync(process.execPath, [join("scripts", script)], {
    cwd: root,
    encoding: "utf8",
  });
  const out = (r.stdout || "") + (r.stderr || "");
  if (r.status !== 0) {
    console.error(`\n❌ ${name} failed:\n${out}`);
    failed = true;
  } else {
    console.log(`✅ ${name}`);
    if (out.trim()) console.log(out.trim());
  }
}

function checkNavRoutes() {
  const layout = readFileSync(join(root, "src", "components", "layout", "Header.tsx"), "utf8");
  const appDir = join(root, "src", "app");
  const hrefs = [...layout.matchAll(/href:\s*["'](\/[^"']+)["']/g)].map((m) => m[1]);
  const missing = hrefs.filter((h) => {
    if (h.startsWith("http") || h.startsWith("#")) return false;
    const pathname = h.split("?")[0].split("#")[0];
    const path =
      pathname === "/"
        ? join(appDir, "page.tsx")
        : join(appDir, pathname.slice(1), "page.tsx");
    return !existsSync(path);
  });
  if (missing.length) {
    console.error("❌ Header links without page.tsx:", missing);
    failed = true;
  } else {
    console.log(`✅ Header nav routes (${hrefs.length})`);
  }
}

function checkServiceIds() {
  const catalog = readFileSync(join(root, "src", "lib", "services-catalog.ts"), "utf8");
  const ids = new Set([...catalog.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]));
  const landing = readFileSync(join(root, "src", "lib", "seo-landing-pages.ts"), "utf8");
  const used = [...landing.matchAll(/serviceId:\s*"([^"]+)"/g)].map((m) => m[1]);
  const bad = used.filter((id) => !ids.has(id));
  if (bad.length) {
    console.error("❌ SEO landing unknown serviceId:", [...new Set(bad)]);
    failed = true;
  } else {
    console.log(`✅ SEO landing serviceIds (${used.length})`);
  }
}

function checkApiRoutesExportMethods() {
  const apiRoot = join(root, "src", "app", "api");
  const issues = [];
  function walk(dir) {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, name.name);
      if (name.isDirectory()) walk(p);
      else if (name.name === "route.ts") {
        const text = readFileSync(p, "utf8");
        const hasHandler =
          /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/.test(
            text
          ) || /export\s*\{\s*GET\b/.test(text);
        if (!hasHandler) {
          issues.push(p.replace(root, ""));
        }
      }
    }
  }
  walk(apiRoot);
  if (issues.length) {
    console.error("❌ API routes without HTTP export:", issues);
    failed = true;
  } else {
    console.log("✅ API routes have HTTP handlers");
  }
}

function checkYandexMetrika() {
  const layout = readFileSync(join(root, "src", "app", "layout.tsx"), "utf8");
  const lib = readFileSync(join(root, "src", "lib", "yandex-metrika.ts"), "utf8");
  const issues = [];
  if (!layout.includes("YandexMetrika")) issues.push("layout missing YandexMetrika");
  if (!layout.includes("YandexMetrikaPageView")) issues.push("layout missing YandexMetrikaPageView");
  if (!lib.includes("mc.yandex.ru/metrika/tag.js")) issues.push("yandex-metrika init script");
  if (!/109683484|NEXT_PUBLIC_YANDEX_METRIKA_ID/.test(lib)) issues.push("counter id");
  if (issues.length) {
    console.error("❌ Yandex Metrika:", issues);
    failed = true;
  } else {
    console.log("✅ Yandex Metrika counter");
  }
}

function checkClientRefreshExported() {
  const auth = readFileSync(join(root, "src", "lib", "auth.ts"), "utf8");
  if (!auth.includes("refreshClientSessionToken")) {
    console.error("❌ refreshClientSessionToken missing");
    failed = true;
  } else {
    console.log("✅ Client JWT refresh helper");
  }
}

console.log("=== BESS MOTORS site audit ===\n");
run("Landing pages", "audit-landing-pages.mjs");
run("Telegram client callbacks", "audit-telegram-callbacks.mjs");
run("Telegram admin callbacks", "audit-telegram-admin-callbacks.mjs");
checkNavRoutes();
checkServiceIds();
checkApiRoutesExportMethods();
checkYandexMetrika();
checkClientRefreshExported();

function runCrmMergeTest() {
  const r = spawnSync("npx", ["--yes", "tsx", "scripts/test-crm-merge.mjs"], {
    cwd: root,
    encoding: "utf8",
    shell: true,
  });
  const out = (r.stdout || "") + (r.stderr || "");
  if (r.status !== 0) {
    console.error(`\n❌ CRM cloud merge test failed:\n${out}`);
    failed = true;
  } else {
    console.log("✅ CRM cloud merge safety");
    if (out.trim()) console.log(out.trim());
  }
}

runCrmMergeTest();

const pwConfig = join(root, "playwright.config.ts");
if (existsSync(pwConfig)) {
  console.log("✅ Playwright E2E configured (npm run test:e2e)");
} else {
  console.warn("⚠ playwright.config.ts missing");
}

console.log(failed ? "\n❌ Audit failed" : "\n✅ All audits passed");
process.exit(failed ? 1 : 0);
