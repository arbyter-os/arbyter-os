"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import  from "@/components/LogoMonolith";

const ArbyterWorld = dynamic(() => import("@/components/ArbyterWorld"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#aeb3bf]" />,
});

const SECTIONS = [
  
   {
    kicker: "01 / THRESHOLD",
    title: "THE WORKFORCE IS MOVING.",
    body: "AI agents operate as independent infrastructure across engineering, finance, and operations.",
  },
  {
    kicker: "02 / COMMAND",
    title: "ONE MONOLITHIC CONTROL LAYER.",
    body: "Arbyter provides a singular boundary to direct, monitor, and enforce runtime limits.",
  },
  {
    kicker: "03 / BREACH",
    title: "WORDS BECOME RUNTIME BOUNDARIES.",
    body: "Translate high-level organization policy into enforceable control the instant an agent acts.",
  },
  {
    kicker: "04 / INTERCEPT",
    title: "PREVENT COMPROMISE IN MID-FLIGHT.",
    body: "When actions breach acceptable thresholds, execution stops before becoming catastrophic.",
  },
  {
    kicker: "05 / CONTINUUM",
    title: "CONTINUOUS COMPLIANCE.",
    body: "Systems evolve without breaking regulatory or structural constraints.",
  },
  {
    kicker: "06 / ARBYTER OS",
    title: "COMMAND THE AI WORKFORCE.",
    body: "Orchestrate. Govern. Secure.",
  },
];

function Intro({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    if (!ready || clicked) return;
    setClicked(true);
    window.setTimeout(onDone, 1200);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[radial-gradient(circle_at_center,#202432_0%,#0a0b10_48%,#020204_100%)] transition-opacity duration-1000 ${clicked ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:70px_70px] [mask-image:linear-gradient(to_top,black,transparent_70%)]" />

      <div className="absolute left-7 top-7 z-20 text-[10px] font-black tracking-[0.28em] text-white">
        ARBYTER
        <span className="ml-2 font-normal text-white/35">AI COMMAND LAYER</span>
      </div>

      <div className="absolute right-7 top-7 z-20 max-w-[270px] text-right">
        <div className="text-[9px] font-bold tracking-[0.35em] text-white/45">/ MANIFESTO</div>
        <p className="mt-3 text-[10px] leading-5 text-white/40">
          AI agents are becoming infrastructure. Arbyter is the layer that keeps their actions inside the boundaries of the organization.
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[34vh] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:55px_55px] [transform:perspective(500px)_rotateX(62deg)_scale(1.5)_translateY(22%)] opacity-35" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative transition-all duration-[4000ms] ease-out ${ready ? "scale-[1.45]" : "scale-[0.38]"}`}
        >
          <div className="absolute -inset-20 rounded-full bg-[#dce9ff]/10 blur-3xl" />
          <div className="absolute -inset-10 rounded-full border border-white/10 bg-white/[0.025] blur-md" />
          <div className="relative h-36 w-36 rounded-full border border-white/80 bg-white shadow-[0_0_25px_rgba(255,255,255,.9),0_0_90px_rgba(130,170,255,.65),0_0_180px_rgba(19,0,186,.45)]">
            <div className="absolute inset-3 rounded-full border border-blue-100/60" />
            <div className="absolute inset-6 rounded-full bg-white blur-[1px]" />
          </div>
        </div>

        <div
          className={`absolute transition-all duration-700 ${ready ? "translate-y-28 opacity-100" : "translate-y-20 opacity-0"}`}
        >
          <LogoMonolith className="h-20 w-20" glow={true} />
        </div>
      </div>

      <button
        onClick={handleEnter}
        disabled={!ready}
        className={`absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/35 px-10 py-3.5 text-[10px] font-bold tracking-[0.45em] text-white backdrop-blur-xl transition-all duration-700 hover:border-white/60 hover:bg-white hover:text-black ${ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        ENTER
      </button>

      <div className="absolute bottom-7 left-7 text-[9px] tracking-[0.25em] text-white/35">
        © ARBYTER OS
      </div>
      <div className="absolute bottom-7 right-7 text-[9px] tracking-[0.25em] text-white/35">
        SOUND: ON
      </div>
      {!ready && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.4em] text-white/25">
          SCROLL
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.body.style.overflow = introDone ? "" : "hidden";
    if (!introDone) window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = "";
    };
  }, [introDone]);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      setProgress(window.scrollY / maxScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeSection = Math.min(
    SECTIONS.length - 1,
    Math.floor(progress * SECTIONS.length)
  );

  return (
    <main className="min-h-[800vh] bg-[#aeb3bf] text-black selection:bg-white selection:text-black">
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}

      <div
        className={`transition-opacity duration-1000 ${
          introDone ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ArbyterWorld progress={progress} />

        <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-8 py-7 text-white">
          <Link href="/" className="text-[15px] font-black tracking-[-0.04em]">
            ARBYTER<span className="ml-1 text-white/35">/OS</span>
          </Link>

          <nav className="flex items-center gap-7 text-[9px] font-semibold tracking-[0.25em] text-white/70">
            <span className="cursor-pointer hover:text-white">WORKFORCE</span>
            <span className="cursor-pointer hover:text-white">GOVERNANCE</span>
            <Link
              href="/login"
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-white transition hover:bg-white hover:text-black"
            >
              ENTER
            </Link>
          </nav>
        </header>

        <div className="relative z-30">
          {SECTIONS.map((section, idx) => (
            <section key={section.kicker} className="relative h-[120vh]">
              <div
                className={`sticky top-0 flex h-screen items-center px-8 md:px-20 ${
                  idx % 2 ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[440px] text-white transition-all duration-700 ${
                    idx === activeSection
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0"
                  }`}
                >
                  <div className="text-[9px] font-bold tracking-[0.35em] text-white/40">
                    {section.kicker}
                  </div>
                  <h2 className="mt-4 text-4xl font-black leading-[0.9] tracking-[-0.05em] md:text-6xl">
                    {section.title}
                  </h2>
                  <p className="mt-6 max-w-[340px] text-xs leading-6 text-white/60">
                    {section.body}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="relative z-40 min-h-screen border-t border-white/10 bg-black px-8 py-32 text-white">
          <div className="mx-auto max-w-5xl">
            <h2 className="mt-12 text-6xl font-black leading-[0.85] tracking-[-0.06em] md:text-9xl">
              COMMAND
              <br />
              THE WORKFORCE.
            </h2>
            <p className="mt-8 max-w-md text-sm leading-6 text-white/50">
              The control plane between your organization and autonomous agents.
            </p>
            <Link
              href="/login"
              className="mt-10 inline-flex rounded-full bg-white px-8 py-4 text-xs font-bold tracking-widest text-black transition hover:bg-white/90"
            >
              ACCESS ARBYTER →
            </Link>
            <footer className="mt-32 border-t border-white/10 pt-8 text-[9px] tracking-[0.25em] text-white/40">
              <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                <span>© ARBYTER OS</span>
                <span>SECURE RUNTIME LAYER</span>
                <span>ARBYTEROS@GMAIL.COM</span>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
