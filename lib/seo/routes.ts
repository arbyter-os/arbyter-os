export type SeoRoute = {
  title: string
  description: string
  noIndex?: boolean
}

export const SEO_ROUTES: Record<string, SeoRoute> = {
  "/": { title: "Arbyter — Intelligence Meets Governance", description: "The runtime governance layer between organizations and their AI agents." },
  "/platform": { title: "AI Agent Governance Platform | Arbyter", description: "Govern AI agents at runtime with policy enforcement, discovery, security, audit and human approval." },
  "/how-it-works": { title: "How AI Agent Runtime Governance Works | Arbyter", description: "See how Arbyter translates organizational intent into runtime decisions across AI agents, tools and business systems." },
  "/runtime-governance": { title: "Runtime Governance for AI Agents | Arbyter", description: "Evaluate AI agent actions before execution and allow, block or require human approval." },
  "/policy-enforcement": { title: "AI Agent Policy Enforcement | Arbyter", description: "Turn business policies into executable runtime controls for AI agents." },
  "/agent-governance": { title: "AI Agent Governance | Arbyter", description: "Govern agent identity, capabilities, actions, permissions and runtime decisions from one control layer." },
  "/agent-compliance": { title: "AI Agent Compliance | Arbyter", description: "Translate organizational and regulatory requirements into enforceable AI agent controls." },
  "/agent-orchestration": { title: "AI Agent Orchestration | Arbyter", description: "Coordinate governed AI agents across tools, systems and workflows." },
  "/agent-discovery": { title: "AI Agent Discovery | Arbyter", description: "Discover AI agents across APIs, MCP, cloud environments, internal infrastructure and AI platforms." },
  "/ai-agent-command": { title: "AI Agent Command | Arbyter", description: "Use natural-language intent to direct and govern AI agent actions." },
  "/ai-agent-security": { title: "AI Agent Security | Arbyter", description: "Evaluate identity, permissions, tools, risk and policy before AI agents execute actions." },
  "/ai-agent-monitoring": { title: "AI Agent Monitoring | Arbyter", description: "Understand AI agent activity, decisions and governed runtime events." },
  "/ai-agent-risk": { title: "AI Agent Risk Management | Arbyter", description: "Identify and evaluate runtime risks created by autonomous AI agent actions." },
  "/ai-agent-audit": { title: "AI Agent Audit | Arbyter", description: "Create an auditable record of AI agent policies, context, decisions and outcomes." },
  "/enterprise-ai-governance": { title: "Enterprise AI Governance | Arbyter", description: "Apply consistent governance across an enterprise AI workforce." },
  "/human-in-the-loop": { title: "Human-in-the-Loop AI Agents | Arbyter", description: "Require human approval at the exact runtime actions where organizational policy demands it." },
  "/mcp-governance": { title: "MCP Governance for AI Agents | Arbyter", description: "Govern AI agents using Model Context Protocol connections, tools and runtime policies." },
  "/intelligence": { title: "Organizational Intelligence for AI Agents | Arbyter", description: "Connect organizational intent and domain knowledge to AI agent runtime decisions." },
  "/glossary": { title: "AI Agent Governance Glossary | Arbyter", description: "Definitions for runtime governance, policy enforcement, agent security, MCP governance and related concepts." },
  "/resources": { title: "AI Agent Governance Resources | Arbyter", description: "Practical resources for understanding and implementing AI agent governance." },
  "/use-cases": { title: "AI Agent Governance Use Cases | Arbyter", description: "Explore practical governance scenarios across enterprise AI workflows." },
  "/integrations": { title: "AI Agent Governance Integrations | Arbyter", description: "Connect governed AI agents through MCP, APIs, webhooks, SDKs and internal systems." },
  "/demo": { title: "Arbyter Demo — Runtime AI Governance", description: "Run an interactive simulation of AI agent policy enforcement and runtime decisions." },
  "/pricing": { title: "Arbyter Pricing — AI Agent Governance", description: "Explore Arbyter plans for governing AI agent workforces from 1 to 1,000+ agents." },
  "/sign-up": { title: "Sign Up | Arbyter", description: "Bring your AI workforce under governance. Start with a product conversation to define the right governance scope." },
}

export const PUBLIC_SEO_ROUTES = Object.keys(SEO_ROUTES)
