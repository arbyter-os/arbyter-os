import {
  fetchValidatedExternalUrl,
  validateExternalUrl,
} from "@/lib/security/validate-external-url";

export type MCPDiscoveryResult = {
  success: boolean;
  serverUrl: string;
  serverName?: string;
  protocol?: string;
  tools: Array<{ name: string; description?: string }>;
  resources: Array<{ uri: string; name?: string; description?: string }>;
  prompts: Array<{ name: string; description?: string }>;
  raw?: unknown;
  error?: string;
};

type MCPScannerOptions = {
  serverUrl: string;
  headers?: Record<string, string>;
};

export async function scanMCPServer(
  options: MCPScannerOptions,
): Promise<MCPDiscoveryResult> {
  const { serverUrl, headers = {} } = options;

  try {
    const validation = await validateExternalUrl(serverUrl, {
      protocols: ["https:", "http:"],
    });

    if (!validation.valid) {
      return { success: false, serverUrl, tools: [], resources: [], prompts: [], error: validation.error };
    }

    const response = await fetchValidatedExternalUrl(validation, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...headers,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "Arbyter Discovery", version: "1.0.0" },
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, serverUrl, tools: [], resources: [], prompts: [], error: `MCP server returned HTTP ${response.status}.` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    let data: any = null;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
    }

    const tools = await listMCPItems(serverUrl, "tools/list", headers);
    const resources = await listMCPItems(serverUrl, "resources/list", headers);
    const prompts = await listMCPItems(serverUrl, "prompts/list", headers);

    return {
      success: true,
      serverUrl,
      serverName: data?.result?.serverInfo?.name,
      protocol: data?.result?.protocolVersion,
      tools: normalizeTools(tools),
      resources: normalizeResources(resources),
      prompts: normalizePrompts(prompts),
      raw: data,
    };
  } catch (error) {
    return {
      success: false,
      serverUrl,
      tools: [],
      resources: [],
      prompts: [],
      error: error instanceof Error ? error.message : "Unknown MCP scanner error.",
    };
  }
}

async function listMCPItems(serverUrl: string, method: string, headers: Record<string, string>) {
  try {
    const validation = await validateExternalUrl(serverUrl, {
      protocols: ["https:", "http:"],
    });
    if (!validation.valid) return null;

    const response = await fetchValidatedExternalUrl(validation, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...headers,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params: {} }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return data?.result ?? null;
    }
    const text = await response.text();
    try { return JSON.parse(text)?.result ?? null; } catch { return null; }
  } catch {
    return null;
  }
}

function normalizeTools(value: any): MCPDiscoveryResult["tools"] {
  if (!Array.isArray(value?.tools)) return [];
  return value.tools.map((tool: any) => ({
    name: String(tool?.name ?? "Unknown tool"),
    description: typeof tool?.description === "string" ? tool.description : undefined,
  }));
}

function normalizeResources(value: any): MCPDiscoveryResult["resources"] {
  if (!Array.isArray(value?.resources)) return [];
  return value.resources.map((resource: any) => ({
    uri: String(resource?.uri ?? ""),
    name: typeof resource?.name === "string" ? resource.name : undefined,
    description: typeof resource?.description === "string" ? resource.description : undefined,
  }));
}

function normalizePrompts(value: any): MCPDiscoveryResult["prompts"] {
  if (!Array.isArray(value?.prompts)) return [];
  return value.prompts.map((prompt: any) => ({
    name: String(prompt?.name ?? "Unknown prompt"),
    description: typeof prompt?.description === "string" ? prompt.description : undefined,
  }));
}
