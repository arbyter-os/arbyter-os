import { PageFrame } from "@/components/site/PageFrame";

const items = [{"name":"Finance","body":"Govern financial data access, payment actions, external destinations, and separation-of-duties controls.","tags":"finance · data · payments"},{"name":"HR","body":"Route high-impact employee decisions through required human review and protect sensitive workforce data.","tags":"HR · human oversight"},{"name":"Engineering","body":"Govern deployment, infrastructure, repository, and production-tool actions.","tags":"engineering · deployment"},{"name":"Sales","body":"Control CRM writes, customer data access, and external communications by policy.","tags":"sales · CRM"},{"name":"Support","body":"Govern customer-record access and actions taken across support systems.","tags":"support · customer data"},{"name":"Operations","body":"Allow approved operational automation while keeping sensitive tools and workflows bounded.","tags":"operations · automation"}];

export default function Page() {
  return <PageFrame eyebrow="AI GOVERNANCE ACROSS THE ENTERPRISE" title={<>AI governance across the enterprise</>} intro="See how the same runtime governance layer can apply different organizational boundaries to different functions.">
    <section className="resource-system">
      <div className="resource-index">{items.map((item, i) => <article key={item.name}><span>0{i+1}</span><div><h2>{item.name}</h2><p>{item.body}</p><small>{item.tags}</small></div></article>)}</div>
    </section>
  </PageFrame>;
}