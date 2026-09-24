/*
 * Stage 3 dataset validator.
 *
 * 1. JSON Schema validation (draft 2020-12) against schema.json.
 * 2. Cross-artifact consistency: distribution slots, meta/stage label agreement,
 *    profile-reference integrity (all ids must exist in org-profiles.json).
 * 3. Decision-core replay: re-implements the production logic from
 *    lib/governance/{evaluator,conflict-resolver,risk-engine,index}.ts and asserts
 *    that each governance-stage example's decision_label, s5.risk_level and
 *    s8.deciding_rule are exactly what the production pipeline would produce.
 *
 * Run: node dataset/stage3/validate.js
 */
const fs = require("fs")
const path = require("path")

const ajvModulePath = path.join(__dirname, "..", "..", "node_modules", ".pnpm", "ajv@8.20.0", "node_modules", "ajv")
let Ajv2020
try {
  Ajv2020 = require(path.join(ajvModulePath, "dist", "2020")).default
} catch {
  console.error("ajv 8.20.0 not found in pnpm store; cannot validate.")
  process.exit(2)
}

const here = __dirname
const schema = JSON.parse(fs.readFileSync(path.join(here, "schema.json"), "utf8"))
const profiles = JSON.parse(fs.readFileSync(path.join(here, "org-profiles.json"), "utf8"))
const examplesDir = path.join(here, "examples")
const exampleFiles = fs.readdirSync(examplesDir).filter((f) => f.endsWith(".json")).sort()

const ajv = new Ajv2020({ allErrors: true, strict: false })
const validateSchema = ajv.compile(schema)

const profile = profiles.profiles["org-replay-alpha"]
const profileAgents = new Set(profile.agents.map((a) => a.agent_id))
const profileConnections = new Set(profile.agent_connections.map((c) => c.connection_id))
const profileUsers = new Set(profile.users.map((u) => u.user_id))
const profileProvider = profile.agent_connections[0].provider
const profileOrgId = profile.organization.organization_id

/* ---- production governance core re-implementation ---- */
const SOURCE_WEIGHT = { government: 400, regulatory: 400, security: 300, framework: 250, company: 200, system: 100 }
const EFFECT_WEIGHT = { block: 400, require_approval: 300, flag: 200, allow: 100 }
const RISK_WEIGHT = { low: 1, medium: 2, high: 3, critical: 4 }
const CONTEXTUAL_FIELDS = ["country", "state", "jurisdiction", "sector"]

function primitiveType(v) {
  if (v === null) return "null"
  if (Array.isArray(v)) return "array"
  return typeof v
}

function getValue(pathStr, context) {
  let value = context
  for (const key of String(pathStr).split(".")) {
    if (value === null || value === undefined || typeof value !== "object" || !(key in value)) {
      return { found: false, value: undefined }
    }
    value = value[key]
  }
  return { found: true, value }
}

/* Faithful subset of lib/governance/evaluator.ts matchesCondition */
function matchesCondition(key, expected, context) {
  const resolved = getValue(key, context)
  if (!resolved.found || resolved.value === null || resolved.value === undefined) {
    return { matched: false, evaluable: false }
  }
  const actual = resolved.value
  if (Array.isArray(expected)) {
    if (expected.length === 0) return { matched: false, evaluable: true }
    const expectedTypes = new Set(expected.filter((v) => v !== null && v !== undefined).map(primitiveType))
    if (!expectedTypes.has(primitiveType(actual))) return { matched: false, evaluable: false }
    return { matched: expected.includes(actual), evaluable: true }
  }
  if (expected && typeof expected === "object") {
    const operator = ["gt", "gte", "lt", "lte", "eq", "neq"].find((n) => n in expected)
    if (operator) {
      const operand = expected[operator]
      if (["gt", "gte", "lt", "lte"].includes(operator)) {
        if (typeof actual !== "number" || typeof operand !== "number" || !Number.isFinite(actual) || !Number.isFinite(operand)) {
          return { matched: false, evaluable: false }
        }
        switch (operator) {
          case "gt": return { matched: actual > operand, evaluable: true }
          case "gte": return { matched: actual >= operand, evaluable: true }
          case "lt": return { matched: actual < operand, evaluable: true }
          case "lte": return { matched: actual <= operand, evaluable: true }
        }
      }
      if (operator === "eq" || operator === "neq") {
        if (operand === null || operand === undefined || primitiveType(actual) !== primitiveType(operand)) {
          return { matched: false, evaluable: false }
        }
        return { matched: operator === "eq" ? actual === operand : actual !== operand, evaluable: true }
      }
    }
    return { matched: false, evaluable: false }
  }
  if (primitiveType(actual) !== primitiveType(expected)) return { matched: false, evaluable: false }
  return { matched: actual === expected, evaluable: true }
}

function evaluateRule(rule, context) {
  const entries = Object.entries(rule.conditions ?? {})
  if (entries.length === 0) return { matched: true, evaluable: true }
  for (const [key, expected] of entries) {
    const result = matchesCondition(key, expected, context)
    if (!result.evaluable) return { matched: false, evaluable: false }
    if (!result.matched) return { matched: false, evaluable: true }
  }
  return { matched: true, evaluable: true }
}

function calculateRisk(triggeredRules) {
  if (triggeredRules.length === 0) return "low"
  let highest = "low"
  for (const rule of triggeredRules) {
    const raw = (rule.conditions ?? {})["risk"]
    const risk = ["low", "medium", "high", "critical"].includes(raw) ? raw : "medium"
    if (RISK_WEIGHT[risk] > RISK_WEIGHT[highest]) highest = risk
    if (String(rule.effect ?? "").toLowerCase() === "block" && RISK_WEIGHT.high > RISK_WEIGHT[highest]) highest = "high"
  }
  return highest
}

function ruleWeight(rule) {
  const sourceWeight = SOURCE_WEIGHT[String(rule.sourceType ?? "").toLowerCase()] ?? 0
  const effect = String(rule.effect ?? "").toLowerCase()
  return (rule.priority ?? 0) + sourceWeight + (EFFECT_WEIGHT[effect] ?? 0)
}

const EFFECT_TO_LABEL = { allow: "ALLOW", block: "BLOCK", require_approval: "REQUIRE_APPROVAL", flag: "FLAG_FOR_REVIEW" }

function replayDecision(rules, context) {
  const evals = rules.map((rule) => ({ rule, ...evaluateRule(rule, context) }))
  const triggered = evals.filter((e) => e.matched).map((e) => e.rule)

  const missingContextRules = rules
    .filter((rule) => {
      const scope = rule.scope ?? {}
      return CONTEXTUAL_FIELDS.some((f) => scope[f] !== undefined && scope[f] !== null && scope[f] !== "") ||
        (rule.jurisdiction !== undefined && rule.jurisdiction !== null && rule.jurisdiction !== "")
    })
    .filter((rule) => {
      const scope = rule.scope ?? {}
      const required = CONTEXTUAL_FIELDS.filter((f) => scope[f])
      if (rule.jurisdiction) required.push("jurisdiction")
      return required.some((f) => context[f] === undefined || context[f] === null || context[f] === "")
    })

  let effect, deciding
  if (triggered.length === 0) {
    effect = "allow"
    deciding = { ruleId: null, reason: "No governance rules were triggered." }
  } else {
    const winner = [...triggered].sort((a, b) => ruleWeight(b) - ruleWeight(a))[0]
    effect = String(winner.effect ?? "").toLowerCase() || "flag"
    deciding = { ruleId: winner.id, reason: `Decision determined by rule "${winner.name}" with priority ${winner.priority}.` }
  }
  if (missingContextRules.length > 0 && effect !== "block" && effect !== "require_approval") {
    effect = "require_approval"
    deciding = { ruleId: missingContextRules[0].id, reason: `Approval required because governance context is missing: jurisdiction.` }
  }
  return { label: EFFECT_TO_LABEL[effect] ?? "FLAG_FOR_REVIEW", risk: calculateRisk(triggered), deciding, triggered }
}

/* ---- per-example checks ---- */
const expectedDistribution = { ALLOW: 3, REQUIRE_APPROVAL: 2, BLOCK: 1, FLAG_FOR_REVIEW: 1, NO_ROUTE: 1, REJECT_ACCESS: 1, UNDELIVERABLE_REQUEST: 1 }
const GOVERNANCE_LABELS = new Set(["ALLOW", "REQUIRE_APPROVAL", "FLAG_FOR_REVIEW", "BLOCK"])

let failures = 0
const distributionCount = {}
const assumptions = []

function fail(file, msg) {
  failures++
  console.log(`  FAIL ${file}: ${msg}`)
}

for (const file of exampleFiles) {
  console.log(`\n== ${file} ==`)
  const raw = fs.readFileSync(path.join(examplesDir, file), "utf8")
  let ex
  try {
    ex = JSON.parse(raw)
  } catch (e) {
    fail(file, `invalid JSON: ${e.message}`)
    continue
  }

  if (!validateSchema(ex)) {
    for (const err of validateSchema.errors) {
      fail(file, `schema: ${err.instancePath} ${err.message}`)
    }
    continue
  }
  console.log("  schema: PASS")

  const { meta, stages } = ex
  const s = stages

  if (meta.decision_label !== s.s8.decision_label) fail(file, "meta.decision_label != s8.decision_label")
  if (meta.distribution_slot !== meta.decision_label) fail(file, "distribution_slot != decision_label")
  distributionCount[meta.distribution_slot] = (distributionCount[meta.distribution_slot] ?? 0) + 1

  /* profile integrity */
  if (s.s1.org.organization_id !== profileOrgId) fail(file, "org id not from profile")
  if (s.s1.actor.user_id && !profileUsers.has(s.s1.actor.user_id)) fail(file, "actor user_id not in profile")
  const actorProfile = profile.users.find((u) => u.user_id === s.s1.actor.user_id)
  if (actorProfile && actorProfile.role !== s.s1.actor.role) fail(file, "actor role disagrees with profile")
  for (const c of s.s3.candidates) {
    if (!profileAgents.has(c.agentId)) fail(file, `candidate agentId ${c.agentId} not in profile`)
    if (!profileConnections.has(c.connectionId)) fail(file, `candidate connectionId ${c.connectionId} not in profile`)
    if (c.provider !== profileProvider) fail(file, "candidate provider not in profile")
  }
  if (s.s6.agent && !profileAgents.has(s.s6.agent.id)) fail(file, "s6 agent id not in profile")
  if (s.s6.connection && !profileConnections.has(s.s6.connection.id)) fail(file, "s6 connection id not in profile")
  if (s.s4.evaluation_context.agentId && !profileAgents.has(s.s4.evaluation_context.agentId) && s.s4.reached) fail(file, "s4 agentId not in profile")
  if (s.s4.evaluation_context.agentConnectionId && !profileConnections.has(s.s4.evaluation_context.agentConnectionId) && s.s4.reached) fail(file, "s4 connectionId not in profile")
  if (s.s4.evaluation_context.tool && s.s4.evaluation_context.tool !== profileProvider) fail(file, "s4 tool not the profile provider")
  if (s.s6.identity_used_in_selection !== false) fail(file, "identity_used_in_selection must be false in [T] examples")

  /* decision-core replay for governance-stage examples */
  if (s.s4.reached && GOVERNANCE_LABELS.has(meta.decision_label)) {
    const replay = replayDecision(s.s4.rules, s.s4.evaluation_context)
    if (replay.label !== meta.decision_label) {
      fail(file, `decision replay: production logic yields ${replay.label}, example says ${meta.decision_label}`)
    }
    if (replay.risk !== s.s5.risk_level) {
      fail(file, `risk replay: production logic yields ${replay.risk}, example says ${s.s5.risk_level}`)
    }
    if (replay.deciding.ruleId !== (s.s8.deciding_rule?.ruleId ?? null)) {
      fail(file, `deciding rule replay: expected ${replay.deciding.ruleId}, example says ${s.s8.deciding_rule?.ruleId}`)
    }
    if (replay.deciding.reason !== s.s8.deciding_rule?.reason) {
      fail(file, `deciding reason replay mismatch:\n    expected: ${replay.deciding.reason}\n    example:  ${s.s8.deciding_rule?.reason}`)
    }
    console.log("  decision replay: PASS")
  }

  /* structural honesty: rejected/terminal examples have no records */
  const zeroRecordLabels = new Set(["REJECT_ACCESS", "NO_ROUTE", "UNDELIVERABLE_REQUEST"])
  if (zeroRecordLabels.has(meta.decision_label) && s.s9.records_written.length !== 0) {
    fail(file, `${meta.decision_label} must have zero records_written`)
  }
  if (!zeroRecordLabels.has(meta.decision_label) && GOVERNANCE_LABELS.has(meta.decision_label) && s.s9.records_written.length === 0) {
    fail(file, `${meta.decision_label} must record audit rows`)
  }

  /* notes about assumptions */
  if (meta.notes && /assum/i.test(meta.notes)) assumptions.push(`${file}: ${meta.notes}`)
}

console.log("\n== distribution ==")
let distOk = true
for (const [slot, expected] of Object.entries(expectedDistribution)) {
  const actual = distributionCount[slot] ?? 0
  const ok = actual === expected
  if (!ok) distOk = false
  console.log(`  ${ok ? "OK  " : "FAIL"} ${slot}: ${actual}/${expected}`)
}
const extra = Object.keys(distributionCount).filter((k) => !(k in expectedDistribution))
if (extra.length) { distOk = false; console.log(`  FAIL unexpected slots: ${extra.join(", ")}`) }

console.log(`\n${failures === 0 && distOk ? "VALIDATION PASSED" : "VALIDATION FAILED"} — ${exampleFiles.length} examples, ${failures} failure(s)`)
process.exit(failures === 0 && distOk ? 0 : 1)
