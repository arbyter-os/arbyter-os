"use client";

import { useEffect, useRef } from "react";
// @ts-expect-error Three.js is loaded as a runtime dependency.
import * as THREE from "three";

const BLUE = "#1300BA";

export default function ArbyterWorld({ progress }: { progress: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#030307");
    scene.fog = new THREE.FogExp2("#030307", 0.018);

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

    const ambient = new THREE.HemisphereLight("#ffffff", "#090a18", 1.7);
    scene.add(ambient);

    const sunLight = new THREE.PointLight("#ffffff", 120, 70);
    sunLight.position.set(0, 5.5, -1);
    scene.add(sunLight);

    const blueLight = new THREE.PointLight("#6f78ff", 45, 55);
    blueLight.position.set(-8, 4, 3);
    scene.add(blueLight);

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
      color: "#11131c",
      roughness: 0.96,
      metalness: 0.02,
    });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -2.2;
    scene.add(terrain);

    const mountainBaseGeo = new THREE.ConeGeometry(8, 14, 6);
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: "#0a0b12",
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

    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, 1.15, -3.2);
    scene.add(sunGroup);

    const sunGeometry = new THREE.SphereGeometry(2.65, 64, 64);
    const sunMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec3 p = position;
          float wave = sin(position.y * 3.0 + uTime * 1.2) *
                       sin(position.x * 2.0 + uTime) * 0.055;
          p += normal * wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float fresnel = pow(
            1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0),
            2.5
          );
          float plasma =
            sin(vPosition.x * 4.0 + uTime * 1.5) *
            sin(vPosition.y * 3.0 - uTime) *
            sin(vPosition.z * 5.0 + uTime * 0.7);
          plasma = plasma * 0.08 + 0.92;
          vec3 color = mix(
            vec3(1.0),
            vec3(0.86, 0.94, 1.0),
            fresnel * 0.7
          ) * plasma;
          float glow = smoothstep(0.0, 1.0, fresnel);
          gl_FragColor = vec4(color, 0.96 + glow * 0.04);
        }
      `,
    });

    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

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
          float intensity =
            pow(max(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
          gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * 0.42);
        }
      `,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    sunGroup.add(halo);

    const particleCount = 1200;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 3.2 + Math.random() * 7;
      const angle = Math.random() * Math.PI * 2;
      particlePositions[i * 3] =
        Math.cos(angle) * radius * (0.4 + Math.random());
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

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

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
      lookTarget.set(
        0,
        1.15,
        THREE.MathUtils.lerp(-3.2, -7.0, travelT)
      );
      camera.lookAt(lookTarget);

      const approachT = THREE.MathUtils.smoothstep(p, 0, 0.4);
      sunGroup.position.y = THREE.MathUtils.lerp(1.15, 3.2, approachT);
      sunGroup.position.z = THREE.MathUtils.lerp(-3.2, -5.0, approachT);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);

      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.InstancedMesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose());
          } else {
            material.dispose();
          }
        }
      });

      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}
