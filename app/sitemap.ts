import type { MetadataRoute } from 'next'

const routes = ['', '/platform', '/how-it-works', '/runtime-governance', '/policy-enforcement', '/agent-governance', '/agent-discovery', '/ai-agent-command', '/ai-agent-security', '/agent-compliance', '/agent-orchestration', '/human-in-the-loop', '/ai-agent-monitoring', '/ai-agent-risk', '/ai-agent-audit', '/enterprise-ai-governance', '/mcp-governance', '/demo', '/pricing', '/about', '/contact', '/glossary', '/resources', '/use-cases', '/integrations', '/compare']

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://arbyter-os-qy.vercel.app'
  return routes.map((route) => ({ url: `${base}${route}`, changeFrequency: route === '' ? 'weekly' : 'monthly', priority: route === '' ? 1 : 0.7 }))
}
