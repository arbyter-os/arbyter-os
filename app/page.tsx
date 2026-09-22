"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";

const WHITE = "#FFFFFF";

/* ------------------------------------------------ */
/* 3D WORLD COMPONENT                               */
/* ------------------------------------------------ */

function ArbyterWorld({ progress }: { progress: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);

  // Keep latest progress value synced to ref without re-running scene setup
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* --- Scene & Renderer Setup --- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#aeb3bf");
    scene.fog = new THREE.FogExp2("#aeb3bf", 0.018);

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    camera.position.set(0, 2.1, 15);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    mount.appendChild(renderer.domElement);

    /* --- Lighting --- */
    const ambient = new THREE.HemisphereLight("#ffffff", "#555a68", 2.2);
    scene.add(ambient);

    const sunLight = new THREE.PointLight("#ffffff", 180, 70);
    sunLight.position.set(0, 5.5, -1);
    scene.add(sunLight);

    const blueLight = new THREE.PointLight(BLUE, 30, 50);
    blueLight.position.set(-8, 4, 3);
    scene.add(blueLight);

    /* --- Terrain --- */
    const terrainGeometry = new THREE.PlaneGeometry(180, 180, 120, 120);
    const positions = terrainGeometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      const wave =
        Math.sin(x * 0.075) * 1.7 +
        Math.sin(y * 0.06) * 1.3 +
        Math.sin((x + y) * 0.035) * 2.2 +
        Math.sin(x * 0.19 + y * 0.12) * 0.35;

      const distance = Math.sqrt(x * x + y * y);
      const mountain =
        Math.max(0, distance - 15) * 0.055 * Math.sin(distance * 0.08);

      positions.setZ(i, wave + mountain);
    }
    terrainGeometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: "#858a98",
      roughness: 0.96,
      metalness: 0.02,
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -2.2;
    scene.add(terrain);

    /* --- Distant Mountains (Instanced) --- */
    const mountainBaseGeo = new THREE.ConeGeometry(8, 14, 6);
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: "#737887",
      roughness: 1,
    });

    const mountainCount = 20;
    const mountainMesh = new THREE.InstancedMesh(
      mountainBaseGeo,
      mountainMaterial,
      mountainCount
    );

    const dummy = new THREE.Object3D();
    for (let i = 0; i < mountainCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 110,
        -1.5,
        -28 - Math.random() * 60
      );
      dummy.rotation.y = Math.random() * Math.PI;
      const sX = 0.8 + Math.random() * 1.2;
      const sY = 0.6 + Math.random() * 0.9;
      dummy.scale.set(sX, sY, sX);
      dummy.updateMatrix();
      mountainMesh.setMatrixAt(i, dummy.matrix);
    }
    mountainMesh.instanceMatrix.needsUpdate = true;
    scene.add(mountainMesh);

    /* --- White Plasma Sun --- */
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, 1.15, -3.2);
    scene.add(sunGroup);

    const sunGeometry = new THREE.SphereGeometry(2.65, 64, 64);
    const sunMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec3 p = position;
          float wave = sin(position.y * 3.0 + uTime * 1.2) * sin(position.x * 2.0 + uTime) * 0.055;
          p += normal * wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
          float plasma = sin(vPosition.x * 4.0 + uTime * 1.5) *
                        sin(vPosition.y * 3.0 - uTime) *
                        sin(vPosition.z * 5.0 + uTime * 0.7);
          plasma = plasma * 0.08 + 0.92;

          vec3 white = vec3(1.0);
          vec3 cool = vec3(0.86, 0.94, 1.0);
          vec3 color = mix(white, cool, fresnel * 0.7) * plasma;
          float glow = smoothstep(0.0, 1.0, fresnel);

          gl_FragColor = vec4(color, 0.96 + glow * 0.04);
        }
      `,
    });

    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

    /* --- Sun Halo --- */
    const haloGeometry = new THREE.SphereGeometry(3.8, 48, 48);
    const haloMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(max(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
          gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * 0.42);
        }
      `,
    });

    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    sunGroup.add(halo);

    /* --- Plasma Particles --- */
    const particleCount = 1200;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.2 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      particlePositions[i * 3] = Math.cos(angle) * radius * (0.4 + Math.random());
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * radius;
      particlePositions[i * 3 + 2] = -3 + Math.sin(angle) * radius;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.035,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    /* --- Resize Handling --- */
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    /* --- Animation Loop --- */
    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3();
    let smoothProgress = progressRef.current;
    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      smoothProgress += (progressRef.current - smoothProgress) * 0.055;

      sunMaterial.uniforms.uTime.value = elapsed;
      sun.rotation.y = elapsed * 0.12;
      halo.rotation.y = -elapsed * 0.08;
      particles.rotation.y = elapsed * 0.025;

      // Continuous piecewise camera motion
      const p = smoothProgress;
      let camY: number;
      let camZ: number;

      if (p <= 0.4) {
        const t = THREE.MathUtils.smoothstep(p, 0, 0.4);
        camY = THREE.MathUtils.lerp(1.45, 3.0, t);
        camZ = THREE.MathUtils.lerp(15, -9, t);
      } else {
        const t = THREE.MathUtils.smoothstep(p, 0.4, 1.0);
        camY = THREE.MathUtils.lerp(3.0, 5.0, t);
        camZ = THREE.MathUtils.lerp(-9, 10, t);
      }

      camera.position.x = Math.sin(elapsed * 0.06) * 0.12;
      camera.position.y = camY;
      camera.position.z = camZ;

      const travelT = THREE.MathUtils.smoothstep(p, 0.35, 1.0);
      lookTarget.set(0, 1.15, THREE.MathUtils.lerp(-3.2, -7.0, travelT));
      camera.lookAt(lookTarget);

      const approachT = THREE.MathUtils.smoothstep(p, 0, 0.4);
      sunGroup.position.y = THREE.MathUtils.lerp(1.15, 3.2, approachT);
      sunGroup.position.z = THREE.MathUtils.lerp(-3.2, -5.0, approachT);

      renderer.render(scene, camera);
    };

    animate();

    /* --- Cleanup --- */
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);

      renderer.dispose();
      terrainGeometry.dispose();
      terrainMaterial.dispose();
      mountainBaseGeo.dispose();
      mountainMaterial.dispose();
      sunGeometry.dispose();
      sunMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none" />;
}

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
    window.setTimeout(onDone, 1200);
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
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-black/20 bg-black/75 px-11 py-4 text-[10px] font-bold tracking-[.55em] text-white backdrop-blur-xl transition-all duration-1000 ${
            ready
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-75 opacity-0"
          }`}
        >
          ENTER
        </button>
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
        <ArbyterWorld progress={progress} />

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
              className="mt-10 inline-flex rounded-full bg-[#1300BA] px-8 py-4 text-xs font-semibold text-white transition hover:bg-blue-800"
            >
              Enter Arbyter →
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
