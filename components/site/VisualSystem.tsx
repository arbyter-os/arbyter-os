"use client";

import { useEffect, useRef } from "react";

export function RuntimeVisual({ mode = "runtime" }: { mode?: "runtime"|"policy"|"security"|"discovery"|"command" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width-.5;
      const y = (e.clientY-r.top)/r.height-.5;
      el.style.setProperty("--mx", `${x*18}px`);
      el.style.setProperty("--my", `${y*18}px`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);
  const labels = {
    runtime:["ORGANIZATION","ARBYTER","AGENTS","TOOLS"],
    policy:["HUMAN POLICY","INTERPRET","RUNTIME RULE","ACTION"],
    security:["IDENTITY","PERMISSION","RISK","DECISION"],
    discovery:["ENVIRONMENT","DISCOVER","CLASSIFY","GOVERN"],
    command:["INTENT","UNDERSTAND","COMMAND","VERIFY"],
  }[mode];
  return <div ref={ref} className="runtime-visual">
    <div className="visual-orbit orbit-a"/><div className="visual-orbit orbit-b"/>
    <div className="visual-core"><span>ARBYTER</span><b>RUNTIME</b></div>
    <div className="visual-path path-a"/><div className="visual-path path-b"/>
    <div className="visual-label l1">{labels[0]}</div>
    <div className="visual-label l2">{labels[1]}</div>
    <div className="visual-label l3">{labels[2]}</div>
    <div className="visual-label l4">{labels[3]}</div>
    <div className="visual-pulse"/>
  </div>;
}

export function Flow({ items }: { items: string[] }) {
  return <div className="flow">{items.map((item,i)=><div className="flow-node" key={item}><span>0{i+1}</span><strong>{item}</strong>{i<items.length-1&&<i/>}</div>)}</div>;
}
