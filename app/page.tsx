"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const ArbyterWorld = dynamic(() => import("@/components/ArbyterWorld"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#aeb3bf]" />,
});

/* ------------------------------------------------ */
/* COPY & DATA                                      */
/* ------------------------------------------------ */

const SECTIONS = [
  {
    kicker: "01 / DISCOVER",
    title: "THE WORKFORCE IS ALREADY MOVING.",
    body: "AI agents are becoming infrastructure. Research, sales, finance, support, engineering — all moving independently.",
  },
  {
    kicker: "02 / COMMAND",
    title: "ONE COMMAND LAYER.",
    body: "Arbyter gives organizations one place to understand, direct and control the AI workforce.",
  },
  {
    kicker: "03 / GOVERN",
    title: "WORDS BECOME RUNTIME CONTROL.",
    body: "Turn business policy into enforceable rules, approvals and boundaries at the moment an agent acts.",
  },
  {
    kicker: "04 / INTERCEPT",
    title: "WHEN AN AGENT CROSSES THE LINE.",
    body: "An action reaches a policy boundary. Arbyter can stop it before it becomes an organizational problem.",
  },
  {
    kicker: "05 / ADAPT",
    title: "POLICY CHANGES. THE WORKFORCE CHANGES.",
    body: "Regulations and business rules evolve. The control layer evolves with them.",
  },
  {
    kicker: "06 / ARBYTER OS",
    title: "COMMAND THE AI WORKFORCE.",
    body: "Orchestrate. Govern. Secure.",
  },
];

/* ------------------------------------------------ */
/* INTRO OVERLAY                                    */
/* ------------------------------------------------ */

function Intro({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const enter = () => {
    if (!ready || clicked) return;
    setClicked(true);
    window.setTimeout(onDone, 1050);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-1000 ${
        clicked ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 35%, #202432 0%, #0a0b10 48%, #020204 100%)",
        }}
      />

      <div
        className="absolute bottom-0 left-1/2 h-[60vh] w-[180vw] -translate-x-1/2"
        style={{
          transform: "translateX(-50%) perspective(700px) rotateX(62deg)",
          transformOrigin: "50% 100%",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.09) 1px, transparent 1px)",
          backgroundSize: "110px 90px",
          maskImage: "linear-gradient(to top, #000, transparent)",
        }}
      />

      <div
        className={`absolute left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2 transition-all duration-[4000ms] ${
          ready ? "scale-[1.45]" : "scale-[0.38]"
        }`}
      >
        <div
          className="absolute -inset-[70px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,.95), rgba(200,225,255,.3) 38%, transparent 72%)",
            filter: "blur(35px)",
          }}
        />

        <div
          className="relative h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 38% 30%, #ffffff 0%, #ffffff 48%, #edf8ff 70%, #ffffff 100%)",
            boxShadow:
              "0 0 50px #fff, 0 0 130px rgba(220,240,255,.95), 0 0 250px rgba(120,190,255,.45)",
          }}
        >
          <div
            className="absolute inset-[8%] rounded-full border border-white/80"
            style={{ boxShadow: "inset 0 0 60px white" }}
          />
          <div
            className="absolute inset-[14%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,.95), transparent 20%), radial-gradient(circle at 65% 55%, rgba(210,240,255,.7), transparent 30%)",
              filter: "blur(15px)",
            }}
          />
        </div>

        <button
          onClick={enter}
          disabled={!ready}
          aria-label="Enter Arbyter"
          className={`group absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-all duration-1000 ${
            ready ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"
          }`}
        >
          <span className="absolute inset-0 rounded-full border border-white/80 shadow-[0_0_35px_rgba(255,255,255,.85),0_0_90px_rgba(150,210,255,.5)] transition-all duration-700 group-hover:scale-110 group-hover:border-white" />
          <span className="absolute inset-[10px] rounded-full border border-white/35 animate-pulse" />
          <span className="absolute inset-[22px] rounded-full bg-white/20 backdrop-blur-sm transition-all duration-500 group-hover:scale-125 group-hover:bg-white/35" />
          <span className="relative text-[7px] font-semibold tracking-[.35em] text-black/70">CLICK</span>
        </button>
      </div>

      <div
        className={`pointer-events-none fixed inset-0 z-[10000] transition-opacity duration-300 ${
          clicked ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <div
          className={`absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-transform duration-[900ms] ease-out ${
            clicked ? "scale-[45]" : "scale-0"
          }`}
          style={{ boxShadow: "0 0 80px 30px #fff, 0 0 180px 70px rgba(180,220,255,.95), 0 0 320px 120px rgba(19,0,186,.7)" }}
        />
        <div className={`absolute inset-0 bg-white transition-opacity duration-200 ${clicked ? "opacity-100" : "opacity-0"}`} />
      </div>
      <div className="absolute left-7 top-7 text-white">
        <div className="text-[18px] font-black tracking-[-.04em]">ARBYTER</div>
        <div className="mt-1 text-[8px] tracking-[.25em] text-white/45">
          AI COMMAND LAYER
        </div>
      </div>

      <div className="absolute bottom-7 left-7 text-[8px] tracking-[.2em] text-white/45">
        © ARBYTER OS
      </div>

      <div className="absolute bottom-7 right-7 text-[8px] tracking-[.2em] text-white/45">
        SOUND: ON
      </div>

      <div className="absolute right-7 top-7 max-w-[230px] text-right text-white">
        <div className="text-[8px] font-bold tracking-[.3em] text-white/40">
          / MANIFESTO
        </div>
        <p className="mt-3 text-[11px] leading-5 text-white/65">
          The AI workforce is becoming infrastructure. Arbyter is the command
          layer between organizations and the agents they deploy.
        </p>
      </div>

      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 text-[8px] tracking-[.35em] text-white/50 transition-opacity duration-700 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        SCROLL
      </div>
    </div>
  );
}

/* ------------------------------------------------ */
/* MAIN PAGE                                        */
/* ------------------------------------------------ */

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const [progress, setProgress] = useState(0);

  // Lock document scroll until the intro animation has finished
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
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
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
    <main className="min-h-[800vh] bg-[#aeb3bf] text-black selection:bg-[#1300BA] selection:text-white">
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}

      <div
        className={`transition-opacity duration-1000 ${
          introDone ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {introDone && <ArbyterWorld progress={progress} />}

        <header className="fixed left-0 right-0 top-0 z-50 flex items-start justify-between px-7 py-7 mix-blend-difference">
          <Link href="/" className="text-white">
            <div className="text-[18px] font-black tracking-[-.05em]">
              ARBYTER
            </div>
            <div className="text-[7px] tracking-[.35em] opacity-50">OS</div>
          </Link>

          <nav className="flex items-center gap-6 text-[8px] font-medium tracking-[.25em] text-white/70">
            <span>WORKFORCE</span>
            <span>GOVERNANCE</span>
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-5 py-2 text-white transition hover:bg-white hover:text-black"
            >
              ENTER
            </Link>
          </nav>
        </header>

        <div className="pointer-events-none fixed right-7 top-1/2 z-40 hidden w-[270px] -translate-y-1/2 md:block">
          <div className="text-[8px] font-bold tracking-[.35em] text-white/50">
            / MANIFESTO
          </div>
          <div className="mt-5 text-[17px] leading-[1.15] tracking-[-.03em] text-white">
            The workforce is no longer human-only.
          </div>
          <p className="mt-5 text-[10px] leading-5 text-white/55">
            Thousands of AI agents will eventually operate inside organizations.
          </p>
        </div>

        {/* Scroll Chapters */}
        <div className="relative z-30">
          {SECTIONS.map((section, index) => (
            <section key={section.kicker} className="relative h-[120vh]">
              <div
                className={`sticky top-0 flex h-screen items-center px-7 md:px-14 ${
                  index % 2 ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[420px] text-white transition-all duration-700 ${
                    index === activeSection
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0"
                  }`}
                >
                  <div className="text-[8px] font-bold tracking-[.4em] text-white/45">
                    {section.kicker}
                  </div>
                  <h1 className="mt-5 text-5xl font-black leading-[.85] tracking-[-.065em] md:text-7xl">
                    {section.title}
                  </h1>
                  <p className="mt-7 max-w-[340px] text-[11px] leading-6 text-white/55">
                    {section.body}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Closing CTA */}
        <section className="relative z-40 min-h-screen bg-[#f4f5f7] px-7 py-32 text-black">
          <div className="mx-auto max-w-6xl">
            <div className="text-[8px] font-bold tracking-[.4em] text-black/35">
              ARBYTER OS
            </div>

            <h2 className="mt-8 max-w-5xl text-7xl font-black leading-[.8] tracking-[-.08em] md:text-[10rem]">
              COMMAND
              <br />
              THE
              <br />
              WORKFORCE.
            </h2>

            <p className="mt-12 max-w-md text-sm leading-6 text-black/45">
              One command layer between your organization and every AI agent,
              action and policy.
            </p>

            <Link
              href="/login"
              className="group mt-10 inline-flex items-center gap-4 rounded-full border border-[#1300BA]/20 bg-white/70 px-5 py-3 text-[10px] font-semibold tracking-[.16em] text-[#1300BA] shadow-[0_12px_40px_rgba(19,0,186,.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#1300BA]/40 hover:bg-white hover:shadow-[0_18px_50px_rgba(19,0,186,.16)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1300BA] text-white transition-transform duration-300 group-hover:translate-x-0.5">
                →
              </span>
              ENTER ARBYTER
            </Link>

            <footer className="mt-40 border-t border-black/10 pt-8">
              <div className="flex flex-col gap-5 text-[9px] tracking-[.2em] text-black/40 md:flex-row md:justify-between">
                <span>ARBYTER OS</span>
                <span>ORCHESTRATE · GOVERN · SECURE</span>
                <a
                  href="mailto:arbyteros@gmail.com"
                  className="hover:text-black"
                >
                  ARBYTEROS@GMAIL.COM
                </a>
                <a
                  href="https://instagram.com/arbyter.os"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-black"
                >
                  @ARBYTER.OS
                </a>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
