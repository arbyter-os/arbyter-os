import { PageFrame } from "@/components/site/PageFrame";
import { DiscoveryExperience } from "@/components/site/DiscoveryExperience";

export default function AgentDiscovery() {
  return (
    <PageFrame
      eyebrow="AGENT DISCOVERY / 06"
      title={<>Find the workforce<br /><em>you didn't know existed.</em></>}
      intro="Discover agents and agent-like systems across APIs, MCP, cloud environments, internal infrastructure and AI platforms before governance becomes a guessing game."
    >
      <DiscoveryExperience />
    </PageFrame>
  );
}
