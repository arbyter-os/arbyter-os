"use client";

import { useEffect, useRef, useState } from "react";
import { RuntimeVisual } from "@/components/site/VisualSystem";

const chapters = [
  { label: "01 / INTENT", title: "Start with what the organization means.", body: "Business intent becomes the source context for every governed action.", mode: "runtime" as const },
  { label: "02 / CONTEXT", title: "Understand the agent before it acts.", body: "Identity, capability, destination, tool and runtime context are evaluated together.", mode: "security" as const },
  { label: "03 / ENFORCEMENT", title: "Turn policy into a live boundary.", body: "A policy is useful when it can affect the action at the exact moment it happens.", mode: "policy" as const },
  { label: "04 / DECISION", title: "Allow. Block. Or ask a human.", body: "Arbyter makes the runtime decision and preserves the reasoning path for audit.", mode: "command" as const },
];

export function PlatformStory() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const travel = Math.max(el.offsetHeight - window.innerHeight, 1);
      setProgress(Math.min(1, Math.max(0, -rect.top / travel)));
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const index = Math.min(chapters.length - 1, Math.floor(progress * chapters.length));
  const active = chapters[index];

  return (
    <section ref={ref} className="platform-story">
      <div className="platform-story-sticky">
        <RuntimeVisual mode={active.mode} />
        <div className="platform-story-overlay" />
        <div className="platform-story-copy">
          <div className="eyebrow">{active.label}</div>
          <h2 key={active.title}>{active.title}</h2>
          <p key={active.body}>{active.body}</p>
        </div>
        <div className="platform-story-index">
          {chapters.map((item, i) => <span key={item.label} className={i === index ? "active" : ""}>{String(i + 1).padStart(2, "0")}</span>)}
        </div>
      </div>
    </section>
  );
}
