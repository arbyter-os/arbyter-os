import { PageFrame } from "@/components/site/PageFrame";
import { Flow } from "@/components/site/VisualSystem";
import { ScrollStory } from "@/components/site/ScrollStory";

export default function MCPGovernance(){return <PageFrame eyebrow="MCP GOVERNANCE / 10" title={<>Govern the tools<br/><em>agents can reach.</em></>} intro="MCP expands what agents can access. Arbyter provides a governance boundary around those connections, permissions and actions.">
<section className="dark-section"><div className="eyebrow">MCP RUNTIME MODEL</div><Flow items={["Agent","MCP server","Tool","Requested action","Arbyter decision"]}/><div className="mcp-architecture"><span>IDENTITY</span><span>PERMISSIONS</span><span>POLICY</span><span>AUDIT</span></div></section>
<section className="editorial-section"><div><div className="eyebrow">INTEGRATION MODEL</div><h2>MCP is the connection layer. Governance is the boundary.</h2></div><p>Connect MCP-enabled agents while keeping organizational intent, permissions and runtime decisions visible in one control model.</p></section>
</PageFrame>}
