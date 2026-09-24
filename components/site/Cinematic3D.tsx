"use client";

import { useEffect, useRef, useState } from "react";
import ArbyterWorld from "@/components/ArbyterWorld";

const chapters = [
  { at: 0.0, eyebrow: "01 / THE WORKFORCE", title: "Agents are already moving.", body: "Research. Finance. Support. Engineering. Each one can reason, call tools and cross business boundaries." },
  { at: 0.34, eyebrow: "02 / THE BOUNDARY", title: "Bring every action through one layer.", body: "Arbyter sits between organizational intent and the systems an agent can reach." },
  { at: 0.68, eyebrow: "03 / THE DECISION", title: "The action gets decided at runtime.", body: "Policy and context become a live decision: allow, block, or require human approval." },
  { at: 0.9, eyebrow: "04 / THE RECORD", title: "Every decision leaves a trace.", body: "Governed execution becomes auditable instead of invisible." },
];

export function Cinematic3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setProgress(0);
      setChapter(0);
      return;
    }

    let frame = 0;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      const next = Math.min(1, Math.max(0, -rect.top / travel));
      setProgress(next);
      let nextChapter = 0;
      for (let i = 0; i < chapters.length; i += 1) {
        if (next >= chapters[i].at) nextChapter = i;
      }
      setChapter(nextChapter);
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const active = chapters[chapter];

  return (
    <section ref={sectionRef} className="cinematic-3d">
      <div className="cinematic-sticky">
        <ArbyterWorld progress={progress} />
        <div className="cinematic-vignette" />
        <div className="cinematic-copy" aria-live="polite">
          <div className="eyebrow">{active.eyebrow}</div>
          <h2>{active.title}</h2>
          <p>{active.body}</p>
          <div className="cinematic-chapter-index" aria-label="Cinematic chapters">
            {chapters.map((item, index) => (
              <span key={item.eyebrow} className={index === chapter ? "active" : ""}>
                {String(index + 1).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
        <div className="cinematic-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <div className="cinematic-meta">SCROLL / RUNTIME GOVERNANCE</div>
      </div>
    </section>
  );
}
