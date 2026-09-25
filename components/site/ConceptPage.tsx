import { PageFrame } from "@/components/site/PageFrame";

export type ConceptPageData = {
  eyebrow: string; title: string; intro: string; statement: string;
  steps: { label: string; title: string; body: string }[];
  facts: { label: string; value: string }[];
  details?: { title: string; body: string }[];
};

export function ConceptPage({ data }: { data: ConceptPageData }) {
  return (
    <PageFrame eyebrow={data.eyebrow} title={<>{data.title}</>} intro={data.intro}>
      <section className="concept-system">
        <div className="concept-statement"><span>ARBYTER / SYSTEM VIEW</span><h2>{data.statement}</h2></div>
        <div className="concept-flow" aria-label="Arbyter system flow">
          {data.steps.map((step, index) => (
            <div className="concept-node" key={step.label}>
              <span>0{index + 1} / {step.label}</span><strong>{step.title}</strong><p>{step.body}</p>
              {index < data.steps.length - 1 && <div className="concept-link" aria-hidden="true" />}
            </div>
          ))}
        </div>
        <div className="concept-facts">{data.facts.map((fact) => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>
        {data.details?.length ? <section className="concept-depth" aria-label="Detailed explanation">{data.details.map((detail) => <article key={detail.title}><span>ARBYTER / DETAIL</span><h3>{detail.title}</h3><p>{detail.body}</p></article>)}</section> : null}
      </section>
    </PageFrame>
  );
}