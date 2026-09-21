// Minimal parser for the `create policy` / `drop policy` statements used by
// the RLS migrations. Tests use this to assert the *effective structure* of
// each policy (command, roles, USING, WITH CHECK) instead of grepping the
// migration text, which cannot distinguish a correct policy from
// `using (true)`.

export type ParsedPolicy = {
  name: string
  table: string
  command: "insert" | "update" | "delete" | "select" | "all"
  roles: string[]
  using: string | null
  withCheck: string | null
}

export type ParsedMigration = {
  policies: ParsedPolicy[]
  dropped: { name: string; table: string }[]
  functions: { name: string; searchPath: string | null; securityDefiner: boolean }[]
}

function stripComments(sql: string): string {
  // Remove -- line comments, preserving newlines so offsets stay sane.
  return sql.replace(/--[^\n]*/g, "")
}

/** Read a parenthesised group starting at `open` (index of the "("). */
function readGroup(sql: string, open: number): { text: string; end: number } {
  let depth = 0
  let inString = false
  for (let i = open; i < sql.length; i += 1) {
    const ch = sql[i]
    if (ch === "'") {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === "(") depth += 1
    else if (ch === ")") {
      depth -= 1
      if (depth === 0) {
        return { text: sql.slice(open + 1, i).trim(), end: i + 1 }
      }
    }
  }
  throw new Error(`Unbalanced parentheses starting at offset ${open}`)
}

/**
 * Read the clause following `keyword` at/after `from`, but only if that
 * keyword is the next meaningful token. Returns null when absent.
 */
function readClause(body: string, keyword: string): string | null {
  const re = new RegExp(`\\b${keyword}\\s*\\(`, "i")
  const match = re.exec(body)
  if (!match) return null
  const open = match.index + match[0].length - 1
  return readGroup(body, open).text
}

export function parseMigration(sql: string): ParsedMigration {
  const clean = stripComments(sql)
  const policies: ParsedPolicy[] = []
  const dropped: { name: string; table: string }[] = []
  const functions: ParsedMigration["functions"] = []

  const dropRe = /drop\s+policy\s+if\s+exists\s+"([^"]+)"\s+on\s+public\.(\w+)/gi
  let dropMatch: RegExpExecArray | null
  while ((dropMatch = dropRe.exec(clean)) !== null) {
    dropped.push({ name: dropMatch[1], table: dropMatch[2] })
  }

  const createRe = /create\s+policy\s+"([^"]+)"\s+on\s+public\.(\w+)\s+for\s+(insert|update|delete|select|all)\s+to\s+([\w\s,]+?)(?=\s+(?:using|with\s+check)\b)/gi
  let createMatch: RegExpExecArray | null
  while ((createMatch = createRe.exec(clean)) !== null) {
    const [, name, table, command, rolesRaw] = createMatch
    // The policy body runs to the terminating semicolon at depth 0.
    let depth = 0
    let inString = false
    let end = clean.length
    for (let i = createRe.lastIndex; i < clean.length; i += 1) {
      const ch = clean[i]
      if (ch === "'") {
        inString = !inString
        continue
      }
      if (inString) continue
      if (ch === "(") depth += 1
      else if (ch === ")") depth -= 1
      else if (ch === ";" && depth === 0) {
        end = i
        break
      }
    }
    const body = clean.slice(createRe.lastIndex, end)

    // `with check` must be located before `using` is matched naively, because
    // "check (" would otherwise never be confused -- but USING may be absent.
    const withCheck = readClause(body, "with\\s+check")
    let using: string | null = null
    const usingMatch = /\busing\s*\(/i.exec(body)
    if (usingMatch) {
      const open = usingMatch.index + usingMatch[0].length - 1
      using = readGroup(body, open).text
    }

    policies.push({
      name,
      table,
      command: command.toLowerCase() as ParsedPolicy["command"],
      roles: rolesRaw
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean),
      using,
      withCheck,
    })
  }

  const funcRe =
    /create\s+or\s+replace\s+function\s+public\.(\w+)\s*\(([^)]*)\)([\s\S]*?)\bas\s+\$\$/gi
  let funcMatch: RegExpExecArray | null
  while ((funcMatch = funcRe.exec(clean)) !== null) {
    const header = funcMatch[3]
    const searchPath = /set\s+search_path\s*=\s*('([^']*)'|(\S+))/i.exec(header)
    functions.push({
      name: funcMatch[1],
      searchPath: searchPath ? (searchPath[2] ?? searchPath[3] ?? null) : null,
      securityDefiner: /security\s+definer/i.test(header),
    })
  }

  return { policies, dropped, functions }
}

export function policiesFor(
  migration: ParsedMigration,
  table: string,
  command: ParsedPolicy["command"],
): ParsedPolicy[] {
  return migration.policies.filter(
    (policy) => policy.table === table && policy.command === command,
  )
}

const ADMIN_GUARD = /public\.is_current_user_org_admin\s*\(\s*\)/i
const ORG_GUARD = /organization_id\s*=\s*\(\s*select|ac\.organization_id\s*=\s*\(\s*select/i

export function hasAdminGuard(expression: string | null): boolean {
  return Boolean(expression && ADMIN_GUARD.test(expression))
}

export function hasOrgGuard(expression: string | null): boolean {
  return Boolean(expression && ORG_GUARD.test(expression))
}

/** True when the expression is trivially satisfiable (e.g. `true`). */
export function isUnrestricted(expression: string | null): boolean {
  if (expression === null) return false
  return /^\s*true\s*$/i.test(expression)
}
