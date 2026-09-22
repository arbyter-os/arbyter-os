"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MonolithWorld({ progress }) {
  const mountRef = useRef(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");
    scene.fog = new THREE.FogExp2("#000000", 0.028);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mount.appendChild(renderer.domElement);

    const monolithGroup = new THREE.Group();
    scene.add(monolithGroup);

    const leftShape = new THREE.Shape();
    leftShape.moveTo(-0.12, 2.6);
    leftShape.quadraticCurveTo(-0.7, 2.5, -1.45, 2.7);
    leftShape.bezierCurveTo(-1.05, 0.8, -1.05, -0.8, -1.65, -2.7);
    leftShape.quadraticCurveTo(-0.7, -2.5, -0.12, -2.6);
    leftShape.quadraticCurveTo(-0.62, 0.0, -0.12, 2.6);
    leftShape.closePath();

    const rightShape = new THREE.Shape();
    rightShape.moveTo(0.12, 2.6);
    rightShape.quadraticCurveTo(0.7, 2.5, 1.45, 2.7);
    rightShape.bezierCurveTo(1.05, 0.8, 1.05, -0.8, 1.65, -2.7);
    rightShape.quadraticCurveTo(0.7, -2.5, 0.12, -2.6);
    rightShape.quadraticCurveTo(0.62, 0.0, 0.12, 2.6);
    rightShape.closePath();

    const extrudeSettings = {
      depth: 0.7,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    const leftGeo = new THREE.ExtrudeGeometry(leftShape, extrudeSettings);
    const rightGeo = new THREE.ExtrudeGeometry(rightShape, extrudeSettings);
    leftGeo.center();
    rightGeo.center();

    const monolithMaterial = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.25,
      metalness: 0.05,
    });

    const leftMesh = new THREE.Mesh(leftGeo, monolithMaterial);
    const rightMesh = new THREE.Mesh(rightGeo, monolithMaterial);
    leftMesh.position.x = -0.68;
    rightMesh.position.x = 0.68;
    monolithGroup.add(leftMesh);
    monolithGroup.add(rightMesh);

    const haloGeo = new THREE.PlaneGeometry(13, 13);
    const haloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float alpha = smoothstep(0.5, 0.0, dist);
          alpha = pow(alpha, 2.2);
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.85);
        }
      `,
    });

    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0, -0.7);
    monolithGroup.add(haloMesh);

    const coreLight = new THREE.PointLight("#ffffff", 90, 20);
    coreLight.position.set(0, 0, -0.2);
    scene.add(coreLight);

    const ambientLight = new THREE.AmbientLight("#ffffff", 0.45);
    scene.add(ambientLight);

    const particleCount = 2000;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 40;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      particlePositions[i * 3 + 2] = -4 - Math.random() * 50;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMat = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.04,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let smoothProgress = progressRef.current;
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      smoothProgress += (progressRef.current - smoothProgress) * 0.055;
      const p = smoothProgress;

      let camZ;
      let camY;

      if (p <= 0.48) {
        const t = THREE.MathUtils.smoothstep(p, 0.0, 0.48);
        camZ = THREE.MathUtils.lerp(16, 0.0, t);
        camY = THREE.MathUtils.lerp(0.0, 0.0, t);
      } else {
        const t = THREE.MathUtils.smoothstep(p, 0.48, 1.0);
        camZ = THREE.MathUtils.lerp(0.0, -25.0, t);
        camY = THREE.MathUtils.lerp(0.0, 3.0, t);
      }

      const swayX = Math.sin(elapsed * 0.5) * 0.06 * Math.max(0, 1 - p * 2);
      const swayY = Math.cos(elapsed * 0.4) * 0.04 * Math.max(0, 1 - p * 2);

      camera.position.set(swayX, camY + swayY, camZ);
      camera.lookAt(0, camY * 0.8, camZ - 10);

      particles.rotation.z = elapsed * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);

      renderer.dispose();
      leftGeo.dispose();
      rightGeo.dispose();
      monolithMaterial.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none" />;
}
