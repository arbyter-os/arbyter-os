"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";


const ArbyterWorld = dynamic(() => import("@/components/ArbyterWorld"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black" />,
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
    body: "Translate high-level organization policy into cryptographic control the instant an agent acts.",
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
    const timer = window.setTimeout(() => setReady(true), 3500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    if (!ready || clicked) return;
    setClicked(true);
    window.setTimeout(onDone, 1000);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${clicked ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <div className="flex flex-col items-center">
        <div className={`transition-all duration-1000 ${ready ? "scale-100 opacity-100" : "scale-75 opacity-40"}`}>
          <LogoMonolith className="h-44 w-44" glow={true} />
        </div>

        <button
          onClick={handleEnter}
          disabled={!ready}
          className={`mt-14 rounded-full border border-white/20 bg-white/5 px-10 py-3.5 text-[10px] font-bold tracking-[0.45em] text-white backdrop-blur-md transition-all duration-700 hover:border-white hover:bg-white hover:text-black ${ready ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"}`}
        >
          ENTER
        </button>
      </div>

      <div className="absolute bottom-8 text-[9px] tracking-[0.3em] text-white/40">
        ARBYTER OS · COMMAND LAYER
      </div>
    </div>
  );
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!introDone) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
    }
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
    <main className="min-h-[750vh] bg-black text-white selection:bg-white selection:text-black">
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}

      <div className={`transition-opacity duration-1000 ${introDone ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <ArbyterWorld progress={progress} />

        <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-8 py-7 backdrop-blur-sm">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-[15px] font-black tracking-[-0.04em]">ARBYTER</span>
          </Link>

          <nav className="flex items-center gap-7 text-[9px] font-semibold tracking-[0.25em] text-white/70">
            <span className="cursor-pointer hover:text-white">PLATFORM</span>
            <span className="cursor-pointer hover:text-white">GOVERNANCE</span>
            <Link href="/login" className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-white transition hover:bg-white hover:text-black">
              LAUNCH
            </Link>
          </nav>
        </header>

        <div className="relative z-30">
          {SECTIONS.map((section, idx) => (
            <section key={section.kicker} className="relative h-[120vh]">
              <div className={`sticky top-0 flex h-screen items-center px-8 md:px-20 ${idx % 2 ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[440px] transition-all duration-700 ${idx === activeSection ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
                  <div className="text-[9px] font-bold tracking-[0.35em] text-white/40">{section.kicker}</div>
                  <h2 className="mt-4 text-4xl font-black leading-[0.9] tracking-[-0.05em] md:text-6xl">{section.title}</h2>
                  <p className="mt-6 max-w-[340px] text-xs leading-6 text-white/60">{section.body}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="relative z-40 min-h-screen border-t border-white/10 bg-black px-8 py-32">
          <div className="mx-auto max-w-5xl">
            <h2 className="mt-12 text-6xl font-black leading-[0.85] tracking-[-0.06em] md:text-9xl">
              COMMAND
              <br />
              THE WORKFORCE.
            </h2>
            <p className="mt-8 max-w-md text-sm leading-6 text-white/50">
              The control plane between your organization and autonomous agents.
            </p>
            <Link href="/login" className="mt-10 inline-flex rounded-full bg-white px-8 py-4 text-xs font-bold tracking-widest text-black transition hover:bg-white/90">
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
