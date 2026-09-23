"use client";

import { useEffect, useState } from "react";

const layers = [
  { label: "ORGANIZATION", detail: "Intent + policy", className: "arch-org" },
  { label: "ARBYTER", detail: "Interpret + evaluate", className: "arch-core" },
  { label: "AGENTS", detail: "Reason + act", className: "arch-agents" },
  { label: "TOOLS", detail: "APIs + MCP + systems", className: "arch-tools" },
];

export function RuntimeArchitecture() {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((v) => (v + 1) % layers.length), 1800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="runtime-architecture" aria-label="Arbyter runtime architecture">
      <div className="arch-space" />
      <div className="arch-floor" />
      {layers.map((layer, i) => (
        <div key={layer.label} className={"arch-layer " + layer.className + (active === i ? " arch-active" : "")}>
          <span>{layer.label}</span><b>{layer.detail}</b>
        </div>
      ))}
      <div className="arch-connector c1" />
      <div className="arch-connector c2" />
      <div className="arch-connector c3" />
      <div className="arch-decision">
        <small>RUNTIME DECISION</small>
        <strong>{active === 3 ? "ALLOW" : active === 2 ? "EVALUATE" : active === 0 ? "INTENT" : "ARBYTER"}</strong>
      </div>
      <div className="arch-caption">ORGANIZATION → GOVERNANCE → EXECUTION</div>
    </div>
  );
}
