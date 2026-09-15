"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Pillar = {
  title: string
  short: string
  description: string
  icon: string
}

const pillars: Pillar[] = [
  {
    title: "Governance",
    short: "Define how agents are allowed to operate.",
    description:
      "Set organizational rules, ethical boundaries, approval requirements and governance policies for every AI agent.",
    icon: "⌘",
  },
  {
    title: "Control",
    short: "Control what agents can actually do.",
    description:
      "Define permissions, tools, boundaries, authentication requirements and emergency controls.",
    icon: "◈",
  },
  {
    title: "Visibility",
    short: "See what your agents are doing.",
    description:
      "Observe activity, tools, data access, interactions, decisions and operational behaviour across your agent fleet.",
    icon: "◉",
  },
  {
    title: "Audit",
    short: "Understand what happened.",
    description:
      "Create an auditable record of important agent actions, decisions, approvals and system events.",
    icon: "▣",
  },
  {
    title: "Security",
    short: "Protect the agentic environment.",
    description:
      "Identify unauthorized access, suspicious behaviour, unexpected actions and threats before they become incidents.",
    icon: "◇",
  },
  {
    title: "Compliance",
    short: "Keep AI operations aligned with rules.",
    description:
      "Map agent behaviour against organizational policies, regulatory requirements and applicable government rules.",
    icon: "✓",
  },
  {
    title: "Investigation",
    short: "Find out why something happened.",
    description:
      "Trace decisions, activity, interactions and failures to understand incidents and determine what should happen next.",
    icon: "⌕",
  },
  {
    title: "Risk",
    short: "Turn agent behaviour into actionable risk.",
    description:
      "Surface business, financial, security, operational and policy risks and tell teams where attention is required.",
    icon: "△",
  },
]

const agents = [
  { x: 11, y: 20, delay: 0 },
  { x: 23, y: 69, delay: 0.4 },
  { x: 34, y: 30, delay: 0.8 },
  { x: 44, y: 78, delay: 0.15 },
  { x: 55, y: 19, delay: 0.55 },
  { x: 65, y: 62, delay: 0.95 },
  { x: 76, y: 28, delay: 0.3 },
  { x: 86, y: 74, delay: 0.7 },
  { x: 17, y: 46, delay: 0.2 },
  { x: 31, y: 84, delay: 0.65 },
  { x: 70, y: 83, delay: 0.1 },
  { x: 88, y: 42, delay: 0.5 },
]

function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 456 406"
      className={className}
      fill="none"
      aria-label="Arbyter"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
        M 166.5 46
        A 51 51 0 0 1 254.8 46
        L 421.2 334.3
        A 49 49 0 0 1 336.3 383.3
        L 327.9 368.8
        A 24 24 0 0 0 307.1 357
        L 74.8 357
        A 51 51 0 0 1 30.6 280.5
        L 166.5 46 Z
        M 210.7 174.1
        L 259.7 259
        L 161.7 259
        Z"
        fill="#000000"
      />
      <circle cx="356" cy="49" r="49" fill="#1300BA" />
    </svg>
  )
}

/* =========================================================
   SOUND
========================================================= */

let audioContext: AudioContext | null = null

function getAudioContext() {
  if (typeof window === "undefined") return null

  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext
        }
      ).webkitAudioContext

    if (!AudioContextClass) return null

    audioContext = new AudioContextClass()
  }

  return audioContext
}

function resumeAudio() {
  const ctx = getAudioContext()
  if (ctx && ctx.state === "suspended") void ctx.resume()
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  endFrequency?: number
) {
  const ctx = getAudioContext()
  if (!ctx || ctx.state !== "running") return

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      ctx.currentTime + duration
    )
  }

  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(
    volume,
    ctx.currentTime + 0.015
  )
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + duration
  )

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start()
  oscillator.stop(ctx.currentTime + duration + 0.03)
}

function soundWhoosh() {
  tone(900, 0.55, "sawtooth", 0.025, 70)
}

function soundLightning() {
  tone(120, 0.75, "sawtooth", 0.065, 35)
  setTimeout(() => tone(720, 0.1, "square", 0.05, 100), 35)
  setTimeout(() => tone(430, 0.2, "triangle", 0.035, 70), 100)
}

function soundCapture() {
  tone(480, 0.14, "square", 0.045, 1250)
  setTimeout(() => tone(900, 0.09, "triangle", 0.025, 300), 65)
}

function soundMechanical() {
  tone(220, 0.12, "square", 0.03, 100)
  setTimeout(() => tone(500, 0.08, "triangle", 0.025, 230), 45)
}

function soundFinal() {
  tone(180, 0.35, "sine", 0.045, 55)
  setTimeout(() => tone(440, 0.22, "triangle", 0.035, 700), 100)
  setTimeout(() => tone(780, 0.4, "sine", 0.035, 1120), 200)
}

/* =========================================================
   LOGO MECHANICAL PIECES
========================================================= */

const logoPieces = [
  [-42, -250, -94, -70, -38, 18, 145],
  [340, -230, 72, -78, 37, 18, 145],
  [-330, 180, -135, 90, 24, 20, 135],
  [350, 220, 108, 115, -26, 22, 150],
  [-260, -80, -42, 132, 90, 130, 19],
  [290, 70, 37, 137, 90, 125, 19],
  [-210, 280, -50, 58, 18, 20, 135],
  [250, -300, 55, 65, -17, 20, 135],
  [-410, -20, -25, -8, 58, 20, 120],
  [420, 0, 42, -8, -58, 20, 120],
  [-120, -320, -10, -42, 0, 105, 18],
  [110, 320, 8, 42, 0, 105, 18],
]

/* =========================================================
   PAGE
========================================================= */

export default function Home() {
  const [introPhase, setIntroPhase] = useState(0)
  const [capturedCount, setCapturedCount] = useState(0)
  const [captureShot, setCaptureShot] = useState(0)
  const [introDone, setIntroDone] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [selectedPillar, setSelectedPillar] =
    useState<Pillar | null>(null)
  const [pagePhase, setPagePhase] = useState(0)

  const formationPositions = useMemo(
    () =>
      agents.map((_, index) => {
        const width = 600
        const spacing = width / (agents.length - 1)

        return {
          x: -width / 2 + index * spacing,
          y: 0,
        }
      }),
    []
  )

  /*
   * Four cinematic camera positions.
   *
   * 0 = rear-left wheel POV
   * 1 = top-down
   * 2 = front chase POV
   * 3 = front-right wheel POV
   */
  const cameraAngles = [
    "rear-left",
    "top",
    "front",
    "front-right",
  ]

  useEffect(() => {
    const activate = () => {
      if (soundEnabled) resumeAudio()
    }

    window.addEventListener("pointerdown", activate)
    window.addEventListener("keydown", activate)

    return () => {
      window.removeEventListener("pointerdown", activate)
      window.removeEventListener("keydown", activate)
    }
  }, [soundEnabled])

  /* =======================================================
     INTRO TIMELINE
  ======================================================= */

  useEffect(() => {
    if (introDone) return

    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(
      setTimeout(() => {
        setIntroPhase(1)

        if (soundEnabled) {
          resumeAudio()
          soundWhoosh()
        }
      }, 2600)
    )

    timers.push(
      setTimeout(() => {
        setIntroPhase(2)

        if (soundEnabled) {
          resumeAudio()
          soundLightning()
        }
      }, 4300)
    )

    timers.push(
      setTimeout(() => {
        setIntroPhase(3)
      }, 5100)
    )

    return () => timers.forEach(clearTimeout)
  }, [introDone, soundEnabled])

  /* =======================================================
     CINEMATIC ONE-BY-ONE CAPTURE
  ======================================================= */

  useEffect(() => {
    if (introPhase !== 3) return

    let count = 0

    const interval = setInterval(() => {
      setCaptureShot(count % cameraAngles.length)

      count += 1
      setCapturedCount(count)

      if (soundEnabled) {
        resumeAudio()
        soundCapture()
      }

      if (count < agents.length) {
        /*
         * The camera changes angle during every capture.
         * This makes the capture head feel like a fast-moving
         * vehicle rather than a simple cursor/dot.
         */
        setTimeout(() => {
          setCaptureShot((count + 1) % cameraAngles.length)
        }, 135)
      }

      if (count >= agents.length) {
        clearInterval(interval)

        setTimeout(() => {
          setIntroPhase(4)

          if (soundEnabled) {
            soundWhoosh()
          }
        }, 520)
      }
    }, 520)

    return () => clearInterval(interval)
  }, [introPhase, soundEnabled])

  /* =======================================================
     FORMATION
  ======================================================= */

  useEffect(() => {
    if (introPhase !== 4) return

    const timer = setTimeout(() => {
      setIntroPhase(5)

      if (soundEnabled) {
        soundMechanical()
      }
    }, 1450)

    return () => clearTimeout(timer)
  }, [introPhase, soundEnabled])

  /* =======================================================
     FINISH
  ======================================================= */

  useEffect(() => {
    if (introPhase !== 5) return

    const timer = setTimeout(() => {
      if (soundEnabled) soundFinal()

      setTimeout(() => {
        setIntroDone(true)
        setPagePhase(1)
      }, 1100)
    }, 2450)

    return () => clearTimeout(timer)
  }, [introPhase, soundEnabled])

  /* =======================================================
     LANDING PAGE LAYERS
  ======================================================= */

  useEffect(() => {
    if (!introDone) return

    const timers = [
      setTimeout(() => setPagePhase(2), 450),
      setTimeout(() => setPagePhase(3), 1050),
      setTimeout(() => setPagePhase(4), 1600),
    ]

    return () => timers.forEach(clearTimeout)
  }, [introDone])

  const snakePoints = [
    "50,50",
    ...agents
      .slice(0, capturedCount)
      .map((agent) => `${agent.x},${agent.y}`),
  ].join(" ")

  const currentTarget =
    capturedCount < agents.length
      ? agents[capturedCount]
      : agents[agents.length - 1]

  const activeCamera =
    cameraAngles[captureShot % cameraAngles.length]

  return (
    <main className="min-h-screen bg-white text-black overflow-x-hidden">
      {/* ===================================================
          CINEMATIC INTRO
      =================================================== */}

      {!introDone && (
        <section
          className={`intro-scene
            ${introPhase >= 1 ? "chaos-intense" : ""}
            ${introPhase >= 2 ? "strike-active" : ""}
            ${introPhase >= 3 ? "capture-active" : ""}
            ${introPhase >= 4 ? "formation-active" : ""}
            ${introPhase >= 5 ? "assembly-active" : ""}
          `}
        >
          <button
            type="button"
            aria-label={
              soundEnabled ? "Mute sound" : "Enable sound"
            }
            className="sound-toggle"
            onClick={() => {
              setSoundEnabled((value) => !value)

              if (!soundEnabled) {
                resumeAudio()
                tone(540, 0.16, "sine", 0.035, 760)
              }
            }}
          >
            {soundEnabled ? "◉" : "○"}
          </button>

          <div className="camera-grid" />

          <div className="speed-lines">
            {Array.from({ length: 20 }).map((_, index) => (
              <span
                key={index}
                style={
                  {
                    "--i": index,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          {/* ================================================
             CINEMATIC CAMERA
          ================================================ */}

          <div
            className={`capture-camera camera-${activeCamera}`}
            style={
              {
                "--target-x": `${currentTarget.x}%`,
                "--target-y": `${currentTarget.y}%`,
              } as React.CSSProperties
            }
          />

          {/* Camera motion blur */}
          <div className="camera-motion-blur" />

          {/* Tunnel/vignette */}
          <div className="cinematic-vignette" />

          {/* ================================================
             AGENTS
          ================================================ */}

          <div className="agents-layer">
            {agents.map((agent, index) => {
              const captured = index < capturedCount

              return (
                <div
                  key={index}
                  className={`intro-agent
                    ${captured ? "captured" : ""}
                    ${introPhase >= 4 ? "formation" : ""}
                    ${
                      index === capturedCount &&
                      introPhase === 3
                        ? "current-target"
                        : ""
                    }
                  `}
                  style={
                    {
                      left: `${agent.x}%`,
                      top: `${agent.y}%`,
                      animationDelay: `${agent.delay}s`,
                      "--fx": `${formationPositions[index].x}px`,
                      "--fy": `${formationPositions[index].y}px`,
                    } as React.CSSProperties
                  }
                >
                  <span className="agent-energy" />
                  <span className="agent-core" />
                  <span className="agent-ring" />
                </div>
              )
            })}
          </div>

          {/* Speed trails */}
          <div className="chaos-trails">
            {Array.from({ length: 12 }).map((_, index) => (
              <i
                key={index}
                className={`chaos-trail trail-${index + 1}`}
              />
            ))}
          </div>

          {/* ================================================
             LIGHTNING
          ================================================ */}

          <div className="lightning-container">
            <div className="lightning-main" />
            <div className="lightning-branch branch-one" />
            <div className="lightning-branch branch-two" />
            <div className="lightning-branch branch-three" />
          </div>

          <div className="strike-flash" />

          {/* ================================================
             SNAKE CAPTURE
          ================================================ */}

          <svg
            className="capture-path"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={snakePoints}
              className="capture-polyline"
            />
          </svg>

          {introPhase >= 3 && introPhase < 4 && (
            <div
              className={`capture-head pov-${activeCamera}`}
              style={
                {
                  left: `${currentTarget.x}%`,
                  top: `${currentTarget.y}%`,
                } as React.CSSProperties
              }
            >
              <span />
              <i />
            </div>
          )}

          {/* Target lock */}
          {introPhase === 3 && (
            <div
              className="target-lock"
              style={
                {
                  left: `${currentTarget.x}%`,
                  top: `${currentTarget.y}%`,
                } as React.CSSProperties
              }
            >
              <span />
              <span />
              <span />
              <span />
            </div>
          )}

          {/* ================================================
             FORMATION
          ================================================ */}

          {introPhase >= 4 && introPhase < 5 && (
            <div className="formation-beam">
              <div className="formation-line" />

              {formationPositions.map((position, index) => (
                <div
                  key={index}
                  className="formation-node"
                  style={
                    {
                      "--x": `${position.x}px`,
                    } as React.CSSProperties
                  }
                >
                  <span />
                </div>
              ))}
            </div>
          )}

          {/* ================================================
             MECHANICAL LOGO
          ================================================ */}

          {introPhase >= 5 && (
            <div className="logo-assembly-stage">
              <div className="assembly-field" />

              <div className="mechanical-pieces">
                {logoPieces.map((piece, index) => (
                  <div
                    key={index}
                    className="mechanical-piece"
                    style={
                      {
                        width: `${piece[5]}px`,
                        height: `${piece[6]}px`,
                        "--sx": `${piece[0]}px`,
                        "--sy": `${piece[1]}px`,
                        "--ex": `${piece[2]}px`,
                        "--ey": `${piece[3]}px`,
                        "--rot": `${piece[4]}deg`,
                        animationDelay: `${index * 0.08}s`,
                      } as React.CSSProperties
                    }
                  />
                ))}

                <div
                  className="blue-logo-piece"
                  style={
                    {
                      "--sx": "-330px",
                      "--sy": "-300px",
                      "--ex": "132px",
                      "--ey": "-128px",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="assembly-ring ring-one" />
              <div className="assembly-ring ring-two" />
              <div className="assembly-ring ring-three" />

              {/* ONE exact logo only */}
              <div className="final-logo-reveal">
                <div className="logo-light-sweep" />
                <Logo className="exact-final-logo" />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===================================================
          REST OF LANDING PAGE
      =================================================== */}

      {introDone && (
        <div className="landing-page">
          {/* NAV */}

          <header className="topbar">
            <div className="brand">
              <Logo className="nav-logo" />
              <span>ARBYTER</span>
            </div>

            <nav>
              <a href="#system">System</a>
              <a href="#governance">Governance</a>
              <a href="#architecture">Architecture</a>
              <a href="#contact">Contact</a>
            </nav>

            <Link href="/login" className="demo-button">
              Demo <span>↗</span>
            </Link>
          </header>

          {/* =================================================
             LAYER 02
          ================================================= */}

          <section
            id="system"
            className={`fortress-layer ${
              pagePhase >= 1 ? "visible" : ""
            }`}
          >
            <div className="layer-label">
              <span>02</span>
              <span>THE CONTROL SYSTEM</span>
            </div>

            <div className="fortress-stage">
              <div className="fortress-roof">
                <div className="roof-cap">
                  <Logo className="roof-logo" />
                </div>

                <div className="roof-line" />
              </div>

              <div className="fortress-body">
                <div className="fortress-foundation">
                  AGENTS
                </div>

                {pillars.map((pillar, index) => (
                  <button
                    key={pillar.title}
                    type="button"
                    className={`fortress-pillar pillar-${index + 1}`}
                    onClick={() => setSelectedPillar(pillar)}
                  >
                    <span className="pillar-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="pillar-icon">
                      {pillar.icon}
                    </span>

                    <span className="pillar-name">
                      {pillar.title}
                    </span>

                    <span className="pillar-line" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* =================================================
             LAYER 03
          ================================================= */}

          <section
            id="governance"
            className={`system-layer ${
              pagePhase >= 2 ? "visible" : ""
            }`}
          >
            <div className="system-header">
              <div>
                <span className="eyebrow">
                  ARBYTER OS
                </span>

                <h1>
                  The operating layer
                  <br />
                  for the agentic enterprise.
                </h1>
              </div>

              <p>
                Arbyter sits between organizations and AI agents,
                turning autonomous activity into something that can
                be observed, governed, secured and acted upon.
              </p>
            </div>

            <div className="system-grid">
              <div className="system-card large">
                <span>01</span>

                <h3>
                  WHAT IS
                  <br />
                  HAPPENING?
                </h3>

                <p>
                  Observe agents, tasks, tools, data access,
                  interactions, decisions and operational events.
                </p>
              </div>

              <div className="system-card">
                <span>02</span>

                <h3>
                  WHAT
                  <br />
                  COULD GO WRONG?
                </h3>

                <p>
                  Surface risk, unexpected behaviour,
                  policy violations and security threats.
                </p>
              </div>

              <div className="system-card">
                <span>03</span>

                <h3>
                  WHAT
                  <br />
                  SHOULD WE DO?
                </h3>

                <p>
                  Give operators actionable recommendations,
                  investigations and controls.
                </p>
              </div>

              <div className="system-card dark">
                <span>04</span>

                <h3>
                  GOVERN
                  <br />
                  THE FLEET.
                </h3>

                <p>
                  From three agents to thousands, Arbyter
                  provides one governance layer.
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
             LAYER 04
          ================================================= */}

          <section
            id="architecture"
            className={`architecture-layer ${
              pagePhase >= 3 ? "visible" : ""
            }`}
          >
            <div className="layer-label">
              <span>04</span>
              <span>AGENTIC ARCHITECTURE</span>
            </div>

            <div className="architecture-heading">
              <h2>
                One control layer.
                <br />
                Every agent.
              </h2>

              <p>
                Connect third-party or homegrown agents and
                establish a common operational, security and
                governance layer across the organization.
              </p>
            </div>

            <div className="architecture-map">
              <div className="map-grid" />

              <div className="map-center">
                <Logo className="map-logo" />

                <strong>ARBYTER OS</strong>

                <span>
                  ORCHESTRATE · GOVERN · SECURE
                </span>
              </div>

              {[
                ["CRM AGENT", "11%", "18%"],
                ["RESEARCH AGENT", "76%", "15%"],
                ["FINANCE AGENT", "17%", "73%"],
                ["SUPPORT AGENT", "78%", "72%"],
                ["CODE AGENT", "50%", "8%"],
                ["OPERATIONS", "50%", "87%"],
              ].map(([name, left, top], index) => (
                <div
                  key={name}
                  className="map-agent"
                  style={{
                    left,
                    top,
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  <span className="map-agent-dot" />
                  <span>{name}</span>
                </div>
              ))}

              <svg
                className="connection-lines"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line x1="18" y1="20" x2="50" y2="50" />
                <line x1="80" y1="18" x2="50" y2="50" />
                <line x1="20" y1="75" x2="50" y2="50" />
                <line x1="80" y1="74" x2="50" y2="50" />
                <line x1="50" y1="10" x2="50" y2="50" />
                <line x1="50" y1="90" x2="50" y2="50" />
              </svg>
            </div>
          </section>

          {/* =================================================
             LAYER 05
          ================================================= */}

          <section
            id="contact"
            className={`cta-layer ${
              pagePhase >= 4 ? "visible" : ""
            }`}
          >
            <div className="cta-mark">
              <Logo className="cta-logo" />
            </div>

            <span className="eyebrow">
              ARBYTER OS
            </span>

            <h2>
              Intelligence is
              <br />
              powerful.
              <br />
              Governance makes
              <br />
              it enterprise-ready.
            </h2>

            <div className="cta-actions">
              <Link href="/login" className="primary-cta">
                Enter Arbyter <span>↗</span>
              </Link>

              <a
                href="mailto:arbyteros@gmail.com"
                className="secondary-cta"
              >
                Contact us
              </a>
            </div>
          </section>

          {/* FOOTER */}

          <footer className="footer">
            <div className="footer-brand">
              <Logo className="footer-logo" />

              <div>
                <strong>ARBYTER OS</strong>
                <span>
                  ORCHESTRATE · GOVERN · SECURE
                </span>
              </div>
            </div>

            <div className="footer-right">
              <span>© 2026 Arbyter OS</span>

              <a href="mailto:arbyteros@gmail.com">
                arbyteros@gmail.com
              </a>
            </div>
          </footer>

          {/* MODAL */}

          {selectedPillar && (
            <div
              className="pillar-modal-backdrop"
              onClick={() => setSelectedPillar(null)}
            >
              <div
                className="pillar-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setSelectedPillar(null)}
                >
                  ×
                </button>

                <span className="modal-icon">
                  {selectedPillar.icon}
                </span>

                <span className="eyebrow">
                  ARBYTER / SYSTEM
                </span>

                <h2>{selectedPillar.title}</h2>

                <p className="modal-short">
                  {selectedPillar.short}
                </p>

                <p className="modal-description">
                  {selectedPillar.description}
                </p>

                <div className="modal-rule" />

                <span className="modal-status">
                  SYSTEM MODULE · ACTIVE
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================
          CSS
      =================================================== */}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #fff;
          color: #000;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        /* =================================================
           INTRO
        ================================================= */

        .intro-scene {
          position: fixed;
          inset: 0;
          z-index: 9999;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 50% 50%,
              rgba(19, 0, 186, 0.035),
              transparent 34%
            ),
            #fff;
          isolation: isolate;
          perspective: 900px;
        }

        .sound-toggle {
          position: absolute;
          top: 22px;
          right: 24px;
          z-index: 300;
          width: 38px;
          height: 38px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          color: #1300ba;
          cursor: pointer;
          font-size: 15px;
        }

        .camera-grid {
          position: absolute;
          inset: -25%;
          opacity: 0.12;
          background-image:
            linear-gradient(
              rgba(19, 0, 186, 0.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(19, 0, 186, 0.08) 1px,
              transparent 1px
            );
          background-size: 70px 70px;
          transform:
            perspective(700px)
            rotateX(62deg)
            scale(1.5)
            translateY(25%);
          transform-origin: center bottom;
          animation: gridMove 3.5s linear infinite;
        }

        @keyframes gridMove {
          from {
            background-position: 0 0;
          }

          to {
            background-position: 0 140px;
          }
        }

        /* =================================================
           CINEMATIC CAMERA
        ================================================= */

        .capture-camera {
          position: absolute;
          inset: -12%;
          z-index: 4;
          pointer-events: none;
          opacity: 0;
          transform-origin: center center;
          transition:
            transform 0.46s cubic-bezier(0.16, 1, 0.3, 1),
            filter 0.3s ease,
            opacity 0.2s ease;
        }

        .capture-active .capture-camera {
          opacity: 1;
        }

        /*
          Rear-left wheel shot:
          low, aggressive, rolling camera.
        */

        .camera-rear-left {
          transform:
            translate3d(-4vw, 2vh, 0)
            rotateZ(-5deg)
            rotateX(5deg)
            scale(1.16);
          filter: blur(0);
        }

        /*
          Top view:
          camera goes above the action.
        */

        .camera-top {
          transform:
            translate3d(0, -2vh, 0)
            rotateZ(1deg)
            rotateX(32deg)
            scale(1.27);
        }

        /*
          Front chase:
          camera pushes directly toward target.
        */

        .camera-front {
          transform:
            translate3d(0, 1vh, 0)
            rotateZ(0deg)
            rotateX(-3deg)
            scale(1.35);
        }

        /*
          Front-right wheel shot.
        */

        .camera-front-right {
          transform:
            translate3d(5vw, 2vh, 0)
            rotateZ(5deg)
            rotateX(7deg)
            scale(1.22);
        }

        .camera-motion-blur {
          position: absolute;
          inset: -20%;
          z-index: 55;
          pointer-events: none;
          opacity: 0;
          background:
            radial-gradient(
              ellipse at center,
              transparent 30%,
              rgba(255, 255, 255, 0.08) 55%,
              rgba(255, 255, 255, 0.7) 100%
            );
          filter: blur(2px);
        }

        .capture-active .camera-motion-blur {
          animation: cameraRush 0.52s ease-in-out infinite;
        }

        @keyframes cameraRush {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }

          35% {
            opacity: 0.2;
          }

          55% {
            opacity: 0.05;
            transform: scale(1.12);
          }

          100% {
            opacity: 0;
            transform: scale(0.9);
          }
        }

        .cinematic-vignette {
          position: absolute;
          inset: -10%;
          z-index: 80;
          pointer-events: none;
          background:
            radial-gradient(
              ellipse at center,
              transparent 38%,
              rgba(0, 0, 0, 0.04) 68%,
              rgba(0, 0, 0, 0.22) 100%
            );
          opacity: 0;
        }

        .capture-active .cinematic-vignette {
          opacity: 1;
          animation: vignetteRush 0.52s infinite;
        }

        @keyframes vignetteRush {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.08);
          }
        }

        /* =================================================
           AGENTS
        ================================================= */

        .agents-layer {
          position: absolute;
          inset: 0;
          z-index: 15;
        }

        .intro-agent {
          position: absolute;
          width: 18px;
          height: 18px;
          transform: translate(-50%, -50%);
          transition:
            opacity 0.24s ease,
            transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
          animation:
            agentChaos 1.1s ease-in-out infinite alternate;
        }

        .agent-core {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: #000;
          box-shadow:
            0 0 0 4px rgba(0, 0, 0, 0.05),
            0 0 18px rgba(19, 0, 186, 0.25);
        }

        .agent-energy {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(19, 0, 186, 0.7);
          border-radius: 50%;
          animation: agentPulse 0.72s ease-in-out infinite;
        }

        .agent-ring {
          position: absolute;
          inset: -6px;
          border: 1px dashed rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          animation: agentSpin 1.8s linear infinite;
        }

        .chaos-intense .intro-agent {
          animation-duration: 0.55s;
        }

        @keyframes agentChaos {
          0% {
            transform:
              translate(-50%, -50%)
              translate3d(-24px, 12px, 0)
              rotate(-18deg)
              scale(0.8);
          }

          50% {
            transform:
              translate(-50%, -50%)
              translate3d(28px, -22px, 0)
              rotate(25deg)
              scale(1.15);
          }

          100% {
            transform:
              translate(-50%, -50%)
              translate3d(-10px, 30px, 0)
              rotate(-40deg)
              scale(0.92);
          }
        }

        @keyframes agentPulse {
          0%,
          100% {
            opacity: 0.25;
            transform: scale(0.75);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes agentSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /*
          The currently targeted agent gets much larger
          as the cinematic camera rushes toward it.
        */

        .intro-agent.current-target {
          z-index: 100;
        }

        .intro-agent.current-target .agent-core {
          animation: targetPulse 0.26s infinite;
        }

        .intro-agent.current-target .agent-ring {
          animation:
            targetSpin 0.55s linear infinite;
          border-color: #1300ba;
        }

        @keyframes targetPulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow:
              0 0 0 5px rgba(19, 0, 186, 0.08),
              0 0 25px rgba(19, 0, 186, 0.7);
          }

          50% {
            transform: scale(1.9);
            box-shadow:
              0 0 0 12px rgba(19, 0, 186, 0.05),
              0 0 60px rgba(19, 0, 186, 0.9);
          }
        }

        @keyframes targetSpin {
          to {
            transform: rotate(360deg) scale(1.25);
          }
        }

        .intro-agent.captured {
          opacity: 0.02;
          animation-play-state: paused;
          transform:
            translate(-50%, -50%)
            scale(0.08);
        }

        .intro-agent.formation {
          opacity: 1;
          animation: none;
          transform:
            translate(-50%, -50%)
            translate(var(--fx), var(--fy))
            scale(0.68);
        }

        /* =================================================
           CHAOS TRAILS
        ================================================= */

        .chaos-trails {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 8;
        }

        .chaos-trail {
          position: absolute;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(19, 0, 186, 0.35),
            transparent
          );
          transform-origin: left center;
          animation: trailMove 0.7s linear infinite;
        }

        .trail-1 {
          width: 190px;
          top: 18%;
          left: 8%;
          transform: rotate(19deg);
        }

        .trail-2 {
          width: 240px;
          top: 71%;
          left: 12%;
          transform: rotate(-12deg);
          animation-delay: 0.2s;
        }

        .trail-3 {
          width: 170px;
          top: 30%;
          right: 8%;
          transform: rotate(162deg);
        }

        .trail-4 {
          width: 260px;
          top: 81%;
          right: 4%;
          transform: rotate(192deg);
          animation-delay: 0.1s;
        }

        .trail-5 {
          width: 190px;
          top: 48%;
          left: 3%;
          transform: rotate(-4deg);
        }

        .trail-6 {
          width: 150px;
          top: 53%;
          right: 6%;
          transform: rotate(181deg);
        }

        .trail-7 {
          width: 220px;
          top: 8%;
          left: 41%;
          transform: rotate(73deg);
        }

        .trail-8 {
          width: 180px;
          bottom: 4%;
          left: 43%;
          transform: rotate(-73deg);
        }

        .trail-9 {
          width: 210px;
          top: 37%;
          left: 31%;
          transform: rotate(14deg);
        }

        .trail-10 {
          width: 210px;
          top: 59%;
          left: 52%;
          transform: rotate(-17deg);
        }

        .trail-11 {
          width: 170px;
          top: 15%;
          right: 25%;
          transform: rotate(-30deg);
        }

        .trail-12 {
          width: 190px;
          bottom: 17%;
          left: 20%;
          transform: rotate(26deg);
        }

        @keyframes trailMove {
          0% {
            opacity: 0;
            scale: 0.4 1;
          }

          30% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            scale: 1.5 1;
          }
        }

        /* =================================================
           SPEED LINES
        ================================================= */

        .speed-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          z-index: 6;
        }

        .strike-active .speed-lines {
          opacity: 1;
        }

        .speed-lines span {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 1px;
          height: 20vh;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(19, 0, 186, 0.55),
            transparent
          );
          transform:
            translate(-50%, -50%)
            rotate(calc(var(--i) * 18deg))
            translateY(-18vh);
          animation: speedLine 0.55s ease-out both;
          animation-delay: calc(var(--i) * 0.025s);
        }

        @keyframes speedLine {
          from {
            opacity: 0;
            height: 0;
          }

          35% {
            opacity: 1;
          }

          to {
            opacity: 0;
            height: 60vh;
            transform:
              translate(-50%, -50%)
              rotate(calc(var(--i) * 18deg))
              translateY(-48vh);
          }
        }

        /* =================================================
           LIGHTNING
        ================================================= */

        .lightning-container {
          position: absolute;
          inset: 0;
          z-index: 50;
          opacity: 0;
          pointer-events: none;
        }

        .strike-active .lightning-container {
          opacity: 1;
        }

        .lightning-main,
        .lightning-branch {
          position: absolute;
          left: 50%;
          top: -10%;
          width: 3px;
          height: 120%;
          background: #1300ba;
          filter:
            drop-shadow(0 0 5px #1300ba)
            drop-shadow(0 0 18px rgba(19, 0, 186, 0.7));
          clip-path: polygon(
            49% 0,
            63% 0,
            55% 30%,
            72% 30%,
            43% 58%,
            52% 58%,
            25% 100%,
            36% 60%,
            27% 60%,
            46% 31%,
            38% 31%
          );
          animation: lightningStrike 0.75s
            cubic-bezier(0.12, 0.9, 0.2, 1) both;
        }

        .branch-one {
          transform: rotate(-20deg);
          opacity: 0.55;
        }

        .branch-two {
          transform: rotate(19deg);
          opacity: 0.4;
        }

        .branch-three {
          transform: rotate(-7deg);
          opacity: 0.25;
        }

        @keyframes lightningStrike {
          0% {
            opacity: 0;
            transform: scaleY(0);
          }

          20% {
            opacity: 1;
          }

          60% {
            opacity: 1;
          }

          100% {
            opacity: 0.05;
            transform: scaleY(1);
          }
        }

        .strike-flash {
          position: absolute;
          inset: 0;
          z-index: 45;
          background: white;
          opacity: 0;
          pointer-events: none;
        }

        .strike-active .strike-flash {
          animation: strikeFlash 0.85s ease-out both;
        }

        @keyframes strikeFlash {
          0% {
            opacity: 0;
          }

          16% {
            opacity: 0.95;
          }

          24% {
            opacity: 0.1;
          }

          34% {
            opacity: 0.8;
          }

          100% {
            opacity: 0;
          }
        }

        /* =================================================
           SNAKE
        ================================================= */

        .capture-path {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 35;
          pointer-events: none;
        }

        .capture-polyline {
          fill: none;
          stroke: #1300ba;
          stroke-width: 0.45;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter:
            drop-shadow(0 0 4px rgba(19, 0, 186, 0.8))
            drop-shadow(0 0 14px rgba(19, 0, 186, 0.4));
        }

        .capture-head {
          position: absolute;
          z-index: 110;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1300ba;
          transform: translate(-50%, -50%);
          transition:
            left 0.32s cubic-bezier(0.16, 1, 0.3, 1),
            top 0.32s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.2s ease;
          box-shadow:
            0 0 0 6px rgba(19, 0, 186, 0.08),
            0 0 25px rgba(19, 0, 186, 0.85),
            0 0 60px rgba(19, 0, 186, 0.45);
        }

        .capture-head span {
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: #fff;
        }

        .capture-head i {
          position: absolute;
          width: 80px;
          height: 2px;
          left: 10px;
          top: 8px;
          transform-origin: left center;
          background: linear-gradient(
            90deg,
            #1300ba,
            transparent
          );
          opacity: 0.65;
        }

        /*
          Make the "car" feel different depending on camera.
        */

        .pov-rear-left {
          transform:
            translate(-50%, -50%)
            rotate(-12deg)
            scale(1.35);
        }

        .pov-top {
          transform:
            translate(-50%, -50%)
            rotate(90deg)
            scale(1.5);
        }

        .pov-front {
          transform:
            translate(-50%, -50%)
            rotate(180deg)
            scale(1.55);
        }

        .pov-front-right {
          transform:
            translate(-50%, -50%)
            rotate(12deg)
            scale(1.35);
        }

        /* =================================================
           TARGET LOCK
        ================================================= */

        .target-lock {
          position: absolute;
          z-index: 105;
          width: 80px;
          height: 80px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          animation: targetLock 0.48s ease-out;
        }

        .target-lock span {
          position: absolute;
          width: 18px;
          height: 18px;
          border-color: #1300ba;
        }

        .target-lock span:nth-child(1) {
          left: 0;
          top: 0;
          border-left: 1px solid;
          border-top: 1px solid;
        }

        .target-lock span:nth-child(2) {
          right: 0;
          top: 0;
          border-right: 1px solid;
          border-top: 1px solid;
        }

        .target-lock span:nth-child(3) {
          left: 0;
          bottom: 0;
          border-left: 1px solid;
          border-bottom: 1px solid;
        }

        .target-lock span:nth-child(4) {
          right: 0;
          bottom: 0;
          border-right: 1px solid;
          border-bottom: 1px solid;
        }

        @keyframes targetLock {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.8);
          }

          55% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }

        /* =================================================
           FORMATION
        ================================================= */

        .formation-beam {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 45;
          width: 600px;
          height: 60px;
          transform: translate(-50%, -50%);
        }

        .formation-line {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            #1300ba,
            transparent
          );
          box-shadow: 0 0 14px rgba(19, 0, 186, 0.4);
        }

        .formation-node {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 14px;
          height: 14px;
          transform:
            translate(-50%, -50%)
            translateX(var(--x));
        }

        .formation-node span {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #000;
          box-shadow:
            0 0 0 3px rgba(19, 0, 186, 0.08),
            0 0 14px rgba(19, 0, 186, 0.4);
        }

        /* =================================================
           LOGO ASSEMBLY
        ================================================= */

        .logo-assembly-stage {
          position: absolute;
          inset: 0;
          z-index: 150;
          display: grid;
          place-items: center;
          pointer-events: none;
        }

        .assembly-field {
          position: absolute;
          width: 520px;
          height: 420px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(19, 0, 186, 0.09),
              transparent 65%
            );
          animation: fieldPulse 1.8s ease-in-out infinite;
        }

        @keyframes fieldPulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.4;
          }

          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }

        .mechanical-pieces {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 1px;
          height: 1px;
        }

        .mechanical-piece {
          position: absolute;
          left: 0;
          top: 0;
          background: #000;
          opacity: 0;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.12),
            0 0 14px rgba(0, 0, 0, 0.25);
          transform:
            translate(var(--sx), var(--sy))
            rotate(var(--rot))
            scale(0.5);
          animation:
            pieceAssemble 1.05s
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        @keyframes pieceAssemble {
          0% {
            opacity: 0;
            transform:
              translate(var(--sx), var(--sy))
              rotate(calc(var(--rot) + 30deg))
              scale(0.5);
          }

          15% {
            opacity: 1;
          }

          72% {
            opacity: 1;
          }

          86% {
            transform:
              translate(
                calc(var(--ex) + 8px),
                calc(var(--ey) - 5px)
              )
              rotate(calc(var(--rot) - 5deg))
              scale(1.07);
          }

          100% {
            opacity: 1;
            transform:
              translate(var(--ex), var(--ey))
              rotate(var(--rot))
              scale(1);
          }
        }

        .blue-logo-piece {
          position: absolute;
          left: 0;
          top: 0;
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: #1300ba;
          box-shadow:
            0 0 20px rgba(19, 0, 186, 0.8),
            0 0 60px rgba(19, 0, 186, 0.3);
          opacity: 0;
          transform:
            translate(var(--sx), var(--sy))
            scale(0.2);
          animation:
            bluePieceAssemble 1.1s
            1.05s
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        @keyframes bluePieceAssemble {
          0% {
            opacity: 0;
            transform:
              translate(var(--sx), var(--sy))
              scale(0.2);
          }

          20% {
            opacity: 1;
          }

          75% {
            transform:
              translate(
                calc(var(--ex) + 9px),
                calc(var(--ey) - 5px)
              )
              scale(1.08);
          }

          100% {
            opacity: 1;
            transform:
              translate(var(--ex), var(--ey))
              scale(1);
          }
        }

        .assembly-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid rgba(19, 0, 186, 0.25);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          opacity: 0;
        }

        .ring-one {
          width: 300px;
          height: 300px;
          animation: ringBuild 1.1s 0.15s ease-out forwards;
        }

        .ring-two {
          width: 430px;
          height: 430px;
          animation: ringBuild 1.2s 0.3s ease-out forwards;
        }

        .ring-three {
          width: 580px;
          height: 580px;
          animation: ringBuild 1.4s 0.5s ease-out forwards;
        }

        @keyframes ringBuild {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }

          40% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        /* Only one actual logo exists here. */

        .final-logo-reveal {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 250px;
          height: 223px;
          transform: translate(-50%, -50%);
          opacity: 0;
          animation:
            finalLogoReveal 0.9s
            2.05s
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }

        .exact-final-logo {
          display: block;
          width: 100%;
          height: 100%;
          filter:
            drop-shadow(0 12px 25px rgba(0, 0, 0, 0.08))
            drop-shadow(0 0 25px rgba(19, 0, 186, 0.12));
        }

        .logo-light-sweep {
          position: absolute;
          inset: -15%;
          z-index: 2;
          background: linear-gradient(
            110deg,
            transparent 35%,
            rgba(255, 255, 255, 0.95) 48%,
            transparent 62%
          );
          transform: translateX(-120%);
          animation: logoSweep 0.7s 2.28s ease-out forwards;
          mix-blend-mode: screen;
        }

        @keyframes logoSweep {
          to {
            transform: translateX(120%);
          }
        }

        @keyframes finalLogoReveal {
          0% {
            opacity: 0;
            transform:
              translate(-50%, -50%)
              scale(0.72);
            filter: blur(8px);
          }

          55% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              scale(1.045);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform:
              translate(-50%, -50%)
              scale(1);
            filter: blur(0);
          }
        }

        /* =================================================
           LANDING
        ================================================= */

        .landing-page {
          background: #fff;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 200;
          height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 34px;
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(18px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.18em;
        }

        .nav-logo {
          width: 26px;
          height: 24px;
        }

        .topbar nav {
          display: flex;
          gap: 32px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.6);
        }

        .topbar nav a:hover {
          color: #1300ba;
        }

        .demo-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 12px 17px;
          border: 1px solid #000;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .demo-button:hover {
          background: #000;
          color: #fff;
        }

        /* =================================================
           FORTRESS
        ================================================= */

        .fortress-layer {
          position: relative;
          min-height: 950px;
          padding: 145px 7vw 100px;
          opacity: 0;
          transform: translateY(35px);
          transition:
            opacity 0.9s ease,
            transform 1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fortress-layer.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .layer-label {
          display: flex;
          gap: 14px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: rgba(0, 0, 0, 0.42);
        }

        .layer-label span:first-child {
          color: #1300ba;
        }

        /*
          IMPORTANT:
          Fortress is deliberately lower.
          The roof begins 30px inside a stage that itself starts
          100px below the layer heading, keeping it clear of
          the 78px navbar.
        */

        .fortress-stage {
          position: relative;
          margin: 100px auto 0;
          max-width: 1150px;
          padding-top: 105px;
        }

        .fortress-roof {
          position: absolute;
          left: 50%;
          top: 30px;
          width: 310px;
          height: 155px;
          transform: translateX(-50%);
          z-index: 4;
        }

        .roof-cap {
          position: absolute;
          left: 50%;
          top: 0;
          width: 145px;
          height: 105px;
          transform: translateX(-50%);
          display: grid;
          place-items: center;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.14);
          clip-path: polygon(
            50% 0,
            100% 42%,
            84% 100%,
            16% 100%,
            0 42%
          );
        }

        .roof-logo {
          width: 55px;
          height: 50px;
        }

        .roof-line {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 1px;
          background: #000;
        }

        .fortress-body {
          position: relative;
          min-height: 570px;
          padding: 70px 35px 35px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background:
            linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.025) 1px,
              transparent 1px
            ),
            linear-gradient(
              rgba(0, 0, 0, 0.025) 1px,
              transparent 1px
            ),
            #fff;
          background-size: 60px 60px;
        }

        .fortress-foundation {
          position: absolute;
          left: 50%;
          bottom: 24px;
          width: 270px;
          height: 58px;
          transform: translateX(-50%);
          display: grid;
          place-items: center;
          background: #000;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
        }

        .fortress-pillar {
          position: absolute;
          width: 150px;
          height: 245px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 25px 14px;
          border: 1px solid rgba(0, 0, 0, 0.14);
          background: rgba(255, 255, 255, 0.95);
          cursor: pointer;
          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .fortress-pillar:hover {
          transform: translateY(-8px);
          border-color: #1300ba;
          box-shadow: 0 18px 45px rgba(19, 0, 186, 0.08);
        }

        .pillar-1 {
          left: 6%;
          top: 80px;
        }

        .pillar-2 {
          left: 21%;
          top: 35px;
        }

        .pillar-3 {
          left: 36%;
          top: 80px;
        }

        .pillar-4 {
          right: 36%;
          top: 80px;
        }

        .pillar-5 {
          right: 21%;
          top: 35px;
        }

        .pillar-6 {
          right: 6%;
          top: 80px;
        }

        .pillar-7 {
          left: 21%;
          bottom: 65px;
        }

        .pillar-8 {
          right: 21%;
          bottom: 65px;
        }

        .pillar-number {
          font-size: 9px;
          color: #1300ba;
        }

        .pillar-icon {
          margin: 30px 0 17px;
          font-size: 22px;
        }

        .pillar-name {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-align: center;
        }

        .pillar-line {
          width: 35px;
          height: 1px;
          margin-top: 17px;
          background: #1300ba;
        }

        /* =================================================
           SYSTEM
        ================================================= */

        .system-layer {
          padding: 160px 7vw;
          background: #f8f8f8;
          opacity: 0;
          transform: translateY(30px);
          transition:
            opacity 0.9s ease,
            transform 1s ease;
        }

        .system-layer.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .system-header {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 10vw;
          max-width: 1200px;
          margin: auto;
        }

        .eyebrow {
          display: block;
          margin-bottom: 25px;
          color: #1300ba;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
        }

        .system-header h1 {
          margin: 0;
          font-size: clamp(44px, 6vw, 86px);
          line-height: 0.92;
          letter-spacing: -0.06em;
        }

        .system-header p {
          margin: 70px 0 0;
          max-width: 430px;
          color: rgba(0, 0, 0, 0.55);
          font-size: 15px;
          line-height: 1.8;
        }

        .system-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          gap: 1px;
          max-width: 1200px;
          margin: 100px auto 0;
          background: rgba(0, 0, 0, 0.1);
        }

        .system-card {
          min-height: 310px;
          padding: 35px;
          background: #fff;
        }

        .system-card.large {
          grid-row: span 2;
          min-height: 621px;
        }

        .system-card.dark {
          grid-column: span 2;
          background: #000;
          color: #fff;
        }

        .system-card span {
          color: #1300ba;
          font-size: 10px;
          font-weight: 800;
        }

        .system-card h3 {
          margin: 70px 0 25px;
          font-size: 30px;
          line-height: 0.98;
        }

        .system-card p {
          max-width: 300px;
          color: rgba(0, 0, 0, 0.52);
          font-size: 13px;
          line-height: 1.7;
        }

        .system-card.dark p {
          color: rgba(255, 255, 255, 0.5);
        }

        /* =================================================
           ARCHITECTURE
        ================================================= */

        .architecture-layer {
          padding: 150px 7vw;
          opacity: 0;
          transform: translateY(30px);
          transition:
            opacity 0.9s ease,
            transform 1s ease;
        }

        .architecture-layer.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .architecture-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 60px;
          max-width: 1200px;
          margin: 75px auto;
        }

        .architecture-heading h2 {
          margin: 0;
          font-size: clamp(45px, 6vw, 80px);
          line-height: 0.9;
          letter-spacing: -0.06em;
        }

        .architecture-heading p {
          max-width: 400px;
          color: rgba(0, 0, 0, 0.52);
          font-size: 14px;
          line-height: 1.8;
        }

        .architecture-map {
          position: relative;
          height: 680px;
          max-width: 1200px;
          margin: auto;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fafafa;
        }

        .map-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(
              rgba(0, 0, 0, 0.045) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.045) 1px,
              transparent 1px
            );
          background-size: 55px 55px;
        }

        .map-center {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 4;
          width: 220px;
          height: 220px;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 1px solid #000;
          background: #fff;
          box-shadow: 0 20px 70px rgba(0, 0, 0, 0.07);
        }

        .map-logo {
          width: 55px;
          height: 50px;
          margin-bottom: 20px;
        }

        .map-center strong {
          font-size: 11px;
          letter-spacing: 0.14em;
        }

        .map-center span {
          margin-top: 9px;
          color: #1300ba;
          font-size: 7px;
          letter-spacing: 0.12em;
        }

        .connection-lines {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }

        .connection-lines line {
          stroke: rgba(19, 0, 186, 0.22);
          stroke-width: 0.16;
          stroke-dasharray: 1 1;
        }

        .map-agent {
          position: absolute;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 8px;
          transform: translate(-50%, -50%);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.08em;
          animation: mapFloat 3s ease-in-out infinite;
        }

        .map-agent-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #1300ba;
          box-shadow: 0 0 12px rgba(19, 0, 186, 0.45);
        }

        @keyframes mapFloat {
          0%,
          100% {
            transform: translate(-50%, -50%);
          }

          50% {
            transform:
              translate(-50%, -50%)
              translateY(-8px);
          }
        }

        /* =================================================
           CTA
        ================================================= */

        .cta-layer {
          padding: 190px 7vw 160px;
          text-align: center;
          background: #000;
          color: #fff;
          opacity: 0;
          transform: translateY(30px);
          transition:
            opacity 1s ease,
            transform 1s ease;
        }

        .cta-layer.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .cta-mark {
          display: flex;
          justify-content: center;
          margin-bottom: 65px;
        }

        .cta-logo {
          width: 80px;
          height: 72px;
          filter: invert(1);
        }

        .cta-layer .eyebrow {
          color: #6e5dff;
        }

        .cta-layer h2 {
          margin: 0 auto;
          max-width: 900px;
          font-size: clamp(48px, 7vw, 100px);
          line-height: 0.91;
          letter-spacing: -0.065em;
        }

        .cta-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 65px;
        }

        .primary-cta,
        .secondary-cta {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 16px 21px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .primary-cta {
          background: #fff;
          color: #000;
        }

        .secondary-cta {
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        /* =================================================
           FOOTER
        ================================================= */

        .footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 45px 7vw;
          background: #000;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .footer-logo {
          width: 30px;
          height: 27px;
        }

        .footer-brand div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .footer-brand strong {
          font-size: 11px;
          letter-spacing: 0.12em;
        }

        .footer-brand span {
          color: rgba(255, 255, 255, 0.38);
          font-size: 7px;
          letter-spacing: 0.1em;
        }

        .footer-right {
          display: flex;
          gap: 30px;
          color: rgba(255, 255, 255, 0.38);
          font-size: 9px;
        }

        .footer-right a:hover {
          color: #fff;
        }

        /* =================================================
           MODAL
        ================================================= */

        .pillar-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: grid;
          place-items: center;
          padding: 25px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(12px);
        }

        .pillar-modal {
          position: relative;
          width: min(560px, 100%);
          padding: 55px;
          background: #fff;
          box-shadow: 0 35px 100px rgba(0, 0, 0, 0.18);
        }

        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 34px;
          height: 34px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: #fff;
          cursor: pointer;
          font-size: 20px;
        }

        .modal-icon {
          display: block;
          margin-bottom: 45px;
          color: #1300ba;
          font-size: 30px;
        }

        .pillar-modal h2 {
          margin: 0;
          font-size: 56px;
          line-height: 0.95;
          letter-spacing: -0.06em;
        }

        .modal-short {
          margin: 28px 0 0;
          font-size: 18px;
          line-height: 1.4;
        }

        .modal-description {
          margin: 18px 0 0;
          color: rgba(0, 0, 0, 0.55);
          font-size: 13px;
          line-height: 1.8;
        }

        .modal-rule {
          width: 100%;
          height: 1px;
          margin: 40px 0 18px;
          background: rgba(0, 0, 0, 0.1);
        }

        .modal-status {
          color: #1300ba;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.14em;
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 800px) {
          .sound-toggle {
            top: 16px;
            right: 16px;
          }

          .capture-camera {
            inset: -30%;
          }

          .camera-rear-left {
            transform:
              translate3d(-5vw, 2vh, 0)
              rotateZ(-7deg)
              rotateX(5deg)
              scale(1.25);
          }

          .camera-top {
            transform:
              translate3d(0, -3vh, 0)
              rotateZ(1deg)
              rotateX(28deg)
              scale(1.4);
          }

          .camera-front {
            transform:
              translate3d(0, 0, 0)
              rotateZ(0)
              rotateX(-2deg)
              scale(1.5);
          }

          .camera-front-right {
            transform:
              translate3d(5vw, 2vh, 0)
              rotateZ(7deg)
              rotateX(5deg)
              scale(1.3);
          }

          .formation-beam {
            width: 86vw;
          }

          .final-logo-reveal {
            width: 190px;
            height: 170px;
          }

          .topbar {
            height: 68px;
            padding: 0 18px;
          }

          .topbar nav {
            display: none;
          }

          .brand span {
            font-size: 11px;
          }

          .demo-button {
            padding: 10px 12px;
          }

          .fortress-layer {
            padding: 105px 18px 70px;
          }

          .fortress-stage {
            margin-top: 70px;
            padding-top: 80px;
          }

          .fortress-roof {
            width: 230px;
            top: 25px;
          }

          .fortress-body {
            min-height: 850px;
            padding: 40px 10px;
          }

          .fortress-pillar {
            width: 115px;
            height: 180px;
            padding: 17px 8px;
          }

          .pillar-1 {
            left: 4%;
            top: 40px;
          }

          .pillar-2 {
            left: 52%;
            top: 40px;
          }

          .pillar-3 {
            left: 4%;
            top: 245px;
          }

          .pillar-4 {
            right: 4%;
            top: 245px;
          }

          .pillar-5 {
            left: 4%;
            top: 450px;
          }

          .pillar-6 {
            right: 4%;
            top: 450px;
          }

          .pillar-7 {
            left: 4%;
            bottom: 30px;
          }

          .pillar-8 {
            right: 4%;
            bottom: 30px;
          }

          .pillar-icon {
            margin: 18px 0 12px;
          }

          .pillar-name {
            font-size: 8px;
          }

          .fortress-foundation {
            display: none;
          }

          .system-layer,
          .architecture-layer {
            padding: 100px 18px;
          }

          .system-header {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .system-header p {
            margin-top: 0;
          }

          .system-grid {
            grid-template-columns: 1fr;
          }

          .system-card.large,
          .system-card.dark {
            grid-column: auto;
            grid-row: auto;
            min-height: 310px;
          }

          .architecture-heading {
            flex-direction: column;
            align-items: flex-start;
            margin: 55px auto;
          }

          .architecture-map {
            height: 520px;
          }

          .map-center {
            width: 160px;
            height: 160px;
          }

          .map-agent {
            font-size: 6px;
          }

          .cta-layer {
            padding: 120px 18px;
          }

          .footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 25px;
          }

          .footer-right {
            flex-direction: column;
            gap: 10px;
          }

          .pillar-modal {
            padding: 38px 25px;
          }

          .pillar-modal h2 {
            font-size: 44px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}
      </style>
    </main>
  )
}