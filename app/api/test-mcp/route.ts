import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const method = body?.method;

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
          serverInfo: {
            name: "Arbyter Test MCP",
            version: "1.0.0",
          },
        },
      });
    }

    if (method === "notifications/initialized") {
      return new NextResponse(null, { status: 202 });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          tools: [
            {
              name: "search_company_data",
              description:
                "Search approved company data for testing Arbyter discovery.",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search query.",
                  },
                },
                required: ["query"],
              },
            },
            {
              name: "create_support_ticket",
              description:
                "Create a support ticket in the test environment.",
              inputSchema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                },
                required: ["title"],
              },
            },
            {
              name: "get_customer_profile",
              description:
                "Retrieve a customer profile from the test environment.",
              inputSchema: {
                type: "object",
                properties: {
                  customerId: {
                    type: "string",
                  },
                },
                required: ["customerId"],
              },
            },
          ],
        },
      });
    }

    if (method === "resources/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          resources: [
            {
              uri: "company://customers",
              name: "Customer Database",
              description: "Test customer data resource.",
              mimeType: "application/json",
            },
            {
              uri: "company://policies",
              name: "Company Policies",
              description: "Test company policy resource.",
              mimeType: "application/json",
            },
          ],
        },
      });
    }

    if (method === "prompts/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          prompts: [
            {
              name: "customer_support",
              description:
                "Assist with customer support workflows.",
            },
            {
              name: "company_research",
              description:
                "Research approved internal company information.",
            },
          ],
        },
      });
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: body.id ?? null,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32700,
          message: "Invalid JSON-RPC request.",
        },
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Arbyter Test MCP",
    version: "1.0.0",
    status: "online",
    message: "This is the Arbyter MCP discovery test server.",
  });
}