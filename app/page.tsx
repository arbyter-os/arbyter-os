"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const BLUE = "#1300BA";

const LOGO = (
  <div className="h-full w-full overflow-hidden rounded-[6px] bg-black">
    <img src="/arbyter-logo.svg" alt="Arbyter" className="h-full w-full object-contain" />
  </div>
);

type Agent = { name: string; x: number; y: number; z: number; speed: number; phase: number };

const STARS = Array.from({ length: 220 }, (_, i) => ({
  x: ((i * 83) % 2000) - 1000,
  y: ((i * 137) % 1200) - 600,
  z: (i * 197) % 3400 + 120,
  size: i % 4 === 0 ? 1.7 : 0.8,
  phase: i * 0.73,
}));

const AGENTS: Agent[] = [
  { name: "Research", x: -520, y: -160, z: 500, speed: 0.9, phase: 0.2 },
  { name: "Sales", x: 430, y: -210, z: 720, speed: 0.7, phase: 1.4 },
  { name: "Finance", x: -650, y: 120, z: 930, speed: 0.55, phase: 2.1 },
  { name: "HR", x: 600, y: 170, z: 1120, speed: 0.45, phase: 2.8 },
  { name: "Support", x: -280, y: 280, z: 1380, speed: 0.8, phase: 3.4 },
  { name: "Operations", x: 300, y: -40, z: 1650, speed: 0.62, phase: 4.1 },
  { name: "Analytics", x: -760, y: -20, z: 1950, speed: 0.5, phase: 4.8 },
  { name: "Engineering", x: 760, y: 40, z: 2250, speed: 0.72, phase: 5.4 },
  { name: "Legal", x: -420, y: -260, z: 2600, speed: 0.58, phase: 6.1 },
  { name: "Marketing", x: 500, y: 250, z: 3000, speed: 0.65, phase: 6.7 },
];

function World({ progress }: { progress: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = c.getContext("2d");
    if (!x) return;

    let raf = 0;
    let t = 0;

    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      c.width = window.innerWidth * d;
      c.height = window.innerHeight * d;
      x.setTransform(d, 0, 0, d, 0, 0);
    };

    const project = (a: number, b: number, z: number, cam: number) => {
      const depth = Math.max(90, z - cam);
      const s = 820 / depth;
      return { x: window.innerWidth / 2 + a * s, y: window.innerHeight / 2 + b * s, s, depth };
    };

    const line = (a: { x: number; y: number }, b: { x: number; y: number }, alpha: number, width = 1) => {
      x.strokeStyle = `rgba(76,66,190,${alpha})`;
      x.lineWidth = width;
      x.beginPath();
      x.moveTo(a.x, a.y);
      x.lineTo(b.x, b.y);
      x.stroke();
    };

    const draw = () => {
      t += 0.012;
      const p = Math.max(0, Math.min(1, progress));
      const cam = p * 3900 - 300;
      const w = window.innerWidth;
      const h = window.innerHeight;
      x.clearRect(0, 0, w, h);

      const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.78);
      g.addColorStop(0, p > 0.62 ? "rgba(130,120,245,.34)" : "rgba(110,130,255,.24)");
      g.addColorStop(0.28, "rgba(238,242,255,.92)");
      g.addColorStop(0.68, "rgba(220,227,246,.98)");
      g.addColorStop(1, "#f7f9fd");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);

      STARS.forEach((s) => {
        const q = project(s.x, s.y, s.z, cam);
        if (q.depth > 80 && q.depth < 4200) {
          const tw = 0.18 + 0.28 * (Math.sin(t * 1.4 + s.phase) + 1);
          x.fillStyle = `rgba(19,0,186,${tw})`;
          x.beginPath();
          x.arc(q.x, q.y, Math.max(0.35, s.size * q.s), 0, Math.PI * 2);
          x.fill();
        }
      });

      for (let z = Math.floor(cam / 180) * 180; z < cam + 2500; z += 180) {
        line(project(-1300, 430, z, cam), project(1300, 430, z, cam), 0.045);
      }
      for (let a = -1200; a <= 1400; a += 180) {
        line(project(a, -450, cam + 250, cam), project(a, 450, cam + 2000, cam), 0.022);
      }

      const center = project(0, 0, 1080, cam);
      const pts = AGENTS.map((a, i) => {
        const dx = Math.sin(t * a.speed + a.phase) * 75;
        const dy = Math.cos(t * a.speed * 0.8 + a.phase) * 45;
        return { ...a, i, ...project(a.x + dx, a.y + dy, a.z, cam) };
      }).filter((a) => a.depth > 80 && a.depth < 3300).sort((a, b) => b.depth - a.depth);

      pts.forEach((a, i) => {
        line(a, center, 0.09 + (Math.sin(t * 2 + i) + 1) * 0.025, Math.max(0.5, a.s));
        const q = (t * 0.18 + i * 0.13) % 1;
        x.fillStyle = "rgba(19,0,186,.42)";
        x.beginPath();
        x.arc(a.x + (center.x - a.x) * q, a.y + (center.y - a.y) * q, Math.max(1, 2 * a.s), 0, Math.PI * 2);
        x.fill();
      });

      const cs = Math.min(2.3, Math.max(0.7, 820 / Math.max(180, 1080 - cam)));
      const cw = 175 * cs;
      const ch = 110 * cs;
      x.save();
      x.translate(center.x, center.y);
      x.rotate(Math.sin(t * 0.4) * 0.07);
      x.fillStyle = "rgba(255,255,255,.94)";
      x.strokeStyle = "rgba(19,0,186,.30)";
      x.lineWidth = 1.5;
      x.shadowBlur = 42;
      x.shadowColor = "rgba(19,0,186,.28)";
      x.beginPath();
      x.roundRect(-cw / 2, -ch / 2, cw, ch, 28);
      x.fill();
      x.stroke();
      x.shadowBlur = 0;
      x.strokeStyle = "rgba(19,0,186,.10)";
      x.beginPath();
      x.roundRect(-cw / 2 + 8, -ch / 2 + 8, cw - 16, ch - 16, 20);
      x.stroke();
      x.restore();

      if (p > 0.43 && p < 0.84) {
        const e = project(0, -70, 2070, cam);
        const r = 115 * e.s + Math.sin(t * 3) * 4;
        x.strokeStyle = "rgba(19,0,186,.5)";
        x.beginPath();
        x.arc(e.x, e.y, r, 0, Math.PI * 2);
        x.stroke();
        x.beginPath();
        x.arc(e.x, e.y, r * 0.68, 0, Math.PI * 2);
        x.stroke();
        x.fillStyle = BLUE;
        x.beginPath();
        x.arc(e.x, e.y, Math.max(2, 7 * e.s), 0, Math.PI * 2);
        x.fill();
      }

      pts.forEach((a) => {
        const s = Math.max(0.25, Math.min(1.6, a.s * 1.4));
        const ww = 112 * s;
        const hh = 58 * s;
        const blocked = p > 0.5 && a.name === "HR";
        x.save();
        x.translate(a.x, a.y);
        x.globalAlpha = Math.min(1, 0.25 + a.s * 1.1);
        x.fillStyle = blocked ? "rgba(19,0,186,.16)" : "rgba(255,255,255,.58)";
        x.strokeStyle = blocked ? "rgba(19,0,186,.7)" : "rgba(255,255,255,.7)";
        x.lineWidth = blocked ? 1.5 : 1;
        x.shadowBlur = blocked ? 28 : 18;
        x.shadowColor = "rgba(19,0,186,.25)";
        x.beginPath();
        x.roundRect(-ww / 2, -hh / 2, ww, hh, 12 * s);
        x.fill();
        x.stroke();
        x.shadowBlur = 0;
        x.textAlign = "center";
        x.fillStyle = "#111322";
        x.font = `700 ${Math.max(7, 10 * s)}px system-ui`;
        x.fillText(a.name, 0, 2 * s);
        x.fillStyle = blocked ? BLUE : "rgba(17,19,34,.48)";
        x.font = `600 ${Math.max(5, 6 * s)}px system-ui`;
        x.fillText(blocked ? "ACTION BLOCKED" : "ACTIVE", 0, 15 * s);
        x.restore();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [progress]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}


function Intro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"ground" | "ready" | "warp">("ground");
  const [camera, setCamera] = useState(0);
  const raf = useRef<number | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const startedAt = performance.now();
    const duration = 5200;
    const animate = (now: number) => {
      const p = Math.min(1, (now - startedAt) / duration);
      const eased = p < 0.72 ? (p / 0.72) * 0.52 : 0.52 + ((p - 0.72) / 0.28) * 0.48;
      setCamera(eased);
      if (p < 1) raf.current = requestAnimationFrame(animate);
      else setPhase("ready");
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  const enter = () => {
    if (phase !== "ready" || started.current) return;
    started.current = true;
    setPhase("warp");
    window.setTimeout(onDone, 1750);
  };

  const orbScale = 0.18 + camera * 0.82;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#020207]" onClick={phase === "ready" ? enter : undefined}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,#10152d_0%,#050711_38%,#010105_76%,#000_100%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ perspective: "900px" }}>
        <div className="absolute left-1/2 top-[52%] h-[120vh] w-[180vw] -translate-x-1/2" style={{
          transform: "translateX(-50%) rotateX(64deg)",
          transformOrigin: "50% 0%",
          opacity: 0.62,
        }}>
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.11) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.11) 1px, transparent 1px)",
            backgroundSize: "100px 100px",
            maskImage: "linear-gradient(to bottom, transparent 0%, #000 22%, #000 62%, transparent 100%)",
          }} />
        </div>
        <div className="absolute left-1/2 top-[52%] h-px w-[140vw] -translate-x-1/2 bg-white/20" />
      </div>

      <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{
        background: "radial-gradient(circle, rgba(19,0,186,.25), rgba(0,130,255,.08) 32%, transparent 68%)",
        filter: "blur(50px)",
        transform: `translate(-50%, -50%) scale(${0.65 + camera * 1.1})`,
      }} />

      <div className="absolute left-1/2 top-1/2" style={{
        width: "min(620px, 72vw)",
        height: "min(620px, 72vw)",
        transform: `translate(-50%, -50%) scale(${phase === "warp" ? 8 : orbScale})`,
        opacity: phase === "warp" ? 0 : 1,
        transition: phase === "warp" ? "transform 1.15s cubic-bezier(.04,.78,.08,1), opacity .7s ease" : "none",
      }}>
        <div className="absolute inset-[-18%] rounded-full" style={{
          background: "radial-gradient(circle, rgba(19,0,186,.30), rgba(0,180,255,.12) 40%, transparent 70%)",
          filter: "blur(35px)",
        }} />

        <div className="absolute inset-0 overflow-hidden rounded-full" style={{
          background: "radial-gradient(circle at 38% 28%, rgba(255,255,255,.24), transparent 20%), radial-gradient(circle at 50% 50%, rgba(255,255,255,.98) 0%, rgba(255,255,255,.92) 42%, rgba(238,248,255,.85) 68%, rgba(255,255,255,1) 100%)",
          border: "1px solid rgba(255,255,255,.72)",
          boxShadow: "inset 18px 18px 45px rgba(255,255,255,.08), inset -25px -30px 60px rgba(0,0,0,.55), 0 0 80px rgba(255,255,255,.55), 0 0 180px rgba(190,225,255,.35)",
          backdropFilter: "blur(7px)",
        }}>
          <div className="absolute inset-[8%] rounded-full" style={{
            background: "radial-gradient(ellipse at 40% 38%, rgba(255,255,255,.98), transparent 11%), radial-gradient(ellipse at 62% 52%, rgba(235,248,255,.95), transparent 28%), radial-gradient(ellipse at 35% 68%, rgba(255,255,255,.9), transparent 20%), radial-gradient(circle, rgba(255,255,255,.9), rgba(210,235,255,.45) 65%, transparent 80%)",
            filter: "blur(8px)",
            animation: "orbPulse 3.5s ease-in-out infinite alternate",
          }} />

          <svg viewBox="0 0 600 600" className="absolute inset-[8%] h-[84%] w-[84%]" style={{ transform: `rotate(${camera * 55}deg)` }}>
            <g fill="none" strokeLinecap="round" filter="url(#plasmaGlow)">
              <path d="M85 300 C170 130 255 470 330 245 C405 25 475 280 515 170" stroke="#42ddff" strokeWidth="3" opacity=".8" />
              <path d="M70 390 C190 300 200 120 350 190 C455 240 420 410 530 350" stroke="#ffffff" strokeWidth="5" opacity=".75" />
              <path d="M105 160 C210 245 245 390 355 335 C440 290 465 135 510 255" stroke="#8cf4ff" strokeWidth="2" opacity=".72" />
              <path d="M110 470 C205 405 280 510 350 400 C430 275 440 430 500 455" stroke="#eaf8ff" strokeWidth="3" opacity=".8" />
            </g>
            <defs><filter id="plasmaGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          </svg>

          <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full" style={{ transform: `rotate(${-camera * 20}deg)` }}>
            <g fill="none" stroke="rgba(110,225,255,.55)" strokeWidth="1.2">
              <circle cx="300" cy="300" r="235" /><circle cx="300" cy="300" r="205" opacity=".45" /><circle cx="300" cy="300" r="170" opacity=".3" />
              <path d="M80 240 H170 L205 205 H285" /><path d="M520 365 H420 L390 395 H315" />
              <path d="M245 65 V145 L220 170" /><path d="M355 535 V445 L380 420" />
              <path d="M130 330 H190 L220 360 H300" /><path d="M470 270 H410 L375 235 H300" />
              <path d="M180 120 L230 170" /><path d="M420 480 L370 430" />
            </g>
            <g fill="#72eaff"><circle cx="170" cy="240" r="3" /><circle cx="420" cy="365" r="3" /><circle cx="245" cy="145" r="2.5" /><circle cx="390" cy="395" r="2.5" /><circle cx="190" cy="330" r="2" /><circle cx="410" cy="270" r="2" /></g>
          </svg>

          <div className="absolute left-[12%] top-[10%] h-[38%] w-[30%] rounded-full bg-white/10 blur-2xl" style={{ transform: "rotate(-25deg)" }} />
          <div className="absolute inset-[3%] rounded-full border border-white/15" />
          <div className="absolute inset-[7%] rounded-full border border-cyan-200/10" />
        </div>

        <div className="absolute inset-[-6%] rounded-full border border-cyan-200/20" style={{ transform: `rotateX(68deg) rotateZ(${camera * 55}deg)` }} />
        <div className="absolute inset-[-11%] rounded-full border border-[#1300BA]/30" style={{ transform: `rotateX(68deg) rotateZ(${-camera * 75}deg)` }} />

        <button aria-label="Enter Arbyter" onClick={(e) => { e.stopPropagation(); enter(); }} className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-black/20 px-10 py-4 text-[11px] font-semibold tracking-[.5em] text-white backdrop-blur-xl" style={{
          opacity: phase === "ready" ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${phase === "ready" ? 1 : .6})`,
          pointerEvents: phase === "ready" ? "auto" : "none",
          transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.8,.2,1)",
          animation: phase === "ready" ? "enterPulse 2s ease-in-out infinite" : "none",
        }}>ENTER</button>
      </div>

      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 80 }).map((_, i) => {
          const angle = (360 / 80) * i;
          const length = 20 + (i % 9) * 8;
          return <span key={i} className="absolute left-1/2 top-1/2 h-[1.5px] origin-left rounded-full" style={{
            width: `${length}vw`,
            background: "linear-gradient(90deg, rgba(255,255,255,.95), rgba(60,190,255,.65), transparent)",
            filter: "blur(1px)",
            transform: `rotate(${angle}deg) scaleX(${phase === "warp" ? 7 : 0})`,
            opacity: phase === "warp" ? .9 : 0,
            transition: `transform ${.65 + (i % 8) * .035}s cubic-bezier(.03,.82,.08,1) ${i * 3}ms, opacity .2s ease`,
          }} />;
        })}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0,1,2,3,4,5].map((i) => <div key={i} className="absolute left-1/2 top-1/2 rounded-full border border-cyan-100/40" style={{
          width: `${120 + i * 130}px`, height: `${120 + i * 130}px`,
          transform: `translate(-50%, -50%) scale(${phase === "warp" ? 9 : .05})`,
          opacity: phase === "warp" ? .8 - i * .1 : 0,
          transition: `transform ${1 + i * .08}s cubic-bezier(.03,.8,.06,1) ${i * 35}ms, opacity .35s ease`,
          boxShadow: "0 0 30px rgba(40,200,255,.22)",
        }} />)}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{
        transform: `translate(-50%, -50%) scale(${phase === "warp" ? 130 : 0})`,
        opacity: phase === "warp" ? 1 : 0,
        transition: "transform 1.25s cubic-bezier(.02,.76,.05,1), opacity .8s ease",
        boxShadow: "0 0 100px 60px rgba(80,210,255,.8), 0 0 260px 110px rgba(255,255,255,.7)",
      }} />

      <div className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: phase === "warp" ? 1 : 0, transition: "opacity .2s ease 1.35s" }} />

      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at center, transparent 25%, rgba(0,0,0,.25) 62%, rgba(0,0,0,.88) 100%)" }} />

      <style jsx>{`
        @keyframes orbPulse {
          0% { transform: scale(.96) rotate(0deg); opacity: .65; }
          100% { transform: scale(1.06) rotate(8deg); opacity: 1; }
        }
        @keyframes enterPulse {
          0%,100% { box-shadow: 0 0 25px rgba(0,190,255,.25), inset 0 0 20px rgba(255,255,255,.04); }
          50% { box-shadow: 0 0 55px rgba(0,210,255,.55), inset 0 0 28px rgba(255,255,255,.1); }
        }
      `}</style>
    </div>
  );
}
const STAGES = [
  ["DISCOVER", "DISCOVER EVERY AGENT.", "Find AI agents, tools and workflows across your organization before they become invisible infrastructure."],
  ["THE AI WORKFORCE IS MOVING", "COMMAND YOUR WORKFORCE.", "One command layer between your organization and every agent, tool and action."],
  ["COMMAND", "SAY IT. ARBYTER MOVES IT.", "Tell the workforce what you want. Arbyter turns natural language into operational intent."],
  ["GOVERN · CONTROL", "WORDS BECOME RUNTIME CONTROL.", "Business rules become permissions, approval gates and enforceable runtime controls."],
  ["INTERCEPT", "THE ACTION HITS THE BOUNDARY.", "An agent attempts an action outside policy. Arbyter stops it before the system does."],
  ["ENFORCE", "POLICY CHANGES. THE WORKFORCE CHANGES.", "A regulatory change propagates through the workforce. Affected agents change state automatically."],
  ["AUDIT · VISIBILITY · CONTROL", "ONE WORKFORCE. ONE COMMAND LAYER.", "Every action remains observable, governable and under organizational control."],
  ["AI GOVERNANCE · SECURITY", "BUILT FOR THE AI WORKFORCE.", "AI agent governance, AI security, agent control, policy enforcement, compliance and runtime oversight."],
  ["ARBYTER OS", "ENTER THE COMMAND LAYER.", "Orchestrate. Govern. Secure. Control your AI workforce from one place."],
] as const;

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(window.scrollY / max);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  const stage = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));

  return (
    <main className="min-h-[920vh] bg-[#f7f9fd] text-[#111322]">
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}

      <div className={introDone ? "opacity-100 transition-opacity duration-700" : "opacity-0"}>
        <header className="fixed left-0 right-0 top-0 z-50 flex h-[72px] items-center justify-between px-6 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-9">{LOGO}</div>
            <div className="hidden md:block">
              <b className="text-sm">ARBYTER OS</b>
              <div className="text-[7px] tracking-[.3em] text-black/35">COMMAND LAYER</div>
            </div>
          </Link>
          <Link href="/login" className="pointer-events-auto rounded-full border border-[#1300BA]/15 bg-white/55 px-5 py-2.5 text-xs text-[#111322] shadow-[0_10px_35px_rgba(19,0,186,.08)] backdrop-blur-xl hover:bg-[#1300BA] hover:text-white">
            Enter
          </Link>
        </header>

        <div className="fixed inset-0 z-0"><World progress={progress} /></div>

        <div className="pointer-events-none fixed bottom-7 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-full border border-[#1300BA]/10 bg-white/45 px-4 py-2 shadow-[0_10px_35px_rgba(19,0,186,.08)] backdrop-blur-xl">
          {STAGES.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === stage ? "w-9 bg-[#1300BA]" : "w-2 bg-[#1300BA]/15"}`} />)}
        </div>

        <div className="pointer-events-none fixed inset-0 z-30">
          {STAGES.map((s, i) => (
            <div key={s[0]} className={`absolute top-1/2 max-w-[480px] -translate-y-1/2 px-6 transition-all duration-700 ${i === 0 ? "left-6 md:left-12" : i % 2 ? "right-6 md:right-12" : "left-6 md:left-12"} ${i === stage ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}>
              <div className="rounded-[2rem] border border-white/70 bg-white/45 p-7 shadow-[0_24px_80px_rgba(19,0,186,.10)] backdrop-blur-xl md:p-9">
                <div className="text-[9px] font-bold tracking-[.4em] text-[#1300BA]">{s[0]}</div>
                <h1 className="mt-5 text-5xl font-black leading-[.82] tracking-[-.07em] text-[#111322] md:text-7xl">{s[1]}</h1>
                <p className="mt-6 max-w-md text-sm leading-6 text-[#111322]/50">{s[2]}</p>
              </div>
            </div>
          ))}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[.35em] text-[#1300BA]/60 ${progress > 0.05 ? "opacity-0" : "opacity-100"}`}>
            <span className="inline-block animate-bounce">↓</span> SCROLL TO ENTER
          </div>
        </div>

        <div className="relative z-20 h-[920vh]">{STAGES.map((_, i) => <section key={i} className="h-[102.2vh]" />)}</div>

        <section className="relative z-40 bg-white/80 px-6 py-32 text-[#111322] backdrop-blur-xl">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mx-auto h-14 w-16">{LOGO}</div>
            <div className="mt-7 text-[9px] font-bold tracking-[.4em] text-[#1300BA]">ARBYTER OS</div>
            <div className="mx-auto max-w-3xl text-xs leading-6 text-[#111322]/30">AI agent governance · AI workforce management · AI security · agent orchestration · autonomous AI control · policy enforcement · AI compliance · agent monitoring · AI risk management · runtime governance</div>
            <h2 className="mt-5 text-5xl font-black leading-[.82] tracking-[-.075em] md:text-8xl">LET YOUR AI<br />WORKFORCE MOVE.</h2>
            <p className="mx-auto mt-8 max-w-xl text-sm leading-6 text-[#111322]/45">Command the workforce. Govern the rules. Control the actions. Keep the evidence.</p>
            <Link href="/login" className="pointer-events-auto mt-9 inline-flex rounded-full bg-[#1300BA] px-8 py-4 text-sm font-semibold text-white shadow-[0_16px_45px_rgba(19,0,186,.22)] hover:bg-[#0e008a]">Enter Arbyter →</Link>
          </div>
          <footer className="mx-auto mt-28 flex max-w-7xl flex-col gap-4 border-t border-[#1300BA]/10 pt-8 text-xs text-[#111322]/35 md:flex-row md:justify-between">
            <b className="text-[#111322]">ARBYTER OS</b>
            <a href="mailto:arbyteros@gmail.com">arbyteros@gmail.com</a>
            <span className="text-[8px] tracking-[.3em]">ORCHESTRATE · GOVERN · SECURE</span>
            <a href="https://instagram.com/arbyter.os" target="_blank" rel="noreferrer" className="hover:text-[#1300BA]">@arbyter.os</a>
          </footer>
        </section>
      </div>
    </main>
  );
}
