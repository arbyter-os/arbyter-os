"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const BLUE = "#1300BA";

const LOGO = (
  <svg viewBox="0 0 456 406" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M166.5 46A51 51 0 0 1 254.8 46L421.2 334.3A49 49 0 0 1 336.3 383.3L327.9 368.8A24 24 0 0 0 307.1 357L74.8 357A51 51 0 0 1 30.6 280.5L166.5 46ZM210.7 174.1L259.7 259L161.7 259L210.7 174.1Z" fill="#000"/>
    <circle cx="356" cy="49" r="49" fill={BLUE}/>
  </svg>
);

const AGENTS = [
  ["Research", "12 actions"],
  ["Sales", "8 actions"],
  ["Support", "21 actions"],
  ["Finance", "6 actions"],
  ["HR", "4 actions"],
  ["Operations", "17 actions"],
  ["Analytics", "9 actions"],
  ["Engineering", "14 actions"],
];

function Agent({ name, meta, i, progress }: { name: string; meta: string; i: number; progress: number }) {
  const angle = i * 45 + progress * (i % 2 ? -14 : 10);
  const radius = 260 + (i % 3) * 55;
  const z = 80 + (i % 4) * 35;
  return (
    <div
      className="absolute left-1/2 top-1/2 w-[138px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/20 bg-white/[.075] p-4 text-white shadow-[0_25px_70px_rgba(0,0,0,.35)] backdrop-blur-xl"
      style={{ transform: `translate(-50%,-50%) rotateY(${angle}deg) translateZ(${radius}px) rotateY(-${angle}deg) translateZ(${z}px)` }}
    >
      <div className="flex items-center justify-between">
        <span className="h-2 w-2 rounded-full bg-[#5de38d] shadow-[0_0_12px_#5de38d]" />
        <span className="text-[7px] font-bold tracking-[.25em] text-white/30">AGENT</span>
      </div>
      <div className="mt-5 text-xs font-bold">{name}</div>
      <div className="mt-1 text-[9px] text-white/35">{meta}</div>
      <div className="mt-4 border-t border-white/10 pt-3 text-[7px] font-bold tracking-[.2em] text-white/30">ACTIVE</div>
    </div>
  );
}

function Intro({ phase }: { phase: number }) {
  const unfolded = phase >= 4;
  const logoVisible = phase >= 3;
  return (
    <div className="fixed inset-0 z-[999] overflow-hidden bg-white">
      <div className={`absolute inset-0 transition-[filter] duration-300 ${unfolded ? "blur-none" : "blur-[7px]"}`}>
        <div className={`absolute left-1/2 top-1/2 z-40 h-[150px] w-[168px] -translate-x-1/2 -translate-y-1/2 transition-all duration-400 ${logoVisible ? "scale-100 opacity-100" : "scale-[.72] opacity-0"}`}>
          {LOGO}
        </div>
      </div>
      <div className="absolute inset-y-0 left-0 z-50 w-1/2 border-r border-white/80 bg-white/45 shadow-[12px_0_60px_rgba(19,0,186,.08)] backdrop-blur-[18px] transition-transform duration-500" style={{ transform: unfolded ? "translateX(-100%)" : "translateX(0)" }} />
      <div className="absolute inset-y-0 right-0 z-50 w-1/2 border-l border-white/80 bg-white/45 shadow-[-12px_0_60px_rgba(19,0,186,.08)] backdrop-blur-[18px] transition-transform duration-500" style={{ transform: unfolded ? "translateX(100%)" : "translateX(0)" }} />
      <div className={`absolute left-1/2 top-0 z-[60] h-full w-px -translate-x-1/2 transition-opacity duration-300 ${unfolded ? "opacity-0" : "opacity-70"}`} style={{ background: `linear-gradient(to bottom,transparent,${BLUE},transparent)`, boxShadow: `0 0 22px ${BLUE}` }} />
    </div>
  );
}

function TopBar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-[90] h-[72px] border-b border-white/10 bg-white/40 shadow-[0_10px_40px_rgba(20,25,55,.08)] backdrop-blur-2xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3"><div className="h-8 w-9">{LOGO}</div><div><b className="text-sm">ARBYTER OS</b><div className="text-[7px] tracking-[.3em] text-black/35">COMMAND LAYER</div></div></Link>
        <nav className="hidden gap-8 md:flex"><a href="#experience" className="text-xs text-black/45 hover:text-black">Experience</a><a href="mailto:arbyteros@gmail.com" className="text-xs text-black/45 hover:text-black">Contact</a></nav>
        <Link href="/login" className="rounded-full bg-black px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[#1300BA]">Sign in</Link>
      </div>
    </header>
  );
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [phase, setPhase] = useState(0);
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 250),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1350),
      setTimeout(() => setIntroDone(true), 2500),
    ];
    const onScroll = () => setScroll(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { timers.forEach(clearTimeout); window.removeEventListener("scroll", onScroll); };
  }, []);

  const scene = Math.min(1, scroll * 1.15);
  const camera = scene * 360;
  const agents = useMemo(() => AGENTS, []);

  return (
    <main id="experience" className="min-h-[520vh] bg-[#050509] text-white">
      {!introDone && <Intro phase={phase} />}
      <div className={introDone ? "opacity-100" : "opacity-0"}>
        <TopBar />

        <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(19,0,186,.2),transparent_30%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,.05),transparent_25%)]" />
          <div className="absolute left-1/2 top-1/2 h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.035]" />
        </div>

        <section className="relative h-[115vh]">
          <div className="sticky top-0 h-screen overflow-hidden">
            <div className="absolute inset-0 [perspective:1400px]">
              <div className="absolute left-1/2 top-[54%] h-[600px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#6f63ff]/15 bg-[#1300BA]/[.035] shadow-[0_0_160px_rgba(19,0,186,.2)]" style={{ transform: `translate(-50%,-50%) rotateX(64deg) rotateZ(${scroll * 30}deg)` }} />
              <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[.05]" />
              {agents.map(([name, meta], i) => <Agent key={name} name={name} meta={meta} i={i} progress={scene} />)}
              <div className="absolute left-1/2 top-1/2 z-20 flex h-44 w-64 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] border border-white/20 bg-white/[.08] shadow-[0_30px_100px_rgba(19,0,186,.35)] backdrop-blur-2xl" style={{ transform: `translate(-50%,-50%) translateZ(120px) rotateY(${scroll * 12}deg)` }}>
                <div className="text-center"><div className="mx-auto h-11 w-12">{LOGO}</div><div className="mt-4 text-sm font-black tracking-[.18em]">ARBYTER OS</div><div className="mt-2 text-[8px] font-bold tracking-[.3em] text-white/35">COMMAND LAYER</div></div>
              </div>
            </div>

            <div className="absolute left-0 right-0 top-[18%] z-30 text-center transition-all duration-700" style={{ opacity: Math.max(0, 1 - scroll * 3), transform: `translateY(-${scroll * 100}px)` }}>
              <div className="text-[10px] font-bold tracking-[.4em] text-[#8a80ff]">THE AI WORKFORCE IS MOVING</div>
              <h1 className="mx-auto mt-6 max-w-6xl text-[clamp(3.8rem,9vw,9rem)] font-black leading-[.8] tracking-[-.08em]">COMMAND<br/>YOUR WORKFORCE.</h1>
              <p className="mx-auto mt-8 max-w-xl text-sm leading-6 text-white/45">Arbyter is the command layer between your organization and its AI agents.</p>
            </div>

            <div className="absolute bottom-10 left-0 right-0 z-30 text-center text-[8px] font-bold tracking-[.35em] text-white/25">SCROLL TO ENTER THE WORKFORCE ↓</div>
          </div>
        </section>

        <section className="relative h-[105vh]">
          <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(19,0,186,.25),transparent_35%)]" />
            <div className="relative z-20 mx-auto max-w-5xl px-6 text-center">
              <div className="text-[9px] font-bold tracking-[.4em] text-[#8a80ff]">COMMAND</div>
              <h2 className="mt-5 text-5xl font-black leading-[.86] tracking-[-.07em] md:text-8xl">SAY IT.<br/>ARBYTER MOVES IT.</h2>
              <div className="mx-auto mt-12 max-w-2xl rounded-[2rem] border border-white/15 bg-white/[.07] p-6 text-left shadow-[0_30px_100px_rgba(19,0,186,.2)] backdrop-blur-2xl">
                <div className="text-[8px] font-bold tracking-[.3em] text-white/30">YOU · VOICE COMMAND</div>
                <div className="mt-5 text-xl font-semibold md:text-2xl">“Move the research agents onto this project.”</div>
                <div className="my-6 h-px bg-white/10" />
                <div className="flex items-center gap-3 text-xs text-white/45"><span className="h-2 w-2 animate-pulse rounded-full bg-[#5de38d]" /> Arbyter identifies the right agents and prepares execution.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative h-[105vh]">
          <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-[#f7f8fc] text-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(19,0,186,.1),transparent_30%)]" />
            <div className="relative z-20 max-w-6xl px-6 text-center">
              <div className="text-[9px] font-bold tracking-[.4em]" style={{ color: BLUE }}>GOVERN → CONTROL → EXECUTE</div>
              <h2 className="mt-5 text-5xl font-black leading-[.86] tracking-[-.07em] md:text-8xl">WORDS BECOME<br/>RUNTIME CONTROL.</h2>
              <div className="mx-auto mt-14 flex max-w-5xl flex-col items-center gap-3 md:flex-row">
                {["INTENT","POLICY","CONTROL","ACTION"].map((x,i)=><div key={x} className="flex w-full items-center gap-3"><div className="w-full rounded-3xl border border-black/10 bg-white/70 p-7 text-left shadow-[0_25px_70px_rgba(30,35,70,.1)] backdrop-blur-xl"><div className="text-[9px] font-bold tracking-[.25em]" style={{color:BLUE}}>0{i+1}</div><div className="mt-10 text-xl font-black">{x}</div><div className="mt-2 text-xs text-black/40">{["Understand what you said.","Translate the business rule.","Apply permissions and approvals.","Let the agent act."][i]}</div></div>{i<3&&<span className="hidden text-xl md:block" style={{color:BLUE}}>→</span>}</div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="relative h-[110vh]">
          <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(19,0,186,.38),transparent_38%)]" />
            <div className="relative z-20 max-w-5xl px-6 text-center">
              <div className="text-[9px] font-bold tracking-[.4em] text-[#8a80ff]">POLICY EVENT</div>
              <h2 className="mt-5 text-5xl font-black leading-[.86] tracking-[-.07em] md:text-8xl">ARBYTER<br/>INTERCEPTS.</h2>
              <div className="mx-auto mt-12 max-w-3xl rounded-[2rem] border border-white/15 bg-white/[.06] p-7 text-left backdrop-blur-2xl">
                <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.3em] text-[#8a80ff]">HIGH-IMPACT HR ACTION</span><span className="rounded-full bg-[#1300BA]/30 px-3 py-1 text-[8px] font-bold text-[#b9b4ff]">BLOCKED</span></div>
                <div className="mt-6 text-2xl font-bold">Human approval required.</div>
                <div className="mt-3 text-sm leading-6 text-white/40">The agent attempted an action outside its permitted policy boundary.</div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">{["POLICY MATCHED","ACTION STOPPED","EVENT RECORDED"].map(x=><div key={x} className="rounded-xl border border-white/10 bg-white/[.04] p-4 text-[9px] font-bold tracking-[.15em] text-white/45"><span className="mr-2 text-[#5de38d]">●</span>{x}</div>)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative h-[105vh]">
          <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-[#f7f8fc] text-black">
            <div className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#1300BA]/10 rotate-[55deg]" />
            <div className="relative z-20 max-w-5xl px-6 text-center">
              <div className="mx-auto h-14 w-16">{LOGO}</div>
              <div className="mt-8 text-[9px] font-bold tracking-[.4em]" style={{color:BLUE}}>ARBYTER OS</div>
              <h2 className="mt-5 text-5xl font-black leading-[.84] tracking-[-.075em] md:text-8xl">LET YOUR AI<br/>WORKFORCE MOVE.</h2>
              <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-black/45 md:text-lg">Arbyter keeps command, governance, control and audit in the loop as your workforce scales.</p>
              <Link href="/login" className="mt-10 inline-flex rounded-full bg-black px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#1300BA]">Enter Arbyter →</Link>
            </div>
          </div>
        </section>

        <footer className="relative z-30 border-t border-white/10 bg-[#050509] px-6 py-10 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3"><div className="h-8 w-9">{LOGO}</div><b>ARBYTER OS</b></div>
            <a href="mailto:arbyteros@gmail.com" className="text-sm text-white/40 hover:text-white">arbyteros@gmail.com</a>
            <span className="text-[9px] tracking-[.25em] text-white/25">ORCHESTRATE · GOVERN · SECURE</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
