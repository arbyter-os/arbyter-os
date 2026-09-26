function envInt(name: string, fallback: number, min = 1, max = 1_000_000): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback
}

function envMs(name: string, fallback: number, min = 1_000, max = 86_400_000): number {
  return envInt(name, fallback, min, max)
}

export const RATE_LIMITS = {
  loginIp: { limit: envInt("RATE_LIMIT_LOGIN_IP", 10), windowMs: envMs("RATE_LIMIT_LOGIN_WINDOW_MS", 60_000) },
  loginAccount: { limit: envInt("RATE_LIMIT_LOGIN_ACCOUNT", 20), windowMs: envMs("RATE_LIMIT_LOGIN_ACCOUNT_WINDOW_MS", 600_000) },
  loginBackoffBaseMs: envMs("RATE_LIMIT_LOGIN_BACKOFF_BASE_MS", 1_000),
  loginBackoffMaxMs: envMs("RATE_LIMIT_LOGIN_BACKOFF_MAX_MS", 300_000),
  loginBackoffThreshold: envInt("RATE_LIMIT_LOGIN_BACKOFF_THRESHOLD", 3),
  webhookIp: { limit: envInt("RATE_LIMIT_WEBHOOK_IP", 60), windowMs: envMs("RATE_LIMIT_WEBHOOK_IP_WINDOW_MS", 60_000) },
  webhookConnectionIp: { limit: envInt("RATE_LIMIT_WEBHOOK_CONNECTION_IP", 30), windowMs: envMs("RATE_LIMIT_WEBHOOK_CONNECTION_IP_WINDOW_MS", 60_000) },
  publicTestMcp: { limit: envInt("RATE_LIMIT_PUBLIC_TEST_MCP", 30), windowMs: envMs("RATE_LIMIT_PUBLIC_TEST_MCP_WINDOW_MS", 60_000) },
  authenticatedTestMcp: { limit: envInt("RATE_LIMIT_TEST_MCP", 5), windowMs: envMs("RATE_LIMIT_TEST_MCP_WINDOW_MS", 60_000) },
  execute: { limit: envInt("RATE_LIMIT_EXECUTE", 30), windowMs: envMs("RATE_LIMIT_EXECUTE_WINDOW_MS", 60_000) },
  connectorExecute: { limit: envInt("RATE_LIMIT_CONNECTOR_EXECUTE", 10), windowMs: envMs("RATE_LIMIT_CONNECTOR_EXECUTE_WINDOW_MS", 60_000) },
  taskExecute: { limit: envInt("RATE_LIMIT_TASK_EXECUTE", 10), windowMs: envMs("RATE_LIMIT_TASK_EXECUTE_WINDOW_MS", 60_000) },
  credentials: { limit: envInt("RATE_LIMIT_CREDENTIALS", 20), windowMs: envMs("RATE_LIMIT_CREDENTIALS_WINDOW_MS", 60_000) },
  agents: { limit: envInt("RATE_LIMIT_AGENTS", 20), windowMs: envMs("RATE_LIMIT_AGENTS_WINDOW_MS", 60_000) },
  connections: { limit: envInt("RATE_LIMIT_CONNECTIONS", 10), windowMs: envMs("RATE_LIMIT_CONNECTIONS_WINDOW_MS", 60_000) },
  agentmail: { limit: envInt("RATE_LIMIT_AGENTMAIL", 10), windowMs: envMs("RATE_LIMIT_AGENTMAIL_WINDOW_MS", 60_000) },
  governanceAction: { limit: envInt("RATE_LIMIT_GOVERNANCE_ACTION", 20), windowMs: envMs("RATE_LIMIT_GOVERNANCE_ACTION_WINDOW_MS", 60_000) },
  approvals: { limit: envInt("RATE_LIMIT_APPROVALS", 10), windowMs: envMs("RATE_LIMIT_APPROVALS_WINDOW_MS", 60_000) },
  discoveryScans: { limit: envInt("RATE_LIMIT_DISCOVERY_SCANS", 5), windowMs: envMs("RATE_LIMIT_DISCOVERY_SCANS_WINDOW_MS", 60_000) },
  discoverySources: { limit: envInt("RATE_LIMIT_DISCOVERY_SOURCES", 10), windowMs: envMs("RATE_LIMIT_DISCOVERY_SOURCES_WINDOW_MS", 60_000) },
  discoveryReview: { limit: envInt("RATE_LIMIT_DISCOVERY_REVIEW", 20), windowMs: envMs("RATE_LIMIT_DISCOVERY_REVIEW_WINDOW_MS", 60_000) },
  governanceEvaluate: { limit: envInt("RATE_LIMIT_GOVERNANCE_EVALUATE", 30), windowMs: envMs("RATE_LIMIT_GOVERNANCE_EVALUATE_WINDOW_MS", 60_000) },
  governancePolicyCreate: { limit: envInt("RATE_LIMIT_GOVERNANCE_POLICY_CREATE", 20), windowMs: envMs("RATE_LIMIT_GOVERNANCE_POLICY_CREATE_WINDOW_MS", 60_000) },
  governanceRuleCreate: { limit: envInt("RATE_LIMIT_GOVERNANCE_RULE_CREATE", 20), windowMs: envMs("RATE_LIMIT_GOVERNANCE_RULE_CREATE_WINDOW_MS", 60_000) },
  tasksCreate: { limit: envInt("RATE_LIMIT_TASKS_CREATE", 20), windowMs: envMs("RATE_LIMIT_TASKS_CREATE_WINDOW_MS", 60_000) },
  discoveryMcp: { limit: envInt("RATE_LIMIT_DISCOVERY_MCP", 10), windowMs: envMs("RATE_LIMIT_DISCOVERY_MCP_WINDOW_MS", 60_000) },
  discoveryRun: { limit: envInt("RATE_LIMIT_DISCOVERY_RUN", 10), windowMs: envMs("RATE_LIMIT_DISCOVERY_RUN_WINDOW_MS", 60_000) },
  agentsVerify: { limit: envInt("RATE_LIMIT_AGENTS_VERIFY", 10), windowMs: envMs("RATE_LIMIT_AGENTS_VERIFY_WINDOW_MS", 60_000) },
  // P1-2/P1-3: organization-wide quotas (shared bucket across ALL members of
  // an org, across every entry route). Initial values from the rate-limit
  // audit: 30 executions/min/org (bounded by the 10/min per-user LLM budget
  // and the five execution-bearing entry routes), 20 AgentMail sends/min/org
  // (shared provider account/sender-reputation resource).
  orgExecutionQuota: { limit: envInt("RATE_LIMIT_ORG_EXECUTION", 30), windowMs: envMs("RATE_LIMIT_ORG_EXECUTION_WINDOW_MS", 60_000) },
  orgMailQuota: { limit: envInt("RATE_LIMIT_ORG_MAIL", 20), windowMs: envMs("RATE_LIMIT_ORG_MAIL_WINDOW_MS", 60_000) },
} as const
