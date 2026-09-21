import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { API_SCHEMAS } from "../validation/api-schemas.ts"

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8")
const walk = (dir: string, match: (file: string) => boolean): string[] =>
  (fs.readdirSync(path.join(root, dir), { recursive: true }) as string[])
    .map(String)
    .filter(match)
    .map((file) => path.posix.join(dir, file.split(path.sep).join("/")))

const routeFiles = walk("app/api", (file) => file.endsWith("route.ts"))
const WEBHOOK = "app/api/webhooks/verify/[connectionId]/route.ts"

// Strip comments so commented-out calls and prose never satisfy a check.
const code = (file: string) => read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")

test("every JSON-consuming route CALLS assertApiBody (an import alone does not count)", () => {
  const offenders = routeFiles.filter((file) => {
    if (file === WEBHOOK) return false // HMAC-authenticated, provider-defined payload
    const source = code(file)
    return /readJsonBody(?:<[^>]+>)?\s*\(|request\.json\s*\(/.test(source) && !/assertApiBody\s*\(/.test(source)
  })
  assert.deepEqual(offenders, [])
})

test("every schema in API_SCHEMAS is enforced by some route", () => {
  const used = new Set<string>()
  for (const file of routeFiles) {
    for (const match of code(file).matchAll(/assertApiBody\s*\([^,]+,\s*"([^"]+)"/g)) used.add(match[1])
  }
  const unused = Object.keys(API_SCHEMAS).filter((key) => !used.has(key))
  assert.deepEqual(unused, [])
})

test("dynamic routes CALL assertApiParam for every path parameter", () => {
  const offenders = routeFiles.filter((file) => file.includes("[") && !/assertApiParam\s*\(/.test(code(file)))
  assert.deepEqual(offenders, [])
})

test("routes that validate input also translate validation failures into 4xx responses", () => {
  const offenders = routeFiles.filter((file) => {
    if (file === WEBHOOK || file.endsWith("auth/login/route.ts") || file.endsWith("test-mcp/route.ts")) return false
    const source = code(file)
    return /assertApi(?:Body|Param|Header)\s*\(/.test(source) && !/validationErrorResponse\s*\(/.test(source)
  })
  assert.deepEqual(offenders, [])
})

test("API responses never interpolate or forward raw exception/database messages", () => {
  const files = [...routeFiles, ...walk("lib/discovery", (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => file)]
  const offenders: string[] = []
  for (const file of files) {
    const lines = code(file).split("\n")
    lines.forEach((line, index) => {
      if (/console\.(error|warn|log)/.test(line)) return
      const forwarding = /\$\{[\w.?]*\.message\}/.test(line) || /\b(error|message|detail|details|error_message)\s*:\s*[\w.?]*\.message\b/.test(line)
      if (forwarding) offenders.push(`${file}:${index + 1}`)
    })
  }
  assert.deepEqual(offenders, [])
})

test("no upload surface exists: no multipart parsing, storage writes or file inputs anywhere", () => {
  const files = [...walk("app", (f) => /\.(ts|tsx)$/.test(f)), ...walk("lib", (f) => /\.(ts|tsx)$/.test(f) && !f.endsWith(".test.ts")), ...walk("components", (f) => /\.(ts|tsx)$/.test(f))]
  const sink = /formData\s*\(|multipart\/|type=["']file["']|\.storage\s*\.from\s*\(|createSignedUploadUrl|new File\s*\(/
  const offenders = files.filter((file) => sink.test(code(file)))
  assert.deepEqual(offenders, [])
})

test("auth backoff migration avoids the plpgsql variable/column name clash and uses an empty search_path", () => {
  const sql = read("supabase/migrations/20260921280000_fix_auth_backoff_functions.sql").replace(/--.*$/gm, "")
  const declares = [...sql.matchAll(/declare\s+([\s\S]*?)\bbegin\b/gi)].flatMap((m) => m[1].split(";")).map((d) => d.trim().split(/\s+/)[0]).filter(Boolean)
  const columns = ["key", "failures", "next_allowed_at", "updated_at"]
  assert.deepEqual(declares.filter((name) => columns.includes(name)), [])
  assert.equal((sql.match(/set search_path = ''/g) ?? []).length, 3)
  assert.equal(/set search_path = public/.test(sql), false)
})
