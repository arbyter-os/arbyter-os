"use client";

import { useEffect, useMemo, useState } from "react";

const sources = [
  { id: "mcp", label: "MCP", sub: "SERVERS", x: 10, y: 18 },
  { id: "api", label: "API", sub: "GATEWAYS", x: 8, y: 50 },
  { id: "cloud", label: "CLOUD", sub: "ENVIRONMENTS", x: 12, y: 82 },
  { id: "internal", label: "INTERNAL", sub: "SYSTEMS", x: 72, y: 12 },
  { id: "platform", label: "AI", sub: "PLATFORMS", x: 82, y: 43 },
  { id: "webhook", label: "WEBHOOK", sub: "NETWORK", x: 76, y: 78 },
];

const agents = [
  ["FIN-07", "FINANCE", "DATA EXPORT"],
  ["PEO-03", "PEOPLE", "DECISION"],
  ["OPS-12", "OPERATIONS", "READ"],
  ["SLS-21", "SALES", "CRM WRITE"],
  ["SUP-08", "SUPPORT", "CUSTOMER DATA"],
  ["ENG-14", "ENGINEERING", "DEPLOY"],
];

export function DiscoveryExperience() {
  const [phase, setPhase] = useState(0);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setPhase((value) => (value + 1) % 4), 2400);
    return () => window.clearInterval(timer);
  }, []);

  const phaseLabel = ["SCANNING", "DISCOVERED", "CLASSIFIED", "GOVERNED"][phase];
  const activeAgent = useMemo(() => agents[selected], [selected]);

  return (
    <section className="discovery-experience" aria-label="Interactive agent discovery system">
      <div className="discovery-stage">
        <div className="discovery-grid" aria-hidden="true" />
        <div className="discovery-rings" aria-hidden="true"><i /><i /><i /></div>

        {sources.map((source) => (
          <div
            className={\`discovery-source \${phase >= 1 ? "is-found" : ""}\`}
            style={{ left: \`\${source.x}%\`, top: \`\${source.y}%\` }}
            key={source.id}
          >
            <span>{source.label}</span>
            <small>{source.sub}</small>
            <b className={phase >= 1 ? "is-live" : ""}>{phase >= 1 ? "CONNECTED" : "SEARCHING"}</b>
          </div>
        ))}

        <div className={\`discovery-core phase-\${phase}\`}>
          <div className="discovery-core-inner">
            <span>ARBYTER</span>
            <strong>{phaseLabel}</strong>
            <small>{phase === 0 ? "MAPPING ENVIRONMENT" : phase === 1 ? "AGENTS IDENTIFIED" : phase === 2 ? "CAPABILITIES MAPPED" : "READY FOR GOVERNANCE"}</small>
          </div>
        </div>

        <div className="discovery-stream stream-a" aria-hidden="true" />
        <div className="discovery-stream stream-b" aria-hidden="true" />
        <div className="discovery-stream stream-c" aria-hidden="true" />

        <div className="discovery-count">
          <span>AGENTS FOUND</span>
          <strong>{phase === 0 ? "—" : "24"}</strong>
          <small>{phase >= 2 ? "CAPABILITIES MAPPED" : "LIVE DISCOVERY"}</small>
        </div>
      </div>

      <div className="discovery-control">
        <div>
          <span className="eyebrow">DISCOVERY → CLASSIFICATION → GOVERNANCE</span>
          <h2>Turn a hidden agent surface into a <em>governable map.</em></h2>
          <p>Arbyter discovers connected systems, identifies what they can reach, and moves them into the same runtime governance boundary.</p>
        </div>

        <div className="discovery-agent-map">
          <div className="discovery-agent-head">
            <span>DISCOVERED WORKFORCE</span>
            <b>{phase >= 1 ? "24 SYSTEMS" : "SEARCHING"}</b>
          </div>
          <div className="discovery-agent-list">
            {agents.map((agent, index) => (
              <button type="button" className={selected === index ? "is-selected" : ""} onClick={() => setSelected(index)} key={agent[0]}>
                <span>{agent[0]}</span><strong>{agent[1]}</strong><small>{agent[2]}</small>
              </button>
            ))}
          </div>
          <div className="discovery-agent-detail">
            <span>CAPABILITY PROFILE / {activeAgent[0]}</span>
            <strong>{activeAgent[1]} / {activeAgent[2]}</strong>
            <p>{phase >= 2 ? "Identity, capability and connection context mapped for runtime governance." : "Waiting for discovery classification."}</p>
          </div>
        </div>
      </div>

      <style jsx global>{\`
        .discovery-experience{position:relative;margin:0 0 8rem}
        .discovery-stage{position:relative;height:min(78vh,760px);min-height:620px;overflow:hidden;border-top:1px solid rgba(255,255,255,.09);border-bottom:1px solid rgba(255,255,255,.09);background:radial-gradient(circle at 50% 50%,rgba(72,82,255,.13),transparent 30%),#030307}
        .discovery-grid{position:absolute;inset:0;opacity:.32;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:72px 72px;mask-image:radial-gradient(circle at center,#000 0,transparent 78%)}
        .discovery-rings{position:absolute;left:50%;top:50%;width:460px;height:460px;transform:translate(-50%,-50%);pointer-events:none}
        .discovery-rings i{position:absolute;inset:0;border:1px solid rgba(130,138,255,.16);border-radius:50%;animation:discovery-ring 8s linear infinite}
        .discovery-rings i:nth-child(2){inset:14%;animation-duration:6s;animation-direction:reverse}
        .discovery-rings i:nth-child(3){inset:28%;animation-duration:4s}
        @keyframes discovery-ring{to{transform:rotate(360deg)}}
        .discovery-source{position:absolute;transform:translate(-50%,-50%);width:150px;padding:13px 14px;border:1px solid rgba(255,255,255,.12);background:rgba(8,8,14,.72);backdrop-filter:blur(12px);transition:.5s ease;z-index:2}
        .discovery-source span{display:block;font:600 11px/1.1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.14em}
        .discovery-source small{display:block;margin-top:5px;color:rgba(255,255,255,.46);font:10px/1.2 ui-monospace,SFMono-Regular,monospace;letter-spacing:.1em}
        .discovery-source b{display:block;margin-top:11px;color:rgba(255,255,255,.3);font:9px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.12em}
        .discovery-source b.is-live{color:#cdd1ff}
        .discovery-core{position:absolute;left:50%;top:50%;width:260px;height:260px;transform:translate(-50%,-50%);border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fff 0,rgba(186,192,255,.9) 5%,rgba(73,83,255,.55) 19%,rgba(20,0,186,.18) 43%,transparent 68%);box-shadow:0 0 90px rgba(65,75,255,.22);z-index:3}
        .discovery-core:before{content:"";position:absolute;inset:12px;border:1px solid rgba(255,255,255,.24);border-radius:50%;animation:discovery-pulse 2.4s ease-in-out infinite}
        @keyframes discovery-pulse{50%{transform:scale(1.04);opacity:.5}}
        .discovery-core-inner{text-align:center;position:relative}
        .discovery-core-inner span{display:block;font:700 13px/1 ui-monospace,SFMono-Regular,monospace;letter-spacing:.22em}
        .discovery-core-inner strong{display:block;margin-top:13px;font-size:25px;letter-spacing:-.04em}
        .discovery-core-inner small{display:block;margin:8px auto 0;max-width:150px;color:rgba(255,255,255,.55);font:9px/1.45 ui-monospace,SFMono-Regular,monospace;letter-spacing:.08em}
        .discovery-stream{position:absolute;left:50%;top:50%;height:1px;width:44%;transform-origin:left center;background:linear-gradient(90deg,rgba(255,255,255,.02),rgba(160,168,255,.8),rgba(255,255,255,.02));opacity:.6;animation:discovery-stream 2.2s linear infinite}
        .stream-a{transform:rotate(18deg)}.stream-b{transform:rotate(155deg);animation-delay:.7s}.stream-c{transform:rotate(280deg);animation-delay:1.3s}
        @keyframes discovery-stream{0%{scale:0 1;opacity:0}25%{opacity:.8}100%{scale:1 1;opacity:0}}
        .discovery-count{position:absolute;right:5%;bottom:6%;text-align:right}
        .discovery-count span,.discovery-count small{display:block;color:rgba(255,255,255,.4);font:9px/1.4 ui-monospace,SFMono-Regular,monospace;letter-spacing:.14em}
        .discovery-count strong{display:block;font-size:52px;letter-spacing:-.07em}
        .discovery-control{display:grid;grid-template-columns:1fr 1fr;gap:5rem;padding:6rem 5vw 0}
        .discovery-control h2{max-width:720px;margin:1rem 0;font-size:clamp(2.2rem,4.4vw,4.8rem);line-height:.96;letter-spacing:-.055em}
        .discovery-control h2 em{font-style:normal;background:linear-gradient(100deg,#fff 10%,#9ba4ff 75%,#fff);background-clip:text;-webkit-background-clip:text;color:transparent}
        .discovery-control p{max-width:650px;color:rgba(255,255,255,.56);font-size:1.05rem;line-height:1.7}
        .discovery-agent-map{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025)}
        .discovery-agent-head{display:flex;justify-content:space-between;padding:17px 20px;border-bottom:1px solid rgba(255,255,255,.08);font:10px ui-monospace,SFMono-Regular,monospace;letter-spacing:.12em}
        .discovery-agent-head b{color:#cbd0ff}
        .discovery-agent-list{display:grid;grid-template-columns:1fr 1fr}
        .discovery-agent-list button{appearance:none;text-align:left;padding:16px;border:0;border-right:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);background:transparent;color:white;cursor:pointer}
        .discovery-agent-list button.is-selected{background:rgba(121,130,255,.1)}
        .discovery-agent-list span,.discovery-agent-list small{display:block;color:rgba(255,255,255,.4);font:9px ui-monospace,SFMono-Regular,monospace;letter-spacing:.1em}
        .discovery-agent-list strong{display:block;margin:7px 0 4px;font-size:13px}
        .discovery-agent-detail{padding:20px;background:rgba(0,0,0,.22)}
        .discovery-agent-detail span{font:9px ui-monospace,SFMono-Regular,monospace;color:rgba(255,255,255,.4);letter-spacing:.1em}
        .discovery-agent-detail strong{display:block;margin-top:9px}
        .discovery-agent-detail p{margin:7px 0 0;font-size:12px;line-height:1.5}
        @media(max-width:800px){.discovery-stage{height:650px;min-height:650px}.discovery-source{width:105px;padding:10px}.discovery-source:nth-of-type(4),.discovery-source:nth-of-type(5),.discovery-source:nth-of-type(6){display:none}.discovery-core{width:210px;height:210px}.discovery-control{grid-template-columns:1fr;gap:2.5rem;padding-top:4rem}.discovery-count{right:4%;bottom:4%}.discovery-agent-list{grid-template-columns:1fr}.discovery-agent-list button{border-right:0}}
        @media(prefers-reduced-motion:reduce){.discovery-rings i,.discovery-core:before,.discovery-stream{animation:none}}
      \`}
      </style>
    </section>
  );
}
