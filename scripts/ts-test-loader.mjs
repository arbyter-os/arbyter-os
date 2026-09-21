import { access } from "node:fs/promises";
import { dirname, resolve as resolvePath } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const candidate = resolvePath(root, specifier.slice(2));
    for (const path of [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}.js`, resolvePath(candidate, "index.ts")]) {
      try { await access(path); return { url: pathToFileURL(path).href, shortCircuit: true }; } catch {}
    }
  }

  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const base = dirname(fileURLToPath(context.parentURL));
    const candidate = resolvePath(base, specifier);
    for (const path of [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}.js`, resolvePath(candidate, "index.ts")]) {
      try { await access(path); return { url: pathToFileURL(path).href, shortCircuit: true }; } catch {}
    }
  }

  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    // Packages without an "exports" map (notably `next`) expose subpaths as files, and Node's ESM
    // resolver will not add the extension: "next/headers" must be resolved as "next/headers.js".
    const bareSubpath = /^next\/[\w-]+(?:\/[\w-]+)*$/.test(specifier) && !/\.[cm]?[jt]sx?$/.test(specifier);
    if (bareSubpath && error?.code === "ERR_MODULE_NOT_FOUND") {
      return defaultResolve(`${specifier}.js`, context, defaultResolve);
    }
    throw error;
  }
}
