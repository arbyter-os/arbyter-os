import { ReactNode } from "react";

export type DeepSection = {
  eyebrow: string;
  title: string;
  body: ReactNode;
};

export function DeepContent({ sections }: { sections: DeepSection[] }) {
  return (
    <section className="resource-system">
      <div className="resource-index">
        {sections.map((section, index) => (
          <article key={section.eyebrow}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <small>{section.eyebrow}</small>
              <h2>{section.title}</h2>
              <div className="deep-copy">{section.body}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
