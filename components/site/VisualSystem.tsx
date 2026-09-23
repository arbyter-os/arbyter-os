"use client";

import { useEffect, useRef, useState } from "react";

const MODES = {
  runtime: ["ORGANIZATION", "ARBYTER", "AGENTS", "TOOLS"],
  policy: ["HUMAN POLICY", "INTERPRET", "RUNTIME RULE", "ACTION"],
  security: ["IDENTITY", "PERMISSION", "RISK", "DECISION"],
  discovery: ["ENVIRONMENT", "DISCOVER", "CLASSIFY", "GOVERN"],
  command: ["INTENT", "UNDERSTAND", "COMMAND", "VERIFY"],
} as const;

type Mode = keyof typeof MODES;

export function RuntimeVisual({ mode = "runtime" }: { mode?: Mode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(1);
  const labels = MODES[mode];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height - 0.5) * -8}deg`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((v) => (v + 1) % 4), 2200);
    return () => window.clearInterval(timer);
  }, []);

  return <div ref={ref} className={`runtime-visual visual-${mode}`} aria-label="Arbyter runtime governance visual">
    <div className="visual-grid" />
    <div className="visual-orbit orbit-a" />
    <div className="visual-orbit orbit-b" />
    <div className="visual-orbit orbit-c" />
    <div className="visual-beam beam-a" />
    <div className="visual-beam beam-b" />
    <div className="visual-core"><span>ARBYTER</span><b>{mode === "runtime" ? "RUNTIME" : labels[1]}</b></div>
    {labels.map((label, i) => <div key={label} className={`visual-label l${i + 1} ${active === i ? "is-active" : ""}`}><i />{label}</div>)}
    <div className="visual-pulse" />
    <div className="visual-caption">01 / {mode.toUpperCase()} SYSTEM</div>
  </div>;
}

export function Flow({ items }: { items: string[] }) {
  return <div className="flow">{items.map((item, i) => <div className="flow-node" key={item}><span>0{i + 1}</span><strong>{item}</strong>{i < items.length - 1 && <i />}</div>)}</div>;
}
