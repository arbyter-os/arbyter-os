import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "app");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === "page.tsx" || entry.name === "page.ts") out.push(full);
  }
  return out;
}

function routeFromFile(file) {
  const rel = path.relative(APP, path.dirname(file)).replaceAll(path.sep, "/");
  const cleaned = rel
    .replace(/\([^/]+\)/g, "")
    .replace(/\[[^/]+\]/g, "[dynamic]");
  return cleaned ? "/" + cleaned : "/";
}

function stripNonHtml(text) {
  return text
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

const files = walk(APP);
const routes = new Set(files.map(routeFromFile));
const errors = [];

for (const file of files) {
  const source = stripNonHtml(fs.readFileSync(file, "utf8"));
  const route = routeFromFile(file);

  const directH1 = (source.match(/<h1\b/gi) || []).length;
  const pageFrameH1 = /<PageFrame\b/.test(source) ? 1 : 0;
  const h1Count = directH1 + pageFrameH1;

  if (h1Count !== 1) {
    errors.push(`${route}: expected exactly 1 H1, found ${h1Count}`);
  }

  for (const match of source.matchAll(/<(?:img|Image)\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\balt\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/i.test(tag)) {
      errors.push(`${route}: image missing alt`);
    }
  }

  for (const match of source.matchAll(/href\s*=\s*["'](\/[^"'#?]*)["']/g)) {
    const href = match[1].replace(/\/$/, "") || "/";
    if (href.startsWith("/api/") || href === "/login" || href.startsWith("/app")) continue;
    if (!routes.has(href)) {
      errors.push(`${route}: internal href does not map to an app route: ${href}`);
    }
  }

  const segment = route.split("/").filter(Boolean).filter((s) => !s.startsWith("[") && !s.startsWith("("));
  for (const s of segment) {
    if (s !== s.toLowerCase() || /[^a-z0-9-]/.test(s)) {
      errors.push(`${route}: route segment is not lowercase kebab-case: ${s}`);
    }
  }
}

if (errors.length) {
  console.error("SEO AUDIT FAILED");
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}

console.log(`SEO AUDIT PASSED — ${files.length} page routes checked.`);
