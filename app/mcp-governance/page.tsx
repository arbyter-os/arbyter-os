import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function MCPGovernance(){return <PageFrame eyebrow="MCP GOVERNANCE / 10" title={<>Govern the tools<br/><em>agents can reach.</em></>} intro="MCP expands what agents can access. Arbyter provides a governance boundary around those connections, permissions and actions.">
<ScrollStory steps={[
{eyebrow:"01 / CONNECTION",title:"An agent reaches an MCP server.",body:"MCP provides a standardized path from an agent to tools and connected systems.",mode:"discovery"},
{eyebrow:"02 / TOOL",title:"The connection exposes capability.",body:"The governance question is no longer only whether the connection works, but what the agent can do through it.",mode:"command"},
{eyebrow:"03 / POLICY",title:"The action meets organizational rules.",body:"Identity, permissions and policy become part of the runtime evaluation.",mode:"policy"},
{eyebrow:"04 / DECISION",title:"The tool call gets a boundary.",body:"Arbyter can allow, block or require approval before the governed action executes.",mode:"security"},
]} />
<section className="dark-section"><div className="eyebrow">MCP RUNTIME MODEL</div><Flow items={["Agent","MCP server","Tool","Requested action","Arbyter decision"]}/><div className="mcp-architecture"><span>IDENTITY</span><span>PERMISSIONS</span><span>POLICY</span><span>AUDIT</span></div></section>
<section className="editorial-section"><div><div className="eyebrow">INTEGRATION MODEL</div><h2>MCP is the connection layer. Governance is the boundary.</h2></div><p>Connect MCP-enabled agents while keeping organizational intent, permissions and runtime decisions visible in one control model.</p></section>
</PageFrame>}