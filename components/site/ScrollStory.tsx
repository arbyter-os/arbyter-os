"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { RuntimeVisual } from "@/components/site/VisualSystem";

type StoryStep = {
  eyebrow: string;
  title: string;
  body: string;
  mode?: "runtime" | "policy" | "security" | "discovery" | "command";
};

export function ScrollStory({
  steps,
  children,
}: {
  steps: StoryStep[];
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const travel = Math.max(el.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      const next = Math.min(steps.length - 1, Math.floor(progress * steps.length));
      setActive(next);
      frame = 0;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [steps.length]);

  const step = steps[active];

  return (
    <section ref={ref} className="scroll-story">
      <div className="scroll-story-sticky">
        <div className="scroll-story-visual">
          <RuntimeVisual mode={step.mode ?? "runtime"} />
        </div>
        <div className="scroll-story-copy">
          <div className="eyebrow">{step.eyebrow}</div>
          <h2 key={step.title}>{step.title}</h2>
          <p key={step.body}>{step.body}</p>
          <div className="scroll-story-index">
            {steps.map((item, i) => (
              <span key={item.eyebrow} className={i === active ? "active" : ""}>
                0{i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="scroll-story-line" aria-hidden="true">
          <span style={{ transform: `scaleY(${(active + 1) / steps.length})` }} />
        </div>
      </div>
      {children}
    </section>
  );
}
